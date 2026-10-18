import { SceneElement } from '@/types/scene'
import { getElementAlignment } from '@/config/fabricPlaceholders'
import { calculateBadgeDimensions } from '@/config/layoutRegistry'

export type AlignmentType = 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom'
export type DistributionAxis = 'horizontal' | 'vertical'

export interface ElementBounds {
  id: string
  w: number
  h: number
  isCenterX: boolean
  isCenterY: boolean
  left: number // Visual left edge
  right: number // Visual right edge
  top: number // Visual top edge
  bottom: number // Visual bottom edge
  centerX: number // Visual center X
  centerY: number // Visual center Y
  rawLeft: number
  rawTop: number
}

export function getElementBounds(el: SceneElement): ElementBounds {
  let baseW = el.width
  let baseH = el.height
  if (el.type === 'badge') {
    const badgeDims = calculateBadgeDimensions(el)
    baseW = el.width || badgeDims.autoW
    baseH = el.height || badgeDims.autoH
  } else {
    baseW = el.width || (el.type === 'text' || el.type === 'caption' ? 320 : 200)
    baseH = el.height || (el.type === 'text' || el.type === 'caption' ? 40 : 60)
  }

  const w = baseW * (el.scaleX || 1)
  const h = baseH * (el.scaleY || 1)
  
  const align = getElementAlignment(el)
  const isCenterX = align.isCenterX
  const isCenterY = align.isCenterY

  // If the origin is right, leftEdge is shifted differently, but wait, does fabric place right-aligned objects at x=left or x=right?
  // Fabric right alignment usually means left = right edge.
  // We'll keep it simple: 
  const isRightX = (align as any).isRightX; 

  let leftEdge = el.left;
  if (isCenterX) leftEdge = el.left - w / 2;
  else if (isRightX) leftEdge = el.left - w;

  const topEdge = isCenterY ? el.top - h / 2 : el.top

  return {
    id: el.id,
    w,
    h,
    isCenterX,
    isCenterY,
    left: leftEdge,
    right: leftEdge + w,
    top: topEdge,
    bottom: topEdge + h,
    centerX: leftEdge + w / 2,
    centerY: topEdge + h / 2,
    rawLeft: el.left,
    rawTop: el.top,
  }
}

/**
 * Calculates updated { left, top } positions for elements based on alignment.
 * Canvas Dimensions: 360 x 640.
 */
export function calculateAlignedPositions(
  elements: SceneElement[],
  targetIds: string[],
  alignment: AlignmentType,
  context?: 'canvas' | 'selection'
): Map<string, { left: number; top: number }> {
  const result = new Map<string, { left: number; top: number }>()
  const targetElements = elements.filter(el => targetIds.includes(el.id))
  if (targetElements.length === 0) return result

  const boundsList = targetElements.map(getElementBounds)
  const isMulti = boundsList.length > 1
  const alignContext = context || (isMulti ? 'selection' : 'canvas')

  if (alignContext === 'canvas') {
    for (const b of boundsList) {
      let newLeft = b.rawLeft
      let newTop = b.rawTop

      switch (alignment) {
        case 'left':
          newLeft = b.isCenterX ? (b.w / 2) + 24 : 24
          break
        case 'center-h':
          newLeft = b.isCenterX ? 180 : (360 - b.w) / 2
          break
        case 'right':
          newLeft = b.isCenterX ? 360 - (b.w / 2) - 24 : 360 - b.w - 24
          break
        case 'top':
          newTop = b.isCenterY ? (b.h / 2) + 40 : 40
          break
        case 'center-v':
          newTop = b.isCenterY ? 320 : (640 - b.h) / 2
          break
        case 'bottom':
          newTop = b.isCenterY ? 640 - (b.h / 2) - 48 : 640 - b.h - 48
          break
      }

      result.set(b.id, {
        left: Math.round(newLeft),
        top: Math.round(newTop)
      })
    }
  } else {
    // Multi-element alignment relative to selection bounding box
    const minLeft = Math.min(...boundsList.map(b => b.left))
    const maxRight = Math.max(...boundsList.map(b => b.right))
    const groupCenterH = (minLeft + maxRight) / 2

    const minTop = Math.min(...boundsList.map(b => b.top))
    const maxBottom = Math.max(...boundsList.map(b => b.bottom))
    const groupCenterV = (minTop + maxBottom) / 2

    for (const b of boundsList) {
      let newLeft = b.rawLeft
      let newTop = b.rawTop

      switch (alignment) {
        case 'left':
          newLeft = b.isCenterX ? minLeft + b.w / 2 : minLeft
          break
        case 'center-h':
          newLeft = b.isCenterX ? groupCenterH : groupCenterH - b.w / 2
          break
        case 'right':
          newLeft = b.isCenterX ? maxRight - b.w / 2 : maxRight - b.w
          break
        case 'top':
          newTop = b.isCenterY ? minTop + b.h / 2 : minTop
          break
        case 'center-v':
          newTop = b.isCenterY ? groupCenterV : groupCenterV - b.h / 2
          break
        case 'bottom':
          newTop = b.isCenterY ? maxBottom - b.h / 2 : maxBottom - b.h
          break
      }

      result.set(b.id, {
        left: Math.round(newLeft),
        top: Math.round(newTop)
      })
    }
  }

  return result
}

/**
 * Calculates equal distribution positions along horizontal or vertical axis.
 */
export function calculateDistributedPositions(
  elements: SceneElement[],
  targetIds: string[],
  axis: DistributionAxis
): Map<string, { left: number; top: number }> {
  const result = new Map<string, { left: number; top: number }>()
  const targetElements = elements.filter(el => targetIds.includes(el.id))
  if (targetElements.length < 3) return result

  const boundsList = targetElements.map(getElementBounds)

  if (axis === 'horizontal') {
    boundsList.sort((a, b) => a.left - b.left)
    const first = boundsList[0]
    const last = boundsList[boundsList.length - 1]
    const totalSpan = last.right - first.left
    const totalObjectWidth = boundsList.reduce((acc, b) => acc + b.w, 0)
    const availableGap = totalSpan - totalObjectWidth
    const gap = availableGap / (boundsList.length - 1)

    let currentX = first.left
    for (const b of boundsList) {
      const newLeft = b.isCenterX ? currentX + b.w / 2 : currentX
      result.set(b.id, {
        left: Math.round(newLeft),
        top: b.rawTop
      })
      currentX += b.w + gap
    }
  } else {
    boundsList.sort((a, b) => a.top - b.top)
    const first = boundsList[0]
    const last = boundsList[boundsList.length - 1]
    const totalSpan = last.bottom - first.top
    const totalObjectHeight = boundsList.reduce((acc, b) => acc + b.h, 0)
    const availableGap = totalSpan - totalObjectHeight
    const gap = availableGap / (boundsList.length - 1)

    let currentY = first.top
    for (const b of boundsList) {
      const newTop = b.isCenterY ? currentY + b.h / 2 : currentY
      result.set(b.id, {
        left: b.rawLeft,
        top: Math.round(newTop)
      })
      currentY += b.h + gap
    }
  }

  return result
}
