import React, { useState } from 'react'
import styles from '../SettingsModal.module.css'
import { useEditorStore } from '@/store/useEditorStore'
import { useSettingsStore } from '@/store/useSettingsStore'
import { AvatarUploader } from './components/AvatarUploader'
import { THEME_PALETTES, resolveThemePalette } from '@/utils/themeResolver'

export const COLOR_PRESETS = [
  { name: 'Neon Lime', hex: '#BEFF01' },
  { name: 'Cyan Glow', hex: '#00D4FF' },
  { name: 'Neon Coral', hex: '#FF5544' },
  { name: 'Gold Amber', hex: '#FFD700' },
  { name: 'Cyber Purple', hex: '#A855F7' },
  { name: 'Emerald Mint', hex: '#00FF88' },
]

export const FONT_OPTIONS = [
  'Be Vietnam Pro',
  'Inter',
  'Plus Jakarta Sans',
  'Montserrat',
  'Roboto',
  'Oswald',
  'Space Grotesk',
  'Lexend'
]

type ThemeCategoryFilter = 'all' | 'dark' | 'light'

export const BrandingTab: React.FC = () => {
  const {
    scenes,
    currentSceneIdx,
    brandingSettings,
    updateBrandingSettings,
    applyAvatarToAllScenes,
    applyFontToAllScenes,
    applyBrandColorToAllScenes,
    applyThemePaletteToAllScenes,
    showToast
  } = useEditorStore()

  const { setBrandColor, setDefaultFont } = useSettingsStore()
  const [filterCategory, setFilterCategory] = useState<ThemeCategoryFilter>('all')

  const currentScene = scenes[currentSceneIdx] || scenes[0]
  const activePalette = resolveThemePalette(currentScene?.paletteId || (currentScene as any)?.colorTheme || 'neon-night')

  const handleSelectPalette = (palId: string) => {
    applyThemePaletteToAllScenes(palId, { syncBrandAccent: true, syncBgColor: true })
    const pal = THEME_PALETTES[palId]
    if (pal) {
      setBrandColor(pal.tokens.accent)
    }
    showToast(`Đã áp dụng Theme: ${pal?.label || palId} cho toàn bộ Scenes!`, 2000)
  }

  const handleSelectBrandColor = (col: string) => {
    updateBrandingSettings({ brandColor: col })
    setBrandColor(col)
    applyBrandColorToAllScenes(col)
    showToast(`Đã đổi màu thương hiệu: ${col}`, 1800)
  }

  const paletteEntries = Object.values(THEME_PALETTES).filter(pal => {
    if (filterCategory === 'dark') return pal.spaceMode === 'dark'
    if (filterCategory === 'light') return pal.spaceMode === 'daylight-warm'
    return true
  })

  return (
    <>
      {/* 1. BẢNG MÀU THEME CHO VIDEO (5-LAYER DESIGN TOKENS) */}
      <div className={styles.paletteSection}>
        <div className={styles.label}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Bảng màu nội dung video (Video Brand Palette)</span>
            <span style={{ fontSize: 10, color: 'var(--accent, #BEFF01)', fontWeight: 700 }}>
              {activePalette.label}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              type="button"
              onClick={() => setFilterCategory('all')}
              style={{
                fontSize: 10,
                padding: '2px 8px',
                borderRadius: 4,
                border: '1px solid',
                borderColor: filterCategory === 'all' ? 'var(--accent, #BEFF01)' : 'rgba(255,255,255,0.1)',
                background: filterCategory === 'all' ? 'rgba(190,255,1,0.1)' : 'transparent',
                color: filterCategory === 'all' ? 'var(--accent, #BEFF01)' : 'rgba(255,255,255,0.6)',
                cursor: 'pointer'
              }}
            >
              Tất cả (9)
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('dark')}
              style={{
                fontSize: 10,
                padding: '2px 8px',
                borderRadius: 4,
                border: '1px solid',
                borderColor: filterCategory === 'dark' ? 'var(--accent, #BEFF01)' : 'rgba(255,255,255,0.1)',
                background: filterCategory === 'dark' ? 'rgba(190,255,1,0.1)' : 'transparent',
                color: filterCategory === 'dark' ? 'var(--accent, #BEFF01)' : 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
              Dark Tech (4)
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('light')}
              style={{
                fontSize: 10,
                padding: '2px 8px',
                borderRadius: 4,
                border: '1px solid',
                borderColor: filterCategory === 'light' ? 'var(--accent, #BEFF01)' : 'rgba(255,255,255,0.1)',
                background: filterCategory === 'light' ? 'rgba(190,255,1,0.1)' : 'transparent',
                color: filterCategory === 'light' ? 'var(--accent, #BEFF01)' : 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
              Sáng & Pastel (5)
            </button>
          </div>
        </div>

        <div className={styles.hint}>
          Áp dụng cho nền video, thẻ kính mờ, chữ và biểu đồ trên khung hình video 9:16. Giao diện Studio luôn được giữ tối trung tính để bảo vệ mắt và đánh giá màu chính xác nhất.
        </div>

        <div className={styles.paletteGrid}>
          {paletteEntries.map(pal => {
            const isActive = activePalette.id === pal.id
            const isDaylight = pal.spaceMode === 'daylight-warm'
            return (
              <div
                key={pal.id}
                className={`${styles.paletteCard} ${isActive ? styles.paletteCardActive : ''}`}
                onClick={() => handleSelectPalette(pal.id)}
                title={`Áp dụng Theme ${pal.label}`}
              >
                <div className={styles.paletteHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className={styles.paletteLabel}>{pal.label}</span>
                    {isActive && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #BEFF01)" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>
                  <span
                    className={styles.paletteBadge}
                    style={{
                      background: isDaylight ? 'rgba(255, 180, 0, 0.15)' : 'rgba(0, 212, 255, 0.15)',
                      color: isDaylight ? '#FFB800' : '#00D4FF',
                      border: `1px solid ${isDaylight ? 'rgba(255, 180, 0, 0.3)' : 'rgba(0, 212, 255, 0.3)'}`
                    }}
                  >
                    {isDaylight ? 'Daylight' : 'Dark'}
                  </span>
                </div>

                <div className={styles.paletteDesc}>
                  {pal.desc}
                </div>

                {/* 5-Color Swatch Strip: Bg | Surface | Accent | Text | Chart Series 1 */}
                <div className={styles.paletteSwatches}>
                  <div className={styles.swatchItem} style={{ background: pal.tokens.bg }} title={`Nền: ${pal.tokens.bg}`} />
                  <div className={styles.swatchItem} style={{ background: pal.tokens.surface }} title={`Thẻ kính: ${pal.tokens.surface}`} />
                  <div className={styles.swatchItem} style={{ background: pal.tokens.accent }} title={`Màu chủ đạo: ${pal.tokens.accent}`} />
                  <div className={styles.swatchItem} style={{ background: pal.tokens.text }} title={`Chữ: ${pal.tokens.text}`} />
                  <div className={styles.swatchItem} style={{ background: pal.chartTokens.chartSeries[0] }} title={`Đồ thị: ${pal.chartTokens.chartSeries[0]}`} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 2. TÁC GIẢ & HANDLE */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div className={styles.formGroup}>
          <label className={styles.label}>
            <span>Tên Tác Giả / Kênh</span>
            <span style={{ fontSize: 10, color: 'var(--accent, #BEFF01)' }}>Bắt buộc</span>
          </label>
          <input
            className={styles.input}
            value={brandingSettings.authorName || ''}
            onChange={e => updateBrandingSettings({ authorName: e.target.value })}
            placeholder="Ví dụ: TinhVo Digital"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            <span>Handle (@)</span>
          </label>
          <input
            className={styles.input}
            value={brandingSettings.authorHandle || ''}
            onChange={e => updateBrandingSettings({ authorHandle: e.target.value })}
            placeholder="Ví dụ: @tinhvodigital"
          />
        </div>
      </div>

      {/* 3. TÙY BIẾN MÀU CHỦ ĐẠO (BRAND ACCENT COLOR OVERRIDE) */}
      <div className={styles.formGroup}>
        <div className={styles.label}>
          <span>Màu Chủ Đạo Thương Hiệu (Brand Accent Override)</span>
          <span style={{ color: brandingSettings.brandColor || '#BEFF01', fontFamily: 'monospace', fontWeight: 700 }}>
            {brandingSettings.brandColor || '#BEFF01'}
          </span>
        </div>
        <div className={styles.colorPickerRow}>
          <input
            type="color"
            value={brandingSettings.brandColor || '#BEFF01'}
            onChange={e => handleSelectBrandColor(e.target.value)}
            className={styles.colorSquare}
          />
          <input
            className={styles.input}
            value={brandingSettings.brandColor || '#BEFF01'}
            onChange={e => handleSelectBrandColor(e.target.value)}
            placeholder="#BEFF01"
            style={{ flex: 1, fontFamily: 'monospace' }}
          />
        </div>
        {/* 6 Quick Color Presets */}
        <div className={styles.colorPresets}>
          {COLOR_PRESETS.map(p => (
            <button
              key={p.hex}
              type="button"
              className={`${styles.colorPill} ${(brandingSettings.brandColor || '#BEFF01').toLowerCase() === p.hex.toLowerCase() ? styles.colorPillActive : ''}`}
              style={{ backgroundColor: p.hex }}
              title={p.name}
              onClick={() => handleSelectBrandColor(p.hex)}
            />
          ))}
        </div>
      </div>

      {/* 4. FONT CHỮ MẶC ĐỊNH */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Font Chữ Tiêu Đề & Nội Dung Mặc Định</label>
        <select
          className={styles.select}
          value={brandingSettings.defaultFont || 'Be Vietnam Pro'}
          onChange={e => {
            const font = e.target.value
            updateBrandingSettings({ defaultFont: font })
            setDefaultFont(font)
            applyFontToAllScenes(font)
            showToast(`Đã áp dụng font "${font}" cho toàn bộ video`)
          }}
        >
          {FONT_OPTIONS.map(f => (
            <option key={f} value={f}>{f} {f === 'Be Vietnam Pro' ? '(Khuyên dùng - Chuẩn Tiếng Việt)' : ''}</option>
          ))}
        </select>
      </div>

      {/* 5. AVATAR ĐẠI DIỆN THƯƠNG HIỆU */}
      <div className={styles.formGroup}>
        <AvatarUploader
          avatarUrl={brandingSettings.authorAvatarUrl || ''}
          brandColor={brandingSettings.brandColor || '#BEFF01'}
          authorName={brandingSettings.authorName || ''}
          onChange={(newUrl) => {
            updateBrandingSettings({ authorAvatarUrl: newUrl })
            applyAvatarToAllScenes(newUrl)
          }}
        />
      </div>

      <div className={styles.formGroup}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label className={styles.label}>Kích Thước Avatar Mặc Định</label>
          <span style={{ fontSize: 11, color: brandingSettings.brandColor || '#BEFF01', fontWeight: 700, fontFamily: 'monospace' }}>
            {brandingSettings.authorAvatarSize || 44}px
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>32px</span>
          <input
            type="range"
            min={32}
            max={88}
            step={2}
            value={brandingSettings.authorAvatarSize || 44}
            onChange={e => updateBrandingSettings({ authorAvatarSize: Number(e.target.value) })}
            style={{ flex: 1, accentColor: brandingSettings.brandColor || '#BEFF01', cursor: 'pointer' }}
          />
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>88px</span>
        </div>
      </div>
    </>
  )
}
export default BrandingTab
