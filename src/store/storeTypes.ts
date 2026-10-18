import { Scene, SceneElement, ElementKeyframe, AudioTrackClip, ProgressBarConfig, ViralEffectsConfig, SunoBgmTrack, SunoVibe, CustomSfxTrack } from '@/types/scene'
import { ActivePanel, InspectorTab, VideoFormat, WorkspaceLayout } from '@/types/editor'
import { HistorySnapshot } from '@/types/history'
import { BrandingSettings } from '@/types/settings'
import { ProjectData, ProjectMetadata } from '@/types/project'
import { AlignmentType, DistributionAxis } from '@/utils/alignment'
import { AuthSlice } from './slices/authSlice'
import { UserPlanTier } from '@/types/auth'

// ── Selected element inspector state ──────────────────
export interface InspectorState {
  textContent: string
  fontFamily: string
  fontWeight: string
  fontSize: number
  textColor: string
  textAlign: 'left' | 'center' | 'right' | 'justify'
  animPreset: string
  animDuration: number
  animDelay: number
  strokeColor: string
  strokeWidth: number
  strokeEnabled: boolean
  shadowEnabled: boolean
  blur: number
  opacity: number
  bgColor: string
}

// ── 1. History Slice (Undo/Redo) ─────────────────────────
export interface HistorySlice {
  past: HistorySnapshot[]
  future: HistorySnapshot[]
  canUndo: boolean
  canRedo: boolean
  lastUndoDescription: string | null
  lastRedoDescription: string | null
  pushHistory: (description?: string) => void
  undo: () => void
  redo: () => void
  clearHistory: () => void
}

// ── 2. Scene Slice ───────────────────────────────────────
export interface SceneSlice {
  scenes: Scene[]
  currentSceneIdx: number
  setCurrentScene: (idx: number) => void
  selectedSceneIdxs: number[]
  setSelectedSceneIdxs: (idxs: number[]) => void
  toggleSelectedSceneIdx: (idx: number) => void
  moveSelectedScenes: (direction: number) => void
  reorderScene: (fromIdx: number, toIdx: number) => void
  reorderSelectedScenesTo: (targetIdx: number, position: 'before' | 'after') => void
  deleteSelectedScenes: () => void
  addScene: () => void
  insertSceneAt: (idx: number, template?: Partial<Scene>, options?: { rippleAudio?: boolean }) => void
  insertScenesBatch: (idx: number, scenesToInsert: Scene[], historyLabel?: string, audioClipsToInsert?: AudioTrackClip[]) => void
  deleteScene: (idx: number) => void
  duplicateScene: (idx: number, insertPosition?: 'before' | 'after') => void
  addHybridScene: (preset: import('@/data/eduCatalog').EduHybridScenePreset, insertAt?: number) => void
  setScenes: (scenes: Scene[]) => void
  updateScene: (id: string, patch: Partial<Scene>) => void
  applyBackgroundToAllScenes: (bgConfig: {
    bgColor?: string;
    bgGradient?: string;
    bgVideoUrl?: string;
    bgVideoLoop?: boolean;
    bgVideoVolume?: number;
    bgPattern?: any;
    bgPatternColor?: string;
    bgPatternOpacity?: number;
    cameraMotion?: any;
    transition?: { type: string; duration: number };
    progressBar?: any;
    viralEffects?: any;
  }) => void
}

// ── 3. Playback Slice ────────────────────────────────────
export interface PlaybackSlice {
  isPlaying: boolean
  isMuted: boolean
  playbackRate: number        // 0.5, 0.75, 1, 1.25, 1.5, 2
  progress: number            // 0–100
  currentTimeSec: number
  setPlaying: (v: boolean) => void
  setMuted: (v: boolean) => void
  setPlaybackRate: (rate: number) => void
  setProgress: (pct: number) => void
  seekToScene: (idx: number) => void
  previewMode: 'edit' | 'render'
  isPipActive: boolean
  setPreviewMode: (m: 'edit' | 'render') => void
  setIsPipActive: (val: boolean) => void
  thumbZoom: number
  setThumbZoom: (z: number) => void
  timelineViewMode: 'tracks' | 'node-flow'
  setTimelineViewMode: (mode: 'tracks' | 'node-flow') => void
}

// ── 4. Element Slice (Canvas, Keyframes, Alignment) ───────
export interface ElementSlice {
  selectedElementId: string | null
  selectedElementIds: string[]
  setSelectedElement: (id: string | null) => void
  setSelectedElements: (ids: string[]) => void
  alignElements: (elementIds: string[], alignment: AlignmentType, context?: 'canvas' | 'selection') => void
  distributeElements: (elementIds: string[], axis: DistributionAxis) => void
  updateElement: (id: string, patch: Partial<SceneElement>) => void
  applyFontToAllScenes: (fontFamily: string) => void
  applyStyleToAllScenes: (targetElementType?: string) => void
  applyBgColorToAllScenes: (bgColor: string, bgGradient?: string) => void
  applyAuthorToAllScenes: (authorName: string, handle?: string) => void
  applyHudHeaderToAllScenes: (hudHeader?: string) => void
  applyAvatarToAllScenes: (avatarUrl: string, position?: 'top-left' | 'top-right' | 'middle-right' | 'bottom-left' | 'bottom-right' | 'custom', left?: number, top?: number, size?: number, effect?: 'none' | 'audio-pulse' | 'neon-spin' | 'float') => void
  applyDisclaimerToAllScenes: (showAiDisclaimer: boolean, aiDisclaimerText?: string) => void
  applyBrandColorToAllScenes: (color: string) => void
  applyThemePaletteToAllScenes: (paletteId: string, options?: { syncBrandAccent?: boolean; syncBgColor?: boolean; syncElements?: boolean }) => void
  applyThemePaletteToScene: (sceneId: string, paletteId: string, options?: { syncBgColor?: boolean }) => void
  applyViralPacingToAllScenes: () => void
  applyProgressBarToAllScenes: (config: ProgressBarConfig) => void
  applyViralEffectsToAllScenes: (config: ViralEffectsConfig) => void
  applyAudioWaveformToAllScenes: (waveformProps?: Partial<SceneElement>) => void
  applyCameraAndTransitionToAllScenes: (cameraMotion?: 'static' | 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right' | 'shake', transition?: { type: string; duration: number }) => void
  addElement: (el: Omit<SceneElement, 'id'>) => void
  removeElement: (id: string) => void
  addKeyframe: (elementId: string, kf: Omit<ElementKeyframe, 'id'>) => void
  removeKeyframe: (elementId: string, kfId: string) => void
  updateKeyframe: (elementId: string, kfId: string, patch: Partial<ElementKeyframe>) => void
  reorderSceneElements: (sceneIdx: number, fromIdx: number, toIdx: number) => void
  autoStaggerSceneElements: (sceneIdx: number, stepSec?: number) => void
  inspector: InspectorState
  setInspector: (patch: Partial<InspectorState>) => void
  safeZonePlatform: 'none' | 'tiktok' | 'shorts' | 'reels'
  setSafeZonePlatform: (p: 'none' | 'tiktok' | 'shorts' | 'reels') => void
  showRulers: boolean
  setShowRulers: (v: boolean) => void
  toggleShowRulers: () => void
}

// ── 5. Audio Slice (Tracks, Clips, BGM, SFX, Suno, M/S) ──
export interface AudioSlice {
  selectedAudioClipId: string | null
  selectedAudioClipIds: string[]
  setSelectedAudioClip: (id: string | null) => void
  setSelectedAudioClips: (ids: string[]) => void
  toggleSelectAudioClip: (id: string) => void
  uploadedAudio: { id: string; url: string; name: string }[]
  addUploadedAudio: (audio: { id: string; url: string; name: string }) => void
  bgMusicUrl?: string
  bgMusicVolume: number
  setBgMusic: (url?: string) => void
  setBgMusicVolume: (vol: number) => void
  audioTrackIds: string[]
  addAudioTrack: () => void
  removeAudioTrack: (trackId: string) => void
  audioClips: AudioTrackClip[]
  setAudioClips: (clips: AudioTrackClip[]) => void
  addAudioClip: (clip: Omit<AudioTrackClip, 'id'>) => void
  removeAudioClip: (id: string) => void
  duplicateAudioClip: (id: string) => void
  updateAudioClip: (id: string, patch: Partial<AudioTrackClip>) => void
  realignVoiceoverTrackA1: () => void

  // Master Audio Mixer & Track Routing
  masterVolume: number
  voiceoverVolume: number
  voiceoverSpeedRate: number
  voiceoverReverb: number
  bgmVolume: number
  sfxVolume: number
  isMasterMuted: boolean
  isVoiceMuted: boolean
  isBgmMuted: boolean
  isSfxMuted: boolean
  soloTrackId: string | null
  mutedTrackIds: string[]
  soloTrackIds: string[]
  lockedTrackIds: string[]
  autoDucking: boolean
  duckingRatio: number
  audioMixerOpen: boolean
  setMasterVolume: (vol: number) => void
  setVoiceoverVolume: (vol: number) => void
  setVoiceoverSpeedRate: (speed: number) => void
  setVoiceoverReverb: (reverb: number) => void
  setBgmVolume: (vol: number) => void
  setSfxVolume: (vol: number) => void
  toggleTrackMute: (trackId: string) => void
  toggleTrackSolo: (trackId: string) => void
  toggleTrackLock: (trackId: string) => void
  isTrackMuted: (trackId: string) => boolean
  isTrackSoloed: (trackId: string) => boolean
  isClipSilenced: (clip: AudioTrackClip) => boolean
  setAutoDucking: (enabled: boolean) => void
  setDuckingRatio: (ratio: number) => void
  resetAudioMixer: () => void
  setAudioMixerOpen: (open: boolean) => void

  // Suno BGM Catalog
  sunoBgmCatalog: SunoBgmTrack[]
  addSunoTrack: (track: SunoBgmTrack) => void
  addBatchSunoTracks: (tracks: SunoBgmTrack[]) => void
  removeSunoTrack: (id: string) => void
  updateSunoTrackVibe: (id: string, vibe: SunoVibe) => void
  applySunoBgmToTimeline: (track: SunoBgmTrack) => void

  // Sound FX Catalog
  sfxCatalog: CustomSfxTrack[]
  addSfxTrack: (track: CustomSfxTrack) => void
  addBatchSfxTracks: (tracks: CustomSfxTrack[]) => void
  removeSfxTrack: (id: string) => void
  applySfxToTimeline: (track: CustomSfxTrack, startSec?: number) => void
}

// ── 6. Project Slice (DB Save/Load, Branding, Captions) ──
export interface ProjectSlice {
  projectName: string
  setProjectName: (name: string) => void
  isSaved: boolean
  activeProjectId: string
  activeProjectFolderName?: string
  activeMascotProfileId?: string
  setActiveMascotProfileId: (id: string) => void
  projectTitle: string
  isSavingProject: boolean
  lastSavedTimestamp: number
  projectsList: ProjectMetadata[]
  projectsModalOpen: boolean
  setProjectTitle: (title: string) => void
  setProjectFolderName: (name: string) => Promise<void>
  setProjectsModalOpen: (open: boolean) => void
  refreshProjectsList: () => Promise<void>
  loadProjectById: (id: string, folderName?: string) => Promise<void>
  createNewProject: (title?: string, scenes?: import('@/types/scene').Scene[]) => Promise<void>
  saveCurrentProject: () => Promise<void>
  cloudSaveStatus: 'idle' | 'saving' | 'saved' | 'error'
  lastCloudSavedTimestamp?: number
  saveCurrentProjectToCloud: () => Promise<boolean>
  loadProjectFromCloudById: (id: string) => Promise<void>
  duplicateProjectById: (id: string) => Promise<void>
  deleteProjectById: (id: string, folderName?: string) => Promise<void>
  exportCurrentProject: () => void
  setProjectTags: (projectId: string, tags: string[]) => Promise<void>
  importProjectData: (data: ProjectData) => Promise<void>
  brandingSettings: BrandingSettings
  socialCaptions?: any
  updateBrandingSettings: (patch: Partial<BrandingSettings>) => void
  resetBrandingSettings: () => void
  setSocialCaptions: (captions: any) => void
}

// ── 7. UI Slice (Panels, Modals, Toasts, Media Upload) ────
export interface UiSlice {
  activePanel: ActivePanel
  setActivePanel: (panel: ActivePanel) => void
  inspectorOpen: boolean
  setInspectorOpen: (open: boolean) => void
  toggleInspector: () => void
  inspectorTab: InspectorTab
  setInspectorTab: (tab: InspectorTab) => void
  videoFormat: VideoFormat
  setVideoFormat: (f: VideoFormat) => void
  canvasZoom: number | 'fit'
  canvasFitScale: number
  setCanvasFitScale: (scale: number) => void
  canvasPan: { x: number; y: number }
  setCanvasZoom: (zoom: number | 'fit') => void
  setCanvasPan: (pan: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void
  resetCanvasView: () => void
  storyScript: string
  setStoryScript: (s: string) => void
  aiCardVisible: boolean
  setAiCardVisible: (v: boolean) => void
  aiWizardOpen: boolean
  setAiWizardOpen: (v: boolean) => void
  wizardInitialTemplateId?: string
  wizardInitialIdea?: string
  openAiWizardWithTemplate: (templateId: string, initialIdea?: string) => void
  settingsModalOpen: boolean
  setSettingsModalOpen: (v: boolean) => void
  mascotStudioOpen: boolean
  setMascotStudioOpen: (v: boolean) => void
  aiDiagramModalOpen: boolean
  setAiDiagramModalOpen: (v: boolean) => void
  appViewMode: 'landing' | 'editor' | 'admin'
  setAppViewMode: (mode: 'landing' | 'editor' | 'admin') => void
  workspaceLayout: WorkspaceLayout
  setWorkspaceLayout: (layout: WorkspaceLayout) => void
  projectsViewMode: 'grid' | 'list'
  setProjectsViewMode: (mode: 'grid' | 'list') => void
  toastMsg: string | null
  toastAction: { label: string; onClick: () => void } | null
  showToast: (msg: string, duration?: number, action?: { label: string; onClick: () => void }) => void
  clearToast: () => void
  uploadedMedia: { id: string; url: string; name: string; type?: 'image' | 'video' | 'audio'; size?: number; duration?: number; filename?: string }[]
  addUploadedMedia: (media: { id: string; url: string; name: string; type?: 'image' | 'video' | 'audio'; size?: number; duration?: number; filename?: string }) => void
  removeUploadedMedia: (id: string, deleteFromServer?: boolean) => void

  // Scene Layer Timing Modal (Quick Inspector)
  layerTimingModalSceneIdx: number | null
  setLayerTimingModalSceneIdx: (idx: number | null) => void

  // Export modal & Background Render Job
  exportModalOpen: boolean
  exportModalMode: 'current' | 'batch'
  setExportModalOpen: (v: boolean, mode?: 'current' | 'batch') => void
  activeRenderJob: {
    jobId: string
    progress: number
    status: 'queued' | 'waiting' | 'bundling' | 'rendering' | 'completed' | 'failed' | 'cancelled'
    stage?: 'queued' | 'waiting' | 'bundling' | 'rendering' | 'encoding' | 'uploading' | 'completed' | 'failed' | 'cancelled'
    queuePosition?: number
    startedAt?: number
    totalFrames?: number
    renderedFrames?: number
    renderFps?: number
    etaSec?: number | null
    downloadUrl?: string
    outputFilename?: string
    error?: string
    renderTimeSec?: number
    fileSize?: number
  } | null
  setActiveRenderJob: (job: UiSlice['activeRenderJob']) => void
  updateActiveRenderJob: (patch: Partial<NonNullable<UiSlice['activeRenderJob']>>) => void

  // Batch Render Queue State
  batchRenderJobs: Array<{
    projectId: string
    title: string
    status: 'pending' | 'queued' | 'rendering' | 'completed' | 'failed'
    progress: number
    downloadUrl?: string
    error?: string
    serverJobId?: string
    outputFilename?: string
  }>
  isBatchProcessing: boolean
  setBatchRenderJobs: (jobs: UiSlice['batchRenderJobs']) => void
  updateBatchRenderJob: (index: number, patch: Partial<UiSlice['batchRenderJobs'][0]>) => void
  setIsBatchProcessing: (v: boolean) => void
}

// ── 8. Plan Slice (Dynamic Subscription Plans & Feature Matrix) ──
export interface PlanSlice {
  plans: import('@/config/planCatalog').DynamicPlanConfig[];
  isLoadingPlans: boolean;
  fetchPlans: () => Promise<void>;
  getPlanByTier: (tier: UserPlanTier) => import('@/config/planCatalog').DynamicPlanConfig;
  isFeatureEnabled: (tier: UserPlanTier, featureKey: keyof import('@/config/planCatalog').DynamicPlanConfig['features']) => boolean;
  getPayableAmount: (tier: UserPlanTier, cycle: 'month' | 'year') => number;
}

// ── Combined Editor Store Interface ────────────────────
export type EditorStore = HistorySlice &
  SceneSlice &
  PlaybackSlice &
  ElementSlice &
  AudioSlice &
  ProjectSlice &
  UiSlice &
  AuthSlice &
  PlanSlice;
