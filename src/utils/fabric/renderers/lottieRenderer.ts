import * as fabric from 'fabric'
import { SceneElement } from '@/types/scene'

/**
 * Creates Lottie animated placeholder object
 */
export function createLottieElement(el: SceneElement): fabric.Group {
  const w = el.width || 85
  const h = el.height || 85
  const preset = el.lottiePreset || 'tech-hud'
  const iconSymbol =
    preset === 'fire' ? '🔥' : preset === 'check' ? '✅' : preset === 'ai-brain' ? '🧠' : '🌀'

  const box = new fabric.Rect({
    left: 0,
    top: 0,
    width: w,
    height: h,
    fill: 'rgba(255,184,0,0.05)',
    stroke: 'rgba(255,184,0,0.4)',
    strokeWidth: 1.5,
    strokeDashArray: [4, 4],
    rx: 12,
    ry: 12,
  })
  const iconText = new fabric.IText(iconSymbol, {
    left: w / 2,
    top: h / 2,
    fontSize: Math.min(w, h) * 0.4,
    originX: 'center',
    originY: 'center',
  } as any)

  return new fabric.Group([box, iconText], {
    id: el.id,
    left: el.left,
    top: el.top,
    opacity: el.opacity ?? 1,
    originX: 'center',
    originY: 'top',
    angle: el.angle || 0,
    scaleX: el.scaleX || 1,
    scaleY: el.scaleY || 1,
  } as any)
}
