import { verifyAuth } from './auth.js';

/**
 * Middleware: Verify Super Admin Privileges
 * Strictly enforces that only authorized administrators (via ADMIN_EMAILS or Custom Claims) can access admin endpoints.
 * Rejects unauthorized users with 403 Forbidden.
 */
export async function verifySuperAdmin(req, res, next) {
  // First ensure user is authenticated via standard Firebase token
  verifyAuth(req, res, () => {
    const isSuperAdmin = Boolean(req.user?.admin || req.user?.role === 'admin');

    if (!isSuperAdmin) {
      console.warn(`🔒 [Admin Access Denied]: Unauthorized attempt by "${req.user?.email || req.user?.uid}" to ${req.originalUrl}`);
      return res.status(403).json({
        error: 'Quyền truy cập bị từ chối: Khu vực này chỉ dành riêng cho Super Admin.',
        code: 'admin/forbidden',
      });
    }

    next();
  });
}
