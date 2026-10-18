import { RemotionElementWrapper } from '../core/RemotionElementWrapper';
import React, { useMemo } from 'react';
import { spring, Easing } from 'remotion';
import { AdvElementProps } from '../types';
import { getGlassmorphicStyle, getBadgeStyle, getTypographyStyle } from '../../utils/design-tokens';
import { renderUniversalIcon } from '../../utils/icons';
import { mixColor } from '../../utils/rich-text-parser';
import { getContrastTextColor } from '@/config/themePalettes';

export const RacingBarChartElement: React.FC<AdvElementProps> = ({ el, computedStyle, positionStyle, frame, fps, delayFrames = 0, durFrames = 60 }) => {
  const w = el.width || 336;
  const accent = el.accentColor || 'var(--accent)';
  const radius = el.radius !== undefined ? el.radius : 16;
  const variant = el.variant || 'standard';
  const isCompact = variant === 'compact';

  // 1. Data Normalization
  const rbData = el.racingBarData || {
    title: el.content || 'THỊ PHẦN TRÌNH DUYỆT TOÀN CẦU',
    bars: [
      { label: 'Google Chrome', value: 65 },
      { label: 'Apple Safari', value: 19 },
      { label: 'Microsoft Edge', value: 6 },
      { label: 'Mozilla Firefox', value: 3 },
    ]
  };

  const rawBars = rbData.bars && rbData.bars.length > 0 ? rbData.bars : [
    { label: 'Google Chrome', value: 65 },
    { label: 'Apple Safari', value: 19 },
    { label: 'Microsoft Edge', value: 6 },
    { label: 'Mozilla Firefox', value: 3 },
  ];

  // 2. Token Engine Styles
  const baseGlassStyle = getGlassmorphicStyle({
    accentColor: accent,
    radius,
    customBg: el.bgColor,
    padding: isCompact ? '10px 14px' : '14px 16px',
  });

  // 3. Animation Progress
  const progress = Math.min(1, Math.max(0, (frame - delayFrames) / (durFrames || 60)));
  const easeProgress = Easing.out(Easing.cubic)(progress);

  // 4. Memoize Max Value and Color Mapping (Tính 1 lần, tối ưu 60FPS)
  const { maxVal, preparedBars } = useMemo(() => {
    const rawMax = Math.max(...rawBars.map(b => Number(b.value) || 0), 1);
    // Tự động scale để thanh dẫn đầu (Rank 1) chiếm trọn ~95% chiều rộng, loại bỏ khoảng chết bên phải
    const scaleMax = rawMax > 100 ? rawMax : (rawMax <= 10 ? 10 : rawMax);

    const prepared = rawBars.map((bar, idx) => {
      const barColor = bar.color || (idx === 0 ? 'var(--chart-series-1, #00D4FF)' : idx === 1 ? 'var(--chart-series-2, #00FF88)' : idx === 2 ? 'var(--chart-series-3, #FFB800)' : idx === 3 ? 'var(--chart-series-4, #FF3366)' : 'var(--chart-series-5, #BEFF01)');
      const rankBg = idx === 0 
        ? '#FFD700' // Gold
        : idx === 1 
        ? '#E0E0E0' // Silver
        : idx === 2 
        ? '#CD7F32' // Bronze
        : 'var(--surface-2, rgba(255,255,255,0.12))';
      // Huy chương là hex cố định → chọn chữ tương phản; hạng thường nằm trên surface theme
      const rankColor = idx < 3 ? getContrastTextColor(rankBg) : 'var(--text, #FFF)';
      const rankShadow = idx === 0 ? '0 0 10px rgba(255,215,0,0.5)' : 'none';

      const barValNum = Number(bar.value) || 0;
      const barPct = Math.min(100, Math.max(12, (barValNum / scaleMax) * 100));

      return {
        ...bar,
        barColor,
        rankBg,
        rankColor,
        rankShadow,
        barPct,
      };
    });

    return { maxVal: scaleMax, preparedBars: prepared };
  }, [rawBars]);

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      <div style={{ ...baseGlassStyle,
        width: w,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch', // Đảm bảo mọi phần tử con dãn 100% chiều rộng khung
        boxSizing: 'border-box',
        gap: isCompact ? 6 : 10,
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', minWidth: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
            <line x1="4" y1="22" x2="4" y2="15" />
          </svg>
          <span style={{ 
            ...getTypographyStyle({ fontSize: isCompact ? 11 : 12, fontWeight: 800, color: 'var(--chart-label, var(--text))', fontFamily: el.fontFamily || 'Be Vietnam Pro' }),
            letterSpacing: 0.3, 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            flex: 1,
          }}>
            {rbData.title || el.content || 'BẢNG XẾP HẠNG ĐUA TOP'}
          </span>
        </div>
      </div>

      {/* Racing Bars List */}
      <div 
        style={{ 
          width: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: isCompact ? 8 : 10, 
          marginTop: 2,
          boxSizing: 'border-box'
        }}
      >
        {preparedBars.map((bar, idx) => {
          const barDelay = delayFrames + idx * 3;
          const barSpr = spring({
            fps,
            frame: frame - barDelay,
            config: { damping: 12, mass: 0.5, stiffness: 120 },
          });

          const currentVal = Math.round(bar.value * easeProgress);
          const animWidth = Math.max(0, Math.min(100, bar.barPct * easeProgress));

          return (
            <div
              key={idx}
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                opacity: barSpr,
                transform: `translateX(${(1 - barSpr) * -16}px)`,
                boxSizing: 'border-box',
              }}
            >
              {/* Top row: Rank badge + Icon + Label + Value */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 900,
                      color: bar.rankColor,
                      backgroundColor: bar.rankBg,
                      boxShadow: bar.rankShadow,
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'Inter, sans-serif',
                      flexShrink: 0,
                    }}
                  >
                    #{idx + 1}
                  </span>
                  {bar.icon && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {renderUniversalIcon(bar.icon, bar.barColor, 13)}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: isCompact ? 11 : 12.5,
                      fontWeight: 700,
                      color: idx === 0 ? 'var(--text)' : 'var(--text-sub, rgba(255,255,255,0.88))',
                      fontFamily: el.fontFamily || 'Be Vietnam Pro',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    {bar.label}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: isCompact ? 12 : 13.5,
                    fontWeight: 900,
                    // Số liệu nhỏ dùng --text; màu series giữ trên thanh tiến trình (series chỉ đạt 3:1)
                    color: 'var(--text)',
                    fontFamily: 'Inter, sans-serif',
                    flexShrink: 0,
                    marginLeft: 8,
                  }}
                >
                  {currentVal}%
                </span>
              </div>

              {/* Progress track (100% full width of card) */}
              <div style={{ width: '100%', height: isCompact ? 5 : 6, backgroundColor: 'var(--surface-1, rgba(255,255,255,0.06))', borderRadius: 100, overflow: 'hidden', boxSizing: 'border-box' }}>
                <div
                  style={{
                    width: `${animWidth}%`,
                    height: '100%',
                    borderRadius: 100,
                    backgroundImage: `linear-gradient(90deg, ${mixColor(bar.barColor, 53)} 0%, ${bar.barColor} 85%, var(--text, #FFFFFF) 100%)`,
                    boxShadow: `0 0 10px ${mixColor(bar.barColor, 53)}`,
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
