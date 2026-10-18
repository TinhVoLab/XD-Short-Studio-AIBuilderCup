/**
 * SSOT bộ xếp cảnh Master: độ dài mục tiêu → cấu trúc cảnh theo vai, và kiểm tra một VideoPlan trước khi dựng.
 * Dùng chung server (route master-video-plan, prompt AI) và client (hydrate cảnh, cổng kiểm tra).
 *
 * Cấu trúc (vai, số cảnh, thời lượng) cố định theo độ dài; mẫu của từng cảnh do AI chọn trong các mẫu cùng vai.
 * Ràng buộc chéo khai báo trên mẫu (sceneRecipes: systemSlots, listMatchesContent, requiresOpen, copySlotsFrom,
 * opensLoop / closesLoop) — ví dụ Ba điều hứa n điều → n = số cảnh nội dung → Tổng kết liệt kê đúng n mục.
 */
import { SCENE_RECIPES, validateRecipeSlots, defaultRecipeId, recipesForRole } from './sceneRecipes.js';
import { sceneRoleSpec } from './sceneRoles.js';
import { SPEECH_RATE_WPS } from './pacingConfig.js';

/** id khung 'Thư viện cảnh Master' trong wizard và trong log AI */
export const MASTER_FRAMEWORK_ID = 'master-chain';

/** Chuỗi đợt 1 cần ≥ 30 giây: Tổng kết phải có ≥ 2 mục, không vừa video 15 giây */
export const MASTER_MIN_TARGET_SEC = 30;
/** "Ba điều" và "Tổng kết" chứa 2–5 mục → tối đa 5 cảnh nội dung */
export const MASTER_MAX_CONTENT = 5;
/** Cảnh giữ chân chỉ khi video ≥ 45 giây (spec), chèn sau ý thứ 2 (~40% thời lượng) */
export const RETENTION_MIN_TARGET_SEC = 45;
export const RETENTION_AFTER_CONTENT = 2;

/** Thời lượng dự kiến từng vai theo độ dài video (bảng công thức của spec, đã sửa tổng 60 s) */
function plannedSec(role, targetSec) {
  const long = targetSec >= 45;
  switch (role) {
    case 'hook': return long ? 3 : 2.5;
    case 'bridge': return long ? 4 : 3.5;
    // 60 s: 5 ý × 7,8 s để tổng ≈ 58 s (bảng spec cộng ra 54 s, hụt 6 s)
    case 'content': return targetSec >= 60 ? 7.8 : long ? 7 : 5;
    case 'retention': return long ? 2.5 : 2;
    case 'climax': return long ? 6 : 5;
    case 'cta': return long ? 3.5 : 3;
    default: return 5;
  }
}

export function contentCountFor(targetSec) {
  if (targetSec >= 60) return 5;
  if (targetSec >= 45) return 4;
  return 3;
}

/**
 * Cấu trúc cảnh cho độ dài mục tiêu: [{ role, recipeId, recipeOptions, plannedSec, voiceWords }].
 * recipeId = mẫu mặc định của vai; recipeOptions = các mẫu AI được chọn cho cảnh đó.
 * voiceWords = số từ lời thoại mục tiêu để đọc vừa plannedSec (tốc độ nói tiếng Việt).
 */
export function planMasterStructure(targetSec) {
  const sec = Math.max(MASTER_MIN_TARGET_SEC, Number(targetSec) || MASTER_MIN_TARGET_SEC);
  const n = Math.min(MASTER_MAX_CONTENT, contentCountFor(sec));
  const roles = ['hook', 'bridge'];
  for (let i = 1; i <= n; i++) {
    roles.push('content');
    if (i === RETENTION_AFTER_CONTENT && sec >= RETENTION_MIN_TARGET_SEC) roles.push('retention');
  }
  roles.push('climax', 'cta');
  return roles.map((role) => {
    const planned = plannedSec(role, sec);
    const words = Math.max(4, Math.min(sceneRoleSpec(role).maxWords + 6, Math.round((planned - 0.4) * SPEECH_RATE_WPS.vi)));
    return { role, recipeId: defaultRecipeId(role), recipeOptions: recipesForRole(role).map((x) => x.id), plannedSec: planned, voiceWords: words };
  });
}

/** Tổng thời lượng dự kiến (giây) */
export function plannedTotalSec(structure) {
  return Math.round(structure.reduce((s, x) => s + x.plannedSec, 0) * 10) / 10;
}

/** Giá trị cho systemSlots, tính từ cấu trúc video */
function systemValue(source, ctx) {
  if (source === 'contentCount') return ctx.contentCount;
  return undefined;
}

/**
 * Mẫu AI chọn → mẫu hợp lệ của vai (sai vai / không tồn tại → mẫu mặc định),
 * rồi ép ràng buộc chéo khai báo trên mẫu: slot hệ thống, chép slot từ mẫu mở lời hứa,
 * chỉ số mục quan trọng nhất trong khoảng hợp lệ. Sửa được thì sửa, không thì để validate báo.
 */
export function applyChainConstraints(scenes) {
  const contentCount = scenes.filter((s) => s.role === 'content').length;
  const ctx = { contentCount };
  const opened = {};
  return scenes.map((s) => {
    const recipeId = SCENE_RECIPES[s.recipeId]?.role === s.role ? s.recipeId : defaultRecipeId(s.role);
    const recipe = SCENE_RECIPES[recipeId];
    const slots = { ...(s.slots || {}) };
    for (const [key, source] of Object.entries(recipe?.systemSlots || {})) {
      const v = systemValue(source, ctx);
      const def = recipe.slots.find((d) => d.key === key);
      slots[key] = def?.type === 'number' ? String(v) : v;
    }
    if (recipe?.copySlotsFrom && opened[recipe.copySlotsFrom.recipe]) {
      for (const k of recipe.copySlotsFrom.keys) slots[k] = opened[recipe.copySlotsFrom.recipe][k];
    }
    // Slot chỉ số trỏ vào một danh sách (vd mục quan trọng nhất, đáp án đúng): ngoài khoảng → bỏ
    for (const def of recipe?.slots || []) {
      if (def.type !== 'integer' || !def.indexOf) continue;
      const list = Array.isArray(slots[def.indexOf]) ? slots[def.indexOf] : [];
      const k = Number(slots[def.key]);
      slots[def.key] = Number.isInteger(k) && k >= 1 && k <= list.length ? k : undefined;
    }
    if (recipe?.opensLoop) opened[recipeId] = slots;
    return { ...s, recipeId, slots };
  });
}

const words = (t) => String(t ?? '').trim().split(/\s+/).filter(Boolean).length;

/**
 * Kiểm tra một VideoPlan (danh sách cảnh { role, recipeId, slots, voiceoverText }):
 * cấu trúc (đúng 1 hook / climax / cta, 1–5 nội dung), slot hợp lệ, lời hứa treo đã đóng trước CTA,
 * ràng buộc chéo của chuỗi, lời thoại không trống. errors → chặn; warnings → chỉ báo.
 * @returns {{ ok: boolean, errors: string[], warnings: string[] }}
 */
export function validateVideoPlan(scenes) {
  const errors = [];
  const warnings = [];
  const list = Array.isArray(scenes) ? scenes : [];
  const count = (role) => list.filter((s) => s.role === role).length;

  for (const role of ['hook', 'climax', 'cta']) if (count(role) !== 1) errors.push(`Cần đúng 1 cảnh ${sceneRoleSpec(role).label.toLowerCase()} (có ${count(role)})`);
  const nContent = count('content');
  if (nContent < 1 || nContent > MASTER_MAX_CONTENT) errors.push(`Cần 1–${MASTER_MAX_CONTENT} cảnh nội dung (có ${nContent})`);
  if (list[0]?.role !== 'hook') errors.push('Cảnh đầu phải là mở đầu');
  if (list[list.length - 1]?.role !== 'cta') errors.push('Cảnh cuối phải là kêu gọi hành động');

  const openLoops = [];
  list.forEach((s, i) => {
    const label = `Cảnh ${i + 1}`;
    const recipe = SCENE_RECIPES[s.recipeId];
    if (!recipe) return errors.push(`${label}: không có mẫu ${s.recipeId}`);
    if (recipe.role !== s.role) errors.push(`${label}: mẫu ${s.recipeId} không thuộc vai ${s.role}`);
    for (const e of validateRecipeSlots(s.recipeId, s.slots).errors) errors.push(`${label} (${recipe.name}): ${e}`);
    if (!String(s.voiceoverText || '').trim()) errors.push(`${label}: thiếu lời thoại`);
    else if (words(s.voiceoverText) > sceneRoleSpec(s.role).maxWords + 10) warnings.push(`${label}: lời thoại dài (${words(s.voiceoverText)} từ)`);
    for (const loop of recipe.requiresOpen || []) {
      if (!openLoops.some((l) => l.type === loop && l.closedAt === undefined)) errors.push(`${label} (${recipe.name}): cần một cảnh trước đó mở lời hứa "${loop}"`);
    }
    if (recipe.listMatchesContent) {
      const list = s.slots?.[recipe.listMatchesContent];
      if (Array.isArray(list) && list.length !== nContent) errors.push(`${recipe.name} có ${list.length} mục nhưng có ${nContent} cảnh nội dung`);
    }
    if (recipe.opensLoop) openLoops.push({ type: recipe.opensLoop, openedAt: i });
    for (const c of recipe.closesLoop) {
      const loop = openLoops.find((l) => l.type === c && l.closedAt === undefined);
      if (loop) loop.closedAt = i;
    }
  });
  for (const l of openLoops) if (l.type !== 'next_episode' && l.closedAt === undefined) errors.push(`Lời hứa "${l.type}" mở ở cảnh ${l.openedAt + 1} chưa được đóng trước CTA`);

  return { ok: errors.length === 0, errors, warnings };
}
