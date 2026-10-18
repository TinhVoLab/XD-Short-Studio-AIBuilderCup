import { StateCreator } from 'zustand'
import { AudioSlice, EditorStore } from '../storeTypes'
import { AudioTrackClip, SunoBgmTrack, CustomSfxTrack } from '@/types/scene'
import { INITIAL_SUNO_PRESET_TRACKS } from '@/config/sunoPresetCatalog'
import { INITIAL_SFX_PRESETS } from '@/config/sfxPresetCatalog'
import { pushSnapshot } from './historySlice'
import { realignTrackA1 } from './sceneSlice'

export function loadStoredSunoCatalog(): SunoBgmTrack[] {
  try {
    const raw = localStorage.getItem('xd_short_suno_catalog')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        const presetIds = new Set(INITIAL_SUNO_PRESET_TRACKS.map(p => p.id))
        // Clean up stale placeholder tracks that were pointing to missing /uploads/suno_*.mp3
        const userCustoms = parsed.filter((item: SunoBgmTrack) => 
          !presetIds.has(item.id) && 
          !(item.id.startsWith('suno_') && item.audioUrl?.startsWith('/uploads/suno_'))
        )
        return [...INITIAL_SUNO_PRESET_TRACKS, ...userCustoms]
      }
    }
  } catch (e) {}
  return INITIAL_SUNO_PRESET_TRACKS
}

export function loadStoredSfxCatalog(): CustomSfxTrack[] {
  try {
    const raw = localStorage.getItem('xd_short_sfx_catalog')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        const presetIds = new Set(INITIAL_SFX_PRESETS.map(p => p.id))
        const userCustoms = parsed.filter((item: CustomSfxTrack) => !presetIds.has(item.id))
        return [...INITIAL_SFX_PRESETS, ...userCustoms]
      }
    }
  } catch (e) {}
  return INITIAL_SFX_PRESETS
}

export const createAudioSlice: StateCreator<
  EditorStore,
  [],
  [],
  AudioSlice
> = (set, get) => ({
  selectedAudioClipId: null,
  selectedAudioClipIds: [],
  setSelectedAudioClip: (id) => set({
    selectedAudioClipId: id,
    selectedAudioClipIds: id ? [id] : [],
    selectedElementId: null,
    selectedElementIds: []
  }),
  setSelectedAudioClips: (ids) => set({
    selectedAudioClipId: ids[0] || null,
    selectedAudioClipIds: ids,
    selectedElementId: null,
    selectedElementIds: []
  }),
  toggleSelectAudioClip: (id) => set(s => {
    const exists = s.selectedAudioClipIds.includes(id)
    const newIds = exists
      ? s.selectedAudioClipIds.filter(item => item !== id)
      : [...s.selectedAudioClipIds, id]
    return {
      selectedAudioClipId: newIds[0] || null,
      selectedAudioClipIds: newIds,
      selectedElementId: null,
      selectedElementIds: []
    }
  }),
  uploadedAudio: [],
  addUploadedAudio: (audio) => set(s => ({ uploadedAudio: [audio, ...s.uploadedAudio] })),
  bgMusicUrl: undefined,
  bgMusicVolume: 0.3,

  setBgMusic: (url) => set(s => {
    const hist = pushSnapshot(s, 'Đổi nhạc nền')
    const otherClips = s.audioClips.filter(c => c.trackId !== 'A3' && c.trackId !== 'bgm')
    return {
      ...hist,
      bgMusicUrl: url,
      audioClips: url ? s.audioClips : otherClips,
      isSaved: false
    }
  }),

  setBgMusicVolume: (vol) => set(s => {
    const clampedVol = Math.max(0, Math.min(1, vol))
    const hist = pushSnapshot(s, 'Chỉnh âm lượng nhạc nền', 400)
    // Synchronize volume for any A3 clips
    const updatedClips = s.audioClips.map(c => (c.trackId === 'A3' || c.trackId === 'bgm') ? { ...c, volume: clampedVol } : c)
    return { ...hist, bgMusicVolume: clampedVol, audioClips: updatedClips, isSaved: false }
  }),

  // ── Multi-Clip Audio ──
  audioTrackIds: ['A1', 'A2'],
  addAudioTrack: () => set(s => {
    const nextNum = s.audioTrackIds.length + 1
    return { audioTrackIds: [...s.audioTrackIds, `A${nextNum}`], isSaved: false }
  }),

  removeAudioTrack: (trackId) => set(s => {
    if (s.audioTrackIds.length <= 1) return s
    const hist = pushSnapshot(s, 'Xóa track âm thanh')
    const remainingClips = s.audioClips.filter(c => c.trackId !== trackId)
    const isBgmTrack = trackId === 'A3' || trackId.toLowerCase().includes('bgm')
    const hasRemainingBgm = remainingClips.some(c => (c.trackId === 'A3' || c.trackId === 'bgm') && c.url && !c.isExpired)
    const newBgMusicUrl = (isBgmTrack && !hasRemainingBgm) ? undefined : s.bgMusicUrl

    return {
      ...hist,
      audioTrackIds: s.audioTrackIds.filter(id => id !== trackId),
      audioClips: remainingClips,
      bgMusicUrl: newBgMusicUrl,
      isSaved: false
    }
  }),

  audioClips: [],
  setAudioClips: (clips) => set(s => {
    const hist = pushSnapshot(s, 'Cập nhật âm thanh')
    return { ...hist, audioClips: clips, isSaved: false }
  }),

  addAudioClip: (clipData) => set(s => {
    const clip: AudioTrackClip = { 
      ...clipData, 
      volume: Math.max(0, Math.min(1, clipData.volume ?? 1)),
      id: `clip-${Date.now()}-${Math.floor(Math.random()*1000)}` 
    }
    // Ghi đè thông minh: Nếu là voice clip trên Track A1 có sceneId, loại bỏ clip cũ của cùng cảnh đó
    const otherClips = (clip.trackId === 'A1' && clip.sceneId)
      ? s.audioClips.filter(c => !(c.trackId === 'A1' && (c.sceneId === clip.sceneId || (clip.url && c.url === clip.url))))
      : s.audioClips

    const mergedClips = [...otherClips, clip]
    const alignedClips = realignTrackA1(s.scenes, mergedClips)

    const hist = pushSnapshot(s, 'Thêm âm thanh')
    return { ...hist, audioClips: alignedClips, isSaved: false }
  }),

  realignVoiceoverTrackA1: () => set(s => {
    const aligned = realignTrackA1(s.scenes, s.audioClips)
    return { audioClips: aligned, isSaved: false }
  }),

  removeAudioClip: (id) => set(s => {
    const targetClip = s.audioClips.find(c => c.id === id)
    const hist = pushSnapshot(s, 'Xóa âm thanh')
    const remainingClips = s.audioClips.filter(c => c.id !== id)

    const updatedScenes = targetClip ? s.scenes.map(scene => {
      if ((targetClip.sceneId && scene.id === targetClip.sceneId) || (targetClip.url && scene.voiceoverUrl === targetClip.url)) {
        return { ...scene, voiceoverUrl: undefined }
      }
      return scene
    }) : s.scenes

    // Đồng bộ 2 chiều SSOT: Nếu xóa clip trên Track A3 / BGM mà không còn clip BGM nào khác, tự động dọn sạch bgMusicUrl
    const isBgmClip = targetClip && (targetClip.trackId === 'A3' || targetClip.trackId === 'bgm' || (s.bgMusicUrl && targetClip.url === s.bgMusicUrl))
    const hasRemainingBgm = remainingClips.some(c => (c.trackId === 'A3' || c.trackId === 'bgm') && c.url && !c.isExpired)
    const newBgMusicUrl = (isBgmClip && !hasRemainingBgm) ? undefined : s.bgMusicUrl

    return { 
      ...hist, 
      audioClips: remainingClips, 
      scenes: updatedScenes,
      bgMusicUrl: newBgMusicUrl,
      isSaved: false 
    }
  }),

  duplicateAudioClip: (id) => set(s => {
    const src = s.audioClips.find(c => c.id === id)
    if (!src) return s

    const playDur = src.playDurationSec ?? src.duration
    const rate = src.playbackRate ?? 1.0
    const activeTimelineDur = playDur / rate
    const nextStartSec = Math.round((src.startSec + activeTimelineDur) * 100) / 100

    let clonedClip: AudioTrackClip
    try {
      clonedClip = structuredClone(src)
    } catch {
      clonedClip = { ...src }
    }

    const newClip: AudioTrackClip = {
      ...clonedClip,
      id: `clip-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      startSec: nextStartSec,
    }

    const hist = pushSnapshot(s, 'Nhân bản audio clip')
    return { ...hist, audioClips: [...s.audioClips, newClip], isSaved: false }
  }),

  updateAudioClip: (id, patch) => set(s => {
    const hist = pushSnapshot(s, 'Chỉnh sửa âm thanh', 350)
    return {
      ...hist,
      audioClips: s.audioClips.map(c => c.id === id ? { 
        ...c, 
        ...patch,
        ...(patch.volume !== undefined ? { volume: Math.max(0, Math.min(1, patch.volume)) } : {})
      } : c),
      isSaved: false
    }
  }),

  // ── Master Audio Mixer & Track Routing ──
  masterVolume: 1.0,
  voiceoverVolume: 1.0,
  voiceoverSpeedRate: 1.0,
  voiceoverReverb: 0.0,
  bgmVolume: 0.35,
  sfxVolume: 0.8,
  isMasterMuted: false,
  isVoiceMuted: false,
  isBgmMuted: false,
  isSfxMuted: false,
  soloTrackId: null,
  mutedTrackIds: [],
  soloTrackIds: [],
  lockedTrackIds: [],
  autoDucking: false,
  duckingRatio: 0.25,
  audioMixerOpen: false,

  setMasterVolume: (vol) => set({ masterVolume: Math.max(0, Math.min(1.5, vol)), isSaved: false }),
  setVoiceoverVolume: (vol) => set({ voiceoverVolume: Math.max(0, Math.min(2.0, vol)), isSaved: false }),
  setVoiceoverReverb: (reverb) => set({ voiceoverReverb: Math.max(0, Math.min(1.0, Math.round(reverb * 100) / 100)), isSaved: false }),
  setVoiceoverSpeedRate: (speed) => set(s => {
    const clampedSpeed = Math.max(0.75, Math.min(1.75, Math.round(speed * 100) / 100))
    const hist = pushSnapshot(s, `Chỉnh tốc độ đọc ${clampedSpeed}x`, 300)

    // 1. Update playbackRate & playDurationSec for all Voice clips (A1 or trackId='voice')
    let cumulativeStartSec = 0
    const updatedClips = s.audioClips.map(clip => {
      const isVoice = !clip.trackId || clip.trackId === 'voice' || clip.trackId === 'A1'
      if (!isVoice) return clip

      const newPlayDur = Math.round((clip.duration / clampedSpeed) * 10) / 10
      const updatedClip = {
        ...clip,
        playbackRate: clampedSpeed,
        playDurationSec: newPlayDur,
        startSec: cumulativeStartSec
      }
      cumulativeStartSec += newPlayDur + 0.3 // 0.3s silence buffer
      return updatedClip
    })

    // 2. Adjust scene durations accordingly if scenes have voiceovers
    const updatedScenes = s.scenes.map(scene => {
      if (!scene.voiceoverUrl) return scene
      const matchingClip = updatedClips.find(c => c.url === scene.voiceoverUrl)
      if (matchingClip) {
        const fitSceneDur = Math.max(2.0, Math.round((matchingClip.playDurationSec! + (scene.silenceGapSec || 0.3)) * 10) / 10)
        return {
          ...scene,
          duration: fitSceneDur,
          speedRate: clampedSpeed
        }
      }
      return scene
    })

    return {
      ...hist,
      voiceoverSpeedRate: clampedSpeed,
      audioClips: updatedClips,
      scenes: updatedScenes,
      isSaved: false
    }
  }),

  setBgmVolume: (vol) => set({ bgmVolume: Math.max(0, Math.min(2.0, vol)), isSaved: false }),
  setSfxVolume: (vol) => set({ sfxVolume: Math.max(0, Math.min(2.0, vol)), isSaved: false }),
  
  toggleTrackMute: (trackId) => set(s => {
    const t = trackId.toLowerCase()
    if (t === 'master') return { isMasterMuted: !s.isMasterMuted, isSaved: false }
    
    // Normalize track ID
    let normTrackId = trackId
    if (t === 'voice' || t === 'a1') normTrackId = 'A1'
    else if (t === 'sfx' || t === 'a2') normTrackId = 'A2'
    else if (t === 'bgm' || t === 'a3') normTrackId = 'A3'

    const isCurrentlyMuted = s.mutedTrackIds.includes(normTrackId) || 
      (normTrackId === 'A1' && s.isVoiceMuted) ||
      (normTrackId === 'A2' && s.isSfxMuted) ||
      (normTrackId === 'A3' && s.isBgmMuted)

    const nextMuted = isCurrentlyMuted 
      ? s.mutedTrackIds.filter(id => id !== normTrackId && id !== trackId && id !== t)
      : [...s.mutedTrackIds, normTrackId]

    // Auto-Resolver: If muting this track, automatically remove it from soloTrackIds
    let nextSolo = s.soloTrackIds
    if (!isCurrentlyMuted) {
      nextSolo = s.soloTrackIds.filter(id => id !== normTrackId && id !== trackId && id !== t)
    }
    const legacySolo = nextSolo.length > 0 ? (nextSolo[0] === 'A1' ? 'voice' : nextSolo[0] === 'A3' ? 'bgm' : nextSolo[0] === 'A2' ? 'sfx' : nextSolo[0]) : null

    return {
      mutedTrackIds: nextMuted,
      isVoiceMuted: nextMuted.includes('A1') || nextMuted.includes('voice'),
      isSfxMuted: nextMuted.includes('A2') || nextMuted.includes('sfx'),
      isBgmMuted: nextMuted.includes('A3') || nextMuted.includes('bgm'),
      soloTrackIds: nextSolo,
      soloTrackId: legacySolo,
      isSaved: false
    }
  }),

  toggleTrackSolo: (trackId) => set(s => {
    let normTrackId = trackId
    const t = trackId.toLowerCase()
    if (t === 'voice' || t === 'a1') normTrackId = 'A1'
    else if (t === 'sfx' || t === 'a2') normTrackId = 'A2'
    else if (t === 'bgm' || t === 'a3') normTrackId = 'A3'

    const isCurrentlySoloed = s.soloTrackIds.includes(normTrackId) || s.soloTrackId === normTrackId || s.soloTrackId === t
    const nextSolo = isCurrentlySoloed
      ? s.soloTrackIds.filter(id => id !== normTrackId && id !== trackId && id !== t)
      : [normTrackId]

    const legacySolo = nextSolo.length > 0 ? (nextSolo[0] === 'A1' ? 'voice' : nextSolo[0] === 'A3' ? 'bgm' : nextSolo[0] === 'A2' ? 'sfx' : nextSolo[0]) : null

    // Auto-Resolver: If activating solo on this track, automatically unmute it
    let nextMuted = s.mutedTrackIds
    if (!isCurrentlySoloed) {
      nextMuted = s.mutedTrackIds.filter(id => id !== normTrackId && id !== trackId && id !== t)
    }

    return {
      soloTrackIds: nextSolo,
      soloTrackId: legacySolo,
      mutedTrackIds: nextMuted,
      isVoiceMuted: nextMuted.includes('A1') || nextMuted.includes('voice'),
      isSfxMuted: nextMuted.includes('A2') || nextMuted.includes('sfx'),
      isBgmMuted: nextMuted.includes('A3') || nextMuted.includes('bgm'),
      isSaved: false
    }
  }),

  toggleTrackLock: (trackId) => set(s => {
    const isLocked = s.lockedTrackIds.includes(trackId)
    return {
      lockedTrackIds: isLocked 
        ? s.lockedTrackIds.filter(id => id !== trackId)
        : [...s.lockedTrackIds, trackId],
      isSaved: false
    }
  }),

  isTrackMuted: (trackId: string) => {
    const state = get()
    const t = trackId.toLowerCase()
    if (t === 'voice' || t === 'a1') return state.isVoiceMuted || state.mutedTrackIds.includes('A1') || state.mutedTrackIds.includes('voice')
    if (t === 'sfx' || t === 'a2') return state.isSfxMuted || state.mutedTrackIds.includes('A2') || state.mutedTrackIds.includes('sfx')
    if (t === 'bgm' || t === 'a3') return state.isBgmMuted || state.mutedTrackIds.includes('A3') || state.mutedTrackIds.includes('bgm')
    return state.mutedTrackIds.includes(trackId)
  },

  isTrackSoloed: (trackId: string) => {
    const state = get()
    const t = trackId.toLowerCase()
    if (t === 'voice' || t === 'a1') return state.soloTrackId === 'voice' || state.soloTrackIds.includes('A1') || state.soloTrackIds.includes('voice')
    if (t === 'sfx' || t === 'a2') return state.soloTrackId === 'sfx' || state.soloTrackIds.includes('A2') || state.soloTrackIds.includes('sfx')
    if (t === 'bgm' || t === 'a3') return state.soloTrackId === 'bgm' || state.soloTrackIds.includes('A3') || state.soloTrackIds.includes('bgm')
    return state.soloTrackIds.includes(trackId) || state.soloTrackId === trackId
  },

  isClipSilenced: (clip: AudioTrackClip) => {
    const state = get()
    const rawTrackId = clip.trackId || 'A1'
    const normTrackId = rawTrackId.toLowerCase()
    const isVoice = normTrackId === 'a1' || normTrackId.includes('voice')
    const isSfx = normTrackId === 'a2' || normTrackId.includes('sfx')
    const isBgm = normTrackId === 'a3' || normTrackId.includes('bgm') || normTrackId.includes('music')

    if (state.soloTrackIds.length > 0 || state.soloTrackId) {
      if (isVoice) return !(state.soloTrackId === 'voice' || state.soloTrackIds.includes('A1') || state.soloTrackIds.includes('voice'))
      if (isSfx) return !(state.soloTrackId === 'sfx' || state.soloTrackIds.includes('A2') || state.soloTrackIds.includes('sfx'))
      if (isBgm) return !(state.soloTrackId === 'bgm' || state.soloTrackIds.includes('A3') || state.soloTrackIds.includes('bgm'))
      return !state.soloTrackIds.includes(rawTrackId) && !state.soloTrackIds.includes(normTrackId)
    }

    if (isVoice && (state.isVoiceMuted || state.mutedTrackIds.includes('A1') || state.mutedTrackIds.includes('voice'))) return true
    if (isSfx && (state.isSfxMuted || state.mutedTrackIds.includes('A2') || state.mutedTrackIds.includes('sfx'))) return true
    if (isBgm && (state.isBgmMuted || state.mutedTrackIds.includes('A3') || state.mutedTrackIds.includes('bgm'))) return true
    return state.mutedTrackIds.includes(rawTrackId) || state.mutedTrackIds.includes(normTrackId)
  },

  setAutoDucking: (enabled) => set({ autoDucking: enabled, isSaved: false }),
  setDuckingRatio: (ratio) => set({ duckingRatio: Math.max(0.05, Math.min(0.6, ratio)), isSaved: false }),

  resetAudioMixer: () => set(s => {
    let cumulativeStartSec = 0
    const updatedClips = s.audioClips.map(clip => {
      const isVoice = !clip.trackId || clip.trackId === 'voice' || clip.trackId === 'A1'
      if (!isVoice) return clip
      const newPlayDur = clip.duration
      const updated = {
        ...clip,
        playbackRate: 1.0,
        playDurationSec: newPlayDur,
        startSec: cumulativeStartSec
      }
      cumulativeStartSec += newPlayDur + 0.3
      return updated
    })

    const updatedScenes = s.scenes.map(scene => {
      if (!scene.voiceoverUrl) return scene
      const matchingClip = updatedClips.find(c => c.url === scene.voiceoverUrl)
      if (matchingClip) {
        return {
          ...scene,
          duration: Math.max(2.0, Math.round((matchingClip.duration + (scene.silenceGapSec || 0.3)) * 10) / 10),
          speedRate: 1.0
        }
      }
      return scene
    })

    return {
      masterVolume: 1.0,
      voiceoverVolume: 1.0,
      voiceoverSpeedRate: 1.0,
      voiceoverReverb: 0.0,
      bgmVolume: 0.35,
      sfxVolume: 0.8,
      isMasterMuted: false,
      isVoiceMuted: false,
      isBgmMuted: false,
      isSfxMuted: false,
      soloTrackId: null,
      mutedTrackIds: [],
      soloTrackIds: [],
      lockedTrackIds: [],
      autoDucking: false,
      duckingRatio: 0.25,
      audioClips: updatedClips,
      scenes: updatedScenes,
      isSaved: false
    }
  }),

  setAudioMixerOpen: (open) => set({ audioMixerOpen: open }),

  // ── Suno BGM Catalog ──
  sunoBgmCatalog: loadStoredSunoCatalog(),
  addSunoTrack: (track) => set(s => {
    const updated = [track, ...s.sunoBgmCatalog.filter(t => t.id !== track.id)]
    try { localStorage.setItem('xd_short_suno_catalog', JSON.stringify(updated)) } catch (e) {}
    return { sunoBgmCatalog: updated }
  }),
  addBatchSunoTracks: (tracks) => set(s => {
    const newIds = new Set(tracks.map(t => t.id))
    const updated = [...tracks, ...s.sunoBgmCatalog.filter(t => !newIds.has(t.id))]
    try { localStorage.setItem('xd_short_suno_catalog', JSON.stringify(updated)) } catch (e) {}
    return { sunoBgmCatalog: updated }
  }),
  removeSunoTrack: (id) => set(s => {
    const updated = s.sunoBgmCatalog.filter(t => t.id !== id)
    try { localStorage.setItem('xd_short_suno_catalog', JSON.stringify(updated)) } catch (e) {}
    return { sunoBgmCatalog: updated }
  }),
  updateSunoTrackVibe: (id, vibe) => set(s => {
    const updated = s.sunoBgmCatalog.map(t => t.id === id ? { ...t, vibe } : t)
    try { localStorage.setItem('xd_short_suno_catalog', JSON.stringify(updated)) } catch (e) {}
    return { sunoBgmCatalog: updated }
  }),
  applySunoBgmToTimeline: (track) => set(s => {
    const trackIds = [...s.audioTrackIds]
    if (!trackIds.includes('A3')) {
      if (!trackIds.includes('A2')) trackIds.push('A2')
      trackIds.push('A3')
    }

    const actualDuration = track.duration > 0 ? track.duration : 45
    const otherClips = s.audioClips.filter(c => c.trackId !== 'A3' && c.trackId !== 'bgm')

    const newClip: AudioTrackClip = {
      id: `clip-bgm-${Date.now()}`,
      name: track.title,
      url: track.audioUrl,
      startSec: 0,
      duration: actualDuration,
      playDurationSec: actualDuration,
      trimStartSec: 0,
      volume: 0.35,
      trackId: 'A3'
    }

    const hist = pushSnapshot(s, `Đặt nhạc nền: ${track.title}`)
    return {
      ...hist,
      audioTrackIds: trackIds,
      audioClips: [...otherClips, newClip],
      bgMusicUrl: track.audioUrl,
      bgMusicVolume: 0.35,
      isSaved: false
    }
  }),

  // ── Sound FX Catalog ──
  sfxCatalog: loadStoredSfxCatalog(),
  addSfxTrack: (track) => set(s => {
    const updated = [track, ...s.sfxCatalog.filter(t => t.id !== track.id)]
    try { localStorage.setItem('xd_short_sfx_catalog', JSON.stringify(updated)) } catch (e) {}
    return { sfxCatalog: updated }
  }),
  addBatchSfxTracks: (tracks) => set(s => {
    const newIds = new Set(tracks.map(t => t.id))
    const updated = [...tracks, ...s.sfxCatalog.filter(t => !newIds.has(t.id))]
    try { localStorage.setItem('xd_short_sfx_catalog', JSON.stringify(updated)) } catch (e) {}
    return { sfxCatalog: updated }
  }),
  removeSfxTrack: (id) => set(s => {
    const target = s.sfxCatalog.find(t => t.id === id)
    if (target?.isPreset) return {}
    const updated = s.sfxCatalog.filter(t => t.id !== id)
    try { localStorage.setItem('xd_short_sfx_catalog', JSON.stringify(updated)) } catch (e) {}
    return { sfxCatalog: updated }
  }),
  applySfxToTimeline: (track, startSec) => set(s => {
    const trackIds = [...s.audioTrackIds]
    if (!trackIds.includes('A2')) {
      trackIds.push('A2')
    }

    const insertTime = startSec !== undefined ? startSec : (s.currentTimeSec || 0)
    const dur = track.duration > 0 ? track.duration : 1.5

    const newClip: AudioTrackClip = {
      id: `sfx-${track.id}-${Date.now()}`,
      name: `${track.emoji} ${track.name}`,
      url: track.audioUrl,
      startSec: insertTime,
      duration: dur,
      playDurationSec: dur,
      trimStartSec: 0,
      volume: 0.8,
      trackId: 'A2'
    }

    const hist = pushSnapshot(s, `Thêm SFX: ${track.name}`)
    return {
      ...hist,
      audioTrackIds: trackIds,
      audioClips: [...s.audioClips, newClip],
      isSaved: false
    }
  }),
})
