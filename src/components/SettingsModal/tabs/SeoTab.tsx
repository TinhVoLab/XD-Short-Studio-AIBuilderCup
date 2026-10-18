import React from 'react'
import styles from '../SettingsModal.module.css'
import { useEditorStore } from '@/store/useEditorStore'
import { SeoNamingPattern } from '@/types/settings'
import { generateSeoVideoFilename } from '@/utils/seoFilename'

export const SeoTab: React.FC = () => {
  const { brandingSettings, updateBrandingSettings, scenes } = useEditorStore()

  const sampleFilename = generateSeoVideoFilename(
    scenes,
    brandingSettings.authorName,
    brandingSettings.seoNamingPattern
  )

  return (
    <>
      <div className={styles.formGroup}>
        <label className={styles.label}>Mẫu Đặt Tên File Video Xuất Tự Động</label>
        <select
          className={styles.select}
          value={brandingSettings.seoNamingPattern || 'slug-by-author-year'}
          onChange={e => updateBrandingSettings({ seoNamingPattern: e.target.value as SeoNamingPattern })}
        >
          <option value="slug-by-author-year">[Tên-Video]-by-[Tác-Giả]-[Năm].mp4 (Chuẩn SEO & Bản Quyền Pro)</option>
          <option value="slug-by-author">[Tên-Video]-by-[Tác-Giả].mp4</option>
          <option value="slug-year">[Tên-Video]-[Năm].mp4</option>
          <option value="slug-only">[Tên-Video].mp4</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Xem Trước Tên File Thực Tế (Live Preview)</label>
        <div className={styles.previewBox}>
          <span style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--accent)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </span>
          <div>
            <div className={styles.previewText}>{sampleFilename}.mp4</div>
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
              100% tiếng Việt không dấu, chuẩn ký tự URL Friendly, tương thích mọi hệ điều hành.
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
