import React, { useRef, useState } from 'react'
import styles from './BgmTrack.module.css'
import { useEditorStore } from '@/store/useEditorStore'
import { useShallow } from 'zustand/react/shallow'
import { Button } from '@/components/ui'

export default function BgmTrack({ width }: { width?: number }) {
  const {  
    bgMusicUrl, setBgMusic, 
    bgMusicVolume, setBgMusicVolume,
    isPlaying, setActivePanel, showToast,
    undo
   } = useEditorStore(
    useShallow(s => ({
      bgMusicUrl: s.bgMusicUrl,
      setBgMusic: s.setBgMusic,
      bgMusicVolume: s.bgMusicVolume,
      setBgMusicVolume: s.setBgMusicVolume,
      isPlaying: s.isPlaying,
      setActivePanel: s.setActivePanel,
      showToast: s.showToast,
      undo: s.undo
    }))
  )

  const [isPreviewing, setIsPreviewing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const togglePreview = () => {
    if (!bgMusicUrl) return
    if (isPreviewing) {
      audioRef.current?.pause()
      setIsPreviewing(false)
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio(bgMusicUrl)
      }
      audioRef.current.volume = Math.max(0, Math.min(1, bgMusicVolume))
      audioRef.current.play()
      setIsPreviewing(true)
      audioRef.current.onended = () => setIsPreviewing(false)
    }
  }

  const handleConfirmRemove = () => {
    if (audioRef.current) audioRef.current.pause()
    setIsPreviewing(false)
    setConfirmDelete(false)
    setBgMusic(undefined)
    showToast('Đã xóa Nhạc nền BGM', 4500, {
      label: 'Hoàn tác',
      onClick: () => undo()
    })
  }

  const fileName = bgMusicUrl ? bgMusicUrl.split('/').pop() || 'Background_Music.mp3' : ''

  return (
    <div className={styles.bgmTrack} style={{ width: width ? `${width}px` : '100%', margin: 0 }}>
      {bgMusicUrl ? (
        <div className={styles.bgmBar}>
          <div className={styles.leftInfo}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C084FC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M9 18V5l12-2v13"></path>
              <circle cx="6" cy="18" r="3"></circle>
              <circle cx="18" cy="16" r="3"></circle>
            </svg>
            <span className={styles.songName} title={fileName}>
              {fileName}
            </span>

            {/* Waveform animation */}
            <div className={styles.waveform}>
              {[0.2, 0.5, 0.8, 0.3, 0.9, 0.4, 0.7].map((delay, i) => (
                <div
                  key={i}
                  className={styles.waveBar}
                  style={{
                    animationDelay: `${delay}s`,
                    animationPlayState: isPlaying || isPreviewing ? 'running' : 'paused'
                  }}
                />
              ))}
            </div>
          </div>

          <div className={styles.controls}>
            {/* Volume */}
            <div className={styles.volGroup}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
              <input
                type="range"
                className={styles.volSlider}
                min="0"
                max="1"
                step="0.05"
                value={bgMusicVolume}
                onChange={(e) => {
                  const val = Math.max(0, Math.min(1, parseFloat(e.target.value)))
                  setBgMusicVolume(val)
                  if (audioRef.current) audioRef.current.volume = val
                }}
              />
              <span className={styles.volVal}>{Math.round(bgMusicVolume * 100)}%</span>
            </div>

            {/* Play/Pause Preview */}
            <Button
              variant="secondary"
              size="xs"
              onClick={togglePreview}
              leftIcon={
                isPreviewing ? (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1"></rect>
                    <rect x="14" y="4" width="4" height="16" rx="1"></rect>
                  </svg>
                ) : (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                )
              }
            >
              {isPreviewing ? 'Dừng' : 'Nghe thử'}
            </Button>

            {/* Remove with Confirmation */}
            {confirmDelete ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255, 68, 68, 0.15)', border: '1px solid rgba(255, 68, 68, 0.3)', borderRadius: 4, padding: '2px 5px' }}>
                <span style={{ fontSize: 10, color: '#FF6B6B', fontWeight: 700 }}>Xóa BGM?</span>
                <Button
                  variant="danger"
                  size="xs"
                  onClick={handleConfirmRemove}
                >
                  Xóa
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setConfirmDelete(false)}
                >
                  Hủy
                </Button>
              </div>
            ) : (
              <Button
                asIcon
                variant="danger"
                size="icon-xs"
                onClick={() => setConfirmDelete(true)}
                title="Xóa nhạc nền"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.emptyState} onClick={() => setActivePanel('audio')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#BEFF01" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Thêm Nhạc nền BGM (Kéo thả file nhạc hoặc click để mở thư viện Audio)</span>
        </div>
      )}
    </div>
  )
}
