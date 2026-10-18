import { RemotionElementWrapper } from '../core/RemotionElementWrapper';
import React, { useMemo } from 'react';
import { spring, interpolate } from 'remotion';
import { AdvElementProps } from '../types';
import { getGlassmorphicStyle, getTypographyStyle } from '../../utils/design-tokens';
import { DEFAULT_SANKEY_DATA } from '@/config/widgetDefaults';
import { mixColor, readableTint } from '../../utils/rich-text-parser';

export const SankeyChartElement: React.FC<AdvElementProps> = ({ el, computedStyle, positionStyle, frame, fps, delayFrames = 0 }) => {
  const w = el.width || 336;
  const accent = el.accentColor || '#BEFF01';
  const radius = el.radius !== undefined ? el.radius : 16;
  const variant = el.variant || 'vertical-fan';

  // 1. Data Normalization
  const sankeyData = el.sankeyData || { ...DEFAULT_SANKEY_DATA, title: el.content || DEFAULT_SANKEY_DATA.title };

  const title = (sankeyData.title !== undefined && sankeyData.title !== null
    ? String(sankeyData.title)
    : (el.content || '')
  ).trim();
  const hasTitle = Boolean(title);

  const flows = sankeyData.flows && sankeyData.flows.length > 0 ? sankeyData.flows : DEFAULT_SANKEY_DATA.flows;

  // 2. Token Styles & Glassmorphism
  const isCompact = variant === 'compact';
  const isFrameless = el.showCardBg === false || el.bgColor === 'transparent';
  const baseGlassStyle = getGlassmorphicStyle({ 
    accentColor: accent, 
    radius, 
    customBg: el.bgColor, 
    padding: isCompact ? '10px 12px' : '14px 16px' 
  });

  const cardStyle: React.CSSProperties = isFrameless
    ? {
        width: w,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'transparent',
        border: 'none',
        borderRadius: radius,
        boxShadow: 'none',
        padding: isCompact ? '10px 12px' : '14px 16px',
        boxSizing: 'border-box',
      }
    : {
        ...baseGlassStyle,
        width: w,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      };

  // 3. Animation Spring
  const enterSpring = spring({
    fps,
    frame: Math.max(0, frame - delayFrames),
    config: { damping: 14, stiffness: 120 }
  });

  const padX = isCompact ? 10 : 14;
  const contentW = w - padX * 2;
  const svgH = isCompact ? 36 : Math.max(44, 34 + flows.length * 4);
  const topH = isCompact ? 42 : 48; 
  const bottomItemH = isCompact ? 38 : 44; 
  const targetGap = isCompact ? 6 : 8;

  // 4. Memoize SVG Ribbons Path Geometry
  const computedRibbons = useMemo(() => {
    const sourceCenter = contentW / 2;
    const totalWidth = Math.min(80, contentW * 0.35); // Source cluster width
    
    const seriesFallbacks = [
      'var(--chart-series-1, #00E5FF)',
      'var(--chart-series-2, #FF2E93)',
      'var(--chart-series-3, #FFE600)',
      'var(--chart-series-4, #00FF88)',
      'var(--chart-series-5, #BD00FF)',
    ];

    return flows.map((f, i) => {
      const startX = flows.length === 1 
        ? sourceCenter 
        : sourceCenter - (totalWidth / 2) + (totalWidth / (flows.length - 1 || 1)) * i;
      
      const endX = 20 + ((contentW - 40) / (flows.length + 1)) * (i + 1);
      const ribbonWidth = Math.max(6, (f.percent / 100) * 28);
      const pathD = `M ${startX} 0 C ${startX} ${svgH * 0.45}, ${endX} ${svgH * 0.55}, ${endX} ${svgH}`;

      return {
        pathD,
        ribbonWidth,
        flowColor: f.color || seriesFallbacks[i % seriesFallbacks.length] || accent,
      };
    });
  }, [flows, contentW, svgH, accent]);

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      <div style={cardStyle}>
        {/* Header (Chỉ hiển thị khi có tiêu đề) */}
        {hasTitle && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: isCompact ? 8 : 10,
            width: '100%',
          }}>
            {/* Clean SVG Branching Icon (No Emoji) */}
            <svg 
              width="13" 
              height="13" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke={accent} 
              strokeWidth="2.2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              style={{ flexShrink: 0 }}
            >
              <circle cx="12" cy="4" r="2.5" />
              <circle cx="6" cy="20" r="2.5" />
              <circle cx="18" cy="20" r="2.5" />
              <path d="M12 6.5v3.5m0 0l-6 7.5m6-7.5l6 7.5" />
            </svg>
            <div style={{
              ...getTypographyStyle({
                fontSize: isCompact ? 11 : 12.5,
                fontWeight: 800,
                color: el.color || 'var(--text, #FFFFFF)',
                fontFamily: el.fontFamily || 'Be Vietnam Pro',
              }),
              textTransform: 'uppercase',
              flex: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              letterSpacing: 0.5,
            }}>
              {title}
            </div>
          </div>
        )}

        {/* Main Flow Container */}
        <div style={{ 
          width: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
        }}>
          {/* Top Source Node */}
          <div style={{
            width: '68%',
            height: topH,
            background: 'var(--surface-1, rgba(255,255,255,0.08))',
            border: `1px solid var(--border, rgba(255, 255, 255, 0.15))`,
            borderTop: `2px solid ${accent}`,
            borderRadius: 10,
            padding: '4px 12px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: `0 4px 16px rgba(0,0,0,0.35), 0 0 15px ${mixColor(accent, 8)}`,
            zIndex: 3,
            boxSizing: 'border-box',
          }}>
            <span style={{ 
              fontSize: 9.5, 
              fontWeight: 700, 
              color: 'var(--text-sub, rgba(255,255,255,0.65))', 
              letterSpacing: 0.6,
              textTransform: 'uppercase',
              fontFamily: el.fontFamily || 'Be Vietnam Pro'
            }}>
              {sankeyData.sourceValue}
            </span>
            <span style={{ 
              fontSize: isCompact ? 13 : 15, 
              fontWeight: 900, 
              color: 'var(--text, #FFFFFF)', 
              marginTop: 1, 
              fontFamily: el.fontFamily || 'Be Vietnam Pro, sans-serif',
              textShadow: '0 2px 8px rgba(0,0,0,0.8)'
            }}>
              {sankeyData.source}
            </span>
          </div>

          {/* SVG Vertical Ribbons Fan Out */}
          <svg style={{ 
            width: contentW, 
            height: svgH, 
            pointerEvents: 'none',
            display: 'block',
            marginTop: -3,
            marginBottom: -3,
            zIndex: 2,
            overflow: 'visible',
          }}>
            <defs>
              {computedRibbons.map((r, i) => (
                <linearGradient key={`v-sankey-${i}`} id={`v-sankey-grad-${i}-${el.id || 'default'}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--text, #FFFFFF)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor={r.flowColor} stopOpacity="0.85" />
                </linearGradient>
              ))}
            </defs>

            {computedRibbons.map((r, i) => {
              const flowSpring = spring({
                fps,
                frame: Math.max(0, frame - delayFrames - i * 3),
                config: { damping: 12, stiffness: 90 }
              });

              return (
                <path
                  key={i}
                  d={r.pathD}
                  fill="none"
                  stroke={`url(#v-sankey-grad-${i}-${el.id || 'default'})`}
                  strokeWidth={r.ribbonWidth * flowSpring}
                  strokeLinecap="round"
                  opacity={flowSpring * 0.9}
                />
              );
            })}
          </svg>

          {/* Bottom Target Rows */}
          <div style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: targetGap,
            zIndex: 3,
            boxSizing: 'border-box',
          }}>
            {flows.map((f, i) => {
              const flowSpring = spring({
                fps,
                frame: Math.max(0, frame - delayFrames - i * 3 - 2),
                config: { damping: 14 }
              });

              const seriesFallbacks = [
                'var(--chart-series-1, #00E5FF)',
                'var(--chart-series-2, #FF2E93)',
                'var(--chart-series-3, #FFE600)',
                'var(--chart-series-4, #00FF88)',
                'var(--chart-series-5, #BD00FF)',
              ];
              const flowColor = f.color || seriesFallbacks[i % seriesFallbacks.length] || accent;

              return (
                <div
                  key={i}
                  style={{
                    width: '100%',
                    height: bottomItemH,
                    background: 'var(--surface-1, rgba(255,255,255,0.05))',
                    border: `1px solid ${mixColor(flowColor, 27)}`,
                    borderRadius: 8,
                    padding: '0 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    opacity: flowSpring,
                    transform: `translateY(${interpolate(flowSpring, [0, 1], [10, 0])}px)`,
                    boxSizing: 'border-box',
                    boxShadow: `0 2px 10px rgba(0,0,0,0.25), 0 0 12px ${mixColor(flowColor, 6)}`,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Background Progress Fill by % */}
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${f.percent * flowSpring}%`,
                    backgroundColor: mixColor(flowColor, 9),
                    pointerEvents: 'none',
                    zIndex: 0,
                  }} />

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, zIndex: 1 }}>
                    <span style={{ 
                      fontSize: isCompact ? 11 : 12, 
                      fontWeight: 700, 
                      color: 'var(--text, #FFFFFF)', 
                      fontFamily: el.fontFamily || 'Be Vietnam Pro' 
                    }}>
                      {f.label}
                    </span>
                    <span style={{ 
                      fontSize: 9.5, 
                      color: readableTint(flowColor), 
                      fontWeight: 800, 
                      background: mixColor(flowColor, 10), 
                      border: `1px solid ${mixColor(flowColor, 27)}`,
                      padding: '1px 5px', 
                      borderRadius: 4,
                      fontFamily: el.fontFamily || 'Be Vietnam Pro'
                    }}>
                      {f.percent}%
                    </span>
                  </div>

                  <span style={{ 
                    fontSize: isCompact ? 12.5 : 13.5, 
                    fontWeight: 900, 
                    color: readableTint(flowColor), 
                    zIndex: 1, 
                    fontFamily: el.fontFamily || 'Be Vietnam Pro',
                    textShadow: `0 0 8px ${mixColor(flowColor, 20)}`
                  }}>
                    {f.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </RemotionElementWrapper>
  );
};
