import React from 'react'
import styles from '../Tabs.module.css'
import { InspectorProps, ColorDot, Slider, DeleteIconButton, ColorControlRow } from './common'
import { Button, SectionHeader } from '@/components/ui'

const PRESET_TEMPLATES = [
  {
    label: '3 Bước Thành Công',
    items: ['Bước 1: Khảo sát đối thủ cạnh tranh', 'Bước 2: Tối ưu kịch bản 3 giây đầu', 'Bước 3: Đăng tải đều đặn mỗi ngày'],
    accent: '#BEFF01',
  },
  {
    label: '4 Bước Sản Xuất',
    items: ['Nghiên cứu chủ đề Hot Trend', 'Viết Script & Thu âm giọng đọc', 'Dựng Visual Motion & Hiệu ứng', 'Xuất bản đa nền tảng Short/Reels'],
    accent: '#00D4FF',
  },
  {
    label: '3 Bí Quyết Đột Phá',
    items: ['Tập trung giữ chân người xem 80%', 'Kỹ thuật chuyển cảnh nhanh 0.5s', 'Tối ưu SEO từ khóa tìm kiếm'],
    accent: '#FFD700',
  },
  {
    label: '3 Cảnh Báo Nguy Hiểm',
    items: ['Không làm video quá dài lê thê', 'Không quên đặt tiêu đề kích thích', 'Không bỏ qua nhạc nền thịnh hành'],
    accent: '#FF3B30',
  },
]

export function NumberedListInspector({ element, updateElement, showToast }: InspectorProps) {
  const items: string[] = element.items || (element as any).listItems || ['Bước 1: Khởi động', 'Bước 2: Triển khai', 'Bước 3: Hoàn tất']
  const accent = element.accentColor || '#BEFF01'

  const handleUpdateItem = (index: number, value: string) => {
    const next = [...items]
    next[index] = value
    updateElement(element.id, { items: next })
  }

  const handleAddItem = () => {
    if (items.length >= 6) {
      showToast?.('Tối đa 6 bước để đảm bảo bố cục đẹp!')
      return
    }
    const next = [...items, `Bước ${items.length + 1}: Nội dung mới`]
    updateElement(element.id, { items: next })
    showToast?.('Đã thêm 1 bước mới')
  }

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      showToast?.('Cần giữ lại ít nhất 1 bước!')
      return
    }
    const next = items.filter((_, i) => i !== index)
    updateElement(element.id, { items: next })
  }

  return (
    <>
      <div className={styles.group}>
        <SectionHeader 
          title="Quy trình đánh số (Numbered list)" 
          action={
            <span style={{ fontSize: 9.5, opacity: 0.85, textTransform: 'uppercase', padding: '2px 5px', background: 'var(--surface-3)', borderRadius: 4, color: 'var(--text-muted)' }}>
              {items.length} bước
            </span>
          }
        />

        {/* 1. Mẫu có sẵn */}
        <div style={{ marginBottom: 10 }}>
          <span style={{ marginBottom: 5, display: 'block', fontSize: 10.5, fontWeight: 600, color: 'var(--text-sub)' }}>
            Mẫu quy trình nhanh
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {PRESET_TEMPLATES.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  updateElement(element.id, {
                    items: p.items,
                    accentColor: p.accent,
                  })
                  showToast?.(`Đã áp dụng: ${p.label}`)
                }}
                style={{
                  padding: '5px 6px',
                  fontSize: 10,
                  fontWeight: 600,
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.04)',
                  color: p.accent,
                  cursor: 'pointer',
                  textAlign: 'left',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Danh Sách Các Bước */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-sub)' }}>
              Nội Dung Từng Bước
            </span>
            <Button
              variant="secondary"
              size="xs"
              onClick={handleAddItem}
            >
              + Thêm bước
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {items.map((it, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: accent,
                    color: '#000',
                    fontSize: 10.5,
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {idx + 1}
                </span>
                <input
                  className={styles.input}
                  style={{ flex: 1, fontSize: 11, padding: '4px 6px' }}
                  value={it}
                  onChange={e => handleUpdateItem(idx, e.target.value)}
                  placeholder={`Bước ${idx + 1}...`}
                />
                {items.length > 1 && (
                  <DeleteIconButton
                    onClick={() => handleRemoveItem(idx)}
                    title="Xóa bước này"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 3. Màu sắc & Vòng tròn số */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
            {['#BEFF01', '#00D4FF', '#FFD700', '#FF3B30', '#FF007A', '#9D00FF', '#FFFFFF'].map(c => (
              <button
                key={c}
                type="button"
                onClick={() => updateElement(element.id, { accentColor: c })}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  background: c,
                  border: accent === c ? '2px solid #FFF' : '1px solid rgba(0,0,0,0.4)',
                  cursor: 'pointer',
                  boxShadow: accent === c ? '0 0 8px rgba(255,255,255,0.6)' : 'none',
                }}
              />
            ))}
          </div>

          <ColorControlRow
            label="Màu vòng tròn số"
            value={accent}
            onChange={c => updateElement(element.id, { accentColor: c })}
          />

          <ColorControlRow
            label="Màu chữ nội dung"
            value={element.color || '#FFFFFF'}
            onChange={c => updateElement(element.id, { color: c })}
          />
        </div>

        {/* 4. Font & Cỡ chữ */}
        <div className={styles.row2} style={{ marginBottom: 8 }}>
          <select
            className={styles.select}
            value={element.fontFamily || 'Be Vietnam Pro'}
            onChange={e => updateElement(element.id, { fontFamily: e.target.value })}
          >
            {['Be Vietnam Pro', 'Montserrat', 'Inter', 'Poppins', 'Lexend', 'Oswald'].map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <div className={styles.numBox}>
            <span className={styles.numLabel}>px</span>
            <input
              type="number"
              className={styles.numInput}
              value={element.fontSize || 14}
              onChange={e => updateElement(element.id, { fontSize: Number(e.target.value) })}
              min={10}
              max={32}
            />
          </div>
        </div>

        {/* 5. Chiều rộng khối */}
        <Slider
          label="Độ rộng khối"
          value={element.width || 312}
          min={240}
          max={350}
          step={2}
          display={v => `${v}px`}
          onChange={v => updateElement(element.id, { width: v })}
        />
      </div>
    </>
  )
}
