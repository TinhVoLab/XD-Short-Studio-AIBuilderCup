import {
  AlgorithmTraceStep,
  IAlgorithmDefinition,
  InitialArrayType,
  AlgorithmQuizConfig,
} from './types'

export class AlgorithmTraceDriver {
  private static traceCache = new Map<string, AlgorithmTraceStep[]>()

  /**
   * Deterministic PRNG (Mulberry32)
   */
  public static seededRandom(seed: number): () => number {
    let s = seed | 0
    return () => {
      s = (s + 0x6d2b79f5) | 0
      let t = Math.imul(s ^ (s >>> 15), 1 | s)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  }

  /**
   * Generate initial array based on type and seed
   */
  public static generateInitialArray(size: number, type: InitialArrayType = 'random', seed: number = 42): number[] {
    const arr: number[] = []
    for (let i = 1; i <= size; i++) {
      arr.push(i)
    }

    if (type === 'reversed') {
      return arr.reverse()
    }

    if (type === 'nearly-sorted') {
      const rng = this.seededRandom(seed)
      const swaps = Math.max(1, Math.floor(size * 0.1))
      for (let s = 0; s < swaps; s++) {
        const i = Math.floor(rng() * size)
        const j = Math.floor(rng() * size)
        const temp = arr[i]
        arr[i] = arr[j]
        arr[j] = temp
      }
      return arr
    }

    // Random shuffle (Fisher-Yates with seeded PRNG)
    const rng = this.seededRandom(seed)
    for (let i = size - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1))
      const temp = arr[i]
      arr[i] = arr[j]
      arr[j] = temp
    }
    return arr
  }

  /**
   * Get cached trace or compute and cache a complete execution trace
   */
  public static getTrace(
    algo: IAlgorithmDefinition,
    arraySize: number = 24,
    initialType: InitialArrayType = 'random',
    seed: number = 42
  ): AlgorithmTraceStep[] {
    const cacheKey = `${algo.id}_${arraySize}_${initialType}_${seed}`
    const existing = this.traceCache.get(cacheKey)
    if (existing) return existing

    const initialArr = this.generateInitialArray(arraySize, initialType, seed)
    const rawSteps = algo.generateTrace([...initialArr])

    // Append Final Victory Sweep (Sweep green from left to right with ascending pitches)
    const finalValues = rawSteps.length > 0 ? [...rawSteps[rawSteps.length - 1].valuesSnapshot] : [...initialArr]
    const lastMetrics = rawSteps.length > 0 ? { ...rawSteps[rawSteps.length - 1].metrics } : { comparisons: 0, swaps: 0 }

    const sweepSteps: AlgorithmTraceStep[] = []
    for (let i = 0; i < arraySize; i++) {
      sweepSteps.push({
        type: 'sorted',
        indices: [i],
        valuesSnapshot: [...finalValues],
        metrics: lastMetrics,
        soundPitch: (i + 1) / arraySize,
      })
    }

    const completeTrace = [...rawSteps, ...sweepSteps]
    this.traceCache.set(cacheKey, completeTrace)
    return completeTrace
  }

  /**
   * Calculate effective speed multiplier based on scene duration and speedMode
   */
  public static calculateEffectiveSpeed(
    config: {
      speedMode?: 'auto-fit' | 'target-time' | 'manual'
      targetFinishSec?: number
      speedMultiplier?: number
      quizHook?: AlgorithmQuizConfig
    },
    sceneDuration: number = 10.0,
    maxTraceSteps: number = 200,
    fps: number = 30
  ): number {
    const mode = config.speedMode || 'auto-fit'

    if (mode === 'manual') {
      return config.speedMultiplier || 1.0
    }

    const freezeDuration = config.quizHook?.enabled ? (config.quizHook.freezeDurationSec || 3.5) : 0

    let targetFinish = sceneDuration - 1.0 // default: finish 1.0s before scene ends
    if (mode === 'target-time' && config.targetFinishSec) {
      targetFinish = Math.min(sceneDuration - 0.5, Math.max(1.5, config.targetFinishSec))
    }

    // Active simulation duration (excluding freeze pause)
    const activeSec = Math.max(1.2, targetFinish - freezeDuration)
    const activeFrames = activeSec * fps
    const stepsPerFrame = maxTraceSteps / activeFrames

    // At speedMultiplier 1.0, stepsPerFrame is 1.8
    const calculatedMultiplier = stepsPerFrame / 1.8
    // Clamped between 0.2x and 8.0x for safety
    return Math.max(0.2, Math.min(8.0, calculatedMultiplier))
  }

  /**
   * Calculate current step at a specific video frame, taking into account Quiz Freeze Frame & Speed Ramp
   */
  public static getStepAtFrame(
    trace: AlgorithmTraceStep[],
    frame: number,
    fps: number = 30,
    speedMultiplier: number = 1.0,
    quizHook?: AlgorithmQuizConfig,
    speedRamp: boolean = false,
    sceneDuration: number = 10.0
  ): {
    step: AlgorithmTraceStep
    stepIndex: number
    isFinished: boolean
    progress: number
  } {
    if (!trace || trace.length === 0) {
      return {
        step: { type: 'idle', indices: [], valuesSnapshot: [], metrics: { comparisons: 0, swaps: 0 } },
        stepIndex: 0,
        isFinished: true,
        progress: 1,
      }
    }

    // Time-Warping if Quiz Hook is enabled
    let effectiveFrame = frame
    if (quizHook?.enabled) {
      const targetTimeSec = frame / fps
      const freezeAt = quizHook.freezeAtSec || 2.0
      const freezeDuration = quizHook.freezeDurationSec || 3.5

      let simTimeSec = targetTimeSec
      if (targetTimeSec >= freezeAt && targetTimeSec < freezeAt + freezeDuration) {
        simTimeSec = freezeAt
      } else if (targetTimeSec >= freezeAt + freezeDuration) {
        simTimeSec = targetTimeSec - freezeDuration
      }
      effectiveFrame = Math.max(0, Math.round(simTimeSec * fps))
    }

    let rawStepIndex: number

    if (speedRamp) {
      // Speed Ramping: Start gently (0.6x), then accelerate nonlinearly towards the finish line
      const freezeDuration = quizHook?.enabled ? (quizHook.freezeDurationSec || 3.5) : 0
      const activeSec = Math.max(1.5, (sceneDuration - 1.0) - freezeDuration)
      const totalActiveFrames = activeSec * fps
      const normalizedTime = Math.min(1.0, Math.max(0, effectiveFrame / totalActiveFrames))
      
      // Quadratic-exponential ease curve: u^1.45 (slow start, explosive sprint finish)
      const rampedProgress = Math.pow(normalizedTime, 1.45)
      rawStepIndex = Math.floor(rampedProgress * (trace.length - 1))
    } else {
      // Linear execution
      const stepsPerFrame = Math.max(0.3, speedMultiplier * 1.8)
      rawStepIndex = Math.floor(effectiveFrame * stepsPerFrame)
    }

    const stepIndex = Math.min(trace.length - 1, rawStepIndex)
    const isFinished = rawStepIndex >= trace.length - 1
    const progress = Math.min(1.0, rawStepIndex / (trace.length - 1))

    return {
      step: trace[stepIndex],
      stepIndex,
      isFinished,
      progress,
    }
  }

  public static clearCache() {
    this.traceCache.clear()
  }
}
