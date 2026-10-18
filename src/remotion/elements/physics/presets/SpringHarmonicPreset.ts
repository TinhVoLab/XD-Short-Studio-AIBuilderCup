import Matter from 'matter-js'
import { IPhysicsPresetDefinition, ForceVectorDisplay, TelemetryMetric, LiveChartData } from '../core/types'

export const SpringHarmonicPreset: IPhysicsPresetDefinition = {
  id: 'spring-harmonic',
  name: 'Con lắc Lò xo (Dao động Điều hoà)',
  category: 'harmonic',
  description: 'Mô phỏng dao động điều hoà F = -kx kèm đồ thị sóng x(t) = A·cos(ωt) thời gian thực.',
  formulaLatex: 'x(t) = A\\cos(\\omega t + \\varphi), \\quad \\omega = \\sqrt{\\frac{k}{m}}',
  formulaExplanation: 'Lực đàn hồi F = -kx luôn hướng về vị trí cân bằng và tỉ lệ thuận với độ biến dạng x.',
  naturalDurationSec: 9.0,
  defaultParams: {
    springK: 20,
    mass: 1.0,
    damping: 0.0,
    amplitude: 50,
    boxColor: '#BEFF01',
    springColor: '#00F2FE',
    showChart: true,
    showVectors: true,
  },
  setup: (worldWidth: number, worldHeight: number, params: Record<string, any>) => {
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 0, scale: 0 },
    })

    const rawK = params.springK ?? 25
    const k = rawK < 1 ? 25 : rawK
    const m = params.mass ?? 1.0
    const damping = params.damping ?? 0.0
    const amplitude = params.amplitude ?? 50
    const centerY = worldHeight * 0.35
    const equilibriumX = Math.round(worldWidth * 0.58)
    const anchorX = 32
    const restingLength = equilibriumX - anchorX
    const boxSize = 38

    // 1. Static Wall Support on the left (anchor for the spring)
    const wall = Matter.Bodies.rectangle(anchorX - 10, centerY, 16, 96, {
      isStatic: true,
      label: 'SpringWall',
      render: {
        fillStyle: '#1E293B',
        strokeStyle: '#64748B',
        lineWidth: 2,
      } as any,
    })

    // 2. Guide Rail / Floor under the block
    const rail = Matter.Bodies.rectangle(worldWidth * 0.5, centerY + boxSize / 2 + 3, worldWidth * 0.88, 2, {
      isStatic: true,
      label: 'SpringRail',
      render: {
        fillStyle: '#334155',
        strokeStyle: '#334155',
        lineWidth: 1,
      } as any,
    })

    // 3. Oscillating Mass Block
    const box = Matter.Bodies.rectangle(equilibriumX + amplitude, centerY, boxSize, boxSize, {
      mass: m,
      inertia: Infinity, // Prevent unwanted angular tilt
      frictionAir: 0,
      friction: 0,
      restitution: 1,
      label: 'HarmonicMass',
      render: {
        fillStyle: params.boxColor || '#BEFF01',
        strokeStyle: '#FFFFFF',
        lineWidth: 2,
        trackTrajectory: false,
      } as any,
    })

    // 4. Spring Constraint from Wall to Left Face of Box (Visual connector)
    const spring = Matter.Constraint.create({
      pointA: { x: anchorX, y: centerY },
      bodyB: box,
      pointB: { x: -boxSize / 2, y: 0 },
      stiffness: 0, // Analytical positioning drives the box, constraint is visual-only
      length: restingLength,
      render: {
        strokeStyle: params.springColor || '#00F2FE',
        lineWidth: 3,
      } as any,
    })
    ;(spring as any).isSpring = true

    Matter.Composite.add(engine.world, [wall, rail, box, spring])

    return {
      engine,
      onStep: (
        frame: number,
        timeSec: number,
        _engine: Matter.Engine,
        stepParams: Record<string, any>,
        timeScale: number = 1.0
      ) => {
        const rawStepK = stepParams.springK ?? k
        const curK = rawStepK < 1 ? 25 : rawStepK
        const curM = stepParams.mass ?? m
        const gamma = stepParams.damping ?? damping
        const curAmp = stepParams.amplitude ?? amplitude

        const omega0 = Math.sqrt(Math.max(0.1, curK / curM))
        const omega = Math.sqrt(Math.max(0.1, omega0 * omega0 - gamma * gamma))
        const periodT = (2 * Math.PI) / omega
        const freqF = 1 / periodT

        // Physical time elapsed (scaled by timeScale)
        const tPhys = timeSec * (timeScale || 1.0)

        // Analytical formulation for damped harmonic oscillator
        const decay = Math.exp(-gamma * tPhys)
        const displacement = curAmp * decay * Math.cos(omega * tPhys)
        const vx =
          -curAmp *
          decay *
          (gamma * Math.cos(omega * tPhys) + omega * Math.sin(omega * tPhys)) *
          (timeScale || 1.0)

        // Smoothly position the physical body
        const currentX = equilibriumX + displacement
        Matter.Body.setPosition(box, { x: currentX, y: centerY })
        Matter.Body.setVelocity(box, { x: vx / 30, y: 0 })

        // Deterministic rolling wave chart window (last 90 frames / 3s)
        const chartPoints: Array<{ x: number; y: number }> = []
        const currentSimFrame = frame
        const startFrame = Math.max(0, currentSimFrame - 90)
        for (let f = startFrame; f <= currentSimFrame; f++) {
          const ptTime = (f / 30) * (timeScale || 1.0)
          const ptDecay = Math.exp(-gamma * ptTime)
          const ptDisp = curAmp * ptDecay * Math.cos(omega * ptTime)
          chartPoints.push({ x: ptTime, y: ptDisp })
        }

        // Restoring force & velocity vector displays
        const forceVectors: ForceVectorDisplay[] = []
        if (stepParams.showVectors) {
          // F_đh = -k * x
          const forceMagnitude = -displacement * (curK / 20) * 0.75
          if (Math.abs(forceMagnitude) > 2) {
            forceVectors.push({
              id: 'vec_f_spring',
              origin: { x: currentX, y: centerY - 28 },
              vector: { x: forceMagnitude, y: 0 },
              color: '#FF6B6B',
              label: 'F_đh = -kx',
              unitValue: `${Math.abs(displacement * (curK / 100)).toFixed(1)} N`,
            })
          }

          // Velocity vector v(t)
          if (Math.abs(vx) > 2) {
            forceVectors.push({
              id: 'vec_v_spring',
              origin: { x: currentX, y: centerY + 28 },
              vector: { x: vx * 0.18, y: 0 },
              color: '#00D4FF',
              label: 'v(t)',
              unitValue: `${(Math.abs(vx) * 0.1).toFixed(1)} cm/s`,
            })
          }
        }

        // Physical Energy calculations (mJ)
        const kineticEnergy = 0.5 * curM * (vx * 0.01) * (vx * 0.01) * 1000
        const potentialEnergy = 0.5 * curK * (displacement * 0.01) * (displacement * 0.01) * 1000
        const totalEnergy = kineticEnergy + potentialEnergy

        const telemetry: TelemetryMetric[] = [
          { label: 'Li độ x', value: (displacement * 0.1).toFixed(2), unit: 'cm', color: '#BEFF01', highlight: true },
          { label: 'Vận tốc v', value: (vx * 0.1).toFixed(1), unit: 'cm/s', color: '#00D4FF' },
          { label: 'Chu kỳ T', value: periodT.toFixed(2), unit: 's', color: '#FFD700' },
          { label: 'Tần số f', value: freqF.toFixed(2), unit: 'Hz', color: '#38BDF8' },
          { label: 'Cơ năng W', value: totalEnergy.toFixed(1), unit: 'mJ', color: '#F43F5E' },
          { label: 'Thời gian t', value: timeSec.toFixed(2), unit: 's' },
        ]

        const liveChart: LiveChartData = {
          title: 'ĐỒ THỊ SÓNG DAO ĐỘNG ĐIỀU HOÀ x(t)',
          xLabel: 'Thời gian t (s)',
          yLabel: 'Li độ x (cm)',
          points: chartPoints,
          minY: -curAmp * 1.25,
          maxY: curAmp * 1.25,
          color: '#BEFF01',
        }

        const isStretched = displacement > 5
        const isCompressed = displacement < -5
        const stateText = isStretched
          ? `Lò xo DÃN (+${(displacement * 0.1).toFixed(1)} cm)`
          : isCompressed
          ? `Lò xo NÉN (${(displacement * 0.1).toFixed(1)} cm)`
          : 'Lò xo TỰ NHIÊN (Δl = 0)'
        const stateColor = isStretched ? '#00D4FF' : isCompressed ? '#FF6B6B' : '#94A3B8'

        const annotations = [
          {
            x: Math.round((anchorX + currentX - boxSize / 2) / 2),
            y: centerY - 20,
            text: stateText,
            color: stateColor,
          },
          {
            x: equilibriumX,
            y: centerY + 44,
            text: 'VTCB (x = 0)',
            color: '#94A3B8',
          },
          {
            x: equilibriumX - curAmp,
            y: centerY + 44,
            text: '-A',
            color: '#64748B',
          },
          {
            x: equilibriumX + curAmp,
            y: centerY + 44,
            text: '+A',
            color: '#64748B',
          },
        ]

        return {
          forceVectors,
          telemetry,
          liveChart: stepParams.showChart ? liveChart : undefined,
          annotations,
        }
      },
    }
  },
}
