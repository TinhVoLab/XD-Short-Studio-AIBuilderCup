import * as fabric from 'fabric';
import { SceneElement } from '@/types/scene';
import { ELEMENT_BOX_SPECS } from '@/config/layoutRegistry';
import { estimateTextLines } from '@/config/textMetrics';
import { DEFAULT_CHECKLIST_ITEMS } from '@/config/widgetDefaults';
import { getFabricThemeColors, resolveColor, mixColors } from './colorUtils';
import { ellipsizeToWidth, measureTextWidth } from './chartTextUtils';
import { buildFabricIcon } from './fabricIconUtils';
import { text, para, themeShadow, boundsRect, cssHexAlpha, centerOnOrigin, FONT } from './fabricTextKit';

const ICON_NAME: Record<string, string> = { '✓': 'check', '✕': 'cross', '!': 'alert' };

/**
 * Checklist trên canvas — khớp ChecklistElement (Remotion) theo đúng box-model của công thức
 * ELEMENT_BOX_SPECS.checklist: thẻ pad 12/14 · header (chấm + tiêu đề hoa) · hàng (badge 20 + chữ xuống dòng) · footer.
 */
export function buildChecklistFabricObjects(
  el: SceneElement,
  _accent: string,
  _w: number,
  _h: number
): fabric.FabricObject[] {
  const S = ELEMENT_BOX_SPECS['checklist'];
  const tc = getFabricThemeColors(el);
  const C = (c: unknown, fb: string) => resolveColor(c as string, tc.vars) || fb;
  const objects: fabric.FabricObject[] = [];
  const W = typeof el.width === 'number' && el.width > 0 ? el.width : 336;
  const font = el.fontFamily || FONT;

  const data: any = el.checklistData || {};
  const variant = data.style || 'glass';
  const isCyber = variant === 'cyber';
  const showFooter = data.showFooter !== false;
  const radius = el.radius !== undefined ? el.radius : 16;
  const rawAccent = el.accentColor || '';
  const accent = C(el.accentColor, tc.accent);
  const frameless = el.showCardBg === false || el.bgColor === 'transparent';
  const border = frameless ? 0 : isCyber ? S.borderCyber : S.border;

  const title = (data.title !== undefined && data.title !== null ? String(data.title) : (el.content || '')).trim();
  const rawItems: any[] = (el.checklistItems && el.checklistItems.length > 0)
    ? el.checklistItems
    : (data.items && data.items.length > 0 ? data.items : DEFAULT_CHECKLIST_ITEMS);
  const items = rawItems.length > 0 ? rawItems : DEFAULT_CHECKLIST_ITEMS;

  const left = -W / 2 + border + S.padX / 2;
  const contentW = W - 2 * border - S.padX;
  const availW = contentW - 2 * S.rowBorder - S.rowPadX - S.badge - S.badgeGap;
  const titleLH = S.titleFont * S.titleLH;
  const subLH = S.subFont * S.subLH;

  // Chiều cao từng hàng (cùng phép tính với calculateElementDynamicHeight)
  const rows = items.map((it: any) => {
    const t = typeof it === 'object' ? String(it.text || '') : String(it);
    const sub = typeof it === 'object' ? String(it.subtext || '') : '';
    const tl = estimateTextLines(t, availW, S.titleFont, { fontFamily: el.fontFamily, weight: S.titleWeight });
    const sl = sub ? estimateTextLines(sub, availW, S.subFont, { fontFamily: el.fontFamily, weight: S.subWeight }) : 0;
    const colH = tl * titleLH + (sub ? S.textGap + sl * subLH : 0);
    return { it, t, sub, colH, h: 2 * S.rowBorder + S.rowPadY + Math.max(S.badge, colH) };
  });

  let curY = S.padY / 2 + border;
  const objsBody: fabric.FabricObject[] = [];

  // 1. Header: chấm 8 (phát sáng) + tiêu đề 12.5/800 hoa, ellipsis, hairline dưới
  if (title) {
    const lineH = S.headerFont * S.normalLH;
    const cy = curY + lineH / 2;
    const dot = isCyber
      ? new fabric.Rect({ left: left + 4, top: cy, width: 8, height: 8, rx: 1, ry: 1, originX: 'center', originY: 'center', fill: accent })
      : new fabric.Circle({ left: left + 4, top: cy, radius: 4, originX: 'center', originY: 'center', fill: accent });
    dot.set({ shadow: new fabric.Shadow({ color: accent, blur: 8 }) });
    objsBody.push(dot);
    const t = ellipsizeToWidth(title.toUpperCase(), contentW - 14, S.headerFont, 800, font);
    objsBody.push(text(t, { left: left + 14, top: cy, size: S.headerFont, weight: 800, fill: tc.text, family: font, ls: 0.2 }));
    curY += lineH + S.headerPadB;
    const hb = isCyber ? 1.5 : S.headerBorder;
    const hbColor = isCyber ? cssHexAlpha(rawAccent, accent, '44') : tc.border;
    if (hbColor) {
      objsBody.push(new fabric.Line([left, curY + hb / 2, left + contentW, curY + hb / 2], { stroke: hbColor, strokeWidth: hb }));
    }
    curY += hb + S.sectionGap;
  }

  // 2. Hàng mục
  rows.forEach((r, idx) => {
    const it = r.it;
    const status = typeof it === 'object' ? it.status : undefined;
    const isChecked = status === 'checked' || status === 'done' || !status;
    const isCross = status === 'cross' || status === 'danger';
    const itemColor = isChecked
      ? (variant === 'audit' ? tc.chartPositive : accent)
      : isCross ? tc.chartNegative : tc.chartWarning;

    let rowBg = tc.surface1;
    let rowStroke = mixColors(itemColor, 25);
    if (variant === 'audit') {
      rowBg = mixColors(itemColor, 8, tc.surface1);
      rowStroke = mixColors(itemColor, 35);
    } else if (variant === 'minimal') {
      rowBg = 'transparent';
      rowStroke = tc.border;
    } else if (isCyber) {
      rowBg = tc.surface2;
      rowStroke = mixColors(itemColor, 45);
    }
    const rr = isCyber ? 4 : 8;
    objsBody.push(new fabric.Rect({
      left: left + 0.5, top: curY + 0.5, width: contentW - 1, height: r.h - 1, rx: rr, ry: rr,
      fill: rowBg, stroke: rowStroke, strokeWidth: 1, originX: 'left', originY: 'top',
      shadow: isChecked ? new fabric.Shadow({ color: mixColors(itemColor, 15), blur: 12 }) : undefined,
    }));

    const cy = curY + r.h / 2;
    const bx = left + S.rowBorder + S.rowPadX / 2 + S.badge / 2;
    const badgeOpts = {
      left: bx, top: cy, originX: 'center' as const, originY: 'center' as const,
      fill: mixColors(itemColor, 18), stroke: itemColor, strokeWidth: 1.5,
      shadow: new fabric.Shadow({ color: mixColors(itemColor, 45), blur: 10 }),
    };
    objsBody.push(isCyber
      ? new fabric.Rect({ ...badgeOpts, width: S.badge - 1.5, height: S.badge - 1.5, rx: 3, ry: 3 })
      : new fabric.Circle({ ...badgeOpts, radius: S.badge / 2 - 0.75 }));
    const iconChar = (typeof it === 'object' && it.icon) || (isChecked ? '✓' : isCross ? '✕' : '!');
    objsBody.push(...(buildFabricIcon(ICON_NAME[iconChar] || iconChar, itemColor, 12, bx, cy) as fabric.FabricObject[]));

    const tx = bx + S.badge / 2 + S.badgeGap;
    let ty = cy - r.colH / 2;
    const strike = isCross && !isCyber;
    objsBody.push(para(r.t, availW + 1, titleLH, {
      left: tx, top: ty, size: S.titleFont, weight: S.titleWeight, fill: isCross ? tc.textSub : tc.text, family: font, linethrough: strike,
    }));
    ty += estimateTextLines(r.t, availW, S.titleFont, { fontFamily: el.fontFamily, weight: S.titleWeight }) * titleLH;
    if (r.sub) {
      objsBody.push(para(r.sub, availW + 1, subLH, {
        left: tx, top: ty + S.textGap, size: S.subFont, weight: S.subWeight, fill: tc.textSub, family: font,
      }));
    }
    curY += r.h + (idx < rows.length - 1 ? S.rowGap : 0);
  });

  // 3. Footer: "HOÀN THÀNH x/y MỤC" + thanh tiến độ (≤ 60) + % (chữ --text)
  if (showFooter) {
    const done = items.filter((it: any) => typeof it !== 'object' || it.status === 'checked' || it.status === 'done' || !it.status).length;
    const total = items.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    curY += S.sectionGap + S.footerMarginT;
    const fh = S.footerPadY + 2 * S.footerBorder + S.footerFont * S.normalLH;
    const rr = isCyber ? 4 : 8;
    objsBody.push(new fabric.Rect({
      left: left + 0.5, top: curY + 0.5, width: contentW - 1, height: fh - 1, rx: rr, ry: rr,
      fill: tc.surface2, stroke: tc.border, strokeWidth: 1, originX: 'left', originY: 'top',
    }));
    const cy = curY + fh / 2;
    const label = `HOÀN THÀNH ${done}/${total} MỤC`;
    const lx = left + 1 + 8;
    objsBody.push(text(label, { left: lx, top: cy, size: 9, weight: 600, fill: tc.textSub, family: font }));
    const pctStr = `${pct}%`;
    const pctW = measureTextWidth(pctStr, S.footerFont, 900, font);
    const barX = lx + measureTextWidth(label, 9, 600, font) + 6;
    const barW = Math.max(0, Math.min(60, left + contentW - 1 - 8 - pctW - barX));
    if (barW > 0) {
      objsBody.push(new fabric.Rect({ left: barX, top: cy, width: barW, height: 4, rx: 2, ry: 2, fill: tc.surface1, originX: 'left', originY: 'center' }));
      if (pct > 0) objsBody.push(new fabric.Rect({ left: barX, top: cy, width: (barW * pct) / 100, height: 4, rx: 2, ry: 2, fill: accent, originX: 'left', originY: 'center' }));
    }
    objsBody.push(text(pctStr, { left: left + contentW - 1 - 8, top: cy, size: S.footerFont, weight: 900, fill: tc.text, family: font, originX: 'right' }));
    curY += fh;
  }

  const totalH = Math.round(curY + S.padY / 2 + border);

  // Nền thẻ theo kiểu (viền `${accent}44` chỉ hiện khi accent là hex — như video)
  if (!frameless) {
    let fill = C(el.bgColor, tc.cardBg);
    let stroke: string | null = cssHexAlpha(rawAccent, accent, '44');
    let shadow: fabric.Shadow | undefined = themeShadow(tc);
    if (variant === 'minimal') {
      fill = C(el.bgColor, tc.surface1);
      stroke = tc.border;
      shadow = new fabric.Shadow({ color: 'rgba(0, 0, 0, 0.5)', blur: 20, offsetX: 0, offsetY: 4 });
    } else if (variant === 'audit') {
      stroke = tc.border;
      shadow = themeShadow(tc, 'lg');
    } else if (isCyber) {
      fill = C(el.bgColor, tc.surface1);
      stroke = accent;
      shadow = cssHexAlpha(rawAccent, accent, '22') ? themeShadow(tc) : undefined;
    }
    const sw = stroke ? border : 0;
    objects.push(new fabric.Rect({
      left: 0, top: sw / 2, width: W - sw, height: totalH - sw, rx: radius, ry: radius,
      fill, stroke: stroke || undefined, strokeWidth: sw, originX: 'center', originY: 'top', shadow,
    }));
  } else {
    objects.push(boundsRect(W, totalH));
  }
  objects.push(...objsBody);
  return centerOnOrigin(objects, totalH);
}
