import { RemotionElementWrapper } from '../core/RemotionElementWrapper';
import React, { useMemo } from 'react';
import { Easing } from 'remotion';
import { ElementProps } from '../types';
import { SignalWaveData, SignalWavePoint } from '@/types/scene';
import { readableTint } from '../../utils/rich-text-parser';

/** Màu series dùng làm CHỮ: pha 40% --text để đạt ≥ 4.5:1 trên nền card ở mọi palette */

interface MappedPoint extends SignalWavePoint {
  x: number;
  y: number;
}

export const SignalWaveElement: React.FC<ElementProps & { frame: number; fps: number; delayFrames?: number; durFrames?: number }> = ({
  el, computedStyle, positionStyle, frame, delayFrames = 0, durFrames = 45,
}) => {
  const data: SignalWaveData = el.signalWaveData || {
    title: 'SIGNAL MONITOR',
    badge: 'LIVE',
    points: [
      { label: 'T1', value: 25 },
      { label: 'T2', value: 55 },
      { label: 'T3', value: 40 },
      { label: 'T4', value: 80 },
      { label: 'T5', value: 60 },
      { label: 'T6', value: 90 },
      { label: 'T7', value: 70, highlight: true },
    ],
  };

  const w = el.width || 320;
  const h = el.height || 160;
  const padX = 24;
  const padY = 32;
  const chartW = w - padX * 2;
  const chartH = h - padY * 2 - 28;
  const baseline = padY + 24 + chartH;
  const waveColor = data.waveColor || el.color || el.accentColor || 'var(--chart-series-1, #00D4FF)';
  const glowColor = data.glowColor || 'var(--chart-highlight, #BEFF01)';

  const progress = Math.min(1, Math.max(0, (frame - delayFrames) / durFrames));
  const eased = Easing.out(Easing.cubic)(progress);

  const pts = data.points || [];
  const n = pts.length;

  const pointCoords: MappedPoint[] = useMemo(() => pts.map((p, i) => ({
    ...p,
    x: padX + (i / Math.max(n - 1, 1)) * chartW,
    y: baseline - (p.value / 100) * chartH * eased,
  })), [pts, chartW, chartH, baseline, eased, padX, n]);

  const pathD = useMemo(() => {
    if (pointCoords.length < 2) return '';
    let d = `M ${pointCoords[0].x} ${pointCoords[0].y}`;
    for (let i = 1; i < pointCoords.length; i++) {
      const prev = pointCoords[i - 1];
      const curr = pointCoords[i];
      const cpx = (prev.x + curr.x) / 2;
      d += ` C ${cpx} ${prev.y} ${cpx} ${curr.y} ${curr.x} ${curr.y}`;
    }
    return d;
  }, [pointCoords]);

  const areaD = useMemo(() => {
    if (!pathD || pointCoords.length === 0) return '';
    const last = pointCoords[pointCoords.length - 1];
    const first = pointCoords[0];
    return `${pathD} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`;
  }, [pathD, pointCoords, baseline]);

  const scanX = ((frame * 2.5) % (w + 40)) - 20;

  const gradId = `sw-grad-${el.id}`;
  const areaGradId = `sw-area-${el.id}`;
  const clipId = `sw-clip-${el.id}`;

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      <div style={{ width: w, height: h,
      background: 'var(--surface-1, rgba(8, 12, 22, 0.95))',
      border: `1px solid var(--border, rgba(0, 212, 255, 0.2))`,
      borderRadius: 10,
      overflow: 'hidden',
      position: 'relative',
      boxSizing: 'border-box',
    }}>
      {/* Scanline overlay CRT effect */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 1px, transparent 1px, transparent 3px)',
        zIndex: 2,
      }} />

      <svg width={w} height={h} style={{ display: 'block', position: 'absolute', inset: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={waveColor} stopOpacity="0.6" />
            <stop offset="50%" stopColor={waveColor} />
            <stop offset="100%" stopColor={glowColor} stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id={areaGradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={waveColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={waveColor} stopOpacity="0" />
          </linearGradient>
          <clipPath id={clipId}>
            <rect x={padX} y={padY + 20} width={chartW} height={chartH + 8} />
          </clipPath>
        </defs>

        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(v => {
          const gy = baseline - (v / 100) * chartH;
          return (
            <g key={v}>
              <line x1={padX} y1={gy} x2={w - padX} y2={gy} stroke="var(--chart-grid, rgba(255,255,255,0.05))" strokeWidth={1} />
              <text x={padX - 4} y={gy + 3} textAnchor="end" fill="var(--text-sub, rgba(255,255,255,0.65))" fontSize="7" fontFamily="monospace">{v}</text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaD} fill={`url(#${areaGradId})`} clipPath={`url(#${clipId})`} />

        {/* Wave path glow (Zero compute halo) */}
        <path d={pathD} fill="none" stroke={waveColor} strokeWidth={6} strokeOpacity={0.2} clipPath={`url(#${clipId})`} />
        {/* Wave path main */}
        <path d={pathD} fill="none" stroke={`url(#${gradId})`} strokeWidth={2} strokeLinecap="round" clipPath={`url(#${clipId})`} />

        {/* Data dots & labels */}
        {pointCoords.map((p, i) => (
          <g key={i}>
            {p.highlight && <circle cx={p.x} cy={p.y} r={9} fill={waveColor} opacity={0.2} />}
            <circle cx={p.x} cy={p.y} r={p.highlight ? 4 : 3} fill={p.highlight ? 'var(--text, #FFFFFF)' : waveColor} />
            <circle cx={p.x} cy={p.y} r={p.highlight ? 4 : 3} stroke={waveColor} strokeWidth={1} fill="none" opacity={0.6} />
            <text x={p.x} y={baseline + 12} textAnchor="middle" fill="var(--chart-label, rgba(255,255,255,0.4))" fontSize="8" fontFamily="sans-serif">{p.label}</text>
            {p.highlight && (
              <text x={p.x} y={p.y - 8} textAnchor="middle" fill={readableTint(waveColor)} fontSize="9" fontWeight="700" fontFamily="monospace">{p.value}%</text>
            )}
          </g>
        ))}

        {/* Scan line */}
        <line x1={scanX} y1={padY + 20} x2={scanX} y2={baseline} stroke={waveColor} strokeWidth={1} opacity={0.25} />
        <line x1={scanX + 1} y1={padY + 20} x2={scanX + 1} y2={baseline} stroke="var(--text, #FFFFFF)" strokeWidth={0.5} opacity={0.1} />

        {/* Title */}
        <text x={padX} y={padY + 10} fill={readableTint(waveColor)} fontSize="10" fontWeight="800" fontFamily="sans-serif" letterSpacing="1">
          {data.title || 'SIGNAL'}
        </text>

        {/* Live badge */}
        {data.badge && (
          <g>
            <rect x={w - padX - 32} y={padY} width={32} height={12} rx={4} fill={waveColor} opacity={0.2} />
            <rect x={w - padX - 32} y={padY} width={32} height={12} rx={4} stroke={waveColor} strokeWidth={0.8} fill="none" />
            <circle cx={w - padX - 26} cy={padY + 6} r={2} fill={waveColor}>
              <animate attributeName="opacity" values="1;0.2;1" dur="1s" repeatCount="indefinite" />
            </circle>
            <text x={w - padX - 22} y={padY + 8.5} fill={readableTint(waveColor)} fontSize="7" fontWeight="700" fontFamily="monospace">{data.badge}</text>
          </g>
        )}
      </svg>
    </div>
    </RemotionElementWrapper>
  );
};
