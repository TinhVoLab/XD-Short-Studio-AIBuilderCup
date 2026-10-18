import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { HookLayoutSharedProps } from '../types';
import { mixColor, onAccentColor } from '../../../../utils/rich-text-parser';

export const KineticWordWeightLayout: React.FC<HookLayoutSharedProps> = React.memo(({
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

  // Words tokenization & log-gradient weight calculation
  const { tokens, fontSizes } = useMemo(() => {
    const rawWords = (heroTitle || '').split(/\s+/).filter(Boolean);
    const lowerHighlights = (highlightList || []).map((h) => h.toLowerCase().trim());

    const mapped = rawWords.map((w, idx) => {
      const cleanW = w.toLowerCase().replace(/[^\w\p{L}]/gu, '');
      const isHl =
        lowerHighlights.some((hl) => hl === cleanW || cleanW.includes(hl) || hl.includes(cleanW)) ||
        (w === w.toUpperCase() && w.length > 1) ||
        idx === 0;

      return {
        word: w,
        isHighlight: isHl,
        charCount: w.length,
      };
    });

    const F_MIN = 18;
    const F_MAX = 38;

    const weights = mapped.map((t) => {
      const posBonus = 1 + 0.4 * (t.isHighlight ? 1 : 0);
      return Math.log2(t.charCount + 1) * posBonus;
    });

    const wMax = Math.max(...weights, 0.1);
    const sizes = weights.map((w) => Math.round(F_MIN + (F_MAX - F_MIN) * (w / wMax)));

    return { tokens: mapped, fontSizes: sizes };
  }, [heroTitle, highlightList]);

  // Spring animation for inner card (preserving parent translate3d centering)
  const animSpring = spring({
    fps,
    frame: frame - delayFrames,
    config: { damping: 14, mass: 0.55, stiffness: 130 },
  });

  const opacity = interpolate(animSpring, [0, 1], [0, 1], { extrapolateRight: 'clamp' });
  const scale = interpolate(animSpring, [0, 1], [0.94, 1], { extrapolateRight: 'clamp' });
  const translateY = interpolate(animSpring, [0, 1], [16, 0], { extrapolateRight: 'clamp' });

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
      {/* Inner motion wrapper to preserve parent translate3d(-50%, ...) alignment */}
      <div
        style={{
          width: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          textAlign: 'left',
          gap: 4,
          padding: '16px 18px',
          background: 'var(--card-bg)',
          borderRadius: '0 12px 12px 0',
          border: '1px solid var(--border)',
          borderLeft: `3.5px solid ${accent}`,
          boxShadow: 'var(--shadow-lg)',
          opacity,
          transform: `scale(${scale}) translateY(${translateY}px)`,
          transformOrigin: 'left center',
        }}
      >
        {/* Top Header Rule */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
            paddingBottom: 6,
            borderBottom: '1px solid var(--border)',
          }}
        >
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 900,
              color: accent,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}
          >
            {badgeText || 'KINETIC WEIGHT'}
          </span>
          <span
            style={{
              fontSize: 9.5,
              color: 'var(--text-sub)',
              fontFamily: 'monospace',
            }}
          >
            f(w)=log
          </span>
        </div>

        {/* Words with Unique Log-gradient Sizes */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 3,
            width: '100%',
          }}
        >
          {tokens.map((t, idx) => {
            const fs = fontSizes[idx];

            if (t.isHighlight) {
              return (
                <span
                  key={idx}
                  style={{
                    display: 'inline-block',
                    maxWidth: '100%',
                    wordBreak: 'break-word',
                    fontSize: fs,
                    fontWeight: 900,
                    lineHeight: 1.05,
                    textTransform: 'uppercase',
                    backgroundColor: accent,
                    color: onAccentColor(accent),
                    padding: '2px 8px',
                    borderRadius: 4,
                    letterSpacing: '-0.02em',
                    boxShadow: `0 4px 14px ${mixColor(accent, 33)}`,
                  }}
                >
                  {t.word}
                </span>
              );
            }

            if (idx % 2 === 1) {
              return (
                <span
                  key={idx}
                  style={{
                    display: 'block',
                    maxWidth: '100%',
                    wordBreak: 'break-word',
                    fontSize: fs,
                    fontWeight: 900,
                    lineHeight: 1.05,
                    textTransform: 'uppercase',
                    color: 'transparent',
                    WebkitTextStroke: `1.5px ${mixColor('var(--text)', 75)}`,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {t.word}
                </span>
              );
            }

            return (
              <span
                key={idx}
                style={{
                  display: 'block',
                  maxWidth: '100%',
                  wordBreak: 'break-word',
                  fontSize: fs,
                  fontWeight: 900,
                  lineHeight: 1.05,
                  textTransform: 'uppercase',
                  color: 'var(--text)',
                  letterSpacing: '-0.01em',
                }}
              >
                {t.word}
              </span>
            );
          })}
        </div>

        {/* Subtext */}
        {subText && (
          <p
            style={{
              marginTop: 10,
              fontSize: 12,
              color: 'var(--text-sub)',
              lineHeight: 1.45,
              fontWeight: 500,
              maxWidth: 300,
            }}
          >
            {subText}
          </p>
        )}
      </div>
    </div>
  );
});
