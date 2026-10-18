import Matter from 'matter-js'
import { IPhysicsPresetDefinition, TelemetryMetric, ForceVectorDisplay } from '../core/types'

export const PlanetsGravityPreset: IPhysicsPresetDefinition = {
  id: 'planets-gravity',
  name: 'Đại Chiến Trọng Lực: Mặt Trăng vs Sao Hoả vs Trái Đất vs Sao Mộc',
  category: 'kinematics',
  description: 'Thả rơi cùng lúc 4 quả cầu trong 4 trường trọng lực khác nhau: Mặt Trăng, Sao Hỏa, Trái Đất, Sao Mộc.',
  formulaLatex: 'h(t) = H - \\frac{1}{2}gt^2, \\quad v(t) = gt',
  formulaExplanation: 'Gia tốc trọng trường g tỉ lệ với khối lượng hành tinh M và tỉ lệ nghịch với bán kính bình phương R².',
  naturalDurationSec: 4.5,
  defaultParams: {
    dropHeightPercent: 0.18,
    ballRadius: 14,
  },
  setup: (worldWidth: number, worldHeight: number, params: Record<string, any>) => {
    // Engine with zero global gravity; gravity is applied per planet body individually
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 0, scale: 0 },
    })

    const startY = worldHeight * (params.dropHeightPercent || 0.18)
    const floorY = worldHeight - 25
    const r = params.ballRadius || 14
    const laneCount = 4
    const laneWidth = worldWidth / laneCount

    const planets = [
      { name: 'Mặt Trăng', gVal: 1.62, color: '#94A3B8', icon: 'MOON' },
      { name: 'Sao Hỏa', gVal: 3.72, color: '#F97316', icon: 'MARS' },
      { name: 'Trái Đất', gVal: 9.80, color: '#38BDF8', icon: 'EARTH' },
      { name: 'Sao Mộc', gVal: 24.79, color: '#BEFF01', icon: 'JUPITER' },
    ]

    const ground = Matter.Bodies.rectangle(worldWidth / 2, floorY + 12, worldWidth, 24, {
      isStatic: true,
      restitution: 0.3,
      render: { fillStyle: '#1E293B' } as any,
    })

    const dividers: Matter.Body[] = []
    for (let i = 1; i < laneCount; i++) {
      const divX = i * laneWidth
      dividers.push(
        Matter.Bodies.rectangle(divX, worldHeight / 2, 2, worldHeight, {
          isStatic: true,
          collisionFilter: { mask: 0 },
          render: { fillStyle: 'rgba(255, 255, 255, 0.08)' } as any,
        })
      )
    }

    const balls = planets.map((p, idx) => {
      const posX = idx * laneWidth + laneWidth / 2
      const ball = Matter.Bodies.circle(posX, startY, r, {
        restitution: 0.35,
        frictionAir: 0.0001,
        density: 0.02,
        label: `Ball-${p.name}`,
        render: {
          fillStyle: p.color,
          strokeStyle: '#FFFFFF',
          lineWidth: 2,
          trackTrajectory: true,
        } as any,
      })
      return { body: ball, planet: p, posX }
    })

    Matter.Composite.add(engine.world, [ground, ...dividers, ...balls.map(b => b.body)])

    return {
      engine,
      onStep: (_frame: number, timeSec: number) => {
        const forceVectors: ForceVectorDisplay[] = []

        // Apply distinct gravitational acceleration force F = m * g per planet
        balls.forEach((item) => {
          const b = item.body
          // Convert gVal (m/s²) to screen simulation force scale
          // Earth (9.8) * 0.0002 ≈ 0.00196 force (approx 2x standard Matter.js gravity of 0.001)
          const gSimForce = item.planet.gVal * 0.0002 * b.mass
          Matter.Body.applyForce(b, b.position, { x: 0, y: gSimForce })

          // Add gravity vector indicator
          forceVectors.push({
            id: `vec_g_${item.planet.name}`,
            origin: { x: b.position.x, y: b.position.y },
            vector: { x: 0, y: Math.min(45, item.planet.gVal * 1.6) },
            color: item.planet.color,
            label: `g=${item.planet.gVal}`,
          })
        })

        const telemetry: TelemetryMetric[] = [
          { label: 'Sao Mộc (g=24.8)', value: (balls[3].body.velocity.y * 0.1).toFixed(1), unit: 'm/s', color: '#BEFF01', highlight: true },
          { label: 'Trái Đất (g=9.8)', value: (balls[2].body.velocity.y * 0.1).toFixed(1), unit: 'm/s', color: '#38BDF8' },
          { label: 'Sao Hỏa (g=3.7)', value: (balls[1].body.velocity.y * 0.1).toFixed(1), unit: 'm/s', color: '#F97316' },
          { label: 'Mặt Trăng (g=1.6)', value: (balls[0].body.velocity.y * 0.1).toFixed(1), unit: 'm/s', color: '#94A3B8' },
          { label: 'Thời gian t', value: timeSec.toFixed(2), unit: 's' },
        ]

        const annotations = planets.map((p, idx) => ({
          x: idx * laneWidth + laneWidth / 2,
          y: startY - 26,
          text: `${p.name.toUpperCase()} (${p.gVal}m/s²)`,
          color: p.color,
        }))

        return {
          forceVectors,
          telemetry,
          annotations,
        }
      },
    }
  },
}
