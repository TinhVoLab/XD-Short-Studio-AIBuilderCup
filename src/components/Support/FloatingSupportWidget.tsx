import React, { useState } from 'react'
import styles from './FloatingSupportWidget.module.css'
import { COMPANY_PAYMENT_INFO } from '@/config/payment'

export const FloatingSupportWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopyHotline = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(COMPANY_PAYMENT_INFO.supportHotline)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={styles.container}>
      {isOpen && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.titleGroup}>
              <span className={styles.title}>Hỗ Trợ & Kích Hoạt</span>
              <span className={styles.statusTag}>
                <span className={styles.statusDot} />
                Trực tuyến 24/7
              </span>
            </div>
            <button
              className={styles.closeBtn}
              onClick={() => setIsOpen(false)}
              aria-label="Đóng"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <path d="M2 2L12 12M12 2L2 12" />
              </svg>
            </button>
          </div>

          <p className={styles.desc}>
            Cần tư vấn gói Pro, gửi hóa đơn kích hoạt hoặc hỗ trợ kỹ thuật dựng video? Đội ngũ hỗ trợ phản hồi ngay trong 3 - 5 phút.
          </p>

          <div className={styles.hotlineBox}>
            <span className={styles.hotlineVal}>{COMPANY_PAYMENT_INFO.supportHotline}</span>
            <button className={styles.copyBtn} onClick={handleCopyHotline}>
              {copied ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#3fb950" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M2.5 6L4.5 8L9.5 3" />
                  </svg>
                  <span style={{ color: '#3fb950' }}>Đã chép</span>
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4">
                    <rect x="3.5" y="3.5" width="6" height="6" rx="1.5" />
                    <path d="M2.5 8.5H2A1.5 1.5 0 01.5 7V2A1.5 1.5 0 012 .5h5A1.5 1.5 0 018.5 2v.5" />
                  </svg>
                  <span>Sao chép</span>
                </>
              )}
            </button>
          </div>

          <div className={styles.actions}>
            <a
              href={COMPANY_PAYMENT_INFO.supportZalo}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.zaloLinkBtn}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M14.5 7.8c0 3.8-3.3 6.9-7.5 6.9-1.2 0-2.4-.3-3.4-.8L1 14.8l1.1-2.4C1.5 11.2 1 9.6 1 7.8 1 4 4.3.9 8.5.9s7.5 3.1 7.5 6.9z" fill="#000" />
              </svg>
              Chat Zalo Trực Tiếp
            </a>
            <a
              href={`tel:${COMPANY_PAYMENT_INFO.supportHotline}`}
              className={styles.callLinkBtn}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.8 10.4v2a1.3 1.3 0 01-1.4 1.3A12.7 12.7 0 01.3 2.6 1.3 1.3 0 011.6 1.2h2a1.3 1.3 0 011.3 1.1c.1.9.4 1.7.7 2.4.2.4.1.8-.2 1.1L4.3 6.9a10.2 10.2 0 004.8 4.8l1.1-1.1c.3-.3.7-.4 1.1-.2.7.3 1.5.6 2.4.7a1.3 1.3 0 011.1 1.3z" />
              </svg>
              Gọi Hotline Tư Vấn
            </a>
          </div>
        </div>
      )}

      <button
        className={styles.triggerBtn}
        onClick={() => setIsOpen(!isOpen)}
        title="Hỗ trợ & Kích hoạt bản quyền Zalo"
        aria-label="Mở cửa sổ hỗ trợ"
      >
        <span className={styles.pulseRing} />
        {isOpen ? (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 3L15 15M15 3L3 15" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        )}
      </button>
    </div>
  )
}
