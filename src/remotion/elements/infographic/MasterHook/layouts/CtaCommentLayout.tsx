import React from 'react';
import { HookLayoutSharedProps } from '../types';
import { mixColor, onAccentColor, readableTint } from '../../../../utils/rich-text-parser';

export const CtaCommentLayout: React.FC<HookLayoutSharedProps> = React.memo(({
  el,
  computedStyle,
  accent,
  badgeText,
  heroOpacity,
  heroScale,
  heroTranslateY,
  highlightList,
  subText,
  boxOpacity,
  boxTranslateY,
}) => {
  const keyword = highlightList[0] || 'TOOL';

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
      {/* Chat Comment Card */}
      <div
        style={{
          opacity: heroOpacity,
          transform: `scale(${heroScale}) translateY(${heroTranslateY}px)`,
          width: '100%',
          background: 'var(--card-bg)',
          border: `1.5px solid ${accent}`,
          borderRadius: 16,
          padding: '14px 16px',
          boxShadow: `var(--shadow-md), 0 0 20px ${mixColor(accent, 15)}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--text)',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>{badgeText || 'BÌNH LUẬN NGAY TỪ KHÓA BÊN DƯỚI'}</span>
        </div>

        {/* Highlighted Keyword Box */}
        <div
          style={{
            background: accent,
            color: onAccentColor(accent),
            padding: '6px 20px',
            borderRadius: 10,
            fontSize: 18,
            fontWeight: 900,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            boxShadow: `0 0 16px ${mixColor(accent, 55)}`,
          }}
        >
          "{keyword}"
        </div>

        {/* Arrow Callout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: readableTint('var(--chart-series-2)'), fontWeight: 700 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <polyline points="19 12 12 19 5 12" />
          </svg>
          <span>Hệ thống tự động gửi tài liệu trong 3 giây!</span>
        </div>
      </div>

      {/* Subtext */}
      {subText && (
        <div
          style={{
            opacity: boxOpacity,
            transform: `translateY(${boxTranslateY}px)`,
            fontSize: 11.5,
            color: 'var(--text-sub)',
            textAlign: 'center',
          }}
        >
          {subText}
        </div>
      )}
    </div>
  );
});
