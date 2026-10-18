import { SceneElement } from '@/types/scene'
import { calculateElementDynamicHeight, LEFT_ORIGIN_TYPES } from './layoutRegistry'
import { MASTER_SCENE_DEFAULT_WIDTH } from './masterSceneLayout'

export interface PlaceholderConfig {
  getLabelText: (el: SceneElement) => string;
  getAccentColor: (el: SceneElement) => string;
  originX: 'center' | 'left' | 'right';
  originY: 'center' | 'top';
  lockRatio: boolean;
  defaultWidth?: number | ((el: SceneElement) => number);
  defaultHeight?: number | ((el: SceneElement) => number);
}

export const CHART_PLACEHOLDER_REGISTRY: Record<string, PlaceholderConfig> = {
  // ── CORE CHARTS ──
  'line-chart': {
    getLabelText: (el) => `${el?.content || 'XU HƯỚNG TĂNG TRƯỞNG'}\nBiểu đồ đường (Dữ liệu tĩnh)\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || el.color || '',
    originX: 'center', originY: 'top', lockRatio: true,
    defaultWidth: 336,
    defaultHeight: 180,
  },
  'chart-bar': {
    getLabelText: (el) => `${el?.content || 'SO SÁNH CHỈ SỐ DOANH SỐ'}\nBiểu đồ cột so sánh\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || el.color || '',
    originX: 'center', originY: 'top', lockRatio: true,
    defaultWidth: (el) => el.width || 336,
    defaultHeight: (el) => calculateElementDynamicHeight(el),
  },
  'pie-chart': {
    getLabelText: (el) => `${el?.content || 'CƠ CẤU PHÂN BỔ THỊ PHẦN'}\nBiểu đồ tròn/Donut\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || el.color || '',
    originX: 'center', originY: 'top', lockRatio: true,
    defaultWidth: (el) => el.width || 336,
    defaultHeight: (el) => calculateElementDynamicHeight(el),
  },
  'circle-chart': {
    getLabelText: (el) => `${el?.statLabel || el?.content || 'TIẾN ĐỘ'}\nVòng tròn tiến độ\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || el.color || '',
    originX: 'center', originY: 'top', lockRatio: true,
    defaultWidth: (el) => el.width || 140,
    defaultHeight: (el) => calculateElementDynamicHeight(el),
  },
  'radar-chart': {
    getLabelText: (el) => `${el?.content || 'ĐÁNH GIÁ ĐA CHIỀU'}\nBiểu đồ mạng nhện\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || el.color || '',
    originX: 'center', originY: 'top', lockRatio: true,
    defaultWidth: 340,
    defaultHeight: 280,
  },
  'gauge-chart': {
    getLabelText: (el) => `${el?.statLabel || el?.content || 'HIỆU SUẤT'}\nBiểu đồ kim đo tốc độ\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || el.color || '',
    originX: 'center', originY: 'top', lockRatio: true,
    defaultWidth: (el) => el.width || 260,
    defaultHeight: (el) => calculateElementDynamicHeight(el),
  },
  'candlestick-chart': {
    getLabelText: (el) => `BIỂU ĐỒ NẾN NHẬT\n${el.candlestickData?.symbol || 'BTC / USDT'}\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || el.color || '',
    originX: 'center', originY: 'top', lockRatio: true
  },
  'waterfall-chart': {
    getLabelText: (el) => `THÁC NƯỚC DÒNG TIỀN\n${el.waterfallData?.title || el.content || 'Waterfall Flow'}\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || el.color || '',
    originX: 'center', originY: 'top', lockRatio: true
  },
  'racing-bar-chart': {
    getLabelText: (el) => `ĐUA CỘT THỨ HẠNG\n${el.racingBarData?.title || el.content || 'Racing Bars'}\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || el.color || '',
    originX: 'center', originY: 'top', lockRatio: true
  },
  'heatmap-matrix': {
    getLabelText: (el) => `HEATMAP MATRIX\n${el.heatmapData?.title || el.content || 'Heatmap Matrix'}\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || el.color || '',
    originX: 'center', originY: 'top', lockRatio: true,
    defaultWidth: (el) => el.width || 336,
    defaultHeight: (el) => calculateElementDynamicHeight(el),
  },
  
  // ── CYBER & DYNAMIC FLOW [PRO] ──
  'speed-meter': {
    getLabelText: (el) => `ĐỒNG HỒ TỐC KẾ\n${el.speedMeterData?.label || 'HIỆU SUẤT'}: ${el.speedMeterData?.value || 78}%\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || el.speedMeterData?.needleColor || '',
    originX: 'center', originY: 'top', lockRatio: true
  },
  'orbit-system': {
    getLabelText: (el) => `HÀNH TINH QUỸ ĐẠO\n${el.orbitData?.centerValue || '2.8B'} - ${el.orbitData?.centerLabel || 'KPI'}\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || '',
    originX: 'center', originY: 'center', lockRatio: true
  },
  'signal-wave': {
    getLabelText: (el) => `SÓNG TÍN HIỆU LIVE\n${el.signalWaveData?.title || 'SIGNAL'} [${el.signalWaveData?.badge || 'LIVE'}]\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || el.signalWaveData?.waveColor || '',
    originX: 'center', originY: 'top', lockRatio: true
  },
  'cyber-matrix': {
    getLabelText: (el) => `MA TRẬN DỮ LIỆU\n${el.cyberMatrixData?.title || 'MATRIX'} (${el.cyberMatrixData?.rows || 5}x${el.cyberMatrixData?.cols || 8})\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || el.cyberMatrixData?.baseColor || '',
    originX: 'center', originY: 'top', lockRatio: true
  },
  'liquid-fill': {
    getLabelText: (el) => `BÌNH CHẤT LỎNG NEON\n${el.liquidFillData?.label || 'NĂNG LƯỢNG'}: ${el.liquidFillData?.value !== undefined ? el.liquidFillData.value : 65}%\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || el.liquidFillData?.liquidColor || '',
    originX: 'center', originY: 'top', lockRatio: true
  },
  'neuron-network': {
    getLabelText: (el) => `MẠNG NƠ-RON AI\n${el.neuronNetworkData?.title || 'NEURAL CLUSTER'} [${el.neuronNetworkData?.status || 'ACTIVE'}]\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || el.neuronNetworkData?.coreColor || '',
    originX: 'center', originY: 'top', lockRatio: true
  },
  'hologram-bar': {
    getLabelText: (el) => `CỘT NĂNG LƯỢNG 3D\n${el.hologramBarData?.title || 'HỆ THỐNG XUNG LỰC'} (${el.hologramBarData?.bars?.length || 3} Cột)\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || el.hologramBarData?.accentColor || '',
    originX: 'center',
    originY: 'top',
    lockRatio: true,
    defaultWidth: 320,
    defaultHeight: (el) => calculateElementDynamicHeight(el),
  },
  'timeline-pulse': {
    getLabelText: (el) => `NHỊP XUNG TIMELINE\n${el.timelinePulseData?.title || 'MILESTONE PULSE'} (${el.timelinePulseData?.milestones?.length || 4} Mốc)\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || el.timelinePulseData?.pulseColor || '',
    originX: 'center', originY: 'top', lockRatio: true
  },
  'lifecycle-matrix': {
    getLabelText: (el) => `MA TRẬN 3 CỘT VÒNG ĐỜI\n${el.lifecycleMatrixData?.title || 'LIFECYCLE MATRIX'} [3-STAGE]\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || el.lifecycleMatrixData?.columns?.[el.lifecycleMatrixData?.activeColumnIndex ?? 1]?.color || '',
    originX: 'center', originY: 'top', lockRatio: true
  },

  // ── DIAGRAMS & FLOWS ──
  'network-graph': {
    getLabelText: (el) => `MẠNG LƯỚI KẾT NỐI (NETWORK GRAPH)\n${el.content || 'Hệ sinh thái liên kết'}\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || el.color || '',
    originX: 'center', originY: 'top', lockRatio: true,
    defaultWidth: (el) => el.width || 280,
    defaultHeight: (el) => calculateElementDynamicHeight(el),
  },
  'sankey-chart': {
    getLabelText: (el) => `SANKEY FLOW\n${el.sankeyData?.title || el.content || 'Phân rã dòng chảy'}\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || el.color || '',
    originX: 'center', originY: 'top', lockRatio: true,
    defaultWidth: (el) => el.width || 336,
    defaultHeight: (el) => calculateElementDynamicHeight(el),
  },
  'tree-diagram': {
    getLabelText: (el) => `SƠ ĐỒ CÂY / ROADMAP\n${el.treeData?.title || el.content || 'Tech Stack Tree'}\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || '',
    originX: 'center', originY: 'top', lockRatio: true
  },
  'data-flow': {
    getLabelText: (el) => `LUỒNG DỮ LIỆU ĐỘNG\n${el.dataFlowData?.nodes?.map(n => n.label).join(' ➔ ') || 'Pipeline Flow'}\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || '',
    originX: 'center', originY: 'top', lockRatio: true
  },
  'branching-flow': {
    getLabelText: (el) => `SƠ ĐỒ RẼ NHÁNH\n${el.branchingFlowData?.rootNode?.label || 'Root Gateway'} ➔ ${el.branchingFlowData?.childNodes?.length || 3} Nhánh\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || '',
    originX: 'center', originY: 'top', lockRatio: true
  },
  'parallel-flow': {
    getLabelText: (el) => `XỬ LÝ SONG SONG (FORK-JOIN)\n${el.parallelFlowData?.parallelNodes?.length || 3} Tiến trình song song\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || '',
    originX: 'center', originY: 'top', lockRatio: true
  },
  'mindmap-flow': {
    getLabelText: (el) => `SƠ ĐỒ TƯ DUY (MINDMAP)\n${el.mindmapFlowData?.centerNode?.label || 'Trung tâm'} (${el.mindmapFlowData?.branches?.length || 4} Nhánh)\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || '',
    originX: 'center', originY: 'top', lockRatio: true
  },
  'knowledge-graph': {
    getLabelText: (el) => `CÂY TRI THỨC (KNOWLEDGE GRAPH)\n${el.knowledgeGraphData?.title || 'Mạng Lưới Tri Thức'} (${el.knowledgeGraphData?.nodes?.length || 4} Nút)\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || '',
    originX: 'center', originY: 'top', lockRatio: true,
    defaultWidth: 360,
    defaultHeight: (el) => calculateElementDynamicHeight(el)
  },
  'funnel-flow': {
    getLabelText: (el) => `PHỄU CHUYỂN ĐỔI (FUNNEL)\n${el.funnelFlowData?.title || 'Phễu Lọc'} (${el.funnelFlowData?.stages?.length || 4} Tầng)\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || '',
    originX: 'center', originY: 'top', lockRatio: true
  },
  'roadmap-flow': {
    getLabelText: (el) => `LỘ TRÌNH & MILESTONES\n${el.roadmapFlowData?.title || 'Roadmap'} (${el.roadmapFlowData?.milestones?.length || 4} Mốc)\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || '',
    originX: 'center', originY: 'top', lockRatio: true
  },

  // ── UI WIDGETS & CARDS ──
  'vs-battle': {
    getLabelText: (el) => {
      const vsData = el?.vsBattle;
      const leftName = vsData?.leftSubject?.name || 'Phe A';
      const rightName = vsData?.rightSubject?.name || 'Phe B';
      const count = vsData?.rounds?.length || 3;
      return `${leftName}  VS  ${rightName}\n(${count} hiệp đấu)\n(Kéo thả để đổi vị trí)`;
    },
    getAccentColor: (el) => el?.accentColor || el?.vsBattle?.leftSubject?.color || '',
    originX: 'center',
    originY: 'top',
    lockRatio: true,
    defaultWidth: 330,
    defaultHeight: (el) => calculateElementDynamicHeight(el),
  },
  'ranking-list': {
    getLabelText: (el) => `LEADERBOARD\n${el.content || 'Top 1, 2, 3'}\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || el.color || '',
    originX: 'center', originY: 'top', lockRatio: true
  },
  'chat-mockup': {
    getLabelText: (el) => `CHAT MOCKUP\n${el.content || 'Đoạn hội thoại'}\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || el.color || '',
    originX: 'center', originY: 'top', lockRatio: true
  },
  'quiz-card': {
    getLabelText: (el) => `QUIZ TRẮC NGHIỆM\n${el.quizData?.question || el.content || 'Câu hỏi trắc nghiệm'}\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || el.color || '',
    originX: 'center', originY: 'top', lockRatio: true
  },
  'code-terminal': {
    getLabelText: (el) => `CỬA SỔ TERMINAL\n${el.codeData?.filename || 'main.ts'}\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || el.color || '',
    originX: 'center', originY: 'top', lockRatio: true,
    defaultWidth: 320,
    defaultHeight: (el) => calculateElementDynamicHeight(el),
  },
  'master-scene': {
    getLabelText: (el) => {
      const d = el.masterSceneData;
      return `Cảnh Master\n${d?.templateId || ''}\n(Kéo thả để đổi vị trí)`;
    },
    getAccentColor: (el) => el.accentColor || '',
    originX: 'center', originY: 'top', lockRatio: false,
    defaultWidth: MASTER_SCENE_DEFAULT_WIDTH,
    defaultHeight: (el) => calculateElementDynamicHeight(el),
  },
  'master-hook': {
    getLabelText: (el) => {
      const hook = el.hookData;
      const badge = hook?.badgeText || 'HOOK TIÊU ĐỀ';
      const title = hook?.heroTitle || el.content || 'DỪNG LẠI NGAY!';
      const sub = hook?.subText ? `\n"${hook.subText.slice(0, 35)}..."` : '';
      return `MẪU HOOK\n[ ${badge} ]\n${title}${sub}\n(Kéo thả để đổi vị trí)`;
    },
    getAccentColor: (el) => el.accentColor || '',
    originX: 'center', originY: 'top', lockRatio: true,
    defaultHeight: (el) => calculateElementDynamicHeight(el),
  },
  'social-callout': {
    getLabelText: (el) => {
      const callout = el.calloutData;
      const variantName = callout?.variant === 'bank' ? 'BIẾN ĐỘNG SỐ DƯ' : callout?.variant === 'tweet' ? 'BÀI ĐĂNG X / TWEET' : callout?.variant === 'chat' ? 'TIN NHẮN CHAT' : 'BẢN TIN THỜI SỰ';
      return `${variantName}\n${callout?.title || el.content || 'Social Proof'}\n${callout?.content ? `"${callout.content.slice(0, 30)}..."` : ''}\n(Kéo thả để đổi vị trí)`;
    },
    getAccentColor: (el) => el.accentColor || '',
    originX: 'center', originY: 'top', lockRatio: true
  },
  'document-evidence': {
    getLabelText: (el) => {
      const doc = el.docData;
      const variantName = doc?.variant === 'highlighter' ? 'TÀI LIỆU DẠ QUANG' : doc?.variant === 'stamp' ? 'CON DẤU ĐỎ MẬT' : 'GIẤY NOTE 3D';
      return `${variantName}\n${doc?.title || el.content || 'Bằng chứng tài liệu'}\n${doc?.highlight ? `Highlight: "${doc.highlight}"` : ''}\n(Kéo thả để đổi vị trí)`;
    },
    getAccentColor: (el) => el.accentColor || '',
    originX: 'center', originY: 'top', lockRatio: true
  },
  'fake-search': {
    getLabelText: (el) => `THANH TÌM KIẾM\n"${el.searchData?.keyword || el.content || 'Tìm kiếm...'}"\n(Kéo thả / Đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || el.searchData?.accentColor || '',
    originX: 'center', originY: 'top', lockRatio: true
  },
  'push-notification': {
    getLabelText: (el) => `THÔNG BÁO PUSH\n[ ${el.notificationData?.appName || 'THÔNG BÁO'} ]\n${el.notificationData?.title || el.content || 'Tiêu đề'}\n(Kéo thả / Đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || el.notificationData?.accentColor || '',
    originX: 'center', originY: 'top', lockRatio: true
  },
  'frame-mockup': {
    getLabelText: (el) => {
      const presetName = el.frameData?.framePreset === 'iphone-dynamic-island' ? 'KHUNG IPHONE 15' : el.frameData?.framePreset === 'glass-minimal' ? 'KHUNG KÍNH NEON' : 'KHUNG BROWSER';
      return `${presetName}\n${el.frameData?.urlText || 'motionstudio.ai'}\n(Khung bọc đè lên video)`;
    },
    getAccentColor: (el) => el.accentColor || el.frameData?.accentColor || '',
    originX: 'center', originY: 'top', lockRatio: true
  },

  // ── MEDIA & DECORATIONS ──
  'character-mascot': {
    getLabelText: (el) => `MASCOT\n[ ${(el.pose || 'idea').toUpperCase()} ]\n(Kéo thả / Co giãn)`,
    getAccentColor: (el) => el.accentColor || '',
    originX: 'center', originY: 'center', lockRatio: true,
    defaultWidth: 220, defaultHeight: 310
  },
  'vinyl-pulse': {
    getLabelText: (el) => `ĐĨA THAN & SÓNG LOFI\n${el.vinylData?.songTitle || '432Hz Healing Frequency'}\n${el.vinylData?.artistOrVibe || 'Nhạc Thiền An Yên'}\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || '',
    originX: 'center', originY: 'top', lockRatio: true
  },
  'lottie': {
    getLabelText: (el) => `STICKER ĐỘNG\n[ ${el.lottiePreset || 'tech-hud'} ]\n(Kéo thả / Co giãn)`,
    getAccentColor: (el) => el.accentColor || '',
    originX: 'center', originY: 'top', lockRatio: true
  },
  'hand-drawn': {
    getLabelText: () => `NÉT VẼ TAY\n(Kéo thả / Co giãn)`,
    getAccentColor: (el) => el.stroke || el.accentColor || el.color || '',
    originX: 'center', originY: 'center', lockRatio: true
  },
  'breathing-circle': {
    getLabelText: (el) => {
      const b = el.breathingData;
      const title = b?.title || 'HÍT THỞ CHÁNH NIỆM';
      const pattern = (b?.pattern || '4-7-8').toUpperCase();
      const styleName = b?.visualStyle ? b.visualStyle.replace('zen-', '').replace('-', ' ') : 'Hào quang';
      return `VÒNG THỞ [${pattern}]\n${title}\nKiểu: ${styleName}`;
    },
    getAccentColor: (el) => el.accentColor || '',
    originX: 'center', originY: 'top', lockRatio: true
  },
  'dynamic-diagram': {
    getLabelText: (el) => {
      const nodes = el?.diagramData?.nodes || [];
      const title = el?.diagramData?.title || el?.content || 'SƠ ĐỒ ĐỒ THỊ ĐỘNG';
      return `[ ${title} ]\n(${nodes.length} nút liên kết)\n(Kéo thả để đổi vị trí)`;
    },
    getAccentColor: (el) => el?.accentColor || '',
    originX: 'center',
    originY: 'top',
    lockRatio: true,
    defaultWidth: 336,
    defaultHeight: (el) => calculateElementDynamicHeight(el),
  },
  'flowchart': {
    getLabelText: (el) => {
      const steps = el?.flowSteps?.length ? el.flowSteps : [1, 2, 3];
      return `${el?.content || 'QUY TRÌNH XỬ LÝ LOGIC'}\n(${steps.length} bước)\n(Kéo thả để đổi vị trí)`;
    },
    getAccentColor: (el) => el?.accentColor || '',
    originX: 'center',
    originY: 'top',
    lockRatio: true,
    defaultWidth: 336,
    defaultHeight: (el) => calculateElementDynamicHeight(el),
  },
  'table': {
    getLabelText: (el) => {
      const tableData = (el?.tableData || {}) as any;
      const headers = Array.isArray(tableData.headers) && tableData.headers.length > 0
        ? tableData.headers
        : ['Phương án A', 'Phương án B'];
      const rows = Array.isArray(tableData.rows) ? tableData.rows : [1, 2, 3];
      return `${headers[0]} VS ${headers[1]}\n(${rows.length} tiêu chí so sánh)\n(Kéo thả để đổi vị trí)`;
    },
    getAccentColor: (el) => el?.accentColor || el?.color || '',
    originX: 'center',
    originY: 'top',
    lockRatio: true,
    defaultWidth: 336,
    defaultHeight: (el) => calculateElementDynamicHeight(el),
  },
  'stat-big': {
    getLabelText: () => `[ STAT-BIG ]\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || '',
    originX: 'center', originY: 'top', lockRatio: true
  },
  'vs-card': {
    getLabelText: () => `[ VS-CARD ]\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || '',
    originX: 'center', originY: 'top', lockRatio: true
  },
  'highlight-box': {
    // Vẽ bằng renderer chuyên dụng (highlightBoxFabricRenderer); nhãn chỉ dùng cho fallback/tooltip
    getLabelText: (el) => String(el.content || 'Nội dung điểm nhấn...').trim().split('\n')[0].slice(0, 55),
    // Rỗng → renderer dùng accent của palette (khớp var(--accent) bên Remotion)
    getAccentColor: (el) => el.accentColor || '',
    defaultHeight: (el) => calculateElementDynamicHeight(el),
    defaultWidth: (el) => el.width || 320,
    originX: 'center', originY: 'top', lockRatio: true
  },
  'numbered-list': {
    getLabelText: () => `[ NUMBERED-LIST ]\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || '',
    originX: 'center', originY: 'top', lockRatio: true,
    defaultWidth: 312,
    defaultHeight: (el) => calculateElementDynamicHeight(el),
  },
  'audio-waveform': {
    getLabelText: () => `[ AUDIO-WAVEFORM ]\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || '',
    originX: 'center', originY: 'center', lockRatio: true
  },
  'quote-box': {
    getLabelText: (el) => {
      const raw = (el?.content || 'Trích dẫn hay...').trim();
      const snippet = raw.length > 32 ? raw.slice(0, 32) + '...' : raw;
      const author = el?.authorName ? `\n— ${el.authorName}` : '';
      return `“${snippet}”${author}\n\n[ QUOTE-BOX ]`;
    },
    getAccentColor: (el) => el?.accentColor || el?.color || '',
    originX: 'center', originY: 'top', lockRatio: true,
    defaultWidth: 312,
    defaultHeight: (el) => calculateElementDynamicHeight(el),
  },
  'timeline': {
    getLabelText: (el) => {
      const steps = el.flowSteps?.length ? el.flowSteps : [
         { title: 'Hôm Qua' }, { title: 'Hôm Nay' }, { title: 'Mai Sau' }
      ];
      const title = el.content || el.title || 'DÒNG THỜI GIAN';
      const previewText = steps.map(s => `● ${s.title}`).join('\n');
      return `TIMELINE: ${title} (${steps.length} MỐC)\n\n${previewText}`;
    },
    getAccentColor: (el) => el.accentColor || el.color || '',
    originX: 'center', originY: 'top', lockRatio: true,
    defaultWidth: 290,
    defaultHeight: (el) => calculateElementDynamicHeight(el),
  },
  'metric-cards': {
    getLabelText: () => `[ METRIC-CARDS ]\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || '',
    originX: 'center', originY: 'top', lockRatio: true
  },
  'pyramid-funnel': {
    getLabelText: (el) => {
      const title = el.content || el.title || 'CÔNG THỨC VIRAL HOOK';
      const count = el.pyramidLayers?.length || 3;
      return `PHỄU KIM TỰ THÁP 3D\n${title} (${count} Tầng)\n(Kéo thả để đổi vị trí)`;
    },
    getAccentColor: (el) => el.accentColor || el.color || '',
    originX: 'center',
    originY: 'top',
    lockRatio: true,
    defaultWidth: 336,
    defaultHeight: (el) => calculateElementDynamicHeight(el),
  },
  'visual-paradox': {
    getLabelText: (el) => {
      const title = el.content || el.title || 'NGHỊCH LÝ BÁNH XE ARISTOTLE';
      return `MÔ PHỎNG NGHỊCH LÝ KHOA HỌC\n${title}\n(Kéo thả để đổi vị trí)`;
    },
    getAccentColor: (el) => el.accentColor || el.color || '',
    originX: 'center',
    originY: 'top',
    lockRatio: true,
    defaultWidth: 336,
    defaultHeight: (el) => calculateElementDynamicHeight(el),
  },
  'checklist': {
    getLabelText: (el) => {
      const data: any = el.checklistData || {};
      const title = data.title || el.content || 'CHECKLIST';
      const rawItems: any[] = (el.checklistItems && el.checklistItems.length > 0) ? el.checklistItems : (data.items || []);
      if (rawItems.length === 0) {
        return `CHECKLIST: ${title}\n(Danh sách trống)`;
      }
      const lines = rawItems.slice(0, 5).map((it: any) => {
        const icon = it.status === 'cross' || it.status === 'danger' ? '✕' : it.status === 'warning' ? '!' : '✓';
        return `${icon} ${it.text}`;
      });
      return `${title}\n${lines.join('\n')}`;
    },
    getAccentColor: (el) => el.accentColor || el.color || '',
    originX: 'center',
    originY: 'top',
    lockRatio: true,
    defaultWidth: 336,
    defaultHeight: (el) => calculateElementDynamicHeight(el)
  },

  // ── STEM SCIENCE & MATH MODULE ──
  'math-plot': {
    getLabelText: (el) => `${el.mathData?.title || el.content || 'ĐỒ THỊ & HÌNH HỌC (MAFS)'}\n${el.mathData?.latexLabel || el.mathData?.expression || 'y = f(x)'}\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || el.mathData?.color || '',
    originX: 'center',
    originY: 'top',
    lockRatio: true,
    defaultWidth: 360,
    defaultHeight: 260,
  },
  'chemical-molecule': {
    getLabelText: (el) => `CẤU TRÚC PHÂN TỬ 2D\n${el.chemData?.name || el.content || 'Phân tử Hoá học'}${el.chemData?.formula ? ` (${el.chemData.formula})` : ''}\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || '',
    originX: 'center',
    originY: 'top',
    lockRatio: true,
    defaultWidth: 340,
    defaultHeight: 260,
  },
  'latex-formula': {
    getLabelText: (el) => `∑ ${el.latexData?.title || el.content || 'CÔNG THỨC'}\n${el.latexData?.latex || 'E = mc^2'}\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || '',
    originX: 'center',
    originY: 'top',
    lockRatio: true,
    defaultWidth: 360,
    defaultHeight: 140,
  },
  'interactive-quiz': {
    getLabelText: (el) => `CÂU HỎI TRẮC NGHIỆM (${el.quizData?.badge || '5S'})\n${el.quizData?.question || el.content || 'Câu hỏi đếm ngược'}\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || '',
    originX: 'center',
    originY: 'top',
    lockRatio: true,
    defaultWidth: 360,
    defaultHeight: 320,
  },
  'vocab-card': {
    getLabelText: (el) => `THẺ TỪ VỰNG (${el.vocabData?.cefrLevel || 'IELTS'})\n${el.vocabData?.word || 'WORD'} (${el.vocabData?.partOfSpeech || 'adj'})\n${el.vocabData?.meaningVi || 'Định nghĩa từ vựng'}\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || '',
    originX: 'center',
    originY: 'top',
    lockRatio: true,
    defaultWidth: 340,
    defaultHeight: 360,
  },
  'generative-svg': {
    getLabelText: (el) => `ĐỒ HỌA VECTOR TOÁN HỌC\n${(el.title || el.formula || 'Quỹ đạo lượng tử').toUpperCase()}\nPhong cách: ${el.renderStyle || 'neon-cyber'}\n(Kéo thả để đổi vị trí)`,
    getAccentColor: (el) => el.accentColor || el.color || '',
    originX: 'center',
    originY: 'top',
    lockRatio: true,
    defaultWidth: 220,
    defaultHeight: 220,
  }
};

export function getElementAlignment(el: SceneElement | { type: string; textAlign?: string }) {
  const type = el.type;
  
  // 1. Text-based elements have dynamic alignment
  if (type === 'text' || type === 'caption') {
    if (el.textAlign === 'center') {
      return { isCenterX: true, isCenterY: false, originX: 'center' as const, originY: 'top' as const };
    }
    if (el.textAlign === 'right') {
      return { isCenterX: false, isCenterY: false, originX: 'right' as const, originY: 'top' as const, isRightX: true };
    }
    return { isCenterX: false, isCenterY: false, originX: 'left' as const, originY: 'top' as const };
  }

  // 2. Read from Registry
  const config = CHART_PLACEHOLDER_REGISTRY[type];
  if (config) {
    return {
      isCenterX: config.originX === 'center',
      isCenterY: config.originY === 'center',
      originX: config.originX,
      originY: config.originY,
    };
  }

  // 3. Fallbacks for unregistered basic elements (all anchored at top edge, centered horizontally)
  const CENTER_TOP_TYPES = new Set(['badge', 'divider', 'image', 'shape', 'character-mascot', 'video']);
  if (CENTER_TOP_TYPES.has(type)) {
    return { isCenterX: true, isCenterY: false, originX: 'center' as const, originY: 'top' as const };
  }

  // 4. Basic left-aligned elements
  if (LEFT_ORIGIN_TYPES.has(type)) {
    return { isCenterX: false, isCenterY: false, originX: 'left' as const, originY: 'top' as const };
  }

  // 5. Default all other advanced elements to center-top (matches Fabric placeholder group)
  return { isCenterX: true, isCenterY: false, originX: 'center' as const, originY: 'top' as const };
}
