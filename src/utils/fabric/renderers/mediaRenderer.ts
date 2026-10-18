import * as fabric from 'fabric'
import { SceneElement } from '@/types/scene'
import { getMascotSlotUrl } from '../helpers/mascotSlotHelper'
import { applyControlLockRules, applyImageEffects } from '../helpers/fabricTransformHelper'
import { buildWidgetCardObjects } from './widgetCardRenderer'

/**
 * Handles async creation of media elements: image, video, character-mascot
 */
export function createMediaElement(
  canvas: fabric.Canvas,
  el: SceneElement,
  selectedElementId: string | null
): void {
  if (el.type === 'image' && el.src) {
    const loadId = Date.now() + Math.random()
    ;(el as any)._currentLoadId = loadId

    fabric.Image.fromURL(el.src, { crossOrigin: 'anonymous' })
      .then((img) => {
        if (!canvas || !canvas.getElement()) return
        if ((el as any)._currentLoadId !== loadId) return // Stale request, ignore

        const naturalW = img.width || 1
        const naturalH = img.height || 1
        const targetW = el.width || 110
        const targetH = el.height || 110
        const baseScaleX = targetW / naturalW
        const baseScaleY = targetH / naturalH
        const finalScaleX = (el.scaleX ?? 1) * baseScaleX
        const finalScaleY = (el.scaleY ?? 1) * baseScaleY

        img.set({
          id: el.id,
          left: el.left,
          top: el.top,
          angle: el.angle || 0,
          opacity: el.opacity ?? 1,
          originX: 'center',
          originY: 'top',   // Khớp với Remotion center-top origin
          scaleX: finalScaleX,
          scaleY: finalScaleY,
          _originalSrc: el.src,
        } as any)

        applyImageEffects(img, el, naturalW, naturalH, baseScaleX, baseScaleY)
        applyControlLockRules(img, true)

        canvas.add(img)
        if (el.id === selectedElementId) canvas.setActiveObject(img)
        canvas.requestRenderAll()
      })
      .catch((err) => {
        console.warn('Fabric image load fallback:', err)
        if (!canvas || !canvas.getElement()) return
        if ((el as any)._currentLoadId !== loadId) return

        // Render clean fallback placeholder if image URL fails to load
        const fallbackW = el.width || 120
        const fallbackH = el.height || 120
        const rect = new fabric.Rect({
          width: fallbackW,
          height: fallbackH,
          fill: 'rgba(30, 41, 59, 0.85)',
          stroke: '#EF4444',
          strokeWidth: 1.5,
          strokeDashArray: [4, 4],
          rx: el.borderRadius || 8,
          ry: el.borderRadius || 8,
          originX: 'center',
          originY: 'center',
        })
        const text = new fabric.IText('[ ẢNH KHÔNG TẢI ĐƯỢC ]\n(Bấm để đổi link ảnh)', {
          fontSize: 10,
          fontWeight: '600',
          fill: '#EF4444',
          textAlign: 'center',
          originX: 'center',
          originY: 'center',
          fontFamily: 'Inter',
        })
        const group = new fabric.Group([rect, text], {
          id: el.id,
          left: el.left,
          top: el.top,
          originX: 'center',
          originY: 'top',   // Khớp với Remotion center-top origin
          _originalSrc: el.src,
        } as any)
        applyControlLockRules(group, true)
        canvas.add(group)
        if (el.id === selectedElementId) canvas.setActiveObject(group)
        canvas.requestRenderAll()
      })
    return
  }

  if (el.type === 'video') {
    const w = el.width || 240
    const h = el.height || 135
    const radius = el.borderRadius ?? 12

    const bgRect = new fabric.Rect({
      width: w,
      height: h,
      rx: radius,
      ry: radius,
      fill: '#090D16',
      stroke: el.borderColor || '#BEFF01',
      strokeWidth: el.borderWidth || 1.5,
      originX: 'center',
      originY: 'center',
    })

    // Center Play Icon Triangle
    const playIcon = new fabric.Polygon(
      [
        { x: -7, y: -9 },
        { x: 9, y: 0 },
        { x: -7, y: 9 },
      ],
      {
        fill: '#BEFF01',
        originX: 'center',
        originY: 'center',
        top: -8,
      }
    )

    const badgeText = new fabric.Text('VIDEO CLIP', {
      fontSize: 10,
      fontWeight: 'bold',
      fill: '#FFFFFF',
      originX: 'center',
      originY: 'center',
      top: 16,
      fontFamily: 'Inter, sans-serif',
    })

    const videoGroup = new fabric.Group([bgRect, playIcon, badgeText], {
      id: el.id,
      left: el.left,
      top: el.top,
      angle: el.angle || 0,
      opacity: el.opacity ?? 1,
      scaleX: el.scaleX || 1,
      scaleY: el.scaleY || 1,
      originX: 'center',
      originY: 'center',
      _originalSrc: el.src,
    } as any)

    applyControlLockRules(videoGroup, true)
    canvas.add(videoGroup)
    if (el.id === selectedElementId) canvas.setActiveObject(videoGroup)
    canvas.requestRenderAll()
    return
  }

  if (el.type === 'character-mascot') {
    const mascotUrl = getMascotSlotUrl(el)
    let w = el.width || 220
    let h = el.height || 310
    if (w > 350 || h > 500) {
      w = 220
      h = 310
    }
    const accentColor = el.accentColor || '#BEFF01'

    const renderPlaceholderFallback = () => {
      const labelText = `🎭 MASCOT\n[ ${(el.pose || 'idea').toUpperCase()} ]\n(Kéo thả / Co giãn)`
      const widgetObjects = buildWidgetCardObjects(el, accentColor, labelText, w, h, true)
      const group = new fabric.Group(widgetObjects, {
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
      applyControlLockRules(group, true)
      canvas.add(group)
      if (el.id === selectedElementId) canvas.setActiveObject(group)
      canvas.requestRenderAll()
    }

    if (mascotUrl) {
      fabric.Image.fromURL(mascotUrl, { crossOrigin: 'anonymous' })
        .then((img) => {
          if (!canvas || !canvas.getElement()) return
          const naturalW = img.width || w
          const naturalH = img.height || h
          const scaleX = (w / naturalW) * (el.flipX ? -1 : 1)
          const scaleY = h / naturalH

          img.set({
            id: el.id,
            left: el.left,
            top: el.top,
            originX: 'center',
            originY: 'center',
            scaleX,
            scaleY,
            angle: el.angle || 0,
            opacity: el.opacity ?? 1,
            _originalSrc: mascotUrl,
            _contentFingerprint: `${mascotUrl}|${el.pose}|${el.flipX}|${w}|${h}`,
          } as any)

          applyControlLockRules(img, true)
          canvas.add(img)
          if (el.id === selectedElementId) canvas.setActiveObject(img)
          canvas.requestRenderAll()
        })
        .catch(() => {
          renderPlaceholderFallback()
        })
    } else {
      renderPlaceholderFallback()
    }
  }
}
