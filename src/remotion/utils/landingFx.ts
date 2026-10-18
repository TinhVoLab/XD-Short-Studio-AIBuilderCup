import React from 'react';
import { mixColor } from './rich-text-parser';

export type LandingFxType = 'pulse' | 'glow' | 'none';

/**
 * Calculates a smooth landing pulse/glow envelope (0 -> 1 -> 0)
 * Deterministic for 100% video frame rendering parity.
 *
 * @param frame Current frame
 * @param completionFrame The frame when the counter/spring reaches target
 * @param duration Duration of the landing accent in frames (default: 12 frames, ~0.4s @ 30fps)
 */
export function getLandingEnvelope(
  frame: number,
  completionFrame: number,
  duration = 12
): number {
  const diff = frame - completionFrame;
  if (diff < 0 || diff > duration) return 0;
  // Normalized time [0, 1]
  const t = diff / duration;
  // Smooth bell curve: sin(t * PI) with ease-out damping
  const impulse = Math.sin(t * Math.PI) * Math.pow(1 - t, 0.4);
  return Math.max(0, Math.min(1, impulse));
}

/**
 * Returns inline CSS styles for landing punch effect
 * @param landing Normalized impulse [0, 1]
 * @param type 'pulse' | 'glow' | 'none'
 * @param accentColor Accent color for glow
 */
export function getLandingTransformStyle(
  landing: number,
  type: LandingFxType = 'none',
  accentColor = '#BEFF01'
): React.CSSProperties {
  if (!landing || landing <= 0.001 || type === 'none') {
    return {};
  }

  if (type === 'pulse') {
    const scale = 1 + 0.07 * landing;
    return {
      transform: `scale(${scale.toFixed(4)})`,
      transformOrigin: 'center center',
      display: 'inline-block',
      willChange: 'transform',
    };
  }

  if (type === 'glow') {
    const glowBlur = Math.round(landing * 14);
    const alphaPct = Math.min(100, Math.max(0, Math.round((landing * 160 * 100) / 255)));
    return {
      // color-mix thay vì nối hậu tố hex: đúng cả khi accentColor là var(--x)
      filter: `drop-shadow(0 0 ${glowBlur}px ${mixColor(accentColor, alphaPct)})`,
      textShadow: `0 0 ${glowBlur}px ${accentColor}`,
      willChange: 'filter',
    };
  }

  return {};
}
