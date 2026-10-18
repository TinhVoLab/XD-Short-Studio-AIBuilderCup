import styles from './Tabs.module.css'
import { useEditorStore } from '@/store/useEditorStore'
import { useShallow } from 'zustand/react/shallow'
import { Button } from '@/components/ui'
import { ELEMENTS_REGISTRY } from '@/config/elementsRegistry'

// Specific Component Inspectors
import { MasterHookInspector } from './inspectors/MasterHookInspector'
import { MasterSceneInspector } from './inspectors/MasterSceneInspector'
import { SocialCalloutInspector } from './inspectors/SocialCalloutInspector'
import { DocumentEvidenceInspector } from './inspectors/DocumentEvidenceInspector'
import { StatBigInspector } from './inspectors/StatBigInspector'
import { HighlightBoxInspector } from './inspectors/HighlightBoxInspector'
import { QuoteBoxInspector } from './inspectors/QuoteBoxInspector'
import { SankeyChartInspector } from './inspectors/SankeyChartInspector'
import { PyramidFunnelInspector } from './inspectors/PyramidFunnelInspector'
import { CandlestickInspector } from './inspectors/CandlestickInspector'
import { RacingBarInspector } from './inspectors/RacingBarInspector'
import { WaterfallInspector } from './inspectors/WaterfallInspector'
import { LineChartInspector } from './inspectors/LineChartInspector'
import { ChartBarInspector } from './inspectors/ChartBarInspector'
import { PieChartInspector } from './inspectors/PieChartInspector'
import { GaugeChartInspector } from './inspectors/GaugeChartInspector'
import { HeatmapMatrixInspector } from './inspectors/HeatmapMatrixInspector'
import { RadarChartInspector } from './inspectors/RadarChartInspector'
import { TreeDiagramInspector } from './inspectors/TreeDiagramInspector'
import { DynamicDiagramInspector } from './inspectors/DynamicDiagramInspector'
import { NetworkGraphInspector } from './inspectors/NetworkGraphInspector'
import { CircleChartInspector } from './inspectors/CircleChartInspector'
import { ChecklistInspector } from './inspectors/ChecklistInspector'
import { NumberedListInspector } from './inspectors/NumberedListInspector'
import { FlowchartInspector } from './inspectors/FlowchartInspector'
import { TimelineInspector } from './inspectors/TimelineInspector'
import { TableInspector } from './inspectors/TableInspector'
import { VsBattleInspector } from './inspectors/VsBattleInspector'
import { BreathingCircleInspector } from './inspectors/BreathingCircleInspector'
import { FakeSearchInspector } from './inspectors/FakeSearchInspector'
import { PushNotificationInspector } from './inspectors/PushNotificationInspector'
import { FrameMockupInspector } from './inspectors/FrameMockupInspector'
import { CharacterMascotInspector } from './inspectors/CharacterMascotInspector'
import { ChatMockupInspector } from './inspectors/ChatMockupInspector'
import { DataFlowInspector } from './inspectors/DataFlowInspector'
import { BranchingFlowInspector } from './inspectors/BranchingFlowInspector'
import { ParallelFlowInspector } from './inspectors/ParallelFlowInspector'
import { MindmapFlowInspector } from './inspectors/MindmapFlowInspector'
import { KnowledgeGraphInspector } from './inspectors/KnowledgeGraphInspector'
import { FunnelFlowInspector } from './inspectors/FunnelFlowInspector'
import { RoadmapFlowInspector } from './inspectors/RoadmapFlowInspector'
import { CyberFlowInspector } from './inspectors/CyberFlowInspector'
import { HologramBarInspector } from './inspectors/HologramBarInspector'
import { ImageInspector } from './inspectors/ImageInspector'
import { VideoInspector } from './inspectors/VideoInspector'
import { BasicTextInspector } from './inspectors/BasicTextInspector'
import { BadgeInspector } from './inspectors/BadgeInspector'
import { AudioWaveformInspector } from './inspectors/AudioWaveformInspector'
import { StemInspector } from './inspectors/StemInspector'
import { PhysicsInspector } from './inspectors/PhysicsInspector'
import { AlgorithmInspector } from './inspectors/AlgorithmInspector'
import { QuizInspector } from './inspectors/QuizInspector'
import { VocabInspector } from './inspectors/VocabInspector'
import { GenerativeSvgInspector } from './inspectors/GenerativeSvgInspector'
import { CodeTerminalInspector } from './inspectors/CodeTerminalInspector'
import { VisualParadoxInspector } from './inspectors/VisualParadoxInspector'
import { HandDrawnInspector } from './inspectors/HandDrawnInspector'
import { SceneBackgroundInspector } from './inspectors/SceneBackgroundInspector'
import { ElementAlignmentToolbar } from './inspectors/ElementAlignmentToolbar'
import AiChartMagicToolbar from '../components/AiChartMagicToolbar'

export default function DesignTab() {
  const {
    inspector: ins,
    setInspector,
    showToast,
    selectedElementId,
    updateElement,
    updateScene,
    applyBackgroundToAllScenes,
    applyProgressBarToAllScenes,
    applyViralEffectsToAllScenes,
    applyCameraAndTransitionToAllScenes,
    applyFontToAllScenes,
    applyStyleToAllScenes,
    removeElement,
    addElement,
    scenes,
    currentSceneIdx,
  } = useEditorStore(
    useShallow(s => ({
      inspector: s.inspector,
      setInspector: s.setInspector,
      showToast: s.showToast,
      selectedElementId: s.selectedElementId,
      updateElement: s.updateElement,
      updateScene: s.updateScene,
      applyBackgroundToAllScenes: s.applyBackgroundToAllScenes,
      applyProgressBarToAllScenes: s.applyProgressBarToAllScenes,
      applyViralEffectsToAllScenes: s.applyViralEffectsToAllScenes,
      applyCameraAndTransitionToAllScenes: s.applyCameraAndTransitionToAllScenes,
      removeElement: s.removeElement,
      addElement: s.addElement,
      applyFontToAllScenes: s.applyFontToAllScenes,
      applyStyleToAllScenes: s.applyStyleToAllScenes,
      scenes: s.scenes,
      currentSceneIdx: s.currentSceneIdx,
    }))
  )

  const currentScene = scenes[currentSceneIdx]
  const selectedEl = currentScene?.elements.find(e => e.id === selectedElementId)

  const handleUpdate = (patch: any) => {
    setInspector(patch)
    if (selectedElementId) {
      const elPatch: any = {}
      if ('textContent' in patch) elPatch.content = patch.textContent
      if ('textColor' in patch) elPatch.color = patch.textColor
      if ('fillColor' in patch) { elPatch.fill = patch.fillColor; elPatch.bgColor = patch.fillColor; }
      if ('strokeColor' in patch) { elPatch.stroke = patch.strokeColor; elPatch.accentColor = patch.strokeColor; }
      if ('strokeWidth' in patch) elPatch.strokeWidth = patch.strokeWidth
      if ('fontSize' in patch) elPatch.fontSize = patch.fontSize
      if ('fontFamily' in patch) elPatch.fontFamily = patch.fontFamily
      if ('fontWeight' in patch) elPatch.fontWeight = patch.fontWeight
      if ('textAlign' in patch) elPatch.textAlign = patch.textAlign
      if ('animPreset' in patch) elPatch.animPreset = patch.animPreset
      if ('animDuration' in patch) elPatch.animDuration = patch.animDuration
      if ('animDelay' in patch) elPatch.animDelay = patch.animDelay

      // Forward all extended typography & element keys directly
      const legacyKeys = new Set(['textContent', 'textColor', 'fillColor', 'strokeColor', 'strokeWidth', 'fontSize', 'fontFamily', 'fontWeight', 'textAlign', 'animPreset', 'animDuration', 'animDelay'])
      for (const k in patch) {
        if (!legacyKeys.has(k)) {
          elPatch[k] = patch[k]
        }
      }

      updateElement(selectedElementId, elPatch)
    }
  }

  const inspectorProps = {
    element: selectedEl as any,
    updateElement,
    showToast,
    setInspector,
    inspector: ins,
  }

  return (
    <div className={styles.tab}>
      {/* Selected Element Header */}
      {selectedEl ? (
        <div className={styles.layerPill}>
          <div className={styles.layerPillTitle}>
            <span style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--accent)' }}>
              {selectedEl.type === 'text' || selectedEl.type === 'caption' ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>
              ) : selectedEl.type === 'quote-box' ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.75-2-2-2H4c-1.25 0-2 .75-2 2v6c0 1.25.75 2 2 2 1 0 1 0 1 1 0 2.5-1 4.5-2 5M15 21c3 0 7-1 7-8V5c0-1.25-.75-2-2-2h-4c-1.25 0-2 .75-2 2v6c0 1.25.75 2 2 2 1 0 1 0 1 1 0 2.5-1 4.5-2 5"/></svg>
              ) : selectedEl.type === 'radar-chart' ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
              ) : selectedEl.type.includes('chart') || selectedEl.type === 'stat-big' ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
              ) : selectedEl.type === 'master-hook' ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
              ) : selectedEl.type === 'image' || selectedEl.type === 'frame-mockup' ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              )}
            </span>
            <span>
              {ELEMENTS_REGISTRY[selectedEl.type]?.ui?.label || `${selectedEl.type.replace(/-/g, ' ')} layer`}
            </span>
          </div>
          <div className={styles.layerPillActions}>
            <Button
              asIcon
              variant="secondary"
              size="icon-xs"
              onClick={() => {
                const { id: _, ...rest } = selectedEl
                addElement({
                  ...rest,
                  left: (selectedEl.left ?? 0) + 20,
                  top: (selectedEl.top ?? 0) + 20,
                })
                showToast('Đã nhân bản layer')
              }}
              title="Nhân bản layer này (Duplicate)"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </Button>
            <Button
              asIcon
              variant="danger"
              size="icon-xs"
              onClick={() => {
                removeElement(selectedEl.id)
                showToast('Đã xóa phần tử')
              }}
              title="Xóa phần tử này (Delete)"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </Button>
          </div>
        </div>
      ) : (
        <div className={styles.scenePill}>
          <div className={styles.scenePillTitle}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
              <line x1="7" y1="2" x2="7" y2="22" />
              <line x1="17" y1="2" x2="17" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <line x1="2" y1="7" x2="7" y2="7" />
              <line x1="2" y1="17" x2="7" y2="17" />
              <line x1="17" y1="17" x2="22" y2="17" />
              <line x1="17" y1="7" x2="22" y2="7" />
            </svg>
            <span>CẢNH {currentSceneIdx + 1} / {scenes.length}</span>
          </div>
          <span className={styles.scenePillMeta}>
            {(currentScene?.duration || 3).toFixed(1)}s • {currentScene?.elements.length || 0} layer
          </span>
        </div>
      )}

      {/* Quick Alignment Toolbar */}
      <ElementAlignmentToolbar />

      {/* AI Magic Fill Toolbar (Auto-detects if element supports it) */}
      <AiChartMagicToolbar element={selectedEl} />

      {/* ── DYNAMIC ELEMENT-SPECIFIC INSPECTORS ── */}
      {selectedEl?.type === 'master-hook' && <MasterHookInspector {...inspectorProps} />}
      {selectedEl?.type === 'master-scene' && <MasterSceneInspector {...inspectorProps} />}
      {selectedEl?.type === 'social-callout' && <SocialCalloutInspector {...inspectorProps} />}
      {selectedEl?.type === 'document-evidence' && <DocumentEvidenceInspector {...inspectorProps} />}
      {selectedEl?.type === 'stat-big' && <StatBigInspector {...inspectorProps} />}
      {selectedEl?.type === 'highlight-box' && <HighlightBoxInspector {...inspectorProps} />}
      {selectedEl?.type === 'quote-box' && <QuoteBoxInspector {...inspectorProps} />}
      {selectedEl?.type === 'sankey-chart' && <SankeyChartInspector {...inspectorProps} />}
      {selectedEl?.type === 'pyramid-funnel' && <PyramidFunnelInspector {...inspectorProps} />}
      {selectedEl?.type === 'candlestick-chart' && <CandlestickInspector {...inspectorProps} />}
      {selectedEl?.type === 'racing-bar-chart' && <RacingBarInspector {...inspectorProps} />}
      {selectedEl?.type === 'waterfall-chart' && <WaterfallInspector {...inspectorProps} />}
      {selectedEl?.type === 'line-chart' && <LineChartInspector {...inspectorProps} />}
      {selectedEl?.type === 'chart-bar' && <ChartBarInspector {...inspectorProps} />}
      {selectedEl?.type === 'pie-chart' && <PieChartInspector {...inspectorProps} />}
      {selectedEl?.type === 'gauge-chart' && <GaugeChartInspector {...inspectorProps} />}
      {selectedEl?.type === 'heatmap-matrix' && <HeatmapMatrixInspector {...inspectorProps} />}
      {selectedEl?.type === 'radar-chart' && <RadarChartInspector {...inspectorProps} />}
      {selectedEl?.type === 'tree-diagram' && <TreeDiagramInspector {...inspectorProps} />}
      {selectedEl?.type === 'dynamic-diagram' && <DynamicDiagramInspector {...inspectorProps} />}
      {selectedEl?.type === 'network-graph' && <NetworkGraphInspector {...inspectorProps} />}
      {selectedEl?.type === 'circle-chart' && <CircleChartInspector {...inspectorProps} />}
      {selectedEl?.type === 'checklist' && <ChecklistInspector {...inspectorProps} />}
      {selectedEl?.type === 'numbered-list' && <NumberedListInspector {...inspectorProps} />}
      {selectedEl?.type === 'flowchart' && <FlowchartInspector {...inspectorProps} />}
      {selectedEl?.type === 'timeline' && <TimelineInspector {...inspectorProps} />}
      {selectedEl?.type === 'table' && <TableInspector {...inspectorProps} />}
      {selectedEl?.type === 'vs-battle' && <VsBattleInspector {...inspectorProps} />}
      {selectedEl?.type === 'breathing-circle' && <BreathingCircleInspector {...inspectorProps} />}
      {selectedEl?.type === 'fake-search' && <FakeSearchInspector {...inspectorProps} />}
      {selectedEl?.type === 'push-notification' && <PushNotificationInspector {...inspectorProps} />}
      {selectedEl?.type === 'frame-mockup' && <FrameMockupInspector {...inspectorProps} />}
      {selectedEl?.type === 'image' && <ImageInspector {...inspectorProps} />}
      {selectedEl?.type === 'video' && <VideoInspector {...inspectorProps} />}
      {selectedEl?.type === 'character-mascot' && <CharacterMascotInspector {...inspectorProps} />}
      {selectedEl?.type === 'chat-mockup' && <ChatMockupInspector {...inspectorProps} />}
      {selectedEl?.type === 'code-terminal' && <CodeTerminalInspector {...inspectorProps} />}
      {selectedEl?.type === 'data-flow' && <DataFlowInspector {...inspectorProps} />}
      {selectedEl?.type === 'branching-flow' && <BranchingFlowInspector {...inspectorProps} />}
      {selectedEl?.type === 'parallel-flow' && <ParallelFlowInspector {...inspectorProps} />}
      {selectedEl?.type === 'mindmap-flow' && <MindmapFlowInspector {...inspectorProps} />}
      {selectedEl?.type === 'knowledge-graph' && <KnowledgeGraphInspector {...inspectorProps} />}
      {selectedEl?.type === 'funnel-flow' && <FunnelFlowInspector {...inspectorProps} />}
      {selectedEl?.type === 'roadmap-flow' && <RoadmapFlowInspector {...inspectorProps} />}

      {/* ── CYBER & DYNAMIC FLOW [PRO] ── */}
      {selectedEl?.type === 'hologram-bar' && <HologramBarInspector {...inspectorProps} />}
      {(selectedEl?.type === 'orbit-system' ||
        selectedEl?.type === 'signal-wave' ||
        selectedEl?.type === 'cyber-matrix' ||
        selectedEl?.type === 'speed-meter' ||
        selectedEl?.type === 'liquid-fill' ||
        selectedEl?.type === 'neuron-network' ||
        selectedEl?.type === 'timeline-pulse' ||
        selectedEl?.type === 'lifecycle-matrix') && (
        <CyberFlowInspector {...inspectorProps} />
      )}

      {/* ── AUDIO WAVEFORM INSPECTOR ── */}
      {selectedEl?.type === 'audio-waveform' && <AudioWaveformInspector {...inspectorProps} />}

      {/* ── STEM SCIENTIFIC MODULE INSPECTOR ── */}
      {selectedEl && ['math-plot', 'chemical-molecule', 'latex-formula'].includes(selectedEl.type) && (
        <StemInspector {...inspectorProps} />
      )}

      {/* ── 2D PHYSICS SIMULATION INSPECTOR ── */}
      {selectedEl?.type === 'physics-sim' && (
        <PhysicsInspector {...inspectorProps} sceneDuration={currentScene?.duration || 10} />
      )}

      {/* ── ALGORITHM SIMULATION INSPECTOR ── */}
      {selectedEl?.type === 'algorithm-sim' && (
        <AlgorithmInspector {...inspectorProps} sceneDuration={currentScene?.duration || 10} />
      )}

      {/* ── INTERACTIVE QUIZ INSPECTOR ── */}
      {selectedEl?.type === 'interactive-quiz' && <QuizInspector {...inspectorProps} />}

      {/* ── VOCABULARY FLASHCARD INSPECTOR ── */}
      {selectedEl?.type === 'vocab-card' && <VocabInspector {...inspectorProps} />}

      {/* ── GENERATIVE SVG MATHEMATICAL VECTOR INSPECTOR ── */}
      {selectedEl?.type === 'generative-svg' && <GenerativeSvgInspector {...inspectorProps} />}

      {/* ── VISUAL PARADOX MATHEMATICAL SIMULATION INSPECTOR ── */}
      {selectedEl?.type === 'visual-paradox' && <VisualParadoxInspector {...inspectorProps} />}

      {/* ── HAND-DRAWN DOODLE VECTOR INSPECTOR ── */}
      {selectedEl?.type === 'hand-drawn' && <HandDrawnInspector {...inspectorProps} />}

      {/* ── SCENE BACKGROUND INSPECTOR (Khi click vào khoảng trống Canvas) ── */}
      {!selectedEl && currentScene && (
        <SceneBackgroundInspector
          currentScene={currentScene}
          sceneIndex={currentSceneIdx}
          totalScenes={scenes.length}
          updateScene={updateScene}
          applyBackgroundToAllScenes={applyBackgroundToAllScenes}
          applyProgressBarToAllScenes={applyProgressBarToAllScenes}
          applyViralEffectsToAllScenes={applyViralEffectsToAllScenes}
          applyCameraAndTransitionToAllScenes={applyCameraAndTransitionToAllScenes}
          showToast={showToast}
        />
      )}

      {/* ── BADGE INSPECTOR ── */}
      {selectedEl && selectedEl.type === 'badge' && (
        <BadgeInspector
          {...inspectorProps}
          applyFontToAllScenes={applyFontToAllScenes}
        />
      )}

      {/* ── STANDARD BASIC TEXT INSPECTOR ── */}
      {selectedEl && ['text', 'caption', 'icon-text'].includes(selectedEl.type) && (
        <BasicTextInspector
          {...inspectorProps}
          applyFontToAllScenes={applyFontToAllScenes}
          applyStyleToAllScenes={applyStyleToAllScenes}
          handleUpdate={handleUpdate}
        />
      )}
    </div>
  )
}
