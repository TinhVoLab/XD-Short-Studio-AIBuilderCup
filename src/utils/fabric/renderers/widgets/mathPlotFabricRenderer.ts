import * as fabric from 'fabric';
import { SceneElement } from '@/types/scene';
import { MathPlotData } from '@/types/stem';
import { getFabricThemeColors, resolveColor, mixColors } from './colorUtils';
import { compileExpr, PLOT_DEFAULT_DOMAIN_X, PLOT_DEFAULT_DOMAIN_Y } from '@/utils/stem/mathExpr';

/**
 * Dedicated Fabric 2D Vector Renderer for Math Plot Elements (WYSIWYG 1:1)
 * Renders mathematical functions, coordinate systems, and analysis visuals
 * Coordinates are centered horizontally around x = 0 ([-halfW, halfW]) with top = 0.
 */
export function buildMathPlotFabricObjects(
  el: SceneElement,
  accent: string,
  w: number,
  h: number
): fabric.FabricObject[] {
  const objects: fabric.FabricObject[] = [];
  const halfW = w / 2;
  const themeColors = getFabricThemeColors(el);
  const data: MathPlotData = el.mathData || {
    expression: '0.25 * x^3 - x',
    domainX: [-5, 5],
    domainY: [-2.5, 2.5],
    color: accent || themeColors.accent,
    lineWidth: 3,
    showGrid: true,
    showAxes: true,
  };

  // Khớp MathPlotElement: lime #BEFF01 (preset cũ) hoặc chưa chọn → accent của theme
  const rawLineColor = resolveColor(data.color || el.accentColor, themeColors.vars);
  const safeAccent = !rawLineColor || /^#beff01$/i.test(rawLineColor.trim())
    ? themeColors.vars['--accent']
    : rawLineColor;
  const showCardBg = el.showCardBg !== false && el.bgColor !== 'transparent';
  const latexLabel = String(data.latexLabel || '').trim();
  const titleText = String(data.title || '').trim();
  h = Math.max(100, h);

  // 1. Card Background (= var(--card-bg) + viền var(--border))
  if (showCardBg) {
    const cardRadius = el.radius !== undefined ? el.radius : 12;
    objects.push(
      new fabric.Rect({
        left: 0,
        top: 0,
        width: w,
        height: h,
        rx: cardRadius,
        ry: cardRadius,
        fill: el.bgColor || themeColors.cardBg,
        stroke: el.stroke || themeColors.border,
        strokeWidth: 1,
        originX: 'center',
        originY: 'top',
        selectable: false,
      })
    );
  }

  // Chip công thức: nền --surface-1, viền color-mix(line 45%), chữ --text (khớp chip KaTeX)
  const pushFormulaChip = (right: number, centerY: number, fontSize: number) => {
    const chipText = new fabric.Text(latexLabel, {
      fontSize,
      fontWeight: '500',
      fill: themeColors.text,
      fontFamily: 'Cambria, Times New Roman, serif',
      originX: 'right',
      originY: 'center',
      left: right - 9,
      top: centerY,
      selectable: false,
    });
    const chipW = (chipText.width || 0) + 18;
    objects.push(
      new fabric.Rect({
        left: right,
        top: centerY,
        width: chipW,
        height: fontSize + 10,
        rx: 6,
        ry: 6,
        fill: themeColors.surface1,
        stroke: mixColors(safeAccent, 45),
        strokeWidth: 1,
        originX: 'right',
        originY: 'center',
        selectable: false,
      })
    );
    objects.push(chipText);
  };

  // 2. Dynamic Header Bar (chỉ khi có thẻ và có tiêu đề / công thức — như Remotion)
  let headerH = 0;
  if (showCardBg && (titleText || latexLabel)) {
    headerH = 40;
    objects.push(
      new fabric.Rect({
        left: 0,
        top: 0.5,
        width: w - 1,
        height: headerH - 0.5,
        fill: themeColors.surface1,
        strokeWidth: 0,
        originX: 'center',
        originY: 'top',
        selectable: false,
      })
    );

    if (titleText) {
      objects.push(
        new fabric.Text(titleText, {
          left: -halfW + 14,
          top: headerH / 2,
          fontSize: 12,
          fontWeight: '700',
          fill: themeColors.text,
          fontFamily: 'Be Vietnam Pro, -apple-system, sans-serif',
          originX: 'left',
          originY: 'center',
          selectable: false,
        })
      );
    }
    if (latexLabel) pushFormulaChip(halfW - 14, headerH / 2, 12);

    // Header divider line
    objects.push(
      new fabric.Line([-halfW, headerH, halfW, headerH], {
        stroke: themeColors.border,
        strokeWidth: 1,
        selectable: false,
      })
    );
  } else if (!showCardBg && latexLabel) {
    // Chip KaTeX nổi ở góc phải khi frameless
    pushFormulaChip(halfW - 12, 10 + 11, 13);
  }

  // 3. Cartesian Coordinate System Geometry (Oxy)
  const padX = 16;
  const padY = 14;
  const plotLeft = -halfW + padX;
  const plotRight = halfW - padX;
  const plotTop = headerH + padY;
  const plotBottom = h - padY;
  const plotW = Math.max(10, plotRight - plotLeft);
  const plotH = Math.max(10, plotBottom - plotTop);

  const domainX = (data.domainX || PLOT_DEFAULT_DOMAIN_X) as [number, number];
  const domainY = (data.domainY || PLOT_DEFAULT_DOMAIN_Y) as [number, number];
  const [xMin, xMax] = domainX;
  const [yMin, yMax] = domainY;

  const spanX = Math.max(0.001, xMax - xMin);
  const spanY = Math.max(0.001, yMax - yMin);

  // Coordinate mappers
  const toFabX = (x: number) => plotLeft + ((x - xMin) / spanX) * plotW;
  const toFabY = (y: number) => plotBottom - ((y - yMin) / spanY) * plotH;

  const originX = toFabX(0);
  const originY = toFabY(0);

  // 4. Grid Lines (Subdivisions)
  if (data.showGrid !== false) {
    const stepX = spanX <= 6 ? 1 : spanX <= 12 ? 2 : 5;
    const startX = Math.ceil(xMin / stepX) * stepX;
    for (let x = startX; x <= xMax; x += stepX) {
      const gx = toFabX(x);
      if (gx >= plotLeft && gx <= plotRight) {
        objects.push(
          new fabric.Line([gx, plotTop, gx, plotBottom], {
            stroke: themeColors.chartGrid,
            strokeWidth: 1,
            selectable: false,
          })
        );
      }
    }

    const stepY = spanY <= 4 ? 1 : spanY <= 8 ? 2 : 4;
    const startY = Math.ceil(yMin / stepY) * stepY;
    for (let y = startY; y <= yMax; y += stepY) {
      const gy = toFabY(y);
      if (gy >= plotTop && gy <= plotBottom) {
        objects.push(
          new fabric.Line([plotLeft, gy, plotRight, gy], {
            stroke: themeColors.chartGrid,
            strokeWidth: 1,
            selectable: false,
          })
        );
      }
    }
  }

  // 5. Main Cartesian Axes (Ox, Oy)
  if (data.showAxes !== false) {
    // Ox Axis
    if (originY >= plotTop && originY <= plotBottom) {
      objects.push(
        new fabric.Line([plotLeft, originY, plotRight, originY], {
          stroke: themeColors.textSub,
          strokeWidth: 1.2,
          selectable: false,
        })
      );
    }

    // Oy Axis
    if (originX >= plotLeft && originX <= plotRight) {
      objects.push(
        new fabric.Line([originX, plotTop, originX, plotBottom], {
          stroke: themeColors.textSub,
          strokeWidth: 1.2,
          selectable: false,
        })
      );
    }
  }

  // 6. Mathematical Elements by Visualization Mode
  // Khung hình đứng yên ở t = 0 (khớp frame đầu của video); biểu thức hỏng → không vẽ đường cong
  const compiled = data.expression ? compileExpr(data.expression, ['x', 't']).fn : null;
  const fn = compiled ? (x: number) => compiled(x, 0) : null;

  // A. Calculus Area (Riemann Integral Fill)
  if (data.mode === 'calculus_area' && fn) {
    const [intA, intB] = data.integralBounds || [-2, 2];
    const steps = 30;
    const deltaX = (intB - intA) / steps;
    const polyPoints: Array<{ x: number; y: number }> = [];

    // Base point at bottom
    polyPoints.push({ x: toFabX(intA), y: originY });

    // Points along the curve
    for (let i = 0; i <= steps; i++) {
      const xVal = intA + i * deltaX;
      const yRaw = fn(xVal);
      const yVal = Number.isFinite(yRaw) ? yRaw : 0;
      polyPoints.push({ x: toFabX(xVal), y: toFabY(yVal) });
    }

    // Base point at end
    polyPoints.push({ x: toFabX(intB), y: originY });

    objects.push(
      new fabric.Polygon(polyPoints, {
        fill: mixColors(safeAccent, 25),
        stroke: mixColors(safeAccent, 45),
        strokeWidth: 1,
        selectable: false,
      })
    );
  }

  // B. Trig Circle Mode
  if (data.mode === 'trig_circle') {
    const radiusPix = Math.abs(toFabX(1) - toFabX(0));
    objects.push(
      new fabric.Circle({
        left: originX,
        top: originY,
        radius: radiusPix,
        originX: 'center',
        originY: 'center',
        stroke: themeColors.textSub,
        strokeWidth: 1.5,
        fill: 'transparent',
        selectable: false,
      })
    );

    // Angle radius ray (at 45 deg)
    const angleRad = Math.PI / 4;
    const rayX = originX + radiusPix * Math.cos(angleRad);
    const rayY = originY - radiusPix * Math.sin(angleRad);

    objects.push(
      new fabric.Line([originX, originY, rayX, rayY], {
        stroke: safeAccent,
        strokeWidth: 2,
        selectable: false,
      })
    );

    objects.push(
      new fabric.Circle({
        left: rayX,
        top: rayY,
        radius: 3.5,
        originX: 'center',
        originY: 'center',
        fill: safeAccent,
        selectable: false,
      })
    );
  }

  // C. Main Curve Sampling (Sampling 60 points across domainX)
  if (data.mode !== 'trig_circle' && fn) {
    const samples = 60;
    const dx = spanX / samples;
    const pathCommands: string[] = [];

    let isDrawing = false;
    let pendingEdge = '';
    for (let i = 0; i <= samples; i++) {
      const curX = xMin + i * dx;
      const curY = fn(curX);

      // Clamp excessively large values to avoid breaking the renderer
      if (!isFinite(curY) || isNaN(curY)) {
        isDrawing = false;
        continue;
      }

      const fabX = toFabX(curX);
      const rawY = toFabY(curY);
      // Cắt theo khung đồ thị như viewport Mafs: điểm ngoài khung kẹp vào mép rồi nhấc bút
      const outside = rawY < plotTop || rawY > plotBottom;
      const fabY = Math.max(plotTop, Math.min(plotBottom, rawY));

      if (outside) {
        if (isDrawing) pathCommands.push(`L ${fabX.toFixed(1)} ${fabY.toFixed(1)}`);
        else pendingEdge = `M ${fabX.toFixed(1)} ${fabY.toFixed(1)}`;
        isDrawing = false;
        continue;
      }

      if (!isDrawing) {
        pathCommands.push(pendingEdge || `M ${fabX.toFixed(1)} ${fabY.toFixed(1)}`);
        if (pendingEdge) pathCommands.push(`L ${fabX.toFixed(1)} ${fabY.toFixed(1)}`);
        pendingEdge = '';
        isDrawing = true;
      } else {
        pathCommands.push(`L ${fabX.toFixed(1)} ${fabY.toFixed(1)}`);
      }
    }

    if (pathCommands.length > 0) {
      objects.push(
        new fabric.Path(pathCommands.join(' '), {
          stroke: safeAccent,
          strokeWidth: data.lineWidth || 2.5,
          fill: '',
          strokeLineCap: 'round',
          strokeLineJoin: 'round',
          selectable: false,
        })
      );
    }
  }

  // D. Tangent Line Simulation (if showTangent is enabled)
  if (data.showTangent && data.mode === 'function' && fn) {
    const x0 = 0.5;
    const y0 = fn(x0);
    const delta = 0.001;
    const slope = (fn(x0 + delta) - fn(x0 - delta)) / (2 * delta);

    const tangentLength = spanX * 0.2;
    const x1 = x0 - tangentLength;
    const y1 = y0 - slope * tangentLength;
    const x2 = x0 + tangentLength;
    const y2 = y0 + slope * tangentLength;

    // Tangent line
    objects.push(
      new fabric.Line([toFabX(x1), toFabY(y1), toFabX(x2), toFabY(y2)], {
        stroke: themeColors.chartNegative,
        strokeWidth: 2,
        selectable: false,
      })
    );

    // Tangent Contact Point
    const ptX = toFabX(x0);
    const ptY = toFabY(y0);
    objects.push(
      new fabric.Circle({
        left: ptX,
        top: ptY,
        radius: 4,
        originX: 'center',
        originY: 'center',
        fill: themeColors.chartNegative,
        strokeWidth: 0,
        selectable: false,
      })
    );
  }

  return objects;
}
