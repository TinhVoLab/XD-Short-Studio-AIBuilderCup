export interface GeminiModelInfo {
  id: string;
  label: string;
  shortLabel: string;
}
export declare const GEMINI_SCRIPT_MODELS: GeminiModelInfo[];
export declare const DEFAULT_GEMINI_MODEL: string;
export declare function isGeminiModel(id: unknown): boolean;
export declare function resolveGeminiModel(id: unknown): string;
export declare function normalizeScriptModel<T extends string | undefined | null>(id: T): T | string;
export declare function geminiModelChain(preferred?: unknown): string[];
export declare function geminiModelLabel(id: unknown, opts?: { short?: boolean }): string;
