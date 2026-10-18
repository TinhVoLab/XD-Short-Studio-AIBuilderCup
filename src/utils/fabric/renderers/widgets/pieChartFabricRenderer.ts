import * as fabric from 'fabric';
import { SceneElement } from '@/types/scene';
import { calculateElementDynamicHeight } from '@/config/layoutRegistry';
import { getFabricThemeColors, resolveColor, mixColors, readableTint } from './colorUtils';
import { measureTextWidth, ellipsizeToWidth } from './chartTextUtils';

/**
 * Dedicated Pie-Chart Fabric 2D Renderer
 * Mirrors Remotion PieChartElement 100% with live Donut slices, percentages, and legend pills.
 */
export function buildPieChartFabricObjects(
  el: SceneElement,
  _accent: string,
  w: number,
  h: number
): fabric.FabricObject[] {
  const objects: fabric.FabricObject[] = [];
  const themeColors = getFabricThemeColors(el);
  const dynamicH = calculateElementDynamicHeight(el);
  const halfW = w / 2;
  // = Remotion: el.accentColor || var(--accent)
  const accent = themeColors.accent;
  const variant = el.variant || 'donut';
  const isCompact = variant === 'compact';
  const radius = el.radius !== undefined ? el.radius : 16;
  const fontFamily = el.fontFamily || 'Be Vietnam Pro';

  // 1. Data Normalization (màu mặc định = --chart-series-N như Remotion)
  const rawData = Array.isArray(el.chartData) && el.chartData.length > 0
    ? el.chartData
    : [
        { label: 'Mobile App', value: 45 },
        { label: 'Desktop Web', value: 35 },
        { label: 'Tablet & Khác', value: 20 },
      ];
  const sum = rawData.reduce((acc: number, d: any) => acc + (Number(d.value) || 0), 0) || 1;
  const sliceColorOf = (d: any, idx: number) =>
    resolveColor(d.color, themeColors.vars) || themeColors.chartSeries[Math.min(idx, 4)];

  // 2. Geometry Specs (khớp DOM Remotion: padding 14/16, header 24, gap 8, body marginTop 2)
  const padTop = isCompact ? 10 : 14;
  const padBottom = isCompact ? 10 : 14;
  const padX = isCompact ? 14 : 16;
  const headerH = isCompact ? 22 : 24;
  const gap = isCompact ? 6 : 8;
  const chartSize = isCompact ? 130 : 150;
  const donutCenterY = padTop + headerH + gap + 2 + chartSize / 2;

  const oR = chartSize * 0.46;
  const iR = chartSize * 0.26;
  const mR = (oR + iR) / 2;

  // 3. Legend pills co theo nội dung, flex-wrap + căn giữa (gap 6px 8px)
  const innerW = Math.max(120, w - padX * 2);
  const colGap = 8;
  const rowGap = 6;
  const pillH = 24;
  const pills = rawData.map((d: any, idx: number) => {
    const color = sliceColorOf(d, idx);
    const label = ellipsizeToWidth(String(d.label || `Mục ${idx + 1}`), 90, 10.5, '600', fontFamily);
    const pctText = `${Math.round(((Number(d.value) || 0) / sum) * 100)}%`;
    const labelW = measureTextWidth(label, 10.5, '600', fontFamily);
    const pctW = measureTextWidth(pctText, 11, '900', 'Inter');
    // padding 8 + chấm 7 + gap 5 + nhãn + gap 5 + % + padding 8 + viền 2
    const pw = Math.min(innerW, 8 + 7 + 5 + labelW + 5 + pctW + 8 + 2);
    return { color, label, pctText, pw };
  });
  const rows: (typeof pills)[] = [];
  let rowW = 0;
  pills.forEach((p) => {
    const cur = rows[rows.length - 1];
    if (cur && rowW + colGap + p.pw <= innerW) { cur.push(p); rowW += colGap + p.pw; }
    else { rows.push([p]); rowW = p.pw; }
  });
  const totalRows = Math.max(1, rows.length);

  const requiredH = padTop + headerH + gap + 2 + chartSize + gap + totalRows * pillH + Math.max(0, totalRows - 1) * rowGap + padBottom;
  const actualH = Math.max(h || 0, dynamicH, requiredH);

  // Card (= getGlassmorphicStyle: nền --card-bg, viền accent 40%)
  const isFrameless = el.showCardBg === false || el.bgColor === 'transparent';
  objects.push(new fabric.Rect({
    left: 0, top: 0, width: w, height: actualH,
    fill: isFrameless ? 'transparent' : (resolveColor(el.bgColor, themeColors.vars) || themeColors.cardBg),
    stroke: isFrameless ? 'transparent' : mixColors(accent, 40),
    strokeWidth: 1,
    rx: radius, ry: radius,
    originX: 'center', originY: 'top',
  } as any));

  // 4. Header Bar
  const titleText = el.content || 'CƠ CẤU PHÂN BỔ THỊ PHẦN';
  const titleSize = isCompact ? 11 : 12;
  const headerMidY = padTop + (headerH - 7) / 2;
  const cleanTitle = ellipsizeToWidth(titleText, innerW - 19, titleSize, '800', fontFamily);

  const pieIcon = new fabric.Path('M 21.21 15.89 A 10 10 0 1 1 8 2.83 M 22 12 A 10 10 0 0 0 12 2 L 12 12 Z', {
    fill: 'transparent',
    stroke: accent,
    strokeWidth: 2,
    strokeLineCap: 'round',
    strokeLineJoin: 'round',
    scaleX: 13 / 24,
    scaleY: 13 / 24,
    left: -halfW + padX + 6.5,
    top: headerMidY,
    originX: 'center',
    originY: 'center',
    selectable: false,
  } as any);
  objects.push(pieIcon);

  objects.push(new fabric.IText(cleanTitle, {
    left: -halfW + padX + 19,
    top: headerMidY,
    fontSize: titleSize,
    fontWeight: '800',
    charSpacing: 25,
    fill: themeColors.chartLabel,
    fontFamily,
    originX: 'left', originY: 'center',
  } as any));

  // Header bottom divider
  objects.push(new fabric.Rect({
    left: 0,
    top: padTop + headerH - 1,
    width: w - padX * 2,
    height: 1,
    fill: themeColors.border,
    strokeWidth: 0,
    originX: 'center', originY: 'top',
  } as any));

  // 5. Donut Slices
  let startAngle = -Math.PI / 2;
  const sliceLabels: fabric.FabricObject[] = [];
  rawData.forEach((d: any, idx: number) => {
    const val = Number(d.value) || 0;
    const pct = val / sum;
    if (pct <= 0.001) return;

    const sliceColor = sliceColorOf(d, idx);
    const sliceAngle = pct * Math.PI * 2;
    const endAngle = startAngle + sliceAngle;

    const x1 = oR * Math.cos(startAngle);
    const y1 = oR * Math.sin(startAngle);
    const x2 = oR * Math.cos(endAngle);
    const y2 = oR * Math.sin(endAngle);

    const ix1 = iR * Math.cos(endAngle);
    const iy1 = iR * Math.sin(endAngle);
    const ix2 = iR * Math.cos(startAngle);
    const iy2 = iR * Math.sin(startAngle);

    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
    const pathD = `M ${x1} ${y1} A ${oR} ${oR} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${iR} ${iR} 0 ${largeArcFlag} 0 ${ix2} ${iy2} Z`;

    const slicePath = new fabric.Path(pathD, {
      fill: sliceColor,
      stroke: themeColors.cardBg,
      strokeWidth: 2.5,
      strokeLineJoin: 'round',
      originX: 'center',
      originY: 'center',
    } as any);

    // Coordinate adjustment for Fabric path bounding box centering
    slicePath.set({
      left: 0 + slicePath.pathOffset.x,
      top: donutCenterY + slicePath.pathOffset.y,
    });
    objects.push(slicePath);

    // % trên lát: chip nền card + chữ --text (màu series không đảm bảo tương phản)
    if (pct >= 0.12) {
      const big = pct > 0.25;
      const midAngle = startAngle + sliceAngle / 2;
      const lx = mR * Math.cos(midAngle);
      const ly = donutCenterY + mR * Math.sin(midAngle);
      sliceLabels.push(new fabric.Rect({
        left: lx, top: ly,
        width: big ? 28 : 23, height: big ? 15 : 13,
        rx: big ? 7.5 : 6.5, ry: big ? 7.5 : 6.5,
        fill: themeColors.cardBg,
        strokeWidth: 0,
        originX: 'center', originY: 'center',
      } as any));
      sliceLabels.push(new fabric.IText(`${Math.round(pct * 100)}%`, {
        left: lx,
        top: ly,
        fontSize: big ? 11 : 9,
        fontWeight: '900',
        fill: themeColors.text,
        fontFamily: 'Inter',
        originX: 'center',
        originY: 'center',
      } as any));
    }

    startAngle = endAngle;
  });
  objects.push(...sliceLabels);

  // Center Core Pill
  objects.push(new fabric.Circle({
    left: 0,
    top: donutCenterY,
    radius: iR - 2,
    fill: themeColors.cardBg,
    stroke: themeColors.border,
    strokeWidth: 1.5,
    originX: 'center',
    originY: 'center',
  } as any));

  objects.push(new fabric.IText('TỔNG', {
    left: 0,
    top: donutCenterY - 6,
    fontSize: 9,
    fontWeight: '700',
    fill: themeColors.textSub,
    fontFamily: 'Inter',
    originX: 'center',
    originY: 'center',
  } as any));

  objects.push(new fabric.IText('100%', {
    left: 0,
    top: donutCenterY + 6,
    fontSize: 12,
    fontWeight: '900',
    fill: themeColors.chartValue,
    fontFamily: 'Inter',
    originX: 'center',
    originY: 'center',
  } as any));

  // 6. Legend
  const legendStartY = donutCenterY + chartSize / 2 + gap;
  rows.forEach((row, rowIdx) => {
    const rowTotalW = row.reduce((a, p) => a + p.pw, 0) + (row.length - 1) * colGap;
    let x = -rowTotalW / 2;
    const pillY = legendStartY + rowIdx * (pillH + rowGap);
    const midY = pillY + pillH / 2;
    row.forEach((p) => {
      objects.push(new fabric.Rect({
        left: x,
        top: pillY,
        width: p.pw,
        height: pillH,
        fill: themeColors.surface1,
        stroke: mixColors(p.color, 30),
        strokeWidth: 1,
        rx: 12,
        ry: 12,
        originX: 'left',
        originY: 'top',
      } as any));

      objects.push(new fabric.Circle({
        left: x + 1 + 8 + 3.5,
        top: midY,
        radius: 3.5,
        fill: p.color,
        strokeWidth: 0,
        originX: 'center',
        originY: 'center',
      } as any));

      objects.push(new fabric.IText(p.label, {
        left: x + 1 + 8 + 7 + 5,
        top: midY,
        fontSize: 10.5,
        fontWeight: '600',
        fill: themeColors.chartLabel,
        fontFamily,
        originX: 'left',
        originY: 'center',
      } as any));

      objects.push(new fabric.IText(p.pctText, {
        left: x + p.pw - 1 - 8,
        top: midY,
        fontSize: 11,
        fontWeight: '900',
        fill: readableTint(p.color, themeColors),
        fontFamily: 'Inter',
        originX: 'right',
        originY: 'center',
      } as any));
      x += p.pw + colGap;
    });
  });

  return objects;
}
