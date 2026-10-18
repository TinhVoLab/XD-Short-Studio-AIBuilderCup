import React from 'react';
import { HookLayoutSharedProps } from '../types';
import { mixColor, onAccentColor } from '../../../../utils/rich-text-parser';
import { VoicePulse } from '../components/VoicePulse';

export const StickerWordsLayout: React.FC<HookLayoutSharedProps> = React.memo(({
  el,
  computedStyle,
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
}) => {
  const wordsList = heroTitle.split(/\s+/).filter(Boolean);
  const rotationAngles = [-2, 2.5, -1.8, 2, -2.5, 1.5];

  return (
    <div
      style={{
        ...computedStyle,
        width: el.width || 328,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 12,
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
            alignItems: 'center',
            padding: '5px 12px',
            borderRadius: 8,
            backgroundColor: 'var(--card-bg)',
            border: `1.5px solid ${accent}`,
            color: accent,
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            boxShadow: `0 0 14px ${mixColor(accent, 27)}`,
          }}
        >
          {badgeText}
        </div>
      )}

      {/* Sticker Words Wrap */}
      <div
        style={{
          opacity: heroOpacity,
          transform: `scale(${heroScale}) translateY(${heroTranslateY}px)`,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 8,
          width: '100%',
        }}
      >
        {wordsList.map((word, idx) => {
          const rot = rotationAngles[idx % rotationAngles.length];
          const isHl = highlightList.some(hl => word.toLowerCase().includes(hl.toLowerCase()));
          return (
            <VoicePulse key={idx} word={isHl ? word : ''}>
            <div
              style={{
                transform: `rotate(${rot}deg)`,
                background: isHl ? accent : '#FFFFFF',
                color: isHl ? onAccentColor(accent) : '#000000',
                padding: '4px 10px',
                borderRadius: 8,
                fontSize: computedFontSize,
                fontWeight: 900,
                textTransform: 'uppercase',
                boxShadow: '0 6px 16px rgba(0,0,0,0.6), 0 2px 0 rgba(0,0,0,0.9)',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              {word}
            </div>
            </VoicePulse>
          );
        })}
      </div>

      {/* Subtext Tag */}
      {subText && (
        <div
          style={{
            opacity: boxOpacity,
            transform: `translateY(${boxTranslateY}px)`,
            width: '100%',
            background: 'var(--card-bg)',
            borderRadius: 14,
            padding: '10px 16px',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            fontSize: 13,
            fontWeight: 500,
            boxSizing: 'border-box',
          }}
        >
          {subText}
        </div>
      )}
    </div>
  );
});
