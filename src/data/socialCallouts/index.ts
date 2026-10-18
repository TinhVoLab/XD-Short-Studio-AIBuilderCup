import { SocialCalloutPresetItem } from './types'
import { BANK_ALERT_PRESETS } from './bankAlerts'
import { TWEET_CARD_PRESETS } from './tweetCards'
import { CHAT_MESSAGE_PRESETS } from './chatMessages'
import { NEWS_BANNER_PRESETS } from './newsBanners'

export * from './types'
export * from './bankAlerts'
export * from './tweetCards'
export * from './chatMessages'
export * from './newsBanners'

export const ALL_SOCIAL_CALLOUT_PRESETS: SocialCalloutPresetItem[] = [
  ...BANK_ALERT_PRESETS,
  ...TWEET_CARD_PRESETS,
  ...CHAT_MESSAGE_PRESETS,
  ...NEWS_BANNER_PRESETS,
]
