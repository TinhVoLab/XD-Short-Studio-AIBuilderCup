import assert from 'node:assert/strict';
import {
  DEFAULT_PLANS,
  TOPUP_PACKS,
  findPlan,
  videoCredits,
  payableAmount,
  annualFreeMonths,
  resolutionScale,
  retentionBucketDays,
  buildTransferMemo,
  parseTransferMemo,
  uidTagOf,
  decideRenderCharge,
  applyRenderCharge,
  refundRenderCharge,
  mergePlanWithDefault,
  mergePlansWithDefaults,
} from '../../src/config/planCatalog.js';
import { projectVideoSec } from '../../src/config/videoDuration.js';
import { decidePayment, computeSubscriptionExpiry } from '../services/paymentDecision.js';

const free = findPlan(DEFAULT_PLANS, 'free');
const creator = findPlan(DEFAULT_PLANS, 'creator');
const business = findPlan(DEFAULT_PLANS, 'business');
const TOPUP = TOPUP_PACKS[0];

// ── 1. Bảng giá đã duyệt ──
assert.equal(payableAmount(creator, 'month'), 149000);
assert.equal(payableAmount(creator, 'year'), 1344000);
assert.equal(payableAmount('business', 'month'), 399000);
assert.equal(payableAmount('business', 'year'), 3588000);
assert.equal(payableAmount(free, 'month'), 0);
assert.equal(payableAmount('khong-co', 'month'), 0);
assert.equal(annualFreeMonths(creator), 3);
assert.equal(annualFreeMonths(business), 3);
assert.equal(annualFreeMonths(free), 0);
assert.deepEqual(DEFAULT_PLANS.map(p => p.quotas.monthlyVideoLimit), [5, 30, 100]);
assert.deepEqual(DEFAULT_PLANS.map(p => p.quotas.dailyAiLimit), [5, 50, 300]);
assert.ok(DEFAULT_PLANS.every(p => p.quotas.maxFps === 30), 'không gói nào 60 fps');
assert.deepEqual(TOPUP, { id: 'topup10', videos: 10, maxVideoSec: 60, price: 49000, label: 'Thêm 10 video' });

// Không còn copy bị cấm
const BANNED = [/4K/i, /VIP/i, /không giới hạn/i, /60 FPS/i, /100% KHÔNG/, /Edge-TTS/i, /Gemini Flash/i, /Batch Export/i, /1 năm/, /API/];
for (const plan of DEFAULT_PLANS) {
  for (const text of [plan.name, plan.description, plan.badgeText, ...plan.bulletFeatures.map(b => b.text)]) {
    for (const re of BANNED) assert.ok(!re.test(text || ''), `"${text}" chứa ${re}`);
  }
}

// ── 2. videoCredits: độ dài → số lượt ──
assert.equal(videoCredits(free, 30), 1);
assert.equal(videoCredits(free, 30.4), 1, 'làm tròn tới giây');
assert.equal(videoCredits(free, 31), null);
assert.equal(videoCredits(creator, 60), 1);
assert.equal(videoCredits(creator, 61), null);
assert.equal(videoCredits(business, 60), 1);
assert.equal(videoCredits(business, 61), 2);
assert.equal(videoCredits(business, 90), 2);
assert.equal(videoCredits(business, 91), null);

// ── 3. Độ phân giải, lưu trữ ──
assert.equal(resolutionScale(free), 2);
assert.equal(resolutionScale(creator), 3);
assert.equal(retentionBucketDays(free.quotas.storageRetentionDays), 1);
assert.equal(retentionBucketDays(creator.quotas.storageRetentionDays), 7);
assert.equal(retentionBucketDays(business.quotas.storageRetentionDays), 30);
assert.equal(retentionBucketDays(3), 7, 'làm tròn lên nhóm gần nhất');
assert.equal(retentionBucketDays(365), 30, 'vượt nhóm lớn nhất → nhóm lớn nhất');

// ── 4. Nội dung chuyển khoản ──
const uid = 'aBcD-1234_xyz9QW';
assert.equal(uidTagOf(uid), 'XYZ9QW');
assert.equal(buildTransferMemo('creator', uid), 'XDPRO CREATOR XYZ9QW');
assert.equal(buildTransferMemo('business', uid), 'XDPRO BIZ XYZ9QW');
assert.equal(buildTransferMemo('topup', uid), 'XDPRO TOPUP XYZ9QW');
for (const kind of ['creator', 'business', 'topup']) {
  assert.deepEqual(parseTransferMemo(buildTransferMemo(kind, uid)), { kind, tag: 'XYZ9QW' });
}
assert.deepEqual(parseTransferMemo('MBVCB.123.xdpro biz xyz9qw.CT tu 0123'), { kind: 'business', tag: 'XYZ9QW' });
assert.deepEqual(parseTransferMemo('XDPROTOPUPXYZ9QW GD 998'), { kind: 'topup', tag: 'XYZ9QW' }, 'ngân hàng bỏ dấu cách');
assert.deepEqual(parseTransferMemo('XDPRO BUSINESS XYZ9QW'), { kind: 'business', tag: 'XYZ9QW' });
assert.equal(parseTransferMemo('XDPRO XYZ9QW'), null, 'thiếu loại thanh toán');
assert.equal(parseTransferMemo('chuyen tien an trua'), null);
assert.throws(() => buildTransferMemo('vip', uid));

// ── 5. Webhook: số tiền → gói / chu kỳ / thiếu tiền / mua thêm ──
const memo = kind => parseTransferMemo(buildTransferMemo(kind, uid));
const pay = (kind, amount) => decidePayment({ memo: memo(kind), amount, plans: DEFAULT_PLANS });
assert.deepEqual(
  [pay('creator', 149000).action, pay('creator', 149000).cycle, pay('creator', 149000).days],
  ['subscribe', 'month', 30],
);
assert.equal(pay('creator', 1344000).cycle, 'year');
assert.equal(pay('creator', 1344000).days, 365);
assert.equal(pay('creator', 1000000).cycle, 'month', 'giữa giá tháng và giá năm → 1 tháng');
assert.equal(pay('creator', 148999).action, 'underpaid');
assert.equal(pay('creator', 148999).expected, 149000);
assert.equal(pay('creator', 0).action, 'underpaid');
assert.equal(pay('business', 149000).action, 'underpaid', 'giá Creator không mua được Business');
assert.equal(pay('business', 399000).tier, 'business');
assert.equal(pay('business', 3588000).cycle, 'year');
assert.equal(pay('business', 3587999).cycle, 'month');
assert.deepEqual(pay('topup', 49000), { action: 'topup', packId: 'topup10', packs: 1, videos: 10, amount: 49000 });
assert.equal(pay('topup', 147000).videos, 30, '3 gói');
assert.equal(pay('topup', 97999).packs, 1, 'làm tròn xuống');
assert.equal(pay('topup', 48999).action, 'underpaid');
assert.equal(decidePayment({ memo: null, amount: 999999, plans: DEFAULT_PLANS }).action, 'syntax_mismatch');
// Giá lấy từ danh sách gói truyền vào (Firestore gộp mặc định), không ghi cứng
const pricier = mergePlansWithDefaults([{ id: 'creator', pricing: { monthlyPrice: 199000 } }]);
assert.equal(decidePayment({ memo: memo('creator'), amount: 149000, plans: pricier }).action, 'underpaid');
assert.equal(decidePayment({ memo: memo('creator'), amount: 1344000, plans: pricier }).cycle, 'year');

// ── 6. Gia hạn cộng tiếp từ ngày hết hạn hiện tại ──
const now = Date.parse('2026-10-01T00:00:00Z');
const day = 86400000;
const activeUntil = new Date(now + 10 * day).toISOString();
assert.equal(
  computeSubscriptionExpiry({ currentTier: 'creator', currentExpiresAt: activeUntil, targetTier: 'creator', days: 30, now }),
  new Date(now + 40 * day).toISOString(),
);
assert.equal(
  computeSubscriptionExpiry({ currentTier: 'creator', currentExpiresAt: new Date(now - day).toISOString(), targetTier: 'creator', days: 30, now }),
  new Date(now + 30 * day).toISOString(),
  'đã hết hạn → tính từ bây giờ',
);
assert.equal(
  computeSubscriptionExpiry({ currentTier: 'creator', currentExpiresAt: activeUntil, targetTier: 'business', days: 30, now }),
  new Date(now + 30 * day).toISOString(),
  'đổi gói → tính từ bây giờ',
);
assert.equal(
  computeSubscriptionExpiry({ currentTier: 'free', currentExpiresAt: null, targetTier: 'creator', days: 365, now }),
  new Date(now + 365 * day).toISOString(),
);

// ── 7. Trừ lượt: lượt tháng trước, video mua thêm sau ──
const charge = (plan, videoSec, monthlyUsed, bonusBalance) => decideRenderCharge({ plan, videoSec, monthlyUsed, bonusBalance });
assert.deepEqual(charge(creator, 45, 0, 0), { ok: true, source: 'monthly', credits: 1, videoSec: 45 });
assert.deepEqual(charge(business, 75, 10, 0), { ok: true, source: 'monthly', credits: 2, videoSec: 75 });
assert.equal(charge(creator, 45, 29, 5).source, 'monthly', 'còn lượt tháng → không dùng video mua thêm');
assert.equal(charge(creator, 45, 30, 5).source, 'bonus');
assert.equal(charge(creator, 45, 30, 5).credits, 1);
assert.equal(charge(creator, 45, 30, 0).code, 'quota_exhausted');
assert.equal(charge(business, 75, 99, 0).code, 'quota_exhausted', 'video 2 lượt không vừa 1 lượt còn lại');
assert.equal(charge(business, 75, 99, 0).remaining, 1);
assert.equal(charge(business, 75, 99, 5).code, 'quota_exhausted', 'video mua thêm tối đa 60 giây');
assert.equal(charge(business, 60, 100, 5).source, 'bonus');
assert.equal(charge(creator, 61, 0, 0).code, 'too_long');
assert.equal(charge(creator, 61, 0, 0).maxSec, 60);
assert.equal(charge(business, 95, 0, 9).code, 'too_long');
assert.equal(charge(business, 95, 0, 9).maxSec, 90);
// Miễn phí: video 31–60 giây chỉ xuất được bằng video mua thêm (giới hạn của gói lẻ)
assert.equal(charge(free, 45, 0, 0).code, 'too_long');
assert.equal(charge(free, 45, 0, 3).source, 'bonus');
assert.equal(charge(free, 61, 0, 3).code, 'too_long');

// Phép tính trừ / hoàn lượt
let state = { monthlyUsed: 99, bonusBalance: 4 };
state = applyRenderCharge(state, { source: 'monthly', credits: 1 });
assert.deepEqual(state, { monthlyUsed: 100, bonusBalance: 4 });
state = applyRenderCharge(state, { source: 'bonus', credits: 1 });
assert.deepEqual(state, { monthlyUsed: 100, bonusBalance: 3 });
assert.deepEqual(refundRenderCharge(state, { source: 'bonus', credits: 1 }), { monthlyUsed: 100, bonusBalance: 4 });
assert.deepEqual(refundRenderCharge(state, { source: 'monthly', credits: 2 }), { monthlyUsed: 98, bonusBalance: 3 });
assert.deepEqual(refundRenderCharge({ monthlyUsed: 1, bonusBalance: 0 }, { source: 'monthly', credits: 2 }), { monthlyUsed: 0, bonusBalance: 0 });
assert.deepEqual(applyRenderCharge(state, { source: 'admin', credits: 0 }), state);

// ── 8. Gộp Firestore theo từng khoá ──
const stored = { id: 'creator', name: 'Creator Pro', quotas: { monthlyVideoLimit: 40 }, features: { customFontsAndAssets: true } };
const merged = mergePlanWithDefault(creator, stored);
assert.equal(merged.name, 'Creator Pro');
assert.equal(merged.quotas.monthlyVideoLimit, 40);
assert.equal(merged.quotas.maxVideoSec, 60, 'trường mặc định mới không bị object cũ xoá mất');
assert.equal(merged.quotas.longVideoMaxSec, 60);
assert.equal(merged.pricing.monthlyPrice, 149000);
assert.equal(merged.features.removeWatermark, true);
assert.deepEqual(merged.bulletFeatures, creator.bulletFeatures);
const list = mergePlansWithDefaults([stored, { id: 'agency', name: 'Agency', sortOrder: 9 }]);
assert.deepEqual(list.map(p => p.id), ['free', 'creator', 'business', 'agency']);

// ── 9. Độ dài video (server tính lượt) khớp TransitionSeries ──
assert.equal(projectVideoSec([{ duration: 10 }, { duration: 10 }], []), 20);
assert.equal(projectVideoSec([{ duration: 10, transition: { type: 'fade', duration: 0.5 } }, { duration: 10 }], []), 19.5);
assert.equal(projectVideoSec([{ duration: 10 }], [{ startSec: 2, playDurationSec: 30 }]), 32, 'audio dài hơn cảnh');
assert.equal(projectVideoSec([{ duration: 10, transition: { type: 'none' } }, { duration: 5 }], null), 15);

// ── 10. Giữ lượt / hoàn lượt (bộ nhớ, khi không có Firestore) ──
const { adminDb } = await import('../middlewares/auth.js');
if (!adminDb) {
  const { reserveRenderJob, recordJobEnd, getUserQuota } = await import('../middlewares/quota.js');
  const u = `test_${Date.now()}`;
  const r1 = await reserveRenderJob({ uid: u, jobId: 'j1', plan: business, videoSec: 75 });
  assert.equal(r1.ok, true);
  assert.equal(r1.charge.credits, 2);
  assert.equal((await getUserQuota(u, { tier: 'business' })).used, 2);
  const r2 = await reserveRenderJob({ uid: u, jobId: 'j2', plan: creator, videoSec: 20 });
  assert.equal(r2.ok, true);
  await recordJobEnd(u, 'j1', { refund: true, charge: r1.charge });
  await recordJobEnd(u, 'j1', { refund: true, charge: r1.charge }); // gọi lại: không hoàn 2 lần
  assert.equal((await getUserQuota(u, { tier: 'business' })).used, 1, 'hoàn 2 lượt của video dài');
  // Gói miễn phí: 1 video xuất cùng lúc (j2 còn đang chạy)
  const r3 = await reserveRenderJob({ uid: u, jobId: 'j3', plan: free, videoSec: 20 });
  assert.equal(r3.code, 'concurrent');
  await recordJobEnd(u, 'j2', { charge: r2.charge });
  assert.equal((await getUserQuota(u, { tier: 'business' })).used, 1, 'xong bình thường → không hoàn');
}

console.log('planCatalog: all assertions passed');
