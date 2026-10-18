/**
 * Tự động gán âm thanh hiệu ứng (SFX) chuẩn nhịp điệu đạo diễn.
 * Cảnh có nhịp giữ chân luôn mở bằng âm của nhịp đó, SFX AI chọn xếp sau.
 */
import { isPeakScene } from '../../../../src/config/sceneRoles.js';

const BEAT_SFX = {
  rehook: { type: 'record_scratch', delaySec: 0.02, volume: 0.8 },
  payoff: { type: 'thud', delaySec: 0.05, volume: 0.8 },
};
/** Phong cách thiền / chill: ngắt mạch bằng âm êm thay vì record scratch */
const BEAT_SFX_CALM = {
  rehook: { type: 'chime', delaySec: 0.02, volume: 0.7 },
  payoff: { type: 'bell', delaySec: 0.05, volume: 0.7 },
};
const MAX_SFX_PER_SCENE = 3;

export function resolveSceneSfx(scene, sceneIndex, temporalRole, context = {}) {
  const { beat, isZenOrChill = false } = context;
  const own = Array.isArray(scene.soundEffects) ? scene.soundEffects.filter(s => s && s.type) : [];

  const beatSfx = (isZenOrChill ? BEAT_SFX_CALM : BEAT_SFX)[beat?.kind];
  if (beatSfx) {
    return [beatSfx, ...own.filter(s => s.type !== beatSfx.type)].slice(0, MAX_SFX_PER_SCENE);
  }

  if (own.length > 0) return own;

  if (sceneIndex === 0) {
    return [{ type: 'boom', delaySec: 0.05, volume: 0.85 }];
  }

  if (isPeakScene(temporalRole)) {
    return [
      { type: 'thud', delaySec: 0.05, volume: 0.8 },
      { type: 'ding', delaySec: 0.2, volume: 0.75 },
    ];
  }

  return [{ type: 'pop', delaySec: 0.1, volume: 0.7 }];
}
