import { SocialCalloutPresetItem } from './types'

export const NEWS_BANNER_PRESETS: SocialCalloutPresetItem[] = [
  {
    id: 'news-breaking-gold',
    variant: 'news',
    category: 'news',
    label: '📰 Tin Nóng (Breaking)',
    previewBadge: 'TIN NÓNG 24H',
    data: {
      variant: 'news',
      title: 'BẢN TIN NÓNG THỜI SỰ',
      subtitle: 'TRUYỀN HÌNH TÀI CHÍNH',
      content: 'GIÁ VÀNG VÀ THỊ TRƯỜNG CHỨNG KHOÁN CHÍNH THỨC PHÁ ĐỈNH LỊCH SỬ',
      highlight: 'PHÁ ĐỈNH LỊCH SỬ',
      accentColor: '#FF3B30',
      badge: 'BREAKING NEWS',
    },
    animPreset: 'zoom-in',
  },
  {
    id: 'news-tech-update',
    variant: 'news',
    category: 'news',
    label: '⚡ Tin Nhanh AI',
    previewBadge: 'TECH NEWS',
    data: {
      variant: 'news',
      title: 'TECH INSIDER GLOBAL',
      subtitle: 'SILICON VALLEY UPDATE',
      content: 'CÔNG BỐ MÔ HÌNH TRÍ TUỆ NHÂN TẠO THẾ HỆ MỚI VƯỢT TRỘI CON NGƯỜI',
      highlight: 'TRÍ TUỆ NHÂN TẠO',
      accentColor: '#00D4FF',
      badge: 'LIVE REPORT',
    },
    animPreset: 'slide-up',
  },
]
