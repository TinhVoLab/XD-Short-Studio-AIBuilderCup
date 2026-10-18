import assert from 'assert/strict'
import { GEMINI_SCRIPT_MODELS, DEFAULT_GEMINI_MODEL, resolveGeminiModel, normalizeScriptModel, geminiModelChain, isGeminiModel } from '@/config/aiModels'

// Mặc định là model đầu danh sách (mới nhất)
assert.equal(DEFAULT_GEMINI_MODEL, GEMINI_SCRIPT_MODELS[0].id)
// Model đã ngừng (đã lưu trong Cài đặt / bản nháp) → model hiện hành; DeepSeek giữ nguyên
assert.equal(resolveGeminiModel('gemini-3.7-flash'), DEFAULT_GEMINI_MODEL)
assert.equal(normalizeScriptModel('gemini-3.7-flash'), DEFAULT_GEMINI_MODEL)
assert.equal(normalizeScriptModel('deepseek-reasoner'), 'deepseek-reasoner')
assert.equal(resolveGeminiModel('deepseek-flash'), DEFAULT_GEMINI_MODEL)
assert.equal(isGeminiModel('deepseek-flash'), false)
// Chuỗi thử: model được chọn trước, mỗi model một lần
for (const m of GEMINI_SCRIPT_MODELS) {
  const chain = geminiModelChain(m.id)
  assert.equal(chain[0], m.id)
  assert.equal(new Set(chain).size, GEMINI_SCRIPT_MODELS.length)
}
