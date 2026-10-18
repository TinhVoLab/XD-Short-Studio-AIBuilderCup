import React, { useState, useRef, useEffect } from 'react'
import styles from './CanvasZoomControl.module.css'
import { useEditorStore } from '@/store/useEditorStore'
import { Button } from '@/components/ui'

interface CanvasZoomControlProps {
  fitScale?: number
  className?: string
}

const ZOOM_PRESETS = [
  { value: 'fit', label: 'Căn vừa (Fit)', shortcut: '⌘0' },
  { value: 0.5,  label: '50%', shortcut: '' },
  { value: 0.75, label: '75%', shortcut: '' },
  { value: 1.0,  label: '100% (Gốc)', shortcut: '⌘1' },
  { value: 1.25, label: '125%', shortcut: '' },
  { value: 1.5,  label: '150%', shortcut: '' },
  { value: 2.0,  label: '200%', shortcut: '' },
]

const ZOOM_STEPS = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0]

export const CanvasZoomControl: React.FC<CanvasZoomControlProps> = ({ fitScale: propFitScale, className }) => {
  const { canvasZoom, setCanvasZoom, resetCanvasView, canvasFitScale } = useEditorStore()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const effectiveFitScale = propFitScale ?? canvasFitScale ?? 1.0
  const currentScale = canvasZoom === 'fit' ? effectiveFitScale : canvasZoom
  const currentPct = Math.round(currentScale * 100)

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleZoomIn = () => {
    const next = ZOOM_STEPS.find(step => step > currentScale + 0.05) || 2.0
    setCanvasZoom(Math.min(2.0, next))
  }

  const handleZoomOut = () => {
    const reversed = [...ZOOM_STEPS].reverse()
    const prev = reversed.find(step => step < currentScale - 0.05) || 0.25
    setCanvasZoom(Math.max(0.25, prev))
  }

  return (
    <div className={styles.zoomControl} ref={menuRef}>
      {/* Zoom Out Button */}
      <Button
        asIcon
        variant="ghost"
        size="icon-xs"
        onClick={handleZoomOut}
        title="Thu nhỏ (⌘ -)"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </Button>

      {/* Preset Dropdown Trigger */}
      <button
        type="button"
        className={styles.triggerBtn}
        onClick={() => setIsOpen(!isOpen)}
        title="Chọn tỉ lệ phóng to / thu nhỏ"
      >
        <span>{canvasZoom === 'fit' ? `Fit (${currentPct}%)` : `${currentPct}%`}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Zoom In Button */}
      <Button
        asIcon
        variant="ghost"
        size="icon-xs"
        onClick={handleZoomIn}
        title="Phóng to (⌘ +)"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </Button>

      {/* Quick Fit Button (if not already fit) */}
      {canvasZoom !== 'fit' && (
        <Button
          asIcon
          variant="secondary"
          size="icon-xs"
          onClick={resetCanvasView}
          title="Căn vừa màn hình (⌘ 0)"
          style={{ color: '#BEFF01', marginLeft: 2 }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </Button>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={styles.dropdown}>
          {ZOOM_PRESETS.map((preset) => {
            const isActive = canvasZoom === preset.value
            return (
              <button
                key={String(preset.value)}
                type="button"
                className={`${styles.menuItem} ${isActive ? styles.menuItemActive : ''}`}
                onClick={() => {
                  if (preset.value === 'fit') {
                    resetCanvasView()
                  } else {
                    setCanvasZoom(preset.value as number)
                  }
                  setIsOpen(false)
                }}
              >
                <span>{preset.label}</span>
                {preset.shortcut && <span className={styles.shortcut}>{preset.shortcut}</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default CanvasZoomControl
