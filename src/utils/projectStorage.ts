import { ProjectData, ProjectMetadata } from "@/types/project";
import { API_BASE } from "@/config/api";

const DB_NAME = "xd_short_studio_db";
const DB_VERSION = 1;
const STORE_NAME = "projects";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not supported"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveProjectToDb(project: ProjectData): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(project);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function loadProjectFromDb(id: string): Promise<ProjectData | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result || null);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function listAllProjectsFromDb(): Promise<ProjectMetadata[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const all: ProjectData[] = request.result || [];
      const metas: ProjectMetadata[] = all.map(p => {
        const dur = (p.scenes || []).reduce((acc, sc) => acc + (sc.duration || 0), 0);
        const firstSc = p.scenes?.[0];
        const firstText = firstSc?.elements?.find(e => e.type === "text")?.content || firstSc?.name || "";
        
        return {
          id: p.id,
          title: p.title || "Dự án chưa đặt tên",
          createdAt: p.createdAt || Date.now(),
          updatedAt: p.updatedAt || Date.now(),
          sceneCount: p.scenes?.length || 0,
          durationSec: dur,
          videoFormat: p.videoFormat || "9:16",
          firstSceneText: firstText,
          firstSceneBg: firstSc?.bgColor || "#0C0E12",
          tags: p.tags || []
        };
      });

      // Sort by last updated descending
      metas.sort((a, b) => b.updatedAt - a.updatedAt);
      resolve(metas);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteProjectFromDb(id: string): Promise<boolean> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

// ── Disk Storage APIs (Sync with Server Folder) ──

export async function saveProjectToDisk(project: ProjectData, customFolderName?: string): Promise<{ folderName: string }> {
  if (!import.meta.env.DEV && !API_BASE) {
    return { folderName: customFolderName || project.folderName || 'project' };
  }
  try {
    const res = await fetch(`${API_BASE}/api/projects/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project, customFolderName })
    });
    if (!res.ok) {
      throw new Error('Lỗi từ server khi lưu dự án');
    }
    const data = await res.json();
    return { folderName: data.folderName };
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[Disk Storage] Failed to save project to server disk:', err);
    }
    return { folderName: customFolderName || project.folderName || 'project' };
  }
}

export async function listProjectsFromDisk(): Promise<ProjectMetadata[]> {
  if (!import.meta.env.DEV && !API_BASE) return [];
  try {
    const res = await fetch(`${API_BASE}/api/projects`);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[Disk Storage] Failed to list projects from server disk:', err);
    }
    return [];
  }
}

export async function loadProjectFromDisk(folderName: string): Promise<ProjectData | null> {
  if (!import.meta.env.DEV && !API_BASE) return null;
  try {
    const res = await fetch(`${API_BASE}/api/projects/${encodeURIComponent(folderName)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[Disk Storage] Failed to load project from server disk:', err);
    }
    return null;
  }
}

export async function renameProjectOnDisk(oldFolderName: string, newFolderName: string): Promise<string | null> {
  if (!import.meta.env.DEV && !API_BASE) return null;
  try {
    const res = await fetch(`${API_BASE}/api/projects/rename`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldFolderName, newFolderName })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.folderName;
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[Disk Storage] Failed to rename project folder:', err);
    }
    return null;
  }
}

export async function deleteProjectFromDisk(folderName: string): Promise<boolean> {
  if (!import.meta.env.DEV && !API_BASE) return false;
  try {
    const res = await fetch(`${API_BASE}/api/projects/${encodeURIComponent(folderName)}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[Disk Storage] Failed to delete project on disk:', err);
    }
    return false;
  }
}

export async function revealProjectInFinder(folderName: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/projects/${encodeURIComponent(folderName)}/reveal`, {
      method: 'POST'
    });
    return res.ok;
  } catch (err) {
    console.warn('[Disk Storage] Failed to reveal project in Finder:', err);
    return false;
  }
}

export async function generateProjectThumbnail(scenes: any[], folderName?: string, frame = 15): Promise<{ downloadUrl: string; filename: string } | null> {
  try {
    const res = await fetch(`${API_BASE}/api/render/thumbnail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenes, folderName, frame, scale: 3 })
    });
    if (!res.ok) throw new Error('Lỗi từ server khi chụp ảnh bìa');
    return await res.json();
  } catch (err) {
    console.warn('[Thumbnail Generator Error]:', err);
    return null;
  }
}

/**
 * Multi-Tier Project Resolver:
 * Waterfall fetching strategy across:
 * 1. IndexedDB client cache
 * 2. Local Disk server (if folderName provided)
 * 3. Firebase Cloud Firestore (if user authenticated)
 */
export async function resolveFullProjectData(id: string, folderName?: string): Promise<ProjectData | null> {
  // 1. Check IndexedDB cache
  try {
    const local = await loadProjectFromDb(id);
    if (local && local.scenes && local.scenes.length > 0) {
      return local;
    }
  } catch (err) {
    console.warn('[ProjectResolver] IndexedDB lookup error:', err);
  }

  // 2. Check Local Disk Storage (via folderName)
  if (folderName) {
    try {
      const disk = await loadProjectFromDisk(folderName);
      if (disk && disk.scenes && disk.scenes.length > 0) {
        // Cache back to IndexedDB
        saveProjectToDb(disk).catch(() => {});
        return disk;
      }
    } catch (err) {
      console.warn('[ProjectResolver] Disk storage lookup error:', err);
    }
  }

  // 3. Check Cloud Firestore
  try {
    const { cloudProjectService } = await import('@/services/cloudProjectService');
    const cloud = await cloudProjectService.loadProjectFromCloud(id);
    if (cloud && cloud.scenes && cloud.scenes.length > 0) {
      // Cache back to IndexedDB
      saveProjectToDb(cloud).catch(() => {});
      return cloud;
    }
  } catch (err) {
    console.warn('[ProjectResolver] Cloud lookup error:', err);
  }

  return null;
}

export function exportProjectToFile(
  project: ProjectData, 
  customExtension: 'xdshort.json' | 'json' | 'xdshort' = 'xdshort.json'
) {
  const cleanTitle = (project.title || "project").replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `${cleanTitle}_${Date.now()}.${customExtension}`;
  const jsonStr = JSON.stringify(project, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importProjectFromFile(file: File): Promise<ProjectData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);
        if (!data || !Array.isArray(data.scenes)) {
          reject(new Error("File dự án không hợp lệ hoặc bị lỗi định dạng"));
          return;
        }

        // Generate fresh ID to prevent collision
        const newProject: ProjectData = {
          ...data,
          id: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          title: `${data.title || "Dự án nhập"} (Nhập)`,
          updatedAt: Date.now()
        };
        resolve(newProject);
      } catch (err: any) {
        reject(new Error("Không thể đọc file: " + err.message));
      }
    };
    reader.onerror = () => reject(new Error("Lỗi khi đọc file từ máy"));
    reader.readAsText(file);
  });
}
