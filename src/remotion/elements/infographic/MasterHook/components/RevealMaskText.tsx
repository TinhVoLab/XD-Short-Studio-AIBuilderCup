import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { mixColor } from '../../../../utils/rich-text-parser';

interface RevealMaskTextProps {
  text: string;
  accentColor?: string;
  textColor?: string;
  fontFamily?: string;
  fontWeight?: number | string;
  fontSize?: number;
  letterSpacing?: string;
  delayFrames?: number;
  staggerFrames?: number;
  containerStyle?: React.CSSProperties;
  lineStyle?: React.CSSProperties;
}

/**
 * Cinematic Staggered Line-by-Line Reveal Mask:
 * Reveals text line by line via a glowing accent wipe bar.
 * Built with Vietnamese diacritics safe-padding to prevent ascender/descender clipping.
 */
export const RevealMaskText: React.FC<RevealMaskTextProps> = ({
  text,
  accentColor = 'var(--accent)',
  textColor = 'var(--text)',
  fontFamily,
  fontWeight = 800,
  fontSize = 32,
  letterSpacing = '-0.02em',
  delayFrames = 5,
  staggerFrames = 4,
  containerStyle = {},
  lineStyle = {},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Smart Line Tokenizer: Respects \n, or splits gracefully if line is overly long
  const lines = useMemo(() => {
    if (!text) return [];
    if (text.includes('\n')) {
      return text.split('\n').filter(Boolean);
    }
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length <= 4) {
      return [text];
    }
    // Auto-split into 2 balanced lines
    const mid = Math.ceil(words.length / 2);
    return [
      words.slice(0, mid).join(' '),
      words.slice(mid).join(' '),
    ];
  }, [text]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        width: '100%',
        ...containerStyle,
      }}
    >
      {lines.map((lineText, idx) => {
        const lineDelay = delayFrames + idx * staggerFrames;

        // Wipe spring progression
        const wipeSpring = spring({
          fps,
          frame: frame - lineDelay,
          config: { damping: 18, mass: 0.65, stiffness: 120 },
        });

        const wipePercent = interpolate(wipeSpring, [0, 1], [0, 100], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

        // Bar fades out after reveal finishes (frame offset +10)
        const barFadeSpring = spring({
          fps,
          frame: frame - (lineDelay + 12),
          config: { damping: 14, mass: 0.5, stiffness: 140 },
        });
        const barOpacity = interpolate(barFadeSpring, [0, 1], [1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

        return (
          <div
            key={idx}
            style={{
              position: 'relative',
              display: 'inline-block',
              overflow: 'visible',
              maxWidth: '100%',
            }}
          >
            {/* Text Layer — Clipped by horizontal inset */}
            <div
              style={{
                fontFamily,
                fontWeight,
                fontSize,
                letterSpacing,
                color: textColor,
                lineHeight: 1.25,
                // Vietnamese diacritic protection padding
                padding: '4px 6px',
                clipPath: `inset(0 ${Math.max(0, 100 - wipePercent)}% 0 0)`,
                WebkitClipPath: `inset(0 ${Math.max(0, 100 - wipePercent)}% 0 0)`,
                willChange: 'clip-path',
                whiteSpace: 'nowrap',
                textShadow: 'var(--text-depth)',
                ...lineStyle,
              }}
            >
              {lineText}
            </div>

            {/* Glowing Accent Wipe Bar */}
            {barOpacity > 0.01 && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${wipePercent}%`,
                  width: 3.5,
                  backgroundColor: accentColor,
                  boxShadow: `0 0 14px ${accentColor}, 0 0 24px ${mixColor(accentColor, 55)}`,
                  borderRadius: 2,
                  opacity: barOpacity,
                  pointerEvents: 'none',
                  transform: 'translateX(-50%)',
                  willChange: 'left, opacity',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
