import React, { useMemo } from 'react';
import { RemotionElementWrapper } from '../core/RemotionElementWrapper';
import { interpolate, spring, useVideoConfig } from 'remotion';
import { ElementProps } from '../types';
import { LifecycleMatrixData } from '@/types/scene';
import { renderUniversalIcon } from '../../utils/icons';
import { mixColor, readableTint } from '../../utils/rich-text-parser';

/** Màu series dùng làm CHỮ: pha 40% --text để đạt ≥ 4.5:1 trên nền card ở mọi palette */

export const LifecycleMatrixElement: React.FC<ElementProps & { frame: number; fps: number; delayFrames?: number; durFrames?: number }> = ({
  el, computedStyle, positionStyle, frame, delayFrames = 0, durFrames = 50,
}) => {
  const { fps } = useVideoConfig();

  const data: LifecycleMatrixData = el.lifecycleMatrixData || {
    title: 'EVALS vs GUARDRAILS vs MONITORING',
    subtitle: 'CONFLATE THEM → CREATE AN OPS GAP',
    activeColumnIndex: 1,
    columns: [
      {
        id: 'col-1',
        stage: 'BEFORE SHIP',
        name: 'EVALS',
        actionVerb: 'MEASURE',
        icon: 'doc',
        metrics: ['quality', 'reliability'],
        question: 'IS IT GOOD?',
        badgeText: 'RELEASE CONFIDENCE',
      },
      {
        id: 'col-2',
        stage: 'DURING RUN',
        name: 'GUARDRAILS',
        actionVerb: 'ENFORCE',
        icon: 'shield',
        metrics: ['policy', 'scope + limits'],
        question: 'IS IT ALLOWED?',
        badgeText: 'RUNTIME CONTROL',
      },
      {
        id: 'col-3',
        stage: 'AFTER DEPLOY',
        name: 'MONITORING',
        actionVerb: 'DETECT',
        icon: 'code',
        metrics: ['drift + cost', 'latency'],
        question: 'IS IT HEALTHY?',
        badgeText: 'PRODUCTION TRUTH',
      }
    ]
  };

  const w = el.width || 330;
  const h = el.height || 390;

  const title = data.title || 'EVALS vs GUARDRAILS vs MONITORING';
  const subtitle = data.subtitle;
  const activeIdx = data.activeColumnIndex !== undefined ? data.activeColumnIndex : 1;
  const columns = data.columns || [];

  // 1. Entrance Springs with natural organic pacing
  const titleSpring = spring({
    frame: frame - delayFrames,
    fps,
    config: { damping: 14, stiffness: 85 },
  });

  const barSpring = spring({
    frame: frame - delayFrames - 5,
    fps,
    config: { damping: 14, stiffness: 80 },
  });

  // Active step radar pulse
  const radarPhase = (frame * 0.08) % 1;
  const radarR = 4 + radarPhase * 10;
  const radarAlpha = Math.max(0, 1 - radarPhase);

  const seriesFallbacks = [
    'var(--chart-series-1, #00D4FF)',
    'var(--chart-series-2, #FF6B00)',
    'var(--chart-series-3, #00FF88)',
    'var(--chart-series-4, #FF3366)',
    'var(--chart-series-5, #BEFF01)',
  ];

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      <div
        style={{
          width: w,
          height: h,
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          position: 'relative',
          background: 'var(--surface-1, rgba(6, 10, 18, 0.96))',
          border: '1px solid var(--border, rgba(255, 255, 255, 0.1))',
          borderRadius: 14,
          overflow: 'hidden',
          padding: '12px 10px 10px 10px',
        }}
      >
        {/* ── 1. Header Section ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            marginBottom: 8,
            opacity: interpolate(titleSpring, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(titleSpring, [0, 1], [-8, 0])}px)`,
          }}
        >
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 900,
              color: 'var(--text, #FFFFFF)',
              letterSpacing: '0.04em',
              fontFamily: el.fontFamily || 'var(--font-sans, inherit)',
              textTransform: 'uppercase',
              lineHeight: 1.25,
            }}
          >
            {title}
          </div>

          {subtitle && (
            <div
              style={{
                fontSize: 8.5,
                color: 'var(--text-sub, rgba(255, 255, 255, 0.5))',
                fontWeight: 600,
                letterSpacing: '0.08em',
                fontFamily: 'monospace',
                textTransform: 'uppercase',
                marginTop: 3,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        {/* ── 2. Dotted Stepper Timeline Bar ── */}
        <div
          style={{
            width: '100%',
            height: 18,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
            opacity: interpolate(barSpring, [0, 1], [0, 1]),
          }}
        >
          <svg width="100%" height="18" viewBox="0 0 300 18" fill="none" style={{ overflow: 'visible' }}>
            {/* Dotted horizontal line */}
            <line
              x1="30"
              y1="9"
              x2="270"
              y2="9"
              stroke="var(--chart-axis, rgba(255, 255, 255, 0.18))"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />

            {/* Stepper nodes for 3 columns */}
            {columns.map((col, idx) => {
              const nodeX = 50 + idx * 100; // 50, 150, 250
              const isActive = idx === activeIdx;
              const colColor = col.color || seriesFallbacks[idx % seriesFallbacks.length];

              // Node entrance synchronized with column reveal
              const nodeSpring = spring({
                frame: frame - delayFrames - 8 - idx * 10,
                fps,
                config: { damping: 12, stiffness: 100 },
              });

              return (
                <g
                  key={col.id || idx}
                  style={{
                    opacity: interpolate(nodeSpring, [0, 1], [0, 1]),
                    transform: `scale(${interpolate(nodeSpring, [0, 1], [0.6, 1])})`,
                    transformOrigin: `${nodeX}px 9px`,
                  }}
                >
                  {/* Outer radar pulse if active */}
                  {isActive && (
                    <circle
                      cx={nodeX}
                      cy="9"
                      r={radarR}
                      fill="none"
                      stroke={colColor}
                      strokeWidth="1.2"
                      opacity={radarAlpha}
                    />
                  )}

                  {/* Outer ring */}
                  <circle
                    cx={nodeX}
                    cy="9"
                    r={isActive ? 6.5 : 4.5}
                    fill={isActive ? mixColor(colColor, 20) : 'var(--surface-2, rgba(0,0,0,0.5))'}
                    stroke={colColor}
                    strokeWidth={isActive ? 2 : 1}
                  />

                  {/* Center solid core */}
                  <circle
                    cx={nodeX}
                    cy="9"
                    r={isActive ? 3.5 : 2}
                    fill={isActive ? 'var(--text, #FFFFFF)' : colColor}
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* ── 3. 3-Column Lifecycle Cards ── */}
        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 6,
            minHeight: 0,
          }}
        >
          {columns.map((col, idx) => {
            const isActive = idx === activeIdx;
            const colColor = col.color || seriesFallbacks[idx % seriesFallbacks.length];

            // Stagger 10 frames (~0.33s per column) for rhythmic storytelling
            const colSpring = spring({
              frame: frame - delayFrames - 8 - idx * 10,
              fps,
              config: { damping: 13, stiffness: 75 },
            });

            return (
              <div
                key={col.id || idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: 10,
                  padding: '10px 7px',
                  boxSizing: 'border-box',
                  background: isActive
                    ? `linear-gradient(180deg, ${mixColor(colColor, 13)} 0%, var(--surface-1, rgba(10, 16, 26, 0.98)) 100%)`
                    : 'var(--surface-2, rgba(12, 18, 28, 0.65))',
                  border: isActive
                    ? `1.8px solid ${colColor}`
                    : '1px solid var(--border, rgba(255, 255, 255, 0.08))',
                  // Cột không active phân biệt bằng nền/viền, không làm mờ cả cột (chữ --text-sub sẽ tụt dưới 4.5:1)
                  opacity: interpolate(colSpring, [0, 1], [0, 1]),
                  transform: `scale(${interpolate(colSpring, [0, 1], [0.90, 1])}) translateY(${interpolate(colSpring, [0, 1], [16, 0])}px)`,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {/* 1. Stage Top Header */}
                <div
                  style={{
                    fontSize: 8,
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    color: isActive ? readableTint(colColor) : 'var(--text-sub, rgba(255, 255, 255, 0.45))',
                    fontFamily: 'monospace',
                    textTransform: 'uppercase',
                    textAlign: 'center',
                    marginBottom: 4,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {col.stage}
                </div>

                {/* 2. Hero Icon Box (Enlarged & Prominent) */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '4px 0 6px 0',
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: isActive ? mixColor(colColor, 14) : 'var(--surface-3, rgba(255, 255, 255, 0.04))',
                      border: `1px solid ${isActive ? mixColor(colColor, 40) : 'var(--border, rgba(255, 255, 255, 0.08))'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 23,
                    }}
                  >
                    {renderUniversalIcon(col.icon || (idx === 0 ? 'file' : idx === 1 ? 'shield' : 'code'), colColor, 22)}
                  </div>
                </div>

                {/* 3. Name & Action Verb */}
                <div
                  style={{
                    textAlign: 'center',
                    marginBottom: 6,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10.5,
                      fontWeight: 900,
                      color: 'var(--text, #FFFFFF)',
                      letterSpacing: '0.02em',
                      fontFamily: 'monospace',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {col.name}
                  </div>

                  <div
                    style={{
                      fontSize: 9.5,
                      fontWeight: 900,
                      color: readableTint(colColor),
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      fontFamily: '"Be Vietnam Pro", sans-serif',
                      marginTop: 2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {col.actionVerb}
                  </div>
                </div>

                {/* 4. Metrics / Scope List */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2.5,
                    margin: '4px 0 6px 0',
                    padding: '5px 0',
                    borderTop: '1px solid var(--border, rgba(255, 255, 255, 0.06))',
                    borderBottom: '1px solid var(--border, rgba(255, 255, 255, 0.06))',
                  }}
                >
                  {(col.metrics || []).map((m, mIdx) => (
                    <span
                      key={mIdx}
                      style={{
                        fontSize: 8,
                        color: 'var(--text-sub, rgba(255, 255, 255, 0.7))',
                        fontFamily: 'monospace',
                        textAlign: 'center',
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '100%',
                      }}
                    >
                      {m}
                    </span>
                  ))}
                </div>

                {/* 5. Core Question (ASKS) */}
                <div
                  style={{
                    textAlign: 'center',
                    margin: '4px 0 6px 0',
                  }}
                >
                  <div
                    style={{
                      fontSize: 7,
                      fontWeight: 800,
                      color: 'var(--text-sub, rgba(255, 255, 255, 0.4))',
                      fontFamily: 'monospace',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    ASKS
                  </div>
                  <div
                    style={{
                      fontSize: 8.5,
                      fontWeight: 800,
                      color: 'var(--text, #FFFFFF)',
                      fontFamily: 'monospace',
                      marginTop: 2,
                      lineHeight: 1.2,
                    }}
                  >
                    {col.question}
                  </div>
                </div>

                {/* 6. Bottom Conclusion Badge */}
                <div
                  style={{
                    marginTop: 'auto',
                    padding: '5px 3px',
                    borderRadius: 5,
                    background: isActive ? mixColor(colColor, 15) : 'var(--surface-3, rgba(255, 255, 255, 0.03))',
                    border: `1px solid ${isActive ? colColor : 'var(--border, rgba(255, 255, 255, 0.1))'}`,
                    textAlign: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: 7,
                      fontWeight: 800,
                      color: isActive ? 'var(--text, #FFFFFF)' : 'var(--text-sub, rgba(255, 255, 255, 0.6))',
                      fontFamily: 'monospace',
                      textTransform: 'uppercase',
                      letterSpacing: '0.02em',
                      whiteSpace: 'nowrap',
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {col.badgeText}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </RemotionElementWrapper>
  );
};
