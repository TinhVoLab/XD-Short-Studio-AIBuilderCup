import React, { useState, useEffect } from 'react'
import styles from './SettingsModal.module.css'
import { useEditorStore } from '@/store/useEditorStore'
import { useSettingsStore } from '@/store/useSettingsStore'
import { Button, SegmentedControl } from '@/components/ui'
import {
  BrandingTab,
  MetadataTab,
  SeoTab,
  SocialTab,
  AiConfigTab
} from './tabs'

export const SettingsModal: React.FC = () => {
  const {
    settingsModalOpen,
    setSettingsModalOpen,
    resetBrandingSettings,
    brandingSettings,
    applyAuthorToAllScenes,
    applyAvatarToAllScenes,
    applyFontToAllScenes,
    applyBrandColorToAllScenes,
    showToast
  } = useEditorStore()

  const { setBrandColor, setDefaultFont } = useSettingsStore()

  const [activeTab, setActiveTab] = useState<'branding' | 'metadata' | 'seo' | 'social' | 'ai'>('branding')

  // Đóng modal khi bấm Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && settingsModalOpen) {
        setSettingsModalOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [settingsModalOpen, setSettingsModalOpen])

  if (!settingsModalOpen) return null

  const handleClose = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setSettingsModalOpen(false)
  }

  const handleApplyToAllScenes = () => {
    if (brandingSettings.authorName) {
      applyAuthorToAllScenes(brandingSettings.authorName, brandingSettings.authorHandle)
    }
    if (brandingSettings.authorAvatarUrl) {
      applyAvatarToAllScenes(
        brandingSettings.authorAvatarUrl,
        'top-left',
        20,
        22,
        brandingSettings.authorAvatarSize || 44
      )
    }
    if (brandingSettings.defaultFont) {
      applyFontToAllScenes(brandingSettings.defaultFont)
      setDefaultFont(brandingSettings.defaultFont)
    }
    if (brandingSettings.brandColor) {
      applyBrandColorToAllScenes(brandingSettings.brandColor)
      setBrandColor(brandingSettings.brandColor)
    }
  }

  const handleSaveAndClose = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    handleApplyToAllScenes()
    setSettingsModalOpen(false)
    showToast('Đã lưu toàn bộ cài đặt và cấu hình hệ thống!')
  }

  return (
    <div className={styles.backdrop} onClick={() => setSettingsModalOpen(false)}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* HEADER */}
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <div className={styles.titleIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className={styles.titleText}>Trung Tâm Cài Đặt Hệ Thống</span>
                <span className={styles.badge}>v2.0 Pro</span>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                Cấu hình toàn cục – Tự động nhúng vào mọi video & AI Engine
              </div>
            </div>
          </div>
          <Button 
            asIcon 
            variant="ghost" 
            size="icon-sm" 
            onClick={handleClose} 
            title="Đóng (Esc)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </Button>
        </div>

        {/* TAB BAR */}
        <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)' }}>
          <SegmentedControl
            options={[
              { value: 'branding', label: 'Thương Hiệu' },
              { value: 'metadata', label: 'Siêu Metadata' },
              { value: 'seo', label: 'Quy Chuẩn SEO' },
              { value: 'social', label: 'MXH & Hashtag' },
              { value: 'ai', label: 'Cấu Hình AI' }
            ]}
            value={activeTab}
            onChange={(val) => setActiveTab(val as any)}
            size="sm"
            fullWidth
          />
        </div>

        {/* BODY */}
        <div className={styles.body}>
          {activeTab === 'branding' && <BrandingTab />}
          {activeTab === 'metadata' && <MetadataTab />}
          {activeTab === 'seo' && <SeoTab />}
          {activeTab === 'social' && <SocialTab />}
          {activeTab === 'ai' && <AiConfigTab />}
        </div>

        {/* FOOTER */}
        <div className={styles.footer}>
          <Button
            variant="secondary"
            size="md"
            leftIcon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            }
            onClick={() => {
              if (window.confirm('Bạn có chắc muốn đặt lại toàn bộ cài đặt về mặc định ban đầu?')) {
                resetBrandingSettings()
                showToast('Đã khôi phục cài đặt gốc!')
              }
            }}
          >
            Khôi phục mặc định
          </Button>
          
          <Button
            variant="primary"
            size="md"
            leftIcon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            }
            onClick={handleSaveAndClose}
          >
            Lưu & Đóng
          </Button>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal
