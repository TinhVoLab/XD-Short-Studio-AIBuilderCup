import * as fabric from 'fabric'
import { SceneElement } from '@/types/scene'
import { getFabricThemeColors, mixColors, resolveColor, onAccentFor } from './widgets/colorUtils'
import { ellipsizeToWidth, measureTextWidth } from './widgets/chartTextUtils'
import { buildFabricIcon } from './widgets/fabricIconUtils'
import { text, para, hGradient, boundsRect, themeShadow, FS_MULT, FONT } from './widgets/fabricTextKit'
import { calculateElementDynamicHeight, ELEMENT_BOX_SPECS } from '@/config/layoutRegistry'
import { estimateTextLines } from '@/config/textMetrics'
import { DEFAULT_VS_ROUNDS, DEFAULT_VS_SUBJECTS, DEFAULT_NUMBERED_ITEMS } from '@/config/widgetDefaults'

/**
 * Infographic trên canvas editor — hình học & màu khớp 1:1 component Remotion cùng tên:
 * numbered-list (BasicElements), icon-text (BasicElements), flowchart, table, vs-battle, stat-big, vs-card.
 * Màu lấy từ token thật của cảnh (getFabricThemeColors) — dữ liệu dạng `var(--x)` được resolveColor.
 * Toạ độ dọc theo đúng box-model DOM (và công thức H = f(X) trong layoutRegistry).
 */

/**
 * Nhóm element (gốc giữa-trên như mọi infographic). Fabric chỉ tính toạ độ con lúc tạo — gọi setCoords cho
 * con sau khi nhóm định vị để hit-test / đo khung chữ đúng vị trí thật.
 */
function finalizeGroup(objs: fabric.Object[], el: SceneElement): fabric.Group {
  const g = new fabric.Group(objs, {
    id: el.id,
    left: el.left,
    top: el.top,
    opacity: el.opacity ?? 1,
    originX: 'center',
    originY: 'top',
    angle: el.angle || 0,
    scaleX: el.scaleX || 1,
    scaleY: el.scaleY || 1,
  } as any)
  g.forEachObject(o => o.setCoords())
  return g
}

export function createInfographicElement(el: SceneElement): fabric.Object | null {
  const tc = getFabricThemeColors(el)
  const C = (c: unknown, fb: string) => resolveColor(c as string, tc.vars) || fb
  const font = el.fontFamily || FONT

  // ─────────────────────────────────────────────────────────── numbered-list
  if (el.type === 'numbered-list') {
    const S = ELEMENT_BOX_SPECS['numbered-list']
    const items: string[] = el.items || (el as any).listItems || DEFAULT_NUMBERED_ITEMS
    const w = el.width || 312
    const fs = el.fontSize || S.fontSize
    const availW = w - S.badge - S.badgeGap
    const accent = C(el.accentColor, tc.accent)
    const numColor = el.accentColor ? onAccentFor(accent, tc) : tc.onAccent
    const objs: fabric.Object[] = [boundsRect(w, calculateElementDynamicHeight(el))]
    let curY = 0

    items.forEach((item, i) => {
      const lines = estimateTextLines(String(item), availW, fs, { weight: S.weight, fontFamily: el.fontFamily })
      const textH = lines * fs * S.lineHeight
      const rowH = Math.max(S.badge, textH)
      const cy = curY + rowH / 2
      objs.push(new fabric.Circle({
        radius: S.badge / 2,
        fill: accent,
        left: -w / 2 + S.badge / 2,
        top: cy,
        originX: 'center',
        originY: 'center',
        shadow: new fabric.Shadow({ color: mixColors(accent, 33), blur: 10 }),
      }))
      objs.push(text(`${i + 1}`, { left: -w / 2 + S.badge / 2, top: cy, size: 11.5, weight: 900, fill: numColor, originX: 'center' }))
      objs.push(para(String(item), availW, fs * S.lineHeight, {
        left: -w / 2 + S.badge + S.badgeGap, top: cy - textH / 2, size: fs, weight: S.weight,
        fill: C(el.color, tc.text), family: font,
      }))
      curY += rowH + S.gap
    })
    return finalizeGroup(objs, el)
  }

  // ─────────────────────────────────────────────────────────── icon-text
  if (el.type === 'icon-text') {
    // IconTextElement: hàng flex căn giữa dọc (gap 8): icon = fontSize × 1.25 (nếu có) + chữ 600
    const fs = el.fontSize || 16
    const iconSize = fs * 1.25
    const content = String(el.content || (el as any).title || (el as any).text || '')
    const label = content || 'Ý chính'
    const textColor = content ? C(el.color, tc.text) : tc.textSub
    const textW = measureTextWidth(label, fs, 600, font)
    const hasIcon = Boolean(el.icon)
    const rowW = (hasIcon ? iconSize + 8 : 0) + textW
    const h = calculateElementDynamicHeight(el)
    const w = Math.max(el.width || 0, rowW)
    const cy = h / 2
    const x0 = -w / 2
    const objs: fabric.Object[] = [boundsRect(w, h)]
    if (hasIcon) objs.push(...buildFabricIcon(el.icon, C(el.accentColor || el.color, tc.accent), iconSize, x0 + iconSize / 2, cy))
    objs.push(text(label, { left: x0 + (hasIcon ? iconSize + 8 : 0), top: cy, size: fs, weight: 600, fill: textColor, family: font }))
    return finalizeGroup(objs, el)
  }

  // ─────────────────────────────────────────────────────────── flowchart
  if (el.type === 'flowchart') {
    const S = ELEMENT_BOX_SPECS['flowchart']
    const accent = C(el.accentColor, tc.accent)
    const steps: any[] = el.flowSteps && el.flowSteps.length > 0
      ? el.flowSteps
      : [
          { title: 'BƯỚC 1: TIẾP NHẬN', subtitle: 'Phân tích yêu cầu & dữ liệu đầu vào', color: accent },
          { title: 'BƯỚC 2: XỬ LÝ AI', subtitle: 'Truy xuất Vector DB & sinh nội dung', color: 'var(--chart-series-2)' },
          { title: 'BƯỚC 3: XUẤT KẾT QUẢ', subtitle: 'Hoàn thiện video & bàn giao', color: 'var(--chart-series-3)' },
        ]
    const w = el.width || 336
    const padX = 14
    const contentW = w - padX * 2
    const left = -w / 2 + padX
    const LH = S.inheritedLH
    const titleLH = S.titleFont * LH
    const subLH = S.subFont * LH
    const stepHeights = steps.map(st => {
      const sub = st.subtitle || st.desc
      return 2 * S.stepBorder + 2 * S.stepPadY + Math.max(S.badge, titleLH + (sub ? S.subMarginT + subLH : 0))
    })
    const headerRow = Math.max(S.headerIcon, S.headerFont * LH)
    const headerH = headerRow + S.headerPadB + S.headerBorder
    const totalH = S.padTop + headerH + S.gap + stepHeights.reduce((a, b) => a + b, 0) + Math.max(0, steps.length - 1) * S.connectorH + S.padBottom
    const objs: fabric.Object[] = [boundsRect(w, totalH)]

    // Header: icon 3 chấm nối (SVG của FlowchartElement) + tiêu đề 800 ellipsis + hairline
    const hcy = S.padTop + headerRow / 2
    const icx = left + S.headerIcon / 2
    const k = S.headerIcon / 16
    ;[2.5, 8, 13.5].forEach(y => objs.push(new fabric.Circle({
      left: icx, top: hcy + (y - 8) * k, radius: 1.8 * k, fill: accent, originX: 'center', originY: 'center',
    })))
    ;[[4.3, 6.2], [9.8, 11.7]].forEach(([a, b]) => objs.push(new fabric.Line(
      [icx, hcy + (a - 8) * k, icx, hcy + (b - 8) * k], { stroke: accent, strokeWidth: 1.5 * k, strokeLineCap: 'round' },
    )))
    const titleMaxW = contentW - S.headerIcon - 6
    objs.push(text(ellipsizeToWidth(el.content || 'QUY TRÌNH XỬ LÝ LOGIC', titleMaxW, S.headerFont, 800, font), {
      left: left + S.headerIcon + 6, top: hcy, size: S.headerFont, weight: 800, fill: tc.text, family: font, ls: 0.3,
    }))
    const divY = S.padTop + headerRow + S.headerPadB + 0.5
    objs.push(new fabric.Line([left, divY, left + contentW, divY], { stroke: tc.border, strokeWidth: 1 }))

    let curY = S.padTop + headerH + S.gap
    const STEP_PAD_H = 10
    steps.forEach((st, i) => {
      const stepColor = C(st.color, accent)
      const nextColor = C(steps[i + 1]?.color, accent)
      const stepH = stepHeights[i]
      const sub = st.subtitle || st.desc
      // Thẻ bước: linear-gradient(135deg, stepColor 14% → --surface-1), viền hairline
      const diag = (contentW + stepH) * Math.SQRT1_2
      const cx0 = contentW / 2, cy0 = stepH / 2
      const d = diag / 2 * Math.SQRT1_2
      objs.push(new fabric.Rect({
        left, top: curY, width: contentW - 1, height: stepH - 1, rx: 10, ry: 10,
        fill: new fabric.Gradient({
          type: 'linear', gradientUnits: 'pixels',
          coords: { x1: cx0 - d, y1: cy0 - d, x2: cx0 + d, y2: cy0 + d },
          colorStops: [{ offset: 0, color: mixColors(stepColor, 14, tc.surface1) }, { offset: 1, color: tc.surface1 }],
        }),
        stroke: tc.border, strokeWidth: 1, originX: 'left', originY: 'top',
      }))
      const bcx = left + S.stepBorder + STEP_PAD_H + S.badge / 2
      const bcy = curY + stepH / 2
      objs.push(new fabric.Circle({
        left: bcx, top: bcy, radius: S.badge / 2 - 0.75,
        fill: mixColors(stepColor, 18), stroke: mixColors(stepColor, 60), strokeWidth: 1.5,
        originX: 'center', originY: 'center',
        shadow: new fabric.Shadow({ color: mixColors(stepColor, 30), blur: 12 }),
      }))
      objs.push(text(String(i + 1).padStart(2, '0'), { left: bcx, top: bcy, size: 10, weight: 900, fill: tc.text, family: font, originX: 'center' }))

      const textLeft = left + S.stepBorder + STEP_PAD_H + S.badge + 10
      const maxTextW = contentW - (textLeft - left) - STEP_PAD_H - S.stepBorder
      const colH = titleLH + (sub ? S.subMarginT + subLH : 0)
      const colTop = bcy - colH / 2
      objs.push(text(ellipsizeToWidth(String(st.title || ''), maxTextW, S.titleFont, 700, font), {
        left: textLeft, top: colTop + titleLH / 2, size: S.titleFont, weight: 700, fill: tc.text, family: font,
      }))
      if (sub) {
        objs.push(text(ellipsizeToWidth(String(sub), maxTextW, S.subFont, 400, font), {
          left: textLeft, top: colTop + titleLH + S.subMarginT + subLH / 2, size: S.subFont, fill: tc.textSub, family: font,
        }))
      }
      curY += stepH

      // Connector SVG 10×14 (padding-left = tâm badge − 5), opacity 0.75. Nét đứt của video tô bằng gradient
      // objectBoundingBox trên đoạn thẳng đứng (khung rộng 0) → trình duyệt không vẽ: chỉ còn mũi tên.
      if (i < steps.length - 1) {
        const x = left + S.stepBorder + STEP_PAD_H + S.badge / 2 - 1
        objs.push(new fabric.Polyline([{ x: x - 3, y: curY + 9 }, { x, y: curY + 13 }, { x: x + 3, y: curY + 9 }], {
          stroke: nextColor, strokeWidth: 1.5, fill: 'transparent', strokeLineCap: 'round', strokeLineJoin: 'round',
          opacity: 0.75, originX: 'left', originY: 'top', left: x - 3 - 0.75, top: curY + 9 - 0.75,
        }))
        curY += S.connectorH
      }
    })
    return finalizeGroup(objs, el)
  }

  // ─────────────────────────────────────────────────────────── table
  if (el.type === 'table') {
    const S = ELEMENT_BOX_SPECS['table']
    const tableData: any = el.tableData || {}
    const headers = Array.isArray(tableData.headers) && tableData.headers.length > 0 ? tableData.headers : ['Phương án A', 'Phương án B']
    const rawRows: any[] = Array.isArray(tableData.rows) && tableData.rows.length > 0
      ? tableData.rows
      : (Array.isArray(el.rows) && el.rows.length > 0 ? el.rows : [['$25K-60K', '$400-1.2K'], ['$4K-9K /th', '--'], ['Tự động', '$500-5K /lần']])
    const rawLabels = Array.isArray(tableData.labels) && tableData.labels.length > 0
      ? tableData.labels
      : (Array.isArray(tableData.rowLabels) ? tableData.rowLabels : ['Chi Phí Xây Dựng', 'Vận Hành', 'Bảo Trì'])

    const w = el.width || 336
    const accent = C(el.accentColor || el.color, tc.accent)
    const secondAccent = C((el as any).secondAccent || tableData.secondColor, tc.text)
    const radius = el.radius !== undefined ? el.radius : 16
    const totalH = calculateElementDynamicHeight({ ...el, type: 'table' } as any)
    const objs: fabric.Object[] = []

    objs.push(new fabric.Rect({
      left: 0, top: 0, width: w - 1, height: totalH - 1, rx: radius, ry: radius,
      fill: C(el.bgColor, tc.cardBg), stroke: mixColors(accent, 40), strokeWidth: 1,
      originX: 'center', originY: 'top', shadow: themeShadow(tc),
    }))

    // Header 2 cột (flex 1, pad 8 phía vạch giữa), chữ 13/900 hoa, ellipsis
    const inner = w / 2 - S.padX
    const headY = S.padTop + (S.headerH - 11) / 2
    const headW = inner - 8
    const hl = String(headers[0] ?? '').toUpperCase()
    const hr = String(headers[1] || 'Phương án B').toUpperCase()
    objs.push(text(ellipsizeToWidth(hl, headW, 13, 900, FONT), { left: (-w / 2 + S.padX - 8) / 2, top: headY, size: 13, weight: 900, fill: tc.text, originX: 'center', ls: 0.5 }))
    objs.push(text(ellipsizeToWidth(hr, headW, 13, 900, FONT), { left: (w / 2 - S.padX + 8) / 2, top: headY, size: 13, weight: 900, fill: secondAccent, originX: 'center', ls: 0.5 }))
    objs.push(new fabric.Line([0, S.padTop, 0, S.padTop + S.headerH - 10], { stroke: tc.border, strokeWidth: 1 }))
    objs.push(new fabric.Line([-w / 2 + S.padX, S.padTop + S.headerH - 0.5, w / 2 - S.padX, S.padTop + S.headerH - 0.5], { stroke: tc.border, strokeWidth: 1 }))

    let curY = S.padTop + S.headerH + S.gap
    const cellW = w / 2 - S.padX - 4 - 8
    rawRows.forEach((r: any, rIdx: number) => {
      const cells = Array.isArray(r) ? r : [String(r)]
      const rowLabel = String(rawLabels[rIdx] || `Tiêu chí ${rIdx + 1}`)
      // Ô dữ liệu: bắt đầu dưới pill 10px (pill đè lên), padding 16/4/6, vạch giữa mờ
      const boxTop = curY + 10
      const boxBottom = curY + S.rowItemH - 2
      objs.push(new fabric.Line([0, boxTop, 0, boxBottom], { stroke: tc.border, strokeWidth: 1 }))
      const valY = boxTop + 16 + 8
      objs.push(text(ellipsizeToWidth(String(cells[0] ?? '--'), cellW, 13, 800, FONT), { left: (-w / 2 + S.padX + 4 - 8) / 2, top: valY, size: 13, weight: 800, fill: tc.text, originX: 'center' }))
      objs.push(text(ellipsizeToWidth(String(cells[1] ?? '--'), cellW, 13, 800, FONT), { left: (w / 2 - S.padX - 4 + 8) / 2, top: valY, size: 13, weight: 800, fill: tc.textSub, originX: 'center' }))
      if (rIdx < rawRows.length - 1) {
        objs.push(new fabric.Line([-w / 2 + S.padX, boxBottom + 0.5, w / 2 - S.padX, boxBottom + 0.5], { stroke: tc.border, strokeWidth: 1, strokeDashArray: [3, 3] }))
      }
      // Pill tiêu chí (surface-1, viền hairline, padding 3/12, chữ Inter 10/700)
      const pillW = measureTextWidth(rowLabel, 10, 700, 'Inter') + 3 + 26
      objs.push(new fabric.Rect({
        left: 0, top: curY, width: pillW - 1, height: 19, rx: 10, ry: 10,
        fill: tc.surface1, stroke: tc.border, strokeWidth: 1, originX: 'center', originY: 'top',
      }))
      objs.push(text(rowLabel, { left: 0, top: curY + 10, size: 10, weight: 700, fill: tc.text, family: 'Inter', originX: 'center', ls: 0.3 }))
      curY += S.rowItemH + S.rowGap
    })
    return finalizeGroup(objs, el)
  }

  // ─────────────────────────────────────────────────────────── vs-battle
  if (el.type === 'vs-battle') {
    const S = ELEMENT_BOX_SPECS['vs-battle']
    const vsData = el.vsBattle
    const leftSub: any = vsData?.leftSubject || DEFAULT_VS_SUBJECTS.left
    const rightSub: any = vsData?.rightSubject || DEFAULT_VS_SUBJECTS.right
    const rounds = vsData?.rounds && vsData.rounds.length > 0 ? vsData.rounds : DEFAULT_VS_ROUNDS
    const W = el.width || S.defaultWidth
    const showBg = el.showCardBg !== false
    const lColor = C(leftSub.color, tc.accent)
    const rColor = C(rightSub.color, tc.chartSeries[0])
    const warn = tc.chartWarning
    const neg = tc.chartNegative
    const NLH = S.normalLH
    const lines = (t: unknown, availW: number, size: number, weight: number, extra = {}) =>
      t ? estimateTextLines(String(t), availW, size, { fontFamily: el.fontFamily, weight, ...extra }) : 0

    let leftScore = 0
    let rightScore = 0
    rounds.forEach(r => { if (r.winner === 'left') leftScore++; else if (r.winner === 'right') rightScore++ })
    const overall = leftScore > rightScore ? 'left' : rightScore > leftScore ? 'right' : 'tie'
    const objs: fabric.Object[] = []

    // 1. Header: padding 12/14, viền 1 (có nền), gradient 2 màu chủ thể → card-bg
    const border = showBg ? 1 : 0
    const headerContent = Math.max(S.headerIcon, S.nameFont * NLH, S.pillChrome + S.pillFont * NLH)
    const headerH = S.headerPadY + 2 * border + headerContent
    const hcy = headerH / 2
    if (showBg) {
      objs.push(new fabric.Rect({
        left: 0, top: 0, width: W - 1, height: headerH - 1, rx: 14, ry: 14,
        fill: hGradient(W, [[0, mixColors(lColor, 13, tc.cardBg)], [0.4, tc.cardBg], [0.6, tc.cardBg], [1, mixColors(rColor, 13, tc.cardBg)]]),
        stroke: tc.border, strokeWidth: 1, originX: 'center', originY: 'top',
        shadow: new fabric.Shadow({ color: mixColors(lColor, 9), blur: 20 }),
      }))
    }
    // Pill điểm: padding 5/14, viền 1.5, "L VS R"
    const sL = String(leftScore)
    const sR = String(rightScore)
    const wL = measureTextWidth(sL, S.pillFont, 900, font)
    const wR = measureTextWidth(sR, S.pillFont, 900, font)
    const wVs = measureTextWidth('VS', 10, 700, FONT)
    const pillW = 28 + 3 + wL + 4 + 2 + wVs + 2 + 4 + wR
    const pillH = S.pillChrome + S.pillFont * NLH
    objs.push(new fabric.Rect({
      left: 0, top: hcy, width: pillW - 1.5, height: pillH - 1.5, rx: 20, ry: 20,
      fill: tc.surface1, stroke: tc.border, strokeWidth: 1.5, originX: 'center', originY: 'center',
      shadow: new fabric.Shadow({ color: 'rgba(0, 0, 0, 0.5)', blur: 12 }),
    }))
    let px = -pillW / 2 + 15.5
    objs.push(text(sL, { left: px, top: hcy, size: S.pillFont, weight: 900, fill: tc.text, family: font }))
    px += wL + 4 + 2
    objs.push(text('VS', { left: px, top: hcy, size: 10, weight: 700, fill: tc.textSub }))
    px += wVs + 2 + 4
    objs.push(text(sR, { left: px, top: hcy, size: S.pillFont, weight: 900, fill: tc.text, family: font }))
    // Chủ thể 2 bên: icon 20 (phát sáng màu chủ thể) + tên 12/900 ellipsis
    const sideW = (W - 2 * border - 28 - pillW) / 2
    const nameW = Math.max(10, sideW - S.headerIcon - 8)
    const ix = -W / 2 + border + 14 + S.headerIcon / 2
    const glow = (c: string) => new fabric.Shadow({ color: c, blur: 8 })
    buildFabricIcon(leftSub.icon || 'bot', lColor, S.headerIcon, ix, hcy).forEach(o => { o.set({ shadow: glow(lColor) }); objs.push(o) })
    buildFabricIcon(rightSub.icon || 'sparkle', rColor, S.headerIcon, -ix, hcy).forEach(o => { o.set({ shadow: glow(rColor) }); objs.push(o) })
    objs.push(text(ellipsizeToWidth(String(leftSub.name || ''), nameW, S.nameFont, 900, font), { left: ix + S.headerIcon / 2 + 8, top: hcy, size: S.nameFont, weight: 900, fill: tc.text, family: font }))
    objs.push(text(ellipsizeToWidth(String(rightSub.name || ''), nameW, S.nameFont, 900, font), { left: -ix - S.headerIcon / 2 - 8, top: hcy, size: S.nameFont, weight: 900, fill: tc.text, family: font, originX: 'right' }))

    // 2. Divider 1px gradient (chủ thể trái → text 30% → chủ thể phải)
    let curY = headerH + S.gap
    objs.push(new fabric.Rect({
      left: 0, top: curY, width: W, height: 1, strokeWidth: 0, originX: 'center', originY: 'top',
      fill: hGradient(W, [[0, mixColors(lColor, 40)], [0.5, mixColors(tc.text, 30)], [1, mixColors(rColor, 40)]]),
    }))
    curY += S.divider + S.gap

    // 3. Các hiệp: padding 9/11, cột 1 : 1.6 : 1 (pad trái 12 / phải 2), icon 15 + gap 5
    const colW = (W - S.rowPadX - S.colPad) / S.colRatio
    const valW = colW - S.valInset
    const valLH = S.valFont * NLH
    const critLH = S.critFont * S.critLH
    const innerL = -W / 2 + 1 + 11
    const innerR = W / 2 - 1 - 11
    rounds.forEach((r, i) => {
      const isL = r.winner === 'left'
      const isR = r.winner === 'right'
      const isTie = r.winner === 'tie'
      const lv = lines(r.leftValue, valW, S.valFont, S.valWeight)
      const cv = lines(r.criterion, S.critRatio * colW, S.critFont, S.critWeight)
      const rv = lines(r.rightValue, valW, S.valFont, S.valWeight)
      const contentH = Math.max(S.rowIcon, lv * valLH, cv * critLH, rv * valLH)
      const rowH = S.rowChrome + contentH
      const cy = curY + rowH / 2
      objs.push(new fabric.Rect({
        left: 0, top: curY, width: W - 1, height: rowH - 1, rx: 10, ry: 10, originX: 'center', originY: 'top',
        fill: isL ? hGradient(W, [[0, mixColors(lColor, 8, tc.surface2)], [1, tc.surface2]])
          : isR ? hGradient(W, [[0, tc.surface2], [1, mixColors(rColor, 8, tc.surface2)]])
          : isTie ? mixColors(warn, 6) : tc.surface1,
        stroke: isL ? mixColors(lColor, 33) : isR ? mixColors(rColor, 33) : isTie ? mixColors(warn, 33) : tc.border,
        strokeWidth: 1,
      }))
      objs.push(text(`R${i + 1}`, { left: innerL - 2, top: cy, size: 8, weight: 900, fill: tc.textSub, ls: 0.5 }))
      // Trái
      const lIconX = innerL + 12 + S.rowIcon / 2
      objs.push(...buildFabricIcon(isL ? 'check' : isR ? 'cross' : 'handshake', isL ? lColor : neg, S.rowIcon, lIconX, cy))
      if (r.leftValue) {
        objs.push(para(String(r.leftValue), valW + 1, valLH, {
          left: lIconX + S.rowIcon / 2 + 5, top: cy - (lv * valLH) / 2, size: S.valFont, weight: S.valWeight,
          fill: isL ? tc.text : tc.textSub, family: font,
        }))
      }
      // Giữa
      const critCx = innerL + 12 + colW + (S.critRatio * colW) / 2
      objs.push(para(String(r.criterion || ''), S.critRatio * colW, critLH, {
        left: critCx, top: cy - (cv * critLH) / 2, size: S.critFont, weight: S.critWeight,
        fill: tc.text, family: font, originX: 'center', align: 'center',
      }))
      // Phải
      const rIconX = innerR - 2 - S.rowIcon / 2
      objs.push(...buildFabricIcon(isR ? 'check' : isL ? 'cross' : 'handshake', isR ? rColor : neg, S.rowIcon, rIconX, cy))
      if (r.rightValue) {
        const oneLine = measureTextWidth(String(r.rightValue), S.valFont, S.valWeight, font)
        objs.push(para(String(r.rightValue), Math.min(valW, oneLine) + 1, valLH, {
          left: rIconX - S.rowIcon / 2 - 5, top: cy - (rv * valLH) / 2, size: S.valFont, weight: S.valWeight,
          fill: isR ? tc.text : tc.textSub, family: font, originX: 'right',
        }))
      }
      curY += rowH + (i < rounds.length - 1 ? S.roundGap : 0)
    })

    // 4. Banner người thắng: margin-top 4, padding 10/14, viền 1.5 màu thắng, icon cúp/bắt tay (--chart-warning)
    if (vsData?.showWinner !== false) {
      curY += S.gap + S.bannerMarginT
      const winColor = overall === 'left' ? lColor : overall === 'right' ? rColor : warn
      const leftName = String(leftSub.name || 'LỰA CHỌN A').toUpperCase()
      const rightName = String(rightSub.name || 'LỰA CHỌN B').toUpperCase()
      const label = vsData?.winnerLabel || (overall === 'left' ? `WINNER: ${leftName} (${leftScore} - ${rightScore})`
        : overall === 'right' ? `WINNER: ${rightName} (${rightScore} - ${leftScore})` : `BẤT PHÂN THẮNG BẠI (${leftScore} - ${rightScore})`)
      const labelLH = S.bannerFont * NLH
      const availW = W - S.bannerInset
      const bl = lines(label, availW, S.bannerFont, S.bannerWeight, { letterSpacing: S.bannerLS })
      const bannerH = S.bannerChrome + Math.max(S.bannerIcon, bl * labelLH)
      const cy = curY + bannerH / 2
      objs.push(new fabric.Rect({
        left: 0, top: curY, width: W - 1.5, height: bannerH - 1.5, rx: 12, ry: 12, originX: 'center', originY: 'top',
        fill: mixColors(winColor, 12), stroke: winColor, strokeWidth: 1.5,
        shadow: new fabric.Shadow({ color: mixColors(winColor, 27), blur: 20 }),
      }))
      const textW = Math.min(availW, measureTextWidth(label, S.bannerFont, S.bannerWeight, font) + label.length * S.bannerLS)
      const rowW = S.bannerIcon + 8 + textW
      buildFabricIcon(overall === 'tie' ? 'handshake' : 'trophy', warn, S.bannerIcon, -rowW / 2 + S.bannerIcon / 2, cy).forEach(o => objs.push(o))
      objs.push(para(label, textW + 2, labelLH, {
        left: -rowW / 2 + S.bannerIcon + 8, top: cy - (bl * labelLH) / 2, size: S.bannerFont, weight: S.bannerWeight,
        fill: tc.text, family: font, ls: S.bannerLS, align: 'center',
      }))
      curY += bannerH
    }
    objs.unshift(boundsRect(W, curY))
    return finalizeGroup(objs, el)
  }

  // ─────────────────────────────────────────────────────────── stat-big
  if (el.type === 'stat-big') {
    // StatBigElement (bố cục 'single'): [badge] · số lớn (prefix/suffix màu accent) · nhãn hoa · vạch accent
    const rawValue = String(el.statValue || el.content || '89%').replace(/[[\]]/g, '').trim()
    const label = String(el.statLabel || 'TỶ LỆ CHUYỂN ĐỔI THÀNH CÔNG').toUpperCase()
    const w = el.width || 320
    const isPositive = rawValue.startsWith('+') || rawValue.includes('↑') || rawValue.includes('▲')
    const isNegative = rawValue.startsWith('-') || rawValue.includes('↓') || rawValue.includes('▼')
    const lower = rawValue.toLowerCase()
    const isBreakthrough = lower.includes('x') || rawValue.includes('100') || lower.startsWith('10') || lower.endsWith('x')
    const rawAccent = el.accentColor || el.color || (isPositive ? '#00FF88' : isNegative ? '#FF3366' : isBreakthrough ? '#FFD700' : '')
    const accent = C(rawAccent, tc.accent)
    // Remotion ghép hex-alpha (`${accent}55`) → chỉ hợp lệ khi accent là hex: glow/vạch/viền chỉ hiện khi đó
    const hexAccent = /^#[0-9a-f]{6}$/i.test(accent) && /^#/.test(rawAccent)
    const numberColor = C(el.statNumberColor, tc.text)
    const labelColor = C(el.statLabelColor, tc.text)
    const labelFs = el.statLabelFontSize || 13

    let badgeText = ''
    let badgeIcon = ''
    if (el.statBadgeText && !el.statBadgeText.toUpperCase().includes('THỐNG KÊ')) { badgeText = el.statBadgeText; badgeIcon = 'stat' }
    else if (isPositive) { badgeText = 'TĂNG TRƯỞNG'; badgeIcon = 'up' }
    else if (isNegative) { badgeText = 'SỤT GIẢM'; badgeIcon = 'down' }
    else if (isBreakthrough) { badgeText = 'ĐỘT PHÁ'; badgeIcon = 'zap' }
    const showBadge = el.statShowBadge !== false && Boolean(badgeText)
    const showLine = el.statShowLine !== false

    const allocatedH = el.height || 150
    let numFs = Math.max(46, Math.min(92, Math.round(Math.max(48, allocatedH - (showBadge ? 26 : 0) - 22 - 12) * 0.94)))
    if (el.fontSize && el.fontSize >= 36) numFs = Math.max(40, Math.min(120, el.fontSize))
    if (rawValue.length > 11) numFs = Math.round(numFs * 0.65)
    else if (rawValue.length > 7) numFs = Math.round(numFs * 0.8)
    else if (rawValue.length > 5) numFs = Math.round(numFs * 0.9)

    const objs: fabric.Object[] = []
    const fx: fabric.Object[] = []
    let curY = 0
    if (showBadge) {
      const tW = measureTextWidth(badgeText.toUpperCase(), 10.5, 800, 'Inter') + badgeText.length * 0.8
      const bw = 10 + 11 + 5 + tW + 12 + 3
      const bh = 8 + 13 + 3
      objs.push(new fabric.Rect({
        left: 0, top: 0, width: bw - 1.5, height: bh - 1.5, rx: 12, ry: 12, originX: 'center', originY: 'top',
        fill: hexAccent ? mixColors(accent, 9.4) : 'transparent', stroke: hexAccent ? mixColors(accent, 33) : 'transparent', strokeWidth: 1.5,
      }))
      const ix = -bw / 2 + 1.5 + 10 + 5.5
      const iconPts: Record<string, string> = {
        up: 'M 23 6 L 13.5 15.5 L 8.5 10.5 L 1 18 M 17 6 L 23 6 L 23 12',
        down: 'M 23 18 L 13.5 8.5 L 8.5 13.5 L 1 6 M 17 18 L 23 18 L 23 12',
        zap: 'M 13 2 L 3 14 L 12 14 L 11 22 L 21 10 L 12 10 Z',
        stat: 'M 18 20 L 18 10 M 12 20 L 12 4 M 6 20 L 6 14',
      }
      const icon = new fabric.Path(iconPts[badgeIcon], {
        originX: 'center', originY: 'center', scaleX: 11 / 24, scaleY: 11 / 24,
        fill: 'transparent', stroke: accent, strokeWidth: 2.5, strokeLineCap: 'round', strokeLineJoin: 'round',
      })
      const off = (icon as any).pathOffset as { x: number; y: number }
      icon.set({ left: ix + (off.x - 12) * 11 / 24, top: bh / 2 + (off.y - 12) * 11 / 24 })
      objs.push(icon)
      objs.push(text(badgeText.toUpperCase(), { left: ix + 5.5 + 5, top: bh / 2, size: 10.5, weight: 800, fill: accent, family: 'Inter', ls: 0.8 }))
      curY = bh + 4
    }

    // Số lớn: flex baseline, line-height 0.9 (khối cao ≈ 0.98 × cỡ chữ đo trên video), margin 4/6
    const blockTop = curY + 4
    const baseline = blockTop + numFs * 0.92
    const m = rawValue.match(/([+-]?[0-9,.]+)/)
    const pre = m ? rawValue.slice(0, m.index ?? 0) : ''
    const num = m ? m[1] : rawValue
    const suf = m ? rawValue.slice((m.index ?? 0) + num.length) : ''
    const unitFs = Math.max(22, numFs * 0.48)
    const numLs = (-3 / numFs) * 1000
    const numW = measureTextWidth(num, numFs, 900, font) + (num.length - 1) * -3
    const preW = pre ? measureTextWidth(pre, unitFs, 900, 'Inter') + 2 : 0
    const sufW = suf ? measureTextWidth(suf, unitFs, 900, 'Inter') + 2 : 0
    let x = -(preW + numW + sufW) / 2
    const atBaseline = (fs: number) => baseline - fs * (FS_MULT - 0.222)
    const unitShadow = hexAccent ? new fabric.Shadow({ color: mixColors(accent, 53), blur: 18 }) : undefined
    if (pre) {
      fx.push(new fabric.FabricText(pre, { left: x, top: atBaseline(unitFs), fontSize: unitFs, fontWeight: '900', fontFamily: 'Inter', fill: accent, originX: 'left', originY: 'top', shadow: unitShadow } as any))
      x += preW
    }
    fx.push(new fabric.FabricText(num, {
      left: x, top: atBaseline(numFs), fontSize: numFs, fontWeight: '900', fontFamily: font, fill: numberColor,
      charSpacing: numLs, originX: 'left', originY: 'top',
      shadow: hexAccent ? new fabric.Shadow({ color: mixColors(accent, 47), blur: 36 }) : undefined,
    } as any))
    x += numW
    if (suf) fx.push(new fabric.FabricText(suf, { left: x + 2, top: atBaseline(unitFs), fontSize: unitFs, fontWeight: '900', fontFamily: 'Inter', fill: accent, originX: 'left', originY: 'top', shadow: unitShadow } as any))
    curY = blockTop + numFs * 0.98 + 6 + 4

    // Nhãn: 800 hoa, letter-spacing 1.2, line-height 1.35, xuống dòng trong (w − 16)
    const labelLH = labelFs * 1.35
    const ll = estimateTextLines(label, w - 16, labelFs, { fontFamily: el.fontFamily, weight: 800, letterSpacing: 1.2 })
    const lbl = para(label, w - 16, labelLH, { left: 0, top: curY, size: labelFs, weight: 800, fill: labelColor, family: font, ls: 1.2, originX: 'center', align: 'center' })
    lbl.set({ shadow: new fabric.Shadow({ color: tc.isDark ? 'rgba(0, 0, 0, 0.9)' : mixColors(tc.text, 12), blur: 12, offsetX: 0, offsetY: 2 }) })
    fx.push(lbl)
    curY += ll * labelLH
    if (showLine) {
      curY += 4 + 4
      if (hexAccent) {
        const lw = Math.min(w * 0.55, 120)
        fx.push(new fabric.Rect({
          left: 0, top: curY, width: lw, height: 1.5, strokeWidth: 0, originX: 'center', originY: 'top',
          fill: hGradient(lw, [[0, mixColors(accent, 0)], [0.2, mixColors(accent, 53)], [0.5, accent], [0.8, mixColors(accent, 53)], [1, mixColors(accent, 0)]]),
        }))
      }
      curY += 1.5
    }
    // Quầng sáng radial sau số (chỉ hợp lệ với accent hex — như video)
    if (hexAccent) {
      objs.unshift(new fabric.Ellipse({
        left: 0, top: curY / 2, rx: Math.min(w * 1.1, 320) / 2, ry: 110, originX: 'center', originY: 'center',
        fill: new fabric.Gradient({
          type: 'radial', gradientUnits: 'percentage',
          coords: { x1: 0.5, y1: 0.5, r1: 0, x2: 0.5, y2: 0.5, r2: 0.5 },
          colorStops: [{ offset: 0, color: mixColors(accent, 27) }, { offset: 0.45, color: mixColors(accent, 8) }, { offset: 0.72, color: mixColors(accent, 0) }],
        }),
      }))
    }
    const h = Math.max(curY, calculateElementDynamicHeight(el))
    return finalizeGroup([boundsRect(w, h), ...objs, ...fx], el)
  }

  // ─────────────────────────────────────────────────────────── vs-card
  if (el.type === 'vs-card') {
    const lCard: any = el.leftCard || { title: 'RAG', points: ['Nhanh', 'Rẻ'], color: 'var(--chart-positive, #00FF88)' }
    const rCard: any = el.rightCard || { title: 'FINE-TUNE', points: ['Chậm', 'Đắt'], color: 'var(--chart-negative, #FF5544)' }
    const w = el.width || 320
    const h = el.height || 200
    const cardW = (w - 20) / 2
    const objs: fabric.Object[] = []
    const card = (c: any, x0: number, fb: string) => {
      const color = C(c.color, fb)
      objs.push(new fabric.Rect({
        left: x0, top: 0, width: cardW - 1, height: h - 1, rx: 12, ry: 12, originX: 'left', originY: 'top',
        fill: tc.surface1, stroke: color, strokeWidth: 1,
        shadow: new fabric.Shadow({ color: mixColors(color, 12), blur: 20, offsetX: 0, offsetY: 4 }),
      }))
      const innerW = cardW - 32 - 2
      objs.push(text(ellipsizeToWidth(String(c.title || ''), innerW, 18, 900, FONT), { left: x0 + cardW / 2, top: 21 + 12.6, size: 18, weight: 900, fill: tc.text, originX: 'center' }))
      let y = 21 + 25.2 + 16
      ;(c.points || []).forEach((p: string) => {
        const lh = 11 * 1.26
        const n = estimateTextLines(`• ${p}`, innerW, 11, { weight: 400 })
        objs.push(para(`• ${p}`, innerW, lh, { left: x0 + 17, top: y, size: 11, fill: tc.textSub }))
        y += n * lh + 8
      })
    }
    card(lCard, -w / 2, tc.chartPositive)
    card(rCard, -w / 2 + cardW + 20, tc.chartNegative)
    objs.push(new fabric.Circle({
      left: 0, top: h / 2, radius: 19, fill: tc.surface2, stroke: tc.border, strokeWidth: 2,
      originX: 'center', originY: 'center',
      shadow: new fabric.Shadow({ color: mixColors(tc.accent, 35), blur: 15 }),
    }))
    objs.push(text('VS', { left: 0, top: h / 2, size: 14, weight: 900, fill: tc.text, originX: 'center' }))
    return finalizeGroup([boundsRect(w, h), ...objs], el)
  }

  return null
}

