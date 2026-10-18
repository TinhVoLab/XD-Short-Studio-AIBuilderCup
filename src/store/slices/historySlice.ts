import { StateCreator } from 'zustand'
import { HistorySlice, EditorStore } from '../storeTypes'
import { HistorySnapshot } from '@/types/history'
import { Scene, AudioTrackClip } from '@/types/scene'

export const MAX_HISTORY_LIMIT = 50

export function createSnapshot(state: {
  scenes: Scene[]
  audioClips: AudioTrackClip[]
  audioTrackIds?: string[]
  bgMusicUrl?: string
  bgMusicVolume: number
  currentSceneIdx: number
}, description: string = 'Chỉnh sửa'): HistorySnapshot {
  return {
    scenes: JSON.parse(JSON.stringify(state.scenes)),
    audioClips: JSON.parse(JSON.stringify(state.audioClips || [])),
    audioTrackIds: state.audioTrackIds ? [...state.audioTrackIds] : ['A1', 'A2'],
    bgMusicUrl: state.bgMusicUrl,
    bgMusicVolume: state.bgMusicVolume,
    currentSceneIdx: state.currentSceneIdx,
    description,
    timestamp: Date.now()
  }
}

export function pushSnapshot(
  s: EditorStore,
  description: string,
  coalesceWindowMs: number = 0
): { past: HistorySnapshot[]; future: HistorySnapshot[]; canUndo: boolean; canRedo: boolean; lastUndoDescription: string | null } {
  const now = Date.now()
  const last = s.past[s.past.length - 1]

  // If within coalesce window and same action, update timestamp and coalesce into 1 undo step
  if (coalesceWindowMs > 0 && last && last.description === description && (now - last.timestamp < coalesceWindowMs)) {
    return {
      past: s.past,
      future: [],
      canUndo: true,
      canRedo: false,
      lastUndoDescription: description
    }
  }

  const snapshot = createSnapshot(s, description)
  const newPast = [...s.past, snapshot].slice(-MAX_HISTORY_LIMIT)
  return {
    past: newPast,
    future: [],
    canUndo: true,
    canRedo: false,
    lastUndoDescription: description
  }
}

export const createHistorySlice: StateCreator<
  EditorStore,
  [],
  [],
  HistorySlice
> = (set, get) => ({
  past: [],
  future: [],
  canUndo: false,
  canRedo: false,
  lastUndoDescription: null,
  lastRedoDescription: null,

  pushHistory: (description = 'Chỉnh sửa') => set(s => {
    const hist = pushSnapshot(s, description)
    return { ...hist }
  }),

  undo: () => set(s => {
    if (s.past.length === 0) return s
    const previous = s.past[s.past.length - 1]
    const newPast = s.past.slice(0, s.past.length - 1)
    const currentSnapshot = createSnapshot(s, previous.description || 'Hoàn tác')
    const newFuture = [currentSnapshot, ...s.future].slice(0, MAX_HISTORY_LIMIT)

    const desc = previous.description || 'thao tác'
    setTimeout(() => {
      get().showToast(`Đã hoàn tác: ${desc}`, 2000)
    }, 0)

    return {
      past: newPast,
      future: newFuture,
      canUndo: newPast.length > 0,
      canRedo: newFuture.length > 0,
      lastUndoDescription: newPast.length > 0 ? newPast[newPast.length - 1].description : null,
      lastRedoDescription: previous.description,
      scenes: previous.scenes,
      audioClips: previous.audioClips,
      audioTrackIds: previous.audioTrackIds || ['A1', 'A2'],
      bgMusicUrl: previous.bgMusicUrl,
      bgMusicVolume: previous.bgMusicVolume,
      currentSceneIdx: Math.min(previous.currentSceneIdx, previous.scenes.length - 1),
      isSaved: false
    }
  }),

  redo: () => set(s => {
    if (s.future.length === 0) return s
    const next = s.future[0]
    const newFuture = s.future.slice(1)
    const currentSnapshot = createSnapshot(s, next.description || 'Làm lại')
    const newPast = [...s.past, currentSnapshot].slice(-MAX_HISTORY_LIMIT)

    const desc = next.description || 'thao tác'
    setTimeout(() => {
      get().showToast(`Đã làm lại: ${desc}`, 2000)
    }, 0)

    return {
      past: newPast,
      future: newFuture,
      canUndo: newPast.length > 0,
      canRedo: newFuture.length > 0,
      lastUndoDescription: next.description,
      lastRedoDescription: newFuture.length > 0 ? newFuture[0].description : null,
      scenes: next.scenes,
      audioClips: next.audioClips,
      audioTrackIds: next.audioTrackIds || ['A1', 'A2'],
      bgMusicUrl: next.bgMusicUrl,
      bgMusicVolume: next.bgMusicVolume,
      currentSceneIdx: Math.min(next.currentSceneIdx, next.scenes.length - 1),
      isSaved: false
    }
  }),

  clearHistory: () => set({
    past: [],
    future: [],
    canUndo: false,
    canRedo: false,
    lastUndoDescription: null,
    lastRedoDescription: null
  }),
})
