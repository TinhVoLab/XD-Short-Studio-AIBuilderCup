import React, { useRef, useState } from 'react'
import { API_BASE } from '@/config/api'
import { AudioTrackClip } from '@/types/scene'
import { useEditorStore } from '@/store/useEditorStore'
import { getAudioDuration } from '@/utils/audio'
import { VolumeKnobModal } from './VolumeKnobModal'
import { AudioWaveformRenderer } from './AudioWaveformRenderer'
import { useShallow } from 'zustand/react/shallow'

export default React.memo(function MultiAudioTrack({ 
  trackId, 
  totalWidth, 
  pxPerSec 
}: { 
  trackId: string
  totalWidth: number 
  pxPerSec: number 
}) {
  const { 
    audioClips, addAudioClip, removeAudioClip, duplicateAudioClip, updateAudioClip, 
    setActivePanel, showToast, selectedAudioClipId, selectedAudioClipIds, 
    setSelectedAudioClip, setSelectedAudioClips, toggleSelectAudioClip,
    isTrackMuted, isTrackSoloed, soloTrackIds, soloTrackId
  } = useEditorStore(useShallow(s => ({
    audioClips: s.audioClips,
    addAudioClip: s.addAudioClip,
    removeAudioClip: s.removeAudioClip,
    duplicateAudioClip: s.duplicateAudioClip,
    updateAudioClip: s.updateAudioClip,
    setActivePanel: s.setActivePanel,
    showToast: s.showToast,
    selectedAudioClipId: s.selectedAudioClipId,
    selectedAudioClipIds: s.selectedAudioClipIds || [],
    setSelectedAudioClip: s.setSelectedAudioClip,
    setSelectedAudioClips: s.setSelectedAudioClips,
    toggleSelectAudioClip: s.toggleSelectAudioClip,
    isTrackMuted: s.isTrackMuted,
    isTrackSoloed: s.isTrackSoloed,
    soloTrackIds: s.soloTrackIds,
    soloTrackId: s.soloTrackId
  })))

  const isMuted = isTrackMuted(trackId)
  const isSoloed = isTrackSoloed(trackId)
  const hasAnySolo = (soloTrackIds && soloTrackIds.length > 0) || !!soloTrackId
  const isSilenced = hasAnySolo ? !isSoloed : isMuted

  const clips = audioClips.filter(c => c.trackId === trackId)
  const draggingClipIdRef = useRef<string | null>(null)
  const dragStartXRef = useRef<number>(0)
  const initialStartsMapRef = useRef<Map<string, number>>(new Map())
  const [playingClipId, setPlayingClipId] = useState<string | null>(null)
  const [activeVolumeClipId, setActiveVolumeClipId] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; clip: AudioTrackClip } | null>(null)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)

  // Close context menu on outside click
  React.useEffect(() => {
    if (!contextMenu) return
    const close = () => setContextMenu(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [contextMenu])

  const handleDropFiles = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const files = Array.from(e.dataTransfer.files).filter(
      f => f.type.startsWith('audio/') || f.name.match(/\.(mp3|wav|m4a|aac|ogg)$/i)
    )
    if (files.length === 0) return

    showToast(`⏳ Đang tải ${files.length} file audio vào Timeline...`)

    const trackRect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const clickX = e.clientX - trackRect.left
    const dropStartSec = Math.max(0, Math.round((clickX / pxPerSec) * 10) / 10)

    const fileToDataUri = (file: File): Promise<string> => {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => resolve(URL.createObjectURL(file))
        reader.readAsDataURL(file)
      })
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      let url = ''

      try {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: formData })
        const data = res.ok ? await res.json() : null
        if (data?.url) {
          url = data.url
        }
      } catch (err) {
        console.warn('Cannot upload audio to server, converting to Data URI...', err)
      }

      if (!url) {
        // Fallback to Data URI if file <= 5MB to ensure it persists in localStorage when saved
        if (file.size <= 5 * 1024 * 1024) {
          url = await fileToDataUri(file)
        } else {
          url = URL.createObjectURL(file)
          showToast(`⚠️ File "${file.name}" quá lớn nên chỉ lưu tạm trong phiên này.`)
        }
      }

      try {
        const realDuration = await getAudioDuration(url)
        addAudioClip({
          name: file.name,
          url,
          startSec: dropStartSec + i * 2,
          duration: realDuration,
          playDurationSec: realDuration,
          volume: trackId === 'A2' ? 0.35 : 1.0,
          trackId
        })
      } catch (err) {
        console.error('Failed to get audio duration:', err)
      }
    }

    showToast(`🎵 Đã thêm ${files.length} Audio Clip trực tiếp vào Timeline!`)
  }

  const SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0]

  const cycleClipSpeed = (e: React.MouseEvent, clip: AudioTrackClip) => {
    e.stopPropagation()
    const currentSpeed = clip.playbackRate ?? 1.0
    const idx = SPEEDS.indexOf(currentSpeed)
    const nextSpeed = SPEEDS[(idx + 1) % SPEEDS.length]
    updateAudioClip(clip.id, { playbackRate: nextSpeed })
    showToast(`⚡ Tốc độ (${clip.name}): ${nextSpeed}x`)
  }

  const handleMouseDown = (e: React.MouseEvent, clip: AudioTrackClip) => {
    e.stopPropagation()

    const isMultiSelectKey = e.shiftKey || e.metaKey || e.ctrlKey
    if (isMultiSelectKey) {
      toggleSelectAudioClip(clip.id)
      return
    }

    const currentSelected = useEditorStore.getState().selectedAudioClipIds || []
    const isAlreadySelected = currentSelected.includes(clip.id)
    const activeSelectedIds = isAlreadySelected ? currentSelected : [clip.id]

    if (!isAlreadySelected) {
      setSelectedAudioClip(clip.id)
    }

    draggingClipIdRef.current = clip.id
    dragStartXRef.current = e.clientX

    // Snapshot start positions of all currently selected clips
    const startsMap = new Map<string, number>()
    const allClips = useEditorStore.getState().audioClips
    allClips.forEach(c => {
      if (activeSelectedIds.includes(c.id)) {
        startsMap.set(c.id, c.startSec)
      }
    })
    initialStartsMapRef.current = startsMap

    const handleMouseMove = (me: MouseEvent) => {
      if (!draggingClipIdRef.current) return
      const deltaPx = me.clientX - dragStartXRef.current
      const deltaSec = deltaPx / pxPerSec

      let minStart = Infinity
      initialStartsMapRef.current.forEach((val) => {
        if (val < minStart) minStart = val
      })
      if (minStart === Infinity) minStart = 0

      // Clamp so that no selected clip moves before 0.0s
      const clampedDelta = Math.max(-minStart, deltaSec)

      initialStartsMapRef.current.forEach((initialStart, clipId) => {
        const newStartSec = Math.max(0, Math.round((initialStart + clampedDelta) * 10) / 10)
        updateAudioClip(clipId, { startSec: newStartSec })
      })
    }

    const handleMouseUp = () => {
      draggingClipIdRef.current = null
      initialStartsMapRef.current.clear()
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const handleTrimLeft = (e: React.MouseEvent, clip: AudioTrackClip) => {
    e.stopPropagation()
    const startX = e.clientX
    const initialStartSec = clip.startSec
    const initialTrimStart = clip.trimStartSec ?? 0
    const initialPlayDur = clip.playDurationSec ?? clip.duration
    const rate = clip.playbackRate ?? 1.0

    const handleMouseMove = (me: MouseEvent) => {
      const deltaPx = me.clientX - startX
      const deltaTimelineSec = deltaPx / pxPerSec
      const deltaMediaSec = deltaTimelineSec * rate

      const newTrimStart = Math.max(0, Math.min(clip.duration - 0.5, initialTrimStart + deltaMediaSec))
      const actualDeltaMedia = newTrimStart - initialTrimStart
      const newPlayDur = Math.max(0.5, initialPlayDur - actualDeltaMedia)
      const newStartSec = Math.max(0, initialStartSec + (actualDeltaMedia / rate))

      updateAudioClip(clip.id, {
        startSec: Math.round(newStartSec * 10) / 10,
        trimStartSec: Math.round(newTrimStart * 10) / 10,
        playDurationSec: Math.round(newPlayDur * 10) / 10
      })
    }

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const lastToastTimeRef = useRef<number>(0)
  const [trimRightAtMaxClipId, setTrimRightAtMaxClipId] = useState<string | null>(null)

  const handleTrimRight = (e: React.MouseEvent, clip: AudioTrackClip) => {
    e.stopPropagation()
    const startX = e.clientX
    const initialTrimStart = clip.trimStartSec ?? 0
    const initialPlayDur = clip.playDurationSec ?? clip.duration
    const rate = clip.playbackRate ?? 1.0

    // Hard cap: Không cho phép kéo dài vượt quá độ dài thực tế của file âm thanh
    const maxPlayDur = Math.max(0.1, clip.duration - initialTrimStart)

    const handleMouseMove = (me: MouseEvent) => {
      const deltaPx = me.clientX - startX
      const deltaTimelineSec = deltaPx / pxPerSec
      const deltaMediaSec = deltaTimelineSec * rate
      // Giới hạn trong khoảng [0.1s, maxPlayDur]
      const clampedPlayDur = Math.max(0.1, Math.min(maxPlayDur, initialPlayDur + deltaMediaSec))

      const atOrPastMax = clampedPlayDur >= maxPlayDur - 0.05
      setTrimRightAtMaxClipId(atOrPastMax ? clip.id : null)

      if (atOrPastMax && initialPlayDur + deltaMediaSec > maxPlayDur) {
        const now = Date.now()
        if (now - lastToastTimeRef.current > 2000) {
          showToast(`⚠️ "${clip.name}" đã đạt độ dài tối đa của file (${clip.duration.toFixed(1)}s)`)
          lastToastTimeRef.current = now
        }
      }

      updateAudioClip(clip.id, {
        playDurationSec: Math.round(clampedPlayDur * 10) / 10
      })
    }

    const handleMouseUp = () => {
      setTrimRightAtMaxClipId(null)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  // Cleanup audio preview on unmount
  React.useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause()
        previewAudioRef.current = null
      }
    }
  }, [])

  const togglePreviewClip = (clip: AudioTrackClip, e?: React.MouseEvent) => {
    e?.stopPropagation?.()
    if (!clip.url) {
      showToast(`⚠️ Clip "${clip.name}" không có URL âm thanh hợp lệ!`)
      return
    }

    if (playingClipId === clip.id) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause()
        previewAudioRef.current.currentTime = 0
      }
      setPlayingClipId(null)
      return
    }

    if (previewAudioRef.current) {
      previewAudioRef.current.pause()
    }

    try {
      const audio = new Audio(clip.url)
      previewAudioRef.current = audio
      audio.volume = Math.max(0, Math.min(1, clip.volume ?? 1.0))
      audio.playbackRate = clip.playbackRate ?? 1.0
      audio.currentTime = clip.trimStartSec ?? 0

      const playDur = clip.playDurationSec ?? clip.duration
      const endTime = (clip.trimStartSec ?? 0) + playDur

      audio.ontimeupdate = () => {
        if (audio.currentTime >= endTime) {
          audio.pause()
          setPlayingClipId(null)
        }
      }

      audio.onended = () => {
        setPlayingClipId(null)
      }

      audio.onerror = () => {
        showToast(`Không thể phát file âm thanh "${clip.name}"`)
        setPlayingClipId(null)
      }

      audio.play().then(() => {
        setPlayingClipId(clip.id)
      }).catch(err => {
        console.warn('Direct Audio preview prevented, falling back to timeline playback:', err)
        const { setPlaying, setProgress, scenes, audioClips } = useEditorStore.getState()
        const scenesDur = (scenes || []).reduce((a, s) => a + (s?.duration || 0), 0)
        const audiosDur = (audioClips || []).reduce((max, c) => Math.max(max, (c?.startSec || 0) + ((c?.playDurationSec ?? c?.duration) || 0)), 0)
        const totalDur = Math.max(1, scenesDur, audiosDur)
        setProgress((clip.startSec / totalDur) * 100)
        setPlaying(true)
      })
    } catch (err) {
      console.error('Failed to preview audio:', err)
    }
  }

  const handleSelectAllOnTrack = () => {
    const trackClipIds = clips.map(c => c.id)
    if (trackClipIds.length > 0) {
      setSelectedAudioClips(trackClipIds)
      showToast(`Đã chọn tất cả ${trackClipIds.length} clip trên Track ${trackId}`)
    }
  }

  const handleSelectForward = (fromClip: AudioTrackClip) => {
    const forwardClipIds = clips.filter(c => c.startSec >= fromClip.startSec).map(c => c.id)
    if (forwardClipIds.length > 0) {
      setSelectedAudioClips(forwardClipIds)
      showToast(`Đã chọn ${forwardClipIds.length} clip từ vị trí này về sau`)
    }
  }

  const handleDeleteSelected = () => {
    const idsToDelete = (selectedAudioClipIds.length > 0) ? selectedAudioClipIds : (contextMenu ? [contextMenu.clip.id] : [])
    idsToDelete.forEach(id => removeAudioClip(id))
    showToast(`Đã xóa ${idsToDelete.length} clip`)
    setContextMenu(null)
  }

  const getTrackTheme = (tId: string) => {
    const isVoice = tId === 'A1' || tId.toLowerCase().includes('voice')
    const isSfx = tId === 'A2' || tId.toLowerCase().includes('sfx')
    const isBgm = tId === 'A3' || tId.toLowerCase().includes('bgm') || tId.toLowerCase().includes('music')

    if (isVoice) {
      return {
        color: '#00FF88',
        bgColor: 'rgba(0, 255, 136, 0.03)',
        borderColor: 'rgba(0, 255, 136, 0.2)',
        icon: (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
        ),
        text: 'Kênh Giọng Đọc (A1) — Kéo thả file audio hoặc tạo giọng AI'
      }
    }
    if (isSfx) {
      return {
        color: '#FFB800',
        bgColor: 'rgba(255, 184, 0, 0.03)',
        borderColor: 'rgba(255, 184, 0, 0.2)',
        icon: (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
          </svg>
        ),
        text: 'Kênh Hiệu Ứng SFX (A2) — Bấm "Phủ SFX" hoặc kéo thả file'
      }
    }
    if (isBgm) {
      return {
        color: '#C084FC',
        bgColor: 'rgba(192, 132, 252, 0.03)',
        borderColor: 'rgba(192, 132, 252, 0.2)',
        icon: (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13"/>
            <circle cx="6" cy="18" r="3"/>
            <circle cx="18" cy="16" r="3"/>
          </svg>
        ),
        text: 'Kênh Nhạc Nền BGM (A3) — Kéo thả file nhạc hoặc dùng Suno AI'
      }
    }
    return {
      color: '#38BDF8',
      bgColor: 'rgba(56, 189, 248, 0.03)',
      borderColor: 'rgba(56, 189, 248, 0.2)',
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V5l12-2v13"/>
          <circle cx="6" cy="18" r="3"/>
          <circle cx="18" cy="16" r="3"/>
        </svg>
      ),
      text: `Kênh Âm Thanh (${tId}) — Kéo thả file âm thanh vào đây`
    }
  }

  const trackTheme = getTrackTheme(trackId)

  return (
    <div 
      onDragOver={e => e.preventDefault()}
      onDrop={handleDropFiles}
      onContextMenu={e => {
        if ((e.target as HTMLElement).closest('[data-audioclip="true"]')) return
        e.preventDefault()
        handleSelectAllOnTrack()
      }}
      style={{ 
        position: 'relative', 
        width: '100%',
        minWidth: `${totalWidth}px`, 
        height: '36px', 
        display: 'flex', 
        alignItems: 'center',
        opacity: isSilenced ? 0.38 : 1,
        filter: isSilenced ? 'grayscale(0.6)' : 'none',
        transition: 'opacity 0.18s ease, filter 0.18s ease'
      }}
    >
      {clips.length === 0 ? (
        <div
          onClick={() => setActivePanel('audio')}
          style={{
            width: '100%',
            height: '30px',
            border: `1px dashed ${trackTheme.borderColor}`,
            background: trackTheme.bgColor,
            borderRadius: '5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingLeft: '14px',
            gap: '8px',
            color: trackTheme.color,
            fontSize: '11px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            marginRight: '8px',
          }}
          title="Bấm để mở thư viện âm thanh hoặc kéo thả file âm thanh trực tiếp vào đây"
        >
          {trackTheme.icon}
          <span>{trackTheme.text}</span>
        </div>
      ) : (
        clips.filter(Boolean).map(clip => {
          const rate = clip.playbackRate ?? 1.0
          const playDur = (clip.playDurationSec ?? clip.duration) || 5
          const activeTimelineDur = playDur / rate
          // Only show red indicator when ACTIVELY DRAGGING trim-right past measured duration
          const isAtMaxDuration = trimRightAtMaxClipId === clip.id
          
          const isSelected = ((selectedAudioClipIds?.length ?? 0) > 0 && selectedAudioClipIds?.includes(clip.id)) || (selectedAudioClipId === clip.id)

          const leftPx = (clip.startSec || 0) * pxPerSec
          const widthPx = activeTimelineDur * pxPerSec
            return (
              <div
                key={clip.id}
                data-audioclip="true"
                onMouseDown={e => handleMouseDown(e, clip)}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  setAnchorRect(rect);
                  setActiveVolumeClipId(clip.id === activeVolumeClipId ? null : clip.id);
                }}
                onContextMenu={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!selectedAudioClipIds.includes(clip.id)) {
                    setSelectedAudioClip(clip.id)
                  }
                  setContextMenu({ x: e.clientX, y: e.clientY, clip });
                }}
                style={{
                  position: 'absolute',
                  left: `${leftPx}px`,
                  width: `${widthPx}px`,
                  minWidth: '16px',
                  height: '32px',
                  background: 'linear-gradient(90deg, #25103a 0%, #150824 100%)',
                  border: isSelected ? '2px solid #BEFF01' : '1px solid rgba(184, 77, 255, 0.45)',
                  borderRadius: '5px',
                  padding: '2px 6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: '#fff',
                  fontSize: '10.5px',
                  cursor: 'grab',
                  boxShadow: isSelected ? '0 0 12px rgba(190, 255, 1, 0.4)' : '0 2px 6px rgba(0,0,0,0.35)',
                  userSelect: 'none',
                  zIndex: isSelected ? 15 : 5,
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                title="Kéo để di chuyển • Giữ Shift/Ctrl để chọn nhiều • Chuột phải để mở menu"
              >
                {/* Studio Audio Waveform Visual Layer */}
                <AudioWaveformRenderer
                  url={clip.url}
                  widthPx={widthPx}
                  heightPx={28}
                  color={trackId === 'A1' ? '#00D4FF' : trackId === 'A2' ? '#BEFF01' : '#B84DFF'}
                  secondaryColor={trackId === 'A1' ? 'rgba(0, 212, 255, 0.3)' : trackId === 'A2' ? 'rgba(190, 255, 1, 0.3)' : 'rgba(184, 77, 255, 0.3)'}
                  opacity={0.65}
                />

                {/* Slim Left Trim Handle (4px) */}
                <div
                  onMouseDown={e => handleTrimLeft(e, clip)}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '5px',
                    background: 'rgba(190, 255, 1, 0.65)',
                    borderTopLeftRadius: '4px',
                    borderBottomLeftRadius: '4px',
                    cursor: 'ew-resize',
                    zIndex: 10,
                    transition: 'background 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = '#BEFF01';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 0 8px #BEFF01';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(190, 255, 1, 0.65)';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  }}
                  title="Kéo mép trái để cắt đoạn đầu"
                />

                {/* Clean Center Content (Name, Duration, Volume) */}
                <div style={{ position: 'relative', zIndex: 3, display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden', paddingLeft: '4px', paddingRight: '4px', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                  {widthPx > 40 && (
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600, fontSize: '10.5px' }}>
                      {clip.name}
                    </span>
                  )}
                  {widthPx > 110 && (
                    <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', flexShrink: 0 }}>
                      ({(clip.playDurationSec ?? clip.duration).toFixed(1)}s)
                    </span>
                  )}
                  {clip.isExpired && (
                    <span style={{ fontSize: '8.5px', background: '#ff3333', color: '#fff', borderRadius: '2px', padding: '1px 3px', fontWeight: 700, flexShrink: 0 }}>
                      Hết hạn
                    </span>
                  )}
                </div>

                {/* Volume Knob Modal */}
                {activeVolumeClipId === clip.id && (
                  <VolumeKnobModal 
                    initialVolume={clip.volume ?? 1}
                    anchorRect={anchorRect}
                    onVolumeChange={(vol) => updateAudioClip(clip.id, { volume: vol })}
                    onClose={() => setActiveVolumeClipId(null)}
                  />
                )}

                {/* Slim Right Trim Handle (4px) */}
                <div
                  onMouseDown={e => handleTrimRight(e, clip)}
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: '5px',
                    background: isAtMaxDuration ? '#FF3B30' : 'rgba(190, 255, 1, 0.65)',
                    borderTopRightRadius: '4px',
                    borderBottomRightRadius: '4px',
                    cursor: 'ew-resize',
                    zIndex: 10,
                    transition: 'background 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = isAtMaxDuration ? '#FF3B30' : '#BEFF01';
                    (e.currentTarget as HTMLElement).style.boxShadow = isAtMaxDuration ? '0 0 10px #FF3B30' : '0 0 8px #BEFF01';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = isAtMaxDuration ? '#FF3B30' : 'rgba(190, 255, 1, 0.65)';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  }}
                  title={isAtMaxDuration ? `Đã đạt độ dài tối đa (${clip.duration.toFixed(1)}s)` : "Kéo mép phải để Cắt / Kéo Dài thời lượng Audio"}
                />
              </div>
            )
          })
      )}

      {/* Right-Click Context Menu Popup for Audio Clip */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            top: Math.max(10, contextMenu.y - 150),
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
          {/* Header info */}
          <div style={{ padding: '3px 8px 5px', fontSize: '9px', fontWeight: 700, color: '#6B7280', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {contextMenu.clip.name}
          </div>

          {/* Preview Play/Pause */}
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
              togglePreviewClip(contextMenu.clip)
              setContextMenu(null)
            }}
          >
            {playingClipId === contextMenu.clip.id ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            )}
            <span>{playingClipId === contextMenu.clip.id ? 'Dừng' : 'Nghe thử'}</span>
          </div>

          {/* Volume Setting */}
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
              e.currentTarget.style.color = '#FFF'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#D1D5DB'
            }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              setAnchorRect(rect)
              setActiveVolumeClipId(contextMenu.clip.id)
              setContextMenu(null)
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
            <span>Âm lượng</span>
          </div>

          {/* Duplicate Clip */}
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
              duplicateAudioClip(contextMenu.clip.id)
              showToast(`Đã nhân bản "${contextMenu.clip.name}"`)
              setContextMenu(null)
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            <span>Nhân bản</span>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '3px 0' }} />

          {/* Select All on Track */}
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
              e.currentTarget.style.color = '#FFB800'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#D1D5DB'
            }}
            onClick={() => {
              handleSelectAllOnTrack()
              setContextMenu(null)
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            <span>Chọn cả track</span>
          </div>

          {/* Select Forward from here */}
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
              e.currentTarget.style.color = '#C084FC'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#D1D5DB'
            }}
            onClick={() => {
              handleSelectForward(contextMenu.clip)
              setContextMenu(null)
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
            <span>Chọn từ đây</span>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '3px 0' }} />

          {/* Delete Clip(s) */}
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
            onClick={handleDeleteSelected}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            <span>{selectedAudioClipIds.length > 1 ? `Xóa (${selectedAudioClipIds.length})` : 'Xóa'}</span>
          </div>
        </div>
      )}
    </div>
  )
})
