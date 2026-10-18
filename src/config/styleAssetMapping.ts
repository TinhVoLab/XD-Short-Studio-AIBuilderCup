import { FLUENT_EMOJI_CATALOG, FluentEmojiItem } from './fluentEmojiCatalog'

export interface StyleAssetMapItem {
  styleKeywords: string[]
  recommendedEmojiIds: string[]
}

export const STYLE_ASSET_MAPPINGS: Record<string, string[]> = {
  'healing': ['lotus', 'seedling', 'candle', 'crescent_moon', 'water_wave', 'dove', 'hot_tea', 'leaf_wind'],
  'finance': ['money_bag', 'money_with_wings', 'chart_increasing', 'gem_stone', 'trophy', 'coin'],
  'tech': ['robot', 'brain', 'laptop', 'mobile_phone', 'light_bulb', 'locked'],
  'viral': ['fire', 'rocket', 'sparkles', 'zap', 'collision', 'hundred_points'],
  'warnings': ['warning', 'check_mark_button', 'cross_mark', 'shield'],
  'faces': ['exploding_head', 'star_struck', 'smiling_face_with_sunglasses', 'eyes'],
}

export function getRecommended3dEmojisForStyle(styleText: string): FluentEmojiItem[] {
  const s = (styleText || '').toLowerCase()
  let categoryKey = 'viral'

  if (s.includes('thiền') || s.includes('chữa lành') || s.includes('an nhiên') || s.includes('chill') || s.includes('asmr')) {
    categoryKey = 'healing'
  } else if (s.includes('tài chính') || s.includes('kinh doanh') || s.includes('tiền')) {
    categoryKey = 'finance'
  } else if (s.includes('công nghệ') || s.includes('ai') || s.includes('chuyên gia')) {
    categoryKey = 'tech'
  } else if (s.includes('mẹo') || s.includes('tips') || s.includes('thủ thuật')) {
    categoryKey = 'warnings'
  } else if (s.includes('kịch tính') || s.includes('hài hước') || s.includes('meme')) {
    categoryKey = 'faces'
  }

  const ids = STYLE_ASSET_MAPPINGS[categoryKey] || STYLE_ASSET_MAPPINGS['viral']
  return FLUENT_EMOJI_CATALOG.filter(e => ids.includes(e.id))
}
