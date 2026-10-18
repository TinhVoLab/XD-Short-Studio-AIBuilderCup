import { adminAuth, adminDb, checkIsAdmin, decodeJwtPayload } from './auth.js';
import { planService } from '../services/planService.js';
import { MAX_SHORT_VIDEO_SEC, findPlan, maxRenderableVideoSec } from '../../src/config/planCatalog.js';

// In-memory cache for dynamic system settings (TTL 60s to avoid Firestore read billing)
let cachedSettings = null;
let settingsExpiry = 0;

async function getSystemAiConfig() {
  const now = Date.now();
  if (cachedSettings && now < settingsExpiry) {
    return cachedSettings;
  }

  const defaults = {
    aiLimitFree: 5,
    aiLimitCreator: 50,
    aiLimitBusiness: -1,
    aiCacheEnabled: true,
  };

  try {
    if (adminDb) {
      const doc = await adminDb.collection('system_settings').doc('app_config').get();
      if (doc.exists) {
        const data = doc.data();
        cachedSettings = {
          aiLimitFree: typeof data.aiLimitFree === 'number' ? data.aiLimitFree : defaults.aiLimitFree,
          aiLimitCreator: typeof data.aiLimitCreator === 'number' ? data.aiLimitCreator : defaults.aiLimitCreator,
          aiLimitBusiness: typeof data.aiLimitBusiness === 'number' ? data.aiLimitBusiness : defaults.aiLimitBusiness,
          aiCacheEnabled: typeof data.aiCacheEnabled === 'boolean' ? data.aiCacheEnabled : defaults.aiCacheEnabled,
        };
        settingsExpiry = now + 60 * 1000;
        return cachedSettings;
      }
    }
  } catch (err) {
    console.warn('⚠️ [AiQuotaMiddleware] Failed to read app_config from Firestore:', err.message);
  }

  cachedSettings = defaults;
  settingsExpiry = now + 60 * 1000;
  return cachedSettings;
}

/**
 * Middleware: Enforce dynamic AI quota per user tier with zero-cost daily reset.
 */
export async function checkAiQuota(req, res, next) {
  const config = await getSystemAiConfig();
  req.aiConfig = config;

  // 1. Resolve User from Authorization header (if provided)
  const authHeader = req.headers.authorization;
  let uid = null;
  let tier = 'free';
  let bonusVideos = 0;
  let email = null;
  let decodedClaims = null;
  // Local dev không có Firebase Admin: không đọc được gói từ Firestore → không chặn độ dài theo gói ở máy local
  let planUnverifiable = false;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1].trim();
    if (token.startsWith('mock-') && process.env.NODE_ENV !== 'production') {
      uid = 'dev_local_user';
      email = 'tinhvl.g7@gmail.com';
      tier = 'admin';
      decodedClaims = { admin: true, role: 'admin' };
    } else if (adminAuth) {
      try {
        const decoded = await adminAuth.verifyIdToken(token);
        uid = decoded.uid;
        email = decoded.email;
        decodedClaims = decoded;

        // Check tier from Firestore
        if (adminDb) {
          const userDoc = await adminDb.collection('users').doc(uid).get();
          if (userDoc.exists) {
            tier = userDoc.data()?.planTier || 'free';
            bonusVideos = Number(userDoc.data()?.bonusVideos) || 0;
          }
        }
      } catch (authErr) {
        // Non-blocking: continue as anonymous/free if token invalid
        console.warn('ℹ️ [AiQuotaMiddleware] Invalid user token, treating as anonymous:', authErr.message);
      }
    } else if (process.env.NODE_ENV !== 'production') {
      // Giống verifyAuth: local dev đọc payload token (không xác minh chữ ký) để nhận diện người dùng
      const payload = decodeJwtPayload(token);
      if (payload) {
        uid = payload.user_id || payload.sub || null;
        email = payload.email || null;
        decodedClaims = payload;
        planUnverifiable = true;
      }
    }
  }

  // Super admin has unlimited AI
  if (checkIsAdmin(email, decodedClaims || {}) || tier === 'admin') {
    req.aiUser = { uid, email, tier: 'admin', limit: -1, remaining: 9999, maxVideoSec: MAX_SHORT_VIDEO_SEC };
    return next();
  }

  // 2. Determine Dynamic Limit for Tier (from RAM-cached planService)
  let limit = config.aiLimitFree;
  // Độ dài video AI được tạo = độ dài người dùng xuất được (gói + gói mua thêm); route kẹp thêm trần video short
  // (gói không đọc được → dùng gói mặc định cùng tier, hoặc gói free)
  const fallbackPlan = findPlan(null, tier) || findPlan(null, 'free');
  let maxVideoSec = maxRenderableVideoSec(fallbackPlan, bonusVideos);
  try {
    const dynamicPlan = await planService.getPlanById(tier);
    maxVideoSec = maxRenderableVideoSec(dynamicPlan || fallbackPlan, bonusVideos);
    if (planUnverifiable) maxVideoSec = MAX_SHORT_VIDEO_SEC;
    if (dynamicPlan && dynamicPlan.quotas && typeof dynamicPlan.quotas.dailyAiLimit === 'number') {
      limit = dynamicPlan.quotas.dailyAiLimit;
    } else {
      if (tier === 'creator') limit = config.aiLimitCreator;
      if (tier === 'business') limit = config.aiLimitBusiness;
    }
  } catch (planErr) {
    if (tier === 'creator') limit = config.aiLimitCreator;
    if (tier === 'business') limit = config.aiLimitBusiness;
  }

  // If set to -1, unlimited access
  if (limit === -1) {
    req.aiUser = { uid, email, tier, limit: -1, remaining: 9999, maxVideoSec };
    return next();
  }

  // 3. Zero-Cost Daily Reset Key: Format YYYY-MM-DD in Vietnam Time (GMT+7)
  const todayKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());

  // Tracking target: either user's doc or IP address fallback
  const trackingId = uid || `ip_${req.ip.replace(/[^a-zA-Z0-9]/g, '_')}`;
  let currentUsage = 0;

  if (adminDb) {
    try {
      const usageDocRef = adminDb.collection('ai_usage').doc(`${todayKey}_${trackingId}`);
      const usageDoc = await usageDocRef.get();
      if (usageDoc.exists) {
        currentUsage = Number(usageDoc.data()?.count || 0);
      }

      if (currentUsage >= limit) {
        return res.status(429).json({
          error: 'QUOTA_EXCEEDED',
          message: `Bạn đã dùng hết hạn mức AI hôm nay (${limit} lượt / ngày của gói ${tier.toUpperCase()}). Vui lòng nâng cấp gói hoặc quay lại vào ngày mai!`,
          current: currentUsage,
          limit,
          tier,
          resetAt: '00:00 (GMT+7)',
        });
      }

      // Attach increment function to request
      req.incrementAiUsage = async () => {
        try {
          await usageDocRef.set({
            trackingId,
            uid: uid || null,
            email: email || null,
            date: todayKey,
            tier,
            count: currentUsage + 1,
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        } catch (e) {
          console.warn('⚠️ [AiQuotaMiddleware] Failed to increment AI usage count:', e.message);
        }
      };
    } catch (dbErr) {
      console.warn('⚠️ [AiQuotaMiddleware] Firestore usage check failed, passing through:', dbErr.message);
    }
  }

  req.aiUser = {
    uid,
    email,
    tier,
    limit,
    currentUsage,
    remaining: Math.max(0, limit - currentUsage),
    maxVideoSec,
  };

  res.setHeader('X-AI-Quota-Limit', String(limit));
  res.setHeader('X-AI-Quota-Remaining', String(Math.max(0, limit - currentUsage - 1)));

  next();
}
