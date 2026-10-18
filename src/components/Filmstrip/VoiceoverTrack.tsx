import React from 'react'
import { Scene } from '@/types/scene'
import { useEditorStore } from '@/store/useEditorStore'
import { useShallow } from 'zustand/react/shallow'

export default function VoiceoverTrack({ scenes, pxPerSec }: { scenes: Scene[]; pxPerSec: number }) {
  const {  setActivePanel, showToast  } = useEditorStore(
    useShallow(s => ({
      setActivePanel: s.setActivePanel,
      showToast: s.showToast
    }))
  )

  return (
    <div style={{ display: 'flex', gap: '4px', marginTop: '6px', height: '32px' }}>
      {(scenes || []).filter(Boolean).map((scene) => {
        const widthPx = Math.max(60, (scene.duration || 3) * pxPerSec)

        if (scene.voiceoverUrl) {
          return (
            <div
              key={scene.id}
              onClick={() => {
                const audio = new Audio(scene.voiceoverUrl)
                audio.play()
                showToast(`🎙️ Đang nghe giọng đọc: ${scene.voiceName || 'Voiceover'}`)
              }}
              style={{
                width: widthPx,
                height: '100%',
                background: 'linear-gradient(90deg, #132b13 0%, #0d1f0d 100%)',
                border: '1px solid #BEFF01',
                borderRadius: '6px',
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#BEFF01',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                flexShrink: 0,
                overflow: 'hidden',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
              }}
              title={`Click để nghe thử giọng đọc của ${scene.name}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden' }}>
                <span>🎙️</span>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {scene.voiceName || 'Voiceover'} ({scene.duration}s)
                </span>
              </div>
              <span style={{ fontSize: '10px', opacity: 0.8 }}>▶</span>
            </div>
          )
        }

        return (
          <div
            key={scene.id}
            onClick={() => setActivePanel('audio')}
            style={{
              width: widthPx,
              height: '100%',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px dashed rgba(255, 255, 255, 0.15)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666',
              fontSize: '10px',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.15s'
            }}
            title="Click để tạo kịch bản lồng tiếng AI cho cảnh này"
          >
            ➕ Lồng tiếng
          </div>
        )
      })}
    </div>
  )
}
