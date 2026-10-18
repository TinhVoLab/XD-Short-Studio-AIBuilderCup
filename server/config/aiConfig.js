// ── AI Centralized Configuration & Pricing SSOT (Single Source of Truth) ──

/**
 * Default Token Pricing (USD per 1,000,000 tokens).
 * Official 2026 reference prices:
 * - Gemini 3.8 Flash: Input $0.75, Output $3.75 (giá giới thiệu tới hết năm — kiểm lại ai.google.dev/pricing)
 * - Gemini 3.7 Flash: Input $0.075, Output $0.30 (giữ để tính lại log cũ)
 * - DeepSeek V3 (chat): Cache Miss $0.14, Cache Hit $0.014, Output $0.28
 * - DeepSeek R1 (reasoner): Cache Miss $0.55, Cache Hit $0.14, Output $2.19
 */
export const DEFAULT_AI_PRICING = {
  'gemini-3.8-flash': {
    inputPerMillion: 0.75,
    outputPerMillion: 3.75,
  },
  'gemini-3.7-flash': {
    inputPerMillion: 0.075,
    outputPerMillion: 0.30,
  },
  'gemini-3.5-flash-lite': {
    inputPerMillion: 0.05,
    outputPerMillion: 0.20,
  },
  'gemini-2.0-flash': {
    inputPerMillion: 0.10,
    outputPerMillion: 0.40,
  },
  'deepseek-chat': {
    cacheMissPerMillion: 0.14,
    cacheHitPerMillion: 0.014,
    outputPerMillion: 0.28,
  },
  'deepseek-reasoner': {
    cacheMissPerMillion: 0.55,
    cacheHitPerMillion: 0.14,
    outputPerMillion: 2.19,
  },
};

/**
 * Default USD to VND exchange rate.
 * Can be overridden dynamically via Firestore `system_settings/app_config`.
 */
export const DEFAULT_USD_VND_RATE = 25400;

/**
 * Single source of truth for Date Key in Vietnam timezone (GMT+7).
 * Format: YYYY-MM-DD
 */
export function getVietnamDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(date);
}

// Thời gian chờ AI: SSOT tại src/config/aiTimeouts.js (dùng chung client + server)

/**
 * Giới hạn TTS (/api/ai/edge-tts, /api/ai/tts) theo người dùng — đo bằng số ký tự vì chi phí tỉ lệ với độ dài.
 * Video short ≤ 90 giây ≈ 250 từ ≈ 1.400 ký tự: hạn mức cửa sổ đủ cho nhiều lần tạo lại giọng một video.
 */
export const TTS_LIMITS = {
  MAX_CHARS_PER_REQUEST: 800,
  CHARS_PER_WINDOW: 10000,
  WINDOW_MS: 10 * 60 * 1000,
};
