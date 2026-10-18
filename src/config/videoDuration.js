import { DEFAULT_TRANSITION_SEC } from './pacingConfig.js';

/**
 * SSOT độ dài video thật của Remotion TransitionSeries (cảnh gối đầu khi có chuyển cảnh).
 * Dùng chung: client (sceneTiming.ts, cảnh báo trước khi xuất) và server (/api/render/start tính lượt).
 */

/** Transition ở mép ra của cảnh: `scene.transition` là SSOT, `transitionOut` (cũ) là fallback */
export function sceneTransition(scene) {
  const trans = scene?.transition;
  if (trans?.type) {
    return trans.type === 'none' ? undefined : { type: trans.type, duration: trans.duration || DEFAULT_TRANSITION_SEC };
  }
  const legacy = scene?.transitionOut;
  return legacy && legacy !== 'none' ? { type: legacy, duration: DEFAULT_TRANSITION_SEC } : undefined;
}

/** Số frame gối đầu giữa cảnh này và cảnh kế (kẹp tối đa nửa cảnh) */
export function transitionFrames(scene, fps = 30) {
  const transSec = sceneTransition(scene)?.duration ?? 0;
  if (!transSec) return 0;
  const sceneDurFrames = Math.max(1, Math.round((scene.duration || 3) * fps));
  return Math.min(Math.round(transSec * fps), Math.max(1, Math.floor(sceneDurFrames / 2)));
}

/** Frame bắt đầu của từng cảnh: start[k] = start[k-1] + dur[k-1] - trans[k-1] */
export function sceneStartFrames(scenes, fps = 30) {
  if (!scenes || scenes.length === 0) return [0];
  const starts = [0];
  for (let i = 0; i < scenes.length - 1; i++) {
    const s = scenes[i];
    const sceneDurFrames = Math.max(1, Math.round((s.duration || 3) * fps));
    starts.push(Math.max(0, starts[i] + sceneDurFrames - transitionFrames(s, fps)));
  }
  return starts;
}

/** Tổng frame của composition: max(cảnh, audio), tối thiểu 1 giây */
export function totalDurationFrames(scenes, audioMaxSec = 0, fps = 30) {
  if (!scenes || scenes.length === 0) return Math.max(30, Math.round(audioMaxSec * fps));
  const starts = sceneStartFrames(scenes, fps);
  const lastIdx = scenes.length - 1;
  const lastDurFrames = Math.max(1, Math.round((scenes[lastIdx].duration || 3) * fps));
  return Math.max(30, starts[lastIdx] + lastDurFrames, Math.round(audioMaxSec * fps));
}

/** Mốc kết thúc xa nhất của các audio clip (giây) */
export function audioClipsEndSec(audioClips) {
  return (audioClips || []).reduce((max, a) => Math.max(max, (Number(a?.startSec) || 0) + (Number(a?.playDurationSec) || 0)), 0);
}

/** Độ dài video thật (giây) của một project */
export function projectVideoSec(scenes, audioClips, fps = 30) {
  return totalDurationFrames(scenes, audioClipsEndSec(audioClips), fps) / fps;
}
