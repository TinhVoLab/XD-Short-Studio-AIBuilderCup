import { auth } from './firebase';

/**
 * Centralized API configuration.
 * - Set VITE_API_URL in your .env file to override the backend endpoint.
 * - In production, defaults to '' (same-origin relative /api calls routed via Firebase Hosting rewrites).
 * - In local development, defaults to 'http://localhost:4000'.
 */
export const API_BASE = (import.meta as any).env?.VITE_API_URL
  ? String((import.meta as any).env.VITE_API_URL).trim().replace(/\/+$/, '')
  : ((import.meta as any).env?.DEV ? 'http://localhost:4000' : '');

export interface ApiFetchOptions extends RequestInit {
  /**
   * If true, skips automatic 401 silent token refresh and retry.
   * Useful for background sync tasks like fetchRemoteQuota to prevent onIdTokenChanged loops.
   */
  skipRetry?: boolean;
  /**
   * Internal guard to prevent infinite retry loops.
   */
  isRetry?: boolean;
}

// ── 401 Interceptor & Inversion-of-Control (IoC) Registry ──

const _unauthorizedListeners = new Set<() => void>();
let _lastUnauthorizedNotice = 0;
const NOTICE_COOLDOWN_MS = 3000; // Debounce 401 Storm

/**
 * Register a global listener for terminal 401 Unauthorized events.
 * Returns a cleanup function for React useEffect hooks.
 */
export function registerUnauthorizedCallback(listener: () => void): () => void {
  _unauthorizedListeners.add(listener);
  return () => {
    _unauthorizedListeners.delete(listener);
  };
}

function triggerUnauthorizedNotice() {
  const now = Date.now();
  if (now - _lastUnauthorizedNotice < NOTICE_COOLDOWN_MS) {
    return; // Storm shield: avoid spamming toasts/modals
  }
  _lastUnauthorizedNotice = now;

  _unauthorizedListeners.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.error('[apiFetch] Error in unauthorized listener:', e);
    }
  });
}

// ── Shared Refresh Mutex with Timeout Guard ──

let _refreshPromise: Promise<string | null> | null = null;
const REFRESH_TIMEOUT_MS = 10_000; // 10 seconds timeout for poor connections

/**
 * Safely force-refreshes the Firebase ID token.
 * All concurrent 401 requests share a single in-flight promise (Mutex).
 */
export function forceRefreshToken(customUser?: any): Promise<string | null> {
  if (_refreshPromise) {
    return _refreshPromise;
  }

  const user = customUser || auth.currentUser;
  if (!user) {
    return Promise.resolve(null);
  }

  _refreshPromise = Promise.race([
    user.getIdToken(true),
    new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('Firebase token refresh timed out')), REFRESH_TIMEOUT_MS)
    ),
  ])
    .then((token) => token)
    .catch((err) => {
      console.warn('⚠️ [apiFetch] Silent token refresh failed:', err?.message || err);
      return null;
    })
    .finally(() => {
      _refreshPromise = null;
    });

  return _refreshPromise;
}

/**
 * Helper to get authorization headers with fresh Firebase ID token
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) return {};

  try {
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
  } catch (err) {
    console.warn('Failed to retrieve Firebase ID token:', err);
    return {};
  }
}

/**
 * Enterprise Enhanced fetch wrapper:
 * 1. Automatically attaches the Firebase ID token.
 * 2. On 401: Silently force-refreshes token via shared Mutex and retries ONCE.
 * 3. Terminal 401: Triggers debounced onUnauthorized listeners (Inversion of Control).
 */
export async function apiFetch(input: RequestInfo | URL, init?: ApiFetchOptions): Promise<Response> {
  const authHeaders = await getAuthHeaders();
  const headers = new Headers(init?.headers || {});

  for (const [k, v] of Object.entries(authHeaders)) {
    if (!headers.has(k)) {
      headers.set(k, v);
    }
  }

  const res = await fetch(input, {
    ...init,
    headers,
  });

  // Enterprise 2026 Resilience: Silent Refresh & Single Auto-Retry
  if (res.status === 401 && !init?.skipRetry && !init?.isRetry) {
    const user = auth.currentUser;
    if (user) {
      const freshToken = await forceRefreshToken();
      if (freshToken) {
        const retryHeaders = new Headers(init?.headers || {});
        retryHeaders.set('Authorization', `Bearer ${freshToken}`);

        const retryRes = await apiFetch(input, {
          ...init,
          headers: retryHeaders,
          isRetry: true,
        });

        if (retryRes.status !== 401) {
          return retryRes;
        }
      }
    }

    // Terminal 401: User is null, refresh failed, or retry still returned 401
    triggerUnauthorizedNotice();
  }

  return res;
}
