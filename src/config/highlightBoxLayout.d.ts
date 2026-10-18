export interface HighlightVariantSpec {
  padY: number;
  padX: number;
  border?: number;
  borderLeft?: number;
  iconSize: number;
  gap: number;
  lineHeight: number;
  minFont?: number;
}

export declare const HIGHLIGHT_BOX_SPEC: {
  weights: { body: number; pill: number; sticker: number; number: number };
  callout: HighlightVariantSpec;
  strip: HighlightVariantSpec;
  pill: HighlightVariantSpec;
  sticker: { wrapPadY: number; wrapPadX: number; gap: number; padY: number; padX: number; border: number; lineHeight: number; fontScale: number; minFont: number };
  bullet: { rowGap: number; padY: number; padX: number; padYPlain: number; padXPlain: number; border: number; badgeNumber: number; badgeIcon: number; gap: number; lineHeight: number };
};

export type HighlightVariant = 'callout-card' | 'accent-strip' | 'glow-pill' | 'multi-pill' | 'bullet-list';
export declare const HIGHLIGHT_VARIANTS: HighlightVariant[];

export declare function splitHighlightLines(text?: string | null): string[];
export declare function cleanHighlightLine(line?: string | null): string;
export declare function highlightBulletRows(text?: string | null): string[];
export declare function splitHighlightStickers(text?: string | null): string[];
export declare function resolveHighlightVariant(el: any): HighlightVariant;
export declare function estimateTextLines(text: string, availW: number, fontSize: number, opts?: { weight?: number; fontFamily?: string; emphasizeNumbers?: boolean; orphanGuard?: boolean }): number;
export declare function resolveBulletBadge(el: any, lineCount: number): { showNumber: boolean; showIcon: boolean };

export interface HighlightBoxLayout {
  variant: HighlightVariant;
  height: number;
  fontSize: number;
  /** Văn bản hiển thị đã làm sạch (callout / strip / pill) */
  text?: string;
  textLines?: number;
  /** Bullet căn giữa có huy hiệu: bề rộng khoảng đối xứng bên phải */
  centerSpacer?: number;
  hasIcon?: boolean;
  rows?: Array<{ text: string; textLines: number; height: number }>;
  showNumber?: boolean;
  showIcon?: boolean;
  pills?: Array<{ text: string; width: number; height: number }>;
  pillRows?: Array<Array<{ text: string; width: number; height: number }>>;
}

export declare function layoutHighlightBox(el: any): HighlightBoxLayout;

export type HighlightSkin = 'glass' | 'editorial' | 'paper' | 'marker';
export declare const HIGHLIGHT_SKINS: HighlightSkin[];
export declare function resolveHighlightSkin(
  el: any,
  palette: { highlightSkin?: HighlightSkin } | undefined,
  bgBusy?: boolean
): { skin: HighlightSkin; frameless: boolean; backing: boolean };
export declare function suggestHighlightIcon(text?: string | null): string;
export declare function skinIcon(icon: string | undefined, skin: HighlightSkin): string;
