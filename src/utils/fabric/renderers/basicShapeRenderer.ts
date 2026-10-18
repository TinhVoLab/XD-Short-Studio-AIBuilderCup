import * as fabric from 'fabric'
import { SceneElement } from '@/types/scene'
import { calculateBadgeDimensions } from '@/config/layoutRegistry'
import { HAND_DRAWN_SPECS } from '@/config/handDrawnCatalog'
import { getFabricThemeColors, toHexAlpha } from './widgets/colorUtils'

/**
 * Creates basic geometric shapes and simple components:
 * rect, line, badge, divider, progress, shape
 */
export function createBasicShape(el: SceneElement): fabric.Object | null {
  const themeColors = getFabricThemeColors(el)

  if (el.type === 'rect') {
    return new fabric.Rect({
      id: el.id,
      left: el.left,
      top: el.top,
      width: el.width,
      height: el.height || 8,
      fill: el.fill || el.bgColor || themeColors.surface1,
      stroke: el.stroke || 'transparent',
      strokeWidth: el.strokeWidth || 0,
      rx: el.radius || 0,
      ry: el.radius || 0,
      opacity: el.opacity ?? 1,
      angle: el.angle || 0,
      scaleX: el.scaleX || 1,
      scaleY: el.scaleY || 1,
    } as any)
  }

  if (el.type === 'line') {
    return new fabric.Rect({
      id: el.id,
      left: el.left,
      top: el.top,
      width: el.width,
      height: el.height || 3,
      fill: el.fill || el.accentColor || themeColors.accent,
      opacity: el.opacity ?? 0.7,
      rx: 2,
      ry: 2,
      angle: el.angle || 0,
      scaleX: el.scaleX || 1,
      scaleY: el.scaleY || 1,
    } as any)
  }

  if (el.type === 'badge') {
    const dims = calculateBadgeDimensions(el)
    const label = new fabric.IText(el.content || '', {
      fontSize: el.fontSize || 12,
      fontWeight: el.fontWeight || 700,
      fill: el.color || el.accentColor || themeColors.accent,
      originX: 'center',
      originY: 'center',
      fontFamily: el.fontFamily || 'Be Vietnam Pro',
    } as any)

    // Dynamic width: respect user explicit size if set; otherwise ensure pill envelopes label text
    const labelW = label.width || 0
    const dynamicW = Math.max(dims.autoW, Math.round(labelW + 24))
    const finalW = (el.width && el.width > 0) ? el.width : dynamicW
    const finalH = (el.height && el.height > 0) ? el.height : dims.autoH
    const radius = el.radius !== undefined ? el.radius : Math.round(finalH / 2)

    const hasBorder = Boolean(el.stroke || el.accentColor || (el.bgColor && el.bgColor.startsWith('rgba')))
    const strokeColor = el.stroke || el.accentColor || el.color || themeColors.accent
    const strokeWidth = el.strokeWidth !== undefined ? el.strokeWidth : (hasBorder ? 1 : 0)

    const bg = new fabric.Rect({
      width: finalW,
      height: finalH,
      fill: el.bgColor || toHexAlpha(themeColors.accent, '26'),
      stroke: strokeWidth > 0 ? strokeColor : undefined,
      strokeWidth: strokeWidth,
      rx: radius,
      ry: radius,
      left: 0,
      top: 0,
    })

    const textAlign = el.textAlign || 'center'
    let labelLeft = finalW / 2
    let originX: 'left' | 'center' | 'right' = 'center'
    if (textAlign === 'left') {
      labelLeft = 12
      originX = 'left'
    } else if (textAlign === 'right') {
      labelLeft = finalW - 12
      originX = 'right'
    }

    label.set({
      left: labelLeft,
      top: finalH / 2,
      originX,
      textAlign,
    })

    return new fabric.Group([bg, label], {
      id: el.id,
      left: el.left,
      top: el.top,
      width: finalW,
      height: finalH,
      opacity: el.opacity ?? 1,
      angle: el.angle || 0,
      scaleX: el.scaleX || 1,
      scaleY: el.scaleY || 1,
      originX: 'center',
      originY: 'top',
    } as any)
  }

  if (el.type === 'divider') {
    const line = new fabric.Rect({
      width: el.width || 200,
      height: el.height || 2,
      fill: el.accentColor || themeColors.border,
      rx: 1,
      ry: 1,
    })
    return new fabric.Group([line], {
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
  }

  if (el.type === 'progress') {
    const track = new fabric.Rect({
      width: el.width,
      height: el.height || 6,
      fill: el.bgColor || themeColors.surface1,
      rx: 3,
      ry: 3,
    })
    const fill = new fabric.Rect({
      width: ((el.percent || 0) / 100) * (el.width || 1),
      height: el.height || 6,
      fill: el.accentColor || themeColors.accent,
      rx: 3,
      ry: 3,
    })
    return new fabric.Group([track, fill], {
      id: el.id,
      left: el.left,
      top: el.top,
      opacity: el.opacity ?? 1,
      angle: el.angle || 0,
      scaleX: el.scaleX || 1,
      scaleY: el.scaleY || 1,
    } as any)
  }

  if (el.type === 'shape') {
    if (el.svgContent) {
      return new fabric.Path(el.svgContent, {
        id: el.id,
        left: el.left,
        top: el.top,
        scaleX: el.scaleX || 1,
        scaleY: el.scaleY || 1,
        angle: el.angle || 0,
        opacity: el.opacity ?? 1,
        fill:
          el.fill === 'none' || el.fill === 'transparent' ? 'transparent' : el.fill || 'transparent',
        stroke: el.stroke || themeColors.accent,
        strokeWidth: el.strokeWidth || 2,
        originX: 'center',
        originY: 'top',
      } as any)
    }

    return new fabric.Rect({
      id: el.id,
      left: el.left,
      top: el.top,
      width: el.width || 200,
      height: el.height || 60,
      scaleX: el.scaleX || 1,
      scaleY: el.scaleY || 1,
      angle: el.angle || 0,
      opacity: el.opacity ?? 1,
      fill: el.fill || el.color || themeColors.surface1,
      stroke: el.stroke || 'transparent',
      strokeWidth: el.strokeWidth || 0,
      rx: 8,
      ry: 8,
    } as any)
  }

  if (el.type === 'hand-drawn' && el.svgContent) {
    const isFilled = HAND_DRAWN_SPECS.isFilledPath(el.fillRule, el.svgContent)
    const color = el.stroke || el.accentColor || el.color || HAND_DRAWN_SPECS.defaultAccent
    const secColor = el.secondaryColor || HAND_DRAWN_SPECS.defaultSecondaryColor
    const sw = el.strokeWidth ?? HAND_DRAWN_SPECS.defaultStrokeWidth
    const outlineWidth = isFilled ? HAND_DRAWN_SPECS.calculateOutlineWidth(sw) : sw
    const objs: fabric.Object[] = []

    // Parse viewBox to calculate precise vector-to-canvas scale ratio
    const vbParts = (el.viewBox || '').trim().split(/[\s,]+/).map(Number)
    const vbW = vbParts.length >= 4 && vbParts[2] > 0 ? vbParts[2] : null
    const vbH = vbParts.length >= 4 && vbParts[3] > 0 ? vbParts[3] : null
    const targetW = el.width || vbW || HAND_DRAWN_SPECS.defaultWidth
    const targetH = el.height || vbH || HAND_DRAWN_SPECS.defaultHeight
    const vectorScaleX = vbW ? targetW / vbW : 1
    const vectorScaleY = vbH ? targetH / vbH : 1

    if (el.secondarySvgContent) {
      try {
        const secPath = new fabric.Path(el.secondarySvgContent, {
          fill: isFilled ? secColor : 'transparent',
          stroke: isFilled ? (outlineWidth > 0 ? secColor : undefined) : secColor,
          strokeWidth: isFilled ? outlineWidth * 0.8 : sw * 0.8,
          strokeLineCap: 'round',
          strokeLineJoin: 'round',
          scaleX: vectorScaleX,
          scaleY: vectorScaleY,
          strokeUniform: true,
        })
        objs.push(secPath)
      } catch {
        // Safe fallback
      }
    }

    try {
      const mainPath = new fabric.Path(el.svgContent, {
        fill: isFilled ? color : 'transparent',
        stroke: isFilled ? (outlineWidth > 0 ? color : undefined) : color,
        strokeWidth: outlineWidth,
        strokeLineCap: 'round',
        strokeLineJoin: 'round',
        scaleX: vectorScaleX,
        scaleY: vectorScaleY,
        strokeUniform: true,
      })
      objs.push(mainPath)
    } catch {
      // Safe fallback
    }

    if (objs.length > 0) {
      return new fabric.Group(objs, {
        id: el.id,
        left: el.left,
        top: el.top,
        scaleX: el.scaleX || 1,
        scaleY: el.scaleY || 1,
        flipX: Boolean(el.flipX),
        flipY: Boolean(el.flipY),
        angle: el.angle || 0,
        opacity: el.opacity ?? 1,
        originX: 'center',
        originY: 'center',
      } as any)
    }
  }

  return null
}
