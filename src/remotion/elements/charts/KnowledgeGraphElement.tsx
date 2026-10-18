import { RemotionElementWrapper } from '../core/RemotionElementWrapper';
import React, { useMemo } from 'react';
import { spring, interpolate, useVideoConfig } from 'remotion';
import { AdvElementProps } from '../types';
import { KnowledgeGraphData } from '@/types/scene';
import { renderUniversalIcon } from '../../utils/icons';
import { calculateElementDynamicHeight } from '@/config/layoutRegistry';
import { mixColor, readableTint } from '../../utils/rich-text-parser';

/** Màu series dùng làm CHỮ: pha 40% --text để đạt ≥ 4.5:1 trên nền card ở mọi palette */

const DEFAULT_GRAPH_DATA: KnowledgeGraphData = {
  title: 'Cây tri thức di truyền học',
  layout: 'cascade',
  theme: 'obsidian-dark',
  nodes: [
    { id: 'root', label: 'Di truyền học', subLabel: 'Gregor Mendel', icon: 'plant', tier: 0, color: 'var(--accent, #BEFF01)' },
    { id: 'n1', label: '1. Đồng tính', subLabel: 'F1 100% Trội', icon: 'dna', tier: 1, color: 'var(--chart-series-1, #00D4FF)', parentId: 'root', insight: 'F1 đồng hình tính trạng trội khi bố mẹ thuần chủng tương phản.' },
    { id: 'n2', label: '2. Phân li', subLabel: 'Tỉ lệ 3 trội : 1 lặn', icon: 'scale', tier: 1, color: 'var(--chart-series-2, #FFB800)', parentId: 'root', insight: 'Đời F2 phân li theo tỉ lệ trung bình 3 trội : 1 lặn.' },
    { id: 'n3', label: '3. Phân li độc lập', subLabel: 'Tỉ lệ 9:3:3:1', icon: 'zap', tier: 1, color: 'var(--chart-series-3, #BEFF01)', parentId: 'root', insight: 'Các cặp alen phân li độc lập tạo ra 4 loại giao tử cân bằng.' },
    { id: 'n4', label: 'Đậu Hà Lan', subLabel: 'Đối tượng nghiên cứu', icon: 'target', tier: 2, color: 'var(--chart-series-4, #00FF88)', parentId: 'n3', insight: 'Tự thụ phấn nghiêm ngặt với các cặp tính trạng tương phản rõ rệt.' },
  ],
  activeNodeId: 'n3',
  showParticles: true,
  autoBloom: true,
  cameraZoom: true,
  cameraZoomLevel: 1.45,
  heroMorph: true,
  safeZonePlatform: 'tiktok',
  showMiniMap: true,
  loopableEnding: true,
  showGridBackground: true,
};

export const PLATFORM_SAFE_ZONES: Record<string, { top: number; bottom: number; left: number; right: number }> = {
  tiktok: { top: 0.10, bottom: 0.20, left: 0.04, right: 0.16 }, // né sidebar nút bên phải
  reels:  { top: 0.12, bottom: 0.18, left: 0.04, right: 0.14 },
  shorts: { top: 0.14, bottom: 0.16, left: 0.04, right: 0.10 },
  none:   { top: 0,    bottom: 0,    left: 0,    right: 0 },
};

function estimateInsightTypography(text: string) {
  if (!text) return { fontSize: 10, maxLines: 2, formattedText: '' };
  const len = text.length;
  let fontSize = 11;
  let maxLines = 3;
  if (len > 100) {
    fontSize = 9.5;
    maxLines = 4;
  } else if (len > 60) {
    fontSize = 10.5;
    maxLines = 3;
  } else if (len > 30) {
    fontSize = 11.5;
    maxLines = 2;
  } else {
    fontSize = 12;
    maxLines = 2;
  }
  return { fontSize, maxLines, formattedText: text };
}

function estimateHeroCardHeight(n: any, heroCardW: number): number {
  // 1. Calculate Row 1 (Header) Height
  const padX = 22; // 11px left + 11px right padding
  const iconW = 22;
  const badgeW = n.subLabel ? (n.subLabel.length * 6 + 14) : 0;
  const gap = 6;
  
  const labelW = heroCardW - padX - iconW - gap - badgeW - gap;
  const charAvgW = 6.2; // roughly 6.2px per character for 11px bold text
  const estimatedLabelTextW = (n.label || '').length * charAvgW;
  
  const labelLines = Math.max(1, Math.ceil(estimatedLabelTextW / Math.max(40, labelW)));
  const row1H = Math.max(22, labelLines * 11 * 1.2);
  
  // 2. Calculate Insight Text Height
  const insightText = n.insight || n.subLabel || '';
  let insightH = 0;
  
  if (insightText) {
    const typo = estimateInsightTypography(insightText);
    const insightAvailableW = heroCardW - padX;
    const charW = typo.fontSize * 0.52; // roughly half the font size per char
    const estimatedInsightTextW = insightText.length * charW;
    
    let insightLines = Math.ceil(estimatedInsightTextW / Math.max(40, insightAvailableW));
    insightLines = Math.min(insightLines, typo.maxLines); // Clamp to max lines allowed
    insightLines = Math.max(1, insightLines); // At least 1 line
    
    insightH = insightLines * typo.fontSize * 1.38 + 5; // +5 for divider & margin
  }
  
  // 3. Sum up all vertical spaces
  const padTop = 8;
  const padBot = 8;
  const gapBetween = insightH > 0 ? 5 : 0;
  
  return padTop + row1H + gapBetween + insightH + padBot;
}

function getCubicBezierPoint(
  t: number,
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number }
) {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
    y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
  };
}

function getQuadraticBezierPoint(
  t: number,
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number }
) {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  return {
    x: mt2 * p0.x + 2 * mt * t * p1.x + t2 * p2.x,
    y: mt2 * p0.y + 2 * mt * t * p1.y + t2 * p2.y,
  };
}

function getSpineTrunkBranchPoint(
  t: number,
  spineX: number,
  spineStartY: number,
  finalToX: number,
  finalToY: number
) {
  const isLeft = finalToX < spineX;
  const cornerRadius = 8;
  const deltaY = finalToY - spineStartY;

  if (deltaY > cornerRadius * 2) {
    const d1 = Math.max(0, finalToY - cornerRadius - spineStartY);
    const d2 = 12; // arc approx length
    const d3 = Math.max(0, Math.abs(finalToX - (spineX + (isLeft ? -cornerRadius : cornerRadius))));
    const totalD = d1 + d2 + d3 || 1;

    const curD = t * totalD;
    if (curD <= d1) {
      const segT = d1 > 0 ? curD / d1 : 0;
      return { x: spineX, y: spineStartY + segT * (finalToY - cornerRadius - spineStartY) };
    } else if (curD <= d1 + d2) {
      const segT = (curD - d1) / d2;
      return getQuadraticBezierPoint(
        segT,
        { x: spineX, y: finalToY - cornerRadius },
        { x: spineX, y: finalToY },
        { x: spineX + (isLeft ? -cornerRadius : cornerRadius), y: finalToY }
      );
    } else {
      const segT = d3 > 0 ? (curD - d1 - d2) / d3 : 0;
      const startX = spineX + (isLeft ? -cornerRadius : cornerRadius);
      return { x: startX + segT * (finalToX - startX), y: finalToY };
    }
  } else {
    const d1 = Math.max(0, finalToY - spineStartY);
    const d2 = Math.abs(finalToX - spineX);
    const totalD = d1 + d2 || 1;
    const curD = t * totalD;
    if (curD <= d1) {
      const segT = d1 > 0 ? curD / d1 : 0;
      return { x: spineX, y: spineStartY + segT * d1 };
    } else {
      const segT = d2 > 0 ? (curD - d1) / d2 : 0;
      return { x: spineX + segT * (finalToX - spineX), y: finalToY };
    }
  }
}

export const KnowledgeGraphElement: React.FC<AdvElementProps> = ({
  el,
  computedStyle,
  positionStyle,
  frame = 0,
  fps = 30,
  delayFrames = 0,
  sceneDuration,
  durFrames,
}) => {
  const { durationInFrames } = useVideoConfig();
  
  // ── 0. Dynamic Dimensions (Zero-Hardcode SSOT) ──
  const w = el.width || 360;
  const h = (typeof el.height === 'number' && el.height > 0) ? el.height : calculateElementDynamicHeight(el);
  const accent = el.accentColor || 'var(--accent, #BEFF01)';
  const radius = el.radius !== undefined ? el.radius : 0;

  const graphData: KnowledgeGraphData = useMemo(() => {
    const raw = el.knowledgeGraphData || {};
    return {
      ...DEFAULT_GRAPH_DATA,
      ...raw,
      // Nếu el.knowledgeGraphData có truyền activeNodeId (kể cả null/undefined), tôn trọng 100% để hiển thị toàn cảnh tổng quan
      activeNodeId: ('activeNodeId' in raw ? (raw.activeNodeId as string | null | undefined) : DEFAULT_GRAPH_DATA.activeNodeId),
    };
  }, [el.knowledgeGraphData]);

  const layout = graphData.layout || 'cascade';
  const rawNodes = graphData.nodes && graphData.nodes.length > 0 ? graphData.nodes : DEFAULT_GRAPH_DATA.nodes;

  const rootNode = useMemo(() => {
    return rawNodes.find(n => n.tier === 0) || rawNodes[0] || DEFAULT_GRAPH_DATA.nodes[0];
  }, [rawNodes]);

  const childNodes = useMemo(() => {
    return rawNodes.filter(n => n.id !== rootNode.id);
  }, [rawNodes, rootNode.id]);

  const activeNodeId = graphData.activeNodeId || undefined;
  const activeNode = useMemo(() => {
    return activeNodeId ? rawNodes.find(n => n.id === activeNodeId) : undefined;
  }, [rawNodes, activeNodeId]);

  // Usable vertical and horizontal space
  const padX = Math.max(16, w * 0.045);
  const contentW = w - padX * 2;
  const headerBarH = 48;
  const padBottom = 20;
  const usableH = Math.max(180, h - headerBarH - padBottom);

  // ── 1. Calculate Proportional Layout Coordinates (Zero-Hardcode) ──
  const layoutCoords = useMemo(() => {
    const coords: Record<string, { x: number; y: number }> = {};

    if (layout === 'cascade') {
      // Cascade Tree: Root at top, child tiers distributed along usableH
      const rootY = headerBarH + usableH * 0.08;
      coords[rootNode.id] = { x: w / 2, y: rootY };

      const tier1 = childNodes.filter(n => n.tier === 1);
      const tier2 = childNodes.filter(n => n.tier === 2);
      const hasTier2 = tier2.length > 0;

      const tier1Y = hasTier2 ? (rootY + usableH * 0.42) : (rootY + usableH * 0.55);
      const tier1Count = Math.max(1, tier1.length);

      tier1.forEach((n, idx) => {
        const spacing = contentW / (tier1Count + 1);
        coords[n.id] = { x: padX + spacing * (idx + 1), y: tier1Y };
      });

      if (hasTier2) {
        const tier2Y = rootY + usableH * 0.82;
        tier2.forEach((n, idx) => {
          const parentCoord = n.parentId ? coords[n.parentId] : null;
          if (parentCoord) {
            coords[n.id] = { x: parentCoord.x, y: tier2Y };
          } else {
            const spacing2 = contentW / (tier2.length + 1);
            coords[n.id] = { x: padX + spacing2 * (idx + 1), y: tier2Y };
          }
        });
      }

    } else if (layout === 'spine') {
      // Spine Zigzag: Central Vertical Axis with Alternating Family Clusters
      const rootY = headerBarH + usableH * 0.08;
      const spineX = w / 2;
      coords[rootNode.id] = { x: spineX, y: rootY };

      const tier1 = childNodes.filter(n => n.tier === 1);
      const tier2 = childNodes.filter(n => n.tier === 2);

      // Separate Tier 1 branches alternately to Left and Right wings
      const leftT1: typeof tier1 = [];
      const rightT1: typeof tier1 = [];
      tier1.forEach((n, idx) => {
        if (idx % 2 === 0) leftT1.push(n);
        else rightT1.push(n);
      });

      interface SpineSideItem {
        node: typeof childNodes[0];
        isParent: boolean;
        parentId?: string;
      }

      // Group each parent with all its children on the same wing
      const leftItems: SpineSideItem[] = [];
      leftT1.forEach(p => {
        leftItems.push({ node: p, isParent: true });
        const children = tier2.filter(c => c.parentId === p.id);
        children.forEach(c => {
          leftItems.push({ node: c, isParent: false, parentId: p.id });
        });
      });

      const rightItems: SpineSideItem[] = [];
      rightT1.forEach(p => {
        rightItems.push({ node: p, isParent: true });
        const children = tier2.filter(c => c.parentId === p.id);
        children.forEach(c => {
          rightItems.push({ node: c, isParent: false, parentId: p.id });
        });
      });

      // Defensive catch-all for any unassigned Tier 2 nodes
      const assignedIds = new Set([
        ...leftItems.map(it => it.node.id),
        ...rightItems.map(it => it.node.id),
      ]);
      tier2.filter(c => !assignedIds.has(c.id)).forEach(c => {
        if (leftItems.length <= rightItems.length) {
          leftItems.push({ node: c, isParent: false, parentId: leftT1[0]?.id });
        } else {
          rightItems.push({ node: c, isParent: false, parentId: rightT1[0]?.id });
        }
      });

      const startY = rootY + 56;
      const availableSpineH = usableH * 0.78;
      const xOffsetT1 = contentW * 0.28;
      const xOffsetT2 = contentW * 0.35;

      // Layout Left wing
      const nLeft = leftItems.length;
      if (nLeft > 0) {
        const gapY = nLeft > 1 ? Math.min(68, availableSpineH / Math.max(1, nLeft - 1)) : 0;
        const totalSpan = (nLeft - 1) * gapY;
        const sideStartY = startY + Math.max(0, (availableSpineH - totalSpan) / 2);
        leftItems.forEach((it, idx) => {
          const curY = nLeft === 1 ? (startY + availableSpineH * 0.35) : (sideStartY + idx * gapY);
          const curX = it.isParent ? (spineX - xOffsetT1) : (spineX - xOffsetT2);
          coords[it.node.id] = { x: curX, y: curY };
        });
      }

      // Layout Right wing
      const nRight = rightItems.length;
      if (nRight > 0) {
        const gapY = nRight > 1 ? Math.min(68, availableSpineH / Math.max(1, nRight - 1)) : 0;
        const totalSpan = (nRight - 1) * gapY;
        const sideStartY = startY + Math.max(0, (availableSpineH - totalSpan) / 2);
        rightItems.forEach((it, idx) => {
          const curY = nRight === 1 ? (startY + availableSpineH * 0.35) : (sideStartY + idx * gapY);
          const curX = it.isParent ? (spineX + xOffsetT1) : (spineX + xOffsetT2);
          coords[it.node.id] = { x: curX, y: curY };
        });
      }

    } else {
      // Vertical Ellipse Orbit
      const cx = w / 2;
      const cy = headerBarH + usableH / 2;
      coords[rootNode.id] = { x: cx, y: cy };

      const tier1 = childNodes.filter(n => n.tier === 1);
      const tier2 = childNodes.filter(n => n.tier === 2);
      
      const count1 = Math.max(1, tier1.length);
      const rx1 = contentW * 0.28;
      const ry1 = usableH * 0.28;
      
      const t1Angles = new Map<string, number>();

      tier1.forEach((n, idx) => {
        const angle = (idx * 2 * Math.PI) / count1 - Math.PI / 2;
        t1Angles.set(n.id, angle);
        coords[n.id] = {
          x: cx + Math.cos(angle) * rx1,
          y: cy + Math.sin(angle) * ry1,
        };
      });

      // Group T2 by parent
      const t2ByParent = new Map<string, typeof tier2>();
      tier2.forEach(n => {
        const pId = n.parentId || (tier1[0]?.id) || rootNode.id;
        const list = t2ByParent.get(pId) || [];
        list.push(n);
        t2ByParent.set(pId, list);
      });

      const rx2 = contentW * 0.42;
      const ry2 = usableH * 0.42;

      t2ByParent.forEach((children, pId) => {
        const parentAngle = t1Angles.get(pId) ?? 0;
        const count2 = children.length;
        children.forEach((c, cIdx) => {
          let childAngle = parentAngle;
          if (count2 === 1) {
            const isNearSide = Math.abs(Math.cos(parentAngle)) > 0.45;
            const tilt = isNearSide ? 0.46 : 0.38;
            childAngle = parentAngle + (parentAngle >= 0 ? tilt : -tilt);
          } else {
            const spread = Math.min(Math.PI * 0.55, 0.42 * count2);
            const offset = (cIdx - (count2 - 1) / 2) * (spread / (count2 - 1));
            childAngle = parentAngle + offset;
          }
          coords[c.id] = {
            x: cx + Math.cos(childAngle) * rx2,
            y: cy + Math.sin(childAngle) * ry2,
          };
        });
      });
    }

    return coords;
  }, [w, h, layout, rootNode.id, childNodes, contentW, padX, headerBarH, usableH]);

  // ── 2. Graph Bounding Box & Dimensions ──
  const graphBBox = useMemo(() => {
    const allCoords = Object.values(layoutCoords);
    if (allCoords.length === 0) return { minX: 0, maxX: w, minY: 0, maxY: h, width: w, height: h };
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    allCoords.forEach(c => {
      if (c.x < minX) minX = c.x;
      if (c.x > maxX) maxX = c.x;
      if (c.y < minY) minY = c.y;
      if (c.y > maxY) maxY = c.y;
    });
    return {
      minX,
      maxX,
      minY,
      maxY,
      width: Math.max(w * 0.88, (maxX - minX) + 140),
      height: Math.max(h * 0.88, (maxY - minY) + 120),
    };
  }, [layoutCoords, w, h]);

  // ── 3. Radial Push-Out (Collision Avoidance khi Hero Card bung) ──
  const pushOutOffsets = useMemo(() => {
    if (!activeNode || graphData.heroMorph === false) return {};
    const activeCoord = layoutCoords[activeNode.id];
    if (!activeCoord) return {};

    const baseCardW = layout === 'spine' ? Math.min(138, contentW * 0.44) : Math.min(118, contentW * 0.35);
    const heroCardW = Math.min(202, contentW * 0.66);
    const minSafeDist = (heroCardW / 2) + (baseCardW / 2) + 24;

    const offsets: Record<string, { x: number; y: number }> = {};
    rawNodes.forEach(n => {
      if (n.id === activeNode.id) {
        offsets[n.id] = { x: 0, y: 0 };
        return;
      }
      const c = layoutCoords[n.id];
      if (!c) return;
      const dx = c.x - activeCoord.x;
      const dy = c.y - activeCoord.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < minSafeDist) {
        const factor = (minSafeDist - dist) * 0.95;
        offsets[n.id] = {
          x: (dx / dist) * factor,
          y: (dy / dist) * factor,
        };
      } else {
        offsets[n.id] = { x: 0, y: 0 };
      }
    });

    return offsets;
  }, [activeNode, graphData.heroMorph, layoutCoords, rawNodes, contentW]);

  // ── 4. Cinematic Camera Matrix & True Viewport Centering ──
  // Cấp độ 2: Scene Role Awareness - Cảnh Tổng kết / Tổng quan không bao giờ kích hoạt zoom
  const isOverviewMode = !activeNode || !activeNodeId;
  const cameraActive = !isOverviewMode && graphData.cameraZoom !== false;
  const zoomLevel = graphData.cameraZoomLevel || 1.45;

  // Cấp độ 1: Dynamic Responsive Timing (Đồng bộ tuyệt đối theo thời lượng từng cảnh trên Timeline)
  const fpsRate = fps || 30;
  const effectiveSceneSec = sceneDuration || (durFrames ? durFrames / fpsRate : (durationInFrames ? durationInFrames / fpsRate : 5));
  const sceneDurSec = Math.max(1, effectiveSceneSec);
  const effectiveSceneFrames = durFrames || Math.round(sceneDurSec * fpsRate);

  // Establishing Shot: Giữ góc nhìn toàn cảnh để người xem định vị cây kiến thức
  // Mặc định: 15% thời lượng đầu cảnh, tối thiểu 0.6s, tối đa 1.4s (nếu người dùng không tùy chỉnh)
  const defaultEstablishingSec = Math.min(1.4, Math.max(0.6, sceneDurSec * 0.15));
  const effectiveEstablishingSec = typeof graphData.cameraDelaySec === 'number'
    ? graphData.cameraDelaySec
    : defaultEstablishingSec;
  const establishingDelay = Math.round(effectiveEstablishingSec * fpsRate);

  // Loop Out Ending: Lướt camera về lại toàn cảnh ở 12% cuối cảnh (khoảng 0.5s - 0.8s)
  const defaultLoopSec = Math.min(0.8, Math.max(0.5, sceneDurSec * 0.12));
  const effectiveLoopSec = typeof graphData.loopDurationSec === 'number'
    ? graphData.loopDurationSec
    : defaultLoopSec;
  const loopFrames = Math.round(effectiveLoopSec * fpsRate);

  const shouldLoopOut = cameraActive && graphData.loopableEnding !== false && effectiveSceneFrames > loopFrames * 2.5;
  const loopOutProgress = (shouldLoopOut && frame >= effectiveSceneFrames - loopFrames)
    ? interpolate(frame, [effectiveSceneFrames - loopFrames, effectiveSceneFrames], [0, 1], { extrapolateRight: 'clamp' })
    : 0;

  const springCam = spring({
    frame: Math.max(0, frame - delayFrames - establishingDelay),
    fps: fpsRate,
    config: { stiffness: 80, damping: 18, mass: 1.0 },
  });

  const camFactor = cameraActive ? Math.max(0, springCam * (1 - loopOutProgress)) : 0;

  // Exact Viewport Center (True Center 50% / 50%)
  const viewportH = h - headerBarH;
  const viewportCenterX = w / 2;
  const viewportCenterY = viewportH / 2;

  const targetCoord = activeNode ? layoutCoords[activeNode.id] : null;
  const targetX = targetCoord ? targetCoord.x : viewportCenterX;
  const targetY = targetCoord ? targetCoord.y : viewportCenterY;

  const curScale = interpolate(camFactor, [0, 1], [1.0, zoomLevel]);

  // Exact zero-drift camera pan to bring target node to (viewportCenterX, viewportCenterY)
  const camX = (viewportCenterX - targetX) * camFactor;
  const camY = (viewportCenterY - targetY) * camFactor;

  // ── 5. Staggered Animations for Elements ──
  const progressRoot = spring({
    frame: Math.max(0, frame - delayFrames),
    fps,
    config: { damping: 14, stiffness: 120 },
  });
  const rootScale = interpolate(progressRoot, [0, 1], [0.4, 1]);
  const rootOpacity = interpolate(progressRoot, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' });

  // Floating ambient motion for organic feeling, dampened when zooming in
  const floatY = Math.sin((frame * 0.05)) * 3 * (1 - camFactor);

  // Dynamic progress badge text
  const activeBranchIndex = childNodes.findIndex(n => n.id === activeNodeId);
  const dynamicBadgeText = graphData.badgeText
    ? graphData.badgeText
    : activeBranchIndex >= 0
    ? `Nhánh ${activeBranchIndex + 1}/${childNodes.length}`
    : 'Bản đồ tổng quan';

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      <div
        style={{
          width: w,
          height: h,
          backgroundColor: el.bgColor || 'transparent',
          borderRadius: 0,
          padding: 0,
          boxSizing: 'border-box',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          overflow: 'hidden',
          fontFamily: el.fontFamily || 'var(--font-sans, sans-serif)',
          userSelect: 'none',
        }}
      >
        {/* Parallax Tech Dot-Grid Background */}
        {graphData.showGridBackground !== false && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `radial-gradient(circle, ${mixColor('var(--text)', 9)} 1px, transparent 1px)`,
              backgroundSize: '20px 20px',
              backgroundPosition: `${camX * 0.25}px ${camY * 0.25}px`,
              opacity: 0.7,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
        )}

        {/* Ambient Radial Glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at ${targetCoord ? targetCoord.x : w / 2}px ${targetCoord ? targetCoord.y : h / 2}px, ${mixColor(accent, 8)} 0%, transparent 65%)`,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />

        {/* Header Title Bar (Floating Seamless Title) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 18px 6px 18px',
            height: headerBarH,
            boxSizing: 'border-box',
            zIndex: 30,
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            {/* Clean SVG Knowledge Graph Icon */}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke={accent}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 3v6m0 6v6M3 12h6m6 0h6" />
              <circle cx="12" cy="3" r="1.5" />
              <circle cx="12" cy="21" r="1.5" />
              <circle cx="3" cy="12" r="1.5" />
              <circle cx="21" cy="12" r="1.5" />
            </svg>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--text, #FFFFFF)',
                fontFamily: el.fontFamily || 'var(--font-sans, sans-serif)',
                letterSpacing: 0.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {graphData.title || el.content || 'Cây tri thức động'}
            </span>
          </div>

          {/* Dynamic Progress / Semantic Badge */}
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: 4,
              backgroundColor: mixColor(accent, 10),
              color: readableTint(accent),
              border: `1px solid ${mixColor(accent, 25)}`,
              flexShrink: 0,
              letterSpacing: 0.2,
            }}
          >
            {dynamicBadgeText}
          </span>
        </div>

        {/* HUD Mini-Map Radar (Always on Top Layer, z-index 100) */}
        {graphData.showMiniMap !== false && camFactor > 0.15 && (
          <div
            style={{
              position: 'absolute',
              top: headerBarH + 6,
              left: 10,
              width: 52,
              height: 60,
              backgroundColor: 'var(--card-bg, #080C14)',
              border: `1px solid ${mixColor('var(--text)', 16)}`,
              borderRadius: 6,
              zIndex: 100, // Highest priority, never occluded by hero cards
              padding: '3px 4px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: 'var(--shadow-md, 0 8px 24px rgba(0,0,0,0.7))',
              opacity: Math.min(1, camFactor * 1.6),
              pointerEvents: 'none',
            }}
          >
            <span style={{ fontSize: 6.5, fontWeight: 700, color: 'var(--text-sub, #8b949e)', letterSpacing: 0.5 }}>
              RADAR
            </span>
            <svg width="42" height="46" viewBox={`0 0 ${w} ${h - headerBarH}`} style={{ overflow: 'visible', marginTop: 1 }}>
              {childNodes.map(n => {
                const pCoord = n.parentId && layoutCoords[n.parentId] ? layoutCoords[n.parentId] : layoutCoords[rootNode.id];
                const to = layoutCoords[n.id];
                if (!pCoord || !to) return null;
                return (
                  <line
                    key={`mini-line-${n.id}`}
                    x1={pCoord.x}
                    y1={pCoord.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={mixColor('var(--text)', 18)}
                    strokeWidth="2.5"
                  />
                );
              })}
              <circle cx={layoutCoords[rootNode.id]?.x || 0} cy={layoutCoords[rootNode.id]?.y || 0} r="4" fill="var(--text, #ffffff)" />
              {childNodes.map(n => {
                const c = layoutCoords[n.id];
                if (!c) return null;
                const isCurrent = activeNodeId === n.id;
                return (
                  <circle
                    key={`mini-dot-${n.id}`}
                    cx={c.x}
                    cy={c.y}
                    r={isCurrent ? '6' : '3.5'}
                    fill={isCurrent ? accent : (n.color || 'var(--chart-series-1, #00D4FF)')}
                    stroke={isCurrent ? 'var(--text, #ffffff)' : 'none'}
                    strokeWidth={isCurrent ? '1.5' : '0'}
                  />
                );
              })}
            </svg>
          </div>
        )}

        {/* ── Virtual Camera Viewport (Zoom & Pan with Infinite Edge Gradient Mask) ── */}
        <div
          style={{
            position: 'relative',
            flex: 1,
            width: '100%',
            overflow: 'hidden',
            zIndex: 10,
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 4%, black 96%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 4%, black 96%, transparent 100%)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transformOrigin: '50% 50%',
              transform: `scale(${curScale}) translate(${camX}px, ${camY}px) translateZ(0)`,
              willChange: 'transform',
              backfaceVisibility: 'hidden',
              width: '100%',
              height: '100%',
            }}
          >
            {/* SVG Graph Drawing Layer (z-index 5) */}
            <svg
              style={{ width: '100%', height: '100%', overflow: 'visible', zIndex: 5, position: 'absolute', inset: 0 }}
              viewBox={`0 0 ${w} ${h - headerBarH}`}
            >
              {/* Orbit Celestial Trajectory Rings */}
              {layout === 'orbit' && (
                <g opacity={Math.min(1, progressRoot * 0.85)}>
                  {/* Central Sun Ambient Aura */}
                  <circle
                    cx={layoutCoords[rootNode.id]?.x || w / 2}
                    cy={layoutCoords[rootNode.id]?.y || (usableH / 2 + headerBarH)}
                    r={45}
                    fill={accent}
                    opacity={0.05}
                  />
                  {/* Inner Orbit Track */}
                  <ellipse
                    cx={layoutCoords[rootNode.id]?.x || w / 2}
                    cy={layoutCoords[rootNode.id]?.y || (usableH / 2 + headerBarH)}
                    rx={contentW * 0.28}
                    ry={usableH * 0.28}
                    fill="none"
                    stroke={mixColor('var(--text)', 16)}
                    strokeWidth={1.5}
                    strokeDasharray="5 7"
                  />
                  {/* Outer Orbit Track */}
                  <ellipse
                    cx={layoutCoords[rootNode.id]?.x || w / 2}
                    cy={layoutCoords[rootNode.id]?.y || (usableH / 2 + headerBarH)}
                    rx={contentW * 0.42}
                    ry={usableH * 0.42}
                    fill="none"
                    stroke={mixColor('var(--text)', 10)}
                    strokeWidth={1.2}
                    strokeDasharray="5 7"
                  />
                </g>
              )}

              {/* Spine Central Trunk Axis */}
              {layout === 'spine' && (
                <line
                  x1={layoutCoords[rootNode.id]?.x || w / 2}
                  y1={(layoutCoords[rootNode.id]?.y || 0) + 24}
                  x2={layoutCoords[rootNode.id]?.x || w / 2}
                  y2={usableH + headerBarH - 24}
                  stroke={mixColor('var(--text)', 16)}
                  strokeWidth={1.8}
                  strokeDasharray="5 7"
                  opacity={Math.min(1, progressRoot * 0.85)}
                />
              )}

              {/* 1. Draw Connection Curves (Bezier) */}
              {childNodes.map((n, idx) => {
                const fromCoord = (n.tier === 2 && n.parentId && layoutCoords[n.parentId])
                  ? layoutCoords[n.parentId]
                  : layoutCoords[rootNode.id];
                const toCoord = layoutCoords[n.id];
                if (!fromCoord || !toCoord) return null;

                const isSpotlight = activeNodeId === n.id;
                const edgeColor = isSpotlight ? accent : (n.color || 'var(--chart-series-1, #00D4FF)');
                const edgeOpacity = activeNodeId && !isSpotlight ? 0.2 : 0.75;
                const strokeW = isSpotlight ? 2.8 : 1.5;

                // Push-out adjusted target for connection line
                const pushOffset = pushOutOffsets[n.id] || { x: 0, y: 0 };
                const finalToX = toCoord.x + pushOffset.x * camFactor;
                const finalToY = toCoord.y + pushOffset.y * camFactor;

                let pathD = '';
                if (layout === 'cascade') {
                  const midY1 = fromCoord.y + (finalToY - fromCoord.y) * 0.28;
                  const midY2 = fromCoord.y + (finalToY - fromCoord.y) * 0.72;
                  pathD = `M ${fromCoord.x} ${fromCoord.y} C ${fromCoord.x} ${midY1}, ${finalToX} ${midY2}, ${finalToX} ${finalToY}`;
                } else if (layout === 'spine') {
                  if (n.tier === 2 && n.parentId && layoutCoords[n.parentId]) {
                    // Hierarchical parent-to-child branch curve on the same wing
                    const midY = (fromCoord.y + finalToY) / 2;
                    pathD = `M ${fromCoord.x} ${fromCoord.y} C ${fromCoord.x} ${midY}, ${finalToX} ${midY}, ${finalToX} ${finalToY}`;
                  } else {
                    // Primary Tier 1 branch branching out from central spine trunk
                    const spineX = layoutCoords[rootNode.id].x;
                    const spineStartY = fromCoord.y + 36;
                    const isLeft = finalToX < spineX;
                    const cornerRadius = 8;
                    const deltaY = finalToY - spineStartY;
                    if (deltaY > cornerRadius * 2) {
                      pathD = `M ${spineX} ${spineStartY} L ${spineX} ${finalToY - cornerRadius} Q ${spineX} ${finalToY} ${spineX + (isLeft ? -cornerRadius : cornerRadius)} ${finalToY} L ${finalToX} ${finalToY}`;
                    } else {
                      pathD = `M ${spineX} ${spineStartY} L ${spineX} ${finalToY} L ${finalToX} ${finalToY}`;
                    }
                  }
                } else {
                  pathD = `M ${fromCoord.x} ${fromCoord.y} Q ${layoutCoords[rootNode.id].x} ${layoutCoords[rootNode.id].y} ${finalToX} ${finalToY}`;
                }

                const lineSpring = spring({
                  frame: Math.max(0, frame - delayFrames - idx * 4),
                  fps,
                  config: { damping: 16, stiffness: 100 },
                });

                // Deterministic Photon calculation along the exact path (Zero Jitter, Pure Math)
                const cycleFrames = Math.round((isSpotlight ? 1.2 : 2.0) * fps);
                const loopFrame = ((frame - delayFrames + idx * 7) % cycleFrames + cycleFrames) % cycleFrames;
                const photonProgress = loopFrame / cycleFrames;
                const photonOpacity = interpolate(
                  photonProgress,
                  [0, 0.12, 0.88, 1],
                  [0, 1, 1, 0],
                  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                );

                let photonPt = { x: fromCoord.x, y: fromCoord.y };
                if (layout === 'cascade') {
                  const midY1 = fromCoord.y + (finalToY - fromCoord.y) * 0.28;
                  const midY2 = fromCoord.y + (finalToY - fromCoord.y) * 0.72;
                  photonPt = getCubicBezierPoint(
                    photonProgress,
                    { x: fromCoord.x, y: fromCoord.y },
                    { x: fromCoord.x, y: midY1 },
                    { x: finalToX, y: midY2 },
                    { x: finalToX, y: finalToY }
                  );
                } else if (layout === 'spine') {
                  if (n.tier === 2 && n.parentId && layoutCoords[n.parentId]) {
                    const midY = (fromCoord.y + finalToY) / 2;
                    photonPt = getCubicBezierPoint(
                      photonProgress,
                      { x: fromCoord.x, y: fromCoord.y },
                      { x: fromCoord.x, y: midY },
                      { x: finalToX, y: midY },
                      { x: finalToX, y: finalToY }
                    );
                  } else {
                    const spineX = layoutCoords[rootNode.id].x;
                    const spineStartY = fromCoord.y + 36;
                    photonPt = getSpineTrunkBranchPoint(photonProgress, spineX, spineStartY, finalToX, finalToY);
                  }
                } else {
                  photonPt = getQuadraticBezierPoint(
                    photonProgress,
                    { x: fromCoord.x, y: fromCoord.y },
                    { x: layoutCoords[rootNode.id].x, y: layoutCoords[rootNode.id].y },
                    { x: finalToX, y: finalToY }
                  );
                }

                return (
                  <g key={`edge-${n.id}`}>
                    {/* Dual-Stroke Neon Glow Layer (Zero CPU Blur, Ultra-Fast Vector) */}
                    {isSpotlight && (
                      <path
                        d={pathD}
                        fill="none"
                        stroke={edgeColor}
                        strokeWidth={strokeW + 4}
                        strokeOpacity={0.28 * lineSpring}
                        strokeLinecap="round"
                      />
                    )}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={edgeColor}
                      strokeWidth={strokeW}
                      strokeOpacity={edgeOpacity * lineSpring}
                      strokeDasharray={isSpotlight ? 'none' : '4,3'}
                      strokeLinecap="round"
                    />

                    {/* Energy Particle Packet along the active line (Dual-Circle Glow, Frame-Deterministic) */}
                    {(isSpotlight || graphData.showParticles !== false) && (
                      <g opacity={photonOpacity}>
                        {/* Outer Glow Halo */}
                        {isSpotlight && (
                          <circle
                            cx={photonPt.x}
                            cy={photonPt.y}
                            r={6}
                            fill={accent}
                            opacity={0.35}
                          />
                        )}
                        {/* Inner High-Luminance Core */}
                        <circle
                          cx={photonPt.x}
                          cy={photonPt.y}
                          r={isSpotlight ? 3 : 2}
                          fill={isSpotlight ? 'var(--text, #FFFFFF)' : accent}
                        />
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* 2. HTML Nodes Layer */}
            {/* Root Node (z-index 15) */}
            {layoutCoords[rootNode.id] && (
              <div
                style={{
                  position: 'absolute',
                  left: layoutCoords[rootNode.id].x,
                  top: layoutCoords[rootNode.id].y,
                  transform: `translate(-50%, -50%) scale(${activeNodeId ? 0.9 * rootScale : rootScale})`,
                  // Lùi về hậu cảnh khi có tiêu điểm: chỉ làm mờ đồ hoạ, chữ chuyển --text-sub (vẫn ≥ 4.5:1)
                  opacity: rootOpacity,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  zIndex: activeNodeId ? 15 : 25,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    backgroundColor: 'var(--card-bg, #0C111E)',
                    border: `2px solid ${rootNode.color || accent}`,
                    boxShadow: `0 0 18px ${mixColor(rootNode.color || accent, 38)}`,
                    opacity: activeNodeId ? 0.35 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                  }}
                >
                  {renderUniversalIcon(rootNode.icon || 'plant', rootNode.color || accent, 18)}
                </div>

                {/* Glassmorphic Pill for Root Title & Sublabel */}
                <div
                  style={{
                    marginTop: 5,
                    padding: '3px 10px',
                    borderRadius: 12,
                    backgroundColor: activeNodeId ? mixColor('var(--card-bg)', 35) : 'var(--card-bg, #0C111E)',
                    border: `1px solid ${mixColor('var(--text)', activeNodeId ? 6 : 15)}`,
                    boxShadow: activeNodeId ? 'none' : 'var(--shadow-md, 0 4px 12px rgba(0,0,0,0.6))',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: activeNodeId ? 'var(--text-sub)' : 'var(--text, #FFFFFF)',
                      whiteSpace: 'nowrap',
                      letterSpacing: 0.2,
                    }}
                  >
                    {rootNode.label}
                  </span>
                  {rootNode.subLabel && (
                    <span
                      style={{
                        fontSize: 7.5,
                        fontWeight: 700,
                        color: activeNodeId ? 'var(--text-sub)' : readableTint(rootNode.color || accent),
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {rootNode.subLabel}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Child Nodes */}
            {childNodes.map((n, idx) => {
              const coord = layoutCoords[n.id];
              if (!coord) return null;

              const isSpotlight = activeNodeId === n.id;
              const pushOffset = pushOutOffsets[n.id] || { x: 0, y: 0 };
              const currentX = coord.x + pushOffset.x * camFactor;
              const currentY = coord.y + pushOffset.y * camFactor + (layout === 'orbit' ? floatY : 0);

              const nodeSpring = spring({
                frame: Math.max(0, frame - delayFrames - 6 - idx * 4),
                fps,
                config: { damping: 14, stiffness: 120 },
              });

              // Dynamic Card Sizing (Zero-Hardcode)
              const baseCardW = layout === 'spine' ? Math.min(138, contentW * 0.44) : Math.min(118, contentW * 0.35);
              const baseCardH = 34;
              const heroCardW = Math.min(202, contentW * 0.66);
              const heroCardH = estimateHeroCardHeight(n, heroCardW);

              const isHero = isSpotlight && graphData.heroMorph !== false;
              const cardW = isHero ? interpolate(camFactor, [0, 1], [baseCardW, heroCardW]) : baseCardW;
              const cardH = isHero ? interpolate(camFactor, [0, 1], [baseCardH, heroCardH]) : baseCardH;

              // Pure GPU Luminance & Scale Depth (0% Gaussian blur)
              const scale = isSpotlight
                ? (isHero ? 1.05 : 1.15) * nodeSpring
                : (activeNodeId ? 0.88 : 1) * nodeSpring;
              // Node lùi hậu cảnh: chỉ làm mờ nền/viền/icon, chữ chuyển --text-sub (vẫn ≥ 4.5:1)
              const isDimmed = Boolean(activeNodeId) && !isSpotlight;
              const opacity = nodeSpring;

              const insightTypography = estimateInsightTypography(n.insight || n.subLabel || '');

              // ── Idea 1: Specular Shimmer Beam Sweep ──
              const shimmerProgress = interpolate(
                frame - delayFrames - establishingDelay,
                [8, 30],
                [-130, 230],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
              );

              // ── Idea 3: Kinetic Typography Staggered Reveal ──
              const insightSpring = spring({
                frame: Math.max(0, frame - delayFrames - establishingDelay - 6),
                fps,
                config: { damping: 14, stiffness: 130 },
              });
              const insightTranslateY = interpolate(insightSpring, [0, 1], [6, 0]);
              const insightOpacity = interpolate(insightSpring, [0, 1], [0, 1]);

              return (
                <div
                  key={`node-${n.id}`}
                  style={{
                    position: 'absolute',
                    left: currentX,
                    top: currentY,
                    transform: `translate(-50%, -50%) scale(${scale}) translateZ(0)`,
                    transformOrigin: 'center center',
                    willChange: 'transform, opacity',
                    backfaceVisibility: 'hidden',
                    opacity,
                    width: cardW,
                    height: cardH,
                    borderRadius: isHero ? 10 : 8,
                    backgroundColor: isDimmed ? mixColor('var(--card-bg)', 25) : 'var(--card-bg, #0E1422)',
                    border: `1.5px solid ${isSpotlight ? (n.color || accent) : mixColor('var(--text)', isDimmed ? 5 : 12)}`,
                    boxShadow: isSpotlight
                      ? `inset 0 1px 0 rgba(255, 255, 255, 0.25), 0 0 20px ${mixColor(n.color || accent, 27)}, var(--shadow-md, 0 10px 24px rgba(0,0,0,0.75))`
                      : isDimmed ? 'none' : 'var(--shadow-sm, 0 2px 8px rgba(0,0,0,0.5))',
                    display: 'flex',
                    flexDirection: isHero && camFactor > 0.4 ? 'column' : 'row',
                    alignItems: isHero && camFactor > 0.4 ? 'stretch' : 'center',
                    padding: isHero && camFactor > 0.4 ? '8px 11px 8px 11px' : '4px 8px',
                    gap: isHero && camFactor > 0.4 ? 4 : 6,
                    boxSizing: 'border-box',
                    zIndex: isSpotlight ? 50 : 10, // Active node floats above sibling nodes
                    overflow: 'hidden',
                  }}
                >
                  {/* Idea 1: Specular Glass Reflection Shimmer */}
                  {isHero && camFactor > 0.4 && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.12) 45%, rgba(255,255,255,0.26) 50%, rgba(255,255,255,0.12) 55%, transparent 75%)',
                        transform: `translateX(${shimmerProgress}%)`,
                        pointerEvents: 'none',
                        zIndex: 2,
                      }}
                    />
                  )}

                  {/* Row 1 / Header: Icon + Label + SubLabel Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, width: '100%', zIndex: 3 }}>
                    <div
                      style={{
                        width: isHero ? 22 : 20,
                        height: isHero ? 22 : 20,
                        borderRadius: 6,
                        backgroundColor: mixColor(n.color || accent, 13),
                        opacity: isDimmed ? 0.25 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        flexShrink: 0,
                      }}
                    >
                      {renderUniversalIcon(n.icon || 'pin', n.color || accent, 12)}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                      <span
                        style={{
                          fontSize: isHero ? 11 : 9,
                          fontWeight: 800,
                          color: isDimmed ? 'var(--text-sub)' : 'var(--text, #FFFFFF)',
                          whiteSpace: isHero ? 'normal' : 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          lineHeight: 1.15,
                        }}
                      >
                        {n.label}
                      </span>
                      {(!isHero || camFactor <= 0.4) && n.subLabel && (
                        <span
                          style={{
                            fontSize: 7.5,
                            fontWeight: 600,
                            color: isDimmed ? 'var(--text-sub)' : readableTint(n.color || accent),
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {n.subLabel}
                        </span>
                      )}
                    </div>

                    {/* SubLabel Badge on Row 1 (Inline with Header) */}
                    {isHero && camFactor > 0.4 && n.subLabel && (
                      <span
                        style={{
                          fontSize: 8,
                          fontWeight: 700,
                          color: readableTint(n.color || accent),
                          backgroundColor: mixColor(n.color || accent, 10),
                          padding: '2px 7px',
                          borderRadius: 4,
                          border: `1px solid ${mixColor(n.color || accent, 19)}`,
                          flexShrink: 0,
                          whiteSpace: 'nowrap',
                          opacity: interpolate(camFactor, [0.4, 1], [0, 1]),
                        }}
                      >
                        {n.subLabel}
                      </span>
                    )}
                  </div>

                  {/* Hero Morphing Details: Tier 3 (Kinetic Typography Staggered Reveal - Idea 3) */}
                  {isHero && camFactor > 0.4 && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        marginTop: 2,
                        transform: `translateY(${insightTranslateY}px)`,
                        opacity: insightOpacity,
                        zIndex: 3,
                      }}
                    >
                      {/* Micro-hairline neon accent divider */}
                      <div
                        style={{
                          height: 1,
                          width: '100%',
                          background: `linear-gradient(90deg, ${mixColor(n.color || accent, 38)}, ${mixColor('var(--text)', 8)}, transparent)`,
                          marginBottom: 4,
                        }}
                      />
                      <p
                        style={{
                          fontSize: insightTypography.fontSize,
                          color: 'var(--text, #FFFFFF)',
                          margin: 0,
                          lineHeight: 1.38,
                          display: '-webkit-box',
                          WebkitLineClamp: insightTypography.maxLines,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          letterSpacing: 0.15,
                        }}
                      >
                        {insightTypography.formattedText}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Fallback Bottom Insight Bar (Only when Hero Morph is disabled and an active node exists) */}
        {activeNode && graphData.heroMorph === false && (
          <div
            style={{
              position: 'absolute',
              bottom: 8,
              left: 10,
              right: 10,
              backgroundColor: 'var(--card-bg, rgba(15, 20, 32, 0.95))',
              border: `1px solid ${mixColor(activeNode.color || accent, 50)}`,
              borderRadius: 8,
              padding: '6px 9px',
              boxShadow: 'var(--shadow-md, 0 8px 24px rgba(0,0,0,0.7))',
              zIndex: 60,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <span
                style={{
                  fontSize: 8,
                  fontWeight: 900,
                  padding: '1px 5px',
                  borderRadius: 3,
                  backgroundColor: mixColor(activeNode.color || accent, 14),
                  color: readableTint(activeNode.color || accent),
                }}
              >
                Tiêu điểm
              </span>
              <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text, #FFFFFF)' }}>
                {activeNode.label}
              </span>
            </div>
            <p
              style={{
                fontSize: 8.5,
                color: 'var(--text-sub, rgba(255, 255, 255, 0.85))',
                margin: 0,
                lineHeight: 1.35,
              }}
            >
              {activeNode.insight || activeNode.subLabel || 'Đang phân tích trọng tâm khái niệm này...'}
            </p>
          </div>
        )}
      </div>
    </RemotionElementWrapper>
  );
};
