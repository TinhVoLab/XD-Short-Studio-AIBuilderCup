import React from 'react'
import styles from '../SettingsModal.module.css'
import { useEditorStore } from '@/store/useEditorStore'

export const SocialTab: React.FC = () => {
  const { brandingSettings, updateBrandingSettings } = useEditorStore()

  return (
    <>
      <div className={styles.formGroup}>
        <label className={styles.label}>Hashtags Thương Hiệu Riêng (Brand Hashtags)</label>
        <input
          className={styles.input}
          value={brandingSettings.brandHashtags || ''}
          onChange={e => updateBrandingSettings({ brandHashtags: e.target.value })}
          placeholder="#TinhVoDigital #XDShort"
        />
        <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
          Luôn tự động đính kèm ở cuối mỗi bài viết (gom nhóm định danh kênh).
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Hashtags Chủ Đề Mặc Định (Niche Hashtags)</label>
        <input
          className={styles.input}
          value={brandingSettings.defaultNicheHashtags || ''}
          onChange={e => updateBrandingSettings({ defaultNicheHashtags: e.target.value })}
          placeholder="#congnghe #ai #kienthuc #shorts #reels"
        />
        <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
          Nhóm thẻ giúp thuật toán phân phối đúng đối tượng.
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Kêu Gọi Hành Động Mặc Định (Call-To-Action)</label>
        <input
          className={styles.input}
          value={brandingSettings.defaultCta || ''}
          onChange={e => updateBrandingSettings({ defaultCta: e.target.value })}
          placeholder="Đăng ký kênh để nhận thêm mẹo hay mỗi ngày!"
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Phong Cách Viết Bài (Caption Tone)</label>
        <select
          className={styles.select}
          value={brandingSettings.captionTone || 'viral'}
          onChange={e => updateBrandingSettings({ captionTone: e.target.value as any })}
        >
          <option value="viral">Kịch Tính & Viral (Gây sốc, tò mò)</option>
          <option value="professional">Chuyên Nghiệp & Khách Quan (Báo chí, tin tức)</option>
          <option value="educational">Giáo Dục & Chuyên Gia (Chia sẻ kiến thức)</option>
          <option value="storytelling">Kể Chuyện & Tâm Sự (Gần gũi, cảm xúc)</option>
        </select>
      </div>
    </>
  )
}
