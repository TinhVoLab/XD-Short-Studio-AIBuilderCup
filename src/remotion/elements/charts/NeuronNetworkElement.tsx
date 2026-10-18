import { RemotionElementWrapper } from '../core/RemotionElementWrapper';
import React, { useMemo } from 'react';
import { Easing, spring, useVideoConfig } from 'remotion';
import { ElementProps } from '../types';
import { NeuronNetworkData } from '@/types/scene';

export const NeuronNetworkElement: React.FC<ElementProps & { frame: number; fps: number; delayFrames?: number; durFrames?: number }> = ({
  el, computedStyle, positionStyle, frame, delayFrames = 0, durFrames = 50,
}) => {
  const { fps } = useVideoConfig();
  const data: NeuronNetworkData = el.neuronNetworkData || {
    title: 'NEURAL AI CLUSTER',
    status: 'ACTIVE 99.4%',
    coreColor: 'var(--chart-positive, #00FF88)',
    synapseColor: 'var(--chart-series-1, #00D4FF)',
    nodes: [
      { id: 'core', x: 50, y: 50, label: 'AI CORE', color: 'var(--chart-positive, #00FF88)', isCore: true },
      { id: 'n1', x: 12, y: 22, label: 'VISION', color: 'var(--chart-series-1, #00D4FF)' },
      { id: 'n2', x: 88, y: 22, label: 'NLP', color: 'var(--chart-series-2, #00D4FF)' },
      { id: 'n3', x: 10, y: 78, label: 'AUDIO', color: 'var(--accent, #BEFF01)' },
      { id: 'n4', x: 90, y: 78, label: 'LOGIC', color: 'var(--chart-negative, #FF2D78)' },
      { id: 'n5', x: 50, y: 8, label: 'SENSE', color: 'var(--chart-series-3, #00D4FF)' },
      { id: 'n6', x: 50, y: 92, label: 'OUTPUT', color: 'var(--accent, #BEFF01)' },
    ],
    synapses: [
      { fromId: 'core', toId: 'n1', strength: 1 },
      { fromId: 'core', toId: 'n2', strength: 1 },
      { fromId: 'core', toId: 'n3', strength: 1 },
      { fromId: 'core', toId: 'n4', strength: 1 },
      { fromId: 'core', toId: 'n5', strength: 0.8 },
      { fromId: 'core', toId: 'n6', strength: 0.9 },
      { fromId: 'n1', toId: 'n5', strength: 0.6 },
      { fromId: 'n2', toId: 'n5', strength: 0.6 },
      { fromId: 'n3', toId: 'n6', strength: 0.7 },
      { fromId: 'n4', toId: 'n6', strength: 0.7 },
    ]
  };

  const w = el.width || 320;
  const h = el.height || 260;

  const coreColor = data.coreColor || 'var(--chart-positive, #00FF88)';
  const synapseColor = data.synapseColor || 'var(--chart-series-1, #00D4FF)';

  const enterSpr = spring({
    frame: frame - delayFrames,
    fps,
    config: { damping: 14, mass: 0.8, stiffness: 90 },
  });

  const nodes = data.nodes || [];
  const synapses = data.synapses || [];

  // Map nodes to pixel coordinates with auto-normalized bounding box to fill full canvas
  const innerW = w - 24;
  const innerH = h - 46;
  const nodeMap = useMemo(() => {
    const map = new Map<string, { id: string; px: number; py: number; label?: string; color: string; isCore?: boolean }>();
    if (nodes.length === 0) return map;

    // Find bounding box of node coordinates
    let minX = 100, maxX = 0, minY = 100, maxY = 0;
    nodes.forEach(n => {
      if (n.x < minX) minX = n.x;
      if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.y > maxY) maxY = n.y;
    });

    const rangeX = maxX > minX ? maxX - minX : 1;
    const rangeY = maxY > minY ? maxY - minY : 1;
    const padX = 26;
    const padY = 18;

    nodes.forEach(n => {
      // Auto-spread to span across full canvas width and height
      const normX = (n.x - minX) / rangeX;
      const normY = (n.y - minY) / rangeY;

      const px = normX * (innerW - padX * 2) + padX;
      const py = normY * (innerH - padY * 2) + padY;

      map.set(n.id, {
        id: n.id,
        px,
        py,
        label: n.label,
        color: n.color || (n.isCore ? coreColor : synapseColor),
        isCore: n.isCore,
      });
    });
    return map;
  }, [nodes, innerW, innerH, coreColor, synapseColor]);

  // Core pulse ring expansion
  const coreNode = nodes.find(n => n.isCore) || nodes[0];
  const corePos = coreNode ? nodeMap.get(coreNode.id) : null;
  const pulsePhase = (frame * 0.06) % 1;
  const pulseR = 14 + pulsePhase * 28;
  const pulseAlpha = Math.max(0, 1 - pulsePhase);

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      <div style={{
        width: w,
        height: h,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        position: 'relative',
        background: el.showCardBg === false ? 'transparent' : 'var(--surface-1, rgba(6, 12, 22, 0.94))',
        border: el.showCardBg === false ? 'none' : '1px solid var(--border, rgba(0, 212, 255, 0.25))',
        borderRadius: 14,
        boxShadow: el.showCardBg === false ? 'none' : 'var(--shadow-md, 0 8px 32px rgba(0, 0, 0, 0.6)), inset 0 0 16px rgba(0, 212, 255, 0.05)',
        overflow: 'hidden',
        padding: '8px 12px',
      }}>
      {/* Top Cyber Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))',
        paddingBottom: 6,
        marginBottom: 4,
        width: '100%',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: coreColor,
            boxShadow: `0 0 8px ${coreColor}`,
          }} />
          <span style={{
            fontSize: 11,
            fontWeight: 800,
            color: 'var(--text, #FFFFFF)',
            letterSpacing: '0.08em',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}>
            {data.title || 'NEURAL AI CLUSTER'}
          </span>
        </div>

        <div style={{
          fontSize: 9,
          fontWeight: 700,
          color: 'var(--text)',
          fontFamily: 'monospace',
          background: `color-mix(in srgb, ${coreColor} 15%, transparent)`,
          border: `1px solid color-mix(in srgb, ${coreColor} 30%, transparent)`,
          padding: '2px 6px',
          borderRadius: 4,
        }}>
          {data.status || 'ACTIVE 99.4%'}
        </div>
      </div>

      {/* SVG Canvas for Synapse lines and nodes */}
      <svg width={innerW} height={innerH} style={{ overflow: 'visible', width: '100%', flex: 1, display: 'block' }}>

        {/* Synaptic Axons (Connecting lines) */}
        {synapses.map((s, idx) => {
          const from = nodeMap.get(s.fromId);
          const to = nodeMap.get(s.toId);
          if (!from || !to) return null;

          // Electrical impulse packet traveling along the line
          const impulseSpeed = 0.04 + (idx % 3) * 0.02;
          const packetT = ((frame * impulseSpeed + idx * 0.25) % 1);
          const packetX = from.px + (to.px - from.px) * packetT;
          const packetY = from.py + (to.py - from.py) * packetT;

          return (
            <g key={idx}>
              {/* Base synapse line */}
              <line
                x1={from.px}
                y1={from.py}
                x2={to.px}
                y2={to.py}
                stroke={synapseColor}
                strokeWidth={s.strength ? s.strength * 1.5 : 1}
                opacity={0.25 + (s.strength || 1) * 0.2}
                strokeDasharray={idx % 2 === 0 ? 'none' : '3 3'}
              />

              {/* Traveling Electrical Signal Dot (Zero compute halo) */}
              <circle
                cx={packetX}
                cy={packetY}
                r={4}
                fill={synapseColor}
                opacity={0.4}
              />
              <circle
                cx={packetX}
                cy={packetY}
                r={2}
                fill="#FFFFFF"
                opacity={0.95}
              />
            </g>
          );
        })}

        {/* Core Expansion Pulse */}
        {corePos && (
          <circle
            cx={corePos.px}
            cy={corePos.py}
            r={pulseR}
            fill="none"
            stroke={coreColor}
            strokeWidth="1.5"
            opacity={pulseAlpha * 0.6}
          />
        )}

        {/* Nodes */}
        {Array.from(nodeMap.values()).map(n => {
          const isCore = n.isCore;
          const r = isCore ? 9 : 5.5;
          const color = n.color;

          return (
            <g key={n.id}>
              {/* Glow ring */}
              <circle
                cx={n.px}
                cy={n.py}
                r={r + 4}
                fill={color}
                opacity={isCore ? 0.3 : 0.18}
              />

              {/* Main Node Circle */}
              <circle
                cx={n.px}
                cy={n.py}
                r={r}
                fill="var(--surface-1, #060A14)"
                stroke={color}
                strokeWidth={isCore ? 2.5 : 1.8}
              />

              {/* Node Center Core Dot */}
              <circle
                cx={n.px}
                cy={n.py}
                r={r * 0.45}
                fill={color}
              />

              {/* Node Label */}
              {n.label && (
                <text
                  x={n.px}
                  y={n.py + r + 12}
                  textAnchor="middle"
                  fill="var(--text, #FFFFFF)"
                  stroke="var(--surface-1, #060A14)"
                  strokeWidth="3"
                  paintOrder="stroke"
                  fontSize={isCore ? 9 : 8}
                  fontWeight={isCore ? 900 : 700}
                  fontFamily="Inter, system-ui, sans-serif"
                  opacity={0.95}
                  letterSpacing="0.05em"
                >
                  {n.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
    </RemotionElementWrapper>
  );
};
