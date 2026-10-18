import type { HookArchetype, HookLayoutStyle, MasterHookData } from '@/types/scene';
import type { HookArchetypeDefaults } from './hookArchetypes';
import type { HookVoiceData } from './hookTypography';

export declare const HOOK_HIGHLIGHT_BOX: Record<string, { padX: number; padY: number; lh?: number }>;
export declare const HOOK_LAYOUT_SPEC: Record<string, Record<string, any>>;

export interface ResolvedMasterHook {
  hook: MasterHookData;
  archetype: HookArchetype;
  defaults: HookArchetypeDefaults;
  /** Layout đã chuẩn hoá (gravity-pull → kinetic-word-weight, lạ → stacked) */
  layout: HookLayoutStyle;
  voice: HookVoiceData;
  text: string;
  badge: string;
  sub: string;
  highlights: string[];
  width?: number;
  explicit?: number;
  fontFamily: string;
  elFontFamily?: string;
  elFontWeight?: number | string;
  rootFontSize: number;
}

export interface FitHeroFontSizeOptions {
  text: string;
  layout: string;
  width?: number;
  voice?: HookVoiceData;
  explicit?: number;
  hook?: Partial<MasterHookData>;
  highlights?: string[];
  fontFamily?: string;
  elFontFamily?: string;
  elFontWeight?: number | string;
  rootFontSize?: number;
}

export declare function resolveMasterHook(el: any): ResolvedMasterHook;
export declare function heroMaxLines(text: string): number;
export declare function fitHeroFontSize(opts: FitHeroFontSizeOptions): number;
export declare function layoutMasterHookHeight(el: any): number;
export declare function packRows(flow: { tokens: { w: number; h: number }[]; gap: number; avail: number; rowGap: number; minH?: number }, avail?: number): { w: number; h: number; n: number }[];
