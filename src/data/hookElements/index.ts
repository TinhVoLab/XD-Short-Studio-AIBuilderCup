import { FakeSearchData, PushNotificationData } from '@/types/scene'

export interface HookPresetItem {
  id: string;
  type: 'fake-search' | 'push-notification';
  category: 'search' | 'notif';
  label: string;
  previewBadge: string;
  accentColor: string;
  animPreset: string;
  searchData?: FakeSearchData;
  notificationData?: PushNotificationData;
}

export const SEARCH_PRESETS: HookPresetItem[] = [
  {
    id: 'search-viral-hook',
    type: 'fake-search',
    category: 'search',
    label: '🔍 Tìm Kiếm Triệu View',
    previewBadge: 'GLASS',
    accentColor: '#00D4FF',
    animPreset: 'none',
    searchData: {
      keyword: 'Cách làm video triệu view...',
      placeholder: 'Tìm kiếm...',
      engine: 'glass',
      typingSpeed: 2,
      accentColor: '#00D4FF',
      autoSearchBadge: 'XU HƯỚNG',
    },
  },
  {
    id: 'search-tiktok-trend',
    type: 'fake-search',
    category: 'search',
    label: '🎵 Tìm Kiếm TikTok',
    previewBadge: 'TIKTOK',
    accentColor: '#FE2C55',
    animPreset: 'none',
    searchData: {
      keyword: 'Bí quyết kiếm 100 triệu đầu tiên',
      placeholder: 'Tìm kiếm trên TikTok...',
      engine: 'tiktok',
      typingSpeed: 2,
      accentColor: '#FE2C55',
      autoSearchBadge: 'HOT TREND',
    },
  },
  {
    id: 'search-google-curiosity',
    type: 'fake-search',
    category: 'search',
    label: '🌐 Tìm Kiếm Google',
    previewBadge: 'GOOGLE',
    accentColor: '#4285F4',
    animPreset: 'none',
    searchData: {
      keyword: 'Tại sao 99% người bắt đầu lại bỏ cuộc?',
      placeholder: 'Google Search...',
      engine: 'google',
      typingSpeed: 2,
      accentColor: '#4285F4',
      autoSearchBadge: 'INSIGHT',
    },
  },
  {
    id: 'search-youtube-course',
    type: 'fake-search',
    category: 'search',
    label: '▶️ Tìm Kiếm YouTube',
    previewBadge: 'YOUTUBE',
    accentColor: '#FF0000',
    animPreset: 'none',
    searchData: {
      keyword: 'Lộ trình tự học AI từ 0 đến có việc',
      placeholder: 'Tìm kiếm video...',
      engine: 'youtube',
      typingSpeed: 2,
      accentColor: '#FF0000',
      autoSearchBadge: 'KHÓA HỌC',
    },
  },
]

export const NOTIFICATION_PRESETS: HookPresetItem[] = [
  {
    id: 'notif-vcb-deposit',
    type: 'push-notification',
    category: 'notif',
    label: '🔔 Nổ Số Dư +50Tr',
    previewBadge: 'VCB',
    accentColor: '#00D46A',
    animPreset: 'slide-up',
    notificationData: {
      appName: 'VIETCOMBANK',
      appIcon: '🏦',
      title: '+50,000,000 đ',
      message: 'Lợi nhuận Q4 chuyển về tài khoản',
      timeText: 'bây giờ',
      badge: 'THÀNH CÔNG',
      accentColor: '#00D46A',
    },
  },
  {
    id: 'notif-vip-client',
    type: 'push-notification',
    category: 'notif',
    label: '💬 Khách VIP Chốt Đơn',
    previewBadge: 'CHAT',
    accentColor: '#007AFF',
    animPreset: 'slide-up',
    notificationData: {
      appName: 'TIN NHẮN',
      appIcon: '💬',
      title: 'Khách VIP Linh Đan 🔥',
      message: 'Em chốt cọc gói doanh nghiệp rồi nha anh!',
      timeText: 'vừa xong',
      badge: 'KHÁCH VIP',
      accentColor: '#007AFF',
    },
  },
  {
    id: 'notif-tiktok-viral',
    type: 'push-notification',
    category: 'notif',
    label: '🎵 Video Đạt 1M Views',
    previewBadge: 'TIKTOK',
    accentColor: '#FE2C55',
    animPreset: 'slide-up',
    notificationData: {
      appName: 'TIKTOK',
      appIcon: '🎵',
      title: 'Chúc mừng video đạt 1M views! 🚀',
      message: 'Video của bạn đang thịnh hành trên trang Dành Cho Bạn.',
      timeText: '2m trước',
      badge: 'VIRAL',
      accentColor: '#FE2C55',
    },
  },
  {
    id: 'notif-urgent-security',
    type: 'push-notification',
    category: 'notif',
    label: '⚠️ Cảnh Báo Khẩn Cấp',
    previewBadge: 'ALERT',
    accentColor: '#FF3B30',
    animPreset: 'slide-up',
    notificationData: {
      appName: 'CẢNH BÁO',
      appIcon: '⚠️',
      title: 'Phát hiện biến động thị trường!',
      message: 'Thị trường có dấu hiệu điều chỉnh mạnh, hãy xem ngay.',
      timeText: 'bây giờ',
      badge: 'KHẨN CẤP',
      accentColor: '#FF3B30',
    },
  },
]

export const FRAME_MOCKUP_PRESETS: any[] = [
  {
    id: 'frame-safari-macos',
    type: 'frame-mockup',
    category: 'frame',
    label: '💻 Safari macOS',
    previewBadge: 'MACOS',
    accentColor: '#00D4FF',
    animPreset: 'fade-in',
    frameData: {
      framePreset: 'browser-macos',
      urlText: 'motionstudio.ai',
      theme: 'dark',
      borderWidth: 3,
      accentColor: '#00D4FF',
    },
  },
  {
    id: 'frame-chrome-browser',
    type: 'frame-mockup',
    category: 'frame',
    label: '🌐 Chrome',
    previewBadge: 'CHROME',
    accentColor: '#BEFF01',
    animPreset: 'fade-in',
    frameData: {
      framePreset: 'browser-chrome',
      urlText: 'google.com/search',
      theme: 'dark',
      borderWidth: 2,
      accentColor: '#BEFF01',
    },
  },
  {
    id: 'frame-iphone-15',
    type: 'frame-mockup',
    category: 'frame',
    label: '📱 iPhone 15',
    previewBadge: 'IPHONE',
    accentColor: '#A855F7',
    animPreset: 'fade-in',
    frameData: {
      framePreset: 'iphone-dynamic-island',
      theme: 'dark',
      borderWidth: 5,
      accentColor: '#A855F7',
    },
  },
  {
    id: 'frame-glass-neon',
    type: 'frame-mockup',
    category: 'frame',
    label: '✨ Kính Neon',
    previewBadge: 'NEON',
    accentColor: '#BEFF01',
    animPreset: 'fade-in',
    frameData: {
      framePreset: 'glass-minimal',
      theme: 'glass',
      borderWidth: 2,
      accentColor: '#BEFF01',
    },
  },
]

export const HOOK_CALLOUT_PRESETS: any[] = [
  ...SEARCH_PRESETS,
  ...NOTIFICATION_PRESETS,
]

export const ALL_HOOK_PRESETS: any[] = [
  ...SEARCH_PRESETS,
  ...NOTIFICATION_PRESETS,
  ...FRAME_MOCKUP_PRESETS,
]

