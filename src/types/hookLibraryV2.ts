import { MasterHookData, SoundEffect, ViralEffectsConfig } from './scene';
import { HookEditableSlots, HookSceneTemplate } from './hookLibrary';

export type VisualStyle = 'hazard' | 'kinetic' | 'cyber' | 'zen' | 'versus' | 'cta';
export type PsychArchetype = 'fomo_warning' | 'curiosity_gap' | 'giant_stat' | 'versus' | 'tips' | 'speed_hack';

export interface SFXKeyframeMarker {
  frame: number;              // Frame Remotion (e.g. 0, 15, 45)
  type: 'sub_drop' | 'glitch_hit' | 'camera_shutter' | 'whoosh' | 'pop' | 'typewriter';
  volume: number;             // 0.0 – 1.0
  duckOthers?: boolean;       // Hạ volume các SFX khác khi phát
}

export interface HookMetrics {
  viralScore: number;         // 0–100, Gemini estimate
  curiosityIndex: number;     // 0-100
  readabilityScore: number;   // 0-100
}

export interface MasterHookSceneConfigV2 {
  duration: number;
  bgColor: string;
  bgPattern?: 'grid' | 'dots' | 'none' | 'mesh' | 'noise' | 'cyber-3d' | 'topo-contour' | 'speed-lines';
  cameraMotion?: 'static' | 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right' | 'shake';
  transitionOut?: 'none' | 'fade' | 'glitch' | 'wipe' | 'zoom-blur';
  kineticBgWord?: string;
  sfxSequence: SFXKeyframeMarker[];  // Frame-based, thay thế sfxProfile tĩnh
  sfxProfile?: SoundEffect[];        // Tương thích ngược
  viralEffects?: ViralEffectsConfig;
}

export interface MasterHookTemplateV2_1 {
  id: string;
  schemaVersion: 2.1;
  name: string;
  description?: string;
  visualStyle: VisualStyle;           // Trục 1: Phong cách thị giác
  psychArchetype: PsychArchetype;     // Trục 2: Tâm lý học mục đích
  category?: VisualStyle;             // Tương thích ngược với UI cũ
  tags: string[];
  source: 'gemini' | 'cache' | 'offline_fallback' | 'user' | 'system';
  thumbnailUrl?: string;              // base64 WebP/PNG từ html-to-image
  thumbnailFormat?: 'webp' | 'png' | 'jpeg';
  metrics?: HookMetrics;
  actualPerformance?: {
    views: number;
    retentionRate3s: number;
    ctr?: number;
  };
  sceneConfig: MasterHookSceneConfigV2;
  hookData: MasterHookData;
  editableSlots: HookEditableSlots;
  isBuiltIn: boolean;
  isLocked: boolean;
  createdAt: number;
  createdBy: 'ai' | 'user' | 'system';
}

export const ARCHETYPE_LABELS: Record<PsychArchetype, string> = {
  fomo_warning: 'Cảnh báo mất mát (FOMO)',
  curiosity_gap: 'Khoảng trống tò mò',
  giant_stat: 'Số liệu thực chứng',
  versus: 'Đối đầu so sánh',
  tips: 'Bí quyết & Lời khuyên',
  speed_hack: 'Mẹo nhanh (Speed Hack)',
};

export const VISUAL_STYLE_LABELS: Record<VisualStyle, string> = {
  hazard: 'Cảnh báo khẩn (Hazard)',
  kinetic: 'Kinetic Motion Typography',
  cyber: 'Công nghệ Cyber HUD',
  zen: 'Tối giản sang trọng (Zen)',
  versus: 'Đối đầu phân đôi (Versus)',
  cta: 'Kêu gọi hành động (CTA)',
};
