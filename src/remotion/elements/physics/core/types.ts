export interface Vector2D {
  x: number
  y: number
}

export interface PhysicsBodyState {
  id: string | number
  label?: string
  shape: 'circle' | 'rectangle' | 'polygon'
  position: Vector2D
  angle: number
  velocity: Vector2D
  angularVelocity: number
  radius?: number
  width?: number
  height?: number
  vertices?: Vector2D[]
  fill?: string
  stroke?: string
  strokeWidth?: number
  isStatic?: boolean
  restitution?: number
  friction?: number
  mass?: number
  customData?: Record<string, any>
}

export interface PhysicsConstraintState {
  id: string | number
  label?: string
  pointA: Vector2D
  pointB: Vector2D
  bodyAPosition?: Vector2D
  bodyBPosition?: Vector2D
  length: number
  stiffness?: number
  damping?: number
  stroke?: string
  strokeWidth?: number
  isSpring?: boolean
}

export interface ForceVectorDisplay {
  id: string
  bodyId?: string | number
  origin: Vector2D
  vector: Vector2D
  color: string
  label: string
  unitValue?: string
}

export interface TrajectoryPoint {
  x: number
  y: number
  frame: number
  timeSec: number
}

export interface TelemetryMetric {
  label: string
  value: string | number
  unit?: string
  color?: string
  highlight?: boolean
}

export interface LiveChartData {
  title?: string
  xLabel?: string
  yLabel?: string
  points: Array<{ x: number; y: number }>
  minX?: number
  maxX?: number
  minY?: number
  maxY?: number
  color?: string
}

export interface PhysicsCollisionEvent {
  frame: number
  timeSec: number
  bodyIdA?: string | number
  bodyIdB?: string | number
  impulse: number
  sfxType: 'click' | 'pop' | 'thud' | 'whoosh'
  volume: number
}

export interface PhysicsWorldSnapshot {
  frame: number
  timeSec: number
  bodies: PhysicsBodyState[]
  constraints: PhysicsConstraintState[]
  forceVectors: ForceVectorDisplay[]
  trajectories: Record<string, TrajectoryPoint[]>
  telemetry: TelemetryMetric[]
  liveChart?: LiveChartData
  collisionEvents?: PhysicsCollisionEvent[]
  annotations?: Array<{
    x: number
    y: number
    text: string
    color?: string
    bgColor?: string
    anchor?: 'start' | 'middle' | 'end'
    fontSize?: number
  }>
}

export interface PhysicsComparisonConfig {
  enabled: boolean
  presetAId: string
  presetBId: string
  labelA: string
  labelB: string
  paramsA: Record<string, any>
  paramsB: Record<string, any>
  layout?: 'horizontal-split' | 'vertical-split'
}

export interface PhysicsQuizHookConfig {
  enabled: boolean
  freezeAtSec: number // Thời điểm đóng băng (ví dụ: 2.0s)
  freezeDurationSec: number // Khoảng thời gian dừng để hỏi (ví dụ: 4.0s)
  badge?: string
  question: string
  options: Array<{ id: string; text: string }>
  correctAnswer: string // 'A' | 'B' | 'C' | 'D'
  explanation?: string
  sfxEnabled?: boolean
}

export type PhysicsSpeedMode = 'auto-fit' | 'target-time' | 'manual'

export interface PhysicsSimulationConfig {
  presetId: string
  width?: number
  height?: number
  // Timing & Speed Control
  speedMode?: PhysicsSpeedMode // 'auto-fit' (default) | 'target-time' | 'manual'
  targetFinishSec?: number     // used when speedMode === 'target-time'
  timeScale?: number           // used when speedMode === 'manual' (0.2x..3.0x, default 1.0)
  gravity?: { x: number; y: number; scale?: number }
  restitution?: number
  friction?: number
  theme?: 'chalkboard' | 'blueprint' | 'cyber-neon' | 'minimal-dark' | 'academic-light'
  showVectors?: boolean
  showTrajectories?: boolean
  showHUD?: boolean
  showGrid?: boolean
  showFormulas?: boolean
  customParams?: Record<string, any>
  sfxConfig?: {
    enabled?: boolean
    volume?: number
  }
  comparison?: PhysicsComparisonConfig
  quizHook?: PhysicsQuizHookConfig
}

export interface IPhysicsPresetDefinition {
  id: string
  name: string
  category: 'mechanics' | 'harmonic' | 'kinematics' | 'viral' | 'optics'
  description: string
  formulaLatex?: string
  formulaExplanation?: string
  naturalDurationSec?: number // Approximate natural completion time of the physical phenomenon (seconds)
  defaultParams: Record<string, any>
  setup: (worldWidth: number, worldHeight: number, params: Record<string, any>) => {
    engine: any
    cleanup?: () => void
    onStep?: (frame: number, timeSec: number, engine: any, params: Record<string, any>, timeScale?: number) => {
      forceVectors?: ForceVectorDisplay[]
      telemetry?: TelemetryMetric[]
      liveChart?: LiveChartData
      annotations?: Array<{ x: number; y: number; text: string; color?: string; bgColor?: string }>
    }
  }
}
