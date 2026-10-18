export interface SvgShapeItem {
  id: string
  label: string
  category: 'basic' | 'arrows' | 'badges' | 'social' | 'frames'
  tags: string[]
  svgPath: string
  viewBox?: string
  defaultWidth: number
  defaultHeight: number
  defaultFill: string
  defaultStroke: string
  defaultStrokeWidth: number
}

export const SVG_CATEGORIES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'basic', label: '🔷 Cơ bản' },
  { id: 'arrows', label: '🏹 Mũi tên' },
  { id: 'badges', label: '🏷️ Badges' },
  { id: 'social', label: '📱 Social' },
  { id: 'frames', label: '🖼️ Khung hình' },
] as const

export const SVG_SHAPES_CATALOG: SvgShapeItem[] = [
  // ── 🔷 CƠ BẢN (BASIC) ──────────────────────────────
  {
    id: 'circle',
    label: 'Hình tròn',
    category: 'basic',
    tags: ['circle', 'tron', 'round', 'basic'],
    svgPath: 'M22 6A16 16 0 1 1 21.99 6Z',
    viewBox: '0 0 44 44',
    defaultWidth: 100,
    defaultHeight: 100,
    defaultFill: 'transparent',
    defaultStroke: '#BEFF01',
    defaultStrokeWidth: 3
  },
  {
    id: 'square',
    label: 'Hình vuông',
    category: 'basic',
    tags: ['square', 'vuong', 'rect', 'basic'],
    svgPath: 'M7 7H37V37H7Z',
    viewBox: '0 0 44 44',
    defaultWidth: 100,
    defaultHeight: 100,
    defaultFill: 'transparent',
    defaultStroke: '#BEFF01',
    defaultStrokeWidth: 3
  },
  {
    id: 'rounded-rect',
    label: 'Hình chữ nhật bo góc',
    category: 'basic',
    tags: ['rect', 'bo goc', 'pill', 'basic'],
    svgPath: 'M10 8H34C37.3 8 40 10.7 40 14V30C40 33.3 37.3 36 34 36H10C6.7 36 4 33.3 4 30V14C4 10.7 6.7 8 10 8Z',
    viewBox: '0 0 44 44',
    defaultWidth: 140,
    defaultHeight: 80,
    defaultFill: 'rgba(190,255,1,0.1)',
    defaultStroke: '#BEFF01',
    defaultStrokeWidth: 2
  },
  {
    id: 'triangle',
    label: 'Hình tam giác',
    category: 'basic',
    tags: ['triangle', 'tam giac', 'basic'],
    svgPath: 'M22 6L39 37H5Z',
    viewBox: '0 0 44 44',
    defaultWidth: 100,
    defaultHeight: 100,
    defaultFill: 'transparent',
    defaultStroke: '#BEFF01',
    defaultStrokeWidth: 3
  },
  {
    id: 'star',
    label: 'Ngôi sao 5 cánh',
    category: 'basic',
    tags: ['star', 'ngoi sao', 'basic'],
    svgPath: 'M22 4L26.5 15.5H39L29 23L33 35L22 27.5L11 35L15 23L5 15.5H17.5Z',
    viewBox: '0 0 44 44',
    defaultWidth: 100,
    defaultHeight: 100,
    defaultFill: '#FFD700',
    defaultStroke: '#FFD700',
    defaultStrokeWidth: 1
  },
  {
    id: 'hexagon',
    label: 'Lục giác',
    category: 'basic',
    tags: ['hexagon', 'luc giac', 'basic'],
    svgPath: 'M22 5L37 13.6V30.4L22 39L7 30.4V13.6Z',
    viewBox: '0 0 44 44',
    defaultWidth: 100,
    defaultHeight: 100,
    defaultFill: 'transparent',
    defaultStroke: '#BEFF01',
    defaultStrokeWidth: 3
  },
  {
    id: 'heart',
    label: 'Trái tim',
    category: 'basic',
    tags: ['heart', 'trai tim', 'love', 'like'],
    svgPath: 'M22 36L19.4 33.6C10.2 25.3 4 19.7 4 12.8C4 7.1 8.4 2.8 14.1 2.8C17.3 2.8 20.4 4.3 22 6.7C23.6 4.3 26.7 2.8 29.9 2.8C35.6 2.8 40 7.1 40 12.8C40 19.7 33.8 25.3 24.6 33.6L22 36Z',
    viewBox: '0 0 44 44',
    defaultWidth: 100,
    defaultHeight: 100,
    defaultFill: '#FF2D78',
    defaultStroke: '#FF2D78',
    defaultStrokeWidth: 1
  },
  {
    id: 'speech-bubble',
    label: 'Hộp thoại / Callout',
    category: 'basic',
    tags: ['bubble', 'callout', 'chat', 'dialog'],
    svgPath: 'M8 6H36C38.2 6 40 7.8 40 10V26C40 28.2 38.2 30 36 30H18L10 38V30H8C5.8 30 4 28.2 4 26V10C4 7.8 5.8 6 8 6Z',
    viewBox: '0 0 44 44',
    defaultWidth: 140,
    defaultHeight: 100,
    defaultFill: 'rgba(255,255,255,0.1)',
    defaultStroke: '#FFFFFF',
    defaultStrokeWidth: 2
  },

  // ── 🏹 MŨI TÊN (ARROWS) ──────────────────────────────
  {
    id: 'arrow-straight',
    label: 'Mũi tên thẳng',
    category: 'arrows',
    tags: ['arrow', 'mui ten', 'straight'],
    svgPath: 'M6 22H36M26 12L36 22L26 32',
    viewBox: '0 0 44 44',
    defaultWidth: 120,
    defaultHeight: 60,
    defaultFill: 'none',
    defaultStroke: '#BEFF01',
    defaultStrokeWidth: 4
  },
  {
    id: 'arrow-curved',
    label: 'Mũi tên cong uốn',
    category: 'arrows',
    tags: ['arrow', 'curved', 'cong', 'loop'],
    svgPath: 'M8 32C14 16 30 12 36 22M28 16L36 22L32 30',
    viewBox: '0 0 44 44',
    defaultWidth: 120,
    defaultHeight: 80,
    defaultFill: 'none',
    defaultStroke: '#FFB800',
    defaultStrokeWidth: 3.5
  },
  {
    id: 'arrow-double',
    label: 'Mũi tên 2 chiều',
    category: 'arrows',
    tags: ['arrow', 'double', 'hai chieu'],
    svgPath: 'M14 12L6 22L14 32M30 12L38 22L30 32M6 22H38',
    viewBox: '0 0 44 44',
    defaultWidth: 140,
    defaultHeight: 60,
    defaultFill: 'none',
    defaultStroke: '#00D4FF',
    defaultStrokeWidth: 3
  },
  {
    id: 'pointer-hand',
    label: 'Bàn tay chỉ trỏ',
    category: 'arrows',
    tags: ['pointer', 'hand', 'chi tro', 'finger'],
    svgPath: 'M18 6V20C18 20.6 17.6 21 17 21C16.4 21 16 20.6 16 20V12C16 11.4 15.6 11 15 11C14.4 11 14 11.4 14 12V20C14 20.6 13.6 21 13 21C12.4 21 12 20.6 12 20V15C12 14.4 11.6 14 11 14C10.4 14 10 14.4 10 15V26L6.4 22.4C6 22 5.3 22 4.9 22.4L4 23.3L11.7 31C13.2 32.5 15.2 33.4 17.3 33.4H25C28.3 33.4 31 30.7 31 27.4V17C31 16.4 30.6 16 30 16C29.4 16 29 16.4 29 17V20C29 20.6 28.6 21 28 21C27.4 21 27 20.6 27 20V8C27 7.4 26.6 7 26 7C25.4 7 25 7.4 25 8V20C25 20.6 24.6 21 24 21C23.4 21 23 20.6 23 20V6C23 5.4 22.6 5 22 5C21.4 5 21 5.4 21 6V20C21 20.6 20.6 21 20 21C19.4 21 19 20.6 19 20V6H18Z',
    viewBox: '0 0 36 36',
    defaultWidth: 80,
    defaultHeight: 80,
    defaultFill: '#BEFF01',
    defaultStroke: '#BEFF01',
    defaultStrokeWidth: 1
  },

  // ── 🏷️ BADGES & TAGS ──────────────────────────────
  {
    id: 'badge-fire',
    label: 'HOT 🔥 (Ngọn lửa)',
    category: 'badges',
    tags: ['fire', 'hot', 'lua', 'flame', 'badge'],
    svgPath: 'M18 3.5C18 3.5 13.5 9 13.5 14C13.5 16.5 15 18.5 17 19.5C15.5 17 16 13.5 18.5 11.5C21.5 15.5 25.5 17 25.5 22.5C25.5 27 22 30.5 17.5 30.5C13 30.5 9.5 27 9.5 22.5C9.5 16.5 15 10 18 3.5Z',
    viewBox: '0 0 36 36',
    defaultWidth: 80,
    defaultHeight: 90,
    defaultFill: '#FF5544',
    defaultStroke: '#FFD700',
    defaultStrokeWidth: 1.5
  },
  {
    id: 'badge-alert',
    label: 'Cảnh báo ⚠️ (Warning)',
    category: 'badges',
    tags: ['alert', 'warning', 'canh bao', 'danger'],
    svgPath: 'M18 4L34 32H2L18 4ZM18 14V22M18 26V28',
    viewBox: '0 0 36 36',
    defaultWidth: 90,
    defaultHeight: 80,
    defaultFill: 'rgba(255, 184, 0, 0.15)',
    defaultStroke: '#FFB800',
    defaultStrokeWidth: 2.5
  },
  {
    id: 'badge-check',
    label: 'Checkmark ✅ (Đồng ý)',
    category: 'badges',
    tags: ['check', 'success', 'dong y', 'correct'],
    svgPath: 'M18 4C10.3 4 4 10.3 4 18C4 25.7 10.3 32 18 32C25.7 32 32 25.7 32 18C32 10.3 25.7 4 18 4ZM14 24L8 18L10.8 15.2L14 18.4L23.2 9.2L26 12L14 24Z',
    viewBox: '0 0 36 36',
    defaultWidth: 80,
    defaultHeight: 80,
    defaultFill: '#BEFF01',
    defaultStroke: '#BEFF01',
    defaultStrokeWidth: 1
  },
  {
    id: 'badge-cross',
    label: 'Cross ❌ (Hủy/Sai)',
    category: 'badges',
    tags: ['cross', 'cancel', 'sai', 'remove', 'error'],
    svgPath: 'M18 4C10.3 4 4 10.3 4 18C4 25.7 10.3 32 18 32C25.7 32 32 25.7 32 18C32 10.3 25.7 4 18 4ZM23.6 20.8L20.8 23.6L18 20.8L15.2 23.6L12.4 20.8L15.2 18L12.4 15.2L15.2 12.4L18 15.2L20.8 12.4L23.6 15.2L20.8 18L23.6 20.8Z',
    viewBox: '0 0 36 36',
    defaultWidth: 80,
    defaultHeight: 80,
    defaultFill: '#FF2D78',
    defaultStroke: '#FF2D78',
    defaultStrokeWidth: 1
  },

  // ── 📱 SOCIAL & TECH ──────────────────────────────
  {
    id: 'social-tiktok',
    label: 'TikTok Logo',
    category: 'social',
    tags: ['tiktok', 'social', 'video'],
    svgPath: 'M23.6 4C23.6 8 26.8 11.2 30.8 11.2V16C28 16 25.5 15 23.6 13.4V24C23.6 28.4 20 32 15.6 32C11.2 32 7.6 28.4 7.6 24C7.6 19.6 11.2 16 15.6 16C16.3 16 17 16.1 17.6 16.3V21.2C17 21 16.3 20.9 15.6 20.9C13.9 20.9 12.5 22.3 12.5 24C12.5 25.7 13.9 27.1 15.6 27.1C17.3 27.1 18.7 25.7 18.7 24V4H23.6Z',
    viewBox: '0 0 36 36',
    defaultWidth: 80,
    defaultHeight: 80,
    defaultFill: '#00D4FF',
    defaultStroke: '#FF2D78',
    defaultStrokeWidth: 1.5
  },
  {
    id: 'social-like',
    label: 'Nút Like (Thumbs Up)',
    category: 'social',
    tags: ['like', 'thumbs up', 'thich', 'social'],
    svgPath: 'M4 32H10V14H4V32ZM32 16C32 14.9 31.1 14 30 14H20.7L22.1 7.3L22.1 6.9C22.1 6.4 21.9 5.9 21.5 5.5L20 4L11.4 12.6C10.9 13.1 10.6 13.8 10.6 14.5V29.5C10.6 30.9 11.7 32 13.1 32H25.6C26.7 32 27.6 31.3 28 30.4L31.7 21.7C31.9 21.2 32 20.6 32 20V16Z',
    viewBox: '0 0 36 36',
    defaultWidth: 80,
    defaultHeight: 80,
    defaultFill: '#00D4FF',
    defaultStroke: '#00D4FF',
    defaultStrokeWidth: 1
  },
  {
    id: 'social-bell',
    label: 'Quả chuông Thông báo',
    category: 'social',
    tags: ['bell', 'chuong', 'thong bao', 'subscribe'],
    svgPath: 'M18 32C19.7 32 21 30.7 21 29H15C15 30.7 16.3 32 18 32ZM27 23V14C27 9.4 24.5 5.5 20.2 4.5V3.5C20.2 2.3 19.2 1.3 18 1.3C16.8 1.3 15.8 2.3 15.8 3.5V4.5C11.5 5.5 9 9.4 9 14V23L6 26V27.5H30V26L27 23Z',
    viewBox: '0 0 36 36',
    defaultWidth: 80,
    defaultHeight: 80,
    defaultFill: '#FFD700',
    defaultStroke: '#FFD700',
    defaultStrokeWidth: 1
  },

  // ── 🖼️ KHUNG HÌNH (FRAMES) ──────────────────────────────
  {
    id: 'frame-terminal',
    label: 'Cửa sổ Terminal (Code)',
    category: 'frames',
    tags: ['terminal', 'code', 'window', 'frame', 'tech'],
    svgPath: 'M4 8H36C38.2 8 40 9.8 40 12V32C40 34.2 38.2 36 36 36H4C1.8 36 0 34.2 0 32V12C0 9.8 1.8 8 4 8ZM4 16V32H36V16H4ZM8 12C8 12.6 8.4 13 9 13C9.6 13 10 12.6 10 12C10 11.4 9.6 11 9 11C8.4 11 8 11.4 8 12ZM13 12C13 12.6 13.4 13 14 13C14.6 13 15 12.6 15 12C15 11.4 14.6 11 14 11C13.4 11 13 11.4 13 12ZM18 12C18 12.6 18.4 13 19 13C19.6 13 20 12.6 20 12C20 11.4 19.6 11 19 11C18.4 11 18 11.4 18 12Z',
    viewBox: '0 0 40 40',
    defaultWidth: 280,
    defaultHeight: 180,
    defaultFill: 'rgba(10,10,10,0.85)',
    defaultStroke: '#BEFF01',
    defaultStrokeWidth: 1.5
  },
  {
    id: 'frame-camera',
    label: 'Khung Camera Viewfinder',
    category: 'frames',
    tags: ['camera', 'viewfinder', 'frame', 'focus'],
    svgPath: 'M4 14V6H12M28 6H36V14M36 26V34H28M12 34H4V26M17 20H23M20 17V23',
    viewBox: '0 0 40 40',
    defaultWidth: 240,
    defaultHeight: 240,
    defaultFill: 'none',
    defaultStroke: '#BEFF01',
    defaultStrokeWidth: 2.5
  }
]
