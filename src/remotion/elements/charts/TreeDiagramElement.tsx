import { RemotionElementWrapper } from '../core/RemotionElementWrapper';
import React, { useMemo } from 'react';
import { spring, interpolate } from 'remotion';
import { AdvElementProps } from '../types';
import { renderUniversalIcon } from '../../utils/icons';
import { mixColor, readableTint } from '../../utils/rich-text-parser';
import { DEFAULT_TREE_DATA, DEFAULT_TREE_TITLE } from '@/config/widgetDefaults';

export const TreeDiagramElement: React.FC<AdvElementProps> = ({ 
  el, 
  computedStyle, positionStyle, frame, 
  fps, 
  delayFrames = 0 
}) => {
  const w = el.width || 336;
  const accent = el.accentColor || '#00D4FF';
  const radius = el.radius !== undefined ? el.radius : 16;

  const seriesFallbacks = [
    'var(--chart-series-1, #00D4FF)',
    'var(--chart-series-2, #00FF88)',
    'var(--chart-series-3, #FFB800)',
    'var(--chart-series-4, #FF3366)',
    'var(--chart-series-5, #BEFF01)',
  ];

  const treeData = useMemo(() => {
    return el.treeData || { ...DEFAULT_TREE_DATA, title: el.content || DEFAULT_TREE_DATA.title };
  }, [el.treeData, el.content]);

  const branches = useMemo(() => {
    return treeData.branches && treeData.branches.length > 0 ? treeData.branches : DEFAULT_TREE_DATA.branches;
  }, [treeData.branches]);

  const padX = 14;
  const contentW = w - padX * 2;
  const svgH = Math.max(36, 28 + branches.length * 3);
  const rootH = 42;
  const targetGap = 7;

  // 60FPS Memoized Branch Curve Coordinates
  const branchCurves = useMemo(() => {
    const startX = contentW / 2;
    const count = branches.length;
    return branches.map((b, i) => {
      // Spread evenly across width
      const endX = count === 1 
        ? startX 
        : 20 + ((contentW - 40) / (count - 1)) * i;
      
      const pathD = `M ${startX} 0 C ${startX} ${svgH * 0.4}, ${endX} ${svgH * 0.6}, ${endX} ${svgH}`;
      return {
        startX,
        endX,
        pathD,
        color: b.color || seriesFallbacks[i % seriesFallbacks.length] || accent,
      };
    });
  }, [contentW, branches, svgH, accent]);

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      <div style={{ width: w,
        backgroundColor: el.bgColor || 'var(--surface-1, rgba(10, 16, 28, 0.95))',
        border: `1px solid var(--border, ${mixColor(accent, 27)})`,
        borderRadius: radius,
        padding: '12px 14px',
        boxShadow: `var(--shadow-md, 0 8px 32px rgba(0, 0, 0, 0.6))`,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        overflow: 'hidden',
        gap: 6,
      }}
    >
      {/* 1. Header with SVG Tree Icon */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
          paddingBottom: 6,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', minWidth: 0 }}>
          {/* Clean SVG Branching / Tree Icon */}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="5" r="3" />
            <line x1="12" y1="8" x2="12" y2="14" />
            <path d="M5 21a7 7 0 0 1 14 0" />
            <polyline points="7 14 12 14 17 14" />
          </svg>
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 800,
              color: 'var(--text, #FFFFFF)',
              fontFamily: el.fontFamily || 'Be Vietnam Pro, sans-serif',
              letterSpacing: 0.3,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {treeData.title || el.content || DEFAULT_TREE_TITLE}
          </span>
        </div>
      </div>

      {/* 2. Main Tree Flow Container */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: 2,
        }}
      >
        {/* Top Root Node Card */}
        <div
          style={{
            width: '60%',
            height: rootH,
            backgroundColor: 'var(--surface-2, rgba(255, 255, 255, 0.04))',
            border: `1.5px solid ${accent}`,
            borderRadius: 10,
            padding: '4px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            boxShadow: `0 0 16px ${mixColor(accent, 15)}`,
            zIndex: 3,
            boxSizing: 'border-box',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            {renderUniversalIcon(treeData.rootNode?.icon || 'bot', accent, 16)}
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: 'var(--text, #FFFFFF)',
              fontFamily: 'Be Vietnam Pro, sans-serif',
              letterSpacing: 0.5,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {treeData.rootNode?.label || 'ROOT NODE'}
          </span>
        </div>

        {/* SVG Connecting Branches */}
        <svg
          style={{
            width: contentW,
            height: svgH,
            pointerEvents: 'none',
            display: 'block',
            marginTop: -2,
            marginBottom: -2,
            zIndex: 2,
            overflow: 'visible',
          }}
        >
          {branchCurves.map((b, i) => {
            const lineSpring = spring({
              fps,
              frame: Math.max(0, frame - delayFrames - i * 4),
              config: { damping: 14, stiffness: 100 },
            });

            return (
              <g key={i}>
                <path
                  d={b.pathD}
                  fill="none"
                  stroke={b.color}
                  strokeWidth={1.8}
                  strokeDasharray="4 3"
                  opacity={lineSpring * 0.85}
                />
                {/* Branch Endpoint Dot */}
                <circle
                  cx={b.endX}
                  cy={svgH}
                  r={2.5}
                  fill={b.color}
                  opacity={lineSpring}
                />
              </g>
            );
          })}
        </svg>

        {/* Bottom Branch Cards */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: targetGap,
            zIndex: 3,
          }}
        >
          {branches.map((b, i) => {
            const branchSpring = spring({
              fps,
              frame: Math.max(0, frame - delayFrames - i * 4 - 3),
              config: { damping: 14 },
            });

            const branchColor = b.color || seriesFallbacks[i % seriesFallbacks.length] || accent;

            return (
              <div
                key={i}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--surface-2, rgba(255, 255, 255, 0.03))',
                  border: `1px solid ${mixColor(branchColor, 20)}`,
                  borderRadius: 8,
                  padding: '7px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  opacity: branchSpring,
                  transform: `translateY(${interpolate(branchSpring, [0, 1], [10, 0])}px)`,
                  boxSizing: 'border-box',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
                }}
              >
                {/* Group Title with Color Indicator Dot */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: branchColor,
                      boxShadow: `0 0 6px ${branchColor}`,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 800,
                      color: readableTint(branchColor),
                      fontFamily: 'Be Vietnam Pro, sans-serif',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {b.group}
                  </span>
                </div>

                {/* Sub items tag pills */}
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {(b.items || []).map((item, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: 9.5,
                        fontWeight: 700,
                        color: 'var(--text, #FFFFFF)',
                        backgroundColor: 'var(--surface-3, rgba(255, 255, 255, 0.08))',
                        border: '1px solid var(--border, rgba(255, 255, 255, 0.12))',
                        padding: '2px 6px',
                        borderRadius: 4,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
    </RemotionElementWrapper>
  );
};
