import { useState, useMemo } from 'react'
import styles from './Panels.module.css'
import { useEditorStore } from '@/store/useEditorStore'
import { useShallow } from 'zustand/react/shallow'
import { SVG_SHAPES_CATALOG, SvgShapeItem } from '@/config/svgShapesCatalog'
import { FLUENT_EMOJI_CATALOG, FLUENT_EMOJI_CATEGORIES, FluentEmojiItem } from '@/config/fluentEmojiCatalog'
import { getChartsForUi } from '@/config/elementsRegistry'
import { ChartMiniPreview } from './components/ChartMiniPreview'
import { LottieSection } from './components/LottieSection'
import { Button, SegmentedControl, SearchInput, FilterTabs, Badge } from '@/components/ui'

type MainSubTab = 'emojis' | 'shapes' | 'charts' | 'lottie'

export default function SvgPanel() {
  const { currentSceneIdx, showToast, addElement, setAiDiagramModalOpen } = useEditorStore(
    useShallow(s => ({
      currentSceneIdx: s.currentSceneIdx,
      showToast: s.showToast,
      addElement: s.addElement,
      setAiDiagramModalOpen: s.setAiDiagramModalOpen,
    }))
  )

  const [activeSubTab, setActiveSubTab] = useState<MainSubTab>('emojis')
  
  // Emoji state
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState<string>('all')
  const [emojiSearchTerm, setEmojiSearchTerm] = useState<string>('')

  // Shape state
  const [shapeSearchTerm, setShapeSearchTerm] = useState<string>('')

  // Filter 3D Emojis
  const filteredEmojis = useMemo(() => {
    return FLUENT_EMOJI_CATALOG.filter(e => {
      const matchCategory = selectedEmojiCategory === 'all' || e.category === selectedEmojiCategory
      const q = emojiSearchTerm.trim().toLowerCase()
      const matchSearch = q === '' ||
        e.name.toLowerCase().includes(q) ||
        e.tags.some(t => t.toLowerCase().includes(q))
      return matchCategory && matchSearch
    })
  }, [selectedEmojiCategory, emojiSearchTerm])

  // Filter Shapes (No category filtering needed)
  const filteredShapes = useMemo(() => {
    const q = shapeSearchTerm.trim().toLowerCase()
    return SVG_SHAPES_CATALOG.filter(s => {
      return q === '' || 
        s.label.toLowerCase().includes(q) || 
        s.tags.some(t => t.toLowerCase().includes(q))
    })
  }, [shapeSearchTerm])

  const handleAddEmoji = (emoji: FluentEmojiItem) => {
    const targetSize = emoji.defaultWidth || 110
    const img = new Image()
    img.onload = () => {
      const naturalW = img.width || targetSize
      const naturalH = img.height || targetSize
      const scale = targetSize / naturalW

      addElement({
        type: 'image',
        src: emoji.url,
        left: 180,
        top: 300,
        width: naturalW,
        height: naturalH,
        scaleX: scale,
        scaleY: scale,
        angle: 0,
        opacity: 1,
        animPreset: 'zoom-in',
        animDuration: 0.4,
      })
      showToast(`Đã thêm 3D Emoji "${emoji.name}" vào cảnh ${currentSceneIdx + 1}`)
    }
    img.onerror = () => {
      addElement({
        type: 'image',
        src: emoji.url,
        left: 180,
        top: 300,
        width: targetSize,
        height: targetSize,
        scaleX: 1,
        scaleY: 1,
        angle: 0,
        opacity: 1,
        animPreset: 'zoom-in',
        animDuration: 0.4,
      })
      showToast(`Đã thêm 3D Emoji "${emoji.name}" vào cảnh ${currentSceneIdx + 1}`)
    }
    img.src = emoji.url
  }

  const handleAddShape = (s: SvgShapeItem) => {
    addElement({
      type: 'shape',
      shapeType: s.id,
      left: 180,
      top: 320,
      width: s.defaultWidth,
      height: s.defaultHeight,
      scaleX: 1,
      scaleY: 1,
      angle: 0,
      opacity: 1,
      fill: s.defaultFill,
      stroke: s.defaultStroke,
      strokeWidth: s.defaultStrokeWidth,
      svgContent: s.svgPath,
      animPreset: 'fade-in',
      animDuration: 0.4,
    })
    showToast(`Đã thêm ${s.label} vào cảnh ${currentSceneIdx + 1}`)
  }

  return (
    <div className={styles.svgPanelContainer}>
      {/* Top Sub-tab Switcher */}
      <div style={{ marginBottom: 12 }}>
        <SegmentedControl
          options={[
            { value: 'emojis', label: '3D Emoji' },
            { value: 'shapes', label: 'Hình khối' },
            { value: 'charts', label: 'Biểu đồ' },
            { value: 'lottie', label: 'Lottie' }
          ]}
          value={activeSubTab}
          onChange={(val) => setActiveSubTab(val as any)}
          size="xs"
          fullWidth
        />
      </div>

      {/* ────────────────── SUB-TAB 1: 3D FLUENT EMOJIS ────────────────── */}
      {activeSubTab === 'emojis' && (
        <div>
          {/* Search Bar */}
          <SearchInput
            placeholder="Tìm emoji 3D..."
            value={emojiSearchTerm}
            onChange={e => setEmojiSearchTerm(e.target.value)}
            onClear={() => setEmojiSearchTerm('')}
            size="sm"
            fullWidth
            style={{ marginBottom: 8 }}
          />

          {/* Category Tabs */}
          <FilterTabs
            tabs={FLUENT_EMOJI_CATEGORIES}
            activeId={selectedEmojiCategory}
            onChange={setSelectedEmojiCategory}
            size="xs"
            asSelect
            selectThreshold={8}
            style={{ marginBottom: 10 }}
          />

          {/* 3D Emoji Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 8,
              padding: '2px 0'
            }}
          >
            {filteredEmojis.map(emoji => (
              <button
                key={emoji.id}
                type="button"
                onClick={() => handleAddEmoji(emoji)}
                title={emoji.name}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px 4px',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 10,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                  e.currentTarget.style.borderColor = 'rgba(190,255,1,0.4)';
                  e.currentTarget.style.backgroundColor = 'rgba(190,255,1,0.08)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
                }}
              >
                <img
                  src={emoji.url}
                  alt={emoji.name}
                  loading="lazy"
                  style={{
                    width: 44,
                    height: 44,
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))'
                  }}
                />
                <span
                  style={{
                    fontSize: 9.5,
                    color: '#BBB',
                    marginTop: 4,
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%',
                    padding: '0 2px'
                  }}
                >
                  {emoji.name}
                </span>
              </button>
            ))}

            {filteredEmojis.length === 0 && (
              <div style={{ gridColumn: 'span 4', textAlign: 'center', padding: '24px 0', fontSize: 11.5, color: '#888' }}>
                Không tìm thấy 3D Emoji phù hợp
              </div>
            )}
          </div>
        </div>
      )}

      {/* ────────────────── SUB-TAB 2: VECTOR SHAPES ────────────────── */}
      {activeSubTab === 'shapes' && (
        <div>
          {/* Search Bar */}
          <SearchInput
            placeholder="Tìm kiếm hình khối, mũi tên..."
            value={shapeSearchTerm}
            onChange={e => setShapeSearchTerm(e.target.value)}
            onClear={() => setShapeSearchTerm('')}
            size="sm"
            fullWidth
            style={{ marginBottom: 8 }}
          />

          {/* Shapes Grid */}
          <div className={styles.shapeGrid} style={{ padding: 0 }}>
            {filteredShapes.map(s => (
              <div
                key={s.id}
                className={styles.shapeItem}
                onClick={() => handleAddShape(s)}
                title={s.label}
              >
                <svg viewBox={s.viewBox || '0 0 44 44'} width="32" height="32">
                  <path
                    d={s.svgPath}
                    fill={s.defaultFill === 'none' || s.defaultFill === 'transparent' ? 'none' : s.defaultFill}
                    stroke={s.defaultStroke}
                    strokeWidth={s.defaultStrokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span style={{ fontSize: 9.5, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                  {s.label}
                </span>
              </div>
            ))}

            {filteredShapes.length === 0 && (
              <div style={{ gridColumn: 'span 4', textAlign: 'center', padding: '20px 0', fontSize: 11, color: 'var(--text-muted)' }}>
                Không tìm thấy hình khối phù hợp
              </div>
            )}
          </div>
        </div>
      )}

      {/* ────────────────── SUB-TAB 3: DATA CHARTS & INFOGRAPHICS ────────────────── */}
      {activeSubTab === 'charts' && (
        <div>
          {/* AI Diagram Launcher Card */}
          <div
            style={{
              padding: '10px 12px',
              marginBottom: 12,
              borderRadius: 'var(--radius-md, 8px)',
              background: 'var(--surface-2, #161b22)',
              border: '1px solid var(--accent-border, rgba(190, 255, 1, 0.3))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 'var(--radius-sm, 6px)',
                  background: 'var(--accent-dim, rgba(190, 255, 1, 0.1))',
                  color: 'var(--accent, #BEFF01)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <path d="M10 6.5h4" />
                  <path d="M6.5 10v4" />
                  <path d="M17.5 10v4" />
                  <path d="M10 17.5h4" />
                </svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text, #f0f6fc)' }}>
                  AI Diagram & Sơ đồ
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-sub, #8b949e)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Vẽ từ Prompt hoặc mã Mermaid
                </div>
              </div>
            </div>
            <Button
              variant="primary"
              size="xs"
              onClick={() => setAiDiagramModalOpen(true)}
            >
              Vẽ sơ đồ
            </Button>
          </div>

          {getChartsForUi().map((grp, gIdx) => {
            const cleanTitle = grp.groupTitle.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim()
            const isCyber = cleanTitle.includes('Cyber') || grp.groupTitle.includes('Cyber')

            return (
              <div key={gIdx} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {cleanTitle}
                  </span>
                  {isCyber && <Badge variant="cyber" size="xs">PRO</Badge>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                {grp.items.map((it: any, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      addElement({
                        type: it.type,
                        left: 180,
                        top: 220,
                        width: it.defaultWidth || 336,
                        height: it.defaultHeight || 200,
                        percent: it.defaultPercent,
                        statLabel: it.defaultLabel,
                        accentColor: it.color,
                        scaleX: 1,
                        scaleY: 1,
                        angle: 0,
                        opacity: 1,
                        animPreset: it.preset,
                        ...(it.defaultPayload || {}),
                      })
                      showToast(`Đã thêm ${it.label} vào cảnh!`)
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 5,
                      padding: '7px 8px',
                      backgroundColor: 'rgba(18, 24, 38, 0.75)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 8,
                      cursor: 'pointer',
                      transition: 'all 0.16s ease',
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = 'rgba(25, 34, 52, 0.95)'
                      e.currentTarget.style.borderColor = it.color
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = `0 6px 16px rgba(0,0,0,0.45), 0 0 10px ${it.color}33`
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = 'rgba(18, 24, 38, 0.75)'
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                      e.currentTarget.style.transform = 'none'
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.25)'
                    }}
                  >
                    {/* Header: Label */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{
                        fontSize: 10.5,
                        fontWeight: 600,
                        color: 'var(--text-main)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        flex: 1,
                      }}>
                        {it.label}
                      </span>
                    </div>

                    {/* Mockup Preview Box with Floating Badge */}
                    <div style={{
                      backgroundColor: 'rgba(10, 15, 25, 0.65)',
                      borderRadius: 6,
                      border: '1px solid rgba(255, 255, 255, 0.04)',
                      overflow: 'hidden',
                      height: 44,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}>
                      <ChartMiniPreview type={it.type} color={it.color} />
                      {it.previewBadge && (
                        <span style={{
                          position: 'absolute',
                          top: 3,
                          right: 4,
                          fontSize: 7,
                          fontWeight: 800,
                          color: it.color,
                          backgroundColor: 'rgba(10, 15, 25, 0.85)',
                          border: `1px solid ${it.color}44`,
                          padding: '1px 4px',
                          borderRadius: 3.5,
                          letterSpacing: '0.2px',
                          textTransform: 'uppercase',
                          pointerEvents: 'none',
                        }}>
                          {it.previewBadge}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )})}
        </div>
      )}

      {/* ────────────────── SUB-TAB 4: LOTTIE DYNAMIC STICKERS ────────────────── */}
      {activeSubTab === 'lottie' && <LottieSection />}
    </div>
  )
}
