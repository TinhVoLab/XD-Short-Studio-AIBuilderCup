import { useState } from 'react'
import styles from './Panels.module.css'
import { useEditorStore } from '@/store/useEditorStore'
import { useShallow } from 'zustand/react/shallow'
import { TRANSITION_CATALOG } from '@/config/transitionCatalog'
import { getSceneTransition } from '@/utils/sceneTiming'

const TRANSITIONS = TRANSITION_CATALOG

export default function TransitionsPanel() {
  const {  scenes, currentSceneIdx, updateScene, showToast  } = useEditorStore(
    useShallow(s => ({
      scenes: s.scenes,
      currentSceneIdx: s.currentSceneIdx,
      updateScene: s.updateScene,
      showToast: s.showToast
    }))
  )
  const currentScene = scenes[currentSceneIdx]
  // Đọc qua getSceneTransition để cảnh cũ (chỉ có transitionOut) vẫn hiện đúng lựa chọn
  const activeTransition = getSceneTransition(currentScene)
  const activeTrans = activeTransition?.type || 'none'
  const duration = activeTransition?.duration ?? 0.5

  const handleSelectTransition = (t: typeof TRANSITIONS[0]) => {
    if (!currentScene) return
    updateScene(currentScene.id, {
      transition: { type: t.id, duration }
    })
    showToast(`Đã đặt Chuyển cảnh "${t.label}" cho ${currentScene.name}!`)
  }

  const handleDurationChange = (newDur: number) => {
    if (!currentScene) return
    updateScene(currentScene.id, {
      transition: { type: activeTrans, duration: newDur }
    })
  }

  return (
    <div className={styles.svgPanelContainer}>
      {/* Duration Control */}
      {activeTrans !== 'none' && (
        <div style={{
          padding: '10px 12px',
          backgroundColor: 'rgba(18, 24, 38, 0.75)',
          borderRadius: 9,
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11, color: '#BBB' }}>
            <span style={{ fontWeight: 600 }}>⏱️ Thời lượng chuyển cảnh:</span>
            <span style={{ color: '#BEFF01', fontWeight: 800, fontFamily: 'monospace' }}>{duration.toFixed(1)}s</span>
          </div>
          <input
            type="range"
            min={0.2}
            max={1.2}
            step={0.1}
            value={duration}
            onChange={(e) => handleDurationChange(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: '#BEFF01', cursor: 'pointer' }}
          />
        </div>
      )}

      {/* Transitions Grid */}
      <div className={styles.transGrid} style={{ padding: 0 }}>
        {TRANSITIONS.map(t => (
          <div
            key={t.id}
            className={`${styles.transItem} ${activeTrans === t.id ? styles.active : ''}`}
            onClick={() => handleSelectTransition(t)}
            style={{
              backgroundColor: activeTrans === t.id ? 'rgba(25, 34, 52, 0.95)' : 'rgba(18, 24, 38, 0.75)',
              border: `1px solid ${activeTrans === t.id ? '#BEFF01' : 'rgba(255, 255, 255, 0.08)'}`,
              borderRadius: 9,
              boxShadow: activeTrans === t.id ? '0 0 10px rgba(190,255,1,0.25)' : '0 2px 8px rgba(0,0,0,0.25)'
            }}
          >
            <div className={styles.transPreview} style={{ background: t.preview }} />
            <span style={{ color: activeTrans === t.id ? '#BEFF01' : '#FFF', fontWeight: activeTrans === t.id ? 700 : 500 }}>{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

