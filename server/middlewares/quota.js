import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from './auth.js';
import { planService } from '../services/planService.js';
import { decideRenderCharge, applyRenderCharge, refundRenderCharge } from '../../src/config/planCatalog.js';

/**
 * Hạn mức render theo UID (giờ Việt Nam, làm mới ngày 01 hàng tháng):
 * - render_usage/{YYYY-MM}_{uid}: count = số LƯỢT tháng đã dùng (video dài có thể tính 2 lượt), activeJobs = job đang chạy
 * - users/{uid}.bonusVideos: số video mua thêm còn lại (không hết hạn, chỉ dùng khi hết hạn mức tháng)
 * Trừ lượt bằng transaction trước khi đẩy job; job lưu `charge` { credits, source, monthKey } để hoàn đúng chỗ.
 * Không có Firestore (dev local): dùng bộ nhớ trong tiến trình với cùng phép tính.
 */

const ACTIVE_JOB_TTL_MS = 15 * 60 * 1000;

// Dev local không Firestore: uid → { monthKey, monthlyUsed, bonusBalance, activeJobs: Map<jobId, startedAt> }
const memoryUsage = new Map();

export function getMonthKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(date).slice(0, 7);
}

function getNextMonthResetIso() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString();
}

function countActiveJobs(activeJobs, now = Date.now()) {
  return Object.values(activeJobs || {}).filter(startedAt => now - Number(startedAt) < ACTIVE_JOB_TTL_MS).length;
}

function memoryRecord(uid, monthKey) {
  let rec = memoryUsage.get(uid);
  if (!rec) {
    rec = { monthKey, monthlyUsed: 0, bonusBalance: 0, activeJobs: new Map() };
    memoryUsage.set(uid, rec);
  }
  if (rec.monthKey !== monthKey) Object.assign(rec, { monthKey, monthlyUsed: 0 });
  return rec;
}

/**
 * Giữ lượt cho một job render (gọi trước khi đẩy job).
 * plan = null → Admin: không trừ lượt, chỉ đăng ký job đang chạy.
 * jobDoc: nếu có, ghi render_jobs/{jobId} (kèm charge) trong cùng transaction.
 * Trả về { ok:true, charge } hoặc { ok:false, code, ... } (concurrent | too_long | quota_exhausted).
 */
export async function reserveRenderJob({ uid, jobId, plan, videoSec, jobDoc = null }) {
  const monthKey = getMonthKey();
  const now = Date.now();
  const maxConcurrent = plan ? Math.max(1, Number(plan.quotas?.concurrentRenders) || 1) : Infinity;

  const decide = (activeCount, monthlyUsed, bonusBalance) => {
    if (activeCount >= maxConcurrent) {
      return { ok: false, code: 'concurrent', activeJobs: activeCount, maxConcurrent };
    }
    if (!plan) return { ok: true, charge: { credits: 0, source: 'admin', monthKey } };
    const d = decideRenderCharge({ plan, videoSec, monthlyUsed, bonusBalance });
    return d.ok ? { ok: true, charge: { credits: d.credits, source: d.source, monthKey } } : d;
  };

  if (!adminDb) {
    const rec = memoryRecord(uid, monthKey);
    const active = countActiveJobs(Object.fromEntries(rec.activeJobs), now);
    const result = decide(active, rec.monthlyUsed, rec.bonusBalance);
    if (result.ok) {
      Object.assign(rec, applyRenderCharge(rec, result.charge));
      rec.activeJobs.set(jobId, now);
    }
    return result;
  }

  const usageRef = adminDb.collection('render_usage').doc(`${monthKey}_${uid}`);
  const userRef = adminDb.collection('users').doc(uid);
  const jobRef = adminDb.collection('render_jobs').doc(jobId);

  return adminDb.runTransaction(async tx => {
    const [usageSnap, userSnap] = await Promise.all([tx.get(usageRef), tx.get(userRef)]);
    const usage = usageSnap.exists ? usageSnap.data() : {};
    const result = decide(
      countActiveJobs(usage.activeJobs, now),
      Number(usage.count || 0),
      Number(userSnap.exists ? userSnap.data()?.bonusVideos || 0 : 0),
    );
    if (!result.ok) return result;

    const { charge } = result;
    const usageUpdate = {
      uid,
      monthKey,
      activeJobs: { [jobId]: now },
      lastJobId: jobId,
      updatedAt: new Date(now).toISOString(),
    };
    if (charge.source === 'monthly') usageUpdate.count = FieldValue.increment(charge.credits);
    if (charge.source === 'bonus') {
      usageUpdate.bonusUsed = FieldValue.increment(charge.credits);
      tx.set(userRef, { bonusVideos: FieldValue.increment(-charge.credits) }, { merge: true });
    }
    tx.set(usageRef, usageUpdate, { merge: true });
    if (jobDoc) tx.set(jobRef, { ...jobDoc, charge });
    return result;
  });
}

/**
 * Gỡ job khỏi danh sách đang chạy; refund = job lỗi phía server / bị huỷ khi còn xếp hàng → hoàn lượt về đúng nguồn.
 * Idempotent: chỉ job còn trong activeJobs mới được gỡ/hoàn (gọi 2 lần không hoàn 2 lần).
 * charge thiếu (job tạo trước khi có charge) → coi như 1 lượt tháng.
 */
export async function recordJobEnd(uid, jobId, { refund = false, charge = null } = {}) {
  if (!uid || !jobId) return;
  const c = charge || { credits: 1, source: 'monthly', monthKey: getMonthKey() };
  const monthKey = c.monthKey || getMonthKey();

  if (!adminDb) {
    const rec = memoryUsage.get(uid);
    if (!rec || !rec.activeJobs.delete(jobId)) return;
    if (refund) {
      const next = refundRenderCharge(rec, c);
      if (c.source === 'bonus' || rec.monthKey === monthKey) Object.assign(rec, next);
    }
    return;
  }

  const usageRef = adminDb.collection('render_usage').doc(`${monthKey}_${uid}`);
  const userRef = adminDb.collection('users').doc(uid);
  try {
    await adminDb.runTransaction(async tx => {
      const snap = await tx.get(usageRef);
      if (!snap.exists || !snap.data()?.activeJobs?.[jobId]) return;
      const update = { [`activeJobs.${jobId}`]: FieldValue.delete(), updatedAt: new Date().toISOString() };
      if (refund && c.credits > 0) {
        if (c.source === 'monthly') update.count = FieldValue.increment(-c.credits);
        if (c.source === 'bonus') {
          update.bonusUsed = FieldValue.increment(-c.credits);
          tx.set(userRef, { bonusVideos: FieldValue.increment(c.credits) }, { merge: true });
        }
      }
      tx.update(usageRef, update);
    });
  } catch (err) {
    console.warn('⚠️ [recordJobEnd] Firestore write failed:', err.message);
  }
}

/**
 * Hạn mức hiện tại của user: lượt tháng đã dùng / giới hạn + số video mua thêm còn lại.
 * bonusVideos lấy từ req.user (verifyAuth đã đọc users/{uid}) để không đọc lại.
 */
export async function getUserQuota(uid, { isAdmin = false, tier = 'free', bonusVideos = 0 } = {}) {
  const resetAt = getNextMonthResetIso();
  if (isAdmin || !uid) {
    return { used: 0, limit: -1, remaining: -1, bonusVideos: 0, resetAt };
  }

  const plan = await planService.getPlanById(tier);
  const limit = Number(plan?.quotas?.monthlyVideoLimit ?? 0);
  const monthKey = getMonthKey();
  let used = 0;
  let bonus = Number(bonusVideos) || 0;

  if (adminDb) {
    try {
      const snap = await adminDb.collection('render_usage').doc(`${monthKey}_${uid}`).get();
      used = Number(snap.exists ? snap.data()?.count || 0 : 0);
    } catch (err) {
      console.warn('⚠️ [Quota Engine] Firestore usage read failed:', err.message);
    }
  } else {
    const rec = memoryRecord(uid, monthKey);
    used = rec.monthlyUsed;
    bonus = rec.bonusBalance;
  }

  return {
    used,
    limit,
    remaining: limit === -1 ? -1 : Math.max(0, limit - used),
    bonusVideos: bonus,
    resetAt,
  };
}
