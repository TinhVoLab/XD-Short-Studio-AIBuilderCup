import React from 'react';
import styles from '../Tabs.module.css';
import { InspectorProps, ColorDot, DeleteIconButton } from './common';
import { RoadmapFlowData, RoadmapMilestoneItem } from '@/types/scene';
import { Button, SegmentedControl, SectionHeader } from '@/components/ui';

export function RoadmapFlowInspector({ element, updateElement }: InspectorProps) {
  const data: RoadmapFlowData = element.roadmapFlowData || {
    title: 'LỘ TRÌNH ĐỘT PHÁ',
    milestones: [
      { id: 'm1', stage: 'BƯỚC 1', title: 'Nền Tảng Core', subLabel: 'HTML, CSS & JS', icon: '🌱', color: '#00D4FF', status: 'completed', badge: 'DONE' },
      { id: 'm2', stage: 'BƯỚC 2', title: 'Frontend Pro', subLabel: 'React, Zustand & UI', icon: '⚡', color: '#BEFF01', status: 'active', badge: 'HIỆN TẠI' },
      { id: 'm3', stage: 'BƯỚC 3', title: 'Cloud & API', subLabel: 'Node, Postgre & CI/CD', icon: '🚀', color: '#FFB800', status: 'locked', badge: 'MỤC TIÊU' },
      { id: 'm4', stage: 'BƯỚC 4', title: 'AI Engineering', subLabel: 'LLM Agents & Remotion', icon: '👑', color: '#A855F7', status: 'locked', badge: 'ĐỈNH CAO' },
    ],
    layoutStyle: 'zigzag',
  };

  const milestones: RoadmapMilestoneItem[] = data.milestones || [];
  const currentAccent = element.accentColor || '#BEFF01';
  const packetColor = data.packetColor || currentAccent;
  const wireColor = data.wireColor || 'rgba(255, 255, 255, 0.2)';

  const updateMilestones = (newMilestones: RoadmapMilestoneItem[]) => {
    updateElement(element.id, {
      roadmapFlowData: {
        ...data,
        milestones: newMilestones,
      },
    });
  };

  const addMilestone = () => {
    if (milestones.length >= 6) return;
    const newIdx = milestones.length + 1;
    const colors = ['#00D4FF', '#BEFF01', '#FFB800', '#A855F7', '#EC4899', '#38BDF8'];
    const newMilestone: RoadmapMilestoneItem = {
      id: `m_${Date.now()}`,
      stage: `BƯỚC ${newIdx}`,
      title: `Mục Tiêu ${newIdx}`,
      subLabel: 'Mô tả chi tiết mốc',
      icon: '🎯',
      color: colors[(newIdx - 1) % colors.length],
      status: 'locked',
      badge: 'TIẾP THEO',
    };
    updateMilestones([...milestones, newMilestone]);
  };

  const removeMilestone = (id: string) => {
    if (milestones.length <= 2) return;
    updateMilestones(milestones.filter(m => m.id !== id));
  };

  const updateMilestoneItem = (id: string, partial: Partial<RoadmapMilestoneItem>) => {
    updateMilestones(milestones.map(m => (m.id === id ? { ...m, ...partial } : m)));
  };

  return (
    <>
      <div className={styles.group}>
        <SectionHeader title="Lộ trình & milestone (Roadmap)" />

        {/* Tiêu đề Header */}
        <div style={{ marginBottom: 10 }}>
          <span style={{ fontSize: 11, color: 'var(--text-sub)', display: 'block', marginBottom: 4 }}>
            Tiêu đề lộ trình:
          </span>
          <input
            className={styles.input}
            style={{ width: '100%', marginBottom: 0 }}
            value={data.title || ''}
            placeholder="VD: LỘ TRÌNH PHÁT TRIỂN PRO"
            onChange={e => {
              updateElement(element.id, {
                roadmapFlowData: { ...data, title: e.target.value },
              });
            }}
          />
        </div>

        {/* Cấu hình màu sắc tia laser & đường dây */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10,
            padding: '6px 8px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-sub)' }}>Laser dẫn:</span>
            <ColorDot
              value={packetColor}
              sm
              onChange={c => {
                updateElement(element.id, {
                  roadmapFlowData: { ...data, packetColor: c },
                });
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-sub)' }}>Đường cáp:</span>
            <ColorDot
              value={wireColor}
              sm
              onChange={c => {
                updateElement(element.id, {
                  roadmapFlowData: { ...data, wireColor: c },
                });
              }}
            />
          </div>
        </div>

        {/* Chuyển đổi Bố Cục (Zigzag / Trục thẳng) */}
        <div style={{ marginBottom: 12 }}>
          <SegmentedControl
            options={[
              { value: 'zigzag', label: 'Zigzag (9:16)' },
              { value: 'linear-left', label: 'Trục trái' },
              { value: 'linear-right', label: 'Trục phải' }
            ]}
            value={data.layoutStyle || 'zigzag'}
            onChange={(val) => {
              updateElement(element.id, {
                roadmapFlowData: { ...data, layoutStyle: val as any },
              });
            }}
            size="xs"
            fullWidth
          />
        </div>

        {/* ── DANH SÁCH CÁC CỘT MỐC MILESTONE ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#FFF' }}>
            Các trạm mốc ({milestones.length}/6)
          </span>
          {milestones.length < 6 && (
            <Button
              variant="secondary"
              size="xs"
              onClick={addMilestone}
            >
              + Thêm Mốc
            </Button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {milestones.map((m, idx) => {
            const mColor = m.color || currentAccent;
            return (
              <div
                key={m.id || idx}
                style={{
                  padding: '8px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 6,
                  border: `1px solid ${mColor}44`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ColorDot
                      value={mColor}
                      sm
                      onChange={c => updateMilestoneItem(m.id, { color: c })}
                    />
                    <input
                      className={styles.input}
                      style={{ width: 68, marginBottom: 0, padding: '2px 4px', fontSize: 9, fontWeight: 700, color: mColor }}
                      value={m.stage || ''}
                      placeholder="BƯỚC 1"
                      onChange={e => updateMilestoneItem(m.id, { stage: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {/* Select Status */}
                    <select
                      className={styles.select}
                      style={{ width: 75, padding: '2px 4px', fontSize: 9, marginBottom: 0 }}
                      value={m.status || 'locked'}
                      onChange={e => updateMilestoneItem(m.id, { status: e.target.value as any })}
                    >
                      <option value="completed">Hoàn tất</option>
                      <option value="active">Hiện tại</option>
                      <option value="locked">Khóa</option>
                    </select>

                    {milestones.length > 2 && (
                      <DeleteIconButton
                        onClick={() => removeMilestone(m.id)}
                        title="Xóa mốc này"
                      />
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                  <input
                    className={styles.input}
                    style={{ width: 32, textAlign: 'center', marginBottom: 0, padding: '4px 2px', fontSize: 13 }}
                    value={m.icon || ''}
                    placeholder="Icon"
                    onChange={e => updateMilestoneItem(m.id, { icon: e.target.value })}
                  />
                  <input
                    className={styles.input}
                    style={{ flex: 1, marginBottom: 0, padding: '4px 8px', fontSize: 11 }}
                    value={m.title || ''}
                    placeholder="Tiêu đề mốc..."
                    onChange={e => updateMilestoneItem(m.id, { title: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    className={styles.input}
                    style={{ flex: 1, marginBottom: 0, padding: '3px 6px', fontSize: 10, color: 'var(--text-sub)' }}
                    value={m.subLabel || ''}
                    placeholder="Mô tả phụ..."
                    onChange={e => updateMilestoneItem(m.id, { subLabel: e.target.value })}
                  />
                  <input
                    className={styles.input}
                    style={{ width: 60, marginBottom: 0, padding: '3px 4px', fontSize: 10, textAlign: 'center' }}
                    value={m.badge || ''}
                    placeholder="Tag (DONE)"
                    onChange={e => updateMilestoneItem(m.id, { badge: e.target.value })}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
