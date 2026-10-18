import React, { useState } from 'react'
import {
  DURATION_PRESETS,
  VIDEO_STYLES,
  COLOR_THEMES,
  WIZARD_TEMPLATE_PRESETS,
  MASTER_FRAMEWORK_ID,
  DEFAULT_WIZARD_PRESET_ID,
  resolveWizardPreset,
  presetSceneCount,
  presetDurationBlock,
  type WizardTemplatePreset,
  type ColorTheme,
} from '../config/wizardCatalog'
import { MASTER_MIN_TARGET_SEC } from '@/config/videoPlan'
import { Button, SegmentedControl, Select, Textarea, Tooltip } from '@/components/ui'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useVideoCreditText } from '../hooks/useVideoCredits'
import { GEMINI_SCRIPT_MODELS, normalizeScriptModel, isGeminiModel, geminiModelLabel } from '@/config/aiModels'
import layout from './wizardLayout.module.css'
import styles from './Step0IdeaSettings.module.css'

interface Step0Props {
  geminiApiKey: string
  deepseekApiKey?: string
  scriptModel?: string
  setScriptModel?: (val: any) => void
  idea: string
  setIdea: (val: string) => void
  ideaWordsCount: number
  sourceMaterial: string
  setSourceMaterial: (val: string) => void
  sourceWordsCount: number
  showSourceInput: boolean
  setShowSourceInput: (val: boolean) => void
  targetDuration: number
  setTargetDuration: (val: number) => void
  /** Độ dài dài nhất gói hiện tại xuất được — lựa chọn dài hơn bị khoá */
  maxVideoSec: number
  viralFramework: string
  setViralFramework: (val: string) => void
  selectedTemplateId?: string
  setSelectedTemplateId?: (val: string) => void
  style: string
  setStyle: (val: string) => void
  isSuggestingStyle: boolean
  handleSuggestStyle: () => void
  color: string
  setColor: (val: string) => void
  accentColor: string
  generating: boolean
  genStatus: string
  genProgress: number
  handleGenerate: () => void
  handleCancelGeneration?: () => void
  hasDraft?: boolean
  generatedScenesCount?: number
  onContinueDraft?: () => void
  /** Dự án trống 1 cảnh, không qua AI */
  onCreateBlank?: () => void
  onClose: () => void
}

const IDEA_MAX = 2000
const SOURCE_MAX = 8000

/** Màu xem trước của một bảng màu video (dữ liệu bảng màu, không phải màu giao diện Studio) */
function paletteColors(theme?: ColorTheme) {
  const isLight = theme?.spaceMode === 'daylight-warm' || theme?.category === 'light' || theme?.category === 'pastel'
  return {
    bg: theme?.bg || '#0D0D0D',
    accent: theme?.accent || '#BEFF01',
    text: theme?.tokens?.text || (isLight ? '#12332A' : '#FFFFFF'),
    surface: theme?.tokens?.surface || theme?.preview?.[1] || '#333333',
    onAccent: theme?.tokens?.onAccent || '#0A0A0B',
    isLight,
  }
}

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12l5 5L20 7" />
  </svg>
)

/** Ảnh thu nhỏ của khung mẫu, vẽ bằng bảng màu mặc định của khung */
function PresetThumb({ preset }: { preset: WizardTemplatePreset }) {
  const c = paletteColors(COLOR_THEMES.find((t) => t.id === preset.colorId))
  const phone: React.CSSProperties = { background: c.bg }
  if (preset.frameworkId === MASTER_FRAMEWORK_ID) {
    return (
      <span className={styles.thumb} aria-hidden="true">
        <span className={styles.thumbPhone} style={phone}>
          <span className={styles.thumbNumber} style={{ color: c.accent }}>3</span>
          <span className={styles.thumbLine} style={{ width: 34, background: c.text }} />
          <span className={styles.thumbLine} style={{ width: 28, background: c.surface }} />
          <span className={styles.thumbLine} style={{ width: 30, background: c.surface }} />
          <span className={styles.thumbLine} style={{ width: 40, marginTop: 'auto', background: c.accent }} />
        </span>
      </span>
    )
  }
  if (preset.frameworkId === 'edu-concept') {
    return (
      <span className={styles.thumb} aria-hidden="true">
        <span className={styles.thumbPhone} style={phone}>
          <span className={styles.thumbFormula} style={{ color: c.text }}>a²+b²</span>
          <svg width="40" height="30" viewBox="0 0 40 30" fill="none">
            <path d="M2 28H38M2 28V2" stroke={c.text} strokeWidth="1.2" opacity="0.6" />
            <path d="M4 26C14 24 20 16 36 4" stroke={c.accent} strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className={styles.thumbLine} style={{ width: 32, background: c.surface }} />
        </span>
      </span>
    )
  }
  return (
    <span className={styles.thumb} aria-hidden="true">
      <span className={styles.thumbPhone} style={{ ...phone, padding: 0, position: 'relative', overflow: 'hidden' }}>
        <span className={styles.thumbBlob} style={{ background: c.accent }} />
        <span className={styles.thumbTile} style={{ background: c.surface }} />
        <span className={styles.thumbLine} style={{ position: 'absolute', left: 8, bottom: 20, width: 24, background: c.accent }} />
        <span className={styles.thumbLine} style={{ position: 'absolute', left: 8, bottom: 12, width: 34, background: c.text }} />
      </span>
    </span>
  )
}

export function Step0IdeaSettings({
  geminiApiKey,
  deepseekApiKey,
  scriptModel = '',
  setScriptModel = () => {},
  idea,
  setIdea,
  ideaWordsCount,
  sourceMaterial,
  setSourceMaterial,
  sourceWordsCount,
  showSourceInput,
  setShowSourceInput,
  targetDuration,
  setTargetDuration,
  maxVideoSec,
  setViralFramework,
  selectedTemplateId = DEFAULT_WIZARD_PRESET_ID,
  setSelectedTemplateId = () => {},
  style,
  setStyle,
  isSuggestingStyle,
  handleSuggestStyle,
  color,
  setColor,
  accentColor,
  generating,
  genStatus,
  genProgress,
  handleGenerate,
  handleCancelGeneration,
  hasDraft,
  generatedScenesCount = 0,
  onContinueDraft,
  onCreateBlank,
  onClose,
}: Step0Props) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const currentPreset = resolveWizardPreset(selectedTemplateId)
  const currentTheme = COLOR_THEMES.find((ct) => ct.id === color)
  const currentStyle = VIDEO_STYLES.find((s) => s.id === style)
  const sceneCount = presetSceneCount(currentPreset, targetDuration)
  const preview = paletteColors(currentTheme)

  const { preferredScriptModel } = useSettingsStore()
  const rawGemini = (geminiApiKey || '').trim()
  const rawDs = (deepseekApiKey || '').trim()
  const hasGemini = rawGemini.length > 0 && !rawGemini.startsWith('sk-')
  const hasDeepSeek = rawDs.length > 0 || rawGemini.startsWith('sk-')
  const effectiveScriptModel = normalizeScriptModel(scriptModel || preferredScriptModel || 'deepseek-flash')
  const missingKeyForSelected = isGeminiModel(effectiveScriptModel) && !hasGemini
    ? 'Gemini'
    : effectiveScriptModel.startsWith('deepseek') && !hasDeepSeek ? 'DeepSeek' : null
  const modelLabel = effectiveScriptModel === 'deepseek-reasoner'
    ? 'DeepSeek R1'
    : isGeminiModel(effectiveScriptModel) ? geminiModelLabel(effectiveScriptModel, { short: true }) : 'DeepSeek Flash'

  const creditText = useVideoCreditText(targetDuration)

  const pickPreset = (p: WizardTemplatePreset) => {
    setSelectedTemplateId(p.id)
    setViralFramework(p.frameworkId)
    if (p.styleId) setStyle(p.styleId)
    if (p.colorId) setColor(p.colorId)
    // Chuỗi Master cần ≥ 30 giây (Tổng kết phải có ≥ 2 mục)
    if (p.frameworkId === MASTER_FRAMEWORK_ID && targetDuration < MASTER_MIN_TARGET_SEC) setTargetDuration(MASTER_MIN_TARGET_SEC)
  }

  const modelOptions = [
    { value: 'deepseek-flash', label: hasDeepSeek ? 'DeepSeek Flash' : 'DeepSeek (thiếu key)' },
    ...GEMINI_SCRIPT_MODELS.map((m) => ({ value: m.id, label: hasGemini ? m.shortLabel : `${m.shortLabel} (thiếu key)` })),
    { value: 'deepseek-reasoner', label: hasDeepSeek ? 'DeepSeek R1' : 'R1 (thiếu key)', title: 'Suy luận sâu, tạo kịch bản lâu hơn (khoảng 45–60 giây)' },
  ]

  const ideaText = idea.trim()
  const canGenerate = Boolean(ideaText) && !presetDurationBlock(currentPreset, targetDuration)

  return (
    <div className={layout.root}>
      <div className={layout.body}>
        {/* ── Cột trái: ý tưởng, thời lượng, phong cách ── */}
        <div className={layout.main}>
          {!geminiApiKey && !deepseekApiKey && (
            <div className={layout.warnBanner}>Chưa có API key. Thêm key Gemini hoặc DeepSeek trong Cài đặt trước khi tạo video.</div>
          )}

          {hasDraft && onContinueDraft && (
            <div className={styles.draftBanner}>
              <span>Đang có bản nháp <strong>{generatedScenesCount} cảnh</strong> chưa hoàn tất.</span>
              <Button variant="primary" size="xs" onClick={onContinueDraft}>Tiếp tục biên tập</Button>
            </div>
          )}

          <section>
            <label htmlFor="wizard-idea" className={layout.heroLabel}>Bạn muốn làm video về điều gì?</label>
            <p className={layout.heroHint}>Viết một câu là đủ. Thêm tài liệu nếu muốn AI bám sát nội dung của bạn.</p>
            <div className={styles.ideaBox} data-filled={ideaText ? 'true' : 'false'}>
              <Textarea
                id="wizard-idea"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Ví dụ: Phân biệt thì hiện tại đơn và hiện tại tiếp diễn, mẹo nhớ qua ví dụ"
                rows={3}
                maxLength={IDEA_MAX}
                className={styles.ideaInput}
              />
              <div className={styles.ideaTools}>
                <button type="button" className={layout.chip} aria-expanded={showSourceInput} onClick={() => setShowSourceInput(!showSourceInput)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 12.5l-8.5 8.5a6 6 0 01-8.5-8.5L12.5 4a4 4 0 015.7 5.7l-8.5 8.5a2 2 0 01-2.8-2.8L15 7.3" />
                  </svg>
                  Tài liệu nguồn
                </button>
                <span className={styles.counter} data-warn={idea.length > IDEA_MAX * 0.9 ? 'true' : 'false'}>
                  {idea.length} / {IDEA_MAX} · ~{ideaWordsCount} từ
                </span>
              </div>
              {showSourceInput && (
                <div className={styles.sourceBox}>
                  <div className={styles.sourceHead}>
                    <span>Tài liệu, số liệu gốc</span>
                    <span className={styles.counter}>{sourceMaterial.length} / {SOURCE_MAX} · ~{sourceWordsCount} từ</span>
                  </div>
                  <Textarea value={sourceMaterial} onChange={(e) => setSourceMaterial(e.target.value)} placeholder="Dán giáo án, bài viết, công thức hoặc số liệu vào đây" rows={4} maxLength={SOURCE_MAX} />
                </div>
              )}
            </div>
            <div className={styles.quickRow}>
              <span className={styles.quickLabel}>Thử nhanh</span>
              {WIZARD_TEMPLATE_PRESETS.map((p) => (
                <button key={p.id} type="button" className={layout.chip} onClick={() => setIdea(p.samplePrompt)}>
                  {p.samplePrompt}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className={layout.sectionTitle}>Thời lượng</h3>
            <div role="radiogroup" aria-label="Thời lượng" className={styles.grid3}>
              {DURATION_PRESETS.map((d) => {
                const isActive = targetDuration === d.id
                const planLocked = d.id > maxVideoSec
                const blockReason = presetDurationBlock(currentPreset, d.id)
                const locked = planLocked || Boolean(blockReason)
                const reason = planLocked ? `Gói hiện tại xuất video tối đa ${maxVideoSec} giây. Nâng cấp gói để dùng độ dài này.` : blockReason || ''
                return (
                  <Tooltip key={d.id} className={styles.cardWrap} content={reason}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      disabled={locked}
                      onClick={() => setTargetDuration(d.id)}
                      className={styles.card}
                      data-active={isActive ? 'true' : 'false'}
                    >
                      <span className={styles.durTop}>
                        <span className={styles.durSec}>{d.label}</span>
                        {planLocked ? (
                          <span className={layout.badge} data-tone="warning">Cần gói cao hơn</span>
                        ) : d.id === 30 ? (
                          <span className={layout.badge} data-tone="accent">Khuyên dùng</span>
                        ) : null}
                      </span>
                      <span className={styles.cardName}>{d.name}</span>
                      <span className={styles.cardDesc}>
                        {blockReason && !planLocked ? 'Cần từ 30 giây với Master' : `${d.desc} · ~${presetSceneCount(currentPreset, d.id)} cảnh`}
                      </span>
                    </button>
                  </Tooltip>
                )
              })}
            </div>
          </section>

          <section>
            <div className={layout.sectionHead}>
              <h3 className={layout.sectionTitle}>Phong cách</h3>
              <span className={layout.sectionNote}>Đổi màu, mô hình ở tuỳ chỉnh nâng cao</span>
            </div>
            <div role="radiogroup" aria-label="Phong cách" className={styles.grid3}>
              {WIZARD_TEMPLATE_PRESETS.map((p) => {
                const isActive = currentPreset.id === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    onClick={() => pickPreset(p)}
                    className={`${styles.card} ${styles.presetCard}`}
                    data-active={isActive ? 'true' : 'false'}
                  >
                    <PresetThumb preset={p} />
                    <span className={styles.presetHead}>
                      <span className={styles.cardName}>{p.name}</span>
                      <span className={layout.badge} data-tone={p.id === DEFAULT_WIZARD_PRESET_ID ? 'accent' : 'muted'}>{p.badge}</span>
                    </span>
                    <span className={styles.cardDesc}>{p.desc}</span>
                  </button>
                )
              })}
            </div>
          </section>

          <section className={styles.advanced}>
            <button type="button" className={styles.advancedToggle} aria-expanded={showAdvanced} onClick={() => setShowAdvanced(!showAdvanced)}>
              <span className={styles.advancedTitle}>
                Tuỳ chỉnh nâng cao
                <span className={layout.sectionNote}>Bảng màu, mô hình AI, giọng văn</span>
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={styles.chevron} data-open={showAdvanced ? 'true' : 'false'}>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {showAdvanced && (
              <div className={styles.advancedBody}>
                <div>
                  <div className={styles.fieldLabel}>Bảng màu</div>
                  <div role="radiogroup" aria-label="Bảng màu" className={styles.paletteGrid}>
                    {COLOR_THEMES.map((ct) => {
                      const isActive = color === ct.id
                      const swatches = [ct.bg, ...(ct.preview || [ct.accent])].slice(0, 4)
                      return (
                        <button
                          key={ct.id}
                          type="button"
                          role="radio"
                          aria-checked={isActive}
                          onClick={() => setColor(ct.id)}
                          className={`${styles.card} ${styles.paletteCard}`}
                          data-active={isActive ? 'true' : 'false'}
                          title={ct.desc}
                        >
                          <span className={styles.swatches} aria-hidden="true">
                            {swatches.map((sw, i) => <span key={i} className={styles.swatch} style={{ background: sw }} />)}
                          </span>
                          <span className={styles.paletteName}>{ct.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <div className={styles.fieldLabel}>Mô hình viết kịch bản</div>
                  <SegmentedControl options={modelOptions} value={effectiveScriptModel} onChange={(val) => setScriptModel(val)} size="sm" />
                  {effectiveScriptModel === 'deepseek-reasoner' && (
                    <p className={styles.fieldHint}>R1 suy luận sâu, tạo kịch bản lâu hơn (khoảng 45–60 giây).</p>
                  )}
                  {missingKeyForSelected && (
                    <p className={styles.fieldWarn}>Chưa có {missingKeyForSelected} API key trong Cài đặt.</p>
                  )}
                </div>

                <div>
                  <div className={layout.sectionHead}>
                    <div className={styles.fieldLabel}>Giọng văn</div>
                    <Button variant="ghost" size="xs" onClick={handleSuggestStyle} disabled={isSuggestingStyle || !ideaText} title="AI đọc ý tưởng và chọn giọng văn phù hợp">
                      {isSuggestingStyle ? 'Đang phân tích…' : 'AI gợi ý'}
                    </Button>
                  </div>
                  <Select
                    options={VIDEO_STYLES.map((s) => ({ value: s.id, label: s.label }))}
                    value={currentStyle ? style : ''}
                    placeholder="Theo khung mẫu"
                    onChange={(val) => {
                      setStyle(val)
                      const picked = VIDEO_STYLES.find((s) => s.id === val)
                      // Master giữ bảng màu riêng của chuỗi cảnh
                      if (picked?.suggestedColorId && currentPreset.frameworkId !== MASTER_FRAMEWORK_ID) setColor(picked.suggestedColorId)
                    }}
                    fullWidth
                  />
                  {currentStyle && <p className={styles.fieldHint}>{currentStyle.desc}</p>}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ── Cột phải: xem trước và tóm tắt ── */}
        <aside className={layout.preview} aria-label="Xem trước">
          <div className={layout.previewHead}>
            <span>Xem trước</span>
            <span>9:16 · 1080×1920</span>
          </div>
          <div className={styles.phone} role="img" aria-label="Xem trước cảnh mở đầu" style={{ background: preview.bg }}>
            <div className={styles.phoneTop}>
              <span className={styles.phoneTag} style={{ background: preview.accent, color: preview.onAccent }}>Hook</span>
              <span className={styles.phoneTime} style={{ color: preview.text }}>0:00</span>
            </div>
            <div className={styles.phoneTitle} data-long={ideaText.length > 60 ? 'true' : 'false'} style={{ color: preview.text, opacity: ideaText ? 1 : 0.45 }}>
              {ideaText ? (ideaText.length > 90 ? `${ideaText.slice(0, 88)}…` : ideaText) : 'Ý tưởng của bạn sẽ hiện ở đây'}
            </div>
            <div className={styles.phoneRule} style={{ background: preview.accent }} />
            <div className={styles.phoneBottom}>
              <div className={styles.phoneSub}>Phụ đề hiện ở đây</div>
              <div className={styles.phoneBars}>
                {Array.from({ length: sceneCount }, (_, i) => (
                  <span key={i} className={styles.phoneBar} style={{ background: i === 0 ? preview.accent : preview.isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)' }} />
                ))}
              </div>
            </div>
          </div>
          <dl className={layout.summary}>
            <dt>Thời lượng</dt><dd>{targetDuration} giây · {sceneCount} cảnh</dd>
            <dt>Phong cách</dt><dd>{currentPreset.name}</dd>
            <dt>Bảng màu</dt><dd>{currentTheme?.label || '—'}</dd>
            <dt>Mô hình</dt><dd>{modelLabel}</dd>
            <dt>Giọng đọc</dt><dd>Chọn ở bước 3</dd>
          </dl>
        </aside>
      </div>

      {/* ── Footer: tiến trình khi đang tạo, nút hành động khi chưa ── */}
      {generating ? (
        <div className={styles.telemetryBox}>
          <div className={styles.telemetryStages}>
            {[
              { label: 'Kịch bản và hook', done: genProgress >= 35, active: genProgress < 35 },
              { label: 'Bố cục 9:16', done: genProgress >= 75, active: genProgress >= 35 && genProgress < 75 },
              { label: 'Khớp nhịp và âm thanh', done: genProgress >= 100, active: genProgress >= 75 },
            ].map((st, i, arr) => (
              <div key={st.label} className={styles.telemetryStage} style={i === arr.length - 1 ? { flex: 'none' } : undefined}>
                <span className={styles.telemetryStageDot} data-state={st.done ? 'done' : st.active ? 'active' : 'idle'}>
                  {st.done ? <CheckIcon /> : i + 1}
                </span>
                <span className={styles.telemetryStageText} data-active={st.active ? 'true' : 'false'}>{st.label}</span>
                {i < arr.length - 1 && <span className={styles.telemetryStageLine} data-done={st.done ? 'true' : 'false'} />}
              </div>
            ))}
          </div>
          <div className={styles.telemetryTrack}>
            <div className={styles.telemetryFill} style={{ width: `${genProgress}%`, background: accentColor }} />
          </div>
          <div className={styles.telemetryFooter}>
            <div className={styles.telemetryLog}>
              <span className={styles.telemetryPulseOrb} style={{ background: accentColor, color: accentColor }} />
              <span>{modelLabel} · {genStatus}</span>
            </div>
            <div className={layout.footerActions}>
              <span className={styles.telemetryPct}>{Math.round(genProgress)}%</span>
              <Button variant="ghost" size="xs" onClick={onClose} title="Thu nhỏ để làm việc trên timeline, tiến trình vẫn chạy">Thu nhỏ</Button>
              {handleCancelGeneration && (
                <Button variant="ghost" size="xs" onClick={handleCancelGeneration} title="Huỷ tiến trình AI">Huỷ</Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className={layout.footer}>
          <span className={layout.credit}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M13 2L4 14h7l-1 8 9-12h-7z" />
            </svg>
            {creditText}
          </span>
          <div className={layout.footerActions}>
            {onCreateBlank && (
              <Button variant="ghost" size="md" onClick={onCreateBlank} title="Tạo dự án trống một cảnh, tự thiết kế từ đầu">Canvas trống</Button>
            )}
            <Button variant="ghost" size="md" onClick={onClose}>Đóng</Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleGenerate}
              disabled={!canGenerate}
              title={!ideaText ? 'Nhập ý tưởng video trước' : undefined}
              rightIcon={
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              }
            >
              Viết kịch bản
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
