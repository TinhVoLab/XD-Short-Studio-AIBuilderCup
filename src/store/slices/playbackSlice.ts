import { StateCreator } from 'zustand'
import { PlaybackSlice, EditorStore } from '../storeTypes'

export const createPlaybackSlice: StateCreator<
  EditorStore,
  [],
  [],
  PlaybackSlice
> = (set, get) => ({
  isPlaying: false,
  isMuted: false,
  playbackRate: 1.0,
  progress: 0,
  currentTimeSec: 0,
  previewMode: 'edit',
  isPipActive: false,
  thumbZoom: 1,
  timelineViewMode: 'tracks',

  setPlaying: (v) => set({ isPlaying: v }),
  setMuted: (v) => set({ isMuted: v }),
  setPlaybackRate: (rate) => set({ playbackRate: rate }),
  setPreviewMode: (m) => set({ previewMode: m }),
  setIsPipActive: (val) => set({ isPipActive: val }),
  setThumbZoom: (z) => set({ thumbZoom: z }),
  setTimelineViewMode: (mode) => set({ timelineViewMode: mode }),

  setProgress: (pct) => {
    const clamped = Math.max(0, Math.min(100, pct))
    const state = get()
    const scenesDur = state.scenes.reduce((a, s) => a + (s.duration || 3), 0)
    const audiosDur = state.audioClips.reduce((max, clip) => {
      const activeDur = (clip.playDurationSec ?? clip.duration) / (clip.playbackRate ?? 1.0)
      return Math.max(max, clip.startSec + activeDur)
    }, 0)
    const dynamicTotalDur = Math.max(1, scenesDur, audiosDur)
    const sec = (clamped / 100) * dynamicTotalDur

    // Calculate currentSceneIdx based on dynamic scenes
    let sceneIdx = 0
    let acc = 0
    for (let i = 0; i < state.scenes.length; i++) {
      acc += (state.scenes[i].duration || 3)
      if (sec < acc || i === state.scenes.length - 1) {
        sceneIdx = i
        break
      }
    }

    set({ progress: clamped, currentTimeSec: sec, currentSceneIdx: sceneIdx })
  },

  seekToScene: (idx) => {
    const state = get()
    const targetIdx = Math.max(0, Math.min(idx, state.scenes.length - 1))
    const scenesDur = state.scenes.reduce((a, s) => a + (s.duration || 3), 0)
    const audiosDur = state.audioClips.reduce((max, clip) => {
      const activeDur = (clip.playDurationSec ?? clip.duration) / (clip.playbackRate ?? 1.0)
      return Math.max(max, clip.startSec + activeDur)
    }, 0)
    const dynamicTotalDur = Math.max(1, scenesDur, audiosDur)

    let sec = 0
    for (let i = 0; i < targetIdx; i++) {
      sec += (state.scenes[i].duration || 3)
    }

    const startPct = dynamicTotalDur > 0 ? (sec / dynamicTotalDur) * 100 : 0
    set({ currentSceneIdx: targetIdx, progress: startPct, currentTimeSec: sec })
  },
})
