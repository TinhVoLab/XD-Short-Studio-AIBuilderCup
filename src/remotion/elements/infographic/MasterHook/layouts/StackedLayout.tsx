import React from 'react';
import { HookLayoutSharedProps } from '../types';
import { mixColor, readableTint } from '../../../../utils/rich-text-parser';

export const StackedLayout: React.FC<HookLayoutSharedProps> = React.memo(({
  el,
  computedStyle,
  hookData,
  defaults,
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
  boxVariant,
  boxOpacity,
  boxTranslateY,
}) => {
  return (
    <div
      style={{
        ...computedStyle,
        width: el.width || 320,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 12,
        boxSizing: 'border-box',
        pointerEvents: 'none',
      }}
    >
      {/* ── TẦNG 1: EYECATCHER BADGE ── */}
      {badgeText && (
        <div
          style={{
            opacity: badgeOpacity,
            transform: `scale(${badgeScale})`,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px 14px',
            borderRadius: 20,
            backgroundColor: hookData.badgeBgColor || defaults.badgeBg,
            border: `1px solid ${hookData.badgeBgColor ? accent : defaults.badgeBorder}`,
            color: hookData.badgeTextColor || readableTint(accent),
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {badgeText}
        </div>
      )}

      {/* ── TẦNG 2: HERO HEADLINE ── */}
      <div
        style={{
          opacity: heroOpacity,
          transform: `scale(${heroScale}) translateY(${heroTranslateY}px)`,
          width: '100%',
          fontSize: computedFontSize,
          fontFamily: el.hookData?.fontFamily || el.fontFamily || 'Be Vietnam Pro',
          fontWeight: hookData.fontWeight || el.fontWeight || 900,
          color: hookData.textColor || el.color || 'var(--text)',
          lineHeight: 1.18,
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
          textShadow: 'var(--text-depth)',
          wordBreak: 'break-word',
        }}
      >
        {renderedHero}
      </div>

      {/* ── TẦNG 3: CURIOSITY / VALUE BOX (Obsidian Glassmorphism) ── */}
      {subText && (
        <div
          style={{
            opacity: boxOpacity,
            transform: `translateY(${boxTranslateY}px)`,
            width: '100%',
            background:
              boxVariant === 'solid'
                ? 'var(--surface-1)'
                : 'var(--card-bg)',
            borderRadius: 16,
            padding: '12px 18px',
            border:
              boxVariant === 'neon-border'
                ? `1.5px solid ${accent}`
                : '1px solid var(--border)',
            boxShadow: `var(--shadow-md), 0 0 20px ${mixColor(accent, 10)}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            boxSizing: 'border-box',
          }}
        >
          <span
            style={{
              fontSize: 13.5,
              fontWeight: 500,
              color: 'var(--text)',
              lineHeight: 1.45,
              fontFamily: 'Be Vietnam Pro, Inter, sans-serif',
              letterSpacing: '-0.01em',
            }}
          >
            {subText}
          </span>
        </div>
      )}
    </div>
  );
});
