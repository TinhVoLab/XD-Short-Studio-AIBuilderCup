import React, { useState } from 'react'
import styles from './Panels.module.css'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useEditorStore } from '@/store/useEditorStore'
import { STANDARD_POSE_SLOTS, MascotProfile, resolveMascotPoseUrl, DEFAULT_DOODLE_PROFILE } from '@/types/character'
import { useShallow } from 'zustand/react/shallow'
import { Button, SegmentedControl, Select } from '@/components/ui'

export default function MascotPanel() {
  const {
    mascotProfiles,
    activeMascotProfileId,
    setActiveMascotProfileId,
  } = useSettingsStore(
    useShallow(s => ({
      mascotProfiles: s.mascotProfiles,
      activeMascotProfileId: s.activeMascotProfileId,
      setActiveMascotProfileId: s.setActiveMascotProfileId,
    }))
  )

  const { addElement, showToast, setMascotStudioOpen } = useEditorStore(
    useShallow(s => ({
      addElement: s.addElement,
      showToast: s.showToast,
      setMascotStudioOpen: s.setMascotStudioOpen,
    }))
  )

  const [activeCategory, setActiveCategory] = useState<'all' | 'expression' | 'action' | 'turnaround'>('all')

  const activeProfile: MascotProfile =
    mascotProfiles[activeMascotProfileId] || DEFAULT_DOODLE_PROFILE

  const filteredSlots = STANDARD_POSE_SLOTS.filter(
    s => activeCategory === 'all' || s.category === activeCategory
  )

  const handleAddMascotToScene = (poseId: string) => {
    addElement({
      type: 'character-mascot',
      pose: poseId,
      left: 180,
      top: 380,
      width: 220,
      height: 310,
      blendMode: 'screen',
      glowIntensity: 8,
      accentColor: '#BEFF01',
      animPreset: 'bounce-in',
      flipX: false,
    } as any)

    showToast(`Đã chèn nhân vật biểu cảm [${poseId}] vào cảnh!`, 2000)
  }

  const uploadedSlotsCount = Object.keys(activeProfile.slots || {}).length

  return (
    <div className={styles.svgPanelContainer} style={{ height: '100%' }}>
      {/* ── 1. PROFILE SELECTOR & STUDIO LAUNCHER ── */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 8,
          padding: '8px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#BEFF01',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={activeProfile.name}
            >
              {activeProfile.name}
            </span>
          </div>

          <Button
            variant="secondary"
            size="xs"
            onClick={() => setMascotStudioOpen(true)}
            title="Mở Mascot Studio"
          >
            Studio
          </Button>
        </div>

        {Object.keys(mascotProfiles).length > 1 && (
          <Select
            native
            size="sm"
            value={activeMascotProfileId}
            onChange={(val) => setActiveMascotProfileId(val)}
            options={Object.values(mascotProfiles).map((p) => ({
              value: p.id,
              label: `${p.name} (${Object.keys(p.slots || {}).length}/${STANDARD_POSE_SLOTS.length})`
            }))}
            style={{ marginBottom: 6 }}
          />
        )}

        <div style={{ fontSize: 10.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {uploadedSlotsCount === 0 ? (
            <span style={{ color: '#FFB800' }}>
              Chưa nạp ảnh. Bấm <strong>[Studio]</strong> để nạp ảnh nhân vật!
            </span>
          ) : (
            <span style={{ color: 'rgba(255, 255, 255, 0.55)' }}>
              Đã nạp <strong style={{ color: '#BEFF01' }}>{uploadedSlotsCount}/{STANDARD_POSE_SLOTS.length}</strong> slot (9:16)
            </span>
          )}
        </div>
      </div>

      {/* ── 2. CATEGORY PILLS FILTER ── */}
      <div>
        <SegmentedControl
          options={[
            { value: 'all', label: 'Tất cả' },
            { value: 'expression', label: 'Cảm xúc' },
            { value: 'action', label: 'Tư thế' },
            { value: 'turnaround', label: 'Góc xoay' },
          ]}
          value={activeCategory}
          onChange={(val) => setActiveCategory(val as any)}
          size="xs"
          fullWidth
        />
      </div>

      {/* ── 3. GRID OF POSES ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 8,
          overflowY: 'auto',
          flex: 1,
          paddingRight: 2,
        }}
      >
        {filteredSlots.map((slot) => {
          const exactUrl = activeProfile.slots?.[slot.id]
          const resolvedUrl = resolveMascotPoseUrl(activeProfile, slot.id)
          const isFallback = !exactUrl && !!resolvedUrl

          return (
            <div
              key={slot.id}
              onClick={() => {
                if (resolvedUrl) {
                  handleAddMascotToScene(slot.id)
                } else {
                  setMascotStudioOpen(true)
                  showToast(`Chưa có ảnh cho [${slot.name}]. Đang mở Studio để nạp ảnh!`, 3000)
                }
              }}
              style={{
                background: resolvedUrl ? 'rgba(15, 20, 32, 0.85)' : 'rgba(12, 16, 26, 0.6)',
                border: exactUrl
                  ? '1px solid rgba(190, 255, 1, 0.35)'
                  : resolvedUrl
                  ? '1px solid rgba(190, 255, 1, 0.18)'
                  : '1px dashed rgba(255, 255, 255, 0.12)',
                borderRadius: 8,
                padding: '6px 5px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                position: 'relative',
                aspectRatio: '9 / 13',
                justifyContent: 'space-between',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#BEFF01'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.background = 'rgba(18, 24, 38, 0.95)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = exactUrl
                  ? 'rgba(190, 255, 1, 0.35)'
                  : resolvedUrl
                  ? 'rgba(190, 255, 1, 0.18)'
                  : 'rgba(255, 255, 255, 0.12)'
                e.currentTarget.style.transform = 'none'
                e.currentTarget.style.background = resolvedUrl ? 'rgba(15, 20, 32, 0.85)' : 'rgba(12, 16, 26, 0.6)'
              }}
              title={slot.description + (isFallback ? ' (Đang dùng ảnh tương đương)' : ' (Click để chèn)')}
            >
              {/* Top Tag */}
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2px' }}>
                {isFallback ? (
                  <span style={{ fontSize: 8, color: '#8b949e', textTransform: 'uppercase' }}>
                    tương đương
                  </span>
                ) : <span />}
                <span style={{ fontSize: 8.5, fontWeight: 700, color: exactUrl ? '#BEFF01' : resolvedUrl ? 'rgba(190,255,1,0.7)' : 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  {slot.id}
                </span>
              </div>

              {/* Image Preview or Clean Placeholder */}
              <div
                style={{
                  flex: 1,
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative',
                  margin: '3px 0',
                }}
              >
                {resolvedUrl ? (
                  <img
                    src={resolvedUrl}
                    alt={slot.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      objectPosition: 'center',
                      filter: 'drop-shadow(0 0 5px rgba(190, 255, 1, 0.35))',
                    }}
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="3 3" />
                      <path d="M12 8V16M8 12H16" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textAlign: 'center', fontWeight: 500, whiteSpace: 'nowrap' }}>
                      Chưa nạp ảnh
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom Label */}
              <div
                style={{
                  fontSize: 10,
                  fontWeight: resolvedUrl ? 600 : 400,
                  color: resolvedUrl ? '#FFFFFF' : 'rgba(255,255,255,0.6)',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  width: '100%',
                  padding: '0 2px',
                }}
              >
                {slot.name}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
