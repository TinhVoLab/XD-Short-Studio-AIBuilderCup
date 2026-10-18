import { useEditorStore } from '@/store/useEditorStore'
import { Scene, AudioTrackClip } from '@/types/scene'
import { VideoFormat } from '@/types/editor'

export interface ProjectDataSchema {
  version: string
  exportedAt: string
  activeProjectId?: string
  projectName: string
  videoFormat: VideoFormat
  bgMusicUrl?: string
  bgMusicVolume?: number
  audioClips?: AudioTrackClip[]
  storyScript?: string
  scenes: Scene[]
  activeMascotProfileId?: string
  socialCaptions?: any;
}

const LOCAL_STORAGE_KEY = 'xd_short_current_project'
let saveDebounceTimer: NodeJS.Timeout | null = null

export const projectStorageService = {
  /**
   * Tự động lưu dự án vào LocalStorage & IndexedDB (Debounced 2000ms - chống lãng phí I/O ghi đĩa)
   */
  autoSaveToLocalStorage: () => {
    if (saveDebounceTimer) clearTimeout(saveDebounceTimer)

    saveDebounceTimer = setTimeout(() => {
      try {
        const store = useEditorStore.getState()
        const projectData: ProjectDataSchema = {
          version: '1.0.0',
          exportedAt: new Date().toISOString(),
          activeProjectId: store.activeProjectId || 'proj_default',
          projectName: store.projectName,
          videoFormat: store.videoFormat,
          bgMusicUrl: store.bgMusicUrl,
          bgMusicVolume: store.bgMusicVolume,
          audioClips: store.audioClips,
          storyScript: store.storyScript,
          scenes: store.scenes,
          activeMascotProfileId: store.activeMascotProfileId || 'doodle-boy',
          socialCaptions: store.socialCaptions,
        }

        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(projectData))
        localStorage.setItem('xd_short_active_project_id', store.activeProjectId || 'proj_default')
        
        // Đồng bộ lưu trực tiếp vào IndexedDB & Local Server Disk
        store.saveCurrentProject().catch(e => console.warn('IndexedDB sync error:', e))

        // Cập nhật trạng thái isSaved = true
        useEditorStore.setState({ isSaved: true })
      } catch (err) {
        console.warn('Không thể tự động lưu vào LocalStorage:', err)
      }
    }, 2000)
  },

  /**
   * Tải dự án đã lưu từ LocalStorage khi ứng dụng khởi chạy
   */
  loadFromLocalStorage: (): boolean => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (!raw) return false

      const data: ProjectDataSchema = JSON.parse(raw)
      if (!data || !Array.isArray(data.scenes) || data.scenes.length === 0) return false

      const store = useEditorStore.getState()
      if (data.activeProjectId) {
        useEditorStore.setState({ activeProjectId: data.activeProjectId })
      }
      if (data.activeMascotProfileId) {
        store.setActiveMascotProfileId(data.activeMascotProfileId)
      }
      const titleToSet = data.projectName || (data as any).projectTitle || 'Dự án mới'
      store.setProjectName(titleToSet)
      store.setProjectTitle(titleToSet)
      if (data.videoFormat) store.setVideoFormat(data.videoFormat)
      if (data.storyScript) store.setStoryScript(data.storyScript)
      if (data.bgMusicUrl) {
        if (data.bgMusicUrl.startsWith('blob:')) {
          console.warn('[ProjectStorage] Ignored expired BGM blob URL:', data.bgMusicUrl)
        } else {
          store.setBgMusic(data.bgMusicUrl)
        }
      }
      if (typeof data.bgMusicVolume === 'number') store.setBgMusicVolume(data.bgMusicVolume)
      if (Array.isArray(data.audioClips)) {
        const sanitizedClips = data.audioClips.map(clip => {
          if (clip.url && clip.url.startsWith('blob:')) {
            console.warn(`[ProjectStorage] Audio clip "${clip.name}" blob URL expired. Marking as expired.`)
            return { ...clip, url: '', isExpired: true }
          }
          return clip
        })
        useEditorStore.setState({ audioClips: sanitizedClips })
      }

      if (data.socialCaptions) {
        store.setSocialCaptions(data.socialCaptions)
      } else {
        useEditorStore.setState({ socialCaptions: undefined })
      }

      store.setScenes(data.scenes)
      store.setCurrentScene(0)
      store.clearHistory()
      useEditorStore.setState({ isSaved: true })
      return true
    } catch (err) {
      console.warn('Lỗi khi nạp dự án từ LocalStorage:', err)
      return false
    }
  },

  /**
   * Xuất file dự án (.xdshort / JSON) về máy tính
   */
  exportProjectFile: () => {
    const store = useEditorStore.getState()
    const projectData: ProjectDataSchema = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      projectName: store.projectName,
      videoFormat: store.videoFormat,
      bgMusicUrl: store.bgMusicUrl,
      bgMusicVolume: store.bgMusicVolume,
      audioClips: store.audioClips,
      storyScript: store.storyScript,
      scenes: store.scenes,
      activeMascotProfileId: store.activeMascotProfileId || 'doodle-boy',
      socialCaptions: store.socialCaptions,
    }

    const jsonStr = JSON.stringify(projectData, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const filename = `${store.projectName.replace(/[/\\?%*:|"<>]/g, '_') || 'du_an'}.xdshort`
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    store.showToast(`💾 Đã tải file dự án "${filename}" về máy tính!`)
  },

  /**
   * Nhập file dự án (.xdshort / JSON) từ máy tính
   */
  importProjectFile: (file: File) => {
    const store = useEditorStore.getState()
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data: ProjectDataSchema = JSON.parse(content)

        if (!data || !Array.isArray(data.scenes) || data.scenes.length === 0) {
          throw new Error('File dự án không hợp lệ hoặc không có cảnh nào')
        }

        store.setProjectName(data.projectName || 'Dự án đã nạp')
        if (data.videoFormat) store.setVideoFormat(data.videoFormat)
        if (data.storyScript) store.setStoryScript(data.storyScript)
        if (data.activeMascotProfileId) store.setActiveMascotProfileId(data.activeMascotProfileId)
        if (data.bgMusicUrl) {
          if (!data.bgMusicUrl.startsWith('blob:')) {
            store.setBgMusic(data.bgMusicUrl)
          }
        }
        if (typeof data.bgMusicVolume === 'number') store.setBgMusicVolume(data.bgMusicVolume)
        if (Array.isArray(data.audioClips)) {
          const sanitizedClips = data.audioClips.map(clip => {
            if (clip.url && clip.url.startsWith('blob:')) {
              return { ...clip, url: '', isExpired: true }
            }
            return clip
          })
          useEditorStore.setState({ audioClips: sanitizedClips })
        }

        if (data.socialCaptions) {
          store.setSocialCaptions(data.socialCaptions)
        } else {
          useEditorStore.setState({ socialCaptions: undefined })
        }

        store.setScenes(data.scenes)
        store.setCurrentScene(0)
        store.clearHistory()
        useEditorStore.setState({ isSaved: true })

        // Lưu luôn vào LocalStorage
        projectStorageService.autoSaveToLocalStorage()
        store.showToast(`📂 Đã mở thành công dự án "${data.projectName}"!`)
      } catch (err: any) {
        store.showToast('❌ Không thể mở file dự án: ' + (err.message || 'File hỏng'))
      }
    }

    reader.readAsText(file)
  },

  /**
   * Reset về dự án mới
   */
  resetProject: () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY)
    window.location.reload()
  }
}
