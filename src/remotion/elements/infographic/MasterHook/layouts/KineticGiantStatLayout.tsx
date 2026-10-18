import React from 'react';
import { HookLayoutSharedProps } from '../types';
import { mixColor } from '../../../../utils/rich-text-parser';
import { StaggeredWordGroup } from '../components/StaggeredWordGroup';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

export const KineticGiantStatLayout: React.FC<HookLayoutSharedProps> = React.memo(({
  el,
  computedStyle,
  accent,
  badgeText,
  badgeOpacity,
  badgeScale,
  heroTitle,
  hookData,
  computedFontSize,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const statValue = hookData?.statValue || '99%';
  const statLabel = hookData?.statLabel || '';

  const statProgress = spring({
    fps,
    frame: frame - 10,
    config: { damping: 8, mass: 0.6, stiffness: 200 }, // ✅ FIX D2: Stronger bounce
  });

  const statScale = interpolate(statProgress, [0, 1], [0.3, 1]);
  const statOpacity = interpolate(statProgress, [0, 1], [0, 1]);

  return (
    <div
      style={{
        ...computedStyle,
        width: el.width || 400,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 4,
        pointerEvents: 'none',
      }}
    >
      {/* Top Small Title */}
      <StaggeredWordGroup 
        text={heroTitle}
        accentColor={accent}
        delayFrames={0}
        staggerFrames={2}
        wordAnimation={hookData?.wordAnimation}
        containerStyle={{ justifyContent: 'center', gap: '6px' }}
        wordStyle={{
          fontSize: computedFontSize * 0.4,
          fontWeight: 800,
          textTransform: 'uppercase',
          color: 'var(--text)',
          letterSpacing: '0.05em',
        }}
      />

      {/* Giant Stat */}
      <div
        style={{
          opacity: statOpacity,
          transform: `scale(${statScale})`,
          fontSize: Math.max(computedFontSize * 2.5, 96), // ✅ FIX C1: Actually GIANT — min 96px
          fontWeight: 900,
          color: accent,
          lineHeight: 0.85,
          textShadow: `0 12px 40px ${mixColor(accent, 55)}, 0 4px 16px ${mixColor(accent, 40)}`,
          margin: '4px 0',
          letterSpacing: '-0.04em',
        }}
      >
        {statValue}
      </div>

      {/* Stat Label & Badge Combo */}
      <div
        style={{
          opacity: badgeOpacity,
          transform: `scale(${badgeScale})`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          marginTop: 8,
        }}
      >
        {statLabel && (
          <div style={{ color: 'var(--text-sub)', fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {statLabel}
          </div>
        )}
        
        {badgeText && (
          <div style={{
            padding: '4px 12px',
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            color: 'var(--text)',
            fontSize: 12,
            fontWeight: 700,
          }}>
            {badgeText}
          </div>
        )}
      </div>
    </div>
  );
});
