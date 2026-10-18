import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { normalizeScriptModel } from '@/config/aiModels'
import { MascotProfile, AutoPoseRule, DEFAULT_AUTO_POSE_RULES, DEFAULT_DOODLE_PROFILE } from '@/types/character'
import {
  DEFAULT_AI_BANNED_WORDS,
  TIKTOK_SAFETY_PRESET,
  AI_CLICHE_PRESET,
} from '@/config/aiBannedWordsConfig'

// Re-export so existing imports from useSettingsStore still work
export { DEFAULT_AI_BANNED_WORDS, TIKTOK_SAFETY_PRESET, AI_CLICHE_PRESET }

interface SettingsStore {
  geminiApiKey: string
  setGeminiApiKey: (key: string) => void
  
  deepseekApiKey: string
  setDeepSeekApiKey: (key: string) => void

  aiEngineMode: 'gemini' | 'hybrid' | 'deepseek'
  setAiEngineMode: (mode: 'gemini' | 'hybrid' | 'deepseek') => void

  /** Model Gemini lấy từ config/aiModels (GEMINI_SCRIPT_MODELS) hoặc một model DeepSeek */
  preferredScriptModel: string
  setPreferredScriptModel: (model: string) => void

  defaultFont: string
  setDefaultFont: (font: string) => void
  
  brandColor: string
  setBrandColor: (color: string) => void

  // ── AI Vocabulary Blacklist & Humanizer ──
  aiBannedWords: string[]
  setAiBannedWords: (words: string[]) => void
  aiHumanizerEnabled: boolean
  setAiHumanizerEnabled: (enabled: boolean) => void

  // ── Global Mascot Library ──
  mascotProfiles: Record<string, MascotProfile>
  activeMascotProfileId: string
  autoPoseRules: AutoPoseRule[]

  setMascotProfile: (profile: MascotProfile) => void
  updateMascotSlot: (profileId: string, poseId: string, url: string) => void
  deleteMascotSlot: (profileId: string, poseId: string) => void
  deleteMascotProfile: (profileId: string) => void
  setActiveMascotProfileId: (id: string) => void
  setAutoPoseRules: (rules: AutoPoseRule[]) => void
  updateAutoPoseRule: (ruleId: string, patch: Partial<AutoPoseRule>) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      geminiApiKey: '',
      setGeminiApiKey: (key) => set({ geminiApiKey: key }),
      
      deepseekApiKey: '',
      setDeepSeekApiKey: (key) => set({ deepseekApiKey: key }),

      aiEngineMode: 'hybrid',
      setAiEngineMode: (mode) => set({ aiEngineMode: mode }),

      preferredScriptModel: 'deepseek-flash',
      setPreferredScriptModel: (model) => set({ preferredScriptModel: normalizeScriptModel(model) }),

      defaultFont: 'Inter',
      setDefaultFont: (font) => set({ defaultFont: font }),
      
      brandColor: '#BEFF01',
      setBrandColor: (color) => set({ brandColor: color }),

      aiBannedWords: DEFAULT_AI_BANNED_WORDS,
      setAiBannedWords: (words) => set({ aiBannedWords: words }),
      aiHumanizerEnabled: true,
      setAiHumanizerEnabled: (enabled) => set({ aiHumanizerEnabled: enabled }),

      mascotProfiles: {
        'doodle-boy': DEFAULT_DOODLE_PROFILE,
      },
      activeMascotProfileId: 'doodle-boy',
      autoPoseRules: DEFAULT_AUTO_POSE_RULES,

      setMascotProfile: (profile) =>
        set((state) => ({
          mascotProfiles: {
            ...state.mascotProfiles,
            [profile.id]: profile,
          },
        })),

      updateMascotSlot: (profileId, poseId, url) =>
        set((state) => {
          const profile = state.mascotProfiles[profileId] || {
            id: profileId,
            name: 'Bộ Nhân Vật Mới',
            slots: {},
          }
          return {
            mascotProfiles: {
              ...state.mascotProfiles,
              [profileId]: {
                ...profile,
                slots: {
                  ...profile.slots,
                  [poseId]: url,
                },
              },
            },
          }
        }),

      deleteMascotSlot: (profileId, poseId) =>
        set((state) => {
          const profile = state.mascotProfiles[profileId]
          if (!profile) return state
          const newSlots = { ...profile.slots }
          delete newSlots[poseId]
          return {
            mascotProfiles: {
              ...state.mascotProfiles,
              [profileId]: {
                ...profile,
                slots: newSlots,
              },
            },
          }
        }),

      deleteMascotProfile: (profileId) =>
        set((state) => {
          if (profileId === 'doodle-boy') return state // Không xóa default
          const newProfiles = { ...state.mascotProfiles }
          delete newProfiles[profileId]
          return {
            mascotProfiles: newProfiles,
            activeMascotProfileId:
              state.activeMascotProfileId === profileId
                ? 'doodle-boy'
                : state.activeMascotProfileId,
          }
        }),

      setActiveMascotProfileId: (id) => set({ activeMascotProfileId: id }),

      setAutoPoseRules: (rules) => set({ autoPoseRules: rules }),

      updateAutoPoseRule: (ruleId, patch) =>
        set((state) => ({
          autoPoseRules: state.autoPoseRules.map((r) =>
            r.id === ruleId ? { ...r, ...patch } : r
          ),
        })),
    }),
    {
      name: 'xds-settings-storage',
      version: 6,
      migrate: (persistedState: any, version: number) => {
        let state = { ...persistedState }
        // v1 → v2: mascot fields were added; keep all existing user settings intact
        if (version < 2) {
          state = {
            ...state,
            mascotProfiles: state.mascotProfiles ?? { 'doodle-boy': DEFAULT_DOODLE_PROFILE },
            activeMascotProfileId: state.activeMascotProfileId ?? 'doodle-boy',
            autoPoseRules: state.autoPoseRules ?? DEFAULT_AUTO_POSE_RULES,
          }
        }
        // v2 → v3: deepseek fields were added
        if (version < 3) {
          state = {
            ...state,
            deepseekApiKey: state.deepseekApiKey ?? '',
            aiEngineMode: state.aiEngineMode ?? 'hybrid',
            preferredScriptModel: state.preferredScriptModel ?? 'deepseek-reasoner',
          }
        }
        // v3 → v4: starter pack for doodle-boy
        if (version < 4) {
          const existingDoodle = state.mascotProfiles?.['doodle-boy'] || DEFAULT_DOODLE_PROFILE
          state = {
            ...state,
            mascotProfiles: {
              ...(state.mascotProfiles || {}),
              'doodle-boy': {
                ...existingDoodle,
                name: existingDoodle.name || DEFAULT_DOODLE_PROFILE.name,
                slots: {
                  ...DEFAULT_DOODLE_PROFILE.slots,
                  ...(existingDoodle.slots || {}),
                }
              }
            }
          }
        }
        // v4 -> v5: deepseek-flash as default script model if empty
        if (version < 5) {
          state = {
            ...state,
            preferredScriptModel: state.preferredScriptModel ?? 'deepseek-flash',
          }
        }
        // v5 -> v6: Gemini đã ngừng (3.7…) → Gemini hiện hành trong config/aiModels
        if (version < 6) {
          state = { ...state, preferredScriptModel: normalizeScriptModel(state.preferredScriptModel) }
        }
        return state
      },
    }
  )
)
