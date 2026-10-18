import React, { useState, useRef, useEffect } from 'react'
import styles from './UserProfileMenu.module.css'
import { useEditorStore } from '@/store/useEditorStore'
import { useShallow } from 'zustand/react/shallow'
import { Button } from '@/components/ui'
import { TIER_BADGE_STYLES, UserPlanTier } from '@/types/auth'
import { RedeemKeyModal } from '@/components/Auth/RedeemKeyModal'
import { BillingModal } from '@/components/BillingModal/BillingModal'
import { billingService } from '@/services/billingService'
import { COMPANY_PAYMENT_INFO } from '@/config/payment'

export const UserProfileMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isRedeemOpen, setIsRedeemOpen] = useState(false)
  const [isBillingOpen, setIsBillingOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const {
    currentUser,
    firebaseUser,
    brandingSettings,
    setSettingsModalOpen,
    setPricingModalOpen,
    setAuthModalOpen,
    signOutUser,
    fetchRemoteQuota,
    switchPlanDev,
    resetQuotaDev,
    showToast,
    getPlanByTier,
  } = useEditorStore(
    useShallow(s => ({
      currentUser: s.currentUser,
      firebaseUser: s.firebaseUser,
      brandingSettings: s.brandingSettings,
      setSettingsModalOpen: s.setSettingsModalOpen,
      setPricingModalOpen: s.setPricingModalOpen,
      setAuthModalOpen: s.setAuthModalOpen,
      signOutUser: s.signOutUser,
      fetchRemoteQuota: s.fetchRemoteQuota,
      switchPlanDev: s.switchPlanDev,
      resetQuotaDev: s.resetQuotaDev,
      showToast: s.showToast,
      getPlanByTier: s.getPlanByTier,
    }))
  )

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      window.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  // If not logged in, render a minimalist login button
  if (!firebaseUser) {
    return (
      <div className={styles.menuWrapper}>
        <Button
          variant="primary"
          size="xs"
          leftIcon={
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          }
          onClick={() => setAuthModalOpen(true)}
        >
          Đăng Nhập
        </Button>
      </div>
    )
  }

  const authorName = currentUser.name || brandingSettings.authorName || 'Nhà Sáng Tạo'
  const authorEmail = currentUser.email || 'creator@xdshort.app'
  const avatarUrl = currentUser.avatarUrl || brandingSettings.authorAvatarUrl

  const isSuperAdmin = currentUser.role === 'admin'

  const plan = getPlanByTier(currentUser.planTier)
  const badge = TIER_BADGE_STYLES[currentUser.planTier] || TIER_BADGE_STYLES.free
  const isInfinite = currentUser.planTier === 'admin'
  const usedVideos = currentUser.quota?.videosRenderedThisMonth ?? 0
  const limitVideos = plan.quotas.monthlyVideoLimit
  const bonusVideos = currentUser.quota?.bonusVideos ?? 0
  const percentUsed = isInfinite || limitVideos <= 0 ? 100 : Math.min(100, Math.round((usedVideos / limitVideos) * 100))
  const countdown = billingService.getSubscriptionCountdown(currentUser.subscriptionExpiresAt, currentUser.planTier)

  const handleOpenSettings = () => {
    setIsOpen(false)
    setSettingsModalOpen(true)
  }

  const handleOpenPricing = () => {
    setIsOpen(false)
    setPricingModalOpen(true)
  }

  const handleSignOut = async () => {
    setIsOpen(false)
    await signOutUser()
  }

  return (
    <div className={styles.menuWrapper} ref={menuRef}>
      {/* Avatar Trigger Button */}
      <button
        type="button"
        className={`${styles.avatarBtn} ${isOpen ? styles.avatarBtnActive : ''} ${isSuperAdmin ? styles.avatarBtnAdmin : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title={isSuperAdmin ? `Hồ sơ: ${authorName} (Super Admin - Bấm để mở menu)` : `Hồ sơ: ${authorName} (${plan.name})`}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
            onError={e => {
              ;(e.target as HTMLElement).style.display = 'none'
            }}
          />
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        )}
        {isSuperAdmin ? (
          <span className={styles.adminMiniBadge} title="Super Admin">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </span>
        ) : (
          <span className={styles.onlineIndicator} />
        )}
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div className={styles.dropdown}>
          {/* 1. Header Profile */}
          <div className={styles.profileHeader}>
            <div className={styles.largeAvatar}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={badge.color} strokeWidth="1.8">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
            </div>
            <div className={styles.profileInfo}>
              <div className={styles.nameRow}>
                <span className={styles.authorName}>{authorName}</span>
                <span
                  className={styles.planBadge}
                  style={{ color: badge.color, background: badge.bg, borderColor: badge.color }}
                >
                  {plan.name}
                </span>
              </div>
              <span className={styles.authorHandle} title={authorEmail}>{authorEmail}</span>
            </div>
          </div>

          {/* 2. SaaS Quota Card */}
          <div className={styles.quotaCard}>
            <div className={styles.quotaRow}>
              <div className={styles.quotaLabel}>
                <span>Video tháng này</span>
                <span className={styles.quotaValue}>
                  {isInfinite ? 'Admin' : `${usedVideos} / ${limitVideos}`}
                </span>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{
                    width: isInfinite ? '100%' : `${percentUsed}%`,
                    background: percentUsed >= 100 && !isInfinite
                      ? 'var(--danger, #ff4d4f)'
                      : 'linear-gradient(90deg, #9ACD00 0%, #BEFF01 100%)',
                  }}
                />
              </div>
              {!isInfinite && bonusVideos > 0 && (
                <div className={styles.quotaLabel}>
                  <span>Video mua thêm còn lại</span>
                  <span className={styles.quotaValue}>{bonusVideos}</span>
                </div>
              )}
            </div>

            {currentUser.planTier !== 'free' && currentUser.planTier !== 'admin' && currentUser.subscriptionExpiresAt && (
              <div className={`${styles.subscriptionExpiry} ${countdown.isExpired ? styles.subscriptionExpiryExpired : ''}`}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>{countdown.label}</span>
              </div>
            )}

            {currentUser.planTier === 'free' && (
              <Button
                variant="primary"
                size="sm"
                fullWidth
                leftIcon={
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                }
                onClick={handleOpenPricing}
                style={{ marginTop: 4 }}
              >
                Xem các gói
              </Button>
            )}
          </div>

          {/* 3. Dev / Testing Role Switcher (Super Admin Only) */}
          {isSuperAdmin && (
            <div className={styles.devSection}>
              <div className={styles.devHeader}>
                <span className={styles.devLabel}>Chế độ Dev / Test Role</span>
                <button
                  type="button"
                  className={styles.devResetBtn}
                  onClick={() => {
                    resetQuotaDev();
                    fetchRemoteQuota();
                  }}
                  title="Reset số video đã dùng về 0"
                >
                  Reset Quota
                </button>
              </div>
              <div className={styles.devRoleGrid}>
                {(['free', 'creator', 'business', 'admin'] as UserPlanTier[]).map(tier => (
                  <button
                    key={tier}
                    type="button"
                    className={`${styles.devRoleBtn} ${currentUser.planTier === tier ? styles.devRoleBtnActive : ''}`}
                    onClick={() => switchPlanDev(tier)}
                  >
                    {tier === 'free' ? 'Free' : tier === 'creator' ? 'Creator' : tier === 'business' ? 'Business' : 'Admin'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. Action Menu Items */}
          <div className={styles.menuList}>
            {isSuperAdmin && (
              <button
                type="button"
                className={styles.menuItem}
                style={{ color: 'var(--accent)', fontWeight: 600 }}
                onClick={() => {
                  setIsOpen(false)
                  useEditorStore.getState().setAppViewMode('admin')
                  window.history.pushState({}, '', '/admin')
                }}
              >
                <span className={styles.menuIcon}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                  </svg>
                </span>
                <span>Quản Trị Hệ Thống (/admin)</span>
              </button>
            )}
            <button
              type="button"
              className={styles.menuItem}
              onClick={() => {
                setIsOpen(false)
                setIsBillingOpen(true)
              }}
            >
              <span className={styles.menuIcon}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </span>
              <span>Gói Cước & Lịch Sử Hóa Đơn</span>
            </button>

            <button
              type="button"
              className={styles.menuItem}
              onClick={handleOpenPricing}
            >
              <span className={styles.menuIcon}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              </span>
              <span>Bảng Giá Gói Đăng Ký</span>
            </button>

            <button
              type="button"
              className={styles.menuItem}
              onClick={() => {
                setIsOpen(false)
                setIsRedeemOpen(true)
              }}
            >
              <span className={styles.menuIcon}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 2l-2 2m-1.5 6.1L12 17.5V22h4.5l1.6-1.6 2-2 1.5-1.5" />
                  <circle cx="7.5" cy="7.5" r="4.5" />
                </svg>
              </span>
              <span>Kích Hoạt Bản Quyền (Redeem Key)</span>
            </button>

            <button
              type="button"
              className={styles.menuItem}
              onClick={handleOpenSettings}
            >
              <span className={styles.menuIcon}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
              </span>
              <span>Cài Đặt Studio & Kênh</span>
            </button>

            <a
              href={COMPANY_PAYMENT_INFO.supportZalo}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.menuItem}
              style={{ textDecoration: 'none' }}
            >
              <span className={styles.menuIcon}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              </span>
              <span>Hỗ Trợ Zalo ({COMPANY_PAYMENT_INFO.supportHotline})</span>
            </a>
          </div>

          {/* 5. Footer */}
          <div className={styles.footerRow}>
            <Button
              variant="ghost"
              size="xs"
              leftIcon={
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              }
              onClick={handleSignOut}
            >
              Đăng xuất
            </Button>
            <span className={styles.versionTag}>v2.4 SaaS Cloud</span>
          </div>
        </div>
      )}

      {/* Standalone Redeem Key Modal */}
      <RedeemKeyModal
        isOpen={isRedeemOpen}
        onClose={() => setIsRedeemOpen(false)}
      />

      {/* Standalone Billing & Subscription Hub Modal */}
      <BillingModal
        isOpen={isBillingOpen}
        onClose={() => setIsBillingOpen(false)}
      />
    </div>
  )
}
