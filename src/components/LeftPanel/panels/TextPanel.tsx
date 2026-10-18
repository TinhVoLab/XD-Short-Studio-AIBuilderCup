import { useState } from 'react'
import styles from './Panels.module.css'
import tpStyles from './TextPanel.module.css'
import { useEditorStore } from '@/store/useEditorStore'
import { useShallow } from 'zustand/react/shallow'
import { Button, SegmentedControl } from '@/components/ui'
import { MasterHookData, SceneElement } from '@/types/scene'
import {
  MainTab,
  HookSubCategory,
  HookPresetItem,
  HighlightBoxPresetItem,
  HOOK_SUB_CATEGORIES,
  MASTER_TYPOGRAPHY_PRESETS,
  HIGHLIGHT_BOX_PRESETS,
} from '@/data/masterHooks'
import { TYPOGRAPHY_PRESETS, TypographyPreset } from '@/data/typographyPresets'
import { INITIAL_SFX_PRESETS } from '@/config/sfxPresetCatalog'
import { LAYOUT_SFX_MAP } from '@/remotion/elements/infographic/MasterHook/config'

const TEXT_PRESETS = [
  { type: 'heading', label: 'Tiêu đề lớn', previewSize: 20, style: { fontSize: 48, fontWeight: 900, fontFamily: 'Be Vietnam Pro', color: '#BEFF01' } },
  { type: 'subtitle', label: 'Tiêu đề phụ', previewSize: 16, style: { fontSize: 24, fontWeight: 600, fontFamily: 'Inter', color: '#fff' } },
  { type: 'body', label: 'Nội dung văn bản', previewSize: 13.5, style: { fontSize: 16, fontWeight: 400, fontFamily: 'Inter', color: '#fff' } },
]

export default function TextPanel() {
  const [mainTab, setMainTab] = useState<string>('basic')
  const [hookSubCategory, setHookSubCategory] = useState<HookSubCategory>('all')

  const { addElement, updateElement, addAudioClip, scenes, currentSceneIdx, selectedElementId, showToast } = useEditorStore(
    useShallow(s => ({
      addElement: s.addElement,
      updateElement: s.updateElement,
      addAudioClip: s.addAudioClip,
      scenes: s.scenes,
      currentSceneIdx: s.currentSceneIdx,
      selectedElementId: s.selectedElementId,
      showToast: s.showToast,
    }))
  )

  const handleAddMasterHook = (preset: HookPresetItem) => {
    const hookData: MasterHookData = {
      archetype: preset.archetype || (preset.id as any),
      layoutStyle: preset.layoutStyle,
      badgeText: preset.badge,
      heroTitle: preset.title,
      highlightWords: preset.highlights,
      subText: preset.sub,
      accentColor: preset.accent,
      versusLeft: preset.versusLeft,
      versusRight: preset.versusRight,
      boxVariant: 'glass',
      fontSize: 38,
      fontFamily: 'Be Vietnam Pro',
      fontWeight: 900,
    }

    // 1. Thêm Element hình ảnh Master Hook vào Scene
    addElement({
      type: 'master-hook',
      left: 180,
      top: 56,
      width: 320,
      height: 240,
      scaleX: 1,
      scaleY: 1,
      angle: 0,
      opacity: 1,
      accentColor: preset.accent,
      animPreset: preset.animPreset as any,
      animDuration: 0.6,
      animDelay: 0.05,
      content: preset.title,
      hookData,
    })

    // 2. Tự động spawn SFX tương ứng xuống Audio Track trên Timeline
    try {
      const sfxId = preset.layoutStyle ? LAYOUT_SFX_MAP[preset.layoutStyle] : 'sfx_whoosh';
      const sfxItem = INITIAL_SFX_PRESETS.find(s => s.id === sfxId) || INITIAL_SFX_PRESETS[2]; // Fallback swoosh

      // Tính toán mốc thời gian startSec bắt đầu của Scene hiện tại
      let startSec = 0;
      for (let i = 0; i < currentSceneIdx && i < scenes.length; i++) {
        startSec += scenes[i]?.duration || 0;
      }

      if (sfxItem && addAudioClip) {
        addAudioClip({
          name: `${sfxItem.emoji} ${sfxItem.name}`,
          url: sfxItem.audioUrl,
          startSec: Number(startSec.toFixed(2)),
          duration: sfxItem.duration || 1.0,
          playDurationSec: sfxItem.duration || 1.0,
          volume: 0.8,
          trackId: 'SFX',
        });
      }
    } catch (e) {
      console.warn('Could not auto-attach SFX to timeline:', e);
    }

    showToast(`Đã thêm mẫu: ${preset.label} (+ SFX Timeline)`)
  }

  const handleAddHighlightBox = (preset: HighlightBoxPresetItem) => {
    if (preset.type === 'numbered-list') {
      addElement({
        type: 'numbered-list',
        left: 180,
        top: 290,
        width: 312,
        height: 120,
        scaleX: 1,
        scaleY: 1,
        angle: 0,
        opacity: 1,
        accentColor: preset.accent,
        color: '#FFFFFF',
        fontSize: 13.5,
        items: preset.items || ['Bước 1: Khởi động', 'Bước 2: Triển khai', 'Bước 3: Hoàn tất'],
        animPreset: 'fade-in',
        animDuration: 0.5,
        animDelay: 0.05,
      })
    } else {
      addElement({
        type: 'highlight-box',
        left: 180,
        top: 290,
        width: 312,
        height: 0, // addElement tính lại theo nội dung (calculateElementDynamicHeight)
        scaleX: 1,
        scaleY: 1,
        angle: 0,
        opacity: 1,
        variant: preset.variant || 'callout-card',
        boxIcon: preset.boxIcon,
        glowEffect: preset.glowEffect ?? true,
        accentColor: preset.accent,
        // Nền & màu chữ theo theme (--card-bg / --text) để đọc được ở cả theme sáng lẫn tối
        content: preset.content,
        fontSize: preset.variant === 'glow-pill' ? 14 : 13.5,
        textAlign: preset.textAlign || (preset.variant === 'glow-pill' ? 'center' : 'left'),
        radius: preset.variant === 'glow-pill' ? 999 : 14,
        animPreset: (preset.animPreset as any) || 'fade-in',
        animDuration: 0.5,
        animDelay: 0.05,
      })
    }
    showToast(`Đã thêm: ${preset.label}`)
  }

  const handleAddBasicText = (p: (typeof TEXT_PRESETS)[0]) => {
    addElement({
      type: 'text',
      content: p.label,
      left: 180,
      top: 320,
      width: 320,
      height: 50,
      scaleX: 1,
      scaleY: 1,
      angle: 0,
      opacity: 1,
      fontSize: p.style.fontSize,
      fontWeight: p.style.fontWeight,
      fontFamily: p.style.fontFamily,
      color: p.style.color,
      textAlign: 'center',
      animPreset: 'zoom-in',
      animDuration: 0.5,
      animDelay: 0,
    })
    showToast(`Đã thêm ${p.label}`)
  }

  const RESET_TYPOGRAPHY_PATCH: Partial<SceneElement> = {
    textStroke: undefined,
    textStrokeWidth: 0,
    shadowColor: undefined,
    shadowBlur: 0,
    shadow: false,
    textGradientFrom: undefined,
    textGradientTo: undefined,
    textGradientAngle: 135,
    textBgColor: undefined,
    textBgPadding: 6,
    textBgRadius: 6,
    letterSpacing: 0,
    textTransform: 'none',
    lineHeight: 1.15,
  }

  const handleApplyTypographyPreset = (preset: TypographyPreset) => {
    const currentScene = scenes[currentSceneIdx]
    const selectedEl = currentScene?.elements.find(e => e.id === selectedElementId)

    if (selectedEl && selectedEl.type === 'text') {
      updateElement(selectedEl.id, {
        ...RESET_TYPOGRAPHY_PATCH,
        ...preset.elementPatch,
      })
      showToast(`Đã áp dụng: ${preset.label}`)
    } else {
      addElement({
        type: 'text',
        content: preset.label,
        left: 180,
        top: 320,
        width: 320,
        height: 60,
        scaleX: 1,
        scaleY: 1,
        angle: 0,
        opacity: 1,
        fontSize: 36,
        textAlign: 'center',
        animPreset: 'zoom-in',
        animDuration: 0.5,
        animDelay: 0,
        ...RESET_TYPOGRAPHY_PATCH,
        ...preset.elementPatch,
      })
      showToast(`Đã thêm chữ: ${preset.label}`)
    }
  }

  const filteredHookPresets = MASTER_TYPOGRAPHY_PRESETS.filter(item => {
    if (hookSubCategory === 'all') return true
    if (hookSubCategory === 'slogan') return item.category === 'slogan'
    if (hookSubCategory === 'cta') return item.category === 'cta'
    return (item.archetype || item.id) === hookSubCategory && item.category === 'hook'
  })

  return (
    <div className={styles.svgPanelContainer}>
      {/* 🌟 Top Sub-tab Switcher */}
      <div className={tpStyles.tabSwitcher}>
        <SegmentedControl
          options={[
            { value: 'basic', label: 'Cơ bản' },
            { value: 'style', label: 'Phong cách' },
            { value: 'hook', label: 'Tiêu đề Hook' },
            { value: 'highlight', label: 'Bullets' }
          ]}
          value={mainTab}
          onChange={(val) => setMainTab(val as any)}
          size="sm"
          fullWidth
        />
      </div>

      {/* ── TAB 1: VĂN BẢN CƠ BẢN (Tiêu đề lớn / phụ / nội dung) ── */}
      {mainTab === 'basic' && (
        <div className={tpStyles.listCol}>
          {TEXT_PRESETS.map(p => (
            <div
              key={p.type}
              className={`${styles.presetItem} ${tpStyles.basicCard}`}
              onClick={() => handleAddBasicText(p)}
            >
              <div
                className={tpStyles.basicPreview}
                style={{ ...p.style, fontSize: p.previewSize }}
              >
                {p.label}
              </div>
              <div className={tpStyles.basicMeta}>
                {p.style.fontFamily} • {p.style.fontSize}px
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB 2: TIÊU ĐỀ HOOK (Cụm chữ giật gân cho cảnh hiện tại) ── */}
      {mainTab === 'hook' && (
        <>
          {/* Sub Category Filter Pills */}
          <div className={tpStyles.hookFilterBar}>
            {HOOK_SUB_CATEGORIES.map(cat => {
              const isActive = hookSubCategory === cat.id
              return (
                <Button
                  key={cat.id}
                  variant="pill"
                  size="xs"
                  selected={isActive}
                  onClick={() => setHookSubCategory(cat.id)}
                  className={tpStyles.hookPillBtn}
                >
                  {cat.label}
                </Button>
              )
            })}
          </div>

          <div className={tpStyles.listCol8}>
            {filteredHookPresets.map(h => (
              <div
                key={h.id}
                onClick={() => handleAddMasterHook(h)}
                className={tpStyles.hookCard}
              >
                {/* 1. Header: Mini Pill Badge + Motion Tag */}
                <div className={tpStyles.hookHeader}>
                  <div
                    className={tpStyles.hookBadge}
                    style={{
                      background: `${h.accent}14`,
                      border: `1px solid ${h.accent}33`,
                      color: h.accent,
                    }}
                  >
                    {h.badge}
                  </div>
                  <span className={tpStyles.hookMotionTag}>
                    {h.animPreset === 'zoom-in' ? 'Zoom' : h.animPreset === 'slide-up' ? 'Slide' : h.animPreset === 'glitch' ? 'Glitch' : h.animPreset === 'bounce' ? 'Bounce' : 'Fade'}
                  </span>
                </div>

                {/* 2. Mini Style Preview */}
                {h.layoutStyle === 'hazard-alert' ? (
                  <div className={tpStyles.hazardAlert}>
                    {h.title}
                  </div>
                ) : h.layoutStyle === 'sticker-words' ? (
                  <div className={tpStyles.stickerWordsContainer}>
                    {h.title.split(/\s+/).map((w, wIdx) => {
                      const isHl = h.highlights.some(hl => w.toUpperCase().includes(hl.toUpperCase()))
                      return (
                        <span
                          key={wIdx}
                          className={tpStyles.stickerWord}
                          style={{
                            background: isHl ? h.accent : '#FFFFFF',
                          }}
                        >
                          {w}
                        </span>
                      )
                    })}
                  </div>
                ) : h.layoutStyle === 'kinetic-strip-highlight' ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 10px',
                    borderRadius: 6,
                    background: `${h.accent}18`,
                    borderLeft: `3px solid ${h.accent}`,
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: 12,
                    letterSpacing: 0.5
                  }}>
                    <span style={{ color: h.accent }}>✦</span>
                    <span>{h.title}</span>
                  </div>
                ) : h.layoutStyle === 'cyber-hud' ? (
                  <div className={tpStyles.cyberHud}>
                    &gt; {h.title} <span style={{ color: h.accent }}>_</span>
                  </div>
                ) : h.layoutStyle === 'split-versus' ? (
                  <div className={tpStyles.splitVersus}>
                    <span className={tpStyles.versusBadgeLeft}>
                      {h.versusLeft || '99% THUA LỖ'}
                    </span>
                    <span className={tpStyles.versusBadgeVs}>
                      VS
                    </span>
                    <span className={tpStyles.versusBadgeRight}>
                      {h.versusRight || 'TOP 1%'}
                    </span>
                  </div>
                ) : h.layoutStyle === 'cta-social' ? (
                  <div className={tpStyles.ctaSocial}>
                    <span className={tpStyles.ctaSocialText}>
                      {h.title}
                    </span>
                    <span className={tpStyles.ctaSocialFollow}>
                      + FOLLOW
                    </span>
                  </div>
                ) : h.layoutStyle === 'cta-pill' ? (
                  <div
                    className={tpStyles.ctaPill}
                    style={{
                      background: `linear-gradient(135deg, ${h.accent} 0%, #00D4FF 100%)`,
                    }}
                  >
                    {h.title}
                  </div>
                ) : h.layoutStyle === 'cta-comment' ? (
                  <div
                    className={tpStyles.ctaComment}
                    style={{ border: `1px solid ${h.accent}44` }}
                  >
                    <span className={tpStyles.ctaCommentPrefix}>Gõ từ khóa:</span>
                    <span
                      className={tpStyles.ctaCommentHighlight}
                      style={{ background: h.accent }}
                    >
                      "{h.highlights[0] || 'TOOL'}"
                    </span>
                    <span className={tpStyles.ctaCommentSuffix}>Nhận bot</span>
                  </div>
                ) : h.layoutStyle === 'cta-bookmark' ? (
                  <div className={tpStyles.ctaBookmark}>
                    <span className={tpStyles.ctaBookmarkText}>
                      {h.title}
                    </span>
                    <span className={tpStyles.ctaBookmarkSave}>
                      LƯU NGAY
                    </span>
                  </div>
                ) : h.layoutStyle === 'luxury-zen' ? (
                  <div className={tpStyles.luxuryZen}>
                    {h.title}
                  </div>
                ) : (
                  <div className={tpStyles.defaultHookTitle}>
                    {h.title}
                  </div>
                )}

                {/* 3. Subtext in compact box */}
                <div className={tpStyles.hookSubBox}>
                  {h.sub}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── TAB 3: TYPOGRAPHY PHONG CÁCH MỚI (TEXT LAYER 2.0) ── */}
      {mainTab === 'style' && (
        <div className={tpStyles.listCol8}>
          {TYPOGRAPHY_PRESETS.map((preset) => {
            const p = preset.elementPatch
            const hasGrad = Boolean(p.textGradientFrom && p.textGradientTo)
            const hasBg = Boolean(p.textBgColor)

            return (
              <div
                key={preset.id}
                onClick={() => handleApplyTypographyPreset(preset)}
                className={tpStyles.styleCard}
              >
                {/* Header: Label + Badge */}
                <div className={tpStyles.styleHeader}>
                  <span className={tpStyles.styleTitle}>
                    {preset.label}
                  </span>
                  <span className={tpStyles.styleBadge}>
                    {preset.badge}
                  </span>
                </div>

                {/* Mockup Preview Box */}
                <div className={tpStyles.stylePreviewBox}>
                  <span
                    className={tpStyles.stylePreviewText}
                    style={{
                      fontFamily: p.fontFamily || 'Be Vietnam Pro',
                      fontWeight: p.fontWeight || 700,
                      textTransform: p.textTransform || 'none',
                      letterSpacing: p.letterSpacing ? `${p.letterSpacing}px` : undefined,
                      color: hasGrad ? 'transparent' : (p.color || '#FFFFFF'),
                      background: hasGrad
                        ? `linear-gradient(${p.textGradientAngle ?? 135}deg, ${p.textGradientFrom}, ${p.textGradientTo})`
                        : (hasBg ? p.textBgColor : undefined),
                      WebkitBackgroundClip: hasGrad ? 'text' : undefined,
                      backgroundClip: hasGrad ? 'text' : undefined,
                      textShadow: (p.textStroke && p.textStrokeWidth)
                        ? `-1.5px -1.5px 0 ${p.textStroke}, 1.5px -1.5px 0 ${p.textStroke}, -1.5px 1.5px 0 ${p.textStroke}, 1.5px 1.5px 0 ${p.textStroke}`
                        : (p.shadowColor ? `0px 0px ${p.shadowBlur ?? 8}px ${p.shadowColor}` : undefined),
                      padding: (hasBg && !hasGrad) ? `${p.textBgPadding ?? 4}px 8px` : undefined,
                      borderRadius: hasBg ? `${p.textBgRadius ?? 4}px` : undefined,
                    }}
                  >
                    {preset.label}
                  </span>
                </div>

                {/* AI Hint */}
                <div className={tpStyles.styleAiHint}>
                  {preset.aiHint}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── TAB 4: ĐIỂM NHẤN & BULLETS (HIGHLIGHT BOX) ── */}
      {mainTab === 'highlight' && (
        <div className={tpStyles.listCol8}>
          {HIGHLIGHT_BOX_PRESETS.map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              onClick={() => handleAddHighlightBox(item)}
              className={tpStyles.highlightCard}
            >
              {/* Header: Label + Badge */}
              <div className={tpStyles.highlightHeader}>
                <div className={tpStyles.highlightLabel}>
                  {item.label}
                </div>
                <span
                  className={tpStyles.highlightBadge}
                  style={{
                    color: item.accent,
                    background: `${item.accent}14`,
                    border: `1px solid ${item.accent}33`,
                  }}
                >
                  {item.badge}
                </span>
              </div>

              {/* Mini Mockup Canvas */}
              <div className={tpStyles.highlightCanvas}>
                {item.variant === 'glow-pill' ? (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '5px 14px',
                    borderRadius: 999,
                    background: `${item.accent}20`,
                    border: `1px solid ${item.accent}77`,
                    boxShadow: `0 0 10px ${item.accent}30`,
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#FFFFFF',
                    maxWidth: '100%',
                    textAlign: 'center'
                  }}>
                    <span style={{ color: item.accent }}>✦</span>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.content}</span>
                  </div>
                ) : item.variant === 'accent-strip' ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 12px',
                    borderLeft: `3px solid ${item.accent}`,
                    background: `${item.accent}14`,
                    borderRadius: '0 8px 8px 0',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#FFFFFF',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    <span style={{ color: item.accent }}>✦</span>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.content}</span>
                  </div>
                ) : item.variant === 'callout-card' ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${item.accent}45`,
                    boxShadow: `0 0 12px ${item.accent}18`,
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#FFFFFF',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    <span style={{ color: item.accent, fontSize: 13, marginTop: -1 }}>
                      {item.boxIcon === 'alert' ? '⚠️' : '💡'}
                    </span>
                    <span style={{ lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.content}
                    </span>
                  </div>
                ) : item.variant === 'multi-pill' ? (
                  <div className={tpStyles.multiPillContainer}>
                    {item.content.split('•').map((p, pIdx) => (
                      <span
                        key={pIdx}
                        className={tpStyles.multiPillItem}
                        style={{
                          background: item.accent,
                        }}
                      >
                        {p.trim()}
                      </span>
                    ))}
                  </div>
                ) : item.type === 'numbered-list' ? (
                  <div className={tpStyles.numberedListContainer}>
                    {(item.items || []).map((it, itIdx) => (
                      <div key={itIdx} className={tpStyles.numberedListItem}>
                        <span
                          className={tpStyles.numberedListIndex}
                          style={{
                            background: item.accent,
                          }}
                        >
                          {itIdx + 1}
                        </span>
                        <span className={tpStyles.numberedListText}>
                          {it}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={tpStyles.bulletListContainer}>
                    {item.content.split('\n').map((line, lIdx) => (
                      <div
                        key={lIdx}
                        className={tpStyles.bulletListItem}
                        style={{
                          border: `1px solid ${item.accent}22`,
                        }}
                      >
                        <span style={{ color: item.accent }}>{line.startsWith('❌') ? '❌' : line.startsWith('✦') ? '✦' : '•'}</span>
                        <span>{line.replace(/^[•❌✦]\s*/, '')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
