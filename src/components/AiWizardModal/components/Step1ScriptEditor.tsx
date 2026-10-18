import React from 'react'
import { TEMPORAL_ROLE_INFO, TemporalRole } from '@/utils/temporalContrast'
import { SPEECH_RATE_WPS } from '@/config/pacingConfig'
import { Button, Textarea } from '@/components/ui'
import { ScenePreviewPlayer } from './ScenePreviewPlayer'
import { useVideoCreditText } from '../hooks/useVideoCredits'
import layout from './wizardLayout.module.css'
import styles from './Step1ScriptEditor.module.css'

interface Step1Props {
  generatedScenes: any[]
  setGeneratedScenes: (scenes: any[]) => void
  totalEstDurationSec: number
  totalWordsCount: number
  targetDuration: number
  accentColor: string
  setStep: (step: number) => void
  onRegenerateVariation: () => void
  deepseekReasoning?: string
  handleApplyOnlyScript: () => void
}

const wordCount = (t: string) => (t || '').trim().split(/\s+/).filter(Boolean).length
const clock = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`

export function Step1ScriptEditor({
  generatedScenes,
  setGeneratedScenes,
  totalEstDurationSec,
  totalWordsCount,
  targetDuration,
  setStep,
  onRegenerateVariation,
  deepseekReasoning,
  handleApplyOnlyScript,
}: Step1Props) {
  const [showThinking, setShowThinking] = React.useState(false)
  const [selected, setSelected] = React.useState(0)
  const creditText = useVideoCreditText(targetDuration)

  const current = generatedScenes[Math.min(selected, generatedScenes.length - 1)]
  const isLong = totalEstDurationSec > targetDuration * 1.2

  // Mốc thời gian theo thời lượng cảnh (đã khớp vai và lời thoại khi tạo)
  let cursor = 0
  const timeline = generatedScenes.map((scene) => {
    const start = cursor
    cursor += scene.duration || wordCount(scene.voiceoverText) / SPEECH_RATE_WPS.vi
    return { start, end: cursor }
  })

  const updateText = (i: number, text: string) => {
    const updated = [...generatedScenes]
    updated[i] = { ...updated[i], voiceoverText: text }
    setGeneratedScenes(updated)
  }

  const roleOf = (scene: any) => {
    const role: TemporalRole = scene.temporalRole || 'normal'
    return TEMPORAL_ROLE_INFO[role] || TEMPORAL_ROLE_INFO.normal
  }

  return (
    <div className={layout.root}>
      <div className={layout.body}>
        <div className={layout.main}>
          <div className={styles.head}>
            <div>
              <h3 className={layout.heroLabel}>Kịch bản của bạn</h3>
              <p className={layout.heroHint}>
                {generatedScenes.length} cảnh · khoảng {Math.round(totalEstDurationSec)} giây · {totalWordsCount} từ · bấm vào một cảnh để xem trước
              </p>
            </div>
            <div className={layout.footerActions}>
              <Button variant="ghost" size="sm" onClick={() => setStep(0)}>Sửa ý tưởng</Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={onRegenerateVariation}
                title="Giữ nguyên ý tưởng và cài đặt, để AI viết một phương án kịch bản khác"
                leftIcon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 12a9 9 0 0115.5-6.2L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 01-15.5 6.2L3 16" /><path d="M3 21v-5h5" />
                  </svg>
                }
              >
                Viết lại tất cả
              </Button>
            </div>
          </div>

          {isLong && (
            <div className={layout.warnBanner}>
              Lời thoại dài hơn mục tiêu {targetDuration} giây (khoảng {Math.round(totalEstDurationSec)} giây). Rút gọn vài câu để video giữ nhịp.
            </div>
          )}

          {deepseekReasoning && (
            <div className={styles.reasoning}>
              <div className={layout.sectionHead}>
                <span className={styles.reasoningTitle}>Quá trình suy luận của DeepSeek R1</span>
                <Button variant="ghost" size="xs" onClick={() => setShowThinking(!showThinking)}>
                  {showThinking ? 'Thu gọn' : 'Xem chi tiết'}
                </Button>
              </div>
              {showThinking && <pre className={styles.reasoningBody}>{deepseekReasoning}</pre>}
            </div>
          )}

          <ol className={styles.list}>
            {generatedScenes.map((scene, i) => {
              const info = roleOf(scene)
              const words = wordCount(scene.voiceoverText)
              return (
                <li
                  key={scene.id}
                  className={styles.row}
                  data-active={i === selected ? 'true' : 'false'}
                  onClick={() => setSelected(i)}
                >
                  <button type="button" className={styles.rowMeta} onClick={() => setSelected(i)} aria-pressed={i === selected} aria-label={`Xem trước cảnh ${i + 1}`}>
                    <span className={styles.roleTag} style={{ background: info.bgColor, color: info.color }}>{info.badge}</span>
                    <span className={styles.time}>{clock(timeline[i].start)} – {clock(timeline[i].end)}</span>
                  </button>
                  <div className={styles.rowBody}>
                    <Textarea
                      value={scene.voiceoverText || ''}
                      onChange={(e) => updateText(i, e.target.value)}
                      onFocus={() => setSelected(i)}
                      rows={2}
                      placeholder="Nhập lời đọc cho cảnh này"
                      className={styles.line}
                      aria-label={`Lời thoại cảnh ${i + 1}`}
                    />
                    <span className={styles.visual}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="6" y="3" width="12" height="18" rx="2" />
                      </svg>
                      {scene.name || `Cảnh ${i + 1}`} · {words} từ
                    </span>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>

        <aside className={layout.preview} aria-label="Xem trước">
          <div className={layout.previewHead}>
            <span>Cảnh {Math.min(selected, generatedScenes.length - 1) + 1} / {generatedScenes.length}</span>
            <span>9:16 · 1080×1920</span>
          </div>
          <div className={layout.screen}>{current && <ScenePreviewPlayer scene={current} />}</div>
          {current && (
            <dl className={layout.summary}>
              <dt>Vai cảnh</dt><dd>{roleOf(current).label}</dd>
              <dt>Thời lượng</dt><dd>{(current.duration || 0).toFixed(1)} giây</dd>
              <dt>Lời thoại</dt><dd>{wordCount(current.voiceoverText)} từ</dd>
              <dt>Cả video</dt><dd>{Math.round(totalEstDurationSec)} / {targetDuration} giây</dd>
            </dl>
          )}
        </aside>
      </div>

      <div className={layout.footer}>
        <span className={layout.credit}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M13 2L4 14h7l-1 8 9-12h-7z" />
          </svg>
          {creditText}
        </span>
        <div className={layout.footerActions}>
          <Button variant="ghost" size="md" onClick={() => setStep(0)}>Quay lại</Button>
          <Button variant="secondary" size="md" onClick={handleApplyOnlyScript} title="Đưa kịch bản vào timeline để chỉnh hình trước, lồng tiếng sau">
            Vào Studio ngay
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => setStep(2)}
            rightIcon={
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            }
          >
            Chọn giọng đọc
          </Button>
        </div>
      </div>
    </div>
  )
}
