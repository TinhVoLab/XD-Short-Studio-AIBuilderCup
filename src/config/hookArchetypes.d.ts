import type { HookArchetype, HookLayoutStyle } from '@/types/scene';
export interface HookArchetypeDefaults {
  accent: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  heroTitle: string;
  highlightWords: string[];
  subText: string;
  defaultLayout: HookLayoutStyle;
  defaultSfxId: string;
}
export declare const ARCHETYPE_DEFAULTS: Record<HookArchetype, HookArchetypeDefaults>;
