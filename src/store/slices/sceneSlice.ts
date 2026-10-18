import { StateCreator } from 'zustand'
import { SceneSlice, EditorStore } from '../storeTypes'
import { Scene, AudioTrackClip } from '@/types/scene'
import { DEFAULT_SCENES, BLANK_SCENE } from '@/utils/scenes'
import { pushSnapshot } from './historySlice'

// ── Auto-realign Voiceover Clips on Track A1 to match scene durations ──
export function realignTrackA1(scenes: Scene[], audioClips: AudioTrackClip[]): AudioTrackClip[] {
  const sceneStartMap = new Map<string, number>()
  let cumTime = 0
  scenes.forEach(sc => {
    sceneStartMap.set(sc.id, Math.round(cumTime * 100) / 100)
    cumTime += (sc.duration || 3)
  })

  let hasChange = false
  const nextClips = audioClips.map(clip => {
    if (clip.trackId === 'A1' && clip.sceneId && sceneStartMap.has(clip.sceneId)) {
      const targetStartSec = sceneStartMap.get(clip.sceneId)!
      if (Math.abs((clip.startSec ?? 0) - targetStartSec) > 0.01) {
        hasChange = true
        return { ...clip, startSec: targetStartSec }
      }
    }
    return clip
  })

  return hasChange ? nextClips : audioClips
}

export const createSceneSlice: StateCreator<
  EditorStore,
  [],
  [],
  SceneSlice
> = (set, get) => ({
  scenes: [{ ...BLANK_SCENE, id: 'scene-0' }],
  currentSceneIdx: 0,
  selectedSceneIdxs: [],
  
  setCurrentScene: (idx) => set({ currentSceneIdx: idx }),
  
  setSelectedSceneIdxs: (idxs) => set({ selectedSceneIdxs: idxs }),
  
  toggleSelectedSceneIdx: (idx) => set(s => {
    const exists = s.selectedSceneIdxs.includes(idx)
    const next = exists 
      ? s.selectedSceneIdxs.filter(i => i !== idx)
      : [...s.selectedSceneIdxs, idx]
    return { selectedSceneIdxs: next }
  }),

  moveSelectedScenes: (direction: number) => set(s => {
    if (s.selectedSceneIdxs.length === 0) return s

    const selectedSet = new Set(s.selectedSceneIdxs)
    const sortedSelectedIdxs = [...s.selectedSceneIdxs].sort((a, b) => a - b)
    const selectedScenes = sortedSelectedIdxs.map(i => s.scenes[i])
    const remainingScenes = s.scenes.filter((_, i) => !selectedSet.has(i))

    // Current insert point = count of non-selected scenes before min(selectedIdxs)
    const minIdx = sortedSelectedIdxs[0]
    let currentInsertPoint = 0
    for (let i = 0; i < minIdx; i++) {
      if (!selectedSet.has(i)) currentInsertPoint++
    }

    // Move insert point by direction, clamped to valid range
    const newInsertPoint = Math.max(0, Math.min(remainingScenes.length, currentInsertPoint + direction))

    const newScenes = [
      ...remainingScenes.slice(0, newInsertPoint),
      ...selectedScenes,
      ...remainingScenes.slice(newInsertPoint)
    ]

    const newSelectedIdxs = selectedScenes.map((_, j) => newInsertPoint + j)
    const hist = pushSnapshot(s, 'Di chuyển cảnh')

    return {
      ...hist,
      scenes: newScenes,
      selectedSceneIdxs: newSelectedIdxs,
      currentSceneIdx: Math.min(newSelectedIdxs[0] ?? 0, newScenes.length - 1)
    }
  }),

  reorderScene: (fromIdx: number, toIdx: number) => set(s => {
    if (fromIdx === toIdx || fromIdx < 0 || fromIdx >= s.scenes.length || toIdx < 0 || toIdx >= s.scenes.length) return s
    const newScenes = [...s.scenes]
    const [moved] = newScenes.splice(fromIdx, 1)
    newScenes.splice(toIdx, 0, moved)
    const hist = pushSnapshot(s, 'Sắp xếp lại cảnh')
    return {
      ...hist,
      scenes: newScenes,
      currentSceneIdx: toIdx,
      selectedSceneIdxs: [toIdx]
    }
  }),

  reorderSelectedScenesTo: (targetIdx: number, position: 'before' | 'after') => set(s => {
    if (targetIdx < 0 || targetIdx >= s.scenes.length) return s
    const selectedSet = new Set(s.selectedSceneIdxs.length > 0 ? s.selectedSceneIdxs : [s.currentSceneIdx])
    const sortedSelectedIdxs = Array.from(selectedSet).sort((a, b) => a - b)
    const selectedScenes = sortedSelectedIdxs.map(i => s.scenes[i])
    const remainingScenes = s.scenes.filter((_, i) => !selectedSet.has(i))

    const targetScene = s.scenes[targetIdx]
    let insertIdx = remainingScenes.findIndex(sc => sc.id === targetScene.id)
    if (insertIdx === -1) insertIdx = remainingScenes.length
    if (position === 'after') insertIdx += 1

    const newScenes = [
      ...remainingScenes.slice(0, insertIdx),
      ...selectedScenes,
      ...remainingScenes.slice(insertIdx)
    ]

    const newSelectedIdxs = selectedScenes.map((_, j) => insertIdx + j)
    const hist = pushSnapshot(s, 'Sắp xếp lại cảnh')

    return {
      ...hist,
      scenes: newScenes,
      selectedSceneIdxs: newSelectedIdxs,
      currentSceneIdx: newSelectedIdxs[0] ?? 0
    }
  }),

  deleteSelectedScenes: () => set(s => {
    if (s.selectedSceneIdxs.length === 0) return s
    const newScenes = s.scenes.filter((_, i) => !s.selectedSceneIdxs.includes(i))
    if (newScenes.length === 0) return s
    const hist = pushSnapshot(s, 'Xóa các cảnh đã chọn')
    return {
      ...hist,
      scenes: newScenes,
      selectedSceneIdxs: [],
      currentSceneIdx: Math.min(s.currentSceneIdx, newScenes.length - 1)
    }
  }),

  addScene: () => set(s => {
    const hist = pushSnapshot(s, 'Thêm cảnh mới')
    const newIdx = s.scenes.length
    return {
      ...hist,
      scenes: [...s.scenes, {
        id: `scene-${Date.now()}`,
        name: `Cảnh ${newIdx + 1}`,
        description: 'Cảnh mới',
        duration: 5,
        paletteId: s.scenes[s.currentSceneIdx]?.paletteId || 'neon-night',
        bgColor: '',
        bgPattern: 'none',
        authorName: s.brandingSettings.authorName,
        authorAvatarUrl: s.brandingSettings.authorAvatarUrl,
        authorAvatarSize: s.brandingSettings.authorAvatarSize || 44,
        hudFooterRight: s.brandingSettings.authorHandle,
        elements: [],
        svgContent: `<svg viewBox="0 0 360 640" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
          <rect width="360" height="640" fill="transparent"/>
          <text x="180" y="320" text-anchor="middle" fill="#555" font-size="18" font-family="Inter">Cảnh trống</text>
        </svg>`,
      }],
      currentSceneIdx: newIdx,
      selectedSceneIdxs: [newIdx],
      selectedElementId: null,
      selectedElementIds: [],
    }
  }),

  insertSceneAt: (idx, template, options = { rippleAudio: true }) => set(s => {
    const targetIdx = Math.max(0, Math.min(idx, s.scenes.length))
    const newDur = template?.duration || 3
    const newSceneId = `scene-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

    const newScene: Scene = {
      id: newSceneId,
      name: template?.name || `Cảnh ${targetIdx + 1}`,
      description: template?.description || 'Cảnh mới',
      duration: newDur,
      bgColor: template?.bgColor || '#080808',
      authorName: s.brandingSettings.authorName,
      authorAvatarUrl: s.brandingSettings.authorAvatarUrl,
      authorAvatarSize: s.brandingSettings.authorAvatarSize || 44,
      hudFooterRight: s.brandingSettings.authorHandle,
      elements: template?.elements ? JSON.parse(JSON.stringify(template.elements)) : [],
      svgContent: template?.svgContent || `<svg viewBox="0 0 360 640" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
        <rect width="360" height="640" fill="#080808"/>
        <text x="180" y="320" text-anchor="middle" fill="#555" font-size="18" font-family="Inter">Cảnh trống</text>
      </svg>`,
      ...template,
    }

    const hist = pushSnapshot(s, `Chèn cảnh mới tại vị trí ${targetIdx + 1}`)

    const scenes = [
      ...s.scenes.slice(0, targetIdx),
      newScene,
      ...s.scenes.slice(targetIdx)
    ]

    // Calculate split timestamp: T_split = sum of durations before targetIdx
    let splitTimeSec = 0
    for (let i = 0; i < targetIdx; i++) {
      splitTimeSec += s.scenes[i]?.duration || 0
    }

    // Audio Smart Ripple Shift: push forward audio clips that start at/after split point
    let audioClips = s.audioClips || []
    if (options.rippleAudio !== false && audioClips.length > 0) {
      audioClips = audioClips.map(clip => {
        if (clip.startSec >= splitTimeSec - 0.05) {
          return {
            ...clip,
            startSec: Number((clip.startSec + newDur).toFixed(2))
          }
        }
        return clip
      })
    }

    return {
      ...hist,
      scenes,
      audioClips,
      currentSceneIdx: targetIdx,
      selectedSceneIdxs: [targetIdx]
    }
  }),

  insertScenesBatch: (idx, scenesToInsert, historyLabel = 'Chèn các cảnh mới', audioClipsToInsert = []) => set(s => {
    if (!scenesToInsert || scenesToInsert.length === 0) return s
    const targetIdx = Math.max(0, Math.min(idx, s.scenes.length))
    const totalNewDur = scenesToInsert.reduce((sum, sc) => sum + (sc.duration || 3), 0)

    const hist = pushSnapshot(s, historyLabel)

    const scenes = [
      ...s.scenes.slice(0, targetIdx),
      ...scenesToInsert,
      ...s.scenes.slice(targetIdx)
    ]

    // Calculate split timestamp: T_split = sum of durations before targetIdx
    let splitTimeSec = 0
    for (let i = 0; i < targetIdx; i++) {
      splitTimeSec += s.scenes[i]?.duration || 0
    }

    // Audio Smart Ripple Shift: push forward audio clips that start at/after split point
    let audioClips = s.audioClips || []
    if (audioClips.length > 0) {
      audioClips = audioClips.map(clip => {
        if (clip.startSec >= splitTimeSec - 0.05) {
          return {
            ...clip,
            startSec: Number((clip.startSec + totalNewDur).toFixed(2))
          }
        }
        return clip
      })
    }

    // Shift newly inserted audio clips by splitTimeSec
    const shiftedNewClips = (audioClipsToInsert || []).map(clip => ({
      ...clip,
      startSec: Number((splitTimeSec + (clip.startSec || 0)).toFixed(2))
    }))

    const combinedClips = [...audioClips, ...shiftedNewClips]
    const alignedClips = realignTrackA1(scenes, combinedClips)

    const trackIds = [...(s.audioTrackIds || ['A1', 'A2'])]
    if (shiftedNewClips.some(c => c.trackId === 'A2') && !trackIds.includes('A2')) {
      trackIds.push('A2')
    }

    return {
      ...hist,
      scenes,
      audioTrackIds: trackIds,
      audioClips: alignedClips,
      currentSceneIdx: targetIdx,
      selectedSceneIdxs: [targetIdx]
    }
  }),

  deleteScene: (idx) => set(s => {
    if (s.scenes.length <= 1) return s
    const hist = pushSnapshot(s, `Xóa cảnh ${idx + 1}`)
    const scenes = s.scenes.filter((_, i) => i !== idx)
    let currentSceneIdx = s.currentSceneIdx
    if (idx < s.currentSceneIdx) currentSceneIdx--
    else if (idx === s.currentSceneIdx) currentSceneIdx = Math.min(idx, scenes.length - 1)
    return { ...hist, scenes, currentSceneIdx }
  }),

  duplicateScene: (idx, insertPosition = 'before') => set(s => {
    if (idx < 0 || idx >= s.scenes.length) return s
    const src = s.scenes[idx]

    // 1. Full Deep Clone for 100% memory isolation
    let deepCloned: Scene
    try {
      deepCloned = structuredClone(src)
    } catch {
      deepCloned = JSON.parse(JSON.stringify(src))
    }

    // 2. Re-assign unique IDs for cloned Scene and all cloned elements
    const sceneId = `scene-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const clone: Scene = {
      ...deepCloned,
      id: sceneId,
      name: `${src.name || `Cảnh ${idx + 1}`} (bản sao)`,
      elements: (deepCloned.elements || []).map((el, elIdx) => ({
        ...el,
        id: `el-${Date.now()}-${elIdx}-${Math.random().toString(36).slice(2, 7)}`,
        keyframes: el.keyframes ? el.keyframes.map(kf => ({ ...kf })) : []
      }))
    }

    const hist = pushSnapshot(s, `Nhân bản cảnh ${idx + 1} (${insertPosition === 'before' ? 'chèn trước' : 'chèn sau'})`)

    // 3. Insert BEFORE (idx) or AFTER (idx + 1)
    const targetIdx = insertPosition === 'before' ? idx : idx + 1
    const scenes = [
      ...s.scenes.slice(0, targetIdx),
      clone,
      ...s.scenes.slice(targetIdx)
    ]

    // Calculate split timestamp for audio ripple
    let splitTimeSec = 0
    for (let i = 0; i < targetIdx; i++) {
      splitTimeSec += s.scenes[i]?.duration || 0
    }

    let audioClips = s.audioClips || []
    if (audioClips.length > 0) {
      audioClips = audioClips.map(clip => {
        if (clip.startSec >= splitTimeSec - 0.05) {
          return {
            ...clip,
            startSec: Number((clip.startSec + clone.duration).toFixed(2))
          }
        }
        return clip
      })
    }

    return {
      ...hist,
      scenes,
      audioClips,
      currentSceneIdx: targetIdx,
      selectedSceneIdxs: [targetIdx]
    }
  }),

  addHybridScene: (preset, insertAt) => {
    const s = get()
    const targetIdx = insertAt !== undefined ? insertAt : s.scenes.length
    const timestamp = Date.now()

    const freshElements = (preset.sceneConfig.elements || []).map((el, elIdx) => ({
      scaleX: 1,
      scaleY: 1,
      angle: 0,
      opacity: 1,
      ...el,
      id: `el-edu-${timestamp}-${elIdx}-${Math.random().toString(36).slice(2, 6)}`,
    }))

    const scenePayload: Partial<Scene> = {
      name: preset.title,
      description: preset.description,
      duration: preset.sceneConfig.duration || 8,
      bgColor: preset.sceneConfig.bgColor || '#070D18',
      bgPattern: (preset.sceneConfig.bgPattern as any) || 'none',
      elements: freshElements as any,
      voiceoverText: preset.sceneConfig.suggestedVoiceover || '',
    }

    s.insertSceneAt(targetIdx, scenePayload)
    s.showToast(`Đã thêm cảnh giáo dục: ${preset.title}`)
  },

  setScenes: (scenes) => set(s => {
    const hist = pushSnapshot(s, 'Cập nhật kịch bản')
    const sanitizedScenes = scenes.map(sc => ({
      ...sc,
      paletteId: sc.paletteId || (sc as any).colorTheme || 'neon-night'
    }))
    const alignedClips = realignTrackA1(sanitizedScenes, s.audioClips)
    return { ...hist, scenes: sanitizedScenes, audioClips: alignedClips, currentSceneIdx: 0 }
  }),
  
  updateScene: (id, patch) => set(s => {
    const hist = pushSnapshot(s, 'Chỉnh sửa cảnh', 400)
    const updatedScenes = s.scenes.map(scene => scene.id === id ? { ...scene, ...patch } : scene)
    const updatedClips = patch.duration !== undefined 
      ? realignTrackA1(updatedScenes, s.audioClips)
      : s.audioClips

    return {
      ...hist,
      scenes: updatedScenes,
      audioClips: updatedClips
    }
  }),

  applyBackgroundToAllScenes: (bgConfig) => set(s => {
    const hist = pushSnapshot(s, 'Áp dụng thiết lập cảnh cho tất cả các cảnh')
    const updatedScenes = s.scenes.map(scene => ({
      ...scene,
      ...(bgConfig.bgColor !== undefined ? { bgColor: bgConfig.bgColor } : {}),
      ...(bgConfig.bgGradient !== undefined ? { bgGradient: bgConfig.bgGradient } : {}),
      ...(bgConfig.bgVideoUrl !== undefined ? { bgVideoUrl: bgConfig.bgVideoUrl } : {}),
      ...(bgConfig.bgVideoLoop !== undefined ? { bgVideoLoop: bgConfig.bgVideoLoop } : {}),
      ...(bgConfig.bgVideoVolume !== undefined ? { bgVideoVolume: bgConfig.bgVideoVolume } : {}),
      ...(bgConfig.bgPattern !== undefined ? { bgPattern: bgConfig.bgPattern } : {}),
      ...(bgConfig.bgPatternColor !== undefined ? { bgPatternColor: bgConfig.bgPatternColor } : {}),
      ...(bgConfig.bgPatternOpacity !== undefined ? { bgPatternOpacity: bgConfig.bgPatternOpacity } : {}),
      ...(bgConfig.cameraMotion !== undefined ? { cameraMotion: bgConfig.cameraMotion } : {}),
      ...(bgConfig.transition !== undefined ? { transition: bgConfig.transition, transitionOut: undefined } : {}),
      ...(bgConfig.progressBar !== undefined ? { progressBar: bgConfig.progressBar } : {}),
      ...(bgConfig.viralEffects !== undefined ? {
        viralEffects: {
          ...(scene.viralEffects || {}),
          ...bgConfig.viralEffects
        }
      } : {})
    }))
    return { ...hist, scenes: updatedScenes }
  }),
})
