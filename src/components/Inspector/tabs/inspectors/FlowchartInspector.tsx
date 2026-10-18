import React from 'react'
import styles from '../Tabs.module.css'
import { InspectorProps, ColorDot, Slider, DeleteIconButton, ColorControlRow, CardBackgroundControl } from './common'
import { Button, SectionHeader } from '@/components/ui'

export function FlowchartInspector({ element, updateElement, showToast }: InspectorProps) {
  const steps = element.flowSteps || [
    { title: 'BƯỚC 1: TIẾP NHẬN', subtitle: 'Phân tích yêu cầu & dữ liệu đầu vào', color: '#BEFF01' },
    { title: 'BƯỚC 2: XỬ LÝ AI', subtitle: 'Truy xuất Vector DB & sinh nội dung', color: '#00D4FF' },
    { title: 'BƯỚC 3: XUẤT KẾT QUẢ', subtitle: 'Hoàn thiện video & bàn giao', color: '#FFB800' },
  ]

  const currentAccent = element.accentColor || 'var(--accent)'

  return (
    <>
      <div className={styles.group}>
        <SectionHeader title="Sơ đồ quy trình (Flowchart)" />

        {/* Tiêu đề quy trình */}
        <div style={{ marginBottom: 8 }}>
          <span className={styles.sliderLabel} style={{ marginBottom: 3, display: 'block', fontSize: 11 }}>Tiêu đề quy trình</span>
          <input
            className={styles.input}
            value={element.content || ''}
            onChange={e => updateElement(element.id, { content: e.target.value })}
            placeholder="VD: QUY TRÌNH XỬ LÝ LOGIC..."
          />
        </div>

        {/* Danh sách các bước */}
        <div style={{ marginTop: 6, marginBottom: 8, padding: '8px 6px', background: 'rgba(0,0,0,0.2)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sub)' }}>Các bước ({steps.length})</span>
            <Button
              variant="secondary"
              size="xs"
              onClick={() => {
                const newSteps = [...steps];
                const num = newSteps.length + 1;
                newSteps.push({
                  title: `BƯỚC ${num}: NỘI DUNG MỚI`,
                  subtitle: 'Mô tả chi tiết bước',
                  color: num % 3 === 1 ? '#BEFF01' : num % 3 === 2 ? '#00D4FF' : '#FFB800'
                });
                updateElement(element.id, { flowSteps: newSteps });
              }}
            >
              + Thêm bước
            </Button>
          </div>

          {steps.map((st, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8, padding: '6px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <ColorDot
                  value={st.color || element.accentColor || '#BEFF01'}
                  sm
                  onChange={c => {
                    const newSteps = [...steps];
                    newSteps[idx] = { ...newSteps[idx], color: c };
                    updateElement(element.id, { flowSteps: newSteps });
                  }}
                />
                <input
                  className={styles.input}
                  style={{ flex: 1, marginBottom: 0, padding: '4px 6px', fontSize: 11, fontWeight: 700 }}
                  value={st.title}
                  placeholder="Tên bước"
                  onChange={e => {
                    const newSteps = [...steps];
                    newSteps[idx] = { ...newSteps[idx], title: e.target.value };
                    updateElement(element.id, { flowSteps: newSteps });
                  }}
                />
                {steps.length > 1 && (
                  <DeleteIconButton
                    onClick={() => {
                      const newSteps = steps.filter((_, i) => i !== idx);
                      updateElement(element.id, { flowSteps: newSteps });
                    }}
                   />
                )}
              </div>
              <input
                className={styles.input}
                style={{ marginBottom: 0, padding: '3px 6px', fontSize: 10, color: 'var(--text-sub)' }}
                value={st.subtitle || ''}
                placeholder="Mô tả phụ / chú thích..."
                onChange={e => {
                  const newSteps = [...steps];
                  newSteps[idx] = { ...newSteps[idx], subtitle: e.target.value };
                  updateElement(element.id, { flowSteps: newSteps });
                }}
              />
            </div>
          ))}
        </div>

        {/* Cấu hình màu & khung nền */}
        <ColorControlRow
          label="Màu chủ đạo"
          value={element.accentColor || '#BEFF01'}
          onChange={c => updateElement(element.id, { accentColor: c })}
        />

        {/* Khung nền sơ đồ */}
        <CardBackgroundControl
          element={element}
          updateElement={updateElement}
          label="Khung nền sơ đồ"
          showBgColor={true}
          showRadius={true}
          defaultRadius={14}
          defaultBgColor="rgba(10, 16, 28, 0.95)"
        />
      </div>
      <div className={styles.divider} />
    </>
  )
}
