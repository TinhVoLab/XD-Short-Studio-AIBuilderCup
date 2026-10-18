/**
 * SSOT cho công thức LaTeX: chuẩn hoá, kiểm tra và dựng HTML bằng KaTeX với CÙNG tuỳ chọn
 * cho video (Remotion), canvas (Fabric), Inspector và cổng kiểm tra AI. File .js thuần (dùng được ở server).
 */
import katex from 'katex';

/** Bỏ dấu bao công thức AI hay thêm: $$…$$, $…$, \[…\], \(…\) */
export function normalizeLatex(raw) {
  let s = String(raw ?? '').trim();
  const wrappers = [
    [/^\$\$([\s\S]*)\$\$$/, 1],
    [/^\$([\s\S]*)\$$/, 1],
    [/^\\\[([\s\S]*)\\\]$/, 1],
    [/^\\\(([\s\S]*)\\\)$/, 1],
  ];
  for (const [re] of wrappers) {
    const m = s.match(re);
    if (m) {
      s = m[1].trim();
      break;
    }
  }
  return s;
}

/** Lệnh liên kết / HTML: KaTeX (trust: false) không ném lỗi mà in thành chữ màu lỗi → chặn trước */
const BLOCKED_COMMANDS = /\\(href|url|includegraphics|htmlClass|htmlId|htmlStyle|htmlData)\b/;

const baseOptions = (displayMode) => ({ displayMode, throwOnError: true, strict: 'ignore', output: 'htmlAndMathml' });

/**
 * @param {string} raw
 * @returns {{ ok: boolean, latex: string, error: string | null }}
 */
export function validateLatex(raw) {
  const latex = normalizeLatex(raw);
  if (!latex) return { ok: false, latex, error: 'Công thức trống' };
  const blocked = latex.match(BLOCKED_COMMANDS);
  if (blocked) return { ok: false, latex, error: `Lệnh \\${blocked[1]} không được phép trong công thức` };
  try {
    katex.renderToString(latex, baseOptions(true));
    return { ok: true, latex, error: null };
  } catch (err) {
    const msg = String(err?.message || err).replace(/^KaTeX parse error:\s*/, '');
    return { ok: false, latex, error: `LaTeX không hợp lệ: ${msg}` };
  }
}

/**
 * HTML KaTeX, hoặc null khi công thức sai (nơi gọi hiện bản dự phòng — không bao giờ in lỗi đỏ vào video).
 * @param {string} raw
 * @param {{ displayMode?: boolean }} [opts]
 */
export function renderLatexHtml(raw, opts = {}) {
  const latex = normalizeLatex(raw);
  if (!latex || BLOCKED_COMMANDS.test(latex)) return null;
  try {
    return katex.renderToString(latex, baseOptions(opts.displayMode !== false));
  } catch {
    return null;
  }
}
