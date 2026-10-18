import { MathDeclarativeSpec, MathSemanticIntent } from './mathAstTypes';

/**
 * Tier 1: Template Engine - Curated high-precision mathematical presets
 * Ensures 100% mathematical rigor for classic edutainment math topics
 */
export function resolveFromTemplate(intent: MathSemanticIntent): MathDeclarativeSpec | null {
  if (!intent || !intent.template) return null;

  const t = intent.template;
  const p = intent.params || {};

  switch (t) {
    case 'riemann': {
      const expr = p.expr || 'x^2 - 2';
      const a = typeof p.a === 'number' ? p.a : 0;
      const b = typeof p.b === 'number' ? p.b : 2.5;
      const nMin = typeof p.nMin === 'number' ? p.nMin : 4;
      const nMax = typeof p.nMax === 'number' ? p.nMax : 48;
      const method = p.method || 'mid';

      return {
        grid: {
          xRange: [Math.floor(a) - 1, Math.ceil(b) + 1],
          yRange: [-3, 6],
          step: 1,
          showNumbers: true,
        },
        nodes: [
          { type: 'grid', spec: { xRange: [Math.floor(a) - 1, Math.ceil(b) + 1], yRange: [-3, 6], step: 1, showNumbers: true } },
          {
            type: 'riemann',
            expr,
            a,
            b,
            nMin,
            nMax,
            method,
            color: '#BEFF01',
          },
          {
            type: 'plot',
            expr,
            color: '#FFFFFF',
            width: 2.5,
          },
          {
            type: 'label',
            text: 'TÍCH PHÂN RIEMANN: S = \\int_a^b f(x)dx',
            at: 'top-left',
            formula: `\\int_{${a}}^{${b}} (${expr}) dx`,
          },
        ],
        telemetry: [
          { label: 'SỐ DẢI N', evalExpr: `round(${nMin} + tau * (${nMax} - ${nMin}))`, format: 'N = {val}' },
          { label: 'ĐỘ RỘNG \\Delta x', evalExpr: `(${b} - ${a}) / round(${nMin} + tau * (${nMax} - ${nMin}))`, format: '\\Delta x = {val}' },
          { label: 'TIẾN TRÌNH', evalExpr: 'round(tau * 100)', format: '{val}%' },
          { label: 'TRẠNG THÁI', evalExpr: 'tau >= 0.85 ? 1 : 0', format: 'HỘI TỤ DIỆN TÍCH' },
        ],
      };
    }

    case 'tangent': {
      const expr = p.expr || '0.25 * x^3 - x';
      const xRange: [number, number] = p.xRange || [-3, 3];
      const yRange: [number, number] = p.yRange || [-3, 3];

      return {
        grid: {
          xRange,
          yRange,
          step: 1,
          showNumbers: true,
        },
        nodes: [
          { type: 'grid', spec: { xRange, yRange, step: 1, showNumbers: true } },
          {
            type: 'plot',
            expr,
            color: '#00D4FF',
            width: 2.5,
          },
          {
            type: 'tangent',
            expr,
            atX: `(${xRange[0]} + 0.5) + tau * (${xRange[1]} - ${xRange[0]} - 1)`,
            length: 1.8,
            color: '#BEFF01',
            showSecant: true,
          },
          {
            type: 'label',
            text: 'ĐẠO HÀM: f\'(x) = \\lim_{\\Delta x \\to 0} \\frac{\\Delta y}{\\Delta x}',
            at: 'top-left',
            formula: 'f\'(x) = \\text{Hệ số góc tiếp tuyến}',
          },
        ],
        telemetry: [
          { label: 'TỌA ĐỘ x_0', evalExpr: `(${xRange[0]} + 0.5) + tau * (${xRange[1]} - ${xRange[0]} - 1)`, format: 'x = {val}' },
          { label: 'ĐẠO HÀM f\'(x)', evalExpr: '0.75 * ((-2.5 + tau * 5)^2) - 1', format: 'slope = {val}' },
          { label: 'TIẾP TUYẾN', evalExpr: '1', format: 'ĐANG LƯỚT 60 FPS' },
          { label: 'GIẢI TÍCH', evalExpr: '1', format: 'LEIBNIZ & NEWTON' },
        ],
      };
    }

    case 'fourier': {
      const epicycles = p.epicycles || [
        { radius: 1.2, freq: 1, phase: 0 },
        { radius: 0.4, freq: 3, phase: 0 },
        { radius: 0.24, freq: 5, phase: 0 },
        { radius: 0.17, freq: 7, phase: 0 },
      ];

      return {
        grid: {
          xRange: [-2.5, 2.5],
          yRange: [-2.5, 2.5],
          step: 1,
          showNumbers: false,
        },
        nodes: [
          { type: 'grid', spec: { xRange: [-2.5, 2.5], yRange: [-2.5, 2.5], step: 1, showNumbers: false } },
          {
            type: 'fourier',
            epicycles,
            traceColor: '#BEFF01',
          },
          {
            type: 'label',
            text: 'CHUỖI FOURIER: f(t) = \\sum c_n e^{i n \\omega t}',
            at: 'top-left',
            formula: '\\text{Sóng vuông} = \\sum \\frac{4}{\\pi(2k-1)} \\sin((2k-1)t)',
          },
        ],
        telemetry: [
          { label: 'SỐ SÓNG HÀI', evalExpr: `${epicycles.length}`, format: 'N = {val}' },
          { label: 'TẦN SỐ CƠ BẢN', evalExpr: '1', format: '\\omega_0 = 1 Hz' },
          { label: 'ĐẦU MÚT VÒNG', evalExpr: 'round(tau * 360)', format: '\\theta = {val}°' },
          { label: 'FOURIER TRANSFORM', evalExpr: '1', format: 'PHÂN RÃ TẦN SỐ' },
        ],
      };
    }

    case 'unit_circle': {
      return {
        grid: {
          xRange: [-1.8, 1.8],
          yRange: [-1.8, 1.8],
          step: 0.5,
          showNumbers: true,
        },
        nodes: [
          { type: 'grid', spec: { xRange: [-1.8, 1.8], yRange: [-1.8, 1.8], step: 0.5, showNumbers: true } },
          {
            type: 'unit_circle',
            showSin: true,
            showCos: true,
            showTan: false,
            color: '#00D4FF',
          },
          {
            type: 'vector',
            x1: 0,
            y1: 0,
            x2: 'cos(tau * 2 * pi)',
            y2: 'sin(tau * 2 * pi)',
            label: 'Vector r=1',
            color: '#BEFF01',
            width: 2.5,
          },
          {
            type: 'label',
            text: 'ĐƯỜNG TRÒN LƯỢNG GIÁC: \\cos^2(\\theta) + \\sin^2(\\theta) = 1',
            at: 'top-left',
            formula: 'x = \\cos(\\theta), \\quad y = \\sin(\\theta)',
          },
        ],
        telemetry: [
          { label: 'GÓC QUAY \\theta', evalExpr: 'round(tau * 360)', format: '{val}°' },
          { label: 'GIÁ TRỊ \\cos(\\theta)', evalExpr: 'cos(tau * 2 * pi)', format: 'cos = {val}' },
          { label: 'GIÁ TRỊ \\sin(\\theta)', evalExpr: 'sin(tau * 2 * pi)', format: 'sin = {val}' },
          { label: 'HÌNH HỌC', evalExpr: '1', format: 'BÁN KÍNH r=1' },
        ],
      };
    }

    case 'matrix_transform': {
      // 2D Rotation & Shear matrix: [[cos(a), -sin(a)], [sin(a), cos(a)]]
      return {
        grid: {
          xRange: [-3, 3],
          yRange: [-3, 3],
          step: 1,
          showNumbers: true,
        },
        nodes: [
          {
            type: 'matrix_grid',
            matrix: [
              'cos(tau * 0.5 * pi)',
              '-0.5 * sin(tau * pi)',
              '0.5 * sin(tau * pi)',
              'cos(tau * 0.5 * pi)',
            ],
            color: '#BEFF01',
          },
          {
            type: 'vector',
            x1: 0,
            y1: 0,
            x2: 'cos(tau * 0.5 * pi)',
            y2: '0.5 * sin(tau * pi)',
            label: 'i_hat',
            color: '#00D4FF',
            width: 3,
          },
          {
            type: 'vector',
            x1: 0,
            y1: 0,
            x2: '-0.5 * sin(tau * pi)',
            y2: 'cos(tau * 0.5 * pi)',
            label: 'j_hat',
            color: '#FF7043',
            width: 3,
          },
          {
            type: 'label',
            text: 'ĐẠI SỐ TUYẾN TÍNH: T(\\vec{v}) = A \\cdot \\vec{v}',
            at: 'top-left',
            formula: '\\det(A) = \\text{Hệ số co giãn diện tích}',
          },
        ],
        telemetry: [
          { label: 'VECTOR i_hat', evalExpr: 'cos(tau * 0.5 * pi)', format: 'i_x = {val}' },
          { label: 'VECTOR j_hat', evalExpr: 'cos(tau * 0.5 * pi)', format: 'j_y = {val}' },
          { label: 'ĐỊNH THỨC det(A)', evalExpr: '(cos(tau * 0.5 * pi)^2) + (0.25 * sin(tau * pi)^2)', format: 'det = {val}' },
          { label: 'KHÔNG GIAN', evalExpr: '1', format: 'BIẾN ĐỔI TUYẾN TÍNH' },
        ],
      };
    }

    case 'function_compare': {
      const expr1 = p.expr1 || 'sin(x)';
      const expr2 = p.expr2 || 'x - (x^3)/6'; // Taylor poly order 3
      return {
        grid: {
          xRange: [-3.5, 3.5],
          yRange: [-2.5, 2.5],
          step: 1,
          showNumbers: true,
        },
        nodes: [
          { type: 'grid', spec: { xRange: [-3.5, 3.5], yRange: [-2.5, 2.5], step: 1, showNumbers: true } },
          {
            type: 'plot',
            expr: expr1,
            color: '#FFFFFF',
            width: 2.5,
          },
          {
            type: 'plot',
            expr: expr2,
            color: '#BEFF01',
            width: 2,
            drawProgress: true,
          },
          {
            type: 'label',
            text: 'KHAI TRIỂN TAYLOR: f(x) \\approx \\sum \\frac{f^{(n)}(0)}{n!} x^n',
            at: 'top-left',
            formula: `${expr1} \\approx ${expr2}`,
          },
        ],
        telemetry: [
          { label: 'HÀM GỐC f(x)', evalExpr: '1', format: 'sin(x)' },
          { label: 'XẤP XỈ TAYLOR', evalExpr: '3', format: 'BẬC 3' },
          { label: 'SAI SỐ TẠI x=1', evalExpr: 'abs(sin(1) - (1 - 1/6))', format: '\\epsilon = {val}' },
          { label: 'HỘI TỤ', evalExpr: 'tau >= 0.7 ? 1 : 0', format: 'VÙNG LÂN CẬN x=0' },
        ],
      };
    }

    default:
      return null;
  }
}

// ==========================================
// TIER 2: 12 CORE ARCHETYPES (LAYER-BASED)
// ==========================================

export function buildFunctionPlot(params: Record<string, any>) {
  const expr = params.expr || 'sin(x)';
  const color = params.color || '#00D4FF';
  return {
    type: 'plot' as const,
    expr,
    color,
    width: params.width || 2.5,
    drawProgress: params.drawProgress !== false,
    label: params.label || expr,
  };
}

export function buildFormulaMorph(params: Record<string, any>) {
  return {
    type: 'label' as const,
    text: params.title || 'Biến đổi công thức',
    formula: params.expr || params.formula || 'f(x) = \\dots',
    color: params.color || '#BEFF01',
    at: 'top-left' as const,
  };
}

export function buildGeometryConstruct(params: Record<string, any>) {
  if (params.shape === 'circle' || params.radius) {
    return {
      type: 'unit_circle' as const,
      color: params.color || '#00D4FF',
      showSin: Boolean(params.showSin),
      showCos: Boolean(params.showCos),
    };
  }
  if (params.x2 !== undefined || params.y2 !== undefined) {
    return {
      type: 'vector' as const,
      x1: params.x1 ?? 0,
      y1: params.y1 ?? 0,
      x2: params.x2 ?? 1,
      y2: params.y2 ?? 1,
      color: params.color || '#BEFF01',
      label: params.label,
    };
  }
  return {
    type: 'point' as const,
    x: params.x ?? 0,
    y: params.y ?? 0,
    radius: params.radius || 5,
    color: params.color || '#BEFF01',
    label: params.label,
  };
}

export function buildTransformMatrix(params: Record<string, any>) {
  return {
    type: 'matrix_grid' as const,
    matrix: params.matrix || [
      'cos(tau * 0.5 * pi)',
      '-0.5 * sin(tau * pi)',
      '0.5 * sin(tau * pi)',
      'cos(tau * 0.5 * pi)',
    ],
    color: params.color || '#BEFF01',
  };
}

export function buildProbabilitySim(params: Record<string, any>) {
  return {
    type: 'particles' as const,
    count: params.count || 65,
    distribution: params.distribution || 'exponential_altitude',
    showBrownianMotion: true,
    color: params.color || '#00D4FF',
  };
}

export function buildNumberLine(params: Record<string, any>) {
  return {
    type: 'milestone' as const,
    x: typeof params.x === 'number' ? params.x : 0,
    label: params.label || 'Vạch mốc',
    sublabel: params.sublabel,
    color: params.color || '#BEFF01',
    lineStyle: params.lineStyle || 'dashed',
  };
}

export function buildFourier(params: Record<string, any>) {
  return {
    type: 'fourier' as const,
    epicycles: params.epicycles || [
      { radius: 1.2, freq: 1, phase: 0 },
      { radius: 0.4, freq: 3, phase: 0 },
      { radius: 0.24, freq: 5, phase: 0 },
    ],
    traceColor: params.color || '#BEFF01',
  };
}

export function buildTangent(params: Record<string, any>) {
  return {
    type: 'tangent' as const,
    expr: params.expr || '0.25 * x^3 - x',
    atX: params.atX || '(-2.0 + tau * 4.0)',
    length: params.length || 1.8,
    color: params.color || '#BEFF01',
    showSecant: true,
  };
}

export function buildRiemann(params: Record<string, any>) {
  return {
    type: 'riemann' as const,
    expr: params.expr || 'x^2 - 2',
    a: params.a ?? 0,
    b: params.b ?? 2.5,
    nMin: params.nMin ?? 4,
    nMax: params.nMax ?? 36,
    method: params.method || 'mid',
    color: params.color || '#BEFF01',
  };
}

export function resolveFromLayers(
  layers: import('./mathAstTypes').MathLayer[],
  animations: import('./mathAstTypes').MathAnimationCue[] = []
): MathDeclarativeSpec {
  let nodes: any[] = [];

  // Unified Math Viewport Grid [-5, 5] x [-3, 3] default
  const grid = {
    xRange: [-4, 4] as [number, number],
    yRange: [-3, 3] as [number, number],
    step: 1,
    showNumbers: true,
  };

  nodes.push({ type: 'grid', spec: grid });

  layers.forEach((layer, idx) => {
    let node: any = null;
    const p = layer.params || {};

    switch (layer.type) {
      case 'function_plot':
        node = buildFunctionPlot(p);
        break;
      case 'formula_morph':
        node = buildFormulaMorph(p);
        break;
      case 'geometry_construct':
        node = buildGeometryConstruct(p);
        break;
      case 'transform_matrix':
        node = buildTransformMatrix(p);
        break;
      case 'probability_sim':
        node = buildProbabilitySim(p);
        break;
      case 'number_line':
        node = buildNumberLine(p);
        break;
      case 'parametric_curve':
        node = buildFourier(p);
        break;
      case 'chamber_pressure':
        node = {
          type: 'chamber',
          chamberType: p.chamberType || 'cylinder',
          liquidLevel: p.liquidLevel !== undefined ? p.liquidLevel : 0.4,
          pistonY: p.pistonY,
          showPiston: p.showPiston !== false,
          label: p.label || p.title,
        };
        break;
      case 'aerodynamic_flow':
        node = {
          type: 'streamlines',
          flowType: p.flowType || 'airfoil_lift',
          speed: p.speed || 1.0,
          showForces: p.showForces !== false,
          label: p.label || p.title,
        };
        break;
      default:
        // Check for specific sub-types in params
        if (p.method === 'tangent' || p.atX !== undefined) {
          node = buildTangent(p);
        } else if (p.method === 'riemann' || p.nMin !== undefined) {
          node = buildRiemann(p);
        } else if (p.expr) {
          node = buildFunctionPlot(p);
        } else if (p.chamberType || p.liquidLevel !== undefined) {
          node = { type: 'chamber', ...p };
        } else if (p.current !== undefined && p.max !== undefined) {
          node = { type: 'gauge', ...p };
        } else {
          node = { type: 'label', text: p.title || `Layer: ${layer.type}` };
        }
    }

    if (node) {
      node.id = p.id || `layer_${idx}_${layer.type}`;
      nodes.push(node);
    }
  });

  return {
    grid,
    layers,
    nodes,
    animations,
  };
}

export function resolveFromIntent(intent: MathSemanticIntent): MathDeclarativeSpec | null {
  if (intent.layers && intent.layers.length > 0) {
    return resolveFromLayers(intent.layers, intent.animations);
  }
  // Fallback to legacy template
  return resolveFromTemplate(intent);
}

// ── 12 KHUÔN ARCHETYPES PRESETS CHO STUDIO UI ──
export const CORE_ARCHETYPES_CATALOG = [
  {
    id: 'arch_function_plot',
    name: '1. Đồ thị hàm số (Function Plot)',
    description: 'Vẽ đồ thị động hàm số (Parabol, Sin, Đa thức) trượt theo thời gian',
    archetype: 'function_plot' as const,
    defaultParams: { expr: '0.4 * x^2 - 1.5', color: '#00D4FF', id: 'plot_1' },
    title: 'Đồ thị Parabol: y = ax^2 + bx + c',
    formula: 'y = 0.4x^2 - 1.5',
  },
  {
    id: 'arch_tangent',
    name: '2. Tiếp tuyến & Đạo hàm (Tangent / Slope)',
    description: 'Tiếp tuyến lướt trên đường cong minh họa vi phân và hệ số góc',
    archetype: 'function_plot' as const,
    secondaryArchetype: 'geometry_construct' as const,
    defaultParams: { expr: '0.25 * x^3 - x', color: '#00D4FF', id: 'curve_1' },
    extraLayer: {
      type: 'custom_ast' as const,
      params: { method: 'tangent', expr: '0.25 * x^3 - x', id: 'tangent_line' },
    },
    title: 'Đạo hàm: Hệ số góc tiếp tuyến vi phân',
    formula: 'f\'(x) = \\lim_{\\Delta x \\to 0} \\frac{\\Delta y}{\\Delta x}',
  },
  {
    id: 'arch_riemann',
    name: '3. Tích phân & Tổng Riemann (Riemann Sum)',
    description: 'Chia nhỏ diện tích dưới đường cong thành các hình chữ nhật hội tụ',
    archetype: 'function_plot' as const,
    extraLayer: {
      type: 'custom_ast' as const,
      params: { method: 'riemann', expr: 'x^2 - 2', a: 0, b: 2.5, id: 'riemann_rects' },
    },
    title: 'Tích phân Riemann: Diện tích hình phẳng',
    formula: 'S = \\int_a^b f(x)dx',
  },
  {
    id: 'arch_formula_morph',
    name: '4. Biến đổi công thức (Formula Morph)',
    description: 'Biến đổi biểu thức đại số từng bước kèm highlight vị trí thay đổi',
    archetype: 'formula_morph' as const,
    defaultParams: { expr: 'e^{i\\pi} + 1 = 0', title: 'Đẳng thức Euler kỳ diệu', id: 'euler_eq' },
    title: 'Biến đổi công thức: Đẳng thức Euler',
    formula: 'e^{i\\pi} + 1 = 0',
  },
  {
    id: 'arch_geometry',
    name: '5. Dựng hình & Vector (Geometry Construct)',
    description: 'Dựng tam giác, đường tròn, vector tọa độ trong mặt phẳng',
    archetype: 'geometry_construct' as const,
    defaultParams: { x1: 0, y1: 0, x2: 2, y2: 1.5, label: 'Vector v', id: 'vec_1' },
    title: 'Dựng hình & Vector trong không gian',
    formula: '\\vec{v} = (x_2 - x_1)\\vec{i} + (y_2 - y_1)\\vec{j}',
  },
  {
    id: 'arch_matrix',
    name: '6. Biến đổi ma trận (Matrix Transform)',
    description: 'Lưới không gian 2D bị bẻ cong, quay hoặc kéo dãn theo ma trận T(v)',
    archetype: 'transform_matrix' as const,
    defaultParams: { id: 'matrix_grid_1' },
    title: 'Đại số tuyến tính: Biến đổi không gian 2D',
    formula: 'T(\\vec{v}) = A \\cdot \\vec{v}',
  },
  {
    id: 'arch_fourier',
    name: '7. Chuỗi Fourier (Harmonic Epicycles)',
    description: 'Phân rã sóng vuông/tam giác thành các vector xoay tròn cộng dồn',
    archetype: 'parametric_curve' as const,
    defaultParams: { id: 'fourier_epicycles' },
    title: 'Chuỗi Fourier: Phân rã sóng hài tuần hoàn',
    formula: 'f(t) = \\sum c_n e^{i n \\omega t}',
  },
  {
    id: 'arch_circle',
    name: '8. Đường tròn lượng giác (Unit Circle)',
    description: 'Bán kính r=1 quay tròn tạo nên hình chiếu Sin và Cos',
    archetype: 'geometry_construct' as const,
    defaultParams: { shape: 'circle', radius: 1, showSin: true, showCos: true, id: 'unit_circle_1' },
    title: 'Đường tròn lượng giác: sin²θ + cos²θ = 1',
    formula: '\\cos^2(\\theta) + \\sin^2(\\theta) = 1',
  },
  {
    id: 'arch_particles',
    name: '9. Hạt vật lý & Xác suất (Probability Sim)',
    description: 'Chuyển động nhiệt Brown và phân phối mật độ hạt theo độ cao/thời gian',
    archetype: 'probability_sim' as const,
    defaultParams: { count: 80, distribution: 'exponential_altitude', id: 'gas_particles' },
    title: 'Mô phỏng hạt: Chuyển động nhiệt Brown',
    formula: 'P(h) = P_0 e^{-Mgh/RT}',
  },
  {
    id: 'arch_number_line',
    name: '10. Trục số & Dãy số (Number Line / Milestones)',
    description: 'Các mốc số học, dãy số Fibonacci, điểm rơi giới hạn',
    archetype: 'number_line' as const,
    defaultParams: { x: 2.5, label: 'Giới hạn L', sublabel: 'x -> x0', id: 'limit_pt' },
    title: 'Trục số & Giới hạn dãy số',
    formula: '\\lim_{n \\to \\infty} a_n = L',
  },
];

