import { RemotionElementWrapper } from '../core/RemotionElementWrapper';
import React, { useMemo } from 'react';
import { Easing, spring } from 'remotion';
import { ElementProps } from '../types';
import { getGlassmorphicStyle, getBadgeStyle, getTypographyStyle } from '../../utils/design-tokens';
import { getLandingEnvelope, getLandingTransformStyle } from '../../utils/landingFx';
import { readableTint } from '../../utils/rich-text-parser';

/** Màu series dùng làm CHỮ: pha 40% --text để đạt ≥ 4.5:1 trên nền card ở mọi palette */

export const PieChartElement: React.FC<ElementProps & { frame: number, fps: number, delayFrames: number, durFrames: number }> = ({ el, computedStyle, positionStyle, frame, fps, delayFrames = 0, durFrames = 45 }) => {
  const w = el.width || 336;
  const accent = el.accentColor || 'var(--accent, #BEFF01)';
  const radius = el.radius !== undefined ? el.radius : 16;
  const variant = el.variant || 'donut';
  const isCompact = variant === 'compact';

  // 1. Data Normalization
  const rawData = el.chartData && Array.isArray(el.chartData) && el.chartData.length > 0
    ? el.chartData
    : [
        { label: 'Mobile App', value: 45 },
        { label: 'Desktop Web', value: 35 },
        { label: 'Tablet & Khác', value: 20 }
      ];

  // 2. Token Engine Styles
  const baseGlassStyle = getGlassmorphicStyle({
    accentColor: accent,
    radius,
    customBg: el.bgColor,
    padding: isCompact ? '10px 14px' : '14px 16px',
  });

  const progress = Math.min(1, Math.max(0, (frame - delayFrames) / (durFrames || 45)));
  const easeProgress = Easing.out(Easing.cubic)(progress);

  // 3. Memoize Geometry & Donut Slice Paths (Tính 1 lần, tối ưu 60FPS)
  const { total, chartSize, cx, cy, outerRadius, innerRadius, midRadius, preparedData } = useMemo(() => {
    const sum = rawData.reduce((acc, d) => acc + (Number(d.value) || 0), 0) || 1;
    const size = isCompact ? 130 : 150;
    const center = size / 2;
    const oR = size * 0.46;
    const iR = size * 0.26;
    const mR = (oR + iR) / 2;

    const prepared = rawData.map((d, idx) => {
      const val = Number(d.value) || 0;
      const pct = val / sum;
      const color = d.color || (idx === 0 ? 'var(--chart-series-1, #00FF88)' : idx === 1 ? 'var(--chart-series-2, #00D4FF)' : idx === 2 ? 'var(--chart-series-3, #FFB800)' : idx === 3 ? 'var(--chart-series-4, #FF3366)' : 'var(--chart-series-5, #BEFF01)');
      return {
        label: d.label || `Mục ${idx + 1}`,
        value: val,
        pct,
        color,
      };
    });

    return {
      total: sum,
      chartSize: size,
      cx: center,
      cy: center,
      outerRadius: oR,
      innerRadius: iR,
      midRadius: mR,
      preparedData: prepared,
    };
  }, [rawData, isCompact]);

  // Generate dynamic slices along eased progress
  let startAngle = -Math.PI / 2;
  const slices = preparedData.map((d) => {
    const currentPct = d.pct * easeProgress;
    const sliceAngle = currentPct * Math.PI * 2;
    const endAngle = startAngle + sliceAngle;

    const x1 = cx + outerRadius * Math.cos(startAngle);
    const y1 = cy + outerRadius * Math.sin(startAngle);
    const x2 = cx + outerRadius * Math.cos(endAngle);
    const y2 = cy + outerRadius * Math.sin(endAngle);

    const ix1 = cx + innerRadius * Math.cos(endAngle);
    const iy1 = cy + innerRadius * Math.sin(endAngle);
    const ix2 = cx + innerRadius * Math.cos(startAngle);
    const iy2 = cy + innerRadius * Math.sin(startAngle);

    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
    const midAngle = startAngle + sliceAngle / 2;
    const labelX = cx + midRadius * Math.cos(midAngle);
    const labelY = cy + midRadius * Math.sin(midAngle);

    const pathData = currentPct > 0.001
      ? `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${ix2} ${iy2} Z`
      : '';

    startAngle = endAngle;

    return {
      ...d,
      pathData,
      labelX,
      labelY,
      currentPct,
    };
  });

  const legendOpacity = easeProgress > 0.2 ? Math.min(1, (easeProgress - 0.2) / 0.8) : 0;

  // Landing punch / glow envelope when chart finish filling
  const completionFrame = delayFrames + (durFrames || 45);
  const landing = getLandingEnvelope(frame, completionFrame, 12);
  const landingStyle = getLandingTransformStyle(landing, el.landingFx || 'none', accent);

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      <div style={{ ...baseGlassStyle,
        width: w,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        boxSizing: 'border-box',
        gap: isCompact ? 6 : 8,
      }}
    >
      {/* Header */}
      <div 
        style={{ 
          width: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          borderBottom: '1px solid var(--border)', 
          paddingBottom: 6,
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', minWidth: 0 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
            <path d="M22 12A10 10 0 0 0 12 2v10z" />
          </svg>
          <span style={{ 
            ...getTypographyStyle({ fontSize: isCompact ? 11 : 12, fontWeight: 800, color: 'var(--chart-label, var(--text))', fontFamily: el.fontFamily || 'Be Vietnam Pro' }),
            letterSpacing: 0.3, 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            flex: 1,
          }}>
            {el.content || 'CƠ CẤU PHÂN BỔ THỊ PHẦN'}
          </span>
        </div>
      </div>

      {/* Donut Body */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 2, boxSizing: 'border-box' }}>
        <div style={{ width: chartSize, height: chartSize, position: 'relative', flexShrink: 0, ...landingStyle }}>
          <svg 
            width={chartSize} 
            height={chartSize} 
            style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
          >
            {slices.map((s, i) => (
              <g key={i}>
                {s.pathData && (
                  <path 
                    d={s.pathData} 
                    fill={s.color} 
                    stroke="var(--card-bg, rgba(10,12,18,0.9))" 
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />
                )}
                {/* Percentage on Slice */}
                {/* Chip nền card dưới % trên lát: màu series không đảm bảo tương phản với chữ */}
                {s.currentPct >= 0.12 && (
                  <rect
                    x={s.labelX - (s.currentPct > 0.25 ? 14 : 11.5)}
                    y={s.labelY - (s.currentPct > 0.25 ? 7.5 : 6.5)}
                    width={s.currentPct > 0.25 ? 28 : 23}
                    height={s.currentPct > 0.25 ? 15 : 13}
                    rx={s.currentPct > 0.25 ? 7.5 : 6.5}
                    fill="var(--card-bg, rgba(10, 14, 24, 0.9))"
                    style={{ opacity: easeProgress > 0.3 ? (easeProgress - 0.3) * 1.5 : 0 }}
                  />
                )}
                {s.currentPct >= 0.12 && (
                  <text 
                    x={s.labelX} 
                    y={s.labelY} 
                    fill="var(--text, #FFFFFF)" 
                    fontSize={s.currentPct > 0.25 ? '11' : '9'} 
                    fontWeight="900"
                    fontFamily="Inter, sans-serif" 
                    textAnchor="middle"
                    dominantBaseline="central"
                    style={{ 
                      opacity: easeProgress > 0.3 ? (easeProgress - 0.3) * 1.5 : 0
                    }}
                  >
                    {Math.round(s.currentPct * 100)}%
                  </text>
                )}
              </g>
            ))}
          </svg>

          {/* Center Core Pill */}
          <div 
            style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)', 
              width: innerRadius * 2 - 4, 
              height: innerRadius * 2 - 4, 
              borderRadius: '50%', 
              backgroundColor: 'var(--card-bg, rgba(10, 14, 24, 0.95))',
              border: '1.5px solid var(--border, rgba(255,255,255,0.12))',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.4)'
            }}
          >
            <span style={{ fontSize: '9px', color: 'var(--text-sub, rgba(255,255,255,0.5))', fontWeight: 700, fontFamily: 'Inter' }}>TỔNG</span>
            <span style={{ fontSize: '12px', color: 'var(--chart-value, var(--text))', fontWeight: 900, fontFamily: 'Inter', lineHeight: 1 }}>100%</span>
          </div>
        </div>

        {/* Legend Grid (Full Width & Safe Zone) */}
        <div 
          style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            justifyContent: 'center', 
            alignItems: 'center',
            gap: '6px 8px', 
            width: '100%', 
            marginTop: isCompact ? 6 : 8,
            opacity: legendOpacity,
            boxSizing: 'border-box',
          }}
        >
          {preparedData.map((s, idx) => (
            <div 
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'var(--surface-1, rgba(255, 255, 255, 0.05))',
                border: `1px solid color-mix(in srgb, ${s.color} 30%, transparent)`,
                borderRadius: 14,
                padding: '3px 8px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                boxSizing: 'border-box'
              }}
            >
              <div 
                style={{ 
                  width: 7, 
                  height: 7, 
                  borderRadius: '50%', 
                  backgroundColor: s.color, 
                  boxShadow: `0 0 6px ${s.color}` 
                }} 
              />
              <span 
                style={{ 
                  fontSize: 10.5, 
                  color: 'var(--chart-label, var(--text))', 
                  fontWeight: 600, 
                  fontFamily: el.fontFamily || 'Be Vietnam Pro',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: 90
                }}
              >
                {s.label}
              </span>
              <span 
                style={{ 
                  fontSize: 11, 
                  color: readableTint(s.color), 
                  fontWeight: 900, 
                  fontFamily: 'Inter, sans-serif' 
                }}
              >
                {Math.round(s.pct * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
    </RemotionElementWrapper>
  );
};
