import Matter from 'matter-js'
import {
  PhysicsWorldSnapshot,
  PhysicsBodyState,
  PhysicsConstraintState,
  IPhysicsPresetDefinition,
  TrajectoryPoint,
  PhysicsCollisionEvent,
  PhysicsQuizHookConfig,
} from './types'

export class MatterSimulationDriver {
  private static snapshotCache = new Map<string, Map<number, PhysicsWorldSnapshot>>()
  private static engineCache = new Map<string, {
    engine: Matter.Engine
    preset: IPhysicsPresetDefinition
    params: Record<string, any>
    currentSimulatedFrame: number
    trajectories: Record<string, TrajectoryPoint[]>
    collisionEvents: PhysicsCollisionEvent[]
    pendingStepCollisions: PhysicsCollisionEvent[]
    onStep?: (frame: number, timeSec: number, engine: Matter.Engine, params: Record<string, any>, timeScale?: number) => any
    timeScale?: number
  }>()

  public static getCacheKey(
    presetId: string,
    width: number,
    height: number,
    fps: number,
    params: Record<string, any>,
    timeScale: number = 1.0
  ): string {
    return `${presetId}_${width}x${height}_fps${fps}_scale${timeScale.toFixed(2)}_${JSON.stringify(params)}`
  }

  /**
   * Calculate effective timeScale for physics simulation based on scene duration and preset natural duration
   */
  public static calculateEffectiveTimeScale(
    config: {
      speedMode?: 'auto-fit' | 'target-time' | 'manual'
      targetFinishSec?: number
      timeScale?: number
      quizHook?: PhysicsQuizHookConfig
    },
    sceneDuration: number = 10.0,
    naturalDuration: number = 3.2
  ): number {
    const mode = config.speedMode || 'auto-fit'

    if (mode === 'manual') {
      return config.timeScale || 1.0
    }

    const freezeDuration = config.quizHook?.enabled ? (config.quizHook.freezeDurationSec || 3.0) : 0

    let targetFinish = sceneDuration - 1.0 // default: finish 1.0s before scene ends
    if (mode === 'target-time' && config.targetFinishSec) {
      targetFinish = Math.min(sceneDuration - 0.5, Math.max(1.5, config.targetFinishSec))
    }

    // Active simulation duration (excluding freeze frame)
    const activeSec = Math.max(1.2, targetFinish - freezeDuration)
    
    // timeScale needed so naturalDuration happens over activeSec
    const calculatedScale = naturalDuration / activeSec
    return Math.max(0.15, Math.min(5.0, calculatedScale))
  }

  public static clearCache(presetId?: string) {
    if (presetId) {
      for (const key of Array.from(this.snapshotCache.keys())) {
        if (key.startsWith(presetId)) {
          this.snapshotCache.delete(key)
          this.engineCache.delete(key)
        }
      }
    } else {
      this.snapshotCache.clear()
      this.engineCache.clear()
    }
  }

  public static getSnapshot(
    preset: IPhysicsPresetDefinition,
    targetFrame: number,
    fps: number = 30,
    width: number = 360,
    height: number = 640,
    params: Record<string, any> = {},
    quizHook?: PhysicsQuizHookConfig,
    timeScale: number = 1.0
  ): PhysicsWorldSnapshot {
    // ── 1. Calculate effective simulation frame with Quiz Freeze Frame warping ──
    let effectiveFrame = targetFrame
    if (quizHook?.enabled) {
      const targetTimeSec = targetFrame / fps
      const freezeAt = quizHook.freezeAtSec || 2.0
      const freezeDuration = quizHook.freezeDurationSec || 3.0

      let simTimeSec = targetTimeSec
      if (targetTimeSec >= freezeAt && targetTimeSec < freezeAt + freezeDuration) {
        simTimeSec = freezeAt
      } else if (targetTimeSec >= freezeAt + freezeDuration) {
        simTimeSec = targetTimeSec - freezeDuration
      }
      effectiveFrame = Math.max(0, Math.round(simTimeSec * fps))
    }

    const mergedParams = { ...preset.defaultParams, ...params }
    const cacheKey = this.getCacheKey(preset.id, width, height, fps, mergedParams, timeScale)

    let framesMap = this.snapshotCache.get(cacheKey)
    if (!framesMap) {
      framesMap = new Map<number, PhysicsWorldSnapshot>()
      this.snapshotCache.set(cacheKey, framesMap)
    }

    // Check if effective target frame is already computed
    if (framesMap.has(effectiveFrame)) {
      return framesMap.get(effectiveFrame)!
    }

    // Check existing engine or initialize a new simulation instance
    let engineState = this.engineCache.get(cacheKey)
    if (!engineState || engineState.currentSimulatedFrame > effectiveFrame) {
      // Re-initialize from scratch
      const setupResult = preset.setup(width, height, mergedParams)
      const engine = setupResult.engine

      const pendingCollisions: PhysicsCollisionEvent[] = []
      const allCollisions: PhysicsCollisionEvent[] = []

      // Setup collision listener to record mechanical SFX triggers
      Matter.Events.on(engine, 'collisionStart', (event: any) => {
        const pairs = event.pairs || []
        pairs.forEach((pair: any) => {
          const bA = pair.bodyA
          const bB = pair.bodyB
          const relVx = (bA.velocity?.x || 0) - (bB.velocity?.x || 0)
          const relVy = (bA.velocity?.y || 0) - (bB.velocity?.y || 0)
          const relSpeed = Math.sqrt(relVx * relVx + relVy * relVy)

          if (relSpeed > 0.35) {
            let sfxType: 'click' | 'pop' | 'thud' | 'whoosh' = 'pop'
            const isNewtonBall =
              (bA.label && bA.label.startsWith('Ball')) ||
              (bB.label && bB.label.startsWith('Ball'))

            if (isNewtonBall) {
              sfxType = 'click'
            } else if (bA.isStatic || bB.isStatic) {
              sfxType = relSpeed > 4 ? 'thud' : 'pop'
            }

            const curFrame = engineState ? engineState.currentSimulatedFrame : 0
            const evt: PhysicsCollisionEvent = {
              frame: curFrame,
              timeSec: curFrame / fps,
              bodyIdA: bA.id,
              bodyIdB: bB.id,
              impulse: relSpeed,
              sfxType,
              volume: Math.min(1.0, Math.max(0.2, relSpeed / 8)),
            }
            pendingCollisions.push(evt)
            allCollisions.push(evt)
          }
        })
      })

      engineState = {
        engine,
        preset,
        params: mergedParams,
        currentSimulatedFrame: 0,
        trajectories: {},
        collisionEvents: allCollisions,
        pendingStepCollisions: pendingCollisions,
        onStep: setupResult.onStep,
        timeScale: timeScale || 1.0,
      }
      this.engineCache.set(cacheKey, engineState)

      // Save initial frame 0 snapshot
      const frame0Snapshot = this.captureSnapshot(0, 0, engineState)
      framesMap.set(0, frame0Snapshot)
    }

    const dtMs = (1000 / fps) * (timeScale || 1.0)

    // Step the simulation sequentially up to effectiveFrame
    while (engineState.currentSimulatedFrame < effectiveFrame) {
      const nextFrame = engineState.currentSimulatedFrame + 1
      const timeSec = nextFrame / fps

      // Clear step collisions buffer before stepping
      engineState.pendingStepCollisions.length = 0

      // Update currentSimulatedFrame so collision listener records the exact nextFrame
      engineState.currentSimulatedFrame = nextFrame

      // Fixed-timestep deterministic update
      Matter.Engine.update(engineState.engine, dtMs)

      const snapshot = this.captureSnapshot(nextFrame, timeSec, engineState)
      framesMap.set(nextFrame, snapshot)
    }

    return framesMap.get(effectiveFrame) || this.captureSnapshot(effectiveFrame, effectiveFrame / fps, engineState)
  }

  /**
   * Pre-simulate and retrieve all collision sound events across a full timeline duration
   */
  public static getAllCollisionEvents(
    preset: IPhysicsPresetDefinition,
    totalFrames: number,
    fps: number = 30,
    width: number = 360,
    height: number = 640,
    params: Record<string, any> = {},
    timeScale: number = 1.0
  ): PhysicsCollisionEvent[] {
    // Run stepping up to totalFrames to ensure all collisions are discovered
    this.getSnapshot(preset, totalFrames, fps, width, height, params, undefined, timeScale)
    const mergedParams = { ...preset.defaultParams, ...params }
    const cacheKey = this.getCacheKey(preset.id, width, height, fps, mergedParams, timeScale)
    const engineState = this.engineCache.get(cacheKey)
    return engineState ? [...engineState.collisionEvents] : []
  }

  private static captureSnapshot(
    frame: number,
    timeSec: number,
    state: {
      engine: Matter.Engine
      params: Record<string, any>
      trajectories: Record<string, TrajectoryPoint[]>
      collisionEvents: PhysicsCollisionEvent[]
      pendingStepCollisions: PhysicsCollisionEvent[]
      onStep?: (frame: number, timeSec: number, engine: Matter.Engine, params: Record<string, any>, timeScale?: number) => any
      timeScale?: number
    }
  ): PhysicsWorldSnapshot {
    // 1. Run onStep FIRST so analytical presets (e.g. harmonic oscillators) can update body positions before capturing!
    let customStepData: any = {}
    if (state.onStep) {
      customStepData = state.onStep(frame, timeSec, state.engine, state.params, state.timeScale || 1.0) || {}
    }

    const world = state.engine.world
    const allBodies = Matter.Composite.allBodies(world)
    const allConstraints = Matter.Composite.allConstraints(world)

    const bodies: PhysicsBodyState[] = allBodies.map((b) => {
      const isStatic = b.isStatic
      const radius = (b as any).circleRadius
      const shape = radius ? 'circle' : (b.vertices && b.vertices.length > 4 ? 'polygon' : 'rectangle')

      const bId = String(b.id)
      if (!isStatic && (b as any).render?.trackTrajectory !== false) {
        if (!state.trajectories[bId]) {
          state.trajectories[bId] = []
        }
        state.trajectories[bId].push({
          x: b.position.x,
          y: b.position.y,
          frame,
          timeSec,
        })
        if (state.trajectories[bId].length > 150) {
          state.trajectories[bId].shift()
        }
      }

      return {
        id: b.id,
        label: b.label,
        shape,
        position: { x: b.position.x, y: b.position.y },
        angle: b.angle,
        velocity: { x: b.velocity.x, y: b.velocity.y },
        angularVelocity: b.angularVelocity,
        radius,
        width: (b as any).bounds ? b.bounds.max.x - b.bounds.min.x : undefined,
        height: (b as any).bounds ? b.bounds.max.y - b.bounds.min.y : undefined,
        vertices: b.vertices ? b.vertices.map(v => ({ x: v.x, y: v.y })) : undefined,
        fill: (b as any).render?.fillStyle || ((b as any).customColor || '#BEFF01'),
        stroke: (b as any).render?.strokeStyle || '#ffffff',
        strokeWidth: (b as any).render?.lineWidth || 1.5,
        isStatic,
        restitution: b.restitution,
        friction: b.friction,
        mass: b.mass,
        customData: (b as any).customData || {},
      }
    })

    const constraints: PhysicsConstraintState[] = allConstraints.map((c) => {
      const posA = c.bodyA ? { x: c.bodyA.position.x + (c.pointA?.x || 0), y: c.bodyA.position.y + (c.pointA?.y || 0) } : { x: c.pointA.x, y: c.pointA.y }
      const posB = c.bodyB ? { x: c.bodyB.position.x + (c.pointB?.x || 0), y: c.bodyB.position.y + (c.pointB?.y || 0) } : { x: c.pointB.x, y: c.pointB.y }

      return {
        id: c.id,
        label: c.label,
        pointA: posA,
        pointB: posB,
        bodyAPosition: c.bodyA ? { x: c.bodyA.position.x, y: c.bodyA.position.y } : undefined,
        bodyBPosition: c.bodyB ? { x: c.bodyB.position.x, y: c.bodyB.position.y } : undefined,
        length: c.length,
        stiffness: c.stiffness,
        damping: c.damping,
        stroke: (c as any).render?.strokeStyle || 'rgba(255,255,255,0.4)',
        strokeWidth: (c as any).render?.lineWidth || 2,
        isSpring: (c as any).isSpring || false,
      }
    })

    const trajectoriesClone: Record<string, TrajectoryPoint[]> = {}
    for (const [key, pts] of Object.entries(state.trajectories)) {
      trajectoriesClone[key] = [...pts]
    }

    return {
      frame,
      timeSec,
      bodies,
      constraints,
      forceVectors: customStepData.forceVectors || [],
      trajectories: trajectoriesClone,
      telemetry: customStepData.telemetry || [],
      liveChart: customStepData.liveChart,
      collisionEvents: [...state.pendingStepCollisions],
      annotations: customStepData.annotations || [],
    }
  }
}
