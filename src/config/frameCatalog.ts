export interface FramePresetItem {
  id: string
  name: string
  category: 'desktop' | 'mobile' | 'creative'
  emoji: string
  defaultWidth: number
  defaultHeight: number
  defaultBorderWidth: number
  defaultAccentColor?: string
  defaultUrl?: string
  theme: 'dark' | 'light' | 'glass'
  description: string
}

export const FRAME_CATEGORIES = [
  { id: 'all', label: 'Tất cả', emoji: '🖼️' },
  { id: 'desktop', label: 'Desktop & Web', emoji: '💻' },
  { id: 'mobile', label: 'Mobile App', emoji: '📱' },
  { id: 'creative', label: 'Nghệ thuật & Glass', emoji: '✨' },
] as const

export const FRAME_PRESETS: FramePresetItem[] = [
  {
    id: 'browser-macos',
    name: 'Safari macOS',
    category: 'desktop',
    emoji: '💻',
    defaultWidth: 330,
    defaultHeight: 220,
    defaultBorderWidth: 3,
    defaultAccentColor: '#00D4FF',
    defaultUrl: 'motionstudio.ai',
    theme: 'dark',
    description: 'Thanh menu macOS với 3 nút Đỏ Vàng Xanh và ô URL chuyên nghiệp'
  },
  {
    id: 'browser-chrome',
    name: 'Chrome',
    category: 'desktop',
    emoji: '🌐',
    defaultWidth: 330,
    defaultHeight: 220,
    defaultBorderWidth: 2,
    defaultAccentColor: '#BEFF01',
    defaultUrl: 'google.com/search',
    theme: 'dark',
    description: 'Khung trình duyệt Chrome tối giản hiện đại'
  },
  {
    id: 'iphone-dynamic-island',
    name: 'iPhone 15',
    category: 'mobile',
    emoji: '📱',
    defaultWidth: 200,
    defaultHeight: 380,
    defaultBorderWidth: 5,
    defaultAccentColor: '#A855F7',
    theme: 'dark',
    description: 'Viền điện thoại bo cong chuẩn tỷ lệ kèm Dynamic Island'
  },
  {
    id: 'glass-minimal',
    name: 'Kính Neon',
    category: 'creative',
    emoji: '✨',
    defaultWidth: 320,
    defaultHeight: 240,
    defaultBorderWidth: 2,
    defaultAccentColor: '#BEFF01',
    theme: 'glass',
    description: 'Viền kính mờ toả hào quang Neon tinh tế cho video công nghệ'
  }
]
