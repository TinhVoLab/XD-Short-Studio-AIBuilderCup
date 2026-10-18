import React, { useEffect, useMemo, useRef, useState } from 'react'
import styles from './HeroSection.module.css'
import shared from '../shared.module.css'
import { useEditorStore } from '@/store/useEditorStore'
import { prefersReducedMotion } from './primitives'
import { useHeroTemplates, type HeroTemplateVideo } from '../useHeroTemplates'
import {
  HERO_IDEAS,
  GALLERY_TABS,
  GALLERY_CARDS,
  GALLERY_CATEGORY_LABEL,
  type GalleryCard,
  type GalleryCategory,
} from '../landingContent'

interface HeroSectionProps {
  /** Mở Studio; có ý tưởng thì mở luôn trình tạo video AI với ý tưởng đó */
  onCreate: (idea: string) => void
}

/** Hiệu ứng tự gõ lần lượt các ý tưởng mẫu; tắt khi người dùng giảm chuyển động */
function useTypewriter(lines: string[], active: boolean) {
  const [state, setState] = useState({ line: 0, chars: prefersReducedMotion() ? lines[0].length : 0 })

  useEffect(() => {
    if (!active || prefersReducedMotion()) return
    const full = lines[state.line]
    const done = state.chars >= full.length
    const timer = setTimeout(
      () => setState((s) => (done ? { line: (s.line + 1) % lines.length, chars: 0 } : { ...s, chars: s.chars + 1 })),
      done ? 2200 : state.chars === 0 ? 600 : 60
    )
    return () => clearTimeout(timer)
  }, [active, lines, state])

  return lines[state.line].slice(0, state.chars)
}

const CardBody: React.FC<{ card: GalleryCard; hi: string }> = ({ card, hi }) => {
  switch (card.kind) {
    case 'quote':
      return (
        <>
          <div className={styles.quote}>
            {card.a}
            <span className={shared.serif} style={{ color: hi }}>
              {card.b}
            </span>
          </div>
          <div className={styles.quoteRule} />
        </>
      )
    case 'chart':
      return (
        <>
          <div className={styles.chartTitle}>{card.a}</div>
          <div className={styles.bars} aria-hidden="true">
            {[16, 28, 44, 66].map((h) => (
              <span key={h} style={{ height: `${h}%` }} />
            ))}
            <span style={{ height: '100%', background: hi }} />
          </div>
        </>
      )
    case 'quiz':
      return (
        <>
          <div className={styles.quizTitle}>{card.a}</div>
          <div className={styles.quizOptions}>
            {card.options?.map((opt, i) => (
              <div key={opt} className={i === 1 ? styles.quizRight : styles.quizOption} style={i === 1 ? { background: hi } : undefined}>
                {'ABC'[i]} · {opt}
              </div>
            ))}
          </div>
        </>
      )
    case 'word':
      return (
        <>
          <div className={styles.word}>{card.a}</div>
          <div className={styles.phonetic}>{card.phonetic}</div>
          <div className={styles.meaning} style={{ color: hi }}>
            {card.b}
          </div>
          <div className={styles.push} />
        </>
      )
  }
}

const VOICE_BARS = [40, 80, 55, 100, 65, 30, 75, 45]

const VideoCard: React.FC<{ card: GalleryCard; video?: HeroTemplateVideo; hidden?: boolean }> = ({ card, video, hidden }) => {
  const [failed, setFailed] = useState(false)
  const isAccent = card.bg === 'accent'
  const hi = isAccent ? 'var(--l-on-accent)' : 'var(--l-accent)'
  const showVideo = Boolean(video?.videoSrc) && !failed

  return (
    <div
      className={styles.card}
      style={{ background: isAccent ? 'var(--l-accent)' : card.bg, color: card.fg }}
      aria-hidden={hidden || undefined}
    >
      {showVideo && (
        <video
          className={styles.cardVideo}
          src={video!.videoSrc}
          poster={video!.poster}
          muted
          loop
          playsInline
          autoPlay={!prefersReducedMotion()}
          preload={video!.poster ? 'none' : 'metadata'}
          onError={() => setFailed(true)}
        />
      )}
      <div className={styles.cardMeta}>
        <span>{GALLERY_CATEGORY_LABEL[card.cat]}</span>
        <span>{card.dur}</span>
      </div>
      {!showVideo && (
        <>
          <CardBody card={card} hi={hi} />
          <div className={styles.voice} aria-hidden="true">
            {VOICE_BARS.map((h, i) => (
              <span key={i} style={{ height: `${h}%` }} />
            ))}
            <em>{card.voice}</em>
          </div>
        </>
      )}
    </div>
  )
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onCreate }) => {
  const [idea, setIdea] = useState('')
  const [tab, setTab] = useState<GalleryCategory | 'all'>('all')
  const [stageInView, setStageInView] = useState(true)
  const stageRef = useRef<HTMLDivElement>(null)
  const templates = useHeroTemplates()
  const freeLimit = useEditorStore((s) => s.getPlanByTier('free').quotas?.monthlyVideoLimit)
  const typed = useTypewriter(HERO_IDEAS, !idea)

  // Dừng dải thẻ và video mẫu khi cuộn khỏi màn hình
  useEffect(() => {
    const stage = stageRef.current
    if (!stage || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => setStageInView(entry.isIntersecting), { threshold: 0 })
    observer.observe(stage)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    stageRef.current?.querySelectorAll('video').forEach((v) => {
      if (stageInView && !prefersReducedMotion()) v.play().catch(() => {})
      else v.pause()
    })
  }, [stageInView, tab, templates])

  // Lọc theo chủ đề, lặp đủ dài để dải chạy liền mạch; chỉ thẻ đầu mỗi chủ đề gắn video mẫu
  const cards = useMemo(() => {
    let list = GALLERY_CARDS.filter((c) => tab === 'all' || c.cat === tab)
    while (list.length < 8) list = list.concat(list)
    const seen = new Set<GalleryCategory>()
    return list.map((card) => {
      const lead = !seen.has(card.cat)
      seen.add(card.cat)
      return { card, video: lead ? templates[card.cat] : undefined }
    })
  }, [tab, templates])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreate(idea.trim())
  }

  return (
    <div id="hero" className={styles.hero}>
      <div className={shared.grain} aria-hidden="true" />
      <div className={`${shared.glow} ${styles.glow}`} aria-hidden="true" />

      <section className={styles.head}>
        <div className={styles.kicker}>Nền tảng sáng tạo video ngắn · Tiếng Việt</div>
        <h1 className={styles.title}>
          Ý tưởng của bạn,
          <br />
          <span className={`${shared.serif} ${shared.accent}`}>thành thước phim</span>
          <br />
          trong vài phút.
        </h1>
        <p className={styles.lead}>
          Kịch bản, hình ảnh, giọng đọc tiếng Việt và phụ đề — được AI đạo diễn, còn bạn giữ quyền chỉnh sửa cuối cùng.
        </p>

        <form className={styles.ideaForm} onSubmit={submit}>
          <label htmlFor="hero-idea" className={shared.srOnly}>
            Ý tưởng video
          </label>
          <svg className={styles.sparkle} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
          </svg>
          <div className={styles.ideaField}>
            <input id="hero-idea" type="text" value={idea} onChange={(e) => setIdea(e.target.value)} autoComplete="off" />
            {!idea && (
              <span className={styles.ghost} aria-hidden="true">
                {typed}
                <span className={styles.caret} />
              </span>
            )}
          </div>
          <button type="submit" className={`${shared.btnAccent} ${styles.ideaSubmit}`}>
            Tạo video
          </button>
        </form>
        <p className={styles.note}>
          {typeof freeLimit === 'number' && freeLimit > 0 ? `Miễn phí ${freeLimit} video mỗi tháng · ` : ''}Không cần thẻ
        </p>

        <div className={styles.tabs} role="tablist" aria-label="Chủ đề">
          {GALLERY_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <div ref={stageRef} className={`${styles.stage} ${stageInView ? '' : styles.stagePaused}`}>
        <div className={styles.tilt}>
          <div className={styles.track}>
            {cards.map(({ card, video }, i) => (
              <VideoCard key={`a${i}`} card={card} video={video} />
            ))}
            {cards.map(({ card, video }, i) => (
              <VideoCard key={`b${i}`} card={card} video={video} hidden />
            ))}
          </div>
        </div>
        <div className={styles.fadeSides} aria-hidden="true" />
        <div className={styles.fadeBottom} aria-hidden="true" />
      </div>

      <ul className={styles.facts}>
        <li>Giọng đọc tiếng Việt</li>
        <li>Phụ đề khớp từng từ</li>
        <li>9:16 · 1080p</li>
        <li>Render ~2 phút / 30s</li>
      </ul>
    </div>
  )
}
