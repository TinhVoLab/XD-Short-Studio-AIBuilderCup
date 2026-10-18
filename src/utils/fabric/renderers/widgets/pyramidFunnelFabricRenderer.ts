import * as fabric from 'fabric';
import { SceneElement } from '@/types/scene';
import { getFabricThemeColors, resolveColor, mixColors } from './colorUtils';
import { measureTextWidth } from './chartTextUtils';
import { text, para, themeShadow, boundsRect, centerOnOrigin, FONT } from './fabricTextKit';

const DEFAULT_LAYERS = [
  { label: 'TẦNG 1: HOOK ĐỘC ĐÁO', sub: 'Thu hút 3 giây đầu', color: 'var(--chart-series-1, #BEFF01)' },
  { label: 'TẦNG 2: NỘI DUNG GIÁ TRỊ', sub: 'Giữ chân bằng insight', color: 'var(--chart-series-2, #00D4FF)' },
  { label: 'TẦNG 3: KÊU GỌI HÀNH ĐỘNG', sub: 'Chuyển đổi follower', color: 'var(--chart-series-3, #FF5544)' },
];

const NORMAL_LH = 1.26; // line-height "normal" của Be Vietnam Pro

type Pt = { x: number; y: number };

/** Cắt đa giác theo đáy thẻ y ≤ yMax (overflow: hidden của video) — giữ khung bao trong thẻ */
function clipPolyBottom(pts: Pt[], yMax: number): Pt[] {
  const out: Pt[] = [];
  pts.forEach((p, i) => {
    const q = pts[(i + 1) % pts.length];
    const pin = p.y <= yMax;
    const qin = q.y <= yMax;
    if (pin) out.push(p);
    if (pin !== qin) out.push({ x: p.x + ((yMax - p.y) * (q.x - p.x)) / (q.y - p.y), y: yMax });
  });
  return out;
}

/** Bỏ các dòng của Textbox nằm hẳn dưới `maxBottom` (video cắt ở mép thẻ) để khung bao không vượt thẻ */
function dropLinesBelow(tb: fabric.Textbox, maxBottom: number) {
  const lines = (tb as any).textLines as string[];
  const lh = tb.fontSize * (tb as any)._fontSizeMult * tb.lineHeight;
  const top = tb.top || 0;
  let keep = lines.length;
  while (keep > 0 && top + (keep - 1) * lh + tb.fontSize * 1.13 > maxBottom) keep--;
  if (keep === lines.length) return true;
  if (keep === 0) return false;
  tb.set({ text: lines.slice(0, keep).join('\n') });
  tb.initDimensions();
  return true;
}

/**
 * Phễu kim tự tháp 3D trên canvas — khớp PyramidFunnelElement (Remotion) ở khung cuối:
 * thẻ --surface-1 (pad 10/12, overflow hidden) · header (icon + tiêu đề + chip "3D PYRAMID") ·
 * SVG trong khung nội dung (gốc lệch theo padding/header như DOM) · nhãn nổi --surface-2 xen kẽ phải/trái.
 */
export function buildPyramidFunnelFabricObjects(
  el: SceneElement,
  _accent: string,
  _w: number,
  _h: number
): fabric.FabricObject[] {
  const tc = getFabricThemeColors(el);
  const C = (c: unknown, fb: string) => resolveColor(c as string, tc.vars) || fb;
  const layers: any[] = Array.isArray(el.pyramidLayers) && el.pyramidLayers.length > 0 ? el.pyramidLayers : DEFAULT_LAYERS;
  const N = Math.max(1, layers.length);
  const w = el.width || 336;
  const h = el.height || 260;
  const title = String((el as any).title ?? el.content ?? '').trim();
  const showBg = el.showCardBg !== false;
  const accent = C(el.accentColor, tc.vars['--accent'] || tc.accent);
  const font = el.fontFamily || FONT;
  const X0 = -w / 2; // mép trái thẻ trong hệ toạ độ nhóm
  const border = showBg ? 1 : 0;
  const padX = showBg ? 12 : 2;
  const padY = showBg ? 10 : 2;
  const card = { x0: X0 + border, y0: border, x1: -X0 - border, y1: h - border };
  const objs: fabric.FabricObject[] = [];
  const labels: fabric.FabricObject[] = [];

  if (showBg) {
    const radius = el.radius !== undefined ? el.radius : 16;
    objs.push(new fabric.Rect({
      left: 0, top: 0.5, width: w - 1, height: h - 1, rx: radius, ry: radius,
      fill: C(el.bgColor, tc.surface1), stroke: tc.border, strokeWidth: 1, originX: 'center', originY: 'top',
      shadow: themeShadow(tc),
    }));
  } else {
    objs.push(boundsRect(w, h));
  }

  // 1. Header (flex space-between, padding-bottom 6, hairline, margin-bottom 4)
  let headerBlock = 0;
  if (title) {
    const chip = '3D PYRAMID';
    const chipFs = 8.5;
    const chipW = measureTextWidth(chip, chipFs, 800, 'monospace') + chip.length * chipFs * 0.06 + 14;
    const chipH = chipFs * 1.2 + 6;
    const rowH = Math.max(14, 11 * NORMAL_LH, chipH);
    const top = border + padY;
    const cy = top + rowH / 2;
    const lx = X0 + border + padX;
    const k = 14 / 24;
    objs.push(new fabric.Polygon([{ x: 12, y: 2 }, { x: 2, y: 22 }, { x: 22, y: 22 }].map(p => ({ x: lx + p.x * k, y: cy + (p.y - 12) * k })), {
      fill: 'transparent', stroke: accent, strokeWidth: 2 * k, strokeLineJoin: 'round',
    }));
    objs.push(new fabric.Line([lx + 12 * k, cy - 10 * k, lx + 12 * k, cy + 10 * k], { stroke: accent, strokeWidth: 2 * k, strokeLineCap: 'round' }));
    objs.push(text(title, { left: lx + 20, top: cy, size: 11, weight: 800, fill: tc.text, family: font, ls: 0.44 }));
    const rx = -X0 - border - padX;
    objs.push(new fabric.Rect({
      left: rx - 0.5, top: cy, width: chipW - 1, height: chipH - 1, rx: 4, ry: 4, originX: 'right', originY: 'center',
      fill: mixColors(accent, 9), stroke: mixColors(accent, 20), strokeWidth: 1,
    }));
    objs.push(text(chip, { left: rx - chipW / 2, top: cy, size: chipFs, weight: 800, fill: accent, family: 'monospace', originX: 'center', ls: chipFs * 0.06 }));
    objs.push(new fabric.Line([lx, top + rowH + 6 + 0.5, rx, top + rowH + 6 + 0.5], { stroke: tc.border, strokeWidth: 1 }));
    headerBlock = rowH + 6 + 1 + 4;
  }

  // 2. Hình học SVG (toạ độ trong khung nội dung, gốc = mép trong padding + header — như DOM)
  const ox = X0 + border + padX;
  const oy = border + padY + headerBlock;
  const contentW = w - (showBg ? 24 : 8);
  const startY = (title ? 34 : 0) + (showBg ? 12 : 6);
  const pyrW = Math.min(160, contentW * 0.38);
  const pyrH = Math.max(90, h - startY - (showBg ? 20 : 10));
  const cx = ox + w / 2;
  const grid = tc.chartGrid;

  layers.forEach((layer: any, i: number) => {
    const layerColor = C(layer.color, accent);
    const faceColor = C(layer.color, '#ffffff');
    const yTop = oy + startY + (i / N) * pyrH;
    const yBot = oy + startY + ((i + 1) / N) * pyrH;
    const wTop = (i / N) * pyrW;
    const wBot = ((i + 1) / N) * pyrW;
    const tl = { x: cx - wTop / 2, y: yTop }, tcp = { x: cx, y: yTop }, tr = { x: cx + wTop / 2, y: yTop };
    const bl = { x: cx - wBot / 2, y: yBot }, bc = { x: cx, y: yBot }, br = { x: cx + wBot / 2, y: yBot };
    const faceGrad = (a: number, b: number) => new fabric.Gradient({
      type: 'linear', gradientUnits: 'percentage', coords: { x1: 0, y1: 0, x2: 1, y2: 0 },
      colorStops: [{ offset: 0, color: mixColors(faceColor, a) }, { offset: 1, color: mixColors(faceColor, b) }],
    });
    if (yTop >= card.y1) return;
    const yMax = card.y1 - 0.5;
    const poly = (p: Pt[], o: any) => {
      const c = clipPolyBottom(p, yMax);
      return c.length >= 3 ? [new fabric.Polygon(c, o)] : [];
    };
    const g: fabric.FabricObject[] = [
      ...poly([tl, tr, br, bl], { fill: layerColor, opacity: 0.12, strokeWidth: 0 }),
      ...poly([tl, tcp, bc, bl], { fill: faceGrad(50, 75), stroke: layerColor, strokeWidth: 0.8, strokeLineJoin: 'round' }),
      ...poly([tcp, tr, br, bc], { fill: faceGrad(25, 48), stroke: layerColor, strokeWidth: 0.8, strokeLineJoin: 'round' }),
      new fabric.Line([cx, yTop, cx, Math.min(yBot, yMax)], { stroke: grid, strokeWidth: 1 }),
    ];
    const right = i % 2 === 0;
    const midY = (yTop + yBot) / 2;
    const slopeX = right ? cx + (wTop + wBot) / 4 : cx - (wTop + wBot) / 4;
    const endX = right ? cx + wBot / 2 + 10 : cx - wBot / 2 - 10;
    if (midY < yMax) g.push(new fabric.Line([slopeX, midY, endX, midY], { stroke: layerColor, strokeWidth: 1.2, strokeDashArray: [3, 2], opacity: 0.75 }));
    objs.push(...g);

    // Nhãn nổi: top = midY − 16, rộng labelW, padding 3/6, viền màu tầng 27%
    const labelX = ox + (right ? w / 2 + wBot / 2 + 12 : (showBg ? 8 : 4));
    const labelW = Math.max(85, right ? w - (w / 2 + wBot / 2 + 12) - (showBg ? 8 : 4) : (w / 2 - wBot / 2 - 16));
    const top = midY - 16;
    // Phần nhãn tràn khỏi thẻ bị video cắt — ở canvas thu nhãn vào trong thẻ để khung bao không vượt thẻ
    const shownW = Math.min(labelW, card.x1 - labelX);
    const innerW = shownW - 14;
    const ix0 = labelX + 7;
    const ix1 = labelX + shownW - 7;
    const parts: fabric.FabricObject[] = [];
    let y = top + 4;
    const badge = `L${N - i}`;
    const bw = measureTextWidth(badge, 8, 900, font) + 10;
    const bh = 8 * NORMAL_LH + 2;
    parts.push(new fabric.Rect({ left: right ? ix0 : ix1 - bw, top: y, width: bw, height: bh, rx: 3, ry: 3, fill: mixColors(layerColor, 22), originX: 'left', originY: 'top' }));
    parts.push(text(badge, { left: (right ? ix0 : ix1 - bw) + bw / 2, top: y + bh / 2, size: 8, weight: 900, fill: tc.text, family: font, originX: 'center' }));
    y += bh + 2;
    const lab = String(layer.label || '');
    const labLines = Math.max(1, Math.ceil(measureTextWidth(lab, 10, 800, font) / innerW));
    const labW = Math.min(innerW, measureTextWidth(lab, 10, 800, font)) + 1;
    const labTb = para(lab, labW, 12, { left: right ? ix0 : ix1, top: y, size: 10, weight: 800, fill: tc.text, family: font, originX: right ? 'left' : 'right' });
    parts.push(labTb);
    y += ((labTb as any).textLines?.length || labLines) * 12;
    if (layer.sub) {
      const sub = String(layer.sub);
      const subW = Math.min(innerW, measureTextWidth(sub, 8.5, 400, font)) + 1;
      const subTb = para(sub, subW, 8.5 * 1.15, {
        left: right ? ix0 : ix1, top: y + 1, size: 8.5, fill: tc.textSub, family: font,
        originX: right ? 'left' : 'right', align: right ? 'left' : 'right',
      });
      parts.push(subTb);
      y += 1 + ((subTb as any).textLines?.length || 1) * 8.5 * 1.15;
    }
    const boxH = y + 4 - top;
    const box = new fabric.Rect({
      left: labelX + 0.5, top: top + 0.5, width: shownW - 1, height: Math.min(boxH, card.y1 - top) - 1, rx: 6, ry: 6,
      fill: tc.surface2, stroke: mixColors(layerColor, 27), strokeWidth: 1, originX: 'left', originY: 'top',
    });
    labels.push(box, ...parts.filter(p => !(p instanceof fabric.Textbox) || dropLinesBelow(p, card.y1)));
  });

  objs.push(...labels);
  return centerOnOrigin(objs, h);
}
