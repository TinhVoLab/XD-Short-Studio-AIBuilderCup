import { HookPresetItem, HighlightBoxPresetItem } from './types'
import { VIRAL_HOOK_PRESETS } from './viralHooks'
import { SLOGAN_HOOK_PRESETS } from './sloganHooks'
import { CTA_HOOK_PRESETS } from './ctaHooks'

export * from './types'
export * from './viralHooks'
export * from './sloganHooks'
export * from './ctaHooks'

export const HIGHLIGHT_BOX_PRESETS: HighlightBoxPresetItem[] = [
  {
    id: 'hl-card-tip',
    type: 'highlight-box',
    variant: 'callout-card',
    boxIcon: 'tip',
    label: 'Mẹo Thực Chiến 1-0-2',
    badge: 'MẸO ĐẮT GIÁ',
    content: 'Tập trung 80% thời lượng vào việc giải quyết đúng 1 vấn đề nhức nhối nhất của khách hàng.',
    accent: '#FFD700',
    animPreset: 'fade-in',
  },
  {
    id: 'hl-strip-insight',
    type: 'highlight-box',
    variant: 'accent-strip',
    boxIcon: 'sparkle',
    label: 'Bài Học Cốt Lõi (Strip)',
    badge: 'INSIGHT',
    content: 'Sự kiên trì tạo ra kỹ năng, kỹ năng tạo ra tự tin, và tự tin mang lại kết quả vượt trội.',
    accent: '#00D4FF',
    animPreset: 'slide-up',
  },
  {
    id: 'hl-pill-cta',
    type: 'highlight-box',
    variant: 'glow-pill',
    boxIcon: 'cta',
    textAlign: 'center',
    label: 'Kêu Gọi Hành Động (CTA)',
    badge: 'KÊU GỌI CTA',
    content: 'Nhấn Follow kênh để nhận bộ tài liệu chuyên sâu mỗi tuần!',
    accent: '#BEFF01',
    animPreset: 'zoom-in',
  },
  {
    id: 'hl-card-warning',
    type: 'highlight-box',
    variant: 'callout-card',
    boxIcon: 'alert',
    label: 'Cảnh Báo Sai Lầm Lớn',
    badge: 'CẢNH BÁO',
    content: 'Đừng bao giờ bắt đầu video bằng lời chào rườm rà. Đi thẳng vào vấn đề trong 3 giây đầu!',
    accent: '#FF3B30',
    animPreset: 'slide-up',
  },
  {
    id: 'hl-bullets-vcb',
    type: 'highlight-box',
    variant: 'bullet-list',
    label: '3 Bước Thực Thi Chuẩn',
    badge: '3 BƯỚC THỰC THI',
    content: 'Bước 1: Khảo sát đối thủ cạnh tranh\nBước 2: Tối ưu kịch bản 3 giây đầu\nBước 3: Đăng tải đều đặn mỗi ngày',
    accent: '#BEFF01',
    animPreset: 'fade-in',
  },
  {
    id: 'hl-pills-hormozi',
    type: 'highlight-box',
    variant: 'multi-pill',
    label: 'Sticker Alex Hormozi',
    badge: 'STICKER HORMOZI',
    content: 'TẬP TRUNG • SÁNG TẠO • BỨT PHÁ',
    accent: '#BEFF01',
    animPreset: 'zoom-in',
  },
  {
    id: 'hl-numbered-list',
    type: 'numbered-list',
    label: 'Quy Trình Đánh Số 1-2-3',
    badge: 'QUY TRÌNH 1-2-3',
    content: 'Xác định khách hàng tiềm năng',
    items: ['Xác định khách hàng tiềm năng', 'Thiết kế bố cục trực quan', 'Xuất bản và theo dõi tương tác'],
    accent: '#BEFF01',
    animPreset: 'fade-in',
  },
]

export const MASTER_TYPOGRAPHY_PRESETS: HookPresetItem[] = [
  ...VIRAL_HOOK_PRESETS,
  ...SLOGAN_HOOK_PRESETS,
  ...CTA_HOOK_PRESETS,
]
