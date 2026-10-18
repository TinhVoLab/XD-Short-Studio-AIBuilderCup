// ── Scene Silhouette Prompt ─────────────────────────────────────────
// In kế hoạch bóng dáng từng cảnh thân cho Stage 2. Thứ tự lấy từ SSOT planSceneSilhouettes
// (cinematicRules.js), spec từ layoutRegistry.SCENE_SILHOUETTES — cùng seed với postProcessor.

import { planSceneSilhouettes } from '../../src/config/cinematicRules.js';
import { SCENE_SILHOUETTES } from '../../src/config/layoutRegistry.js';

/** Công thức 3 lớp cũ — chỉ còn dùng khi người dùng áp template bố cục riêng (custom templates) */
export const LEGACY_THREE_LAYER_FORMULA = `SCENE COMPOSITION FORMULA (Mandatory for ALL normal & highlight scenes):
Every scene must have a rich, layered visual composition with 3 coordinated layers:
- Layer 1 (PRIMARY VISUAL - 1 required): Choose 1 prominent visual/data widget matching the topic.
- Layer 2 (ACCENT ELEMENT - 1 required): Choose 1 subtle accent to anchor the layout (e.g. 'badge', 'line', 'divider', 'progress', 'icon-text')
- Layer 3 (TEXT / EXPLANATION - 1-2 required): Main title text and/or 'highlight-box' carrying the spoken message summary.`;

export function getSilhouettePlanPrompt(n, seed = '') {
  const plan = planSceneSilhouettes(n, seed);
  const lines = plan
    .map((sil, i) => (SCENE_SILHOUETTES[sil] ? `  - Scene ${i + 1}: ${sil} → ${SCENE_SILHOUETTES[sil].prompt}` : null))
    .filter(Boolean);
  if (lines.length === 0) return LEGACY_THREE_LAYER_FORMULA;
  return `SCENE SILHOUETTE PLAN (MANDATORY — the overall shape of each content scene; two consecutive scenes never share a shape; the post-processor trims any extra element, so put the message into the elements the shape allows):
${lines.join('\n')}
- Hook and CTA scenes follow their own layout rules above.
- For 'widget-solo' and 'split', the widget's own title/label fields carry the heading; for 'statement', the text IS the message of the voiceover (its strongest 3 to 8 words).`;
}
