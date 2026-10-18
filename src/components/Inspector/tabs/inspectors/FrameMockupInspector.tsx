import React from 'react'
import styles from '../Tabs.module.css'
import { InspectorProps, Slider, ColorControlRow } from './common'
import { FRAME_PRESETS } from '@/config/frameCatalog'
import { Button, SegmentedControl, SectionHeader } from '@/components/ui'

export function FrameMockupInspector({ element, updateElement }: InspectorProps) {
  const frameData = element.frameData || {
    framePreset: 'browser-macos',
    urlText: 'motionstudio.ai',
    theme: 'dark',
    borderWidth: 3,
  }

  const updateFrame = (patch: Partial<typeof frameData>) => {
    const updated = { ...frameData, ...patch }
    updateElement(element.id, { frameData: updated })
  }

  const currentPreset = FRAME_PRESETS.find(p => p.id === frameData.framePreset) || FRAME_PRESETS[0]
  const isBrowser = frameData.framePreset.startsWith('browser-')

  return (
    <>
      <div className={styles.group}>
        <SectionHeader 
          title="Khung thiết bị (Frame mockup)"
          action={
            <span style={{ fontSize: 9, opacity: 0.9, textTransform: 'uppercase', padding: '2px 6px', background: 'var(--surface-3)', borderRadius: 4, color: 'var(--text-muted)' }}>
              {currentPreset.name}
            </span>
          }
        />

        {/* 1. Preset Selector */}
        <div className={styles.row} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4, marginBottom: 8 }}>
          <label className={styles.label} style={{ fontSize: 11 }}>Kiểu khung / Mockup:</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {FRAME_PRESETS.map((p) => {
              const active = frameData.framePreset === p.id
              return (
                <Button
                  key={p.id}
                  variant={active ? 'primary' : 'secondary'}
                  size="xs"
                  onClick={() => updateFrame({ framePreset: p.id, theme: p.theme })}
                  style={{
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                  }}
                >
                  <span>{p.emoji}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                </Button>
              )
            })}
          </div>
        </div>

        {/* 2. URL Text for Browser Presets */}
        {isBrowser && (
          <div className={styles.row} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4, marginBottom: 8 }}>
            <label className={styles.label} style={{ fontSize: 11 }}>Địa chỉ URL:</label>
            <input
              type="text"
              className={styles.input}
              value={frameData.urlText || ''}
              onChange={(e) => updateFrame({ urlText: e.target.value })}
              placeholder="google.com, youtube.com..."
              style={{ fontSize: 11 }}
            />
          </div>
        )}

        {/* 3. Theme Toggle */}
        <div className={styles.row} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4, marginBottom: 8 }}>
          <label className={styles.label} style={{ fontSize: 11 }}>Giao diện:</label>
          <SegmentedControl
            options={[
              { value: 'dark', label: 'Dark' },
              { value: 'light', label: 'Light' },
              { value: 'glass', label: 'Glass' }
            ]}
            value={frameData.theme || 'dark'}
            onChange={(val) => updateFrame({ theme: val as any })}
            size="xs"
            fullWidth
          />
        </div>

        {/* 4. Border Width */}
        <div style={{ marginTop: 6, marginBottom: 8 }}>
          <Slider
            label="Độ dày viền che"
            value={frameData.borderWidth || 3}
            min={1}
            max={10}
            step={1}
            display={v => `${v}px`}
            onChange={v => updateFrame({ borderWidth: v })}
          />
        </div>

        {/* 5. Accent Color Palette & ColorControlRow */}
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
            {['#00D4FF', '#BEFF01', '#FF3B30', '#A855F7', '#FFD700', '#FFFFFF'].map((col) => {
              const isActive = (element.accentColor || frameData.accentColor) === col;
              return (
                <button
                  key={col}
                  type="button"
                  onClick={() => {
                    updateElement(element.id, { accentColor: col })
                    updateFrame({ accentColor: col })
                  }}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 5,
                    background: col,
                    border: isActive ? '2px solid #FFFFFF' : '1px solid rgba(0,0,0,0.5)',
                    boxShadow: isActive ? '0 0 8px rgba(255,255,255,0.6)' : 'none',
                    cursor: 'pointer',
                  }}
                />
              )
            })}
          </div>

          <ColorControlRow
            label="Màu nhấn viền khung"
            value={element.accentColor || frameData.accentColor || '#00D4FF'}
            onChange={(c) => {
              updateElement(element.id, { accentColor: c })
              updateFrame({ accentColor: c })
            }}
          />
        </div>
      </div>
    </>
  )
}
