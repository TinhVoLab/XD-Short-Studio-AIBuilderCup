import type { MasterHookData, HookLayoutStyle } from '@/types/scene';

export type HookIntent = 'warning' | 'number' | 'versus' | 'secret' | 'tech' | 'curiosity' | 'tips' | 'healing';
export declare const HOOK_INTENTS: HookIntent[];
export declare const HOOK_LAYOUTS: Partial<Record<HookLayoutStyle, {
  fit: Partial<Record<HookIntent, number>>;
  requires?: 'number' | 'versus';
  minWords?: number;
  maxWords?: number;
  boxVariant?: string[];
  highlightStyle?: string[];
}>>;
export declare function cleanHookText(text: unknown): string;
export declare function inferHookIntent(text: string, opts?: { domains?: string[] }): HookIntent;
export declare function designHook(
  hook?: Partial<MasterHookData> & { hookIntent?: string },
  opts?: { content?: string; seed?: string; recentLayouts?: string[]; styleHint?: string; domains?: string[]; lockLayout?: boolean }
): MasterHookData & { hookIntent: HookIntent };
