import React, { useState, useRef } from 'react'
import styles from './Filmstrip.module.css'
import { Scene } from '@/types/scene'
import { useEditorStore } from '@/store/useEditorStore'
import { TEMPORAL_ROLE_INFO } from '@/utils/temporalContrast'
import { effectiveSceneRole } from '@/config/sceneRoles'
import { FILTER_PRESETS } from '@/config/filterPresetCatalog'
import { Button } from '@/components/ui'

export default React.memo(function SceneThumb({
  scene,
  index,
  total,
  isActive,
  isSelected,
  zoom,
  clipWidth,
  pxPerSec: customPxPerSec,
  onSelect,
  onDragReorder
}: {
  scene: Scene
  index: number
  total?: number
  isActive: boolean
  isSelected?: boolean
  zoom: number
  clipWidth?: number
  pxPerSec?: number
  onSelect?: (idx: number, addMode: boolean) => void
  onDragReorder?: (fromIdx: number, targetIdx: number, position: 'before' | 'after') => void
}) {
  const { seekToScene, deleteScene, duplicateScene, insertSceneAt, updateScene, showToast, setLayerTimingModalSceneIdx } = useEditorStore()

  if (!scene) return null

  const pxPerSec = customPxPerSec || Math.round(48 * zoom)
  const widthPx = clipWidth || Math.max(28, Math.round((scene.duration || 3) * pxPerSec))
  const isCompact = widthPx < 85
  const isTiny = widthPx < 54

  const effectiveRole = effectiveSceneRole(scene, index, total || 1)
  const roleInfo = TEMPORAL_ROLE_INFO[effectiveRole] || null

  const [isEditing, setIsEditing] = useState(false)
  const [tempDur, setTempDur] = useState((scene.duration ?? 3).toString())
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)

  // Close context menu on outside click
  React.useEffect(() => {
    if (!contextMenu) return
    const close = () => setContextMenu(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [contextMenu])

  // Drag to Resize Scene Duration
  const resizeStartXRef = useRef<number>(0)
  const initialDurationRef = useRef<number>(0)
  const isResizingRef = useRef<boolean>(false)
  const [isHoveringHandle, setIsHoveringHandle] = useState<boolean>(false)
  const [isResizing, setIsResizing] = useState<boolean>(false)
  const [resizeDeltaSec, setResizeDeltaSec] = useState<number>(0)

  // Drag & Drop Reorder State
  const [isDraggingSelf, setIsDraggingSelf] = useState<boolean>(false)
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null)

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (isEditing || isResizingRef.current || isHoveringHandle) {
      e.preventDefault()
      return
    }
    setIsDraggingSelf(true)
    e.dataTransfer.setData('text/plain', String(index))
    e.dataTransfer.setData('application/scene-reorder', String(index))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setIsDraggingSelf(false)
    setDropPosition(null)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    const rect = e.currentTarget.getBoundingClientRect()
    const midX = rect.left + rect.width / 2
    const pos = e.clientX < midX ? 'before' : 'after'
    if (dropPosition !== pos) {
      setDropPosition(pos)
    }
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    if (
      e.clientX <= rect.left ||
      e.clientX >= rect.right ||
      e.clientY <= rect.top ||
      e.clientY >= rect.bottom
    ) {
      setDropPosition(null)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const rawIdx = e.dataTransfer.getData('text/plain')
    const fromIdx = parseInt(rawIdx, 10)
    const pos = dropPosition || 'after'
    setDropPosition(null)
    setIsDraggingSelf(false)

    if (!isNaN(fromIdx) && onDragReorder) {
      onDragReorder(fromIdx, index, pos)
    }
  }

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    isResizingRef.current = true
    setIsResizing(true)
    resizeStartXRef.current = e.clientX
    initialDurationRef.current = scene.duration
    setResizeDeltaSec(0)

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const handleMouseMove = (me: MouseEvent) => {
      const deltaPx = me.clientX - resizeStartXRef.current
      const deltaSec = deltaPx / pxPerSec
      const newDur = Math.max(0.5, Math.round((initialDurationRef.current + deltaSec) * 2) / 2) // Step 0.5s
      const currentDelta = Math.round((newDur - initialDurationRef.current) * 10) / 10
      setResizeDeltaSec(currentDelta)
      updateScene(scene.id, { duration: newDur })
    }

    const handleMouseUp = () => {
      isResizingRef.current = false
      setIsResizing(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const handleSaveDur = () => {
    const val = parseFloat(tempDur)
    if (!isNaN(val) && val > 0) {
      updateScene(scene.id, { duration: val })
      showToast(`Đã đổi cảnh ${index + 1} thành ${val}s`)
    }
    setIsEditing(false)
  }

  const handleClick = (e: React.MouseEvent) => {
    if (isDraggingSelf) return
    const addMode = e.shiftKey || e.ctrlKey || e.metaKey
    if (onSelect) {
      onSelect(index, addMode)
    }
    if (!addMode) {
      seekToScene(index)
    }
  }

  return (
    <div
      className={`${styles.scene} ${isActive ? styles.active : ''}`}
      draggable={!isEditing && !isHoveringHandle && !isResizing}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      onDoubleClick={(e) => {
        e.stopPropagation()
        setLayerTimingModalSceneIdx(index)
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setContextMenu({ x: e.clientX, y: e.clientY })
      }}
      style={{
        width: widthPx,
        height: '78px',
        padding: isTiny ? '2px' : (isCompact ? '4px' : '6px'),
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
        borderRadius: '6px',
        userSelect: 'none',
        cursor: 'grab',
        opacity: isDraggingSelf ? 0.35 : 1,
        transform: isDraggingSelf ? 'scale(0.96)' : 'none',
        transition: 'opacity 0.15s ease, transform 0.15s ease, border-color 0.15s ease, background 0.15s ease',
        border: isSelected 
          ? '2px solid #BEFF01' 
          : (isActive 
              ? '2px solid var(--accent)' 
              : '1px solid rgba(255, 255, 255, 0.08)'),
        background: isSelected 
          ? 'rgba(190, 255, 1, 0.12)' 
          : (isActive 
              ? 'var(--accent-dim)' 
              : 'rgba(255, 255, 255, 0.04)'),
        boxShadow: isSelected ? '0 0 10px rgba(190, 255, 1, 0.3)' : 'none'
      }}
    >
      {/* Visual Neon Drop Indicator Line */}
      {dropPosition === 'before' && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '3px',
            background: '#BEFF01',
            boxShadow: '0 0 10px #BEFF01, 0 0 4px #FFF',
            zIndex: 30,
            borderRadius: '2px',
            pointerEvents: 'none',
          }}
        />
      )}
      {dropPosition === 'after' && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '3px',
            background: '#BEFF01',
            boxShadow: '0 0 10px #BEFF01, 0 0 4px #FFF',
            zIndex: 30,
            borderRadius: '2px',
            pointerEvents: 'none',
          }}
        />
      )}



      {!isTiny && (
        <div className={styles.num} style={{ background: isSelected ? '#BEFF01' : undefined, color: isSelected ? '#000' : undefined }}>
          {isSelected ? '✓' : index + 1}
        </div>
      )}

      {roleInfo && !isCompact && (
        <div style={{
          position: 'absolute',
          top: 4,
          right: scene.transition?.type ? 48 : 8,
          background: roleInfo.bgColor,
          border: `1px solid ${roleInfo.color}`,
          color: roleInfo.color,
          fontSize: '8px',
          fontWeight: 800,
          padding: '1px 4px',
          borderRadius: '3px',
          letterSpacing: '0.5px',
          zIndex: 5
        }}>
          {roleInfo.badge}
        </div>
      )}

      {scene.transition?.type && !isCompact && (
        <div style={{
          position: 'absolute',
          top: 4,
          right: 8,
          background: 'rgba(190, 255, 1, 0.9)',
          color: '#000',
          fontSize: '9px',
          fontWeight: 700,
          padding: '1px 4px',
          borderRadius: '3px',
          textTransform: 'uppercase',
          zIndex: 5
        }}>
          {scene.transition.type}
        </div>
      )}

      {scene.filter && scene.filter.presetId !== 'none' && !isCompact && (
        <div style={{
          position: 'absolute',
          bottom: 4,
          left: 4,
          background: 'rgba(0, 212, 255, 0.85)',
          color: '#000',
          fontSize: '8px',
          fontWeight: 800,
          padding: '1px 3px',
          borderRadius: '3px',
          zIndex: 5,
          boxShadow: '0 0 4px rgba(0,212,255,0.5)'
        }}
        title={`Bộ lọc màu: ${FILTER_PRESETS.find(p => p.id === scene.filter?.presetId)?.name || 'Custom'}`}
        >
          LUT
        </div>
      )}
      
      {isTiny ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', gap: '4px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: isSelected ? '#BEFF01' : '#FFF' }}>
            #{index + 1}
          </div>
          {isEditing ? (
            <input
              type="text"
              value={tempDur}
              onChange={e => setTempDur(e.target.value)}
              onBlur={handleSaveDur}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSaveDur()
                if (e.key === 'Escape') setIsEditing(false)
              }}
              autoFocus
              onClick={e => e.stopPropagation()}
              style={{
                width: '28px',
                height: '16px',
                background: '#000',
                border: '1px solid #BEFF01',
                color: '#BEFF01',
                fontSize: '9px',
                fontWeight: 800,
                textAlign: 'center',
                borderRadius: '2px',
                outline: 'none',
                padding: '0',
                zIndex: 10,
              }}
            />
          ) : (
            <div
              style={{
                fontSize: '8.5px',
                fontWeight: 800,
                color: '#BEFF01',
                background: 'rgba(0,0,0,0.7)',
                padding: '1px 3px',
                borderRadius: '2px',
                cursor: 'pointer',
                border: '1px solid rgba(190, 255, 1, 0.3)'
              }}
              onClick={e => {
                e.stopPropagation()
                setIsEditing(true)
                setTempDur(scene.duration.toString())
              }}
              title="Click để sửa thời lượng"
            >
              {scene.duration}s
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', height: '100%' }}>
          {/* SVG Mini Thumb with Bottom Duration Badge (YouTube/TikTok style) */}
          <div style={{ position: 'relative', width: '38px', height: '64px', flexShrink: 0, borderRadius: '4px', overflow: 'hidden' }}>
            <div
              className={styles.thumb}
              style={{ width: '38px', height: '64px' }}
              dangerouslySetInnerHTML={{ __html: injectSize(scene.svgContent ?? '', 38, 64) }}
            />

            {/* Bottom Duration Badge on Thumbnail */}
            {isEditing ? (
              <input
                type="text"
                value={tempDur}
                onChange={e => setTempDur(e.target.value)}
                onBlur={handleSaveDur}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSaveDur()
                  if (e.key === 'Escape') setIsEditing(false)
                }}
                autoFocus
                onClick={e => e.stopPropagation()}
                onDoubleClick={e => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  bottom: 2,
                  left: 2,
                  right: 2,
                  height: '16px',
                  background: '#000',
                  border: '1px solid #BEFF01',
                  color: '#BEFF01',
                  fontSize: '9px',
                  fontWeight: 800,
                  textAlign: 'center',
                  borderRadius: '2px',
                  outline: 'none',
                  padding: '0',
                  zIndex: 10,
                }}
              />
            ) : (
              <div
                style={{
                  position: 'absolute',
                  bottom: 2,
                  left: 2,
                  right: 2,
                  backgroundColor: 'rgba(8, 12, 20, 0.88)',
                  color: '#BEFF01',
                  fontSize: '8.5px',
                  fontWeight: 800,
                  padding: '1px 0',
                  textAlign: 'center',
                  borderRadius: '2px',
                  letterSpacing: '0.3px',
                  border: '1px solid rgba(190, 255, 1, 0.35)',
                  lineHeight: '11px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.6)',
                  cursor: 'pointer',
                  zIndex: 6,
                }}
                onClick={e => {
                  e.stopPropagation()
                  setIsEditing(true)
                  setTempDur(scene.duration.toString())
                }}
                title="Click để sửa thời lượng cảnh"
              >
                {scene.duration}s
              </div>
            )}
          </div>

          {/* Clip Info - only when not compact */}
          {!isCompact && (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, minWidth: 0, paddingRight: '4px' }}>
              <div
                className={styles.name}
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#FFF',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: '14px',
                }}
              >
                {scene.name}
              </div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '3px' }}>
                {scene.elements?.length || 0} phần tử
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions overlay - only when not compact */}
      {!isCompact && (
        <div className={styles.actions} onClick={e => e.stopPropagation()} style={{ bottom: 6, right: 12, display: 'flex', gap: 4 }}>
          <Button
            asIcon
            variant="ghost"
            size="icon-xs"
            title="Nhân đôi ra phía trước"
            onClick={() => { duplicateScene(index, 'before'); showToast(`✨ Đã nhân bản Cảnh ${index + 1} ra phía trước`) }}
          >
            <svg width="9" height="9" viewBox="0 0 9 9"><rect x="2.5" y="2.5" width="5.5" height="5.5" rx=".8" stroke="currentColor" strokeWidth="1" fill="none"/><rect x="1" y="1" width="5.5" height="5.5" rx=".8" stroke="currentColor" strokeWidth="1" fill="#1A1A1A"/></svg>
          </Button>
          <Button
            asIcon
            variant="danger"
            size="icon-xs"
            title="Xóa"
            onClick={() => { deleteScene(index); showToast(`Đã xóa cảnh ${index+1}`) }}
          >
            <svg width="9" height="9" viewBox="0 0 9 9"><path d="M1 2.5H8M2.5 2.5V1H6.5V2.5M2 2.5L2.4 8H6.6L7 2.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" fill="none"/></svg>
          </Button>
        </div>
      )}

      {/* Right-Click Context Menu */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 9999,
            backgroundColor: '#0E1118',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '7px',
            boxShadow: '0 12px 30px rgba(0,0,0,0.85), 0 0 1px rgba(255,255,255,0.2)',
            padding: '4px',
            minWidth: '145px',
            backdropFilter: 'blur(16px)',
          }}
          onClick={e => e.stopPropagation()}
        >
          <div
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 600,
              color: '#D1D5DB',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              cursor: 'pointer',
              borderRadius: '4px',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'
              e.currentTarget.style.color = '#BEFF01'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#D1D5DB'
            }}
            onClick={() => {
              insertSceneAt(index)
              setContextMenu(null)
              showToast(`Đã chèn cảnh trước Cảnh ${index + 1}`)
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>Chèn phía trước</span>
          </div>

          <div
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 600,
              color: '#D1D5DB',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              cursor: 'pointer',
              borderRadius: '4px',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'
              e.currentTarget.style.color = '#BEFF01'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#D1D5DB'
            }}
            onClick={() => {
              insertSceneAt(index + 1)
              setContextMenu(null)
              showToast(`Đã chèn cảnh sau Cảnh ${index + 1}`)
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>Chèn phía sau</span>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '3px 0' }} />

          <div
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 600,
              color: '#D1D5DB',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              cursor: 'pointer',
              borderRadius: '4px',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'
              e.currentTarget.style.color = '#00D4FF'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#D1D5DB'
            }}
            onClick={() => {
              duplicateScene(index, 'after')
              setContextMenu(null)
              showToast(`Đã nhân bản Cảnh ${index + 1}`)
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            <span>Nhân bản</span>
          </div>

          <div
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 600,
              color: '#FF5555',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              cursor: 'pointer',
              borderRadius: '4px',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255, 85, 85, 0.15)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            onClick={() => {
              deleteScene(index)
              setContextMenu(null)
              showToast(`Đã xóa cảnh ${index + 1}`)
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            <span>Xóa</span>
          </div>
        </div>
      )}

      {/* Live Duration Tooltip during Trim Drag */}
      {isResizing && (
        <div
          style={{
            position: 'absolute',
            top: '4px',
            right: '18px',
            background: '#0E1420',
            border: '1.5px solid #BEFF01',
            color: '#BEFF01',
            fontSize: '10.5px',
            fontWeight: 800,
            padding: '2px 7px',
            borderRadius: '4px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.85), 0 0 10px rgba(190, 255, 1, 0.5)',
            zIndex: 60,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <span>⏱️ {scene.duration}s</span>
          <span style={{ fontSize: '9px', opacity: 0.85 }}>
            ({resizeDeltaSec >= 0 ? `+${resizeDeltaSec.toFixed(1)}s` : `${resizeDeltaSec.toFixed(1)}s`})
          </span>
        </div>
      )}

      {/* Modern NLE Clip Trim Handle (Right edge) */}
      <div
        onMouseDown={handleResizeMouseDown}
        onMouseEnter={() => setIsHoveringHandle(true)}
        onMouseLeave={() => setIsHoveringHandle(false)}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '14px',
          cursor: 'col-resize',
          zIndex: 35,
          background: isResizing
            ? 'rgba(190, 255, 1, 0.35)'
            : (isHoveringHandle ? 'rgba(190, 255, 1, 0.2)' : 'transparent'),
          borderRight: isResizing || isHoveringHandle ? '2.5px solid #BEFF01' : '1px solid transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.15s ease, border-color 0.15s ease',
        }}
        title="Kéo sang trái/phải để rút ngắn hoặc kéo dài thời lượng cảnh"
      >
        {(isHoveringHandle || isResizing) && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
            pointerEvents: 'none',
          }}>
            <div style={{ width: '2px', height: '12px', background: '#BEFF01', borderRadius: '1px' }} />
          </div>
        )}
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  return (
    prevProps.index === nextProps.index &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.zoom === nextProps.zoom &&
    prevProps.clipWidth === nextProps.clipWidth &&
    prevProps.scene === nextProps.scene
  )
})

function injectSize(svgContent: string, w: number, h: number): string {
  return `<svg viewBox="0 0 360 640" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" style="display:block">
    ${svgContent.replace(/<svg[^>]*>|<\/svg>/g, '')}
  </svg>`
}
