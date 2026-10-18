import Matter from 'matter-js'
import { IPhysicsPresetDefinition, ForceVectorDisplay, TelemetryMetric } from '../core/types'

export const NewtonCradlePreset: IPhysicsPresetDefinition = {
  id: 'newton-cradle',
  name: 'Con lắc Newton (Bảo toàn Động lượng)',
  category: 'mechanics',
  description: 'Mô phỏng 5 quả cầu thép va chạm đàn hồi truyền xung lượng và bảo toàn cơ năng.',
  formulaLatex: '\\sum \\vec{p} = \\text{const}',
  formulaExplanation: 'Động lượng được bảo toàn tuyệt đối trong va chạm đàn hồi.',
  naturalDurationSec: 5.0,
  defaultParams: {
    ballCount: 5,
    ballRadius: 16,
    stringLength: 140,
    restitution: 0.99,
    liftCount: 1,
    liftAngleDeg: 45,
    ballColor: '#00F2FE',
    accentColor: '#BEFF01',
    showVectors: true,
  },
  setup: (worldWidth: number, worldHeight: number, params: Record<string, any>) => {
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 1.2, scale: 0.001 },
      positionIterations: 10,
      velocityIterations: 10,
    })

    const ballCount = params.ballCount || 5
    const radius = params.ballRadius || 16
    const stringLength = params.stringLength || 140
    const restitution = params.restitution ?? 0.99
    const liftCount = params.liftCount || 1
    const liftAngleDeg = params.liftAngleDeg || 45
    const liftAngleRad = (liftAngleDeg * Math.PI) / 180

    const centerX = worldWidth / 2
    const topY = worldHeight * 0.22
    const totalSpan = (ballCount - 1) * radius * 2
    const startX = centerX - totalSpan / 2

    const balls: Matter.Body[] = []

    for (let i = 0; i < ballCount; i++) {
      const anchorX = startX + i * radius * 2
      const anchorY = topY

      let ballX = anchorX
      let ballY = anchorY + stringLength

      // If this ball is among the lifted ones on the left
      if (i < liftCount) {
        ballX = anchorX - stringLength * Math.sin(liftAngleRad)
        ballY = anchorY + stringLength * Math.cos(liftAngleRad)
      }

      const isLifted = i < liftCount
      const ball = Matter.Bodies.circle(ballX, ballY, radius, {
        restitution,
        friction: 0.001,
        frictionAir: 0.0005,
        slop: 0,
        inertia: Infinity, // Prevent ball spin to ensure clean 1D impact
        density: 0.05,
        label: `Ball-${i + 1}`,
        render: {
          fillStyle: isLifted ? params.accentColor || '#BEFF01' : (i === ballCount - 1 ? '#4FACFE' : '#2D3748'),
          strokeStyle: isLifted ? '#ffffff' : '#4FACFE',
          lineWidth: 2,
        } as any,
      })

      const constraint = Matter.Constraint.create({
        pointA: { x: anchorX, y: anchorY },
        bodyB: ball,
        stiffness: 1.0,
        length: stringLength,
        render: {
          strokeStyle: 'rgba(255, 255, 255, 0.4)',
          lineWidth: 1.5,
        } as any,
      })

      balls.push(ball)
      Matter.Composite.add(engine.world, [ball, constraint])
    }

    return {
      engine,
      onStep: (_frame: number, timeSec: number) => {
        const firstBall = balls[0]
        const lastBall = balls[ballCount - 1]

        const v1 = Math.sqrt(firstBall.velocity.x ** 2 + firstBall.velocity.y ** 2)
        const vn = Math.sqrt(lastBall.velocity.x ** 2 + lastBall.velocity.y ** 2)

        // Kinetic Energy = 0.5 * m * v^2
        const mass = firstBall.mass
        let totalKinetic = 0
        let totalPotential = 0
        const g = 9.8

        balls.forEach((b) => {
          const vSq = b.velocity.x ** 2 + b.velocity.y ** 2
          totalKinetic += 0.5 * mass * vSq
          const h = Math.max(0, (topY + stringLength - b.position.y) * 0.05)
          totalPotential += mass * g * h
        })

        const totalEnergy = totalKinetic + totalPotential

        const forceVectors: ForceVectorDisplay[] = []
        if (params.showVectors) {
          // Velocity vector on first & last ball
          if (v1 > 0.2) {
            forceVectors.push({
              id: 'v1_vec',
              origin: { x: firstBall.position.x, y: firstBall.position.y },
              vector: { x: firstBall.velocity.x * 8, y: firstBall.velocity.y * 8 },
              color: '#BEFF01',
              label: 'v₁',
            })
          }
          if (vn > 0.2) {
            forceVectors.push({
              id: 'vn_vec',
              origin: { x: lastBall.position.x, y: lastBall.position.y },
              vector: { x: lastBall.velocity.x * 8, y: lastBall.velocity.y * 8 },
              color: '#00F2FE',
              label: `v${ballCount}`,
            })
          }
        }

        const telemetry: TelemetryMetric[] = [
          { label: 'Thời gian t', value: timeSec.toFixed(2), unit: 's' },
          { label: 'Vận tốc v₁', value: (v1 * 0.1).toFixed(2), unit: 'm/s', color: '#BEFF01' },
          { label: `Vận tốc v${ballCount}`, value: (vn * 0.1).toFixed(2), unit: 'm/s', color: '#00F2FE' },
          { label: 'Động năng E_k', value: totalKinetic.toFixed(1), unit: 'J', color: '#FFD700' },
          { label: 'Cơ năng E_total', value: totalEnergy.toFixed(1), unit: 'J', highlight: true },
        ]

        return {
          forceVectors,
          telemetry,
          annotations: [
            {
              x: centerX,
              y: topY - 20,
              text: 'BẢO TOÀN ĐỘNG LƯỢNG: ∑p_trước = ∑p_sau',
              color: '#BEFF01',
            }
          ]
        }
      },
    }
  },
}
