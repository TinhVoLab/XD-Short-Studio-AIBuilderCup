import React from 'react';
import { ElementProps } from '../types';
import { RemotionElementWrapper } from '../core/RemotionElementWrapper';

export const VsCardElement: React.FC<ElementProps> = ({ el, computedStyle, positionStyle }) => {
  const lCard = el.leftCard || { title: 'RAG', points: ['Nhanh', 'Rẻ'], color: 'var(--chart-positive, #00FF88)' };
  const rCard = el.rightCard || { title: 'FINE-TUNE', points: ['Chậm', 'Đắt'], color: 'var(--chart-negative, #FF5544)' };
  const w = el.width || 320;
  const h = el.height || 200;
  const cardW = (w - 20) / 2;

  const leftColor = lCard.color || 'var(--chart-positive, #00FF88)';
  const rightColor = rCard.color || 'var(--chart-negative, #FF5544)';

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      <div style={{ width: w, height: h, display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', position: 'relative', boxSizing: 'border-box' }}>
        <div style={{
          width: cardW,
          backgroundColor: 'var(--surface-1, rgba(255,255,255,0.03))',
          border: `1px solid ${leftColor}`,
          borderRadius: 12,
          padding: '20px 16px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: `0 4px 20px color-mix(in srgb, ${leftColor} 12%, transparent)`,
        }}>
          <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--text)', fontFamily: 'Be Vietnam Pro', marginBottom: 16 }}>{lCard.title}</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
            {lCard.points.map((p: string, i: number) => (
              <span key={i} style={{ fontSize: 11, color: 'var(--text-sub, rgba(255,255,255,0.8))', fontFamily: 'Be Vietnam Pro, Inter' }}>• {p}</span>
            ))}
          </div>
        </div>
        <div style={{
          width: cardW,
          backgroundColor: 'var(--surface-1, rgba(255,255,255,0.03))',
          border: `1px solid ${rightColor}`,
          borderRadius: 12,
          padding: '20px 16px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: `0 4px 20px color-mix(in srgb, ${rightColor} 12%, transparent)`,
        }}>
          <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--text)', fontFamily: 'Be Vietnam Pro', marginBottom: 16 }}>{rCard.title}</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
            {rCard.points.map((p: string, i: number) => (
              <span key={i} style={{ fontSize: 11, color: 'var(--text-sub, rgba(255,255,255,0.8))', fontFamily: 'Be Vietnam Pro, Inter' }}>• {p}</span>
            ))}
          </div>
        </div>
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 40, height: 40,
          backgroundColor: 'var(--surface-2, #060D16)',
          border: '2px solid var(--border, rgba(255,255,255,0.2))',
          borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 15px color-mix(in srgb, var(--accent, #BEFF01) 35%, transparent)',
          zIndex: 10
        }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--text)', fontFamily: 'Be Vietnam Pro' }}>VS</span>
        </div>
      </div>
    </RemotionElementWrapper>
  );
};
