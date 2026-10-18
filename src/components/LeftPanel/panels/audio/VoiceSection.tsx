import React, { useState, useRef, useEffect } from 'react';
import apStyles from '../AudioPanel.module.css';
import { useEditorStore } from '@/store/useEditorStore';
import { useShallow } from 'zustand/react/shallow';
import { useSettingsStore } from '@/store/useSettingsStore';
import { Button, SegmentedControl, Select } from '@/components/ui';
import { VOICES } from '@/components/AiWizardModal/config/wizardCatalog';
import { generateBatchVoiceovers, BatchProgressInfo, requestTts } from '@/utils/batchAudioGenerator';
import { getAudioDuration } from '@/utils/audio';
import { getTransitionSec } from '@/utils/sceneTiming';
import { fitSceneDurationToAudio } from '@/config/pacingConfig';
import { API_BASE } from '@/config/api';
import { useAudioPreview } from '@/hooks/useAudioPreview';

export const TTS_MOODS = [
  { id: 'natural',      label: 'Tự nhiên',     rate: '+0%',  pitch: '+0Hz'  },
  { id: 'energetic',    label: 'Năng động',    rate: '+10%', pitch: '+5Hz'  },
  { id: 'professional', label: 'Chuyên nghiệp', rate: '-3%', pitch: '-5Hz'  },
  { id: 'calm',         label: 'Nhẹ nhàng',    rate: '-8%', pitch: '-8Hz'  },
  { id: 'persuasive',   label: 'Thuyết phục',  rate: '+5%', pitch: '+3Hz'  },
] as const;

export type TtsMoodId = typeof TTS_MOODS[number]['id'];

export function VoiceSection() {
  const {
    scenes, currentSceneIdx, updateScene, setScenes, setCurrentScene,
    audioClips, setAudioClips, addAudioClip, showToast, activeProjectId
  } = useEditorStore(
    useShallow(s => ({
      scenes: s.scenes,
      currentSceneIdx: s.currentSceneIdx,
      updateScene: s.updateScene,
      setScenes: s.setScenes,
      setCurrentScene: s.setCurrentScene,
      audioClips: s.audioClips,
      setAudioClips: s.setAudioClips,
      addAudioClip: s.addAudioClip,
      showToast: s.showToast,
      activeProjectId: s.activeProjectId,
    }))
  );

  const { geminiApiKey } = useSettingsStore();
  const { playingId, togglePreview } = useAudioPreview();

  const [voiceTab, setVoiceTab] = useState<'batch' | 'single'>('batch');
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0].id);
  const [selectedMood, setSelectedMood] = useState<TtsMoodId>('natural');
  const [selectedScenesForTTS, setSelectedScenesForTTS] = useState<Set<string>>(new Set());
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState<BatchProgressInfo | null>(null);
  const [isGeneratingTTS, setIsGeneratingTTS] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const currentScene = scenes[currentSceneIdx];

  // Auto-select scenes with text when in batch mode
  useEffect(() => {
    if (voiceTab === 'batch') {
      const allIds = scenes.filter(s => s.voiceoverText?.trim()).map(s => s.id);
      setSelectedScenesForTTS(new Set(allIds));
    }
  }, [voiceTab, scenes.length]);

  const handleCancelBatchTTS = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      showToast('Đã dừng quá trình tạo giọng đọc!', 3000);
    }
  };

  const handleBatchGenerateTTS = async () => {
    const scenesToProcess = scenes.filter(s => s.voiceoverText?.trim() && selectedScenesForTTS.has(s.id));
    
    if (scenesToProcess.length === 0) {
      return showToast('Không có cảnh nào được chọn hoặc cảnh được chọn chưa có lời đọc!', 4000);
    }
    const key = geminiApiKey.trim();
    if (!key) return showToast('Vui lòng cấu hình Gemini API Key tại mục Cài đặt!', 4000);

    const currentMood = TTS_MOODS.find(m => m.id === selectedMood) || TTS_MOODS[0];

    const abortCtrl = new AbortController();
    abortControllerRef.current = abortCtrl;

    setIsBatchGenerating(true);
    setBatchProgress({
      completed: 0,
      total: scenesToProcess.length,
      status: 'generating'
    });
    showToast(`Đang tạo giọng đọc đồng loạt cho ${scenesToProcess.length} cảnh...`, 2500);

    try {
      const result = await generateBatchVoiceovers(
        scenes,
        selectedVoice,
        key,
        API_BASE,
        {
          concurrency: 5,
          signal: abortCtrl.signal,
          onProgress: (prog) => {
            setBatchProgress(prog);
          },
          targetSceneIds: Array.from(selectedScenesForTTS),
          rate: currentMood.rate,
          pitch: currentMood.pitch,
          projectId: activeProjectId,
        }
      );

      // 1. Batch update all scenes in store
      const updatedScenes = scenes.map(s => {
        const update = result.sceneUpdates.find(u => u.id === s.id);
        return update ? { ...s, ...update.patch } : s;
      });
      setScenes(updatedScenes);

      // 2. Update audio clips (keep non-A1 clips and A1 clips belonging to unselected scenes)
      const processedSceneIds = new Set(result.sceneUpdates.map(u => u.id));
      const untouchedClips = audioClips.filter(c => {
        if (c.trackId !== 'A1') return true;
        return !processedSceneIds.has(c.sceneId!);
      });
      
      setAudioClips([...untouchedClips, ...result.audioClips]);

      if (abortCtrl.signal.aborted) {
        showToast(`Đã dừng. Giữ lại ${result.successCount} cảnh đã tạo xong!`, 3500);
      } else {
        showToast(
          result.failCount > 0
            ? `Đã tạo giọng đọc ${result.successCount}/${scenesToProcess.length} cảnh. ${result.failCount} cảnh lỗi: ${result.firstError}`
            : `Đã tạo xong giọng đọc cho ${result.successCount}/${scenesToProcess.length} cảnh đã chọn!`,
          result.failCount > 0 ? 6000 : 4000
        );
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || abortCtrl.signal.aborted) {
        showToast('Đã dừng tạo giọng đọc!', 3000);
      } else {
        showToast('Lỗi tạo giọng đọc đồng loạt: ' + err.message, 4000);
      }
    } finally {
      setIsBatchGenerating(false);
      setBatchProgress(null);
      abortControllerRef.current = null;
    }
  };

  const handleGenerateTTS = async () => {
    if (!currentScene) return;
    if (!currentScene.voiceoverText?.trim()) {
      return showToast('Cảnh này chưa có Nội dung Lời đọc (Voiceover Text). Hãy nhập vào tab Phụ Đề trước!', 3500);
    }
    const key = geminiApiKey.trim();
    if (!key) return showToast('Vui lòng cấu hình Gemini API Key tại mục Cài đặt!', 4000);

    setIsGeneratingTTS(true);
    showToast('Đang tạo Voiceover AI...', 2000);
    try {
      const currentMood = TTS_MOODS.find(m => m.id === selectedMood) || TTS_MOODS[0];
      
      const data = await requestTts(API_BASE, selectedVoice, {
        text: currentScene.voiceoverText,
        apiKey: key,
        rate: currentMood.rate,
        pitch: currentMood.pitch,
        projectId: activeProjectId,
        sceneId: currentScene.id,
      }, { timeoutMs: 30000 });

      const serverDur = typeof data.duration === 'number' && data.duration > 0 ? data.duration : 0;
      const rawDur = serverDur > 0 ? serverDur : await getAudioDuration(data.url);
      const realDuration = Math.max(1.2, Math.round(rawDur * 10) / 10);
      const fitSceneDuration = fitSceneDurationToAudio(realDuration, getTransitionSec(currentScene));

      const newElements = (currentScene.elements || []).map(el => {
        if (el.type === 'caption') {
          return { ...el, wordTimings: data.wordTimings };
        }
        return el;
      });

      updateScene(currentScene.id, { 
        voiceoverUrl: data.url, 
        voiceName: selectedVoice,
        duration: fitSceneDuration,
        voiceoverWordTimings: data.wordTimings,
        elements: newElements
      });

      const currentStartSec = scenes.slice(0, currentSceneIdx).reduce((acc, s) => acc + (s.duration || 3), 0);

      addAudioClip({
        name: `${selectedVoice.replace('Neural', '')} · ${currentScene.name}`,
        url: data.url,
        startSec: currentStartSec,
        duration: realDuration,
        playDurationSec: realDuration,
        volume: 1.0,
        trackId: 'A1',
        sceneId: currentScene.id,
      });

      showToast('Đã tạo Voice và chèn vào cảnh thành công!', 3500);
    } catch (err: any) {
      showToast('Lỗi tạo Voice: ' + err.message, 4000);
    } finally {
      setIsGeneratingTTS(false);
    }
  };

  return (
    <div className={apStyles.voiceCard}>
      {/* Mode Switcher */}
      <div className={apStyles.subTabMb}>
        <SegmentedControl
          options={[
            { value: 'batch', label: 'Tất Cả Cảnh' },
            { value: 'single', label: 'Cảnh Hiện Tại' }
          ]}
          value={voiceTab}
          onChange={(val) => setVoiceTab(val as any)}
          size="xs"
          fullWidth
        />
      </div>

      {voiceTab === 'batch' ? (
        /* ── BATCH PARALLEL MODE ── */
        <div className={apStyles.batchCol}>
          <div className={apStyles.batchHeader}>
            <span className={apStyles.batchHeaderLabel}>Giọng đọc:</span>
            <span className={apStyles.batchCount}>
              {scenes.filter(s => s.voiceoverText?.trim()).length}/{scenes.length} có lời
            </span>
          </div>

          <Select
            native
            size="sm"
            value={selectedVoice}
            onChange={val => setSelectedVoice(val)}
            options={VOICES.map(v => ({ value: v.id, label: v.name }))}
          />

          {/* Global TTS Mood Selector */}
          <div className={apStyles.fieldCol}>
            <span className={apStyles.fieldLabel}>PHONG CÁCH ĐỌC</span>
            <Select
              native
              size="sm"
              value={selectedMood}
              onChange={val => setSelectedMood(val as TtsMoodId)}
              options={TTS_MOODS.map(m => ({
                value: m.id,
                label: `${m.label} (${m.rate === '+0%' ? 'Chuẩn' : m.rate})`
              }))}
            />
          </div>

          {/* Progress Card / Generate Button */}
          {isBatchGenerating && batchProgress ? (
            <div className={apStyles.progressCard}>
              <div className={apStyles.progressHeader}>
                <div className={apStyles.progressHeaderLeft}>
                  <span className={apStyles.progressLabel}>
                    Đang tạo ({batchProgress.completed}/{batchProgress.total})...
                  </span>
                </div>
                <span className={apStyles.progressPct}>
                  {Math.round((batchProgress.completed / Math.max(1, batchProgress.total)) * 100)}%
                </span>
              </div>

              <div className={apStyles.progressTrack}>
                <div
                  className={apStyles.progressFill}
                  style={{ width: `${(batchProgress.completed / Math.max(1, batchProgress.total)) * 100}%` }}
                />
              </div>

              <Button
                variant="danger"
                solid
                size="md"
                fullWidth
                onClick={handleCancelBatchTTS}
              >
                Dừng Tạo Giọng
              </Button>
            </div>
          ) : (
            <Button
              variant="primary"
              size="md"
              fullWidth
              disabled={selectedScenesForTTS.size === 0}
              onClick={handleBatchGenerateTTS}
            >
              Tạo giọng ({selectedScenesForTTS.size} cảnh)
            </Button>
          )}

          {/* Quick Selection Toolbar */}
          <div className={apStyles.selectionBar}>
            <span className={apStyles.selectionLabel}>
              CẢNH ÁP DỤNG ({selectedScenesForTTS.size}/{scenes.length})
            </span>
            <div className={apStyles.selectionBtnGroup}>
              <Button
                variant="secondary"
                size="xs"
                onClick={() => {
                  const allIds = scenes.filter(s => s.voiceoverText?.trim()).map(s => s.id);
                  setSelectedScenesForTTS(new Set(allIds));
                }}
                className={apStyles.selectionActionBtn}
              >
                Chọn tất cả
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setSelectedScenesForTTS(new Set())}
                className={apStyles.selectionActionBtn}
              >
                Bỏ chọn
              </Button>
            </div>
          </div>

          {/* Scene Checklist */}
          <div className={apStyles.sceneList}>
            {scenes.map((s, idx) => {
              const hasVoice = Boolean(
                s.voiceoverUrl && audioClips.some(c => c.trackId === 'A1' && (c.sceneId === s.id || c.url === s.voiceoverUrl))
              );
              const hasText = !!s.voiceoverText?.trim();
              const isCurrent = currentSceneIdx === idx;
              const isPreviewing = playingId === `scene-${s.id}`;

              return (
                <div
                  key={s.id}
                  onClick={() => setCurrentScene(idx)}
                  className={`${apStyles.sceneRow} ${isCurrent ? apStyles.sceneRowActive : ''}`}
                >
                  <div className={apStyles.sceneLeft}>
                    <input
                      type="checkbox"
                      checked={selectedScenesForTTS.has(s.id)}
                      disabled={!hasText}
                      onChange={(e) => {
                        e.stopPropagation();
                        const next = new Set(selectedScenesForTTS);
                        if (e.target.checked) next.add(s.id);
                        else next.delete(s.id);
                        setSelectedScenesForTTS(next);
                      }}
                      className={apStyles.sceneCheckbox}
                    />
                    <span className={`${apStyles.sceneName} ${isCurrent ? apStyles.sceneNameActive : ''}`}>
                      Cảnh {idx + 1}
                    </span>
                    <span className={`${apStyles.sceneText} ${!hasText ? apStyles.sceneTextEmpty : ''}`}>
                      {s.voiceoverText || '(Chưa có lời đọc)'}
                    </span>
                  </div>

                  <div className={apStyles.sceneRight}>
                    {hasVoice ? (
                      <>
                        <span className={apStyles.sceneBadgeOk}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', marginRight: 3, verticalAlign: '-1px' }}>
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          {s.duration ? `${s.duration}s` : 'OK'}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePreview(`scene-${s.id}`, s.voiceoverUrl!);
                          }}
                          className={apStyles.previewBtn}
                          title="Nghe thử"
                        >
                          {isPreviewing ? (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                              <rect x="6" y="4" width="4" height="16" />
                              <rect x="14" y="4" width="4" height="16" />
                            </svg>
                          ) : (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                          )}
                        </button>
                      </>
                    ) : hasText ? (
                      <span className={apStyles.sceneBadgePending}>Chờ tạo</span>
                    ) : (
                      <span className={apStyles.sceneBadgeWarn}>Trống</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── SINGLE SCENE MODE ── */
        <div className={apStyles.singleCol}>
          <div className={apStyles.voiceoverPreview}>
            "{currentScene?.voiceoverText || 'Cảnh này chưa có lời đọc. Hãy sang tab "Phụ đề" nhập nội dung để tạo TTS.'}"
          </div>

          <div className={apStyles.fieldCol}>
            <span className={apStyles.fieldLabel}>GIỌNG ĐỌC</span>
            <Select
              native
              size="sm"
              value={selectedVoice}
              onChange={val => setSelectedVoice(val)}
              options={VOICES.map(v => ({ value: v.id, label: `${v.name}` }))}
            />
          </div>

          <div className={apStyles.fieldCol}>
            <span className={apStyles.fieldLabel}>PHONG CÁCH ĐỌC</span>
            <Select
              native
              size="sm"
              value={selectedMood}
              onChange={val => setSelectedMood(val as TtsMoodId)}
              options={TTS_MOODS.map(m => ({
                value: m.id,
                label: `${m.label} (${m.rate === '+0%' ? 'Chuẩn' : m.rate})`
              }))}
            />
          </div>

          <Button
            variant="primary"
            size="md"
            fullWidth
            disabled={isGeneratingTTS || !currentScene?.voiceoverText?.trim()}
            onClick={handleGenerateTTS}
          >
            {isGeneratingTTS ? 'Đang tạo...' : 'Tạo Voice'}
          </Button>
        </div>
      )}
    </div>
  );
}
