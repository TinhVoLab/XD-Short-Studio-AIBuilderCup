import React from 'react';
import { spring } from 'remotion';
import { AdvElementProps, ElementProps } from '../types';
import { RemotionElementWrapper } from '../core/RemotionElementWrapper';

export const RankingListElement: React.FC<AdvElementProps> = ({ el, computedStyle, positionStyle, frame, fps, delayFrames = 0 }) => {
  const items = el.rankingItems && el.rankingItems.length > 0 ? el.rankingItems : [
    { rank: 1, name: 'Hạng Mục 01', score: '98%', badge: 'Quán Quân', color: 'var(--accent, #FFD700)' },
    { rank: 2, name: 'Hạng Mục 02', score: '95%', badge: 'Á Quân', color: 'var(--chart-series-2, #E0E0E0)' },
    { rank: 3, name: 'Hạng Mục 03', score: '91%', badge: 'Top 3', color: 'var(--chart-series-3, #CD7F32)' },
  ];

  const accent = el.accentColor || el.color || 'var(--accent, #BEFF01)';

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          width: el.width || 336,
          backgroundColor: el.bgColor || 'var(--card-bg)',
          borderRadius: 16,
          padding: '12px 14px',
          border: `1px solid color-mix(in srgb, ${accent} 40%, transparent)`,
          boxShadow: `var(--shadow-md, 0 8px 32px rgba(0,0,0,0.6))`,
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ width: '100%', alignSelf: 'stretch', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1h10v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
            <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--text)', letterSpacing: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {el.content || 'BẢNG XẾP HẠNG TOP'}
            </span>
          </div>
          <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--text)', backgroundColor: `color-mix(in srgb, ${accent} 20%, transparent)`, border: `1px solid color-mix(in srgb, ${accent} 40%, transparent)`, padding: '2px 8px', borderRadius: 20, flexShrink: 0, marginLeft: 8 }}>
            LEADERBOARD
          </span>
        </div>

        {/* Items List */}
        <div style={{ width: '100%', alignSelf: 'stretch', display: 'flex', flexDirection: 'column', gap: 7, marginTop: 2 }}>
          {items.map((item: any, idx: number) => {
            const itemDelay = delayFrames + idx * 5;
            const itemSpr = spring({
              fps,
              frame: frame - itemDelay,
              config: { damping: 12, mass: 0.5, stiffness: 120 },
            });

            const isTop1 = item.rank === 1;
            const isTop2 = item.rank === 2;
            const isTop3 = item.rank === 3;

            const medalColor = isTop1 ? 'var(--accent, #FFD700)' : isTop2 ? 'var(--chart-series-2, #E0E0E0)' : isTop3 ? 'var(--chart-series-3, #CD7F32)' : (item.color || accent);

            const progressVal = typeof item.score === 'number' ? item.score : parseInt(String(item.score || '100').replace(/[^0-9]/g, '')) || (100 - idx * 15);
            const barWidth = Math.min(100, Math.max(10, progressVal)) * Math.min(1, Math.max(0, itemSpr));

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  padding: '8px 10px',
                  borderRadius: 10,
                  backgroundColor: isTop1 ? `color-mix(in srgb, ${medalColor} 8%, var(--surface-1))` : 'var(--surface-1)',
                  border: `1px solid color-mix(in srgb, ${medalColor} 35%, transparent)`,
                  boxShadow: isTop1 && itemSpr > 0.8 ? `0 0 16px color-mix(in srgb, ${medalColor} 25%, transparent)` : 'none',
                  transform: `translateX(${(1 - itemSpr) * -30}px)`,
                  opacity: itemSpr,
                  boxSizing: 'border-box',
                  width: '100%',
                }}
              >
                {/* Row 1: Medal + Name + Badge + Score */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                  {/* Rank Medal */}
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      backgroundColor: `color-mix(in srgb, ${medalColor} 20%, transparent)`,
                      border: `1px solid ${medalColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      color: medalColor,
                      flexShrink: 0,
                    }}
                  >
                    {isTop1 ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill={medalColor} stroke={medalColor} strokeWidth="1">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ) : isTop2 || isTop3 ? (
                      <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--text)' }}>{item.rank}</span>
                    ) : (
                      <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-sub)' }}>{item.rank}</span>
                    )}
                  </div>

                {/* Name */}
                <span
                  style={{
                    flex: 1,
                    fontSize: 12,
                    fontWeight: 800,
                    color: 'var(--text)',
                    fontFamily: 'Be Vietnam Pro',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    minWidth: 0,
                  }}
                  title={item.name}
                >
                  {item.name}
                </span>

                {/* Badge Tag */}
                {item.badge && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: 'var(--text)',
                      backgroundColor: `color-mix(in srgb, ${medalColor} 18%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${medalColor} 44%, transparent)`,
                      padding: '1px 5px',
                      borderRadius: 4,
                      fontFamily: el.fontFamily || 'var(--font-sans, inherit)',
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Score */}
                {item.score && (
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 900,
                      color: 'var(--text)',
                      fontFamily: el.fontFamily || 'var(--font-sans, inherit)',
                      flexShrink: 0,
                      textAlign: 'right',
                      minWidth: 32,
                    }}
                  >
                    {item.score}
                  </span>
                )}
              </div>

              {/* Row 2: Full Width Progress Bar */}
              <div style={{ width: '100%', height: 4, backgroundColor: 'var(--surface-2)', borderRadius: 100, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${barWidth}%`,
                    height: '100%',
                    borderRadius: 100,
                    backgroundImage: `linear-gradient(90deg, color-mix(in srgb, ${medalColor} 50%, transparent) 0%, ${medalColor} 85%, var(--text) 100%)`,
                    boxShadow: `0 0 8px color-mix(in srgb, ${medalColor} 60%, transparent)`,
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
