import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { upload, uploadsDir, usersStorageDir } from '../config/paths.js';
import { uploadFileToCloudStorage, deleteFileFromCloudStorage } from '../services/cloudStorageService.js';
import { adminStorage } from '../middlewares/auth.js';
import { getAuth } from 'firebase-admin/auth';
import { clearBundleCache } from '../services/remotionService.js';

const router = Router();

// Resolve User ID helper (Token -> Query/Body -> Guest)
async function resolveUserId(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const idToken = authHeader.split('Bearer ')[1]?.trim();
    if (idToken) {
      if (idToken.startsWith('mock-')) return 'dev_local_user';
      try {
        const decoded = await getAuth().verifyIdToken(idToken);
        if (decoded?.uid) return decoded.uid.replace(/[^a-zA-Z0-9_-]/g, '_');
      } catch (e) {
        // Token invalid or expired, fallback to query/body
      }
    }
  }
  if (req.body?.userId && typeof req.body.userId === 'string') {
    return req.body.userId.replace(/[^a-zA-Z0-9_-]/g, '_');
  }
  return 'guest';
}

// Multer memory storage specifically for Avatar (strictly <= 1MB)
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024, // 1MB limit
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/jpeg' ||
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/webp'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ hỗ trợ file ảnh định dạng PNG, JPG hoặc WebP.'));
    }
  }
});

// Dedicated Avatar Upload Endpoint (POST /api/upload/avatar)
router.post('/upload/avatar', (req, res, next) => {
  avatarUpload.single('avatar')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Dung lượng ảnh vượt quá giới hạn 1MB. Vui lòng chọn ảnh nhỏ hơn.' });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Không tìm thấy file ảnh tải lên.' });
    }

    const userId = await resolveUserId(req);
    const userAvatarDir = path.join(usersStorageDir, userId, 'avatar');
    if (!fs.existsSync(userAvatarDir)) {
      fs.mkdirSync(userAvatarDir, { recursive: true });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const safeExt = ['.png', '.jpg', '.jpeg', '.webp'].includes(ext) ? ext : '.png';
    const targetFilename = `avatar${safeExt}`;
    const targetPath = path.join(userAvatarDir, targetFilename);

    // Clean up any old avatar files to enforce zero storage leak (strictly 1 avatar per user)
    const existingFiles = fs.readdirSync(userAvatarDir);
    existingFiles.forEach(f => {
      try { fs.unlinkSync(path.join(userAvatarDir, f)); } catch (e) {}
    });

    // Write file directly from memory buffer
    fs.writeFileSync(targetPath, req.file.buffer);

    let fileUrl = `/storage/users/${userId}/avatar/${targetFilename}?t=${Date.now()}`;

    // Upload to Firebase Cloud Storage if active
    if (adminStorage) {
      try {
        const cdnUrl = await uploadFileToCloudStorage(
          targetPath,
          targetFilename,
          `users/${userId}/avatar`,
          req.file.mimetype
        );
        if (cdnUrl) fileUrl = `${cdnUrl}&t=${Date.now()}`;
      } catch (cloudErr) {
        console.warn('[Avatar Upload] Cloud Storage upload fallback:', cloudErr.message);
      }
    }

    console.log(`[Avatar Upload] ✅ Avatar updated for user [${userId}]: ${fileUrl} (${Math.round(req.file.size / 1024)} KB)`);
    return res.json({
      success: true,
      url: fileUrl,
      userId,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (err) {
    console.error('Error during avatar upload:', err);
    res.status(500).json({ error: 'Tải lên avatar thất bại. Vui lòng thử lại.' });
  }
});

// Delete Avatar Endpoint (DELETE /api/upload/avatar)
router.delete('/upload/avatar', async (req, res) => {
  try {
    const userId = await resolveUserId(req);
    const userAvatarDir = path.join(usersStorageDir, userId, 'avatar');

    if (fs.existsSync(userAvatarDir)) {
      const files = fs.readdirSync(userAvatarDir);
      files.forEach(f => {
        try { fs.unlinkSync(path.join(userAvatarDir, f)); } catch (e) {}
      });
    }

    if (adminStorage) {
      try {
        await deleteFileFromCloudStorage('avatar.png', `users/${userId}/avatar`);
        await deleteFileFromCloudStorage('avatar.webp', `users/${userId}/avatar`);
        await deleteFileFromCloudStorage('avatar.jpg', `users/${userId}/avatar`);
      } catch (cloudErr) {
        console.warn('[Avatar Delete] Cloud Storage delete warning:', cloudErr.message);
      }
    }

    console.log(`[Avatar Delete] 🧹 Avatar purged for user [${userId}]`);
    return res.json({ success: true, message: 'Đã gỡ avatar thành công.' });
  } catch (err) {
    console.error('Error deleting avatar:', err);
    res.status(500).json({ error: 'Gỡ avatar thất bại.' });
  }
});

// File Upload Endpoint
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const isVideo = req.file.mimetype.startsWith('video/');
    const isAudio = req.file.mimetype.startsWith('audio/');
    const type = isVideo ? 'video' : isAudio ? 'audio' : 'image';
    
    let fileUrl = `/uploads/${req.file.filename}`;
    if (adminStorage) {
      try {
        const cdnUrl = await uploadFileToCloudStorage(req.file.path, req.file.filename, 'user-uploads', req.file.mimetype);
        if (cdnUrl) fileUrl = cdnUrl;
      } catch (cloudErr) {
        console.warn('[Upload] Cloud Storage upload fallback:', cloudErr.message);
      }
    }
    console.log(`[Upload] ${type.toUpperCase()} uploaded successfully:`, fileUrl, `(${Math.round(req.file.size / 1024)} KB)`);
    res.json({
      id: `media-${Date.now()}`,
      url: fileUrl,
      name: req.file.originalname,
      filename: req.file.filename,
      type,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (err) {
    console.error('Error during file upload:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Delete Uploaded File Endpoint (Purges physical file from local disk AND Cloud Storage)
router.delete('/upload/:filename', async (req, res) => {
  try {
    const rawFilename = req.params.filename;
    // Security check: strictly take basename to prevent directory traversal
    const safeFilename = path.basename(rawFilename);
    const filePath = path.join(uploadsDir, safeFilename);

    let localDeleted = false;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      localDeleted = true;
      console.log('[Upload] Physical file purged from local disk:', safeFilename);
    }

    // Also purge from Firebase Cloud Storage if online
    let cloudDeleted = false;
    if (adminStorage) {
      try {
        cloudDeleted = await deleteFileFromCloudStorage(safeFilename, 'user-uploads');
      } catch (cloudErr) {
        console.warn('[Upload] Cloud Storage delete warning:', cloudErr.message);
      }
    }

    return res.json({ 
      success: true, 
      message: `Purged ${safeFilename}`,
      localDeleted,
      cloudDeleted 
    });
  } catch (err) {
    console.error('Error deleting file:', err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// Clear bundle cache endpoint (/api/bundle/clear)
router.post('/bundle/clear', (req, res) => {
  clearBundleCache();
  res.json({ message: 'Bundle cache cleared successfully' });
});

export default router;
