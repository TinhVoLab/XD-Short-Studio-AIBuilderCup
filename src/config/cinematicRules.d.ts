export declare const HIGH_ENERGY: number;
export declare const LOW_ENERGY: number;

export type NarrativeBeatKind = 'rehook' | 'payoff';
export declare const BEAT_KINDS: NarrativeBeatKind[];
export declare const MIN_SCENES_FOR_REHOOK: number;

export interface NarrativeBeatPlan {
  beat?: NarrativeBeatKind;
  /** Sàn năng lượng theo đường cong giữ chân; dùng khi AI không chấm energy */
  energy: number;
}

export declare function highlightSceneIndex(n: number): number;
export declare function seededRandom(seed: string): number;

export type SceneSilhouette = 'full-card' | 'title-widget' | 'widget-solo' | 'split' | 'statement';
export declare const SILHOUETTE_POOL: SceneSilhouette[];
/** 'hook' và 'cta' cho hai cảnh đầu/cuối (layout riêng), còn lại là bóng dáng cảnh thân */
export declare function planSceneSilhouettes(n: number, seed?: string): Array<SceneSilhouette | 'hook' | 'cta'>;
export declare function planNarrativeBeats(n: number): NarrativeBeatPlan[];

export declare function resolveSceneEnergy(
  scene: { energy?: number; temporalRole?: string; beat?: { kind?: string } } | undefined | null
): number;

export interface CinematicPlan {
  cameraMotion: 'static' | 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right' | 'shake';
  transition: { type: string; duration: number };
}

export declare function planCinematics(
  scenes: Array<{ temporalRole?: string; energy?: number; voiceoverText?: string; beat?: { kind?: string } }>,
  seedPrefix?: string
): CinematicPlan[];
