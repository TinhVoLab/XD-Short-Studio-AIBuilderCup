import React from 'react';
import { spring, interpolate } from 'remotion';
import { AdvElementProps } from '../types';
import { BranchingFlowData, BranchingFlowNode } from '@/types/scene';
import { renderUniversalIcon } from '../../utils/icons';
import { calculateElementDynamicHeight } from '@/config/layoutRegistry';

export const BranchingFlowElement: React.FC<AdvElementProps> = ({
  el,
  computedStyle,
  frame = 0,
  fps = 30,
  delayFrames = 0,
}) => {
  const w = el.width || 360;
  const h = el.height || calculateElementDynamicHeight(el);
  const accent = el.accentColor || 'var(--accent, #00D4FF)';
  const bgColor = el.bgColor || 'var(--surface-1, rgba(10, 16, 28, 0.8))';
  const radius = el.radius !== undefined ? el.radius : 10;

  const data: BranchingFlowData = el.branchingFlowData || {
    rootNode: { id: 'root', label: 'API Gateway', subLabel: 'Load Balancer', icon: 'globe' },
    childNodes: [
      { id: 'c1', label: 'Auth Server', subLabel: 'Port 8081', icon: 'lock' },
      { id: 'c2', label: 'AI Worker', subLabel: 'LLM Agent', icon: 'brain' },
      { id: 'c3', label: 'Database', subLabel: 'PostgreSQL', icon: 'database' },
    ],
  };

  const rootNode: BranchingFlowNode = data.rootNode || {
    id: 'root',
    label: 'API Gateway',
    subLabel: 'Load Balancer',
    icon: 'globe',
  };

  const childNodes: BranchingFlowNode[] =
    data.childNodes && data.childNodes.length > 0
      ? data.childNodes
      : [
          { id: 'c1', label: 'Auth Server', subLabel: 'Port 8081', icon: 'lock' },
          { id: 'c2', label: 'AI Worker', subLabel: 'LLM Agent', icon: 'brain' },
          { id: 'c3', label: 'Database', subLabel: 'PostgreSQL', icon: 'database' },
        ];

  const wireColor = data.wireColor || 'var(--chart-grid, rgba(255, 255, 255, 0.2))';
  const packetColor = data.packetColor || accent;
  const isVertical = data.layout === 'vertical';

  const numChildren = childNodes.length;

  // HORIZONTAL PARAMS
  const rootW_H = Math.min(115, w * 0.32);
  const rootH_H = Math.min(65, h * 0.3);
  const childW_H = Math.min(130, w * 0.38);
  const childH_H = Math.min(52, (h - (numChildren - 1) * 12 - 24) / numChildren);

  // VERTICAL PARAMS
  const rootW_V = Math.min(180, w * 0.6);
  const rootH_V = Math.min(60, h * 0.25);
  const childW_V = Math.min(100, (w - (numChildren - 1) * 8 - 24) / numChildren);
  const childH_V = Math.min(65, h * 0.35);

  const rootW = isVertical ? rootW_V : rootW_H;
  const rootH = isVertical ? rootH_V : rootH_H;
  const childW = isVertical ? childW_V : childW_H;
  const childH = isVertical ? childH_V : childH_H;

  // Root Placement
  const rootLeft = isVertical ? w / 2 - rootW / 2 : 12;
  const rootTop = isVertical ? 12 : h / 2 - rootH / 2;
  const rootRightEdge = rootLeft + rootW;
  const rootBottomEdge = rootTop + rootH;
  const rootXCenter = rootLeft + rootW / 2;
  const rootYCenter = rootTop + rootH / 2;

  // Children Placement
  const getChildCenter = (index: number) => {
    if (isVertical) {
      if (numChildren <= 1) return { cx: w / 2, cy: h - 12 - childH / 2 };
      const totalW = numChildren * childW + (numChildren - 1) * 8;
      const startX = (w - totalW) / 2 + childW / 2;
      return { cx: startX + index * (childW + 8), cy: h - 12 - childH / 2 };
    } else {
      if (numChildren <= 1) return { cx: w - 12 - childW / 2, cy: h / 2 };
      const totalH = numChildren * childH + (numChildren - 1) * 12;
      const startY = (h - totalH) / 2 + childH / 2;
      return { cx: w - 12 - childW / 2, cy: startY + index * (childH + 12) };
    }
  };

  const childLeftEdge = w - 12 - childW; // used for horiz
  const childTopEdge = h - 12 - childH; // used for vert

  // Branch Junction Point
  const branchX = isVertical ? 0 : rootRightEdge + (childLeftEdge - rootRightEdge) * 0.45;
  const branchY = isVertical ? rootBottomEdge + (childTopEdge - rootBottomEdge) * 0.45 : 0;

  // Animation Cycle
  const cycleFrames = 60; // 2s cycle
  const loopFrame = Math.max(0, frame - delayFrames) % cycleFrames;
  const progress = Math.max(0, loopFrame / cycleFrames);

  const rootSpring = spring({
    fps,
    frame: Math.max(0, frame - delayFrames),
    config: { damping: 14, stiffness: 100 },
  });

  return (
    <div
      style={{
        ...computedStyle,
        width: w,
        height: h,
        // position do computedStyle quyết định (absolute) — xem tests/unit/elementPositioning.test.ts
        boxSizing: 'border-box',
      }}
    >
      {/* ── BACKGROUND SVG: ORTHOGONAL WIRES & GLOWING PACKETS ── */}
      <svg
        width={w}
        height={h}
        style={{ position: 'absolute', top: 0, left: 0, zIndex: 0, pointerEvents: 'none' }}
      >
        {/* Trunk wire from Root to Junction */}
        <line
          x1={isVertical ? rootXCenter : rootRightEdge}
          y1={isVertical ? rootBottomEdge : rootYCenter}
          x2={isVertical ? rootXCenter : branchX}
          y2={isVertical ? branchY : rootYCenter}
          stroke={wireColor}
          strokeWidth={2}
          strokeDasharray="4 4"
        />

        {/* Junction Point Indicator */}
        <circle
          cx={isVertical ? rootXCenter : branchX}
          cy={isVertical ? branchY : rootYCenter}
          r={3}
          fill={wireColor}
        />

        {/* Branches to each child */}
        {childNodes.map((_, i) => {
          const cCenter = getChildCenter(i);
          return (
            <g key={`branch-wire-${i}`}>
              {/* Segment 1: Junction to Branch Axis */}
              <line
                x1={isVertical ? rootXCenter : branchX}
                y1={isVertical ? branchY : rootYCenter}
                x2={isVertical ? cCenter.cx : branchX}
                y2={isVertical ? branchY : cCenter.cy}
                stroke={wireColor}
                strokeWidth={2}
                strokeDasharray="4 4"
              />
              {/* Segment 2: Branch Axis into Child */}
              <line
                x1={isVertical ? cCenter.cx : branchX}
                y1={isVertical ? branchY : cCenter.cy}
                x2={isVertical ? cCenter.cx : childLeftEdge}
                y2={isVertical ? childTopEdge : cCenter.cy}
                stroke={wireColor}
                strokeWidth={2}
                strokeDasharray="4 4"
              />
            </g>
          );
        })}

        {/* ── PACKET FLOW ANIMATION (Synchronized Split) ── */}
        {childNodes.map((_, i) => {
          const cCenter = getChildCenter(i);

          const d1 = isVertical
            ? Math.max(0.1, branchY - rootBottomEdge)
            : Math.max(0.1, branchX - rootRightEdge);
          const d2 = isVertical
            ? Math.abs(cCenter.cx - rootXCenter)
            : Math.abs(cCenter.cy - rootYCenter);
          const d3 = isVertical
            ? Math.max(0.1, childTopEdge - branchY)
            : Math.max(0.1, childLeftEdge - branchX);

          const totalD = d1 + d2 + d3;
          const p1 = d1 / totalD;
          const p2 = (d1 + d2) / totalD;

          let packetX = isVertical ? rootXCenter : rootRightEdge;
          let packetY = isVertical ? rootBottomEdge : rootYCenter;

          if (progress <= p1) {
            // Stage 1: Traveling along trunk
            const subProg = p1 > 0 ? progress / p1 : 0;
            if (isVertical) {
              packetX = rootXCenter;
              packetY = interpolate(subProg, [0, 1], [rootBottomEdge, branchY], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            } else {
              packetX = interpolate(subProg, [0, 1], [rootRightEdge, branchX], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
              packetY = rootYCenter;
            }
          } else if (progress <= p2) {
            // Stage 2: Splitting along branch
            const subProg = p2 > p1 ? (progress - p1) / (p2 - p1) : 0;
            if (isVertical) {
              packetX = interpolate(subProg, [0, 1], [rootXCenter, cCenter.cx], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
              packetY = branchY;
            } else {
              packetX = branchX;
              packetY = interpolate(subProg, [0, 1], [rootYCenter, cCenter.cy], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            }
          } else {
            // Stage 3: Entering child node
            const subProg = 1 > p2 ? (progress - p2) / (1 - p2) : 0;
            if (isVertical) {
              packetX = cCenter.cx;
              packetY = interpolate(subProg, [0, 1], [branchY, childTopEdge], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            } else {
              packetX = interpolate(subProg, [0, 1], [branchX, childLeftEdge], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
              packetY = cCenter.cy;
            }
          }

          const packetOpacity = interpolate(progress, [0, 0.08, 0.92, 1], [0, 1, 1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          return (
            <g key={`branch-packet-${i}`} opacity={packetOpacity}>
              {/* Lightweight SVG Halo */}
              <circle
                cx={packetX}
                cy={packetY}
                r={isVertical ? 7 : 8}
                fill={packetColor}
                opacity={0.25}
              />
              {/* Inner packet point */}
              <circle
                cx={packetX}
                cy={packetY}
                r={isVertical ? 3 : 3.5}
                fill={packetColor}
              />
            </g>
          );
        })}
      </svg>

      {/* ── ROOT NODE ── */}
      <div
        style={{
          position: 'absolute',
          left: rootLeft,
          top: rootTop,
          width: rootW,
          height: rootH,
          backgroundColor: bgColor,
          border: `1.5px solid ${accent}`,
          borderRadius: radius,
          display: 'flex',
          flexDirection: isVertical ? 'row' : 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isVertical ? 8 : 2,
          padding: '6px 8px',
          boxSizing: 'border-box',
          zIndex: 1,
          opacity: interpolate(rootSpring, [0, 1], [0, 1]),
          transform: `scale(${interpolate(rootSpring, [0, 1], [0.8, 1])})`,
          boxShadow: `var(--shadow-md, 0 6px 20px rgba(0,0,0,0.5))`,
          textAlign: 'center',
        }}
      >
        {rootNode.icon && (
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            {renderUniversalIcon(rootNode.icon, accent, isVertical ? 20 : 16)}
          </span>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: isVertical ? 'flex-start' : 'center' }}>
          <span
            style={{
              fontSize: isVertical ? 13 : 11,
              fontWeight: 800,
              color: 'var(--text, #FFF)',
              fontFamily: el.fontFamily || 'Be Vietnam Pro, Inter, sans-serif',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%',
            }}
          >
            {rootNode.label}
          </span>
          {rootNode.subLabel && (
            <span
              style={{
                fontSize: isVertical ? 10 : 8.5,
                fontWeight: 600,
                color: 'var(--text-sub)',
                fontFamily: 'Inter, sans-serif',
                marginTop: 1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
              }}
            >
              {rootNode.subLabel}
            </span>
          )}
        </div>
      </div>

      {/* ── CHILD NODES ── */}
      {childNodes.map((child, i) => {
        const cCenter = getChildCenter(i);
        const childSpring = spring({
          fps,
          frame: Math.max(0, frame - delayFrames - (i + 1) * 7),
          config: { damping: 14, stiffness: 100 },
        });

        return (
          <div
            key={child.id || `child-${i}`}
            style={{
              position: 'absolute',
              left: isVertical ? cCenter.cx - childW / 2 : undefined,
              right: isVertical ? undefined : 12,
              top: cCenter.cy - childH / 2,
              width: childW,
              height: childH,
              backgroundColor: bgColor,
              border: `1px solid color-mix(in srgb, ${accent} 40%, transparent)`,
              borderRadius: radius,
              display: 'flex',
              flexDirection: isVertical ? 'column' : 'row',
              alignItems: 'center',
              justifyContent: isVertical ? 'center' : 'flex-start',
              padding: isVertical ? '6px' : '4px 10px',
              gap: isVertical ? 4 : 8,
              boxSizing: 'border-box',
              zIndex: 1,
              opacity: interpolate(childSpring, [0, 1], [0, 1]),
              transform: `scale(${interpolate(childSpring, [0, 1], [0.85, 1])})`,
              boxShadow: `0 4px 12px rgba(0,0,0,0.3)`,
              textAlign: isVertical ? 'center' : 'left',
            }}
          >
            {child.icon && (
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {renderUniversalIcon(child.icon, accent, isVertical ? 18 : 15)}
              </span>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: isVertical ? 'center' : 'flex-start', minWidth: 0, flex: 1 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--text, #FFF)',
                  fontFamily: el.fontFamily || 'Be Vietnam Pro, Inter, sans-serif',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  width: '100%',
                }}
              >
                {child.label}
              </span>
              {child.subLabel && (
                <span
                  style={{
                    fontSize: 8.5,
                    fontWeight: 500,
                    color: 'var(--text-sub, rgba(255,255,255,0.65))',
                    fontFamily: 'Inter, sans-serif',
                    marginTop: 1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%',
                  }}
                >
                  {child.subLabel}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
