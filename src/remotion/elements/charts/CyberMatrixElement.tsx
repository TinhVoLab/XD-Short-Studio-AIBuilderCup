import { RemotionElementWrapper } from '../core/RemotionElementWrapper';
import React, { useMemo } from 'react';
import { Easing } from 'remotion';
import { ElementProps } from '../types';
import { CyberMatrixData } from '@/types/scene';

export const CyberMatrixElement: React.FC<ElementProps & { frame: number; fps: number; delayFrames?: number; durFrames?: number }> = ({
  el, computedStyle, positionStyle, frame, delayFrames = 0, durFrames = 45,
}) => {
  const data: CyberMatrixData = el.cyberMatrixData || {
    title: 'DATA MATRIX',
    rows: 5,
    cols: 8,
    baseColor: 'var(--chart-series-1, #00D4FF)',
    scanColor: 'var(--accent, #BEFF01)',
    cells: Array.from({ length: 40 }, (_, i) => ({
      value: Math.round(20 + ((i * 73 + 17) % 80)),
    })),
  };

  const w = el.width || 320;
  const h = el.height || 180;
  const rows = data.rows ?? 5;
  const cols = data.cols ?? 8;
  const baseColor = data.baseColor || 'var(--chart-series-1, #00D4FF)';
  const scanColor = data.scanColor || 'var(--accent, #BEFF01)';

  const padX = 12;
  const padY = 28;
  const gridW = w - padX * 2;
  const gridH = h - padY - 12;
  const cellW = gridW / cols;
  const cellH = gridH / rows;
  const gap = 2;

  // Scan line x position cycling across width
  const scanX = padX + ((frame * 3) % (gridW + cellW)) - cellW;

  const cells = useMemo(() => {
    return Array.from({ length: rows * cols }, (_, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const delay = delayFrames + (col + row) * 2; // diagonal sweep
      const revealProgress = Math.min(1, Math.max(0, (frame - delay) / durFrames));
      const eased = Easing.out(Easing.cubic)(revealProgress);
      const rawCell = data.cells[idx] || { value: 0 };
      const intensity = (rawCell.value / 100) * eased;
      const cellX = padX + col * cellW;
      const cellY = padY + row * cellH;
      // Near scan line → brightest
      const distToScan = Math.abs(cellX + cellW / 2 - scanX);
      const scanBright = Math.max(0, 1 - distToScan / (cellW * 2));
      const finalAlpha = Math.min(1, intensity + scanBright * 0.35);
      // Random flicker: every 45 frames, briefly flash a few cells
      const flicker = (frame % 45 === idx % 7) ? 0.4 : 0;
      return { col, row, cellX, cellY, intensity: finalAlpha + flicker, rawCell };
    });
  }, [rows, cols, frame, delayFrames, durFrames, data.cells, scanX, cellW, cellH, padX, padY]);

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      <div style={{
        width: w,
        height: h,
        background: el.showCardBg === false ? 'transparent' : 'var(--surface-1, #06090F)',
        border: el.showCardBg === false ? 'none' : `1px solid var(--border, color-mix(in srgb, ${baseColor} 22%, transparent))`,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
        boxSizing: 'border-box',
      }}>
      {/* CRT scanlines */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3,
        background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 3px)',
      }} />

      <svg width={w} height={h} style={{ display: 'block', position: 'absolute', inset: 0 }}>
        {/* Title */}
        <text x={padX} y={18} fill="var(--text-sub)" fontSize="9" fontWeight="800" fontFamily="monospace" letterSpacing="1.5">
          {data.title || 'MATRIX'}
        </text>

        {/* Scan beam */}
        <rect x={scanX - 2} y={padY} width={cellW * 0.8} height={gridH} fill={scanColor} opacity={0.06} />
        <line x1={scanX} y1={padY} x2={scanX} y2={padY + gridH} stroke={scanColor} strokeWidth={1} opacity={0.3} />

        {/* Cells */}
        {cells.map(({ col, row, cellX, cellY, intensity, rawCell }, idx) => {
          const fillColor = rawCell.color || baseColor;
          return (
            <g key={idx}>
              <rect
                x={cellX + gap / 2}
                y={cellY + gap / 2}
                width={cellW - gap}
                height={cellH - gap}
                rx={1.5}
                fill={fillColor}
                fillOpacity={Math.min(0.9, intensity)}
                stroke={fillColor}
                strokeWidth={0.4}
                strokeOpacity={Math.min(0.5, intensity * 0.6)}
              />
              {rawCell.label && intensity > 0.4 && (
                <text
                  x={cellX + cellW / 2}
                  y={cellY + cellH / 2 + 3}
                  textAnchor="middle"
                  fill="var(--text, #FFFFFF)"
                  fontSize={Math.min(cellH * 0.38, 9)}
                  fontFamily="monospace"
                  opacity={intensity}
                >
                  {rawCell.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Corner brackets */}
        {[
          [padX, padY], [w - padX - 8, padY],
          [padX, padY + gridH - 8], [w - padX - 8, padY + gridH - 8],
        ].map(([bx, by], i) => (
          <g key={i}>
            <line x1={bx} y1={by} x2={bx + 8} y2={by} stroke={baseColor} strokeWidth={1.5} opacity={0.5} />
            <line x1={bx} y1={by} x2={bx} y2={by + 8} stroke={baseColor} strokeWidth={1.5} opacity={0.5} />
          </g>
        ))}
      </svg>
    </div>
    </RemotionElementWrapper>
  );
};
