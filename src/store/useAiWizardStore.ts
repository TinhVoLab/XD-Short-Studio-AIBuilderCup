import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { WIZARD_TEMPLATE_PRESETS } from '@/components/AiWizardModal/config/wizardCatalog'
import { MASTER_MIN_TARGET_SEC } from '@/config/videoPlan'

/** Khung mặc định (Master): framework, màu và giọng văn của bản nháp mới */
const DEFAULT_PRESET = WIZARD_TEMPLATE_PRESETS[0]

export interface AiWizardState {
  // ── Draft State (Persisted in sessionStorage) ──
  step: number
  idea: string
  sourceMaterial: string
  showSourceInput: boolean
  viralFramework: string
  targetDuration: number
  style: string
  color: string
  selectedTemplateId: string
  voice: string
  /** Tốc độ đọc Edge-TTS ('+0%', '+10%'…); giọng Gemini tự chọn nhịp */
  speechRate: string
  /** Phụ đề tự động trên video */
  captionsOn: boolean
  scriptModel: string
  deepseekReasoning: string
  generatedScenes: any[]

  // ── Transient Runtime State (In RAM) ──
  isSuggestingStyle: boolean
  isGenerating: boolean
  genProgress: number
  genStatus: string
  isAudioGenerating: boolean
  audioProgress: number
  previewingVoice: string | null

  // ── Actions ──
  setStep: (step: number) => void
  setIdea: (idea: string) => void
  setSourceMaterial: (sourceMaterial: string) => void
  setShowSourceInput: (show: boolean) => void
  setViralFramework: (framework: string) => void
  setTargetDuration: (targetDuration: number) => void
  setStyle: (style: string) => void
  setIsSuggestingStyle: (loading: boolean) => void
  setColor: (color: string) => void
  setSelectedTemplateId: (id: string) => void
  setVoice: (voice: string) => void
  setSpeechRate: (rate: string) => void
  setCaptionsOn: (on: boolean) => void
  setScriptModel: (model: string) => void
  setDeepseekReasoning: (reasoning: string) => void
  setGeneratedScenes: (scenes: any[] | ((prev: any[]) => any[])) => void
  updateSceneVoiceover: (index: number, text: string) => void
  setGenerating: (v: boolean) => void
  setGenProgress: (p: number | ((prev: number) => number)) => void
  setGenStatus: (s: string) => void
  setAudioGenerating: (v: boolean) => void
  setAudioProgress: (p: number | ((prev: number) => number)) => void
  setPreviewingVoice: (v: string | null) => void
  resetDraft: () => void
}

const DEFAULT_STATE = {
  step: 0,
  idea: '',
  sourceMaterial: '',
  showSourceInput: false,
  viralFramework: DEFAULT_PRESET.frameworkId,
  targetDuration: 30,
  style: DEFAULT_PRESET.styleId,
  color: DEFAULT_PRESET.colorId,
  selectedTemplateId: DEFAULT_PRESET.id,
  voice: 'vi-VN-NamMinhNeural',
  speechRate: '+0%',
  captionsOn: true,
  scriptModel: '',
  deepseekReasoning: '',
  generatedScenes: [] as any[],

  isSuggestingStyle: false,
  isGenerating: false,
  genProgress: 0,
  genStatus: '',
  isAudioGenerating: false,
  audioProgress: 0,
  previewingVoice: null as string | null,
}

export const useAiWizardStore = create<AiWizardState>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,

      setStep: (step) => set({ step }),
      setIdea: (idea) => set({ idea }),
      setSourceMaterial: (sourceMaterial) => set({ sourceMaterial }),
      setShowSourceInput: (showSourceInput) => set({ showSourceInput }),
      setViralFramework: (viralFramework) => set({ viralFramework }),
      setTargetDuration: (targetDuration) => set({ targetDuration }),
      setStyle: (style) => set({ style }),
      setIsSuggestingStyle: (isSuggestingStyle) => set({ isSuggestingStyle }),
      setColor: (color) => set({ color }),
      setSelectedTemplateId: (selectedTemplateId) => set({ selectedTemplateId }),
      setVoice: (voice) => set({ voice }),
      setSpeechRate: (speechRate) => set({ speechRate }),
      setCaptionsOn: (captionsOn) => set({ captionsOn }),
      setScriptModel: (scriptModel) => set({ scriptModel }),
      setDeepseekReasoning: (deepseekReasoning) => set({ deepseekReasoning }),

      setGeneratedScenes: (updater) =>
        set((state) => ({
          generatedScenes: typeof updater === 'function' ? updater(state.generatedScenes) : updater,
        })),

      updateSceneVoiceover: (index, text) =>
        set((state) => {
          const updated = [...state.generatedScenes]
          if (updated[index]) {
            updated[index] = { ...updated[index], voiceoverText: text }
          }
          return { generatedScenes: updated }
        }),

      setGenerating: (isGenerating) => set({ isGenerating }),
      setGenProgress: (updater) =>
        set((state) => ({
          genProgress: typeof updater === 'function' ? updater(state.genProgress) : updater,
        })),
      setGenStatus: (genStatus) => set({ genStatus }),

      setAudioGenerating: (isAudioGenerating) => set({ isAudioGenerating }),
      setAudioProgress: (updater) =>
        set((state) => ({
          audioProgress: typeof updater === 'function' ? updater(state.audioProgress) : updater,
        })),

      setPreviewingVoice: (previewingVoice) => set({ previewingVoice }),

      resetDraft: () =>
        set({
          step: 0,
          idea: '',
          sourceMaterial: '',
          showSourceInput: false,
          generatedScenes: [],
          deepseekReasoning: '',
          genProgress: 0,
          genStatus: '',
          audioProgress: 0,
          isGenerating: false,
          isAudioGenerating: false,
          scriptModel: '',
        }),
    }),
    {
      name: 'xd_ai_wizard_draft_v1',
      storage: createJSONStorage(() => sessionStorage),
      // v0 → v1: mặc định cũ là "Tự do sáng tạo" ('auto') → bản nháp chưa đổi khung chuyển sang Master
      version: 1,
      migrate: (persisted: any, version: number) => {
        if (version < 1 && persisted && (!persisted.selectedTemplateId || persisted.selectedTemplateId === 'auto')) {
          return {
            ...persisted,
            selectedTemplateId: DEFAULT_PRESET.id,
            viralFramework: DEFAULT_PRESET.frameworkId,
            color: DEFAULT_PRESET.colorId,
            style: DEFAULT_PRESET.styleId,
            targetDuration: Math.max(Number(persisted.targetDuration) || 0, MASTER_MIN_TARGET_SEC),
          }
        }
        return persisted
      },
      partialize: (state) => ({
        step: state.step,
        idea: state.idea,
        sourceMaterial: state.sourceMaterial,
        showSourceInput: state.showSourceInput,
        viralFramework: state.viralFramework,
        targetDuration: state.targetDuration,
        style: state.style,
        color: state.color,
        selectedTemplateId: state.selectedTemplateId,
        voice: state.voice,
        speechRate: state.speechRate,
        captionsOn: state.captionsOn,
        scriptModel: state.scriptModel,
        deepseekReasoning: state.deepseekReasoning,
        generatedScenes: state.generatedScenes,
      }),
    }
  )
)
