import { RemotionElementWrapper } from '../core/RemotionElementWrapper';
import React, { useMemo } from 'react'
import { Easing } from 'remotion'
import { ElementProps } from '../types'
import { mixColor } from '../../utils/rich-text-parser'

const DEFAULT_RADAR_DATA = [
  { label: 'Hiệu năng', value: 92 },
  { label: 'Bảo mật', value: 85 },
  { label: 'Dễ học', value: 78 },
  { label: 'Cộng đồng', value: 95 },
  { label: 'Chi phí', value: 65 },
]

export const RadarChartElement: React.FC<ElementProps & { 
  frame: number; 
  fps: number; 
  delayFrames?: number; 
  durFrames?: number; 
}> = ({ 
  el, 
  computedStyle, positionStyle, frame, 
  delayFrames = 0, 
  durFrames = 45 
}) => {
  const containerWidth = el.width || 340
  const containerHeight = el.height || 280
  const accentColor = el.accentColor || 'var(--accent)'
  const title = (el.content !== undefined && el.content !== null) ? el.content.trim() : ''
  const hasTitle = Boolean(title)

  const rawData = useMemo(() => {
    return el.chartData && el.chartData.length >= 3
      ? el.chartData
      : DEFAULT_RADAR_DATA
  }, [el.chartData])

  // Center & Geometry
  const headerHeight = hasTitle ? 32 : 0
  const cx = containerWidth / 2
  const cy = hasTitle ? headerHeight + (containerHeight - headerHeight) / 2 : containerHeight / 2
  const maxRadius = hasTitle
    ? Math.min(containerWidth * 0.28, (containerHeight - headerHeight) * 0.32)
    : Math.min(containerWidth * 0.34, containerHeight * 0.35)
  const sides = rawData.length

  const { rings, spokes } = useMemo(() => {
    const ringLevels = [0.25, 0.5, 0.75, 1.0]
    
    // Concentric Web Polygon Rings
    const ringPaths = ringLevels.map(level => {
      const r = maxRadius * level
      const pts = rawData.map((_, i) => {
        const angle = (Math.PI * 2 * i) / sides - Math.PI / 2
        return `${(cx + Math.cos(angle) * r).toFixed(1)},${(cy + Math.sin(angle) * r).toFixed(1)}`
      })
      return pts.join(' ')
    })

    // Radial Spokes
    const spokeLines = rawData.map((_, i) => {
      const angle = (Math.PI * 2 * i) / sides - Math.PI / 2
      return {
        x1: cx,
        y1: cy,
        x2: cx + Math.cos(angle) * maxRadius,
        y2: cy + Math.sin(angle) * maxRadius,
        angle,
      }
    })

    return {
      rings: ringPaths,
      spokes: spokeLines,
    }
  }, [rawData, cx, cy, maxRadius, sides])

  // Animation Progress
  const progress = Math.min(1, Math.max(0, (frame - delayFrames) / (durFrames || 45)))
  const easeProgress = Easing.out(Easing.back(1.4))(progress)

  const { polygonPath, points } = useMemo(() => {
    const pts = rawData.map((d, i) => {
      const angle = (Math.PI * 2 * i) / sides - Math.PI / 2
      const val = Math.min(100, Math.max(0, Number(d.value) || 0)) / 100
      const animatedVal = val * Math.max(0, easeProgress)

      const x = cx + Math.cos(angle) * maxRadius * animatedVal
      const y = cy + Math.sin(angle) * maxRadius * animatedVal

      // Outer label distance
      const labelDist = maxRadius + 20
      const lx = cx + Math.cos(angle) * labelDist
      const ly = cy + Math.sin(angle) * labelDist

      const cosA = Math.cos(angle)
      const sinA = Math.sin(angle)
      const textAnchor = Math.abs(cosA) < 0.25 ? 'middle' : cosA > 0 ? 'start' : 'end'

      // Slight Y offset for top/bottom nodes
      const yOffset = sinA < -0.8 ? -4 : sinA > 0.8 ? 8 : 0

      return {
        x,
        y,
        lx,
        ly: ly + yOffset,
        textAnchor,
        label: d.label,
        value: d.value,
      }
    })

    const poly = pts.map((p, i) => (i === 0 ? `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}` : `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)).join(' ') + ' Z'

    return {
      polygonPath: poly,
      points: pts,
    }
  }, [rawData, sides, easeProgress, cx, cy, maxRadius])

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      <div 
        style={{ 
          width: containerWidth,
          height: containerHeight,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          backgroundColor: el.showCardBg ? (el.bgColor || 'var(--card-bg, rgba(14, 18, 28, 0.94))') : (el.bgColor || 'transparent'),
          border: el.showCardBg ? `1px solid ${mixColor(accentColor, 27)}` : 'none',
          borderRadius: el.radius !== undefined ? el.radius : 16,
          boxShadow: el.showCardBg ? `var(--shadow-md, 0 8px 32px rgba(0,0,0,0.5)), 0 0 20px ${mixColor(accentColor, 8)}` : 'none',
          boxSizing: 'border-box',
          position: 'relative',
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        {/* Standard Studio Header Bar (Chỉ hiển thị khi có tiêu đề) */}
        {hasTitle && (
          <div 
            style={{
              width: '100%',
              height: headerHeight,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '0 14px',
              borderBottom: '1px solid var(--border)',
              boxSizing: 'border-box',
              zIndex: 5,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
            <span style={{
              fontSize: 11,
              fontWeight: 800,
              color: 'var(--chart-label, var(--text))',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flex: 1,
              fontFamily: el.fontFamily || 'Be Vietnam Pro',
            }}>
              {title}
            </span>
          </div>
        )}

        {/* Spacious Hologram Radar SVG Canvas */}
        <svg 
          width={containerWidth} 
          height={containerHeight} 
          style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
        >
        <defs>
          <linearGradient id={`radar-grad-${el.id || 'default'}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--chart-series-1, #BEFF01)" stopOpacity="0.18" />
          </linearGradient>
        </defs>

        {/* Concentric Web Polygon Rings */}
        {rings.map((rPath, idx) => (
          <polygon
            key={`ring-${idx}`}
            points={rPath}
            fill={idx % 2 === 0 ? mixColor(accentColor, 4) : 'none'}
            stroke="var(--chart-grid, rgba(255,255,255,0.2))"
            strokeWidth="1.2"
            strokeDasharray={idx < 3 ? '4 4' : 'none'}
          />
        ))}

        {/* Radial Spokes Lines */}
        {spokes.map((spk, idx) => (
          <line
            key={`spk-${idx}`}
            x1={spk.x1}
            y1={spk.y1}
            x2={spk.x2}
            y2={spk.y2}
            stroke="var(--chart-axis, rgba(255,255,255,0.24))"
            strokeWidth="1.2"
          />
        ))}

        {/* Outer Glow Stroke (Zero Compute) */}
        <path
          d={polygonPath}
          fill="none"
          stroke={accentColor}
          strokeWidth="6"
          strokeLinejoin="round"
          opacity="0.3"
        />

        {/* Animated Value Area Polygon */}
        <path
          d={polygonPath}
          fill={`url(#radar-grad-${el.id || 'default'})`}
          stroke={accentColor}
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* Vertex Points & Large Labels */}
        {points.map((pt, idx) => (
          <g key={`pt-${idx}`}>
            {/* Vertex Node Glow */}
            <circle cx={pt.x} cy={pt.y} r="7" fill={accentColor} opacity="0.4" />
            <circle cx={pt.x} cy={pt.y} r="3.8" fill="var(--text, #FFFFFF)" stroke={accentColor} strokeWidth="2" />

            {/* Axis Label Text */}
            <text
              x={pt.lx}
              y={pt.ly - 5}
              fill="var(--chart-label, var(--text))"
              fontSize="11"
              fontWeight="800"
              fontFamily="Be Vietnam Pro, sans-serif"
              textAnchor={pt.textAnchor as any}
              dominantBaseline="central"
            >
              {pt.label}
            </text>

            {/* Axis Score Subtext */}
            <text
              x={pt.lx}
              y={pt.ly + 8}
              fill="var(--text-sub)"
              fontSize="10.5"
              fontWeight="900"
              fontFamily="Inter, sans-serif"
              textAnchor={pt.textAnchor as any}
              dominantBaseline="central"
            >
              {pt.value}%
            </text>
          </g>
        ))}
      </svg>
    </div>
    </RemotionElementWrapper>
  )
}
