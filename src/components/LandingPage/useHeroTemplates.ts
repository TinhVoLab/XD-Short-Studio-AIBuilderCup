import { useEffect, useState } from 'react'
import type { GalleryCategory } from './landingContent'

export interface HeroTemplateVideo {
  videoSrc: string
  poster?: string
}

export type HeroTemplateMap = Partial<Record<GalleryCategory, HeroTemplateVideo>>

type RemoteTemplate = { id?: string; videoSrc?: string; poster?: string }

const toMap = (remote: unknown): HeroTemplateMap | null => {
  if (!Array.isArray(remote) || remote.length === 0) return null
  const map: HeroTemplateMap = {}
  for (const t of remote as RemoteTemplate[]) {
    if (t?.id && t.videoSrc) map[t.id as GalleryCategory] = { videoSrc: t.videoSrc, poster: t.poster || undefined }
  }
  return map
}

/** Video mẫu theo chủ đề do Admin cấu hình (system_settings/app_config.heroTemplates): API trước, fallback Firestore */
export function useHeroTemplates(): HeroTemplateMap {
  const [templates, setTemplates] = useState<HeroTemplateMap>({})

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      try {
        const res = await fetch('/api/settings/public')
        if (res.ok) {
          const map = toMap((await res.json())?.heroTemplates)
          if (map) {
            if (isMounted) setTemplates(map)
            return
          }
        }
      } catch {
        // Fallback Firestore bên dưới
      }
      try {
        const { doc, getDoc } = await import('firebase/firestore')
        const { db } = await import('@/config/firebase')
        const snap = await getDoc(doc(db, 'system_settings', 'app_config'))
        const map = snap.exists() ? toMap(snap.data().heroTemplates) : null
        if (map && isMounted) setTemplates(map)
      } catch {
        // Không có video mẫu: thẻ hiển thị bản mô phỏng
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [])

  return templates
}
