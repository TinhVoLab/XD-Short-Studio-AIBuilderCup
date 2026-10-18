import assert from 'assert/strict';
import { postProcessGeneratedScenes } from '../services/scenePostProcessor.js';
import { getRetentionScriptPrompt, getRetentionDesignPrompt } from '../prompts/aiRetentionBeats.js';
import { fallbackBeatTitle } from '../services/postProcessor/processors/narrativeBeatResolver.js';
import { SCENE_SILHOUETTES } from '../../src/config/layoutRegistry.js';

console.log('🧪 narrativeBeats...');

// 1. Prompt in đúng chỉ số cảnh từ SSOT
const script7 = getRetentionScriptPrompt(7);
assert.ok(script7.includes('Cảnh 3 (rehook'), 'Stage 1: rehook ở cảnh 3 của 7 cảnh');
assert.ok(script7.includes('Cảnh 6 (payoff'), 'Stage 1: payoff ở cảnh 6 của 7 cảnh');
assert.ok(script7.includes('"openLoop"'));
assert.ok(!getRetentionScriptPrompt(4).includes('rehook'), 'Stage 1: 4 cảnh không có rehook');
assert.equal(getRetentionScriptPrompt(1), '', 'cảnh đơn trên timeline không có khối giữ chân');
const design7 = getRetentionDesignPrompt(7);
assert.ok(design7.includes('Scene 3: dna.energy = 0.8 (beat: rehook)'));
assert.ok(design7.includes('Scene 5: dna.energy = 0.95'));
assert.ok(design7.includes('Do NOT output "openLoop"'));

// 2. Post-processor: vị trí nhịp theo SSOT, title ưu tiên AI, cảnh lạc nhịp bị bỏ
const voice = [
  'Bạn đang mất tiền mỗi ngày mà không hề biết lý do thật sự.',
  'Lạm phát âm thầm ăn mòn khoản tiết kiệm của bạn từng tháng.',
  'Khoan đã... lãi suất ngân hàng còn thấp hơn cả lạm phát!',
  'Mười năm nữa, tiền của bạn mất một nửa giá trị.',
  'Giải pháp là đầu tư đều đặn vào tài sản tăng trưởng.',
  'Câu trả lời: giữ tiền mặt chính là cách mất tiền nhanh nhất.',
  'Lưu video để bắt đầu ngay hôm nay.',
];
const raw = voice.map((v, i) => ({
  name: `Cảnh ${i + 1}`,
  voiceoverText: v,
  elements: i === 0
    ? [{ type: 'master-hook', content: 'x' }]
    : [{ type: 'text', content: 'Lãi suất thấp hơn lạm phát', left: 180, top: 100, width: 320, height: 40, fontSize: 22 }, { type: 'highlight-box', content: 'x', left: 180, top: 200, width: 312, height: 80 }],
  ...(i === 0 ? { openLoop: 'lý do thật sự', beat: { kind: 'rehook', title: 'Lạc nhịp' } } : {}),
  ...(i === 2 ? { beat: { kind: 'rehook', title: 'Khoan đã 🔥' } } : {}),
  ...(i === 3 ? { dna: { energy: 0.97 } } : {}),
}));
const out = postProcessGeneratedScenes(raw, { prompt: 'Tiền và lạm phát', targetDuration: 45, sceneCount: 7 });
assert.equal(out.length, 7);
assert.deepEqual(out[2].beat, { kind: 'rehook', title: 'Khoan đã' }, 'title AI hợp lệ được giữ, emoji bị bỏ');
assert.equal(out[5].beat?.kind, 'payoff');
assert.equal(out[5].beat.title, 'Câu trả lời', 'không có title AI thì lấy mệnh đề đầu lời thoại');
assert.equal(out[0].beat, undefined, 'hook không mang nhịp dù AI gán');
assert.ok(out.filter(s => s.beat).length === 2);
assert.ok(out.every(s => !('openLoop' in s)), 'openLoop không được persist');

// 3. Energy: AI chấm thì giữ, bỏ trống thì theo đường cong
assert.equal(out[3].energy, 0.97);
assert.ok(out.every(s => typeof s.energy === 'number'), 'mọi cảnh phải có energy');
assert.equal(out[1].energy, 0.5);
assert.equal(out[2].energy, 0.8);
assert.equal(out[6].energy, 0.45);

// 4. Nhịp nghe và nhìn thấy: SFX mở nhịp đứng đầu, nền đổi pattern; highlight vẫn mesh
assert.equal(out[2].soundEffects[0].type, 'record_scratch');
assert.equal(out[5].soundEffects[0].type, 'thud');
assert.equal(out[2].bgPattern, 'speed-lines');
assert.equal(out[5].bgPattern, 'topo-contour');
assert.equal(out[4].bgPattern, 'mesh');

// 5. Phong cách thiền: âm êm, nền êm
const zen = postProcessGeneratedScenes(raw.map(s => ({ ...s })), { prompt: 'Buông bỏ', style: 'Nhẹ nhàng, chữa lành, thiền định', targetDuration: 45, sceneCount: 7 });
assert.equal(zen[2].soundEffects[0].type, 'chime');
assert.equal(zen[2].bgPattern, 'dots');
assert.equal(zen[2].viralEffects.flashOnBeat, false, 'thiền không chớp sáng');
assert.notEqual(out[2].viralEffects.flashOnBeat, false, 'phong cách thường chớp sáng');

// 6b. Bóng dáng cảnh được persist cho cảnh thân, hai cảnh liền kề khác nhau, hook/cta không có
assert.equal(out[0].silhouette, undefined);
assert.equal(out[6].silhouette, undefined);
out.slice(1, -1).forEach((s, i) => assert.ok(SCENE_SILHOUETTES[s.silhouette], `cảnh ${i + 2} thiếu bóng dáng`));
for (let i = 2; i < 6; i++) assert.notEqual(out[i].silhouette, out[i - 1].silhouette);
assert.equal(out[2].silhouette, 'title-widget', 'rehook = title-widget');
assert.equal(out[4].silhouette, 'widget-solo', 'highlight = widget-solo');
const noSil = postProcessGeneratedScenes(raw.map(s => ({ ...s })), { prompt: 'x', targetDuration: 45, sceneCount: 7, useSilhouettes: false });
assert.ok(noSil.every(s => s.silhouette === undefined), 'custom template: không áp bóng dáng');

// 6. Title dự phòng
assert.equal(fallbackBeatTitle('Nhưng đây mới là phần quan trọng nhất, nghe kỹ.'), 'Nhưng đây mới là');
assert.equal(fallbackBeatTitle(''), '');

console.log('✅ narrativeBeats: all assertions passed');
