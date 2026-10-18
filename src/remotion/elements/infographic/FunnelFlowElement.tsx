import React from 'react';
import { spring, interpolate } from 'remotion';
import { AdvElementProps } from '../types';
import { FunnelFlowData, FunnelStageItem } from '@/types/scene';
import { renderUniversalIcon } from '../../utils/icons';
import { mixColor } from '../../utils/rich-text-parser';

export const FunnelFlowElement: React.FC<AdvElementProps> = ({
  el,
  computedStyle,
  frame = 0,
  fps = 30,
  delayFrames = 0,
}) => {
  const w = el.width || 360;
  const h = el.height || 280;
  const accent = el.accentColor || 'var(--accent, #00D4FF)';
  const bgColor = el.bgColor || 'var(--surface-1, rgba(10, 16, 28, 0.95))';
  const radius = el.radius !== undefined ? el.radius : 8;

  const data: FunnelFlowData = el.funnelFlowData || {
    title: 'PHỄU CHUYỂN ĐỔI VIRAL',
    stages: [
      { id: 's1', label: '1. Tiếp Cận (Traffic)', subLabel: '100.000 Lượt xem', value: '100K', conversionPct: '100%', color: 'var(--chart-series-1, #00D4FF)', icon: 'eye' },
      { id: 's2', label: '2. Quan Tâm (Leads)', subLabel: '12.500 Đăng ký', value: '12.5K', conversionPct: '12.5%', color: 'var(--chart-series-2, #BEFF01)', icon: 'target' },
      { id: 's3', label: '3. Chốt Đơn (Sales)', subLabel: '1.200 Khách hàng', value: '1.2K', conversionPct: '9.6%', color: 'var(--chart-series-3, #FFB800)', icon: 'cart' },
      { id: 's4', label: '4. Khách VIP (Loyal)', subLabel: '240 Hội viên VIP', value: '240', conversionPct: '20%', color: 'var(--chart-series-4, #FF3B30)', icon: 'sparkle' },
    ],
    flowDirection: 'down',
  };

  const stages: FunnelStageItem[] =
    data.stages && data.stages.length > 0
      ? data.stages
      : [
          { id: 's1', label: '1. Tiếp Cận', subLabel: '100K Views', value: '100K', conversionPct: '100%', color: 'var(--chart-series-1, #00D4FF)', icon: 'eye' },
          { id: 's2', label: '2. Quan Tâm', subLabel: '12K Leads', value: '12K', conversionPct: '12%', color: 'var(--chart-series-2, #BEFF01)', icon: 'target' },
          { id: 's3', label: '3. Mua Hàng', subLabel: '1.2K Sales', value: '1.2K', conversionPct: '10%', color: 'var(--chart-series-3, #FFB800)', icon: 'cart' },
        ];

  const wireColor = data.wireColor || 'var(--chart-grid, rgba(255, 255, 255, 0.15))';
  const packetColor = data.packetColor || accent;
  const isUp = data.flowDirection === 'up';
  const numStages = stages.length;

  // Title header height
  const hasTitle = Boolean(data.title && data.title.trim().length > 0);
  const titleH = hasTitle ? 28 : 0;
  const contentH = h - titleH - 12;
  const gap = 6;
  const stageH = Math.max(32, (contentH - (numStages - 1) * gap) / numStages);

  // Math parameters for trapezoid width tapering
  // Top tier width: max available width leaving padding for dropoff indicators
  const maxW = w - 16;
  const minW = Math.max(140, w * 0.46);
  const taperStep = numStages > 1 ? (maxW - minW) / (numStages - 1) : 0;

  // Entrance spring animation
  const animProgress = spring({
    frame: frame - delayFrames,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  // Cyclic photon stream animation (45 frames per cycle)
  const cycleFrames = 45;
  const loopT = interpolate((frame + delayFrames * 2) % cycleFrames, [0, cycleFrames], [0, 1]);

  return (
    <div
      style={{
        ...computedStyle,
        width: w,
        height: h,
        // position do computedStyle quyết định (absolute) — xem tests/unit/elementPositioning.test.ts
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Optional Title Header */}
      {hasTitle && (
        <div
          style={{
            width: '100%',
            height: `${titleH}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '8px',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '3px 12px',
              borderRadius: 20,
              backgroundColor: 'var(--surface-1, rgba(15, 22, 36, 0.92))',
              border: `1px solid var(--border, rgba(255, 255, 255, 0.15))`,
              boxShadow: `0 2px 10px rgba(0,0,0,0.3)`,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 800,
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                color: 'var(--text)',
              }}
            >
              {data.title}
            </span>
            <div
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                backgroundColor: 'var(--chart-positive, #00FF88)',
                boxShadow: '0 0 5px var(--chart-positive, #00FF88)',
              }}
            />
          </div>
        </div>
      )}

      {/* Main Funnel Stages Container */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: isUp ? 'column-reverse' : 'column',
          justifyContent: 'space-between',
          position: 'relative',
          gap: `${gap}px`,
        }}
      >
        {stages.map((stage, idx) => {
          // Dynamic width calculation based on tier order
          const tierIdx = isUp ? numStages - 1 - idx : idx;
          const stageW = maxW - tierIdx * taperStep;
          const stageColor = stage.color || accent;

          // Staggered entrance spring for each tier
          const tierSpring = spring({
            frame: frame - delayFrames - idx * 4,
            fps,
            config: { damping: 15, stiffness: 140 },
          });

          // Wave pulse for active stage
          const isPulse = (Math.floor(frame / 20) % numStages) === idx;

          return (
            <div
              key={stage.id || idx}
              style={{
                width: `${stageW}px`,
                height: `${stageH}px`,
                margin: '0 auto',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 12px',
                boxSizing: 'border-box',
                borderRadius: '6px',
                background: `linear-gradient(90deg, color-mix(in srgb, ${stageColor} 18%, transparent) 0%, var(--surface-1, rgba(20, 28, 45, 0.85)) 40%, var(--surface-1, rgba(20, 28, 45, 0.85)) 70%, color-mix(in srgb, ${stageColor} 22%, transparent) 100%)`,
                border: `1px solid ${isPulse ? stageColor : `color-mix(in srgb, ${stageColor} 40%, transparent)`}`,
                boxShadow: isPulse ? `0 0 12px color-mix(in srgb, ${stageColor} 30%, transparent), inset 0 0 10px color-mix(in srgb, ${stageColor} 15%, transparent)` : `0 2px 8px rgba(0,0,0,0.2)`,
                opacity: tierSpring,
                transform: `scale(${0.9 + tierSpring * 0.1})`,
              }}
            >
              {/* Left Wing: Icon & Label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <span
                  style={{
                    fontSize: '15px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    backgroundColor: `color-mix(in srgb, ${stageColor} 20%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${stageColor} 40%, transparent)`,
                    flexShrink: 0,
                  }}
                >
                  {renderUniversalIcon(stage.icon || 'sparkle', stageColor, 13)}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--text, #FFFFFF)',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      fontFamily: 'Be Vietnam Pro, Inter, sans-serif',
                    }}
                  >
                    {stage.label}
                  </span>
                  {stage.subLabel && (
                    <span
                      style={{
                        fontSize: '9px',
                        color: 'var(--text-sub, rgba(255, 255, 255, 0.55))',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      {stage.subLabel}
                    </span>
                  )}
                </div>
              </div>

              {/* Right Wing: Metric & Conversion Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                {stage.value && (
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 800,
                      color: 'var(--text)',
                    }}
                  >
                    {stage.value}
                  </span>
                )}
                {stage.conversionPct && (
                  <div
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      padding: '2px 5px',
                      borderRadius: '4px',
                      backgroundColor: mixColor(stageColor, 15),
                      color: 'var(--text)',
                      border: `1px solid ${mixColor(stageColor, 38)}`,
                      letterSpacing: '0.3px',
                    }}
                  >
                    {stage.conversionPct}
                  </div>
                )}
              </div>

              {/* Cyber Corner Accents */}
              <div
                style={{
                  position: 'absolute',
                  top: '-1px',
                  left: '-1px',
                  width: '4px',
                  height: '4px',
                  borderTop: `2px solid ${stageColor}`,
                  borderLeft: `2px solid ${stageColor}`,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '-1px',
                  right: '-1px',
                  width: '4px',
                  height: '4px',
                  borderBottom: `2px solid ${stageColor}`,
                  borderRight: `2px solid ${stageColor}`,
                }}
              />
            </div>
          );
        })}

        {/* Central Cascading Photon Stream */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          {/* Dropping Photons along central axis */}
          {[0, 0.33, 0.66].map((offset, pIdx) => {
            const pProgress = (loopT + offset) % 1;
            const py = isUp ? (1 - pProgress) * contentH : pProgress * contentH;
            // Funnel taper width at this height
            const currentTaper = 1 - (py / Math.max(1, contentH)) * 0.45;
            const px = w / 2;

            return (
              <g key={`photon-${pIdx}`}>
                {/* Central Photon */}
                <circle
                  cx={px}
                  cy={py}
                  r={3.2}
                  fill={packetColor}
                  opacity={Math.sin(pProgress * Math.PI) * 0.9}
                />
                <circle
                  cx={px}
                  cy={py}
                  r={6}
                  fill={packetColor}
                  opacity={Math.sin(pProgress * Math.PI) * 0.25}
                />
                {/* Lateral Symmetrical Stream */}
                <circle
                  cx={px - 45 * currentTaper}
                  cy={py}
                  r={2}
                  fill={packetColor}
                  opacity={Math.sin(pProgress * Math.PI) * 0.6}
                />
                <circle
                  cx={px + 45 * currentTaper}
                  cy={py}
                  r={2}
                  fill={packetColor}
                  opacity={Math.sin(pProgress * Math.PI) * 0.6}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
