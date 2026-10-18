import { RemotionElementWrapper } from '../core/RemotionElementWrapper';
import React, { useMemo } from 'react';
import { Easing, spring, measureSpring } from 'remotion';
import { ElementProps } from '../types';
import { getTypographyStyle } from '../../utils/design-tokens';
import { getCardGlassStyle } from '@/utils/themeResolver';
import { parseCountValue, formatCountValue } from '../../hooks/useCountUp';
import { getLandingEnvelope, getLandingTransformStyle } from '../../utils/landingFx';

export const ChartBarElement: React.FC<ElementProps & { frame: number, fps: number, delayFrames: number, durFrames: number }> = ({ el, computedStyle, positionStyle, frame, fps, delayFrames = 0, durFrames = 45 }) => {
  const w = el.width || 336;
  const accent = el.accentColor || 'var(--accent, #BEFF01)';
  const radius = el.radius !== undefined ? el.radius : 16;
  const variant = el.variant || 'horizontal';
  const isCompact = variant === 'compact';
  const title = (el.content !== undefined && el.content !== null) ? el.content.trim() : '';
  const hasTitle = Boolean(title);

  // 1. Data Normalization
  const rawData = el.chartData && Array.isArray(el.chartData) && el.chartData.length > 0
    ? el.chartData
    : [
        { label: 'Trước tối ưu', value: 35, unit: '%', isHighlight: false },
        { label: 'Sau tối ưu', value: 88, unit: '%', isHighlight: true },
        { label: 'Mục tiêu', value: 95, unit: '%', isHighlight: false }
      ];

  // 2. Token Engine Styles (Adapts between Dark Obsidian & Daylight Frosted Ivory)
  const showCardBg = el.showCardBg !== false;
  const glassStyle = useMemo(() => {
    return getCardGlassStyle('dark', showCardBg, el.bgColor);
  }, [showCardBg, el.bgColor]);

  const progress = Math.min(1, Math.max(0, (frame - delayFrames) / (durFrames || 45)));
  const easeProgress = Easing.out(Easing.cubic)(progress);

  // 3. Memoize Dynamic Scaling & 5-Layer Color Mapping
  const { data, scaleMax } = useMemo(() => {
    const mapped = rawData.map((d: any, i: number) => {
      const numVal = typeof d.value === 'number' ? d.value : (parseFloat(String(d.value || '0').replace(/[^0-9.]/g, '')) || 0);
      const isHighlight = Boolean(d.isHighlight || d.highlight || i === 1);
      
      // Dedicated 5-Layer token binding:
      // Highlight bar uses var(--chart-highlight, var(--accent))
      // Regular bars use var(--chart-bar, var(--surface))
      const barColor = d.color && !d.color.startsWith('var(') && d.color !== '#00D4FF' && d.color !== '#00FF88' && d.color !== '#FFB800'
        ? d.color
        : (isHighlight ? 'var(--chart-highlight, var(--accent, #FF2E93))' : 'var(--chart-bar, var(--surface, #00E5FF))');

      return {
        label: d.label || `Mục ${i + 1}`,
        value: numVal,
        unit: d.unit || '%',
        color: barColor,
        isHighlight,
      };
    });

    const rawMax = Math.max(...mapped.map((d: any) => d.value), 1);
    const max = rawMax > 100 ? rawMax : (rawMax <= 10 ? 10 : rawMax);

    const withPct = mapped.map((d: any) => ({
      ...d,
      barPct: Math.min(100, Math.max(8, (d.value / max) * 100)),
    }));

    return { data: withPct, scaleMax: max };
  }, [rawData]);

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      <div style={{ ...glassStyle,
        width: w,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        boxSizing: 'border-box',
        gap: hasTitle ? (isCompact ? 8 : 10) : 0,
        padding: isCompact ? '10px 14px' : '14px 16px',
        borderRadius: radius,
      }}
    >
      {/* Standard Studio Header Bar (Chỉ hiển thị khi có tiêu đề) */}
      {hasTitle && (
        <div 
          style={{ 
            width: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            borderBottom: '1px solid var(--chart-axis, rgba(255,255,255,0.08))', 
            paddingBottom: isCompact ? 5 : 7,
            boxSizing: 'border-box'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%', minWidth: 0 }}>
            {/* Clean SVG Vector Bar Chart Icon */}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <line x1="18" y1="20" x2="18" y2="4" />
              <line x1="12" y1="20" x2="12" y2="10" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <span style={{ 
              ...getTypographyStyle({ fontSize: isCompact ? 11 : 12, fontWeight: 800, color: 'var(--chart-label, var(--text, #FFF))', fontFamily: el.fontFamily || 'Be Vietnam Pro' }),
              letterSpacing: 0.3, 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              flex: 1,
              textTransform: 'uppercase',
            }}>
              {title}
            </span>
          </div>
        </div>
      )}

      {/* Bars List */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: isCompact ? 8 : 10, marginTop: hasTitle ? 2 : 0, boxSizing: 'border-box' }}>
        {data.map((d: any, i: number) => {
          const itemDelay = delayFrames + i * 4;
          const sprConfig = { damping: 14, mass: 0.5, stiffness: 110 };
          const itemSpr = spring({
            fps: fps || 30,
            frame: frame - itemDelay,
            config: sprConfig,
          });

          const clampedSpr = Math.min(1, Math.max(0, itemSpr));
          const animWidth = Math.max(0, Math.min(100, d.barPct * clampedSpr));

          // Robust number formatting (preserves decimals like 4.8 instead of truncating to 5)
          const parsedVal = parseCountValue(d.value);
          const currentNum = parsedVal.targetNumber * clampedSpr;
          const formattedNum = formatCountValue(parsedVal, currentNum);
          const displayVal = `${formattedNum}${d.unit}`;

          // Landing punch / glow on target frame completion
          const sprDuration = measureSpring({ fps: fps || 30, config: sprConfig });
          const completionFrame = itemDelay + sprDuration;
          const landing = getLandingEnvelope(frame, completionFrame, 12);
          const landingStyle = (d.isHighlight || el.landingFx === 'pulse' || el.landingFx === 'glow')
            ? getLandingTransformStyle(landing, el.landingFx || 'none', typeof d.color === 'string' && d.color.startsWith('#') ? d.color : accent)
            : {};

          return (
            <div 
              key={i} 
              style={{ 
                width: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 4, 
                opacity: itemSpr, 
                transform: `translateX(${(1 - clampedSpr) * -16}px)`, 
                boxSizing: 'border-box' 
              }}
            >
              {/* Row 1: Label + Value */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', boxSizing: 'border-box' }}>
                <span style={{ 
                  ...getTypographyStyle({ fontSize: isCompact ? 11 : 12, fontWeight: 700, color: 'var(--chart-label, var(--text, rgba(255,255,255,0.9)))', fontFamily: el.fontFamily || 'Be Vietnam Pro' }),
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  flex: 1,
                  minWidth: 0,
                }}>
                  {d.label}
                </span>
                <span style={{ 
                  fontSize: isCompact ? 12 : 13.5, 
                  fontWeight: 900, 
                  // Pha 15% --text: accent vừa chạm 4.5:1 trên card sáng (fresh-mint), lớp glow landing làm tụt dưới ngưỡng
                  color: d.isHighlight ? 'color-mix(in srgb, var(--chart-value, var(--accent, #FF2E93)) 85%, var(--text, #FFF))' : 'var(--chart-label, var(--text, #FFF))', 
                  fontFamily: 'Inter, sans-serif', 
                  flexShrink: 0, 
                  marginLeft: 8,
                  ...landingStyle,
                }}>
                  {displayVal}
                </span>
              </div>

              {/* Row 2: Glowing Progress Bar */}
              <div style={{ width: '100%', height: isCompact ? 7 : 8, backgroundColor: 'var(--chart-axis, rgba(255,255,255,0.08))', borderRadius: 100, overflow: 'hidden', boxSizing: 'border-box' }}>
                <div
                  style={{
                    width: `${animWidth}%`,
                    height: '100%',
                    borderRadius: 100,
                    backgroundColor: d.color,
                    border: d.isHighlight ? 'none' : '1px solid var(--chart-bar-border, rgba(255,255,255,0.2))',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
    </RemotionElementWrapper>
  );
};
