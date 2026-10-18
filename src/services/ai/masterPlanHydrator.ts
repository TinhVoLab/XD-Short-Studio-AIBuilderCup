import { Scene, SceneElement } from '../../types/scene';
import { getSceneRecipe } from '../../config/sceneRecipes';
import { sceneRoleSpec, sceneDurationForRole } from '../../config/sceneRoles';
import { calculateElementDynamicHeight } from '../../config/layoutRegistry';
import { MASTER_SCENE_DEFAULT_WIDTH } from '../../config/masterSceneLayout';
import { planCinematics } from '../../config/cinematicRules';
import { resolveThemePalette } from '../../utils/themeResolver';
import { calculateDynamicAnchor } from './sceneSlotHydrator';
import type { SceneRoleId } from '../../config/sceneRoles';

/** Một cảnh của VideoPlan do /api/ai/master-video-plan trả về (config/videoPlan.js) */
export interface MasterPlanScene {
  role: SceneRoleId;
  recipeId: string;
  plannedSec: number;
  voiceoverText: string;
  slots: Record<string, unknown>;
}

export interface MasterVideoPlan {
  title: string;
  itemLabel: string;
  targetSec: number;
  plannedSec: number;
  scenes: MasterPlanScene[];
  warnings: string[];
}

interface HydrateMasterOptions {
  paletteId?: string;
  fontFamily?: string;
  canvasWidth?: number;
  canvasHeight?: number;
}

/**
 * VideoPlan → Scene[] của editor. Mỗi cảnh: một element master-scene (mẫu + slot) căn giữa vùng an toàn,
 * phụ đề ở 24% dưới cùng, kiểu nền theo recipe (nền màu nhấn / nền ngà), vai và thời lượng theo sceneRoles.
 * Bố cục sạch như thiết kế: không HUD, không hoạ tiết nền, không doodle.
 */
export function hydrateMasterPlan(plan: MasterVideoPlan, options: HydrateMasterOptions = {}): Scene[] {
  const canvasWidth = options.canvasWidth || 360;
  const canvasHeight = options.canvasHeight || 640;
  const palette = resolveThemePalette(options.paletteId);
  const fontFamily = options.fontFamily || 'Be Vietnam Pro';
  const stamp = Date.now();
  const contentTotal = plan.scenes.filter((s) => s.role === 'content').length;
  let contentIndex = 0;

  const scenes: Scene[] = plan.scenes.map((s, idx) => {
    const recipe = getSceneRecipe(s.recipeId);
    const sceneId = `master-scene-${stamp}-${idx}`;
    if (s.role === 'content') contentIndex += 1;

    const masterEl: SceneElement = {
      id: `master-${sceneId}`,
      type: 'master-scene',
      left: Math.round(canvasWidth / 2),
      top: 0,
      width: MASTER_SCENE_DEFAULT_WIDTH,
      height: 0,
      scaleX: 1,
      scaleY: 1,
      angle: 0,
      opacity: 1,
      // Chuyển động do layout của từng mẫu đảm nhiệm (pop / up / slam…), không chồng preset vào
      animPreset: 'none',
      animDelay: 0.1,
      paletteId: palette.id,
      masterSceneData: {
        templateId: s.recipeId,
        slots: s.slots,
        ...(recipe?.showsPosition ? { position: { index: contentIndex, total: contentTotal, label: plan.itemLabel || 'Ý' } } : {}),
      },
    } as SceneElement;
    masterEl.height = calculateElementDynamicHeight(masterEl);
    masterEl.top = calculateDynamicAnchor(canvasWidth, canvasHeight, masterEl.width, masterEl.height).top;

    const captionEl: SceneElement = {
      id: `caption-${sceneId}`,
      type: 'caption',
      left: Math.round(canvasWidth / 2),
      top: 520,
      width: 320,
      height: 70,
      content: s.voiceoverText,
      fontSize: 18,
      fontFamily,
      fontWeight: 800,
      color: palette.tokens.subtitleText,
      textAlign: 'center',
      captionStyle: 'word-highlight',
      wordsPerLine: 4,
      animPreset: 'fade',
      animDelay: 0.1,
      animDuration: 0.3,
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
      angle: 0,
    };

    return {
      id: sceneId,
      name: `Cảnh ${idx + 1}: ${recipe?.name || s.recipeId}`,
      description: `${sceneRoleSpec(s.role).label} · ${recipe?.name || ''}`,
      temporalRole: s.role,
      surface: recipe?.surface || undefined,
      duration: Math.max(s.plannedSec, sceneDurationForRole(s.role, { voiceoverText: s.voiceoverText })),
      bgColor: '',
      paletteId: palette.id,
      spaceMode: palette.spaceMode,
      bgPattern: 'none',
      viralEffects: { vignettePulse: false, accentBreathe: false, microParticles: false },
      voiceoverText: s.voiceoverText,
      soundEffects: [],
      elements: [masterEl, captionEl],
    } as Scene;
  });

  // Camera & chuyển cảnh theo năng lượng của chuỗi vai (cinematicRules), như các video khác
  const cinematic = planCinematics(scenes, plan.title || '');
  return scenes.map((scene, i) => ({ ...scene, ...cinematic[i] }));
}
