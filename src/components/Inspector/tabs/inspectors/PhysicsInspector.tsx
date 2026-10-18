import React from 'react'
import styles from './StemInspector.module.css'
import { InspectorProps, Slider, Toggle, ToggleRow, DeleteIconButton } from './common'
import { SectionHeader, FormGroup, Select, SegmentedControl } from '@/components/ui'
import { PhysicsRegistry } from '@/remotion/elements/physics/core/PhysicsRegistry'
import { MatterSimulationDriver } from '@/remotion/elements/physics/core/MatterSimulationDriver'

export interface PhysicsInspectorProps extends InspectorProps {
  sceneDuration?: number
}

export function PhysicsInspector({ element, updateElement, sceneDuration = 10 }: PhysicsInspectorProps) {
  const physicsData = element.physicsData || {
    presetId: 'newton-cradle',
    theme: 'chalkboard',
    showVectors: true,
    showTrajectories: true,
    showHUD: true,
    showGrid: true,
    showFormulas: true,
    customParams: {},
  }

  const presetId = physicsData.presetId || 'newton-cradle'
  const preset = PhysicsRegistry.getPreset(presetId) || PhysicsRegistry.getPreset('newton-cradle')!
  const params = { ...preset.defaultParams, ...physicsData.customParams }
  const sfxConfig = physicsData.sfxConfig || { enabled: true, volume: 0.8 }
  const quizHook = physicsData.quizHook || {
    enabled: false,
    freezeAtSec: 2.0,
    freezeDurationSec: 3.5,
    badge: 'DỰ ĐOÁN HIỆN TƯỢNG',
    question: 'Quả cầu số mấy sẽ bị văng lên?',
    options: [
      { id: 'A', text: 'Chỉ quả số 5 văng lên' },
      { id: 'B', text: 'Cả 4 quả còn lại văng lên' },
      { id: 'C', text: 'Tất cả đứng yên' },
      { id: 'D', text: 'Quả số 1 bật ngược lại' },
    ],
    correctAnswer: 'A',
    explanation: 'Theo định luật bảo toàn động lượng p và động năng, xung lực truyền nguyên vẹn sang quả số 5.',
    sfxEnabled: true,
  }

  const updatePhysics = (patch: Partial<typeof physicsData>) => {
    MatterSimulationDriver.clearCache(presetId)
    updateElement(element.id, {
      physicsData: {
        ...physicsData,
        ...patch,
      },
    })
  }

  const updateParam = (key: string, val: any) => {
    MatterSimulationDriver.clearCache(presetId)
    updateElement(element.id, {
      physicsData: {
        ...physicsData,
        customParams: {
          ...params,
          [key]: val,
        },
      },
    })
  }

  const updateQuiz = (patch: Partial<typeof quizHook>) => {
    MatterSimulationDriver.clearCache(presetId)
    updatePhysics({
      quizHook: {
        ...quizHook,
        ...patch,
      },
    })
  }

  const allPresets = PhysicsRegistry.getAllPresets()

  const themeOptions = [
    { value: 'chalkboard', label: 'Bảng phấn' },
    { value: 'blueprint', label: 'Bản vẽ Kỹ thuật' },
    { value: 'cyber-neon', label: 'Cyber Neon' },
    { value: 'minimal-dark', label: 'Studio Dark' },
    { value: 'academic-light', label: 'Giấy vở' },
  ]

  return (
    <div className={styles.container}>
      <SectionHeader
        first
        title="Mô phỏng vật lý 2D"
        badge={<span className={`${styles.badge} ${styles.badgeMath}`}>MATTER.JS 60FPS</span>}
      />

      {/* Preset Selector */}
      <FormGroup label="Kịch bản Vật lý & Khoa học" tooltip="Lựa chọn mô hình hiện tượng vật lý hoặc thí nghiệm khoa học theo chuẩn Matter.js 60FPS">
        <Select
          value={presetId}
          onChange={val => {
            const nextPreset = PhysicsRegistry.getPreset(val)
            updatePhysics({
              presetId: val as any,
              customParams: nextPreset ? { ...nextPreset.defaultParams } : {},
            })
          }}
          options={allPresets.map(p => ({
            value: p.id,
            label: p.name,
          }))}
        />
      </FormGroup>

      {/* Preset Description / Info Note */}
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
          {preset.formulaLatex ? `Công thức: ${preset.formulaLatex}` : preset.name}
        </div>
        {preset.description}
      </div>

      {/* Theme Selector */}
      <FormGroup label="Chủ đề" tooltip="Phong cách giao diện mô phỏng: Bảng phấn, Tối giản, hoặc Tương lai">
        <SegmentedControl
          value={physicsData.theme || 'chalkboard'}
          onChange={val => updatePhysics({ theme: val as any })}
          options={themeOptions}
          size="sm"
        />
      </FormGroup>

      {/* ── TIMING & SPEED CONTROL (AUTO-FIT SCENE) ── */}
      <SectionHeader
        title="Tốc độ & điều phối thời gian"
        badge={<span className={`${styles.badge} ${styles.badgePhysics}`}>AUTO-FIT</span>}
      />

        <FormGroup
          label="Chế độ điều tốc"
          tooltip={
            physicsData.speedMode === 'manual'
              ? 'Tùy chỉnh hệ số tốc độ thời gian (timeScale) theo ý muốn'
              : physicsData.speedMode === 'target-time'
              ? 'Cố định mốc giây hoàn thành mô phỏng'
              : `Tự động co giãn để mô phỏng hoàn thành ở giây ${(sceneDuration - 1.0).toFixed(1)}s trong cảnh ${sceneDuration.toFixed(1)}s`
          }
        >
          <SegmentedControl
            value={physicsData.speedMode || 'auto-fit'}
            onChange={val => updatePhysics({ speedMode: val as any })}
            options={[
              { value: 'auto-fit', label: 'Khớp cảnh' },
              { value: 'target-time', label: 'Mốc giây' },
              { value: 'manual', label: 'Thủ công' },
            ]}
            size="sm"
          />
        </FormGroup>

        {physicsData.speedMode === 'target-time' && (
          <Slider
            label="Thời điểm hoàn thành (giây)"
            min={1.5}
            max={Math.max(3.0, sceneDuration)}
            step={0.5}
            value={physicsData.targetFinishSec || Math.min(sceneDuration - 1.0, 5.0)}
            display={v => `${v.toFixed(1)}s`}
            onChange={v => updatePhysics({ targetFinishSec: v })}
          />
        )}

        {physicsData.speedMode === 'manual' && (
          <Slider
            label="Hệ số tốc độ thời gian (timeScale)"
            min={0.2}
            max={3.0}
            step={0.1}
            value={physicsData.timeScale || 1.0}
            display={v => `${v.toFixed(1)}x`}
            onChange={v => updatePhysics({ timeScale: v })}
          />
        )}

      {/* ── PRESET SPECIFIC CONTROLS ── */}
      <SectionHeader title="Tham số động học" />

        {/* 1. Newton Cradle */}
        {presetId === 'newton-cradle' && (
          <>
            <Slider
              label="Số lượng quả cầu"
              min={3}
              max={7}
              step={1}
              value={params.ballCount || 5}
              display={v => `${v} bi`}
              onChange={v => updateParam('ballCount', v)}
            />

            <Slider
              label="Số bi kéo ban đầu"
              min={1}
              max={Math.min(3, Math.floor((params.ballCount || 5) / 2))}
              step={1}
              value={params.liftCount || 1}
              display={v => `${v} bi`}
              onChange={v => updateParam('liftCount', v)}
            />

            <Slider
              label="Góc kéo ban đầu"
              min={15}
              max={75}
              step={5}
              value={params.liftAngleDeg || 45}
              display={v => `${v}°`}
              onChange={v => updateParam('liftAngleDeg', v)}
            />

            <Slider
              label="Hệ số đàn hồi (e)"
              min={0.5}
              max={1.0}
              step={0.01}
              value={params.restitution ?? 0.99}
              display={v => v.toFixed(2)}
              onChange={v => updateParam('restitution', v)}
            />
          </>
        )}

        {/* 2. Inclined Plane */}
        {presetId === 'inclined-plane' && (
          <>
            <Slider
              label="Góc dốc nghiêng α"
              min={10}
              max={60}
              step={1}
              value={params.inclineAngleDeg || 30}
              display={v => `${v}°`}
              onChange={v => updateParam('inclineAngleDeg', v)}
            />

            <Slider
              label="Hệ số ma sát μ"
              min={0.0}
              max={0.6}
              step={0.01}
              value={params.friction ?? 0.15}
              display={v => v.toFixed(2)}
              onChange={v => updateParam('friction', v)}
            />

            <Slider
              label="Khối lượng vật m"
              min={1}
              max={50}
              step={1}
              value={params.boxMass || 10}
              display={v => `${v} kg`}
              onChange={v => updateParam('boxMass', v)}
            />
          </>
        )}

        {/* 3. Projectile Motion */}
        {presetId === 'projectile-motion' && (
          <>
            <Slider
              label="Vận tốc ban đầu v₀"
              min={6}
              max={24}
              step={1}
              value={params.launchVelocity || 14}
              display={v => `${v} m/s`}
              onChange={v => updateParam('launchVelocity', v)}
            />

            <Slider
              label="Góc bắn α"
              min={15}
              max={80}
              step={5}
              value={params.launchAngleDeg || 55}
              display={v => `${v}°`}
              onChange={v => updateParam('launchAngleDeg', v)}
            />

            <Slider
              label="Gia tốc trọng trường g"
              min={0.2}
              max={2.0}
              step={0.1}
              value={params.gravityY || 0.8}
              display={v => `${v.toFixed(1)} m/s²`}
              onChange={v => updateParam('gravityY', v)}
            />
          </>
        )}

        {/* 4. Spring Harmonic */}
        {presetId === 'spring-harmonic' && (
          <>
            <Slider
              label="Độ cứng lò xo k"
              min={5}
              max={60}
              step={1}
              value={params.springK ?? 20}
              display={v => `${v} N/m`}
              onChange={v => updateParam('springK', v)}
            />

            <Slider
              label="Khối lượng vật m"
              min={0.5}
              max={4.0}
              step={0.5}
              value={params.mass ?? 1.0}
              display={v => `${v.toFixed(1)} kg`}
              onChange={v => updateParam('mass', v)}
            />

            <Slider
              label="Biên độ dao động A"
              min={20}
              max={80}
              step={5}
              value={params.amplitude ?? 50}
              display={v => `${v} px`}
              onChange={v => updateParam('amplitude', v)}
            />

            <Slider
              label="Lực cản ma sát γ"
              min={0.0}
              max={0.12}
              step={0.01}
              value={params.damping ?? 0.03}
              display={v => v === 0 ? '0 (Không cản / Lý tưởng)' : v.toFixed(2)}
              onChange={v => updateParam('damping', v)}
            />
          </>
        )}

        {/* 5. Bouncing Box Viral */}
        {presetId === 'bouncing-box-viral' && (
          <>
            <Slider
              label="Số lượng quả bóng N"
              min={5}
              max={45}
              step={1}
              value={params.ballCount || 20}
              display={v => `${v} quả`}
              onChange={v => updateParam('ballCount', v)}
            />

            <Slider
              label="Hệ số nảy e"
              min={0.7}
              max={1.0}
              step={0.01}
              value={params.restitution ?? 0.98}
              display={v => v.toFixed(2)}
              onChange={v => updateParam('restitution', v)}
            />

            <ToggleRow label="Cánh quạt xoay ở giữa">
              <Toggle
                checked={params.hasSpinner !== false}
                onChange={v => updateParam('hasSpinner', v)}
              />
            </ToggleRow>
          </>
        )}

        {/* 6. Galileo Falling Battle */}
        {presetId === 'galileo-fall' && (
          <>
            <Slider
              label="Lực cản không khí k"
              min={0.01}
              max={0.1}
              step={0.005}
              value={params.dragCoefficient || 0.04}
              display={v => v.toFixed(3)}
              onChange={v => updateParam('dragCoefficient', v)}
            />

            <Slider
              label="Trọng trường g"
              min={0.5}
              max={2.0}
              step={0.1}
              value={params.gravityY || 1.0}
              display={v => `${v.toFixed(1)} m/s²`}
              onChange={v => updateParam('gravityY', v)}
            />
          </>
        )}

        {/* 7. Launch Angle Battle */}
        {presetId === 'angle-battle' && (
          <>
            <Slider
              label="Vận tốc bắn chung v₀"
              min={8}
              max={22}
              step={1}
              value={params.launchVelocity || 15}
              display={v => `${v} m/s`}
              onChange={v => updateParam('launchVelocity', v)}
            />
          </>
        )}

        {/* 8. Friction Battle */}
        {presetId === 'friction-battle' && (
          <>
            <Slider
              label="Góc nghiêng chung α"
              min={15}
              max={55}
              step={1}
              value={params.inclineAngleDeg || 35}
              display={v => `${v}°`}
              onChange={v => updateParam('inclineAngleDeg', v)}
            />

            <Slider
              label="Ma sát máng băng μ"
              min={0.0}
              max={0.1}
              step={0.01}
              value={params.frictionIce ?? 0.02}
              display={v => v.toFixed(2)}
              onChange={v => updateParam('frictionIce', v)}
            />

            <Slider
              label="Ma sát máng đá μ"
              min={0.15}
              max={0.6}
              step={0.01}
              value={params.frictionRough ?? 0.35}
              display={v => v.toFixed(2)}
              onChange={v => updateParam('frictionRough', v)}
            />
          </>
        )}

        {/* 9. Brachistochrone Curve Race */}
        {presetId === 'brachistochrone-race' && (
          <>
            <Slider
              label="Gia tốc trọng trường g"
              min={0.5}
              max={2.5}
              step={0.1}
              value={params.gravityY || 1.2}
              display={v => `${v.toFixed(1)} m/s²`}
              onChange={v => updateParam('gravityY', v)}
            />

            <Slider
              label="Bán kính quả bi r"
              min={6}
              max={16}
              step={1}
              value={params.ballRadius || 10}
              display={v => `${v} px`}
              onChange={v => updateParam('ballRadius', v)}
            />

            <Slider
              label="Hệ số ma sát máng trượt μ"
              min={0.0}
              max={0.01}
              step={0.001}
              value={params.friction ?? 0.001}
              display={v => v.toFixed(3)}
              onChange={v => updateParam('friction', v)}
            />
          </>
        )}

        {/* 10. Planets Gravity Battle */}
        {presetId === 'planets-gravity' && (
          <>
            <Slider
              label="Độ cao thả ban đầu"
              min={0.1}
              max={0.4}
              step={0.02}
              value={params.dropHeightPercent || 0.18}
              display={v => `${Math.round(v * 100)}%`}
              onChange={v => updateParam('dropHeightPercent', v)}
            />

            <Slider
              label="Bán kính vật thể r"
              min={8}
              max={20}
              step={1}
              value={params.ballRadius || 14}
              display={v => `${v} px`}
              onChange={v => updateParam('ballRadius', v)}
            />
          </>
        )}

      {/* ── AUTO MECHANICAL SFX ── */}
      <SectionHeader title="Âm thanh va chạm (Auto SFX)" />

      <ToggleRow label="Phát âm thanh va chạm tự động">
        <Toggle
          checked={sfxConfig.enabled !== false}
          onChange={(v: boolean) =>
            updatePhysics({
              sfxConfig: { ...sfxConfig, enabled: v },
            })
          }
        />
      </ToggleRow>

      {sfxConfig.enabled !== false && (
        <Slider
          label="Âm lượng va chạm"
          min={0.1}
          max={1.0}
          step={0.05}
          value={sfxConfig.volume ?? 0.8}
          display={v => `${Math.round(v * 100)}%`}
          onChange={v =>
            updatePhysics({
              sfxConfig: { ...sfxConfig, volume: v },
            })
          }
        />
      )}

      {/* ── FREEZE FRAME & QUIZ HOOK ── */}
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
            max={8.0}
            step={0.5}
            value={quizHook.freezeAtSec || 2.0}
            display={v => `${v}s`}
            onChange={v => updateQuiz({ freezeAtSec: v })}
          />

          <Slider
            label="Thời gian đếm"
            min={2.0}
            max={6.0}
            step={0.5}
            value={quizHook.freezeDurationSec || 3.5}
            display={v => `${v}s`}
            onChange={v => updateQuiz({ freezeDurationSec: v })}
          />

          <FormGroup
            label="Câu hỏi đố"
            tooltip="Câu hỏi xuất hiện khi mô phỏng dừng hình để kích thích tương tác"
            style={{ marginTop: 10 }}
          >
            <input
              type="text"
              className={styles.input}
              value={quizHook.question}
              placeholder="VD: Quả cầu số mấy sẽ bị văng lên?"
              onChange={e => updateQuiz({ question: e.target.value })}
            />
          </FormGroup>

          <FormGroup
            label="Các phương án"
            badge={`(${quizHook.options?.length || 0}/4)`}
            tooltip="Bấm trực tiếp vào chữ cái [A], [B], [C], [D] để chọn đáp án đúng. Chữ cái sáng xanh là đáp án sẽ được công bố khi hết thời gian."
          >
            {(quizHook.options || []).map((opt, idx) => {
              const isCorrect = opt.id === quizHook.correctAnswer
              const canDelete = (quizHook.options?.length || 0) > 2
              return (
                <div key={opt.id || idx} className={styles.optionRow}>
                  <button
                    type="button"
                    className={`${styles.optionBadge} ${isCorrect ? styles.optionBadgeActive : ''}`}
                    onClick={() => updateQuiz({ correctAnswer: opt.id })}
                    title={`Bấm để chọn đáp án ${opt.id} là đáp án đúng`}
                  >
                    {opt.id}
                  </button>
                  <input
                    type="text"
                    className={styles.optionInput}
                    value={opt.text || ''}
                    placeholder={`Nội dung phương án ${opt.id}...`}
                    onChange={e => {
                      const nextOpts = [...(quizHook.options || [])]
                      nextOpts[idx] = { ...opt, text: e.target.value }
                      updateQuiz({ options: nextOpts })
                    }}
                  />
                  <DeleteIconButton
                    disabled={!canDelete}
                    title={canDelete ? `Xóa phương án ${opt.id}` : 'Cần tối thiểu 2 phương án'}
                    onClick={() => {
                      if (!canDelete) return
                      const filtered = (quizHook.options || []).filter((_, i) => i !== idx)
                      const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']
                      const reindexed = filtered.map((o, i) => ({
                        ...o,
                        id: OPTION_LETTERS[i] || `${i + 1}`,
                      }))
                      let nextCorrect = quizHook.correctAnswer
                      if (opt.id === quizHook.correctAnswer || !reindexed.some(o => o.id === nextCorrect)) {
                        nextCorrect = reindexed[0]?.id || 'A'
                      }
                      updateQuiz({ options: reindexed, correctAnswer: nextCorrect })
                    }}
                  />
                </div>
              )
            })}

            {(quizHook.options?.length || 0) < 4 && (
              <button
                type="button"
                className={styles.addOptionBtn}
                onClick={() => {
                  const currentOpts = quizHook.options || []
                  if (currentOpts.length >= 4) return
                  const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']
                  const nextLetter = OPTION_LETTERS[currentOpts.length] || `${currentOpts.length + 1}`
                  const nextOpts = [
                    ...currentOpts,
                    { id: nextLetter, text: `Phương án ${nextLetter}` },
                  ]
                  updateQuiz({ options: nextOpts })
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Thêm phương án</span>
              </button>
            )}
          </FormGroup>

          <FormGroup label="Giải thích khi công bố" tooltip="Nội dung giải thích ngắn gọn hiển thị ngay sau khi hết thời gian suy nghĩ">
            <input
              type="text"
              className={styles.input}
              value={quizHook.explanation || ''}
              placeholder="Lời giải thích ngắn sau khi chuông reo..."
              onChange={e => updateQuiz({ explanation: e.target.value })}
            />
          </FormGroup>
        </>
      )}

      {/* ── VISUAL LAYERS TOGGLE ── */}
      <SectionHeader title="Lớp hiển thị trực quan" />

      <ToggleRow label="Vector Lực & Vận tốc">
        <Toggle
          checked={physicsData.showVectors !== false}
          onChange={(v: boolean) => updatePhysics({ showVectors: v })}
        />
      </ToggleRow>

      <ToggleRow label="Quỹ đạo chuyển động (Trails)">
        <Toggle
          checked={physicsData.showTrajectories !== false}
          onChange={(v: boolean) => updatePhysics({ showTrajectories: v })}
        />
      </ToggleRow>

      <ToggleRow label="Bảng thông số Telemetry HUD">
        <Toggle
          checked={physicsData.showHUD !== false}
          onChange={(v: boolean) => updatePhysics({ showHUD: v })}
        />
      </ToggleRow>

      <ToggleRow label="Lưới toạ độ nền (Grid)">
        <Toggle
          checked={physicsData.showGrid !== false}
          onChange={(v: boolean) => updatePhysics({ showGrid: v })}
        />
      </ToggleRow>

      <ToggleRow label="Thanh công thức & Định luật">
        <Toggle
          checked={physicsData.showFormulas !== false}
          onChange={(v: boolean) => updatePhysics({ showFormulas: v })}
        />
      </ToggleRow>
    </div>
  )
}
