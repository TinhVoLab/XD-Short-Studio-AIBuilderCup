import Matter from 'matter-js'
import { IPhysicsPresetDefinition, TelemetryMetric } from '../core/types'

export const BrachistochronePreset: IPhysicsPresetDefinition = {
  id: 'brachistochrone-race',
  name: 'Nghịch Lý Brachistochrone: Đường Dốc Nhanh Nhất',
  category: 'mechanics',
  description: 'Thả 3 quả cầu từ cùng điểm A đến B qua 3 đường: Xycloit, Đường thẳng, và Cung tròn.',
  formulaLatex: 'T = \\int_A^B \\frac{ds}{\\sqrt{2gy}}',
  formulaExplanation: 'Đường Xycloit dốc đứng ban đầu giúp vật đạt gia tốc cực lớn.',
  naturalDurationSec: 3.2,
  defaultParams: {
    gravityY: 1.2,
    ballRadius: 10,
    friction: 0.001,
  },
  setup: (worldWidth: number, worldHeight: number, params: Record<string, any>) => {
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: params.gravityY || 1.2, scale: 0.001 },
      positionIterations: 10,
      velocityIterations: 10,
    })

    const startX = 50
    const startY = 160
    
    // Exact 1:1 bounding box for perfect circle arc and exact cycloid solving
    const deltaX = 260
    const deltaY = 260
    const endX = startX + deltaX
    const endY = startY + deltaY

    const r = params.ballRadius || 10
    const segments = 32
    const thickness = 6

    const worldBodies: Matter.Body[] = []

    // ── Helper: build static segmented curved track ──
    const buildTrack = (
      points: Array<{ x: number; y: number }>,
      categoryMask: number,
      strokeColor: string
    ) => {
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i]
        const p2 = points[i + 1]
        const midX = (p1.x + p2.x) / 2
        const midY = (p1.y + p2.y) / 2
        const dx = p2.x - p1.x
        const dy = p2.y - p1.y
        const segLen = Math.sqrt(dx * dx + dy * dy) + 1.5
        const angle = Math.atan2(dy, dx)

        const seg = Matter.Bodies.rectangle(midX, midY, segLen, thickness, {
          isStatic: true,
          angle,
          friction: params.friction || 0.001,
          restitution: 0.05,
          collisionFilter: {
            category: categoryMask,
            mask: categoryMask,
          },
          render: {
            fillStyle: strokeColor,
            strokeStyle: strokeColor,
            lineWidth: 1,
          } as any,
        })
        worldBodies.push(seg)
      }
    }

    // ── 1. Track Cycloid (Brachistochrone - True Mathematical Curve) ──
    // For deltaX = deltaY, thetaEnd ≈ 2.4120, R ≈ deltaY / 1.7459
    const thetaEnd = 2.412
    const R_cyc = deltaY / (1 - Math.cos(thetaEnd))
    const cycloidPts: Array<{ x: number; y: number }> = []

    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * thetaEnd
      const px = startX + R_cyc * (t - Math.sin(t))
      const py = startY + R_cyc * (1 - Math.cos(t))
      cycloidPts.push({ x: px, y: py })
    }
    buildTrack(cycloidPts, 0x0002, '#BEFF01')

    // ── 2. Track Straight Line ──
    const straightPts: Array<{ x: number; y: number }> = []
    for (let i = 0; i <= segments; i++) {
      const frac = i / segments
      straightPts.push({
        x: startX + deltaX * frac,
        y: startY + deltaY * frac,
      })
    }
    buildTrack(straightPts, 0x0004, '#00D4FF')

    // ── 3. Track Circular Arc (Quarter Circle) ──
    // Circle centered at (startX, startY + deltaY) with radius = deltaX
    const arcPts: Array<{ x: number; y: number }> = []
    for (let i = 0; i <= segments; i++) {
      const frac = i / segments
      const px = deltaX * frac
      const py = deltaY - Math.sqrt(deltaX * deltaX - px * px)
      arcPts.push({
        x: startX + px,
        y: startY + py,
      })
    }
    buildTrack(arcPts, 0x0008, '#FF6B6B')

    // ── Balls on each track (Independent collision layers) ──
    // Ball 1: Cycloid (Winner)
    const ballCycloid = Matter.Bodies.circle(startX + 2, startY - r - 2, r, {
      friction: 0.001,
      frictionAir: 0.0002,
      restitution: 0.1,
      density: 0.02,
      label: 'BallCycloid',
      collisionFilter: { category: 0x0002, mask: 0x0002 },
      render: { fillStyle: '#BEFF01', strokeStyle: '#FFFFFF', lineWidth: 2, trackTrajectory: true } as any,
    })

    // Ball 2: Straight
    const ballStraight = Matter.Bodies.circle(startX + 2, startY - r - 2, r, {
      friction: 0.001,
      frictionAir: 0.0002,
      restitution: 0.1,
      density: 0.02,
      label: 'BallStraight',
      collisionFilter: { category: 0x0004, mask: 0x0004 },
      render: { fillStyle: '#00D4FF', strokeStyle: '#FFFFFF', lineWidth: 2, trackTrajectory: true } as any,
    })

    // Ball 3: Arc
    const ballArc = Matter.Bodies.circle(startX + 2, startY - r - 2, r, {
      friction: 0.001,
      frictionAir: 0.0002,
      restitution: 0.1,
      density: 0.02,
      label: 'BallArc',
      collisionFilter: { category: 0x0008, mask: 0x0008 },
      render: { fillStyle: '#FF6B6B', strokeStyle: '#FFFFFF', lineWidth: 2, trackTrajectory: true } as any,
    })

    // Finish Line Bumper (Stoppers)
    const finishX = endX + 8
    const finishStopper = Matter.Bodies.rectangle(finishX, endY - 10, 8, 40, {
      isStatic: true,
      collisionFilter: { category: 0x000e, mask: 0x000e },
      render: { fillStyle: '#FFFFFF' } as any,
    })

    worldBodies.push(ballCycloid, ballStraight, ballArc, finishStopper)
    Matter.Composite.add(engine.world, worldBodies)

    let finishTimeCycloid: number | null = null
    let finishTimeStraight: number | null = null
    let finishTimeArc: number | null = null

    return {
      engine,
      onStep: (_frame: number, timeSec: number) => {
        if (ballCycloid.position.x >= endX - 8 && finishTimeCycloid === null) {
          finishTimeCycloid = timeSec
        }
        if (ballStraight.position.x >= endX - 8 && finishTimeStraight === null) {
          finishTimeStraight = timeSec
        }
        if (ballArc.position.x >= endX - 8 && finishTimeArc === null) {
          finishTimeArc = timeSec
        }

        const vCyc = Math.sqrt(ballCycloid.velocity.x ** 2 + ballCycloid.velocity.y ** 2)
        const vStr = Math.sqrt(ballStraight.velocity.x ** 2 + ballStraight.velocity.y ** 2)
        const vArc = Math.sqrt(ballArc.velocity.x ** 2 + ballArc.velocity.y ** 2)

        const telemetry: TelemetryMetric[] = [
          {
            label: 'Xycloit (T_min)',
            value: finishTimeCycloid ? `${finishTimeCycloid.toFixed(2)}s (HẠNG 1)` : `${(vCyc * 0.1).toFixed(1)} m/s`,
            color: '#BEFF01',
            highlight: true,
          },
          {
            label: 'Cung tròn',
            value: finishTimeArc ? `${finishTimeArc.toFixed(2)}s` : `${(vArc * 0.1).toFixed(1)} m/s`,
            color: '#FF6B6B',
          },
          {
            label: 'Đường thẳng (Ngắn nhất)',
            value: finishTimeStraight ? `${finishTimeStraight.toFixed(2)}s` : `${(vStr * 0.1).toFixed(1)} m/s`,
            color: '#00D4FF',
          },
          { label: 'Thời gian t', value: timeSec.toFixed(2), unit: 's' },
        ]

        return {
          telemetry,
          annotations: [
            { x: startX + 30, y: startY - 24, text: 'ĐIỂM XUẤT PHÁT (A)', color: '#FFFFFF' },
            { x: finishX - 10, y: endY + 28, text: 'VẠCH ĐÍCH (B)', color: '#BEFF01' },
          ],
        }
      },
    }
  },
}
