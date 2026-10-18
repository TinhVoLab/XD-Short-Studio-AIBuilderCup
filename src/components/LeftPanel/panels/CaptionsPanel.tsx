import React, { useState } from 'react'
import styles from './Panels.module.css'
import { useEditorStore } from '@/store/useEditorStore'
import { useShallow } from 'zustand/react/shallow'
import { aiAssistantService } from '@/services/aiAssistantService'
import { Button, Tooltip, InfoTooltip } from '@/components/ui'

type CaptionStyleId = 'bouncing-box' | 'punch-glow' | 'word-pop' | 'word-highlight' | 'karaoke' | 'subtitle' | 'neon-glow' | 'typewriter'

interface CaptionPreset {
  id: string
  name: string
  accentColor: string
  color: string
  bg: string
  border: string
  captionStyle: CaptionStyleId
  emoji: string
}

const CAPTION_PRESETS: CaptionPreset[] = [
  { id: 'bouncing-box', name: 'CapCut Pill', emoji: '💊', captionStyle: 'bouncing-box',   accentColor: '#BEFF01', color: '#FFFFFF', bg: 'rgba(6,13,22,0.9)',   border: '1px solid #BEFF01' },
  { id: 'punch-glow',   name: '3D Stroke',   emoji: '💥', captionStyle: 'punch-glow',     accentColor: '#00D4FF', color: '#FFFFFF', bg: 'rgba(0,10,25,0.9)',   border: '1px solid #00D4FF' },
  { id: 'word-pop',     name: 'Big Pop',     emoji: '🎯', captionStyle: 'word-pop',       accentColor: '#FF2D78', color: '#FFFFFF', bg: 'rgba(25,0,10,0.9)',   border: '1px solid #FF2D78' },
  { id: 'tiktok',       name: 'TikTok Box',  emoji: '⚡', captionStyle: 'word-highlight', accentColor: '#BEFF01', color: '#FFFFFF', bg: 'rgba(6,13,22,0.9)',   border: '1px solid #BEFF01' },
  { id: 'neon',         name: 'Neon Blue',   emoji: '💎', captionStyle: 'word-highlight', accentColor: '#00D4FF', color: '#FFFFFF', bg: 'rgba(0,10,25,0.9)',   border: '1px solid #00D4FF' },
  { id: 'pink',         name: 'Hot Pink',    emoji: '🌸', captionStyle: 'neon-glow',      accentColor: '#FF2D78', color: '#FFFFFF', bg: 'rgba(25,0,10,0.9)',   border: '1px solid #FF2D78' },
  { id: 'fire',         name: 'Fire Orange', emoji: '🔥', captionStyle: 'neon-glow',      accentColor: '#FF6B00', color: '#FFFFFF', bg: 'rgba(20,5,0,0.9)',    border: '1px solid #FF6B00' },
  { id: 'karaoke',      name: 'Karaoke',     emoji: '🎤', captionStyle: 'karaoke',        accentColor: '#BEFF01', color: '#FFFFFF', bg: 'rgba(0,0,0,0.85)',    border: '1px solid rgba(190,255,1,0.4)' },
  { id: 'cyber',        name: 'Cyber Purple',emoji: '🤖', captionStyle: 'word-highlight', accentColor: '#A855F7', color: '#E8D5FF', bg: 'rgba(10,0,20,0.9)',   border: '1px solid #A855F7' },
  { id: 'subtitle',     name: 'Phụ đề phim', emoji: '🎬', captionStyle: 'subtitle',       accentColor: '#FFFFFF', color: '#FFFFFF', bg: 'rgba(0,0,0,0.82)',    border: '1px solid rgba(255,255,255,0.15)' },
  { id: 'typewriter',   name: 'Typewriter',  emoji: '⌨️', captionStyle: 'typewriter',     accentColor: '#00D4FF', color: '#FFFFFF', bg: 'rgba(0,5,12,0.9)',   border: '1px solid #00D4FF' },
]

const STYLE_DESCRIPTIONS: Record<CaptionStyleId, string> = {
  'bouncing-box':   'Hộp neon nảy đổi màu tương phản CapCut',
  'punch-glow':     'Chữ viền đen 3D phát sáng neon chống chìm',
  'word-pop':       'Phóng to nảy nổ từng chữ dồn dập',
  'word-highlight': 'Box neon highlight từng từ khi nói',
  'karaoke':        'Màu trượt từ trái sang phải',
  'subtitle':       'Phụ đề đơn giản kiểu phim',
  'neon-glow':      'Từ đang nói phát sáng neon',
  'typewriter':     'Gõ từng ký tự xuyên suốt cảnh',
}

export default function CaptionsPanel() {
  const {  addElement, showToast, scenes, currentSceneIdx  } = useEditorStore(
    useShallow(s => ({
      addElement: s.addElement,
      showToast: s.showToast,
      scenes: s.scenes,
      currentSceneIdx: s.currentSceneIdx,
    }))
  )
  const [selectedPresetId, setSelectedPresetId] = useState('tiktok')
  const currentScene = scenes[currentSceneIdx]

  const selectedPreset = CAPTION_PRESETS.find(p => p.id === selectedPresetId) || CAPTION_PRESETS[0]

  // Count captions across all scenes
  const totalCaptions = scenes.reduce(
    (sum, s) => sum + s.elements.filter(e => e.type === 'caption').length, 0
  )
  const currentSceneCaptions = currentScene?.elements.filter(e => e.type === 'caption').length || 0

  const handleAutoCaption = () => {
    aiAssistantService.autoCaption(selectedPreset)
  }

  const handleAddCaption = () => {
    const text = currentScene?.voiceoverText || 'Nội dung phụ đề mẫu...'
    addElement({
      type: 'caption',
      content: text,
      captionStyle: selectedPreset.captionStyle,
      left: 180,
      top: 525,
      width: 320,
      height: 50,
      scaleX: 1, scaleY: 1, angle: 0, opacity: 1,
      fontSize: 18,
      fontWeight: 800,
      fontFamily: 'Be Vietnam Pro',
      color: selectedPreset.color,
      accentColor: selectedPreset.accentColor,
      textAlign: 'center',
      wordsPerLine: 4,
    })
    showToast(`Đã thêm phụ đề style "${selectedPreset.name}"`)
  }

  const handleDeleteAllCaptions = () => {
    // Remove all caption elements from current scene
    const store = useEditorStore.getState()
    const scene = store.scenes[store.currentSceneIdx]
    if (!scene) return
    const newElements = scene.elements.filter(e => e.type !== 'caption')
    const newScenes = store.scenes.map((s, i) =>
      i === store.currentSceneIdx ? { ...s, elements: newElements } : s
    )
    useEditorStore.setState({ scenes: newScenes })
    showToast(`Đã xoá ${currentSceneCaptions} caption khỏi cảnh này`)
  }

  return (
    <div className={styles.svgPanelContainer}>
      {/* Stats bar */}
      <div style={{
        display: 'flex', gap: 8, padding: '8px 10px',
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)'
      }}>
        <StatBadge label="Tổng caption" value={totalCaptions} color="#BEFF01" />
        <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
        <StatBadge label="Cảnh này" value={currentSceneCaptions} color="#00D4FF" />
      </div>

      {/* Style Selector Grid */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-sub)' }}>
              Chọn kiểu phụ đề
            </span>
            <InfoTooltip content="Tự động đồng bộ phụ đề từ lời thoại kịch bản đã sinh bởi AI Wizard hoặc tự nhập thủ công. Có thể chỉnh font và màu sắc chuyên sâu trong Inspector bên phải." />
          </div>
          <span style={{ fontSize: '10px', color: selectedPreset.accentColor, fontWeight: 700 }}>
            {selectedPreset.name}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
          {CAPTION_PRESETS.map(p => {
            const isSelected = selectedPresetId === p.id
            return (
              <Tooltip key={p.id} content={STYLE_DESCRIPTIONS[p.captionStyle]}>
                <button
                  onClick={() => setSelectedPresetId(p.id)}
                  style={{
                    background: isSelected ? 'rgba(18, 25, 42, 0.95)' : 'rgba(255,255,255,0.02)',
                    border: isSelected ? `1.5px solid ${p.accentColor}` : '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 7,
                    padding: '6px 7px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? `0 0 10px ${p.accentColor}25` : 'none',
                    textAlign: 'left',
                    minWidth: 0,
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  <span style={{
                    fontSize: 10,
                    fontWeight: 800,
                    lineHeight: 1,
                    flexShrink: 0,
                    color: p.accentColor,
                    background: `${p.accentColor}18`,
                    border: `1px solid ${p.accentColor}44`,
                    padding: '2px 4px',
                    borderRadius: 4,
                    fontFamily: 'monospace'
                  }}>
                    Aa
                  </span>
                  <span style={{
                    fontSize: 10.5,
                    fontWeight: isSelected ? 800 : 600,
                    color: isSelected ? p.accentColor : 'rgba(255,255,255,0.7)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    flex: 1,
                    minWidth: 0,
                  }}>
                    {p.name}
                  </span>
                  {isSelected && (
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: p.accentColor, flexShrink: 0 }} />
                  )}
                </button>
              </Tooltip>
            )
          })}
        </div>

        {/* Selected style description badge */}
        <div style={{
          marginTop: 6,
          padding: '4px 8px',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 6,
          border: '1px solid rgba(255,255,255,0.04)',
          fontSize: 10,
          color: 'rgba(255,255,255,0.45)',
          display: 'flex',
          alignItems: 'center',
          gap: 5
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <span>{STYLE_DESCRIPTIONS[selectedPreset.captionStyle]}</span>
        </div>
      </div>

      {/* Preview Strip */}
      <div style={{
        padding: '10px 12px',
        background: 'rgba(0,0,0,0.6)',
        borderRadius: 8,
        border: selectedPreset.border,
        display: 'flex',
        justifyContent: 'center',
        gap: 6,
        flexWrap: 'wrap',
      }}>
        {['Từ', 'này', 'đang', 'sáng'].map((w, i) => (
          <span key={i} style={{
            fontSize: 13,
            fontWeight: 800,
            fontFamily: 'Be Vietnam Pro',
            color: i === 1 ? selectedPreset.accentColor : 'rgba(255,255,255,0.6)',
            backgroundColor: i === 1 && selectedPreset.captionStyle === 'word-highlight'
              ? 'rgba(6,13,22,0.95)' : 'transparent',
            border: i === 1 && selectedPreset.captionStyle === 'word-highlight'
              ? `1px solid ${selectedPreset.accentColor}` : '1px solid transparent',
            padding: '2px 8px',
            borderRadius: 6,
            textShadow: i === 1 && ['neon-glow'].includes(selectedPreset.captionStyle)
              ? `0 0 10px ${selectedPreset.accentColor}` : 'none',
            borderBottom: i === 1 && selectedPreset.captionStyle === 'karaoke'
              ? `2px solid ${selectedPreset.accentColor}` : undefined,
          }}>
            {w}
          </span>
        ))}
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />

      {/* Action Buttons: Clean 2-Column Uniform Layout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 6 }}>
          {/* Primary: Auto all scenes */}
          <Tooltip content="Tự động tạo phụ đề đồng bộ phong cách đã chọn cho toàn bộ các cảnh trong video">
            <Button
              variant="primary"
              size="sm"
              fullWidth
              leftIcon={
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              }
              onClick={handleAutoCaption}
            >
              Áp dụng tất cả
            </Button>
          </Tooltip>

          {/* Secondary: Add to current scene */}
          <Tooltip content="Chỉ tạo phụ đề cho phân cảnh hiện đang mở">
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              leftIcon={
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              }
              onClick={handleAddCaption}
            >
              Cảnh hiện tại
            </Button>
          </Tooltip>
        </div>

        {/* Subtle Delete current scene captions */}
        {currentSceneCaptions > 0 && (
          <Button
            variant="danger"
            size="xs"
            fullWidth
            leftIcon={
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            }
            onClick={handleDeleteAllCaptions}
          >
            Xoá phụ đề cảnh này ({currentSceneCaptions})
          </Button>
        )}
      </div>
    </div>
  )
}

function StatBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontSize: 20, fontWeight: 900, color, fontFamily: 'Be Vietnam Pro' }}>
        {value}
      </div>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </div>
    </div>
  )
}
