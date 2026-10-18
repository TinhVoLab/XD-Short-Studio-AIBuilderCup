import React, { useMemo } from 'react'
import { useCurrentFrame, Audio, Sequence, staticFile } from 'remotion'
import { SceneElement } from '@/types/scene'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { RemotionElementWrapper } from '../core/RemotionElementWrapper'
import { PhysicsRegistry } from './core/PhysicsRegistry'
import { MatterSimulationDriver } from './core/MatterSimulationDriver'
import { Vector2D } from './core/types'

interface PhysicsSimulationElementProps {
  el: SceneElement
  computedStyle?: React.CSSProperties
  positionStyle?: React.CSSProperties
  fps?: number
  sceneDuration?: number
}

export const PhysicsSimulationElement: React.FC<PhysicsSimulationElementProps> = ({
  el,
  positionStyle,
  fps = 30,
  sceneDuration = 10,
}) => {
  const frame = useCurrentFrame()
  const physicsData = el.physicsData || {
    presetId: 'newton-cradle',
    theme: 'chalkboard',
    showVectors: true,
    showTrajectories: true,
    showHUD: true,
    showGrid: true,
    showFormulas: true,
  }

  const presetId = physicsData.presetId || 'newton-cradle'
  const preset = useMemo(() => PhysicsRegistry.getPreset(presetId) || PhysicsRegistry.getPreset('newton-cradle')!, [presetId])

  const width = el.width || 360
  const height = el.height || 420
  const theme = physicsData.theme || 'chalkboard'
  const customParams = physicsData.customParams || {}
  const quizHook = physicsData.quizHook

  // Calculate dynamic effective timeScale (Auto-Fit Scene Duration / Target Time / Manual)
  const effectiveTimeScale = useMemo(() => {
    const naturalDuration = preset.naturalDurationSec || 3.2
    return MatterSimulationDriver.calculateEffectiveTimeScale(
      physicsData,
      sceneDuration,
      naturalDuration
    )
  }, [physicsData, sceneDuration, preset.naturalDurationSec])

  // Obtain deterministic physics snapshot for the current frame (with freeze-frame time warping & timeScale)
  const snapshot = useMemo(() => {
    return MatterSimulationDriver.getSnapshot(
      preset,
      frame,
      fps,
      width,
      height,
      customParams,
      quizHook,
      effectiveTimeScale
    )
  }, [preset, frame, fps, width, height, customParams, quizHook, effectiveTimeScale])

  // Compile LaTeX formula via KaTeX
  const katexHtml = useMemo(() => {
    if (!preset.formulaLatex) return null
    try {
      return katex.renderToString(preset.formulaLatex, {
        throwOnError: false,
        displayMode: false,
      })
    } catch {
      return preset.formulaLatex
    }
  }, [preset.formulaLatex])

  // Pre-calculate all collision audio triggers across the timeline for Remotion Audio Sequences
  const allCollisions = useMemo(() => {
    if (physicsData.sfxConfig?.enabled === false) return []
    const totalSimFrames = Math.max(
      360,
      Math.ceil((sceneDuration + (quizHook?.enabled ? quizHook.freezeDurationSec || 3.5 : 0)) * fps)
    )
    const rawEvents = MatterSimulationDriver.getAllCollisionEvents(
      preset,
      totalSimFrames,
      fps,
      width,
      height,
      customParams,
      effectiveTimeScale
    )
    
    // Convert simulation frame to video timeline frame (Time-Warping for Quiz Freeze)
    const warpFrame = (simFrame: number) => {
      if (!quizHook?.enabled) return simFrame
      const freezeAtFrame = Math.round((quizHook.freezeAtSec || 2.0) * fps)
      const freezeDurationFrames = Math.round((quizHook.freezeDurationSec || 3.0) * fps)
      if (simFrame > freezeAtFrame) {
        return simFrame + freezeDurationFrames
      }
      return simFrame
    }

    // Filter out duplicate sound hits on adjacent frames (< 3 frames apart) to avoid audio stutter
    const filtered: typeof rawEvents = []
    let lastPlayedFrame = -10
    rawEvents.forEach((evt) => {
      if (evt.frame - lastPlayedFrame >= 3) {
        filtered.push({ ...evt, frame: warpFrame(evt.frame) })
        lastPlayedFrame = evt.frame
      }
    })
    return filtered
  }, [preset, fps, width, height, customParams, physicsData.sfxConfig?.enabled, quizHook, effectiveTimeScale, sceneDuration])

  const sfxMasterVolume = physicsData.sfxConfig?.volume ?? 0.8

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

  // Generate zigzag SVG path for harmonic spring constraints
  const getSpringPath = (pA: Vector2D, pB: Vector2D, coils: number = 14, widthR: number = 10): string => {
    const dx = pB.x - pA.x
    const dy = pB.y - pA.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist <= 1) return `M ${pA.x} ${pA.y} L ${pB.x} ${pB.y}`

    const ux = dx / dist
    const uy = dy / dist
    const perpX = -uy
    const perpY = ux

    let path = `M ${pA.x} ${pA.y}`
    const leadIn = 16
    const leadOut = 16
    const activeDist = Math.max(10, dist - leadIn - leadOut)

    const startX = pA.x + ux * leadIn
    const startY = pA.y + uy * leadIn
    path += ` L ${startX} ${startY}`

    // A real spring has coils*2 zig-zag segments
    const points = coils * 2
    for (let i = 1; i <= points; i++) {
      const segFraction = (i - 0.5) / points
      const side = i % 2 === 1 ? 1 : -1
      const midX = startX + ux * (segFraction * activeDist) + perpX * (widthR * side)
      const midY = startY + uy * (segFraction * activeDist) + perpY * (widthR * side)
      path += ` L ${midX} ${midY}`
    }

    const endX = pB.x - ux * leadOut
    const endY = pB.y - uy * leadOut
    path += ` L ${endX} ${endY} L ${pB.x} ${pB.y}`
    return path
  }

  // Theme styling definitions
  const themeStyles = {
    chalkboard: {
      bg: '#0F201B',
      grid: 'rgba(255, 255, 255, 0.05)',
      border: '#1E3A2F',
      text: '#E2E8F0',
      accent: '#BEFF01',
      subText: '#94A3B8',
    },
    blueprint: {
      bg: '#0A192F',
      grid: 'rgba(56, 189, 248, 0.12)',
      border: '#1E3A5F',
      text: '#E0F2FE',
      accent: '#38BDF8',
      subText: '#7DD3FC',
    },
    'cyber-neon': {
      bg: '#080A0F',
      grid: 'rgba(190, 255, 1, 0.08)',
      border: 'rgba(190, 255, 1, 0.25)',
      text: '#F0F6FC',
      accent: '#BEFF01',
      subText: '#8B949E',
    },
    'minimal-dark': {
      bg: '#0F172A',
      grid: 'rgba(255, 255, 255, 0.04)',
      border: '#334155',
      text: '#F8FAFC',
      accent: '#38BDF8',
      subText: '#94A3B8',
    },
    'academic-light': {
      bg: '#F8FAFC',
      grid: 'rgba(0, 0, 0, 0.06)',
      border: '#CBD5E1',
      text: '#0F172A',
      accent: '#2563EB',
      subText: '#64748B',
    },
  }[theme] || {
    bg: '#080A0F',
    grid: 'rgba(255, 255, 255, 0.05)',
    border: '#21262D',
    text: '#F0F6FC',
    accent: '#BEFF01',
    subText: '#8B949E',
  }

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
          boxShadow: 'var(--shadow-md, 0 8px 32px rgba(0,0,0,0.45))',
          display: 'flex',
          flexDirection: 'column',
          userSelect: 'none',
        }}
      >
        {/* ── 1. Auto Mechanical Collision SFX Sequences ── */}
        {physicsData.sfxConfig?.enabled !== false &&
          allCollisions.map((evt, idx) => {
            const soundFile =
              evt.sfxType === 'click'
                ? 'sfx/click.wav'
                : evt.sfxType === 'thud'
                ? 'sfx/thud.wav'
                : 'sfx/pop.wav'
            return (
              <Sequence
                key={`sfx-col-${evt.frame}-${idx}`}
                from={evt.frame}
                durationInFrames={12}
                layout="none"
              >
                <Audio
                  src={staticFile(soundFile)}
                  volume={Math.min(1.0, evt.volume * sfxMasterVolume)}
                />
              </Sequence>
            )
          })}

        {/* ── 2. Quiz Audio Cues (Clock tick & Reveal Ding) ── */}
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

        {/* Top Header & Formula Ribbon (Clean Studio Single-Row) */}
        {physicsData.showFormulas !== false && (
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
                {preset.name}
              </span>
            </div>

            {katexHtml && (
              <div
                style={{
                  fontSize: 11,
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  padding: '2px 8px',
                  borderRadius: 4,
                  color: '#FFFFFF',
                  border: `1px solid ${themeStyles.border}`,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  lineHeight: 1,
                }}
                dangerouslySetInnerHTML={{ __html: katexHtml }}
              />
            )}
          </div>
        )}

        {/* Main Simulation Viewport (SVG Canvas) */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${width} ${height}`}
            style={{ width: '100%', height: '100%', display: 'block' }}
          >
            <defs>
              {physicsData.showGrid !== false && (
                <pattern id={`grid-${el.id}`} width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke={themeStyles.grid} strokeWidth="1" />
                </pattern>
              )}

              <marker id="arrow-red" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#FF4D4D" />
              </marker>
              <marker id="arrow-blue" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#00D4FF" />
              </marker>
              <marker id="arrow-yellow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#FFD700" />
              </marker>
              <marker id="arrow-accent" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 1 L 9 5 L 0 9 z" fill={themeStyles.accent} />
              </marker>

              <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {physicsData.showGrid !== false && (
              <rect width={width} height={height} fill={`url(#grid-${el.id})`} />
            )}

            {/* Trajectory lines */}
            {physicsData.showTrajectories !== false &&
              Object.entries(snapshot.trajectories).map(([bodyId, points]) => {
                if (points.length < 2) return null
                const d = points.reduce((acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '')
                return (
                  <path
                    key={`traj-${bodyId}`}
                    d={d}
                    fill="none"
                    stroke={themeStyles.accent}
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    strokeOpacity={0.65}
                    filter="url(#neonGlow)"
                  />
                )
              })}

            {/* Constraints / Springs */}
            {snapshot.constraints.map((c) => {
              if (c.isSpring) {
                const springD = getSpringPath(c.pointA, c.pointB, 7, 9)
                return (
                  <path
                    key={`constraint-${c.id}`}
                    d={springD}
                    fill="none"
                    stroke={c.stroke || themeStyles.accent}
                    strokeWidth={c.strokeWidth || 2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )
              }
              return (
                <line
                  key={`constraint-${c.id}`}
                  x1={c.pointA.x}
                  y1={c.pointA.y}
                  x2={c.pointB.x}
                  y2={c.pointB.y}
                  stroke={c.stroke || 'rgba(255,255,255,0.4)'}
                  strokeWidth={c.strokeWidth || 1.5}
                  strokeLinecap="round"
                />
              )
            })}

            {/* Physics Rigid Bodies */}
            {snapshot.bodies.map((b) => {
              if (b.shape === 'circle' && b.radius) {
                return (
                  <g key={`body-${b.id}`} transform={`translate(${b.position.x}, ${b.position.y}) rotate(${(b.angle * 180) / Math.PI})`}>
                    <circle
                      r={b.radius}
                      fill={b.fill}
                      stroke={b.stroke}
                      strokeWidth={b.strokeWidth}
                    />
                    <circle
                      cx={-b.radius * 0.35}
                      cy={-b.radius * 0.35}
                      r={b.radius * 0.3}
                      fill="rgba(255, 255, 255, 0.4)"
                    />
                  </g>
                )
              }

              if (b.vertices && b.vertices.length > 0) {
                const ptsStr = b.vertices.map((v) => `${v.x},${v.y}`).join(' ')
                return (
                  <polygon
                    key={`body-${b.id}`}
                    points={ptsStr}
                    fill={b.fill}
                    stroke={b.stroke}
                    strokeWidth={b.strokeWidth}
                  />
                )
              }

              if (b.width && b.height) {
                return (
                  <g key={`body-${b.id}`} transform={`translate(${b.position.x}, ${b.position.y}) rotate(${(b.angle * 180) / Math.PI})`}>
                    <rect
                      x={-b.width / 2}
                      y={-b.height / 2}
                      width={b.width}
                      height={b.height}
                      rx={4}
                      fill={b.fill}
                      stroke={b.stroke}
                      strokeWidth={b.strokeWidth}
                    />
                  </g>
                )
              }

              return null
            })}

            {/* Real-time Force Vectors */}
            {physicsData.showVectors !== false &&
              snapshot.forceVectors.map((v) => {
                const targetX = v.origin.x + v.vector.x
                const targetY = v.origin.y + v.vector.y
                const markerId =
                  v.color === '#FF4D4D'
                    ? 'url(#arrow-red)'
                    : v.color === '#00D4FF'
                    ? 'url(#arrow-blue)'
                    : v.color === '#FFD700'
                    ? 'url(#arrow-yellow)'
                    : 'url(#arrow-accent)'

                return (
                  <g key={`vec-${v.id}`}>
                    <line
                      x1={v.origin.x}
                      y1={v.origin.y}
                      x2={targetX}
                      y2={targetY}
                      stroke={v.color}
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      markerEnd={markerId}
                    />
                    {(() => {
                      const isLeft = v.vector.x < -2
                      const textAnchor = isLeft ? 'end' : 'start'
                      const textX = isLeft ? targetX - 6 : targetX + 6
                      const textY = targetY - 4
                      return (
                        <text
                          x={textX}
                          y={textY}
                          textAnchor={textAnchor}
                          fill={v.color}
                          fontSize="9.5"
                          fontWeight="700"
                          fontFamily="system-ui, sans-serif"
                          paintOrder="stroke"
                          // Halo tối dày: nhãn vector thường nằm đè lên chính quả cầu cùng màu → cần nền đệm đặc
                          stroke="rgba(8, 10, 15, 0.92)"
                          strokeWidth="5"
                          strokeLinejoin="round"
                        >
                          {v.label} {v.unitValue ? `(${v.unitValue})` : ''}
                        </text>
                      )
                    })()}
                  </g>
                )
              })}

            {/* Annotations / Pins */}
            {snapshot.annotations?.map((ann, idx) => (
              <text
                key={`ann-${idx}`}
                x={ann.x}
                y={ann.y}
                textAnchor={ann.anchor || 'middle'}
                fill={ann.color || themeStyles.accent}
                fontSize={ann.fontSize || 10}
                fontWeight="700"
                fontFamily="system-ui, sans-serif"
                paintOrder="stroke"
                stroke="rgba(8, 10, 15, 0.85)"
                strokeWidth="2.5"
                strokeLinejoin="round"
              >
                {ann.text}
              </text>
            ))}
          </svg>

          {/* Live Harmonic Wave Chart Overlay */}
          {snapshot.liveChart && (
            <div
              style={{
                position: 'absolute',
                left: 12,
                bottom: 12,
                width: 170,
                height: 80,
                backgroundColor: 'rgba(13, 17, 23, 0.85)',
                border: `1px solid ${themeStyles.border}`,
                borderRadius: 8,
                padding: '6px 8px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ fontSize: 8.5, fontWeight: 700, color: themeStyles.accent, marginBottom: 2 }}>
                {snapshot.liveChart.title || 'LIVE WAVEFORM'}
              </div>
              <svg width="100%" height="100%" viewBox="0 0 150 50">
                <line x1="0" y1="25" x2="150" y2="25" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="2 2" />
                {snapshot.liveChart.points.length > 1 && (
                  <polyline
                    fill="none"
                    stroke={snapshot.liveChart.color || '#BEFF01'}
                    strokeWidth="1.8"
                    points={snapshot.liveChart.points
                      .map((p, idx) => {
                        const px = (idx / Math.max(1, snapshot.liveChart!.points.length - 1)) * 150
                        const py = 25 - (p.y / (snapshot.liveChart!.maxY || 100)) * 20
                        return `${px},${py}`
                      })
                      .join(' ')}
                  />
                )}
              </svg>
            </div>
          )}

          {/* Live Telemetry HUD Matrix */}
          {physicsData.showHUD !== false && snapshot.telemetry.length > 0 && (
            <div
              style={{
                position: 'absolute',
                right: 10,
                bottom: physicsData.showFormulas !== false && preset.formulaExplanation ? 36 : 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                backgroundColor: 'rgba(13, 17, 23, 0.88)',
                border: `1px solid ${themeStyles.border}`,
                borderRadius: 7,
                padding: '5px 8px',
                minWidth: 105,
                zIndex: 6,
              }}
            >
              {snapshot.telemetry.map((met, idx) => (
                <div
                  key={`telemetry-${idx}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 9,
                  }}
                >
                  <span style={{ color: themeStyles.subText, fontWeight: 500 }}>{met.label}:</span>
                  <span
                    style={{
                      color: met.color || (met.highlight ? themeStyles.accent : themeStyles.text),
                      fontWeight: met.highlight ? 800 : 600,
                      fontFamily: 'monospace',
                    }}
                  >
                    {met.value} {met.unit || ''}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Subtle Educational Caption Note (Non-intrusive full-width bottom bar) */}
          {physicsData.showFormulas !== false && preset.formulaExplanation && (
            <div
              style={{
                position: 'absolute',
                bottom: 8,
                left: 10,
                right: 10,
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(10, 14, 22, 0.85)',
                border: `1px solid ${themeStyles.border}`,
                borderRadius: 6,
                padding: '3px 8px',
                fontSize: 9.5,
                color: themeStyles.subText,
                pointerEvents: 'none',
                zIndex: 5,
              }}
              title={preset.formulaExplanation}
            >
              <span style={{ color: themeStyles.accent, fontWeight: 700, marginRight: 6, flexShrink: 0 }}>Ý NGHĨA:</span>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {preset.formulaExplanation}
              </span>
            </div>
          )}

          {/* ── 3. Freeze Frame & Interactive Quiz Hook Overlay ── */}
          {isQuizActive && quizHook && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(5, 7, 10, 0.82)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px 20px',
                zIndex: 40,
                animation: 'fadeIn 0.2s ease-out',
              }}
            >
              {/* Badge & Timer Header */}
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
                  {quizHook.badge || 'DỰ ĐOÁN HIỆN TƯỢNG'}
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
                  gap: (quizHook.options || []).length === 2 ? 8 : 6,
                  width: '100%',
                  maxWidth: 320,
                }}
              >
                {quizHook.options.map((opt) => {
                  const isCorrect = isRevealed && opt.id === quizHook.correctAnswer
                  const isTwo = (quizHook.options || []).length === 2
                  return (
                    <div
                      key={opt.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: isTwo ? '9px 14px' : '6px 12px',
                        borderRadius: 6,
                        backgroundColor: isCorrect ? 'rgba(190, 255, 1, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                        border: isCorrect
                          ? '1.5px solid #BEFF01'
                          : '1px solid rgba(255, 255, 255, 0.12)',
                        boxShadow: isCorrect ? '0 0 12px rgba(190, 255, 1, 0.3)' : 'none',
                      }}
                    >
                      <span
                        style={{
                          width: isTwo ? 22 : 18,
                          height: isTwo ? 22 : 18,
                          borderRadius: isTwo ? 11 : 9,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: isTwo ? 11 : 10,
                          fontWeight: 800,
                          backgroundColor: isCorrect ? '#BEFF01' : 'rgba(255, 255, 255, 0.15)',
                          color: isCorrect ? '#000000' : '#FFFFFF',
                          flexShrink: 0,
                        }}
                      >
                        {opt.id}
                      </span>
                      <span
                        style={{
                          fontSize: isTwo ? 12.5 : 11.5,
                          fontWeight: isCorrect ? 700 : 500,
                          color: isCorrect ? '#BEFF01' : '#E2E8F0',
                          flex: 1,
                          textAlign: 'left',
                          lineHeight: 1.35,
                        }}
                      >
                        {opt.text}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Explanation note when revealed */}
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
