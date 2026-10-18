import { useEffect } from 'react'
import { useEditorStore } from '@/store/useEditorStore'
import { usePlayer } from './usePlayer'
import { openCreateVideo } from '@/components/AiWizardModal/openCreateVideo'

export function useKeyboard() {
  const { 
    currentSceneIdx, scenes, seekToScene, setExportModalOpen, showToast, 
    selectedElementId, removeElement,
    canUndo, canRedo, undo, redo,
    isMuted, setMuted,
    previewMode, setPreviewMode
  } = useEditorStore()
  
  const { togglePlay } = usePlayer()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const isInput = target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable ||
        target.closest('input, textarea, select, [contenteditable="true"]') !== null
      )

      if (isInput) return

      // Tạo video mới: Cmd+N (Mac) / Ctrl+N (Windows)
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault()
        openCreateVideo()
        return
      }

      // 0. Cloud Save: Cmd+S (Mac) / Ctrl+S (Windows)
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault()
        const user = useEditorStore.getState().firebaseUser
        if (!user) {
          useEditorStore.getState().showToast('Vui lòng đăng nhập để lưu và đồng bộ dự án lên đám mây.', 3500)
          useEditorStore.getState().setAuthModalOpen(true)
          return
        }
        useEditorStore.getState().saveCurrentProjectToCloud()
        return
      }

      // 1. Undo: Cmd+Z (Mac) / Ctrl+Z (Windows)
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault()
        if (canUndo) {
          undo()
        }
        return
      }

      // 2. Redo: Cmd+Shift+Z or Cmd+Y (Mac) / Ctrl+Y or Ctrl+Shift+Z (Windows)
      if (
        ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z')) ||
        ((e.metaKey || e.ctrlKey) && !e.shiftKey && (e.key === 'y' || e.key === 'Y'))
      ) {
        e.preventDefault()
        if (canRedo) {
          redo()
        }
        return
      }

      // 3. Toggle Mode EDIT <-> RENDER: Cmd+E (Mac) / Ctrl+E (Windows)
      if ((e.metaKey || e.ctrlKey) && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault()
        const nextMode = previewMode === 'edit' ? 'render' : 'edit'
        setPreviewMode(nextMode)
        showToast(nextMode === 'render' ? 'Đã chuyển sang chế độ Xem trước (Render) [⌘E]' : 'Đã chuyển sang chế độ Chỉnh sửa (Edit) [⌘E]')
        return
      }

      // 4. Toggle Rulers: Shift + R
      if (e.shiftKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault()
        const state = useEditorStore.getState()
        state.toggleShowRulers()
        showToast(!state.showRulers ? 'Đã bật thước Pixel (Shift+R)' : 'Đã tắt thước Pixel (Shift+R)')
        return
      }

      // 5. Align Center Horizontal: Alt + H (Option + H)
      if (e.altKey && (e.key === 'h' || e.key === 'H')) {
        const state = useEditorStore.getState()
        const targetIds = state.selectedElementIds.length > 0 ? state.selectedElementIds : (state.selectedElementId ? [state.selectedElementId] : [])
        if (targetIds.length > 0) {
          e.preventDefault()
          state.alignElements(targetIds, 'center-h', targetIds.length > 1 ? 'selection' : 'canvas')
          showToast('Đã căn giữa ngang (Alt + H)')
          return
        }
      }

      // 6. Align Center Vertical: Alt + V (Option + V)
      if (e.altKey && (e.key === 'v' || e.key === 'V')) {
        const state = useEditorStore.getState()
        const targetIds = state.selectedElementIds.length > 0 ? state.selectedElementIds : (state.selectedElementId ? [state.selectedElementId] : [])
        if (targetIds.length > 0) {
          e.preventDefault()
          state.alignElements(targetIds, 'center-v', targetIds.length > 1 ? 'selection' : 'canvas')
          showToast('Đã căn giữa dọc (Alt + V)')
          return
        }
      }

      // 7. Arrow Key Position Nudge (when element is selected)
      const state = useEditorStore.getState()
      const curScene = state.scenes[state.currentSceneIdx]
      const targetIds = state.selectedElementIds.length > 0 ? state.selectedElementIds : (state.selectedElementId ? [state.selectedElementId] : [])
      
      if (targetIds.length > 0 && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        const step = e.shiftKey ? 10 : 1
        const deltaX = e.key === 'ArrowLeft' ? -step : (e.key === 'ArrowRight' ? step : 0)
        const deltaY = e.key === 'ArrowUp' ? -step : (e.key === 'ArrowDown' ? step : 0)

        targetIds.forEach(id => {
          const el = curScene?.elements.find(item => item.id === id)
          if (el) {
            state.updateElement(id, {
              left: Math.round(el.left + deltaX),
              top: Math.round(el.top + deltaY)
            })
          }
        })
        return
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          if (currentSceneIdx > 0) seekToScene(currentSceneIdx - 1)
          break
        case 'ArrowRight':
          e.preventDefault()
          if (currentSceneIdx < scenes.length - 1) seekToScene(currentSceneIdx + 1)
          break
        case 'm':
        case 'M':
          e.preventDefault()
          setMuted(!isMuted)
          showToast(!isMuted ? 'Đã tắt âm thanh (M)' : 'Đã bật âm thanh (M)')
          break
        case 'Escape':
          setExportModalOpen(false)
          break
        case 'Backspace':
        case 'Delete':
          if (targetIds.length > 0) {
            e.preventDefault()
            targetIds.forEach(id => removeElement(id))
            showToast(`Đã xóa ${targetIds.length} phần tử`)
          }
          break
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [
    currentSceneIdx, scenes.length, togglePlay, seekToScene, 
    setExportModalOpen, showToast, selectedElementId, removeElement,
    canUndo, canRedo, undo, redo, isMuted, setMuted,
    previewMode, setPreviewMode
  ])
}
