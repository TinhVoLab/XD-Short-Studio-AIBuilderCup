import React from 'react'
import styles from '../Tabs.module.css'
import { InspectorProps, ColorDot, Slider, DeleteIconButton, ColorControlRow, CardBackgroundControl } from './common'
import { Button, SectionHeader } from '@/components/ui'

export function SankeyChartInspector({ element, updateElement }: InspectorProps) {
  const currentTitle = element.sankeyData?.title || element.content || ''
  const currentData = element.sankeyData || {
    title: 'PHÂN RÃ DÒNG TIỀN',
    source: '100 Triệu',
    sourceValue: 'DOANH THU',
    flows: []
  }

  return (
    <>
      <div className={styles.group}>
        <SectionHeader title="Dòng tiền Sankey" />

        {/* Tiêu đề biểu đồ */}
        <div style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
            <span className={styles.sliderLabel} style={{ fontSize: 11 }}>Tiêu đề biểu đồ</span>
            {Boolean(currentTitle) && (
              <button
                type="button"
                onClick={() => updateElement(element.id, {
                  content: '',
                  sankeyData: { ...currentData, title: '' }
                })}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  fontSize: 10,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Xoá cho gọn
              </button>
            )}
          </div>
          <input
            className={styles.input}
            value={currentTitle}
            onChange={e => {
              const val = e.target.value
              updateElement(element.id, { 
                content: val, 
                sankeyData: { ...currentData, title: val } 
              })
            }}
            placeholder="Để trống nếu muốn ẩn tiêu đề..."
          />
        </div>

        {/* Nguồn dòng tiền: Tên nguồn & Tổng tiền */}
        <div className={styles.row2} style={{ marginBottom: 6 }}>
          <div style={{ minWidth: 0 }}>
            <span className={styles.sliderLabel} style={{ marginBottom: 2, display: 'block', fontSize: 10.5 }}>Tên nguồn</span>
            <input
              className={styles.input}
              value={element.sankeyData?.sourceValue || 'DOANH THU'}
              onChange={e => {
                const val = e.target.value
                updateElement(element.id, { sankeyData: { ...currentData, sourceValue: val } })
              }}
              placeholder="DOANH THU"
            />
          </div>
          <div style={{ minWidth: 0 }}>
            <span className={styles.sliderLabel} style={{ marginBottom: 2, display: 'block', fontSize: 10.5 }}>Tổng tiền</span>
            <input
              className={styles.input}
              value={element.sankeyData?.source || '100 Triệu'}
              onChange={e => {
                const val = e.target.value
                updateElement(element.id, { sankeyData: { ...currentData, source: val } })
              }}
              placeholder="100 Triệu"
            />
          </div>
        </div>

        {/* Flows / Danh sách các nhánh dòng tiền */}
        <div style={{ marginTop: 6, marginBottom: 8, padding: '8px 6px', background: 'rgba(0,0,0,0.2)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sub)' }}>Danh sách nhánh dòng tiền</span>
            <Button
              variant="secondary"
              size="xs"
              onClick={() => {
                const flows = [...(currentData.flows || [
                  { label: 'Vận hành', value: '45 Tr', percent: 45, color: '#FF3366' },
                  { label: 'Marketing', value: '25 Tr', percent: 25, color: '#FFB800' },
                  { label: 'Lợi nhuận', value: '30 Tr', percent: 30, color: element.accentColor || '#BEFF01' },
                ])];
                flows.push({ label: `Nhánh ${flows.length + 1}`, value: '20 Tr', percent: 20, color: element.accentColor || '#BEFF01' });
                updateElement(element.id, { sankeyData: { ...currentData, flows } });
              }}
            >
              + Thêm nhánh
            </Button>
          </div>

          {(element.sankeyData?.flows || [
            { label: 'Vận hành', value: '45 Tr', percent: 45, color: '#FF3366' },
            { label: 'Marketing', value: '25 Tr', percent: 25, color: '#FFB800' },
            { label: 'Lợi nhuận', value: '30 Tr', percent: 30, color: '#BEFF01' },
          ]).map((flow, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
              <ColorDot
                value={flow.color || '#BEFF01'}
                sm
                onChange={c => {
                  const flows = [...(currentData.flows || [])];
                  flows[idx] = { ...flows[idx], color: c };
                  updateElement(element.id, { sankeyData: { ...currentData, flows } });
                }}
              />
              <input
                className={styles.input}
                style={{ flex: 2, marginBottom: 0, padding: '4px 6px', fontSize: 11 }}
                value={flow.label}
                placeholder="Tên nhánh"
                onChange={e => {
                  const flows = [...(currentData.flows || [])];
                  flows[idx] = { ...flows[idx], label: e.target.value };
                  updateElement(element.id, { sankeyData: { ...currentData, flows } });
                }}
              />
              <input
                className={styles.input}
                style={{ flex: 1.2, marginBottom: 0, padding: '4px 6px', fontSize: 11 }}
                value={flow.value}
                placeholder="Giá trị"
                onChange={e => {
                  const flows = [...(currentData.flows || [])];
                  flows[idx] = { ...flows[idx], value: e.target.value };
                  updateElement(element.id, { sankeyData: { ...currentData, flows } });
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, width: 44, flexShrink: 0 }}>
                <input
                  type="number"
                  className={styles.input}
                  style={{ width: 34, marginBottom: 0, padding: '4px 2px', fontSize: 11, textAlign: 'center' }}
                  value={flow.percent}
                  min={1}
                  max={100}
                  onChange={e => {
                    const flows = [...(currentData.flows || [])];
                    flows[idx] = { ...flows[idx], percent: +e.target.value };
                    updateElement(element.id, { sankeyData: { ...currentData, flows } });
                  }}
                />
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>%</span>
              </div>
              <DeleteIconButton
                onClick={() => {
                  const flows = (currentData.flows || []).filter((_, i) => i !== idx);
                  updateElement(element.id, { sankeyData: { ...currentData, flows } });
                }}
                title="Xóa mục này"
              />
            </div>
          ))}
        </div>

        <ColorControlRow
          label="Màu chủ đạo"
          value={element.accentColor || '#BEFF01'}
          onChange={c => updateElement(element.id, { accentColor: c })}
        />

        {/* Khung nền biểu đồ */}
        <CardBackgroundControl
          element={element}
          updateElement={updateElement}
          label="Khung nền biểu đồ"
          showWidth={true}
          showBgColor={true}
          showRadius={true}
          defaultRadius={16}
          defaultBgColor="rgba(10, 16, 28, 0.95)"
        />
      </div>
      <div className={styles.divider} />
    </>
  )
}
