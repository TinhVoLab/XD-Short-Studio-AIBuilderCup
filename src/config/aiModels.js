/**
 * SSOT model Gemini dùng để viết kịch bản, dùng chung client và server. Lên phiên bản mới chỉ sửa danh sách này.
 * Model không còn trong danh sách (ví dụ đã lưu trong Cài đặt từ trước) được quy về model mặc định.
 */

/** Mới nhất trước: phần tử đầu là mặc định, các phần tử sau là dự phòng khi model trước lỗi */
export const GEMINI_SCRIPT_MODELS = [
  { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash', shortLabel: 'Gemini 3.8' },
];

export const DEFAULT_GEMINI_MODEL = GEMINI_SCRIPT_MODELS[0].id;

export function isGeminiModel(id) {
  return String(id || '').startsWith('gemini');
}

/** Model Gemini hợp lệ cho id (đã ngừng hoặc không rõ → mặc định) */
export function resolveGeminiModel(id) {
  return GEMINI_SCRIPT_MODELS.some((m) => m.id === id) ? id : DEFAULT_GEMINI_MODEL;
}

/** Model kịch bản đã lưu: Gemini cũ → Gemini hiện hành; DeepSeek giữ nguyên */
export function normalizeScriptModel(id) {
  return isGeminiModel(id) ? resolveGeminiModel(id) : id;
}

/** Thứ tự thử: model được chọn trước, rồi các model còn lại trong danh sách */
export function geminiModelChain(preferred) {
  const first = resolveGeminiModel(preferred);
  return [first, ...GEMINI_SCRIPT_MODELS.map((m) => m.id).filter((id) => id !== first)];
}

export function geminiModelLabel(id, { short = false } = {}) {
  const m = GEMINI_SCRIPT_MODELS.find((x) => x.id === resolveGeminiModel(id));
  return short ? m.shortLabel : m.label;
}
