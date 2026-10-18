import React from 'react';
import { HookLayoutSharedProps } from '../types';
import { mixColor, onAccentColor } from '../../../../utils/rich-text-parser';

export const CtaPillLayout: React.FC<HookLayoutSharedProps> = React.memo(({
  el,
  computedStyle,
  accent,
  heroOpacity,
  heroScale,
  heroTranslateY,
  heroTitle,
  subText,
  boxOpacity,
  boxTranslateY,
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
      {/* Glowing Pill Action Button */}
      <div
        style={{
          opacity: heroOpacity,
          transform: `scale(${heroScale}) translateY(${heroTranslateY}px)`,
          width: '100%',
          background: `linear-gradient(135deg, ${accent} 0%, color-mix(in srgb, ${accent} 75%, var(--text)) 100%)`,
          color: onAccentColor(accent),
          borderRadius: 30,
          padding: '13px 18px',
          boxShadow: `0 8px 25px ${mixColor(accent, 40)}, var(--shadow-md)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          boxSizing: 'border-box',
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
        <span
          style={{
            fontSize: 13.5,
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
          }}
        >
          {heroTitle}
        </span>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </div>

      {/* Subtext info */}
      {subText && (
        <div
          style={{
            opacity: boxOpacity,
            transform: `translateY(${boxTranslateY}px)`,
            background: 'var(--card-bg)',
            borderRadius: 12,
            padding: '8px 14px',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            fontSize: 12,
            textAlign: 'center',
            lineHeight: 1.4,
            boxSizing: 'border-box',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <polyline points="20 12 20 22 4 22 4 12" />
            <rect x="2" y="7" width="20" height="5" />
            <line x1="12" y1="22" x2="12" y2="7" />
            <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
            <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
          </svg>
          <span>{subText}</span>
        </div>
      )}
    </div>
  );
});
