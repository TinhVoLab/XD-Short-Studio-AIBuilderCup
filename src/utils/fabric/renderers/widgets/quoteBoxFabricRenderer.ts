import * as fabric from 'fabric';
import { SceneElement } from '@/types/scene';
import { getFabricThemeColors, resolveColor, mixColors } from './colorUtils';
import { measureTextWidth } from './chartTextUtils';
import { buildFabricIcon } from './fabricIconUtils';
import { text, para, themeShadow, cssHexAlpha, centerOnOrigin, FONT } from './fabricTextKit';

/** Số dòng thực của một Textbox sau khi Fabric ngắt dòng */
const lineCount = (tb: fabric.Textbox) => Math.max(1, ((tb as any).textLines as string[] | undefined)?.length || 1);

/**
 * Quote-box trên canvas — khớp QuoteBoxElement (Remotion), 4 kiểu (classic-strip mặc định, zen-minimal,
 * expert-badge, brutalist-block). Chiều cao = chiều cao tự nhiên của DOM (chữ ngắt dòng thật trong vùng nội dung).
 * Màu hex-alpha (`${color}40`) chỉ vẽ khi màu gốc là hex — như CSS của video.
 */
export function buildQuoteBoxFabricObjects(
  el: SceneElement,
  _accent: string,
  _w: number,
  _h: number
): fabric.FabricObject[] {
  const tc = getFabricThemeColors(el);
  const C = (c: unknown, fb: string) => resolveColor(c as string, tc.vars) || fb;
  const w = el.width || 312;
  const X0 = -w / 2;
  const rawColor = String(el.accentColor || el.color || '#FFD700');
  const color = C(rawColor, '#FFD700');
  const ha = (aa: string) => cssHexAlpha(rawColor, color, aa);
  const fs = el.fontSize || 16;
  const variant = el.variant || 'classic-strip';
  const align = (el.textAlign || (variant === 'zen-minimal' ? 'center' : 'left')) as 'left' | 'center' | 'right';
  const radius = el.radius ?? (variant === 'brutalist-block' ? 4 : variant === 'zen-minimal' ? 20 : 16);
  const raw = String(el.content || 'Trích dẫn hay...').trim();
  const textColor = C(el.color, tc.text);
  const font = el.fontFamily || FONT;
  const authorFs = Math.max(11, Math.round(fs * 0.78));
  const body: fabric.FabricObject[] = [];

  /** Đoạn trích dẫn trong vùng [x0, x0 + width] từ y → trả chiều cao */
  const quote = (x0: number, width: number, y: number, lhRatio: number, weight: number, italic: boolean, extra: { ls?: number; upper?: boolean } = {}) => {
    const str = extra.upper ? raw.toUpperCase() : raw;
    const lh = fs * lhRatio;
    const ax = align === 'center' ? x0 + width / 2 : align === 'right' ? x0 + width : x0;
    const tb = para(str, width, lh, {
      left: ax, top: y, size: fs, weight, fill: textColor, family: font, italic, ls: extra.ls,
      originX: align === 'center' ? 'center' : align === 'right' ? 'right' : 'left', align,
    });
    body.push(tb);
    return lineCount(tb) * lh;
  };

  let H = 0;
  let card: fabric.FabricObject;

  if (variant === 'zen-minimal') {
    // pad 24/22, cột căn giữa gap 12: ❝ (26) · trích dẫn italic 500 (lh 1.6) · [tác giả]
    let y = 24;
    body.push(text('❝', { left: 0, top: y + 13, size: 26, fill: color, originX: 'center' }));
    body[body.length - 1].set({ opacity: 0.85 });
    y += 26 + 12;
    y += quote(X0 + 23, w - 46, y, 1.6, 500, true, { ls: fs * 0.02 });
    if (el.authorName) {
      y += 12 + 4;
      const name = String(el.authorName).toUpperCase();
      const nw = measureTextWidth(name, authorFs, 600, font) + name.length * authorFs * 0.06;
      const lh = authorFs * 1.26;
      const cy = y + lh / 2;
      const rowW = 20 + 10 + nw + 10 + 20;
      body.push(new fabric.Rect({ left: -rowW / 2, top: cy, width: 20, height: 1, fill: color, opacity: 0.6, originX: 'left', originY: 'center' }));
      body.push(new fabric.Rect({ left: rowW / 2 - 20, top: cy, width: 20, height: 1, fill: color, opacity: 0.6, originX: 'left', originY: 'center' }));
      body.push(text(name, { left: 0, top: cy, size: authorFs, weight: 600, fill: ha('dd') || color, family: font, originX: 'center', ls: authorFs * 0.06 }));
      y += lh;
    }
    H = y + 24;
    const border = ha('40');
    card = new fabric.Rect({
      left: 0, top: 0.5, width: w - 1, height: H - 1, rx: radius, ry: radius, originX: 'center', originY: 'top',
      fill: C(el.bgColor, '') || new fabric.Gradient({
        type: 'radial', gradientUnits: 'percentage',
        coords: { x1: 0.5, y1: 0.5, r1: 0, x2: 0.5, y2: 0.5, r2: 0.71 },
        colorStops: [{ offset: 0, color: ha('15') ? mixColors(color, 8, tc.cardBg) : tc.cardBg }, { offset: 1, color: tc.cardBg }],
      }),
      stroke: border || undefined, strokeWidth: border ? 1 : 0, shadow: themeShadow(tc),
    });
  } else if (variant === 'expert-badge') {
    // pad 20, viền 1.5, cột gap 14: header (chip tác giả + "INSIGHT", hairline dưới) · trích dẫn 600 (lh 1.5)
    const b = ha('45') ? 1.5 : 0;
    let y = b + 20;
    const chip = el.authorName ? String(el.authorName).toUpperCase() : 'GÓC NHÌN CHUYÊN GIA';
    const chipW = 10 + 10 + 6 + measureTextWidth(chip, 10.5, 700, font) + chip.length * 0.42 + 10 + 2;
    const chipH = 10.5 * 1.26 + 8;
    const rowH = Math.max(chipH, 11 * 1.2);
    const cy = y + rowH / 2;
    const lx = X0 + b + 20;
    body.push(new fabric.Rect({
      left: lx + 0.5, top: cy, width: chipW - 1, height: chipH - 1, rx: chipH / 2, ry: chipH / 2, originX: 'left', originY: 'center',
      fill: ha('18') || 'transparent', stroke: ha('60') || undefined, strokeWidth: ha('60') ? 1 : 0,
    }));
    body.push(...(buildFabricIcon('compass', color, 10, lx + 11 + 5, cy) as fabric.FabricObject[]));
    body.push(text(chip, { left: lx + 11 + 10 + 6, top: cy, size: 10.5, weight: 700, fill: color, family: font, ls: 0.42 }));
    body.push(text('INSIGHT', { left: -X0 - b - 20, top: cy, size: 11, fill: tc.textSub, family: 'monospace', originX: 'right' }));
    y += rowH + 10;
    const hb = ha('20');
    if (hb) body.push(new fabric.Line([lx, y + 0.5, -X0 - b - 20, y + 0.5], { stroke: hb, strokeWidth: 1 }));
    y += 1 + 14;
    y += quote(lx, w - 2 * b - 40, y, 1.5, 600, false);
    H = y + 20 + b;
    card = new fabric.Rect({
      left: 0, top: b / 2, width: w - b, height: H - b, rx: radius, ry: radius, originX: 'center', originY: 'top',
      fill: C(el.bgColor, tc.cardBg), stroke: ha('45') || undefined, strokeWidth: b, shadow: themeShadow(tc),
    });
  } else if (variant === 'brutalist-block') {
    // pad 20/18, viền 2.5 màu, bóng cứng 5/5, tag "RULE #1" + tác giả · trích dẫn 800 hoa (lh 1.4)
    const b = 2.5;
    let y = b + 20;
    const lx = X0 + b + 18;
    const tagFs = 10;
    const tagW = measureTextWidth('RULE #1', tagFs, 900, font) + 7 * tagFs * 0.06 + 16;
    const tagH = tagFs * 1.26 + 4;
    const rowH = Math.max(tagH, el.authorName ? 11 * 1.26 : 0);
    const cy = y + rowH / 2;
    body.push(new fabric.Rect({ left: lx, top: cy, width: tagW, height: tagH, rx: 2, ry: 2, fill: color, originX: 'left', originY: 'center' }));
    body.push(text('RULE #1', { left: lx + 8, top: cy, size: tagFs, weight: 900, fill: '#000000', family: font, ls: tagFs * 0.06 }));
    if (el.authorName) {
      body.push(text(`// ${String(el.authorName).toUpperCase()}`, { left: -X0 - b - 18, top: cy, size: 11, weight: 700, fill: color, family: font, originX: 'right', ls: 0.44 }));
    }
    y += rowH + 12;
    y += quote(lx, w - 2 * b - 36, y, 1.4, 800, false, { upper: true });
    H = y + 20 + b;
    card = new fabric.Rect({
      left: 0, top: b / 2, width: w - b, height: H - b, rx: radius, ry: radius, originX: 'center', originY: 'top',
      fill: C(el.bgColor, tc.cardBg), stroke: color, strokeWidth: b,
      shadow: new fabric.Shadow({ color, blur: 0, offsetX: 5, offsetY: 5 }),
    });
  } else {
    // classic-strip: viền trái 4 màu, bo phải, pad 24/20; watermark " Georgia 110 (12%) bị cắt ở mép trên
    const lx = X0 + 4 + 20;
    let y = 24;
    y += quote(lx, w - 4 - 40, y, 1.55, 600, true);
    if (el.authorName) {
      y += 14 + 2;
      const lh = authorFs * 1.26;
      const cy = y + lh / 2;
      const name = String(el.authorName);
      const nw = measureTextWidth(name, authorFs, 500, font) + name.length * authorFs * 0.02;
      const rowW = 22 + 8 + nw;
      const ax = align === 'center' ? lx + (w - 44 - rowW) / 2 : align === 'right' ? -X0 - 20 - rowW : lx;
      body.push(new fabric.Rect({ left: ax, top: cy, width: 22, height: 1.5, fill: color, opacity: 0.85, originX: 'left', originY: 'center' }));
      body.push(text(name, { left: ax + 30, top: cy, size: authorFs, weight: 500, fill: tc.textSub, family: font, ls: authorFs * 0.02 }));
      y += lh;
    }
    H = y + 24;
    const r = Math.min(radius, H / 2);
    const R = X0 + w;
    card = new fabric.Path(
      `M ${X0} 0 H ${R - r} A ${r} ${r} 0 0 1 ${R} ${r} V ${H - r} A ${r} ${r} 0 0 1 ${R - r} ${H} H ${X0} Z`,
      { fill: C(el.bgColor, tc.cardBg), strokeWidth: 0, shadow: themeShadow(tc) },
    );
    const extras: fabric.FabricObject[] = [new fabric.Rect({ left: X0, top: 0, width: 4, height: H, fill: color, originX: 'left', originY: 'top' })];
    if (el.showWatermark !== false) {
      // Hai nét nêm của dấu " (Georgia 110px, top −14) — phần thấy được trong thẻ
      for (const x of [X0 + 4 + 18.4, X0 + 4 + 39]) {
        extras.push(new fabric.Polygon(
          [{ x, y: 0 }, { x: x + 11.6, y: 0 }, { x: x + 7.8, y: 26 }, { x: x + 3.8, y: 26 }],
          { fill: color, opacity: 0.12, strokeWidth: 0, strokeLineJoin: 'round' },
        ));
      }
    }
    body.unshift(...extras);
  }

  return centerOnOrigin([card, ...body], H);
}
