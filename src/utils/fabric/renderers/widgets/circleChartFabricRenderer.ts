import * as fabric from 'fabric';
import { SceneElement } from '@/types/scene';
import { getFabricThemeColors, mixColors } from './colorUtils';
import { measureTextWidth } from './chartTextUtils';

/**
 * Dedicated Circle-Chart (Vòng Tròn Tiến Độ) Fabric 2D Renderer
 * Mirrors Remotion CircleChartElement 100% (Progress arc, glowing tip dot, centered percentage, bottom capsule)
 */
export function buildCircleChartFabricObjects(
  el: SceneElement,
  _accent: string,
  _w: number,
  h: number
): fabric.FabricObject[] {
  const objects: fabric.FabricObject[] = [];
  const themeColors = getFabricThemeColors(el);
  // = Remotion: el.accentColor || var(--accent)
  const accent = themeColors.accent;
  const size = typeof el.width === 'number' && el.width > 0 ? el.width : 140;
  const strokeW = el.strokeWidth || Math.max(8, Math.round(size * 0.085));
  const targetPct = el.percent !== undefined ? el.percent : 85;
  const currentPct = Math.min(100, Math.max(0, targetPct));
  // = Remotion: nhãn luôn hiện (mặc định "TIẾN ĐỘ")
  const labelText = String(el.statLabel || el.content || 'TIẾN ĐỘ').trim();

  // Group coordinates: originX = 'center', originY = 'top'
  const cx = 0;
  const cy = size / 2;
  const radius = Math.max(10, (size - strokeW * 2) / 2);

  // 0. Khung element size × h (vùng chọn khớp hộp Remotion + nhãn)
  objects.push(new fabric.Rect({
    left: cx, top: 0, width: size, height: Math.max(size, h || 0),
    fill: 'transparent', strokeWidth: 0,
    originX: 'center', originY: 'top', selectable: false,
  } as any));

  // 1. Outer subtle halo track ring
  objects.push(new fabric.Circle({
    left: cx,
    top: cy,
    radius: radius + strokeW * 0.7,
    fill: 'transparent',
    stroke: themeColors.chartGrid,
    strokeWidth: 1,
    strokeDashArray: [4, 4],
    originX: 'center',
    originY: 'center',
    selectable: false,
  } as any));

  // 2. Background track ring (đĩa = --surface 60%)
  objects.push(new fabric.Circle({
    left: cx,
    top: cy,
    radius,
    fill: mixColors(themeColors.surface, 60),
    stroke: themeColors.chartAxis,
    strokeWidth: strokeW,
    originX: 'center',
    originY: 'center',
    selectable: false,
  } as any));

  // 3. Progress arc (gradient accent → --chart-series-2 theo khung tròn, như linearGradient SVG)
  if (currentPct > 0) {
    const clampedAnglePct = currentPct >= 100 ? 99.999 : currentPct;
    const endAngleRad = ((clampedAnglePct / 100) * 360 - 90) * Math.PI / 180;
    const startY = cy - radius;
    const endX = cx + Math.cos(endAngleRad) * radius;
    const endY = cy + Math.sin(endAngleRad) * radius;
    const largeArcFlag = clampedAnglePct > 50 ? 1 : 0;
    const arcD = `M ${cx.toFixed(2)} ${startY.toFixed(2)} A ${radius.toFixed(2)} ${radius.toFixed(2)} 0 ${largeArcFlag} 1 ${endX.toFixed(2)} ${endY.toFixed(2)}`;

    const makeArc = (sw: number, opacity: number) => {
      const arc = new fabric.Path(arcD, {
        fill: 'transparent',
        strokeWidth: sw,
        strokeLineCap: 'round',
        opacity,
        originX: 'center',
        originY: 'center',
        selectable: false,
      } as any);
      // toạ độ gradient (pixels) tính từ góc trên-trái khung bao path
      const bx = arc.pathOffset.x - (arc.width || 0) / 2;
      const by = arc.pathOffset.y - (arc.height || 0) / 2;
      arc.set({
        left: arc.pathOffset.x,
        top: arc.pathOffset.y,
        stroke: new (fabric as any).Gradient({
          type: 'linear',
          gradientUnits: 'pixels',
          coords: { x1: cx - radius - bx, y1: cy - radius - by, x2: cx + radius - bx, y2: cy + radius - by },
          colorStops: [
            { offset: 0, color: accent },
            { offset: 1, color: themeColors.chartSeries[1] },
          ],
        }),
      });
      return arc;
    };
    objects.push(makeArc(strokeW + 4, 0.25));
    objects.push(makeArc(strokeW, 1));

    // 4. Glowing Leading Tip Dot
    if (currentPct > 3) {
      [{ r: 0.6, op: 0.35 }, { r: 0.7, op: 0.3 }].forEach(({ r, op }) => {
        objects.push(new fabric.Circle({
          left: endX, top: endY, radius: strokeW * r,
          fill: accent, opacity: op, strokeWidth: 0,
          originX: 'center', originY: 'center', selectable: false,
        } as any));
      });
      objects.push(new fabric.Circle({
        left: endX, top: endY, radius: strokeW * 0.35,
        fill: themeColors.text, strokeWidth: 0,
        originX: 'center', originY: 'center', selectable: false,
      } as any));
    }
  }

  // 5. Center Typography (Percentage Number)
  const pctSize = Math.round(size * 0.28);
  objects.push(new fabric.IText(`${Math.round(currentPct)}%`, {
    left: cx,
    top: cy,
    fontSize: pctSize,
    fontWeight: '900',
    charSpacing: (-0.5 / pctSize) * 1000,
    fill: themeColors.text,
    fontFamily: 'Be Vietnam Pro',
    originX: 'center',
    originY: 'center',
    selectable: false,
  } as any));

  // 6. Nhãn dưới vòng: pill nền --card-bg, viền accent 40%; đáy pill cách đáy vòng max(24, 16% size)
  if (labelText) {
    const labelFontSize = Math.max(9.5, Math.round(size * 0.082));
    const label = labelText.toUpperCase();
    const charSpacing = (0.5 / labelFontSize) * 1000;
    const textW = measureTextWidth(label, labelFontSize, '800', 'Be Vietnam Pro') + 0.5 * label.length;
    const pillW = textW + 24 + 2;
    const pillH = Math.round(labelFontSize * 1.46) + 6 + 2;
    const pillBottom = size + Math.max(24, Math.round(size * 0.16));
    const pillMidY = pillBottom - pillH / 2;

    objects.push(new fabric.Rect({
      left: cx,
      top: pillMidY,
      width: pillW,
      height: pillH,
      rx: Math.min(20, pillH / 2),
      ry: Math.min(20, pillH / 2),
      fill: themeColors.cardBg,
      stroke: mixColors(accent, 40),
      strokeWidth: 1,
      originX: 'center',
      originY: 'center',
      selectable: false,
    } as any));

    objects.push(new fabric.IText(label, {
      left: cx,
      top: pillMidY,
      fontSize: labelFontSize,
      fontWeight: '800',
      fill: el.accentColor ? mixColors(accent, 60, themeColors.text) : accent,
      fontFamily: 'Be Vietnam Pro',
      charSpacing,
      originX: 'center',
      originY: 'center',
      selectable: false,
    } as any));
  }

  return objects;
}
