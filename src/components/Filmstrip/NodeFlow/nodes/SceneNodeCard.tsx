import React, { useState } from 'react'
import styles from './SceneNodeCard.module.css'
import { Scene } from '@/types/scene'
import { TEMPORAL_ROLE_INFO } from '@/utils/temporalContrast'
import { effectiveSceneRole, isPeakScene } from '@/config/sceneRoles'
import SceneLayerBranchSpine from './SceneLayerBranchSpine'

interface SceneNodeCardProps {
  scene: Scene
  index: number
  total: number
  isActive: boolean
  onSelect: (index: number) => void
  onReorder?: (fromIdx: number, toIdx: number) => void
  onDrillDown?: (sceneId: string) => void
  onExpandToggle?: (isExpanded: boolean) => void
  style?: React.CSSProperties
  className?: string
}

export const SceneNodeCard: React.FC<SceneNodeCardProps> = ({
  scene,
  index,
  total,
  isActive,
  onSelect,
  onReorder,
  onDrillDown,
  onExpandToggle,
  style,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const effectiveRole = effectiveSceneRole(scene, index, total)

  const roleInfo = TEMPORAL_ROLE_INFO[effectiveRole]
  const isClimax = isPeakScene(effectiveRole)

  const layerCount = (scene.elements?.length || 0) + (scene.soundEffects?.length || 0) + (scene.voiceoverUrl ? 1 : 0)

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('application/scene-reorder', String(index))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const fromIdxStr = e.dataTransfer.getData('application/scene-reorder')
    if (fromIdxStr !== '') {
      const fromIdx = parseInt(fromIdxStr, 10)
      if (!isNaN(fromIdx) && fromIdx !== index && onReorder) {
        onReorder(fromIdx, index)
      }
    }
  }

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation()
    const next = !isExpanded
    setIsExpanded(next)
    onExpandToggle?.(next)
  }

  return (
    <div
      className={`
        ${styles.nodeCardWrapper} 
        ${isActive ? styles.active : ''} 
        ${isClimax ? styles.climaxRole : ''} 
        ${className || ''}
      `}
      style={style}
    >
      {/* Primary Fixed Card Body */}
      <div
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => onSelect(index)}
        onDoubleClick={() => onDrillDown?.(scene.id)}
        className={styles.cardMain}
        data-flow-node-body="true"
        title={`Cảnh ${index + 1} (${scene.duration || 3}s) — Nhấp để chọn, nhấp đúp để mở sơ đồ chi tiết`}
      >
        {/* Port Style In (from Brand Bus) */}
        <div className={styles.portStyleIn} title="Nhận Style từ Brand Style Bus" />

        {/* Port Sequence In (from Prev Scene) */}
        {index > 0 && (
          <div className={styles.portSeqIn} title={`Nhận luồng từ Cảnh ${index}`} />
        )}

        {/* Port Sequence Out (to Next Scene) */}
        {index < total - 1 && (
          <div className={styles.portSeqOut} title={`Chuyển luồng sang Cảnh ${index + 2}`} />
        )}

        {/* Card Header */}
        <div className={styles.header}>
          <span className={styles.sceneIdx}>SCENE {String(index + 1).padStart(2, '0')}</span>
          {roleInfo && (
            <span
              className={styles.roleBadge}
              style={{
                background: roleInfo.bgColor,
                color: roleInfo.color,
                border: `1px solid ${roleInfo.color}60`
              }}
            >
              {roleInfo.badge}
            </span>
          )}
        </div>

        {/* Mini 9:16 Video Thumbnail Container */}
        <div className={styles.thumbContainer}>
          <div
            className={styles.thumbAspectBox}
            style={{
              background: scene.bgGradient || scene.bgColor || '#0d1117'
            }}
          >
            {scene.bgVideoUrl && (
              <div style={{ position: 'absolute', inset: 0, opacity: 0.4, background: '#1a1f2c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
            )}

            {/* Text element preview */}
            {(() => {
              const textEl = scene.elements?.find(el => el.type === 'text' || el.type === 'caption')
              const textContent = (textEl as any)?.text || scene.name || ''
              if (!textContent) return null
              return (
                <div style={{
                  position: 'absolute',
                  top: '25%',
                  left: '8%',
                  right: '8%',
                  textAlign: 'center',
                  fontSize: '6.5px',
                  fontWeight: 700,
                  color: '#FFF',
                  lineHeight: 1.2,
                  textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                  overflow: 'hidden',
                  maxHeight: '40px'
                }}>
                  {textContent}
                </div>
              )
            })()}

            {/* Duration Badge */}
            <span className={styles.durationBadge}>
              {(scene.duration || 3).toFixed(1)}s
            </span>
          </div>
        </div>

        {/* Card Footer */}
        <div className={styles.footer}>
          <button
            type="button"
            className={`${styles.layerExpandBtn} ${isExpanded ? styles.expanded : ''}`}
            onClick={handleToggleExpand}
            title={isExpanded ? 'Thu gọn danh sách layer' : 'Mở rộng danh sách layer theo thời gian'}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
            </svg>
            <span>{layerCount} Layer</span>
            <span className={styles.chevronIcon}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </button>

          {scene.voiceoverUrl && (
            <span style={{ color: '#00F2FE', fontSize: '9px', fontWeight: 600 }} title="Có giọng đọc Voiceover">TTS</span>
          )}
        </div>
      </div>

      {/* Child Layer Branch Spine (Rendered when expanded) */}
      {isExpanded && (
        <SceneLayerBranchSpine scene={scene} />
      )}
    </div>
  )
}

export default SceneNodeCard
