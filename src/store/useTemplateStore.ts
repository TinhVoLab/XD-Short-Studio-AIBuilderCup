import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TemplatePackage, TEMPLATE_SCHEMA_VERSION } from '@/types/template'

interface TemplateStore {
  templates: TemplatePackage[]
  addTemplate: (template: TemplatePackage) => void
  removeTemplate: (id: string) => void
}

export const useTemplateStore = create<TemplateStore>()(
  persist(
    (set, get) => ({
      templates: [
        // Built-in presets will be seeded here or merged on initialization
      ],
      addTemplate: (template) => {
        const current = get().templates
        // Limit to 20 custom templates to prevent localStorage overflow
        const customCount = current.filter(t => !t.isBuiltIn).length
        if (customCount >= 20) {
          throw new Error('Đã đạt giới hạn 20 templates cá nhân. Vui lòng xóa bớt để lưu thêm.')
        }
        set({ templates: [template, ...current] })
      },
      removeTemplate: (id) => {
        const t = get().templates.find(x => x.id === id)
        if (t?.isBuiltIn) {
          throw new Error('Không thể xóa template hệ thống.')
        }
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        }))
      },
    }),
    {
      name: 'xds-templates-storage',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migration logic if schema changes in the future
        }
        return persistedState
      },
    }
  )
)
