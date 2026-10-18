import Matter from 'matter-js'
import { IPhysicsPresetDefinition, ForceVectorDisplay, TelemetryMetric } from '../core/types'

export const ProjectileMotionPreset: IPhysicsPresetDefinition = {
  id: 'projectile-motion',
  name: 'Chuyển động Ném xiên (Quỹ đạo Parabol)',
  category: 'kinematics',
  description: 'Mô phỏng vật ném xiên với góc bắn alpha, tính tầm bay cao cực đại H_max và tầm xa L.',
  formulaLatex: 'y = x\\tan\\alpha - \\frac{g x^2}{2v_0^2\\cos^2\\alpha}',
  formulaExplanation: 'Quỹ đạo có dạng parabol. Tầm ném xa nhất khi góc bắn alpha = 45 độ.',
  naturalDurationSec: 3.2,
  defaultParams: {
    launchVelocity: 14,
    launchAngleDeg: 55,
    ballRadius: 12,
    gravityY: 0.8,
    ballColor: '#00F2FE',
    cannonColor: '#4A5568',
    showVectors: true,
    showPeakPin: true,
  },
  setup: (worldWidth: number, worldHeight: number, params: Record<string, any>) => {
    const gVal = params.gravityY || 0.8
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: gVal, scale: 0.001 },
    })

    const v0 = params.launchVelocity || 14
    const angleDeg = params.launchAngleDeg || 55
    const angleRad = (angleDeg * Math.PI) / 180
    const radius = params.ballRadius || 12

    const originX = 40
    const originY = worldHeight - 60

    // Ground
    const ground = Matter.Bodies.rectangle(worldWidth / 2, worldHeight - 15, worldWidth, 30, {
      isStatic: true,
      friction: 0.8,
      render: { fillStyle: '#1E293B' } as any,
    })

    // Velocity initial components (in SVG screen coords, y goes down, so negative y is upwards)
    const vx0 = v0 * Math.cos(angleRad)
    const vy0 = -v0 * Math.sin(angleRad)

    // Ball
    const projectile = Matter.Bodies.circle(originX, originY, radius, {
      density: 0.01,
      frictionAir: 0.001,
      restitution: 0.2,
      label: 'Projectile',
      render: {
        fillStyle: params.ballColor || '#00F2FE',
        strokeStyle: '#FFFFFF',
        lineWidth: 2,
        trackTrajectory: true,
      } as any,
    })

    Matter.Body.setVelocity(projectile, { x: vx0, y: vy0 })
    Matter.Composite.add(engine.world, [ground, projectile])

    // Theoretical calculations for H_max and Range L in screen coordinates
    const gPhysics = gVal * 0.58 // Calibration factor for Matter.js engine units
    const hMaxTheoretical = (v0 ** 2 * (Math.sin(angleRad) ** 2)) / (2 * gPhysics)
    const rangeLTheoretical = (v0 ** 2 * Math.sin(2 * angleRad)) / gPhysics
    const peakX = originX + (v0 ** 2 * Math.sin(2 * angleRad)) / (2 * gPhysics)
    const peakY = originY - hMaxTheoretical

    return {
      engine,
      onStep: (_frame: number, timeSec: number) => {
        const vx = projectile.velocity.x
        const vy = projectile.velocity.y
        const speed = Math.sqrt(vx ** 2 + vy ** 2)

        const forceVectors: ForceVectorDisplay[] = []
        if (params.showVectors && speed > 0.3) {
          // Velocity Vector (tangent to trajectory)
          forceVectors.push({
            id: 'v_tan',
            origin: { x: projectile.position.x, y: projectile.position.y },
            vector: { x: vx * 4, y: vy * 4 },
            color: '#BEFF01',
            label: 'v(t)',
            unitValue: `${speed.toFixed(1)} m/s`,
          })

          // vx component (horizontal)
          forceVectors.push({
            id: 'vx_comp',
            origin: { x: projectile.position.x, y: projectile.position.y },
            vector: { x: vx * 4, y: 0 },
            color: '#00D4FF',
            label: 'v_x = v₀·cosα',
          })

          // vy component (vertical)
          forceVectors.push({
            id: 'vy_comp',
            origin: { x: projectile.position.x, y: projectile.position.y },
            vector: { x: 0, y: vy * 4 },
            color: '#FF6B6B',
            label: 'v_y = v₀·sinα - gt',
          })
        }

        const telemetry: TelemetryMetric[] = [
          { label: 'Góc bắn α', value: `${angleDeg}°`, color: '#00F2FE' },
          { label: 'Vận tốc v₀', value: `${v0} m/s`, color: '#BEFF01' },
          { label: 'Tầm cao H_max', value: `${(hMaxTheoretical * 0.1).toFixed(1)} m`, color: '#FFD700', highlight: true },
          { label: 'Tầm xa L', value: `${(rangeLTheoretical * 0.1).toFixed(1)} m`, color: '#FF6B6B' },
          { label: 'Thời gian t', value: timeSec.toFixed(2), unit: 's' },
        ]

        const annotations = [
          {
            x: originX + 25,
            y: originY + 20,
            text: `(0, 0)`,
            color: '#94A3B8',
          },
        ]

        if (params.showPeakPin && peakX < worldWidth - 20) {
          annotations.push({
            x: peakX,
            y: peakY - 14,
            text: `H_max = ${(hMaxTheoretical * 0.1).toFixed(1)}m`,
            color: '#FFD700',
          })
        }

        return {
          forceVectors,
          telemetry,
          annotations,
        }
      },
    }
  },
}
