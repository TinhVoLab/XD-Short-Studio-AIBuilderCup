import { StateCreator } from 'zustand'
import { ElementSlice, EditorStore, InspectorState } from '../storeTypes'
import { SceneElement, ElementKeyframe } from '@/types/scene'
import { calculateAlignedPositions, calculateDistributedPositions } from '@/utils/alignment'
import { assignViralRoles } from '@/utils/temporalContrast'
import { pushSnapshot } from './historySlice'
import { calculateElementDynamicHeight, calculateBadgeDimensions } from '@/config/layoutRegistry'
import { resolveThemePalette, getPaletteCssVariables } from '@/utils/themeResolver'
import { swapElementThemeColors } from '@/utils/templatePaletteMapper'

export const DEFAULT_INSPECTOR: InspectorState = {
  textContent:   'TIÊU ĐỀ NỘI DUNG',
  fontFamily:    'Be Vietnam Pro',
  fontWeight:    '900',
  fontSize:      72,
  textColor:     '#BEFF01',
  textAlign:     'left',
  animPreset:    'slide-up',
  animDuration:  0.6,
  animDelay:     0.1,
  strokeColor:   '#BEFF01',
  strokeWidth:   4,
  strokeEnabled: true,
  shadowEnabled: true,
  blur:          20,
  opacity:       100,
  bgColor:       '#040404',
}

export const createElementSlice: StateCreator<
  EditorStore,
  [],
  [],
  ElementSlice
> = (set, get) => ({
  selectedElementId: null,
  selectedElementIds: [],
  inspector: DEFAULT_INSPECTOR,
  safeZonePlatform: 'none',
  showRulers: true,

  setSafeZonePlatform: (p) => set({ safeZonePlatform: p }),
  setShowRulers: (v) => set({ showRulers: v }),
  toggleShowRulers: () => set(s => ({ showRulers: !s.showRulers })),

  setSelectedElements: (ids) => set(s => {
    const firstId = ids[0] || null
    if (!firstId) {
      return { selectedElementId: null, selectedElementIds: [], selectedAudioClipId: null }
    }
    const curScene = s.scenes[s.currentSceneIdx]
    const el = curScene?.elements.find(e => e.id === firstId)
    const inspectorPatch: Partial<InspectorState> = el ? {
      textContent:   el.content     ?? s.inspector.textContent,
      fontSize:      el.fontSize    ?? s.inspector.fontSize,
      fontFamily:    el.fontFamily  ?? s.inspector.fontFamily,
      fontWeight:    String(el.fontWeight ?? s.inspector.fontWeight),
      textColor:     el.color       ?? s.inspector.textColor,
      textAlign:     (el.textAlign  ?? s.inspector.textAlign) as InspectorState['textAlign'],
      animPreset:    el.animPreset  ?? s.inspector.animPreset,
      animDuration:  el.animDuration ?? s.inspector.animDuration,
      animDelay:     el.animDelay   ?? s.inspector.animDelay,
      strokeColor:   el.stroke      ?? el.accentColor ?? s.inspector.strokeColor,
      blur:          el.blur        ?? 0,
      opacity:       ((el.opacity   ?? 1) * 100),
      bgColor:       el.bgColor     ?? el.fill ?? s.inspector.bgColor,
    } : {}
    return {
      selectedElementId: firstId,
      selectedElementIds: ids,
      selectedAudioClipId: null,
      inspector: { ...s.inspector, ...inspectorPatch }
    }
  }),

  setSelectedElement: (id) => {
    if (!id) {
      set({ selectedElementId: null, selectedElementIds: [], selectedAudioClipId: null })
      return
    }
    const state = get()
    const el = state.scenes[state.currentSceneIdx]?.elements.find(e => e.id === id)
    const inspectorPatch: Partial<InspectorState> = el ? {
      textContent:   el.content     ?? state.inspector.textContent,
      fontSize:      el.fontSize    ?? state.inspector.fontSize,
      fontFamily:    el.fontFamily  ?? state.inspector.fontFamily,
      fontWeight:    String(el.fontWeight ?? state.inspector.fontWeight),
      textColor:     el.color       ?? state.inspector.textColor,
      textAlign:     (el.textAlign  ?? state.inspector.textAlign) as InspectorState['textAlign'],
      animPreset:    el.animPreset  ?? state.inspector.animPreset,
      animDuration:  el.animDuration ?? state.inspector.animDuration,
      animDelay:     el.animDelay   ?? state.inspector.animDelay,
      strokeColor:   el.stroke      ?? el.accentColor ?? state.inspector.strokeColor,
      blur:          el.blur        ?? 0,
      opacity:       ((el.opacity   ?? 1) * 100),
      bgColor:       el.bgColor     ?? el.fill ?? state.inspector.bgColor,
    } : {}
    set({ selectedElementId: id, selectedElementIds: [id], selectedAudioClipId: null, inspectorOpen: true, inspector: { ...state.inspector, ...inspectorPatch } })
  },

  alignElements: (elementIds, alignment, context) => set(s => {
    const hist = pushSnapshot(s, 'Căn chỉnh phần tử')
    const currentScene = s.scenes[s.currentSceneIdx]
    if (!currentScene) return {}

    const newPositions = calculateAlignedPositions(currentScene.elements, elementIds, alignment, context)
    if (newPositions.size === 0) return {}

    const scenes = s.scenes.map((scene, i) => {
      if (i !== s.currentSceneIdx) return scene
      return {
        ...scene,
        elements: scene.elements.map(el => {
          const patch = newPositions.get(el.id)
          return patch ? { ...el, ...patch } : el
        })
      }
    })
    return { ...hist, scenes, isSaved: false }
  }),

  distributeElements: (elementIds, axis) => set(s => {
    const hist = pushSnapshot(s, 'Phân bổ khoảng cách phần tử')
    const currentScene = s.scenes[s.currentSceneIdx]
    if (!currentScene) return {}

    const newPositions = calculateDistributedPositions(currentScene.elements, elementIds, axis)
    if (newPositions.size === 0) return {}

    const scenes = s.scenes.map((scene, i) => {
      if (i !== s.currentSceneIdx) return scene
      return {
        ...scene,
        elements: scene.elements.map(el => {
          const patch = newPositions.get(el.id)
          return patch ? { ...el, ...patch } : el
        })
      }
    })
    return { ...hist, scenes, isSaved: false }
  }),

  updateElement: (id, patch) => set(s => {
    const hist = pushSnapshot(s, 'Chỉnh sửa phần tử', 350)
    const dynamicTypes = ['flowchart', 'quote-box', 'checklist', 'ranking-list', 'timeline', 'table', 'vs-battle', 'highlight-box', 'knowledge-graph', 'pie-chart', 'master-hook', 'master-scene', 'dynamic-diagram', 'chart-bar', 'circle-chart', 'gauge-chart', 'sankey-chart', 'heatmap-matrix', 'hologram-bar', 'pyramid-funnel', 'visual-paradox', 'code-terminal', 'network-graph', 'numbered-list']
    const scenes = s.scenes.map((scene, i) => {
      if (i !== s.currentSceneIdx) return scene
      return {
        ...scene,
        elements: scene.elements.map(el => {
          if (el.id !== id) return el
          const updated = { ...el, ...patch }
          if (dynamicTypes.includes(updated.type)) {
            // Automatically keep height in sync with exact content geometry
            if (!patch.height || patch.width !== undefined || patch.showCardBg !== undefined || patch.networkNodes || patch.codeData || patch.paradoxData || patch.pyramidLayers || patch.hologramBarData || patch.sankeyData || patch.heatmapData || patch.statLabel !== undefined || patch.hookData || patch.masterSceneData || patch.chartData || patch.knowledgeGraphData || patch.diagramData || patch.vsBattle || patch.tableData || patch.rows || patch.flowSteps || patch.checklistItems || patch.checklistData || patch.content || patch.variant || patch.authorName || patch.items || patch.rankingItems || (patch as any).listItems || patch.fontSize || patch.fontFamily !== undefined || patch.subtitle !== undefined) {
              const newH = calculateElementDynamicHeight(updated)
              if (Math.abs((updated.height || 0) - newH) >= 2) {
                updated.height = newH
              }
            }
          }
          if (updated.type === 'badge') {
            if (patch.content !== undefined || patch.fontSize !== undefined) {
              const bDims = calculateBadgeDimensions(updated)
              if (!patch.width) updated.width = bDims.autoW
              if (!patch.height) updated.height = bDims.autoH
              if (!patch.radius) updated.radius = bDims.radius
            }
          }
          return updated
        })
      }
    })
    return { ...hist, scenes, isSaved: false }
  }),

  applyFontToAllScenes: (fontFamily) => set(s => {
    const hist = pushSnapshot(s, 'Đổi font chữ toàn bộ')
    const nonTextTypes = ['shape', 'rect', 'line', 'divider', 'video', 'lottie', 'audio-waveform', 'chemical-molecule']
    const updatedScenes = s.scenes.map(scene => ({
      ...scene,
      elements: scene.elements.map(el => {
        if (!nonTextTypes.includes(el.type)) {
          return { ...el, fontFamily }
        }
        return el
      })
    }))
    return { ...hist, scenes: updatedScenes, isSaved: false }
  }),

  applyStyleToAllScenes: (targetElementType) => set(s => {
    const hist = pushSnapshot(s, 'Đồng bộ style phần tử toàn bộ')
    const ins = s.inspector
    const currentScene = s.scenes[s.currentSceneIdx]
    const selectedEl = currentScene?.elements.find(e => e.id === s.selectedElementId)
    const targetType = targetElementType || selectedEl?.type
    const nonTextTypes = ['shape', 'rect', 'line', 'divider', 'video', 'lottie', 'audio-waveform', 'chemical-molecule']

    const updatedScenes = s.scenes.map(scene => ({
      ...scene,
      elements: scene.elements.map(el => {
        const isTarget = targetType ? el.type === targetType : !nonTextTypes.includes(el.type)
        if (!isTarget) return el

        const patch: Partial<SceneElement> = {}
        if (ins.fontFamily) patch.fontFamily = ins.fontFamily
        if (ins.strokeEnabled !== undefined) {
          patch.stroke = ins.strokeEnabled ? (ins.strokeColor || '#000000') : undefined
          patch.strokeWidth = ins.strokeEnabled ? (ins.strokeWidth || 2) : 0
        }
        if (ins.shadowEnabled !== undefined) {
          patch.shadow = ins.shadowEnabled
        }
        if (ins.blur !== undefined) {
          patch.blur = ins.blur
        }
        if (ins.opacity !== undefined) {
          patch.opacity = Math.max(0, Math.min(1, ins.opacity / 100))
        }

        return { ...el, ...patch }
      })
    }))
    return { ...hist, scenes: updatedScenes, isSaved: false }
  }),

  applyBgColorToAllScenes: (bgColor, bgGradient) => set(s => {
    const hist = pushSnapshot(s, 'Đổi màu nền toàn bộ cảnh')
    const updatedScenes = s.scenes.map(scene => ({
      ...scene,
      bgColor,
      bgGradient: bgGradient !== undefined ? bgGradient : scene.bgGradient,
    }))
    return { ...hist, scenes: updatedScenes, isSaved: false }
  }),

  applyAuthorToAllScenes: (authorName, handle) => set(s => {
    const hist = pushSnapshot(s, 'Đổi tác giả toàn bộ')
    const updatedScenes = s.scenes.map(scene => ({
      ...scene,
      authorName,
      ...(handle ? { hudFooterRight: handle } : {})
    }))
    const updatedBranding = {
      ...s.brandingSettings,
      authorName,
      ...(handle ? { authorHandle: handle } : {})
    }
    try {
      localStorage.setItem('xd_short_branding_settings', JSON.stringify(updatedBranding))
    } catch (err) {
      console.warn('Cannot save branding settings to localStorage:', err)
    }
    return { ...hist, scenes: updatedScenes, brandingSettings: updatedBranding, isSaved: false }
  }),

  applyHudHeaderToAllScenes: (hudHeader) => set(s => {
    const hist = pushSnapshot(s, 'Đổi tiêu đề HUD toàn bộ')
    const updatedScenes = s.scenes.map(scene => ({
      ...scene,
      hudHeader: hudHeader !== undefined ? hudHeader : scene.hudHeader
    }))
    return { ...hist, scenes: updatedScenes, isSaved: false }
  }),

  applyAvatarToAllScenes: (authorAvatarUrl, authorAvatarPosition, authorAvatarLeft, authorAvatarTop, authorAvatarSize, authorAvatarEffect) => set(s => {
    const hist = pushSnapshot(s, 'Đổi avatar toàn bộ')
    const updatedScenes = s.scenes.map(scene => ({
      ...scene,
      authorAvatarUrl,
      ...(authorAvatarPosition ? { authorAvatarPosition } : {}),
      ...(authorAvatarLeft !== undefined ? { authorAvatarLeft } : {}),
      ...(authorAvatarTop !== undefined ? { authorAvatarTop } : {}),
      ...(authorAvatarSize !== undefined ? { authorAvatarSize } : {}),
      ...(authorAvatarEffect !== undefined ? { authorAvatarEffect } : {})
    }))
    const updatedBranding = {
      ...s.brandingSettings,
      authorAvatarUrl,
      ...(authorAvatarSize !== undefined ? { authorAvatarSize } : {})
    }
    try {
      localStorage.setItem('xd_short_branding_settings', JSON.stringify(updatedBranding))
    } catch (err) {
      console.warn('Cannot save branding settings to localStorage:', err)
    }
    return { ...hist, scenes: updatedScenes, brandingSettings: updatedBranding, isSaved: false }
  }),

  applyDisclaimerToAllScenes: (showAiDisclaimer, aiDisclaimerText) => set(s => {
    const hist = pushSnapshot(s, 'Đổi tuyên bố AI toàn bộ')
    const updatedScenes = s.scenes.map(scene => ({
      ...scene,
      showAiDisclaimer,
      ...(aiDisclaimerText !== undefined ? { aiDisclaimerText } : {})
    }))
    return { ...hist, scenes: updatedScenes, isSaved: false }
  }),

  applyBrandColorToAllScenes: (color: string) => set(s => {
    const hist = pushSnapshot(s, 'Đổi màu thương hiệu toàn bộ')
    const prevColor = s.brandingSettings.brandColor || '#BEFF01'
    
    // Update live CSS variable for Studio theme
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--accent', color)
      document.documentElement.style.setProperty('--accent-dim', `${color}18`)
      document.documentElement.style.setProperty('--accent-glow', `${color}44`)
    }

    const isAccent = (c?: string) => {
      if (!c) return false
      const lower = c.trim().toLowerCase()
      if (['#fff', '#ffffff', '#000', '#000000', '#111', '#222', '#333', '#555', '#888', '#aaa', 'rgba(255,255,255,0.7)', 'rgba(255,255,255,0.8)', 'rgba(255,255,255,0.85)', 'transparent', 'none'].includes(lower)) {
        return false
      }
      const KNOWN = ['#beff01', '#00d4ff', '#ff5544', '#ffd700', '#a855f7', '#00ff88', '#ff3366', '#00f0ff', '#f59e0b', '#10b981', '#6366f1', '#ff2d78', '#ff6b6b', '#8fa89b', '#00e676', '#86efac', prevColor.toLowerCase()]
      return KNOWN.includes(lower) || lower.startsWith('#')
    }

    const updatedScenes = s.scenes.map(scene => ({
      ...scene,
      progressBar: scene.progressBar ? { ...scene.progressBar, color } : undefined,
      elements: scene.elements.map(el => {
        const patch: Partial<SceneElement> = {}
        
        // 1. Text, Icon-Text & Caption
        if (el.type === 'text' || el.type === 'icon-text' || el.type === 'caption') {
          if (isAccent(el.color)) patch.color = color
          if (isAccent(el.stroke)) patch.stroke = color
        }
        // 2. Badge & Progress
        else if (el.type === 'badge' || el.type === 'progress') {
          patch.accentColor = color
          if (isAccent(el.bgColor)) patch.bgColor = color
          if (isAccent(el.color)) patch.color = color
        }
        // 3. Divider & Line
        else if (el.type === 'divider' || el.type === 'line') {
          patch.accentColor = color
          if (isAccent(el.fill)) patch.fill = color
          if (isAccent(el.color)) patch.color = color
          if (isAccent(el.stroke)) patch.stroke = color
        }
        // 4. Numbered List & Checklist
        else if (el.type === 'numbered-list' || el.type === 'checklist') {
          patch.accentColor = color
          if (el.type === 'numbered-list') patch.itemColor = color
        }
        // 5. Highlight Box & Quote Box
        else if (el.type === 'highlight-box' || el.type === 'quote-box') {
          patch.accentColor = color
          if (el.stroke && isAccent(el.stroke)) patch.stroke = color
          if (el.bgColor && (el.bgColor.includes('190,255,1') || el.bgColor.includes('rgba'))) {
            patch.bgColor = `${color}14`
          }
        }
        // 6. Audio Waveform & Lottie
        else if (el.type === 'audio-waveform' || el.type === 'lottie') {
          if (el.type === 'audio-waveform') patch.waveformColor = color
          patch.accentColor = color
        }
        // 7. All Charts & Graphs
        else if ([
          'gauge-chart', 'circle-chart', 'chart-bar', 'radar-chart', 'candlestick-chart', 
          'pie-chart', 'network-graph', 'racing-bar-chart', 'heatmap-matrix', 
          'waterfall-chart', 'sankey-chart', 'tree-diagram', 'line-chart'
        ].includes(el.type)) {
          patch.accentColor = color
          if (el.chartData && Array.isArray(el.chartData) && el.chartData.length > 0) {
            patch.chartData = el.chartData.map((d, i) => i === 0 ? { ...d, color } : { ...d, color: d.color && isAccent(d.color) ? `${color}CC` : d.color })
          }
          if (el.racingBarData && Array.isArray(el.racingBarData.bars) && el.racingBarData.bars.length > 0) {
            patch.racingBarData = {
              ...el.racingBarData,
              bars: el.racingBarData.bars.map((b, i) => i === 0 ? { ...b, color } : { ...b, color: b.color && isAccent(b.color) ? `${color}CC` : b.color })
            }
          }
          if (el.networkNodes && Array.isArray(el.networkNodes) && el.networkNodes.length > 0) {
            patch.networkNodes = el.networkNodes.map((n, i) => i === 0 ? { ...n, color } : { ...n, color: n.color && isAccent(n.color) ? `${color}CC` : n.color })
          }
        }
        // 8. Infographics & Compound Structures
        else if (['stat-big', 'vs-card', 'master-hook', 'chat-mockup', 'metric-cards', 'flowchart', 'table', 'timeline', 'pyramid-funnel', 'vs-battle', 'ranking-list', 'quiz-card', 'code-terminal', 'data-flow', 'branching-flow', 'parallel-flow', 'mindmap-flow', 'knowledge-graph', 'funnel-flow', 'roadmap-flow', 'orbit-system', 'signal-wave', 'cyber-matrix', 'speed-meter', 'liquid-fill', 'neuron-network', 'hologram-bar', 'timeline-pulse', 'generative-svg', 'dynamic-diagram'].includes(el.type)) {
          patch.accentColor = color
          if (isAccent(el.color)) patch.color = color
          if (isAccent(el.stroke)) patch.stroke = color
          if (el.type === 'master-hook' && el.hookData) {
            patch.hookData = { ...el.hookData, accentColor: color }
          }
          if (el.type === 'dynamic-diagram' && el.diagramData) {
            patch.diagramData = {
              ...el.diagramData,
              nodes: el.diagramData.nodes.map((n, i) => i === 0 ? { ...n, color } : { ...n, color: n.color && isAccent(n.color) ? color : n.color })
            }
          }
          if (el.type === 'flowchart' && Array.isArray(el.flowSteps) && el.flowSteps.length > 0) {
            patch.flowSteps = el.flowSteps.map((s, i) => i === 0 ? { ...s, color } : { ...s, color: s.color && isAccent(s.color) ? `${color}CC` : s.color })
          }
          if (el.type === 'pyramid-funnel' && Array.isArray(el.pyramidLayers) && el.pyramidLayers.length > 0) {
            patch.pyramidLayers = el.pyramidLayers.map((l, i) => i === 0 ? { ...l, color } : { ...l, color: l.color && isAccent(l.color) ? `${color}CC` : l.color })
          }
          if (el.type === 'vs-battle' && el.vsBattle) {
            patch.vsBattle = {
              ...el.vsBattle,
              rightSubject: {
                ...(el.vsBattle.rightSubject || { name: 'Phe B' }),
                color
              }
            }
          }
        }
        // 9. Visual Widgets & Motion Elements (including Hand-Drawn)
        else if ([
          'social-callout', 'document-evidence', 'fake-search', 'push-notification', 
          'frame-mockup', 'breathing-circle', 'vinyl-pulse', 'character-mascot', 'hand-drawn'
        ].includes(el.type)) {
          patch.accentColor = color
          if (el.type === 'hand-drawn') {
            patch.stroke = color
            patch.color = color
          } else if (isAccent(el.stroke)) {
            patch.stroke = color
          }
          if (el.calloutData) patch.calloutData = { ...el.calloutData, accentColor: color }
          if (el.docData) patch.docData = { ...el.docData, accentColor: color }
          if (el.searchData) patch.searchData = { ...el.searchData, accentColor: color }
          if (el.notificationData) patch.notificationData = { ...el.notificationData, accentColor: color }
          if (el.frameData) patch.frameData = { ...el.frameData, accentColor: color }
          if (el.breathingData) patch.breathingData = { ...el.breathingData, accentColor: color }
          if (el.vinylData) patch.vinylData = { ...el.vinylData, accentColor: color }
        }
        // 10. Shapes & SVG
        else if (el.type === 'shape' || el.type === 'svg' || el.type === 'rect') {
          patch.accentColor = color
          if (isAccent(el.fill)) patch.fill = color
          if (isAccent(el.stroke)) patch.stroke = color
        }

        return Object.keys(patch).length > 0 ? { ...el, ...patch } : el
      })
    }))

    // Also update brandingSettings
    const updatedBranding = { ...s.brandingSettings, brandColor: color }
    try {
      localStorage.setItem('xd_short_branding_settings', JSON.stringify(updatedBranding))
    } catch {}

    return { ...hist, scenes: updatedScenes, brandingSettings: updatedBranding, isSaved: false }
  }),

  applyThemePaletteToAllScenes: (paletteId: string, options?: { syncBrandAccent?: boolean; syncBgColor?: boolean; syncElements?: boolean }) => set(s => {
    const pal = resolveThemePalette(paletteId)
    const hist = pushSnapshot(s, `Đổi Theme: ${pal.label}`)
    const syncBrand = options?.syncBrandAccent !== false
    const syncBg = options?.syncBgColor !== false
    const syncElements = options?.syncElements !== false
    const accentColor = pal.tokens.accent

    // Keep Studio Shell neutral & decoupled:
    // Only update brand accent for interactive controls if requested, NEVER override studio background/surface
    if (typeof document !== 'undefined' && syncBrand) {
      document.documentElement.style.setProperty('--accent', accentColor)
      document.documentElement.style.setProperty('--accent-dim', `${accentColor}18`)
      document.documentElement.style.setProperty('--accent-glow', `${accentColor}44`)
    }

    const updatedScenes = s.scenes.map(scene => {
      const prevPal = resolveThemePalette(scene.paletteId || (scene as any).colorTheme || 'neon-night')
      return {
        ...scene,
        paletteId: pal.id,
        bgColor: syncBg ? pal.tokens.bg : scene.bgColor,
        progressBar: scene.progressBar ? { ...scene.progressBar, color: accentColor } : scene.progressBar,
        elements: scene.elements.map(el => {
          if (syncElements) {
            return swapElementThemeColors(el, prevPal, pal)
          }
          return { ...el, paletteId: pal.id }
        })
      }
    })

    const updatedBranding = syncBrand ? { ...s.brandingSettings, brandColor: accentColor } : s.brandingSettings
    try {
      localStorage.setItem('xd_short_branding_settings', JSON.stringify(updatedBranding))
    } catch {}

    return {
      ...hist,
      scenes: updatedScenes,
      brandingSettings: updatedBranding,
      isSaved: false
    }
  }),

  applyThemePaletteToScene: (sceneId: string, paletteId: string, options?: { syncBgColor?: boolean }) => set(s => {
    const target = s.scenes.find(sc => sc.id === sceneId)
    if (!target) return {}
    const pal = resolveThemePalette(paletteId)
    const prevPal = resolveThemePalette(target.paletteId || (target as any).colorTheme || 'neon-night')
    const hist = pushSnapshot(s, `Đổi theme cảnh: ${pal.label}`)
    const syncBg = options?.syncBgColor !== false

    const updatedScenes = s.scenes.map(scene => {
      if (scene.id !== sceneId) return scene
      return {
        ...scene,
        paletteId: pal.id,
        bgColor: syncBg ? pal.tokens.bg : scene.bgColor,
        elements: scene.elements.map(el => {
          return swapElementThemeColors(el, prevPal, pal)
        })
      }
    })

    return { ...hist, scenes: updatedScenes, isSaved: false }
  }),

  applyViralPacingToAllScenes: () => set(s => {
    const hist = pushSnapshot(s, 'Áp dụng nhịp điệu viral')
    const updatedScenes = assignViralRoles(s.scenes)
    return { ...hist, scenes: updatedScenes, isSaved: false }
  }),

  applyProgressBarToAllScenes: (progressBar) => set(s => {
    const hist = pushSnapshot(s, 'Đổi thanh tiến trình')
    const updatedScenes = s.scenes.map(scene => ({
      ...scene,
      progressBar
    }))
    return { ...hist, scenes: updatedScenes, isSaved: false }
  }),

  applyViralEffectsToAllScenes: (viralEffects) => set(s => {
    const hist = pushSnapshot(s, 'Đổi hiệu ứng viral')
    const updatedScenes = s.scenes.map(scene => ({
      ...scene,
      viralEffects: {
        ...(scene.viralEffects || {}),
        ...viralEffects
      }
    }))
    return { ...hist, scenes: updatedScenes, isSaved: false }
  }),

  applyAudioWaveformToAllScenes: (waveformProps) => set(s => {
    const hist = pushSnapshot(s, 'Đổi sóng âm thanh')
    const currentScene = s.scenes[s.currentSceneIdx]
    const activeWaveform = currentScene?.elements.find(e => e.id === s.selectedElementId && e.type === 'audio-waveform')
      || currentScene?.elements.find(e => e.type === 'audio-waveform')

    const baseProps: Partial<SceneElement> = {
      type: 'audio-waveform',
      left: activeWaveform?.left ?? 180,
      top: activeWaveform?.top ?? 560,
      width: activeWaveform?.width ?? 280,
      height: activeWaveform?.height ?? 40,
      waveformColor: activeWaveform?.waveformColor ?? activeWaveform?.accentColor ?? '#BEFF01',
      accentColor: activeWaveform?.accentColor ?? '#BEFF01',
      numberOfBars: activeWaveform?.numberOfBars ?? 24,
      opacity: activeWaveform?.opacity ?? 1,
      scaleX: activeWaveform?.scaleX ?? 1,
      scaleY: activeWaveform?.scaleY ?? 1,
      angle: activeWaveform?.angle ?? 0,
      ...waveformProps
    }

    const updatedScenes = s.scenes.map(scene => {
      const existingWaveform = scene.elements.find(e => e.type === 'audio-waveform')
      if (existingWaveform) {
        return {
          ...scene,
          elements: scene.elements.map(el => el.type === 'audio-waveform' ? { ...el, ...baseProps } : el)
        }
      } else {
        const newWaveformEl: SceneElement = {
          id: `waveform-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          ...(baseProps as any)
        }
        return {
          ...scene,
          elements: [...scene.elements, newWaveformEl]
        }
      }
    })

    return { ...hist, scenes: updatedScenes, isSaved: false }
  }),

  applyCameraAndTransitionToAllScenes: (cameraMotion, transition) => set(s => {
    const hist = pushSnapshot(s, 'Đổi góc quay và chuyển cảnh')
    const updatedScenes = s.scenes.map(scene => ({
      ...scene,
      ...(cameraMotion ? { cameraMotion } : {}),
      // scene.transition là SSOT; bỏ transitionOut cũ để không còn hai nguồn
      ...(transition ? { transition, transitionOut: undefined } : {})
    }))
    return { ...hist, scenes: updatedScenes, isSaved: false }
  }),

  addElement: (elData) => set(s => {
    const hist = pushSnapshot(s, 'Thêm phần tử')
    const dynamicTypes = ['flowchart', 'quote-box', 'checklist', 'ranking-list', 'timeline', 'table', 'vs-battle', 'highlight-box', 'knowledge-graph', 'pie-chart', 'master-hook', 'master-scene', 'dynamic-diagram', 'chart-bar', 'circle-chart', 'gauge-chart', 'sankey-chart', 'heatmap-matrix', 'hologram-bar', 'pyramid-funnel', 'visual-paradox', 'code-terminal', 'network-graph', 'numbered-list']
    const curScene = s.scenes[s.currentSceneIdx]
    const el: SceneElement = {
      ...elData,
      id: `el-${Date.now()}`,
      paletteId: (elData as any).paletteId || curScene?.paletteId || 'neon-night',
    }
    if (dynamicTypes.includes(el.type)) {
      if (!el.height || el.type === 'flowchart' || el.type === 'quote-box' || el.type === 'table' || el.type === 'vs-battle' || el.type === 'knowledge-graph' || el.type === 'pie-chart' || el.type === 'highlight-box' || el.type === 'master-hook' || el.type === 'master-scene' || el.type === 'dynamic-diagram' || el.type === 'chart-bar' || el.type === 'circle-chart' || el.type === 'gauge-chart' || el.type === 'sankey-chart' || el.type === 'heatmap-matrix' || el.type === 'hologram-bar' || el.type === 'pyramid-funnel' || el.type === 'timeline' || el.type === 'visual-paradox' || el.type === 'code-terminal' || el.type === 'network-graph') {
        el.height = calculateElementDynamicHeight(el)
      }
    }
    if (el.type === 'badge') {
      const bDims = calculateBadgeDimensions(el)
      if (!el.width) el.width = bDims.width
      if (!el.height) el.height = bDims.height
      if (el.radius === undefined) el.radius = bDims.radius
    }
    const scenes = s.scenes.map((scene, i) => {
      if (i !== s.currentSceneIdx) return scene
      return { ...scene, elements: [...scene.elements, el] }
    })
    return { ...hist, scenes, isSaved: false, selectedElementId: el.id }
  }),

  removeElement: (id) => set(s => {
    const hist = pushSnapshot(s, 'Xóa phần tử')
    const scenes = s.scenes.map((scene, i) => {
      if (i !== s.currentSceneIdx) return scene
      return { ...scene, elements: scene.elements.filter(el => el.id !== id) }
    })
    return { 
      ...hist,
      scenes, 
      isSaved: false, 
      selectedElementId: s.selectedElementId === id ? null : s.selectedElementId 
    }
  }),

  reorderSceneElements: (sceneIdx, fromIdx, toIdx) => set(s => {
    if (sceneIdx < 0 || sceneIdx >= s.scenes.length) return s
    const targetScene = s.scenes[sceneIdx]
    if (!targetScene) return s
    const elements = [...targetScene.elements]
    if (fromIdx < 0 || fromIdx >= elements.length || toIdx < 0 || toIdx >= elements.length || fromIdx === toIdx) {
      return s
    }
    const hist = pushSnapshot(s, 'Đổi thứ tự layer')
    const [moved] = elements.splice(fromIdx, 1)
    elements.splice(toIdx, 0, moved)
    
    const updatedScenes = s.scenes.map((sc, idx) => idx === sceneIdx ? { ...sc, elements } : sc)
    return { ...hist, scenes: updatedScenes, isSaved: false }
  }),

  autoStaggerSceneElements: (sceneIdx, customStepSec) => set(s => {
    if (sceneIdx < 0 || sceneIdx >= s.scenes.length) return s
    const targetScene = s.scenes[sceneIdx]
    if (!targetScene || !targetScene.elements.length) return s

    const graphicElements = targetScene.elements.filter(el => el.type !== 'caption')
    if (graphicElements.length === 0) return s

    const hist = pushSnapshot(s, 'Tự động căn nhịp layer')
    const count = graphicElements.length
    // Smart Step: Make sure all elements appear within the first 65% of scene duration
    const maxAvailableSec = targetScene.duration * 0.65
    const step = customStepSec !== undefined 
      ? customStepSec 
      : (count <= 1 ? 0 : Math.min(0.25, Math.max(0.1, Number((maxAvailableSec / (count - 1)).toFixed(2)))))

    let graphicIdx = 0
    const updatedElements = targetScene.elements.map((el) => {
      if (el.type === 'caption') {
        return el // Keep caption untouched
      }
      const delay = Number((graphicIdx * step).toFixed(2))
      graphicIdx++
      return { ...el, animDelay: delay }
    })

    const updatedScenes = s.scenes.map((sc, idx) => idx === sceneIdx ? { ...sc, elements: updatedElements } : sc)
    return { ...hist, scenes: updatedScenes, isSaved: false }
  }),

  addKeyframe: (elementId, kfData) => set(s => {
    const hist = pushSnapshot(s, 'Thêm keyframe')
    const kf: ElementKeyframe = { ...kfData, id: `kf-${Date.now()}-${Math.floor(Math.random()*1000)}` }
    const scenes = s.scenes.map((scene, i) => {
      if (i !== s.currentSceneIdx) return scene
      return {
        ...scene,
        elements: scene.elements.map(el => {
          if (el.id !== elementId) return el
          const existingKf = el.keyframes || []
          return { ...el, keyframes: [...existingKf, kf] }
        })
      }
    })
    return { ...hist, scenes, isSaved: false }
  }),

  removeKeyframe: (elementId, kfId) => set(s => {
    const hist = pushSnapshot(s, 'Xóa keyframe')
    const scenes = s.scenes.map((scene, i) => {
      if (i !== s.currentSceneIdx) return scene
      return {
        ...scene,
        elements: scene.elements.map(el => {
          if (el.id !== elementId) return el
          return { ...el, keyframes: (el.keyframes || []).filter(k => k.id !== kfId) }
        })
      }
    })
    return { ...hist, scenes, isSaved: false }
  }),

  updateKeyframe: (elementId, kfId, patch) => set(s => {
    const hist = pushSnapshot(s, 'Chỉnh sửa keyframe', 350)
    const scenes = s.scenes.map((scene, i) => {
      if (i !== s.currentSceneIdx) return scene
      return {
        ...scene,
        elements: scene.elements.map(el => {
          if (el.id !== elementId) return el
          return {
            ...el,
            keyframes: (el.keyframes || []).map(k => k.id === kfId ? { ...k, ...patch } : k)
          }
        })
      }
    })
    return { ...hist, scenes, isSaved: false }
  }),

  setInspector: (patch) => set(s => ({ inspector: { ...s.inspector, ...patch }, isSaved: false })),
})
