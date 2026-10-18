import { RemotionElementWrapper } from '../core/RemotionElementWrapper';
import React, { useMemo } from 'react';
import { spring, interpolate } from 'remotion';
import { AdvElementProps } from '../types';
import { HeatmapCell } from '@/types/scene';
import { mixColor } from '../../utils/rich-text-parser';

const DEFAULT_HEATMAP_CELLS: HeatmapCell[] = [
  { label: 'BTC', value: 85 },
  { label: 'ETH', value: 65 },
  { label: 'SOL', value: 92 },
  { label: 'BNB', value: -12 },
  { label: 'XRP', value: 45 },
  { label: 'ADA', value: -25 },
  { label: 'DOGE', value: 78 },

  { label: 'NVDA', value: 95 },
  { label: 'AAPL', value: -8 },
  { label: 'MSFT', value: 40 },
  { label: 'GOOG', value: 55 },
  { label: 'AMZN', value: 62 },
  { label: 'META', value: 88 },
  { label: 'TSLA', value: -35 },

  { label: 'AI-1', value: 72 },
  { label: 'AI-2', value: 81 },
  { label: 'SaaS', value: 15 },
  { label: 'Bank', value: -18 },
  { label: 'Oil', value: -42 },
  { label: 'Gold', value: 33 },
  { label: 'Real', value: -10 },

  { label: 'Q1', value: 50 },
  { label: 'Q2', value: 85 },
  { label: 'Q3', value: 90 },
  { label: 'Q4', value: 60 },
  { label: 'US', value: 45 },
  { label: 'EU', value: -15 },
  { label: 'ASIA', value: 70 },
];

export const HeatmapMatrixElement: React.FC<AdvElementProps> = ({ 
  el, 
  computedStyle, positionStyle, frame, 
  fps, 
  delayFrames = 0 
}) => {
  const containerWidth = el.width || 336;
  const accentColor = el.accentColor || 'var(--accent, #00FF88)';
  const radius = el.radius !== undefined ? el.radius : 16;
  const title = (el.heatmapData?.title !== undefined && el.heatmapData?.title !== null
    ? String(el.heatmapData.title)
    : (el.content || '')
  ).trim();
  const hasTitle = Boolean(title);
  const cols = Math.max(1, Number(el.heatmapData?.cols) || 7);

  // 1. Memoize Cells Data (Tránh tái tạo mảng mỗi frame, tối ưu 60FPS)
  const cells = useMemo(() => {
    return el.heatmapData?.cells && el.heatmapData.cells.length > 0
      ? el.heatmapData.cells
      : DEFAULT_HEATMAP_CELLS;
  }, [el.heatmapData?.cells]);

  // Card Entrance Spring Animation
  const cardEntrance = spring({
    fps,
    frame: frame - delayFrames,
    config: { damping: 14, mass: 0.6, stiffness: 120 },
  });

  const cardOpacity = interpolate(cardEntrance, [0, 1], [0, 1]);
  const cardScale = interpolate(cardEntrance, [0, 1], [0.92, 1]);

  const isFrameless = el.showCardBg === false || el.bgColor === 'transparent';

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      <div 
        style={{ 
          width: containerWidth,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          backgroundColor: isFrameless ? 'transparent' : (el.bgColor || 'var(--surface-1, rgba(10, 16, 28, 0.95))'),
          borderRadius: radius,
          padding: '12px 14px',
          border: isFrameless ? 'none' : `1px solid var(--border, rgba(255,255,255,0.12))`,
          boxShadow: isFrameless ? 'none' : `var(--shadow-md, 0 8px 32px rgba(0,0,0,0.6))`,
          boxSizing: 'border-box',
          overflow: 'hidden',
          gap: 8,
          opacity: cardOpacity,
          transform: `scale(${cardScale})`,
        }}
      >
        {/* 1. Header with SVG Grid Matrix Icon (Chỉ hiển thị khi có tiêu đề) */}
        {hasTitle && (
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))', 
              paddingBottom: 6,
              boxSizing: 'border-box'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', minWidth: 0 }}>
              {/* Clean SVG Matrix Icon */}
              <svg 
                width="13" 
                height="13" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke={accentColor} 
                strokeWidth="2.2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                style={{ flexShrink: 0 }}
              >
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
              </svg>
              <span 
                style={{ 
                  fontSize: 11.5, 
                  fontWeight: 800, 
                  color: 'var(--text, #FFFFFF)', 
                  fontFamily: el.fontFamily || 'Be Vietnam Pro, sans-serif', 
                  letterSpacing: 0.3, 
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis' 
                }}
              >
                {title}
              </span>
            </div>
          </div>
        )}

        {/* 2. Grid of Heatmap Matrix Cells */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 4,
            marginTop: 2,
            boxSizing: 'border-box'
          }}
        >
          {cells.map((cell, idx) => {
            const cellDelay = delayFrames + idx * 1.2;
            const cellSpr = spring({
              fps,
              frame: frame - cellDelay,
              config: { damping: 12, mass: 0.4, stiffness: 150 },
            });

            const isPositive = cell.value >= 0;
            const isNeutral = cell.value === 0;
            const absVal = Math.abs(cell.value);
            
            // Color logic: custom cell.color overrides, otherwise dynamic positive/negative
            const posColor = 'var(--chart-positive, #00FF88)';
            const negColor = 'var(--chart-negative, #FF3366)';
            const neutralColor = 'var(--chart-axis, #99A1B3)';
            const baseColor = cell.color || (isNeutral ? neutralColor : isPositive ? posColor : negColor);
            // Trần 0.45: chữ --text phủ trên ô vẫn ≥ 4.5:1 ở cả palette tối (xanh neon) lẫn sáng
            const bgOpacity = isNeutral
              ? 0.12
              : 0.12 + 0.33 * Math.min(1, absVal / 100);

            const isHighlight = absVal > 75;

            return (
              <div
                key={idx}
                style={{
                  aspectRatio: '1',
                  borderRadius: 6,
                  border: `1px solid ${baseColor}`,
                  boxShadow: isHighlight ? `0 0 10px ${mixColor(baseColor, 60)}` : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `scale(${cellSpr})`,
                  opacity: cellSpr,
                  padding: '2px 1px',
                  boxSizing: 'border-box',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Dynamic Opacity Layer */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: baseColor,
                    opacity: bgOpacity,
                    pointerEvents: 'none',
                    zIndex: 0,
                  }}
                />

                {cell.label && (
                  <span
                    style={{
                      fontSize: 8.5,
                      fontWeight: 900,
                      color: 'var(--text, #FFFFFF)',
                      fontFamily: 'Inter, sans-serif',
                      lineHeight: 1.1,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '100%',
                      zIndex: 1,
                    }}
                  >
                    {cell.label}
                  </span>
                )}
                <span
                  style={{
                    fontSize: 7.5,
                    fontWeight: 800,
                    color: 'var(--text, rgba(255,255,255,0.95))',
                    fontFamily: 'Inter, sans-serif',
                    lineHeight: 1,
                    marginTop: 1.5,
                    zIndex: 1,
                  }}
                >
                  {cell.value > 0 ? `+${cell.value}%` : `${cell.value}%`}
                </span>
              </div>
            );
          })}
        </div>

        {/* 3. Legend Footer Indicator (Clean Vector Dots, No Emoji) */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginTop: 2, 
            paddingTop: 5, 
            borderTop: '1px solid var(--border, rgba(255,255,255,0.06))',
            boxSizing: 'border-box'
          }}
        >
          <span style={{ fontSize: 9, color: 'var(--text-sub, rgba(255,255,255,0.6))', fontWeight: 800, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--chart-negative, #FF3366)', flexShrink: 0 }} />
            Giảm (&lt;0%)
          </span>
          <span style={{ fontSize: 9, color: 'var(--text-sub, rgba(255,255,255,0.6))', fontWeight: 600, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--chart-grid, rgba(255,255,255,0.4))', flexShrink: 0 }} />
            Trung tính
          </span>
          <span style={{ fontSize: 9, color: 'var(--text-sub, rgba(255,255,255,0.6))', fontWeight: 800, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--chart-positive, #00FF88)', flexShrink: 0 }} />
            Tăng (&gt;0%)
          </span>
        </div>
      </div>
    </RemotionElementWrapper>
  );
};
