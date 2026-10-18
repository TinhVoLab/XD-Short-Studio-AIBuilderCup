/**
 * Sinh src/config/fontMetrics.js: độ rộng glyph thật (advance width / fontSize) của Be Vietnam Pro
 * ở các độ đậm dùng trong widget, bảng glyph riêng của các font hiển thị của master-hook (GLYPH_FAMILIES),
 * cùng hệ số rộng của các font khác trong fontCatalog.
 * Đo bằng chrome-headless-shell của Remotion + Google Fonts (cùng nguồn font với video).
 *
 * Chạy lại khi đổi font mặc định: node scripts/generateFontMetrics.mjs
 */
import { spawn } from 'child_process';
import { writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const CHROME = path.join(ROOT, 'node_modules/.remotion/chrome-headless-shell/mac-arm64/chrome-headless-shell-mac-arm64/chrome-headless-shell');
const PORT = 9341;

const BASE = 'Be Vietnam Pro';
const WEIGHTS = [400, 500, 600, 700, 800, 900];
const OTHER_FONTS = ['Montserrat', 'Inter', 'Space Grotesk', 'Anton', 'Playfair Display', 'Oswald', 'Dancing Script', 'Caveat', 'Patrick Hand', 'Sriracha', 'Lexend', 'Poppins', 'Bebas Neue', 'Bricolage Grotesque'];
/** Font có bảng glyph riêng (giọng chữ master-hook — src/config/hookTypography.js): hệ số trung bình lệch tới ±4% với chữ in hoa đậm */
const GLYPH_FAMILIES = ['Montserrat', 'Oswald', 'Space Grotesk', 'Playfair Display', 'Dancing Script', 'Bricolage Grotesque'];
/** Font không có đủ 400–900 trên Google Fonts: xin đúng các độ đậm có (một độ đậm thiếu làm hỏng cả URL css2) */
const FAMILY_WEIGHTS = { 'Bricolage Grotesque': [400, 500, 600, 700, 800] };
const VI = 'aàáảãạăằắẳẵặâầấẩẫậbcdđeèéẻẽẹêềếểễệghiìíỉĩịklmnoòóỏõọôồốổỗộơờớởỡợpqrstuùúủũụưừứửữựvxyỳýỷỹỵfjwz';
const CHARS = Array.from(new Set([...VI, ...VI.toUpperCase(), ...'0123456789', ...' .,:;!?%&@#()[]"\'/+-–—*•…$đĐ'])).join('');
const SAMPLE = 'Lãi kép giúp tài sản tăng trưởng theo cấp số nhân 90% nhà đầu tư thua lỗ năm đầu';

const profile = mkdtempSync(path.join(tmpdir(), 'font-metrics-'));
const proc = spawn(CHROME, [`--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
await sleep(1500);

const page = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find(t => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => (ws.onopen = r));
let id = 0;
const pending = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); pending.get(m.id)?.(m); pending.delete(m.id); };
const evaluate = expression => new Promise(r => {
  const i = ++id;
  pending.set(i, m => r(m.result?.result?.value));
  ws.send(JSON.stringify({ id: i, method: 'Runtime.evaluate', params: { expression, awaitPromise: true, returnByValue: true } }));
});

const families = [BASE, ...OTHER_FONTS].map(f => `family=${f.replace(/ /g, '+')}:wght@${(FAMILY_WEIGHTS[f] || WEIGHTS).join(';')}`).join('&');
const result = await evaluate(`(async () => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?${families}&subset=vietnamese&display=block';
  document.head.appendChild(link);
  await new Promise(r => link.onload = r);
  const families = ${JSON.stringify([BASE, ...OTHER_FONTS])};
  for (const f of families) for (const w of [400, 500, 600, 700, 800, 900]) await document.fonts.load(w + ' 100px "' + f + '"', ${JSON.stringify(CHARS + SAMPLE)});
  await document.fonts.ready;
  const ctx = document.createElement('canvas').getContext('2d');
  const width = (text, family, weight) => { ctx.font = weight + ' 100px "' + family + '"'; return ctx.measureText(text).width / 100; };
  const chars = ${JSON.stringify(CHARS)};
  const base = {};
  for (const w of ${JSON.stringify(WEIGHTS)}) {
    base[w] = {};
    for (const ch of chars) base[w][ch] = Math.round(width(ch, ${JSON.stringify(BASE)}, w) * 1000) / 1000;
  }
  const famTables = {};
  for (const f of ${JSON.stringify(GLYPH_FAMILIES)}) {
    famTables[f] = {};
    // Chrome chọn mặt chữ gần nhất khi font thiếu độ đậm — đo ở cả 6 mức để khớp DOM
    for (const w of ${JSON.stringify(WEIGHTS)}) famTables[f][w] = Array.from(chars).map(ch => Math.round(width(ch, f, w) * 1000) / 1000);
  }
  const ref = width(${JSON.stringify(SAMPLE)}, ${JSON.stringify(BASE)}, 600);
  const scale = {};
  for (const f of ${JSON.stringify(OTHER_FONTS)}) {
    const loaded = document.fonts.check('600 100px "' + f + '"');
    scale[f] = loaded ? Math.round(width(${JSON.stringify(SAMPLE)}, f, 600) / ref * 1000) / 1000 : null;
  }
  return { base, families: famTables, scale, loadedBase: document.fonts.check('600 100px "${BASE}"') };
})()`);

ws.close();
proc.kill();
if (!result?.loadedBase) throw new Error('Không tải được font Be Vietnam Pro — kiểm tra kết nối Google Fonts');

const out = `/**
 * TỰ SINH bởi scripts/generateFontMetrics.mjs — không sửa tay.
 * Độ rộng glyph (advance width / fontSize) của "${BASE}" theo độ đậm, đo bằng Chrome + Google Fonts,
 * và hệ số rộng của font khác so với ${BASE} 600 trên câu mẫu tiếng Việt.
 */
export const FONT_METRICS_BASE_FAMILY = ${JSON.stringify(BASE)};
export const GLYPH_WIDTHS = ${JSON.stringify(result.base)};
export const FONT_WIDTH_SCALE = ${JSON.stringify(result.scale, null, 2)};
/** Bảng glyph riêng: FAMILY_GLYPH_WIDTHS[font][độ đậm][i] = độ rộng của FAMILY_GLYPH_CHARS[i] */
export const FAMILY_GLYPH_CHARS = ${JSON.stringify(CHARS)};
export const FAMILY_GLYPH_WIDTHS = {
${Object.entries(result.families).map(([f, ws]) => `  ${JSON.stringify(f)}: {\n${Object.entries(ws).map(([w, arr]) => `    ${w}: [${arr.join(',')}],`).join('\n')}\n  },`).join('\n')}
};
`;
writeFileSync(path.join(ROOT, 'src/config/fontMetrics.js'), out);
console.log('fontMetrics.js:', Object.keys(result.base[600]).length, 'glyphs ×', WEIGHTS.length, 'weights; families:', Object.keys(result.families).join(', '), '; scales:', result.scale);
