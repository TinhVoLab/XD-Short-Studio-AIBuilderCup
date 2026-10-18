import { useEffect, useRef, useState } from 'react'
import * as fabric from 'fabric'
import { useShallow } from 'zustand/react/shallow'
import { useEditorStore } from '@/store/useEditorStore'

import { handleObjectMoving } from '@/utils/fabric/fabricSnapping'
import { handleSelection, handleSelectionCleared, handleObjectModified } from '@/utils/fabric/fabricEvents'
import { renderHudOverlays } from '@/utils/fabric/fabricHudOverlays'
import { syncFabricElements } from '@/utils/fabric/fabricElementFactory'
import { onVectorAssetReady } from '@/utils/fabric/vectorAssetCache'
import { syncFabricKeyframes } from '@/utils/fabric/fabricKeyframeSync'
import { resolveThemePalette, resolveSceneBackground } from '@/utils/themeResolver'
import { parseCssGradientToFabric } from '@/utils/fabric/helpers/fabricGradientHelper'

export function useFabric(canvasEl: HTMLCanvasElement | null) {
  const fabricRef = useRef<fabric.Canvas | null>(null)
  // Ảnh phân tử / công thức dựng xong → đồng bộ lại để thay bằng hình thật
  const [vectorAssetVersion, setVectorAssetVersion] = useState(0)
  useEffect(() => onVectorAssetReady(() => setVectorAssetVersion((v) => v + 1)), [])
  const { scenes, currentSceneIdx, selectedElementId, previewMode, canvasZoom, canvasPan } = useEditorStore(
    useShallow((state) => ({
      scenes: state.scenes,
      currentSceneIdx: state.currentSceneIdx,
      selectedElementId: state.selectedElementId,
      previewMode: state.previewMode,
      canvasZoom: state.canvasZoom,
      canvasPan: state.canvasPan,
    }))
  )
  
  // Helper to render current scene onto fabric canvas
  const syncCurrentScene = (canvas: fabric.Canvas) => {
    const currentScene = scenes[currentSceneIdx]
    const { palette, effectiveBgColor, bgGradient, isGradient, rawPattern } = resolveSceneBackground(currentScene)
    const bgBusy = rawPattern !== 'none' || Boolean(currentScene?.bgVideoUrl)

    if (currentScene?.bgVideoUrl) {
      // Allow the underlying HTML5 background video layer to show through
      canvas.backgroundColor = 'transparent'
    } else if (isGradient && bgGradient) {
      const gradObj = parseCssGradientToFabric(bgGradient, 360, 640)
      canvas.backgroundColor = gradObj || effectiveBgColor
    } else {
      canvas.backgroundColor = effectiveBgColor
    }

    // Ensure all elements inherit the current scene's paletteId for Fabric color resolving
    const elements = (currentScene?.elements || []).map(el => ({
      ...el,
      paletteId: (el as any).paletteId || palette.id,
      // Ngữ cảnh skin của highlight-box (khớp SceneRenderer): skin theo palette + nền có họa tiết/video
      ...(el.type === 'highlight-box' ? { sceneHighlightSkin: palette.highlightSkin, bgBusy } : {}),
    }))

    // Sync Elements
    syncFabricElements(canvas, elements, selectedElementId)

    // Render HUD
    renderHudOverlays(canvas, currentScene, currentSceneIdx, scenes.length, elements)
    
    canvas.calcOffset()
    canvas.requestRenderAll()
  }

  // 1. Initialize Canvas
  useEffect(() => {
    if (!canvasEl) return

    const canvas = new fabric.Canvas(canvasEl, {
      width: 360,
      height: 640,
      backgroundColor: '#060D16',
      selection: true,
      selectionColor: 'rgba(190, 255, 1, 0.15)',
      selectionBorderColor: '#BEFF01',
      selectionLineWidth: 1,
      preserveObjectStacking: true,
    })
    fabricRef.current = canvas

    // Setup global Fabric defaults
    fabric.Object.prototype.transparentCorners = false
    fabric.Object.prototype.cornerColor = '#BEFF01'
    fabric.Object.prototype.cornerStrokeColor = '#060D16'
    fabric.Object.prototype.borderColor = '#BEFF01'
    fabric.Object.prototype.cornerSize = 10
    fabric.Object.prototype.padding = 6
    fabric.Object.prototype.borderDashArray = [4, 4]
    
    // Bind Events
    canvas.on('selection:created', handleSelection)
    canvas.on('selection:updated', handleSelection)
    canvas.on('selection:cleared', () => handleSelectionCleared(canvas))
    canvas.on('object:moving', (e: any) => handleObjectMoving(e, canvas))
    canvas.on('object:modified', (e: any) => handleObjectModified(e, canvas))

    // 🔥 IMMEDIATE RENDER ON INITIAL MOUNT: Ensures Scene 1 is NEVER black!
    syncCurrentScene(canvas)

    return () => {
      canvas.dispose()
      fabricRef.current = null
    }
  }, [canvasEl])

  // 2. Sync State to Canvas (Skip unnecessary canvas computations when hidden in render mode)
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    if (previewMode === 'render') return
    syncCurrentScene(canvas)
  }, [scenes, currentSceneIdx, selectedElementId, previewMode, canvasEl, vectorAssetVersion])

  // 3. Animation Sync Loop (Tối ưu hiệu năng CPU/GPU: Đóng băng render nền khi PiP hoặc Render mode đang phát)
  useEffect(() => {
    const unsub = useEditorStore.subscribe((state) => {
      // GPU Save: Nếu đang mở màn hình rời (PiP) hoặc đang ở chế độ xem Render, tạm dừng tính toán render của Fabric Canvas chính
      if ((state.isPipActive && state.isPlaying) || state.previewMode === 'render') {
        return
      }
      if (fabricRef.current) {
        syncFabricKeyframes(state, fabricRef.current)
      }
    })
    return unsub
  }, [])

  // 4. Recalculate pointer & viewport offsets on Pan/Zoom
  useEffect(() => {
    if (fabricRef.current) {
      fabricRef.current.calcOffset()
    }
  }, [canvasZoom, canvasPan])

  return fabricRef
}
