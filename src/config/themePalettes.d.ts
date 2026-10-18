export interface Theme5LayerTokens {
  bg: string;
  bgGradient?: string;
  surface: string;
  onSurface: string;
  text: string;
  /** Chữ phụ riêng (biến thể nền ngà / nền màu nhấn); bỏ trống → theo chế độ sáng/tối */
  textSub?: string;
  accent: string;
  /** Màu mảng tô có viền (không phải chữ); bỏ trống = accent */
  accentFill?: string;
  /** Chữ trên mảng accentFill; bỏ trống = onAccent */
  onAccentFill?: string;
  onAccent: string;
  subtitleBg: string;
  subtitleText: string;
  /** Màu từ đang đọc trong phụ đề — đạt ≥ 4.5:1 trên subtitleBg */
  subtitleHighlight: string;
}

export interface ChartTokens {
  chartBar: string;
  chartBarBorder: string;
  chartAxis: string;
  chartGrid: string;
  chartLabel: string;
  chartHighlight: string;
  chartValue: string;
  chartPositive: string;
  chartNegative: string;
  chartWarning: string;
  chartLineStrength: string;
  chartSeries: [string, string, string, string, string];
  bgGradient?: string;
}

export interface ThemePalette {
  id: string;
  label: string;
  desc: string;
  category: 'dark' | 'light' | 'pastel';
  spaceMode: 'dark' | 'daylight-warm';
  highlightSkin: 'glass' | 'editorial' | 'paper' | 'marker';
  tokens: Theme5LayerTokens;
  chartTokens: ChartTokens;
  preview: [string, string, string];
}

export declare function hexToRgba(hex: string, alpha?: number): string;
export declare function getContrastTextColor(bgColorHex: string): string;
export declare function relativeLuminance(hex: string): number;
export declare function contrastRatio(hexA: string, hexB: string): number;
export declare function isNeutralTextColor(color?: string | null): boolean;
export declare function isLegacyDarkTextColor(color?: string | null): boolean;
export declare function isLegacySceneBg(bg?: string): boolean;
export declare const THEME_PALETTES: Record<string, ThemePalette>;
export declare const LEGACY_THEME_ALIAS: Record<string, string>;
export declare function resolveThemePalette(paletteIdOrTheme?: string, fallbackId?: string): ThemePalette;

/** Kiểu nền cảnh của thư viện Master: nền ngà hoặc nền màu nhấn (mặc định = nền theme) */
export type SceneSurface = 'ivory' | 'accent'
export declare const SURFACE_VARIANTS: SceneSurface[];
export declare function withSceneSurface(palette: ThemePalette, surface?: SceneSurface | null): ThemePalette;
