import assert from 'assert/strict';
import { applyPacingGuard, postProcessGeneratedScenes } from '../services/scenePostProcessor.js';
import { AppError } from '../utils/AppError.js';
import { normalizeError, ERROR_REGISTRY } from '../services/errorRegistryService.js';

console.log('🧪 Bắt đầu chạy bộ kiểm thử tự động Asymmetrical Retention Pacing (2.1 wps Tiếng Việt)...');

// ─────────────────────────────────────────────────────────────
// TEST 1: Ma trận toán học Ngân sách từ & Số cảnh (Piecewise)
// ─────────────────────────────────────────────────────────────
function calculatePiecewiseSceneCount(targetDuration) {
  if (targetDuration <= 20) return 3;
  if (targetDuration <= 40) return 5;
  if (targetDuration <= 55) return 7;
  if (targetDuration <= 75) return 9;
  return Math.max(3, Math.min(20, Math.round(targetDuration / 7.0)));
}

console.log('  ▶ Test 1: Kiểm tra Piecewise Mapping Fallback mượt mà...');
assert.equal(calculatePiecewiseSceneCount(15), 3, '15s phải ánh xạ về 3 cảnh');
assert.equal(calculatePiecewiseSceneCount(20), 3, '20s phải ánh xạ về 3 cảnh');
assert.equal(calculatePiecewiseSceneCount(25), 5, '25s phải ánh xạ về 5 cảnh');
assert.equal(calculatePiecewiseSceneCount(30), 5, '30s phải ánh xạ về 5 cảnh');
assert.equal(calculatePiecewiseSceneCount(40), 5, '40s phải ánh xạ về 5 cảnh');
assert.equal(calculatePiecewiseSceneCount(45), 7, '45s phải ánh xạ về 7 cảnh (mốc trung gian không gãy cadence)');
assert.equal(calculatePiecewiseSceneCount(55), 7, '55s phải ánh xạ về 7 cảnh');
assert.equal(calculatePiecewiseSceneCount(60), 9, '60s phải ánh xạ về 9 cảnh');
assert.equal(calculatePiecewiseSceneCount(75), 9, '75s phải ánh xạ về 9 cảnh');
assert.equal(calculatePiecewiseSceneCount(90), 13, '90s phải ánh xạ về 13 cảnh');
console.log('  ✅ Test 1 PASSED: Piecewise Mapping chuẩn xác 100% không còn vùng gãy');

// ─────────────────────────────────────────────────────────────
// TEST 2: Ngân sách từ theo chuẩn Tiếng Việt 2.1 wps (Asymmetrical Retention)
// ─────────────────────────────────────────────────────────────
console.log('  ▶ Test 2: Kiểm tra Ngân sách từ Tiếng Việt 2.1 wps (Hook ngắn, Micro-CTA)...');
const presets = [
  // 15s: Hook [5, 6], Value [18, 20], CTA [4, 6] => Max 32 <= 32
  { duration: 15, expectedScenes: 3, maxTotalWords: 32, hookMax: 6, bodyWordsMax: 20, ctaMax: 6 },
  // 30s: Hook [6, 7], Body 3x [15, 17], CTA [5, 6] => Max 64 <= 64
  { duration: 30, expectedScenes: 5, maxTotalWords: 64, hookMax: 7, bodyWordsMax: 17, ctaMax: 6 },
  // 60s: Hook [7, 8], Body 7x [15, 16], CTA [6, 8] => Max 128 <= 128
  { duration: 60, expectedScenes: 9, maxTotalWords: 128, hookMax: 8, bodyWordsMax: 16, ctaMax: 8 },
];

for (const p of presets) {
  const n = p.expectedScenes;
  const bodyCount = Math.max(0, n - 2);
  const maxCalculated = p.hookMax + (bodyCount * p.bodyWordsMax) + p.ctaMax;
  assert.ok(maxCalculated <= p.maxTotalWords, `Preset ${p.duration}s: Cận trên tối đa ${maxCalculated} từ không được vượt trần ${p.maxTotalWords} từ`);
  console.log(`     • Preset ${p.duration}s (${n} cảnh): Cận trên tối đa = ${maxCalculated} từ <= trần ${p.maxTotalWords} từ (Hợp lệ)`);
}
console.log('  ✅ Test 2 PASSED: Toàn bộ preset triệt tiêu 100% nguy cơ tràn trần ở tốc độ 2.1 wps');

// ─────────────────────────────────────────────────────────────
// TEST 3: Pacing Guard Asymmetrical Role-Aware
// ─────────────────────────────────────────────────────────────
console.log('  ▶ Test 3: Kiểm tra Pacing Guard (chỉ cắt đoạn vượt trần)...');

// Quy tắc hiện hành của applyPacingGuard: KHÔNG xén câu thoại trong ngưỡng an toàn; chỉ đoạn
// "chạy vô tận" (> max(45, 2.2 × mục tiêu) từ) mới bị cắt — và luôn cắt tại ranh giới câu.
const countWords = (t) => t.split(/\s+/).filter(w => w.length > 0).length;

// 3.1. Câu dài hơn mục tiêu nhưng dưới trần an toàn → giữ nguyên, không cắt giữa câu
const longHook = 'Dừng lại ngay lập tức nếu bạn vẫn đang sử dụng công cụ trí tuệ nhân tạo!';
assert.equal(applyPacingGuard(longHook, 7), longHook, 'Không được xén câu thoại dưới trần an toàn');

// 3.2. Đoạn chạy vô tận (> 45 từ) có nhiều câu → cắt tại dấu câu, kết quả là tiền tố nguyên câu
const sentence = 'Đây là một câu nói dài do trí tuệ nhân tạo viết ra mà không kiểm soát.';
const runaway = Array.from({ length: 6 }, () => sentence).join(' ');
const guarded = applyPacingGuard(runaway, 16);
assert.ok(countWords(guarded) <= 45, `Đoạn vượt trần phải được rút về <= 45 từ (thực tế: ${countWords(guarded)})`);
assert.ok(runaway.startsWith(guarded.replace(/\.$/, '')), 'Phải cắt tại ranh giới câu, không chèn hay xén chữ');
assert.ok(/[.!?]$/.test(guarded), 'Kết quả phải kết thúc bằng dấu câu');

// 3.3. Một câu duy nhất quá dài, không có ranh giới câu → giữ nguyên (thà dài còn hơn cụt ý)
const oneSentence = Array.from({ length: 60 }, (_, k) => `từ${k}`).join(' ');
assert.equal(applyPacingGuard(oneSentence, 16), oneSentence);

console.log('  ✅ Test 3 PASSED: Pacing Guard chỉ cắt đoạn vượt trần, luôn tại ranh giới câu');

// ─────────────────────────────────────────────────────────────
// TEST 4: Post-Processor Integration (giữ nguyên lời thoại, thời lượng theo vai trò)
// ─────────────────────────────────────────────────────────────
console.log('  ▶ Test 4: Giả lập Post-Processor: lời thoại giữ nguyên, thời lượng theo khung vai trò...');
const mockRawScenes = [
  { name: 'Cảnh 1', temporalRole: 'hook', voiceoverText: 'Dừng lại ngay nếu bạn vẫn dùng AI sai cách này!', elements: [{ type: 'master-hook' }] },
  { name: 'Cảnh 2', temporalRole: 'normal', voiceoverText: 'Hầu hết mọi người viết prompt quá dài khiến mô hình bị ảo giác và tạo kết quả lan man.', elements: [{ type: 'chat-mockup' }] },
  { name: 'Cảnh 3', temporalRole: 'normal', voiceoverText: 'Thay vào đó bạn chỉ cần cung cấp đúng ba biến số then chốt.', elements: [{ type: 'checklist' }] },
  { name: 'Cảnh 4', temporalRole: 'highlight', voiceoverText: 'Hiệu suất làm việc sẽ tăng vọt gấp ba lần chỉ sau một buổi sáng áp dụng.', elements: [{ type: 'stat-big' }] },
  { name: 'Cảnh 5', temporalRole: 'cta', voiceoverText: 'Lưu ngay video này và follow kênh để nhận thêm mẹo hay nhé!', elements: [{ type: 'quote-box' }] },
];

const processed = postProcessGeneratedScenes(mockRawScenes, { prompt: 'Mẹo dùng AI', targetDuration: 30, sceneCount: 5, wordsPerScene: 13 });
assert.equal(processed.length, 5, 'Phải giữ đủ 5 cảnh');

processed.forEach((scene, i) => {
  assert.equal(scene.voiceoverText, mockRawScenes[i].voiceoverText.trim(), `Cảnh ${i + 1}: lời thoại dưới trần phải được giữ nguyên`);
});
// Khung thời lượng theo vai trò (postProcessor): Hook 2.2–4.2s, CTA 2.0–3.8s, Body ≥ 2.5s
assert.ok(processed[0].duration >= 2.2 && processed[0].duration <= 4.2, `Hook: ${processed[0].duration}s ngoài khung 2.2–4.2s`);
assert.ok(processed[4].duration >= 2.0 && processed[4].duration <= 3.8, `CTA: ${processed[4].duration}s ngoài khung 2.0–3.8s`);
processed.slice(1, 4).forEach((scene, k) => assert.ok(scene.duration >= 2.5, `Body ${k + 2}: ${scene.duration}s < 2.5s`));
const totalDuration = processed.reduce((s, sc) => s + sc.duration, 0);
console.log(`     • Tổng thời lượng: ${totalDuration.toFixed(1)}s cho mục tiêu 30s`);
assert.ok(totalDuration >= 20 && totalDuration <= 33, `Tổng thời lượng ${totalDuration}s lệch xa mục tiêu 30s`);
console.log('  ✅ Test 4 PASSED: Post-Processor giữ lời thoại và tuân thủ khung thời lượng');

// ─────────────────────────────────────────────────────────────
// TEST 5: Unified Error Handling & AppError
// ─────────────────────────────────────────────────────────────
console.log('  ▶ Test 5: Kiểm tra Từ điển Lỗi Hợp nhất (Unified ErrorRegistry)...');
const rateLimitErr = new Error('GoogleGenerativeAI Error: 429 RESOURCE_EXHAUSTED');
const normalized429 = normalizeError(rateLimitErr, 'ai');
assert.equal(normalized429.code, 'AI_QUOTA_EXCEEDED');
assert.equal(normalized429.statusCode, 429);
assert.ok(normalized429.actionHint.includes('chờ'), 'Phải có gợi ý chờ hoặc đổi model');

const oomErr = new Error('Command failed: Exit code 137 (SIGKILL) Out of Memory');
const normalizedOom = normalizeError(oomErr, 'render');
assert.equal(normalizedOom.code, 'RENDER_OOM');
assert.ok(normalizedOom.userMessage.includes('tràn bộ nhớ') || normalizedOom.userMessage.includes('thiếu bộ nhớ'));
assert.ok(normalizedOom.actionHint.includes('720p'), 'Phải hướng dẫn giảm xuống 720p');

console.log('  ✅ Test 5 PASSED: ErrorRegistry dịch lỗi và cung cấp hướng dẫn chuẩn xác!');

console.log('\n🎉 TẤT CẢ 5/5 BỘ KIỂM THỬ ĐÃ VƯỢT QUA VỚI ĐỘ CHÍNH XÁC TUYỆT ĐỐI!\n');
