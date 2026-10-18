import React, { useState, useMemo } from 'react'
import styles from './EduPanel.module.css'
import { useEditorStore } from '@/store/useEditorStore'
import { useShallow } from 'zustand/react/shallow'
import { EDU_PRESETS, EduHybridScenePreset } from '@/data/eduCatalog'
import { Button, SectionHeader, Tooltip } from '@/components/ui'

type EduCategory = 'all' | 'quiz' | 'stem' | 'language' | 'lesson'

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const PlusSquareIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
)

const LayerIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
)

const MicIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
)

export default function EduPanel() {
  const [activeTab, setActiveTab] = useState<EduCategory>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const { addHybridScene, addElement, showToast, setAiDiagramModalOpen } = useEditorStore(
    useShallow(s => ({
      addHybridScene: s.addHybridScene,
      addElement: s.addElement,
      showToast: s.showToast,
      setAiDiagramModalOpen: s.setAiDiagramModalOpen,
    }))
  )

  const filteredPresets = useMemo(() => {
    return EDU_PRESETS.filter(item => {
      const matchCategory = activeTab === 'all' || item.category === activeTab
      if (!matchCategory) return false

      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.badgeLabel.toLowerCase().includes(q) ||
        item.tags.some(tag => tag.toLowerCase().includes(q))
      )
    })
  }, [activeTab, searchQuery])

  const handleUseScene = (preset: EduHybridScenePreset) => {
    addHybridScene(preset)
  }

  const handleInsertElement = (preset: EduHybridScenePreset) => {
    addElement({
      scaleX: 1,
      scaleY: 1,
      angle: 0,
      opacity: 1,
      ...preset.elementConfig,
    } as any)
    showToast(`Đã chèn phần tử: ${preset.title}`)
  }

  return (
    <div className={styles.container}>
      <SectionHeader
        title="Mẫu sư phạm & giáo dục"
        first
        action={
          <Tooltip content="Chọn 'Dùng mẫu' để tạo cảnh hoàn chỉnh hoặc 'Chèn phần tử' vào cảnh hiện tại.">
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted, #6e7681)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: 2,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </button>
          </Tooltip>
        }
      />

      {/* AI Diagram & Graph Studio Launcher Banner */}
      <div
        style={{
          background: 'rgba(190, 255, 1, 0.04)',
          border: '1px solid rgba(190, 255, 1, 0.2)',
          borderRadius: 8,
          padding: '8px 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: 'rgba(190, 255, 1, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent, #beff01)',
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <path d="M10 6.5h4" />
              <path d="M6.5 10v4" />
              <path d="M17.5 10v4" />
              <path d="M10 17.5h4" />
            </svg>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text, #f0f6fc)' }}>
              AI Diagram Studio
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-sub, #8b949e)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Vẽ sơ đồ tự do từ Prompt & Mermaid
            </div>
          </div>
        </div>
        <Button
          variant="primary"
          size="xs"
          onClick={() => setAiDiagramModalOpen(true)}
          style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
        >
          Tạo ngay
        </Button>
      </div>

      <div className={styles.searchWrap}>
        <span className={styles.searchIcon}>
          <SearchIcon />
        </span>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Tìm mẫu trắc nghiệm, STEM, từ vựng..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div className={styles.filterWrap}>
        {[
          { value: 'all', label: 'Tất cả' },
          { value: 'quiz', label: 'Trắc nghiệm' },
          { value: 'stem', label: 'Khoa học' },
          { value: 'language', label: 'Ngoại ngữ' },
          { value: 'lesson', label: 'Bài giảng' },
        ].map(cat => (
          <button
            key={cat.value}
            type="button"
            className={`${styles.filterBtn} ${activeTab === cat.value ? styles.filterBtnActive : ''}`}
            onClick={() => setActiveTab(cat.value as EduCategory)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className={styles.cardList}>
        {filteredPresets.length === 0 ? (
          <div className={styles.emptyState}>
            Không tìm thấy mẫu phù hợp với từ khoá.
          </div>
        ) : (
          filteredPresets.map(preset => (
            <div key={preset.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <span
                  className={styles.badge}
                  style={{
                    backgroundColor: `${preset.accentColor}20`,
                    color: preset.accentColor,
                  }}
                >
                  {preset.badgeLabel}
                </span>
                <span className={styles.durationTag}>
                  {preset.sceneConfig.duration}s
                </span>
              </div>

              <h4 className={styles.cardTitle}>{preset.title}</h4>
              <p className={styles.cardDesc}>{preset.description}</p>

              {preset.sceneConfig.suggestedVoiceover && (
                <div className={styles.voiceoverBox} title="Lời thoại AI gợi ý cho cảnh này">
                  <span className={styles.voiceoverIcon}>
                    <MicIcon />
                  </span>
                  <span className={styles.voiceoverText}>
                    {preset.sceneConfig.suggestedVoiceover}
                  </span>
                </div>
              )}

              <div className={styles.cardActions}>
                <Button
                  variant="primary"
                  size="xs"
                  leftIcon={<PlusSquareIcon />}
                  onClick={() => handleUseScene(preset)}
                  title="Tạo thêm một cảnh mới hoàn chỉnh vào timeline với mẫu này"
                >
                  + Cảnh mới
                </Button>
                <Button
                  variant="secondary"
                  size="xs"
                  leftIcon={<LayerIcon />}
                  onClick={() => handleInsertElement(preset)}
                  title="Chèn phần tử tương tác này vào cảnh bạn đang mở"
                >
                  Chèn phần tử
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
