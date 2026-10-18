import { useState } from 'react'
import styles from './Panels.module.css'
import { useEditorStore } from '@/store/useEditorStore'
import { useShallow } from 'zustand/react/shallow'

const MOTIONS = [
  {
    id: 'slide-up',
    label: 'Trượt lên',
    icon: (
      <svg width="15" height="15" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 11.5V2.5M7 2.5L3 6.5M7 2.5L11 6.5" />
      </svg>
    ),
  },
  {
    id: 'fade-in',
    label: 'Mờ dần',
    icon: (
      <svg width="15" height="15" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="7" cy="7" r="4.5" />
        <circle cx="7" cy="7" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'zoom-in',
    label: 'Phóng to',
    icon: (
      <svg width="15" height="15" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="6" r="4" />
        <path d="M9 9L12 12M6 4V8M4 6H8" />
      </svg>
    ),
  },
  {
    id: 'bounce',
    label: 'Nảy',
    icon: (
      <svg width="15" height="15" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 10.5C3.5 10.5 4 4.5 6 4.5C8 4.5 8.5 10.5 10 10.5C11 10.5 11.5 8 12.5 8" />
      </svg>
    ),
  },
  {
    id: 'rotate',
    label: 'Xoay',
    icon: (
      <svg width="15" height="15" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.5V6H8.5" />
        <path d="M11.5 8.5A5 5 0 1 1 10 4.2L12 6" />
      </svg>
    ),
  },
  {
    id: 'glitch',
    label: 'Nhiễu sóng',
    icon: (
      <svg width="15" height="15" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7.5 1.5L2.5 8H7L6.5 12.5L11.5 6H7L7.5 1.5Z" />
      </svg>
    ),
    accent: true,
  },
  {
    id: 'typewriter',
    label: 'Đánh máy',
    icon: (
      <svg width="15" height="15" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.5 4.5L5.5 7.5L2.5 10.5M7 10.5H11.5" />
      </svg>
    ),
  },
  {
    id: 'elastic',
    label: 'Co giãn',
    icon: (
      <svg width="15" height="15" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.5 4.5L13 7L10.5 9.5M3.5 4.5L1 7L3.5 9.5M1.5 7H12.5" />
      </svg>
    ),
  },
]

export default function MotionPanel() {
  const {  selectedElementId, updateElement, scenes, currentSceneIdx, setInspector, seekToScene, setPlaying, showToast  } = useEditorStore(
    useShallow(s => ({
      selectedElementId: s.selectedElementId,
      updateElement: s.updateElement,
      scenes: s.scenes,
      currentSceneIdx: s.currentSceneIdx,
      setInspector: s.setInspector,
      seekToScene: s.seekToScene,
      setPlaying: s.setPlaying,
      showToast: s.showToast
    }))
  )
  
  const currentScene = scenes[currentSceneIdx]
  const selectedEl = currentScene?.elements.find(e => e.id === selectedElementId)
  const activeMotion = selectedEl?.animPreset || ''

  const handleSelectMotion = (m: typeof MOTIONS[0]) => {
    if (!selectedElementId || !selectedEl) {
      showToast('Vui lòng click chọn 1 phần tử Text/Ảnh trên Canvas trước!', 3000)
      return
    }

    updateElement(selectedElementId, { animPreset: m.id })
    setInspector({ animPreset: m.id })
    
    // Rewind to start of current scene & auto-play to preview the motion effect
    seekToScene(currentSceneIdx)
    setPlaying(true)

    showToast(`Đang xem thử Motion "${m.label}"!`)
  }

  return (
    <div className={styles.svgPanelContainer}>
      <div className={styles.motionGrid} style={{ padding: 0 }}>
        {MOTIONS.map(m => (
          <div
            key={m.id}
            className={`${styles.motionItem} ${activeMotion === m.id ? styles.active : ''}`}
            onClick={() => handleSelectMotion(m)}
            style={{
              backgroundColor: activeMotion === m.id ? 'rgba(25, 34, 52, 0.95)' : 'rgba(18, 24, 38, 0.75)',
              border: `1px solid ${activeMotion === m.id ? '#BEFF01' : 'rgba(255, 255, 255, 0.08)'}`,
              borderRadius: 9,
              boxShadow: activeMotion === m.id ? '0 0 10px rgba(190,255,1,0.25)' : '0 2px 8px rgba(0,0,0,0.25)'
            }}
          >
            <div className={styles.motionIcon} style={m.accent ? { color:'var(--accent)' } : {}}>{m.icon}</div>
            <span style={{ color: activeMotion === m.id ? '#BEFF01' : '#FFF', fontWeight: activeMotion === m.id ? 700 : 500 }}>{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
