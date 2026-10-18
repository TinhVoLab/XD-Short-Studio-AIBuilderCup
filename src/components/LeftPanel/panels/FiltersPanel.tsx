import React, { useState } from 'react';
import styles from './Panels.module.css';
import fpStyles from './FiltersPanel.module.css';
import { useEditorStore } from '@/store/useEditorStore';
import { useShallow } from 'zustand/react/shallow';
import {
  FILTER_PRESETS,
  DEFAULT_FILTER_CONFIG,
  FilterPreset,
  SceneFilterConfig
} from '@/config/filterPresetCatalog';
import { Button, SegmentedControl } from '@/components/ui';

export default function FiltersPanel() {
  const { scenes, currentSceneIdx, updateScene, showToast } = useEditorStore(
    useShallow(s => ({
      scenes: s.scenes,
      currentSceneIdx: s.currentSceneIdx,
      updateScene: s.updateScene,
      showToast: s.showToast
    }))
  );

  const currentScene = scenes[currentSceneIdx];
  const currentFilter: SceneFilterConfig = currentScene?.filter || { ...DEFAULT_FILTER_CONFIG };
  const activePresetId = currentFilter.presetId || 'none';

  const [activeTab, setActiveTab] = useState<'presets' | 'adjust'>('presets');

  const handleSelectPreset = (preset: FilterPreset) => {
    if (!currentScene) return;
    updateScene(currentScene.id, {
      filter: { ...preset.config }
    });
    showToast(`Đã áp dụng bộ lọc "${preset.name}" cho Cảnh ${currentSceneIdx + 1}`);
  };

  const handleUpdateAdjust = (key: keyof SceneFilterConfig, value: number) => {
    if (!currentScene) return;
    const updated: SceneFilterConfig = {
      ...currentFilter,
      presetId: 'custom',
      [key]: value
    };
    updateScene(currentScene.id, { filter: updated });
  };

  const handleApplyToAll = () => {
    if (!currentScene) return;
    scenes.forEach(sc => {
      updateScene(sc.id, { filter: { ...currentFilter } });
    });
    showToast(`Đã áp dụng bộ lọc cho tất cả ${scenes.length} cảnh trong video!`);
  };

  const handleResetFilter = () => {
    if (!currentScene) return;
    updateScene(currentScene.id, { filter: { ...DEFAULT_FILTER_CONFIG } });
    showToast(`Đã hoàn tác bộ lọc về ảnh gốc`);
  };

  if (!currentScene) {
    return (
      <div className={styles.svgPanelContainer}>
        <div className={fpStyles.emptyState}>
          Vui lòng chọn 1 cảnh trên timeline để chỉnh bộ lọc
        </div>
      </div>
    );
  }

  return (
    <div className={styles.svgPanelContainer}>

      {/* 1. Top Sub-tab Switcher */}
      <div className={fpStyles.subTabMb}>
        <SegmentedControl
          options={[
            { value: 'presets', label: 'Bộ Sưu Tập Preset' },
            { value: 'adjust', label: 'Tinh Chỉnh (Sliders)' }
          ]}
          value={activeTab}
          onChange={(val) => setActiveTab(val as any)}
          size="xs"
          fullWidth
        />
      </div>

      {/* 2. Top Scene Status Bar */}
      <div className={fpStyles.statusBar}>
        <div className={fpStyles.statusLeft}>
          <span className={fpStyles.statusIcon} style={{ display: 'flex', alignItems: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2.18" /><line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" /><line x1="2" y1="12" x2="22" y2="12" /></svg>
          </span>
          <div className={fpStyles.statusInfo}>
            <span className={fpStyles.statusName}>Cảnh {currentSceneIdx + 1}: {currentScene.name}</span>
            <span className={fpStyles.statusPreset}>
              {FILTER_PRESETS.find(p => p.id === activePresetId)?.name || 'Tuỳ chỉnh'}
            </span>
          </div>
        </div>
        <Button
          variant="secondary"
          size="xs"
          onClick={handleApplyToAll}
          title="Áp dụng tone màu hiện tại cho toàn bộ các cảnh trong video"
          leftIcon={
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          }
        >
          Áp dụng tất cả
        </Button>
      </div>

      {/* ── 3A. Tab Presets ── */}
      {activeTab === 'presets' && (
        <div className={fpStyles.presetsGrid}>
          {FILTER_PRESETS.map(preset => {
            const isSelected = activePresetId === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={fpStyles.presetCard}
                style={{
                  backgroundColor: isSelected ? 'rgba(25, 34, 52, 0.95)' : 'rgba(18, 24, 38, 0.75)',
                  border: `1px solid ${isSelected ? '#BEFF01' : 'rgba(255, 255, 255, 0.08)'}`,
                  boxShadow: isSelected ? '0 0 10px rgba(190,255,1,0.25)' : '0 2px 8px rgba(0,0,0,0.25)'
                }}
                onMouseEnter={e => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'rgba(25, 34, 52, 0.95)';
                    e.currentTarget.style.borderColor = 'rgba(190,255,1,0.4)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.45)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'rgba(18, 24, 38, 0.75)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.25)';
                  }
                }}
              >
                <div className={fpStyles.presetHeader}>
                  <span className={fpStyles.presetIcon}>{preset.emoji}</span>
                  <span className={fpStyles.presetName} style={{ color: isSelected ? '#BEFF01' : '#FFF' }}>
                    {preset.name}
                  </span>
                  {isSelected && <span className={fpStyles.presetBadge}>DÙNG</span>}
                </div>
                <div className={fpStyles.presetDescBox}>
                  <span className={fpStyles.presetDescText}>{preset.description}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 3B. Tab Adjustments ── */}
      {activeTab === 'adjust' && (
        <div className={fpStyles.adjustCol}>
          {/* Card 1: Ánh Sáng & Màu Sắc */}
          <div className={fpStyles.adjustCard}>
            <div className={fpStyles.adjustCardTitle}>ÁNH SÁNG & MÀU SẮC</div>

            <div className={fpStyles.sliderRow}>
              <div className={fpStyles.sliderHeader}>
                <span>Độ sáng (Brightness)</span>
                <span className={fpStyles.sliderValue}>{currentFilter.brightness ?? 100}%</span>
              </div>
              <input type="range" min={50} max={150} value={currentFilter.brightness ?? 100} onChange={(e) => handleUpdateAdjust('brightness', parseInt(e.target.value))} className={fpStyles.sliderInput} />
            </div>

            <div className={fpStyles.sliderRow}>
              <div className={fpStyles.sliderHeader}>
                <span>Tương phản (Contrast)</span>
                <span className={fpStyles.sliderValue}>{currentFilter.contrast ?? 100}%</span>
              </div>
              <input type="range" min={50} max={170} value={currentFilter.contrast ?? 100} onChange={(e) => handleUpdateAdjust('contrast', parseInt(e.target.value))} className={fpStyles.sliderInput} />
            </div>

            <div className={fpStyles.sliderRow}>
              <div className={fpStyles.sliderHeader}>
                <span>Bão hòa màu (Saturation)</span>
                <span className={fpStyles.sliderValue}>{currentFilter.saturate ?? 100}%</span>
              </div>
              <input type="range" min={0} max={200} value={currentFilter.saturate ?? 100} onChange={(e) => handleUpdateAdjust('saturate', parseInt(e.target.value))} className={fpStyles.sliderInput} />
            </div>
          </div>

          {/* Card 2: Nhiệt Độ & Tone Màu */}
          <div className={fpStyles.adjustCard}>
            <div className={fpStyles.adjustCardTitle}>NHIỆT ĐỘ & TONE MÀU</div>

            <div className={fpStyles.sliderRow}>
              <div className={fpStyles.sliderHeader}>
                <span>Tone Màu (Ấm / Lạnh)</span>
                <span className={fpStyles.sliderValue}>{currentFilter.temperature ?? 0}</span>
              </div>
              <input type="range" min={-50} max={50} value={currentFilter.temperature ?? 0} onChange={(e) => handleUpdateAdjust('temperature', parseInt(e.target.value))} className={fpStyles.sliderInput} />
            </div>

            <div className={fpStyles.sliderRow}>
              <div className={fpStyles.sliderHeader}>
                <span>Xoay Tông Màu (Hue Rotate)</span>
                <span className={fpStyles.sliderValue}>{currentFilter.hueRotate ?? 0}°</span>
              </div>
              <input type="range" min={-180} max={180} value={currentFilter.hueRotate ?? 0} onChange={(e) => handleUpdateAdjust('hueRotate', parseInt(e.target.value))} className={fpStyles.sliderInput} />
            </div>

            <div className={fpStyles.sliderRow}>
              <div className={fpStyles.sliderHeader}>
                <span>Độ Mờ Viền (Soft Blur)</span>
                <span className={fpStyles.sliderValue}>{currentFilter.blur ?? 0}px</span>
              </div>
              <input type="range" min={0} max={8} step={0.5} value={currentFilter.blur ?? 0} onChange={(e) => handleUpdateAdjust('blur', parseFloat(e.target.value))} className={fpStyles.sliderInput} />
            </div>
          </div>

          {/* Reset Button */}
          <button type="button" onClick={handleResetFilter} className={fpStyles.resetBtn}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            <span>Đặt lại giá trị gốc</span>
          </button>
        </div>
      )}

    </div>
  );
}
