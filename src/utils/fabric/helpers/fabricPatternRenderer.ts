import * as fabric from 'fabric';
import { Scene, BgPatternType } from '@/types/scene';
import { hexToRgba, resolveSceneBackground } from '@/utils/themeResolver';

/**
 * Renders static 2D vector Background Patterns for Fabric Canvas Edit Mode
 * Matches 1:1 with Remotion's SceneRenderer patterns:
 * - grid, dots, cyber-3d, topo-contour, speed-lines, mesh, noise
 */
export function buildFabricBackgroundPattern(
  scene: Scene | undefined,
  width = 360,
  height = 640
): fabric.Group | null {
  const { rawPattern, isDarkBg, ambientColor, patternColor } = resolveSceneBackground(scene);
  const patternOpacity = Math.max(0.1, Math.min(1.5, scene?.bgPatternOpacity ?? 1));
  const patternObjs: fabric.Object[] = [];

  // ── 0. ATMOSPHERIC SPOTLIGHT (FOCAL DEPTH) ───────────────────────
  if (!scene?.bgVideoUrl && rawPattern !== 'mesh') {
    const spotlightOpacity = isDarkBg ? 0.06 : 0.03;
    const spotlight = new fabric.Circle({
      left: width / 2,
      top: height * 0.45,
      radius: width * 0.65,
      fill: new fabric.Gradient({
        type: 'radial',
        coords: { r1: 0, r2: width * 0.65, x1: width / 2, y1: height * 0.45, x2: width / 2, y2: height * 0.45 },
        colorStops: [
          { offset: 0, color: hexToRgba(ambientColor, spotlightOpacity) },
          { offset: 1, color: hexToRgba(ambientColor, 0) },
        ],
      }),
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false,
    });
    patternObjs.push(spotlight);
  }

  if (rawPattern && rawPattern !== 'none') {
    // patternColor (hex) theo độ sáng thật của nền — SSOT resolveSceneBackground, khớp Remotion

  // ── 1. TECH HUD GRID ──────────────────────────────────────────────
  if (rawPattern === 'grid') {
    const strokeColor = hexToRgba(patternColor, 0.14 * patternOpacity);
    for (let x = 30; x < width; x += 30) {
      patternObjs.push(new fabric.Line([x, 0, x, height], {
        stroke: strokeColor,
        strokeWidth: 1,
        selectable: false,
        evented: false,
      }));
    }
    for (let y = 30; y < height; y += 30) {
      patternObjs.push(new fabric.Line([0, y, width, y], {
        stroke: strokeColor,
        strokeWidth: 1,
        selectable: false,
        evented: false,
      }));
    }
    // Corner crosshairs
    const corners = [
      { x: 14, y: 14 },
      { x: width - 14, y: 14 },
      { x: 14, y: height - 14 },
      { x: width - 14, y: height - 14 },
    ];
    corners.forEach(c => {
      patternObjs.push(new fabric.IText('+', {
        left: c.x,
        top: c.y,
        fontSize: 14,
        fill: patternColor,
        opacity: 0.5 * patternOpacity,
        fontFamily: 'monospace',
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
      }));
    });
  }

  // ── 2. DOTS MATRIX (Zen / Minimalist) ─────────────────────────────
  else if (rawPattern === 'dots') {
    const dotColor = hexToRgba(patternColor, 0.22 * patternOpacity);
    for (let x = 16; x < width; x += 24) {
      for (let y = 16; y < height; y += 24) {
        patternObjs.push(new fabric.Circle({
          left: x,
          top: y,
          radius: 1.3,
          fill: dotColor,
          originX: 'center',
          originY: 'center',
          selectable: false,
          evented: false,
        }));
      }
    }
  }

  // ── 3. CYBER 3D PERSPECTIVE GROUND GRID ───────────────────────────
  else if (rawPattern === 'cyber-3d') {
    const horizonY = height * 0.58;
    const groundH = height - horizonY;
    const strokeColor = hexToRgba(patternColor, 0.26 * patternOpacity);

    // Horizon line
    patternObjs.push(new fabric.Line([0, horizonY, width, horizonY], {
      stroke: patternColor,
      strokeWidth: 1.5,
      opacity: 0.7 * patternOpacity,
      selectable: false,
      evented: false,
    }));

    // Perspective depth lines converging toward vanishing point
    const numVanishingLines = 15;
    const cx = width / 2;
    for (let i = 0; i <= numVanishingLines; i++) {
      const pct = i / numVanishingLines;
      const xBottom = cx + (pct - 0.5) * width * 2.8;
      patternObjs.push(new fabric.Line([cx, horizonY, xBottom, height], {
        stroke: strokeColor,
        strokeWidth: 1,
        selectable: false,
        evented: false,
      }));
    }

    // Horizontal quadratic depth rings
    const numDepthRings = 9;
    for (let i = 1; i <= numDepthRings; i++) {
      const t = i / numDepthRings;
      const y = horizonY + groundH * (t * t);
      patternObjs.push(new fabric.Line([0, y, width, y], {
        stroke: strokeColor,
        strokeWidth: 1 + t * 0.8,
        opacity: t * 0.8 * patternOpacity,
        selectable: false,
        evented: false,
      }));
    }
  }

  // ── 4. TOPO CONTOUR (Organic Waves) ───────────────────────────────
  else if (rawPattern === 'topo-contour') {
    const strokeColor = hexToRgba(patternColor, 0.35 * patternOpacity);
    for (let i = 0; i < 7; i++) {
      const yBase = 90 + i * 82;
      const isDashed = i % 2 !== 0;
      const pathD = `M -20 ${yBase} Q 90 ${yBase - 40}, 180 ${yBase + 15} T ${width + 20} ${yBase - 25}`;
      patternObjs.push(new fabric.Path(pathD, {
        stroke: strokeColor,
        strokeWidth: 1.6,
        strokeDashArray: isDashed ? [6, 4] : undefined,
        fill: 'transparent',
        selectable: false,
        evented: false,
      }));
    }
  }

  // ── 5. ACTION SPEED LINES (Hyperspace Anime Rays) ─────────────────
  else if (rawPattern === 'speed-lines') {
    const cx = width / 2;
    const cy = height * 0.47;
    const numRays = 28;
    const rStart = 85;
    const rEnd = 390;

    for (let i = 0; i < numRays; i++) {
      const angle = (i * 360) / numRays;
      const rad = (angle * Math.PI) / 180;
      const x1 = cx + Math.cos(rad) * rStart;
      const y1 = cy + Math.sin(rad) * rStart;
      const x2 = cx + Math.cos(rad) * rEnd;
      const y2 = cy + Math.sin(rad) * rEnd;

      patternObjs.push(new fabric.Line([x1, y1, x2, y2], {
        stroke: patternColor,
        strokeWidth: 1.5 + (i % 3) * 0.8,
        strokeLineCap: 'round',
        opacity: (0.2 + (i % 4) * 0.15) * patternOpacity,
        selectable: false,
        evented: false,
      }));
    }
  }

  // ── 6. MESH GRADIENT AURA ─────────────────────────────────────────
  else if (rawPattern === 'mesh') {
    const aura1 = new fabric.Circle({
      left: width * 0.2,
      top: height * 0.25,
      radius: width * 0.35,
      fill: new fabric.Gradient({
        type: 'radial',
        coords: { r1: 0, r2: width * 0.35, x1: width * 0.2, y1: height * 0.25, x2: width * 0.2, y2: height * 0.25 },
        colorStops: [
          { offset: 0, color: hexToRgba(ambientColor, 0.25 * patternOpacity) },
          { offset: 1, color: hexToRgba(ambientColor, 0) },
        ],
      }),
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false,
    });

    const aura2 = new fabric.Circle({
      left: width * 0.8,
      top: height * 0.8,
      radius: width * 0.45,
      fill: new fabric.Gradient({
        type: 'radial',
        coords: { r1: 0, r2: width * 0.45, x1: width * 0.8, y1: height * 0.8, x2: width * 0.8, y2: height * 0.8 },
        colorStops: [
          { offset: 0, color: hexToRgba(ambientColor, 0.3 * patternOpacity) },
          { offset: 1, color: hexToRgba(ambientColor, 0) },
        ],
      }),
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false,
    });

    patternObjs.push(aura1, aura2);
  }

  // ── 7. NOISE OVERLAY ──────────────────────────────────────────────
  else if (rawPattern === 'noise') {
    // Subtle dotted stipple texture representation
    const noiseColor = hexToRgba(patternColor, 0.08 * patternOpacity);
    for (let x = 10; x < width; x += 18) {
      for (let y = 10; y < height; y += 18) {
        if ((x + y) % 3 === 0) {
          patternObjs.push(new fabric.Circle({
            left: x + ((y * 7) % 8),
            top: y + ((x * 5) % 8),
            radius: 0.8,
            fill: noiseColor,
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false,
          }));
        }
      }
    }
  }
  } // Đóng block if (rawPattern && rawPattern !== 'none')

  if (patternObjs.length === 0) return null;

  const group = new fabric.Group(patternObjs, {
    id: 'scene-background-pattern-group',
    left: 0,
    top: 0,
    width,
    height,
    originX: 'left',
    originY: 'top',
    selectable: false,
    evented: false,
  } as any);

  return group;
}
