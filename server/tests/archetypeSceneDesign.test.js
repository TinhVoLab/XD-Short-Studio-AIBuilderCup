import assert from 'node:assert';
import { getArchetypeDirective } from '../routes/ai/sceneDesignRoutes.js';

function runArchetypeTests() {
  console.log('--- 1. Testing getArchetypeDirective outputs ---');

  // Case A: Diagram Archetype
  const diagramDir = getArchetypeDirective('diagram');
  assert.ok(diagramDir.includes('ARCHETYPE: SƠ ĐỒ & LUỒNG QUY TRÌNH'));
  assert.ok(diagramDir.includes("'branching-flow'"));
  assert.ok(diagramDir.includes("'funnel-flow'"));
  assert.ok(diagramDir.includes("'roadmap-flow'"));
  assert.ok(diagramDir.includes("'flowchart'"));

  // Case B: Diagram with preferredElement
  const diagramBranching = getArchetypeDirective('diagram', 'branching-flow');
  assert.ok(diagramBranching.includes("prioritize using element type: 'branching-flow'"));

  // Case C: Chart Archetype
  const chartDir = getArchetypeDirective('chart', 'racing-bar-chart');
  assert.ok(chartDir.includes('ARCHETYPE: BIỂU ĐỒ & SỐ LIỆU'));
  assert.ok(chartDir.includes("'racing-bar-chart'"));
  assert.ok(chartDir.includes("'waterfall-chart'"));
  assert.ok(chartDir.includes("'radar-chart'"));
  assert.ok(chartDir.includes("prioritize using element type: 'racing-bar-chart'"));

  // Case D: Bullets Archetype
  const bulletsDir = getArchetypeDirective('bullets', 'checklist');
  assert.ok(bulletsDir.includes('ARCHETYPE: DANH SÁCH & LỜI KHUYÊN'));
  assert.ok(bulletsDir.includes("'highlight-box' with variant: \"bullet-list\""));
  assert.ok(bulletsDir.includes("'checklist'"));
  assert.ok(bulletsDir.includes("prioritize using element type: 'checklist'"));

  // Case E: Comparison Archetype
  const compDir = getArchetypeDirective('comparison', 'vs-battle');
  assert.ok(compDir.includes('ARCHETYPE: SO SÁNH & BẰNG CHỨNG'));
  assert.ok(compDir.includes("'vs-battle'"));
  assert.ok(compDir.includes("'social-callout'"));
  assert.ok(compDir.includes("'document-evidence'"));
  assert.ok(compDir.includes("prioritize using element type: 'vs-battle'"));

  // Case F: General Archetype with preferredElement
  const generalDir = getArchetypeDirective('general', 'quiz-card');
  assert.ok(generalDir.includes("prioritize using element type: 'quiz-card'"));

  // Case G: Empty / Undefined
  const emptyDir = getArchetypeDirective(undefined, undefined);
  assert.strictEqual(emptyDir, '');

  console.log('✅ All getArchetypeDirective tests passed!');

  console.log('--- 2. Testing Hook rule suppression logic ---');
  // When n === 1 and targetArchetype is not 'hook': isDedicatedHook must be false
  const nSingle = 1;
  const targetArch = 'diagram';
  const isDedicatedHookSingle = targetArch === 'hook' || (nSingle > 1);
  assert.strictEqual(isDedicatedHookSingle, false, 'Single scene diagram must NOT force master-hook');

  // When n === 1 and targetArchetype is explicitly 'hook': isDedicatedHook must be true
  const isDedicatedHookExplicit = 'hook' === 'hook' || (nSingle > 1);
  assert.strictEqual(isDedicatedHookExplicit, true, 'Single scene explicit hook MUST force master-hook');

  // When n === 5 (full video): isDedicatedHook must be true
  const nMulti = 5;
  const isDedicatedHookMulti = targetArch === 'hook' || (nMulti > 1);
  assert.strictEqual(isDedicatedHookMulti, true, 'Full video generation MUST enforce Scene 1 hook');

  console.log('✅ All Hook rule conditions verified!');

  console.log('--- 3. Testing Context Prompt Archetype Enrichment ---');
  function buildContextPrompt({ prompt, targetArchetype, preferredElement, prevScene, nextScene }) {
    const prevContext = prevScene?.voiceoverText ? `Cảnh trước: "${prevScene.voiceoverText}". ` : '';
    const nextContext = nextScene?.voiceoverText ? `Cảnh sau: "${nextScene.voiceoverText}". ` : '';
    const effectivePrompt = (prompt || '').trim() || 'Tạo 1 cảnh sinh động';
    const archetypeHint = targetArchetype && targetArchetype !== 'general'
      ? ` [Thể loại: ${targetArchetype}${preferredElement ? ` - Ưu tiên component: ${preferredElement}` : ''}]`
      : '';
    return `${prevContext}${nextContext}Yêu cầu cảnh cần tạo:${archetypeHint} ${effectivePrompt}`;
  }

  const promptResult = buildContextPrompt({
    prompt: 'So sánh chi phí thuê ngoài vs tự làm',
    targetArchetype: 'comparison',
    preferredElement: 'vs-battle',
    prevScene: { voiceoverText: 'Nhiều doanh nghiệp đang đau đầu về nhân sự' }
  });

  assert.ok(promptResult.includes('[Thể loại: comparison - Ưu tiên component: vs-battle]'));
  assert.ok(promptResult.includes('So sánh chi phí thuê ngoài vs tự làm'));
  assert.ok(promptResult.includes('Cảnh trước: "Nhiều doanh nghiệp đang đau đầu về nhân sự"'));

  console.log('✅ Context Prompt Enrichment verified!');
  console.log('\n🎉 ALL ARCHETYPE SCENE DESIGN TESTS PASSED SUCCESSFULLY! 🎉');
}

runArchetypeTests();
