import { RemotionElementWrapper } from '../core/RemotionElementWrapper';
import React, { useMemo } from 'react';
import { spring } from 'remotion';
import { AdvElementProps } from '../types';
import { ChecklistItem } from '@/types/scene';
import { renderUniversalIcon } from '../../utils/icons';
import { DEFAULT_CHECKLIST_ITEMS } from '@/config/widgetDefaults';
import { mixColor } from '../../utils/rich-text-parser';

export const ChecklistElement: React.FC<AdvElementProps> = ({
  el,
  computedStyle,
  positionStyle,
  frame,
  fps,
  delayFrames = 0
}) => {
  const accent = el.accentColor || 'var(--accent)';
  const radius = el.radius !== undefined ? el.radius : 16;
  const data: any = el.checklistData || {};
  
  const rawItems: ChecklistItem[] = useMemo(() => {
    if (el.checklistItems && el.checklistItems.length > 0) return el.checklistItems;
    if (data.items && data.items.length > 0) return data.items;
    return DEFAULT_CHECKLIST_ITEMS;
  }, [el.checklistItems, data.items]);

  const title = (data.title !== undefined && data.title !== null
    ? String(data.title)
    : (el.content || '')
  ).trim();
  const hasTitle = Boolean(title);
  const styleVariant = data.style || 'glass';
  const isTickAnim = data.tickAnimation !== false;
  const showFooter = data.showFooter !== false;

  // Calculate completed count
  const { doneCount, totalCount, progressPct } = useMemo(() => {
    const total = rawItems.length;
    const done = rawItems.filter(it => it.status === 'checked' || it.status === 'done' || !it.status).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { doneCount: done, totalCount: total, progressPct: pct };
  }, [rawItems]);

  const activeFont = el.fontFamily || 'Be Vietnam Pro, sans-serif';
  const itemFontSize = 10.5;
  const subFontSize = 8.5;

  const isFrameless = el.showCardBg === false || el.bgColor === 'transparent';

  // Theme-specific container styles (Adaptive to Dark & Light Scene Palettes)
  let containerBg = isFrameless ? 'transparent' : (el.bgColor || 'var(--card-bg, rgba(10, 16, 28, 0.95))');
  let containerBorder = isFrameless ? 'none' : `1px solid ${mixColor(accent, 27)}`;
  let containerShadow = isFrameless ? 'none' : 'var(--shadow-md, 0 8px 32px rgba(0, 0, 0, 0.6))';

  if (!isFrameless) {
    if (styleVariant === 'minimal') {
      containerBg = el.bgColor || 'var(--surface-1, rgba(5, 8, 15, 0.92))';
      containerBorder = '1px solid var(--border)';
      containerShadow = '0 4px 20px rgba(0, 0, 0, 0.5)';
    } else if (styleVariant === 'audit') {
      containerBg = el.bgColor || 'var(--card-bg, rgba(8, 12, 20, 0.96))';
      containerBorder = '1px solid var(--border)';
      containerShadow = 'var(--shadow-lg, 0 10px 36px rgba(0, 0, 0, 0.7))';
    } else if (styleVariant === 'cyber') {
      containerBg = el.bgColor || 'var(--surface-1, rgba(3, 7, 18, 0.98))';
      containerBorder = `1.5px solid ${accent}`;
      containerShadow = `0 0 24px ${mixColor(accent, 13)}, var(--shadow-md, 0 8px 32px rgba(0, 0, 0, 0.8))`;
    }
  }

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      <div
        style={{
          width: el.width || 336,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          backgroundColor: containerBg,
          borderRadius: radius,
          padding: '12px 14px',
          border: containerBorder,
          boxShadow: containerShadow,
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {/* 1. Header Bar (Chỉ hiển thị khi có tiêu đề) */}
        {hasTitle && (
          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: 6,
              borderBottom: styleVariant === 'cyber' ? `1.5px solid ${mixColor(accent, 27)}` : '1px solid var(--border)',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: styleVariant === 'cyber' ? 1 : '50%',
                  backgroundColor: accent,
                  boxShadow: `0 0 8px ${accent}`,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 800,
                  color: 'var(--text)',
                  fontFamily: activeFont,
                  letterSpacing: 0.2,
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  flex: 1,
                }}
              >
                {title}
              </span>
            </div>
          </div>
        )}

        {/* 2. Checklist Items List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {rawItems.map((item, idx) => {
            const itemDelay = delayFrames + idx * 7;
            const spr = spring({
              fps,
              frame: frame - itemDelay,
              config: { damping: 14, mass: 0.6, stiffness: 120 },
            });

            // Secondary spring for Live Tick punch animation
            const tickPunchDelay = itemDelay + (isTickAnim ? 7 : 0);
            const tickSpr = isTickAnim
              ? spring({
                  fps,
                  frame: frame - tickPunchDelay,
                  config: { damping: 11, mass: 0.45, stiffness: 190 },
                })
              : 1.0;

            const isChecked = item.status === 'checked' || item.status === 'done' || !item.status;
            const isCross = item.status === 'cross' || item.status === 'danger';
            const isWarning = item.status === 'warning' || item.status === 'pending';

            const colorChecked = styleVariant === 'audit' ? 'var(--chart-positive, #00FF88)' : accent;
            const colorCross = 'var(--chart-negative, #FF3366)';
            const colorWarning = 'var(--chart-warning, #FFB800)';
            const itemColor = isChecked ? colorChecked : isCross ? colorCross : colorWarning;
            const iconChar = item.icon || (isChecked ? '✓' : isCross ? '✕' : '!');

            // Theme-specific row styles
            let rowBg = 'var(--surface-1)';
            let rowBorder = `1px solid color-mix(in srgb, ${itemColor} 25%, transparent)`;
            if (styleVariant === 'audit') {
              rowBg = isChecked
                ? 'color-mix(in srgb, var(--chart-positive, #00FF88) 8%, var(--surface-1))'
                : isCross
                  ? 'color-mix(in srgb, var(--chart-negative, #FF3366) 8%, var(--surface-1))'
                  : 'color-mix(in srgb, var(--chart-warning, #FFB800) 8%, var(--surface-1))';
              rowBorder = `1px solid color-mix(in srgb, ${itemColor} 35%, transparent)`;
            } else if (styleVariant === 'minimal') {
              rowBg = 'transparent';
              rowBorder = '1px solid var(--border)';
            } else if (styleVariant === 'cyber') {
              rowBg = 'var(--surface-2)';
              rowBorder = `1px solid color-mix(in srgb, ${itemColor} 45%, transparent)`;
            }

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 9px',
                  borderRadius: styleVariant === 'cyber' ? 4 : 8,
                  backgroundColor: rowBg,
                  border: rowBorder,
                  boxShadow: isChecked && spr > 0.8 ? `0 0 12px color-mix(in srgb, ${itemColor} 15%, transparent)` : 'none',
                  transform: `translateY(${(1 - spr) * 12}px)`,
                  opacity: spr,
                  boxSizing: 'border-box',
                }}
              >
                {/* Status Badge Icon with Live Tick Punch */}
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: styleVariant === 'cyber' ? 3 : '50%',
                    backgroundColor: `color-mix(in srgb, ${itemColor} 18%, transparent)`,
                    border: `1.5px solid ${itemColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10.5,
                    fontWeight: 900,
                    color: itemColor,
                    flexShrink: 0,
                    boxShadow: tickSpr > 0.6 ? `0 0 10px color-mix(in srgb, ${itemColor} 45%, transparent)` : 'none',
                    transform: `scale(${Math.max(0.2, tickSpr)})`,
                    opacity: Math.min(1, tickSpr * 1.5),
                  }}
                >
                  {renderUniversalIcon(iconChar, itemColor, 12)}
                </div>

                {/* Text content */}
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, gap: 1 }}>
                  <span
                    style={{
                      fontSize: itemFontSize,
                      fontWeight: 700,
                      color: isCross ? 'var(--text-sub)' : 'var(--text)',
                      textDecoration: isCross && styleVariant !== 'cyber' ? 'line-through' : 'none',
                      fontFamily: activeFont,
                      lineHeight: 1.25,
                      wordBreak: 'break-word',
                    }}
                  >
                    {item.text}
                  </span>
                  {item.subtext && (
                    <span
                      style={{
                        fontSize: subFontSize,
                        fontWeight: 500,
                        color: 'var(--text-sub)',
                        fontFamily: activeFont,
                        lineHeight: 1.15,
                      }}
                    >
                      {item.subtext}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. Progress Status Footer */}
        {showFooter && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 8px',
              background: 'var(--surface-2)',
              borderRadius: styleVariant === 'cyber' ? 4 : 8,
              border: '1px solid var(--border)',
              boxSizing: 'border-box',
              marginTop: 2,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 9, color: 'var(--text-sub)', fontFamily: activeFont, fontWeight: 600 }}>
                HOÀN THÀNH {doneCount}/{totalCount} MỤC
              </span>
              {/* Mini progress bar */}
              <div style={{ flex: 1, height: 4, backgroundColor: 'var(--surface-1)', borderRadius: 2, overflow: 'hidden', maxWidth: 60 }}>
                <div style={{ width: `${progressPct}%`, height: '100%', backgroundColor: accent, borderRadius: 2 }} />
              </div>
            </div>
            <span style={{ fontSize: 9.5, color: 'var(--text)', fontWeight: 900, fontFamily: activeFont }}>
              {progressPct}%
            </span>
          </div>
        )}
      </div>
    </RemotionElementWrapper>
  );
};
