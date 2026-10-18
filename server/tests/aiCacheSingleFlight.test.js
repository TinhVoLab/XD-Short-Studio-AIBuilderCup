import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import { aiCache } from '../services/cacheService.js';

let calls = 0;
const worker = async () => { calls++; await new Promise(r => setTimeout(r, 20)); return ['scene']; };

// Hai request trùng cùng lúc → worker chạy 1 lần, request sau chờ chung
aiCache.clear();
const [a, b] = await Promise.all([
  aiCache.executeWithSingleFlight('k1', worker),
  aiCache.executeWithSingleFlight('k1', worker),
]);
assert.equal(calls, 1);
assert.deepEqual(a.data, ['scene']);
assert.equal(b.isShared, true);

// Lần sau trúng cache → không gọi worker
const c = await aiCache.executeWithSingleFlight('k1', worker);
assert.equal(c.fromCache, true);
assert.equal(calls, 1);

// Admin tắt cache → không đọc, không ghi cache, nhưng vẫn gộp request trùng
calls = 0;
const off = { useCache: false };
const d = await aiCache.executeWithSingleFlight('k1', worker, off);
assert.equal(d.fromCache, false);
assert.equal(calls, 1, 'tắt cache thì không trả kết quả cũ');
await aiCache.executeWithSingleFlight('k2', worker, off);
assert.equal(aiCache.get('k2'), null, 'tắt cache thì không ghi');
calls = 0;
await Promise.all([aiCache.executeWithSingleFlight('k3', worker, off), aiCache.executeWithSingleFlight('k3', worker, off)]);
assert.equal(calls, 1);

// Stage 1 (gọi LLM viết kịch bản) phải nằm trong worker single-flight của /scene-design
const src = readFileSync(new URL('../routes/ai/sceneDesignRoutes.js', import.meta.url), 'utf8');
const flight = src.indexOf('aiCache.executeWithSingleFlight(cacheKey');
const stage1 = src.indexOf('// ── STAGE 1: SCRIPT & HOOK REASONING ──');
assert.ok(flight > 0 && stage1 > flight, 'Stage 1 phải chạy bên trong executeWithSingleFlight');
assert.ok(src.includes('aiCacheEnabled !== false'), 'route phải tôn trọng công tắc AI Cache của Admin');

console.log('aiCacheSingleFlight.test.js: OK');
