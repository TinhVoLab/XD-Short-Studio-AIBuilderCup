import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import styles from './Canvas.module.css'
import { useEditorStore } from '@/store/useEditorStore'
import { useFabric } from '@/hooks/useFabric'
import AiCard from './AiCard'
import { Button } from '@/components/ui'
import { CanvasZoomControl } from './CanvasZoomControl'

import { useShallow } from 'zustand/react/shallow'
import { remotionBridge } from '@/utils/remotionBridge'
// Remotion imports
import { Player as RemotionPlayer } from '@remotion/player'
import { MainComposition } from '@/remotion/MainComposition'

import { SafeZoneOverlay } from './SafeZoneOverlay'
import { CanvasRulers } from './CanvasRulers'
import { usePlayer } from '@/hooks/usePlayer'
import { PipWindowContent } from './components/PipWindowContent'
import { getSceneStartFrames, getTotalRemotionDurationFrames, remotionFrameToSceneInfo, sceneTimeToRemotionFrame } from '@/utils/sceneTiming'
import { resolveThemePalette, resolveSceneBackground } from '@/utils/themeResolver'

import PlayerControls from '../Player/Player'

export default function Canvas() {
  const { togglePlay } = usePlayer()
  const {
    scenes, currentSceneIdx, bgMusicUrl, bgMusicVolume, audioClips,
    previewMode, isPlaying, isMuted, safeZonePlatform, showRulers, isPipActive,
    canvasZoom, canvasPan, setCanvasZoom, setCanvasPan, resetCanvasView,
    playbackRate, masterVolume, isMasterMuted,
    voiceoverVolume, sfxVolume, bgmVolume,
    isVoiceMuted, isSfxMuted, isBgmMuted,
    soloTrackId, soloTrackIds, mutedTrackIds
  } = useEditorStore(
    useShallow((s) => ({
      scenes: s.scenes,
      currentSceneIdx: s.currentSceneIdx,
      bgMusicUrl: s.bgMusicUrl,
      bgMusicVolume: s.bgMusicVolume,
      audioClips: s.audioClips,
      previewMode: s.previewMode,
      isPlaying: s.isPlaying,
      isMuted: s.isMuted,
      safeZonePlatform: s.safeZonePlatform || 'none',
      showRulers: s.showRulers,
      isPipActive: s.isPipActive,
      canvasZoom: s.canvasZoom,
      canvasPan: s.canvasPan,
      setCanvasZoom: s.setCanvasZoom,
      setCanvasPan: s.setCanvasPan,
      resetCanvasView: s.resetCanvasView,
      playbackRate: s.playbackRate || 1.0,
      masterVolume: s.masterVolume ?? 1.0,
      isMasterMuted: s.isMasterMuted || false,
      voiceoverVolume: s.voiceoverVolume ?? 1.0,
      sfxVolume: s.sfxVolume ?? 0.8,
      bgmVolume: s.bgmVolume ?? 0.8,
      isVoiceMuted: s.isVoiceMuted || false,
      isSfxMuted: s.isSfxMuted || false,
      isBgmMuted: s.isBgmMuted || false,
      soloTrackId: s.soloTrackId,
      soloTrackIds: s.soloTrackIds || [],
      mutedTrackIds: s.mutedTrackIds || [],
    }))
  )
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null)
  const setCanvasNode = useCallback((node: HTMLCanvasElement | null) => {
    canvasRef.current = node
    setCanvasEl(node)
  }, [])
  const videoRef = useRef<HTMLVideoElement>(null)
  const remotionPlayerRef = useRef<any>(null)
  
  const [pipWindow, setPipWindow] = useState<Window | null>(null)
  const [containerDimensions, setContainerDimensions] = useState({ width: 800, height: 600 })
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const [isDraggingPan, setIsDraggingPan] = useState(false)
  const hasDraggedDuringSpaceRef = useRef(false)
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number }>({ x: 0, y: 0, panX: 0, panY: 0 })

  // ResizeObserver for Auto-Fit calculation
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const updateSize = () => {
      setContainerDimensions({
        width: el.clientWidth,
        height: el.clientHeight,
      })
    }
    updateSize()
    const ro = new ResizeObserver(updateSize)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Auto-fit scale computation (base 360x640 video frame)
  const fitScale = useMemo(() => {
    const availW = Math.max(200, containerDimensions.width - 36)
    const topMargin = showRulers ? 30 : 16
    const availH = Math.max(300, containerDimensions.height - topMargin - 56)
    const scale = Math.min(availW / 360, availH / 640)
    return Math.min(1.4, Math.max(0.35, Math.round(scale * 100) / 100))
  }, [containerDimensions, showRulers])

  useEffect(() => {
    useEditorStore.getState().setCanvasFitScale(fitScale)
  }, [fitScale])

  const effectiveScale = canvasZoom === 'fit' ? fitScale : canvasZoom

  // Keyboard Shortcuts & Space Hand Tool
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const isInput = Boolean(target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable ||
        target.closest('input, textarea, select, [contenteditable="true"]') !== null
      ))
      const isInsideModal = Boolean(target && target.closest('[role="dialog"], [class*="modal" i], [class*="Modal" i]'))
      
      // Spacebar for play/pause or hand tool
      if (e.code === 'Space' && !isInput && !isInsideModal && !e.repeat) {
        e.preventDefault()
        setIsSpacePressed(true)
        hasDraggedDuringSpaceRef.current = false
      }

      // Keyboard zoom shortcuts
      if ((e.metaKey || e.ctrlKey) && !isInput && !isInsideModal) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault()
          const current = canvasZoom === 'fit' ? fitScale : canvasZoom
          const next = Math.min(2.0, Math.round((current + 0.15) * 100) / 100)
          setCanvasZoom(next)
        } else if (e.key === '-') {
          e.preventDefault()
          const current = canvasZoom === 'fit' ? fitScale : canvasZoom
          const next = Math.max(0.25, Math.round((current - 0.15) * 100) / 100)
          setCanvasZoom(next)
        } else if (e.key === '0') {
          e.preventDefault()
          resetCanvasView()
        } else if (e.key === '1') {
          e.preventDefault()
          setCanvasZoom(1.0)
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const target = e.target as HTMLElement | null
        const isInput = Boolean(target && (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable ||
          target.closest('input, textarea, select, [contenteditable="true"]') !== null
        ))
        const isInsideModal = Boolean(target && target.closest('[role="dialog"], [class*="modal" i], [class*="Modal" i]'))

        if (!isInput && !isInsideModal && !hasDraggedDuringSpaceRef.current) {
          togglePlay()
        }
        hasDraggedDuringSpaceRef.current = false
        setIsSpacePressed(false)
        setIsDraggingPan(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [canvasZoom, fitScale, setCanvasZoom, resetCanvasView, togglePlay])

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isSpacePressed || e.button === 1) {
      e.preventDefault()
      setIsDraggingPan(true)
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: canvasPan.x,
        panY: canvasPan.y,
      }
    }
  }

  useEffect(() => {
    if (!isDraggingPan) return

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStartRef.current.x
      const dy = e.clientY - dragStartRef.current.y
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasDraggedDuringSpaceRef.current = true
      }
      setCanvasPan({
        x: dragStartRef.current.panX + dx,
        y: dragStartRef.current.panY + dy,
      })
    }

    const handleMouseUp = () => {
      setIsDraggingPan(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDraggingPan, setCanvasPan])

  // Wheel zoom with Ctrl/Meta key
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = -e.deltaY * 0.003
      const current = canvasZoom === 'fit' ? fitScale : canvasZoom
      const next = Math.min(2.5, Math.max(0.25, current + delta))
      setCanvasZoom(Math.round(next * 100) / 100)
    } else if (isSpacePressed) {
      e.preventDefault()
      setCanvasPan((prev) => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }))
    }
  }

  // Initialize fabric and wire it up (only active in edit mode)
  useFabric(canvasEl)

  // Calculate dynamic duration for Remotion Player using transition-aware frames
  const audiosDur = audioClips.reduce((max, a) => Math.max(max, a.startSec + (a.playDurationSec || 0)), 0)
  const durationInFrames = getTotalRemotionDurationFrames(scenes, audiosDur, 30)

  const currentScene = scenes[currentSceneIdx]
  const { palette: currentPalette, effectiveBgColor: canvasBgColor } = useMemo(() => {
    return resolveSceneBackground(currentScene);
  }, [currentScene]);

  // When entering render mode: jump directly to current scene frame, then auto-play
  // When leaving: clean up bridge ref
  useEffect(() => {
    let cleanUpEvents: (() => void) | null = null
    const isRenderActive = previewMode === 'render' || pipWindow !== null

    if (isRenderActive) {
      const t = setTimeout(() => {
        const player = remotionPlayerRef.current
        if (player) {
          // Wire the bridge so usePlayer can control Remotion directly
          remotionBridge.ref = player

          const state = useEditorStore.getState()
          const sceneStarts = getSceneStartFrames(state.scenes, 30)
          const targetFrame = sceneStarts[state.currentSceneIdx] || 0

          player.seekTo(targetFrame)
          // Nếu đang ở trạng thái playing sẵn thì mới kích hoạt play
          if (state.isPlaying) {
            player.play()
          }

          // 2-Way Event Listeners: Đồng bộ trạng thái Play/Pause hai chiều
          const onPlay = () => useEditorStore.getState().setPlaying(true)
          const onPause = () => useEditorStore.getState().setPlaying(false)
          const onEnded = () => useEditorStore.getState().setPlaying(false)

          // Frame-by-frame Timeline Sync: Đưa Playhead và Active Scene chạy theo video thời gian thực
          const onFrameUpdate = (e: any) => {
            const frame = e.detail?.frame ?? 0
            const state = useEditorStore.getState()
            const { sceneIdx, linearSec } = remotionFrameToSceneInfo(state.scenes, frame, 30)
            const scenesDur = state.scenes.reduce((sum, s) => sum + (s.duration || 3), 0)
            const audiosDur = state.audioClips.reduce((max, a) => Math.max(max, a.startSec + (a.playDurationSec || 0)), 0)
            const dynamicTotalDur = Math.max(1, scenesDur, audiosDur)
            const pct = Math.min(100, Math.max(0, (linearSec / dynamicTotalDur) * 100))

            useEditorStore.setState({
              progress: pct,
              currentTimeSec: linearSec,
              ...(state.isPlaying ? { currentSceneIdx: sceneIdx } : {}),
            })
          }

          player.addEventListener('play', onPlay)
          player.addEventListener('pause', onPause)
          player.addEventListener('ended', onEnded)
          player.addEventListener('frameupdate', onFrameUpdate)

          cleanUpEvents = () => {
            try {
              player.removeEventListener('play', onPlay)
              player.removeEventListener('pause', onPause)
              player.removeEventListener('ended', onEnded)
              player.removeEventListener('frameupdate', onFrameUpdate)
            } catch (err) {
              // safe cleanup
            }
          }
        }
      }, 50)

      return () => {
        clearTimeout(t)
        if (cleanUpEvents) cleanUpEvents()
      }
    } else {
      // Unwire bridge on exit
      if (remotionBridge.ref) {
        remotionBridge.ref.pause()
        remotionBridge.ref = null
      }
      useEditorStore.getState().setPlaying(false)
    }
  }, [previewMode, pipWindow])

  // Live Seeking & Time-based Throttling (Hỗ trợ nhảy cảnh trực tiếp cả khi đang Play)
  useEffect(() => {
    let lastSeekTime = 0
    let pendingSeekTimeout: ReturnType<typeof setTimeout> | null = null

    const unsub = useEditorStore.subscribe((state, prev) => {
      const isRenderActive = state.previewMode === 'render' || pipWindow !== null
      if (isRenderActive && remotionBridge.ref) {
        if (state.currentTimeSec !== prev.currentTimeSec) {
          const targetFrame = sceneTimeToRemotionFrame(state.scenes, state.currentTimeSec, 30)
          const currentFrame = typeof remotionBridge.ref.getCurrentFrame === 'function' 
            ? remotionBridge.ref.getCurrentFrame() 
            : 0

          // Phân biệt: Nhịp tự nhiên của video (+1 frame) vs Người dùng chủ động click nhảy cảnh (> 3 frames)
          const isUserJump = Math.abs(targetFrame - currentFrame) > 3

          if (isUserJump) {
            const now = Date.now()
            if (now - lastSeekTime > 60) {
              lastSeekTime = now
              if (pendingSeekTimeout) clearTimeout(pendingSeekTimeout)
              try {
                remotionBridge.ref.seekTo(targetFrame)
              } catch (e) {
                // Ignore
              }
            } else {
              if (pendingSeekTimeout) clearTimeout(pendingSeekTimeout)
              pendingSeekTimeout = setTimeout(() => {
                lastSeekTime = Date.now()
                try {
                  remotionBridge.ref?.seekTo(targetFrame)
                } catch (e) {
                  // Ignore
                }
              }, 60)
            }
          }
        }
      }
    })

    return () => {
      if (pendingSeekTimeout) clearTimeout(pendingSeekTimeout)
      unsub()
    }
  }, [pipWindow])

  const togglePiP = async () => {
    console.log('[Canvas] togglePiP clicked')
    const frame = document.getElementById('phoneFrame')
    
    // Đóng Document PiP nếu đang mở
    if (pipWindow || (window as any).documentPictureInPicture?.window) {
      if (pipWindow) pipWindow.close()
      else (window as any).documentPictureInPicture.window.close()
      return
    }

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
        return
      }

      // Tầng 1: Document Picture-in-Picture API (Chrome 116+)
      if ('documentPictureInPicture' in window && frame) {
        try {
          const newPipWindow = await (window as any).documentPictureInPicture.requestWindow({
            width: 360,
            height: 640
          })

          // Copy toàn bộ style siêu tốc (DOM Node Clone thay vì join rules)
          document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
            newPipWindow.document.head.appendChild(node.cloneNode(true))
          })

          // Live CSS & Font Mutation Mirroring (Đồng bộ font / theme động sang PiP)
          const styleObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
              mutation.addedNodes.forEach((node) => {
                if (node.nodeName === 'STYLE' || (node.nodeName === 'LINK' && (node as HTMLLinkElement).rel === 'stylesheet')) {
                  newPipWindow.document.head.appendChild(node.cloneNode(true))
                }
              })
            }
          })
          styleObserver.observe(document.head, { childList: true, subtree: true })

          newPipWindow.document.body.style.margin = '0'
          newPipWindow.document.body.style.display = 'flex'
          newPipWindow.document.body.style.justifyContent = 'center'
          newPipWindow.document.body.style.alignItems = 'center'
          newPipWindow.document.body.style.background = '#000' // Nền đen
          newPipWindow.document.body.style.height = '100vh'
          newPipWindow.document.body.style.overflow = 'hidden'

          useEditorStore.getState().setIsPipActive(true)
          setPipWindow(newPipWindow)
          
          // Ép màn hình chính về chế độ Edit để có thể vừa Edit vừa Xem
          useEditorStore.getState().setPreviewMode('edit')

          // Lắng nghe khi PiP bị đóng -> reset state và giải phóng bộ nhớ
          newPipWindow.addEventListener('pagehide', () => {
            styleObserver.disconnect()
            useEditorStore.getState().setIsPipActive(false)
            setPipWindow(null)
          })
          return
        } catch (e) {
          console.warn('Document PiP API failed, falling back...', e)
        }
      }
      
      const canvas = canvasRef.current
      const video = videoRef.current
      if (!canvas || !video) return

      // Tầng 2: Canvas Stream PIP (Chỉ hoạt động ở Edit Mode)
      if (previewMode === 'edit' && typeof (canvas as any).captureStream === 'function' && typeof video.requestPictureInPicture === 'function') {
        const stream = (canvas as any).captureStream(30)
        video.srcObject = stream
        
        await video.play()
        await video.requestPictureInPicture()
        return
      }
      throw new Error("Canvas PiP not supported or in Render Mode")
    } catch (error) {
      console.warn('PiP failed, falling back to Fullscreen:', error)
      // Tầng 3: Fullscreen API Fallback
      try {
        if (!document.fullscreenElement && frame) {
          if (frame.requestFullscreen) {
            await frame.requestFullscreen()
          } else if ((frame as any).webkitRequestFullscreen) {
            await (frame as any).webkitRequestFullscreen()
          } else {
            useEditorStore.getState().showToast('❌ Trình duyệt không hỗ trợ Mở cửa sổ nổi', 3000)
          }
        } else if (document.exitFullscreen) {
          await document.exitFullscreen()
        }
      } catch (fsErr) {
        console.error(fsErr)
        useEditorStore.getState().showToast('❌ Trình duyệt chặn mở cửa sổ phụ.', 3000)
      }
    }
  }

  // Listen to external toggle PiP events (e.g. from TopBar)
  useEffect(() => {
    const handlePipEvent = () => {
      togglePiP()
    }
    window.addEventListener('xd-toggle-pip', handlePipEvent)
    return () => window.removeEventListener('xd-toggle-pip', handlePipEvent)
  }, [togglePiP])

  // Handle Fullscreen UI updates
  useEffect(() => {
    const handleFsChange = () => {
      useEditorStore.getState().setIsPipActive(!!document.pictureInPictureElement)
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    document.addEventListener('webkitfullscreenchange', handleFsChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange)
      document.removeEventListener('webkitfullscreenchange', handleFsChange)
    }
  }, [])

  const memoizedInputProps = useMemo(() => ({
    scenes,
    bgMusicUrl: bgMusicUrl || '',
    bgMusicVolume: bgMusicVolume || 0.1,
    audioClips,
    isMuted: isMuted || isMasterMuted,
    masterVolume: masterVolume ?? 1.0,
    voiceoverVolume: voiceoverVolume ?? 1.0,
    sfxVolume: sfxVolume ?? 0.8,
    bgmVolume: bgmVolume ?? 0.8,
    isVoiceMuted: isVoiceMuted || false,
    isSfxMuted: isSfxMuted || false,
    isBgmMuted: isBgmMuted || false,
    soloTrackId: soloTrackId || null,
    soloTrackIds: soloTrackIds || [],
    mutedTrackIds: mutedTrackIds || [],
  }), [
    scenes, bgMusicUrl, bgMusicVolume, audioClips, isMuted, isMasterMuted,
    masterVolume, voiceoverVolume, sfxVolume, bgmVolume,
    isVoiceMuted, isSfxMuted, isBgmMuted, soloTrackId, soloTrackIds, mutedTrackIds
  ])

  return (
    <main
      data-area="canvas"
      className={`${styles.canvasArea} ${isSpacePressed ? styles.spaceActive : ''} ${isDraggingPan ? styles.panning : ''}`}
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
    >
      {/* Figma-style Horizontal & Vertical Pixel Rulers */}
      {showRulers && <CanvasRulers containerRef={containerRef} phoneFrameId="phoneFrame" />}

      {/* dot grid bg */}
      <div className={styles.dotGrid} aria-hidden />

      {/* Hidden video element for PiP relay (Using width/height instead of display:none to prevent browser pausing) */}
      <video ref={videoRef} muted autoPlay playsInline style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none' }} />

      {/* Phone frame with Zoom & Pan transform */}
      <div
        className={`${styles.canvasWrap} ${isDraggingPan ? styles.isDragging : ''}`}
        id="phoneFrameWrap"
        style={{
          marginTop: showRulers ? 30 : 16,
          transform: `translate3d(${canvasPan.x}px, ${canvasPan.y}px, 0px) scale(${effectiveScale})`,
        }}
      >
        <div className={styles.phoneFrame} id="phoneFrame">
          <div className={styles.phoneScreen} style={{ display: previewMode === 'edit' ? 'block' : 'none', position: 'relative' }}>
            {/* Background Video Layer for Canvas Edit Mode */}
            {currentScene?.bgVideoUrl && (
              <video
                src={currentScene.bgVideoUrl}
                autoPlay
                loop={currentScene.bgVideoLoop !== false}
                muted
                playsInline
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  zIndex: 0,
                  pointerEvents: 'none',
                }}
              />
            )}
            <canvas ref={setCanvasNode} style={{ position: 'relative', zIndex: 1 }} />
            {previewMode === 'edit' && <SafeZoneOverlay platform={safeZonePlatform} />}
          </div>

          {previewMode === 'render' && !pipWindow && (
            <div style={{ width: 360, height: 640, overflow: 'hidden', position: 'relative' }}>
              <RemotionPlayer
                ref={remotionPlayerRef}
                component={MainComposition}
                durationInFrames={durationInFrames}
                initialFrame={getSceneStartFrames(scenes, 30)[currentSceneIdx] || 0}
                compositionWidth={360}
                compositionHeight={640}
                fps={30}
                playbackRate={playbackRate || 1.0}
                style={{ width: 360, height: 640, backgroundColor: canvasBgColor }}
                inputProps={memoizedInputProps}
                controls={false}
                loop={true}
                clickToPlay={true}
                acknowledgeRemotionLicense
                numberOfSharedAudioTags={20}
                renderLoading={() => (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: canvasBgColor, color: '#888' }}>
                    <span>Đang tải tài nguyên...</span>
                  </div>
                )}
                errorFallback={({ error }) => (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a0b0b', color: '#FF4455', padding: 20, textAlign: 'center', flexDirection: 'column' }}>
                    <h3 style={{ margin: '0 0 10px 0' }}>Lỗi Tài Nguyên</h3>
                    <span style={{ fontSize: 12, opacity: 0.8 }}>{error.message || 'Không thể tải ảnh/video.'}</span>
                  </div>
                )}
              />
            </div>
          )}
        </div>
      </div>

      {/* PORTAL CỬA SỔ PIP: Live Preview */}
      {pipWindow && createPortal(
        <PipWindowContent
          pipWindow={pipWindow}
          durationInFrames={durationInFrames}
          currentSceneIdx={currentSceneIdx}
          scenes={scenes}
          memoizedInputProps={memoizedInputProps}
          remotionPlayerRef={remotionPlayerRef}
        />,
        pipWindow.document.body
      )}

      {/* AI Assistant Card */}
      <AiCard />

      {/* Floating Draggable Player Controls */}
      <PlayerControls />
    </main>
  )
}
