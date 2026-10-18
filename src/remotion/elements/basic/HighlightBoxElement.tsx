import React, { useMemo } from 'react'
import { spring, interpolate, Easing } from 'remotion'
import { ElementProps } from '../types'
import { RemotionElementWrapper } from '../core/RemotionElementWrapper'
import { mixColor, useRichLineRenderer } from '../../utils/rich-text-parser'
import { renderBoxIcon } from '../../utils/icons'
import { HIGHLIGHT_BOX_SPEC, layoutHighlightBox, resolveHighlightSkin, skinIcon } from '@/config/highlightBoxLayout'
export { renderBoxIcon }

/**
 * Replaces the whitespace before the final word of each line with a non-breaking space ( ),
 * guaranteeing that the last line never has an orphaned single word.
 */
export function preventOrphanText(text: string): string {
  if (!text || typeof text !== 'string') return text || ''
  return text
    .split('\n')
    .map(line => line.trim().replace(/\s+(\S+)$/u, ' $1'))
    .join('\n')
}

const S = HIGHLIGHT_BOX_SPEC
const CARD_BG = 'var(--card-bg, rgba(13, 17, 23, 0.88))'
const SWASH_SEC = 0.6
/** Mực bút dạ: màu nhấn phụ đề của theme (đã khoá tương phản) — vàng/kem như bút dạ thật */
const MARKER_INK = 'color-mix(in srgb, var(--subtitle-highlight, var(--accent)) 55%, transparent)'

/**
 * Highlight Box — 5 kiểu (hình học dùng chung highlightBoxLayout.js) × 4 skin theo tông theme.
 * Skin chỉ là "lớp sơn": nền, màu viền, bóng, kiểu icon, vệt bút dạ. Độ dày viền, padding và
 * kích thước icon giữ nguyên ở mọi skin nên chiều cao/vị trí không đổi khi đổi skin.
 */
export const HighlightBoxElement: React.FC<ElementProps & { frame?: number; fps?: number; delayFrames?: number; durFrames?: number }> = ({
  el,
  computedStyle,
  positionStyle,
  content,
  frame = 0,
  fps = 30,
  delayFrames = 0,
}) => {
  const text = String(content || el.content || '').trim() || 'Nội dung điểm nhấn...'
  const layout = useMemo(
    () => layoutHighlightBox({ ...el, content: text }),
    [text, el.variant, el.width, el.fontSize, el.boxIcon, el.badgeMode, el.textAlign]
  )
  const { skin, backing } = resolveHighlightSkin(el, { highlightSkin: el.sceneHighlightSkin }, el.bgBusy)
  const isGlass = skin === 'glass'
  const isPaper = skin === 'paper'
  const isEditorial = skin === 'editorial'
  const isMarker = skin === 'marker'

  const accent = el.accentColor || 'var(--accent, #BEFF01)'
  const textColor = el.color || (isPaper ? 'var(--on-surface, #FFFFFF)' : 'var(--text, #FFFFFF)')
  const textAlign = (el.textAlign || 'left') as React.CSSProperties['textAlign']
  const w = el.width || 320
  const radius = el.radius ?? 16
  const glow = el.glowEffect !== false && isGlass
  const fontFamily = el.fontFamily || 'Be Vietnam Pro, sans-serif'
  const icon = skinIcon(el.boxIcon && el.boxIcon !== 'none' ? el.boxIcon : undefined, skin)
  const renderLine = useRichLineRenderer({ accentColor: accent, fontSize: layout.fontSize, emphasizeNumbers: el.emphasizeNumbers !== false })

  // ── Lớp sơn theo skin ─────────────────────────────────────────────
  /** Nền khung: kính (glass) / surface pastel (paper) / trong suốt hoặc nền lót khi nền cảnh bận */
  const frameBg = el.bgColor || (isGlass ? CARD_BG : isPaper ? 'var(--surface)' : backing ? mixColor(CARD_BG, 72) : 'transparent')
  const frameBorder = (pct: number) => (isGlass ? mixColor(accent, pct) : 'transparent')
  const frameRadius = isPaper ? Math.max(radius, 20) : isEditorial ? 4 : radius
  /** Vạch accent mảnh bên trái của editorial: inset shadow nên không đổi kích thước */
  const editorialRule = `inset 2px 0 0 ${accent}`
  const frameShadow = (glowPct: number, elevation: 'sm' | 'md') => {
    if (isGlass) return `${glow ? `0 0 18px ${mixColor(accent, glowPct)}, ` : ''}var(--shadow-${elevation}, 0 6px 16px rgba(0, 0, 0, 0.32))`
    if (isPaper) return 'var(--shadow-sm, 0 2px 6px rgba(0, 0, 0, 0.12))'
    if (isEditorial) return editorialRule
    return 'none'
  }
  /** Huy hiệu icon: vòng tròn (glass/paper) hoặc chỉ nét vẽ (editorial/marker); viền 1px luôn giữ chỗ */
  const iconBadge = (size: number, glyph: number) => (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: isGlass ? mixColor(accent, 16) : isPaper ? mixColor(accent, 14) : 'transparent',
      border: `1px solid ${isGlass ? mixColor(accent, 50) : 'transparent'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {renderBoxIcon(icon, accent, glyph)}
    </div>
  )

  /** Vệt bút dạ (marker): quét trái → phải trong SWASH_SEC kể từ lúc xuất hiện, mỗi dòng một vệt */
  const swash = (startFrame: number): React.CSSProperties | undefined => {
    if (!isMarker) return undefined
    const p = interpolate(frame, [startFrame, startFrame + SWASH_SEC * fps], [0, 1], {
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
    })
    const ink = MARKER_INK
    return {
      backgroundImage: `linear-gradient(transparent 58%, ${ink} 58%, ${ink} 94%, transparent 94%)`,
      backgroundRepeat: 'no-repeat',
      backgroundSize: `${(p * 100).toFixed(2)}% 100%`,
      WebkitBoxDecorationBreak: 'clone',
      boxDecorationBreak: 'clone',
    } as React.CSSProperties
  }

  const textStyle = (lineHeight: number, fontWeight = 600): React.CSSProperties => ({
    flex: 1,
    minWidth: 0,
    fontSize: layout.fontSize,
    fontWeight,
    color: textColor,
    fontFamily,
    lineHeight,
    wordBreak: 'break-word',
    whiteSpace: 'pre-line',
    // balance chia đều độ dài dòng → hợp chữ căn giữa; với căn trái nó rút ngắn dòng và để trống
    // một khoảng lớn bên phải. Mồ côi cuối dòng đã được preventOrphanText xử lý.
    textWrap: (textAlign === 'center' ? 'balance' : 'wrap') as any,
    textAlign,
  })

  const textNode = (value: string, startFrame: number) => (
    <span style={swash(startFrame)}>{renderLine(preventOrphanText(value))}</span>
  )

  const wrap = (node: React.ReactNode) => (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>{node}</RemotionElementWrapper>
  )

  // ── CALLOUT-CARD: đúc kết 1 ý ──
  if (layout.variant === 'callout-card') {
    const V = S.callout
    return wrap(
      <div style={{
        width: w,
        boxSizing: 'border-box',
        padding: `${V.padY}px ${V.padX}px`,
        background: frameBg,
        border: `${V.border}px solid ${frameBorder(45)}`,
        borderRadius: frameRadius,
        boxShadow: frameShadow(14, 'md'),
        display: 'flex',
        alignItems: layout.textLines! <= 2 ? 'center' : 'flex-start',
        gap: V.gap,
      }}>
        {layout.hasIcon && iconBadge(V.iconSize, Math.round(V.iconSize * 0.54))}
        <div style={textStyle(V.lineHeight)}>{textNode(layout.text || text, delayFrames)}</div>
        {layout.hasIcon && textAlign === 'center' && (
          <div aria-hidden="true" style={{ width: V.iconSize, height: V.iconSize, flexShrink: 0 }} />
        )}
      </div>
    )
  }

  // ── ACCENT-STRIP: vạch accent bên trái ──
  if (layout.variant === 'accent-strip') {
    const V = S.strip
    const stripBg = el.bgColor || (isGlass ? `linear-gradient(90deg, ${mixColor(accent, 14)} 0%, transparent 70%), ${CARD_BG}` : frameBg)
    return wrap(
      <div style={{
        width: w,
        boxSizing: 'border-box',
        padding: `${V.padY}px ${V.padX}px`,
        borderLeft: `${V.borderLeft}px solid ${accent}`,
        background: stripBg,
        borderRadius: isEditorial ? 0 : `0 ${Math.min(frameRadius, 14)}px ${Math.min(frameRadius, 14)}px 0`,
        boxShadow: isGlass || isPaper ? 'var(--shadow-sm, 0 2px 6px rgba(0, 0, 0, 0.28))' : 'none',
        display: 'flex',
        alignItems: 'center',
        gap: V.gap,
      }}>
        {layout.hasIcon && (
          <div style={{ width: V.iconSize, height: V.iconSize, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {renderBoxIcon(icon, accent, V.iconSize)}
          </div>
        )}
        <div style={textStyle(V.lineHeight)}>{textNode(layout.text || text, delayFrames)}</div>
        {layout.hasIcon && textAlign === 'center' && (
          <div aria-hidden="true" style={{ width: V.iconSize, height: V.iconSize, flexShrink: 0 }} />
        )}
      </div>
    )
  }

  // Nền viên thuốc (pill / sticker): luôn có hình viên thuốc, skin chỉ đổi màu
  const pillBg = (strong: number, soft: number) =>
    el.bgColor || (isGlass
      ? `linear-gradient(135deg, ${mixColor(accent, strong)} 0%, ${mixColor(accent, soft)} 100%), ${CARD_BG}`
      : isPaper
      ? 'var(--surface)'
      : isMarker
      ? `linear-gradient(${MARKER_INK}, ${MARKER_INK}), ${backing ? mixColor(CARD_BG, 72) : 'transparent'}`
      : frameBg)
  const pillBorder = (pct: number) => (isGlass ? mixColor(accent, pct) : isEditorial ? mixColor(accent, 75) : 'transparent')
  const pillShadow = (glowPct: number) =>
    isGlass ? `${glow ? `0 0 18px ${mixColor(accent, glowPct)}, ` : ''}var(--shadow-sm, 0 2px 6px rgba(0, 0, 0, 0.28))`
      : isPaper ? 'var(--shadow-sm, 0 2px 6px rgba(0, 0, 0, 0.12))' : 'none'

  // ── GLOW-PILL: viên thuốc kêu gọi hành động ──
  if (layout.variant === 'glow-pill') {
    const V = S.pill
    return wrap(
      <div style={{
        width: w,
        boxSizing: 'border-box',
        padding: `${V.padY}px ${V.padX}px`,
        borderRadius: 999,
        background: pillBg(20, 6),
        border: `${V.border}px solid ${pillBorder(60)}`,
        boxShadow: pillShadow(22),
        display: 'flex',
        alignItems: 'center',
        justifyContent: textAlign === 'center' ? 'center' : 'flex-start',
        gap: V.gap,
      }}>
        {layout.hasIcon && (
          <div style={{ width: V.iconSize, height: V.iconSize, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            {renderBoxIcon(icon, accent, V.iconSize)}
          </div>
        )}
        <div style={{ ...textStyle(V.lineHeight, 700), flex: '0 1 auto' }}>{renderLine(preventOrphanText(layout.text || text))}</div>
      </div>
    )
  }

  // ── MULTI-PILL: sticker từ khoá ──
  if (layout.variant === 'multi-pill') {
    const K = S.sticker
    const pills = layout.pills || []
    return wrap(
      <div style={{
        width: w,
        boxSizing: 'border-box',
        padding: `${K.wrapPadY}px ${K.wrapPadX}px`,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: K.gap,
      }}>
        {pills.map((pill, idx) => (
          <div key={idx} style={{
            maxWidth: '100%',
            boxSizing: 'border-box',
            padding: `${K.padY}px ${K.padX}px`,
            background: pillBg(22, 8),
            border: `${K.border}px solid ${pillBorder(55)}`,
            borderRadius: isEditorial ? 6 : 18,
            fontSize: layout.fontSize,
            fontWeight: 800,
            color: textColor,
            fontFamily,
            lineHeight: K.lineHeight,
            boxShadow: pillShadow(0),
            wordBreak: 'break-word',
            textAlign: 'center',
            transform: `rotate(${pills.length > 1 && !isEditorial ? (idx % 2 === 0 ? -1.5 : 1.5) : 0}deg)`,
          }}>
            {renderLine(pill.text)}
          </div>
        ))}
      </div>
    )
  }

  // ── BULLET-LIST: từng dòng xuất hiện lần lượt (theo lời thoại nếu khớp) ──
  const B = S.bullet
  const rows = layout.rows || []
  const hasBadge = layout.showNumber || layout.showIcon
  let fallbackFrame = delayFrames
  return wrap(
    <div style={{ width: w, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: B.rowGap }}>
      {rows.map((row, idx) => {
        const voiceSec = el.rowRevealAtSec?.[idx]
        const revealFrame = typeof voiceSec === 'number' ? Math.round(voiceSec * fps) : fallbackFrame + idx * 4
        if (typeof voiceSec === 'number') fallbackFrame = revealFrame - idx * 4
        const spr = Math.min(1, Math.max(0, spring({ fps, frame: frame - revealFrame, config: { damping: 14, mass: 0.6, stiffness: 120 } })))
        const rowBorder = isGlass
          ? (layout.showNumber ? mixColor('var(--text, #ffffff)', 10) : mixColor(accent, 35))
          : 'transparent'
        return (
          <div key={idx} style={{
            display: 'flex',
            alignItems: row.textLines > 1 ? 'flex-start' : 'center',
            gap: hasBadge ? B.gap : 0,
            padding: hasBadge ? `${B.padY}px ${B.padX}px` : `${B.padYPlain}px ${B.padXPlain}px`,
            background: frameBg,
            border: `${B.border}px solid ${rowBorder}`,
            borderRadius: isPaper ? Math.max(radius, 16) : isEditorial ? 4 : Math.min(radius, 14),
            boxShadow: isGlass ? 'var(--shadow-sm, 0 2px 6px rgba(0, 0, 0, 0.28))' : isPaper ? 'var(--shadow-sm, 0 2px 6px rgba(0, 0, 0, 0.12))' : isEditorial ? editorialRule : 'none',
            boxSizing: 'border-box',
            opacity: spr,
            transform: `translateY(${(1 - spr) * 12}px)`,
          }}>
            {layout.showNumber && (
              <div style={{
                width: B.badgeNumber, height: B.badgeNumber, borderRadius: '50%', flexShrink: 0,
                background: mixColor(accent, isPaper ? 18 : 16),
                border: `1.5px solid ${isGlass || isPaper ? mixColor(accent, 55) : mixColor(accent, 70)}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11.5, fontWeight: 900, color: accent, fontFamily,
              }}>
                {String(idx + 1).padStart(2, '0')}
              </div>
            )}
            {layout.showIcon && iconBadge(B.badgeIcon, 14)}
            <div style={textStyle(B.lineHeight)}>{textNode(row.text, revealFrame)}</div>
            {/* Căn giữa: khoảng đối xứng với huy hiệu để chữ căn giữa theo cả thẻ */}
            {layout.centerSpacer ? <div aria-hidden="true" style={{ width: layout.centerSpacer - B.gap, flexShrink: 0 }} /> : null}
          </div>
        )
      })}
    </div>
  )
}
