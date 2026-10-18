import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { HookLayoutSharedProps } from '../types';

export const CinematicLowerThirdLayout: React.FC<HookLayoutSharedProps> = React.memo(({
  el,
  computedStyle,
  accent,
  badgeText,
  heroTitle,
  highlightList,
  subText,
  delayFrames = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Words tokenization
  const tokens = useMemo(() => {
    const words = (heroTitle || '').split(/\s+/).filter(Boolean);
    const lowerHighlights = (highlightList || []).map((h) => h.toLowerCase().trim());

    return words.map((w) => {
      const cleanW = w.toLowerCase().replace(/[^\w\p{L}]/gu, '');
      const isHl =
        lowerHighlights.some((hl) => hl === cleanW || cleanW.includes(hl) || hl.includes(cleanW)) ||
        (w === w.toUpperCase() && w.length > 1);

      return {
        word: w,
        isHighlight: isHl,
      };
    });
  }, [heroTitle, highlightList]);

  // Spring animation for inner content (preserving root transform)
  const animSpring = spring({
    fps,
    frame: frame - delayFrames,
    config: { damping: 14, mass: 0.7, stiffness: 110 },
  });

  const opacity = interpolate(animSpring, [0, 1], [0, 1], { extrapolateRight: 'clamp' });
  const translateY = interpolate(animSpring, [0, 1], [20, 0], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        ...computedStyle,
        width: el.width || 336,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pointerEvents: 'none',
      }}
    >
      {/* Inner motion card to preserve parent translate3d(-50%, ...) alignment */}
      <div
        style={{
          width: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          textAlign: 'left',
          gap: 8,
          padding: '16px 18px',
          borderRadius: 12,
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
          opacity,
          transform: `translateY(${translateY}px)`,
        }}
      >
        {/* Kicker with Horizontal Neon Line */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 2,
          }}
        >
          <div
            style={{
              width: 24,
              height: 2.5,
              backgroundColor: accent,
              borderRadius: 2,
              boxShadow: `0 0 8px ${accent}`,
            }}
          />
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: '0.12em',
              color: accent,
              textTransform: 'uppercase',
            }}
          >
            {badgeText || 'BÍ QUYẾT QUAN TRỌNG'}
          </span>
        </div>

        {/* Main Headline */}
        <div
          style={{
            fontSize: 26,
            fontWeight: 900,
            color: 'var(--text)',
            lineHeight: 1.2,
            textTransform: 'uppercase',
            letterSpacing: '-0.01em',
            textShadow: 'var(--text-depth)',
          }}
        >
          {tokens.map((t, idx) => (
            <span
              key={idx}
              style={{
                color: t.isHighlight ? accent : 'var(--text)',
                marginRight: 6,
                display: 'inline-block',
              }}
            >
              {t.word}
            </span>
          ))}
        </div>

        {/* Subtext with Left Accent Accent Border */}
        {subText && (
          <div
            style={{
              marginTop: 4,
              paddingLeft: 10,
              borderLeft: `2.5px solid ${accent}`,
              fontSize: 12.5,
              color: 'var(--text-sub)',
              lineHeight: 1.45,
              fontWeight: 500,
            }}
          >
            {subText}
          </div>
        )}
      </div>
    </div>
  );
});
