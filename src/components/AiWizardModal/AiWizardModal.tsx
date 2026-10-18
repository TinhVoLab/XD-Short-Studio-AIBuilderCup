import React from 'react'
import { STEP_LABELS } from './config/wizardCatalog'
import { useAiWizardState } from './hooks/useAiWizardState'
import { Step0IdeaSettings } from './components/Step0IdeaSettings'
import { Step1ScriptEditor } from './components/Step1ScriptEditor'
import { Step2VoiceStudio } from './components/Step2VoiceStudio'
import { Button } from '@/components/ui'
import styles from './AiWizardModal.module.css'

export default function AiWizardModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const wizard = useAiWizardState(open, onClose)

  if (!open) return null

  const hasScript = wizard.generatedScenes.length > 0
  // Quay lại bước trước luôn được; tới bước sau chỉ khi đã có kịch bản
  const canGoTo = (i: number) => i !== wizard.step && !wizard.generating && (i < wizard.step || hasScript)

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="ai-wizard-title">
        <header className={styles.header}>
          <div className={styles.brandIcon} aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
              <path d="M19 17l.7 1.8 1.8.7-1.8.7L19 22l-.7-1.8-1.8-.7 1.8-.7z" />
            </svg>
          </div>
          <div className={styles.titleBlock}>
            <h2 id="ai-wizard-title" className={styles.title}>Tạo video mới</h2>
            <p className={styles.subtitle}>Từ một ý tưởng thành video 9:16 hoàn chỉnh</p>
          </div>

          <nav aria-label="Các bước" className={styles.steps}>
            {STEP_LABELS.map((label, i) => {
              const state = i === wizard.step ? 'current' : i < wizard.step ? 'done' : 'todo'
              return (
                <button
                  key={label}
                  type="button"
                  className={styles.step}
                  data-state={state}
                  aria-current={state === 'current' ? 'step' : undefined}
                  disabled={!canGoTo(i) && state !== 'current'}
                  onClick={() => canGoTo(i) && wizard.setStep(i)}
                >
                  <span className={styles.stepDot}>
                    {state === 'done' ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M5 12l5 5L20 7" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </span>
                  {label}
                </button>
              )
            })}
          </nav>

          <div className={styles.actions}>
            {wizard.step >= 1 && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  if (window.confirm('Xoá bản nháp này để tạo kịch bản mới từ đầu?')) wizard.resetDraft()
                }}
                title="Xoá bản nháp để nhập ý tưởng mới"
              >
                Kịch bản mới
              </Button>
            )}
            <Button asIcon variant="ghost" size="icon-sm" onClick={onClose} aria-label="Thu nhỏ" title="Thu nhỏ để xem timeline, tiến trình vẫn chạy">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M5 12h14" />
              </svg>
            </Button>
            <Button asIcon variant="ghost" size="icon-sm" onClick={onClose} aria-label="Đóng" title="Đóng, bản nháp được lưu tự động">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </Button>
          </div>
        </header>

        <div className={styles.content}>
          {wizard.step === 0 && (
            <Step0IdeaSettings
              geminiApiKey={wizard.geminiApiKey}
              deepseekApiKey={wizard.deepseekApiKey}
              scriptModel={wizard.scriptModel}
              setScriptModel={wizard.setScriptModel}
              idea={wizard.idea}
              setIdea={wizard.setIdea}
              ideaWordsCount={wizard.ideaWordsCount}
              sourceMaterial={wizard.sourceMaterial}
              setSourceMaterial={wizard.setSourceMaterial}
              sourceWordsCount={wizard.sourceWordsCount}
              showSourceInput={wizard.showSourceInput}
              setShowSourceInput={wizard.setShowSourceInput}
              targetDuration={wizard.targetDuration}
              setTargetDuration={wizard.setTargetDuration}
              maxVideoSec={wizard.maxVideoSec}
              viralFramework={wizard.viralFramework}
              setViralFramework={wizard.setViralFramework}
              selectedTemplateId={wizard.selectedTemplateId}
              setSelectedTemplateId={wizard.setSelectedTemplateId}
              style={wizard.style}
              setStyle={wizard.setStyle}
              isSuggestingStyle={wizard.isSuggestingStyle}
              handleSuggestStyle={wizard.handleSuggestStyle}
              color={wizard.color}
              setColor={wizard.setColor}
              accentColor={wizard.accentColor}
              generating={wizard.generating}
              genStatus={wizard.genStatus}
              genProgress={wizard.genProgress}
              handleGenerate={wizard.handleGenerate}
              handleCancelGeneration={wizard.handleCancelGeneration}
              hasDraft={hasScript}
              generatedScenesCount={wizard.generatedScenes.length}
              onContinueDraft={() => wizard.setStep(1)}
              onCreateBlank={wizard.handleCreateBlankProject}
              onClose={onClose}
            />
          )}

          {wizard.step === 1 && (
            <Step1ScriptEditor
              generatedScenes={wizard.generatedScenes}
              setGeneratedScenes={wizard.setGeneratedScenes}
              totalEstDurationSec={wizard.totalEstDurationSec}
              totalWordsCount={wizard.totalWordsCount}
              targetDuration={wizard.targetDuration}
              accentColor={wizard.accentColor}
              setStep={wizard.setStep}
              onRegenerateVariation={wizard.handleRegenerateVariation}
              deepseekReasoning={wizard.deepseekReasoning}
              handleApplyOnlyScript={wizard.handleApplyOnlyScript}
            />
          )}

          {wizard.step === 2 && (
            <Step2VoiceStudio
              voice={wizard.voice}
              setVoice={wizard.setVoice}
              previewingVoice={wizard.previewingVoice}
              handlePreviewVoice={wizard.handlePreviewVoice}
              generatedScenes={wizard.generatedScenes}
              audioGenerating={wizard.audioGenerating}
              audioProgress={wizard.audioProgress}
              accentColor={wizard.accentColor}
              setStep={wizard.setStep}
              handleGenerateAudioAndApply={wizard.handleGenerateAudioAndApply}
              handleApplyOnlyScript={wizard.handleApplyOnlyScript}
              hasGeminiKey={Boolean(wizard.geminiApiKey?.trim()) && !wizard.geminiApiKey.trim().startsWith('sk-')}
              speechRate={wizard.speechRate}
              setSpeechRate={wizard.setSpeechRate}
              captionsOn={wizard.captionsOn}
              setCaptionsOn={wizard.setCaptionsOn}
              targetDuration={wizard.targetDuration}
            />
          )}
        </div>
      </section>
    </div>
  )
}
