import assert from 'node:assert/strict';
import { buildMasterPlanPrompt } from '../prompts/masterScenePrompt.js';
import { planMasterStructure } from '../../src/config/videoPlan.js';

const structure = planMasterStructure(45);
const prompt = buildMasterPlanPrompt({ topic: '5 thói quen buổi sáng', structure });

// Đủ cảnh, đúng thứ tự, mỗi cảnh có công thức và slot của mẫu (sinh từ registry)
assert.match(prompt, /ĐÚNG 9 cảnh/);
assert.match(prompt, /1\. Mở đầu — lời thoại ≈ \d+ từ[\s\S]*"hook\.number" — Con số gây chú ý/);
assert.match(prompt, /5\. Giữ chân[\s\S]*"retention\.wait" — Khoan đã/);
// Slot hệ thống tự điền (con số của hook, số điều của cầu nối) không đưa cho AI viết
assert.doesNotMatch(prompt, /"so": string/);
assert.doesNotMatch(prompt, /"n": số nguyên/);
// Luật ghép sinh từ registry
assert.match(prompt, /Nếu chọn "bridge\.roadmap_three" thì một cảnh phía sau phải là "climax\.summary"/);
assert.match(prompt, /"climax\.summary": "muc" có đúng một mục cho mỗi cảnh nội dung/);
assert.match(prompt, /"recipeId": "id mẫu đã chọn"/);
assert.match(prompt, /"ly_do": string, tối đa 14 từ \(Vì sao\)/);
assert.match(prompt, /"muc": mảng 2–5 chuỗi, mỗi chuỗi tối đa 6 từ/);
// Ràng buộc chéo và chống bịa số liệu nằm trong prompt
assert.match(prompt, /đúng 4 ý chính/);
assert.match(prompt, /đặt cụm cần nhấn mạnh sau dấu phẩy cuối/);
assert.match(prompt, /Không bịa số liệu/);
// Lần tạo lại mang lỗi của lần trước
assert.match(buildMasterPlanPrompt({ topic: 'x', structure }, ['Cảnh 3: y: quá 8 từ']), /LẦN TRƯỚC SAI[\s\S]*Cảnh 3: y: quá 8 từ/);

console.log('✅ masterPlanPrompt: all assertions passed');
