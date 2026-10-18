import * as fabric from 'fabric';
import { SceneElement } from '@/types/scene';
import { DEFAULT_SANKEY_DATA } from '@/config/widgetDefaults';
import { calculateElementDynamicHeight } from '@/config/layoutRegistry';
import { getFabricThemeColors, resolveColor, mixColors, readableTint } from './colorUtils';
import { measureTextWidth, ellipsizeToWidth } from './chartTextUtils';

/**
 * Dedicated Sankey-Chart (Sankey Phân Rã) Fabric 2D Renderer
 * Mirrors Remotion SankeyChartElement 100% (Header, Source Node, Bézier Ribbons, Target Rows with Progress Fill)
 */
export function buildSankeyChartFabricObjects(
  el: SceneElement,
  _accent: string,
  w: number,
  h: number
): fabric.FabricObject[] {
  const objects: fabric.FabricObject[] = [];
  const themeColors = getFabricThemeColors(el);
  const vars = themeColors.vars;
  const containerWidth = typeof el.width === 'number' && el.width > 0 ? el.width : (w || 336);
  const dynamicH = calculateElementDynamicHeight(el);
  const totalH = typeof h === 'number' && h > 0 ? Math.max(h, dynamicH) : dynamicH;
  const halfW = containerWidth / 2;

  // = Remotion: el.accentColor || '#BEFF01'
  const accent = resolveColor(el.accentColor, vars) || '#BEFF01';
  const isCompact = el.variant === 'compact';
  const isFrameless = el.showCardBg === false || el.bgColor === 'transparent';
  const radius = el.radius !== undefined ? el.radius : 16;
  const fontFamily = el.fontFamily || 'Be Vietnam Pro';

  // Geometry khớp SankeyChartElement + ELEMENT_BOX_SPECS['sankey-chart']
  const border = isFrameless ? 0 : 1;
  const padY = isCompact ? 10 : 14;
  const cardPadX = isCompact ? 12 : 16;
  const padX = isCompact ? 10 : 14; // SVG rộng contentW = w − 2·padX, căn giữa
  const contentW = containerWidth - padX * 2;
  const innerW = containerWidth - (cardPadX + border) * 2; // bề rộng thật của hàng đích
  const svgH0 = (n: number) => (isCompact ? 36 : Math.max(44, 34 + n * 4));
  const topH = isCompact ? 42 : 48;
  const rowH = isCompact ? 38 : 44;
  const rowGap = isCompact ? 6 : 8;

  // 1. Data Normalization (= Remotion: DEFAULT_SANKEY_DATA, màu mặc định --chart-series-N)
  const sankeyData: any = el.sankeyData || { ...DEFAULT_SANKEY_DATA, title: el.content || DEFAULT_SANKEY_DATA.title };
  const title = (sankeyData.title !== undefined && sankeyData.title !== null
    ? String(sankeyData.title)
    : (el.content || '')
  ).trim();
  const hasTitle = Boolean(title);
  const rawFlows = Array.isArray(sankeyData.flows) && sankeyData.flows.length > 0 ? sankeyData.flows : DEFAULT_SANKEY_DATA.flows;
  const flows = rawFlows.map((f: any, idx: number) => ({
    label: String(f.label || `Nhánh ${idx + 1}`),
    value: String(f.value || `${f.percent || 20}%`),
    percent: Number(f.percent) || 0,
    color: resolveColor(f.color, vars) || themeColors.chartSeries[idx % 5] || accent,
  }));
  const svgH = svgH0(flows.length);

  // 2. Khung element (vùng chọn luôn = hộp Remotion) + card glass
  objects.push(new fabric.Rect({
    left: 0,
    top: 0,
    width: containerWidth,
    height: totalH,
    rx: radius,
    ry: radius,
    fill: isFrameless ? 'transparent' : (resolveColor(el.bgColor, vars) || themeColors.cardBg),
    stroke: isFrameless ? 'transparent' : mixColors(accent, 40),
    strokeWidth: isFrameless ? 0 : 1,
    originX: 'center',
    originY: 'top',
    selectable: false,
  } as any));

  let y = border + padY;

  // 3. Header (icon nhánh + tiêu đề 12.5px, line-height 1.45)
  if (hasTitle) {
    const titleSize = isCompact ? 11 : 12.5;
    const lineH = Math.max(13, titleSize * 1.45);
    const midY = y + lineH / 2;
    const left = -halfW + border + cardPadX;
    objects.push(new fabric.Path('M 14.5 4 A 2.5 2.5 0 1 1 9.5 4 A 2.5 2.5 0 1 1 14.5 4 M 8.5 20 A 2.5 2.5 0 1 1 3.5 20 A 2.5 2.5 0 1 1 8.5 20 M 20.5 20 A 2.5 2.5 0 1 1 15.5 20 A 2.5 2.5 0 1 1 20.5 20 M 12 6.5 L 12 10 L 6 17.5 M 12 10 L 18 17.5 M 0 0 M 24 24', {
      fill: 'transparent',
      stroke: accent,
      strokeWidth: 2.2,
      strokeLineCap: 'round',
      strokeLineJoin: 'round',
      scaleX: 13 / 24,
      scaleY: 13 / 24,
      left: left + 6.5,
      top: midY,
      originX: 'center',
      originY: 'center',
      selectable: false,
    } as any));
    const titleLeft = left + 13 + 6;
    objects.push(new fabric.IText(ellipsizeToWidth(title.toUpperCase(), innerW - 19, titleSize, '800', fontFamily), {
      left: titleLeft,
      top: midY,
      fontSize: titleSize,
      fontWeight: '800',
      charSpacing: (0.5 / titleSize) * 1000,
      fill: resolveColor(el.color, vars) || themeColors.text,
      fontFamily,
      originX: 'left',
      originY: 'center',
      selectable: false,
    } as any));
    y += lineH + (isCompact ? 8 : 10);
  }

  // 4. Source Node (68% bề rộng, nền --surface-1, viền --border, viền trên 2px accent)
  const nodeW = innerW * 0.68;
  const nodeTop = y;
  const nodeIdx = objects.length; // dải luồng chèn dưới nút nguồn (z-index 2 < 3 như Remotion)
  objects.push(new fabric.Rect({
    left: 0,
    top: nodeTop + 0.5,
    width: nodeW - 1,
    height: topH - 1,
    rx: 10,
    ry: 10,
    fill: themeColors.surface1,
    stroke: themeColors.border,
    strokeWidth: 1,
    originX: 'center',
    originY: 'top',
    selectable: false,
  } as any));
  objects.push(new fabric.Line(
    [-nodeW / 2 + 9, nodeTop + 1, nodeW / 2 - 9, nodeTop + 1] as [number, number, number, number],
    { stroke: accent, strokeWidth: 2, strokeLineCap: 'round', selectable: false } as any
  ));

  const srcValSize = 9.5;
  const srcSize = isCompact ? 13 : 15;
  const block = srcValSize * 1.46 + 1 + srcSize * 1.46;
  const blockTop = nodeTop + 2 + 4 + Math.max(0, (topH - 3 - 8 - block) / 2);
  objects.push(new fabric.IText(String(sankeyData.sourceValue ?? '').toUpperCase(), {
    left: 0,
    top: blockTop + (srcValSize * 1.46) / 2,
    fontSize: srcValSize,
    fontWeight: '700',
    fill: themeColors.textSub,
    fontFamily,
    charSpacing: (0.6 / srcValSize) * 1000,
    originX: 'center',
    originY: 'center',
    selectable: false,
  } as any));
  objects.push(new fabric.IText(String(sankeyData.source ?? ''), {
    left: 0,
    top: blockTop + srcValSize * 1.46 + 1 + (srcSize * 1.46) / 2,
    fontSize: srcSize,
    fontWeight: '900',
    fill: themeColors.text,
    fontFamily,
    originX: 'center',
    originY: 'center',
    selectable: false,
  } as any));

  // 5. Ribbons (SVG marginTop −3; gradient dọc --text 40% → màu luồng 85%, opacity 0.9)
  const svgTop = nodeTop + topH - 3;
  const svgLeft = -contentW / 2;
  const clusterW = Math.min(80, contentW * 0.35);
  const ribbons: fabric.FabricObject[] = [];
  flows.forEach((f: any, i: number) => {
    const startX = svgLeft + (flows.length === 1
      ? contentW / 2
      : contentW / 2 - clusterW / 2 + (clusterW / (flows.length - 1 || 1)) * i);
    const endX = svgLeft + 20 + ((contentW - 40) / (flows.length + 1)) * (i + 1);
    const ribbonW = Math.max(6, (f.percent / 100) * 28);
    // Dải thẳng đứng (khung bao rộng 0): gradient objectBoundingBox của SVG không vẽ → video không có dải này
    if (Math.abs(endX - startX) < 0.01) return;
    const pathD = `M ${startX.toFixed(2)} ${svgTop.toFixed(2)} C ${startX.toFixed(2)} ${(svgTop + svgH * 0.45).toFixed(2)}, ${endX.toFixed(2)} ${(svgTop + svgH * 0.55).toFixed(2)}, ${endX.toFixed(2)} ${(svgTop + svgH).toFixed(2)}`;
    const ribbon = new fabric.Path(pathD, {
      fill: 'transparent',
      strokeWidth: ribbonW,
      strokeLineCap: 'round',
      opacity: 0.9,
      originX: 'center',
      originY: 'center',
      selectable: false,
    } as any);
    ribbon.set({
      left: ribbon.pathOffset.x,
      top: ribbon.pathOffset.y,
      stroke: new (fabric as any).Gradient({
        type: 'linear',
        gradientUnits: 'pixels',
        coords: { x1: 0, y1: 0, x2: 0, y2: ribbon.height || svgH },
        colorStops: [
          { offset: 0, color: mixColors(themeColors.text, 40) },
          { offset: 1, color: mixColors(f.color, 85) },
        ],
      }),
    });
    ribbons.push(ribbon);
  });
  objects.splice(nodeIdx, 0, ...ribbons);

  // 6. Target Rows (nền --surface-1, viền màu 27%, vạch % = màu 9%; chữ màu qua readableTint)
  const rowsTop = svgTop + svgH - 3;
  const labelSize = isCompact ? 11 : 12;
  const valueSize = isCompact ? 12.5 : 13.5;
  flows.forEach((f: any, i: number) => {
    const top = rowsTop + i * (rowH + rowGap);
    const midY = top + rowH / 2;
    const rowLeft = -innerW / 2;

    objects.push(new fabric.Rect({
      left: 0,
      top: top + 0.5,
      width: innerW - 1,
      height: rowH - 1,
      rx: 8,
      ry: 8,
      fill: themeColors.surface1,
      stroke: mixColors(f.color, 27),
      strokeWidth: 1,
      originX: 'center',
      originY: 'top',
      selectable: false,
    } as any));

    const fillW = Math.max(0, Math.min(1, f.percent / 100)) * (innerW - 2);
    if (fillW > 0) {
      objects.push(new fabric.Rect({
        left: rowLeft + 1,
        top: top + 1,
        width: fillW,
        height: rowH - 2,
        rx: Math.min(7, fillW / 2),
        ry: 7,
        fill: mixColors(f.color, 9),
        strokeWidth: 0,
        originX: 'left',
        originY: 'top',
        selectable: false,
      } as any));
    }

    const tint = readableTint(f.color, themeColors);
    const valueW = measureTextWidth(f.value, valueSize, '900', fontFamily);
    const badgeText = `${f.percent}%`;
    const badgeW = measureTextWidth(badgeText, 9.5, '800', fontFamily) + 10 + 2;
    const labelX = rowLeft + 1 + 10;
    const labelMaxW = Math.max(30, innerW - 2 - 20 - valueW - 8 - 6 - badgeW);
    const label = ellipsizeToWidth(f.label, labelMaxW, labelSize, '700', fontFamily);
    const labelW = measureTextWidth(label, labelSize, '700', fontFamily);

    objects.push(new fabric.IText(label, {
      left: labelX,
      top: midY,
      fontSize: labelSize,
      fontWeight: '700',
      fill: themeColors.text,
      fontFamily,
      originX: 'left',
      originY: 'center',
      selectable: false,
    } as any));

    const badgeX = labelX + labelW + 6;
    objects.push(new fabric.Rect({
      left: badgeX,
      top: midY,
      width: badgeW,
      height: 9.5 * 1.46 + 4,
      rx: 4,
      ry: 4,
      fill: mixColors(f.color, 10),
      stroke: mixColors(f.color, 27),
      strokeWidth: 1,
      originX: 'left',
      originY: 'center',
      selectable: false,
    } as any));
    objects.push(new fabric.IText(badgeText, {
      left: badgeX + badgeW / 2,
      top: midY,
      fontSize: 9.5,
      fontWeight: '800',
      fill: tint,
      fontFamily,
      originX: 'center',
      originY: 'center',
      selectable: false,
    } as any));

    objects.push(new fabric.IText(f.value, {
      left: -rowLeft - 1 - 10,
      top: midY,
      fontSize: valueSize,
      fontWeight: '900',
      fill: tint,
      fontFamily,
      originX: 'right',
      originY: 'center',
      selectable: false,
    } as any));
  });

  return objects;
}
