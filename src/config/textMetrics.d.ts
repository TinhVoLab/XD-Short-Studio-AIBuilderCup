export interface TextMetricsOptions {
  weight?: number;
  fontFamily?: string;
  emphasizeNumbers?: boolean;
  letterSpacing?: number;
  orphanGuard?: boolean;
}
export declare const FIT_EPSILON: number;
export declare function measureTextWidth(text: string, fontSize: number, opts?: TextMetricsOptions): number;
/** Word-wrap trên các từ đã đo: chỉ số dòng (0-based) của từng từ */
export declare function wrapMeasuredWords(widths: number[], space: number, availW: number): number[];
export declare function estimateTextLines(text: string, availW: number, fontSize: number, opts?: TextMetricsOptions): number;
export declare function estimateTextWidth(text: string, fontSize: number, opts?: TextMetricsOptions): number;
