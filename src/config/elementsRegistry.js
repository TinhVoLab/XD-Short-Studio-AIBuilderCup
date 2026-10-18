/**
 * ── Elements Registry (Single Source of Truth) ──────────────────────
 * Centralized catalog for all UI elements, data charts, infographics, and cinema proof.
 * Used by both Frontend (SvgPanel.tsx) for UI rendering and Backend (aiElementsCatalog.js) for AI prompting.
 */

export const ELEMENT_CATEGORIES = {
  TYPOGRAPHY_BASIC: 'TYPOGRAPHY_BASIC',
  DATA_CHARTS: 'DATA_CHARTS',
  INFOGRAPHICS_FRAMEWORKS: 'INFOGRAPHICS_FRAMEWORKS',
  CINEMA_SOCIAL_PROOF: 'CINEMA_SOCIAL_PROOF',
  DYNAMIC_FLOWS_PRO: 'DYNAMIC_FLOWS_PRO',
};

export const UI_CHART_GROUPS = [
  'Typography & Hooks',
  'Tăng trưởng & Xu hướng',
  'Tài chính & Dòng tiền',
  'Cạnh tranh & Đối đầu',
  'Hệ sinh thái & Lộ trình',
  'Luồng dữ liệu Cyber',
  'Thiền & Chữa lành',
];

/** @type {import('./elementsTypes').ElementsRegistryMap} */
export const ELEMENTS_REGISTRY = {
  // ── TYPOGRAPHY_BASIC ──────────────────────────────────────────────
  'rect': {
    category: ELEMENT_CATEGORIES.TYPOGRAPHY_BASIC,
    ai: (ACCENT) => `Background rectangle. e.g. { type:"rect", left:0, top:100, width:360, height:150, fill:"#1a1a1a", animPreset:"fade-in" }`,
  },
  'badge': {
    category: ELEMENT_CATEGORIES.TYPOGRAPHY_BASIC,
    ai: (ACCENT) => `Pill with text. e.g. { type:"badge", left:32, top:58, width:70, height:22, bgColor:"${ACCENT}", content:"#1 HOOK", color:"#000", radius:11, fontSize:11, fontWeight:900, animPreset:"zoom-in" }`,
  },
  'progress': {
    category: ELEMENT_CATEGORIES.TYPOGRAPHY_BASIC,
    ai: (ACCENT) => `Progress bar. e.g. { type:"progress", left:32, top:58, width:150, height:6, bgColor:"#1a1a1a", accentColor:"${ACCENT}", percent:50, animPreset:"slide-up" }`,
  },
  'line': {
    category: ELEMENT_CATEGORIES.TYPOGRAPHY_BASIC,
    ai: (ACCENT) => `Accent line. e.g. { type:"line", left:32, top:160, width:100, height:3, fill:"${ACCENT}", animPreset:"slide-up" }`,
  },
  'numbered-list': {
    category: ELEMENT_CATEGORIES.TYPOGRAPHY_BASIC,
    ai: (ACCENT) => `List with circles. e.g. { type:"numbered-list", left:32, top:300, width:300, height:140, items:["Tip 1", "Tip 2"], color:"#fff", itemColor:"${ACCENT}", fontSize:14, animPreset:"fade-in" }`,
  },
  'highlight-box': {
    category: ELEMENT_CATEGORIES.TYPOGRAPHY_BASIC,
    variants: [
      { id: 'callout-card', label: 'Hộp kính đúc kết', bestFor: 'Bài học, mẹo hay, cảnh báo sai lầm, định nghĩa' },
      { id: 'accent-strip', label: 'Vạch nhấn tối giản', bestFor: 'Trích dẫn, định luật, triết lý, đúc kết ngắn' },
      { id: 'glow-pill', label: 'Viên thuốc hào quang', bestFor: 'Sub-hook cảnh 1, số liệu gây sốc, kêu gọi CTA cảnh cuối' },
      { id: 'bullet-list', label: 'Từng hàng bước nhịp', bestFor: 'Danh sách 2-3 ý, các bước thực hiện' },
      { id: 'multi-pill', label: 'Sticker từ khóa', bestFor: 'Từ khóa dồn dập, phong cách Hormozi' },
    ],
    boxIcons: ['sparkle', 'tip', 'alert', 'target', 'pin', 'rocket', 'cta', 'quote'],
    ai: (ACCENT) => `Adaptive Chameleon Callout / Highlight Box. Intelligent contextual styling (STRICTLY NO EMOJIS IN CONTENT! Use boxIcon instead).
    [Scene Placement & Variant Rules]:
    - Scene 1 (Hook/Sub-hook): MUST use variant:"glow-pill", boxIcon:"sparkle", textAlign:"center", content:"<Sub-hook statement under 45 chars>"
    - Scene 2-3 (Tip/Lesson): MUST use variant:"callout-card", boxIcon:"tip", accentColor:"#FFD700", content:"<1-2 sentences of advice or takeaway>"
    - Scene 2-3 (Mistake/Warning): MUST use variant:"callout-card", boxIcon:"alert", accentColor:"#FF3B30", content:"<Mistake to avoid or danger notice>"
    - Scene 2-3 (Quote/Philosophy): Use variant:"accent-strip", boxIcon:"quote" or "sparkle", accentColor:"#00D4FF"
    - Sequential Steps (2-3 items): Use variant:"bullet-list", content:"Bước 1: ...\\nBước 2: ...\\nBước 3: ..." (Engine renders 01, 02 automatically!)
    - Final Scene (CTA): MUST use variant:"glow-pill", boxIcon:"cta", textAlign:"center", accentColor:"${ACCENT}", content:"Follow kênh để nhận tài liệu mỗi tuần!"
    Format: { type:"highlight-box", left:180, top:330, width:320, variant:"<callout-card|accent-strip|glow-pill|bullet-list|multi-pill>", boxIcon:"<sparkle|tip|alert|target|pin|rocket|cta|quote>", accentColor:"<HEX>", content:"<CONTENT>", fontSize:14, animPreset:"fade-in" }`,
  },
  'icon-text': {
    category: ELEMENT_CATEGORIES.TYPOGRAPHY_BASIC,
    ai: (ACCENT) => `Emoji with text. e.g. { type:"icon-text", left:32, top:200, width:300, height:65, icon:"💡", iconSize:30, content:"Main Idea", fontSize:23, fontWeight:700, color:"#fff", animPreset:"slide-up" }`,
  },
  'divider': {
    category: ELEMENT_CATEGORIES.TYPOGRAPHY_BASIC,
    ai: (ACCENT) => `Gradient line. e.g. { type:"divider", left:180, top:340, width:150, height:2, animPreset:"fade-in" }`,
  },
  'image': {
    category: ELEMENT_CATEGORIES.TYPOGRAPHY_BASIC,
    ai: (ACCENT) => `3D Microsoft Fluent Emoji or 3D sticker. e.g. { type:"image", src:"<URL from RELEVANT_3D_ASSETS>", left:180, top:160, width:105, height:105, animPreset:"zoom-in" }`,
  },
  'master-hook': {
    category: ELEMENT_CATEGORIES.TYPOGRAPHY_BASIC,
    ui: {
      groupTitle: 'Typography & Hooks',
      icon: '🪝',
      label: 'Master Hook 3s',
      previewBadge: 'HOOK PRO',
      color: '#BEFF01',
      preset: 'zoom-in',
      defaultWidth: 336,
      defaultHeight: 240,
      defaultPayload: {
        content: 'TIÊU ĐỀ HOOK 3S',
        hookData: {
          archetype: 'tips',
          layoutStyle: 'kinetic-contrast',
          badgeText: 'Bí quyết giữ chân',
          heroTitle: 'TIÊU ĐỀ HOOK 3S',
          highlightWords: ['HOOK', '3S'],
          highlightStyle: 'solid-box',
          wordAnimation: 'stagger-pop',
          subText: 'Áp dụng ngay để tăng thời lượng xem trung bình',
          fontSize: 40,
        }
      }
    },
    ai: () => `Master Hook (3-second retention hook). Write CONTENT only — layout, colours and animation are designed automatically from hookIntent. e.g. {
      type: "master-hook", left: 180, top: 80, width: 320, height: 240, animPreset: "zoom-in", animDelay: 0.05,
      hookData: {
        hookIntent: "warning" | "number" | "versus" | "secret" | "tech" | "curiosity" | "tips" | "healing",
        heroTitle: "TIÊU ĐỀ 3-6 TỪ, KHÔNG EMOJI",
        highlightWords: ["1-2 từ có trong heroTitle"],
        badgeText: "2-4 từ, không lặp heroTitle, không emoji",
        subText: "1 câu khơi gợi tò mò hoặc giá trị cụ thể",
        statValue: "chỉ khi hookIntent = number, vd 90%",
        versusLeft: "chỉ khi hookIntent = versus",
        versusRight: "chỉ khi hookIntent = versus"
      }
    }`,
  },

  // Cảnh thư viện Master (config/sceneRecipes.js): chỉ bộ xếp cảnh tạo — không có prompt ai, chưa vào bảng chèn chung
  'master-scene': {
    category: ELEMENT_CATEGORIES.TYPOGRAPHY_BASIC,
    ui: {
      label: 'Cảnh Master',
      preset: 'none',
      defaultWidth: 288,
      defaultPayload: {
        animPreset: 'none',
        masterSceneData: {
          templateId: 'content.key_point',
          slots: {
            y: 'Dậy cùng một giờ, kể cả cuối tuần',
            ly_do: 'Đồng hồ sinh học quen nhịp, bạn dậy dễ hơn mà không cần báo thức.',
          },
          position: { index: 1, total: 3, label: 'Ý' },
        },
      },
    },
  },

  // ── DATA_CHARTS ───────────────────────────────────────────────────
  'stat-big': {
    category: ELEMENT_CATEGORIES.DATA_CHARTS,
    ai: (ACCENT) => `Big bracketed stat number. e.g. { type:"stat-big", left:180, top:200, width:300, height:130, statValue:"[ 89% ]", statLabel:"TỶ LỆ CHUYỂN ĐỔI", animPreset:"zoom-in" }`,
  },
  'metric-cards': {
    category: ELEMENT_CATEGORIES.DATA_CHARTS,
    ai: (ACCENT) => `Grid of stat cards. e.g. { type:"metric-cards", left:180, top:230, width:300, cards:[{value:"10x", label:"Hiệu suất"}, {value:"100%", label:"Tự động"}], accentColor:"${ACCENT}", animPreset:"zoom-in" }`,
  },
  'circle-chart': {
    category: ELEMENT_CATEGORIES.DATA_CHARTS,
    ui: {
      groupTitle: 'Tăng trưởng & Xu hướng',
      icon: '⭕',
      label: 'Vòng Tròn Tiến Độ',
      previewBadge: 'TIẾN ĐỘ',
      color: '#00FF88',
      preset: 'zoom-in',
      defaultWidth: 140,
      defaultHeight: 140,
      defaultPercent: 85,
      defaultLabel: 'TIẾN ĐỘ',
    },
    ai: (ACCENT) => `Animated donut chart. e.g. { type:"circle-chart", left:180, top:230, width:150, percent:85, accentColor:"${ACCENT}", content:"Tốc độ", animPreset:"fade-in" }`,
  },
  'gauge-chart': {
    category: ELEMENT_CATEGORIES.DATA_CHARTS,
    ui: {
      groupTitle: 'Tăng trưởng & Xu hướng',
      icon: '⏱️',
      label: 'Kim Đo Tốc Độ',
      previewBadge: 'HIỆU SUẤT',
      color: '#FF5544',
      preset: 'zoom-in',
      defaultWidth: 260,
      defaultHeight: 180,
      defaultPercent: 85,
      defaultLabel: 'HIỆU SUẤT',
    },
    ai: (ACCENT) => `KPI / speed performance circular gauge. e.g. { type:"gauge-chart", left:180, top:220, width:240, percent:88, statLabel:"HIỆU SUẤT TỐI ĐA", accentColor:"${ACCENT}", animPreset:"zoom-in" }`,
  },
  'chart-bar': {
    category: ELEMENT_CATEGORIES.DATA_CHARTS,
    ui: {
      groupTitle: 'Tăng trưởng & Xu hướng',
      icon: '📊',
      label: 'Cột Doanh Số',
      previewBadge: 'DOANH SỐ',
      color: '#BEFF01',
      preset: 'fade-in',
      defaultWidth: 336,
      defaultPayload: {
        content: 'SO SÁNH CHỈ SỐ',
        chartData: [
          { label: 'Trước tối ưu', value: 35, unit: '%', color: '#00D4FF' },
          { label: 'Sau tối ưu', value: 88, unit: '%', color: '#BEFF01' },
          { label: 'Mục tiêu', value: 95, unit: '%', color: '#FFB800' },
        ],
      },
    },
    ai: (ACCENT) => `Animated bar chart. e.g. { type:"chart-bar", left:180, top:220, width:336, content:"SO SÁNH HIỆU QUẢ", chartData:[{label:"Trước đây", value:35, unit:"%", color:"#00D4FF"}, {label:"Hiện tại", value:85, unit:"%", color:"${ACCENT}"}], animPreset:"fade-in" }`,
  },
  'line-chart': {
    category: ELEMENT_CATEGORIES.DATA_CHARTS,
    ui: {
      groupTitle: 'Tăng trưởng & Xu hướng',
      icon: '📈',
      label: 'Đường Tăng Trưởng',
      previewBadge: 'XU HƯỚNG',
      color: '#00D4FF',
      preset: 'fade-in',
    },
    ai: (ACCENT) => `Continuous growth trend line graph. e.g. { type:"line-chart", left:180, top:230, width:312, height:160, accentColor:"${ACCENT}", chartData:[{label:"Q1", value:25}, {label:"Q2", value:50}, {label:"Q3", value:85}, {label:"Q4", value:120}], animPreset:"fade-in" }`,
  },
  'pie-chart': {
    category: ELEMENT_CATEGORIES.DATA_CHARTS,
    ui: {
      groupTitle: 'Tăng trưởng & Xu hướng',
      icon: '🍩',
      label: 'Tròn Phân Bổ',
      previewBadge: 'TỶ TRỌNG',
      color: '#FFD700',
      preset: 'zoom-in',
    },
    ai: (ACCENT) => `Percentage distribution pie chart. e.g. { type:"pie-chart", left:180, top:220, width:220, chartData:[{label:"Tự động", value:70, color:"${ACCENT}"}, {label:"Thủ công", value:30, color:"#FF3366"}], animPreset:"zoom-in" }`,
  },
  'candlestick-chart': {
    category: ELEMENT_CATEGORIES.DATA_CHARTS,
    ui: {
      groupTitle: 'Tài chính & Dòng tiền',
      icon: '📈',
      label: 'Nến Nhật Crypto',
      previewBadge: 'CRYPTO',
      color: '#00FF88',
      preset: 'fade-in',
    },
    ai: (ACCENT) => `Financial crypto/stock Candlestick chart. e.g. { type:"candlestick-chart", left:180, top:200, width:330, candlestickData:{symbol:"BTC / USDT", currentPrice:"$98,450", changePct:"+8.45%", candles:[{open:92000, high:93500, low:91200, close:93200, label:"09:00"}, {open:93200, high:96800, low:92800, close:96200, label:"15:00"}, {open:96200, high:99200, low:95500, close:98450, label:"Live"}]}, animPreset:"fade-in" }`,
  },
  'waterfall-chart': {
    category: ELEMENT_CATEGORIES.DATA_CHARTS,
    ui: {
      groupTitle: 'Tài chính & Dòng tiền',
      icon: '🌊',
      label: 'Thác Dòng Tiền',
      previewBadge: 'DÒNG TIỀN',
      color: '#FF3366',
      preset: 'slide-up',
    },
    ai: (ACCENT) => `Cash flow / revenue waterfall breakdown. e.g. { type:"waterfall-chart", left:180, top:200, width:330, waterfallData:{title:"CƠ CẤU DÒNG TIỀN", currency:"$", steps:[{label:"Doanh thu", amount:100, type:"start", color:"#00FF88"}, {label:"Vận hành", amount:-40, type:"subtract", color:"#FF3366"}, {label:"Lợi nhuận", amount:60, type:"total", color:"${ACCENT}"}]}, animPreset:"slide-up" }`,
  },
  'sankey-chart': {
    category: ELEMENT_CATEGORIES.DATA_CHARTS,
    ui: {
      groupTitle: 'Tài chính & Dòng tiền',
      icon: '🌊',
      label: 'Sankey Phân Rã',
      previewBadge: 'PHÂN RÃ',
      color: '#00FF88',
      preset: 'fade-in',
    },
    ai: (ACCENT) => `Smooth Bézier flow / revenue decomposition diagram. e.g. { type:"sankey-chart", left:180, top:200, width:330, sankeyData:{title:"PHÂN RÃ DÒNG TIỀN", source:"100 Triệu", sourceValue:"DOANH THU", flows:[{label:"Vận hành", value:"45 Tr", percent:45, color:"#FF3366"}, {label:"Lợi nhuận", value:"55 Tr", percent:55, color:"${ACCENT}"}]}, animPreset:"fade-in" }`,
  },
  'heatmap-matrix': {
    category: ELEMENT_CATEGORIES.DATA_CHARTS,
    ui: {
      groupTitle: 'Tài chính & Dòng tiền',
      icon: '🟩',
      label: 'Bản Đồ Nhiệt',
      previewBadge: 'RỦI RO',
      color: '#00FF88',
      preset: 'fade-in',
    },
    ai: (ACCENT) => `Market risk / correlation heatmap matrix. e.g. { type:"heatmap-matrix", left:180, top:200, width:330, heatmapData:{title:"BẢN ĐỒ NHIỆT DANH MỤC", rows:3, cols:4, cells:[{label:"BTC", value:85, color:"#00FF88"}, {label:"ETH", value:65, color:"#00FF88"}, {label:"NVDA", value:92, color:"#00FF88"}, {label:"TSLA", value:-30, color:"#FF3366"}]}, animPreset:"fade-in" }`,
  },
  'radar-chart': {
    category: ELEMENT_CATEGORIES.DATA_CHARTS,
    ui: {
      groupTitle: 'Hệ sinh thái & Lộ trình',
      icon: 'radar',
      label: 'Biểu Đồ Radar',
      previewBadge: 'KỸ NĂNG',
      color: '#00D4FF',
      preset: 'zoom-in',
      defaultWidth: 340,
      defaultHeight: 280,
      defaultPayload: {
        content: '',
        chartData: [
          { label: 'Hiệu năng', value: 92 },
          { label: 'Bảo mật', value: 85 },
          { label: 'Dễ học', value: 78 },
          { label: 'Cộng đồng', value: 95 },
          { label: 'Chi phí', value: 65 },
        ],
      },
    },
    ai: (ACCENT) => `Multi-dimensional attribute / skill radar polygon (5 balanced axes). e.g. { type:"radar-chart", left:180, top:200, width:340, height:280, content:"ĐÁNH GIÁ ĐA CHIỀU", accentColor:"${ACCENT}", chartData:[{label:"Hiệu năng", value:92}, {label:"Bảo mật", value:85}, {label:"Dễ dùng", value:78}, {label:"Hỗ trợ", value:95}, {label:"Chi phí", value:68}], animPreset:"zoom-in" }`,
  },
  'racing-bar-chart': {
    category: ELEMENT_CATEGORIES.DATA_CHARTS,
    ui: {
      groupTitle: 'Cạnh tranh & Đối đầu',
      icon: '🏎️',
      label: 'Đua Cột Thứ Hạng',
      previewBadge: 'THỊ PHẦN',
      color: '#FFB800',
      preset: 'slide-up',
    },
    ai: (ACCENT) => `Animated racing bar market share chart. e.g. { type:"racing-bar-chart", left:180, top:200, width:330, racingBarData:{title:"THỊ PHẦN TRÌNH DUYỆT", bars:[{label:"Chrome", value:65, color:"${ACCENT}", icon:"🌐"}, {label:"Safari", value:19, color:"#00FF88", icon:"🧭"}, {label:"Edge", value:10, color:"#FFB800", icon:"⚡"}]}, animPreset:"slide-up" }`,
  },

  // ── CYBER & DYNAMIC FLOW [PRO] ─────────────────────────────────────
  'orbit-system': {
    category: ELEMENT_CATEGORIES.DATA_CHARTS,
    ui: {
      groupTitle: 'Luồng dữ liệu Cyber',
      icon: '🪐',
      label: 'Hành Tinh Quỹ Đạo',
      previewBadge: 'KPI',
      color: '#00D4FF',
      preset: 'zoom-in',
      defaultWidth: 280,
      defaultHeight: 280,
      defaultPayload: {
        orbitData: {
          centerLabel: 'TỔNG DOANH THU',
          centerValue: '₫2.8B',
          accentColor: '#00D4FF',
          planets: [
            { label: 'Q1', value: '₫680M', color: '#00D4FF', speed: 0.8 },
            { label: 'Q2', value: '₫850M', color: '#BEFF01', speed: 0.55 },
            { label: 'Q3', value: '₫720M', color: '#FF2D78', speed: 0.35 },
          ],
        }
      }
    },
    ai: (ACCENT) => `Orbital KPI planet system. e.g. { type:"orbit-system", left:100, top:180, width:280, height:280, orbitData:{centerLabel:"DOANH THU", centerValue:"₫2.8B", accentColor:"${ACCENT}", planets:[{label:"Q1", value:"₫680M", color:"#00D4FF", speed:0.8}, {label:"Q2", value:"₫850M", color:"#BEFF01", speed:0.55}, {label:"Q3", value:"₫720M", color:"#FF2D78", speed:0.35}]}, animPreset:"zoom-in" }`,
  },
  'signal-wave': {
    category: ELEMENT_CATEGORIES.DATA_CHARTS,
    ui: {
      groupTitle: 'Luồng dữ liệu Cyber',
      icon: '📡',
      label: 'Sóng Tín Hiệu Live',
      previewBadge: 'LIVE',
      color: '#00D4FF',
      preset: 'fade-in',
      defaultWidth: 320,
      defaultHeight: 160,
      defaultPayload: {
        signalWaveData: {
          title: 'SIGNAL MONITOR',
          badge: 'LIVE',
          waveColor: '#00D4FF',
          points: [
            { label: 'T1', value: 25 },
            { label: 'T2', value: 55 },
            { label: 'T3', value: 40 },
            { label: 'T4', value: 80 },
            { label: 'T5', value: 60 },
            { label: 'T6', value: 90 },
            { label: 'T7', value: 70, highlight: true },
          ],
        }
      }
    },
    ai: (ACCENT) => `Live signal oscilloscope wave chart. e.g. { type:"signal-wave", left:50, top:260, width:320, height:160, signalWaveData:{title:"LIVE SIGNAL", badge:"REAL-TIME", waveColor:"${ACCENT}", points:[{label:"T1", value:25}, {label:"T2", value:60}, {label:"T3", value:45}, {label:"T4", value:85, highlight:true}, {label:"T5", value:70}]}, animPreset:"fade-in" }`,
  },
  'cyber-matrix': {
    category: ELEMENT_CATEGORIES.DATA_CHARTS,
    ui: {
      groupTitle: 'Luồng dữ liệu Cyber',
      icon: '🔲',
      label: 'Ma Trận Dữ Liệu',
      previewBadge: 'SCAN',
      color: '#00D4FF',
      preset: 'fade-in',
      defaultWidth: 320,
      defaultHeight: 180,
      defaultPayload: {
        cyberMatrixData: {
          title: 'DATA MATRIX',
          rows: 5,
          cols: 8,
          baseColor: '#00D4FF',
          cells: Array.from({ length: 40 }, (_, i) => ({
            value: Math.round(20 + ((i * 73 + 17) % 80)),
          })),
        }
      }
    },
    ai: (ACCENT) => `Cyber scanning matrix grid. e.g. { type:"cyber-matrix", left:50, top:240, width:320, height:180, cyberMatrixData:{title:"DATA MATRIX", rows:5, cols:8, baseColor:"${ACCENT}", cells:[{value:85},{value:40},{value:95},{value:20},{value:70},{value:55},{value:88},{value:30}]}, animPreset:"fade-in" }`,
  },
  'speed-meter': {
    category: ELEMENT_CATEGORIES.DATA_CHARTS,
    ui: {
      groupTitle: 'Luồng dữ liệu Cyber',
      icon: '🏎️',
      label: 'Đồng Hồ Tốc Kế',
      previewBadge: 'KPI %',
      color: '#FF2D78',
      preset: 'zoom-in',
      defaultWidth: 260,
      defaultHeight: 200,
      defaultPayload: {
        speedMeterData: {
          label: 'HIỆU SUẤT',
          value: 78,
          unit: '%',
          needleColor: '#FF2D78',
          accentColor: '#BEFF01',
          zones: [
            { from: 0, to: 40, color: '#00D4FF' },
            { from: 40, to: 70, color: '#BEFF01' },
            { from: 70, to: 90, color: '#FFB800' },
            { from: 90, to: 100, color: '#FF2D78' },
          ],
        }
      }
    },
    ai: (ACCENT) => `Neon tachometer / speedometer gauge. e.g. { type:"speed-meter", left:90, top:200, width:260, height:200, speedMeterData:{label:"HIỆU SUẤT", value:78, unit:"%", needleColor:"#FF2D78", accentColor:"${ACCENT}", zones:[{from:0, to:40, color:"#00D4FF"}, {from:40, to:75, color:"#BEFF01"}, {from:75, to:100, color:"#FF2D78"}]}, animPreset:"zoom-in" }`,
  },
  'liquid-fill': {
    category: ELEMENT_CATEGORIES.DATA_CHARTS,
    ui: {
      groupTitle: 'Luồng dữ liệu Cyber',
      icon: '🌊',
      label: 'Bình Chất Lỏng Neon',
      previewBadge: 'WAVE',
      color: '#00D4FF',
      preset: 'zoom-in',
      defaultWidth: 260,
      defaultHeight: 260,
      defaultPayload: {
        liquidFillData: {
          label: 'NĂNG LƯỢNG',
          value: 68,
          unit: '%',
          subLabel: '8.4 / 12.0 kWh',
          liquidColor: '#00D4FF',
          accentColor: '#BEFF01',
          shape: 'circle',
          waveSpeed: 1.5,
        }
      }
    },
    ai: (ACCENT) => `Liquid fill progress wave gauge. e.g. { type:"liquid-fill", left:90, top:200, width:260, height:260, liquidFillData:{label:"NĂNG LƯỢNG", value:68, unit:"%", subLabel:"8.4 / 12.0 kWh", liquidColor:"${ACCENT}", accentColor:"#BEFF01", shape:"circle"}, animPreset:"zoom-in" }`,
  },
  'neuron-network': {
    category: ELEMENT_CATEGORIES.DATA_CHARTS,
    ui: {
      groupTitle: 'Luồng dữ liệu Cyber',
      icon: '🧠',
      label: 'Mạng Nơ-ron AI',
      previewBadge: 'AI CORE',
      color: '#00FF88',
      preset: 'fade-in',
      defaultWidth: 320,
      defaultHeight: 260,
      defaultPayload: {
        neuronNetworkData: {
          title: 'NEURAL AI CLUSTER',
          status: 'ACTIVE 99.4%',
          coreColor: '#00FF88',
          synapseColor: '#00D4FF',
          nodes: [
            { id: 'core', x: 50, y: 50, label: 'AI CORE', color: '#00FF88', isCore: true },
            { id: 'n1', x: 12, y: 22, label: 'VISION', color: '#00D4FF' },
            { id: 'n2', x: 88, y: 22, label: 'NLP', color: '#00D4FF' },
            { id: 'n3', x: 10, y: 78, label: 'AUDIO', color: '#BEFF01' },
            { id: 'n4', x: 90, y: 78, label: 'LOGIC', color: '#FF2D78' },
            { id: 'n5', x: 50, y: 8, label: 'SENSE', color: '#00D4FF' },
            { id: 'n6', x: 50, y: 92, label: 'OUTPUT', color: '#BEFF01' },
          ],
          synapses: [
            { fromId: 'core', toId: 'n1', strength: 1 },
            { fromId: 'core', toId: 'n2', strength: 1 },
            { fromId: 'core', toId: 'n3', strength: 1 },
            { fromId: 'core', toId: 'n4', strength: 1 },
            { fromId: 'core', toId: 'n5', strength: 0.8 },
            { fromId: 'core', toId: 'n6', strength: 0.9 },
            { fromId: 'n1', toId: 'n5', strength: 0.6 },
            { fromId: 'n2', toId: 'n5', strength: 0.6 },
            { fromId: 'n3', toId: 'n6', strength: 0.7 },
            { fromId: 'n4', toId: 'n6', strength: 0.7 },
          ]
        }
      }
    },
    ai: (ACCENT) => `AI Synaptic neural network cluster. e.g. { type:"neuron-network", left:60, top:200, width:320, height:260, neuronNetworkData:{title:"NEURAL AI CLUSTER", status:"ACTIVE 99.4%", coreColor:"${ACCENT}", synapseColor:"#00D4FF"}, animPreset:"fade-in" }`,
  },
  'hologram-bar': {
    category: ELEMENT_CATEGORIES.DATA_CHARTS,
    ui: {
      groupTitle: 'Luồng dữ liệu Cyber',
      icon: '⚡',
      label: 'Cột Năng Lượng 3D',
      previewBadge: '3D ISO',
      color: '#BEFF01',
      preset: 'slide-up',
      defaultWidth: 320,
      defaultHeight: 240,
      defaultPayload: {
        showCardBg: true,
        hologramBarData: {
          title: 'HỆ THỐNG XUNG LỰC',
          accentColor: '#BEFF01',
          showScanline: true,
          showCardBg: true,
          bars: [
            { label: 'GPU CLUSTER', value: 85, color: '#00D4FF', sub: '92 TFLOPS' },
            { label: 'NEURAL CHIP', value: 92, color: '#BEFF01', sub: '128 TOPS' },
            { label: 'QUANTUM BUS', value: 64, color: '#FF2D78', sub: '4.8 GB/s' },
          ]
        }
      }
    },
    ai: (ACCENT) => `3D Holographic energy cylinder bar chart. e.g. { type:"hologram-bar", left:60, top:220, width:320, height:240, hologramBarData:{title:"HỆ THỐNG XUNG LỰC", accentColor:"${ACCENT}", bars:[{label:"GPU", value:85, color:"#00D4FF"}, {label:"NPU", value:92, color:"#BEFF01"}, {label:"BUS", value:64, color:"#FF2D78"}]}, animPreset:"slide-up" }`,
  },
  'timeline-pulse': {
    category: ELEMENT_CATEGORIES.DATA_CHARTS,
    ui: {
      groupTitle: 'Luồng dữ liệu Cyber',
      icon: '📈',
      label: 'Nhịp Xung Timeline',
      previewBadge: 'PULSE',
      color: '#00D4FF',
      preset: 'fade-in',
      defaultWidth: 330,
      defaultHeight: 180,
      defaultPayload: {
        timelinePulseData: {
          title: 'LỘ TRÌNH ĐỘT PHÁ',
          pulseColor: '#00D4FF',
          accentColor: '#BEFF01',
          milestones: [
            { time: '09:00', title: 'Khởi động', desc: 'Khởi chạy Core', status: 'completed', color: '#00FF88' },
            { time: '12:30', title: 'Mở rộng', desc: '10,000 Nodes', status: 'completed', color: '#00D4FF' },
            { time: '16:00', title: 'Tối ưu', desc: 'AI Sync Live', status: 'active', color: '#BEFF01' },
            { time: '21:00', title: 'Đỉnh cao', desc: 'Release v2.0', status: 'pending', color: '#FF2D78' },
          ]
        }
      }
    },
    ai: (ACCENT) => `Audio pulse ECG milestone timeline. e.g. { type:"timeline-pulse", left:50, top:230, width:330, height:180, timelinePulseData:{title:"LỘ TRÌNH ĐỘT PHÁ", pulseColor:"${ACCENT}", milestones:[{time:"09:00", title:"Khởi động", status:"completed"}, {time:"16:00", title:"Tối ưu", status:"active"}]}, animPreset:"fade-in" }`,
  },
  'lifecycle-matrix': {
    category: ELEMENT_CATEGORIES.DATA_CHARTS,
    ui: {
      groupTitle: 'Luồng dữ liệu Cyber',
      icon: '🏛️',
      label: 'Ma Trận 3 Cột Vòng Đời',
      previewBadge: '3-STAGE',
      color: '#FF6B00',
      preset: 'slide-up',
      defaultWidth: 330,
      defaultHeight: 390,
      defaultPayload: {
        lifecycleMatrixData: {
          title: 'EVALS vs GUARDRAILS vs MONITORING',
          subtitle: 'CONFLATE THEM → CREATE AN OPS GAP',
          activeColumnIndex: 1,
          columns: [
            {
              id: 'col-1',
              stage: 'BEFORE SHIP',
              name: 'EVALS',
              actionVerb: 'MEASURE',
              icon: '📋',
              metrics: ['quality', 'reliability'],
              question: 'IS IT GOOD?',
              badgeText: 'RELEASE CONFIDENCE',
              color: '#00D4FF'
            },
            {
              id: 'col-2',
              stage: 'DURING RUN',
              name: 'GUARDRAILS',
              actionVerb: 'ENFORCE',
              icon: '🛡️',
              metrics: ['policy', 'scope + limits'],
              question: 'IS IT ALLOWED?',
              badgeText: 'RUNTIME CONTROL',
              color: '#FF6B00'
            },
            {
              id: 'col-3',
              stage: 'AFTER DEPLOY',
              name: 'MONITORING',
              actionVerb: 'DETECT',
              icon: '🖥️',
              metrics: ['drift + cost', 'latency'],
              question: 'IS IT HEALTHY?',
              badgeText: 'PRODUCTION TRUTH',
              color: '#00FF88'
            }
          ]
        }
      }
    },
    ai: (ACCENT) => `3-Column Lifecycle Comparison Matrix (Before - During - After). e.g. { type:"lifecycle-matrix", left:50, top:160, width:330, height:390, lifecycleMatrixData:{title:"EVALS vs GUARDRAILS vs MONITORING", subtitle:"LIFECYCLE OPS", activeColumnIndex:1, columns:[{id:"1", stage:"BEFORE", name:"EVALS", actionVerb:"MEASURE", icon:"📋", metrics:["quality"], question:"IS IT GOOD?", badgeText:"CONFIDENCE", color:"#00D4FF"}, {id:"2", stage:"DURING", name:"GUARDRAILS", actionVerb:"ENFORCE", icon:"🛡️", metrics:["safety"], question:"IS IT ALLOWED?", badgeText:"CONTROL", color:"${ACCENT}"}, {id:"3", stage:"AFTER", name:"MONITORING", actionVerb:"DETECT", icon:"🖥️", metrics:["health"], question:"IS IT HEALTHY?", badgeText:"TRUTH", color:"#00FF88"}]}, animPreset:"slide-up" }`,
  },

  // ── INFOGRAPHICS_FRAMEWORKS ───────────────────────────────────────
  'flowchart': {
    category: ELEMENT_CATEGORIES.INFOGRAPHICS_FRAMEWORKS,
    ui: {
      groupTitle: 'Hệ sinh thái & Lộ trình',
      icon: '🔄',
      label: 'Sơ Đồ Flowchart',
      previewBadge: 'QUY TRÌNH',
      color: '#BEFF01',
      preset: 'zoom-in',
      defaultWidth: 336,
      defaultHeight: 250,
      defaultPayload: {
        content: 'QUY TRÌNH THỰC HIỆN',
        flowSteps: [
          { title: 'BƯỚC 1', subtitle: 'Thu thập dữ liệu', color: '#BEFF01', icon: '💡' },
          { title: 'BƯỚC 2', subtitle: 'Xử lý tự động', color: '#00D4FF', icon: '⚡' },
          { title: 'BƯỚC 3', subtitle: 'Xuất kết quả', color: '#00FF88', icon: '🚀' }
        ]
      }
    },
    ai: (ACCENT) => `3-step vertical diagram with arrows. e.g. { type:"flowchart", left:180, top:220, width:336, height:250, content:"QUY TRÌNH THỰC HIỆN", flowSteps:[{title:"BƯỚC 1", subtitle:"Thu thập dữ liệu", color:"${ACCENT}", icon:"💡"}, {title:"BƯỚC 2", subtitle:"Xử lý tự động", color:"#00D4FF", icon:"⚡"}, {title:"BƯỚC 3", subtitle:"Xuất kết quả", color:"#00FF88", icon:"🚀"}], animPreset:"zoom-in" }`,
  },
  'data-flow': {
    category: ELEMENT_CATEGORIES.DYNAMIC_FLOWS_PRO,
    ui: {
      groupTitle: 'Luồng dữ liệu Cyber',
      icon: '✨',
      label: 'Luồng Dữ Liệu',
      previewBadge: 'PRO ✨',
      color: '#00D4FF',
      preset: 'zoom-in',
      defaultWidth: 360,
      defaultHeight: 120,
      defaultPayload: {
        dataFlowData: {
          nodes: [
            { id: '1', label: 'Client', icon: '📱' },
            { id: '2', label: 'Server', icon: '☁️', subLabel: 'Process' },
            { id: '3', label: 'Database', icon: '🗄️' }
          ]
        }
      }
    },
    ai: (ACCENT) => `Animated data flow with moving packets. e.g. { type:"data-flow", left:180, top:200, width:360, height:120, dataFlowData:{ nodes:[{id:"1", label:"Client", icon:"📱"}, {id:"2", label:"Server", icon:"☁️", subLabel:"Process"}, {id:"3", label:"Database", icon:"🗄️"}] } }`,
  },
  'branching-flow': {
    category: ELEMENT_CATEGORIES.DYNAMIC_FLOWS_PRO,
    ui: {
      groupTitle: 'Luồng dữ liệu Cyber',
      icon: '🌿',
      label: 'Sơ Đồ Rẽ Nhánh',
      previewBadge: 'PRO ✨',
      color: '#00D4FF',
      preset: 'zoom-in',
      defaultWidth: 360,
      defaultHeight: 260,
      defaultPayload: {
        branchingFlowData: {
          rootNode: { id: 'root', label: 'API Gateway', subLabel: 'Load Balancer', icon: '🌐' },
          childNodes: [
            { id: 'c1', label: 'Auth Server', subLabel: 'Port 8081', icon: '🔒' },
            { id: 'c2', label: 'AI Worker', subLabel: 'LLM Agent', icon: '🧠' },
            { id: 'c3', label: 'Database', subLabel: 'PostgreSQL', icon: '🗄️' },
          ]
        }
      }
    },
    ai: (ACCENT) => `Animated branching flow with splitting packets. e.g. { type:"branching-flow", left:180, top:240, width:360, height:260, branchingFlowData:{ rootNode:{id:"root", label:"API Gateway", icon:"🌐", subLabel:"Load Balancer"}, childNodes:[{id:"c1", label:"Auth Server", icon:"🔒"}, {id:"c2", label:"AI Worker", icon:"🧠"}, {id:"c3", label:"Database", icon:"🗄️"}] } }`,
  },
  'parallel-flow': {
    category: ELEMENT_CATEGORIES.DYNAMIC_FLOWS_PRO,
    ui: {
      groupTitle: 'Luồng dữ liệu Cyber',
      icon: '🧬',
      label: 'Xử Lý Song Song',
      previewBadge: 'PRO ✨',
      color: '#00D4FF',
      preset: 'zoom-in',
      defaultWidth: 360,
      defaultHeight: 260,
      defaultPayload: {
        parallelFlowData: {
          inputNode: { id: 'in', label: 'User Request', subLabel: 'Input Trigger', icon: '📥' },
          parallelNodes: [
            { id: 'p1', label: 'Verify Auth', subLabel: 'JWT Token', icon: '🔒' },
            { id: 'p2', label: 'AI Inference', subLabel: 'Gemini 2.5', icon: '🧠' },
            { id: 'p3', label: 'Log Audit', subLabel: 'Kafka Stream', icon: '📝' },
          ],
          outputNode: { id: 'out', label: 'Response', subLabel: 'Status 200 OK', icon: '🚀' },
        }
      }
    },
    ai: (ACCENT) => `Animated parallel fork-join flow. 1 Input splits into N parallel tasks then merges into 1 Output. e.g. { type:"parallel-flow", left:180, top:240, width:360, height:260, parallelFlowData:{ inputNode:{id:"in", label:"User Request", icon:"📥"}, parallelNodes:[{id:"p1", label:"Verify Auth", icon:"🔒"}, {id:"p2", label:"AI Inference", icon:"🧠"}, {id:"p3", label:"Log Audit", icon:"📝"}], outputNode:{id:"out", label:"Response", icon:"🚀"} } }`,
  },
  'mindmap-flow': {
    category: ELEMENT_CATEGORIES.DYNAMIC_FLOWS_PRO,
    ui: {
      groupTitle: 'Luồng dữ liệu Cyber',
      icon: '🧠',
      label: 'Sơ Đồ Tư Duy',
      previewBadge: 'PRO ✨',
      color: '#00D4FF',
      preset: 'zoom-in',
      defaultWidth: 360,
      defaultHeight: 260,
      defaultPayload: {
        mindmapFlowData: {
          centerNode: { label: 'Atomic Habits', subLabel: 'Quy tắc 4 bước', icon: '🧠' },
          branches: [
            { id: 'b1', label: '1. Rõ Ràng', subLabel: 'Tạo gợi ý (Cue)', icon: '👁️', color: '#00D4FF', side: 'left' },
            { id: 'b2', label: '2. Hấp Dẫn', subLabel: 'Tạo khao khát', icon: '🔥', color: '#FFB800', side: 'left' },
            { id: 'b3', label: '3. Dễ Dàng', subLabel: 'Hành động nhỏ', icon: '⚡', color: '#BEFF01', side: 'right' },
            { id: 'b4', label: '4. Thỏa Mãn', subLabel: 'Phần thưởng ngay', icon: '🎁', color: '#00FF88', side: 'right' },
          ]
        }
      }
    },
    ai: (ACCENT) => `Animated radial dual-wing mindmap flow with cubic bezier neuron synapses. e.g. { type:"mindmap-flow", left:180, top:240, width:360, height:260, mindmapFlowData:{ centerNode:{label:"Atomic Habits", icon:"🧠", subLabel:"4 Bước"}, branches:[{id:"b1", label:"1. Rõ Ràng", icon:"👁️", color:"#00D4FF", side:"left"}, {id:"b2", label:"2. Hấp Dẫn", icon:"🔥", color:"#FFB800", side:"left"}, {id:"b3", label:"3. Dễ Dàng", icon:"⚡", color:"#BEFF01", side:"right"}, {id:"b4", label:"4. Thỏa Mãn", icon:"🎁", color:"#00FF88", side:"right"}] } }`,
  },
  'knowledge-graph': {
    category: ELEMENT_CATEGORIES.DYNAMIC_FLOWS_PRO,
    ui: {
      groupTitle: 'Hệ sinh thái & Lộ trình',
      icon: '🧠',
      label: 'Cây Tri Thức',
      previewBadge: 'AI 3-TIER ✨',
      color: '#BEFF01',
      preset: 'zoom-in',
      defaultWidth: 360,
      defaultHeight: 640,
      defaultPayload: {
        knowledgeGraphData: {
          title: '3 Quy luật di truyền Men-đen',
          layout: 'cascade',
          theme: 'obsidian-dark',
          nodes: [
            { id: 'root', label: 'Di truyền học', subLabel: 'Gregor Mendel', icon: '🌱', tier: 0, color: '#BEFF01' },
            { id: 'n1', label: '1. Đồng Tính', subLabel: 'F1 100% Trội', icon: '🧬', tier: 1, color: '#00D4FF', parentId: 'root', insight: 'F1 đồng hình tính trạng trội khi bố mẹ thuần chủng tương phản.' },
            { id: 'n2', label: '2. Phân Li', subLabel: 'Tỉ Lệ 3 Trội : 1 Lặn', icon: '⚖️', tier: 1, color: '#FFB800', parentId: 'root', insight: 'Đến đời F2, các tính trạng phân li theo tỉ lệ trung bình 3 trội 1 lặn.' },
            { id: 'n3', label: '3. Phân Li Độc Lập', subLabel: 'Tỉ Lệ 9:3:3:1', icon: '⚡', tier: 1, color: '#BEFF01', parentId: 'root', insight: 'Các cặp alen phân li độc lập tạo ra 4 loại giao tử với tỉ lệ cân bằng.' },
            { id: 'n4', label: 'Đậu Hà Lan', subLabel: 'Đối Tượng Nghiên Cứu', icon: '🫛', tier: 2, color: '#00FF88', parentId: 'n3', insight: 'Đặc tính tự thụ phấn nghiêm ngặt giúp Men-đen thu được kết quả chính xác.' },
          ],
          activeNodeId: 'n3',
          showParticles: true,
          autoBloom: true,
        }
      }
    },
    ai: (ACCENT) => `Dynamic Multi-tier Knowledge Graph with neural Bezier branches, strict parent-child hierarchy, and storytelling spotlight. e.g. { type:"knowledge-graph", left:180, top:0, width:360, height:640, knowledgeGraphData:{ title:"3 Quy luật di truyền Men-đen", layout:"orbit", nodes:[{id:"root", label:"Di truyền học", icon:"🌱", tier:0, color:"${ACCENT}"}, {id:"n1", label:"Đồng tính", icon:"🧬", tier:1, color:"#00D4FF", parentId:"root", insight:"F1 đồng tính trạng trội khi bố mẹ thuần chủng tương phản."}, {id:"n1_1", label:"Tỉ lệ 100% Trội", icon:"📌", tier:2, color:"#00D4FF", parentId:"n1", insight:"Toàn bộ đời lai F1 biểu hiện tính trạng của bên bố hoặc mẹ trội."}, {id:"n2", label:"Phân li", icon:"⚖️", tier:1, color:"#FFB800", parentId:"root", insight:"Đời F2 phân li theo tỉ lệ trung bình 3 trội : 1 lặn."}, {id:"n3", label:"Phân li độc lập", icon:"⚡", tier:1, color:"${ACCENT}", parentId:"root", insight:"Các cặp alen phân li độc lập trong quá trình phát sinh giao tử."}], activeNodeId:"n1" } }`,
  },
  'funnel-flow': {
    category: ELEMENT_CATEGORIES.DYNAMIC_FLOWS_PRO,
    ui: {
      groupTitle: 'Luồng dữ liệu Cyber',
      icon: '🌪️',
      label: 'Phễu Chuyển Đổi',
      previewBadge: 'PRO ✨',
      color: '#00D4FF',
      preset: 'zoom-in',
      defaultWidth: 360,
      defaultHeight: 280,
      defaultPayload: {
        funnelFlowData: {
          title: 'PHỄU CHUYỂN ĐỔI VIRAL',
          stages: [
            { id: 's1', label: '1. Tiếp Cận (Traffic)', subLabel: '100.000 Lượt xem', value: '100K', conversionPct: '100%', color: '#00D4FF', icon: '👁️' },
            { id: 's2', label: '2. Quan Tâm (Leads)', subLabel: '12.500 Đăng ký', value: '12.5K', conversionPct: '12.5%', color: '#BEFF01', icon: '🎯' },
            { id: 's3', label: '3. Chốt Đơn (Sales)', subLabel: '1.200 Khách hàng', value: '1.2K', conversionPct: '9.6%', color: '#FFB800', icon: '🛒' },
            { id: 's4', label: '4. Khách VIP (Loyal)', subLabel: '240 Hội viên VIP', value: '240', conversionPct: '20%', color: '#FF3B30', icon: '💎' },
          ],
          flowDirection: 'down',
        }
      }
    },
    ai: (ACCENT) => `Animated cyber funnel conversion flow with cascading photons. e.g. { type:"funnel-flow", left:180, top:240, width:360, height:280, funnelFlowData:{ title:"PHỄU BÁN HÀNG", stages:[{id:"s1", label:"Tiếp Cận", value:"100K", conversionPct:"100%", color:"#00D4FF", icon:"👁️"}, {id:"s2", label:"Quan Tâm", value:"12K", conversionPct:"12%", color:"#BEFF01", icon:"🎯"}, {id:"s3", label:"Chốt Đơn", value:"1.2K", conversionPct:"10%", color:"#FFB800", icon:"🛒"}] } }`,
  },
  'roadmap-flow': {
    category: ELEMENT_CATEGORIES.DYNAMIC_FLOWS_PRO,
    ui: {
      groupTitle: 'Luồng dữ liệu Cyber',
      icon: '🛣️',
      label: 'Lộ Trình & Mốc',
      previewBadge: 'PRO ✨',
      color: '#BEFF01',
      preset: 'zoom-in',
      defaultWidth: 360,
      defaultHeight: 280,
      defaultPayload: {
        roadmapFlowData: {
          title: 'LỘ TRÌNH PHÁT TRIỂN PRO',
          milestones: [
            { id: 'm1', stage: 'BƯỚC 1', title: 'Nền Tảng Core', subLabel: 'HTML, CSS & JS', icon: '🌱', color: '#00D4FF', status: 'completed', badge: 'DONE' },
            { id: 'm2', stage: 'BƯỚC 2', title: 'Frontend Pro', subLabel: 'React, Zustand & UI', icon: '⚡', color: '#BEFF01', status: 'active', badge: 'HIỆN TẠI' },
            { id: 'm3', stage: 'BƯỚC 3', title: 'Cloud & API', subLabel: 'Node, Postgre & CI/CD', icon: '🚀', color: '#FFB800', status: 'locked', badge: 'MỤC TIÊU' },
            { id: 'm4', stage: 'BƯỚC 4', title: 'AI Engineering', subLabel: 'LLM Agents & Remotion', icon: '👑', color: '#A855F7', status: 'locked', badge: 'ĐỈNH CAO' },
          ],
          layoutStyle: 'zigzag',
        }
      }
    },
    ai: (ACCENT) => `Animated cyber roadmap timeline with laser activation. e.g. { type:"roadmap-flow", left:180, top:240, width:360, height:280, roadmapFlowData:{ title:"LỘ TRÌNH PRO", milestones:[{id:"m1", stage:"BƯỚC 1", title:"Nền Tảng", icon:"🌱", color:"#00D4FF", status:"completed", badge:"DONE"}, {id:"m2", stage:"BƯỚC 2", title:"Chuyên Sâu", icon:"⚡", color:"#BEFF01", status:"active", badge:"NOW"}, {id:"m3", stage:"BƯỚC 3", title:"Đỉnh Cao", icon:"🚀", color:"#FFB800", status:"locked", badge:"TARGET"}] } }`,
  },
  'table': {
    category: ELEMENT_CATEGORIES.INFOGRAPHICS_FRAMEWORKS,
    ui: {
      groupTitle: 'Cạnh tranh & Đối đầu',
      icon: '📑',
      label: 'Bảng So Sánh',
      previewBadge: 'BẢNG BIỂU',
      color: '#00D4FF',
      preset: 'slide-up',
    },
    ai: (ACCENT) => `Comparison table. e.g. { type:"table", left:180, top:220, width:300, height:180, tableData:{ headers:["A", "B"], rows:[["Point 1", "Point 2"]] }, animPreset:"slide-up" }`,
  },
  'vs-card': {
    category: ELEMENT_CATEGORIES.INFOGRAPHICS_FRAMEWORKS,
    ai: (ACCENT) => `Split vs cards. e.g. { type:"vs-card", left:180, top:230, width:320, height:190, leftCard:{title:"CŨ", points:["Chậm", "Đắt"], color:"#FF5544"}, rightCard:{title:"MỚI", points:["Nhanh", "Rẻ"], color:"${ACCENT}"}, animPreset:"zoom-in" }`,
  },
  'vs-battle': {
    category: ELEMENT_CATEGORIES.INFOGRAPHICS_FRAMEWORKS,
    ui: {
      groupTitle: 'Cạnh tranh & Đối đầu',
      icon: '🥊',
      label: 'Hiệp Đấu Đối Đầu',
      previewBadge: 'ĐỐI ĐẦU',
      color: '#FF3366',
      preset: 'fade-in',
    },
    ai: (ACCENT) => `Live round-by-round battle scorecard. e.g. { type:"vs-battle", left:180, top:130, width:330, height:340, vsBattle:{leftSubject:{name:"Cách Cũ", icon:"❌", color:"#FF5544"}, rightSubject:{name:"Cách Mới", icon:"⚡", color:"${ACCENT}"}, rounds:[{criterion:"⚡ Tốc độ", winner:"right", leftValue:"3 giờ", rightValue:"10 giây"}]}}, animPreset:"fade-in" }`,
  },
  'timeline': {
    category: ELEMENT_CATEGORIES.INFOGRAPHICS_FRAMEWORKS,
    ui: {
      groupTitle: 'Hệ sinh thái & Lộ trình',
      icon: '⏳',
      label: 'Dòng Thời Gian',
      previewBadge: 'TIMELINE',
      color: '#00D4FF',
      preset: 'fade-in',
      defaultWidth: 280,
      defaultHeight: 220,
      defaultPayload: {
        flowSteps: [
          { title: 'Hôm Qua', subtitle: 'Đau buồn & học hỏi' },
          { title: 'Hôm Nay', subtitle: 'Chấp nhận & tĩnh lặng' },
          { title: 'Mai Sau', subtitle: 'Bình an & vững vàng' }
        ]
      }
    },
    ai: (ACCENT) => `Vertical step timeline. e.g. { type:"timeline", left:180, top:230, width:280, flowSteps:[{title:"2023", subtitle:"Khởi đầu"}, {title:"2026", subtitle:"Bùng nổ"}], accentColor:"${ACCENT}", animPreset:"fade-in" }`,
  },
  'pyramid-funnel': {
    category: ELEMENT_CATEGORIES.INFOGRAPHICS_FRAMEWORKS,
    ui: {
      groupTitle: 'Hệ sinh thái & Lộ trình',
      icon: '🔺',
      label: 'Phễu Kim Tự Tháp',
      previewBadge: 'PHỄU 3 TẦNG',
      color: '#FFB800',
      preset: 'zoom-in',
    },
    ai: (ACCENT) => `3D glassmorphic stacked pyramid/funnel diagram. e.g. { type:"pyramid-funnel", left:180, top:220, width:320, height:220, pyramidLayers:[{label:"TẦNG 1: HOOK", sub:"Thu hút", color:"${ACCENT}"}, {label:"TẦNG 2: GIÁ TRỊ", sub:"Insight", color:"#00D4FF"}], animPreset:"zoom-in" }`,
  },
  'tree-diagram': {
    category: ELEMENT_CATEGORIES.INFOGRAPHICS_FRAMEWORKS,
    ui: {
      groupTitle: 'Hệ sinh thái & Lộ trình',
      icon: '🌳',
      label: 'Sơ Đồ Cây / Tech',
      previewBadge: 'LỘ TRÌNH',
      color: '#00D4FF',
      preset: 'zoom-in',
    },
    ai: (ACCENT) => `Hierarchical tech stack / roadmap feature tree. e.g. { type:"tree-diagram", left:180, top:200, width:330, treeData:{title:"LỘ TRÌNH LÀM CHỦ AI", rootNode:{label:"AI DEV", icon:"🤖"}, branches:[{group:"Giai đoạn 1", items:["Prompting", "Basics"], color:"#00D4FF"}, {group:"Giai đoạn 2", items:["Agents", "Remotion"], color:"${ACCENT}"}]}, animPreset:"zoom-in" }`,
  },
  'network-graph': {
    category: ELEMENT_CATEGORIES.INFOGRAPHICS_FRAMEWORKS,
    ui: {
      groupTitle: 'Hệ sinh thái & Lộ trình',
      icon: 'zap',
      label: 'Mạng Lưới Node',
      previewBadge: 'ECOSYSTEM',
      color: '#00FF88',
      preset: 'fade-in',
      defaultWidth: 280,
      defaultHeight: 280,
      defaultPayload: {
        networkNodes: [
          { label: 'AI Core', icon: 'brain', color: '#BEFF01' },
          { label: 'NLP Engine', icon: 'chat', color: '#00D4FF' },
          { label: 'Vision AI', icon: 'eye', color: '#00FF88' },
          { label: 'Database', icon: 'database', color: '#FFB800' },
          { label: 'Security', icon: 'lock', color: '#FF3366' },
          { label: 'Logic Flow', icon: 'code', color: '#BD00FF' },
        ],
      },
    },
    ai: (ACCENT) => `Ecosystem / interconnected node network. e.g. { type:"network-graph", left:180, top:220, width:280, accentColor:"${ACCENT}", networkNodes:[{label:"AI Core", icon:"brain"}, {label:"NLP Engine", icon:"chat"}, {label:"Vision AI", icon:"eye"}, {label:"Database", icon:"database"}, {label:"Security", icon:"lock"}, {label:"Logic Flow", icon:"code"}], animPreset:"fade-in" }`,
  },
  'ranking-list': {
    category: ELEMENT_CATEGORIES.INFOGRAPHICS_FRAMEWORKS,
    ai: (ACCENT) => `Staggered leaderboard with Medals. e.g. { type:"ranking-list", left:180, top:200, width:320, height:210, content:"TOP 3 CÔNG CỤ", rankingItems:[{rank:1, name:"Top 1 Tool", score:"98%", badge:"Quán Quân", color:"#FFD700"}], animPreset:"slide-up" }`,
  },
  'checklist': {
    category: ELEMENT_CATEGORIES.INFOGRAPHICS_FRAMEWORKS,
    ui: {
      groupTitle: 'Cạnh tranh & Đối đầu',
      icon: '📋',
      label: 'Checklist 2.0',
      previewBadge: 'TIÊU CHÍ',
      color: '#BEFF01',
      preset: 'slide-up',
    },
    ai: (ACCENT) => `Interactive Modern Checklist with Live Tick animation. Supports styles: "glass" | "minimal" | "audit" | "cyber". e.g. { type:"checklist", left:180, top:200, width:336, content:"3 BÍ QUYẾT BẮT BUỘC", checklistData:{ title:"3 BÍ QUYẾT BẮT BUỘC", badge:"QUY TẮC", style:"glass", tickAnimation:true, items:[{text:"Xác thực 2 lớp 2FA", subtext:"Bảo vệ tài khoản", status:"checked"}, {text:"Không click link lạ", subtext:"Tránh mã độc", status:"checked"}, {text:"Dùng pass đơn giản", subtext:"Rủi ro bị hack", status:"cross"}] }, animPreset:"slide-up" }`,
  },
  'hand-drawn': {
    category: ELEMENT_CATEGORIES.INFOGRAPHICS_FRAMEWORKS,
    ai: (ACCENT) => `Animated hand-drawn vector path (powered by @remotion/paths evolvePath). Fields: stroke (color hex, default "${ACCENT}"), strokeWidth (2-8, default 4.5), svgContent (SVG path d="..." string), width/height (px), viewBox (e.g. "0 0 210 140"). Use for: organic circle highlight around key stats/words, wavy underlines, curved arrows pointing to visual focal points, or cross scratch to reject false ideas. e.g. { type:"hand-drawn", left:180, top:260, width:150, height:100, stroke:"${ACCENT}", strokeWidth:4.5, svgContent:"M 20 60 C 20 20, 80 15, 130 18 C 175 22, 190 55, 185 85 C 180 115, 130 125, 75 120 C 30 115, 15 80, 25 55 Z", viewBox:"0 0 210 140", animPreset:"none", animDuration:1.4 }`,
  },

  // ── CINEMA_SOCIAL_PROOF ───────────────────────────────────────────
  'social-callout': {
    category: ELEMENT_CATEGORIES.CINEMA_SOCIAL_PROOF,
    ai: (ACCENT) => `Viral social proof notification card (bank alert, tweet, chat, news ticker). CRITICAL: Must include a 'calloutData' object. animDelay creates the dramatic "pop-in" stagger effect after the main title. Examples:
  Bank money transfer proof: { type:"social-callout", left:180, top:340, width:310, height:130, animPreset:"zoom-in", animDuration:0.5, animDelay:0.6, accentColor:"#00D46A", calloutData:{ variant:"bank", title:"+250,000,000 đ", subtitle:"VIETCOMBANK", content:"Lợi nhuận Q4 chuyển về", badge:"THÀNH CÔNG", accentColor:"#00D46A" } }
  Expert tweet quote: { type:"social-callout", left:180, top:340, width:310, height:130, animPreset:"slide-up", animDuration:0.5, animDelay:0.5, accentColor:"#1DA1F2", calloutData:{ variant:"tweet", title:"Sam Altman", subtitle:"@sama", content:"AI sẽ thay thế 80% công việc trong 10 năm tới.", badge:"VERIFIED", accentColor:"#1DA1F2" } }
  Client closing chat: { type:"social-callout", left:180, top:340, width:310, height:110, animPreset:"zoom-in", animDuration:0.4, animDelay:0.7, accentColor:"#FF6B6B", calloutData:{ variant:"chat", title:"Khách VIP Linh", content:"Em chốt rồi! Chuyển cọc liền nha 🔥", accentColor:"#FF6B6B" } }
  Breaking news ticker: { type:"social-callout", left:180, top:400, width:320, height:55, animPreset:"slide-up", animDuration:0.3, animDelay:0.4, accentColor:"#FF2D78", calloutData:{ variant:"news", title:"TIN NÓNG 24H", content:"Chứng khoán Mỹ bốc hơi 2 nghìn tỷ USD trong 1 giờ", accentColor:"#FF2D78" } }`,
  },
  'document-evidence': {
    category: ELEMENT_CATEGORIES.CINEMA_SOCIAL_PROOF,
    ai: (ACCENT) => `Dramatic document reveal element (fluorescent highlighter, classified stamp, sticky paper note). CRITICAL: Must include a 'docData' object. animDelay creates the cinematic "reveal after pause" effect. Examples:
  Highlighter redacted doc: { type:"document-evidence", left:180, top:330, width:310, height:140, animPreset:"zoom-in", animDuration:0.6, animDelay:0.5, accentColor:"#FFE600", docData:{ variant:"highlighter", title:"BÁO CÁO MẬT", content:"Tăng trưởng doanh thu thuần đạt 347% chỉ trong 90 ngày đầu.", highlight:"347%", badge:"TRÍCH XUẤT", accentColor:"#FFE600" } }
  Classified stamp: { type:"document-evidence", left:180, top:350, width:280, height:120, animPreset:"zoom-in", animDuration:0.4, animDelay:0.8, accentColor:"#FF3333", docData:{ variant:"stamp", title:"TUYỆT MẬT", subtitle:"HỒ SƠ #2025-09", badge:"BỊ XÓA KHỎI INTERNET", accentColor:"#FF3333" } }
  Sticky paper note tip: { type:"document-evidence", left:180, top:350, width:290, height:120, animPreset:"bounce", animDuration:0.5, animDelay:0.6, accentColor:"#FFD700", docData:{ variant:"note", title:"GHI NHỚ", content:"Không bao giờ đầu tư số tiền bạn không thể mất!", badge:"📌 BỎ TÚI", accentColor:"#FFD700" } }`,
  },
  'fake-search': {
    category: ELEMENT_CATEGORIES.CINEMA_SOCIAL_PROOF,
    ai: (ACCENT) => `Dynamic animated search bar with real-time typewriter effect. Best for viral hook questions, keyword reveals, or curiosity triggers. e.g. { type:"fake-search", left:180, top:200, width:310, height:54, content:"Cách làm video triệu view...", accentColor:"${ACCENT}", searchData:{ keyword:"Cách làm video triệu view...", engine:"glass", typingSpeed:2, autoSearchBadge:"XU HƯỚNG", accentColor:"${ACCENT}" } }`,
  },
  'push-notification': {
    category: ELEMENT_CATEGORIES.CINEMA_SOCIAL_PROOF,
    ai: (ACCENT) => `iOS 17 lock screen push notification card. Best for dramatic opening alerts (banking deposits, VIP client chat, urgent warning). e.g. { type:"push-notification", left:180, top:140, width:320, height:85, animPreset:"slide-up", animDuration:0.5, animDelay:0.2, accentColor:"#00D46A", notificationData:{ appName:"VIETCOMBANK", appIcon:"🏦", title:"+50,000,000 đ", message:"Lợi nhuận Q4 chuyển về tài khoản", timeText:"vừa xong", badge:"THÀNH CÔNG", accentColor:"#00D46A" } }`,
  },
  'frame-mockup': {
    category: ELEMENT_CATEGORIES.CINEMA_SOCIAL_PROOF,
    ai: (ACCENT) => `Professional device / browser overlay mockup that wraps the scene video. Best for SaaS tutorials, web demonstrations, or mobile app showcases. e.g. { type:"frame-mockup", left:180, top:200, width:330, height:220, accentColor:"${ACCENT}", animPreset:"fade-in", frameData:{ framePreset:"browser-macos", urlText:"app.motionstudio.ai", theme:"dark", borderWidth:3, accentColor:"${ACCENT}" } }`,
  },
  'audio-waveform': {
    category: ELEMENT_CATEGORIES.CINEMA_SOCIAL_PROOF,
    ai: (ACCENT) => `Dynamic FFT audio spectrum visualizer. e.g. { type:"audio-waveform", left:180, top:580, width:280, height:40, waveformColor:"${ACCENT}", numberOfBars:24, animPreset:"fade-in" }`,
  },
  'lottie': {
    category: ELEMENT_CATEGORIES.CINEMA_SOCIAL_PROOF,
    ai: (ACCENT) => `Vector animated sticker. e.g. { type:"lottie", left:180, top:180, width:80, height:80, lottiePreset:"tech-hud", animPreset:"zoom-in" }`,
  },
  'quote-box': {
    category: ELEMENT_CATEGORIES.CINEMA_SOCIAL_PROOF,
    ui: {
      groupTitle: 'Typography & Hooks',
      icon: '❝',
      label: 'Khung Trích Dẫn',
      previewBadge: 'QUOTE',
      color: '#FFD700',
      preset: 'slide-up',
      defaultWidth: 312,
      defaultHeight: 140,
      defaultPayload: {
        content: 'Người bình thường giải quyết hậu quả. Chuyên gia giải quyết nguyên nhân gốc rễ.',
        authorName: 'Chiêm Nghiệm',
        accentColor: '#FFD700',
        fontSize: 16,
        showWatermark: true,
      },
    },
    ai: (ACCENT) => `Elegant quote box. e.g. { type:"quote-box", left:180, top:230, width:300, height:140, content:"Câu nói hay", authorName:"Tác giả", accentColor:"${ACCENT}", animPreset:"slide-up" }`,
  },
  'chat-mockup': {
    category: ELEMENT_CATEGORIES.CINEMA_SOCIAL_PROOF,
    ai: (ACCENT) => `Animated messaging chat bubbles. e.g. { type:"chat-mockup", left:180, top:200, width:320, height:220, content:"Tin Nhắn", chatMessages:[{sender:"left", name:"Khách", text:"Có cách nào làm nhanh không?"}, {sender:"right", name:"Bạn", text:"Dùng ngay AI này!"}], animPreset:"zoom-in" }`,
  },
  'quiz-card': {
    category: ELEMENT_CATEGORIES.CINEMA_SOCIAL_PROOF,
    ai: (ACCENT) => `Interactive quiz card. e.g. { type:"quiz-card", left:180, top:200, width:320, height:220, quizData:{question:"Bạn đã biết tính năng này chưa?", options:[{id:"A", text:"A. Chưa biết"}, {id:"B", text:"B. Đang dùng"}], correctId:"B", revealDelaySec:1.5}, animPreset:"zoom-in" }`,
  },
  'code-terminal': {
    category: ELEMENT_CATEGORIES.CINEMA_SOCIAL_PROOF,
    ai: (ACCENT) => `macOS developer terminal window with code typing. e.g. { type:"code-terminal", left:180, top:200, width:320, height:190, codeData:{filename:"app.ts", language:"TypeScript", code:"const video = await ai.create();"}, animPreset:"slide-up" }`,
  },
  'breathing-circle': {
    category: ELEMENT_CATEGORIES.CINEMA_SOCIAL_PROOF,
    ui: {
      groupTitle: 'Thiền & Chữa lành',
      icon: '⭕',
      label: 'Vòng Thở 4-7-8',
      previewBadge: 'MINDFUL',
      color: '#86EFAC',
      preset: 'fade-in',
      defaultWidth: 240,
      defaultHeight: 260,
      defaultPayload: {
        accentColor: '#86EFAC',
        breathingData: {
          title: 'HÍT THỞ CHÁNH NIỆM',
          subtitle: 'Kỹ thuật thở sâu 4-7-8',
          pattern: '4-7-8',
          visualStyle: 'concentric-orb',
          cycleDurationSec: 8,
          accentColor: '#86EFAC',
        }
      }
    },
    ai: (ACCENT) => `Mindful breathing guide circle pulsing with inhale/hold/exhale biological rhythm. e.g. { type:"breathing-circle", left:180, top:260, width:220, height:220, accentColor:"#86EFAC", breathingData:{ title:"HÍT THỞ CHÁNH NIỆM", subtitle:"Kỹ thuật thở sâu 4-7-8", pattern:"4-7-8", visualStyle:"concentric-orb", cycleDurationSec:8 }, animPreset:"fade-in" }`,
  },
  'zen-ripple': {
    category: ELEMENT_CATEGORIES.CINEMA_SOCIAL_PROOF,
    ui: {
      groupTitle: 'Thiền & Chữa lành',
      icon: '💧',
      label: 'Sóng Nước Chữa Lành',
      previewBadge: 'ASMR',
      color: '#48CAE4',
      preset: 'fade-in',
      defaultWidth: 240,
      defaultHeight: 260,
      defaultPayload: {
        type: 'breathing-circle',
        accentColor: '#48CAE4',
        breathingData: {
          title: 'THƯ GIÃN SÂU',
          subtitle: 'Sóng nước lan tỏa',
          pattern: '4-7-8',
          visualStyle: 'water-ripple',
          cycleDurationSec: 8,
          accentColor: '#48CAE4',
        }
      }
    },
    ai: (ACCENT) => `Zen water ripples droplet effect for deep relaxation. e.g. { type:"breathing-circle", left:180, top:260, width:220, height:220, accentColor:"#48CAE4", breathingData:{ title:"THƯ GIÃN SÂU", subtitle:"Sóng nước lan tỏa", pattern:"4-7-8", visualStyle:"water-ripple", cycleDurationSec:8 }, animPreset:"fade-in" }`,
  },
  'zen-singing-bowl': {
    category: ELEMENT_CATEGORIES.CINEMA_SOCIAL_PROOF,
    ui: {
      groupTitle: 'Thiền & Chữa lành',
      icon: '🔔',
      label: 'Chuông Xoay Tây Tạng',
      previewBadge: '432Hz',
      color: '#D4A373',
      preset: 'fade-in',
      defaultWidth: 240,
      defaultHeight: 260,
      defaultPayload: {
        type: 'breathing-circle',
        accentColor: '#D4A373',
        breathingData: {
          title: 'TẦN SỐ CHỮA LÀNH',
          subtitle: '432Hz Tâm Trí',
          pattern: 'coherence',
          visualStyle: 'singing-bowl',
          cycleDurationSec: 11,
          accentColor: '#D4A373',
        }
      }
    },
    ai: (ACCENT) => `Tibetan singing bowl with glowing sound waves frequency. e.g. { type:"breathing-circle", left:180, top:260, width:220, height:220, accentColor:"#D4A373", breathingData:{ title:"TẦN SỐ CHỮA LÀNH", subtitle:"432Hz Tâm Trí", pattern:"coherence", visualStyle:"singing-bowl", cycleDurationSec:11 }, animPreset:"fade-in" }`,
  },
  'zen-pebble-balance': {
    category: ELEMENT_CATEGORIES.CINEMA_SOCIAL_PROOF,
    ui: {
      groupTitle: 'Thiền & Chữa lành',
      icon: '🪨',
      label: 'Tháp Đá Thăng Bằng',
      previewBadge: 'ZEN',
      color: '#A89F91',
      preset: 'fade-in',
      defaultWidth: 200,
      defaultHeight: 240,
      defaultPayload: {
        type: 'breathing-circle',
        accentColor: '#A89F91',
        breathingData: {
          title: 'TĨNH TẠI',
          subtitle: 'Cân bằng nội tâm',
          pattern: 'box',
          visualStyle: 'zen-stones',
          cycleDurationSec: 16,
          accentColor: '#A89F91',
        }
      }
    },
    ai: (ACCENT) => `Zen stone stacking pebble balance animation. e.g. { type:"breathing-circle", left:180, top:260, width:200, height:240, accentColor:"#A89F91", breathingData:{ title:"TĨNH TẠI", subtitle:"Cân bằng nội tâm", pattern:"box", visualStyle:"zen-stones", cycleDurationSec:16 }, animPreset:"fade-in" }`,
  },
  'vinyl-pulse': {
    category: ELEMENT_CATEGORIES.CINEMA_SOCIAL_PROOF,
    ui: {
      groupTitle: 'Thiền & Chữa lành',
      icon: '🎵',
      label: 'Đĩa Than & Sóng Lofi',
      previewBadge: '432Hz LOFI',
      color: '#C4B5FD',
      preset: 'slide-up',
      defaultWidth: 320,
      defaultHeight: 85,
      defaultPayload: {
        accentColor: '#C4B5FD',
        vinylData: {
          songTitle: 'Rainy Cafe & 432Hz Healing',
          artistOrVibe: 'Lofi Chữa Lành • An Yên',
          waveColor: '#93C5FD',
          accentColor: '#C4B5FD',
          badge: '432Hz CHILL',
        }
      }
    },
    ai: (ACCENT) => `Vintage spinning vinyl record with fluid sine audio waveform. e.g. { type:"vinyl-pulse", left:180, top:380, width:320, height:85, accentColor:"#C4B5FD", vinylData:{ songTitle:"Rainy Cafe & 432Hz Healing", artistOrVibe:"Lofi Chữa Lành • An Yên", waveColor:"#93C5FD", badge:"432Hz CHILL" }, animPreset:"slide-up" }`,
  },
  'character-mascot': {
    category: ELEMENT_CATEGORIES.CINEMA_SOCIAL_PROOF,
    ai: (ACCENT) => `Doodle mascot with expressions/actions for storytelling. e.g. { type:"character-mascot", pose:"idea", left:180, top:380, width:220, height:310, blendMode:"screen", glowIntensity:8, accentColor:"${ACCENT}", animPreset:"bounce-in", flipX:false } (Supported poses: 'happy', 'thinking', 'confused', 'skeptical', 'shocked', 'cool', 'idea', 'pointing-up', 'laptop', 'running', 'cheering', 'coffee')`,
  },

  // ── STEM SCIENTIFIC MODULE ─────────────────────────────────────
  'math-plot': {
    category: ELEMENT_CATEGORIES.INFOGRAPHICS_FRAMEWORKS,
    ui: {
      defaultPayload: {
        mathData: {
          expression: 'sin(x - 2 * t)',
          domainX: [-5, 5],
          domainY: [-2.5, 2.5],
          color: '#BEFF01',
          lineWidth: 3.5,
          showGrid: true,
          showAxes: true,
          animateSpeed: 1.0,
          title: 'Dao Động Sóng Hình Sin',
          latexLabel: 'y = \\sin(x - \\omega t)',
        }
      }
    },
    ai: (ACCENT) => `Interactive 2D animated mathematical function plot (Mafs 60fps). Expression uses math.js syntax (x^2, sin(x), exp(x), sqrt(x), pi) with variable 'x' and optionally time 't'; never JavaScript (no Math.*, no **, no code). e.g. {
      title: "Hàm Số Tăng Trưởng Lũy Thừa",
      latexLabel: "y = e^{0.5x}",
      expression: "exp(0.5 * x) - 1",
      domainX: [-4, 4],
      domainY: [-2, 6],
      color: "${ACCENT}",
      lineWidth: 3.5,
      showGrid: true,
      showAxes: true,
      animateSpeed: 1.0
    }`,
  },
  'chemical-molecule': {
    category: ELEMENT_CATEGORIES.INFOGRAPHICS_FRAMEWORKS,
    ui: {
      defaultPayload: {
        chemData: {
          smiles: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C',
          name: 'Caffeine',
          lookupName: 'Caffeine',
          pubchemCid: 2519,
          formula: 'C8H10N4O2',
          theme: 'neon',
          bondThickness: 2.2,
          subtext: 'Chất kích thích hệ thần kinh trung ương',
        }
      }
    },
    ai: (ACCENT) => `2D chemical molecule structural formula. "name" is the English or IUPAC compound name used for a PubChem lookup; "displayName" is the Vietnamese name shown on screen. Never write SMILES or formula: the system fills them from PubChem. e.g. {
      name: "Dopamine",
      displayName: "Dopamine",
      theme: "neon",
      bondThickness: 2.2,
      subtext: "Chất dẫn truyền thần kinh tạo động lực và khoái cảm"
    }`,
  },
  'latex-formula': {
    category: ELEMENT_CATEGORIES.INFOGRAPHICS_FRAMEWORKS,
    ui: {
      defaultPayload: {
        latexData: {
          title: 'Thuyết Tương Đối Einstein',
          latex: 'E = mc^2',
          fontSize: 28,
          color: '#ffffff',
          glow: true,
          showBackground: true,
        }
      }
    },
    ai: (ACCENT) => `Scientific and mathematical formula rendered with KaTeX. Must provide valid LaTeX syntax. e.g. {
      title: "Tích Phân Chuẩn Gauss",
      latex: "\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}",
      fontSize: 26,
      color: "#ffffff",
      glow: true,
      showBackground: true
    }`,
  },
  'interactive-quiz': {
    category: ELEMENT_CATEGORIES.INFOGRAPHICS_FRAMEWORKS,
    ui: {
      defaultPayload: {
        quizData: {
          quizType: 'single-choice',
          badge: 'THỬ THÁCH 5S',
          question: 'Kim loại nào sau đây dẫn điện tốt nhất?',
          options: [
            { id: 'A', text: 'Nhôm (Al)' },
            { id: 'B', text: 'Đồng (Cu)' },
            { id: 'C', text: 'Bạc (Ag)' },
            { id: 'D', text: 'Vàng (Au)' },
          ],
          correctAnswers: ['C'],
          introSec: 3,
          countdownSec: 5,
          revealSec: 4,
          explanation: 'Bạc (Ag) dẫn điện tốt nhất trong mọi kim loại, tiếp theo là Đồng, Vàng và Nhôm.',
          showExplanation: true,
          themePreset: 'studio-neon',
          layoutVariant: 'stacked',
        }
      }
    },
    ai: (ACCENT) => `Interactive multiple choice countdown quiz. e.g. {
      quizType: "single-choice",
      badge: "THỬ THÁCH 5S",
      question: "Kim loại nào dẫn điện tốt nhất?",
      options: [
        { id: "A", text: "Nhôm (Al)" },
        { id: "B", text: "Đồng (Cu)" },
        { id: "C", text: "Bạc (Ag)" },
        { id: "D", text: "Vàng (Au)" }
      ],
      correctAnswers: ["C"],
      countdownSec: 5,
      introSec: 3,
      explanation: "Bạc (Ag) có điện trở suất thấp nhất nên dẫn điện tốt nhất."
    }`,
  },
  'physics-sim': {
    category: ELEMENT_CATEGORIES.INFOGRAPHICS_FRAMEWORKS,
    ui: {
      defaultPayload: {
        physicsData: {
          presetId: 'newton-cradle',
          theme: 'chalkboard',
          showVectors: true,
          showTrajectories: true,
          showHUD: true,
          showGrid: true,
          showFormulas: true,
          customParams: {
            ballCount: 5,
            ballRadius: 16,
            stringLength: 140,
            restitution: 0.99,
            liftCount: 1,
            liftAngleDeg: 45,
          },
        },
      },
    },
    ai: (ACCENT) => `Interactive 2D Physics & Science Simulation (Matter.js 60fps deterministic engine).
    [Supported Presets]:
    - 'newton-cradle': Momentum & Energy conservation con lắc Newton (5 steel balls).
    - 'inclined-plane': Ramp sliding with gravity vector P, normal N, and friction F_ms forces.
    - 'projectile-motion': Parabolic cannon launch with real-time velocity vectors and H_max/L range pins.
    - 'spring-harmonic': Harmonic oscillator F = -kx with synchronized real-time wave chart x(t).
    - 'bouncing-box-viral': Chaotic high-restitution bouncing spheres in enclosed container (Shorts viral hook).
    - 'galileo-fall': Galileo free-fall comparison: Vacuum vs Air drag resistance.
    - 'angle-battle': 3-way launch angle shootout: 30° vs 45° vs 60° (proving 45° reaches max range).
    - 'friction-battle': Friction comparison: Ice slide (mu=0.02) vs Rough stone slide (mu=0.35).
    - 'brachistochrone-race': Brachistochrone curve paradox (Cycloid vs Straight Line vs Arc fastest descent).
    - 'planets-gravity': Planetary gravity comparison: Moon (1.62) vs Mars (3.72) vs Earth (9.80) vs Jupiter (24.79).
    [Features]:
    - Auto mechanical collision SFX (clicks/pops/thuds) synced to frame.
    - Freeze Frame Quiz Hook: pauses simulation at freezeAtSec for 3-5s countdown with question/answer reveal.
    Themes: 'chalkboard' | 'blueprint' | 'cyber-neon' | 'minimal-dark' | 'academic-light'`,
  },
  'algorithm-sim': {
    category: ELEMENT_CATEGORIES.INFOGRAPHICS_FRAMEWORKS,
    ui: {
      defaultPayload: {
        algorithmData: {
          mode: 'battle',
          battleLanes: [
            { algorithmId: 'quick-sort', label: 'QUICK SORT O(N LOG N)', accentColor: '#00D4FF' },
            { algorithmId: 'bubble-sort', label: 'BUBBLE SORT O(N²)', accentColor: '#FF6B6B' },
          ],
          arraySize: 24,
          initialType: 'random',
          seed: 42,
          speedMultiplier: 1.0,
          theme: 'cyber-neon',
          soundEnabled: true,
          soundVolume: 0.7,
          showMetricsHUD: true,
        },
      },
    },
    ai: (ACCENT) => `Interactive Computer Science & Algorithm Battle Simulation (Deterministic discrete trace 60fps).
    [Supported Modes]:
    - 'battle': Multi-lane speed race between sorting algorithms on identical input array (e.g. Quick Sort O(n log n) vs Bubble Sort O(n^2)).
    - 'single': Deep-dive single algorithm step-by-step trace visualization with pivot, compare, swap highlights.
    [Algorithms]:
    - 'quick-sort': Divide and conquer O(n log n).
    - 'bubble-sort': Adjacent compare and swap O(n^2).
    - 'merge-sort': Recursive split and merge O(n log n).
    - 'insertion-sort': Incremental card-like insertion O(n^2).
    - 'selection-sort': Find minimum element O(n^2).
    [Features]:
    - The Sound of Sorting: Pitched audio feedback for each swap step.
    - Freeze Frame Quiz Hook: Interactive 3s pause guessing the winner.
    Themes: 'cyber-neon' | 'matrix-code' | 'blueprint' | 'chalkboard' | 'minimal-dark'`,
  },
  'vocab-card': {
    category: ELEMENT_CATEGORIES.INFOGRAPHICS_FRAMEWORKS,
    ui: {
      defaultPayload: {
        accentColor: '#FFB800',
        vocabData: {
          word: 'CRUCIAL',
          partOfSpeech: 'adj',
          ipa: '/ˈkruː.ʃəl/',
          audioAccent: 'UK',
          cefrLevel: 'IELTS 7.0+',
          meaningVi: 'Cực kỳ quan trọng, có tính quyết định',
          meaningEn: 'Extremely important or necessary',
          exampleEn: 'Regular exercise plays a crucial role in maintaining good health.',
          exampleVi: 'Tập thể dục đều đặn đóng vai trò cực kỳ quan trọng đối với sức khỏe.',
          highlightWord: 'crucial role',
          synonyms: ['Essential', 'Vital', 'Pivotal'],
          collocations: ['play a crucial role', 'crucial decision'],
          cardStyle: 'glass-modern',
          introSec: 2.5,
          meaningSec: 2.5,
          exampleSec: 3.0,
        }
      }
    },
    ai: (ACCENT) => `Interactive vocabulary flashcard for language teaching. e.g. {
      word: "CRUCIAL",
      partOfSpeech: "adj",
      ipa: "/ˈkruː.ʃəl/",
      audioAccent: "UK",
      cefrLevel: "IELTS 7.0+",
      meaningVi: "Cực kỳ quan trọng, có tính quyết định",
      meaningEn: "Extremely important or necessary",
      exampleEn: "Regular exercise plays a crucial role in maintaining good health.",
      exampleVi: "Tập thể dục đều đặn đóng vai trò quyết định.",
      highlightWord: "crucial role",
      synonyms: ["Essential", "Vital", "Pivotal"]
    }`,
  },
  'generative-svg': {
    category: ELEMENT_CATEGORIES.DYNAMIC_FLOWS_PRO,
    ui: {
      groupTitle: 'Luồng dữ liệu Cyber',
      icon: '✨',
      label: 'Đồ Họa Vector Toán Học',
      previewBadge: 'AI Y=f(X)',
      color: '#BEFF01',
      preset: 'zoom-in',
      defaultWidth: 220,
      defaultHeight: 220,
      defaultPayload: {
        title: 'QUỸ ĐẠO LƯỢNG TỬ',
        formula: 'quantum-orbit',
        accentColor: '#BEFF01',
        secondaryColor: '#00F2FE',
      }
    },
    ai: (ACCENT) => `Mathematical generative kinetic vector graphic (Y=f(X) XD-SVG standard). Used for abstract visual metaphors (inflation, tension, connection, compounding). e.g. {
      type: "generative-svg",
      left: 180,
      top: 220,
      width: 220,
      height: 220,
      title: "QUỸ ĐẠO LƯỢNG TỬ",
      accentColor: "${ACCENT}",
      formula: "quantum-orbit",
      animPreset: "zoom-in"
    }`,
  },
};

/**
 * Generates the dictionary structure expected by AI Prompt builders
 * @param {string} ACCENT - Primary accent color hex
 * @returns {Record<string, Record<string, string>>}
 */
export const getCoreCatalog = (ACCENT) => {
  const catalog = {
    [ELEMENT_CATEGORIES.TYPOGRAPHY_BASIC]: {},
    [ELEMENT_CATEGORIES.DATA_CHARTS]: {},
    [ELEMENT_CATEGORIES.INFOGRAPHICS_FRAMEWORKS]: {},
    [ELEMENT_CATEGORIES.CINEMA_SOCIAL_PROOF]: {},
    [ELEMENT_CATEGORIES.DYNAMIC_FLOWS_PRO]: {},
  };

  for (const [type, def] of Object.entries(ELEMENTS_REGISTRY)) {
    if (catalog[def.category] && typeof def.ai === 'function') {
      catalog[def.category][type] = def.ai(ACCENT);
    }
  }

  return catalog;
};

/**
 * Returns grouped list of charts for LeftPanel UI (SvgPanel.tsx)
 * @returns {Array<{ groupTitle: string, items: Array<any> }>}
 */
export const getChartsForUi = () => {
  const groupsMap = new Map();
  UI_CHART_GROUPS.forEach(g => groupsMap.set(g, []));

  for (const [type, def] of Object.entries(ELEMENTS_REGISTRY)) {
    if (def.ui && def.ui.groupTitle) {
      const item = {
        type,
        icon: def.ui.icon,
        label: def.ui.label,
        previewBadge: def.ui.previewBadge || '',
        color: def.ui.color,
        preset: def.ui.preset,
        defaultWidth: def.ui.defaultWidth,
        defaultHeight: def.ui.defaultHeight,
        defaultPercent: def.ui.defaultPercent,
        defaultLabel: def.ui.defaultLabel,
        defaultPayload: def.ui.defaultPayload || {},
      };

      if (!groupsMap.has(def.ui.groupTitle)) {
        groupsMap.set(def.ui.groupTitle, []);
      }
      groupsMap.get(def.ui.groupTitle).push(item);
    }
  }

  return Array.from(groupsMap.entries()).map(([groupTitle, items]) => ({
    groupTitle,
    items,
  }));
};
