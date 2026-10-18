import * as fabric from 'fabric';
import { measureTextWidth, FIT_EPSILON } from '@/config/textMetrics';
import { letterSpacingPx } from '@/config/hookTypography';
import { HOOK_HIGHLIGHT_BOX, packRows } from '@/config/hookLayout';
import { FabricThemeColors, mixColors, resolveColor } from './colorUtils';

/**
 * Bộ dựng Fabric dùng chung cho các layout master-hook (masterHookFabricRenderer.ts).
 * Đo chữ bằng cùng bảng glyph với công thức chiều cao (textMetrics.js) nên chữ xuống dòng đúng chỗ video xuống dòng;
 * mọi đối tượng đặt theo toạ độ tương đối tâm khung (x ∈ [-W/2, W/2], y ∈ [-H/2, H/2]).
 */

export const LH = 1.15; // line-height kế thừa từ gốc layout
export const ROOT_WEIGHT = 700;
/** Chrome làm tròn viền lẻ xuống px nguyên (khớp hookLayout.js) */
export const bw = (b: number) => (b >= 1 ? Math.floor(b) : b);
export const words = (s: string) => String(s || '').split(/\s+/).filter(Boolean);
export const upper = (s: string) => String(s).toUpperCase();

/** Font: family, weight, letter-spacing ('0.04em') */
export interface HookFont { family: string; weight: number | string; ls?: string; italic?: boolean }

const lsEm = (ls?: string) => {
  const m = /^(-?[\d.]+)em$/.exec(String(ls ?? '').trim());
  return m ? Number(m[1]) : 0;
};

export function textW(text: string, size: number, f: HookFont): number {
  return measureTextWidth(text, size, { fontFamily: f.family, weight: Number(f.weight) || 400, letterSpacing: letterSpacingPx(f.ls ?? 0, size) });
}

/** Xuống dòng theo từ như trình duyệt (cùng thuật toán estimateTextLines) */
export function wrapLines(text: string, avail: number, size: number, f: HookFont): string[] {
  const out: string[] = [];
  const space = textW(' ', size, f);
  for (const para of String(text ?? '').split('\n')) {
    let cur = '';
    let curW = 0;
    for (const w of para.split(/ +/).filter(Boolean)) {
      const ww = textW(w, size, f);
      if (!cur) { cur = w; curW = ww; }
      else if (curW + space + ww > avail + FIT_EPSILON) { out.push(cur); cur = w; curW = ww; }
      else { cur += ` ${w}`; curW += space + ww; }
    }
    out.push(cur);
  }
  return out;
}

/** Khớp từ nhấn kiểu renderedHero / HazardAlert (bỏ dấu câu, so khớp hai chiều) */
export function matchRendered(word: string, highlights: string[]): boolean {
  const cleanW = word.toLowerCase().replace(/[^\w\p{L}]/gu, '');
  if (!cleanW) return false;
  return highlights.map(h => String(h).toLowerCase().trim()).some(hl => hl === cleanW || cleanW.includes(hl) || hl.includes(cleanW));
}
/** Khớp từ nhấn kiểu StaggeredWordGroup (chứa chuỗi con) */
export const matchIncludes = (word: string, highlights: string[]) => highlights.some(h => word.toLowerCase().includes(String(h).toLowerCase()));

/** Icon SVG 24×24 (lucide). Tiền tố "M0 0 M24 24" neo khung bao đúng viewBox để tâm icon không lệch (pathOffset). */
export const HOOK_ICONS = {
  bolt: 'M13 2 L3 14 L12 14 L11 22 L21 10 L12 10 Z',
  bookmark: 'M19 21 L12 17 L5 21 V5 a2 2 0 0 1 2 -2 h10 a2 2 0 0 1 2 2 z',
  comment: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  arrowDown: 'M12 5 L12 19 M19 12 L12 19 L5 12',
  arrowRight: 'M5 12 L19 12 M12 5 L19 12 L12 19',
  link: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  gift: 'M20 12 L20 22 L4 22 L4 12 M2 7 H22 V12 H2 Z M12 22 L12 7 M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z',
  bell: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0',
  flame: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z',
} as const;

/**
 * Fabric đo bề rộng glyph lúc tạo chữ và cache theo font; nếu độ đậm đó chưa tải xong (vd. 500 lần đầu dùng)
 * chữ sẽ bị đo bằng font dự phòng → khoảng cách ký tự lệch. Kiểm bằng chính chuỗi chữ (dấu tiếng Việt nằm ở
 * subset unicode-range riêng), tải font rồi đo lại một lần.
 */
function remeasureWhenFontLoads(t: fabric.FabricText, f: HookFont, sample: string) {
  const fonts = typeof document !== 'undefined' ? document.fonts : undefined;
  if (!fonts) return;
  const decl = `${f.italic ? 'italic ' : ''}${f.weight} 16px "${f.family}"`;
  try {
    if (fonts.check(decl, sample)) return;
  } catch { return; }
  fonts.load(decl, sample).then(() => {
    fabric.cache.clearFontCache(f.family);
    t.initDimensions();
    t.set('dirty', true);
    const group = t.group;
    if (group) group.set('dirty', true);
    (t.canvas || group?.canvas)?.requestRenderAll();
  }).catch(() => { /* font không có — giữ đo cũ */ });
}

/** Một phần tử trong luồng chữ: rộng w, cao h, vẽ tại (x trái, tâm dọc cy) */
export interface FlowToken { w: number; h: number; draw: (x: number, cy: number) => void }

/** Phần đầu của hộp (chấm, icon) đứng trước chữ: w gồm cả khoảng cách tới chữ */
export interface BoxLead { w: number; h: number; draw: (x: number, cy: number) => void }

export interface BoxOpts {
  font: number; f: HookFont; color: string;
  lh?: number; upper?: boolean;
  padY?: number; padX?: number; border?: number; radius?: number;
  fill?: string; stroke?: string; shadow?: fabric.Shadow;
  /** Bề rộng tối đa của hộp; full = hộp chiếm trọn maxW (như width: 100%) */
  maxW: number; full?: boolean;
  /** Căn hộp: 'center' quanh x, 'left' từ x */
  align?: 'center' | 'left';
  textAlign?: 'center' | 'left';
  lead?: BoxLead;
}

export class HookCanvas {
  objs: fabric.FabricObject[] = [];
  constructor(public theme: FabricThemeColors) {}

  /** CSS màu → màu thật: var(--x, fb), color-mix(in srgb, A p%, B) (lồng nhau được) */
  css(c?: string | null): string | undefined {
    if (!c || typeof c !== 'string') return undefined;
    const s = c.trim();
    if (s.startsWith('var(')) return this.css(resolveColor(s, this.theme.vars));
    const m = /^color-mix\(\s*in\s+srgb\s*,(.*)\)$/i.exec(s);
    if (!m) return s;
    const args: string[] = [];
    let depth = 0;
    let cur = '';
    for (const ch of m[1]) {
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (ch === ',' && depth === 0) { args.push(cur.trim()); cur = ''; } else cur += ch;
    }
    args.push(cur.trim());
    const part = (a: string) => { const p = /^(.*?)\s+([\d.]+)%$/.exec(a); return p ? { c: p[1], pct: Number(p[2]) } : { c: a, pct: undefined }; };
    const a = part(args[0]);
    const b = part(args[1] || 'transparent');
    const pct = a.pct ?? (b.pct !== undefined ? 100 - b.pct : 50);
    const ca = this.css(a.c) || a.c;
    return mixColors(ca, pct, b.c === 'transparent' ? 'transparent' : this.css(b.c) || 'transparent');
  }
  /** = mixColor() của Remotion */
  mix(c: string, pct: number, b?: string) { return mixColors(this.css(c) || c, pct, b ? this.css(b) : 'transparent'); }
  /** = readableTint() của Remotion */
  tint(c: string) { return mixColors(this.css(c) || c, 60, this.theme.text); }
  v(name: string) { return this.theme.vars[name]; }

  shadow(color: string | undefined, blur: number, offsetY = 0) {
    return color ? new fabric.Shadow({ color, blur, offsetX: 0, offsetY }) : undefined;
  }
  /** Bóng từ token theme (--shadow-sm/md/lg): lấy lớp đầu "x y blur color" */
  shadowVar(name: string) {
    const raw = this.v(name) || '';
    const m = /^\s*(-?[\d.]+)(?:px)?\s+(-?[\d.]+)(?:px)?\s+([\d.]+)(?:px)?\s+(.+?)(?:,\s*-?[\d.]+(?:px)?\s.*)?$/.exec(raw);
    return m ? new fabric.Shadow({ offsetX: Number(m[1]), offsetY: Number(m[2]), blur: Number(m[3]), color: m[4].trim() }) : undefined;
  }

  add<T extends fabric.FabricObject>(o: T): T { this.objs.push(o); return o; }

  /** Hộp chữ nhật theo khung ngoài (viền nằm trong, như box-sizing: border-box) */
  rect(left: number, top: number, w: number, h: number, o: { fill?: string | fabric.Gradient<'linear'>; stroke?: string; sw?: number; r?: number; shadow?: fabric.Shadow } = {}) {
    const sw = o.stroke ? (o.sw ?? 1) : 0;
    return this.add(new fabric.Rect({
      left: left + w / 2, top: top + h / 2, originX: 'center', originY: 'center',
      width: Math.max(0, w - sw), height: Math.max(0, h - sw), rx: o.r || 0, ry: o.r || 0,
      fill: o.fill ?? 'transparent', stroke: o.stroke, strokeWidth: sw, shadow: o.shadow,
    }));
  }

  /** Một dòng chữ, tâm dọc cy; x là mép trái (originX left) hoặc tâm (center) */
  text(str: string, x: number, cy: number, size: number, f: HookFont, fill: string | fabric.Gradient<'linear'>, o: { originX?: 'left' | 'center' | 'right'; shadow?: fabric.Shadow; stroke?: string; sw?: number } = {}) {
    const t = this.add(new fabric.FabricText(str, {
      left: x, top: cy, originX: o.originX || 'center', originY: 'center',
      fontSize: size, fontFamily: f.family, fontWeight: String(f.weight), fontStyle: f.italic ? 'italic' : 'normal',
      charSpacing: lsEm(f.ls) * 1000, fill, stroke: o.stroke, strokeWidth: o.sw || 0, shadow: o.shadow,
    } as any));
    remeasureWhenFontLoads(t, f, str);
    return t;
  }

  icon(d: string, cx: number, cy: number, size: number, stroke: string, sw = 2) {
    const s = size / 24;
    return this.add(new fabric.Path(`M0 0 M24 24 ${d}`, {
      left: cx, top: cy, originX: 'center', originY: 'center', scaleX: s, scaleY: s,
      fill: '', stroke, strokeWidth: sw, strokeLineCap: 'round', strokeLineJoin: 'round',
    }));
  }

  /** Đoạn văn xuống dòng theo từ; trả chiều cao + bề rộng dòng dài nhất */
  para(text: string, x: number, y: number, avail: number, size: number, f: HookFont, fill: string, o: { lh?: number; align?: 'left' | 'center' } = {}) {
    const lineH = size * (o.lh ?? LH);
    const lines = wrapLines(text, avail, size, f);
    lines.forEach((l, i) => this.text(l, o.align === 'center' ? x + avail / 2 : x, y + (i + 0.5) * lineH, size, f, fill, { originX: o.align === 'center' ? 'center' : 'left' }));
    return { h: lines.length * lineH, w: Math.min(avail, Math.max(0, ...lines.map(l => textW(l, size, f)))) };
  }

  /**
   * Hộp chữ (badge, pill, hộp phụ đề): chrome = padding + viền, chữ xuống dòng trong (maxW − chrome).
   * Trả chiều cao — khớp công thức `lines × font × lh + chromeY` của hookLayout.js.
   */
  box(text: string, x: number, y: number, o: BoxOpts) {
    const m = this.measureBox(text, o);
    this.drawBox(x, y, o, m);
    return m.h;
  }
  measureBox(text: string, o: BoxOpts) {
    const b = bw(o.border || 0);
    const padX = o.padX || 0;
    const padY = o.padY || 0;
    const leadW = o.lead?.w || 0;
    const str = o.upper ? upper(text) : text;
    const lines = wrapLines(str, o.maxW - 2 * padX - 2 * b - leadW, o.font, o.f);
    const tw = Math.max(0, ...lines.map(l => textW(l, o.font, o.f)));
    const textH = lines.length * o.font * (o.lh ?? LH);
    const contentH = Math.max(textH, o.lead?.h || 0);
    const w = o.full ? o.maxW : Math.min(o.maxW, tw + leadW + 2 * padX + 2 * b);
    return { lines, tw, textH, w, h: contentH + 2 * padY + 2 * b };
  }
  drawBox(x: number, y: number, o: BoxOpts, m: ReturnType<HookCanvas['measureBox']>) {
    const left = o.align === 'left' ? x : x - m.w / 2;
    if (o.fill || o.stroke) this.rect(left, y, m.w, m.h, { fill: o.fill, stroke: o.stroke, sw: o.border, r: o.radius, shadow: o.shadow });
    const b = bw(o.border || 0);
    const innerL = left + b + (o.padX || 0);
    const innerW = m.w - 2 * b - 2 * (o.padX || 0);
    const leadW = o.lead?.w || 0;
    const cy = y + m.h / 2;
    // Nội dung (lead + chữ) căn giữa như inline-flex / text-align: center; căn trái khi textAlign = left
    const contentW = Math.min(innerW, leadW + m.tw);
    const startX = o.textAlign === 'left' ? innerL : innerL + (innerW - contentW) / 2;
    o.lead?.draw(startX, cy);
    const tx = startX + leadW;
    const lineH = o.font * (o.lh ?? LH);
    const top = cy - m.textH / 2;
    m.lines.forEach((l, i) => {
      const lw = textW(l, o.font, o.f);
      const lx = o.textAlign === 'left' ? tx : tx + (m.tw - lw) / 2;
      this.text(l, lx + lw / 2, top + (i + 0.5) * lineH, o.font, o.f, o.color);
    });
  }

  /**
   * Luồng chữ (word-wrap / flex-wrap): xếp token bằng packRows của hookLayout.js — cùng chỗ ngắt dòng với công thức.
   * x, regionW: vùng căn hàng; avail: bề rộng xếp (mặc định regionW). Trả chiều cao + bề rộng hàng dài nhất.
   */
  flow(tokens: FlowToken[], x: number, y: number, o: { regionW: number; avail?: number; gap: number; rowGap?: number; minH?: number; align?: 'left' | 'center' }) {
    if (!tokens.length) return { h: 0, w: 0 };
    const rowGap = o.rowGap || 0;
    const { rows } = this.flowSize(tokens, { ...o, avail: o.avail ?? o.regionW });
    let i = 0;
    let cy = y;
    for (const row of rows) {
      let tx = o.align === 'center' ? x + (o.regionW - row.w) / 2 : x;
      for (let n = 0; n < row.n; n++, i++) {
        tokens[i].draw(tx, cy + row.h / 2);
        tx += tokens[i].w + o.gap;
      }
      cy += row.h + rowGap;
    }
    return { h: cy - y - rowGap, w: Math.max(...rows.map(r => r.w)) };
  }

  /** Kích thước luồng chữ (không vẽ) — để vẽ nền trước chữ */
  flowSize(tokens: FlowToken[], o: { avail: number; gap: number; rowGap?: number; minH?: number }) {
    const rowGap = o.rowGap || 0;
    const rows = tokens.length ? packRows({ tokens, gap: o.gap, avail: o.avail, rowGap, minH: o.minH || 0 }) : [];
    return { rows, h: rows.reduce((s, r) => s + r.h, 0) + Math.max(0, rows.length - 1) * rowGap, w: Math.max(0, ...rows.map(r => r.w)) };
  }

  /** Token chữ thường */
  word(str: string, size: number, f: HookFont, fill: string, lineH: number, o: { shadow?: fabric.Shadow } = {}): FlowToken {
    const w = textW(str, size, f);
    return { w, h: lineH, draw: (x, cy) => { this.text(str, x + w / 2, cy, size, f, fill, o); } };
  }

  /**
   * Token từ nhấn — trạng thái cuối của HighlightWordRenderer (solid-box, outline-box, underline-thick,
   * marker-circle, gradient-sweep, text-glow). Kích thước theo HOOK_HIGHLIGHT_BOX (giống công thức).
   * custom: hộp riêng (hazard-alert: nền đỏ, chữ trắng).
   */
  highlight(str: string, size: number, f: HookFont, lineH: number, style: string | undefined, accent: string, textColor: string, onAccent: string,
    custom?: { padX: number; padY: number; fill: string; color: string }): FlowToken {
    const key = custom ? 'custom' : (style && HOOK_HIGHLIGHT_BOX[style] ? style : 'text-glow');
    const box = custom || HOOK_HIGHLIGHT_BOX[key];
    const hf = { ...f, weight: 900 };
    const tw = textW(str, size, hf);
    const ownLH = (box as any).lh ? size * (box as any).lh : lineH;
    const h = lineH + ((box as any).lh ? Math.max(0, ownLH - lineH) + box.padY : box.padY);
    const w = tw + box.padX;
    const margin = key === 'solid-box' || key === 'outline-box' || key === 'custom' ? 2 : 0;
    const draw = (x: number, cy: number) => {
      const bx = x + margin;
      const bW = w - 2 * margin;
      const bH = ownLH + box.padY;
      const cx = x + w / 2;
      if (key === 'custom') {
        this.rect(bx, cy - bH / 2, bW, bH, { fill: custom!.fill, r: 6, shadow: this.shadow('rgba(0,0,0,0.35)', 8, 3) });
        this.text(str, cx, cy, size, hf, custom!.color);
      } else if (key === 'solid-box') {
        this.rect(bx, cy - bH / 2, bW, bH, { fill: accent, r: 6, shadow: this.shadow(this.mix(accent, 40), 16, 4) });
        this.text(str, cx, cy, size, hf, onAccent);
      } else if (key === 'outline-box') {
        this.rect(bx, cy - bH / 2, bW, bH, { fill: this.mix(accent, 8), stroke: accent, sw: 2, r: 6 });
        this.text(str, cx, cy, size, hf, accent);
      } else if (key === 'underline-thick') {
        this.rect(x, cy + bH / 2 - 10, w, 10, { fill: accent });
        this.text(str, cx, cy, size, hf, textColor);
      } else if (key === 'marker-circle') {
        this.add(new fabric.Ellipse({ left: cx, top: cy, originX: 'center', originY: 'center', rx: w * 0.6, ry: bH * 0.65, fill: '', stroke: accent, strokeWidth: 4 }));
        this.text(str, cx, cy, size, hf, textColor);
      } else if (key === 'gradient-sweep') {
        // Cuối hiệu ứng quét: chữ chuyển màu chữ → accent theo chiều ngang
        const grad = new fabric.Gradient<'linear'>({ type: 'linear', gradientUnits: 'percentage', coords: { x1: 0, y1: 0, x2: 1, y2: 0 }, colorStops: [{ offset: 0, color: textColor }, { offset: 1, color: accent }] });
        this.text(str, cx, cy, size, hf, grad, { shadow: this.shadow(this.mix(accent, 40), 14, 2) });
      } else {
        this.text(str, cx, cy, size, hf, accent, { shadow: this.shadow(this.mix(accent, 25), 18) });
      }
    };
    return { w, h, draw };
  }

  /** Xoay các đối tượng từ chỉ số `from` quanh (cx, cy) — như transform: rotate() của một khối */
  rotateFrom(from: number, cx: number, cy: number, deg: number) {
    const pivot = new fabric.Point(cx, cy);
    const rad = fabric.util.degreesToRadians(deg);
    for (const o of this.objs.slice(from)) {
      const p = fabric.util.rotatePoint(new fabric.Point(o.left, o.top), pivot, rad);
      o.set({ left: p.x, top: p.y, angle: (o.angle || 0) + deg });
    }
  }
}
