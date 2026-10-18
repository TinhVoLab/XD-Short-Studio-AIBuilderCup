import * as fabric from 'fabric'
import { Scene, SceneElement } from '@/types/scene'
import { formatHudText } from '@/utils/hudFormatter'
import { resolveThemePalette, hexToRgba, resolveSceneBackground } from '@/utils/themeResolver'
import { buildFabricBackgroundPattern } from '@/utils/fabric/helpers/fabricPatternRenderer'

export function renderHudOverlays(
  canvas: fabric.Canvas,
  currentScene: Scene | undefined,
  currentSceneIdx: number,
  scenesLength: number,
  elements: SceneElement[]
) {
  // Caching mechanism: Only rebuild HUD if relevant dependencies change
  const hudStateKey = JSON.stringify({
    paletteId: currentScene?.paletteId || (currentScene as any)?.colorTheme,
    bgColor: currentScene?.bgColor,
    bgGradient: currentScene?.bgGradient,
    bgPattern: currentScene?.bgPattern,
    bgPatternColor: currentScene?.bgPatternColor,
    bgPatternOpacity: currentScene?.bgPatternOpacity,
    kineticBgWord: currentScene?.kineticBgWord,
    beat: currentScene?.beat?.kind,
    temporalRole: currentScene?.temporalRole,
    bgVideoUrl: currentScene?.bgVideoUrl,
    hudHeader: currentScene?.hudHeader,
    hudFooterLeft: currentScene?.hudFooterLeft,
    hudFooterRight: currentScene?.hudFooterRight,
    authorName: currentScene?.authorName,
    authorAvatarUrl: currentScene?.authorAvatarUrl,
    authorAvatarPosition: currentScene?.authorAvatarPosition,
    authorAvatarLeft: currentScene?.authorAvatarLeft,
    authorAvatarTop: currentScene?.authorAvatarTop,
    authorAvatarSize: currentScene?.authorAvatarSize,
    showAiDisclaimer: currentScene?.showAiDisclaimer,
    aiDisclaimerText: currentScene?.aiDisclaimerText,
    currentSceneIdx,
    scenesLength,
    progressBar: currentScene?.progressBar,
    // Accent color can affect progress bar, but only check if progress bar is enabled
    accentColor: currentScene?.progressBar?.enabled !== false ? (elements.find(e => e.color && e.color !== '#fff' && e.color !== '#ffffff')?.color || elements.find(e => e.accentColor)?.accentColor) : null
  });

  if ((canvas as any)._lastHudStateKey === hudStateKey) {
    return; // Skip rebuild if state hasn't changed
  }
  (canvas as any)._lastHudStateKey = hudStateKey;

  const { palette, isDarkBg, ambientColor } = resolveSceneBackground(currentScene);
  const hudAccent = ambientColor || palette.tokens.accent || '#BEFF01';
  const hudTextSub = isDarkBg ? 'rgba(255, 255, 255, 0.45)' : hexToRgba(palette.tokens.text, 0.65);

  // Clear existing HUD & Pattern objects
  const hudObjects = canvas.getObjects().filter((o: any) => o.isHudObj)
  hudObjects.forEach(o => canvas.remove(o))

  // 1. Render Background Pattern Layer (7 types: grid, dots, cyber-3d, topo-contour, speed-lines, mesh, noise)
  const patternGroup = buildFabricBackgroundPattern(currentScene, 360, 640);
  if (patternGroup) {
    (patternGroup as any).isHudObj = true;
    canvas.add(patternGroup);
    canvas.sendObjectToBack(patternGroup);
  }

  // 1a. Hook stage (khớp SceneRenderer): mép khung tối dần về màu nền quanh tiêu điểm vàng
  if (currentScene?.temporalRole === 'hook' && !currentScene?.bgVideoUrl) {
    const edge = isDarkBg ? 'rgba(0,0,0,0.78)' : 'rgba(255,255,255,0.78)';
    const stage = new fabric.Rect({
      left: 0, top: 0, width: 360, height: 640, selectable: false, evented: false,
      fill: new fabric.Gradient({
        type: 'radial',
        coords: { x1: 180, y1: 256, r1: 0, x2: 180, y2: 256, r2: 330 },
        colorStops: [
          { offset: 0, color: 'rgba(0,0,0,0)' },
          { offset: 0.45, color: 'rgba(0,0,0,0)' },
          { offset: 1, color: edge },
        ],
      }),
    } as any)
    ;(stage as any).isHudObj = true
    canvas.add(stage)
    canvas.sendObjectToBack(stage)
    if (patternGroup) canvas.sendObjectToBack(patternGroup)
  }

  // 1b. Render Kinetic Background Word (Huge typography on background)
  if (currentScene?.kineticBgWord) {
    const kineticColor = isDarkBg ? 'rgba(255, 255, 255, 0.035)' : hexToRgba(palette.tokens.text, 0.045);
    const kineticText = new fabric.IText(currentScene.kineticBgWord.toUpperCase(), {
      left: 180,
      top: 240,
      fontSize: 110,
      fontWeight: '900',
      fill: kineticColor,
      fontFamily: 'Be Vietnam Pro',
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false,
    } as any);
    (kineticText as any).isHudObj = true;
    canvas.add(kineticText);
    canvas.sendObjectToBack(kineticText);
    if (patternGroup) {
      // Keep pattern under kinetic text
      canvas.sendObjectToBack(patternGroup);
    }
  }

  // 2. Top HUD Banner
  // Cảnh có nhịp giữ chân giấu HUD (khớp SceneRenderer)
  const showHud = !currentScene?.beat
  if (currentScene?.hudHeader && showHud) {
    const headerText = formatHudText(currentScene.hudHeader, currentSceneIdx, scenesLength)
    const header = new fabric.IText(headerText, {
      left: 180, top: 38, fontSize: 9, fontWeight: '700', fill: hudAccent,
      originX: 'center', originY: 'center', opacity: 0.9, selectable: false, evented: false
    } as any)
    ;(header as any).isHudObj = true
    canvas.add(header)
  }

  // 3. Bottom HUD Footers
  if (currentScene?.hudFooterLeft && showHud) {
    const baseFooterLeft = formatHudText(currentScene.hudFooterLeft, currentSceneIdx, scenesLength)
    const textStr = currentScene.authorName ? `${baseFooterLeft} • 👤 ${currentScene.authorName}` : baseFooterLeft
    const fLeft = new fabric.IText(textStr, {
      left: 16, top: 615, fontSize: 9, fontWeight: '600', fill: hudTextSub,
      originX: 'left', originY: 'center', selectable: false, evented: false
    } as any)
    ;(fLeft as any).isHudObj = true
    canvas.add(fLeft)
  }
  if (currentScene?.hudFooterRight && showHud) {
    const formattedFooterRight = formatHudText(currentScene.hudFooterRight, currentSceneIdx, scenesLength)
    const fRight = new fabric.IText(formattedFooterRight, {
      left: 344, top: 615, fontSize: 9, fontWeight: '700', fill: hudAccent,
      originX: 'right', originY: 'center', selectable: false, evented: false
    } as any)
    ;(fRight as any).isHudObj = true
    canvas.add(fRight)
  }

    // 4b. Final Scene AI Disclaimer
    if (currentSceneIdx === scenesLength - 1 && currentScene?.showAiDisclaimer !== false) {
      const text = currentScene?.aiDisclaimerText || '⚠️ AI tạo (có thể sai sót).'
      const fDisclaimer = new fabric.IText(text, {
        left: 180, top: 592, fontSize: 8.5, fontWeight: '500', fill: isDarkBg ? 'rgba(255,255,255,0.45)' : hexToRgba(palette.tokens.text, 0.65),
        originX: 'center', originY: 'center', selectable: false, evented: false, fontFamily: 'Inter'
      } as any)
      ;(fDisclaimer as any).isHudObj = true
      canvas.add(fDisclaimer)
    }

    // 5. Brand Avatar HUD (Draggable freely or via Presets)
    const pos = currentScene?.authorAvatarPosition || 'top-left';
    const avSize = currentScene?.authorAvatarSize || 44;
    const avRadius = avSize / 2;
    let avLeft = 20;
    let avTop = 22;

    if (pos === 'custom' && currentScene?.authorAvatarLeft !== undefined && currentScene?.authorAvatarTop !== undefined) {
      avLeft = currentScene.authorAvatarLeft;
      avTop = currentScene.authorAvatarTop;
    } else if (pos === 'top-right') {
      avLeft = 360 - 20 - avSize;
      avTop = 22;
    } else if (pos === 'bottom-left') {
      avLeft = 20;
      avTop = 590;
    }

    if (currentScene?.authorAvatarUrl) {
      fabric.Image.fromURL(currentScene.authorAvatarUrl, { crossOrigin: 'anonymous' }).then(img => {
        // Prevent adding if canvas has been disposed or hud already cleared again
        if (!canvas || !canvas.getElement()) return;
        
        const maxDim = Math.max(img.width || avSize, img.height || avSize)
        const scale = avSize / maxDim
        img.set({
          left: avRadius,
          top: avRadius,
          scaleX: scale,
          scaleY: scale,
          originX: 'center',
          originY: 'center',
          clipPath: new fabric.Circle({
            radius: maxDim / 2,
            originX: 'center',
            originY: 'center'
          })
        } as any)

        const ring = new fabric.Circle({
          left: avRadius,
          top: avRadius,
          radius: avRadius,
          fill: 'transparent',
          stroke: '#BEFF01',
          strokeWidth: 1.5,
          originX: 'center',
          originY: 'center'
        } as any)

        const group = new fabric.Group([img, ring], {
          id: 'brand-avatar-hud',
          left: avLeft,
          top: avTop,
          width: avSize,
          height: avSize,
          originX: 'left',
          originY: 'top',
          selectable: true,
          hasControls: false,
          lockRotation: true,
          lockScalingX: true,
          lockScalingY: true,
          hoverCursor: 'move',
          cornerSize: 0,
          transparentCorners: true,
        } as any)
        ;(group as any).isHudObj = true
        ;(group as any).isBrandAvatar = true

        canvas.add(group)
        canvas.requestRenderAll()
      }).catch(() => {})
    } else if (currentScene?.authorName) {
      const initials = currentScene.authorName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || 'XD'
      const circle = new fabric.Circle({
        left: avRadius,
        top: avRadius,
        radius: avRadius,
        fill: '#060D16',
        stroke: '#BEFF01',
        strokeWidth: 1.5,
        originX: 'center',
        originY: 'center'
      } as any)

      const text = new fabric.IText(initials, {
        left: avRadius,
        top: avRadius,
        fontSize: 14,
        fontWeight: '800',
        fill: '#BEFF01',
        fontFamily: 'Be Vietnam Pro',
        originX: 'center',
        originY: 'center'
      } as any)

      const group = new fabric.Group([circle, text], {
        id: 'brand-avatar-hud',
        left: avLeft,
        top: avTop,
        width: avSize,
        height: avSize,
        originX: 'left',
        originY: 'top',
        selectable: true,
        hasControls: false,
        lockRotation: true,
        lockScalingX: true,
        lockScalingY: true,
        hoverCursor: 'move',
        cornerSize: 0,
        transparentCorners: true,
      } as any)
      ;(group as any).isHudObj = true
      ;(group as any).isBrandAvatar = true

      canvas.add(group)
    }

  // 6. Viral Progress Bar HUD (Preview on Fabric Canvas)
  const pbConfig = currentScene?.progressBar
  const isPbEnabled = pbConfig?.enabled !== false
  if (isPbEnabled) {
    const pbPos = pbConfig?.position || 'bottom'
    const pbHeight = Math.max(4, pbConfig?.height || 6)
    const accentEl = elements.find(e => e.color && e.color !== '#fff' && e.color !== '#ffffff') || elements.find(e => e.accentColor)
    const pbColor = pbConfig?.color || accentEl?.color || accentEl?.accentColor || '#BEFF01'
    const rawStyle = pbConfig?.style || 'laser-comet'
    
    let styleMode: 'laser-comet' | 'liquid-aurora' | 'segmented-hud' = 'laser-comet'
    if (rawStyle === 'liquid-aurora' || rawStyle === 'gradient') styleMode = 'liquid-aurora'
    else if (rawStyle === 'segmented-hud' || rawStyle === 'solid') styleMode = 'segmented-hud'

    const pbLeft = 14
    const pbWidth = 332
    const pbTop = pbPos === 'top' ? 14 : (640 - 14 - (pbHeight + 4))

    if (styleMode === 'segmented-hud') {
      // Segmented Track Container
      const trackBox = new fabric.Rect({
        id: 'progress-bar-hud-track',
        left: pbLeft,
        top: pbTop,
        width: pbWidth - 36,
        height: pbHeight + 6,
        fill: 'rgba(6, 13, 22, 0.85)',
        stroke: 'rgba(255, 255, 255, 0.14)',
        strokeWidth: 1,
        rx: 6,
        ry: 6,
        selectable: false,
        evented: false,
      } as any)
      ;(trackBox as any).isHudObj = true

      const totalBlocks = 18
      const activeCount = 7 // Preview active blocks in edit mode
      const blockW = ((pbWidth - 36) - (totalBlocks + 1) * 3) / totalBlocks
      const blockObjs: any[] = []

      for (let b = 0; b < totalBlocks; b++) {
        const isFilled = b < activeCount
        const isKey = b === activeCount - 1
        const bX = pbLeft + 3 + b * (blockW + 3)
        const block = new fabric.Rect({
          id: `progress-bar-hud-block-${b}`,
          left: bX,
          top: pbTop + 3,
          width: blockW,
          height: pbHeight,
          fill: isKey ? '#FFFFFF' : isFilled ? pbColor : 'rgba(255, 255, 255, 0.08)',
          rx: 2,
          ry: 2,
          selectable: false,
          evented: false,
          shadow: isFilled ? new fabric.Shadow({ color: isKey ? '#FFFFFF' : pbColor, blur: 8, offsetX: 0, offsetY: 0 }) : undefined
        } as any)
        ;(block as any).isHudObj = true
        blockObjs.push(block)
      }

      // Percentage Badge
      const tagBox = new fabric.Rect({
        left: pbLeft + pbWidth - 32,
        top: pbTop,
        width: 32,
        height: pbHeight + 6,
        fill: 'rgba(6, 13, 22, 0.85)',
        stroke: pbColor,
        strokeWidth: 1,
        rx: 4,
        ry: 4,
        selectable: false,
        evented: false,
      } as any)
      ;(tagBox as any).isHudObj = true

      const tagText = new fabric.IText('40%', {
        id: 'progress-bar-hud-tag-text',
        left: pbLeft + pbWidth - 16,
        top: pbTop + (pbHeight + 6) / 2,
        fontSize: 9,
        fontWeight: '800',
        fill: pbColor,
        fontFamily: 'monospace',
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false
      } as any)
      ;(tagText as any).isHudObj = true

      canvas.add(trackBox, ...blockObjs, tagBox, tagText)
    } else {
      // Floating Glass Capsule Track
      const track = new fabric.Rect({
        id: 'progress-bar-hud-track',
        left: pbLeft,
        top: pbTop,
        width: pbWidth,
        height: pbHeight + 4,
        fill: 'rgba(6, 13, 22, 0.85)',
        stroke: 'rgba(255, 255, 255, 0.15)',
        strokeWidth: 1,
        rx: 100,
        ry: 100,
        selectable: false,
        evented: false,
        shadow: new fabric.Shadow({
          color: 'rgba(0,0,0,0.8)',
          blur: 16,
          offsetX: 0,
          offsetY: 4
        })
      } as any)
      ;(track as any).isHudObj = true

      // Active fill preview
      const fillW = 140
      const activeBar = new fabric.Rect({
        id: 'progress-bar-hud-fill',
        left: pbLeft + 2,
        top: pbTop + 2,
        width: fillW,
        height: pbHeight,
        fill: styleMode === 'liquid-aurora' ? '#00F0FF' : pbColor,
        rx: 100,
        ry: 100,
        selectable: false,
        evented: false,
        shadow: new fabric.Shadow({
          color: styleMode === 'liquid-aurora' ? '#00F0FF' : pbColor,
          blur: 14,
          offsetX: 0,
          offsetY: 0
        })
      } as any)
      ;(activeBar as any).isHudObj = true

      // White core line (for laser-comet)
      const coreBeam = new fabric.Rect({
        id: 'progress-bar-hud-core',
        left: pbLeft + 3,
        top: pbTop + 2 + pbHeight / 2 - 1,
        width: fillW - 4,
        height: 2,
        fill: '#FFFFFF',
        rx: 100,
        ry: 100,
        opacity: 0.9,
        selectable: false,
        evented: false
      } as any)
      ;(coreBeam as any).isHudObj = true

      // Glowing head comet orb
      const cometSize = pbHeight + 8
      const headDot = new fabric.Circle({
        id: 'progress-bar-hud-dot',
        left: pbLeft + 2 + fillW,
        top: pbTop + 2 + pbHeight / 2,
        radius: cometSize / 2,
        fill: '#FFFFFF',
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
        shadow: new fabric.Shadow({
          color: pbColor,
          blur: 18,
          offsetX: 0,
          offsetY: 0
        })
      } as any)
      ;(headDot as any).isHudObj = true

      canvas.add(track, activeBar, coreBeam, headDot)
    }
  }
}
