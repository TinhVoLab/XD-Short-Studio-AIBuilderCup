import React, { useMemo } from 'react';
import { spring, Easing } from 'remotion';
import { ElementProps } from '../types';
import { RemotionElementWrapper } from '../core/RemotionElementWrapper';
import { getTypographyStyle } from '../../utils/design-tokens';
import { mixColor } from '../../utils/rich-text-parser';

export const PyramidFunnelElement: React.FC<
  ElementProps & { frame: number; fps: number; delayFrames: number; durFrames: number }
> = ({ el, computedStyle, positionStyle, frame, fps, delayFrames, durFrames }) => {
  const layers = el.pyramidLayers || [
    { label: 'TẦNG 1: HOOK ĐỘC ĐÁO', sub: 'Thu hút 3 giây đầu', color: 'var(--chart-series-1, #BEFF01)' },
    { label: 'TẦNG 2: NỘI DUNG GIÁ TRỊ', sub: 'Giữ chân bằng insight', color: 'var(--chart-series-2, #00D4FF)' },
    { label: 'TẦNG 3: KÊU GỌI HÀNH ĐỘNG', sub: 'Chuyển đổi follower', color: 'var(--chart-series-3, #FF5544)' },
  ];

  const w = el.width || 336;
  const h = el.height || 260;
  const N = Math.max(1, layers.length);

  const title = String(el.title ?? el.content ?? '').trim();
  const hasTitle = Boolean(title);
  const showCardBg = el.showCardBg !== false;
  const accentColor = el.accentColor || 'var(--accent, #BEFF01)';

  // 1. Progress & Animation Timing
  const progress = Math.min(1, Math.max(0, (frame - delayFrames) / (durFrames || 30)));
  const easeProgress = Easing.out(Easing.cubic)(progress);
  const floatOffset = Math.sin((frame / fps) * Math.PI * 0.6) * 4;

  // 2. Geometry Config: Dynamic Box-Model bounds
  const padH = showCardBg ? 24 : 8;
  const contentW = w - padH;
  const headerOffset = hasTitle ? 34 : 0;
  const startY = headerOffset + (showCardBg ? 12 : 6) + floatOffset;
  const pyrW = Math.min(160, contentW * 0.38);
  const pyrH = Math.max(90, h - startY - (showCardBg ? 20 : 10));
  const cx = w / 2;

  // 3. Memoize 3D Geometry
  const computedGeometry = useMemo(() => {
    return layers.map((layer, i) => {
      const yTop = startY + (i / N) * pyrH;
      const yBot = startY + ((i + 1) / N) * pyrH;
      const wTop = (i / N) * pyrW;
      const wBot = ((i + 1) / N) * pyrW;

      const pTopLeft = `${cx - wTop / 2},${yTop}`;
      const pTopCenter = `${cx},${yTop}`;
      const pTopRight = `${cx + wTop / 2},${yTop}`;
      const pBotLeft = `${cx - wBot / 2},${yBot}`;
      const pBotCenter = `${cx},${yBot}`;
      const pBotRight = `${cx + wBot / 2},${yBot}`;

      const leftPoints = `${pTopLeft} ${pTopCenter} ${pBotCenter} ${pBotLeft}`;
      const rightPoints = `${pTopCenter} ${pTopRight} ${pBotRight} ${pBotCenter}`;

      const isLabelOnRight = i % 2 === 0;
      const slopeX = isLabelOnRight ? cx + (wTop + wBot) / 4 : cx - (wTop + wBot) / 4;
      const lineEndX = isLabelOnRight ? cx + wBot / 2 + 10 : cx - wBot / 2 - 10;
      const labelMidY = (yTop + yBot) / 2;

      const labelX = isLabelOnRight ? cx + wBot / 2 + 12 : (showCardBg ? 8 : 4);
      const labelW = isLabelOnRight ? w - labelX - (showCardBg ? 8 : 4) : (cx - wBot / 2 - 16);

      return {
        leftPoints,
        rightPoints,
        slopeX,
        lineEndX,
        labelMidY,
        yTop,
        yBot,
        labelX,
        labelW: Math.max(85, labelW),
        isLabelOnRight,
        layerColor: layer.color || 'var(--accent, #BEFF01)',
      };
    });
  }, [layers, N, pyrW, pyrH, startY, cx, w, showCardBg]);

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      <div
        style={{
          width: w,
          height: h,
          boxSizing: 'border-box',
          position: 'relative',
          background: showCardBg ? (el.bgColor || 'var(--surface-1, rgba(10, 16, 28, 0.95))') : 'transparent',
          border: showCardBg ? '1px solid var(--border, rgba(255, 255, 255, 0.1))' : 'none',
          borderRadius: showCardBg ? (el.radius !== undefined ? el.radius : 16) : 0,
          boxShadow: showCardBg ? 'var(--shadow-md, 0 12px 32px rgba(0, 0, 0, 0.5))' : 'none',
          padding: showCardBg ? '10px 12px' : '2px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Dynamic Header Bar (Ẩn khi không có tiêu đề) */}
        {hasTitle && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
              paddingBottom: 6,
              marginBottom: 4,
              width: '100%',
              zIndex: 3,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* SVG Pyramid Icon - 0 emoji */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 22 22 22" />
                <line x1="12" y1="2" x2="12" y2="22" />
              </svg>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: 'var(--text, #FFFFFF)',
                  letterSpacing: '0.04em',
                }}
              >
                {title}
              </span>
            </div>

            <div
              style={{
                fontSize: 8.5,
                fontWeight: 800,
                color: accentColor,
                fontFamily: 'monospace',
                background: mixColor(accentColor, 9),
                border: `1px solid ${mixColor(accentColor, 20)}`,
                padding: '2px 6px',
                borderRadius: 4,
                letterSpacing: '0.06em',
              }}
            >
              3D PYRAMID
            </div>
          </div>
        )}

        {/* Inner Graphic Container */}
        <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
          {/* 3D Floating SVG Pyramid */}
          <svg width={w} height={h} style={{ overflow: 'visible', position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
            <defs>
              {layers.map((layer, i) => (
                <React.Fragment key={i}>
                  <linearGradient id={`pyr-grad-left-${el.id}-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={layer.color || '#fff'} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={layer.color || '#fff'} stopOpacity={0.75} />
                  </linearGradient>
                  <linearGradient id={`pyr-grad-right-${el.id}-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={layer.color || '#fff'} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={layer.color || '#fff'} stopOpacity={0.48} />
                  </linearGradient>
                </React.Fragment>
              ))}
            </defs>

            {computedGeometry.map((geo, i) => {
              const layerThreshold = (N - 1 - i) / N;
              const isLayerVisible = easeProgress > layerThreshold;
              const layerSpr = isLayerVisible
                ? spring({ fps, frame: frame - (delayFrames + (durFrames || 30) * layerThreshold), config: { damping: 12, stiffness: 120 } })
                : 0;

              return (
                <g key={i} style={{ opacity: layerSpr, transform: `scale(${0.9 + 0.1 * layerSpr})`, transformOrigin: `${cx}px ${geo.yBot}px` }}>
                  {/* Glow background */}
                  <polygon
                    points={`${geo.leftPoints} ${geo.rightPoints}`}
                    fill={geo.layerColor}
                    opacity={0.12 * layerSpr}
                  />

                  {/* Left Face */}
                  <polygon
                    points={geo.leftPoints}
                    fill={`url(#pyr-grad-left-${el.id}-${i})`}
                    stroke={geo.layerColor}
                    strokeWidth={0.8}
                    strokeLinejoin="round"
                  />

                  {/* Right Face */}
                  <polygon
                    points={geo.rightPoints}
                    fill={`url(#pyr-grad-right-${el.id}-${i})`}
                    stroke={geo.layerColor}
                    strokeWidth={0.8}
                    strokeLinejoin="round"
                  />

                  {/* Center Crease Highlight */}
                  <line
                    x1={cx}
                    y1={geo.yTop}
                    x2={cx}
                    y2={geo.yBot}
                    stroke="var(--chart-grid, rgba(255,255,255,0.4))"
                    strokeWidth={1}
                  />

                  {/* Connector line to label */}
                  {isLayerVisible && (
                    <path
                      d={`M ${geo.slopeX} ${geo.labelMidY} L ${geo.lineEndX} ${geo.labelMidY}`}
                      stroke={geo.layerColor}
                      strokeWidth={1.2}
                      strokeDasharray="3 2"
                      opacity={0.75 * layerSpr}
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* HTML Floating Labels Overlaid */}
          {computedGeometry.map((geo, i) => {
            const layerThreshold = (N - 1 - i) / N;
            const isLayerVisible = easeProgress > layerThreshold;
            if (!isLayerVisible) return null;

            const layer = layers[i];
            const labelY = geo.labelMidY - 16;

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: labelY,
                  left: geo.labelX,
                  width: geo.labelW,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: geo.isLabelOnRight ? 'flex-start' : 'flex-end',
                  textAlign: geo.isLabelOnRight ? 'left' : 'right',
                  pointerEvents: 'none',
                  padding: '3px 6px',
                  backgroundColor: 'var(--surface-2, rgba(10, 16, 28, 0.90))',
                  borderRadius: 6,
                  border: `1px solid ${mixColor(geo.layerColor, 27)}`,
                  boxSizing: 'border-box',
                }}
              >
                {/* Layer Index Badge */}
                <span
                  style={{
                    fontSize: 8,
                    fontWeight: 900,
                    color: 'var(--text)',
                    backgroundColor: mixColor(geo.layerColor, 22),
                    padding: '1px 5px',
                    borderRadius: 3,
                    marginBottom: 2,
                  }}
                >
                  L{N - i}
                </span>

                {/* Label Text */}
                <span
                  style={{
                    ...getTypographyStyle({ fontSize: 10, fontWeight: 800, color: 'var(--text, #FFF)', fontFamily: el.fontFamily || 'Be Vietnam Pro' }),
                    lineHeight: 1.2,
                  }}
                >
                  {layer.label}
                </span>

                {/* Subtitle */}
                {layer.sub && (
                  <span
                    style={{
                      fontSize: 8.5,
                      color: 'var(--text-sub, rgba(255,255,255,0.7))',
                      marginTop: 1,
                      lineHeight: 1.15,
                      wordBreak: 'break-word',
                    }}
                  >
                    {layer.sub}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </RemotionElementWrapper>
  );
};
