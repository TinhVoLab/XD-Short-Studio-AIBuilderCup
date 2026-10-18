import React, { useState } from 'react'
import { useEditorStore } from '@/store/useEditorStore'
import { useShallow } from 'zustand/react/shallow'
import { useTemplateStore } from '@/store/useTemplateStore'
import { abstractSceneToTemplate, generateThumbnailBase64 } from '@/utils/templateAbstractor'
import { TemplatePackage, TEMPLATE_SCHEMA_VERSION } from '@/types/template'
import { Button } from '@/components/ui'

export default function SaveTemplateModal({ open, onClose }: { open: boolean, onClose: () => void }) {
  const {  scenes, showToast  } = useEditorStore(
    useShallow(s => ({
      scenes: s.scenes,
      showToast: s.showToast
    }))
  )
  const { addTemplate } = useTemplateStore()
  
  const [name, setName] = useState('')
  const [category, setCategory] = useState<'tech'|'lifestyle'|'education'|'product'|'custom'>('custom')
  const [saving, setSaving] = useState(false)

  if (!open) return null

  const handleSave = async () => {
    if (!name.trim()) return showToast('Vui lòng nhập tên Template')
    if (scenes.length < 3) return showToast('Cần ít nhất 3 cảnh (Hook, Content, CTA) để tạo Bộ Template')

    setSaving(true)
    try {
      // Find representative scenes
      const hookScene = scenes[0]
      const ctaScene = scenes[scenes.length - 1]
      // Just take the middle scene as representative content template
      const contentScene = scenes[Math.floor(scenes.length / 2)]

      // Create thumbnail from current canvas if possible (we assume fabric canvas is present in DOM)
      const canvasEl = document.querySelector('canvas.lower-canvas') as HTMLCanvasElement
      const thumbnailBase64 = await generateThumbnailBase64(canvasEl)

      const pkg: TemplatePackage = {
        id: `tpl-${Date.now()}`,
        schemaVersion: TEMPLATE_SCHEMA_VERSION,
        name: name.trim(),
        category,
        colorPalette: {
          accent: '#BEFF01', // Ideally extracted from scene colors, hardcoded for now or let user pick
          bgDark: hookScene.bgColor || '#080808',
          textPrimary: '#ffffff'
        },
        fontPair: {
          heading: 'Be Vietnam Pro',
          body: 'Inter'
        },
        hookTemplate: abstractSceneToTemplate(hookScene),
        contentTemplate: abstractSceneToTemplate(contentScene),
        ctaTemplate: abstractSceneToTemplate(ctaScene),
        thumbnailBase64,
        createdAt: new Date().toISOString()
      }

      addTemplate(pkg)
      showToast('Đã lưu Bộ Template thành công!')
      onClose()
    } catch (err: any) {
      showToast('Lỗi lưu Template: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        width: 400, backgroundColor: '#111', borderRadius: 12, padding: 24,
        border: '1px solid #333', color: '#fff', fontFamily: 'Inter'
      }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: 18, color: '#BEFF01' }}>Lưu Bộ Template</h2>
        
        <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#aaa' }}>Tên Template:</label>
        <input 
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="VD: Bộ Mẫu Review Công Nghệ..."
          style={{
            width: '100%', padding: '10px 12px', boxSizing: 'border-box',
            backgroundColor: '#000', border: '1px solid #333', borderRadius: 6,
            color: '#fff', marginBottom: 20
          }}
        />

        <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#aaa' }}>Chủ đề:</label>
        <select
          value={category}
          onChange={(e: any) => setCategory(e.target.value)}
          style={{
            width: '100%', padding: '10px 12px', boxSizing: 'border-box',
            backgroundColor: '#000', border: '1px solid #333', borderRadius: 6,
            color: '#fff', marginBottom: 24
          }}
        >
          <option value="custom">Tuỳ chỉnh cá nhân</option>
          <option value="tech">Công nghệ / Review</option>
          <option value="education">Giáo dục / Kiến thức</option>
          <option value="lifestyle">Đời sống / Vlog</option>
        </select>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <Button 
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            Hủy
          </Button>
          <Button 
            variant="primary"
            size="sm"
            onClick={handleSave}
            loading={saving}
          >
            Lưu Template
          </Button>
        </div>
      </div>
    </div>
  )
}
