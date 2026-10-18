/**
 * ==============================================================================
 * 🎨 STUDIO FONT REGISTRY (SSOT)
 * ==============================================================================
 * Single source of truth for typography across XD-Short Studio:
 * - Inspector font dropdowns (TypographyControl, MasterHookInspector, etc.)
 * - Fabric.js Canvas vector rendering
 * - Remotion Video Engine mapping
 */

export interface StudioFontDef {
  id: string;
  name: string;
  category: 'sans' | 'display' | 'script' | 'serif' | 'tech';
  weights: string[];
  recommendedFor: ('hero' | 'body' | 'script' | 'stat' | 'badge')[];
}

export const STUDIO_FONT_FAMILIES: StudioFontDef[] = [
  {
    id: 'be-vietnam-pro',
    name: 'Be Vietnam Pro',
    category: 'sans',
    weights: ['400', '600', '700', '900'],
    recommendedFor: ['hero', 'body', 'badge', 'stat'],
  },
  {
    id: 'montserrat',
    name: 'Montserrat',
    category: 'sans',
    weights: ['600', '700', '900'],
    recommendedFor: ['hero', 'stat', 'badge'],
  },
  {
    id: 'bricolage-grotesque',
    name: 'Bricolage Grotesque',
    category: 'display',
    weights: ['600', '700', '800'],
    recommendedFor: ['hero', 'stat'],
  },
  {
    id: 'jetbrains-mono',
    name: 'JetBrains Mono',
    category: 'tech',
    weights: ['500'],
    recommendedFor: ['badge'],
  },
  {
    id: 'oswald',
    name: 'Oswald',
    category: 'display',
    weights: ['600', '700'],
    recommendedFor: ['hero', 'stat'],
  },
  {
    id: 'bebas-neue',
    name: 'Bebas Neue',
    category: 'display',
    weights: ['400'],
    recommendedFor: ['hero', 'stat'],
  },
  {
    id: 'poppins',
    name: 'Poppins',
    category: 'sans',
    weights: ['600', '700', '800'],
    recommendedFor: ['hero', 'body'],
  },
  {
    id: 'inter',
    name: 'Inter',
    category: 'sans',
    weights: ['400', '600', '700'],
    recommendedFor: ['body', 'badge'],
  },
  {
    id: 'lexend',
    name: 'Lexend',
    category: 'sans',
    weights: ['600', '700', '800'],
    recommendedFor: ['hero', 'body'],
  },
  {
    id: 'playfair-display',
    name: 'Playfair Display',
    category: 'serif',
    weights: ['400', '700'],
    recommendedFor: ['hero', 'body'],
  },
  {
    id: 'dancing-script',
    name: 'Dancing Script',
    category: 'script',
    weights: ['700'],
    recommendedFor: ['script'],
  },
  {
    id: 'caveat',
    name: 'Caveat',
    category: 'script',
    weights: ['700'],
    recommendedFor: ['script'],
  },
];

export const PRIMARY_STUDIO_FONTS = STUDIO_FONT_FAMILIES.filter(f => f.category !== 'script').map(f => f.name);
export const SCRIPT_STUDIO_FONTS = STUDIO_FONT_FAMILIES.filter(f => f.category === 'script').map(f => f.name);
