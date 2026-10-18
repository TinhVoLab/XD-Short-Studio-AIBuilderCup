import React from 'react';
import { HookLayoutSharedProps } from '../types';
import { mixColor, onAccentColor } from '../../../../utils/rich-text-parser';
import { StaggeredWordGroup } from '../components/StaggeredWordGroup';
import { RevealMaskText } from '../components/RevealMaskText';
import { getViralFontFamily } from '../../../../fonts/fontCatalog';

export const KineticContrastLayout: React.FC<HookLayoutSharedProps> = React.memo(({
  el,
  computedStyle,
  accent,
  badgeText,
  badgeOpacity,
  badgeScale,
  heroTitle,
  formattedHeroTitle,
  highlightList,
  computedFontSize,
  subText,
  boxOpacity,
  boxTranslateY,
  hookData,
  typographicVoice,
}) => {
  const isLeftAlign = hookData?.wordLayout !== 'inline';
  const displayFont = el.hookData?.fontFamily || el.fontFamily || typographicVoice?.fontFamily || getViralFontFamily('Oswald');
  
  // 2-Line Duo Logic
  const hasLine2 = !!hookData?.heroLine2;
  const line1Text = formattedHeroTitle || heroTitle;
  const line2Text = hookData?.heroLine2 || '';

  return (
    <div
      style={{
        ...computedStyle,
        width: el.width || 420,
        display: 'flex',
        flexDirection: 'column',
        alignItems: isLeftAlign ? 'flex-start' : 'center',
        textAlign: isLeftAlign ? 'left' : 'center',
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
            backgroundColor: accent,
            color: onAccentColor(accent),
            fontSize: 14,
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            boxShadow: `0 4px 16px ${mixColor(accent, 40)}`,
            marginBottom: 8,
          }}
        >
          {badgeText}
        </div>
      )}

      {/* LINE 1 & 2: Reveal Mask Mode OR Staggered Mode */}
      {hookData?.wordAnimation === 'reveal-wipe' ? (
        <RevealMaskText
          text={hasLine2 ? `${line1Text}\n${line2Text}` : line1Text}
          accentColor={accent}
          textColor="var(--text)"
          fontFamily={displayFont}
          fontWeight={900}
          fontSize={computedFontSize}
          letterSpacing="-0.02em"
          delayFrames={5}
          containerStyle={{
            alignItems: isLeftAlign ? 'flex-start' : 'center',
          }}
        />
      ) : (
        <>
          {/* LINE 1: White/Muted (Or fallback if no line 2) */}
          <StaggeredWordGroup 
            text={line1Text}
            highlightWords={hasLine2 ? [] : highlightList} // Only highlight line 1 if no line 2
            accentColor={accent}
            delayFrames={5}
            staggerFrames={2}
            wordAnimation={hookData?.wordAnimation}
            highlightStyle={hookData?.highlightStyle || 'solid-box'}
            containerStyle={{
              justifyContent: isLeftAlign ? 'flex-start' : 'center',
              gap: '8px',
              lineHeight: 1.1,
            }}
            wordStyle={{
              fontSize: hasLine2 ? computedFontSize * 0.75 : computedFontSize,
              fontWeight: 800,
              color: 'var(--text)',
              letterSpacing: '-0.02em',
            }}
          />

          {/* LINE 2: Giant Accent Bold */}
          {hasLine2 && (
            <StaggeredWordGroup 
              text={line2Text}
              highlightWords={[line2Text]} // Everything in line 2 is highlighted
              accentColor={accent}
              delayFrames={15}
              staggerFrames={2}
              wordAnimation={hookData?.wordAnimation}
              highlightStyle={hookData?.highlightStyle || 'solid-box'}
              containerStyle={{
                justifyContent: isLeftAlign ? 'flex-start' : 'center',
                gap: '8px',
                lineHeight: 1.0,
                marginTop: -4,
              }}
              wordStyle={{
                fontFamily: displayFont,
                fontSize: computedFontSize * 1.25,
                fontWeight: 900,
                color: accent,
                letterSpacing: '-0.03em',
                textShadow: `0 8px 24px ${mixColor(accent, 27)}`,
              }}
              renderHighlight={hookData?.highlightStyle && hookData.highlightStyle !== 'text-glow' ? undefined : ((word) => (
                 <span style={{ color: accent, fontFamily: displayFont }}>{word}</span>
              ))}
            />
          )}
        </>
      )}

      {/* Subtext */}
      {subText && (
        <div
          style={{
            opacity: boxOpacity,
            transform: `translateY(${boxTranslateY}px)`,
            color: 'var(--text-sub)',
            fontSize: 16,
            fontWeight: 600,
            fontStyle: 'italic',
            marginTop: 4,
            paddingLeft: isLeftAlign ? 4 : 0,
          }}
        >
          {subText}
        </div>
      )}
    </div>
  );
});
