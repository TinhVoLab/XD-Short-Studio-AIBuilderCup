import React, { useMemo } from 'react'
import styles from '../Tabs.module.css'
import { InspectorProps, DeleteIconButton, ColorControlRow, CardBackgroundControl } from './common'
import { Button, SectionHeader } from '@/components/ui'

interface LinePointItem {
  label: string;
  value: number;
}

const DEFAULT_LINE_POINTS: LinePointItem[] = [
  { label: 'T1', value: 25 }, 
  { label: 'T2', value: 45 }, 
  { label: 'T3', value: 38 }, 
  { label: 'T4', value: 85 }, 
  { label: 'T5', value: 70 },
  { label: 'T6', value: 110 }
];

export function LineChartInspector({ element, updateElement }: InspectorProps) {
  if (!element) return null;

  const points: LinePointItem[] = useMemo(() => {
    if (!Array.isArray(element.chartData) || element.chartData.length === 0) {
      return DEFAULT_LINE_POINTS;
    }
    return element.chartData.map((pt: any, idx: number): LinePointItem => {
      if (!pt || typeof pt !== 'object') {
        return { label: `T${idx + 1}`, value: 50 };
      }
      return {
        label: typeof pt.label === 'string' ? pt.label : (pt.name ? String(pt.name) : `T${idx + 1}`),
        value: typeof pt.value === 'number' && !isNaN(pt.value) ? pt.value : (Number(pt.value) || 0),
      };
    });
  }, [element.chartData]);

  const handleUpdatePoint = (idx: number, patch: Partial<LinePointItem>) => {
    const nextPoints = points.map((p, i) => (i === idx ? { ...p, ...patch } : p));
    updateElement(element.id, { chartData: nextPoints });
  };

  const handleAddPoint = () => {
    const nextPoints: LinePointItem[] = [
      ...points,
      { label: `T${points.length + 1}`, value: 90 }
    ];
    updateElement(element.id, { chartData: nextPoints });
  };

  const handleDeletePoint = (idx: number) => {
    const nextPoints = points.filter((_, i) => i !== idx);
    updateElement(element.id, { chartData: nextPoints });
  };

  return (
    <>
      <div className={styles.group}>
        <SectionHeader title="Biểu đồ đường xu hướng" />

        <div style={{ marginBottom: 6 }}>
          <span className={styles.sliderLabel} style={{ marginBottom: 3, display: 'block', fontSize: 11 }}>Tiêu đề biểu đồ</span>
          <input
            className={styles.input}
            value={element.content || ''}
            onChange={e => updateElement(element.id, { content: e.target.value })}
            placeholder="VD: XU HƯỚNG TĂNG TRƯỞNG..."
          />
        </div>

        {/* Data Points List Editor */}
        <div style={{ marginTop: 6, marginBottom: 8, padding: '8px 6px', background: 'rgba(0,0,0,0.2)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sub)' }}>Danh sách điểm dữ liệu</span>
            <Button
              variant="secondary"
              size="xs"
              onClick={handleAddPoint}
            >
              + Thêm điểm
            </Button>
          </div>

          {points.map((pt, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <input
                className={styles.input}
                style={{ flex: 1.5, marginBottom: 0, padding: '4px 6px', fontSize: 11 }}
                value={pt.label ?? ''}
                placeholder="Mốc (T1, Q1...)"
                onChange={e => handleUpdatePoint(idx, { label: e.target.value })}
              />
              <input
                type="number"
                className={styles.input}
                style={{ flex: 1, marginBottom: 0, padding: '4px 4px', fontSize: 11, textAlign: 'center' }}
                value={pt.value ?? 0}
                placeholder="Giá trị"
                onChange={e => handleUpdatePoint(idx, { value: +e.target.value })}
              />
              <DeleteIconButton
                onClick={() => handleDeletePoint(idx)}
                title="Xóa mục này"
              />
            </div>
          ))}
        </div>

        <ColorControlRow
          label="Màu đường vẽ"
          value={element.accentColor || '#00FF88'}
          onChange={c => updateElement(element.id, { accentColor: c, color: c })}
        />

        {/* Khung nền biểu đồ */}
        <CardBackgroundControl
          element={element}
          updateElement={updateElement}
          label="Khung nền biểu đồ"
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
