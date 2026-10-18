import React from 'react';
import { ElementProps } from '../types';
import { RemotionElementWrapper } from '../core/RemotionElementWrapper';
import { mixColor } from '../../utils/rich-text-parser';

export const VinylPulseElement: React.FC<ElementProps & { frame: number }> = ({
  el,
  computedStyle,
  positionStyle,
  frame,
}) => {
  const data = el.vinylData || {
    songTitle: 'Rainy Cafe & 432Hz Healing',
    artistOrVibe: 'Lofi Chữa Lành • An Yên',
    badge: '432Hz CHILL',
  };

  const accentColor = el.accentColor || data.accentColor || 'var(--accent, #C4B5FD)';
  const waveColor = data.waveColor || 'var(--chart-series-2, #93C5FD)';
  const rotAngle = (frame * 1.5) % 360; // 360-deg endless smooth rotation

  const w = el.width || 320;
  const h = el.height || 85;

  // Sine Waveform points calculation
  const wavePoints = Array.from({ length: 18 }).map((_, i) => {
    const sin1 = Math.sin(frame * 0.12 + i * 0.45);
    const sin2 = Math.cos(frame * 0.08 + i * 0.3);
    const barHeight = Math.max(4, Math.abs(sin1 * 0.65 + sin2 * 0.35) * 26);
    return barHeight;
  });

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      <div
        style={{
          width: w,
          height: h,
          background: 'var(--surface-1, rgba(18, 16, 26, 0.96))',
          border: '1px solid var(--border, rgba(255, 255, 255, 0.12))',
          borderRadius: 14,
          padding: '10px 14px',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: 'var(--shadow-md, 0 8px 24px rgba(0, 0, 0, 0.5)), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
      {/* Ambient background glow */}
      <div
        style={{
          position: 'absolute',
          top: -20,
          left: 10,
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${mixColor(accentColor, 13)} 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      {/* 🎵 Rotating Vintage Vinyl Record */}
      <div
        style={{
          width: 58,
          height: 58,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #2a2438 0%, #110e18 60%, #08060d 100%)',
          border: '2px solid #332d44',
          boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          flexShrink: 0,
          transform: `rotate(${rotAngle}deg)`,
        }}
      >
        {/* Vinyl Grooves */}
        <div style={{ position: 'absolute', width: 44, height: 44, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)' }} />
        
        {/* Center Record Label */}
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${accentColor} 0%, #7C3AED 100%)`,
            border: '2px solid #110e18',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#FFF' }} />
        </div>
      </div>

      {/* Song Info & Sine Waveform */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Header Title + Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 800,
              color: 'var(--text, #FFFFFF)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {data.songTitle || 'Lofi Healing Beats'}
          </span>
          <span
            style={{
              fontSize: 8,
              fontWeight: 700,
              padding: '1.5px 5px',
              borderRadius: 4,
              background: mixColor(accentColor, 9),
              border: `1px solid ${mixColor(accentColor, 20)}`,
              // Chữ 8px màu accent: pha màu chữ theme để đủ tương phản trên mọi theme
              color: `color-mix(in srgb, ${accentColor} 75%, var(--text))`,
              letterSpacing: 0.5,
              flexShrink: 0,
            }}
          >
            {data.badge || '432Hz'}
          </span>
        </div>

        {/* Subtitle / Frequency */}
        <div style={{ fontSize: 9.5, color: 'var(--text-sub, rgba(255, 255, 255, 0.55))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {data.artistOrVibe || 'Nhạc Thiền Tĩnh Tâm • Deep Focus'}
        </div>

        {/* Ambient Fluid Waveform Bars */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2.5, height: 18, marginTop: 1 }}>
          {wavePoints.map((bH, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${bH}px`,
                background: `linear-gradient(180deg, ${waveColor} 0%, ${accentColor} 100%)`,
                borderRadius: 2,
                opacity: 0.85,
                boxShadow: `0 0 4px ${mixColor(waveColor, 27)}`,
              }}
            />
          ))}
        </div>
      </div>
      </div>
    </RemotionElementWrapper>
  );
};
