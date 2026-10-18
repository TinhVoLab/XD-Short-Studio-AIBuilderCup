import React from 'react';
import styles from '../Tabs.module.css';
import {
  InspectorProps,
  ColorDot,
  Slider,
  DeleteIconButton,
  ColorControlRow,
  CardBackgroundControl,
} from './common';
import { Button, SectionHeader } from '@/components/ui';

interface TimelineStep {
  title: string;
  subtitle?: string;
  color?: string;
  icon?: string;
}

const DEFAULT_TIMELINE_STEPS: TimelineStep[] = [
  { title: 'Hôm Qua', subtitle: 'Đau buồn & học hỏi' },
  { title: 'Hôm Nay', subtitle: 'Chấp nhận & tĩnh lặng' },
  { title: 'Mai Sau', subtitle: 'Bình an & vững vàng' },
];

export function TimelineInspector({ element, updateElement, showToast }: InspectorProps) {
  const currentTitle = String(element.title ?? element.content ?? '').trim();
  const rawSteps = (element.flowSteps && element.flowSteps.length > 0)
    ? element.flowSteps
    : DEFAULT_TIMELINE_STEPS;
  const steps: TimelineStep[] = rawSteps.length > 0 ? rawSteps : DEFAULT_TIMELINE_STEPS;
  const accent = element.accentColor || element.color || '#00D4FF';

  const saveSteps = (newSteps: TimelineStep[]) => {
    updateElement(element.id, {
      flowSteps: newSteps,
    });
  };

  const handleAddStep = () => {
    const nextIdx = steps.length + 1;
    const newSteps: TimelineStep[] = [
      ...steps,
      {
        title: `Giai đoạn ${nextIdx}`,
        subtitle: 'Mô tả nội dung mốc thời gian',
      },
    ];
    saveSteps(newSteps);
  };

  const handleDeleteStep = (idx: number) => {
    if (steps.length <= 1) return;
    const newSteps = steps.filter((_, i) => i !== idx);
    saveSteps(newSteps);
  };

  const handleUpdateStep = (idx: number, patch: Partial<TimelineStep>) => {
    const newSteps = [...steps];
    newSteps[idx] = { ...newSteps[idx], ...patch };
    saveSteps(newSteps);
  };

  const handleMoveStep = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= steps.length) return;
    const newSteps = [...steps];
    const [moved] = newSteps.splice(idx, 1);
    newSteps.splice(targetIdx, 0, moved);
    saveSteps(newSteps);
  };

  const applyPreset = (presetSteps: TimelineStep[], presetTitle: string) => {
    updateElement(element.id, {
      title: presetTitle,
      content: presetTitle,
      flowSteps: presetSteps,
    });
    if (showToast) showToast('Đã áp dụng mẫu timeline');
  };

  return (
    <>
      <div className={styles.group}>
        <SectionHeader
          title="Dòng thời gian (Timeline)"
          action={
            Boolean(currentTitle) ? (
              <button
                type="button"
                onClick={() => updateElement(element.id, { content: '', title: '' })}
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
            ) : undefined
          }
        />

        {/* Tiêu đề mô tả */}
        <div style={{ marginBottom: 6 }}>
          <span className={styles.sliderLabel} style={{ marginBottom: 3, display: 'block', fontSize: 11 }}>
            Tiêu đề mô tả
          </span>
          <input
            className={styles.input}
            value={currentTitle}
            onChange={(e) => {
              const val = e.target.value;
              updateElement(element.id, { content: val, title: val });
            }}
            placeholder="Để trống nếu muốn ẩn tiêu đề..."
          />
        </div>
        <div style={{ marginBottom: 6 }}>
          <Slider
            label="Cỡ chữ tiêu đề"
            min={12}
            max={20}
            step={1}
            value={element.fontSize || 14}
            display={(s) => `${s}px`}
            onChange={(s) => updateElement(element.id, { fontSize: s })}
          />
        </div>

        {/* Khung nền Obsidian */}
        <CardBackgroundControl
          element={element}
          updateElement={updateElement}
          label="Khung nền Obsidian"
          showWidth={true}
          showBgColor={true}
          showRadius={true}
          defaultRadius={16}
          defaultBgColor="rgba(10, 16, 28, 0.95)"
        />

        {/* Màu chủ đạo */}
        <div style={{ marginTop: 6 }}>
          <ColorControlRow
            label="Màu chủ đạo"
            value={accent}
            onChange={(c) => updateElement(element.id, { accentColor: c, color: c })}
          />
        </div>

        {/* Mẫu nội dung nhanh */}
        <div style={{ marginTop: 10, marginBottom: 4 }}>
          <span className={styles.sliderLabel} style={{ marginBottom: 4, display: 'block', fontSize: 10.5 }}>
            Mẫu nhanh
          </span>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <Button
              variant="secondary"
              size="xs"
              onClick={() =>
                applyPreset(
                  [
                    { title: 'Hôm Qua', subtitle: 'Đau buồn & học hỏi' },
                    { title: 'Hôm Nay', subtitle: 'Chấp nhận & tĩnh lặng' },
                    { title: 'Mai Sau', subtitle: 'Bình an & vững vàng' },
                  ],
                  'DÒNG THỜI GIAN'
                )
              }
            >
              3 Mốc thời gian
            </Button>
            <Button
              variant="secondary"
              size="xs"
              onClick={() =>
                applyPreset(
                  [
                    { title: 'Giai Đoạn 1', subtitle: 'Khởi động & chuẩn bị' },
                    { title: 'Giai Đoạn 2', subtitle: 'Thực thi & tối ưu' },
                    { title: 'Giai Đoạn 3', subtitle: 'Mở rộng quy mô' },
                  ],
                  'LỘ TRÌNH PHÁT TRIỂN'
                )
              }
            >
              Lộ trình 3 bước
            </Button>
            <Button
              variant="secondary"
              size="xs"
              onClick={() =>
                applyPreset(
                  [
                    { title: 'Quý 1', subtitle: 'Xây dựng nền tảng' },
                    { title: 'Quý 2', subtitle: 'Thâm nhập thị trường' },
                    { title: 'Quý 3', subtitle: 'Tăng trưởng doanh thu' },
                    { title: 'Quý 4', subtitle: 'Bứt phá mục tiêu' },
                  ],
                  'KẾ HOẠCH NĂM'
                )
              }
            >
              4 Quý năm
            </Button>
          </div>
        </div>
      </div>

      {/* Danh sách các mốc thời gian */}
      <div className={styles.group}>
        <SectionHeader
          title={`Danh sách mốc (${steps.length})`}
          action={
            <Button variant="secondary" size="xs" onClick={handleAddStep}>
              + Thêm mốc
            </Button>
          }
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
          {steps.map((st, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                padding: '8px 10px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border)',
                borderRadius: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: '#000',
                    background: st.color || accent,
                    padding: '1px 6px',
                    borderRadius: 4,
                  }}
                >
                  #{idx + 1}
                </span>

                <input
                  className={styles.input}
                  style={{ flex: 1, marginBottom: 0, height: 26, fontSize: 11 }}
                  value={st.title}
                  placeholder="Tiêu đề mốc"
                  onChange={(e) => handleUpdateStep(idx, { title: e.target.value })}
                />

                <ColorDot
                  value={st.color || accent}
                  onChange={(c) => handleUpdateStep(idx, { color: c })}
                  sm
                />

                {/* Nút di chuyển lên / xuống */}
                <div style={{ display: 'flex', gap: 2 }}>
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => handleMoveStep(idx, 'up')}
                      title="Di chuyển lên"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-sub)',
                        cursor: 'pointer',
                        padding: '0 2px',
                        fontSize: 10,
                      }}
                    >
                      ▲
                    </button>
                  )}
                  {idx < steps.length - 1 && (
                    <button
                      type="button"
                      onClick={() => handleMoveStep(idx, 'down')}
                      title="Di chuyển xuống"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-sub)',
                        cursor: 'pointer',
                        padding: '0 2px',
                        fontSize: 10,
                      }}
                    >
                      ▼
                    </button>
                  )}
                </div>

                {steps.length > 1 && (
                  <DeleteIconButton onClick={() => handleDeleteStep(idx)} title="Xóa mốc này" />
                )}
              </div>

              <input
                className={styles.input}
                style={{ marginBottom: 0, height: 24, fontSize: 10.5 }}
                value={st.subtitle || ''}
                placeholder="Nội dung mô tả (vd: Đau buồn & học hỏi)"
                onChange={(e) => handleUpdateStep(idx, { subtitle: e.target.value })}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
