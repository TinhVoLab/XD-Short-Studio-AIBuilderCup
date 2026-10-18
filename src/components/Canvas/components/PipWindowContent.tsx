import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Player as RemotionPlayer, PlayerRef } from '@remotion/player'
import { MainComposition } from '@/remotion/MainComposition'
import { useEditorStore } from '@/store/useEditorStore'
import { useShallow } from 'zustand/react/shallow'
import { usePlayer } from '@/hooks/usePlayer'
import { remotionBridge } from '@/utils/remotionBridge'
import { Button } from '@/components/ui'
import { getSceneStartFrames } from '@/utils/sceneTiming'
import { resolveThemePalette } from '@/utils/themeResolver'
import pipStyles from './PipWindowContent.module.css'

interface PipWindowContentProps {
  pipWindow: Window
  durationInFrames: number
  currentSceneIdx: number
  scenes: any[]
  memoizedInputProps: any
  remotionPlayerRef: React.RefObject<PlayerRef>
}

const PipTimecodeDisplay = () => {
  const currentTimeSec = useEditorStore((s) => s.currentTimeSec)
  const formatSMPTE = (sec: number) => {
    const h = Math.floor(sec / 3600).toString().padStart(2, '0')
    const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0')
    const s = Math.floor(sec % 60).toString().padStart(2, '0')
    const f = Math.floor((sec % 1) * 30).toString().padStart(2, '0')
    return `${h}:${m}:${s}:${f}`
  }
  return <div className={pipStyles.timecode}>{formatSMPTE(currentTimeSec)}</div>
}

const PipScrubber = () => {
  const { progress, setProgress } = useEditorStore(
    useShallow((s) => ({
      progress: s.progress,
      setProgress: s.setProgress,
    }))
  )
  const progressRef = useRef<HTMLDivElement>(null)

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    if (!progressRef.current) return
    const rect = progressRef.current.getBoundingClientRect()
    const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    setProgress(pct)
  }

  return (
    <div ref={progressRef} onClick={handleSeek} className={pipStyles.scrubber}>
      <div className={pipStyles.scrubberFill} style={{ width: `${progress}%` }} />
    </div>
  )
}

export function PipWindowContent({
  pipWindow,
  durationInFrames,
  currentSceneIdx,
  scenes,
  memoizedInputProps,
  remotionPlayerRef
}: PipWindowContentProps) {
  const { isPlaying, isMuted, setMuted, setProgress, playbackRate, masterVolume, isMasterMuted, seekToScene } = useEditorStore(
    useShallow((s) => ({
      isPlaying: s.isPlaying,
      isMuted: s.isMuted,
      setMuted: s.setMuted,
      setProgress: s.setProgress,
      playbackRate: s.playbackRate || 1.0,
      masterVolume: s.masterVolume ?? 1.0,
      isMasterMuted: s.isMasterMuted || false,
      seekToScene: s.seekToScene,
    }))
  )
  const { togglePlay } = usePlayer()
  const [isHovered, setIsHovered] = useState(false)
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null)

  const currentScene = scenes[currentSceneIdx]
  const currentPalette = useMemo(() => {
    return resolveThemePalette(currentScene?.paletteId || (currentScene as any)?.colorTheme || currentScene?.elements?.[0])
  }, [currentScene])

  const canvasBgColor = useMemo(() => {
    if (currentScene?.bgColor && currentScene.bgColor !== '#060D16' && currentScene.bgColor !== '#080a0f') {
      return currentScene.bgColor
    }
    return currentPalette.tokens.bg
  }, [currentScene?.bgColor, currentPalette.tokens.bg])

  // Điều hướng cảnh nhanh
  const jumpPrevScene = () => {
    if (currentSceneIdx > 0) {
      seekToScene(currentSceneIdx - 1)
    } else {
      setProgress(0)
    }
  }

  const jumpNextScene = () => {
    if (currentSceneIdx < scenes.length - 1) {
      seekToScene(currentSceneIdx + 1)
    }
  }

  // Zero-Delay Bridge Callback Ref
  const setPlayerRef = (player: PlayerRef | null) => {
    if (typeof remotionPlayerRef === 'function') {
      (remotionPlayerRef as any)(player)
    } else if (remotionPlayerRef) {
      (remotionPlayerRef as any).current = player
    }
    if (player) {
      remotionBridge.ref = player
    }
  }

  // Auto-hide controls after 2.5s of no mouse movement (unless paused)
  const handleMouseMove = () => {
    setIsHovered(true)
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => {
      setIsHovered(false)
    }, 2500)
  }

  // Keyboard events inside the PiP window (NLE Shortcuts: J-K-L, Space, Arrows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'KeyK') {
        e.preventDefault()
        togglePlay()
      } else if (e.code === 'KeyM') {
        e.preventDefault()
        setMuted(!isMuted)
      } else if (e.code === 'KeyJ' || e.code === 'ArrowLeft') {
        e.preventDefault()
        jumpPrevScene()
      } else if (e.code === 'KeyL' || e.code === 'ArrowRight') {
        e.preventDefault()
        jumpNextScene()
      } else if (e.code === 'Home') {
        e.preventDefault()
        setProgress(0)
      } else if (e.code === 'End') {
        e.preventDefault()
        setProgress(100)
      }
    }
    pipWindow.addEventListener('keydown', handleKeyDown)
    return () => pipWindow.removeEventListener('keydown', handleKeyDown)
  }, [pipWindow, togglePlay, isMuted, setMuted, currentSceneIdx, scenes.length])

  const showOverlay = isHovered || !isPlaying

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={pipStyles.pipRoot}
      style={{ cursor: showOverlay ? 'default' : 'none' }}
    >
      {/* Video Canvas Frame */}
      <div className={pipStyles.videoFrame}>
        <RemotionPlayer
          ref={setPlayerRef}
          component={MainComposition}
          durationInFrames={durationInFrames}
          initialFrame={getSceneStartFrames(scenes, 30)[currentSceneIdx] || 0}
          compositionWidth={360}
          compositionHeight={640}
          fps={30}
          playbackRate={playbackRate || 1.0}
          style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: canvasBgColor }}
          inputProps={memoizedInputProps}
          controls={false}
          loop={true}
          clickToPlay={true}
          acknowledgeRemotionLicense
          numberOfSharedAudioTags={20}
          renderLoading={() => (
            <div className={pipStyles.remotionLoading} style={{ backgroundColor: canvasBgColor }}>
              <span>⏳ Đang tải tài nguyên...</span>
            </div>
          )}
          errorFallback={({ error }) => (
            <div className={pipStyles.remotionError}>
              <h3 className={pipStyles.remotionErrorTitle}>Lỗi Tài Nguyên</h3>
              <span className={pipStyles.remotionErrorMsg}>{error.message || 'Không thể tải ảnh/video.'}</span>
            </div>
          )}
        />
      </div>

      {/* Floating Glassmorphic Overlay Layer */}
      <div
        className={pipStyles.overlayLayer}
        style={{
          opacity: showOverlay ? 1 : 0,
          transition: 'opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          background: showOverlay
            ? 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 25%, transparent 70%, rgba(0,0,0,0.85) 100%)'
            : 'transparent'
        }}
      >
        {/* Top Header Bar */}
        <div className={pipStyles.topBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
            <div className={pipStyles.liveChip}>
              <span className={pipStyles.liveDot} />
              <span className={pipStyles.liveText}>LIVE</span>
            </div>
            <div className={pipStyles.sceneStepperBadge} title={currentScene?.name || `Cảnh ${currentSceneIdx + 1}`}>
              <span className={pipStyles.sceneStepperIndex}>
                {`CẢNH ${(currentSceneIdx + 1).toString().padStart(2, '0')}/${scenes.length.toString().padStart(2, '0')}`}
              </span>
              {currentScene?.name && <span style={{ opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis' }}>• {currentScene.name}</span>}
            </div>
          </div>
          <PipTimecodeDisplay />
        </div>

        {/* Center Quick Play Trigger */}
        {!isPlaying && (
          <div onClick={togglePlay} className={pipStyles.playBtn}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#0E1015" className={pipStyles.playBtnIcon}>
              <polygon points="6 3 20 12 6 21 6 3" />
            </svg>
          </div>
        )}

        {/* Bottom Control Bar */}
        <div className={pipStyles.bottomControls}>
          {/* Progress Bar (Scrubber) */}
          <PipScrubber />

          {/* Transport Toolbar */}
          <div className={pipStyles.toolbar}>
            {/* Left: Volume Toggle */}
            <div className={pipStyles.toolbarLeft}>
              <Button
                asIcon
                variant="ghost"
                size="icon-xs"
                onClick={() => setMuted(!isMuted)}
                title={isMuted ? 'Bật âm thanh (M)' : 'Tắt âm thanh (M)'}
                style={{ color: isMuted ? '#FF4455' : '#94A3B8' }}
              >
                {isMuted ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  </svg>
                )}
              </Button>
            </div>

            {/* Center: Transport & Scene Stepping */}
            <div className={pipStyles.toolbarCenter}>
              <Button asIcon variant="ghost" size="icon-xs" onClick={jumpPrevScene} title="Cảnh trước (J / ←)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M11 19V5L2 12l9 7zm11 0V5l-9 7 9 7z"/></svg>
              </Button>

              <Button asIcon variant="primary" size="icon-xs" onClick={togglePlay} title={isPlaying ? 'Tạm dừng (Space / K)' : 'Phát (Space / K)'}>
                {isPlaying ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1.5" /><rect x="14" y="4" width="4" height="16" rx="1.5" />
                  </svg>
                ) : (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 1 }}>
                    <polygon points="6 3 20 12 6 21 6 3" />
                  </svg>
                )}
              </Button>

              <Button asIcon variant="ghost" size="icon-xs" onClick={jumpNextScene} title="Cảnh sau (L / →)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M13 5v14l9-7-9-7zM2 5v14l9-7-9-7z"/></svg>
              </Button>
            </div>

            {/* Right: Aspect badge */}
            <div className={pipStyles.toolbarRight}>
              <div className={pipStyles.aspectBadge}>9:16 • 30fps</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
