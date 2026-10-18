import React, { useState, useEffect } from 'react'
import styles from './AiDiagramModal.module.css'
import { useEditorStore } from '@/store/useEditorStore'
import { useSettingsStore } from '@/store/useSettingsStore'
import { Button } from '@/components/ui'
import { API_BASE, apiFetch } from '@/config/api'
import { compileMermaidToRemotionElement } from '@/utils/mermaidParser'

const QUICK_PROMPT_PRESETS = [
  { label: 'Quy trình 4 bước', prompt: 'Quy trình 4 bước bảo mật dữ liệu khi tài khoản bị xâm nhập' },
  { label: 'So sánh A vs B', prompt: 'So sánh ưu nhược điểm giữa Khởi nghiệp và Làm thuê' },
  { label: 'Cây tri thức AI', prompt: 'Cây kỹ năng và lộ trình làm chủ lập trình trí tuệ nhân tạo' },
  { label: 'Lộ trình 3 chặng', prompt: 'Lộ trình 3 chặng từ người mới đến chuyên gia tài chính' },
  { label: 'Phễu chuyển đổi', prompt: 'Mô hình phễu chuyển đổi khách hàng từ Tiếp cận đến Chốt đơn' },
]

const MERMAID_SNIPPETS = [
  {
    label: 'Quy trình tuyến tính',
    code: `graph TD
  A[Thu thập dữ liệu] --> B[Xử lý AI]
  B --> C[Xuất kết quả]`
  },
  {
    label: 'Rẽ nhánh quyết định',
    code: `graph TD
  A[Yêu cầu truy cập] --> B{Xác thực?}
  B -->|Thành công| C[Cấp quyền]
  B -->|Thất bại| D[Chặn IP]`
  },
  {
    label: 'Hệ sinh thái phân nhánh',
    code: `graph TD
  Core[Trung tâm AI] --> Node1[Thị giác máy tính]
  Core --> Node2[Xử lý ngôn ngữ tự nhiên]
  Core --> Node3[Hệ thống gợi ý]`
  },
  {
    label: 'Vòng lặp sửa lỗi (Loop)',
    code: `graph TD
  A[Nhập liệu] --> B{Kiểm tra}
  B -->|Hợp lệ| C[Lưu DB]
  B -->|Sai sót| D[Báo lỗi]
  D --> A`
  },
]

export const AiDiagramModal: React.FC = () => {
  const {
    aiDiagramModalOpen,
    setAiDiagramModalOpen,
    scenes,
    currentSceneIdx,
    brandingSettings,
    addElement,
    showToast,
    setSettingsModalOpen,
  } = useEditorStore()

  const { geminiApiKey, deepseekApiKey } = useSettingsStore()

  const [mode, setMode] = useState<'prompt' | 'mermaid'>('prompt')
  const [prompt, setPrompt] = useState('')
  const [mermaidCode, setMermaidCode] = useState(MERMAID_SNIPPETS[0].code)
  const [diagramType, setDiagramType] = useState('auto')
  const [isGenerating, setIsGenerating] = useState(false)

  const currentScene = scenes[currentSceneIdx]
  const brandColor = brandingSettings?.brandColor || '#BEFF01'

  // Đóng modal khi bấm Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && aiDiagramModalOpen) {
        setAiDiagramModalOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [aiDiagramModalOpen, setAiDiagramModalOpen])

  if (!aiDiagramModalOpen) return null

  const handleGenerate = async () => {
    // 1. Kiểm tra API Key nếu ở chế độ Prompt hoặc cần AI Self-Healing
    const hasKey = Boolean(geminiApiKey?.trim() || deepseekApiKey?.trim())

    // 2. Chế độ Mermaid Client-Side Fast-Path (Không cần gọi API nếu code chuẩn)
    if (mode === 'mermaid' && mermaidCode.trim()) {
      try {
        const localElement = compileMermaidToRemotionElement(mermaidCode, brandColor, prompt || 'SƠ ĐỒ QUY TRÌNH')
        if (localElement && localElement.type) {
          addElement(localElement as any)
          showToast('Đã biên dịch Mermaid sang video animation thành công!', 2500)
          setAiDiagramModalOpen(false)
          return
        }
      } catch (clientErr) {
        console.warn('[Mermaid Client Parser Fallback]: Chuyển sang AI Transpiler...', clientErr)
      }
    }

    // 3. Gọi Backend AI Engine (Prompt-to-Diagram hoặc AI Transpiler)
    if (!hasKey) {
      showToast('Vui lòng cấu hình Gemini hoặc DeepSeek API Key trong Cài đặt để tạo sơ đồ AI!', 4000)
      setSettingsModalOpen(true)
      return
    }

    if (mode === 'prompt' && !prompt.trim()) {
      showToast('Vui lòng nhập ý tưởng sơ đồ bạn muốn tạo!', 2500)
      return
    }

    setIsGenerating(true)
    try {
      const res = await apiFetch(`${API_BASE}/api/ai/generate-diagram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          prompt: prompt.trim(),
          mermaidCode: mermaidCode.trim(),
          diagramType,
          brandColor,
          sceneVoiceover: currentScene?.voiceoverText || '',
          apiKey: geminiApiKey?.trim() || '',
          deepseekApiKey: deepseekApiKey?.trim() || '',
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.error || 'Lỗi khi kết nối với máy chủ AI.')
      }

      const data = await res.json()
      if (data.element && data.element.type) {
        addElement(data.element as any)
        showToast('Đã tạo sơ đồ và chèn vào cảnh thành công!', 2500)
        setAiDiagramModalOpen(false)
      } else {
        throw new Error('Dữ liệu sơ đồ từ AI không hợp lệ.')
      }
    } catch (err: any) {
      console.error('[AiDiagram Error]:', err)
      showToast(err.message || 'Tạo sơ đồ thất bại. Vui lòng thử lại!', 4000)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className={styles.backdrop} onClick={() => setAiDiagramModalOpen(false)}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <div className={styles.titleIcon}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <path d="M10 6.5h4" />
                <path d="M6.5 10v4" />
                <path d="M17.5 10v4" />
                <path d="M10 17.5h4" />
              </svg>
            </div>
            <span className={styles.modalTitle}>AI Diagram & Graph Studio</span>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={() => setAiDiagramModalOpen(false)}
            aria-label="Đóng"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Mode Tabs */}
          <div className={styles.navRow}>
            <button
              type="button"
              className={`${styles.navTab} ${mode === 'prompt' ? styles.navTabActive : ''}`}
              onClick={() => setMode('prompt')}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              Ý tưởng tự nhiên (Prompt)
            </button>
            <button
              type="button"
              className={`${styles.navTab} ${mode === 'mermaid' ? styles.navTabActive : ''}`}
              onClick={() => setMode('mermaid')}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              Mã Mermaid (Diagram-as-Code)
            </button>
          </div>

          {/* Mode 1: Prompt */}
          {mode === 'prompt' && (
            <>
              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  <span>Mô tả sơ đồ bạn muốn vẽ</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Tiếng Việt</span>
                </label>
                <textarea
                  className={styles.textarea}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ví dụ: Quy trình 4 bước cứu dữ liệu khi điện thoại rơi xuống nước, So sánh làm việc từ xa vs văn phòng..."
                  rows={3}
                />
              </div>

              {/* Quick Presets */}
              <div className={styles.inputGroup}>
                <div className={styles.label}>Gợi ý ý tưởng nhanh</div>
                <div className={styles.presetRow}>
                  {QUICK_PROMPT_PRESETS.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      className={styles.presetPill}
                      onClick={() => setPrompt(p.prompt)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Architecture Selector */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>Kiến trúc sơ đồ mong muốn</label>
                <select
                  className={styles.select}
                  value={diagramType}
                  onChange={(e) => setDiagramType(e.target.value)}
                >
                  <option value="auto">✦ Tự động chọn kiến trúc tối ưu (Khuyên dùng)</option>
                  <option value="dynamic-diagram">Đồ thị vector tự do & Rẽ nhánh (Dynamic Diagram)</option>
                  <option value="flowchart">Quy trình khối tuyến tính (Flowchart)</option>
                  <option value="branching-flow">Phân nhánh cây logic (Branching Flow)</option>
                  <option value="knowledge-graph">Đồ thị mạng tri thức đa tầng (Knowledge Graph)</option>
                  <option value="tree-diagram">Cây phả hệ / Lộ trình kỹ năng (Tree Diagram)</option>
                  <option value="vs-battle">So sánh đối đầu 2 luồng (VS Battle Scorecard)</option>
                  <option value="roadmap-flow">Lộ trình từng chặng thời gian (Roadmap)</option>
                  <option value="pyramid-funnel">Sơ đồ phễu chuyển đổi (Pyramid Funnel)</option>
                </select>
              </div>
            </>
          )}

          {/* Mode 2: Mermaid Code */}
          {mode === 'mermaid' && (
            <>
              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  <span>Dán mã Mermaid (`graph TD` hoặc `flowchart`)</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Hỗ trợ cú pháp chuẩn & Self-Healing</span>
                </label>
                <textarea
                  className={styles.codeArea}
                  value={mermaidCode}
                  onChange={(e) => setMermaidCode(e.target.value)}
                  placeholder="graph TD&#10;  A[Bắt đầu] --> B[Xử lý]&#10;  B --> C[Kết quả]"
                  rows={5}
                />
              </div>

              {/* Mermaid Snippets */}
              <div className={styles.inputGroup}>
                <div className={styles.label}>Mã mẫu thông dụng</div>
                <div className={styles.presetRow}>
                  {MERMAID_SNIPPETS.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      className={styles.presetPill}
                      onClick={() => setMermaidCode(s.code)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Color Preview Indicator */}
          <div className={styles.infoBox}>
            <span>Tự động áp dụng màu chủ đạo thương hiệu & chuẩn Safe Zone 9:16</span>
            <div className={styles.brandIndicator}>
              <span className={styles.brandDot} style={{ backgroundColor: brandColor }} />
              <span style={{ color: brandColor }}>{brandColor}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAiDiagramModalOpen(false)}
            disabled={isGenerating}
          >
            Hủy
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={isGenerating}
            onClick={handleGenerate}
            leftIcon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            }
          >
            {isGenerating ? 'Đang tạo sơ đồ...' : 'Tạo sơ đồ & Chèn vào video'}
          </Button>
        </div>
      </div>
    </div>
  )
}
