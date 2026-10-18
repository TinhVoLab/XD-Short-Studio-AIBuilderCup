import React, { useState } from 'react';
import { Img, useCurrentFrame } from 'remotion';
import { mixColor } from '../utils/rich-text-parser';

export type AvatarPosition = 'top-left' | 'top-right' | 'middle-right' | 'bottom-left' | 'bottom-right' | 'custom';
export type AvatarEffect = 'none' | 'audio-pulse' | 'neon-spin' | 'float';

export interface BrandAvatarProps {
  avatarUrl?: string;
  authorName?: string;
  accentColor?: string;
  size?: number;
  position?: AvatarPosition;
  top?: number;
  left?: number;
  effect?: AvatarEffect;
}

export const BrandAvatar: React.FC<BrandAvatarProps> = ({
  avatarUrl,
  authorName = 'XD',
  accentColor = '#BEFF01',
  size = 38.4,
  position = 'top-left',
  top: customTop,
  left: customLeft,
  effect = 'none',
}) => {
  const [imgError, setImgError] = useState(false);
  const frame = useCurrentFrame();

  if (!avatarUrl && !authorName) return null;

  let baseTop = customTop ?? 22;
  let baseLeft = customLeft ?? 20;

  if (customTop === undefined && customLeft === undefined) {
    if (position === 'top-right') {
      baseTop = 22;
      baseLeft = 360 - 20 - size;
    } else if (position === 'middle-right') {
      baseTop = Math.round(320 - size / 2);
      baseLeft = 360 - 18 - size;
    } else if (position === 'bottom-left') {
      baseTop = 590;
      baseLeft = 20;
    } else if (position === 'bottom-right') {
      baseTop = 590;
      baseLeft = 360 - 20 - size;
    } else {
      baseTop = 22;
      baseLeft = 20;
    }
  }

  // 1. Gentle Float Animation (Effect 4)
  const floatY = effect === 'float' ? Math.sin(frame * 0.08) * 3 : 0;
  const top = baseTop + floatY;
  const left = baseLeft;

  // 2. Speaker Audio Pulse Ring Multipliers (Effect 1)
  // Two expanding concentric pulse waves with staggered phases (cycle 40 frames ≈ 0.66s at 60fps)
  const pulseCycle = 40;
  const pulseP1 = (frame % pulseCycle) / pulseCycle;
  const pulseP2 = ((frame + pulseCycle / 2) % pulseCycle) / pulseCycle;

  // 3. Neon Rotating Border (Effect 2) - smooth 360 deg rotation
  const spinAngle = (frame * 3.5) % 360;

  const initials = authorName
    ? authorName
        .split(' ')
        .map(w => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'XD';

  const showImage = Boolean(avatarUrl && !imgError);

  return (
    <div
      style={{
        position: 'absolute',
        top,
        left,
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 110,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      {/* ── EFFECT 1: 🎙️ SPEAKER AUDIO PULSE RINGS ── */}
      {effect === 'audio-pulse' && (
        <>
          <div
            style={{
              position: 'absolute',
              width: size,
              height: size,
              borderRadius: '50%',
              border: `1.5px solid ${accentColor}`,
              transform: `scale(${1 + pulseP1 * 0.75})`,
              opacity: (1 - pulseP1) * 0.7,
              boxShadow: `0 0 10px ${accentColor}`,
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: size,
              height: size,
              borderRadius: '50%',
              border: `1.5px solid ${accentColor}`,
              transform: `scale(${1 + pulseP2 * 0.75})`,
              opacity: (1 - pulseP2) * 0.7,
              boxShadow: `0 0 10px ${accentColor}`,
              pointerEvents: 'none',
            }}
          />
        </>
      )}

      {/* ── EFFECT 2: 🌀 NEON SPINNING CONIC GRADIENT BORDER ── */}
      {effect === 'neon-spin' && (
        <div
          style={{
            position: 'absolute',
            inset: -3,
            borderRadius: '50%',
            background: `conic-gradient(from ${spinAngle}deg, ${accentColor}, #00D4FF, #EC4899, ${accentColor})`,
            boxShadow: `0 0 14px ${mixColor(accentColor, 53)}`,
            zIndex: 1,
          }}
        />
      )}

      {/* ── MAIN AVATAR CORE ── */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          border: effect === 'neon-spin' ? '2px solid #060D16' : `1.5px solid ${accentColor}`,
          boxShadow:
            effect === 'neon-spin'
              ? 'none'
              : effect === 'float'
              ? `0 ${4 + floatY * 1.5}px 16px ${mixColor(accentColor, 40)}`
              : `0 0 12px ${mixColor(accentColor, 33)}`,
          backgroundColor: '#060D16',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {showImage ? (
          <Img
            src={avatarUrl!}
            onError={() => setImgError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : (
          <span
            style={{
              fontSize: Math.round(size * 0.4),
              fontWeight: 800,
              color: accentColor,
              fontFamily: 'Be Vietnam Pro',
              lineHeight: 1,
            }}
          >
            {initials}
          </span>
        )}
      </div>
    </div>
  );
};
