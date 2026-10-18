/**
 * Kiểm tra tương phản PIXEL THẬT cho mọi widget × 9 theme: render bằng bundle Remotion, probe báo khung + màu chữ
 * của từng node chữ, nền đo từ pixel ảnh PNG phía sau chữ (pixelContrast.mjs), so ngưỡng WCAG (4.5:1, chữ lớn 3:1).
 *
 * Chạy: npm run build && npm run test:contrast   (WIDGETS=a,b / PALETTES=x,y để thu hẹp; CASES=1 mọi ca widgetCases; PNG_DIR=dir lưu ảnh render)
 */
import path from 'path';
import { createRequire } from 'module';
import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'fs';
import { decodePng, measureRect } from './pixelContrast.mjs';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const { renderStill, selectComposition, openBrowser } = require(path.join(ROOT, 'node_modules/@remotion/renderer'));
const { THEME_PALETTES } = await import(path.join(ROOT, 'src/config/themePalettes.js'));
const { WIDGET_CASES } = await import(path.join(ROOT, 'tests/render/widgetCases.mjs'));

const serveUrl = process.env.REMOTION_BUNDLE_DIR ? path.resolve(process.env.REMOTION_BUNDLE_DIR) : path.join(ROOT, 'server/build/remotion-bundle');
const registrySrc = readFileSync(path.join(ROOT, 'src/remotion/elements/ElementFactory.tsx'), 'utf8');
const ALL_TYPES = [...new Set([...registrySrc.matchAll(/^\s*'([a-z0-9-]+)':\s*[A-Z]/gm)].map(m => m[1]))];
const TYPES = process.env.WIDGETS ? process.env.WIDGETS.split(',') : ALL_TYPES;
const PALETTES = process.env.PALETTES ? process.env.PALETTES.split(',') : Object.keys(THEME_PALETTES);
const SKIP = new Set(['video', 'image', 'lottie', 'hand-drawn', 'character-mascot', 'shape', 'svg', 'rect', 'line', 'divider', 'audio-waveform', 'generative-svg']);
const base = { left: 180, top: 120, width: 312, scaleX: 1, scaleY: 1, angle: 0, opacity: 1, animPreset: 'none' };

const browser = await openBrowser('chrome');
const failures = [];
let checked = 0;
for (const type of TYPES.filter(t => !SKIP.has(t))) {
  // CASES=1: kiểm mọi ca dữ liệu trong widgetCases.mjs (vd. từng layout master-hook), mặc định chỉ ca mặc định
  const cases = process.env.CASES && WIDGET_CASES[type] ? WIDGET_CASES[type] : [{ id: 'default' }];
  for (const c of cases) for (const paletteId of PALETTES) {
    const caseTag = c.id === 'default' ? '' : `#${c.id}`;
    const el = { ...base, ...c, type, id: `${type}${caseTag}@${paletteId}`, content: type === 'text' || type === 'caption' ? 'Lãi kép giúp tài sản tăng trưởng' : c.content };
    const inputProps = { __measureContrast: true, scenes: [{ id: 's', name: 's', description: '', duration: 4, bgColor: '', paletteId, voiceoverText: 'Lãi kép giúp tài sản tăng trưởng mỗi năm', elements: [el] }], audioClips: [] };
    try {
      const composition = await selectComposition({ serveUrl, id: 'MotionStudio', inputProps, puppeteerInstance: browser });
      const output = path.join(process.env.TMPDIR || '/tmp', `contrast-audit-${process.pid}.png`);
      const probes = [];
      await renderStill({
        composition, serveUrl, frame: 110, inputProps, puppeteerInstance: browser, output, imageFormat: 'png',
        onBrowserLog: (log) => {
          if (log.text.startsWith('CONTRAST_PROBE ')) probes.push(JSON.parse(log.text.slice('CONTRAST_PROBE '.length)));
        },
      });
      if (process.env.PNG_DIR) { mkdirSync(process.env.PNG_DIR, { recursive: true }); copyFileSync(output, path.join(process.env.PNG_DIR, `${type}${caseTag}@${paletteId}.png`)); }
      const img = decodePng(readFileSync(output));
      for (const m of probes) {
        const res = measureRect(img, m.rect, m.fg);
        if (!res) continue;
        checked++;
        if (res.ratio < m.min) failures.push({ type: `${type}${caseTag}`, paletteId, text: m.text, ratio: res.ratio, min: m.min, size: m.size, weight: m.weight, fg: res.fg, bg: res.bg, gradientText: !m.fg });
      }
    } catch (e) {
      failures.push({ type, paletteId, error: String(e.message || e).slice(0, 120) });
    }
  }
}
await browser.close({ silent: true });

const byType = {};
for (const f of failures) (byType[f.type] ||= []).push(f);
for (const [type, list] of Object.entries(byType)) {
  console.log(`\n■ ${type} (${list.length})`);
  for (const f of list.slice(0, 6)) {
    console.log(f.error ? `  LỖI RENDER ${f.paletteId}: ${f.error}` : `  ${f.paletteId.padEnd(15)} ${String(f.ratio).padStart(5)} < ${f.min}  "${f.text}" ${f.size}px/${f.weight}  chữ rgb(${f.fg}) / nền rgb(${f.bg})${f.gradientText ? ' (chữ gradient)' : ''}`);
  }
}
writeFileSync(process.env.REPORT || path.join(ROOT, 'tests/render/widgetContrastAudit.report.json'), JSON.stringify(failures, null, 2));
console.log(`\n${checked} node chữ đã kiểm; ${failures.length} vi phạm ở ${Object.keys(byType).length} widget`);
process.exit(failures.length ? 1 : 0);
