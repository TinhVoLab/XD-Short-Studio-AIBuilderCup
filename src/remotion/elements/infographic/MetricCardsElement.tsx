import React from 'react';
import { spring } from 'remotion';
import { ElementProps } from '../types';
import { RemotionElementWrapper } from '../core/RemotionElementWrapper';

export const MetricCardsElement: React.FC<ElementProps & { frame: number, fps: number, delayFrames: number, durFrames: number }> = ({ el, computedStyle, positionStyle, frame, fps, delayFrames, durFrames }) => {
  const rawData = el.cards || [
    { value: '100%', label: 'Tốc độ' },
    { value: '24/7', label: 'Hỗ trợ' },
    { value: '50M+', label: 'Lượt xem' },
    { value: 'Top 1', label: 'Thịnh hành' }
  ];
  const w = el.width || 312;
  const cols = 2;
  const color = el.accentColor || 'var(--accent, #BEFF01)';
  const progress = Math.min(1, Math.max(0, (frame - delayFrames) / durFrames));
  
  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      <div style={{ width: w, display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12, boxSizing: 'border-box' }}>
        {rawData.map((d: any, i: number) => {
          const stepAppearThreshold = (i * 0.5) / rawData.length;
          const isVisible = progress > stepAppearThreshold;
          const cardSpr = isVisible ? spring({ fps, frame: frame - (delayFrames + durFrames * stepAppearThreshold), config: { damping: 12, mass: 0.8 } }) : 0;

          return (
            <div key={i} style={{ 
              backgroundColor: 'var(--surface-1, rgba(255,255,255,0.03))',
              border: '1px solid var(--border, rgba(255,255,255,0.08))',
              borderRadius: 12,
              padding: '16px 12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
              transform: `scale(${0.8 + 0.2 * cardSpr})`,
              opacity: cardSpr,
              boxSizing: 'border-box',
            }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: color, fontFamily: 'Be Vietnam Pro', textShadow: `0 0 12px color-mix(in srgb, ${color} 30%, transparent)` }}>{d.value}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-sub, rgba(255,255,255,0.6))', fontFamily: 'Be Vietnam Pro, Inter', letterSpacing: 0.5, textAlign: 'center' }}>{d.label}</span>
            </div>
          );
        })}
      </div>
    </RemotionElementWrapper>
  );
};
