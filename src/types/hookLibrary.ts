import { MasterHookData, SoundEffect, ViralEffectsConfig } from './scene';

export type HighlightStyle = 'text-glow' | 'solid-box' | 'outline-box' | 'underline-thick' | 'marker-circle';
export type WordLayout = 'inline' | 'stacked-words' | 'split-size' | 'diagonal';

export interface HookEditableSlots {
  heroTitle?: string;
  heroLine2?: string;
  badgeText?: string;
  subText?: string;
  accentColor?: string;
  highlightWords?: string[];
  scriptWords?: string[];
  scriptFontFamily?: string;
  statValue?: string;
  statLabel?: string;
  versusLeft?: string;
  versusRight?: string;
}

export interface HookSceneConfig {
  duration: number;
  bgColor: string;
  bgPattern?: 'grid' | 'dots' | 'none' | 'mesh' | 'noise' | 'cyber-3d' | 'topo-contour' | 'speed-lines';
  cameraMotion?: 'static' | 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right';
  transitionOut?: 'none' | 'fade' | 'glitch' | 'wipe' | 'zoom-blur';
  kineticBgWord?: string;
  sfxProfile: SoundEffect[];
  viralEffects?: ViralEffectsConfig;
}

export interface HookSceneTemplate {
  id: string;
  name: string;
  description?: string;
  category: 'kinetic' | 'hazard' | 'zen' | 'cyber' | 'versus' | 'cta';
  tags: string[];
  thumbnailUrl?: string;
  
  // Baked fields (locked layout & config)
  hookData: MasterHookData;
  sceneConfig: HookSceneConfig;
  
  // Editable fields mapping
  editableSlots: HookEditableSlots;
  
  // Metadata
  isBuiltIn: boolean;
  isLocked: boolean; // if true, cannot be deleted or modified in client mode
  createdAt: number;
  createdBy: 'ai' | 'user' | 'system';
}
