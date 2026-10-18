import { telemetry } from '../telemetryService.js';
import { ELEMENT_DEFAULT_HEIGHTS, SCENE_SILHOUETTES } from '../../../src/config/layoutRegistry.js';
import { VALID_ELEMENT_TYPES } from '../../../src/config/validElementTypes.js';
import { applyCreativeRecipe } from '../creativeRecipeService.js';
import { SPEECH_RATE_WPS } from '../../../src/config/pacingConfig.js';
import { planCinematics, planSceneSilhouettes } from '../../../src/config/cinematicRules.js';
import { effectiveSceneRole, sceneRoleSpec, plannedSceneDuration } from '../../../src/config/sceneRoles.js';
import { isNeutralTextColor } from '../../../src/config/themePalettes.js';

import { 
  sanitizeBannedWords, 
  applyPacingGuard, 
  enforceGlobalScriptBudget 
} from './processors/textPacingGuard.js';
import { 
  resolveSceneLayoutAndCollisions,
  effectiveSilhouette,
} from './processors/layoutCollisionResolver.js';
import { 
  GUARD_HANDLERS 
} from './registry/elementDefaulters.js';
import { 
  validateElementSchema 
} from './registry/elementValidators.js';
import { 
  WIDGET_MORPH_CONFIG, 
  transformWidgetData 
} from './registry/widgetMorphConfig.js';
import { resolveCinematicDirectives } from './processors/cinematicDirector.js';
import { resolveSceneSfx } from './processors/audioSfxEnricher.js';
import { resolveSceneBeat, planNarrativeBeats } from './processors/narrativeBeatResolver.js';
import { enforceSemanticContract } from './processors/semanticContractValidator.js';

/**
 * Main Pipeline Orchestrator cho việc hậu xử lý các cảnh sinh bởi AI
 */
export function postProcessGeneratedScenes(scenes, options = {}) {
  const { 
    prompt = '', 
    style = '', 
    ACCENT = '#BEFF01', 
    BG_DARK = '#060D16',
    paletteId,
    spaceMode,
    aiBannedWords = [],
    aiHumanizerEnabled = true
  } = options || {};

  const isZenOrChill = (style || '').toLowerCase().includes('thiền') || 
    (style || '').toLowerCase().includes('chữa lành') || 
    (style || '').toLowerCase().includes('chill') || 
    (style || '').toLowerCase().includes('asmr');

  const defaultViralEffects = isZenOrChill 
    ? { vignettePulse: true, accentBreathe: true, microParticles: true, flashOnBeat: false }
    : { vignettePulse: true, accentBreathe: true, microParticles: false };

  // --- PASS 0: Enforce Semantic Contract & Graceful Degradation ---
  const contractSafeScenes = enforceSemanticContract(scenes, options);

  // --- PASS 1: Count Widget Usage ---
  const widgetUsageCount = new Map();
  contractSafeScenes.forEach(scene => {
    (scene.elements || []).forEach(el => {
      if (el.type && el.type !== 'text' && el.type !== 'badge' && el.type !== 'caption' && el.type !== 'divider') {
        widgetUsageCount.set(el.type, (widgetUsageCount.get(el.type) || 0) + 1);
      }
    });
  });

  // --- PASS 2: Morphing & Normalization ---
  let lastPrimaryWidget = null;
  // Nhịp giữ chân tính trên số cảnh thực nhận (Stage 1 được phép trả ít hơn n yêu cầu)
  const beatPlan = planNarrativeBeats(contractSafeScenes.length);
  // Bóng dáng cảnh: cùng seed với prompt Stage 2 (directorSeed) → cắt đúng hình khối đã yêu cầu AI
  const silhouettePlan = options.useSilhouettes === false
    ? []
    : planSceneSilhouettes(contractSafeScenes.length, options.hookContext?.seed || prompt);

  const processedScenes = contractSafeScenes.map((scene, si) => {
    // Clean up CoT director notes
    if (scene._directorNotes) {
      delete scene._directorNotes;
    }

    const sanitizedVoiceover = sanitizeBannedWords(scene.voiceoverText || '', aiBannedWords, aiHumanizerEnabled);
    const sanitizedName = sanitizeBannedWords(scene.name || '', aiBannedWords, aiHumanizerEnabled);
    const sanitizedDesc = sanitizeBannedWords(scene.description || '', aiBannedWords, aiHumanizerEnabled);

    const temporalRole = effectiveSceneRole(scene, si, scenes.length);
    const beat = resolveSceneBeat(scene, beatPlan[si], sanitizedVoiceover);
    const silhouette = SCENE_SILHOUETTES[silhouettePlan[si]] ? silhouettePlan[si] : undefined;

    const isShortPreset = options?.targetDuration && options.targetDuration <= 20;
    // Số từ mục tiêu theo vai (config/sceneRoles); nhịp rehook ngắn như cảnh giữ chân
    let sceneWordTarget;
    if (temporalRole === 'hook' || temporalRole === 'cta') {
      sceneWordTarget = sceneRoleSpec(temporalRole).maxWords;
    } else if (beat?.kind === 'rehook') {
      sceneWordTarget = sceneRoleSpec('retention').maxWords;
    } else {
      sceneWordTarget = isShortPreset ? 20 : (options?.wordsPerScene ? Math.round(options.wordsPerScene * 1.25) : sceneRoleSpec('content').maxWords);
    }

    const guardedVoiceover = applyPacingGuard(sanitizedVoiceover, sceneWordTarget);
    const words = guardedVoiceover.split(/\s+/).filter(w => w.length > 0).length;

    // Thời lượng theo số từ, kẹp vào khung của vai (config/sceneRoles); cảnh nội dung nới trần theo độ dài video
    const targetDurPerScene = options?.targetDuration && options?.sceneCount
      ? (options.targetDuration / options.sceneCount)
      : 6.0;
    const calcDuration = plannedSceneDuration(temporalRole, words, SPEECH_RATE_WPS.vi, {
      contentMax: Math.max(4.5, Math.round(targetDurPerScene * 1.45 * 10) / 10),
    });

    const rawElements = scene.elements || [];
    
    // Find primary widget of this scene
    let primaryElIndex = rawElements.findIndex(e => e.type !== 'text' && e.type !== 'badge' && e.type !== 'caption' && e.type !== 'divider');
    let primaryType = primaryElIndex >= 0 ? rawElements[primaryElIndex].type : null;

    // Morph Logic (Anti-Repetition)
    if (primaryType && si > 0 && si < scenes.length - 1) {
      const isConsecutiveRepeat = primaryType === lastPrimaryWidget;
      const isOverused = (widgetUsageCount.get(primaryType) || 0) > 3;

      if ((isConsecutiveRepeat || isOverused) && WIDGET_MORPH_CONFIG[primaryType]) {
        const morphFallback = WIDGET_MORPH_CONFIG[primaryType].fallback(rawElements[primaryElIndex]);
        
        let finalMorphType = morphFallback;
        if (finalMorphType === lastPrimaryWidget) {
             // Just force another fallback if possible, or keep it if no choice
        }

        // Apply Morph
        rawElements[primaryElIndex] = transformWidgetData(rawElements[primaryElIndex], finalMorphType, ACCENT);
        
        // Update stats
        widgetUsageCount.set(primaryType, widgetUsageCount.get(primaryType) - 1);
        widgetUsageCount.set(finalMorphType, (widgetUsageCount.get(finalMorphType) || 0) + 1);
        
        primaryType = finalMorphType;
      }
    }

    if (primaryType) {
      lastPrimaryWidget = primaryType;
    }

    let processedElements = rawElements.map((el, ei) => {
      // --- UNKNOWN TYPE FALLBACK ---
      let safeType = el.type;
      if (!VALID_ELEMENT_TYPES.has(safeType)) {
        telemetry.recordHealing(1, { reason: 'UnknownTypeFallback', originalType: el.type, safeType: 'highlight-box' });
        safeType = 'highlight-box'; // Fallback to a safe box preserving content
      }

      let rawContent = el.content || el.title || el.text || el.heading || el.label || '';
      
      // Auto-heal empty or generic placeholder content
      const isPlaceholder = !rawContent.trim() || rawContent.includes('Nội dung điểm nhấn') || rawContent === 'Main Idea' || rawContent === 'Tiêu Đề Cảnh';
      if (isPlaceholder) {
        if (safeType === 'highlight-box' || safeType === 'text') {
          rawContent = sanitizedVoiceover.trim() || sanitizedName.trim() || 'Thông điệp cốt lõi';
        }
      }

      rawContent = sanitizeBannedWords(rawContent, aiBannedWords, aiHumanizerEnabled);

      // Trắng/đen thuần là màu mặc định của template/LLM: bỏ để chữ theo --text của theme
      // (nếu giữ #ffffff, theme sáng sẽ ra chữ trắng trên nền kem)
      const fontColor = isNeutralTextColor(el.color) ? undefined : el.color;

      const charCount = rawContent.length;
      let fontSize = Number(el.fontSize) || 24;
      const defaultTypeHeight = ELEMENT_DEFAULT_HEIGHTS[safeType] || 60;
      let height = Number(el.height) || defaultTypeHeight;
      const defaultTypeWidth = safeType === 'radar-chart' ? 340 : (safeType === 'text' || safeType === 'highlight-box' || safeType === 'badge' ? Math.min(312, Number(el.width) || 312) : (Number(el.width) || 320));
      let width = defaultTypeWidth;

      // Smart Typography Fit
      if (safeType === 'text' || safeType === 'highlight-box') {
        const lineCount = (rawContent.split('\n').filter(Boolean)).length;
        if (safeType === 'highlight-box' && lineCount > 1) {
          fontSize = Math.min(fontSize, 14);
          height = Math.max(height, Math.min(220, lineCount * 44 + 20));
        } else if (charCount > 80) {
          fontSize = Math.min(fontSize, safeType === 'highlight-box' ? 14 : 18);
          height = Math.max(height, 95);
        } else if (charCount > 50) {
          fontSize = Math.min(fontSize, safeType === 'highlight-box' ? 14.5 : 20);
          height = Math.max(height, 80);
        } else if (charCount > 32) {
          fontSize = Math.min(fontSize, safeType === 'highlight-box' ? 15 : 24);
          height = Math.max(height, 68);
        } else if (charCount > 16) {
          fontSize = Math.min(fontSize, safeType === 'highlight-box' ? 16 : 32);
          height = Math.max(height, 60);
        }
      } else if (safeType === 'badge') {
        fontSize = 11; height = 26;
        width = Math.min(312, Math.max(80, charCount * 8 + 24));
      }

      let left = (typeof el.left === 'number' && !isNaN(el.left)) ? el.left : (Number(el.left) || 180);
      let top = (typeof el.top === 'number' && !isNaN(el.top)) ? el.top : (Number(el.top) || 100);
      if (el.textAlign === 'center' || (left >= 140 && left <= 220) || safeType === 'badge' || safeType === 'chart-bar' || safeType === 'audio-waveform') {
        left = 180;
      }

      // Clamp top to safe zone (< 460px)
      if (top > 460 && safeType !== 'audio-waveform' && safeType !== 'caption') {
        top = 380;
      }

      let guardedEl = { ...el, type: safeType };
      
      // --- DICTIONARY LOOKUP (Auto-Heal) ---
      if (GUARD_HANDLERS[safeType]) {
        GUARD_HANDLERS[safeType](guardedEl, ACCENT, { 
          sceneText: sanitizedVoiceover || sanitizedDesc || sanitizedName || '',
          autoPoseRules: options.autoPoseRules,
          hook: options.hookContext
        });
      }

      if (typeof guardedEl.title === 'string') guardedEl.title = sanitizeBannedWords(guardedEl.title, aiBannedWords, aiHumanizerEnabled);
      if (typeof guardedEl.subtitle === 'string') guardedEl.subtitle = sanitizeBannedWords(guardedEl.subtitle, aiBannedWords, aiHumanizerEnabled);
      if (typeof guardedEl.badgeText === 'string') guardedEl.badgeText = sanitizeBannedWords(guardedEl.badgeText, aiBannedWords, aiHumanizerEnabled);
      if (Array.isArray(guardedEl.items)) {
        guardedEl.items = guardedEl.items.map(item => {
          if (typeof item === 'string') return sanitizeBannedWords(item, aiBannedWords, aiHumanizerEnabled);
          if (item && typeof item === 'object') {
            const itemCopy = { ...item };
            if (typeof itemCopy.text === 'string') itemCopy.text = sanitizeBannedWords(itemCopy.text, aiBannedWords, aiHumanizerEnabled);
            if (typeof itemCopy.label === 'string') itemCopy.label = sanitizeBannedWords(itemCopy.label, aiBannedWords, aiHumanizerEnabled);
            return itemCopy;
          }
          return item;
        });
      }

      return {
        ...guardedEl,
        id: `ai-el-${Date.now()}-${si}-${ei}`,
        left, top,
        width: guardedEl.width || width,
        height: guardedEl.height || height,
        scaleX: 1, scaleY: 1, angle: 0,
        opacity: (typeof el.opacity === 'number' && !isNaN(el.opacity)) ? el.opacity : (Number(el.opacity) || 1),
        content: rawContent,
        fontSize,
        fontFamily: (el.fontFamily && el.fontFamily !== 'Inter' && el.fontFamily !== 'Be Vietnam Pro') ? el.fontFamily : (options.suggestedFont || el.fontFamily || 'Be Vietnam Pro'),
        fontWeight: el.fontWeight || 700,
        color: fontColor,
        textAlign: safeType === 'badge' ? 'center' : (el.textAlign || 'left'),
        animPreset: el.animPreset || 'fade-in',
        animDuration: Number(el.animDuration) || 0.5,
        animDelay: Number(el.animDelay) || 0,
        shadow: !!el.shadow,
      };
    }).filter(validateElementSchema); // --- STRICT VALIDATOR (Drop corrupt elements) ---

    // Ghi nhận số lượng element bị loại bỏ do không hợp lệ
    const droppedCount = rawElements.length - processedElements.length;
    if (droppedCount > 0) {
      telemetry.recordDroppedElement(droppedCount, { sceneIndex: si });
    }

    // --- EMERGENCY BLANK-SLIDE GUARD (3 Lưới Lọc) ---
    if (processedElements.length === 0) {
      const fallbackText = scene.voiceoverText?.trim() || scene.name?.trim() || "Nội dung đang được cập nhật";
      telemetry.recordEmergencyFallback({ sceneIndex: si, fallbackText });
      processedElements.push({
        id: `emergency-el-${Date.now()}-${si}`,
        type: 'highlight-box',
        content: fallbackText,
        left: 180,
        top: 200,
        width: 310,
        height: 100,
        fontSize: 24,
        accentColor: ACCENT,
        textAlign: 'center',
        animPreset: 'fade-in',
        scaleX: 1, scaleY: 1, angle: 0, opacity: 1, fontFamily: 'Inter', fontWeight: 700
      });
    }

    // ── Safe-Zone Auto-Stacking, Priority Limiter & Collision Resolver ──
    // Bóng dáng thực (có thể lùi về title-widget khi thiếu câu ngắn / widget) — persist đúng hình đã vẽ
    const sceneSilhouette = effectiveSilhouette(processedElements, silhouette);
    processedElements = resolveSceneLayoutAndCollisions(processedElements, temporalRole, sceneSilhouette);

    // Automatically inject lower-third Kinetic Caption element if voiceoverText is present
    if (scene.voiceoverText && scene.voiceoverText.trim()) {
      const hasCaption = processedElements.some(e => e.type === 'caption');
      if (!hasCaption) {
        processedElements.push({
          id: `caption-${Date.now()}-${si}`,
          type: 'caption',
          content: scene.voiceoverText.trim(),
          captionStyle: 'word-highlight',
          left: 180, top: 500, width: 320, height: 90,
          scaleX: 1, scaleY: 1, angle: 0, opacity: 1,
          fontSize: 18, fontFamily: 'Be Vietnam Pro', fontWeight: 800,
          // Màu chữ & màu từ đang đọc lấy từ token theme (--subtitle-text / --subtitle-highlight)
          textAlign: 'center', wordsPerLine: 4,
        });
      }
    }

    const soundEffects = resolveSceneSfx(scene, si, temporalRole, { beat, isZenOrChill });

    // --- Studio Zero-Bloat Auto Logic ---
    const cinematicDirectives = resolveCinematicDirectives(scene, {
      temporalRole,
      prompt,
      isZenOrChill,
      textPoolSource: sanitizedVoiceover || sanitizedName || '',
      beat,
    });

    return {
      id: `ai-scene-${Date.now()}-${si}`,
      schemaVersion: '1.0.0', // --- SCHEMA VERSION TAG ---
      name: sanitizedName || `Cảnh ${si + 1}`,
      description: sanitizedDesc || '',
      temporalRole,
      duration: calcDuration,
      bgColor: scene.bgColor || BG_DARK,
      paletteId: scene.paletteId || paletteId || undefined,
      spaceMode: scene.spaceMode || spaceMode || undefined,
      bgPattern: cinematicDirectives.bgPattern,
      ...(cinematicDirectives.bgPatternOpacity !== undefined ? { bgPatternOpacity: cinematicDirectives.bgPatternOpacity } : {}),
      kineticBgWord: cinematicDirectives.kineticBgWord,
      colorInverted: cinematicDirectives.colorInverted,
      hudHeader: cinematicDirectives.hudHeader,
      hudFooterLeft: cinematicDirectives.hudFooterLeft,
      hudFooterRight: cinematicDirectives.hudFooterRight,
      authorName: cinematicDirectives.authorName,
      voiceoverText: guardedVoiceover || '',
      // Cường độ cảm xúc 0..1 từ Visual DNA của AI — đầu vào cho đạo diễn nhịp (cinematicRules)
      // AI bỏ trống thì lấy sàn theo đường cong giữ chân (SSOT) để cảnh thân không đồng loạt một mức
      energy: Number.isFinite(Number(scene.dna?.energy)) ? Math.max(0, Math.min(1, Number(scene.dna.energy))) : beatPlan[si]?.energy,
      ...(beat ? { beat } : {}),
      ...(sceneSilhouette ? { silhouette: sceneSilhouette } : {}),
      soundEffects,
      viralEffects: scene.viralEffects || defaultViralEffects,
      elements: processedElements,
    };
  });

  // --- PASS 2B: Đạo diễn nhịp — camera & transition theo năng lượng cả chuỗi cảnh ---
  const cinematicPlan = planCinematics(processedScenes, prompt);
  processedScenes.forEach((scene, si) => Object.assign(scene, cinematicPlan[si]));

  // --- PASS 3: Global Script Word Budget Guard ---
  const budgetCheckedScenes = enforceGlobalScriptBudget(processedScenes, options);

  // ── STRANGLER FIG: DYNAMIC CREATIVE RECIPE ENGINE (CANARY PILOT) ──
  const recipeAppliedScenes = applyCreativeRecipe(budgetCheckedScenes, options);
  if (recipeAppliedScenes && Array.isArray(recipeAppliedScenes) && recipeAppliedScenes.length > 0) {
    return recipeAppliedScenes;
  }

  return budgetCheckedScenes;
}

// Re-export all public API contracts for backward-compatibility
export {
  sanitizeBannedWords,
  applyPacingGuard,
  resolveSceneLayoutAndCollisions,
};
