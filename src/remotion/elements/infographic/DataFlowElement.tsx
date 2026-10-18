import React, { useMemo } from 'react';
import { spring, interpolate } from 'remotion';
import { AdvElementProps } from '../types';
import { DataFlowData, DataFlowNode } from '@/types/scene';
import { renderUniversalIcon } from '../../utils/icons';
import { mixColor } from '../../utils/rich-text-parser';

export const DataFlowElement: React.FC<AdvElementProps> = ({
  el,
  computedStyle,
  frame = 0,
  fps = 30,
  delayFrames = 0,
}) => {
  const isVertical = el.dataFlowData?.layout === 'vertical' || el.height > el.width * 1.2;
  const w = el.width || (isVertical ? 260 : 400);
  const h = el.height || (isVertical ? 360 : 120);
  const accent = el.accentColor || 'var(--accent, #00D4FF)';
  const bgColor = el.bgColor || 'var(--surface-1, rgba(10, 16, 28, 0.75))';
  const radius = el.radius !== undefined ? el.radius : 12;

  // Retrieve dynamic nodes
  const dataFlowData: DataFlowData = el.dataFlowData || { nodes: [] };
  const nodes: DataFlowNode[] =
    dataFlowData.nodes && dataFlowData.nodes.length > 0
      ? dataFlowData.nodes
      : [
          { id: '1', label: 'User Request', icon: 'user', subLabel: 'Client App' },
          { id: '2', label: 'AI Processing', icon: 'brain', subLabel: 'Vector DB & RAG' },
          { id: '3', label: 'Response', icon: 'sparkle', subLabel: 'Rendered Output' },
        ];

  const wireColor = dataFlowData.wireColor || 'var(--chart-grid, rgba(255, 255, 255, 0.2))';
  const packetColor = dataFlowData.packetColor || accent;

  // Horizontal Mode Calculations
  const hNodeWidth = Math.min(100, (w - (nodes.length - 1) * 20) / nodes.length);
  const hNodeHeight = h * 0.7;

  // Vertical Stepper Timeline Calculations
  const vTrackX = 28; // Tọa độ X của đường ray chạy dọc bên trái
  const vNodeHeight = Math.min(64, (h - 16) / nodes.length);

  // Coordinate Getters
  const getNodeCenterX = (index: number) => {
    if (isVertical) return vTrackX;
    if (nodes.length <= 1) return w / 2;
    const paddingX = hNodeWidth / 2;
    const availableWidth = w - hNodeWidth;
    return paddingX + (index / (nodes.length - 1)) * availableWidth;
  };

  const getNodeCenterY = (index: number) => {
    if (!isVertical) return h / 2;
    if (nodes.length <= 1) return h / 2;
    const topPad = vNodeHeight / 2;
    const availableHeight = h - vNodeHeight;
    return topPad + (index / (nodes.length - 1)) * availableHeight;
  };

  return (
    <div
      style={{
        ...computedStyle,
        width: w,
        height: h,
        display: 'flex',
        flexDirection: isVertical ? 'column' : 'row',
        alignItems: isVertical ? 'stretch' : 'center',
        justifyContent: 'space-between',
        // position do computedStyle quyết định (absolute) — xem tests/unit/elementPositioning.test.ts
        boxSizing: 'border-box',
      }}
    >
      {/* BACKGROUND SVG: WIRES & PACKETS */}
      <svg
        width={w}
        height={h}
        style={{ position: 'absolute', top: 0, left: 0, zIndex: 0, pointerEvents: 'none' }}
      >
        {/* Draw the wires */}
        {nodes.map((_, i) => {
          if (i === nodes.length - 1) return null;
          return (
            <line
              key={`wire-${i}`}
              x1={getNodeCenterX(i)}
              y1={getNodeCenterY(i)}
              x2={getNodeCenterX(i + 1)}
              y2={getNodeCenterY(i + 1)}
              stroke={wireColor}
              strokeWidth={2}
              strokeDasharray="4 4"
            />
          );
        })}

        {/* Draw the moving packets */}
        {nodes.map((_, i) => {
          if (i === nodes.length - 1) return null;

          // Animation Logic:
          const cycleFrames = 60; // 2 seconds per cycle at 30fps
          const loopFrame = Math.max(0, (frame - delayFrames - i * 15)) % cycleFrames;
          const progress = Math.max(0, loopFrame / cycleFrames); // 0 to 1

          const packetX = interpolate(progress, [0, 1], [getNodeCenterX(i), getNodeCenterX(i + 1)]);
          const packetY = interpolate(progress, [0, 1], [getNodeCenterY(i), getNodeCenterY(i + 1)]);

          // Fade packet out near the ends
          const packetOpacity = interpolate(progress, [0, 0.1, 0.9, 1], [0, 1, 1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          return (
            <g key={`packet-${i}`} opacity={packetOpacity}>
              {/* Outer soft glow halo (0 compute vs CSS filter drop-shadow) */}
              <circle
                cx={packetX}
                cy={packetY}
                r={8}
                fill={packetColor}
                opacity={0.25}
              />
              {/* Core intense bright circle */}
              <circle
                cx={packetX}
                cy={packetY}
                r={3.5}
                fill={packetColor}
              />
            </g>
          );
        })}
      </svg>

      {/* FOREGROUND HTML: NODES */}
      {nodes.map((n, i) => {
        // Step springs stagger the node entry
        const stepSpring = spring({
          fps,
          frame: Math.max(0, frame - delayFrames - i * 7),
          config: { damping: 14, stiffness: 100 },
        });

        const nodeOpacity = interpolate(stepSpring, [0, 1], [0, 1]);
        const nodeScale = interpolate(stepSpring, [0, 1], [0.85, 1]);

        if (isVertical) {
          // --- VERTICAL STEPPER TIMELINE LAYOUT ---
          const nodeCenterY = getNodeCenterY(i);
          return (
            <div
              key={n.id || i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                zIndex: 1,
                opacity: nodeOpacity,
                transform: `scale(${nodeScale}) translateY(${interpolate(stepSpring, [0, 1], [10, 0])}px)`,
                height: vNodeHeight,
                boxSizing: 'border-box',
              }}
            >
              {/* Stepper Node Station Icon (Trạm Mốc bên trái) */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: bgColor,
                  border: `2px solid ${accent}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  flexShrink: 0,
                  boxShadow: `0 0 10px ${mixColor(accent, 19)}`,
                  marginLeft: 10,
                }}
              >
                {renderUniversalIcon(n.icon || 'pin', accent, 16)}
              </div>

              {/* Node Card Information (Khối nội dung bên phải) */}
              <div
                style={{
                  flex: 1,
                  backgroundColor: bgColor,
                  border: `1px solid ${mixColor(accent, 27)}`,
                  borderRadius: radius,
                  padding: '7px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  minWidth: 0,
                  boxShadow: `0 4px 12px rgba(0, 0, 0, 0.4)`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--text, #FFFFFF)',
                      fontFamily: el.fontFamily || 'Be Vietnam Pro, Inter, sans-serif',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {n.label}
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      color: accent,
                      fontFamily: 'Inter, sans-serif',
                      opacity: 0.8,
                    }}
                  >
                    0{i + 1}
                  </span>
                </div>
                {n.subLabel && (
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 500,
                      color: 'var(--text-sub, rgba(255,255,255,0.65))',
                      fontFamily: 'Inter, sans-serif',
                      marginTop: 2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {n.subLabel}
                  </span>
                )}
              </div>
            </div>
          );
        }

        // --- HORIZONTAL STANDARD LAYOUT ---
        return (
          <div
            key={n.id || i}
            style={{
              width: hNodeWidth,
              height: hNodeHeight,
              backgroundColor: bgColor,
              border: `1.5px solid color-mix(in srgb, ${accent} 40%, transparent)`,
              borderRadius: radius,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 4px',
              boxSizing: 'border-box',
              zIndex: 1,
              opacity: nodeOpacity,
              transform: `scale(${nodeScale})`,
              boxShadow: `0 6px 16px rgba(0, 0, 0, 0.3)`,
              textAlign: 'center',
            }}
          >
            {n.icon && (
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                {renderUniversalIcon(n.icon, accent, 18)}
              </span>
            )}
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--text, #FFFFFF)',
                fontFamily: el.fontFamily || 'Be Vietnam Pro, Inter, sans-serif',
                lineHeight: 1.2,
                wordBreak: 'break-word',
              }}
            >
              {n.label}
            </span>
            {n.subLabel && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 500,
                  color: 'var(--text-sub, rgba(255,255,255,0.6))',
                  fontFamily: 'Inter, sans-serif',
                  marginTop: 2,
                }}
              >
                {n.subLabel}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
