import React from 'react'
import styles from '../Tabs.module.css'
import { InspectorProps, ColorControlRow, Slider } from './common'
import { SegmentedControl, SectionHeader, FormGroup } from '@/components/ui'

const ENGINES = [
  { value: 'glass', label: 'Glass' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'google', label: 'Google' },
  { value: 'youtube', label: 'YouTube' },
]

const PRESET_COLORS = ['#00D4FF', '#BEFF01', '#FE2C55', '#FFD700', '#FF3B30', '#FFFFFF']

export function FakeSearchInspector({ element, updateElement, showToast }: InspectorProps) {
  const search = element.searchData || {
    keyword: element.content || 'Cách làm video viral...',
    placeholder: 'Tìm kiếm trên mạng...',
    engine: 'glass',
    typingSpeed: 2,
  }

  const updateSearch = (patch: Partial<typeof search>) => {
    const updated = { ...search, ...patch }
    updateElement(element.id, { searchData: updated, content: updated.keyword })
  }

  const currentAccent = element.accentColor || search.accentColor || '#00D4FF'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box' }}>
      <SectionHeader 
        first
        title="Thanh tìm kiếm (Fake search)"
        badge={
          <span style={{ fontSize: 9.5, opacity: 0.85, textTransform: 'uppercase', padding: '2px 5px', background: 'var(--surface-3)', borderRadius: 4, color: 'var(--text-muted)' }}>
            {search.engine || 'glass'}
          </span>
        }
      />

      {/* Engine Switcher */}
      <FormGroup label="Giao diện tìm kiếm">
        <SegmentedControl
          options={ENGINES}
          value={search.engine || 'glass'}
          onChange={(val) => {
            updateSearch({ engine: val as any })
            showToast?.(`Đã chuyển sang ${val}`)
          }}
          size="xs"
          fullWidth
        />
      </FormGroup>

      {/* Keyword Input */}
      <FormGroup label="Từ khóa tìm kiếm (gõ chữ)">
        <input
          type="text"
          className={styles.input}
          value={search.keyword || ''}
          onChange={(e) => updateSearch({ keyword: e.target.value })}
          placeholder="Nhập từ khóa tìm kiếm..."
        />
      </FormGroup>

      {/* Badge / Tag (Optional) */}
      <FormGroup label="Nhãn phụ" tooltip="Để trống nếu không dùng (vd: Xu hướng / Kết quả)">
        <input
          type="text"
          className={styles.input}
          value={search.autoSearchBadge || ''}
          onChange={(e) => updateSearch({ autoSearchBadge: e.target.value })}
          placeholder="Để trống nếu không dùng..."
        />
      </FormGroup>

      {/* Typing Speed Slider */}
      <Slider
        label="Tốc độ gõ chữ"
        min={1}
        max={4}
        step={1}
        value={search.typingSpeed || 2}
        display={v => v === 1 ? 'Nhanh (1f)' : v === 3 ? 'Chậm (3f)' : v === 4 ? 'Rất chậm (4f)' : 'Vừa (2f)'}
        onChange={(v) => updateSearch({ typingSpeed: v })}
      />

      {/* Accent Color */}
      <SectionHeader title="Giao diện & màu sắc" />
      <ColorControlRow
        label="Màu điểm nhấn"
        value={currentAccent}
        onChange={(c) => {
          updateElement(element.id, {
            accentColor: c,
            searchData: { ...search, accentColor: c },
          })
        }}
      />
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 6, marginBottom: 8, paddingLeft: 2 }}>
        {PRESET_COLORS.map((col) => {
          const isActive = currentAccent === col
          return (
            <button
              key={col}
              type="button"
              onClick={() => {
                updateElement(element.id, {
                  accentColor: col,
                  searchData: { ...search, accentColor: col },
                })
              }}
              style={{
                width: 20,
                height: 20,
                borderRadius: 5,
                background: col,
                border: isActive ? '2px solid #FFFFFF' : '1px solid rgba(255,255,255,0.2)',
                boxShadow: isActive ? '0 0 8px rgba(255,255,255,0.6)' : 'none',
                cursor: 'pointer',
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
