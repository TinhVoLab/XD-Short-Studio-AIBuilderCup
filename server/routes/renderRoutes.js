import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { execFile } from 'child_process';
import util from 'util';
import { renderMedia, selectComposition, renderStill } from '@remotion/renderer';
import { 
  getOrBuildBundle, 
  clearBundleCache,
  renderJobs, 
  sseListeners, 
  notifyJobUpdate, 
  runBackgroundRenderJob,
  cleanupOldRenders,
  resolveMediaUrl,
  getSafeBrowserExecutable,
  renderSemaphore,
  cancelRenderJob,
  flushJobUpdate,
} from '../services/remotionService.js';
import { userVideoCandidatePaths } from '../services/cloudStorageService.js';
import { isQueueMode, saveRenderInput, loadRenderInput, deleteRenderInput, enqueueRenderTask } from '../services/renderQueue.js';
import { publicDir, projectsStorageDir } from '../config/paths.js';
import { verifyAuth, optionalAuth, adminDb, adminStorage } from '../middlewares/auth.js';
import { reserveRenderJob, recordJobEnd, getUserQuota } from '../middlewares/quota.js';
import { planService } from '../services/planService.js';
import { TOPUP_PACKS, resolutionScale, MAX_SHORT_VIDEO_SEC } from '../../src/config/planCatalog.js';
import { projectVideoSec } from '../../src/config/videoDuration.js';
import { lintScenesText, describeLintIssues } from '../../src/utils/sceneLint.js';

const execFilePromise = util.promisify(execFile);
const router = Router();

// Clear bundle cache endpoint
router.post('/bundle/clear', (req, res) => {
  clearBundleCache();
  res.json({ message: 'Bundle cache cleared successfully' });
});

// Query current user's render quota (lượt tháng + video mua thêm)
router.get('/quota', verifyAuth, async (req, res) => {
  const quota = await getUserQuota(req.user.uid, {
    isAdmin: Boolean(req.user?.admin),
    tier: req.user?.planTier || 'free',
    bonusVideos: req.user?.bonusVideos,
  });
  res.json(quota);
});

const TOPUP = TOPUP_PACKS[0];

/** Thông báo lỗi hạn mức (tiếng Việt) cho kết quả reserveRenderJob */
function quotaErrorResponse(result, plan) {
  if (result.code === 'concurrent') {
    return [429, {
      error: `Bạn đang có ${result.activeJobs} video đang xuất. Vui lòng đợi xong rồi xuất tiếp.`,
      code: 'quota/concurrent_render_in_progress',
      activeJobsCount: result.activeJobs,
      maxConcurrent: result.maxConcurrent,
    }];
  }
  if (result.code === 'too_long') {
    const longNote = plan.quotas.longVideoMaxSec > plan.quotas.maxVideoSec
      ? ` (video trên ${plan.quotas.maxVideoSec} giây tính ${plan.quotas.longVideoCredits} lượt)`
      : '';
    return [400, {
      error: `Video dài ${result.videoSec} giây — gói ${plan.name} cho phép tối đa ${result.maxSec} giây mỗi video${longNote}. Hãy rút gọn bớt cảnh hoặc nâng cấp gói.`,
      code: 'render/too_long',
      videoSec: result.videoSec,
      maxVideoSec: result.maxSec,
    }];
  }
  const twoCredits = result.credits > 1
    ? ` Video dài hơn ${plan.quotas.maxVideoSec} giây tính ${result.credits} lượt, bạn còn ${result.remaining} lượt.`
    : '';
  const topupHint = result.videoSec <= TOPUP.maxVideoSec
    ? `Mua "${TOPUP.label}" (${TOPUP.price.toLocaleString('vi-VN')} đ) hoặc nâng cấp gói để xuất tiếp.`
    : 'Nâng cấp gói hoặc rút gọn video để xuất tiếp.';
  return [429, {
    error: `Bạn đã dùng ${result.used}/${result.limit} lượt xuất video của gói ${plan.name} tháng này.${twoCredits} ${topupHint}`,
    code: 'quota/monthly_limit_exceeded',
    quota: { used: result.used, limit: result.limit, bonusVideos: result.bonusBalance },
  }];
}

// ── Background Render Endpoints ──

// 1. Start Background Render Job (Non-blocking)
// Thứ tự: tính độ dài thật → giữ lượt (transaction) → kẹp độ phân giải / fps theo gói → đẩy job.
router.post('/start', verifyAuth, async (req, res) => {
  const { scenes, audioClips } = req.body;
  if (!scenes || !scenes.length) {
    return res.status(400).json({ error: 'No scenes provided' });
  }

  // Lưới an toàn cuối (cả xuất lẻ lẫn hàng loạt): không render video còn chữ giữ chỗ của template / AI
  const lintIssues = lintScenesText(scenes);
  if (lintIssues.length) {
    return res.status(422).json({ error: describeLintIssues(lintIssues), code: 'render/placeholder_text', issues: lintIssues.slice(0, 20) });
  }

  const isAdmin = Boolean(req.user?.admin);
  const plan = isAdmin ? null : await planService.getPlanById(req.user?.planTier || 'free');
  if (!isAdmin && !plan) {
    return res.status(403).json({ error: 'Không xác định được gói cước của tài khoản.', code: 'plan/not_found' });
  }

  // Độ dài video thật (cảnh gối đầu khi chuyển cảnh, audio dài hơn cảnh) — cùng công thức với client
  const videoSec = projectVideoSec(scenes, audioClips);
  const maxVideoSec = Number(process.env.MAX_RENDER_VIDEO_SEC) || MAX_SHORT_VIDEO_SEC;
  if (isAdmin && videoSec > maxVideoSec) {
    return res.status(400).json({ error: `Video dài ${Math.round(videoSec)}s — tối đa ${maxVideoSec}s cho video short. Hãy rút gọn bớt cảnh.`, code: 'render/too_long' });
  }

  // Độ phân giải / fps theo gói (bỏ qua giá trị client gửi vượt gói)
  const requestedScale = Number(req.body.scale) || 3;
  const requestedFps = Number(req.body.targetFps) || 30;
  const scale = plan ? Math.min(requestedScale, resolutionScale(plan)) : requestedScale;
  const targetFps = plan ? Math.min(requestedFps, Number(plan.quotas.maxFps) || 30) : requestedFps;

  // Ước lượng thời gian render theo ngân sách (RENDER_BUDGET_SEC, mặc định 300s).
  // RENDER_EST_FPS = tốc độ render đo trên worker (npm run bench:render) — chưa đặt thì bỏ qua.
  const estFps = Number(process.env.RENDER_EST_FPS) || 0;
  const budgetSec = Number(process.env.RENDER_BUDGET_SEC) || 300;
  if (estFps > 0) {
    const estSec = (videoSec * targetFps) / estFps;
    if (estSec > budgetSec * 0.95) {
      return res.status(422).json({ error: `Ước tính cần ~${Math.round(estSec)}s để render (giới hạn ${budgetSec}s). Hãy rút ngắn video hoặc giảm số cảnh.`, code: 'render/over_budget', estSec: Math.round(estSec) });
    }
  }

  const uid = req.user.uid;
  const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const job = {
    id: jobId,
    userId: uid,
    userEmail: req.user.email,
    createdAt: Date.now(),
    startedAt: Date.now(),
    status: 'queued',
    stage: 'queued',
    progress: 0,
    scenesCount: scenes.length,
    videoSec: Math.round(videoSec * 10) / 10,
    scale,
    targetFps,
    totalFrames: 0,
    renderedFrames: 0,
    renderFps: 0,
    etaSec: null,
  };
  const payload = { ...req.body, scale, targetFps };
  const queueMode = isQueueMode();

  let reservation;
  try {
    reservation = await reserveRenderJob({ uid, jobId, plan, videoSec, jobDoc: queueMode ? job : null });
  } catch (err) {
    console.error(`[Render Quota] Không giữ được lượt cho job ${jobId}:`, err.message);
    return res.status(503).json({ error: 'Không kiểm tra được hạn mức xuất video, vui lòng thử lại sau ít phút' });
  }
  if (!reservation.ok) {
    const [status, body] = quotaErrorResponse(reservation, plan);
    return res.status(status).json(body);
  }
  job.charge = reservation.charge;

  // Cloud: job ở Firestore + payload trên Storage → Cloud Tasks gọi Render Worker (render trong request)
  if (queueMode) {
    try {
      await saveRenderInput(jobId, payload, { uid, email: req.user.email, admin: isAdmin });
      await enqueueRenderTask(jobId);
    } catch (err) {
      console.error(`[Render Queue] Không đẩy được job ${jobId}:`, err.message);
      await adminDb.collection('render_jobs').doc(jobId).set({ status: 'failed', stage: 'failed', error: 'Hệ thống render đang bận, vui lòng thử lại sau ít phút' }, { merge: true }).catch(() => {});
      await recordJobEnd(uid, jobId, { refund: true, charge: job.charge });
      return res.status(503).json({ error: 'Hệ thống render đang bận, vui lòng thử lại sau ít phút', jobId });
    }
    return res.json({ jobId, status: 'queued', charge: job.charge, message: 'Render job queued successfully' });
  }

  renderJobs.set(jobId, job);
  if (adminDb) {
    adminDb.collection('render_jobs').doc(jobId).set(job).catch(() => {});
  }

  // runBackgroundRenderJob tự gỡ job / hoàn lượt khi kết thúc (safeCleanup)
  runBackgroundRenderJob(jobId, payload, req.user).catch(err => {
    console.error(`[Background Worker Error for ${jobId}]:`, err);
  });

  res.json({ jobId, status: 'queued', charge: job.charge, message: 'Render job queued successfully' });
});

// 2. Query Render Job Status
router.get('/status/:jobId', async (req, res) => {
  let job = renderJobs.get(req.params.jobId);
  if (!job && adminDb) {
    try {
      const snap = await adminDb.collection('render_jobs').doc(req.params.jobId).get();
      if (snap.exists) {
        job = snap.data();
      }
    } catch (e) {}
  }
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  res.json(job);
});

// 3. SSE Realtime Stream Endpoint
router.get('/stream/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = renderJobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  // Send current state immediately
  res.write(`data: ${JSON.stringify(job)}\n\n`);

  if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
    return res.end();
  }

  if (!sseListeners.has(jobId)) {
    sseListeners.set(jobId, new Set());
  }
  sseListeners.get(jobId).add(res);

  req.on('close', () => {
    const listeners = sseListeners.get(jobId);
    if (listeners) {
      listeners.delete(res);
      if (listeners.size === 0) sseListeners.delete(jobId);
    }
  });
});

// 4. Cancel Render Job
router.post('/cancel/:jobId', async (req, res) => {
  const { jobId } = req.params;
  const job = renderJobs.get(jobId);

  // Job chạy ở instance khác (Render Worker): đặt cờ trên Firestore, worker đọc cờ và huỷ renderMedia
  if (!job) {
    if (!adminDb) return res.status(404).json({ error: 'Job not found' });
    const ref = adminDb.collection('render_jobs').doc(jobId);
    const snap = await ref.get().catch(() => null);
    if (!snap?.exists) return res.status(404).json({ error: 'Job not found' });
    const data = snap.data();
    if (data.status === 'queued') {
      // Chưa worker nào nhận: đóng job ngay (worker sẽ bỏ qua task) và hoàn lượt render
      await ref.set({ cancelRequested: true, status: 'cancelled', stage: 'cancelled', error: 'Render job cancelled by user' }, { merge: true });
      if (data.userId) await recordJobEnd(data.userId, jobId, { refund: true, charge: data.charge });
    } else {
      await ref.set({ cancelRequested: true }, { merge: true });
    }
    return res.json({ message: 'Render job cancel requested' });
  }

  // Cancel waiting in semaphore FIFO queue if not yet started rendering
  renderSemaphore.cancelWaiting(jobId);
  cancelRenderJob(jobId);

  job.error = 'Render job cancelled by user';
  if (job.userId) {
    recordJobEnd(job.userId, jobId, { charge: job.charge });
  }
  notifyJobUpdate(jobId);
  res.json({ message: 'Render job cancelled' });
});

// 4a. Render Worker (Cloud Run riêng): Cloud Tasks gọi, render NGAY TRONG request rồi mới trả lời —
// CPU được cấp suốt quá trình (tính tiền theo request, 0 instance khi rảnh). Task trùng / gửi lại bị bỏ qua
// nhờ claim job trong transaction; job "mồ côi" (instance chết giữa chừng) được nhận lại sau STALE_MS.
if (process.env.RENDER_WORKER === '1') {
  const STALE_MS = ((Number(process.env.RENDER_BUDGET_SEC) || 300) + 60) * 1000;
  const RUNNING = new Set(['starting', 'bundling', 'preloading', 'rendering', 'encoding', 'uploading']);

  router.post('/internal/run', async (req, res) => {
    const { jobId } = req.body || {};
    if (!jobId || !adminDb) return res.status(400).json({ error: 'jobId required' });
    const ref = adminDb.collection('render_jobs').doc(jobId);

    const claimed = await adminDb.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists) return null;
      const j = snap.data();
      const orphaned = RUNNING.has(j.status) && Date.now() - (j.workerStartedAt || 0) > STALE_MS;
      if (j.cancelRequested || (j.status !== 'queued' && !orphaned)) return null;
      tx.update(ref, { status: 'starting', stage: 'starting', workerStartedAt: Date.now() });
      return j;
    });
    if (!claimed) return res.json({ skipped: true });

    let input;
    try {
      input = await loadRenderInput(jobId);
    } catch (err) {
      await ref.set({ status: 'failed', stage: 'failed', error: 'Không đọc được dữ liệu project để render' }, { merge: true });
      return res.json({ status: 'failed' });
    }

    renderJobs.set(jobId, { ...claimed, status: 'starting', stage: 'starting' });
    const cancelPoll = setInterval(async () => {
      const snap = await ref.get().catch(() => null);
      if (snap?.data()?.cancelRequested) cancelRenderJob(jobId);
    }, 3000);
    try {
      await runBackgroundRenderJob(jobId, input.payload, input.user, { worker: true });
    } finally {
      clearInterval(cancelPoll);
    }

    const finalStatus = renderJobs.get(jobId)?.status;
    await flushJobUpdate(jobId);
    await deleteRenderInput(jobId);
    renderJobs.delete(jobId);
    // Luôn 200: lỗi render là lỗi xác định (quá ngân sách, dữ liệu hỏng) — thử lại không giúp gì.
    // Instance chết giữa chừng → Cloud Tasks không nhận được 200 → tự gửi lại → job mồ côi được nhận lại.
    res.json({ status: finalStatus });
  });
}

// 4b. Server-Wide Render Queue Metrics Endpoint
router.get('/queue-info', optionalAuth, (req, res) => {
  res.json(renderSemaphore.getInfo());
});

// 5. Force 1-Click Direct Download Endpoint (Sets attachment header or 302 Redirects to Cloud CDN)
router.get('/download/:filename', optionalAuth, async (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(publicDir, filename);

  // ── Tier 1: Local disk check (fastest on localhost / local standalone) ──
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'video/mp4');
    return res.download(filePath, filename, (err) => {
      if (err && !res.headersSent) {
        res.status(500).json({ error: 'Download failed' });
      }
    });
  }

  // ── Tier 2: Firestore render_jobs lookup for Direct CDN 302 Redirect ──
  if (adminDb) {
    try {
      const snap = await adminDb.collection('render_jobs')
        .where('outputFilename', '==', filename)
        .limit(1)
        .get();

      if (!snap.empty) {
        const job = snap.docs[0].data();
        if (job.downloadUrl && job.downloadUrl.startsWith('http')) {
          console.log(`[Download Route] 🚀 Redirecting 302 to Cloud CDN: ${filename} -> ${job.downloadUrl}`);
          return res.redirect(302, job.downloadUrl);
        }
      }
    } catch (dbErr) {
      console.warn('[Download Route] Firestore job lookup note:', dbErr.message);
    }
  }

  // ── Tier 3: Cloud Storage Bucket Search (covers users, public, and root prefixes) ──
  if (adminStorage) {
    try {
      const bucket = adminStorage.bucket();
      const candidatePaths = [
        `renders/public/${filename}`,
        filename
      ];

      // If authenticated or known UID, prioritize user folders (deliveries/{N}d/ + legacy renders/users/)
      if (req.user?.uid) {
        candidatePaths.unshift(...userVideoCandidatePaths(req.user.uid, filename));
      }

      // Check specific candidate paths first
      for (const dest of candidatePaths) {
        const file = bucket.file(dest);
        const [exists] = await file.exists();
        if (exists) {
          const [metadata] = await file.getMetadata().catch(() => [{}]);
          const token = metadata?.metadata?.firebaseStorageDownloadTokens;
          if (token) {
            const cdnUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(dest)}?alt=media&token=${token}`;
            return res.redirect(302, cdnUrl);
          }
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          res.setHeader('Content-Type', 'video/mp4');
          return file.createReadStream().pipe(res);
        }
      }

      // Wildcard scan: search across renders/ to locate file even under different user UIDs
      const [files] = await bucket.getFiles({ prefix: 'renders/', maxResults: 150 });
      const matched = files.find(f => f.name.endsWith('/' + filename) || f.name === filename);
      if (matched) {
        const [metadata] = await matched.getMetadata().catch(() => [{}]);
        const token = metadata?.metadata?.firebaseStorageDownloadTokens;
        if (token) {
          const cdnUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(matched.name)}?alt=media&token=${token}`;
          return res.redirect(302, cdnUrl);
        }
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'video/mp4');
        return matched.createReadStream().pipe(res);
      }
    } catch (storageErr) {
      console.warn('[Download Route] Storage fallback check failed:', storageErr.message);
    }
  }

  res.status(404).json({ error: 'File not found' });
});

function normalizeTimestamp(ts) {
  if (!ts) return Date.now();
  if (typeof ts === 'number') return ts;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (ts._seconds != null) return ts._seconds * 1000 + Math.round((ts._nanoseconds || 0) / 1e6);
  if (ts.seconds != null) return ts.seconds * 1000 + Math.round((ts.nanoseconds || 0) / 1e6);
  const parsed = new Date(ts).getTime();
  return isNaN(parsed) ? Date.now() : parsed;
}

// 6. Get Render History (Cloud Firestore Aware & Fallback to Local)
router.get('/history', optionalAuth, async (req, res) => {
  try {
    const historyItems = [];

    // If Firestore is connected, fetch recent completed jobs for this user
    if (adminDb) {
      try {
        if (req.user?.uid) {
          let query = adminDb.collection('render_jobs').where('userId', '==', req.user.uid);
          const snap = await query.limit(40).get();
          const docs = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            // Bỏ video đã quá hạn lưu của gói (file đã bị lifecycle bucket xoá)
            .filter(d => d.status === 'completed' && d.outputFilename && !(d.deliveryExpiresAt && d.deliveryExpiresAt < Date.now()))
            .sort((a, b) => normalizeTimestamp(b.createdAt) - normalizeTimestamp(a.createdAt))
            .slice(0, 15);

          for (const data of docs) {
            historyItems.push({
              id: data.id,
              filename: data.outputFilename,
              url: data.downloadUrl || `/api/render/download/${data.outputFilename}`,
              downloadUrl: data.downloadUrl || `/api/render/download/${data.outputFilename}`,
              fileSize: data.fileSize || 0,
              createdAt: normalizeTimestamp(data.createdAt),
              expiresAt: data.deliveryExpiresAt || null,
            });
          }
        } else if (process.env.NODE_ENV !== 'production' && !adminStorage) {
          // In local dev without cloud, allow querying unassigned completed jobs
          const snap = await adminDb.collection('render_jobs').where('status', '==', 'completed').limit(15).get();
          const docs = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(d => d.outputFilename)
            .sort((a, b) => normalizeTimestamp(b.createdAt) - normalizeTimestamp(a.createdAt))
            .slice(0, 10);

          for (const data of docs) {
            historyItems.push({
              id: data.id,
              filename: data.outputFilename,
              url: data.downloadUrl || `/api/render/download/${data.outputFilename}`,
              downloadUrl: data.downloadUrl || `/api/render/download/${data.outputFilename}`,
              fileSize: data.fileSize || 0,
              createdAt: normalizeTimestamp(data.createdAt),
            });
          }
        }
      } catch (dbErr) {
        console.warn('[History Route] Firestore history query note:', dbErr.message);
      }
    }

    // Fallback to local disk files if historyItems is empty (Local dev fallback)
    if (historyItems.length === 0 && fs.existsSync(publicDir) && (!adminStorage || process.env.NODE_ENV !== 'production')) {
      cleanupOldRenders(6);
      const files = fs.readdirSync(publicDir);
      const videoFiles = files
        .filter(f => f.endsWith('.mp4') && !f.startsWith('.'))
        .map(f => {
          const fullPath = path.join(publicDir, f);
          const stat = fs.statSync(fullPath);
          return {
            id: f,
            filename: f,
            url: `/api/render/download/${f}`,
            downloadUrl: `/api/render/download/${f}`,
            fileSize: stat.size,
            createdAt: stat.mtimeMs,
          };
        })
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 10);

      return res.json(videoFiles);
    }

    res.json(historyItems.slice(0, 15));
  } catch (err) {
    console.error('Error fetching render history:', err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// 7. Delete a Rendered Video File from History (Storage, Firestore & Local Disk)
router.delete('/history/:filename', optionalAuth, async (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    // Security check: only allow deleting mp4 export files
    if (!filename.endsWith('.mp4')) {
      return res.status(400).json({ error: 'Invalid file type' });
    }

    let deleted = false;

    // 1. Delete from Cloud Storage
    if (adminStorage) {
      try {
        const bucket = adminStorage.bucket();
        const candidatePaths = [
          `renders/public/${filename}`,
          filename
        ];
        if (req.user?.uid) {
          candidatePaths.unshift(...userVideoCandidatePaths(req.user.uid, filename));
        }

        for (const dest of candidatePaths) {
          try {
            const file = bucket.file(dest);
            const [exists] = await file.exists();
            if (exists) {
              await file.delete();
              deleted = true;
            }
          } catch (fileErr) {
            console.warn(`[History Delete] File delete error for ${dest}:`, fileErr.message);
          }
        }

        // Wildcard scan if not deleted yet
        if (!deleted) {
          const [files] = await bucket.getFiles({ prefix: 'renders/', maxResults: 150 });
          const matched = files.find(f => {
            if (f.name.endsWith('/' + filename) || f.name === filename) {
              if (req.user?.uid && !req.user?.admin) {
                return f.name.startsWith(`renders/users/${req.user.uid}/`);
              }
              return true;
            }
            return false;
          });
          if (matched) {
            await matched.delete().catch(() => {});
            deleted = true;
          }
        }
      } catch (storageErr) {
        console.warn('[History Delete] Cloud Storage deletion note:', storageErr.message);
      }
    }

    // 2. Delete / remove from Firestore render_jobs
    if (adminDb) {
      try {
        let query = adminDb.collection('render_jobs').where('outputFilename', '==', filename);
        if (req.user?.uid && !req.user?.admin) {
          query = query.where('userId', '==', req.user.uid);
        }
        const snap = await query.get();
        if (!snap.empty) {
          const batch = adminDb.batch();
          snap.docs.forEach(doc => {
            batch.delete(doc.ref);
          });
          await batch.commit();
          deleted = true;
        }
      } catch (dbErr) {
        console.warn('[History Delete] Firestore record delete note:', dbErr.message);
      }
    }

    // 3. Delete from local disk if present
    const filePath = path.join(publicDir, filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        deleted = true;
      } catch (fsErr) {
        console.warn('[History Delete] Local disk unlink error:', fsErr.message);
      }
    }

    if (deleted) {
      return res.json({ message: 'File deleted successfully', filename });
    } else {
      return res.status(404).json({ error: 'File not found or already deleted' });
    }
  } catch (err) {
    console.error('Error deleting render history file:', err);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// 8. Bundle multiple exported MP4s into a single ZIP file (< 100ms)
router.post('/batch/zip', async (req, res) => {
  try {
    const { filenames = [], zipTitle = 'xd-short-batch-export' } = req.body;
    if (!Array.isArray(filenames) || filenames.length === 0) {
      return res.status(400).json({ error: 'Danh sách file không hợp lệ' });
    }

    const validFiles = filenames
      .map(f => path.join(publicDir, path.basename(f)))
      .filter(f => fs.existsSync(f) && f.endsWith('.mp4'));

    if (validFiles.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy file MP4 hợp lệ nào để đóng gói ZIP' });
    }

    const cleanTitle = (zipTitle || 'batch-export')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 40);

    const zipFilename = `${cleanTitle}-${Date.now().toString().slice(-5)}.zip`;
    const zipLocation = path.join(publicDir, zipFilename);

    // Use native zip on macOS/Linux with -j (junk paths) and -0 (store only, fastest speed, no re-compress)
    try {
      await execFilePromise('zip', ['-j', '-0', zipLocation, ...validFiles]);
    } catch (zipErr) {
      console.error('[Batch Zip Error]:', zipErr);
      return res.status(500).json({ error: 'Lỗi nén file ZIP: ' + zipErr.message });
    }

    const stat = fs.statSync(zipLocation);
    res.json({
      downloadUrl: `/api/render/download/${zipFilename}`,
      filename: zipFilename,
      fileSize: stat.size,
      fileCount: validFiles.length
    });
  } catch (err) {
    console.error('[Batch Zip Route Error]:', err);
    res.status(500).json({ error: 'Không thể tạo file ZIP' });
  }
});

// 9. Legacy Synchronous Render Endpoint — chỉ Admin (không qua hạn mức gói; client dùng /start)
router.post('/', verifyAuth, async (req, res) => {
  if (!req.user?.admin) {
    return res.status(403).json({ error: 'Chỉ quản trị viên được dùng endpoint render đồng bộ. Vui lòng dùng /api/render/start.' });
  }
  try {
    const { scenes, bgMusicUrl, bgMusicVolume, audioClips, durationInFrames, scale = 3, targetFps = 30 } = req.body;
    if (!scenes || !scenes.length) {
      return res.status(400).send('No scenes provided');
    }

    const bundled = await getOrBuildBundle();

    const browserExecutable = await getSafeBrowserExecutable();
    const containerChromiumOptions = {
      enableMultiProcessOnLinux: true,
      gl: null,
      headless: true,
    };

    const composition = await selectComposition({
      serveUrl: bundled,
      id: 'MotionStudio',
      inputProps: { scenes, bgMusicUrl, bgMusicVolume, audioClips, durationInFrames },
      browserExecutable,
      chromiumOptions: containerChromiumOptions,
    });

    const renderScale = Number(scale) || 3;
    const outputLocation = path.join(publicDir, `export-${Date.now()}.mp4`);
    // Tăng giới hạn luồng render: dùng tối đa 8 core (chừa 1 core hệ thống)
    const concurrency = Math.max(1, Math.min(os.cpus().length - 1, 8));

    console.log(`Rendering media (${composition.width * renderScale}x${composition.height * renderScale}, scale: ${renderScale}x, concurrency: ${concurrency}) to ${outputLocation}...`);

    await renderMedia({
      composition,
      serveUrl: bundled,
      codec: 'h264',
      audioCodec: 'aac',
      imageFormat: 'jpeg',
      jpegQuality: 90,
      pixelFormat: 'yuv420p',
      crf: 19,
      outputLocation,
      scale: renderScale,
      inputProps: { scenes, bgMusicUrl, bgMusicVolume, audioClips, durationInFrames },
      concurrency,
      browserExecutable,
      chromiumOptions: containerChromiumOptions,
      onProgress: ({ progress }) => {
        process.stdout.write(`Rendering: ${Math.round(progress * 100)}%\r`);
      },
    });

    console.log('\nRender complete! Sending file...');
    res.download(outputLocation);
  } catch (err) {
    console.error('Error during render:', err);
    res.status(500).send(err.message);
  }
});


// 10. Instant 1-Click Thumbnail Generator (1080x1920 Full HD JPEG in ~0.4s)
router.post('/thumbnail', async (req, res) => {
  try {
    const { scenes, frame = 15, scale = 3, folderName } = req.body;
    if (!scenes || !scenes.length) {
      return res.status(400).json({ error: 'Chưa có cảnh nào để chụp ảnh bìa' });
    }

    const browserExecutable = await getSafeBrowserExecutable();
    const containerChromiumOptions = {
      enableMultiProcessOnLinux: true,
      gl: null,
      headless: true,
    };

    const resolvedScenes = scenes.map(scene => {
      const vUrl = scene.voiceoverUrl;
      return {
        ...scene,
        voiceoverUrl: vUrl ? resolveMediaUrl(vUrl) : undefined,
        soundEffects: scene.soundEffects?.map(s => ({
          ...s,
          url: s.url ? resolveMediaUrl(s.url) : s.url,
        })),
        elements: scene.elements?.map(el => {
          if (el.src) return { ...el, src: resolveMediaUrl(el.src) };
          return el;
        }),
      };
    });

    const durationInFrames = Math.max(30, Math.round(
      resolvedScenes.reduce((acc, sc) => acc + (sc.durationSec || 3), 0) * 30
    ));

    const bundled = await getOrBuildBundle();
    const inputProps = {
      scenes: resolvedScenes,
      durationInFrames,
      audioClips: []
    };

    const composition = await selectComposition({
      serveUrl: bundled,
      id: 'MotionStudio',
      inputProps,
      browserExecutable,
      chromiumOptions: containerChromiumOptions,
    });

    const cleanName = (folderName || 'cover').toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const thumbFilename = `thumb-${cleanName}-${Date.now().toString().slice(-5)}.jpg`;
    const thumbPath = path.join(publicDir, thumbFilename);

    await renderStill({
      composition,
      serveUrl: bundled,
      output: thumbPath,
      inputProps,
      frame: Math.min(Math.max(0, Number(frame) || 15), durationInFrames - 1),
      imageFormat: 'jpeg',
      jpegQuality: 95,
      scale: Number(scale) || 3,
      browserExecutable,
      chromiumOptions: containerChromiumOptions,
    });

    // Also copy to project folder if folderName provided
    if (folderName && fs.existsSync(projectsStorageDir)) {
      const projFolder = path.join(projectsStorageDir, path.basename(folderName));
      if (fs.existsSync(projFolder)) {
        try {
          fs.copyFileSync(thumbPath, path.join(projFolder, 'thumbnail.jpg'));
        } catch (copyErr) {
          console.warn('Failed to copy thumbnail to project folder:', copyErr);
        }
      }
    }

    res.json({
      success: true,
      downloadUrl: `/api/render/download/${thumbFilename}`,
      filename: thumbFilename
    });
  } catch (err) {
    console.error('[Thumbnail Render Error]:', err);
    res.status(500).json({ error: 'Lỗi xuất ảnh bìa: ' + err.message });
  }
});

export default router;
