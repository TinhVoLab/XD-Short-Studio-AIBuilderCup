import React, { useState, useEffect } from 'react'
import styles from './RedeemKeyModal.module.css'
import { useEditorStore } from '@/store/useEditorStore'
import { Button } from '@/components/ui'
import { redeemLicenseKey, COMPANY_PAYMENT_INFO } from '@/config/payment'

interface RedeemKeyModalProps {
  isOpen: boolean
  onClose: () => void
}

export const RedeemKeyModal: React.FC<RedeemKeyModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, firebaseUser, switchPlanDev, showToast, getPlanByTier } = useEditorStore()
  const [keyInput, setKeyInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setKeyInput('')
      setError(null)
      setIsLoading(false)
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const targetEmail = firebaseUser?.email || currentUser.email || 'creator@xdshort.app'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const clean = keyInput.trim().toUpperCase()
    if (!clean) {
      setError('Vui lòng nhập mã bản quyền.')
      return
    }

    if (!firebaseUser) {
      setError('Vui lòng đăng nhập trước khi kích hoạt bản quyền.')
      return
    }

    setIsLoading(true)
    const res = await redeemLicenseKey(clean)

    if (!res.success || !res.tier) {
      setError(res.error || 'Mã bản quyền không hợp lệ hoặc đã hết hạn.')
      setIsLoading(false)
      return
    }

    // Success: activate plan locally
    switchPlanDev(res.tier)
    showToast(`Chúc mừng! Tài khoản ${targetEmail} đã được nâng cấp lên ${getPlanByTier(res.tier).name}!`)
    setIsLoading(false)
    onClose()
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <div className={styles.title}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                <path d="M21 2l-2 2m-1.5 6.1L12 17.5V22h4.5l1.6-1.6 2-2 1.5-1.5" />
                <circle cx="7.5" cy="7.5" r="4.5" />
              </svg>
              Kích Hoạt Bản Quyền
            </div>
            <div className={styles.subtitle}>
              Nhập mã License Key hoặc Voucher hợp lệ để nâng cấp gói tức thì.
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            title="Đóng (Esc)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Identity Tag */}
          <div className={styles.accountBanner}>
            <span className={styles.accountBannerLabel}>Kích hoạt cho</span>
            <span className={styles.accountBannerEmail}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {targetEmail}
            </span>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputRow}>
              <label className={styles.inputLabel}>Mã Bản Quyền (License Key)</label>
              <input
                type="text"
                className={styles.keyInput}
                placeholder="VD: XDS-CREATOR-2026 hoặc XDS-BIZ-2026"
                value={keyInput}
                onChange={(e) => {
                  setKeyInput(e.target.value.toUpperCase())
                  setError(null)
                }}
                autoFocus
              />
              {error && <div className={styles.errorMsg}>{error}</div>}
            </div>

            <Button
              variant="primary"
              size="md"
              fullWidth
              type="submit"
              disabled={isLoading}
              leftIcon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              }
            >
              {isLoading ? 'Đang kích hoạt...' : 'Xác Nhận Kích Hoạt'}
            </Button>
          </form>

          {/* Help hint */}
          <div className={styles.hintBox}>
            <div className={styles.hintTitle}>Chưa có mã kích hoạt?</div>
            <div>
              Mã bản quyền được cấp cho đối tác, quà tặng khóa học hoặc hóa đơn doanh nghiệp B2B. Nếu bạn cần hỗ trợ, liên hệ Zalo: <strong>{COMPANY_PAYMENT_INFO.supportHotline}</strong>.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
