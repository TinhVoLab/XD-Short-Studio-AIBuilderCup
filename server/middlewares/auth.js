import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin with Project ID & Storage Bucket
let adminApp;
try {
  adminApp = getApps().length > 0 
    ? getApps()[0] 
    : initializeApp({
        projectId: process.env.GCLOUD_PROJECT || 'xd-short',
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'xd-short.firebasestorage.app',
      });
  console.log('✅ Firebase Admin SDK initialized successfully (Project: xd-short, Storage: xd-short.firebasestorage.app)');
} catch (err) {
  console.warn('⚠️ Firebase Admin initialization note:', err.message);
}

export const isFirebaseConfigured = Boolean(
  process.env.GOOGLE_APPLICATION_CREDENTIALS || 
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY || 
  process.env.K_SERVICE || 
  process.env.GAE_SERVICE ||
  process.env.FUNCTION_TARGET ||
  process.env.FIREBASE_CONFIG ||
  process.env.GCLOUD_PROJECT
);

const adminAuth = (adminApp && isFirebaseConfigured) ? getAuth(adminApp) : null;
export const adminDb = (adminApp && isFirebaseConfigured) ? getFirestore(adminApp) : null;
export const adminStorage = (adminApp && isFirebaseConfigured) ? getStorage(adminApp) : null;

export function decodeJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const jsonStr = Buffer.from(b64, 'base64').toString('utf-8');
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

// Admin email whitelist from env or default
const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS || 'tinhvl.g7@gmail.com')
    .toLowerCase()
    .split(',')
    .map(e => e.trim())
    .filter(Boolean)
);

export function checkIsAdmin(email, customClaims = {}) {
  if (customClaims.admin === true || customClaims.role === 'admin') return true;
  if (!email) return false;
  return ADMIN_EMAILS.has(email.toLowerCase().trim());
}

/**
 * Middleware: Verify Firebase ID Token
 * Rejects unauthenticated requests with 401 in < 1ms to minimize CPU & protect server.
 */
export async function verifyAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Vui lòng đăng nhập để thực hiện tác vụ này.',
      code: 'auth/missing_token',
    });
  }

  const idToken = authHeader.split('Bearer ')[1]?.trim();
  if (!idToken) {
    return res.status(401).json({
      error: 'Token xác thực không hợp lệ.',
      code: 'auth/invalid_token',
    });
  }

  // 1. Mock token support strictly for local testing
  if (idToken.startsWith('mock-') && process.env.NODE_ENV !== 'production') {
    req.user = {
      uid: 'dev_local_user',
      email: 'tinhvl.g7@gmail.com',
      name: 'Local Developer',
      role: 'admin',
      admin: true,
    };
    return next();
  }

  // 2. Production: Cryptographic Verification via Firebase Admin SDK
  if (adminAuth) {
    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      const email = (decodedToken.email || '').toLowerCase().trim();
      const isAdmin = checkIsAdmin(email, decodedToken);

      // Auto-provision Custom Claims if user is in ADMIN_EMAILS but lacks claims
      if (isAdmin && (!decodedToken.admin || decodedToken.role !== 'admin')) {
        try {
          await adminAuth.setCustomUserClaims(decodedToken.uid, {
            admin: true,
            role: 'admin',
          });
          console.log(`👑 [Auth Auto-Claims]: Set admin custom claims for ${email} (${decodedToken.uid})`);
          res.setHeader('X-Claims-Updated', 'true');
          if (adminDb) {
            await adminDb.collection('users').doc(decodedToken.uid).set({
              role: 'admin',
              updatedAt: new Date().toISOString(),
            }, { merge: true });
          }
        } catch (claimErr) {
          console.warn('⚠️ [Auth Claims Warning]: Failed to auto-provision claims:', claimErr.message);
        }
      }

      req.user = {
        ...decodedToken,
        email,
        admin: isAdmin,
        role: isAdmin ? 'admin' : (decodedToken.role || 'user'),
        planTier: isAdmin ? 'admin' : (decodedToken.planTier || 'free'),
      };

      // Lazy downgrade check: If user subscription has expired, update Firestore
      if (adminDb && !isAdmin) {
        try {
          const userDocRef = adminDb.collection('users').doc(decodedToken.uid);
          const userDoc = await userDocRef.get();
          if (userDoc.exists) {
            const data = userDoc.data();
            const expiresAt = data?.subscriptionExpiresAt ? new Date(data.subscriptionExpiresAt).getTime() : null;
            if (expiresAt && expiresAt < Date.now() && data?.planTier && data.planTier !== 'free' && data.planTier !== 'admin') {
              console.log(`⏳ [Subscription Expired]: Downgrading UID ${decodedToken.uid} from ${data.planTier} to free`);
              await userDocRef.set({
                planTier: 'free',
                subscriptionStatus: 'expired',
                updatedAt: new Date().toISOString(),
              }, { merge: true });
              req.user.planTier = 'free';
            } else {
              req.user.planTier = data?.planTier || 'free';
            }
            // Video mua thêm còn lại (gói lẻ "Thêm 10 video") — chỉ server ghi trường này
            req.user.bonusVideos = Number(data?.bonusVideos) || 0;
          }
        } catch (e) {
          // Non-blocking
        }
      }

      return next();
    } catch (err) {
      console.warn('🔒 [Auth Verify Error]:', err.message);
      return res.status(401).json({
        error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.',
        code: 'auth/token_verification_failed',
      });
    }
  }

  // If Firebase Admin SDK is not configured in local development environment
  if (process.env.NODE_ENV !== 'production') {
    const payload = decodeJwtPayload(idToken);
    if (payload) {
      const email = (payload.email || '').toLowerCase().trim();
      const isAdmin = checkIsAdmin(email, payload);
      req.user = {
        uid: payload.user_id || payload.sub || payload.uid || 'usr_dev',
        email,
        name: payload.name || payload.display_name || 'Nhà Sáng Tạo',
        admin: isAdmin,
        role: isAdmin ? 'admin' : 'user',
        ...payload,
      };
      return next();
    }
  }

  return res.status(401).json({
    error: 'Hệ thống xác thực chưa được cấu hình đúng cách.',
    code: 'auth/service_unconfigured',
  });
}

/**
 * Optional Auth Middleware:
 * If token is present, verifies it into req.user. If not, continues as guest.
 */
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const idToken = authHeader.split('Bearer ')[1]?.trim();
  if (!idToken) {
    req.user = null;
    return next();
  }

  if (idToken.startsWith('mock-') && process.env.NODE_ENV !== 'production') {
    req.user = {
      uid: 'dev_local_user',
      email: 'dev@xdshort.local',
      name: 'Local Developer',
      admin: true,
    };
    return next();
  }

  if (adminAuth) {
    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      const email = (decodedToken.email || '').toLowerCase().trim();
      const isAdmin = checkIsAdmin(email, decodedToken);
      req.user = {
        ...decodedToken,
        email,
        admin: isAdmin,
        role: isAdmin ? 'admin' : (decodedToken.role || 'user'),
      };
    } catch {
      req.user = null;
    }
  } else if (process.env.NODE_ENV !== 'production') {
    const payload = decodeJwtPayload(idToken);
    if (payload) {
      const email = (payload.email || '').toLowerCase().trim();
      req.user = {
        uid: payload.user_id || payload.sub || payload.uid || 'usr_dev',
        email,
        admin: checkIsAdmin(email, payload),
        ...payload,
      };
    } else {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
}

export { adminApp, adminAuth };
