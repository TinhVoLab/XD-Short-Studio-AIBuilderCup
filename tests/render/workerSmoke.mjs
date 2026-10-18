/**
 * Kiểm thử Render Worker trên Cloud Run TRỰC TIẾP (không qua API): tạo job thử trong Firestore + payload trên Storage
 * bằng token gcloud của người chạy, gọi /api/render/internal/run bằng identity token, đo thời gian render thật.
 *
 * Chạy (sau `gcloud auth login`, tài khoản có quyền project):
 *   node tests/render/workerSmoke.mjs                 # video 15/30/60s lần lượt
 *   DURATIONS=30 node tests/render/workerSmoke.mjs
 *   MODE=duplicate DURATIONS=15 …                     # gửi cùng job 2 lần song song → chỉ 1 lần render
 *   MODE=cancel DURATIONS=60 …                        # huỷ sau 20s → job 'cancelled', worker dừng
 */
import { execSync } from 'child_process';
import { buildBenchmarkScenes } from './benchmarkProject.mjs';

const PROJECT = process.env.PROJECT || 'xd-short';
const REGION = process.env.REGION || 'asia-southeast1';
const BUCKET = process.env.BUCKET || `${PROJECT}.firebasestorage.app`;
const MODE = process.env.MODE || 'render';
const DURATIONS = (process.env.DURATIONS || '15,30,60').split(',').map(Number);

const sh = cmd => execSync(cmd, { encoding: 'utf8' }).trim();
const accessToken = sh('gcloud auth print-access-token');
const idToken = sh('gcloud auth print-identity-token');
const workerUrl = process.env.WORKER_URL || sh(`gcloud run services describe render-worker --region ${REGION} --format='value(status.url)'`);
const docUrl = id => `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/render_jobs/${id}`;

/** Giá trị JS → kiểu Firestore REST */
function fsValue(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'string') return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(fsValue) } };
  return { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fsValue(x)])) } };
}
function fromFs(f) {
  if (!f) return undefined;
  if ('stringValue' in f) return f.stringValue;
  if ('integerValue' in f) return Number(f.integerValue);
  if ('doubleValue' in f) return f.doubleValue;
  if ('booleanValue' in f) return f.booleanValue;
  if ('mapValue' in f) return Object.fromEntries(Object.entries(f.mapValue.fields || {}).map(([k, x]) => [k, fromFs(x)]));
  if ('arrayValue' in f) return (f.arrayValue.values || []).map(fromFs);
  return null;
}
const authJson = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
async function setJob(id, data) {
  const res = await fetch(docUrl(id), { method: 'PATCH', headers: authJson, body: JSON.stringify({ fields: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, fsValue(v)])) }) });
  if (!res.ok) throw new Error(`Firestore ${res.status}: ${await res.text()}`);
}
async function getJob(id) {
  const res = await fetch(docUrl(id), { headers: authJson });
  return res.ok ? fromFs({ mapValue: { fields: (await res.json()).fields } }) : null;
}
async function putInput(id, payload) {
  const name = encodeURIComponent(`render-inputs/${id}.json`);
  const res = await fetch(`https://storage.googleapis.com/upload/storage/v1/b/${BUCKET}/o?uploadType=media&name=${name}`, {
    method: 'POST', headers: authJson, body: JSON.stringify({ payload, user: { uid: 'smoke-test', email: 'smoke@test', admin: false } }),
  });
  if (!res.ok) throw new Error(`Storage ${res.status}: ${await res.text()}`);
}
const callWorker = id => fetch(`${workerUrl}/api/render/internal/run`, {
  method: 'POST', headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId: id }),
}).then(async r => ({ status: r.status, body: await r.json().catch(() => ({})) }));

console.log(`Worker: ${workerUrl}  mode=${MODE}\n`);
for (const sec of DURATIONS) {
  const id = `smoke_${MODE}_${sec}s_${Date.now()}`;
  const scenes = buildBenchmarkScenes(sec);
  await setJob(id, { id, userId: 'smoke-test', status: 'queued', stage: 'queued', progress: 0, createdAt: Date.now(), scenesCount: scenes.length });
  await putInput(id, { scenes, audioClips: [], scale: 3, targetFps: 30, filename: id, showWatermark: false });

  const t0 = Date.now();
  let calls;
  if (MODE === 'duplicate') {
    calls = await Promise.all([callWorker(id), callWorker(id)]);
  } else if (MODE === 'cancel') {
    const run = callWorker(id);
    await new Promise(r => setTimeout(r, 20_000));
    await setJob(id, { cancelRequested: true });
    calls = [await run];
  } else {
    calls = [await callWorker(id)];
  }
  const wallSec = Math.round((Date.now() - t0) / 100) / 10;
  const job = await getJob(id);
  console.log(`${String(sec).padStart(3)}s  HTTP ${calls.map(c => `${c.status}:${c.body.status || (c.body.skipped ? 'skipped' : c.body.error)}`).join(' ')}  ` +
    `wall ${wallSec}s  job=${job?.status}  render=${job?.renderTimeSec ?? '-'}s  fps=${job?.renderFps ?? '-'}  ` +
    `size=${job?.fileSize ? (job.fileSize / 2 ** 20).toFixed(1) + 'MB' : '-'}${job?.error ? `  error=${job.error}` : ''}`);
}
