import React from 'react';
import { HookLayoutSharedProps } from '../types';
import { StaggeredWordGroup } from '../components/StaggeredWordGroup';
import { LiveMarkerHighlight } from '../components/LiveMarkerHighlight';
import { HighlightWordRenderer } from '../components/HighlightWordRenderer';
import { getViralFontFamily } from '../../../../fonts/fontCatalog';

export const KineticBoldScriptLayout: React.FC<HookLayoutSharedProps> = React.memo(({
  el,
  computedStyle,
  accent,
  badgeText,
  badgeOpacity,
  badgeScale,
  heroTitle,
  highlightList,
  computedFontSize,
  hookData,
  subText,
  boxOpacity,
  boxTranslateY,
  boxVariant,
}) => {
  const tiltDeg = hookData?.tiltDeg ?? -6;
  const scriptWords = hookData?.scriptWords || [];
  const scriptFont = getViralFontFamily(hookData?.scriptFontFamily || 'Dancing Script');
  
  const renderHighlight = (word: string) => {
    return (
      <HighlightWordRenderer
        word={word}
        style={hookData?.highlightStyle || 'text-glow'}
        accentColor={accent}
        textColor={computedStyle?.color || 'var(--text)'}
        delayFrames={8}
      />
    );
  };

  return (
    <div
      style={{
        ...computedStyle,
        width: el.width || 360,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {/* Badge float */}
      {badgeText && (
        <div
          style={{
            opacity: badgeOpacity,
            transform: `scale(${badgeScale})`,
            marginBottom: 2,
            padding: '4px 12px',
            borderRadius: 20,
            border: `2px solid ${accent}`,
            color: accent,
            fontSize: 12,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            background: 'var(--card-bg)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {badgeText}
        </div>
      )}

      {/* Main Bold & Handwritten Script Tilted Group */}
      <div
        style={{
          transform: `rotate(${tiltDeg}deg)`,
          transformOrigin: 'center center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <StaggeredWordGroup 
          text={heroTitle}
          highlightWords={highlightList}
          scriptWords={scriptWords}
          scriptFontFamily={scriptFont}
          accentColor={accent}
          delayFrames={5}
          staggerFrames={2}
          wordAnimation={hookData?.wordAnimation}
          renderHighlight={renderHighlight}
          containerStyle={{
            justifyContent: 'center',
            gap: '8px',
            lineHeight: 1.0,
          }}
          wordStyle={{
            fontSize: computedFontSize,
            fontWeight: 900,
            textTransform: 'uppercase',
            color: 'var(--text)',
            textShadow: 'var(--text-depth)',
          }}
        />

        {/* Script Line 2 (If provided in heroLine2, else we rely on scriptWords in heroTitle) */}
        {hookData?.heroLine2 && (
          <div style={{ marginTop: -8, zIndex: 2 }}>
             <StaggeredWordGroup 
              text={hookData.heroLine2}
              highlightWords={[]}
              scriptWords={hookData.heroLine2.split(' ')} // All words are script
              scriptFontFamily={scriptFont}
              accentColor={accent}
              delayFrames={15}
              staggerFrames={2}
              containerStyle={{
                justifyContent: 'center',
                gap: '6px',
              }}
              wordStyle={{
                fontSize: computedFontSize * 1.15,
                fontFamily: `"${scriptFont}", cursive`,
                color: accent,
                textTransform: 'none',
                textShadow: 'var(--text-depth)',
                transform: 'rotate(-4deg)'
              }}
            />
          </div>
        )}
      </div>

      {/* SubText Footnote */}
      {subText && (
        <div
          style={{
            opacity: boxOpacity,
            transform: `translateY(${boxTranslateY}px)`,
            padding: '6px 14px',
            borderRadius: 6,
            backgroundColor: boxVariant === 'solid' ? 'var(--surface-1)' : 'var(--card-bg)',
            border: '1px solid var(--border)',
            color: 'var(--text-sub)',
            fontSize: Math.max(12, computedFontSize * 0.35),
            fontWeight: 500,
            lineHeight: 1.3,
            maxWidth: '92%',
          }}
        >
          {subText}
        </div>
      )}
    </div>
  );
});
