import React, { useState } from 'react'
import styles from './PricingSection.module.css'
import shared from '../shared.module.css'
import { useEditorStore } from '@/store/useEditorStore'
import { TOPUP_PACKS, annualFreeMonths, type DynamicPlanConfig } from '@/config/planCatalog'

interface PricingSectionProps {
  onOpenStudio: () => void
  onSelectPlan: () => void
  onToggleMatrix: () => void
  showMatrix: boolean
}

const formatVND = (val: number) => `${(val || 0).toLocaleString('vi-VN')} ₫`

/** Quyền lợi có thể chứa **đậm** (Admin nhập) — dựng thành <strong>, không dùng innerHTML */
const BulletText: React.FC<{ text: string }> = ({ text }) => (
  <>
    {text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part))}
  </>
)

export const PricingSection: React.FC<PricingSectionProps> = ({ onOpenStudio, onSelectPlan, onToggleMatrix, showMatrix }) => {
  const [isAnnual, setIsAnnual] = useState(true)
  const { getPlanByTier } = useEditorStore()

  // Mọi giá và quyền lợi lấy từ cấu hình gói (planCatalog / Admin)
  const plans: DynamicPlanConfig[] = [getPlanByTier('free'), getPlanByTier('creator'), getPlanByTier('business')]
  const maxFreeMonths = Math.max(...plans.map((p) => annualFreeMonths(p)))
  const topup = TOPUP_PACKS[0]

  return (
    <section id="pricing" className={`${shared.section} ${styles.section}`}>
      <div className={styles.header}>
        <div>
          <div className={shared.eyebrow}>Bảng giá</div>
          <h2 className={shared.h2}>
            Bắt đầu miễn phí.
            <br />
            Nâng cấp khi cần.
          </h2>
        </div>
        <div className={styles.cycle} role="group" aria-label="Chu kỳ thanh toán">
          <button type="button" className={`${styles.seg} ${!isAnnual ? styles.segOn : ''}`} aria-pressed={!isAnnual} onClick={() => setIsAnnual(false)}>
            Theo tháng
          </button>
          <button type="button" className={`${styles.seg} ${isAnnual ? styles.segOn : ''}`} aria-pressed={isAnnual} onClick={() => setIsAnnual(true)}>
            Theo năm
            {maxFreeMonths > 0 && <span className={styles.segBadge}>+{maxFreeMonths} tháng</span>}
          </button>
        </div>
      </div>

      <div className={styles.grid}>
        {plans.map((plan) => {
          const isFree = !plan.pricing.monthlyPrice
          const featured = plan.isFeatured
          const freeMonths = annualFreeMonths(plan)
          const showAnnual = isAnnual && !isFree && plan.pricing.annualUnitPrice > 0
          const price = isFree ? formatVND(0) : formatVND(showAnnual ? plan.pricing.annualUnitPrice : plan.pricing.monthlyPrice)
          const note = isFree
            ? 'Không cần thẻ'
            : showAnnual
              ? `Trả ${formatVND(plan.pricing.annualTotalPayable)} cho 12 tháng${freeMonths > 0 ? ` · tặng ${freeMonths} tháng` : ''}`
              : 'Thanh toán hằng tháng qua VietQR'
          const ctaClass = featured ? shared.btnDark : shared.btnGhost

          return (
            <article
              key={plan.id}
              className={`${styles.card} ${featured ? styles.cardFeatured : isFree ? styles.cardPlain : ''}`}
            >
              <div className={styles.cardHead}>
                <h3 className={styles.planName}>{plan.name}</h3>
                {plan.badgeText && <span className={styles.badge}>{plan.badgeText}</span>}
              </div>
              <p className={styles.target}>{plan.description}</p>

              <div className={styles.priceRow}>
                <span className={styles.price}>{price}</span>
                <span className={styles.per}>/ tháng</span>
                {showAnnual && <span className={styles.strike}>{formatVND(plan.pricing.monthlyPrice)}</span>}
              </div>
              <p className={styles.note}>{note}</p>

              <button
                type="button"
                className={`${ctaClass} ${shared.btnBlock} ${styles.cta}`}
                onClick={isFree ? onOpenStudio : onSelectPlan}
              >
                {isFree ? 'Dùng miễn phí' : `Chọn gói ${plan.name}`}
              </button>

              <ul className={styles.features}>
                {plan.bulletFeatures
                  ?.filter((b) => b.isEnabled)
                  .map((b) => (
                    <li key={b.id}>
                      <BulletText text={b.text} />
                    </li>
                  ))}
              </ul>
            </article>
          )
        })}
      </div>

      <div className={styles.trust}>
        <div className={styles.trustFacts}>
          <span>
            <strong>VietQR</strong> · kích hoạt tự động sau chuyển khoản
          </span>
          <span>Không tự động trừ tiền gia hạn</span>
        </div>
        <div className={styles.trustActions}>
          <span>
            {topup.label} — <strong>{formatVND(topup.price)}</strong>, không hết hạn
          </span>
          <button type="button" className={styles.matrixToggle} onClick={onToggleMatrix} aria-expanded={showMatrix} aria-controls="plan-matrix">
            {showMatrix ? 'Thu gọn bảng so sánh' : 'So sánh chi tiết các gói'}
          </button>
        </div>
      </div>
    </section>
  )
}
