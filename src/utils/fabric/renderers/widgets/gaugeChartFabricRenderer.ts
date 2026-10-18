import * as fabric from 'fabric';
import { SceneElement } from '@/types/scene';
import { calculateElementDynamicHeight } from '@/config/layoutRegistry';
import { getFabricThemeColors, resolveColor, mixColors } from './colorUtils';
import { measureTextWidth, ellipsizeToWidth } from './chartTextUtils';

/**
 * Dedicated Gauge-Chart (Kim Đo Tốc Độ) Fabric 2D Renderer
 * Mirrors Remotion GaugeChartElement 100% (Header bar, speedometer arc, ticks, needle, pivot hub, digital HUD pill)
 */
export function buildGaugeChartFabricObjects(
  el: SceneElement,
  _accent: string,
  w: number,
  h: number
): fabric.FabricObject[] {
  const objects: fabric.FabricObject[] = [];
  const themeColors = getFabricThemeColors(el);
  const containerWidth = typeof el.width === 'number' && el.width > 0 ? el.width : (w || 260);
  const dynamicH = calculateElementDynamicHeight(el);
  const totalH = typeof h === 'number' && h > 0 ? Math.max(h, dynamicH) : dynamicH;
  const halfW = containerWidth / 2;

  // = Remotion: el.accentColor || '#FF5544'
  const color = resolveColor(el.accentColor, themeColors.vars) || '#FF5544';
  const targetPct = el.percent !== undefined ? el.percent : 85;
  const currentPct = Math.max(0, Math.min(100, targetPct));

  const title = (el.content !== undefined && el.content !== null) ? String(el.content).trim() : '';
  const hasTitle = Boolean(title);
  const label = (el.statLabel || '').trim();
  const hasLabel = Boolean(label);

  const headerH = hasTitle ? 32 : 0;
  const headerBlock = hasTitle ? headerH + 4 : 0; // header + marginBottom 4

  // 1. Khung element (vùng chọn = hộp Remotion) + card tuỳ chọn
  objects.push(new fabric.Rect({
    left: 0,
    top: 0,
    width: containerWidth,
    height: totalH,
    rx: el.radius !== undefined ? el.radius : 16,
    ry: el.radius !== undefined ? el.radius : 16,
    fill: el.showCardBg ? (resolveColor(el.bgColor, themeColors.vars) || themeColors.cardBg) : 'transparent',
    stroke: el.showCardBg ? mixColors(color, 27) : 'transparent',
    strokeWidth: el.showCardBg ? 1 : 0,
    originX: 'center',
    originY: 'top',
    selectable: false,
  } as any));

  // 2. Header Bar (Chỉ hiển thị khi có tiêu đề)
  if (hasTitle) {
    objects.push(new fabric.Line(
      [-halfW, headerH - 0.5, halfW, headerH - 0.5] as [number, number, number, number],
      { stroke: themeColors.border, strokeWidth: 1, selectable: false } as any
    ));

    const icon = new fabric.Path('M 12 2 L 12 6 M 4.93 4.93 L 7.76 7.76 M 2 12 L 6 12 M 22 12 L 18 12 M 19.07 4.93 L 16.24 7.76 M 21 12 A 9 9 0 1 1 3 12 A 9 9 0 1 1 21 12 M 12 12 L 15 7 M 0 0 M 24 24', {
      fill: 'transparent',
      stroke: color,
      strokeWidth: 2.2,
      strokeLineCap: 'round',
      strokeLineJoin: 'round',
      scaleX: 13 / 24,
      scaleY: 13 / 24,
      left: -halfW + 14 + 6.5,
      top: headerH / 2,
      originX: 'center',
      originY: 'center',
      selectable: false,
    } as any);
    objects.push(icon);

    const fontFamily = el.fontFamily || 'Be Vietnam Pro';
    const titleLeft = -halfW + 14 + 13 + 6;
    objects.push(new fabric.IText(ellipsizeToWidth(title.toUpperCase(), halfW - 14 - titleLeft, 11, '800', fontFamily), {
      left: titleLeft,
      top: headerH / 2,
      fontSize: 11,
      fontWeight: '800',
      charSpacing: 40,
      fill: themeColors.chartLabel,
      fontFamily,
      originX: 'left',
      originY: 'center',
      selectable: false,
    } as any));
  }

  // 3. Dial Center & Geometry
  const cx = 0;
  const cy = headerBlock + containerWidth * 0.46;
  const r = containerWidth * 0.36;
  const needleLength = r * 0.80;

  // 4. Scale Ticks & Number Labels (every 10%) — số dùng màu nhãn, vùng đỏ thể hiện qua vạch
  [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].forEach(pct => {
    const isMajor = pct % 20 === 0;
    const isRedline = pct >= 80;
    const rad = ((-180 + (pct / 100) * 180) * Math.PI) / 180;
    const tickLen = isMajor ? 8 : 4;
    const opacity = isMajor ? 0.85 : 0.45;
    objects.push(new fabric.Line(
      [cx + (r - tickLen) * Math.cos(rad), cy + (r - tickLen) * Math.sin(rad), cx + (r + 4) * Math.cos(rad), cy + (r + 4) * Math.sin(rad)] as [number, number, number, number],
      {
        stroke: isRedline ? themeColors.chartNegative : themeColors.chartAxis,
        strokeWidth: isMajor ? 1.8 : 1,
        opacity,
        selectable: false,
      } as any
    ));
    if (isMajor) {
      objects.push(new fabric.IText(String(pct), {
        left: cx + (r + 16) * Math.cos(rad),
        top: cy + (r + 16) * Math.sin(rad),
        fontSize: 8.5,
        fontWeight: '800',
        fill: themeColors.chartLabel,
        opacity,
        fontFamily: 'Inter',
        originX: 'center',
        originY: 'center',
        selectable: false,
      } as any));
    }
  });

  // 5. Base Track Arc
  const baseD = `M ${(cx - r).toFixed(2)} ${cy.toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${(cx + r).toFixed(2)} ${cy.toFixed(2)}`;
  objects.push(new fabric.Path(baseD, {
    fill: 'transparent',
    stroke: themeColors.chartGrid,
    strokeWidth: 12,
    strokeLineCap: 'round',
    originX: 'center',
    originY: 'center',
    left: cx,
    top: cy - r / 2,
    selectable: false,
  } as any));

  // 6. Active Arc — gradient ngang series-2 → series-1 → warning → negative trên cả nửa vòng (như SVG)
  if (currentPct > 0) {
    const angleDeg = -180 + (currentPct / 100) * 180;
    const clampedAngle = currentPct >= 100 ? -0.001 : angleDeg;
    const endRad = (clampedAngle * Math.PI) / 180;
    const endX = cx + r * Math.cos(endRad);
    const endY = cy + r * Math.sin(endRad);

    // Anchor moves: khung bao path luôn = nửa vòng [-r, r] × [cy-r, cy] → gradient & vị trí cố định
    const anchorMoves = `M ${(cx - r).toFixed(2)} ${cy.toFixed(2)} M ${(cx + r).toFixed(2)} ${cy.toFixed(2)} M ${cx.toFixed(2)} ${(cy - r).toFixed(2)}`;
    const activeD = `${anchorMoves} M ${(cx - r).toFixed(2)} ${cy.toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${endX.toFixed(2)} ${endY.toFixed(2)}`;
    const gradient = () => new (fabric as any).Gradient({
      type: 'linear',
      gradientUnits: 'percentage',
      coords: { x1: 0, y1: 0, x2: 1, y2: 0 },
      colorStops: [
        { offset: 0, color: themeColors.chartSeries[1] },
        { offset: 0.5, color: themeColors.chartSeries[0] },
        { offset: 0.8, color: themeColors.chartWarning },
        { offset: 1, color: themeColors.chartNegative },
      ],
    });
    [{ sw: 16, op: 0.25 }, { sw: 12, op: 1 }].forEach(({ sw, op }) => {
      objects.push(new fabric.Path(activeD, {
        fill: 'transparent',
        stroke: gradient(),
        strokeWidth: sw,
        strokeLineCap: 'round',
        opacity: op,
        originX: 'center',
        originY: 'center',
        left: cx,
        top: cy - r / 2,
        selectable: false,
      } as any));
    });
  }

  // 7. Needle & Pivot Hub
  const nRad = ((-180 + (currentPct / 100) * 180) * Math.PI) / 180;
  const pRad = nRad + Math.PI / 2;
  const tipX = cx + needleLength * Math.cos(nRad);
  const tipY = cy + needleLength * Math.sin(nRad);
  const b1X = cx + 3.5 * Math.cos(pRad);
  const b1Y = cy + 3.5 * Math.sin(pRad);
  const b2X = cx - 3.5 * Math.cos(pRad);
  const b2Y = cy - 3.5 * Math.sin(pRad);
  const needleAt = (dx: number, fill: string) => {
    const poly = new fabric.Polygon([
      { x: b1X + dx, y: b1Y + dx },
      { x: b2X + dx, y: b2Y + dx },
      { x: tipX + dx, y: tipY + dx },
    ], { fill, strokeWidth: 0, originX: 'center', originY: 'center', selectable: false } as any);
    // Polygon tự căn theo khung bao; đặt lại tâm đúng toạ độ nhóm
    poly.set({ left: poly.pathOffset.x, top: poly.pathOffset.y });
    return poly;
  };
  objects.push(needleAt(2, 'rgba(0, 0, 0, 0.5)'));
  objects.push(needleAt(0, themeColors.text));

  const dotX = cx + (needleLength - 2) * Math.cos(nRad);
  const dotY = cy + (needleLength - 2) * Math.sin(nRad);
  objects.push(new fabric.Circle({
    left: dotX, top: dotY, radius: 4, fill: color, opacity: 0.35, strokeWidth: 0,
    originX: 'center', originY: 'center', selectable: false,
  } as any));
  objects.push(new fabric.Circle({
    left: dotX, top: dotY, radius: 2.5, fill: color, strokeWidth: 0,
    originX: 'center', originY: 'center', selectable: false,
  } as any));
  objects.push(new fabric.Circle({
    left: cx, top: cy, radius: 8, fill: themeColors.surface, stroke: color, strokeWidth: 2.5,
    originX: 'center', originY: 'center', selectable: false,
  } as any));
  objects.push(new fabric.Circle({
    left: cx, top: cy, radius: 3, fill: themeColors.text, strokeWidth: 0,
    originX: 'center', originY: 'center', selectable: false,
  } as any));

  // 8. HUD pill (nền --surface-1, viền màu 33%) — vùng SVG cao cy+18, HUD marginTop −6
  const hudTop = cy + 12;
  const numText = `${Math.round(currentPct)}`;
  const numW = measureTextWidth(numText, 26, '900', 'Be Vietnam Pro');
  const pctW = measureTextWidth('%', 13, '800', 'Be Vietnam Pro');
  const labelUpper = label.toUpperCase();
  const labelW = hasLabel ? measureTextWidth(labelUpper, 9, '700', el.fontFamily || 'Inter') + 1.2 * labelUpper.length : 0;
  const hudW = Math.max(numW + 2 + pctW, labelW) + 36 + 2;
  const hudH = hasLabel ? 1 + 5 + 26 + 2 + 11 + 6 + 1 : 1 + 4 + 26 + 4 + 1;
  objects.push(new fabric.Rect({
    left: cx,
    top: hudTop,
    width: hudW,
    height: hudH,
    rx: 14,
    ry: 14,
    fill: themeColors.surface1,
    stroke: mixColors(color, 33),
    strokeWidth: 1,
    originX: 'center',
    originY: 'top',
    selectable: false,
  } as any));

  const numMidY = hudTop + 1 + (hasLabel ? 5 : 4) + 13;
  const rowLeft = cx - (numW + 2 + pctW) / 2;
  objects.push(new fabric.IText(numText, {
    left: rowLeft,
    top: numMidY,
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 1,
    fill: themeColors.chartLabel,
    fontFamily: 'Be Vietnam Pro',
    originX: 'left',
    originY: 'center',
    selectable: false,
  } as any));
  objects.push(new fabric.IText('%', {
    left: rowLeft + numW + 2,
    top: numMidY + 4.5,
    fontSize: 13,
    fontWeight: '800',
    fill: color,
    fontFamily: 'Be Vietnam Pro',
    originX: 'left',
    originY: 'center',
    selectable: false,
  } as any));

  if (hasLabel) {
    objects.push(new fabric.IText(labelUpper, {
      left: cx,
      top: numMidY + 13 + 2 + 5.5,
      fontSize: 9,
      fontWeight: '700',
      fill: themeColors.chartAxis,
      fontFamily: el.fontFamily || 'Inter',
      charSpacing: (1.2 / 9) * 1000,
      originX: 'center',
      originY: 'center',
      selectable: false,
    } as any));
  }

  return objects;
}
