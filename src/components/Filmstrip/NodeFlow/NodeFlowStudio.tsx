import React, { useMemo, useRef, useState, useEffect } from 'react'
import styles from './NodeFlowStudio.module.css'
import { useEditorStore } from '@/store/useEditorStore'
import { calculateEmotionHeatData } from './utils/retentionScorer'
import EmotionHeatGraph from '../EmotionHeatBar/EmotionHeatGraph'
import FlowHealthWidget from './FlowHealthWidget'
import BrandBusNodeCard from './nodes/BrandBusNodeCard'
import SceneNodeCard from './nodes/SceneNodeCard'
import { Button } from '@/components/ui'

interface NodeFlowStudioProps {
  onClose?: () => void
  isMaximized?: boolean
  onToggleMaximize?: () => void
}

export const NodeFlowStudio: React.FC<NodeFlowStudioProps> = ({
  onClose,
  isMaximized,
  onToggleMaximize
}) => {
  const {
    scenes,
    currentSceneIdx,
    setCurrentScene,
    seekToScene,
    reorderScene,
    showToast,
    currentTimeSec,
    setProgress
  } = useEditorStore()

  const totalDur = useMemo(() => {
    return (scenes || []).reduce((sum, s) => sum + (s.duration || 3), 0)
  }, [scenes])

  const heatData = useMemo(() => {
    return calculateEmotionHeatData(scenes)
  }, [scenes])

  const containerRef = useRef<HTMLDivElement>(null)
  const busRef = useRef<HTMLDivElement>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const [wirePaths, setWirePaths] = useState<{
    brandWires: string[]
    seqWires: string[]
    svgWidth: number
    svgHeight: number
  }>({ brandWires: [], seqWires: [], svgWidth: 800, svgHeight: 400 })

  // Recompute wire bezier coordinates whenever scenes change, resize, or scroll
  const updateWires = () => {
    if (!containerRef.current || !busRef.current || !rowRef.current) return
    const containerRect = containerRef.current.getBoundingClientRect()
    const busRect = busRef.current.getBoundingClientRect()
    const sceneEls = rowRef.current.children
    const scrollLeft = containerRef.current.scrollLeft || 0
    const scrollTop = containerRef.current.scrollTop || 0

    const busPortX = busRect.left + busRect.width / 2 - containerRect.left + scrollLeft
    const busPortY = busRect.bottom - containerRect.top + scrollTop

    const newBrandWires: string[] = []
    const newSeqWires: string[] = []

    const sceneCenters: Array<{ leftX: number; rightX: number; topX: number; centerY: number; topY: number }> = []

    for (let i = 0; i < sceneEls.length; i++) {
      const el = sceneEls[i] as HTMLElement
      const bodyEl = (el.querySelector('[data-flow-node-body="true"]') as HTMLElement) || el
      const r = bodyEl.getBoundingClientRect()
      const topX = r.left + r.width / 2 - containerRect.left + scrollLeft
      const topY = r.top - containerRect.top + scrollTop
      const leftX = r.left - containerRect.left + scrollLeft
      const rightX = r.right - containerRect.left + scrollLeft
      const centerY = r.top + r.height / 2 - containerRect.top + scrollTop

      sceneCenters.push({ leftX, rightX, topX, centerY, topY })

      // Bezier curve from Brand Bus down to Scene top port
      const cpY1 = busPortY + (topY - busPortY) * 0.5
      const cpY2 = busPortY + (topY - busPortY) * 0.5
      newBrandWires.push(`M ${busPortX} ${busPortY} C ${busPortX} ${cpY1}, ${topX} ${cpY2}, ${topX} ${topY}`)
    }

    // Sequence wires between adjacent scenes
    for (let i = 0; i < sceneCenters.length - 1; i++) {
      const start = sceneCenters[i]
      const end = sceneCenters[i + 1]
      const cpX1 = start.rightX + (end.leftX - start.rightX) * 0.5
      const cpX2 = start.rightX + (end.leftX - start.rightX) * 0.5
      newSeqWires.push(`M ${start.rightX} ${start.centerY} C ${cpX1} ${start.centerY}, ${cpX2} ${end.centerY}, ${end.leftX} ${end.centerY}`)
    }

    setWirePaths({
      brandWires: newBrandWires,
      seqWires: newSeqWires,
      svgWidth: Math.max(containerRect.width, containerRef.current.scrollWidth),
      svgHeight: Math.max(containerRect.height, containerRef.current.scrollHeight)
    })
  }

  useEffect(() => {
    updateWires()
    const timer = setTimeout(updateWires, 100)
    const container = containerRef.current
    window.addEventListener('resize', updateWires)
    container?.addEventListener('scroll', updateWires)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updateWires)
      container?.removeEventListener('scroll', updateWires)
    }
  }, [scenes.length, totalDur, isMaximized])

  const handleSelectScene = (idx: number) => {
    setCurrentScene(idx)
    seekToScene(idx)
  }

  const handleReorder = (fromIdx: number, toIdx: number) => {
    reorderScene(fromIdx, toIdx)
    showToast(`Đã chuyển Cảnh ${fromIdx + 1} sang vị trí ${toIdx + 1}`)
  }

  return (
    <div className={styles.studioContainer}>
      {/* 1. Sleek 1-Row Studio Header */}
      <div className={styles.topBar}>
        <div className={styles.breadcrumbGroup}>
          <span className={styles.breadcrumbRoot}>Dự án</span>
          <span className={styles.breadcrumbDivider}>/</span>
          <span className={styles.breadcrumbCurrent}>Sơ đồ Luồng Kịch bản (Story Flow)</span>
        </div>

        <div className={styles.topActions}>
          <FlowHealthWidget metrics={heatData.overallHealth} />

          {onToggleMaximize && (
            <Button
              asIcon
              variant="ghost"
              size="icon-xs"
              onClick={onToggleMaximize}
              title={isMaximized ? "Thu nhỏ về giao diện chia đôi (~)" : "Phóng to toàn màn hình (~)"}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                {isMaximized ? (
                  <path d="M4 14h6v6m10-10h-6V4m0 6l7-7M4 20l7-7" />
                ) : (
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                )}
              </svg>
            </Button>
          )}

          {onClose && (
            <Button
              asIcon
              variant="ghost"
              size="icon-xs"
              onClick={onClose}
              title="Quay lại Dòng thời gian Timeline"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Middle Central Canvas (Brand Bus & Scene Nodes) */}
      <div ref={containerRef} className={styles.canvasWrapper}>
        <svg
          className={styles.svgOverlay}
          width={wirePaths.svgWidth}
          height={wirePaths.svgHeight}
        >
          {/* Brand Bus Broadcast Wires */}
          {wirePaths.brandWires.map((d, i) => (
            <path key={`brand-${i}`} d={d} className={styles.wireBrand} />
          ))}

          {/* Sequence Wires Between Scenes */}
          {wirePaths.seqWires.map((d, i) => (
            <path key={`seq-${i}`} d={d} className={styles.wireSequence} />
          ))}
        </svg>

        {/* Brand Style Bus Node */}
        <div ref={busRef} className={styles.brandBusRow}>
          <BrandBusNodeCard
            onClick={() => showToast('Brand Style Bus: Nhận diện thương hiệu đang phát tín hiệu tới toàn bộ cảnh!')}
          />
        </div>

        {/* Horizontal Scene Nodes Chain */}
        <div ref={rowRef} className={styles.scenesRow}>
          {scenes.map((scene, idx) => (
            <div key={scene.id} className={styles.sceneWrapper}>
              <SceneNodeCard
                scene={scene}
                index={idx}
                total={scenes.length}
                isActive={currentSceneIdx === idx}
                onSelect={handleSelectScene}
                onReorder={handleReorder}
                onExpandToggle={() => {
                  setTimeout(updateWires, 60)
                  setTimeout(updateWires, 220)
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Bottom Docked Emotion Heat Spline Wave Graph */}
      <EmotionHeatGraph
        scenes={scenes}
        totalDur={totalDur}
        currentTimeSec={currentTimeSec}
        onSeek={(sec) => {
          if (totalDur > 0) {
            setProgress((sec / totalDur) * 100)
          }
        }}
      />
    </div>
  )
}

export default NodeFlowStudio
