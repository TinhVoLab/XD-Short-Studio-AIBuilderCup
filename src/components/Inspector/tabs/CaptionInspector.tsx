import React from 'react'
import styles from './Tabs.module.css'
import { useEditorStore } from '@/store/useEditorStore'
import { useShallow } from 'zustand/react/shallow'
import { ColorDot, toHexColor } from './inspectors/common'
import { Button, SegmentedControl, FormGroup, Tooltip } from '@/components/ui'

const CAPTION_STYLES = [
  { id: 'bouncing-box',   label: 'CapCut Pill' },
  { id: 'punch-glow',     label: '3D Stroke' },
  { id: 'word-pop',       label: 'Big Pop' },
  { id: 'word-highlight', label: 'TikTok Box' },
  { id: 'karaoke',        label: 'Karaoke' },
  { id: 'neon-glow',      label: 'Neon Glow' },
  { id: 'subtitle',       label: 'Phụ đề phim' },
  { id: 'typewriter',     label: 'Typewriter' },
] as const

const ACCENT_PRESETS = [
  '#BEFF01', // TikTok lime
  '#00D4FF', // Neon blue
  '#FF2D78', // Hot pink
  '#FF6B00', // Fire orange
  '#A855F7', // Cyber purple
  '#00E5CC', // Ocean teal
  '#FFE500', // Electric yellow
  '#FFFFFF', // White
]

const FONT_OPTIONS = ['Be Vietnam Pro', 'Montserrat', 'Poppins', 'Lexend', 'Inter', 'Oswald']

export default function CaptionInspector() {
  const { selectedElementId, updateElement, removeElement, showToast, scenes, currentSceneIdx, updateScene } = useEditorStore(
    useShallow(s => ({
      selectedElementId: s.selectedElementId,
      updateElement: s.updateElement,
      removeElement: s.removeElement,
      showToast: s.showToast,
      scenes: s.scenes,
      currentSceneIdx: s.currentSceneIdx,
      updateScene: s.updateScene,
    }))
  )

  const currentScene = scenes[currentSceneIdx]
  const el = currentScene?.elements.find(e => e.id === selectedElementId)

  if (!el || el.type !== 'caption') return null

  const captionStyle = el.captionStyle || 'bouncing-box'
  const accentColor = el.accentColor || '#BEFF01'
  const textColor = el.color || '#FFFFFF'
  const fontSize = el.fontSize || 18
  const fontFamily = el.fontFamily || 'Be Vietnam Pro'
  const wordsPerLine = el.wordsPerLine || 4
  const captionBounce = el.captionBounce !== false
  const captionOutline = el.captionOutline ?? (captionStyle === 'punch-glow')

  const update = (patch: Partial<typeof el>) => updateElement(el.id, patch as any)

  const handleContentChange = (newContent: string) => {
    update({ content: newContent })
    if (currentScene) {
      updateScene(currentScene.id, { voiceoverText: newContent })
    }
  }

  const handleApplyToAllScenes = () => {
    const store = useEditorStore.getState()
    let count = 0
    const newScenes = store.scenes.map(s => {
      let modified = false
      const newElements = s.elements.map(item => {
        if (item.type === 'caption') {
          modified = true
          count++
          return {
            ...item,
            captionStyle,
            accentColor,
            color: textColor,
            fontSize,
            fontFamily,
            fontWeight: el.fontWeight || 800,
            wordsPerLine,
            top: el.top,
            left: el.left,
            captionBounce,
            captionOutline,
          }
        }
        return item
      })
      return modified ? { ...s, elements: newElements } : s
    })

    useEditorStore.setState({ scenes: newScenes })
    showToast(`Đã đồng bộ phong cách Caption cho ${count} cảnh!`)
  }

  return (
    <div className={styles.tab}>
      {/* Header Layer Pill */}
      <div className={styles.layerPill}>
        <div className={styles.layerPillTitle}>
          <span>
            Cài đặt phụ đề
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Tooltip content="Đồng bộ phong cách phụ đề sang tất cả các cảnh">
            <Button
              asIcon
              variant="ghost"
              size="icon-xs"
              onClick={handleApplyToAllScenes}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </Button>
          </Tooltip>
          <Tooltip content="Xóa phụ đề khỏi cảnh hiện tại">
            <Button
              asIcon
              variant="danger"
              size="icon-xs"
              onClick={() => {
                removeElement(el.id)
                showToast('Đã xóa phụ đề')
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Content Textarea */}
      <FormGroup label="Nội dung" tooltip="Nội dung chữ hiển thị. Tự động đồng bộ với lời đọc Voiceover của cảnh này.">
        <textarea
          className={styles.input}
          value={el.content || ''}
          onChange={e => handleContentChange(e.target.value)}
          placeholder="Nhập phụ đề..."
          rows={2}
          style={{
            resize: 'vertical',
            minHeight: '44px',
            maxHeight: '100px',
            lineHeight: '1.4',
            fontSize: '12px',
          }}
        />
      </FormGroup>

      {/* Style Presets Grid (2 Columns) */}
      <FormGroup label="Kiểu phụ đề" tooltip="Lựa chọn hoạt ảnh chuyển động: CapCut Pill nảy hộp neon, 3D Stroke phát sáng, Big Pop dồn dập, TikTok Box highlight, Karaoke quét màu, hoặc Typewriter.">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
          {CAPTION_STYLES.map(s => {
            const isActive = captionStyle === s.id
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => update({ captionStyle: s.id as any })}
                style={{
                  background: isActive ? 'rgba(18, 25, 42, 0.95)' : 'rgba(255,255,255,0.02)',
                  border: isActive ? `1.5px solid ${accentColor}` : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 7,
                  padding: '6px 7px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? `0 0 10px ${accentColor}25` : 'none',
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
                  color: accentColor,
                  background: `${accentColor}18`,
                  border: `1px solid ${accentColor}44`,
                  padding: '2px 4px',
                  borderRadius: 4,
                  fontFamily: 'monospace'
                }}>
                  Aa
                </span>
                <span style={{
                  fontSize: 10.5,
                  fontWeight: isActive ? 800 : 600,
                  color: isActive ? accentColor : 'rgba(255,255,255,0.7)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  flex: 1,
                  minWidth: 0,
                }}>
                  {s.label}
                </span>
                {isActive && (
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: accentColor, flexShrink: 0 }} />
                )}
              </button>
            )
          })}
        </div>
      </FormGroup>

      {/* Colors (Highlight & Text) */}
      <FormGroup label="Màu sắc" tooltip="Màu Highlight áp dụng cho từ đang được người nói phát âm; Màu Chữ thường áp dụng cho các từ còn lại trong câu.">
        {/* 2-Column Palette Box */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
          {/* Highlight Color */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px 8px',
            height: '30px'
          }}>
            <ColorDot value={toHexColor(accentColor)} onChange={c => update({ accentColor: c })} sm />
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', lineHeight: 1 }}>Highlight</span>
              <span style={{ fontSize: '10.5px', fontFamily: 'monospace', color: 'var(--text)' }}>
                {accentColor.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Normal Text Color */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px 8px',
            height: '30px'
          }}>
            <ColorDot value={toHexColor(textColor)} onChange={c => update({ color: c })} sm />
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', lineHeight: 1 }}>Chữ thường</span>
              <span style={{ fontSize: '10.5px', fontFamily: 'monospace', color: 'var(--text)' }}>
                {textColor.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Palette Dots */}
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          {ACCENT_PRESETS.map(c => (
            <div
              key={c}
              onClick={() => update({ accentColor: c })}
              title={c}
              style={{
                flex: 1,
                height: 18,
                borderRadius: 3,
                background: c,
                border: accentColor === c ? '2px solid #fff' : '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: accentColor === c ? `0 0 6px ${c}` : 'none'
              }}
            />
          ))}
        </div>
      </FormGroup>

      {/* Font Family & Weight */}
      <FormGroup label="Phông chữ" tooltip="Lựa chọn kiểu font sans-serif hiện đại, nét đậm rõ ràng tối ưu cho video ngắn trên di động.">
        <div className={styles.row2}>
          <select
            className={styles.select}
            value={fontFamily}
            onChange={e => update({ fontFamily: e.target.value })}
          >
            {FONT_OPTIONS.map(f => <option key={f}>{f}</option>)}
          </select>
          <select
            className={styles.select}
            value={String(el.fontWeight || 800)}
            onChange={e => update({ fontWeight: e.target.value })}
          >
            <option value="400">Regular (400)</option>
            <option value="600">SemiBold (600)</option>
            <option value="700">Bold (700)</option>
            <option value="800">ExtraBold (800)</option>
            <option value="900">Black (900)</option>
          </select>
        </div>
      </FormGroup>

      {/* Size & Words Per Line Segmented */}
      <FormGroup label="Bố cục chữ" tooltip="Số từ hiển thị cùng lúc: Chọn 2–3 từ cho phong cách TikTok dồn dập, hoặc 4–6 từ cho phong cách thuyết minh mượt mà.">
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px', alignItems: 'center' }}>
          <div className={styles.numBox} style={{ width: '100%' }}>
            <span className={styles.numLabel}>Size</span>
            <input
              type="number"
              className={styles.numInput}
              value={fontSize}
              min={10}
              max={64}
              onChange={e => update({ fontSize: +e.target.value })}
            />
          </div>

          <div style={{ flex: 1 }}>
            <SegmentedControl
              options={[1, 2, 3, 4, 6].map(n => ({ value: String(n), label: `${n} từ` }))}
              value={String(wordsPerLine)}
              onChange={(val) => update({ wordsPerLine: Number(val) })}
              size="xs"
              fullWidth
            />
          </div>
        </div>
      </FormGroup>

      {/* Motion Toggles */}
      <FormGroup label="Hiệu ứng" tooltip="Nảy chữ: Phóng to nhẹ từ đang nói; Viền đen: Tạo viền tối bao quanh chữ giúp chống chìm trên mọi nền video.">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          <Button
            variant={captionBounce ? 'primary' : 'secondary'}
            size="xs"
            onClick={() => update({ captionBounce: !captionBounce })}
            style={{ justifyContent: 'center' }}
          >
            {captionBounce ? 'Nảy chữ: BẬT' : 'Nảy chữ: TẮT'}
          </Button>

          <Button
            variant={captionOutline ? 'primary' : 'secondary'}
            size="xs"
            onClick={() => update({ captionOutline: !captionOutline })}
            style={{ justifyContent: 'center' }}
          >
            {captionOutline ? 'Viền đen: BẬT' : 'Viền đen: TẮT'}
          </Button>
        </div>
      </FormGroup>

      {/* Quick Position */}
      <FormGroup label="Vị trí" tooltip="Căn đặt nhanh độ cao Y an toàn: Neo dưới, giữa hoặc trên màn hình tránh bị che bởi icon thả tim, comment hoặc thanh tiến trình video ngắn.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          <Button
            variant="secondary"
            size="xs"
            onClick={() => update({ top: 525, left: 180 })}
            style={{ justifyContent: 'center' }}
          >
            Dưới
          </Button>
          <Button
            variant="secondary"
            size="xs"
            onClick={() => update({ top: 340, left: 180 })}
            style={{ justifyContent: 'center' }}
          >
            Giữa
          </Button>
          <Button
            variant="secondary"
            size="xs"
            onClick={() => update({ top: 140, left: 180 })}
            style={{ justifyContent: 'center' }}
          >
            Trên
          </Button>
        </div>
      </FormGroup>
    </div>
  )
}
