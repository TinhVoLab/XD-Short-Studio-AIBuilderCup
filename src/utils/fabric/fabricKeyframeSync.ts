import * as fabric from 'fabric'
import { ElementKeyframe, KeyframeProperty, Scene } from '@/types/scene'
import { useEditorStore } from '@/store/useEditorStore'

export function evalKeyframe(keyframes: ElementKeyframe[] | undefined, prop: KeyframeProperty, timePct: number, defaultVal: number): number {
  if (!keyframes || keyframes.length === 0) return defaultVal
  const propKfs = keyframes.filter(k => k.property === prop).sort((a, b) => a.timePct - b.timePct)
  if (propKfs.length === 0) return defaultVal

  if (timePct <= propKfs[0].timePct) return propKfs[0].value
  if (timePct >= propKfs[propKfs.length - 1].timePct) return propKfs[propKfs.length - 1].value

  for (let i = 0; i < propKfs.length - 1; i++) {
    const k1 = propKfs[i]
    const k2 = propKfs[i + 1]
    if (timePct >= k1.timePct && timePct <= k2.timePct) {
      const alpha = (timePct - k1.timePct) / (k2.timePct - k1.timePct)
      return k1.value + (k2.value - k1.value) * alpha
    }
  }

  return defaultVal
}

export function syncFabricKeyframes(state: ReturnType<typeof useEditorStore.getState>, canvas: fabric.Canvas) {
  if (!state.isPlaying) return // Only animate when playing to save resources
  if (!canvas) return
  
  const sceneIdx = state.currentSceneIdx
  const sceneStartSec = state.scenes.slice(0, sceneIdx).reduce((acc, s) => acc + s.duration, 0)
  const localTime = state.currentTimeSec - sceneStartSec
  const scene = state.scenes[sceneIdx]
  if (!scene) return

  let needsRender = false

  // Update progress bar fill & dot during playback in edit mode
  const activeBar = canvas.getObjects().find((o: any) => o.id === 'progress-bar-hud-fill')
  const coreBeam = canvas.getObjects().find((o: any) => o.id === 'progress-bar-hud-core')
  const headDot = canvas.getObjects().find((o: any) => o.id === 'progress-bar-hud-dot')
  const tagText = canvas.getObjects().find((o: any) => o.id === 'progress-bar-hud-tag-text')
  
  if (scene.duration) {
    const pct = Math.max(0, Math.min(1, localTime / scene.duration))
    const maxW = 332
    const curW = maxW * pct

    if (activeBar) {
      if (Math.abs((activeBar.width || 0) - curW) > 0.5) {
        activeBar.set({ width: curW })
        if (coreBeam) coreBeam.set({ width: Math.max(0, curW - 4) })
        if (headDot) headDot.set({ left: 14 + 2 + curW })
        needsRender = true
      }
    }

    if (tagText) {
      const pctStr = `${Math.round(pct * 100)}%`
      if ((tagText as any).text !== pctStr) {
        (tagText as any).set({ text: pctStr })
        needsRender = true
      }

      const totalBlocks = 18
      const activeCount = Math.floor(pct * totalBlocks)
      for (let b = 0; b < totalBlocks; b++) {
        const block = canvas.getObjects().find((o: any) => o.id === `progress-bar-hud-block-${b}`)
        if (block) {
          const isFilled = b < activeCount
          const isKey = b === activeCount - 1
          const accentEl = scene.elements.find(e => e.color && e.color !== '#fff' && e.color !== '#ffffff') || scene.elements.find(e => e.accentColor)
          const pbColor = scene.progressBar?.color || accentEl?.color || accentEl?.accentColor || '#BEFF01'
          block.set({
            fill: isKey ? '#FFFFFF' : isFilled ? pbColor : 'rgba(255, 255, 255, 0.08)'
          })
        }
      }
    }
  }
  
  canvas.getObjects().forEach((obj: any) => {
    const el = scene.elements.find(e => e.id === obj.id)
    if (!el) return
    
    const preset = el.animPreset || 'slide-up'
    const dur = el.animDuration || 0.6
    const delay = el.animDelay || 0
    
    let op = el.opacity ?? 1
    let ty = el.top
    let tx = el.left
    let sx = el.scaleX || 1
    let sy = el.scaleY || 1
    let rot = el.angle || 0
    
    if (localTime < delay + dur) {
      let progress = (localTime - delay) / dur
      if (progress < 0) progress = 0
      if (progress > 1) progress = 1
      
      // Apple / Power4 cubic-bezier approximation
      const ease = 1 - Math.pow(1 - progress, 4)
      
      if (preset === 'slide-up') {
        op = (el.opacity ?? 1) * ease
        ty = el.top + 18 * (1 - ease)
      } else if (preset === 'fade-in') {
        op = (el.opacity ?? 1) * ease
      } else if (preset === 'zoom-in') {
        op = (el.opacity ?? 1) * ease
        sx = (el.scaleX || 1) * (0.88 + 0.12 * ease)
        sy = (el.scaleY || 1) * (0.88 + 0.12 * ease)
      } else if (preset === 'bounce') {
        op = (el.opacity ?? 1) * ease
        const bounceEase = Math.abs(Math.sin(progress * Math.PI * 1.5)) * Math.pow(1 - progress, 2)
        ty = el.top - 12 * bounceEase
      } else if (preset === 'rotate') {
        op = (el.opacity ?? 1) * ease
        rot = (el.angle || 0) - 15 * (1 - ease)
      } else if (preset === 'glitch') {
        op = Math.random() > 0.15 ? (el.opacity ?? 1) : 0.4
        tx = el.left + (Math.random() - 0.5) * 6
        ty = el.top + (Math.random() - 0.5) * 6
      } else if (preset === 'elastic') {
        op = (el.opacity ?? 1) * ease
        const scaleFactor = 1 + Math.sin(progress * Math.PI * 2) * 0.08 * (1 - progress)
        sx = (el.scaleX || 1) * scaleFactor
        sy = (el.scaleY || 1) * scaleFactor
      }
    }
    
    // Evaluate custom keyframes if defined
    if (el.keyframes && el.keyframes.length > 0) {
      const sceneDur = scene.duration || 5
      const sceneTimePct = Math.max(0, Math.min(100, (localTime / sceneDur) * 100))

      if (el.keyframes.some(k => k.property === 'position')) {
        ty += evalKeyframe(el.keyframes, 'position', sceneTimePct, 0)
      }
      if (el.keyframes.some(k => k.property === 'scale')) {
        const kfScale = evalKeyframe(el.keyframes, 'scale', sceneTimePct, 1)
        sx *= kfScale
        sy *= kfScale
      }
      if (el.keyframes.some(k => k.property === 'opacity')) {
        op *= evalKeyframe(el.keyframes, 'opacity', sceneTimePct, 1)
      }
      if (el.keyframes.some(k => k.property === 'rotation')) {
        rot += evalKeyframe(el.keyframes, 'rotation', sceneTimePct, 0)
      }
    }

    let baseScaleX = 1
    let baseScaleY = 1
    if (el.type === 'character-mascot' || el.type === 'image' || (obj as any)._originalSrc) {
      const naturalW = (obj as any).width || 1
      const naturalH = (obj as any).height || 1
      let targetW = el.width || (el.type === 'character-mascot' ? 220 : naturalW)
      let targetH = el.height || (el.type === 'character-mascot' ? 310 : naturalH)
      if (el.type === 'character-mascot' && (targetW > 350 || targetH > 500)) {
        targetW = 220
        targetH = 310
      }
      baseScaleX = (targetW / naturalW) * (el.flipX ? -1 : 1)
      baseScaleY = targetH / naturalH
    }

    const finalSx = baseScaleX * sx
    const finalSy = baseScaleY * sy

    // Apply if changed
    if (
      Math.abs(obj.opacity - op) > 0.01 || 
      Math.abs(obj.top - ty) > 0.1 || 
      Math.abs(obj.left - (tx || el.left)) > 0.1 ||
      Math.abs(obj.scaleX - finalSx) > 0.01 ||
      Math.abs(obj.angle - rot) > 0.1
    ) {
      obj.set({ opacity: op, top: ty, left: tx || el.left, scaleX: finalSx, scaleY: finalSy, angle: rot })
      needsRender = true
    }
  })
  
  if (needsRender) canvas.requestRenderAll()
}
