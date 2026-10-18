import { HookArchetype } from '@/types/scene';
import { getViralFontFamily } from '../../../../fonts/fontCatalog';
import { HOOK_TYPOGRAPHIC_VOICES, formatTypographicText, type HookVoiceData, type TextTransformMode } from '@/config/hookTypography';

// Dữ liệu giọng chữ + formatter là SSOT ở src/config/hookTypography.js; file này chỉ ánh xạ tên font đã nạp.
export { formatTypographicText };
export type { TextTransformMode };

export interface TypographicVoiceConfig extends Omit<HookVoiceData, 'fontFamily'> {
  fontFamily: string;
}

export const TYPOGRAPHIC_VOICE_MAP = Object.fromEntries(
  Object.entries(HOOK_TYPOGRAPHIC_VOICES).map(([k, v]) => [k, { ...v, fontFamily: getViralFontFamily(v.fontFamily) }]),
) as Record<HookArchetype, TypographicVoiceConfig>;

/** Giọng chữ hiệu lực của hook theo archetype */
export function getTypographicVoice(archetype: HookArchetype): TypographicVoiceConfig {
  return TYPOGRAPHIC_VOICE_MAP[archetype] || TYPOGRAPHIC_VOICE_MAP.custom;
}
