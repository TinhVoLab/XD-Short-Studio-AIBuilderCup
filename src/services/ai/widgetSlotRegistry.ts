import { normalizeLatex } from '../../utils/stem/latex';
import { PLOT_DEFAULT_DOMAIN_X, PLOT_DEFAULT_DOMAIN_Y } from '../../utils/stem/mathExpr';
import {
  WidgetSlotDefinition,
  VisualArchetype,
  HydrationContext,
  LatexFormulaSlots,
  MathPlotSlots,
  ChemicalMoleculeSlots,
  InteractiveQuizSlots,
  FlowchartSlots,
  RoadmapFlowSlots,
  ChartSlots,
  StatBigSlots,
  VsBattleSlots,
  HighlightBoxSlots,
  QuoteBoxSlots,
  SocialCalloutSlots,
  DocumentEvidenceSlots,
} from '../../types/aiSlots';
import { SceneElement } from '../../types/scene';

/**
 * ==============================================================================
 * 🏛️ WIDGET SLOT REGISTRY (SSOT - SINGLE SOURCE OF TRUTH)
 * ==============================================================================
 * Self-describing schema for all Studio widgets.
 * Automatically generates prompt guidelines for LLM & drives deterministic code hydration.
 */

export const WIDGET_SLOT_REGISTRY: Record<string, WidgetSlotDefinition> = {
  // ── 1. STEM & KHOA HỌC ──
  'latex-formula': {
    type: 'latex-formula',
    archetype: 'stem',
    description: 'Công thức toán học, vật lý hoặc hoá học hiển thị bằng ký hiệu chuẩn KaTeX/LaTeX.',
    slotProperties: {
      latex: { type: 'string', required: true, description: 'Chuỗi LaTeX chuẩn (ví dụ: "\\sin^2(x) + \\cos^2(x) = 1")' },
      badge: { type: 'string', required: false, description: 'Nhãn định lượng ngắn (ví dụ: "CÔNG THỨC VÀNG")' },
      animMode: { type: 'string', required: false, description: 'Kiểu hoạt họa: "write-on" | "laser-scan" | "pulse-glow"' },
    },
    defaultSlots: {
      latex: '\\sin^2(x) + \\cos^2(x) = 1',
      badge: 'CÔNG THỨC LƯỢNG GIÁC',
      animMode: 'write-on',
    } as LatexFormulaSlots,
    sfxDefault: { primary: 'marker', secondary: 'whoosh' },
    extractHeuristics: (prompt: string): LatexFormulaSlots => {
      const lower = prompt.toLowerCase();
      if (lower.includes('lượng giác') || lower.includes('sin') || lower.includes('cos')) {
        return { latex: '\\sin^2(x) + \\cos^2(x) = 1', badge: 'LƯỢNG GIÁC' };
      }
      if (lower.includes('pytago') || lower.includes('tam giác vuông')) {
        return { latex: 'a^2 + b^2 = c^2', badge: 'ĐỊNH LÝ PYTAGO' };
      }
      if (lower.includes('tích phân') || lower.includes('nguyên hàm')) {
        return { latex: '\\int_{a}^{b} f(x)\\,dx = F(b) - F(a)', badge: 'TÍCH PHÂN' };
      }
      if (lower.includes('einstein') || lower.includes('năng lượng') || lower.includes('e=mc')) {
        return { latex: 'E = m c^2', badge: 'THUYẾT TƯƠNG ĐỐI' };
      }
      // Không khớp chủ đề → rỗng: cổng kiểm tra thay bằng thẻ chữ, không chèn công thức mẫu lạc đề
      return { latex: '' };
    },
    hydrate: (slots: LatexFormulaSlots, ctx: HydrationContext): Partial<SceneElement> => ({
      type: 'latex-formula',
      width: Math.min(360, ctx.canvasWidth * 0.88),
      latexData: {
        latex: normalizeLatex(slots.latex || ''),
        badge: slots.badge || '',
        animMode: (slots.animMode as any) || 'write-on',
        fontSize: 24,
      },
      showCardBg: true,
      color: ctx.accentColor,
    }),
  },

  'math-plot': {
    type: 'math-plot',
    archetype: 'stem',
    description: 'Đồ thị hàm số toán học 2D tương tác chuẩn giải tích, hỗ trợ tiếp tuyến và diện tích.',
    slotProperties: {
      expression: { type: 'string', required: true, description: 'Hàm toán học theo x (ví dụ: "0.25 * x^3 - x" hoặc "sin(x)")' },
      latexLabel: { type: 'string', required: false, description: 'Nhãn công thức hiển thị góc trên đồ thị' },
      mode: { type: 'string', required: false, description: 'Chế độ: "function" | "trig_circle" | "calculus_area"' },
      domainX: { type: 'array', required: false, description: 'Khoảng [min, max] trục X, mặc định [-5, 5]' },
      domainY: { type: 'array', required: false, description: 'Khoảng [min, max] trục Y, mặc định [-2.5, 2.5]' },
    },
    defaultSlots: {
      expression: '0.25 * x^3 - x',
      latexLabel: 'y = \\frac{1}{4}x^3 - x',
      mode: 'function',
      domainX: PLOT_DEFAULT_DOMAIN_X,
      domainY: PLOT_DEFAULT_DOMAIN_Y,
    } as MathPlotSlots,
    sfxDefault: { primary: 'whoosh', secondary: 'pop' },
    extractHeuristics: (prompt: string): MathPlotSlots => {
      const lower = prompt.toLowerCase();
      if (lower.includes('sin') || lower.includes('cos') || lower.includes('lượng giác')) {
        return { expression: 'sin(x)', latexLabel: 'y = \\sin(x)', mode: 'trig_circle' };
      }
      if (lower.includes('parabol') || lower.includes('bậc 2') || lower.includes('x^2')) {
        return { expression: 'x^2 - 2', latexLabel: 'y = x^2 - 2', mode: 'function' };
      }
      if (lower.includes('tích phân') || lower.includes('diện tích')) {
        return { expression: '0.5 * x^2', latexLabel: 'S = \\int f(x)dx', mode: 'calculus_area' };
      }
      return { expression: '0.25 * x^3 - x', latexLabel: 'y = f(x)', mode: 'function' };
    },
    hydrate: (slots: MathPlotSlots, ctx: HydrationContext): Partial<SceneElement> => ({
      type: 'math-plot',
      width: Math.min(360, ctx.canvasWidth * 0.88),
      // Không tự chèn biểu thức mẫu: thiếu/sai thì validateStemElement chặn ở sceneSlotHydrator
      mathData: {
        mode: slots.mode || 'function',
        domainX: slots.domainX || PLOT_DEFAULT_DOMAIN_X,
        domainY: slots.domainY || PLOT_DEFAULT_DOMAIN_Y,
        expression: slots.expression || '',
        latexLabel: slots.latexLabel || '',
        showTangent: true,
        showGrid: true,
        showAxes: true,
        color: ctx.accentColor,
      },
      showCardBg: true,
    }),
  },

  'chemical-molecule': {
    type: 'chemical-molecule',
    archetype: 'stem',
    description: 'Cấu trúc phân tử hoá học 2D (SMILES và công thức tra từ PubChem).',
    slotProperties: {
      name: { type: 'string', required: true, description: 'Tên tiếng Anh hoặc IUPAC để tra PubChem (ví dụ: Caffeine, Ethanol, Glucose)' },
      displayName: { type: 'string', required: false, description: 'Tên hiển thị tiếng Việt' },
    },
    // Mẫu chèn tay: dữ liệu đã đối chiếu PubChem (CID)
    defaultSlots: {
      name: 'Caffeine',
      displayName: 'Caffeine',
      formula: 'C8H10N4O2',
      smiles: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C',
      pubchemCid: 2519,
      theme: 'neon',
    } as ChemicalMoleculeSlots,
    sfxDefault: { primary: 'pop', secondary: 'whoosh' },
    // Chỉ nhận chất có sẵn dữ liệu PubChem; không khớp → slot rỗng để cổng kiểm tra thay bằng thẻ chữ
    extractHeuristics: (prompt: string): ChemicalMoleculeSlots => {
      const lower = prompt.toLowerCase();
      if (lower.includes('nước') || lower.includes('h2o')) {
        return { name: 'Water', displayName: 'Nước', formula: 'H2O', smiles: 'O', pubchemCid: 962 };
      }
      if (lower.includes('rượu') || lower.includes('ethanol') || lower.includes('c2h5oh')) {
        return { name: 'Ethanol', displayName: 'Ethanol', formula: 'C2H6O', smiles: 'CCO', pubchemCid: 702 };
      }
      if (lower.includes('aspirin')) {
        return { name: 'Aspirin', displayName: 'Aspirin', formula: 'C9H8O4', smiles: 'CC(=O)OC1=CC=CC=C1C(=O)O', pubchemCid: 2244 };
      }
      if (lower.includes('caffeine') || lower.includes('caffein') || lower.includes('cà phê')) {
        return { name: 'Caffeine', displayName: 'Caffeine', formula: 'C8H10N4O2', smiles: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C', pubchemCid: 2519 };
      }
      return { name: '' };
    },
    // Không tự chèn Caffeine khi thiếu dữ liệu: validateStemElement chặn ở sceneSlotHydrator
    hydrate: (slots: ChemicalMoleculeSlots, ctx: HydrationContext): Partial<SceneElement> => ({
      type: 'chemical-molecule',
      width: Math.min(360, ctx.canvasWidth * 0.88),
      chemData: {
        name: slots.displayName || slots.name || '',
        lookupName: slots.name || '',
        formula: slots.formula || '',
        smiles: slots.smiles || '',
        pubchemCid: slots.pubchemCid,
        theme: (slots.theme as any) || 'neon',
      },
      showCardBg: true,
      color: ctx.accentColor,
    }),
  },

  'interactive-quiz': {
    type: 'interactive-quiz',
    archetype: 'stem',
    description: 'Thẻ câu hỏi đố vui tương tác, câu hỏi trắc nghiệm A/B/C/D kèm giải thích.',
    slotProperties: {
      question: { type: 'string', required: true, description: 'Nội dung câu hỏi ngắn' },
      options: { type: 'array', required: true, description: 'Mảng các lựa chọn { id, text }' },
      correctId: { type: 'string', required: true, description: 'ID của phương án đúng' },
      explanation: { type: 'string', required: false, description: 'Giải thích ngắn gọn lý do đúng' },
    },
    defaultSlots: {
      question: 'Góc phần tư nào có sin(x) > 0 và cos(x) < 0?',
      options: [
        { id: 'A', text: 'Góc phần tư I' },
        { id: 'B', text: 'Góc phần tư II' },
        { id: 'C', text: 'Góc phần tư III' },
      ],
      correctId: 'B',
      explanation: 'Ở góc phần tư thứ II (90° đến 180°), sin dương và cos âm.',
    } as InteractiveQuizSlots,
    sfxDefault: { primary: 'pop', secondary: 'kaching' },
    extractHeuristics: (prompt: string): InteractiveQuizSlots => ({
      question: prompt.slice(0, 80) || 'Đâu là khẳng định chính xác nhất?',
      options: [
        { id: 'A', text: 'Đáp án A' },
        { id: 'B', text: 'Đáp án B' },
        { id: 'C', text: 'Đáp án C' },
      ],
      correctId: 'A',
      explanation: 'Khẳng định A được chứng minh bằng quy luật thực tế.',
    }),
    hydrate: (slots: InteractiveQuizSlots, ctx: HydrationContext): Partial<SceneElement> => ({
      type: 'interactive-quiz',
      width: Math.min(360, ctx.canvasWidth * 0.88),
      quizData: {
        question: slots.question,
        options: slots.options.map(o => ({ id: o.id, text: o.text })),
        correctId: slots.correctId,
        explanation: slots.explanation,
      },
      showCardBg: true,
      color: ctx.accentColor,
    }),
  },

  // ── 2. SƠ ĐỒ & LUỒNG (DIAGRAM) ──
  'flowchart': {
    type: 'flowchart',
    archetype: 'diagram',
    description: 'Sơ đồ khối quy trình chuẩn từ bước 1 đến bước n kèm phụ đề.',
    slotProperties: {
      steps: { type: 'array', required: true, description: 'Danh sách 3-4 bước: { title, subtitle }' },
    },
    defaultSlots: {
      steps: [
        { title: 'Thu thập thông số', subtitle: 'Ghi nhận biến thiên ban đầu' },
        { title: 'Xử lý vi phân', subtitle: 'Tìm đạo hàm hàm số' },
        { title: 'Đúc kết kết luận', subtitle: 'Khảo sát cực trị' },
      ],
    } as FlowchartSlots,
    sfxDefault: { primary: 'whoosh', secondary: 'pop' },
    extractHeuristics: (prompt: string): FlowchartSlots => {
      const words = prompt.split(/[,;\n➔\->]+/).map(w => w.trim()).filter(Boolean);
      if (words.length >= 2) {
        return {
          steps: words.slice(0, 4).map((w, idx) => ({
            title: `Bước ${idx + 1}: ${w}`,
            subtitle: `Thực hiện ${w.toLowerCase()}`,
          })),
        };
      }
      return {
        steps: [
          { title: 'Khởi đầu quy trình', subtitle: 'Thiết lập tham số ban đầu' },
          { title: 'Tối ưu hoá dữ liệu', subtitle: 'Chuyển đổi thuật toán' },
          { title: 'Đạt kết quả tối ưu', subtitle: 'Hoàn thành chu trình' },
        ],
      };
    },
    hydrate: (slots: FlowchartSlots, ctx: HydrationContext): Partial<SceneElement> => ({
      type: 'flowchart',
      width: Math.min(360, ctx.canvasWidth * 0.88),
      flowSteps: slots.steps?.map(s => ({
        id: Math.random().toString(36).substring(2, 7),
        title: s.title,
        subtitle: s.subtitle || '',
      })) || [],
      showCardBg: true,
      color: ctx.accentColor,
    }),
  },

  'roadmap-flow': {
    type: 'roadmap-flow',
    archetype: 'diagram',
    description: 'Lộ trình phát triển hoặc mốc thời gian theo từng chặng.',
    slotProperties: {
      milestones: { type: 'array', required: true, description: 'Các mốc: { phase, title, time }' },
    },
    defaultSlots: {
      milestones: [
        { phase: 'Chặng 1', title: 'Xây dựng nền tảng', time: 'Tuần 1' },
        { phase: 'Chặng 2', title: 'Tăng tốc phát triển', time: 'Tuần 2-3' },
        { phase: 'Chặng 3', title: 'Về đích & Tối ưu', time: 'Tuần 4' },
      ],
    } as RoadmapFlowSlots,
    sfxDefault: { primary: 'whoosh', secondary: 'marker' },
    extractHeuristics: (): RoadmapFlowSlots => ({
      milestones: [
        { phase: 'Giai đoạn 1', title: 'Khảo sát bài toán', time: 'Bước đầu' },
        { phase: 'Giai đoạn 2', title: 'Áp dụng công thức', time: 'Thực thi' },
        { phase: 'Giai đoạn 3', title: 'Kiểm tra nghiệm', time: 'Hoàn tất' },
      ],
    }),
    hydrate: (slots: RoadmapFlowSlots, ctx: HydrationContext): Partial<SceneElement> => ({
      type: 'roadmap-flow',
      width: Math.min(360, ctx.canvasWidth * 0.88),
      roadmapFlowData: {
        milestones: slots.milestones.map((m, idx) => ({
          id: `ms-${idx}`,
          stage: m.phase,
          title: m.title,
          subLabel: m.time,
        })),
      },
      showCardBg: true,
      color: ctx.accentColor,
    }),
  },

  // ── 3. BIỂU ĐỒ & SỐ LIỆU (CHART) ──
  'chart-bar': {
    type: 'chart-bar',
    archetype: 'chart',
    description: 'Biểu đồ cột so sánh định lượng giữa các đối tượng hoặc chỉ số.',
    slotProperties: {
      chartData: { type: 'array', required: true, description: 'Mảng { label, value, unit }' },
    },
    defaultSlots: {
      chartData: [
        { label: 'Cách cũ', value: 35, unit: '%' },
        { label: 'Thử nghiệm', value: 68, unit: '%' },
        { label: 'Tối ưu mới', value: 96, unit: '%' },
      ],
    } as ChartSlots,
    sfxDefault: { primary: 'whoosh', secondary: 'kaching' },
    extractHeuristics: (): ChartSlots => ({
      chartData: [
        { label: 'Nhóm A', value: 40 },
        { label: 'Nhóm B', value: 75 },
        { label: 'Nhóm C', value: 92 },
      ],
    }),
    hydrate: (slots: ChartSlots, ctx: HydrationContext): Partial<SceneElement> => ({
      type: 'chart-bar',
      width: Math.min(360, ctx.canvasWidth * 0.88),
      chartData: slots.chartData?.map(d => ({
        label: d.label,
        value: d.value,
        color: ctx.accentColor,
      })) || [],
      showCardBg: true,
      color: ctx.accentColor,
    }),
  },

  'stat-big': {
    type: 'stat-big',
    archetype: 'chart',
    description: 'Con số thống kê khổng lồ gây ấn tượng thị giác mạnh kèm nhãn giải thích.',
    slotProperties: {
      statValue: { type: 'string', required: true, description: 'Con số định lượng (ví dụ: "99.8%", "10x", "+250%")' },
      statLabel: { type: 'string', required: true, description: 'Nhãn mô tả con số' },
      subLabel: { type: 'string', required: false, description: 'Thông tin chú thích phụ' },
    },
    defaultSlots: {
      statValue: '99.4%',
      statLabel: 'Độ chính xác mô phỏng',
      subLabel: 'Kiểm nghiệm trên 10.000 mẫu',
    } as StatBigSlots,
    sfxDefault: { primary: 'kaching', secondary: 'pop' },
    extractHeuristics: (prompt: string): StatBigSlots => {
      const match = prompt.match(/(\d+[\d,.]*[%xXkKmMbB+]*)/);
      const val = match ? match[1] : '85%';
      return {
        statValue: val,
        statLabel: prompt.replace(val, '').trim().slice(0, 30) || 'Chỉ số cải thiện',
        subLabel: 'Kết quả đo lường thực tế',
      };
    },
    hydrate: (slots: StatBigSlots, ctx: HydrationContext): Partial<SceneElement> => ({
      type: 'stat-big',
      width: Math.min(360, ctx.canvasWidth * 0.88),
      statValue: slots.statValue,
      statLabel: slots.statLabel,
      subtitle: slots.subLabel,
      showCardBg: true,
      color: ctx.accentColor,
    }),
  },

  // ── 4. SO SÁNH & ĐỐI ĐẦU (COMPARISON) ──
  'vs-battle': {
    type: 'vs-battle',
    archetype: 'comparison',
    description: 'Thẻ so sánh đối đầu trực diện giữa 2 lựa chọn (Cũ vs Mới, A vs B).',
    slotProperties: {
      leftTitle: { type: 'string', required: true, description: 'Tên bên trái (ví dụ: "Cách cũ")' },
      rightTitle: { type: 'string', required: true, description: 'Tên bên phải (ví dụ: "Phương pháp mới")' },
      criteria: { type: 'array', required: false, description: 'Các tiêu chí so sánh đối chiếu' },
    },
    defaultSlots: {
      leftTitle: 'Phương pháp cũ',
      rightTitle: 'Công thức mới',
      criteria: [
        { label: 'Thời gian tính', leftVal: '15 phút', rightVal: '10 giây' },
        { label: 'Độ chính xác', leftVal: '65%', rightVal: '99%' },
      ],
    } as VsBattleSlots,
    sfxDefault: { primary: 'boom', secondary: 'whoosh' },
    extractHeuristics: (prompt: string): VsBattleSlots => {
      const parts = prompt.split(/vs|so với|và/i);
      if (parts.length >= 2) {
        return {
          leftTitle: parts[0].trim().slice(0, 20),
          rightTitle: parts[1].trim().slice(0, 20),
        };
      }
      return {
        leftTitle: 'Lựa chọn A',
        rightTitle: 'Lựa chọn B',
      };
    },
    hydrate: (slots: VsBattleSlots, ctx: HydrationContext): Partial<SceneElement> => ({
      type: 'vs-battle',
      width: Math.min(360, ctx.canvasWidth * 0.88),
      vsBattle: {
        leftSubject: { name: slots.leftTitle },
        rightSubject: { name: slots.rightTitle },
        rounds: slots.criteria?.map(c => ({
          criterion: c.label,
          winner: 'right' as const,
          leftValue: c.leftVal,
          rightValue: c.rightVal,
        })) || [],
      },
      showCardBg: true,
      color: ctx.accentColor,
    }),
  },

  // ── 5. DANH SÁCH & LỜI KHUYÊN (BULLETS) ──
  'highlight-box': {
    type: 'highlight-box',
    archetype: 'bullets',
    description: 'Hộp đúc kết các điểm then chốt (danh sách 3 gạch đầu dòng đánh số "01", "02").',
    slotProperties: {
      items: { type: 'array', required: true, description: 'Danh sách 3 điểm cốt lõi' },
      variant: { type: 'string', required: false, description: '"bullet-list" (nhiều ý) | "callout-card" (1 câu đúc kết) | "multi-pill" (từ khoá ngắn) | "glow-pill" (câu kêu gọi hành động)' },
    },
    defaultSlots: {
      items: [
        'Nắm vững định nghĩa và tính chất cơ bản',
        'Vẽ hình phác thảo để hình dung trực quan',
        'Áp dụng công thức vào các trường hợp đặc biệt',
      ],
      variant: 'bullet-list',
    } as HighlightBoxSlots,
    sfxDefault: { primary: 'whoosh', secondary: 'pop' },
    extractHeuristics: (prompt: string): HighlightBoxSlots => {
      const lines = prompt.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
      if (lines.length >= 2) {
        return { items: lines.slice(0, 3) };
      }
      return {
        items: [
          'Ghi nhớ quy tắc dấu trong từng góc',
          'Biến đổi góc phức tạp về góc đặc biệt',
          'Kiểm tra lại kết quả trên máy tính',
        ],
      };
    },
    // Component đọc `content` (mỗi ý một dòng); màu accent vào accentColor, chữ để theo --text của theme
    hydrate: (slots: HighlightBoxSlots, ctx: HydrationContext): Partial<SceneElement> => ({
      type: 'highlight-box',
      width: Math.min(360, ctx.canvasWidth * 0.88),
      content: (slots.items || []).map(item => String(item).trim()).filter(Boolean).join('\n'),
      variant: slots.variant && slots.variant !== 'auto' ? slots.variant : undefined,
      showCardBg: true,
      accentColor: ctx.accentColor,
    }),
  },

  // ── 6. BẰNG CHỨNG & TRÍCH DẪN (GENERAL) ──
  'quote-box': {
    type: 'quote-box',
    archetype: 'general',
    description: 'Thẻ trích dẫn câu danh ngôn, phát biểu hoặc đúc kết đắt giá.',
    slotProperties: {
      content: { type: 'string', required: true, description: 'Nội dung câu nói hoặc trích dẫn' },
      author: { type: 'string', required: false, description: 'Tên tác giả hoặc nguồn' },
    },
    defaultSlots: {
      content: 'Bản chất của toán học là sự tự do tuyệt đối của tư duy logic.',
      author: 'Georg Cantor',
    } as QuoteBoxSlots,
    sfxDefault: { primary: 'marker', secondary: 'whoosh' },
    extractHeuristics: (prompt: string): QuoteBoxSlots => ({
      content: prompt.replace(/trích dẫn|nói rằng/gi, '').trim().slice(0, 100) || 'Đơn giản hoá là đỉnh cao của sự tinh vi.',
      author: 'Chuyên gia',
    }),
    hydrate: (slots: QuoteBoxSlots, ctx: HydrationContext): Partial<SceneElement> => ({
      type: 'quote-box',
      width: Math.min(360, ctx.canvasWidth * 0.88),
      content: slots.content,
      subtitle: slots.author || '',
      showCardBg: true,
      color: ctx.accentColor,
    }),
  },

  // ── 7. BẰNG CHỨNG XÃ HỘI & SỐ DƯ (COMPARISON) ──
  'social-callout': {
    type: 'social-callout',
    archetype: 'comparison',
    description: 'Thẻ bằng chứng xã hội: nổ biến động số dư ngân hàng (bank), tweet chuyên gia (tweet), tin nhắn chốt đơn (chat).',
    slotProperties: {
      variant: { type: 'string', required: false, description: '"bank" | "tweet" | "chat" | "news"' },
      accountName: { type: 'string', required: true, description: 'Tên tài khoản hoặc nguồn' },
      message: { type: 'string', required: true, description: 'Nội dung thông báo hoặc tin nhắn' },
      amount: { type: 'string', required: false, description: 'Số tiền biến động (nếu là bank, ví dụ "+50,000,000 đ")' },
    },
    defaultSlots: {
      variant: 'bank',
      accountName: 'Vietcombank Digital',
      message: 'Lợi nhuận kinh doanh Q4 chuyển khoản',
      amount: '+125,000,000 đ',
    } as SocialCalloutSlots,
    sfxDefault: { primary: 'kaching', secondary: 'pop' },
    extractHeuristics: (prompt: string): SocialCalloutSlots => {
      const isBank = /tiền|số dư|ngân hàng|chuyển khoản|doanh thu/i.test(prompt);
      const isTweet = /tweet|twitter|x\.com|kols|elon musk/i.test(prompt);
      if (isBank) {
        return {
          variant: 'bank',
          accountName: 'Ngân hàng số',
          message: prompt.slice(0, 40) || 'Tiền về tài khoản',
          amount: '+88,000,000 đ',
        };
      }
      if (isTweet) {
        return {
          variant: 'tweet',
          accountName: 'Chuyên gia Công nghệ',
          message: prompt.slice(0, 60) || 'Tương lai thuộc về những ai làm chủ công nghệ.',
        };
      }
      return {
        variant: 'chat',
        accountName: 'Khách hàng VIP',
        message: prompt.slice(0, 45) || 'Dự án này làm xuất sắc ngoài mong đợi!',
      };
    },
    hydrate: (slots: SocialCalloutSlots, ctx: HydrationContext): Partial<SceneElement> => {
      const variant = slots.variant || 'bank';
      const isBank = variant === 'bank';
      const calloutAccent = isBank ? '#00D46A' : variant === 'tweet' ? '#1DA1F2' : ctx.accentColor;

      return {
        type: 'social-callout',
        width: Math.min(340, Math.round(ctx.canvasWidth * 0.88)),
        height: 140,
        accentColor: calloutAccent,
        calloutData: {
          variant,
          title: slots.amount || slots.accountName || '',
          subtitle: isBank ? slots.accountName : undefined,
          content: slots.message || '',
          badge: isBank ? 'THÀNH CÔNG' : variant === 'tweet' ? 'VERIFIED' : undefined,
          accentColor: calloutAccent,
        },
      };
    },
  },

  // ── 8. BẰNG CHỨNG TÀI LIỆU (GENERAL) ──
  'document-evidence': {
    type: 'document-evidence',
    archetype: 'general',
    description: 'Thẻ bằng chứng tài liệu giấy tờ: văn bản tô dạ quang (highlighter), con dấu đỏ mật (stamp).',
    slotProperties: {
      variant: { type: 'string', required: false, description: '"highlighter" | "stamp" | "note"' },
      docTitle: { type: 'string', required: true, description: 'Tiêu đề tài liệu hoặc hợp đồng' },
      highlightedText: { type: 'string', required: true, description: 'Đoạn văn bản then chốt được tô sáng' },
      stampText: { type: 'string', required: false, description: 'Chữ trên con dấu đỏ (ví dụ: "TUYỆT MẬT", "ĐÃ DUYỆT")' },
    },
    defaultSlots: {
      variant: 'highlighter',
      docTitle: 'Báo cáo Thẩm định Kỹ thuật',
      highlightedText: 'Hiệu suất tăng trưởng 320% sau khi áp dụng kiến trúc TypeSafe.',
      stampText: 'ĐÃ DUYỆT',
    } as DocumentEvidenceSlots,
    sfxDefault: { primary: 'marker', secondary: 'whoosh' },
    extractHeuristics: (prompt: string): DocumentEvidenceSlots => ({
      variant: /dấu đỏ|mật|phê duyệt/i.test(prompt) ? 'stamp' : 'highlighter',
      docTitle: 'Tài liệu Chứng minh',
      highlightedText: prompt.slice(0, 80) || 'Số liệu được kiểm chứng độc lập.',
      stampText: 'ĐÃ XÁC NHẬN',
    }),
    hydrate: (slots: DocumentEvidenceSlots, ctx: HydrationContext): Partial<SceneElement> => ({
      type: 'document-evidence',
      width: Math.min(340, Math.round(ctx.canvasWidth * 0.88)),
      height: 150,
      accentColor: slots.variant === 'stamp' ? '#FF2A2A' : '#FFE600',
      docData: {
        variant: slots.variant || 'highlighter',
        title: slots.variant === 'stamp' ? (slots.stampText || slots.docTitle || '') : (slots.docTitle || ''),
        highlight: slots.highlightedText || '',
        stampVariant: 'approved-circle',
        content: slots.highlightedText || '',
      },
    }),
  },
};

/**
 * Get a slot definition by widget type
 */
export function getWidgetSlotDef(type: string): WidgetSlotDefinition | undefined {
  return WIDGET_SLOT_REGISTRY[type];
}

/**
 * Get all registered widget slot definitions
 */
export function getAllWidgetSlotDefs(): WidgetSlotDefinition[] {
  return Object.values(WIDGET_SLOT_REGISTRY);
}

/**
 * Find the most suitable widget definition for a given archetype
 */
export function getWidgetDefsByArchetype(archetype: VisualArchetype): WidgetSlotDefinition[] {
  return Object.values(WIDGET_SLOT_REGISTRY).filter(def => def.archetype === archetype);
}

/**
 * Automatically compile a concise slot-filling guideline for LLM System Prompt.
 * This runs at runtime, completely eliminating hardcoded widget lists in AI route files.
 */
export function compileSlotPromptCatalog(): string {
  const lines: string[] = ['### STUDIO WIDGET CATALOG & SLOT SPECIFICATIONS:'];
  
  for (const def of Object.values(WIDGET_SLOT_REGISTRY)) {
    const propsDesc = Object.entries(def.slotProperties)
      .map(([k, v]) => `    * "${k}" (${v.type}${v.required ? ', required' : ''}): ${v.description}`)
      .join('\n');

    lines.push(`- **${def.type}** (Archetype: "${def.archetype}"): ${def.description}\n  Slots Schema:\n${propsDesc}`);
  }

  return lines.join('\n\n');
}
