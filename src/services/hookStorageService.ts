import { MasterHookTemplateV2_1, SFXKeyframeMarker, PsychArchetype, VisualStyle } from '@/types/hookLibraryV2';
import { HookSceneTemplate } from '@/types/hookLibrary';
import { INITIAL_SFX_PRESETS } from '@/config/sfxPresetCatalog';

const DB_NAME = 'xds_hook_library_db';
const DB_VERSION = 1;
const STORE_TEMPLATES = 'custom_templates';
const STORE_CACHE = 'ai_hook_cache';

export interface CachedHookResult {
  hashKey: string;
  topic: string;
  style: string;
  variants: any[];
  timestamp: number;
}

// Map SFX marker types to preset audio URLs
export const SFX_TYPE_URL_MAP: Record<string, string> = {
  whoosh: '/sfx/whoosh.wav',
  sub_drop: '/sfx/bass_impact.wav',
  glitch_hit: '/sfx/glitch.wav',
  camera_shutter: '/sfx/camera_shutter.wav',
  pop: '/sfx/pop.wav',
  typewriter: '/sfx/typewriter.wav',
};

// Open IndexedDB safely with Promise
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB is not supported in this environment'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_TEMPLATES)) {
        db.createObjectStore(STORE_TEMPLATES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        db.createObjectStore(STORE_CACHE, { keyPath: 'hashKey' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const hookStorageService = {
  /**
   * Lấy toàn bộ templates tùy chỉnh từ IndexedDB
   */
  async getAll(): Promise<MasterHookTemplateV2_1[]> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_TEMPLATES, 'readonly');
        const store = tx.objectStore(STORE_TEMPLATES);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('[hookStorageService] getAll failed:', err);
      return [];
    }
  },

  /**
   * Lấy 1 template theo ID
   */
  async get(id: string): Promise<MasterHookTemplateV2_1 | undefined> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_TEMPLATES, 'readonly');
        const store = tx.objectStore(STORE_TEMPLATES);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('[hookStorageService] get failed:', err);
      return undefined;
    }
  },

  /**
   * Lưu hoặc cập nhật 1 template vào IndexedDB
   */
  async save(template: MasterHookTemplateV2_1): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_TEMPLATES, 'readwrite');
      const store = tx.objectStore(STORE_TEMPLATES);
      const req = store.put(template);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  /**
   * Lưu nhiều templates cùng lúc
   */
  async saveMany(templates: MasterHookTemplateV2_1[]): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_TEMPLATES, 'readwrite');
      const store = tx.objectStore(STORE_TEMPLATES);
      for (const t of templates) {
        store.put(t);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  /**
   * Xoá template theo ID
   */
  async remove(id: string): Promise<boolean> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_TEMPLATES, 'readwrite');
        const store = tx.objectStore(STORE_TEMPLATES);
        const req = store.delete(id);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('[hookStorageService] remove failed:', err);
      return false;
    }
  },

  /**
   * Đọc kết quả Cache AI
   */
  async getCached(hashKey: string): Promise<any[] | undefined> {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_CACHE, 'readonly');
        const store = tx.objectStore(STORE_CACHE);
        const req = store.get(hashKey);
        req.onsuccess = () => {
          const item: CachedHookResult = req.result;
          if (!item) return resolve(undefined);
          // Hết hạn sau 7 ngày (7 * 24 * 60 * 60 * 1000)
          if (Date.now() - item.timestamp > 604800000) {
            return resolve(undefined);
          }
          resolve(item.variants);
        };
        req.onerror = () => resolve(undefined);
      });
    } catch {
      return undefined;
    }
  },

  /**
   * Ghi kết quả vào Cache AI
   */
  async setCached(hashKey: string, topic: string, style: string, variants: any[]): Promise<void> {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_CACHE, 'readwrite');
      const store = tx.objectStore(STORE_CACHE);
      store.put({
        hashKey,
        topic,
        style,
        variants,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.warn('[hookStorageService] setCached failed:', err);
    }
  },
};

/**
 * Gap 1: Convert Frame-based SFX sequence to Audio Timeline clips
 */
export function buildAudioClipsFromSFXSequence(
  sfxSequence: SFXKeyframeMarker[],
  sceneStartSec: number,
  fps: number = 30
): Array<{ name: string; url: string; startSec: number; duration: number; volume: number; trackId: string }> {
  if (!sfxSequence || sfxSequence.length === 0) return [];

  return sfxSequence.map((marker) => {
    // Tìm URL âm thanh từ map hoặc preset catalog
    const matchedPreset = INITIAL_SFX_PRESETS.find(p => p.id === marker.type || p.id === `sfx_${marker.type}`);
    const audioUrl = matchedPreset?.audioUrl || SFX_TYPE_URL_MAP[marker.type] || '/sfx/whoosh.wav';
    const startSec = sceneStartSec + (marker.frame / fps);

    return {
      name: `[SFX] ${marker.type}`,
      url: audioUrl,
      startSec: Math.max(0, startSec),
      duration: matchedPreset?.duration || 1.5,
      volume: marker.volume ?? 0.8,
      trackId: 'A2',
    };
  });
}

/**
 * Migration Function: Chuyển đổi dữ liệu cũ từ localStorage sang IndexedDB
 * Có cơ chế backup + rollback đảm bảo Zero Data Loss.
 */
export async function migrateV1ToV2_1(): Promise<number> {
  const RAW_KEY = 'xds-hook-library-v1';
  const rawV1 = localStorage.getItem(RAW_KEY);
  if (!rawV1) return 0;

  const backupKey = `${RAW_KEY}_backup_${Date.now()}`;
  localStorage.setItem(backupKey, rawV1);

  try {
    const parsed = JSON.parse(rawV1);
    const oldTemplates: HookSceneTemplate[] = parsed?.state?.customTemplates || [];

    if (oldTemplates.length === 0) {
      localStorage.removeItem(RAW_KEY);
      localStorage.removeItem(backupKey);
      return 0;
    }

    const ARCHETYPE_MAP: Record<string, PsychArchetype> = {
      hazard: 'fomo_warning',
      kinetic: 'curiosity_gap',
      versus: 'versus',
      cyber: 'speed_hack',
      zen: 'tips',
      cta: 'tips',
    };

    const converted: MasterHookTemplateV2_1[] = oldTemplates.map((old) => {
      const vStyle = (old.category || 'kinetic') as VisualStyle;
      const pArchetype = ARCHETYPE_MAP[old.category] || 'curiosity_gap';

      return {
        ...old,
        schemaVersion: 2.1,
        visualStyle: vStyle,
        psychArchetype: pArchetype,
        category: vStyle,
        source: old.createdBy === 'ai' ? 'gemini' : 'user',
        sceneConfig: {
          ...old.sceneConfig,
          sfxSequence: (old.sceneConfig?.sfxProfile || []).map((sfx) => ({
            frame: Math.round((sfx.delaySec || 0.1) * 30),
            type: (sfx.type as any) || 'whoosh',
            volume: sfx.volume || 0.8,
          })),
        },
      };
    });

    await hookStorageService.saveMany(converted);

    // Xoá localStorage chỉ sau khi lưu IndexedDB thành công 100%
    localStorage.removeItem(RAW_KEY);
    localStorage.removeItem(backupKey);
    console.log(`[Migration] Chuyển đổi thành công ${converted.length} templates sang IndexedDB V2.1.`);
    return converted.length;
  } catch (err) {
    console.error('[Migration] Thất bại, dữ liệu gốc vẫn giữ nguyên tại backup:', backupKey, err);
    return 0;
  }
}
