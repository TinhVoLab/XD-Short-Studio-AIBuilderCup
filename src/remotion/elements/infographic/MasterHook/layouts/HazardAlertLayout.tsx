import React from 'react';
import { HookLayoutSharedProps } from '../types';

export const HazardAlertLayout: React.FC<HookLayoutSharedProps> = React.memo(({
  el,
  computedStyle,
  frame,
  accent,
  badgeText,
  badgeOpacity,
  badgeScale,
  heroOpacity,
  heroScale,
  heroTranslateY,
  heroTitle,
  highlightList,
  computedFontSize,
  subText,
  boxOpacity,
  boxTranslateY,
  typographicVoice,
}) => {
  const isBlinking = Math.floor(frame / 8) % 2 === 0;
  const cleanBadge = (badgeText || '').replace(/^[⚠️🚨•\s]+/, '').trim();

  // Smart high-contrast hazard words renderer
  const renderedHazardHero = React.useMemo(() => {
    if (!highlightList || highlightList.length === 0) {
      return <span style={{ color: '#000000' }}>{heroTitle}</span>;
    }
    const lowerHighlights = highlightList.map(h => h.toLowerCase().trim());
    const words = (heroTitle || '').split(/(\s+)/);

    return words.map((w, idx) => {
      const cleanW = w.toLowerCase().replace(/[^\w\p{L}]/gu, '');
      const isHighlighted = lowerHighlights.some(
        hl => hl === cleanW || cleanW.includes(hl) || hl.includes(cleanW)
      );

      if (isHighlighted && cleanW.length > 0) {
        return (
          <span
            key={idx}
            style={{
              display: 'inline-block',
              backgroundColor: '#E02424',
              color: '#FFFFFF',
              padding: '2px 8px',
              borderRadius: 6,
              boxShadow: '0 3px 8px rgba(0,0,0,0.35)',
              margin: '0 2px',
              letterSpacing: '-0.01em',
              fontWeight: 900,
            }}
          >
            {w}
          </span>
        );
      }
      return <span key={idx} style={{ color: '#000000' }}>{w}</span>;
    });
  }, [heroTitle, highlightList]);

  return (
    <div
      style={{
        ...computedStyle,
        width: el.width || 328,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 10,
        boxSizing: 'border-box',
        pointerEvents: 'none',
      }}
    >
      {/* Blinking Live Alert Pill */}
      {cleanBadge && (
        <div
          style={{
            opacity: badgeOpacity,
            transform: `scale(${badgeScale})`,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 14px',
            borderRadius: 999,
            backgroundColor: '#E02424',
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            boxShadow: '0 0 16px rgba(224, 36, 36, 0.55), 0 4px 10px rgba(0,0,0,0.5)',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: isBlinking ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
              boxShadow: isBlinking ? '0 0 8px #FFFFFF' : 'none',
            }}
          />
          <span>{cleanBadge}</span>
        </div>
      )}

      {/* Hazard Caution Ribbon Banner (High-contrast Studio Yellow) */}
      <div
        style={{
          opacity: heroOpacity,
          transform: `scale(${heroScale}) translateY(${heroTranslateY}px)`,
          width: '100%',
          background: 'linear-gradient(180deg, #FFE814 0%, #FFD000 100%)',
          border: '2.5px solid #000000',
          borderRadius: 12,
          padding: '12px 14px',
          boxShadow: 'var(--shadow-md, 0 8px 24px rgba(0, 0, 0, 0.5))',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            fontSize: computedFontSize,
            fontFamily: el.hookData?.fontFamily || el.fontFamily || typographicVoice?.fontFamily || 'Oswald, sans-serif',
            fontWeight: typographicVoice?.fontWeight || 700,
            lineHeight: 1.15,
            textTransform: 'uppercase',
            letterSpacing: typographicVoice?.letterSpacing || '-0.02em',
            wordBreak: 'break-word',
          }}
        >
          {renderedHazardHero}
        </div>
      </div>

      {/* Warning Callout Box */}
      {subText && (
        <div
          style={{
            opacity: boxOpacity,
            transform: `translateY(${boxTranslateY}px)`,
            width: '100%',
            background: 'rgba(18, 20, 29, 0.95)',
            border: '1px solid rgba(224, 36, 36, 0.35)',
            borderRadius: 10,
            padding: '10px 14px',
            color: '#F0F6FC',
            fontSize: 12.5,
            fontWeight: 500,
            lineHeight: 1.45,
            boxShadow: '0 6px 18px rgba(0,0,0,0.5)',
            boxSizing: 'border-box',
          }}
        >
          {subText}
        </div>
      )}
    </div>
  );
});
