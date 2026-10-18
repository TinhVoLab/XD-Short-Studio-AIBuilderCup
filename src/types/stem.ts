export type MathVisualizationMode =
  | 'function'        // Khảo sát đồ thị & tiếp tuyến đạo hàm
  | 'calculus_area'   // Tích phân Riemann & diện tích hình phẳng
  | 'trig_circle'     // Đường tròn lượng giác & hình chiếu sin/cos
  | 'parametric'      // Quỹ đạo ném xiên & chuyển động vật lý
  | 'vector_field'    // Trường vector vi phân & từ trường
  | 'geometry_conic'  // Hình học toạ độ: Elip, Parabol, Đường tròn
  | 'custom_layers';  // Tự do kết hợp các layer

export interface MathPointItem {
  id?: string;
  x: number | string; // Số thực hoặc biểu thức tính theo t (ví dụ "cos(t)")
  y: number | string; // Số thực hoặc biểu thức tính theo t (ví dụ "sin(t)")
  label?: string;
  color?: string;
}

export interface MathVectorItem {
  id?: string;
  tail: [number, number] | [string, string];
  tip: [number, number] | [string, string];
  label?: string;
  color?: string;
}

export interface MathLineItem {
  id?: string;
  type?: 'tangent' | 'segment' | 'asymptote';
  point?: [number, number] | [string, string];
  slope?: number | string;
  p1?: [number, number];
  p2?: [number, number];
  color?: string;
  dashed?: boolean;
}

export interface MathImageSprite {
  url: string;
  at: [number, number] | [string, string]; // Toạ độ bám theo thời gian t
  width: number;
  height?: number;
  angle?: number | string; // Góc xoay
}

export interface MathCircleItem {
  center: [number, number];
  radius: number;
  color?: string;
  fillColor?: string;
  dashed?: boolean;
}

export interface MathEllipseItem {
  center: [number, number];
  radius: [number, number];
  angle?: number;
  color?: string;
  fillColor?: string;
}

export interface MathPolygonItem {
  points: [number, number][];
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
}

export interface MathLabelItem {
  x: number | string;
  y: number | string;
  text: string;
  color?: string;
}

export interface MathPlotData {
  mode?: MathVisualizationMode;
  expression: string // JavaScript math expression using x and optionally t (time in seconds)
  domainX?: [number, number]
  domainY?: [number, number]
  color?: string
  lineWidth?: number
  showGrid?: boolean
  showAxes?: boolean
  animateSpeed?: number // Multiplier for time variable t
  title?: string
  latexLabel?: string

  // Module 6: Extended Plots
  expressionY?: string;          // x = f(y, t)
  parametricX?: string;          // x = f(tau, t)
  parametricY?: string;          // y = f(tau, t)
  vectorFieldExpr?: string;      // (x, y, t) => [dx, dy]

  // Module 1, 2, 8: Điểm, Tiếp tuyến, Vector
  showTangent?: boolean;         // Tiếp tuyến trượt tự động
  tangentX?: number | string;    // Vị trí x của tiếp tuyến
  points?: MathPointItem[];
  vectors?: MathVectorItem[];
  lines?: MathLineItem[];

  // Module 3, 4, 5: Đa giác, Đường tròn, Elip
  circles?: MathCircleItem[];
  ellipses?: MathEllipseItem[];
  polygons?: MathPolygonItem[];

  // Module 7: Nhãn chữ toạ độ
  labels?: MathLabelItem[];

  // Module 9: Ảnh vật thể bám toạ độ chuyển động
  sprite?: MathImageSprite;

  // Module 2 (Tích phân): Cận tích phân Riemann
  integralBounds?: [number, number];
  riemannSubdivisions?: number;
}

export type LatexAnimMode = 'none' | 'write-on' | 'laser-scan' | 'pulse-glow';

export interface LatexFormulaData {
  latex: string
  fontSize?: number
  color?: string
  title?: string
  badge?: string
  displayMode?: boolean
  showBackground?: boolean
  glow?: boolean
  animMode?: LatexAnimMode
  animDuration?: number
  glowColor?: string
  sfxEnabled?: boolean
}

export interface ChemicalMoleculeData {
  smiles: string
  /** Tên hiển thị */
  name: string
  /** Tên tiếng Anh / IUPAC dùng tra PubChem */
  lookupName?: string
  /** CID PubChem — có nghĩa là SMILES và công thức đã được xác minh */
  pubchemCid?: number
  formula?: string
  theme?: 'neon' | 'dark' | 'light' | 'matrix' | 'cyberpunk' | 'auto'
  bondThickness?: number
  subtext?: string
  showFormula?: boolean
  showName?: boolean
  animMode?: 'all' | 'draw' | 'float' | 'none'
  animSpeed?: number
  pulseGlow?: boolean
}

export type QuizType = 'single-choice' | 'multi-choice' | 'true-false' | 'poll'

export interface QuizOptionItem {
  id: string
  text: string
  isLatex?: boolean
  imageUrl?: string
  pollPercent?: number
}

export interface InteractiveQuizData {
  quizType?: QuizType
  question: string
  questionLatex?: boolean
  badge?: string
  options: QuizOptionItem[]
  correctId?: string
  correctAnswers?: string[]
  introSec?: number
  countdownSec?: number
  revealSec?: number
  explanation?: string
  showExplanation?: boolean
  points?: number
  sfxEnabled?: boolean
  themePreset?: 'studio-neon' | 'chalkboard' | 'clean-minimal'
  layoutVariant?: 'stacked' | 'grid-2x2'
}

import { PhysicsSimulationConfig } from '@/remotion/elements/physics/core/types'
import { AlgorithmSimulationConfig } from '@/remotion/elements/algorithms/core/types'
import { VisualParadoxData } from '@/remotion/elements/stem/paradox/types'
import { CodeTerminalData } from '@/types/scene'

export interface StemPresetItem {
  id: string
  category: 'math' | 'chemistry' | 'chem' | 'latex' | 'physics' | 'quiz' | 'cs' | 'paradox'
  name: string
  description: string
  type: 'math-plot' | 'latex-formula' | 'chemical-molecule' | 'interactive-quiz' | 'physics-sim' | 'algorithm-sim' | 'visual-paradox' | 'code-terminal'
  mathData?: MathPlotData
  latexData?: LatexFormulaData
  chemData?: ChemicalMoleculeData
  quizData?: InteractiveQuizData
  physicsData?: PhysicsSimulationConfig
  algorithmData?: AlgorithmSimulationConfig
  paradoxData?: VisualParadoxData
  codeData?: CodeTerminalData
  tags: string[]
  accentColor: string
}

