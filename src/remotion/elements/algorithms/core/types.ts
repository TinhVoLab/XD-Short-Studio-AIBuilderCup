export type AlgorithmStepType = 'compare' | 'swap' | 'pivot' | 'overwrite' | 'sorted' | 'idle'

export interface AlgorithmTraceStep {
  type: AlgorithmStepType
  indices: number[]
  valuesSnapshot: number[]
  metrics: {
    comparisons: number
    swaps: number
  }
  soundPitch?: number // Normalized pitch 0..1 for Web Audio / SFX
}

export type InitialArrayType = 'random' | 'reversed' | 'nearly-sorted'

export interface IAlgorithmDefinition {
  id: string
  name: string
  category: 'sorting' | 'searching' | 'pathfinding'
  timeComplexity: {
    best: string
    average: string
    worst: string
  }
  spaceComplexity: string
  description: string
  generateTrace: (initialArray: number[]) => AlgorithmTraceStep[]
}

export interface AlgorithmBattleLaneConfig {
  algorithmId: string
  label?: string
  accentColor?: string
}

export interface AlgorithmQuizConfig {
  enabled: boolean
  freezeAtSec?: number
  freezeDurationSec?: number
  badge?: string
  question: string
  options: Array<{ id: string; text: string }>
  correctAnswer: string
  explanation?: string
  sfxEnabled?: boolean
}

export type AlgorithmSpeedMode = 'auto-fit' | 'target-time' | 'manual'

export interface AlgorithmSimulationConfig {
  mode: 'single' | 'battle'
  algorithmId?: string // used in 'single' mode
  battleLanes?: AlgorithmBattleLaneConfig[] // used in 'battle' mode (e.g. 2 or 3 lanes)
  arraySize?: number // e.g. 15..50
  initialType?: InitialArrayType
  seed?: number
  // Timing & Speed
  speedMode?: AlgorithmSpeedMode // 'auto-fit' (default) | 'target-time' | 'manual'
  targetFinishSec?: number // used when speedMode === 'target-time'
  speedMultiplier?: number // used when speedMode === 'manual' (0.5..3.0)
  speedRamp?: boolean // Dramatic speed ramp: slow start (0.6x) -> sprint finish
  theme?: 'cyber-neon' | 'matrix-code' | 'blueprint' | 'chalkboard' | 'minimal-dark'
  soundEnabled?: boolean
  soundVolume?: number
  showMetricsHUD?: boolean
  showComplexityBadge?: boolean
  quizHook?: AlgorithmQuizConfig
}
