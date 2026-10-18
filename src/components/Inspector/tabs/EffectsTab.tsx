import React, { useState } from 'react'
import styles from './Tabs.module.css'
import { useEditorStore } from '@/store/useEditorStore'
import { useShallow } from 'zustand/react/shallow'
import { KeyframeProperty } from '@/types/scene'
import { StudioSelect, StudioSelectOption } from './inspectors/common'
import { Button, FormGroup, SectionHeader } from '@/components/ui'
import { splitWords } from '@/utils/wordTimeline'
import { ScrubNumberInput } from '../components/ScrubNumberInput'

const ANIMATION_OPTIONS: StudioSelectOption[] = [
  {
    value: 'slide-up',
    label: 'Trượt lên',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 11.5V2.5M7 2.5L3 6.5M7 2.5L11 6.5" />
      </svg>
    ),
  },
  {
    value: 'fade-in',
    label: 'Mờ dần',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="7" cy="7" r="4.5" />
        <circle cx="7" cy="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    value: 'zoom-in',
    label: 'Phóng to',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="6" r="4" />
        <path d="M9 9L12 12M6 4V8M4 6H8" />
      </svg>
    ),
  },
  {
    value: 'bounce',
    label: 'Nảy (Bounce)',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 10.5C3.5 10.5 4 4.5 6 4.5C8 4.5 8.5 10.5 10 10.5C11 10.5 11.5 8 12.5 8" />
      </svg>
    ),
  },
  {
    value: 'rotate',
    label: 'Xoay',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.5V6H8.5" />
        <path d="M11.5 8.5A5 5 0 1 1 10 4.2L12 6" />
      </svg>
    ),
  },
  {
    value: 'glitch',
    label: 'Nhiễu sóng (Glitch)',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7.5 1.5L2.5 8H7L6.5 12.5L11.5 6H7L7.5 1.5Z" />
      </svg>
    ),
  },
  {
    value: 'typewriter',
    label: 'Đánh máy',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.5 4.5L5.5 7.5L2.5 10.5M7 10.5H11.5" />
      </svg>
    ),
  },
  {
    value: 'elastic',
    label: 'Co giãn (Elastic)',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.5 4.5L13 7L10.5 9.5M3.5 4.5L1 7L3.5 9.5M1.5 7H12.5" />
      </svg>
    ),
  },
  {
    value: 'slide-down',
    label: 'Trượt xuống',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 2.5V11.5M7 11.5L3 7.5M7 11.5L11 7.5" />
      </svg>
    ),
  },
  {
    value: 'slide-left',
    label: 'Trượt sang trái',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11.5 7H2.5M2.5 7L6.5 3M2.5 7L6.5 11" />
      </svg>
    ),
  },
  {
    value: 'slide-right',
    label: 'Trượt sang phải',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.5 7H11.5M11.5 7L7.5 3M11.5 7L7.5 11" />
      </svg>
    ),
  },
  {
    value: 'zoom-out',
    label: 'Thu nhỏ vào',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1.5" y="1.5" width="11" height="11" rx="1.5" />
        <rect x="4.5" y="4.5" width="5" height="5" rx="1" />
      </svg>
    ),
  },
  {
    value: 'pop-in',
    label: 'Bật nảy',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="7" cy="7" r="3" />
        <path d="M7 1V2.5M7 11.5V13M1 7H2.5M11.5 7H13" />
      </svg>
    ),
  },
  {
    value: 'flip-x',
    label: 'Lật ngang',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 4.5H12L10 2.5M12 9.5H2L4 11.5" />
      </svg>
    ),
  },
  {
    value: 'kinetic-shake',
    label: 'Rung động',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1.5 7L3.5 4L5.5 10L8.5 4L10.5 10L12.5 7" />
      </svg>
    ),
  },
]

const NO_ANCHOR = 'off'

const EXIT_OPTIONS: StudioSelectOption[] = [
  { value: 'none', label: 'Không thoát' },
  ...ANIMATION_OPTIONS.filter(o => o.value !== 'typewriter'),
]

const TRACKS: { id: KeyframeProperty; label: string; defaultVal: number; min: number; max: number; step: number; unit: string }[] = [
  { id: 'position', label: 'Position Y', defaultVal: 0, min: -150, max: 150, step: 5, unit: 'px' },
  { id: 'scale',    label: 'Scale',      defaultVal: 1, min: 0.2, max: 3, step: 0.1, unit: 'x' },
  { id: 'opacity',  label: 'Opacity',    defaultVal: 1, min: 0, max: 1, step: 0.05, unit: '' },
  { id: 'rotation', label: 'Rotation',   defaultVal: 0, min: -360, max: 360, step: 15, unit: '°' },
]

export default function EffectsTab() {
  const {  
    selectedElementId, scenes, currentSceneIdx,
    inspector, setInspector, updateElement,
    addKeyframe, removeKeyframe, updateKeyframe, showToast 
  } = useEditorStore(
    useShallow(s => ({
      selectedElementId: s.selectedElementId,
      scenes: s.scenes,
      currentSceneIdx: s.currentSceneIdx,
      inspector: s.inspector,
      setInspector: s.setInspector,
      updateElement: s.updateElement,
      addKeyframe: s.addKeyframe,
      removeKeyframe: s.removeKeyframe,
      updateKeyframe: s.updateKeyframe,
      showToast: s.showToast
    }))
  )

  const currentScene = scenes[currentSceneIdx]
  const selectedEl = currentScene?.elements.find(e => e.id === selectedElementId)
  const ins = inspector
  
  const [selectedKfId, setSelectedKfId] = useState<string | null>(null)
  const [localTimePct, setLocalTimePct] = useState<number>(0)
  const [localValue, setLocalValue] = useState<number>(0)

  // Empty state if no element selected
  if (!selectedElementId || !selectedEl) {
    return (
      <div className={styles.tab} style={{ padding: '24px 12px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px', color: 'var(--text-muted)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="22" y1="12" x2="18" y2="12" />
            <line x1="6" y1="12" x2="2" y2="12" />
            <line x1="12" y1="6" x2="12" y2="2" />
            <line x1="12" y1="22" x2="12" y2="18" />
          </svg>
        </div>
        <div style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>Chưa chọn phần tử</div>
        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
          Vui lòng click chọn 1 phần tử trên Canvas để tùy chỉnh Chuyển động & Keyframe.
        </div>
      </div>
    )
  }

  const keyframes = selectedEl.keyframes || []
  const activeKf = keyframes.find(k => k.id === selectedKfId)

  const handleUpdate = (patch: any) => {
    setInspector(patch)
    if (selectedElementId) {
      const elPatch: any = {}
      if ('animPreset' in patch) elPatch.animPreset = patch.animPreset
      if ('animDuration' in patch) elPatch.animDuration = patch.animDuration
      if ('animDelay' in patch) elPatch.animDelay = patch.animDelay
      updateElement(selectedElementId, elPatch)
    }
  }

  // Neo theo lời thoại: danh sách từ của cảnh để chọn mốc xuất hiện / nhấn
  const voiceWords = splitWords(currentScene?.voiceoverText)
  const wordOptions: StudioSelectOption[] = [
    { value: NO_ANCHOR, label: 'Không neo' },
    ...voiceWords.map((w, i) => ({ value: String(i), label: `${i + 1}. ${w}` })),
  ]
  const anchorValue = (idx: number | undefined) =>
    idx !== undefined && idx < voiceWords.length ? String(idx) : NO_ANCHOR
  const parseAnchor = (val: string) => (val === NO_ANCHOR ? undefined : Number(val))

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>, prop: KeyframeProperty, defaultVal: number) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const timePct = Math.round(Math.max(0, Math.min(100, (clickX / rect.width) * 100)))

    addKeyframe(selectedEl.id, {
      property: prop,
      timePct,
      value: defaultVal,
    })
    showToast(`Đã thêm Keyframe tại ${timePct}%`)
  }

  return (
    <div className={styles.tab}>
      {/* Element Identifier Header */}
      <div style={{ padding: '8px 12px', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 'var(--radius-sm)', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--accent)' }}>
          Đang chọn: {selectedEl.type.toUpperCase()}
        </span>
        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>ID: {selectedEl.id}</span>
      </div>

      {/* 1. Animation Preset & Timing (In-Animation) */}
      <div className={styles.group}>
        <SectionHeader title="Chuyển động xuất hiện" />
        <StudioSelect
          value={ins.animPreset || 'slide-up'}
          options={ANIMATION_OPTIONS}
          onChange={(val, label) => {
            handleUpdate({ animPreset: val })
            showToast(`Áp dụng: ${label}`)
          }}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '8px' }}>
          <ScrubNumberInput
            label="Dur"
            value={ins.animDuration ?? 0.6}
            min={0.1}
            max={5}
            step={0.1}
            precision={1}
            unit="s"
            title="Thời lượng chuyển động (giây) — Kéo chuột để thay đổi"
            onChange={v => handleUpdate({ animDuration: v })}
          />
          <ScrubNumberInput
            label="Delay"
            value={ins.animDelay ?? 0.1}
            min={0}
            max={3}
            step={0.1}
            precision={1}
            unit="s"
            title="Độ trễ trước khi xuất hiện (giây) — Kéo chuột để thay đổi"
            onChange={v => handleUpdate({ animDelay: v })}
          />
        </div>
      </div>

      <div className={styles.divider} />

      {/* 1B. Đồng bộ lời thoại: xuất hiện / nhấn / thoát theo từ */}
      <div className={styles.group}>
        <SectionHeader title="Đồng bộ lời thoại" />
        {voiceWords.length > 0 ? (
          <>
            <FormGroup
              label="Xuất hiện theo từ"
              tooltip="Phần tử xuất hiện đúng lúc giọng đọc tới từ này (ghi đè Delay). Khớp chính xác khi giọng có mốc thời gian từng từ."
            >
              <StudioSelect
                value={anchorValue(selectedEl.enterOnWord)}
                options={wordOptions}
                onChange={val => updateElement(selectedEl.id, { enterOnWord: parseAnchor(val) })}
              />
            </FormGroup>
            <FormGroup label="Nhấn tại từ" tooltip="Phần tử nảy nhẹ khi giọng đọc tới từ này, hợp với con số hoặc ý chính.">
              <StudioSelect
                value={anchorValue(selectedEl.emphasisOnWords?.[0])}
                options={wordOptions}
                onChange={val => {
                  const idx = parseAnchor(val)
                  updateElement(selectedEl.id, { emphasisOnWords: idx === undefined ? undefined : [idx] })
                }}
              />
            </FormGroup>
          </>
        ) : (
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
            Cảnh chưa có lời thoại để neo chuyển động.
          </div>
        )}
        <FormGroup label="Hiệu ứng thoát" tooltip="Phần tử rời khung hình trước khi hết cảnh, hoặc tại từ đã chọn bên dưới.">
          <StudioSelect
            value={selectedEl.exitPreset || 'none'}
            options={EXIT_OPTIONS}
            onChange={val => updateElement(selectedEl.id, { exitPreset: val === 'none' ? undefined : val })}
          />
        </FormGroup>
        {selectedEl.exitPreset && voiceWords.length > 0 && (
          <FormGroup label="Thoát tại từ" tooltip="Để trống thì phần tử thoát ngay trước khi hết cảnh.">
            <StudioSelect
              value={anchorValue(selectedEl.exitOnWord)}
              options={wordOptions}
              onChange={val => updateElement(selectedEl.id, { exitOnWord: parseAnchor(val) })}
            />
          </FormGroup>
        )}
      </div>

      <div className={styles.divider} />

      {/* 2. Motion Keyframes (Timeline Animation) */}
      <div className={styles.group}>
        <SectionHeader title="Motion Keyframes (Tùy biến)" />

        <div className={styles.kfTimeline} style={{ gap: '14px' }}>
          {TRACKS.map(t => {
            const trackKfs = keyframes.filter(k => k.property === t.id)

            return (
              <div key={t.id} className={styles.kfTrack} style={{ flexDirection: 'column', alignItems: 'stretch', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)', color: 'var(--text-sub)' }}>
                  <span>{t.label}</span>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>{trackKfs.length} điểm</span>
                </div>
                
                <div 
                  className={styles.kfLine} 
                  onClick={e => handleTrackClick(e, t.id, t.defaultVal)}
                  title="Click vào thanh để thêm Keyframe"
                  style={{ height: '22px', cursor: 'crosshair' }}
                >
                  {trackKfs.map(k => (
                    <div
                      key={k.id}
                      className={`${styles.kfDot} ${k.id === selectedKfId ? styles.kfActive : ''}`}
                      style={{ left: `${k.timePct}%` }}
                      onClick={e => {
                        e.stopPropagation()
                        setSelectedKfId(k.id === selectedKfId ? null : k.id)
                        if (k.id !== selectedKfId) {
                          setLocalTimePct(k.timePct)
                          setLocalValue(k.value)
                        }
                      }}
                      title={`Keyframe ${k.timePct}%: Giá trị = ${k.value}${t.unit}`}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Editor Box for Selected Keyframe */}
      {activeKf && (
        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--accent)', borderRadius: 'var(--radius-sm)', padding: '12px', marginTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--accent)' }}>
              Chỉnh sửa Keyframe ({activeKf.property.toUpperCase()})
            </span>
            <Button
              variant="danger"
              size="xs"
              onClick={() => {
                removeKeyframe(selectedEl.id, activeKf.id)
                setSelectedKfId(null)
                showToast('Đã xóa Keyframe')
              }}
            >
              Xóa
            </Button>
          </div>

          {/* Time Pct Slider */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)', color: 'var(--text-sub)', marginBottom: '2px' }}>
              <span>Thời điểm:</span>
              <span style={{ color: 'var(--text)' }}>{activeKf.timePct}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={localTimePct}
              onChange={e => setLocalTimePct(+e.target.value)}
              onPointerUp={e => updateKeyframe(selectedEl.id, activeKf.id, { timePct: +(e.target as HTMLInputElement).value })}
              style={{ width: '100%', accentColor: 'var(--accent)' }}
            />
          </div>

          {/* Value Slider */}
          {(() => {
            const trackInfo = TRACKS.find(t => t.id === activeKf.property) || TRACKS[0]
            return (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)', color: 'var(--text-sub)', marginBottom: '2px' }}>
                  <span>Giá trị ({trackInfo.unit}):</span>
                  <span style={{ color: 'var(--text)' }}>{localValue}{trackInfo.unit}</span>
                </div>
                <input
                  type="range"
                  min={trackInfo.min}
                  max={trackInfo.max}
                  step={trackInfo.step}
                  value={localValue}
                  onChange={e => setLocalValue(+e.target.value)}
                  onPointerUp={e => updateKeyframe(selectedEl.id, activeKf.id, { value: +(e.target as HTMLInputElement).value })}
                  style={{ width: '100%', accentColor: 'var(--accent)' }}
                />
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
