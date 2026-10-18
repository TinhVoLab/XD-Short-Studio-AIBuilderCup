import assert from 'assert/strict';
import { planCinematics, resolveSceneEnergy, planNarrativeBeats, highlightSceneIndex, MIN_SCENES_FOR_REHOOK, planSceneSilhouettes, SILHOUETTE_POOL } from '../../src/config/cinematicRules.js';
import { SCENE_SILHOUETTES } from '../../src/config/layoutRegistry.js';

console.log('🧪 cinematicRules...');

const scenes = [
  { temporalRole: 'hook', voiceoverText: 'Bạn đang mất tiền mỗi ngày mà không biết.' },
  { temporalRole: 'normal', energy: 0.5, voiceoverText: 'Lạm phát âm thầm ăn mòn tiền tiết kiệm.' },
  { temporalRole: 'normal', energy: 0.6, voiceoverText: 'Lãi suất ngân hàng thấp hơn lạm phát.' },
  { temporalRole: 'highlight', energy: 0.95, voiceoverText: 'Mười năm, tiền của bạn mất một nửa giá trị.' },
  { temporalRole: 'normal', energy: 0.5, voiceoverText: 'Giải pháp là đầu tư đều đặn.' },
  { temporalRole: 'cta', voiceoverText: 'Lưu video để bắt đầu ngay.' },
];

// 1. Tất định: cùng đầu vào → cùng kết quả
assert.deepEqual(planCinematics(scenes, 'seed'), planCinematics(scenes, 'seed'));

const plan = planCinematics(scenes, 'seed');
assert.equal(plan.length, scenes.length);

// 2. Hook luôn zoom-in; cảnh cuối không có transition
assert.equal(plan[0].cameraMotion, 'zoom-in');
assert.equal(plan[plan.length - 1].transition.type, 'none');

// 3. Không lặp transition / camera liền kề (trừ hook cố định)
for (let i = 1; i < plan.length; i++) {
  if (i < plan.length - 1 && plan[i - 1].transition.type !== 'none') {
    assert.notEqual(plan[i].transition.type, plan[i - 1].transition.type, `transition lặp ở cảnh ${i}`);
  }
  if (scenes[i].temporalRole !== 'hook') {
    assert.notEqual(plan[i].cameraMotion, plan[i - 1].cameraMotion, `camera lặp ở cảnh ${i}`);
  }
}

// 4. Cú chuyển vào cảnh cao trào thuộc nhóm mạnh và nhanh hơn cú chuyển vào cảnh trầm
assert.ok(['glitch', 'zoom-blur', 'whip-pan'].includes(plan[2].transition.type), 'vào highlight phải là transition mạnh');
assert.ok(plan[2].transition.duration < plan[4].transition.duration, 'transition mạnh phải ngắn hơn transition êm');

// 5. Kịch bản khác → có biến thể (không đòi hỏi khác hoàn toàn)
const variants = new Set(['a', 'b', 'c', 'd', 'e'].map(p => JSON.stringify(planCinematics(scenes, p))));
assert.ok(variants.size > 1, 'seed khác phải tạo được biến thể');

// 6. Energy: ưu tiên giá trị AI, kẹp [0,1], mặc định theo vai trò
assert.equal(resolveSceneEnergy({ energy: 2 }), 1);
assert.equal(resolveSceneEnergy({ temporalRole: 'cta' }), 0.4);
assert.ok(resolveSceneEnergy({ temporalRole: 'hook' }) > resolveSceneEnergy({ temporalRole: 'normal' }));

// 7. Nhịp giữ chân: rehook ở ~40%, payoff ngay trước CTA, highlight là đỉnh energy
const beats7 = planNarrativeBeats(7);
assert.equal(beats7.length, 7);
assert.equal(beats7.findIndex(p => p.beat === 'rehook'), 2, 'rehook của 7 cảnh phải ở cảnh 3');
assert.equal(beats7.findIndex(p => p.beat === 'payoff'), 5, 'payoff của 7 cảnh phải ở cảnh 6');
assert.equal(beats7.filter(p => p.beat).length, 2, 'đúng một rehook và một payoff');
assert.equal(beats7[highlightSceneIndex(7)].energy, 0.95, 'highlight là đỉnh energy');
assert.ok(beats7.every(p => p.energy >= 0 && p.energy <= 1));
assert.ok(beats7[0].energy > beats7[1].energy, 'sau hook phải hạ nhịp');
assert.ok(beats7[2].energy > beats7[1].energy, 'rehook cao hơn cảnh hạ nhịp');
assert.ok(beats7[6].energy < beats7[5].energy, 'cta thấp hơn payoff');
assert.ok(Math.max(...beats7.map(p => p.energy)) === beats7[highlightSceneIndex(7)].energy, 'không cảnh nào vượt highlight');

// 8. Video ngắn: dưới MIN_SCENES_FOR_REHOOK không có rehook; 3 cảnh vẫn có payoff; 1–2 cảnh không có nhịp
const beats4 = planNarrativeBeats(MIN_SCENES_FOR_REHOOK - 1);
assert.ok(!beats4.some(p => p.beat === 'rehook'), 'video ngắn không có rehook');
assert.equal(beats4.findIndex(p => p.beat === 'payoff'), 2);
assert.equal(planNarrativeBeats(3).findIndex(p => p.beat === 'payoff'), 1);
assert.ok(!planNarrativeBeats(2).some(p => p.beat));
assert.equal(planNarrativeBeats(1).length, 1);
assert.deepEqual(planNarrativeBeats(0), []);
// rehook không bao giờ trùng highlight
for (let n = MIN_SCENES_FOR_REHOOK; n <= 20; n++) {
  const plan = planNarrativeBeats(n);
  assert.notEqual(plan.findIndex(p => p.beat === 'rehook'), highlightSceneIndex(n), `rehook trùng highlight ở n=${n}`);
}

// 9. Energy: cảnh có nhịp nhưng AI không chấm → sàn của nhịp; cảnh highlight giữ mức vai trò
assert.equal(resolveSceneEnergy({ temporalRole: 'normal', beat: { kind: 'rehook', title: 'Khoan đã' } }), 0.8);
assert.equal(resolveSceneEnergy({ temporalRole: 'highlight', beat: { kind: 'payoff', title: 'Câu trả lời' } }), 0.85);
assert.equal(resolveSceneEnergy({ energy: 0.3, beat: { kind: 'rehook', title: 'x' } }), 0.3, 'AI chấm thì ưu tiên AI');

// 10. Bóng dáng cảnh: hai đầu cố định, rehook = title-widget, highlight = widget-solo, không lặp liền kề, ≤ 1 statement
for (const n of [5, 7, 8, 10, 13]) {
  const sil = planSceneSilhouettes(n, 'seed');
  assert.equal(sil.length, n);
  assert.equal(sil[0], 'hook');
  assert.equal(sil[n - 1], 'cta');
  assert.equal(sil[planNarrativeBeats(n).findIndex(p => p.beat === 'rehook')], 'title-widget', `n=${n}: rehook phải là title-widget`);
  assert.equal(sil[highlightSceneIndex(n)], 'widget-solo', `n=${n}: highlight phải là widget-solo`);
  const body = sil.slice(1, -1);
  assert.ok(body.every(x => SCENE_SILHOUETTES[x]), `n=${n}: bóng dáng lạ`);
  for (let i = 1; i < body.length; i++) assert.notEqual(body[i], body[i - 1], `n=${n}: lặp bóng dáng ở cảnh ${i + 2}`);
  assert.ok(body.filter(x => x === 'statement').length <= 1, `n=${n}: quá một statement`);
  assert.notEqual(sil[1], 'statement', `n=${n}: cảnh sau hook không được là statement`);
}
assert.deepEqual(planSceneSilhouettes(5, 'seed'), planSceneSilhouettes(5, 'seed'), 'tất định theo seed');
assert.ok(new Set(['a', 'b', 'c', 'd', 'e', 'f'].map(sd => planSceneSilhouettes(10, sd).join())).size > 1, 'seed khác phải cho biến thể');
assert.deepEqual(planSceneSilhouettes(3, 'x').slice(1, -1).every(x => SILHOUETTE_POOL.includes(x)), true);
assert.deepEqual(planSceneSilhouettes(1), ['hook']);

console.log('✅ cinematicRules: all assertions passed');
