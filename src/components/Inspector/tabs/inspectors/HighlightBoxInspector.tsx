import React from 'react'
import tabStyles from '../Tabs.module.css'
import { InspectorProps, ColorDot, Slider, AlignRow, Toggle, ToggleRow, ColorControlRow, CardBackgroundControl } from './common'
import { SegmentedControl, FormGroup, FormRow, SectionHeader, Button, Select } from '@/components/ui'
import { resolveHighlightVariant } from '@/config/highlightBoxLayout'

const STYLES = [
  { value: 'auto', label: 'Tự động theo nội dung' },
  { value: 'callout-card', label: 'Hộp kính (Callout Card)' },
  { value: 'accent-strip', label: 'Vạch trái (Accent Strip)' },
  { value: 'glow-pill', label: 'Viên thuốc (Glow Pill)' },
  { value: 'bullet-list', label: 'Từng hàng (Bullet List)' },
  { value: 'multi-pill', label: 'Sticker (Hormozi Pills)' },
]

const ICONS = [
  { value: 'none', label: 'Không' },
  { value: 'sparkle', label: 'Sao sáng' },
  { value: 'tip', label: 'Bóng đèn' },
  { value: 'alert', label: 'Cảnh báo' },
  { value: 'target', label: 'Mục tiêu' },
  { value: 'pin', label: 'Ghim' },
  { value: 'cta', label: 'Chuông' },
  { value: 'quote', label: 'Trích dẫn' },
  { value: 'heart', label: 'Trái tim' },
  { value: 'leaf', label: 'Chiếc lá' },
]

const SKINS = [
  { value: 'auto', label: 'Tự động theo theme' },
  { value: 'glass', label: 'Kính phát sáng' },
  { value: 'editorial', label: 'Biên tập (tạp chí)' },
  { value: 'paper', label: 'Giấy mềm' },
  { value: 'marker', label: 'Bút dạ' },
]

const BADGE_MODES = [
  { value: 'auto', label: 'Tự động' },
  { value: 'number', label: 'Số thứ tự' },
  { value: 'icon', label: 'Icon' },
  { value: 'none', label: 'Ẩn' },
]

export function HighlightBoxInspector({ element, updateElement, showToast, setInspector }: InspectorProps) {
  const currentVariant = element.variant || 'auto'
  // Kiểu thực tế đang render (khi 'auto' thì suy từ nội dung) — SSOT highlightBoxLayout
  const resolvedVariant = resolveHighlightVariant(element)
  const currentIcon = element.boxIcon || (element.badgeMode === 'icon' ? 'sparkle' : 'none')

  // Áp dụng Preset 1-Click siêu tốc
  const applyPreset = (type: 'tip' | 'alert' | 'insight' | 'cta') => {
    switch (type) {
      case 'tip':
        updateElement(element.id, {
          variant: 'callout-card',
          boxIcon: 'tip',
          accentColor: '#FFD700',
          glowEffect: true,
          radius: 16,
        })
        showToast('Đã áp dụng mẫu: Mẹo hay')
        break
      case 'alert':
        updateElement(element.id, {
          variant: 'callout-card',
          boxIcon: 'alert',
          accentColor: '#FF3B30',
          glowEffect: true,
          radius: 16,
        })
        showToast('Đã áp dụng mẫu: Cảnh báo')
        break
      case 'insight':
        updateElement(element.id, {
          variant: 'accent-strip',
          boxIcon: 'sparkle',
          accentColor: '#00D4FF',
          glowEffect: false,
          radius: 12,
        })
        showToast('Đã áp dụng mẫu: Bài học đắt giá')
        break
      case 'cta':
        updateElement(element.id, {
          variant: 'glow-pill',
          boxIcon: 'cta',
          accentColor: '#BEFF01',
          textAlign: 'center',
          glowEffect: true,
          radius: 999,
        })
        showToast('Đã áp dụng mẫu: Kêu gọi CTA')
        break
    }
  }

  return (
    <div>
      <SectionHeader first title="Hộp điểm nhấn" />

      {/* 1. Presets 1-Click Siêu Tốc */}
      <FormGroup
        label="Mẫu có sẵn"
        tooltip="Áp dụng nhanh bộ màu sắc, icon và kiểu dáng thiết kế chuẩn viral"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          <Button 
            size="xs" 
            variant="secondary" 
            onClick={() => applyPreset('tip')}
            leftIcon={
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3 6h8c1.5-1.5 3-3.5 3-6a7 7 0 0 0-7-7z"/></svg>
            }
          >
            Mẹo hay
          </Button>
          <Button 
            size="xs" 
            variant="secondary" 
            onClick={() => applyPreset('alert')}
            leftIcon={
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            }
          >
            Cảnh báo
          </Button>
          <Button 
            size="xs" 
            variant="secondary" 
            onClick={() => applyPreset('insight')}
            leftIcon={
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="2"><path d="M12 3l1.9 5.9L20 10.8l-4.8 4.7 1.2 5.5L12 17.7 7.6 21l1.2-5.5L4 10.8l6.1-1.9L12 3z"/></svg>
            }
          >
            Bài học
          </Button>
          <Button 
            size="xs" 
            variant="secondary" 
            onClick={() => applyPreset('cta')}
            leftIcon={
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#BEFF01" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            }
          >
            Kêu gọi CTA
          </Button>
        </div>
      </FormGroup>

      {/* 2. Kiểu Dáng Hiển Thị */}
      <FormGroup
        label="Kiểu dáng"
        tooltip="Tự động: 1 câu thành hộp kính, nhiều dòng thành danh sách, câu kêu gọi ngắn (Follow, Lưu, Bấm...) thành viên thuốc. Hoặc chọn cố định một kiểu."
      >
        <Select
          options={STYLES}
          value={currentVariant}
          onChange={(val) => {
            updateElement(element.id, { variant: val })
            showToast(`Đã chuyển sang kiểu: ${val}`)
          }}
          size="sm"
          fullWidth
        />
      </FormGroup>

      {/* 2B. Phong cách theo tông */}
      <FormGroup
        label="Phong cách"
        tooltip="Tự động theo theme: tech dùng kính phát sáng, sang trọng dùng kiểu tạp chí, pastel dùng giấy mềm, ấm áp dùng bút dạ. Chỉ đổi màu sắc, không đổi bố cục."
      >
        <Select
          options={SKINS}
          value={element.highlightSkin || 'auto'}
          onChange={(val) => updateElement(element.id, { highlightSkin: val as any })}
          size="sm"
          fullWidth
        />
      </FormGroup>

      {/* 3. Icon Vector */}
      <FormGroup
        label="Biểu tượng"
        tooltip="Icon vector SVG trang trí trên góc trái thẻ điểm nhấn"
      >
        <select
          className={tabStyles.select}
          value={currentIcon}
          onChange={(e) => {
            const val = e.target.value
            updateElement(element.id, { boxIcon: val === 'none' ? undefined : (val as any) })
            showToast(`Đã cập nhật biểu tượng`)
          }}
        >
          {ICONS.map(ic => (
            <option key={ic.value} value={ic.value}>{ic.label}</option>
          ))}
        </select>
      </FormGroup>

      {/* 4. Chế độ đánh số khi chọn Từng Hàng */}
      {resolvedVariant === 'bullet-list' && (
        <FormGroup
          label="Huy hiệu"
          tooltip="Tự động đánh số thứ tự 1, 2, 3... hoặc dùng icon sao sáng đầu mỗi dòng"
        >
          <SegmentedControl
            options={BADGE_MODES}
            value={element.badgeMode || 'auto'}
            onChange={(val) => {
              updateElement(element.id, { badgeMode: val as any })
              showToast(`Chế độ huy hiệu: ${val}`)
            }}
            size="xs"
            fullWidth
          />
        </FormGroup>
      )}

      {/* 4B. Nhấn số liệu & nhịp theo lời thoại */}
      <FormGroup
        label="Nhấn số liệu"
        inline
        tooltip="Tự in đậm và tô màu nhấn các cụm số như 90%, 10x, 3 triệu mà không cần định dạng thủ công"
      >
        <Toggle
          checked={element.emphasizeNumbers !== false}
          onChange={v => updateElement(element.id, { emphasizeNumbers: v })}
        />
      </FormGroup>
      {resolvedVariant === 'bullet-list' && (
        <FormGroup
          label="Hiện theo lời thoại"
          inline
          tooltip="Mỗi dòng xuất hiện đúng lúc giọng đọc nhắc tới từ khoá của dòng đó. Dòng không khớp lời thoại sẽ hiện lần lượt theo nhịp mặc định."
        >
          <Toggle
            checked={element.revealOnVoice !== false}
            onChange={v => updateElement(element.id, { revealOnVoice: v })}
          />
        </FormGroup>
      )}

      {/* 5. Nội Dung Chữ */}
      <FormGroup
        label="Nội dung"
        tooltip="Nhập 1 câu đúc kết hoặc xuống dòng nhiều lần để tách thành danh sách các ý"
      >
        <textarea
          className={tabStyles.input}
          rows={3}
          style={{ resize: 'vertical', minHeight: 68, fontFamily: 'inherit' }}
          value={element.content || ''}
          onChange={e => {
            const val = e.target.value
            updateElement(element.id, { content: val })
            setInspector({ textContent: val })
          }}
          placeholder="Mẹo sửa: Gạch chân từ khóa ngay từ giây đầu tiên..."
        />
      </FormGroup>

      {/* 6. Typography: Font & Size */}
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
        <FormGroup label="Cỡ chữ" style={{ marginBottom: 0 }}>
          <div className={tabStyles.numBox}>
            <span className={tabStyles.numLabel}>px</span>
            <input
              type="number"
              className={tabStyles.numInput}
              value={element.fontSize || 14}
              min={10}
              max={36}
              onChange={e => updateElement(element.id, { fontSize: +e.target.value })}
            />
          </div>
        </FormGroup>
      </FormRow>

      {/* 7. Màu sắc chữ & Bố cục */}
      <div style={{ marginTop: 'var(--space-2)' }}>
        <ColorControlRow
          label="Màu chữ"
          value={element.color || 'var(--text)'}
          onChange={c => updateElement(element.id, { color: c })}
        />

        <div style={{ margin: 'var(--space-2) 0' }}>
          <AlignRow value={element.textAlign || 'left'} onChange={a => updateElement(element.id, { textAlign: a })} />
        </div>
      </div>

      {/* 8. Khung nền thẻ & Hiệu ứng */}
      <div style={{ marginTop: 'var(--space-2)' }}>
        <CardBackgroundControl
          element={element}
          updateElement={updateElement}
          label="Khung nền thẻ"
          showWidth={true}
          showBgColor={true}
          showStrokeColor={true}
          showRadius={true}
          showGlow={true}
          defaultRadius={16}
          // Rỗng: bật khung nền không ghi màu cứng → nền kính theo theme (--card-bg)
          defaultBgColor=""
        />
      </div>
    </div>
  )
}

