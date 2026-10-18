import React from 'react';
import { HookLayoutSharedProps } from '../types';
import { mixColor, readableTint } from '../../../../utils/rich-text-parser';

export const LuxuryZenLayout: React.FC<HookLayoutSharedProps> = React.memo(({
  el,
  computedStyle,
  accent,
  badgeText,
  badgeOpacity,
  badgeScale,
  heroOpacity,
  heroScale,
  heroTranslateY,
  computedFontSize,
  renderedHero,
  subText,
  boxOpacity,
  boxTranslateY,
  typographicVoice,
}) => {
  const fontFace = el.hookData?.fontFamily || el.fontFamily || typographicVoice?.fontFamily || 'Playfair Display, serif';
  const fontWeight = typographicVoice?.fontWeight || 400;
  const letterSpacing = typographicVoice?.letterSpacing || '0.04em';

  return (
    <div
      style={{
        ...computedStyle,
        width: el.width || 328,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 14,
        boxSizing: 'border-box',
        pointerEvents: 'none',
        // position do computedStyle quyết định (absolute) — xem tests/unit/elementPositioning.test.ts
      }}
    >
      {/* Soft Ambient Radial Aura */}
      <div
        style={{
          position: 'absolute',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${mixColor(accent, 10)} 0%, transparent 70%)`,
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      />

      {/* Zen Delicate Badge */}
      {badgeText && (
        <div
          style={{
            opacity: badgeOpacity,
            transform: `scale(${badgeScale})`,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.2em',
            color: readableTint(accent),
            textTransform: 'uppercase',
          }}
        >
          ✦ {badgeText} ✦
        </div>
      )}

      {/* Elegant Headline with Expansive Letter Spacing */}
      <div
        style={{
          opacity: heroOpacity,
          transform: `scale(${heroScale}) translateY(${heroTranslateY}px)`,
          fontSize: computedFontSize + 2,
          fontFamily: fontFace,
          fontWeight,
          color: 'var(--text)',
          lineHeight: 1.35,
          letterSpacing,
          textShadow: 'var(--text-depth)',
        }}
      >
        {renderedHero}
      </div>

      {/* Minimalist Quote Subtext */}
      {subText && (
        <div
          style={{
            opacity: boxOpacity,
            transform: `translateY(${boxTranslateY}px)`,
            fontSize: 13.5,
            fontStyle: 'italic',
            fontWeight: 400,
            color: 'var(--text-sub)',
            lineHeight: 1.6,
            maxWidth: 280,
          }}
        >
          &ldquo;{subText}&rdquo;
        </div>
      )}
    </div>
  );
});
