import React, { useMemo } from 'react';
import { spring, interpolate } from 'remotion';
import { AdvElementProps } from '../types';
import { DynamicDiagramData } from '@/types/scene';
import { computeGraphLayout, LayoutedNode, LayoutedEdge } from '@/config/graphLayout';

export const DynamicDiagramElement: React.FC<AdvElementProps> = ({
  el,
  computedStyle,
  frame = 0,
  fps = 30,
  delayFrames = 0,
  durFrames,
  sceneDuration,
}) => {
  const w = el.width || 336;
  const accent = el.accentColor || 'var(--accent)';
  const bgColor = el.bgColor || 'var(--card-bg)';
  const radius = el.radius !== undefined ? el.radius : 12;
  const theme = (el.diagramData?.theme || (el as any).theme || 'cyber') as 'cyber' | 'minimalist' | 'pastel';

  const isMinimalist = theme === 'minimalist';
  const isPastel = theme === 'pastel';

  const nodeFill = isMinimalist
    ? 'var(--surface-2)'
    : isPastel
    ? 'color-mix(in srgb, var(--text) 6%, transparent)'
    : 'var(--surface-1)';

  const nodeShadowFilter = isMinimalist ? undefined : 'url(#diagram-node-shadow)';
  const nodeStrokeWidth = isMinimalist ? 1.2 : isPastel ? 1.5 : 1.8;

  // Diagram raw data fallback
  const diagramData: DynamicDiagramData = useMemo(() => {
    if (el.diagramData && el.diagramData.nodes && el.diagramData.nodes.length > 0) {
      return el.diagramData;
    }
    return {
      title: 'QUY TRÌNH HỆ THỐNG',
      nodes: [
        { id: 'start', label: 'Bắt đầu', shape: 'pill', color: accent },
        { id: 'decision', label: 'Kiểm tra', shape: 'diamond', color: 'var(--chart-series-2)' },
        { id: 'process', label: 'Xử lý', shape: 'rect', color: 'var(--chart-series-5)' },
        { id: 'end', label: 'Hoàn tất', shape: 'pill', color: 'var(--chart-series-1)' },
      ],
      edges: [
        { from: 'start', to: 'decision', label: 'Khởi chạy' },
        { from: 'decision', to: 'process', label: 'Hợp lệ' },
        { from: 'process', to: 'end', label: 'Xong' },
        { from: 'decision', to: 'start', label: 'Thử lại' },
      ],
    };
  }, [el.diagramData, accent]);

  const showBackground = el.showCardBg !== false && el.showBackground !== false && el.bgColor !== 'transparent';
  const showTitle = Boolean(el.showTitle !== false && diagramData.title?.trim());

  // Compute Layout (Nodes positions & SVG paths)
  const layout = useMemo(() => {
    return computeGraphLayout(diagramData, w, showTitle);
  }, [diagramData, w, showTitle]);

  const h = Math.max(el.height || 0, layout.height);

  // ── Dynamic Responsive Timing Calculation ──
  const timingMode = diagramData.timingMode || 'auto';
  const isAutoTiming = timingMode !== 'fast';

  // Thời lượng cảnh thực tế (sceneDuration tính bằng giây từ SceneRenderer)
  // Tuyệt đối không dùng durFrames vì durFrames ở đây là thời lượng 0.6s của hiệu ứng xuất hiện ban đầu
  const sceneSec = typeof sceneDuration === 'number' && sceneDuration > 0 ? sceneDuration : 5;
  const totalSceneFrames = Math.max(60, Math.round(sceneSec * fps));

  const { getNodeStart, getEdgeTiming } = useMemo(() => {
    const maxLayer = layout.maxLayer || 0;

    if (!isAutoTiming || maxLayer === 0) {
      // Chế độ nhanh (Fast Intro): 10 frames (~0.33s) cố định mỗi tầng
      return {
        getNodeStart: (layer: number) => delayFrames + layer * 10,
        getEdgeTiming: (fromLayer: number, toLayer: number) => {
          const start = delayFrames + fromLayer * 10 + 6;
          const end = start + 14;
          return { start, end };
        },
      };
    }

    // Chế độ tự động (Storytelling Mode): Tự động co giãn nhịp nhàng theo sceneDuration thực tế
    // 1. Đệm mở đầu (Intro settling buffer): ~0.2s - 0.3s
    const introFrames = Math.min(15, Math.max(6, Math.round(fps * 0.2)));

    // 2. Đệm đọc & thẩm thấu cuối cảnh (Digest & Hold buffer): ~22-25% cảnh, tối thiểu 1.5s (45 frames)
    const holdFrames = Math.max(Math.round(fps * 1.5), Math.round(totalSceneFrames * 0.25));

    // 3. Khung thời gian hé lộ chuỗi tầng (Active storytelling window)
    const availableRevealFrames = Math.max(
      maxLayer * 16,
      totalSceneFrames - introFrames - holdFrames
    );

    // 4. Bước nhảy thời gian giữa các tầng (tối đa 2.5s để nhịp video không bị quá lê thê, tối thiểu 16 frames)
    const maxStepFrames = Math.round(fps * 2.5);
    const layerStepFrames = Math.min(maxStepFrames, Math.max(16, Math.floor(availableRevealFrames / maxLayer)));

    return {
      getNodeStart: (layer: number) => {
        return delayFrames + introFrames + layer * layerStepFrames;
      },
      getEdgeTiming: (fromLayer: number, toLayer: number, isFeedback: boolean) => {
        const fromStart = delayFrames + introFrames + fromLayer * layerStepFrames;
        const toStart = delayFrames + introFrames + toLayer * layerStepFrames;

        if (isFeedback || fromLayer >= toLayer) {
          // Vòng lặp ngược: Bắt đầu vẽ sau khi tầng nguồn ổn định
          const start = fromStart + Math.round(layerStepFrames * 0.4);
          const end = start + Math.min(30, Math.round(layerStepFrames * 0.8));
          return { start, end };
        }

        // Mũi tên xuôi: Nối mượt mà từ tầng trước tới đúng lúc tầng sau bung nở (Domino flow)
        const start = fromStart + Math.min(12, Math.round(layerStepFrames * 0.3));
        const end = Math.max(start + 10, toStart);
        return { start, end };
      },
    };
  }, [layout.maxLayer, isAutoTiming, delayFrames, fps, totalSceneFrames]);

  // Card Appearance Spring
  const cardSpring = spring({
    frame: frame - delayFrames,
    fps,
    config: { damping: 16, stiffness: 140 },
  });

  const cardOpacity = interpolate(cardSpring, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        ...computedStyle,
        width: w,
        height: h,
        // position do computedStyle quyết định (absolute) — xem tests/unit/elementPositioning.test.ts
        borderRadius: radius,
        backgroundColor: showBackground ? bgColor : 'transparent',
        border: showBackground ? '1px solid var(--border)' : 'none',
        boxShadow: showBackground ? (isMinimalist ? 'none' : 'var(--shadow-md, 0 8px 32px rgba(0, 0, 0, 0.45))') : 'none',
        overflow: 'hidden',
        opacity: cardOpacity,
        fontFamily: 'inherit',
      }}
    >
      {/* Title Header (Optional, no redundant badge) */}
      {showTitle && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 14,
            right: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            zIndex: 10,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: isMinimalist ? 'var(--text)' : 'var(--text-sub)',
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
            }}
          >
            {diagramData.title}
          </span>
        </div>
      )}

      {/* SVG Canvas for Nodes and Vector Edges */}
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      >
        <defs>
          <filter id="diagram-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="diagram-node-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="rgba(0, 0, 0, 0.65)" />
          </filter>

          {/* Standard Forward Arrow Marker */}
          <marker
            id="arrow-forward"
            viewBox="0 0 10 10"
            refX="7"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M 0 1.5 L 7 5 L 0 8.5 z" fill={isMinimalist ? 'color-mix(in srgb, var(--text) 60%, transparent)' : accent} opacity="0.95" />
          </marker>

          {/* Feedback Loop Arrow Marker */}
          <marker
            id="arrow-loop"
            viewBox="0 0 10 10"
            refX="7"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M 0 1.5 L 7 5 L 0 8.5 z" fill="#FF7043" opacity="0.95" />
          </marker>
        </defs>

        {/* ── 1. EDGES & CONNECTORS ── */}
        {layout.edges.map((edge, idx) => {
          if (!edge.pathD) return null;
          const fromNode = layout.nodes.find((n) => n.id === edge.from);
          const toNode = layout.nodes.find((n) => n.id === edge.to);
          const fromLayer = fromNode?.layer ?? 0;
          const toLayer = toNode?.layer ?? fromLayer + 1;
          const { start: edgeStart, end: edgeEnd } = getEdgeTiming(fromLayer, toLayer, Boolean(edge.isFeedback));

          // Stroke drawing progress
          const drawProgress = interpolate(frame, [edgeStart, edgeEnd], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          const strokeColor = edge.isFeedback
            ? '#FF7043'
            : isMinimalist
            ? (edge.color || 'color-mix(in srgb, var(--text) 40%, transparent)')
            : (edge.color || accent);

          const markerId = edge.isFeedback ? 'url(#arrow-loop)' : 'url(#arrow-forward)';
          const pathLen = 300; // estimated dash length
          const edgeWidth = isMinimalist ? 1.3 : isPastel ? 1.6 : 1.8;

          return (
            <g key={`edge-${idx}`}>
              <path
                d={edge.pathD}
                fill="none"
                stroke={strokeColor}
                strokeWidth={edgeWidth}
                strokeDasharray={edge.isFeedback ? '4,4' : pathLen}
                strokeDashoffset={edge.isFeedback ? 0 : pathLen * (1 - drawProgress)}
                markerEnd={drawProgress > 0.4 ? markerId : undefined}
                opacity={drawProgress > 0 ? 0.9 : 0}
              />

              {/* Edge Label Pill (Opaque fill to mask background path cleanly) */}
              {edge.label && drawProgress > 0.6 && (
                <g transform={`translate(${edge.labelX}, ${edge.labelY})`}>
                  <rect
                    x={-((edge.label.length * 6 + 14) / 2)}
                    y={-9}
                    width={edge.label.length * 6 + 14}
                    height={18}
                    rx={5}
                    fill="var(--bg)"
                    stroke={isMinimalist ? 'color-mix(in srgb, var(--text) 25%, transparent)' : strokeColor}
                    strokeWidth={1}
                    filter={nodeShadowFilter}
                  />
                  <text
                    x={0}
                    y={3.5}
                    textAnchor="middle"
                    fill="var(--text)"
                    fontSize={9}
                    fontWeight={600}
                    letterSpacing={0.2}
                  >
                    {edge.label}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* ── 2. NODES (FREE-FORM SHAPES) ── */}
        {layout.nodes.map((node) => {
          const nodeStart = getNodeStart(node.layer ?? 0);
          const nodeSpring = spring({
            frame: frame - nodeStart,
            fps,
            config: { damping: 14, stiffness: 130 },
          });

          const scale = interpolate(nodeSpring, [0, 1], [0.6, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const opacity = interpolate(nodeSpring, [0, 1], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          const nodeColor = node.color || accent;
          const resolvedNodeStroke = node.color
            ? node.color
            : isMinimalist
            ? 'color-mix(in srgb, var(--text) 30%, transparent)'
            : accent;
          const halfW = node.width / 2;
          const halfH = node.height / 2;

          return (
            <g
              key={`node-${node.id}`}
              transform={`translate(${node.x}, ${node.y}) scale(${scale})`}
              opacity={opacity}
              style={{ transformOrigin: 'center' }}
            >
              {/* Shape Render */}
              {node.shape === 'rect' && (
                <rect
                  x={-halfW}
                  y={-halfH}
                  width={node.width}
                  height={node.height}
                  rx={8}
                  fill={nodeFill}
                  stroke={resolvedNodeStroke}
                  strokeWidth={nodeStrokeWidth}
                  filter={nodeShadowFilter}
                />
              )}

              {node.shape === 'pill' && (
                <rect
                  x={-halfW}
                  y={-halfH}
                  width={node.width}
                  height={node.height}
                  rx={halfH}
                  fill={nodeFill}
                  stroke={resolvedNodeStroke}
                  strokeWidth={nodeStrokeWidth}
                  filter={nodeShadowFilter}
                />
              )}

              {node.shape === 'diamond' && (
                <polygon
                  points={`0,${-halfH} ${halfW},0 0,${halfH} ${-halfW},0`}
                  fill={nodeFill}
                  stroke={resolvedNodeStroke}
                  strokeWidth={nodeStrokeWidth}
                  filter={nodeShadowFilter}
                />
              )}

              {node.shape === 'circle' && (
                <circle
                  cx={0}
                  cy={0}
                  r={halfW}
                  fill={nodeFill}
                  stroke={resolvedNodeStroke}
                  strokeWidth={nodeStrokeWidth}
                  filter={nodeShadowFilter}
                />
              )}

              {node.shape === 'cylinder' && (
                <g filter={nodeShadowFilter}>
                  <rect
                    x={-halfW}
                    y={-halfH + 4}
                    width={node.width}
                    height={node.height - 8}
                    fill={nodeFill}
                    stroke={resolvedNodeStroke}
                    strokeWidth={nodeStrokeWidth}
                  />
                  <ellipse
                    cx={0}
                    cy={-halfH + 4}
                    rx={halfW}
                    ry={5}
                    fill={isMinimalist ? 'var(--surface-3)' : isPastel ? 'color-mix(in srgb, var(--text) 9%, transparent)' : 'var(--surface-2)'}
                    stroke={resolvedNodeStroke}
                    strokeWidth={nodeStrokeWidth}
                  />
                  <ellipse
                    cx={0}
                    cy={halfH - 4}
                    rx={halfW}
                    ry={5}
                    fill={isMinimalist ? 'var(--surface-3)' : isPastel ? 'color-mix(in srgb, var(--text) 9%, transparent)' : 'var(--surface-2)'}
                    stroke={resolvedNodeStroke}
                    strokeWidth={nodeStrokeWidth}
                  />
                </g>
              )}

              {/* Node Label Text (Support balanced 1 or 2 lines) */}
              {node.lines && node.lines.length > 1 ? (
                <text
                  x={0}
                  y={node.sublabel ? -7 : -5}
                  textAnchor="middle"
                  fill="var(--text)"
                  fontSize={node.shape === 'diamond' ? 9.5 : 10.5}
                  fontWeight={600}
                  letterSpacing={0.2}
                  style={{ pointerEvents: 'none' }}
                >
                  <tspan x={0} dy="0">{node.lines[0]}</tspan>
                  <tspan x={0} dy="13">{node.lines[1]}</tspan>
                </text>
              ) : (
                <text
                  x={0}
                  y={node.sublabel ? -3 : 4}
                  textAnchor="middle"
                  fill="var(--text)"
                  fontSize={node.shape === 'diamond' ? 10.5 : 11}
                  fontWeight={600}
                  letterSpacing={0.2}
                  style={{ pointerEvents: 'none' }}
                >
                  {node.lines ? node.lines[0] : node.label}
                </text>
              )}

              {node.sublabel && (
                <text
                  x={0}
                  y={12}
                  textAnchor="middle"
                  fill="var(--text-sub)"
                  fontSize={8}
                  fontWeight={400}
                  style={{ pointerEvents: 'none' }}
                >
                  {node.sublabel}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
