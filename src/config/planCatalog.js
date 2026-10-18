/**
 * SSOT gói cước XD-Short — dùng chung cho client (Vite) và server (Node import trực tiếp file .js này).
 * Firestore `system_plans` chỉ ghi đè từng khoá (mergePlanWithDefault), không thay thế cả object.
 * Chỉ khai báo quyền lợi THỰC SỰ được thực thi; không giữ cờ tính năng "trang trí".
 */

export const PLAN_TIER_IDS = ['free', 'creator', 'business'];

/** Hệ số scale Remotion (composition 360×640) theo độ phân giải tối đa của gói */
export const RESOLUTION_SCALE = { '720p': 2, '1080p': 3 };

/** Nhóm thời gian lưu video (ngày) — khớp các rule lifecycle `deliveries/{N}d/` trong storage-lifecycle.json */
export const RETENTION_BUCKETS_DAYS = [1, 7, 30];

export const SUBSCRIPTION_DAYS = { month: 30, year: 365 };

/** Trần độ dài video short của nền tảng (giây) — áp cho Admin và mọi đường tạo/xuất video */
export const MAX_SHORT_VIDEO_SEC = 90;

/** Cờ tính năng đang được thực thi (server hoặc client) — Admin chỉ bật/tắt các cờ này */
export const PLAN_FEATURES = [
  {
    key: 'removeWatermark',
    name: 'Không logo XD-Short',
    description: 'Máy chủ render bỏ logo XD-Short khỏi video xuất ra',
    category: 'export',
  },
  {
    key: 'batchExport',
    name: 'Xuất nhiều video cùng lúc',
    description: 'Mở tab xuất hàng loạt trong cửa sổ xuất video',
    category: 'export',
  },
  {
    key: 'sunoAiMusic',
    name: 'Nhạc nền Suno',
    description: 'Cho phép nhập bài hát Suno làm nhạc nền',
    category: 'audio',
  },
];

export const DEFAULT_PLANS = [
  {
    id: 'free',
    name: 'Miễn phí',
    slug: 'free',
    badgeText: '',
    description: 'Thử trước, chưa cần trả tiền',
    isActive: true,
    isFeatured: false,
    sortOrder: 1,
    supportText: 'FAQ và email',
    pricing: { monthlyPrice: 0, annualUnitPrice: 0, annualTotalPayable: 0, discountPercent: 0, currency: 'VND' },
    quotas: {
      monthlyVideoLimit: 5,
      dailyAiLimit: 5,
      maxResolution: '720p',
      maxFps: 30,
      maxVideoSec: 30,
      longVideoMaxSec: 30,
      longVideoCredits: 2,
      storageRetentionDays: 1,
      concurrentRenders: 1,
    },
    features: { removeWatermark: false, batchExport: false, sunoAiMusic: false },
    bulletFeatures: [
      { id: 'f1', text: '5 video mỗi tháng, mỗi video tới 30 giây', isEnabled: true },
      { id: 'f2', text: 'AI viết kịch bản, chọn bố cục và lồng giọng đọc tiếng Việt', isEnabled: true },
      { id: 'f3', text: 'Xuất 720p (có logo XD-Short)', isEnabled: true },
    ],
  },
  {
    id: 'creator',
    name: 'Creator',
    slug: 'creator',
    badgeText: 'Phổ biến nhất',
    description: 'Cho người đăng đều đặn mỗi tuần',
    isActive: true,
    isFeatured: true,
    sortOrder: 2,
    supportText: 'Zalo, giờ làm việc',
    pricing: { monthlyPrice: 149000, annualUnitPrice: 112000, annualTotalPayable: 1344000, discountPercent: 25, currency: 'VND' },
    quotas: {
      monthlyVideoLimit: 30,
      dailyAiLimit: 50,
      maxResolution: '1080p',
      maxFps: 30,
      maxVideoSec: 60,
      longVideoMaxSec: 60,
      longVideoCredits: 2,
      storageRetentionDays: 7,
      concurrentRenders: 2,
    },
    features: { removeWatermark: true, batchExport: true, sunoAiMusic: true },
    bulletFeatures: [
      { id: 'c1', text: '30 video mỗi tháng, mỗi video tới 60 giây', isEnabled: true },
      { id: 'c2', text: 'Xuất 1080p, không logo', isEnabled: true },
      { id: 'c3', text: 'Giọng đọc AI tự nhiên, nhiều cảm xúc', isEnabled: true },
      { id: 'c4', text: 'Nhạc nền Suno và kho hiệu ứng âm thanh', isEnabled: true },
      { id: 'c5', text: 'Xuất nhiều video cùng lúc', isEnabled: true },
    ],
  },
  {
    id: 'business',
    name: 'Business',
    slug: 'business',
    badgeText: '',
    description: 'Cho agency và đội nội dung',
    isActive: true,
    isFeatured: false,
    sortOrder: 3,
    supportText: 'Zalo ưu tiên 1:1, hoá đơn VAT',
    pricing: { monthlyPrice: 399000, annualUnitPrice: 299000, annualTotalPayable: 3588000, discountPercent: 25, currency: 'VND' },
    quotas: {
      monthlyVideoLimit: 100,
      dailyAiLimit: 300,
      maxResolution: '1080p',
      maxFps: 30,
      maxVideoSec: 60,
      longVideoMaxSec: 90,
      longVideoCredits: 2,
      storageRetentionDays: 30,
      concurrentRenders: 5,
    },
    features: { removeWatermark: true, batchExport: true, sunoAiMusic: true },
    bulletFeatures: [
      { id: 'b1', text: '100 video mỗi tháng, mỗi video tới 60 giây (video 61–90 giây tính 2 lượt)', isEnabled: true },
      { id: 'b2', text: 'Mọi tính năng của Creator', isEnabled: true },
      { id: 'b3', text: 'Lưu video 30 ngày để tải lại', isEnabled: true },
      { id: 'b4', text: 'Hỗ trợ ưu tiên 1:1 qua Zalo', isEnabled: true },
      { id: 'b5', text: 'Xuất hoá đơn VAT', isEnabled: true },
    ],
  },
];

/** Gói mua thêm: dùng sau khi hết hạn mức tháng, không hết hạn, mỗi video ≤ maxVideoSec */
export const TOPUP_PACKS = [
  { id: 'topup10', videos: 10, maxVideoSec: 60, price: 49000, label: 'Thêm 10 video' },
];

const MERGED_KEYS = ['pricing', 'quotas', 'features'];

/** Ghi đè Firestore lên mặc định theo TỪNG KHOÁ của pricing/quotas/features — trường mặc định mới không bị mất */
export function mergePlanWithDefault(def, override) {
  if (!override) return def;
  if (!def) return override;
  const merged = { ...def, ...override };
  for (const key of MERGED_KEYS) merged[key] = { ...(def[key] || {}), ...(override[key] || {}) };
  if (!Array.isArray(override.bulletFeatures)) merged.bulletFeatures = def.bulletFeatures;
  return merged;
}

/** Danh sách gói từ nguồn ngoài (Firestore / API / cache) → gộp với mặc định, giữ gói tuỳ biến của Admin, sắp xếp */
export function mergePlansWithDefaults(remotePlans) {
  const remote = Array.isArray(remotePlans) ? remotePlans.filter(p => p && p.id) : [];
  const defaultIds = new Set(DEFAULT_PLANS.map(d => d.id));
  const merged = DEFAULT_PLANS.map(def => mergePlanWithDefault(def, remote.find(r => r.id === def.id)));
  const extras = remote.filter(r => !defaultIds.has(r.id));
  return [...merged, ...extras].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}

export function findPlan(plans, tier) {
  const list = Array.isArray(plans) && plans.length ? plans : DEFAULT_PLANS;
  return list.find(p => p.id === tier || p.slug === tier) || DEFAULT_PLANS.find(p => p.id === tier) || null;
}

/** Độ dài tính lượt: làm tròn tới giây (60,4 giây vẫn là video 60 giây) */
export function roundVideoSec(videoSec) {
  return Math.max(0, Math.round(Number(videoSec) || 0));
}

/** Giới hạn độ dài cao nhất gói cho phép (kể cả mức tính nhiều lượt) */
export function maxAllowedVideoSec(plan) {
  const q = plan?.quotas || {};
  return Math.max(Number(q.maxVideoSec) || 0, Number(q.longVideoMaxSec) || 0);
}

/** Độ dài dài nhất người dùng xuất được: theo gói, hoặc theo gói mua thêm khi còn số dư (cùng luật decideRenderCharge) */
export function maxRenderableVideoSec(plan, bonusBalance = 0, topup = TOPUP_PACKS[0]) {
  const bonusMax = topup && Number(bonusBalance) >= 1 ? Number(topup.maxVideoSec) || 0 : 0;
  return Math.max(maxAllowedVideoSec(plan), bonusMax);
}

/** Số lượt một video tiêu tốn theo hạn mức tháng của gói; null = quá dài với gói */
export function videoCredits(plan, videoSec) {
  const q = plan?.quotas || {};
  const sec = roundVideoSec(videoSec);
  const maxSec = Number(q.maxVideoSec) || 0;
  if (sec <= maxSec) return 1;
  const longMax = Number(q.longVideoMaxSec) || maxSec;
  if (sec <= longMax) return Math.max(1, Number(q.longVideoCredits) || 2);
  return null;
}

/** Số tiền phải trả cho gói (planOrTier) theo chu kỳ 'month' | 'year' */
export function payableAmount(planOrTier, cycle = 'month', plans = DEFAULT_PLANS) {
  const plan = typeof planOrTier === 'string' ? findPlan(plans, planOrTier) : planOrTier;
  const p = plan?.pricing;
  if (!p) return 0;
  if (cycle === 'year') return Number(p.annualTotalPayable) || (Number(p.annualUnitPrice) || 0) * 12;
  return Number(p.monthlyPrice) || 0;
}

/** Số tháng được tặng khi trả năm (so với trả 12 tháng lẻ) — "Trả năm: tặng 3 tháng" */
export function annualFreeMonths(plan) {
  const monthly = payableAmount(plan, 'month');
  const annual = payableAmount(plan, 'year');
  if (!monthly || !annual || annual >= monthly * 12) return 0;
  return Math.round(12 - annual / monthly);
}

/** Hệ số scale render tối đa theo gói (720p → 2, 1080p → 3) */
export function resolutionScale(plan) {
  return RESOLUTION_SCALE[plan?.quotas?.maxResolution] || RESOLUTION_SCALE['720p'];
}

/** Số ngày lưu → nhóm lifecycle gần nhất (không thấp hơn số ngày gói hứa, trừ khi vượt nhóm lớn nhất) */
export function retentionBucketDays(days) {
  const d = Number(days) || 0;
  return RETENTION_BUCKETS_DAYS.find(b => b >= d) || RETENTION_BUCKETS_DAYS[RETENTION_BUCKETS_DAYS.length - 1];
}

// ── Nội dung chuyển khoản: "XDPRO CREATOR|BIZ|TOPUP <TAG>" ──

const MEMO_CODES = { creator: 'CREATOR', business: 'BIZ', topup: 'TOPUP' };

/** 6 ký tự cuối của UID (chữ/số, in hoa) — định danh người chuyển khoản */
export function uidTagOf(uid) {
  return String(uid || '').replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase();
}

export function buildTransferMemo(kind, uid) {
  const code = MEMO_CODES[kind];
  if (!code) throw new Error(`Unknown transfer kind: ${kind}`);
  return `XDPRO ${code} ${uidTagOf(uid) || 'GUEST'}`;
}

/** Tách loại thanh toán + tag từ nội dung ngân hàng gửi về (ngân hàng có thể chèn tiền tố / bỏ dấu cách) */
export function parseTransferMemo(text) {
  const s = String(text || '').toUpperCase();
  const m = s.match(/XD(?:PRO|S)?\s*(CREATOR|BUSINESS|BIZ|TOPUP)\s*([A-Z0-9]{6})/);
  if (!m) return null;
  const kind = m[1] === 'TOPUP' ? 'topup' : (m[1] === 'CREATOR' ? 'creator' : 'business');
  return { kind, tag: m[2] };
}

// ── Tính lượt render ──

/**
 * Quyết định trừ lượt cho một video:
 * 1. Hạn mức tháng nếu video nằm trong giới hạn độ dài của gói và còn đủ lượt (video dài tính longVideoCredits).
 * 2. Ngược lại dùng 1 lượt mua thêm nếu video ≤ topup.maxVideoSec và còn số dư.
 * Trả về { ok:true, source:'monthly'|'bonus', credits } hoặc { ok:false, code:'too_long'|'quota_exhausted', ... }.
 */
export function decideRenderCharge({ plan, videoSec, monthlyUsed = 0, bonusBalance = 0, topup = TOPUP_PACKS[0] }) {
  const sec = roundVideoSec(videoSec);
  const limit = Number(plan?.quotas?.monthlyVideoLimit ?? 0);
  const used = Math.max(0, Number(monthlyUsed) || 0);
  const bonus = Math.max(0, Number(bonusBalance) || 0);
  const credits = videoCredits(plan, sec);

  if (credits !== null && (limit === -1 || used + credits <= limit)) {
    return { ok: true, source: 'monthly', credits, videoSec: sec };
  }
  if (topup && sec <= topup.maxVideoSec && bonus >= 1) {
    return { ok: true, source: 'bonus', credits: 1, videoSec: sec };
  }
  if (credits === null) {
    return { ok: false, code: 'too_long', videoSec: sec, maxSec: maxAllowedVideoSec(plan) };
  }
  return {
    ok: false,
    code: 'quota_exhausted',
    videoSec: sec,
    credits,
    used,
    limit,
    remaining: Math.max(0, limit - used),
    bonusBalance: bonus,
  };
}

/** Áp / hoàn lượt trên trạng thái thuần { monthlyUsed, bonusBalance } — cùng phép tính với Firestore increment */
export function applyRenderCharge(state, charge) {
  const c = Number(charge?.credits) || 0;
  if (charge?.source === 'bonus') return { ...state, bonusBalance: state.bonusBalance - c };
  if (charge?.source === 'monthly') return { ...state, monthlyUsed: state.monthlyUsed + c };
  return { ...state };
}

export function refundRenderCharge(state, charge) {
  const c = Number(charge?.credits) || 0;
  if (charge?.source === 'bonus') return { ...state, bonusBalance: state.bonusBalance + c };
  if (charge?.source === 'monthly') return { ...state, monthlyUsed: Math.max(0, state.monthlyUsed - c) };
  return { ...state };
}
