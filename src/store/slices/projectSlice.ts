import { StateCreator } from 'zustand'
import { ProjectSlice, EditorStore } from '../storeTypes'
import { BrandingSettings, DEFAULT_BRANDING_SETTINGS } from '@/types/settings'
import { ProjectData } from '@/types/project'
import { Scene } from '@/types/scene'
import { DEFAULT_SCENES, BLANK_SCENE } from '@/utils/scenes'
import {
  saveProjectToDb,
  loadProjectFromDb,
  listAllProjectsFromDb,
  deleteProjectFromDb,
  exportProjectToFile,
  saveProjectToDisk,
  loadProjectFromDisk,
  listProjectsFromDisk,
  renameProjectOnDisk,
  deleteProjectFromDisk
} from '@/utils/projectStorage'
import { cloudProjectService } from '@/services/cloudProjectService'

export function loadStoredBrandingSettings(): BrandingSettings {
  try {
    const raw = localStorage.getItem('xd_short_branding_settings')
    if (!raw) return DEFAULT_BRANDING_SETTINGS
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_BRANDING_SETTINGS, ...parsed }
  } catch {
    return DEFAULT_BRANDING_SETTINGS
  }
}

export const createProjectSlice: StateCreator<
  EditorStore,
  [],
  [],
  ProjectSlice
> = (set, get) => ({
  projectName: 'Dự án mới',
  projectTitle: 'Dự án mới',
  isSaved: true,
  activeProjectId: 'proj_default',
  activeProjectFolderName: undefined,
  activeMascotProfileId: 'doodle-boy',
  isSavingProject: false,
  lastSavedTimestamp: Date.now(),
  cloudSaveStatus: 'idle',
  lastCloudSavedTimestamp: undefined,
  projectsList: [],
  projectsModalOpen: false,
  brandingSettings: loadStoredBrandingSettings(),
  socialCaptions: undefined,

  setActiveMascotProfileId: (id) => set({ activeMascotProfileId: id, isSaved: false }),

  setProjectName: (name) => set({ projectName: name, projectTitle: name }),

  setProjectTitle: (title) => {
    set({ projectTitle: title, projectName: title, isSaved: false })
    get().saveCurrentProject()
  },


  setProjectFolderName: async (newFolderName: string) => {
    const s = get()
    const oldName = s.activeProjectFolderName || s.activeProjectId
    const renamed = await renameProjectOnDisk(oldName, newFolderName)
    if (renamed) {
      set({ activeProjectFolderName: renamed, isSaved: false })
      await get().saveCurrentProject()
      get().showToast(`Đã đổi tên thư mục thành: "${renamed}"`)
    }
  },

  setProjectsModalOpen: (open) => {
    set({ projectsModalOpen: open })
    if (open) {
      get().refreshProjectsList()
    }
  },

  updateBrandingSettings: (patch) => set(s => {
    const updated = { ...s.brandingSettings, ...patch }
    try {
      localStorage.setItem('xd_short_branding_settings', JSON.stringify(updated))
    } catch (err) {
      console.warn('Cannot save branding settings to localStorage:', err)
    }
    return { brandingSettings: updated }
  }),

  setSocialCaptions: (captions) => set({ socialCaptions: captions }),

  resetBrandingSettings: () => set(() => {
    try {
      localStorage.removeItem('xd_short_branding_settings')
    } catch (err) {
      console.warn(err)
    }
    return { brandingSettings: DEFAULT_BRANDING_SETTINGS }
  }),

  refreshProjectsList: async () => {
    try {
      // 1. Master Truth: Fetch from Server Disk Storage
      let diskList = await listProjectsFromDisk()
      
      // 2. Cache: Fetch from IndexedDB
      const localList = await listAllProjectsFromDb()

      // 3. Auto-Migration: Chỉ chạy khi đang ở môi trường Local Dev có ổ đĩa server
      if (import.meta.env.DEV && localList.length > 0) {
        const diskProjectIds = new Set(diskList.map(p => p.id))
        const unmigrated = localList.filter(p => !diskProjectIds.has(p.id))

        if (unmigrated.length > 0) {
          for (const meta of unmigrated) {
            try {
              const fullProj = await loadProjectFromDb(meta.id)
              if (fullProj) {
                const res = await saveProjectToDisk(fullProj, fullProj.folderName)
                if (res?.folderName) {
                  fullProj.folderName = res.folderName
                  await saveProjectToDb(fullProj)
                }
              }
            } catch (migErr) {
              console.warn(`[Auto-Migration] Lỗi chuyển dự án ${meta.title}:`, migErr)
            }
          }
          // Tải lại danh sách ổ đĩa sau khi hoàn tất di trú
          diskList = await listProjectsFromDisk()
        }
      }

      if (diskList.length === 0 && localList.length === 0) {
        const s = get()
        const defaultProj: ProjectData = {
          id: s.activeProjectId || 'proj_default',
          folderName: s.activeProjectFolderName || '10-meo-seo',
          title: s.projectTitle || '10 Mẹo SEO',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          videoFormat: s.videoFormat || 'tiktok',
          scenes: s.scenes,
          audioClips: s.audioClips,
          audioTrackIds: s.audioTrackIds,
          bgMusicUrl: s.bgMusicUrl,
          bgMusicVolume: s.bgMusicVolume,
          brandingSettings: s.brandingSettings,
          activeMascotProfileId: s.activeMascotProfileId || 'doodle-boy',
        }
        await saveProjectToDb(defaultProj)
        if (import.meta.env.DEV) {
          await saveProjectToDisk(defaultProj, defaultProj.folderName)
        }
        set({ projectsList: await listAllProjectsFromDb() })
        return
      }

      // Ưu tiên danh sách trên đĩa, dự phòng local nếu server chưa bật
      const rawList = diskList.length > 0 ? diskList : localList
      // Dedup để bảo đảm tuyệt đối không có 2 dự án trùng ID trong store
      const seen = new Set<string>()
      const uniqueProjects = rawList.map(p => {
        let safeId = p.id
        if (!safeId || seen.has(safeId)) {
          safeId = p.folderName ? `proj_${p.folderName}` : `${safeId}_${Math.random().toString(36).slice(2, 6)}`
        }
        seen.add(safeId)
        return { ...p, id: safeId }
      })
      set({ projectsList: uniqueProjects })
    } catch (e) {
      console.warn('Failed to refresh projects list:', e)
    }
  },

  saveCurrentProject: async () => {
    const s = get()
    set({ isSavingProject: true })
    try {
      const projectData: ProjectData = {
        id: s.activeProjectId || 'proj_default',
        folderName: s.activeProjectFolderName,
        title: s.projectTitle || 'Dự án chưa đặt tên',
        createdAt: s.lastSavedTimestamp || Date.now(),
        updatedAt: Date.now(),
        videoFormat: s.videoFormat || 'tiktok',
        scenes: s.scenes,
        audioClips: s.audioClips,
        audioTrackIds: s.audioTrackIds,
        bgMusicUrl: s.bgMusicUrl,
        bgMusicVolume: s.bgMusicVolume,
        brandingSettings: s.brandingSettings,
        socialCaptions: s.socialCaptions,
        masterVolume: s.masterVolume,
        voiceoverVolume: s.voiceoverVolume,
        voiceoverSpeedRate: s.voiceoverSpeedRate ?? 1.0,
        voiceoverReverb: s.voiceoverReverb ?? 0.0,
        bgmVolume: s.bgmVolume,
        sfxVolume: s.sfxVolume,
        autoDucking: s.autoDucking,
        duckingRatio: s.duckingRatio,
        activeMascotProfileId: s.activeMascotProfileId || 'doodle-boy',
      }

      // 1. Fast client cache (IndexedDB)
      await saveProjectToDb(projectData)

      // 2. Master Truth Disk Storage (Server folder - chỉ áp dụng khi chạy local dev)
      if (import.meta.env.DEV) {
        const diskRes = await saveProjectToDisk(projectData, s.activeProjectFolderName)
        if (diskRes?.folderName && diskRes.folderName !== s.activeProjectFolderName) {
          set({ activeProjectFolderName: diskRes.folderName })
        }
      }

      set({ isSavingProject: false, lastSavedTimestamp: Date.now(), isSaved: true })
    } catch (err) {
      console.warn('Auto-save project error:', err)
      set({ isSavingProject: false })
    }
  },

  saveCurrentProjectToCloud: async () => {
    const s = get()
    set({ cloudSaveStatus: 'saving' })

    const projectData: ProjectData = {
      id: s.activeProjectId || 'proj_default',
      folderName: s.activeProjectFolderName,
      title: s.projectTitle || 'Dự án chưa đặt tên',
      createdAt: s.lastSavedTimestamp || Date.now(),
      updatedAt: Date.now(),
      videoFormat: s.videoFormat || 'tiktok',
      scenes: s.scenes,
      audioClips: s.audioClips,
      audioTrackIds: s.audioTrackIds,
      bgMusicUrl: s.bgMusicUrl,
      bgMusicVolume: s.bgMusicVolume,
      brandingSettings: s.brandingSettings,
      socialCaptions: s.socialCaptions,
      masterVolume: s.masterVolume,
      voiceoverVolume: s.voiceoverVolume,
      voiceoverSpeedRate: s.voiceoverSpeedRate ?? 1.0,
      voiceoverReverb: s.voiceoverReverb ?? 0.0,
      bgmVolume: s.bgmVolume,
      sfxVolume: s.sfxVolume,
      autoDucking: s.autoDucking,
      duckingRatio: s.duckingRatio,
      activeMascotProfileId: s.activeMascotProfileId || 'doodle-boy',
    }

    const result = await cloudProjectService.saveProjectToCloud(projectData)
    if (result.success) {
      set({
        cloudSaveStatus: 'saved',
        lastCloudSavedTimestamp: Date.now(),
      })
      get().showToast('Đã lưu và đồng bộ dự án lên Cloud thành công')
      return true
    } else {
      set({ cloudSaveStatus: 'error' })
      get().showToast(result.error || 'Lỗi lưu dự án lên Cloud')
      return false
    }
  },

  loadProjectFromCloudById: async (id: string) => {
    try {
      get().showToast('Đang tải dự án từ Cloud...')
      const project = await cloudProjectService.loadProjectFromCloud(id)
      if (project) {
        await saveProjectToDb(project)
        await saveProjectToDisk(project, project.folderName)
        await get().loadProjectById(project.id, project.folderName)
        get().showToast(`Đã đồng bộ dự án "${project.title}" từ Cloud`)
      } else {
        get().showToast('Không tìm thấy dự án trên Cloud')
      }
    } catch (err: any) {
      get().showToast(`Lỗi tải từ Cloud: ${err.message || 'Thất bại'}`)
    }
  },

  loadProjectById: async (id: string, folderName?: string) => {
    try {
      const currentActiveId = get().activeProjectId
      if (currentActiveId && currentActiveId !== id) {
        await get().saveCurrentProject()
      }

      // Try reading from disk first (if folderName provided), then IndexedDB
      let project: ProjectData | null = null
      if (folderName) {
        project = await loadProjectFromDisk(folderName)
      }
      if (!project) {
        project = await loadProjectFromDb(id)
      }

      if (project) {
        set({
          activeProjectId: project.id,
          activeProjectFolderName: project.folderName || folderName,
          activeMascotProfileId: project.activeMascotProfileId || 'doodle-boy',
          projectTitle: project.title || 'Dự án',
          projectName: project.title || 'Dự án',
          videoFormat: project.videoFormat || 'tiktok',
          scenes: project.scenes && project.scenes.length > 0 ? project.scenes : [{ ...BLANK_SCENE, id: `scene-${Date.now()}` }],
          audioClips: project.audioClips || [],
          audioTrackIds: project.audioTrackIds || ['A1', 'A2', 'A3'],
          bgMusicUrl: project.bgMusicUrl || undefined,
          bgMusicVolume: project.bgMusicVolume ?? 0.35,
          brandingSettings: project.brandingSettings || DEFAULT_BRANDING_SETTINGS,
          masterVolume: project.masterVolume ?? 1.0,
          voiceoverVolume: project.voiceoverVolume ?? 1.0,
          voiceoverSpeedRate: project.voiceoverSpeedRate ?? 1.0,
          voiceoverReverb: project.voiceoverReverb ?? 0.0,
          bgmVolume: project.bgmVolume ?? 0.35,
          sfxVolume: project.sfxVolume ?? 0.8,
          autoDucking: project.autoDucking ?? true,
          duckingRatio: project.duckingRatio ?? 0.25,
          currentSceneIdx: 0,
          selectedSceneIdxs: [0],
          selectedElementId: null,
          selectedElementIds: [],
          currentTimeSec: 0,
          past: [],
          future: [],
          canUndo: false,
          canRedo: false,
          isSaved: true,
          projectsModalOpen: false
        })

        try {
          localStorage.setItem('xd_short_active_project_id', project.id)
        } catch (e) {}

        get().showToast(`Đã mở dự án: "${project.title}"`)
      } else {
        get().showToast(`Không tìm thấy dữ liệu dự án #${id}`)
      }
    } catch (err: any) {
      get().showToast(`Lỗi khi tải dự án: ${err.message || 'Không tìm thấy'}`)
    }
  },

  createNewProject: async (title = 'Dự án mới', scenes?: Scene[]) => {
    try {
      await get().saveCurrentProject()
      const newId = `proj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      const initialScenes = scenes ?? [{ ...BLANK_SCENE, id: `scene-${Date.now()}` }]
      const newProject: ProjectData = {
        id: newId,
        title,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        videoFormat: 'tiktok',
        scenes: initialScenes,
        audioClips: [],
        audioTrackIds: ['A1', 'A2', 'A3'],
        bgMusicVolume: 0.35,
        brandingSettings: DEFAULT_BRANDING_SETTINGS
      }
      await saveProjectToDb(newProject)
      const diskRes = await saveProjectToDisk(newProject)
      await get().loadProjectById(newId, diskRes?.folderName)
      get().showToast(`Đã tạo dự án mới: "${title}"`)
    } catch (err: any) {
      get().showToast(`Lỗi khi tạo dự án: ${err.message}`)
    }
  },

  duplicateProjectById: async (id: string) => {
    try {
      const source = await loadProjectFromDb(id)
      if (!source) {
        get().showToast('Không tìm thấy dự án gốc để nhân bản')
        return
      }

      const dupId = `proj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      const dupProject: ProjectData = {
        ...JSON.parse(JSON.stringify(source)),
        id: dupId,
        folderName: undefined, // Reset so a fresh folder is generated
        title: `${source.title} (Bản sao)`,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }

      await saveProjectToDb(dupProject)
      await saveProjectToDisk(dupProject)
      await get().refreshProjectsList()
      get().showToast(`Đã nhân bản dự án: "${dupProject.title}"!`)
    } catch (err: any) {
      get().showToast(`Lỗi nhân bản: ${err.message}`)
    }
  },

  deleteProjectById: async (id: string, folderName?: string) => {
    try {
      const s = get()
      await deleteProjectFromDb(id)
      if (folderName) {
        await deleteProjectFromDisk(folderName)
      }
      // Cascading delete on Cloud Firestore as well
      await cloudProjectService.deleteProjectFromCloud(id).catch((e) => {
        console.warn('[Project] Cloud project delete warning:', e)
      })
      await get().refreshProjectsList()
      get().showToast('Đã xóa dự án thành công')

      if (s.activeProjectId === id) {
        const remaining = await listProjectsFromDisk()
        if (remaining.length > 0) {
          await get().loadProjectById(remaining[0].id, remaining[0].folderName)
        } else {
          await get().createNewProject('Dự án mới')
        }
      }
    } catch (err: any) {
      get().showToast(`Lỗi khi xóa dự án: ${err.message}`)
    }
  },

  setProjectTags: async (projectId: string, tags: string[]) => {
    try {
      const p = await loadProjectFromDb(projectId)
      if (p) {
        p.tags = tags
        await saveProjectToDb(p)
        await saveProjectToDisk(p)
        
        // Also update local list so UI reflects immediately
        set(state => ({
          projectsList: state.projectsList.map(item => 
            item.id === projectId ? { ...item, tags } : item
          )
        }))
        get().showToast('Đã cập nhật nhãn dự án')
      }
    } catch (err: any) {
      get().showToast(`Lỗi cập nhật nhãn: ${err.message}`)
    }
  },

  exportCurrentProject: () => {
    const s = get()
    const currentMeta = s.projectsList.find(p => p.id === s.activeProjectId)
    const projectData: ProjectData = {
      id: s.activeProjectId || 'proj_default',
      folderName: s.activeProjectFolderName,
      title: s.projectTitle || 'Dự án chưa đặt tên',
      createdAt: s.lastSavedTimestamp || Date.now(),
      updatedAt: Date.now(),
      videoFormat: s.videoFormat || 'tiktok',
      tags: currentMeta?.tags || [],
      scenes: s.scenes,
      audioClips: s.audioClips,
      audioTrackIds: s.audioTrackIds,
      bgMusicUrl: s.bgMusicUrl,
      bgMusicVolume: s.bgMusicVolume,
      brandingSettings: s.brandingSettings,
      socialCaptions: s.socialCaptions,
      masterVolume: s.masterVolume,
      voiceoverVolume: s.voiceoverVolume,
      voiceoverSpeedRate: s.voiceoverSpeedRate ?? 1.0,
      voiceoverReverb: s.voiceoverReverb ?? 0.0,
      bgmVolume: s.bgmVolume,
      sfxVolume: s.sfxVolume,
      autoDucking: s.autoDucking,
      duckingRatio: s.duckingRatio,
      activeMascotProfileId: s.activeMascotProfileId || 'doodle-boy',
    }
    exportProjectToFile(projectData, 'xdshort.json')
    get().showToast(`Đã tải file dự án: "${projectData.title}.xdshort.json"`)
  },

  importProjectData: async (data: ProjectData) => {
    try {
      await saveProjectToDb(data)
      const diskRes = await saveProjectToDisk(data)
      await get().refreshProjectsList()
      await get().loadProjectById(data.id, diskRes?.folderName)
      get().showToast(`Đã nhập thành công dự án: "${data.title}"`)
    } catch (err: any) {
      get().showToast(`Lỗi khi nhập dự án: ${err.message}`)
    }
  }
})
