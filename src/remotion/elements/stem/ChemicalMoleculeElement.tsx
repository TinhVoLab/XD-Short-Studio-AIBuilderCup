import React, { useMemo } from 'react'
import { useCurrentFrame, interpolate, Easing } from 'remotion'
import { SceneElement } from '@/types/scene'
import { resolveThemePalette } from '@/utils/themeResolver'
import { RemotionElementWrapper } from '../core/RemotionElementWrapper'
import { mixColor } from '../../utils/rich-text-parser'
import { renderMoleculeSvg } from '@/utils/stem/moleculeSvg'

interface ChemicalMoleculeElementProps {
  el: SceneElement
  computedStyle?: React.CSSProperties
  positionStyle?: React.CSSProperties
  fps?: number
  frame?: number
}

export const ChemicalMoleculeElement: React.FC<ChemicalMoleculeElementProps> = ({
  el,
  computedStyle,
  positionStyle,
}) => {
  const frame = useCurrentFrame()

  const data = el.chemData || {
    smiles: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C',
    name: 'Caffein',
    formula: 'C8H10N4O2',
    theme: 'neon',
    bondThickness: 2.2,
    showFormula: true,
    showName: true,
    animMode: 'all',
    animSpeed: 1.0,
    pulseGlow: true,
  }

  const width = Math.max(140, el.width || 340)
  const height = Math.max(100, el.height || 260)
  const showHeader = Boolean(data.showName !== false && (data.name || data.formula))
  const headerHeight = showHeader ? 38 : 0
  const subtextHeight = data.subtext ? 24 : 0
  const contentHeight = Math.max(60, height - headerHeight - subtextHeight)

  const palette = resolveThemePalette(el)
  // Thẻ lab luôn nền tối → 'auto' luôn chọn bảng màu nguyên tử sáng (bảng 'light' chữ tối sẽ chìm trên nền tối)
  const effectiveTheme = data.theme && data.theme !== 'auto' ? data.theme : 'neon'
  const accentColor = el.accentColor || palette.tokens.accent || 'var(--accent, #BEFF01)'

  // ── Remotion Motion Engine ──────────────────────────────────────────
  const animMode = data.animMode ?? 'all'
  const animSpeed = Math.max(0.2, Math.min(3.0, data.animSpeed ?? 1.0))
  const pulseGlow = data.pulseGlow !== false

  // 1. Molecular Synthesis (Write-on lines & pop-in atoms)
  const assemblyFrames = Math.max(12, Math.round(28 / animSpeed))
  const isAssemblyEnabled = animMode === 'all' || animMode === 'draw'

  const drawProgress = isAssemblyEnabled
    ? interpolate(frame, [0, assemblyFrames], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.cubic),
      })
    : 1

  const bondDashOffset = Math.round((1 - drawProgress) * 90)

  const atomPopProgress = isAssemblyEnabled
    ? interpolate(frame, [Math.round(assemblyFrames * 0.35), assemblyFrames], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.back(1.4)),
      })
    : 1

  // 2. Quantum Vibration / Molecular Hover
  const isFloatEnabled = animMode === 'all' || animMode === 'float'
  const floatFreq = 0.08 * animSpeed
  const hoverY = isFloatEnabled ? Math.sin(frame * floatFreq) * 3.5 : 0
  const hoverRotate = isFloatEnabled ? Math.sin(frame * floatFreq * 0.65) * 1.2 : 0
  const breathingScale = isFloatEnabled ? 1 + Math.sin(frame * floatFreq * 0.8) * 0.016 : 1

  // 3. Neon Laser Scan Pulse
  const scanCycleFrames = Math.max(30, Math.round(75 / animSpeed))
  const scanFrame = frame % scanCycleFrames
  const scanDuration = Math.round(32 / animSpeed)
  const isScanning = pulseGlow && animMode !== 'none' && scanFrame < scanDuration
  const scanX = isScanning
    ? interpolate(scanFrame, [0, scanDuration], [-20, 120])
    : -30

  // ── SVG Structure Generation ────────────────────────────────────────
  const { svgHtml, error } = useMemo(() => {
    return renderMoleculeSvg(
      data.smiles,
      effectiveTheme,
      data.bondThickness || 2.2,
      width - 24,
      contentHeight - 16
    )
  }, [data.smiles, effectiveTheme, data.bondThickness, width, contentHeight])

  const animClass = `mol-anim-${el.id.replace(/[^a-zA-Z0-9_-]/g, '')}`

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      {/* Scoped CSS for Remotion SVG Write-on & Atom Pop-in */}
      <style>{`
        .${animClass} line, .${animClass} path {
          stroke-dasharray: 90;
          stroke-dashoffset: ${bondDashOffset}px;
          filter: ${isScanning ? `drop-shadow(0 0 3px ${accentColor})` : 'none'};
        }
        .${animClass} text {
          opacity: ${Math.min(1, atomPopProgress * 1.2)};
          transform-box: fill-box;
          transform-origin: center;
          transform: scale(${Math.max(0, atomPopProgress)});
        }
      `}</style>

      <div
        style={{
          width,
          height,
          borderRadius: 12,
          overflow: 'hidden',
          background: 'rgba(9, 13, 20, 0.88)',
          // Thẻ "màn hình lab" luôn tối: khoá token chữ sáng để không lấy màu chữ tối của theme sáng
          ['--text' as any]: '#FFFFFF',
          ['--text-sub' as any]: 'rgba(255, 255, 255, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: `var(--shadow-md, 0 8px 32px rgba(0, 0, 0, 0.6)), 0 0 16px ${mixColor(accentColor, 9)}`,
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {/* Title & Formula Header */}
        {showHeader && (
          <div
            style={{
              padding: '6px 12px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 10,
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
              {data.name && (
                <span
                  style={{
                    color: 'var(--text, #ffffff)',
                    fontSize: 11.5,
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                  }}
                >
                  {data.name}
                </span>
              )}
              {data.formula && data.showFormula !== false && (
                <span
                  style={{
                    color: 'var(--text-sub, #8b949e)',
                    fontSize: 10.5,
                    fontFamily: 'monospace',
                    whiteSpace: 'nowrap',
                  }}
                >
                  ({data.formula})
                </span>
              )}
            </div>
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 4,
                background: 'color-mix(in srgb, var(--accent, #00d2ff) 15%, transparent)',
                // Accent của theme sáng là màu đậm → chìm trên thẻ lab tối; chữ dùng --text (đã khoá sáng)
                color: 'var(--text)',
                letterSpacing: '0.04em',
                flexShrink: 0,
              }}
            >
              SMILES 2D
            </span>
          </div>
        )}

        {/* 2D Molecule Structure SVG Container */}
        <div
          style={{
            flex: 1,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px 12px',
            overflow: 'hidden',
            boxSizing: 'border-box',
            position: 'relative',
          }}
        >
          {/* Laser Pulse Beam Overlay */}
          {pulseGlow && animMode !== 'none' && isScanning && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${scanX}%`,
                width: '40px',
                background: `linear-gradient(90deg, transparent 0%, ${mixColor(accentColor, 16)} 50%, transparent 100%)`,
                pointerEvents: 'none',
                filter: 'blur(3px)',
                zIndex: 4,
              }}
            />
          )}

          {svgHtml ? (
            <div
              className={animClass}
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `translateY(${hoverY}px) rotate(${hoverRotate}deg) scale(${breathingScale})`,
                transformOrigin: 'center center',
              }}
              dangerouslySetInnerHTML={{ __html: svgHtml }}
            />
          ) : error ? (
            <div
              style={{
                color: '#FF6B6B',
                fontSize: 11,
                textAlign: 'center',
                padding: 12,
                lineHeight: 1.4,
              }}
            >
              Cấu trúc SMILES không hợp lệ
            </div>
          ) : (
            <div
              style={{
                color: 'var(--text-sub, #8b949e)',
                fontSize: 11,
                textAlign: 'center',
              }}
            >
              Đang tải phân tử...
            </div>
          )}
        </div>

        {/* Subtext Footer */}
        {data.subtext && (
          <div
            style={{
              padding: '4px 12px 6px',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              fontSize: 10,
              color: 'var(--text-sub, #8b949e)',
              fontStyle: 'italic',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flexShrink: 0,
            }}
          >
            {data.subtext}
          </div>
        )}
      </div>
    </RemotionElementWrapper>
  )
}
