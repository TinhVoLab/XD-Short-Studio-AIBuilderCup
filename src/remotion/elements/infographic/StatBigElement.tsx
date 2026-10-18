import React from 'react';
import { spring } from 'remotion';
import { AdvElementProps } from '../types';
import { RemotionElementWrapper } from '../core/RemotionElementWrapper';

// ─── SVG Badge Icons (No emoji, AGENTS.md compliant) ──────────────────────────
const IconTrendUp = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

const IconTrendDown = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
    <polyline points="17 18 23 18 23 12"/>
  </svg>
);

const IconBreakthrough = () => (
  <svg width="10" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const IconStat = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);

import { useCountUp } from '../../hooks/useCountUp';
import { mixColor, readableTint } from '../../utils/rich-text-parser';

export const StatBigElement: React.FC<AdvElementProps> = ({
  el,
  computedStyle,
  positionStyle,
  frame,
  fps,
  delayFrames = 0,
  durFrames = 45,
}) => {
  const rawValue = String(el.statValue || el.content || '89%').replace(/[\[\]]/g, '').trim();
  const label = el.statLabel || 'TỶ LỆ CHUYỂN ĐỔI THÀNH CÔNG';
  const subtitle = el.subtitle || '';
  const w = el.width || 320;
  const statLayout = el.statLayout || 'single';

  // ── Detect trend type ──────────────────────────────────────────────────────
  const isPositive = rawValue.startsWith('+') || rawValue.includes('↑') || rawValue.includes('▲');
  const isNegative = rawValue.startsWith('-') || rawValue.includes('↓') || rawValue.includes('▼');
  const isBreakthrough = rawValue.toLowerCase().includes('x') || rawValue.includes('100')
    || rawValue.toLowerCase().startsWith('10') || rawValue.toLowerCase().endsWith('x');

  const defaultAccent = isPositive ? 'var(--chart-positive, #00FF88)' : isNegative ? 'var(--chart-negative, #FF3366)' : isBreakthrough ? 'var(--chart-warning, #FFD700)' : 'var(--accent, #BEFF01)';
  const accent = el.accentColor || el.color || defaultAccent;
  const numberColor = el.statNumberColor || 'var(--text, #FFFFFF)';
  const labelColor = el.statLabelColor || 'var(--text, #FFFFFF)';
  const labelFontSize = el.statLabelFontSize || 13;

  // ── Unified CountUp Engine & Landing Animation ─────────────────────────────
  const mainCount = useCountUp(rawValue, {
    fps,
    frame,
    delayFrames,
    durFrames,
    landingFx: el.landingFx || 'none',
    accentColor: accent,
  });

  const rawCompare = el.statCompareValue || '';
  const compareCount = useCountUp(rawCompare, {
    fps,
    frame,
    delayFrames: delayFrames + 4,
    durFrames,
    landingFx: el.landingFx || 'none',
    accentColor: accent,
  });

  const displayMain = mainCount.displayValue;
  const displayCompare = rawCompare ? compareCount.displayValue : '';

  // ── Badge details (Đã xóa badge "THỐNG KÊ" mặc định) ─────────────────────
  let BadgeIcon = IconStat;
  let badgeText = '';
  if (el.statBadgeText && !el.statBadgeText.toUpperCase().includes('THỐNG KÊ')) {
    badgeText = el.statBadgeText;
  } else if (isPositive) {
    BadgeIcon = IconTrendUp;
    badgeText = 'TĂNG TRƯỞNG';
  } else if (isNegative) {
    BadgeIcon = IconTrendDown;
    badgeText = 'SỤT GIẢM';
  } else if (isBreakthrough) {
    BadgeIcon = IconBreakthrough;
    badgeText = 'ĐỘT PHÁ';
  }

  // ── Badge & Line Flags ─────────────────────────────────────────────────────
  const showBadge = (el.statShowBadge !== false) && Boolean(badgeText);
  const showLine = el.statShowLine !== false;

  // ── Dynamic font sizing (Balanced Golden Ratio) ────────────────────────────
  const BADGE_H = showBadge ? 26 : 0;
  const LABEL_H = 22;
  const GAP_TOTAL = 12;
  const allocatedH = el.height || 150;
  const numberZone = Math.max(48, allocatedH - BADGE_H - LABEL_H - GAP_TOTAL);
  let numberFontSize = Math.round(numberZone * 0.94);
  numberFontSize = Math.max(46, Math.min(92, numberFontSize));

  if (el.fontSize && el.fontSize >= 36) {
    numberFontSize = Math.max(40, Math.min(120, el.fontSize));
  }

  const fullTextLength = displayMain.length;
  if (fullTextLength > 11)     numberFontSize = Math.round(numberFontSize * 0.65);
  else if (fullTextLength > 7) numberFontSize = Math.round(numberFontSize * 0.80);
  else if (fullTextLength > 5) numberFontSize = Math.round(numberFontSize * 0.90);

  // For compare mode, shrink both sides slightly
  const compareFontSize = Math.round(numberFontSize * 0.82);

  // ── Render sub-components ──────────────────────────────────────────────────

  /** Renders a single big number (prefix + number + suffix) */
  const renderBigNumber = (displayValue: string, fontSize: number, accentOverride?: string, landingStyle?: React.CSSProperties) => {
    const ac = accentOverride || accent;
    // Split prefix/suffix from animated string
    const numMatch = displayValue.match(/([\+\-]?[0-9,.]+)/);
    if (!numMatch) {
      return (
        <span style={{ fontSize, fontWeight: 900, color: numberColor,
          fontFamily: el.fontFamily || 'Be Vietnam Pro, sans-serif',
          textShadow: `0 0 36px ${mixColor(ac, 47)}, var(--text-depth, 0 12px 30px rgba(0,0,0,0.9))`,
          letterSpacing: '-3px',
          ...landingStyle }}>
          {displayValue}
        </span>
      );
    }

    const prefixPart = displayValue.slice(0, numMatch.index ?? 0);
    const numPart = numMatch[1];
    const suffixPart = displayValue.slice((numMatch.index ?? 0) + numPart.length);

    const unitSize = Math.max(22, fontSize * 0.48);

    return (
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 1, lineHeight: 0.9, ...landingStyle }}>
        {prefixPart && (
          <span style={{ fontSize: unitSize, fontWeight: 900, color: ac,
            fontFamily: 'Inter, sans-serif', textShadow: `0 0 18px ${mixColor(ac, 53)}`, marginRight: 1 }}>
            {prefixPart}
          </span>
        )}
        <span style={{ fontSize, fontWeight: 900, color: numberColor,
          fontFamily: el.fontFamily || 'Be Vietnam Pro, sans-serif',
          textShadow: `0 0 36px ${mixColor(ac, 47)}, var(--text-depth, 0 12px 30px rgba(0,0,0,0.9))`,
          letterSpacing: '-3px' }}>
          {numPart}
        </span>
        {suffixPart && (
          <span style={{ fontSize: unitSize, fontWeight: 900, color: ac,
            fontFamily: 'Inter, sans-serif', textShadow: `0 0 18px ${mixColor(ac, 53)}`, marginLeft: 1 }}>
            {suffixPart}
          </span>
        )}
      </div>
    );
  };

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      <div
        style={{
          width: w,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box',
          position: 'relative',
          gap: 4,
          pointerEvents: 'none',
        }}
      >
      {/* 1. Radial Glow Aura (GPU-Optimized Multi-Stop, 0ms blur overhead) */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: Math.min(w * 1.1, 320),
          height: 220,
          background: `radial-gradient(circle, ${mixColor(accent, 27)} 0%, ${mixColor(accent, 8)} 45%, transparent 72%)`,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* 2. Trend Badge (SVG icon — no emoji) */}
      {showBadge && (
        <div
          style={{
            zIndex: 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 12px 4px 10px',
            borderRadius: 20,
            backgroundColor: `${mixColor(accent, 9)}`,
            border: `1.5px solid ${mixColor(accent, 33)}`,
            fontSize: 10.5,
            fontWeight: 800,
            color: accent,
            letterSpacing: 0.8,
            textTransform: 'uppercase' as const,
            fontFamily: 'Inter, sans-serif',
            boxShadow: `0 0 16px ${mixColor(accent, 19)}`,
          }}
        >
          <BadgeIcon />
          <span>{badgeText}</span>
        </div>
      )}

      {/* 3a. SINGLE mode: 1 big number */}
      {statLayout === 'single' && (
        <div style={{ zIndex: 1, margin: '4px 0 6px 0' }}>
          {renderBigNumber(displayMain, numberFontSize, undefined, mainCount.landingStyle)}
        </div>
      )}

      {/* 3b. COMPARE mode: A  ·VS·  B */}
      {statLayout === 'compare' && (
        <div
          style={{
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            margin: '4px 0 2px 0',
            width: '100%',
          }}
        >
          {/* Left number */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            {renderBigNumber(displayMain, compareFontSize, accent, mainCount.landingStyle)}
            {el.statLabel && (
              <span style={{ fontSize: 9.5, fontWeight: 700, color: `${mixColor(accent, 80)}`, letterSpacing: 0.6,
                textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>
              {el.statLabel}
              </span>
            )}
          </div>

          {/* VS divider */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0 }}>
            <div style={{ width: 1, height: compareFontSize * 0.38, background: 'rgba(255,255,255,0.2)' }} />
            <span style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.5)',
              letterSpacing: 1.5, fontFamily: 'Inter, sans-serif' }}>VS</span>
            <div style={{ width: 1, height: compareFontSize * 0.38, background: 'rgba(255,255,255,0.2)' }} />
          </div>

          {/* Right number */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            {displayCompare
              ? renderBigNumber(displayCompare, compareFontSize, 'var(--chart-negative, #FF3366)', compareCount.landingStyle)
              : <span style={{ fontSize: compareFontSize * 0.5, color: 'rgba(255,255,255,0.3)' }}>—</span>
            }
            {el.statCompareLabel && (
              <span style={{ fontSize: 9.5, fontWeight: 700, color: readableTint('var(--chart-negative, #FF3366)'), letterSpacing: 0.6,
                textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>
                {el.statCompareLabel}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 3c. BEFORE-AFTER mode: Trước → Sau */}
      {statLayout === 'before-after' && (
        <div
          style={{
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            margin: '4px 0 2px 0',
            width: '100%',
          }}
        >
          {/* Before */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.5)',
              letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>
              {el.statBeforeLabel || 'TRƯỚC'}
            </span>
            {renderBigNumber(displayMain, compareFontSize, 'rgba(255,255,255,0.55)', mainCount.landingStyle)}
          </div>

          {/* Arrow */}
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </div>

          {/* After */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: `${mixColor(accent, 73)}`,
              letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>
              {el.statAfterLabel || 'SAU'}
            </span>
            {displayCompare
              ? renderBigNumber(displayCompare, compareFontSize, accent, compareCount.landingStyle)
              : <span style={{ fontSize: compareFontSize * 0.5, color: 'rgba(255,255,255,0.3)' }}>—</span>
            }
          </div>
        </div>
      )}

      {/* 4. Label + Subtitle */}
      <div
        style={{
          zIndex: 1,
          width: '100%',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          padding: '0 8px',
          boxSizing: 'border-box',
        }}
      >
        {/* Only show single-mode label separately; compare/before-after inline labels above */}
        {statLayout === 'single' && (
          <div style={{
            fontSize: labelFontSize,
            fontWeight: 800,
            color: labelColor,
            letterSpacing: 1.2,
            textTransform: 'uppercase' as const,
            fontFamily: el.fontFamily || 'Be Vietnam Pro, sans-serif',
            lineHeight: 1.35,
            wordBreak: 'break-word' as const,
            textShadow: '0 2px 12px rgba(0,0,0,0.9)',
          }}>
            {label}
          </div>
        )}

        {subtitle && (
          <div style={{
            fontSize: 11,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.68)',
            fontFamily: 'Inter, sans-serif',
            letterSpacing: 0.4,
            lineHeight: 1.25,
            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
          }}>
            {subtitle}
          </div>
        )}

        {/* 5. Accent Gradient Line (upgraded from plain white) */}
        {showLine && (
          <div style={{
            width: Math.min(w * 0.55, 120),
            height: 1.5,
            background: `linear-gradient(90deg, transparent 0%, ${mixColor(accent, 53)} 20%, ${accent} 50%, ${mixColor(accent, 53)} 80%, transparent 100%)`,
            marginTop: 4,
            borderRadius: 1,
            boxShadow: `0 0 8px ${mixColor(accent, 33)}`,
          }} />
        )}
      </div>
      </div>
    </RemotionElementWrapper>
  );
};
