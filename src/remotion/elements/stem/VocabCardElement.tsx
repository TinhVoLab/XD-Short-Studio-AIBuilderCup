import React from 'react'
import { useCurrentFrame, interpolate, spring, Audio, Sequence, staticFile } from 'remotion'
import { SceneElement, VocabCardData } from '@/types/scene'
import { RemotionElementWrapper } from '../core/RemotionElementWrapper'
import { mixColor } from '../../utils/rich-text-parser'
import { getContrastTextColor } from '@/config/themePalettes'

interface VocabCardElementProps {
  el: SceneElement
  computedStyle?: React.CSSProperties
  positionStyle?: React.CSSProperties
  fps?: number
  sceneDuration?: number
}

export const VocabCardElement: React.FC<VocabCardElementProps> = ({
  el,
  computedStyle,
  positionStyle,
  fps = 30,
  sceneDuration,
}) => {
  const frame = useCurrentFrame()

  const data: VocabCardData = el.vocabData || {
    word: 'CRUCIAL',
    partOfSpeech: 'adj',
    ipa: '/ˈkruː.ʃəl/',
    audioAccent: 'UK',
    cefrLevel: 'IELTS 7.0+',
    meaningVi: 'Cực kỳ quan trọng, có tính quyết định',
    meaningEn: 'Extremely important or necessary',
    exampleEn: 'Regular exercise plays a crucial role in maintaining good health.',
    exampleVi: 'Tập thể dục đều đặn đóng vai trò cực kỳ quan trọng đối với sức khỏe.',
    highlightWord: 'crucial role',
    synonyms: ['Essential', 'Vital', 'Pivotal'],
    collocations: ['play a crucial role', 'crucial decision'],
    cardStyle: 'glass-modern',
    timingMode: 'auto',
    introSec: 2.5,
    meaningSec: 2.5,
    exampleSec: 3.0,
  }

  const width = Math.max(280, el.width || 340)
  const height = Math.max(280, el.height || 380)
  const accentColor = el.accentColor || 'var(--accent, #FFB800)'
  // Chữ nhỏ màu accent: pha 20% màu chữ theme → đậm hơn ở theme sáng, sáng hơn ở theme tối (luôn ≥ 4.5:1)
  const accentInk = `color-mix(in srgb, ${accentColor} 80%, var(--text))`

  // ── Timing Phasing Engine (Auto-Proportional or Fixed) ───────────────
  const isFixed = data.timingMode === 'fixed'
  let introFrames: number
  let meaningFrames: number

  if (isFixed) {
    const introSec = Math.max(0.6, data.introSec ?? 2.5)
    const meaningSec = Math.max(0.6, data.meaningSec ?? 2.5)
    introFrames = Math.round(introSec * fps)
    meaningFrames = Math.round(meaningSec * fps)
  } else {
    // Auto-scale proportionally according to scene duration
    // Proportions: 30% Intro/Pronounce, 30% Meaning, 40% Example & Synonyms
    const totalFrames = Math.max(45, Math.round((sceneDuration ?? 7) * fps))
    const minPhaseFrames = Math.min(20, Math.floor(totalFrames / 3.5))

    introFrames = Math.max(minPhaseFrames, Math.round(totalFrames * 0.30))
    meaningFrames = Math.max(minPhaseFrames, Math.round(totalFrames * 0.30))

    if (introFrames + meaningFrames > totalFrames - minPhaseFrames) {
      const remaining = Math.max(minPhaseFrames, totalFrames - minPhaseFrames)
      introFrames = Math.round(remaining / 2)
      meaningFrames = Math.round(remaining / 2)
    }
  }

  const exampleStartFrame = introFrames + meaningFrames

  // Current Phase
  const isIntroPhase = frame < introFrames
  const isMeaningPhase = frame >= introFrames && frame < exampleStartFrame
  const isExamplePhase = frame >= exampleStartFrame

  // ── Animations ─────────────────────────────────────────────────────
  // 1. Initial Card Entrance
  const cardScale = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 180 },
  })

  // 2. Audio Waveform Pulse (Active during Intro phase)
  const audioPulseProgress = (frame % (fps * 1.2)) / (fps * 1.2)
  const audioPulseScale = isIntroPhase ? 1 + Math.sin(audioPulseProgress * Math.PI * 2) * 0.15 : 1

  // 3. Meaning Entrance Spring
  const meaningSpring = frame >= introFrames
    ? spring({
        frame: frame - introFrames,
        fps,
        config: { damping: 14, stiffness: 190 },
      })
    : 0

  // 4. Example & Synonyms Entrance Spring
  const exampleSpring = frame >= exampleStartFrame
    ? spring({
        frame: frame - exampleStartFrame,
        fps,
        config: { damping: 14, stiffness: 180 },
      })
    : 0

  // ── Target Word Highlighter ────────────────────────────────────────
  const renderHighlightedSentence = (text: string, highlight?: string) => {
    if (!highlight || !text) return text

    const parts = text.split(new RegExp(`(${highlight})`, 'gi'))
    return parts.map((part, i) => {
      const isMatch = part.toLowerCase() === highlight.toLowerCase()
      if (!isMatch) return <span key={i}>{part}</span>

      return (
        <span
          key={i}
          style={{
            color: el.accentColor?.startsWith('#') ? getContrastTextColor(el.accentColor) : 'var(--on-accent, #000000)',
            backgroundColor: accentColor,
            fontWeight: 800,
            padding: '2px 6px',
            borderRadius: 4,
            display: 'inline-block',
            margin: '0 2px',
            boxShadow: `0 0 10px ${mixColor(accentColor, 40)}`,
          }}
        >
          {part}
        </span>
      )
    })
  }

  const sfxEnabled = data.sfxEnabled !== false

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      {/* ── Auto-SFX Synchronized Audio Sequences ── */}
      {sfxEnabled && (
        <>
          {/* Vào cảnh (Entrance): Whoosh lướt êm */}
          <Sequence from={0} durationInFrames={Math.max(1, Math.round(fps * 0.6))}>
            <Audio src={staticFile('sfx/whoosh.wav')} volume={0.5} />
          </Sequence>

          {/* Pha 2: Hiện nghĩa tiếng Việt (Pop) */}
          <Sequence from={introFrames} durationInFrames={Math.max(1, Math.round(fps * 0.8))}>
            <Audio src={staticFile('sfx/pop.wav')} volume={0.55} />
          </Sequence>

          {/* Pha 3: Hiện ví dụ & Đồng nghĩa (Chime êm) */}
          <Sequence from={exampleStartFrame} durationInFrames={Math.max(1, Math.round(fps * 1.2))}>
            <Audio src={staticFile('sfx/chime.wav')} volume={0.5} />
          </Sequence>
        </>
      )}

      <div
        style={{
          width,
          height,
          borderRadius: 16,
          background: 'var(--card-bg)',
          border: `1.5px solid ${mixColor(accentColor, 20)}`,
          boxShadow: `var(--shadow-lg, 0 16px 40px rgba(0, 0, 0, 0.7)), 0 0 24px ${mixColor(accentColor, 9)}`,
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          position: 'relative',
          padding: '16px 18px 24px',
          gap: 12,
          overflow: 'hidden',
          transform: `scale(${Math.min(1, cardScale)})`,
          fontFamily: el.fontFamily || "'Be Vietnam Pro', 'Inter', system-ui, sans-serif",
        }}
      >
        {/* ── 1. TOP HEADER: Level Badge & Audio Speaker ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          {/* Level Badge (CEFR / IELTS) */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '3px 8px',
              borderRadius: 6,
              background: mixColor(accentColor, 9),
              border: `1px solid ${mixColor(accentColor, 27)}`,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: accentInk,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {data.cefrLevel || 'IELTS 7.0+'}
            </span>
          </div>

          {/* Audio Speaker & Accent Tag */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '3px 8px',
              borderRadius: 6,
              background: 'var(--surface-1)',
              border: '1px solid var(--border)',
              transform: `scale(${audioPulseScale})`,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2.5">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text)' }}>
              {data.audioAccent || 'UK'}
            </span>
          </div>
        </div>

        {/* ── 2. HERO WORD & PHONETICS (IPA) ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '4px 0',
            flexShrink: 0,
          }}
        >
          {/* Main Word */}
          <h2
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 900,
              color: 'var(--text)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              textAlign: 'center',
              lineHeight: 1.1,
              textShadow: `0 2px 14px ${mixColor(accentColor, 25)}`,
              fontFamily: el.fontFamily || "'Be Vietnam Pro', 'Montserrat', sans-serif",
            }}
          >
            {data.word}
          </h2>

          {/* Part of Speech & IPA Pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '3px 10px',
              borderRadius: 20,
              background: 'var(--surface-1)',
              border: '1px solid var(--border)',
            }}
          >
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                color: accentInk,
                textTransform: 'lowercase',
                fontStyle: 'italic',
              }}
            >
              {data.partOfSpeech || 'adj'}
            </span>
            <span style={{ color: 'var(--text-sub)', fontSize: 10 }}>•</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-sub)',
                fontFamily: 'monospace, sans-serif',
              }}
            >
              {data.ipa || '/ˈkruː.ʃəl/'}
            </span>
          </div>
        </div>

        {/* Hairline Divider */}
        <div
          style={{
            width: '100%',
            height: 1,
            background: 'linear-gradient(90deg, transparent, var(--border), transparent)',
            flexShrink: 0,
          }}
        />

        {/* ── 3. MEANING SECTION (Phase 2 & 3: Stacked Micro-label Layout) ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            opacity: Math.min(1, meaningSpring),
            transform: `translateY(${(1 - Math.min(1, meaningSpring)) * 12}px)`,
            flexShrink: 0,
          }}
        >
          {/* Micro-label trên dòng riêng */}
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 800,
              color: accentInk,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Ý NGHĨA
          </span>

          {/* Nghĩa tiếng Việt toàn chiều rộng, không bị cắt chữ */}
          <div
            style={{
              fontSize: 14.5,
              fontWeight: 700,
              color: 'var(--text)',
              lineHeight: 1.45,
            }}
          >
            {data.meaningVi}
          </div>

          {/* Định nghĩa tiếng Anh */}
          {data.meaningEn && (
            <div
              style={{
                fontSize: 11.5,
                fontStyle: 'italic',
                color: 'var(--text-sub, #94A3B8)',
                lineHeight: 1.35,
              }}
            >
              "{data.meaningEn}"
            </div>
          )}
        </div>

        {/* ── 4. CONTEXTUAL EXAMPLE & SYNONYMS (Phase 3) ── */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            opacity: Math.min(1, exampleSpring),
            transform: `translateY(${(1 - Math.min(1, exampleSpring)) * 16}px)`,
            overflow: 'visible',
          }}
        >
          {/* Example Box - Hiện đại, phẳng, bỏ đường viền mép trái cũ kỹ */}
          {data.exampleEn && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                background: 'var(--surface-1)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  color: 'var(--text-sub, #64748B)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                VÍ DỤ NGỮ CẢNH
              </span>

              <div
                style={{
                  fontSize: 12.5,
                  lineHeight: 1.45,
                  color: 'var(--text)',
                }}
              >
                "{renderHighlightedSentence(data.exampleEn, data.highlightWord || data.word)}"
              </div>

              {data.exampleVi && (
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-sub, #94A3B8)',
                    lineHeight: 1.35,
                  }}
                >
                  {data.exampleVi}
                </div>
              )}
            </div>
          )}

          {/* Synonyms Chips Box - Đóng khung gọn gàng, cách xa viền đáy */}
          {data.synonyms && data.synonyms.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                flexWrap: 'wrap',
                padding: '6px 10px',
                borderRadius: 8,
                background: 'var(--surface-1)',
                border: '1px solid var(--border)',
                marginTop: 2,
              }}
            >
              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: 800,
                  color: 'var(--text-sub, #64748B)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Đồng nghĩa:
              </span>
              {data.synonyms.map((syn, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: 10.5,
                    fontWeight: 600,
                    color: 'var(--text)',
                    background: 'var(--surface-1)',
                    border: '1px solid var(--border)',
                    padding: '2px 8px',
                    borderRadius: 4,
                  }}
                >
                  {syn}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </RemotionElementWrapper>
  )
}
