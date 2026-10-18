import { useEditorStore } from '@/store/useEditorStore'
import { videoCredits } from '@/config/planCatalog'

/** Dòng lượt tạo video ở footer wizard: cùng luật tính lượt với server (planCatalog.videoCredits) */
export function useVideoCreditText(videoSec: number): string {
  const planTier = useEditorStore((s) => s.currentUser.planTier)
  const quota = useEditorStore((s) => s.currentUser.quota)
  const getPlanByTier = useEditorStore((s) => s.getPlanByTier)

  if (planTier === 'admin') return 'Không giới hạn lượt tạo video'
  const plan = getPlanByTier(planTier)
  const limit = plan.quotas.monthlyVideoLimit
  const remaining = Math.max(0, limit - (quota?.videosRenderedThisMonth ?? 0))
  const bonus = quota?.bonusVideos ?? 0
  const credits = videoCredits(plan, videoSec) ?? 1
  return `Video ${videoSec} giây dùng ${credits} lượt · còn ${remaining}/${limit} lượt tháng này${bonus > 0 ? ` (+${bonus} lượt mua thêm)` : ''}`
}
