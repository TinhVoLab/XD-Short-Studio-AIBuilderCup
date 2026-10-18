export interface SafeZoneConfig {
  TOP: number;
  BOTTOM: number;
  WIDTH: number;
  CENTER_X: number;
  MAX_HEIGHT: number;
  MIN_GAP: number;
}

export interface SfxProfileItem {
  type: string;
  delaySec: number;
  volume: number;
}

export interface LayoutArchetype {
  id: string;
  name: string;
  sfxProfile?: SfxProfileItem[];
  generatePrompt: (ACCENT: string) => string;
}

export declare const PHI: number;
export declare const FIBONACCI_GAPS: number[];
export declare const GOLDEN_FOCAL_Y: number;
export declare const GOLDEN_LOWER_Y: number;
export declare const MIN_COMPRESSION_SCALE: number;
export declare const VIETNAMESE_SAFETY_MARGIN: number;
export declare const ELEMENT_BOX_SPECS: Record<string, any>;

export declare const SAFE_ZONE: SafeZoneConfig;
export declare const ELEMENT_DEFAULT_HEIGHTS: Record<string, number>;
export declare const ELEMENT_PRIORITY: Record<string, number>;
export declare const SCENE_SILHOUETTES: Record<'full-card' | 'title-widget' | 'widget-solo' | 'split' | 'statement', { maxElements: number; prompt: string }>;
export declare const HOOK_ARCHETYPES: Record<string, LayoutArchetype>;
export declare const CONTENT_LAYOUTS: Record<string, LayoutArchetype>;
export declare const CLIMAX_LAYOUT: LayoutArchetype;
export declare const CTA_LAYOUT: LayoutArchetype;

export declare function getHookLayoutFromRegistry(styleOrText: string, ACCENT: string): string;
export declare function getCompiledLayoutRulesFromRegistry(customTemplates: any, style: string, ACCENT: string): string;
export declare function calculateElementDynamicHeight(el: any): number;

export interface BadgeDimensions {
  width: number;
  height: number;
  radius: number;
  autoW: number;
  autoH: number;
}

export declare function calculateBadgeDimensions(el: any): BadgeDimensions;

export interface ElementWidthSpecs {
  min: number;
  max: number;
  default: number;
  step: number;
}

export declare const CARD_LAYOUT_SPECS: {
  SAFE_MAX_WIDTH: number;
  SAFE_MIN_WIDTH: number;
  DEFAULT_CARD_WIDTH: number;
  DEFAULT_CHART_WIDTH: number;
  STEP: number;
};

export declare function getElementWidthSpecs(elementType: string): ElementWidthSpecs;


export declare const CENTER_ORIGIN_TYPES: Set<string>;
export declare const LEFT_ORIGIN_TYPES: Set<string>;
export declare function getElementOrigin(el: { type: string; textAlign?: string }): {
  x: 'center' | 'left' | 'right';
  y: 'top' | 'center';
};
