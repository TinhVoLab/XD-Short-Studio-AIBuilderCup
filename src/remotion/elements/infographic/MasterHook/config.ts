import { HookLayoutStyle } from '@/types/scene';

export { ARCHETYPE_DEFAULTS } from '@/config/hookArchetypes';

// SFX map for specific layout styles if layout takes precedence
export const LAYOUT_SFX_MAP: Record<HookLayoutStyle, string> = {
  'hazard-alert': 'sfx_bell',
  'sticker-words': 'sfx_pop',
  'cyber-hud': 'sfx_typewriter',
  'split-versus': 'sfx_drumroll',
  'luxury-zen': 'sfx_chime',
  'cta-social': 'sfx_ding',
  'cta-pill': 'sfx_click',
  'cta-comment': 'sfx_pop',
  'cta-bookmark': 'sfx_ding',
  'stacked': 'sfx_whoosh',
  'kinetic-contrast': 'sfx_whoosh',
  'kinetic-bold-script': 'sfx_pop',
  'kinetic-solid-box': 'sfx_bell',
  'kinetic-giant-stat': 'sfx_ding',
  'kinetic-strip-highlight': 'sfx_whoosh',
  'gravity-pull': 'sfx_whoosh',
  'cinematic-lower-third': 'sfx_chime',
  'kinetic-word-weight': 'sfx_pop',
};
