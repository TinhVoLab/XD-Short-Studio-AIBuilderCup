import React from 'react'
import styles from '../Tabs.module.css'
import { InspectorProps, ColorDot, Slider, DeleteIconButton, ColorControlRow, CardBackgroundControl } from './common'
import { Button, SectionHeader } from '@/components/ui'

export function RacingBarInspector({ element, updateElement, showToast, setInspector }: InspectorProps) {
  return (
    <>
      <div className={styles.group}>
        <SectionHeader title="Biểu đồ đua cột" />

            <div style={{ marginBottom: 6 }}>
              <span className={styles.sliderLabel} style={{ marginBottom: 3, display: 'block', fontSize: 11 }}>Tiêu đề biểu đồ</span>
              <input
                className={styles.input}
                value={element.racingBarData?.title || element.content || ''}
                onChange={e => {
                  const val = e.target.value
                  const currentData = element.racingBarData || { bars: [] }
                  updateElement(element.id, { 
                    content: val, 
                    racingBarData: { ...currentData, title: val } 
                  })
                }}
                placeholder="VD: THỊ PHẦN TOÀN CẦU..."
              />
            </div>

            {/* Bars List Editor */}
            <div style={{ marginTop: 6, marginBottom: 8, padding: '8px 6px', background: 'rgba(0,0,0,0.2)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sub)' }}>Danh sách cột đua</span>
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => {
                    const currentData = element.racingBarData || { title: 'BẢNG XẾP HẠNG', bars: [] }
                    const bars = [...(currentData.bars || [])];
                    bars.push({ label: `Mục ${bars.length + 1}`, value: 20, color: '#00D4FF', icon: '⚡' });
                    updateElement(element.id, { racingBarData: { ...currentData, bars } });
                  }}
                >
                  + Thêm cột
                </Button>
              </div>

              {(element.racingBarData?.bars || [
                { label: 'Google Chrome', value: 65, color: '#00D4FF', icon: '🌐' },
                { label: 'Apple Safari', value: 19, color: '#00FF88', icon: '🧭' },
                { label: 'Microsoft Edge', value: 6, color: '#FFB800', icon: '⚡' },
                { label: 'Mozilla Firefox', value: 3, color: '#FF3366', icon: '🦊' },
              ]).map((bar, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <input
                    className={styles.input}
                    style={{ width: 28, marginBottom: 0, padding: '4px 2px', fontSize: 12, textAlign: 'center' }}
                    value={bar.icon || ''}
                    placeholder="Icon"
                    title="Icon / Emoji"
                    onChange={e => {
                      const currentData = element.racingBarData || { title: 'BẢNG XẾP HẠNG', bars: [] }
                      const bars = [...(currentData.bars || [])];
                      bars[idx] = { ...bars[idx], icon: e.target.value };
                      updateElement(element.id, { racingBarData: { ...currentData, bars } });
                    }}
                  />
                  <ColorDot
                    value={bar.color || '#00D4FF'}
                    sm
                    onChange={c => {
                      const currentData = element.racingBarData || { title: 'BẢNG XẾP HẠNG', bars: [] }
                      const bars = [...(currentData.bars || [])];
                      bars[idx] = { ...bars[idx], color: c };
                      updateElement(element.id, { racingBarData: { ...currentData, bars } });
                    }}
                  />
                  <input
                    className={styles.input}
                    style={{ flex: 2, marginBottom: 0, padding: '4px 6px', fontSize: 11 }}
                    value={bar.label}
                    placeholder="Tên mục"
                    onChange={e => {
                      const currentData = element.racingBarData || { title: 'BẢNG XẾP HẠNG', bars: [] }
                      const bars = [...(currentData.bars || [])];
                      bars[idx] = { ...bars[idx], label: e.target.value };
                      updateElement(element.id, { racingBarData: { ...currentData, bars } });
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2, width: 48, flexShrink: 0 }}>
                    <input
                      type="number"
                      className={styles.input}
                      style={{ width: 38, marginBottom: 0, padding: '4px 2px', fontSize: 11, textAlign: 'center' }}
                      value={bar.value}
                      min={0}
                      max={100}
                      onChange={e => {
                        const currentData = element.racingBarData || { title: 'BẢNG XẾP HẠNG', bars: [] }
                        const bars = [...(currentData.bars || [])];
                        bars[idx] = { ...bars[idx], value: +e.target.value };
                        updateElement(element.id, { racingBarData: { ...currentData, bars } });
                      }}
                    />
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>%</span>
                  </div>
                  <DeleteIconButton
                    onClick={() => {
                      const currentData = element.racingBarData || { title: 'BẢNG XẾP HẠNG', bars: [] }
                      const bars = (currentData.bars || []).filter((_, i) => i !== idx);
                      updateElement(element.id, { racingBarData: { ...currentData, bars } });
                    }}
                    title="Xóa mục này"
                  />
                </div>
              ))}
            </div>

            <ColorControlRow
              label="Màu chủ đạo"
              value={element.accentColor || '#00D4FF'}
              onChange={c => updateElement(element.id, { accentColor: c })}
            />

            {/* Khung nền biểu đồ */}
            <CardBackgroundControl
              element={element}
              updateElement={updateElement}
              label="Khung nền biểu đồ"
              showBgColor={true}
              showRadius={true}
              defaultRadius={16}
              defaultBgColor="rgba(10, 16, 28, 0.95)"
            />
          </div>
          <div className={styles.divider} />
        </>
  )
}
