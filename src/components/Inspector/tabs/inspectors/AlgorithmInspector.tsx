import React, { useMemo } from 'react'
import styles from './StemInspector.module.css'
import { InspectorProps, Slider, Toggle, ToggleRow } from './common'
import { SectionHeader, FormGroup, Select, SegmentedControl } from '@/components/ui'
import { AlgorithmRegistry } from '@/remotion/elements/algorithms/core/AlgorithmRegistry'
import { AlgorithmTraceDriver } from '@/remotion/elements/algorithms/core/AlgorithmTraceDriver'
import { AlgorithmSimulationConfig } from '@/remotion/elements/algorithms/core/types'

export interface AlgorithmInspectorProps extends InspectorProps {
  sceneDuration?: number
}

export function AlgorithmInspector({ element, updateElement, sceneDuration = 10 }: AlgorithmInspectorProps) {
  const algoData: AlgorithmSimulationConfig = element.algorithmData || {
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

  const allScenarios = AlgorithmRegistry.getAllScenarios()
  // Determine current active scenario ID
  let currentScenarioId = 'quick-vs-bubble'
  if (algoData.mode === 'single') {
    currentScenarioId = algoData.algorithmId === 'merge-sort' ? 'single-merge-sort' : 'single-quick-sort'
  } else if (algoData.battleLanes && algoData.battleLanes.length === 3) {
    currentScenarioId = 'trio-battle'
  } else if (algoData.battleLanes && algoData.battleLanes[0]?.algorithmId === 'insertion-sort') {
    currentScenarioId = 'insertion-vs-selection'
  }

  const activeScenario = AlgorithmRegistry.getScenario(currentScenarioId) || allScenarios[0]

  // Compute trace length among active lanes to show live studio speed in UI
  const laneTraces = useMemo(() => {
    const arraySize = algoData.arraySize || 24
    const initialType = algoData.initialType || 'random'
    const seed = algoData.seed || 42
    if (algoData.mode === 'single') {
      const algoId = algoData.algorithmId || 'quick-sort'
      const def = AlgorithmRegistry.getAlgorithm(algoId)
      return def ? [AlgorithmTraceDriver.getTrace(def, arraySize, initialType, seed)] : []
    }
    const battleLanes = algoData.battleLanes || []
    return battleLanes.map((lane) => {
      const def = AlgorithmRegistry.getAlgorithm(lane.algorithmId)
      return def ? AlgorithmTraceDriver.getTrace(def, arraySize, initialType, seed) : []
    })
  }, [algoData.mode, algoData.algorithmId, algoData.battleLanes, algoData.arraySize, algoData.initialType, algoData.seed])

  const maxSteps = Math.max(1, ...laneTraces.map((t) => t.length))
  const effectiveMultiplier = AlgorithmTraceDriver.calculateEffectiveSpeed(
    algoData,
    sceneDuration,
    maxSteps,
    30
  )

  const quizHook = algoData.quizHook || {
    enabled: false,
    freezeAtSec: 2.0,
    freezeDurationSec: 3.5,
    badge: 'DỰ ĐOÁN THUẬT TOÁN',
    question: 'Thuật toán nào sẽ hoàn thành sắp xếp trước?',
    options: [
      { id: 'A', text: 'Quick Sort (Màu Xanh)' },
      { id: 'B', text: 'Bubble Sort (Màu Đỏ)' },
    ],
    correctAnswer: 'A',
    explanation: 'Quick Sort có độ phức tạp O(n log n) nhanh gấp hàng chục lần Bubble Sort O(n²)!',
    sfxEnabled: true,
  }

  const updateAlgo = (patch: Partial<AlgorithmSimulationConfig>) => {
    AlgorithmTraceDriver.clearCache()
    updateElement(element.id, {
      algorithmData: {
        ...algoData,
        ...patch,
      },
    })
  }

  const updateQuiz = (patch: Partial<typeof quizHook>) => {
    AlgorithmTraceDriver.clearCache()
    updateAlgo({
      quizHook: {
        ...quizHook,
        ...patch,
      },
    })
  }

  const handleSelectScenario = (scenId: string) => {
    const scen = AlgorithmRegistry.getScenario(scenId)
    if (!scen) return
    updateAlgo({
      mode: scen.mode,
      algorithmId: scen.algorithmId,
      battleLanes: scen.battleLanes,
      arraySize: scen.defaultArraySize || algoData.arraySize || 24,
      speedMultiplier: scen.defaultSpeed || algoData.speedMultiplier || 1.0,
    })
  }

  const themeOptions = [
    { value: 'cyber-neon', label: 'Cyber Neon' },
    { value: 'matrix-code', label: 'Matrix Code' },
    { value: 'blueprint', label: 'Bản vẽ Kỹ thuật' },
    { value: 'chalkboard', label: 'Bảng phấn' },
    { value: 'minimal-dark', label: 'Studio Dark' },
  ]

  const initialTypeOptions = [
    { value: 'random', label: 'Ngẫu nhiên' },
    { value: 'reversed', label: 'Đảo ngược 100%' },
    { value: 'nearly-sorted', label: 'Gần sắp xếp' },
  ]

  return (
    <div className={styles.container}>
      <SectionHeader
        title="Mô phỏng thuật toán"
        badge={<span className={`${styles.badge} ${styles.badgeMath}`}>CS TRACE 60FPS</span>}
      />

      {/* Scenario Selector */}
      <FormGroup label="Kịch bản">
        <Select
          value={currentScenarioId}
          onChange={(val) => handleSelectScenario(val)}
          options={allScenarios.map((s) => ({
            value: s.id,
            label: s.name,
          }))}
        />
      </FormGroup>

      {/* Scenario Description Note */}
      <div
        style={{
          fontSize: 11,
          color: 'var(--text-sub)',
          backgroundColor: 'var(--surface-2)',
          padding: '8px 10px',
          borderRadius: 6,
          border: '1px solid var(--border)',
          lineHeight: 1.45,
          marginBottom: 12,
        }}
      >
        <div style={{ color: 'var(--accent)', fontWeight: 600, marginBottom: 2 }}>
          {activeScenario.name}
        </div>
        {activeScenario.description}
      </div>

      {/* Initial Array Type */}
      <FormGroup label="Mảng ban đầu">
        <SegmentedControl
          value={algoData.initialType || 'random'}
          onChange={(val) => updateAlgo({ initialType: val as any })}
          options={initialTypeOptions}
          size="sm"
        />
      </FormGroup>

      {/* Theme Selector */}
      <FormGroup label="Chủ đề" tooltip="Phong cách giao diện mô phỏng thuật toán">
        <SegmentedControl
          value={algoData.theme || 'cyber-neon'}
          onChange={(val) => updateAlgo({ theme: val as any })}
          options={themeOptions}
          size="sm"
        />
      </FormGroup>

      {/* ── TIMING & SPEED CONTROL (AUTO-FIT SCENE) ── */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 12 }}>
        <SectionHeader
          title="Tốc độ & điều phối thời gian"
          badge={<span className={`${styles.badge} ${styles.badgeMath}`}>AUTO-FIT</span>}
        />

        <FormGroup label="Chế độ điều tốc">
          <SegmentedControl
            value={algoData.speedMode || 'auto-fit'}
            onChange={(val) => updateAlgo({ speedMode: val as any })}
            options={[
              { value: 'auto-fit', label: 'Khớp cảnh' },
              { value: 'target-time', label: 'Mốc giây' },
              { value: 'manual', label: 'Thủ công' },
            ]}
            size="sm"
          />
        </FormGroup>

        {(!algoData.speedMode || algoData.speedMode === 'auto-fit') && (
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-sub)',
              backgroundColor: 'var(--surface-2)',
              padding: '8px 10px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              lineHeight: 1.45,
              marginBottom: 10,
            }}
          >
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Tự động khớp thời lượng cảnh: </span>
            Thuật toán ({maxSteps} bước) tự động co giãn để kết thúc và quét dải chiến thắng ở giây thứ{' '}
            <strong style={{ color: '#FFFFFF' }}>{(sceneDuration - 1.0).toFixed(1)}s</strong> trong cảnh{' '}
            <strong style={{ color: '#FFFFFF' }}>{sceneDuration.toFixed(1)}s</strong>.
            <div style={{ marginTop: 4, color: 'var(--text-muted)' }}>
              Tốc độ tính toán: <strong style={{ color: 'var(--accent)' }}>{effectiveMultiplier.toFixed(2)}x</strong>
            </div>
          </div>
        )}

        {algoData.speedMode === 'target-time' && (
          <>
            <Slider
              label="Thời điểm hoàn thành (giây)"
              min={1.5}
              max={Math.max(3.0, sceneDuration - 0.5)}
              step={0.5}
              value={algoData.targetFinishSec || Math.min(sceneDuration - 1.0, 5.0)}
              display={(v) => `${v.toFixed(1)}s`}
              onChange={(v) => updateAlgo({ targetFinishSec: v })}
            />
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-sub)',
                backgroundColor: 'var(--surface-2)',
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                lineHeight: 1.4,
                marginBottom: 10,
              }}
            >
              Tốc độ tính toán tương ứng: <strong style={{ color: 'var(--accent)' }}>{effectiveMultiplier.toFixed(2)}x</strong>
            </div>
          </>
        )}

        {algoData.speedMode === 'manual' && (
          <Slider
            label="Tốc độ"
            min={0.25}
            max={4.0}
            step={0.25}
            value={algoData.speedMultiplier || 1.0}
            display={(v) => `${v.toFixed(2)}x`}
            onChange={(v) => updateAlgo({ speedMultiplier: v })}
          />
        )}

        <ToggleRow label="Gia tốc">
          <Toggle
            checked={algoData.speedRamp === true}
            onChange={(v: boolean) => updateAlgo({ speedRamp: v })}
          />
        </ToggleRow>
      </div>

      {/* ── ALGORITHM DATA PARAMETERS ── */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 12 }}>
        <SectionHeader title="Tham số dữ liệu" />

        <Slider
          label="Số lượng phần tử N"
          min={12}
          max={48}
          step={2}
          value={algoData.arraySize || 24}
          display={(v) => `${v} cột`}
          onChange={(v) => updateAlgo({ arraySize: v })}
        />

        <Slider
          label="Mã ngẫu nhiên"
          min={1}
          max={99}
          step={1}
          value={algoData.seed || 42}
          display={(v) => `#${v}`}
          onChange={(v) => updateAlgo({ seed: v })}
        />
      </div>

      {/* ── SOUND OF SORTING (AUDIO) ── */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 12 }}>
        <SectionHeader title="Âm thanh thuật toán" />

        <ToggleRow label="Âm thanh nốt nhạc">
          <Toggle
            checked={algoData.soundEnabled !== false}
            onChange={(v: boolean) => updateAlgo({ soundEnabled: v })}
          />
        </ToggleRow>

        {algoData.soundEnabled !== false && (
          <Slider
            label="Âm lượng nốt nhạc"
            min={0.1}
            max={1.0}
            step={0.05}
            value={algoData.soundVolume ?? 0.7}
            display={(v) => `${Math.round(v * 100)}%`}
            onChange={(v) => updateAlgo({ soundVolume: v })}
          />
        )}
      </div>

      {/* ── FREEZE FRAME & QUIZ HOOK ── */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 12 }}>
        <SectionHeader title="Dừng hình đố vui (Quiz Hook)" />

        <ToggleRow label="Kích hoạt dừng hình đố vui">
          <Toggle
            checked={quizHook.enabled === true}
            onChange={(v: boolean) => updateQuiz({ enabled: v })}
          />
        </ToggleRow>

        {quizHook.enabled && (
          <>
            <Slider
              label="Điểm dừng"
              min={0.5}
              max={6.0}
              step={0.5}
              value={quizHook.freezeAtSec || 2.0}
              display={(v) => `${v}s`}
              onChange={(v) => updateQuiz({ freezeAtSec: v })}
            />

            <Slider
              label="Thời gian đếm"
              min={2.0}
              max={6.0}
              step={0.5}
              value={quizHook.freezeDurationSec || 3.5}
              display={(v) => `${v}s`}
              onChange={(v) => updateQuiz({ freezeDurationSec: v })}
            />

            <FormGroup label="Câu hỏi đố">
              <input
                type="text"
                className={styles.input}
                value={quizHook.question}
                placeholder="VD: Thuật toán nào sẽ hoàn thành trước?"
                onChange={(e) => updateQuiz({ question: e.target.value })}
              />
            </FormGroup>

            <FormGroup label="Lựa chọn A">
              <input
                type="text"
                className={styles.input}
                value={quizHook.options[0]?.text || ''}
                onChange={(e) => {
                  const nextOpts = [...quizHook.options]
                  nextOpts[0] = { id: 'A', text: e.target.value }
                  updateQuiz({ options: nextOpts })
                }}
              />
            </FormGroup>

            <FormGroup label="Lựa chọn B">
              <input
                type="text"
                className={styles.input}
                value={quizHook.options[1]?.text || ''}
                onChange={(e) => {
                  const nextOpts = [...quizHook.options]
                  nextOpts[1] = { id: 'B', text: e.target.value }
                  updateQuiz({ options: nextOpts })
                }}
              />
            </FormGroup>

            <FormGroup label="Đáp án đúng">
              <Select
                value={quizHook.correctAnswer}
                onChange={(val) => updateQuiz({ correctAnswer: val })}
                options={[
                  { value: 'A', label: 'Đáp án A' },
                  { value: 'B', label: 'Đáp án B' },
                ]}
              />
            </FormGroup>

            <FormGroup label="Giải thích">
              <input
                type="text"
                className={styles.input}
                value={quizHook.explanation || ''}
                placeholder="Lời giải thích ngắn sau khi chuông reo..."
                onChange={(e) => updateQuiz({ explanation: e.target.value })}
              />
            </FormGroup>
          </>
        )}
      </div>

      {/* ── VISUAL LAYERS TOGGLE ── */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 12 }}>
        <SectionHeader title="Lớp hiển thị" />

        <ToggleRow label="Bảng đếm phép toán">
          <Toggle
            checked={algoData.showMetricsHUD !== false}
            onChange={(v: boolean) => updateAlgo({ showMetricsHUD: v })}
          />
        </ToggleRow>
      </div>
    </div>
  )
}
