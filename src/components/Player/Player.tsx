import { useRef, useState, useEffect } from 'react'
import styles from './Player.module.css'
import { useEditorStore } from '@/store/useEditorStore'
import { usePlayer } from '@/hooks/usePlayer'
import { TOTAL_DURATION } from '@/utils/scenes'
import { Button, SegmentedControl } from '@/components/ui'
import { AudioVuMeter } from './AudioVuMeter'

function fmt(sec: number) {
  const m = Math.floor(sec / 60)
  const s = (sec % 60).toFixed(1).padStart(4, '0')
  return `${String(m).padStart(2, '0')}:${s}`
}

const SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0]

export default function Player() {
  const { isPlaying, isMuted, setMuted, playbackRate, setPlaybackRate, progress, setProgress, currentTimeSec,
          currentSceneIdx, scenes, seekToScene, showToast, audioClips, previewMode, setPreviewMode,
          safeZonePlatform, setSafeZonePlatform, workspaceLayout } = useEditorStore()
  const isStandalone = workspaceLayout === 'right-standalone'
  const { togglePlay } = usePlayer()
  const progressRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<HTMLDivElement>(null)

  // Draggable Floating Position State
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({
    mouseX: 0, mouseY: 0, startX: 0, startY: 0
  })

  const handleDragMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('input') || target.closest('[data-no-drag]')) {
      return
    }
    e.preventDefault()

    const playerEl = playerRef.current
    if (!playerEl) return
    const rect = playerEl.getBoundingClientRect()

    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: rect.left,
      startY: rect.top,
    }
    setIsDragging(true)
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStartRef.current.mouseX
      const dy = e.clientY - dragStartRef.current.mouseY
      const newX = dragStartRef.current.startX + dx
      const newY = dragStartRef.current.startY + dy

      const playerEl = playerRef.current
      const width = playerEl?.offsetWidth || 400
      const height = playerEl?.offsetHeight || 44
      const maxX = Math.max(0, window.innerWidth - width - 10)
      const maxY = Math.max(0, window.innerHeight - height - 10)

      setPosition({
        x: Math.max(10, Math.min(maxX, newX)),
        y: Math.max(10, Math.min(maxY, newY)),
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  const handleResetPosition = () => {
    setPosition(null)
    showToast('Đã đưa thanh Player về vị trí mặc định')
  }

  const handleSpeedCycle = () => {
    const idx = SPEEDS.indexOf(playbackRate)
    const nextRate = SPEEDS[(idx + 1) % SPEEDS.length]
    setPlaybackRate(nextRate)
    showToast(`Tốc độ phát: ${nextRate}x`)
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = progressRef.current!.getBoundingClientRect()
    const pct = ((e.clientX - rect.left) / rect.width) * 100
    setProgress(pct)
  }

  const handleToggleFullscreen = () => {
    const el = document.getElementById('phoneFrame') || document.documentElement
    if (!document.fullscreenElement) {
      if (el.requestFullscreen) {
        el.requestFullscreen()
      } else if ((el as any).webkitRequestFullscreen) {
        (el as any).webkitRequestFullscreen()
      }
      showToast('Chế độ toàn màn hình')
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen()
      }
      showToast('Thu nhỏ màn hình')
    }
  }

  const handleToggleSafeZone = () => {
    if (safeZonePlatform === 'none') {
      setSafeZonePlatform('tiktok')
      showToast('Bật Safe Zone (TikTok)')
    } else {
      setSafeZonePlatform('none')
      showToast('Tắt Safe Zone')
    }
  }

  const handleToggleMute = () => {
    const nextMuted = !isMuted
    setMuted(nextMuted)
    showToast(nextMuted ? 'Đã tắt âm thanh' : 'Đã bật âm thanh')
  }

  return (
    <div
      ref={playerRef}
      className={`${styles.player} ${isDragging ? styles.isDragging : ''}`}
      onMouseDown={handleDragMouseDown}
      style={position ? {
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        bottom: 'auto',
        transform: 'none',
        zIndex: 1000,
      } : undefined}
    >
      {/* Drag Handle */}
      <div className={styles.dragHandle} title="Nhấp giữ để kéo thanh Player tự do">
        <svg width="12" height="14" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="5" r="2"/>
          <circle cx="9" cy="12" r="2"/>
          <circle cx="9" cy="19" r="2"/>
          <circle cx="15" cy="5" r="2"/>
          <circle cx="15" cy="12" r="2"/>
          <circle cx="15" cy="19" r="2"/>
        </svg>
      </div>

      {/* Prev Scene */}
      <Button 
        asIcon
        variant="ghost"
        size="icon-xs"
        onClick={() => seekToScene(Math.max(0, currentSceneIdx - 1))} 
        title="Cảnh trước (←)"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="19 20 9 12 19 4 19 20" />
          <line x1="5" y1="19" x2="5" y2="5" />
        </svg>
      </Button>

      {/* Play / Pause */}
      <Button 
        asIcon
        variant="primary"
        size="icon-xs"
        onClick={togglePlay} 
        title="Phát/Tạm dừng (Space)"
      >
        {isPlaying ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1.5" />
            <rect x="14" y="4" width="4" height="16" rx="1.5" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="6 3 20 12 6 21 6 3" />
          </svg>
        )}
      </Button>

      {/* Next Scene */}
      <Button 
        asIcon
        variant="ghost"
        size="icon-xs"
        onClick={() => seekToScene(Math.min(scenes.length - 1, currentSceneIdx + 1))} 
        title="Cảnh sau (→)"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5 4 15 12 5 20 5 4" />
          <line x1="19" y1="5" x2="19" y2="19" />
        </svg>
      </Button>

      {/* Time Display */}
      <div className={styles.time}>
        <span>{fmt(currentTimeSec)}</span>
        <span className={styles.sep}>/</span>
        <span>{fmt(Math.max(
          1,
          scenes.reduce((a, s) => a + s.duration, 0),
          audioClips.reduce((max, clip) => {
            const activeDur = (clip.playDurationSec ?? clip.duration) / (clip.playbackRate ?? 1.0)
            return Math.max(max, clip.startSec + activeDur)
          }, 0)
        ))}</span>
      </div>

      {/* Speed Button */}
      <button
        type="button"
        className={styles.speedBtn}
        onClick={handleSpeedCycle}
        title="Tốc độ phát lại"
      >
        {playbackRate}x
      </button>

      {/* Mute / Volume */}
      <Button 
        asIcon
        variant="ghost"
        size="icon-xs"
        onClick={handleToggleMute} 
        title={isMuted ? "Bật âm thanh (M)" : "Tắt âm thanh (M)"} 
        style={isMuted ? { color:'#FF5544' } : {}}
      >
        {isMuted ? (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        )}
      </Button>

      {/* Audio Stereo VU Heatmap & Waveform Indicator */}
      {!isStandalone && <AudioVuMeter isPlaying={isPlaying} isMuted={isMuted} />}

      {/* Safe Zone Toggle */}
      {!isStandalone && (
        <Button 
          asIcon
          variant={safeZonePlatform !== 'none' ? 'primary' : 'ghost'}
          size="icon-xs"
          onClick={handleToggleSafeZone} 
          title="Bật/tắt Vùng An Toàn (Safe Zone)"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
            <line x1="12" y1="18" x2="12.01" y2="18" />
          </svg>
        </Button>
      )}

      {/* Fullscreen */}
      {!isStandalone && (
        <Button 
          asIcon
          variant="ghost"
          size="icon-xs"
          onClick={handleToggleFullscreen} 
          title="Toàn màn hình (Fullscreen)"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
        </Button>
      )}

      {/* Mode Toggle (Edit / Render) */}
      <div style={{ width: 124, flexShrink: 0, marginLeft: 2 }} title="Chuyển chế độ Edit / Render (⌘E)" data-no-drag>
        <SegmentedControl
          options={[
            {
              value: 'edit',
              label: 'Edit',
              icon: (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              )
            },
            {
              value: 'render',
              label: 'Render',
              icon: (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M5 3l14 9-14 9V3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              )
            }
          ]}
          value={previewMode}
          onChange={(val) => setPreviewMode(val as any)}
          size="xs"
          fullWidth
        />
      </div>

      {/* Reset Position Button (Appears only when user has dragged the player away) */}
      {position && (
        <button
          type="button"
          className={styles.resetBtn}
          onClick={handleResetPosition}
          title="Đưa thanh Player về vị trí mặc định"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
        </button>
      )}
    </div>
  )
}
