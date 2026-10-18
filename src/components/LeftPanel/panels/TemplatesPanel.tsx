import React, { useState } from 'react'
import { useEditorStore } from '@/store/useEditorStore'
import { useShallow } from 'zustand/react/shallow'
import { useTemplateStore } from '@/store/useTemplateStore'
import { TEMPLATES_CATALOG, TEMPLATE_CATEGORIES } from '@/config/templatesCatalog'
import { templateService } from '@/services/templateService'
import styles from './Panels.module.css'
import { Button, ButtonGroup, SegmentedControl } from '@/components/ui'
import HookLibraryPanel from './HookLibraryPanel/HookLibraryPanel'

export default function TemplatesPanel() {
  const [templateTab, setTemplateTab] = useState<'hook' | 'video'>('video')
  const { templates, removeTemplate } = useTemplateStore()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const { showToast, openAiWizardWithTemplate } = useEditorStore(
    useShallow(s => ({
      showToast: s.showToast,
      openAiWizardWithTemplate: s.openAiWizardWithTemplate,
    }))
  )

  const filteredCatalog = selectedCategory === 'all'
    ? TEMPLATES_CATALOG
    : TEMPLATES_CATALOG.filter(t => t.category === selectedCategory)

  const handleApplyBuiltin = (id: string, mode: 'replace' | 'append') => {
    try {
      templateService.applyTemplate(id, mode)
    } catch (e: any) {
      showToast(e.message)
    }
  }

  const handleApplyCustom = (pkg: any) => {
    showToast(`Đã chọn mẫu layout: ${pkg.name}. Hãy mở AI Wizard để sinh video với template này!`)
  }

  const handleDeleteCustom = (id: string) => {
    if (confirm('Bạn có chắc muốn xoá mẫu này?')) {
      try {
        removeTemplate(id)
        showToast('Đã xoá mẫu.')
      } catch (e: any) {
        showToast(e.message)
      }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      {/* ── Sub-tab Switcher: Hook Scenes vs Full Video Templates ── */}
      <div style={{ padding: 'var(--space-2) var(--space-3) var(--space-1)', flexShrink: 0 }}>
        <SegmentedControl
          options={[
            { value: 'hook', label: 'Cảnh Hook' },
            { value: 'video', label: 'Toàn Video' },
          ]}
          value={templateTab}
          onChange={(val) => setTemplateTab(val as any)}
          size="sm"
          fullWidth
        />
      </div>

      {templateTab === 'hook' ? (
        <HookLibraryPanel />
      ) : (
        <>
          {/* ── 1. KHO MẪU HỆ THỐNG ────────────────────────────── */}
          <div className={styles.section} style={{ paddingBottom: 'var(--space-4)' }}>
        <div className={styles.sectionHdr}>
          <span>KHO MẪU VIDEO</span>
          <span className={styles.tag}>{filteredCatalog.length} Mẫu</span>
        </div>
        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', margin: '0 0 var(--space-2) 0', lineHeight: 'var(--lh-normal)' }}>
          Mẫu kịch bản hoàn chỉnh chuẩn Studio TikTok / Reels 9:16. Bấm để áp dụng ngay.
        </p>

        {/* Category Select Dropdown */}
        <div style={{ marginBottom: 'var(--space-2)' }}>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              width: '100%',
              height: 32,
              fontSize: 'var(--font-sm)',
              fontWeight: 'var(--fw-medium)',
              padding: '4px var(--space-2)',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text)',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {TEMPLATE_CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Catalog Cards */}
        <div className={styles.templateList} style={{ padding: 0 }}>
          {filteredCatalog.map(tpl => (
            <div key={tpl.id} className={styles.templateCard}>
              {/* Header: Title + Dot + Badge + Scene Count (1 Row) */}
              <div className={styles.templateHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: 'var(--radius-full)',
                    background: tpl.accentColor || 'var(--accent)',
                    boxShadow: `0 0 6px ${tpl.accentColor || 'var(--accent)'}`,
                    flexShrink: 0
                  }} />
                  <span className={styles.templateTitle} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {tpl.name}
                  </span>
                  {tpl.badge && (
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: '4px',
                      background: `${tpl.accentColor}18`,
                      color: tpl.accentColor,
                      border: `1px solid ${tpl.accentColor}35`,
                      flexShrink: 0
                    }}>
                      {tpl.badge}
                    </span>
                  )}
                </div>
                <span className={styles.templateCount} style={{ flexShrink: 0, marginLeft: 6 }}>
                  {tpl.sceneCount} cảnh
                </span>
              </div>

              {/* Description: 2 lines max, clean font */}
              <div 
                className={styles.templateDesc}
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: 1.35,
                  fontSize: '11px',
                  color: 'var(--text-muted)'
                }}
              >
                {tpl.description}
              </div>

              {/* Actions: Unified 1 Row (Primary AI button + Attached Secondary & Append button) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <Button
                  variant="primary"
                  size="xs"
                  leftIcon={
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" />
                    </svg>
                  }
                  onClick={() => openAiWizardWithTemplate(tpl.id, tpl.suggestedPrompt)}
                  title="Mở AI Wizard để tự động tạo nội dung theo khung mẫu này"
                  style={{ flex: 1, whiteSpace: 'nowrap' }}
                >
                  AI Kịch Bản
                </Button>
                <ButtonGroup attached>
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={() => handleApplyBuiltin(tpl.id, 'replace')}
                    title="Thay thế toàn bộ timeline hiện tại bằng mẫu này"
                    style={{ whiteSpace: 'nowrap', padding: '0 8px' }}
                  >
                    Mẫu Trống
                  </Button>
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={() => handleApplyBuiltin(tpl.id, 'append')}
                    title="Nối tiếp các cảnh này vào cuối video"
                    style={{ padding: '0 7px' }}
                  >
                    +
                  </Button>
                </ButtonGroup>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 2. BỘ LAYOUT ĐÃ LƯU CỦA BẠN ───────────────────── */}
      <div className={styles.section} style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--space-4)' }}>
        <div className={styles.sectionHdr}>
          <span>LAYOUT ĐÃ LƯU</span>
          <span className={styles.tag}>{templates.length} Mẫu</span>
        </div>
        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', margin: '0 0 var(--space-2) 0', lineHeight: 'var(--lh-normal)' }}>
          Lưu layout hiện tại thành template bằng nút "Lưu Template" ở thanh trên.
        </p>

        {templates.length === 0 ? (
          <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--font-sm)', border: '1px dashed var(--border-2)', borderRadius: 'var(--radius-sm)' }}>
            Chưa có layout cá nhân nào được lưu.
          </div>
        ) : (
          <div className={styles.templateList} style={{ padding: 0 }}>
            {templates.map(tpl => (
              <div key={tpl.id} className={styles.templateCard}>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  {tpl.thumbnailBase64 ? (
                    <img src={tpl.thumbnailBase64} alt={tpl.name} style={{ width: 48, height: 85, objectFit: 'cover', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)' }} />
                  ) : (
                    <div style={{ width: 48, height: 85, background: 'var(--surface-1)', borderRadius: 'var(--radius-xs)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                  )}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <div className={styles.templateTitle} style={{ fontSize: 'var(--font-base)' }}>{tpl.name}</div>
                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: 2, marginBottom: 'var(--space-2)' }}>
                      {tpl.category === 'custom' ? 'Tuỳ chỉnh' : tpl.category} • {tpl.hookTemplate?.elements?.length || 3} phần tử
                    </div>
                    <div className={styles.templateActions} style={{ marginTop: 'auto' }}>
                      <ButtonGroup attached={!tpl.isBuiltIn}>
                        <Button 
                          variant="primary"
                          size="xs"
                          onClick={() => handleApplyCustom(tpl)}
                        >
                          Dùng mẫu
                        </Button>
                        {!tpl.isBuiltIn && (
                          <Button 
                            variant="danger"
                            size="xs"
                            onClick={() => handleDeleteCustom(tpl.id)}
                          >
                            Xoá
                          </Button>
                        )}
                      </ButtonGroup>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  )
}

