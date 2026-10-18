/**
 * Đo chữ bằng độ rộng glyph THẬT (fontMetrics.js — sinh từ Chrome + Google Fonts; Be Vietnam Pro và các font
 * hiển thị của master-hook có bảng riêng, font khác dùng hệ số rộng so với Be Vietnam Pro) để công thức chiều cao
 * H = f(X) của mọi widget khớp DOM Remotion. Dùng chung cho highlightBoxLayout và layoutRegistry.
 *
 * Mô phỏng word-wrap của trình duyệt: ngắt tại khoảng trắng; [tag] là chip không ngắt; tuỳ chọn
 * orphanGuard mô phỏng preventOrphanText (hai từ cuối dính nhau).
 */
import { GLYPH_WIDTHS, FONT_WIDTH_SCALE, FONT_METRICS_BASE_FAMILY, FAMILY_GLYPH_CHARS, FAMILY_GLYPH_WIDTHS } from './fontMetrics.js';

const DEFAULT_GLYPH = 0.62;
/** Font đơn cách (code-terminal...): mọi ký tự rộng ~0.6em */
const MONO_GLYPH = 0.6;
const MONO_FAMILY = /mono|courier|consolas|menlo|monaco/i;
const DIGITISH = /[0-9%]/;
const WEIGHTS = Object.keys(GLYPH_WIDTHS).map(Number).sort((a, b) => a - b);

/** Sai số an toàn khi so bề rộng (tránh xuống dòng giả do làm tròn số thực) */
export const FIT_EPSILON = 0.5;

function nearestWeight(weight) {
  const w = Number(weight) || 600;
  return WEIGHTS.reduce((best, cur) => (Math.abs(cur - w) < Math.abs(best - w) ? cur : best), WEIGHTS[0]);
}

/** Bảng glyph riêng của font (nếu đã đo): { [weight]: { [ch]: width } }, dựng một lần */
const familyTables = {};
function familyTable(name) {
  if (!FAMILY_GLYPH_WIDTHS[name]) return null;
  if (!familyTables[name]) {
    const chars = Array.from(FAMILY_GLYPH_CHARS);
    familyTables[name] = Object.fromEntries(Object.entries(FAMILY_GLYPH_WIDTHS[name]).map(([w, arr]) =>
      [w, Object.fromEntries(chars.map((ch, i) => [ch, arr[i]]))]));
  }
  return familyTables[name];
}

function fontProfile(fontFamily) {
  const family = String(fontFamily || FONT_METRICS_BASE_FAMILY);
  if (MONO_FAMILY.test(family)) return { mono: true, scale: 1 };
  const first = family.split(',')[0].replace(/["']/g, '').trim();
  const tables = first === FONT_METRICS_BASE_FAMILY ? GLYPH_WIDTHS : familyTable(first);
  if (tables) return { mono: false, scale: 1, tables };
  return { mono: false, scale: FONT_WIDTH_SCALE[first] ?? 1, tables: GLYPH_WIDTHS };
}

/**
 * Độ rộng (px) của một chuỗi không xuống dòng.
 * opts: { weight=600, fontFamily, emphasizeNumbers=false (số in đậm 800), letterSpacing=0 (px) }
 */
export function measureTextWidth(text, fontSize, opts = {}) {
  const { weight = 600, fontFamily, emphasizeNumbers = false, letterSpacing = 0 } = opts;
  const { mono, scale, tables } = fontProfile(fontFamily);
  const chars = Array.from(String(text));
  if (mono) return chars.length * (MONO_GLYPH * fontSize + letterSpacing);
  const table = tables[nearestWeight(weight)];
  const numberTable = tables[nearestWeight(800)];
  let units = 0;
  for (const ch of chars) {
    const t = emphasizeNumbers && DIGITISH.test(ch) ? numberTable : table;
    units += t[ch] ?? DEFAULT_GLYPH;
  }
  return units * fontSize * scale + chars.length * letterSpacing;
}

/** Chia chữ thành các "từ" ngắt được, kèm độ rộng khoảng trắng */
function measureWords(text, fontSize, opts = {}) {
  const { orphanGuard = false } = opts;
  const tokens = String(text).split(/(\[[^\]]+\])/g).flatMap(part =>
    part.startsWith('[') && part.endsWith(']') ? [part] : part.split(/ +/)
  ).filter(Boolean);
  const words = tokens.map(tok =>
    tok.startsWith('[') && tok.endsWith(']')
      ? measureTextWidth(tok.slice(1, -1).trim(), Math.max(10, fontSize * 0.82), { ...opts, weight: 800, emphasizeNumbers: false }) + 24
      : measureTextWidth(tok, fontSize, opts)
  );
  const space = measureTextWidth(' ', fontSize, { ...opts, emphasizeNumbers: false });
  if (orphanGuard && words.length >= 2) {
    const last = words.pop();
    words[words.length - 1] += space + last;
  }
  return { words, space };
}

/**
 * Word-wrap của trình duyệt trên các từ đã đo: trả chỉ số dòng (0-based) của từng từ.
 * Một thuật toán cho cả đếm dòng (estimateTextLines) lẫn dựng dòng (bố cục master-scene).
 */
export function wrapMeasuredWords(widths, space, availW) {
  const lineOf = [];
  let line = 0;
  let cur = 0;
  for (const w of widths) {
    const next = cur === 0 ? w : cur + space + w;
    if (next > availW + FIT_EPSILON && cur > 0) {
      line += 1;
      cur = w;
    } else {
      cur = next;
    }
    lineOf.push(line);
  }
  return lineOf;
}

/** Số dòng hiển thị khi xuống dòng theo từ trong bề rộng availW (mỗi "\n" là một dòng mới) */
export function estimateTextLines(text, availW, fontSize, opts = {}) {
  const paragraphs = String(text ?? '').split('\n');
  return paragraphs.reduce((total, para) => {
    const { words, space } = measureWords(para, fontSize, opts);
    if (words.length === 0) return total + 1;
    const lineOf = wrapMeasuredWords(words, space, availW);
    return total + lineOf[lineOf.length - 1] + 1;
  }, 0);
}

/** Bề rộng (px) của chữ trên một dòng (không ngắt) */
export function estimateTextWidth(text, fontSize, opts = {}) {
  const { words, space } = measureWords(text, fontSize, { ...opts, orphanGuard: false });
  return words.reduce((s, w) => s + w, 0) + Math.max(0, words.length - 1) * space;
}
