export interface TimedScene {
  duration?: number;
  transition?: { type?: string; duration?: number } | null;
  transitionOut?: string | null;
}

export interface TimedAudioClip {
  startSec?: number;
  playDurationSec?: number;
}

export declare function sceneTransition(scene: TimedScene | undefined): { type: string; duration: number } | undefined;
export declare function transitionFrames(scene: TimedScene, fps?: number): number;
export declare function sceneStartFrames(scenes: TimedScene[], fps?: number): number[];
export declare function totalDurationFrames(scenes: TimedScene[], audioMaxSec?: number, fps?: number): number;
export declare function audioClipsEndSec(audioClips: TimedAudioClip[] | undefined | null): number;
export declare function projectVideoSec(scenes: TimedScene[], audioClips?: TimedAudioClip[] | null, fps?: number): number;
