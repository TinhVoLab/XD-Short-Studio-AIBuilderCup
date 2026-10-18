import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { adminStorage } from '../middlewares/auth.js';
import { RETENTION_BUCKETS_DAYS, retentionBucketDays } from '../../src/config/planCatalog.js';

/** Video giao cho user nằm ở deliveries/{N}d/{uid}/ — lifecycle bucket xoá sau N ngày (storage-lifecycle.json) */
export function deliveryPath(uid, filename, retentionDays) {
  return `deliveries/${retentionBucketDays(retentionDays)}d/${uid}/${filename}`;
}

/** Mọi vị trí có thể của video của user (các nhóm lưu trữ + đường dẫn cũ renders/users/) */
export function userVideoCandidatePaths(uid, filename) {
  return [
    ...RETENTION_BUCKETS_DAYS.map(d => `deliveries/${d}d/${uid}/${filename}`),
    `renders/users/${uid}/${filename}`,
  ];
}

/**
 * Cloud Storage Video Delivery Service
 * - Uploads rendered MP4 videos to Firebase Storage / Cloud CDN
 * - Returns permanent CDN download URL
 * - Deletes temporary local MP4 file to prevent server disk overflow
 */
export async function uploadRenderedVideoAndCleanup(localFilePath, filename, options = {}) {
  if (!fs.existsSync(localFilePath)) {
    throw new Error(`Local video file not found at: ${localFilePath}`);
  }

  // If Firebase Admin Storage is not configured or offline, fallback to local storage
  if (!adminStorage) {
    console.log('[CloudStorage] Firebase Storage not initialized, keeping local render file.');
    return {
      cdnUrl: null,
      isCloud: false,
      localPath: localFilePath,
    };
  }

  const { jobId, uid, retentionDays = 1 } = options;
  // Có uid: lưu theo số ngày của gói; không uid (job cũ / dev): renders/public/ (lifecycle 1 ngày)
  const destination = uid ? deliveryPath(uid, filename, retentionDays) : `renders/public/${filename}`;

  const downloadToken = crypto.randomUUID();

  try {
    const bucket = adminStorage.bucket();
    console.log(`[CloudStorage] 🚀 Uploading ${filename} to Cloud Storage (${destination})...`);

    const [uploadedFile] = await bucket.upload(localFilePath, {
      destination,
      metadata: {
        contentType: 'video/mp4',
        cacheControl: 'public, max-age=31536000', // 1 year CDN cache
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
          jobId: jobId || '',
          uploadedAt: new Date().toISOString(),
          generator: 'XD-Short AI Motion Studio',
        },
      },
    });

    const bucketName = bucket.name;
    const cdnUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(destination)}?alt=media&token=${downloadToken}`;

    // Auto-cleanup local MP4 to free server disk space
    try {
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
        console.log(`[CloudStorage] 🧹 Auto-deleted temporary local MP4: ${path.basename(localFilePath)}`);
      }
    } catch (unlinkErr) {
      console.warn('[CloudStorage] Local cleanup warning:', unlinkErr.message);
    }

    console.log(`[CloudStorage] ✅ Video delivered via Cloud CDN: ${cdnUrl}`);
    return {
      cdnUrl,
      isCloud: true,
      destination,
      expiresAt: uid ? Date.now() + retentionBucketDays(retentionDays) * 86400000 : Date.now() + 86400000,
    };
  } catch (err) {
    console.warn(`[CloudStorage Warning] Failed to upload to Cloud Storage: ${err.message}. Keeping local file.`);
    return {
      cdnUrl: null,
      isCloud: false,
      localPath: localFilePath,
    };
  }
}

/**
 * Upload Audio (TTS / Sound FX / Voiceover) to Firebase Storage CDN
 * Returns public HTTPS CDN URL with zero CORS restrictions.
 */
export async function uploadAudioToCloudStorage(localFilePath, filename, folder = 'tts') {
  if (!fs.existsSync(localFilePath)) {
    return null;
  }

  if (!adminStorage) {
    return null;
  }

  const destination = `audio/${folder}/${filename}`;
  const downloadToken = crypto.randomUUID();

  try {
    const bucket = adminStorage.bucket();
    const ext = path.extname(filename).toLowerCase();
    const contentType = ext === '.wav' ? 'audio/wav' : 'audio/mpeg';

    await bucket.upload(localFilePath, {
      destination,
      metadata: {
        contentType,
        cacheControl: 'public, max-age=31536000', // 1 year CDN cache
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
          uploadedAt: new Date().toISOString(),
          generator: 'XD-Short Voice Engine',
        },
      },
    });

    const bucketName = bucket.name;
    const cdnUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(destination)}?alt=media&token=${downloadToken}`;
    console.log(`[CloudStorage] ✅ Audio delivered via Cloud CDN: ${filename}`);
    return cdnUrl;
  } catch (err) {
    console.warn(`[CloudStorage Warning] Failed to upload audio to Cloud Storage: ${err.message}`);
    return null;
  }
}

/**
 * Generic File Upload to Firebase Storage CDN (Images, Videos, User Uploads)
 */
export async function uploadFileToCloudStorage(localFilePath, filename, folder = 'user-uploads', mimeType = null) {
  if (!fs.existsSync(localFilePath)) {
    return null;
  }

  if (!adminStorage) {
    return null;
  }

  const destination = `${folder}/${filename}`;
  const downloadToken = crypto.randomUUID();

  try {
    const bucket = adminStorage.bucket();
    const ext = path.extname(filename).toLowerCase();

    let contentType = mimeType;
    if (!contentType) {
      if (ext === '.mp4') contentType = 'video/mp4';
      else if (ext === '.webm') contentType = 'video/webm';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      else if (ext === '.svg') contentType = 'image/svg+xml';
      else if (ext === '.webp') contentType = 'image/webp';
      else if (ext === '.wav') contentType = 'audio/wav';
      else if (ext === '.mp3') contentType = 'audio/mpeg';
      else contentType = 'application/octet-stream';
    }

    await bucket.upload(localFilePath, {
      destination,
      metadata: {
        contentType,
        cacheControl: 'public, max-age=31536000', // 1 year CDN cache
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
          uploadedAt: new Date().toISOString(),
          generator: 'XD-Short Media Engine',
        },
      },
    });

    const bucketName = bucket.name;
    const cdnUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(destination)}?alt=media&token=${downloadToken}`;
    console.log(`[CloudStorage] ✅ Media delivered via Cloud CDN: ${destination}`);
    return cdnUrl;
  } catch (err) {
    console.warn(`[CloudStorage Warning] Failed to upload file to Cloud Storage: ${err.message}`);
    return null;
  }
}

/**
 * Delete a single file from Firebase Storage CDN
 */
export async function deleteFileFromCloudStorage(filename, folder = 'user-uploads') {
  if (!adminStorage) return false;
  try {
    const destination = `${folder}/${filename}`;
    const bucket = adminStorage.bucket();
    const file = bucket.file(destination);
    const [exists] = await file.exists();
    if (exists) {
      await file.delete();
      console.log(`[CloudStorage] 🗑️ Deleted file from Cloud Storage: ${destination}`);
      return true;
    }
    return false;
  } catch (err) {
    console.warn(`[CloudStorage Warning] Failed to delete file ${filename}: ${err.message}`);
    return false;
  }
}

/**
 * Cascading delete for a folder prefix on Firebase Storage (e.g. project assets)
 */
export async function deleteFolderFromCloudStorage(prefix) {
  if (!adminStorage || !prefix) return false;
  try {
    const bucket = adminStorage.bucket();
    await bucket.deleteFiles({ prefix });
    console.log(`[CloudStorage] 🧹 Cascading delete for prefix: ${prefix}`);
    return true;
  } catch (err) {
    console.warn(`[CloudStorage Warning] Failed to delete prefix ${prefix}: ${err.message}`);
    return false;
  }
}
