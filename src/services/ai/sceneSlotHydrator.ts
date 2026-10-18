import { Scene, SceneElement } from '../../types/scene';
import { SceneSlotEnvelope, VideoSlotEnvelope, HydrationContext } from '../../types/aiSlots';
import { getWidgetSlotDef, WIDGET_SLOT_REGISTRY } from './widgetSlotRegistry';
import { calculateElementDynamicHeight } from '../../config/layoutRegistry';
import { assignGlobalDoodles } from '../metaphorMatcherService';
import { resolveThemePalette } from '../../utils/themeResolver';
import { estimateSceneDurationSec } from '../../config/pacingConfig';
import { applyAiWordAnchors } from '../../utils/wordTimeline';
import { planCinematics } from '../../config/cinematicRules';
import { validateStemElement, fallbackCalloutText } from '../../utils/stem/stemValidation';
import { lintElementText } from '../../utils/sceneLint';

/**
 * ==============================================================================
 * ⚙️ DETERMINISTIC CODE HYDRATOR ENGINE (100% TYPESAFE & DYNAMIC ANCHORS)
 * ==============================================================================
 * Assembles raw slots into pixel-perfect, safe-zone compliant Studio scenes.
 * Eliminates all hardcoded coordinates, switch-case ladders, and LLM hallucinations.
 */

export interface HydrateSceneOptions {
  envelope: SceneSlotEnvelope;
  duration?: number;
  canvasWidth?: number;
  canvasHeight?: number;
  accentColor?: string;
  fontFamily?: string;
  authorName?: string;
  theme?: 'dark' | 'light' | 'obsidian';
  paletteId?: string;
  spaceMode?: 'dark' | 'daylight-warm';
}

export interface HydrateVideoOptions {
  canvasWidth?: number;
  canvasHeight?: number;
  accentColor?: string;
  fontFamily?: string;
  authorName?: string;
  theme?: 'dark' | 'light' | 'obsidian';
  paletteId?: string;
  spaceMode?: 'dark' | 'daylight-warm';
}

/**
 * Resolve canvas bounds and calculate Safe-Zone center coordinates dynamically.
 * Works seamlessly across vertical (9:16), horizontal (16:9), and square (1:1).
 */
export function calculateDynamicAnchor(
  canvasWidth: number,
  canvasHeight: number,
  elementWidth: number,
  elementHeight: number,
  originX: 'center' | 'left' = 'center'
) {
  // Horizontal center:
  // Vì các widget của Studio đều chuẩn hóa originX: 'center' (Fabric group originX: 'center'
  // và Remotion translate3d(-50%, ...)), toạ độ left chuẩn là tâm canvas (canvasWidth / 2).
  const left = originX === 'center'
    ? Math.round(canvasWidth / 2)
    : Math.round((canvasWidth - elementWidth) / 2);

  // Vertical safe-zone calculation
  // Reserve top ~10% for header/badges, bottom ~28% for subtitle/sound waves
  const safeZoneTop = Math.round(canvasHeight * 0.12);
  const safeZoneBottom = Math.round(canvasHeight * 0.76);
  const safeZoneHeight = safeZoneBottom - safeZoneTop;

  // Center element vertically inside the safe zone
  const top = Math.round(safeZoneTop + Math.max(0, (safeZoneHeight - elementHeight) / 2));

  return { left, top, safeZoneTop, safeZoneBottom };
}

const isEmptySlot = (v: unknown) =>
  v === undefined || v === null || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && v.length === 0);

/**
 * Widget chính của một cảnh từ slot envelope: resolve definition (fallback theo archetype),
 * hydrate slots, đo chiều cao H = f(X), canh trong safe zone, neo animation & SFX theo lời thoại.
 * Dùng chung cho hydrateSceneFromSlots và hydrateVideoFromSlots.
 */
function buildPrimaryWidget(
  slot: Pick<SceneSlotEnvelope, 'widgetType' | 'archetype' | 'slots' | 'anchorWord' | 'emphasisWord' | 'sfxHint'>,
  ctx: HydrationContext,
  id: string,
  defaultPreset: string,
  voiceText: string
): SceneElement {
  const widgetDef = getWidgetSlotDef(slot.widgetType) || (() => {
    const fallbackKey = Object.keys(WIDGET_SLOT_REGISTRY).find(
      key => WIDGET_SLOT_REGISTRY[key].archetype === slot.archetype
    );
    return fallbackKey ? WIDGET_SLOT_REGISTRY[fallbackKey] : WIDGET_SLOT_REGISTRY['highlight-box'];
  })();

  let rawProps = widgetDef.hydrate(slot.slots || {}, ctx);
  let widgetType = widgetDef.type;

  // Đồ thị / phân tử / công thức sai, hoặc còn chữ giữ chỗ ([Tên…], {{title}}) → không đưa vào video:
  // thay bằng thẻ chữ từ lời thoại
  // Thiếu slot bắt buộc (AI bỏ sót, hoặc anti-monotony đổi sang widget khác schema) → không lấp chữ mẫu
  const missing = Object.entries(widgetDef.slotProperties || {})
    .filter(([key, prop]: [string, any]) => prop?.required && isEmptySlot((slot.slots as any)?.[key]))
    .map(([key]) => `thiếu slot ${key}`);
  const stemCheck = validateStemElement({ type: widgetType, ...rawProps });
  const problems = missing.length
    ? missing
    : !stemCheck.ok
      ? stemCheck.errors
      : lintElementText({ type: widgetType, ...rawProps }).map((i) => `chữ giữ chỗ ${i.text} (${i.field})`);
  if (problems.length) {
    console.warn(`[sceneSlotHydrator] ${widgetType} không hợp lệ, thay bằng thẻ chữ:`, problems);
    const calloutDef = WIDGET_SLOT_REGISTRY['highlight-box'];
    rawProps = calloutDef.hydrate({ items: [fallbackCalloutText(voiceText)], variant: 'callout-card' }, ctx);
    widgetType = calloutDef.type;
  }

  const targetW = rawProps.width || Math.min(340, Math.round(ctx.canvasWidth * 0.88));
  const protoEl: SceneElement = {
    id,
    type: widgetType as any,
    left: 0,
    top: 0,
    width: targetW,
    height: 100,
    scaleX: 1,
    scaleY: 1,
    angle: 0,
    opacity: 1,
    ...rawProps,
  };

  const dynamicH = calculateElementDynamicHeight(protoEl) || 220;
  const anchor = calculateDynamicAnchor(ctx.canvasWidth, ctx.canvasHeight, targetW, dynamicH);

  return applyAiWordAnchors({
    ...protoEl,
    left: anchor.left,
    top: anchor.top,
    height: dynamicH,
    animPreset: (protoEl as any).animPreset || defaultPreset,
    animDelay: (protoEl as any).animDelay ?? 0.15,
    animDuration: (protoEl as any).animDuration ?? 0.5,
    // SFX phát lúc widget xuất hiện (smartSfxService); không còn offset cứng theo cảnh
    sfxType: slot.sfxHint?.primary || widgetDef.sfxDefault?.primary,
    anchorWord: slot.anchorWord,
    emphasisWord: slot.emphasisWord,
  }, voiceText);
}

/**
 * Deterministically hydrates a single SceneSlotEnvelope into a production-ready Scene.
 */
export function hydrateSceneFromSlots(options: HydrateSceneOptions): Scene {
  const {
    envelope,
    duration = 3.5,
    canvasWidth = 360,
    canvasHeight = 640,
    accentColor = '#BEFF01',
    fontFamily = 'Be Vietnam Pro',
    authorName = 'TinhVo Digital',
    theme = 'dark',
  } = options;

  const sceneId = `scene-ai-${Date.now()}`;
  const elementId = `el-ai-${sceneId}-0-${Math.random().toString(36).substring(2, 6)}`;
  const voiceText = (envelope.voiceoverText || '').trim();

  const ctx: HydrationContext = {
    canvasWidth,
    canvasHeight,
    safeZoneTop: Math.round(canvasHeight * 0.12),
    safeZoneBottom: Math.round(canvasHeight * 0.76),
    accentColor,
    fontFamily,
    authorName,
    theme,
  };

  const primaryElement = buildPrimaryWidget(envelope, ctx, elementId, 'zoom-in', voiceText);

  const palette = resolveThemePalette(options.paletteId || options.theme);

  // 8. Return Fully Populated Scene
  return {
    id: sceneId,
    name: envelope.title || primaryElement.type,
    description: `Sinh từ TypeSafe Engine: [${envelope.archetype}] ${primaryElement.type}`,
    temporalRole: envelope.temporalRole || 'normal',
    duration,
    bgColor: '',
    paletteId: palette.id,
    spaceMode: palette.spaceMode,
    bgPattern: 'grid',
    elements: [primaryElement],
    voiceoverText: voiceText,
    soundEffects: [],
    cameraMotion: 'static',
  };
}

/**
 * Deterministically hydrates an entire Multi-Scene Video from a VideoSlotEnvelope.
 * Automatically injects 4-layer composition, 6 visual motion fields, anti-monotony guard,
 * and passes through assignGlobalDoodles() for cinematic hand-drawn motion.
 */
export function hydrateVideoFromSlots(
  videoEnvelope: VideoSlotEnvelope,
  options: HydrateVideoOptions = {}
): Scene[] {
  const canvasWidth = options.canvasWidth || 360;
  const canvasHeight = options.canvasHeight || 640;
  const palette = resolveThemePalette((videoEnvelope as any).paletteId || options.paletteId || options.theme);
  const accentColor = options.accentColor || palette.tokens.accent;
  const fontFamily = options.fontFamily || 'Be Vietnam Pro';
  const authorName = videoEnvelope.authorName || options.authorName || 'TinhVo Digital';
  const theme = options.theme || (palette.spaceMode === 'daylight-warm' ? 'light' : 'dark');

  const totalScenes = (videoEnvelope.scenes || []).length;
  const usedWidgetCount: Record<string, number> = {};

  const rawScenes: Scene[] = (videoEnvelope.scenes || []).map((sceneSlot, idx) => {
    const sceneId = `ai-scene-${Date.now()}-${idx}`;
    const temporalRole = sceneSlot.temporalRole || (idx === 0 ? 'hook' : idx === totalScenes - 1 ? 'cta' : 'normal');

    // ── ANTI-MONOTONY GUARD (CODE-LEVEL) ──
    let chosenWidgetType = sceneSlot.widgetType;
    const currentCount = usedWidgetCount[chosenWidgetType] || 0;
    if (currentCount >= 2) {
      // Find alternate widget in same archetype
      const alternates = Object.keys(WIDGET_SLOT_REGISTRY).filter(
        k => WIDGET_SLOT_REGISTRY[k].archetype === sceneSlot.archetype && (usedWidgetCount[k] || 0) < 2
      );
      if (alternates.length > 0) {
        chosenWidgetType = alternates[0];
      }
    }
    usedWidgetCount[chosenWidgetType] = (usedWidgetCount[chosenWidgetType] || 0) + 1;

    // ── PASS 1: WORD-BUDGET PACING MATH ──
    const voiceText = (sceneSlot.voiceoverText || '').trim();
    const sceneDuration = estimateSceneDurationSec(voiceText);

    // ── LAYER 1: TOP CATEGORY BADGE ──
    const badgeMap: Record<string, string> = {
      hook: 'Góc nhìn mới',
      cta: 'Bài học bỏ túi',
      highlight: 'Bằng chứng then chốt',
    };
    let badgeContent = badgeMap[temporalRole];
    if (!badgeContent) {
      if (sceneSlot.archetype === 'stem') badgeContent = 'Nguyên lý khoa học';
      else if (sceneSlot.archetype === 'chart') badgeContent = 'Số liệu thực tế';
      else if (sceneSlot.archetype === 'diagram') badgeContent = 'Phân tích quy trình';
      else if (sceneSlot.archetype === 'comparison') badgeContent = 'Đối đầu đa chiều';
      else badgeContent = 'Kiến thức cốt lõi';
    }

    const topBadgeElement: SceneElement = {
      id: `badge-${sceneId}`,
      type: 'badge',
      left: Math.round(canvasWidth / 2),
      top: 48,
      width: 170,
      height: 32,
      content: badgeContent,
      color: palette.tokens.onSurface,
      bgColor: palette.tokens.surface,
      fontSize: 11,
      fontFamily,
      fontWeight: 700,
      textAlign: 'center',
      animPreset: 'slide-down',
      animDelay: 0,
      animDuration: 0.4,
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
      angle: 0,
    };

    // ── LAYER 2: PRIMARY CENTER WIDGET ──
    const ctx: HydrationContext = {
      canvasWidth,
      canvasHeight,
      safeZoneTop: Math.round(canvasHeight * 0.12),
      safeZoneBottom: Math.round(canvasHeight * 0.76),
      accentColor,
      fontFamily,
      authorName,
      theme,
    };
    const primaryCenterWidget = buildPrimaryWidget(
      { ...sceneSlot, widgetType: chosenWidgetType },
      ctx,
      `widget-${sceneId}`,
      temporalRole === 'hook' ? 'zoom-in' : 'fade-in',
      voiceText
    );

    // ── LAYER 3: AUTO-INJECTED CAPTION ──
    const captionElement: SceneElement = {
      id: `caption-${sceneId}`,
      type: 'caption',
      left: Math.round(canvasWidth / 2),
      top: 520,
      width: 320,
      height: 70,
      content: voiceText,
      fontSize: 18,
      fontFamily,
      fontWeight: 800,
      color: palette.tokens.subtitleText,
      // Không gán accentColor: phụ đề dùng --subtitle-highlight (đạt ≥ 4.5:1 trên nền phụ đề)
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

    // ── 7. DYNAMIC SEMANTIC BACKGROUND PATTERN ──
    let dynamicPattern: 'grid' | 'mesh' | 'noise' = 'grid';
    if (temporalRole === 'hook' || temporalRole === 'cta') {
      dynamicPattern = 'mesh'; // Aura spotlight cho mở đầu/chốt
    } else if (sceneSlot.archetype === 'chart' || sceneSlot.archetype === 'diagram' || sceneSlot.archetype === 'stem') {
      dynamicPattern = 'grid'; // Không gian kỹ thuật, logic
    } else {
      dynamicPattern = 'noise'; // Cinematic, kể chuyện, dẫn chứng
    }

    return {
      id: sceneId,
      name: `Cảnh ${idx + 1}: ${sceneSlot.title || primaryCenterWidget.type}`,
      description: `[${temporalRole.toUpperCase()}] ${primaryCenterWidget.type}`,
      temporalRole,
      duration: sceneDuration,
      bgColor: '',
      paletteId: palette.id,
      spaceMode: palette.spaceMode,
      bgPattern: dynamicPattern,
      energy: typeof sceneSlot.energy === 'number' ? Math.max(0, Math.min(1, sceneSlot.energy)) : undefined,
      hudHeader: `-- ${videoEnvelope.hudTopic || videoEnvelope.videoTitle || 'KHOA HỌC & CÔNG NGHỆ'} --`,
      hudFooterLeft: 'XD-SHORT',
      hudFooterRight: '{page}/{total}',
      authorName,
      viralEffects: {
        vignettePulse: true,
        accentBreathe: true,
        microParticles: false,
      },
      voiceoverText: voiceText,
      soundEffects: [],
      elements: [topBadgeElement, primaryCenterWidget, captionElement],
    };
  });

  // ── Đạo diễn nhịp: camera & transition theo năng lượng cả chuỗi (SSOT cinematicRules) ──
  const cinematicPlan = planCinematics(rawScenes, videoEnvelope.videoTitle || '');
  const directedScenes = rawScenes.map((scene, i) => ({ ...scene, ...cinematicPlan[i] }));

  // ── LAYER 4: HAND-DRAWN VISUAL METAPHORS (METAPHOR MATCHING) ──
  return assignGlobalDoodles(directedScenes);
}

