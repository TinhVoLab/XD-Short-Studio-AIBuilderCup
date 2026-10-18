import { SeoNamingPattern } from '@/types/settings'

/**
 * Convert Vietnamese string to standard SEO slug (hyphen-separated, ASCII only).
 * Example: "5 Sai Lầm Khi Học AI!" -> "5-sai-lam-khi-hoc-ai"
 */
export function slugifyVietnamese(str: string): string {
  if (!str) return ''
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents / diacritics
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '') // remove special symbols
    .trim()
    .replace(/\s+/g, '-') // replace whitespace with hyphen
    .replace(/-+/g, '-') // collapse consecutive hyphens
    .replace(/^-+|-+$/g, '') // trim leading/trailing hyphens
    .slice(0, 60) // reasonable filename length
}

/**
 * Generate a complete SEO-optimized filename from current scenes, author, and naming pattern.
 * Example patterns:
 * - 'slug-by-author-year': "top-3-cong-cu-ai-by-tinhvo-digital-2026"
 * - 'slug-by-author': "top-3-cong-cu-ai-by-tinhvo-digital"
 * - 'slug-year': "top-3-cong-cu-ai-2026"
 * - 'slug-only': "top-3-cong-cu-ai"
 */
export function generateSeoVideoFilename(
  scenes: any[], 
  defaultAuthor: string = 'TinhVo Digital',
  pattern: SeoNamingPattern = 'slug-by-author-year'
): string {
  if (!scenes || !scenes.length) {
    return `viral-short-by-creator-${new Date().getFullYear()}`
  }

  const scene1 = scenes[0]
  // Extract keyword from name, hudHeader, or voiceoverText
  let rawTitle = scene1.name || ''
  if (!rawTitle || rawTitle.startsWith('Cảnh ') || rawTitle.length < 3) {
    rawTitle = (scene1.hudHeader || scene1.voiceoverText || '').replace(/^--\s*|\s*--$/g, '').slice(0, 45)
  }
  if (!rawTitle) rawTitle = 'viral-short-video'

  const cleanTitle = slugifyVietnamese(rawTitle) || 'video'
  const rawAuthor = scene1.authorName || defaultAuthor || ''
  const cleanAuthor = slugifyVietnamese(rawAuthor)
  const year = new Date().getFullYear()

  switch (pattern) {
    case 'slug-by-author':
      return cleanAuthor ? `${cleanTitle}-by-${cleanAuthor}` : cleanTitle
    case 'slug-year':
      return `${cleanTitle}-${year}`
    case 'slug-only':
      return cleanTitle
    case 'slug-by-author-year':
    default:
      if (cleanAuthor && !cleanTitle.includes(cleanAuthor)) {
        return `${cleanTitle}-by-${cleanAuthor}-${year}`
      }
      return `${cleanTitle}-${year}`
  }
}
