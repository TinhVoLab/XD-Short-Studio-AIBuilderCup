import React from 'react'
import { SceneElement } from '@/types/scene'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useEditorStore } from '@/store/useEditorStore'
import { resolveMascotPoseUrl } from '@/types/character'
import { RemotionElementWrapper } from '../core/RemotionElementWrapper'
import { mixColor } from '../../utils/rich-text-parser';

interface Props {
  el: SceneElement
  computedStyle?: React.CSSProperties
  positionStyle?: React.CSSProperties
  content?: string
  frame?: number
  fps?: number
  delayFrames?: number
}

export const CharacterMascotElement: React.FC<Props> = ({
  el,
  computedStyle,
  positionStyle,
  frame = 0,
  fps = 30,
  delayFrames = 0,
}) => {
  const settings = useSettingsStore.getState()
  const editor = useEditorStore.getState()

  const profileId =
    el.profileId || editor.activeMascotProfileId || settings.activeMascotProfileId || 'doodle-boy'
  const profile = settings.mascotProfiles[profileId] || settings.mascotProfiles['doodle-boy']

  const pose = el.pose || 'idea'
  const slotUrl = resolveMascotPoseUrl(profile, pose)

  const accent = el.accentColor || profile?.accentColor || '#BEFF01'
  const blendMode = el.blendMode || 'screen'
  const glowIntensity = typeof el.glowIntensity === 'number' ? el.glowIntensity : 8
  const isFlipX = !!el.flipX

  let width = el.width || 220
  let height = el.height || 310
  if (width > 350 || height > 500) {
    width = 220
    height = 310
  }

  const localFrame = Math.max(0, frame - (delayFrames || 0))

  // Idle animations: float, gentle-breath, wiggle
  const idle = el.idleAnim || (['float', 'gentle-breath', 'wiggle'].includes(el.animPreset || '') ? el.animPreset : 'none')
  let idleOffsetY = 0
  let idleScale = 1
  let idleRotate = 0

  if (idle === 'float') {
    idleOffsetY = Math.sin((localFrame / (fps || 30)) * Math.PI * 1.5) * 6
  } else if (idle === 'gentle-breath') {
    idleScale = 1 + Math.sin((localFrame / (fps || 30)) * Math.PI) * 0.025
  } else if (idle === 'wiggle') {
    idleRotate = Math.sin((localFrame / (fps || 30)) * Math.PI * 3) * 2.5
  }

  // Filter based on blend mode
  let filterStyle = 'none'
  if (blendMode === 'screen') {
    filterStyle = glowIntensity > 0
      ? `drop-shadow(0 0 ${glowIntensity}px ${accent}) drop-shadow(0 0 ${glowIntensity * 2}px ${mixColor(accent, 27)})`
      : 'none'
  } else if (blendMode === 'multiply') {
    filterStyle = 'contrast(1.05)'
  } else {
    filterStyle = glowIntensity > 0
      ? `drop-shadow(0 0 ${glowIntensity}px ${mixColor(accent, 53)})`
      : 'none'
  }

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      <div
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `translateY(${idleOffsetY}px) scale(${idleScale}) rotate(${idleRotate}deg) scaleX(${isFlipX ? -1 : 1})`,
          transformOrigin: 'center center',
          mixBlendMode: blendMode as any,
          pointerEvents: 'none',
          boxSizing: 'border-box',
        }}
      >
        {slotUrl ? (
          <img
            src={slotUrl}
            alt={`Mascot ${pose}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              objectPosition: 'center',
              filter: filterStyle,
              WebkitUserSelect: 'none',
              userSelect: 'none',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1.5px dashed ${mixColor(accent, 53)}`,
              borderRadius: 12,
              background: 'rgba(0,0,0,0.4)',
              color: '#FFF',
              padding: 8,
              textAlign: 'center',
            }}
          >
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="7" r="4" stroke={accent} strokeWidth="1.6" />
              <path d="M5 21C5 16.5 8 14 12 14C16 14 19 16.5 19 21" stroke={accent} strokeWidth="1.6" strokeLinecap="round" />
              <path d="M12 14V18M9 16L15 16" stroke="#FFF" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 11, fontWeight: 700, color: accent, marginTop: 4 }}>
              [ {pose.toUpperCase()} ]
            </span>
            <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.6)' }}>Chưa nạp ảnh slot</span>
          </div>
        )}
      </div>
    </RemotionElementWrapper>
  )
}
