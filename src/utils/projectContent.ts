import type { Scene } from '@/types/scene'

/** Dự án đã có nội dung người dùng làm (element hoặc lời thoại) — wizard không ghi đè, tạo dự án mới */
export function hasProjectContent(scenes: Scene[] | undefined): boolean {
  return (scenes || []).some((sc) => (sc.elements?.length || 0) > 0 || Boolean(sc.voiceoverText?.trim()))
}

/** Tên dự án mới từ ý tưởng video: một dòng, tối đa 60 ký tự, cắt ở ranh giới từ */
export function projectTitleFromIdea(idea: string, fallback = 'Dự án mới'): string {
  const line = (idea || '').trim().split(/\n/)[0].replace(/\s+/g, ' ')
  if (!line) return fallback
  if (line.length <= 60) return line
  const cut = line.slice(0, 60)
  return `${cut.slice(0, cut.lastIndexOf(' ') > 30 ? cut.lastIndexOf(' ') : 60)}…`
}
