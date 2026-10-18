import { StateCreator } from 'zustand'
import { UiSlice, EditorStore } from '../storeTypes'
import { API_BASE } from '@/config/api'

let toastTimeout: ReturnType<typeof setTimeout> | null = null

export const createUiSlice: StateCreator<
  EditorStore,
  [],
  [],
  UiSlice
> = (set, get) => ({
  activePanel: 'ai-story',
  setActivePanel: (panel) => set(s => ({
    activePanel: s.activePanel === panel ? null : panel
  })),

  inspectorOpen: true,
  setInspectorOpen: (open) => set({ inspectorOpen: open }),
  toggleInspector: () => set(s => ({ inspectorOpen: !s.inspectorOpen })),

  inspectorTab: 'design',
  setInspectorTab: (tab) => set({ inspectorTab: tab }),

  videoFormat: 'tiktok',
  setVideoFormat: (f) => set({ videoFormat: f }),

  canvasZoom: 'fit',
  canvasFitScale: 1.0,
  setCanvasFitScale: (scale) => set({ canvasFitScale: scale }),
  canvasPan: { x: 0, y: 0 },
  setCanvasZoom: (zoom) => set(s => ({
    canvasZoom: zoom,
    canvasPan: zoom === 'fit' ? { x: 0, y: 0 } : s.canvasPan
  })),
  setCanvasPan: (pan) => set(s => ({
    canvasPan: typeof pan === 'function' ? pan(s.canvasPan) : pan
  })),
  resetCanvasView: () => set({ canvasZoom: 'fit', canvasPan: { x: 0, y: 0 } }),

  storyScript: '10 mẹo SEO giúp tăng traffic website nhanh chóng',
  setStoryScript: (s) => set({ storyScript: s }),

  aiCardVisible: false,
  setAiCardVisible: (v) => set({ aiCardVisible: v }),

  aiWizardOpen: false,
  // Đóng wizard thì bỏ yêu cầu "mở kèm khung / ý tưởng", để lần mở sau giữ bản nháp người dùng đang soạn
  setAiWizardOpen: (v) => set(v ? { aiWizardOpen: true } : { aiWizardOpen: false, wizardInitialTemplateId: '', wizardInitialIdea: '' }),
  wizardInitialTemplateId: '',
  wizardInitialIdea: '',
  openAiWizardWithTemplate: (templateId, initialIdea) => set({
    aiWizardOpen: true,
    wizardInitialTemplateId: templateId,
    wizardInitialIdea: initialIdea || '',
  }),

  settingsModalOpen: false,
  setSettingsModalOpen: (v) => set({ settingsModalOpen: v }),

  mascotStudioOpen: false,
  setMascotStudioOpen: (v) => set({ mascotStudioOpen: v }),

  aiDiagramModalOpen: false,
  setAiDiagramModalOpen: (v) => set({ aiDiagramModalOpen: v }),

  appViewMode: (typeof localStorage !== 'undefined' ? (localStorage.getItem('xd_short_view_mode') as any) : 'landing') || 'landing',
  setAppViewMode: (mode) => {
    try {
      localStorage.setItem('xd_short_view_mode', mode)
    } catch {}
    set({ appViewMode: mode })
  },

  workspaceLayout: (typeof localStorage !== 'undefined' ? (localStorage.getItem('xd_workspace_layout') as any) : 'classic') || 'classic',
  setWorkspaceLayout: (layout) => {
    try {
      localStorage.setItem('xd_workspace_layout', layout)
    } catch {}
    set({ workspaceLayout: layout })
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('resize'))
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'))
      }, 60)
    }
  },

  projectsViewMode: (typeof localStorage !== 'undefined' ? (localStorage.getItem('xd_projects_view_mode') as any) : 'grid') || 'grid',
  setProjectsViewMode: (mode) => {
    try {
      localStorage.setItem('xd_projects_view_mode', mode)
    } catch {}
    set({ projectsViewMode: mode })
  },

  toastMsg: null,
  toastAction: null,
  showToast: (msg, duration = 2200, action) => {
    if (toastTimeout) clearTimeout(toastTimeout)
    // Design System Failsafe: Remove any emoji characters from toast notification text
    const cleanMsg = typeof msg === 'string'
      ? msg.replace(/[\p{Extended_Pictographic}\u2600-\u27BF]/gu, '').trim()
      : msg
    set({ toastMsg: cleanMsg, toastAction: action || null })
    toastTimeout = setTimeout(() => set({ toastMsg: null, toastAction: null }), duration)
  },
  clearToast: () => {
    if (toastTimeout) clearTimeout(toastTimeout)
    set({ toastMsg: null, toastAction: null })
  },

  uploadedMedia: [],
  addUploadedMedia: (media) => set(s => ({ uploadedMedia: [media, ...s.uploadedMedia] })),
  removeUploadedMedia: (id, deleteFromServer = true) => {
    const item = get().uploadedMedia.find(m => m.id === id)
    if (deleteFromServer && item && item.url && item.url.includes('/uploads/')) {
      try {
        const filename = item.filename || item.url.split('/').pop()
        if (filename) {
          fetch(`${API_BASE}/api/upload/${filename}`, { method: 'DELETE' }).catch((e) => {
            console.warn('[Upload] Failed to delete file on server:', e)
          })
        }
      } catch (e) {
        console.warn('[Upload] Error resolving filename for deletion:', e)
      }
    }
    set(s => ({ uploadedMedia: s.uploadedMedia.filter(m => m.id !== id) }))
  },

  // ── Scene Layer Timing Modal ──
  layerTimingModalSceneIdx: null,
  setLayerTimingModalSceneIdx: (idx) => set({ layerTimingModalSceneIdx: idx }),

  // ── Export & Background Render Job ──
  exportModalOpen: false,
  exportModalMode: 'current',
  setExportModalOpen: (v, mode) => set(s => ({
    exportModalOpen: v,
    exportModalMode: mode || (v ? s.exportModalMode : 'current')
  })),
  activeRenderJob: null,
  setActiveRenderJob: (job) => set({ activeRenderJob: job }),
  updateActiveRenderJob: (patch) => set(s => ({
    activeRenderJob: s.activeRenderJob ? { ...s.activeRenderJob, ...patch } : null
  })),
  batchRenderJobs: [],
  isBatchProcessing: false,
  setBatchRenderJobs: (jobs) => set({ batchRenderJobs: jobs }),
  updateBatchRenderJob: (index, patch) => set(s => {
    const next = [...s.batchRenderJobs]
    if (next[index]) {
      next[index] = { ...next[index], ...patch }
    }
    return { batchRenderJobs: next }
  }),
  setIsBatchProcessing: (v) => set({ isBatchProcessing: v }),
})
