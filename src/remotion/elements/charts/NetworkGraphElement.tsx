import { RemotionElementWrapper } from '../core/RemotionElementWrapper';
import React, { useMemo } from 'react';
import { spring } from 'remotion';
import { ElementProps } from '../types';
import { renderUniversalIcon } from '../../utils/icons';
import { mixColor } from '../../utils/rich-text-parser';

interface NetworkNodeItem {
  label: string;
  icon?: string;
  color?: string;
}

const DEFAULT_NODES: NetworkNodeItem[] = [
  { label: 'AI Core', icon: 'brain' },
  { label: 'NLP Engine', icon: 'chat' },
  { label: 'Vision AI', icon: 'eye' },
  { label: 'Database', icon: 'database' },
  { label: 'Security', icon: 'lock' },
  { label: 'Logic Flow', icon: 'code' },
];

export const NetworkGraphElement: React.FC<ElementProps & { 
  frame: number, 
  fps: number, 
  delayFrames?: number, 
  durFrames?: number 
}> = ({ 
  el, 
  computedStyle, positionStyle, frame, 
  fps, 
  delayFrames = 0 
}) => {
  const w = el.width || 280;
  const accentColor = el.accentColor || '#00FF88';

  const title = (el.content !== undefined && el.content !== null) ? String(el.content).trim() : '';
  const hasTitle = Boolean(title);
  const headerH = hasTitle ? 32 : 0;
  const totalH = el.height || (headerH + w);
  const graphH = totalH - headerH;
  const graphSize = Math.min(w, graphH);
  const showCardBg = el.showCardBg !== false && el.bgColor !== 'transparent';

  const rawNodes: NetworkNodeItem[] = useMemo(() => {
    return el.networkNodes && el.networkNodes.length >= 2
      ? el.networkNodes
      : DEFAULT_NODES;
  }, [el.networkNodes]);

  const cx = w / 2;
  const cy = headerH + graphH / 2;
  const orbitRadius = graphSize * 0.35;
  const satelliteCount = Math.max(1, rawNodes.length - 1);

  const seriesFallbacks = [
    accentColor,
    'var(--chart-series-1, #00D4FF)',
    'var(--chart-series-2, #00FF88)',
    'var(--chart-series-3, #FFB800)',
    'var(--chart-series-4, #FF3366)',
    'var(--chart-series-5, #BD00FF)',
  ];

  // 1. Memoize base node layout positions (Calculated once for 60FPS)
  const baseNodes = useMemo(() => {
    return rawNodes.map((n, i) => {
      if (i === 0) {
        return {
          id: i,
          label: n.label,
          icon: n.icon || 'brain',
          color: n.color || accentColor,
          isCenter: true,
          baseX: cx,
          baseY: cy,
          angle: 0,
        };
      }

      const angle = (Math.PI * 2 * (i - 1)) / satelliteCount - Math.PI / 2;
      return {
        id: i,
        label: n.label,
        icon: n.icon || 'zap',
        color: n.color || seriesFallbacks[i % seriesFallbacks.length] || '#00D4FF',
        isCenter: false,
        baseX: cx + Math.cos(angle) * orbitRadius,
        baseY: cy + Math.sin(angle) * orbitRadius,
        angle,
      };
    });
  }, [rawNodes, cx, cy, orbitRadius, satelliteCount, accentColor]);

  // 2. Animate nodes with subtle dynamic float
  const animatedNodes = useMemo(() => {
    return baseNodes.map((n, i) => {
      if (n.isCenter) {
        return { ...n, x: n.baseX, y: n.baseY };
      }

      const floatOffset = Math.sin((frame * 0.06) + i * 1.5) * 4;
      return {
        ...n,
        x: n.baseX,
        y: n.baseY + floatOffset,
      };
    });
  }, [baseNodes, frame]);

  const centerNode = animatedNodes[0] || { x: cx, y: cy };

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      <div 
        style={{ 
          width: w,
          height: totalH,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          background: showCardBg ? (el.bgColor || 'var(--card-bg, rgba(13, 17, 23, 0.85))') : 'transparent',
          border: showCardBg ? `1px solid var(--border, ${mixColor(accentColor, 20)})` : 'none',
          borderRadius: showCardBg ? (el.radius !== undefined ? el.radius : 16) : 0,
          boxShadow: showCardBg ? 'var(--shadow-md, 0 8px 32px rgba(0, 0, 0, 0.5)), inset 0 0 16px rgba(0, 0, 0, 0.2)' : 'none',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {/* Dynamic Header Bar */}
        {hasTitle && (
          <div
            style={{
              height: 32,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              padding: '0 14px',
              borderBottom: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
              gap: 8,
              boxSizing: 'border-box',
              zIndex: 2,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {renderUniversalIcon('zap', accentColor, 14)}
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--text, #FFF)',
                fontFamily: el.fontFamily || 'Be Vietnam Pro, sans-serif',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title}
            </span>
          </div>
        )}

        <svg
          width={w}
          height={totalH}
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'visible',
            pointerEvents: 'none',
          }}
        >
          {/* Orbital Guide Circle */}
          <circle
            cx={cx}
            cy={cy}
            r={orbitRadius}
            fill="none"
            stroke="var(--chart-grid, rgba(255, 255, 255, 0.08))"
            strokeWidth="1"
            strokeDasharray="4 4"
          />

          {/* Connection Edges & Flowing Data Photons */}
          {animatedNodes.map((n, i) => {
            if (i === 0) return null;

            const edgeSpring = spring({
              fps,
              frame: Math.max(0, frame - delayFrames - i * 3),
              config: { damping: 14 }
            });

            // Flowing Photon Particle (0 -> 1 loop every 40 frames)
            const loopDuration = 40;
            const particleProgress = ((frame + i * 8) % loopDuration) / loopDuration;
            const px = centerNode.x + (n.x - centerNode.x) * particleProgress;
            const py = centerNode.y + (n.y - centerNode.y) * particleProgress;

            return (
              <g key={`edge-${i}`} opacity={edgeSpring}>
                {/* Connection Line */}
                <line
                  x1={centerNode.x}
                  y1={centerNode.y}
                  x2={n.x}
                  y2={n.y}
                  stroke={n.color || accentColor}
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  opacity="0.4"
                />

                {/* Flowing Data Photon with Halo */}
                <circle
                  cx={px}
                  cy={py}
                  r="5"
                  fill={n.color || 'var(--text, #FFF)'}
                  opacity={0.35}
                />
                <circle
                  cx={px}
                  cy={py}
                  r="2.5"
                  fill="var(--text, #FFFFFF)"
                />
              </g>
            );
          })}

          {/* Satellite & Center Nodes */}
          {animatedNodes.map((n, i) => {
            const nodeSpring = spring({
              fps,
              frame: Math.max(0, frame - delayFrames - i * 3 - 2),
              config: { damping: 12, stiffness: 120 }
            });

            const nodeRadius = n.isCenter ? 22 : 15;
            const nodeColor = n.color || accentColor;

            return (
              <g
                key={`node-${i}`}
                style={{
                  transform: `scale(${nodeSpring})`,
                  transformOrigin: `${n.x}px ${n.y}px`,
                }}
              >
                {/* Outer Glow Halo */}
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={nodeRadius + 6}
                  fill={nodeColor}
                  opacity={n.isCenter ? 0.3 : 0.2}
                />

                {/* Node Body Circle */}
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={nodeRadius}
                  fill="var(--surface, #0A101C)"
                  stroke={nodeColor}
                  strokeWidth={n.isCenter ? 2.5 : 1.8}
                />

                {/* Node Icon */}
                <foreignObject
                  x={n.x - (n.isCenter ? 11 : 8)}
                  y={n.y - (n.isCenter ? 11 : 8)}
                  width={n.isCenter ? 22 : 16}
                  height={n.isCenter ? 22 : 16}
                >
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {renderUniversalIcon(n.icon, nodeColor, n.isCenter ? 14 : 11)}
                  </div>
                </foreignObject>

                {/* Node Label Below */}
                <text
                  x={n.x}
                  y={n.y + nodeRadius + (n.isCenter ? 10 : 8)}
                  fill="var(--text, rgba(255, 255, 255, 0.95))"
                  fontSize={n.isCenter ? 10.5 : 9}
                  fontWeight={n.isCenter ? '800' : '600'}
                  fontFamily={el.fontFamily || "Be Vietnam Pro, sans-serif"}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {n.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </RemotionElementWrapper>
  );
};
