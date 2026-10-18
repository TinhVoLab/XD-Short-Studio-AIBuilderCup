/**
 * Kiểm tra hợp đồng chiều cao H = f(X) cho MỌI widget có công thức trong layoutRegistry:
 * render bằng bundle Remotion thật, đo DOM qua LAYOUT_PROBE, so với calculateElementDynamicHeight().
 * Ca kiểm tra: dữ liệu mặc định của widget + các biến thể (WIDGET_CASES) giống output AI.
 *
 * Chạy: npm run build && npm run test:widgets   (TOLERANCE_PX qua biến môi trường, mặc định 6)
 */
import path from 'path';
import { createRequire } from 'module';
import { writeFileSync } from 'fs';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const { renderStill, selectComposition, openBrowser } = require(path.join(ROOT, 'node_modules/@remotion/renderer'));
const { calculateElementDynamicHeight } = await import(path.join(ROOT, 'src/config/layoutRegistry.js'));
const { WIDGET_CASES } = await import(path.join(ROOT, 'tests/render/widgetCases.mjs'));

const TOLERANCE_PX = Number(process.env.TOLERANCE_PX || 6);
const ONLY = process.env.WIDGETS ? new Set(process.env.WIDGETS.split(',')) : null;
const serveUrl = process.env.REMOTION_BUNDLE_DIR ? path.resolve(process.env.REMOTION_BUNDLE_DIR) : path.join(ROOT, 'server/build/remotion-bundle');
const base = { left: 180, top: 40, width: 312, scaleX: 1, scaleY: 1, angle: 0, opacity: 1, animPreset: 'none' };

const browser = await openBrowser('chrome');
const results = [];
for (const [type, cases] of Object.entries(WIDGET_CASES)) {
  if (ONLY && !ONLY.has(type)) continue;
  for (const c of cases) {
    const el = { ...base, type, ...c, id: `${type}#${c.id}` };
    const inputProps = { __measureLayout: true, __measureLayoutDeep: Boolean(process.env.DEEP), scenes: [{ id: 's', name: 's', description: '', duration: 4, bgColor: '', elements: [el] }], audioClips: [] };
    let dom;
    try {
      const composition = await selectComposition({ serveUrl, id: 'MotionStudio', inputProps, puppeteerInstance: browser });
      await renderStill({
        composition, serveUrl, frame: 110, inputProps, puppeteerInstance: browser,
        output: path.join(process.env.TMPDIR || '/tmp', `widget-audit-${process.pid}.png`),
        onBrowserLog: (log) => {
          if (!log.text.startsWith('LAYOUT_PROBE ')) return;
          const m = JSON.parse(log.text.slice('LAYOUT_PROBE '.length));
          if (m.id === el.id) dom = m.height;
          if (m.id === el.id && m.boxes) console.log(`\n${el.id}\n${m.boxes.join('\n')}`);
        },
      });
    } catch (e) {
      dom = undefined;
    }
    const formula = calculateElementDynamicHeight(el);
    results.push({ type, id: c.id, dom, formula, diff: dom === undefined ? NaN : formula - dom });
  }
}
await browser.close({ silent: true });

let failed = 0;
for (const r of results) {
  const ok = Number.isFinite(r.diff) && Math.abs(r.diff) <= TOLERANCE_PX;
  if (!ok) failed++;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${`${r.type}#${r.id}`.padEnd(38)} dom=${String(r.dom).padStart(4)} formula=${String(r.formula).padStart(4)} diff=${r.diff > 0 ? '+' : ''}${r.diff}`);
}
writeFileSync(path.join(ROOT, 'tests/render/widgetLayoutAudit.report.json'), JSON.stringify(results, null, 2));
console.log(failed ? `\n${failed}/${results.length} ca lệch quá ±${TOLERANCE_PX}px` : `\nTất cả ${results.length} ca trong ±${TOLERANCE_PX}px`);
process.exit(failed ? 1 : 0);
