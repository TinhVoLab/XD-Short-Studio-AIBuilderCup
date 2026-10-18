/**
 * Lịch sử layout master-hook gần đây theo project — gửi lên AI để hookDesigner không lặp kiểu hook
 * giữa các video liên tiếp trong cùng project (xem src/config/hookDesigner.js, recentLayouts).
 */
import type { Scene } from '@/types/scene'

const KEEP = 3
const key = (projectId: string) => `xd.hookHistory.${projectId || 'proj_default'}`

export function getRecentHookLayouts(projectId: string): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(key(projectId)) || '[]')
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string').slice(0, KEEP) : []
  } catch {
    return []
  }
}

/** Ghi các layout hook của video vừa tạo lên đầu lịch sử (không trùng, giữ 3) */
export function recordHookLayouts(projectId: string, scenes: Scene[]): void {
  const used = scenes.flatMap(s => s.elements || [])
    .filter(el => el.type === 'master-hook' && el.hookData?.layoutStyle)
    .map(el => el.hookData!.layoutStyle as string)
  if (used.length === 0) return
  const next = [...new Set([...used, ...getRecentHookLayouts(projectId)])].slice(0, KEEP)
  try {
    localStorage.setItem(key(projectId), JSON.stringify(next))
  } catch {
    // Trình duyệt chặn storage: chỉ mất tính năng tránh lặp, không ảnh hưởng tạo video
  }
}
