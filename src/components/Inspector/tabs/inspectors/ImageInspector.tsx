import React, { useRef } from 'react';
import styles from '../Tabs.module.css';
import { InspectorProps, ColorControlRow, Slider } from './common';
import { Select, Button, SectionHeader, FormGroup } from '@/components/ui';

export function ImageInspector({ element, updateElement, showToast }: InspectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const blendMode = element.blendMode || 'normal';
  const borderRadius = element.borderRadius ?? 0;
  const borderWidth = element.borderWidth ?? 0;
  const borderColor = element.borderColor || '#BEFF01';
  const shadowBlur = element.imageShadowBlur ?? 0;
  const shadowColor = element.imageShadowColor || '#BEFF01';

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      if (base64Url) {
        updateElement(element.id, { src: base64Url });
        showToast?.('Đã tải ảnh mới thành công');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box' }}>
      <SectionHeader first title="Tùy chỉnh hình ảnh" />

      {/* Image Source & Replace Button */}
      <FormGroup
        label="Nguồn ảnh"
        action={
          <Button
            variant="secondary"
            size="xs"
            onClick={() => fileInputRef.current?.click()}
          >
            Tải ảnh từ máy
          </Button>
        }
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />
        <input
          type="text"
          className={styles.input}
          value={element.src || ''}
          onChange={e => updateElement(element.id, { src: e.target.value })}
          placeholder="https://... hoặc data:image/..."
        />
      </FormGroup>

      {/* Blend Mode (Filter background) */}
      <FormGroup label="Chế độ hòa trộn (lọc phông)">
        <Select
          size="sm"
          fullWidth
          value={blendMode}
          options={[
            { value: 'normal', label: 'Bình thường' },
            { value: 'screen', label: 'Lọc nền đen (Screen 3D)' },
            { value: 'multiply', label: 'Lọc nền trắng (Multiply)' },
            { value: 'overlay', label: 'Phủ sáng (Overlay)' },
            { value: 'lighten', label: 'Làm sáng (Lighten)' }
          ]}
          onChange={(val) => {
            updateElement(element.id, { blendMode: val as any });
          }}
        />
      </FormGroup>

      <SectionHeader title="Khung viền & đổ bóng" />

      {/* Corner Radius */}
      <Slider
        label="Bo tròn góc"
        value={borderRadius}
        min={0}
        max={80}
        step={2}
        display={v => `${v}px`}
        onChange={v => updateElement(element.id, { borderRadius: v })}
      />

      {/* Border Width & Color */}
      <Slider
        label="Độ dày viền"
        value={borderWidth}
        min={0}
        max={10}
        step={1}
        display={v => `${v}px`}
        onChange={v => updateElement(element.id, { borderWidth: v })}
      />

      {borderWidth > 0 && (
        <ColorControlRow
          label="Màu viền"
          value={borderColor}
          onChange={c => updateElement(element.id, { borderColor: c })}
        />
      )}

      {/* Glow / Drop Shadow */}
      <Slider
        label="Độ tỏa hào quang"
        value={shadowBlur}
        min={0}
        max={40}
        step={2}
        display={v => `${v}px`}
        onChange={v => updateElement(element.id, { imageShadowBlur: v })}
      />

      {shadowBlur > 0 && (
        <ColorControlRow
          label="Màu phát sáng"
          value={shadowColor}
          onChange={c => updateElement(element.id, { imageShadowColor: c })}
        />
      )}
    </div>
  );
}
