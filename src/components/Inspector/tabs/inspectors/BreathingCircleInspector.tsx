import React from 'react';
import styles from '../Tabs.module.css';
import { InspectorProps, ColorControlRow, Slider, Toggle, ToggleRow } from './common';
import { Select, SegmentedControl, SectionHeader, FormGroup } from '@/components/ui';

export function BreathingCircleInspector({ element, updateElement }: InspectorProps) {
  const b = element.breathingData || {
    title: 'HÍT THỞ CHÁNH NIỆM',
    subtitle: 'Kỹ thuật 4-7-8',
    pattern: '4-7-8',
    cycleDurationSec: 8,
    accentColor: '#86EFAC',
  };

  const updateData = (patch: Partial<typeof b>) => {
    const updated = { ...b, ...patch };
    updateElement(element.id, {
      breathingData: updated,
      ...(patch.accentColor ? { accentColor: patch.accentColor, color: patch.accentColor } : {}),
      ...(patch.title ? { content: patch.title } : {}),
    });
  };

  const currentPattern = b.pattern || '4-7-8';
  const currentVisualStyle = b.visualStyle || 'concentric-orb';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box' }}>
      <SectionHeader first title="Vòng thở & tĩnh tâm (Breathing circle)" />

      {/* Visual Style Selector */}
      <FormGroup label="Phong cách hiển thị">
        <Select
          size="sm"
          fullWidth
          value={currentVisualStyle}
          options={[
            { value: 'concentric-orb', label: 'Hào quang (Orb)' },
            { value: 'water-ripple', label: 'Gợn sóng nước (Ripple)' },
            { value: 'singing-bowl', label: 'Chuông xoay (432Hz)' },
            { value: 'zen-stones', label: 'Tháp đá thăng bằng' },
            { value: 'lotus-pulse', label: 'Hoa sen phát sáng' }
          ]}
          onChange={(val) => {
            updateData({ visualStyle: val as any });
          }}
        />
      </FormGroup>

      {/* Pattern Quick Switcher */}
      <FormGroup label="Chế độ nhịp thở">
        <SegmentedControl
          options={[
            { value: '4-7-8', label: '4-7-8' },
            { value: 'box', label: 'Thở hộp' },
            { value: 'coherence', label: '5.5s' }
          ]}
          value={currentPattern}
          onChange={(val) => {
            updateData({ pattern: val as any });
          }}
          size="xs"
          fullWidth
        />
      </FormGroup>

      {/* Toggles */}
      <ToggleRow label="Bụi sáng phát quang">
        <Toggle
          checked={b.showParticles !== false}
          onChange={checked => updateData({ showParticles: checked })}
        />
      </ToggleRow>

      <ToggleRow label="Chữ hướng dẫn nhịp thở">
        <Toggle
          checked={b.showPhaseText !== false}
          onChange={checked => updateData({ showPhaseText: checked })}
        />
      </ToggleRow>

      {/* Title Input */}
      <FormGroup label="Tiêu đề dẫn thiền">
        <input
          type="text"
          className={styles.input}
          value={b.title || ''}
          onChange={e => updateData({ title: e.target.value })}
          placeholder="HÍT THỞ CHÁNH NIỆM"
        />
      </FormGroup>
      
      {/* Subtitle Input */}
      <FormGroup label="Phụ đề / Mantra">
        <input
          type="text"
          className={styles.input}
          value={b.subtitle || ''}
          onChange={e => updateData({ subtitle: e.target.value })}
          placeholder="Buông bỏ mọi muộn phiền..."
        />
      </FormGroup>

      {/* Accent Color & Size */}
      <SectionHeader title="Giao diện & màu sắc" />
      <ColorControlRow
        label="Màu hào quang"
        value={element.accentColor || b.accentColor || '#86EFAC'}
        onChange={c => updateData({ accentColor: c })}
      />

      <Slider
        label="Kích thước tổng thể"
        value={element.width || 240}
        min={160}
        max={360}
        step={10}
        display={v => `${v}px`}
        onChange={v => updateElement(element.id, { width: v, height: Math.round(v * 1.08) })}
      />
    </div>
  );
}
