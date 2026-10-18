import * as fabric from 'fabric';
import { SceneElement, DynamicDiagramData } from '@/types/scene';
import { computeGraphLayout } from '@/config/graphLayout';
import { DEFAULT_DIAGRAM_DATA } from '@/config/widgetDefaults';
import { getFabricThemeColors, resolveColor, mixColors } from './colorUtils';
import { text, themeShadow, boundsRect, centerOnOrigin, FS_MULT, FONT } from './fabricTextKit';

const FEEDBACK = '#FF7043';

/** Đặt chữ theo baseline SVG (y của <text>) — Fabric: baseline dòng đầu = top + 0.908 × cỡ chữ */
function svgText(str: string, x: number, baseline: number, size: number, weight: number, fill: string, ls = 0) {
  const t = text(str, { left: x, top: 0, size, weight, fill, family: FONT, originX: 'center', ls });
  t.set({ originY: 'top', top: baseline - size * (FS_MULT - 0.222) });
  return t;
}

/** Hướng tiếp tuyến cuối của path "M … L|C …" (để xoay đầu mũi tên như marker orient="auto") */
function endTangent(pathD: string): { x: number; y: number; angle: number } {
  const n = (pathD.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
  const x = n[n.length - 2];
  const y = n[n.length - 1];
  for (let k = n.length - 4; k >= 0; k -= 2) {
    const dx = x - n[k];
    const dy = y - n[k + 1];
    if (Math.abs(dx) + Math.abs(dy) > 0.01) return { x, y, angle: Math.atan2(dy, dx) };
  }
  return { x, y, angle: Math.PI / 2 };
}

/**
 * Sơ đồ động trên canvas — khớp DynamicDiagramElement (Remotion) ở khung cuối, dùng chung computeGraphLayout:
 * thẻ --card-bg viền hairline · tiêu đề hoa --text-sub · cạnh (marker mũi tên, vòng lặp ngược nét đứt) với
 * nhãn pill nền --bg · node --surface-1/2 viền màu node, bóng đổ, chữ --text.
 */
export function buildDynamicDiagramFabricObjects(
  el: SceneElement,
  _accent: string,
  _w: number,
  _h: number
): fabric.FabricObject[] {
  const tc = getFabricThemeColors(el);
  const C = (c: unknown, fb: string) => resolveColor(c as string, tc.vars) || fb;
  const w = el.width || 336;
  const X0 = -w / 2;
  const accent = C(el.accentColor, tc.accent);
  const radius = el.radius !== undefined ? el.radius : 12;

  const diagramData: DynamicDiagramData = (el.diagramData && el.diagramData.nodes && el.diagramData.nodes.length > 0)
    ? el.diagramData
    : {
        ...DEFAULT_DIAGRAM_DATA,
        nodes: DEFAULT_DIAGRAM_DATA.nodes.map((n: any, i: number) => ({
          ...n, color: [el.accentColor || 'var(--accent)', 'var(--chart-series-2)', 'var(--chart-series-5)', 'var(--chart-series-1)'][i],
        })),
      } as DynamicDiagramData;

  const theme = (diagramData.theme || (el as any).theme || 'cyber') as 'cyber' | 'minimalist' | 'pastel';
  const isMin = theme === 'minimalist';
  const isPastel = theme === 'pastel';
  const nodeFill = isMin ? tc.surface2 : isPastel ? mixColors(tc.text, 6) : tc.surface1;
  const capFill = isMin ? tc.surface3 : isPastel ? mixColors(tc.text, 9) : tc.surface2;
  const nodeSW = isMin ? 1.2 : isPastel ? 1.5 : 1.8;
  const edgeSW = isMin ? 1.3 : isPastel ? 1.6 : 1.8;
  const nodeShadow = () => (isMin ? undefined : new fabric.Shadow({ color: 'rgba(0, 0, 0, 0.65)', blur: 10, offsetX: 0, offsetY: 4 }));
  const showBg = el.showCardBg !== false && (el as any).showBackground !== false && el.bgColor !== 'transparent';
  const showTitle = Boolean(el.showTitle !== false && diagramData.title?.trim());

  const layout = computeGraphLayout(diagramData, w, showTitle);
  const h = Math.max(el.height || 0, layout.height);
  const objects: fabric.FabricObject[] = [];

  if (showBg) {
    objects.push(new fabric.Rect({
      left: 0, top: 0.5, width: w - 1, height: h - 1, rx: radius, ry: radius,
      fill: C(el.bgColor, tc.cardBg), stroke: tc.border, strokeWidth: 1, originX: 'center', originY: 'top',
      shadow: isMin ? undefined : themeShadow(tc),
    }));
  } else {
    objects.push(boundsRect(w, h));
  }

  if (showTitle && diagramData.title) {
    objects.push(text(String(diagramData.title).toUpperCase(), {
      left: X0 + 14, top: 10 + (10 * 1.26) / 2, size: 10, weight: 700, fill: isMin ? tc.text : tc.textSub, ls: 0.6,
    }));
  }

  // 1. Cạnh + nhãn
  layout.edges.forEach(edge => {
    if (!edge.pathD) return;
    const stroke = edge.isFeedback ? FEEDBACK : C(edge.color, isMin ? mixColors(tc.text, 40) : accent);
    const path = new fabric.Path(edge.pathD, {
      fill: 'transparent', stroke, strokeWidth: edgeSW, opacity: 0.9,
      strokeDashArray: edge.isFeedback ? [4, 4] : undefined,
      originX: 'center', originY: 'center',
    } as any);
    path.set({ left: path.pathOffset.x + X0, top: path.pathOffset.y });
    objects.push(path);
    // marker: path 10×10 ("M0 1.5 L7 5 L0 8.5 z", refX 7) × markerWidth 5/10 × strokeWidth
    const k = 0.5 * edgeSW;
    const end = endTangent(edge.pathD);
    const cos = Math.cos(end.angle);
    const sin = Math.sin(end.angle);
    const pt = (px: number, py: number) => ({ x: X0 + end.x + (px - 7) * k * cos - (py - 5) * k * sin, y: end.y + (px - 7) * k * sin + (py - 5) * k * cos });
    objects.push(new fabric.Polygon([pt(0, 1.5), pt(7, 5), pt(0, 8.5)], {
      fill: edge.isFeedback ? FEEDBACK : isMin ? mixColors(tc.text, 60) : accent, opacity: 0.95 * 0.9, strokeWidth: 0,
    }));
    if (edge.label) {
      const lw = edge.label.length * 6 + 14;
      const lx = X0 + edge.labelX;
      objects.push(new fabric.Rect({
        left: lx, top: edge.labelY, width: lw, height: 18, rx: 5, ry: 5, originX: 'center', originY: 'center',
        fill: tc.bg, stroke: isMin ? mixColors(tc.text, 25) : stroke, strokeWidth: 1, shadow: nodeShadow(),
      }));
      objects.push(svgText(edge.label, lx, edge.labelY + 3.5, 9, 600, tc.text, 0.2));
    }
  });

  // 2. Node
  layout.nodes.forEach(node => {
    const cx = X0 + node.x;
    const cy = node.y;
    const hw = node.width / 2;
    const hh = node.height / 2;
    const stroke = node.color ? C(node.color, accent) : isMin ? mixColors(tc.text, 30) : accent;
    const base = { fill: nodeFill, stroke, strokeWidth: nodeSW, shadow: nodeShadow(), originX: 'center' as const, originY: 'center' as const };
    if (node.shape === 'rect' || node.shape === 'pill') {
      const r = node.shape === 'pill' ? hh : 8;
      objects.push(new fabric.Rect({ ...base, left: cx, top: cy, width: node.width, height: node.height, rx: r, ry: r }));
    } else if (node.shape === 'diamond') {
      objects.push(new fabric.Polygon([{ x: cx, y: cy - hh }, { x: cx + hw, y: cy }, { x: cx, y: cy + hh }, { x: cx - hw, y: cy }], { ...base, originX: 'left', originY: 'top' }));
    } else if (node.shape === 'circle') {
      objects.push(new fabric.Circle({ ...base, left: cx, top: cy, radius: hw }));
    } else if (node.shape === 'cylinder') {
      objects.push(new fabric.Rect({ ...base, left: cx, top: cy, width: node.width, height: node.height - 8 }));
      objects.push(new fabric.Ellipse({ ...base, shadow: undefined, fill: capFill, left: cx, top: cy - hh + 4, rx: hw, ry: 5 }));
      objects.push(new fabric.Ellipse({ ...base, shadow: undefined, fill: capFill, left: cx, top: cy + hh - 4, rx: hw, ry: 5 }));
    }
    const lines = node.lines && node.lines.length > 0 ? node.lines : [node.label || ''];
    if (lines.length > 1) {
      const fs = node.shape === 'diamond' ? 9.5 : 10.5;
      const b0 = cy + (node.sublabel ? -7 : -5);
      objects.push(svgText(lines[0], cx, b0, fs, 600, tc.text, 0.2));
      objects.push(svgText(lines[1], cx, b0 + 13, fs, 600, tc.text, 0.2));
    } else {
      objects.push(svgText(lines[0], cx, cy + (node.sublabel ? -3 : 4), node.shape === 'diamond' ? 10.5 : 11, 600, tc.text, 0.2));
    }
    if (node.sublabel) objects.push(svgText(node.sublabel, cx, cy + 12, 8, 400, tc.textSub));
  });

  return centerOnOrigin(objects, h);
}
