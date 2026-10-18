import path from 'path';
import fs from 'fs';
import os from 'os';
import { performance } from 'perf_hooks';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition, ensureBrowser, openBrowser, makeCancelSignal } from '@remotion/renderer';
import { publicDir, rootDir, storageDir, uploadsDir } from '../config/paths.js';
import { injectMp4Metadata } from './metadataService.js';
import { applyReverbToAudio } from './audioMixService.js';
import { adminDb, checkIsAdmin } from '../middlewares/auth.js';
import { uploadRenderedVideoAndCleanup } from './cloudStorageService.js';
import { planService } from './planService.js';
import { preloadJobAssets, cleanupJobAssets } from './assetPreloadService.js';
import { AppError } from '../utils/AppError.js';
import { normalizeError, safeCleanup } from './errorRegistryService.js';
import { renderSemaphore } from './renderSemaphore.js';

export function translateRenderError(err) {
  const appErr = normalizeError(err, 'render');
  return appErr.actionHint 
    ? `${appErr.userMessage} (${appErr.actionHint})`
    : appErr.userMessage;
}

// ── Persistent Warm Browser Pool (Eliminate 1.5s - 2.0s Cold Start per Job) ──
let warmBrowserInstance = null;
let warmBrowserPromise = null;
let browserJobsProcessed = 0;
let activeBrowserJobs = 0;
let isBrowserDraining = false;
let browserCreatedAt = 0;

export async function getOrCreateWarmBrowser(options = {}) {
  const { browserExecutable, chromiumOptions } = options;
  const MAX_JOBS = 4;
  const MAX_AGE_MS = 45 * 60 * 1000;

  // Check if current instance should drain
  if (warmBrowserInstance && !isBrowserDraining) {
    const age = Date.now() - browserCreatedAt;
    if (browserJobsProcessed >= MAX_JOBS || age > MAX_AGE_MS) {
      console.log(`[Remotion Pool] ♻️ Browser reached limit (Jobs: ${browserJobsProcessed}, Age: ${Math.round(age/60000)}m). Draining...`);
      isBrowserDraining = true;
    }
  }

  // If draining and no active jobs, we can close it to make way for a fresh one
  if (isBrowserDraining && activeBrowserJobs === 0 && warmBrowserInstance) {
    console.log('[Remotion Pool] 🧹 Draining browser has 0 active jobs. Closing it...');
    await closeWarmBrowser();
  }

  if (warmBrowserInstance && !isBrowserDraining) {
    try {
      const isClosed = typeof warmBrowserInstance.isClosed === 'function' 
        ? warmBrowserInstance.isClosed() 
        : false;
      if (!isClosed) {
        return warmBrowserInstance;
      }
    } catch (_) {
      warmBrowserInstance = null;
    }
  }

  if (warmBrowserPromise) {
    return warmBrowserPromise;
  }

  warmBrowserPromise = (async () => {
    try {
      console.log('[Remotion Pool] ⚡ Initializing persistent warm Chromium instance...');
      const { openBrowser } = await import('@remotion/renderer');
      const browser = await openBrowser('chrome', {
        browserExecutable,
        chromiumOptions,
      });
      warmBrowserInstance = browser;
      browserJobsProcessed = 0;
      activeBrowserJobs = 0;
      isBrowserDraining = false;
      browserCreatedAt = Date.now();
      console.log('[Remotion Pool] ✅ Persistent warm Chromium ready.');
      return browser;
    } catch (err) {
      console.warn('[Remotion Pool] ⚠️ Warm browser launch warning:', err.message);
      warmBrowserInstance = null;
      return null;
    } finally {
      warmBrowserPromise = null;
    }
  })();

  return warmBrowserPromise;
}

export async function closeWarmBrowser(forceKill = false) {
  if (warmBrowserInstance) {
    try {
      if (forceKill && typeof warmBrowserInstance.process === 'function') {
        const proc = warmBrowserInstance.process();
        if (proc) {
          console.log('[Remotion Pool] 💀 Force killing Chromium PID:', proc.pid);
          proc.kill('SIGKILL');
        }
      }
      await warmBrowserInstance.close({});
    } catch (_) {}
    warmBrowserInstance = null;
    browserJobsProcessed = 0;
    activeBrowserJobs = 0;
    isBrowserDraining = false;
  }
}

process.on('SIGINT', async () => { await closeWarmBrowser(true); });
process.on('SIGTERM', async () => { await closeWarmBrowser(true); });

let cachedSafeBrowserExecutable = null;

export async function getSafeBrowserExecutable() {
  if (os.platform() !== 'linux') {
    return undefined;
  }
  if (cachedSafeBrowserExecutable && fs.existsSync(cachedSafeBrowserExecutable)) {
    return cachedSafeBrowserExecutable;
  }

  try {
    const browserStatus = await ensureBrowser();
    const realChrome = browserStatus?.path;

    if (!realChrome || !fs.existsSync(realChrome)) {
      console.warn('[Remotion] Real Chrome binary not found at:', realChrome);
      return undefined;
    }

    try {
      fs.chmodSync(realChrome, 0o755);
    } catch (_) {}

    const wrapperDir = path.join(os.tmpdir(), 'xd-remotion-bin');
    if (!fs.existsSync(wrapperDir)) {
      fs.mkdirSync(wrapperDir, { recursive: true });
    }

    const wrapperPath = path.join(wrapperDir, 'chrome-wrapper.sh');
    // RENDER_CHROME_GPU_OFF=0 bỏ --disable-gpu --disable-software-rasterizer (cho phép SwiftShader/ANGLE khi đo RENDER_GL)
    const gpuOffFlags = process.env.RENDER_CHROME_GPU_OFF === '0' ? '' : '--disable-gpu --disable-software-rasterizer ';
    const script = `#!/bin/sh
exec "${realChrome}" ${gpuOffFlags}--disable-dev-shm-usage "$@"
`;
    fs.writeFileSync(wrapperPath, script, { mode: 0o755 });
    cachedSafeBrowserExecutable = wrapperPath;
    console.log(`[Remotion] Installed Cloud Run Chrome wrapper at ${wrapperPath} -> ${realChrome}`);
    return wrapperPath;
  } catch (err) {
    console.warn('[Remotion] Failed to setup browser wrapper:', err.message);
    return undefined;
  }
}

// ── Auto-Retention Storage Cleanup (Keep top 30 newest files) ──
function cleanupOldRenders(maxToKeep = 30) {
  try {
    const files = fs.readdirSync(publicDir);
    const videoFiles = files
      .filter(f => f.endsWith('.mp4') && !f.startsWith('.'))
      .map(f => {
        const fullPath = path.join(publicDir, f);
        const stat = fs.statSync(fullPath);
        return { filename: f, fullPath, createdAt: stat.mtimeMs };
      })
      .sort((a, b) => b.createdAt - a.createdAt); // Newest first

    if (videoFiles.length > maxToKeep) {
      const filesToDelete = videoFiles.slice(maxToKeep);
      for (const item of filesToDelete) {
        try {
          if (fs.existsSync(item.fullPath)) {
            fs.unlinkSync(item.fullPath);
            console.log(`[Storage Cleanup] 🧹 Auto-deleted old video: ${item.filename}`);
          }
        } catch (e) {
          console.warn(`[Storage Cleanup] Failed to delete ${item.filename}:`, e.message);
        }
      }
    }
  } catch (err) {
    console.error('[Storage Cleanup Error]:', err);
  }
}

// ── Remotion Bundle Caching with Auto-Invalidation ──
let cachedBundleUrl = null;
let lastBundleTime = 0;

function getLatestSrcMtime(dir) {
  let latest = 0;
  try {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const f of files) {
      const fullPath = path.join(dir, f.name);
      if (f.isDirectory()) {
        const sub = getLatestSrcMtime(fullPath);
        if (sub > latest) latest = sub;
      } else {
        const stat = fs.statSync(fullPath);
        if (stat.mtimeMs > latest) latest = stat.mtimeMs;
      }
    }
  } catch (e) {}
  return latest;
}

const SFX_FALLBACK_MAP = {
  chime: 'chime',
  bell: 'bell',
  magic: 'chime',
  correct: 'ding',
  success: 'ding',
  sparkle: 'chime',
  tada: 'ding',
  whoosh: 'whoosh',
  transition: 'whoosh',
  slide: 'swoosh',
  swipe: 'swoosh',
  button: 'click',
  tap: 'click',
  switch: 'click',
  tick: 'clock_tick',
  clock: 'clock_tick',
  bubble: 'pop',
  appear: 'pop',
  snap: 'pop',
  giggle: 'laugh',
  funny: 'laugh',
  keyboard: 'typewriter',
  typing: 'typewriter',
  chat: 'typewriter',
  applause: 'clap',
  cheer: 'clap',
  suspense: 'drumroll',
  roll: 'drumroll',
  money: 'kaching',
  cash: 'kaching',
  coin: 'kaching',
  dollar: 'kaching',
  camera: 'camera_shutter',
  shutter: 'camera_shutter',
  photo: 'camera_shutter',
  error: 'buzzer',
  wrong: 'buzzer',
  fail: 'buzzer',
  scratch: 'record_scratch',
  vinyl: 'record_scratch',
  stop: 'record_scratch',
  impact: 'boom',
  bass: 'boom',
  hit: 'thud',
  punch: 'thud',
  tension: 'riser',
  build: 'riser',
  build_up: 'riser',
  crack: 'whip',
};

export function resolveMediaUrl(url) {
  if (!url || typeof url !== 'string') return url;

  // Extract path if URL is http://localhost:4000/sfx/xxx or /sfx/xxx
  let cleanPath = url;
  if (cleanPath.startsWith('http://localhost:4000')) {
    cleanPath = cleanPath.replace('http://localhost:4000', '');
  } else if (cleanPath.startsWith('http://localhost:3000')) {
    cleanPath = cleanPath.replace('http://localhost:3000', '');
  } else if (cleanPath.startsWith('http://localhost:5173')) {
    cleanPath = cleanPath.replace('http://localhost:5173', '');
  }

  // Handle SFX validation & fallback to prevent ANY 404 error during render
  if (cleanPath.includes('/sfx/')) {
    const sfxFileName = cleanPath.split('/sfx/')[1] || '';
    const baseName = sfxFileName.replace(/\.(wav|mp3|ogg|m4a)$/i, '').toLowerCase();

    // Check if physical file exists in public/sfx/
    const diskPath = path.join(publicDir, 'sfx', sfxFileName);
    if (!fs.existsSync(diskPath)) {
      const fallbackBase = SFX_FALLBACK_MAP[baseName] || 'ding';
      cleanPath = `/sfx/${fallbackBase}.wav`;
    }
  }

  // 1. Convert local /storage/ images (e.g. user avatars) to Base64 Data URI
  // Eliminates all network calls, port mismatches, and 404s inside headless Chromium!
  if (cleanPath.includes('/storage/')) {
    const rawPath = cleanPath.split('?')[0].split('#')[0];
    const subPath = rawPath.slice(rawPath.indexOf('/storage/') + '/storage/'.length);
    const diskPath = path.join(storageDir, subPath);
    if (fs.existsSync(diskPath)) {
      try {
        const ext = path.extname(diskPath).toLowerCase().replace('.', '');
        const stat = fs.statSync(diskPath);
        if (['webp', 'png', 'jpg', 'jpeg', 'svg', 'gif'].includes(ext) && stat.size <= 1 * 1024 * 1024) {
          const mimeType = ext === 'svg' ? 'image/svg+xml' : ext === 'webp' ? 'image/webp' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
          const b64 = fs.readFileSync(diskPath).toString('base64');
          return `data:${mimeType};base64,${b64}`;
        }
      } catch (err) {
        console.warn('[ResolveMediaUrl] Failed to base64 encode storage image:', err.message);
      }
    }
  }

  // 2. Convert local /uploads/ images to Base64 Data URI
  if (cleanPath.includes('/uploads/')) {
    const rawPath = cleanPath.split('?')[0].split('#')[0];
    const subPath = rawPath.slice(rawPath.indexOf('/uploads/') + '/uploads/'.length);
    const diskPath = path.join(uploadsDir, subPath);
    if (fs.existsSync(diskPath)) {
      try {
        const ext = path.extname(diskPath).toLowerCase().replace('.', '');
        const stat = fs.statSync(diskPath);
        if (['webp', 'png', 'jpg', 'jpeg', 'svg', 'gif'].includes(ext) && stat.size <= 1 * 1024 * 1024) {
          const mimeType = ext === 'svg' ? 'image/svg+xml' : ext === 'webp' ? 'image/webp' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
          const b64 = fs.readFileSync(diskPath).toString('base64');
          return `data:${mimeType};base64,${b64}`;
        }
      } catch (err) {
        console.warn('[ResolveMediaUrl] Failed to base64 encode upload image:', err.message);
      }
    }
  }

  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://') || cleanPath.startsWith('data:')) {
    return cleanPath;
  }

  const port = process.env.PORT || 4000;
  const finalPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  return `http://localhost:${port}${finalPath}`;
}

function getRemotionCoreMtime() {
  const coreDirs = [
    path.join(rootDir, 'src/remotion'),
    path.join(rootDir, 'src/config'),
    path.join(rootDir, 'src/types'),
  ];
  let latest = 0;
  for (const dir of coreDirs) {
    if (fs.existsSync(dir)) {
      const t = getLatestSrcMtime(dir);
      if (t > latest) latest = t;
    }
  }
  return latest;
}

async function getOrBuildBundle() {
  const latestSrcMtime = getRemotionCoreMtime();
  const prebuiltBundlePath = path.join(rootDir, 'server/build/remotion-bundle');

  if (fs.existsSync(prebuiltBundlePath)) {
    const bundleJsPath = path.join(prebuiltBundlePath, 'bundle.js');
    const bundleMtime = fs.existsSync(bundleJsPath) ? fs.statSync(bundleJsPath).mtimeMs : fs.statSync(prebuiltBundlePath).mtimeMs;
    if (bundleMtime >= latestSrcMtime) {
      console.log('[Remotion SSR] Using up-to-date pre-built enterprise bundle at:', prebuiltBundlePath);
      return prebuiltBundlePath;
    } else {
      console.log('[Remotion SSR] Source changes detected newer than prebuilt bundle. Re-bundling...');
    }
  }

  if (cachedBundleUrl && lastBundleTime >= latestSrcMtime) {
    return cachedBundleUrl;
  }

  // Disk-Persistent Bundle Cache Check (survives server restarts)
  const bundleMetaPath = path.join(rootDir, 'server/.cache/bundle-meta.json');
  try {
    if (fs.existsSync(bundleMetaPath)) {
      const meta = JSON.parse(fs.readFileSync(bundleMetaPath, 'utf8'));
      if (meta?.bundlePath && fs.existsSync(meta.bundlePath) && meta.savedMtime >= latestSrcMtime) {
        cachedBundleUrl = meta.bundlePath;
        lastBundleTime = meta.savedMtime;
        console.log('[Remotion SSR] ⚡ Loaded valid persistent Webpack bundle cache from disk:', meta.bundlePath);
        return cachedBundleUrl;
      }
    }
  } catch (_) {}

  console.log('[Remotion SSR] Video engine changes detected or bundle cache expired. Bundling composition with Webpack...');
  const bundled = await bundle(path.join(rootDir, 'src/remotion/index.ts'), () => undefined, {
    publicDir: publicDir,
    webpackOverride: (config) => {
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': path.resolve(rootDir, 'src'),
      };
      return config;
    },
  });

  cachedBundleUrl = bundled;
  lastBundleTime = Date.now();

  try {
    const cacheDir = path.join(rootDir, 'server/.cache');
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
    fs.writeFileSync(bundleMetaPath, JSON.stringify({ bundlePath: bundled, savedMtime: lastBundleTime }), 'utf8');
  } catch (_) {}

  return bundled;
}

function clearBundleCache() {
  cachedBundleUrl = null;
  lastBundleTime = 0;
  try {
    const bundleMetaPath = path.join(rootDir, 'server/.cache/bundle-meta.json');
    if (fs.existsSync(bundleMetaPath)) fs.unlinkSync(bundleMetaPath);
  } catch (_) {}
  console.log('[Remotion SSR] Bundle cache cleared manually.');
}

// ── Background Render Job Queue Manager ──
const renderJobs = new Map();
/** jobId → hàm huỷ renderMedia (cancelSignal) — huỷ thật thay vì chỉ ngừng báo tiến độ */
const jobCancelFns = new Map();

/** Huỷ render đang chạy trên instance này (nếu có); trả true khi đã gửi tín hiệu huỷ */
function cancelRenderJob(jobId) {
  const job = renderJobs.get(jobId);
  if (job) job.status = 'cancelled';
  const cancel = jobCancelFns.get(jobId);
  if (cancel) cancel();
  return Boolean(cancel);
}

/** Các lần ghi Firestore của một job chạy TUẦN TỰ: ghi song song có thể về sai thứ tự và bản tiến độ cũ
 *  ('rendering') đè lên trạng thái cuối ('failed' / 'completed') */
const jobWriteChains = new Map();
function queueJobWrite(jobId, data) {
  const prev = jobWriteChains.get(jobId) || Promise.resolve();
  const next = prev.then(() => adminDb.collection('render_jobs').doc(jobId).set(data, { merge: true })).catch(() => {});
  jobWriteChains.set(jobId, next);
  // Chuỗi đã ghi hết → bỏ khỏi map (không giữ mục thừa cho job đã xong)
  next.then(() => { if (jobWriteChains.get(jobId) === next) jobWriteChains.delete(jobId); });
  return next;
}

/** Ghi trạng thái cuối và CHỜ xong — worker phải ghi xong trước khi trả response
 *  (sau response Cloud Run bóp CPU, lệnh ghi chưa xong có thể không bao giờ chạy) */
async function flushJobUpdate(jobId) {
  const job = renderJobs.get(jobId);
  if (!job || !adminDb) return;
  await queueJobWrite(jobId, { ...job, updatedAt: Date.now() });
}
const sseListeners = new Map(); // jobId -> Set<res>
const firestoreSyncTimers = new Map(); // jobId -> { lastSyncTime, lastStatus }

function notifyJobUpdate(jobId) {
  const job = renderJobs.get(jobId);
  if (!job) return;

  // Persist to Firestore with smart throttling:
  // 1. Immediately on major status changes (queued, bundling, rendering, completed, failed, cancelled)
  // 2. Throttled to at most once per 2000ms for continuous progress updates
  if (adminDb) {
    const now = Date.now();
    const syncState = firestoreSyncTimers.get(jobId) || { lastSyncTime: 0, lastStatus: '' };
    const isStatusChange = job.status !== syncState.lastStatus;
    const isTerminal = job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled';
    const isThrottleExpired = now - syncState.lastSyncTime >= 2000;

    if (isStatusChange || isTerminal || isThrottleExpired) {
      firestoreSyncTimers.set(jobId, { lastSyncTime: now, lastStatus: job.status });
      queueJobWrite(jobId, { ...job, updatedAt: now });
      if (isTerminal) {
        firestoreSyncTimers.delete(jobId);
      }
    }
  }

  const listeners = sseListeners.get(jobId);
  if (listeners) {
    const data = JSON.stringify(job);
    for (const client of listeners) {
      client.write(`data: ${data}\n\n`);
      if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
        setTimeout(() => {
          try { client.end(); } catch (e) {}
        }, 200);
      }
    }
    if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
      sseListeners.delete(jobId);
    }
  }
}

/**
 * Render một job. worker = true: chạy trong Render Worker (Cloud Run, mỗi instance 1 job) — bỏ semaphore nội bộ,
 * áp ngân sách thời gian RENDER_BUDGET_SEC, không thử lại (Cloud Tasks quyết định thử lại).
 */
async function runBackgroundRenderJob(jobId, payload, user, { worker = false } = {}) {
  const { scenes = [], bgMusicUrl, bgMusicVolume, audioClips = [], voiceoverReverb = 0, durationInFrames, scale = 3, targetFps = 30 } = payload;
  const job = renderJobs.get(jobId);
  if (!job) return;

  let slotAcquired = false;
  const startTime = performance.now();

  try {
    // 0. Server-Wide Concurrency Limiter: Wait in FIFO Semaphore Queue if server capacity is full
    // Hàng chờ nội bộ chỉ cho chế độ local; worker Cloud Run nhận đúng 1 job/instance (concurrency=1)
    if (!worker) {
      const initialPos = renderSemaphore.getQueuePosition(jobId);
      if (initialPos > 0) {
        job.status = 'waiting';
        job.stage = 'waiting';
        job.queuePosition = initialPos;
        notifyJobUpdate(jobId);
      }

      const queueInterval = setInterval(() => {
        const pos = renderSemaphore.getQueuePosition(jobId);
        if (pos > 0 && job.queuePosition !== pos) {
          job.queuePosition = pos;
          notifyJobUpdate(jobId);
        }
      }, 1500);

      try {
        await renderSemaphore.acquire(jobId);
        slotAcquired = true;
      } finally {
        clearInterval(queueInterval);
      }
    }

    if (job.status === 'cancelled') {
      return;
    }

    job.queuePosition = 0;

    // 0b. Pre-fetch all remote media assets to local disk to guarantee 0ms latency in frame loop
    job.stage = 'preloading';
    job.progress = 0.03;
    notifyJobUpdate(jobId);

    const preloadedPayload = await preloadJobAssets({
      scenes,
      audioClips,
      bgMusicUrl,
    }, jobId);

    const effectiveScenes = preloadedPayload.scenes || scenes;
    const effectiveAudioClips = preloadedPayload.audioClips || audioClips;
    const effectiveBgMusicUrl = preloadedPayload.bgMusicUrl || bgMusicUrl;

    // Sanitize and resolve all relative media URLs so headless Chrome always gets 200 OK
    const resolvedBgMusic = resolveMediaUrl(effectiveBgMusicUrl);
    
    // Apply Studio Reverb to Voiceover tracks if voiceoverReverb is enabled (> 0)
    const resolvedAudioClips = (effectiveAudioClips || []).map(clip => {
      const isVoice = !clip.trackId || clip.trackId === 'voice' || clip.trackId === 'A1';
      let clipUrl = clip.url;
      if (isVoice && voiceoverReverb > 0.02 && clipUrl) {
        clipUrl = applyReverbToAudio(clipUrl, voiceoverReverb);
      }
      return {
        ...clip,
        url: resolveMediaUrl(clipUrl),
      };
    });

    const resolvedScenes = (effectiveScenes || []).map(scene => {
      let vUrl = scene.voiceoverUrl;
      if (vUrl && voiceoverReverb > 0.02) {
        vUrl = applyReverbToAudio(vUrl, voiceoverReverb);
      }
      return {
        ...scene,
        voiceoverUrl: vUrl ? resolveMediaUrl(vUrl) : undefined,
        authorAvatarUrl: scene.authorAvatarUrl ? resolveMediaUrl(scene.authorAvatarUrl) : undefined,
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

    // Zero-Trust: đọc gói của user từ Firestore (không tin client) → watermark + số ngày lưu video
    let showWatermark = true;
    let retentionDays = 1;
    const isSuperAdmin = user?.admin || checkIsAdmin(user?.email || job.userEmail);

    if (isSuperAdmin) {
      showWatermark = false;
      retentionDays = 30;
    } else if (adminDb && (user?.uid || job.userId)) {
      try {
        const uidToLookup = user?.uid || job.userId;
        const userDoc = await adminDb.collection('users').doc(uidToLookup).get();
        const plan = await planService.getPlanById(userDoc.exists ? (userDoc.data().planTier || 'free') : 'free');
        showWatermark = !plan?.features?.removeWatermark;
        retentionDays = Number(plan?.quotas?.storageRetentionDays) || 1;
      } catch (err) {
        // Không đọc được gói: an toàn là có watermark, lưu 1 ngày
        console.warn('⚠️ [Zero-Trust Warn]: Failed to fetch user tier, defaulting to watermark:', err.message);
      }
    } else {
      showWatermark = Boolean(payload.showWatermark);
    }

    const inputProps = {
      scenes: resolvedScenes,
      bgMusicUrl: resolvedBgMusic,
      bgMusicVolume,
      audioClips: resolvedAudioClips,
      durationInFrames,
      showWatermark,
      masterVolume: payload.masterVolume !== undefined ? Number(payload.masterVolume) : 1.0,
      voiceoverVolume: payload.voiceoverVolume !== undefined ? Number(payload.voiceoverVolume) : 1.0,
      sfxVolume: payload.sfxVolume !== undefined ? Number(payload.sfxVolume) : 0.8,
      bgmVolume: payload.bgmVolume !== undefined ? Number(payload.bgmVolume) : 0.8,
      isVoiceMuted: Boolean(payload.isVoiceMuted),
      isSfxMuted: Boolean(payload.isSfxMuted),
      isBgmMuted: Boolean(payload.isBgmMuted),
      isMuted: Boolean(payload.isMasterMuted),
      soloTrackId: payload.soloTrackId || null,
      soloTrackIds: Array.isArray(payload.soloTrackIds) ? payload.soloTrackIds : [],
      mutedTrackIds: Array.isArray(payload.mutedTrackIds) ? payload.mutedTrackIds : [],
    };

    // 1. Bundling phase
    job.status = 'bundling';
    job.stage = 'bundling';
    job.progress = 0.05;
    notifyJobUpdate(jobId);

    const bundled = await getOrBuildBundle();

    if (job.status === 'cancelled') return;

    // Configure Chromium options for high-performance containerized execution
    const isLinux = os.platform() === 'linux';
    const browserExecutable = await getSafeBrowserExecutable();
    const containerChromiumOptions = {
      enableMultiProcessOnLinux: true,
      // Backend vẽ của Chrome: RENDER_GL = swangle | angle | angle-egl | swiftshader | egl (mặc định null = như cũ).
      // Đổi bằng `gcloud run services update --update-env-vars` để đo — không cần build lại image.
      gl: process.env.RENDER_GL || null,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--enable-zero-copy',
        '--disable-gpu-rasterization=false',
        '--hide-scrollbars',
        '--mute-audio',
        '--disk-cache-size=1',
        '--disable-component-update',
        '--disable-background-networking',
        '--disable-features=Translate,BackForwardCache,AcceptCHFrame',
        '--disable-extensions',
        '--disable-default-apps',
        '--disable-sync',
        '--no-first-run',
        '--js-flags=--max-old-space-size=2048',
        '--disable-background-timer-throttling',
      ],
    };

    // Warm Browser Acquisition (0ms cold-start overhead if alive)
    let warmBrowser = null;
    try {
      warmBrowser = await getOrCreateWarmBrowser({
        browserExecutable,
        chromiumOptions: containerChromiumOptions,
      });
    } catch (browserErr) {
      console.warn('[Remotion SSR] Warm browser pool warning, falling back to on-demand browser:', browserErr.message);
    }

    // 2. Select Composition
    job.progress = 0.08;
    notifyJobUpdate(jobId);
    console.log(`[Job ${jobId}] Selecting composition (browser: ${browserExecutable || 'default'}, warmPool: ${Boolean(warmBrowser)})...`);

    let composition;
    try {
      composition = await selectComposition({
        serveUrl: bundled,
        id: 'MotionStudio',
        inputProps,
        puppeteerInstance: warmBrowser || undefined,
        browserExecutable,
        chromiumOptions: containerChromiumOptions,
      });
    } catch (compErr) {
      if (warmBrowser) {
        console.warn('[Remotion SSR] Selection failed on warm browser, resetting pool & retrying once...');
        await closeWarmBrowser();
        composition = await selectComposition({
          serveUrl: bundled,
          id: 'MotionStudio',
          inputProps,
          browserExecutable,
          chromiumOptions: containerChromiumOptions,
        });
      } else {
        throw compErr;
      }
    }

    if (job.status === 'cancelled') return;

    // 3. Rendering phase
    job.status = 'rendering';
    job.stage = 'rendering';
    job.totalFrames = composition.durationInFrames || 300;
    job.fps = composition.fps || 30;
    job.renderedFrames = 0;
    job.progress = 0.1;
    notifyJobUpdate(jobId);

    const renderScale = Number(scale) || 3;

    // Generate clean SEO output filename
    const userBaseName = (payload.filename || '').replace(/\.mp4$/i, '').trim();
    const cleanUserBaseName = userBaseName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 65);

    let outputFilename = cleanUserBaseName ? `${cleanUserBaseName}.mp4` : `export-${jobId}.mp4`;
    let outputLocation = path.join(publicDir, outputFilename);

    // If file already exists, avoid collision by appending short timestamp
    if (cleanUserBaseName && fs.existsSync(outputLocation)) {
      outputFilename = `${cleanUserBaseName}-${Date.now().toString().slice(-4)}.mp4`;
      outputLocation = path.join(publicDir, outputFilename);
    }

    const downloadUrl = `/api/render/download/${outputFilename}`;
    // Cân bằng tài nguyên thông minh: tránh mở quá nhiều tab trên máy ít core
    const cpuCount = os.cpus()?.length || 4;
    const totalMemGB = Math.round(os.totalmem() / (1024 * 1024 * 1024));
    let optimalConcurrency = 4;
    if (cpuCount <= 2 || totalMemGB <= 4) {
      optimalConcurrency = 1;
    } else if (cpuCount <= 4 || totalMemGB <= 8) {
      optimalConcurrency = 2;
    } else if (cpuCount <= 8) {
      optimalConcurrency = 4;
    } else {
      optimalConcurrency = Math.min(cpuCount - 2, 8);
    }
    // Remotion không cho vượt số nhân CPU của máy
    const concurrency = Math.min(cpuCount, Number(process.env.RENDER_CONCURRENCY) || optimalConcurrency);
    const dynamicCrf = renderScale >= 3 ? 20 : 21;

    console.log(`[Job ${jobId}] Rendering (${composition.width * renderScale}x${composition.height * renderScale}, scale: ${renderScale}x, concurrency: ${concurrency}, crf: ${dynamicCrf}) to ${outputFilename}...`);

    // Ngân sách thời gian: worker dùng RENDER_BUDGET_SEC (video short — mặc định 300s), local giữ mức nới theo độ dài
    const budgetSec = Number(process.env.RENDER_BUDGET_SEC) || (worker ? 300 : 0);
    const maxJobTimeoutSec = budgetSec || Math.max(120, Math.ceil((composition.durationInFrames / (composition.fps || 30)) * 6));
    console.log(`[Job ${jobId}] Job timeout set to ${maxJobTimeoutSec}s`);

    const performRender = async (puppeteerInst) => {
      const renderStartTime = performance.now();
      let lastFrameAt = performance.now();
      let watchdogTimer = null;
      let renderPromise = null;
      let resolveWatchdog = null;

      // Ensure activeJobs is tracked safely by boolean flag
      const isUsingWarmBrowser = Boolean(puppeteerInst && puppeteerInst === warmBrowserInstance);
      if (isUsingWarmBrowser) {
        activeBrowserJobs++;
      }

      const { cancelSignal, cancel } = makeCancelSignal();
      jobCancelFns.set(jobId, cancel);
      try {
        renderPromise = renderMedia({
          composition,
          serveUrl: bundled,
          codec: 'h264',
          audioCodec: 'aac',
          imageFormat: 'jpeg',
          jpegQuality: 80, // Keep at 80 for text sharpness
          pixelFormat: 'yuv420p',
          crf: dynamicCrf,
          outputLocation,
          scale: renderScale,
          inputProps,
          concurrency,
          // veryfast: nhanh hơn ~10% so với medium, dung lượng gần như không đổi (tests/render/renderBenchmark.mjs)
          x264Preset: process.env.RENDER_X264_PRESET || 'veryfast',
          cancelSignal,
          puppeteerInstance: puppeteerInst || undefined,
          browserExecutable,
          chromiumOptions: containerChromiumOptions,
          onProgress: ({ progress, renderedFrames, encodedFrames }) => {
            lastFrameAt = performance.now(); // Reset heartbeat

            if (job.status === 'cancelled') return;
            const elapsedSec = Math.max(0.1, (performance.now() - renderStartTime) / 1000);
            const total = composition.durationInFrames || 300;
            const curRendered = renderedFrames || Math.round(progress * total);

            job.totalFrames = total;
            job.renderedFrames = curRendered;
            job.encodedFrames = encodedFrames || 0;

            if (elapsedSec > 0.5 && curRendered > 0) {
              const fpsRate = Math.round((curRendered / elapsedSec) * 10) / 10;
              job.renderFps = fpsRate;
              const remainingFrames = Math.max(0, total - curRendered);
              job.etaSec = fpsRate > 0 ? Math.ceil(remainingFrames / fpsRate) : null;
            }

            if (progress >= 0.98) {
              job.stage = 'encoding';
            } else {
              job.stage = 'rendering';
            }

            job.progress = Math.min(0.96, 0.1 + progress * 0.86);
            notifyJobUpdate(jobId);
          },
        });

        // Watchdog Promise with explicit resolve capability
        const watchdogPromise = new Promise((resolve, reject) => {
          resolveWatchdog = resolve;
          const checkInterval = 2000;
          watchdogTimer = setInterval(() => {
            const now = performance.now();
            const timeSinceLastFrame = now - lastFrameAt;
            const totalElapsedTime = now - renderStartTime;

            if (timeSinceLastFrame > 35000) {
              clearInterval(watchdogTimer);
              reject(new Error(`RENDER_STALL: No frame emitted for 35s.`));
            } else if (totalElapsedTime > maxJobTimeoutSec * 1000) {
              clearInterval(watchdogTimer);
              reject(new Error(`JOB_TIMEOUT: Max duration ${maxJobTimeoutSec}s exceeded.`));
            }
          }, checkInterval);
        });

        await Promise.race([renderPromise, watchdogPromise]);
        if (resolveWatchdog) resolveWatchdog();
      } finally {
        jobCancelFns.delete(jobId);
        if (watchdogTimer) clearInterval(watchdogTimer);
        if (resolveWatchdog) resolveWatchdog();
        if (isUsingWarmBrowser) {
          activeBrowserJobs = Math.max(0, activeBrowserJobs - 1);
          browserJobsProcessed++;
          // Trigger close if it was draining and this was the last job
          if (isBrowserDraining && activeBrowserJobs === 0) {
            console.log('[Remotion Pool] 🧹 Final draining job finished. Closing browser...');
            closeWarmBrowser().catch(() => {});
          }
        }
      }
    };

    try {
      await performRender(warmBrowser);
    } catch (renderErr) {
      if (warmBrowser && !worker && job.status !== 'cancelled') {
        console.error('[Remotion SSR] 🔄 Warm browser encountered an error (Stall/Timeout/Crash):', renderErr.message);
        console.log('[Remotion SSR] 💀 Force killing hung browser instance...');
        await closeWarmBrowser(true); // Force kill PID
        console.log('[Remotion SSR] ♻️ Retrying job once with fresh browser...');
        await performRender(undefined);
      } else {
        throw renderErr;
      }
    }

    if (job.status === 'cancelled') {
      if (fs.existsSync(outputLocation)) fs.unlinkSync(outputLocation);
      return;
    }

    // 4. Inject Rich SEO & Copyright Metadata into MP4 Container (< 100ms)
    job.stage = 'encoding';
    job.progress = 0.97;
    notifyJobUpdate(jobId);

    try {
      const firstScene = scenes && scenes[0] ? scenes[0] : {};
      const authorName = firstScene.authorName || 'Tech Director';
      const rawTitle = payload.filename || firstScene.name || firstScene.hudHeader || 'Viral Short Video';
      const cleanTitle = rawTitle.replace(/\.mp4$/i, '').replace(/[-_]/g, ' ');
      const scriptSummary = scenes.map(s => s.voiceoverText).filter(Boolean).join(' ').slice(0, 300) || 'AI-generated short video created by XD-Short Studio';

      await injectMp4Metadata(outputLocation, {
        title: cleanTitle,
        artist: authorName,
        comment: scriptSummary,
        copyright: `© ${new Date().getFullYear()} ${authorName}. All rights reserved.`,
        genre: 'Shorts / Educational / Technology',
        encoder: 'XD-Short AI Motion Studio v2026'
      });
    } catch (metaErr) {
      console.warn('[Remotion SSR] Metadata injection skipped:', metaErr.message);
    }

    const stats = fs.statSync(outputLocation);

    // 5. Cloud Storage Video Delivery & Auto-cleanup
    job.stage = 'uploading';
    job.progress = 0.98;
    notifyJobUpdate(jobId);

    let finalDownloadUrl = downloadUrl;
    let isCloudDelivery = false;
    try {
      const uploadResult = await uploadRenderedVideoAndCleanup(outputLocation, outputFilename, {
        jobId,
        uid: job.userId || user?.uid || null,
        retentionDays,
      });
      if (uploadResult.cdnUrl) {
        finalDownloadUrl = uploadResult.cdnUrl;
        isCloudDelivery = true;
        job.deliveryExpiresAt = uploadResult.expiresAt;
      }
    } catch (uploadErr) {
      console.warn('[Remotion SSR] Cloud upload note:', uploadErr.message);
    }

    // End-to-end total latency measurement (exact to milliseconds)
    const renderTimeSec = Number(((performance.now() - startTime) / 1000).toFixed(1));

    job.status = 'completed';
    job.stage = 'completed';
    job.progress = 1.0;
    job.outputFilename = outputFilename;
    job.outputLocation = outputLocation;
    job.downloadUrl = finalDownloadUrl;
    job.isCloudDelivery = isCloudDelivery;
    job.fileSize = stats.size;
    job.renderTimeSec = renderTimeSec;
    job.etaSec = 0;
    job.renderedFrames = job.totalFrames;

    console.log(`✅ [Job ${jobId} Completed] Rendered in ${renderTimeSec}s, size: ${(stats.size / 1024 / 1024).toFixed(2)} MB, CDN: ${isCloudDelivery ? 'Cloud' : 'Local'}`);
    
    // Auto-prune older renders to keep strictly 6 most recent videos
    cleanupOldRenders(6);

    notifyJobUpdate(jobId);
  } catch (err) {
    if (err.message === 'CANCELLED_IN_QUEUE' || job.status === 'cancelled') {
      console.log(`[Job ${jobId}] Render job cancelled (was waiting in queue or aborted)`);
      job.status = 'cancelled';
      job.stage = 'cancelled';
      job.error = 'Render job cancelled by user';
      notifyJobUpdate(jobId);
      return;
    }

    console.error(`❌ [Job ${jobId} Failed]:`, err);
    try {
      const errorLogPath = path.join(rootDir, 'render_error.log');
      const errorDetails = `[${new Date().toISOString()}] Job ${jobId} Failed:\nError: ${err.message || err}\nStack:\n${err.stack || 'No stack'}\n${'='.repeat(60)}\n\n`;
      fs.appendFileSync(errorLogPath, errorDetails);
      console.log(`[Remotion SSR] 📝 Error logged to ${errorLogPath}`);
    } catch (logErr) {
      console.error('Failed to write render_error.log:', logErr);
    }
    job.status = 'failed';
    job.stage = 'failed';
    job.error = translateRenderError(err);
    job.rawError = err.message || String(err);
    notifyJobUpdate(jobId);
  } finally {
    if (slotAcquired) {
      renderSemaphore.release(jobId);
    }
    // Deterministic Cleanup: purge temporary downloaded media assets and ensure quota unlock
    cleanupJobAssets(jobId);
    safeCleanup({ jobId, uid: job.userId || job.uid, refund: job.status === 'failed', charge: job.charge });
  }
}


export {
  cancelRenderJob,
  flushJobUpdate,
  getLatestSrcMtime,
  getOrBuildBundle,
  clearBundleCache,
  renderJobs,
  sseListeners,
  notifyJobUpdate,
  runBackgroundRenderJob,
  cleanupOldRenders,
  renderSemaphore
};
