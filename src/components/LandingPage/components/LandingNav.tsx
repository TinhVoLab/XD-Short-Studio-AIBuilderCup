import React, { useState } from 'react'
import styles from './LandingNav.module.css'
import shared from '../shared.module.css'
import { LandingLogo, ArrowRightIcon } from './primitives'
import { useEditorStore } from '@/store/useEditorStore'
import { annualFreeMonths } from '@/config/planCatalog'

interface LandingNavProps {
  onOpenStudio: () => void
  onScrollTo: (id: string) => void
  /** Trên mobile, ẩn nút khi thanh CTA dính đáy đang hiện (tránh 2 nút chính cùng lúc) */
  hideCtaOnMobile?: boolean
}

const NAV_LINKS = [
  { id: 'studio', label: 'Studio', isNew: true },
  { id: 'how', label: 'Cách hoạt động' },
  { id: 'pricing', label: 'Bảng giá' },
  { id: 'faq', label: 'Hỏi đáp' },
]

export const LandingNav: React.FC<LandingNavProps> = ({ onOpenStudio, onScrollTo, hideCtaOnMobile }) => {
  const [showBar, setShowBar] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const { getPlanByTier, firebaseUser, setAuthModalOpen } = useEditorStore()

  // "Tặng N tháng" tính từ giá thật của gói, không ghi tay
  const freeMonths = Math.max(annualFreeMonths(getPlanByTier('creator')), annualFreeMonths(getPlanByTier('business')))

  const go = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    setMenuOpen(false)
    onScrollTo(id)
  }

  const login = (e: React.MouseEvent) => {
    e.preventDefault()
    setMenuOpen(false)
    setAuthModalOpen(true)
  }

  return (
    <>
      {showBar && freeMonths > 0 && (
        <div className={styles.promo}>
          <div className={styles.promoInner}>
            <span className={styles.promoBadge}>Ưu đãi</span>
            <span>
              Trả theo năm — <strong>tặng {freeMonths} tháng</strong>, thanh toán VietQR, không tự gia hạn.
            </span>
            <a href="#pricing" className={styles.promoLink} onClick={(e) => go(e, 'pricing')}>
              Xem bảng giá →
            </a>
          </div>
          <button type="button" className={`${styles.iconBtn} ${styles.promoClose}`} onClick={() => setShowBar(false)} aria-label="Đóng thông báo">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
      )}

      <header className={styles.header}>
        <nav className={styles.nav} aria-label="Chính">
          <LandingLogo href="#hero" />

          <div className={styles.links}>
            {NAV_LINKS.map((link) => (
              <a key={link.id} href={`#${link.id}`} className={styles.link} onClick={(e) => go(e, link.id)}>
                {link.label}
                {link.isNew && <span className={styles.newDot} aria-hidden="true" />}
              </a>
            ))}
          </div>

          <div className={styles.actions}>
            {!firebaseUser && (
              <a href="#login" className={styles.login} onClick={login}>
                Đăng nhập
              </a>
            )}
            <button
              type="button"
              className={`${shared.btnLight} ${styles.cta} ${hideCtaOnMobile ? styles.ctaHiddenMobile : ''}`}
              onClick={onOpenStudio}
            >
              Tạo video miễn phí
              <ArrowRightIcon size={14} />
            </button>
            <button
              type="button"
              className={`${styles.iconBtn} ${styles.menuBtn}`}
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}
              aria-expanded={menuOpen}
              aria-controls="landing-mobile-menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                {menuOpen ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </nav>

        {menuOpen && (
          <div id="landing-mobile-menu" className={styles.mobileMenu}>
            {NAV_LINKS.map((link) => (
              <a key={link.id} href={`#${link.id}`} className={styles.mobileLink} onClick={(e) => go(e, link.id)}>
                {link.label}
              </a>
            ))}
            {!firebaseUser && (
              <a href="#login" className={styles.mobileLink} onClick={login}>
                Đăng nhập
              </a>
            )}
          </div>
        )}
      </header>
    </>
  )
}
