import assert from 'node:assert';
import { calculateTimelineSceneY } from '../services/semanticContextRouter.js';

function runYFxTests() {
  console.log('========================================================================');
  console.log('   🧪 [TEST SUITE]: TIMELINE SCENE INTENT AUTO-ROUTER Y = f(X)        ');
  console.log('========================================================================\n');

  console.log('--- TEST 1: Rule 1 - Explicit User Archetype Override ---');
  const r1 = calculateTimelineSceneY({
    prompt: 'Doanh thu tăng 200%', // Has chart keywords, but user explicitly chose diagram
    targetArchetype: 'diagram',
    preferredElement: 'branching-flow',
  });
  assert.strictEqual(r1.archetype, 'diagram');
  assert.strictEqual(r1.preferredElement, 'branching-flow');
  assert.strictEqual(r1.isAutoRouted, false);
  assert.ok(Array.isArray(r1.soundEffects) && r1.soundEffects.length > 0);
  console.log('  ✅ [PASS] User explicit choice honored 100% without override');

  console.log('\n--- TEST 2: Rule 2A - Financial & Metric Auto-Route (Chart + SFX) ---');
  const r2 = calculateTimelineSceneY({
    prompt: 'Doanh thu quý 3 tăng trưởng 300% từ 10 tỷ lên 45 tỷ',
    targetArchetype: 'general',
  });
  assert.strictEqual(r2.archetype, 'chart');
  assert.strictEqual(r2.isAutoRouted, true);
  assert.ok(r2.preferredElement === 'waterfall-chart' || r2.preferredElement === 'racing-bar-chart' || r2.preferredElement === 'chart-bar');
  assert.ok(r2.soundEffects.some(s => s.type === 'kaching' || s.type === 'whoosh' || s.type === 'ding'));
  console.log(`  ✅ [PASS] Financial prompt auto-routed to ${r2.archetype} (${r2.preferredElement}) with sound effect`);

  console.log('\n--- TEST 3: Rule 2B - Process & Funnel Auto-Route (Diagram + SFX) ---');
  const r3 = calculateTimelineSceneY({
    prompt: 'Mô hình phễu lọc chuyển đổi khách hàng qua 4 giai đoạn',
    targetArchetype: 'general',
  });
  assert.strictEqual(r3.archetype, 'diagram');
  assert.strictEqual(r3.preferredElement, 'funnel-flow');
  assert.strictEqual(r3.isAutoRouted, true);
  assert.ok(r3.soundEffects.some(s => s.type === 'whoosh'));
  console.log(`  ✅ [PASS] Funnel process auto-routed to ${r3.archetype} (${r3.preferredElement})`);

  console.log('\n--- TEST 4: Rule 2C - Comparison & Battle Auto-Route ---');
  const r4 = calculateTimelineSceneY({
    prompt: 'So sánh chi phí cách cũ vs cách mới bằng AI',
    targetArchetype: 'general',
  });
  assert.strictEqual(r4.archetype, 'comparison');
  assert.strictEqual(r4.preferredElement, 'vs-battle');
  assert.strictEqual(r4.isAutoRouted, true);
  assert.ok(r4.soundEffects.some(s => s.type === 'boom' || s.type === 'whoosh'));
  console.log(`  ✅ [PASS] VS prompt auto-routed to ${r4.archetype} (${r4.preferredElement})`);

  console.log('\n--- TEST 5: Rule 2D - Social Proof & Bank Balance Auto-Route ---');
  const r5 = calculateTimelineSceneY({
    prompt: 'Tài khoản nổ biến động số dư chuyển khoản tiền cọc hợp đồng',
    targetArchetype: 'general',
  });
  assert.strictEqual(r5.archetype, 'comparison');
  assert.strictEqual(r5.preferredElement, 'social-callout');
  assert.strictEqual(r5.isAutoRouted, true);
  assert.ok(r5.soundEffects.some(s => s.type === 'kaching'));
  console.log(`  ✅ [PASS] Bank notification auto-routed to ${r5.preferredElement} with kaching SFX`);

  console.log('\n--- TEST 6: Rule 3 - Neighbor Anti-Repeat Logic ---');
  const r6 = calculateTimelineSceneY({
    prompt: 'Danh sách 4 lưu ý quan trọng cần ghi nhớ',
    targetArchetype: 'general',
    prevScene: {
      elements: [{ type: 'checklist' }]
    }
  });
  // Since previous scene was already a checklist, anti-repeat diverts away from bullets into roadmap-flow!
  assert.notStrictEqual(r6.preferredElement, 'checklist');
  assert.strictEqual(r6.archetype, 'diagram');
  assert.strictEqual(r6.preferredElement, 'roadmap-flow');
  console.log(`  ✅ [PASS] Anti-repeat successfully prevented consecutive checklist, diverted to: ${r6.preferredElement}`);

  console.log('\n--- TEST 7: Rule 4 - Graceful Fallback for Abstract Prompts ---');
  const r7 = calculateTimelineSceneY({
    prompt: 'Lắng đọng tâm hồn và chiêm nghiệm về cuộc sống',
    targetArchetype: 'general',
  });
  assert.strictEqual(r7.archetype, 'general');
  assert.strictEqual(r7.preferredElement, 'quote-box');
  assert.ok(r7.soundEffects.some(s => s.type === 'chime' || s.type === 'whoosh'));
  console.log(`  ✅ [PASS] Abstract prompt gracefully resolved to elegant ${r7.preferredElement}`);

  console.log('\n--- TEST 8: Rule 2E - Interactive Quiz Auto-Route (STEM) ---');
  const r8 = calculateTimelineSceneY({
    prompt: 'Tạo câu hỏi tương tác đố vui',
    targetArchetype: 'general',
  });
  assert.strictEqual(r8.archetype, 'stem');
  assert.strictEqual(r8.preferredElement, 'quiz-card');
  assert.ok(r8.soundEffects.some(s => s.type === 'ding' || s.type === 'pop'));
  console.log(`  ✅ [PASS] Quiz prompt auto-routed to ${r8.preferredElement} with sound effect`);

  console.log('\n--- TEST 9: Rule 2F - Science & Education Auto-Route (STEM) ---');
  const r9 = calculateTimelineSceneY({
    prompt: 'Mô phỏng hệ mặt trời và quỹ đạo các hành tinh',
    targetArchetype: 'general',
  });
  assert.strictEqual(r9.archetype, 'stem');
  assert.strictEqual(r9.preferredElement, 'orbit-system');
  assert.ok(r9.soundEffects.some(s => s.type === 'whoosh'));
  console.log(`  ✅ [PASS] Science prompt auto-routed to ${r9.preferredElement} with sound effect`);

  console.log('\n========================================================================');
  console.log('🎉 ALL 9/9 Y = f(X) INTENT ROUTER TESTS PASSED WITH 100% ACCURACY! 🎉');
  console.log('========================================================================\n');
}

runYFxTests();
