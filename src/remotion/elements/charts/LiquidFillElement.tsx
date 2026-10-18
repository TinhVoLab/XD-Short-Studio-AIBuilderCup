import { RemotionElementWrapper } from '../core/RemotionElementWrapper';
import React, { useMemo } from 'react';
import { Easing, spring, useVideoConfig } from 'remotion';
import { ElementProps } from '../types';
import { mixColor } from '../../utils/rich-text-parser';
import { LiquidFillData } from '@/types/scene';

export const LiquidFillElement: React.FC<ElementProps & { frame: number; fps: number; delayFrames?: number; durFrames?: number }> = ({
  el, computedStyle, positionStyle, frame, delayFrames = 0, durFrames = 50,
}) => {
  const { fps } = useVideoConfig();
  const data: LiquidFillData = el.liquidFillData || {
    label: 'NĂNG LƯỢNG',
    value: 68,
    unit: '%',
    subLabel: '8.4 / 12.0 kWh',
    shape: 'circle',
    waveSpeed: 1.5,
  };

  const w = el.width || 260;
  const h = el.height || 260;
  const r = Math.min(w, h) / 2 - 12;
  const cx = w / 2;
  const cy = h / 2;

  const targetValue = Math.max(0, Math.min(100, data.value !== undefined ? data.value : 68));
  
  // Spring entrance progress
  const enterSpr = spring({
    frame: frame - delayFrames,
    fps,
    config: { damping: 14, mass: 0.8, stiffness: 100 },
  });

  const progress = Math.min(1, Math.max(0, (frame - delayFrames) / durFrames));
  const eased = Easing.out(Easing.cubic)(progress);
  const currentValue = targetValue * eased;

  const liquidColor = data.liquidColor || el.color || 'var(--chart-series-1, #00D4FF)';
  const accentColor = data.accentColor || el.accentColor || 'var(--accent, #BEFF01)';
  const waveSpeed = data.waveSpeed || 1.5;

  // Calculate liquid fill surface Y (0% is at bottom cx, cy+r; 100% is at top cx, cy-r)
  const fillHeight = (currentValue / 100) * (r * 2);
  const baseY = cy + r - fillHeight;
  // Khối chất lỏng luôn tối dần về navy (#0B132B) → khi mặt nước phủ qua số, chữ trắng; còn lại theo --text của theme
  const valueOnLiquid = baseY <= cy - 20;
  const valueColor = valueOnLiquid ? '#FFFFFF' : 'var(--text, #FFFFFF)';

  // Generate continuous fluid sine wave path
  const wavePath = useMemo(() => {
    const wavePoints: string[] = [];
    const amplitude = 5.5 + Math.sin(frame * 0.08) * 1.5;
    const frequency = 0.04;
    const timeOffset = (frame * waveSpeed * 0.07);

    for (let x = cx - r - 20; x <= cx + r + 20; x += 4) {
      const y = baseY + Math.sin((x + timeOffset * 40) * frequency) * amplitude;
      wavePoints.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }

    return `M ${cx - r - 20},${cy + r + 20} L ${wavePoints.join(' L ')} L ${cx + r + 20},${cy + r + 20} Z`;
  }, [cx, cy, r, baseY, frame, waveSpeed]);

  const secondaryWavePath = useMemo(() => {
    const wavePoints: string[] = [];
    const amplitude = 4.0;
    const frequency = 0.035;
    const timeOffset = (frame * waveSpeed * 0.05 + 2);

    for (let x = cx - r - 20; x <= cx + r + 20; x += 4) {
      const y = baseY + Math.sin((x - timeOffset * 35) * frequency + 1.2) * amplitude - 2;
      wavePoints.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }

    return `M ${cx - r - 20},${cy + r + 20} L ${wavePoints.join(' L ')} L ${cx + r + 20},${cy + r + 20} Z`;
  }, [cx, cy, r, baseY, frame, waveSpeed]);

  // Bubbles
  const bubbles = useMemo(() => {
    const arr = [];
    const count = 7;
    for (let i = 0; i < count; i++) {
      const bx = cx - r * 0.6 + ((i * 37 + 13) % (r * 1.2));
      const speed = 0.8 + (i % 3) * 0.4;
      const bProgress = ((frame * speed + i * 20) % 90) / 90;
      const by = cy + r - bProgress * (fillHeight + 10);
      const bSize = 2 + (i % 3) * 1.5;
      const alpha = Math.sin(bProgress * Math.PI) * 0.8;
      if (by < baseY + 5) continue;
      arr.push({ x: bx, y: by, size: bSize, alpha });
    }
    return arr;
  }, [cx, cy, r, frame, fillHeight, baseY]);

  const clipId = `lq-clip-${el.id}`;
  const gradId = `lq-grad-${el.id}`;
  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      <div style={{ width: w, height: h, display: 'block', boxSizing: 'border-box', position: 'relative' }}>
      <svg width={w} height={h} style={{ overflow: 'visible', position: 'absolute', inset: 0 }}>
        <defs>
          <clipPath id={clipId}>
            <circle cx={cx} cy={cy} r={r} />
          </clipPath>

          <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={liquidColor} stopOpacity="0.85" />
            <stop offset="100%" stopColor="#0B132B" stopOpacity="0.95" />
          </linearGradient>

          <radialGradient id={`lq-inner-${el.id}`} cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.15" />
            <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.0" />
            <stop offset="80%" stopColor="#000000" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.7" />
          </radialGradient>
        </defs>

        {/* Ambient Outer Halo */}
        <circle
          cx={cx}
          cy={cy}
          r={r + 6}
          fill="none"
          stroke={liquidColor}
          strokeWidth="1.5"
          opacity={0.25 + Math.sin(frame * 0.08) * 0.1}
          strokeDasharray="4 4"
        />

        {/* Glass Container Background */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="var(--surface-1, #060A14)"
          stroke="var(--chart-grid, rgba(255,255,255,0.12))"
          strokeWidth="2"
        />

        {/* Clipped Liquid Area */}
        <g clipPath={`url(#${clipId})`}>
          {/* Back wave */}
          <path
            d={secondaryWavePath}
            fill={liquidColor}
            opacity="0.35"
          />

          {/* Main Front Wave */}
          <path
            d={wavePath}
            fill={`url(#${gradId})`}
          />

          {/* Bubbles */}
          {bubbles.map((b, idx) => (
            <circle
              key={idx}
              cx={b.x}
              cy={b.y}
              r={b.size}
              fill="var(--text, #FFFFFF)"
              opacity={b.alpha}
            />
          ))}

          {/* Surface highlight shine */}
          <ellipse
            cx={cx}
            cy={cy - r * 0.55}
            rx={r * 0.55}
            ry={r * 0.22}
            fill="var(--text, #FFFFFF)"
            opacity="0.06"
          />
        </g>

        {/* 3D Inner Shadow Sphere Overlay */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill={`url(#lq-inner-${el.id})`}
          pointerEvents="none"
        />

        {/* Glass Outer Ring Highlight */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={liquidColor}
          strokeWidth="2"
          opacity="0.6"
        />

        {/* Glass Corner Glint */}
        <path
          d={`M ${cx - r * 0.7} ${cy - r * 0.5} A ${r} ${r} 0 0 1 ${cx - r * 0.2} ${cy - r * 0.9}`}
          fill="none"
          stroke="var(--text, #FFFFFF)"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.4"
        />
      </svg>

      {/* Floating Center Overlay Content */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        transform: `scale(${Math.max(0.8, enterSpr)})`,
        transformOrigin: 'center center',
      }}>
        {/* Top Mini Badge */}
        {data.label && (
          <div style={{
            fontSize: 10,
            fontWeight: 800,
            color: 'var(--text)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            background: 'var(--surface-2, rgba(6, 13, 24, 0.94))',
            border: `1px solid ${mixColor(accentColor, 27)}`,
            padding: '2px 8px',
            borderRadius: 100,
            marginBottom: 4,
            boxShadow: `0 0 10px ${mixColor(accentColor, 20)}`,
          }}>
            {data.label}
          </div>
        )}

        {/* Big % Value */}
        <div style={{
          fontSize: 34,
          fontWeight: 900,
          color: valueColor,
          lineHeight: 1,
          fontFamily: 'Inter, system-ui, sans-serif',
          textShadow: `0 0 16px ${liquidColor}, 0 2px 4px rgba(0,0,0,0.8)`,
          display: 'flex',
          alignItems: 'baseline',
          gap: 2,
        }}>
          <span>{Math.round(currentValue)}</span>
          <span style={{ fontSize: 18, color: valueColor, fontWeight: 700 }}>
            {data.unit || '%'}
          </span>
        </div>

        {/* Subtitle / Current Capacity */}
        {data.subLabel && (
          <div style={{
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--text-sub, rgba(255,255,255,0.7))',
            marginTop: 4,
            fontFamily: 'monospace',
            background: 'var(--surface-3, rgba(0,0,0,0.4))',
            padding: '1px 6px',
            borderRadius: 4,
          }}>
            {data.subLabel}
          </div>
        )}
      </div>
    </div>
    </RemotionElementWrapper>
  );
};
