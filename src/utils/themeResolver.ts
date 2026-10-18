/**
 * ==============================================================================
 * 🎨 THEME RESOLVER ENGINE (SSOT) — 5-LAYER DESIGN TOKENS & TRI-COLOR PALETTES
 * ==============================================================================
 * Single Source of Truth (SSOT) for video theme palettes in XD-Short Studio.
 * 
 * Re-exports canonical palettes and types from @/config/themePalettes.js,
 * while adding DOM CSS Variable generation and card glass helpers for Remotion / UI.
 * ==============================================================================
 */

import {
  Theme5LayerTokens,
  ChartTokens,
  ThemePalette,
  THEME_PALETTES,
  LEGACY_THEME_ALIAS,
  hexToRgba,
  getContrastTextColor,
  isLegacySceneBg,
  resolveThemePalette as coreResolveThemePalette,
  withSceneSurface,
} from '../config/themePalettes.js';
import type { Scene, BgPatternType } from '../types/scene';

export type { Theme5LayerTokens, ChartTokens, ThemePalette };
export { THEME_PALETTES, hexToRgba, getContrastTextColor, isLegacySceneBg };

export interface ResolvedSceneBackground {
  palette: ThemePalette;
  effectiveBgColor: string;
  bgGradient?: string;
  isGradient: boolean;
  isDarkBg: boolean;
  rawPattern: BgPatternType;
  /** Luôn là hex #RRGGBB (an toàn để nối hậu tố alpha `${color}2e` và cho Fabric hexToRgba) */
  ambientColor: string;
  /** Màu họa tiết nền, hex #RRGGBB: màu người dùng chọn, neon trên nền tối, mực tối trên nền sáng */
  patternColor: string;
}

/** Chuẩn hoá về #RRGGBB; trả null nếu không phải hex (rgba, var(), gradient...) */
export function normalizeHexColor(color?: string | null): string | null {
  if (!color || typeof color !== 'string') return null;
  const m = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].split('').map(c => c + c).join('') : m[1];
  return `#${h.toUpperCase()}`;
}

/** Mực họa tiết mặc định trên nền sáng khi palette là theme tối (chữ palette màu trắng) */
const LIGHT_BG_PATTERN_INK = '#1E293B';

export const LEGACY_ID_ALIASES = LEGACY_THEME_ALIAS;

/**
 * ── CORE RESOLUTION FUNCTION (SSOT) ─────────────────────────────────────────
 * Resolves a palette from ID, scene, theme or element.
 * Never returns undefined.
 */
export function resolveThemePalette(paletteOrInput?: any): ThemePalette {
  let targetId = 'neon-night';

  if (typeof paletteOrInput === 'string' && paletteOrInput.trim()) {
    targetId = paletteOrInput.trim();
  } else if (paletteOrInput && typeof paletteOrInput === 'object') {
    targetId = paletteOrInput.paletteId || paletteOrInput.colorTheme || paletteOrInput.themeId || paletteOrInput.id || 'neon-night';
  }

  return coreResolveThemePalette(targetId);
}

/**
 * ── SSOT SCENE BACKGROUND RESOLVER ──────────────────────────────────────────
 * Canonical Single Source of Truth for resolving scene background color,
 * gradient, optical darkness, pattern type, and ambient color.
 * Shared 1:1 between Remotion (SceneRenderer) and Fabric (useFabric, Canvas, hudOverlays).
 */
export function resolveSceneBackground(scene: Scene | undefined): ResolvedSceneBackground {
  // Kiểu nền của cảnh (thư viện Master): nền ngà / nền màu nhấn là biến thể của palette theme
  const palette = withSceneSurface(
    resolveThemePalette(scene?.paletteId || (scene as any)?.colorTheme || (scene as any)?.themeId || scene?.elements?.[0]),
    scene?.surface
  );

  const isDaylight = palette.spaceMode === 'daylight-warm';

  // Check if scene has an explicit custom background color (filter legacy placeholders)
  const rawBg = scene?.bgColor ? scene.bgColor.trim() : '';
  const isPlaceholder = isLegacySceneBg(rawBg);
  const effectiveBgColor = isPlaceholder ? palette.tokens.bg : rawBg;

  // Gradient resolution: supports explicit bgGradient or gradient string within bgColor
  const hasGradientInBg = typeof effectiveBgColor === 'string' && effectiveBgColor.includes('gradient');
  const bgGradient = scene?.bgGradient || (hasGradientInBg ? effectiveBgColor : undefined);
  const isGradient = Boolean(bgGradient);

  // Optical Luminance (ITU-R BT.601) đo trên màu nền THẬT của cảnh, không theo palette:
  // preset nền sáng trên palette tối (hoặc ngược lại) vẫn cho ra isDarkBg đúng.
  // Không đọc được màu (vd bgColor là chuỗi gradient) → theo spaceMode của palette.
  let isDarkBg = !isDaylight;
  const rgbMatch = effectiveBgColor.startsWith('#')
    ? normalizeHexColor(effectiveBgColor)?.slice(1).match(/../g)?.map(h => parseInt(h, 16))
    : effectiveBgColor.startsWith('rgb')
    ? effectiveBgColor.match(/\d+/g)?.slice(0, 3).map(Number)
    : undefined;
  if (rgbMatch && rgbMatch.length === 3) {
    const [r, g, b] = rgbMatch;
    isDarkBg = (0.299 * r + 0.587 * g + 0.114 * b) < 140;
  }

  // Normalized pattern: default is 'none' (solid color) unless explicitly configured
  const rawPattern: BgPatternType = scene?.bgPattern || 'none';

  // Ambient spotlight / highlight color
  const accentEl = scene?.elements?.find(e => (e as any).color && (e as any).color !== '#fff' && (e as any).color !== '#ffffff') ||
                   scene?.elements?.find(e => (e as any).accentColor);
  const ambientColor = normalizeHexColor((accentEl as any)?.color)
    || normalizeHexColor((accentEl as any)?.accentColor)
    || normalizeHexColor(palette.tokens.accent)
    || '#BEFF01';

  const patternColor = normalizeHexColor(scene?.bgPatternColor)
    || (isDarkBg
      ? ambientColor
      : (isDaylight ? normalizeHexColor(palette.tokens.text) : null) || LIGHT_BG_PATTERN_INK);

  return {
    palette,
    effectiveBgColor,
    bgGradient,
    isGradient,
    isDarkBg,
    rawPattern,
    ambientColor,
    patternColor,
  };
}

/**
 * Generates an object of CSS variables for injecting into Remotion or HTML containers
 */
export function getPaletteCssVariables(paletteOrInput?: any): Record<string, string> {
  const pal = resolveThemePalette(paletteOrInput);
  const { tokens, chartTokens, spaceMode } = pal;
  const isDark = spaceMode === 'dark';

  return {
    '--bg': tokens.bg,
    '--bg-gradient': tokens.bgGradient || tokens.bg,
    '--surface': tokens.surface,
    '--on-surface': tokens.onSurface,
    '--text': tokens.text,
    '--accent': tokens.accent,
    '--accent-fill': tokens.accentFill || tokens.accent,
    '--on-accent': tokens.onAccent,
    '--on-accent-fill': tokens.onAccentFill || tokens.onAccent,
    '--subtitle-bg': tokens.subtitleBg,
    '--subtitle-text': tokens.subtitleText,
    '--subtitle-highlight': tokens.subtitleHighlight || tokens.accent,

    // Adaptive Surface & Glass Tokens (Auto-adapting to Dark vs Daylight/Pastel)
    '--surface-1': isDark ? 'rgba(13, 17, 23, 0.92)' : 'rgba(255, 255, 255, 0.88)',
    '--surface-2': isDark ? 'rgba(22, 27, 34, 0.85)' : 'rgba(245, 245, 247, 0.90)',
    '--surface-3': isDark ? 'rgba(33, 38, 45, 0.80)' : 'rgba(235, 235, 238, 0.92)',
    '--border': isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    '--border-focus': isDark ? hexToRgba(tokens.accent, 0.5) : hexToRgba(tokens.accent, 0.7),
    // Palette có thể khai báo chữ phụ riêng (biến thể nền ngà / nền màu nhấn); không thì theo chế độ sáng/tối
    '--text-sub': tokens.textSub || (isDark ? 'rgba(255, 255, 255, 0.65)' : 'rgba(30, 41, 59, 0.72)'),
    // Theme sáng: 0.55 để chữ meta đạt ≥ 3:1 trên card trắng (0.45 chỉ đạt 2.67)
    '--text-muted': isDark ? 'rgba(255, 255, 255, 0.40)' : 'rgba(30, 41, 59, 0.55)',
    '--card-bg': isDark ? 'rgba(13, 17, 23, 0.88)' : 'rgba(255, 255, 255, 0.88)',

    // Elevation 3 bậc theo theme. Theme sáng: bóng pha từ màu --text (ấm/lạnh theo palette)
    // thay vì đen thuần để không thành vệt xám bẩn; blur ≤ 28px để không loang khi nén h264.
    '--shadow-sm': isDark ? '0 2px 6px rgba(0, 0, 0, 0.28)' : `0 1px 3px ${hexToRgba(tokens.text, 0.08)}`,
    '--shadow-md': isDark
      ? '0 6px 16px rgba(0, 0, 0, 0.32)'
      : `0 1px 2px ${hexToRgba(tokens.text, 0.06)}, 0 4px 12px ${hexToRgba(tokens.text, 0.08)}`,
    '--shadow-lg': isDark ? '0 12px 28px rgba(0, 0, 0, 0.36)' : `0 8px 24px ${hexToRgba(tokens.text, 0.1)}`,
    // Độ nổi cho chữ lớn (số liệu, tiêu đề hook) — thay lớp textShadow đen 0.9
    '--text-depth': isDark ? '0 4px 12px rgba(0, 0, 0, 0.45)' : `0 2px 8px ${hexToRgba(tokens.text, 0.12)}`,

    // Chart Tokens
    '--chart-bar': chartTokens.chartBar,
    '--chart-bar-border': chartTokens.chartBarBorder,
    '--chart-axis': chartTokens.chartAxis,
    '--chart-grid': chartTokens.chartGrid,
    '--chart-label': chartTokens.chartLabel,
    '--chart-highlight': chartTokens.chartHighlight,
    '--chart-value': chartTokens.chartValue,
    '--chart-positive': chartTokens.chartPositive,
    '--chart-negative': chartTokens.chartNegative,
    '--chart-warning': chartTokens.chartWarning,
    '--chart-line-strength': chartTokens.chartLineStrength,
    '--chart-series-1': chartTokens.chartSeries[0],
    '--chart-series-2': chartTokens.chartSeries[1],
    '--chart-series-3': chartTokens.chartSeries[2],
    '--chart-series-4': chartTokens.chartSeries[3],
    '--chart-series-5': chartTokens.chartSeries[4],
  };
}

/**
 * ── CARD GLASS RESOLVER ─────────────────────────────────────────────────────
 * Resolves container glass styles according to spaceMode:
 * - 'dark': Obsidian Glass (deep dark blurred backdrop with subtle hairline)
 * - 'daylight-warm': Frosted Ivory Glass (bright warm milk glass with soft shadow)
 */
export function getCardGlassStyle(
  spaceMode: 'dark' | 'daylight-warm' = 'dark',
  showCardBg = true,
  customBg?: string
) {
  if (!showCardBg) {
    return {
      background: 'transparent',
      border: 'none',
      boxShadow: 'none',
    };
  }

  if (customBg && customBg !== 'transparent') {
    return {
      background: customBg,
      border: spaceMode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
      boxShadow: spaceMode === 'dark' ? '0 12px 32px rgba(0, 0, 0, 0.5)' : '0 8px 24px rgba(0, 0, 0, 0.06)',
    };
  }

  // Kính theo theme qua CSS vars của cảnh (--card-bg / --border): tối ở theme tối, trắng ở theme sáng,
  // để chữ --text bên trong luôn đủ tương phản. Bóng đổ lấy từ --shadow-md (cũng theo theme).
  return {
    background: 'var(--card-bg, rgba(13, 17, 23, 0.88))',
    border: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
    boxShadow: 'var(--shadow-md, 0 6px 16px rgba(0, 0, 0, 0.32))',
  };
}
