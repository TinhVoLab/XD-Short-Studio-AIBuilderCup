import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const rootDir = path.resolve(__dirname, '../../');

import os from 'os';

export const isCloudEnvironment = Boolean(process.env.K_SERVICE || process.env.FUNCTION_TARGET);

// In Cloud Functions / Cloud Run, the code directory is read-only. We use /tmp for mutable uploads/cache.
export const baseStorageDir = isCloudEnvironment ? path.join(os.tmpdir(), 'xd-short') : rootDir;

export const publicDir = isCloudEnvironment ? path.join(baseStorageDir, 'public') : path.join(rootDir, 'public');
export const uploadsDir = isCloudEnvironment ? path.join(baseStorageDir, 'uploads') : path.join(publicDir, 'uploads');
export const cacheDir = isCloudEnvironment ? path.join(baseStorageDir, 'cache') : path.join(uploadsDir, 'cache');
export const storageDir = isCloudEnvironment ? path.join(baseStorageDir, 'storage') : path.join(publicDir, 'storage');
export const projectsStorageDir = isCloudEnvironment ? path.join(baseStorageDir, 'projects') : path.join(storageDir, 'projects');
export const usersStorageDir = isCloudEnvironment ? path.join(baseStorageDir, 'users') : path.join(storageDir, 'users');

try {
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }
  if (!fs.existsSync(projectsStorageDir)) {
    fs.mkdirSync(projectsStorageDir, { recursive: true });
  }
  if (!fs.existsSync(usersStorageDir)) {
    fs.mkdirSync(usersStorageDir, { recursive: true });
  }
} catch (e) {
  console.warn('[Paths Config] Initial directory creation warning (non-fatal):', e.message);
}

// Multer Storage Setup
export const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    cb(null, name);
  }
});

export const upload = multer({ 
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max file size to prevent disk & memory bloating
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith('image/') || 
      file.mimetype.startsWith('audio/') ||
      file.mimetype.startsWith('video/')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ hỗ trợ file ảnh, video (.mp4, .webm) hoặc âm thanh!'));
    }
  }
});
