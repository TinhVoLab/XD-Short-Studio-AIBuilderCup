import * as fabric from 'fabric';
import { MathDeclarativeSpec } from '@/remotion/elements/stem/paradox/math/mathAstTypes';
import { safeMathEvaluator } from '@/remotion/elements/stem/paradox/math/safeMathEvaluator';

/**
 * Universal Math AST Fabric Renderer - Studio Interactive Editor Preview
 * Converts declarative mathematical specs to Fabric.js vector objects at a fixed previewTau
 */
export function buildMathAstFabricObjects(
  spec: MathDeclarativeSpec,
  previewTau: number,
  colors: { accent: string; secondary: string; themeColors?: any },
  bounds: {
    containerWidth: number;
    stageH: number;
    curY: number;
    halfW: number;
    padX: number;
    padY: number;
  }
): fabric.FabricObject[] {
  const objects: fabric.FabricObject[] = [];
  if (!spec || (!spec.nodes && !spec.layers)) return objects;

  const { stageH, curY, halfW, padX } = bounds;
  const { accent, secondary, themeColors } = colors;
  const gridStroke = themeColors?.chartGrid || 'rgba(255, 255, 255, 0.06)';
  const axisStroke = themeColors?.chartAxis || 'rgba(255, 255, 255, 0.3)';
  const textFill = themeColors?.text || '#FFFFFF';

  const grid = spec.grid || {
    xRange: [-3, 3] as [number, number],
    yRange: [-2, 2] as [number, number],
    step: 1,
    showNumbers: spec.scientificDomain === 'calculus_analysis',
  };

  const plotLeft = -halfW + padX + 16;
  const plotRight = halfW - padX - 16;
  const plotW = plotRight - plotLeft;

  const plotTop = curY + stageH * 0.15;
  const plotBottom = curY + stageH * 0.85;
  const plotH = plotBottom - plotTop;

  const [xMin, xMax] = grid.xRange;
  const [yMin, yMax] = grid.yRange;

  const xSpan = Math.max(0.001, xMax - xMin);
  const ySpan = Math.max(0.001, yMax - yMin);

  // Math to Fabric Coord mapping
  const toFabX = (x: number) => plotLeft + ((x - xMin) / xSpan) * plotW;
  const toFabY = (y: number) => plotTop + plotH - ((y - yMin) / ySpan) * plotH;

  const originFabX = toFabX(0);
  const originFabY = toFabY(0);

  // 1. Grid & Primary Axes
  const step = grid.step || 1;
  const startX = Math.ceil(xMin / step) * step;
  for (let x = startX; x <= xMax; x += step) {
    const fx = toFabX(x);
    objects.push(
      new fabric.Line([fx, plotTop, fx, plotBottom], {
        stroke: gridStroke,
        strokeWidth: 1,
        selectable: false,
      } as any)
    );
  }

  const startY = Math.ceil(yMin / step) * step;
  for (let y = startY; y <= yMax; y += step) {
    const fy = toFabY(y);
    objects.push(
      new fabric.Line([plotLeft, fy, plotRight, fy], {
        stroke: gridStroke,
        strokeWidth: 1,
        selectable: false,
      } as any)
    );
  }

  // X Axis
  if (originFabY >= plotTop && originFabY <= plotBottom) {
    objects.push(
      new fabric.Line([plotLeft, originFabY, plotRight, originFabY], {
        stroke: axisStroke,
        strokeWidth: 1.5,
        selectable: false,
      } as any)
    );
  }

  // Y Axis
  if (originFabX >= plotLeft && originFabX <= plotRight) {
    objects.push(
      new fabric.Line([originFabX, plotTop, originFabX, plotBottom], {
        stroke: axisStroke,
        strokeWidth: 1.5,
        selectable: false,
      } as any)
    );
  }

  // Axis Labels
  if (grid.xLabel) {
    objects.push(
      new fabric.Text(grid.xLabel, {
        left: plotRight,
        top: plotBottom + 8,
        fontSize: 7.5,
        fill: 'rgba(255, 255, 255, 0.6)',
        fontFamily: 'monospace',
        originX: 'right',
        selectable: false,
      } as any)
    );
  }
  if (grid.yLabel) {
    objects.push(
      new fabric.Text(grid.yLabel, {
        left: plotLeft,
        top: plotTop - 12,
        fontSize: 7.5,
        fill: 'rgba(255, 255, 255, 0.6)',
        fontFamily: 'monospace',
        originX: 'left',
        selectable: false,
      } as any)
    );
  }

  // 2. Nodes rendering
  for (const node of spec.nodes) {
    if (!node || !node.type) continue;

    switch (node.type) {
      case 'plot': {
        const { expr, color = accent, width = 2.5 } = node;
        const numSamples = 60;
        let pathD = '';

        for (let i = 0; i <= numSamples; i++) {
          const u = i / numSamples;
          const mx = xMin + u * xSpan;
          const my = safeMathEvaluator.evaluate(expr, { x: mx, t: previewTau * 5, tau: previewTau });
          if (!isFinite(my)) continue;

          const fx = toFabX(mx);
          const fy = toFabY(my);

          if (!pathD) {
            pathD = `M ${fx} ${fy}`;
          } else {
            pathD += ` L ${fx} ${fy}`;
          }
        }

        if (pathD) {
          objects.push(
            new fabric.Path(pathD, {
              fill: 'transparent',
              stroke: color,
              strokeWidth: width,
              selectable: false,
            } as any)
          );
        }
        break;
      }

      case 'riemann': {
        const { expr, a, b, nMin, nMax, method = 'mid', color = accent } = node;
        const N = Math.max(1, Math.round(nMin + previewTau * (nMax - nMin)));
        const dx = (b - a) / N;

        for (let i = 0; i < N; i++) {
          const xLeft = a + i * dx;
          const xRight = a + (i + 1) * dx;
          let xSample = xLeft;
          if (method === 'right') xSample = xRight;
          else if (method === 'mid') xSample = xLeft + dx * 0.5;

          const yVal = safeMathEvaluator.evaluate(expr, { x: xSample, t: previewTau * 5, tau: previewTau });
          if (!isFinite(yVal)) continue;

          const fx1 = toFabX(xLeft);
          const fx2 = toFabX(xRight);
          const fy0 = originFabY;
          const fyVal = toFabY(yVal);

          const rw = Math.max(1, fx2 - fx1);
          const topY = Math.min(fy0, fyVal);
          const rh = Math.abs(fy0 - fyVal);

          objects.push(
            new fabric.Rect({
              left: fx1,
              top: topY,
              width: rw,
              height: rh,
              fill: 'rgba(190, 255, 1, 0.15)',
              stroke: color,
              strokeWidth: 1,
              selectable: false,
            } as any)
          );
        }
        break;
      }

      case 'tangent': {
        const { expr, atX, length = 1.5, color = accent } = node;
        const x0 = typeof atX === 'number' ? atX : safeMathEvaluator.evaluate(String(atX), { t: previewTau * 5, tau: previewTau });
        const h = 0.001;
        const y0 = safeMathEvaluator.evaluate(expr, { x: x0, t: previewTau * 5, tau: previewTau });
        const yPlus = safeMathEvaluator.evaluate(expr, { x: x0 + h, t: previewTau * 5, tau: previewTau });
        const yMinus = safeMathEvaluator.evaluate(expr, { x: x0 - h, t: previewTau * 5, tau: previewTau });
        const slope = (yPlus - yMinus) / (2 * h);

        const xA = x0 - length;
        const yA = y0 - slope * length;
        const xB = x0 + length;
        const yB = y0 + slope * length;

        objects.push(
          new fabric.Line([toFabX(xA), toFabY(yA), toFabX(xB), toFabY(yB)], {
            stroke: color,
            strokeWidth: 2.5,
            selectable: false,
          } as any)
        );

        // Contact Point
        objects.push(
          new fabric.Circle({
            left: toFabX(x0),
            top: toFabY(y0),
            radius: 4,
            fill: '#FFFFFF',
            stroke: color,
            strokeWidth: 1.5,
            originX: 'center',
            originY: 'center',
            selectable: false,
          } as any)
        );
        break;
      }

      case 'unit_circle': {
        const rPx = Math.abs(toFabX(1) - toFabX(0));
        objects.push(
          new fabric.Circle({
            left: originFabX,
            top: originFabY,
            radius: rPx,
            fill: 'transparent',
            stroke: 'rgba(255, 255, 255, 0.3)',
            strokeWidth: 1.5,
            originX: 'center',
            originY: 'center',
            selectable: false,
          } as any)
        );

        const angle = previewTau * Math.PI * 2;
        const ptX = toFabX(Math.cos(angle));
        const ptY = toFabY(Math.sin(angle));

        // Moving dot
        objects.push(
          new fabric.Circle({
            left: ptX,
            top: ptY,
            radius: 4.5,
            fill: '#FFFFFF',
            stroke: accent,
            strokeWidth: 1.5,
            originX: 'center',
            originY: 'center',
            selectable: false,
          } as any)
        );
        break;
      }

      case 'vector': {
        const { x1, y1, x2, y2, label, color = accent } = node;
        const evalX1 = typeof x1 === 'number' ? x1 : safeMathEvaluator.evaluate(String(x1), { t: previewTau * 5, tau: previewTau });
        const evalY1 = typeof y1 === 'number' ? y1 : safeMathEvaluator.evaluate(String(y1), { t: previewTau * 5, tau: previewTau });
        const evalX2 = typeof x2 === 'number' ? x2 : safeMathEvaluator.evaluate(String(x2), { t: previewTau * 5, tau: previewTau });
        const evalY2 = typeof y2 === 'number' ? y2 : safeMathEvaluator.evaluate(String(y2), { t: previewTau * 5, tau: previewTau });

        const fx1 = toFabX(evalX1);
        const fy1 = toFabY(evalY1);
        const fx2 = toFabX(evalX2);
        const fy2 = toFabY(evalY2);

        objects.push(
          new fabric.Line([fx1, fy1, fx2, fy2], {
            stroke: color,
            strokeWidth: 2.5,
            selectable: false,
          } as any)
        );

        if (label) {
          objects.push(
            new fabric.Text(label, {
              left: (fx1 + fx2) / 2,
              top: Math.min(fy1, fy2) - 12,
              fontSize: 8.5,
              fontWeight: 'bold',
              fill: color,
              fontFamily: 'monospace',
              originX: 'center',
              originY: 'top',
              selectable: false,
            } as any)
          );
        }
        break;
      }

      case 'particles': {
        const count = node.count || 45;
        const color = node.color || 'rgba(0, 212, 255, 0.45)';
        const isExp = node.distribution === 'exponential_altitude';

        for (let i = 0; i < count; i++) {
          const seedX = (Math.sin(i * 12.9898 + 78.233) * 43758.5453) % 1;
          const rawUX = Math.abs(seedX);

          const seedY = (Math.cos(i * 93.9898 + 67.345) * 24634.6345) % 1;
          const rawUY = Math.abs(seedY);

          const uY = isExp ? Math.pow(rawUY, 2.5) : rawUY;

          const fx = plotLeft + rawUX * plotW;
          const fy = plotBottom - uY * plotH;

          objects.push(
            new fabric.Circle({
              left: fx,
              top: fy,
              radius: 1.8,
              fill: color,
              originX: 'center',
              originY: 'center',
              selectable: false,
            } as any)
          );
        }
        break;
      }

      case 'chamber': {
        const {
          liquidLevel = 0,
          liquidColor = 'rgba(0, 212, 255, 0.25)',
          pistonY,
          showPiston = false,
          label,
          color = 'rgba(255, 255, 255, 0.4)',
        } = node;

        const chW = plotW * 0.72;
        const chH = plotH * 0.78;
        const chX = plotLeft + (plotW - chW) / 2;
        const chY = plotTop + (plotH - chH) / 2;

        // Chamber vessel rect
        objects.push(
          new fabric.Rect({
            left: chX,
            top: chY,
            width: chW,
            height: chH,
            fill: 'rgba(14, 20, 27, 0.65)',
            stroke: color,
            strokeWidth: 2,
            rx: 8,
            ry: 8,
            selectable: false,
          } as any)
        );

        // Liquid
        if (liquidLevel > 0) {
          const lHeight = chH * Math.min(1.0, Math.max(0, liquidLevel));
          objects.push(
            new fabric.Rect({
              left: chX + 2,
              top: chY + chH - lHeight,
              width: chW - 4,
              height: lHeight - 2,
              fill: liquidColor,
              stroke: accent,
              strokeWidth: 1,
              selectable: false,
            } as any)
          );
        }

        // Piston
        if (showPiston || pistonY !== undefined) {
          const py = chY + chH * (pistonY !== undefined ? pistonY : 0.25);
          objects.push(
            new fabric.Rect({
              left: chX + 4,
              top: py - 5,
              width: chW - 8,
              height: 10,
              fill: accent,
              stroke: '#FFFFFF',
              strokeWidth: 1.5,
              rx: 3,
              ry: 3,
              selectable: false,
            } as any)
          );
        }

        if (label) {
          objects.push(
            new fabric.Text(label, {
              left: chX + chW / 2,
              top: chY - 14,
              fontSize: 8,
              fontWeight: 'bold',
              fill: '#FFFFFF',
              fontFamily: 'monospace',
              originX: 'center',
              originY: 'bottom',
              selectable: false,
            } as any)
          );
        }
        break;
      }

      case 'gauge': {
        const { label, min = 0, max = 100, unit = '', color = accent } = node;
        const val = typeof node.current === 'number'
          ? node.current
          : safeMathEvaluator.evaluate(String(node.current), { t: previewTau * 5, tau: previewTau });
        const clamped = Math.min(max, Math.max(min, val));
        const gx = plotRight - 30;
        const gy = plotTop + 25;

        objects.push(
          new fabric.Circle({
            left: gx,
            top: gy,
            radius: 22,
            fill: 'rgba(14, 20, 27, 0.92)',
            stroke: 'rgba(255, 255, 255, 0.25)',
            strokeWidth: 1.5,
            originX: 'center',
            originY: 'center',
            selectable: false,
          } as any)
        );

        const displayVal = Number.isInteger(clamped) ? clamped : clamped.toFixed(1);
        objects.push(
          new fabric.Text(`${displayVal} ${unit}`, {
            left: gx,
            top: gy + 28,
            fontSize: 7.5,
            fontWeight: 'bold',
            fill: color,
            fontFamily: 'monospace',
            originX: 'center',
            selectable: false,
          } as any)
        );

        if (label) {
          objects.push(
            new fabric.Text(label, {
              left: gx,
              top: gy - 32,
              fontSize: 7,
              fill: 'rgba(255, 255, 255, 0.7)',
              fontFamily: 'sans-serif',
              originX: 'center',
              selectable: false,
            } as any)
          );
        }
        break;
      }

      case 'streamlines': {
        const cx = (plotLeft + plotRight) / 2;
        const cy = (plotTop + plotBottom) / 2;

        // Airfoil shape
        const airfoilPath = `M ${cx - 50} ${cy} Q ${cx - 10} ${cy - 22}, ${cx + 40} ${cy} Q ${cx} ${cy + 5}, ${cx - 50} ${cy}`;
        objects.push(
          new fabric.Path(airfoilPath, {
            fill: 'rgba(255, 255, 255, 0.15)',
            stroke: '#FFFFFF',
            strokeWidth: 2,
            selectable: false,
          } as any)
        );

        // Streamlines
        for (let li = 0; li < 4; li++) {
          const isUpper = li < 2;
          const sy = cy + (li - 1.5) * 22;
          const curveY = isUpper ? sy - 18 : sy + 10;
          const sPath = `M ${plotLeft + 10} ${sy} Q ${cx} ${curveY}, ${plotRight - 10} ${sy + (isUpper ? -6 : 10)}`;
          objects.push(
            new fabric.Path(sPath, {
              fill: 'transparent',
              stroke: isUpper ? accent : secondary,
              strokeWidth: 1.2,
              strokeDashArray: [6, 4],
              selectable: false,
            } as any)
          );
        }
        break;
      }

      case 'milestone': {
        const fx = toFabX(node.x);
        if (fx >= plotLeft && fx <= plotRight) {
          objects.push(
            new fabric.Line([fx, plotTop, fx, plotBottom], {
              stroke: node.color || 'rgba(255, 255, 255, 0.35)',
              strokeWidth: 1,
              strokeDashArray: node.lineStyle === 'dashed' ? [4, 4] : undefined,
              selectable: false,
            } as any)
          );

          objects.push(
            new fabric.Text(node.label, {
              left: fx,
              top: plotTop - 8,
              fontSize: 7.5,
              fontWeight: 'bold',
              fill: node.color || '#FFFFFF',
              fontFamily: 'monospace',
              originX: 'center',
              originY: 'bottom',
              selectable: false,
            } as any)
          );
        }
        break;
      }

      case 'point': {
        const evalX = typeof node.x === 'number' ? node.x : safeMathEvaluator.evaluate(String(node.x), { t: previewTau * 5, tau: previewTau });
        const evalY = typeof node.y === 'number' ? node.y : safeMathEvaluator.evaluate(String(node.y), { t: previewTau * 5, tau: previewTau });
        const fx = toFabX(evalX);
        const fy = toFabY(evalY);
        const radius = node.radius || 4;
        const color = node.color || accent;

        objects.push(
          new fabric.Circle({
            left: fx,
            top: fy,
            radius,
            fill: color,
            stroke: '#FFFFFF',
            strokeWidth: 1.5,
            originX: 'center',
            originY: 'center',
            selectable: false,
          } as any)
        );

        if (node.label) {
          objects.push(
            new fabric.Text(node.label, {
              left: fx + radius + 4,
              top: fy - radius,
              fontSize: 7.5,
              fontWeight: 'bold',
              fill: '#FFFFFF',
              fontFamily: 'monospace',
              originX: 'left',
              originY: 'center',
              selectable: false,
            } as any)
          );
        }
        break;
      }

      case 'label': {
        const { text, formula } = node;
        const labelY = curY + stageH * 0.90;

        objects.push(
          new fabric.Text(text, {
            left: -halfW + padX + 16,
            top: labelY,
            fontSize: 8,
            fontWeight: 'bold',
            fill: '#FFFFFF',
            fontFamily: 'monospace',
            selectable: false,
          } as any)
        );

        if (formula) {
          objects.push(
            new fabric.Text(formula, {
              left: -halfW + padX + 16,
              top: labelY + 12,
              fontSize: 7.5,
              fontWeight: 'bold',
              fill: accent,
              fontFamily: 'monospace',
              selectable: false,
            } as any)
          );
        }
        break;
      }
    }
  }

  return objects;
}
