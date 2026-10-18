import React from 'react'
import styles from './FlowHealthWidget.module.css'
import { FlowHealthMetrics } from './utils/retentionScorer'

interface FlowHealthWidgetProps {
  metrics: FlowHealthMetrics
  onClickMetric?: (metricKey: 'retention' | 'pacing' | 'clarity' | 'engagement') => void
  style?: React.CSSProperties
  className?: string
}

export const FlowHealthWidget: React.FC<FlowHealthWidgetProps> = ({
  metrics,
  onClickMetric,
  style,
  className
}) => {
  const radius = 8
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (metrics.score / 100) * circumference

  let scoreColor = '#BEFF01'
  if (metrics.grade === 'Viral') scoreColor = '#BEFF01'
  else if (metrics.grade === 'Fair') scoreColor = '#FFA751'

  return (
    <div
      className={`${styles.widget} ${className || ''}`}
      style={style}
      title={`Điểm chất lượng kịch bản: ${metrics.score}/100 (${metrics.grade})`}
    >
      <div className={styles.scoreCircle}>
        <svg className={styles.circleSvg} viewBox="0 0 20 20">
          <circle
            className={styles.circleBg}
            cx="10"
            cy="10"
            r={radius}
          />
          <circle
            className={styles.circleProgress}
            cx="10"
            cy="10"
            r={radius}
            stroke={scoreColor}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <span className={styles.scoreNumber}>{metrics.score}</span>
      </div>

      <div className={styles.metricsList}>
        <div
          className={styles.metricRow}
          onClick={() => onClickMetric?.('retention')}
          style={{ cursor: onClickMetric ? 'pointer' : 'default' }}
          title="Tỷ lệ giữ chân người xem dự đoán"
        >
          <span className={styles.metricDot} style={{ background: '#BEFF01' }} />
          <span className={styles.metricLabel}>Giữ chân:</span>
          <span className={styles.metricValue}>{metrics.retentionPct}%</span>
        </div>

        <div
          className={styles.metricRow}
          onClick={() => onClickMetric?.('pacing')}
          style={{ cursor: onClickMetric ? 'pointer' : 'default' }}
          title="Nhịp độ cắt dựng & chuyển cảnh"
        >
          <span className={styles.metricDot} style={{ background: '#00F2FE' }} />
          <span className={styles.metricLabel}>Nhịp độ:</span>
          <span className={styles.metricValue}>{metrics.pacingPct}%</span>
        </div>

        <div
          className={styles.metricRow}
          onClick={() => onClickMetric?.('clarity')}
          style={{ cursor: onClickMetric ? 'pointer' : 'default' }}
          title="Độ rõ ràng của thông điệp"
        >
          <span className={styles.metricDot} style={{ background: '#A855F7' }} />
          <span className={styles.metricLabel}>Rõ ràng:</span>
          <span className={styles.metricValue}>{metrics.clarityPct}%</span>
        </div>

        <div
          className={styles.metricRow}
          onClick={() => onClickMetric?.('engagement')}
          style={{ cursor: onClickMetric ? 'pointer' : 'default' }}
          title="Kích thích tương tác"
        >
          <span className={styles.metricDot} style={{ background: '#FF3366' }} />
          <span className={styles.metricLabel}>Tương tác:</span>
          <span className={styles.metricValue}>{metrics.engagementPct}%</span>
        </div>
      </div>
    </div>
  )
}

export default FlowHealthWidget
