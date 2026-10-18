import React, { useState, useEffect } from 'react'
import styles from './PricingModal.module.css'
import { useEditorStore } from '@/store/useEditorStore'
import { UserPlanTier } from '@/types/auth'
import { Button } from '@/components/ui'
import { COMPANY_PAYMENT_INFO, generateVietQrUrl } from '@/config/payment'
import { TOPUP_PACKS, TransferKind, annualFreeMonths, buildTransferMemo, payableAmount } from '@/config/planCatalog'

interface PricingModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTier?: UserPlanTier
}

const PAID_TIERS = ['creator', 'business'] as const
const TOPUP = TOPUP_PACKS[0]
const formatVnd = (n: number) => `${(n || 0).toLocaleString('vi-VN')} đ`

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, firebaseUser, signInWithGoogle, showToast, getPlanByTier } = useEditorStore()
  const [billingCycle, setBillingCycle] = useState<'month' | 'year'>('year')
  // Thứ đang thanh toán: một gói (creator / business) hoặc gói mua thêm video (topup)
  const [checkoutItem, setCheckoutItem] = useState<TransferKind | null>(null)
  const [transferConfirmed, setTransferConfirmed] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCheckoutItem(null)
      setTransferConfirmed(false)
      setAuthError(null)
      setIsSigningIn(false)
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (transferConfirmed) {
          setTransferConfirmed(false)
        } else if (checkoutItem) {
          setCheckoutItem(null)
        } else {
          onClose()
        }
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, checkoutItem, transferConfirmed])

  if (!isOpen) return null

  const handleSelect = (item: TransferKind) => {
    setCheckoutItem(item)
    setTransferConfirmed(false)
    setAuthError(null)
  }

  // ── Inline Google Sign-In (Direct 1-Tap right inside checkout view) ──
  const handleInlineGoogleSignIn = async () => {
    setAuthError(null)
    setIsSigningIn(true)
    try {
      await signInWithGoogle()
      showToast('Đăng nhập thành công! Hệ thống đã liên kết tài khoản của bạn.')
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setAuthError(err.message || 'Đăng nhập Google không thành công. Vui lòng thử lại.')
      }
    } finally {
      setIsSigningIn(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    showToast(`Đã sao chép ${label}`)
  }

  // ── Checkout: số tiền + nội dung chuyển khoản lấy từ planCatalog (server đối chiếu đúng các giá trị này) ──
  const isTopup = checkoutItem === 'topup'
  const selectedPlan = checkoutItem && !isTopup ? getPlanByTier(checkoutItem) : null
  const checkoutAmount = isTopup ? TOPUP.price : payableAmount(selectedPlan, billingCycle)
  const uid = firebaseUser?.uid || currentUser.id
  const transferSyntax = checkoutItem ? buildTransferMemo(checkoutItem, uid) : ''
  const qrUrl = checkoutItem ? generateVietQrUrl({ amount: checkoutAmount, transferContent: transferSyntax }) : ''

  const cycleLabel = billingCycle === 'year' ? 'trả năm' : 'trả tháng'
  const itemLabel = isTopup ? TOPUP.label : `${selectedPlan?.name ?? ''} — ${cycleLabel}`
  const benefitItems = isTopup
    ? [
        `${TOPUP.videos} video, mỗi video tới ${TOPUP.maxVideoSec} giây`,
        'Không hết hạn, chỉ dùng khi đã hết lượt của tháng',
        'Độ phân giải và logo theo gói bạn đang dùng',
      ]
    : (selectedPlan?.bulletFeatures || []).filter(b => b.isEnabled).map(b => b.text)

  // ── Zalo deeplink with pre-filled message ──
  const userEmail = firebaseUser?.email ?? currentUser.email ?? 'N/A'
  const zalosMessage = `Chào Admin XD-Short, tôi vừa chuyển khoản ${formatVnd(checkoutAmount)} cho ${itemLabel}. Tài khoản: ${userEmail}, nội dung CK: ${transferSyntax}. Nhờ Admin kiểm tra giúp tôi.`
  const zaloDeeplink = `https://zalo.me/${COMPANY_PAYMENT_INFO.supportHotline}?text=${encodeURIComponent(zalosMessage)}`

  // "Trả năm: tặng N tháng" — tính từ giá thật của gói
  const freeMonths = Math.max(...PAID_TIERS.map(t => annualFreeMonths(getPlanByTier(t))))

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <h3 className={styles.title}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              {checkoutItem ? `Thanh toán — ${itemLabel}` : 'Nâng cấp XD-Short'}
            </h3>
            <p className={styles.subtitle}>
              {checkoutItem
                ? 'Chuyển khoản tới tài khoản doanh nghiệp chính thức'
                : 'Chọn gói phù hợp, hoặc mua thêm video khi cần'}
            </p>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={checkoutItem ? () => { setCheckoutItem(null); setTransferConfirmed(false) } : onClose}
            title="Đóng (Esc)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div className={styles.body}>
          {checkoutItem ? (
            /* ─────────────────────────────────────────────────────────────
               ALL-IN-ONE CHECKOUT VIEW (Inline 2-Step Progression)
            ───────────────────────────────────────────────────────────── */
            <div>
              {/* Step Progress Bar */}
              <div className={styles.stepProgress}>
                <div className={`${styles.stepItem} ${!firebaseUser ? styles.stepItemActive : styles.stepItemDone}`}>
                  <span className={styles.stepBadge}>
                    {firebaseUser ? (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      '1'
                    )}
                  </span>
                  <span>{firebaseUser ? 'Đã liên kết tài khoản' : '1. Xác nhận tài khoản'}</span>
                </div>
                <div className={styles.stepDivider} />
                <div className={`${styles.stepItem} ${firebaseUser ? styles.stepItemActive : ''}`}>
                  <span className={styles.stepBadge}>2</span>
                  <span>2. Quét mã VietQR ACB</span>
                </div>
              </div>

              {/* Checkout Summary Header */}
              <div className={styles.checkoutHeader}>
                <div className={styles.checkoutPlanMeta}>
                  <span className={styles.checkoutPlanLabel}>{isTopup ? 'Mua thêm' : 'Gói đăng ký'}</span>
                  <span className={styles.checkoutPlanName}>{itemLabel}</span>
                </div>
                <div className={styles.checkoutAmountMeta}>
                  <span className={styles.checkoutAmountBig}>{formatVnd(checkoutAmount)}</span>
                  <span className={styles.checkoutCycle}>
                    {isTopup ? 'Thanh toán 1 lần, không hết hạn' : billingCycle === 'year' ? 'Thanh toán 1 lần cho 12 tháng' : 'Thanh toán cho 1 tháng'}
                  </span>
                </div>
              </div>

              {/* STEP 1: INLINE AUTH (Shown seamlessly if not authenticated) */}
              {!firebaseUser ? (
                <div className={styles.inlineAuthBox}>
                  {/* Left: Package Value Reassurance */}
                  <div className={styles.inlineAuthLeft}>
                    <div>
                      <h4 className={styles.inlineAuthTitle}>{isTopup ? TOPUP.label : `Quyền lợi gói ${selectedPlan?.name ?? ''}`}</h4>
                      <p className={styles.inlineAuthDesc} style={{ marginTop: 4 }}>
                        Kích hoạt vào tài khoản Google của bạn ngay sau khi chuyển khoản.
                      </p>
                    </div>

                    <ul className={styles.featuresList} style={{ margin: 0 }}>
                      {benefitItems.map((text) => (
                        <li key={text} className={styles.featureItem}>
                          <svg className={styles.checkIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>{text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Right: 1-Tap Google Sign-In Action */}
                  <div className={styles.inlineAuthRight}>
                    <div>
                      <div style={{ fontSize: 'var(--font-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                        Bước 1 / 2
                      </div>
                      <h4 className={styles.inlineAuthTitle} style={{ fontSize: 16 }}>
                        Đăng nhập để nhận bản quyền
                      </h4>
                      <p className={styles.inlineAuthDesc} style={{ marginTop: 6 }}>
                        Hệ thống sẽ liên kết mã bản quyền và xuất hóa đơn điện tử chính thức vào tài khoản Google này.
                      </p>
                    </div>

                    {authError && (
                      <div style={{
                        padding: '8px 12px',
                        background: 'rgba(255, 85, 85, 0.1)',
                        border: '1px solid rgba(255, 85, 85, 0.25)',
                        borderRadius: 6,
                        color: '#ff6b6b',
                        fontSize: 'var(--font-xs)',
                        lineHeight: 1.4,
                      }}>
                        {authError}
                      </div>
                    )}

                    <button
                      type="button"
                      className={styles.googleHeroBtn}
                      onClick={handleInlineGoogleSignIn}
                      disabled={isSigningIn}
                      title="Đăng nhập Google 1-chạm bảo mật"
                    >
                      <svg className={styles.googleIcon} viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                        <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                      </svg>
                      <span>{isSigningIn ? 'Đang kết nối Google...' : 'Tiếp tục với Google'}</span>
                    </button>

                    <div className={styles.securityNote}>
                      <svg className={styles.securityShieldIcon} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      <span>Bảo vệ bởi Firebase Auth • 1-chạm không mật khẩu</span>
                    </div>

                    <Button variant="ghost" size="sm" onClick={() => setCheckoutItem(null)}>
                      Quay lại bảng giá
                    </Button>
                  </div>
                </div>
              ) : (
                /* STEP 2: VIETQR TRANSFER (Seamlessly activated when authenticated) */
                <div className={styles.checkoutBox}>
                  {/* QR Code Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
                    <div className={styles.qrContainer}>
                      <img src={qrUrl} alt="VietQR Công Ty ACB" className={styles.qrImg} />
                    </div>
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                      Mở app ngân hàng bất kỳ để quét mã
                    </span>
                  </div>

                  {/* Info Column */}
                  <div className={styles.infoCol}>
                    {/* Connected Account Verification */}
                    <div className={styles.connectedAccountBanner}>
                      <span className={styles.connectedAccountLabel}>Tài khoản liên kết</span>
                      <span className={styles.connectedAccountEmail}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {firebaseUser.email}
                      </span>
                    </div>

                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Công ty thụ hưởng</span>
                      <div className={styles.infoValueCopy}>
                        <span className={styles.infoValueText}>{COMPANY_PAYMENT_INFO.companyName}</span>
                      </div>
                    </div>

                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Ngân hàng — Số tài khoản</span>
                      <div className={styles.infoValueCopy}>
                        <span className={styles.infoValueText}>
                          {COMPANY_PAYMENT_INFO.bankName}: {COMPANY_PAYMENT_INFO.accountNumber}
                        </span>
                        <button
                          type="button"
                          className={styles.copyMiniBtn}
                          onClick={() => copyToClipboard(COMPANY_PAYMENT_INFO.accountNumber, 'Số tài khoản')}
                        >
                          Sao chép
                        </button>
                      </div>
                    </div>

                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Số tiền chuyển khoản</span>
                      <div className={styles.infoValueCopy}>
                        <span className={styles.infoValueHighlight}>{formatVnd(checkoutAmount)}</span>
                        <button
                          type="button"
                          className={styles.copyMiniBtn}
                          onClick={() => copyToClipboard(String(checkoutAmount), 'Số tiền')}
                        >
                          Sao chép
                        </button>
                      </div>
                    </div>

                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Nội dung chuyển khoản (bắt buộc)</span>
                      <div className={styles.infoValueCopy}>
                        <span className={styles.infoValueText} style={{ fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                          {transferSyntax}
                        </span>
                        <button
                          type="button"
                          className={styles.copyMiniBtn}
                          onClick={() => copyToClipboard(transferSyntax, 'Nội dung chuyển khoản')}
                        >
                          Sao chép
                        </button>
                      </div>
                    </div>

                    {/* VAT Notice */}
                    <div className={styles.vatNotice}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                      <span>
                        Chuyển đúng số tiền và nội dung để hệ thống tự kích hoạt; chuyển thiếu sẽ chưa được kích hoạt.
                        {!isTopup && ' Gia hạn khi gói còn hạn sẽ cộng tiếp vào ngày hết hạn hiện tại.'}
                        {checkoutItem === 'business' && ` ${COMPANY_PAYMENT_INFO.vatInvoiceNote}`}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    {!transferConfirmed ? (
                      <div className={styles.checkoutActions}>
                        <Button
                          variant="primary"
                          size="sm"
                          fullWidth
                          leftIcon={
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          }
                          onClick={() => setTransferConfirmed(true)}
                        >
                          Tôi đã chuyển khoản xong
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setCheckoutItem(null)}>
                          Quay lại bảng giá
                        </Button>
                      </div>
                    ) : (
                      /* Confirmed — Zalo Verification Handshake */
                      <div className={styles.confirmedBox}>
                        <div className={styles.confirmedTitle}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Giao dịch đang chờ xác nhận
                        </div>
                        <p className={styles.confirmedDesc}>
                          Hệ thống thường kích hoạt trong vài giây sau khi nhận đúng số tiền và nội dung. Nếu sau 5 phút chưa thấy, hãy nhắn Admin qua Zalo — tin nhắn đã được soạn sẵn.
                        </p>

                        <Button
                          variant="primary"
                          size="sm"
                          fullWidth
                          leftIcon={
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                          }
                          onClick={() => window.open(zaloDeeplink, '_blank', 'noreferrer')}
                        >
                          Mở Zalo nhắn Admin ({COMPANY_PAYMENT_INFO.supportHotline})
                        </Button>

                        {/* Fallback for desktop */}
                        <div style={{
                          background: 'var(--surface-1)',
                          border: '1px solid var(--border)',
                          borderRadius: 7,
                          padding: '10px 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 7,
                        }}>
                          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', fontWeight: 500 }}>
                            Không mở được Zalo? Sao chép nội dung này gửi thủ công:
                          </div>
                          <div style={{
                            fontSize: 'var(--font-xs)',
                            color: 'var(--text-sub)',
                            lineHeight: 1.55,
                            fontStyle: 'italic',
                            background: 'var(--surface-2)',
                            borderRadius: 5,
                            padding: '7px 10px',
                            border: '1px solid var(--border)',
                          }}>
                            {zalosMessage}
                          </div>
                          <button
                            type="button"
                            className={styles.copyMiniBtn}
                            style={{ alignSelf: 'flex-start' }}
                            onClick={() => copyToClipboard(zalosMessage, 'nội dung tin nhắn Zalo')}
                          >
                            Copy nội dung
                          </button>
                        </div>

                        <Button variant="ghost" size="sm" onClick={() => { setCheckoutItem(null); setTransferConfirmed(false) }}>
                          Đóng
                        </Button>
                      </div>
                    )}

                    <div className={styles.supportRow}>
                      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                        Hỗ trợ kỹ thuật &amp; kiểm tra lệnh
                      </span>
                      <a
                        href={COMPANY_PAYMENT_INFO.supportZalo}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.supportLink}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        Zalo {COMPANY_PAYMENT_INFO.supportHotline}
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

          ) : (
            /* ─────────────────────────────────────────────────────────────
               PLAN COMPARISON VIEW (Clean & Pure)
            ───────────────────────────────────────────────────────────── */
            <>
              {/* Billing Cycle Switcher */}
              <div className={styles.cycleToggleRow}>
                <button
                  type="button"
                  className={`${styles.cycleBtn} ${billingCycle === 'month' ? styles.cycleBtnActive : ''}`}
                  onClick={() => setBillingCycle('month')}
                >
                  Trả tháng
                </button>
                <button
                  type="button"
                  className={`${styles.cycleBtn} ${billingCycle === 'year' ? styles.cycleBtnActive : ''}`}
                  onClick={() => setBillingCycle('year')}
                >
                  Trả năm
                  {freeMonths > 0 && <span className={styles.discountBadge}>Tặng {freeMonths} tháng</span>}
                </button>
              </div>

              {/* Cards Grid */}
              <div className={styles.cardsGrid}>
                {PAID_TIERS.map((tier) => {
                  const plan = getPlanByTier(tier)
                  const monthly = payableAmount(plan, 'month')
                  const annual = payableAmount(plan, 'year')
                  const months = annualFreeMonths(plan)
                  const perMonth = billingCycle === 'year' ? plan.pricing.annualUnitPrice : monthly
                  const isCurrent = currentUser.planTier === tier
                  return (
                    <div key={tier} className={`${styles.card} ${plan.isFeatured ? styles.cardFeatured : ''}`}>
                      <div className={styles.cardHeaderRow}>
                        <div className={styles.tierName}>{plan.name}</div>
                        {plan.badgeText && <span className={styles.ribbon}>{plan.badgeText}</span>}
                      </div>
                      <div className={styles.tierDesc}>{plan.description}</div>

                      <div className={styles.priceWrapper}>
                        <div className={styles.priceMainRow}>
                          <span className={styles.priceValue}>{perMonth.toLocaleString('vi-VN')}</span>
                          <span className={styles.priceCurrency}>đ</span>
                          <span className={styles.priceUnit}>/ tháng</span>
                        </div>
                        <div className={styles.billingSubtext}>
                          {billingCycle === 'year' ? (
                            <>
                              <span>Trả {formatVnd(annual)} cho 12 tháng</span>
                              {months > 0 && (
                                <span style={{ color: 'var(--accent)', fontWeight: 700 }}> · tặng {months} tháng</span>
                              )}
                            </>
                          ) : (
                            <span>Trả từng tháng, không tự động gia hạn</span>
                          )}
                        </div>
                      </div>

                      <ul className={styles.featuresList}>
                        {plan.bulletFeatures?.filter(b => b.isEnabled).map((item) => (
                          <li key={item.id} className={styles.featureItem}>
                            <svg className={styles.checkIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>{item.text}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        variant={plan.isFeatured ? 'primary' : 'secondary'}
                        size="md"
                        fullWidth
                        leftIcon={
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                          </svg>
                        }
                        onClick={() => handleSelect(tier)}
                      >
                        {isCurrent ? 'Gia hạn gói hiện tại' : `Chọn gói ${plan.name}`}
                      </Button>
                    </div>
                  )
                })}
              </div>

              {/* Top-up: mua thêm video, dùng sau khi hết lượt tháng */}
              <div className={styles.topupRow}>
                <div className={styles.topupInfo}>
                  <div className={styles.tierName}>{TOPUP.label} — {formatVnd(TOPUP.price)}</div>
                  <div className={styles.tierDesc}>
                    Mỗi video tới {TOPUP.maxVideoSec} giây, không hết hạn, chỉ dùng khi đã hết lượt của tháng. Dùng được với mọi gói.
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => handleSelect('topup')}>
                  Mua thêm video
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
