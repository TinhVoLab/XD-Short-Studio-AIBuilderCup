/**
 * SSOT hình học & ngữ nghĩa của layer `highlight-box`.
 * Dùng chung cho: Remotion (HighlightBoxElement), Fabric (highlightBoxFabricRenderer),
 * công thức chiều cao (layoutRegistry.calculateElementDynamicHeight) và server (elementDefaulters).
 * Mọi con số ở đây phải khớp DOM của Remotion — kiểm chứng bằng tests/render/layoutCalibration.cjs.
 */

import { estimateTextLines, estimateTextWidth, FIT_EPSILON } from './textMetrics.js';

// Đo chữ bằng glyph thật: src/config/textMetrics.js (dùng chung mọi widget)
export { estimateTextLines };

export const HIGHLIGHT_BOX_SPEC = {
  /** Độ đậm chữ theo kiểu (khớp DOM) — dùng để tra độ rộng glyph thật trong fontMetrics.js */
  weights: { body: 600, pill: 700, sticker: 800, number: 800 },
  callout: { padY: 12, padX: 14, border: 1.5, iconSize: 28, gap: 10, lineHeight: 1.42 },
  strip: { padY: 10, padX: 14, borderLeft: 4, iconSize: 18, gap: 8, lineHeight: 1.4 },
  pill: { padY: 8, padX: 16, border: 1.5, iconSize: 16, gap: 8, lineHeight: 1.35, minFont: 12 },
  sticker: { wrapPadY: 8, wrapPadX: 12, gap: 8, padY: 8, padX: 16, border: 1.5, lineHeight: 1.35, fontScale: 0.95, minFont: 12 },
  bullet: { rowGap: 8, padY: 10, padX: 14, padYPlain: 12, padXPlain: 18, border: 1, badgeNumber: 30, badgeIcon: 26, gap: 12, lineHeight: 1.4 },
};

export const HIGHLIGHT_VARIANTS = ['callout-card', 'accent-strip', 'glow-pill', 'multi-pill', 'bullet-list'];

/** Tách dòng: xuống dòng, hoặc dấu • khi chỉ có một dòng */
export function splitHighlightLines(text) {
  const raw = String(text || '').trim();
  if (!raw) return [];
  let lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length <= 1 && raw.includes('•')) {
    lines = raw.split('•').map(l => l.trim()).filter(Boolean);
  }
  return lines;
}

/**
 * Bỏ ký hiệu đầu dòng (•, ✦, ★, ✓, ➤, emoji, "- ", "1.", "2)") — huy hiệu/icon của hộp đã đảm nhiệm —
 * nhưng GIỮ con số thuộc nội dung: "90% nhà đầu tư", "3 bước", "-5% lạm phát" không bị đổi.
 */
const LEADING_MARKER = /^\s*(?:[•*✦✧◈◆◇★☆✓✔➤→▶►▸·]\uFE0F?\s*|-\s+|\d{1,2}[.)]\s+|\p{Extended_Pictographic}\uFE0F?\s*)+/u;
export function cleanHighlightLine(line) {
  return String(line || '').replace(LEADING_MARKER, '').trim();
}

/** Các dòng của bullet-list đúng như hiển thị (đã bỏ ký hiệu đầu dòng) — dùng chung cho layout & reveal */
export function highlightBulletRows(text) {
  const rows = splitHighlightLines(text).map(cleanHighlightLine).filter(Boolean);
  const raw = String(text || '').trim();
  return rows.length ? rows : (raw ? [raw] : []);
}

/** Tách sticker: theo dòng, rồi theo , ; hoặc " - " có khoảng trắng (không cắt "COVID-19") */
export function splitHighlightStickers(text) {
  const lines = splitHighlightLines(text);
  if (lines.length > 1) return lines.map(cleanHighlightLine).filter(Boolean);
  const single = lines[0] || '';
  const parts = single.split(/\s*[,;]\s*|\s+[-–]\s+/).map(cleanHighlightLine).filter(Boolean);
  return parts.length > 1 ? parts : (single ? [cleanHighlightLine(single)] : []);
}

/** Câu kêu gọi hành động ngắn (mở đầu bằng động từ CTA) → glow-pill */
const CTA_START = /^(follow|theo dõi|lưu|bấm|nhấn|comment|bình luận|chia sẻ|share|đăng ký|subscribe|xem ngay|thử ngay|tải ngay|inbox|nhắn tin)\b/i;

/** Kiểu thực tế khi variant là 'auto' / không đặt */
export function resolveHighlightVariant(el) {
  const v = el && el.variant;
  if (v && v !== 'auto' && HIGHLIGHT_VARIANTS.includes(v)) return v;
  const lines = splitHighlightLines(el && (el.content || el.title || el.text));
  if (lines.length > 1) return 'bullet-list';
  const single = lines[0] || '';
  if (single.length <= 48 && CTA_START.test(single)) return 'glow-pill';
  return 'callout-card';
}

/** Badge của bullet-list: số thứ tự, icon hay không có */
export function resolveBulletBadge(el, lineCount) {
  const mode = el.badgeMode || 'auto';
  const showNumber = mode === 'number' || (mode === 'auto' && lineCount > 1);
  const showIcon = !showNumber && (mode === 'icon' || Boolean(el.boxIcon && el.boxIcon !== 'none' && mode !== 'none'));
  return { showNumber, showIcon };
}

/**
 * Bố cục đầy đủ của highlight-box: kiểu, các dòng/sticker và chiều cao từng phần.
 * height là chiều cao khung ngoài (px) — đúng bằng DOM Remotion.
 */
export function layoutHighlightBox(el) {
  const S = HIGHLIGHT_BOX_SPEC;
  const variant = resolveHighlightVariant(el);
  const w = el.width || 320;
  const fontSize = el.fontSize || 14;
  const text = String(el.content || el.title || el.text || '').trim() || 'Nội dung điểm nhấn...';
  const hasIcon = Boolean((el.boxIcon && el.boxIcon !== 'none') || el.badgeMode === 'icon');
  const W = S.weights;
  // preventOrphanText được áp dụng khi render → hai từ cuối dính nhau (orphanGuard)
  const textOpts = { fontFamily: el.fontFamily, emphasizeNumbers: el.emphasizeNumbers !== false, orphanGuard: true };

  if (variant === 'bullet-list') {
    const B = S.bullet;
    const rowsText = highlightBulletRows(text);
    const { showNumber, showIcon } = resolveBulletBadge(el, rowsText.length);
    const hasBadge = showNumber || showIcon;
    const badge = showNumber ? B.badgeNumber : showIcon ? B.badgeIcon : 0;
    const padY = hasBadge ? B.padY : B.padYPlain;
    const padX = hasBadge ? B.padX : B.padXPlain;
    // Căn giữa có huy hiệu: thêm khoảng đối xứng bên phải để chữ căn giữa theo cả thẻ, không lệch phải
    const centerSpacer = hasBadge && el.textAlign === 'center' ? badge + B.gap : 0;
    const availW = w - padX * 2 - B.border * 2 - (hasBadge ? badge + B.gap : 0) - centerSpacer;
    const rows = rowsText.map(t => {
      const textLines = estimateTextLines(t, availW, fontSize, { ...textOpts, weight: W.body });
      const height = Math.max(badge, textLines * fontSize * B.lineHeight) + padY * 2 + B.border * 2;
      return { text: t, textLines, height };
    });
    const height = rows.reduce((s, r) => s + r.height, 0) + Math.max(0, rows.length - 1) * B.rowGap;
    return { variant, rows, height: Math.round(height), fontSize, showNumber, showIcon, centerSpacer };
  }

  if (variant === 'multi-pill') {
    const K = S.sticker;
    const fs = Math.max(K.minFont, fontSize * K.fontScale);
    const items = splitHighlightStickers(text);
    const innerW = w - K.wrapPadX * 2;
    const pillChrome = K.padX * 2 + K.border * 2;
    const pills = items.map(t => {
      const stickerOpts = { ...textOpts, weight: W.sticker, orphanGuard: false };
      const natural = estimateTextWidth(t, fs, stickerOpts) + pillChrome;
      const pillW = Math.min(innerW, natural);
      // Vừa một dòng thì sticker co theo chữ; chỉ xuống dòng khi chạm bề rộng tối đa
      const textLines = natural <= innerW + FIT_EPSILON ? 1 : estimateTextLines(t, innerW - pillChrome, fs, stickerOpts);
      return { text: t, width: pillW, height: textLines * fs * K.lineHeight + K.padY * 2 + K.border * 2 };
    });
    // Xếp flex-wrap: dồn sticker vào hàng tới khi tràn bề rộng
    const lines = [];
    let rowW = 0;
    pills.forEach(p => {
      const next = rowW === 0 ? p.width : rowW + K.gap + p.width;
      if (next > innerW && rowW > 0) {
        lines.push([p]);
        rowW = p.width;
      } else {
        if (lines.length === 0) lines.push([]);
        lines[lines.length - 1].push(p);
        rowW = next;
      }
    });
    const contentH = lines.reduce((s, row) => s + Math.max(...row.map(p => p.height)), 0) + Math.max(0, lines.length - 1) * K.gap;
    return { variant, pills, pillRows: lines, height: Math.round(contentH + K.wrapPadY * 2), fontSize: fs };
  }

  // Văn bản hiển thị: bỏ ký hiệu đầu mỗi dòng như bullet (icon của hộp đã đảm nhiệm)
  const displayText = splitHighlightLines(text).map(cleanHighlightLine).filter(Boolean).join('\n') || text;
  const V = variant === 'glow-pill' ? S.pill : variant === 'accent-strip' ? S.strip : S.callout;
  const fs = variant === 'glow-pill' ? Math.max(S.pill.minFont, fontSize) : fontSize;
  const borderX = variant === 'accent-strip' ? S.strip.borderLeft : V.border * 2;
  const borderY = variant === 'accent-strip' ? 0 : V.border * 2;
  const iconW = hasIcon ? V.iconSize + V.gap : 0;
  // Callout căn giữa có spacer đối xứng bằng icon ở bên phải
  const spacerW = hasIcon && el.textAlign === 'center' && variant !== 'glow-pill' ? V.iconSize + V.gap : 0;
  const availW = w - V.padX * 2 - borderX - iconW - spacerW;
  const textLines = displayText.split('\n').reduce(
    (n, line) => n + estimateTextLines(line, availW, fs, { ...textOpts, weight: variant === 'glow-pill' ? W.pill : W.body }), 0
  );
  const inner = Math.max(hasIcon ? V.iconSize : 0, textLines * fs * V.lineHeight);
  return { variant, text: displayText, textLines, height: Math.round(inner + V.padY * 2 + borderY), fontSize: fs, hasIcon };
}

/**
 * Skin = "lớp sơn" theo tông theme. KHÔNG đổi hình học (padding, viền, icon có/không) nên
 * layoutHighlightBox / chiều cao / Fabric toạ độ giữ nguyên với mọi skin.
 *  - glass:     kính tối + viền & glow accent (tech, năng lượng)
 *  - editorial: không nền, vạch accent mảnh bên trái (sang trọng, tạp chí)
 *  - paper:     nền surface pastel đặc, bo lớn, bóng nhẹ (ấm, chữa lành)
 *  - marker:    không khung, vệt bút dạ accent dưới chữ (ghi chú tay)
 */
export const HIGHLIGHT_SKINS = ['glass', 'editorial', 'paper', 'marker'];

/** Skin thực tế: người dùng chọn > skin mặc định của palette; nền bận → skin không khung có nền lót */
export function resolveHighlightSkin(el, palette, bgBusy) {
  const chosen = el && HIGHLIGHT_SKINS.includes(el.highlightSkin) ? el.highlightSkin : (palette && palette.highlightSkin) || 'glass';
  const frameless = chosen === 'editorial' || chosen === 'marker';
  return { skin: chosen, frameless, backing: frameless && Boolean(bgBusy) };
}

/** Glyph icon theo skin: giấy mềm dùng dấu trích dẫn thay cho ngôi sao mặc định (icon có/không giữ nguyên) */
export function skinIcon(icon, skin) {
  if (skin === 'paper' && (!icon || icon === 'sparkle')) return 'quote';
  return icon || 'sparkle';
}

/**
 * Icon theo sắc thái nội dung (thứ tự ưu tiên: cảm xúc → sức khoẻ → trích dẫn → rủi ro → mẹo → mục tiêu).
 * Câu về cảm xúc không bao giờ nhận icon cảnh báo.
 */
const ICON_RULES = [
  ['heart', /(cảm xúc|trầm cảm|chữa lành|yêu thương|thương yêu|cô đơn|nỗi buồn|buồn bã|hạnh phúc|gia đình|tổn thương|nỗi đau|bình yên|biết ơn|mỉm cười|tâm hồn|an ủi|vỗ về)/i],
  ['leaf', /(sức khoẻ|sức khỏe|giấc ngủ|ngủ đủ|thiên nhiên|thiền|hít thở|ăn uống|vận động|đi bộ|thư giãn|cân bằng)/i],
  ['quote', /^["“'«]|["”'»]\s*[-—–]\s*\S|[—–]\s*[A-ZĐ][\p{L}.]+(\s[A-ZĐ][\p{L}.]+)*\s*$/u],
  ['alert', /(lỗi|sai lầm|cảnh báo|nguy hiểm|rủi ro|đừng bao giờ|mất trắng|thua lỗ)/i],
  ['tip', /(mẹo|bí quyết|thủ thuật|gợi ý)/i],
  ['target', /(mục tiêu|bước|kế hoạch|lộ trình)/i],
];

export function suggestHighlightIcon(text) {
  const t = String(text || '');
  for (const [icon, re] of ICON_RULES) if (re.test(t)) return icon;
  return 'sparkle';
}
