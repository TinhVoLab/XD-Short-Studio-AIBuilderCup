import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { uploadsDir } from '../config/paths.js';

/**
 * Enterprise Asset Preload & In-Memory / Local Disk Buffer Service
 * 
 * Objectives:
 * 1. Pre-download all remote media (images, audio, voiceover, sound effects) before Remotion starts.
 * 2. Eliminate network lag during frame rendering (Chromium fetches from localhost in < 1ms).
 * 3. Graceful fallback: If an image or audio URL is broken (404/timeout), fall back to safe placeholder,
 *    NEVER allow a broken remote link to crash a 60-second render job.
 * 4. Deterministic cleanup: Ensure all temporary files are purged when render finishes or fails.
 */

// 1x1 transparent PNG base64 fallback for broken images
const SAFE_TRANSPARENT_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

function hashUrl(url) {
  return crypto.createHash('md5').update(url).digest('hex').slice(0, 16);
}

function getExtensionFromUrlOrContentType(url, contentType = '') {
  const clean = url.split('?')[0].split('#')[0];
  const ext = path.extname(clean).toLowerCase();
  if (ext && ext.length <= 5 && /^\.[a-z0-9]+$/.test(ext)) {
    return ext;
  }
  if (contentType.includes('image/jpeg')) return '.jpg';
  if (contentType.includes('image/png')) return '.png';
  if (contentType.includes('image/webp')) return '.webp';
  if (contentType.includes('image/svg')) return '.svg';
  if (contentType.includes('audio/mpeg') || contentType.includes('audio/mp3')) return '.mp3';
  if (contentType.includes('audio/wav')) return '.wav';
  if (contentType.includes('audio/ogg')) return '.ogg';
  if (contentType.includes('audio/mp4') || contentType.includes('audio/m4a')) return '.m4a';
  return '.bin';
}

function isRemoteHttpUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (url.startsWith('data:')) return false;
  if (url.includes('localhost:') || url.includes('127.0.0.1:')) return false;
  return url.startsWith('http://') || url.startsWith('https://');
}

/**
 * Download single asset with strict timeout (4s to avoid render stalling)
 */
async function downloadAsset(url, destPath, timeoutMs = 4000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': '*/*',
      },
    });

    if (!res.ok) {
      const err = new Error(`HTTP ${res.status} ${res.statusText}`);
      err.status = res.status;
      throw err;
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.promises.writeFile(destPath, buffer);
    return { success: true, size: buffer.length };
  } finally {
    clearTimeout(timer);
  }
}

/** 4xx (trừ 408 hết giờ, 429 quá tải) = asset không còn tồn tại; 5xx / mạng / hết giờ = lỗi tạm thời */
export function isMissingStatus(status) {
  return Number.isInteger(status) && status >= 400 && status < 500 && status !== 408 && status !== 429;
}

/**
 * Video không tải trước (file lớn, Chrome tự stream) — chỉ hỏi máy chủ file còn không.
 * @returns {Promise<number | null>} mã HTTP, hoặc null nếu không xác định được
 */
async function probeAsset(url, timeoutMs = 3000) {
  const attempt = async (method, headers = {}) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { method, headers, signal: controller.signal });
      res.body?.cancel?.().catch(() => {});
      return res.status;
    } finally {
      clearTimeout(timer);
    }
  };
  try {
    const status = await attempt('HEAD');
    // Một số CDN không hỗ trợ HEAD → hỏi 1 byte đầu
    return status === 405 || status === 501 ? await attempt('GET', { Range: 'bytes=0-0' }) : status;
  } catch {
    return null;
  }
}

/**
 * Preloads all external assets in render payload to local temporary storage.
 * Returns an updated payload referencing fast local assets.
 */
export async function preloadJobAssets(payload, jobId, port = 4000) {
  if (!payload || !jobId) return payload;

  const tempJobDir = path.join(uploadsDir, 'render_temp', jobId);
  try {
    if (!fs.existsSync(tempJobDir)) {
      fs.mkdirSync(tempJobDir, { recursive: true });
    }
  } catch (err) {
    console.warn(`[Asset Preload] Could not create temp dir ${tempJobDir}:`, err.message);
    return payload;
  }

  // 1. Collect all distinct external URLs
  const urlMap = new Map(); // originalUrl -> localUrl

  function registerUrl(url, type = 'image') {
    if (isRemoteHttpUrl(url) && !urlMap.has(url)) {
      urlMap.set(url, { type, status: 'pending', localUrl: null, filename: null });
    }
  }

  if (payload.bgMusicUrl) registerUrl(payload.bgMusicUrl, 'audio');

  if (Array.isArray(payload.audioClips)) {
    for (const clip of payload.audioClips) {
      if (clip?.url) registerUrl(clip.url, 'audio');
    }
  }

  if (Array.isArray(payload.scenes)) {
    for (const scene of payload.scenes) {
      if (scene.voiceoverUrl) registerUrl(scene.voiceoverUrl, 'audio');
      if (scene.authorAvatarUrl) registerUrl(scene.authorAvatarUrl, 'image');
      if (Array.isArray(scene.soundEffects)) {
        for (const sfx of scene.soundEffects) {
          if (sfx?.url) registerUrl(sfx.url, 'audio');
        }
      }
      if (scene.bgVideoUrl) registerUrl(scene.bgVideoUrl, 'video');
      if (Array.isArray(scene.elements)) {
        for (const el of scene.elements) {
          if (el?.src) registerUrl(el.src, el.type === 'video' ? 'video' : 'image');
          if (el?.imageUrl) registerUrl(el.imageUrl, 'image');
          if (el?.bgImage) registerUrl(el.bgImage, 'image');
        }
      }
    }
  }

  if (urlMap.size === 0) {
    return payload;
  }

  const startTime = Date.now();
  console.log(`[Asset Preload] ⚡ Pre-fetching ${urlMap.size} external assets for job ${jobId}...`);

  // 2. Download all assets concurrently
  const downloadPromises = Array.from(urlMap.entries()).map(async ([rawUrl, meta]) => {
    if (meta.type === 'video') {
      const status = await probeAsset(rawUrl);
      meta.status = isMissingStatus(status) ? 'missing' : 'ready';
      if (meta.status === 'missing') console.warn(`[Asset Preload] ⚠️ Video ${rawUrl} không còn tồn tại (HTTP ${status}). Dùng bản dự phòng.`);
      return; // localUrl null → giữ URL gốc cho Chrome stream
    }

    const hash = hashUrl(rawUrl);
    const ext = getExtensionFromUrlOrContentType(rawUrl);
    const filename = `${hash}${ext}`;
    const destPath = path.join(tempJobDir, filename);

    try {
      await downloadAsset(rawUrl, destPath);
      const localUrl = `http://localhost:${port}/uploads/render_temp/${jobId}/${filename}`;
      meta.status = 'ready';
      meta.localUrl = localUrl;
      meta.filename = filename;
    } catch (err) {
      console.warn(`[Asset Preload] ⚠️ Failed to download ${rawUrl} (${err.message}). Applying graceful fallback.`);
      // 4xx = mất hẳn: âm thanh phụ bị bỏ (không để Remotion lỗi cả lượt render); 5xx/hết giờ = thử lại bằng URL gốc
      meta.status = isMissingStatus(err.status) ? 'missing' : 'failed';
      if (meta.type === 'image') {
        meta.localUrl = SAFE_TRANSPARENT_IMAGE;
      } else {
        meta.localUrl = rawUrl;
      }
    }
  });

  await Promise.all(downloadPromises);

  const durationMs = Date.now() - startTime;
  console.log(`[Asset Preload] ✅ Pre-fetched ${urlMap.size} assets in ${durationMs}ms.`);

  // 3. Clone and replace URLs in payload
  const replacedPayload = JSON.parse(JSON.stringify(payload));

  const resolve = (url) => {
    if (!url) return url;
    const entry = urlMap.get(url);
    return entry && entry.localUrl ? entry.localUrl : url;
  };
  const statusOf = (url) => urlMap.get(url)?.status;
  const isMissing = (url) => statusOf(url) === 'missing';
  // Ảnh chính của element tải lỗi → ô dự phòng có thiết kế (Remotion đọc assetMissing), không phải ảnh trong suốt
  const isBrokenImage = (url) => ['missing', 'failed'].includes(statusOf(url));
  const keepAudio = (item) => !item?.url || !isMissing(item.url);

  if (replacedPayload.bgMusicUrl) {
    replacedPayload.bgMusicUrl = isMissing(replacedPayload.bgMusicUrl) ? undefined : resolve(replacedPayload.bgMusicUrl);
  }

  if (Array.isArray(replacedPayload.audioClips)) {
    replacedPayload.audioClips = replacedPayload.audioClips.filter(keepAudio).map(clip => ({
      ...clip,
      url: resolve(clip.url),
    }));
  }

  if (Array.isArray(replacedPayload.scenes)) {
    replacedPayload.scenes = replacedPayload.scenes.map(scene => ({
      ...scene,
      // Giọng đọc mất: giữ URL để render báo lỗi rõ ràng thay vì xuất video câm
      voiceoverUrl: resolve(scene.voiceoverUrl),
      authorAvatarUrl: resolve(scene.authorAvatarUrl),
      bgVideoUrl: scene.bgVideoUrl && isMissing(scene.bgVideoUrl) ? undefined : scene.bgVideoUrl,
      soundEffects: Array.isArray(scene.soundEffects)
        ? scene.soundEffects.filter(keepAudio).map(s => ({ ...s, url: resolve(s.url) }))
        : scene.soundEffects,
      elements: Array.isArray(scene.elements)
        ? scene.elements.map(el => {
            if (!el) return el;
            let updated = el;
            if (el.src && (el.type === 'video' ? isMissing(el.src) : isBrokenImage(el.src))) {
              updated = { ...updated, src: '', assetMissing: true };
            } else if (el.src) updated = { ...updated, src: resolve(el.src) };
            if (el.imageUrl) updated = { ...updated, imageUrl: resolve(el.imageUrl) };
            if (el.bgImage) updated = { ...updated, bgImage: resolve(el.bgImage) };
            return updated;
          })
        : scene.elements,
    }));
  }

  return replacedPayload;
}

/**
 * Deterministically purge all preloaded assets for this job.
 */
export function cleanupJobAssets(jobId) {
  if (!jobId) return;
  const tempJobDir = path.join(uploadsDir, 'render_temp', jobId);
  try {
    if (fs.existsSync(tempJobDir)) {
      fs.rmSync(tempJobDir, { recursive: true, force: true });
      console.log(`[Asset Preload] 🧹 Cleaned up temp assets for job ${jobId}`);
    }
  } catch (err) {
    console.warn(`[Asset Preload] Failed to cleanup temp assets for ${jobId}:`, err.message);
  }
}
