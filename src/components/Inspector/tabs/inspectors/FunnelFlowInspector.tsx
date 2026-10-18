import React from 'react';
import styles from '../Tabs.module.css';
import { InspectorProps, ColorDot, DeleteIconButton } from './common';
import { FunnelFlowData, FunnelStageItem } from '@/types/scene';
import { Button, SegmentedControl, SectionHeader } from '@/components/ui';

export function FunnelFlowInspector({ element, updateElement }: InspectorProps) {
  const data: FunnelFlowData = element.funnelFlowData || {
    title: 'PHỄU CHUYỂN ĐỔI VIRAL',
    stages: [
      { id: 's1', label: '1. Tiếp Cận (Traffic)', subLabel: '100.000 Lượt xem', value: '100K', conversionPct: '100%', color: '#00D4FF', icon: '👁️' },
      { id: 's2', label: '2. Quan Tâm (Leads)', subLabel: '12.500 Đăng ký', value: '12.5K', conversionPct: '12.5%', color: '#BEFF01', icon: '🎯' },
      { id: 's3', label: '3. Chốt Đơn (Sales)', subLabel: '1.200 Khách hàng', value: '1.2K', conversionPct: '9.6%', color: '#FFB800', icon: '🛒' },
      { id: 's4', label: '4. Khách VIP (Loyal)', subLabel: '240 Hội viên VIP', value: '240', conversionPct: '20%', color: '#FF3B30', icon: '💎' },
    ],
    flowDirection: 'down',
  };

  const stages: FunnelStageItem[] = data.stages || [];
  const currentAccent = element.accentColor || '#00D4FF';
  const packetColor = data.packetColor || currentAccent;
  const wireColor = data.wireColor || 'rgba(255, 255, 255, 0.15)';

  const updateStages = (newStages: FunnelStageItem[]) => {
    updateElement(element.id, {
      funnelFlowData: {
        ...data,
        stages: newStages,
      },
    });
  };

  const addStage = () => {
    if (stages.length >= 6) return;
    const newIdx = stages.length + 1;
    const colors = ['#00D4FF', '#BEFF01', '#FFB800', '#FF3B30', '#A855F7', '#EC4899'];
    const newStage: FunnelStageItem = {
      id: `s_${Date.now()}`,
      label: `${newIdx}. Tầng Mới`,
      subLabel: 'Mô tả chi tiết',
      value: '10K',
      conversionPct: '15%',
      color: colors[(newIdx - 1) % colors.length],
      icon: '⚡',
    };
    updateStages([...stages, newStage]);
  };

  const removeStage = (id: string) => {
    if (stages.length <= 2) return;
    updateStages(stages.filter(s => s.id !== id));
  };

  const updateStageItem = (id: string, partial: Partial<FunnelStageItem>) => {
    updateStages(stages.map(s => (s.id === id ? { ...s, ...partial } : s)));
  };

  return (
    <>
      <div className={styles.group}>
        <SectionHeader title="Phễu chuyển đổi (Funnel flow)" />

        {/* Tiêu đề Header */}
        <div style={{ marginBottom: 10 }}>
          <span style={{ fontSize: 11, color: 'var(--text-sub)', display: 'block', marginBottom: 4 }}>
            Tiêu đề phễu:
          </span>
          <input
            className={styles.input}
            style={{ width: '100%', marginBottom: 0 }}
            value={data.title || ''}
            placeholder="VD: PHỄU CHUYỂN ĐỔI VIRAL"
            onChange={e => {
              updateElement(element.id, {
                funnelFlowData: { ...data, title: e.target.value },
              });
            }}
          />
        </div>

        {/* Cấu hình màu sắc tia sáng & đường dây */}
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
            <span style={{ fontSize: 11, color: 'var(--text-sub)' }}>Hạt photon:</span>
            <ColorDot
              value={packetColor}
              sm
              onChange={c => {
                updateElement(element.id, {
                  funnelFlowData: { ...data, packetColor: c },
                });
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-sub)' }}>Khung viền:</span>
            <ColorDot
              value={wireColor}
              sm
              onChange={c => {
                updateElement(element.id, {
                  funnelFlowData: { ...data, wireColor: c },
                });
              }}
            />
          </div>
        </div>

        {/* Nút chuyển đổi Hướng Phễu (Xuôi / Ngược) */}
        <div style={{ marginBottom: 12 }}>
          <SegmentedControl
            options={[
              { value: 'down', label: 'Phễu thu hẹp (xuôi)' },
              { value: 'up', label: 'Kim tự tháp (ngược)' }
            ]}
            value={data.flowDirection || 'down'}
            onChange={(val) => {
              updateElement(element.id, {
                funnelFlowData: { ...data, flowDirection: val as any },
              });
            }}
            size="xs"
            fullWidth
          />
        </div>

        {/* ── DANH SÁCH CÁC TẦNG PHỄU ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#FFF' }}>
            Các tầng phễu ({stages.length}/6)
          </span>
          {stages.length < 6 && (
            <Button
              variant="secondary"
              size="xs"
              onClick={addStage}
            >
              + Thêm Tầng
            </Button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {stages.map((stage, idx) => {
            const sColor = stage.color || currentAccent;
            return (
              <div
                key={stage.id || idx}
                style={{
                  padding: '8px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 6,
                  border: `1px solid ${sColor}44`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ColorDot
                      value={sColor}
                      sm
                      onChange={c => updateStageItem(stage.id, { color: c })}
                    />
                    <span style={{ fontSize: 10, fontWeight: 700, color: sColor }}>
                      Tầng #{idx + 1}
                    </span>
                  </div>
                  {stages.length > 2 && (
                    <DeleteIconButton
                      onClick={() => removeStage(stage.id)}
                     />
                  )}
                </div>

                <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                  <input
                    className={styles.input}
                    style={{ width: 32, textAlign: 'center', marginBottom: 0, padding: '4px 2px', fontSize: 13 }}
                    value={stage.icon || ''}
                    placeholder="Icon"
                    onChange={e => updateStageItem(stage.id, { icon: e.target.value })}
                  />
                  <input
                    className={styles.input}
                    style={{ flex: 1, marginBottom: 0, padding: '4px 8px', fontSize: 11 }}
                    value={stage.label || ''}
                    placeholder="Tên tầng..."
                    onChange={e => updateStageItem(stage.id, { label: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    className={styles.input}
                    style={{ flex: 1.2, marginBottom: 0, padding: '3px 6px', fontSize: 10, color: 'var(--text-sub)' }}
                    value={stage.subLabel || ''}
                    placeholder="Mô tả phụ..."
                    onChange={e => updateStageItem(stage.id, { subLabel: e.target.value })}
                  />
                  <input
                    className={styles.input}
                    style={{ width: 50, marginBottom: 0, padding: '3px 4px', fontSize: 10, textAlign: 'center' }}
                    value={stage.value || ''}
                    placeholder="Số (10K)"
                    onChange={e => updateStageItem(stage.id, { value: e.target.value })}
                  />
                  <input
                    className={styles.input}
                    style={{ width: 45, marginBottom: 0, padding: '3px 4px', fontSize: 10, textAlign: 'center' }}
                    value={stage.conversionPct || ''}
                    placeholder="% Lọc"
                    onChange={e => updateStageItem(stage.id, { conversionPct: e.target.value })}
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
