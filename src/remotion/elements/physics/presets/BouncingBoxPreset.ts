import Matter from 'matter-js'
import { IPhysicsPresetDefinition, TelemetryMetric } from '../core/types'

// Deterministic pseudo-random number generator for 100% reproducible physics frames
function seededRandom(seed: number) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

export const BouncingBoxPreset: IPhysicsPresetDefinition = {
  id: 'bouncing-box-viral',
  name: 'Hộp Hạt Hỗn Loạn (Động Học Khí & Entropy)',
  category: 'viral',
  description: 'Mô phỏng chuyển động nhiệt hỗn loạn của các phân tử khí trong lồng kín với va chạm đàn hồi.',
  formulaLatex: 'P = \\frac{2}{3} n \\bar{E}_k, \\quad \\bar{E}_k = \\frac{3}{2} k_B T',
  formulaExplanation: 'Thuyết động học phân tử: các hạt chuyển động hỗn loạn va chạm thành bình tạo ra áp suất P.',
  defaultParams: {
    ballCount: 20,
    ballRadius: 10,
    restitution: 0.98,
    gravityY: 0.5,
    hasSpinner: true,
    spinnerSpeed: 0.05,
    neonTheme: true,
  },
  naturalDurationSec: 6.0,
  setup: (worldWidth: number, worldHeight: number, params: Record<string, any>) => {
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: params.gravityY || 0.5, scale: 0.001 },
      positionIterations: 8,
      velocityIterations: 8,
    })

    const wallThickness = 28
    const boxW = worldWidth * 0.88
    const boxH = worldHeight * 0.70
    const boxCenterX = worldWidth / 2
    const boxCenterY = worldHeight * 0.48

    // ── 1. Thick Overlapping Leak-Proof Enclosure Walls ──
    // Top and bottom walls extend by wallThickness * 2 to seal diagonal corner joints completely
    const topWall = Matter.Bodies.rectangle(boxCenterX, boxCenterY - boxH / 2, boxW + wallThickness * 2, wallThickness, {
      isStatic: true,
      restitution: 1.0,
      friction: 0.001,
      render: { fillStyle: '#1E293B', strokeStyle: '#38BDF8', lineWidth: 2 } as any,
    })
    const bottomWall = Matter.Bodies.rectangle(boxCenterX, boxCenterY + boxH / 2, boxW + wallThickness * 2, wallThickness, {
      isStatic: true,
      restitution: 1.0,
      friction: 0.001,
      render: { fillStyle: '#1E293B', strokeStyle: '#38BDF8', lineWidth: 2 } as any,
    })
    const leftWall = Matter.Bodies.rectangle(boxCenterX - boxW / 2, boxCenterY, wallThickness, boxH, {
      isStatic: true,
      restitution: 1.0,
      friction: 0.001,
      render: { fillStyle: '#1E293B', strokeStyle: '#38BDF8', lineWidth: 2 } as any,
    })
    const rightWall = Matter.Bodies.rectangle(boxCenterX + boxW / 2, boxCenterY, wallThickness, boxH, {
      isStatic: true,
      restitution: 1.0,
      friction: 0.001,
      render: { fillStyle: '#1E293B', strokeStyle: '#38BDF8', lineWidth: 2 } as any,
    })

    const worldBodies: Matter.Body[] = [topWall, bottomWall, leftWall, rightWall]

    // ── 2. Rotating Spinner in Center (Impulse Flipper) ──
    let spinner: Matter.Body | null = null
    if (params.hasSpinner) {
      spinner = Matter.Bodies.rectangle(boxCenterX, boxCenterY, 95, 14, {
        isStatic: true,
        restitution: 1.0,
        friction: 0.05,
        render: { fillStyle: '#BEFF01', strokeStyle: '#FFFFFF', lineWidth: 2 } as any,
      })
      worldBodies.push(spinner)
    }

    // ── 3. Deterministic Pseudo-Random Particle Generation ──
    const ballColors = ['#BEFF01', '#00F2FE', '#FF6B6B', '#FFD700', '#A855F7', '#EC4899', '#4ADE80']
    const ballCount = params.ballCount || 20
    const ballRadius = params.ballRadius || 10
    const restitution = params.restitution ?? 0.98

    const balls: Matter.Body[] = []
    for (let i = 0; i < ballCount; i++) {
      // Use seeded deterministic pseudo-random values instead of Math.random()
      const randX = seededRandom(i * 3 + 1)
      const randY = seededRandom(i * 3 + 2)
      const randVx = seededRandom(i * 3 + 3)
      const randVy = seededRandom(i * 3 + 4)

      const x = boxCenterX - boxW * 0.35 + randX * (boxW * 0.7)
      const y = boxCenterY - boxH * 0.35 + randY * (boxH * 0.35)
      const color = ballColors[i % ballColors.length]

      const ball = Matter.Bodies.circle(x, y, ballRadius, {
        restitution,
        friction: 0.001,
        frictionAir: 0.0002,
        density: 0.02,
        label: `Ball-${i}`,
        render: {
          fillStyle: color,
          strokeStyle: '#FFFFFF',
          lineWidth: 1.5,
          trackTrajectory: i === 0, // Track trajectory for the 1st hero ball
        } as any,
      })

      // Deterministic initial velocities
      Matter.Body.setVelocity(ball, {
        x: (randVx - 0.5) * 14,
        y: (randVy - 0.5) * 10,
      })

      balls.push(ball)
      worldBodies.push(ball)
    }

    Matter.Composite.add(engine.world, worldBodies)

    let collisionCount = 0
    Matter.Events.on(engine, 'collisionStart', () => {
      collisionCount++
    })

    return {
      engine,
      onStep: (_frame: number, timeSec: number) => {
        // Rotate spinner with both angular orientation and surface velocity
        if (spinner && params.hasSpinner) {
          const spinSpeed = params.spinnerSpeed || 0.05
          Matter.Body.setAngle(spinner, spinner.angle + spinSpeed)
          Matter.Body.setAngularVelocity(spinner, spinSpeed)
        }

        let maxSpeed = 0
        let totalEnergy = 0

        balls.forEach((b) => {
          const spd = Math.sqrt(b.velocity.x ** 2 + b.velocity.y ** 2)
          if (spd > maxSpeed) maxSpeed = spd
          totalEnergy += 0.5 * b.mass * (spd ** 2)
        })

        // Kinetic theory of gases metrics
        const avgKinetic = totalEnergy / Math.max(1, ballCount)
        const approxTempK = 273 + avgKinetic * 1.5 // Equivalent Kelvin temperature T
        const approxPressure = (totalEnergy * 0.05).toFixed(1) // Equivalent wall pressure P

        const telemetry: TelemetryMetric[] = [
          { label: 'Số phân tử N', value: ballCount, color: '#00F2FE' },
          { label: 'Tổng va chạm', value: collisionCount, color: '#BEFF01', highlight: true },
          { label: 'V_max', value: (maxSpeed * 0.1).toFixed(1), unit: 'm/s', color: '#FF6B6B' },
          { label: 'Nhiệt độ T (ước tính)', value: `${approxTempK.toFixed(0)} K`, color: '#FFD700' },
          { label: 'Áp suất P', value: approxPressure, unit: 'kPa', color: '#A855F7' },
          { label: 'Thời gian t', value: timeSec.toFixed(2), unit: 's' },
        ]

        return {
          telemetry,
          annotations: [
            {
              x: boxCenterX,
              y: boxCenterY - boxH / 2 - 12,
              text: `MÔ HÌNH CHẤT KHÍ LÝ TƯỞNG (e = ${restitution})`,
              color: '#38BDF8',
            },
          ],
        }
      },
    }
  },
}
