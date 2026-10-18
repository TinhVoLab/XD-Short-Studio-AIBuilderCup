/**
 * Giọng chữ (typographic voice) của master-hook theo archetype — SSOT dữ liệu, JS thuần để cả Remotion,
 * công thức chiều cao (hookLayout.js) và server dùng chung. Tên font ở đây là tên gốc (Google Fonts);
 * Remotion ánh xạ qua getViralFontFamily trong MasterHook/config/typographicVoice.ts.
 */

/** Mỗi archetype một giọng: font, độ đậm, giãn chữ, kiểu viết hoa, line-height, kiểu badge */
export const HOOK_TYPOGRAPHIC_VOICES = {
  warning: { fontFamily: 'Oswald', fontWeight: 700, letterSpacing: '-0.02em', transformMode: 'uppercase', lineHeight: 1.1, badgeStyle: 'hazard-caution' },
  // Tinh tế, không la hét
  healing: { fontFamily: 'Playfair Display', fontWeight: 400, letterSpacing: '0.04em', transformMode: 'editorial', lineHeight: 1.35, badgeStyle: 'editorial-italic' },
  secret: { fontFamily: 'Space Grotesk', fontWeight: 700, letterSpacing: '0.04em', transformMode: 'uppercase', lineHeight: 1.15, badgeStyle: 'tech-pill' },
  tips: { fontFamily: 'Be Vietnam Pro', fontWeight: 900, letterSpacing: '-0.02em', transformMode: 'uppercase', lineHeight: 1.08, badgeStyle: 'neon-glow' },
  versus: { fontFamily: 'Montserrat', fontWeight: 900, letterSpacing: '-0.02em', transformMode: 'uppercase', lineHeight: 1.05, badgeStyle: 'neon-glow' },
  curiosity: { fontFamily: 'Be Vietnam Pro', fontWeight: 700, letterSpacing: '0.01em', transformMode: 'editorial', lineHeight: 1.25, badgeStyle: 'minimal-dash' },
  custom: { fontFamily: 'Be Vietnam Pro', fontWeight: 800, letterSpacing: '-0.01em', transformMode: 'uppercase', lineHeight: 1.1, badgeStyle: 'minimal-dash' },
};

/** Giọng chữ của archetype (không rõ → custom) */
export function getHookVoice(archetype) {
  return HOOK_TYPOGRAPHIC_VOICES[archetype] || HOOK_TYPOGRAPHIC_VOICES.custom;
}

/**
 * Định dạng hoa/thường an toàn với tiếng Việt (không dựa vào CSS capitalize; xử lý cả chữ AI viết hoa toàn bộ).
 * uppercase: IN HOA · editorial: viết hoa chữ đầu câu · title: Viết Hoa Mỗi Từ · none: giữ nguyên
 */
export function formatTypographicText(text, mode = 'none') {
  if (!text) return '';
  const trimmed = String(text).trim();
  if (mode === 'uppercase') return trimmed.toUpperCase();
  if (mode === 'editorial') {
    const lower = trimmed.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }
  if (mode === 'title') {
    return trimmed.toLowerCase().split(/\s+/).map(w => (w ? w.charAt(0).toUpperCase() + w.slice(1) : '')).join(' ');
  }
  return trimmed;
}

/** Giãn chữ dạng '0.04em' → px theo cỡ chữ */
export function letterSpacingPx(letterSpacing, fontSize) {
  const m = /^(-?[\d.]+)(em|px)?$/.exec(String(letterSpacing ?? '').trim());
  if (!m) return 0;
  return m[2] === 'px' ? Number(m[1]) : Number(m[1]) * fontSize;
}
