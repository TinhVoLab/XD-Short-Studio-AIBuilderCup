import React from 'react';
import { spring, interpolate } from 'remotion';
import { AdvElementProps } from '../types';
import { MindmapFlowData, MindmapBranchItem } from '@/types/scene';
import { renderUniversalIcon } from '../../utils/icons';

export const MindmapFlowElement: React.FC<AdvElementProps> = ({
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

  const data: MindmapFlowData = el.mindmapFlowData || {
    centerNode: { label: 'Atomic Habits', subLabel: 'Quy tắc 4 bước', icon: 'brain' },
    branches: [
      { id: 'b1', label: '1. Rõ Ràng', subLabel: 'Tạo gợi ý (Cue)', icon: 'eye', color: 'var(--chart-series-1, #00D4FF)', side: 'left' },
      { id: 'b2', label: '2. Hấp Dẫn', subLabel: 'Tạo khao khát', icon: 'sparkle', color: 'var(--chart-series-2, #FFB800)', side: 'left' },
      { id: 'b3', label: '3. Dễ Dàng', subLabel: 'Hành động nhỏ', icon: 'zap', color: 'var(--chart-series-3, #BEFF01)', side: 'right' },
      { id: 'b4', label: '4. Thỏa Mãn', subLabel: 'Phần thưởng ngay', icon: 'target', color: 'var(--chart-series-4, #00FF88)', side: 'right' },
    ],
  };

  const isVertical = data.layout === 'vertical';

  const centerNode = data.centerNode || {
    label: 'Atomic Habits',
    subLabel: 'Quy tắc 4 bước',
    icon: 'brain',
  };

  const rawBranches: MindmapBranchItem[] = data.branches && data.branches.length > 0 ? data.branches : [
    { id: 'b1', label: '1. Rõ Ràng', subLabel: 'Tạo gợi ý (Cue)', icon: 'eye', color: 'var(--chart-series-1, #00D4FF)', side: 'left' },
    { id: 'b2', label: '2. Hấp Dẫn', subLabel: 'Tạo khao khát', icon: 'sparkle', color: 'var(--chart-series-2, #FFB800)', side: 'left' },
    { id: 'b3', label: '3. Dễ Dàng', subLabel: 'Hành động nhỏ', icon: 'zap', color: 'var(--chart-series-3, #BEFF01)', side: 'right' },
    { id: 'b4', label: '4. Thỏa Mãn', subLabel: 'Phần thưởng ngay', icon: 'target', color: 'var(--chart-series-4, #00FF88)', side: 'right' },
  ];

  // Phân chia nhánh sang Group 1 (Trái / Trên) & Group 2 (Phải / Dưới)
  const group1Branches: MindmapBranchItem[] = [];
  const group2Branches: MindmapBranchItem[] = [];

  rawBranches.forEach((b, idx) => {
    if (b.side === 'left') {
      group1Branches.push(b);
    } else if (b.side === 'right') {
      group2Branches.push(b);
    } else {
      // Tự động phân bổ đều 2 bên
      if (idx % 2 === 0) group1Branches.push(b);
      else group2Branches.push(b);
    }
  });

  // Kích thước Center Hub
  const centerW = isVertical ? Math.min(160, w * 0.45) : Math.min(110, w * 0.3);
  const centerH = isVertical ? Math.min(50, h * 0.2) : Math.min(60, h * 0.25);
  const centerLeft = w / 2 - centerW / 2;
  const centerTop = h / 2 - centerH / 2;
  const centerCenterX = w / 2;
  const centerCenterY = h / 2;

  // Kích thước Branch Nodes
  // Chiều Ngang: Xếp dọc 2 bên
  const branchW_H = Math.min(105, w * 0.3);
  const branchH_H = Math.min(48, (h - 20) / Math.max(group1Branches.length, group2Branches.length, 1));

  // Chiều Dọc: Dàn ngang Trên (Group 1) và Dưới (Group 2)
  const branchW_V = Math.min(105, (w - 20) / Math.max(group1Branches.length, group2Branches.length, 1));
  const branchH_V = Math.min(52, h * 0.24);

  const branchW = isVertical ? branchW_V : branchW_H;
  const branchH = isVertical ? branchH_V : branchH_H;

  // Tọa độ tính toán cho các nhánh
  const getBranchPos = (branch: MindmapBranchItem, indexOnGroup: number, totalOnGroup: number, isGroup1: boolean) => {
    if (isVertical) {
      // Chiều Dọc: Group 1 ở Trên, Group 2 ở Dưới
      const totalW = totalOnGroup * branchW + (totalOnGroup - 1) * 8;
      const startX = (w - totalW) / 2 + branchW / 2;
      const cx = startX + indexOnGroup * (branchW + 8);
      const cy = isGroup1 ? 10 + branchH / 2 : h - 10 - branchH / 2;
      return { cx, cy, isGroup1 };
    } else {
      // Chiều Ngang: Group 1 ở Trái, Group 2 ở Phải
      const totalH = totalOnGroup * branchH + (totalOnGroup - 1) * 8;
      const startY = (h - totalH) / 2 + branchH / 2;
      const cy = startY + indexOnGroup * (branchH + 8);
      const cx = isGroup1 ? 10 + branchW / 2 : w - 10 - branchW / 2;
      return { cx, cy, isGroup1 };
    }
  };

  // Hàm tính điểm trên đường cong Cubic Bezier theo tham số t [0, 1]
  const getBezierPoint = (t: number, p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }) => {
    const oneMinusT = 1 - t;
    const x =
      Math.pow(oneMinusT, 3) * p0.x +
      3 * Math.pow(oneMinusT, 2) * t * p1.x +
      3 * oneMinusT * Math.pow(t, 2) * p2.x +
      Math.pow(t, 3) * p3.x;
    const y =
      Math.pow(oneMinusT, 3) * p0.y +
      3 * Math.pow(oneMinusT, 2) * t * p1.y +
      3 * oneMinusT * Math.pow(t, 2) * p2.y +
      Math.pow(t, 3) * p3.y;
    return { x, y };
  };

  // Animation Cycle cho hạt Synapse
  const cycleFrames = 60; // 2s cycle
  const loopFrame = Math.max(0, frame - delayFrames) % cycleFrames;
  const progress = Math.max(0, loopFrame / cycleFrames);

  const centerSpring = spring({
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
      {/* ── BACKGROUND SVG: DUAL-WING CUBIC BEZIER CURVES & SYNAPSE PHOTONS ── */}
      <svg
        width={w}
        height={h}
        style={{ position: 'absolute', top: 0, left: 0, zIndex: 0, pointerEvents: 'none' }}
      >
        {/* Render Group 1 (Left / Top) Curves & Photons */}
        {group1Branches.map((b, i) => {
          const pos = getBranchPos(b, i, group1Branches.length, true);
          let startPt = { x: 0, y: 0 };
          let endPt = { x: 0, y: 0 };
          let cp1 = { x: 0, y: 0 };
          let cp2 = { x: 0, y: 0 };

          if (isVertical) {
            startPt = { x: centerCenterX, y: centerTop + 2 };
            endPt = { x: pos.cx, y: 10 + branchH };
            const dy = (startPt.y - endPt.y) * 0.55;
            cp1 = { x: startPt.x, y: startPt.y - dy };
            cp2 = { x: endPt.x, y: endPt.y + dy };
          } else {
            startPt = { x: centerLeft + 4, y: centerCenterY };
            endPt = { x: 10 + branchW, y: pos.cy };
            const dx = (startPt.x - endPt.x) * 0.55;
            cp1 = { x: startPt.x - dx, y: startPt.y };
            cp2 = { x: endPt.x + dx, y: endPt.y };
          }

          const pathD = `M ${startPt.x} ${startPt.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${endPt.x} ${endPt.y}`;
          const branchColor = b.color || accent;

          const photonPt = getBezierPoint(progress, startPt, cp1, cp2, endPt);
          const photonOpacity = interpolate(progress, [0, 0.1, 0.9, 1], [0, 1, 1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          return (
            <g key={`g1-branch-${b.id || i}`}>
              {/* Outer Layer Halo Curve */}
              <path d={pathD} fill="none" stroke={branchColor} strokeWidth={4.5} opacity={0.2} />
              {/* Core Curve */}
              <path d={pathD} fill="none" stroke={branchColor} strokeWidth={1.6} strokeDasharray="4 3" opacity={0.7} />

              {/* Moving Synapse Photon */}
              <circle cx={photonPt.x} cy={photonPt.y} r={6} fill={branchColor} opacity={photonOpacity * 0.3} />
              <circle cx={photonPt.x} cy={photonPt.y} r={3} fill="#FFFFFF" opacity={photonOpacity} />
            </g>
          );
        })}

        {/* Render Group 2 (Right / Bottom) Curves & Photons */}
        {group2Branches.map((b, i) => {
          const pos = getBranchPos(b, i, group2Branches.length, false);
          let startPt = { x: 0, y: 0 };
          let endPt = { x: 0, y: 0 };
          let cp1 = { x: 0, y: 0 };
          let cp2 = { x: 0, y: 0 };

          if (isVertical) {
            startPt = { x: centerCenterX, y: centerTop + centerH - 2 };
            endPt = { x: pos.cx, y: h - 10 - branchH };
            const dy = (endPt.y - startPt.y) * 0.55;
            cp1 = { x: startPt.x, y: startPt.y + dy };
            cp2 = { x: endPt.x, y: endPt.y - dy };
          } else {
            startPt = { x: centerLeft + centerW - 4, y: centerCenterY };
            endPt = { x: w - 10 - branchW, y: pos.cy };
            const dx = (endPt.x - startPt.x) * 0.55;
            cp1 = { x: startPt.x + dx, y: startPt.y };
            cp2 = { x: endPt.x - dx, y: endPt.y };
          }

          const pathD = `M ${startPt.x} ${startPt.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${endPt.x} ${endPt.y}`;
          const branchColor = b.color || accent;

          const photonPt = getBezierPoint(progress, startPt, cp1, cp2, endPt);
          const photonOpacity = interpolate(progress, [0, 0.1, 0.9, 1], [0, 1, 1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          return (
            <g key={`g2-branch-${b.id || i}`}>
              {/* Outer Layer Halo Curve */}
              <path d={pathD} fill="none" stroke={branchColor} strokeWidth={4.5} opacity={0.2} />
              {/* Core Curve */}
              <path d={pathD} fill="none" stroke={branchColor} strokeWidth={1.6} strokeDasharray="4 3" opacity={0.7} />

              {/* Moving Synapse Photon */}
              <circle cx={photonPt.x} cy={photonPt.y} r={6} fill={branchColor} opacity={photonOpacity * 0.3} />
              <circle cx={photonPt.x} cy={photonPt.y} r={3} fill="#FFFFFF" opacity={photonOpacity} />
            </g>
          );
        })}
      </svg>

      {/* ── 1. CENTER CORE HUB (Chủ đề trung tâm) ── */}
      <div
        style={{
          position: 'absolute',
          left: centerLeft,
          top: centerTop,
          width: centerW,
          height: centerH,
          backgroundColor: bgColor,
          border: `2px solid ${accent}`,
          borderRadius: radius,
          display: 'flex',
          flexDirection: isVertical ? 'row' : 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isVertical ? 8 : 1,
          padding: '4px 8px',
          boxSizing: 'border-box',
          zIndex: 2,
          opacity: interpolate(centerSpring, [0, 1], [0, 1]),
          transform: `scale(${interpolate(centerSpring, [0, 1], [0.8, 1])})`,
          boxShadow: `var(--shadow-md, 0 8px 24px rgba(0,0,0,0.6))`,
          textAlign: isVertical ? 'left' : 'center',
        }}
      >
        {centerNode.icon && (
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            {renderUniversalIcon(centerNode.icon, accent, isVertical ? 20 : 16)}
          </span>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: isVertical ? 'flex-start' : 'center', minWidth: 0, flex: 1 }}>
          <span
            style={{
              fontSize: isVertical ? 12 : 11,
              fontWeight: 900,
              color: 'var(--text, #FFF)',
              fontFamily: el.fontFamily || 'Be Vietnam Pro, Inter, sans-serif',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              width: '100%',
            }}
          >
            {centerNode.label}
          </span>
          {centerNode.subLabel && (
            <span
              style={{
                fontSize: isVertical ? 9 : 8,
                fontWeight: 600,
                color: 'var(--text-sub)',
                fontFamily: 'Inter, sans-serif',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                width: '100%',
              }}
            >
              {centerNode.subLabel}
            </span>
          )}
        </div>
      </div>

      {/* ── 2. GROUP 1 BRANCH NODES (Left / Top) ── */}
      {group1Branches.map((b, i) => {
        const pos = getBranchPos(b, i, group1Branches.length, true);
        const bSpring = spring({
          fps,
          frame: Math.max(0, frame - delayFrames - 6 - i * 5),
          config: { damping: 14, stiffness: 100 },
        });
        const branchColor = b.color || accent;

        return (
          <div
            key={b.id || `g1-${i}`}
            style={{
              position: 'absolute',
              left: isVertical ? pos.cx - branchW / 2 : 10,
              top: isVertical ? 10 : pos.cy - branchH / 2,
              width: branchW,
              height: branchH,
              backgroundColor: bgColor,
              border: `1px solid color-mix(in srgb, ${branchColor} 40%, transparent)`,
              borderRadius: radius,
              display: 'flex',
              flexDirection: isVertical ? 'column' : 'row',
              alignItems: 'center',
              justifyContent: isVertical ? 'center' : 'flex-start',
              padding: isVertical ? '4px 4px' : '4px 8px',
              gap: isVertical ? 2 : 6,
              boxSizing: 'border-box',
              zIndex: 1,
              opacity: interpolate(bSpring, [0, 1], [0, 1]),
              transform: `scale(${interpolate(bSpring, [0, 1], [0.85, 1])})`,
              boxShadow: `0 4px 12px rgba(0,0,0,0.3)`,
              textAlign: isVertical ? 'center' : 'left',
            }}
          >
            {b.icon && (
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {renderUniversalIcon(b.icon, accent, isVertical ? 15 : 14)}
              </span>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: isVertical ? 'center' : 'flex-start', minWidth: 0, flex: 1 }}>
              <span
                style={{
                  fontSize: isVertical ? 9 : 9.5,
                  fontWeight: 700,
                  color: 'var(--text, #FFF)',
                  fontFamily: el.fontFamily || 'Be Vietnam Pro, Inter, sans-serif',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  width: '100%',
                }}
              >
                {b.label}
              </span>
              {b.subLabel && (
                <span
                  style={{
                    fontSize: isVertical ? 7.5 : 7.5,
                    fontWeight: 500,
                    color: 'var(--text-sub)',
                    fontFamily: 'Inter, sans-serif',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%',
                  }}
                >
                  {b.subLabel}
                </span>
              )}
            </div>
          </div>
        );
      })}

      {/* ── 3. GROUP 2 BRANCH NODES (Right / Bottom) ── */}
      {group2Branches.map((b, i) => {
        const pos = getBranchPos(b, i, group2Branches.length, false);
        const bSpring = spring({
          fps,
          frame: Math.max(0, frame - delayFrames - 6 - i * 5),
          config: { damping: 14, stiffness: 100 },
        });
        const branchColor = b.color || accent;

        return (
          <div
            key={b.id || `g2-${i}`}
            style={{
              position: 'absolute',
              left: isVertical ? pos.cx - branchW / 2 : w - 10 - branchW,
              top: isVertical ? h - 10 - branchH : pos.cy - branchH / 2,
              width: branchW,
              height: branchH,
              backgroundColor: bgColor,
              border: `1px solid color-mix(in srgb, ${branchColor} 40%, transparent)`,
              borderRadius: radius,
              display: 'flex',
              flexDirection: isVertical ? 'column' : 'row',
              alignItems: 'center',
              justifyContent: isVertical ? 'center' : 'flex-start',
              padding: isVertical ? '4px 4px' : '4px 8px',
              gap: isVertical ? 2 : 6,
              boxSizing: 'border-box',
              zIndex: 1,
              opacity: interpolate(bSpring, [0, 1], [0, 1]),
              transform: `scale(${interpolate(bSpring, [0, 1], [0.85, 1])})`,
              boxShadow: `0 4px 12px rgba(0,0,0,0.3)`,
              textAlign: isVertical ? 'center' : 'left',
            }}
          >
            {b.icon && (
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {renderUniversalIcon(b.icon, accent, isVertical ? 15 : 14)}
              </span>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: isVertical ? 'center' : 'flex-start', minWidth: 0, flex: 1 }}>
              <span
                style={{
                  fontSize: isVertical ? 9 : 9.5,
                  fontWeight: 700,
                  color: 'var(--text, #FFF)',
                  fontFamily: el.fontFamily || 'Be Vietnam Pro, Inter, sans-serif',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  width: '100%',
                }}
              >
                {b.label}
              </span>
              {b.subLabel && (
                <span
                  style={{
                    fontSize: isVertical ? 7.5 : 7.5,
                    fontWeight: 500,
                    color: 'var(--text-sub)',
                    fontFamily: 'Inter, sans-serif',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%',
                  }}
                >
                  {b.subLabel}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
