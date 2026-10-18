import React from 'react'
import styles from '../Tabs.module.css'
import { InspectorProps, ColorControlRow } from './common'
import { SocialCalloutVariant } from '@/types/scene'
import { SegmentedControl, SectionHeader } from '@/components/ui'

const VARIANTS = [
  { value: 'bank', label: 'Ngân hàng' },
  { value: 'tweet', label: 'Tweet / X' },
  { value: 'chat', label: 'Tin nhắn' },
  { value: 'news', label: 'Bản tin' },
]

export function SocialCalloutInspector({ element, updateElement, showToast }: InspectorProps) {
  const callout = element.calloutData || { variant: 'bank', title: '+100,000,000 đ' }

  return (
    <>
      <div className={styles.group}>
        <SectionHeader 
          title="Social proof callout"
          action={
            <span style={{ fontSize: 9.5, opacity: 0.85, textTransform: 'uppercase', padding: '2px 5px', background: 'var(--surface-3)', borderRadius: 4, color: 'var(--text-muted)' }}>
              {callout.variant}
            </span>
          }
        />

        {/* Variant Switcher */}
        <div style={{ marginBottom: 10 }}>
          <span style={{ marginBottom: 5, display: 'block', fontSize: 10.5, fontWeight: 600, color: 'var(--text-sub)' }}>
            Kiểu thông báo
          </span>
          <SegmentedControl
            options={VARIANTS}
            value={callout.variant || 'bank'}
            onChange={(val) => {
              const updated = { ...callout, variant: val as any }
              updateElement(element.id, { calloutData: updated })
              showToast(`Đã chuyển sang ${val}`)
            }}
            size="xs"
            fullWidth
          />
        </div>

        {/* Title Input (Số tiền / Tên tác giả / Headline) */}
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', fontSize: 10.5, fontWeight: 600, color: 'var(--text-sub)', marginBottom: 3 }}>
            Tiêu đề / Số tiền:
          </label>
          <input
            type="text"
            className={styles.input}
            value={callout.title || ''}
            onChange={e => updateElement(element.id, { calloutData: { ...callout, title: e.target.value }, content: e.target.value })}
            placeholder="e.g. +100,000,000 đ hoặc Elon Musk"
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        {/* Subtitle Input (Ngân hàng / @username) */}
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', fontSize: 10.5, fontWeight: 600, color: 'var(--text-sub)', marginBottom: 3 }}>
            Phụ đề / Tên ngân hàng:
          </label>
          <input
            type="text"
            className={styles.input}
            value={callout.subtitle || ''}
            onChange={e => updateElement(element.id, { calloutData: { ...callout, subtitle: e.target.value } })}
            placeholder="e.g. Vietcombank hoặc @elonmusk"
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        {/* Content Input (Nội dung CK / Nội dung Tweet) */}
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', fontSize: 10.5, fontWeight: 600, color: 'var(--text-sub)', marginBottom: 3 }}>
            Nội dung chi tiết:
          </label>
          <textarea
            className={styles.input}
            rows={2}
            value={callout.content || ''}
            onChange={e => updateElement(element.id, { calloutData: { ...callout, content: e.target.value } })}
            placeholder="Nội dung chuyển khoản hoặc bài đăng..."
            style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
          />
        </div>

        {/* Badge Input */}
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', fontSize: 10.5, fontWeight: 600, color: 'var(--text-sub)', marginBottom: 3 }}>
            Nhãn badge:
          </label>
          <input
            type="text"
            className={styles.input}
            value={callout.badge || ''}
            onChange={e => updateElement(element.id, { calloutData: { ...callout, badge: e.target.value } })}
            placeholder="e.g. THÀNH CÔNG"
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        {/* Color Control */}
        <ColorControlRow
          label="Màu nhấn chủ đạo"
          value={element.accentColor || callout.accentColor || '#00D46A'}
          onChange={c => updateElement(element.id, { accentColor: c, calloutData: { ...callout, accentColor: c } })}
        />
      </div>
    </>
  )
}
