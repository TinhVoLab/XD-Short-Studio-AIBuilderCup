import React, { useMemo } from 'react'
import styles from '../Tabs.module.css'
import { InspectorProps, ColorDot, DeleteIconButton, ColorControlRow, CardBackgroundControl } from './common'
import { LandingFxControl } from './shared'
import { Button, SectionHeader } from '@/components/ui'

interface BarItem {
  label: string;
  value: number;
  unit: string;
  color: string;
}

const DEFAULT_BARS: BarItem[] = [
  { label: 'Trước tối ưu', value: 35, unit: '%', color: '#00D4FF' },
  { label: 'Sau tối ưu', value: 88, unit: '%', color: '#00FF88' },
  { label: 'Mục tiêu', value: 95, unit: '%', color: '#FFB800' }
];

export function ChartBarInspector({ element, updateElement }: InspectorProps) {
  if (!element) return null;

  // Safe normalized bars list (bulletproof against non-arrays, sparse arrays, undefined/null objects)
  const bars: BarItem[] = useMemo(() => {
    if (!Array.isArray(element.chartData) || element.chartData.length === 0) {
      return DEFAULT_BARS;
    }
    return element.chartData.map((bar: any, idx: number): BarItem => {
      if (!bar || typeof bar !== 'object') {
        return { label: `Mục ${idx + 1}`, value: 50, unit: '%', color: '#00FF88' };
      }
      return {
        label: typeof bar.label === 'string' ? bar.label : (bar.name ? String(bar.name) : `Mục ${idx + 1}`),
        value: typeof bar.value === 'number' && !isNaN(bar.value) ? bar.value : (Number(bar.value) || 0),
        unit: typeof bar.unit === 'string' ? bar.unit : '%',
        color: typeof bar.color === 'string' && bar.color ? bar.color : '#00FF88',
      };
    });
  }, [element.chartData]);

  const handleUpdateBar = (idx: number, patch: Partial<BarItem>) => {
    const nextBars = bars.map((b, i) => (i === idx ? { ...b, ...patch } : b));
    updateElement(element.id, { chartData: nextBars });
  };

  const handleAddBar = () => {
    const nextBars: BarItem[] = [
      ...bars,
      { label: `Mục ${bars.length + 1}`, value: 60, unit: '%', color: '#FFB800' }
    ];
    updateElement(element.id, { chartData: nextBars });
  };

  const handleDeleteBar = (idx: number) => {
    const nextBars = bars.filter((_, i) => i !== idx);
    updateElement(element.id, { chartData: nextBars });
  };

  return (
    <>
      <div className={styles.group}>
        <SectionHeader title="Biểu đồ cột so sánh" />

        <div style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
            <span className={styles.sliderLabel} style={{ fontSize: 11 }}>Tiêu đề biểu đồ</span>
            {Boolean(element.content) && (
              <button
                type="button"
                onClick={() => updateElement(element.id, { content: '' })}
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
            value={element.content || ''}
            onChange={e => updateElement(element.id, { content: e.target.value })}
            placeholder="Để trống nếu muốn ẩn tiêu đề..."
          />
        </div>

        {/* Bars List Editor */}
        <div style={{ marginTop: 6, marginBottom: 8, padding: '8px 6px', background: 'rgba(0,0,0,0.2)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sub)' }}>Danh sách cột so sánh</span>
            <Button
              variant="secondary"
              size="xs"
              onClick={handleAddBar}
            >
              + Thêm cột
            </Button>
          </div>

          {bars.map((bar, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
              <ColorDot
                value={bar.color || '#00FF88'}
                sm
                onChange={c => handleUpdateBar(idx, { color: c })}
              />
              <input
                className={styles.input}
                style={{ flex: 2, marginBottom: 0, padding: '4px 6px', fontSize: 11 }}
                value={bar.label ?? ''}
                placeholder="Tên cột"
                onChange={e => handleUpdateBar(idx, { label: e.target.value })}
              />
              <input
                type="number"
                className={styles.input}
                style={{ width: 44, marginBottom: 0, padding: '4px 2px', fontSize: 11, textAlign: 'center' }}
                value={bar.value ?? 0}
                placeholder="Số"
                onChange={e => handleUpdateBar(idx, { value: +e.target.value })}
              />
              <input
                className={styles.input}
                style={{ width: 28, marginBottom: 0, padding: '4px 2px', fontSize: 11, textAlign: 'center' }}
                value={bar.unit ?? '%'}
                placeholder="Đơn vị"
                onChange={e => handleUpdateBar(idx, { unit: e.target.value })}
              />
              <DeleteIconButton
                onClick={() => handleDeleteBar(idx)}
                title="Xóa cột này"
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
          defaultBgColor="rgba(14, 18, 28, 0.94)"
        />
      </div>
      <div className={styles.divider} />
    </>
  )
}
