export type FormulaCategory = 'stem' | 'finance' | 'strategy' | 'cosmos' | 'vitality';

export type FormulaId =
  // stem
  | 'quantum-orbit'
  | 'lorenz-attractor'
  | 'dna-helix'
  | 'rose-curve'
  // finance
  | 'exponential-surge'
  | 'fibonacci-spiral'
  | 'harmonic-wave'
  | 'singularity-vortex'
  // strategy
  | 'network-mesh'
  | 'bifurcation-tree'
  | 'neural-pulse'
  | 'cyber-shield'
  // cosmos
  | 'spacetime-grid'
  | 'lissajous-curve'
  | 'mobius-loop'
  | 'double-pendulum'
  // vitality
  | 'ecg-heartbeat'
  | 'tesseract-hypercube'
  | 'streamline-flow'
  | 'torus-field';

export type RenderStyle =
  | 'neon-cyber'
  | 'minimal-hairline'
  | 'hologram-radar'
  | 'blueprint-cad';

export interface ColorPalette {
  id: string;
  name: string;
  accent: string;
  secondary: string;
}

export interface FormulaPath {
  d: string;
  stroke: string;
  strokeWidth: number;
  fill?: string;
  opacity?: number;
  strokeDasharray?: string;
  strokeDashoffset?: number;
  filter?: string;
  // added for hologram-radar or custom
  markerEnd?: string;
  markerStart?: string;
}

export interface FormulaParticle {
  cx: number;
  cy: number;
  r: number;
  fill: string;
  opacity?: number;
  filter?: string;
  // optional text or shape inside particle
}

export interface FormulaFrame {
  paths: FormulaPath[];
  particles: FormulaParticle[];
}

export interface FormulaModule {
  id: FormulaId;
  name: string;
  category: FormulaCategory;
  description: string;
  compute: (
    t: number,
    accent: string,
    secondary: string,
    params?: Record<string, number>
  ) => FormulaFrame;
}
