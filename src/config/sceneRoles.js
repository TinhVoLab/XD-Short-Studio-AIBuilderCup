/**
 * SSOT vai trò cảnh (temporalRole): nhãn, thời lượng, số từ, năng lượng và cách suy vai theo vị trí.
 * Dùng chung client (Filmstrip, Inspector, NodeFlow, hydrator) và server (postProcessor, TTS, SFX).
 *
 * 6 vai của hệ thống cảnh Master: hook → bridge → content → retention → climax → cta.
 * Hai giá trị cũ vẫn hợp lệ để dự án đã làm không đổi hình/tiếng:
 *   - normal    = content
 *   - highlight = content "điểm nhấn" (cảnh ~60% video: chớp sáng, nền mesh, giọng chậm) — xem isPeakScene
 */
import { DURATION_BOUNDS, estimateSceneDurationSec, fitSceneDurationToAudio, DEFAULT_TRANSITION_SEC } from './pacingConfig.js';

export const SCENE_ROLE_IDS = ['hook', 'bridge', 'content', 'retention', 'climax', 'cta'];
export const LEGACY_SCENE_ROLE_IDS = ['normal', 'highlight'];

/**
 * duration.min = sàn cứng (cảnh không bao giờ ngắn hơn, kể cả khi lời thoại ngắn);
 * duration.target = khi cảnh chưa có lời thoại; duration.max = trần cho kịch bản AI (không cắt giọng đọc).
 * shortLabel = nhãn badge (filmstrip, NodeFlow); label = tên đầy đủ (Inspector, wizard).
 * maxWords = mục tiêu số từ lời thoại khi AI viết / pacing guard rút gọn.
 */
export const SCENE_ROLES = {
  hook: {
    shortLabel: 'Mở đầu',
    label: 'Mở đầu',
    hint: 'Giữ người xem trong 3 giây đầu',
    energy: 0.9,
    duration: { min: 2.2, target: 3.0, max: 4.2 },
    maxWords: 12,
  },
  bridge: {
    shortLabel: 'Cầu nối',
    label: 'Cầu nối',
    hint: 'Nối hook vào nội dung, cho lý do xem tiếp',
    energy: 0.6,
    duration: { min: 3.0, target: 3.5, max: 4.0 },
    maxWords: 12,
  },
  content: {
    shortLabel: 'Nội dung',
    label: 'Nội dung',
    hint: 'Mỗi cảnh một ý chính',
    energy: 0.55,
    duration: { min: DURATION_BOUNDS.MIN_SEC, target: 5.0, max: DURATION_BOUNDS.MAX_SEC },
    maxWords: 22,
  },
  retention: {
    shortLabel: 'Giữ chân',
    label: 'Giữ chân',
    hint: 'Ngắt nhịp ở khoảng 40% video để người xem không lướt đi',
    energy: 0.8,
    duration: { min: DURATION_BOUNDS.ABSOLUTE_AUDIO_MIN_SEC, target: 2.5, max: 3.0 },
    maxWords: 12,
  },
  climax: {
    shortLabel: 'Cao trào',
    label: 'Cao trào',
    hint: 'Trả lời lời hứa của hook, để lại một điều mang theo được',
    energy: 0.85,
    duration: { min: 4.0, target: 5.0, max: 6.0 },
    maxWords: 16,
  },
  cta: {
    shortLabel: 'Kết thúc',
    label: 'Kêu gọi hành động',
    hint: 'Đúng một hành động',
    energy: 0.4,
    duration: { min: 2.0, target: 3.0, max: 3.8 },
    maxWords: 10,
  },
};

/** Giá trị cũ: cùng thông số với content, riêng highlight có nhãn và năng lượng của cảnh điểm nhấn */
const LEGACY_ROLES = {
  normal: { ...SCENE_ROLES.content },
  highlight: {
    ...SCENE_ROLES.content,
    shortLabel: 'Điểm nhấn',
    label: 'Điểm nhấn',
    hint: 'Chậm lại để nhấn mạnh thông tin quan trọng',
    energy: 0.85,
    duration: { ...SCENE_ROLES.content.duration, target: 4.0 },
  },
};

/** Thông số của một vai (kể cả giá trị cũ); vai lạ → content */
export function sceneRoleSpec(role) {
  return SCENE_ROLES[role] || LEGACY_ROLES[role] || SCENE_ROLES.content;
}

export function isKnownSceneRole(role) {
  return Boolean(SCENE_ROLES[role] || LEGACY_ROLES[role]);
}

/** Chỉ số (0-based) của cảnh điểm nhấn — cùng công thức với prompt (cảnh floor(0.6n)+1) */
export function highlightSceneIndex(n) {
  return Math.floor(n * 0.6);
}

/**
 * Vai mặc định theo vị trí khi cảnh chưa có temporalRole — một công thức cho cả lúc AI tạo
 * (postProcessor) lẫn lúc hiển thị (Filmstrip, NodeFlow, chấm điểm giữ chân).
 * Trả giá trị cũ (normal/highlight) vì bộ tạo video hiện tại vẫn dùng 4 vai.
 */
export function inferRoleByIndex(index, total) {
  const n = Math.max(1, Math.floor(Number(total) || 1));
  if (index === 0) return 'hook';
  if (n > 1 && index === n - 1) return 'cta';
  if (index === highlightSceneIndex(n)) return 'highlight';
  return 'normal';
}

/** Vai của cảnh: giá trị đã gán nếu hợp lệ, không thì suy theo vị trí */
export function effectiveSceneRole(scene, index, total) {
  const role = scene?.temporalRole;
  return isKnownSceneRole(role) ? role : inferRoleByIndex(index, total);
}

/** Vai theo 6 giá trị chuẩn (normal / highlight → content) */
export function canonicalSceneRole(role) {
  if (SCENE_ROLES[role]) return role;
  return 'content';
}

/** Cảnh đỉnh cảm xúc: highlight (cũ) hoặc climax — chớp sáng, nền mesh, giọng chậm, SFX nhấn */
export function isPeakScene(sceneOrRole) {
  const role = typeof sceneOrRole === 'string' ? sceneOrRole : sceneOrRole?.temporalRole;
  return role === 'highlight' || role === 'climax';
}

/** Năng lượng mặc định theo vai (khi AI không chấm) */
export function roleEnergy(role) {
  return sceneRoleSpec(role).energy;
}

/**
 * Thời lượng cảnh theo vai, KHÔNG BAO GIỜ ngắn hơn giọng đọc:
 * có audio đo thật → khớp audio; có lời thoại → ước lượng theo tốc độ nói; không có gì → target của vai.
 * Sau đó nâng lên sàn của vai (min). Trần (max) không áp ở đây để không cắt lời thoại.
 * @param {string} role
 * @param {{ audioDuration?: number, voiceoverText?: string, transition?: { duration?: number } }} [scene]
 */
export function sceneDurationForRole(role, scene = {}) {
  const spec = sceneRoleSpec(role);
  const transitionSec = Number(scene?.transition?.duration ?? DEFAULT_TRANSITION_SEC) || 0;
  let base;
  if (Number(scene?.audioDuration) > 0) base = fitSceneDurationToAudio(Number(scene.audioDuration), transitionSec);
  else if (String(scene?.voiceoverText || '').trim()) base = estimateSceneDurationSec(scene.voiceoverText);
  else base = spec.duration.target;
  return Math.round(Math.max(spec.duration.min, base) * 10) / 10;
}

/**
 * Thời lượng cảnh khi AI tạo kịch bản (chưa có audio): ước lượng theo số từ, kẹp vào [min, max] của vai.
 * contentMax cho phép bộ tạo video nới/thu trần của cảnh nội dung theo độ dài video mục tiêu.
 */
export function plannedSceneDuration(role, words, speechRateWps, opts = {}) {
  const spec = sceneRoleSpec(role);
  const isContent = !['hook', 'cta', 'bridge', 'retention', 'climax'].includes(role);
  const padding = isContent ? DURATION_BOUNDS.SAFETY_PADDING_SEC : 0.3;
  const max = isContent && opts.contentMax ? opts.contentMax : spec.duration.max;
  const raw = Math.round((words / speechRateWps + padding) * 10) / 10;
  return Math.max(spec.duration.min, Math.min(max, raw));
}
