import { postProcessGeneratedScenes } from '../server/services/scenePostProcessor.js';
import { getOptimizedGraphicCatalog, calculateTimelineSceneY } from '../server/services/semanticContextRouter.js';
import { WIDGET_DNA, isWidgetForbidden } from '../src/config/widgetDNA.js';

console.log('🧪 RUNNING SEMANTIC CONTRACT & WIDGET DNA VERIFICATION TESTS...\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failCount++;
  }
}

// ── TEST 1: WIDGET DNA METADATA INTEGRITY ──
console.log('--- TEST 1: Widget DNA Metadata Integrity ---');
assert(isWidgetForbidden('vs-battle', ['ZEN_HEALING']) === true, 'vs-battle is strictly forbidden in ZEN_HEALING');
assert(isWidgetForbidden('candlestick-chart', ['ZEN_HEALING']) === true, 'candlestick-chart is strictly forbidden in ZEN_HEALING');
assert(isWidgetForbidden('stat-big', ['ZEN_HEALING']) === true, 'stat-big is strictly forbidden in ZEN_HEALING');
assert(isWidgetForbidden('generative-svg', ['ZEN_HEALING']) === true, 'generative-svg is strictly forbidden in ZEN_HEALING');
assert(isWidgetForbidden('quote-box', ['ZEN_HEALING']) === false, 'quote-box is allowed in ZEN_HEALING');
assert(isWidgetForbidden('highlight-box', ['ZEN_HEALING']) === false, 'highlight-box is allowed in ZEN_HEALING');
assert(isWidgetForbidden('checklist', ['ZEN_HEALING']) === false, 'checklist is allowed in ZEN_HEALING');
assert(isWidgetForbidden('numbered-list', ['ZEN_HEALING']) === false, 'numbered-list is allowed in ZEN_HEALING');
assert(isWidgetForbidden('timeline', ['ZEN_HEALING']) === false, 'timeline is allowed in ZEN_HEALING');
assert(isWidgetForbidden('vs-battle', ['TECH_AI']) === false, 'vs-battle is allowed in TECH_AI');
assert(isWidgetForbidden('stat-big', ['TECH_AI']) === false, 'stat-big is allowed in TECH_AI');
assert(WIDGET_DNA['heatmap-matrix'].fallbackType === 'highlight-box', 'heatmap-matrix safely fallbacks to highlight-box');
assert(WIDGET_DNA['cyber-matrix'].fallbackType === 'highlight-box', 'cyber-matrix safely fallbacks to highlight-box');

// ── TEST 2: PRUNING IN getOptimizedGraphicCatalog ──
console.log('\n--- TEST 2: Pruning in getOptimizedGraphicCatalog ---');
const zenCatalog = getOptimizedGraphicCatalog('#86EFAC', 'Thiền & Chữa Lành', 'Tập thở và buông bỏ');
assert(!zenCatalog.catalogPrompt.includes("'vs-battle':"), 'Zen catalog MUST NOT contain vs-battle schema');
assert(!zenCatalog.catalogPrompt.includes("'candlestick-chart':"), 'Zen catalog MUST NOT contain candlestick-chart schema');
assert(!zenCatalog.catalogPrompt.includes("'stat-big':"), 'Zen catalog MUST NOT contain stat-big schema');
assert(!zenCatalog.catalogPrompt.includes("'generative-svg':"), 'Zen catalog MUST NOT contain generative-svg schema');
assert(zenCatalog.catalogPrompt.includes("'checklist':"), 'Zen catalog MUST contain Core Primitive checklist schema');
assert(zenCatalog.catalogPrompt.includes("'numbered-list':"), 'Zen catalog MUST contain Core Primitive numbered-list schema');
assert(zenCatalog.catalogPrompt.includes("'quote-box':"), 'Zen catalog MUST contain Core Primitive quote-box schema');
assert(zenCatalog.catalogPrompt.includes("'timeline':"), 'Zen catalog MUST contain Core Primitive timeline schema');
assert(zenCatalog.catalogPrompt.includes('STRICT CONTEXT CONSTRAINTS (FORBIDDEN IN THIS THEME)'), 'Zen catalog has explicit negative constraint prompt');

// ── TEST 3: INTENT ROUTING WITHOUT BRITTLE REGEX IN calculateTimelineSceneY ──
console.log('\n--- TEST 3: Domain-Aware calculateTimelineSceneY ---');
const zenScene = calculateTimelineSceneY({
  prompt: 'Sự khác biệt giữa buông bỏ và cố chấp nắm giữ',
  style: 'Thiền định & Chữa lành',
  accentColor: '#86EFAC',
});
assert(zenScene.preferredElement !== 'vs-battle', `Zen scene with "khác biệt" was NOT assigned vs-battle (got: ${zenScene.preferredElement})`);
assert(zenScene.preferredElement === 'quote-box', `Zen scene with "khác biệt" gracefully routed to quote-box (got: ${zenScene.preferredElement})`);

const techScene = calculateTimelineSceneY({
  prompt: 'So sánh khác biệt giữa 2 giải pháp công nghệ',
  style: 'Công nghệ AI & Tech',
  accentColor: '#00D4FF',
});
assert(techScene.preferredElement === 'vs-battle', `Tech scene with comparison intent correctly routed to vs-battle (got: ${techScene.preferredElement})`);

// ── TEST 4: POST-PROCESSOR GRACEFUL DEGRADATION PASS 0 ──
console.log('\n--- TEST 4: Post-Processor Graceful Degradation ---');
const hallucinatedZenScenes = [
  {
    name: 'Cảnh 1',
    temporalRole: 'normal',
    voiceoverText: 'Buông bỏ muộn phiền để tìm lại sự bình yên trong tâm hồn.',
    elements: [
      {
        type: 'vs-battle',
        left: 180,
        top: 200,
        width: 330,
        height: 400,
        vsBattle: null // Empty payload!
      }
    ]
  }
];

const processed = postProcessGeneratedScenes(hallucinatedZenScenes, {
  prompt: 'Thiền buông bỏ',
  style: 'Thiền & Chữa Lành',
  ACCENT: '#86EFAC',
});

const firstElement = processed[0].elements[0];
assert(firstElement.type !== 'vs-battle', `Forbidden vs-battle was stripped by post-processor (got: ${firstElement.type})`);
assert(firstElement.type === 'highlight-box' || firstElement.type === 'quote-box', `Forbidden widget degraded into a harmonious widget (got: ${firstElement.type})`);
assert(!JSON.stringify(firstElement).includes('ChatGPT'), 'Element has ZERO references to ChatGPT');
assert(!JSON.stringify(firstElement).includes('Gemini'), 'Element has ZERO references to Gemini');

console.log(`\n==============================================`);
console.log(`RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log(`==============================================\n`);

if (failCount > 0) {
  process.exit(1);
}
