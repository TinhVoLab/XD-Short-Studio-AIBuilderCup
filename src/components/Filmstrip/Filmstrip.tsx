import React, { useRef } from 'react'
import styles from './Filmstrip.module.css'
import SceneThumb from './SceneThumb'
import MultiAudioTrack from './MultiAudioTrack'
import { MasterAudioMixerModal } from './MasterAudioMixerModal'
import InsertScenePopover from './InsertScenePopover'
import SceneLayerTimingModal from './SceneLayerTimingModal'
import { useEditorStore } from '@/store/useEditorStore'
import { useShallow } from 'zustand/react/shallow'
import { Button, ButtonGroup, SegmentedControl } from '@/components/ui'
import { Scene } from '@/types/scene'
import { smartSfxService } from '@/services/smartSfxService'
import EmotionHeatBar from './EmotionHeatBar/EmotionHeatBar'
import NodeFlowStudio from './NodeFlow/NodeFlowStudio'
import TimelinePlayheadNeedle from './TimelinePlayheadNeedle'

export default function Filmstrip() {
  const { 
    scenes, currentSceneIdx, thumbZoom, setThumbZoom, addScene, insertSceneAt,
    setProgress, audioClips, audioTrackIds, addAudioTrack, removeAudioTrack,
    addAudioClip, removeAudioClip,
    setSelectedAudioClip, selectedSceneIdxs, setSelectedSceneIdxs, toggleSelectedSceneIdx,
    moveSelectedScenes, reorderScene, reorderSelectedScenesTo, deleteSelectedScenes, showToast,
    setAudioMixerOpen, toggleTrackMute, toggleTrackSolo, toggleTrackLock,
    isTrackMuted, isTrackSoloed, lockedTrackIds, undo,
    timelineViewMode, setTimelineViewMode
  } = useEditorStore(
    useShallow(s => ({
      scenes: s.scenes,
      currentSceneIdx: s.currentSceneIdx,
      thumbZoom: s.thumbZoom,
      setThumbZoom: s.setThumbZoom,
      addScene: s.addScene,
      insertSceneAt: s.insertSceneAt,
      setProgress: s.setProgress,
      audioClips: s.audioClips,
      audioTrackIds: s.audioTrackIds,
      addAudioTrack: s.addAudioTrack,
      removeAudioTrack: s.removeAudioTrack,
      addAudioClip: s.addAudioClip,
      removeAudioClip: s.removeAudioClip,
      setSelectedAudioClip: s.setSelectedAudioClip,
      selectedSceneIdxs: s.selectedSceneIdxs,
      setSelectedSceneIdxs: s.setSelectedSceneIdxs,
      toggleSelectedSceneIdx: s.toggleSelectedSceneIdx,
      moveSelectedScenes: s.moveSelectedScenes,
      reorderScene: s.reorderScene,
      reorderSelectedScenesTo: s.reorderSelectedScenesTo,
      deleteSelectedScenes: s.deleteSelectedScenes,
      showToast: s.showToast,
      setAudioMixerOpen: s.setAudioMixerOpen,
      toggleTrackMute: s.toggleTrackMute,
      toggleTrackSolo: s.toggleTrackSolo,
      toggleTrackLock: s.toggleTrackLock,
      isTrackMuted: s.isTrackMuted,
      isTrackSoloed: s.isTrackSoloed,
      lockedTrackIds: s.lockedTrackIds,
      undo: s.undo,
      timelineViewMode: s.timelineViewMode,
      setTimelineViewMode: s.setTimelineViewMode
    }))
  )

  const [confirmDeleteTrackId, setConfirmDeleteTrackId] = React.useState<string | null>(null)
  const [isFlowMaximized, setIsFlowMaximized] = React.useState(false)

  const scenesDur = (scenes || []).reduce((a, s) => a + (s?.duration || 0), 0)
  const audiosDur = (audioClips || []).reduce((max, clip) => {
    if (!clip) return max
    const activeDur = ((clip.playDurationSec ?? clip.duration) || 0) / (clip.playbackRate ?? 1.0)
    return Math.max(max, (clip.startSec || 0) + activeDur)
  }, 0)
  const totalDur = Math.max(1, scenesDur, audiosDur)
  const timelineRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLElement>(null)
  const isDraggingRef = useRef(false)

  const [insertPopover, setInsertPopover] = React.useState<{
    insertIndex: number
    anchorRect: DOMRect
    prevScene?: Scene
    nextScene?: Scene
  } | null>(null)

  const [containerWidth, setContainerWidth] = React.useState<number>(1200)

  // Auto-measure viewport width to ensure 100% full-width track rendering (no truncation)
  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return
    setContainerWidth(el.clientWidth || 1200)
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width)
        }
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Scale: base px per second (48px per second * thumbZoom)
  const BASE_PX_PER_SEC = 48
  const pxPerSec = Math.round(BASE_PX_PER_SEC * thumbZoom)
  
  // Available width excluding 140px tracks sidebar and 24px padding
  const availableTrackWidth = Math.max(600, containerWidth - 164)
  const contentWidth = Math.round(totalDur * pxPerSec)
  const totalWidth = Math.max(availableTrackWidth, contentWidth + 240)

  // Fit whole project into available timeline viewport width
  const handleFitTimeline = () => {
    if (totalDur <= 0 || availableTrackWidth <= 0) return
    const targetPxPerSec = Math.max(16, (availableTrackWidth - 120) / totalDur)
    const calculatedZoom = Number((targetPxPerSec / BASE_PX_PER_SEC).toFixed(2))
    const clampedZoom = Math.min(2.5, Math.max(0.6, calculatedZoom))
    setThumbZoom(clampedZoom)
    showToast(`Đã căn vừa Timeline (${Math.round(clampedZoom * 100)}%)`)
  }

  // Phím tắt Cmd/Ctrl + Lăn chuột để Zoom Timeline mượt mà (60% - 250%)
  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handleWheel = (e: WheelEvent) => {
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault()
        const zoomDelta = e.deltaY < 0 ? 0.15 : -0.15
        const currentZoom = useEditorStore.getState().thumbZoom
        const newZoom = Math.min(2.5, Math.max(0.6, Number((currentZoom + zoomDelta).toFixed(2))))
        useEditorStore.getState().setThumbZoom(newZoom)
      }
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', handleWheel)
    }
  }, [])

  // Phím tắt ~ (Tilde) để phóng to / thu nhỏ Sơ đồ luồng (chuẩn Premiere / Blender)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '~' || e.key === '`') && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        if (timelineViewMode === 'node-flow') {
          e.preventDefault()
          setIsFlowMaximized(prev => !prev)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [timelineViewMode])

  const seekFromMouseEvent = (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
    if (!timelineRef.current) return
    const rect = timelineRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left - 12 // 12px padding offset
    const clickedSec = Math.max(0, Math.min(totalDur, clickX / pxPerSec))
    const pct = totalDur > 0 ? (clickedSec / totalDur) * 100 : 0
    setProgress(pct)
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only drag seek if clicking outside interactive elements
    const target = e.target as HTMLElement
    if (target.closest(`.${styles.scene}`) || target.closest('button') || target.closest('[data-audioclip]')) {
      return
    }
    e.preventDefault()
    isDraggingRef.current = true
    setSelectedAudioClip(null)
    setSelectedSceneIdxs([])
    seekFromMouseEvent(e)
  }

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        seekFromMouseEvent(e)
      }
    }
    const handleMouseUp = () => {
      isDraggingRef.current = false
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [totalWidth])

  // Continuous Ruler Ticks spanning the entire viewport
  const maxRulerSec = Math.ceil(totalWidth / pxPerSec)
  const tickStep = pxPerSec >= 70 ? 1 : (pxPerSec >= 32 ? 2 : 5)
  const ticks = []
  for (let sec = 0; sec <= maxRulerSec; sec += tickStep) {
    ticks.push({ 
      sec, 
      left: sec * pxPerSec,
      isPastEnd: sec > totalDur
    })
  }

  const isVideoLocked = lockedTrackIds.includes('V1')

  return (
    <footer data-area="filmstrip" ref={containerRef} className={`${styles.filmstrip} ${isFlowMaximized ? styles.maximized : ''}`}>
      {/* 1. Header controls */}
      <div className={styles.header}>
        {/* Cluster 1: Scene Management & Viral Pacing */}
        <div className={styles.cluster}>
          <div className={styles.titleGroup}>
            <span className={styles.title}>Timeline</span>
            <span className={styles.badge}>{scenes.length} Cảnh</span>
          </div>

          <SegmentedControl
            size="xs"
            value={timelineViewMode}
            onChange={(val) => setTimelineViewMode(val as 'tracks' | 'node-flow')}
            options={[
              { value: 'tracks', label: 'Dòng thời gian' },
              { value: 'node-flow', label: 'Sơ đồ luồng' },
            ]}
          />

          <div className={styles.divider} />

          {selectedSceneIdxs.length > 1 ? (
            <div className={styles.selectedScenesBar}>
              <span>Đã chọn {selectedSceneIdxs.length} cảnh</span>
              <ButtonGroup>
                <Button
                  asIcon
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => {
                    if (isVideoLocked) {
                      showToast('Track Video V1 đang bị khóa!')
                      return
                    }
                    moveSelectedScenes(-1)
                  }}
                  title="Dời sang trái"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
                </Button>
                <Button
                  asIcon
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => {
                    if (isVideoLocked) {
                      showToast('Track Video V1 đang bị khóa!')
                      return
                    }
                    moveSelectedScenes(1)
                  }}
                  title="Dời sang phải"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
                </Button>
                <Button
                  asIcon
                  variant="danger"
                  size="icon-xs"
                  onClick={() => {
                    if (isVideoLocked) {
                      showToast('Track Video V1 đang bị khóa!')
                      return
                    }
                    deleteSelectedScenes()
                    showToast(`Đã xóa ${selectedSceneIdxs.length} cảnh`)
                  }}
                  title="Xóa tất cả cảnh đã chọn"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                </Button>
                <Button
                  asIcon
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setSelectedSceneIdxs([])}
                  title="Bỏ chọn"
                >
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </Button>
              </ButtonGroup>
            </div>
          ) : (
            <>
              <Button 
                variant="secondary"
                size="xs"
                onClick={() => {
                  if (isVideoLocked) {
                    showToast('Track Video V1 đang bị khóa!')
                    return
                  }
                  addScene()
                  showToast('Đã thêm cảnh mới!')
                }}
                leftIcon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>}
                title="Thêm một cảnh mới vào cuối Timeline"
              >
                Thêm Cảnh
              </Button>
              <Button 
                variant="secondary"
                size="xs"
                onClick={() => {
                  if (isVideoLocked) {
                    showToast('Track Video V1 đang bị khóa!')
                    return
                  }
                  const { applyViralPacingToAllScenes } = useEditorStore.getState()
                  applyViralPacingToAllScenes()
                  showToast('Đã chia nhịp theo vai cảnh: thời lượng khớp giọng đọc, không ngắn hơn mức tối thiểu của từng vai')
                }}
                leftIcon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>}
                title="Gán vai Mở đầu / Nội dung / Điểm nhấn / Kết thúc theo vị trí cảnh và đặt thời lượng khớp giọng đọc"
              >
                Chia Nhịp
              </Button>
            </>
          )}

          <div className={styles.divider} />

          {/* Cluster 2: Audio & Mixer Tools */}
          <Button 
            variant="primary"
            size="xs"
            onClick={() => setAudioMixerOpen(true)}
            leftIcon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>}
            title="Mở Bàn Trộn Âm Thanh Tổng (Master Audio Mixer)"
          >
            Mixer Tổng
          </Button>
          <Button 
            variant="secondary"
            size="xs"
            onClick={() => {
              const clips = smartSfxService.generateClipsForScenes(scenes, { volume: 0.72 })
              if (clips.length === 0) {
                showToast('Chưa có chuyển động hình ảnh nào cần phủ SFX')
                return
              }
              const currentA2 = (audioClips || []).filter(c => c.trackId === 'A2')
              currentA2.forEach(c => removeAudioClip(c.id))
              clips.forEach(c => {
                const { id, ...data } = c
                addAudioClip(data)
              })
              showToast(`Đã tự động phủ ${clips.length} hiệu ứng âm thanh điện ảnh vào Track A2!`)
            }}
            leftIcon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>}
            title="Tự động phân tích toàn bộ chuyển động hình ảnh và gắn Sound Effects (Whoosh, Ding, Pop) vào Track A2"
          >
            Phủ SFX
          </Button>
          <Button 
            variant="secondary"
            size="xs"
            onClick={addAudioTrack}
            leftIcon={<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>}
            title="Thêm một Track Audio mới (A2, A3...)"
          >
            + Track Audio
          </Button>
        </div>

        {/* Cluster 3: Timeline Stats & CapCut-Style Zoom */}
        <div className={styles.cluster}>
          <div className={styles.durationBadge}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>{String(Math.floor(totalDur / 60)).padStart(2, '0')}:{String(Math.floor(totalDur % 60)).padStart(2, '0')}s</span>
          </div>

          <div className={styles.zoomGroup}>
            <Button
              asIcon
              variant="ghost"
              size="icon-xs"
              onClick={() => setThumbZoom(Math.max(0.6, Number((thumbZoom - 0.15).toFixed(2))))}
              title="Thu nhỏ Timeline"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </Button>
            <input
              type="range"
              className={styles.zoom}
              min={60}
              max={250}
              step={5}
              value={Math.round(thumbZoom * 100)}
              onChange={e => setThumbZoom(+e.target.value / 100)}
              title="Kéo thanh trượt hoặc dùng phím tắt Cmd + Lăn chuột để Zoom Timeline"
            />
            <Button
              asIcon
              variant="ghost"
              size="icon-xs"
              onClick={() => setThumbZoom(Math.min(2.5, Number((thumbZoom + 0.15).toFixed(2))))}
              title="Phóng to Timeline"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={handleFitTimeline}
              style={{ fontSize: '10px', padding: '1px 6px', height: '20px', color: '#BEFF01', fontWeight: 700 }}
              title="Tự động thu phóng để vừa khít toàn bộ video trên màn hình (Fit View)"
            >
              Fit
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setThumbZoom(1.0)}
              style={{ fontSize: '10px', padding: '1px 5px', height: '20px' }}
              title="Đưa về tỉ lệ chuẩn 100%"
            >
              100%
            </Button>
          </div>
        </div>
      </div>

      {timelineViewMode === 'node-flow' ? (
        <NodeFlowStudio
          onClose={() => setTimelineViewMode('tracks')}
          isMaximized={isFlowMaximized}
          onToggleMaximize={() => setIsFlowMaximized(prev => !prev)}
        />
      ) : (
        /* 2. Main Timeline Workspace with Track Labels Column & Scrollable Tracks */
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        
        {/* Track Labels Column (Left side) */}
        <div className={styles.tracksSidebar}>
          {/* Spacer căn chỉnh đồng bộ với Emotion Heat Bar bên phải */}
          <div style={{ height: '10px', boxSizing: 'border-box', flexShrink: 0 }} />

          <div className={styles.tracksSidebarHeader}>
            <span>TRACKS</span>
            <span style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>NLE</span>
          </div>

          {/* Video V1 Label */}
          <div className={styles.videoTrackHeader}>
            <div className={styles.trackColorBar} style={{ background: '#BEFF01' }} />
            <div className={styles.trackInfo}>
              <span className={styles.trackBadge} style={{ background: 'rgba(190, 255, 1, 0.15)', color: '#BEFF01', border: '1px solid rgba(190, 255, 1, 0.3)' }}>V1</span>
              <span className={styles.trackName} style={{ color: '#BEFF01' }}>Video</span>
            </div>
            <div className={styles.trackControls}>
              <button 
                className={`${styles.trackToggle} ${isVideoLocked ? styles.lockActive : ''}`} 
                onClick={() => {
                  toggleTrackLock('V1');
                  showToast(isVideoLocked ? 'Đã mở khóa Track Video V1' : 'Đã khóa Track Video V1');
                }}
                title={isVideoLocked ? "Mở khóa Track Video" : "Khóa Track Video (Lock)"}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d={isVideoLocked ? "M7 11V7a5 5 0 0110 0v4" : "M7 11V7a5 5 0 019.9-1"} />
                </svg>
              </button>
            </div>
          </div>

          {/* Dynamic Audio Track Labels */}
          {audioTrackIds.map((trackId, index) => {
            const isVoice = trackId === 'A1' || trackId.toLowerCase().includes('voice');
            const isSfx = trackId === 'A2' || trackId.toLowerCase().includes('sfx');
            const isBgm = trackId === 'A3' || trackId.toLowerCase().includes('bgm') || trackId.toLowerCase().includes('music');

            let badge = 'A1';
            let name = 'Voice';
            let color = '#00FF88';
            let tooltip = 'Kênh Giọng Đọc AI & Thoại';

            if (isSfx) {
              badge = 'A2';
              name = 'SFX';
              color = '#FFB800';
              tooltip = 'Kênh Hiệu Ứng Âm Thanh (SFX)';
            } else if (isBgm) {
              badge = 'A3';
              name = 'BGM';
              color = '#C084FC';
              tooltip = 'Kênh Nhạc Nền (BGM)';
            } else if (index >= 3) {
              badge = `A${index + 1}`;
              name = `SFX ${index - 1}`;
              color = '#FFB800';
              tooltip = 'Kênh Hiệu Ứng Phụ';
            }

            const isMuted = isTrackMuted(trackId);
            const isSoloed = isTrackSoloed(trackId);

            return (
              <div 
                key={trackId} 
                className={styles.trackHeader}
                style={{ opacity: isMuted ? 0.6 : 1 }}
                title={tooltip}
              >
                <div className={styles.trackColorBar} style={{ background: color }} />
                
                <div className={styles.trackInfo}>
                  <span 
                    className={styles.trackBadge}
                    style={{ 
                      background: `${color}18`, 
                      color: color, 
                      border: `1px solid ${color}40` 
                    }}
                  >
                    {badge}
                  </span>
                  <span className={styles.trackName} style={{ textDecoration: isMuted ? 'line-through' : 'none' }}>{name}</span>
                </div>

                <div className={styles.trackControls}>
                  {confirmDeleteTrackId === trackId ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        background: 'rgba(255, 68, 68, 0.15)',
                        border: '1px solid rgba(255, 68, 68, 0.3)',
                        borderRadius: 4,
                        padding: '1px 4px',
                      }}
                      onClick={e => e.stopPropagation()}
                    >
                      <span style={{ fontSize: 9.5, color: '#FF6B6B', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {audioClips.filter(c => c.trackId === trackId).length > 0
                          ? `Xóa ${audioClips.filter(c => c.trackId === trackId).length} clip?`
                          : 'Xóa track?'}
                      </span>
                      <button
                        style={{
                          background: '#FF4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 3,
                          fontSize: 9.5,
                          fontWeight: 700,
                          padding: '1px 5px',
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          const count = audioClips.filter(c => c.trackId === trackId).length
                          removeAudioTrack(trackId)
                          setConfirmDeleteTrackId(null)
                          showToast(`Đã xóa Track ${badge}${count > 0 ? ` (${count} clip)` : ''}`, 4500, {
                            label: 'Hoàn tác',
                            onClick: () => undo()
                          })
                        }}
                        title="Xác nhận xóa track"
                      >
                        Xóa
                      </button>
                      <button
                        style={{
                          background: 'transparent',
                          color: 'var(--text-sub, #8b949e)',
                          border: 'none',
                          fontSize: 10,
                          cursor: 'pointer',
                          padding: '1px 3px',
                        }}
                        onClick={() => setConfirmDeleteTrackId(null)}
                        title="Hủy"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      <button 
                        className={`${styles.trackToggle} ${isMuted ? styles.muteActive : ''}`} 
                        onClick={() => {
                          toggleTrackMute(trackId);
                          showToast(isMuted ? `Đã bật tiếng ${name} (${badge})` : `Đã tắt tiếng ${name} (${badge})`);
                        }}
                        title={isMuted ? "Bật lại tiếng (Unmute)" : "Tắt tiếng Track này (Mute)"}
                      >
                        M
                      </button>
                      <button 
                        className={`${styles.trackToggle} ${isSoloed ? styles.soloActive : ''}`} 
                        onClick={() => {
                          toggleTrackSolo(trackId);
                          showToast(isSoloed ? `Đã tắt chế độ Solo (${badge})` : `Solo: Chỉ nghe ${name} (${badge})`);
                        }}
                        title={isSoloed ? "Tắt chế độ Solo" : "Nghe độc lập Track này (Solo)"}
                      >
                        S
                      </button>
                      {audioTrackIds.length > 1 && (
                        <button
                          className={styles.trackDelete}
                          onClick={() => setConfirmDeleteTrackId(trackId)}
                          title={`Xóa Track ${trackId}`}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Scrollable Tracks & Timeline Ruler (Right side) */}
        <div style={{ flex: 1, overflowX: 'auto', position: 'relative', display: 'flex', flexDirection: 'column' }}>
          
          <div 
            ref={timelineRef}
            onMouseDown={handleMouseDown}
            style={{ width: `${totalWidth}px`, minWidth: '100%', position: 'relative', display: 'flex', flexDirection: 'column', padding: '0 12px', cursor: 'ew-resize', minHeight: '100%', boxSizing: 'border-box' }}
          >
            {/* Emotion Heat Bar */}
            <div style={{ width: '100%', minWidth: `${totalWidth}px`, height: '10px', boxSizing: 'border-box', padding: '3.5px 0', position: 'relative', display: 'flex', alignItems: 'center' }}>
              <div style={{ width: `${Math.max(120, contentWidth)}px`, position: 'relative' }}>
                <EmotionHeatBar
                  scenes={scenes}
                  totalDur={totalDur}
                  height={3}
                  showPins={true}
                  showTooltip={true}
                  onSeek={(sec) => {
                    if (totalDur > 0) {
                      setProgress((sec / totalDur) * 100)
                    }
                  }}
                />
              </div>
            </div>

            {/* Timeline Ruler */}
            <div style={{ height: '24px', boxSizing: 'border-box', borderBottom: '1px solid var(--border)', position: 'relative', width: '100%', minWidth: `${totalWidth}px` }}>
              {ticks.map(t => (
                <div key={t.sec} style={{ position: 'absolute', left: `${t.left}px`, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'flex-start' }}>
                  <div style={{ width: '1px', height: t.sec % 10 === 0 ? '8px' : '5px', background: t.isPastEnd ? 'rgba(255,255,255,0.08)' : (t.sec % 10 === 0 ? '#888' : '#555') }} />
                  <span style={{ fontSize: '9px', color: t.isPastEnd ? 'rgba(255,255,255,0.2)' : '#888', transform: 'translateX(-50%)', marginBottom: '2px', fontFamily: 'monospace' }}>
                    {t.sec}s
                  </span>
                </div>
              ))}
            </div>

            {/* Vertical Playhead Needle (Isolated 60FPS component) */}
            <TimelinePlayheadNeedle pxPerSec={pxPerSec} />

            {/* TRACK V1: Scene Clips */}
            <div style={{ display: 'flex', gap: '0px', height: '84px', boxSizing: 'border-box', alignItems: 'center', borderBottom: '1px solid var(--border)', padding: '0', width: '100%', minWidth: `${totalWidth}px` }}>
              {/* Insert Seam at start of video */}
              <div
                className={styles.insertSeam}
                onClick={(e) => {
                  if (isVideoLocked) {
                    showToast('Track Video V1 đang bị khóa!')
                    return
                  }
                  const rect = e.currentTarget.getBoundingClientRect()
                  setInsertPopover({
                    insertIndex: 0,
                    anchorRect: rect,
                    prevScene: undefined,
                    nextScene: scenes[0],
                  })
                }}
                title={isVideoLocked ? "Track Video đang bị khóa" : "Chèn cảnh mới vào đầu video"}
              >
                <div className={styles.insertLine} />
                <div className={styles.insertBtn}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M5 1.5V8.5M1.5 5H8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

              {scenes.map((scene, i) => (
                <React.Fragment key={scene.id}>
                  <SceneThumb 
                    scene={scene} 
                    index={i} 
                    total={scenes.length}
                    isActive={i === currentSceneIdx} 
                    isSelected={selectedSceneIdxs.includes(i)}
                    zoom={thumbZoom} 
                    clipWidth={Math.max(28, Math.round((scene.duration || 3) * pxPerSec))}
                    pxPerSec={pxPerSec}
                    onSelect={(idx, addMode) => {
                      if (addMode) {
                        toggleSelectedSceneIdx(idx)
                      } else {
                        setSelectedSceneIdxs([idx])
                      }
                    }}
                    onDragReorder={(fromIdx, targetIdx, position) => {
                      if (isVideoLocked) {
                        showToast('Track Video V1 đang bị khóa!')
                        return
                      }
                      if (selectedSceneIdxs.length > 1 && selectedSceneIdxs.includes(fromIdx)) {
                        reorderSelectedScenesTo(targetIdx, position)
                        showToast(`✨ Đã dời nhóm ${selectedSceneIdxs.length} cảnh`)
                      } else {
                        let toIdx = targetIdx
                        if (position === 'after' && fromIdx < targetIdx) {
                          toIdx = targetIdx
                        } else if (position === 'before' && fromIdx > targetIdx) {
                          toIdx = targetIdx
                        } else if (position === 'after' && fromIdx > targetIdx) {
                          toIdx = targetIdx + 1
                        } else if (position === 'before' && fromIdx < targetIdx) {
                          toIdx = Math.max(0, targetIdx - 1)
                        }
                        reorderScene(fromIdx, toIdx)
                        showToast(`✨ Đã dời cảnh ${fromIdx + 1} tới vị trí ${toIdx + 1}`)
                      }
                    }}
                  />

                  {/* Insert Seam between scenes */}
                  <div
                    className={styles.insertSeam}
                    onClick={(e) => {
                      if (isVideoLocked) {
                        showToast('Track Video V1 đang bị khóa!')
                        return
                      }
                      const rect = e.currentTarget.getBoundingClientRect()
                      setInsertPopover({
                        insertIndex: i + 1,
                        anchorRect: rect,
                        prevScene: scenes[i],
                        nextScene: scenes[i + 1],
                      })
                    }}
                    title={isVideoLocked ? "Track Video đang bị khóa" : `Chèn cảnh mới vào giữa Cảnh ${i + 1} và Cảnh ${i + 2}`}
                  >
                    <div className={styles.insertLine} />
                    <div className={styles.insertBtn}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M5 1.5V8.5M1.5 5H8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                </React.Fragment>
              ))}

              <button 
                className={styles.addBtn} 
                onClick={(e) => {
                  if (isVideoLocked) {
                    showToast('Track Video V1 đang bị khóa!')
                    return
                  }
                  const rect = e.currentTarget.getBoundingClientRect()
                  setInsertPopover({
                    insertIndex: scenes.length,
                    anchorRect: rect,
                    prevScene: scenes[scenes.length - 1],
                    nextScene: undefined,
                  })
                }} 
                style={{ height: '78px', width: '80px', flexShrink: 0, marginLeft: '6px' }}
                title="Thêm cảnh mới vào cuối video (Cảnh trống hoặc Tạo bằng AI)"
              >
                <svg width="14" height="14" viewBox="0 0 14 14"><path d="M7 2.5V11.5M2.5 7H11.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                <span>Thêm cảnh</span>
              </button>
            </div>

            {/* Dynamic Audio Tracks (A1, A2, A3...) */}
            {audioTrackIds.map(trackId => (
              <div key={trackId} style={{ height: '42px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)', width: '100%', minWidth: `${totalWidth}px` }}>
                <MultiAudioTrack trackId={trackId} totalWidth={totalWidth} pxPerSec={pxPerSec} />
              </div>
            ))}

          </div>
        </div>

      </div>
      )}

      {/* Popover Chèn Cảnh Nhanh & Tạo Cảnh Bằng AI tại Timeline Seams */}
      {insertPopover && (
        <InsertScenePopover
          insertIndex={insertPopover.insertIndex}
          anchorRect={insertPopover.anchorRect}
          prevScene={insertPopover.prevScene}
          nextScene={insertPopover.nextScene}
          onClose={() => setInsertPopover(null)}
        />
      )}

      {/* Studio Master Audio Mixer Modal */}
      <MasterAudioMixerModal />

      {/* Scene Layer Timing & Stagger Modal (Quick Inspector) */}
      <SceneLayerTimingModal />
    </footer>
  )
}
