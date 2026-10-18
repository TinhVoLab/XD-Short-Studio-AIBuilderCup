import React from 'react';
import { InspectorProps, ColorControlRow, Slider, Toggle, ToggleRow } from './common';
import { Button, SectionHeader, FormGroup, Select } from '@/components/ui';
import { useEditorStore } from '@/store/useEditorStore';

const WAVEFORM_OPTIONS = [
  { value: 'bars', label: 'Cột sóng cổ điển (Classic bars)' },
  { value: 'mirrored', label: 'Đối xứng 2 chiều (Mirrored)' },
  { value: 'curve', label: 'Dải sóng uốn lượn (Curve)' },
  { value: 'dots', label: 'Ma trận điểm (Dot matrix)' },
  { value: 'siri', label: 'Siri AI tinh tế (Siri wave)' },
  { value: 'circular', label: 'Vòng tròn âm thanh (Circular)' },
  { value: 'laser-beam', label: 'Tia Laser động (Laser beam)' },
  { value: 'liquid-blob', label: 'Thủy ngân lỏng (Liquid blob)' },
  { value: 'vu-meter', label: 'Kim đồng hồ âm lượng (VU meter)' },
  { value: 'dna-helix', label: 'Chuỗi xoắn DNA (DNA helix)' },
  { value: 'arcade-blocks', label: 'Gạch LED cổ điển (Arcade blocks)' },
  { value: 'neural-constellation', label: 'Mạng tinh vân AI (Neural)' },
  { value: 'retro-sunburst', label: 'Mặt trời Synthwave (Retro)' },
];

export function AudioWaveformInspector({
  element,
  updateElement,
  showToast
}: InspectorProps) {
  const el = element || {};
  const currentStyle = el.waveformStyle || 'bars';
  const mainColor = el.waveformColor || el.accentColor || '#BEFF01';
  const secondaryColor = el.waveformSecondaryColor || '#00D4FF';
  const hasGlow = el.waveformGlow !== false;
  const barsCount = el.numberOfBars || 24;
  const heightVal = el.height || 40;

  const hasSecondaryColor = [
    'siri', 'curve', 'circular', 'laser-beam', 
    'liquid-blob', 'dna-helix', 'neural-constellation', 'retro-sunburst'
  ].includes(currentStyle);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box' }}>
      <SectionHeader first title="Kiểu dáng sóng âm" />

      {/* Chọn Kiểu dáng */}
      <FormGroup label="Kiểu hiển thị sóng">
        <Select
          size="sm"
          fullWidth
          value={currentStyle}
          options={WAVEFORM_OPTIONS}
          onChange={val => {
            updateElement(el.id, { waveformStyle: val as any });
            const opt = WAVEFORM_OPTIONS.find(o => o.value === val);
            if (opt) showToast?.(`Kiểu sóng: ${opt.label}`);
          }}
        />
      </FormGroup>

      <SectionHeader title="Màu sắc & hiệu ứng" />

      {/* Màu sắc */}
      <ColorControlRow
        label="Màu chính"
        value={mainColor}
        onChange={c => updateElement(el.id, { waveformColor: c, accentColor: c })}
      />

      {hasSecondaryColor && (
        <ColorControlRow
          label="Màu phụ"
          value={secondaryColor}
          onChange={c => updateElement(el.id, { waveformSecondaryColor: c })}
        />
      )}

      <ColorControlRow
        label="Màu hạt lõi"
        value={el.waveformCoreColor || '#FFFFFF'}
        onChange={c => updateElement(el.id, { waveformCoreColor: c })}
      />

      {/* Neon Glow Toggle */}
      <ToggleRow label="Phát sáng Neon (Glow)">
        <Toggle
          checked={hasGlow}
          onChange={v => updateElement(el.id, { waveformGlow: v })}
        />
      </ToggleRow>

      {/* Sliders */}
      <Slider
        label="Mật độ sóng (số cột)"
        value={barsCount}
        min={8}
        max={48}
        step={2}
        display={v => `${v}`}
        onChange={v => updateElement(el.id, { numberOfBars: v })}
      />

      <Slider
        label="Chiều cao sóng"
        value={heightVal}
        min={16}
        max={90}
        step={2}
        display={v => `${v}px`}
        onChange={v => updateElement(el.id, { height: v })}
      />

      <div style={{ marginTop: 'var(--space-3)' }}>
        <Button
          variant="secondary"
          size="sm"
          fullWidth
          onClick={() => {
            useEditorStore.getState().applyAudioWaveformToAllScenes({
              waveformStyle: currentStyle,
              waveformColor: mainColor,
              waveformSecondaryColor: secondaryColor,
              waveformGlow: hasGlow,
              numberOfBars: barsCount,
              height: heightVal,
            });
            showToast?.('Đã đồng bộ kiểu sóng âm này cho toàn bộ video!');
          }}
          leftIcon={
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          }
        >
          Áp dụng cho toàn bộ video
        </Button>
      </div>
    </div>
  );
}
