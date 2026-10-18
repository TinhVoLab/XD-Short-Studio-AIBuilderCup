import React from 'react'
import styles from './FeatureMatrix.module.css'
import shared from '../shared.module.css'
import { useEditorStore } from '@/store/useEditorStore'
import type { DynamicPlanConfig } from '@/config/planCatalog'

type Row = { label: string; value: (plan: DynamicPlanConfig) => React.ReactNode }

const Check = () => (
  <span className={styles.yes} aria-label="Có">
    <svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6.5L4.5 9L10 3" />
    </svg>
  </span>
)

const Dash = () => (
  <span className={styles.no} aria-label="Không">
    —
  </span>
)

const limit = (n: number | undefined, unit: string) => {
  if (n === undefined || n === null) return <Dash />
  if (n === -1 || n === Infinity) return 'Không giới hạn'
  return `${n} ${unit}`
}

const flag = (on?: boolean) => (on ? <Check /> : <Dash />)

const videoLength = (p: DynamicPlanConfig) => {
  const q = p.quotas
  if (!q?.maxVideoSec) return <Dash />
  return q.longVideoMaxSec > q.maxVideoSec
    ? `${q.maxVideoSec} giây (${q.maxVideoSec + 1}–${q.longVideoMaxSec} giây tính ${q.longVideoCredits} lượt)`
    : `${q.maxVideoSec} giây`
}

// Mọi ô lấy từ cấu hình gói (planCatalog / Admin), không ghi tay quyền lợi
const GROUPS: { title: string; rows: Row[] }[] = [
  {
    title: 'Xuất video',
    rows: [
      { label: 'Số video mỗi tháng', value: (p) => limit(p.quotas?.monthlyVideoLimit, 'video') },
      { label: 'Độ dài mỗi video', value: videoLength },
      { label: 'Độ phân giải', value: (p) => p.quotas?.maxResolution || <Dash /> },
      { label: 'Không có logo XD-Short', value: (p) => flag(p.features?.removeWatermark) },
      { label: 'Xuất nhiều video cùng lúc', value: (p) => flag(p.features?.batchExport) },
      { label: 'Lưu video để tải lại', value: (p) => limit(p.quotas?.storageRetentionDays, 'ngày') },
    ],
  },
  {
    title: 'AI và âm thanh',
    rows: [
      { label: 'Lượt dùng AI mỗi ngày', value: (p) => limit(p.quotas?.dailyAiLimit, 'lượt') },
      { label: 'Giọng đọc tiếng Việt', value: () => <Check /> },
      { label: 'Nhạc nền Suno và kho hiệu ứng âm thanh', value: (p) => flag(p.features?.sunoAiMusic) },
    ],
  },
  {
    title: 'Hỗ trợ',
    rows: [
      { label: 'Kênh hỗ trợ', value: (p) => p.supportText || <Dash /> },
    ],
  },
]

export const FeatureMatrix: React.FC = () => {
  const { getPlanByTier } = useEditorStore()
  const plans = [getPlanByTier('free'), getPlanByTier('creator'), getPlanByTier('business')]

  return (
    <div id="plan-matrix" className={`${shared.container} ${styles.wrap}`}>
      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Quyền lợi</th>
              {plans.map((p) => (
                <th key={p.id} scope="col">
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GROUPS.map((group) => (
              <React.Fragment key={group.title}>
                <tr className={styles.category}>
                  <th colSpan={4} scope="colgroup">
                    {group.title}
                  </th>
                </tr>
                {group.rows.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    {plans.map((p) => (
                      <td key={p.id}>{row.value(p)}</td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
