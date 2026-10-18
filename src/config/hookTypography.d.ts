import type { HookArchetype } from '@/types/scene';
export type TextTransformMode = 'uppercase' | 'editorial' | 'title' | 'none';
export type HookBadgeStyle = 'tech-pill' | 'editorial-italic' | 'hazard-caution' | 'neon-glow' | 'minimal-dash';
export interface HookVoiceData {
  /** Tên font gốc (Google Fonts) — Remotion ánh xạ qua getViralFontFamily */
  fontFamily: string;
  fontWeight: number;
  letterSpacing: string;
  transformMode: TextTransformMode;
  lineHeight: number;
  badgeStyle: HookBadgeStyle;
}
export declare const HOOK_TYPOGRAPHIC_VOICES: Record<HookArchetype, HookVoiceData>;
export declare function getHookVoice(archetype?: string): HookVoiceData;
export declare function formatTypographicText(text: string, mode?: TextTransformMode): string;
export declare function letterSpacingPx(letterSpacing: string | number | undefined, fontSize: number): number;
