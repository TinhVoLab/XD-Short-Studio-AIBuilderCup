import { SceneFilterConfig } from '@/config/filterPresetCatalog';
import type { AnySceneRole } from '@/config/sceneRoles';
import type { SceneSurface } from '@/config/themePalettes';
import { MathPlotData, LatexFormulaData, ChemicalMoleculeData, QuizType } from './stem';
import { PhysicsSimulationConfig } from '@/remotion/elements/physics/core/types';
import { AlgorithmSimulationConfig } from '@/remotion/elements/algorithms/core/types';
import { VisualParadoxData } from '@/remotion/elements/stem/paradox/types';

import { RegisteredElementType } from '@/config/elementsTypes';

// ── Scene / Element types ──────────────────────────────
export type ElementType =
  | RegisteredElementType
  | 'text'
  | 'shape'
  | 'svg'
  | 'caption'
  | 'video';

export type HookArchetype =
  | 'warning'    // ⚠️ Nỗi sợ / Cảnh báo  → Đỏ Crimson #FF3B30
  | 'tips'       // 🔥 Top mẹo / Bí kíp    → Neon Lime  #BEFF01
  | 'curiosity'  // ❓ Tò mò / Nghịch lý   → Cyan Neon  #00D4FF
  | 'secret'     // ✦ Bí mật / Top 1%      → Luxury Gold #FFD700
  | 'versus'     // ⚔️ So sánh / Đối kháng → Purple #A855F7
  | 'healing'    // 🌿 Chữa lành / An yên  → Sage #86EFAC
  | 'custom'

export type HookLayoutStyle =
  | 'stacked'       // 📦 Xếp tầng kính mờ tiêu chuẩn
  | 'hazard-alert'  // ⚠️ Băng cảnh báo khẩn cấp (MrBeast / News)
  | 'sticker-words' // ⚡ Sticker nổi từng từ (Alex Hormozi)
  | 'cyber-hud'     // ✦ Giao diện công nghệ / Hacker (AI / Crypto)
  | 'split-versus'  // ⚔️ Đối đầu chia 2 nửa (So sánh)
  | 'luxury-zen'    // 🌿 Tạp chí tối giản cao cấp (Podcast / Zen)
  | 'cta-social'    // 🔴 Thanh Follow kênh + Chuông thông báo
  | 'cta-pill'      // 🔗 Nút viên thuốc Link in Bio phát sáng
  | 'cta-comment'   // 💬 Bong bóng Comment từ khóa nhận bot
  | 'cta-bookmark'  // 🔖 Nút lưu video Bookmark nổi bật
  | 'kinetic-contrast'    // ⚡ Font size đối lập cực đại
  | 'kinetic-bold-script' // ⚡ Mix font Bold + Script
  | 'kinetic-solid-box'   // ⚡ Khối màu đặc highlight
  | 'kinetic-giant-stat'  // ⚡ Số siêu to khổng lồ
  | 'kinetic-strip-highlight' // ⚡ Dải màu highlight lướt qua
  | 'gravity-pull'        // Đã gộp vào kinetic-word-weight (giữ cho dữ liệu cũ)
  | 'cinematic-lower-third' // 🎬 Neo đáy màn hình Netflix Documentary
  | 'kinetic-word-weight'; // 📊 Log-gradient Switzerland Typography

export interface MasterHookData {
  archetype: HookArchetype;
  layoutStyle?: HookLayoutStyle;
  // Tầng 1: Badge Eyecatcher
  badgeText: string;
  badgeBgColor?: string;
  badgeTextColor?: string;
  // Tầng 2: Hero Title
  heroTitle: string;
  highlightWords?: string[];
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number | string;
  textColor?: string;
  accentColor?: string;
  // Cho phong cách Đối đầu (split-versus)
  versusLeft?: string;
  versusRight?: string;
  // Tầng 3: Curiosity / Value Box
  subText?: string;
  boxVariant?: 'glass' | 'neon-border' | 'solid' | 'minimal';

  // -- KINETIC EXTENSIONS --
  scriptWords?: string[]; // Các từ khoá render bằng font viết tay
  scriptFontFamily?: string; // Tên font chữ viết tay (vd: 'Dancing Script', 'Sriracha', 'Patrick Hand', 'Pattaya', 'Charm')
  highlightStyle?: 'text-glow' | 'solid-box' | 'outline-box' | 'underline-thick' | 'marker-circle' | 'gradient-sweep';
  wordAnimation?: 'stagger-pop' | 'typewriter-cursor' | 'elastic-slide' | 'glitch' | 'reveal-wipe';
  tiltDeg?: number;       // Góc nghiêng của cụm text (vd: -4, -8)
  wordLayout?: 'inline' | 'stacked-words' | 'split-size' | 'diagonal';
  fontSizeContrast?: boolean;
  heroLine2?: string;     // Dòng 2 cho layout bold-script
  statValue?: string;     // Số lớn cho giant-stat
  statLabel?: string;     // Label cho số lớn
}

export interface ChecklistItem {
  text: string;
  subtext?: string;
  status?: 'checked' | 'cross' | 'warning' | 'done' | 'danger' | 'pending';
  icon?: string;
  color?: string;
}

export interface ChecklistData {
  title?: string;
  badge?: string;
  style?: 'glass' | 'minimal' | 'audit' | 'cyber';
  tickAnimation?: boolean;
  showFooter?: boolean;
  items: ChecklistItem[];
}

export interface CandleItem {
  open: number;
  close: number;
  high: number;
  low: number;
  label?: string;
}

export interface CandlestickData {
  symbol?: string;
  currentPrice?: string;
  changePct?: string;
  candles: CandleItem[];
}

export interface RacingBarItem {
  label: string;
  value: number;
  color?: string;
  icon?: string;
  rank?: number;
}

export interface RacingBarData {
  title?: string;
  bars: RacingBarItem[];
}

export interface HeatmapCell {
  label?: string;
  value: number;
  color?: string;
}

export interface HeatmapData {
  title?: string;
  rows?: number;
  cols?: number;
  cells: HeatmapCell[];
}

export interface WaterfallStep {
  label: string;
  amount: number;
  type: 'start' | 'add' | 'subtract' | 'total';
  color?: string;
}

export interface WaterfallData {
  title?: string;
  currency?: string;
  steps: WaterfallStep[];
}

export interface SankeyFlowItem {
  label: string;
  value: string;
  percent: number;
  color?: string;
}

export interface SankeyData {
  title?: string;
  source: string;
  sourceValue: string;
  flows: SankeyFlowItem[];
}

export interface TreeBranch {
  group: string;
  items: string[];
  color?: string;
}

export interface TreeData {
  title?: string;
  rootNode: { label: string; icon?: string };
  branches: TreeBranch[];
}

export type KeyframeProperty = 'position' | 'scale' | 'opacity' | 'rotation'

export interface ElementKeyframe {
  id: string
  property: KeyframeProperty
  timePct: number   // 0% đến 100% thời lượng Cảnh
  value: number     // Giá trị tương ứng
}

export interface AudioTrackClip {
  id: string
  name: string
  url: string
  startSec: number        // Mốc thời gian bắt đầu phát trên Timeline (giây)
  duration: number        // Độ dài file nhạc gốc (giây)
  trimStartSec?: number   // Mốc bắt đầu cắt từ file nhạc gốc (giây)
  playDurationSec?: number// Độ dài trích xuất từ file gốc (giây)
  playbackRate?: number   // Tốc độ phát độc lập (0.5x, 1x, 2x...)
  volume: number          // 0.0 đến 1.0
  trackId: string         // Id hoặc Tên của Track (ví dụ: 'A1', 'A2', 'A3'...)
  isExpired?: boolean     // Cờ đánh dấu file blob tạm thời đã hết hạn khi F5
  sceneId?: string        // ID của cảnh (dùng cho giọng đọc A1)
}

export interface VsBattleRound {
  criterion: string
  winner: 'left' | 'right' | 'tie'
  leftValue?: string
  rightValue?: string
  roundIcon?: string
}

export interface VsBattleData {
  leftSubject: { name: string; icon?: string; color?: string }
  rightSubject: { name: string; icon?: string; color?: string }
  rounds: VsBattleRound[]
  showWinner?: boolean
  winnerLabel?: string
}

export interface RankingItem {
  rank: number
  name: string
  score?: string | number
  badge?: string
  color?: string
  icon?: string
}

export interface ChatMessage {
  sender: 'left' | 'right' | 'me' | 'other'
  text: string
  name?: string
  avatar?: string
  time?: string
}

export interface QuizOptionItem {
  id: string
  text: string
  isLatex?: boolean
  imageUrl?: string
  pollPercent?: number
}

export interface QuizData {
  question: string
  options: QuizOptionItem[]
  correctId?: string
  correctAnswers?: string[]
  quizType?: QuizType
  badge?: string
  questionLatex?: boolean
  introSec?: number
  countdownSec?: number
  revealSec?: number
  revealDelaySec?: number
  explanation?: string
  showExplanation?: boolean
  points?: number
  sfxEnabled?: boolean
  themePreset?: 'studio-neon' | 'chalkboard' | 'clean-minimal'
  layoutVariant?: 'stacked' | 'grid-2x2'
  timingMode?: 'auto' | 'fixed'
}

export interface VocabCardData {
  word: string
  partOfSpeech: string // 'adj' | 'noun' | 'verb' | 'adv' | 'phrasal verb' | 'idiom'
  ipa: string // e.g. '/ˈkruː.ʃəl/'
  audioAccent?: 'US' | 'UK' | 'VN' | 'CN' | 'JP'
  cefrLevel?: string // 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'IELTS 7.0+' | 'TOEIC 800+' | 'HSK 4'
  meaningVi: string // 'Cực kỳ quan trọng, có tính quyết định'
  meaningEn?: string // 'Extremely important or necessary'
  exampleEn: string // 'Regular exercise plays a crucial role in maintaining good health.'
  exampleVi?: string // 'Tập thể dục đều đặn đóng vai trò cực kỳ quan trọng...'
  highlightWord?: string // 'crucial role'
  synonyms?: string[] // ['Essential', 'Vital', 'Pivotal']
  antonyms?: string[] // ['Trivial', 'Minor']
  collocations?: string[] // ['play a crucial role', 'crucial factor']
  cardStyle?: 'glass-modern' | 'minimal-chalk' | 'bold-accent'
  timingMode?: 'auto' | 'fixed' // default 'auto' (tự động co giãn theo % thời lượng cảnh)
  sfxEnabled?: boolean // default true (tự động phát sfx theo từng pha)
  introSec?: number // default 2.5s (Phát âm)
  meaningSec?: number // default 2.5s (Giải nghĩa)
  exampleSec?: number // default 3.0s (Ngữ cảnh & Đồng nghĩa)
}

export interface CodeTerminalData {
  code: string
  language?: string
  filename?: string
  theme?: 'dark' | 'neon' | 'matrix'
}


// ── SOCIAL PROOF & NOTIFICATIONS ──
export type SocialCalloutVariant = 'bank' | 'tweet' | 'chat' | 'news';

export interface SocialCalloutData {
  variant: SocialCalloutVariant;
  title: string;          // Số tiền / Tên tác giả / Tiêu đề tin / Người gửi
  subtitle?: string;      // Ngân hàng / @username / Thể loại tin / Thời gian
  content?: string;       // Nội dung CK / Nội dung Tweet / Nội dung chat / Headline
  highlight?: string;     // Từ khóa phát sáng / highlight
  accentColor?: string;   // Màu nhấn
  badge?: string;         // 'VTV24' | 'VERIFIED' | 'VIP'
  avatarUrl?: string;     // Avatar người dùng (nếu có)
}

// ── DOCUMENT EVIDENCE & HIGHLIGHTER ──
export type DocumentEvidenceVariant = 'highlighter' | 'stamp' | 'note';

export interface DocumentEvidenceData {
  variant: DocumentEvidenceVariant;
  subVariant?: 'tape-note' | 'torn-paper';
  stampVariant?: 'secret-box' | 'approved-circle' | 'warning-hazard';
  title: string;          // Tên tài liệu / Chữ con dấu / Tiêu đề note
  subtitle?: string;      // Mã hồ sơ / Ngày tháng / Chú thích nhỏ
  content?: string;       // Đoạn trích dẫn tài liệu / Nội dung note
  highlight?: string;     // Cụm từ được bút dạ quang quét đè lên
  accentColor?: string;   // Màu bút dạ quang hoặc màu con dấu
  badge?: string;         // 'BÁO CÁO MẬT' | 'CONFIDENTIAL'
}

// ── ZEN & CHILL GRAPHICS ──
export type ZenBreathPattern = '4-7-8' | 'box' | 'calm' | 'coherence' | 'vagus';
export type ZenVisualStyle = 'concentric-orb' | 'water-ripple' | 'singing-bowl' | 'zen-stones' | 'lotus-pulse';

export interface BreathingData {
  title?: string;
  subtitle?: string;
  pattern?: ZenBreathPattern;
  visualStyle?: ZenVisualStyle;
  cycleDurationSec?: number;
  accentColor?: string;
  secondaryColor?: string;
  glowIntensity?: number;
  showParticles?: boolean;
  showPhaseText?: boolean;
  mantraText?: string;
}

export interface VinylPulseData {
  songTitle: string;      // 'Rainy Coffee & Lofi Beats'
  artistOrVibe?: string;  // '432Hz Healing Frequency • Chữa Lành'
  coverArtUrl?: string;   // Optional thumbnail
  waveColor?: string;     // Màu dải sóng sin
  accentColor?: string;   // Màu nhấn
  badge?: string;         // 'LOFI CHILL' | '432Hz'
}

// ── HOOK & VIRAL INTERACTION ELEMENTS ──
export interface FakeSearchData {
  keyword: string;            // Từ khóa tìm kiếm (gõ chữ animation)
  placeholder?: string;       // Placeholder mờ phía sau
  engine?: 'google' | 'tiktok' | 'youtube' | 'glass'; // Style giao diện
  accentColor?: string;       // Màu kính lúp / nút tìm kiếm
  typingSpeed?: number;       // Tốc độ gõ (frame per char, default 2)
  autoSearchBadge?: string;   // Badge nhỏ 'KẾT QUẢ' hoặc 'XU HƯỚNG'
}

export interface PushNotificationData {
  appName: string;            // Tên ứng dụng (vd: 'TIN NHẮN', 'VIETCOMBANK', 'TIKTOK', 'YOUTUBE')
  appIcon?: string;           // Emoji icon hoặc link ảnh (vd: '💬', '🏦', '🎵', '🔔')
  title: string;              // Tiêu đề nổi bật (vd: '+50.000.000 đ', 'Sếp tổng gọi')
  message: string;            // Nội dung tin nhắn / thông báo chi tiết
  timeText?: string;          // 'vừa xong' | 'bây giờ' | '2m trước'
  accentColor?: string;       // Màu viền hoặc màu badge nhấn
  badge?: string;             // 'ƯU TIÊN' | 'KHẨN CẤP'
}

export interface FrameMockupData {
  framePreset: string;        // 'browser-macos' | 'browser-chrome' | 'iphone-dynamic-island' | 'glass-minimal'
  urlText?: string;           // 'motionstudio.ai'
  theme?: 'dark' | 'light' | 'glass';
  borderWidth?: number;       // Độ dày viền để che mép video (mặc định 2-4px)
  accentColor?: string;
  showControls?: boolean;
}

export interface DataFlowNode {
  id: string;
  label: string;
  subLabel?: string;
  icon?: string;
}

export interface DataFlowData {
  nodes: DataFlowNode[];
  wireColor?: string;
  packetColor?: string;
  layout?: 'horizontal' | 'vertical';
}

export interface BranchingFlowNode {
  id: string;
  label: string;
  subLabel?: string;
  icon?: string;
  status?: string;
}

export interface BranchingFlowData {
  rootNode: BranchingFlowNode;
  childNodes: BranchingFlowNode[];
  wireColor?: string;
  packetColor?: string;
  layout?: 'horizontal' | 'vertical';
}

export interface ParallelFlowNode {
  id: string;
  label: string;
  subLabel?: string;
  icon?: string;
  status?: string;
}

export interface ParallelFlowData {
  inputNode: ParallelFlowNode;
  parallelNodes: ParallelFlowNode[];
  outputNode: ParallelFlowNode;
  wireColor?: string;
  packetColor?: string;
  layout?: 'horizontal' | 'vertical';
}

export interface MindmapBranchItem {
  id: string;
  label: string;
  subLabel?: string;
  icon?: string;
  color?: string;
  side?: 'left' | 'right';
}

export interface MindmapFlowData {
  centerNode: {
    label: string;
    subLabel?: string;
    icon?: string;
  };
  branches: MindmapBranchItem[];
  wireColor?: string;
  packetColor?: string;
  layout?: 'horizontal' | 'vertical';
}

export type KnowledgeGraphLayout = 'cascade' | 'spine' | 'orbit';
export type KnowledgeGraphTheme = 'obsidian-dark' | 'cyber-neon' | 'quantum-cyan' | 'minimal-light';

export interface KnowledgeGraphNode {
  id: string;
  label: string;
  subLabel?: string;
  tier: 0 | 1 | 2; // 0: Root, 1: Main Branch/Cluster, 2: Leaf/Detail
  parentId?: string;
  icon?: string;
  color?: string;
  insight?: string; // Text giải thích khi được Spotlight
}

export interface KnowledgeGraphEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  style?: 'solid' | 'dashed' | 'glowing';
  color?: string;
}

export interface KnowledgeGraphData {
  title?: string;
  layout: KnowledgeGraphLayout;
  theme?: KnowledgeGraphTheme;
  nodes: KnowledgeGraphNode[];
  edges?: KnowledgeGraphEdge[];
  activeNodeId?: string | null; // Node đang được Spotlight, null/undefined = Toàn cảnh tổng quan
  showParticles?: boolean; // Bật hạt năng lượng chạy dọc dây
  autoBloom?: boolean; // Tự động bung nở theo timeline
  wireColor?: string;
  packetColor?: string;
  // Cinematic 9:16 Camera & Retention features
  cameraZoom?: boolean; // Tự động zoom camera vào node active
  cameraZoomLevel?: number; // Mức zoom (1.1x -> 1.7x, default 1.45)
  cameraDelaySec?: number; // Thời gian giữ góc nhìn toàn cảnh trước khi zoom (giây, default dynamic 15% scene duration)
  loopDurationSec?: number; // Thời gian camera lướt zoom-out về toàn cảnh cuối video (giây, default dynamic 12% scene duration)
  heroMorph?: boolean; // Bung thẻ chi tiết Hero Card ngay tại node
  safeZonePlatform?: 'tiktok' | 'reels' | 'shorts' | 'none'; // Safe-zone né UI platform
  showMiniMap?: boolean; // Hiển thị HUD radar mini-map góc màn hình
  loopableEnding?: boolean; // Tự động zoom-out về toàn cảnh ở cuối video để loop
  showGridBackground?: boolean; // Lưới tọa độ công nghệ Parallax Dot-Grid
  badgeText?: string; // Tùy chỉnh text badge header
}

export interface FunnelStageItem {
  id: string;
  label: string;
  subLabel?: string;
  value?: string;
  conversionPct?: string;
  color?: string;
  icon?: string;
}

export interface FunnelFlowData {
  title?: string;
  stages: FunnelStageItem[];
  wireColor?: string;
  packetColor?: string;
  flowDirection?: 'down' | 'up' | 'horizontal';
}

export interface RoadmapMilestoneItem {
  id: string;
  stage: string;
  title: string;
  subLabel?: string;
  icon?: string;
  color?: string;
  status?: 'completed' | 'active' | 'locked';
  badge?: string;
}

export interface RoadmapFlowData {
  title?: string;
  milestones: RoadmapMilestoneItem[];
  wireColor?: string;
  packetColor?: string;
  layoutStyle?: 'zigzag' | 'linear-left' | 'linear-right' | 'horizontal';
}

// ── CYBER & DYNAMIC FLOW [PRO] ─────────────────────────────────

export interface OrbitPlanet {
  label: string;       // 'Q1', 'PRODUCT A'
  value: string;       // '850M', '65%'
  color?: string;      // Màu hành tinh
  orbitRadius?: number;// Bán kính quỹ đạo (px), default auto-spaced
  speed?: number;      // Hệ số tốc độ (1 = chuẩn), default 1
}

export interface OrbitSystemData {
  centerLabel: string; // 'TỔNG DOANH THU'
  centerValue: string; // '₫2.8B'
  planets: OrbitPlanet[];
  accentColor?: string;
}

export interface SignalWavePoint {
  label: string;       // 'T1', 'T2'
  value: number;       // 0–100 (%)
  highlight?: boolean; // Đỉnh đặc biệt phát sáng mạnh hơn
}

export interface SignalWaveData {
  title?: string;      // 'LIVE SIGNAL'
  badge?: string;      // 'REAL-TIME'
  points: SignalWavePoint[];
  waveColor?: string;  // '#00D4FF'
  glowColor?: string;
}

export interface CyberMatrixCell {
  value: number;       // 0–100 (intensity → brightness)
  label?: string;      // Nhãn hiển thị tại ô
  color?: string;      // Override màu riêng
}

export interface CyberMatrixData {
  title?: string;      // 'PHÂN TÍCH DỮ LIỆU'
  rows?: number;       // default 6
  cols?: number;       // default 10
  cells: CyberMatrixCell[];
  baseColor?: string;  // '#00D4FF'
  scanColor?: string;
}

export interface SpeedZone {
  from: number;        // 0–100
  to: number;
  color: string;
}

export interface SpeedMeterData {
  label?: string;      // 'HIỆU SUẤT'
  value: number;       // 0–100
  unit?: string;       // '%', 'km/h', 'pts'
  maxLabel?: string;   // '100%'
  zones?: SpeedZone[];
  needleColor?: string;// '#FF2D78'
  accentColor?: string;// '#BEFF01'
}

export interface LiquidFillData {
  label?: string;       // 'NĂNG LƯỢNG', 'PIN DỰ TRỮ'
  value: number;        // 0–100
  unit?: string;        // '%', 'kWh', 'L'
  subLabel?: string;    // '8.4 / 10.0 kWh'
  liquidColor?: string; // '#00D4FF'
  accentColor?: string; // '#BEFF01'
  shape?: 'circle' | 'capsule'; // default 'circle'
  waveSpeed?: number;   // 1–3
}

export interface DiagramNode {
  id: string;
  label: string;
  sublabel?: string;
  shape?: 'rect' | 'diamond' | 'pill' | 'circle' | 'cylinder';
  color?: string;
  icon?: string;
  x?: number;
  y?: number;
  layer?: number;
}

export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
  style?: 'solid' | 'dashed';
  color?: string;
}

export interface DynamicDiagramData {
  title?: string;
  direction?: 'TD' | 'LR';
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  theme?: 'cyber' | 'minimalist' | 'pastel';
  timingMode?: 'auto' | 'fast'; // 'auto': Trải đều theo thời lượng cảnh (Mặc định) | 'fast': Hiện nhanh 0.8s đầu
}

export interface NeuronNode {
  id: string;
  x: number;           // 0–100 (%)
  y: number;           // 0–100 (%)
  label?: string;      // 'AI CORE', 'VISION', 'NLP'
  color?: string;
  isCore?: boolean;
}

export interface NeuronSynapse {
  fromId: string;
  toId: string;
  strength?: number;   // 0.2–1
}

export interface NeuronNetworkData {
  title?: string;       // 'NEURAL AI CLUSTER'
  status?: string;      // 'ACTIVE 99.4%'
  coreColor?: string;   // '#00FF88'
  synapseColor?: string;// '#00D4FF'
  nodes?: NeuronNode[];
  synapses?: NeuronSynapse[];
}

export interface HologramBarItem {
  label: string;        // 'SERVER A', 'GPU CLUSTER'
  value: number;        // 0–100
  color?: string;       // '#00D4FF'
  sub?: string;         // '4.8 TFLOPS'
}

export interface HologramBarData {
  title?: string;       // 'HỆ THỐNG XUNG LỰC'
  bars: HologramBarItem[];
  accentColor?: string; // '#BEFF01'
  showScanline?: boolean;
}

export interface TimelinePulseMilestone {
  time: string;         // '09:00', 'Q1 2026', 'Phase 1'
  title: string;        // 'Genesis Node', 'Khởi động'
  desc?: string;        // 'Kích hoạt 10,000 TPS'
  status?: 'completed' | 'active' | 'pending';
  color?: string;       // '#00D4FF'
}

export interface TimelinePulseData {
  title?: string;       // 'LỘ TRÌNH ĐỘT PHÁ'
  pulseColor?: string;  // '#BEFF01'
  accentColor?: string; // '#00D4FF'
  milestones: TimelinePulseMilestone[];
}

export interface LifecycleColumnItem {
  id: string;
  stage: string;          // e.g. 'BEFORE SHIP', 'DURING RUN', 'AFTER DEPLOY'
  name: string;           // e.g. 'EVALS', 'GUARDRAILS', 'MONITORING'
  actionVerb: string;     // e.g. 'MEASURE', 'ENFORCE', 'DETECT'
  icon: string;           // e.g. '📋', '🛡️', '🖥️'
  metrics: string[];      // e.g. ['quality', 'reliability']
  question: string;       // e.g. 'IS IT GOOD?'
  badgeText: string;      // e.g. 'RELEASE CONFIDENCE'
  color?: string;         // e.g. '#00D4FF', '#FF6B00', '#00FF88'
}

export interface LifecycleMatrixData {
  title: string;          // e.g. 'EVALS vs GUARDRAILS vs MONITORING'
  subtitle?: string;      // e.g. 'CONFLATE THEM → CREATE AN OPS GAP'
  columns: LifecycleColumnItem[];
  activeColumnIndex?: number; // 0, 1, or 2 (which column has the active neon glow)
  accentColor?: string;
}

export interface SceneElement {
  morphData?: any;
  id: string
  type: ElementType
  left: number
  top: number
  width: number
  height: number
  scaleX: number
  scaleY: number
  angle: number
  opacity: number
  // text
  content?: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: number | string
  color?: string
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  // ── Typography nâng cao (Text Layer 2.0) ──
  textStroke?: string            // Màu viền chữ. VD: '#000000', '#BEFF01'
  textStrokeWidth?: number       // Độ dày viền (px). Range: 0–8
  letterSpacing?: number         // Khoảng cách ký tự (px). Range: -2 to 12
  lineHeight?: number            // Chiều cao dòng. Range: 1.0–2.0. Default: 1.15
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  shadowColor?: string           // Màu đổ bóng / neon glow. VD: '#00D4FF', 'rgba(0,0,0,0.85)'
  shadowBlur?: number            // Độ nhòe (px). Range: 0–30
  textGradientFrom?: string      // Màu bắt đầu gradient. VD: '#FFE259'
  textGradientTo?: string        // Màu kết thúc gradient. VD: '#FFA751'
  textGradientAngle?: number     // Góc gradient (deg). Default: 135
  textBgColor?: string           // Màu hộp nền chữ. VD: 'rgba(0,0,0,0.85)'
  textBgPadding?: number         // Padding nội chữ (px). Range: 0–20. Default: 6
  textBgRadius?: number          // Bo góc hộp nền (px). Range: 0–20. Default: 6
  wordTimings?: Array<{ word: string; startSec: number; endSec: number }> // Mốc thời gian từng từ chuẩn âm học
  // shape / svg / image
  src?: string
  shapeType?: string
  svgContent?: string
  formula?: string
  formulaParams?: Record<string, number>
  renderStyle?: string
  paletteId?: string
  fill?: string
  stroke?: string
  strokeWidth?: number
  viewBox?: string
  title?: string
  secondaryColor?: string
  secondarySvgContent?: string
  fillRule?: 'nonzero' | 'evenodd'
  flipY?: boolean
  paths?: Array<{
    d: string
    layer?: 'base' | 'hero' | 'spark'
    stroke?: string
    fill?: string
    strokeWidth?: number
  }>
  // ── Image Layer 2.0 Properties ──
  objectFit?: 'contain' | 'cover'
  borderRadius?: number
  borderWidth?: number
  borderColor?: string
  blendMode?: 'normal' | 'screen' | 'multiply' | 'overlay' | 'lighten' | string
  imageShadowColor?: string
  imageShadowBlur?: number
  // ── Video Element Properties ──
  videoLoop?: boolean
  videoVolume?: number           // 0 (mute) đến 1.0
  videoPlaybackRate?: number     // 0.5x, 1x, 2x...
  videoStartFromSec?: number     // Cắt đầu video (giây)
  
  // badge, progress, highlight-box, chart cards
  bgColor?: string
  showCardBg?: boolean
  accentColor?: string
  radius?: number
  percent?: number
  badgeMode?: 'auto' | 'number' | 'icon' | 'none'
  customIcon?: string
  // line, divider
  lineWidth?: number
  orientation?: 'horizontal' | 'vertical'
  // numbered-list
  items?: string[]
  itemColor?: string
  // icon-text
  icon?: string
  iconSize?: number
  subtitle?: string

  // flowchart, table, stat-big
  flowSteps?: { title: string; subtitle?: string; color?: string; icon?: string }[]
  tableData?: { headers?: string[]; rows?: string[][]; labels?: string[]; rowLabels?: string[]; secondColor?: string }
  rows?: any[]
  secondAccent?: string
  statValue?: string
  statLabel?: string
  statNumberColor?: string
  statLabelColor?: string
  statLabelFontSize?: number
  statShowBadge?: boolean
  statBadgeText?: string
  statShowLine?: boolean
  // Comparison mode
  statLayout?: 'single' | 'compare' | 'before-after'
  statCompareValue?: string   // Số thứ 2 (vs mode)
  statCompareLabel?: string   // Label cho số 2
  statBeforeLabel?: string    // "Trước" label
  statAfterLabel?: string     // "Sau" label

  // Image & 3D Living Assets
  isFloating?: boolean
  hasGlow?: boolean
  hasScanner?: boolean
  landingFx?: 'pulse' | 'glow' | 'none'

  // chart-bar, vs-card
  chartData?: { label: string; value: number; unit?: string; color?: string }[]
  leftCard?: any
  rightCard?: any
  
  // Custom new elements
  authorName?: string
  showWatermark?: boolean
  cards?: any[]
  pyramidLayers?: { label: string; sub?: string; color?: string }[]
  vsBattle?: VsBattleData
  rankingItems?: RankingItem[]
  chatMessages?: ChatMessage[]
  quizData?: QuizData
  codeData?: CodeTerminalData
  networkNodes?: { label: string; color?: string; icon?: string }[]
  candlestickData?: CandlestickData
  racingBarData?: RacingBarData
  heatmapData?: HeatmapData
  waterfallData?: WaterfallData
  sankeyData?: SankeyData
  treeData?: TreeData
  checklistItems?: ChecklistItem[]
  checklistData?: ChecklistData
  hookData?: MasterHookData
  /** Cảnh thư viện Master (element master-scene): mẫu trong config/sceneRecipes + slot AI điền */
  masterSceneData?: MasterSceneData
  calloutData?: SocialCalloutData
  docData?: DocumentEvidenceData
  breathingData?: BreathingData
  vinylData?: VinylPulseData
  searchData?: FakeSearchData
  notificationData?: PushNotificationData
  frameData?: FrameMockupData
  dataFlowData?: DataFlowData
  branchingFlowData?: BranchingFlowData
  parallelFlowData?: ParallelFlowData
  mindmapFlowData?: MindmapFlowData
  knowledgeGraphData?: KnowledgeGraphData
  funnelFlowData?: FunnelFlowData
  roadmapFlowData?: RoadmapFlowData
  diagramData?: DynamicDiagramData
  showBackground?: boolean
  showTitle?: boolean

  // ── CYBER & DYNAMIC FLOW DATA ─────────────────────────
  orbitData?: OrbitSystemData
  signalWaveData?: SignalWaveData
  cyberMatrixData?: CyberMatrixData
  speedMeterData?: SpeedMeterData
  liquidFillData?: LiquidFillData
  neuronNetworkData?: NeuronNetworkData
  hologramBarData?: HologramBarData
  timelinePulseData?: TimelinePulseData
  lifecycleMatrixData?: LifecycleMatrixData

  // ── STEM SCIENCE & MATH DATA ─────────────────────────
  mathData?: MathPlotData
  latexData?: LatexFormulaData
  chemData?: ChemicalMoleculeData
  vocabData?: VocabCardData
  physicsData?: PhysicsSimulationConfig
  algorithmData?: AlgorithmSimulationConfig
  paradoxData?: VisualParadoxData

  // mascot-specific
  pose?: string
  profileId?: string
  glowIntensity?: number
  flipX?: boolean
  idleAnim?: 'float' | 'none' | string

  // caption-specific
  captionStyle?: 'word-highlight' | 'karaoke' | 'subtitle' | 'neon-glow' | 'typewriter' | 'bouncing-box' | 'punch-glow' | 'word-pop'
  wordsPerLine?: number   // default 4
  captionBounce?: boolean // Bật/tắt hiệu ứng nảy chữ spring (mặc định: true)
  captionOutline?: boolean // Bật/tắt viền đậm chống chìm (mặc định: false/tuỳ style)

  // audio-waveform, lottie
  waveformStyle?: 'bars' | 'mirrored' | 'curve' | 'dots' | 'siri' | 'circular' | 'laser-beam' | 'liquid-blob' | 'vu-meter' | 'dna-helix' | 'arcade-blocks' | 'neural-constellation' | 'retro-sunburst'
  waveformColor?: string
  waveformSecondaryColor?: string
  waveformCoreColor?: string
  waveformGlow?: boolean
  numberOfBars?: number
  lottieUrl?: string
  lottiePreset?:
    | 'tech-hud' | 'fire' | 'check' | 'ai-brain'
    | 'subscribe-bell' | 'heart-beat' | 'thumb-like' | 'finger-tap'
    | 'lightning-bolt' | 'sparkle-stars' | 'confetti-party' | 'globe-network'
    | 'terminal-cursor' | 'arrow-bounce' | 'arrow-curve' | 'trophy-gold'
    | 'warning-alert' | 'timer-clock' | string
  
  // animations
  animPreset?: AnimPresetType
  animDuration?: number
  animDelay?: number
  // Neo animation vào lời thoại (chỉ số từ trong scene.voiceoverText, tính từ 0).
  // Khi có, SceneRenderer quy đổi sang giây theo word timeline và ghi đè animDelay.
  enterOnWord?: number
  /** Gợi ý từ khoá của AI; normalizer/hydrator quy đổi sang enterOnWord / emphasisOnWords rồi xoá */
  anchorWord?: string
  emphasisWord?: string
  exitPreset?: AnimPresetType
  /** Thoát khi giọng đọc tới từ này; không có thì thoát ngay trước khi hết cảnh */
  exitOnWord?: number
  /** Nhấn (pulse) khi giọng đọc tới các từ này */
  emphasisOnWords?: number[]
  /** Giá trị runtime do SceneRenderer resolve (giây, tính từ đầu cảnh) — không lưu vào project */
  exitAtSec?: number
  emphasisAtSec?: number[]
  /** SFX phát đúng lúc element xuất hiện (ưu tiên hơn sfxDefault của widget registry) */
  sfxType?: string
  // blur / shadow
  blur?: number
  shadow?: boolean
  // keyframes
  keyframes?: ElementKeyframe[]
  // variant for design standard components
  variant?: string
  // highlight-box & callout properties
  boxIcon?: 'sparkle' | 'tip' | 'alert' | 'target' | 'pin' | 'rocket' | 'cta' | 'quote' | 'heart' | 'leaf' | 'none'
  glowEffect?: boolean
  /** highlight-box: tự in đậm + tô accent cụm số (90%, 10x...) — mặc định bật */
  emphasizeNumbers?: boolean
  /** highlight-box bullet-list: từng dòng xuất hiện khi giọng đọc tới từ khoá của dòng — mặc định bật */
  revealOnVoice?: boolean
  /** highlight-box: phong cách theo tông ('auto' = theo theme của cảnh) */
  highlightSkin?: 'auto' | 'glass' | 'editorial' | 'paper' | 'marker'
  /** Runtime (SceneRenderer / useFabric): cảnh có họa tiết hoặc video nền — không lưu vào project */
  bgBusy?: boolean
  /** Runtime: palette của cảnh để chọn skin — không lưu vào project */
  sceneHighlightSkin?: 'glass' | 'editorial' | 'paper' | 'marker'
  /** Runtime (SceneRenderer): giây xuất hiện của từng dòng bullet — không lưu vào project */
  rowRevealAtSec?: Array<number | null>
  /** master-hook: giây giọng đọc nói tới từng từ tiêu đề (từ chuẩn hoá → giây), do SceneRenderer tính */
  hookWordRevealSec?: Record<string, number>
  /** Phụ đề chờ tới giây này mới hiện (cảnh hook: đợi giọng đọc qua hết chữ hero để không lặp chữ) */
  captionStartSec?: number
  bgOpacity?: number
}

export type SoundEffectType =
  | 'whoosh'
  | 'pop'
  | 'ding'
  | 'kaching'
  | 'marker'
  | 'swoosh'
  | 'click'
  | 'boom'
  | 'chime'
  | 'bell'
  | 'paper_slide'
  | 'clap'
  | 'laugh'
  | 'drumroll'
  | 'typewriter'
  | 'camera_shutter'
  | 'glitch'
  | 'bass_drop'
  | 'punch'
  | 'swipe'
  | 'coin'
  | (string & {});

export type AnimPresetType =
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'fade-in'
  | 'zoom-in'
  | 'zoom-out'
  | 'bounce'
  | 'pop-in'
  | 'elastic'
  | 'rotate'
  | 'kinetic-shake'
  | 'flip-x'
  | 'none'
  | (string & {});

export type BgPatternType =
  | 'grid'
  | 'dots'
  | 'none'
  | 'mesh'
  | 'noise'
  | 'cyber-3d'
  | 'topo-contour'
  | 'speed-lines';

export interface SoundEffect {
  id: string
  type: SoundEffectType // e.g., 'pop', 'swoosh', 'ding', 'marker', 'boom'
  delaySec: number  // When it should play relative to the scene start
  volume: number    // 0.0 to 1.0
}

export interface ProgressBarConfig {
  enabled: boolean
  position?: 'top' | 'bottom'
  color?: string
  style?: 'laser-comet' | 'liquid-aurora' | 'segmented-hud' | 'border-laser' | 'story-segments' | 'neon-pulse' | 'gradient' | 'solid'
  scope?: 'scene' | 'global'
  height?: number
  floating?: boolean
}

export interface ViralEffectsConfig {
  vignettePulse?: boolean
  accentBreathe?: boolean
  microParticles?: boolean
  /** Chớp sáng 2 frame khi vào cảnh rehook / cao trào (mặc định bật; tắt cho phong cách thiền) */
  flashOnBeat?: boolean
}

/** Bóng dáng cảnh thân — hình khối tổng thể do đạo diễn nhịp gán (cinematicRules.planSceneSilhouettes) */
export type SceneSilhouette = 'full-card' | 'title-widget' | 'widget-solo' | 'split' | 'statement'

export type NarrativeBeatKind = 'rehook' | 'payoff'
/** Nhịp giữ chân của một cảnh: rehook ngắt mạch giữa video, payoff trả lời lời hứa của hook */
export interface NarrativeBeat {
  kind: NarrativeBeatKind
  /** 2–4 từ lấy từ lời thoại, hiện phủ màn hình lúc mở cảnh */
  title: string
}

export interface Scene {
  id: string
  name: string
  description: string
  duration: number       // seconds
  bgColor: string
  bgGradient?: string
  bgVideoUrl?: string       // URL video nền cảnh (.mp4 / .webm)
  bgVideoLoop?: boolean     // Tự động lặp lại video nền (mặc định: true)
  bgVideoVolume?: number   // Âm lượng video nền (mặc định: 0 - tắt tiếng)
  bgPattern?: BgPatternType
  bgPatternColor?: string   // Custom pattern color or neon tint
  bgPatternOpacity?: number // 0.05 to 1.5
  cameraMotion?: 'static' | 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right' | 'shake'
  /** Cường độ cảm xúc của cảnh 0..1 (AI chấm) — điều khiển biên độ camera & lựa chọn transition */
  energy?: number
  /** Nhịp giữ chân phủ lên vai trò cảnh (vị trí do cinematicRules.planNarrativeBeats quyết định) */
  beat?: NarrativeBeat
  silhouette?: SceneSilhouette
  /** @deprecated Dùng `transition`. Chỉ còn được đọc làm fallback (Hook Library cũ) qua getSceneTransition() */
  transitionOut?: 'none' | 'fade' | 'glitch' | 'wipe' | 'zoom-blur'
  kineticBgWord?: string
  colorInverted?: boolean
  paletteId?: string
  spaceMode?: 'dark' | 'daylight-warm'
  hudHeader?: string
  hudFooterLeft?: string
  hudFooterRight?: string
  authorName?: string
  authorAvatarUrl?: string
  authorAvatarPosition?: 'top-left' | 'top-right' | 'middle-right' | 'bottom-left' | 'bottom-right' | 'custom'
  authorAvatarLeft?: number
  authorAvatarTop?: number
  authorAvatarSize?: number // size in px (e.g. 32 to 88, default 44)
  authorAvatarEffect?: 'none' | 'audio-pulse' | 'neon-spin' | 'float'
  elements: SceneElement[]
  svgContent?: string    // raw SVG for initial render
  voiceoverUrl?: string  // audio file URL
  voiceoverText?: string // text script for this scene
  voiceoverWordTimings?: Array<{ word: string; startSec: number; endSec: number }> // Mốc thời gian từng từ chuẩn âm học
  voiceName?: string     // TTS voice name
  audioDuration?: number // thời lượng audio đo thực tế từ TTS (giây)
  transition?: { type: string; duration: number }
  speedRate?: number     // 0.5, 0.75, 1, 1.25, 1.5, 2
  soundEffects?: SoundEffect[] // list of sound effects
  // Viral Engine additions
  /** Vai trò cảnh — SSOT ở config/sceneRoles (6 vai Master + normal/highlight của dự án cũ) */
  temporalRole?: AnySceneRole
  /** Kiểu nền cảnh: nền ngà / nền màu nhấn (biến thể của palette theme); bỏ trống = nền theme */
  surface?: SceneSurface
  progressBar?: ProgressBarConfig
  viralEffects?: ViralEffectsConfig
  silenceGapSec?: number
  silencePosition?: 'before-key' | 'mid' | 'end'
  filter?: SceneFilterConfig
  showAiDisclaimer?: boolean   // Show "AI tạo (có thể sai sót)" on final scene
  aiDisclaimerText?: string   // Custom text for AI disclaimer
}

export type SunoVibe = 'healing' | 'hype' | 'mystery' | 'tech' | 'funny' | 'other';

export interface SunoBgmTrack {
  id: string;
  title: string;
  vibe: SunoVibe;
  audioUrl: string;
  originalSunoUrl?: string;
  duration: number;
  coverArtUrl?: string;
  tags?: string[];
  prompt?: string;
  createdAt: number;
}

export type SfxCategory = 'all' | 'impact' | 'motion' | 'ui' | 'reaction' | 'custom';

export interface CustomSfxTrack {
  id: string;
  name: string;
  emoji: string;
  category: SfxCategory;
  audioUrl: string;
  duration: number;
  createdAt: number;
  isPreset?: boolean;
}


/** Dữ liệu element master-scene — mẫu ở config/sceneRecipes.js, hình học ở config/masterSceneLayout.js */
export interface MasterSceneData {
  templateId: string
  slots: Record<string, unknown>
  /** Nhãn vị trí "Ý n/tổng" của cảnh nội dung, do bộ xếp cảnh điền */
  position?: { index: number; total: number; label?: string }
}
