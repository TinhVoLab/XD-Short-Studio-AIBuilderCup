import * as fabric from 'fabric'
import { SceneElement } from '../../../types/scene'
import { getFabricThemeColors } from './widgets/colorUtils'

/**
 * Builds Fabric.js canvas objects representing the audio-waveform element
 * Supports 13 visual styles: bars, mirrored, curve, dots, siri, circular, laser-beam, liquid-blob, vu-meter, dna-helix, arcade-blocks, neural-constellation, retro-sunburst.
 */
export function buildWaveformObjects(el: SceneElement): fabric.Object[] {
  const themeColors = getFabricThemeColors(el)
  const style = el.waveformStyle || 'bars'
  const w = el.width || 280
  const h = el.height || 40
  const color = el.waveformColor || el.accentColor || themeColors.accent
  const secondaryColor = el.waveformSecondaryColor || themeColors.chartSeries[1] || '#00D4FF'
  const coreColor = el.waveformCoreColor || themeColors.text
  const numBars = el.numberOfBars || (style === 'siri' ? 5 : style === 'dots' ? 20 : 24)
  const groupObjs: fabric.Object[] = []

  // 1. BARS
  if (style === 'bars') {
    const barW = (w - (numBars - 1) * 3) / numBars
    for (let i = 0; i < numBars; i++) {
      const centerWeight = Math.sin(((i + 1) / (numBars + 1)) * Math.PI)
      const pseudoH = Math.max(4, (Math.sin(i * 0.45) * 0.35 + 0.65) * centerWeight * h)
      const bar = new fabric.Rect({
        left: i * (barW + 3) - w / 2,
        top: -pseudoH / 2,
        width: Math.max(2, barW),
        height: pseudoH,
        fill: color,
        rx: 2,
        ry: 2,
        originX: 'left',
        originY: 'top'
      })
      groupObjs.push(bar)
    }
  }

  // 2. MIRRORED
  else if (style === 'mirrored') {
    const barW = (w - (numBars - 1) * 3) / numBars
    const halfH = h / 2
    for (let i = 0; i < numBars; i++) {
      const centerWeight = Math.sin(((i + 1) / (numBars + 1)) * Math.PI)
      const pseudoHalfH = Math.max(2, (Math.sin(i * 0.45) * 0.35 + 0.65) * centerWeight * (halfH * 0.85))
      const topBar = new fabric.Rect({
        left: i * (barW + 3) - w / 2,
        top: -pseudoHalfH - 2,
        width: Math.max(2, barW),
        height: pseudoHalfH,
        fill: color,
        rx: 2,
        ry: 2,
        originX: 'left',
        originY: 'top'
      })
      const botBar = new fabric.Rect({
        left: i * (barW + 3) - w / 2,
        top: 2,
        width: Math.max(2, barW),
        height: pseudoHalfH,
        fill: color,
        opacity: 0.7,
        rx: 2,
        ry: 2,
        originX: 'left',
        originY: 'top'
      })
      groupObjs.push(topBar, botBar)
    }
  }

  // 3. CURVE (Dải lụa đa tầng mượt mà)
  else if (style === 'curve') {
    const pointsCount = 32
    const stepX = w / (pointsCount - 1)
    
    const smoothCurve = (pts: {x:number, y:number}[]) => {
      if (pts.length === 0) return ''
      let d = `M ${pts[0].x} ${pts[0].y}`
      for (let i = 0; i < pts.length - 1; i++) {
        const xc = (pts[i].x + pts[i + 1].x) / 2
        const yc = (pts[i].y + pts[i + 1].y) / 2
        d += ` Q ${pts[i].x} ${pts[i].y}, ${xc} ${yc}`
      }
      d += ` T ${pts[pts.length - 1].x} ${pts[pts.length - 1].y}`
      return d
    }

    const pts1: {x:number, y:number}[] = []
    const pts2: {x:number, y:number}[] = []
    const pts3: {x:number, y:number}[] = []

    for (let i = 0; i < pointsCount; i++) {
      const x = i * stepX - w / 2
      const centerWeight = Math.sin(((i + 1) / (pointsCount + 1)) * Math.PI)
      
      pts1.push({ x, y: Math.sin(i * 0.3) * (h * 0.25 * centerWeight) })
      pts2.push({ x, y: Math.sin(i * 0.45) * (0.8 * h * 0.4) })
      pts3.push({ x, y: Math.sin(i * 0.6 + Math.PI/3) * (0.8 * h * 0.45) })
    }

    const path1 = smoothCurve(pts1)
    const path2 = smoothCurve(pts2)
    const path3 = smoothCurve(pts3)

    // Base fill Area
    const areaPath = `${path2} L ${w/2} ${h/2} L ${-w/2} ${h/2} Z`
    const areaCurve = new fabric.Path(areaPath, {
      fill: new fabric.Gradient({
        type: 'linear',
        coords: { x1: 0, y1: -h/2, x2: 0, y2: h/2 },
        colorStops: [
          { offset: 0, color: `${color}55` }, // ~33% opacity
          { offset: 1, color: `${color}00` }
        ]
      }),
      stroke: 'transparent',
      originX: 'center',
      originY: 'center'
    })

    const curve1 = new fabric.Path(path1, {
      fill: 'transparent',
      stroke: secondaryColor,
      strokeWidth: 1.5,
      opacity: 0.3,
      strokeLineCap: 'round',
      originX: 'center',
      originY: 'center'
    })

    const curve2 = new fabric.Path(path2, {
      fill: 'transparent',
      stroke: color,
      strokeWidth: 2.5,
      strokeLineCap: 'round',
      originX: 'center',
      originY: 'center'
    })

    const curve3 = new fabric.Path(path3, {
      fill: 'transparent',
      stroke: coreColor,
      strokeWidth: 1.2,
      opacity: 0.4,
      strokeLineCap: 'round',
      originX: 'center',
      originY: 'center'
    })

    groupObjs.push(areaCurve, curve1, curve2, curve3)
  }

  // 4. DOTS
  else if (style === 'dots') {
    const cols = Math.min(24, numBars)
    const rows = 4
    const colStep = w / (cols - 1)
    const rowStep = h / (rows - 1)
    for (let c = 0; c < cols; c++) {
      const centerWeight = Math.sin(((c + 1) / (cols + 1)) * Math.PI)
      const activeRows = Math.max(1, Math.round(centerWeight * rows))
      for (let r = 0; r < rows; r++) {
        const isActive = r < activeRows
        const dot = new fabric.Circle({
          left: c * colStep - w / 2,
          top: h / 2 - r * rowStep - 2,
          radius: 2,
          fill: isActive ? color : (themeColors.border || 'rgba(255,255,255,0.12)'),
          originX: 'center',
          originY: 'center'
        })
        groupObjs.push(dot)
      }
    }
  }

  // 5. SIRI (Viên thuốc AI đa sắc)
  else if (style === 'siri') {
    const pills = 5
    const colors = ['#00D4FF', '#BEFF01', '#FFFFFF', '#FF2A85', '#00E5FF']
    const pillW = Math.max(8, Math.round(w / 16))
    const gap = 10
    const totalW = pills * pillW + (pills - 1) * gap
    for (let i = 0; i < pills; i++) {
      const centerWeight = Math.sin(((i + 1) / (pills + 1)) * Math.PI)
      const pillH = Math.max(12, centerWeight * (h * 0.9))
      const pill = new fabric.Rect({
        left: -totalW / 2 + i * (pillW + gap),
        top: -pillH / 2,
        width: pillW,
        height: pillH,
        rx: pillW / 2,
        ry: pillW / 2,
        fill: colors[i % colors.length],
        originX: 'left',
        originY: 'top'
      })
      groupObjs.push(pill)
    }
  }

  // 6. CIRCULAR
  else if (style === 'circular') {
    const core = new fabric.Circle({
      left: 0,
      top: 0,
      radius: 7,
      fill: color,
      originX: 'center',
      originY: 'center'
    })
    const ring1 = new fabric.Circle({
      left: 0,
      top: 0,
      radius: 14,
      fill: 'transparent',
      stroke: color,
      strokeWidth: 2,
      originX: 'center',
      originY: 'center'
    })
    const ring2 = new fabric.Circle({
      left: 0,
      top: 0,
      radius: 22,
      fill: 'transparent',
      stroke: secondaryColor,
      strokeWidth: 1.5,
      strokeDashArray: [3, 3],
      opacity: 0.7,
      originX: 'center',
      originY: 'center'
    })
    groupObjs.push(ring2, ring1, core)
  }

  // 7. LASER BEAM
  else if (style === 'laser-beam') {
    const laserLine = new fabric.Rect({
      left: -w / 2,
      top: -1,
      width: w,
      height: 2,
      fill: coreColor,
      shadow: new fabric.Shadow({ color: color, blur: 8 }),
      originX: 'left',
      originY: 'top'
    })
    groupObjs.push(laserLine)

    // Sóng điện chạy dọc
    const spline = new fabric.Path(`M ${-w/2} 0 Q ${-w/4} ${-15}, 0 0 T ${w/2} 0`, {
      stroke: secondaryColor,
      strokeWidth: 2,
      fill: 'transparent',
      originX: 'center',
      originY: 'center'
    })
    groupObjs.push(spline)

    const core = new fabric.Circle({
      left: 0,
      top: 0,
      radius: 6,
      fill: coreColor,
      shadow: new fabric.Shadow({ color: color, blur: 15 }),
      originX: 'center',
      originY: 'center'
    })
    groupObjs.push(core)
  }

  // 8. LIQUID BLOB
  else if (style === 'liquid-blob') {
    const size = Math.min(w, h * 1.6, 90)
    const blob = new fabric.Circle({
      left: 0,
      top: 0,
      radius: size / 2,
      fill: color,
      opacity: 0.9,
      originX: 'center',
      originY: 'center'
    })
    const innerHighlight = new fabric.Circle({
      left: -size * 0.15,
      top: -size * 0.15,
      radius: size * 0.25,
      fill: '#FFFFFF',
      opacity: 0.4,
      originX: 'center',
      originY: 'center'
    })
    groupObjs.push(blob, innerHighlight)
  }

  // 9. VU METER (Cyber Tech Neon LED HUD Gauge)
  else if (style === 'vu-meter') {
    const meterW = Math.min(w, 230)
    const meterH = Math.min(h, 50)
    const radius = meterH * 0.72

    const frameRect = new fabric.Rect({
      left: 0,
      top: -meterH / 2,
      width: meterW,
      height: meterH,
      rx: 4,
      ry: 4,
      fill: 'rgba(8, 14, 26, 0.9)',
      stroke: `${color}66`,
      strokeWidth: 1,
      originX: 'center',
      originY: 'top'
    })
    groupObjs.push(frameRect)

    // LED Segments
    const numSegments = 22
    for (let i = 0; i < numSegments; i++) {
      const angleDeg = -136 + (i / (numSegments - 1)) * 92
      const angleRad = angleDeg * (Math.PI / 180)
      const isRed = i >= numSegments - 4
      const isYellow = i >= numSegments - 8 && !isRed
      const segColor = isRed ? '#FF2A85' : isYellow ? '#BEFF01' : (secondaryColor || color || '#00D4FF')
      const isActive = i < 15

      const r1 = radius - 1
      const r2 = radius + 5
      const x1 = Math.cos(angleRad) * r1
      const y1 = meterH / 2 - 4 + Math.sin(angleRad) * r1
      const x2 = Math.cos(angleRad) * r2
      const y2 = meterH / 2 - 4 + Math.sin(angleRad) * r2

      const ledSeg = new fabric.Line([x1, y1, x2, y2], {
        stroke: segColor,
        strokeWidth: 2.2,
        strokeLineCap: 'round',
        opacity: isActive ? 1 : 0.2,
        originX: 'center',
        originY: 'center'
      })
      groupObjs.push(ledSeg)
    }

    const needle = new fabric.Line([0, meterH / 2 - 4, 14, -meterH * 0.25], {
      stroke: '#FFFFFF',
      strokeWidth: 1.5,
      strokeLineCap: 'round',
      shadow: new fabric.Shadow({ color: color, blur: 6 }),
      originX: 'center',
      originY: 'center'
    })
    
    const pivot = new fabric.Circle({
      left: 0,
      top: meterH / 2 - 4,
      radius: 3,
      fill: '#0A0F1A',
      stroke: color,
      strokeWidth: 1,
      originX: 'center',
      originY: 'center'
    })

    const dbText = new fabric.Text('-2.4 dB', {
      left: -meterW / 2 + 12,
      top: -meterH / 2 + 8,
      fontSize: 7,
      fill: color,
      fontFamily: 'monospace',
      originX: 'left',
      originY: 'top'
    })

    groupObjs.push(needle, pivot, dbText)
  }

  // 10. DNA HELIX
  else if (style === 'dna-helix') {
    const pairs = 12
    const stepX = w / (pairs - 1)
    for (let i = 0; i < pairs; i++) {
      const x = i * stepX - w / 2
      const phase = (i / pairs) * Math.PI * 2
      const offset = Math.sin(phase) * (h * 0.38)
      const depth = (Math.cos(phase) + 1) / 2

      const rung = new fabric.Line([x, -offset, x, offset], {
        stroke: secondaryColor,
        strokeWidth: 1.5,
        opacity: 0.4 + depth * 0.4,
        originX: 'center',
        originY: 'center'
      })
      const dotTop = new fabric.Circle({
        left: x,
        top: -offset,
        radius: 2.5 + depth,
        fill: color,
        originX: 'center',
        originY: 'center'
      })
      const dotBot = new fabric.Circle({
        left: x,
        top: offset,
        radius: 2.5 + (1 - depth),
        fill: secondaryColor,
        originX: 'center',
        originY: 'center'
      })
      groupObjs.push(rung, dotTop, dotBot)
    }
  }

  // 11. ARCADE BLOCKS
  else if (style === 'arcade-blocks') {
    const cols = Math.min(18, numBars)
    const rows = 5
    const blockW = (w - (cols - 1) * 3) / cols
    const blockH = Math.max(3, (h - (rows - 1) * 2) / rows)

    for (let c = 0; c < cols; c++) {
      const centerWeight = Math.sin(((c + 1) / (cols + 1)) * Math.PI)
      const activeRows = Math.max(1, Math.round(centerWeight * rows))
      for (let r = 0; r < rows; r++) {
        const isActive = r < activeRows
        const isPeak = r === activeRows - 1
        const bColor = isPeak ? coreColor : r >= rows - 2 ? '#FF3B30' : color
        const block = new fabric.Rect({
          left: c * (blockW + 3) - w / 2,
          top: h / 2 - (r + 1) * (blockH + 2),
          width: blockW,
          height: blockH,
          rx: 1,
          ry: 1,
          fill: isActive ? bColor : (themeColors.border || 'rgba(255,255,255,0.08)'),
          originX: 'left',
          originY: 'top'
        })
        groupObjs.push(block)
      }
    }
  }

  // 12. NEURAL CONSTELLATION
  else if (style === 'neural-constellation') {
    const baseNodes = [
      { x: 0.1, y: 0.5, isCore: false },
      { x: 0.22, y: 0.22, isCore: false },
      { x: 0.24, y: 0.78, isCore: false },
      { x: 0.38, y: 0.42, isCore: false },
      { x: 0.42, y: 0.72, isCore: false },
      { x: 0.50, y: 0.20, isCore: true },
      { x: 0.52, y: 0.82, isCore: false },
      { x: 0.58, y: 0.46, isCore: true },
      { x: 0.68, y: 0.24, isCore: false },
      { x: 0.74, y: 0.74, isCore: false },
      { x: 0.82, y: 0.36, isCore: false },
      { x: 0.92, y: 0.50, isCore: false }
    ]

    const pts = baseNodes.map(n => ({
      x: n.x * w - w / 2,
      y: n.y * h - h / 2,
      isCore: n.isCore
    }))

    const maxDist = w * 0.28
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x
        const dy = pts[i].y - pts[j].y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < maxDist) {
          const line = new fabric.Line([pts[i].x, pts[i].y, pts[j].x, pts[j].y], {
            stroke: secondaryColor,
            strokeWidth: 1.1,
            opacity: (1 - dist / maxDist) * 0.5,
            originX: 'center',
            originY: 'center'
          })
          groupObjs.push(line)
        }
      }
    }

    pts.forEach((pt, idx) => {
      const dot = new fabric.Circle({
        left: pt.x,
        top: pt.y,
        radius: pt.isCore ? 4 : 2.5,
        fill: pt.isCore ? coreColor : idx % 2 === 0 ? color : secondaryColor,
        originX: 'center',
        originY: 'center'
      })
      groupObjs.push(dot)
    })
  }

  // 13. RETRO SUNBURST
  else if (style === 'retro-sunburst') {
    const numRays = 19
    const cx = 0
    const cy = h * 0.22
    const sunR = Math.min(w * 0.16, h * 0.38)
    const rIn = sunR + 4
    const maxRayLen = h * 0.48

    const startAngle = -Math.PI * 0.95
    const endAngle = -Math.PI * 0.05
    const angleStep = (endAngle - startAngle) / (numRays - 1)

    const sunPath = `M ${cx - sunR} ${cy} A ${sunR} ${sunR} 0 0 1 ${cx + sunR} ${cy} Z`
    const sun = new fabric.Path(sunPath, {
      fill: color,
      opacity: 0.85,
      originX: 'center',
      originY: 'center'
    })
    groupObjs.push(sun)

    // Ray lines
    for (let i = 0; i < numRays; i++) {
      const angle = startAngle + i * angleStep
      const centerWeight = Math.sin(((i + 1) / (numRays + 1)) * Math.PI)
      const rayLen = Math.max(4, (Math.sin(i * 0.6) * 0.3 + 0.7) * centerWeight * maxRayLen)
      const rOut = rIn + rayLen

      const x1 = cx + Math.cos(angle) * rIn
      const y1 = cy + Math.sin(angle) * rIn
      const x2 = cx + Math.cos(angle) * rOut
      const y2 = cy + Math.sin(angle) * rOut

      const ray = new fabric.Line([x1, y1, x2, y2], {
        stroke: color,
        strokeWidth: 2.2,
        strokeLineCap: 'round',
        opacity: 0.7,
        originX: 'center',
        originY: 'center'
      })
      groupObjs.push(ray)
    }

    const horizon = new fabric.Line([-w * 0.45, cy, w * 0.45, cy], {
      stroke: secondaryColor,
      strokeWidth: 1.5,
      opacity: 0.7,
      originX: 'center',
      originY: 'center'
    })
    groupObjs.push(horizon)
  }

  return groupObjs
}

