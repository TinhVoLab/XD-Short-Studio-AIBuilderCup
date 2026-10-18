import { findPlan, payableAmount, SUBSCRIPTION_DAYS, TOPUP_PACKS } from '../../src/config/planCatalog.js';

/**
 * Quyết định xử lý một giao dịch chuyển khoản (thuần, không I/O — để test được).
 * memo: kết quả parseTransferMemo; amount: số tiền thực nhận; plans: gói đã gộp Firestore (planService).
 * - Gói: amount ≥ tổng trả năm → year; ≥ giá tháng → month; còn lại → underpaid (không nâng cấp).
 * - Mua thêm: số gói = floor(amount / giá gói) → videos = số gói × videos/gói; < 1 gói → underpaid.
 */
export function decidePayment({ memo, amount, plans, topupPacks = TOPUP_PACKS }) {
  const paid = Math.max(0, Number(amount) || 0);
  if (!memo) return { action: 'syntax_mismatch' };

  if (memo.kind === 'topup') {
    const pack = topupPacks[0];
    const packs = pack?.price > 0 ? Math.floor(paid / pack.price) : 0;
    if (packs < 1) return { action: 'underpaid', kind: 'topup', expected: pack?.price || 0, amount: paid };
    return { action: 'topup', packId: pack.id, packs, videos: packs * pack.videos, amount: paid };
  }

  const plan = findPlan(plans, memo.kind);
  const monthly = payableAmount(plan, 'month');
  const annual = payableAmount(plan, 'year');
  if (!plan || monthly <= 0) return { action: 'invalid_plan', tier: memo.kind, amount: paid };

  if (annual > 0 && paid >= annual) {
    return { action: 'subscribe', tier: plan.id, cycle: 'year', days: SUBSCRIPTION_DAYS.year, expected: annual, amount: paid };
  }
  if (paid >= monthly) {
    return { action: 'subscribe', tier: plan.id, cycle: 'month', days: SUBSCRIPTION_DAYS.month, expected: monthly, amount: paid };
  }
  return { action: 'underpaid', kind: plan.id, tier: plan.id, expected: monthly, amount: paid };
}

/**
 * Hạn mới của gói: gia hạn cùng gói khi còn hạn → cộng tiếp từ ngày hết hạn hiện tại;
 * đổi gói hoặc đã hết hạn → tính từ bây giờ.
 */
export function computeSubscriptionExpiry({ currentTier, currentExpiresAt, targetTier, days, now = Date.now() }) {
  const currentExpiry = currentExpiresAt ? new Date(currentExpiresAt).getTime() : NaN;
  const base = currentTier === targetTier && Number.isFinite(currentExpiry) && currentExpiry > now ? currentExpiry : now;
  return new Date(base + days * 86400000).toISOString();
}
