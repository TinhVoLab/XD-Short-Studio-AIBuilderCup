import React from 'react'
import { useEditorStore } from '@/store/useEditorStore'
import { useAiWizardStore } from '@/store/useAiWizardStore'
import { useShallow } from 'zustand/react/shallow'
import { Button } from '@/components/ui'

export default function FloatingAiWizardWidget() {
  const { aiWizardOpen, setAiWizardOpen, activeRenderJob, isBatchProcessing, showToast } = useEditorStore(
    useShallow((s) => ({
      aiWizardOpen: s.aiWizardOpen,
      setAiWizardOpen: s.setAiWizardOpen,
      activeRenderJob: s.activeRenderJob,
      isBatchProcessing: s.isBatchProcessing,
      showToast: s.showToast,
    }))
  )

  const {
    isGenerating,
    genProgress,
    genStatus,
    isAudioGenerating,
    audioProgress,
    generatedScenes,
    step,
    resetDraft,
  } = useAiWizardStore(
    useShallow((s) => ({
      isGenerating: s.isGenerating,
      genProgress: s.genProgress,
      genStatus: s.genStatus,
      isAudioGenerating: s.isAudioGenerating,
      audioProgress: s.audioProgress,
      generatedScenes: s.generatedScenes,
      step: s.step,
      resetDraft: s.resetDraft,
    }))
  )

  // Chỉ hiển thị khi Modal đang đóng VÀ (đang chạy ngầm HOẶC đang có bản nháp kịch bản ở Step 1/2)
  const hasActiveJob = isGenerating || isAudioGenerating
  const hasDraft = !hasActiveJob && generatedScenes.length > 0 && step >= 1

  if (aiWizardOpen || (!hasActiveJob && !hasDraft)) {
    return null
  }

  // Tránh đè lên FloatingRenderWidget nếu đang xuất video
  const hasRenderWidget = Boolean(activeRenderJob || isBatchProcessing)
  const bottomOffset = hasRenderWidget ? 90 : 24

  const openWizard = () => {
    setAiWizardOpen(true)
  }

  const handleDiscardDraft = (e: React.MouseEvent) => {
    e.stopPropagation()
    resetDraft()
    showToast('Đã dọn dẹp bản nháp kịch bản', 2000)
  }

  return (
    <div
      onClick={openWizard}
      style={{
        position: 'fixed',
        bottom: bottomOffset,
        right: 24,
        zIndex: 999,
        background: 'rgba(13, 17, 23, 0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(190, 255, 1, 0.35)',
        borderRadius: 12,
        padding: '10px 14px',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.65), 0 0 20px rgba(190, 255, 1, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        minWidth: 320,
        maxWidth: 420,
        cursor: 'pointer',
        transition: 'bottom 0.25s ease, transform 0.15s ease',
      }}
      title="Bấm để mở lại AI Wizard Studio"
    >
      {/* Icon trạng thái */}
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          background: hasActiveJob ? 'rgba(190, 255, 1, 0.12)' : 'rgba(255, 255, 255, 0.06)',
          border: `1px solid ${hasActiveJob ? 'rgba(190, 255, 1, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {hasActiveJob ? (
            <path
              d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
              fill="var(--accent)"
              stroke="var(--accent)"
            />
          ) : (
            <>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </>
          )}
        </svg>
      </div>

      {/* Thông tin tiến độ */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
          <span style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: '#f0f6fc' }}>
            {isGenerating
              ? 'AI đang thiết kế kịch bản...'
              : isAudioGenerating
              ? 'AI đang tạo giọng đọc...'
              : `Bản nháp AI (${generatedScenes.length} cảnh)`}
          </span>
          {hasActiveJob && (
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--accent)', fontWeight: 700, fontFamily: 'monospace' }}>
              {Math.round(isGenerating ? genProgress : audioProgress)}%
            </span>
          )}
        </div>

        {hasActiveJob ? (
          <div>
            <div
              style={{
                height: 4,
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 2,
                overflow: 'hidden',
                marginTop: 4,
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${isGenerating ? genProgress : audioProgress}%`,
                  background: 'var(--accent)',
                  borderRadius: 2,
                  transition: 'width 0.2s ease',
                }}
              />
            </div>
            <div
              style={{
                fontSize: 'var(--font-xs)',
                color: 'var(--text-sub)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {genStatus || 'Đang xử lý trong nền...'}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-sub)' }}>
            Kịch bản đã sẵn sàng · Bấm để tiếp tục
          </div>
        )}
      </div>

      {/* Nút hành động */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
        <Button
          variant="primary"
          size="xs"
          onClick={openWizard}
        >
          {hasActiveJob ? 'Xem' : 'Tiếp tục'}
        </Button>

        {hasDraft && (
          <Button
            asIcon
            variant="ghost"
            size="icon-xs"
            onClick={handleDiscardDraft}
            title="Xóa bản nháp này"
          >
            ✕
          </Button>
        )}
      </div>
    </div>
  )
}
