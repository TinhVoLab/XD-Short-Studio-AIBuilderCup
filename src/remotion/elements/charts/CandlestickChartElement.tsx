import { RemotionElementWrapper } from '../core/RemotionElementWrapper';
import React, { useMemo } from 'react';
import { spring } from 'remotion';
import { AdvElementProps } from '../types';
import { getGlassmorphicStyle, getBadgeStyle, getTypographyStyle, getStatusColor } from '../../utils/design-tokens';

export const CandlestickChartElement: React.FC<AdvElementProps> = ({ el, computedStyle, positionStyle, frame, fps, delayFrames = 0 }) => {
  const w = el.width || 336;
  const radius = el.radius !== undefined ? el.radius : 16;
  const variant = el.variant || 'standard';
  const isCompact = variant === 'compact';

  // 1. Data Normalization
  const csData = el.candlestickData || {
    symbol: 'BTC / USDT',
    currentPrice: '$98,450.00',
    changePct: '+8.45%',
    candles: [
      { open: 92000, high: 93500, low: 91200, close: 93200, label: '09:00' },
      { open: 93200, high: 94800, low: 92800, close: 94500, label: '12:00' },
      { open: 94500, high: 95200, low: 93600, close: 94000, label: '15:00' },
      { open: 94000, high: 96800, low: 93800, close: 96200, label: '18:00' },
      { open: 96200, high: 97500, low: 95500, close: 96800, label: '21:00' },
      { open: 96800, high: 99200, low: 96400, close: 98450, label: 'Live' },
    ]
  };

  const candles = csData.candles && csData.candles.length > 0 ? csData.candles : [
    { open: 92000, high: 93500, low: 91200, close: 93200, label: '09:00' },
    { open: 93200, high: 94800, low: 92800, close: 94500, label: '12:00' },
    { open: 94500, high: 95200, low: 93600, close: 94000, label: '15:00' },
    { open: 94000, high: 96800, low: 93800, close: 96200, label: '18:00' },
    { open: 96200, high: 97500, low: 95500, close: 96800, label: '21:00' },
    { open: 96800, high: 99200, low: 96400, close: 98450, label: 'Live' },
  ];

  const isBullishTotal = !csData.changePct?.startsWith('-');
  const primaryAccent = isBullishTotal ? 'var(--chart-positive, #00FF88)' : 'var(--chart-negative, #FF3366)';
  const statusToken = getStatusColor(isBullishTotal ? 'success' : 'error');

  // 2. Token Engine Styles
  const baseGlassStyle = getGlassmorphicStyle({
    accentColor: primaryAccent,
    radius,
    customBg: el.bgColor,
    padding: isCompact ? '10px 12px' : '12px 14px',
  });

  const chartAreaH = isCompact ? 80 : 110;
  const paddingX = isCompact ? 10 : 14;
  const usableW = w - paddingX * 2;
  const slotW = usableW / candles.length;
  const candleW = Math.max(14, Math.min(30, slotW * 0.55));

  // 3. Memoize Min/Max & Coordinates (Tính 1 lần, tối ưu 60FPS)
  const { minVal, maxVal, computedCandles, lastPriceY } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    candles.forEach(c => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
    });
    const pad = (max - min) * 0.12 || 1000;
    const effMin = min - pad;
    const effMax = max + pad;

    const scale = (val: number) => {
      const pct = (val - effMin) / (effMax - effMin);
      return chartAreaH - pct * chartAreaH;
    };

    const computed = candles.map((c, i) => {
      const isGreen = c.close >= c.open;
      const candleColor = isGreen ? 'var(--chart-positive, #00FF88)' : 'var(--chart-negative, #FF3366)';
      const openY = scale(c.open);
      const closeY = scale(c.close);
      const highY = scale(c.high);
      const lowY = scale(c.low);
      const bodyTop = Math.min(openY, closeY);
      const bodyH = Math.max(3, Math.abs(closeY - openY));
      const cx = i * slotW + slotW * 0.5;

      return {
        ...c,
        isGreen,
        candleColor,
        openY,
        closeY,
        highY,
        lowY,
        bodyTop,
        bodyH,
        cx,
      };
    });

    const last = candles[candles.length - 1];
    const lastY = scale(last.close);

    return {
      minVal: effMin,
      maxVal: effMax,
      computedCandles: computed,
      lastPriceY: lastY,
    };
  }, [candles, usableW, chartAreaH, slotW]);

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
      {/* Header: Symbol + Live Price + Change % */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Chữ trung tính trên nền tint xu hướng: positive/negative chỉ đạt 3:1 nên không dùng làm màu chữ nhỏ */}
          <div style={{ ...getBadgeStyle(primaryAccent, 'sm'), color: 'var(--text)' }}>
            <span>{isBullishTotal ? '▲ BULLISH' : '▼ BEARISH'}</span>
          </div>
          <span style={{ 
            ...getTypographyStyle({ fontSize: isCompact ? 11.5 : 12.5, fontWeight: 900, color: 'var(--chart-label, var(--text))', fontFamily: 'Be Vietnam Pro' }),
            letterSpacing: 0.4 
          }}>
            {el.content || csData.symbol || 'MARKET CHART'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ 
            fontSize: isCompact ? 12 : 13.5, 
            fontWeight: 900, 
            color: 'var(--chart-value, var(--text))', 
            fontFamily: 'Inter, sans-serif',
          }}>
            {csData.currentPrice || '$98,450.00'}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: 'var(--text)',
              backgroundColor: statusToken.bg,
              border: `1px solid ${statusToken.border}`,
              padding: '1px 6px',
              borderRadius: 4,
              fontFamily: 'Inter, sans-serif',
              boxShadow: `0 0 8px ${statusToken.glow}`,
            }}
          >
            {csData.changePct || '+8.45%'}
          </span>
        </div>
      </div>

      {/* Candlestick SVG */}
      <div style={{ position: 'relative', width: '100%', height: chartAreaH + (isCompact ? 14 : 20), marginTop: 2 }}>
        <svg
          width="100%"
          height={chartAreaH + (isCompact ? 14 : 20)}
          viewBox={`0 0 ${usableW} ${chartAreaH + (isCompact ? 14 : 20)}`}
          style={{ overflow: 'visible' }}
        >
          {/* Grid lines */}
          <line x1={0} y1={chartAreaH * 0.25} x2={usableW} y2={chartAreaH * 0.25} stroke="var(--chart-grid, var(--border))" strokeDasharray="3 3" />
          <line x1={0} y1={chartAreaH * 0.75} x2={usableW} y2={chartAreaH * 0.75} stroke="var(--chart-grid, var(--border))" strokeDasharray="3 3" />

          {/* Dotted live price line */}
          <line
            x1={0}
            y1={lastPriceY}
            x2={usableW}
            y2={lastPriceY}
            stroke={primaryAccent}
            strokeDasharray="4 4"
            strokeWidth={1}
            opacity={0.65}
          />
          {/* Halo and last price circle */}
          <circle
            cx={usableW - slotW * 0.5}
            cy={lastPriceY}
            r={7}
            fill={primaryAccent}
            opacity={0.3}
          />
          <circle
            cx={usableW - slotW * 0.5}
            cy={lastPriceY}
            r={3.5}
            fill={primaryAccent}
          />

          {/* Candles */}
          {computedCandles.map((c, i) => {
            const candleDelay = delayFrames + i * 3;
            const spr = spring({
              fps,
              frame: frame - candleDelay,
              config: { damping: 12, mass: 0.5, stiffness: 120 },
            });

            return (
              <g key={i} opacity={spr} transform={`scale(1, ${spr})`} style={{ transformOrigin: `${c.cx}px ${c.lowY}px` }}>
                {/* Wick */}
                <line
                  x1={c.cx}
                  y1={c.highY}
                  x2={c.cx}
                  y2={c.lowY}
                  stroke={c.candleColor}
                  strokeWidth={1.5}
                  opacity={0.85}
                />

                {/* Candle Body */}
                <rect
                  x={c.cx - candleW * 0.5}
                  y={c.bodyTop}
                  width={candleW}
                  height={c.bodyH * spr}
                  rx={2}
                  fill={c.candleColor}
                  fillOpacity={c.isGreen ? 0.95 : 0.9}
                  stroke={c.candleColor}
                  strokeWidth={1}
                />

                {/* X-axis Label */}
                {c.label && !isCompact && (
                  <text
                    x={c.cx}
                    y={chartAreaH + 15}
                    textAnchor="middle"
                    fill="var(--chart-label, var(--text-sub))"
                    fontSize={9}
                    fontFamily="Inter, sans-serif"
                    fontWeight={600}
                  >
                    {c.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
    </RemotionElementWrapper>
  );
};
