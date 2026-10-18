import React, { useMemo, useRef } from 'react'
import styles from './EmotionHeatGraph.module.css'
import { Scene } from '@/types/scene'
import { calculateEmotionHeatData, EmotionHeatPoint } from '../NodeFlow/utils/retentionScorer'

interface EmotionHeatGraphProps {
  scenes: Scene[]
  totalDur: number
  currentTimeSec?: number
  onSeek?: (sec: number) => void
  style?: React.CSSProperties
  className?: string
}

/**
 * Thuật toán Monotone Spline nội suy đường cong mượt mà theo thời gian.
 * Cam kết 100% không bao giờ bị loop/xoắn ngược trục X.
 */
function buildMonotoneSplinePath(pts: Array<{ x: number; y: number }>): { strokePath: string; areaPath: string } {
  if (!pts || pts.length === 0) return { strokePath: '', areaPath: '' }
  if (pts.length === 1) {
    return {
      strokePath: `M 0 ${pts[0].y.toFixed(1)} L 1000 ${pts[0].y.toFixed(1)}`,
      areaPath: `M 0 ${pts[0].y.toFixed(1)} L 1000 ${pts[0].y.toFixed(1)} L 1000 100 L 0 100 Z`
    }
  }

  // Sắp xếp tăng dần theo X và khử trùng lặp
  const sorted: Array<{ x: number; y: number }> = []
  pts.forEach(p => {
    if (sorted.length === 0 || p.x > sorted[sorted.length - 1].x + 0.1) {
      sorted.push(p)
    }
  })

  const n = sorted.length
  if (n < 2) {
    return {
      strokePath: `M 0 ${sorted[0].y.toFixed(1)} L 1000 ${sorted[0].y.toFixed(1)}`,
      areaPath: `M 0 ${sorted[0].y.toFixed(1)} L 1000 ${sorted[0].y.toFixed(1)} L 1000 100 L 0 100 Z`
    }
  }

  let d = `M ${sorted[0].x.toFixed(1)} ${sorted[0].y.toFixed(1)}`

  for (let i = 0; i < n - 1; i++) {
    const p1 = sorted[i]
    const p2 = sorted[i + 1]
    const dx = p2.x - p1.x

    const prev = sorted[Math.max(0, i - 1)]
    const next = sorted[Math.min(n - 1, i + 2)]

    // Tính độ dốc (slope)
    const m1 = (p2.y - prev.y) / Math.max(1, p2.x - prev.x)
    const m2 = (next.y - p1.y) / Math.max(1, next.x - p1.x)

    // Điểm điều khiển X cố định tỉ lệ 38% để không bao giờ bị võng lùi X
    const cp1x = p1.x + dx * 0.38
    const cp1y = Math.max(8, Math.min(96, p1.y + m1 * dx * 0.38))

    const cp2x = p2.x - dx * 0.38
    const cp2y = Math.max(8, Math.min(96, p2.y - m2 * dx * 0.38))

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }

  const lastX = sorted[n - 1].x
  const strokePath = d
  const areaPath = `${d} L ${lastX.toFixed(1)} 100 L ${sorted[0].x.toFixed(1)} 100 Z`
  return { strokePath, areaPath }
}

export const EmotionHeatGraph: React.FC<EmotionHeatGraphProps> = ({
  scenes,
  totalDur,
  currentTimeSec = 0,
  onSeek,
  style,
  className
}) => {
  const chartRef = useRef<HTMLDivElement>(null)

  const heatData = useMemo(() => {
    return calculateEmotionHeatData(scenes)
  }, [scenes])

  // Ánh xạ toạ độ SVG (0..1000 x 0..100) với biên độ đỉnh đáy giãn nở sâu sắc
  const svgCoords = useMemo(() => {
    if (!heatData.points.length || totalDur <= 0) return []
    return heatData.points.map((pt: EmotionHeatPoint) => {
      const x = (pt.timeSec / totalDur) * 1000
      // Điểm số từ 50 đến 94 được map từ Y=84 (đáy sâu) đến Y=16 (đỉnh cao)
      const clampedScore = Math.max(50, Math.min(94, pt.score))
      const y = 84 - ((clampedScore - 50) / 44) * 68
      return { x, y, pt }
    })
  }, [heatData.points, totalDur])

  const { strokePath, areaPath } = useMemo(() => {
    return buildMonotoneSplinePath(svgCoords.map(c => ({ x: c.x, y: c.y })))
  }, [svgCoords])

  // Tạo 5 mốc thời gian dọc trục X
  const timeTicks = useMemo(() => {
    if (totalDur <= 0) return ['0s', '3s', '6s', '9s', '12s']
    const count = 5
    const ticks: string[] = []
    for (let i = 0; i <= count; i++) {
      const sec = Number(((totalDur * i) / count).toFixed(1))
      ticks.push(`${sec}s`)
    }
    return ticks
  }, [totalDur])

  const handleChartClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek || !chartRef.current || totalDur <= 0) return
    const rect = chartRef.current.getBoundingClientRect()
    const relX = Math.max(0, Math.min(rect.width, e.clientX - rect.left))
    const sec = (relX / rect.width) * totalDur
    onSeek(sec)
  }

  const playheadPct = totalDur > 0 ? Math.max(0, Math.min(100, (currentTimeSec / totalDur) * 100)) : 0

  return (
    <div className={`${styles.graphWrapper} ${className || ''}`} style={style}>
      {/* 1. Hàng Tiêu đề & Chú thích Legend */}
      <div className={styles.headerRow}>
        <span className={styles.title}>Emotion Heat Timeline</span>

        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: '#FFB800' }} />
            <span>Hook Peak</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: '#00D8F6' }} />
            <span>Main Story</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: '#FF3366' }} />
            <span>CTA Boost</span>
          </div>
        </div>
      </div>

      {/* 2. Đồ thị Sóng Cảm xúc có chiều cong uốn lượn sâu sắc */}
      <div className={styles.canvasArea} onClick={handleChartClick}>
        {/* Trục Y: High / Low */}
        <div className={styles.yAxis}>
          <span>High</span>
          <span>Low</span>
        </div>

        {/* Khung chứa SVG Spline Graph */}
        <div ref={chartRef} className={styles.chartContainer}>
          <svg className={styles.svgChart} viewBox="0 0 1000 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="heatAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#BEFF01" stopOpacity="0.36" />
                <stop offset="50%" stopColor="#00D8F6" stopOpacity="0.14" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Lưới ngang mờ chuẩn studio */}
            <line x1="0" y1="20" x2="1000" y2="20" className={styles.gridLine} />
            <line x1="0" y1="50" x2="1000" y2="50" className={styles.gridLine} />
            <line x1="0" y1="80" x2="1000" y2="80" className={styles.gridLine} />

            {/* Lưới dọc */}
            <line x1="200" y1="0" x2="200" y2="100" className={styles.gridLine} />
            <line x1="400" y1="0" x2="400" y2="100" className={styles.gridLine} />
            <line x1="600" y1="0" x2="600" y2="100" className={styles.gridLine} />
            <line x1="800" y1="0" x2="800" y2="100" className={styles.gridLine} />

            {/* Mảng bóng gradient dưới sóng */}
            {areaPath && <path d={areaPath} className={styles.waveArea} />}

            {/* Đường cong sóng Monotone Spline */}
            {strokePath && <path d={strokePath} className={styles.waveStroke} />}

            {/* Đường kim đứt nét từ đỉnh sóng xuống đáy */}
            {totalDur > 0 && heatData.hotSpots.map((spot, i) => {
              const x = (spot.timeSec / totalDur) * 1000
              const clampedScore = Math.max(50, Math.min(94, spot.score))
              const y = 84 - ((clampedScore - 50) / 44) * 68
              const pinColor = spot.type === 'hook' ? '#FFB800' : (spot.type === 'climax' ? '#FF3366' : '#00D8F6')

              return (
                <g key={`pin-${i}`}>
                  <line
                    x1={x}
                    y1={y}
                    x2={x}
                    y2="100"
                    stroke={pinColor}
                    className={styles.peakPinLine}
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r="4"
                    fill={pinColor}
                    stroke="#080a0f"
                    strokeWidth="1.5"
                  />
                </g>
              )
            })}
          </svg>

          {/* Các thẻ ghim thông minh nổi bật trên đỉnh sóng */}
          {totalDur > 0 && heatData.hotSpots.map((spot, i) => {
            const leftPct = (spot.timeSec / totalDur) * 100
            const clampedScore = Math.max(50, Math.min(94, spot.score))
            const topPct = 84 - ((clampedScore - 50) / 44) * 68

            let dotColor = '#FFB800'
            let label = spot.label
            if (spot.type === 'hook') {
              dotColor = '#FFB800'
              label = 'Hook Peak'
            } else if (spot.type === 'climax') {
              dotColor = '#FF3366'
              label = 'Data Shock'
            } else if (spot.type === 'cta') {
              dotColor = '#00D8F6'
              label = 'CTA Boost'
            }

            return (
              <div
                key={`badge-${i}`}
                className={styles.badgeCard}
                style={{
                  left: `${leftPct}%`,
                  top: `${Math.max(12, topPct)}%`
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  onSeek?.(spot.timeSec)
                }}
                title={`${label}: ${spot.score} điểm (${spot.timeSec}s)`}
              >
                <div className={styles.badgeBox}>
                  <span className={styles.badgeDot} style={{ background: dotColor }} />
                  <span className={styles.badgeLabel}>{label}</span>
                  <span
                    className={styles.badgeScore}
                    style={{ background: `${dotColor}25`, color: dotColor }}
                  >
                    {spot.score}
                  </span>
                </div>
              </div>
            )
          })}

          {/* Vạch Playhead theo thời gian thực */}
          {totalDur > 0 && (
            <div
              className={styles.playheadNeedle}
              style={{ left: `${playheadPct}%` }}
            >
              <div className={styles.playheadDot} />
            </div>
          )}
        </div>

        {/* Trục thời gian X */}
        <div className={styles.xAxis}>
          {timeTicks.map((tick, i) => (
            <span key={i}>{tick}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default EmotionHeatGraph
