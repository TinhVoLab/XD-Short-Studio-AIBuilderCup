import * as fabric from 'fabric';
import { SceneElement } from '@/types/scene';
import { calculateElementDynamicHeight } from '@/config/layoutRegistry';
import { getFabricThemeColors, resolveColor, mixColors } from './colorUtils';

const DEFAULT_HEATMAP_CELLS = [
  { label: 'BTC', value: 85 },
  { label: 'ETH', value: 65 },
  { label: 'SOL', value: 92 },
  { label: 'BNB', value: -12 },
  { label: 'XRP', value: 45 },
  { label: 'ADA', value: -25 },
  { label: 'DOGE', value: 78 },

  { label: 'NVDA', value: 95 },
  { label: 'AAPL', value: -8 },
  { label: 'MSFT', value: 40 },
  { label: 'GOOG', value: 55 },
  { label: 'AMZN', value: 62 },
  { label: 'META', value: 88 },
  { label: 'TSLA', value: -35 },

  { label: 'AI-1', value: 72 },
  { label: 'AI-2', value: 81 },
  { label: 'SaaS', value: 15 },
  { label: 'Bank', value: -18 },
  { label: 'Oil', value: -42 },
  { label: 'Gold', value: 33 },
  { label: 'Real', value: -10 },

  { label: 'Q1', value: 50 },
  { label: 'Q2', value: 85 },
  { label: 'Q3', value: 90 },
  { label: 'Q4', value: 60 },
  { label: 'US', value: 45 },
  { label: 'EU', value: -15 },
  { label: 'ASIA', value: 70 },
];

/**
 * Dedicated Heatmap-Matrix (Bản Đồ Nhiệt) Fabric 2D Renderer
 * Mirrors Remotion HeatmapMatrixElement 100% (Header, Matrix Grid Cells with Color Scale, Legend Footer)
 */
export function buildHeatmapMatrixFabricObjects(
  el: SceneElement,
  accent: string,
  w: number,
  h: number
): fabric.FabricObject[] {
  const objects: fabric.FabricObject[] = [];
  const themeColors = getFabricThemeColors(el);
  const containerWidth = typeof el.width === 'number' && el.width > 0 ? el.width : 336;
  const dynamicH = calculateElementDynamicHeight(el);
  const totalH = typeof h === 'number' && h > 0 ? Math.max(h, dynamicH) : dynamicH;
  const halfW = containerWidth / 2;

  const safeAccent = accent && accent.startsWith('#') ? accent : (el.accentColor || themeColors.accent);
  const radius = el.radius !== undefined ? el.radius : 16;
  const padX = 14;
  const padTop = 12;
  const gridW = containerWidth - padX * 2;
  const cellGap = 4;

  const title = (el.heatmapData?.title !== undefined && el.heatmapData?.title !== null
    ? String(el.heatmapData.title)
    : (el.content || '')
  ).trim();
  const hasTitle = Boolean(title);
  const cols = Math.max(1, Number(el.heatmapData?.cols) || 7);

  const rawCells = Array.isArray(el.heatmapData?.cells) && el.heatmapData.cells.length > 0
    ? el.heatmapData.cells
    : DEFAULT_HEATMAP_CELLS;

  const cellSize = (gridW - (cols - 1) * cellGap) / cols;

  // 1. Optional Card Background (Obsidian Glass)
  const isFrameless = el.showCardBg === false || el.bgColor === 'transparent';
  if (!isFrameless) {
    objects.push(new fabric.Rect({
      left: 0,
      top: 0,
      width: containerWidth,
      height: totalH,
      rx: radius,
      ry: radius,
      fill: resolveColor(el.bgColor, themeColors.vars) || themeColors.surface1,
      stroke: themeColors.border,
      strokeWidth: 1,
      originX: 'center',
      originY: 'top',
      selectable: false,
    } as any));
  }

  // 2. Header Bar (Studio NLE)
  const headerH = 26;
  if (hasTitle) {
    const iconX = -halfW + padX + 8;
    const iconY = padTop + headerH / 2;

    // Clean Vector SVG Grid Icon (4 squares)
    const sqSize = 3.5;
    const sqOffset = 3;
    objects.push(new fabric.Rect({
      left: iconX - sqOffset, top: iconY - sqOffset, width: sqSize, height: sqSize, rx: 1, ry: 1,
      fill: 'transparent', stroke: safeAccent, strokeWidth: 1.2, originX: 'center', originY: 'center', selectable: false
    } as any));
    objects.push(new fabric.Rect({
      left: iconX + sqOffset, top: iconY - sqOffset, width: sqSize, height: sqSize, rx: 1, ry: 1,
      fill: 'transparent', stroke: safeAccent, strokeWidth: 1.2, originX: 'center', originY: 'center', selectable: false
    } as any));
    objects.push(new fabric.Rect({
      left: iconX - sqOffset, top: iconY + sqOffset, width: sqSize, height: sqSize, rx: 1, ry: 1,
      fill: 'transparent', stroke: safeAccent, strokeWidth: 1.2, originX: 'center', originY: 'center', selectable: false
    } as any));
    objects.push(new fabric.Rect({
      left: iconX + sqOffset, top: iconY + sqOffset, width: sqSize, height: sqSize, rx: 1, ry: 1,
      fill: 'transparent', stroke: safeAccent, strokeWidth: 1.2, originX: 'center', originY: 'center', selectable: false
    } as any));

    // Title Text
    const maxTitleChars = Math.max(14, Math.floor((gridW - 28) / 7.2));
    const displayTitle = title.length > maxTitleChars ? title.slice(0, maxTitleChars - 1) + '…' : title;
    objects.push(new fabric.IText(displayTitle.toUpperCase(), {
      left: iconX + 12,
      top: iconY,
      fontSize: 11.5,
      fontWeight: '800',
      fill: themeColors.text,
      fontFamily: el.fontFamily || 'Be Vietnam Pro',
      originX: 'left',
      originY: 'center',
      selectable: false,
    } as any));

    // Hairline divider
    objects.push(new fabric.Line(
      [-halfW + padX, padTop + headerH, halfW - padX, padTop + headerH] as [number, number, number, number],
      {
        stroke: themeColors.border,
        strokeWidth: 1,
        selectable: false,
      } as any
    ));
  }

  // 3. Grid of Heatmap Matrix Cells
  const gridStartY = padTop + (hasTitle ? headerH + 8 : 0);

  rawCells.forEach((cell: any, idx: number) => {
    const r = Math.floor(idx / cols);
    const c = idx % cols;
    const cellX = -halfW + padX + c * (cellSize + cellGap);
    const cellY = gridStartY + r * (cellSize + cellGap);

    const val = Number(cell.value) || 0;
    const isPositive = val >= 0;
    const isNeutral = val === 0;
    const absVal = Math.abs(val);

    const baseColor = resolveColor(cell.color, themeColors.vars)
      || (isNeutral ? themeColors.chartAxis : isPositive ? themeColors.chartPositive : themeColors.chartNegative);
    // = Remotion: 0.12–0.45 để chữ --text phủ trên ô luôn đọc được
    const bgOpacity = isNeutral ? 0.12 : 0.12 + 0.33 * Math.min(1, absVal / 100);
    const cellFill = mixColors(baseColor, bgOpacity * 100);

    // Cell rect
    objects.push(new fabric.Rect({
      left: cellX,
      top: cellY,
      width: cellSize,
      height: cellSize,
      rx: 6,
      ry: 6,
      fill: cellFill,
      stroke: baseColor,
      strokeWidth: 1,
      originX: 'left',
      originY: 'top',
      selectable: false,
    } as any));

    // Cell label
    if (cell.label) {
      objects.push(new fabric.IText(String(cell.label), {
        left: cellX + cellSize / 2,
        top: cellY + (cellSize * 0.32),
        fontSize: 8.5,
        fontWeight: '900',
        fill: themeColors.text,
        fontFamily: 'Inter',
        originX: 'center',
        originY: 'center',
        selectable: false,
      } as any));
    }

    // Cell percentage value
    const valText = val > 0 ? `+${val}%` : `${val}%`;
    objects.push(new fabric.IText(valText, {
      left: cellX + cellSize / 2,
      top: cellY + (cell.label ? cellSize * 0.70 : cellSize / 2),
      fontSize: 7.5,
      fontWeight: '800',
      fill: themeColors.text,
      fontFamily: 'Inter',
      originX: 'center',
      originY: 'center',
      selectable: false,
    } as any));
  });

  // 4. Legend Footer Indicator (Clean Vector Dots)
  const rows = Math.ceil(rawCells.length / cols);
  const legendY = gridStartY + rows * cellSize + Math.max(0, rows - 1) * cellGap + 8;

  // Divider above legend
  objects.push(new fabric.Line(
    [-halfW + padX, legendY, halfW - padX, legendY] as [number, number, number, number],
    {
      stroke: themeColors.border,
      strokeWidth: 1,
      selectable: false,
    } as any
  ));

  const textY = legendY + 11;

  // Left: Red dot + Giảm (<0%)
  const leftX = -halfW + padX + 8;
  objects.push(new fabric.Circle({
    left: leftX,
    top: textY,
    radius: 2.5,
    fill: themeColors.chartNegative,
    strokeWidth: 0,
    originX: 'center',
    originY: 'center',
    selectable: false,
  } as any));

  objects.push(new fabric.IText('Giảm (<0%)', {
    left: leftX + 8,
    top: textY,
    fontSize: 9,
    fontWeight: '800',
    fill: themeColors.textSub,
    fontFamily: 'Inter',
    originX: 'left',
    originY: 'center',
    selectable: false,
  } as any));

  // Center: Neutral dot + Trung tính
  objects.push(new fabric.Circle({
    left: -24,
    top: textY,
    radius: 2.5,
    fill: themeColors.chartGrid,
    strokeWidth: 0,
    originX: 'center',
    originY: 'center',
    selectable: false,
  } as any));

  objects.push(new fabric.IText('Trung tính', {
    left: -16,
    top: textY,
    fontSize: 9,
    fontWeight: '600',
    fill: themeColors.textSub,
    fontFamily: 'Inter',
    originX: 'left',
    originY: 'center',
    selectable: false,
  } as any));

  // Right: Green dot + Tăng (>0%)
  const rightX = halfW - padX - 8;
  objects.push(new fabric.IText('Tăng (>0%)', {
    left: rightX,
    top: textY,
    fontSize: 9,
    fontWeight: '800',
    fill: themeColors.textSub,
    fontFamily: 'Inter',
    originX: 'right',
    originY: 'center',
    selectable: false,
  } as any));

  objects.push(new fabric.Circle({
    left: rightX - 60,
    top: textY,
    radius: 2.5,
    fill: themeColors.chartPositive,
    strokeWidth: 0,
    originX: 'center',
    originY: 'center',
    selectable: false,
  } as any));

  return objects;
}
