/**
 * SCENE POST PROCESSOR (Facade Adapter)
 * 
 * Toàn bộ logic đã được module hoá tại server/services/postProcessor/
 * theo kiến trúc Micro-Pipeline (SRP) và Zero-Deadcode.
 * File này hoạt động như một Facade Adapter đảm bảo tương thích ngược 100%.
 */

export {
  postProcessGeneratedScenes,
  sanitizeBannedWords,
  applyPacingGuard,
  resolveSceneLayoutAndCollisions
} from './postProcessor/index.js';
