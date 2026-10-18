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

const DEFAULT_LAYERS = [
  { label: 'TẦNG 1: HOOK ĐỘC ĐÁO', sub: 'Thu hút 3 giây đầu', color: '#BEFF01' },
  { label: 'TẦNG 2: NỘI DUNG GIÁ TRỊ', sub: 'Giữ chân bằng insight', color: '#00D4FF' },
  { label: 'TẦNG 3: KÊU GỌI HÀNH ĐỘNG', sub: 'Chuyển đổi follower', color: '#FF5544' },
]

export function PyramidFunnelInspector({ element, updateElement }: InspectorProps) {
  const currentTitle = String(element.title ?? element.content ?? '').trim()
  const layers = Array.isArray(element.pyramidLayers) && element.pyramidLayers.length > 0
    ? element.pyramidLayers
    : DEFAULT_LAYERS

  const handleAddLayer = () => {
    if (layers.length >= 5) return
    const palette = ['#BEFF01', '#00D4FF', '#FF5544', '#FFB800', '#B388FF']
    const nextCol = palette[layers.length % palette.length]
    const nextLayers = [
      ...layers,
      { label: `TẦNG ${layers.length + 1}: MỤC TIÊU`, sub: 'Hành động chuyển đổi', color: nextCol },
    ]
    updateElement(element.id, { pyramidLayers: nextLayers })
  }

  const handleDeleteLayer = (idx: number) => {
    if (layers.length <= 2) return
    const nextLayers = layers.filter((_, i) => i !== idx)
    updateElement(element.id, { pyramidLayers: nextLayers })
  }

  const handleUpdateLayer = (idx: number, patch: Partial<typeof layers[0]>) => {
    const nextLayers = [...layers]
    nextLayers[idx] = { ...nextLayers[idx], ...patch }
    updateElement(element.id, { pyramidLayers: nextLayers })
  }

  return (
    <>
      <div className={styles.group}>
        <SectionHeader
          title="Phễu kim tự tháp"
          action={
            Boolean(currentTitle) ? (
              <button
                type="button"
                onClick={() => updateElement(element.id, { content: '', title: '' })}
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

        {/* Tiêu đề mô tả */}
        <div style={{ marginBottom: 6 }}>
          <span className={styles.sliderLabel} style={{ marginBottom: 3, display: 'block', fontSize: 11 }}>
            Tiêu đề mô tả
          </span>
          <input
            className={styles.input}
            value={currentTitle}
            onChange={(e) => {
              const val = e.target.value
              updateElement(element.id, { content: val, title: val })
            }}
            placeholder="Để trống nếu muốn ẩn tiêu đề..."
          />
        </div>

        {/* Khung nền phễu */}
        <CardBackgroundControl
          element={element}
          updateElement={updateElement}
          label="Khung nền phễu"
          showWidth={true}
          showBgColor={true}
          showRadius={true}
          defaultRadius={16}
          defaultBgColor="rgba(10, 16, 28, 0.95)"
        />

        {/* Màu chủ đạo */}
        <div style={{ marginTop: 6 }}>
          <ColorControlRow
            label="Màu chủ đạo"
            value={element.accentColor || '#BEFF01'}
            onChange={(c) => updateElement(element.id, { accentColor: c })}
          />
        </div>
      </div>

      {/* Layers / Danh sách các tầng */}
      <div className={styles.group}>
        <SectionHeader
          title={`Danh sách tầng phễu (${layers.length}/5)`}
          action={
            layers.length < 5 ? (
              <Button variant="secondary" size="xs" onClick={handleAddLayer}>
                + Thêm tầng
              </Button>
            ) : undefined
          }
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
          {layers.map((layer, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                padding: '8px 10px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border)',
                borderRadius: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                <span
                  style={{
                    fontSize: 8.5,
                    fontWeight: 900,
                    color: '#000',
                    background: layer.color || '#BEFF01',
                    padding: '1px 5px',
                    borderRadius: 3,
                  }}
                >
                  L{layers.length - idx}
                </span>

                <input
                  className={styles.input}
                  style={{ flex: 1, marginBottom: 0, height: 26, fontSize: 11 }}
                  value={layer.label}
                  placeholder="Tên tầng phễu"
                  onChange={(e) => handleUpdateLayer(idx, { label: e.target.value })}
                />

                <ColorDot
                  value={layer.color || '#BEFF01'}
                  onChange={(c) => handleUpdateLayer(idx, { color: c })}
                  sm
                />

                {layers.length > 2 && (
                  <DeleteIconButton onClick={() => handleDeleteLayer(idx)} title="Xóa tầng này" />
                )}
              </div>

              <input
                className={styles.input}
                style={{ marginBottom: 0, height: 24, fontSize: 10.5 }}
                value={layer.sub || ''}
                placeholder="Chú thích giải thích (vd: Giữ chân bằng insight)"
                onChange={(e) => handleUpdateLayer(idx, { sub: e.target.value })}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
