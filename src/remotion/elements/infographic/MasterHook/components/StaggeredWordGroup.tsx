import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { HighlightWordRenderer } from './HighlightWordRenderer';

interface StaggeredWordGroupProps {
  text: string;
  wordStyle?: React.CSSProperties;
  containerStyle?: React.CSSProperties;
  staggerFrames?: number;
  delayFrames?: number;
  highlightWords?: string[];
  scriptWords?: string[];
  scriptFontFamily?: string;
  accentColor?: string;
  wordAnimation?: 'stagger-pop' | 'typewriter-cursor' | 'elastic-slide' | 'glitch' | 'reveal-wipe';
  highlightStyle?: 'text-glow' | 'solid-box' | 'outline-box' | 'underline-thick' | 'marker-circle' | 'gradient-sweep';
  renderHighlight?: (word: string, index: number, isScript: boolean) => React.ReactNode;
  fontSizeContrast?: boolean; // Odd words get 60% size, even words full size
}

export const StaggeredWordGroup: React.FC<StaggeredWordGroupProps> = ({
  text,
  wordStyle = {},
  containerStyle = {},
  staggerFrames = 2,
  delayFrames = 0,
  highlightWords = [],
  scriptWords = [],
  scriptFontFamily = 'Dancing Script',
  accentColor = 'var(--accent)',
  wordAnimation = 'stagger-pop',
  highlightStyle = 'text-glow',
  renderHighlight,
  fontSizeContrast = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Tách từ theo khoảng trắng
  const words = text.split(/\s+/).filter(Boolean);
  const baseFontSize = typeof wordStyle.fontSize === 'number' ? wordStyle.fontSize : parseFloat(String(wordStyle.fontSize || 36));

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '0.4em',
        alignItems: 'center',
        ...containerStyle,
      }}
    >
      {words.map((word, idx) => {
        // Animation
        const wordDelay = delayFrames + idx * staggerFrames;
        const progress = spring({
          fps,
          frame: frame - wordDelay,
          config: wordAnimation === 'elastic-slide' 
            ? { damping: 8, mass: 0.8, stiffness: 120 }
            : { damping: 12, mass: 0.5, stiffness: 100 },
        });

        let scale = interpolate(progress, [0, 1], [0.8, 1]);
        let opacity = interpolate(progress, [0, 1], [0, 1]);
        let translateY = interpolate(progress, [0, 1], [10, 0]);
        let translateX = 0;

        if (wordAnimation === 'elastic-slide') {
          translateY = interpolate(progress, [0, 1], [40, 0]);
          scale = interpolate(progress, [0, 1], [0.9, 1]);
        } else if (wordAnimation === 'typewriter-cursor') {
          opacity = frame >= wordDelay ? 1 : 0;
          scale = 1;
          translateY = 0;
        } else if (wordAnimation === 'glitch') {
          const isFlicker = frame >= wordDelay && frame < wordDelay + 6 && (frame % 2 === 0);
          opacity = frame < wordDelay ? 0 : isFlicker ? 0.3 : 1;
          scale = 1;
          translateY = isFlicker ? 2 : 0;
          translateX = isFlicker ? Math.sin(frame * 3.7) * 5 : 0;
        }

        const isHighlight = highlightWords.some(hw => word.toLowerCase().includes(hw.toLowerCase()));
        const isScript = scriptWords.some(sw => word.toLowerCase().includes(sw.toLowerCase()));
        
        // Contrast font size — odd words big, even words small
        const contrastFontSize = fontSizeContrast
          ? (idx % 2 === 0 ? baseFontSize : baseFontSize * 0.55)
          : baseFontSize;

        const resolvedWordStyle: React.CSSProperties = {
          ...wordStyle,
          fontSize: contrastFontSize,
          ...(isScript ? { fontFamily: `"${scriptFontFamily || 'Dancing Script'}", cursive`, textTransform: 'none' as const } : {}),
        };

        if (isHighlight) {
          if (renderHighlight) {
            return (
              <div
                key={idx}
                style={{
                  opacity,
                  transform: `scale(${scale}) translateY(${translateY}px) translateX(${translateX}px)`,
                  fontSize: contrastFontSize,
                  fontWeight: wordStyle.fontWeight,
                }}
              >
                {renderHighlight(word, idx, isScript)}
              </div>
            );
          }

          return (
            <div
              key={idx}
              style={{
                opacity,
                transform: `scale(${scale}) translateY(${translateY}px) translateX(${translateX}px)`,
                fontSize: contrastFontSize,
                ...resolvedWordStyle,
              }}
            >
              <HighlightWordRenderer
                word={word}
                style={highlightStyle}
                accentColor={accentColor}
                textColor={wordStyle.color as string || 'var(--text)'}
                delayFrames={wordDelay}
              />
            </div>
          );
        }

        return (
          <div
            key={idx}
            style={{
              opacity,
              transform: `scale(${scale}) translateY(${translateY}px) translateX(${translateX}px)`,
              ...resolvedWordStyle,
            }}
          >
            {word}
          </div>
        );
      })}
    </div>
  );
};
