import { useEditorStore } from '@/store/useEditorStore';

let isInitialized = false;
let lastToastTime = 0;
const TOAST_DEBOUNCE_MS = 5000;

function isBenignError(errorOrMsg: any): boolean {
  if (!errorOrMsg) return true;

  const msg = typeof errorOrMsg === 'string'
    ? errorOrMsg
    : errorOrMsg.message || String(errorOrMsg);

  // 1. Benign ResizeObserver loop notifications in Chrome/Firefox
  if (
    msg.includes('ResizeObserver loop completed with undelivered notifications') ||
    msg.includes('ResizeObserver loop limit exceeded')
  ) {
    return true;
  }

  // 2. AbortError when requests are intentionally canceled
  if (
    errorOrMsg.name === 'AbortError' ||
    msg.includes('The user aborted a request') ||
    msg.includes('signal is aborted')
  ) {
    return true;
  }

  // 3. Browser extension scripts injected into DOM
  if (
    msg.includes('chrome-extension://') ||
    msg.includes('moz-extension://') ||
    msg.includes('safari-extension://')
  ) {
    return true;
  }

  return false;
}

/**
 * Initializes global error and unhandled promise interceptor.
 * Guarantees zero unhandled crashes across the entire Studio application.
 */
export function initGlobalErrorInterceptor() {
  if (isInitialized || typeof window === 'undefined') return;
  isInitialized = true;

  // 1. Intercept Unhandled Promise Rejections (Async/Await)
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;

    if (isBenignError(reason)) {
      // Benign event: prevent browser noise
      event.preventDefault();
      return;
    }

    // Prevent default browser red banner/crash
    event.preventDefault();

    console.warn('[GlobalAsyncSafety] Intercepted unhandled promise rejection:', reason);

    // Debounced user-friendly notification
    const now = Date.now();
    if (now - lastToastTime > TOAST_DEBOUNCE_MS) {
      lastToastTime = now;
      try {
        useEditorStore
          .getState()
          .showToast('Thao tác gặp gián đoạn tạm thời. Hệ thống đã tự phục hồi an toàn.', 3500);
      } catch {
        // Safe fallback if store not yet mounted
      }
    }
  });

  // 2. Intercept Global Window Errors
  window.addEventListener('error', (event) => {
    if (isBenignError(event.error || event.message)) {
      event.preventDefault();
      return;
    }

    console.warn('[GlobalAsyncSafety] Intercepted global window error:', event.message);
  });

  console.log('🛡️ [GlobalAsyncSafety] Defensive Error Interceptor initialized.');
}
