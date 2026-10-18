import { RemotionElementWrapper } from '../core/RemotionElementWrapper';
import React, { useMemo } from 'react';
import { ElementProps } from '../types';
import { useCountUp } from '../../hooks/useCountUp';
import { mixColor } from '../../utils/rich-text-parser';
import { ELEMENT_BOX_SPECS } from '@/config/layoutRegistry';

const CIRCLE_SPEC = ELEMENT_BOX_SPECS['circle-chart'];

export const CircleChartElement: React.FC<ElementProps & { 
  frame: number, 
  fps: number, 
  delayFrames?: number, 
  durFrames?: number, 
  content?: string 
}> = ({ 
  el, 
  computedStyle, positionStyle, frame, 
  fps, 
  delayFrames = 0, 
  durFrames = 45, 
  content 
}) => {
  const size = el.width || 140;
  const strokeW = el.strokeWidth || Math.max(8, Math.round(size * 0.085));
  const accentColor = el.accentColor || 'var(--accent, #00FF88)';
  const targetPct = el.percent !== undefined ? el.percent : 85;
  const labelText = content || el.statLabel || el.content || 'TIẾN ĐỘ';
  const labelDrop = Math.max(CIRCLE_SPEC.labelExtraMin, Math.round(size * CIRCLE_SPEC.labelExtraRatio));

  const radius = (size - strokeW * 2) / 2;
  const circumference = radius * 2 * Math.PI;
  const cx = size / 2;
  const cy = size / 2;

  // 1. Live CountUp Animation with Spring Physics
  const { currentNumber, displayValue, landingStyle } = useCountUp(`${targetPct}%`, {
    frame,
    fps,
    delayFrames,
    durFrames,
    landingFx: el.landingFx || 'none',
    accentColor,
  });
  const currentPct = Math.min(100, Math.max(0, currentNumber));

  // 60FPS Geometry calculations
  const { strokeDashoffset, tipX, tipY, tipAngle } = useMemo(() => {
    const offset = circumference - (currentPct / 100) * circumference;
    // Tip angle in radians (-90deg is top)
    const angle = (currentPct / 100) * (Math.PI * 2) - Math.PI / 2;
    const tx = cx + Math.cos(angle) * radius;
    const ty = cy + Math.sin(angle) * radius;

    return {
      strokeDashoffset: offset,
      tipX: tx,
      tipY: ty,
      tipAngle: angle,
    };
  }, [circumference, currentPct, cx, cy, radius]);

  const gradId = `circle-grad-${el.id || 'def'}`;

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      {/* Khung ngoài bao cả nhãn treo dưới vòng (= calculateElementDynamicHeight) để canvas & va chạm tính đúng */}
      <div style={{ width: size, height: labelText ? size + labelDrop + CIRCLE_SPEC.labelMargin : size }}>
      <div style={{ width: size,
        height: size,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        width={size}
        height={size}
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'visible',
          pointerEvents: 'none',
        }}
      >
        <defs>
          {/* Gradient for Progress Arc */}
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={accentColor} />
            <stop offset="100%" stopColor="var(--chart-series-2, #00D4FF)" />
          </linearGradient>
        </defs>

        {/* 1. Outer Subtle Halo Track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius + strokeW * 0.7}
          fill="none"
          stroke="var(--chart-grid, rgba(255, 255, 255, 0.04))"
          strokeWidth="1"
          strokeDasharray="4 4"
        />

        {/* 2. Background Track Ring */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="color-mix(in srgb, var(--surface) 60%, transparent)"
          stroke="var(--chart-axis, rgba(255, 255, 255, 0.08))"
          strokeWidth={strokeW}
        />

        {/* 3. Animated Progress Ring (Zero compute halo + main stroke) */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={strokeW + 4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${cx} ${cy})`}
          opacity={0.25}
        />
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${cx} ${cy})`}
        />

        {/* 4. Glowing Leading Tip Dot */}
        {currentPct > 3 && (
          <g>
            <circle
              cx={tipX}
              cy={tipY}
              r={strokeW * 0.6}
              fill={accentColor}
              opacity="0.35"
            />
            {/* Halo circle replacing drop-shadow */}
            <circle
              cx={tipX}
              cy={tipY}
              r={strokeW * 0.7}
              fill={accentColor}
              opacity={0.3}
            />
            <circle
              cx={tipX}
              cy={tipY}
              r={strokeW * 0.35}
              fill="var(--text, #FFFFFF)"
            />
          </g>
        )}
      </svg>

      {/* 5. Center Typography (Percentage Number Only) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            fontSize: Math.round(size * 0.28),
            fontWeight: 900,
            // Nền đĩa là --surface 60% (màu thương hiệu đậm ở theme tối) → chữ --text, không dùng accent
            color: 'var(--text, #FFFFFF)',
            fontFamily: 'Be Vietnam Pro, sans-serif',
            lineHeight: 1,
            letterSpacing: -0.5,
            ...landingStyle,
          }}
        >
          {displayValue}
        </span>
      </div>

      {/* 6. External Bottom Label Capsule (Spaced comfortably below the ring) */}
      {labelText && (
        <div
          style={{
            position: 'absolute',
            bottom: -labelDrop,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <span
            style={{
              fontSize: Math.max(9.5, Math.round(size * 0.082)),
              fontWeight: 800,
              color: el.accentColor ? `color-mix(in srgb, ${accentColor} 60%, var(--text))` : accentColor,
              backgroundColor: 'var(--card-bg, rgba(10, 16, 28, 0.95))',
              border: `1px solid ${mixColor(accentColor, 40)}`,
              boxShadow: 'var(--shadow-md, 0 4px 14px rgba(0,0,0,0.7))',
              padding: '3px 12px',
              borderRadius: 20,
              fontFamily: 'Be Vietnam Pro, sans-serif',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}
          >
            {labelText}
          </span>
        </div>
      )}
    </div>
    </div>
    </RemotionElementWrapper>
  );
};
