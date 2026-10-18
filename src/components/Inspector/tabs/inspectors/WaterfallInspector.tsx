import React from 'react'
import styles from '../Tabs.module.css'
import { InspectorProps, ColorDot, DeleteIconButton, ColorControlRow, CardBackgroundControl } from './common'
import { Button, SectionHeader } from '@/components/ui'

export function WaterfallInspector({ element, updateElement, showToast, setInspector }: InspectorProps) {
  return (
    <>
          <div className={styles.group}>
        <SectionHeader title="Biểu Đồ Thác Nước" />

            <div style={{ marginBottom: 6 }}>
              <span className={styles.sliderLabel} style={{ marginBottom: 3, display: 'block', fontSize: 11 }}>Tiêu đề biểu đồ</span>
              <input
                className={styles.input}
                value={element.waterfallData?.title || element.content || ''}
                onChange={e => {
                  const val = e.target.value
                  const currentData = element.waterfallData || { steps: [] }
                  updateElement(element.id, { 
                    content: val, 
                    waterfallData: { ...currentData, title: val } 
                  })
                }}
                placeholder="VD: DÒNG TIỀN DOANH NGHIỆP..."
              />
            </div>

            {/* Steps List Editor */}
            <div style={{ marginTop: 6, marginBottom: 8, padding: '8px 6px', background: 'rgba(0,0,0,0.2)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sub)' }}>Danh sách bước dòng tiền</span>
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => {
                    const currentData = element.waterfallData || { title: 'DÒNG TIỀN', steps: [] }
                    const steps = [...(currentData.steps || [])];
                    steps.push({ label: `Khoản ${steps.length + 1}`, amount: -15, type: 'subtract', color: '#FF3366' });
                    updateElement(element.id, { waterfallData: { ...currentData, steps } });
                  }}
                >
                  + Thêm bước
                </Button>
              </div>

              {(element.waterfallData?.steps || [
                { label: 'Doanh thu', amount: 100, type: 'start', color: '#00FF88' },
                { label: 'Vận hành', amount: -35, type: 'subtract', color: '#FF3366' },
                { label: 'Marketing', amount: -20, type: 'subtract', color: '#FF3366' },
                { label: 'Thuế TNDN', amount: -10, type: 'subtract', color: '#FF3366' },
                { label: 'Lợi nhuận', amount: 35, type: 'total', color: '#FFD700' },
              ]).map((st, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <select
                    className={styles.select}
                    style={{ width: 68, marginBottom: 0, padding: '3px 4px', fontSize: 10 }}
                    value={st.type}
                    onChange={e => {
                      const currentData = element.waterfallData || { title: 'DÒNG TIỀN', steps: [] };
                      const steps = [...(currentData.steps || [])];
                      const newType = e.target.value as any;
                      const defaultColor = newType === 'start' ? '#00FF88' : newType === 'total' ? '#FFD700' : newType === 'subtract' ? '#FF3366' : '#00D4FF';
                      steps[idx] = { ...steps[idx], type: newType, color: defaultColor };
                      updateElement(element.id, { waterfallData: { ...currentData, steps } });
                    }}
                  >
                    <option value="start">Gốc (+)</option>
                    <option value="add">Cộng (+)</option>
                    <option value="subtract">Trừ (-)</option>
                    <option value="total">Tổng (=)</option>
                  </select>
                  <ColorDot
                    value={st.color || '#00FF88'}
                    sm
                    onChange={c => {
                      const currentData = element.waterfallData || { title: 'DÒNG TIỀN', steps: [] };
                      const steps = [...(currentData.steps || [])];
                      steps[idx] = { ...steps[idx], color: c };
                      updateElement(element.id, { waterfallData: { ...currentData, steps } });
                    }}
                  />
                  <input
                    className={styles.input}
                    style={{ flex: 1.8, marginBottom: 0, padding: '4px 6px', fontSize: 11 }}
                    value={st.label}
                    placeholder="Tên khoản"
                    onChange={e => {
                      const currentData = element.waterfallData || { title: 'DÒNG TIỀN', steps: [] };
                      const steps = [...(currentData.steps || [])];
                      steps[idx] = { ...steps[idx], label: e.target.value };
                      updateElement(element.id, { waterfallData: { ...currentData, steps } });
                    }}
                  />
                  <input
                    type="number"
                    className={styles.input}
                    style={{ width: 44, marginBottom: 0, padding: '4px 2px', fontSize: 11, textAlign: 'center' }}
                    value={st.amount}
                    placeholder="Số"
                    onChange={e => {
                      const currentData = element.waterfallData || { title: 'DÒNG TIỀN', steps: [] };
                      const steps = [...(currentData.steps || [])];
                      steps[idx] = { ...steps[idx], amount: +e.target.value };
                      updateElement(element.id, { waterfallData: { ...currentData, steps } });
                    }}
                  />
                  <DeleteIconButton
                    onClick={() => {
                      const currentData = element.waterfallData || { title: 'DÒNG TIỀN', steps: [] };
                      const steps = (currentData.steps || []).filter((_, i) => i !== idx);
                      updateElement(element.id, { waterfallData: { ...currentData, steps } });
                    }}
                    title="Xóa mục này"
                  />
                </div>
              ))}
            </div>

            <ColorControlRow
              label="Màu chủ đạo"
              value={element.accentColor || '#FFD700'}
              onChange={c => updateElement(element.id, { accentColor: c })}
            />

            <CardBackgroundControl
              element={element}
              updateElement={updateElement}
              defaultRadius={16}
              showBgColor={true}
              defaultBgColor="rgba(20, 24, 34, 0.85)"
            />
          </div>
          <div className={styles.divider} />
        </>
  )
}
