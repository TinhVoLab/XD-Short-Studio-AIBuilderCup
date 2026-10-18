import { db, auth } from '@/config/firebase'
import { doc, setDoc, getDoc, collection, getDocs, deleteDoc, query, orderBy } from 'firebase/firestore'
import { ProjectData, ProjectMetadata } from '@/types/project'

/**
 * Deeply removes all `undefined` values from objects and arrays
 * Firestore throws a FirebaseError if any field in the document tree is `undefined`.
 */
export function cleanFirestoreDoc(val: any): any {
  if (val === undefined) return null
  if (val === null || typeof val !== 'object') return val
  if (val instanceof Date) return val

  if (Array.isArray(val)) {
    return val
      .filter((item) => item !== undefined)
      .map((item) => cleanFirestoreDoc(item))
  }

  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(val)) {
    if (value === undefined) continue
    result[key] = cleanFirestoreDoc(value)
  }
  return result
}

/**
 * Cloud Project Sync Service
 * Optimized for $0 Firestore Billing:
 * - Explicit Save: Triggered only via Cmd+S / Cloud Save Button / Pre-render
 * - Document Split: Lightweight metadata in `users/{uid}/projects/{id}`, heavy scenes in `.../data/content` (avoids 1MB document limit)
 * - Safe for 1,000+ active users without runaway write operations
 */
export const cloudProjectService = {
  /**
   * Save current project to Cloud Firestore
   */
  async saveProjectToCloud(projectData: ProjectData): Promise<{ success: boolean; error?: string }> {
    const user = auth.currentUser
    if (!user) {
      return { success: false, error: 'Vui lòng đăng nhập để lưu dự án lên đám mây.' }
    }

    const projectId = projectData.id || 'proj_default'
    const userProjectsRef = doc(db, 'users', user.uid, 'projects', projectId)
    const contentRef = doc(db, 'users', user.uid, 'projects', projectId, 'data', 'content')

    try {
      const now = Date.now()
      const totalDurationSec = projectData.scenes?.reduce((acc, s) => acc + (s.duration || 3), 0) || 0
      const firstScene = projectData.scenes?.[0]

      // 1. Lightweight Metadata (< 1KB, fast list querying)
      const metadata = {
        id: projectId,
        title: projectData.title || 'Dự án chưa đặt tên',
        folderName: projectData.folderName || null,
        createdAt: projectData.createdAt || now,
        updatedAt: now,
        sceneCount: projectData.scenes?.length || 0,
        durationSec: totalDurationSec,
        videoFormat: projectData.videoFormat || 'tiktok',
        firstSceneText: firstScene?.voiceoverText?.slice(0, 100) || firstScene?.name || '',
        firstSceneBg: firstScene?.bgColor || '#080808',
        tags: projectData.tags || [],
        uid: user.uid,
        syncedAt: new Date().toISOString(),
      }

      // 2. Heavy Content Document
      const content = {
        scenes: projectData.scenes || [],
        audioClips: projectData.audioClips || [],
        audioTrackIds: projectData.audioTrackIds || ['A1', 'A2', 'A3'],
        bgMusicUrl: projectData.bgMusicUrl || '',
        bgMusicVolume: projectData.bgMusicVolume ?? 0.35,
        brandingSettings: projectData.brandingSettings || null,
        socialCaptions: projectData.socialCaptions || null,
        masterVolume: projectData.masterVolume ?? 1.0,
        voiceoverVolume: projectData.voiceoverVolume ?? 1.0,
        voiceoverSpeedRate: projectData.voiceoverSpeedRate ?? 1.0,
        voiceoverReverb: projectData.voiceoverReverb ?? 0.0,
        bgmVolume: projectData.bgmVolume ?? 0.35,
        sfxVolume: projectData.sfxVolume ?? 0.8,
        autoDucking: projectData.autoDucking ?? true,
        duckingRatio: projectData.duckingRatio ?? 0.25,
        activeMascotProfileId: projectData.activeMascotProfileId || 'doodle-boy',
        updatedAt: now,
      }

      // Write both documents in parallel
      await Promise.all([
        setDoc(userProjectsRef, cleanFirestoreDoc(metadata), { merge: true }),
        setDoc(contentRef, cleanFirestoreDoc(content), { merge: true }),
      ])

      return { success: true }
    } catch (err: any) {
      console.warn('Cloud save error:', err)
      return { success: false, error: err.message || 'Lỗi khi lưu lên Cloud Firestore' }
    }
  },

  /**
   * Load project from Cloud Firestore
   */
  async loadProjectFromCloud(projectId: string): Promise<ProjectData | null> {
    const user = auth.currentUser
    if (!user) return null

    try {
      const metadataRef = doc(db, 'users', user.uid, 'projects', projectId)
      const contentRef = doc(db, 'users', user.uid, 'projects', projectId, 'data', 'content')

      const [metaSnap, contentSnap] = await Promise.all([
        getDoc(metadataRef),
        getDoc(contentRef),
      ])

      if (!metaSnap.exists()) {
        return null
      }

      const meta = metaSnap.data()
      const content = contentSnap.exists() ? contentSnap.data() : {}

      return {
        id: meta.id || projectId,
        folderName: meta.folderName,
        title: meta.title || 'Dự án từ Cloud',
        createdAt: meta.createdAt || Date.now(),
        updatedAt: meta.updatedAt || Date.now(),
        videoFormat: meta.videoFormat || 'tiktok',
        tags: meta.tags || [],
        scenes: content.scenes || [],
        audioClips: content.audioClips || [],
        audioTrackIds: content.audioTrackIds || ['A1', 'A2', 'A3'],
        bgMusicUrl: content.bgMusicUrl,
        bgMusicVolume: content.bgMusicVolume ?? 0.35,
        brandingSettings: content.brandingSettings || undefined,
        socialCaptions: content.socialCaptions || undefined,
        masterVolume: content.masterVolume ?? 1.0,
        voiceoverVolume: content.voiceoverVolume ?? 1.0,
        voiceoverSpeedRate: content.voiceoverSpeedRate ?? 1.0,
        voiceoverReverb: content.voiceoverReverb ?? 0.0,
        bgmVolume: content.bgmVolume ?? 0.35,
        sfxVolume: content.sfxVolume ?? 0.8,
        autoDucking: content.autoDucking ?? true,
        duckingRatio: content.duckingRatio ?? 0.25,
        activeMascotProfileId: content.activeMascotProfileId || 'doodle-boy',
      }
    } catch (err) {
      console.warn('Cloud load error:', err)
      return null
    }
  },

  /**
   * List projects stored in user's Cloud account
   */
  async listCloudProjects(): Promise<ProjectMetadata[]> {
    const user = auth.currentUser
    if (!user) return []

    try {
      const colRef = collection(db, 'users', user.uid, 'projects')
      const q = query(colRef, orderBy('updatedAt', 'desc'))
      const snap = await getDocs(q)

      return snap.docs.map(d => {
        const data = d.data()
        return {
          id: d.id,
          title: data.title || 'Dự án chưa đặt tên',
          folderName: data.folderName,
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
          sceneCount: data.sceneCount || 0,
          durationSec: data.durationSec || 0,
          videoFormat: data.videoFormat || 'tiktok',
          firstSceneText: data.firstSceneText,
          firstSceneBg: data.firstSceneBg,
          tags: data.tags || [],
        } as ProjectMetadata
      })
    } catch (err) {
      console.warn('List cloud projects error:', err)
      return []
    }
  },

  /**
   * Delete a project from Cloud Firestore
   */
  async deleteProjectFromCloud(projectId: string): Promise<boolean> {
    const user = auth.currentUser
    if (!user) return false

    try {
      const metaRef = doc(db, 'users', user.uid, 'projects', projectId)
      const contentRef = doc(db, 'users', user.uid, 'projects', projectId, 'data', 'content')
      await Promise.all([deleteDoc(metaRef), deleteDoc(contentRef)])
      return true
    } catch (err) {
      console.warn('Delete cloud project error:', err)
      return false
    }
  }
}
