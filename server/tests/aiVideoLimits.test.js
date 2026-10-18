import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import { DEFAULT_PLANS, TOPUP_PACKS, MAX_SHORT_VIDEO_SEC, findPlan, maxRenderableVideoSec } from '../../src/config/planCatalog.js';
import { maxSceneCount } from '../../src/config/pacingConfig.js';
import { AI_TIMEOUTS, clientTimeoutMs, serverBudgetMs, isReasonerModel, remainingMs } from '../../src/config/aiTimeouts.js';
import { resolveAiVideoLimits } from '../utils/aiVideoLimits.js';

const free = findPlan(DEFAULT_PLANS, 'free');
const creator = findPlan(DEFAULT_PLANS, 'creator');
const business = findPlan(DEFAULT_PLANS, 'business');

// ── Độ dài xuất được: gói, hoặc gói mua thêm khi còn số dư (cùng luật decideRenderCharge) ──
assert.equal(maxRenderableVideoSec(free, 0), 30);
assert.equal(maxRenderableVideoSec(free, 1), TOPUP_PACKS[0].maxVideoSec, 'free còn video mua thêm → theo gói mua thêm');
assert.equal(maxRenderableVideoSec(creator, 0), 60);
assert.equal(maxRenderableVideoSec(business, 0), 90);
assert.equal(maxRenderableVideoSec(null, 0), 0);

// ── Kẹp yêu cầu AI theo gói ──
const freeUser = { maxVideoSec: maxRenderableVideoSec(free, 0) };
assert.deepEqual(resolveAiVideoLimits(freeUser, { durationSec: 30, sceneCount: 5 }), { maxSec: 30, sceneCount: 5 });
assert.throws(
  () => resolveAiVideoLimits(freeUser, { durationSec: 60, sceneCount: 9 }),
  err => err.statusCode === 403 && err.code === 'AI_VIDEO_TOO_LONG' && /30 giây/.test(err.userMessage),
);
// Số cảnh vô lý bị kẹp theo độ dài
assert.equal(resolveAiVideoLimits(freeUser, { durationSec: 30, sceneCount: 200 }).sceneCount, maxSceneCount(30));
// Không có thông tin gói → trần video short; gói ghi đè lớn hơn trần cũng bị kẹp
assert.equal(resolveAiVideoLimits(undefined, { durationSec: 60, sceneCount: 9 }).maxSec, MAX_SHORT_VIDEO_SEC);
assert.throws(() => resolveAiVideoLimits({ maxVideoSec: 300 }, { durationSec: 180, sceneCount: 30 }), err => err.statusCode === 403);
// Cảnh lẻ trên timeline (n = 1) không bị ảnh hưởng
assert.equal(resolveAiVideoLimits(freeUser, { durationSec: 5, sceneCount: 1 }).sceneCount, 1);

// Preset Wizard đủ cảnh cho mọi độ dài hợp lệ
for (const [sec, scenes] of [[15, 3], [30, 5], [60, 9]]) {
  assert.ok(maxSceneCount(sec) >= scenes, `${sec}s cần ít nhất ${scenes} cảnh`);
}

// ── Thời gian chờ: client luôn chờ lâu hơn server ──
for (const isReasoner of [false, true]) {
  assert.ok(clientTimeoutMs({ isReasoner }) > serverBudgetMs({ isReasoner }), `client > server (reasoner=${isReasoner})`);
  assert.ok(clientTimeoutMs({ isReasoner }) < AI_TIMEOUTS.GATEWAY_TIMEOUT_MS, `client < giới hạn 60s của Hosting (reasoner=${isReasoner})`);
  assert.ok(serverBudgetMs({ isReasoner }) - (isReasoner ? AI_TIMEOUTS.STAGE1_REASONER_MS : AI_TIMEOUTS.STAGE1_MS) >= AI_TIMEOUTS.STAGE2_FALLBACK_MIN_MS);
}
assert.equal(isReasonerModel('deepseek-reasoner'), true);
assert.equal(isReasonerModel('deepseek-flash'), false);
assert.equal(remainingMs(1000, 2000), 0);

// Route không còn số timeout viết cứng — mọi mốc lấy từ aiTimeouts
const routeSrc = readFileSync(new URL('../routes/ai/sceneDesignRoutes.js', import.meta.url), 'utf8');
const sceneDesign = routeSrc.slice(routeSrc.indexOf("router.post('/scene-design'"), routeSrc.indexOf("router.post('/chart-fill'"));
assert.ok(sceneDesign.length > 0);
assert.ok(!/timeoutMs:\s*\d/.test(sceneDesign), '/scene-design không được ghi cứng timeoutMs');

console.log('aiVideoLimits.test.js: OK');
