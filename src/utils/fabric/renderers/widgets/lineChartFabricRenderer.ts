import * as fabric from 'fabric';
import { SceneElement } from '@/types/scene';
import { getFabricThemeColors, resolveColor, mixColors } from './colorUtils';
import { ellipsizeToWidth } from './chartTextUtils';

/**
 * Dedicated Line Chart Fabric 2D Renderer
 * Mirrors Remotion LineChartElement 100% using SSOT spline & data points logic
 */
export function buildLineChartFabricObjects(
  el: SceneElement,
  _accent: string,
  w: number,
  h: number
): fabric.FabricObject[] {
  const objects: fabric.FabricObject[] = [];
  const themeColors = getFabricThemeColors(el);
  const halfW = w / 2;
  // = Remotion: el.accentColor || var(--chart-series-1)
  const color = resolveColor(el.accentColor, themeColors.vars) || themeColors.chartSeries[0];
  const radius = el.radius !== undefined ? el.radius : 16;
  const isCompact = (el.variant || 'smooth-curve') === 'compact';
  const fontFamily = el.fontFamily || 'Be Vietnam Pro';

  // 1. Data Normalization
  const rawData = (el.chartData && el.chartData.length > 0)
    ? el.chartData
    : [
        { label: 'T1', value: 25 },
        { label: 'T2', value: 45 },
        { label: 'T3', value: 38 },
        { label: 'T4', value: 85 },
        { label: 'T5', value: 70 },
        { label: 'T6', value: 110 },
      ];

  // 2. Geometry — khớp DOM Remotion: card padding 12/14 (compact 10/12), header 28, gap 4, marginTop 2,
  // SVG viewBox (usableW × graphH+38) co "meet" vào vùng còn lại rồi căn giữa
  const padY = isCompact ? 10 : 12;
  const padX = isCompact ? 12 : 14;
  const headerH = 28;
  const paddingX = 16;
  const paddingBottom = 22;
  const paddingTop = 16;
  const usableW = Math.max(60, w - paddingX * 2);
  const graphH = Math.max(40, h - headerH - paddingBottom - paddingTop);
  const vbH = graphH + paddingTop + paddingBottom;
  const boxW = w - padX * 2;
  const boxTop = padY + headerH + 4 + 2;
  const boxH = Math.max(1, h - padY * 2 - headerH - 4 - 2);
  const k = Math.min(boxW / usableW, boxH / vbH);
  const ox = -halfW + padX + (boxW - usableW * k) / 2;
  const oy = boxTop + (boxH - vbH * k) / 2;
  const X = (x: number) => ox + x * k;
  const Y = (y: number) => oy + y * k;

  // 3. Card Background (= getGlassmorphicStyle)
  const isFrameless = el.showCardBg === false || el.bgColor === 'transparent';
  if (!isFrameless) {
    objects.push(new fabric.Rect({
      left: 0,
      top: 0,
      width: w,
      height: h,
      rx: radius,
      ry: radius,
      fill: resolveColor(el.bgColor, themeColors.vars) || themeColors.cardBg,
      stroke: mixColors(color, 40),
      strokeWidth: 1,
      originX: 'center',
      originY: 'top',
      selectable: false,
    } as any));
  }

  // 4. Header Bar
  const headerMidY = padY + (headerH - 5) / 2;
  const iconPath = new fabric.Path('M 23 6 L 13.5 15.5 L 8.5 10.5 L 1 18 M 17 6 L 23 6 L 23 12', {
    fill: 'transparent',
    stroke: color,
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
  objects.push(iconPath);

  const titleSize = isCompact ? 11 : 12;
  const cleanTitle = ellipsizeToWidth(el.content || 'XU HƯỚNG TĂNG TRƯỞNG', boxW - 19, titleSize, '800', fontFamily);
  objects.push(new fabric.IText(cleanTitle, {
    left: -halfW + padX + 19,
    top: headerMidY,
    fontSize: titleSize,
    fontWeight: '800',
    charSpacing: 25,
    fill: themeColors.chartLabel,
    fontFamily,
    originX: 'left',
    originY: 'center',
    selectable: false,
  } as any));

  // Header bottom divider
  const divY = padY + headerH - 0.5;
  objects.push(new fabric.Line(
    [-halfW + padX, divY, halfW - padX, divY],
    {
      stroke: themeColors.border,
      strokeWidth: 1,
      selectable: false,
    }
  ));

  // 5. Horizontal Gridlines
  [paddingTop, paddingTop + graphH * 0.5, paddingTop + graphH].forEach((gy, idx) => {
    const isBaseline = idx === 2;
    objects.push(new fabric.Line(
      [X(0), Y(gy), X(usableW), Y(gy)],
      {
        stroke: isBaseline ? themeColors.chartAxis : themeColors.chartGrid,
        strokeWidth: k,
        strokeDashArray: isBaseline ? undefined : [3 * k, 3 * k],
        selectable: false,
      }
    ));
  });

  // 6. Calculate Points & Smooth Cubic Bezier Spline (toạ độ đã quy về khung Fabric)
  const vals = rawData.map((d: any) => Number(d.value) || 0);
  const rawMax = Math.max(...vals, 10);
  const rawMin = Math.min(...vals, 0);
  const padVal = (rawMax - rawMin) * 0.15 || 5;
  const effMax = rawMax + padVal;
  const effMin = Math.max(0, rawMin - padVal);

  const pts = rawData.map((d: any, i: number) => {
    const val = Number(d.value) || 0;
    const pct = (val - effMin) / (effMax - effMin || 1);
    return {
      x: X((i / Math.max(1, rawData.length - 1)) * usableW),
      y: Y(paddingTop + graphH - pct * graphH),
      label: String(d.label || ''),
      value: val,
    };
  });

  let pathD = '';
  if (pts.length > 0) {
    pathD = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cpx = p0.x + (p1.x - p0.x) / 2;
      pathD += ` C ${cpx} ${p0.y}, ${cpx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
  }

  // 7. Area Fill Path with Vertical Gradient (opacity 0.9 như frame cuối)
  const baseY = Y(paddingTop + graphH);
  if (pts.length > 0) {
    const lastPt = pts[pts.length - 1];
    const firstPt = pts[0];
    const areaD = `${pathD} L ${lastPt.x} ${baseY} L ${firstPt.x} ${baseY} Z`;
    const areaPath = new fabric.Path(areaD, {
      fill: new (fabric as any).Gradient({
        type: 'linear',
        gradientUnits: 'percentage',
        coords: { x1: 0, y1: 0, x2: 0, y2: 1 },
        colorStops: [
          { offset: 0, color: mixColors(color, 40) },
          { offset: 0.6, color: mixColors(color, 10) },
          { offset: 1, color: mixColors(color, 0) },
        ],
      }),
      opacity: 0.9,
      stroke: 'transparent',
      originX: 'center',
      originY: 'center',
      selectable: false,
    } as any);
    areaPath.set({ left: areaPath.pathOffset.x, top: areaPath.pathOffset.y });
    objects.push(areaPath);
  }

  // 8. Glow Spline Line + Main Spline Line
  if (pathD) {
    [{ sw: 7, op: 0.3 }, { sw: 3, op: 1 }].forEach(({ sw, op }) => {
      const line = new fabric.Path(pathD, {
        fill: 'transparent',
        stroke: color,
        strokeWidth: sw * k,
        opacity: op,
        strokeLineCap: 'round',
        strokeLineJoin: 'round',
        originX: 'center',
        originY: 'center',
        selectable: false,
      } as any);
      line.set({ left: line.pathOffset.x, top: line.pathOffset.y });
      objects.push(line);
    });
  }

  // 9. Data Points & Value / X-Axis Labels
  pts.forEach((p) => {
    objects.push(new fabric.Circle({
      left: p.x, top: p.y, radius: 6 * k,
      fill: mixColors(color, 25),
      strokeWidth: 0,
      originX: 'center', originY: 'center', selectable: false,
    } as any));
    objects.push(new fabric.Circle({
      left: p.x, top: p.y, radius: 3.5 * k,
      fill: themeColors.surface,
      stroke: color,
      strokeWidth: 2 * k,
      originX: 'center', originY: 'center', selectable: false,
    } as any));

    // Score above point (SVG text baseline y-8 → tâm chữ ≈ baseline − 0.35em)
    objects.push(new fabric.IText(String(p.value), {
      left: p.x,
      top: p.y - (8 + 9.5 * 0.35) * k,
      fontSize: 9.5 * k,
      fontWeight: '800',
      fill: themeColors.chartValue,
      fontFamily: 'Inter',
      originX: 'center',
      originY: 'center',
      selectable: false,
    } as any));

    if (p.label) {
      objects.push(new fabric.IText(p.label, {
        left: p.x,
        top: Y(paddingTop + graphH + 15 - 8.5 * 0.35),
        fontSize: 8.5 * k,
        fontWeight: '600',
        fill: themeColors.chartLabel,
        fontFamily: 'Be Vietnam Pro',
        originX: 'center',
        originY: 'center',
        selectable: false,
      } as any));
    }
  });

  return objects;
}
