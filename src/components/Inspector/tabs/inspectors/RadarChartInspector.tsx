import React, { useMemo } from 'react'
import styles from '../Tabs.module.css'
import { InspectorProps, DeleteIconButton, ColorControlRow, CardBackgroundControl } from './common'
import { Button, SectionHeader } from '@/components/ui'

interface RadarAxisItem {
  label: string;
  value: number;
}

const DEFAULT_RADAR_AXES: RadarAxisItem[] = [
  { label: 'Hiệu năng', value: 92 },
  { label: 'Bảo mật', value: 85 },
  { label: 'Dễ học', value: 78 },
  { label: 'Cộng đồng', value: 95 },
  { label: 'Chi phí', value: 65 }
];

export function RadarChartInspector({ element, updateElement }: InspectorProps) {
  if (!element) return null;

  const axes: RadarAxisItem[] = useMemo(() => {
    if (!Array.isArray(element.chartData) || element.chartData.length === 0) {
      return DEFAULT_RADAR_AXES;
    }
    return element.chartData.map((axis: any, idx: number): RadarAxisItem => {
      if (!axis || typeof axis !== 'object') {
        return { label: `Tiêu chí ${idx + 1}`, value: 70 };
      }
      return {
        label: typeof axis.label === 'string' ? axis.label : (axis.name ? String(axis.name) : `Tiêu chí ${idx + 1}`),
        value: typeof axis.value === 'number' && !isNaN(axis.value) ? axis.value : (Number(axis.value) || 0),
      };
    });
  }, [element.chartData]);

  const handleUpdateAxis = (idx: number, patch: Partial<RadarAxisItem>) => {
    const nextAxes = axes.map((a, i) => (i === idx ? { ...a, ...patch } : a));
    updateElement(element.id, { chartData: nextAxes });
  };

  const handleAddAxis = () => {
    const nextAxes: RadarAxisItem[] = [
      ...axes,
      { label: `Tiêu chí ${axes.length + 1}`, value: 80 }
    ];
    updateElement(element.id, { chartData: nextAxes });
  };

  const handleDeleteAxis = (idx: number) => {
    const nextAxes = axes.filter((_, i) => i !== idx);
    updateElement(element.id, { chartData: nextAxes });
  };

  return (
    <>
      <div className={styles.group}>
        <SectionHeader title="Biểu đồ radar" />

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

        {/* Presets */}
        <div style={{ marginBottom: 8 }}>
          <span className={styles.sliderLabel} style={{ marginBottom: 4, display: 'block', fontSize: 11 }}>Mẫu có sẵn</span>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <Button
              variant="pill"
              size="xs"
              onClick={() => {
                updateElement(element.id, {
                  content: 'ĐÁNH GIÁ CÔNG NGHỆ',
                  chartData: [
                    { label: 'Hiệu năng', value: 92 },
                    { label: 'Bảo mật', value: 85 },
                    { label: 'Dễ học', value: 78 },
                    { label: 'Cộng đồng', value: 95 },
                    { label: 'Chi phí', value: 65 }
                  ]
                });
              }}
            >
              Công nghệ
            </Button>

            <Button
              variant="pill"
              size="xs"
              onClick={() => {
                updateElement(element.id, {
                  content: 'ĐÁNH GIÁ NĂNG LỰC',
                  chartData: [
                    { label: 'Chuyên môn', value: 90 },
                    { label: 'Giao tiếp', value: 82 },
                    { label: 'Lãnh đạo', value: 75 },
                    { label: 'Tư duy', value: 88 },
                    { label: 'Sáng tạo', value: 94 }
                  ]
                });
              }}
            >
              Nhân sự / Leader
            </Button>
          </div>
        </div>

        {/* Criteria List Editor */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span className={styles.sliderLabel} style={{ fontSize: 11 }}>Danh sách tiêu chí ({axes.length})</span>
            <Button
              variant="secondary"
              size="xs"
              onClick={handleAddAxis}
            >
              + Thêm tiêu chí
            </Button>
          </div>

          <div style={{ maxHeight: 150, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, paddingRight: 2 }}>
            {axes.map((axis, aIdx) => (
              <div key={aIdx} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(0,0,0,0.3)', padding: '3px 6px', borderRadius: 6 }}>
                <input
                  style={{ flex: 1.8, fontSize: 10.5, padding: '3px 6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', borderRadius: 4 }}
                  value={axis.label ?? ''}
                  onChange={e => handleUpdateAxis(aIdx, { label: e.target.value })}
                  placeholder="Tên tiêu chí"
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, width: 56, flexShrink: 0 }}>
                  <input
                    type="number"
                    style={{ width: 40, fontSize: 10.5, padding: '3px 2px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#00D4FF', textAlign: 'center', borderRadius: 4 }}
                    value={axis.value ?? 0}
                    min={0}
                    max={100}
                    onChange={e => handleUpdateAxis(aIdx, { value: +e.target.value })}
                  />
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>%</span>
                </div>
                <DeleteIconButton
                  title="Xóa tiêu chí này"
                  onClick={() => handleDeleteAxis(aIdx)}
                />
              </div>
            ))}
          </div>
        </div>

        <ColorControlRow
          label="Màu chủ đạo"
          value={element.accentColor || '#00D4FF'}
          onChange={c => updateElement(element.id, { accentColor: c, color: c })}
        />

        {/* Khung nền thẻ */}
        <CardBackgroundControl
          element={element}
          updateElement={updateElement}
          label="Khung nền thẻ"
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
