import React from 'react'
import styles from './BrandBusNodeCard.module.css'

interface BrandBusNodeCardProps {
  onClick?: () => void
  style?: React.CSSProperties
  className?: string
}

export const BrandBusNodeCard: React.FC<BrandBusNodeCardProps> = ({
  onClick,
  style,
  className
}) => {
  return (
    <div
      className={`${styles.busCard} ${className || ''}`}
      style={style}
      onClick={onClick}
      title="Trạm nhận diện thương hiệu (Master Brand Bus) — Đồng bộ Font, Màu, Chuyển cảnh & Watermark"
    >
      <div className={styles.iconWrap}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      </div>

      <div className={styles.info}>
        <span className={styles.title}>Brand Style Bus</span>
        <span className={styles.sub}>Font • Màu chủ đạo • Khung viền • Chuyển cảnh</span>
      </div>

      {/* Outgoing port towards scenes */}
      <div className={styles.portOut} title="Cổng phát tín hiệu Style xuống các Cảnh" />
    </div>
  )
}

export default BrandBusNodeCard
