import React, { useState, useRef } from 'react';
import { Player } from '@remotion/player';
import { toPng } from 'html-to-image';
import { Button } from '@/components/ui';
import { useHookLibraryStore } from '@/store/useHookLibraryStore';
import { useEditorStore } from '@/store/useEditorStore';
import { MasterHookTemplateV2_1 } from '@/types/hookLibraryV2';
import { generateViralHooks, GeneratedHookVariantV2 } from '@/services/geminiHookService';
import { HookComposition } from '@/remotion/compositions/HookComposition';

interface Props {
  open: boolean;
  onClose: () => void;
}

const QUICK_PROMPTS = [
  '3 sai lầm khiến bạn mất tiền khi chạy Ads',
  'Bí mật ít ai biết để tăng 10.000 follow',
  'Tại sao 99% người học lập trình bỏ cuộc',
  'Quy trình từng bước để đạt 100 triệu đầu tiên',
];

export function HookAIGenerateModal({ open, onClose }: Props) {
  const [step, setStep] = useState<'input' | 'results'>('input');
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [variants, setVariants] = useState<GeneratedHookVariantV2[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activePreviewId, setActivePreviewId] = useState<string>('');
  const [genSource, setGenSource] = useState<'gemini' | 'cache' | 'offline_fallback'>('gemini');

  const previewContainerRef = useRef<HTMLDivElement>(null);

  const { addTemplate, insertIntoProject } = useHookLibraryStore();
  const { showToast } = useEditorStore();

  if (!open) return null;

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);

    try {
      const result = await generateViralHooks(topic.trim(), 'kinetic', 4500);
      setVariants(result.variants);
      setGenSource(result.source);
      setSelectedIds(result.variants.map((v) => v.id)); // Mặc định chọn tất cả
      if (result.variants.length > 0) {
        setActivePreviewId(result.variants[0].id);
      }
      setStep('results');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi sinh phương án Hook');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setActivePreviewId(id);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === variants.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(variants.map((v) => v.id));
    }
  };

  const captureThumbnail = async (): Promise<string | undefined> => {
    if (!previewContainerRef.current) return undefined;
    try {
      return await toPng(previewContainerRef.current, {
        quality: 0.85,
        pixelRatio: 1,
      });
    } catch (err) {
      console.warn('[HookAIGenerateModal] Could not capture thumbnail:', err);
      return undefined;
    }
  };

  const buildTemplatePayload = (
    v: GeneratedHookVariantV2,
    thumbnailUrl?: string
  ): Omit<MasterHookTemplateV2_1, 'id' | 'createdAt' | 'isBuiltIn' | 'isLocked' | 'schemaVersion'> => {
    return {
      name: v.name,
      description: `Sinh từ chủ đề: ${topic}`,
      visualStyle: v.visualStyle,
      psychArchetype: v.psychArchetype,
      category: v.visualStyle,
      tags: ['ai-generated', v.layoutStyle, v.visualStyle],
      source: genSource,
      thumbnailUrl,
      thumbnailFormat: thumbnailUrl ? 'png' : undefined,
      metrics: {
        viralScore: v.viralScore,
        curiosityIndex: 90,
        readabilityScore: 95,
      },
      sceneConfig: {
        duration: 4,
        bgColor: '#09090b',
        bgPattern: 'grid',
        cameraMotion: 'zoom-in',
        transitionOut: 'glitch',
        sfxSequence: v.sfxSequence,
      },
      hookData: {
        archetype: v.psychArchetype as any,
        layoutStyle: v.layoutStyle,
        badgeText: v.badgeText,
        heroTitle: v.heroTitle,
        heroLine2: v.heroLine2,
        statValue: v.statValue,
        statLabel: v.statLabel,
        highlightWords: v.highlightWords,
        wordAnimation: 'stagger-pop',
        accentColor: v.accentColor,
        subText: v.subText,
        fontSize: 40,
      },
      editableSlots: {
        heroTitle: v.heroTitle,
        heroLine2: v.heroLine2,
        badgeText: v.badgeText,
        subText: v.subText,
        accentColor: v.accentColor,
        highlightWords: v.highlightWords,
        statValue: v.statValue,
        statLabel: v.statLabel,
      },
      createdBy: 'ai',
    };
  };

  // Batch Save Selected to Library
  const handleSaveSelectedToLibrary = async () => {
    const toSave = variants.filter((v) => selectedIds.includes(v.id));
    if (toSave.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 phương án để lưu.');
      return;
    }

    setIsSaving(true);
    try {
      const thumbnail = await captureThumbnail();
      let savedCount = 0;
      for (const v of toSave) {
        await addTemplate(buildTemplatePayload(v, thumbnail));
        savedCount++;
      }
      showToast(`Đã lưu thành công ${savedCount} mẫu Hook vào Thư viện.`);
      handleResetAndClose();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi lưu vào Thư viện.');
    } finally {
      setIsSaving(false);
    }
  };

  // Apply Active Variant to Timeline Video Immediately
  const handleApplyToTimeline = async () => {
    const target = variants.find((v) => v.id === activePreviewId) || variants[0];
    if (!target) return;

    setIsSaving(true);
    try {
      const thumbnail = await captureThumbnail();
      const newId = await addTemplate(buildTemplatePayload(target, thumbnail));
      insertIntoProject(newId);
      showToast(`Đã chèn mẫu Hook "${target.label}" vào Timeline!`);
      handleResetAndClose();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi chèn vào Video.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetAndClose = () => {
    setStep('input');
    setTopic('');
    setVariants([]);
    setSelectedIds([]);
    setIsGenerating(false);
    setIsSaving(false);
    onClose();
  };

  const activeVariant = variants.find((v) => v.id === activePreviewId) || variants[0];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(10px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        boxSizing: 'border-box',
      }}
      onClick={(e) => e.target === e.currentTarget && !isSaving && handleResetAndClose()}
    >
      <div
        style={{
          background: '#121215',
          border: '1px solid #2e2e34',
          borderRadius: 14,
          width: '100%',
          maxWidth: step === 'input' ? 620 : 1060,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 30px 80px rgba(0,0,0,0.95)',
          transition: 'max-width 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Modal Header (Clean & Minimalist) */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #27272c',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#f4f4f5', letterSpacing: '0.2px' }}>
              AI Master Hook Generator
            </div>
            <div style={{ fontSize: 12, color: '#8e8e93', marginTop: 3 }}>
              {step === 'input'
                ? 'Khởi tạo kịch bản Hook thu hút 3s đầu theo tâm lý học Short-form'
                : 'Chọn phương án kịch bản và xem trước trực tiếp trên khung hình 9:16'}
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            disabled={isSaving}
            style={{
              background: '#1e1e24',
              border: '1px solid #33333b',
              color: '#a1a1aa',
              fontSize: 13,
              fontWeight: 600,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              padding: '6px 14px',
              borderRadius: 6,
              transition: 'all 0.15s ease',
            }}
          >
            Đóng
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px' }}>
          {step === 'input' ? (
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#d4d4d8', marginBottom: 8 }}>
                Chủ đề hoặc ý tưởng Video
              </label>
              <textarea
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: '#18181c',
                  border: '1px solid #2e2e34',
                  borderRadius: 8,
                  color: '#ffffff',
                  fontSize: 15,
                  lineHeight: 1.5,
                  resize: 'vertical',
                  minHeight: 110,
                  outline: 'none',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
                placeholder="VD: 3 sai lầm khiến bạn mất tiền khi chạy quảng cáo Facebook..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={isGenerating}
                autoFocus
              />

              {/* Quick Prompts */}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, color: '#8e8e93', marginBottom: 8, fontWeight: 600 }}>
                  Gợi ý chủ đề nhanh:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {QUICK_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setTopic(prompt)}
                      style={{
                        background: '#1c1c22',
                        border: '1px solid #2e2e36',
                        borderRadius: 6,
                        padding: '6px 12px',
                        fontSize: 12.5,
                        color: '#d4d4d8',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#4a4a55';
                        e.currentTarget.style.color = '#ffffff';
                        e.currentTarget.style.background = '#25252d';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#2e2e36';
                        e.currentTarget.style.color = '#d4d4d8';
                        e.currentTarget.style.background = '#1c1c22';
                      }}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div style={{ marginTop: 24 }}>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleGenerate}
                  disabled={!topic.trim() || isGenerating}
                  style={{ width: '100%', fontWeight: 700, fontSize: 14, padding: '12px 0' }}
                >
                  {isGenerating ? 'Đang phân tích và thiết kế 3 phương án...' : 'Phân tích và Tạo 3 phương án'}
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {/* ── 2-COLUMN SPLIT LAYOUT: LEFT (Cards Selection) / RIGHT (9:16 Phone Preview) ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, alignItems: 'start', marginBottom: 20 }}>
                {/* ── LEFT COLUMN: Cards List ── */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>
                      Đã sinh {variants.length} phương án ({selectedIds.length}/{variants.length} được chọn để lưu)
                    </div>
                    <button
                      onClick={toggleSelectAll}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--accent)',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      {selectedIds.length === variants.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 480, overflowY: 'auto', paddingRight: 4 }}>
                    {variants.map((v) => {
                      const isChecked = selectedIds.includes(v.id);
                      const isActive = activePreviewId === v.id;

                      return (
                        <div
                          key={v.id}
                          onClick={() => setActivePreviewId(v.id)}
                          style={{
                            background: isActive ? '#1c1c22' : '#141417',
                            border: `1.5px solid ${isActive ? v.accentColor : isChecked ? '#3f3f46' : '#27272a'}`,
                            borderRadius: 10,
                            padding: '14px 16px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            transition: 'all 0.15s ease',
                            boxShadow: isActive ? `0 4px 20px ${v.accentColor}18` : 'none',
                          }}
                        >
                          <div>
                            {/* Header checkbox + title + Viral Score */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 13, fontWeight: 800, color: isActive ? '#ffffff' : '#e4e4e7' }}>
                                  {v.label}
                                </span>
                                  <span
                                    style={{
                                      fontSize: 10.5,
                                      fontWeight: 800,
                                      color: v.viralScore >= 90 ? '#BEFF01' : '#00D4FF',
                                      background: 'rgba(255,255,255,0.06)',
                                      padding: '2px 6px',
                                      borderRadius: 4,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                    }}
                                  >
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                                      <polyline points="17 6 23 6 23 12" />
                                    </svg>
                                    {v.viralScore}%
                                  </span>
                              </div>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleSelect(v.id);
                                }}
                                style={{ cursor: 'pointer', width: 17, height: 17 }}
                              />
                            </div>

                            {/* Text Content */}
                            <div style={{ fontSize: 13, color: '#f4f4f5', fontWeight: 700, lineHeight: 1.35 }}>
                              {v.heroTitle}
                            </div>
                            {v.heroLine2 && (
                              <div style={{ fontSize: 13.5, color: v.accentColor, fontWeight: 900, marginTop: 4 }}>
                                {v.heroLine2}
                              </div>
                            )}
                            {v.statValue && (
                              <div style={{ fontSize: 24, color: v.accentColor, fontWeight: 900, marginTop: 4 }}>
                                {v.statValue} <span style={{ fontSize: 12, color: '#a1a1aa', fontWeight: 600 }}>{v.statLabel}</span>
                              </div>
                            )}
                            {v.subText && (
                              <div style={{ fontSize: 11.5, color: '#71717a', marginTop: 6, fontStyle: 'italic' }}>
                                {v.subText}
                              </div>
                            )}
                          </div>

                          {/* Card Meta Footer */}
                          <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 10, color: v.accentColor, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              {v.visualStyle} • {v.layoutStyle}
                            </span>
                            <span style={{ fontSize: 11, color: isActive ? '#BEFF01' : '#71717a', fontWeight: isActive ? 700 : 400, display: 'flex', alignItems: 'center', gap: 5 }}>
                              {isActive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#BEFF01', display: 'inline-block' }} />}
                              {isActive ? 'Đang phát trên 9:16' : 'Bấm để phát'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── RIGHT COLUMN: 9:16 Phone Frame Preview ── */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: 12, color: '#a1a1aa', fontWeight: 600, marginBottom: 8, width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Xem trước 9:16</span>
                    <span style={{ fontSize: 10.5, color: '#71717a' }}>30fps • Frame-sync SFX</span>
                  </div>

                  {/* Phone Frame Device Mockup */}
                  {activeVariant && (
                    <div
                      ref={previewContainerRef}
                      style={{
                        width: '265px',
                        height: '470px',
                        borderRadius: 20,
                        overflow: 'hidden',
                        border: '2px solid #2e2e36',
                        background: '#09090b',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.05)',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      {/* Subtle Phone Notch Bar */}
                      <div
                        style={{
                          height: 16,
                          background: '#09090b',
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'absolute',
                          top: 0,
                          zIndex: 10,
                          pointerEvents: 'none',
                        }}
                      >
                        <div style={{ width: 44, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.18)' }} />
                      </div>

                      <Player
                        component={HookComposition}
                        durationInFrames={120}
                        fps={30}
                        compositionWidth={360}
                        compositionHeight={640}
                        style={{ width: '100%', height: '100%' }}
                        inputProps={{
                          hookData: {
                            archetype: activeVariant.psychArchetype as any,
                            layoutStyle: activeVariant.layoutStyle,
                            badgeText: activeVariant.badgeText,
                            heroTitle: activeVariant.heroTitle,
                            heroLine2: activeVariant.heroLine2,
                            statValue: activeVariant.statValue,
                            statLabel: activeVariant.statLabel,
                            highlightWords: activeVariant.highlightWords,
                            accentColor: activeVariant.accentColor,
                            subText: activeVariant.subText,
                            wordAnimation: 'stagger-pop',
                            fontSize: 38,
                          },
                          sceneConfig: {
                            duration: 4,
                            bgColor: '#09090b',
                            sfxSequence: activeVariant.sfxSequence,
                          },
                          accentColor: activeVariant.accentColor,
                          enableAudio: true,
                        }}
                        controls
                        autoPlay
                        loop
                        acknowledgeRemotionLicense
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingTop: 12, borderTop: '1px solid #27272c' }}>
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => setStep('input')}
                  disabled={isSaving}
                  style={{ fontSize: 12.5, fontWeight: 600, padding: '8px 16px' }}
                >
                  Quay lại
                </Button>

                <div style={{ display: 'flex', gap: 10 }}>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={handleSaveSelectedToLibrary}
                    disabled={selectedIds.length === 0 || isSaving}
                    style={{ fontSize: 12.5, fontWeight: 600, padding: '8px 18px' }}
                  >
                    {isSaving ? 'Đang lưu...' : `Lưu vào Thư viện (${selectedIds.length})`}
                  </Button>

                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleApplyToTimeline}
                    disabled={isSaving}
                    style={{ fontSize: 12.5, fontWeight: 700, padding: '8px 20px' }}
                  >
                    {isSaving ? 'Đang áp dụng...' : 'Chèn vào Timeline ngay'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
