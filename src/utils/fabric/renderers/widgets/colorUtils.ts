import { resolveThemePalette, getPaletteCssVariables } from '@/utils/themeResolver';
import { getContrastTextColor } from '@/config/themePalettes';

/**
 * Color utility for Fabric renderers
 * Converts hex colors (3, 6, 8 digits) with custom alpha hex
 */
export function toHexAlpha(color: string, alphaHex: string, fallback = '#BEFF01'): string {
  if (!color || typeof color !== 'string') return `${fallback}${alphaHex}`;
  const c = color.trim();
  if (c.startsWith('#')) {
    if (c.length === 7) return `${c}${alphaHex}`;
    if (c.length === 4) return `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}${alphaHex}`;
    if (c.length === 9) return c;
  }
  // rgb()/rgba(): convert channels to hex, then apply requested alpha
  const m = c.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i);
  if (m) {
    const hex = [m[1], m[2], m[3]]
      .map(n => Math.max(0, Math.min(255, parseInt(n, 10))).toString(16).padStart(2, '0'))
      .join('');
    return `#${hex}${alphaHex}`;
  }
  return `${fallback}${alphaHex}`;
}

/**
 * Màu theme cho Fabric — lấy TỪ CÙNG NGUỒN với video (getPaletteCssVariables) để canvas khớp Remotion:
 * mỗi khoá tương ứng một CSS var (textSub = --text-sub, cardBg = --card-bg, surface1 = --surface-1…).
 * `surface` là màu thương hiệu của palette (--surface), KHÔNG phải nền thẻ — nền thẻ là cardBg.
 */
export function getFabricThemeColors(el: any) {
  const palette = resolveThemePalette(el);
  const v = getPaletteCssVariables(palette);
  return {
    palette,
    isDark: palette.spaceMode === 'dark',
    /** Bảng CSS var của cảnh — dùng cho resolveColor() */
    vars: v,
    bg: v['--bg'],
    text: v['--text'],
    textSub: v['--text-sub'],
    textMuted: v['--text-muted'],
    surface: v['--surface'],
    onSurface: v['--on-surface'],
    surface1: v['--surface-1'],
    surface2: v['--surface-2'],
    surface3: v['--surface-3'],
    border: v['--border'],
    cardBg: v['--card-bg'],
    accent: resolveColor(el?.accentColor, v) || v['--accent'],
    onAccent: v['--on-accent'],
    chartAxis: v['--chart-axis'],
    chartLabel: v['--chart-label'],
    chartValue: v['--chart-value'],
    chartGrid: v['--chart-grid'],
    chartPositive: v['--chart-positive'],
    chartNegative: v['--chart-negative'],
    chartWarning: v['--chart-warning'],
    chartSeries: [1, 2, 3, 4, 5].map(i => v[`--chart-series-${i}`]),
  };
}

export type FabricThemeColors = ReturnType<typeof getFabricThemeColors>;

/**
 * Màu dữ liệu có thể là `var(--chart-series-2, #00D4FF)` (dùng chung với Remotion) — Fabric không hiểu var():
 * thay bằng giá trị của theme cảnh (hoặc fallback trong var). Màu thường trả nguyên.
 */
export function resolveColor(color: string | undefined | null, vars: Record<string, string>): string | undefined {
  if (!color || typeof color !== 'string') return undefined;
  const m = color.trim().match(/^var\(\s*(--[\w-]+)\s*(?:,\s*(.+))?\)$/);
  if (!m) return color;
  return vars[m[1]] || (m[2] ? resolveColor(m[2].trim(), vars) : undefined);
}

type RGBA = [number, number, number, number];
function parseColor(c: string): RGBA | null {
  const s = c.trim();
  if (s.startsWith('#')) {
    const h = s.length === 4 ? s.slice(1).split('').map(x => x + x).join('') : s.slice(1);
    const n = (k: number) => parseInt(h.slice(k, k + 2), 16);
    return [n(0), n(2), n(4), h.length >= 8 ? n(6) / 255 : 1];
  }
  const m = s.match(/^rgba?\(([^)]+)\)$/i);
  if (!m) return null;
  const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
}

/**
 * Tương đương `color-mix(in srgb, a pct%, b)` của CSS (b = 'transparent' → chỉ giảm alpha) — khớp
 * mixColor()/readableTint() phía Remotion. Màu chưa đọc được → trả a.
 */
export function mixColors(a: string, pct: number, b: string = 'transparent'): string {
  const ca = parseColor(a);
  if (!ca) return a;
  const t = Math.max(0, Math.min(100, pct)) / 100;
  const cb: RGBA = b === 'transparent' ? [ca[0], ca[1], ca[2], 0] : parseColor(b) || [ca[0], ca[1], ca[2], 0];
  // Pha theo không gian premultiplied như CSS color-mix
  const alpha = ca[3] * t + cb[3] * (1 - t);
  if (alpha === 0) return 'rgba(0, 0, 0, 0)';
  const ch = (k: number) => Math.round((ca[k] * ca[3] * t + cb[k] * cb[3] * (1 - t)) / alpha);
  return `rgba(${ch(0)}, ${ch(1)}, ${ch(2)}, ${+alpha.toFixed(3)})`;
}

/** = readableTint() của Remotion: màu series/semantic dùng làm chữ nhỏ */
export const readableTint = (color: string, themeColors: FabricThemeColors) => mixColors(color, 60, themeColors.text);

/** = onAccentColor() của Remotion: chữ trên nền accent */
export const onAccentFor = (accent: string, themeColors: FabricThemeColors) =>
  accent.trim().startsWith('#') ? getContrastTextColor(accent) : themeColors.onAccent;

/**
 * Returns series color by index from theme tokens, cycling safely
 */
export function getAdaptiveSeriesColor(idx: number, themeColors: FabricThemeColors): string {
  const series = themeColors.chartSeries;
  return series[idx % series.length];
}

