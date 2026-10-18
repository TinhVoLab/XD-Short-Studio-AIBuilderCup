import * as fabric from 'fabric';
import { SceneElement } from '@/types/scene';
import { resolveMasterHook, fitHeroFontSize, layoutMasterHookHeight, HOOK_LAYOUT_SPEC, type ResolvedMasterHook } from '@/config/hookLayout';
import { formatTypographicText } from '@/config/hookTypography';
import { getFabricThemeColors, mixColors, onAccentFor } from './colorUtils';
import {
  HookCanvas, HookFont, BoxOpts, FlowToken, HOOK_ICONS, LH, ROOT_WEIGHT,
  bw, words, upper, textW, wrapLines, matchRendered, matchIncludes,
} from './masterHookFabricKit';

/**
 * Master-hook trên canvas editor — vẽ đúng layout của video (MasterHook/layouts/*.tsx) ở trạng thái cuối animation.
 * Hình học/typography lấy từ SSOT hookLayout.js (HOOK_LAYOUT_SPEC, fitHeroFontSize, packRows) nên chữ xuống dòng
 * đúng chỗ video xuống dòng và khung bao = layoutMasterHookHeight(el). Màu: token thật của cảnh (getFabricThemeColors).
 */

interface Ctx {
  el: any;
  r: ResolvedMasterHook;
  hook: any;
  S: any;
  W: number;
  H: number;
  fs: number;
  k: HookCanvas;
  x0: number;
  y0: number;
  accent: string;
  onAccent: string;
  text: string;
  textSub: string;
  cardBg: string;
  border: string;
  formatted: string;
  root: (weight: number | string, ls?: string) => HookFont;
}

/** Xếp dọc các tầng (flex column + gap); tầng trả 0 thì không chiếm chỗ. Trả tổng chiều cao. */
function stack(y: number, gap: number, parts: Array<(y: number) => number>) {
  const start = y;
  let end = y;
  for (const p of parts) {
    const h = p(y);
    if (h > 0) { end = y + h; y = end + gap; }
  }
  return end - start;
}

const diagonal = (a: string, b: string) => new fabric.Gradient<'linear'>({
  type: 'linear', gradientUnits: 'percentage', coords: { x1: 0, y1: 0, x2: 1, y2: 1 },
  colorStops: [{ offset: 0, color: a }, { offset: 1, color: b }],
});

/** Tách vế ngữ cảnh / cụm trong khối màu — khớp KineticSolidBoxLayout + hookLayout.splitSolidBox */
function splitSolidBox(title: string, highlights: string[]) {
  if (!highlights.length) return { context: '', phrase: '' };
  const lower = title.toLowerCase();
  let first = title.length;
  for (const hl of highlights.map(h => String(h).toLowerCase().trim())) {
    const i = lower.indexOf(hl);
    if (i !== -1 && i < first) first = i;
  }
  if (first > 0 && first < title.length) return { context: title.slice(0, first).trim(), phrase: title.slice(first).trim() };
  return { context: '', phrase: title };
}

/** Badge viên thuốc / hộp phụ đề — gói gọn các tham số lặp lại */
const pill = (c: Ctx, text: string, x: number, y: number, o: Omit<BoxOpts, 'maxW'> & { maxW?: number }) =>
  (text ? c.k.box(text, x, y, { maxW: c.W, ...o }) : 0);

/** Thẻ hành động CTA (social / bookmark): [lead] [tiêu đề + dòng phụ] ........ [nút] */
function actionCard(c: Ctx, y: number, o: {
  cardH?: number; stroke: string; lead: number; leadGap: number; drawLead: (cx: number, cy: number) => void;
  hero: { text: string; font: number; f: HookFont; lh: number }; meta: string; metaSpec: any; button: any; btnRadius: number;
}) {
  const { k, S, W } = c;
  const K = S.card;
  const b = bw(K.border);
  const Bt = o.button;
  const bf = c.root(Bt.weight, Bt.ls);
  const btnW = textW(Bt.text, Bt.font, bf) + 2 * Bt.padX;
  const btnH = Bt.font * LH + 2 * Bt.padY;
  const avail = W - 2 * K.padX - 2 * b - K.gap - btnW - o.lead - o.leadGap;
  const heroH = wrapLines(o.hero.text, avail, o.hero.font, o.hero.f).length * o.hero.font * o.hero.lh;
  const mf = c.root(ROOT_WEIGHT);
  const metaH = o.metaSpec.marginT + wrapLines(o.meta, avail, o.metaSpec.font, mf).length * o.metaSpec.font * LH;
  const cardH = o.cardH ?? 2 * K.padY + 2 * b + Math.max(o.lead, heroH + metaH, btnH);
  k.rect(c.x0, y, W, cardH, { fill: c.cardBg, stroke: o.stroke, sw: K.border, r: 16, shadow: k.shadow(k.mix(c.accent, 27), 20) });
  const cy = y + cardH / 2;
  let x = c.x0 + b + K.padX;
  o.drawLead(x + o.lead / 2, cy);
  x += o.lead + o.leadGap;
  const top = cy - (heroH + metaH) / 2;
  k.para(o.hero.text, x, top, avail, o.hero.font, o.hero.f, c.text, { lh: o.hero.lh });
  k.para(o.meta, x, top + heroH + o.metaSpec.marginT, avail, o.metaSpec.font, mf, c.textSub);
  k.box(Bt.text, c.W / 2 - b - K.padX - btnW, cy - btnH / 2, {
    font: Bt.font, f: bf, color: c.onAccent, padY: Bt.padY, padX: Bt.padX, radius: o.btnRadius,
    fill: c.accent, shadow: k.shadow(k.mix(c.accent, 60), 16), maxW: btnW + 1, align: 'left',
  });
  return cardH;
}

/** Từ của tiêu đề: từ nhấn → kiểu nhấn của hook, còn lại chữ thường (renderedHero) */
function heroTokens(c: Ctx, list: string[], size: number, f: HookFont, lineH: number, color: string, o: { display?: (w: string) => string; shadow?: fabric.Shadow } = {}) {
  const { k, r, hook } = c;
  const display = o.display || ((w: string) => w);
  const hlText = c.k.css(c.el.color) || c.text;
  return list.map(w => (matchRendered(w, r.highlights)
    ? k.highlight(display(w), size, f, lineH, hook.highlightStyle, c.accent, hlText, c.onAccent)
    : k.word(display(w), size, f, color, lineH, { shadow: o.shadow })));
}

const LAYOUTS: Record<string, (c: Ctx) => void> = {
  'sticker-words': (c) => {
    const { k, S, W, r, fs } = c;
    const f = c.root(900, '-0.02em');
    const rot = [-2, 2.5, -1.8, 2, -2.5, 1.5];
    const chips = words(r.text).map((w, i): FlowToken => {
      const str = upper(w);
      const isHl = matchIncludes(w, r.highlights);
      const cw = textW(str, fs, f) + S.chip.padX;
      const ch = fs * S.chip.lh + S.chip.padY;
      return {
        w: cw, h: ch, draw: (x, cy) => {
          const from = k.objs.length;
          k.rect(x, cy - ch / 2, cw, ch, { fill: isHl ? c.accent : '#FFFFFF', r: 8, shadow: k.shadow('rgba(0,0,0,0.6)', 16, 6) });
          k.text(str, x + cw / 2, cy, fs, f, isHl ? c.onAccent : '#000000');
          k.rotateFrom(from, x + cw / 2, cy, rot[i % rot.length]);
        },
      };
    });
    stack(c.y0, S.gap, [
      y => pill(c, r.badge, 0, y, { font: 11, f: c.root(900, '0.08em'), upper: true, color: c.accent, padY: 5, padX: 12, border: 1.5, radius: 8, fill: c.cardBg, stroke: c.accent, shadow: k.shadow(k.mix(c.accent, 27), 14) }),
      y => k.flow(chips, c.x0, y, { regionW: W, gap: S.chip.gap, rowGap: S.chip.gap, align: 'center' }).h,
      y => pill(c, r.sub, 0, y, { font: 13, f: c.root(500), color: c.text, padY: 10, padX: 16, border: 1, radius: 14, fill: c.cardBg, stroke: c.border, full: true }),
    ]);
  },

  'stacked': (c) => {
    const { k, S, W, r, fs, hook, el } = c;
    const hf = { family: hook.fontFamily || r.elFontFamily || 'Be Vietnam Pro', weight: Number(hook.fontWeight || r.elFontWeight) || 900, ls: '-0.02em' };
    const lineH = fs * S.heroLH;
    const toks = heroTokens(c, words(c.formatted), fs, hf, lineH, k.css(hook.textColor || el.color) || c.text, { display: upper });
    const neon = hook.boxVariant === 'neon-border';
    stack(c.y0, S.gap, [
      y => pill(c, r.badge, 0, y, {
        font: 12, f: c.root(800, '0.04em'), upper: true, color: k.css(hook.badgeTextColor) || k.tint(c.accent), padY: 6, padX: 14, border: 1, radius: 20,
        fill: k.css(hook.badgeBgColor || r.defaults.badgeBg), stroke: hook.badgeBgColor ? c.accent : k.css(r.defaults.badgeBorder), shadow: k.shadowVar('--shadow-sm'),
      }),
      y => k.flow(toks, c.x0, y, { regionW: W, gap: textW(' ', fs, hf), minH: lineH, align: 'center' }).h,
      y => pill(c, r.sub, 0, y, {
        font: 13.5, f: { family: 'Be Vietnam Pro', weight: 500, ls: '-0.01em' }, lh: 1.45, color: c.text, padY: 12, padX: 18, border: neon ? 1.5 : 1, radius: 16,
        fill: hook.boxVariant === 'solid' ? k.v('--surface-1') : c.cardBg, stroke: neon ? c.accent : c.border, shadow: k.shadow(k.mix(c.accent, 10), 20), full: true,
      }),
    ]);
  },

  'hazard-alert': (c) => {
    const { k, S, W, r, fs, hook } = c;
    const hf = { family: hook.fontFamily || r.elFontFamily || r.voice.fontFamily, weight: r.voice.fontWeight || 700, ls: r.voice.letterSpacing || '-0.02em' };
    const B = S.banner;
    const b = bw(B.border);
    const inner = W - 2 * B.padX - 2 * b;
    const lineH = fs * S.heroLH;
    const gap = textW(' ', fs, hf);
    const red = { padX: S.hl.padX, padY: S.hl.padY, fill: '#E02424', color: '#FFFFFF' };
    const toks = words(r.text).map(w => (matchRendered(w, r.highlights)
      ? k.highlight(upper(w), fs, { ...hf, ls: S.hl.ls }, lineH, undefined, c.accent, '#000000', c.onAccent, red)
      : k.word(upper(w), fs, hf, '#000000', lineH)));
    const dot = { w: 12, h: 6, draw: (x: number, cy: number) => { k.add(new fabric.Circle({ left: x + 3, top: cy, originX: 'center', originY: 'center', radius: 3, fill: '#FFFFFF' })); } };
    const yellow = new fabric.Gradient<'linear'>({ type: 'linear', gradientUnits: 'percentage', coords: { x1: 0, y1: 0, x2: 0, y2: 1 }, colorStops: [{ offset: 0, color: '#FFE814' }, { offset: 1, color: '#FFD000' }] });
    stack(c.y0, S.gap, [
      y => pill(c, r.badge.replace(/^[⚠️🚨•\s]+/u, '').trim(), 0, y, { font: 11, f: c.root(800, '0.06em'), upper: true, color: '#FFFFFF', padY: 4, padX: 14, radius: 999, fill: '#E02424', shadow: k.shadow('rgba(224,36,36,0.55)', 16), lead: dot }),
      y => {
        const h = k.flowSize(toks, { avail: inner, gap, minH: lineH }).h + 2 * B.padY + 2 * b;
        k.rect(c.x0, y, W, h, { fill: yellow, stroke: '#000000', sw: B.border, r: 12, shadow: k.shadowVar('--shadow-md') });
        k.flow(toks, c.x0 + b + B.padX, y + b + B.padY, { regionW: inner, gap, minH: lineH, align: 'center' });
        return h;
      },
      y => pill(c, r.sub, 0, y, { font: 12.5, f: c.root(500), lh: 1.45, color: '#F0F6FC', padY: 10, padX: 14, border: 1, radius: 10, fill: 'rgba(18,20,29,0.95)', stroke: 'rgba(224,36,36,0.35)', shadow: k.shadow('rgba(0,0,0,0.5)', 18, 6), full: true }),
    ]);
  },

  'cyber-hud': (c) => {
    const { k, S, W, H, r, fs, hook } = c;
    const X = S.box;
    const b = bw(X.border);
    k.rect(c.x0, c.y0, W, H, { fill: c.cardBg, stroke: c.accent, sw: X.border, r: 8, shadow: k.shadow(k.mix(c.accent, 20), 25) });
    const x = c.x0 + b + X.padX;
    const inner = W - 2 * X.padX - 2 * b;
    let y = c.y0 + b + X.padY;
    const barH = S.bar.font * LH;
    k.text(`[ ${r.badge || 'SYS.ROOT // SECURE'} ]`, x, y + barH / 2, S.bar.font, { family: 'monospace', weight: 800, ls: '0.1em' }, c.accent, { originX: 'left' });
    k.text('REC_3S', x + inner, y + barH / 2, 9, { family: 'monospace', weight: ROOT_WEIGHT }, c.textSub, { originX: 'right' });
    y += barH + S.bar.padB;
    k.rect(x, y, inner, S.bar.border, { fill: k.mix(c.accent, 27) });
    y += S.bar.border + S.bar.marginB;
    const hf = { family: hook.fontFamily || r.elFontFamily || 'Montserrat', weight: 900, ls: '0.02em' };
    const lineH = fs * S.heroLH;
    const toks = heroTokens(c, words(c.formatted), fs, hf, lineH, c.text, { display: upper, shadow: k.shadow(k.mix(c.accent, 30), 10) });
    // Con trỏ "_" dính liền từ cuối
    const last = toks[toks.length - 1];
    if (last) {
      const cw = textW('_', fs, hf);
      const lw = last.w;
      const draw = last.draw;
      last.w += cw;
      last.draw = (tx, cy) => { draw(tx, cy); k.text('_', tx + lw + cw / 2, cy, fs, hf, c.accent); };
    }
    y += k.flow(toks, x, y, { regionW: inner, gap: textW(' ', fs, hf), minH: lineH, align: 'left' }).h;
    if (r.sub) {
      y += S.sub.marginT;
      k.rect(x, y, inner, S.sub.border, { fill: c.border });
      y += S.sub.border + S.sub.padT;
      k.para(`> ${r.sub}`, x, y, inner, S.sub.font, { family: 'monospace', weight: ROOT_WEIGHT }, k.tint(k.v('--chart-series-2')), { lh: S.sub.lh });
    }
  },

  'split-versus': (c) => {
    const { k, S, W, r, hook } = c;
    const K = S.card;
    const cardW = (W - K.vs - 2 * K.colGap) / 2;
    const neg = k.v('--chart-negative');
    const card = (fill: string, stroke: string, color: string, glow: string): BoxOpts => ({
      font: K.font, f: c.root(K.weight), lh: K.lh, upper: true, color, padY: 12, padX: 8, border: 1.5, radius: 12,
      fill, stroke, shadow: k.shadow(glow, 16), maxW: cardW, full: true, align: 'left',
    });
    const left = card(k.mix(neg, 8), neg, mixColors(neg, 45, c.text), k.mix(neg, 12));
    const right = card(k.mix(c.accent, 13), c.accent, k.tint(c.accent), k.mix(c.accent, 27));
    stack(c.y0, S.gap, [
      y => pill(c, r.badge, 0, y, { font: 11, f: c.root(900, '0.08em'), upper: true, color: c.text, padY: 5, padX: 14, border: 1.5, radius: 20, fill: k.mix(c.accent, 15), stroke: c.accent, shadow: k.shadow(k.mix(c.accent, 40), 16) }),
      y => {
        const lm = k.measureBox(hook.versusLeft || '99% THUA LỖ', left);
        const rm = k.measureBox(hook.versusRight || 'TOP 1% KIẾM TIỀN', right);
        const rowH = Math.max(K.vs, lm.h, rm.h);
        k.drawBox(c.x0, y + (rowH - lm.h) / 2, left, lm);
        k.drawBox(W / 2 - cardW, y + (rowH - rm.h) / 2, right, rm);
        k.add(new fabric.Circle({ left: 0, top: y + rowH / 2, originX: 'center', originY: 'center', radius: K.vs / 2, fill: c.text, shadow: k.shadowVar('--shadow-md') }));
        k.text('VS', 0, y + rowH / 2, 12, c.root(900), k.v('--bg'));
        return rowH;
      },
      y => k.para(r.text, c.x0, y, W, S.hero.font, c.root(S.hero.weight, S.hero.ls), c.text, { align: 'center' }).h,
      y => pill(c, r.sub, 0, y, { font: S.sub.font, f: c.root(S.sub.weight), color: c.text, padY: 8, padX: 14, border: 1, radius: 12, fill: c.cardBg, stroke: c.border, full: true }),
    ]);
  },

  'luxury-zen': (c) => {
    const { k, S, W, r, fs, hook } = c;
    const size = fs + S.heroPlus;
    const hf = { family: hook.fontFamily || r.elFontFamily || r.voice.fontFamily, weight: r.voice.fontWeight || 400, ls: r.voice.letterSpacing || '0.04em' };
    const lineH = size * S.heroLH;
    const toks = heroTokens(c, words(c.formatted), size, hf, lineH, c.text);
    const subW = Math.min(S.sub.maxW, W);
    stack(c.y0, S.gap, [
      y => (r.badge ? k.para(upper(`✦ ${r.badge} ✦`), c.x0, y, W, S.badge.font, c.root(S.badge.weight, S.badge.ls), k.tint(c.accent), { align: 'center' }).h : 0),
      y => k.flow(toks, c.x0, y, { regionW: W, gap: textW(' ', size, hf), minH: lineH, align: 'center' }).h,
      y => (r.sub ? k.para(`“${r.sub}”`, -subW / 2, y, subW, S.sub.font, { family: r.fontFamily, weight: S.sub.weight, italic: true }, c.textSub, { lh: S.sub.lh, align: 'center' }).h : 0),
    ]);
  },

  'kinetic-giant-stat': (c) => {
    const { k, S, W, r, fs, hook } = c;
    const T = S.title;
    const size = fs * T.scale;
    const tf = c.root(T.weight, T.ls);
    const statSize = Math.max(fs * S.stat.scale, S.stat.min);
    const C = S.combo;
    stack(c.y0, S.gap, [
      y => k.flow(words(r.text).map(w => k.word(upper(w), size, tf, c.text, size * LH)), c.x0, y, { regionW: W, gap: T.gap, rowGap: T.gap, align: 'center' }).h,
      y => {
        const h = statSize * S.stat.lh + 2 * S.stat.marginY;
        k.text(String(hook.statValue || '99%'), 0, y + h / 2, statSize, c.root(900, S.stat.ls), c.accent, { shadow: k.shadow(k.mix(c.accent, 55), 40, 12) });
        return h;
      },
      y => C.marginT + stack(y + C.marginT, C.gap, [
        yy => (hook.statLabel ? k.para(upper(hook.statLabel), c.x0, yy, W, C.labelFont, c.root(C.labelWeight, C.labelLS), c.textSub, { align: 'center' }).h : 0),
        yy => pill(c, r.badge, 0, yy, { font: C.badgeFont, f: c.root(C.badgeWeight), color: c.text, padY: 4, padX: 12, border: 1, radius: 4, fill: c.cardBg, stroke: c.border }),
      ]),
    ]);
  },

  'kinetic-bold-script': (c) => {
    const { k, S, W, r, fs, hook } = c;
    const lineH = fs * S.words.lh;
    const scriptF = { family: hook.scriptFontFamily || 'Dancing Script', weight: 900 };
    const scriptWords: string[] = hook.scriptWords || [];
    const hlText = k.css(c.el.color) || c.text;
    const toks = words(r.text).map(w => (matchIncludes(w, r.highlights)
      ? k.highlight(w, fs, c.root(900), lineH, hook.highlightStyle || 'text-glow', c.accent, hlText, c.onAccent)
      : matchIncludes(w, scriptWords) ? k.word(w, fs, scriptF, c.text, lineH) : k.word(upper(w), fs, c.root(900), c.text, lineH)));
    const U = S.sub;
    stack(c.y0, S.gap, [
      y => (r.badge ? pill(c, r.badge, 0, y, { font: S.badge.font, f: c.root(S.badge.weight, S.badge.ls), upper: true, color: c.accent, padY: 4, padX: 12, border: 2, radius: 20, fill: c.cardBg, stroke: c.accent, shadow: k.shadowVar('--shadow-sm') }) + S.badge.marginB : 0),
      y => {
        const from = k.objs.length;
        let h = k.flow(toks, c.x0, y, { regionW: W, gap: S.words.gap, rowGap: S.words.gap, align: 'center' }).h;
        if (hook.heroLine2) {
          // Dòng 2 viết tay màu accent, mỗi từ nghiêng thêm -4°
          const size2 = fs * S.line2.scale;
          const f2 = { ...scriptF, weight: ROOT_WEIGHT };
          const t2 = words(hook.heroLine2).map((w): FlowToken => {
            const t = k.word(w, size2, f2, c.accent, size2 * LH);
            return { ...t, draw: (x, cy) => { const i = k.objs.length; t.draw(x, cy); k.rotateFrom(i, x + t.w / 2, cy, -4); } };
          });
          h += S.line2.marginT + k.flow(t2, c.x0, y + h + S.line2.marginT, { regionW: W, gap: S.line2.gap, rowGap: S.line2.gap, align: 'center' }).h;
        }
        k.rotateFrom(from, 0, y + h / 2, hook.tiltDeg ?? -6);
        return h;
      },
      y => pill(c, r.sub, 0, y, {
        font: Math.max(U.minFont, fs * U.scale), f: c.root(U.weight), lh: U.lh, color: c.textSub, padY: 6, padX: 14, border: 1, radius: 6,
        fill: hook.boxVariant === 'solid' ? k.v('--surface-1') : c.cardBg, stroke: c.border, maxW: W * U.maxW,
      }),
    ]);
  },

  'kinetic-contrast': (c) => {
    const { k, S, W, r, fs, hook } = c;
    const isLeft = hook.wordLayout !== 'inline';
    const align = isLeft ? 'left' as const : 'center' as const;
    const displayF = { family: hook.fontFamily || r.elFontFamily || r.voice.fontFamily || 'Oswald', weight: 900, ls: '-0.02em' };
    const line2Text: string = hook.heroLine2 || '';
    const parts: Array<(y: number) => number> = [
      y => (r.badge ? pill(c, r.badge, isLeft ? c.x0 : 0, y, { font: S.badge.font, f: c.root(S.badge.weight, S.badge.ls), upper: true, color: c.onAccent, padY: 6, padX: 14, radius: 6, fill: c.accent, shadow: k.shadow(k.mix(c.accent, 40), 16, 4), align }) + S.badge.marginB : 0),
    ];
    if (hook.wordAnimation === 'reveal-wipe') {
      // RevealMaskText: mỗi dòng không xuống dòng, ≤ 4 từ một dòng, dài hơn chia đôi
      const text = line2Text ? `${c.formatted}\n${line2Text}` : c.formatted;
      const ws = words(text);
      const half = Math.ceil(ws.length / 2);
      const lines = text.includes('\n') ? text.split('\n').filter(Boolean) : ws.length <= 4 ? [text] : [ws.slice(0, half).join(' '), ws.slice(half).join(' ')];
      const R = S.reveal;
      const toks = lines.map((l): FlowToken => {
        const w = textW(l, fs, displayF) + R.padX;
        return { w, h: fs * R.lh + R.padY, draw: (x, cy) => { k.text(l, x + w / 2, cy, fs, displayF, c.text); } };
      });
      parts.push(y => k.flow(toks, c.x0, y, { regionW: W, avail: 0, gap: 0, rowGap: R.gap, align }).h);
    } else {
      const L = S.words;
      const size1 = line2Text ? fs * S.line2.firstScale : fs;
      const f1 = c.root(L.weight, L.ls);
      const lh1 = size1 * L.lh;
      const t1 = words(c.formatted).map(w => (!line2Text && matchIncludes(w, r.highlights)
        ? k.highlight(w, size1, f1, lh1, hook.highlightStyle || 'solid-box', c.accent, c.text, c.onAccent)
        : k.word(w, size1, f1, c.text, lh1)));
      parts.push(y => k.flow(t1, c.x0, y, { regionW: W, gap: L.gap, rowGap: L.gap, align }).h);
      if (line2Text) {
        const size2 = fs * S.line2.scale;
        const f2 = { ...displayF, ls: S.line2.ls };
        const lh2 = size2 * S.line2.lh;
        const boxed = hook.highlightStyle && hook.highlightStyle !== 'text-glow';
        const t2 = words(line2Text).map(w => (boxed && matchIncludes(w, [line2Text])
          ? k.highlight(w, size2, f2, lh2, hook.highlightStyle, c.accent, c.accent, c.onAccent)
          : k.word(w, size2, f2, c.accent, lh2, { shadow: k.shadow(k.mix(c.accent, 27), 24, 8) })));
        parts.push(y => S.line2.marginT + k.flow(t2, c.x0, y + S.line2.marginT, { regionW: W, gap: L.gap, rowGap: L.gap, align }).h);
      }
    }
    const U = S.sub;
    const padL = isLeft ? U.padL : 0;
    parts.push(y => (r.sub ? U.marginT + k.para(r.sub, c.x0 + padL, y + U.marginT, W - padL, U.font, { family: r.fontFamily, weight: U.weight, italic: true }, c.textSub, { align }).h : 0));
    stack(c.y0, S.gap, parts);
  },

  'kinetic-solid-box': (c) => {
    const { k, S, W, r, fs, hook, el } = c;
    const isLeft = hook.wordLayout !== 'inline';
    const align = isLeft ? 'left' as const : 'center' as const;
    const hf = { family: hook.fontFamily || r.elFontFamily || 'Be Vietnam Pro', weight: 900, ls: '-0.02em' };
    const color = k.css(hook.textColor || el.color) || c.text;
    const { context, phrase } = splitSolidBox(r.text, r.highlights);
    const plain = (str: string, size: number, lh: number) => words(str).map(w => k.word(upper(w), size, hf, color, size * lh));
    const B = S.badge;
    const Bx = S.box;
    stack(c.y0, S.gap, [
      y => {
        if (!r.badge) return 0;
        // Badge: icon tia sét + chữ, gạch chân accent (border-bottom), không nền
        const o: BoxOpts = {
          font: B.font, f: c.root(B.weight, B.ls), upper: true, color: k.tint(c.accent), maxW: W, align, textAlign: 'left',
          lead: { w: B.icon + B.iconGap, h: B.icon, draw: (x, cy) => { k.icon(HOOK_ICONS.bolt, x + B.icon / 2, cy, B.icon, c.accent, 2.2); } },
        };
        const m = k.measureBox(r.badge, o);
        k.drawBox(isLeft ? c.x0 : 0, y, o, m);
        k.rect(isLeft ? c.x0 : -m.w / 2, y + m.h + B.padB, m.w, B.border, { fill: c.accent });
        return m.h + B.padB + B.border + B.marginB;
      },
      y => (context ? k.flow(plain(context, fs * S.context.scale, S.context.lh), c.x0, y, { regionW: W, gap: textW(' ', fs * S.context.scale, hf), align }).h : 0),
      y => {
        if (!phrase) return 0;
        const size2 = fs * (context ? Bx.scale : 1);
        const gap = Bx.gapEm * r.rootFontSize;
        const toks = words(phrase).map(w => (/^\d+([.,]\d+)?[x×%kKmMbB]?$/.test(w)
          ? k.word(upper(w), size2 * Bx.numScale, hf, c.onAccent, size2 * Bx.numScale)
          : k.word(upper(w), size2, hf, c.onAccent, size2 * Bx.lh)));
        const avail = W - 2 * Bx.padX;
        const sz = k.flowSize(toks, { avail, gap, rowGap: gap });
        const boxW = sz.w + 2 * Bx.padX;
        const boxH = sz.h + Bx.padT + Bx.padB;
        const left = isLeft ? c.x0 : -boxW / 2;
        k.rect(left, y, boxW, boxH, { fill: c.accent, r: 8, shadow: k.shadow(k.mix(c.accent, 22), 28, 6) });
        k.flow(toks, left + Bx.padX, y + Bx.padT, { regionW: sz.w, avail, gap, rowGap: gap, align });
        return boxH;
      },
      y => (!context && !phrase ? k.flow(plain(r.text, fs, S.plainLH), c.x0, y, { regionW: W, gap: textW(' ', fs, hf), align }).h : 0),
      y => (r.sub ? S.sub.marginT + pill(c, r.sub, isLeft ? c.x0 : 0, y + S.sub.marginT, {
        font: S.sub.font, f: c.root(S.sub.weight, S.sub.ls), lh: S.sub.lh, color: c.text, padY: 10, padX: 16, border: 1, radius: 8,
        fill: c.cardBg, stroke: c.border, align, textAlign: align,
      }) : 0),
    ]);
  },

  'kinetic-strip-highlight': (c) => {
    const { k, S, W, r, fs, hook } = c;
    const L1 = S.line1;
    const St = S.strip;
    const U = S.sub;
    const size1 = fs * L1.scale;
    const f1 = c.root(L1.weight, L1.ls);
    const size2 = fs * St.scale;
    const f2 = c.root(St.weight, St.ls);
    const surface = k.v('--surface');
    stack(c.y0, S.gap, [
      y => (r.badge ? pill(c, r.badge, c.x0, y, { font: S.badge.font, f: c.root(S.badge.weight, S.badge.ls), upper: true, color: k.v('--on-surface'), padY: 6, padX: 14, radius: 6, fill: surface, shadow: k.shadow(k.mix(surface, 40), 16, 4), align: 'left' }) + S.badge.marginB : 0),
      y => k.flow(words(r.text).map(w => k.word(upper(w), size1, f1, c.text, size1 * L1.lh)), c.x0 + L1.padL, y, { regionW: W - L1.padL, gap: L1.gap, rowGap: L1.gap, align: 'left' }).h,
      y => {
        // Dải màu rộng 120% (lề âm 10%), chữ bắt đầu đúng mép layout
        const toks = words(hook.heroLine2 || 'MISSING KEYWORD').map(w => k.word(upper(w), size2, f2, c.onAccent, size2 * St.lh));
        const gap = textW(' ', size2, f2);
        const h = k.flowSize(toks, { avail: W, gap }).h + 2 * St.padY;
        k.rect(c.x0 - 0.1 * W, y, 1.2 * W, h, { fill: c.accent, shadow: k.shadow(k.mix(c.accent, 27), 20) });
        k.flow(toks, c.x0, y + St.padY, { regionW: W, gap, align: 'left' });
        return h;
      },
      y => {
        if (!r.sub) return 0;
        const top = y + U.marginT;
        const p = k.para(r.sub, c.x0 + U.padL, top, W - U.padL, U.font, c.root(U.weight), c.text);
        k.rect(c.x0, top + p.h + U.padB, p.w + U.padL, U.border, { fill: c.accent });
        return U.marginT + p.h + U.padB + U.border;
      },
    ]);
  },

  'kinetic-word-weight': (c) => {
    const { k, S, W, H, r } = c;
    const K = S.card;
    const Hd = S.header;
    const Wd = S.words;
    const U = S.sub;
    // Thẻ bo góc phải (0 12 12 0) + viền trái accent
    const rr = 12;
    const w = W - 1;
    const h = H - 1;
    k.add(new fabric.Path(`M0 0 H${w - rr} A${rr} ${rr} 0 0 1 ${w} ${rr} V${h - rr} A${rr} ${rr} 0 0 1 ${w - rr} ${h} H0 Z`, {
      left: 0, top: 0, originX: 'center', originY: 'center', fill: c.cardBg, stroke: c.border, strokeWidth: 1, shadow: k.shadowVar('--shadow-lg'),
    }));
    k.rect(c.x0, c.y0, K.borderL, H, { fill: c.accent });
    const inner = W - 2 * K.padX - bw(K.border) - bw(K.borderL);
    const x = c.x0 + bw(K.borderL) + K.padX;
    let y = c.y0 + bw(K.border) + K.padY;
    const headH = Hd.font * LH;
    k.text(upper(r.badge || 'KINETIC WEIGHT'), x, y + headH / 2, Hd.font, c.root(900, '0.15em'), c.accent, { originX: 'left' });
    k.text('f(w)=log', x + inner, y + headH / 2, Hd.font, { family: 'monospace', weight: ROOT_WEIGHT }, c.textSub, { originX: 'right' });
    y += headH + Hd.padB;
    k.rect(x, y, inner, Hd.border, { fill: c.border });
    y += Hd.border + Hd.marginB + K.gap;
    // Cột từ: cỡ chữ 18–38 theo log2(độ dài) — khớp KineticWordWeightLayout / wordWeightHeights
    const lowerHl = r.highlights.map(s => String(s).toLowerCase().trim());
    const items = words(r.text).map((wd, idx) => {
      const clean = wd.toLowerCase().replace(/[^\w\p{L}]/gu, '');
      const isHl = lowerHl.some(hl => hl === clean || clean.includes(hl) || hl.includes(clean)) || (wd === wd.toUpperCase() && wd.length > 1) || idx === 0;
      return { wd, isHl, weight: Math.log2(wd.length + 1) * (isHl ? 1.4 : 1) };
    });
    const wMax = Math.max(...items.map(t => t.weight), 0.1);
    items.forEach((t, idx) => {
      if (idx > 0) y += Wd.gap;
      const size = Math.round(Wd.min + (Wd.max - Wd.min) * (t.weight / wMax));
      const lh = size * Wd.lh;
      const str = upper(t.wd);
      const f = c.root(900, t.isHl ? '-0.02em' : '-0.01em');
      const tw = textW(str, size, f);
      // break-word: từ dài hơn khung chiếm nhiều dòng (vẽ một dòng, giữ đúng chiều cao)
      const n = Math.max(1, Math.ceil((tw - 0.5) / (t.isHl ? inner - Wd.hlPadX : inner)));
      if (t.isHl) {
        const bwid = Math.min(inner, tw + Wd.hlPadX);
        const bh = n * lh + Wd.hlPadY;
        k.rect(x, y, bwid, bh, { fill: c.accent, r: 4, shadow: k.shadow(k.mix(c.accent, 33), 14, 4) });
        k.text(str, x + bwid / 2, y + bh / 2, size, f, c.onAccent);
        y += bh;
      } else {
        k.text(str, x, y + n * lh / 2, size, f, idx % 2 === 1 ? 'transparent' : c.text, idx % 2 === 1 ? { originX: 'left', stroke: c.text, sw: 1.5 } : { originX: 'left' });
        y += n * lh;
      }
    });
    if (r.sub) k.para(r.sub, x, y + K.gap + U.marginT, Math.min(U.maxW, inner), U.font, c.root(U.weight), c.textSub, { lh: U.lh });
  },

  'cinematic-lower-third': (c) => {
    const { k, S, W, H, r } = c;
    const K = S.card;
    const b = bw(K.border);
    k.rect(c.x0, c.y0, W, H, { fill: c.cardBg, stroke: c.border, sw: K.border, r: 12, shadow: k.shadowVar('--shadow-lg') });
    const x = c.x0 + b + K.padX;
    const inner = W - 2 * K.padX - 2 * b;
    let y = c.y0 + b + K.padY;
    // Kicker: vạch accent 24px + nhãn
    const kick = k.para(upper(r.badge || 'BÍ QUYẾT QUAN TRỌNG'), x + 32, y, inner - 32, S.kicker.font, c.root(800, '0.12em'), c.accent);
    k.rect(x, y + kick.h / 2 - 1.25, 24, 2.5, { fill: c.accent, r: 2, shadow: k.shadow(c.accent, 8) });
    y += kick.h + S.kicker.marginB + K.gap;
    // Tiêu đề: mỗi từ inline-block margin-right 6, từ nhấn (hoặc viết hoa sẵn) màu accent
    const Hr = S.hero;
    const f = c.root(Hr.weight, Hr.ls);
    const toks = words(r.text).map((w): FlowToken => {
      const isHl = matchRendered(w, r.highlights) || (w === w.toUpperCase() && w.length > 1);
      const t = k.word(upper(w), Hr.font, f, isHl ? c.accent : c.text, Hr.font * Hr.lh);
      return { ...t, w: t.w + Hr.marginR };
    });
    y += k.flow(toks, x, y, { regionW: inner, gap: 0, align: 'left' }).h;
    if (r.sub) {
      const U = S.sub;
      y += K.gap + U.marginT;
      const p = k.para(r.sub, x + bw(U.border) + U.padL, y, inner - U.padL - bw(U.border), U.font, c.root(U.weight), c.textSub, { lh: U.lh });
      k.rect(x, y, U.border, p.h, { fill: c.accent });
    }
  },

  'cta-social': (c) => {
    const { k, S, r } = c;
    const K = S.card;
    const U = S.sub;
    stack(c.y0, S.gap, [
      y => actionCard(c, y, {
        stroke: c.border, lead: K.avatar, leadGap: K.avatarGap, button: S.button, btnRadius: 20, meta: r.badge || 'VIDEO MỚI MỖI NGÀY', metaSpec: S.meta,
        hero: { text: r.text, font: S.hero.font, f: c.root(S.hero.weight, S.hero.ls), lh: S.hero.lh },
        drawLead: (cx, cy) => {
          k.add(new fabric.Circle({ left: cx, top: cy, originX: 'center', originY: 'center', radius: K.avatar / 2, fill: diagonal(c.accent, mixColors(c.accent, 75, c.text)), shadow: k.shadow(k.mix(c.accent, 55), 10) }));
          k.icon(HOOK_ICONS.flame, cx, cy, 18, c.onAccent, 2.2);
        },
      }),
      y => pill(c, r.sub, 0, y, {
        font: U.font, f: c.root(U.weight), color: c.text, padY: 6, padX: 14, border: 1, radius: 20, fill: c.cardBg, stroke: c.border,
        lead: { w: U.icon + U.iconGap, h: U.icon, draw: (x, cy) => { k.icon(HOOK_ICONS.bell, x + U.icon / 2, cy, U.icon, c.accent, 2.2); } },
      }),
    ]);
  },

  'cta-pill': (c) => {
    const { k, S, W, r } = c;
    const P = S.pill;
    const U = S.sub;
    const hf = c.root(S.hero.weight, S.hero.ls);
    const font = S.hero.font;
    const lines = wrapLines(upper(r.text), W - 2 * P.padX - 2 * P.icon - 2 * P.gap, font, hf);
    const heroH = lines.length * font * LH;
    const pillH = 2 * P.padY + Math.max(P.icon, heroH);
    stack(c.y0, S.gap, [
      y => {
        k.rect(c.x0, y, W, pillH, { fill: diagonal(c.accent, mixColors(c.accent, 75, c.text)), r: 30, shadow: k.shadow(k.mix(c.accent, 40), 25, 8) });
        const tw = Math.max(...lines.map(l => textW(l, font, hf)));
        const cy = y + pillH / 2;
        let x = -(tw + 2 * P.icon + 2 * P.gap) / 2;
        k.icon(HOOK_ICONS.link, x + P.icon / 2, cy, P.icon, c.onAccent, 2.5);
        x += P.icon + P.gap;
        lines.forEach((l, i) => k.text(l, x, cy - heroH / 2 + (i + 0.5) * font * LH, font, hf, c.onAccent, { originX: 'left' }));
        k.icon(HOOK_ICONS.arrowRight, x + tw + P.gap + P.icon / 2, cy, P.icon, c.onAccent, 2.5);
        return pillH;
      },
      y => pill(c, r.sub, 0, y, {
        font: U.font, f: c.root(U.weight), lh: U.lh, color: c.text, padY: 8, padX: 14, border: 1, radius: 12, fill: c.cardBg, stroke: c.border,
        lead: { w: U.icon + U.iconGap, h: U.icon, draw: (x, cy) => { k.icon(HOOK_ICONS.gift, x + U.icon / 2, cy, U.icon, c.accent, 2); } },
      }),
    ]);
  },

  'cta-comment': (c) => {
    const { k, S, W, r } = c;
    const K = S.card;
    const Hd = S.head;
    const Kw = S.keyword;
    const N = S.note;
    const b = bw(K.border);
    const inner = W - 2 * K.padX - 2 * b;
    const noteColor = k.tint(k.v('--chart-series-2'));
    const rows: Array<[string, BoxOpts]> = [
      [r.badge || 'BÌNH LUẬN NGAY TỪ KHÓA BÊN DƯỚI', { font: Hd.font, f: c.root(Hd.weight), color: c.text, maxW: inner,
        lead: { w: Hd.icon + Hd.iconGap, h: Hd.icon, draw: (x, cy) => { k.icon(HOOK_ICONS.comment, x + Hd.icon / 2, cy, Hd.icon, c.text, 2); } } }],
      [`"${r.highlights[0] || 'TOOL'}"`, { font: Kw.font, f: c.root(Kw.weight, Kw.ls), upper: true, color: c.onAccent, padY: 6, padX: 20, radius: 10, fill: c.accent, shadow: k.shadow(k.mix(c.accent, 55), 16), maxW: inner }],
      [N.text, { font: N.font, f: c.root(N.weight), color: noteColor, maxW: inner,
        lead: { w: N.icon + N.iconGap, h: N.icon, draw: (x, cy) => { k.icon(HOOK_ICONS.arrowDown, x + N.icon / 2, cy, N.icon, noteColor, 2.5); } } }],
    ];
    const ms = rows.map(([t, o]) => k.measureBox(t, o));
    const cardH = 2 * K.padY + 2 * b + ms.reduce((s, m) => s + m.h, 0) + (rows.length - 1) * K.gap;
    stack(c.y0, S.gap, [
      y => {
        k.rect(c.x0, y, W, cardH, { fill: c.cardBg, stroke: c.accent, sw: K.border, r: 16, shadow: k.shadow(k.mix(c.accent, 15), 20) });
        let yy = y + b + K.padY;
        rows.forEach(([, o], i) => { k.drawBox(0, yy, o, ms[i]); yy += ms[i].h + K.gap; });
        return cardH;
      },
      y => (r.sub ? k.para(r.sub, c.x0, y, W, S.sub.font, c.root(S.sub.weight), c.textSub, { align: 'center' }).h : 0),
    ]);
  },

  'cta-bookmark': (c) => {
    const { k, S, H, r } = c;
    const K = S.card;
    actionCard(c, c.y0, {
      cardH: H, stroke: c.accent, lead: K.icon, leadGap: K.iconGap, button: S.button, btnRadius: 8, meta: r.sub || 'Lưu lại để tra cứu khi cần', metaSpec: S.meta,
      hero: { text: upper(r.text), font: S.hero.font, f: c.root(S.hero.weight), lh: LH },
      drawLead: (cx, cy) => { k.icon(HOOK_ICONS.bookmark, cx, cy, K.icon, c.accent, 2.2); },
    });
  },
};

/**
 * Dedicated Master-Hook Fabric Renderer — một builder cho mỗi layout, dùng chung bộ dựng masterHookFabricKit.
 * Khung bao nhóm = W × layoutMasterHookHeight(el) (khung trong suốt neo kích thước).
 */
export function buildMasterHookFabricObjects(
  el: SceneElement,
  _accent: string,
  _w: number,
  _h: number
): fabric.FabricObject[] {
  const r = resolveMasterHook(el);
  const S = HOOK_LAYOUT_SPEC[r.layout];
  const W = el.width || S.width;
  const H = layoutMasterHookHeight(el);
  const theme = getFabricThemeColors(el);
  const k = new HookCanvas(theme);
  const hook: any = r.hook;
  const rawAccent = String(hook.accentColor || el.accentColor || r.defaults.accent);
  const ctx: Ctx = {
    el, r, hook, S, W, H, k,
    fs: fitHeroFontSize(r),
    x0: -W / 2,
    y0: -H / 2,
    accent: k.css(rawAccent) || theme.accent,
    onAccent: onAccentFor(rawAccent, theme),
    text: theme.text,
    textSub: theme.textSub,
    cardBg: theme.cardBg,
    border: theme.border,
    formatted: formatTypographicText(r.text, r.voice.transformMode) || r.text,
    root: (weight, ls) => ({ family: r.fontFamily, weight, ls }),
  };
  // Khung trong suốt W × H: khung bao Fabric = chiều cao công thức (H = f(X))
  k.add(new fabric.Rect({ left: 0, top: 0, width: W, height: H, originX: 'center', originY: 'center', fill: 'transparent', strokeWidth: 0 }));
  (LAYOUTS[r.layout] || LAYOUTS.stacked)(ctx);
  return k.objs;
}
