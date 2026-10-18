import Matter from 'matter-js'
import { IPhysicsPresetDefinition, ForceVectorDisplay, TelemetryMetric } from '../core/types'

export const InclinedPlanePreset: IPhysicsPresetDefinition = {
  id: 'inclined-plane',
  name: 'Mặt phẳng nghiêng (Lực & Ma sát)',
  category: 'mechanics',
  description: 'Mô phỏng phân tích 3 vector lực (Trọng lực P, Phản lực N, Lực ma sát F_ms) trên dốc nghiêng.',
  formulaLatex: 'a = g(\\sin\\alpha - \\mu\\cos\\alpha)',
  formulaExplanation: 'Gia tốc trượt phụ thuộc góc dốc alpha và hệ số ma sát mu giữa vật và bề mặt dốc.',
  naturalDurationSec: 3.0,
  defaultParams: {
    inclineAngleDeg: 30,
    friction: 0.15,
    boxMass: 10,
    restitution: 0.1,
    boxColor: '#FF6B6B',
    rampColor: '#2D3748',
    showVectors: true,
    showVectorLabels: true,
  },
  setup: (worldWidth: number, worldHeight: number, params: Record<string, any>) => {
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 1.0, scale: 0.001 },
    })

    const angleDeg = params.inclineAngleDeg || 30
    const angleRad = (angleDeg * Math.PI) / 180
    const friction = params.friction ?? 0.15

    const rampLength = worldWidth * 0.9
    const rampThickness = 20
    const rampCenterX = worldWidth * 0.5
    const rampCenterY = worldHeight * 0.55

    // Create inclined ramp static body
    const ramp = Matter.Bodies.rectangle(rampCenterX, rampCenterY, rampLength, rampThickness, {
      isStatic: true,
      angle: angleRad,
      friction,
      restitution: 0.1,
      render: {
        fillStyle: params.rampColor || '#1A202C',
        strokeStyle: '#4A5568',
        lineWidth: 2,
      } as any,
    })

    // Ground floor static body
    const ground = Matter.Bodies.rectangle(worldWidth / 2, worldHeight - 15, worldWidth, 30, {
      isStatic: true,
      friction: 0.4,
      render: { fillStyle: '#111827' } as any,
    })

    // Create sliding box on top of the ramp
    const boxSize = 38
    // Calculate initial position on upper part of ramp
    const distFromCenter = -rampLength * 0.35
    const offsetH = boxSize / 2 + rampThickness / 2 + 2
    const initX = rampCenterX + distFromCenter * Math.cos(angleRad) + offsetH * Math.sin(angleRad)
    const initY = rampCenterY + distFromCenter * Math.sin(angleRad) - offsetH * Math.cos(angleRad)

    const box = Matter.Bodies.rectangle(initX, initY, boxSize, boxSize, {
      angle: angleRad,
      friction,
      restitution: params.restitution ?? 0.1,
      density: 0.01,
      label: 'SlidingBox',
      render: {
        fillStyle: params.boxColor || '#FF6B6B',
        strokeStyle: '#FFA8A8',
        lineWidth: 2,
        trackTrajectory: true,
      } as any,
    })

    Matter.Composite.add(engine.world, [ramp, ground, box])

    return {
      engine,
      onStep: (_frame: number, timeSec: number) => {
        const v = Math.sqrt(box.velocity.x ** 2 + box.velocity.y ** 2)
        const g = 9.8
        const m = params.boxMass || 10

        // Theoretical Force magnitudes
        const P = m * g
        const N = P * Math.cos(angleRad)
        const Fms = friction * N
        const aTheoretical = Math.max(0, g * (Math.sin(angleRad) - friction * Math.cos(angleRad)))

        const forceVectors: ForceVectorDisplay[] = []
        if (params.showVectors) {
          const bX = box.position.x
          const bY = box.position.y

          // Vector P: Gravity (straight down)
          forceVectors.push({
            id: 'vec_p',
            origin: { x: bX, y: bY },
            vector: { x: 0, y: 55 },
            color: '#FF4D4D',
            label: 'P = mg',
            unitValue: `${P.toFixed(0)} N`,
          })

          // Vector N: Normal reaction force (perpendicular to ramp surface, pointing up-left)
          const normalDirX = Math.sin(angleRad)
          const normalDirY = -Math.cos(angleRad)
          const nLen = 45 * Math.cos(angleRad)
          forceVectors.push({
            id: 'vec_n',
            origin: { x: bX, y: bY },
            vector: { x: normalDirX * nLen, y: normalDirY * nLen },
            color: '#00D4FF',
            label: 'N = mg·cosα',
            unitValue: `${N.toFixed(0)} N`,
          })

          // Vector F_ms: Friction force (parallel to ramp, pointing up-slope)
          const fmsDirX = -Math.cos(angleRad)
          const fmsDirY = -Math.sin(angleRad)
          const fmsLen = Math.min(35, 45 * Math.sin(angleRad) * friction)
          forceVectors.push({
            id: 'vec_fms',
            origin: { x: bX, y: bY },
            vector: { x: fmsDirX * fmsLen, y: fmsDirY * fmsLen },
            color: '#FFD700',
            label: 'F_ms = μN',
            unitValue: `${Fms.toFixed(1)} N`,
          })

          // Vector a: Acceleration along the incline (down-slope)
          if (aTheoretical > 0.05) {
            const aDirX = Math.cos(angleRad)
            const aDirY = Math.sin(angleRad)
            forceVectors.push({
              id: 'vec_a',
              origin: { x: bX + 20 * normalDirX, y: bY + 20 * normalDirY },
              vector: { x: aDirX * 35, y: aDirY * 35 },
              color: '#BEFF01',
              label: 'a = g(sinα - μcosα)',
              unitValue: `${aTheoretical.toFixed(2)} m/s²`,
            })
          }
        }

        const telemetry: TelemetryMetric[] = [
          { label: 'Góc nghiêng α', value: `${angleDeg}°`, color: '#00D4FF' },
          { label: 'Hệ số ma sát μ', value: friction.toFixed(2), color: '#FFD700' },
          { label: 'Gia tốc a', value: aTheoretical.toFixed(2), unit: 'm/s²', color: '#BEFF01', highlight: true },
          { label: 'Vận tốc v(t)', value: (v * 0.1).toFixed(2), unit: 'm/s' },
          { label: 'Thời gian t', value: timeSec.toFixed(2), unit: 's' },
        ]

        return {
          forceVectors,
          telemetry,
          annotations: [
            {
              x: rampCenterX,
              y: rampCenterY - 90,
              text: `GÓC DỐC α = ${angleDeg}° | HỆ SỐ MA SÁT μ = ${friction}`,
              color: '#BEFF01',
            }
          ]
        }
      },
    }
  },
}
