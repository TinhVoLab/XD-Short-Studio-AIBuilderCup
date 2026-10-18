import React, { useState } from 'react';
import styles from '../Panels.module.css';
import { useEditorStore } from '@/store/useEditorStore';
import { useShallow } from 'zustand/react/shallow';
import { Button, SectionHeader } from '@/components/ui';

interface WaveformPreset {
  id: string;
  name: string;
  desc: string;
  style: any;
  color: string;
  secondaryColor?: string;
  height: number;
}

const WAVEFORM_PRESETS: WaveformPreset[] = [
  { id: 'bars', name: 'Classic Bars', desc: 'Cột sóng cổ điển nhảy theo nhịp', style: 'bars', color: '#BEFF01', height: 40 },
  { id: 'mirrored', name: 'Mirrored EQ', desc: 'Equalizer đối xứng 2 chiều', style: 'mirrored', color: '#00D4FF', height: 44 },
  { id: 'siri', name: 'Siri AI Wave', desc: 'Dải sóng mềm mại phong cách Apple Siri', style: 'siri', color: '#BEFF01', secondaryColor: '#00D4FF', height: 48 },
  { id: 'curve', name: 'Fluid Curve', desc: 'Sóng lượn sóng động học gradient', style: 'curve', color: '#FF3366', secondaryColor: '#FFD700', height: 42 },
  { id: 'circular', name: 'Circular Pulse', desc: 'Vòng tròn radar sóng âm thanh', style: 'circular', color: '#BEFF01', height: 60 },
  { id: 'laser-beam', name: 'Laser Beam', desc: 'Tia laser cyber phát sáng neon', style: 'laser-beam', color: '#00D4FF', height: 36 },
  { id: 'dots', name: 'Dot Matrix', desc: 'Ma trận điểm LED âm thanh', style: 'dots', color: '#BEFF01', height: 38 },
  { id: 'dna-helix', name: 'DNA Helix', desc: 'Chuỗi xoắn kép sinh học 3D', style: 'dna-helix', color: '#00D4FF', secondaryColor: '#BEFF01', height: 48 },
  { id: 'vu-meter', name: 'VU Meter', desc: 'Kim đồng hồ phòng thu cổ điển', style: 'vu-meter', color: '#FFB800', height: 45 },
  { id: 'liquid-blob', name: 'Liquid Blob', desc: 'Khối thủy ngân lỏng biến hình', style: 'liquid-blob', color: '#C084FC', secondaryColor: '#00D4FF', height: 50 },
  { id: 'retro-sunburst', name: 'Retro Sunburst', desc: 'Mặt trời Synthwave thập niên 80', style: 'retro-sunburst', color: '#FF3366', secondaryColor: '#FFD700', height: 56 },
  { id: 'arcade-blocks', name: 'Arcade LED', desc: 'Khối gạch game thùng retro', style: 'arcade-blocks', color: '#BEFF01', height: 40 },
];

export function WaveformSection() {
  const [selectedPreset, setSelectedPreset] = useState<WaveformPreset>(WAVEFORM_PRESETS[0]);

  const { addElement, applyAudioWaveformToAllScenes, showToast, scenes, currentSceneIdx } = useEditorStore(
    useShallow(s => ({
      addElement: s.addElement,
      applyAudioWaveformToAllScenes: s.applyAudioWaveformToAllScenes,
      showToast: s.showToast,
      scenes: s.scenes,
      currentSceneIdx: s.currentSceneIdx,
    }))
  );

  const currentScene = scenes[currentSceneIdx];
  const hasWaveformInCurrentScene = !!currentScene?.elements.some(e => e.type === 'audio-waveform');

  const handleAddToCurrentScene = (preset: WaveformPreset) => {
    addElement({
      type: 'audio-waveform',
      left: 180,
      top: 540,
      width: 280,
      height: preset.height,
      scaleX: 1,
      scaleY: 1,
      angle: 0,
      opacity: 1,
      waveformStyle: preset.style,
      waveformColor: preset.color,
      waveformSecondaryColor: preset.secondaryColor || '#00D4FF',
      waveformGlow: true,
      numberOfBars: 24,
      accentColor: preset.color,
      animPreset: 'fade-in',
      animDuration: 0.4,
    });
    showToast(`Đã thêm sóng âm "${preset.name}" vào cảnh hiện tại`);
  };

  const handleApplyToAllScenes = (preset: WaveformPreset) => {
    applyAudioWaveformToAllScenes({
      waveformStyle: preset.style,
      waveformColor: preset.color,
      waveformSecondaryColor: preset.secondaryColor || '#00D4FF',
      waveformGlow: true,
      height: preset.height,
      width: 280,
      left: 180,
      top: 540,
    });
    showToast(`Đã áp dụng sóng âm "${preset.name}" cho toàn bộ video!`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Introduction Card */}
      <div
        style={{
          padding: '12px 14px',
          background: 'rgba(190, 255, 1, 0.06)',
          border: '1px solid rgba(190, 255, 1, 0.2)',
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#BEFF01" strokeWidth="2.2" strokeLinecap="round">
            <line x1="12" y1="2" x2="12" y2="22" />
            <line x1="8" y1="6" x2="8" y2="18" />
            <line x1="4" y1="10" x2="4" y2="14" />
            <line x1="16" y1="6" x2="16" y2="18" />
            <line x1="20" y1="10" x2="20" y2="14" />
          </svg>
          <span style={{ fontSize: 12.5, fontWeight: 800, color: '#BEFF01' }}>
            Hiệu Ứng Sóng Âm (Waveform)
          </span>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-sub)', margin: 0, lineHeight: 1.45 }}>
          Trực quan hóa giọng đọc và nhạc nền với 12 phong cách sóng âm động học. Tự động nhảy theo tần số âm thanh thực tế.
        </p>
      </div>

      <SectionHeader title="Chọn Kiểu Dáng Sóng" />

      {/* Grid Presets */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 8,
          maxHeight: 280,
          overflowY: 'auto',
          paddingRight: 2,
        }}
      >
        {WAVEFORM_PRESETS.map((p) => {
          const isSelected = selectedPreset.id === p.id;
          return (
            <div
              key={p.id}
              onClick={() => setSelectedPreset(p)}
              style={{
                padding: '10px 10px',
                background: isSelected ? 'rgba(190, 255, 1, 0.12)' : 'var(--surface-2)',
                border: isSelected ? '1px solid #BEFF01' : '1px solid var(--border)',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: isSelected ? '#BEFF01' : 'var(--text)' }}>
                  {p.name}
                </span>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: p.color,
                    boxShadow: `0 0 6px ${p.color}`,
                  }}
                />
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-sub)', lineHeight: 1.3 }}>
                {p.desc}
              </span>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
        <Button
          variant="primary"
          size="sm"
          fullWidth
          onClick={() => handleAddToCurrentScene(selectedPreset)}
          leftIcon={
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          }
        >
          {hasWaveformInCurrentScene ? 'Thay sóng âm cảnh này' : 'Thêm vào cảnh hiện tại'}
        </Button>

        <Button
          variant="secondary"
          size="sm"
          fullWidth
          onClick={() => handleApplyToAllScenes(selectedPreset)}
          leftIcon={
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          }
        >
          Áp dụng cho toàn bộ video
        </Button>
      </div>

      <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textAlign: 'center' }}>
        * Khi thêm vào canvas, click vào sóng âm để mở thanh Inspector chỉnh màu, kích thước, độ phát sáng Neon.
      </div>
    </div>
  );
}
