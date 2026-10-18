import { HookArchetype, HookLayoutStyle } from '@/types/scene'

export type MainTab = 'hook' | 'highlight' | 'basic'
export type HookSubCategory = 'all' | 'warning' | 'tips' | 'curiosity' | 'secret' | 'versus' | 'healing' | 'slogan' | 'cta'

export interface HighlightBoxPresetItem {
  id: string;
  type?: 'highlight-box' | 'numbered-list';
  variant?: 'callout-card' | 'accent-strip' | 'glow-pill' | 'bullet-list' | 'multi-pill';
  boxIcon?: 'sparkle' | 'tip' | 'alert' | 'target' | 'pin' | 'rocket' | 'cta' | 'quote' | 'none';
  glowEffect?: boolean;
  textAlign?: 'left' | 'center' | 'right';
  label: string;
  badge: string;
  content: string;
  items?: string[];
  accent: string;
  animPreset: string;
}

export interface HookPresetItem {
  id: string;
  archetype: HookArchetype;
  category: 'hook' | 'slogan' | 'cta';
  label: string;
  badge: string;
  title: string;
  highlights: string[];
  sub: string;
  accent: string;
  animPreset: string;
  layoutStyle?: HookLayoutStyle;
  versusLeft?: string;
  versusRight?: string;
}

export const HOOK_SUB_CATEGORIES: { id: HookSubCategory; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'warning', label: 'Cảnh báo' },
  { id: 'tips', label: 'Mẹo hay' },
  { id: 'curiosity', label: 'Tò mò' },
  { id: 'secret', label: 'Bí mật' },
  { id: 'versus', label: 'So sánh' },
  { id: 'healing', label: 'Chữa lành' },
  { id: 'slogan', label: 'Slogan' },
  { id: 'cta', label: 'CTA' },
]
