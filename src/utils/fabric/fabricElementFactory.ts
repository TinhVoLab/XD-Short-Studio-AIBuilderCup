import * as fabric from 'fabric'
import { SceneElement } from '@/types/scene'
import { CHART_PLACEHOLDER_REGISTRY } from '@/config/fabricPlaceholders'

// Helpers
import { getMascotSlotUrl } from './helpers/mascotSlotHelper'
import {
  resolveObjectOrigin,
  shouldLockAspect,
  applyControlLockRules,
  applyImageEffects,
} from './helpers/fabricTransformHelper'

// Renderers
import { createTextObject, updateTextObject } from './renderers/textRenderer'
import { createBasicShape } from './renderers/basicShapeRenderer'
import { createInfographicElement } from './renderers/infographicRenderer'
import { createLottieElement } from './renderers/lottieRenderer'
import { createMediaElement } from './renderers/mediaRenderer'
import { buildWaveformObjects } from './renderers/waveformRenderer'
import { buildWidgetCardObjects } from './renderers/widgetCardRenderer'
import { isMoleculePreviewReady } from './renderers/widgets/chemicalMoleculeFabricRenderer'
import { isLatexFormulaPreviewReady } from './renderers/widgets/latexFormulaFabricRenderer'

// Re-export helper for any external consumer
export { getMascotSlotUrl }

/**
 * Computes a deterministic content fingerprint for a SceneElement.
 * Spatial transform properties (left, top, scaleX, scaleY, angle, opacity) are excluded
 * so that transformations (dragging, scaling, rotating) are updated in-place (O(1))
 * without tearing down the Fabric object or dropping selection handles.
 */
export function computeElementFingerprint(el: SceneElement): string {
  const chartConfig = CHART_PLACEHOLDER_REGISTRY[el.type]
  const labelText = chartConfig ? chartConfig.getLabelText(el) : ''
  const accentColor = chartConfig ? chartConfig.getAccentColor(el) : ''
  const defaultW = typeof chartConfig?.defaultWidth === 'function'
    ? (chartConfig.defaultWidth as (el: SceneElement) => number)(el)
    : (chartConfig?.defaultWidth ?? '')
  const defaultH = typeof chartConfig?.defaultHeight === 'function'
    ? (chartConfig.defaultHeight as (el: SceneElement) => number)(el)
    : (chartConfig?.defaultHeight ?? '')

  const anyEl = el as any
  return [
    el.type,
    anyEl.paletteId ?? '',
    labelText,
    accentColor,
    defaultW,
    defaultH,
    el.width ?? '',
    el.height ?? '',
    el.fill ?? '',
    el.bgColor ?? '',
    el.accentColor ?? '',
    el.stroke ?? '',
    el.strokeWidth ?? '',
    el.radius ?? '',
    el.fontSize ?? '',
    el.fontWeight ?? '',
    el.fontFamily ?? '',
    el.textAlign ?? '',
    el.color ?? '',
    el.authorName ?? '',
    el.content ?? '',
    el.variant ?? '',
    el.boxIcon ?? '',
    el.badgeMode ?? '',
    el.highlightSkin ?? '',
    el.sceneHighlightSkin ?? '',
    el.bgBusy ? 1 : 0,
    el.showCardBg ?? '',
    el.showWatermark ?? '',
    el.title ?? '',
    el.subtitle ?? '',
    el.icon ?? '',
    el.statValue ?? '',
    el.statLabel ?? '',
    el.statBadgeText ?? '',
    el.items ? JSON.stringify(el.items) : '',
    el.rows ? JSON.stringify(el.rows) : '',
    el.flowSteps ? JSON.stringify(el.flowSteps) : '',
    el.tableData ? JSON.stringify(el.tableData) : '',
    el.chartData ? JSON.stringify(el.chartData) : '',
    anyEl.cards ? JSON.stringify(anyEl.cards) : '',
    anyEl.checklistItems ? JSON.stringify(anyEl.checklistItems) : '',
    anyEl.checklistData ? JSON.stringify(anyEl.checklistData) : '',
    anyEl.rankingItems ? JSON.stringify(anyEl.rankingItems) : '',
    anyEl.chatMessages ? JSON.stringify(anyEl.chatMessages) : '',
    anyEl.pyramidLayers ? JSON.stringify(anyEl.pyramidLayers) : '',
    anyEl.data ? JSON.stringify(anyEl.data) : '',
    el.knowledgeGraphData ? JSON.stringify(el.knowledgeGraphData) : '',
    el.diagramData ? JSON.stringify(el.diagramData) : '',
    el.sankeyData ? JSON.stringify(el.sankeyData) : '',
    el.heatmapData ? JSON.stringify(el.heatmapData) : '',
    anyEl.hologramBarData ? JSON.stringify(anyEl.hologramBarData) : '',
    anyEl.paradoxData ? JSON.stringify(anyEl.paradoxData) : '',
    anyEl.mathData ? JSON.stringify(anyEl.mathData) : '',
    anyEl.latexData ? JSON.stringify(anyEl.latexData) : '',
    anyEl.quizData ? JSON.stringify(anyEl.quizData) : '',
    anyEl.chemData ? JSON.stringify(anyEl.chemData) : '',
    anyEl.vocabData ? JSON.stringify(anyEl.vocabData) : '',
    anyEl.codeData ? JSON.stringify(anyEl.codeData) : '',
    anyEl.networkNodes ? JSON.stringify(anyEl.networkNodes) : '',
    anyEl.waveformStyle ?? '',
    anyEl.waveformColor ?? '',
    anyEl.waveformSecondaryColor ?? '',
    anyEl.waveformCoreColor ?? '',
    anyEl.waveformGlow ? '1' : '0',
    anyEl.numberOfBars !== undefined ? String(anyEl.numberOfBars) : '',
    anyEl.percent !== undefined ? String(anyEl.percent) : '',
    anyEl.showTitle !== undefined ? String(anyEl.showTitle) : '',
    anyEl.secondaryColor ?? '',
    anyEl.flipX ? '1' : '0',
    anyEl.flipY ? '1' : '0',
    anyEl.svgContent ?? '',
    anyEl.secondarySvgContent ?? '',
    anyEl.boxIcon ?? '',
    anyEl.badgeMode ?? '',
    // Master Hook targeted reactivity hash
    anyEl.hookData ? JSON.stringify(anyEl.hookData) : '',
    // Cảnh Master: mẫu + slot + nhãn vị trí
    anyEl.masterSceneData ? JSON.stringify(anyEl.masterSceneData) : '',
    // Ảnh dựng bất đồng bộ (vectorAssetCache): sẵn sàng → fingerprint đổi → vẽ lại với ảnh thật
    el.type === 'chemical-molecule'
      ? (isMoleculePreviewReady(el, Number(el.width || defaultW), Number(el.height || defaultH)) ? 'asset:ready' : 'asset:pending')
      : el.type === 'latex-formula'
        ? (isLatexFormulaPreviewReady(el) ? 'asset:ready' : 'asset:pending')
        : '',
  ].join('|')
}

/**
 * Check whether an existing Fabric object needs to be recreated from scratch
 */
function shouldRecreateObject(existingObj: fabric.Object, el: SceneElement): boolean {
  if (el.type === 'image' || el.type === 'video') {
    return (existingObj as any)._originalSrc !== el.src
  }

  if (el.type === 'character-mascot') {
    const mascotUrl = getMascotSlotUrl(el)
    return (existingObj as any)._originalSrc !== mascotUrl
  }

  if (el.type === 'text' || el.type === 'caption') {
    return false
  }

  const currentFingerprint = computeElementFingerprint(el)
  const cachedFingerprint = (existingObj as any)._contentFingerprint

  if (cachedFingerprint !== undefined) {
    return cachedFingerprint !== currentFingerprint
  }

  // Fallback for any untracked elements to ensure fresh render
  return true
}

/**
 * Update an existing Fabric object in-place (O(1) transformation)
 */
function updateExistingObject(
  canvas: fabric.Canvas,
  existingObj: fabric.Object,
  el: SceneElement,
  selectedElementId: string | null
): void {
  const { originX, originY } = resolveObjectOrigin(el)
  const targetOriginX = (existingObj as any).originX || originX
  const targetOriginY = (existingObj as any).originY || originY

  let finalScaleX = el.scaleX || 1
  let finalScaleY = el.scaleY || 1

  if (el.type === 'image') {
    const naturalW = (existingObj as any).width || 1
    const naturalH = (existingObj as any).height || 1
    const targetW = el.width || naturalW
    const targetH = el.height || naturalH
    const baseScaleX = targetW / naturalW
    const baseScaleY = targetH / naturalH
    finalScaleX = (el.scaleX ?? 1) * baseScaleX
    finalScaleY = (el.scaleY ?? 1) * baseScaleY

    if (existingObj instanceof fabric.Image) {
      applyImageEffects(existingObj, el, naturalW, naturalH, baseScaleX, baseScaleY)
    }
  } else if (el.type === 'character-mascot') {
    const naturalW = (existingObj as any).width || 1
    const naturalH = (existingObj as any).height || 1
    let targetW = el.width || 220
    let targetH = el.height || 310
    if (targetW > 350 || targetH > 500) {
      targetW = 220
      targetH = 310
    }
    const baseScaleX = targetW / naturalW
    const baseScaleY = targetH / naturalH
    finalScaleX = baseScaleX * (el.flipX ? -1 : 1)
    finalScaleY = baseScaleY
  }

  const shouldLock = shouldLockAspect(el.type)

  existingObj.set({
    left: el.left,
    top: el.top,
    scaleX: finalScaleX,
    scaleY: finalScaleY,
    flipX: el.type === 'character-mascot' ? false : Boolean(el.flipX),
    flipY: Boolean(el.flipY),
    angle: el.angle || 0,
    opacity: el.opacity ?? 1,
    originX: targetOriginX,
    originY: targetOriginY,
  } as any)

  applyControlLockRules(existingObj, shouldLock)

  if (
    (el.type === 'text' || el.type === 'caption') &&
    (existingObj instanceof fabric.IText || existingObj instanceof fabric.Textbox)
  ) {
    updateTextObject(existingObj, el)
  }

  existingObj.setCoords()

  if (el.id === selectedElementId && canvas.getActiveObject() !== existingObj) {
    canvas.setActiveObject(existingObj)
  }
}

/**
 * Instantiate a new Fabric object based on SceneElement type
 */
function createNewObject(
  canvas: fabric.Canvas,
  el: SceneElement,
  selectedElementId: string | null
): void {
  // 1. Text & Caption
  if (el.type === 'text' || el.type === 'caption') {
    const obj = createTextObject(el)
    canvas.add(obj)
    if (el.id === selectedElementId) canvas.setActiveObject(obj)
    return
  }

  // 2. Basic Shapes
  const basicShape = createBasicShape(el)
  if (basicShape) {
    ;(basicShape as any)._contentFingerprint = computeElementFingerprint(el)
    canvas.add(basicShape)
    if (el.id === selectedElementId) canvas.setActiveObject(basicShape)
    return
  }

  // 3. Infographics & Data Visuals
  const infographic = createInfographicElement(el)
  if (infographic) {
    ;(infographic as any)._contentFingerprint = computeElementFingerprint(el)
    canvas.add(infographic)
    if (el.id === selectedElementId) canvas.setActiveObject(infographic)
    return
  }

  // 4. Audio Waveform
  if (el.type === 'audio-waveform') {
    const groupObjs = buildWaveformObjects(el)
    const group = new fabric.Group(groupObjs, {
      id: el.id,
      left: el.left,
      top: el.top,
      opacity: el.opacity ?? 1,
      originX: 'center',
      originY: 'center',
      angle: el.angle || 0,
      scaleX: el.scaleX || 1,
      scaleY: el.scaleY || 1,
    } as any)
    ;(group as any)._contentFingerprint = computeElementFingerprint(el)
    canvas.add(group)
    if (el.id === selectedElementId) canvas.setActiveObject(group)
    return
  }

  // 5. Lottie Animated Placeholder
  if (el.type === 'lottie') {
    const group = createLottieElement(el)
    ;(group as any)._contentFingerprint = computeElementFingerprint(el)
    canvas.add(group)
    if (el.id === selectedElementId) canvas.setActiveObject(group)
    return
  }

  // 6. Media Elements (Async Image, Video, Mascot)
  if (el.type === 'image' || el.type === 'video' || el.type === 'character-mascot') {
    createMediaElement(canvas, el, selectedElementId)
    return
  }

  // 7. Dynamic Widget Cards & Charts (Placeholders from Registry)
  const chartConfig = CHART_PLACEHOLDER_REGISTRY[el.type]
  const defaultW = typeof chartConfig?.defaultWidth === 'function'
    ? (chartConfig.defaultWidth as (el: SceneElement) => number)(el)
    : (chartConfig?.defaultWidth ?? 300)
  const defaultH = typeof chartConfig?.defaultHeight === 'function'
    ? (chartConfig.defaultHeight as (el: SceneElement) => number)(el)
    : (chartConfig?.defaultHeight ?? 180)
  const w = el.width || defaultW
  const h = el.height || defaultH
  const labelText = chartConfig
    ? chartConfig.getLabelText(el)
    : `[ ${el.type.toUpperCase()} ]\n(Kéo thả để đổi vị trí)`
  const accentColor = chartConfig ? chartConfig.getAccentColor(el) : '#BEFF01'
  const isCenterCenter = chartConfig
    ? chartConfig.originY === 'center'
    : ['gauge-chart', 'circle-chart', 'character-mascot'].includes(el.type)

  const widgetObjects = buildWidgetCardObjects(el, accentColor, labelText, w, h, isCenterCenter)
  const group = new fabric.Group(widgetObjects, {
    id: el.id,
    left: el.left,
    top: el.top,
    opacity: el.opacity ?? 1,
    originX: 'center',
    originY: isCenterCenter ? 'center' : 'top',
    angle: el.angle || 0,
    scaleX: el.scaleX || 1,
    scaleY: el.scaleY || 1,
    flipX: Boolean(el.flipX),
    flipY: Boolean(el.flipY),
  } as any)

  applyControlLockRules(group, true)
  ;(group as any)._contentFingerprint = computeElementFingerprint(el)

  canvas.add(group)
  if (el.id === selectedElementId) canvas.setActiveObject(group)
}

/**
 * Synchronize SceneElements onto Fabric Canvas
 * Optimized with O(N) indexing, in-place mutations, and domain renderers
 */
export function syncFabricElements(
  canvas: fabric.Canvas,
  elements: SceneElement[],
  selectedElementId: string | null
): void {
  const newIds = new Set(elements.map((e) => e.id))

  // 1. Single O(N) pass: Remove stale objects and index remaining into a fast Map
  const objectMap = new Map<string, fabric.Object>()
  canvas.getObjects().forEach((obj) => {
    const id = (obj as any).id
    if (id) {
      if (!newIds.has(id)) {
        canvas.remove(obj)
      } else {
        objectMap.set(id, obj)
      }
    }
  })

  // 2. Synchronize each element with O(1) object lookup
  elements.forEach((el) => {
    let existingObj = objectMap.get(el.id)

    if (existingObj && shouldRecreateObject(existingObj, el)) {
      canvas.remove(existingObj)
      objectMap.delete(el.id)
      existingObj = undefined
    }

    if (existingObj) {
      updateExistingObject(canvas, existingObj, el, selectedElementId)
    } else {
      createNewObject(canvas, el, selectedElementId)
    }
  })
}
