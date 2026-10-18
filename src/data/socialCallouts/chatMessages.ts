import { SocialCalloutPresetItem } from './types'

export const CHAT_MESSAGE_PRESETS: SocialCalloutPresetItem[] = [
  {
    id: 'chat-imessage-deal',
    variant: 'chat',
    category: 'chat',
    label: '💬 Chat iMessage',
    previewBadge: 'iMESSAGE',
    data: {
      variant: 'chat',
      title: 'Khách Hàng VIP 👑',
      subtitle: 'iMessage • Vừa xong',
      content: 'Bên anh vừa chuyển cọc 100% rồi nhé. Giao hàng sớm nhất cho anh!',
      highlight: 'chuyển cọc 100%',
      accentColor: '#34C759',
      badge: 'CHỐT ĐƠN',
    },
    animPreset: 'slide-up',
  },
  {
    id: 'chat-telegram-alert',
    variant: 'chat',
    category: 'chat',
    label: '🚀 Chat Telegram',
    previewBadge: 'TELEGRAM',
    data: {
      variant: 'chat',
      title: 'Hội Quán VIP ✦',
      subtitle: 'Telegram Channel',
      content: 'Tín hiệu tăng trưởng mạnh đã kích hoạt! Chuẩn bị dòng tiền ngay.',
      highlight: 'Tín hiệu tăng trưởng',
      accentColor: '#0088CC',
      badge: 'TÍN HIỆU',
    },
    animPreset: 'bounce',
  },
]
