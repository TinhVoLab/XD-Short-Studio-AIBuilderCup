import React, { useMemo, useState } from 'react'
import styles from './EmotionHeatBar.module.css'
import { Scene } from '@/types/scene'
import { calculateEmotionHeatData, EmotionHeatPoint } from '../NodeFlow/utils/retentionScorer'

interface EmotionHeatBarProps {
  scenes: Scene[]
  totalDur: number
  currentTimeSec?: number
  height?: number
  showPins?: boolean
  showTooltip?: boolean
  onSeek?: (sec: number) => void
  style?: React.CSSProperties
  className?: string
}

function getScoreColor(score: number, type?: string): string {
  if (type === 'climax' || score >= 88) return '#FF4500'
  if (score >= 82) return '#FFA751'
  if (score >= 76) return '#BEFF01'
  if (score >= 68) return '#00F2FE'
  return '#6E7681'
}

export const EmotionHeatBar: React.FC<EmotionHeatBarProps> = ({
  scenes,
  totalDur,
  height = 3,
  showPins = true,
  showTooltip = true,
  onSeek,
  style,
  className
}) => {
  const [hoverData, setHoverData] = useState<{
    x: number
    sec: number
    score: number
    label?: string
  } | null>(null)

  const heatData = useMemo(() => {
    return calculateEmotionHeatData(scenes)
  }, [scenes])

  // Build CSS linear-gradient stops across totalDur
  const gradientCss = useMemo(() => {
    if (!heatData.points.length || totalDur <= 0) {
      return 'linear-gradient(to right, #00F2FE, #BEFF01, #FF4500)'
    }

    const stops = heatData.points.map((pt: EmotionHeatPoint) => {
      const pct = Math.max(0, Math.min(100, (pt.timeSec / totalDur) * 100))
      const color = getScoreColor(pt.score, pt.type)
      return `${color} ${pct.toFixed(1)}%`
    })

    return `linear-gradient(to right, ${stops.join(', ')})`
  }, [heatData.points, totalDur])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!showTooltip || totalDur <= 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const relX = Math.max(0, Math.min(rect.width, e.clientX - rect.left))
    const ratio = relX / rect.width
    const sec = Number((ratio * totalDur).toFixed(1))

    // Find nearest point
    let closest = heatData.points[0]
    let minDiff = Infinity
    for (const p of heatData.points) {
      const diff = Math.abs(p.timeSec - sec)
      if (diff < minDiff) {
        minDiff = diff
        closest = p
      }
    }

    setHoverData({
      x: relX,
      sec,
      score: closest ? closest.score : 75,
      label: closest?.label
    })
  }

  const handleMouseLeave = () => {
    setHoverData(null)
  }

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek || totalDur <= 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const relX = Math.max(0, Math.min(rect.width, e.clientX - rect.left))
    const sec = (relX / rect.width) * totalDur
    onSeek(sec)
  }

  return (
    <div
      className={`${styles.heatBarContainer} ${className || ''}`}
      style={{ height, ...style }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      title="Thanh nhiệt giữ chân & nhịp cảm xúc (Retention Heatmap)"
    >
      <div className={styles.slimBar}>
        <div
          className={styles.gradientCanvas}
          style={{ background: gradientCss }}
        />
      </div>

      {/* Hotspot Pins at key moments (e.g. Hook Peak, Viral Climax, CTA Boost) */}
      {showPins && totalDur > 0 && heatData.hotSpots.map((spot, i) => {
        const leftPct = Math.max(0, Math.min(100, (spot.timeSec / totalDur) * 100))
        let pinClass = styles.pinDotBuild
        if (spot.type === 'hook') pinClass = styles.pinDotHook
        else if (spot.type === 'climax') pinClass = styles.pinDotClimax
        else if (spot.type === 'cta') pinClass = styles.pinDotCta

        return (
          <div
            key={i}
            className={styles.hotspotPin}
            style={{ left: `${leftPct}%` }}
            onClick={(e) => {
              e.stopPropagation()
              onSeek?.(spot.timeSec)
            }}
            title={`${spot.label}: ${spot.score} điểm (${spot.timeSec}s)`}
          >
            <div className={`${styles.pinDot} ${pinClass}`} />
          </div>
        )
      })}

      {/* Live Tooltip when hovering over the Heat Bar */}
      {hoverData && (
        <div
          className={styles.tooltip}
          style={{ left: `${hoverData.x}px` }}
        >
          <span>{hoverData.sec}s</span>
          {hoverData.label && (
            <span style={{ color: '#BEFF01' }}>{hoverData.label}</span>
          )}
          <span
            className={styles.tooltipScore}
            style={{
              background: getScoreColor(hoverData.score),
              color: '#000'
            }}
          >
            {hoverData.score}đ
          </span>
        </div>
      )}
    </div>
  )
}

export default EmotionHeatBar
