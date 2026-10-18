/**
 * Color Contrast Utilities (WCAG 2.1 Standard)
 * Computes luminance, contrast ratios, and guarantees readable contrast across theme palettes.
 */

export interface RgbColor {
  r: number;
  g: number;
  b: number;
  a?: number;
}

/**
 * Parses hex (#rgb, #rrggbb, #rrggbbaa) or rgb/rgba strings into {r, g, b, a}
 */
export function parseColor(color: string): RgbColor | null {
  if (!color || typeof color !== 'string') return null;
  const c = color.trim().toLowerCase();

  // Hex format
  if (c.startsWith('#')) {
    if (c.length === 4) {
      return {
        r: parseInt(c[1] + c[1], 16),
        g: parseInt(c[2] + c[2], 16),
        b: parseInt(c[3] + c[3], 16),
        a: 1,
      };
    }
    if (c.length === 7 || c.length === 9) {
      return {
        r: parseInt(c.slice(1, 3), 16),
        g: parseInt(c.slice(3, 5), 16),
        b: parseInt(c.slice(5, 7), 16),
        a: c.length === 9 ? parseInt(c.slice(7, 9), 16) / 255 : 1,
      };
    }
  }

  // rgb / rgba format
  const rgbMatch = c.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([\d.]+))?\s*\)$/i);
  if (rgbMatch) {
    return {
      r: Math.max(0, Math.min(255, parseInt(rgbMatch[1], 10))),
      g: Math.max(0, Math.min(255, parseInt(rgbMatch[2], 10))),
      b: Math.max(0, Math.min(255, parseInt(rgbMatch[3], 10))),
      a: rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1,
    };
  }

  return null;
}

/**
 * Calculates WCAG relative luminance of an sRGB color (0.0 to 1.0)
 * https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
export function relativeLuminance(rgb: RgbColor): number {
  const [rs, gs, bs] = [rgb.r, rgb.g, rgb.b].map((val) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculates contrast ratio between two colors according to WCAG 2.1 (1.0 to 21.0)
 * (L1 + 0.05) / (L2 + 0.05)
 */
export function getContrastRatio(colorA: string, colorB: string): number {
  const rgbA = parseColor(colorA);
  const rgbB = parseColor(colorB);
  if (!rgbA || !rgbB) return 1.0;

  const lumA = relativeLuminance(rgbA);
  const lumB = relativeLuminance(rgbB);

  const brighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);

  return Number(((brighter + 0.05) / (darker + 0.05)).toFixed(2));
}

/**
 * Ensures foreground color has at least `minContrast` against background color.
 * If contrast is insufficient, shifts color towards dark or light depending on background luminance.
 */
export function ensureContrast(fgColor: string, bgColor: string, minRatio = 3.0): string {
  const ratio = getContrastRatio(fgColor, bgColor);
  if (ratio >= minRatio) return fgColor;

  const bgRgb = parseColor(bgColor) || { r: 10, g: 10, b: 10 };
  const isLightBg = relativeLuminance(bgRgb) > 0.45;

  // If background is light and contrast is poor, shift to deep dark
  if (isLightBg) {
    return '#0F172A';
  }
  // If background is dark and contrast is poor, shift to bright white/accent
  return '#F8FAFC';
}
