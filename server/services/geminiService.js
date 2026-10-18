import { GoogleGenAI } from '@google/genai';
import { telemetry } from './telemetryService.js';
import { geminiModelChain } from '../../src/config/aiModels.js';

// ── Gemini Helper with Resilient Multi-Model Fallback & Exponential Backoff ──
// Danh sách model: SSOT src/config/aiModels.js (model được chọn trước, rồi các model dự phòng)
const GEMINI_MODELS = geminiModelChain();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isAuthError(err) {
  const msg = (err?.message || '').toLowerCase();
  const status = err?.status || err?.statusCode || err?.response?.status;
  return status === 401 || status === 403 || msg.includes('api_key_invalid') || msg.includes('unauthenticated') || msg.includes('permission denied');
}

function deadlineError(lastErr) {
  const err = new Error(`Gemini deadline exceeded${lastErr?.message ? ` (${lastErr.message})` : ''}`);
  err.status = 504;
  err.isTimeout = true;
  return err;
}

/** Gemini 3 nhận thinkingConfig.thinkingLevel (LOW/MEDIUM/HIGH; 3.8 Flash không nhận MINIMAL); Gemini 2.5 dùng thinkingBudget */
const isThinkingLevelModel = (model) => /^gemini-3/.test(model);
const FAST_THINKING_LEVEL = 'LOW';

function isInvalidArgument(err) {
  const status = err?.status || err?.statusCode || err?.response?.status;
  return status === 400 || /invalid_argument|thinking/i.test(err?.message || '');
}

function isRateLimitError(err) {
  const msg = (err?.message || '').toLowerCase();
  const status = err?.status || err?.statusCode || err?.response?.status;
  return status === 429 || msg.includes('resource_exhausted') || msg.includes('rate limit') || msg.includes('quota exceeded');
}

async function callGemini(apiKey, prompt, options = {}) {
  if (!apiKey) {
    const authErr = new Error('Missing Gemini API Key');
    authErr.status = 401;
    telemetry.recordAuthFailure(authErr);
    throw authErr;
  }

  const ai = new GoogleGenAI({ apiKey });
  let lastErr = null;
  const maxAttempts = options.maxAttempts || 3;
  // deadlineMs: mốc thời gian tuyệt đối (Date.now()) — hết hạn thì dừng thử model/lượt kế tiếp
  const deadline = Number(options.deadlineMs) || 0;
  const timeLeft = () => (deadline ? deadline - Date.now() : Infinity);

  const models = geminiModelChain(options.model);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    for (const model of models) {
      if (timeLeft() <= 0) throw deadlineError(lastErr);
      const isJsonRequest = options.config?.responseMimeType === 'application/json';

      // 1. Try Interactions API only for non-structured text requests
      if (!isJsonRequest && ai.interactions && typeof ai.interactions.create === 'function') {
        try {
          const interaction = await ai.interactions.create({
            model,
            input: prompt,
          });
          if (interaction && interaction.output_text) {
            return { text: interaction.output_text };
          }
        } catch (intErr) {
          if (isAuthError(intErr)) {
            console.error('[Gemini Auth] Invalid API Key - Fail Fast:', intErr.message);
            intErr.status = 401;
            telemetry.recordAuthFailure(intErr);
            throw intErr; // Fail Fast
          }
          // Fallback to generateContent
        }
      }

      // 2. Try models.generateContent API (Full feature support for JSON mode & config)
      try {
        const config = { ...(options.config || {}) };
        // Request có hạn chót: Gemini 3 mặc định suy nghĩ mức cao, sinh JSON cả video quá 20–30 s → hạ mức suy nghĩ
        if (deadline && !config.thinkingConfig && isThinkingLevelModel(model)) config.thinkingConfig = { thinkingLevel: FAST_THINKING_LEVEL };
        const controller = deadline ? new AbortController() : null;
        const timer = controller ? setTimeout(() => controller.abort(), timeLeft()) : null;
        if (controller) config.abortSignal = controller.signal;
        const startedAt = Date.now();
        let response;
        try {
          response = await ai.models.generateContent({ model, contents: prompt, config });
        } catch (cfgErr) {
          // Model không nhận thinkingLevel (400) → gọi lại đúng model đó với cấu hình gốc
          if (!config.thinkingConfig || options.config?.thinkingConfig || !isInvalidArgument(cfgErr) || timeLeft() <= 0) throw cfgErr;
          delete config.thinkingConfig;
          response = await ai.models.generateContent({ model, contents: prompt, config });
        } finally {
          if (timer) clearTimeout(timer);
        }
        console.log(`[Gemini] ${model} trả lời sau ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);
        if (response) {
          response.usage = {
            promptTokens: response.usageMetadata?.promptTokenCount || 0,
            completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
            totalTokens: response.usageMetadata?.totalTokenCount || 0,
          };
          response.resolvedModel = model;
        }
        return response;
      } catch (err) {
        lastErr = err;
        if (timeLeft() <= 0) {
          console.warn(`[Gemini] ${model} chưa trả lời khi hết hạn chót`);
          throw deadlineError(lastErr);
        }

        // B_401: Auth Error -> FAIL FAST (Không retry tốn tài nguyên)
        if (isAuthError(err)) {
          console.error('[Gemini Auth] Invalid API Key - Fail Fast:', err.message);
          err.status = 401;
          telemetry.recordAuthFailure(err);
          throw err;
        }

        // B_429: Rate limit error -> Kiểm tra lượt thử & Backoff
        if (isRateLimitError(err)) {
          console.warn(`[Gemini RateLimit] Model ${model} rate limited (Attempt ${attempt}/${maxAttempts}).`);
          telemetry.recordGeminiRetry(attempt, model, { reason: 'RateLimit 429' });
          break; // Thoát vòng lặp model để kích hoạt Exponential Backoff cho toàn bộ request
        }

        telemetry.recordGeminiFailure(err, model);
        console.warn(`[Gemini Fallback] Model ${model} failed (${err.message || err}). Trying next candidate...`);
      }
    }

    // Nếu gặp RateLimit hoặc Lỗi mạng, tính toán Exponential Backoff trước lần thử tiếp theo
    if (attempt < maxAttempts) {
      const backoffMs = attempt === 1 ? 1000 : 3000; // Backoff 1s -> 3s theo đúng spec V9
      if (timeLeft() <= backoffMs) throw deadlineError(lastErr);
      console.log(`[Gemini Resilience] Backoff waiting ${backoffMs}ms before attempt ${attempt + 1}...`);
      await sleep(backoffMs);
    }
  }

  // Dead-Letter Alert: Hết lượt thử tối đa
  const deadLetterErr = new Error(`[DeadLetter] Đã thử ${maxAttempts} lần nhưng Gemini API không phản hồi: ${lastErr?.message || 'Unknown error'}`);
  deadLetterErr.status = lastErr?.status || 503;
  deadLetterErr.isDeadLetter = true;
  telemetry.recordDeadLetterAlert(deadLetterErr);
  throw deadLetterErr;
}

export { GEMINI_MODELS, callGemini, isAuthError, isRateLimitError };
