import { AdvElementProps } from '../../types';
import { MasterHookData, HookArchetype, HookLayoutStyle } from '@/types/scene';
import { TypographicVoiceConfig } from './config/typographicVoice';

export interface HookLayoutSharedProps extends AdvElementProps {
  hookData: MasterHookData;
  archetype: HookArchetype;
  typographicVoice: TypographicVoiceConfig;
  defaults: {
    accent: string;
    badgeBg: string;
    badgeBorder: string;
    badgeText: string;
    heroTitle: string;
    highlightWords: string[];
    subText: string;
    defaultLayout: HookLayoutStyle;
  };
  accent: string;
  badgeText: string;
  heroTitle: string;
  formattedHeroTitle: string;
  subText: string;
  highlightList: string[];
  boxVariant: string;
  computedFontSize: number;
  badgeOpacity: number;
  badgeScale: number;
  heroOpacity: number;
  heroScale: number;
  heroTranslateY: number;
  boxOpacity: number;
  boxTranslateY: number;
  renderedHero: React.ReactNode;
}
