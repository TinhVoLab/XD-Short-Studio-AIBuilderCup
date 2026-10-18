import fs from 'fs';
import path from 'path';
import { projectsStorageDir } from '../config/paths.js';

class ProjectStorageService {
  /**
   * Sanitizes project ID string
   */
  sanitizeProjectId(projectId) {
    if (!projectId || typeof projectId !== 'string') return 'proj_default';
    return projectId.replace(/[^a-zA-Z0-9_-]/g, '_');
  }

  /**
   * Ensures project directory structure exists
   */
  ensureProjectDirs(projectId) {
    const pId = this.sanitizeProjectId(projectId);
    const projectDir = path.join(projectsStorageDir, pId);
    const audioDir = path.join(projectDir, 'audio');
    const exportsDir = path.join(projectDir, 'exports');

    if (!fs.existsSync(projectDir)) fs.mkdirSync(projectDir, { recursive: true });
    if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });
    if (!fs.existsSync(exportsDir)) fs.mkdirSync(exportsDir, { recursive: true });

    return { projectDir, audioDir, exportsDir };
  }

  /**
   * Generates a deterministic scene voice filename (ensures overwriting on regeneration)
   */
  getSceneVoiceFilename(sceneId, ext = 'mp3') {
    const sId = (sceneId || 'temp').toString().replace(/[^a-zA-Z0-9_-]/g, '_');
    const extension = ext.startsWith('.') ? ext : `.${ext}`;
    return `voice_${sId}${extension}`;
  }

  /**
   * Get physical file path for project audio
   */
  getProjectAudioPath(projectId, filename) {
    const { audioDir } = this.ensureProjectDirs(projectId);
    return path.join(audioDir, filename);
  }

  /**
   * Get public HTTP URL for project audio with cache buster
   */
  getProjectAudioUrl(projectId, filename, port = 4000) {
    const pId = this.sanitizeProjectId(projectId);
    return `http://localhost:${port}/storage/projects/${pId}/audio/${filename}?t=${Date.now()}`;
  }

  /**
   * Cleans up orphaned voice files in a project that are no longer part of active scenes
   */
  cleanupOrphanAudio(projectId, activeSceneIds = []) {
    try {
      const { audioDir } = this.ensureProjectDirs(projectId);
      const activeVoiceFiles = new Set(
        activeSceneIds.map(id => this.getSceneVoiceFilename(id))
      );

      const files = fs.readdirSync(audioDir);
      let removedCount = 0;

      for (const file of files) {
        if (file.startsWith('voice_') && file.endsWith('.mp3')) {
          if (!activeVoiceFiles.has(file)) {
            try {
              fs.unlinkSync(path.join(audioDir, file));
              removedCount++;
            } catch (err) {
              console.warn(`[ProjectStorage] Failed to remove orphan file ${file}:`, err.message);
            }
          }
        }
      }
      return { success: true, removedCount };
    } catch (err) {
      console.error('[ProjectStorage] cleanupOrphanAudio error:', err);
      return { success: false, error: err.message };
    }
  }
}

export const projectStorage = new ProjectStorageService();
