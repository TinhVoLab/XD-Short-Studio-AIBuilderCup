import React, { useMemo } from 'react'
import { useCurrentFrame, Audio, Sequence, staticFile } from 'remotion'
import { SceneElement } from '@/types/scene'
import { RemotionElementWrapper } from '../core/RemotionElementWrapper'
import { AlgorithmRegistry } from './core/AlgorithmRegistry'
import { AlgorithmTraceDriver } from './core/AlgorithmTraceDriver'
import { AlgorithmSimulationConfig, AlgorithmTraceStep } from './core/types'
import { mixColor } from '../../utils/rich-text-parser';

interface AlgorithmSimulationElementProps {
  el: SceneElement
  computedStyle?: React.CSSProperties
  positionStyle?: React.CSSProperties
  fps?: number
  sceneDuration?: number
}

export const AlgorithmSimulationElement: React.FC<AlgorithmSimulationElementProps> = ({
  el,
  positionStyle,
  fps = 30,
  sceneDuration = 10,
}) => {
  const frame = useCurrentFrame()
  const algoConfig: AlgorithmSimulationConfig = el.algorithmData || {
    mode: 'battle',
    battleLanes: [
      { algorithmId: 'quick-sort', label: 'QUICK SORT O(N LOG N)', accentColor: '#00D4FF' },
      { algorithmId: 'bubble-sort', label: 'BUBBLE SORT O(N²)', accentColor: '#FF6B6B' },
    ],
    arraySize: 24,
    initialType: 'random',
    seed: 42,
    speedMultiplier: 1.0,
    theme: 'cyber-neon',
    soundEnabled: true,
    soundVolume: 0.7,
    showMetricsHUD: true,
  }

  const width = el.width || 360
  const height = el.height || 480
  const theme = algoConfig.theme || 'cyber-neon'
  const arraySize = algoConfig.arraySize || 24
  const initialType = algoConfig.initialType || 'random'
  const seed = algoConfig.seed || 42
  const quizHook = algoConfig.quizHook

  // Determine active lanes (Single mode or Battle mode)
  const lanes = useMemo(() => {
    if (algoConfig.mode === 'single') {
      const algoId = algoConfig.algorithmId || 'quick-sort'
      const def = AlgorithmRegistry.getAlgorithm(algoId)
      return [
        {
          algorithmId: algoId,
          label: def?.name.toUpperCase() || 'QUICK SORT',
          accentColor: '#00D4FF',
          definition: def,
        },
      ]
    }

    const battleLanes = algoConfig.battleLanes || [
      { algorithmId: 'quick-sort', label: 'QUICK SORT O(N LOG N)', accentColor: '#00D4FF' },
      { algorithmId: 'bubble-sort', label: 'BUBBLE SORT O(N²)', accentColor: '#FF6B6B' },
    ]

    return battleLanes.map((lane) => ({
      ...lane,
      definition: AlgorithmRegistry.getAlgorithm(lane.algorithmId),
    }))
  }, [algoConfig.mode, algoConfig.algorithmId, algoConfig.battleLanes])

  // Generate and cache traces for each lane
  const laneTraces = useMemo(() => {
    return lanes.map((lane) => {
      if (!lane.definition) return []
      return AlgorithmTraceDriver.getTrace(lane.definition, arraySize, initialType, seed)
    })
  }, [lanes, arraySize, initialType, seed])

  // Maximum trace steps among all lanes
  const maxTraceSteps = useMemo(() => {
    return Math.max(1, ...laneTraces.map((t) => t.length))
  }, [laneTraces])

  // Calculate effective speed based on speedMode and sceneDuration
  const effectiveSpeed = useMemo(() => {
    return AlgorithmTraceDriver.calculateEffectiveSpeed(
      algoConfig,
      sceneDuration,
      maxTraceSteps,
      fps
    )
  }, [algoConfig, sceneDuration, maxTraceSteps, fps])

  // Calculate current step for each lane at current frame
  const laneCurrentSteps = useMemo(() => {
    return laneTraces.map((trace) => {
      return AlgorithmTraceDriver.getStepAtFrame(
        trace,
        frame,
        fps,
        effectiveSpeed,
        quizHook,
        algoConfig.speedRamp,
        sceneDuration
      )
    })
  }, [laneTraces, frame, fps, effectiveSpeed, quizHook, algoConfig.speedRamp, sceneDuration])

  // Pre-calculate audio events for swaps across timeline
  const allAudioEvents = useMemo(() => {
    if (algoConfig.soundEnabled === false) return []
    const events: Array<{ frame: number; pitch: number }> = []

    // Warp frame helper if Quiz Freeze is active
    const warpFrame = (simFrame: number) => {
      if (!quizHook?.enabled) return simFrame
      const freezeAtFrame = Math.round((quizHook.freezeAtSec || 2.0) * fps)
      const freezeDurationFrames = Math.round((quizHook.freezeDurationSec || 3.0) * fps)
      if (simFrame > freezeAtFrame) {
        return simFrame + freezeDurationFrames
      }
      return simFrame
    }

    // Scan the first lane's trace to trigger rhythmic swap SFX
    const primaryTrace = laneTraces[0] || []
    if (primaryTrace.length === 0) return []

    const totalTimelineFrames = Math.max(
      360,
      Math.ceil((sceneDuration + (quizHook?.enabled ? quizHook.freezeDurationSec || 3.5 : 0)) * fps)
    )
    let lastPlayedFrame = -10

    for (let f = 0; f < totalTimelineFrames; f++) {
      const stepInfo = AlgorithmTraceDriver.getStepAtFrame(
        primaryTrace,
        f,
        fps,
        effectiveSpeed,
        quizHook,
        algoConfig.speedRamp,
        sceneDuration
      )

      const step = stepInfo.step
      if ((step.type === 'swap' || step.type === 'sorted') && f - lastPlayedFrame >= 2) {
        events.push({
          frame: warpFrame(f),
          pitch: step.soundPitch || 0.5,
        })
        lastPlayedFrame = f
      }

      if (stepInfo.isFinished) {
        break
      }
    }

    return events
  }, [algoConfig.soundEnabled, algoConfig.speedRamp, laneTraces, effectiveSpeed, fps, quizHook, sceneDuration])

  // Theme styling definitions
  const themeStyles = {
    'cyber-neon': {
      bg: '#080A0F',
      laneBg: 'rgba(13, 17, 23, 0.7)',
      border: 'rgba(190, 255, 1, 0.2)',
      text: '#F0F6FC',
      subText: '#8B949E',
      accent: '#BEFF01',
      grid: 'rgba(190, 255, 1, 0.05)',
    },
    'matrix-code': {
      bg: '#051009',
      laneBg: 'rgba(10, 25, 15, 0.7)',
      border: 'rgba(0, 255, 102, 0.25)',
      text: '#E0FFE8',
      subText: '#529E65',
      accent: '#00FF66',
      grid: 'rgba(0, 255, 102, 0.05)',
    },
    blueprint: {
      bg: '#0A192F',
      laneBg: 'rgba(15, 30, 55, 0.7)',
      border: 'rgba(56, 189, 248, 0.25)',
      text: '#E0F2FE',
      subText: '#7DD3FC',
      accent: '#38BDF8',
      grid: 'rgba(56, 189, 248, 0.08)',
    },
    chalkboard: {
      bg: '#0F201B',
      laneBg: 'rgba(18, 38, 32, 0.7)',
      border: 'rgba(255, 255, 255, 0.1)',
      text: '#E2E8F0',
      subText: '#94A3B8',
      accent: '#BEFF01',
      grid: 'rgba(255, 255, 255, 0.04)',
    },
    'minimal-dark': {
      bg: '#0F172A',
      laneBg: 'rgba(20, 28, 45, 0.7)',
      border: 'rgba(255, 255, 255, 0.08)',
      text: '#F8FAFC',
      subText: '#94A3B8',
      accent: '#38BDF8',
      grid: 'rgba(255, 255, 255, 0.03)',
    },
  }[theme] || {
    bg: '#080A0F',
    laneBg: 'rgba(13, 17, 23, 0.7)',
    border: 'rgba(190, 255, 1, 0.2)',
    text: '#F0F6FC',
    subText: '#8B949E',
    accent: '#BEFF01',
    grid: 'rgba(190, 255, 1, 0.05)',
  }

  // Freeze Frame Quiz calculations
  const timeSec = frame / fps
  const freezeAt = quizHook?.freezeAtSec ?? 2.0
  const freezeDuration = quizHook?.freezeDurationSec ?? 3.5
  const isQuizActive = Boolean(
    quizHook?.enabled &&
    timeSec >= freezeAt &&
    timeSec < freezeAt + freezeDuration
  )
  const quizElapsed = timeSec - freezeAt
  const isRevealed = quizElapsed >= freezeDuration - 1.0
  const countdownNumber = Math.max(0, Math.ceil(freezeDuration - 1.0 - quizElapsed))

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle}>
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          backgroundColor: themeStyles.bg,
          borderRadius: 14,
          border: `1px solid ${themeStyles.border}`,
          overflow: 'hidden',
          boxShadow: 'var(--shadow-md, 0 8px 32px rgba(0, 0, 0, 0.45))',
          display: 'flex',
          flexDirection: 'column',
          userSelect: 'none',
        }}
      >
        {/* ── 1. The Sound of Sorting Audio Sequences ── */}
        {algoConfig.soundEnabled !== false &&
          allAudioEvents.map((evt, idx) => (
            <Sequence
              key={`algo-sfx-${evt.frame}-${idx}`}
              from={evt.frame}
              durationInFrames={6}
              layout="none"
            >
              <Audio
                src={staticFile('sfx/click.wav')}
                volume={(algoConfig.soundVolume ?? 0.7) * 0.6}
              />
            </Sequence>
          ))}

        {/* ── 2. Quiz Audio Cues ── */}
        {isQuizActive && !isRevealed && quizHook?.sfxEnabled !== false && (
          <Sequence from={Math.round(freezeAt * fps)} durationInFrames={Math.round((freezeDuration - 1.0) * fps)} layout="none">
            <Audio src={staticFile('sfx/clock_tick.wav')} volume={0.65} />
          </Sequence>
        )}
        {quizHook?.enabled && quizHook?.sfxEnabled !== false && (
          <Sequence from={Math.round((freezeAt + freezeDuration - 1.0) * fps)} durationInFrames={20} layout="none">
            <Audio src={staticFile('sfx/ding.wav')} volume={0.75} />
          </Sequence>
        )}

        {/* ── 3. Top Header Ribbon (Clean Studio Single-Row 32px) ── */}
        <div
          style={{
            height: 32,
            padding: '0 12px',
            borderBottom: `1px solid ${themeStyles.border}`,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            zIndex: 10,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                color: themeStyles.accent,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {algoConfig.mode === 'battle'
                ? `ĐẠI CHIẾN THUẬT TOÁN (${arraySize} PHẦN TỬ)`
                : `MÔ PHỎNG THUẬT TOÁN (${arraySize} PHẦN TỬ)`}
            </span>
          </div>

          <div
            style={{
              fontSize: 10,
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              padding: '2px 8px',
              borderRadius: 4,
              color: '#FFFFFF',
              border: `1px solid ${themeStyles.border}`,
              flexShrink: 0,
              fontFamily: 'monospace',
              fontWeight: 600,
            }}
          >
            {initialType === 'reversed' ? 'NGƯỢC 100%' : initialType === 'nearly-sorted' ? 'GẦN SẮP XẾP' : 'NGẪU NHIÊN'}
          </div>
        </div>

        {/* ── 4. Main Simulation Lanes Viewport ── */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            padding: 8,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {lanes.map((lane, laneIdx) => {
            const laneState = laneCurrentSteps[laneIdx]
            const step: AlgorithmTraceStep = laneState?.step || {
              type: 'idle',
              indices: [],
              valuesSnapshot: [],
              metrics: { comparisons: 0, swaps: 0 },
            }
            const isFinished = laneState?.isFinished ?? false
            const values = step.valuesSnapshot.length > 0 ? step.valuesSnapshot : []
            const maxVal = Math.max(1, ...values)

            return (
              <div
                key={`lane-${lane.algorithmId}-${laneIdx}`}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: themeStyles.laneBg,
                  borderRadius: 8,
                  border: `1px solid ${mixColor(lane.accentColor || themeStyles.border, 27)}`,
                  padding: '6px 10px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Lane Header: Title & Live Metrics HUD */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                    zIndex: 2,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: lane.accentColor || themeStyles.accent,
                        letterSpacing: 0.5,
                      }}
                    >
                      {lane.label || lane.definition?.name.toUpperCase()}
                    </span>

                    {isFinished && (
                      <span
                        style={{
                          fontSize: 8.5,
                          fontWeight: 700,
                          backgroundColor: '#BEFF01',
                          color: '#000000',
                          padding: '1px 5px',
                          borderRadius: 3,
                        }}
                      >
                        HOÀN THÀNH
                      </span>
                    )}
                  </div>

                  {algoConfig.showMetricsHUD !== false && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 9,
                        fontFamily: 'monospace',
                        color: themeStyles.subText,
                      }}
                    >
                      <span>
                        SO SÁNH: <strong style={{ color: '#FFFFFF' }}>{step.metrics.comparisons}</strong>
                      </span>
                      <span>
                        ĐỔI CHỖ: <strong style={{ color: lane.accentColor || '#BEFF01' }}>{step.metrics.swaps}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Bars Visualization Canvas (SVG) */}
                <div style={{ flex: 1, width: '100%', position: 'relative' }}>
                  <svg
                    width="100%"
                    height="100%"
                    viewBox={`0 0 ${width - 36} 100`}
                    preserveAspectRatio="none"
                    style={{ width: '100%', height: '100%', display: 'block' }}
                  >
                    <defs>
                      <linearGradient id={`grad-${laneIdx}`} x1="0" y1="1" x2="0" y2="0">
                        <stop offset="0%" stopColor={lane.accentColor || '#00D4FF'} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={lane.accentColor || '#00D4FF'} stopOpacity={0.9} />
                      </linearGradient>

                      <linearGradient id={`grad-sorted-${laneIdx}`} x1="0" y1="1" x2="0" y2="0">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#BEFF01" stopOpacity={1.0} />
                      </linearGradient>
                    </defs>

                    {values.map((val, i) => {
                      const barW = (width - 36) / values.length
                      const barX = i * barW + 1
                      const actualW = Math.max(2, barW - 2)
                      const barH = (val / maxVal) * 88
                      const barY = 96 - barH

                      const isComparing = step.type === 'compare' && step.indices.includes(i)
                      const isSwapping = (step.type === 'swap' || step.type === 'overwrite') && step.indices.includes(i)
                      const isPivot = step.type === 'pivot' && step.indices.includes(i)
                      const isMarkedSorted = step.type === 'sorted' && step.indices.includes(i)

                      // Determine bar fill color
                      let fill = `url(#grad-${laneIdx})`
                      let stroke = lane.accentColor || '#00D4FF'

                      if (isFinished || isMarkedSorted) {
                        fill = `url(#grad-sorted-${laneIdx})`
                        stroke = '#BEFF01'
                      } else if (isSwapping) {
                        fill = '#FF007F' // Magenta
                        stroke = '#FFFFFF'
                      } else if (isComparing) {
                        fill = '#FFE600' // Yellow
                        stroke = '#FFFFFF'
                      } else if (isPivot) {
                        fill = '#A855F7' // Purple
                        stroke = '#FFFFFF'
                      }

                      return (
                        <g key={`bar-${laneIdx}-${i}`}>
                          <rect
                            x={barX}
                            y={barY}
                            width={actualW}
                            height={barH}
                            rx={2}
                            fill={fill}
                            stroke={stroke}
                            strokeWidth={isComparing || isSwapping || isPivot ? 1.5 : 0.5}
                          />
                          {/* Cap light beam on top of each bar */}
                          <rect
                            x={barX}
                            y={barY}
                            width={actualW}
                            height={2}
                            fill="#FFFFFF"
                            opacity={0.8}
                          />
                        </g>
                      )
                    })}
                  </svg>
                </div>
              </div>
            )
          })}

          {/* ── 5. Freeze Frame & Interactive Quiz Hook Overlay ── */}
          {isQuizActive && quizHook && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(5, 7, 10, 0.85)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px 20px',
                zIndex: 40,
                animation: 'fadeIn 0.2s ease-out',
              }}
            >
              {/* Badge & Countdown */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  maxWidth: 320,
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: '#BEFF01',
                    backgroundColor: 'rgba(190, 255, 1, 0.15)',
                    border: '1px solid rgba(190, 255, 1, 0.4)',
                    padding: '3px 8px',
                    borderRadius: 4,
                    letterSpacing: 0.5,
                  }}
                >
                  {quizHook.badge || 'DỰ ĐOÁN THUẬT TOÁN'}
                </div>

                {!isRevealed && (
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 900,
                      color: '#FF6B6B',
                      fontFamily: 'monospace',
                      backgroundColor: 'rgba(255, 107, 107, 0.15)',
                      border: '1px solid rgba(255, 107, 107, 0.4)',
                      padding: '2px 8px',
                      borderRadius: 12,
                    }}
                  >
                    {countdownNumber}s
                  </div>
                )}
              </div>

              {/* Question Text */}
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  textAlign: 'center',
                  lineHeight: 1.45,
                  marginBottom: 12,
                  maxWidth: 320,
                }}
              >
                {quizHook.question}
              </div>

              {/* Options List */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  width: '100%',
                  maxWidth: 320,
                }}
              >
                {quizHook.options.map((opt) => {
                  const isCorrect = isRevealed && opt.id === quizHook.correctAnswer
                  return (
                    <div
                      key={opt.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '7px 12px',
                        borderRadius: 6,
                        backgroundColor: isCorrect ? 'rgba(190, 255, 1, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                        border: isCorrect ? '1.5px solid #BEFF01' : '1px solid rgba(255, 255, 255, 0.12)',
                      }}
                    >
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 9,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                          fontWeight: 800,
                          backgroundColor: isCorrect ? '#BEFF01' : 'rgba(255, 255, 255, 0.15)',
                          color: isCorrect ? '#000000' : '#FFFFFF',
                        }}
                      >
                        {opt.id}
                      </span>
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: isCorrect ? 700 : 500,
                          color: isCorrect ? '#BEFF01' : '#E2E8F0',
                        }}
                      >
                        {opt.text}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Explanation on reveal */}
              {isRevealed && quizHook.explanation && (
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 10,
                    color: '#94A3B8',
                    textAlign: 'center',
                    maxWidth: 320,
                    lineHeight: 1.4,
                  }}
                >
                  {quizHook.explanation}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </RemotionElementWrapper>
  )
}
