import { create } from 'zustand'
import { EditorStore } from './storeTypes'
import { createHistorySlice, pushSnapshot, createSnapshot } from './slices/historySlice'
import { createSceneSlice, realignTrackA1 } from './slices/sceneSlice'
import { createPlaybackSlice } from './slices/playbackSlice'
import { createElementSlice, DEFAULT_INSPECTOR } from './slices/elementSlice'
import { createAudioSlice } from './slices/audioSlice'
import { createProjectSlice } from './slices/projectSlice'
import { createUiSlice } from './slices/uiSlice'
import { createAuthSlice } from './slices/authSlice'
import { createPlanSlice } from './slices/planSlice'

// Re-export all types and common helpers for 100% backward compatibility across entire codebase
export * from './storeTypes'
export { pushSnapshot, createSnapshot, realignTrackA1, DEFAULT_INSPECTOR }

export const useEditorStore = create<EditorStore>((...a) => ({
  ...createHistorySlice(...a),
  ...createSceneSlice(...a),
  ...createPlaybackSlice(...a),
  ...createElementSlice(...a),
  ...createAudioSlice(...a),
  ...createProjectSlice(...a),
  ...createUiSlice(...a),
  ...createAuthSlice(...a),
  ...createPlanSlice(...a),
}))
