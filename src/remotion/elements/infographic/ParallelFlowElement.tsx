import React from 'react';
import { spring, interpolate } from 'remotion';
import { AdvElementProps } from '../types';
import { ParallelFlowData, ParallelFlowNode } from '@/types/scene';
import { renderUniversalIcon } from '../../utils/icons';

export const ParallelFlowElement: React.FC<AdvElementProps> = ({
  el,
  computedStyle,
  frame = 0,
  fps = 30,
  delayFrames = 0,
}) => {
  const w = el.width || 360;
  const h = el.height || 260;
  const accent = el.accentColor || 'var(--accent, #00D4FF)';
  const bgColor = el.bgColor || 'var(--surface-1, rgba(10, 16, 28, 0.95))';
  const radius = el.radius !== undefined ? el.radius : 10;

  const data: ParallelFlowData = el.parallelFlowData || {
    inputNode: { id: 'in', label: 'User Request', subLabel: 'Input Payload', icon: 'file' },
    parallelNodes: [
      { id: 'p1', label: 'Verify Auth', subLabel: 'JWT Token', icon: 'lock' },
      { id: 'p2', label: 'AI Inference', subLabel: 'Gemini 2.5', icon: 'brain' },
      { id: 'p3', label: 'Log Audit', subLabel: 'Kafka Stream', icon: 'code' },
    ],
    outputNode: { id: 'out', label: 'Response', subLabel: 'Status 200 OK', icon: 'rocket' },
  };

  const inputNode: ParallelFlowNode = data.inputNode || {
    id: 'in',
    label: 'User Request',
    subLabel: 'Input Payload',
    icon: 'file',
  };

  const parallelNodes: ParallelFlowNode[] =
    data.parallelNodes && data.parallelNodes.length > 0
      ? data.parallelNodes
      : [
          { id: 'p1', label: 'Verify Auth', subLabel: 'JWT Token', icon: 'lock' },
          { id: 'p2', label: 'AI Inference', subLabel: 'Gemini 2.5', icon: 'brain' },
          { id: 'p3', label: 'Log Audit', subLabel: 'Kafka Stream', icon: 'code' },
        ];

  const outputNode: ParallelFlowNode = data.outputNode || {
    id: 'out',
    label: 'Response',
    subLabel: 'Status 200 OK',
    icon: 'rocket',
  };

  const wireColor = data.wireColor || 'var(--chart-grid, rgba(255, 255, 255, 0.2))';
  const packetColor = data.packetColor || accent;
  const isVertical = data.layout === 'vertical';
  const numParallel = parallelNodes.length;

  // ── SIZING PARAMETERS ──
  // Horizontal Layout
  const nodeW_H = Math.min(95, w * 0.26);
  const midW_H = Math.min(105, w * 0.29);
  const nodeH_H = Math.min(56, h * 0.24);
  const midH_H = Math.min(48, (h - (numParallel - 1) * 8 - 20) / numParallel);

  // Vertical Layout
  const nodeW_V = Math.min(150, w * 0.5);
  const midW_V = Math.min(95, (w - (numParallel - 1) * 8 - 20) / numParallel);
  const nodeH_V = Math.min(48, h * 0.19);
  const midH_V = Math.min(65, h * 0.28);

  const startW = isVertical ? nodeW_V : nodeW_H;
  const startH = isVertical ? nodeH_V : nodeH_H;
  const midW = isVertical ? midW_V : midW_H;
  const midH = isVertical ? midH_V : midH_H;
  const endW = startW;
  const endH = startH;

  // ── PLACEMENT COORDINATES ──
  // Input Node
  const inLeft = isVertical ? w / 2 - startW / 2 : 10;
  const inTop = isVertical ? 10 : h / 2 - startH / 2;
  const inRight = inLeft + startW;
  const inBottom = inTop + startH;
  const inCenterX = inLeft + startW / 2;
  const inCenterY = inTop + startH / 2;

  // Output Node
  const outLeft = isVertical ? w / 2 - endW / 2 : w - 10 - endW;
  const outTop = isVertical ? h - 10 - endH : h / 2 - endH / 2;
  const outRight = outLeft + endW;
  const outBottom = outTop + endH;
  const outCenterX = outLeft + endW / 2;
  const outCenterY = outTop + endH / 2;

  // Middle Parallel Nodes Center Coordinates
  const getMidCenter = (idx: number) => {
    if (isVertical) {
      if (numParallel <= 1) return { cx: w / 2, cy: h / 2 };
      const totalW = numParallel * midW + (numParallel - 1) * 8;
      const startX = (w - totalW) / 2 + midW / 2;
      return { cx: startX + idx * (midW + 8), cy: h / 2 };
    } else {
      if (numParallel <= 1) return { cx: w / 2, cy: h / 2 };
      const totalH = numParallel * midH + (numParallel - 1) * 8;
      const startY = (h - totalH) / 2 + midH / 2;
      return { cx: w / 2, cy: startY + idx * (midH + 8) };
    }
  };

  // Branch Junction Coordinates
  const forkX = isVertical ? inCenterX : inRight + (w / 2 - midW / 2 - inRight) * 0.5;
  const forkY = isVertical ? inBottom + (h / 2 - midH / 2 - inBottom) * 0.5 : inCenterY;

  const joinX = isVertical ? outCenterX : (w / 2 + midW / 2) + (outLeft - (w / 2 + midW / 2)) * 0.5;
  const joinY = isVertical ? (h / 2 + midH / 2) + (outTop - (h / 2 + midH / 2)) * 0.5 : outCenterY;

  // Animation Cycle
  const cycleFrames = 75; // 2.5s total cycle
  const loopFrame = Math.max(0, frame - delayFrames) % cycleFrames;
  const progress = Math.max(0, loopFrame / cycleFrames);

  const inSpring = spring({
    fps,
    frame: Math.max(0, frame - delayFrames),
    config: { damping: 14, stiffness: 100 },
  });

  const outSpring = spring({
    fps,
    frame: Math.max(0, frame - delayFrames - 20),
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
      {/* ── BACKGROUND SVG: FORK-JOIN ORTHOGONAL WIRES ── */}
      <svg
        width={w}
        height={h}
        style={{ position: 'absolute', top: 0, left: 0, zIndex: 0, pointerEvents: 'none' }}
      >
        {/* Trunk In: From Input to Fork */}
        <line
          x1={isVertical ? inCenterX : inRight}
          y1={isVertical ? inBottom : inCenterY}
          x2={forkX}
          y2={forkY}
          stroke={wireColor}
          strokeWidth={2}
          strokeDasharray="4 4"
        />

        {/* Junction Point Indicators */}
        <circle cx={forkX} cy={forkY} r={3} fill={wireColor} />
        <circle cx={joinX} cy={joinY} r={3} fill={wireColor} />

        {/* Trunk Out: From Join to Output */}
        <line
          x1={joinX}
          y1={joinY}
          x2={isVertical ? outCenterX : outLeft}
          y2={isVertical ? outTop : outCenterY}
          stroke={wireColor}
          strokeWidth={2}
          strokeDasharray="4 4"
        />

        {/* Parallel Branches (Fork to Middle & Middle to Join) */}
        {parallelNodes.map((_, i) => {
          const m = getMidCenter(i);
          const midLeftEdge = m.cx - midW / 2;
          const midRightEdge = m.cx + midW / 2;
          const midTopEdge = m.cy - midH / 2;
          const midBottomEdge = m.cy + midH / 2;

          return (
            <g key={`parallel-wire-${i}`}>
              {/* --- Fork Stage (Input ➔ Mid Node) --- */}
              {/* Segment A1: Fork to Branch Axis */}
              <line
                x1={forkX}
                y1={forkY}
                x2={isVertical ? m.cx : forkX}
                y2={isVertical ? forkY : m.cy}
                stroke={wireColor}
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
              {/* Segment A2: Branch Axis into Mid Node */}
              <line
                x1={isVertical ? m.cx : forkX}
                y1={isVertical ? forkY : m.cy}
                x2={isVertical ? m.cx : midLeftEdge}
                y2={isVertical ? midTopEdge : m.cy}
                stroke={wireColor}
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />

              {/* --- Join Stage (Mid Node ➔ Output) --- */}
              {/* Segment B1: Out of Mid Node to Join Axis */}
              <line
                x1={isVertical ? m.cx : midRightEdge}
                y1={isVertical ? midBottomEdge : m.cy}
                x2={isVertical ? m.cx : joinX}
                y2={isVertical ? joinY : m.cy}
                stroke={wireColor}
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
              {/* Segment B2: Join Axis to Join Point */}
              <line
                x1={isVertical ? m.cx : joinX}
                y1={isVertical ? joinY : m.cy}
                x2={joinX}
                y2={joinY}
                stroke={wireColor}
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
            </g>
          );
        })}

        {/* ── PACKET FLOW ANIMATION (Synchronized Fork-Join) ── */}
        {parallelNodes.map((_, i) => {
          const m = getMidCenter(i);
          const midLeftEdge = m.cx - midW / 2;
          const midRightEdge = m.cx + midW / 2;
          const midTopEdge = m.cy - midH / 2;
          const midBottomEdge = m.cy + midH / 2;

          // Fork distances:
          const d1 = isVertical ? Math.max(0.1, forkY - inBottom) : Math.max(0.1, forkX - inRight);
          const d2 = isVertical ? Math.abs(m.cx - inCenterX) : Math.abs(m.cy - inCenterY);
          const d3 = isVertical ? Math.max(0.1, midTopEdge - forkY) : Math.max(0.1, midLeftEdge - forkX);
          const forkTotalD = d1 + d2 + d3;

          // Join distances:
          const d4 = isVertical ? Math.max(0.1, joinY - midBottomEdge) : Math.max(0.1, joinX - midRightEdge);
          const d5 = isVertical ? Math.abs(outCenterX - m.cx) : Math.abs(outCenterY - m.cy);
          const d6 = isVertical ? Math.max(0.1, outTop - joinY) : Math.max(0.1, outLeft - joinX);
          const joinTotalD = d4 + d5 + d6;

          // 2 Packet Phases: Phase 1 (0 -> 0.48), Phase 2 (0.52 -> 1.0)
          let packetX = -100;
          let packetY = -100;
          let packetOpacity = 0;

          if (progress < 0.48) {
            // PHASE 1: Traveling from Input to Mid Task
            const subP = progress / 0.48; // 0 to 1
            const p1 = d1 / forkTotalD;
            const p2 = (d1 + d2) / forkTotalD;

            if (subP <= p1) {
              const rP = p1 > 0 ? subP / p1 : 0;
              packetX = isVertical ? inCenterX : interpolate(rP, [0, 1], [inRight, forkX], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
              packetY = isVertical ? interpolate(rP, [0, 1], [inBottom, forkY], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : inCenterY;
            } else if (subP <= p2) {
              const rP = p2 > p1 ? (subP - p1) / (p2 - p1) : 0;
              packetX = isVertical ? interpolate(rP, [0, 1], [inCenterX, m.cx], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : forkX;
              packetY = isVertical ? forkY : interpolate(rP, [0, 1], [inCenterY, m.cy], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            } else {
              const rP = 1 > p2 ? (subP - p2) / (1 - p2) : 0;
              packetX = isVertical ? m.cx : interpolate(rP, [0, 1], [forkX, midLeftEdge], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
              packetY = isVertical ? interpolate(rP, [0, 1], [forkY, midTopEdge], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : m.cy;
            }

            packetOpacity = interpolate(subP, [0, 0.1, 0.9, 1], [0, 1, 1, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
          } else if (progress > 0.52) {
            // PHASE 2: Traveling from Mid Task to Output
            const subP = (progress - 0.52) / 0.48; // 0 to 1
            const p4 = d4 / joinTotalD;
            const p5 = (d4 + d5) / joinTotalD;

            if (subP <= p4) {
              const rP = p4 > 0 ? subP / p4 : 0;
              packetX = isVertical ? m.cx : interpolate(rP, [0, 1], [midRightEdge, joinX], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
              packetY = isVertical ? interpolate(rP, [0, 1], [midBottomEdge, joinY], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : m.cy;
            } else if (subP <= p5) {
              const rP = p5 > p4 ? (subP - p4) / (p5 - p4) : 0;
              packetX = isVertical ? interpolate(rP, [0, 1], [m.cx, outCenterX], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : joinX;
              packetY = isVertical ? joinY : interpolate(rP, [0, 1], [m.cy, outCenterY], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            } else {
              const rP = 1 > p5 ? (subP - p5) / (1 - p5) : 0;
              packetX = isVertical ? outCenterX : interpolate(rP, [0, 1], [joinX, outLeft], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
              packetY = isVertical ? interpolate(rP, [0, 1], [joinY, outTop], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : outCenterY;
            }

            packetOpacity = interpolate(subP, [0, 0.1, 0.9, 1], [0, 1, 1, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
          }

          return (
            <g key={`parallel-packet-${i}`} opacity={packetOpacity}>
              {/* Outer Glow Halo */}
              <circle
                cx={packetX}
                cy={packetY}
                r={6}
                fill={packetColor}
                opacity={0.3}
              />
              {/* Inner Solid Core */}
              <circle
                cx={packetX}
                cy={packetY}
                r={3}
                fill={packetColor}
              />
            </g>
          );
        })}
      </svg>

      {/* ── 1. INPUT NODE (Start / Trigger) ── */}
      <div
        style={{
          position: 'absolute',
          left: inLeft,
          top: inTop,
          width: startW,
          height: startH,
          backgroundColor: bgColor,
          border: `1.5px solid ${accent}`,
          borderRadius: radius,
          display: 'flex',
          flexDirection: isVertical ? 'row' : 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isVertical ? 8 : 2,
          padding: '4px 6px',
          boxSizing: 'border-box',
          zIndex: 1,
          opacity: interpolate(inSpring, [0, 1], [0, 1]),
          transform: `scale(${interpolate(inSpring, [0, 1], [0.85, 1])})`,
          boxShadow: `0 6px 18px rgba(0,0,0,0.5)`,
          textAlign: 'center',
        }}
      >
        {inputNode.icon && (
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            {renderUniversalIcon(inputNode.icon, accent, isVertical ? 17 : 14)}
          </span>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: isVertical ? 'flex-start' : 'center' }}>
          <span
            style={{
              fontSize: isVertical ? 11.5 : 10,
              fontWeight: 800,
              color: 'var(--text, #FFF)',
              fontFamily: el.fontFamily || 'Be Vietnam Pro, Inter, sans-serif',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%',
            }}
          >
            {inputNode.label}
          </span>
          {inputNode.subLabel && (
            <span
              style={{
                fontSize: isVertical ? 9 : 8,
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
              {inputNode.subLabel}
            </span>
          )}
        </div>
      </div>

      {/* ── 2. MIDDLE PARALLEL TASKS (Concurrently Executed) ── */}
      {parallelNodes.map((pNode, i) => {
        const m = getMidCenter(i);
        const pSpring = spring({
          fps,
          frame: Math.max(0, frame - delayFrames - 8 - i * 5),
          config: { damping: 14, stiffness: 100 },
        });

        return (
          <div
            key={pNode.id || `p-${i}`}
            style={{
              position: 'absolute',
              left: m.cx - midW / 2,
              top: m.cy - midH / 2,
              width: midW,
              height: midH,
              backgroundColor: bgColor,
              border: `1px solid color-mix(in srgb, ${accent} 40%, transparent)`,
              borderRadius: radius,
              display: 'flex',
              flexDirection: isVertical ? 'column' : 'row',
              alignItems: 'center',
              justifyContent: isVertical ? 'center' : 'flex-start',
              padding: isVertical ? '4px' : '4px 8px',
              gap: isVertical ? 3 : 6,
              boxSizing: 'border-box',
              zIndex: 1,
              opacity: interpolate(pSpring, [0, 1], [0, 1]),
              transform: `scale(${interpolate(pSpring, [0, 1], [0.85, 1])})`,
              boxShadow: `0 4px 14px rgba(0,0,0,0.3)`,
              textAlign: isVertical ? 'center' : 'left',
            }}
          >
            {pNode.icon && (
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {renderUniversalIcon(pNode.icon, accent, isVertical ? 15 : 13)}
              </span>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: isVertical ? 'center' : 'flex-start', minWidth: 0, flex: 1 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--text, #FFF)',
                  fontFamily: el.fontFamily || 'Be Vietnam Pro, Inter, sans-serif',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  width: '100%',
                }}
              >
                {pNode.label}
              </span>
              {pNode.subLabel && (
                <span
                  style={{
                    fontSize: 8.5,
                    color: 'var(--text-sub, rgba(255,255,255,0.6))',
                    fontFamily: el.fontFamily || 'Inter, sans-serif',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%',
                  }}
                >
                  {pNode.subLabel}
                </span>
              )}
            </div>
          </div>
        );
      })}

      {/* ── OUTPUT MERGE NODE ── */}
      <div
        style={{
          width: isVertical ? '80%' : w * 0.24,
          padding: '10px 12px',
          borderRadius: radius,
          backgroundColor: 'var(--surface-1, #0A0F1D)',
          border: `1.5px solid ${accent}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: isVertical ? 'flex-start' : 'center',
          gap: 8,
          boxSizing: 'border-box',
          zIndex: 1,
          opacity: interpolate(outSpring, [0, 1], [0, 1]),
          transform: `scale(${interpolate(outSpring, [0, 1], [0.8, 1])})`,
          boxShadow: `0 6px 18px rgba(0,0,0,0.4)`,
          textAlign: 'center',
        }}
      >
        {outputNode.icon && (
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            {renderUniversalIcon(outputNode.icon, accent, isVertical ? 17 : 14)}
          </span>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: isVertical ? 'flex-start' : 'center' }}>
          <span
            style={{
              fontSize: isVertical ? 11.5 : 10,
              fontWeight: 800,
              color: 'var(--text, #FFF)',
              fontFamily: el.fontFamily || 'Be Vietnam Pro, Inter, sans-serif',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%',
            }}
          >
            {outputNode.label}
          </span>
          {outputNode.subLabel && (
            <span
              style={{
                fontSize: isVertical ? 9 : 8,
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
              {outputNode.subLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
