import * as fabric from 'fabric'
import { useEditorStore } from '@/store/useEditorStore'
import { clearGuideLines } from './fabricSnapping'

// Helper to sync inspector with selected object
export function syncInspector(obj: any) {
  if (!obj || !obj.id) return
  const state = useEditorStore.getState()
  const currentScene = state.scenes[state.currentSceneIdx]
  const el = currentScene?.elements.find(e => e.id === obj.id)
  
  if (el) {
    state.setInspector({
      textContent: el.content || (obj.text || ''),
      fontSize: el.fontSize || 18,
      fontFamily: el.fontFamily || 'Inter',
      fontWeight: el.fontWeight?.toString() || '700',
      textColor: el.color || '#FFFFFF',
      bgColor: el.bgColor || el.fill || '#BEFF01',
      strokeColor: el.stroke || el.accentColor || '#BEFF01',
      strokeWidth: el.strokeWidth || 1,
      textAlign: (el.textAlign as any) || 'center',
      animPreset: el.animPreset || 'fade-in',
      animDuration: el.animDuration || 0.5,
      animDelay: el.animDelay || 0,
    })
  } else if (obj.type === 'i-text' || obj.type === 'text') {
    state.setInspector({
      textContent: obj.text,
      fontSize: obj.fontSize,
      fontFamily: obj.fontFamily,
      fontWeight: obj.fontWeight?.toString() || '400',
      textColor: obj.fill as string,
      textAlign: obj.textAlign as any,
    })
  }
}

export function handleSelection(e: any) {
  const selected = e.selected || []
  const validObjects = selected.filter((o: any) => o && o.id && !o.isBrandAvatar && o.id !== 'brand-avatar-hud' && !o.isGuideLine && !o.isHudObj)
  const validIds = validObjects.map((o: any) => o.id as string)

  const state = useEditorStore.getState()

  if (validIds.length === 0) {
    state.setSelectedElements([])
    return
  }

  state.setSelectedElements(validIds)
  if (validObjects.length > 0) {
    syncInspector(validObjects[0])
  }
}

export function handleSelectionCleared(canvas: fabric.Canvas) {
  clearGuideLines(canvas)
  useEditorStore.getState().setSelectedElements([])
}

export function handleObjectModified(e: any, canvas: fabric.Canvas) {
  clearGuideLines(canvas)
  const obj = e.target
  if (!obj) return
  
  const state = useEditorStore.getState()

  if ((obj as any).isBrandAvatar || obj.id === 'brand-avatar-hud') {
    const curScene = state.scenes[state.currentSceneIdx]
    if (curScene) {
      state.updateScene(curScene.id, {
        authorAvatarPosition: 'custom',
        authorAvatarLeft: Math.round(obj.left),
        authorAvatarTop: Math.round(obj.top)
      })
    }
    return
  }

  if (obj.type === 'activeSelection' || (!obj.id && Array.isArray((obj as any)._objects))) {
    // Active multi-selection
    (obj as any)._objects.forEach((child: any) => {
      if (child.id) {
        const matrix = child.calcTransformMatrix()
        const pt = fabric.util.transformPoint({ x: 0, y: 0 }, matrix)
        state.updateElement(child.id, {
          left: Math.round(pt.x),
          top: Math.round(pt.y),
          scaleX: Math.round((child.scaleX || 1) * (obj.scaleX || 1) * 100) / 100,
          scaleY: Math.round((child.scaleY || 1) * (obj.scaleY || 1) * 100) / 100,
          angle: Math.round((child.angle || 0) + (obj.angle || 0)),
        })
      }
    })
    return
  }

  if (!obj.id) return
  
  const currentScene = state.scenes[state.currentSceneIdx]
  const el = currentScene?.elements.find(e => e.id === obj.id)

  if (el?.type === 'character-mascot') {
    const naturalW = (obj as any).width || 1;
    const naturalH = (obj as any).height || 1;
    const renderedW = Math.round(Math.abs(obj.scaleX || 1) * naturalW);
    const renderedH = Math.round(Math.abs(obj.scaleY || 1) * naturalH);
    state.updateElement(obj.id, {
      left: Math.round(obj.left),
      top: Math.round(obj.top),
      width: Math.max(100, renderedW),
      height: Math.max(140, renderedH),
      scaleX: 1,
      scaleY: 1,
      flipX: (obj.scaleX || 1) < 0,
      angle: Math.round(obj.angle || 0),
    });
    return;
  }

  if (el?.type === 'badge') {
    const naturalW = (obj as any).width || el.width || 48;
    const naturalH = (obj as any).height || el.height || 22;
    const renderedW = Math.round(Math.abs(obj.scaleX || 1) * naturalW);
    const renderedH = Math.round(Math.abs(obj.scaleY || 1) * naturalH);
    state.updateElement(obj.id, {
      left: Math.round(obj.left),
      top: Math.round(obj.top),
      width: Math.max(48, renderedW),
      height: Math.max(22, renderedH),
      scaleX: 1,
      scaleY: 1,
      angle: Math.round(obj.angle || 0),
    });
    return;
  }

  const isResizable = el ? ['text', 'caption', 'rect', 'shape', 'image', 'badge'].includes(el.type) : false
  
  const dimensionsUpdate = isResizable ? {
    width: Math.round(obj.width || 0),
    height: Math.round(obj.height || 0)
  } : {}

  state.updateElement(obj.id, {
    left: Math.round(obj.left),
    top: Math.round(obj.top),
    scaleX: Math.round((obj.scaleX || 1) * 100) / 100,
    scaleY: Math.round((obj.scaleY || 1) * 100) / 100,
    angle: Math.round(obj.angle || 0),
    ...dimensionsUpdate
  })
}
