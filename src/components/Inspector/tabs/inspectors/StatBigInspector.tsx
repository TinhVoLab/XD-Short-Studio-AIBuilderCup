import React from 'react'
import tabStyles from '../Tabs.module.css'
import { InspectorProps, Slider, Toggle, ToggleRow, ColorControlRow } from './common'
import { LandingFxControl } from './shared'
import { FormGroup, FormRow, SectionHeader } from '@/components/ui'

export function StatBigInspector({ element, updateElement, setInspector }: InspectorProps) {
  const accent = element.accentColor || element.color || '#BEFF01'
  const numberColor = element.statNumberColor || '#FFFFFF'
  const labelColor = element.statLabelColor || '#FFFFFF'
  const labelFontSize = element.statLabelFontSize || 13
  const showBadge = element.statShowBadge !== false
  const showLine = element.statShowLine !== false

  return (
    <div>
      {/* ── CỤM 1: CON SỐ CHÍNH ── */}
      <SectionHeader title="Con số chính" />

      {/* Value Input */}
      <FormGroup label="Giá trị số (vd: 85%, +240%, 10X, $1.5M)">
        <input
          className={tabStyles.input}
          style={{ fontWeight: 800, color: accent }}
          value={element.statValue || element.content || ''}
          onChange={e => {
            const val = e.target.value
            updateElement(element.id, { statValue: val, content: val })
            setInspector({ textContent: val, statValue: val })
          }}
          placeholder="VD: 85% hoặc +240%..."
        />
      </FormGroup>

      {/* Font Family & Size */}
      <FormRow columns={2}>
        <FormGroup label="Font chữ" style={{ marginBottom: 0 }}>
          <select
            className={tabStyles.select}
            value={element.fontFamily || 'Be Vietnam Pro'}
            onChange={e => {
              updateElement(element.id, { fontFamily: e.target.value })
              setInspector({ fontFamily: e.target.value })
            }}
          >
            {['Montserrat', 'Be Vietnam Pro', 'Poppins', 'Inter', 'Lexend', 'Oswald', 'Bebas Neue'].map(f => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </FormGroup>
        <FormGroup label="Cỡ chữ (px)" style={{ marginBottom: 0 }}>
          <div className={tabStyles.numBox}>
            <span className={tabStyles.numLabel}>px</span>
            <input
              type="number"
              className={tabStyles.numInput}
              value={element.fontSize || 68}
              min={36}
              max={160}
              onChange={e => {
                const s = +e.target.value
                updateElement(element.id, { fontSize: s })
                setInspector({ fontSize: s })
              }}
            />
          </div>
        </FormGroup>
      </FormRow>

      {/* Colors: Number Color + Accent Color */}
      <div style={{ marginTop: 'var(--space-2)' }}>
        <ColorControlRow
          label="Màu số chính"
          value={numberColor}
          onChange={c => updateElement(element.id, { statNumberColor: c })}
        />
        <ColorControlRow
          label="Màu điểm nhấn"
          value={accent}
          onChange={c => updateElement(element.id, { accentColor: c, color: c })}
        />
      </div>

      {/* ── CỤM 2: NHÃN MÔ TẢ & CHÚ THÍCH ── */}
      <SectionHeader title="Nhãn mô tả & chú thích" style={{ marginTop: 'var(--space-3)' }} />

      {/* Label text */}
      <FormGroup label="Tiêu đề mô tả số liệu">
        <input
          className={tabStyles.input}
          value={element.statLabel || ''}
          onChange={e => updateElement(element.id, { statLabel: e.target.value })}
          placeholder="VD: DỰ ÁN AI THẤT BẠI DO DỮ LIỆU BẨN..."
        />
      </FormGroup>

      {/* Label Font Size Slider */}
      <Slider
        label="Cỡ chữ nhãn"
        value={labelFontSize}
        min={10}
        max={24}
        step={1}
        display={v => `${v}px`}
        onChange={v => updateElement(element.id, { statLabelFontSize: v })}
      />

      {/* Label Color */}
      <ColorControlRow
        label="Màu chữ nhãn"
        value={labelColor}
        onChange={c => updateElement(element.id, { statLabelColor: c })}
      />

      {/* Subtitle */}
      <FormGroup label="Chú thích phụ (tùy chọn)">
        <input
          className={tabStyles.input}
          value={element.subtitle || ''}
          onChange={e => updateElement(element.id, { subtitle: e.target.value })}
          placeholder="VD: Nguồn: Báo cáo Gartner 2026..."
        />
      </FormGroup>

      {/* ── CỤM 3: HUY HIỆU & ĐƯỜNG NÉT ── */}
      <SectionHeader title="Huy hiệu & trang trí" style={{ marginTop: 'var(--space-3)' }} />

      <ToggleRow label="Hiện thanh huy hiệu phía trên">
        <Toggle checked={showBadge} onChange={v => updateElement(element.id, { statShowBadge: v })} />
      </ToggleRow>

      {showBadge && (
        <FormGroup label="Nội dung huy hiệu" style={{ marginTop: 'var(--space-15)' }}>
          <input
            className={tabStyles.input}
            value={element.statBadgeText || ''}
            onChange={e => updateElement(element.id, { statBadgeText: e.target.value })}
            placeholder="Để trống: Tự động nhận diện (TĂNG TRƯỞNG, SỤT GIẢM...)"
          />
        </FormGroup>
      )}

      <div style={{ marginTop: 'var(--space-15)' }}>
        <ToggleRow label="Hiện đường gạch chỉ dưới">
          <Toggle checked={showLine} onChange={v => updateElement(element.id, { statShowLine: v })} />
        </ToggleRow>
      </div>

      <LandingFxControl element={element} updateElement={updateElement} />
    </div>
  )
}
