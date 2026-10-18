import React, { useState, useEffect } from 'react'
import styles from './Tabs.module.css'
import advStyles from './AdvancedTab.module.css'
import { useEditorStore } from '@/store/useEditorStore'
import { useShallow } from 'zustand/react/shallow'
import { Button, SectionHeader } from '@/components/ui'
import { AvatarUploader } from '@/components/SettingsModal/tabs/components/AvatarUploader'
import { TEMPORAL_ROLE_INFO, type TemporalRole } from '@/utils/temporalContrast'
import { sceneDurationForRole } from '@/config/sceneRoles'

// Bộ tạo video hiện dùng 4 vai; 6 vai Master mở trong Inspector khi bộ xếp cảnh mới hỗ trợ
const INSPECTOR_ROLE_OPTIONS: TemporalRole[] = ['hook', 'normal', 'highlight', 'cta']

const SyncIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
)

export default function AdvancedTab() {
  const {
    scenes,
    currentSceneIdx,
    brandingSettings,
    updateScene,
    updateBrandingSettings,
    applyViralPacingToAllScenes,
    applyAuthorToAllScenes,
    applyHudHeaderToAllScenes,
    applyAvatarToAllScenes,
    applyDisclaimerToAllScenes,
    showToast
  } = useEditorStore(
    useShallow(s => ({
      scenes: s.scenes,
      currentSceneIdx: s.currentSceneIdx,
      brandingSettings: s.brandingSettings,
      updateScene: s.updateScene,
      updateBrandingSettings: s.updateBrandingSettings,
      applyViralPacingToAllScenes: s.applyViralPacingToAllScenes,
      applyAuthorToAllScenes: s.applyAuthorToAllScenes,
      applyHudHeaderToAllScenes: s.applyHudHeaderToAllScenes,
      applyAvatarToAllScenes: s.applyAvatarToAllScenes,
      applyDisclaimerToAllScenes: s.applyDisclaimerToAllScenes,
      showToast: s.showToast
    }))
  )

  const currentScene = scenes[currentSceneIdx]
  const [authorInput, setAuthorInput] = useState(currentScene?.authorName || brandingSettings?.authorName || 'XD-Short')
  const [handleInput, setHandleInput] = useState(currentScene?.hudFooterRight || brandingSettings?.authorHandle || '@xdshort')
  const [hudHeaderInput, setHudHeaderInput] = useState(currentScene?.hudHeader || '')
  const [isHudHeaderEnabled, setIsHudHeaderEnabled] = useState(Boolean(currentScene?.hudHeader))
  const [avatarUrlInput, setAvatarUrlInput] = useState(currentScene?.authorAvatarUrl || brandingSettings?.authorAvatarUrl || '')
  const [avatarPosInput, setAvatarPosInput] = useState<'top-left' | 'top-right' | 'middle-right' | 'bottom-left' | 'bottom-right' | 'custom'>(currentScene?.authorAvatarPosition || 'top-left')

  useEffect(() => {
    if (currentScene) {
      setAuthorInput(currentScene.authorName || brandingSettings?.authorName || '')
      setHandleInput(currentScene.hudFooterRight || brandingSettings?.authorHandle || '')
      setHudHeaderInput(currentScene.hudHeader || '')
      setIsHudHeaderEnabled(Boolean(currentScene.hudHeader))
      setAvatarUrlInput(currentScene.authorAvatarUrl || brandingSettings?.authorAvatarUrl || '')
      setAvatarPosInput(currentScene.authorAvatarPosition || 'top-left')
    }
  }, [
    currentSceneIdx,
    currentScene?.id,
    currentScene?.authorAvatarUrl,
    brandingSettings?.authorAvatarUrl,
    brandingSettings?.authorName,
    brandingSettings?.authorHandle
  ])

  return (
    <div className={advStyles.container}>
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 1. THƯƠNG HIỆU & AVATAR                                         */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <SectionHeader
        title="Thương hiệu & Avatar"
        first
        action={
          <Button
            asIcon
            variant="ghost"
            size="icon-sm"
            title="Đồng bộ thương hiệu cho tất cả cảnh"
            onClick={() => {
              applyAuthorToAllScenes(authorInput, handleInput)
              applyAvatarToAllScenes(
                avatarUrlInput,
                avatarPosInput,
                currentScene?.authorAvatarLeft,
                currentScene?.authorAvatarTop,
                currentScene?.authorAvatarSize || 38.4,
                currentScene?.authorAvatarEffect || 'none'
              )
              applyDisclaimerToAllScenes(
                currentScene?.showAiDisclaimer !== false,
                currentScene?.aiDisclaimerText
              )
              showToast('Đã áp dụng thương hiệu cho tất cả cảnh!')
            }}
          >
            <SyncIcon />
          </Button>
        }
      />

      {/* Avatar Upload & Preview Card — Sử dụng AvatarUploader chuẩn hoá */}
      <AvatarUploader
        compact
        avatarUrl={avatarUrlInput}
        brandColor={currentScene?.elements.find(e => e.color && e.color !== '#fff')?.color || brandingSettings?.brandColor || '#BEFF01'}
        authorName={authorInput}
        onChange={(newUrl) => {
          setAvatarUrlInput(newUrl)
          if (currentScene) {
            updateScene(currentScene.id, { authorAvatarUrl: newUrl })
          }
          updateBrandingSettings({ authorAvatarUrl: newUrl })
        }}
      />

      {/* Vị trí Avatar — Cụm 4 nút Icon SVG gọn 1 hàng 28px */}
      <div className={advStyles.posRow}>
        <span className={advStyles.propLabel}>Vị trí avatar</span>
        <div className={advStyles.posBtnGroup}>
          {[
            {
              id: 'top-left',
              label: 'Trên trái',
              icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <rect x="6" y="6" width="5" height="5" fill="currentColor" rx="1" />
                </svg>
              ),
            },
            {
              id: 'top-right',
              label: 'Trên phải',
              icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <rect x="13" y="6" width="5" height="5" fill="currentColor" rx="1" />
                </svg>
              ),
            },
            {
              id: 'middle-right',
              label: 'Giữa phải',
              icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <rect x="13" y="9.5" width="5" height="5" fill="currentColor" rx="1" />
                </svg>
              ),
            },
            {
              id: 'bottom-left',
              label: 'Dưới trái',
              icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <rect x="6" y="13" width="5" height="5" fill="currentColor" rx="1" />
                </svg>
              ),
            },
          ].map(pos => {
            const isSel = avatarPosInput === pos.id
            const avSize = currentScene?.authorAvatarSize || 38.4
            return (
              <button
                key={pos.id}
                type="button"
                className={`${advStyles.posBtn} ${isSel ? advStyles.posBtnActive : ''}`}
                title={`Vị trí: ${pos.label}`}
                onClick={() => {
                  const p = pos.id as any
                  setAvatarPosInput(p)
                  let left = 20
                  let top = 22
                  if (p === 'top-right') {
                    left = 360 - 20 - avSize
                    top = 22
                  } else if (p === 'middle-right') {
                    left = 360 - 18 - avSize
                    top = Math.round(320 - avSize / 2)
                  } else if (p === 'bottom-left') {
                    left = 20
                    top = 590
                  }
                  if (currentScene)
                    updateScene(currentScene.id, {
                      authorAvatarPosition: p,
                      authorAvatarLeft: Math.round(left),
                      authorAvatarTop: Math.round(top),
                    })
                  showToast(`Vị trí: ${pos.label}`)
                }}
              >
                {pos.icon}
              </button>
            )
          })}
        </div>
      </div>

      {/* Hiệu ứng Avatar — Chip group gọn 1 hàng */}
      <div className={advStyles.propRowVertical}>
        <span className={advStyles.propLabel}>Hiệu ứng avatar</span>
        <div className={advStyles.chipGroup}>
          {[
            { id: 'none', label: 'Tĩnh' },
            { id: 'audio-pulse', label: 'Sóng nói' },
            { id: 'neon-spin', label: 'Viền xoay' },
            { id: 'float', label: 'Bồng bềnh' },
          ].map(eff => {
            const isEffSel = (currentScene?.authorAvatarEffect || 'none') === eff.id
            return (
              <button
                key={eff.id}
                type="button"
                className={`${advStyles.chipBtn} ${isEffSel ? advStyles.chipBtnActive : ''}`}
                onClick={() => {
                  if (currentScene) updateScene(currentScene.id, { authorAvatarEffect: eff.id as any })
                  showToast(`Hiệu ứng: ${eff.label}`)
                }}
              >
                {eff.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tên tác giả */}
      <div className={advStyles.propRowVertical}>
        <span className={advStyles.propLabel}>Tên tác giả</span>
        <input
          className={styles.input}
          value={authorInput}
          onChange={e => {
            setAuthorInput(e.target.value)
            if (currentScene) updateScene(currentScene.id, { authorName: e.target.value })
          }}
          placeholder="VD: XD-Short..."
        />
      </div>

      {/* Tuyên bố AI (AI Disclaimer) — Flat Toggle Row */}
      <div className={advStyles.propRowVertical}>
        <div className={advStyles.toggleHeaderRow}>
          <div className={advStyles.toggleTitleArea}>
            <span className={advStyles.propLabel}>Tuyên bố AI</span>
            <span className={advStyles.toggleBadge}>
              {currentSceneIdx === scenes.length - 1 ? '• Cảnh cuối' : `• (${scenes.length}/${scenes.length})`}
            </span>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={currentScene?.showAiDisclaimer !== false}
              onChange={e => {
                if (currentScene) {
                  updateScene(currentScene.id, { showAiDisclaimer: e.target.checked })
                  showToast(e.target.checked ? 'Đã bật Tuyên bố AI' : 'Đã tắt Tuyên bố AI')
                }
              }}
            />
            <span className={styles.tgl} />
          </label>
        </div>
        {currentScene?.showAiDisclaimer !== false && (
          <input
            className={styles.input}
            value={currentScene?.aiDisclaimerText ?? 'AI tạo (có thể sai sót).'}
            onChange={e => {
              if (currentScene) updateScene(currentScene.id, { aiDisclaimerText: e.target.value })
            }}
            placeholder="AI tạo (có thể sai sót)."
          />
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 2. KHUNG THÔNG TIN HUD                                          */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <SectionHeader
        title="Khung thông tin HUD"
        action={
          <Button
            asIcon
            variant="ghost"
            size="icon-sm"
            title="Đồng bộ HUD cho tất cả cảnh"
            onClick={() => {
              applyHudHeaderToAllScenes(isHudHeaderEnabled ? hudHeaderInput : '')
              if (currentScene) updateScene(currentScene.id, { hudFooterRight: handleInput })
              showToast('Đã áp dụng HUD cho tất cả cảnh!')
            }}
          >
            <SyncIcon />
          </Button>
        }
      />

      {/* Tiêu đề trên (HUD Header) — Flat Toggle Row */}
      <div className={advStyles.propRowVertical}>
        <div className={advStyles.toggleHeaderRow}>
          <span className={advStyles.propLabel}>Tiêu đề trên</span>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={isHudHeaderEnabled}
              onChange={e => {
                const v = e.target.checked
                setIsHudHeaderEnabled(v)
                if (currentScene) {
                  const newHeader = v ? (hudHeaderInput || '-- XD-SHORT . 2026 --') : ''
                  if (v && !hudHeaderInput) setHudHeaderInput('-- XD-SHORT . 2026 --')
                  updateScene(currentScene.id, { hudHeader: newHeader })
                  showToast(v ? 'Đã bật Tiêu đề' : 'Đã tắt Tiêu đề')
                }
              }}
            />
            <span className={styles.tgl} />
          </label>
        </div>
        {isHudHeaderEnabled && (
          <input
            className={styles.input}
            value={hudHeaderInput}
            onChange={e => {
              const val = e.target.value
              setHudHeaderInput(val)
              if (currentScene) updateScene(currentScene.id, { hudHeader: val })
            }}
            placeholder="VD: -- CHỦ ĐỀ . 2026 --"
          />
        )}
      </div>

      {/* Chân trang phải (HUD Footer Right) — Chips + Input */}
      <div className={advStyles.propRowVertical}>
        <div className={advStyles.propRowHeader}>
          <span className={advStyles.propLabel}>Chân trang phải</span>
          <span className={advStyles.hintMeta}>{'{page}/{total}'}</span>
        </div>
        <div className={advStyles.chipGroup}>
          {[
            { label: '{page}/{total}', val: '{page}/{total}', desc: 'Số cảnh' },
            { label: 'REV 2026', val: '{page}/{total} REV 2026.08', desc: 'Bản quyền' },
            { label: '@kenh', val: '@xdshort', desc: 'Tên kênh' },
            { label: 'Ẩn', val: '', desc: 'Tắt' },
          ].map(preset => {
            const isSel = handleInput === preset.val
            return (
              <button
                key={preset.label}
                type="button"
                className={`${advStyles.chipBtn} ${isSel ? advStyles.chipBtnActive : ''}`}
                onClick={() => {
                  setHandleInput(preset.val)
                  if (currentScene) updateScene(currentScene.id, { hudFooterRight: preset.val })
                  showToast(`Chân trang: ${preset.desc}`)
                }}
              >
                {preset.label}
              </button>
            )
          })}
        </div>
        <input
          className={styles.input}
          value={handleInput}
          onChange={e => {
            setHandleInput(e.target.value)
            if (currentScene) updateScene(currentScene.id, { hudFooterRight: e.target.value })
          }}
          placeholder="Tùy chỉnh: {page}/{total} hoặc @kenh..."
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 3. NHỊP ĐIỆU & KHOẢNG LẶNG                                      */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <SectionHeader
        title="Nhịp điệu & Khoảng lặng"
        action={
          <Button
            asIcon
            variant="ghost"
            size="icon-sm"
            title="Đồng bộ nhịp điệu cho tất cả cảnh"
            onClick={() => {
              applyViralPacingToAllScenes()
              showToast('Đã đồng bộ nhịp điệu cho tất cả cảnh!')
            }}
          >
            <SyncIcon />
          </Button>
        }
      />

      {/* Vai trò phân đoạn */}
      <div className={advStyles.propRowVertical}>
        <span className={advStyles.propLabel}>Vai cảnh</span>
        <select
          className={styles.select}
          value={currentScene?.temporalRole || 'normal'}
          onChange={e => {
            const role = e.target.value as TemporalRole
            if (currentScene) {
              // Thời lượng theo vai nhưng không ngắn hơn giọng đọc (config/sceneRoles)
              const dur = sceneDurationForRole(role, currentScene)
              updateScene(currentScene.id, { temporalRole: role, duration: dur })
              showToast(`Vai cảnh: ${TEMPORAL_ROLE_INFO[role].label} (${dur}s)`)
            }
          }}
          style={{ width: '100%' }}
        >
          {INSPECTOR_ROLE_OPTIONS.map(role => (
            <option key={role} value={role}>
              {TEMPORAL_ROLE_INFO[role].label} — {TEMPORAL_ROLE_INFO[role].description}
            </option>
          ))}
        </select>
      </div>

      {/* Khoảng lặng kịch tính */}
      <div className={advStyles.sliderWrap}>
        <Slider
          label="Khoảng lặng kịch tính"
          value={(currentScene?.silenceGapSec || 0) * 10}
          min={0}
          max={5}
          step={0.5}
          display={v => `${(v/10).toFixed(1)}s`}
          onChange={v => {
            if (currentScene) updateScene(currentScene.id, { silenceGapSec: v / 10 })
          }}
        />
      </div>
    </div>
  )
}

function Slider({ label, value, min, max, step = 1, display, onChange }:
  { label: string; value: number; min: number; max: number; step?: number; display: (v: number) => string; onChange: (v: number) => void }) {
  const safeVal = isNaN(value) ? min : value
  const roundedVal = step >= 1 ? Math.round(safeVal) : Math.round(safeVal * 10) / 10
  return (
    <div className={styles.sliderRow}>
      <span className={styles.sliderLabel}>{label}</span>
      <input
        type="range"
        className={styles.slider}
        min={min}
        max={max}
        step={step}
        value={roundedVal}
        onChange={e => onChange(step >= 1 ? Math.round(+e.target.value) : +e.target.value)}
      />
      <span className={styles.sliderVal}>{display(roundedVal)}</span>
    </div>
  )
}
