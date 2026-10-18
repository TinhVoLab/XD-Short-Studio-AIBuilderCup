import React, { useState, useMemo } from 'react'
import styles from '../Panels.module.css'
import { useEditorStore } from '@/store/useEditorStore'
import { useShallow } from 'zustand/react/shallow'
import { LOTTIE_STICKER_CATALOG, LOTTIE_CATEGORIES, LottieStickerItem } from '@/config/lottiePresetCatalog'
import { HAND_DRAWN_CATALOG, HAND_DRAWN_SPECS, HandDrawnPathItem } from '@/config/handDrawnCatalog'
import { SegmentedControl, SearchInput, FilterTabs } from '@/components/ui'

export const LottieSection: React.FC = () => {
  const { currentSceneIdx, showToast, addElement, brandColor } = useEditorStore(
    useShallow(s => ({
      currentSceneIdx: s.currentSceneIdx,
      showToast: s.showToast,
      addElement: s.addElement,
      brandColor: s.brandingSettings?.brandColor || '#BEFF01',
    }))
  )

  const [mainMode, setMainMode] = useState<'stickers' | 'handdrawn'>('stickers')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState<string>('')

  // Filter stickers by category and search keyword (Mode 1)
  const filteredStickers = useMemo(() => {
    return LOTTIE_STICKER_CATALOG.filter(item => {
      const matchCategory = selectedCategory === 'all' || item.category === selectedCategory
      const q = searchTerm.trim().toLowerCase()
      const matchSearch = q === '' ||
        item.name.toLowerCase().includes(q) ||
        item.tags.some(t => t.toLowerCase().includes(q))
      return matchCategory && matchSearch
    })
  }, [selectedCategory, searchTerm])

  // Filter hand-drawn paths by search keyword directly (Mode 2 - No categories needed)
  const filteredHandDrawn = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return HAND_DRAWN_CATALOG.filter(item => {
      return q === '' ||
        item.name.toLowerCase().includes(q) ||
        item.tags.some(t => t.toLowerCase().includes(q))
    })
  }, [searchTerm])

  const handleAddLottie = (item: LottieStickerItem) => {
    addElement({
      type: 'lottie',
      left: 180,
      top: 300,
      width: item.defaultWidth,
      height: item.defaultHeight,
      scaleX: 1,
      scaleY: 1,
      angle: 0,
      opacity: 1,
      accentColor: item.defaultColor || '#BEFF01',
      color: item.defaultColor || '#BEFF01',
      lottiePreset: item.preset as any,
      animPreset: 'zoom-in',
      animDuration: 0.4,
    })
    showToast(`Đã thêm "${item.name}" vào cảnh ${currentSceneIdx + 1}!`)
  }

  const handleAddHandDrawn = (item: HandDrawnPathItem) => {
    const brandColor = useEditorStore.getState().brandingSettings?.brandColor || item.defaultColor || HAND_DRAWN_SPECS.defaultAccent;
    addElement({
      type: 'hand-drawn',
      left: HAND_DRAWN_SPECS.defaultSpawnLeft,
      top: HAND_DRAWN_SPECS.defaultSpawnTop,
      width: item.defaultWidth || HAND_DRAWN_SPECS.defaultWidth,
      height: item.defaultHeight || HAND_DRAWN_SPECS.defaultHeight,
      scaleX: 1,
      scaleY: 1,
      angle: 0,
      opacity: 1,
      stroke: brandColor,
      strokeWidth: item.defaultStrokeWidth || HAND_DRAWN_SPECS.defaultStrokeWidth,
      accentColor: brandColor,
      color: brandColor,
      secondaryColor: HAND_DRAWN_SPECS.defaultSecondaryColor,
      secondarySvgContent: item.secondaryPathD,
      fillRule: item.fillRule,
      svgContent: item.pathD,
      viewBox: item.viewBox,
      animPreset: 'none',
      animDuration: HAND_DRAWN_SPECS.defaultAnimDuration,
    })
    showToast(`Đã thêm nét vẽ "${item.name}"!`)
  }

  const stickerCategoryTabItems = useMemo(() => {
    return LOTTIE_CATEGORIES.map(c => ({
      id: c.id,
      label: c.label,
    }))
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 🌟 Segment Switcher: Sticker Động vs Nét Vẽ Tay */}
      <div style={{ marginBottom: 10 }}>
        <SegmentedControl
          options={[
            { value: 'stickers', label: 'Sticker động' },
            { value: 'handdrawn', label: 'Nét vẽ tay' }
          ]}
          value={mainMode}
          onChange={(val) => {
            setMainMode(val as any)
            setSearchTerm('')
          }}
          size="xs"
          fullWidth
        />
      </div>

      {/* 🔍 Search Bar */}
      <SearchInput
        placeholder={mainMode === 'stickers' ? 'Tìm kiếm sticker...' : 'Tìm nét vẽ tay...'}
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        onClear={() => setSearchTerm('')}
        inputSize="sm"
        fullWidth
        style={{ marginBottom: 8 }}
      />

      {/* ── MODE 1: LOTTIE STICKERS (Có danh mục nhiều mục) ── */}
      {mainMode === 'stickers' && (
        <>
          <FilterTabs
            tabs={stickerCategoryTabItems}
            activeId={selectedCategory}
            onChange={setSelectedCategory}
            size="xs"
            asSelect
            selectThreshold={6}
            style={{ marginBottom: 10 }}
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 8,
              padding: '2px 0'
            }}
          >
            {filteredStickers.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleAddLottie(item)}
                title={`${item.name}\n${item.description}`}
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
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
                  e.currentTarget.style.borderColor = 'rgba(190,255,1,0.4)'
                  e.currentTarget.style.backgroundColor = 'rgba(190,255,1,0.08)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'
                }}
              >
                <span style={{ fontSize: 24, marginBottom: 2 }}>{item.emoji}</span>
                <span
                  style={{
                    fontSize: 9.5,
                    color: '#BBB',
                    marginTop: 2,
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%',
                    padding: '0 2px'
                  }}
                >
                  {item.name}
                </span>
              </button>
            ))}

            {filteredStickers.length === 0 && (
              <div style={{ gridColumn: 'span 4', textAlign: 'center', padding: '24px 0', fontSize: 11.5, color: '#888' }}>
                Không tìm thấy sticker phù hợp
              </div>
            )}
          </div>
        </>
      )}

      {/* ── MODE 2: HAND-DRAWN VECTOR PATHS (Compact, Bỏ emoji & Bỏ Category pills) ── */}
      {mainMode === 'handdrawn' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 6,
            padding: '2px 0'
          }}
        >
          {filteredHandDrawn.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleAddHandDrawn(item)}
              title={`${item.name}\n${item.description}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px 6px 8px 6px',
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                gap: 4
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.borderColor = 'rgba(190,255,1,0.35)'
                e.currentTarget.style.backgroundColor = 'rgba(190,255,1,0.06)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'
              }}
            >
              <div style={{ width: '100%', height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 2 }}>
                <svg
                  viewBox={item.viewBox}
                  style={{
                    maxWidth: '85%',
                    maxHeight: '100%',
                    overflow: 'visible'
                  }}
                >
                  {item.fillRule === 'evenodd' ? (
                    <>
                      {item.secondaryPathD && (
                        <path
                          d={item.secondaryPathD}
                          fill="#FFFFFF"
                          fillRule={item.fillRule}
                          opacity={0.85}
                        />
                      )}
                      <path
                        d={item.pathD}
                        fill={brandColor}
                        fillRule={item.fillRule}
                        style={{ filter: `drop-shadow(0 0 5px ${brandColor}55)` }}
                      />
                    </>
                  ) : (
                    <path
                      d={item.pathD}
                      fill="none"
                      stroke={brandColor}
                      strokeWidth={item.defaultStrokeWidth || 4.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ filter: `drop-shadow(0 0 5px ${brandColor}55)` }}
                    />
                  )}
                </svg>
              </div>

              <span
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  color: '#DDD',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  width: '100%',
                  padding: '0 2px'
                }}
              >
                {item.name}
              </span>
            </button>
          ))}

          {filteredHandDrawn.length === 0 && (
            <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '24px 0', fontSize: 11.5, color: '#888' }}>
              Không tìm thấy nét vẽ phù hợp
            </div>
          )}
        </div>
      )}
    </div>
  )
}
