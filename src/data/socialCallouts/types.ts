import { SocialCalloutVariant, SocialCalloutData } from '@/types/scene'

export interface SocialCalloutPresetItem {
  id: string;
  variant: SocialCalloutVariant;
  category: 'bank' | 'tweet' | 'chat' | 'news';
  label: string;
  previewBadge: string;
  data: SocialCalloutData;
  animPreset: string;
}
