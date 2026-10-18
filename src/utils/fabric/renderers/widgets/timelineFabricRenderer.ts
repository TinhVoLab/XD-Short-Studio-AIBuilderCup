import * as fabric from 'fabric';
import { SceneElement } from '@/types/scene';
import { estimateTextLines } from '@/config/textMetrics';
import { getFabricThemeColors, resolveColor, mixColors } from './colorUtils';
import { ellipsizeToWidth, measureTextWidth } from './chartTextUtils';
import { buildFabricIcon } from './fabricIconUtils';
import { text, para, themeShadow, boundsRect, centerOnOrigin, FONT } from './fabricTextKit';

interface TimelineStep {
  title: string;
  subtitle?: string;
  color?: string;
  icon?: string;
}

const DEFAULT_TIMELINE_STEPS: TimelineStep[] = [
  { title: 'Hôm Qua', subtitle: 'Đau buồn & học hỏi' },
  { title: 'Hôm Nay', subtitle: 'Chấp nhận & tĩnh lặng' },
  { title: 'Mai Sau', subtitle: 'Bình an & vững vàng' },
];

const NODE = 28;

/**
 * Timeline trên canvas — khớp TimelineElement (Remotion) ở khung cuối (mọi mốc hiện, trục sáng hết):
 * thẻ --card-bg pad 14 (frameless 6) · header (icon đồng hồ + tiêu đề + chip "N MỐC") · trục + hạt 28 · chữ xuống dòng.
 */
export function buildTimelineFabricObjects(
  el: SceneElement,
  _accent: string,
  _w: number,
  _h: number
): fabric.FabricObject[] {
  const tc = getFabricThemeColors(el);
  const C = (c: unknown, fb: string) => resolveColor(c as string, tc.vars) || fb;
  const steps: TimelineStep[] = (el.flowSteps && el.flowSteps.length > 0)
    ? (el.flowSteps as TimelineStep[])
    : ((el as any).steps || (el as any).timelineSteps || DEFAULT_TIMELINE_STEPS);
  const W = el.width || 290;
  const accent = C(el.accentColor || el.color, tc.accent);
  const fs = el.fontSize || 14;
  const subFs = Math.max(11, fs * 0.82);
  const gap = steps.length > 3 ? 12 : 16;
  const title = String((el as any).title ?? el.content ?? '').trim();
  const showBg = el.showCardBg !== false;
  const font = el.fontFamily || FONT;
  const inset = showBg ? 15 : 6; // padding 14 + viền 1 | frameless 6
  const left = -W / 2 + inset;
  const contentW = W - 2 * inset;
  const textX = left + NODE + 14;
  const textW = contentW - NODE - 14;
  const titleLH = fs * 1.25;
  const subLH = subFs * 1.35;
  const body: fabric.FabricObject[] = [];
  let curY = inset;

  // 1. Header
  if (title) {
    const lineH = 11.5 * 1.26;
    const cy = curY + Math.max(14, lineH) / 2;
    // Icon đồng hồ của TimelineElement: circle r10 + kim (12,6)→(12,12)→(16,14), viewBox 24, stroke 2
    const k = 14 / 24;
    const icx = left + 7;
    body.push(new fabric.Circle({ left: icx, top: cy, radius: 10 * k, fill: 'transparent', stroke: accent, strokeWidth: 2 * k, originX: 'center', originY: 'center' }));
    body.push(new fabric.Polyline([{ x: icx, y: cy - 6 * k }, { x: icx, y: cy }, { x: icx + 4 * k, y: cy + 2 * k }], {
      fill: 'transparent', stroke: accent, strokeWidth: 2 * k, strokeLineCap: 'round', strokeLineJoin: 'round',
      originX: 'left', originY: 'top', left: icx - k, top: cy - 7 * k,
    }));
    const chip = `${steps.length} MỐC`;
    const chipW = measureTextWidth(chip, 8.5, 700, 'monospace') + 14;
    const chipH = 8.5 * 1.2 + 6;
    body.push(new fabric.Rect({
      left: left + contentW - 0.5, top: cy, width: chipW - 1, height: chipH - 1, rx: 4, ry: 4,
      originX: 'right', originY: 'center', fill: mixColors(accent, 9), stroke: mixColors(accent, 20), strokeWidth: 1,
    }));
    body.push(text(chip, { left: left + contentW - chipW / 2, top: cy, size: 8.5, weight: 700, fill: accent, family: 'monospace', originX: 'center' }));
    body.push(text(ellipsizeToWidth(title, contentW - 20 - chipW - 6, 11.5, 700, font), {
      left: left + 20, top: cy, size: 11.5, weight: 700, fill: tc.text, family: font, ls: 0.23,
    }));
    curY += Math.max(14, lineH) + 8;
    body.push(new fabric.Line([left, curY + 0.5, left + contentW, curY + 0.5], { stroke: tc.border, strokeWidth: 1 }));
    curY += 1 + 12;
  }

  // 2. Các mốc
  const stepsTop = curY;
  const rows = steps.map(st => {
    const tl = estimateTextLines(String(st.title || ''), textW, fs, { fontFamily: el.fontFamily, weight: 700 });
    const sub = st.subtitle && String(st.subtitle).trim() ? String(st.subtitle) : '';
    const sl = sub ? estimateTextLines(sub, textW, subFs, { fontFamily: el.fontFamily, weight: 500 }) : 0;
    const colH = 2 + tl * titleLH + (sub ? 3 + sl * subLH : 0);
    return { st, sub, tl, h: Math.max(NODE, colH) };
  });
  const stepsH = rows.reduce((a, r) => a + r.h, 0) + Math.max(0, rows.length - 1) * gap;
  const trackX = left + NODE / 2;
  if (rows.length > 1) {
    const y0 = stepsTop + NODE / 2;
    const len = stepsH - NODE;
    body.push(new fabric.Rect({ left: trackX, top: y0, width: 2, height: len, rx: 1, ry: 1, fill: tc.border, originX: 'center', originY: 'top' }));
    body.push(new fabric.Rect({
      left: trackX, top: y0, width: 2, height: len, rx: 1, ry: 1, originX: 'center', originY: 'top',
      fill: new fabric.Gradient({
        type: 'linear', gradientUnits: 'pixels', coords: { x1: 0, y1: 0, x2: 0, y2: len },
        colorStops: [{ offset: 0, color: accent }, { offset: 1, color: mixColors(accent, 80) }],
      }),
      shadow: new fabric.Shadow({ color: mixColors(accent, 67), blur: 10 }),
    }));
  }
  const titleShadow = new fabric.Shadow({ color: 'rgba(0, 0, 0, 0.85)', blur: 10, offsetX: 0, offsetY: 2 });
  const subShadow = new fabric.Shadow({ color: 'rgba(0, 0, 0, 0.75)', blur: 8, offsetX: 0, offsetY: 2 });
  rows.forEach((r, i) => {
    const stepColor = C(r.st.color, accent);
    const cy = curY + NODE / 2;
    body.push(new fabric.Circle({
      left: trackX, top: cy, radius: NODE / 2 - 0.75, originX: 'center', originY: 'center',
      fill: tc.surface1, stroke: stepColor, strokeWidth: 1.5,
      shadow: new fabric.Shadow({ color: mixColors(stepColor, 40), blur: 16 }),
    }));
    if (r.st.icon) {
      body.push(...(buildFabricIcon(r.st.icon, stepColor, 12, trackX, cy) as fabric.FabricObject[]));
    } else {
      body.push(new fabric.Circle({
        left: trackX, top: cy, radius: 4, originX: 'center', originY: 'center', fill: stepColor,
        shadow: new fabric.Shadow({ color: stepColor, blur: 8 }),
      }));
    }
    let ty = curY + 2;
    body.push(para(String(r.st.title || ''), textW + 1, titleLH, {
      left: textX, top: ty, size: fs, weight: 700, fill: tc.text, family: font, ls: fs * 0.01, shadow: titleShadow,
    }));
    ty += r.tl * titleLH;
    if (r.sub) {
      body.push(para(r.sub, textW + 1, subLH, {
        left: textX, top: ty + 3, size: subFs, weight: 500, fill: tc.textSub, family: font, shadow: subShadow,
      }));
    }
    curY += r.h + (i < rows.length - 1 ? gap : 0);
  });

  const totalH = Math.round(curY + inset);
  const objects: fabric.FabricObject[] = [];
  if (showBg) {
    const radius = el.radius !== undefined ? el.radius : 16;
    objects.push(new fabric.Rect({
      left: 0, top: 0.5, width: W - 1, height: totalH - 1, rx: radius, ry: radius,
      fill: C(el.bgColor, tc.cardBg), stroke: tc.border, strokeWidth: 1, originX: 'center', originY: 'top',
      shadow: themeShadow(tc),
    }));
  } else {
    objects.push(boundsRect(W, totalH));
  }
  objects.push(...body);
  return centerOnOrigin(objects, totalH);
}
