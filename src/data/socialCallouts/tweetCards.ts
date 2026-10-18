import { SocialCalloutPresetItem } from './types'

export const TWEET_CARD_PRESETS: SocialCalloutPresetItem[] = [
  {
    id: 'tweet-elon',
    variant: 'tweet',
    category: 'tweet',
    label: '🐦 Tweet Elon Musk',
    previewBadge: 'X / TWITTER',
    data: {
      variant: 'tweet',
      title: 'Elon Musk',
      subtitle: '@elonmusk • 2h',
      content: 'AI is going to be the biggest multiplier in human history. Build now or get left behind.',
      highlight: 'Build now',
      accentColor: '#1DA1F2',
      badge: 'VERIFIED',
    },
    animPreset: 'zoom-in',
  },
  {
    id: 'tweet-crypto-whale',
    variant: 'tweet',
    category: 'tweet',
    label: '💎 Tweet Chuyên Gia',
    previewBadge: 'CHUYÊN GIA',
    data: {
      variant: 'tweet',
      title: 'Top Investor',
      subtitle: '@topinvestor • Vừa đăng',
      content: 'Cơ hội lớn nhất thập kỷ đang diễn ra ngay trước mắt bạn. 99% người vẫn đang thờ ơ!',
      highlight: 'Cơ hội lớn nhất',
      accentColor: '#FFD700',
      badge: 'TOP 1%',
    },
    animPreset: 'slide-up',
  },
]
