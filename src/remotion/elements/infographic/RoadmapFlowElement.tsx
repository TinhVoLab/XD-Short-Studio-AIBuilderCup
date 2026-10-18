import React from 'react';
import { spring, interpolate } from 'remotion';
import { AdvElementProps } from '../types';
import { RoadmapFlowData, RoadmapMilestoneItem } from '@/types/scene';
import { renderUniversalIcon } from '../../utils/icons';
import { mixColor, readableTint } from '../../utils/rich-text-parser';
import { RemotionElementWrapper } from '../core/RemotionElementWrapper';

export const RoadmapFlowElement: React.FC<AdvElementProps> = ({
  el,
  computedStyle,
  positionStyle,
  frame = 0,
  fps = 30,
  delayFrames = 0,
}) => {
  const w = el.width || 360;
  const h = el.height || 280;
  const accent = el.accentColor || 'var(--accent, #00D4FF)';
  const bgColor = el.bgColor || 'var(--surface-1, rgba(10, 16, 28, 0.95))';
  const radius = el.radius !== undefined ? el.radius : 8;

  const data: RoadmapFlowData = el.roadmapFlowData || {
    title: 'LỘ TRÌNH PHÁT TRIỂN PRO',
    milestones: [
      { id: 'm1', stage: 'BƯỚC 1', title: 'Nền Tảng Core', subLabel: 'HTML, CSS & JS', icon: 'compass', color: 'var(--chart-series-2, #00D4FF)', status: 'completed', badge: 'DONE' },
      { id: 'm2', stage: 'BƯỚC 2', title: 'Frontend Pro', subLabel: 'React, Zustand & UI', icon: 'zap', color: 'var(--chart-series-1, #BEFF01)', status: 'active', badge: 'HIỆN TẠI' },
      { id: 'm3', stage: 'BƯỚC 3', title: 'Cloud & API', subLabel: 'Node, Postgre & CI/CD', icon: 'cloud', color: 'var(--chart-series-3, #FFB800)', status: 'locked', badge: 'MỤC TIÊU' },
      { id: 'm4', stage: 'BƯỚC 4', title: 'AI Engineering', subLabel: 'LLM Agents & Remotion', icon: 'award', color: 'var(--chart-series-4, #A855F7)', status: 'locked', badge: 'ĐỈNH CAO' },
    ],
    layoutStyle: 'zigzag',
  };

  const milestones: RoadmapMilestoneItem[] =
    data.milestones && data.milestones.length > 0
      ? data.milestones
      : [
          { id: 'm1', stage: 'BƯỚC 1', title: 'Nền Tảng Core', subLabel: 'HTML/CSS & JS', icon: 'compass', color: 'var(--chart-series-2, #00D4FF)', status: 'completed', badge: 'DONE' },
          { id: 'm2', stage: 'BƯỚC 2', title: 'Frontend Pro', subLabel: 'React & UI', icon: 'zap', color: 'var(--chart-series-1, #BEFF01)', status: 'active', badge: 'HIỆN TẠI' },
          { id: 'm3', stage: 'BƯỚC 3', title: 'Cloud & API', subLabel: 'Node & Cloud', icon: 'cloud', color: 'var(--chart-series-3, #FFB800)', status: 'locked', badge: 'TIẾP THEO' },
        ];

  const wireColor = data.wireColor || 'var(--chart-axis, rgba(255, 255, 255, 0.16))';
  const packetColor = data.packetColor || accent;
  const layoutStyle = data.layoutStyle || 'zigzag';
  const numMilestones = milestones.length;

  // Title header height
  const hasTitle = Boolean(data.title && data.title.trim().length > 0);
  const titleOffset = hasTitle ? 32 : 8;
  const contentH = h - titleOffset - 12;

  // Calculate Node Positions
  const isLinear = layoutStyle.startsWith('linear');
  const cardW = isLinear ? w - 54 : Math.min(145, (w - 32) * 0.47);
  const cardH = Math.min(46, (contentH - (numMilestones - 1) * 6) / numMilestones);
  const stepY = (contentH - cardH) / Math.max(1, numMilestones - 1);

  const nodePositions = milestones.map((_, i) => {
    let dotX = w / 2;
    let cardLeft = 0;

    if (layoutStyle === 'zigzag') {
      const isLeft = i % 2 === 0;
      dotX = isLeft ? 10 + cardW / 2 : w - 10 - cardW / 2;
      cardLeft = dotX - cardW / 2;
    } else if (layoutStyle === 'linear-left') {
      dotX = 16;
      cardLeft = 38;
    } else if (layoutStyle === 'linear-right') {
      dotX = w - 16;
      cardLeft = w - 38 - cardW;
    }

    const cy = titleOffset + i * stepY + cardH / 2;
    return { cx: dotX, cy, left: cardLeft, top: cy - cardH / 2 };
  });

  // Cyclic Laser Progress Beam (75 frames cycle)
  const cycleFrames = 75;
  const loopT = interpolate((frame + delayFrames) % cycleFrames, [0, cycleFrames], [0, 1]);

  // Generate Bezier connection paths between milestones
  const pathSegments = [];
  for (let i = 0; i < numMilestones - 1; i++) {
    const p0 = nodePositions[i];
    const p1 = nodePositions[i + 1];
    const dy = (p1.cy - p0.cy) * 0.55;
    const d = `M ${p0.cx} ${p0.cy} C ${p0.cx} ${p0.cy + dy}, ${p1.cx} ${p1.cy - dy}, ${p1.cx} ${p1.cy}`;
    pathSegments.push({ from: p0, to: p1, d, idx: i });
  }

  // Calculate laser lead position on curve
  const currentSegmentFloat = loopT * (numMilestones - 1);
  const currentSegIdx = Math.min(numMilestones - 2, Math.floor(currentSegmentFloat));
  const segLocalT = currentSegmentFloat - currentSegIdx;

  const seg = pathSegments[currentSegIdx] || pathSegments[0];
  let laserX = w / 2;
  let laserY = h / 2;
  if (seg) {
    const p0 = seg.from;
    const p3 = seg.to;
    const dy = (p3.cy - p0.cy) * 0.55;
    const p1 = { x: p0.cx, y: p0.cy + dy };
    const p2 = { x: p3.cx, y: p3.cy - dy };

    // Cubic Bezier interpolation
    const t = segLocalT;
    const mt = 1 - t;
    laserX = mt * mt * mt * p0.cx + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.cx;
    laserY = mt * mt * mt * p0.cy + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.cy;
  }

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      <div
        style={{
          width: w,
          height: h,
          position: 'relative',
          boxSizing: 'border-box',
        }}
      >
        {/* Centered Floating Title Header Badge */}
        {hasTitle && (
          <div
            style={{
              position: 'absolute',
              top: 2,
              left: 0,
              width: '100%',
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 12px',
                borderRadius: 20,
                backgroundColor: 'var(--surface-2, rgba(15, 22, 36, 0.92))',
                border: '1px solid var(--border, rgba(255, 255, 255, 0.15))',
                boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
              }}
            >
              {/* SVG Milestone Flag Icon - 0 emoji */}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                <line x1="4" y1="22" x2="4" y2="15" />
              </svg>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase',
                  color: readableTint(accent),
                  textShadow: `0 0 8px ${mixColor(accent, 50)}`,
                }}
              >
                {data.title}
              </span>
              <div
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent, #BEFF01)',
                  boxShadow: '0 0 5px var(--accent, #BEFF01)',
                }}
              />
            </div>
          </div>
        )}

        {/* S-Curve Energy Conduit Cables SVG */}
        <svg
          width={w}
          height={h}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 0,
            pointerEvents: 'none',
          }}
        >
          <defs>
            <linearGradient id={`cable-glow-${el.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--chart-series-2, #00D4FF)" stopOpacity="0.8" />
              <stop offset="50%" stopColor="var(--accent, #BEFF01)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="var(--chart-series-3, #FFB800)" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {pathSegments.map((segPath, sIdx) => (
            <g key={`cable-${sIdx}`}>
              {/* Outer Conduit Layer */}
              <path
                d={segPath.d}
                fill="none"
                stroke="var(--chart-grid, rgba(255, 255, 255, 0.15))"
                strokeWidth={3}
                strokeDasharray="4 3"
              />
              {/* Inner Core Glow Conduit */}
              <path
                d={segPath.d}
                fill="none"
                stroke={`url(#cable-glow-${el.id})`}
                strokeWidth={1.5}
                opacity={0.7}
              />
            </g>
          ))}

          {/* Horizontal Connectors & Spine Dots for Linear Layouts */}
          {isLinear && nodePositions.map((pos, idx) => {
            const m = milestones[idx];
            const mColor = m.color || accent;
            return (
              <g key={`connector-${idx}`}>
                {/* Spine Node Dot */}
                <circle cx={pos.cx} cy={pos.cy} r={5} fill="var(--surface-3, rgba(15, 20, 32, 0.9))" stroke={mColor} strokeWidth={2} />
                
                {/* Connector Line to Card */}
                <line
                  x1={pos.cx + (layoutStyle === 'linear-left' ? 5 : -5)}
                  y1={pos.cy}
                  x2={layoutStyle === 'linear-left' ? pos.left : pos.left + cardW}
                  y2={pos.cy}
                  stroke={mColor}
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  opacity={0.6}
                />
              </g>
            );
        })}

        {/* Milestone Contact Shockwave Ripples in SVG */}
        {milestones.map((m, idx) => {
          const pos = nodePositions[idx];
          const mColor = m.color || accent;
          // Calculate distance from laser beam to milestone
          const dist = currentSegmentFloat - idx;
          const shockT = dist >= 0 && dist < 0.32 ? dist / 0.32 : -1;
          if (shockT < 0) return null;

          const rippleR = 5 + shockT * 18;
          const rippleOpacity = (1 - shockT) * 0.85;

          return (
            <g key={`shock-ripple-${idx}`}>
              <circle
                cx={pos.cx}
                cy={pos.cy}
                r={rippleR}
                fill="none"
                stroke={mColor}
                strokeWidth={1.5}
                opacity={rippleOpacity}
              />
              <circle
                cx={pos.cx}
                cy={pos.cy}
                r={rippleR * 0.55}
                fill={mColor}
                opacity={rippleOpacity * 0.25}
              />
            </g>
          );
        })}

        {/* Traveling Lead Laser Beam Orb */}
        {pathSegments.length > 0 && (
          <g>
            <circle cx={laserX} cy={laserY} r={7} fill={packetColor} opacity={0.25} />
            <circle cx={laserX} cy={laserY} r={4.5} fill={packetColor} opacity={0.8} />
            <circle cx={laserX} cy={laserY} r={2.2} fill="#FFFFFF" />
          </g>
        )}
      </svg>

      {/* Milestone Cards Layer */}
      {milestones.map((m, idx) => {
        const pos = nodePositions[idx];
        const mColor = m.color || accent;
        const isCompleted = m.status === 'completed';
        const isActive = m.status === 'active';
        const isLocked = m.status === 'locked';

        const tierSpring = spring({
          frame: frame - delayFrames - idx * 4,
          fps,
          config: { damping: 15, stiffness: 140 },
        });

        const pulseEffect = isActive ? (Math.sin(frame * 0.15) + 1) / 2 : 0;

        // Laser contact shockwave calculation for this card
        const dist = currentSegmentFloat - idx;
        const shockT = dist >= 0 && dist < 0.32 ? dist / 0.32 : -1;

        return (
          <div
            key={m.id || idx}
            style={{
              position: 'absolute',
              left: `${pos.left}px`,
              top: `${pos.top}px`,
              width: `${cardW}px`,
              height: `${cardH}px`,
              borderRadius: `${radius}px`,
              backgroundColor: isLocked ? 'var(--surface-2, rgba(15, 20, 32, 0.88))' : 'var(--surface-1, rgba(20, 28, 45, 0.95))',
              border: `1px solid ${
                shockT >= 0
                  ? mColor
                  : isActive
                  ? mColor
                  : isCompleted
                  ? `${mixColor(mColor, 53)}`
                  : 'var(--border, rgba(255, 255, 255, 0.12))'
              }`,
              boxShadow: shockT >= 0
                ? `0 0 ${12 + (1 - shockT) * 12}px ${mixColor(mColor, 50)}, inset 0 0 10px ${mixColor(mColor, 25)}`
                : isActive
                ? `0 0 14px ${mixColor(mColor, 33)}, inset 0 0 8px ${mixColor(mColor, 13)}`
                : isCompleted
                ? `0 0 8px ${mixColor(mColor, 20)}`
                : '0 4px 12px rgba(0, 0, 0, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 8px',
              boxSizing: 'border-box',
              zIndex: shockT >= 0 ? 2 : 1,
              opacity: tierSpring,
              transform: `scale(${0.92 + tierSpring * 0.08 + (shockT >= 0 ? (1 - shockT) * 0.04 : 0)})`,
            }}
          >
            {/* Surface Energy Flash upon Laser Contact */}
            {shockT >= 0 && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: `${radius}px`,
                  backgroundColor: mColor,
                  opacity: (1 - shockT) * 0.2,
                  pointerEvents: 'none',
                }}
              />
            )}

            {/* Expanding Shockwave Ring upon Laser Contact */}
            {shockT >= 0 && (
              <div
                style={{
                  position: 'absolute',
                  inset: `-${Math.round(shockT * 8)}px`,
                  borderRadius: `${radius + Math.round(shockT * 4)}px`,
                  border: `1.5px solid ${mColor}`,
                  opacity: (1 - shockT) * 0.85,
                  pointerEvents: 'none',
                  boxShadow: `0 0 ${8 + (1 - shockT) * 8}px ${mixColor(mColor, 40)}`,
                }}
              />
            )}

            {/* Left Wing: Icon & Stage Text */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '4px',
                  backgroundColor: `${mixColor(mColor, 13)}`,
                  border: `1px solid ${mixColor(mColor, 27)}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  flexShrink: 0,
                  transform: shockT >= 0 ? `scale(${1 + (1 - shockT) * 0.2})` : 'scale(1)',
                }}
              >
                {renderUniversalIcon(m.icon || (isCompleted ? 'check' : 'zap'), mColor, 13)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <span
                  style={{
                    fontSize: '8px',
                    fontWeight: 800,
                    color: readableTint(mColor),
                    letterSpacing: '0.4px',
                    textTransform: 'uppercase',
                  }}
                >
                  {m.stage}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: isLocked ? 'var(--text-sub, rgba(255,255,255,0.7))' : 'var(--text, #FFFFFF)',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                  }}
                >
                  {m.title}
                </span>
                {m.subLabel && (
                  <span
                    style={{
                      fontSize: '8px',
                      color: 'var(--text-sub, rgba(255, 255, 255, 0.45))',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                    }}
                  >
                    {m.subLabel}
                  </span>
                )}
              </div>
            </div>

            {/* Right Wing: Status Badge */}
            {m.badge && (
              <div
                style={{
                  fontSize: '8px',
                  fontWeight: 800,
                  padding: '2px 4px',
                  borderRadius: '3px',
                  backgroundColor: isActive ? `${mixColor(mColor, 20)}` : `${mixColor(mColor, 9)}`,
                  color: readableTint(mColor),
                  border: `1px solid ${mixColor(mColor, 33)}`,
                  flexShrink: 0,
                  letterSpacing: '0.3px',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {m.badge}
              </div>
            )}

            {/* Active Pulse Ring */}
            {isActive && (
              <div
                style={{
                  position: 'absolute',
                  inset: '-2px',
                  borderRadius: `${radius + 2}px`,
                  border: `1px solid ${mColor}`,
                  opacity: 0.3 + pulseEffect * 0.7,
                  pointerEvents: 'none',
                }}
              />
            )}
          </div>
        );
      })}
      </div>
    </RemotionElementWrapper>
  );
};
