import React, { useState, useEffect } from 'react'
import styles from '../SettingsModal.module.css'
import {
  useSettingsStore,
  DEFAULT_AI_BANNED_WORDS,
  TIKTOK_SAFETY_PRESET,
  AI_CLICHE_PRESET
} from '@/store/useSettingsStore'
import { useEditorStore } from '@/store/useEditorStore'
import { Button, SegmentedControl, InfoTooltip } from '@/components/ui'
import { API_BASE } from '@/config/api'
import { GEMINI_SCRIPT_MODELS, normalizeScriptModel } from '@/config/aiModels'

export const AiConfigTab: React.FC = () => {
  const {
    geminiApiKey,
    setGeminiApiKey,
    deepseekApiKey,
    setDeepSeekApiKey,
    aiEngineMode,
    setAiEngineMode,
    preferredScriptModel,
    setPreferredScriptModel,
    aiBannedWords,
    setAiBannedWords,
    aiHumanizerEnabled,
    setAiHumanizerEnabled,
  } = useSettingsStore()

  const { showToast } = useEditorStore()

  const [localApiKey, setLocalApiKey] = useState(geminiApiKey)
  const [showApiKey, setShowApiKey] = useState(false)
  const [localDeepSeekKey, setLocalDeepSeekKey] = useState(deepseekApiKey || '')
  const [showDeepSeekKey, setShowDeepSeekKey] = useState(false)
  const [newWordInput, setNewWordInput] = useState('')

  const [geminiTestState, setGeminiTestState] = useState<{ loading: boolean; ok?: boolean; message?: string }>({ loading: false })
  const [deepseekTestState, setDeepseekTestState] = useState<{ loading: boolean; ok?: boolean; message?: string }>({ loading: false })

  useEffect(() => {
    setLocalApiKey(geminiApiKey)
  }, [geminiApiKey])

  useEffect(() => {
    setLocalDeepSeekKey(deepseekApiKey || '')
  }, [deepseekApiKey])

  // Tự động đồng bộ API Key khi chuyển tab hoặc đóng modal
  useEffect(() => {
    return () => {
      const cleanGemini = localApiKey.replace(/[\s\uFEFF\xA0]/g, '').trim()
      const cleanDeepSeek = localDeepSeekKey.replace(/[\s\uFEFF\xA0]/g, '').trim()
      setGeminiApiKey(cleanGemini)
      setDeepSeekApiKey(cleanDeepSeek)
    }
  }, [localApiKey, localDeepSeekKey, setGeminiApiKey, setDeepSeekApiKey])

  const handleTestGemini = async () => {
    const key = localApiKey.replace(/[\s\uFEFF\xA0]/g, '').trim()
    if (!key) {
      setGeminiTestState({ loading: false, ok: false, message: 'Chưa nhập Gemini API Key' })
      return
    }
    setGeminiTestState({ loading: true })
    try {
      const res = await fetch(`${API_BASE}/api/ai/test-gemini`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key })
      })
      const data = await res.json()
      setGeminiTestState({ loading: false, ok: data.ok, message: data.message })
      if (data.ok) {
        setGeminiApiKey(key)
        showToast('Kết nối thành công & đã tự động lưu Gemini API Key!')
      }
    } catch (err: any) {
      setGeminiTestState({ loading: false, ok: false, message: 'Lỗi mạng hoặc server chưa khởi động' })
    }
  }

  const handleTestDeepSeek = async () => {
    const key = localDeepSeekKey.replace(/[\s\uFEFF\xA0]/g, '').trim()
    if (!key) {
      setDeepseekTestState({ loading: false, ok: false, message: 'Chưa nhập DeepSeek API Key' })
      return
    }
    setDeepseekTestState({ loading: true })
    try {
      const res = await fetch(`${API_BASE}/api/ai/test-deepseek`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key })
      })
      const data = await res.json()
      setDeepseekTestState({ loading: false, ok: data.ok, message: data.message })
      if (data.ok) {
        setDeepSeekApiKey(key)
        showToast('Kết nối thành công & đã tự động lưu DeepSeek API Key!')
      }
    } catch (err: any) {
      setDeepseekTestState({ loading: false, ok: false, message: 'Lỗi mạng hoặc server chưa khởi động' })
    }
  }

  const handleAddWord = () => {
    const trimmed = newWordInput.trim().toLowerCase()
    if (!trimmed) return
    const currentList = aiBannedWords || []
    if (currentList.includes(trimmed)) {
      showToast('Từ khóa này đã có trong danh sách từ cấm')
      return
    }
    setAiBannedWords([...currentList, trimmed])
    setNewWordInput('')
    showToast(`Đã thêm từ cấm: "${trimmed}"`)
  }

  const handleRemoveWord = (wordToRemove: string) => {
    const currentList = aiBannedWords || []
    setAiBannedWords(currentList.filter(w => w !== wordToRemove))
  }

  const handleApplyPreset = (presetWords: string[], presetName: string) => {
    const currentList = aiBannedWords || []
    const merged = Array.from(new Set([...currentList, ...presetWords]))
    setAiBannedWords(merged)
    showToast(`Đã áp dụng bộ lọc: ${presetName}`)
  }

  const handleResetBannedWords = () => {
    setAiBannedWords(DEFAULT_AI_BANNED_WORDS)
    showToast('Đã khôi phục danh sách từ cấm mặc định')
  }

  return (
    <>
      {/* Chế độ động cơ AI */}
      <div className={styles.formGroup}>
        <label className={styles.label}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Chế Độ Động Cơ AI (Engine Mode)</span>
            <InfoTooltip content="Tùy chọn mô hình: Smart Hybrid (kết hợp DeepSeek kịch bản + Gemini bố cục), Thuần DeepSeek hoặc Thuần Gemini." />
          </span>
          <span style={{ fontSize: 10, color: '#BEFF01', fontWeight: 600 }}>Khuyên dùng</span>
        </label>
        <SegmentedControl
          options={[
            { value: 'hybrid', label: 'Smart Hybrid (Gemini + DeepSeek)' },
            { value: 'deepseek', label: 'Thuần DeepSeek (Không cần Gemini)' },
            { value: 'gemini', label: 'Thuần Gemini' }
          ]}
          value={aiEngineMode || 'hybrid'}
          onChange={(val) => setAiEngineMode(val as any)}
          size="sm"
          fullWidth
        />
        <span className={styles.hint}>
          {aiEngineMode === 'deepseek'
            ? 'Thuần DeepSeek: 100% quy trình từ kịch bản đến bố cục Motion Graphics do DeepSeek V4.1 Flash đảm nhiệm.'
            : aiEngineMode === 'hybrid'
            ? 'Smart Hybrid: DeepSeek đảm nhiệm Kịch bản & Hook viral; Google Gemini đảm nhiệm Bố cục Visual Remotion & Audio.'
            : 'Thuần Gemini: 100% video do Google Gemini đảm nhiệm từ Kịch bản đến Bố cục đồ họa.'}
        </span>
      </div>

      {/* Mô hình viết kịch bản ưu tiên */}
      <div className={styles.formGroup}>
        <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>Mô Hình Ưu Tiên Cho Kịch Bản & Hook</span>
          <InfoTooltip content="Lựa chọn model chuyên trách sáng tạo kịch bản, lời thoại phân cảnh và hook mở đầu 3 giây." />
        </label>
        <select
          className={styles.select}
          value={normalizeScriptModel(preferredScriptModel || 'deepseek-flash')}
          onChange={e => setPreferredScriptModel(e.target.value as any)}
        >
          <option value="deepseek-flash">DeepSeek V4.1 Flash (Khuyên dùng: Siêu nhanh, Native Vision)</option>
          <option value="deepseek-reasoner">DeepSeek-R1 (Tư duy suy luận sâu, kịch tính & triết lý)</option>
          <option value="deepseek-chat">DeepSeek-V3 (Cực nhanh, mượt mà, câu từ cuốn hút)</option>
          {GEMINI_SCRIPT_MODELS.map((m) => (
            <option key={m.id} value={m.id}>{`Google ${m.label}`}</option>
          ))}
        </select>
      </div>

      {/* DeepSeek API Key */}
      <div className={styles.formGroup} style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <label className={styles.label} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>DeepSeek API Key</span>
            <InfoTooltip content="Dùng cho DeepSeek-V3 & DeepSeek-R1 để tạo kịch bản chiều sâu và Hook 3s giật tít." />
          </label>
          <a
            href="https://platform.deepseek.com/api_keys"
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 11, color: '#00D4FF', textDecoration: 'none' }}
          >
            Lấy Key tại DeepSeek Platform ↗
          </a>
        </div>

        <div style={{ display: 'flex', gap: 8, position: 'relative', alignItems: 'center' }}>
          <input
            type={showDeepSeekKey ? 'text' : 'password'}
            value={localDeepSeekKey}
            onChange={e => {
              setLocalDeepSeekKey(e.target.value)
              setDeepseekTestState({ loading: false })
            }}
            onBlur={() => {
              const clean = localDeepSeekKey.replace(/[\s\uFEFF\xA0]/g, '').trim()
              setDeepSeekApiKey(clean)
            }}
            placeholder="Nhập DeepSeek API Key (sk-...)"
            className={styles.input}
            style={{ fontFamily: 'monospace', fontSize: 12, paddingRight: 40 }}
          />
          <div style={{ position: 'absolute', right: 4 }}>
            <Button
              asIcon
              variant="ghost"
              size="icon-xs"
              onClick={() => setShowDeepSeekKey(!showDeepSeekKey)}
              title={showDeepSeekKey ? 'Ẩn Key' : 'Hiện Key'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </Button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: 6 }}>
          <Button
            variant="secondary"
            size="xs"
            disabled={deepseekTestState.loading || !localDeepSeekKey.trim()}
            onClick={handleTestDeepSeek}
            leftIcon={
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            }
          >
            {deepseekTestState.loading ? 'Đang test...' : 'Kiểm tra'}
          </Button>
        </div>

        {deepseekTestState.message && (
          <div style={{
            marginTop: 6,
            padding: '6px 10px',
            borderRadius: 6,
            fontSize: 11,
            background: deepseekTestState.ok ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 68, 68, 0.1)',
            border: `1px solid ${deepseekTestState.ok ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 68, 68, 0.3)'}`,
            color: deepseekTestState.ok ? '#00FF88' : '#FF6666',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            {deepseekTestState.ok ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            )}
            <span>{deepseekTestState.message}</span>
          </div>
        )}
      </div>

      {/* Google Gemini API Key */}
      <div className={styles.formGroup} style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <label className={styles.label} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Google Gemini API Key</span>
            <InfoTooltip content="Bắt buộc cho Remotion Visual Compiler, bố cục 3D và Voice Studio." />
          </label>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 11, color: '#BEFF01', textDecoration: 'none' }}
          >
            Lấy Key miễn phí ↗
          </a>
        </div>

        <div style={{ display: 'flex', gap: 8, position: 'relative', alignItems: 'center' }}>
          <input
            type={showApiKey ? 'text' : 'password'}
            value={localApiKey}
            onChange={e => {
              setLocalApiKey(e.target.value)
              setGeminiTestState({ loading: false })
            }}
            onBlur={() => {
              const clean = localApiKey.replace(/[\s\uFEFF\xA0]/g, '').trim()
              setGeminiApiKey(clean)
            }}
            placeholder="Nhập Gemini API Key (AIzaSy...)"
            className={styles.input}
            style={{ fontFamily: 'monospace', fontSize: 12, paddingRight: 40 }}
          />
          <div style={{ position: 'absolute', right: 4 }}>
            <Button
              asIcon
              variant="ghost"
              size="icon-xs"
              onClick={() => setShowApiKey(!showApiKey)}
              title={showApiKey ? 'Ẩn Key' : 'Hiện Key'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </Button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: 6 }}>
          <Button
            variant="secondary"
            size="xs"
            disabled={geminiTestState.loading || !localApiKey.trim()}
            onClick={handleTestGemini}
            leftIcon={
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            }
          >
            {geminiTestState.loading ? 'Đang test...' : 'Kiểm tra'}
          </Button>
        </div>

        {geminiTestState.message && (
          <div style={{
            marginTop: 6,
            padding: '6px 10px',
            borderRadius: 6,
            fontSize: 11,
            background: geminiTestState.ok ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 68, 68, 0.1)',
            border: `1px solid ${geminiTestState.ok ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 68, 68, 0.3)'}`,
            color: geminiTestState.ok ? '#00FF88' : '#FF6666',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            {geminiTestState.ok ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            )}
            <span>{geminiTestState.message}</span>
          </div>
        )}
      </div>

      {/* Bộ Lọc Từ Cấm & Văn Phong Tự Nhiên (AI Blacklist & Humanizer) */}
      <div className={styles.formGroup} style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <label className={styles.label} style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Bộ Lọc Từ Cấm & Văn Phong Tự Nhiên</span>
            <InfoTooltip content="Tự động loại bỏ các từ sáo rỗng 'mùi bot' (kỷ nguyên, bật mí...) và các từ khóa nhạy cảm bị thuật toán TikTok/Reels kiểm duyệt hoặc bóp reach (chết người, lừa đảo...)." />
            <span style={{ fontSize: 10, color: '#BEFF01', fontWeight: 600 }}>({(aiBannedWords || []).length})</span>
          </label>
          <button
            type="button"
            onClick={() => setAiHumanizerEnabled(!aiHumanizerEnabled)}
            style={{
              background: aiHumanizerEnabled ? 'rgba(190, 255, 1, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${aiHumanizerEnabled ? 'var(--accent)' : 'var(--border)'}`,
              color: aiHumanizerEnabled ? 'var(--accent)' : 'var(--text-muted)',
              borderRadius: 20,
              padding: '3px 10px',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: aiHumanizerEnabled ? 'var(--accent)' : 'var(--text-muted)'
            }} />
            <span>{aiHumanizerEnabled ? 'Bật Humanizer' : 'Tắt Humanizer'}</span>
          </button>
        </div>

        {/* Preset Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          <Button
            variant="secondary"
            size="xs"
            onClick={() => handleApplyPreset(TIKTOK_SAFETY_PRESET, 'Tránh bóp reach TikTok')}
            leftIcon={
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            }
          >
            Lọc từ cấm TikTok
          </Button>
          <Button
            variant="secondary"
            size="xs"
            onClick={() => handleApplyPreset(AI_CLICHE_PRESET, 'Chống sáo rỗng AI')}
            leftIcon={
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            }
          >
            Lọc sáo rỗng AI
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={handleResetBannedWords}
          >
            Mặc định
          </Button>
        </div>

        {/* Banned Words Tag List */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          padding: '8px 10px',
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          minHeight: 42,
          maxHeight: 140,
          overflowY: 'auto'
        }}>
          {(aiBannedWords || []).map(word => (
            <span
              key={word}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '2px 8px',
                background: 'rgba(255, 68, 68, 0.12)',
                border: '1px solid rgba(255, 68, 68, 0.3)',
                borderRadius: 12,
                color: '#FF7777',
                fontSize: 11,
                fontWeight: 500
              }}
            >
              <span>{word}</span>
              <button
                type="button"
                onClick={() => handleRemoveWord(word)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#FF7777',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  lineHeight: 1
                }}
                title="Xóa từ cấm này"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </span>
          ))}
          {(!aiBannedWords || aiBannedWords.length === 0) && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px 0' }}>
              Chưa có từ cấm nào được thiết lập.
            </span>
          )}
        </div>

        {/* Add Word Input */}
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <input
            type="text"
            className={styles.input}
            placeholder="Nhập từ cấm mới (ví dụ: kinh hoàng, chết người)..."
            value={newWordInput}
            onChange={e => setNewWordInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddWord()
              }
            }}
            style={{ flex: 1 }}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAddWord}
            disabled={!newWordInput.trim()}
            leftIcon={
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            }
          >
            Thêm
          </Button>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 12, marginTop: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#FFF', marginBottom: 4 }}>Lưu ý an toàn:</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.45 }}>
          Toàn bộ API Key được mã hóa và lưu trữ cục bộ trên trình duyệt của bạn (Local Storage). Hệ thống hỗ trợ Auto-Fallback tự động chuyển tiếp nếu một trong hai bên gặp sự cố nghẽn mạng.
        </div>
      </div>
    </>
  )
}
