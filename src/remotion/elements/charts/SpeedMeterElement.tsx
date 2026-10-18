import { RemotionElementWrapper } from '../core/RemotionElementWrapper';
import React, { useMemo } from 'react';
import { ElementProps } from '../types';
import { SpeedMeterData } from '@/types/scene';
import { useCountUp } from '../../hooks/useCountUp';

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const s = polarToXY(cx, cy, r, startDeg);
  const e = polarToXY(cx, cy, r, endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
}

export const SpeedMeterElement: React.FC<ElementProps & { frame: number; fps: number; delayFrames?: number; durFrames?: number }> = ({
  el, computedStyle, positionStyle, frame, fps = 30, delayFrames = 0, durFrames = 50,
}) => {
  const data: SpeedMeterData = el.speedMeterData || {
    label: 'HIỆU SUẤT',
    value: 78,
    unit: '%',
    needleColor: 'var(--chart-negative, #FF2D78)',
    accentColor: 'var(--accent, #BEFF01)',
  };

  const w = el.width || 280;
  const h = el.height || 220;
  const cx = w / 2;
  const cy = h * 0.48;
  const outerR = Math.min(w, h) * 0.44;
  const strokeW = 10;
  const arcR = outerR - strokeW / 2;

  // Meter arc: 140° (bottom-left) → 400° (bottom-right), 260° total sweep
  const START_DEG = 140;
  const END_DEG = 400;
  const SWEEP_DEG = END_DEG - START_DEG; // 260°

  const targetVal = Math.max(0, Math.min(100, data.value !== undefined ? data.value : 78));

  const needleColor = data.needleColor || 'var(--chart-negative, #FF2D78)';

  // 1. Live CountUp Animation with Spring Physics
  const { currentNumber, displayValue, landingStyle } = useCountUp(`${targetVal}${data.unit || '%'}`, {
    frame,
    fps,
    delayFrames,
    durFrames,
    landingFx: el.landingFx || 'none',
    accentColor: needleColor,
  });
  const currentValue = Math.max(0, Math.min(100, currentNumber));

  // Vibrate needle at high RPM (>85%)
  const vibrate = currentValue > 85 ? Math.sin(frame * 0.8) * 1.5 : 0;
  const needleAngle = START_DEG + (currentValue / 100) * SWEEP_DEG + vibrate;

  const needleLength = arcR * 0.92;
  const needleTip = polarToXY(cx, cy, needleLength, needleAngle);
  const needleBase1 = polarToXY(cx, cy, 4.5, needleAngle + 90);
  const needleBase2 = polarToXY(cx, cy, 4.5, needleAngle - 90);
  const needleTail = polarToXY(cx, cy, 14, needleAngle + 180);

  // Major and minor ticks
  const ticks = useMemo(() => {
    const arr = [];
    const totalTicks = 20;
    for (let i = 0; i <= totalTicks; i++) {
      const pct = i / totalTicks;
      const deg = START_DEG + pct * SWEEP_DEG;
      const isMajor = i % 5 === 0;
      const outer = polarToXY(cx, cy, arcR - strokeW / 2 - 3, deg);
      const inner = polarToXY(cx, cy, arcR - strokeW / 2 - (isMajor ? 10 : 5), deg);
      arr.push({ outer, inner, isMajor, pct, deg });
    }
    return arr;
  }, [cx, cy, arcR, strokeW, START_DEG, SWEEP_DEG]);

  const gradId = `sm-grad-${el.id}`;

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      <div style={{ width: w, height: h, display: 'block', boxSizing: 'border-box', position: 'relative' }}>
      <svg width={w} height={h} style={{ overflow: 'visible', position: 'absolute', inset: 0 }}>
        <defs>
          {/* Cyber Multi-stop Gradient */}
          <linearGradient id={gradId} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--chart-series-1, #00D4FF)" />
            <stop offset="40%" stopColor="var(--accent, #BEFF01)" />
            <stop offset="75%" stopColor="var(--chart-warning, #FFB800)" />
            <stop offset="100%" stopColor="var(--chart-negative, #FF2D78)" />
          </linearGradient>
        </defs>

        {/* Ambient background glow ring */}
        <path
          d={arcPath(cx, cy, arcR, START_DEG, END_DEG)}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={strokeW + 6}
          strokeLinecap="round"
          opacity={0.08}
        />

        {/* Track Base (Inactive dark groove) */}
        <path
          d={arcPath(cx, cy, arcR, START_DEG, END_DEG)}
          fill="none"
          stroke="var(--chart-grid, rgba(255, 255, 255, 0.08))"
          strokeWidth={strokeW}
          strokeLinecap="round"
        />

        {/* Active Progress Arc with Cyber Gradient & Zero-Compute Halo */}
        {currentValue > 0.5 && (
          <>
            <path
              d={arcPath(cx, cy, arcR, START_DEG, START_DEG + (currentValue / 100) * SWEEP_DEG)}
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth={strokeW + 5}
              strokeLinecap="round"
              opacity={0.28}
            />
            <path
              d={arcPath(cx, cy, arcR, START_DEG, START_DEG + (currentValue / 100) * SWEEP_DEG)}
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth={strokeW}
              strokeLinecap="round"
            />
          </>
        )}

        {/* Radial Tick Marks */}
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.outer.x}
            y1={t.outer.y}
            x2={t.inner.x}
            y2={t.inner.y}
            stroke={t.pct <= currentValue / 100 ? 'var(--text, #FFFFFF)' : 'var(--chart-grid, rgba(255,255,255,0.2))'}
            strokeWidth={t.isMajor ? 1.5 : 0.8}
            opacity={t.isMajor ? 0.9 : 0.4}
          />
        ))}

        {/* Scale labels (0, 50, 100) — positioned clearly at respective angles */}
        {/* 0% (Bottom Left) */}
        {(() => {
          const p = polarToXY(cx, cy, arcR - strokeW - 14, START_DEG);
          return (
            <text x={p.x - 2} y={p.y + 4} textAnchor="end" fill="var(--text-sub, rgba(255,255,255,0.4))" fontSize="8.5" fontFamily="monospace" fontWeight="700">
              0%
            </text>
          );
        })()}

        {/* 50% (Top Center) */}
        {(() => {
          const p = polarToXY(cx, cy, arcR - strokeW - 14, 270);
          return (
            <text x={p.x} y={p.y + 2} textAnchor="middle" fill="var(--text-sub, rgba(255,255,255,0.5))" fontSize="8.5" fontFamily="monospace" fontWeight="700">
              50
            </text>
          );
        })()}

        {/* 100% (Bottom Right) */}
        {(() => {
          const p = polarToXY(cx, cy, arcR - strokeW - 14, END_DEG);
          return (
            <text x={p.x + 2} y={p.y + 4} textAnchor="start" fill="var(--text-sub, rgba(255,255,255,0.4))" fontSize="8.5" fontFamily="monospace" fontWeight="700">
              100%
            </text>
          );
        })()}

        {/* Laser Needle Body (Tapered polygon with zero-compute halo) */}
        <polygon
          points={`${needleTip.x},${needleTip.y} ${needleBase1.x},${needleBase1.y} ${needleTail.x},${needleTail.y} ${needleBase2.x},${needleBase2.y}`}
          fill={needleColor}
          opacity={0.35}
        />
        <polygon
          points={`${needleTip.x},${needleTip.y} ${needleBase1.x},${needleBase1.y} ${needleTail.x},${needleTail.y} ${needleBase2.x},${needleBase2.y}`}
          fill={needleColor}
        />
        <line
          x1={needleTail.x}
          y1={needleTail.y}
          x2={needleTip.x}
          y2={needleTip.y}
          stroke="var(--text, #FFFFFF)"
          strokeWidth={0.8}
          opacity={0.8}
        />

        {/* Center Pivot Titanium Cap */}
        <circle cx={cx} cy={cy} r={7} fill="var(--surface-1, #111622)" stroke={needleColor} strokeWidth={1.8} />
        <circle cx={cx} cy={cy} r={2.5} fill="var(--text, #FFFFFF)" />

        {/* ── Main Stat Value (78%) ── */}
        <text
          x={cx}
          y={cy + 34}
          textAnchor="middle"
          fill="var(--text, #FFFFFF)"
          fontSize={28}
          fontWeight="900"
          fontFamily="sans-serif"
          style={{ letterSpacing: '-0.5px', ...landingStyle }}
        >
          {displayValue}
        </text>

        {/* ── Metric Label (HIỆU SUẤT) ── */}
        <text
          x={cx}
          y={cy + 52}
          textAnchor="middle"
          fill="var(--text-sub, rgba(255,255,255,0.6))"
          fontSize={10.5}
          fontFamily="sans-serif"
          fontWeight="700"
          letterSpacing="1.8"
        >
          {data.label || 'HIỆU SUẤT'}
        </text>
      </svg>
    </div>
    </RemotionElementWrapper>
  );
};
