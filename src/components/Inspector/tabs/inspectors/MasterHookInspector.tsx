import React, { useState } from 'react'
import tabStyles from '../Tabs.module.css'
import styles from './MasterHookInspector.module.css'
import { InspectorProps, ColorDot, TypographyControl } from './common'
import { HookLayoutStyle } from '@/types/scene'
import { Button, FormGroup, FormRow } from '@/components/ui'
import { Select, SelectOption } from '@/components/ui/Select'
import { useHookLibraryStore } from '@/store/useHookLibraryStore'
import { useEditorStore } from '@/store/useEditorStore'
import { SCRIPT_STUDIO_FONTS } from '@/config/fontRegistry'

const LAYOUT_OPTIONS: { id: HookLayoutStyle; label: string }[] = [
  // Kinetic Layouts (Pro)
  { id: 'kinetic-contrast', label: 'Kinetic Contrast (Đối lập Size)' },
  { id: 'kinetic-bold-script', label: 'Kinetic Bold & Script' },
  { id: 'kinetic-solid-box', label: 'Kinetic Solid Box' },
  { id: 'kinetic-giant-stat', label: 'Kinetic Giant Stat (Số liệu lớn)' },
  { id: 'kinetic-strip-highlight', label: 'Kinetic Strip Highlight' },
  // Procedural Generative Layouts
  { id: 'cinematic-lower-third', label: 'Cinematic Lower Third (Điện ảnh đáy)' },
  { id: 'kinetic-word-weight', label: 'Kinetic Word Weight (Sóng phân cấp chữ)' },
  // Classic Layouts
  { id: 'stacked', label: 'Classic Stacked (Kính mờ)' },
  { id: 'hazard-alert', label: 'Hazard Alert (Cảnh báo)' },
  { id: 'sticker-words', label: 'Sticker Words (Nhãn nổi)' },
  { id: 'cyber-hud', label: 'Cyber HUD (Công nghệ)' },
  { id: 'split-versus', label: 'Split Versus (Đối đầu)' },
  { id: 'luxury-zen', label: 'Luxury Zen (Tối giản)' },
  { id: 'cta-social', label: 'CTA Social Follow' },
  { id: 'cta-pill', label: 'CTA Pill Button' },
  { id: 'cta-comment', label: 'CTA Comment Bot' },
  { id: 'cta-bookmark', label: 'CTA Bookmark Save' },
]

// Các bố cục có phong cách highlight định hình sẵn, không nên hiển thị dropdown tùy biến
const LAYOUTS_WITH_FIXED_HIGHLIGHT: HookLayoutStyle[] = [
  'sticker-words',
  'hazard-alert',
  'kinetic-solid-box',
  'kinetic-giant-stat',
  'split-versus',
  'cta-social',
  'cta-pill',
  'cta-comment',
  'cta-bookmark',
]

const HIGHLIGHT_STYLE_OPTIONS: SelectOption[] = [
  {
    value: 'solid-box',
    label: 'Khối màu đặc',
    icon: (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
        <rect x="2" y="3" width="12" height="10" rx="2" />
      </svg>
    ),
  },
  {
    value: 'marker-circle',
    label: 'Vòng vẽ tay',
    icon: (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
        <ellipse cx="8" cy="8" rx="6" ry="5" />
      </svg>
    ),
  },
  {
    value: 'underline-thick',
    label: 'Gạch chân đậm',
    icon: (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
        <path d="M3 13h10v2.5H3z" />
        <path d="M5 2h2v6a1 1 0 002 0V2h2v6a3 3 0 01-6 0V2z" />
      </svg>
    ),
  },
  {
    value: 'outline-box',
    label: 'Viền khung',
    icon: (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="12" height="10" rx="2" />
      </svg>
    ),
  },
  {
    value: 'text-glow',
    label: 'Chữ phát sáng',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" />
      </svg>
    ),
  },
]

export function MasterHookInspector({ element, updateElement, showToast }: InspectorProps) {
  const hookData = element.hookData || { archetype: 'tips', badgeText: '', heroTitle: '' }
  const currentLayout = hookData.layoutStyle || 'stacked'
  const currentAccent = element.accentColor || hookData.accentColor || 'var(--accent)'
  
  const { isClientMode, toggleClientMode, saveSceneAsTemplate } = useHookLibraryStore()
  const currentScene = useEditorStore(s => s.scenes[s.currentSceneIdx])

  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')

  const handleSaveAsTemplate = async () => {
    if (!currentScene) return
    try {
      const name = templateName.trim() || `Mẫu Hook ${hookData.heroTitle.slice(0, 15) || '3s'}`
      await saveSceneAsTemplate(currentScene, name)
      showToast(`Đã lưu mẫu vào Thư Viện Hook: "${name}"`)
      setIsSavingTemplate(false)
      setTemplateName('')
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi lưu template')
    }
  }

  return (
    <div className={styles.container}>
      {/* ── 1. CLIENT / OWNER MODE BANNER ── */}
      <div className={`${styles.modeBanner} ${isClientMode ? styles.modeBannerClient : styles.modeBannerExpert}`}>
        <div className={styles.modeInfo}>
          <div className={`${styles.modeTitle} ${isClientMode ? styles.modeTitleClient : styles.modeTitleExpert}`}>
            {isClientMode ? 'CHẾ ĐỘ KHÁCH HÀNG' : 'CHẾ ĐỘ CHUYÊN GIA'}
          </div>
          <div className={styles.modeDesc}>
            {isClientMode ? 'Bố cục đã khoá. Chỉ sửa nội dung.' : 'Toàn quyền chỉnh layout & lưu template.'}
          </div>
        </div>

        <button
          onClick={toggleClientMode}
          title={isClientMode ? 'Mở khoá quyền Chuyên gia' : 'Khoá sang Chế độ Khách hàng'}
          className={styles.modeBtn}
        >
          {isClientMode ? 'Mở khoá' : 'Khoá giao khách'}
        </button>
      </div>

      <div className={styles.formContent}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>Nội dung Hook</span>
          <span className={styles.layoutTag}>
            {hookData.layoutStyle || 'kinetic'}
          </span>
        </div>

        {/* 2. BỐ CỤC HIỂN THỊ (Chỉ hiển thị khi KHÔNG phải Client Mode) */}
        {!isClientMode && (
          <div className={styles.layoutDivider}>
            <FormGroup label="Bố cục động (Kinetic & Classic)" style={{ marginBottom: 0 }}>
              <select
                className={tabStyles.select}
                value={currentLayout}
                onChange={e => {
                  const newLayout = e.target.value as HookLayoutStyle
                  updateElement(element.id, {
                    hookData: { ...hookData, layoutStyle: newLayout },
                  })
                  const found = LAYOUT_OPTIONS.find(o => o.id === newLayout)
                  showToast(`Bố cục: ${found?.label || newLayout}`)
                }}
              >
                <optgroup label="BỐ CỤC ĐỘNG (KINETIC)">
                  {LAYOUT_OPTIONS.filter(o => o.id.startsWith('kinetic-')).map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </optgroup>
                <optgroup label="BỐ CỤC TIÊU CHUẨN (CLASSIC)">
                  {LAYOUT_OPTIONS.filter(o => !o.id.startsWith('kinetic-')).map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </optgroup>
              </select>
            </FormGroup>
          </div>
        )}

        {/* Tầng 1: Huy hiệu (Badge) */}
        <FormGroup label="Huy hiệu đầu dòng">
          <input
            className={tabStyles.input}
            value={hookData.badgeText || ''}
            onChange={e => {
              updateElement(element.id, {
                hookData: { ...hookData, badgeText: e.target.value }
              })
            }}
            placeholder="VD: CẢNH BÁO, BÍ KÍP GIỮ CHÂN..."
          />
        </FormGroup>

        {/* Tầng 2: Tiêu đề chính (Hero Title) */}
        <FormGroup label="Tiêu đề chính (Hero Title)">
          <textarea
            className={tabStyles.input}
            rows={2}
            style={{ resize: 'vertical', minHeight: 46, fontWeight: 700 }}
            value={hookData.heroTitle || element.content || ''}
            onChange={e => {
              const val = e.target.value
              updateElement(element.id, {
                content: val,
                hookData: { ...hookData, heroTitle: val }
              })
            }}
            placeholder="VD: STOP THE SCROLL..."
          />
        </FormGroup>

        {/* Cài đặt Font chữ */}
        <TypographyControl
          element={element}
          updateElement={updateElement}
          showToast={showToast}
          showColor={false}
          showAlign={false}
          showSpacing={false}
          showLineHeight={false}
        />

        {/* Script Line 2 & Font Selection (Hiện khi dùng kinetic-bold-script hoặc có heroLine2) */}
        {(currentLayout === 'kinetic-bold-script' || hookData.heroLine2 !== undefined) && (
          <>
            <FormGroup label="Dòng viết tay nghệ thuật">
              <input
                className={tabStyles.input}
                style={{
                  color: currentAccent,
                  fontFamily: `"${hookData.scriptFontFamily || 'Dancing Script'}", cursive`,
                }}
                value={hookData.heroLine2 || ''}
                onChange={e => {
                  updateElement(element.id, {
                    hookData: { ...hookData, heroLine2: e.target.value }
                  })
                }}
                placeholder="VD: bạn phải biết điều này..."
              />
            </FormGroup>

            <FormGroup label="Font chữ viết tay:" inline>
              <select
                className={tabStyles.select}
                value={hookData.scriptFontFamily || 'Dancing Script'}
                onChange={e => {
                  updateElement(element.id, {
                    hookData: { ...hookData, scriptFontFamily: e.target.value }
                  })
                }}
              >
                {SCRIPT_STUDIO_FONTS.map(fontName => (
                  <option key={fontName} value={fontName}>{fontName}</option>
                ))}
              </select>
            </FormGroup>
          </>
        )}

        {/* Giant Stat Value & Label (Hiện khi dùng kinetic-giant-stat) */}
        {currentLayout === 'kinetic-giant-stat' && (
          <FormRow columns={2}>
            <FormGroup label="Số lớn">
              <input
                className={tabStyles.input}
                style={{ fontWeight: 900, color: currentAccent }}
                value={hookData.statValue || '99%'}
                onChange={e => {
                  updateElement(element.id, {
                    hookData: { ...hookData, statValue: e.target.value }
                  })
                }}
                placeholder="99%, 10X..."
              />
            </FormGroup>
            <FormGroup label="Nhãn số liệu">
              <input
                className={tabStyles.input}
                value={hookData.statLabel || ''}
                onChange={e => {
                  updateElement(element.id, {
                    hookData: { ...hookData, statLabel: e.target.value }
                  })
                }}
                placeholder="NGƯỜI MỚI BỎ CUỘC..."
              />
            </FormGroup>
          </FormRow>
        )}

        {/* Split Versus Inputs (Chỉ hiện khi chọn layout Đối Đầu) */}
        {currentLayout === 'split-versus' && (
          <FormGroup label="Nội dung đối đầu (Trái vs Phải)">
            <FormRow columns={2} style={{ marginBottom: 0 }}>
              <input
                className={tabStyles.input}
                value={hookData.versusLeft || 'LỰA CHỌN A'}
                onChange={e => {
                  updateElement(element.id, {
                    hookData: { ...hookData, versusLeft: e.target.value }
                  })
                }}
                placeholder="Trái..."
              />
              <input
                className={tabStyles.input}
                value={hookData.versusRight || 'LỰA CHỌN B'}
                onChange={e => {
                  updateElement(element.id, {
                    hookData: { ...hookData, versusRight: e.target.value }
                  })
                }}
                placeholder="Phải..."
              />
            </FormRow>
          </FormGroup>
        )}

        {/* Từ khoá nổi bật (Highlight Words) */}
        <FormGroup label="Từ khoá nổi bật (cách nhau bằng dấu phẩy)">
          <input
            className={tabStyles.input}
            value={(hookData.highlightWords || []).join(', ')}
            onChange={e => {
              const words = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              updateElement(element.id, {
                hookData: { ...hookData, highlightWords: words }
              })
            }}
            placeholder="VD: DỪNG LẠI, MẤT TIỀN..."
          />
        </FormGroup>

        {/* Tầng 3: Mô tả phụ */}
        <FormGroup label="Mô tả phụ / Câu khơi gợi tò mò">
          <textarea
            className={tabStyles.input}
            rows={2}
            style={{ resize: 'vertical', minHeight: 44 }}
            value={hookData.subText || ''}
            onChange={e => {
              updateElement(element.id, {
                hookData: { ...hookData, subText: e.target.value }
              })
            }}
            placeholder="VD: Lý do 90% video của bạn không có view..."
          />
        </FormGroup>

        {/* Màu chủ đạo & Highlight Style */}
        <FormRow columns={2} style={{ marginBottom: 0 }}>
          <FormGroup
            label={
              <span>
                Màu chủ đạo {isClientMode && <span style={{ color: 'var(--danger)', fontSize: 'var(--font-xs)' }}>(Đã khoá)</span>}
              </span>
            }
          >
            <div className={styles.colorPickerRow}>
              {isClientMode ? (
                <div
                  className={styles.lockedColorSwatch}
                  style={{ background: element.accentColor || hookData.accentColor || 'var(--accent)' }}
                  title="Màu đã bị khoá trong chế độ Khách hàng"
                />
              ) : (
                <ColorDot
                  value={element.accentColor || hookData.accentColor || 'var(--accent)'}
                  onChange={c => {
                    updateElement(element.id, {
                      accentColor: c,
                      hookData: { ...hookData, accentColor: c }
                    })
                  }}
                />
              )}
            </div>
          </FormGroup>

          {/* Kiểu Highlight: Tự động phát hiện layout cố định hay tùy biến */}
          {LAYOUTS_WITH_FIXED_HIGHLIGHT.includes(currentLayout) ? (
            <FormGroup label="Kiểu Highlight">
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 6,
                  height: 30,
                  padding: '0 10px', 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px dashed var(--border)', 
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--font-xs)',
                  color: 'var(--text-muted)'
                }}
                title="Bố cục này sử dụng phong cách highlight đặc trưng riêng"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <span>Cố định theo bố cục</span>
              </div>
            </FormGroup>
          ) : !isClientMode ? (
            <FormGroup label="Kiểu Highlight">
              <Select
                options={HIGHLIGHT_STYLE_OPTIONS}
                value={hookData.highlightStyle || 'solid-box'}
                onChange={val => {
                  updateElement(element.id, {
                    hookData: { ...hookData, highlightStyle: val as any }
                  })
                }}
                size="sm"
                fullWidth
              />
            </FormGroup>
          ) : (
            <FormGroup label="Kiểu Highlight">
              <span style={{ fontSize: 'var(--font-sm)', color: currentAccent }}>
                {HIGHLIGHT_STYLE_OPTIONS.find(o => o.value === hookData.highlightStyle)?.label || hookData.highlightStyle || 'Khối màu đặc'}
              </span>
            </FormGroup>
          )}
        </FormRow>

        {/* ── 3. NÚT LƯU THÀNH TEMPLATE (Chỉ hiện trong Owner Mode) ── */}
        {!isClientMode && (
          <div className={styles.saveTemplateSection}>
            {!isSavingTemplate ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsSavingTemplate(true)}
                fullWidth
              >
                Lưu thành mẫu Hook mới
              </Button>
            ) : (
              <div className={styles.saveTemplateBox}>
                <FormGroup label="Đặt tên mẫu:" style={{ marginBottom: 0 }}>
                  <input
                    className={tabStyles.input}
                    value={templateName}
                    onChange={e => setTemplateName(e.target.value)}
                    placeholder="VD: Hook Chốt Sale 5s..."
                    autoFocus
                  />
                </FormGroup>
                <FormRow style={{ marginBottom: 0 }}>
                  <Button variant="primary" size="xs" onClick={handleSaveAsTemplate} fullWidth>
                    Xác nhận lưu
                  </Button>
                  <Button variant="ghost" size="xs" onClick={() => setIsSavingTemplate(false)} fullWidth>
                    Huỷ
                  </Button>
                </FormRow>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

