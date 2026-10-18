import React from 'react'
import styles from '../Tabs.module.css'
import { InspectorProps, Slider, ColorControlRow } from './common'
import { LandingFxControl } from './shared'
import { SectionHeader } from '@/components/ui'

export function CircleChartInspector({ element, updateElement }: InspectorProps) {
  const currentLabel = element.statLabel || element.content || ''

  return (
    <>
      <div className={styles.group}>
        <SectionHeader title="Tiến độ tròn" />

        <div style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
            <span className={styles.sliderLabel} style={{ fontSize: 11 }}>Nhãn chỉ số</span>
            {Boolean(currentLabel) && (
              <button
                type="button"
                onClick={() => updateElement(element.id, { statLabel: '', content: '' })}
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
            onChange={e => updateElement(element.id, { statLabel: e.target.value, content: e.target.value })}
            placeholder="Để trống nếu muốn ẩn nhãn..."
          />
        </div>

        <div style={{ marginBottom: 6 }}>
          <Slider
            label="Tiến độ (%)"
            value={element.percent !== undefined ? element.percent : 85}
            min={0}
            max={100}
            step={1}
            display={v => `${v}%`}
            onChange={v => updateElement(element.id, { percent: v })}
          />
        </div>

        <ColorControlRow
          label="Màu vòng sáng"
          value={element.accentColor || '#00FF88'}
          onChange={c => updateElement(element.id, { accentColor: c, color: c })}
        />

        <div style={{ marginBottom: 6 }}>
          <Slider
            label="Kích thước"
            value={element.width || 140}
            min={100}
            max={260}
            step={4}
            display={v => `${v}px`}
            onChange={v => updateElement(element.id, { width: v, height: v })}
          />
        </div>

        <div>
          <Slider
            label="Độ dày viền vòng"
            value={element.strokeWidth || 12}
            min={6}
            max={24}
            step={1}
            display={v => `${v}px`}
            onChange={v => updateElement(element.id, { strokeWidth: v })}
          />
        </div>

        <LandingFxControl element={element} updateElement={updateElement} />
      </div>
      <div className={styles.divider} />
    </>
  )
}
