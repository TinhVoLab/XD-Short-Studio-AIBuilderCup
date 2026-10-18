export interface VoiceItem {
  id: string
  name: string
  desc: string
  /** edge-*: Edge-TTS miễn phí, chỉnh được tốc độ; gemini: cần Gemini key, tự chọn nhịp theo cảnh */
  category: 'edge-vn' | 'edge-en' | 'gemini'
  gender: 'male' | 'female'
}

export interface DurationPreset {
  id: number
  label: string
  /** Tên ngắn trên thẻ thời lượng */
  name: string
  desc: string
  targetWords: number
  sceneEstimate: number
}

export interface VideoStyle {
  id: string
  label: string
  emoji: string
  desc: string
  suggestedFont?: string
  suggestedColorId?: string
  suggestedHookLayout?: string
}

import { Theme5LayerTokens, THEME_PALETTES } from '@/utils/themeResolver';
import { planMasterStructure, MASTER_MIN_TARGET_SEC, MASTER_FRAMEWORK_ID } from '@/config/videoPlan';

export interface ColorTheme {
  id: string
  label: string
  accent: string
  bg: string
  preview: string[]
  tokens?: Theme5LayerTokens
  spaceMode?: 'dark' | 'daylight-warm'
  category?: 'dark' | 'light' | 'pastel'
  desc?: string
}

export const VOICES: VoiceItem[] = [
  // ── Edge-TTS (0$ Miễn Phí · Chuẩn Tiếng Việt & US) ──
  {
    id: 'vi-VN-NamMinhNeural',
    name: 'Nam Minh',
    desc: 'Nam · Truyền cảm · Tự nhiên',
    category: 'edge-vn',
    gender: 'male',
  },
  {
    id: 'vi-VN-HoaiMyNeural',
    name: 'Hoài My',
    desc: 'Nữ · Ngọt ngào · Truyền cảm',
    category: 'edge-vn',
    gender: 'female',
  },
  {
    id: 'en-US-ChristopherNeural',
    name: 'Christopher',
    desc: 'Nam · Chuẩn US · Tự nhiên',
    category: 'edge-en',
    gender: 'male',
  },
  {
    id: 'en-US-JennyNeural',
    name: 'Jenny',
    desc: 'Nữ · Chuẩn US · Tự nhiên',
    category: 'edge-en',
    gender: 'female',
  },

  // ── Google Gemini AI TTS Voices (Đa Cảm Xúc · AI Studio) ──
  {
    id: 'Puck',
    name: 'Puck',
    desc: 'Nam · Trẻ trung · Hào hứng',
    category: 'gemini',
    gender: 'male',
  },
  {
    id: 'Aoede',
    name: 'Aoede',
    desc: 'Nữ · Sâu lắng · Kể chuyện',
    category: 'gemini',
    gender: 'female',
  },
  {
    id: 'Charon',
    name: 'Charon',
    desc: 'Nam · Trầm ấm · Chuyên gia',
    category: 'gemini',
    gender: 'male',
  },
  {
    id: 'Kore',
    name: 'Kore',
    desc: 'Nữ · Tự nhiên · Nhẹ nhàng',
    category: 'gemini',
    gender: 'female',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    desc: 'Nam · Đanh thép · Quyền lực',
    category: 'gemini',
    gender: 'male',
  },
]

export const DURATION_PRESETS: DurationPreset[] = [
  { id: 15, label: '15s', name: 'Siêu ngắn', desc: 'Trend, meme, trích dẫn', targetWords: 40, sceneEstimate: 3 },
  { id: 30, label: '30s', name: 'Chuẩn TikTok / Reels', desc: 'Cân bằng nhất', targetWords: 80, sceneEstimate: 5 },
  { id: 60, label: '60s', name: 'Chuyên sâu', desc: 'Giải thích kỹ, bài giảng', targetWords: 160, sceneEstimate: 9 },
]

/** Khung "Thư viện cảnh Master": wizard dùng bộ xếp cảnh theo vai (config/videoPlan.js) thay cho engine thường */
export { MASTER_FRAMEWORK_ID }

export interface WizardTemplatePreset {
  id: string
  name: string
  desc: string
  frameworkId: string
  styleId: string
  colorId: string
  badge: string
  sceneEstimate: number
  samplePrompt: string
}

/**
 * Khung mẫu của wizard. Master là mặc định; "Tự do sáng tạo" phủ video 15 giây và chủ đề tự do;
 * "Bài giảng & công thức" giữ lối vào cho đồ hoạ STEM (công thức, đồ thị, phân tử) tới khi Master có cảnh STEM.
 * id `edu-concept-lesson` trùng mẫu dự án cùng tên (templatesCatalog) để nút "AI Kịch Bản" nối đúng khung.
 */
export const WIZARD_TEMPLATE_PRESETS: WizardTemplatePreset[] = [
  {
    id: 'master-scene-library',
    name: 'Thư viện cảnh Master',
    desc: 'Con số, ba điều, ý chính, tổng kết, lưu lại. Mỗi cảnh có bố cục dựng sẵn, gọn và rõ (từ 30 giây)',
    frameworkId: MASTER_FRAMEWORK_ID,
    styleId: 'Rõ ràng, súc tích, thân thiện, giàu giá trị thực tế',
    colorId: 'studio-lime',
    badge: 'Mới',
    sceneEstimate: 7,
    samplePrompt: '3 thói quen buổi sáng giúp bạn tập trung cả ngày',
  },
  {
    id: 'auto',
    name: 'Tự do sáng tạo',
    desc: 'AI tự chọn bố cục và đồ hoạ theo chủ đề, dùng được cho video 15 giây',
    frameworkId: 'hook-retain-value-cta',
    styleId: 'Viral, năng động, dồn dập, giật gân cuốn hút',
    colorId: 'neon-green',
    badge: 'Linh hoạt',
    sceneEstimate: 5,
    samplePrompt: '3 bí quyết ứng dụng AI giúp tiết kiệm 10 giờ làm việc mỗi tuần',
  },
  {
    id: 'edu-concept-lesson',
    name: 'Bài giảng & công thức',
    desc: 'Giải thích một khái niệm bằng công thức, đồ thị hoặc phân tử, kèm ví dụ và câu hỏi ôn tập',
    frameworkId: 'edu-concept',
    styleId: 'Chuyên gia phân tích sâu, logic, chuẩn xác, giàu dữ liệu',
    colorId: 'electric-blue',
    badge: 'STEM',
    sceneEstimate: 5,
    samplePrompt: 'Vì sao nước sôi ở 100 độ C nhưng trên đỉnh Everest chỉ khoảng 70 độ C',
  },
]

export const DEFAULT_WIZARD_PRESET_ID = WIZARD_TEMPLATE_PRESETS[0].id

/** Số cảnh dự kiến của một khung ở độ dài sec: Master theo bộ xếp cảnh (videoPlan), khung khác theo DURATION_PRESETS */
export function presetSceneCount(preset: WizardTemplatePreset, sec: number): number {
  if (preset.frameworkId === MASTER_FRAMEWORK_ID) return planMasterStructure(sec).length
  return DURATION_PRESETS.find((d) => d.id === sec)?.sceneEstimate || Math.max(3, Math.round(sec / 3.4))
}

/** Khung không chạy được ở độ dài sec (Master cần ≥ 30 giây) → lý do, ngược lại null */
export function presetDurationBlock(preset: WizardTemplatePreset, sec: number): string | null {
  if (preset.frameworkId === MASTER_FRAMEWORK_ID && sec < MASTER_MIN_TARGET_SEC) return `Thư viện cảnh Master cần từ ${MASTER_MIN_TARGET_SEC} giây`
  return null
}

/** Khung theo id; id đã xoá (bản nháp cũ, mẫu dự án không có khung riêng) → khung mặc định */
export function resolveWizardPreset(id?: string | null): WizardTemplatePreset {
  return WIZARD_TEMPLATE_PRESETS.find((p) => p.id === id) || WIZARD_TEMPLATE_PRESETS[0]
}

export const VIDEO_STYLES: VideoStyle[] = [
  {
    id: 'Viral, năng động, dồn dập, giật gân cuốn hút',
    label: 'Viral Năng Động',
    emoji: '',
    desc: 'Dồn dập, giật gân, cuốn hút',
    suggestedFont: 'Montserrat',
    suggestedColorId: 'neon-green',
    suggestedHookLayout: 'badge-split',
  },
  {
    id: 'Tin tức nóng, thời sự, trực diện, câu ngắn gọn',
    label: 'Tin Tức Nóng',
    emoji: '',
    desc: 'Nhanh, khách quan, súc tích',
    suggestedFont: 'Lexend',
    suggestedColorId: 'hot-pink',
    suggestedHookLayout: 'breaking-news',
  },
  {
    id: 'Kể chuyện kịch tính, mở đầu tò mò, cao trào bất ngờ',
    label: 'Kể Chuyện / Bí Ẩn',
    emoji: '',
    desc: 'Cuốn hút, tò mò, cao trào',
    suggestedFont: 'Montserrat',
    suggestedColorId: 'synthwave',
    suggestedHookLayout: 'cyber-hud',
  },
  {
    id: 'Chuyên gia phân tích sâu, logic, chuẩn xác, giàu dữ liệu',
    label: 'Chuyên Gia',
    emoji: '',
    desc: 'Phân tích sâu, logic',
    suggestedFont: 'Inter',
    suggestedColorId: 'electric-blue',
    suggestedHookLayout: 'metric-highlight',
  },
  {
    id: 'Mẹo nhanh, thủ thuật thực chiến, 3 bước súc tích dễ làm',
    label: 'Mẹo Nhanh / Tips',
    emoji: '',
    desc: 'Đi thẳng vấn đề, thực chiến',
    suggestedFont: 'Be Vietnam Pro',
    suggestedColorId: 'neon-green',
    suggestedHookLayout: 'badge-split',
  },
  {
    id: 'Tài chính kinh doanh, sắc bén, số liệu cụ thể, uy tín',
    label: 'Tài Chính & Business',
    emoji: '',
    desc: 'Sắc bén, uy tín, nhấn số liệu',
    suggestedFont: 'Montserrat',
    suggestedColorId: 'fintech-green',
    suggestedHookLayout: 'metric-highlight',
  },
  {
    id: 'Hài hước, châm biếm, dí dỏm, meme giải trí',
    label: 'Hài Hước / Meme',
    emoji: '',
    desc: 'Dí dỏm, meme, lôi cuốn',
    suggestedFont: 'Lexend',
    suggestedColorId: 'golden',
    suggestedHookLayout: 'badge-split',
  },
  {
    id: 'Nhẹ nhàng, chữa lành, thiền định, câu từ sâu lắng, bình an, xoa dịu tâm hồn',
    label: 'Thiền Định & Chữa Lành',
    emoji: '',
    desc: 'Sâu lắng, an yên, thư giãn ASMR',
    suggestedFont: 'Playfair Display',
    suggestedColorId: 'matcha-sage',
    suggestedHookLayout: 'luxury-zen',
  },
  {
    id: 'Hoạt họa kể chuyện, mascot biểu cảm dí dỏm, giải thích trực quan, sinh động',
    label: 'Hoạt Họa / Mascot Story',
    emoji: '',
    desc: 'Dẫn chuyện bằng nhân vật biểu cảm, lôi cuốn, dễ hiểu',
    suggestedFont: 'Lexend',
    suggestedColorId: 'neon-green',
    suggestedHookLayout: 'badge-split',
  },
  {
    id: 'Khoa học trừu tượng, đồ họa động học vector toán học Y=f(x), sắc nét, công nghệ cao',
    label: 'Đồ Họa Toán Học / Kinetic Math [BETA]',
    emoji: '',
    desc: 'Mô hình hóa $Y=f(x)$, Lorenz, sóng hài, vector 60fps',
    suggestedFont: 'Be Vietnam Pro',
    suggestedColorId: 'neon-green',
    suggestedHookLayout: 'cyber-hud',
  },
  {
    id: 'Sơ đồ tư duy, giải thích trực quan, lưu đồ logic, trực quan hóa kiến thức',
    label: 'Sơ Đồ & Giảng Dạy',
    emoji: '',
    desc: 'Lưu đồ logic, sơ đồ nhánh, phân tích đa chiều',
    suggestedFont: 'Inter',
    suggestedColorId: 'electric-blue',
    suggestedHookLayout: 'metric-highlight',
  },
]

export const COLOR_THEMES: ColorTheme[] = [
  // ── 9 BẢNG MÀU CHUẨN 5-LAYER (TRI-COLOR & PASTEL ENGINE) ──
  {
    id: 'neon-night',
    label: 'Cyber Lime (Neon Night)',
    accent: THEME_PALETTES['neon-night'].tokens.accent,
    bg: THEME_PALETTES['neon-night'].tokens.bg,
    preview: THEME_PALETTES['neon-night'].preview,
    tokens: THEME_PALETTES['neon-night'].tokens,
    spaceMode: THEME_PALETTES['neon-night'].spaceMode,
    category: THEME_PALETTES['neon-night'].category,
    desc: THEME_PALETTES['neon-night'].desc,
  },
  {
    id: 'sunset-pop',
    label: 'Sunset Pop',
    accent: THEME_PALETTES['sunset-pop'].tokens.accent,
    bg: THEME_PALETTES['sunset-pop'].tokens.bg,
    preview: THEME_PALETTES['sunset-pop'].preview,
    tokens: THEME_PALETTES['sunset-pop'].tokens,
    spaceMode: THEME_PALETTES['sunset-pop'].spaceMode,
    category: THEME_PALETTES['sunset-pop'].category,
    desc: THEME_PALETTES['sunset-pop'].desc,
  },
  {
    id: 'fresh-mint',
    label: 'Fresh Mint (Bạc Hà)',
    accent: THEME_PALETTES['fresh-mint'].tokens.accent,
    bg: THEME_PALETTES['fresh-mint'].tokens.bg,
    preview: THEME_PALETTES['fresh-mint'].preview,
    tokens: THEME_PALETTES['fresh-mint'].tokens,
    spaceMode: THEME_PALETTES['fresh-mint'].spaceMode,
    category: THEME_PALETTES['fresh-mint'].category,
    desc: THEME_PALETTES['fresh-mint'].desc,
  },
  {
    id: 'royal-gold',
    label: 'Royal Gold',
    accent: THEME_PALETTES['royal-gold'].tokens.accent,
    bg: THEME_PALETTES['royal-gold'].tokens.bg,
    preview: THEME_PALETTES['royal-gold'].preview,
    tokens: THEME_PALETTES['royal-gold'].tokens,
    spaceMode: THEME_PALETTES['royal-gold'].spaceMode,
    category: THEME_PALETTES['royal-gold'].category,
    desc: THEME_PALETTES['royal-gold'].desc,
  },
  {
    id: 'electric-candy',
    label: 'Electric Candy',
    accent: THEME_PALETTES['electric-candy'].tokens.accent,
    bg: THEME_PALETTES['electric-candy'].tokens.bg,
    preview: THEME_PALETTES['electric-candy'].preview,
    tokens: THEME_PALETTES['electric-candy'].tokens,
    spaceMode: THEME_PALETTES['electric-candy'].spaceMode,
    category: THEME_PALETTES['electric-candy'].category,
    desc: THEME_PALETTES['electric-candy'].desc,
  },
  {
    id: 'warm-care',
    label: 'Warm Care (Gia Đình)',
    accent: THEME_PALETTES['warm-care'].tokens.accent,
    bg: THEME_PALETTES['warm-care'].tokens.bg,
    preview: THEME_PALETTES['warm-care'].preview,
    tokens: THEME_PALETTES['warm-care'].tokens,
    spaceMode: THEME_PALETTES['warm-care'].spaceMode,
    category: THEME_PALETTES['warm-care'].category,
    desc: THEME_PALETTES['warm-care'].desc,
  },
  {
    id: 'peach-cream',
    label: 'Peach Cream (Care Pastel)',
    accent: THEME_PALETTES['peach-cream'].tokens.accent,
    bg: THEME_PALETTES['peach-cream'].tokens.bg,
    preview: THEME_PALETTES['peach-cream'].preview,
    tokens: THEME_PALETTES['peach-cream'].tokens,
    spaceMode: THEME_PALETTES['peach-cream'].spaceMode,
    category: THEME_PALETTES['peach-cream'].category,
    desc: THEME_PALETTES['peach-cream'].desc,
  },
  {
    id: 'soft-sage',
    label: 'Soft Sage (Zen Pastel)',
    accent: THEME_PALETTES['soft-sage'].tokens.accent,
    bg: THEME_PALETTES['soft-sage'].tokens.bg,
    preview: THEME_PALETTES['soft-sage'].preview,
    tokens: THEME_PALETTES['soft-sage'].tokens,
    spaceMode: THEME_PALETTES['soft-sage'].spaceMode,
    category: THEME_PALETTES['soft-sage'].category,
    desc: THEME_PALETTES['soft-sage'].desc,
  },
  {
    id: 'misty-blue',
    label: 'Misty Blue (Peace Pastel)',
    accent: THEME_PALETTES['misty-blue'].tokens.accent,
    bg: THEME_PALETTES['misty-blue'].tokens.bg,
    preview: THEME_PALETTES['misty-blue'].preview,
    tokens: THEME_PALETTES['misty-blue'].tokens,
    spaceMode: THEME_PALETTES['misty-blue'].spaceMode,
    category: THEME_PALETTES['misty-blue'].category,
    desc: THEME_PALETTES['misty-blue'].desc,
  },
  // Thư viện cảnh Master: xám than, một màu nhấn xanh chanh
  {
    id: 'studio-lime',
    label: THEME_PALETTES['studio-lime'].label,
    accent: THEME_PALETTES['studio-lime'].tokens.accent,
    bg: THEME_PALETTES['studio-lime'].tokens.bg,
    preview: THEME_PALETTES['studio-lime'].preview,
    tokens: THEME_PALETTES['studio-lime'].tokens,
    spaceMode: THEME_PALETTES['studio-lime'].spaceMode,
    category: THEME_PALETTES['studio-lime'].category,
    desc: THEME_PALETTES['studio-lime'].desc,
  },

  // ── LEGACY BACKWARD-COMPATIBLE ALIASES ──
  { id: 'neon-green',    label: 'Cyber Lime',   accent: '#BEFF01', bg: '#08090A', preview: ['#BEFF01', '#08090A', '#FFFFFF'], spaceMode: 'dark', category: 'dark' },
  { id: 'electric-blue', label: 'Quantum Blue', accent: '#00D4FF', bg: '#060913', preview: ['#00D4FF', '#060913', '#FFFFFF'], spaceMode: 'dark', category: 'dark' },
  { id: 'synthwave',     label: 'Nebula Purple',accent: '#A855F7', bg: '#0B0813', preview: ['#A855F7', '#0B0813', '#FFFFFF'], spaceMode: 'dark', category: 'dark' },
  { id: 'fintech-green', label: 'Fintech Green',accent: '#00E676', bg: '#0A0B0D', preview: ['#00E676', '#0A0B0D', '#FFFFFF'], spaceMode: 'dark', category: 'dark' },
  { id: 'golden',        label: 'Crypto Gold',  accent: '#FFD700', bg: '#0A0800', preview: ['#FFD700', '#0A0800', '#FFFFFF'], spaceMode: 'dark', category: 'dark' },
  { id: 'pure-white',    label: 'Titanium',     accent: '#FFFFFF', bg: '#0D0D0D', preview: ['#FFFFFF', '#0D0D0D', '#888888'], spaceMode: 'dark', category: 'dark' },
  { id: 'hot-pink',      label: 'Neon Pink',    accent: '#FF2D78', bg: '#0D0008', preview: ['#FF2D78', '#0D0008', '#FFFFFF'], spaceMode: 'dark', category: 'dark' },
  { id: 'matcha-sage',   label: 'Zen Sage',     accent: '#86EFAC', bg: '#0D1310', preview: ['#86EFAC', '#0D1310', '#F4EFEA'], spaceMode: 'daylight-warm', category: 'pastel' },
]

export const STEP_LABELS = ['Ý tưởng', 'Kịch bản', 'Giọng đọc']

export const SFX_DURATIONS: Record<string, number> = {
  click: 0.12,
  pop: 0.16,
  ding: 0.75,
  swoosh: 0.35,
  whoosh: 0.65,
  whip: 0.28,
  glitch: 0.38,
  boom: 1.2,
  thud: 0.45,
  riser: 1.6,
  kaching: 0.8,
  camera_shutter: 0.32,
  marker: 0.35,
  buzzer: 0.45,
  record_scratch: 0.45,
  clock_tick: 0.15,
  typewriter: 0.14,
  clap: 0.5,
  laugh: 0.85,
  drumroll: 1.2,
  bell: 1.5,
  chime: 1.8,
  // ── 10 file SFX có sẵn trên đĩa cứng (public/sfx/) ──
  laser_scan: 0.42,
  paper_slide: 0.35,
  boxing_bell: 1.1,
  sword_slash: 0.58,
  coin_flip: 0.48,
  level_up: 0.58,
  heartbeat: 0.88,
  bubble_pop: 0.22,
  fast_woosh: 0.35,
  data_stream: 0.60,
}

export const SFX_ALIAS_MAP: Record<string, string> = {
  chime: 'chime',
  bell: 'bell',
  magic: 'chime',
  correct: 'ding',
  success: 'ding',
  sparkle: 'chime',
  tada: 'ding',
  whoosh: 'whoosh',
  transition: 'whoosh',
  slide: 'swoosh',
  swipe: 'swoosh',
  button: 'click',
  tap: 'click',
  tick: 'clock_tick',
  clock: 'clock_tick',
  bubble: 'pop',
  appear: 'pop',
  snap: 'pop',
  giggle: 'laugh',
  funny: 'laugh',
  keyboard: 'typewriter',
  typing: 'typewriter',
  chat: 'typewriter',
  applause: 'clap',
  cheer: 'clap',
  suspense: 'drumroll',
  roll: 'drumroll',
  money: 'kaching',
  cash: 'kaching',
  coin: 'kaching',
  dollar: 'kaching',
  camera: 'camera_shutter',
  shutter: 'camera_shutter',
  photo: 'camera_shutter',
  snap_photo: 'camera_shutter',
  error: 'buzzer',
  wrong: 'buzzer',
  fail: 'buzzer',
  scratch: 'record_scratch',
  vinyl: 'record_scratch',
  stop: 'record_scratch',
  impact: 'boom',
  bass: 'boom',
  hit: 'thud',
  punch: 'thud',
  tension: 'riser',
  build: 'riser',
  build_up: 'riser',
  crack: 'whip',
  // ── Mappings cho các âm thanh mới mở rộng ──
  laser: 'laser_scan',
  laser_scan: 'laser_scan',
  scan: 'laser_scan',
  paper: 'paper_slide',
  paper_slide: 'paper_slide',
  document: 'paper_slide',
  boxing: 'boxing_bell',
  boxing_bell: 'boxing_bell',
  fight: 'boxing_bell',
  sword: 'sword_slash',
  sword_slash: 'sword_slash',
  slash: 'sword_slash',
  coin_flip: 'coin_flip',
  flip: 'coin_flip',
  level_up: 'level_up',
  levelup: 'level_up',
  heartbeat: 'heartbeat',
  heart: 'heartbeat',
  bubble_pop: 'bubble_pop',
  fast_woosh: 'fast_woosh',
  fast_whoosh: 'fast_woosh',
  data_stream: 'data_stream',
  matrix: 'data_stream',
  stream: 'data_stream',
}
