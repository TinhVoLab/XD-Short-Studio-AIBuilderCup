import * as fabric from 'fabric';
import { SceneElement } from '@/types/scene';
import { getFabricThemeColors, resolveColor, mixColors } from './colorUtils';
import { measureTextWidth, ellipsizeToWidth } from './chartTextUtils';

/**
 * Dedicated Chart-Bar (Cột Doanh Số) Fabric 2D Renderer
 * Mirrors Remotion ChartBarElement 100% (Title toggle, clean vector bars, gradient progress tracks)
 */
export function buildChartBarFabricObjects(
  el: SceneElement,
  _accent: string,
  w: number,
  h: number
): fabric.FabricObject[] {
  const objects: fabric.FabricObject[] = [];
  const halfW = w / 2;
  const themeColors = getFabricThemeColors(el);
  const vars = themeColors.vars;
  const accent = themeColors.accent;
  const radius = el.radius !== undefined ? el.radius : 16;
  const isCompact = (el.variant || 'horizontal') === 'compact';
  const fontFamily = el.fontFamily || 'Be Vietnam Pro';

  // 1. Data Normalization (= Remotion: cột thứ 2 nổi bật)
  const rawData = (el.chartData && Array.isArray(el.chartData) && el.chartData.length > 0)
    ? el.chartData
    : [
        { label: 'Trước tối ưu', value: 35, unit: '%' },
        { label: 'Sau tối ưu', value: 88, unit: '%', isHighlight: true },
        { label: 'Mục tiêu', value: 95, unit: '%' },
      ];

  const titleText = (el.content !== undefined && el.content !== null) ? String(el.content).trim() : '';
  const hasTitle = Boolean(titleText);

  // 2. Geometry (DOM Remotion: padding 14/16, header = dòng 12px + pb 7 + viền, gap 10, marginTop 2;
  // mỗi mục = dòng nhãn 16 + gap 4 + track 8)
  const paddingX = isCompact ? 14 : 16;
  const paddingTop = isCompact ? 10 : 14;
  const headerLineH = isCompact ? 16 : 17;
  const headerH = hasTitle ? headerLineH + (isCompact ? 5 : 7) + 1 : 0;
  const headerGap = hasTitle ? (isCompact ? 8 : 10) + 2 : 0;
  const usableW = Math.max(60, w - paddingX * 2);
  const trackH = isCompact ? 7 : 8;
  // dòng nhãn = line-height thật của chữ 12px Be Vietnam Pro / 13.5px Inter (≈ 17.5; compact ≈ 16)
  const rowH = isCompact ? 16 : 17.5;
  const itemH = rowH + 4 + trackH;
  const itemGap = isCompact ? 8 : 10;

  // Card co theo nội dung như DOM Remotion (không đặt height cố định)
  const itemsCount = rawData.length;
  const contentH = paddingTop * 2 + headerH + headerGap + itemsCount * itemH + Math.max(0, itemsCount - 1) * itemGap;
  const cardH = Math.max(h, Math.round(contentH));

  // 3. Card (= getCardGlassStyle: --card-bg + viền --border)
  const isFrameless = el.showCardBg === false || el.bgColor === 'transparent';
  if (!isFrameless) {
    const customBg = resolveColor(el.bgColor, vars);
    objects.push(new fabric.Rect({
      left: 0,
      top: 0,
      width: w,
      height: cardH,
      rx: radius,
      ry: radius,
      fill: customBg || themeColors.cardBg,
      stroke: customBg ? (themeColors.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)') : themeColors.border,
      strokeWidth: 1,
      originX: 'center',
      originY: 'top',
      selectable: false,
    } as any));
  }

  // 4. Header Bar (Chỉ hiển thị khi có tiêu đề)
  if (hasTitle) {
    const midY = paddingTop + headerLineH / 2;
    const iconPath = new fabric.Path('M 18 20 L 18 4 M 12 20 L 12 10 M 6 20 L 6 14 M 0 0 M 24 24', {
      fill: 'transparent',
      stroke: accent,
      strokeWidth: 2.2,
      strokeLineCap: 'round',
      scaleX: 13 / 24,
      scaleY: 13 / 24,
      left: -halfW + paddingX + 6.5,
      top: midY,
      originX: 'center',
      originY: 'center',
      selectable: false,
    } as any);
    objects.push(iconPath);

    const titleSize = isCompact ? 11 : 12;
    objects.push(new fabric.IText(ellipsizeToWidth(titleText.toUpperCase(), usableW - 20, titleSize, '800', fontFamily), {
      left: -halfW + paddingX + 20,
      top: midY,
      fontSize: titleSize,
      fontWeight: '800',
      charSpacing: 25,
      fill: themeColors.chartLabel,
      fontFamily,
      originX: 'left',
      originY: 'center',
      selectable: false,
    } as any));

    objects.push(new fabric.Line(
      [-halfW + paddingX, paddingTop + headerH - 0.5, halfW - paddingX, paddingTop + headerH - 0.5],
      { stroke: themeColors.chartAxis, strokeWidth: 1, selectable: false }
    ));
  }

  // 5. Scale + màu cột (= Remotion: cột nổi bật = --chart-highlight, còn lại --chart-bar; bỏ qua mã mẫu cũ)
  const LEGACY_SAMPLE = ['#00D4FF', '#00FF88', '#FFB800'];
  const highlightColor = resolveColor('var(--chart-highlight, var(--accent))', vars) || accent;
  const barBase = resolveColor('var(--chart-bar, var(--surface))', vars) || themeColors.surface;
  const barBorder = resolveColor('var(--chart-bar-border, rgba(255,255,255,0.2))', vars) || 'rgba(255,255,255,0.2)';
  const data = rawData.map((d: any, i: number) => {
    const value = typeof d.value === 'number' ? d.value : (parseFloat(String(d.value || '0').replace(/[^0-9.]/g, '')) || 0);
    const isHighlight = Boolean(d.isHighlight || d.highlight || i === 1);
    const custom = typeof d.color === 'string' && !d.color.startsWith('var(') && !LEGACY_SAMPLE.includes(d.color) ? d.color : '';
    return {
      label: String(d.label || `Mục ${i + 1}`),
      value,
      unit: d.unit || '%',
      isHighlight,
      color: custom || (isHighlight ? highlightColor : barBase),
    };
  });
  const rawMax = Math.max(...data.map((d: any) => d.value), 1);
  const scaleMax = rawMax > 100 ? rawMax : (rawMax <= 10 ? 10 : rawMax);

  // 6. Bars List
  let curY = paddingTop + headerH + headerGap;
  const labelSize = isCompact ? 11 : 12;
  const valueSize = isCompact ? 12 : 13.5;

  data.forEach((d: any) => {
    const barPct = Math.min(100, Math.max(8, (d.value / scaleMax) * 100));
    const barW = Math.max(trackH, (barPct / 100) * usableW);
    const displayVal = `${d.value >= 1000 ? d.value.toLocaleString('en-US') : String(d.value)}${d.unit}`;
    const valueW = measureTextWidth(displayVal, valueSize, '900', 'Inter');
    const rowMid = curY + rowH / 2;

    objects.push(new fabric.IText(ellipsizeToWidth(d.label, usableW - valueW - 8, labelSize, '700', fontFamily), {
      left: -halfW + paddingX,
      top: rowMid,
      fontSize: labelSize,
      fontWeight: '700',
      fill: themeColors.chartLabel,
      fontFamily,
      originX: 'left',
      originY: 'center',
      selectable: false,
    } as any));

    objects.push(new fabric.IText(displayVal, {
      left: halfW - paddingX,
      top: rowMid,
      fontSize: valueSize,
      fontWeight: '900',
      fill: d.isHighlight ? mixColors(themeColors.chartValue, 85, themeColors.text) : themeColors.chartLabel,
      fontFamily: 'Inter',
      originX: 'right',
      originY: 'center',
      selectable: false,
    } as any));

    // Track + cột (cột thường có viền --chart-bar-border bên trong)
    const trackY = curY + rowH + 4;
    objects.push(new fabric.Rect({
      left: -halfW + paddingX,
      top: trackY,
      width: usableW,
      height: trackH,
      rx: trackH / 2,
      ry: trackH / 2,
      fill: themeColors.chartAxis,
      strokeWidth: 0,
      originX: 'left',
      originY: 'top',
      selectable: false,
    } as any));

    const inset = d.isHighlight ? 0 : 0.5;
    objects.push(new fabric.Rect({
      left: -halfW + paddingX + inset,
      top: trackY + inset,
      width: barW - inset * 2,
      height: trackH - inset * 2,
      rx: trackH / 2 - inset,
      ry: trackH / 2 - inset,
      fill: d.color,
      stroke: d.isHighlight ? undefined : barBorder,
      strokeWidth: d.isHighlight ? 0 : 1,
      originX: 'left',
      originY: 'top',
      selectable: false,
    } as any));

    curY += itemH + itemGap;
  });

  return objects;
}
