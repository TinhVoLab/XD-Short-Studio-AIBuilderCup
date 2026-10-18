import * as fabric from 'fabric'
import { SceneElement } from '@/types/scene'
import { CHART_PLACEHOLDER_REGISTRY } from '@/config/fabricPlaceholders'

export interface ResolvedOrigin {
  originX: 'left' | 'center' | 'right'
  originY: 'top' | 'center'
}

/**
 * Resolve anchor origin for any element type based on config or visual convention
 */
export function resolveObjectOrigin(el: SceneElement): ResolvedOrigin {
  const chartConfig = CHART_PLACEHOLDER_REGISTRY[el.type]
  if (chartConfig) {
    return {
      originX: chartConfig.originX,
      originY: chartConfig.originY,
    }
  }

  const isCenterObj = [
    'badge',
    'divider',
    'image',
    'shape',
    'character-mascot',
    'video',
    'numbered-list',
    'highlight-box',
    'icon-text',
    'flowchart',
    'table',
    'stat-big',
    'vs-card',
    'vs-battle',
    'lottie',
    'audio-waveform',
  ].includes(el.type)
  if (isCenterObj) {
    return {
      originX: 'center',
      originY: el.type === 'audio-waveform' ? 'center' : 'top',
    }
  }

  if (el.type === 'text' || el.type === 'caption') {
    if (el.textAlign === 'center') return { originX: 'center', originY: 'top' }
    if (el.textAlign === 'right') return { originX: 'right', originY: 'top' }
  }

  return { originX: 'left', originY: 'top' }
}

/**
 * Check if the element should preserve aspect ratio during scaling
 */
export function shouldLockAspect(type: string): boolean {
  return type !== 'text' && type !== 'caption' && type !== 'rect'
}

/**
 * Apply uniform scaling lock and hide middle edge controls
 */
export function applyControlLockRules(obj: fabric.Object, shouldLock: boolean) {
  obj.set({ lockUniScaling: shouldLock } as any)
  if (shouldLock) {
    obj.setControlsVisibility({
      ml: false,
      mr: false,
      mt: false,
      mb: false,
      tl: true,
      tr: true,
      bl: true,
      br: true,
      mtr: true,
    })
  }
}

/**
 * Apply image stroke, shadow and rounded clipPath
 */
export function applyImageEffects(
  img: fabric.Image,
  el: SceneElement,
  naturalW: number,
  naturalH: number,
  baseScaleX: number,
  baseScaleY: number
) {
  img.set({
    stroke: el.borderWidth && el.borderWidth > 0 ? el.borderColor || '#BEFF01' : undefined,
    strokeWidth: el.borderWidth || 0,
    globalCompositeOperation: el.blendMode || 'source-over',
  } as any)

  if (el.imageShadowBlur && el.imageShadowBlur > 0) {
    img.set(
      'shadow',
      new fabric.Shadow({
        color: el.imageShadowColor || '#BEFF01',
        blur: el.imageShadowBlur,
        offsetX: 0,
        offsetY: 0,
      })
    )
  } else {
    img.set('shadow', undefined)
  }

  if (el.borderRadius && el.borderRadius > 0) {
    const rx = el.borderRadius / baseScaleX
    const ry = el.borderRadius / baseScaleY

    const clipPath = new fabric.Rect({
      width: naturalW,
      height: naturalH,
      originX: 'center',
      originY: 'center',
      left: 0,
      top: 0,
      rx,
      ry,
    })
    img.set('clipPath', clipPath)
  } else {
    img.set('clipPath', undefined)
  }
}
