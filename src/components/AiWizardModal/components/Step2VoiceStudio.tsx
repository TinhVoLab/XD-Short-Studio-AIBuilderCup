import React, { useMemo, useState } from 'react'
import { VOICES, type VoiceItem } from '../config/wizardCatalog'
import { Button, SegmentedControl } from '@/components/ui'
import { ScenePreviewPlayer } from './ScenePreviewPlayer'
import { useVideoCreditText } from '../hooks/useVideoCredits'
import layout from './wizardLayout.module.css'
import styles from './Step2VoiceStudio.module.css'

interface Step2Props {
  voice: string
  setVoice: (voiceId: string) => void
  previewingVoice: string | null
  handlePreviewVoice: (voiceId: string, e: React.MouseEvent) => void
  generatedScenes: any[]
  audioGenerating: boolean
  audioProgress: number
  accentColor: string
  setStep: (step: number) => void
  handleGenerateAudioAndApply: () => void
  handleApplyOnlyScript: () => void
  hasGeminiKey: boolean
  speechRate: string
  setSpeechRate: (rate: string) => void
  captionsOn: boolean
  setCaptionsOn: (on: boolean) => void
  targetDuration: number
}

type VoiceFilter = 'all' | VoiceItem['category']

const CATEGORY_TAG: Record<VoiceItem['category'], string> = {
  'edge-vn': 'Miễn phí',
  'edge-en': 'Tiếng Anh',
  gemini: 'Gemini AI',
}

/** Tốc độ đọc Edge-TTS: nhãn hiển thị → tham số rate */
const SPEEDS = [
  { label: '0,9×', rate: '-10%' },
  { label: '1×', rate: '+0%' },
  { label: '1,1×', rate: '+10%' },
  { label: '1,2×', rate: '+20%' },
]

/** Sóng âm trang trí trên thẻ giọng (chiều cao cột, px) */
const WAVE = [8, 14, 20, 12, 18, 22, 10, 16, 20, 9, 15, 19, 11, 17, 8, 13]

export function Step2VoiceStudio({
  voice,
  setVoice,
  previewingVoice,
  handlePreviewVoice,
  generatedScenes,
  audioGenerating,
  audioProgress,
  setStep,
  handleGenerateAudioAndApply,
  handleApplyOnlyScript,
  hasGeminiKey,
  speechRate,
  setSpeechRate,
  captionsOn,
  setCaptionsOn,
  targetDuration,
}: Step2Props) {
  const [filter, setFilter] = useState<VoiceFilter>('all')
  const [noVoice, setNoVoice] = useState(false)
  const creditText = useVideoCreditText(targetDuration)

  const voices = useMemo(() => (filter === 'all' ? VOICES : VOICES.filter((v) => v.category === filter)), [filter])
  const count = (c: VoiceFilter) => (c === 'all' ? VOICES.length : VOICES.filter((v) => v.category === c).length)
  const selectedVoice = VOICES.find((v) => v.id === voice)
  const isGeminiVoice = selectedVoice?.category === 'gemini'
  const speedLocked = noVoice || isGeminiVoice
  const speed = SPEEDS.find((s) => s.rate === speechRate) || SPEEDS[1]

  // Xem trước cảnh đầu đúng như lựa chọn phụ đề
  const previewScene = useMemo(() => {
    const first = generatedScenes[0]
    if (!first || captionsOn) return first
    return { ...first, elements: (first.elements || []).filter((el: any) => el.type !== 'caption') }
  }, [generatedScenes, captionsOn])

  return (
    <div className={layout.root}>
      <div className={layout.body}>
        <div className={layout.main}>
          <div>
            <h3 className={layout.heroLabel}>Giọng đọc và hoàn tất</h3>
            <p className={layout.heroHint}>Nghe thử trước khi chọn. Thời lượng cảnh và phụ đề tự khớp theo giọng đọc.</p>
          </div>

          <section>
            <SegmentedControl
              options={[
                { value: 'all', label: `Tất cả (${count('all')})` },
                { value: 'edge-vn', label: `Tiếng Việt (${count('edge-vn')})` },
                { value: 'gemini', label: `Gemini AI (${count('gemini')})` },
                { value: 'edge-en', label: `Tiếng Anh (${count('edge-en')})` },
              ]}
              value={filter}
              onChange={(v) => setFilter(v as VoiceFilter)}
              size="sm"
            />
            <div role="radiogroup" aria-label="Giọng đọc" className={styles.voiceGrid}>
              {voices.map((v) => {
                const isActive = !noVoice && voice === v.id
                const needsKey = v.category === 'gemini' && !hasGeminiKey
                const isPlaying = previewingVoice === v.id
                return (
                  <div key={v.id} className={styles.voiceCard} data-active={isActive ? 'true' : 'false'}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      className={styles.voicePick}
                      onClick={() => { setNoVoice(false); setVoice(v.id) }}
                      title={needsKey ? 'Cần Gemini API key trong Cài đặt' : undefined}
                    >
                      <span className={layout.badge} data-tone={needsKey ? 'warning' : v.category === 'gemini' ? 'accent' : 'muted'}>
                        {needsKey ? 'Cần Gemini key' : CATEGORY_TAG[v.category]}
                      </span>
                      <span className={styles.voiceName}>{v.name}</span>
                      <span className={styles.voiceDesc}>{v.desc}</span>
                      <span className={styles.wave} aria-hidden="true" data-playing={isPlaying ? 'true' : 'false'}>
                        {WAVE.map((h, i) => <span key={i} style={{ height: h }} />)}
                      </span>
                    </button>
                    <button
                      type="button"
                      className={styles.play}
                      aria-label={isPlaying ? `Dừng nghe thử ${v.name}` : `Nghe thử giọng ${v.name}`}
                      onClick={(e) => handlePreviewVoice(v.id, e)}
                    >
                      {isPlaying ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4l13 8-13 8z" /></svg>
                      )}
                    </button>
                  </div>
                )
              })}
              <div className={styles.voiceCard} data-active={noVoice ? 'true' : 'false'}>
                <button type="button" role="radio" aria-checked={noVoice} className={styles.voicePick} onClick={() => setNoVoice(true)}>
                  <span className={layout.badge} data-tone="muted">Tạo giọng sau</span>
                  <span className={styles.voiceName}>Không lồng tiếng</span>
                  <span className={styles.voiceDesc}>Vào Studio với phụ đề, thêm giọng sau ở tab Âm thanh</span>
                </button>
              </div>
            </div>
          </section>

          <section className={styles.options}>
            <div className={styles.optionCard}>
              <div className={styles.optionTitle}>Tốc độ đọc</div>
              <div role="radiogroup" aria-label="Tốc độ đọc" className={styles.speedRow}>
                {SPEEDS.map((s) => (
                  <button
                    key={s.rate}
                    type="button"
                    role="radio"
                    aria-checked={speed.rate === s.rate}
                    disabled={speedLocked}
                    className={layout.chip}
                    data-active={speed.rate === s.rate ? 'true' : 'false'}
                    onClick={() => setSpeechRate(s.rate)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              {isGeminiVoice && !noVoice && <p className={styles.optionNote}>Giọng Gemini tự chọn nhịp đọc theo từng cảnh.</p>}
            </div>
            <div className={styles.optionCard}>
              <div className={styles.switchRow}>
                <span>
                  <span className={styles.optionTitle}>Phụ đề tự động</span>
                  <span className={styles.optionNote}>Chữ chạy theo lời đọc, nổi bật từ khoá theo màu nhấn</span>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={captionsOn}
                  aria-label="Phụ đề tự động"
                  className={styles.switch}
                  onClick={() => setCaptionsOn(!captionsOn)}
                >
                  <span className={styles.knob} />
                </button>
              </div>
            </div>
          </section>

          {audioGenerating && (
            <div className={styles.progress} role="status">
              <div className={styles.progressTrack}><div className={styles.progressFill} style={{ width: `${audioProgress}%` }} /></div>
              <span>Đang tạo giọng đọc và khớp thời lượng từng cảnh · {audioProgress}%</span>
            </div>
          )}
        </div>

        <aside className={layout.preview} aria-label="Xem trước">
          <div className={layout.previewHead}>
            <span>Cảnh 1 / {generatedScenes.length}</span>
            <span>9:16 · 1080×1920</span>
          </div>
          <div className={layout.screen}>{previewScene && <ScenePreviewPlayer scene={previewScene} />}</div>
          <dl className={layout.summary}>
            <dt>Giọng đọc</dt><dd>{noVoice ? 'Không lồng tiếng' : selectedVoice?.name || '—'}</dd>
            <dt>Tốc độ</dt><dd>{speedLocked ? 'Tự động' : speed.label}</dd>
            <dt>Phụ đề</dt><dd>{captionsOn ? 'Bật' : 'Tắt'}</dd>
            <dt>Số cảnh</dt><dd>{generatedScenes.length}</dd>
          </dl>
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
          <Button variant="ghost" size="md" onClick={() => setStep(1)} disabled={audioGenerating}>Quay lại</Button>
          <Button
            variant="primary"
            size="md"
            loading={audioGenerating}
            onClick={noVoice ? handleApplyOnlyScript : handleGenerateAudioAndApply}
            rightIcon={
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            }
          >
            {audioGenerating ? `Đang tạo giọng · ${audioProgress}%` : noVoice ? 'Vào Studio' : 'Tạo video'}
          </Button>
        </div>
      </div>
    </div>
  )
}
