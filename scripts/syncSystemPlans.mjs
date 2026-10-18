// Ghi lại Firestore system_plans/{free,creator,business} từ SSOT src/config/planCatalog.js (DEFAULT_PLANS).
// Bản cũ trong system_plans ghi đè giá / quyền lợi mặc định, nên sau khi đổi bảng giá cần chạy script này.
//
//   node scripts/syncSystemPlans.mjs --dry-run   # chỉ in khác biệt, không ghi
//   node scripts/syncSystemPlans.mjs             # ghi đè 3 gói mặc định (gói tuỳ biến khác của Admin giữ nguyên)
//
// Cần quyền Firestore: `gcloud auth application-default login` hoặc GOOGLE_APPLICATION_CREDENTIALS.
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { DEFAULT_PLANS } from '../src/config/planCatalog.js';

const dryRun = process.argv.includes('--dry-run');
const projectId = process.env.GCLOUD_PROJECT || 'xd-short';
initializeApp({ credential: applicationDefault(), projectId });
const db = getFirestore();

const IGNORED = new Set(['updatedAt', 'updatedBy']);

/** Danh sách khác biệt dạng "đường.dẫn: cũ → mới" (so sánh sâu, mảng so theo JSON) */
function diff(before, after, prefix = '') {
  const out = [];
  const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  for (const key of [...keys].sort()) {
    if (!prefix && IGNORED.has(key)) continue;
    const a = before?.[key];
    const b = after?.[key];
    const path = prefix ? `${prefix}.${key}` : key;
    const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
    if (isObj(a) && isObj(b)) out.push(...diff(a, b, path));
    else if (JSON.stringify(a) !== JSON.stringify(b)) {
      out.push(`  ${path}: ${a === undefined ? '(không có)' : JSON.stringify(a)} → ${b === undefined ? '(xoá)' : JSON.stringify(b)}`);
    }
  }
  return out;
}

const snap = await db.collection('system_plans').get();
const current = new Map(snap.docs.map(d => [d.id, d.data()]));
let changed = 0;

for (const plan of DEFAULT_PLANS) {
  const lines = current.has(plan.id) ? diff(current.get(plan.id), plan) : ['  (chưa có document — sẽ tạo mới)'];
  if (!lines.length) {
    console.log(`= system_plans/${plan.id}: đã khớp`);
    continue;
  }
  changed++;
  console.log(`~ system_plans/${plan.id}:\n${lines.join('\n')}`);
  if (!dryRun) {
    await db.collection('system_plans').doc(plan.id).set({
      ...plan,
      updatedAt: new Date().toISOString(),
      updatedBy: 'scripts/syncSystemPlans.mjs',
    });
  }
}

const extras = [...current.keys()].filter(id => !DEFAULT_PLANS.some(p => p.id === id));
if (extras.length) console.log(`(Giữ nguyên gói tuỳ biến: ${extras.join(', ')})`);
console.log(dryRun
  ? `\nDry run: ${changed} gói sẽ được ghi đè. Chạy lại không có --dry-run để ghi.`
  : `\nĐã ghi ${changed} gói. API áp dụng sau tối đa 5 phút (cache RAM của planService trên mỗi instance).`);
