import React from 'react'
import { useEditorStore } from '@/store/useEditorStore'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useAiWizardStore } from '@/store/useAiWizardStore'
import { Button, SectionHeader } from '@/components/ui'

const QUICK_PRESETS = [
  {
    id: 'facts',
    title: 'Sự thật & Khoa học',
    prompt: 'Top 3 sự thật khoa học kỳ thú làm thay đổi cách bạn nhìn thế giới',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  },
  {
    id: 'history',
    title: 'Lịch sử & Bí ẩn',
    prompt: 'Bí ẩn chưa có lời giải về những nền văn minh cổ đại bí ẩn nhất',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    id: 'business',
    title: 'Kinh doanh & Động lực',
    prompt: '3 bài học đắt giá về tư duy tài chính giúp bạn làm chủ tương lai',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    id: 'mindset',
    title: 'Tâm lý & Kỹ năng sống',
    prompt: 'Hiệu ứng tâm lý kỳ lạ giải thích vì sao bạn hay trì hoãn công việc',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a5 5 0 0 1 5 5v1a3 3 0 0 1 3 3v2a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6v-2a3 3 0 0 1 3-3V7a5 5 0 0 1 5-5z" />
      </svg>
    ),
  },
]

export default function AiStoryPanel() {
  const { geminiApiKey } = useSettingsStore()
  const { setAiWizardOpen, setSettingsModalOpen } = useEditorStore()

  const handleSelectPreset = (prompt: string) => {
    useAiWizardStore.getState().setIdea(prompt)
    useAiWizardStore.getState().setStep(0)
    setAiWizardOpen(true)
  }

  return (
    <div style={{ padding: 'var(--space-4, 16px) var(--space-3, 12px)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3, 12px)', height: '100%', boxSizing: 'border-box' }}>
      {/* ── API Key Warning (Only shown if missing key) ── */}
      {!geminiApiKey && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 10px',
          background: 'rgba(255, 100, 100, 0.08)',
          border: '1px solid rgba(255, 100, 100, 0.2)',
          borderRadius: 6,
          gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span style={{ fontSize: 'var(--font-xs, 10.5px)', color: '#ff6b6b' }}>Chưa có API Key</span>
          </div>
          <button
            type="button"
            onClick={() => setSettingsModalOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text)',
              fontSize: 'var(--font-xs, 10px)',
              textDecoration: 'underline',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Cài đặt
          </button>
        </div>
      )}

      {/* ── Quick Idea Presets ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2, 8px)', flex: 1 }}>
        <SectionHeader
          first
          title="Gợi ý chủ đề"
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {QUICK_PRESETS.map((p) => (
            <div
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={() => handleSelectPreset(p.prompt)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleSelectPreset(p.prompt)
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 10px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--surface-1)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--surface-2)'
                e.currentTarget.style.borderColor = 'var(--border-focus)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--surface-1)'
                e.currentTarget.style.borderColor = 'var(--border)'
              }}
            >
              <span style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 26,
                height: 26,
                borderRadius: 5,
                background: 'var(--surface-2)',
                color: 'var(--accent)',
                flexShrink: 0,
              }}>
                {p.icon}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 'var(--font-sm, 11.5px)', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {p.title}
                </div>
                <div style={{ fontSize: 'var(--font-xs, 10px)', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>
                  {p.prompt}
                </div>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          ))}
        </div>
      </div>

      {/* ── Status Footer (Discreet, zero clutter) ── */}
      {geminiApiKey && (
        <div style={{
          marginTop: 'auto',
          paddingTop: 'var(--space-2, 8px)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 'var(--font-xs, 10px)',
          color: 'var(--text-muted)',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
            Gemini AI Sẵn sàng
          </span>
          <button
            type="button"
            onClick={() => setSettingsModalOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-sub)',
              fontSize: 'var(--font-xs, 10px)',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Cài đặt
          </button>
        </div>
      )}
    </div>
  )
}
