import React from 'react'
import styles from '../Tabs.module.css'
import { InspectorProps, ColorDot, Slider, DeleteIconButton, ColorControlRow, CardBackgroundControl } from './common'
import { Button, SectionHeader } from '@/components/ui'

export function HeatmapMatrixInspector({ element, updateElement }: InspectorProps) {
  const currentTitle = element.heatmapData?.title || element.content || ''
  const currentHm = element.heatmapData || { cells: [] }

  return (
    <>
      <div className={styles.group}>
        <SectionHeader title="Bản đồ nhiệt" />

        {/* Tiêu đề bản đồ nhiệt */}
        <div style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
            <span className={styles.sliderLabel} style={{ fontSize: 11 }}>Tiêu đề bản đồ nhiệt</span>
            {Boolean(currentTitle) && (
              <button
                type="button"
                onClick={() => updateElement(element.id, {
                  content: '',
                  heatmapData: { ...currentHm, title: '' }
                })}
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
            onChange={e => {
              const val = e.target.value
              updateElement(element.id, {
                content: val,
                heatmapData: { ...currentHm, title: val }
              })
            }}
            placeholder="Để trống nếu muốn ẩn tiêu đề..."
          />
        </div>

        {/* Số cột */}
        <div style={{ marginBottom: 6 }}>
          <Slider
            label="Số cột ma trận"
            value={element.heatmapData?.cols || 7}
            min={4}
            max={8}
            step={1}
            display={v => `${v} cột`}
            onChange={v => {
              updateElement(element.id, {
                heatmapData: { ...currentHm, cols: v }
              })
            }}
          />
        </div>

        {/* Preset Templates */}
        <div style={{ marginBottom: 8 }}>
          <span className={styles.sliderLabel} style={{ marginBottom: 4, display: 'block', fontSize: 11 }}>Mẫu có sẵn</span>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <Button
              variant="pill"
              size="xs"
              onClick={() => {
                updateElement(element.id, {
                  content: 'THỊ TRƯỜNG CRYPTO',
                  heatmapData: {
                    title: 'THỊ TRƯỜNG CRYPTO',
                    cols: 7,
                    cells: [
                      { label: 'BTC', value: 85, color: '#00FF88' },
                      { label: 'ETH', value: 65, color: '#00FF88' },
                      { label: 'SOL', value: 92, color: '#00FF88' },
                      { label: 'BNB', value: -12, color: '#FF3366' },
                      { label: 'XRP', value: 45, color: '#00D4FF' },
                      { label: 'ADA', value: -25, color: '#FF3366' },
                      { label: 'DOGE', value: 78, color: '#00FF88' },
                      { label: 'AVAX', value: 34, color: '#00FF88' },
                      { label: 'DOT', value: -18, color: '#FF3366' },
                      { label: 'LINK', value: 55, color: '#00D4FF' },
                      { label: 'NEAR', value: 42, color: '#00FF88' },
                      { label: 'MATIC', value: -5, color: '#FF3366' },
                      { label: 'UNI', value: 20, color: '#00D4FF' },
                      { label: 'LTC', value: -15, color: '#FF3366' }
                    ]
                  }
                })
              }}
            >
              Crypto 24h
            </Button>

            <Button
              variant="pill"
              size="xs"
              onClick={() => {
                updateElement(element.id, {
                  content: 'CỔ PHIẾU BIG TECH',
                  heatmapData: {
                    title: 'CỔ PHIẾU BIG TECH',
                    cols: 7,
                    cells: [
                      { label: 'NVDA', value: 95, color: '#00FF88' },
                      { label: 'AAPL', value: -8, color: '#FF3366' },
                      { label: 'MSFT', value: 40, color: '#00D4FF' },
                      { label: 'GOOG', value: 55, color: '#00D4FF' },
                      { label: 'AMZN', value: 62, color: '#00FF88' },
                      { label: 'META', value: 88, color: '#00FF88' },
                      { label: 'TSLA', value: -35, color: '#FF3366' },
                      { label: 'AMD', value: 48, color: '#00FF88' },
                      { label: 'INTC', value: -42, color: '#FF3366' },
                      { label: 'QCOM', value: 30, color: '#00D4FF' },
                      { label: 'ORCL', value: 22, color: '#00D4FF' },
                      { label: 'CRM', value: -14, color: '#FF3366' },
                      { label: 'ADBE', value: 18, color: '#00D4FF' },
                      { label: 'NFLX', value: 75, color: '#00FF88' }
                    ]
                  }
                })
              }}
            >
              Big Tech
            </Button>
          </div>
        </div>

        {/* Cells Manager */}
        <div style={{ marginBottom: 8, padding: '8px 6px', background: 'rgba(0,0,0,0.2)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sub)' }}>
              Danh sách ô ({element.heatmapData?.cells?.length || 28})
            </span>
            <Button
              variant="secondary"
              size="xs"
              onClick={() => {
                const currentCells = currentHm.cells || []
                const newCell = { label: `C${currentCells.length + 1}`, value: 50, color: '#00FF88' }
                updateElement(element.id, {
                  heatmapData: { ...currentHm, cells: [...currentCells, newCell] }
                })
              }}
            >
              + Thêm ô
            </Button>
          </div>

          <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, paddingRight: 2 }}>
            {(element.heatmapData?.cells || []).map((cell, cIdx) => (
              <div key={cIdx} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(0,0,0,0.3)', padding: '3px 6px', borderRadius: 6 }}>
                <input
                  style={{ width: 52, fontSize: 10.5, padding: '3px 4px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', borderRadius: 4 }}
                  value={cell.label || ''}
                  onChange={e => {
                    const updated = [...(currentHm.cells || [])]
                    updated[cIdx] = { ...updated[cIdx], label: e.target.value }
                    updateElement(element.id, { heatmapData: { ...currentHm, cells: updated } })
                  }}
                  placeholder="Mã"
                />
                <input
                  type="number"
                  style={{ width: 50, fontSize: 10.5, padding: '3px 4px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: cell.value >= 0 ? '#00FF88' : '#FF3366', borderRadius: 4, textAlign: 'center' }}
                  value={cell.value}
                  onChange={e => {
                    const updated = [...(currentHm.cells || [])]
                    updated[cIdx] = { ...updated[cIdx], value: Number(e.target.value) || 0 }
                    updateElement(element.id, { heatmapData: { ...currentHm, cells: updated } })
                  }}
                  placeholder="%"
                />
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>%</span>
                <ColorDot
                  value={cell.color || (cell.value >= 0 ? '#00FF88' : '#FF3366')}
                  sm
                  onChange={col => {
                    const updated = [...(currentHm.cells || [])]
                    updated[cIdx] = { ...updated[cIdx], color: col }
                    updateElement(element.id, { heatmapData: { ...currentHm, cells: updated } })
                  }}
                />
                <DeleteIconButton
                  title="Xóa ô này"
                  onClick={() => {
                    const updated = (currentHm.cells || []).filter((_, i) => i !== cIdx)
                    updateElement(element.id, { heatmapData: { ...currentHm, cells: updated } })
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <ColorControlRow
          label="Màu chủ đạo"
          value={element.accentColor || '#00FF88'}
          onChange={c => updateElement(element.id, { accentColor: c, color: c })}
        />

        {/* Khung nền thẻ */}
        <CardBackgroundControl
          element={element}
          updateElement={updateElement}
          label="Khung nền thẻ"
          showWidth={true}
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
