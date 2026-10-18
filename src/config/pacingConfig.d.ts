export declare const SPEECH_RATE_WPS: { vi: number; en: number; default: number };

export declare const DURATION_BOUNDS: {
  MIN_SEC: number;
  MAX_SEC: number;
  SAFETY_PADDING_SEC: number;
  ABSOLUTE_AUDIO_MIN_SEC: number;
};

export declare const MIN_AVG_SCENE_SEC: number;
export declare function maxSceneCount(durationSec: number): number;
export declare const VOICE_GAP_SEC: number;
export declare const DEFAULT_TRANSITION_SEC: number;

export declare function countWords(text: string | undefined | null): number;
export declare function estimateSpeechSec(text: string | undefined | null, lang?: 'vi' | 'en'): number;
export declare function estimateSceneDurationSec(text: string | undefined | null, lang?: 'vi' | 'en'): number;
export declare function fitSceneDurationToAudio(audioSec: number, transitionSec?: number): number;
export declare function speechSpanForScene(sceneDurationSec: number, transitionSec?: number): number;
