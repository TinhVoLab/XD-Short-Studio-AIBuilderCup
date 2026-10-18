import { TTS_LIMITS } from '../config/aiConfig.js';

/**
 * Chặn lạm dụng TTS: mỗi request tối đa MAX_CHARS_PER_REQUEST ký tự, mỗi người dùng tối đa CHARS_PER_WINDOW
 * ký tự trong WINDOW_MS. Chạy sau verifyAuth (req.user.uid). Bộ đếm trong bộ nhớ từng instance — đủ để chặn
 * script gọi liên tục; Admin không bị giới hạn.
 */
export function createTtsGuard(limits = TTS_LIMITS, now = () => Date.now()) {
  const usage = new Map(); // uid -> { start, chars }

  return function ttsGuard(req, res, next) {
    const text = typeof req.body?.text === 'string' ? req.body.text : '';
    if (text.length > limits.MAX_CHARS_PER_REQUEST) {
      return res.status(413).json({
        error: `Lời thoại một cảnh tối đa ${limits.MAX_CHARS_PER_REQUEST} ký tự (hiện ${text.length}). Hãy tách bớt sang cảnh khác.`,
        code: 'tts/text_too_long',
      });
    }
    if (req.user?.admin) return next();

    const t = now();
    for (const [key, entry] of usage) {
      if (t - entry.start >= limits.WINDOW_MS) usage.delete(key);
    }
    const uid = req.user?.uid || 'unknown';
    const entry = usage.get(uid) || { start: t, chars: 0 };
    if (entry.chars + text.length > limits.CHARS_PER_WINDOW) {
      const retryAfterSec = Math.ceil((entry.start + limits.WINDOW_MS - t) / 1000);
      res.set('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        error: `Bạn đã tạo giọng đọc quá nhiều trong thời gian ngắn. Thử lại sau ${Math.ceil(retryAfterSec / 60)} phút.`,
        code: 'tts/rate_limited',
        retryAfterSec,
      });
    }
    entry.chars += text.length;
    usage.set(uid, entry);
    next();
  };
}

export const ttsGuard = createTtsGuard();
