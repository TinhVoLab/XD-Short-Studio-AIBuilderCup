import React from 'react';
import { HookLayoutSharedProps } from '../types';
import { mixColor, readableTint } from '../../../../utils/rich-text-parser';

export const SplitVersusLayout: React.FC<HookLayoutSharedProps> = React.memo(({
  el,
  computedStyle,
  hookData,
  accent,
  badgeText,
  badgeOpacity,
  badgeScale,
  heroOpacity,
  heroScale,
  heroTranslateY,
  heroTitle,
  subText,
  boxOpacity,
  boxTranslateY,
}) => {
  const leftText = hookData.versusLeft || '99% THUA LỖ';
  const rightText = hookData.versusRight || 'TOP 1% KIẾM TIỀN';

  return (
    <div
      style={{
        ...computedStyle,
        width: el.width || 330,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        boxSizing: 'border-box',
        pointerEvents: 'none',
      }}
    >
      {/* Badge */}
      {badgeText && (
        <div
          style={{
            opacity: badgeOpacity,
            transform: `scale(${badgeScale})`,
            display: 'inline-flex',
            padding: '5px 14px',
            borderRadius: 20,
            backgroundColor: mixColor(accent, 15),
            border: `1.5px solid ${accent}`,
            color: 'var(--text)',
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            boxShadow: `0 0 16px ${mixColor(accent, 40)}`,
          }}
        >
          {badgeText}
        </div>
      )}

      {/* Split Duel Boxes */}
      <div
        style={{
          opacity: heroOpacity,
          transform: `scale(${heroScale}) translateY(${heroTranslateY}px)`,
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: 6,
          width: '100%',
        }}
      >
        {/* Left: Red Card */}
        <div
          style={{
            background: mixColor('var(--chart-negative)', 8),
            border: '1.5px solid var(--chart-negative)',
            borderRadius: 12,
            padding: '12px 8px',
            // 45% (không phải readableTint 60%): ô đỏ nằm trên vùng sáng ambient của nền cảnh
            color: 'color-mix(in srgb, var(--chart-negative) 45%, var(--text))',
            fontSize: 13,
            fontWeight: 900,
            textAlign: 'center',
            textTransform: 'uppercase',
            lineHeight: 1.25,
            boxShadow: `0 0 16px ${mixColor('var(--chart-negative)', 12)}`,
          }}
        >
          {leftText}
        </div>

        {/* VS Center Badge */}
        <div
          style={{
            background: 'var(--text)',
            color: 'var(--bg)',
            fontWeight: 900,
            fontSize: 12,
            borderRadius: '50%',
            width: 30,
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-md)',
            flexShrink: 0,
          }}
        >
          VS
        </div>

        {/* Right: Accent Card */}
        <div
          style={{
            background: mixColor(accent, 13),
            border: `1.5px solid ${accent}`,
            borderRadius: 12,
            padding: '12px 8px',
            color: readableTint(accent),
            fontSize: 13,
            fontWeight: 900,
            textAlign: 'center',
            textTransform: 'uppercase',
            lineHeight: 1.25,
            boxShadow: `0 0 16px ${mixColor(accent, 27)}`,
          }}
        >
          {rightText}
        </div>
      </div>

      {/* Hero Title Underneath - ✅ FIX A4: Add animation wrapper */}
      <div
        style={{
          opacity: boxOpacity,
          transform: `translateY(${boxTranslateY}px)`,
          fontSize: 20,
          fontWeight: 800,
          color: 'var(--text)',
          textAlign: 'center',
          textShadow: 'var(--text-depth)',
          letterSpacing: '-0.01em',
        }}
      >
        {heroTitle}
      </div>

      {/* Subtext */}
      {subText && (
        <div
          style={{
            opacity: boxOpacity,
            transform: `translateY(${boxTranslateY}px)`,
            width: '100%',
            background: 'var(--card-bg)',
            borderRadius: 12,
            padding: '8px 14px',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            fontSize: 12.5,
            textAlign: 'center',
            boxSizing: 'border-box',
          }}
        >
          {subText}
        </div>
      )}
    </div>
  );
});
