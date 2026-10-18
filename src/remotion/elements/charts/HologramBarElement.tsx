import { RemotionElementWrapper } from '../core/RemotionElementWrapper';
import React, { useMemo } from 'react';
import { Easing, spring, useVideoConfig } from 'remotion';
import { ElementProps } from '../types';
import { HologramBarData } from '@/types/scene';

export const HologramBarElement: React.FC<ElementProps & { frame: number; fps: number; delayFrames?: number; durFrames?: number }> = ({
  el, computedStyle, positionStyle, frame, delayFrames = 0, durFrames = 50,
}) => {
  const { fps } = useVideoConfig();
  const data: HologramBarData = el.hologramBarData || {
    title: 'HỆ THỐNG XUNG LỰC',
    accentColor: 'var(--accent, #BEFF01)',
    showScanline: true,
    bars: [
      { label: 'GPU CLUSTER', value: 85, color: 'var(--chart-series-1, #00D4FF)', sub: '92 TFLOPS' },
      { label: 'NEURAL CHIP', value: 92, color: 'var(--chart-series-2, #BEFF01)', sub: '128 TOPS' },
      { label: 'QUANTUM BUS', value: 64, color: 'var(--chart-series-3, #FF2D78)', sub: '4.8 GB/s' },
    ]
  };

  const title = String(data.title ?? el.title ?? '').trim();
  const hasTitle = Boolean(title);
  const showCardBg = el.showCardBg !== false && (data as any).showCardBg !== false;

  const w = el.width || 320;
  const h = el.height || 240;

  const accentColor = data.accentColor || 'var(--accent, #BEFF01)';
  const bars = data.bars || [];

  const progress = Math.min(1, Math.max(0, (frame - delayFrames) / durFrames));
  const eased = Easing.out(Easing.back(1.2))(progress);

  const padH = showCardBg ? 28 : 12;
  const padV = showCardBg ? 20 : 8;
  const headerH = hasTitle ? 32 : 0;
  const svgW = Math.max(100, w - padH);
  const svgH = Math.max(60, h - padV - headerH);
  const baseY = svgH - 35;
  const maxBarHeight = Math.max(20, baseY - 25);
  const count = Math.max(1, bars.length);
  const barWidth = Math.min(38, Math.max(20, (svgW / count) * 0.42));

  // Upward holographic floating particles
  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 12; i++) {
      const pProgress = ((frame * 0.7 + i * 15) % 100) / 100;
      const px = 10 + ((i * 47) % (svgW - 20));
      const py = baseY - pProgress * (maxBarHeight + 15);
      const alpha = Math.sin(pProgress * Math.PI) * 0.6;
      arr.push({ x: px, y: py, alpha, size: 1.5 + (i % 3) * 0.8 });
    }
    return arr;
  }, [svgW, baseY, maxBarHeight, frame]);

  // Scanline Y position
  const scanlineY = (hasTitle ? 35 : 10) + ((frame * 1.8) % (h - 20));

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      <div
        style={{
          width: w,
          height: h,
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          position: 'relative',
          background: showCardBg ? 'var(--surface-1, rgba(6, 12, 22, 0.94))' : 'transparent',
          border: showCardBg ? '1px solid var(--border, rgba(0, 212, 255, 0.25))' : 'none',
          borderRadius: showCardBg ? 14 : 0,
          boxShadow: showCardBg ? 'var(--shadow-md, 0 8px 32px rgba(0, 0, 0, 0.7)), inset 0 0 20px rgba(0, 212, 255, 0.04)' : 'none',
          overflow: 'hidden',
          padding: showCardBg ? '10px 14px' : '4px 6px',
        }}
      >
        {/* Laser Scanline Beam */}
        {data.showScanline !== false && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: scanlineY,
              height: 2,
              background: 'linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.6), rgba(190, 255, 1, 0.8), rgba(0, 212, 255, 0.6), transparent)',
              boxShadow: '0 0 8px #00D4FF, 0 0 16px rgba(0, 212, 255, 0.5)',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Dynamic Header Bar (Ẩn khi không có tiêu đề) */}
        {hasTitle && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))',
              paddingBottom: 6,
              marginBottom: 8,
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* SVG Lightning Vector Icon */}
              <svg width="13" height="13" viewBox="0 0 24 24" fill={accentColor} stroke={accentColor} strokeWidth="1">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: 'var(--text, #FFFFFF)',
                  letterSpacing: '0.08em',
                }}
              >
                {title}
              </span>
            </div>

            <div
              style={{
                fontSize: 8.5,
                fontWeight: 800,
                color: 'var(--text-sub)',
                fontFamily: 'monospace',
                background: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
                border: `1px solid color-mix(in srgb, ${accentColor} 30%, transparent)`,
                padding: '2px 6px',
                borderRadius: 4,
                letterSpacing: '0.06em',
              }}
            >
              3D ISO
            </div>
          </div>
        )}

      {/* SVG Canvas for 3D Isometric Cylinders */}
      <svg width={svgW} height={svgH} style={{ overflow: 'visible', width: '100%', flex: 1, display: 'block' }}>
        <defs>
          {bars.map((b, idx) => {
            const barCol = b.color || '#00D4FF';
            return (
              <linearGradient key={idx} id={`h-grad-${el.id}-${idx}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={barCol} stopOpacity="0.4" />
                <stop offset="40%" stopColor={barCol} stopOpacity="0.9" />
                <stop offset="100%" stopColor={barCol} stopOpacity="0.3" />
              </linearGradient>
            );
          })}
        </defs>

        {/* Ambient Grid lines */}
        <line x1="0" y1={baseY} x2={svgW} y2={baseY} stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="4 4" />

        {/* Floating energy particles */}
        {particles.map((p, idx) => (
          <circle key={idx} cx={p.x} cy={p.y} r={p.size} fill="#00D4FF" opacity={p.alpha} />
        ))}

        {/* 3D Holographic Bars */}
        {bars.map((b, idx) => {
          const cx = (svgW / count) * (idx + 0.5);
          const barCol = b.color || '#00D4FF';

          const targetH = ((b.value || 50) / 100) * maxBarHeight;
          const currentH = Math.max(12, targetH * eased);
          const topY = baseY - currentH;

          const rx = barWidth / 2;
          const ry = rx * 0.35;

          return (
            <g key={idx}>
              {/* Base Ellipse Reflection */}
              <ellipse cx={cx} cy={baseY} rx={rx + 4} ry={ry + 2} fill={barCol} opacity="0.2" />
              <ellipse cx={cx} cy={baseY} rx={rx} ry={ry} fill="var(--surface-1, #060A14)" stroke={barCol} strokeWidth="1.5" />

              {/* Cylinder Body */}
              <rect
                x={cx - rx}
                y={topY}
                width={barWidth}
                height={currentH}
                fill={`url(#h-grad-${el.id}-${idx})`}
                opacity="0.85"
              />

              {/* Segment Horizontal Glow Lines on Cylinder */}
              {Array.from({ length: 4 }).map((_, sIdx) => {
                const segY = baseY - (currentH / 4) * (sIdx + 1);
                if (segY <= topY) return null;
                return (
                  <ellipse
                    key={sIdx}
                    cx={cx}
                    cy={segY}
                    rx={rx}
                    ry={ry}
                    fill="none"
                    stroke="var(--text, #FFFFFF)"
                    strokeWidth="0.8"
                    opacity="0.4"
                  />
                );
              })}

              {/* Top Cap Ellipse */}
              <ellipse
                cx={cx}
                cy={topY}
                rx={rx}
                ry={ry}
                fill={barCol}
                stroke="var(--text, #FFFFFF)"
                strokeWidth="1.5"
                opacity="0.95"
              />

              {/* Percentage Floating Readout Badge */}
              <g transform={`translate(${cx}, ${topY - 14})`}>
                <rect
                  x="-16"
                  y="-8"
                  width="32"
                  height="14"
                  rx="4"
                  fill="var(--surface-2, rgba(6, 13, 24, 0.9))"
                  stroke={barCol}
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y="2.5"
                  textAnchor="middle"
                  fill="var(--text, #FFFFFF)"
                  fontSize="8.5"
                  fontWeight="900"
                >
                  {Math.round(b.value * eased)}%
                </text>
              </g>

              {/* Bottom Labels */}
              <text
                x={cx}
                y={baseY + 16}
                textAnchor="middle"
                fill="var(--text, #FFFFFF)"
                fontSize="8.5"
                fontWeight="800"
                opacity="0.9"
              >
                {b.label}
              </text>
              {b.sub && (
                <text
                  x={cx}
                  y={baseY + 27}
                  textAnchor="middle"
                  fill="var(--text-sub)"
                  fontSize="7"
                  fontWeight="600"
                  fontFamily="monospace"
                >
                  {b.sub}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
    </RemotionElementWrapper>
  );
};
