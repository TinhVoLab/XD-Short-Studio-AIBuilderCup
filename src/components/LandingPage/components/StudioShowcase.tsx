import React, { useEffect, useRef, useState } from 'react'
import styles from './StudioShowcase.module.css'
import shared from '../shared.module.css'
import { prefersReducedMotion } from './primitives'
import {
  STUDIO_SCENES,
  STUDIO_VOICES,
  STUDIO_CAPTION_STYLES,
  STUDIO_THEME_SWATCHES,
  STUDIO_DURATION_SEC,
} from '../landingContent'

/** Bước thời gian của mô phỏng: 4 nhịp mỗi giây */
const TICKS_PER_SEC = 4
const TOTAL_TICKS = STUDIO_DURATION_SEC * TICKS_PER_SEC

// Sóng giọng đọc và khối phụ đề trên timeline — hình dạng cố định, chỉ đổi màu theo đầu phát
const WAVE = Array.from({ length: 60 }, (_, i) => Math.min(100, 20 + Math.abs(Math.sin(i * 1.7) * 60 + Math.sin(i * 0.45) * 25)))
const SUB_BLOCKS = Array.from({ length: 14 }, (_, i) => 1 + ((i * 7) % 5) / 3)
const RULER = [0, 5, 10, 15, 20, 25, 30]

const formatTime = (sec: number) => `00:${String(Math.floor(sec)).padStart(2, '0')}`

export const StudioShowcase: React.FC = () => {
  const [tick, setTick] = useState(0)
  const [playing, setPlaying] = useState(() => !prefersReducedMotion())
  const [inView, setInView] = useState(false)
  const [voice, setVoice] = useState(0)
  const [capStyle, setCapStyle] = useState(0)
  const windowRef = useRef<HTMLDivElement>(null)

  // Chỉ chạy đồng hồ khi khung Studio nằm trong màn hình
  useEffect(() => {
    const el = windowRef.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.15 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!playing || !inView) return
    const timer = setInterval(() => setTick((t) => (t + 1) % TOTAL_TICKS), 1000 / TICKS_PER_SEC)
    return () => clearInterval(timer)
  }, [playing, inView])

  const sec = tick / TICKS_PER_SEC
  const progress = sec / STUDIO_DURATION_SEC
  const sceneIdx = Math.max(0, STUDIO_SCENES.findIndex((s) => sec >= s.start && sec < s.end))
  const scene = STUDIO_SCENES[sceneIdx]
  const local = (sec - scene.start) / (scene.end - scene.start)
  const words = scene.caption.split(' ')
  const activeWord = Math.min(words.length - 1, Math.floor(local * words.length * 1.1))
  const activeWordClass = [styles.wordBounce, styles.wordColor, styles.wordUnderline][capStyle]

  return (
    <section id="studio" className={styles.band}>
      <div className={styles.inner}>
        <div className={shared.eyebrow}>Studio</div>
        <h2 className={styles.title}>
          Phòng dựng phim của bạn, <span className={`${shared.serif} ${shared.accent}`}>do AI vận hành.</span>
        </h2>
        <p className={styles.lead}>
          Kịch bản, cảnh, giọng đọc và phụ đề được dựng sẵn trên timeline. Bấm vào một cảnh, đổi giọng, đổi kiểu phụ đề — như
          một editor chuyên nghiệp.
        </p>

        <div ref={windowRef} className={styles.window}>
          <div className={styles.topBar}>
            <div className={styles.project}>
              <span className={styles.metaLabel}>Dự án</span>
              <span className={styles.projectName}>5 thói quen buổi sáng giúp bạn tập trung hơn</span>
            </div>
            <div className={styles.topActions}>
              <span className={styles.metaLabel}>9:16 · 1080p</span>
              <span className={styles.exportChip}>Xuất MP4</span>
            </div>
          </div>

          <div className={styles.body}>
            {/* Danh sách cảnh */}
            <div className={`${styles.side} ${styles.sideLeft}`}>
              <div className={styles.panelLabel}>Cảnh · AI dựng</div>
              {STUDIO_SCENES.map((s, i) => (
                <button
                  key={s.name}
                  type="button"
                  className={`${styles.opt} ${i === sceneIdx ? styles.optActive : ''}`}
                  onClick={() => setTick(s.start * TICKS_PER_SEC)}
                  aria-current={i === sceneIdx || undefined}
                >
                  <span className={styles.sceneName}>
                    <span className={styles.thumb} />
                    <span className={styles.ellipsis}>{s.name}</span>
                  </span>
                  <span className={styles.optMeta}>{s.end - s.start}s</span>
                </button>
              ))}
            </div>

            {/* Khung xem trước 9:16 */}
            <div className={styles.preview}>
              <div className={styles.phone}>
                <div className={styles.phoneMeta}>
                  <span>{scene.tag}</span>
                  <span>{formatTime(sec)}</span>
                </div>
                <div className={styles.phoneTitle}>
                  {scene.title}
                  <span className={shared.accent}>{scene.highlight}</span>
                </div>
                <div className={styles.caption} aria-live="off">
                  {words.map((w, i) => (
                    <span
                      key={`${sceneIdx}-${i}`}
                      className={`${styles.word} ${i === activeWord ? activeWordClass : i < activeWord ? styles.wordSpoken : ''}`}
                    >
                      {w}
                    </span>
                  ))}
                </div>
                <div className={styles.handle}>@kenh.cua.ban</div>
              </div>
            </div>

            {/* Bảng thuộc tính */}
            <div className={`${styles.side} ${styles.sideRight}`}>
              <div>
                <div className={styles.panelLabel}>Giọng đọc</div>
                <div className={styles.stack}>
                  {STUDIO_VOICES.map((v, i) => (
                    <button
                      key={v.label}
                      type="button"
                      className={`${styles.opt} ${i === voice ? styles.optSelected : ''}`}
                      aria-pressed={i === voice}
                      onClick={() => setVoice(i)}
                    >
                      <span>{v.label}</span>
                      <span className={styles.optMeta}>{v.tone}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className={styles.panelLabel}>Kiểu phụ đề</div>
                <div className={styles.capGrid}>
                  {STUDIO_CAPTION_STYLES.map((c, i) => (
                    <button
                      key={c}
                      type="button"
                      className={`${styles.opt} ${styles.capOpt} ${i === capStyle ? styles.capOptActive : ''}`}
                      aria-pressed={i === capStyle}
                      onClick={() => setCapStyle(i)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className={styles.panelLabel}>Theme màu</div>
                <div className={styles.swatches} role="img" aria-label="Theme màu">
                  {STUDIO_THEME_SWATCHES.map((c, i) => (
                    <span key={c} className={i === 0 ? styles.swatchActive : styles.swatch} style={{ background: c }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className={styles.timeline}>
            <div className={styles.transport}>
              <button
                type="button"
                className={styles.play}
                onClick={() => setPlaying((p) => !p)}
                aria-label={playing ? 'Tạm dừng' : 'Phát'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  {playing ? <path d="M6 5h4v14H6zM14 5h4v14h-4z" /> : <path d="M7 4v16l13-8z" />}
                </svg>
              </button>
              <span className={styles.timecode}>
                {formatTime(sec)} <span>/ {formatTime(STUDIO_DURATION_SEC)}</span>
              </span>
            </div>
            <div className={styles.tracks}>
              <div className={styles.trackLabels} aria-hidden="true">
                <span />
                <span>Video</span>
                <span>Giọng</span>
                <span>Phụ đề</span>
                <span>Nhạc</span>
              </div>
              <div className={styles.lanes}>
                <div className={styles.ruler} aria-hidden="true">
                  {RULER.map((r) => (
                    <span key={r}>{r}s</span>
                  ))}
                </div>
                <div className={styles.lane}>
                  {STUDIO_SCENES.map((s, i) => (
                    <span
                      key={s.name}
                      className={`${styles.clip} ${i === sceneIdx ? styles.clipActive : ''}`}
                      style={{ flex: s.end - s.start }}
                    >
                      {s.short}
                    </span>
                  ))}
                </div>
                <div className={`${styles.lane} ${styles.wave}`} aria-hidden="true">
                  {WAVE.map((h, i) => (
                    <span key={i} className={i / WAVE.length < progress ? styles.passed : ''} style={{ height: `${h.toFixed(0)}%` }} />
                  ))}
                </div>
                <div className={`${styles.lane} ${styles.subs}`} aria-hidden="true">
                  {SUB_BLOCKS.map((f, i) => (
                    <span key={i} className={i / SUB_BLOCKS.length < progress ? styles.passed : ''} style={{ flex: f }} />
                  ))}
                </div>
                <div className={styles.lane}>
                  <span className={styles.music}>Suno · Lofi nhẹ</span>
                </div>
                <div className={styles.playhead} style={{ left: `${(progress * 100).toFixed(2)}%` }} aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
