import React from 'react'
import styles from './SceneLayerBranchSpine.module.css'
import { Scene, SceneElement, SoundEffect } from '@/types/scene'
import { useEditorStore } from '@/store/useEditorStore'

interface SceneLayerBranchSpineProps {
  scene: Scene
  onSelectElement?: (elementId: string) => void
}

interface UnifiedItem {
  id: string
  sourceType: 'element' | 'sfx' | 'voiceover'
  type: string
  label: string
  delay: number
  visible?: boolean
  elementRef?: SceneElement
  sfxRef?: SoundEffect
}

export const SceneLayerBranchSpine: React.FC<SceneLayerBranchSpineProps> = ({
  scene,
  onSelectElement
}) => {
  const selectedElementId = useEditorStore(s => s.selectedElementId)
  const setSelectedElement = useEditorStore(s => s.setSelectedElement)
  const updateElement = useEditorStore(s => s.updateElement)

  // 1. Gather all temporal entities in this scene
  const unifiedItems: UnifiedItem[] = []

  // Voiceover (if exists, starts at 0.0s)
  if (scene.voiceoverUrl) {
    unifiedItems.push({
      id: `${scene.id}-voiceover`,
      sourceType: 'voiceover',
      type: 'voiceover',
      label: 'Voiceover TTS',
      delay: 0.0,
      visible: true
    })
  }

  // Sound Effects (if exists)
  if (scene.soundEffects && scene.soundEffects.length > 0) {
    scene.soundEffects.forEach(sfx => {
      unifiedItems.push({
        id: sfx.id,
        sourceType: 'sfx',
        type: 'sfx',
        label: sfx.type ? `${sfx.type.toUpperCase()} SFX` : 'SFX Audio',
        delay: sfx.delaySec || 0,
        visible: true,
        sfxRef: sfx
      })
    })
  }

  // Visual Scene Elements
  if (scene.elements && scene.elements.length > 0) {
    scene.elements.forEach(el => {
      let label = String(el.type)
      if (el.type === 'text' || el.type === 'caption') {
        const textContent = (el as any).text || el.content || ''
        label = textContent.trim().slice(0, 14) || 'Văn bản'
      } else if (el.type === 'badge') {
        label = (el.content || 'Huy hiệu').slice(0, 14)
      } else if (el.type === 'image') {
        label = 'Hình ảnh'
      } else if (el.type === 'video') {
        label = 'Video Clip'
      } else if (el.type === 'highlight-box') {
        label = 'Khung điểm nhấn'
      } else if (el.type === 'divider') {
        label = 'Đường phân cách'
      } else if (el.type === 'shape') {
        label = 'Hình khối'
      }

      unifiedItems.push({
        id: el.id,
        sourceType: 'element',
        type: String(el.type),
        label,
        delay: el.animDelay || 0,
        visible: (el.opacity ?? 1) > 0,
        elementRef: el
      })
    })
  }

  // 2. Sort ascending by timeline delay
  unifiedItems.sort((a, b) => a.delay - b.delay)

  const handleItemClick = (item: UnifiedItem, e: React.MouseEvent) => {
    e.stopPropagation()
    if (item.sourceType === 'element') {
      setSelectedElement(item.id)
      onSelectElement?.(item.id)
    }
  }

  const handleToggleVisibility = (item: UnifiedItem, e: React.MouseEvent) => {
    e.stopPropagation()
    if (item.sourceType === 'element' && item.elementRef) {
      const isVisible = (item.elementRef.opacity ?? 1) > 0
      updateElement(item.id, { opacity: isVisible ? 0 : 1 })
    }
  }

  const renderTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
      case 'caption':
      case 'badge':
        return (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="4 7 4 4 20 4 20 7" />
            <line x1="9" y1="20" x2="15" y2="20" />
            <line x1="12" y1="4" x2="12" y2="20" />
          </svg>
        )
      case 'image':
        return (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        )
      case 'video':
        return (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
            <line x1="7" y1="2" x2="7" y2="22" />
            <line x1="17" y1="2" x2="17" y2="22" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <line x1="2" y1="7" x2="7" y2="7" />
            <line x1="2" y1="17" x2="7" y2="17" />
            <line x1="17" y1="17" x2="22" y2="17" />
            <line x1="17" y1="7" x2="22" y2="7" />
          </svg>
        )
      case 'voiceover':
        return (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#00F2FE" strokeWidth="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        )
      case 'sfx':
        return (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFB800" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        )
      default:
        return (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
          </svg>
        )
    }
  }

  if (unifiedItems.length === 0) {
    return (
      <div className={styles.spineContainer}>
        <div className={styles.spineStem} />
        <div className={styles.emptyNotice}>Chưa có layer</div>
      </div>
    )
  }

  return (
    <div className={styles.spineContainer} onClick={e => e.stopPropagation()}>
      {/* Stem connection from card base */}
      <div className={styles.spineStem} />

      {/* List of layers positioned down the spine */}
      <div className={styles.layersList}>
        {unifiedItems.map(item => {
          const isSelected = selectedElementId === item.id
          const isHidden = item.visible === false

          return (
            <div
              key={item.id}
              className={`${styles.layerRow} ${isSelected ? styles.selected : ''}`}
            >
              <div className={styles.spineAnchor} />
              <div className={styles.spineDot} />

              <div
                className={`
                  ${styles.layerPill} 
                  ${isSelected ? styles.selected : ''} 
                  ${isHidden ? styles.hiddenLayer : ''}
                `}
                onClick={e => handleItemClick(item, e)}
                title={`${item.label} — Xuất hiện ở ${item.delay.toFixed(1)}s (Nhấp để chọn)`}
              >
                <div className={styles.pillLeft}>
                  <div className={styles.typeIcon}>
                    {renderTypeIcon(item.type)}
                  </div>
                  <span className={styles.layerLabel}>{item.label}</span>
                </div>

                <div className={styles.pillRight}>
                  <span className={styles.timeChip}>
                    {item.delay.toFixed(1)}s
                  </span>

                  {item.sourceType === 'element' && (
                    <button
                      type="button"
                      className={`${styles.eyeBtn} ${isHidden ? styles.hiddenIcon : ''}`}
                      onClick={e => handleToggleVisibility(item, e)}
                      title={isHidden ? 'Hiện layer' : 'Ẩn layer'}
                    >
                      {isHidden ? (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default SceneLayerBranchSpine
