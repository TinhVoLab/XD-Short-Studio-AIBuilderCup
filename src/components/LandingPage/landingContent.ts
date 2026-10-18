/**
 * Nội dung minh hoạ của landing (thẻ video mẫu, mô phỏng Studio).
 * Số liệu gói cước KHÔNG đặt ở đây — lấy từ planCatalog / getPlanByTier.
 */

/** Ý tưởng mẫu cho ô nhập ở hero (hiệu ứng tự gõ) */
export const HERO_IDEAS = [
  '5 thói quen buổi sáng giúp bạn tập trung hơn',
  'Giải thích lãi kép trong 30 giây',
  'Quiz 10 câu về thủ đô các nước',
  'Học 5 từ vựng IELTS chủ đề công việc',
]

/** id trùng với system_settings/app_config.heroTemplates để gắn video mẫu do Admin cấu hình */
export type GalleryCategory = 'mindset' | 'finance' | 'quiz' | 'edu'

export const GALLERY_TABS: { id: GalleryCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'mindset', label: 'Năng suất' },
  { id: 'finance', label: 'Tài chính' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'edu', label: 'Từ vựng' },
]

export const GALLERY_CATEGORY_LABEL: Record<GalleryCategory, string> = {
  mindset: 'Năng suất',
  finance: 'Tài chính',
  quiz: 'Quiz',
  edu: 'Từ vựng',
}

export interface GalleryCard {
  kind: 'quote' | 'chart' | 'quiz' | 'word'
  cat: GalleryCategory
  dur: string
  a: string
  b?: string
  options?: [string, string, string]
  phonetic?: string
  /** Nền thẻ; 'accent' = màu nhấn của landing */
  bg: string
  fg: string
  voice: string
}

export const GALLERY_CARDS: GalleryCard[] = [
  { kind: 'quote', cat: 'mindset', dur: '0:28', a: 'Đừng quản lý thời gian. ', b: 'Quản lý năng lượng.', bg: '#1C1A16', fg: '#F1EDE4', voice: 'Nữ · Nam Bộ' },
  { kind: 'chart', cat: 'finance', dur: '0:30', a: 'Sức mạnh của lãi kép', bg: '#14201B', fg: '#E6F0EA', voice: 'Nam · Bắc Bộ' },
  { kind: 'quiz', cat: 'quiz', dur: '0:45', a: 'Thủ đô của Úc là?', options: ['Sydney', 'Canberra', 'Melbourne'], bg: '#1A1C26', fg: '#E8EAF5', voice: 'Nữ · Bắc Bộ' },
  { kind: 'word', cat: 'edu', dur: '0:20', a: 'resilient', phonetic: '/rɪˈzɪliənt/ · adj.', b: 'kiên cường', bg: '#241A1F', fg: '#F4E8EC', voice: 'Nữ · Nam Bộ' },
  { kind: 'quote', cat: 'mindset', dur: '0:25', a: 'Làm ít hơn, ', b: 'nhưng sâu hơn.', bg: 'accent', fg: '#0A0A0B', voice: 'Nam · Bắc Bộ' },
  { kind: 'chart', cat: 'finance', dur: '0:35', a: 'Chi tiêu theo quy tắc 50/30/20', bg: '#1E1A14', fg: '#F3ECDF', voice: 'Nữ · Bắc Bộ' },
  { kind: 'quiz', cat: 'quiz', dur: '0:40', a: 'Hành tinh lớn nhất?', options: ['Sao Thổ', 'Sao Mộc', 'Trái Đất'], bg: '#17202A', fg: '#E4EEF7', voice: 'Nam · Nam Bộ' },
  { kind: 'word', cat: 'edu', dur: '0:18', a: 'meticulous', phonetic: '/məˈtɪkjələs/ · adj.', b: 'tỉ mỉ', bg: '#1A1A1A', fg: '#F1EDE4', voice: 'Nữ · Bắc Bộ' },
  { kind: 'quote', cat: 'mindset', dur: '0:30', a: 'Kỷ luật là ', b: 'tự do.', bg: '#20161A', fg: '#F6E9EE', voice: 'Nam · Bắc Bộ' },
]

/** Mô phỏng Studio: một video 30 giây, 5 cảnh */
export const STUDIO_DURATION_SEC = 30

export interface StudioScene {
  name: string
  short: string
  start: number
  end: number
  tag: string
  title: string
  highlight: string
  caption: string
}

export const STUDIO_SCENES: StudioScene[] = [
  { name: 'Hook mở đầu', short: 'Hook', start: 0, end: 3, tag: 'Hook', title: 'Bạn mất ', highlight: '3 giờ mỗi sáng', caption: 'Bạn mất ba giờ mà không hề biết' },
  { name: 'Thói quen 1', short: 'Cảnh 2', start: 3, end: 9, tag: 'Cảnh 2', title: 'Dậy cùng ', highlight: 'một giờ', caption: 'Cơ thể thích nhịp đều đặn mỗi ngày' },
  { name: 'Thói quen 2', short: 'Cảnh 3', start: 9, end: 16, tag: 'Cảnh 3', title: 'Chưa mở ', highlight: 'điện thoại', caption: 'Ba mươi phút đầu là của riêng bạn' },
  { name: 'Thói quen 3', short: 'Cảnh 4', start: 16, end: 23, tag: 'Cảnh 4', title: 'Vận động ', highlight: '10 phút', caption: 'Chỉ cần đủ để tim đập nhanh hơn' },
  { name: 'Kết và kêu gọi', short: 'Kết', start: 23, end: 30, tag: 'Kết', title: 'Bắt đầu từ ', highlight: 'ngày mai', caption: 'Lưu video này để không quên nhé' },
]

export const STUDIO_VOICES = [
  { label: 'Nữ · miền Nam', tone: 'ấm' },
  { label: 'Nam · miền Bắc', tone: 'trầm' },
  { label: 'Nữ · miền Bắc', tone: 'tươi' },
]

export const STUDIO_CAPTION_STYLES = ['Nảy', 'Tô màu', 'Gạch'] as const

/** Bảng màu theme minh hoạ (khớp màu nhấn của landing) */
export const STUDIO_THEME_SWATCHES = ['#C6F432', '#F2A65A', '#7AA7FF', '#E8E4DA']

/**
 * Nhận xét của người dùng THẬT (đã xin phép). Để trống thì phần nền ngà chỉ hiện câu tuyên ngôn —
 * không đăng nhận xét minh hoạ.
 */
export interface Testimonial {
  quote: string
  name: string
  role: string
}

export const TESTIMONIALS: Testimonial[] = []
