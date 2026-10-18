export type UserPlanTier = 'free' | 'creator' | 'business' | 'admin'

export interface UserQuota {
  videosRenderedThisMonth: number
  monthlyVideoLimit: number // theo gói (planCatalog); -1 = không giới hạn (Admin)
  bonusVideos?: number // video mua thêm còn lại (server: users/{uid}.bonusVideos)
  lastResetMonth: string // YYYY-MM để tự động reset khi sang tháng mới
}

export interface UserProfile {
  id: string
  name: string
  email: string
  avatarUrl?: string
  planTier: UserPlanTier
  role: 'user' | 'admin'
  quota: UserQuota
  subscriptionExpiresAt?: string | null
  subscriptionPeriod?: 'monthly' | 'yearly' | 'lifetime'
  subscriptionStatus?: 'active' | 'expired' | 'trial'
  uidTag?: string
  createdAt: string
}

/** Màu badge theo gói (chỉ giao diện) — tên, giá, hạn mức lấy từ src/config/planCatalog.js qua store */
export const TIER_BADGE_STYLES: Record<UserPlanTier, { color: string; bg: string }> = {
  free: { color: '#8b949e', bg: 'rgba(139, 148, 158, 0.15)' },
  creator: { color: '#BEFF01', bg: 'rgba(190, 255, 1, 0.15)' },
  business: { color: '#00D4FF', bg: 'rgba(0, 212, 255, 0.15)' },
  admin: { color: '#FF4560', bg: 'rgba(255, 69, 96, 0.15)' },
}
