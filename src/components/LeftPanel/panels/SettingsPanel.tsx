import React, { useState } from 'react'
import { useSettingsStore } from '@/store/useSettingsStore'
import styles from './Panels.module.css'
import { Button, Input, Select } from '@/components/ui'

export default function SettingsPanel() {
  const { 
    geminiApiKey, setGeminiApiKey,
    deepseekApiKey, setDeepSeekApiKey,
    defaultFont, setDefaultFont,
    brandColor, setBrandColor
  } = useSettingsStore()

  const [localKey, setLocalKey] = useState(geminiApiKey)
  const [showKey, setShowKey] = useState(false)
  const [localDeepSeekKey, setLocalDeepSeekKey] = useState(deepseekApiKey || '')
  const [showDeepSeekKey, setShowDeepSeekKey] = useState(false)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)

  React.useEffect(() => {
    setLocalKey(geminiApiKey)
  }, [geminiApiKey])

  React.useEffect(() => {
    setLocalDeepSeekKey(deepseekApiKey || '')
  }, [deepseekApiKey])

  const handleSaveKey = () => {
    const cleanGemini = localKey.replace(/[\s\uFEFF\xA0]/g, '').trim()
    const cleanDeepSeek = localDeepSeekKey.replace(/[\s\uFEFF\xA0]/g, '').trim()
    setGeminiApiKey(cleanGemini)
    setDeepSeekApiKey(cleanDeepSeek)
    setSaveStatus('Đã lưu cấu hình AI')
    setTimeout(() => setSaveStatus(null), 2000)
  }

  const FONT_OPTIONS = [
    { value: 'Be Vietnam Pro', label: 'Be Vietnam Pro (Chuẩn TV)' },
    { value: 'Montserrat', label: 'Montserrat (Geometric)' },
    { value: 'Inter', label: 'Inter (Sans-serif)' },
    { value: 'Poppins', label: 'Poppins (Geometric)' },
    { value: 'Roboto', label: 'Roboto (Grotesque)' },
  ]

  return (
    <div className={styles.section}>
      {/* AI Configuration */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
        <div className={styles.sectionHdr}>
          <span>AI CONFIGURATION</span>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
          Cấu hình API Key của Google Gemini và DeepSeek để sử dụng kịch bản viral và thiết kế Layout tự động.
        </p>

        {/* Gemini Key */}
        <div>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-sub)', marginBottom: 4, fontWeight: 600 }}>
            Google Gemini API Key
          </label>
          <Input
            type={showKey ? 'text' : 'password'}
            value={localKey}
            onChange={(e) => setLocalKey(e.target.value)}
            placeholder="Nhập Gemini API Key (AIzaSy... / AQ...)"
            inputSize="sm"
            fullWidth
            style={{ fontFamily: 'monospace' }}
            rightElement={
              <Button
                asIcon
                variant="ghost"
                size="icon-xs"
                onClick={() => setShowKey(!showKey)}
                title={showKey ? 'Ẩn' : 'Hiện'}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </Button>
            }
          />
        </div>

        {/* DeepSeek Key */}
        <div>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-sub)', marginBottom: 4, fontWeight: 600 }}>
            DeepSeek API Key (Kịch bản & Hook 3s)
          </label>
          <Input
            type={showDeepSeekKey ? 'text' : 'password'}
            value={localDeepSeekKey}
            onChange={(e) => setLocalDeepSeekKey(e.target.value)}
            placeholder="Nhập DeepSeek API Key (sk-...)"
            inputSize="sm"
            fullWidth
            style={{ fontFamily: 'monospace' }}
            rightElement={
              <Button
                asIcon
                variant="ghost"
                size="icon-xs"
                onClick={() => setShowDeepSeekKey(!showDeepSeekKey)}
                title={showDeepSeekKey ? 'Ẩn' : 'Hiện'}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </Button>
            }
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--accent)' }}>{saveStatus}</span>
          <Button 
            variant="primary"
            size="xs"
            onClick={handleSaveKey}
          >
            Lưu Toàn Bộ Key
          </Button>
        </div>
      </div>

      <div style={{ width: '100%', height: 1, backgroundColor: 'var(--border)', margin: '8px 0' }} />

      {/* Brand Kit */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className={styles.sectionHdr}>
          <span>BRAND KIT</span>
          <span className={styles.tag}>Sắp ra mắt</span>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
          Cấu hình Font và Bảng màu thương hiệu mặc định cho mọi video mới.
        </p>

        <div>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-sub)', marginBottom: 4, fontWeight: 600 }}>Màu thương hiệu (Accent Color)</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input 
              type="color" 
              value={brandColor}
              onChange={e => setBrandColor(e.target.value)}
              style={{ width: 30, height: 30, padding: 0, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: 'none' }}
            />
            <div style={{ flex: 1 }}>
              <Input 
                inputSize="sm"
                fullWidth
                value={brandColor}
                onChange={e => setBrandColor(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-sub)', marginBottom: 4, fontWeight: 600 }}>Font chữ mặc định</label>
          <Select 
            native
            size="sm"
            fullWidth
            value={defaultFont}
            onChange={val => setDefaultFont(val)}
            options={FONT_OPTIONS}
          />
        </div>
      </div>
    </div>
  )
}
