/**
 * Prompt của bộ xếp cảnh Master — sinh từ registry (src/config/sceneRecipes.js) và cấu trúc (src/config/videoPlan.js):
 * thêm mẫu, đổi giới hạn từ hay luật ghép mẫu không phải sửa prompt.
 */
import { SCENE_RECIPES, aiSlots } from '../../src/config/sceneRecipes.js';
import { sceneRoleSpec } from '../../src/config/sceneRoles.js';

const slotSpec = (def) => {
  switch (def.type) {
    case 'text': return `"${def.key}": string, tối đa ${def.maxWords} từ (${def.label})`;
    case 'number': return `"${def.key}": string, tối đa ${def.maxChars} ký tự (${def.label})`;
    case 'integer': return `"${def.key}": số nguyên ${def.min}–${def.max} (${def.label})${def.required ? '' : ', có thể bỏ'}`;
    case 'list': return `"${def.key}": mảng ${def.minItems}–${def.maxItems} chuỗi, mỗi chuỗi tối đa ${def.maxWords} từ (${def.label})`;
    default: return `"${def.key}"`;
  }
};

/** Một mẫu trong danh sách lựa chọn: id, tên, khi nào dùng, công thức, slot AI viết, gợi ý viết */
const recipeLine = (id, indent) => {
  const r = SCENE_RECIPES[id];
  const slots = aiSlots(id);
  return `${indent}• "${id}" — ${r.name}: ${r.useWhen}. Màn hình: ${r.formula}
${indent}  slots: { ${slots.length ? slots.map(slotSpec).join('; ') : 'không có'} }${r.aiHint ? `\n${indent}  ${r.aiHint}` : ''}`;
};

/** Luật ghép mẫu sinh từ registry, chỉ cho các mẫu có trong video này */
function pairingRules(ids) {
  const rules = [];
  for (const id of ids) {
    const r = SCENE_RECIPES[id];
    if (r.opensLoop && r.opensLoop !== 'next_episode') {
      const closers = ids.filter((x) => SCENE_RECIPES[x].closesLoop.includes(r.opensLoop));
      rules.push(`- Nếu chọn "${id}" thì một cảnh phía sau phải là ${closers.map((c) => `"${c}"`).join(' hoặc ')}.`);
    }
    for (const loop of r.requiresOpen || []) {
      const openers = ids.filter((x) => SCENE_RECIPES[x].opensLoop === loop);
      rules.push(`- Chỉ chọn "${id}" khi phía trước đã có ${openers.map((o) => `"${o}"`).join(' hoặc ')}.`);
    }
    if (r.listMatchesContent) rules.push(`- "${id}": "${r.listMatchesContent}" có đúng một mục cho mỗi cảnh nội dung, theo thứ tự.`);
  }
  return [...new Set(rules)];
}

/**
 * @param {{ topic: string, structure: Array<{ role: string, recipeId: string, recipeOptions?: string[], plannedSec: number, voiceWords: number }>, style?: string, extraRules?: string }} input
 * @param {string[]} [previousErrors] lỗi của lần sinh trước (lần tạo lại)
 */
export function buildMasterPlanPrompt({ topic, structure, style = '', extraRules = '' }, previousErrors = []) {
  const n = structure.filter((s) => s.role === 'content').length;
  const allIds = [...new Set(structure.flatMap((s) => s.recipeOptions?.length ? s.recipeOptions : [s.recipeId]))];

  const sceneLines = structure.map((s, i) => {
    const options = s.recipeOptions?.length ? s.recipeOptions : [s.recipeId];
    return `${i + 1}. ${sceneRoleSpec(s.role).label} — lời thoại ≈ ${s.voiceWords} từ (~${s.plannedSec} giây). ${options.length > 1 ? 'Chọn MỘT mẫu:' : 'Mẫu:'}
${options.map((id) => recipeLine(id, '   ')).join('\n')}`;
  });

  const rules = pairingRules(allIds);

  return `Bạn là biên kịch video ngắn tiếng Việt (TikTok / Reels / Shorts). Viết kịch bản cho chủ đề bên dưới theo ĐÚNG ${structure.length} cảnh, đúng thứ tự.

CHỦ ĐỀ: "${topic}"
${style ? `GIỌNG VĂN: ${style}\n` : ''}
CẤU TRÚC CẢNH (mỗi cảnh chọn một mẫu hợp với nội dung, trả về id mẫu trong "recipeId"):
${sceneLines.join('\n')}

QUY TẮC:
- "slots" là chữ hiện trên màn hình: ngắn, cụ thể, đúng giới hạn từ. "voiceoverText" là lời đọc: câu tự nhiên, có dấu phẩy để ngắt nhịp, nói lại ý của slots chứ không đọc nguyên văn.
- Video có đúng ${n} ý chính. Mỗi cảnh nội dung là MỘT ý, theo thứ tự.
- Slot không liệt kê ở mẫu (con số, số điều…) do hệ thống tự điền theo số ý, không cần viết.
${rules.join('\n')}
- Không bịa số liệu, phần trăm, nghiên cứu hay tên người. Không emoji, không viết HOA toàn bộ, không chữ giữ chỗ như [Tên...].
- "itemLabel": danh từ 1–2 từ gọi tên mỗi ý, viết hoa chữ đầu (ví dụ "Thói quen", "Mẹo", "Bước").
${extraRules}${previousErrors.length ? `\nLẦN TRƯỚC SAI, SỬA CÁC LỖI SAU:\n${previousErrors.map((e) => `- ${e}`).join('\n')}\n` : ''}
CHỈ TRẢ VỀ JSON (không markdown):
{
  "title": "tiêu đề video",
  "itemLabel": "Thói quen",
  "scenes": [ { "recipeId": "id mẫu đã chọn", "voiceoverText": "...", "slots": { } } ]
}`;
}
