import React, { useState, useEffect, useMemo } from 'react'
import styles from './AiMagicFillModal.module.css'
import { Button } from '@/components/ui'
import { useEditorStore } from '@/store/useEditorStore'
import { useSettingsStore } from '@/store/useSettingsStore'
import { getPromptChipsForElement, PromptChip } from './data/promptChipsRegistry'
import { aiAssistantService } from '@/services/aiAssistantService'

interface AiMagicFillModalProps {
  isOpen: boolean
  onClose: () => void
  element: any
}

export const AiMagicFillModal: React.FC<AiMagicFillModalProps> = ({
  isOpen,
  onClose,
  element,
}) => {
  const { scenes, currentSceneIdx, updateElement, showToast } = useEditorStore()
  const { geminiApiKey, deepseekApiKey } = useSettingsStore()

  const [prompt, setPrompt] = useState('')
  const [selectedChipId, setSelectedChipId] = useState<string | null>(null)
  const [useVoiceover, setUseVoiceover] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [previewPatch, setPreviewPatch] = useState<Record<string, any> | null>(null)
  const [previewSummary, setPreviewSummary] = useState<string>('')

  const currentScene = scenes[currentSceneIdx]
  const voiceoverText = currentScene?.voiceoverText || currentScene?.description || ''

  const chips = useMemo(() => {
    return element?.type ? getPromptChipsForElement(element.type) : []
  }, [element?.type])

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setPrompt('')
      setSelectedChipId(null)
      setPreviewPatch(null)
      setPreviewSummary('')
      setUseVoiceover(Boolean(voiceoverText.trim()))
    }
  }, [isOpen, voiceoverText])

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isLoading, onClose])

  if (!isOpen || !element) return null

  const handleChipClick = (chip: PromptChip) => {
    if (selectedChipId === chip.id) {
      setSelectedChipId(null)
      setPrompt('')
    } else {
      setSelectedChipId(chip.id)
      setPrompt(chip.prompt)
    }
  }

  const handleGenerate = async () => {
    if (!geminiApiKey && !deepseekApiKey) {
      showToast('Vui lòng cấu hình API Key (Gemini hoặc DeepSeek) trong phần Cài đặt.')
      return
    }

    setIsLoading(true)
    try {
      const result = await aiAssistantService.generateChartDataWithAi({
        elementType: element.type,
        elementId: element.id,
        customPrompt: prompt.trim() || undefined,
        includeVoiceover: useVoiceover,
      })

      if (result && result.patch) {
        setPreviewPatch(result.patch)
        setPreviewSummary(result.summary || 'Đã sinh dữ liệu thành công!')
      }
    } catch (err: any) {
      console.error('Magic Fill Error:', err)
      showToast(`Lỗi AI: ${err.message || 'Không thể sinh dữ liệu'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApply = () => {
    if (previewPatch) {
      updateElement(element.id, previewPatch)
      showToast('Đã cập nhật biểu đồ với dữ liệu AI!')
      onClose()
    }
  }

  const handleQuickApply = async () => {
    if (!geminiApiKey && !deepseekApiKey) {
      showToast('Vui lòng cấu hình API Key (Gemini hoặc DeepSeek) trong phần Cài đặt.')
      return
    }

    setIsLoading(true)
    try {
      await aiAssistantService.fillChartDataWithAi({
        elementType: element.type,
        elementId: element.id,
        customPrompt: prompt.trim() || undefined,
        includeVoiceover: useVoiceover,
      })
      onClose()
    } catch (err: any) {
      showToast(`Lỗi AI: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const formatElementLabel = (type: string): string => {
    const map: Record<string, string> = {
      'candlestick-chart': 'Biểu Đồ Nến',
      'racing-bar-chart': 'Cột Tăng Trưởng',
      'waterfall-chart': 'Thác Nước Tài Chính',
      'chart-bar': 'Biểu Đồ Cột',
      'line-chart': 'Biểu Đồ Đường',
      'radar-chart': 'Biểu Đồ Radar',
      'funnel-flow': 'Phễu Chuyển Đổi',
      'pyramid-funnel': 'Tháp Kim Tự Tháp',
      'roadmap-flow': 'Lộ Trình & Milestones',
      'mindmap-flow': 'Sơ Đồ Tư Duy',
      'tree-diagram': 'Sơ Đồ Cây',
      'checklist': 'Danh Sách Checklist',
      'math-plot': 'Đồ Thị Hàm Số',
      'chemical-molecule': 'Phân Tử Hoá Học',
      'latex-formula': 'Công Thức LaTeX',
    }
    return map[type] || type.replace(/-/g, ' ').toUpperCase()
  }

  return (
    <div className={styles.backdrop} onClick={(e) => { if (e.target === e.currentTarget && !isLoading) onClose(); }}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <div className={styles.sparkleIcon}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0L9.4 5.6L15 7L9.4 8.4L8 14L6.6 8.4L1 7L6.6 5.6L8 0Z" />
              </svg>
            </div>
            <span className={styles.title}>AI Magic Fill</span>
            <span className={styles.badge}>{formatElementLabel(element.type)}</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} disabled={isLoading} title="Đóng">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M2 2L12 12M12 2L2 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Voiceover Context Box if available */}
          {voiceoverText.trim() && (
            <div className={styles.voiceoverCard}>
              <div className={styles.voiceoverHeader}>
                <span className={styles.voiceoverLabel}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 12C10.21 12 12 10.21 12 8V4C12 1.79 10.21 0 8 0C5.79 0 4 1.79 4 4V8C4 10.21 5.79 12 8 12ZM14 8C14 11.31 11.31 14 8 14C4.69 14 2 11.31 2 8H0C0 11.97 3.03 15.22 7 15.87V18H9V15.87C12.97 15.22 16 11.97 16 8H14Z"/>
                  </svg>
                  Lời thoại Scene hiện tại
                </span>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', color: 'var(--text-sub)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={useVoiceover}
                    onChange={(e) => setUseVoiceover(e.target.checked)}
                  />
                  Khớp với lời thoại
                </label>
              </div>
              <p className={styles.voiceoverText}>"{voiceoverText.slice(0, 160)}{voiceoverText.length > 160 ? '...' : ''}"</p>
            </div>
          )}

          {/* Prompt Chips */}
          {chips.length > 0 && (
            <div className={styles.chipsSection}>
              <span className={styles.chipsLabel}>Gợi ý chủ đề nhanh (1-Click):</span>
              <div className={styles.chipsList}>
                {chips.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    className={`${styles.chipBtn} ${selectedChipId === chip.id ? styles.chipActive : ''}`}
                    onClick={() => handleChipClick(chip)}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main Input Textarea */}
          <div className={styles.inputSection}>
            <textarea
              className={styles.textarea}
              placeholder="Nhập yêu cầu số liệu muốn tạo, hoặc Ctrl+V dán bảng số liệu Excel / CSV / danh sách gạch đầu dòng..."
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value)
                if (selectedChipId) setSelectedChipId(null)
              }}
              rows={3}
            />
            <span className={styles.inputHint}>
              * AI sẽ tự phân tích ngữ cảnh để thiết lập đúng cấu trúc, nhãn và màu sắc chuẩn video.
            </span>
          </div>

          {/* Preview Diff Box */}
          {previewPatch && (
            <div className={styles.previewBox}>
              <div className={styles.previewHeader}>
                <span className={styles.previewTitle}>Kết quả xem trước (Preview)</span>
                <span style={{ fontSize: '10.5px', color: 'var(--accent)' }}>Sẵn sàng áp dụng</span>
              </div>
              <p className={styles.previewSummary}>{previewSummary}</p>
              <div className={styles.previewCode}>
                {JSON.stringify(previewPatch, null, 2)}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            Đóng
          </Button>

          {previewPatch ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleGenerate}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className={styles.loadingSpinner} />
                    Đang tạo lại...
                  </>
                ) : (
                  'Sinh Lại Phương Án Khác'
                )}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleApply}
                disabled={isLoading}
              >
                Áp Dụng Vào Cảnh
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleGenerate}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className={styles.loadingSpinner} />
                    Đang phân tích...
                  </>
                ) : (
                  'Xem Trước'
                )}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleQuickApply}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className={styles.loadingSpinner} />
                    Đang xử lý...
                  </>
                ) : (
                  'Tạo & Điền Ngay'
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
