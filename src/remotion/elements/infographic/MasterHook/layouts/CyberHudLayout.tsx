import React from 'react';
import { HookLayoutSharedProps } from '../types';
import { mixColor, readableTint } from '../../../../utils/rich-text-parser';

export const CyberHudLayout: React.FC<HookLayoutSharedProps> = React.memo(({
  el,
  computedStyle,
  frame,
  accent,
  badgeText,
  heroOpacity,
  heroScale,
  heroTranslateY,
  computedFontSize,
  renderedHero,
  subText,
}) => {
  const isBlinkingCursor = Math.floor(frame / 10) % 2 === 0;

  return (
    <div
      style={{
        ...computedStyle,
        width: el.width || 328,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        boxSizing: 'border-box',
        pointerEvents: 'none',
      }}
    >
      {/* HUD Box Frame */}
      <div
        style={{
          opacity: heroOpacity,
          transform: `scale(${heroScale}) translateY(${heroTranslateY}px)`,
          width: '100%',
          background: 'var(--card-bg)',
          border: `1.5px solid ${accent}`,
          borderRadius: 8,
          padding: '14px 16px',
          position: 'relative',
          boxShadow: `0 0 25px ${mixColor(accent, 20)}, inset 0 0 15px ${mixColor(accent, 8)}`,
          boxSizing: 'border-box',
        }}
      >
        {/* Top HUD Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
            borderBottom: `1px solid ${mixColor(accent, 27)}`,
            paddingBottom: 6,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontFamily: 'monospace',
              fontWeight: 800,
              color: accent,
              letterSpacing: '0.1em',
            }}
          >
            [ {badgeText || 'SYS.ROOT // SECURE'} ]
          </span>
          <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--text-sub)' }}>
            REC_3S
          </span>
        </div>

        {/* Glitch Tech Title */}
        <div
          style={{
            fontSize: computedFontSize,
            fontFamily: el.hookData?.fontFamily || el.fontFamily || 'Montserrat, Be Vietnam Pro, sans-serif',
            fontWeight: 900,
            color: 'var(--text)',
            lineHeight: 1.15,
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            textShadow: `0 0 10px ${mixColor(accent, 30)}`,
          }}
        >
          {renderedHero}
          <span style={{ color: accent, opacity: isBlinkingCursor ? 1 : 0 }}>_</span>
        </div>

        {/* HUD Subtext */}
        {subText && (
          <div
            style={{
              marginTop: 10,
              paddingTop: 8,
              borderTop: '1px solid var(--border)',
              fontSize: 12.5,
              color: readableTint('var(--chart-series-2)'),
              fontFamily: 'monospace',
              lineHeight: 1.4,
            }}
          >
            {'> '}{subText}
          </div>
        )}
      </div>
    </div>
  );
});
