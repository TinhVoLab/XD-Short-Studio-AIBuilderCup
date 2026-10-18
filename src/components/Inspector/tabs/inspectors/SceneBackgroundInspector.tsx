import React from 'react';
import { Scene } from '@/types/scene';
import { Button, SectionHeader, FormGroup } from '@/components/ui';
import { ColorDot, Toggle, ToggleRow, Slider } from './common';
import { useEditorStore } from '@/store/useEditorStore';
import { THEME_PALETTES, resolveThemePalette, resolveSceneBackground } from '@/utils/themeResolver';
import styles from './SceneBackgroundInspector.module.css';
import { TRANSITION_CATALOG } from '@/config/transitionCatalog';
import { getSceneTransition } from '@/utils/sceneTiming';
import { DEFAULT_TRANSITION_SEC } from '@/config/pacingConfig';

const SyncIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

interface BackgroundPreset {
  id: string;
  name: string;
  bgColor: string;
  bgGradient?: string;
  bgPattern: 'none' | 'grid' | 'dots' | 'mesh' | 'noise' | 'cyber-3d' | 'topo-contour' | 'speed-lines';
  preview: string;
}

const STUDIO_PRESETS: BackgroundPreset[] = [
  {
    id: 'pitch-black',
    name: 'Pitch Black',
    bgColor: '#080A0F',
    bgPattern: 'none',
    preview: '#080A0F'
  },
  {
    id: 'cyber-midnight',
    name: 'Cyber Midnight',
    bgColor: '#090D16',
    bgGradient: 'linear-gradient(180deg, #090D16 0%, #150D2A 100%)',
    bgPattern: 'grid',
    preview: 'linear-gradient(180deg, #090D16 0%, #150D2A 100%)'
  },
  {
    id: 'deep-space',
    name: 'Deep Space',
    bgColor: '#0A1128',
    bgGradient: 'linear-gradient(180deg, #0A1128 0%, #000411 100%)',
    bgPattern: 'dots',
    preview: 'linear-gradient(180deg, #0A1128 0%, #000411 100%)'
  },
  {
    id: 'charcoal-studio',
    name: 'Charcoal Studio',
    bgColor: '#14171F',
    bgPattern: 'noise',
    preview: '#14171F'
  },
  {
    id: 'emerald-matrix',
    name: 'Emerald Matrix',
    bgColor: '#061A14',
    bgGradient: 'linear-gradient(180deg, #061A14 0%, #020D08 100%)',
    bgPattern: 'grid',
    preview: 'linear-gradient(180deg, #061A14 0%, #020D08 100%)'
  },
  {
    id: 'crimson-hook',
    name: 'Crimson Hook',
    bgColor: '#1A080E',
    bgGradient: 'linear-gradient(180deg, #1A080E 0%, #0A0306 100%)',
    bgPattern: 'mesh',
    preview: 'linear-gradient(180deg, #1A080E 0%, #0A0306 100%)'
  },
  {
    id: 'sunset-glow',
    name: 'Sunset Glow',
    bgColor: '#1F0E0A',
    bgGradient: 'linear-gradient(180deg, #1F0E0A 0%, #0D0504 100%)',
    bgPattern: 'mesh',
    preview: 'linear-gradient(180deg, #1F0E0A 0%, #0D0504 100%)'
  },
  {
    id: 'slate-minimal',
    name: 'Slate Minimal',
    bgColor: '#1C2331',
    bgGradient: 'linear-gradient(180deg, #1C2331 0%, #0F141F 100%)',
    bgPattern: 'none',
    preview: 'linear-gradient(180deg, #1C2331 0%, #0F141F 100%)'
  },
  {
    id: 'cyber-tron-3d',
    name: 'Cyber Tron 3D',
    bgColor: '#070B14',
    bgGradient: 'linear-gradient(180deg, #070B14 0%, #0D162B 100%)',
    bgPattern: 'cyber-3d',
    preview: 'linear-gradient(180deg, #070B14 0%, #00E5FF 100%)'
  },
  {
    id: 'topo-minimal',
    name: 'Địa Hình Topo',
    bgColor: '#090F0D',
    bgGradient: 'linear-gradient(180deg, #090F0D 0%, #03140E 100%)',
    bgPattern: 'topo-contour',
    preview: 'linear-gradient(180deg, #090F0D 0%, #34D399 100%)'
  },
  {
    id: 'daylight-paper',
    name: 'Daylight Paper',
    bgColor: '#F5F5F7',
    bgPattern: 'noise',
    preview: '#F5F5F7'
  },
  {
    id: 'pastel-peach',
    name: 'Pastel Peach',
    bgColor: '#FFF5F0',
    bgGradient: 'linear-gradient(180deg, #FFF5F0 0%, #FFEBE1 100%)',
    bgPattern: 'dots',
    preview: 'linear-gradient(180deg, #FFF5F0 0%, #FFEBE1 100%)'
  },
  {
    id: 'mint-breeze',
    name: 'Mint Breeze',
    bgColor: '#F2FBF7',
    bgGradient: 'linear-gradient(180deg, #F2FBF7 0%, #E2F3EB 100%)',
    bgPattern: 'mesh',
    preview: 'linear-gradient(180deg, #F2FBF7 0%, #E2F3EB 100%)'
  }
];

export interface SceneBackgroundInspectorProps {
  currentScene: Scene;
  sceneIndex: number;
  totalScenes: number;
  updateScene: (id: string, patch: Partial<Scene>) => void;
  applyBackgroundToAllScenes: (bgConfig: {
    bgColor?: string;
    bgGradient?: string;
    bgVideoUrl?: string;
    bgVideoLoop?: boolean;
    bgVideoVolume?: number;
    bgPattern?: any;
    bgPatternColor?: string;
    bgPatternOpacity?: number;
    cameraMotion?: any;
    transition?: { type: string; duration: number };
    progressBar?: any;
    viralEffects?: any;
  }) => void;
  applyProgressBarToAllScenes?: (progressBar: any) => void;
  applyViralEffectsToAllScenes?: (viralEffects: any) => void;
  applyCameraAndTransitionToAllScenes?: (cameraMotion?: any, transition?: { type: string; duration: number }) => void;
  showToast: (msg: string) => void;
}

export function SceneBackgroundInspector({
  currentScene,
  sceneIndex,
  totalScenes,
  updateScene,
  applyBackgroundToAllScenes,
  applyProgressBarToAllScenes,
  applyViralEffectsToAllScenes,
  applyCameraAndTransitionToAllScenes,
  showToast
}: SceneBackgroundInspectorProps) {
  const { effectiveBgColor } = resolveSceneBackground(currentScene);
  const currentColor = currentScene.bgColor || effectiveBgColor;
  const currentGradient = currentScene.bgGradient;
  const currentPattern = currentScene.bgPattern || 'none';
  const currentTransition = getSceneTransition(currentScene);

  const handleSelectPreset = (preset: BackgroundPreset) => {
    updateScene(currentScene.id, {
      bgColor: preset.bgColor,
      bgGradient: preset.bgGradient,
      bgPattern: preset.bgPattern
    });
    showToast(`Đã áp dụng phông nền "${preset.name}"`);
  };

  const handleApplyToAll = () => {
    applyBackgroundToAllScenes({
      bgColor: currentScene.bgColor,
      bgGradient: currentScene.bgGradient,
      bgPattern: currentScene.bgPattern,
      bgPatternColor: currentScene.bgPatternColor,
      bgPatternOpacity: currentScene.bgPatternOpacity,
      cameraMotion: currentScene.cameraMotion,
      transition: currentTransition,
      progressBar: currentScene.progressBar,
      viralEffects: currentScene.viralEffects
    });
    showToast(`Đã áp dụng toàn bộ thiết lập cho ${totalScenes} cảnh!`);
  };

  const [paletteFilter, setPaletteFilter] = React.useState<'all' | 'dark' | 'light'>('all');
  const applyThemePaletteToScene = useEditorStore(s => s.applyThemePaletteToScene);
  const applyThemePaletteToAllScenes = useEditorStore(s => s.applyThemePaletteToAllScenes);
  const activePalette = resolveThemePalette(currentScene.paletteId || (currentScene as any).colorTheme || 'neon-night');
  const paletteEntries = Object.values(THEME_PALETTES).filter(pal => {
    if (paletteFilter === 'dark') return pal.spaceMode === 'dark';
    if (paletteFilter === 'light') return pal.spaceMode !== 'dark';
    return true;
  });

  return (
    <div className={styles.container}>

      {/* ── CỤM 0: BẢNG MÀU CHỦ ĐỀ CẢNH ── */}
      <SectionHeader
        title="Bảng màu chủ đề cảnh"
        action={
          <Button
            asIcon
            variant="ghost"
            size="icon-sm"
            title={`Áp dụng bảng màu "${activePalette.label}" cho tất cả ${totalScenes} cảnh`}
            onClick={() => {
              applyThemePaletteToAllScenes(activePalette.id, { syncBrandAccent: false, syncBgColor: true });
              showToast(`Đã áp dụng bảng màu cho tất cả ${totalScenes} cảnh!`);
            }}
          >
            <SyncIcon />
          </Button>
        }
      />

      <div className={styles.paletteFilters}>
        {([
          ['all', 'Tất cả'],
          ['dark', 'Tối'],
          ['light', 'Sáng'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`${styles.paletteFilterBtn} ${paletteFilter === key ? styles.paletteFilterBtnActive : ''}`}
            onClick={() => setPaletteFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={styles.paletteGrid}>
        {paletteEntries.map(pal => {
          const isActive = activePalette.id === pal.id;
          return (
            <button
              key={pal.id}
              type="button"
              className={`${styles.paletteCard} ${isActive ? styles.paletteCardActive : ''}`}
              title={pal.desc}
              onClick={() => {
                applyThemePaletteToScene(currentScene.id, pal.id, { syncBgColor: true });
                showToast(`Đã đổi bảng màu cảnh ${sceneIndex + 1}: ${pal.label}`);
              }}
            >
              <span className={styles.paletteName}>{pal.label}</span>
              <span className={styles.paletteSwatches}>
                <span style={{ background: pal.tokens.bg }} />
                <span style={{ background: pal.tokens.surface }} />
                <span style={{ background: pal.tokens.accent }} />
                <span style={{ background: pal.tokens.text }} />
                <span style={{ background: pal.chartTokens.chartSeries[0] }} />
              </span>
            </button>
          );
        })}
      </div>

      {/* ── CỤM 1: TIÊU ĐỀ & PRESET STUDIO ── */}
      <SectionHeader 
        title={`Phông Nền Cảnh ${sceneIndex + 1}`}
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
            <span className={styles.patternBadge}>
              {currentPattern.toUpperCase()}
            </span>
            <Button
              asIcon
              variant="ghost"
              size="icon-sm"
              title={`Đồng bộ phông nền cho tất cả ${totalScenes} cảnh`}
              onClick={() => {
                applyBackgroundToAllScenes({
                  bgColor: currentScene.bgColor,
                  bgGradient: currentScene.bgGradient,
                  bgPattern: currentScene.bgPattern,
                  bgPatternColor: currentScene.bgPatternColor,
                  bgPatternOpacity: currentScene.bgPatternOpacity,
                });
                showToast(`Đã áp dụng phông nền cho tất cả ${totalScenes} cảnh!`);
              }}
            >
              <SyncIcon />
            </Button>
          </div>
        }
      />

      <FormGroup
        label="Mẫu có sẵn"
        tooltip="Áp dụng nhanh phông nền màu chuyển sắc và họa tiết chuyên nghiệp"
      >
        <div className={styles.presetGrid}>
          {STUDIO_PRESETS.map(preset => {
            const isMatch = (preset.bgGradient && preset.bgGradient === currentGradient) ||
              (!preset.bgGradient && !currentGradient && preset.bgColor.toLowerCase() === currentColor.toLowerCase());

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`${styles.presetBtn} ${isMatch ? styles.presetBtnActive : ''}`}
              >
                <div
                  className={styles.presetPreview}
                  style={{ background: preset.preview }}
                />
                <span className={`${styles.presetName} ${isMatch ? styles.presetNameActive : ''}`}>
                  {preset.name}
                </span>
              </button>
            );
          })}
        </div>
      </FormGroup>

      {/* ── CỤM 2: MÀU NỀN TÙY BIẾN ── */}
      <SectionHeader title="Màu Sắc & Họa Tiết" />

      <div className={styles.fieldGroup} style={{ marginBottom: 'var(--space-2)' }}>
        <span className={styles.fieldLabel} style={{ marginBottom: '6px' }}>
          Màu chủ đạo
        </span>
        <div className={styles.colorRow}>
          <ColorDot
            value={currentColor}
            onChange={(val) => updateScene(currentScene.id, { bgColor: val, bgGradient: undefined })}
          />
          <input
            type="text"
            value={currentColor}
            onChange={e => updateScene(currentScene.id, { bgColor: e.target.value, bgGradient: undefined })}
            className={styles.hexInput}
          />
          {currentGradient && (
            <button
              type="button"
              onClick={() => updateScene(currentScene.id, { bgGradient: undefined })}
              className={styles.clearGradientBtn}
              title="Xóa dải màu chuyển động để dùng màu phẳng"
            >
              Dùng màu phẳng
            </button>
          )}
        </div>
      </div>

      <div style={{ margin: 'var(--space-2) 0 var(--space-3)' }}>
        <div className={styles.fieldSubLabel}>
          <span className={styles.fieldLabel} style={{ margin: 0 }}>
            Họa tiết nền
          </span>
          {currentPattern !== 'none' && (
            <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 600 }}>
              {Math.round((currentScene.bgPatternOpacity ?? 1) * 100)}% độ rõ
            </span>
          )}
        </div>

        <div className={styles.patternGrid}>
          {[
            { id: 'none', label: 'Trơn' },
            { id: 'grid', label: 'Lưới HUD' },
            { id: 'cyber-3d', label: 'Lưới 3D' },
            { id: 'topo-contour', label: 'Địa hình' },
            { id: 'speed-lines', label: 'Tốc độ' },
            { id: 'dots', label: 'Chấm' },
            { id: 'mesh', label: 'Loang' },
            { id: 'noise', label: 'Nhiễu' },
          ].map(pat => {
            const isSel = currentPattern === pat.id;
            return (
              <Button
                key={pat.id}
                variant={isSel ? 'primary' : 'secondary'}
                size="xs"
                onClick={() => updateScene(currentScene.id, { bgPattern: pat.id as any })}
                style={{ padding: '5px 2px', fontSize: '10px', minHeight: 26 }}
              >
                {pat.label}
              </Button>
            );
          })}
        </div>

        {currentPattern !== 'none' && (
          <div className={styles.patternControls}>
            <Slider
              label="Độ rõ họa tiết"
              value={Math.round((currentScene.bgPatternOpacity ?? 1) * 100)}
              min={15}
              max={150}
              step={5}
              display={v => `${v}%`}
              onChange={v => updateScene(currentScene.id, { bgPatternOpacity: v / 100 })}
            />

            {/* Bảng màu dạ quang cho họa tiết */}
            <div className={styles.patternColorRow}>
              <span className={styles.fieldLabel} style={{ margin: 0 }}>
                Màu sắc:
              </span>
              <button
                type="button"
                title="Tự động Neon theo cảnh"
                onClick={() => updateScene(currentScene.id, { bgPatternColor: undefined })}
                className={`${styles.autoNeonBtn} ${!currentScene.bgPatternColor ? styles.autoNeonBtnActive : ''}`}
              >
                Auto Neon
              </button>
              {['#FFFFFF', '#BEFF01', '#00E5FF', '#A78BFA', '#34D399', '#FBBF24', '#FB7185'].map(hex => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => updateScene(currentScene.id, { bgPatternColor: hex })}
                  className={`${styles.colorSwatch} ${(currentScene.bgPatternColor || '').toLowerCase() === hex.toLowerCase() ? styles.colorSwatchActive : ''}`}
                  style={{ background: hex }}
                />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ── CỤM: VIDEO NỀN CẢNH (BACKGROUND VIDEO) ── */}
      <SectionHeader
        title="Video Nền Cảnh"
        action={
          currentScene.bgVideoUrl ? (
            <Button
              asIcon
              variant="ghost"
              size="icon-sm"
              title={`Đồng bộ video nền cho tất cả ${totalScenes} cảnh`}
              onClick={() => {
                applyBackgroundToAllScenes({
                  bgVideoUrl: currentScene.bgVideoUrl,
                  bgVideoLoop: currentScene.bgVideoLoop,
                  bgVideoVolume: currentScene.bgVideoVolume,
                });
                showToast(`Đã đồng bộ video nền cho tất cả ${totalScenes} cảnh!`);
              }}
            >
              <SyncIcon />
            </Button>
          ) : undefined
        }
      />
      <div className={styles.videoCard}>
        {currentScene.bgVideoUrl ? (
          <div>
            <div className={styles.videoPreviewWrap}>
              <video
                src={currentScene.bgVideoUrl}
                muted
                loop
                playsInline
                autoPlay
                className={styles.videoElement}
              />
              <div className={styles.videoBadge}>
                ĐANG PHÁT NỀN
              </div>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <Slider
                label="Âm lượng video nền"
                value={Math.round((currentScene.bgVideoVolume ?? 0) * 100)}
                min={0}
                max={100}
                step={5}
                display={(v) => `${v}%`}
                onChange={(val) => updateScene(currentScene.id, { bgVideoVolume: val / 100 })}
              />
            </div>

            <div className={styles.videoActions}>
              <Button
                variant="danger"
                size="xs"
                onClick={() => {
                  updateScene(currentScene.id, { bgVideoUrl: undefined });
                  showToast('Đã gỡ video nền khỏi cảnh này');
                }}
                leftIcon={
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" />
                  </svg>
                }
              >
                Gỡ video
              </Button>
            </div>
          </div>
        ) : (
          <div className={styles.videoEmptyNotice}>
            Cảnh này đang dùng phông nền tĩnh. Để dùng video nền động, bạn hãy vào tab <strong>Tài nguyên</strong> rồi bấm <strong>Làm Nền Cảnh</strong> trên video bất kỳ.
          </div>
        )}
      </div>

      {/* ── CỤM 3: GÓC MÁY QUAY & CHUYỂN CẢNH ── */}
      <SectionHeader
        title="Góc Quay & Chuyển Cảnh"
        action={
          <Button
            asIcon
            variant="ghost"
            size="icon-sm"
            title={`Đồng bộ máy quay & chuyển cảnh cho tất cả ${totalScenes} cảnh`}
            onClick={() => {
              if (applyCameraAndTransitionToAllScenes) {
                applyCameraAndTransitionToAllScenes(currentScene.cameraMotion, currentTransition);
              } else {
                applyBackgroundToAllScenes({
                  cameraMotion: currentScene.cameraMotion,
                  transition: currentTransition
                });
              }
              showToast(`Đã áp dụng góc quay & chuyển cảnh cho tất cả ${totalScenes} cảnh!`);
            }}
          >
            <SyncIcon />
          </Button>
        }
      />

      <div className={styles.selectRow} style={{ marginBottom: 'var(--space-2)' }}>
        <div>
          <span className={styles.fieldLabel} style={{ marginBottom: '4px' }}>
            Máy quay
          </span>
          <select
            value={currentScene.cameraMotion || 'static'}
            onChange={e => updateScene(currentScene.id, { cameraMotion: e.target.value as any })}
            className={styles.selectBox}
          >
            <option value="static">Tĩnh</option>
            <option value="zoom-in">Tiến vào</option>
            <option value="zoom-out">Lùi ra</option>
            <option value="pan-left">Trượt trái</option>
            <option value="pan-right">Trượt phải</option>
            <option value="shake">Rung kịch tính</option>
          </select>
        </div>

        <div>
          <span className={styles.fieldLabel} style={{ marginBottom: '4px' }}>
            Chuyển cảnh
          </span>
          <select
            value={currentTransition?.type || 'none'}
            onChange={e => {
              // scene.transition là SSOT (video đọc trường này); xoá transitionOut cũ để không còn hai nguồn
              const type = e.target.value
              updateScene(currentScene.id, {
                transition: type === 'none' ? { type: 'none', duration: 0 } : { type, duration: currentTransition?.duration || DEFAULT_TRANSITION_SEC },
                transitionOut: undefined,
              })
            }}
            className={styles.selectBox}
          >
            {TRANSITION_CATALOG.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── CỤM 4: THANH TIẾN TRÌNH LED ── */}
      <SectionHeader 
        title="Thanh Tiến Trình"
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
            {Boolean(currentScene.progressBar?.enabled) && (
              <Button
                asIcon
                variant="ghost"
                size="icon-sm"
                title={`Đồng bộ thanh tiến trình cho tất cả ${totalScenes} cảnh`}
                onClick={() => {
                  if (currentScene.progressBar) {
                    if (applyProgressBarToAllScenes) {
                      applyProgressBarToAllScenes(currentScene.progressBar);
                    } else {
                      applyBackgroundToAllScenes({ progressBar: currentScene.progressBar });
                    }
                    showToast(`Đã áp dụng thanh tiến trình cho tất cả ${totalScenes} cảnh!`);
                  }
                }}
              >
                <SyncIcon />
              </Button>
            )}
            <Toggle
              checked={Boolean(currentScene.progressBar?.enabled)}
              onChange={v => updateScene(currentScene.id, {
                progressBar: {
                  ...(currentScene.progressBar || { position: 'bottom', style: 'laser-comet', height: 6 }),
                  enabled: v
                }
              })}
            />
          </div>
        }
      />

      {Boolean(currentScene.progressBar?.enabled) && (
        <div className={styles.progressBarSettings}>
          <div className={styles.selectRow}>
            <div>
              <span className={styles.fieldLabel} style={{ marginBottom: '4px' }}>
                Vị trí
              </span>
              <select
                value={currentScene.progressBar?.position || 'bottom'}
                onChange={e => updateScene(currentScene.id, {
                  progressBar: {
                    ...(currentScene.progressBar || { enabled: true, style: 'laser-comet', height: 6 }),
                    position: e.target.value as any
                  }
                })}
                className={styles.selectBox}
              >
                <option value="bottom">Chân video</option>
                <option value="top">Đỉnh video</option>
              </select>
            </div>

            <div>
              <span className={styles.fieldLabel} style={{ marginBottom: '4px' }}>
                Kiểu dáng
              </span>
              <select
                value={currentScene.progressBar?.style || 'laser-comet'}
                onChange={e => updateScene(currentScene.id, {
                  progressBar: {
                    ...(currentScene.progressBar || { enabled: true, position: 'bottom', height: 6 }),
                    style: e.target.value as any
                  }
                })}
                className={styles.selectBox}
              >
                <option value="story-segments">Vạch Story (Reels)</option>
                <option value="laser-comet">Laser tia sao</option>
                <option value="liquid-aurora">Cực quang</option>
                <option value="segmented-hud">Vạch HUD</option>
                <option value="border-laser">Viền LED 360°</option>
              </select>
            </div>
          </div>

          <div className={styles.selectRow}>
            <div>
              <span className={styles.fieldLabel} style={{ marginBottom: '4px' }}>
                Phạm vi tiến độ
              </span>
              <select
                value={currentScene.progressBar?.scope || 'scene'}
                onChange={e => updateScene(currentScene.id, {
                  progressBar: {
                    ...(currentScene.progressBar || { enabled: true, position: 'bottom', style: 'laser-comet', height: 6 }),
                    scope: e.target.value as any
                  }
                })}
                className={styles.selectBox}
              >
                <option value="scene">Theo từng cảnh</option>
                <option value="global">Toàn bộ video</option>
              </select>
            </div>

            <div>
              <span className={styles.fieldLabel} style={{ marginBottom: '4px' }}>
                Độ dày vạch
              </span>
              <select
                value={currentScene.progressBar?.height || 6}
                onChange={e => updateScene(currentScene.id, {
                  progressBar: {
                    ...(currentScene.progressBar || { enabled: true, position: 'bottom', style: 'laser-comet' }),
                    height: Number(e.target.value)
                  }
                })}
                className={styles.selectBox}
              >
                <option value={3}>3px (Siêu mảnh)</option>
                <option value={4}>4px (Mảnh tinh tế)</option>
                <option value={6}>6px (Tiêu chuẩn)</option>
                <option value={8}>8px (Đậm)</option>
                <option value={10}>10px (Rất đậm)</option>
              </select>
            </div>
          </div>

          {/* Chọn màu LED */}
          <div className={styles.patternColorRow}>
            <span className={styles.fieldLabel} style={{ margin: 0 }}>Màu LED:</span>
            {['#BEFF01', '#00E5FF', '#A78BFA', '#34D399', '#FBBF24', '#FB7185'].map(hex => (
              <button
                key={hex}
                type="button"
                onClick={() => updateScene(currentScene.id, {
                  progressBar: {
                    ...(currentScene.progressBar || { enabled: true, position: 'bottom', style: 'laser-comet', height: 6 }),
                    color: hex
                  }
                })}
                className={`${styles.colorSwatch} ${(currentScene.progressBar?.color || '#BEFF01').toLowerCase() === hex.toLowerCase() ? styles.colorSwatchActive : ''}`}
                style={{ background: hex }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── CỤM 5: HIỆU ỨNG ÁNH SÁNG ĐIỆN ẢNH ── */}
      <SectionHeader
        title="Hiệu Ứng Ánh Sáng"
        action={
          <Button
            asIcon
            variant="ghost"
            size="icon-sm"
            title={`Đồng bộ hiệu ứng ánh sáng cho tất cả ${totalScenes} cảnh`}
            onClick={() => {
              const fx = currentScene.viralEffects || { vignettePulse: true, accentBreathe: true, microParticles: false };
              if (applyViralEffectsToAllScenes) {
                applyViralEffectsToAllScenes(fx);
              } else {
                applyBackgroundToAllScenes({ viralEffects: fx });
              }
              showToast(`Đã áp dụng hiệu ứng ánh sáng cho tất cả ${totalScenes} cảnh!`);
            }}
          >
            <SyncIcon />
          </Button>
        }
      />

      <div className={styles.effectsGroup}>
        <ToggleRow label="Viền tối">
          <Toggle
            checked={currentScene.viralEffects?.vignettePulse !== false}
            onChange={v => updateScene(currentScene.id, {
              viralEffects: { ...(currentScene.viralEffects || {}), vignettePulse: v }
            })}
          />
        </ToggleRow>

        <ToggleRow label="Ánh sáng thở">
          <Toggle
            checked={currentScene.viralEffects?.accentBreathe !== false}
            onChange={v => updateScene(currentScene.id, {
              viralEffects: { ...(currentScene.viralEffects || {}), accentBreathe: v }
            })}
          />
        </ToggleRow>

        <ToggleRow label="Bụi sao">
          <Toggle
            checked={currentScene.viralEffects?.microParticles === true}
            onChange={v => updateScene(currentScene.id, {
              viralEffects: { ...(currentScene.viralEffects || {}), microParticles: v }
            })}
          />
        </ToggleRow>
      </div>

      {/* ── NÚT ĐỒNG BỘ TOÀN BỘ CẢNH ── */}
      <div className={styles.syncDivider}>
        <Button
          variant="secondary"
          size="xs"
          onClick={handleApplyToAll}
          leftIcon={<SyncIcon />}
          title="Đồng bộ toàn bộ phông nền, máy quay, chuyển cảnh và thanh tiến trình cho tất cả các cảnh"
        >
          Áp dụng tất cả ({totalScenes} cảnh)
        </Button>
      </div>

    </div>
  );
}
