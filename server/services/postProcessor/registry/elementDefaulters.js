import { resolveHighlightVariant, suggestHighlightIcon } from '../../../../src/config/highlightBoxLayout.js';
import { designHook } from '../../../../src/config/hookDesigner.js';
/**
 * ELEMENT DEFAULTERS & GUARD HANDLERS REGISTRY
 */

export const GUARD_HANDLERS = {
  'character-mascot': (el, ACCENT, ctx) => {
    let matchedPose = null;
    if (ctx && ctx.autoPoseRules && ctx.sceneText) {
      const textToMatch = ctx.sceneText.toLowerCase();
      // rules are sorted by the user in the UI, we evaluate in order
      // AutoPoseRule interface: { keywordPattern: string (pipe-separated), targetPose: string }
      for (const rule of ctx.autoPoseRules) {
        if (!rule.keywordPattern) continue;
        const keywords = rule.keywordPattern.split('|').map(k => k.trim().toLowerCase()).filter(k => k);
        if (keywords.some(k => textToMatch.includes(k))) {
          matchedPose = rule.targetPose;
          break;
        }
      }
    }
    if (matchedPose) {
      el.pose = matchedPose;
    }
  },
  // Nối defaulter highlight-box vào pipeline (ELEMENT_DEFAULTERS chưa từng được gọi — xem ghi chú bên dưới)
  'highlight-box': (el, ACCENT, ctx) => ELEMENT_DEFAULTERS['highlight-box'](el, ACCENT, ctx),
  // AI viết nội dung hook, hookDesigner chọn layout & biến thể (src/config/hookDesigner.js)
  'master-hook': (el, ACCENT, ctx) => {
    const h = ctx?.hook || {};
    el.hookData = designHook(el.hookData || {}, {
      content: el.content, seed: h.seed, recentLayouts: h.recentLayouts, styleHint: h.styleHint, domains: h.domains,
    });
  },
};

/**
 * LƯU Ý: postProcessor chỉ gọi GUARD_HANDLERS. Các defaulter dưới đây chỉ chạy khi được nối vào
 * GUARD_HANDLERS (hiện có character-mascot, highlight-box & master-hook); phần còn lại chưa được dùng.
 */
export const ELEMENT_DEFAULTERS = {
  'character-mascot': (el, ACCENT, ctx) => {
    // Determine pose based on scene mood and context
    let matchedPose = null;
    const textToMatch = ((el.content || '') + ' ' + (ctx?.sceneContext || '')).toLowerCase();
    
    if (ctx?.mascotPoses && Array.isArray(ctx.mascotPoses)) {
      for (const rule of ctx.mascotPoses) {
        if (!rule.keywordPattern) continue;
        const keywords = rule.keywordPattern.split('|').map(k => k.trim().toLowerCase()).filter(k => k);
        if (keywords.some(k => textToMatch.includes(k))) {
          matchedPose = rule.targetPose;
          break;
        }
      }
    }
    
    if (matchedPose) {
      el.pose = matchedPose;
    } else if (!el.pose) {
      el.pose = 'idea';
    }

    if (!el.blendMode) el.blendMode = 'screen';
    if (typeof el.glowIntensity !== 'number') el.glowIntensity = 8;
    if (!el.accentColor) el.accentColor = ACCENT;
    if (typeof el.flipX !== 'boolean') el.flipX = false;
    if (!el.animPreset) el.animPreset = 'bounce-in';
    if (!el.width) el.width = 220;
    if (!el.height) el.height = 310;
  },
  'generative-svg': (el, ACCENT) => {
    if (!el.width) el.width = 220;
    if (!el.height) el.height = 220;
    if (!el.accentColor) el.accentColor = ACCENT;
    if (!el.animPreset) el.animPreset = 'zoom-in';
    if (typeof el.left !== 'number') el.left = 180;
    if (typeof el.top !== 'number') el.top = 220;

    const VALID_FORMULAS = [
      'quantum-orbit', 'lorenz-attractor', 'dna-helix', 'rose-curve',
      'exponential-surge', 'fibonacci-spiral', 'harmonic-wave', 'singularity-vortex',
      'network-mesh', 'bifurcation-tree', 'neural-pulse', 'cyber-shield',
      'spacetime-grid', 'lissajous-curve', 'mobius-loop', 'double-pendulum',
      'ecg-heartbeat', 'tesseract-hypercube', 'streamline-flow', 'torus-field'
    ];

    if (el.formula && !VALID_FORMULAS.includes(el.formula)) {
      el.formula = 'quantum-orbit';
    }

    if (!el.formula && !el.svgContent && (!el.paths || !el.paths.length)) {
      el.formula = 'quantum-orbit';
    }

    if (el.svgContent && typeof el.svgContent === 'string') {
      // Strip any solid background rect to guarantee 100% transparent alpha (Anti Box-in-a-Box)
      el.svgContent = el.svgContent.replace(/<rect\s+[^>]*(?:width=["'](?:100%|100)["']|height=["'](?:100%|100)["'])[^>]*\/?>/gi, '');
    }
  },
  'candlestick-chart': (el, ACCENT) => {
    if (!el.candlestickData) el.candlestickData = {
      symbol: 'BTC / USDT', currentPrice: '$98,450', changePct: '+8.45%',
      candles: [
        { open: 92000, high: 93500, low: 91200, close: 93200, label: '09:00' },
        { open: 93200, high: 96800, low: 92800, close: 96200, label: '15:00' },
        { open: 96200, high: 99200, low: 95500, close: 98450, label: 'Live' }
      ]
    };
  },
  'racing-bar-chart': (el, ACCENT) => {
    if (!el.racingBarData) el.racingBarData = {
      title: 'TỶ TRỌNG & THỊ PHẦN',
      bars: [
        { label: 'Hạng 1', value: 65, color: ACCENT, icon: '⚡' },
        { label: 'Hạng 2', value: 25, color: '#00FF88', icon: '🚀' },
        { label: 'Hạng 3', value: 10, color: '#FFB800', icon: '🔥' }
      ]
    };
  },
  'waterfall-chart': (el, ACCENT) => {
    if (!el.waterfallData) el.waterfallData = {
      title: 'CƠ CẤU DÒNG TIỀN', currency: '$',
      steps: [
        { label: 'Doanh thu', amount: 100, type: 'start', color: '#00FF88' },
        { label: 'Chi phí', amount: -40, type: 'subtract', color: '#FF3366' },
        { label: 'Lợi nhuận', amount: 60, type: 'total', color: ACCENT }
      ]
    };
  },
  'heatmap-matrix': (el, ACCENT) => {
    if (!el.heatmapData) el.heatmapData = {
      title: 'MA TRẬN RỦI RO', rows: 3, cols: 3,
      cells: [
        { label: 'A', value: 85, color: '#00FF88' },
        { label: 'B', value: 40, color: '#FFB800' },
        { label: 'C', value: -20, color: '#FF3366' }
      ]
    };
  },
  'radar-chart': (el, ACCENT) => {
    el.width = el.width || 340;
    el.height = el.height || 280;
    if (!el.chartData || !Array.isArray(el.chartData) || el.chartData.length < 5) {
      el.chartData = [
        { label: 'Hiệu năng', value: 92 },
        { label: 'Bảo mật', value: 85 },
        { label: 'Dễ dùng', value: 78 },
        { label: 'Hỗ trợ', value: 95 },
        { label: 'Chi phí', value: 68 }
      ];
    }
  },
  'line-chart': (el, ACCENT) => {
    if (!el.chartData) el.chartData = [
      { label: 'T1', value: 20 }, { label: 'T2', value: 45 },
      { label: 'T3', value: 75 }, { label: 'T4', value: 110 }
    ];
  },
  'gauge-chart': (el, ACCENT) => {
    if (typeof el.percent !== 'number') el.percent = 88;
    el.statLabel = el.statLabel || 'HIỆU SUẤT TỐI ĐA';
  },
  'network-graph': (el, ACCENT) => {
    if (!el.networkNodes) el.networkNodes = [{ label: 'AI Core' }, { label: 'Data' }, { label: 'Prompt' }, { label: 'Result' }];
  },
  'pie-chart': (el, ACCENT) => {
    if (!el.chartData) el.chartData = [
      { label: 'Tự động', value: 75, color: ACCENT },
      { label: 'Thủ công', value: 25, color: '#FF3366' }
    ];
  },
  'pyramid-funnel': (el, ACCENT) => {
    if (!el.pyramidLayers) el.pyramidLayers = [
      { label: 'TẦNG 1: HOOK', sub: 'Thu hút', color: ACCENT },
      { label: 'TẦNG 2: INSIGHT', sub: 'Giá trị cốt lõi', color: '#00D4FF' },
      { label: 'TẦNG 3: ACTION', sub: 'Chuyển đổi', color: '#FFB800' }
    ];
  },
  'vs-battle': (el, ACCENT) => {
    if (!el.vsBattle) el.vsBattle = {
      leftSubject: { name: 'Cách Cũ', icon: '❌', color: '#FF5544' },
      rightSubject: { name: 'Cách Mới', icon: '⚡', color: ACCENT },
      rounds: [
        { criterion: '⚡ Tốc độ', winner: 'right', leftValue: '3 giờ', rightValue: '10 giây' },
        { criterion: '💰 Chi phí', winner: 'right', leftValue: '10 triệu', rightValue: '0 đồng' }
      ]
    };
  },
  'sankey-chart': (el, ACCENT) => {
    if (!el.sankeyData) el.sankeyData = {
      title: el.content || 'PHÂN RÃ NGUỒN TIỀN',
      source: '100 Triệu', sourceValue: 'DOANH THU',
      flows: [
        { label: 'Chi phí Vận hành', value: '45 Tr', percent: 45, color: '#FF3366' },
        { label: 'Chi phí Marketing', value: '25 Tr', percent: 25, color: '#FFB800' },
        { label: 'Lợi nhuận Ròng', value: '30 Tr', percent: 30, color: ACCENT }
      ]
    };
  },
  'tree-diagram': (el, ACCENT) => {
    if (!el.treeData) el.treeData = {
      title: el.content || 'LỘ TRÌNH PHÁT TRIỂN',
      rootNode: { label: 'AI AGENT', icon: '🤖' },
      branches: [
        { group: 'Frontend', items: ['React', 'Remotion'], color: '#00D4FF' },
        { group: 'Backend', items: ['Node.js', 'Express'], color: ACCENT },
        { group: 'AI Core', items: ['Gemini', 'LLM Agents'], color: '#FFB800' }
      ]
    };
  },
  'social-callout': (el, ACCENT) => {
    if (!el.calloutData) el.calloutData = {
      variant: 'tweet', title: 'Thông báo', subtitle: '@system', content: el.content || 'Dữ liệu đang được cập nhật', badge: 'SYSTEM', accentColor: ACCENT
    };
  },
  'document-evidence': (el, ACCENT) => {
    if (!el.docData) el.docData = {
      variant: 'note', title: 'GHI NHỚ', content: el.content || 'Dữ liệu mật đang được xử lý', badge: 'BẢO MẬT', accentColor: ACCENT
    };
  },
  'breathing-circle': (el, ACCENT) => {
    if (!el.breathingData) el.breathingData = {
      title: 'HÍT THỞ CHÁNH NIỆM', subtitle: 'Kỹ thuật thở 4-7-8', pattern: '4-7-8', cycleDurationSec: 8, accentColor: '#86EFAC'
    };
  },
  'vinyl-pulse': (el, ACCENT) => {
    if (!el.vinylData) el.vinylData = {
      songTitle: el.content || 'Rainy Cafe & Lofi Beats', artistOrVibe: '432Hz Healing Frequency', waveColor: '#93C5FD', badge: '432Hz'
    };
  },
  'quiz-card': (el, ACCENT) => {
    if (!el.quizData) el.quizData = {
      question: el.content || 'Câu hỏi?', options: [{id:'A', text:'Đáp án A'}, {id:'B', text:'Đáp án B'}], correctId: 'A', revealDelaySec: 1.5
    };
  },
  'fake-search': (el, ACCENT) => {
    if (!el.searchData) el.searchData = {
      keyword: el.content || 'Cách làm video triệu view...',
      placeholder: 'Tìm kiếm...',
      engine: 'glass',
      typingSpeed: 2,
      accentColor: ACCENT,
      autoSearchBadge: 'XU HƯỚNG'
    };
  },
  'push-notification': (el, ACCENT) => {
    if (!el.notificationData) el.notificationData = {
      appName: el.subtitle || 'THÔNG BÁO',
      appIcon: '🔔',
      title: el.content || 'Bạn có thông báo mới',
      message: 'Nhấn vào để xem chi tiết ngay bây giờ.',
      timeText: 'vừa xong',
      badge: 'MỚI',
      accentColor: '#00D46A'
    };
  },
  'frame-mockup': (el, ACCENT) => {
    if (!el.frameData) el.frameData = {
      framePreset: 'browser-macos',
      urlText: el.content || 'motionstudio.ai',
      theme: 'dark',
      borderWidth: 3,
      accentColor: ACCENT
    };
  },
  'hand-drawn': (el, ACCENT) => {
    if (!el.svgContent) {
      el.svgContent = 'M 20 60 C 20 20, 80 15, 130 18 C 175 22, 190 55, 185 85 C 180 115, 130 125, 75 120 C 30 115, 15 80, 25 55 Z';
      el.viewBox = el.viewBox || '0 0 210 140';
      el.stroke = el.stroke || ACCENT;
      el.strokeWidth = el.strokeWidth || 4.5;
    }
  },
  'checklist': (el, ACCENT) => {
    if (!el.accentColor) el.accentColor = ACCENT;
    if (!el.checklistItems || el.checklistItems.length === 0) el.checklistItems = [
      { text: 'Kiểm tra hệ thống', status: 'checked' },
      { text: 'Xác thực dữ liệu', status: 'cross' }
    ];
  },
  'knowledge-graph': (el, ACCENT) => {
    if (!el.accentColor) el.accentColor = ACCENT;
    if (!el.width) el.width = 340;
    if (!el.knowledgeGraphData && el.nodes) {
      el.knowledgeGraphData = { nodes: el.nodes, title: el.content || 'Cây tri thức' };
    }
    if (!el.knowledgeGraphData) {
      el.knowledgeGraphData = {
        title: el.content || 'Cây tri thức bài giảng',
        layout: 'cascade',
        nodes: [
          { id: 'root', label: el.content || 'Chủ đề chính', tier: 0 },
          { id: 'sub_1', label: 'Luận điểm 1', tier: 1, parentId: 'root' },
          { id: 'sub_2', label: 'Luận điểm 2', tier: 1, parentId: 'root' }
        ]
      };
    }
  },
  'highlight-box': (el, ACCENT) => {
    if (!el.accentColor) el.accentColor = ACCENT;
    if (!el.content) el.content = 'Thông điệp cốt lõi';
    
    // Không chốt variant: để 'auto' tự thích ứng khi người dùng sửa nội dung (SSOT highlightBoxLayout)
    const raw = String(el.content).trim();
    if (!el.boxIcon && resolveHighlightVariant(el) === 'callout-card') {
      // Icon theo sắc thái (cảm xúc → trái tim, sức khoẻ → lá, rủi ro → cảnh báo...) — SSOT highlightBoxLayout
      el.boxIcon = suggestHighlightIcon(raw);
    }
    if (typeof el.glowEffect !== 'boolean') el.glowEffect = true;
    if (typeof el.radius !== 'number') el.radius = 16;
  },
  'quote-box': (el, ACCENT) => {
    if (!el.content) el.content = 'Người bình thường giải quyết hậu quả. Chuyên gia giải quyết nguyên nhân gốc rễ.';
    if (!el.authorName) el.authorName = 'Chiêm Nghiệm';
    if (!el.accentColor) el.accentColor = ACCENT || '#FFD700';
    if (el.showWatermark === undefined) el.showWatermark = true;
    if (!el.width) el.width = 312;
    if (!el.fontSize) el.fontSize = 16;
  },
  'table': (el, ACCENT) => {
    if (!el.accentColor) el.accentColor = ACCENT;
    if (!el.tableData) el.tableData = {
      headers: ['Cột A', 'Cột B'], rows: [['Dữ liệu 1', 'Dữ liệu 2']]
    };
  },
  'flowchart': (el, ACCENT) => {
    if (!el.accentColor) el.accentColor = ACCENT;
    if (!el.flowSteps) el.flowSteps = [{title: 'BƯỚC 1', subtitle: 'Khởi tạo', color: ACCENT}, {title: 'BƯỚC 2', subtitle: 'Hoàn thành', color: '#00D4FF'}];
  },
  'timeline': (el, ACCENT) => {
    if (!el.accentColor) el.accentColor = ACCENT;
    if (!el.flowSteps) el.flowSteps = [{title: '2025', subtitle: 'Khởi đầu', color: ACCENT}, {title: '2026', subtitle: 'Bùng nổ', color: '#00D4FF'}];
  },
  'ranking-list': (el, ACCENT) => {
    if (!el.accentColor) el.accentColor = ACCENT;
    if (!el.rankingItems) el.rankingItems = [{rank: 1, name: 'Hạng 1', score: '99%'}];
  },
  'chat-mockup': (el, ACCENT) => {
    if (!el.accentColor) el.accentColor = ACCENT;
    if (!el.chatMessages) el.chatMessages = [{sender: 'left', name: 'Khách', text: 'Có cách nào làm video nhanh không?'}, {sender: 'right', name: 'Bạn', text: 'Dùng Motion Studio chỉ 10s!'}];
  },
  'code-terminal': (el, ACCENT) => {
    if (!el.accentColor) el.accentColor = ACCENT;
    if (!el.codeData) el.codeData = {filename: 'script.js', language: 'JavaScript', code: '// Auto-generated code'};
  },
  'chart-bar': (el, ACCENT) => {
    if (!el.accentColor) el.accentColor = ACCENT;
    const rawBars = el.chartData || el.bars || el.items || el.data;
    if (Array.isArray(rawBars) && rawBars.length > 0) {
      el.chartData = rawBars.map((b, i) => {
        if (!b || typeof b !== 'object') {
          return { label: `Chỉ số ${i + 1}`, value: Number(b) || 50, unit: '%', color: i === 0 ? ACCENT : '#00D4FF' };
        }
        return {
          label: String(b.label || b.name || b.title || `Chỉ số ${i + 1}`).trim(),
          value: typeof b.value === 'number' && !isNaN(b.value) ? b.value : (parseFloat(String(b.value || '0').replace(/[^0-9.]/g, '')) || 50),
          unit: String(b.unit || '%').trim(),
          color: b.color || (i === 0 ? ACCENT : i === 1 ? '#00D4FF' : i === 2 ? '#FFB800' : '#FF3366'),
        };
      });
    } else {
      el.chartData = [
        { label: 'Trước tối ưu', value: 35, unit: '%', color: '#00D4FF' },
        { label: 'Sau tối ưu', value: 88, unit: '%', color: ACCENT },
      ];
    }
  },
  'stat-big': (el, ACCENT) => {
    if (!el.accentColor) el.accentColor = ACCENT;
    if (!el.statValue) el.statValue = '[ 99% ]';
    if (!el.statLabel) el.statLabel = 'TỶ LỆ CHUYỂN ĐỔI';
  },
  'vs-card': (el, ACCENT) => {
    if (!el.accentColor) el.accentColor = ACCENT;
    if (!el.leftCard) el.leftCard = { title: 'CŨ', points: ['Chậm'], color: '#FF3366' };
    if (!el.rightCard) el.rightCard = { title: 'MỚI', points: ['Nhanh'], color: ACCENT };
  },
  'dynamic-diagram': (el, ACCENT) => {
    if (!el.accentColor) el.accentColor = ACCENT;
    if (!el.diagramData) {
      el.diagramData = {
        title: 'QUY TRÌNH HỆ THỐNG',
        nodes: [
          { id: 'start', label: 'Bắt đầu', shape: 'pill', color: ACCENT },
          { id: 'step', label: 'Xử lý', shape: 'rect', color: '#00D4FF' },
          { id: 'end', label: 'Hoàn tất', shape: 'pill', color: '#00FF88' },
        ],
        edges: [
          { from: 'start', to: 'step' },
          { from: 'step', to: 'end' },
        ],
        timingMode: 'auto',
      };
    }
  }
};

