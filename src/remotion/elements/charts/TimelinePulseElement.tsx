import { RemotionElementWrapper } from '../core/RemotionElementWrapper';
import React, { useMemo } from 'react';
import { Easing, spring, useVideoConfig } from 'remotion';
import { ElementProps } from '../types';
import { mixColor } from '../../utils/rich-text-parser';
import { TimelinePulseData } from '@/types/scene';

export const TimelinePulseElement: React.FC<ElementProps & { frame: number; fps: number; delayFrames?: number; durFrames?: number }> = ({
  el, computedStyle, positionStyle, frame, delayFrames = 0, durFrames = 50,
}) => {
  const { fps } = useVideoConfig();
  const data: TimelinePulseData = el.timelinePulseData || {
    title: 'LỘ TRÌNH ĐỘT PHÁ',
    milestones: [
      { time: '09:00', title: 'Khởi động', desc: 'Khởi chạy Core', status: 'completed' },
      { time: '12:30', title: 'Mở rộng', desc: '10,000 Nodes', status: 'completed' },
      { time: '16:00', title: 'Tối ưu', desc: 'AI Sync Live', status: 'active' },
      { time: '21:00', title: 'Đỉnh cao', desc: 'Release v2.0', status: 'pending' },
    ]
  };

  const w = el.width || 330;
  const h = el.height || 180;

  const pulseColor = data.pulseColor || el.color || 'var(--chart-series-1, #00D4FF)';
  const accentColor = data.accentColor || el.accentColor || 'var(--accent, #BEFF01)';
  const milestones = data.milestones || [];

  const trackY = 48;
  const count = milestones.length;
  const padSide = 32;
  const innerW = (w - 28) - padSide * 2;
  const spacing = count > 1 ? innerW / (count - 1) : 0;

  // Traveling ECG Electrical Pulse waveform
  const pulseX = padSide + ((frame * 2.2) % Math.max(1, innerW));

  // Active milestone radar ripple
  const activeIdx = milestones.findIndex(m => m.status === 'active');
  const activeX = activeIdx >= 0 ? padSide + activeIdx * spacing : padSide + (count - 1) * spacing;
  const radarPhase = (frame * 0.08) % 1;
  const radarR = 6 + radarPhase * 16;
  const radarAlpha = Math.max(0, 1 - radarPhase);

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      <div style={{ width: w,
      height: h,
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      position: 'relative',
      background: 'var(--surface-1, rgba(6, 12, 22, 0.94))',
      border: '1px solid var(--border, rgba(0, 212, 255, 0.25))',
      borderRadius: 14,
      boxShadow: 'var(--shadow-md, 0 8px 32px rgba(0, 0, 0, 0.7))',
      overflow: 'hidden',
      padding: '10px 14px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))',
        paddingBottom: 6,
        marginBottom: 8,
        width: '100%',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Clean SVG Trend/Pulse Icon */}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={pulseColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <span style={{
            fontSize: 11,
            fontWeight: 800,
            color: 'var(--text, #FFFFFF)',
            letterSpacing: '0.08em',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}>
            {data.title || 'LỘ TRÌNH ĐỘT PHÁ'}
          </span>
        </div>

        <div style={{
          fontSize: 8.5,
          fontWeight: 800,
          color: 'var(--text-sub)',
          fontFamily: 'monospace',
          background: mixColor(pulseColor, 8),
          border: `1px solid ${mixColor(pulseColor, 20)}`,
          padding: '2px 6px',
          borderRadius: 4,
        }}>
          PULSE TIMELINE
        </div>
      </div>

      {/* SVG Canvas for Track & ECG Pulse */}
      <svg width={w - 28} height={h - 55} style={{ overflow: 'visible', width: '100%', flex: 1 }}>
        <defs>
          <clipPath id={`tp-clip-${el.id}`}>
            <rect x={padSide - 15} y="0" width={innerW + 30} height={h} />
          </clipPath>
        </defs>

        {/* Base Track Line */}
        <line
          x1={padSide}
          y1={trackY}
          x2={padSide + innerW}
          y2={trackY}
          stroke="var(--chart-grid, rgba(255,255,255,0.12))"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Active Radar Ripple on Active Milestone */}
        {activeIdx >= 0 && (
          <circle
            cx={activeX}
            cy={trackY}
            r={radarR}
            fill="none"
            stroke={accentColor}
            strokeWidth="1.5"
            opacity={radarAlpha * 0.8}
          />
        )}

        {/* Dynamic ECG Waveform Peak traveling along the track (Zero compute halo) */}
        <g clipPath={`url(#tp-clip-${el.id})`}>
          {/* Outer glow halo */}
          <path
            d={`M ${pulseX - 25} ${trackY} 
                L ${pulseX - 10} ${trackY} 
                L ${pulseX - 5} ${trackY - 14} 
                L ${pulseX} ${trackY + 10} 
                L ${pulseX + 5} ${trackY - 8} 
                L ${pulseX + 10} ${trackY} 
                L ${pulseX + 25} ${trackY}`}
            stroke={pulseColor}
            strokeWidth="5.5"
            opacity="0.3"
            fill="none"
            strokeLinecap="round"
          />
          {/* Main crisp stroke */}
          <path
            d={`M ${pulseX - 25} ${trackY} 
                L ${pulseX - 10} ${trackY} 
                L ${pulseX - 5} ${trackY - 14} 
                L ${pulseX} ${trackY + 10} 
                L ${pulseX + 5} ${trackY - 8} 
                L ${pulseX + 10} ${trackY} 
                L ${pulseX + 25} ${trackY}`}
            stroke={pulseColor}
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
          />
        </g>

        {/* Milestone Nodes */}
        {milestones.map((m, idx) => {
          const cx = padSide + idx * spacing;
          const cy = trackY;
          const isDone = m.status === 'completed';
          const isActive = m.status === 'active';
          const nodeColor = m.color || (isDone ? 'var(--chart-positive, #00FF88)' : isActive ? accentColor : 'var(--chart-axis, rgba(255,255,255,0.3))');

          return (
            <g key={idx}>
              {/* Outer Ring */}
              <circle
                cx={cx}
                cy={cy}
                r={isActive ? 7 : 5}
                fill="var(--surface, #060A14)"
                stroke={nodeColor}
                strokeWidth={isActive ? 2.5 : 1.8}
              />

              {/* Inner Dot */}
              <circle
                cx={cx}
                cy={cy}
                r={isActive ? 3.5 : 2}
                fill={nodeColor}
              />

              {/* Top Timestamp Badge */}
              <g transform={`translate(${cx}, ${cy - 16})`}>
                <rect
                  x="-16"
                  y="-7"
                  width="32"
                  height="13"
                  rx="3"
                  fill="var(--surface-2, rgba(6, 13, 24, 0.9))"
                  stroke={nodeColor}
                  strokeWidth="0.8"
                />
                <text
                  x="0"
                  y="2"
                  textAnchor="middle"
                  fill="var(--text, #FFFFFF)"
                  fontSize="7.5"
                  fontWeight="800"
                  fontFamily="monospace"
                >
                  {m.time}
                </text>
              </g>

              {/* Bottom Title & Description */}
              <text
                x={cx}
                y={cy + 16}
                textAnchor="middle"
                fill="var(--text, #FFFFFF)"
                fontSize="8.5"
                fontWeight="800"
                fontFamily="Inter"
              >
                {m.title}
              </text>
              {m.desc && (
                <text
                  x={cx}
                  y={cy + 27}
                  textAnchor="middle"
                  fill="var(--text-sub)"
                  fontSize="7"
                  fontWeight="600"
                  fontFamily="monospace"
                >
                  {m.desc}
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
