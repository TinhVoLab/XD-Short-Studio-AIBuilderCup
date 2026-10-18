/**
 * SSOT đạo diễn nhịp điệu: chọn camera & transition cho từng cảnh theo năng lượng (energy 0..1),
 * vai trò cảnh và lựa chọn của cảnh trước. Dùng chung cho TypeSafe hydrator (client),
 * cinematicDirector (server) và SceneRenderer (biên độ camera / hiệu ứng mở cảnh).
 * Có seed nên cùng kịch bản luôn ra cùng kết quả, kịch bản khác ra biến thể khác.
 */

import { roleEnergy, isPeakScene, highlightSceneIndex } from './sceneRoles.js';

export { highlightSceneIndex };

/**
 * Nhịp giữ chân (narrative beat) phủ lên vai trò cảnh, không thay thế temporalRole:
 * - rehook: ngắt mạch ở ~40% video để người xem không lướt đi
 * - payoff: trả lời lời hứa (open loop) của hook, ngay trước CTA
 */
export const BEAT_KINDS = ['rehook', 'payoff'];
/** Video ít hơn ngần này cảnh thì không có chỗ cho rehook */
export const MIN_SCENES_FOR_REHOOK = 5;
const ENERGY_BY_BEAT = { rehook: 0.8, payoff: 0.8 };
const ENERGY_CURVE = { hook: 0.9, dip: 0.5, buildTop: 0.7, highlight: 0.95, afterPeak: 0.6, cta: 0.45 };

/** Năng lượng cảnh 0..1: giá trị AI chấm nếu có, không thì mặc định theo vai trò */
export function resolveSceneEnergy(scene) {
  const e = Number(scene?.energy);
  if (Number.isFinite(e)) return Math.max(0, Math.min(1, e));
  const beatEnergy = ENERGY_BY_BEAT[scene?.beat?.kind];
  if (beatEnergy !== undefined && !isPeakScene(scene)) return beatEnergy;
  return roleEnergy(scene?.temporalRole);
}

export const HIGH_ENERGY = 0.72;
export const LOW_ENERGY = 0.45;


/**
 * Kế hoạch nhịp cho video n cảnh: mỗi phần tử { beat?: 'rehook' | 'payoff', energy }.
 * energy là sàn năng lượng theo đường cong hook → hạ nhịp → rehook → leo dốc → highlight → payoff → cta;
 * AI vẫn được chấm energy riêng, giá trị này chỉ dùng khi AI bỏ trống.
 */
export function planNarrativeBeats(n) {
  const count = Math.max(0, Math.floor(Number(n) || 0));
  if (count === 0) return [];
  if (count === 1) return [{ energy: ENERGY_CURVE.hook }];

  const highlightIdx = highlightSceneIndex(count);
  const rehookIdx = count >= MIN_SCENES_FOR_REHOOK ? Math.floor(count * 0.4) : -1;
  const payoffIdx = count >= 3 ? count - 2 : -1;

  return Array.from({ length: count }, (_, i) => {
    if (i === 0) return { energy: ENERGY_CURVE.hook };
    if (i === count - 1) return { energy: ENERGY_CURVE.cta };

    const beat = i === rehookIdx ? 'rehook' : i === payoffIdx ? 'payoff' : undefined;
    let energy;
    if (i === highlightIdx) energy = ENERGY_CURVE.highlight;
    else if (beat) energy = ENERGY_BY_BEAT[beat];
    else if (i < highlightIdx) {
      const span = Math.max(1, highlightIdx - 1);
      energy = ENERGY_CURVE.dip + (ENERGY_CURVE.buildTop - ENERGY_CURVE.dip) * ((i - 1) / span);
    } else energy = ENERGY_CURVE.afterPeak;

    const plan = { energy: Math.round(energy * 100) / 100 };
    if (beat) plan.beat = beat;
    return plan;
  });
}

/**
 * Bóng dáng (silhouette) của cảnh thân — hình khối tổng thể, không phải widget cụ thể.
 * Spec từng bóng dáng (số element tối đa, mô tả cho AI) nằm ở layoutRegistry.SCENE_SILHOUETTES.
 */
export const SILHOUETTE_POOL = ['title-widget', 'full-card', 'split', 'widget-solo', 'statement'];
/** Cảnh ngay sau hook phải có nội dung thật, không được là một câu chữ đơn */
const SILHOUETTES_NOT_AFTER_HOOK = new Set(['statement']);
const STATEMENT_MAX_PER_VIDEO = 1;

/**
 * Kế hoạch bóng dáng cho n cảnh: 'hook' / 'cta' cho hai đầu (layout riêng), cảnh rehook là title-widget
 * (chữ nhịp đã phủ màn hình), highlight là widget-solo (một widget lớn cho cao trào), còn lại xoay có seed:
 * hai cảnh liền kề không trùng, tối đa một cảnh statement mỗi video.
 */
export function planSceneSilhouettes(n, seed = '') {
  const count = Math.max(0, Math.floor(Number(n) || 0));
  if (count === 0) return [];
  if (count === 1) return ['hook'];
  const beats = planNarrativeBeats(count);
  const highlightIdx = highlightSceneIndex(count);
  const out = [];
  let statements = 0;
  for (let i = 0; i < count; i++) {
    if (i === 0) { out.push('hook'); continue; }
    if (i === count - 1) { out.push('cta'); continue; }
    if (beats[i]?.beat === 'rehook') { out.push('title-widget'); continue; }
    if (i === highlightIdx) { out.push('widget-solo'); continue; }
    const prev = out[i - 1];
    const nextFixed = i + 1 === highlightIdx ? 'widget-solo' : beats[i + 1]?.beat === 'rehook' ? 'title-widget' : null;
    let pool = SILHOUETTE_POOL.filter(sil => sil !== prev && sil !== nextFixed);
    if (i === 1) pool = pool.filter(sil => !SILHOUETTES_NOT_AFTER_HOOK.has(sil));
    if (statements >= STATEMENT_MAX_PER_VIDEO) pool = pool.filter(sil => sil !== 'statement');
    if (pool.length === 0) pool = ['full-card'];
    const pick = pool[Math.floor(seededRandom(`${seed}|sil|${i}`) * pool.length)];
    if (pick === 'statement') statements++;
    out.push(pick);
  }
  return out;
}

const CAMERA_POOLS = {
  high: ['zoom-in', 'zoom-out', 'zoom-in'],
  mid: ['pan-left', 'pan-right', 'zoom-in', 'zoom-out'],
  low: ['static', 'pan-left', 'pan-right'],
};

/** Transition được chọn theo năng lượng của cảnh KẾ TIẾP (cú chuyển dẫn vào cảnh đó) */
const TRANSITION_POOLS = {
  high: ['glitch', 'zoom-blur', 'whip-pan'],
  mid: ['slide', 'whip-pan', 'wipe', 'blur'],
  low: ['crossfade', 'blur', 'slide-up'],
};

const TRANSITION_SEC = { high: 0.35, mid: 0.45, low: 0.6 };

const tier = (energy) => (energy >= HIGH_ENERGY ? 'high' : energy <= LOW_ENERGY ? 'low' : 'mid');

/** Hash chuỗi → số nguyên 32-bit (FNV-1a), rồi mulberry32 → [0, 1) */
export function seededRandom(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let t = (h + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function pick(pool, avoid, seed) {
  const candidates = pool.filter((x) => x !== avoid);
  const list = candidates.length > 0 ? candidates : pool;
  return list[Math.floor(seededRandom(seed) * list.length)];
}

/**
 * Chọn camera & transition cho toàn bộ chuỗi cảnh.
 * scenes: [{ temporalRole, energy?, voiceoverText? }]
 * Trả về mảng cùng độ dài: { cameraMotion, transition: { type, duration } }
 */
export function planCinematics(scenes, seedPrefix = '') {
  const plans = [];
  let prevCamera;
  let prevTransition;

  scenes.forEach((scene, i) => {
    const energy = resolveSceneEnergy(scene);
    const seed = `${seedPrefix}|${i}|${scene?.voiceoverText || ''}`;

    const cameraMotion = scene?.temporalRole === 'hook'
      ? 'zoom-in'
      : pick(CAMERA_POOLS[tier(energy)], prevCamera, `${seed}|cam`);

    let transition = { type: 'none', duration: 0 };
    if (i < scenes.length - 1) {
      const nextTier = tier(resolveSceneEnergy(scenes[i + 1]));
      const type = pick(TRANSITION_POOLS[nextTier], prevTransition, `${seed}|tr`);
      transition = { type, duration: TRANSITION_SEC[nextTier] };
      prevTransition = type;
    }

    prevCamera = cameraMotion;
    plans.push({ cameraMotion, transition });
  });

  return plans;
}
