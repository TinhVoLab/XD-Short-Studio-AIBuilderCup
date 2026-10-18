import React from 'react';
import { HookLayoutSharedProps } from '../types';
import { mixColor, onAccentColor } from '../../../../utils/rich-text-parser';

export const CtaBookmarkLayout: React.FC<HookLayoutSharedProps> = React.memo(({
  el,
  computedStyle,
  accent,
  heroOpacity,
  heroScale,
  heroTranslateY,
  heroTitle,
  subText,
}) => {
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
      {/* Bookmark Action Card */}
      <div
        style={{
          opacity: heroOpacity,
          transform: `scale(${heroScale}) translateY(${heroTranslateY}px)`,
          width: '100%',
          background: 'var(--card-bg)',
          border: `1.5px solid ${accent}`,
          borderRadius: 16,
          padding: '12px 16px',
          boxShadow: `var(--shadow-md), 0 0 20px ${mixColor(accent, 27)}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
          </svg>
          <div style={{ textAlign: 'left' }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 900,
                color: 'var(--text)',
                textTransform: 'uppercase',
              }}
            >
              {heroTitle}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-sub)', marginTop: 2 }}>
              {subText || 'Lưu lại để tra cứu khi cần'}
            </div>
          </div>
        </div>

        <div
          style={{
            background: accent,
            color: onAccentColor(accent),
            padding: '6px 12px',
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            boxShadow: `0 0 12px ${mixColor(accent, 60)}`,
            flexShrink: 0,
          }}
        >
          LƯU NGAY
        </div>
      </div>
    </div>
  );
});
