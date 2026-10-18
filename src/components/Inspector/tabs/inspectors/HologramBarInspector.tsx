import React from 'react'
import styles from '../Tabs.module.css'
import {
  InspectorProps,
  ColorDot,
  Slider,
  DeleteIconButton,
  ColorControlRow,
  CardBackgroundControl,
} from './common'
import { Button, SectionHeader } from '@/components/ui'

interface BarItem {
  label: string
  value: number
  color?: string
  sub?: string
}

const DEFAULT_BARS: BarItem[] = [
  { label: 'GPU CLUSTER', value: 85, color: '#00D4FF', sub: '92 TFLOPS' },
  { label: 'NEURAL CHIP', value: 92, color: '#BEFF01', sub: '128 TOPS' },
  { label: 'QUANTUM BUS', value: 64, color: '#FF2D78', sub: '4.8 GB/s' },
]

export function HologramBarInspector({ element, updateElement }: InspectorProps) {
  const currentData = (element as any).hologramBarData || {
    title: 'HỆ THỐNG XUNG LỰC',
    accentColor: '#BEFF01',
    showScanline: true,
    bars: DEFAULT_BARS,
  }

  const currentTitle = String(currentData.title ?? element.title ?? element.content ?? '').trim()
  const bars: BarItem[] = Array.isArray(currentData.bars) && currentData.bars.length > 0
    ? currentData.bars
    : DEFAULT_BARS

  const updateData = (patch: Partial<typeof currentData>) => {
    updateElement(element.id, {
      hologramBarData: { ...currentData, ...patch },
    })
  }

  const handleBarChange = (idx: number, patch: Partial<BarItem>) => {
    const nextBars = [...bars]
    nextBars[idx] = { ...nextBars[idx], ...patch }
    updateData({ bars: nextBars })
  }

  const handleAddBar = () => {
    if (bars.length >= 6) return
    const palette = ['#00D4FF', '#BEFF01', '#FF2D78', '#00FF88', '#FFB800', '#B388FF']
    const nextCol = palette[bars.length % palette.length]
    const newBar: BarItem = {
      label: `NODE 0${bars.length + 1}`,
      value: 75,
      color: nextCol,
      sub: '64 GFLOPS',
    }
    updateData({ bars: [...bars, newBar] })
  }

  const handleDeleteBar = (idx: number) => {
    if (bars.length <= 1) return
    const nextBars = bars.filter((_, i) => i !== idx)
    updateData({ bars: nextBars })
  }

  return (
    <>
      <div className={styles.group}>
        <SectionHeader
          title="Cột năng lượng 3D"
          action={
            Boolean(currentTitle) ? (
              <button
                type="button"
                onClick={() => {
                  updateElement(element.id, { content: '' })
                  updateData({ title: '' })
                }}
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
            ) : undefined
          }
        />

        {/* Tiêu đề widget */}
        <div style={{ marginBottom: 6 }}>
          <span className={styles.sliderLabel} style={{ fontSize: 11, display: 'block', marginBottom: 3 }}>
            Tiêu đề widget
          </span>
          <input
            className={styles.input}
            value={currentTitle}
            onChange={(e) => {
              const val = e.target.value
              updateElement(element.id, { content: val })
              updateData({ title: val })
            }}
            placeholder="Để trống nếu muốn ẩn tiêu đề..."
          />
        </div>

        {/* Khung nền thẻ */}
        <CardBackgroundControl
          element={element}
          updateElement={updateElement}
          label="Khung nền Cyber"
          showWidth={true}
        />

        {/* Tia quét Laser */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, marginBottom: 4 }}>
          <span className={styles.sliderLabel} style={{ fontSize: 11 }}>Tia quét laser neon</span>
          <button
            type="button"
            onClick={() => updateData({ showScanline: currentData.showScanline === false })}
            style={{
              padding: '2px 8px',
              fontSize: 10,
              fontWeight: 600,
              background: currentData.showScanline !== false ? 'rgba(0, 212, 255, 0.2)' : 'rgba(255, 255, 255, 0.06)',
              color: currentData.showScanline !== false ? '#00D4FF' : 'var(--text-muted)',
              border: currentData.showScanline !== false ? '1px solid rgba(0, 212, 255, 0.5)' : '1px solid var(--border)',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            {currentData.showScanline !== false ? 'BẬT' : 'TẮT'}
          </button>
        </div>

        {/* Màu chủ đạo */}
        <div style={{ marginTop: 6 }}>
          <ColorControlRow
            label="Màu điểm nhấn"
            value={currentData.accentColor || '#BEFF01'}
            onChange={(c) => updateData({ accentColor: c })}
          />
        </div>
      </div>

      {/* Danh sách các cột năng lượng 3D */}
      <div className={styles.group}>
        <SectionHeader
          title={`Danh sách cột (${bars.length}/6)`}
          action={
            bars.length < 6 ? (
              <Button size="xs" variant="secondary" onClick={handleAddBar}>
                + Thêm cột
              </Button>
            ) : undefined
          }
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
          {bars.map((bar, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                padding: '8px 10px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border)',
                borderRadius: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-sub)' }}>
                  #{idx + 1}
                </span>

                <input
                  className={styles.input}
                  value={bar.label}
                  onChange={(e) => handleBarChange(idx, { label: e.target.value })}
                  placeholder="Tên cột (GPU, NPU...)"
                  style={{ flex: 1, height: 26, fontSize: 11, marginBottom: 0 }}
                />

                <ColorDot
                  value={bar.color || '#00D4FF'}
                  onChange={(c) => handleBarChange(idx, { color: c })}
                  sm
                />

                {bars.length > 1 && (
                  <DeleteIconButton onClick={() => handleDeleteBar(idx)} />
                )}
              </div>

              {/* Sub metric & percent value */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <input
                  className={styles.input}
                  value={bar.sub || ''}
                  onChange={(e) => handleBarChange(idx, { sub: e.target.value })}
                  placeholder="Chỉ số phụ (vd: 92 TFLOPS)"
                  style={{ height: 24, fontSize: 10.5, fontFamily: 'monospace', marginBottom: 0 }}
                />

                <Slider
                  label="Xung lực"
                  min={5}
                  max={100}
                  step={1}
                  value={bar.value || 50}
                  display={(v) => `${v}%`}
                  onChange={(v) => handleBarChange(idx, { value: v })}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
