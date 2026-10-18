import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import { LiveMarkerHighlight } from './LiveMarkerHighlight';
import { VoicePulse } from './VoicePulse';
import { mixColor, onAccentColor } from '../../../../utils/rich-text-parser';

export interface HighlightWordRendererProps {
  word: string;
  style?: 'text-glow' | 'solid-box' | 'outline-box' | 'underline-thick' | 'marker-circle' | 'gradient-sweep';
  accentColor: string;
  textColor?: string;
  delayFrames?: number;
  customStyle?: React.CSSProperties;
}

const HighlightWordInner: React.FC<HighlightWordRendererProps> = ({
  word,
  style = 'text-glow',
  accentColor = 'var(--accent)',
  textColor = 'var(--text)',
  delayFrames = 8,
  customStyle = {},
}) => {
  const frame = useCurrentFrame();
  if (style === 'solid-box') {
    return (
      <span
        style={{
          display: 'inline-block',
          backgroundColor: accentColor,
          color: onAccentColor(accentColor),
          padding: '2px 10px',
          borderRadius: 6,
          fontWeight: 900,
          boxShadow: `0 4px 16px ${mixColor(accentColor, 40)}`,
          margin: '0 2px',
          ...customStyle,
        }}
      >
        {word}
      </span>
    );
  }

  if (style === 'outline-box') {
    return (
      <span
        style={{
          display: 'inline-block',
          border: `2px solid ${accentColor}`,
          color: accentColor,
          padding: '1px 8px',
          borderRadius: 6,
          fontWeight: 900,
          backgroundColor: mixColor(accentColor, 8),
          boxShadow: `0 0 12px ${mixColor(accentColor, 20)}`,
          margin: '0 2px',
          ...customStyle,
        }}
      >
        {word}
      </span>
    );
  }

  if (style === 'underline-thick') {
    return (
      <span
        style={{
          display: 'inline-block',
          boxShadow: `inset 0 -10px 0 ${accentColor}`,
          color: textColor,
          fontWeight: 900,
          padding: '0 4px',
          ...customStyle,
        }}
      >
        {word}
      </span>
    );
  }

  if (style === 'marker-circle') {
    return (
      <LiveMarkerHighlight color={accentColor} delayFrames={delayFrames} type="circle">
        <span style={{ color: textColor, fontWeight: 900, padding: '0 4px', ...customStyle }}>
          {word}
        </span>
      </LiveMarkerHighlight>
    );
  }

  if (style === 'gradient-sweep') {
    const sweepProgress = interpolate(
      frame - delayFrames,
      [0, 22],
      [0, 100],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    return (
      <span
        style={{
          display: 'inline-block',
          background: `linear-gradient(110deg, ${textColor} 0%, ${accentColor} ${sweepProgress}%, ${textColor} ${Math.min(100, sweepProgress + 25)}%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.25,
          padding: '2px 6px',
          fontWeight: 900,
          filter: `drop-shadow(0 2px 14px ${mixColor(accentColor, 40)})`,
          ...customStyle,
        }}
      >
        {word}
      </span>
    );
  }

  // Default: text-glow
  return (
    <span
      style={{
        color: accentColor,
        textShadow: `0 0 18px ${mixColor(accentColor, 25)}`,
        fontWeight: 900,
        ...customStyle,
      }}
    >
      {word}
    </span>
  );
};

/** Từ nhấn của hook: kiểu nhấn + nảy theo giọng đọc (VoicePulse) */
export const HighlightWordRenderer: React.FC<HighlightWordRendererProps> = (props) => (
  <VoicePulse word={props.word}>
    <HighlightWordInner {...props} />
  </VoicePulse>
);
