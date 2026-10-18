// ── Retention Beats Prompt ──────────────────────────────────────────
// Khối prompt "cơ chế giữ chân" cho AI Wizard. Vị trí nhịp lấy từ SSOT planNarrativeBeats
// (src/config/cinematicRules.js) để prompt, postProcessor và Remotion cùng một chỉ số cảnh.

import { planNarrativeBeats } from '../../src/config/cinematicRules.js';

export const BEAT_TITLE_WORDS = { min: 2, max: 4 };
/** Cảnh rehook ngắn hơn cảnh thân để cú ngắt mạch gọn và dứt khoát */
export const REHOOK_WORDS = { min: 8, max: 12 };
/** Dưới ngần này cảnh thì không có chỗ cho open loop / payoff */
const MIN_SCENES_FOR_BEATS = 3;

/** Kế hoạch nhịp kèm số thứ tự cảnh 1-based để in vào prompt */
export function describeBeatPlan(n) {
  const plan = planNarrativeBeats(n);
  const rehook = plan.findIndex(p => p.beat === 'rehook');
  const payoff = plan.findIndex(p => p.beat === 'payoff');
  return {
    plan,
    rehookScene: rehook >= 0 ? rehook + 1 : null,
    payoffScene: payoff >= 0 ? payoff + 1 : null,
  };
}

/** Stage 1 (kịch bản): open loop ở hook, rehook giữa video, payoff trước CTA, CTA khép vòng */
export function getRetentionScriptPrompt(n) {
  if (!n || n < MIN_SCENES_FOR_BEATS) return '';
  const { rehookScene, payoffScene } = describeBeatPlan(n);
  const titleRule = `${BEAT_TITLE_WORDS.min}-${BEAT_TITLE_WORDS.max} từ lấy nguyên văn từ lời thoại cảnh đó`;
  const lines = [
    'CƠ CHẾ GIỮ CHÂN (BẮT BUỘC — thiếu là người xem lướt đi giữa chừng):',
    `- Cảnh 1 (hook): trả thêm "openLoop": một lời hứa cụ thể mà video chỉ trả lời ở cảnh ${payoffScene} (vd 'lý do thật sự nằm ở bước thứ ba'). Lời thoại hook phải gợi lời hứa đó nhưng TUYỆT ĐỐI KHÔNG trả lời ngay.`,
  ];
  if (rehookScene) {
    lines.push(`- Cảnh ${rehookScene} (rehook — ngắt mạch): lời thoại ${REHOOK_WORDS.min}-${REHOOK_WORDS.max} từ. Câu đầu là pattern interrupt ('Khoan đã...', 'Nhưng đây mới là phần quan trọng', 'Sai rồi!', 'Đừng lướt vội'), rồi hé mở một nửa lời hứa. Trả thêm "beat": {"kind": "rehook", "title": "${titleRule}, ưu tiên câu ngắt mạch"}.`);
  }
  lines.push(`- Cảnh ${payoffScene} (payoff — trả lời): trả lời THẲNG openLoop của cảnh 1, không vòng vo, có số liệu hoặc hành động cụ thể. Trả thêm "beat": {"kind": "payoff", "title": "${titleRule}, chính là câu trả lời"}.`);
  lines.push(`- Cảnh ${n} (cta): lặp lại đúng từ khoá của câu mở đầu để video khép vòng, xem lại từ đầu thấy liền mạch.`);
  lines.push(`- Chỉ đúng ${rehookScene ? 'một cảnh có beat rehook và ' : ''}một cảnh có beat payoff. "title" không emoji, không dấu ngoặc kép.`);
  return lines.join('\n');
}

/** Stage 2 (bố cục): đường cong energy từng cảnh + giữ nguyên beat từ kịch bản */
export function getRetentionDesignPrompt(n) {
  if (!n || n < MIN_SCENES_FOR_BEATS) return '';
  const { plan, rehookScene, payoffScene } = describeBeatPlan(n);
  const energyLines = plan
    .map((p, i) => `  - Scene ${i + 1}: dna.energy = ${p.energy}${p.beat ? ` (beat: ${p.beat})` : ''}`)
    .join('\n');
  const beatScenes = [
    rehookScene ? `scene ${rehookScene} = rehook` : '',
    payoffScene ? `scene ${payoffScene} = payoff` : '',
  ].filter(Boolean).join(', ');
  return `ENERGY CURVE & RETENTION BEATS (MANDATORY):
- EVERY scene MUST include "dna" with "energy" (0..1). Follow this curve unless the script clearly demands otherwise (±0.1):
${energyLines}
- Copy the "beat" object {"kind", "title"} from the master script onto the same scene (${beatScenes}). "title" is ${BEAT_TITLE_WORDS.min}-${BEAT_TITLE_WORDS.max} words copied verbatim from that scene's voiceoverText, no emoji.
- Do NOT add "beat" to any other scene. Do NOT output "openLoop" (script-only field).`;
}
