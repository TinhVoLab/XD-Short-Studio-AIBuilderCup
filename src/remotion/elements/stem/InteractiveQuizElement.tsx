import React, { useMemo } from 'react'
import { useCurrentFrame, interpolate, spring, Easing, Audio, Sequence, staticFile } from 'remotion'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { SceneElement, QuizData } from '@/types/scene'
import { RemotionElementWrapper } from '../core/RemotionElementWrapper'
import { mixColor } from '../../utils/rich-text-parser'
import { getContrastTextColor } from '@/config/themePalettes'

interface InteractiveQuizElementProps {
  el: SceneElement
  computedStyle?: React.CSSProperties
  positionStyle?: React.CSSProperties
  fps?: number
  sceneDuration?: number
}

function renderMathText(text: string, isLatex?: boolean): React.ReactNode {
  if (!text) return ''
  if (!isLatex) return text

  try {
    const html = katex.renderToString(text, {
      displayMode: false,
      throwOnError: false,
      output: 'htmlAndMathml',
    })
    return <span dangerouslySetInnerHTML={{ __html: html }} />
  } catch {
    return text
  }
}

export const InteractiveQuizElement: React.FC<InteractiveQuizElementProps> = ({
  el,
  computedStyle,
  positionStyle,
  fps = 30,
  sceneDuration,
}) => {
  const frame = useCurrentFrame()

  const data: QuizData = el.quizData || {
    quizType: 'single-choice',
    badge: 'THỬ THÁCH 5S',
    question: 'Kim loại nào sau đây dẫn điện tốt nhất?',
    options: [
      { id: 'A', text: 'Nhôm (Al)' },
      { id: 'B', text: 'Đồng (Cu)' },
      { id: 'C', text: 'Bạc (Ag)' },
      { id: 'D', text: 'Vàng (Au)' },
    ],
    correctAnswers: ['C'],
    timingMode: 'auto',
    introSec: 3,
    countdownSec: 5,
    revealSec: 4,
    explanation: 'Bạc (Ag) dẫn điện tốt nhất trong các kim loại, tiếp theo là Đồng, Vàng và Nhôm.',
    showExplanation: true,
    themePreset: 'studio-neon',
    layoutVariant: 'stacked',
  }

  const width = Math.max(260, el.width || 360)
  const height = Math.max(240, el.height || 340)
  const accentColor = el.accentColor || 'var(--accent, #BEFF01)'
  // Chữ trên nền accent đặc: accent tuỳ chỉnh (hex) → tự chọn đen/trắng; accent theo theme → --on-accent
  const onAccent = el.accentColor?.startsWith('#') ? getContrastTextColor(el.accentColor) : 'var(--on-accent, #000000)'

  // ── Timing Engine (Frame Calculation) ──────────────────────────────
  const isFixed = data.timingMode === 'fixed'
  let introFrames: number
  let countdownFrames: number
  let effectiveCountdownSec: number

  if (isFixed) {
    const introSec = Math.max(0.8, data.introSec ?? 3)
    const countdownSec = Math.max(1, Math.min(15, data.countdownSec ?? 5))
    introFrames = Math.round(introSec * fps)
    countdownFrames = Math.round(countdownSec * fps)
    effectiveCountdownSec = countdownSec
  } else {
    // Auto-scale proportionally according to scene duration
    // Proportions: 25% Intro reading, 50% Countdown, 25% Reveal
    const totalFrames = Math.max(60, Math.round((sceneDuration ?? 8) * fps))
    const minIntroFrames = Math.min(24, Math.floor(totalFrames * 0.20))
    const minRevealFrames = Math.min(24, Math.floor(totalFrames * 0.20))

    introFrames = Math.max(minIntroFrames, Math.round(totalFrames * 0.25))
    const revealTargetFrames = Math.max(minRevealFrames, Math.round(totalFrames * 0.25))
    countdownFrames = Math.max(30, totalFrames - introFrames - revealTargetFrames)
    effectiveCountdownSec = Math.max(1, Math.round(countdownFrames / fps))
  }

  const revealStartFrame = introFrames + countdownFrames

  // Phases: 'reading' | 'countdown' | 'reveal'
  const isReadingPhase = frame < introFrames
  const isCountdownPhase = frame >= introFrames && frame < revealStartFrame
  const isRevealPhase = frame >= revealStartFrame

  // Countdown Progress (1.0 -> 0.0)
  const countdownProgress = isReadingPhase
    ? 1.0
    : isCountdownPhase
    ? interpolate(frame, [introFrames, revealStartFrame], [1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 0.0

  // Current Countdown Number & Tick
  const framesIntoCountdown = Math.max(0, frame - introFrames)
  const framesPerSecond = countdownFrames / Math.max(1, effectiveCountdownSec)
  const secondsRemaining = isFixed
    ? Math.max(1, Math.ceil((data.countdownSec ?? 5) - framesIntoCountdown / fps))
    : Math.max(1, Math.ceil((countdownFrames - framesIntoCountdown) / framesPerSecond))

  // Spring bump on every whole second
  const secondSubFrame = Math.round(framesIntoCountdown % framesPerSecond)
  const secondPulse = isCountdownPhase
    ? spring({
        frame: secondSubFrame,
        fps,
        config: { damping: 12, stiffness: 220 },
      })
    : 1.0
  const numberScale = 1 + (secondPulse > 0.5 ? (1 - secondPulse) * 0.35 : 0)

  // Dynamic Badge adapt if using default badge
  const displayBadge = !data.badge || data.badge === 'THỬ THÁCH 5S'
    ? (!isFixed ? `THỬ THÁCH ${effectiveCountdownSec}S` : (data.badge || 'THỬ THÁCH 5S'))
    : data.badge

  // Options stagger entrance (0 -> introFrames)
  const options = data.options || []
  const correctAnswers = data.correctAnswers || ['C']
  const isGrid = data.layoutVariant === 'grid-2x2'
  const sfxEnabled = data.sfxEnabled !== false

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      {/* ── Auto-SFX Synchronized Audio Sequences ── */}
      {sfxEnabled && (
        <>
          {/* Nhịp tích tắc đồng hồ cho từng giây trong pha đếm ngược */}
          {Array.from({ length: effectiveCountdownSec }).map((_, i) => {
            const tickFrame = introFrames + Math.round(i * framesPerSecond)
            return (
              <Sequence
                key={`sfx-tick-${i}`}
                from={tickFrame}
                durationInFrames={Math.max(1, Math.round(fps * 0.4))}
              >
                <Audio src={staticFile('sfx/clock_tick.wav')} volume={0.65} />
              </Sequence>
            )
          })}

          {/* Chuông ding ăn mừng khi mở đáp án đúng */}
          <Sequence
            from={revealStartFrame}
            durationInFrames={Math.max(1, Math.round(fps * 1.5))}
          >
            <Audio src={staticFile('sfx/ding.wav')} volume={0.75} />
          </Sequence>
        </>
      )}

      <div
        style={{
          width,
          height,
          borderRadius: 16,
          overflow: 'hidden',
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
          boxShadow: `var(--shadow-lg, 0 12px 36px rgba(0, 0, 0, 0.65)), 0 0 20px ${mixColor(accentColor, 8)}`,
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          position: 'relative',
          padding: '14px 16px',
          gap: 10,
          fontFamily: el.fontFamily || "'Be Vietnam Pro', 'Inter', system-ui, sans-serif",
        }}
      >
        {/* Top Header: Badge & Countdown Widget */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          {/* Badge: Luôn hiển thị danh mục / chủ đề môn học, không bị ghi đè */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '3px 9px',
              borderRadius: 6,
              background: isRevealPhase
                ? `color-mix(in srgb, ${accentColor} 15%, transparent)`
                : isCountdownPhase
                ? 'rgba(255, 75, 75, 0.12)'
                : 'var(--surface-1)',
              border: `1px solid ${
                isRevealPhase
                  ? `color-mix(in srgb, ${accentColor} 35%, transparent)`
                  : isCountdownPhase
                  ? 'rgba(255, 75, 75, 0.25)'
                  : 'var(--border)'
              }`,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                // Nền chip đã nhuộm accent/đỏ → chữ dùng --text để đủ tương phản trên mọi theme
                color: isRevealPhase || isCountdownPhase ? 'var(--text)' : 'var(--text-sub, #8b949e)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {displayBadge}
            </span>
          </div>

          {/* Countdown Display */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isCountdownPhase && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'rgba(255, 60, 60, 0.2)',
                  border: '2px solid #FF4560',
                  color: 'var(--text)',
                  fontWeight: 900,
                  fontSize: 15,
                  transform: `scale(${numberScale})`,
                  boxShadow: '0 0 12px rgba(255, 69, 96, 0.4)',
                }}
              >
                {secondsRemaining}
              </div>
            )}

            {isRevealPhase && (
              <div
                style={{
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: accentColor,
                  border: `1px solid ${accentColor}`,
                  color: onAccent,
                  fontWeight: 800,
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                ĐÁP ÁN ĐÚNG
              </div>
            )}
          </div>
        </div>

        {/* Linear Countdown Progress Bar */}
        <div
          style={{
            width: '100%',
            height: 3,
            borderRadius: 2,
            background: 'var(--surface-1)',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${countdownProgress * 100}%`,
              background: isCountdownPhase
                ? 'linear-gradient(90deg, #FF4560, #FFB800)'
                : isRevealPhase
                ? accentColor
                : accentColor,
              borderRadius: 2,
            }}
          />
        </div>

        {/* Question Text */}
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 700,
            lineHeight: 1.45,
            color: 'var(--text)',
            letterSpacing: '0.01em',
            flexShrink: 0,
            fontFamily: el.fontFamily || 'inherit',
          }}
        >
          {renderMathText(data.question, data.questionLatex)}
        </div>

        {/* Options List - Bỏ overflow: hidden để viền và bóng phát sáng không bị cắt xén */}
        <div
          style={{
            flex: 1,
            display: isGrid ? 'grid' : 'flex',
            gridTemplateColumns: isGrid ? '1fr 1fr' : undefined,
            flexDirection: isGrid ? undefined : 'column',
            gap: 7,
            padding: '2px 0',
          }}
        >
          {options.map((opt, idx) => {
            const isCorrect = correctAnswers.includes(opt.id)

            // Stagger entrance in reading phase
            const optEntranceFrame = Math.round((introFrames / (options.length + 1)) * (idx + 1))
            const optPop = isReadingPhase
              ? spring({
                  frame: Math.max(0, frame - optEntranceFrame),
                  fps,
                  config: { damping: 14, stiffness: 180 },
                })
              : 1.0

            // Styling states
            const isHighlighted = isRevealPhase && isCorrect
            const isDimmed = isRevealPhase && !isCorrect

            return (
              <div
                key={opt.id || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '7px 12px',
                  borderRadius: 10,
                  background: isHighlighted
                    ? `color-mix(in srgb, ${accentColor} 18%, transparent)`
                    : isDimmed
                    ? 'transparent'
                    : 'var(--surface-1)',
                  border: isHighlighted
                    ? `1.5px solid ${accentColor}`
                    : isDimmed
                    ? '1px solid var(--border)'
                    : '1px solid var(--border)',
                  boxShadow: isHighlighted ? `0 0 16px ${mixColor(accentColor, 20)}` : 'none',
                  // Phương án sai được làm mờ bằng màu chữ phụ (không giảm opacity cả khối → chữ vẫn đọc được)
                  opacity: Math.min(1, optPop),
                  boxSizing: 'border-box',
                  width: '100%',
                }}
              >
                {/* Option Badge (A, B, C, D) */}
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isHighlighted
                      ? accentColor
                      : 'var(--surface-1)',
                    color: isHighlighted ? onAccent : isDimmed ? 'var(--text-sub)' : 'var(--text, #FFFFFF)',
                    fontSize: 11,
                    fontWeight: 900,
                    flexShrink: 0,
                  }}
                >
                  {opt.id}
                </div>

                {/* Option Text */}
                <div
                  style={{
                    flex: 1,
                    fontSize: 12,
                    fontWeight: isHighlighted ? 700 : 500,
                    color: isDimmed ? 'var(--text-sub)' : 'var(--text)',
                    lineHeight: 1.35,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: isGrid ? 'nowrap' : 'normal',
                  }}
                >
                  {renderMathText(opt.text, opt.isLatex)}
                </div>

                {/* Checkmark icon for correct answer */}
                {isHighlighted && (
                  <div
                    style={{
                      color: accentColor,
                      display: 'flex',
                      alignItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Explanation Footer (Reveal Phase) */}
        {data.showExplanation !== false && data.explanation && isRevealPhase && (
          <div
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              background: 'var(--surface-1)',
              borderLeft: `3px solid ${accentColor}`,
              fontSize: 10.5,
              color: 'var(--text-sub, #8b949e)',
              lineHeight: 1.4,
              flexShrink: 0,
              animation: 'fadeIn 0.3s ease',
            }}
          >
            <span style={{ color: accentColor, fontWeight: 700, marginRight: 4 }}>
              Giải thích:
            </span>
            {renderMathText(data.explanation)}
          </div>
        )}
      </div>
    </RemotionElementWrapper>
  )
}
