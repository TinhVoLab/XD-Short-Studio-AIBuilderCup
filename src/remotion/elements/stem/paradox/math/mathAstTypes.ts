export interface MathCoordinateGrid {
  xRange: [number, number];
  yRange: [number, number];
  step?: number;
  showNumbers?: boolean;
  color?: string;
  xLabel?: string;
  yLabel?: string;
}

export type MathAstNode =
  | { type: 'grid'; spec: MathCoordinateGrid }
  | {
      type: 'plot';
      id?: string;
      expr: string;
      color?: string;
      width?: number;
      fillUnder?: boolean;
      fillOpacity?: number;
      drawProgress?: boolean;
      label?: string;
    }
  | {
      type: 'particles';
      id?: string;
      count?: number;
      distribution?: 'exponential_altitude' | 'uniform' | 'bottom_concentrated';
      showBrownianMotion?: boolean;
      temperature?: number;
      speedMultiplier?: number;
      color?: string;
      label?: string;
    }
  | {
      type: 'chamber';
      id?: string;
      chamberType?: 'cylinder' | 'beaker' | 'incline' | 'u_tube' | 'airfoil';
      liquidLevel?: number; // 0.0 to 1.0
      liquidColor?: string;
      pistonY?: number; // 0.0 (top) to 1.0 (bottom)
      showPiston?: boolean;
      label?: string;
      color?: string;
    }
  | {
      type: 'gauge';
      id?: string;
      label: string;
      min: number;
      max: number;
      current: number | string; // Numeric value or eval expression
      unit: string;
      color?: string;
      alertThreshold?: number;
      position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'inline';
    }
  | {
      type: 'streamlines';
      id?: string;
      flowType?: 'airfoil_lift' | 'pipe_constriction' | 'magnus_spin';
      speed?: number;
      color?: string;
      showForces?: boolean;
      label?: string;
    }
  | {
      type: 'milestone';
      id?: string;
      x: number;
      label: string;
      sublabel?: string;
      color?: string;
      lineStyle?: 'dashed' | 'solid';
    }
  | {
      type: 'point';
      id?: string;
      x: string | number;
      y: string | number;
      label?: string;
      radius?: number;
      color?: string;
    }
  | {
      type: 'riemann';
      id?: string;
      expr: string;
      a: number;
      b: number;
      nMin: number;
      nMax: number;
      method?: 'left' | 'right' | 'mid';
      color?: string;
    }
  | {
      type: 'tangent';
      id?: string;
      expr: string;
      atX: string | number;
      length?: number;
      color?: string;
      showSecant?: boolean;
    }
  | {
      type: 'vector';
      id?: string;
      x1: string | number;
      y1: string | number;
      x2: string | number;
      y2: string | number;
      label?: string;
      color?: string;
      width?: number;
    }
  | {
      type: 'fourier';
      id?: string;
      epicycles: { radius: number; freq: number; phase?: number }[];
      traceColor?: string;
      maxTrailLength?: number;
    }
  | {
      type: 'matrix_grid';
      id?: string;
      matrix: [string | number, string | number, string | number, string | number]; // [a, b, c, d] for [x', y'] = [a*x + b*y, c*x + d*y]
      color?: string;
    }
  | {
      type: 'unit_circle';
      id?: string;
      showSin?: boolean;
      showCos?: boolean;
      showTan?: boolean;
      color?: string;
    }
  | {
      type: 'label';
      id?: string;
      text: string;
      at?: 'top-left' | 'top-right' | 'bottom-left' | 'origin' | [number, number];
      formula?: string;
      dynamicValue?: string;
      color?: string;
    };

// ==========================================
// KẾT CẤU: SCIENTIFIC VISUAL DOMAIN & ARCHETYPES
// ==========================================

export type ScientificDomain =
  | 'mechanics_forces'     // Vector lực F, gia tốc a, ma sát, phản lực Newton
  | 'fluid_pressure'       // Buồng kín, áp suất P, lực đẩy Archimedes, piston
  | 'thermal_particles'    // Động học phân tử, nhiệt độ T, khuếch tán Brown
  | 'aerodynamics_flow'    // Dòng chảy khí động học, Bernoulli, hiệu ứng Magnus
  | 'calculus_analysis'    // Đồ thị hàm số, tiếp tuyến, tích phân Riemann, Fourier
  | 'scientific_metrics';  // Bảng đo lường đại lượng, đồng hồ, ngưỡng cảnh báo

export type CoreArchetype = 
  | 'function_plot'        // Đồ thị giải tích (Parabol, Sin...)
  | 'formula_morph'        // Biến đổi phương trình KaTeX
  | 'geometry_construct'   // Dựng hình & Vector lực
  | 'transform_matrix'     // Biến đổi không gian ma trận 2D
  | 'number_line'          // Trục số & Dãy số
  | 'probability_sim'      // Mô phỏng hạt & Khí lý tưởng
  | 'parametric_curve'     // Chuỗi Fourier & Dao động
  | 'chamber_pressure'     // Buồng áp suất & Piston
  | 'aerodynamic_flow'     // Khí động học & Dòng chảy
  | 'custom_ast';          // Custom AST nodes thuần

export type AnimationVerb = 'draw' | 'highlight' | 'fade_in' | 'morph' | 'trace' | 'pulse' | 'reveal_step';

export interface MathAnimationCue {
  targetId: string;    // Tham chiếu đến ID của node hoặc layer
  verb: AnimationVerb;
  startTau: number;    // % thời gian bắt đầu (0.0 đến 1.0)
  endTau: number;      // % thời gian kết thúc
  color?: string;
}

export interface MathLayer {
  type: CoreArchetype;
  params: Record<string, any>;
}

export interface MathDeclarativeSpec {
  scientificDomain?: ScientificDomain;
  grid?: MathCoordinateGrid;    // Tùy chọn
  layers?: MathLayer[];         // Danh sách các layer
  nodes: MathAstNode[];         // Kết quả render AST thuần
  animations?: MathAnimationCue[];
  telemetry?: {
    label: string;
    formula?: string;
    evalExpr?: string;
    format?: string;
    color?: string;
  }[];
}

export interface MathSemanticIntent {
  // Legacy Tier 1 (Backward Compatibility)
  template?: 'riemann' | 'tangent' | 'fourier' | 'unit_circle' | 'matrix_transform' | 'parametric' | 'function_compare' | 'custom';
  params?: Record<string, any>;
  
  // New Tier 2: Layer-based Archetypes & Verbs
  layers?: MathLayer[];
  animations?: MathAnimationCue[];
  
  // General
  title?: string;
  formula?: string;
}
