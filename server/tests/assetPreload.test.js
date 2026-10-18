import assert from 'node:assert/strict';
import { isMissingStatus, preloadJobAssets, cleanupJobAssets } from '../services/assetPreloadService.js';

// Phân loại: 4xx = mất hẳn; 408/429/5xx/không rõ = lỗi tạm thời
assert.equal(isMissingStatus(404), true);
assert.equal(isMissingStatus(410), true);
assert.equal(isMissingStatus(403), true);
assert.equal(isMissingStatus(408), false);
assert.equal(isMissingStatus(429), false);
assert.equal(isMissingStatus(503), false);
assert.equal(isMissingStatus(null), false);

// Giả lập mạng: *-404 trả 404, *-500 trả 500, còn lại 200
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, opts = {}) => {
  const status = /-404/.test(url) ? 404 : /-500/.test(url) ? 500 : 200;
  return new Response(opts.method === 'HEAD' ? null : 'x', { status });
};

const jobId = `test-preload-${Date.now()}`;
const out = await preloadJobAssets({
  bgMusicUrl: 'https://cdn.test/music-404.mp3',
  audioClips: [{ url: 'https://cdn.test/clip-404.mp3' }, { url: 'https://cdn.test/clip-500.mp3' }],
  scenes: [{
    voiceoverUrl: 'https://cdn.test/voice-404.mp3',
    bgVideoUrl: 'https://cdn.test/bg-404.mp4',
    soundEffects: [{ url: 'https://cdn.test/sfx-404.mp3' }, { url: 'https://cdn.test/sfx-ok.mp3' }],
    elements: [
      { type: 'image', src: 'https://cdn.test/photo-404.png' },
      { type: 'image', src: 'https://cdn.test/photo-500.png' },
      { type: 'image', src: 'https://cdn.test/photo-ok.png' },
      { type: 'video', src: 'https://cdn.test/clip-404.mp4' },
      { type: 'video', src: 'https://cdn.test/clip-ok.mp4' },
    ],
  }],
}, jobId);
globalThis.fetch = realFetch;
cleanupJobAssets(jobId);

const [scene] = out.scenes;
const [img404, img500, imgOk, vid404, vidOk] = scene.elements;

// Ảnh hỏng → ô dự phòng có thiết kế (không phải ảnh trong suốt), ảnh tốt → bản tải trước
assert.deepEqual([img404.src, img404.assetMissing], ['', true]);
assert.deepEqual([img500.src, img500.assetMissing], ['', true]);
assert.match(imgOk.src, /render_temp/);
// Video: chỉ thăm dò; mất hẳn → dự phòng, còn → giữ URL gốc để Chrome stream (không bị thay bằng PNG)
assert.deepEqual([vid404.src, vid404.assetMissing], ['', true]);
assert.equal(vidOk.src, 'https://cdn.test/clip-ok.mp4');
assert.equal(scene.bgVideoUrl, undefined);
// Âm thanh phụ mất hẳn bị bỏ; lỗi tạm thời giữ URL gốc
assert.equal(out.bgMusicUrl, undefined);
assert.deepEqual(out.audioClips.map(c => c.url), ['https://cdn.test/clip-500.mp3']);
assert.equal(scene.soundEffects.length, 1);
// Giọng đọc mất: giữ để render báo lỗi rõ ràng thay vì xuất video câm
assert.equal(scene.voiceoverUrl, 'https://cdn.test/voice-404.mp3');

console.log('✅ assetPreload: all assertions passed');
