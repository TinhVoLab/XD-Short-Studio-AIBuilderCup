import assert from 'node:assert';
import { isGeminiModel } from '../../src/config/aiModels.js';

function resolveAiCredentialsMock({
  geminiApiKey = '',
  deepseekApiKey = '',
  aiEngineMode = 'hybrid',
  preferredScriptModel = 'deepseek-flash',
}) {
  let key = (geminiApiKey || '').trim();
  let dsKey = (deepseekApiKey || '').replace(/[\s\uFEFF\xA0]/g, '').trim();

  if (key.startsWith('sk-') && !dsKey) {
    dsKey = key;
    key = '';
  }

  const scriptModel = preferredScriptModel || 'deepseek-flash';
  const isGeminiExplicit = isGeminiModel(scriptModel);
  const isDeepSeekExplicit = scriptModel.startsWith('deepseek');

  if (!key && !dsKey) {
    return {
      apiKey: '',
      deepseekApiKey: '',
      aiEngineMode,
      scriptModel,
      isValid: false,
      code: 'AI_KEY_MISSING',
      errorMessage: 'Chưa cấu hình API Key AI.',
      actionHint: 'Vui lòng vào Cài đặt để thêm Gemini API Key hoặc DeepSeek API Key.',
    };
  }

  if (isGeminiExplicit && !key) {
    return {
      apiKey: '',
      deepseekApiKey: dsKey,
      aiEngineMode,
      scriptModel,
      isValid: false,
      code: 'AI_KEY_MISSING',
      errorMessage: 'Thiếu Gemini API Key.',
      actionHint: 'Mô hình bạn chọn cần Gemini API Key. Vui lòng thêm key trong Cài đặt hoặc chuyển sang mô hình DeepSeek.',
    };
  }

  if (isDeepSeekExplicit && !dsKey) {
    return {
      apiKey: key,
      deepseekApiKey: '',
      aiEngineMode,
      scriptModel,
      isValid: false,
      code: 'AI_KEY_MISSING',
      errorMessage: 'Thiếu DeepSeek API Key.',
      actionHint: 'Mô hình bạn chọn cần DeepSeek API Key. Vui lòng thêm key trong Cài đặt hoặc chuyển sang mô hình Gemini.',
    };
  }

  return {
    apiKey: key,
    deepseekApiKey: dsKey,
    aiEngineMode,
    scriptModel,
    isValid: true,
  };
}

function buildContextPrompt({ prompt, prevScene, nextScene }) {
  const prevContext = prevScene?.voiceoverText
    ? `Cảnh trước nói về: "${prevScene.voiceoverText}". `
    : '';
  const nextContext = nextScene?.voiceoverText
    ? `Cảnh sau nói về: "${nextScene.voiceoverText}". `
    : '';
  const effectivePrompt = (prompt || '').trim() || 'Tạo 1 cảnh sinh động, trực quan phù hợp mạch video';
  return `${prevContext}${nextContext}Yêu cầu cảnh cần tạo: ${effectivePrompt}`;
}

function parseAiServerResponse(data, status = 200) {
  if (status !== 200 || !data || data.error) {
    return {
      success: false,
      message: data?.error || `Lỗi HTTP ${status}`,
      code: data?.code || 'AI_GENERATION_FAILED',
      actionHint: data?.actionHint || '',
    };
  }
  return {
    success: true,
    scene: Array.isArray(data) ? data[0] : data,
  };
}

function runTimelineAiTests() {
  console.log('--- 1. Testing Credential Resolution & Smart sk- Detection ---');
  // Case A: Missing both keys
  const emptyRes = resolveAiCredentialsMock({});
  assert.strictEqual(emptyRes.isValid, false);
  assert.strictEqual(emptyRes.code, 'AI_KEY_MISSING');
  assert.ok(emptyRes.actionHint.includes('Cài đặt'));

  // Case B: User pasted sk- DeepSeek key into Gemini slot
  const skRes = resolveAiCredentialsMock({
    geminiApiKey: 'sk-1234567890abcdef',
    deepseekApiKey: '',
    preferredScriptModel: 'deepseek-chat',
  });
  assert.strictEqual(skRes.isValid, true);
  assert.strictEqual(skRes.apiKey, '');
  assert.strictEqual(skRes.deepseekApiKey, 'sk-1234567890abcdef');

  // Case C: DeepSeek only with DeepSeek model
  const dsRes = resolveAiCredentialsMock({
    deepseekApiKey: 'sk-deepseek-only',
    preferredScriptModel: 'deepseek-flash',
  });
  assert.strictEqual(dsRes.isValid, true);
  assert.strictEqual(dsRes.deepseekApiKey, 'sk-deepseek-only');

  // Case D: Gemini only with Gemini model
  const geminiRes = resolveAiCredentialsMock({
    geminiApiKey: 'AIzaSyA_test_key',
    preferredScriptModel: 'gemini-3.7-flash',
  });
  assert.strictEqual(geminiRes.isValid, true);
  assert.strictEqual(geminiRes.apiKey, 'AIzaSyA_test_key');

  // Case E: User picked Gemini model but only has DeepSeek key
  const mismatchRes = resolveAiCredentialsMock({
    deepseekApiKey: 'sk-only',
    preferredScriptModel: 'gemini-3.7-flash',
  });
  assert.strictEqual(mismatchRes.isValid, false);
  assert.ok(mismatchRes.errorMessage.includes('Gemini'));

  console.log('--- 2. Testing Context-Aware Prompt Generation ---');
  // Bridging between prev and next
  const enriched = buildContextPrompt({
    prompt: 'Số liệu tăng trưởng',
    prevScene: { voiceoverText: 'Năm ngoái công ty gặp nhiều khó khăn' },
    nextScene: { voiceoverText: 'Vậy bí quyết nằm ở đâu?' },
  });
  assert.ok(enriched.includes('Cảnh trước nói về: "Năm ngoái công ty gặp nhiều khó khăn"'));
  assert.ok(enriched.includes('Cảnh sau nói về: "Vậy bí quyết nằm ở đâu?"'));
  assert.ok(enriched.includes('Yêu cầu cảnh cần tạo: Số liệu tăng trưởng'));

  console.log('--- 3. Testing Error Handling & Action Hints ---');
  const serverErrorPayload = {
    code: 'AI_QUOTA_EXCEEDED',
    domain: 'ai',
    error: 'Hạn ngạch gọi AI đã đạt giới hạn.',
    actionHint: 'Vui lòng chờ khoảng 30–60 giây trước khi thử lại.',
  };
  const parsedErr = parseAiServerResponse(serverErrorPayload, 429);
  assert.strictEqual(parsedErr.success, false);
  assert.strictEqual(parsedErr.code, 'AI_QUOTA_EXCEEDED');
  assert.strictEqual(parsedErr.message, 'Hạn ngạch gọi AI đã đạt giới hạn.');
  assert.strictEqual(parsedErr.actionHint, 'Vui lòng chờ khoảng 30–60 giây trước khi thử lại.');

  console.log(' All Timeline AI Integration & Error Handling tests PASSED successfully!');
}

runTimelineAiTests();
