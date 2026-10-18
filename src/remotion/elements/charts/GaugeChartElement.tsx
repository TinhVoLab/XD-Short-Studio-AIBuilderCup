import { RemotionElementWrapper } from '../core/RemotionElementWrapper';
import React, { useMemo } from 'react';
import { Easing } from 'remotion';
import { ElementProps } from '../types';
import { mixColor } from '../../utils/rich-text-parser';
import { useCountUp } from '../../hooks/useCountUp';

export const GaugeChartElement: React.FC<ElementProps & { frame: number, fps: number, delayFrames: number, durFrames: number }> = ({ el, computedStyle, positionStyle, frame, fps, delayFrames = 0, durFrames = 45 }) => {
  const containerWidth = el.width || 260;
  const color = el.accentColor || '#FF5544';
  const targetPct = el.percent ?? 85;
  const title = (el.content !== undefined && el.content !== null) ? String(el.content).trim() : '';
  const hasTitle = Boolean(title);
  const label = (el.statLabel || '').trim();
  const hasLabel = Boolean(label);

  // 1. Memoize Geometry & Scale Ticks
  const { cx, cy, radius, needleLength, circumference, ticks } = useMemo(() => {
    const center = containerWidth / 2;
    const centerY = containerWidth * 0.46;
    const r = containerWidth * 0.36;
    const nLen = r * 0.80;
    const circ = Math.PI * r;

    // Major & Minor tick positions (every 10%)
    const tickValues = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const tickList = tickValues.map(pct => {
      const isMajor = pct % 20 === 0;
      const isRedline = pct >= 80;
      const rad = ((-180 + (pct / 100) * 180) * Math.PI) / 180;
      const tickLen = isMajor ? 8 : 4;
      const innerX = center + (r - tickLen) * Math.cos(rad);
      const innerY = centerY + (r - tickLen) * Math.sin(rad);
      const outerX = center + (r + 4) * Math.cos(rad);
      const outerY = centerY + (r + 4) * Math.sin(rad);
      const textX = center + (r + 16) * Math.cos(rad);
      const textY = centerY + (r + 16) * Math.sin(rad);
      return { pct, isMajor, isRedline, innerX, innerY, outerX, outerY, textX, textY };
    });

    return {
      cx: center,
      cy: centerY,
      radius: r,
      needleLength: nLen,
      circumference: circ,
      ticks: tickList,
    };
  }, [containerWidth]);

  // 2. Physical Needle Mechanics (Retains athletic overshoot bounce)
  const needleLinear = Math.min(1, Math.max(0, (frame - delayFrames) / (durFrames || 45)));
  const needleEase = Easing.out(Easing.back(1.4))(needleLinear);
  const needlePct = Math.max(0, Math.min(100, targetPct * needleEase));
  // Needle points: -90deg is LEFT (0%), 0deg is UP (50%), +90deg is RIGHT (100%)
  const angleDeg = -90 + (needlePct / 100) * 180;
  const strokeDashoffset = circumference - (needlePct / 100) * circumference;
  const cardOpacity = needleEase > 0.2 ? Math.min(1, (needleEase - 0.2) / 0.8) : 0;

  // 3. Monotonic Text CountUp & Landing Punch
  const countResult = useCountUp(`${targetPct}`, {
    fps,
    frame,
    delayFrames,
    durFrames,
    mode: 'timed',
    easing: Easing.out(Easing.cubic),
    landingFx: el.landingFx || 'none',
    accentColor: color,
  });

  const headerH = hasTitle ? 32 : 0;

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      <div 
        style={{ 
          width: containerWidth, 
          position: 'relative', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          backgroundColor: el.showCardBg ? (el.bgColor || 'var(--card-bg, rgba(14, 18, 28, 0.94))') : 'transparent',
          border: el.showCardBg ? `1px solid ${mixColor(color, 27)}` : 'none',
          borderRadius: el.radius !== undefined ? el.radius : 16,
          boxShadow: el.showCardBg ? `var(--shadow-md, 0 8px 32px rgba(0,0,0,0.5)), 0 0 20px ${mixColor(color, 8)}` : 'none',
          boxSizing: 'border-box',
          overflow: 'hidden',
          paddingBottom: el.showCardBg ? 12 : 0,
        }}
      >
        {/* Header Bar (Chỉ hiển thị khi có tiêu đề) */}
        {hasTitle && (
          <div 
            style={{
              width: '100%',
              height: headerH,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '0 14px',
              borderBottom: '1px solid var(--border)',
              boxSizing: 'border-box',
              marginBottom: 4,
            }}
          >
            {/* Clean SVG Miniature Gauge Icon */}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M12 2v4M4.93 4.93l2.83 2.83M2 12h4M22 12h-4M19.07 4.93l-2.83 2.83" />
              <circle cx="12" cy="12" r="9" />
              <path d="M12 12l3-5" />
            </svg>
            <span style={{
              fontSize: 11,
              fontWeight: 800,
              color: 'var(--chart-label, var(--text))',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flex: 1,
              fontFamily: el.fontFamily || 'Be Vietnam Pro',
            }}>
              {title}
            </span>
          </div>
        )}

        {/* 1. Gauge Speedometer Arc & Mechanical Needle */}
        <div style={{ width: containerWidth, height: cy + 18, position: 'relative', overflow: 'visible' }}>
          <svg 
            width={containerWidth} 
            height={cy + 18} 
            style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
          >
            <defs>
              {/* Dynamic Speed Gradient */}
              <linearGradient id={`gauge-grad-${el.id || 'default'}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--chart-series-2, #00D4FF)" />
                <stop offset="50%" stopColor="var(--chart-series-1, #BEFF01)" />
                <stop offset="80%" stopColor="var(--chart-warning, #FF9500)" />
                <stop offset="100%" stopColor="var(--chart-negative, #FF3B30)" />
              </linearGradient>
            </defs>

            {/* Scale Ticks & Number Labels */}
            {ticks.map((t, idx) => (
              <g key={idx} opacity={t.isMajor ? 0.85 : 0.45}>
                <line 
                  x1={t.innerX} 
                  y1={t.innerY} 
                  x2={t.outerX} 
                  y2={t.outerY} 
                  stroke={t.isRedline ? 'var(--chart-negative, #FF3B30)' : 'var(--chart-axis, rgba(255,255,255,0.7))'} 
                  strokeWidth={t.isMajor ? 1.8 : 1} 
                />
                {t.isMajor && (
                  <text 
                    x={t.textX} 
                    y={t.textY} 
                    // Vùng đỏ thể hiện qua vạch + cung màu; số dùng màu nhãn để đủ tương phản (negative chỉ đạt 3:1)
                    fill="var(--chart-label, var(--text-sub))"
                    fontSize="8.5" 
                    fontWeight="800" 
                    fontFamily="Inter, sans-serif" 
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {t.pct}
                  </text>
                )}
              </g>
            ))}

            {/* 1.1 Base Track Arc (Mờ đệm) */}
            <path 
              d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
              fill="none" 
              stroke="var(--chart-grid, rgba(255,255,255,0.08))" 
              strokeWidth="12" 
              strokeLinecap="round"
            />

            {/* 1.2 Active Gauge Arc (Zero Compute Halo + Đoạn đo) */}
            <path 
              d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
              fill="none" 
              stroke={`url(#gauge-grad-${el.id || 'default'})`} 
              strokeWidth="16" 
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              opacity="0.25"
            />
            <path 
              d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
              fill="none" 
              stroke={`url(#gauge-grad-${el.id || 'default'})`} 
              strokeWidth="12" 
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />

            {/* 1.3 Aerodynamic Needle & Metal Pivot Hub */}
            <g 
              style={{ 
                transform: `rotate(${angleDeg}deg)`, 
                transformOrigin: `${cx}px ${cy}px`,
              }}
            >
              {/* Needle Shadow */}
              <polygon 
                points={`${cx - 3.5},${cy} ${cx + 3.5},${cy} ${cx},${cy - needleLength}`} 
                fill="rgba(0,0,0,0.5)" 
                style={{ transform: 'translate(2px, 2px)' }}
              />
              {/* Needle Body (White Titanium) */}
              <polygon 
                points={`${cx - 3.5},${cy} ${cx + 3.5},${cy} ${cx},${cy - needleLength}`} 
                fill="var(--text, #FFFFFF)" 
              />
              {/* Needle Tip Indicator */}
              <circle 
                cx={cx} 
                cy={cy - needleLength + 2} 
                r="4" 
                fill={color}
                opacity={0.35}
              />
              <circle 
                cx={cx} 
                cy={cy - needleLength + 2} 
                r="2.5" 
                fill={color} 
              />
              {/* Center Pivot Hub */}
              <circle cx={cx} cy={cy} r="8" fill="var(--surface, #0A101C)" stroke={color} strokeWidth="2.5" />
              <circle cx={cx} cy={cy} r="3" fill="var(--text, #FFFFFF)" />
            </g>
          </svg>
        </div>

        {/* 2. Digital HUD Readout Pill (Khoang số nổi riêng biệt) */}
        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: 'var(--surface-1, rgba(12, 19, 32, 0.95))',
            border: `1px solid ${mixColor(color, 33)}`,
            borderRadius: 14,
            padding: hasLabel ? '5px 18px 6px' : '4px 18px',
            boxShadow: `0 4px 16px rgba(0,0,0,0.45)`,
            marginTop: -6,
            opacity: cardOpacity,
            transform: `scale(${0.9 + cardOpacity * 0.1})`,
            zIndex: 2,
            boxSizing: 'border-box'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, ...countResult.landingStyle }}>
            <span 
              style={{ 
                fontSize: 26, 
                fontWeight: 900, 
                color: 'var(--chart-label, var(--text))', 
                fontFamily: 'Be Vietnam Pro, sans-serif', 
                lineHeight: 1,
                textShadow: `0 0 12px ${mixColor(color, 53)}`
              }}
            >
              {countResult.displayValue}
            </span>
            <span 
              style={{ 
                fontSize: 13, 
                fontWeight: 800, 
                color: color, 
                fontFamily: 'Be Vietnam Pro, sans-serif' 
              }}
            >
              %
            </span>
          </div>
          
          {hasLabel && (
            <span 
              style={{ 
                fontSize: 9, 
                fontWeight: 700, 
                color: 'var(--chart-axis, rgba(255,255,255,0.7))', 
                fontFamily: el.fontFamily || 'Inter, sans-serif', 
                letterSpacing: 1.2, 
                textTransform: 'uppercase',
                marginTop: 2,
                whiteSpace: 'nowrap'
              }}
            >
              {label}
            </span>
          )}
        </div>
      </div>
    </RemotionElementWrapper>
  );
};
