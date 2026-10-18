import React, { useState, useEffect, useRef, useMemo } from 'react'
import styles from './MathFormulaModal.module.css'
import { Button } from '@/components/ui'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { validateLatex, renderLatexHtml, normalizeLatex } from '@/utils/stem/latex'

export interface MathFormulaModalProps {
  isOpen: boolean
  onClose: () => void
  initialLatex?: string
  sourceExpression?: string
  title?: string
  onApply: (latex: string) => void
}

const PRESETS = [
  { label: 'E = mc²', latex: 'E = mc^2' },
  { label: 'Định luật II Newton', latex: '\\vec{F} = m\\vec{a}' },
  { label: 'Tích phân Newton-Leibniz', latex: '\\int_{a}^{b} f(x)dx = F(b) - F(a)' },
  { label: 'Nghiệm PT Bậc 2', latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' },
  { label: 'Đẳng thức Euler', latex: 'e^{i\\pi} + 1 = 0' },
  { label: 'Định lý Bayes', latex: 'P(A|B) = \\frac{P(B|A)P(A)}{P(B)}' },
]

export function convertMathExpressionToLatex(expr: string): string {
  if (!expr || !expr.trim()) return ''
  let clean = expr.trim()

  clean = clean.replace(/\bsin\b/g, '\\sin')
  clean = clean.replace(/\bcos\b/g, '\\cos')
  clean = clean.replace(/\btan\b/g, '\\tan')
  clean = clean.replace(/\bcot\b/g, '\\cot')
  clean = clean.replace(/\bexp\((.*?)\)/g, 'e^{$1}')
  clean = clean.replace(/\bsqrt\((.*?)\)/g, '\\sqrt{$1}')
  clean = clean.replace(/\blog\((.*?)\)/g, '\\ln($1)')
  clean = clean.replace(/\bpi\b/g, '\\pi')

  clean = clean.replace(/\^([0-9a-zA-Z]+)/g, '^{$1}')

  clean = clean.replace(/([0-9.]+)\s*\*\s*([a-zA-Z\\]+)/g, '$1$2')
  clean = clean.replace(/\*/g, ' \\cdot ')

  clean = clean.replace(/([0-9a-zA-Z_\\{}]+)\s*\/\s*([0-9a-zA-Z_\\{}]+)/g, '\\frac{$1}{$2}')

  clean = clean.replace(/\s+/g, ' ').trim()

  if (clean.startsWith('y =') || clean.startsWith('f(x)') || clean.includes('=')) {
    return clean
  }
  return `y = ${clean}`
}

export const MathFormulaModal: React.FC<MathFormulaModalProps> = ({
  isOpen,
  onClose,
  initialLatex = '',
  sourceExpression,
  title,
  onApply
}) => {
  const [latex, setLatex] = useState(initialLatex)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isOpen) {
      setLatex(initialLatex)
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
    }
  }, [isOpen, initialLatex])

  const insertSnippet = (snippet: string, cursorOffset?: number) => {
    const textarea = textareaRef.current
    if (!textarea) {
      setLatex(prev => prev + snippet)
      return
    }
    const start = textarea.selectionStart ?? textarea.value.length
    const end = textarea.selectionEnd ?? textarea.value.length
    const text = textarea.value
    const newText = text.substring(0, start) + snippet + text.substring(end)
    setLatex(newText)
    
    requestAnimationFrame(() => {
      textarea.focus()
      const newPos = start + (cursorOffset !== undefined ? cursorOffset : snippet.length)
      textarea.setSelectionRange(newPos, newPos)
    })
  }

  const { html, hasError, error } = useMemo(() => {
    if (!latex.trim()) return { html: null, hasError: false, error: null }
    // Cùng luật với video và cổng kiểm tra AI (utils/stem/latex); khi sai vẫn dựng bản lỗi để chỉ chỗ sai
    const check = validateLatex(latex)
    return {
      html: check.ok
        ? renderLatexHtml(latex)
        : katex.renderToString(normalizeLatex(latex), { throwOnError: false, displayMode: true }),
      hasError: !check.ok,
      error: check.error,
    }
  }, [latex])

  if (!isOpen) return null

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <div className={styles.titleIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
                <path d="M9 10h6"/>
                <path d="M12 7v6"/>
              </svg>
            </div>
            <div className={styles.titleText}>
              Soạn thảo Công thức {title ? ` - ${title}` : ''}
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Toolbars */}
          <div className={styles.toolbarSection}>
            <div className={styles.toolbarRow}>
              <div className={styles.toolbarGroup}>
                <span className={styles.toolbarLabel}>Cấu trúc</span>
                <button className={styles.mathBtn} onClick={() => insertSnippet('\\frac{a}{b}', 6)} title="Phân số">a/b</button>
                <button className={styles.mathBtn} onClick={() => insertSnippet('x^{2}', 3)} title="Số mũ">x²</button>
                <button className={styles.mathBtn} onClick={() => insertSnippet('x_{0}', 3)} title="Chỉ số dưới">x₀</button>
                <button className={styles.mathBtn} onClick={() => insertSnippet('\\sqrt{x}', 6)} title="Căn bậc 2">√x</button>
              </div>
              <div className={styles.toolbarGroup}>
                <span className={styles.toolbarLabel}>Giải tích</span>
                <button className={styles.mathBtn} onClick={() => insertSnippet('\\int_{a}^{b} f(x)dx', 13)} title="Tích phân">∫</button>
                <button className={styles.mathBtn} onClick={() => insertSnippet('\\frac{df}{dx}', 12)} title="Đạo hàm">d/dx</button>
                <button className={styles.mathBtn} onClick={() => insertSnippet('\\sum_{i=1}^{n}', 13)} title="Tổng Sigma">∑</button>
                <button className={styles.mathBtn} onClick={() => insertSnippet('\\lim_{x \\to 0}', 12)} title="Giới hạn">lim</button>
              </div>
            </div>
            <div className={styles.toolbarRow}>
              <div className={styles.toolbarGroup}>
                <span className={styles.toolbarLabel}>Ký hiệu</span>
                <button className={styles.mathBtn} onClick={() => insertSnippet('\\pi ')}>π</button>
                <button className={styles.mathBtn} onClick={() => insertSnippet('\\theta ')}>θ</button>
                <button className={styles.mathBtn} onClick={() => insertSnippet('\\alpha ')}>α</button>
                <button className={styles.mathBtn} onClick={() => insertSnippet('\\Delta ')}>Δ</button>
                <button className={styles.mathBtn} onClick={() => insertSnippet('\\omega ')}>ω</button>
                <button className={styles.mathBtn} onClick={() => insertSnippet('\\infty ')}>∞</button>
                <button className={styles.mathBtn} onClick={() => insertSnippet('\\pm ')}>±</button>
                <button className={styles.mathBtn} onClick={() => insertSnippet('\\to ')}>→</button>
                <button className={styles.mathBtn} onClick={() => insertSnippet('\\vec{v}', 5)}>v⃗</button>
              </div>
            </div>
          </div>

          {/* Editor Pane */}
          <div className={styles.editorPane}>
            <div className={styles.paneHeader}>
              <span className={styles.paneTitle}>Mã LaTeX</span>
              <div className={styles.actions}>
                {sourceExpression && (
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => setLatex(convertMathExpressionToLatex(sourceExpression))}
                    leftIcon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
                  >
                    Tạo từ f(x)
                  </Button>
                )}
                <select 
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '11px', padding: '4px 8px', borderRadius: '4px' }}
                  onChange={(e) => {
                    if (e.target.value) {
                      setLatex(e.target.value)
                      e.target.value = ""
                    }
                  }}
                >
                  <option value="">Thư viện mẫu...</option>
                  {PRESETS.map((p, i) => <option key={i} value={p.latex}>{p.label}</option>)}
                </select>
              </div>
            </div>
            <textarea
              ref={textareaRef}
              className={styles.textarea}
              value={latex}
              onChange={e => setLatex(e.target.value)}
              placeholder="VD: \int_{a}^{b} f(x)dx"
            />
          </div>

          {/* Preview Pane */}
          <div className={styles.editorPane}>
            <div className={styles.paneHeader}>
              <span className={styles.paneTitle}>Xem trước (Live Preview)</span>
            </div>
            <div className={styles.previewBox}>
              {hasError && (
                <div className={styles.errorBadge}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Đang hoàn thiện cú pháp
                </div>
              )}
              {html ? (
                <div dangerouslySetInnerHTML={{ __html: html }} />
              ) : (
                <span className={styles.previewPlaceholder}>Chưa có công thức</span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <Button variant="ghost" onClick={onClose}>Hủy bỏ</Button>
          <Button
            variant="primary"
            disabled={hasError || !latex.trim()}
            title={error || undefined}
            onClick={() => onApply(normalizeLatex(latex))}
          >
            Áp dụng vào video
          </Button>
        </div>
      </div>
    </div>
  )
}
