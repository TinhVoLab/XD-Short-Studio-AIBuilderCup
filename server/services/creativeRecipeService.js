/**
 * ==============================================================================
 * 🧪 CREATIVE RECIPE SERVICE — DYNAMIC 2-TIER NARRATIVE & PACING ENGINE
 * ==============================================================================
 * Architecture:
 * - Macro Layer: Video-level DNA (x_global)
 * - Narrative Arc: Scene-level progressive variable (x_i = f_arc(i, n))
 * - Scene Generator: Y_i = F(x_global, x_i)
 * - Multi-Scene Chain: Continuity constraints & Remotion TransitionSeries mapping
 *
 * Canary Phase: Applied to 'kinetic-math' / Toán Học Wizard first.
 * Zero-Regression: Returns null for unmatched styles, seamlessly falling back to legacy.
 * ==============================================================================
 */

import { adminDb } from '../middlewares/auth.js';

// Cache in-memory để độ trễ gọi hàm luôn < 1ms
const recipeCache = new Map();
let isCacheInitialized = false;

// 1. Blueprint Recipe Mẫu Chuẩn: TOÁN HỌC & ĐỘNG HỌC VECTOR Y=f(x)
export const DEFAULT_RECIPES = {
  'kinetic-math': {
    id: 'kinetic-math',
    name: 'Toán Học & Động Học Vector Y=f(x)',
    description: 'Điều biến nhịp độ video theo hàm sóng sin: Hook nhanh, thân chậm rãi giải thích, Climax bùng nổ màu Neon',
    domain: 'MATH_WIZARD',
    active: true,
    // Layer 1: DNA Toàn Video
    x_global: {
      brand_primary: '#BEFF01',
      brand_dark: '#080a0f',
      base_target_wpm: 2.5, // 2.5 từ / giây (~150 WPM)
      base_pacing: 1.0,
      transition_style: 'fade',
      default_font: 'Be Vietnam Pro',
      sfx_profile: ['boom', 'typewriter', 'glitch', 'whoosh']
    },
    // Layer 2: Hàm điều biến tiến trình theo từng cảnh
    pacing_config: {
      hook_threshold: 0.2,
      hook_multiplier: 1.25,     // Hook đọc nhanh (125% WPM)
      body_threshold: 0.65,
      body_multiplier: 0.88,     // Thân video đọc chậm rãi (88% WPM)
      climax_multiplier: 1.30,   // Climax & CTA dồn dập (130% WPM)
      climax_emotion_cutoff: 0.8 // Ngưỡng cảm xúc để Drop Beat đổi màu nền
    }
  }
};

/**
 * Kiểm tra xem cảnh / prompt hiện tại có thuộc phạm vi Canary (Toán học) hay không
 */
export function isMathWizardStyle(options = {}) {
  const s = (options.style || '').toLowerCase();
  const p = (options.prompt || '').toLowerCase();
  const r = (options.recipeId || '').toLowerCase();

  return (
    r === 'kinetic-math' ||
    s.includes('toán học') ||
    s.includes('y=f(x)') ||
    s.includes('kinetic math') ||
    s.includes('vector toán học') ||
    p.includes('toán học') ||
    p.includes('đồ thị hàm số') ||
    p.includes('lorenz')
  );
}

/**
 * Khởi tạo Cache từ Firestore hoặc Memory
 */
export async function initRecipeCache() {
  if (isCacheInitialized) return;

  // Nạp defaults trước
  Object.values(DEFAULT_RECIPES).forEach(r => recipeCache.set(r.id, r));

  if (adminDb) {
    try {
      const snap = await adminDb.collection('creative_recipes').get();
      snap.forEach(doc => {
        const data = doc.data();
        if (data.id && data.active !== false) {
          recipeCache.set(data.id, data);
        }
      });
      console.log(`[RecipeEngine] Đã nạp ${recipeCache.size} công thức kịch bản vào Cache.`);
    } catch (err) {
      console.warn('[RecipeEngine] Không thể đọc Firestore recipes, sử dụng default fallback:', err.message);
    }
  }
  isCacheInitialized = true;
}

/**
 * Tính toán biến số nhịp truyện f_arc(i, n) cho cảnh thứ i
 */
export function calculateArcVariables(index, totalScenes, recipe) {
  const n = Math.max(2, totalScenes);
  const progress = index / (n - 1); // 0.0 -> 1.0
  const cfg = recipe.pacing_config || DEFAULT_RECIPES['kinetic-math'].pacing_config;

  // Đường cong cảm xúc dạng hàm sóng Sin lệch pha:
  // Khởi đầu ở 0.5, chạm đáy ~0.2 tại đầu thân bài, vọt lên 1.0 ở Climax
  const emotion_intensity = 0.5 + 0.5 * Math.sin((progress - 0.25) * Math.PI);

  // Điều biến Pacing Multiplier
  let pacing_multiplier = 1.0;
  if (progress <= cfg.hook_threshold) {
    pacing_multiplier = cfg.hook_multiplier;
  } else if (progress <= cfg.body_threshold) {
    pacing_multiplier = cfg.body_multiplier;
  } else {
    pacing_multiplier = cfg.climax_multiplier;
  }

  const isClimax = emotion_intensity >= cfg.climax_emotion_cutoff;

  return {
    progress,
    emotion_intensity,
    pacing_multiplier,
    isClimax
  };
}

/**
 * ==============================================================================
 * 🚀 APPLY CREATIVE RECIPE: THUẬT TOÁN ĐIỀU BIẾN CẢNH TOÀN DIỆN
 * ==============================================================================
 * Trả về danh sách Scenes đã được tính toán nhịp độ và phong cách trực quan,
 * hoặc trả về NULL nếu không phải phong cách mục tiêu (để fallback về luồng cũ).
 */
export function applyCreativeRecipe(rawScenes, options = {}) {
  if (!Array.isArray(rawScenes) || rawScenes.length === 0) return null;

  // 1. Chỉ áp dụng cho Canary Pilot (Toán học) trong giai đoạn này
  if (!isMathWizardStyle(options)) {
    return null; // Fallback ngay về mã nguồn cũ cho các style khác
  }

  try {
    const recipe = recipeCache.get('kinetic-math') || DEFAULT_RECIPES['kinetic-math'];
    const { x_global } = recipe;
    const totalScenes = rawScenes.length;

    // Lấy màu sắc động từ Theme người dùng chọn ở Wizard (options.ACCENT & BG_DARK), fallback về x_global
    const activeAccent = options.ACCENT || x_global.brand_primary || '#BEFF01';
    const activeDarkBg = options.BG_DARK || x_global.brand_dark || '#080a0f';

    // Pattern Interrupt: Chỉ chọn ĐÚNG 1 CẢNH DUY NHẤT ở đỉnh cao trào (~70% video) để bùng nổ Drop Beat
    // Tránh tình trạng nhiều cảnh liên tiếp bị chói mắt
    const peakClimaxIndex = totalScenes >= 4 
      ? Math.min(totalScenes - 2, Math.max(1, Math.floor(totalScenes * 0.7)))
      : (totalScenes - 1);

    return rawScenes.map((scene, index) => {
      const arc = calculateArcVariables(index, totalScenes, recipe);

      // ── 1. Tính toán Pacing & Thời lượng Chuẩn xác ──
      const words = (scene.voiceoverText || scene.description || scene.name || '').trim().split(/\s+/).filter(Boolean).length;
      const effectiveWpm = x_global.base_target_wpm * arc.pacing_multiplier;
      
      // Thời lượng tính theo công thức WPM, có bù biên tối thiểu 2.2s
      let calculatedDurationSec = Math.max(2.2, Math.round(((words / effectiveWpm) + 0.3) * 10) / 10);
      
      // Audio-First Snapping: Nếu có sẵn âm thanh thật, ưu tiên bám theo âm thanh
      if (scene.audioDuration && typeof scene.audioDuration === 'number') {
        calculatedDurationSec = Math.max(calculatedDurationSec, Math.round((scene.audioDuration + 0.2) * 10) / 10);
      }

      // ── 2. Xác định Vai Trò & Chuyển Cảnh (TransitionSeries) ──
      const isDropBeatScene = (index === peakClimaxIndex);
      const temporalRole = index === 0 ? 'hook' 
        : index === totalScenes - 1 ? 'cta'
        : isDropBeatScene ? 'highlight'
        : 'normal';

      // Tính thời lượng transition: Cảnh nhanh thì transition ngắn (0.35s), cảnh chậm thì dài (0.55s)
      const transDurationSec = Math.max(0.3, Math.min(0.6, Math.round((0.5 * (1.8 - arc.pacing_multiplier)) * 20) / 20));
      const hasTransition = index < totalScenes - 1;

      // ── 3. Điều Biến Màu Sắc & Hiệu Ứng Trực Quan (Y_i = F(x_global, x_i)) ──
      // Chỉ cảnh đỉnh điểm mới đổi màu nền sáng (Drop Beat) theo màu Palette người dùng chọn
      const finalBgColor = isDropBeatScene ? activeAccent : activeDarkBg;
      const finalTextColor = isDropBeatScene ? '#000000' : '#ffffff';
      const textScaleMultiplier = 1.0 + (arc.emotion_intensity * 0.12);

      // ── 4. SFX Debounce Matrix ──
      let sceneSfx = scene.soundEffects || [];
      if (!sceneSfx || sceneSfx.length === 0) {
        if (temporalRole === 'hook') {
          sceneSfx = [{ type: 'boom', delaySec: 0.05, volume: 0.85 }];
        } else if (isDropBeatScene) {
          sceneSfx = [{ type: 'thud', delaySec: 0.05, volume: 0.8 }, { type: 'ding', delaySec: 0.25, volume: 0.7 }];
        } else {
          sceneSfx = [{ type: 'pop', delaySec: 0.1, volume: 0.6 }];
        }
      }

      // ── 5. Bounding-Box Clamp cho Subtitles & Elements ──
      const processedElements = (scene.elements || []).map(el => {
        let updatedEl = { ...el };
        
        // Đảo màu text nếu rơi vào cảnh Drop Beat có màu nền sáng
        if (isDropBeatScene) {
          if (updatedEl.type === 'text' || updatedEl.type === 'caption') {
            updatedEl.color = '#000000';
          }
        }

        // Bounding box clamp: Giới hạn độ dài text tránh tràn khung hình Safe-Zone
        if (updatedEl.type === 'caption' || updatedEl.type === 'text') {
          const charLen = (updatedEl.content || '').length;
          if (charLen > 60) {
            updatedEl.fontSize = Math.min(updatedEl.fontSize || 20, 16);
            updatedEl.height = Math.max(updatedEl.height || 70, 95);
          }
        }

        return updatedEl;
      });

      return {
        ...scene,
        temporalRole,
        duration: calculatedDurationSec,
        bgColor: finalBgColor,
        colorInverted: isClimaxScene,
        // Remotion TransitionSeries compatibility
        transition: hasTransition ? {
          type: x_global.transition_style,
          duration: transDurationSec
        } : { type: 'none', duration: 0 },
        soundEffects: sceneSfx,
        elements: processedElements,
        _mathRecipeMeta: {
          wpm: Math.round(effectiveWpm * 100) / 100,
          emotion: Math.round(arc.emotion_intensity * 100) / 100,
          pacingMult: arc.pacing_multiplier,
          textScale: textScaleMultiplier
        }
      };
    });
  } catch (err) {
    console.error('[RecipeEngine] Lỗi khi xử lý Creative Recipe, rơi về Fallback:', err);
    return null; // Fallback an toàn tuyệt đối
  }
}

// ── CRUD Methods for SuperAdmin ──
export async function getAllRecipes() {
  await initRecipeCache();
  return Array.from(recipeCache.values());
}

export async function saveRecipe(recipeId, recipeData) {
  await initRecipeCache();
  const existing = recipeCache.get(recipeId) || {};
  const updated = {
    ...existing,
    ...recipeData,
    id: recipeId,
    updatedAt: new Date().toISOString()
  };

  recipeCache.set(recipeId, updated);

  if (adminDb) {
    try {
      await adminDb.collection('creative_recipes').doc(recipeId).set(updated, { merge: true });
    } catch (err) {
      console.warn(`[RecipeEngine] Không thể lưu recipe "${recipeId}" vào Firestore:`, err.message);
    }
  }

  return updated;
}

export async function resetRecipes() {
  recipeCache.clear();
  Object.values(DEFAULT_RECIPES).forEach(r => recipeCache.set(r.id, r));

  if (adminDb) {
    try {
      const batch = adminDb.batch();
      for (const recipe of Object.values(DEFAULT_RECIPES)) {
        const ref = adminDb.collection('creative_recipes').doc(recipe.id);
        batch.set(ref, recipe);
      }
      await batch.commit();
    } catch (err) {
      console.warn('[RecipeEngine] Không thể reset recipes trên Firestore:', err.message);
    }
  }

  return Array.from(recipeCache.values());
}

// Khởi động cache khi import
initRecipeCache();

