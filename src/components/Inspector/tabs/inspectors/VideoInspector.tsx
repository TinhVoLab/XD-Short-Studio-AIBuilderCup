import React, { useRef } from 'react';
import styles from '../Tabs.module.css';
import { InspectorProps, ColorControlRow, Slider } from './common';
import { Select, Button, SectionHeader, FormGroup } from '@/components/ui';

export function VideoInspector({ element, updateElement, showToast }: InspectorProps) {
  const borderRadius = element.borderRadius ?? 12;
  const borderWidth = element.borderWidth ?? 1;
  const borderColor = element.borderColor || 'rgba(255, 255, 255, 0.2)';
  const shadowBlur = element.imageShadowBlur ?? 0;
  const shadowColor = element.imageShadowColor || '#000000';
  const objectFit = element.objectFit || 'cover';
  const volumePct = Math.round((element.videoVolume ?? 0) * 100);
  const startFromSec = element.videoStartFromSec ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box' }}>
      <SectionHeader first title="Tùy chỉnh video clip" />

      {/* Mini Video Preview */}
      {element.src && (
        <div style={{ position: 'relative', width: '100%', height: '85px', borderRadius: '8px', overflow: 'hidden', marginBottom: 10, border: '1px solid var(--border)', background: '#000' }}>
          <video
            src={element.src}
            muted
            loop
            playsInline
            autoPlay
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}

      {/* Video Source URL */}
      <FormGroup label="Đường dẫn video">
        <input
          type="text"
          className={styles.input}
          value={element.src || ''}
          onChange={e => updateElement(element.id, { src: e.target.value })}
          placeholder="http://... hoặc /uploads/..."
        />
      </FormGroup>

      {/* Object Fit */}
      <FormGroup label="Tỉ lệ co giãn (khung hình)">
        <Select
          size="sm"
          fullWidth
          value={objectFit}
          options={[
            { value: 'cover', label: 'Điền đầy khung hình (Cover - Cắt tràn viền)' },
            { value: 'contain', label: 'Vừa vặn khung hình (Contain - Giữ nguyên tỉ lệ)' }
          ]}
          onChange={(val) => {
            updateElement(element.id, { objectFit: val as any });
          }}
        />
      </FormGroup>

      <SectionHeader title="Âm thanh & phát lại" />

      {/* Video Volume Slider */}
      <Slider
        label="Âm lượng video"
        value={volumePct}
        min={0}
        max={100}
        step={5}
        display={v => `${v}%`}
        onChange={v => updateElement(element.id, { videoVolume: v / 100 })}
      />
      <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: -4, marginBottom: 8, paddingLeft: 2 }}>
        {volumePct === 0 ? 'Tắt tiếng (Ưu tiên giọng AI & BGM)' : `Phát ở mức ${volumePct}%`}
      </div>

      {/* Start From (Trim beginning) */}
      <Slider
        label="Cắt đầu video (bắt đầu từ)"
        value={startFromSec}
        min={0}
        max={25}
        step={0.5}
        display={v => `${v}s`}
        onChange={v => updateElement(element.id, { videoStartFromSec: v })}
      />

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

      {/* Drop Shadow Blur */}
      <Slider
        label="Đổ bóng / phát sáng viền"
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
