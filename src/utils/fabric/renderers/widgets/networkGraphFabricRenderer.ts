import * as fabric from 'fabric';
import { SceneElement } from '@/types/scene';
import { getFabricThemeColors, resolveColor } from './colorUtils';
import { ellipsizeToWidth } from './chartTextUtils';

/**
 * Path SVG (viewBox 24, stroke 1.8) của các icon mạng lưới thường dùng — chép từ getVectorIconSvg (remotion/utils/icons.tsx).
 * Tên khác → "sparkle" như renderUniversalIcon.
 */
const NODE_ICON_PATHS: Record<string, string> = {
  brain: 'M 9.5 2 A 2.5 2.5 0 0 1 12 4.5 L 12 19.5 A 2.5 2.5 0 0 1 7.04 19.94 A 2.5 2.5 0 0 1 4.08 16.86 A 3 3 0 0 1 3.74 11.28 A 2.5 2.5 0 0 1 5.06 7.04 A 2.5 2.5 0 0 1 9.5 2 Z M 14.5 2 A 2.5 2.5 0 0 0 12 4.5 L 12 19.5 A 2.5 2.5 0 0 0 16.96 19.94 A 2.5 2.5 0 0 0 19.92 16.86 A 3 3 0 0 0 20.26 11.28 A 2.5 2.5 0 0 0 18.94 7.04 A 2.5 2.5 0 0 0 14.5 2 Z',
  chat: 'M 21 15 A 2 2 0 0 1 19 17 L 7 17 L 3 21 L 3 5 A 2 2 0 0 1 5 3 L 19 3 A 2 2 0 0 1 21 5 Z',
  eye: 'M 1 12 C 1 12 5 4 12 4 C 19 4 23 12 23 12 C 23 12 19 20 12 20 C 5 20 1 12 1 12 Z M 15 12 A 3 3 0 1 1 9 12 A 3 3 0 1 1 15 12',
  lock: 'M 5 11 L 19 11 A 2 2 0 0 1 21 13 L 21 20 A 2 2 0 0 1 19 22 L 5 22 A 2 2 0 0 1 3 20 L 3 13 A 2 2 0 0 1 5 11 Z M 7 11 L 7 7 A 5 5 0 0 1 17 7 L 17 11',
  code: 'M 16 18 L 22 12 L 16 6 M 8 6 L 2 12 L 8 18',
  zap: 'M 13 2 L 3 14 L 12 14 L 11 22 L 21 10 L 12 10 Z',
  sparkle: 'M 12 3 L 13.912 8.885 L 20 10.8 L 15.2 15.476 L 16.36 21 L 12 17.7 L 7.64 21 L 8.8 15.476 L 4 10.8 L 10.088 8.885 Z',
};
const ICON_ALIASES: Record<string, string> = {
  mind: 'brain', thinking: 'brain', intelligence: 'brain', message: 'chat', comment: 'chat',
  view: 'eye', watch: 'eye', look: 'eye', secure: 'lock', private: 'lock', key: 'lock',
  dev: 'code', terminal: 'code', developer: 'code', flash: 'zap', lightning: 'zap', power: 'zap', speed: 'zap',
  sparkles: 'sparkle', magic: 'sparkle',
};

function nodeIcon(name: string | undefined, color: string, size: number, x: number, y: number): fabric.FabricObject {
  const key = String(name || '').toLowerCase().trim();
  const d = NODE_ICON_PATHS[key] || NODE_ICON_PATHS[ICON_ALIASES[key]] || NODE_ICON_PATHS.sparkle;
  return new fabric.Path(`${d} M 0 0 M 24 24`, {
    fill: 'transparent',
    stroke: color,
    strokeWidth: 1.8,
    strokeLineCap: 'round',
    strokeLineJoin: 'round',
    scaleX: size / 24,
    scaleY: size / 24,
    left: x,
    top: y,
    originX: 'center',
    originY: 'center',
    selectable: false,
  } as any);
}

/**
 * Dedicated Network Graph Fabric 2D Renderer — khung hình tĩnh của NetworkGraphElement (hub + vệ tinh).
 * Hiệu ứng trôi/photon chạy theo frame → vẽ ở vị trí frame 0.
 */
export function buildNetworkGraphFabricObjects(
  el: SceneElement,
  _accent: string,
  w: number,
  h: number
): fabric.FabricObject[] {
  const objects: fabric.FabricObject[] = [];
  const themeColors = getFabricThemeColors(el);
  const vars = themeColors.vars;
  // = Remotion: el.accentColor || '#00FF88'
  const accentColor = resolveColor(el.accentColor, vars) || '#00FF88';

  const DEFAULT_NODES = [
    { label: 'AI Core', icon: 'brain' },
    { label: 'NLP Engine', icon: 'chat' },
    { label: 'Vision AI', icon: 'eye' },
    { label: 'Database', icon: 'database' },
    { label: 'Security', icon: 'lock' },
    { label: 'Logic Flow', icon: 'code' },
  ];
  const rawNodes: any[] = (el.networkNodes && el.networkNodes.length >= 2) ? el.networkNodes : DEFAULT_NODES;

  const titleText = (el.content !== undefined && el.content !== null) ? String(el.content).trim() : '';
  const hasTitle = Boolean(titleText);
  const headerH = hasTitle ? 32 : 0;
  const halfW = w / 2;
  const totalH = h || headerH + w;
  const fontFamily = el.fontFamily || 'Be Vietnam Pro';

  // 1. Card (--card-bg, viền --border) / khung element khi frameless
  const showCardBg = el.showCardBg !== false && el.bgColor !== 'transparent';
  objects.push(new fabric.Rect({
    left: 0,
    top: 0,
    width: w,
    height: totalH,
    rx: showCardBg ? (el.radius !== undefined ? el.radius : 16) : 0,
    ry: showCardBg ? (el.radius !== undefined ? el.radius : 16) : 0,
    fill: showCardBg ? (resolveColor(el.bgColor, vars) || themeColors.cardBg) : 'transparent',
    stroke: showCardBg ? themeColors.border : 'transparent',
    strokeWidth: showCardBg ? 1 : 0,
    originX: 'center',
    originY: 'top',
    selectable: false,
  } as any));

  // 2. Header (icon zap accent + tiêu đề --text)
  if (hasTitle) {
    const left = -halfW + 14;
    objects.push(nodeIcon('zap', accentColor, 14, left + 7, headerH / 2));
    objects.push(new fabric.IText(ellipsizeToWidth(titleText, w - 28 - 22, 11, '700', fontFamily), {
      left: left + 14 + 8,
      top: headerH / 2,
      fontSize: 11,
      fontWeight: '700',
      fill: themeColors.text,
      fontFamily,
      originX: 'left',
      originY: 'center',
      selectable: false,
    } as any));
    objects.push(new fabric.Line([-halfW, headerH - 0.5, halfW, headerH - 0.5], {
      stroke: themeColors.border,
      strokeWidth: 1,
      selectable: false,
    } as any));
  }

  // 3. Geometry
  const graphH = totalH - headerH;
  const cx = 0;
  const cy = headerH + graphH / 2;
  const orbitRadius = Math.min(w, graphH) * 0.35;
  const satelliteCount = Math.max(1, rawNodes.length - 1);
  const seriesFallbacks = [accentColor, ...themeColors.chartSeries];

  objects.push(new fabric.Circle({
    left: cx,
    top: cy,
    radius: orbitRadius,
    fill: 'transparent',
    stroke: themeColors.chartGrid,
    strokeWidth: 1,
    strokeDashArray: [4, 4],
    originX: 'center',
    originY: 'center',
    selectable: false,
  } as any));

  const nodes = rawNodes.map((n: any, i: number) => {
    if (i === 0) {
      return { x: cx, y: cy, label: String(n.label ?? ''), icon: n.icon || 'brain', color: resolveColor(n.color, vars) || accentColor, isCenter: true };
    }
    const angle = (Math.PI * 2 * (i - 1)) / satelliteCount - Math.PI / 2;
    return {
      x: cx + Math.cos(angle) * orbitRadius,
      y: cy + Math.sin(angle) * orbitRadius + Math.sin(i * 1.5) * 4, // độ trôi tại frame 0
      label: String(n.label ?? ''),
      icon: n.icon || 'zap',
      color: resolveColor(n.color, vars) || seriesFallbacks[i % seriesFallbacks.length] || '#00D4FF',
      isCenter: false,
    };
  });
  const hub = nodes[0];

  // 4. Cạnh nối + photon (frame 0)
  nodes.forEach((n: any, i: number) => {
    if (i === 0) return;
    objects.push(new fabric.Line([hub.x, hub.y, n.x, n.y], {
      stroke: n.color,
      strokeWidth: 1.5,
      strokeDashArray: [3, 3],
      opacity: 0.4,
      selectable: false,
    } as any));
    const t = ((i * 8) % 40) / 40;
    const px = hub.x + (n.x - hub.x) * t;
    const py = hub.y + (n.y - hub.y) * t;
    objects.push(new fabric.Circle({
      left: px, top: py, radius: 5, fill: n.color, opacity: 0.35, strokeWidth: 0,
      originX: 'center', originY: 'center', selectable: false,
    } as any));
    objects.push(new fabric.Circle({
      left: px, top: py, radius: 2.5, fill: themeColors.text, strokeWidth: 0,
      originX: 'center', originY: 'center', selectable: false,
    } as any));
  });

  // 5. Nút (halo màu, thân --surface, icon màu nút, nhãn --text)
  nodes.forEach((n: any) => {
    const r = n.isCenter ? 22 : 15;
    objects.push(new fabric.Circle({
      left: n.x, top: n.y, radius: r + 6, fill: n.color, opacity: n.isCenter ? 0.3 : 0.2, strokeWidth: 0,
      originX: 'center', originY: 'center', selectable: false,
    } as any));
    objects.push(new fabric.Circle({
      left: n.x, top: n.y, radius: r, fill: themeColors.surface, stroke: n.color, strokeWidth: n.isCenter ? 2.5 : 1.8,
      originX: 'center', originY: 'center', selectable: false,
    } as any));
    objects.push(nodeIcon(n.icon, n.color, n.isCenter ? 14 : 11, n.x, n.y));
    objects.push(new fabric.IText(n.label, {
      left: n.x,
      top: n.y + r + (n.isCenter ? 10 : 8),
      fontSize: n.isCenter ? 10.5 : 9,
      fontWeight: n.isCenter ? '800' : '600',
      fill: themeColors.text,
      fontFamily,
      originX: 'center',
      originY: 'center',
      selectable: false,
    } as any));
  });

  return objects;
}
