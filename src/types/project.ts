import { Scene, AudioTrackClip } from "./scene";
import { VideoFormat } from "./editor";
import { BrandingSettings } from "./settings";

export interface ProjectMetadata {
  id: string;
  folderName?: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  sceneCount: number;
  durationSec: number;
  videoFormat: VideoFormat;
  firstSceneText?: string;
  firstSceneBg?: string;
  tags?: string[];
}

export interface ProjectData {
  id: string;
  folderName?: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  videoFormat: VideoFormat;
  tags?: string[];
  scenes: Scene[];
  audioClips: AudioTrackClip[];
  audioTrackIds: string[];
  bgMusicUrl?: string;
  bgMusicVolume: number;
  brandingSettings?: BrandingSettings;
  socialCaptions?: any;
  masterVolume?: number;
  voiceoverVolume?: number;
  voiceoverSpeedRate?: number;
  voiceoverReverb?: number;
  bgmVolume?: number;
  sfxVolume?: number;
  autoDucking?: boolean;
  duckingRatio?: number;
  activeMascotProfileId?: string;
}
