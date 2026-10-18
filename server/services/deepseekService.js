/**
 * DeepSeek AI Service for XD-Short Studio
 * Supports:
 * - deepseek-chat (DeepSeek-V3: Ultra-fast, creative, viral short writing)
 * - deepseek-reasoner (DeepSeek-R1: Deep reasoning, logic, cognitive psychology)
 * Features:
 * - Automatic thinking token stripping (<think>...</think>)
 * - Separate reasoning_content preservation for Studio UX
 * - Exponential backoff & timeout handling
 */

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Strips reasoning tokens (<think>...</think>) from content and extracts reasoning text
 */
export function sanitizeDeepSeekOutput(rawContent = '', reasoningContent = '') {
  let clean = rawContent || '';
  let extractedReasoning = reasoningContent || '';

  const thinkMatch = clean.match(/<think>([\s\S]*?)<\/think>/i);
  if (thinkMatch) {
    if (!extractedReasoning) {
      extractedReasoning = thinkMatch[1].trim();
    }
    clean = clean.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  }

  // Handle unclosed <think> tags if output was truncated
  if (clean.includes('<think>')) {
    clean = clean.replace(/<think>[\s\S]*$/gi, '').trim();
  }

  return {
    clean: clean.trim(),
    reasoning: extractedReasoning.trim()
  };
}

/**
 * Call DeepSeek API with retry and resilient error handling
 * @param {string} apiKey - DeepSeek API Key
 * @param {Array|string} promptOrMessages - Prompt text or OpenAI-style messages array
 * @param {Object} options - { model, systemPrompt, responseFormat, maxAttempts, timeoutMs }
 */
export async function callDeepSeek(apiKey, promptOrMessages, options = {}) {
  if (!apiKey) {
    const err = new Error('Missing DeepSeek API Key');
    err.status = 401;
    throw err;
  }

  let model = options.model || 'deepseek-chat';
  if (model === 'deepseek-flash' || model === 'deepseek-v3' || model.includes('flash')) {
    model = 'deepseek-chat';
  } else if (model === 'deepseek-r1' || model.includes('reasoner')) {
    model = 'deepseek-reasoner';
  }
  const maxAttempts = options.maxAttempts || 2;
  const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : 45000;

  let messages = [];
  if (Array.isArray(promptOrMessages)) {
    messages = promptOrMessages;
  } else {
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: String(promptOrMessages) });
  }

  const payload = {
    model,
    messages,
    stream: false,
    max_tokens: options.maxTokens || 8192,
  };

  // deepseek-reasoner bỏ qua sampling params nên chỉ gửi temperature cho model chat
  if (typeof options.temperature === 'number' && model !== 'deepseek-reasoner') {
    payload.temperature = options.temperature;
  }

  // Only add response_format for models that support it and when specified
  if (options.responseFormat && (model === 'deepseek-chat' || model === 'deepseek-flash')) {
    payload.response_format = options.responseFormat;
  }

  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errText = await response.text();
        const err = new Error(`DeepSeek API Error (HTTP ${response.status}): ${errText}`);
        err.status = response.status;
        
        // 401 / 403: Fail Fast, do not retry invalid keys
        if (response.status === 401 || response.status === 403) {
          throw err;
        }

        // 429 or 503: retry with backoff
        lastError = err;
        if (attempt < maxAttempts) {
          console.warn(`[DeepSeek Retry] HTTP ${response.status} on attempt ${attempt}. Waiting backoff...`);
          await sleep(attempt * 1500);
          continue;
        }
        throw err;
      }

      const data = await response.json();
      const choice = data.choices?.[0]?.message || {};
      const { clean, reasoning } = sanitizeDeepSeekOutput(choice.content, choice.reasoning_content);

      return {
        text: clean,
        reasoning,
        model,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          promptCacheHitTokens: data.usage?.prompt_cache_hit_tokens || 0,
          promptCacheMissTokens: data.usage?.prompt_cache_miss_tokens || Math.max(0, (data.usage?.prompt_tokens || 0) - (data.usage?.prompt_cache_hit_tokens || 0)),
          completionTokens: data.usage?.completion_tokens || 0,
          reasoningTokens: data.usage?.completion_tokens_details?.reasoning_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        }
      };

    } catch (err) {
      clearTimeout(timer);
      lastError = err;

      if (err.name === 'AbortError') {
        err.message = `DeepSeek request timed out after ${Math.round(timeoutMs / 1000)}s`;
        err.status = 504;
      }

      if (err.status === 401 || err.status === 403) {
        throw err; // Fail fast
      }

      if (attempt < maxAttempts) {
        console.warn(`[DeepSeek Attempt ${attempt} Failed]: ${err.message}. Retrying...`);
        await sleep(attempt * 1500);
      }
    }
  }

  throw lastError || new Error('DeepSeek API failed after multiple attempts');
}

/**
 * Ping test to verify whether a DeepSeek API key is valid
 */
export async function testDeepSeekConnection(apiKey) {
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
    return { ok: false, message: 'Vui lòng nhập DeepSeek API Key.' };
  }

  try {
    const res = await callDeepSeek(apiKey, 'ping', {
      model: 'deepseek-chat',
      maxAttempts: 1,
      timeoutMs: 12000
    });

    return {
      ok: true,
      message: 'Kết nối DeepSeek API thành công!',
      model: res.model
    };
  } catch (err) {
    let msg = err.message || 'Lỗi kết nối';
    if (err.status === 401) {
      msg = 'API Key không hợp lệ hoặc đã bị vô hiệu hóa (401 Unauthorized).';
    } else if (err.status === 402) {
      msg = 'Tài khoản DeepSeek của bạn đã hết số dư / quota (402 Payment Required).';
    } else if (err.status === 429) {
      msg = 'Máy chủ DeepSeek đang bị quá tải hoặc đạt giới hạn lượt gọi (429 Rate Limit).';
    }
    return { ok: false, message: msg };
  }
}
