import { create } from 'zustand';
import { MasterHookTemplateV2_1, VisualStyle, PsychArchetype, SFXKeyframeMarker } from '@/types/hookLibraryV2';
import { HookSceneTemplate } from '@/types/hookLibrary';
import { BUILTIN_HOOK_TEMPLATES } from '@/config/hookLibraryCatalog';
import { useEditorStore } from './useEditorStore';
import { Scene, SceneElement } from '@/types/scene';
import { hookStorageService, migrateV1ToV2_1, buildAudioClipsFromSFXSequence } from '@/services/hookStorageService';
import { resolveThemePalette } from '@/utils/themeResolver';
import { resolveTemplatePaletteId, isLegacySceneBg } from '@/utils/templatePaletteMapper';
import { getSceneTransition } from '@/utils/sceneTiming';
import { DEFAULT_TRANSITION_SEC } from '@/config/pacingConfig';

export interface HookLibraryState {
  customTemplates: MasterHookTemplateV2_1[];
  selectedCategory: string; // VisualStyle or 'all'
  selectedArchetype: string; // PsychArchetype or 'all'
  searchQuery: string;
  selectedTemplateId: string | null;
  isClientMode: boolean; // Owner Mode (false) vs Client Lock Mode (true)
  isLoadingStorage: boolean;

  // Selectors & Computed
  getAllTemplates: () => MasterHookTemplateV2_1[];
  
  // Storage Actions
  initStorage: () => Promise<void>;
  addTemplate: (template: Omit<MasterHookTemplateV2_1, 'id' | 'createdAt' | 'isBuiltIn' | 'isLocked' | 'schemaVersion'>) => Promise<string>;
  removeTemplate: (id: string) => Promise<boolean>;
  duplicateTemplate: (id: string) => Promise<string | null>;
  updateTemplate: (id: string, updates: Partial<MasterHookTemplateV2_1>) => Promise<void>;
  
  // UI Actions
  setSelectedCategory: (category: string) => void;
  setSelectedArchetype: (archetype: string) => void;
  setSearchQuery: (query: string) => void;
  selectTemplate: (id: string | null) => void;
  insertIntoProject: (templateId: string, targetSceneIdx?: number) => void;
  toggleClientMode: () => void;
  setClientMode: (val: boolean) => void;
  saveSceneAsTemplate: (scene: Scene, name: string, visualStyle?: VisualStyle, psychArchetype?: PsychArchetype, thumbnailUrl?: string) => Promise<string>;
}

// Convert built-in templates to V2.1 schema format
const BUILTIN_TEMPLATES_V2: MasterHookTemplateV2_1[] = BUILTIN_HOOK_TEMPLATES.map((b) => {
  const vStyle = (b.category || 'kinetic') as VisualStyle;
  const pArchetype = (b.hookData?.archetype as PsychArchetype) || (vStyle === 'hazard' ? 'fomo_warning' : 'curiosity_gap');
  return {
    ...b,
    schemaVersion: 2.1,
    visualStyle: vStyle,
    psychArchetype: pArchetype,
    category: vStyle,
    source: 'system',
    sceneConfig: {
      ...b.sceneConfig,
      sfxSequence: (b.sceneConfig.sfxProfile || []).map((sfx) => ({
        frame: Math.round((sfx.delaySec || 0.1) * 30),
        type: (sfx.type as any) || 'whoosh',
        volume: sfx.volume || 0.8,
      })),
    },
  };
});

export const useHookLibraryStore = create<HookLibraryState>((set, get) => ({
  customTemplates: [],
  selectedCategory: 'all',
  selectedArchetype: 'all',
  searchQuery: '',
  selectedTemplateId: null,
  isClientMode: false,
  isLoadingStorage: true,

  toggleClientMode: () => set((s) => ({ isClientMode: !s.isClientMode })),
  setClientMode: (val: boolean) => set({ isClientMode: val }),

  initStorage: async () => {
    try {
      // 1. Chạy migration từ localStorage cũ (nếu có)
      await migrateV1ToV2_1();

      // 2. Tải toàn bộ templates từ IndexedDB
      const loaded = await hookStorageService.getAll();
      set({ customTemplates: loaded, isLoadingStorage: false });
    } catch (err) {
      console.warn('[useHookLibraryStore] initStorage error:', err);
      set({ isLoadingStorage: false });
    }
  },

  getAllTemplates: () => {
    const { customTemplates } = get();
    return [...BUILTIN_TEMPLATES_V2, ...customTemplates];
  },

  saveSceneAsTemplate: async (
    scene: Scene,
    name: string,
    visualStyle: VisualStyle = 'kinetic',
    psychArchetype: PsychArchetype = 'curiosity_gap',
    thumbnailUrl?: string
  ) => {
    const hookEl = scene.elements?.find((e) => e.type === 'master-hook');
    if (!hookEl || !hookEl.hookData) {
      throw new Error('Cảnh này không có Master Hook element để lưu thành template!');
    }

    const templateData: Omit<MasterHookTemplateV2_1, 'id' | 'createdAt' | 'isBuiltIn' | 'isLocked' | 'schemaVersion'> = {
      name: name || scene.name || 'Custom Hook Scene',
      description: scene.description || 'Mẫu cảnh Hook 3-5s tuỳ chỉnh',
      visualStyle,
      psychArchetype,
      category: visualStyle,
      tags: ['custom', hookEl.hookData.layoutStyle || visualStyle],
      source: 'user',
      thumbnailUrl,
      thumbnailFormat: thumbnailUrl ? 'webp' : undefined,
      sceneConfig: {
        duration: scene.duration || 4,
        bgColor: scene.bgColor || '#09090b',
        bgPattern: scene.bgPattern || 'none',
        cameraMotion: scene.cameraMotion || 'zoom-in',
        transitionOut: (getSceneTransition(scene)?.type || 'glitch') as any,
        kineticBgWord: scene.kineticBgWord,
        sfxSequence: [
          { frame: 0, type: 'whoosh', volume: 0.8 },
          { frame: 15, type: 'pop', volume: 0.85 },
        ],
      },
      hookData: { ...hookEl.hookData },
      editableSlots: {
        heroTitle: hookEl.hookData.heroTitle,
        heroLine2: hookEl.hookData.heroLine2,
        badgeText: hookEl.hookData.badgeText,
        subText: hookEl.hookData.subText,
        accentColor: hookEl.hookData.accentColor || hookEl.accentColor,
        highlightWords: hookEl.hookData.highlightWords,
        scriptWords: hookEl.hookData.scriptWords,
        statValue: hookEl.hookData.statValue,
        statLabel: hookEl.hookData.statLabel,
        versusLeft: hookEl.hookData.versusLeft,
        versusRight: hookEl.hookData.versusRight,
      },
      createdBy: 'user',
    };

    return await get().addTemplate(templateData);
  },

  addTemplate: async (templateData) => {
    const { customTemplates } = get();
    const newId = `hook-custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    
    const newTemplate: MasterHookTemplateV2_1 = {
      ...templateData,
      id: newId,
      schemaVersion: 2.1,
      isBuiltIn: false,
      isLocked: false,
      createdAt: Date.now(),
      createdBy: templateData.createdBy || 'user',
      source: templateData.source || 'user',
    };

    // 1. Lưu vào IndexedDB bất đồng bộ (Zero UI blocking)
    await hookStorageService.save(newTemplate);

    // 2. Cập nhật state UI
    set({
      customTemplates: [newTemplate, ...customTemplates],
      selectedTemplateId: newId,
    });

    return newId;
  },

  removeTemplate: async (id: string) => {
    const { customTemplates } = get();
    
    if (BUILTIN_TEMPLATES_V2.some((t) => t.id === id)) {
      return false;
    }

    const template = customTemplates.find((t) => t.id === id);
    if (template?.isLocked) {
      return false;
    }

    // 1. Xoá khỏi IndexedDB
    await hookStorageService.remove(id);

    // 2. Cập nhật state UI
    set({
      customTemplates: customTemplates.filter((t) => t.id !== id),
      selectedTemplateId: get().selectedTemplateId === id ? null : get().selectedTemplateId,
    });

    return true;
  },

  duplicateTemplate: async (id: string) => {
    const all = get().getAllTemplates();
    const source = all.find((t) => t.id === id);
    if (!source) return null;

    const { customTemplates } = get();
    const newId = `hook-custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    
    const duplicated: MasterHookTemplateV2_1 = {
      ...JSON.parse(JSON.stringify(source)),
      id: newId,
      name: `${source.name} (Bản sao)`,
      isBuiltIn: false,
      isLocked: false,
      createdAt: Date.now(),
      createdBy: 'user',
      source: 'user',
    };

    await hookStorageService.save(duplicated);

    set({
      customTemplates: [duplicated, ...customTemplates],
      selectedTemplateId: newId,
    });

    return newId;
  },

  updateTemplate: async (id: string, updates: Partial<MasterHookTemplateV2_1>) => {
    const { customTemplates } = get();
    const target = customTemplates.find(t => t.id === id);
    if (!target) return;

    const updatedTemplate: MasterHookTemplateV2_1 = {
      ...target,
      ...updates,
      id: target.id,
      schemaVersion: 2.1,
      isBuiltIn: false,
      createdAt: target.createdAt,
    };

    await hookStorageService.save(updatedTemplate);

    set({
      customTemplates: customTemplates.map((t) => (t.id === id ? updatedTemplate : t)),
    });
  },

  setSelectedCategory: (category: string) => set({ selectedCategory: category }),
  setSelectedArchetype: (archetype: string) => set({ selectedArchetype: archetype }),
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  selectTemplate: (id: string | null) => set({ selectedTemplateId: id }),

  insertIntoProject: (templateId: string, targetSceneIdx?: number) => {
    const all = get().getAllTemplates();
    const template = all.find((t) => t.id === templateId);
    if (!template) return;

    const editorState = useEditorStore.getState();
    const scenes = editorState.scenes || [];
    const currentIdx = editorState.currentSceneIdx ?? 0;
    const insertIdx = targetSceneIdx ?? currentIdx;

    // 1. Build master-hook SceneElement
    const masterHookElement: SceneElement = {
      id: `el-hook-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'master-hook',
      left: 180,
      top: 80,
      width: 336,
      height: 240,
      scaleX: 1,
      scaleY: 1,
      angle: 0,
      opacity: 1,
      accentColor: template.hookData.accentColor || '#BEFF01',
      animPreset: (template.hookData.wordAnimation === 'elastic-slide' ? 'slide-up' : 'zoom-in') as any,
      animDuration: 0.6,
      animDelay: 0.05,
      content: template.hookData.heroTitle,
      hookData: {
        ...template.hookData,
      },
    };

    // 2. Determine target palette from current scene or hook accent
    const curScene = scenes[insertIdx] || scenes[0];
    const targetPaletteId = curScene?.paletteId || resolveTemplatePaletteId(template.hookData.accentColor);
    const targetPalette = resolveThemePalette(targetPaletteId);

    // 2b. Build complete Scene with baked configuration
    const newScenePayload: Partial<Scene> = {
      name: `🪝 ${template.name}`,
      description: template.description || 'Hook 3-5s mở đầu video',
      duration: template.sceneConfig.duration || 4,
      paletteId: targetPalette.id,
      bgColor: isLegacySceneBg(template.sceneConfig.bgColor) ? targetPalette.tokens.bg : template.sceneConfig.bgColor,
      bgPattern: template.sceneConfig.bgPattern || 'none',
      cameraMotion: (template.sceneConfig.cameraMotion || 'zoom-in') as any,
      // Template lưu kiểu chuyển cảnh trong sceneConfig.transitionOut; cảnh dùng scene.transition (SSOT)
      transition: (template.sceneConfig.transitionOut || 'glitch') === 'none'
        ? { type: 'none', duration: 0 }
        : { type: template.sceneConfig.transitionOut || 'glitch', duration: DEFAULT_TRANSITION_SEC },
      kineticBgWord: template.sceneConfig.kineticBgWord,
      temporalRole: 'hook',
      elements: [{ ...masterHookElement, paletteId: targetPalette.id }],
    };

    // 3. Insert into timeline
    editorState.insertSceneAt(insertIdx, newScenePayload);

    // 4. Gap 1: Frame-accurate Multi-layer SFX Synchronization on Track A2
    try {
      let startSec = 0;
      for (let i = 0; i < insertIdx && i < scenes.length; i++) {
        startSec += scenes[i]?.duration || 0;
      }

      const sfxSequence = template.sceneConfig.sfxSequence || [];
      const sfxClips = buildAudioClipsFromSFXSequence(sfxSequence, startSec, 30);

      if (editorState.addAudioClip && sfxClips.length > 0) {
        for (const clip of sfxClips) {
          editorState.addAudioClip(clip);
        }
      }
    } catch (err) {
      console.warn('[HookLibrary] Could not attach SFX sequence to audio timeline:', err);
    }
  },
}));

// Tự động khởi tạo IndexedDB và Migration khi import store
if (typeof window !== 'undefined') {
  useHookLibraryStore.getState().initStorage();
}
