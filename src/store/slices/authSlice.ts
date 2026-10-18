import { StateCreator } from 'zustand'
import { EditorStore } from '../storeTypes'
import { UserProfile, UserPlanTier } from '@/types/auth'
import { DEFAULT_PLANS, findPlan, TOPUP_PACKS } from '@/config/planCatalog'
import { 
  User, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signOut, 
  onIdTokenChanged,
  sendPasswordResetEmail
} from 'firebase/auth'
import { auth, googleProvider } from '@/config/firebase'
import { API_BASE, apiFetch } from '@/config/api'
import { fetchUserCloudProfile, updateUserCloudPlan } from '@/services/userSyncService'

const STORAGE_KEY = 'xd_short_user_auth'

const getCurrentMonthKey = (): string => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/** Hạn mức tháng mặc định theo gói (trước khi có số liệu server) */
const defaultMonthlyLimit = (tier: UserPlanTier): number =>
  tier === 'admin' ? -1 : (findPlan(DEFAULT_PLANS, tier)?.quotas.monthlyVideoLimit ?? 0)

const getDefaultGuestUser = (): UserProfile => ({
  id: 'usr_creator_guest',
  name: 'Nhà Sáng Tạo Khách',
  email: '',
  planTier: 'free',
  role: 'user',
  quota: {
    videosRenderedThisMonth: 0,
    monthlyVideoLimit: defaultMonthlyLimit('free'),
    bonusVideos: 0,
    lastResetMonth: getCurrentMonthKey(),
  },
  createdAt: new Date().toISOString(),
})

const loadUserFromStorage = (): UserProfile => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getDefaultGuestUser()
    const parsed: UserProfile = JSON.parse(raw)
    
    // Auto-rollover monthly quota check
    const currentMonth = getCurrentMonthKey()
    if (parsed.quota.lastResetMonth !== currentMonth) {
      parsed.quota.videosRenderedThisMonth = 0
      parsed.quota.lastResetMonth = currentMonth
      parsed.quota.monthlyVideoLimit = defaultMonthlyLimit(parsed.planTier)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
    }
    return parsed
  } catch {
    return getDefaultGuestUser()
  }
}

const saveUserToStorage = (user: UserProfile) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  } catch (e) {
    console.error('Failed to save user profile to localStorage', e)
  }
}

export interface AuthSlice {
  currentUser: UserProfile
  firebaseUser: User | null
  idToken: string | null
  isAuthLoading: boolean
  authModalOpen: boolean
  pricingModalOpen: boolean
  
  setAuthModalOpen: (open: boolean) => void
  setPricingModalOpen: (open: boolean) => void
  updateUserProfile: (patch: Partial<UserProfile>) => void
  switchPlanDev: (tier: UserPlanTier) => void
  resetQuotaDev: () => void
  canRenderVideo: () => { allowed: boolean; reason?: string }
  
  // Firebase Auth Actions
  initAuthListener: () => () => void
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, pass: string) => Promise<void>
  signUpWithEmail: (email: string, pass: string, displayName?: string) => Promise<void>
  signOutUser: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
  fetchRemoteQuota: () => Promise<void>
}

// UID Cache Guard: Prevents redundant Firestore reads on hourly token refreshes
let _lastSyncedUid: string | null = null

export const createAuthSlice: StateCreator<EditorStore, [], [], AuthSlice> = (set, get) => ({
  currentUser: loadUserFromStorage(),
  firebaseUser: null,
  idToken: null,
  isAuthLoading: true,
  authModalOpen: false,
  pricingModalOpen: false,

  setAuthModalOpen: (open: boolean) => {
    set({ authModalOpen: open })
  },

  setPricingModalOpen: (open: boolean) => {
    set({ pricingModalOpen: open })
  },

  updateUserProfile: (patch: Partial<UserProfile>) => {
    const updated = { ...get().currentUser, ...patch }
    saveUserToStorage(updated)
    set({ currentUser: updated })
  },

  switchPlanDev: (tier: UserPlanTier) => {
    const prev = get().currentUser
    const isSuperAdmin = prev.role === 'admin'
    
    // Prevent non-admins from escalating to admin tier
    const targetTier = (tier === 'admin' && !isSuperAdmin) ? 'creator' : tier
    const targetPlan = get().getPlanByTier(targetTier)
    const updated: UserProfile = {
      ...prev,
      planTier: targetTier,
      role: isSuperAdmin ? 'admin' : 'user',
      quota: {
        ...prev.quota,
        monthlyVideoLimit: targetPlan.quotas.monthlyVideoLimit,
      },
    }
    saveUserToStorage(updated)
    set({ currentUser: updated })
    get().showToast(`Đã chuyển sang gói: ${targetPlan.name}`)

    // Persist to Cloud Firestore if authenticated
    const uid = get().firebaseUser?.uid
    if (uid) {
      updateUserCloudPlan(uid, targetTier).catch(() => {})
    }
  },

  resetQuotaDev: () => {
    const prev = get().currentUser
    const updated: UserProfile = {
      ...prev,
      quota: {
        ...prev.quota,
        videosRenderedThisMonth: 0,
      },
    }
    saveUserToStorage(updated)
    set({ currentUser: updated })
    get().showToast('Đã đặt lại hạn ngạch: 0 video đã dùng')
  },

  // Kiểm tra sơ bộ phía client (server mới là nơi quyết định): còn lượt tháng hoặc còn video mua thêm
  canRenderVideo: () => {
    const { currentUser } = get()
    if (currentUser.planTier === 'admin') return { allowed: true }

    const plan = get().getPlanByTier(currentUser.planTier)
    const limit = plan.quotas.monthlyVideoLimit
    const used = currentUser.quota.videosRenderedThisMonth
    const bonus = currentUser.quota.bonusVideos || 0
    if (limit !== -1 && used >= limit && bonus <= 0) {
      const topup = TOPUP_PACKS[0]
      return {
        allowed: false,
        reason: `Bạn đã dùng hết ${used}/${limit} video của gói ${plan.name} tháng này. Mua "${topup.label}" (${topup.price.toLocaleString('vi-VN')} đ) hoặc nâng cấp gói để xuất tiếp.`,
      }
    }
    return { allowed: true }
  },

  // ── Firebase Auth Integrations ──

  initAuthListener: () => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
        const tokenResult = await user.getIdTokenResult()
        const token = tokenResult.token
        const isAdmin = Boolean(
          tokenResult.claims.admin ||
          tokenResult.claims.role === 'admin'
        )
        const existingProfile = get().currentUser

        const updatedProfile: UserProfile = {
          ...existingProfile,
          id: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'Nhà Sáng Tạo',
          email: user.email || '',
          avatarUrl: user.photoURL || existingProfile.avatarUrl,
          planTier: isAdmin ? 'admin' : (existingProfile.planTier === 'admin' ? 'free' : existingProfile.planTier),
          role: isAdmin ? 'admin' : 'user',
        }

        saveUserToStorage(updatedProfile)
        set({
          firebaseUser: user,
          idToken: token,
          currentUser: updatedProfile,
          isAuthLoading: false,
        })

        // Authoritative cloud sync: Only read from Firestore ONCE per user session (UID Cache Guard)
        // Eliminates redundant Firestore reads on hourly token refreshes!
        if (_lastSyncedUid !== user.uid) {
          _lastSyncedUid = user.uid
          fetchUserCloudProfile(user).then((cloudProfile) => {
            const syncedProfile: UserProfile = {
              ...get().currentUser,
              name: cloudProfile.displayName,
              planTier: cloudProfile.planTier,
              role: cloudProfile.role,
              subscriptionExpiresAt: cloudProfile.subscriptionExpiresAt,
              subscriptionPeriod: cloudProfile.subscriptionPeriod,
              subscriptionStatus: cloudProfile.subscriptionStatus,
              uidTag: cloudProfile.uidTag,
              quota: {
                ...get().currentUser.quota,
                monthlyVideoLimit: get().getPlanByTier(cloudProfile.planTier).quotas.monthlyVideoLimit,
              },
            }
            saveUserToStorage(syncedProfile)
            set({ currentUser: syncedProfile })
          }).catch((err) => {
            console.warn('Silent cloud sync skip:', err)
          })
        }

        // Attempt to sync quota from backend
        get().fetchRemoteQuota().catch(() => {})
      } else {
        _lastSyncedUid = null
        const guestUser = getDefaultGuestUser()
        saveUserToStorage(guestUser)
        set({
          firebaseUser: null,
          idToken: null,
          currentUser: guestUser,
          isAuthLoading: false,
        })
      }
    })

    return unsubscribe
  },

  fetchRemoteQuota: async () => {
    const { firebaseUser } = get()
    if (!firebaseUser) return

    try {
      // Use apiFetch with skipRetry: true to prevent onIdTokenChanged infinite loops
      const res = await apiFetch(`${API_BASE}/api/render/quota`, {
        skipRetry: true,
      })

      if (res.ok) {
        const data = await res.json()
        const current = get().currentUser
        const updated: UserProfile = {
          ...current,
          quota: {
            ...current.quota,
            videosRenderedThisMonth: Number(data.used) || 0,
            monthlyVideoLimit: Number(data.limit),
            bonusVideos: Number(data.bonusVideos) || 0,
          },
        }
        saveUserToStorage(updated)
        set({ currentUser: updated })
      }
    } catch (err) {
      console.warn('Failed to fetch remote quota:', err)
    }
  },

  signInWithGoogle: async () => {
    try {
      set({ isAuthLoading: true })
      await signInWithPopup(auth, googleProvider)
      set({ authModalOpen: false })
      get().showToast('Đăng nhập Google thành công')
    } catch (err: any) {
      console.error('Google Sign-in failed:', err)
      get().showToast(err.message || 'Đăng nhập Google thất bại')
      throw err
    } finally {
      set({ isAuthLoading: false })
    }
  },

  signInWithEmail: async (email: string, pass: string) => {
    try {
      set({ isAuthLoading: true })
      await signInWithEmailAndPassword(auth, email, pass)
      set({ authModalOpen: false })
      get().showToast('Đăng nhập thành công')
    } catch (err: any) {
      console.error('Email sign-in failed:', err)
      get().showToast(err.message || 'Email hoặc mật khẩu không đúng')
      throw err
    } finally {
      set({ isAuthLoading: false })
    }
  },

  signUpWithEmail: async (email: string, pass: string, displayName?: string) => {
    try {
      set({ isAuthLoading: true })
      const res = await createUserWithEmailAndPassword(auth, email, pass)
      if (displayName && res.user) {
        await updateProfile(res.user, { displayName })
      }
      set({ authModalOpen: false })
      get().showToast('Đăng ký tài khoản thành công')
    } catch (err: any) {
      console.error('Sign up failed:', err)
      get().showToast(err.message || 'Đăng ký tài khoản thất bại')
      throw err
    } finally {
      set({ isAuthLoading: false })
    }
  },

  signOutUser: async () => {
    try {
      set({ isAuthLoading: true })
      await signOut(auth)
      get().showToast('Đã đăng xuất tài khoản')
    } catch (err: any) {
      console.error('Sign out failed:', err)
      get().showToast('Đăng xuất thất bại')
    } finally {
      set({ isAuthLoading: false })
    }
  },

  sendPasswordReset: async (email: string) => {
    try {
      set({ isAuthLoading: true })
      await sendPasswordResetEmail(auth, email)
      get().showToast('Đã gửi email đặt lại mật khẩu! Vui lòng kiểm tra hộp thư.')
    } catch (err: any) {
      console.error('Password reset failed:', err)
      get().showToast(err.message || 'Không thể gửi email đặt lại mật khẩu')
      throw err
    } finally {
      set({ isAuthLoading: false })
    }
  },
})
