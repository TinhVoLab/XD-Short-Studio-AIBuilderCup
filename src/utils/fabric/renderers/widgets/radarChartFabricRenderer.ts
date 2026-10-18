import * as fabric from 'fabric';
import { SceneElement } from '@/types/scene';
import { getFabricThemeColors, resolveColor, mixColors } from './colorUtils';
import { ellipsizeToWidth } from './chartTextUtils';

/**
 * Dedicated Radar Chart Fabric 2D Renderer
 * Mirrors Remotion RadarChartElement 100% using SSOT concentric web polygon & spokes logic
 */
export function buildRadarChartFabricObjects(
  el: SceneElement,
  _accent: string,
  w: number,
  h: number
): fabric.FabricObject[] {
  const objects: fabric.FabricObject[] = [];
  const themeColors = getFabricThemeColors(el);
  // = Remotion: el.accentColor || var(--accent)
  const accent = themeColors.accent;

  const DEFAULT_RADAR_DATA = [
    { label: 'Hiệu năng', value: 92 },
    { label: 'Bảo mật', value: 85 },
    { label: 'Dễ học', value: 78 },
    { label: 'Cộng đồng', value: 95 },
    { label: 'Chi phí', value: 65 },
  ];

  const rawData = (el.chartData && Array.isArray(el.chartData) && el.chartData.length >= 3)
    ? el.chartData
    : DEFAULT_RADAR_DATA;

  const titleText = (el.content !== undefined && el.content !== null) ? String(el.content).trim() : '';
  const hasTitle = Boolean(titleText);

  // 1. Center & Geometry (= Remotion)
  const headerH = hasTitle ? 32 : 0;
  const cx = 0; // horizontal center in Fabric group space
  const cy = hasTitle ? headerH + (h - headerH) / 2 : h / 2;
  const maxRadius = hasTitle
    ? Math.min(w * 0.28, (h - headerH) * 0.32)
    : Math.min(w * 0.34, h * 0.35);
  const sides = rawData.length;
  const halfW = w / 2;
  const paddingX = 14;

  /** Polygon Fabric căn theo tâm khung bao — dời theo pathOffset để điểm (0,0) trùng (cx, cy) */
  const polygonAt = (pts: { x: number; y: number }[], opts: any) => {
    const poly = new fabric.Polygon(pts, { ...opts, originX: 'center', originY: 'center', selectable: false });
    poly.set({ left: cx + poly.pathOffset.x, top: cy + poly.pathOffset.y });
    return poly;
  };

  // 2. Khung element (w × h như Remotion) — nền chỉ khi showCardBg / bgColor
  const showCard = Boolean(el.showCardBg);
  const bgFill = showCard
    ? (resolveColor(el.bgColor, themeColors.vars) || themeColors.cardBg)
    : (el.bgColor && el.bgColor !== 'transparent' ? resolveColor(el.bgColor, themeColors.vars) : 'transparent');
  objects.push(new fabric.Rect({
    left: 0,
    top: 0,
    width: w,
    height: h,
    rx: el.radius !== undefined ? el.radius : 16,
    ry: el.radius !== undefined ? el.radius : 16,
    fill: bgFill,
    stroke: showCard ? mixColors(accent, 27) : 'transparent',
    strokeWidth: showCard ? 1 : 0,
    originX: 'center',
    originY: 'top',
    selectable: false,
  } as any));

  // 3. Header Bar (chỉ khi có tiêu đề)
  if (hasTitle) {
    const iconLeft = -halfW + paddingX + 6.5;
    const iconTop = headerH / 2;
    const k = 13 / 24;
    [10, 6, 2].forEach(r => {
      objects.push(new fabric.Circle({
        left: iconLeft,
        top: iconTop,
        radius: r * k,
        fill: 'transparent',
        stroke: accent,
        strokeWidth: 2 * k,
        originX: 'center',
        originY: 'center',
        selectable: false,
      } as any));
    });

    const fontFamily = el.fontFamily || 'Be Vietnam Pro';
    const titleLeft = -halfW + paddingX + 19;
    objects.push(new fabric.IText(ellipsizeToWidth(titleText.toUpperCase(), halfW - paddingX - titleLeft, 11, '800', fontFamily), {
      left: titleLeft,
      top: iconTop,
      fontSize: 11,
      fontWeight: '800',
      charSpacing: 40,
      fill: themeColors.chartLabel,
      fontFamily,
      originX: 'left',
      originY: 'center',
      selectable: false,
    } as any));

    objects.push(new fabric.Line(
      [-halfW, headerH - 0.5, halfW, headerH - 0.5] as [number, number, number, number],
      { stroke: themeColors.border, strokeWidth: 1, selectable: false } as any
    ));
  }

  // 4. Concentric Web Polygon Rings (4 Levels)
  [0.25, 0.5, 0.75, 1.0].forEach((level, idx) => {
    const r = maxRadius * level;
    const ringPoints = rawData.map((_: any, i: number) => {
      const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
      return { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
    });
    objects.push(polygonAt(ringPoints, {
      fill: idx % 2 === 0 ? mixColors(accent, 4) : 'transparent',
      stroke: themeColors.chartGrid,
      strokeWidth: 1.2,
      strokeDashArray: idx < 3 ? [4, 4] : undefined,
    }));
  });

  // 5. Radial Spokes Lines
  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
    objects.push(new fabric.Line(
      [cx, cy, cx + Math.cos(angle) * maxRadius, cy + Math.sin(angle) * maxRadius] as [number, number, number, number],
      { stroke: themeColors.chartAxis, strokeWidth: 1.2, selectable: false } as any
    ));
  }

  // 6. Value Vertices & Labels
  const valuePoints = rawData.map((d: any, i: number) => {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
    const val = Math.min(100, Math.max(0, Number(d.value) || 0)) / 100;
    const localX = Math.cos(angle) * maxRadius * val;
    const localY = Math.sin(angle) * maxRadius * val;
    const labelDist = maxRadius + 20;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const textAnchor: 'center' | 'left' | 'right' = Math.abs(cosA) < 0.25 ? 'center' : cosA > 0 ? 'left' : 'right';
    const yOffset = sinA < -0.8 ? -4 : sinA > 0.8 ? 8 : 0;
    return {
      localX,
      localY,
      x: cx + localX,
      y: cy + localY,
      lx: cx + cosA * labelDist,
      ly: cy + sinA * labelDist + yOffset,
      textAnchor,
      label: String(d.label || ''),
      value: Number(d.value) || 0,
    };
  });

  const polyCoords = valuePoints.map((p: any) => ({ x: p.localX, y: p.localY }));

  // 7. Value Area: glow + đa giác gradient (accent 50% → series-1 18%)
  if (polyCoords.length > 0) {
    objects.push(polygonAt(polyCoords, {
      fill: 'transparent',
      stroke: accent,
      strokeWidth: 6,
      opacity: 0.3,
      strokeLineJoin: 'round',
    }));
    objects.push(polygonAt(polyCoords, {
      fill: new (fabric as any).Gradient({
        type: 'linear',
        gradientUnits: 'percentage',
        coords: { x1: 0, y1: 0, x2: 1, y2: 1 },
        colorStops: [
          { offset: 0, color: mixColors(accent, 50) },
          { offset: 1, color: mixColors(themeColors.chartSeries[0], 18) },
        ],
      }),
      stroke: accent,
      strokeWidth: 3,
      strokeLineJoin: 'round',
    }));
  }

  // 8. Vertex Nodes & Axis Labels
  valuePoints.forEach((pt: any) => {
    objects.push(new fabric.Circle({
      left: pt.x, top: pt.y, radius: 7,
      fill: accent, opacity: 0.4, strokeWidth: 0,
      originX: 'center', originY: 'center', selectable: false,
    } as any));
    objects.push(new fabric.Circle({
      left: pt.x, top: pt.y, radius: 3.8,
      fill: themeColors.text, stroke: accent, strokeWidth: 2,
      originX: 'center', originY: 'center', selectable: false,
    } as any));

    objects.push(new fabric.IText(pt.label, {
      left: pt.lx,
      top: pt.ly - 5,
      fontSize: 11,
      fontWeight: '800',
      fill: themeColors.chartLabel,
      fontFamily: 'Be Vietnam Pro',
      textAlign: pt.textAnchor,
      originX: pt.textAnchor,
      originY: 'center',
      selectable: false,
    } as any));

    objects.push(new fabric.IText(`${pt.value}%`, {
      left: pt.lx,
      top: pt.ly + 8,
      fontSize: 10.5,
      fontWeight: '900',
      fill: themeColors.textSub,
      fontFamily: 'Inter',
      textAlign: pt.textAnchor,
      originX: pt.textAnchor,
      originY: 'center',
      selectable: false,
    } as any));
  });

  return objects;
}
