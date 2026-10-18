import React from 'react'
import styles from '../Tabs.module.css'
import { InspectorProps, ColorDot, Slider } from './common'
import { STANDARD_POSE_SLOTS, resolveMascotPoseUrl } from '@/types/character'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useEditorStore } from '@/store/useEditorStore'
import { Button, SegmentedControl, SectionHeader } from '@/components/ui'

export function CharacterMascotInspector({
  element,
  updateElement,
  showToast,
}: InspectorProps) {
  const settings = useSettingsStore.getState()
  const editor = useEditorStore.getState()

  const profileId =
    element.profileId || editor.activeMascotProfileId || settings.activeMascotProfileId || 'doodle-boy'
  const profile = settings.mascotProfiles[profileId] || settings.mascotProfiles['doodle-boy']

  const currentPose = element.pose || 'idea'
  const accent = element.accentColor || profile?.accentColor || '#BEFF01'
  const blendMode = element.blendMode || 'screen'
  const glowIntensity = typeof element.glowIntensity === 'number' ? element.glowIntensity : 8
  const isFlipX = !!element.flipX
  const animPreset = element.animPreset || 'bounce-in'

  const handleSyncFromPrevScene = () => {
    const currentIdx = editor.currentSceneIdx
    if (currentIdx <= 0) {
      showToast('Không có cảnh trước đó để đồng bộ!')
      return
    }
    const prevScene = editor.scenes[currentIdx - 1]
    const prevMascot = prevScene?.elements?.find(e => e.type === 'character-mascot')
    if (!prevMascot) {
      showToast('Cảnh trước không có nhân vật để đồng bộ!')
      return
    }
    updateElement(element.id, {
      left: prevMascot.left,
      top: prevMascot.top,
      width: prevMascot.width,
      height: prevMascot.height,
      flipX: prevMascot.flipX,
      blendMode: prevMascot.blendMode,
      accentColor: prevMascot.accentColor,
      glowIntensity: prevMascot.glowIntensity,
    })
    showToast('Đã đồng bộ vị trí & kích thước từ Cảnh trước!')
  }

  return (
    <>
      {/* ── 1. POSE SELECTOR GRID (26 SLOTS) ── */}
      <div className={styles.group}>
        <SectionHeader 
          title="Biểu Cảm & Tư Thế (Mascot)"
          action={
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '2px 6px',
                background: 'var(--surface-3)',
                color: 'var(--text-muted)',
                borderRadius: 4,
              }}
            >
              {currentPose}
            </span>
          }
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 6,
            maxHeight: 180,
            overflowY: 'auto',
            paddingRight: 2,
            marginBottom: 10,
          }}
        >
          {STANDARD_POSE_SLOTS.map((slot) => {
            const isSelected = currentPose === slot.id
            const slotUrl = resolveMascotPoseUrl(profile, slot.id)

            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => {
                  updateElement(element.id, { pose: slot.id })
                  showToast(`Đã chọn: ${slot.name}`)
                }}
                style={{
                  padding: '6px 2px',
                  borderRadius: 6,
                  border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                  background: isSelected ? 'var(--accent-dim)' : 'var(--surface-3)',
                  color: isSelected ? 'var(--accent)' : 'var(--text-sub)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  position: 'relative',
                }}
                title={slot.description}
              >
                {slotUrl ? (
                  <img
                    src={slotUrl}
                    alt={slot.name}
                    style={{ width: 22, height: 28, objectFit: 'contain' }}
                  />
                ) : (
                  <span style={{ fontSize: 13, fontWeight: 700 }}>•</span>
                )}
                <span
                  style={{
                    fontSize: 8.5,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                    fontWeight: isSelected ? 700 : 500,
                  }}
                >
                  {slot.name || slot.id}
                </span>
              </button>
            )
          })}
        </div>

        {/* ── 2. ĐỒNG BỘ VỊ TRÍ CẢNH TRƯỚC ── */}
        <div style={{ marginBottom: 10 }}>
          <Button
            variant="secondary"
            size="xs"
            onClick={handleSyncFromPrevScene}
            leftIcon={
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            }
            title="Kế thừa toạ độ, kích thước và lật mặt từ cảnh trước"
          >
            Đồng bộ vị trí từ Cảnh trước
          </Button>
        </div>

        {/* ── 3. VISUAL EFFECTS (BLEND MODE & FLIP X) ── */}
        <div style={{ marginBottom: 10 }}>
          <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-sub)', display: 'block', marginBottom: 4 }}>
            Chế độ hòa trộn nền
          </span>
          <SegmentedControl
            options={[
              { value: 'screen', label: 'Nền đen' },
              { value: 'normal', label: 'Trong suốt' },
              { value: 'multiply', label: 'Nền trắng' },
            ]}
            value={blendMode}
            onChange={(val) => {
              updateElement(element.id, { blendMode: val as any })
              showToast(`Chế độ hòa trộn: ${val === 'screen' ? 'Lọc nền đen' : val === 'multiply' ? 'Lọc nền trắng' : 'Trong suốt'}`)
            }}
            size="xs"
            fullWidth
          />
        </div>

        {/* Flip X Button */}
        <div style={{ marginBottom: 10 }}>
          <Button
            variant={isFlipX ? 'primary' : 'secondary'}
            size="xs"
            fullWidth
            onClick={() => {
              updateElement(element.id, { flipX: !isFlipX })
              showToast(isFlipX ? 'Đã quay về hướng chuẩn' : 'Đã lật ngang nhân vật')
            }}
            leftIcon={
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            }
          >
            {isFlipX ? 'Lật ngang: Đang bật' : 'Lật ngang: Đang tắt'}
          </Button>
        </div>

        {/* ── 4. ANIMATION PRESET ── */}
        <div style={{ marginBottom: 10 }}>
          <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-sub)', display: 'block', marginBottom: 4 }}>
            Hiệu ứng hoạt họa
          </span>
          <SegmentedControl
            options={[
              { value: 'bounce-in', label: 'Nảy vào' },
              { value: 'pop-in', label: 'Bật nhún' },
              { value: 'slide-up', label: 'Trượt lên' },
            ]}
            value={['bounce-in', 'pop-in', 'slide-up'].includes(animPreset) ? animPreset : 'bounce-in'}
            onChange={(val) => {
              updateElement(element.id, { animPreset: val as any })
              showToast(`Hiệu ứng xuất hiện: ${val}`)
            }}
            size="xs"
            fullWidth
          />
          <div style={{ marginTop: 4 }}>
            <SegmentedControl
              options={[
                { value: 'float', label: 'Bồng bềnh' },
                { value: 'gentle-breath', label: 'Nhịp thở' },
                { value: 'wiggle', label: 'Lắc lư' },
                { value: 'none', label: 'Tĩnh' },
              ]}
              value={element.idleAnim || (['float', 'gentle-breath', 'wiggle'].includes(animPreset) ? animPreset : 'none')}
              onChange={(val) => {
                updateElement(element.id, { idleAnim: val === 'none' ? undefined : (val as any) })
                showToast(`Chuyển động duy trì: ${val}`)
              }}
              size="xs"
              fullWidth
            />
          </div>
        </div>

        {/* ── 4. NEON GLOW & ACCENT COLOR ── */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-sub)' }}>
              Quầng sáng Neon
            </span>
            <ColorDot
              value={accent}
              onChange={(c) => updateElement(element.id, { accentColor: c })}
            />
          </div>
          <Slider
            label="Độ phát sáng"
            value={glowIntensity}
            min={0}
            max={20}
            step={1}
            display={(v) => `${v}px`}
            onChange={(v) => updateElement(element.id, { glowIntensity: v })}
          />
        </div>

        {/* ── 5. KÍCH THƯỚC NHÂN VẬT (KHÓA TỈ LỆ 9:16) ── */}
        <div style={{ marginTop: 6 }}>
          <Slider
            label="Kích thước nhân vật"
            value={element.width || 220}
            min={120}
            max={340}
            step={5}
            display={(v) => `${v}px`}
            onChange={(w) => {
              const h = Math.round(w * 1.409)
              updateElement(element.id, { width: w, height: h })
            }}
          />
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            {[
              { label: 'Nhỏ', w: 160 },
              { label: 'Chuẩn', w: 220 },
              { label: 'Lớn', w: 280 },
            ].map((preset) => (
              <Button
                key={preset.w}
                variant={(element.width || 220) === preset.w ? 'primary' : 'secondary'}
                size="xs"
                style={{ flex: 1 }}
                onClick={() => {
                  const h = Math.round(preset.w * 1.409)
                  updateElement(element.id, { width: preset.w, height: h })
                }}
              >
                {preset.label} ({preset.w}px)
              </Button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
