import React from 'react';
import { HookLayoutSharedProps } from '../types';
import { mixColor, onAccentColor } from '../../../../utils/rich-text-parser';

export const CtaSocialLayout: React.FC<HookLayoutSharedProps> = React.memo(({
  el,
  computedStyle,
  frame,
  accent,
  badgeText,
  heroOpacity,
  heroScale,
  heroTranslateY,
  heroTitle,
  subText,
  boxOpacity,
  boxTranslateY,
}) => {
  const isBellRinging = Math.floor(frame / 6) % 2 === 0;

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
      {/* Main Social Bar Card */}
      <div
        style={{
          opacity: heroOpacity,
          transform: `scale(${heroScale}) translateY(${heroTranslateY}px)`,
          width: '100%',
          background: 'var(--card-bg)',
          border: '1.5px solid var(--border)',
          borderRadius: 16,
          padding: '12px 14px',
          boxShadow: `var(--shadow-md), 0 0 20px ${mixColor(accent, 27)}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          boxSizing: 'border-box',
        }}
      >
        {/* Channel Info Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${accent} 0%, color-mix(in srgb, ${accent} 75%, var(--text)) 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              boxShadow: `0 0 10px ${mixColor(accent, 55)}`,
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={onAccentColor(accent)} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 900,
                color: 'var(--text)',
                letterSpacing: '-0.01em',
                lineHeight: 1.2,
              }}
            >
              {heroTitle}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-sub)', marginTop: 2 }}>
              {badgeText || 'VIDEO MỚI MỖI NGÀY'}
            </div>
          </div>
        </div>

        {/* Glowing Follow Button */}
        <div
          style={{
            background: accent,
            color: onAccentColor(accent),
            padding: '7px 14px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            boxShadow: `0 0 16px ${mixColor(accent, 60)}, var(--shadow-sm)`,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            flexShrink: 0,
          }}
        >
          + FOLLOW
        </div>
      </div>

      {/* Bell Reminder Subtext */}
      {subText && (
        <div
          style={{
            opacity: boxOpacity,
            transform: `translateY(${boxTranslateY}px)`,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--card-bg)',
            borderRadius: 20,
            padding: '6px 14px',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            fontSize: 11.5,
            fontWeight: 600,
          }}
        >
          <span
            style={{
              transform: isBellRinging ? 'rotate(-15deg)' : 'rotate(15deg)',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </span>
          <span>{subText}</span>
        </div>
      )}
    </div>
  );
});
