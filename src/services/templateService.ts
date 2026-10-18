import { useEditorStore } from '@/store/useEditorStore'
import { TEMPLATES_CATALOG } from '@/config/templatesCatalog'
import { hydrateTemplateScenes } from '@/utils/templatePaletteMapper'

export const templateService = {
  /**
   * Áp dụng Template video vào Timeline
   * @param templateId ID của template trong TEMPLATES_CATALOG
   * @param mode 'replace' (thay thế toàn bộ) hoặc 'append' (nối vào cuối timeline)
   */
  applyTemplate: (templateId: string, mode: 'replace' | 'append' = 'replace') => {
    const store = useEditorStore.getState()
    const template = TEMPLATES_CATALOG.find(t => t.id === templateId)
    if (!template) throw new Error('Không tìm thấy mẫu template này')

    const brandColor = store.brandingSettings?.brandColor
    const rawScenes = template.getScenes({ brandColor })
    const hydratedScenes = hydrateTemplateScenes(rawScenes, template)

    // Deep clone và cấp ID mới tinh cho từng cảnh & element để tránh trùng lặp
    const timestamp = Date.now()
    const freshScenes = hydratedScenes.map((sc, i) => {
      const newSceneId = `scene-tpl-${timestamp}-${i}`
      const freshElements = sc.elements.map((el, j) => ({
        ...el,
        id: `el-tpl-${timestamp}-${i}-${j}`
      }))
      const freshSoundEffects = (sc.soundEffects || []).map((sfx, k) => ({
        ...sfx,
        id: `sfx-tpl-${timestamp}-${i}-${k}`
      }))

      return {
        ...sc,
        id: newSceneId,
        elements: freshElements,
        soundEffects: freshSoundEffects
      }
    })

    if (mode === 'replace') {
      store.setScenes(freshScenes)
      store.setCurrentScene(0)
      if (store.brandingSettings?.brandColor) {
        store.applyBrandColorToAllScenes(store.brandingSettings.brandColor)
      }
      store.showToast(`✨ Đã thay thế toàn bộ bằng mẫu "${template.name}"`)
    } else {
      store.setScenes([...store.scenes, ...freshScenes])
      if (store.brandingSettings?.brandColor) {
        store.applyBrandColorToAllScenes(store.brandingSettings.brandColor)
      }
      store.showToast(`➕ Đã thêm ${freshScenes.length} cảnh từ mẫu "${template.name}" vào cuối Timeline`)
    }
  }
}
