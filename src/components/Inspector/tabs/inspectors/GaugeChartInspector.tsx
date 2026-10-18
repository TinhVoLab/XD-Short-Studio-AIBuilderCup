import React from 'react'
import styles from '../Tabs.module.css'
import { InspectorProps, Slider, ColorControlRow, CardBackgroundControl } from './common'
import { LandingFxControl } from './shared'
import { SectionHeader } from '@/components/ui'

export function GaugeChartInspector({ element, updateElement }: InspectorProps) {
  const currentTitle = element.content || ''
  const currentLabel = element.statLabel || ''

  return (
    <>
      <div className={styles.group}>
        <SectionHeader title="Kim đo tốc độ" />

        {/* Tiêu đề biểu đồ (Thanh Header Bar) */}
        <div style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
            <span className={styles.sliderLabel} style={{ fontSize: 11 }}>Tiêu đề biểu đồ</span>
            {Boolean(currentTitle) && (
              <button
                type="button"
                onClick={() => updateElement(element.id, { content: '' })}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  fontSize: 10,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Xoá cho gọn
              </button>
            )}
          </div>
          <input
            className={styles.input}
            value={currentTitle}
            onChange={e => updateElement(element.id, { content: e.target.value })}
            placeholder="Để trống nếu muốn ẩn tiêu đề..."
          />
        </div>

        {/* Nhãn chỉ số (Bên trong HUD Capsule) */}
        <div style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
            <span className={styles.sliderLabel} style={{ fontSize: 11 }}>Nhãn chỉ số</span>
            {Boolean(currentLabel) && (
              <button
                type="button"
                onClick={() => updateElement(element.id, { statLabel: '' })}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  fontSize: 10,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Xoá cho gọn
              </button>
            )}
          </div>
          <input
            className={styles.input}
            value={currentLabel}
            onChange={e => updateElement(element.id, { statLabel: e.target.value })}
            placeholder="Ví dụ: TỐC ĐỘ, RPM, HIỆU SUẤT..."
          />
        </div>

        <div style={{ marginBottom: 6 }}>
          <Slider
            label="Giá trị (%)"
            value={element.percent !== undefined ? element.percent : 85}
            min={0}
            max={100}
            step={1}
            display={v => `${v}%`}
            onChange={v => updateElement(element.id, { percent: v })}
          />
        </div>

        <ColorControlRow
          label="Màu kim & vạch"
          value={element.accentColor || '#FF5544'}
          onChange={c => updateElement(element.id, { accentColor: c, color: c })}
        />

        <LandingFxControl element={element} updateElement={updateElement} />

        {/* Khung nền biểu đồ */}
        <CardBackgroundControl
          element={element}
          updateElement={updateElement}
          label="Khung nền biểu đồ"
          showWidth={true}
          showBgColor={true}
          showRadius={true}
          defaultRadius={16}
          defaultBgColor="rgba(14, 18, 28, 0.94)"
        />
      </div>
      <div className={styles.divider} />
    </>
  )
}
