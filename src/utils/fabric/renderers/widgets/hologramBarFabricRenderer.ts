import * as fabric from 'fabric';
import { SceneElement } from '@/types/scene';
import { calculateElementDynamicHeight } from '@/config/layoutRegistry';
import { getFabricThemeColors, resolveColor, mixColors } from './colorUtils';
import { measureTextWidth, ellipsizeToWidth } from './chartTextUtils';

/** = dữ liệu mẫu của HologramBarElement (màu = --chart-series-N, accent = --accent) */
const DEFAULT_HOLOGRAM_DATA = {
  title: 'HỆ THỐNG XUNG LỰC',
  accentColor: 'var(--accent, #BEFF01)',
  showScanline: true,
  bars: [
    { label: 'GPU CLUSTER', value: 85, color: 'var(--chart-series-1, #00D4FF)', sub: '92 TFLOPS' },
    { label: 'NEURAL CHIP', value: 92, color: 'var(--chart-series-2, #BEFF01)', sub: '128 TOPS' },
    { label: 'QUANTUM BUS', value: 64, color: 'var(--chart-series-3, #FF2D78)', sub: '4.8 GB/s' },
  ],
};

/**
 * Dedicated Hologram-Bar (Cột Năng Lượng 3D) Fabric 2D Renderer — khung hình cuối của HologramBarElement:
 * card --surface-1 (hoặc frameless), header tia sét + nhãn "3D ISO", trụ 3D isometric, nhãn % trên nền --surface-2.
 * Scanline & hạt năng lượng chạy theo frame trong video → vẽ ở vị trí frame 0.
 */
export function buildHologramBarFabricObjects(
  el: SceneElement,
  _accent: string,
  w: number,
  h: number
): fabric.FabricObject[] {
  const objects: fabric.FabricObject[] = [];
  const themeColors = getFabricThemeColors(el);
  const vars = themeColors.vars;
  const containerWidth = typeof el.width === 'number' && el.width > 0 ? el.width : (w || 320);
  const dynamicH = calculateElementDynamicHeight(el);
  const totalH = typeof h === 'number' && h > 0 ? Math.max(h, dynamicH) : dynamicH;
  const halfW = containerWidth / 2;

  const data: any = (el as any).hologramBarData || DEFAULT_HOLOGRAM_DATA;
  const accentColor = resolveColor(data.accentColor, vars) || vars['--accent'] || themeColors.accent;
  const showScanline = data.showScanline !== false;
  const showCardBg = el.showCardBg !== false && data.showCardBg !== false;
  const bars: any[] = Array.isArray(data.bars) ? data.bars : [];

  const title = String(data.title ?? (el as any).title ?? '').trim();
  const hasTitle = Boolean(title);

  // Geometry (= Remotion)
  const border = showCardBg ? 1 : 0;
  const padTop = showCardBg ? 10 : 4;
  const padLeft = showCardBg ? 14 : 6;
  const padH = showCardBg ? 28 : 12;
  const padV = showCardBg ? 20 : 8;
  const headerH = hasTitle ? 32 : 0;
  const svgW = Math.max(100, containerWidth - padH);
  const svgH = Math.max(60, totalH - padV - headerH);
  const svgBaseY = svgH - 35;
  const maxBarHeight = Math.max(20, svgBaseY - 25);
  const count = Math.max(1, bars.length);
  const barWidth = Math.min(38, Math.max(20, (svgW / count) * 0.42));
  const rx = barWidth / 2;
  const ry = rx * 0.35;

  const titleLineH = 16;
  const headerBlock = hasTitle ? titleLineH + 6 + 1 + 8 : 0; // dòng + paddingBottom + viền + marginBottom
  const svgTop = border + padTop + headerBlock;
  const svgLeft = -halfW + border + padLeft;
  const baseY = svgTop + svgBaseY;

  // 1. Card (--surface-1, viền --border) / khung element khi frameless
  objects.push(new fabric.Rect({
    left: 0,
    top: 0,
    width: containerWidth,
    height: totalH,
    rx: showCardBg ? 14 : 0,
    ry: showCardBg ? 14 : 0,
    fill: showCardBg ? themeColors.surface1 : 'transparent',
    stroke: showCardBg ? themeColors.border : 'transparent',
    strokeWidth: showCardBg ? 1 : 0,
    originX: 'center',
    originY: 'top',
    selectable: false,
  } as any));

  // 2. Laser Scanline (vị trí frame 0)
  if (showScanline) {
    const scanY = hasTitle ? 35 : 10;
    objects.push(new fabric.Rect({
      left: 0,
      top: scanY,
      width: containerWidth - border * 2,
      height: 2,
      fill: new (fabric as any).Gradient({
        type: 'linear',
        gradientUnits: 'percentage',
        coords: { x1: 0, y1: 0, x2: 1, y2: 0 },
        colorStops: [
          { offset: 0, color: 'rgba(0, 212, 255, 0)' },
          { offset: 0.25, color: 'rgba(0, 212, 255, 0.6)' },
          { offset: 0.5, color: 'rgba(190, 255, 1, 0.8)' },
          { offset: 0.75, color: 'rgba(0, 212, 255, 0.6)' },
          { offset: 1, color: 'rgba(0, 212, 255, 0)' },
        ],
      }),
      strokeWidth: 0,
      originX: 'center',
      originY: 'top',
      selectable: false,
    } as any));
  }

  // 3. Header (tia sét accent + tiêu đề --text + nhãn "3D ISO" chữ --text-sub)
  if (hasTitle) {
    const midY = border + padTop + titleLineH / 2;
    const left = -halfW + border + padLeft;
    objects.push(new fabric.Path('M 13 2 L 3 14 L 12 14 L 11 22 L 21 10 L 12 10 L 13 2 Z M 0 0 M 24 24', {
      fill: accentColor,
      stroke: accentColor,
      strokeWidth: 1,
      scaleX: 13 / 24,
      scaleY: 13 / 24,
      left: left + 6.5,
      top: midY,
      originX: 'center',
      originY: 'center',
      selectable: false,
    } as any));

    const isoText = '3D ISO';
    const isoW = measureTextWidth(isoText, 8.5, '800', 'monospace') + 0.51 * isoText.length + 12 + 2;
    const isoRight = halfW - border - padLeft;
    const titleLeft = left + 13 + 6;
    objects.push(new fabric.IText(ellipsizeToWidth(title, isoRight - isoW - 8 - titleLeft, 11, '800', 'Be Vietnam Pro'), {
      left: titleLeft,
      top: midY,
      fontSize: 11,
      fontWeight: '800',
      charSpacing: 80,
      fill: themeColors.text,
      fontFamily: 'Be Vietnam Pro',
      originX: 'left',
      originY: 'center',
      selectable: false,
    } as any));

    objects.push(new fabric.Rect({
      left: isoRight - isoW / 2,
      top: midY,
      width: isoW,
      height: 8.5 * 1.2 + 4 + 2,
      rx: 4,
      ry: 4,
      fill: mixColors(accentColor, 15),
      stroke: mixColors(accentColor, 30),
      strokeWidth: 1,
      originX: 'center',
      originY: 'center',
      selectable: false,
    } as any));
    objects.push(new fabric.IText(isoText, {
      left: isoRight - isoW / 2,
      top: midY,
      fontSize: 8.5,
      fontWeight: '800',
      charSpacing: 60,
      fill: themeColors.textSub,
      fontFamily: 'monospace',
      originX: 'center',
      originY: 'center',
      selectable: false,
    } as any));

    const divY = border + padTop + titleLineH + 6 + 0.5;
    objects.push(new fabric.Line([left, divY, halfW - border - padLeft, divY] as [number, number, number, number], {
      stroke: themeColors.border,
      strokeWidth: 1,
      selectable: false,
    }));
  }

  // 4. Ground line (literal như Remotion)
  objects.push(new fabric.Line([svgLeft, baseY, svgLeft + svgW, baseY] as [number, number, number, number], {
    stroke: 'rgba(255, 255, 255, 0.08)',
    strokeWidth: 1,
    strokeDashArray: [4, 4],
    selectable: false,
  }));

  // 5. Hạt năng lượng (frame 0)
  for (let i = 0; i < 12; i++) {
    const p = ((i * 15) % 100) / 100;
    const alpha = Math.sin(p * Math.PI) * 0.6;
    if (alpha <= 0.01) continue;
    objects.push(new fabric.Circle({
      left: svgLeft + 10 + ((i * 47) % (svgW - 20)),
      top: baseY - p * (maxBarHeight + 15),
      radius: 1.5 + (i % 3) * 0.8,
      fill: '#00D4FF',
      opacity: alpha,
      strokeWidth: 0,
      originX: 'center',
      originY: 'center',
      selectable: false,
    } as any));
  }

  // 6. Trụ 3D
  bars.forEach((b: any, idx: number) => {
    const cx = svgLeft + (svgW / count) * (idx + 0.5);
    const barCol = resolveColor(b.color, vars) || '#00D4FF';
    const value = Number(b.value) || 50;
    const currentH = Math.max(12, (value / 100) * maxBarHeight);
    const topY = baseY - currentH;

    objects.push(new fabric.Ellipse({
      left: cx, top: baseY, rx: rx + 4, ry: ry + 2,
      fill: barCol, opacity: 0.2, strokeWidth: 0,
      originX: 'center', originY: 'center', selectable: false,
    } as any));
    objects.push(new fabric.Ellipse({
      left: cx, top: baseY, rx, ry,
      fill: themeColors.surface1, stroke: barCol, strokeWidth: 1.5,
      originX: 'center', originY: 'center', selectable: false,
    } as any));

    objects.push(new fabric.Rect({
      left: cx - rx,
      top: topY,
      width: barWidth,
      height: currentH,
      fill: new (fabric as any).Gradient({
        type: 'linear',
        gradientUnits: 'percentage',
        coords: { x1: 0, y1: 0, x2: 1, y2: 0 },
        colorStops: [
          { offset: 0, color: mixColors(barCol, 40) },
          { offset: 0.4, color: mixColors(barCol, 90) },
          { offset: 1, color: mixColors(barCol, 30) },
        ],
      }),
      opacity: 0.85,
      strokeWidth: 0,
      originX: 'left',
      originY: 'top',
      selectable: false,
    } as any));

    for (let sIdx = 1; sIdx <= 4; sIdx++) {
      const segY = baseY - (currentH / 4) * sIdx;
      if (segY <= topY) continue;
      objects.push(new fabric.Ellipse({
        left: cx, top: segY, rx, ry,
        fill: 'transparent', stroke: themeColors.text, strokeWidth: 0.8, opacity: 0.4,
        originX: 'center', originY: 'center', selectable: false,
      } as any));
    }

    objects.push(new fabric.Ellipse({
      left: cx, top: topY, rx, ry,
      fill: barCol, stroke: themeColors.text, strokeWidth: 1.5, opacity: 0.95,
      originX: 'center', originY: 'center', selectable: false,
    } as any));

    // Nhãn % nổi: nền --surface-2, viền màu cột, chữ --text
    const badgeCy = topY - 14;
    objects.push(new fabric.Rect({
      left: cx, top: badgeCy - 1, width: 32, height: 14, rx: 4, ry: 4,
      fill: themeColors.surface2, stroke: barCol, strokeWidth: 1,
      originX: 'center', originY: 'center', selectable: false,
    } as any));
    objects.push(new fabric.IText(`${Math.round(value)}%`, {
      left: cx,
      top: badgeCy - 0.5,
      fontSize: 8.5,
      fontWeight: '900',
      fill: themeColors.text,
      fontFamily: 'Be Vietnam Pro',
      originX: 'center',
      originY: 'center',
      selectable: false,
    } as any));

    // Nhãn dưới (SVG baseline baseY+16 / +27 → tâm chữ ≈ baseline − 0.35em)
    objects.push(new fabric.IText(String(b.label ?? ''), {
      left: cx,
      top: baseY + 16 - 3,
      fontSize: 8.5,
      fontWeight: '800',
      fill: themeColors.text,
      opacity: 0.9,
      fontFamily: 'Be Vietnam Pro',
      originX: 'center',
      originY: 'center',
      selectable: false,
    } as any));
    if (b.sub) {
      objects.push(new fabric.IText(String(b.sub), {
        left: cx,
        top: baseY + 27 - 2.5,
        fontSize: 7,
        fontWeight: '600',
        fill: themeColors.textSub,
        fontFamily: 'monospace',
        originX: 'center',
        originY: 'center',
        selectable: false,
      } as any));
    }
  });

  return objects;
}
