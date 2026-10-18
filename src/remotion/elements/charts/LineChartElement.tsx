import { RemotionElementWrapper } from '../core/RemotionElementWrapper';
import React, { useMemo } from 'react';
import { Easing, spring } from 'remotion';
import { ElementProps } from '../types';
import { getGlassmorphicStyle, getBadgeStyle, getTypographyStyle } from '../../utils/design-tokens';

export const LineChartElement: React.FC<ElementProps & { frame: number, fps: number, delayFrames: number, durFrames: number }> = ({ el, computedStyle, positionStyle, frame, fps, delayFrames = 0, durFrames = 45 }) => {
  const w = el.width || 336;
  const h = el.height || 180;
  const color = el.accentColor || 'var(--chart-series-1, #00FF88)';
  const radius = el.radius !== undefined ? el.radius : 16;
  const variant = el.variant || 'smooth-curve';
  const isCompact = variant === 'compact';

  // 1. Data Normalization
  const rawData = el.chartData && el.chartData.length > 0 ? el.chartData : [
    { label: 'T1', value: 25 }, 
    { label: 'T2', value: 45 }, 
    { label: 'T3', value: 38 }, 
    { label: 'T4', value: 85 }, 
    { label: 'T5', value: 70 },
    { label: 'T6', value: 110 }
  ];

  // 2. Token Engine Styles
  const baseGlassStyle = getGlassmorphicStyle({
    accentColor: color,
    radius,
    customBg: el.bgColor,
    padding: isCompact ? '10px 12px' : '12px 14px',
  });

  const progress = Math.min(1, Math.max(0, (frame - delayFrames) / (durFrames || 45)));
  const easeProgress = Easing.out(Easing.cubic)(progress);

  const headerH = 28;
  const paddingX = 16;
  const paddingBottom = 22;
  const paddingTop = 16;
  const usableW = w - paddingX * 2;
  const graphH = h - headerH - paddingBottom - paddingTop;

  // 3. Memoize Geometry & Smooth Spline Path (Tính 1 lần, tối ưu 60FPS)
  const { points, pathD, areaD, maxVal, minVal } = useMemo(() => {
    const vals = rawData.map(d => Number(d.value) || 0);
    const rawMax = Math.max(...vals, 10);
    const rawMin = Math.min(...vals, 0);
    const padVal = (rawMax - rawMin) * 0.15 || 5;
    const effMax = rawMax + padVal;
    const effMin = Math.max(0, rawMin - padVal);

    const pts = rawData.map((d, i) => {
      const x = (i / (rawData.length - 1 || 1)) * usableW;
      const val = Number(d.value) || 0;
      const pct = (val - effMin) / (effMax - effMin || 1);
      const y = paddingTop + graphH - pct * graphH;
      return { x, y, label: d.label, value: val };
    });

    // Tạo đường cong Smooth Bezier
    let path = '';
    if (pts.length > 0) {
      path = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i];
        const p1 = pts[i + 1];
        const cp1x = p0.x + (p1.x - p0.x) / 2;
        const cp1y = p0.y;
        const cp2x = p0.x + (p1.x - p0.x) / 2;
        const cp2y = p1.y;
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
      }
    }

    const lastPt = pts[pts.length - 1] || { x: usableW, y: graphH };
    const firstPt = pts[0] || { x: 0, y: graphH };
    const area = `${path} L ${lastPt.x} ${paddingTop + graphH} L ${firstPt.x} ${paddingTop + graphH} Z`;

    return { points: pts, pathD: path, areaD: area, maxVal: rawMax, minVal: rawMin };
  }, [rawData, usableW, graphH, paddingTop]);

  const pathLen = usableW * 2.5;

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      <div style={{ ...baseGlassStyle,
        width: w,
        height: h,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        boxSizing: 'border-box',
        gap: 4,
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
          paddingBottom: 4,
          boxSizing: 'border-box',
          height: headerH,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', minWidth: 0 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
          <span style={{ 
            ...getTypographyStyle({ fontSize: isCompact ? 11 : 12, fontWeight: 800, color: 'var(--chart-label, var(--text))', fontFamily: el.fontFamily || 'Be Vietnam Pro' }),
            letterSpacing: 0.3, 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            flex: 1,
          }}>
            {el.content || 'XU HƯỚNG TĂNG TRƯỞNG'}
          </span>
        </div>
      </div>

      {/* SVG Line & Glowing Area (100% Full Width) */}
      <div style={{ position: 'relative', width: '100%', flex: 1, marginTop: 2, boxSizing: 'border-box' }}>
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${usableW} ${graphH + paddingTop + paddingBottom}`}
          style={{ overflow: 'visible' }}
        >
          <defs>
            <linearGradient id={`area-grad-${el.id || 'default'}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.4" />
              <stop offset="60%" stopColor={color} stopOpacity="0.1" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          <line x1={0} y1={paddingTop} x2={usableW} y2={paddingTop} stroke="var(--chart-grid, rgba(255,255,255,0.06))" strokeDasharray="3 3" />
          <line x1={0} y1={paddingTop + graphH * 0.5} x2={usableW} y2={paddingTop + graphH * 0.5} stroke="var(--chart-grid, rgba(255,255,255,0.06))" strokeDasharray="3 3" />
          <line x1={0} y1={paddingTop + graphH} x2={usableW} y2={paddingTop + graphH} stroke="var(--chart-axis, rgba(255,255,255,0.12))" strokeWidth={1} />

          {/* Area Fill */}
          <path d={areaD} fill={`url(#area-grad-${el.id || 'default'})`} opacity={easeProgress * 0.9} />

          {/* Neon Spline Line */}
          {/* Outer Layer Glow Line (Zero compute vs filter drop-shadow) */}
          <path 
            d={pathD} 
            fill="none" 
            stroke={color} 
            strokeWidth="7" 
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray={pathLen}
            strokeDashoffset={pathLen * (1 - easeProgress)}
            opacity={0.3}
          />
          {/* Main Core Line */}
          <path 
            d={pathD} 
            fill="none" 
            stroke={color} 
            strokeWidth="3" 
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray={pathLen}
            strokeDashoffset={pathLen * (1 - easeProgress)}
          />

          {/* Data Points */}
          {points.map((p, i) => {
            const pointThreshold = (i / (points.length - 1 || 1)) * 0.85;
            const isPtVisible = easeProgress > pointThreshold;
            const ptSpr = isPtVisible 
              ? spring({ fps: fps || 30, frame: frame - (delayFrames + (durFrames || 45) * pointThreshold), config: { damping: 12, stiffness: 120 } })
              : 0;

            return (
              <g 
                key={i} 
                opacity={ptSpr} 
                transform={`scale(${ptSpr})`} 
                style={{ transformOrigin: `${p.x}px ${p.y}px` }}
              >
                {/* Outer Glow Ring */}
                <circle cx={p.x} cy={p.y} r="6" fill={color} fillOpacity="0.25" />
                <circle cx={p.x} cy={p.y} r="3.5" fill="var(--surface, #0A101C)" stroke={color} strokeWidth="2" />

                {/* Score above point */}
                <text 
                  x={p.x} 
                  y={p.y - 8} 
                  fill="var(--chart-value, var(--text))" 
                  fontSize={9.5} 
                  fontWeight={800} 
                  fontFamily="Inter, sans-serif" 
                  textAnchor="middle"
                >
                  {p.value}
                </text>

                {/* X-axis Label */}
                <text 
                  x={p.x} 
                  y={paddingTop + graphH + 15} 
                  fill="var(--chart-label, var(--text-sub))" 
                  fontSize={8.5} 
                  fontFamily="Be Vietnam Pro, sans-serif" 
                  fontWeight={600} 
                  textAnchor="middle"
                >
                  {p.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
    </RemotionElementWrapper>
  );
};
