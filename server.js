import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { publicDir, uploadsDir, storageDir } from './server/config/paths.js';
import uploadRoutes from './server/routes/uploadRoutes.js';
import aiRoutes from './server/routes/aiRoutes.js';
import renderRoutes from './server/routes/renderRoutes.js';
import projectRoutes from './server/routes/projectRoutes.js';
import paymentRoutes from './server/routes/paymentRoutes.js';
import adminRoutes from './server/routes/adminRoutes.js';
import planRoutes from './server/routes/planRoutes.js';
import doodleDraftRoutes from './server/routes/doodleDraftRoutes.js';
import chemRoutes from './server/routes/chemRoutes.js';
import { adminDb, verifyAuth } from './server/middlewares/auth.js';
import { onRequest } from 'firebase-functions/v2/https';

const app = express();

// Global Exception Handlers
process.on('uncaughtException', (err) => {
  console.error('⚠️ [Uncaught Exception Handled]:', err.message || err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ [Unhandled Rejection Handled]:', reason);
});

// Middleware Setup
app.use(cors());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
app.use(express.json({ limit: '50mb' }));

// Static File Serving with No-Cache & CORS for Audio/Media Assets
const staticOptions = {
  setHeaders: (res, filePath) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    if (filePath.endsWith('.mp3') || filePath.endsWith('.wav') || filePath.endsWith('.ogg') || filePath.endsWith('.m4a')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
};

// On-Demand Lazy Fallback / Proxy for Missing Suno Tracks
app.get('/uploads/:filename', (req, res, next) => {
  const { filename } = req.params;
  const filePath = path.join(uploadsDir, filename);

  // 1. If file already exists locally on disk, proceed to static handler
  if (fs.existsSync(filePath)) {
    return next();
  }

  // 2. If this is a Suno audio file (e.g. suno_094404fe-f3e2-43d0-924b-0bfe4fceb5f8.mp3)
  const sunoMatch = filename.match(/^suno_([0-9a-fA-F-]{36})\.mp3$/);
  if (sunoMatch) {
    const songId = sunoMatch[1];
    const cdnUrl = `https://cdn1.suno.ai/${songId}.mp3`;
    // Redirect immediately to Suno official CDN with cache
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.redirect(302, cdnUrl);
  }

  next();
});

app.use(express.static(publicDir, staticOptions));
app.use('/uploads', express.static(uploadsDir, staticOptions));
app.use('/public', express.static(publicDir, staticOptions));
app.use('/storage', express.static(storageDir, staticOptions));

// API Routes Mounting
app.use('/api', uploadRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/render', renderRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/doodle-drafts', doodleDraftRoutes);
app.use('/api/chem', chemRoutes);

// Authenticated Profile & Claims Synchronization (Auto-Bootstrap Admin Claims)
app.post('/api/auth/sync-profile', verifyAuth, async (req, res) => {
  const user = req.user;
  res.json({
    uid: user.uid,
    email: user.email,
    admin: Boolean(user.admin),
    role: user.role || (user.admin ? 'admin' : 'user'),
    planTier: user.planTier || (user.admin ? 'admin' : 'free'),
    claimsUpdated: res.getHeader('X-Claims-Updated') === 'true',
  });
});

// Public System Settings (Cached 5 min)
app.get('/api/settings/public', async (req, res) => {
  try {
    let publicConfig = {
      heroTemplates: [],
      supportHotline: '0967896567',
      supportZalo: 'https://zalo.me/0967896567',
    };
    if (adminDb) {
      const doc = await adminDb.collection('system_settings').doc('app_config').get();
      if (doc.exists) {
        const data = doc.data();
        if (data.heroTemplates && Array.isArray(data.heroTemplates)) publicConfig.heroTemplates = data.heroTemplates;
        if (data.supportHotline) publicConfig.supportHotline = data.supportHotline;
        if (data.supportZalo) publicConfig.supportZalo = data.supportZalo;
      }
    }
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.json(publicConfig);
  } catch (err) {
    res.json({ heroTemplates: [], supportHotline: '0967896567', supportZalo: 'https://zalo.me/0967896567' });
  }
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Firebase Cloud Functions (2nd Gen) HTTPS Export
// Bí mật lấy từ Secret Manager (không để trong .env / mã nguồn). Bật dần: liệt kê tên secret đã tạo bằng
// `firebase functions:secrets:set <TÊN>` vào FUNCTION_SECRETS (trong .env.<project>) — secret chưa tạo sẽ chặn deploy.
const FUNCTION_SECRETS = (process.env.FUNCTION_SECRETS || '').split(',').map(s => s.trim()).filter(Boolean);

export const api = onRequest({
  region: 'asia-southeast1',
  memory: '4GiB',
  cpu: 4,
  timeoutSeconds: 300,
  concurrency: 2,
  cors: true,
  invoker: 'public',
  ...(FUNCTION_SECRETS.length ? { secrets: FUNCTION_SECRETS } : {}),
}, app);

export { app };

import { fileURLToPath } from 'url';

// Standalone server entrypoint:
// In Cloud Functions (managed by functions framework), FUNCTION_TARGET is set, so we do NOT call app.listen.
// In Cloud Run (running Docker container node server.js) OR in local dev, we MUST call app.listen!
const isRunningInFunctionsFramework = Boolean(process.env.FUNCTION_TARGET);

if (!isRunningInFunctionsFramework) {
  const PORT = Number(process.env.PORT) || 4000;
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Remotion SSR & Media Server running on port ${PORT} (Environment: ${process.env.K_SERVICE ? 'Cloud Run' : 'Local Standalone'})`);
  });

  const handleShutdown = (signal) => {
    console.log(`\n🛑 Nhận tín hiệu ${signal}. Đang tắt server sạch sẽ...`);
    server.close(() => {
      console.log('✅ Server đã dừng hoàn toàn.');
      process.exit(0);
    });
    // Force kill if graceful shutdown takes longer than 2s
    setTimeout(() => {
      process.exit(0);
    }, 2000);
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
}

