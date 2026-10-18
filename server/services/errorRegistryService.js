import fs from 'fs';
import path from 'path';
import { AppError } from '../utils/AppError.js';
import { recordJobEnd } from '../middlewares/quota.js';

/**
 * Bảng từ điển lỗi chuẩn hóa toàn diện cho XD-Short Studio.
 */
export const ERROR_REGISTRY = {
  // ── AI Generation Domain ──
  AI_KEY_MISSING: {
    code: 'AI_KEY_MISSING',
    statusCode: 401,
    domain: 'ai',
    userMessage: 'Chưa cấu hình API Key AI.',
    actionHint: 'Vui lòng vào Cài đặt để thêm Gemini API Key hoặc DeepSeek API Key.'
  },
  AI_QUOTA_EXCEEDED: {
    code: 'AI_QUOTA_EXCEEDED',
    statusCode: 429,
    domain: 'ai',
    userMessage: 'Hạn ngạch gọi AI đã đạt giới hạn (Rate Limit / Quota Exceeded).',
    actionHint: 'Vui lòng chờ khoảng 30–60 giây trước khi thử lại, hoặc chuyển sang mô hình AI khác.'
  },
  AI_PARSE_FAILED: {
    code: 'AI_PARSE_FAILED',
    statusCode: 422,
    domain: 'ai',
    userMessage: 'Phản hồi từ AI không đúng định dạng JSON kịch bản.',
    actionHint: 'Hệ thống đã kích hoạt cơ chế tự động thử lại. Nếu vẫn lỗi, hãy thử làm ngắn chủ đề hơn.'
  },
  AI_GENERATION_TIMEOUT: {
    code: 'AI_GENERATION_TIMEOUT',
    statusCode: 504,
    domain: 'ai',
    userMessage: 'Thời gian AI tạo kịch bản vượt quá giới hạn chờ.',
    actionHint: 'Mô hình AI đang quá tải. Hãy thử chọn mô hình Flash để có tốc độ phản hồi nhanh hơn.'
  },

  // ── TTS Domain ──
  TTS_SYNTHESIS_FAILED: {
    code: 'TTS_SYNTHESIS_FAILED',
    statusCode: 502,
    domain: 'tts',
    userMessage: 'Không thể tổng hợp giọng đọc từ máy chủ âm thanh.',
    actionHint: 'Đang tự động chuyển sang giọng đọc dự phòng, vui lòng thử lại sau giây lát.'
  },

  // ── Media & Asset Domain ──
  ASSET_DOWNLOAD_FAILED: {
    code: 'ASSET_DOWNLOAD_FAILED',
    statusCode: 404,
    domain: 'asset',
    userMessage: 'Không thể tải tài nguyên hình ảnh hoặc âm thanh bên ngoài.',
    actionHint: 'Hệ thống đã tự động thay thế bằng hình nền an toàn để không làm gián đoạn video.'
  },

  // ── Render Domain ──
  RENDER_BUDGET_EXCEEDED: {
    code: 'RENDER_BUDGET_EXCEEDED',
    statusCode: 504,
    domain: 'render',
    userMessage: 'Video cần quá nhiều thời gian để xuất (vượt giới hạn thời gian render).',
    actionHint: 'Hãy rút ngắn video hoặc bớt cảnh rồi xuất lại — lần này không bị trừ lượt.'
  },
  RENDER_STALLED: {
    code: 'RENDER_STALLED',
    statusCode: 504,
    domain: 'render',
    userMessage: 'Máy render bị treo giữa chừng.',
    actionHint: 'Vui lòng xuất lại — lần này không bị trừ lượt.'
  },
  RENDER_OOM: {
    code: 'RENDER_OOM',
    statusCode: 500,
    domain: 'render',
    userMessage: 'Máy chủ thiếu bộ nhớ tạm thời khi render (Out of Memory).',
    actionHint: 'Khuyên dùng độ phân giải 720p hoặc rút ngắn bớt thời lượng video để render mượt mà.'
  },
  RENDER_CHROMIUM_CRASH: {
    code: 'RENDER_CHROMIUM_CRASH',
    statusCode: 500,
    domain: 'render',
    userMessage: 'Trình render Chromium gặp sự cố bất ngờ.',
    actionHint: 'Hệ thống đang tự khởi động lại Chromium để render lại cho bạn.'
  },
  RENDER_BUNDLE_FAILED: {
    code: 'RENDER_BUNDLE_FAILED',
    statusCode: 500,
    domain: 'render',
    userMessage: 'Lỗi đóng gói mã nguồn video (Webpack Bundle Error).',
    actionHint: 'Vui lòng kiểm tra lại cú pháp các thành phần tùy biến hoặc liên hệ hỗ trợ kỹ thuật.'
  },

  // ── Generic & Storage ──
  INTERNAL_ERROR: {
    code: 'INTERNAL_ERROR',
    statusCode: 500,
    domain: 'system',
    userMessage: 'Đã xảy ra sự cố nội bộ ngoài dự kiến.',
    actionHint: 'Vui lòng thử lại sau giây lát.'
  }
};

/**
 * Chuyển đổi bất kỳ lỗi nào (native Error, Axios, Gemini, Remotion) thành AppError chuẩn.
 * @param {any} err
 * @param {'ai'|'tts'|'render'|'asset'|'storage'} [defaultDomain='ai']
 * @returns {AppError}
 */
export function normalizeError(err, defaultDomain = 'ai') {
  if (err instanceof AppError) {
    return err;
  }

  const msg = err?.message || String(err || '');
  const status = err?.status || err?.statusCode || err?.response?.status;

  // 0. Lỗi render của watchdog (phải xét trước luật "timeout" chung của AI)
  if (/JOB_TIMEOUT/.test(msg)) {
    return new AppError({ ...ERROR_REGISTRY.RENDER_BUDGET_EXCEEDED, technicalMessage: msg, originalError: err });
  }
  if (/RENDER_STALL/.test(msg)) {
    return new AppError({ ...ERROR_REGISTRY.RENDER_STALLED, technicalMessage: msg, originalError: err });
  }

  // 1. Nhận diện lỗi AI Quota / Rate Limit
  if (status === 429 || /RESOURCE_EXHAUSTED|rate_limit_exceeded|insufficient_quota|Too Many Requests/i.test(msg)) {
    return new AppError({
      ...ERROR_REGISTRY.AI_QUOTA_EXCEEDED,
      technicalMessage: msg,
      originalError: err
    });
  }

  // 2. Nhận diện lỗi AI Missing Key
  if (status === 401 || /Missing API Key|API_KEY_INVALID|Unauthorized/i.test(msg)) {
    return new AppError({
      ...ERROR_REGISTRY.AI_KEY_MISSING,
      technicalMessage: msg,
      originalError: err
    });
  }

  // 3. Nhận diện lỗi AI Timeout
  if (/timeout|timed out|ETIMEDOUT|ESOCKETTIMEDOUT|deadline exceeded/i.test(msg)) {
    return new AppError({
      ...ERROR_REGISTRY.AI_GENERATION_TIMEOUT,
      technicalMessage: msg,
      originalError: err
    });
  }

  // 4. Nhận diện lỗi JSON Parse
  if (/Unexpected token|JSON Parse error|is not valid JSON/i.test(msg)) {
    return new AppError({
      ...ERROR_REGISTRY.AI_PARSE_FAILED,
      technicalMessage: msg,
      originalError: err
    });
  }

  // 5. Nhận diện lỗi Chromium OOM (Exit code 137)
  if (/exit code 137|SIGKILL|out of memory|OOM/i.test(msg)) {
    return new AppError({
      ...ERROR_REGISTRY.RENDER_OOM,
      technicalMessage: msg,
      originalError: err
    });
  }

  // 6. Nhận diện Chromium Crash
  if (/Target closed|Protocol error|Session closed|Browser closed/i.test(msg)) {
    return new AppError({
      ...ERROR_REGISTRY.RENDER_CHROMIUM_CRASH,
      technicalMessage: msg,
      originalError: err
    });
  }

  // Fallback mặc định
  return new AppError({
    code: `${defaultDomain.toUpperCase()}_ERROR`,
    statusCode: typeof status === 'number' && status >= 400 && status < 600 ? status : 500,
    domain: defaultDomain,
    technicalMessage: msg,
    userMessage: msg || ERROR_REGISTRY.INTERNAL_ERROR.userMessage,
    actionHint: ERROR_REGISTRY.INTERNAL_ERROR.actionHint,
    originalError: err
  });
}

/**
 * Tự động dọn dẹp tài nguyên an toàn và giải phóng quota người dùng.
 * @param {Object} options
 * @param {string} [options.jobId]
 * @param {string} [options.uid]
 * @param {string} [options.tempDir]
 * @param {boolean} [options.refund] job lỗi phía server → hoàn lượt render tháng
 */
export function safeCleanup({ jobId, uid, tempDir, refund = false, charge = null } = {}) {
  try {
    if (uid && jobId) {
      recordJobEnd(uid, jobId, { refund, charge });
    }
  } catch (quotaErr) {
    console.warn(`[SafeCleanup] Quota release warning for job ${jobId}:`, quotaErr.message);
  }

  try {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  } catch (fsErr) {
    console.warn(`[SafeCleanup] Temp dir cleanup warning for ${tempDir}:`, fsErr.message);
  }
}

/**
 * Xử lý lỗi tập trung cho Express route.
 */
export function handleGlobalHttpError(err, res, defaultDomain = 'ai') {
  const appErr = normalizeError(err, defaultDomain);
  console.error(`[ErrorRegistry] [${appErr.domain.toUpperCase()}] ${appErr.code}: ${appErr.technicalMessage}`);
  return res.status(appErr.statusCode).json(appErr.toJSON());
}
