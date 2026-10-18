/**
 * Đo thời gian render video short (R0 — baseline cho render worker Cloud Run).
 * Dựng project mẫu giống video AI Wizard (hook master-hook, widget, phụ đề, chuyển cảnh, nền họa tiết),
 * render 1080×1920 bằng đúng tuỳ chọn renderMedia của server, ghi thời gian / fps / kích thước file.
 *
 * Chạy: node tests/render/renderBenchmark.mjs
 *   DURATIONS=15,30,60   độ dài video (giây)
 *   CONCURRENCY=2,4      số tab render song song (mô phỏng số vCPU của Cloud Run)
 *   PRESETS=medium,veryfast   x264 preset
 *   SCALE=3              1080×1920 (composition 360×640)
 *   REMOTION_BUNDLE_DIR  bundle (mặc định server/build/remotion-bundle)
 */
import path from 'path';
import os from 'os';
import { createRequire } from 'module';
import { statSync, writeFileSync, rmSync } from 'fs';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const { renderMedia, selectComposition, openBrowser } = require(path.join(ROOT, 'node_modules/@remotion/renderer'));
const { buildBenchmarkScenes: buildScenes } = await import('./benchmarkProject.mjs');

const serveUrl = process.env.REMOTION_BUNDLE_DIR ? path.resolve(process.env.REMOTION_BUNDLE_DIR) : path.join(ROOT, 'server/build/remotion-bundle');
const list = (v, d) => (v ? v.split(',') : d);
const DURATIONS = list(process.env.DURATIONS, ['15', '30', '60']).map(Number);
const CONCURRENCY = list(process.env.CONCURRENCY, ['2', '4']).map(Number);
const PRESETS = list(process.env.PRESETS, ['medium', 'veryfast']);
const SCALE = Number(process.env.SCALE || 3);
const browser = await openBrowser('chrome');
const results = [];
const out = path.join(os.tmpdir(), `bench-${process.pid}.mp4`);
console.log(`Máy đo: ${os.cpus().length} CPU, ${Math.round(os.totalmem() / 2 ** 30)} GiB — scale ${SCALE} (${360 * SCALE}×${640 * SCALE})\n`);
for (const durationSec of DURATIONS) {
  const inputProps = { scenes: buildScenes(durationSec), audioClips: [] };
  const composition = await selectComposition({ serveUrl, id: 'MotionStudio', inputProps, puppeteerInstance: browser });
  for (const concurrency of CONCURRENCY) {
    for (const x264Preset of PRESETS) {
      const t0 = performance.now();
      await renderMedia({
        composition, serveUrl, inputProps, puppeteerInstance: browser, outputLocation: out,
        codec: 'h264', audioCodec: 'aac', imageFormat: 'jpeg', jpegQuality: 80, pixelFormat: 'yuv420p',
        crf: SCALE >= 3 ? 20 : 21, scale: SCALE, concurrency, x264Preset,
      });
      const sec = (performance.now() - t0) / 1000;
      const r = {
        durationSec, frames: composition.durationInFrames, concurrency, x264Preset,
        renderSec: Math.round(sec * 10) / 10,
        fps: Math.round((composition.durationInFrames / sec) * 10) / 10,
        realtimeX: Math.round((sec / durationSec) * 100) / 100,
        sizeMB: Math.round((statSync(out).size / 2 ** 20) * 10) / 10,
      };
      results.push(r);
      console.log(`${String(durationSec).padStart(3)}s  conc=${concurrency}  ${x264Preset.padEnd(8)}  ${String(r.renderSec).padStart(6)}s  ${String(r.fps).padStart(5)} fps  ×${r.realtimeX} thời lượng  ${r.sizeMB} MB`);
    }
  }
}
await browser.close({ silent: true });
rmSync(out, { force: true });
writeFileSync(process.env.REPORT || path.join(os.tmpdir(), 'renderBenchmark.json'), JSON.stringify({ cpus: os.cpus().length, scale: SCALE, results }, null, 2));
