/**
 * Nhịp giữ chân của từng cảnh. Vị trí nhịp là SSOT (planNarrativeBeats); AI chỉ góp "title".
 * Cảnh ngoài kế hoạch không mang nhịp dù AI có gán, để mỗi video đúng 1 rehook + 1 payoff.
 */
import { planNarrativeBeats, BEAT_KINDS } from '../../../../src/config/cinematicRules.js';
import { cleanHookText } from '../../../../src/config/hookDesigner.js';

const TITLE_MAX_WORDS = 4;

const toWords = (text) => cleanHookText(text).replace(/["“”]/g, '').split(/\s+/).filter(Boolean);

/** Tiêu đề dự phòng: mệnh đề đầu của lời thoại, tối đa TITLE_MAX_WORDS từ */
export function fallbackBeatTitle(voiceover) {
  const clause = String(voiceover || '').split(/[.!?…,;:]/)[0] || '';
  return toWords(clause).slice(0, TITLE_MAX_WORDS).join(' ');
}

export function resolveSceneBeat(scene, planEntry, voiceover) {
  const kind = planEntry?.beat;
  if (!kind || !BEAT_KINDS.includes(kind)) return undefined;
  const aiTitle = scene?.beat?.kind === kind ? toWords(scene.beat.title).slice(0, TITLE_MAX_WORDS).join(' ') : '';
  const title = aiTitle || fallbackBeatTitle(voiceover);
  return title ? { kind, title } : undefined;
}

export { planNarrativeBeats };
