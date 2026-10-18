/**
 * ==============================================================================
 * 🎨 THEME PALETTES (SSOT) — 5-LAYER DESIGN TOKENS & TRI-COLOR PALETTES
 * ==============================================================================
 * Universal Single Source of Truth for video theme palettes across XD-Short Studio.
 * Compatible with Node.js Server ESM and Vite Client Bundler.
 */

/**
 * Convert Hex color to RGBA string with given alpha (0-1)
 */
export function hexToRgba(hex, alpha = 1) {
  if (!hex || typeof hex !== 'string') return `rgba(255, 255, 255, ${alpha})`;
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  if (clean.length < 6) return `rgba(255, 255, 255, ${alpha})`;
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function parseHexRgb(hex) {
  if (!hex || typeof hex !== 'string') return null;
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(clean)) return null;
  return [0, 2, 4].map(k => parseInt(clean.substring(k, k + 2), 16));
}

/** WCAG 2.1 relative luminance (0 = đen, 1 = trắng) */
export function relativeLuminance(hex) {
  const rgb = parseHexRgb(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map(v => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.1 contrast ratio giữa hai màu hex (1 → 21) */
export function contrastRatio(hexA, hexB) {
  const a = relativeLuminance(hexA);
  const b = relativeLuminance(hexB);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const DARK_TEXT = '#0B0F1A';
const LIGHT_TEXT = '#FFFFFF';

/**
 * Chọn chữ tối hoặc trắng cho một nền: lấy phương án có tỉ lệ tương phản cao hơn
 * (ngưỡng độ sáng cố định chọn sai với màu tầm trung, vd #E07A5F).
 */
export function getContrastTextColor(bgColorHex) {
  if (!parseHexRgb(bgColorHex)) return LIGHT_TEXT;
  return contrastRatio(DARK_TEXT, bgColorHex) >= contrastRatio(LIGHT_TEXT, bgColorHex) ? DARK_TEXT : LIGHT_TEXT;
}

/**
 * Trắng / đen thuần: màu "mặc định" của template & LLM chứ không phải lựa chọn thương hiệu.
 * Ở bước nhận output AI, các màu này được bỏ để chữ theo màu --text của theme.
 */
const NEUTRAL_TEXT_COLORS = new Set(['#fff', '#ffffff', '#000', '#000000', '#080808', '#050d1a', '#060d16', 'white', 'black']);
export function isNeutralTextColor(color) {
  return typeof color === 'string' && NEUTRAL_TEXT_COLORS.has(color.trim().toLowerCase());
}

/** Màu đen kiểu cũ: render theo màu chữ của theme thay vì giữ đen (khớp Fabric & Remotion) */
const LEGACY_DARK_TEXT = new Set(['#000', '#000000', '#080808', '#050d1a']);
export function isLegacyDarkTextColor(color) {
  return typeof color === 'string' && LEGACY_DARK_TEXT.has(color.trim().toLowerCase());
}

/**
 * Checks if a background color is an old un-themed placeholder or legacy ultra-dark bg
 */
export function isLegacySceneBg(bg) {
  if (!bg) return true;
  const l = bg.toLowerCase().trim();
  
  const knownLegacyList = [
    '#060d16', '#080a0f', '#080808', '#09090b', '#0a0906', '#050b14',
    '#060d18', '#080a0d', '#090d0b', '#0a1128', '#0a0a0a', '#0c0d12',
    '#08080c', '#0d0714', '#0e0b16', '#000000', '#120000', '#0f0900',
    '#050c14', '#051005', '#0a0614', '#0a120d', '#0d0e14', '#14120c',
    '#0a0a10', '#0c0c0c', '#0f0914', '#0d0808', '#08090a', '#0b0d13',
    'transparent', '#00000000', '#2d00f7'
  ];

  if (knownLegacyList.includes(l)) return true;

  // Ultra-dark near-black legacy backgrounds (R, G, B all <= 16)
  if (/^#[0-9a-f]{6}$/i.test(l)) {
    const r = parseInt(l.slice(1, 3), 16);
    const g = parseInt(l.slice(3, 5), 16);
    const b = parseInt(l.slice(5, 7), 16);
    if (r <= 16 && g <= 16 && b <= 16) {
      return true;
    }
  }

  return false;
}

function buildChartTokens(tokens, spaceMode = 'dark', customSeries = null) {
  const isDark = spaceMode === 'dark';
  return {
    // Theme tối: surface là màu thương hiệu đậm nổi trên nền tối. Theme sáng: surface là màu nền
    // pastel (gần trùng nền) nên cột thường dùng onSurface 70% để vẫn đạt ≥ 3:1.
    chartBar: isDark ? tokens.surface : hexToRgba(tokens.onSurface, 0.7),
    chartBarBorder: hexToRgba(tokens.text, 0.4),
    chartAxis: hexToRgba(tokens.text, 0.4),
    chartGrid: hexToRgba(tokens.text, 0.08),
    chartLabel: tokens.text,
    chartHighlight: tokens.accent,
    chartValue: tokens.accent,
    chartPositive: isDark ? '#00FF88' : '#059669',
    chartNegative: isDark ? '#FF3366' : '#DC2626',
    chartWarning: isDark ? '#FFB800' : '#D97706',
    chartLineStrength: '40%',
    chartSeries: customSeries || (isDark 
      ? ['#00FF88', '#00D4FF', '#FFB800', '#FF3366', '#BEFF01']
      : ['#059669', '#0284C7', '#D97706', '#DC2626', '#7C3AED']),
  };
}

/** Khai báo palette một lần: chart tokens sinh từ chính tokens (không lặp lại object) */
function definePalette({ id, label, desc, category, spaceMode, tokens, series, preview, highlightSkin }) {
  return {
    id,
    label,
    desc,
    category,
    spaceMode,
    /** Phong cách mặc định của highlight-box trên theme này (xem highlightBoxLayout.HIGHLIGHT_SKINS) */
    highlightSkin,
    tokens,
    chartTokens: buildChartTokens(tokens, spaceMode, series),
    preview,
  };
}

/**
 * 9 Bảng màu chuẩn hóa cho XD-Short Studio (4 Dark, 2 Light/Warm, 3 Pastel)
 * Mọi cặp màu được khoá tương phản WCAG bởi tests/unit/themeContrast.test.ts:
 * chữ ≥ 4.5:1, đồ hoạ (cột, series, đường) ≥ 3:1.
 */
export const THEME_PALETTES = {
  'neon-night': definePalette({
    id: 'neon-night',
    highlightSkin: 'glass',
    label: 'Neon Night',
    desc: 'Cyber Dark sắc nét, tương phản cao, công nghệ & crypto',
    category: 'dark',
    spaceMode: 'dark',
    tokens: {
      bg: '#0B0F1A',
      bgGradient: 'linear-gradient(170deg, #111827 0%, #0B0F1A 100%)',
      surface: '#00E5FF',
      onSurface: '#0B0F1A',
      text: '#FFFFFF',
      accent: '#FF2E93',
      onAccent: '#0B0F1A',
      subtitleBg: 'rgba(11, 15, 26, 0.75)',
      subtitleText: '#FFFFFF',
      subtitleHighlight: '#FF2E93',
    },
    series: ['#00E5FF', '#FF2E93', '#FFE600', '#00FF88', '#BD00FF'],
    preview: ['#FF2E93', '#00E5FF', '#0B0F1A'],
  }),

  'sunset-pop': definePalette({
    id: 'sunset-pop',
    highlightSkin: 'glass',
    label: 'Sunset Pop',
    desc: 'Hoàng hôn bùng nổ, cam đào & vàng ánh kim, kích thích tò mò',
    category: 'dark',
    spaceMode: 'dark',
    tokens: {
      bg: '#1E1B4B',
      bgGradient: 'linear-gradient(165deg, #241A5E 0%, #1A1340 60%, #150E30 100%)',
      surface: '#FF6B35',
      onSurface: '#1E1B4B',
      text: '#FFFFFF',
      accent: '#FFD23F',
      onAccent: '#1E1B4B',
      subtitleBg: 'rgba(11, 15, 26, 0.75)',
      subtitleText: '#FFFFFF',
      subtitleHighlight: '#FFD23F',
    },
    series: ['#FF6B35', '#FFD23F', '#EE4266', '#AB1AE0', '#0EAD69'],
    preview: ['#FFD23F', '#FF6B35', '#1E1B4B'],
  }),

  'fresh-mint': definePalette({
    id: 'fresh-mint',
    highlightSkin: 'marker',
    label: 'Fresh Mint',
    desc: 'Xanh ngọc tươi mát, thiên nhiên, y tế, sức khoẻ & lối sống',
    category: 'light',
    spaceMode: 'daylight-warm',
    tokens: {
      bg: '#F7FFF7',
      surface: '#1C9C76',
      onSurface: '#05261B',
      text: '#12332A',
      accent: '#CF3838', // #D63B3B chỉ đạt 4.48:1 trên nền thẻ render thật
      onAccent: '#FFFFFF',
      subtitleBg: 'rgba(18, 51, 42, 0.82)',
      subtitleText: '#FFFFFF',
      subtitleHighlight: '#FFD166',
    },
    series: ['#1A936F', '#CF3838', '#118AB2', '#C28800', '#073B4C'],
    preview: ['#CF3838', '#1C9C76', '#F7FFF7'],
  }),

  'royal-gold': definePalette({
    id: 'royal-gold',
    highlightSkin: 'editorial',
    label: 'Royal Gold',
    desc: 'Vương giả hoàng gia, vàng gold & xanh hải quân, sang trọng & tài chính',
    category: 'dark',
    spaceMode: 'dark',
    tokens: {
      bg: '#0A1128',
      bgGradient: 'linear-gradient(160deg, #0F1A3A 0%, #0A1128 75%, #050814 100%)',
      surface: '#D4AF37',
      onSurface: '#0A1128',
      text: '#FFFFFF',
      accent: '#F5F0E6',
      onAccent: '#0A1128',
      subtitleBg: 'rgba(11, 15, 26, 0.75)',
      subtitleText: '#FFFFFF',
      subtitleHighlight: '#D4AF37',
    },
    series: ['#D4AF37', '#00E5FF', '#F5F0E6', '#9B51E0', '#27AE60'],
    preview: ['#F5F0E6', '#D4AF37', '#0A1128'],
  }),

  'electric-candy': definePalette({
    id: 'electric-candy',
    highlightSkin: 'glass',
    label: 'Electric Candy',
    desc: 'Kẹo ngọt điện tử, hồng neon & vàng chanh, viral Gen Z & giải trí',
    category: 'dark',
    spaceMode: 'dark',
    tokens: {
      bg: '#140E3E',
      bgGradient: 'linear-gradient(160deg, #3A0CA3 0%, #170542 100%)',
      surface: '#E30080',
      onSurface: '#FFFFFF',
      text: '#FFFFFF',
      accent: '#E5FF00',
      onAccent: '#140E3E',
      subtitleBg: 'rgba(11, 15, 26, 0.75)',
      subtitleText: '#FFFFFF',
      subtitleHighlight: '#E5FF00',
    },
    series: ['#F20089', '#E5FF00', '#00F0FF', '#930CEC', '#FF0055'],
    preview: ['#E5FF00', '#E30080', '#140E3E'],
  }),

  'warm-care': definePalette({
    id: 'warm-care',
    highlightSkin: 'marker',
    label: 'Warm Care',
    desc: 'Ấm áp gia đình, cam đất & xanh thép, giáo dục & chăm sóc',
    category: 'light',
    spaceMode: 'daylight-warm',
    tokens: {
      bg: '#FFF4E6',
      surface: '#E07A5F',
      onSurface: '#2B1B17',
      text: '#2B1B17',
      accent: '#3D5A80',
      onAccent: '#FFFFFF',
      subtitleBg: 'rgba(43, 27, 23, 0.80)',
      subtitleText: '#FFFFFF',
      subtitleHighlight: '#F2CC8F',
    },
    series: ['#DD6C4E', '#3D5A80', '#5D997C', '#C28017', '#6B705C'],
    preview: ['#3D5A80', '#E07A5F', '#FFF4E6'],
  }),

  'peach-cream': definePalette({
    id: 'peach-cream',
    highlightSkin: 'paper',
    label: 'Peach Cream',
    desc: 'Pastel cam đào dịu mắt, dễ chịu cho người lớn tuổi & chia sẻ gia đình',
    category: 'pastel',
    spaceMode: 'daylight-warm',
    tokens: {
      bg: '#FFF8F0',
      surface: '#F9D5C3',
      onSurface: '#3A2A24',
      text: '#3A2A24',
      accent: '#B4472B',
      onAccent: '#FFFFFF',
      subtitleBg: 'rgba(255, 255, 255, 0.88)',
      subtitleText: '#3A2A24',
      subtitleHighlight: '#B4472B',
    },
    series: ['#B4472B', '#DE6F52', '#588157', '#3A5A40', '#C97E2A'],
    preview: ['#B4472B', '#F9D5C3', '#FFF8F0'],
  }),

  'soft-sage': definePalette({
    id: 'soft-sage',
    highlightSkin: 'paper',
    label: 'Soft Sage',
    desc: 'Pastel xô thơm thanh tịnh, thiền định, sức khoẻ tinh thần & thư thái',
    category: 'pastel',
    spaceMode: 'daylight-warm',
    tokens: {
      bg: '#F4FAF5',
      surface: '#CDE8D5',
      onSurface: '#1E3029',
      text: '#1E3029',
      accent: '#1F6F5C',
      onAccent: '#FFFFFF',
      subtitleBg: 'rgba(255, 255, 255, 0.88)',
      subtitleText: '#1E3029',
      subtitleHighlight: '#1F6F5C',
    },
    series: ['#1F6F5C', '#429E73', '#2D6A4F', '#42A172', '#32A443'],
    preview: ['#1F6F5C', '#CDE8D5', '#F4FAF5'],
  }),

  'misty-blue': definePalette({
    id: 'misty-blue',
    highlightSkin: 'paper',
    label: 'Misty Blue',
    desc: 'Pastel xanh sương mờ thanh nhã, bình yên, câu chuyện chữa lành',
    category: 'pastel',
    spaceMode: 'daylight-warm',
    tokens: {
      bg: '#F5F9FD',
      surface: '#CFE3F5',
      onSurface: '#1D2B3A',
      text: '#1D2B3A',
      accent: '#A63A5C',
      onAccent: '#FFFFFF',
      subtitleBg: 'rgba(255, 255, 255, 0.88)',
      subtitleText: '#1D2B3A',
      subtitleHighlight: '#A63A5C',
    },
    series: ['#A63A5C', '#457B9D', '#1D3557', '#E63946', '#2A9D8F'],
    preview: ['#A63A5C', '#CFE3F5', '#F5F9FD'],
  }),

  // Phong cách thư viện cảnh Master: nền xám than trung tính, một màu nhấn duy nhất
  'studio-lime': definePalette({
    id: 'studio-lime',
    highlightSkin: 'glass',
    label: 'Studio Lime',
    desc: 'Xám than tối giản, một điểm nhấn xanh chanh — phong cách thư viện cảnh Master',
    category: 'dark',
    spaceMode: 'dark',
    tokens: {
      bg: '#18181C',
      bgGradient: '#18181C',
      surface: '#8E8C86',
      onSurface: '#0A0A0B',
      text: '#F2F0EB',
      accent: '#C6F432',
      onAccent: '#0A0A0B',
      subtitleBg: 'rgba(10, 10, 11, 0.78)',
      subtitleText: '#F2F0EB',
      subtitleHighlight: '#C6F432',
    },
    series: ['#C6F432', '#F2A65A', '#7AA7FF', '#FF6B8A', '#F2F0EB'],
    preview: ['#C6F432', '#8E8C86', '#18181C'],
  }),
};

// ── BIẾN THỂ NỀN CẢNH (surface) ────────────────────────────────────────────
// Thư viện cảnh Master xen kẽ 3 kiểu nền: nền theme (mặc định), nền ngà, nền màu nhấn.
// Biến thể sinh từ palette gốc (id "<palette>@ivory" / "<palette>@accent") nên đổi theme vẫn giữ kiểu nền,
// và mọi nơi đọc palette qua resolveThemePalette / resolveSceneBackground tự nhận biến thể.

export const SURFACE_VARIANTS = ['ivory', 'accent'];
const IVORY_BG = '#F1EDE4';
const IVORY_SURFACE = '#E5DFD2';
const INK = '#0B0A09';
/**
 * Chữ trên biến thể nhắm 5.5:1 (cao hơn chuẩn 4.5): lớp vignette của SceneRenderer làm nền thật tối đi ~15%,
 * đo trên ảnh render (npm run test:contrast) chữ phụ / chữ nhấn vẫn ≥ 4.5.
 */
const VARIANT_TEXT_CONTRAST = 5.5;

function mixHex(a, b, t) {
  const A = parseHexRgb(a);
  const B = parseHexRgb(b);
  if (!A || !B) return a;
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('').toUpperCase();
}

/** Pha dần màu về phía `toward` tới khi đạt tương phản `min` trên nền `bg` (giữ sắc độ gần nhất có thể) */
function ensureContrast(color, bg, min, toward) {
  if (contrastRatio(color, bg) >= min) return color;
  for (let t = 0.05; t <= 1; t += 0.05) {
    const c = mixHex(color, toward, t);
    if (contrastRatio(c, bg) >= min) return c;
  }
  return toward;
}

function deriveSurfaceVariant(base, surface) {
  if (surface === 'ivory') {
    const accent = ensureContrast(base.tokens.accent, IVORY_BG, VARIANT_TEXT_CONTRAST, INK);
    return definePalette({
      id: `${base.id}@ivory`,
      highlightSkin: 'paper',
      label: `${base.label} · nền ngà`,
      desc: base.desc,
      category: base.category,
      spaceMode: 'daylight-warm',
      tokens: {
        bg: IVORY_BG,
        bgGradient: IVORY_BG,
        surface: IVORY_SURFACE,
        onSurface: INK,
        text: INK,
        textSub: ensureContrast(mixHex(INK, IVORY_BG, 0.35), IVORY_BG, VARIANT_TEXT_CONTRAST, INK),
        accent,
        // Mảng màu có viền mực (dấu trang, khối tô) giữ màu nhấn gốc như thiết kế; chỉ CHỮ màu nhấn mới cần đậm lại
        accentFill: base.tokens.accent,
        onAccentFill: base.tokens.onAccent,
        onAccent: getContrastTextColor(accent),
        subtitleBg: 'rgba(241, 237, 228, 0.9)',
        subtitleText: INK,
        subtitleHighlight: accent,
      },
      preview: [accent, IVORY_SURFACE, IVORY_BG],
    });
  }
  if (surface === 'accent') {
    const bg = base.tokens.accent;
    const ink = getContrastTextColor(bg);
    const isLight = ink !== LIGHT_TEXT;
    const surfaceTone = mixHex(bg, isLight ? '#FFFFFF' : '#000000', 0.45);
    return definePalette({
      id: `${base.id}@accent`,
      highlightSkin: isLight ? 'paper' : 'glass',
      label: `${base.label} · nền màu nhấn`,
      desc: base.desc,
      category: base.category,
      spaceMode: isLight ? 'daylight-warm' : 'dark',
      tokens: {
        bg,
        bgGradient: bg,
        surface: surfaceTone,
        onSurface: ensureContrast(ink, surfaceTone, 4.5, ink),
        text: ink,
        textSub: ensureContrast(mixHex(ink, bg, 0.2), bg, VARIANT_TEXT_CONTRAST, ink),
        // Trên nền màu nhấn, "chữ nhấn" là màu mực (không còn màu thứ hai)
        accent: ink,
        onAccent: bg,
        subtitleBg: isLight ? 'rgba(255, 255, 255, 0.82)' : 'rgba(0, 0, 0, 0.6)',
        subtitleText: ink,
        subtitleHighlight: ink,
      },
      series: [ink, mixHex(ink, bg, 0.35), mixHex(ink, bg, 0.55)],
      preview: [ink, surfaceTone, bg],
    });
  }
  return base;
}

/**
 * Màu đồ hoạ cố định (tăng/giảm/cảnh báo, series, cột) được chọn cho nền theme gốc; trên nền ngà / nền màu nhấn
 * pha dần về phía màu mực tới khi đạt ≥ 3:1 (khoá bởi tests/unit/themeContrast.test.ts).
 */
function enforceGraphicContrast(palette) {
  const { bg, text } = palette.tokens;
  const fix = (c) => (typeof c === 'string' && c.startsWith('#') ? ensureContrast(c, bg, 3, text) : c);
  const t = palette.chartTokens;
  return {
    ...palette,
    chartTokens: {
      ...t,
      chartBar: fix(t.chartBar),
      chartHighlight: fix(t.chartHighlight),
      chartValue: fix(t.chartValue),
      chartPositive: fix(t.chartPositive),
      chartNegative: fix(t.chartNegative),
      chartWarning: fix(t.chartWarning),
      chartSeries: t.chartSeries.map(fix),
    },
  };
}

const variantCache = new Map();
function surfaceVariant(base, surface) {
  if (!SURFACE_VARIANTS.includes(surface)) return base;
  const key = `${base.id}@${surface}`;
  if (!variantCache.has(key)) variantCache.set(key, enforceGraphicContrast(deriveSurfaceVariant(base, surface)));
  return variantCache.get(key);
}

/** Palette của cảnh theo kiểu nền (surface): 'ivory' | 'accent'; khác → palette gốc */
export function withSceneSurface(palette, surface) {
  const baseId = String(palette?.id || '').split('@')[0];
  const base = THEME_PALETTES[baseId] || palette;
  return surface ? surfaceVariant(base, surface) : palette;
}

/**
 * Bản đồ tương thích ngược cho các theme cũ
 */
export const LEGACY_THEME_ALIAS = {
  'neon-green': 'neon-night',
  'electric-blue': 'neon-night',
  'hot-pink': 'electric-candy',
  'golden': 'royal-gold',
  'pure-white': 'fresh-mint',
  'coral': 'sunset-pop',
  'matcha-sage': 'soft-sage',
  'synthwave': 'electric-candy',
  'fintech-green': 'fresh-mint',
};

/**
 * Hàm phân giải bảng màu chuẩn SSOT
 */
export function resolveThemePalette(paletteIdOrTheme, fallbackId = 'neon-night') {
  if (!paletteIdOrTheme || typeof paletteIdOrTheme !== 'string') {
    return THEME_PALETTES[fallbackId] || THEME_PALETTES['neon-night'];
  }

  const rawKey = paletteIdOrTheme.trim().toLowerCase();
  const [cleanKey, surface] = rawKey.split('@');
  if (surface) return surfaceVariant(resolveThemePalette(cleanKey, fallbackId), surface);

  // 1. Direct match
  if (THEME_PALETTES[cleanKey]) {
    return THEME_PALETTES[cleanKey];
  }

  // 2. Legacy alias match
  if (LEGACY_THEME_ALIAS[cleanKey] && THEME_PALETTES[LEGACY_THEME_ALIAS[cleanKey]]) {
    return THEME_PALETTES[LEGACY_THEME_ALIAS[cleanKey]];
  }

  // 3. Fallback
  return THEME_PALETTES[fallbackId] || THEME_PALETTES['neon-night'];
}
