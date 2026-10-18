import React from 'react'
import tabStyles from '../Tabs.module.css'
import { InspectorProps, ColorDot, Slider, AlignRow, Toggle, ToggleRow, ColorControlRow, CardBackgroundControl } from './common'
import { FormGroup, FormRow, SectionHeader, Button, Select } from '@/components/ui'

const STYLES = [
  { value: 'classic-strip', label: 'Vạch trái (Triết lý sâu sắc)' },
  { value: 'zen-minimal', label: 'Căn giữa (Tĩnh tâm & Chữa lành)' },
  { value: 'expert-badge', label: 'Thẻ tag (Góc nhìn chuyên gia)' },
  { value: 'brutalist-block', label: 'Khung viền (Động lực bứt phá)' },
]

export function QuoteBoxInspector({ element, updateElement, showToast }: InspectorProps) {
  const currentVariant = element.variant || 'classic-strip'
  const currentAccent = element.accentColor || element.color || '#FFD700'
  const currentFontSize = element.fontSize || 16
  const currentTextAlign = element.textAlign || (currentVariant === 'zen-minimal' ? 'center' : 'left')
  const showWatermark = element.showWatermark !== false

  // 1-Click Presets: Biến đổi toàn diện Style + Màu + Bố cục
  const applyPreset = (type: 'zen' | 'philosophy' | 'expert' | 'breakthrough') => {
    switch (type) {
      case 'zen':
        updateElement(element.id, {
          variant: 'zen-minimal',
          accentColor: '#8FA89B',
          textAlign: 'center',
          authorName: element.authorName || '10 Giây Tĩnh Tâm',
          fontSize: 16,
          showWatermark: false,
        })
        showToast('Đã áp dụng mẫu: Tĩnh tâm & Chữa lành')
        break
      case 'philosophy':
        updateElement(element.id, {
          variant: 'classic-strip',
          accentColor: '#FFD700',
          textAlign: 'left',
          authorName: element.authorName || 'Chiêm Nghiệm',
          fontSize: 16,
          showWatermark: true,
        })
        showToast('Đã áp dụng mẫu: Triết lý sâu sắc')
        break
      case 'expert':
        updateElement(element.id, {
          variant: 'expert-badge',
          accentColor: '#00D4FF',
          textAlign: 'left',
          authorName: element.authorName || 'Góc Nhìn Thực Chiến',
          fontSize: 15,
          showWatermark: false,
        })
        showToast('Đã áp dụng mẫu: Góc nhìn chuyên gia')
        break
      case 'breakthrough':
        updateElement(element.id, {
          variant: 'brutalist-block',
          accentColor: '#BEFF01',
          textAlign: 'left',
          authorName: element.authorName || 'Lời Khuyên Vàng',
          fontSize: 17,
          showWatermark: false,
        })
        showToast('Đã áp dụng mẫu: Động lực bứt phá')
        break
    }
  }

  return (
    <div>
      <SectionHeader first title="Khung trích dẫn (Quote Box)" />

      {/* 1. Presets 1-Click */}
      <FormGroup
        label="Mẫu có sẵn"
        tooltip="Áp dụng nhanh phong cách: Tĩnh tâm, Triết lý, Chuyên gia, hoặc Động lực bứt phá"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          <Button
            size="xs"
            variant="secondary"
            onClick={() => applyPreset('zen')}
            leftIcon={
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8FA89B" strokeWidth="2">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-1.82.61-3.5 1.64-4.85C7.2 9.5 9.4 11 12 11c2.6 0 4.8-1.5 6.36-3.85C19.39 8.5 20 10.18 20 12c0 4.41-3.59 8-8 8z" />
              </svg>
            }
          >
            Tĩnh tâm
          </Button>
          <Button
            size="xs"
            variant="secondary"
            onClick={() => applyPreset('philosophy')}
            leftIcon={
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            }
          >
            Triết lý
          </Button>
          <Button
            size="xs"
            variant="secondary"
            onClick={() => applyPreset('expert')}
            leftIcon={
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
              </svg>
            }
          >
            Chuyên gia
          </Button>
          <Button
            size="xs"
            variant="secondary"
            onClick={() => applyPreset('breakthrough')}
            leftIcon={
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#BEFF01" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            }
          >
            Bứt phá
          </Button>
        </div>
      </FormGroup>

      {/* 2. Kiểu dáng hiển thị */}
      <FormGroup
        label="Kiểu dáng"
        tooltip="Phong cách bố cục: Vạch trái triết lý, Căn giữa tĩnh tâm, Thẻ tag chuyên gia, hoặc Khung viền bứt phá"
      >
        <Select
          options={STYLES}
          value={currentVariant}
          onChange={(val) => {
            updateElement(element.id, { variant: val })
            showToast(`Đã chuyển sang kiểu: ${STYLES.find(s => s.value === val)?.label || val}`)
          }}
          fullWidth
        />
      </FormGroup>

      {/* 3. Nội dung trích dẫn */}
      <FormGroup label="Trích dẫn" tooltip="Nhập câu danh ngôn, lời khuyên sâu sắc hoặc châm ngôn sống">
        <textarea
          className={tabStyles.textarea}
          rows={3}
          value={element.content || ''}
          onChange={(e) => updateElement(element.id, { content: e.target.value })}
          placeholder="Nhập câu danh ngôn, lời khuyên, hoặc triết lý..."
          style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', minHeight: 72, lineHeight: 1.5, marginBottom: 0 }}
        />
      </FormGroup>

      {/* 4. Tác giả / Nguồn */}
      <FormGroup label="Tác giả" tooltip="Tên tác giả, nhân vật hoặc nguồn đúc kết trích dẫn (để trống để ẩn)">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            className={tabStyles.input}
            value={element.authorName || ''}
            onChange={(e) => updateElement(element.id, { authorName: e.target.value })}
            placeholder="VD: Thiền sư Thích Nhất Hạnh / Chiêm Nghiệm"
            style={{ flex: 1, marginBottom: 0 }}
          />
          {element.authorName && (
            <Button
              size="xs"
              variant="ghost"
              onClick={() => updateElement(element.id, { authorName: '' })}
              title="Xóa tên tác giả"
            >
              Ẩn
            </Button>
          )}
        </div>
      </FormGroup>

      {/* 5. Cỡ chữ & Căn lề */}
      <FormGroup label="Bố cục">
        <Slider
          label="Cỡ chữ"
          min={13}
          max={24}
          step={1}
          value={currentFontSize}
          display={(v) => `${v}px`}
          onChange={(v) => updateElement(element.id, { fontSize: v })}
        />

        <div style={{ marginTop: '10px' }}>
          <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-sub)', marginBottom: '6px' }}>Căn lề văn bản</div>
          <AlignRow
            value={currentTextAlign}
            onChange={(align) => updateElement(element.id, { textAlign: align })}
          />
        </div>
      </FormGroup>

      {/* 6. Màu sắc & Khung thẻ */}
      <FormGroup label="Màu sắc & Khung thẻ">
        <ColorControlRow
          label="Màu chủ đạo"
          value={currentAccent}
          onChange={(c) => updateElement(element.id, { accentColor: c })}
        />

        <ColorControlRow
          label="Màu chữ"
          value={element.color || '#F0F6FC'}
          onChange={(c) => updateElement(element.id, { color: c })}
        />

        <CardBackgroundControl
          element={element}
          updateElement={updateElement}
          label="Khung nền thẻ"
          showWidth={true}
          defaultWidth={320}
          showBgColor={true}
          showRadius={true}
          defaultRadius={currentVariant === 'brutalist-block' ? 4 : (currentVariant === 'zen-minimal' ? 20 : 16)}
        />

        {currentVariant === 'classic-strip' && (
          <div style={{ marginTop: 6 }}>
            <ToggleRow label="Ngoặc kép chìm">
              <Toggle
                checked={showWatermark}
                onChange={(checked) => updateElement(element.id, { showWatermark: checked })}
              />
            </ToggleRow>
          </div>
        )}
      </FormGroup>
    </div>
  )
}
