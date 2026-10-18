/**
 * SSOT hình học của layer `master-hook` (17 layout trong MasterHook/layouts/*.tsx).
 * Dùng chung cho: MasterHookElement (cỡ chữ hero — fitHeroFontSize) và công thức chiều cao
 * (layoutRegistry.calculateElementDynamicHeight → layoutMasterHookHeight). Cả hai đo cùng một mô hình
 * xuống dòng nên luôn đồng ý với nhau; mọi con số phải khớp DOM Remotion (WIDGETS=master-hook npm run test:widgets).
 *
 * Quy ước chung của DOM:
 * - Gốc kế thừa line-height 1.15 và fontWeight 700 từ computedStyle (useElementAnimation), cỡ chữ gốc = el.fontSize || 16.
 * - Chrome vẽ viền lẻ tròn xuống px nguyên (1.5px → 1, 2.5px → 2, 3.5px → 3).
 */
import { measureTextWidth, estimateTextLines, FIT_EPSILON } from './textMetrics.js';
import { ARCHETYPE_DEFAULTS } from './hookArchetypes.js';
import { getHookVoice, formatTypographicText, letterSpacingPx } from './hookTypography.js';

const LH = 1.15; // line-height kế thừa từ gốc
const ROOT_WEIGHT = 700; // fontWeight kế thừa từ gốc
const bw = (b) => (b >= 1 ? Math.floor(b) : b);

/** Kích thước hộp của kiểu nhấn từ (HighlightWordRenderer): padX = rộng thêm (padding + viền + margin), padY = cao thêm */
export const HOOK_HIGHLIGHT_BOX = {
  'text-glow': { padX: 0, padY: 0 },
  'solid-box': { padX: 24, padY: 4 },       // padding 2/10, margin 0 2
  'outline-box': { padX: 24, padY: 6 },     // padding 1/8, viền 2, margin 0 2
  'underline-thick': { padX: 8, padY: 0 },  // padding 0 4
  'marker-circle': { padX: 8, padY: 0 },    // padding 0 4
  'gradient-sweep': { padX: 12, padY: 4, lh: 1.25 }, // padding 2/6, line-height riêng 1.25
};

/**
 * Hình học từng layout (px). W = el.width || width. Chú thích ngắn khớp JSX.
 * fit: [min, max] cỡ chữ gốc (computedFontSize) mà fitHeroFontSize được chọn; layout không có fit dùng cỡ cố định.
 */
export const HOOK_LAYOUT_SPEC = {
  'sticker-words': { width: 328, gap: 12, fit: [28, 48],
    badge: { font: 11, weight: 900, ls: '0.08em', chromeY: 12, chromeX: 26 }, // padding 5/12, viền 1.5→1
    chip: { padX: 20, padY: 8, lh: 1.1, gap: 8 },
    sub: { font: 13, weight: 500, lh: LH, chromeY: 22, insetX: 34 } },
  'stacked': { width: 320, gap: 12, fit: [30, 54],
    badge: { font: 12, weight: 800, ls: '0.04em', chromeY: 14, chromeX: 30 }, // padding 6/14, viền 1
    heroLH: 1.18,
    sub: { font: 13.5, weight: 500, ls: '-0.01em', lh: 1.45, chromeY: 26, chromeYNeon: 26, insetX: 38 } }, // padding 12/18, viền 1 (neon 1.5→1)
  'hazard-alert': { width: 328, gap: 10, fit: [28, 50],
    badge: { font: 11, weight: 800, ls: '0.06em', chromeY: 8, chromeX: 40 }, // padding 4/14, chấm 6 + gap 6
    banner: { padY: 12, padX: 14, border: 2.5 }, heroLH: 1.15, hl: { padX: 20, padY: 4, weight: 900, ls: '-0.01em' },
    sub: { font: 12.5, weight: 500, lh: 1.45, chromeY: 22, insetX: 30 } }, // padding 10/14, viền 1
  'cyber-hud': { width: 328, gap: 10, fit: [26, 46],
    box: { padY: 14, padX: 16, border: 1.5 },
    bar: { font: 10, padB: 6, border: 1, marginB: 8 }, heroLH: 1.15,
    sub: { font: 12.5, lh: 1.4, marginT: 10, padT: 8, border: 1 } }, // monospace
  'split-versus': { width: 330, gap: 10,
    badge: { font: 11, weight: 900, ls: '0.08em', chromeY: 12, chromeX: 30 }, // padding 5/14, viền 1.5→1
    card: { font: 13, weight: 900, lh: 1.25, chromeY: 26, chromeX: 18, colGap: 6, vs: 30 },
    hero: { font: 20, weight: 800, ls: '-0.01em' },
    sub: { font: 12.5, weight: ROOT_WEIGHT, chromeY: 18, insetX: 30 } }, // padding 8/14, viền 1
  'luxury-zen': { width: 328, gap: 14, fit: [26, 44], heroPlus: 2, heroLH: 1.35,
    badge: { font: 11, weight: 600, ls: '0.2em' },
    sub: { font: 13.5, weight: 400, lh: 1.6, maxW: 280 } },
  'kinetic-giant-stat': { width: 400, gap: 4, fit: [32, 44],
    title: { scale: 0.4, weight: 800, ls: '0.05em', gap: 6 },
    stat: { scale: 2.5, min: 96, lh: 0.85, marginY: 4, ls: '-0.04em' },
    combo: { marginT: 8, gap: 6, labelFont: 14, labelWeight: 600, labelLS: '0.1em',
      badgeFont: 12, badgeWeight: 700, badgeChromeY: 10, badgeChromeX: 26 } }, // padding 4/12, viền 1
  'kinetic-bold-script': { width: 360, gap: 8, fit: [28, 50],
    badge: { font: 12, weight: 800, ls: '0.1em', chromeY: 12, chromeX: 28, marginB: 2 }, // padding 4/12, viền 2
    words: { gap: 8, lh: 1.0 }, line2: { scale: 1.15, gap: 6, marginT: -8 },
    sub: { minFont: 12, scale: 0.35, weight: 500, lh: 1.3, chromeY: 14, chromeX: 30, maxW: 0.92 } }, // padding 6/14, viền 1
  'kinetic-contrast': { width: 420, gap: 12, fit: [30, 54],
    badge: { font: 14, weight: 900, ls: '0.1em', chromeY: 12, chromeX: 28, marginB: 8 }, // padding 6/14
    words: { gap: 8, lh: 1.1, weight: 800, ls: '-0.02em' },
    line2: { scale: 1.25, firstScale: 0.75, lh: 1.0, weight: 900, ls: '-0.03em', marginT: -4 },
    reveal: { lh: 1.25, padY: 8, padX: 12, gap: 6 },
    sub: { font: 16, weight: 600, marginT: 4, padL: 4 } },
  'kinetic-solid-box': { width: 420, gap: 10, fit: [28, 50],
    badge: { font: 13, weight: 800, ls: '0.14em', icon: 13, iconGap: 6, padB: 4, border: 2, marginB: 2 },
    context: { scale: 0.82, lh: 1.05 }, box: { scale: 1.05, numScale: 1.45, lh: 1.08, padT: 6, padB: 10, padX: 18, gapEm: 0.25 },
    plainLH: 1.1,
    sub: { font: 14, weight: 500, ls: '0.01em', lh: 1.4, chromeY: 22, insetX: 34, marginT: 6 } }, // padding 10/16, viền 1
  'kinetic-strip-highlight': { width: 420, gap: 12, fit: [28, 48],
    badge: { font: 14, weight: 900, ls: '0.1em', chromeY: 12, chromeX: 28, marginB: 8 },
    line1: { scale: 0.8, weight: 800, ls: '-0.02em', lh: 1.1, gap: 8, padL: 4 },
    strip: { scale: 1.1, weight: 900, ls: '-0.03em', lh: 1.1, padY: 8 },
    sub: { font: 16, weight: 600, marginT: 8, padL: 4, padB: 4, border: 3 } },
  'kinetic-word-weight': { width: 336,
    card: { padY: 16, padX: 18, border: 1, borderL: 3.5, gap: 4 },
    header: { font: 9.5, padB: 6, border: 1, marginB: 8 },
    words: { min: 18, max: 38, lh: 1.05, gap: 3, hlPadY: 4, hlPadX: 16 },
    sub: { font: 12, weight: 500, lh: 1.45, marginT: 10, marginB: 12, maxW: 300 } }, // <p>: margin dưới mặc định 1em
  'cinematic-lower-third': { width: 336,
    card: { padY: 16, padX: 18, border: 1, gap: 8 },
    kicker: { font: 10.5, marginB: 2 },
    hero: { font: 26, weight: 900, ls: '-0.01em', lh: 1.2, marginR: 6 },
    sub: { font: 12.5, weight: 500, lh: 1.45, marginT: 4, padL: 10, border: 2.5 } },
  'cta-social': { width: 330, gap: 10,
    card: { padY: 12, padX: 14, border: 1.5, gap: 10, avatar: 36, avatarGap: 9 },
    hero: { font: 13.5, weight: 900, ls: '-0.01em', lh: 1.2 }, meta: { font: 10, marginT: 2 },
    button: { text: '+ FOLLOW', font: 12, weight: 900, ls: '0.04em', padY: 7, padX: 14 },
    sub: { font: 11.5, weight: 600, chromeY: 14, chromeX: 30, icon: 13, iconGap: 6 } }, // padding 6/14, viền 1
  'cta-pill': { width: 330, gap: 10,
    pill: { padY: 13, padX: 18, icon: 15, gap: 8 },
    hero: { font: 13.5, weight: 900, ls: '0.02em' },
    sub: { font: 12, weight: ROOT_WEIGHT, lh: 1.4, chromeY: 18, chromeX: 30, icon: 13, iconGap: 6 } }, // padding 8/14, viền 1
  'cta-comment': { width: 330, gap: 10,
    card: { padY: 14, padX: 16, border: 1.5, gap: 10 },
    head: { font: 12, weight: 700, icon: 14, iconGap: 6 },
    keyword: { font: 18, weight: 900, ls: '0.08em', chromeY: 12, chromeX: 40 }, // padding 6/20
    note: { text: 'Hệ thống tự động gửi tài liệu trong 3 giây!', font: 12, weight: 700, icon: 12, iconGap: 5 },
    sub: { font: 11.5, weight: ROOT_WEIGHT } },
  'cta-bookmark': { width: 330,
    card: { padY: 12, padX: 16, border: 1.5, gap: 10, icon: 22, iconGap: 10 },
    hero: { font: 13, weight: 900 }, meta: { font: 10, marginT: 2 },
    button: { text: 'LƯU NGAY', font: 11, weight: 900, ls: '0.04em', padY: 6, padX: 12 } },
};

/** Đọc dữ liệu hook giống hệt MasterHookElement (thiếu hookData → archetype theo variant, phụ đề từ el.subtitle) */
export function resolveMasterHook(el) {
  const hook = el.hookData || { archetype: el.variant || 'tips', badgeText: el.statLabel || '', heroTitle: el.content || 'TIÊU ĐỀ HOOK 3S', subText: el.subtitle || '' };
  const archetype = hook.archetype || 'tips';
  const defaults = ARCHETYPE_DEFAULTS[archetype] || ARCHETYPE_DEFAULTS.tips;
  const rawLayout = hook.layoutStyle || defaults.defaultLayout || 'stacked';
  const layout = rawLayout === 'gravity-pull' ? 'kinetic-word-weight' : HOOK_LAYOUT_SPEC[rawLayout] ? rawLayout : 'stacked';
  const voice = getHookVoice(archetype);
  return {
    hook, archetype, defaults, layout, voice,
    text: String(hook.heroTitle || el.content || defaults.heroTitle),
    // badgeText === '' là chủ ý bỏ badge (layout signal 'sub'), không rơi về nhãn mặc định
    badge: String((hook.badgeText !== undefined ? hook.badgeText : defaults.badgeText) || ''),
    sub: String((hook.subText !== undefined ? hook.subText : defaults.subText) || ''),
    highlights: hook.highlightWords || defaults.highlightWords || [],
    width: el.width,
    explicit: hook.fontSize,
    // Font gốc của layout (patchedComputedStyle) và font/độ đậm riêng của element
    fontFamily: el.fontFamily || hook.fontFamily || voice.fontFamily,
    elFontFamily: el.fontFamily,
    elFontWeight: el.fontWeight,
    rootFontSize: el.fontSize || 16,
  };
}

// ── Đo chữ ───────────────────────────────────────────────────────────────

const upper = (s) => String(s).toUpperCase();
const splitWords = (s) => String(s || '').split(/\s+/).filter(Boolean);

/** f = { family, weight, ls ('0.02em' | px) } */
function measure(text, size, f) {
  return measureTextWidth(text, size, { fontFamily: f.family, weight: f.weight, letterSpacing: letterSpacingPx(f.ls, size) });
}
function textLines(text, avail, size, f) {
  return estimateTextLines(text, avail, size, { fontFamily: f.family, weight: f.weight, letterSpacing: letterSpacingPx(f.ls, size) });
}

/** Khớp từ nhấn của renderedHero / HazardAlert (so khớp hai chiều sau khi bỏ dấu câu) */
function matchRendered(word, highlights) {
  const cleanW = word.toLowerCase().replace(/[^\w\p{L}]/gu, '');
  if (!cleanW) return false;
  return highlights.map(h => String(h).toLowerCase().trim()).some(hl => hl === cleanW || cleanW.includes(hl) || hl.includes(cleanW));
}
/** Khớp từ nhấn của StaggeredWordGroup (chứa chuỗi con) */
function matchIncludes(word, highlights) {
  return highlights.some(h => word.toLowerCase().includes(String(h).toLowerCase()));
}

function hlExtraY(box, size, parentLH) {
  return box.lh ? Math.max(0, (box.lh - parentLH) * size) + box.padY : box.padY;
}

/**
 * Luồng chữ: tokens {w, h} xếp trái → phải, xuống hàng khi vượt avail (word-wrap của trình duyệt / flex-wrap).
 * gap = khoảng trắng (chữ) hoặc flex gap; rowGap = row-gap của flex.
 */
function textFlow(words, size, f, { avail, lineH, display = (w) => w, hl, hlBox, hlFont }) {
  const gap = measure(' ', size, f);
  const tokens = words.map(w => {
    const isHl = Boolean(hl && hl(w));
    const width = isHl ? measure(display(w), size, { ...f, ...hlFont }) + hlBox.padX : measure(display(w), size, f);
    return { w: width, h: lineH + (isHl ? hlExtraY(hlBox, size, lineH / size) : 0) };
  });
  return { tokens, gap, avail, rowGap: 0, minH: lineH };
}

export function packRows(flow, avail = flow.avail) {
  const rows = [];
  let cur = null;
  for (const t of flow.tokens) {
    if (cur && cur.w + flow.gap + t.w > avail + FIT_EPSILON) { rows.push(cur); cur = null; }
    if (!cur) cur = { w: t.w, h: Math.max(flow.minH || 0, t.h), n: 1 };
    else { cur.w += flow.gap + t.w; cur.h = Math.max(cur.h, t.h); cur.n += 1; }
  }
  if (cur) rows.push(cur);
  return rows;
}
function flowHeight(flow) {
  if (!flow || flow.tokens.length === 0) return 0;
  const rows = packRows(flow);
  return rows.reduce((s, r) => s + r.h, 0) + Math.max(0, rows.length - 1) * flow.rowGap;
}

/**
 * Các luồng chữ hero của layout ở cỡ gốc fs. fit = tên luồng mà fitHeroFontSize phải xếp vừa;
 * check(slack) = điều kiện phụ (chữ không xuống dòng phải lọt khung).
 */
function heroFlows(c, fs) {
  const { layout, hook, highlights } = c;
  const S = HOOK_LAYOUT_SPEC[layout];
  const W = c.width || S.width;
  const formatted = formatTypographicText(c.text, c.voice.transformMode) || c.text;
  const root = (weight, ls) => ({ family: c.fontFamily, weight, ls });
  const hlBox = HOOK_HIGHLIGHT_BOX[hook.highlightStyle] || HOOK_HIGHLIGHT_BOX['text-glow'];
  const renderedHl = highlights.length ? (w) => matchRendered(w, highlights) : null;

  switch (layout) {
    case 'sticker-words': {
      const f = root(900, '-0.02em');
      const tokens = splitWords(c.text).map(w => ({ w: measure(upper(w), fs, f) + S.chip.padX, h: fs * S.chip.lh + S.chip.padY }));
      return { flows: { hero: { tokens, gap: S.chip.gap, rowGap: S.chip.gap, avail: W, minH: 0 } }, fit: ['hero'] };
    }
    case 'stacked': {
      const f = { family: hook.fontFamily || c.elFontFamily || 'Be Vietnam Pro', weight: Number(hook.fontWeight || c.elFontWeight) || 900, ls: '-0.02em' };
      return { flows: { hero: textFlow(splitWords(formatted), fs, f, { avail: W, lineH: fs * S.heroLH, display: upper, hl: renderedHl, hlBox, hlFont: { weight: 900 } }) }, fit: ['hero'] };
    }
    case 'hazard-alert': {
      const f = { family: hook.fontFamily || c.elFontFamily || c.voice.fontFamily, weight: c.voice.fontWeight || 700, ls: c.voice.letterSpacing || '-0.02em' };
      const avail = W - 2 * S.banner.padX - 2 * bw(S.banner.border);
      return { flows: { hero: textFlow(splitWords(c.text), fs, f, { avail, lineH: fs * S.heroLH, display: upper, hl: renderedHl, hlBox: S.hl, hlFont: { weight: S.hl.weight, ls: S.hl.ls } }) }, fit: ['hero'] };
    }
    case 'cyber-hud': {
      const f = { family: hook.fontFamily || c.elFontFamily || 'Montserrat', weight: 900, ls: '0.02em' };
      // Con trỏ "_" dính liền từ cuối (không có khoảng trắng)
      const words = splitWords(formatted);
      const flow = textFlow(words, fs, f, { avail: W - 2 * S.box.padX - 2 * bw(S.box.border), lineH: fs * S.heroLH, display: upper, hl: renderedHl, hlBox, hlFont: { weight: 900 } });
      if (flow.tokens.length) flow.tokens[flow.tokens.length - 1].w += measure('_', fs, f);
      return { flows: { hero: flow }, fit: ['hero'] };
    }
    case 'luxury-zen': {
      const size = fs + S.heroPlus;
      const f = { family: hook.fontFamily || c.elFontFamily || c.voice.fontFamily, weight: c.voice.fontWeight || 400, ls: c.voice.letterSpacing || '0.04em' };
      return { flows: { hero: textFlow(splitWords(formatted), size, f, { avail: W, lineH: size * S.heroLH, hl: renderedHl, hlBox, hlFont: { weight: 900 } }) }, fit: ['hero'] };
    }
    case 'kinetic-contrast': {
      const displayF = { family: hook.fontFamily || c.elFontFamily || c.voice.fontFamily || 'Oswald', weight: 900, ls: '-0.02em' };
      const line2Text = hook.heroLine2 || '';
      if (hook.wordAnimation === 'reveal-wipe') {
        // RevealMaskText: mỗi dòng nowrap, ≤4 từ một dòng, dài hơn chia đôi
        const text = line2Text ? `${formatted}\n${line2Text}` : formatted;
        const words = splitWords(text);
        const lines = text.includes('\n') ? text.split('\n').filter(Boolean)
          : words.length <= 4 ? [text] : [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')];
        const R = S.reveal;
        const tokens = lines.map(l => ({ w: measure(l, fs, displayF) + R.padX, h: fs * R.lh + R.padY }));
        return { flows: { reveal: { tokens, gap: 0, rowGap: R.gap, avail: 0, minH: 0 } }, fit: [],
          check: (slack) => tokens.every(t => t.w <= W * slack) };
      }
      const L = S.words;
      const size1 = line2Text ? fs * S.line2.firstScale : fs;
      const box1 = HOOK_HIGHLIGHT_BOX[hook.highlightStyle || 'solid-box'] || HOOK_HIGHLIGHT_BOX['solid-box'];
      const f1 = root(L.weight, L.ls);
      const line1 = {
        tokens: splitWords(formatted).map(w => {
          const isHl = !line2Text && matchIncludes(w, highlights);
          return isHl ? { w: measure(w, size1, { ...f1, weight: 900 }) + box1.padX, h: size1 * L.lh + hlExtraY(box1, size1, L.lh) }
            : { w: measure(w, size1, f1), h: size1 * L.lh };
        }),
        gap: L.gap, rowGap: L.gap, avail: W, minH: 0,
      };
      if (!line2Text) return { flows: { line1 }, fit: ['line1'] };
      const size2 = fs * S.line2.scale;
      const f2 = { ...displayF, ls: S.line2.ls };
      const box2 = hook.highlightStyle && hook.highlightStyle !== 'text-glow' ? HOOK_HIGHLIGHT_BOX[hook.highlightStyle] || HOOK_HIGHLIGHT_BOX['text-glow'] : HOOK_HIGHLIGHT_BOX['text-glow'];
      const line2 = {
        tokens: splitWords(line2Text).map(w => {
          const isHl = matchIncludes(w, [line2Text]);
          return { w: measure(w, size2, f2) + (isHl ? box2.padX : 0), h: size2 * S.line2.lh + (isHl ? hlExtraY(box2, size2, S.line2.lh) : 0) };
        }),
        gap: L.gap, rowGap: L.gap, avail: W, minH: 0,
      };
      return { flows: { line1, line2 }, fit: ['line1', 'line2'] };
    }
    case 'kinetic-bold-script': {
      const scriptF = { family: hook.scriptFontFamily || 'Dancing Script', weight: 900 };
      const box = HOOK_HIGHLIGHT_BOX[hook.highlightStyle || 'text-glow'] || HOOK_HIGHLIGHT_BOX['text-glow'];
      const scriptWords = hook.scriptWords || [];
      const lh = S.words.lh;
      const hero = {
        tokens: splitWords(c.text).map(w => {
          // Từ nhấn: renderHighlight (không in hoa, font gốc 900); từ viết tay: font script; còn lại in hoa
          if (matchIncludes(w, highlights)) return { w: measure(w, fs, root(900)) + box.padX, h: fs * lh + hlExtraY(box, fs, lh) };
          if (matchIncludes(w, scriptWords)) return { w: measure(w, fs, scriptF), h: fs * lh };
          return { w: measure(upper(w), fs, root(900)), h: fs * lh };
        }),
        gap: S.words.gap, rowGap: S.words.gap, avail: W, minH: 0,
      };
      if (!hook.heroLine2) return { flows: { hero }, fit: ['hero'] };
      const size2 = fs * S.line2.scale;
      const f2 = { ...scriptF, weight: ROOT_WEIGHT };
      const line2 = { tokens: splitWords(hook.heroLine2).map(w => ({ w: measure(w, size2, f2), h: size2 * LH })), gap: S.line2.gap, rowGap: S.line2.gap, avail: W, minH: 0 };
      return { flows: { hero, line2 }, fit: ['hero', 'line2'] };
    }
    case 'kinetic-solid-box': {
      const f = { family: hook.fontFamily || c.elFontFamily || 'Be Vietnam Pro', weight: 900, ls: '-0.02em' };
      const { context, phrase } = splitSolidBox(c.text, highlights);
      if (!context && !phrase) {
        return { flows: { hero: textFlow(splitWords(c.text), fs, f, { avail: W, lineH: fs * S.plainLH, display: upper }) }, fit: ['hero'] };
      }
      const flows = {};
      if (context) {
        const size1 = fs * S.context.scale;
        flows.context = textFlow(splitWords(context), size1, f, { avail: W, lineH: size1 * S.context.lh, display: upper });
      }
      const B = S.box;
      const size2 = fs * (context ? B.scale : 1);
      const gap = B.gapEm * c.rootFontSize;
      flows.box = {
        tokens: splitWords(phrase).map(w => (/^\d+([.,]\d+)?[x×%kKmMbB]?$/.test(w)
          ? { w: measure(upper(w), size2 * B.numScale, f), h: size2 * B.numScale }
          : { w: measure(upper(w), size2, f), h: size2 * B.lh })),
        gap, rowGap: gap, avail: W - 2 * B.padX, minH: 0,
      };
      return { flows, fit: Object.keys(flows) };
    }
    case 'kinetic-strip-highlight': {
      const L1 = S.line1;
      const size1 = fs * L1.scale;
      const f1 = root(L1.weight, L1.ls);
      const line1 = { tokens: splitWords(c.text).map(w => ({ w: measure(upper(w), size1, f1), h: size1 * L1.lh })), gap: L1.gap, rowGap: L1.gap, avail: W - L1.padL, minH: 0 };
      const size2 = fs * S.strip.scale;
      // Dải màu rộng 120%, padding ngang 10% của W → vùng chữ đúng bằng W
      const line2 = textFlow(splitWords(hook.heroLine2 || 'MISSING KEYWORD'), size2, root(S.strip.weight, S.strip.ls), { avail: W, lineH: size2 * S.strip.lh, display: upper });
      return { flows: { line1, line2 }, fit: ['line1', 'line2'] };
    }
    case 'kinetic-giant-stat': {
      const T = S.title;
      const size = fs * T.scale;
      const f = root(T.weight, T.ls);
      const title = { tokens: splitWords(c.text).map(w => ({ w: measure(upper(w), size, f), h: size * LH })), gap: T.gap, rowGap: T.gap, avail: W, minH: 0 };
      const statSize = Math.max(fs * S.stat.scale, S.stat.min);
      const statW = measure(String(hook.statValue || '99%'), statSize, root(900, S.stat.ls));
      return { flows: { title }, fit: ['title'], check: (slack) => statW <= W * slack };
    }
    default:
      return { flows: {}, fit: [] };
  }
}

/** Tách vế ngữ cảnh / cụm trong khối màu — khớp KineticSolidBoxLayout */
function splitSolidBox(heroTitle, highlights) {
  if (!highlights || highlights.length === 0) return { context: '', phrase: '' };
  const lowerTitle = heroTitle.toLowerCase();
  let first = heroTitle.length;
  for (const hl of highlights.map(h => String(h).toLowerCase().trim())) {
    const idx = lowerTitle.indexOf(hl);
    if (idx !== -1 && idx < first) first = idx;
  }
  if (first > 0 && first < heroTitle.length) return { context: heroTitle.slice(0, first).trim(), phrase: heroTitle.slice(first).trim() };
  return { context: '', phrase: heroTitle };
}

// ── Cỡ chữ hero ──────────────────────────────────────────────────────────

/** Sai số đo glyph: cỡ chữ chỉ hợp lệ khi số dòng không đổi trong khoảng ±3% bề rộng (DOM xuống dòng giống công thức) */
const FIT_SLACK = [0.97, 1.03];
const DEFAULT_HERO_SIZE = 34;

/** Số dòng tối đa của hero: 2; câu dài (≥ 7 từ hoặc > 32 ký tự) được 3 */
export function heroMaxLines(text) {
  return splitWords(text).length >= 7 || String(text || '').length > 32 ? 3 : 2;
}

/**
 * Cỡ chữ gốc (computedFontSize) lớn nhất trong khoảng fit của layout sao cho hero xếp vừa số dòng tối đa,
 * không có dòng cuối mồ côi một từ, và số dòng ổn định trước sai số đo. Cùng một hàm cho Remotion và công thức chiều cao.
 * opts: kết quả resolveMasterHook(el) (text, layout, width, voice, explicit, hook, highlights, fontFamily…)
 */
export function fitHeroFontSize(opts) {
  if (opts.explicit) return opts.explicit;
  const c = {
    hook: {}, highlights: [], voice: getHookVoice('custom'), rootFontSize: 16, ...opts,
    layout: opts.layout === 'gravity-pull' ? 'kinetic-word-weight' : opts.layout,
  };
  c.fontFamily = c.fontFamily || c.voice.fontFamily;
  const spec = HOOK_LAYOUT_SPEC[c.layout];
  if (!spec || !spec.fit) return DEFAULT_HERO_SIZE;
  const [min, max] = spec.fit;
  const evaluate = (fs) => {
    const { flows, fit, check } = heroFlows(c, fs);
    let fits = !check || check(FIT_SLACK[0]);
    let robust = !check || check(FIT_SLACK[1]) === check(FIT_SLACK[0]);
    let orphan = false;
    for (const name of fit) {
      const flow = flows[name];
      if (!flow || flow.tokens.length === 0) continue;
      const tight = packRows(flow, flow.avail * FIT_SLACK[0]);
      const loose = packRows(flow, flow.avail * FIT_SLACK[1]);
      const maxLines = heroMaxLines(name === 'line2' ? c.hook.heroLine2 : c.text);
      if (tight.length > maxLines) fits = false;
      if (tight.length !== loose.length) robust = false;
      if (tight.length > 1 && tight[tight.length - 1].n === 1 && flow.tokens.length >= 3) orphan = true;
      // Một từ dài hơn cả khung (vỡ chữ) — không bao giờ hợp lệ
      if (flow.tokens.some(t => t.w > flow.avail * FIT_SLACK[0] && flow.avail > 0)) fits = false;
    }
    return { fits, robust, orphan };
  };
  const sizes = [];
  for (let s = max; s >= min; s--) sizes.push(s);
  const results = sizes.map(s => [s, evaluate(s)]);
  const pick = (ok) => results.find(([, r]) => ok(r))?.[0];
  return pick(r => r.fits && r.robust && !r.orphan)
    ?? pick(r => r.fits && !r.orphan)
    ?? pick(r => r.fits)
    ?? min;
}

// ── Chiều cao ───────────────────────────────────────────────────────────

const stack = (gap, parts) => {
  const p = parts.filter(h => h > 0);
  return p.reduce((a, h) => a + h, 0) + Math.max(0, p.length - 1) * gap;
};

/**
 * Chiều cao DOM của master-hook (offsetHeight phần tử gốc) — H = f(layout, chữ, cỡ chữ, W).
 */
export function layoutMasterHookHeight(el) {
  const c = resolveMasterHook(el);
  const { layout, hook, badge, sub } = c;
  const S = HOOK_LAYOUT_SPEC[layout];
  const W = el.width || S.width;
  const fs = fitHeroFontSize(c);
  const { flows } = heroFlows(c, fs);
  const rootF = (weight, ls) => ({ family: c.fontFamily, weight, ls });
  const lines = (text, avail, size, weight, ls, family = c.fontFamily) => textLines(text, avail, size, { family, weight, ls });

  switch (layout) {
    case 'sticker-words': {
      const B = S.badge;
      const badgeH = badge ? lines(upper(badge), W - B.chromeX, B.font, B.weight, B.ls) * B.font * LH + B.chromeY : 0;
      const subH = sub ? S.sub.chromeY + lines(sub, W - S.sub.insetX, S.sub.font, S.sub.weight) * S.sub.font * S.sub.lh : 0;
      return stack(S.gap, [badgeH, flowHeight(flows.hero), subH]);
    }
    case 'stacked': {
      const B = S.badge;
      const badgeH = badge ? lines(upper(badge), W - B.chromeX, B.font, B.weight, B.ls) * B.font * LH + B.chromeY : 0;
      const U = S.sub;
      const subH = sub ? U.chromeY + lines(sub, W - U.insetX, U.font, U.weight, U.ls, 'Be Vietnam Pro') * U.font * U.lh : 0;
      return stack(S.gap, [badgeH, flowHeight(flows.hero), subH]);
    }
    case 'hazard-alert': {
      const B = S.badge;
      const clean = badge.replace(/^[⚠️🚨•\s]+/u, '').trim();
      const badgeH = clean ? lines(upper(clean), W - B.chromeX, B.font, B.weight, B.ls) * B.font * LH + B.chromeY : 0;
      const bannerH = flowHeight(flows.hero) + 2 * S.banner.padY + 2 * bw(S.banner.border);
      const subH = sub ? S.sub.chromeY + lines(sub, W - S.sub.insetX, S.sub.font, S.sub.weight) * S.sub.font * S.sub.lh : 0;
      return stack(S.gap, [badgeH, bannerH, subH]);
    }
    case 'cyber-hud': {
      const X = S.box;
      const inner = W - 2 * X.padX - 2 * bw(X.border);
      const barH = S.bar.font * LH + S.bar.padB + S.bar.border + S.bar.marginB;
      const U = S.sub;
      const subH = sub ? U.marginT + U.padT + U.border + lines(`> ${sub}`, inner, U.font, 400, 0, 'monospace') * U.font * U.lh : 0;
      return 2 * X.padY + 2 * bw(X.border) + barH + flowHeight(flows.hero) + subH;
    }
    case 'split-versus': {
      const B = S.badge;
      const badgeH = badge ? lines(upper(badge), W - B.chromeX, B.font, B.weight, B.ls) * B.font * LH + B.chromeY : 0;
      const K = S.card;
      const cardW = (W - K.vs - 2 * K.colGap) / 2 - K.chromeX;
      const cardH = (t) => lines(upper(t), cardW, K.font, K.weight) * K.font * K.lh + K.chromeY;
      const duelH = Math.max(K.vs, cardH(hook.versusLeft || '99% THUA LỖ'), cardH(hook.versusRight || 'TOP 1% KIẾM TIỀN'));
      const heroH = lines(c.text, W, S.hero.font, S.hero.weight, S.hero.ls) * S.hero.font * LH;
      const subH = sub ? S.sub.chromeY + lines(sub, W - S.sub.insetX, S.sub.font, S.sub.weight) * S.sub.font * LH : 0;
      return stack(S.gap, [badgeH, duelH, heroH, subH]);
    }
    case 'luxury-zen': {
      const B = S.badge;
      const badgeH = badge ? lines(upper(`✦ ${badge} ✦`), W, B.font, B.weight, B.ls) * B.font * LH : 0;
      const U = S.sub;
      const subH = sub ? lines(`“${sub}”`, Math.min(U.maxW, W), U.font, U.weight) * U.font * U.lh : 0;
      return stack(S.gap, [badgeH, flowHeight(flows.hero), subH]);
    }
    case 'kinetic-giant-stat': {
      const statSize = Math.max(fs * S.stat.scale, S.stat.min);
      const statH = statSize * S.stat.lh + 2 * S.stat.marginY;
      const C = S.combo;
      const label = hook.statLabel || '';
      const comboParts = [
        label ? lines(upper(label), W, C.labelFont, C.labelWeight, C.labelLS) * C.labelFont * LH : 0,
        badge ? lines(badge, W - C.badgeChromeX, C.badgeFont, C.badgeWeight) * C.badgeFont * LH + C.badgeChromeY : 0,
      ];
      const comboH = C.marginT + stack(C.gap, comboParts);
      return stack(S.gap, [flowHeight(flows.title), statH, comboH]);
    }
    case 'kinetic-bold-script': {
      const B = S.badge;
      const badgeH = badge ? lines(upper(badge), W - B.chromeX, B.font, B.weight, B.ls) * B.font * LH + B.chromeY + B.marginB : 0;
      const groupH = flowHeight(flows.hero) + (flows.line2 ? S.line2.marginT + flowHeight(flows.line2) : 0);
      const U = S.sub;
      const subFont = Math.max(U.minFont, fs * U.scale);
      const subH = sub ? U.chromeY + lines(sub, W * U.maxW - U.chromeX, subFont, U.weight) * subFont * U.lh : 0;
      return stack(S.gap, [badgeH, groupH, subH]);
    }
    case 'kinetic-contrast': {
      const B = S.badge;
      const badgeH = badge ? lines(upper(badge), W - B.chromeX, B.font, B.weight, B.ls) * B.font * LH + B.chromeY + B.marginB : 0;
      const heroParts = flows.reveal ? [flowHeight(flows.reveal)]
        : [flowHeight(flows.line1), flows.line2 ? flowHeight(flows.line2) + S.line2.marginT : 0];
      const isLeft = hook.wordLayout !== 'inline';
      const U = S.sub;
      const subH = sub ? U.marginT + lines(sub, W - (isLeft ? U.padL : 0), U.font, U.weight) * U.font * LH : 0;
      return stack(S.gap, [badgeH, ...heroParts, subH]);
    }
    case 'kinetic-solid-box': {
      const B = S.badge;
      const badgeText = badge ? lines(upper(badge), W - B.icon - B.iconGap, B.font, B.weight, B.ls) * B.font * LH : 0;
      const badgeH = badge ? Math.max(B.icon, badgeText) + B.padB + B.border + B.marginB : 0;
      const boxH = flows.box ? flowHeight(flows.box) + S.box.padT + S.box.padB : 0;
      const U = S.sub;
      const subH = sub ? U.marginT + U.chromeY + lines(sub, W - U.insetX, U.font, U.weight, U.ls) * U.font * U.lh : 0;
      return stack(S.gap, [badgeH, flowHeight(flows.context), boxH, flowHeight(flows.hero), subH]);
    }
    case 'kinetic-strip-highlight': {
      const B = S.badge;
      const badgeH = badge ? lines(upper(badge), W - B.chromeX, B.font, B.weight, B.ls) * B.font * LH + B.chromeY + B.marginB : 0;
      const stripH = flowHeight(flows.line2) + 2 * S.strip.padY;
      const U = S.sub;
      const subH = sub ? U.marginT + U.padB + U.border + lines(sub, W - U.padL, U.font, U.weight) * U.font * LH : 0;
      return stack(S.gap, [badgeH, flowHeight(flows.line1), stripH, subH]);
    }
    case 'kinetic-word-weight': {
      const K = S.card;
      const inner = W - 2 * K.padX - bw(K.border) - bw(K.borderL);
      const Hd = S.header;
      const headerH = Hd.font * LH + Hd.padB + Hd.border + Hd.marginB;
      const wordsH = wordWeightHeights(c, inner);
      const U = S.sub;
      const subH = sub ? U.marginT + lines(sub, Math.min(U.maxW, inner), U.font, U.weight) * U.font * U.lh + U.marginB : 0;
      return 2 * K.padY + 2 * bw(K.border) + stack(K.gap, [headerH, wordsH, subH]);
    }
    case 'cinematic-lower-third': {
      const K = S.card;
      const inner = W - 2 * K.padX - 2 * bw(K.border);
      const kickerH = lines(upper(badge || 'BÍ QUYẾT QUAN TRỌNG'), inner - 32, S.kicker.font, 800, '0.12em') * S.kicker.font * LH + S.kicker.marginB;
      const Hr = S.hero;
      const f = rootF(Hr.weight, Hr.ls);
      // Mỗi từ là inline-block margin-right 6, không có khoảng trắng giữa các từ
      const heroFlow = { tokens: splitWords(c.text).map(w => ({ w: measure(upper(w), Hr.font, f) + Hr.marginR, h: Hr.font * Hr.lh })), gap: 0, rowGap: 0, avail: inner, minH: 0 };
      const U = S.sub;
      const subH = sub ? U.marginT + lines(sub, inner - U.padL - bw(U.border), U.font, U.weight) * U.font * U.lh : 0;
      return 2 * K.padY + 2 * bw(K.border) + stack(K.gap, [kickerH, flowHeight(heroFlow), subH]);
    }
    case 'cta-social': {
      const K = S.card;
      const Bt = S.button;
      const btnW = measure(Bt.text, Bt.font, { family: c.fontFamily, weight: Bt.weight, ls: Bt.ls }) + 2 * Bt.padX;
      const btnH = Bt.font * LH + 2 * Bt.padY;
      const textW = W - 2 * K.padX - 2 * bw(K.border) - K.gap - btnW - K.avatar - K.avatarGap;
      const heroH = lines(c.text, textW, S.hero.font, S.hero.weight, S.hero.ls) * S.hero.font * S.hero.lh;
      const metaH = S.meta.marginT + lines(badge || 'VIDEO MỚI MỖI NGÀY', textW, S.meta.font, ROOT_WEIGHT) * S.meta.font * LH;
      const cardH = 2 * K.padY + 2 * bw(K.border) + Math.max(K.avatar, heroH + metaH, btnH);
      const U = S.sub;
      const subH = sub ? U.chromeY + Math.max(U.icon, lines(sub, W - U.chromeX - U.icon - U.iconGap, U.font, U.weight) * U.font * LH) : 0;
      return stack(S.gap, [cardH, subH]);
    }
    case 'cta-pill': {
      const P = S.pill;
      const heroH = lines(upper(c.text), W - 2 * P.padX - 2 * P.icon - 2 * P.gap, S.hero.font, S.hero.weight, S.hero.ls) * S.hero.font * LH;
      const pillH = 2 * P.padY + Math.max(P.icon, heroH);
      const U = S.sub;
      const subH = sub ? U.chromeY + Math.max(U.icon, lines(sub, W - U.chromeX - U.icon - U.iconGap, U.font, U.weight) * U.font * U.lh) : 0;
      return stack(S.gap, [pillH, subH]);
    }
    case 'cta-comment': {
      const K = S.card;
      const inner = W - 2 * K.padX - 2 * bw(K.border);
      const Hd = S.head;
      const headH = Math.max(Hd.icon, lines(badge || 'BÌNH LUẬN NGAY TỪ KHÓA BÊN DƯỚI', inner - Hd.icon - Hd.iconGap, Hd.font, Hd.weight) * Hd.font * LH);
      const Kw = S.keyword;
      const kwH = lines(upper(`"${c.highlights[0] || 'TOOL'}"`), inner - Kw.chromeX, Kw.font, Kw.weight, Kw.ls) * Kw.font * LH + Kw.chromeY;
      const N = S.note;
      const noteH = Math.max(N.icon, lines(N.text, inner - N.icon - N.iconGap, N.font, N.weight) * N.font * LH);
      const cardH = 2 * K.padY + 2 * bw(K.border) + stack(K.gap, [headH, kwH, noteH]);
      const subH = sub ? lines(sub, W, S.sub.font, S.sub.weight) * S.sub.font * LH : 0;
      return stack(S.gap, [cardH, subH]);
    }
    case 'cta-bookmark': {
      const K = S.card;
      const Bt = S.button;
      const btnW = measure(Bt.text, Bt.font, { family: c.fontFamily, weight: Bt.weight, ls: Bt.ls }) + 2 * Bt.padX;
      const btnH = Bt.font * LH + 2 * Bt.padY;
      const textW = W - 2 * K.padX - 2 * bw(K.border) - K.gap - btnW - K.icon - K.iconGap;
      const heroH = lines(upper(c.text), textW, S.hero.font, S.hero.weight) * S.hero.font * LH;
      const metaH = S.meta.marginT + lines(sub || 'Lưu lại để tra cứu khi cần', textW, S.meta.font, ROOT_WEIGHT) * S.meta.font * LH;
      return 2 * K.padY + 2 * bw(K.border) + Math.max(K.icon, heroH + metaH, btnH);
    }
    default:
      return 0;
  }
}

/** Cột từ của kinetic-word-weight: cỡ chữ 18–38 theo log2(độ dài), từ nhấn có nền (padding 2/8) */
function wordWeightHeights(c, inner) {
  const S = HOOK_LAYOUT_SPEC['kinetic-word-weight'].words;
  const words = splitWords(c.text);
  if (words.length === 0) return 0;
  const lowerHl = c.highlights.map(h => String(h).toLowerCase().trim());
  const items = words.map((w, idx) => {
    const cleanW = w.toLowerCase().replace(/[^\w\p{L}]/gu, '');
    const isHl = lowerHl.some(hl => hl === cleanW || cleanW.includes(hl) || hl.includes(cleanW)) || (w === w.toUpperCase() && w.length > 1) || idx === 0;
    return { w, isHl, weight: Math.log2(w.length + 1) * (isHl ? 1.4 : 1) };
  });
  const wMax = Math.max(...items.map(t => t.weight), 0.1);
  const heights = items.map((t, idx) => {
    const fs = Math.round(S.min + (S.max - S.min) * (t.weight / wMax));
    const ls = t.isHl ? '-0.02em' : '-0.01em';
    const avail = t.isHl ? inner - S.hlPadX : inner;
    // break-word: từ dài hơn khung vỡ thành nhiều dòng
    const width = measure(upper(t.w), fs, { family: c.fontFamily, weight: 900, ls });
    const n = Math.max(1, Math.ceil((width - FIT_EPSILON) / avail));
    return n * fs * S.lh + (t.isHl ? S.hlPadY : 0) + (idx > 0 ? S.gap : 0);
  });
  return heights.reduce((a, h) => a + h, 0);
}
