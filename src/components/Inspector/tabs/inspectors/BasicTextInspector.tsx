import React from 'react'
import tabStyles from '../Tabs.module.css'
import styles from './BasicTextInspector.module.css'
import { InspectorProps, ColorDot, Slider, TypographyControl } from './common'
import { Button, SectionHeader } from '@/components/ui'
import { ScrubNumberInput } from '../../components/ScrubNumberInput'

export interface BasicTextInspectorProps extends InspectorProps {
  applyFontToAllScenes: (font: string) => void;
  applyStyleToAllScenes?: (type?: string) => void;
  handleUpdate: (patch: any) => void;
}

export function BasicTextInspector({
  element,
  inspector: ins,
  handleUpdate,
  applyFontToAllScenes,
  applyStyleToAllScenes,
  showToast,
}: BasicTextInspectorProps) {
  const el = element || {}
  const textContent  = el.content ?? ins.textContent ?? ''
  const fontFamily   = el.fontFamily ?? ins.fontFamily ?? 'Be Vietnam Pro'
  const textColor    = el.color ?? ins.textColor ?? '#FFFFFF'
  const textTransform = el.textTransform || 'none'

  const hasGradient  = Boolean(el.textGradientFrom && el.textGradientTo)
  const gradFrom     = el.textGradientFrom || '#FFE259'
  const gradTo       = el.textGradientTo   || '#FFA751'
  const gradAngle    = el.textGradientAngle ?? 135

  const hasBg        = Boolean(el.textBgColor)
  const bgColor      = el.textBgColor   || 'rgba(0,0,0,0.85)'
  const bgPadding    = el.textBgPadding ?? 6
  const bgRadius     = el.textBgRadius  ?? 6

  const strokeColor  = el.textStroke     || '#000000'
  const strokeWidth  = el.textStrokeWidth ?? 0
  const strokeOn     = strokeWidth > 0

  const shadowColor  = el.shadowColor    || 'rgba(0, 212, 255, 0.8)'
  const shadowBlur   = el.shadowBlur     ?? (el.shadow ? 12 : 0)
  const shadowOn     = shadowBlur > 0

  /* ─── helpers ─────────────────────────────────────── */
  const SyncIcon = () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  )

  return (
    <div className={styles.container}>

      {/* ── A: NỘI DUNG & KIỂU CHỮ ─────────────────── */}
      <SectionHeader title="Nội dung & Kiểu chữ" />

      <textarea
        className={styles.textInput}
        value={textContent}
        onChange={e => handleUpdate({ textContent: e.target.value, content: e.target.value })}
        placeholder="Nhập nội dung văn bản..."
        rows={2}
        style={{ fontFamily: fontFamily || 'inherit', textTransform: textTransform === 'uppercase' ? 'uppercase' : 'none' }}
      />

      <div style={{ marginTop: 8 }}>
        <TypographyControl
          element={el as any}
          updateElement={(_, patch) => handleUpdate(patch)}
          applyFontToAllScenes={applyFontToAllScenes}
          showToast={showToast}
          showAlign={true}
          showSpacing={true}
          showLineHeight={true}
          showColor={false}
          defaultFontSize={32}
        />
      </div>

      {/* ── C: MÀU SẮC & HIỆU ỨNG ───────────────────── */}
      <SectionHeader
        title="Màu sắc & Hiệu ứng"
        action={applyStyleToAllScenes ? (
          <Button asIcon variant="ghost" size="icon-sm"
            title="Đồng bộ màu sắc & viền cho toàn bộ video"
            onClick={() => { applyStyleToAllScenes(el.type); showToast('Đã đồng bộ màu sắc & hiệu ứng!') }}>
            <SyncIcon />
          </Button>
        ) : undefined}
      />

      {/* C1 ── Màu chữ ── 2 dòng: chế độ | màu */}
      <div className={styles.colorModeRow}>
        <span className={styles.propLabel}>Màu chữ</span>
        <div className={styles.colorModeSwitcher}>
          <button
            className={`${styles.modeBtn} ${!hasGradient ? styles.modeBtnActive : ''}`}
            onClick={() => handleUpdate({ textGradientFrom: undefined, textGradientTo: undefined })}
          >
            Đơn sắc
          </button>
          <button
            className={`${styles.modeBtn} ${hasGradient ? styles.modeBtnActive : ''}`}
            onClick={() => handleUpdate({ textGradientFrom: gradFrom, textGradientTo: gradTo, textGradientAngle: gradAngle })}
          >
            Gradient
          </button>
        </div>
      </div>

      {/* Color dots + gradient angle — Studio NLE Standard */}
      <div className={styles.colorPickerRow}>
        {!hasGradient ? (
          /* Single color: full-width bordered input-like row */
          <div className={styles.colorInputRow}>
            <ColorDot value={textColor} onChange={c => handleUpdate({ textColor: c, color: c })} sm />
            <input
              type="text"
              className={styles.hexInput}
              value={textColor.toUpperCase()}
              onChange={e => handleUpdate({ textColor: e.target.value, color: e.target.value })}
              spellCheck={false}
              maxLength={9}
            />
          </div>
        ) : (
          /* Gradient UI — Chuẩn Studio NLE */
          <div className={styles.gradientBox}>
            {/* 1. Dải màu trực quan Live Gradient Bar */}
            <div
              className={styles.gradientBar}
              style={{ background: `linear-gradient(90deg, ${gradFrom}, ${gradTo})` }}
              title={`Dải chuyển màu: ${gradFrom} → ${gradTo}`}
            />

            {/* 2. Hai Stop màu + Nút Đảo chiều ⇄ */}
            <div className={styles.stopsRow}>
              <div className={styles.stopInput}>
                <ColorDot value={gradFrom} onChange={c => handleUpdate({ textGradientFrom: c })} sm />
                <input
                  type="text"
                  className={styles.hexInput}
                  value={gradFrom.toUpperCase()}
                  onChange={e => handleUpdate({ textGradientFrom: e.target.value })}
                  spellCheck={false}
                  maxLength={9}
                  title="Màu bắt đầu (Start stop)"
                />
              </div>

              <button
                type="button"
                className={styles.swapBtn}
                title="Đảo chiều gradient (Hoán đổi 2 màu)"
                onClick={() => handleUpdate({ textGradientFrom: gradTo, textGradientTo: gradFrom })}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 16l-4-4 4-4" />
                  <path d="M3 12h18" />
                  <path d="M17 8l4 4-4 4" />
                </svg>
              </button>

              <div className={styles.stopInput}>
                <ColorDot value={gradTo} onChange={c => handleUpdate({ textGradientTo: c })} sm />
                <input
                  type="text"
                  className={styles.hexInput}
                  value={gradTo.toUpperCase()}
                  onChange={e => handleUpdate({ textGradientTo: e.target.value })}
                  spellCheck={false}
                  maxLength={9}
                  title="Màu kết thúc (End stop)"
                />
              </div>
            </div>

            {/* 3. Hướng góc xoay (Quick direction chips + exact scrub input) */}
            <div className={styles.directionRow}>
              <div className={styles.angleChips}>
                {[
                  { angle: 90, label: 'Ngang 90°', icon: <path d="M5 12h14M13 6l6 6-6 6" /> },
                  { angle: 180, label: 'Dọc 180°', icon: <path d="M12 5v14M6 13l6 6 6-6" /> },
                  { angle: 135, label: 'Chéo 135°', icon: <path d="M6 6l12 12M18 9v9H9" /> },
                  { angle: 45, label: 'Chéo lên 45°', icon: <path d="M6 18L18 6M9 6h9v9" /> },
                ].map(p => (
                  <button
                    key={p.angle}
                    type="button"
                    className={`${styles.directionBtn} ${gradAngle === p.angle ? styles.directionBtnActive : ''}`}
                    onClick={() => handleUpdate({ textGradientAngle: p.angle })}
                    title={p.label}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      {p.icon}
                    </svg>
                    <span>{p.angle}°</span>
                  </button>
                ))}
              </div>
              <ScrubNumberInput
                label="°"
                value={gradAngle}
                min={0}
                max={360}
                step={15}
                title="Góc gradient tùy chỉnh"
                onChange={v => handleUpdate({ textGradientAngle: v })}
                className={styles.gradAngleInput}
              />
            </div>

            {/* 4. Mẫu gradient thịnh hành (Curated Colorways) */}
            <div className={styles.presetsRow}>
              {[
                { from: '#FFE259', to: '#FFA751', title: 'Hoàng kim' },
                { from: '#00F2FE', to: '#4FACFE', title: 'Cyberpunk' },
                { from: '#BEFF01', to: '#00E676', title: 'Neon Lime' },
                { from: '#FF416C', to: '#FF4B2B', title: 'Hoàng hôn' },
                { from: '#F355DA', to: '#7000FF', title: 'Tím khói' },
                { from: '#FFFFFF', to: '#6E7681', title: 'Bạc kim' },
              ].map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={styles.presetPill}
                  style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}
                  title={p.title}
                  onClick={() => handleUpdate({ textGradientFrom: p.from, textGradientTo: p.to })}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={styles.effectDivider} />

      {/* C2 ── Hộp nền chữ — Toggle Row ── */}
      <div className={styles.toggleEffectRow}>
        <span className={styles.propLabel}>Hộp nền chữ</span>
        <div className={styles.toggleRowRight}>
          {hasBg && <ColorDot value={bgColor} onChange={c => handleUpdate({ textBgColor: c })} sm />}
          <label className={tabStyles.toggle}>
            <input type="checkbox" checked={hasBg}
              onChange={e => handleUpdate({ textBgColor: e.target.checked ? 'rgba(0,0,0,0.85)' : undefined })} />
            <span className={tabStyles.tgl} />
          </label>
        </div>
      </div>
      {hasBg && (
        <div className={styles.subControlRow}>
          <ScrubNumberInput label="Pad" value={bgPadding} min={0} max={30} step={1} unit="px"
            title="Padding trong hộp nền" onChange={v => handleUpdate({ textBgPadding: v })} />
          <ScrubNumberInput label="Bo" value={bgRadius} min={0} max={30} step={1} unit="px"
            title="Bo góc hộp nền" onChange={v => handleUpdate({ textBgRadius: v })} />
        </div>
      )}

      <div className={styles.effectDivider} />

      {/* C3 ── Viền chữ — Toggle Row ── */}
      <div className={styles.toggleEffectRow}>
        <span className={`${styles.propLabel} ${strokeOn ? '' : styles.propLabelOff}`}>Viền chữ</span>
        <div className={styles.toggleRowRight}>
          <ColorDot value={strokeColor} onChange={c => handleUpdate({ textStroke: c })} sm />
          <label className={tabStyles.toggle}>
            <input type="checkbox" checked={strokeOn}
              onChange={e => handleUpdate({ textStrokeWidth: e.target.checked ? 2 : 0, textStroke: strokeColor })} />
            <span className={tabStyles.tgl} />
          </label>
        </div>
      </div>
      <div className={styles.sliderWrap}>
        <Slider label="Độ dày" value={strokeWidth} min={0} max={8} step={0.5}
          display={v => `${v}px`}
          onChange={v => handleUpdate({ textStrokeWidth: v, textStroke: strokeColor })} />
      </div>

      <div className={styles.effectDivider} />

      {/* C4 ── Bóng & Phát sáng — Toggle Row ── */}
      <div className={styles.toggleEffectRow}>
        <span className={`${styles.propLabel} ${shadowOn ? '' : styles.propLabelOff}`}>Bóng & Phát sáng</span>
        <div className={styles.toggleRowRight}>
          {/* Chọn màu khi đang tắt → bật luôn (nhoè 12), tránh cảm giác bấm không ăn */}
          <ColorDot value={shadowColor} onChange={c => handleUpdate({ shadowColor: c, ...(shadowOn ? {} : { shadowBlur: 12, shadow: true }) })} sm />
          <label className={tabStyles.toggle}>
            <input type="checkbox" checked={shadowOn}
              onChange={e => handleUpdate({ shadowBlur: e.target.checked ? 12 : 0, shadowColor, shadow: e.target.checked })} />
            <span className={tabStyles.tgl} />
          </label>
        </div>
      </div>
      <div className={`${styles.sliderWrap} ${styles.sliderWrapLast}`}>
        {/* Trần 20px: bóng mờ lớn làm render chậm (mỗi frame vẽ lại vùng nhoè) */}
        <Slider label="Độ nhòe" value={shadowBlur} min={0} max={20} step={1}
          display={v => `${v}px`}
          onChange={v => handleUpdate({ shadowBlur: v, shadowColor, shadow: v > 0 })} />
      </div>

    </div>
  )
}
