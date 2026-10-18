import React, { useMemo } from 'react'
import styles from '../Tabs.module.css'
import { InspectorProps, ColorDot, DeleteIconButton, ColorControlRow, CardBackgroundControl } from './common'
import { LandingFxControl } from './shared'
import { Button, SectionHeader } from '@/components/ui'

interface PieSliceItem {
  label: string;
  value: number;
  color: string;
}

const DEFAULT_PIE_SLICES: PieSliceItem[] = [
  { label: 'Mobile App', value: 45, color: '#00FF88' },
  { label: 'Desktop Web', value: 35, color: '#00D4FF' },
  { label: 'Tablet & Khác', value: 20, color: '#FFB800' }
];

export function PieChartInspector({ element, updateElement }: InspectorProps) {
  if (!element) return null;

  const slices: PieSliceItem[] = useMemo(() => {
    if (!Array.isArray(element.chartData) || element.chartData.length === 0) {
      return DEFAULT_PIE_SLICES;
    }
    return element.chartData.map((slice: any, idx: number): PieSliceItem => {
      if (!slice || typeof slice !== 'object') {
        return { label: `Mục ${idx + 1}`, value: 30, color: '#00FF88' };
      }
      return {
        label: typeof slice.label === 'string' ? slice.label : (slice.name ? String(slice.name) : `Mục ${idx + 1}`),
        value: typeof slice.value === 'number' && !isNaN(slice.value) ? slice.value : (Number(slice.value) || 0),
        color: typeof slice.color === 'string' && slice.color ? slice.color : '#00FF88',
      };
    });
  }, [element.chartData]);

  const handleUpdateSlice = (idx: number, patch: Partial<PieSliceItem>) => {
    const nextSlices = slices.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    updateElement(element.id, { chartData: nextSlices });
  };

  const handleAddSlice = () => {
    const nextSlices: PieSliceItem[] = [
      ...slices,
      { label: `Mục ${slices.length + 1}`, value: 20, color: '#FFB800' }
    ];
    updateElement(element.id, { chartData: nextSlices });
  };

  const handleDeleteSlice = (idx: number) => {
    const nextSlices = slices.filter((_, i) => i !== idx);
    updateElement(element.id, { chartData: nextSlices });
  };

  return (
    <>
      <div className={styles.group}>
        <SectionHeader title="Biểu đồ tròn cơ cấu" />

        <div style={{ marginBottom: 6 }}>
          <span className={styles.sliderLabel} style={{ marginBottom: 3, display: 'block', fontSize: 11 }}>Tiêu đề biểu đồ</span>
          <input
            className={styles.input}
            value={element.content || ''}
            onChange={e => updateElement(element.id, { content: e.target.value })}
            placeholder="VD: CƠ CẤU PHÂN BỔ..."
          />
        </div>

        {/* Slices List Editor */}
        <div style={{ marginTop: 6, marginBottom: 8, padding: '8px 6px', background: 'rgba(0,0,0,0.2)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sub)' }}>Danh sách phần cơ cấu</span>
            <Button
              variant="secondary"
              size="xs"
              onClick={handleAddSlice}
            >
              + Thêm phần
            </Button>
          </div>

          {slices.map((slice, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
              <ColorDot
                value={slice.color || '#00FF88'}
                sm
                onChange={c => handleUpdateSlice(idx, { color: c })}
              />
              <input
                className={styles.input}
                style={{ flex: 2, marginBottom: 0, padding: '4px 6px', fontSize: 11 }}
                value={slice.label ?? ''}
                placeholder="Tên phần"
                onChange={e => handleUpdateSlice(idx, { label: e.target.value })}
              />
              <input
                type="number"
                className={styles.input}
                style={{ width: 48, marginBottom: 0, padding: '4px 2px', fontSize: 11, textAlign: 'center' }}
                value={slice.value ?? 0}
                placeholder="Số"
                onChange={e => handleUpdateSlice(idx, { value: +e.target.value })}
              />
              <DeleteIconButton
                onClick={() => handleDeleteSlice(idx)}
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

        <LandingFxControl element={element} updateElement={updateElement} />

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
