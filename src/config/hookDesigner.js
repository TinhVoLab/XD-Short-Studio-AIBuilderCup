/**
 * Bộ thiết kế Master Hook — SSOT chọn bố cục & biến thể cho hook 3 giây đầu.
 *
 * AI chỉ viết NỘI DUNG (câu hook, ý định, từ khoá nhấn, số liệu / hai vế so sánh); module này quyết định
 * THIẾT KẾ: layout hợp ý định + đủ dữ liệu, kiểu khung, kiểu nhấn chữ, góc nghiêng, kiểu xuất hiện.
 * Chọn có trọng số theo seed → mỗi video khác nhau nhưng cùng seed luôn ra cùng kết quả (render lại y hệt).
 * Viết JS thuần để server (post-processor) và client dùng chung.
 */
import { ARCHETYPE_DEFAULTS } from './hookArchetypes.js';

/** Ý định hook (AI trả về trong hookData.hookIntent) */
export const HOOK_INTENTS = ['warning', 'number', 'versus', 'secret', 'tech', 'curiosity', 'tips', 'healing'];

const INTENT_ARCHETYPE = {
  warning: 'warning', number: 'tips', versus: 'versus', secret: 'secret',
  tech: 'secret', curiosity: 'curiosity', tips: 'tips', healing: 'healing',
};

/**
 * Hai tầng, không ba: mỗi layout chỉ giữ MỘT tín hiệu phụ cạnh tiêu đề — `signal: 'badge'` (nhãn ý định)
 * hoặc `signal: 'sub'` (câu gợi tò mò); tầng còn lại bị bỏ vì phụ đề karaoke đã đọc lời thoại.
 * Layout hook & mức phù hợp theo ý định (0 = không dùng). `requires`: dữ liệu bắt buộc để layout không
 * phải hiện chữ giả (giant-stat cần số, split-versus cần hai vế). Layout CTA không nằm ở đây (dùng cảnh cuối).
 * Biến thể: các giá trị hợp lệ để seed chọn — giữ trong khuôn thiết kế của từng layout.
 */
export const HOOK_LAYOUTS = {
  'sticker-words': { signal: 'badge', fit: { tips: 3, curiosity: 1, number: 1 }, maxWords: 7, boxVariant: ['glass', 'solid'] },
  'stacked': { signal: 'badge', fit: { curiosity: 3, tips: 2, secret: 1, warning: 1 }, boxVariant: ['glass', 'neon-border', 'solid'] },
  'hazard-alert': { signal: 'badge', fit: { warning: 4 }, boxVariant: ['solid'] },
  'cyber-hud': { signal: 'badge', fit: { tech: 4, secret: 2 }, boxVariant: ['neon-border'] },
  'split-versus': { signal: 'badge', fit: { versus: 5 }, requires: 'versus', boxVariant: ['glass'] },
  'luxury-zen': { signal: 'sub', fit: { healing: 4 }, boxVariant: ['minimal'] },
  'kinetic-giant-stat': { signal: 'badge', fit: { number: 4 }, requires: 'number', boxVariant: ['glass'] },
  'kinetic-bold-script': { signal: 'badge', fit: { tips: 2, curiosity: 2, healing: 1 }, maxWords: 6, highlightStyle: ['text-glow', 'underline-thick'] },
  'kinetic-contrast': { signal: 'badge', fit: { tips: 2, number: 1, secret: 1 }, maxWords: 6, highlightStyle: ['solid-box', 'outline-box', 'text-glow'] },
  'kinetic-solid-box': { signal: 'badge', fit: { tips: 2, warning: 1, secret: 1 }, maxWords: 6, highlightStyle: ['solid-box'] },
  'kinetic-strip-highlight': { signal: 'badge', fit: { curiosity: 2, tips: 1, warning: 1 }, minWords: 3, maxWords: 6, highlightStyle: ['solid-box'] },
  'kinetic-word-weight': { signal: 'sub', fit: { secret: 2, curiosity: 2, tips: 1 }, maxWords: 7 }, // gồm cả gravity-pull cũ
  'cinematic-lower-third': { signal: 'sub', fit: { curiosity: 2, healing: 1, secret: 1 }, boxVariant: ['minimal'] },
};

/**
 * Gợi ý của phong cách wizard (wizardCatalog.suggestedHookLayout): là ƯU TIÊN (nhân trọng số), không còn là khoá cứng
 * — cùng phong cách vẫn ra nhiều kiểu hook tuỳ nội dung.
 */
const STYLE_BIAS = {
  'badge-split': ['sticker-words', 'kinetic-contrast', 'kinetic-solid-box'],
  'breaking-news': ['hazard-alert', 'kinetic-strip-highlight', 'kinetic-solid-box'],
  'cyber-hud': ['cyber-hud', 'kinetic-word-weight', 'kinetic-contrast'],
  'metric-highlight': ['kinetic-giant-stat', 'kinetic-contrast', 'sticker-words'],
  'luxury-zen': ['luxury-zen', 'cinematic-lower-third', 'kinetic-bold-script'],
  'split-versus': ['split-versus'],
  'versus': ['split-versus'],
  'kinetic-contrast': ['kinetic-contrast', 'kinetic-solid-box', 'sticker-words'],
};
const STYLE_BIAS_FACTOR = 3;

const TILTS = [0, 0, -2, -4, -6];
/** Kiểu xuất hiện chữ (StaggeredWordGroup) hợp tâm trạng từng ý định */
const WORD_ANIMATIONS = {
  default: ['stagger-pop', 'elastic-slide', 'typewriter-cursor'],
  tech: ['glitch', 'typewriter-cursor', 'stagger-pop'],
  healing: ['stagger-pop', 'typewriter-cursor'],
  warning: ['stagger-pop', 'elastic-slide'],
};

/** Nhãn badge theo ý định (không emoji; layout tự in hoa) — dùng khi AI không đưa nhãn dùng được */
const BADGE_POOL = {
  warning: ['Cảnh báo', 'Sai lầm phổ biến', 'Đừng bỏ qua'],
  number: ['Số liệu đáng chú ý', 'Con số biết nói', 'Dữ liệu thật'],
  versus: ['Đối đầu', 'So sánh thẳng', 'Chọn bên nào'],
  secret: ['Ít ai nói', 'Bí mật', 'Góc khuất'],
  tech: ['AI & công nghệ', 'Hệ thống', 'Thuật toán'],
  curiosity: ['Bạn có biết', 'Sự thật bất ngờ', 'Nghịch lý'],
  tips: ['Mẹo nhanh', 'Áp dụng ngay', 'Bí kíp'],
  healing: ['Chậm lại', 'Lắng nghe', 'Bình an'],
};

const EMOJI = /[\p{Extended_Pictographic}←-⇿─-➿️‍]/gu;
const NUMBER = /[+-]?\d+(?:[.,]\d+)*\s?(?:%|x|k|tr|triệu|tỷ|nghìn|m|b)?(?![\p{L}\d])/iu;
const VERSUS_SPLIT = /\s+(?:vs\.?|versus|hay là|hay|hoặc|so với)\s+/i;

/** Seed chuỗi → PRNG [0, 1) (FNV-1a + mulberry32) */
function seededRandom(seed) {
  let h = 2166136261;
  for (const ch of String(seed)) h = Math.imul(h ^ ch.codePointAt(0), 16777619);
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (rand, list) => list[Math.floor(rand() * list.length)];

function pickWeighted(rand, entries) {
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [key, w] of entries) {
    r -= w;
    if (r < 0) return key;
  }
  return entries[entries.length - 1][0];
}

export const cleanHookText = (text) => String(text ?? '').replace(EMOJI, '').replace(/[─━]+/g, '').replace(/\s+/g, ' ').trim();

/** Suy ra ý định khi AI không trả hookIntent (luật từ khoá + lĩnh vực) */
export function inferHookIntent(text, { domains = [] } = {}) {
  const t = String(text || '');
  if (VERSUS_SPLIT.test(t)) return 'versus';
  if (/dừng làm|cảnh báo|nguy hiểm|sai lầm|mất trắng|đừng bao giờ|chết người|coi chừng/i.test(t)) return 'warning';
  if (NUMBER.test(t)) return 'number';
  if (/công thức|bí mật|top 1%|triệu phú|đặc quyền|ít ai/i.test(t)) return 'secret';
  if (/\bai\b|thuật toán|công nghệ|chatgpt|lập trình|\bcode\b|crypto|\bdata\b/i.test(t) || domains[0] === 'TECH_AI') return 'tech';
  if (domains[0] === 'ZEN_HEALING' || /bình an|chữa lành|thiền|hít thở/i.test(t)) return 'healing';
  if (t.includes('?')) return 'curiosity';
  return 'tips';
}

function splitVersus(hook, hero) {
  if (hook.versusLeft && hook.versusRight) return [cleanHookText(hook.versusLeft), cleanHookText(hook.versusRight)];
  const parts = hero.split(VERSUS_SPLIT).map(s => s.replace(/[?!.]+$/, '').trim()).filter(Boolean);
  return parts.length === 2 && parts.every(p => p.split(/\s+/).length <= 5) ? parts : null;
}

function extractStat(hook, hero) {
  if (hook.statValue) return { value: cleanHookText(hook.statValue), label: cleanHookText(hook.statLabel || '') };
  const m = hero.match(NUMBER);
  if (!m) return null;
  const label = hero.replace(m[0], '').replace(/\s+/g, ' ').replace(/^[\s,:–-]+|[\s,:–-]+$/g, '');
  return { value: m[0].replace(/\s+/g, '').toUpperCase(), label };
}

/** Badge: nhãn AI (đã bỏ emoji) nếu ngắn và không lặp tiêu đề; ngược lại lấy từ kho theo ý định */
function resolveBadge(rand, rawBadge, hero, intent) {
  const badge = cleanHookText(rawBadge);
  const norm = s => s.toLowerCase().replace(/[^\p{L}\p{N} ]/gu, '').trim();
  const usable = badge && badge.length <= 28 && norm(badge) !== norm(hero) && !norm(hero).includes(norm(badge));
  return usable ? badge : pick(rand, BADGE_POOL[intent] || BADGE_POOL.tips);
}

/** Từ nhấn phải có mặt trong tiêu đề; thiếu thì chọn con số hoặc từ dài nhất */
function resolveHighlights(words, hero) {
  const lower = hero.toLowerCase();
  const valid = (Array.isArray(words) ? words : []).map(cleanHookText).filter(w => w && lower.includes(w.toLowerCase())).slice(0, 2);
  if (valid.length) return valid;
  const num = hero.match(NUMBER);
  if (num) return [num[0].trim()];
  const longest = hero.split(/\s+/).sort((a, b) => b.length - a.length)[0];
  return longest ? [longest.replace(/[?!.,]+$/, '')] : [];
}

/**
 * Thiết kế hook hoàn chỉnh từ nội dung AI.
 * @param {object} hook  hookData thô từ AI (hookIntent, heroTitle, highlightWords, badgeText, subText, statValue, versusLeft/Right…)
 * @param {object} opts  { content, seed, recentLayouts, styleHint, domains, lockLayout }
 *   lockLayout = true giữ hook.layoutStyle (người dùng tự chọn trong editor); AI thì không khoá.
 * @returns {object} hookData đầy đủ cho MasterHookElement
 */
export function designHook(hook = {}, opts = {}) {
  const { content = '', seed = '', recentLayouts = [], styleHint = '', domains = [], lockLayout = false } = opts;
  const hero = cleanHookText(hook.heroTitle || content) || ARCHETYPE_DEFAULTS.tips.heroTitle;
  const rand = seededRandom(`${seed}|${hero}`);

  const intent = HOOK_INTENTS.includes(hook.hookIntent) ? hook.hookIntent : inferHookIntent(hero, { domains });
  const versus = splitVersus(hook, hero);
  const stat = extractStat(hook, hero);
  const wordCount = hero.split(/\s+/).length;
  const bias = new Set(STYLE_BIAS[styleHint] || []);

  const eligible = Object.entries(HOOK_LAYOUTS).filter(([, L]) =>
    (L.requires !== 'versus' || versus) && (L.requires !== 'number' || stat) && (!L.maxWords || wordCount <= L.maxWords) && (!L.minWords || wordCount >= L.minWords));
  const scored = eligible
    .map(([id, L]) => [id, (L.fit[intent] || 0) * (bias.has(id) ? STYLE_BIAS_FACTOR : 1)])
    .filter(([, w]) => w > 0);
  // Tránh lặp các hook gần đây nếu còn lựa chọn khác
  const fresh = scored.filter(([id]) => !recentLayouts.includes(id));
  const pool = fresh.length ? fresh : scored.length ? scored : [['stacked', 1]];

  const layoutStyle = lockLayout && HOOK_LAYOUTS[hook.layoutStyle] ? hook.layoutStyle : pickWeighted(rand, pool);
  const L = HOOK_LAYOUTS[layoutStyle];
  const highlightWords = resolveHighlights(hook.highlightWords, hero);

  const designed = {
    ...hook,
    hookIntent: intent,
    archetype: INTENT_ARCHETYPE[intent],
    layoutStyle,
    heroTitle: hero,
    badgeText: resolveBadge(rand, hook.badgeText, hero, intent),
    highlightWords,
    subText: cleanHookText(hook.subText),
    boxVariant: L.boxVariant ? pick(rand, L.boxVariant) : hook.boxVariant || 'glass',
    highlightStyle: L.highlightStyle ? pick(rand, L.highlightStyle) : hook.highlightStyle || 'text-glow',
    wordAnimation: pick(rand, WORD_ANIMATIONS[intent] || WORD_ANIMATIONS.default),
    tiltDeg: layoutStyle.startsWith('kinetic-') ? pick(rand, TILTS) : 0,
  };
  // Hai tầng: giữ đúng một tín hiệu phụ theo layout (badge hoặc sub), không bao giờ cả hai
  if (L.signal === 'badge') designed.subText = '';
  if (L.signal === 'sub') designed.badgeText = '';
  // Màu theo theme của cảnh (--accent), không ép màu archetype cố định
  delete designed.accentColor;
  delete designed.fontSize;

  if (layoutStyle === 'split-versus' && versus) [designed.versusLeft, designed.versusRight] = versus;
  if (layoutStyle === 'kinetic-giant-stat' && stat) {
    // Layout in tiêu đề phía trên số: tiêu đề = câu đã bỏ con số, nhãn dưới số chỉ khi khác tiêu đề
    designed.statValue = stat.value;
    if (stat.label) designed.heroTitle = stat.label;
    const label = cleanHookText(hook.statLabel);
    designed.statLabel = label && label.toLowerCase() !== designed.heroTitle.toLowerCase() ? label : '';
  }
  if (layoutStyle === 'kinetic-strip-highlight' && !hook.heroLine2) {
    // Dòng 1 = phần đầu câu, dải màu dòng 2 = 1–2 từ cuối (không lặp từ giữa hai dòng)
    const words = hero.split(/\s+/);
    const tail = words.length >= 4 ? 2 : 1;
    designed.heroTitle = words.slice(0, -tail).join(' ');
    designed.heroLine2 = words.slice(-tail).join(' ');
  }
  if (layoutStyle === 'kinetic-bold-script') designed.scriptWords = highlightWords;
  return designed;
}
