import { RemotionElementWrapper } from '../core/RemotionElementWrapper';
import React, { useMemo } from 'react';
import { spring } from 'remotion';
import { AdvElementProps } from '../types';
import { getGlassmorphicStyle, getBadgeStyle, getTypographyStyle } from '../../utils/design-tokens';

export const WaterfallChartElement: React.FC<AdvElementProps> = ({ el, computedStyle, positionStyle, frame, fps, delayFrames = 0 }) => {
  const w = el.width || 336;
  const accent = el.accentColor || 'var(--accent)';
  const radius = el.radius !== undefined ? el.radius : 16;
  const variant = el.variant || 'standard';
  const isCompact = variant === 'compact';

  // 1. Data Normalization
  const wfData = el.waterfallData || {
    title: el.content || 'DÒNG TIỀN DOANH NGHIỆP',
    currency: '$',
    steps: [
      { label: 'Doanh thu', amount: 100, type: 'start' as const },
      { label: 'Vận hành', amount: -35, type: 'subtract' as const },
      { label: 'Marketing', amount: -20, type: 'subtract' as const },
      { label: 'Thuế TNDN', amount: -10, type: 'subtract' as const },
      { label: 'Lợi nhuận', amount: 35, type: 'total' as const },
    ]
  };

  const steps = wfData.steps && wfData.steps.length > 0 ? wfData.steps : [
    { label: 'Doanh thu', amount: 100, type: 'start' as const },
    { label: 'Vận hành', amount: -35, type: 'subtract' as const },
    { label: 'Marketing', amount: -20, type: 'subtract' as const },
    { label: 'Thuế TNDN', amount: -10, type: 'subtract' as const },
    { label: 'Lợi nhuận', amount: 35, type: 'total' as const },
  ];

  const isFrameless = el.showCardBg === false || el.bgColor === 'transparent';

  // 2. Token Engine Styles
  const baseGlassStyle = isFrameless
    ? {
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
        borderRadius: 0,
        padding: isCompact ? '6px 10px' : '8px 14px',
      }
    : getGlassmorphicStyle({
        accentColor: accent,
        radius,
        customBg: el.bgColor,
        padding: isCompact ? '10px 12px' : '14px 16px',
      });

  const chartH = isCompact ? 85 : 110;
  const paddingX = isCompact ? 10 : 14;
  const usableW = w - paddingX * 2;
  const slotW = usableW / steps.length;
  const colW = Math.max(16, Math.min(36, slotW * 0.68));

  // 3. Memoize Cumulative Steps Geometry (Tính 1 lần, tối ưu 60FPS)
  const { computedSteps, maxH } = useMemo(() => {
    let currentBase = 0;
    const computed = steps.map((st) => {
      let startY = currentBase;
      let endY = currentBase;

      if (st.type === 'start') {
        startY = 0;
        endY = st.amount;
        currentBase = st.amount;
      } else if (st.type === 'add') {
        startY = currentBase;
        endY = currentBase + st.amount;
        currentBase += st.amount;
      } else if (st.type === 'subtract') {
        startY = currentBase;
        endY = currentBase + st.amount;
        currentBase += st.amount;
      } else if (st.type === 'total') {
        startY = 0;
        endY = currentBase;
      }

      const isStart = st.type === 'start';
      const isTotal = st.type === 'total';
      const isSub = st.type === 'subtract';
      const stepColor = st.color || (isStart ? 'var(--chart-positive, #00FF88)' : isTotal ? 'var(--chart-warning, #FFD700)' : isSub ? 'var(--chart-negative, #FF3366)' : 'var(--chart-series-1, #00D4FF)');

      return {
        ...st,
        startY: Math.min(startY, endY),
        endY: Math.max(startY, endY),
        isSub,
        isTotal,
        isStart,
        stepColor,
      };
    });

    const max = Math.max(...computed.map(s => s.endY), 10);
    return { computedSteps: computed, maxH: max };
  }, [steps]);

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
          borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))', 
          paddingBottom: 6,
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', minWidth: 0 }}>
          <span style={{ 
            ...getTypographyStyle({ fontSize: isCompact ? 11 : 12, fontWeight: 800, color: 'var(--text, #FFF)', fontFamily: el.fontFamily || 'Be Vietnam Pro' }),
            letterSpacing: 0.3, 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            flex: 1,
          }}>
            {wfData.title || el.content || 'THÁC NƯỚC DÒNG TIỀN'}
          </span>
        </div>
      </div>

      {/* Waterfall SVG (100% Full Width) */}
      <div style={{ position: 'relative', width: '100%', height: chartH + 24, marginTop: 2, boxSizing: 'border-box' }}>
        <svg
          width="100%"
          height={chartH + 24}
          viewBox={`0 0 ${usableW} ${chartH + 24}`}
          style={{ overflow: 'visible' }}
        >
          {/* Baseline grid */}
          <line x1={0} y1={chartH} x2={usableW} y2={chartH} stroke="var(--chart-axis, rgba(255,255,255,0.12))" strokeWidth={1} />

          {computedSteps.map((st, i) => {
            const stepDelay = delayFrames + i * 3;
            const spr = spring({
              fps,
              frame: frame - stepDelay,
              config: { damping: 12, mass: 0.5, stiffness: 120 },
            });

            const topY = chartH - (st.endY / maxH) * chartH;
            const bottomY = chartH - (st.startY / maxH) * chartH;
            const barH = Math.max(3, (bottomY - topY) * spr);
            const cx = i * slotW + slotW * 0.5;

            return (
              <g key={i} opacity={spr} transform={`scale(1, ${spr})`} style={{ transformOrigin: `${cx}px ${bottomY}px` }}>
                {/* Connecting Dotted Line to next bar */}
                {i < computedSteps.length - 1 && (
                  <line
                    x1={cx + colW * 0.5}
                    y1={st.isSub ? bottomY : topY}
                    x2={cx + slotW - colW * 0.5}
                    y2={st.isSub ? bottomY : topY}
                    stroke="var(--chart-grid, rgba(255,255,255,0.3))"
                    strokeDasharray="2 2"
                    strokeWidth={1}
                  />
                )}

                {/* Bar Block */}
                <rect
                  x={cx - colW * 0.5}
                  y={topY}
                  width={colW}
                  height={barH}
                  rx={4}
                  fill={st.stepColor}
                  fillOpacity={0.92}
                  stroke={st.stepColor}
                  strokeWidth={1}
                />

                {/* Amount on top of bar */}
                <text
                  x={cx}
                  y={topY - 4}
                  textAnchor="middle"
                  fill="var(--text)"
                  fontSize={isCompact ? 8.5 : 9.5}
                  fontFamily="Inter, sans-serif"
                  fontWeight={900}
                >
                  {st.amount > 0 ? `+${st.amount}` : `${st.amount}`}
                </text>

                {/* X-axis Label */}
                <text
                  x={cx}
                  y={chartH + 15}
                  textAnchor="middle"
                  fill="var(--chart-label, var(--text-sub, rgba(255,255,255,0.7)))"
                  fontSize={isCompact ? 7.5 : 8.5}
                  fontFamily="Be Vietnam Pro, sans-serif"
                  fontWeight={700}
                >
                  {st.label}
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
