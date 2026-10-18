import Matter from 'matter-js'
import { IPhysicsPresetDefinition, ForceVectorDisplay, TelemetryMetric } from '../core/types'

/**
 * 1. Galileo Falling Battle (Chân Không vs Có Sức Cản Không Khí)
 */
export const GalileoFallPreset: IPhysicsPresetDefinition = {
  id: 'galileo-fall',
  name: 'Galileo: Chân Không vs Khí Quyển',
  category: 'mechanics',
  description: 'Thả 2 vật từ cùng độ cao: 1 vật trong ống chân không và 1 vật trong không khí chịu lực cản.',
  formulaLatex: 'a_{vac} = g, \\quad a_{air} = g - \\frac{k_{drag}}{m}v^2',
  formulaExplanation: 'Trong chân không, mọi vật rơi cùng gia tốc g bất kể khối lượng hay hình dáng.',
  naturalDurationSec: 2.2,
  defaultParams: {
    dropHeightPercent: 0.2,
    dragCoefficient: 0.04,
    gravityY: 1.0,
    ballRadius: 18,
    featherWidth: 32,
    featherHeight: 12,
  },
  setup: (worldWidth: number, worldHeight: number, params: Record<string, any>) => {
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: params.gravityY || 1.0, scale: 0.001 },
    })

    const startY = worldHeight * (params.dropHeightPercent || 0.2)
    const leftX = worldWidth * 0.28
    const rightX = worldWidth * 0.72

    // Ground
    const ground = Matter.Bodies.rectangle(worldWidth / 2, worldHeight - 15, worldWidth, 30, {
      isStatic: true,
      render: { fillStyle: '#1E293B' } as any,
    })

    // Left Side: In Vacuum (zero air friction)
    const vacuumBody = Matter.Bodies.circle(leftX, startY, params.ballRadius || 18, {
      frictionAir: 0,
      restitution: 0.2,
      density: 0.05,
      label: 'VacuumBall',
      render: {
        fillStyle: '#00F2FE',
        strokeStyle: '#FFFFFF',
        lineWidth: 2,
        trackTrajectory: true,
      } as any,
    })

    // Right Side: In Air Atmosphere (significant air drag)
    const airBody = Matter.Bodies.circle(rightX, startY, params.ballRadius || 18, {
      frictionAir: params.dragCoefficient || 0.04,
      restitution: 0.2,
      density: 0.005,
      label: 'AirFeather',
      render: {
        fillStyle: '#FF6B6B',
        strokeStyle: '#FFFFFF',
        lineWidth: 2,
        trackTrajectory: true,
      } as any,
    })

    // Vertical Divider Line (Glass chamber separator)
    const divider = Matter.Bodies.rectangle(worldWidth / 2, worldHeight / 2, 4, worldHeight, {
      isStatic: true,
      collisionFilter: { mask: 0 },
      render: { fillStyle: 'rgba(255,255,255,0.15)' } as any,
    })

    Matter.Composite.add(engine.world, [ground, divider, vacuumBody, airBody])

    return {
      engine,
      onStep: (_frame: number, timeSec: number) => {
        const vVac = Math.abs(vacuumBody.velocity.y)
        const vAir = Math.abs(airBody.velocity.y)

        const forceVectors: ForceVectorDisplay[] = [
          {
            id: 'vec_g_vac',
            origin: { x: vacuumBody.position.x, y: vacuumBody.position.y },
            vector: { x: 0, y: 40 },
            color: '#00F2FE',
            label: 'P = mg',
          },
          {
            id: 'vec_g_air',
            origin: { x: airBody.position.x, y: airBody.position.y },
            vector: { x: 0, y: 40 },
            color: '#FF6B6B',
            label: 'P = mg',
          },
        ]

        // Drag vector pointing upwards on the right body
        if (vAir > 0.5) {
          forceVectors.push({
            id: 'vec_drag_air',
            origin: { x: airBody.position.x, y: airBody.position.y },
            vector: { x: 0, y: -Math.min(35, vAir * 6) },
            color: '#FFD700',
            label: 'F_cản',
          })
        }

        const telemetry: TelemetryMetric[] = [
          { label: 'v (Chân không)', value: (vVac * 0.1).toFixed(2), unit: 'm/s', color: '#00F2FE' },
          { label: 'v (Không khí)', value: (vAir * 0.1).toFixed(2), unit: 'm/s', color: '#FF6B6B' },
          { label: 'Thời gian t', value: timeSec.toFixed(2), unit: 's' },
        ]

        return {
          forceVectors,
          telemetry,
          annotations: [
            { x: leftX, y: startY - 26, text: 'CHÂN KHÔNG', color: '#00F2FE' },
            { x: rightX, y: startY - 26, text: 'KHÍ QUYỂN', color: '#FF6B6B' },
          ],
        }
      },
    }
  },
}

/**
 * 2. Launch Angle Battle (Đối đầu 3 góc bắn: 30° vs 45° vs 60°)
 */
export const AngleBattlePreset: IPhysicsPresetDefinition = {
  id: 'angle-battle',
  name: 'Đại Chiến: 3 Góc Bắn',
  category: 'kinematics',
  description: 'Bắn 3 quả cầu cùng vận tốc ban đầu v₀ với 3 góc khác nhau để tìm góc có tầm xa lớn nhất.',
  formulaLatex: 'L = \\frac{v_0^2\\sin(2\\alpha)}{g}',
  formulaExplanation: 'Góc 45° luôn đạt tầm xa L_max lớn nhất vì sin(2α) = 1.',
  naturalDurationSec: 3.2,
  defaultParams: {
    launchVelocity: 15,
    ballRadius: 10,
    gravityY: 0.85,
  },
  setup: (worldWidth: number, worldHeight: number, params: Record<string, any>) => {
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: params.gravityY || 0.85, scale: 0.001 },
    })

    const originX = 35
    const originY = worldHeight - 50
    const v0 = params.launchVelocity || 15
    const r = params.ballRadius || 10

    const ground = Matter.Bodies.rectangle(worldWidth / 2, worldHeight - 15, worldWidth, 30, {
      isStatic: true,
      friction: 0.8,
      render: { fillStyle: '#1E293B' } as any,
    })

    const angles = [
      { deg: 30, color: '#00F2FE', label: '30°' },
      { deg: 45, color: '#BEFF01', label: '45° (Max L)' },
      { deg: 60, color: '#FF6B6B', label: '60°' },
    ]

    const balls = angles.map((cfg, idx) => {
      const rad = (cfg.deg * Math.PI) / 180
      const vx = v0 * Math.cos(rad)
      const vy = -v0 * Math.sin(rad)

      const ball = Matter.Bodies.circle(originX, originY - idx * 4, r, {
        density: 0.01,
        frictionAir: 0.001,
        restitution: 0.2,
        label: `Cannon-${cfg.deg}`,
        render: {
          fillStyle: cfg.color,
          strokeStyle: '#FFFFFF',
          lineWidth: 2,
          trackTrajectory: true,
        } as any,
      })

      Matter.Body.setVelocity(ball, { x: vx, y: vy })
      return { body: ball, cfg }
    })

    Matter.Composite.add(engine.world, [ground, ...balls.map(b => b.body)])

    return {
      engine,
      onStep: (_frame: number, timeSec: number) => {
        const telemetry: TelemetryMetric[] = [
          { label: 'L (45°)', value: `${balls[1].body.position.x.toFixed(0)} px`, color: '#BEFF01', highlight: true },
          { label: 'L (30°)', value: `${balls[0].body.position.x.toFixed(0)} px`, color: '#00F2FE' },
          { label: 'L (60°)', value: `${balls[2].body.position.x.toFixed(0)} px`, color: '#FF6B6B' },
          { label: 'Thời gian t', value: timeSec.toFixed(2), unit: 's' },
        ]

        return {
          telemetry,
          annotations: [
            { x: originX + 35, y: originY - 45, text: 'XUẤT PHÁT', color: '#FFFFFF', anchor: 'start' },
          ],
        }
      },
    }
  },
}

/**
 * 3. Friction Ramp Battle (Mặt Dốc Băng Tuyết vs Đá Sỏi)
 */
export const FrictionBattlePreset: IPhysicsPresetDefinition = {
  id: 'friction-battle',
  name: 'Đại Chiến: Băng vs Đá',
  category: 'mechanics',
  description: '2 khối hộp trượt trên 2 máng nghiêng cùng góc: máng băng trơn (μ = 0.02) vs máng đá (μ = 0.35).',
  formulaLatex: 'a = g(\\sin\\alpha - \\mu\\cos\\alpha)',
  formulaExplanation: 'μ càng lớn → F_ms cản càng mạnh → a càng nhỏ',
  naturalDurationSec: 3.5,
  defaultParams: {
    inclineAngleDeg: 32,
    frictionIce: 0.02,
    frictionRough: 0.35,
    boxSize: 30,
  },
  setup: (worldWidth: number, worldHeight: number, params: Record<string, any>) => {
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 1.0, scale: 0.001 },
    })

    const angleDeg = params.inclineAngleDeg || 32
    const angleRad = (angleDeg * Math.PI) / 180
    const muIce = params.frictionIce ?? 0.02
    const muRough = params.frictionRough ?? 0.35

    const rampLength = worldWidth * 0.88
    const rampThickness = 12

    // Top ramp (Ice) positioned at 0.28
    const rampIceY = worldHeight * 0.28
    const rampIce = Matter.Bodies.rectangle(worldWidth * 0.5, rampIceY, rampLength, rampThickness, {
      isStatic: true,
      angle: angleRad,
      friction: muIce,
      render: { fillStyle: '#00F2FE', strokeStyle: '#FFFFFF', lineWidth: 1.5 } as any,
    })

    // Bottom ramp (Rough) positioned at 0.54
    const rampRoughY = worldHeight * 0.54
    const rampRough = Matter.Bodies.rectangle(worldWidth * 0.5, rampRoughY, rampLength, rampThickness, {
      isStatic: true,
      angle: angleRad,
      friction: muRough,
      render: { fillStyle: '#D97706', strokeStyle: '#FDE68A', lineWidth: 1.5 } as any,
    })

    const boxSize = params.boxSize || 30
    const distFromCenter = -rampLength * 0.38
    const offsetPerp = boxSize / 2 + rampThickness / 2 + 2

    // Correct placement on top of the ramp (perpendicular normal points UP and RIGHT)
    const boxIceX = worldWidth * 0.5 + distFromCenter * Math.cos(angleRad) + offsetPerp * Math.sin(angleRad)
    const boxIceY = rampIceY + distFromCenter * Math.sin(angleRad) - offsetPerp * Math.cos(angleRad)
    const boxIce = Matter.Bodies.rectangle(boxIceX, boxIceY, boxSize, boxSize, {
      angle: angleRad,
      friction: muIce,
      restitution: 0.05,
      density: 0.01,
      label: 'BoxIce',
      render: { fillStyle: '#00F2FE', strokeStyle: '#FFFFFF', lineWidth: 2, trackTrajectory: true } as any,
    })

    const boxRoughX = worldWidth * 0.5 + distFromCenter * Math.cos(angleRad) + offsetPerp * Math.sin(angleRad)
    const boxRoughY = rampRoughY + distFromCenter * Math.sin(angleRad) - offsetPerp * Math.cos(angleRad)
    const boxRough = Matter.Bodies.rectangle(boxRoughX, boxRoughY, boxSize, boxSize, {
      angle: angleRad,
      friction: muRough,
      restitution: 0.05,
      density: 0.01,
      label: 'BoxRough',
      render: { fillStyle: '#FF6B6B', strokeStyle: '#FFFFFF', lineWidth: 2, trackTrajectory: true } as any,
    })

    // End Stoppers (Finish Line Bumpers)
    const distStopper = rampLength * 0.44
    const stopIceX = worldWidth * 0.5 + distStopper * Math.cos(angleRad) + 12 * Math.sin(angleRad)
    const stopIceY = rampIceY + distStopper * Math.sin(angleRad) - 12 * Math.cos(angleRad)
    const stopperIce = Matter.Bodies.rectangle(stopIceX, stopIceY, 8, 24, {
      isStatic: true,
      angle: angleRad,
      render: { fillStyle: '#00F2FE' } as any,
    })

    const stopRoughX = worldWidth * 0.5 + distStopper * Math.cos(angleRad) + 12 * Math.sin(angleRad)
    const stopRoughY = rampRoughY + distStopper * Math.sin(angleRad) - 12 * Math.cos(angleRad)
    const stopperRough = Matter.Bodies.rectangle(stopRoughX, stopRoughY, 8, 24, {
      isStatic: true,
      angle: angleRad,
      render: { fillStyle: '#D97706' } as any,
    })

    Matter.Composite.add(engine.world, [rampIce, rampRough, boxIce, boxRough, stopperIce, stopperRough])

    const g = 9.8
    const aIce = Math.max(0, g * (Math.sin(angleRad) - muIce * Math.cos(angleRad)))
    const aRough = Math.max(0, g * (Math.sin(angleRad) - muRough * Math.cos(angleRad)))

    return {
      engine,
      onStep: (_frame: number, timeSec: number) => {
        const vIce = Math.sqrt(boxIce.velocity.x ** 2 + boxIce.velocity.y ** 2)
        const vRough = Math.sqrt(boxRough.velocity.x ** 2 + boxRough.velocity.y ** 2)

        const forceVectors: ForceVectorDisplay[] = []

        // Friction vector pointing up-slope
        const fmsDirX = -Math.cos(angleRad)
        const fmsDirY = -Math.sin(angleRad)

        // Rear edge of the boxes (facing up-slope)
        const halfBox = (params.boxSize || 30) / 2
        const rearIceX = boxIce.position.x + fmsDirX * halfBox
        const rearIceY = boxIce.position.y + fmsDirY * halfBox
        const rearRoughX = boxRough.position.x + fmsDirX * halfBox
        const rearRoughY = boxRough.position.y + fmsDirY * halfBox

        // Vector F_ms on Ice (starts from rear edge, length 18px)
        if (vIce > 0.1) {
          forceVectors.push({
            id: 'vec_fms_ice',
            origin: { x: rearIceX, y: rearIceY },
            vector: { x: fmsDirX * 18, y: fmsDirY * 18 },
            color: '#00F2FE',
            label: 'F_ms nhỏ',
          })
        }

        // Vector F_ms on Rough (starts from rear edge, length 40px)
        if (vRough > 0.1) {
          forceVectors.push({
            id: 'vec_fms_rough',
            origin: { x: rearRoughX, y: rearRoughY },
            vector: { x: fmsDirX * 40, y: fmsDirY * 40 },
            color: '#FFD700',
            label: 'F_ms lớn',
          })
        }

        const telemetry: TelemetryMetric[] = [
          { label: 'a (Băng)', value: aIce.toFixed(2), unit: 'm/s²', color: '#00F2FE', highlight: true },
          { label: 'a (Đá)', value: aRough.toFixed(2), unit: 'm/s²', color: '#FF6B6B' },
          { label: 'v (Băng)', value: (vIce * 0.1).toFixed(2), unit: 'm/s', color: '#00F2FE' },
          { label: 'v (Đá)', value: (vRough * 0.1).toFixed(2), unit: 'm/s', color: '#FF6B6B' },
          { label: 'Thời gian t', value: timeSec.toFixed(2), unit: 's' },
        ]

        // Start point of ramp top edge
        const startX = worldWidth * 0.5 - (rampLength / 2) * Math.cos(angleRad)
        const startIceY = rampIceY - (rampLength / 2) * Math.sin(angleRad)
        const startRoughY = rampRoughY - (rampLength / 2) * Math.sin(angleRad)

        // Perpendicular offset normal (pointing UP and RIGHT away from ramp)
        const normX = Math.sin(angleRad)
        const normY = -Math.cos(angleRad)
        const labelDistAlong = 20
        const labelDistPerp = 26

        const tagIceX = startX + labelDistAlong * Math.cos(angleRad) + labelDistPerp * normX
        const tagIceY = startIceY + labelDistAlong * Math.sin(angleRad) + labelDistPerp * normY

        const tagRoughX = startX + labelDistAlong * Math.cos(angleRad) + labelDistPerp * normX
        const tagRoughY = startRoughY + labelDistAlong * Math.sin(angleRad) + labelDistPerp * normY

        return {
          forceVectors,
          telemetry,
          annotations: [
            { x: tagIceX, y: tagIceY, text: `BĂNG (μ = ${muIce})`, color: '#00F2FE', anchor: 'start' },
            { x: tagRoughX, y: tagRoughY, text: `ĐÁ SỎI (μ = ${muRough})`, color: '#D97706', anchor: 'start' },
          ],
        }
      },
    }
  },
}
