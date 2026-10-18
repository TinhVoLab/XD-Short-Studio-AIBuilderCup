import React from 'react'
import styles from './FinalCta.module.css'
import shared from '../shared.module.css'
import { LandingLogo, ArrowRightIcon } from './primitives'
import { useEditorStore } from '@/store/useEditorStore'
import { COMPANY_PAYMENT_INFO } from '@/config/payment'
import { LegalTab } from '@/components/Legal/LegalModal'

interface FinalCtaProps {
  onOpenStudio: () => void
  onScrollTo: (id: string) => void
  onOpenLegal?: (tab: LegalTab) => void
}

const LEGAL_LINKS: { tab: LegalTab; label: string }[] = [
  { tab: 'terms', label: 'Điều khoản dịch vụ' },
  { tab: 'privacy', label: 'Chính sách bảo mật' },
  { tab: 'license', label: 'Chính sách giấy phép' },
  { tab: 'refund', label: 'Kích hoạt và hoàn tiền' },
]

const SOCIAL = [
  {
    label: 'TikTok',
    href: 'https://tiktok.com/@xdshort',
    path: 'M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003 15.28 6.34 6.34 0 009.34 21.6a6.34 6.34 0 006.34-6.32V8.92a8.28 8.28 0 004.8 1.51V6.99c-.31-.03-.6-.13-.89-.3z',
  },
  {
    label: 'YouTube',
    href: 'https://youtube.com/@xdshort',
    path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  },
  {
    label: 'Facebook',
    href: 'https://facebook.com/xdshort',
    path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  },
]

export const FinalCta: React.FC<FinalCtaProps> = ({ onOpenStudio, onScrollTo, onOpenLegal }) => {
  const freeLimit = useEditorStore((s) => s.getPlanByTier('free').quotas?.monthlyVideoLimit)

  const scrollLink = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    onScrollTo(id)
  }

  return (
    <>
      <section className={shared.section}>
        <div className={styles.box}>
          <div className={`${shared.glow} ${styles.glow}`} aria-hidden="true" />
          <div className={shared.grain} aria-hidden="true" />
          <h2 className={styles.title}>
            Video đầu tiên của bạn
            <br />
            <span className={`${shared.serif} ${shared.accent}`}>chỉ cách một câu.</span>
          </h2>
          <p className={styles.text}>
            {typeof freeLimit === 'number' && freeLimit > 0 ? `${freeLimit} video miễn phí mỗi tháng. ` : ''}Không cần thẻ.
          </p>
          <button type="button" className={`${shared.btnAccent} ${shared.btnLg} ${styles.cta}`} onClick={onOpenStudio}>
            Tạo video miễn phí
            <ArrowRightIcon />
          </button>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.grid}>
          <div className={styles.brand}>
            <LandingLogo />
            <p className={styles.about}>Công cụ AI tạo video ngắn tiếng Việt cho creator, KOC, marketer và agency nhỏ.</p>
            <div className={styles.social}>
              {SOCIAL.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <nav className={styles.col} aria-label="Sản phẩm">
            <span className={styles.colTitle}>Sản phẩm</span>
            <button type="button" className={styles.link} onClick={onOpenStudio}>
              Mở Studio
            </button>
            <a className={styles.link} href="#how" onClick={scrollLink('how')}>
              Cách hoạt động
            </a>
            <a className={styles.link} href="#pricing" onClick={scrollLink('pricing')}>
              Bảng giá
            </a>
          </nav>

          <nav className={styles.col} aria-label="Hỗ trợ">
            <span className={styles.colTitle}>Hỗ trợ</span>
            <a className={styles.link} href="#faq" onClick={scrollLink('faq')}>
              Câu hỏi thường gặp
            </a>
            <a className={styles.link} href={COMPANY_PAYMENT_INFO.supportZalo} target="_blank" rel="noreferrer">
              Zalo {COMPANY_PAYMENT_INFO.supportHotline}
            </a>
          </nav>

          <nav className={`${styles.col} ${styles.colWide}`} aria-label="Pháp lý">
            <span className={styles.colTitle}>Pháp lý</span>
            {LEGAL_LINKS.map((l) => (
              <button key={l.tab} type="button" className={styles.link} onClick={() => onOpenLegal?.(l.tab)}>
                {l.label}
              </button>
            ))}
          </nav>
        </div>

        <div className={styles.bottom}>
          <span>© 2026 XD-short Studio. Bản quyền thuộc về {COMPANY_PAYMENT_INFO.companyName}.</span>
          <span>Xây dựng trên Gemini, Google Cloud Run và Firebase</span>
        </div>
      </footer>
    </>
  )
}
