import React from 'react'
import styles from '../Tabs.module.css'
import { InspectorProps, ColorControlRow } from './common'
import { DocumentEvidenceVariant } from '@/types/scene'
import { SegmentedControl, SectionHeader } from '@/components/ui'

const VARIANTS = [
  { value: 'highlighter', label: 'Dạ quang' },
  { value: 'stamp', label: 'Con dấu' },
  { value: 'note', label: 'Note 3D' },
]

export function DocumentEvidenceInspector({ element, updateElement, showToast }: InspectorProps) {
  const doc = element.docData || { variant: 'highlighter', title: 'BÁO CÁO MẬT' }

  return (
    <>
      <div className={styles.group}>
        <SectionHeader title="Bằng chứng & tài liệu" />

        {/* Variant Switcher */}
        <div style={{ marginBottom: 10 }}>
          <span style={{ marginBottom: 5, display: 'block', fontSize: 10.5, fontWeight: 600, color: 'var(--text-sub)' }}>
            Kiểu tài liệu
          </span>
          <SegmentedControl
            options={VARIANTS}
            value={doc.variant || 'highlighter'}
            onChange={(val) => {
              const updated = { ...doc, variant: val as any }
              updateElement(element.id, { docData: updated })
              showToast(`Đã chuyển sang ${val}`)
            }}
            size="xs"
            fullWidth
          />
        </div>

        {/* Sub-variant Switcher for Note */}
        {doc.variant === 'note' && (
          <div style={{ marginBottom: 10 }}>
            <span style={{ marginBottom: 5, display: 'block', fontSize: 10.5, fontWeight: 600, color: 'var(--text-sub)' }}>
              Loại giấy note
            </span>
            <SegmentedControl
              options={[
                { value: 'tape-note', label: 'Note vàng' },
                { value: 'torn-paper', label: 'Giấy kẹp ghim' },
              ]}
              value={doc.subVariant || 'tape-note'}
              onChange={(val) => {
                updateElement(element.id, { docData: { ...doc, subVariant: val as any } })
                showToast(`Đã chuyển sang ${val}`)
              }}
              size="xs"
              fullWidth
            />
          </div>
        )}

        {/* Sub-variant Switcher for Stamp */}
        {doc.variant === 'stamp' && (
          <div style={{ marginBottom: 10 }}>
            <span style={{ marginBottom: 5, display: 'block', fontSize: 10.5, fontWeight: 600, color: 'var(--text-sub)' }}>
              Kiểu dáng con dấu
            </span>
            <SegmentedControl
              options={[
                { value: 'secret-box', label: 'Tuyệt mật' },
                { value: 'approved-circle', label: 'Đã duyệt' },
                { value: 'warning-hazard', label: 'Cảnh báo' },
              ]}
              value={doc.stampVariant || (
                doc.title?.includes('DUYỆT') ? 'approved-circle' :
                doc.title?.includes('CẢNH BÁO') || doc.title?.includes('LỪA ĐẢO') ? 'warning-hazard' :
                'secret-box'
              )}
              onChange={(val) => {
                const colors: Record<string, string> = {
                  'secret-box': '#FF2A2A',
                  'approved-circle': '#00E676',
                  'warning-hazard': '#FF1744'
                }
                const color = colors[val] || '#FF2A2A'
                updateElement(element.id, { docData: { ...doc, stampVariant: val as any, accentColor: color }, accentColor: color })
                showToast(`Đã chọn kiểu dấu`)
              }}
              size="xs"
              fullWidth
            />
          </div>
        )}

        {/* Title Input */}
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', fontSize: 10.5, fontWeight: 600, color: 'var(--text-sub)', marginBottom: 3 }}>
            Tiêu đề / Tên tài liệu:
          </label>
          <input
            type="text"
            className={styles.input}
            value={doc.title || ''}
            onChange={e => updateElement(element.id, { docData: { ...doc, title: e.target.value }, content: e.target.value })}
            placeholder="e.g. BÁO CÁO MẬT QUÝ 3"
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        {/* Highlight Phrase Input (Cho bút dạ quang) */}
        {doc.variant === 'highlighter' && (
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', fontSize: 10.5, fontWeight: 600, color: '#FFE600', marginBottom: 3 }}>
              Cụm từ tô dạ quang:
            </label>
            <input
              type="text"
              className={styles.input}
              value={doc.highlight || ''}
              onChange={e => updateElement(element.id, { docData: { ...doc, highlight: e.target.value } })}
              placeholder="e.g. tăng trưởng 300%"
              style={{ width: '100%', boxSizing: 'border-box', borderColor: '#FFE60066' }}
            />
          </div>
        )}

        {/* Content Input */}
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', fontSize: 10.5, fontWeight: 600, color: 'var(--text-sub)', marginBottom: 3 }}>
            Nội dung đoạn trích dẫn:
          </label>
          <textarea
            className={styles.input}
            rows={2}
            value={doc.content || ''}
            onChange={e => updateElement(element.id, { docData: { ...doc, content: e.target.value } })}
            placeholder="Đoạn văn trích dẫn từ tài liệu..."
            style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
          />
        </div>

        {/* Badge Input */}
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--text-sub)', marginBottom: 2 }}>
            Nhãn phụ / Mã hồ sơ:
          </label>
          <input
            type="text"
            className={styles.input}
            value={doc.subtitle || doc.badge || ''}
            onChange={e => updateElement(element.id, { docData: { ...doc, subtitle: e.target.value } })}
            placeholder="e.g. TRANG 04 / #882"
            style={{ width: '100%', boxSizing: 'border-box', fontSize: 10 }}
          />
        </div>

        {/* Color Control */}
        <ColorControlRow
          label="Màu nhấn dạ quang / Dấu"
          value={element.accentColor || doc.accentColor || '#FFE600'}
          onChange={c => updateElement(element.id, { accentColor: c, docData: { ...doc, accentColor: c } })}
        />
      </div>
    </>
  )
}
