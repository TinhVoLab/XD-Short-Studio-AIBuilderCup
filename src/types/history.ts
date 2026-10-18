import { Scene, AudioTrackClip } from './scene'

export interface HistorySnapshot {
  scenes: Scene[]
  audioClips: AudioTrackClip[]
  audioTrackIds?: string[]
  bgMusicUrl?: string
  bgMusicVolume: number
  currentSceneIdx: number
  description: string
  timestamp: number
}
