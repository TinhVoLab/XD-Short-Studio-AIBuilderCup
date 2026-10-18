/**
 * Lint chữ trước khi xuất video: chặn chữ giữ chỗ còn sót (template / AI) như "[Tên sản phẩm]",
 * "[YOUR PRICE]", "{{title}}", "lorem ipsum". Dùng chung client (ExportModal) và server (/api/render/start).
 *
 * Không chặn ký hiệu thật: khoảng [0, 1], nồng độ [H+], nhãn [INFO] / [BREAKING NEWS], chữ cái đáp án [A].
 * File .js thuần để server import trực tiếp.
 */

// Các trường không phải chữ hiển thị (màu, font, URL, biểu thức toán, cấu hình…)
const NON_TEXT_KEY =
  /^(id|type|src|href|url|smiles|latex|latexLabel|expression|expressionY|parametricX|parametricY|vectorFieldExpr|svgContent|secondarySvgContent|fontFamily|fontWeight|blendMode|variant|theme|paletteId|mode|style|textAlign|easing|lookupName|icon|boxIcon|badgeMode|waveformStyle|objectFit|layout|shape|direction|pose|animPreset|sfxType)$|(Url|Src|Color|Id|Preset|Font)$/;

// Thành phần có ngoặc vuông là nội dung thật (code, toán, hoá) → bỏ qua
const SKIP_ELEMENT_TYPES = new Set(['code-terminal', 'latex-formula', 'math-plot', 'chemical-molecule']);

// Từ khoá giữ chỗ (Việt + Anh), so theo ranh giới chữ Unicode
const PLACEHOLDER_WORDS =
  /(?<!\p{L})(your|tên|giá|ngày|địa chỉ|số điện thoại|email|bổ sung|giữ nguyên|thay bằng|nhập|chèn|ví dụ|minh hoạ|minh họa|placeholder|todo|tbd|xxx|insert|name|price|title|date|link|logo)(?!\p{L})/iu;

/** Nội dung trong [...] có phải chữ giữ chỗ không */
function isPlaceholderBracket(inner) {
  const text = inner.trim();
  if (/…|\.\.\./.test(text)) return true; // [...], [Tên…]
  if (text.length < 2 || text.length > 60 || !/\p{L}/u.test(text)) return false;
  if (/[0-9+\-*/=^_<>%]/.test(text)) return false; // [0, 1], [H+], [x^2]: ký hiệu thật
  // Chỉ chặn khi có từ khoá giữ chỗ: nhãn trang trí [BREAKING NEWS], [INFO], [Wikipedia] vẫn qua
  return PLACEHOLDER_WORDS.test(text);
}

/**
 * @param {string} text
 * @returns {string[]} các đoạn giữ chỗ tìm thấy
 */
export function findPlaceholders(text) {
  if (typeof text !== 'string' || !text) return [];
  const found = [];
  for (const m of text.matchAll(/\[([^\[\]\n]{1,80})\]/g)) if (isPlaceholderBracket(m[1])) found.push(m[0]);
  for (const m of text.matchAll(/\{\{\s*[^{}\n]{1,40}\s*\}\}/g)) found.push(m[0]);
  for (const m of text.matchAll(/lorem ipsum/gi)) found.push(m[0]);
  return found;
}

/** Gom mọi chuỗi hiển thị trong một object (đệ quy), kèm đường dẫn trường */
function collectText(value, path, out, depth = 0) {
  if (depth > 6 || value == null) return;
  if (typeof value === 'string') {
    out.push([path, value]);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => collectText(v, `${path}[${i}]`, out, depth + 1));
    return;
  }
  if (typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (NON_TEXT_KEY.test(k)) continue;
      collectText(v, path ? `${path}.${k}` : k, out, depth + 1);
    }
  }
}

/**
 * Chữ giữ chỗ trong một thành phần.
 * @param {Record<string, any>} el
 * @returns {{ field: string, text: string }[]}
 */
export function lintElementText(el) {
  if (!el || SKIP_ELEMENT_TYPES.has(el.type)) return [];
  const pairs = [];
  collectText(el, '', pairs);
  return pairs.flatMap(([field, value]) => findPlaceholders(value).map((text) => ({ field, text })));
}

/**
 * Chữ giữ chỗ trong toàn bộ dự án (tiêu đề cảnh, lời thoại, mọi thành phần).
 * @param {Array<Record<string, any>>} scenes
 * @returns {{ sceneIdx: number, elementId: string | null, field: string, text: string }[]}
 */
export function lintScenesText(scenes) {
  const issues = [];
  (scenes || []).forEach((scene, sceneIdx) => {
    for (const field of ['name', 'title', 'voiceoverText']) {
      for (const text of findPlaceholders(scene?.[field])) issues.push({ sceneIdx, elementId: null, field, text });
    }
    for (const el of scene?.elements || []) {
      for (const issue of lintElementText(el)) issues.push({ sceneIdx, elementId: el.id ?? null, ...issue });
    }
  });
  return issues;
}

/** Câu báo lỗi ngắn cho người dùng */
export function describeLintIssues(issues) {
  if (!issues.length) return '';
  const first = issues[0];
  const more = issues.length > 1 ? ` và ${issues.length - 1} chỗ khác` : '';
  return `Cảnh ${first.sceneIdx + 1} còn chữ giữ chỗ “${first.text}”${more}. Hãy sửa trước khi xuất video.`;
}
