import React from 'react'
import styles from '../SettingsModal.module.css'
import { useEditorStore } from '@/store/useEditorStore'
import { InfoTooltip } from '@/components/ui'

export const MetadataTab: React.FC = () => {
  const { brandingSettings, updateBrandingSettings } = useEditorStore()

  const currentYear = new Date().getFullYear()
  const copyrightPreview = (brandingSettings.copyrightTemplate || '© {YEAR} {AUTHOR}. All rights reserved.')
    .replace('{YEAR}', String(currentYear))
    .replace('{AUTHOR}', brandingSettings.authorName || 'TinhVo Digital')

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(190, 255, 1, 0.06)', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(190, 255, 1, 0.2)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: '#BEFF01' }}>
            <span>Tự Động Nhúng Siêu Metadata MP4</span>
            <InfoTooltip content="Nhúng sâu 7 trường Dublin Core & QuickTime Atoms bằng FFmpeg stream copy" />
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
            Tối ưu hóa khả năng nhận diện và bảo vệ bản quyền tệp tin video
          </div>
        </div>
        <input
          type="checkbox"
          checked={brandingSettings.autoEmbedSuperMetadata || false}
          onChange={e => updateBrandingSettings({ autoEmbedSuperMetadata: e.target.checked })}
          style={{ width: 18, height: 18, accentColor: '#BEFF01', cursor: 'pointer' }}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>Thể Loại Video (Genre Tag)</span>
          <InfoTooltip content="Giúp thuật toán YouTube Shorts & TikTok phân loại đúng chủ đề đề xuất." />
        </label>
        <input
          className={styles.input}
          value={brandingSettings.defaultGenre || ''}
          onChange={e => updateBrandingSettings({ defaultGenre: e.target.value })}
          placeholder="Ví dụ: Công nghệ & AI / Giáo dục / Marketing"
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>Mẫu Bản Quyền (Copyright Template)</span>
          <InfoTooltip content="Sử dụng {YEAR} và {AUTHOR} để tự động điền năm hiện tại và tên tác giả." />
        </label>
        <input
          className={styles.input}
          value={brandingSettings.copyrightTemplate || ''}
          onChange={e => updateBrandingSettings({ copyrightTemplate: e.target.value })}
          placeholder="© {YEAR} {AUTHOR}. All rights reserved."
        />
        <div style={{ fontSize: 11, color: '#BEFF01', marginTop: 4 }}>
          Xem trước: <span style={{ color: '#FFF' }}>{copyrightPreview}</span>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>Website / Kênh Liên Hệ</span>
          <InfoTooltip content="Gắn link website hoặc thông tin liên hệ vào metadata bản quyền của video." />
        </label>
        <input
          className={styles.input}
          value={brandingSettings.websiteUrl || ''}
          onChange={e => updateBrandingSettings({ websiteUrl: e.target.value })}
          placeholder="https://tinhvo.digital"
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>Chữ Ký Phần Mềm (Encoder Signature)</span>
          <InfoTooltip content="Nhúng tên phần mềm xử lý video vào header MP4 giúp tối ưu nhận diện." />
        </label>
        <input
          className={styles.input}
          value={brandingSettings.encoderTag || ''}
          onChange={e => updateBrandingSettings({ encoderTag: e.target.value })}
          placeholder="XD-Short Studio Pro v2.0"
        />
      </div>
    </>
  )
}
