/**
 * Đối chiếu canvas editor (Fabric) với video: dựng từng widget × theme bằng đúng code syncFabricElements
 * trong Chrome headless, rồi kiểm
 *   1. tương phản chữ từ PIXEL ảnh canvas (cùng thước đo với test:contrast phía Remotion),
 *   2. chiều cao khung bao Fabric so với calculateElementDynamicHeight (±TOLERANCE_PX).
 *
 * Chạy: npm run test:fabric   (WIDGETS=a,b · PALETTES=x,y · CASES=1 mọi ca widgetCases · PNG_DIR=dir lưu ảnh *.fabric.png)
 */
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync } from 'fs';
import { build } from 'esbuild';
import { decodePng, measureRect } from './pixelContrast.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const CHROME = path.join(ROOT, 'node_modules/.remotion/chrome-headless-shell/mac-arm64/chrome-headless-shell-mac-arm64/chrome-headless-shell');
const TOLERANCE_PX = Number(process.env.TOLERANCE_PX || 6);
const FONTS = ['Be Vietnam Pro', 'Inter', 'Montserrat', 'Oswald', 'Space Grotesk', 'Playfair Display', 'Dancing Script', 'Fira Code', 'Bricolage Grotesque', 'JetBrains Mono'];
/** Font không có đủ 400–900: xin đúng độ đậm có, một độ đậm thiếu làm hỏng cả URL css2 */
const FONT_WEIGHTS = { 'Bricolage Grotesque': '400;500;600;700;800', 'JetBrains Mono': '400;500;600;700;800' };

const { THEME_PALETTES } = await import(path.join(ROOT, 'src/config/themePalettes.js'));
const { calculateElementDynamicHeight } = await import(path.join(ROOT, 'src/config/layoutRegistry.js'));
const { WIDGET_CASES } = await import(path.join(ROOT, 'tests/render/widgetCases.mjs'));

const registrySrc = readFileSync(path.join(ROOT, 'src/remotion/elements/ElementFactory.tsx'), 'utf8');
const ALL_TYPES = [...new Set([...registrySrc.matchAll(/^\s*'([a-z0-9-]+)':\s*[A-Z]/gm)].map(m => m[1]))];
const SKIP = new Set(['video', 'image', 'lottie', 'hand-drawn', 'character-mascot', 'shape', 'svg', 'rect', 'line', 'divider', 'audio-waveform', 'generative-svg', 'text', 'caption']);
const TYPES = (process.env.WIDGETS ? process.env.WIDGETS.split(',') : ALL_TYPES).filter(t => !SKIP.has(t));
const PALETTES = process.env.PALETTES ? process.env.PALETTES.split(',') : Object.keys(THEME_PALETTES);
const base = { left: 180, top: 120, width: 312, scaleX: 1, scaleY: 1, angle: 0, opacity: 1, animPreset: 'none' };

// 1. Đóng gói trang đo (cùng alias @ với app)
const dir = mkdtempSync(path.join(os.tmpdir(), 'fabric-parity-'));
const bundle = await build({
  entryPoints: [path.join(ROOT, 'tests/render/fabricParity/entry.ts')],
  bundle: true, format: 'iife', platform: 'browser', write: false, logLevel: 'error',
  alias: { '@': path.join(ROOT, 'src') },
  define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env': '{}' },
  loader: { '.png': 'dataurl', '.svg': 'dataurl', '.css': 'empty', '.module.css': 'empty' },
});
const families = FONTS.map(f => `family=${f.replace(/ /g, '+')}:wght@${FONT_WEIGHTS[f] || '400;500;600;700;800;900'}`).join('&');
writeFileSync(path.join(dir, 'index.html'), `<!doctype html><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${families}&subset=vietnamese&display=block">
<style>body{margin:0;background:#000}</style><div id="host"></div>
<script>${bundle.outputFiles[0].text.replace(/<\/script/g, '<\\/script')}</script>`);

// 2. Chrome headless qua CDP (cùng trình duyệt Remotion dùng)
// Cổng 0 = Chrome tự chọn cổng trống (ghi vào DevToolsActivePort) → chạy song song nhiều audit không tranh cổng
const profile = mkdtempSync(path.join(os.tmpdir(), 'fabric-chrome-'));
const proc = spawn(CHROME, ['--remote-debugging-port=0', `--user-data-dir=${profile}`, '--allow-file-access-from-files', `file://${path.join(dir, 'index.html')}`], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let page;
for (let i = 0; i < 60 && !page; i++) {
  await sleep(250);
  try {
    const port = readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0].trim();
    page = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === 'page');
  } catch { /* chưa sẵn sàng */ }
}
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => (ws.onopen = r));
let msgId = 0;
const pending = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); pending.get(m.id)?.(m); pending.delete(m.id); };
const evaluate = expression => new Promise((resolve, reject) => {
  const i = ++msgId;
  pending.set(i, m => (m.result?.exceptionDetails ? reject(new Error(m.result.exceptionDetails.exception?.description || 'lỗi trang')) : resolve(m.result?.result?.value)));
  ws.send(JSON.stringify({ id: i, method: 'Runtime.evaluate', params: { expression, awaitPromise: true, returnByValue: true } }));
});
for (let i = 0; i < 80 && !(await evaluate('window.__fabricReady === true && document.fonts.status === "loaded"')); i++) await sleep(250);
await evaluate(`Promise.all(${JSON.stringify(FONTS)}.flatMap(f => [400, 600, 700, 800, 900].map(w => document.fonts.load(w + ' 20px "' + f + '"', 'Tiếng Việt 90%'))))`);

// 3. Đo
const failures = [];
const layout = [];
let checked = 0;
for (const type of TYPES) {
  const cases = process.env.CASES && WIDGET_CASES[type] ? WIDGET_CASES[type] : [{ id: 'default' }];
  for (const c of cases) {
    const caseTag = c.id === 'default' ? '' : `#${c.id}`;
    const el = { ...base, ...c, type, id: `${type}${caseTag}` };
    const formula = calculateElementDynamicHeight(el);
    for (const paletteId of PALETTES) {
      let res;
      try {
        res = await evaluate(`window.__renderFabric(${JSON.stringify({ ...el, height: formula })}, ${JSON.stringify(paletteId)})`);
      } catch (e) {
        failures.push({ type: `${type}${caseTag}`, paletteId, error: String(e.message || e).slice(0, 160) });
        continue;
      }
      const buf = Buffer.from(res.png.split(',')[1], 'base64');
      if (process.env.PNG_DIR) { mkdirSync(process.env.PNG_DIR, { recursive: true }); writeFileSync(path.join(process.env.PNG_DIR, `${type}${caseTag}@${paletteId}.fabric.png`), buf); }
      const img = decodePng(buf);
      for (const t of res.texts) {
        const fg = parseFill(t.fill, t.opacity);
        const m = measureRect(img, t.rect, fg);
        if (!m) continue;
        checked++;
        const large = t.size >= 24 || (t.size >= 18.66 && Number(t.weight) >= 700) || t.weight === 'bold' && t.size >= 18.66;
        const min = large ? 3 : 4.5;
        if (m.ratio < min) failures.push({ type: `${type}${caseTag}`, paletteId, text: t.text, ratio: m.ratio, min, size: t.size, fg: m.fg, bg: m.bg });
      }
      if (paletteId === PALETTES[0] && res.bounds) layout.push({ type: `${type}${caseTag}`, fabric: Math.round(res.bounds[3]), formula, diff: Math.round(res.bounds[3]) - formula });
    }
  }
}
ws.close();
proc.kill();

function parseFill(fill, opacity) {
  if (!fill) return null;
  const s = fill.trim();
  let c = null;
  if (s.startsWith('#')) {
    const h = s.length === 4 ? s.slice(1).split('').map(x => x + x).join('') : s.slice(1);
    c = [0, 2, 4].map(k => parseInt(h.slice(k, k + 2), 16)).concat(h.length >= 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1);
  } else {
    const m = s.match(/^rgba?\(([^)]+)\)$/i);
    if (m) { const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); c = [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; }
  }
  return c ? [c[0], c[1], c[2], c[3] * opacity] : null;
}

// 4. Báo cáo
const byType = {};
for (const f of failures) (byType[f.type] ||= []).push(f);
for (const [type, list] of Object.entries(byType)) {
  console.log(`\n■ ${type} (${list.length})`);
  for (const f of list.slice(0, 5)) {
    console.log(f.error ? `  LỖI ${f.paletteId}: ${f.error}` : `  ${f.paletteId.padEnd(15)} ${String(f.ratio).padStart(5)} < ${f.min}  "${f.text}" ${f.size}px  chữ rgb(${f.fg}) / nền rgb(${f.bg})`);
  }
}
const badLayout = layout.filter(l => Math.abs(l.diff) > TOLERANCE_PX);
if (badLayout.length) {
  console.log(`\n■ Khung Fabric lệch công thức (> ±${TOLERANCE_PX}px):`);
  for (const l of badLayout) console.log(`  ${l.type.padEnd(40)} fabric=${String(l.fabric).padStart(4)} formula=${String(l.formula).padStart(4)} diff=${l.diff > 0 ? '+' : ''}${l.diff}`);
}
writeFileSync(process.env.REPORT || path.join(os.tmpdir(), 'fabricParity.report.json'), JSON.stringify({ failures, layout }, null, 2));
console.log(`\n${checked} chữ đã kiểm; ${failures.length} vi phạm tương phản ở ${Object.keys(byType).length} widget; ${badLayout.length}/${layout.length} khung lệch chiều cao`);
process.exit(failures.length || badLayout.length ? 1 : 0);
