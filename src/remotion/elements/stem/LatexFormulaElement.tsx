import React, { useMemo } from 'react'
import { useCurrentFrame, interpolate, Easing, Audio, Sequence, staticFile } from 'remotion'
import { renderLatexHtml } from '@/utils/stem/latex'
import 'katex/dist/katex.min.css'
import { SceneElement } from '@/types/scene'
import { LatexFormulaData } from '@/types/stem'
import { RemotionElementWrapper } from '../core/RemotionElementWrapper'
import { mixColor } from '../../utils/rich-text-parser'
import { isNeutralTextColor } from '@/config/themePalettes'

interface LatexFormulaElementProps {
  el: SceneElement
  computedStyle?: React.CSSProperties
  positionStyle?: React.CSSProperties
  fps?: number
  sceneDuration?: number
}

export const LatexFormulaElement: React.FC<LatexFormulaElementProps> = ({
  el,
  computedStyle,
  positionStyle,
  fps = 30,
}) => {
  const frame = useCurrentFrame()

  const data: LatexFormulaData = el.latexData || {
    latex: 'E = mc^2',
    fontSize: 26,
    color: 'var(--text)',
    displayMode: true,
    showBackground: true,
    title: 'Năng lượng tương đối tính',
    animMode: 'write-on',
    animDuration: 2.0,
    sfxEnabled: true,
  }

  // Trắng/đen thuần là màu preset mặc định (elementsRegistry) chứ không phải lựa chọn thương hiệu → theo
  // token chữ của theme, để công thức không biến mất trên theme sáng.
  const rawColor = data.color || el.fill
  const color = !rawColor || isNeutralTextColor(rawColor) ? 'var(--text)' : rawColor
  const fontSize = data.fontSize || 26
  const displayMode = data.displayMode !== false
  const showBackground = data.showBackground !== false
  const animMode = data.animMode || 'write-on'
  const animDurationSec = Math.max(0.5, data.animDuration ?? 2.0)
  const durFrames = Math.round(animDurationSec * fps)
  const sfxEnabled = data.sfxEnabled !== false

  // ── 1. Write-on Animation (Left-to-Right Reveal with Stylus Cursor) ──
  const writeProgress = animMode === 'write-on'
    ? interpolate(frame, [0, durFrames], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    : 1

  // ── 2. Laser Scan Shimmer Beam ──
  const scanCycleFrames = Math.max(1, Math.round(animDurationSec * fps))
  const scanProgress = animMode === 'laser-scan' ? (frame % scanCycleFrames) / scanCycleFrames : 0
  const laserX = interpolate(scanProgress, [0, 1], [-30, 130])

  // ── 3. Pulse Glow (Sinusoidal Breathing) ──
  const pulse = animMode === 'pulse-glow' ? Math.sin(frame * 0.09) : 0
  const pulseScale = animMode === 'pulse-glow' ? 1 + pulse * 0.035 : 1

  // KaTeX qua module dùng chung (cùng tuỳ chọn với canvas/Inspector); sai → null → ẩn, không in lỗi đỏ vào video
  const htmlContent = useMemo(() => renderLatexHtml(data.latex || '', { displayMode }), [data.latex, displayMode])
  if (!htmlContent) return null

  const width = Math.max(100, el.width || 360)
  const height = Math.max(60, el.height || 140)

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      {/* ── Auto-SFX Synchronized Audio Sequences ── */}
      {sfxEnabled && animMode === 'write-on' && (
        <Sequence from={0} durationInFrames={Math.max(1, durFrames)}>
          <Audio src={staticFile('sfx/marker.wav')} volume={0.45} />
        </Sequence>
      )}

      <div
        style={{
          width,
          height,
          borderRadius: 12,
          overflow: 'hidden',
          background: showBackground ? 'var(--card-bg)' : 'transparent',
          border: showBackground ? '1px solid var(--border)' : 'none',
          boxShadow: showBackground
            ? `var(--shadow-md, 0 8px 32px rgba(0, 0, 0, 0.5)), 0 0 16px ${mixColor(color, 13)}`
            : undefined,
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {/* Title Header if present */}
        {(data.title || (data.badge && data.badge.trim())) && (
          <div
            style={{
              padding: '6px 12px',
              background: 'var(--surface-1)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <span style={{ color: 'var(--text-sub, #8b949e)', fontSize: 11, fontWeight: 600 }}>
              {data.title || ''}
            </span>
            {data.badge && data.badge.trim() && (
              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: 'color-mix(in srgb, var(--accent, #BEFF01) 15%, transparent)',
                  color: 'var(--accent, #BEFF01)',
                  letterSpacing: '0.04em',
                }}
              >
                {data.badge.trim().toUpperCase()}
              </span>
            )}
          </div>
        )}

        {/* KaTeX Math container */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 16px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              maxWidth: '100%',
              clipPath: animMode === 'write-on' ? `inset(0 ${(1 - writeProgress) * 100}% 0 0)` : undefined,
              transform: animMode === 'pulse-glow' ? `scale(${pulseScale})` : undefined,
              filter: animMode === 'pulse-glow' ? `drop-shadow(0 0 ${(pulse + 1) * 8}px ${color})` : undefined,
            }}
          >
            <div
              style={{
                color,
                fontSize: `${fontSize}px`,
                textShadow: data.glow ? `0 0 12px ${mixColor(color, 53)}` : undefined,
                userSelect: 'none',
              }}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />

            {/* Glowing Stylus Cursor for write-on */}
            {animMode === 'write-on' && writeProgress > 0 && writeProgress < 0.995 && (
              <div
                style={{
                  position: 'absolute',
                  top: '5%',
                  bottom: '5%',
                  left: `${writeProgress * 100}%`,
                  width: 3,
                  borderRadius: 2,
                  background: 'var(--text, #FFFFFF)',
                  boxShadow: `0 0 8px ${color}, 0 0 16px ${color}, 0 0 24px color-mix(in srgb, ${color} 40%, transparent)`,
                  pointerEvents: 'none',
                  transform: 'translateX(-50%)',
                  zIndex: 5,
                }}
              >
                {/* Pulsing stylus nib */}
                <div
                  style={{
                    position: 'absolute',
                    top: -2,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: 'var(--text, #FFFFFF)',
                    boxShadow: `0 0 10px ${color}`,
                  }}
                />
              </div>
            )}

            {/* Laser Scan Shimmer Beam */}
            {animMode === 'laser-scan' && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${laserX}%`,
                  width: '28%',
                  background: `linear-gradient(90deg, transparent 0%, ${mixColor(color, 20)} 40%, color-mix(in srgb, var(--text) 60%, transparent) 60%, transparent 100%)`,
                  pointerEvents: 'none',
                  transform: 'skewX(-20deg) translateX(-50%)',
                  filter: `drop-shadow(0 0 10px ${color})`,
                  zIndex: 4,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </RemotionElementWrapper>
  )
}
