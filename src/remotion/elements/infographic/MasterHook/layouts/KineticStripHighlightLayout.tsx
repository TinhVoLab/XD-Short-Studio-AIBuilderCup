import React from 'react';
import { HookLayoutSharedProps } from '../types';
import { mixColor, onAccentColor } from '../../../../utils/rich-text-parser';
import { StaggeredWordGroup } from '../components/StaggeredWordGroup';

export const KineticStripHighlightLayout: React.FC<HookLayoutSharedProps> = React.memo(({
  el,
  computedStyle,
  accent,
  badgeText,
  badgeOpacity,
  badgeScale,
  heroTitle,
  heroOpacity,
  heroScale,
  heroTranslateY,
  computedFontSize,
  subText,
  boxOpacity,
  boxTranslateY,
  hookData,
}) => {
  const stripTextColor = onAccentColor(accent);
  const line2Text = hookData?.heroLine2 || 'MISSING KEYWORD';

  return (
    <div
      style={{
        ...computedStyle,
        width: el.width || 420,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        textAlign: 'left',
        gap: 12,
        pointerEvents: 'none',
      }}
    >
      {/* Badge */}
      {badgeText && (
        <div
          style={{
            opacity: badgeOpacity,
            transform: `scale(${badgeScale})`,
            padding: '6px 14px',
            borderRadius: 6,
            backgroundColor: 'var(--surface)',
            color: 'var(--on-surface)',
            fontSize: 14,
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            boxShadow: `0 4px 16px ${mixColor('var(--surface)', 40)}`,
            marginBottom: 8,
          }}
        >
          {badgeText}
        </div>
      )}

      {/* LINE 1: Contrast-Aware Hero Title */}
      <div style={{ paddingLeft: 4 }}>
        <StaggeredWordGroup 
          text={heroTitle}
          accentColor="var(--text)"
          delayFrames={5}
          staggerFrames={2}
          wordAnimation={hookData?.wordAnimation || 'stagger-pop'}
          containerStyle={{
            justifyContent: 'flex-start',
            gap: '8px',
            lineHeight: 1.1,
          }}
          wordStyle={{
            fontSize: computedFontSize * 0.8,
            fontWeight: 800,
            color: 'var(--text)',
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
          }}
        />
      </div>

      {/* LINE 2: Full Width Strip Highlight */}
      <div
        style={{
          opacity: heroOpacity,
          transform: `scale(${heroScale}) translateY(${heroTranslateY}px)`,
          width: '120%',
          marginLeft: '-10%',
          background: accent,
          padding: '8px 10%',
          display: 'flex',
          justifyContent: 'flex-start',
          boxShadow: `var(--shadow-md), 0 0 20px ${mixColor(accent, 27)}`,
        }}
      >
        <div
          style={{
            fontSize: computedFontSize * 1.1,
            fontWeight: 900,
            color: stripTextColor,
            textTransform: 'uppercase',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
          }}
        >
          {line2Text}
        </div>
      </div>

      {/* SUBTEXT */}
      {subText && (
        <div
          style={{
            opacity: boxOpacity,
            transform: `translateY(${boxTranslateY}px)`,
            paddingLeft: 4,
            color: 'var(--text)',
            fontSize: 16,
            fontWeight: 600,
            marginTop: 8,
            borderBottom: `3px solid ${accent}`,
            paddingBottom: 4,
            display: 'inline-block'
          }}
        >
          {subText}
        </div>
      )}
    </div>
  );
});
