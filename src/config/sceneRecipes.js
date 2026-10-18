/**
 * SSOT thư viện cảnh Master: mỗi "công thức cảnh" (recipe) khai báo vai trò, công thức chữ, slot AI phải điền,
 * kiểu nền, các mẫu nên đứng trước/sau và lời hứa treo nó mở / đóng.
 *
 * Thời lượng, số cảnh và năng lượng thuộc vai trò (config/sceneRoles.js), không lặp lại ở đây.
 * Màu và font lấy từ theme (config/themePalettes.js — surface 'ivory' | 'accent').
 * Mỗi recipe được vẽ bởi element `master-scene` với layout = id của recipe.
 *
 * Mỗi vai có thể có nhiều mẫu: bộ xếp cảnh (config/videoPlan.js) giữ cấu trúc vai theo độ dài, AI chọn mẫu
 * theo nội dung (useWhen). Luật ghép mẫu khai báo ngay trên mẫu, prompt và bộ kiểm tra sinh từ đây:
 *   systemSlots          slot hệ thống tự điền, AI không viết (vd con số của hook = số ý)
 *   listMatchesContent   slot danh sách phải có đúng số cảnh nội dung
 *   requiresOpen         chỉ dùng được khi lời hứa đó đã mở ở cảnh trước (vd Đáp án cần Đoán thử)
 *   copySlotsFrom        chép slot từ mẫu đã mở lời hứa, để hai cảnh luôn khớp nhau
 *   aiHint               gợi ý cách viết slot, đưa nguyên văn vào prompt
 * File .js thuần để server (bộ xếp cảnh, prompt AI) import trực tiếp.
 */
import { SCENE_ROLE_IDS } from './sceneRoles.js';

/** Lời hứa treo: mẫu mở ghi vào VideoPlan.openLoops, mẫu đóng tương ứng phải có trước CTA */
export const OPEN_LOOP_TYPES = ['answer', 'locked_item', 'full_list', 'outcomes', 'key_point', 'next_episode'];

/** Giá trị hệ thống điền cho systemSlots (tính từ cấu trúc video) */
export const SYSTEM_SLOT_SOURCES = ['contentCount'];

/**
 * slot.label = nhãn ô nhập trong Inspector; slot.type: 'text' (maxWords) | 'number' (con số hiển thị, maxChars) | 'integer' (min..max) | 'list' (minItems..maxItems, maxWords mỗi mục)
 * slot.indexOf (integer): chỉ số 1-based vào slot danh sách đó (mục quan trọng nhất, đáp án đúng)
 */
export const SCENE_RECIPES = {
  'hook.number': {
    role: 'hook',
    group: 'benefit',
    name: 'Con số gây chú ý',
    formula: '{so} {dieu} khiến bạn {ket_qua}',
    slots: [
      { label: 'Con số', key: 'so', type: 'number', maxChars: 4, required: true },
      { label: 'Điều gì', key: 'dieu', type: 'text', maxWords: 5, required: true },
      { label: 'Kết quả', key: 'ket_qua', type: 'text', maxWords: 4, required: true },
    ],
    emphasisSlot: 'so',
    surface: null,
    useWhen: 'Video dạng danh sách "n điều / n cách / n thói quen"',
    // Con số = số ý của video ("3 thói quen…" → 3 cảnh nội dung), không để AI bịa số liệu
    systemSlots: { so: 'contentCount' },
    pairsWith: { before: [], after: ['bridge.roadmap_three'] },
    opensLoop: null,
    closesLoop: [],
    requires: [],
  },

  'bridge.roadmap_three': {
    role: 'bridge',
    group: 'roadmap',
    name: 'Ba điều',
    formula: '{n} điều, và điều cuối {nhan_manh}',
    slots: [
      { label: 'Số điều', key: 'n', type: 'integer', min: 2, max: 5, required: true },
      { label: 'Nhấn mạnh', key: 'nhan_manh', type: 'text', maxWords: 4, required: true },
    ],
    emphasisSlot: 'nhan_manh',
    surface: null,
    useWhen: 'Hứa trước số điều sẽ nói, điều cuối quan trọng nhất',
    systemSlots: { n: 'contentCount' },
    pairsWith: { before: ['hook.number'], after: ['content.key_point'] },
    // Hứa có n điều → Tổng kết phải liệt kê đủ
    opensLoop: 'full_list',
    closesLoop: [],
    requires: [],
  },

  'content.key_point': {
    role: 'content',
    group: 'key_point',
    name: 'Thẻ ý chính',
    formula: '{y} · Vì sao: {ly_do}',
    slots: [
      { label: 'Ý chính', key: 'y', type: 'text', maxWords: 8, required: true },
      { label: 'Vì sao', key: 'ly_do', type: 'text', maxWords: 14, required: true },
    ],
    emphasisSlot: 'y',
    surface: null,
    useWhen: 'Một ý chính kèm lý do ngắn',
    aiHint: 'Trong "y", đặt cụm cần nhấn mạnh sau dấu phẩy cuối (vd "Dậy cùng một giờ, kể cả cuối tuần").',
    // Nhãn vị trí "Ý n/tổng" do bộ xếp cảnh điền (không phải AI)
    showsPosition: true,
    pairsWith: { before: ['bridge.roadmap_three', 'content.key_point', 'retention.wait'], after: ['content.key_point', 'retention.wait', 'climax.summary'] },
    opensLoop: null,
    closesLoop: [],
    requires: [],
  },

  'retention.wait': {
    role: 'retention',
    group: 'pattern_break',
    name: 'Khoan đã',
    formula: 'Khoan. · Đây là phần {ly_do}',
    slots: [{ label: 'Lý do', key: 'ly_do', type: 'text', maxWords: 8, required: true }],
    emphasisSlot: null,
    surface: 'accent',
    useWhen: 'Ngắt nhịp, báo phần sắp tới quan trọng',
    pairsWith: { before: ['content.key_point'], after: ['content.key_point'] },
    opensLoop: null,
    closesLoop: [],
    requires: [],
  },

  'climax.summary': {
    role: 'climax',
    group: 'summary',
    name: 'Tổng kết',
    formula: '{tieu_de} · {muc[]} — mục quan trọng nhất viền màu',
    slots: [
      { label: 'Tiêu đề', key: 'tieu_de', type: 'text', maxWords: 6, required: true },
      { label: 'Các mục', key: 'muc', type: 'list', minItems: 2, maxItems: 5, maxWords: 6, required: true },
      { label: 'Mục quan trọng nhất', key: 'quan_trong_nhat', type: 'integer', min: 1, max: 5, required: false, indexOf: 'muc' },
    ],
    emphasisSlot: 'quan_trong_nhat',
    surface: null,
    useWhen: 'Nhắc lại toàn bộ các ý, bắt buộc khi cầu nối đã hứa đủ danh sách',
    listMatchesContent: 'muc',
    pairsWith: { before: ['content.key_point'], after: ['cta.save'] },
    opensLoop: null,
    closesLoop: ['full_list', 'outcomes'],
    requires: [],
  },

  'cta.save': {
    role: 'cta',
    group: 'save_share',
    name: 'Lưu cho sáng mai',
    formula: 'Lưu lại cho {thoi_diem} · {ly_do}',
    slots: [
      { label: 'Lưu cho lúc nào', key: 'thoi_diem', type: 'text', maxWords: 4, required: true },
      { label: 'Lý do', key: 'ly_do', type: 'text', maxWords: 8, required: true },
    ],
    emphasisSlot: null,
    surface: 'ivory',
    useWhen: 'Nội dung người xem sẽ cần dùng lại',
    pairsWith: { before: ['climax.summary'], after: [] },
    opensLoop: null,
    closesLoop: [],
    requires: [],
  },

  // ── Đợt 2: mỗi vai thêm 2 mẫu ───────────────────────────────────────────

  'hook.question': {
    role: 'hook',
    group: 'curiosity',
    name: 'Câu hỏi mở',
    formula: '{cau_hoi} [{nhan_manh}]',
    slots: [
      { label: 'Câu hỏi', key: 'cau_hoi', type: 'text', maxWords: 8, required: true },
      { label: 'Đuôi câu nhấn mạnh', key: 'nhan_manh', type: 'text', maxWords: 3, required: true },
    ],
    emphasisSlot: 'nhan_manh',
    surface: null,
    useWhen: 'Chủ đề trả lời một câu hỏi "vì sao / làm sao"',
    aiHint: '"cau_hoi" + "nhan_manh" đọc liền thành một câu hỏi, "nhan_manh" là phần cuối có dấu "?" (vd "Vì sao dậy sớm lại khiến bạn" + "mệt hơn?").',
    pairsWith: { before: [], after: ['bridge.problem', 'bridge.roadmap_three'] },
    opensLoop: null,
    closesLoop: [],
    requires: [],
  },

  'hook.myth': {
    role: 'hook',
    group: 'rebuttal',
    name: 'Tưởng vậy mà không phải',
    formula: 'Mọi người nghĩ {nghi} · Thực tế {thuc_te}',
    slots: [
      { label: 'Mọi người nghĩ', key: 'nghi', type: 'text', maxWords: 8, required: true },
      { label: 'Thực tế', key: 'thuc_te', type: 'text', maxWords: 8, required: true },
    ],
    emphasisSlot: 'thuc_te',
    surface: null,
    useWhen: 'Chủ đề sửa một ngộ nhận phổ biến',
    aiHint: '"nghi" là quan niệm sai phổ biến, "thuc_te" là điều đúng, hai vế cùng chủ ngữ (vd "Tiết kiệm là cắt giảm mọi thứ" / "Tiết kiệm là chi đúng chỗ").',
    pairsWith: { before: [], after: ['bridge.problem', 'bridge.steps'] },
    opensLoop: null,
    closesLoop: [],
    requires: [],
  },

  'bridge.steps': {
    role: 'bridge',
    group: 'roadmap',
    name: 'Các bước',
    formula: 'Quy trình · {tieu_de} · {buoc[]}',
    slots: [
      { label: 'Tiêu đề', key: 'tieu_de', type: 'text', maxWords: 10, required: true },
      { label: 'Tên các bước', key: 'buoc', type: 'list', minItems: 2, maxItems: 5, maxWords: 3, required: true },
    ],
    emphasisSlot: null,
    surface: null,
    useWhen: 'Video hướng dẫn làm theo thứ tự, mỗi cảnh nội dung là một bước',
    aiHint: '"buoc": tên ngắn của từng bước (1–3 từ), đúng thứ tự các cảnh nội dung.',
    listMatchesContent: 'buoc',
    pairsWith: { before: ['hook.myth', 'hook.number'], after: ['content.key_point', 'content.do_dont'] },
    opensLoop: null,
    closesLoop: [],
    requires: [],
  },

  'bridge.problem': {
    role: 'bridge',
    group: 'problem',
    name: 'Vấn đề và hệ quả',
    formula: '{van_de} ↓ {he_qua}',
    slots: [
      { label: 'Vấn đề', key: 'van_de', type: 'text', maxWords: 10, required: true },
      { label: 'Hệ quả', key: 'he_qua', type: 'text', maxWords: 10, required: true },
      { label: 'Cụm nhấn mạnh trong hệ quả', key: 'nhan_manh', type: 'text', maxWords: 4, required: false },
    ],
    emphasisSlot: 'nhan_manh',
    surface: null,
    useWhen: 'Nêu một thói quen hay tình huống phổ biến và hậu quả của nó trước khi đưa giải pháp',
    aiHint: '"nhan_manh" là một cụm có nguyên văn trong "he_qua".',
    pairsWith: { before: ['hook.question', 'hook.myth'], after: ['content.key_point', 'content.do_dont', 'content.cause_chain'] },
    opensLoop: null,
    closesLoop: [],
    requires: [],
  },

  'content.do_dont': {
    role: 'content',
    group: 'compare',
    name: 'Nên và không nên',
    formula: 'Không nên: {khong_nen} · Nên: {nen}',
    slots: [
      { label: 'Không nên', key: 'khong_nen', type: 'text', maxWords: 10, required: true },
      { label: 'Nên', key: 'nen', type: 'text', maxWords: 10, required: true },
    ],
    emphasisSlot: 'nen',
    surface: null,
    useWhen: 'Ý dạng sai lầm thường gặp và cách làm đúng thay thế',
    showsPosition: true,
    pairsWith: { before: ['bridge.problem', 'bridge.steps', 'content.do_dont', 'content.key_point'], after: ['content.do_dont', 'content.key_point', 'climax.summary', 'climax.key_line'] },
    opensLoop: null,
    closesLoop: [],
    requires: [],
  },

  'content.cause_chain': {
    role: 'content',
    group: 'explain',
    name: 'Chuỗi nguyên nhân',
    formula: '{chuoi[]} — nguyên nhân → … → kết quả',
    slots: [{ label: 'Chuỗi nguyên nhân', key: 'chuoi', type: 'list', minItems: 2, maxItems: 4, maxWords: 5, required: true }],
    emphasisSlot: null,
    surface: null,
    useWhen: 'Ý giải thích vì sao: nguyên nhân dẫn tới kết quả qua 2–4 nấc',
    aiHint: '"chuoi": từ nguyên nhân tới kết quả, mỗi nấc 2–5 từ, nấc cuối là kết quả (vd "Ngủ đủ giấc", "Dậy tỉnh táo", "Tập trung cả buổi sáng").',
    showsPosition: true,
    pairsWith: { before: ['bridge.problem', 'content.key_point', 'content.cause_chain'], after: ['content.key_point', 'content.cause_chain', 'climax.key_line', 'climax.summary'] },
    opensLoop: null,
    closesLoop: [],
    requires: [],
  },

  'retention.halfway': {
    role: 'retention',
    group: 'progress',
    name: 'Đã qua một nửa',
    formula: 'Tiến độ {%} · {cau}',
    slots: [
      { label: 'Câu hứa', key: 'cau', type: 'text', maxWords: 10, required: true },
      { label: 'Cụm nhấn mạnh', key: 'nhan_manh', type: 'text', maxWords: 4, required: false },
    ],
    emphasisSlot: 'nhan_manh',
    surface: null,
    useWhen: 'Nhắc người xem đã đi được nửa đường, phần sau còn hay hơn',
    aiHint: 'Không ghi số ý còn lại (thanh tiến độ do hệ thống vẽ). "nhan_manh" là một cụm có nguyên văn trong "cau".',
    // Thanh tiến độ = số ý đã qua / tổng số ý (vị trí do bộ xếp cảnh điền)
    showsPosition: true,
    pairsWith: { before: ['content.key_point', 'content.do_dont', 'content.cause_chain'], after: ['content.key_point', 'content.do_dont', 'content.cause_chain'] },
    opensLoop: null,
    closesLoop: [],
    requires: [],
  },

  'retention.guess': {
    role: 'retention',
    group: 'challenge',
    name: 'Đoán thử',
    formula: 'Đoán thử · {cau_hoi} · {lua_chon[]} · Đáp án ở cuối video',
    slots: [
      { label: 'Câu hỏi', key: 'cau_hoi', type: 'text', maxWords: 12, required: true },
      { label: 'Các lựa chọn', key: 'lua_chon', type: 'list', minItems: 2, maxItems: 4, maxWords: 3, required: true },
    ],
    emphasisSlot: null,
    surface: null,
    useWhen: 'Có một câu đố mà đáp án nằm trong chính nội dung video',
    aiHint: 'Chỉ hỏi điều video sẽ nói rõ, không hỏi số liệu bên ngoài. Các lựa chọn ngắn (1–3 từ), đúng một lựa chọn đúng.',
    pairsWith: { before: ['content.key_point', 'content.cause_chain'], after: ['content.key_point', 'content.cause_chain'] },
    opensLoop: 'answer',
    closesLoop: [],
    requires: [],
  },

  'climax.answer': {
    role: 'climax',
    group: 'answer',
    name: 'Đáp án',
    formula: 'Đáp án · {cau_hoi} · {lua_chon[]} (đúng: {dung}) · {ket_qua}',
    slots: [
      { label: 'Câu hỏi', key: 'cau_hoi', type: 'text', maxWords: 12, required: true },
      { label: 'Các lựa chọn', key: 'lua_chon', type: 'list', minItems: 2, maxItems: 4, maxWords: 3, required: true },
      { label: 'Lựa chọn đúng', key: 'dung', type: 'integer', min: 1, max: 4, required: true, indexOf: 'lua_chon' },
      { label: 'Kết quả', key: 'ket_qua', type: 'text', maxWords: 12, required: true },
      { label: 'Cụm nhấn mạnh', key: 'nhan_manh', type: 'text', maxWords: 4, required: false },
    ],
    emphasisSlot: 'nhan_manh',
    surface: null,
    useWhen: 'Trả lời câu đố của cảnh Đoán thử',
    aiHint: '"dung" là số thứ tự (1, 2, 3…) của lựa chọn đúng trong câu đố. "ket_qua" giải thích ngắn vì sao đúng.',
    // Câu hỏi và lựa chọn chép từ Đoán thử để hai cảnh luôn khớp
    copySlotsFrom: { recipe: 'retention.guess', keys: ['cau_hoi', 'lua_chon'] },
    requiresOpen: ['answer'],
    pairsWith: { before: ['content.key_point', 'content.cause_chain'], after: ['cta.share', 'cta.save'] },
    opensLoop: null,
    closesLoop: ['answer'],
    requires: [],
  },

  'climax.key_line': {
    role: 'climax',
    group: 'takeaway',
    name: 'Một câu cần nhớ',
    formula: 'Nếu chỉ nhớ một điều · {cau}',
    slots: [
      { label: 'Câu chốt', key: 'cau', type: 'text', maxWords: 12, required: true },
      { label: 'Cụm gạch chân', key: 'nhan_manh', type: 'text', maxWords: 4, required: false },
    ],
    emphasisSlot: 'nhan_manh',
    surface: 'ivory',
    useWhen: 'Chốt bằng một thông điệp duy nhất (khi cầu nối không hứa đủ danh sách)',
    aiHint: '"nhan_manh" là một cụm có nguyên văn trong "cau".',
    pairsWith: { before: ['content.key_point', 'content.do_dont', 'content.cause_chain'], after: ['cta.share', 'cta.save'] },
    opensLoop: null,
    closesLoop: ['key_point'],
    requires: [],
  },

  'cta.share': {
    role: 'cta',
    group: 'save_share',
    name: 'Gửi cho một người',
    formula: 'Gửi cho {nguoi} · {loi_ich}',
    slots: [
      { label: 'Người nhận', key: 'nguoi', type: 'text', maxWords: 8, required: true },
      { label: 'Lợi ích cho họ', key: 'loi_ich', type: 'text', maxWords: 8, required: true },
    ],
    emphasisSlot: 'nguoi',
    surface: null,
    useWhen: 'Nội dung hữu ích cho một kiểu người cụ thể mà người xem quen',
    aiHint: '"nguoi" mô tả cụ thể người nhận, đọc liền sau "Gửi cho" (vd "người bạn hay dậy muộn nhất").',
    pairsWith: { before: ['climax.key_line', 'climax.answer', 'climax.summary'], after: [] },
    opensLoop: null,
    closesLoop: [],
    requires: [],
  },

  'cta.pick_number': {
    role: 'cta',
    group: 'comment',
    name: 'Bạn chọn số mấy?',
    formula: '{cau} · ô số 1…{n}',
    slots: [
      { label: 'Câu hỏi', key: 'cau', type: 'text', maxWords: 10, required: true },
      { label: 'Số ô', key: 'n', type: 'integer', min: 2, max: 5, required: true },
    ],
    emphasisSlot: null,
    surface: null,
    useWhen: 'Video danh sách: hỏi người xem sẽ bắt đầu với ý số mấy',
    aiHint: '"cau" hỏi người xem chọn ý số mấy, dùng tên gọi của các ý (vd "Bạn sẽ bắt đầu với thói quen số mấy?").',
    // Số ô = số ý của video
    systemSlots: { n: 'contentCount' },
    pairsWith: { before: ['climax.summary'], after: [] },
    opensLoop: null,
    closesLoop: [],
    requires: [],
  },
};

export function getSceneRecipe(id) {
  return SCENE_RECIPES[id] || null;
}

export function recipesForRole(role) {
  return Object.entries(SCENE_RECIPES)
    .filter(([, r]) => r.role === role)
    .map(([id, r]) => ({ id, ...r }));
}

/** Mẫu mặc định của vai: mẫu đầu tiên khai báo (an toàn khi AI chọn mẫu không hợp lệ) */
export function defaultRecipeId(role) {
  return recipesForRole(role)[0]?.id || null;
}

/** Slot AI phải viết (bỏ slot hệ thống tự điền và slot chép từ mẫu mở lời hứa) */
export function aiSlots(id) {
  const r = SCENE_RECIPES[id];
  const copied = new Set(r?.copySlotsFrom?.keys || []);
  return r ? r.slots.filter((s) => !r.systemSlots?.[s.key] && !copied.has(s.key)) : [];
}

/** Mẫu nên đứng sau `id` (theo pairsWith.after), lọc theo vai nếu có */
export function nextRecipeIds(id, role) {
  const after = SCENE_RECIPES[id]?.pairsWith?.after || [];
  return role ? after.filter((r) => SCENE_RECIPES[r]?.role === role) : after;
}

const countWords = (s) => String(s ?? '').trim().split(/\s+/).filter(Boolean).length;

/**
 * Kiểm slot AI điền cho một recipe: thiếu slot bắt buộc, sai kiểu, quá số từ / số mục.
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateRecipeSlots(id, slots = {}) {
  const recipe = SCENE_RECIPES[id];
  if (!recipe) return { ok: false, errors: [`Không có mẫu cảnh ${id}`] };
  const errors = [];
  for (const def of recipe.slots) {
    const v = slots?.[def.key];
    const empty = v === undefined || v === null || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && v.length === 0);
    if (empty) {
      if (def.required) errors.push(`${def.key}: thiếu`);
      continue;
    }
    if (def.type === 'text' && def.maxWords && countWords(v) > def.maxWords) errors.push(`${def.key}: quá ${def.maxWords} từ`);
    if (def.type === 'number' && String(v).length > (def.maxChars || 6)) errors.push(`${def.key}: quá ${def.maxChars} ký tự`);
    if (def.type === 'integer') {
      const n = Number(v);
      if (!Number.isInteger(n) || n < def.min || n > def.max) errors.push(`${def.key}: phải là số nguyên ${def.min}–${def.max}`);
    }
    if (def.type === 'list') {
      if (!Array.isArray(v)) errors.push(`${def.key}: phải là danh sách`);
      else {
        if (v.length < def.minItems || v.length > def.maxItems) errors.push(`${def.key}: cần ${def.minItems}–${def.maxItems} mục`);
        v.forEach((item, i) => {
          if (def.maxWords && countWords(item) > def.maxWords) errors.push(`${def.key}[${i}]: quá ${def.maxWords} từ`);
        });
      }
    }
  }
  return { ok: errors.length === 0, errors };
}

/** Kiểm toàn vẹn registry (dùng trong test): vai, slot trong công thức, cặp ghép, lời hứa treo */
export function auditSceneRecipes() {
  const problems = [];
  const opened = new Set();
  const closed = new Set();
  for (const [id, r] of Object.entries(SCENE_RECIPES)) {
    if (!id.startsWith(`${r.role}.`)) problems.push(`${id}: id phải bắt đầu bằng vai "${r.role}."`);
    if (!SCENE_ROLE_IDS.includes(r.role)) problems.push(`${id}: vai không hợp lệ ${r.role}`);
    const keys = new Set(r.slots.map((s) => s.key));
    for (const m of r.formula.matchAll(/\{([a-z_]+)(\[\])?\}/g)) if (!keys.has(m[1])) problems.push(`${id}: công thức dùng {${m[1]}} chưa khai báo slot`);
    if (r.emphasisSlot && !keys.has(r.emphasisSlot)) problems.push(`${id}: emphasisSlot ${r.emphasisSlot} không có`);
    for (const side of ['before', 'after']) for (const ref of r.pairsWith[side]) if (!SCENE_RECIPES[ref]) problems.push(`${id}: pairsWith.${side} trỏ tới ${ref} không tồn tại`);
    if (r.opensLoop) {
      if (!OPEN_LOOP_TYPES.includes(r.opensLoop)) problems.push(`${id}: opensLoop lạ ${r.opensLoop}`);
      opened.add(r.opensLoop);
    }
    for (const c of r.closesLoop) {
      if (!OPEN_LOOP_TYPES.includes(c)) problems.push(`${id}: closesLoop lạ ${c}`);
      closed.add(c);
    }
    if (!r.useWhen) problems.push(`${id}: thiếu useWhen (gợi ý cho AI chọn mẫu)`);
    for (const [k, src] of Object.entries(r.systemSlots || {})) {
      if (!keys.has(k)) problems.push(`${id}: systemSlots.${k} không phải slot`);
      if (!SYSTEM_SLOT_SOURCES.includes(src)) problems.push(`${id}: systemSlots.${k} nguồn lạ ${src}`);
    }
    for (const def of r.slots) if (def.indexOf && r.slots.find((x) => x.key === def.indexOf)?.type !== 'list') problems.push(`${id}: ${def.key}.indexOf phải trỏ tới slot danh sách`);
    if (r.listMatchesContent && r.slots.find((s) => s.key === r.listMatchesContent)?.type !== 'list') problems.push(`${id}: listMatchesContent phải trỏ tới slot danh sách`);
    for (const loop of r.requiresOpen || []) if (!OPEN_LOOP_TYPES.includes(loop)) problems.push(`${id}: requiresOpen lạ ${loop}`);
    if (r.copySlotsFrom) {
      const src = SCENE_RECIPES[r.copySlotsFrom.recipe];
      if (!src) problems.push(`${id}: copySlotsFrom trỏ tới ${r.copySlotsFrom.recipe} không tồn tại`);
      else for (const k of r.copySlotsFrom.keys) if (!keys.has(k) || !src.slots.some((s) => s.key === k)) problems.push(`${id}: copySlotsFrom.${k} phải có ở cả hai mẫu`);
    }
  }
  // next_episode được đóng ở video sau trong series → không cần mẫu đóng trong cùng video
  for (const loop of opened) if (loop !== 'next_episode' && !closed.has(loop)) problems.push(`lời hứa ${loop} không có mẫu nào đóng`);
  return problems;
}
