import * as fabric from 'fabric'

export const SNAP_DIST = 6
export const CANVAS_WIDTH = 360
export const CANVAS_HEIGHT = 640

/**
 * Get or initialize pooled guideline objects attached to canvas instance.
 * Eliminates GC thrashing by reusing persistent fabric.Line instances.
 */
function getOrCreateGuideLine(canvas: fabric.Canvas, axis: 'x' | 'y'): fabric.Line {
  const key = axis === 'x' ? '_guideLineX' : '_guideLineY'
  let line = (canvas as any)[key] as fabric.Line | undefined

  if (!line || !canvas.getObjects().includes(line)) {
    if (axis === 'x') {
      line = new fabric.Line([0, 0, 0, CANVAS_HEIGHT], {
        strokeWidth: 1,
        strokeDashArray: [3, 3],
        opacity: 0.85,
        selectable: false,
        evented: false,
        visible: false,
        originX: 'center',
        originY: 'top',
        top: 0,
      } as any)
    } else {
      line = new fabric.Line([0, 0, CANVAS_WIDTH, 0], {
        strokeWidth: 1,
        strokeDashArray: [3, 3],
        opacity: 0.85,
        selectable: false,
        evented: false,
        visible: false,
        originX: 'left',
        originY: 'center',
        left: 0,
      } as any)
    }
    ;(line as any).isGuideLine = true
    ;(line as any).isHudObj = true
    ;(canvas as any)[key] = line
    canvas.add(line)
  }

  return line
}

function showGuideLine(
  canvas: fabric.Canvas,
  axis: 'x' | 'y',
  pos: number,
  type: 'center' | 'margin' | 'object'
) {
  const line = getOrCreateGuideLine(canvas, axis)
  const isCenter = type === 'center'
  const color = isCenter ? '#FF3366' : (type === 'margin' ? 'rgba(190, 255, 1, 0.75)' : 'rgba(0, 229, 255, 0.75)')

  if (axis === 'x') {
    line.set({
      left: pos,
      top: 0,
      stroke: color,
      visible: true,
    } as any)
  } else {
    line.set({
      left: 0,
      top: pos,
      stroke: color,
      visible: true,
    } as any)
  }

  line.setCoords()
  const objs = canvas.getObjects()
  if (objs.length > 0 && objs[objs.length - 1] !== line) {
    canvas.bringObjectToFront(line)
  }
}

function hideGuideLine(canvas: fabric.Canvas, axis: 'x' | 'y') {
  const key = axis === 'x' ? '_guideLineX' : '_guideLineY'
  const line = (canvas as any)[key] as fabric.Line | undefined
  if (line && line.visible) {
    line.set({ visible: false })
  }
}

export function clearGuideLines(canvas: fabric.Canvas) {
  let changed = false
  const lx = (canvas as any)._guideLineX as fabric.Line | undefined
  const ly = (canvas as any)._guideLineY as fabric.Line | undefined

  if (lx && lx.visible) {
    lx.set({ visible: false })
    changed = true
  }
  if (ly && ly.visible) {
    ly.set({ visible: false })
    changed = true
  }

  // Clean up any stale legacy guidelines if present
  const legacyGuides = canvas.getObjects().filter((o: any) => o.isGuideLine && o !== lx && o !== ly)
  if (legacyGuides.length > 0) {
    legacyGuides.forEach((g) => canvas.remove(g))
    changed = true
  }

  if (changed) {
    canvas.requestRenderAll()
  }
}

export function handleObjectMoving(e: any, canvas: fabric.Canvas) {
  const obj = e.target
  if (!obj || (obj as any).isGuideLine || (obj as any).isHudObj) return

  const bound = obj.getBoundingRect()
  const objCenterX = bound.left + bound.width / 2
  const objCenterY = bound.top + bound.height / 2
  const objLeft = bound.left
  const objRight = bound.left + bound.width
  const objTop = bound.top
  const objBottom = bound.top + bound.height

  // Snap targets X
  const snapXTargets: { val: number; type: 'center' | 'margin' | 'object' }[] = [
    { val: CANVAS_WIDTH / 2, type: 'center' },
    { val: 24, type: 'margin' },
    { val: CANVAS_WIDTH - 24, type: 'margin' }
  ]

  // Snap targets Y
  const snapYTargets: { val: number; type: 'center' | 'margin' | 'object' }[] = [
    { val: CANVAS_HEIGHT / 2, type: 'center' },
    { val: 40, type: 'margin' },
    { val: CANVAS_HEIGHT - 48, type: 'margin' } // 592
  ]

  // Include other objects on canvas
  const otherObjects = canvas.getObjects().filter((o: any) => o !== obj && !(o as any).isGuideLine && !(o as any).isHudObj)
  for (const other of otherObjects) {
    const ob = other.getBoundingRect()
    snapXTargets.push({ val: ob.left + ob.width / 2, type: 'object' })
    snapXTargets.push({ val: ob.left, type: 'object' })
    snapXTargets.push({ val: ob.left + ob.width, type: 'object' })

    snapYTargets.push({ val: ob.top + ob.height / 2, type: 'object' })
    snapYTargets.push({ val: ob.top, type: 'object' })
    snapYTargets.push({ val: ob.top + ob.height, type: 'object' })
  }

  // Check X Snapping
  let snapXMatched = false
  for (const target of snapXTargets) {
    if (Math.abs(objCenterX - target.val) <= SNAP_DIST) {
      obj.set({ left: obj.left + (target.val - objCenterX) })
      showGuideLine(canvas, 'x', target.val, target.type)
      snapXMatched = true
      break
    } else if (Math.abs(objLeft - target.val) <= SNAP_DIST) {
      obj.set({ left: obj.left + (target.val - objLeft) })
      showGuideLine(canvas, 'x', target.val, target.type)
      snapXMatched = true
      break
    } else if (Math.abs(objRight - target.val) <= SNAP_DIST) {
      obj.set({ left: obj.left + (target.val - objRight) })
      showGuideLine(canvas, 'x', target.val, target.type)
      snapXMatched = true
      break
    }
  }
  if (!snapXMatched) {
    hideGuideLine(canvas, 'x')
  }

  // Check Y Snapping
  let snapYMatched = false
  for (const target of snapYTargets) {
    if (Math.abs(objCenterY - target.val) <= SNAP_DIST) {
      obj.set({ top: obj.top + (target.val - objCenterY) })
      showGuideLine(canvas, 'y', target.val, target.type)
      snapYMatched = true
      break
    } else if (Math.abs(objTop - target.val) <= SNAP_DIST) {
      obj.set({ top: obj.top + (target.val - objTop) })
      showGuideLine(canvas, 'y', target.val, target.type)
      snapYMatched = true
      break
    } else if (Math.abs(objBottom - target.val) <= SNAP_DIST) {
      obj.set({ top: obj.top + (target.val - objBottom) })
      showGuideLine(canvas, 'y', target.val, target.type)
      snapYMatched = true
      break
    }
  }
  if (!snapYMatched) {
    hideGuideLine(canvas, 'y')
  }

  obj.setCoords()
}
