import { MathDeclarativeSpec, MathAstNode } from './mathAstTypes';
import { safeMathEvaluator } from './safeMathEvaluator';

/**
 * Universal Math AST Canvas Renderer - Remotion 60 FPS Engine
 * Renders mathematical primitives frame-by-frame with adaptive sampling & zero eval
 */
export function renderMathAst(
  ctx: CanvasRenderingContext2D,
  tSec: number,
  tau: number,
  spec: MathDeclarativeSpec,
  bounds: { w: number; h: number },
  colors: { accent: string; secondary: string }
): void {
  if (!spec || (!spec.nodes && !spec.layers)) return;

  const { w, h } = bounds;
  const { accent, secondary } = colors;
  const grid = spec.grid || {
    xRange: [-3, 3] as [number, number],
    yRange: [-2, 2] as [number, number],
    step: 1,
    showNumbers: spec.scientificDomain === 'calculus_analysis',
  };

  const padX = 36;
  const padTop = 54; // Giữ khoảng đệm 54px để đỉnh đồ thị và các mốc độ cao (Milestones) không chạm thanh HUD
  const padBottom = 66; // Dành khoảng đệm an toàn cho trục hoành, xLabel và footer công thức

  const plotW = w - padX * 2;
  const plotH = h - padTop - padBottom;

  const [xMin, xMax] = grid.xRange;
  const [yMin, yMax] = grid.yRange;

  const xSpan = Math.max(0.001, xMax - xMin);
  const ySpan = Math.max(0.001, yMax - yMin);

  // Coordinate transformation: Math (x, y) -> Pixel (px, py)
  const toPxX = (x: number) => padX + ((x - xMin) / xSpan) * plotW;
  const toPxY = (y: number) => padTop + plotH - ((y - yMin) / ySpan) * plotH;

  const originPxX = toPxX(0);
  const originPxY = toPxY(0);

  // 1. Render Coordinate Grid & Axes
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;

  const step = grid.step || (xSpan > 10 ? 2 : 1);

  // Vertical grid lines
  const startX = Math.ceil(xMin / step) * step;
  for (let x = startX; x <= xMax; x += step) {
    const px = toPxX(x);
    ctx.beginPath();
    ctx.moveTo(px, padTop);
    ctx.lineTo(px, padTop + plotH);
    ctx.stroke();
  }

  // Horizontal grid lines
  const startY = Math.ceil(yMin / step) * step;
  for (let y = startY; y <= yMax; y += step) {
    const py = toPxY(y);
    ctx.beginPath();
    ctx.moveTo(padX, py);
    ctx.lineTo(padX + plotW, py);
    ctx.stroke();
  }

  // Primary Axes (X and Y)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1.5;

  // X Axis
  if (originPxY >= padTop && originPxY <= padTop + plotH) {
    ctx.beginPath();
    ctx.moveTo(padX, originPxY);
    ctx.lineTo(padX + plotW, originPxY);
    ctx.stroke();
  }

  // Y Axis
  if (originPxX >= padX && originPxX <= padX + plotW) {
    ctx.beginPath();
    ctx.moveTo(originPxX, padTop);
    ctx.lineTo(originPxX, padTop + plotH);
    ctx.stroke();
  }

  // Origin point
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.beginPath();
  ctx.arc(originPxX, originPxY, 3, 0, Math.PI * 2);
  ctx.fill();

  // Axis Labels
  if (grid.xLabel) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '500 8.5px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(grid.xLabel, padX + plotW, padTop + plotH + 18);
  }
  if (grid.yLabel) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '500 8.5px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(grid.yLabel, padX, padTop - 10);
  }

  ctx.restore();

  // 2. Render Mathematical AST Nodes
  for (const node of spec.nodes) {
    if (!node || !node.type) continue;

    switch (node.type) {
      case 'plot': {
        const expr = node.expr;
        const color = node.color || accent;
        const strokeW = node.width || 2.5;
        const numSamples = 140;

        const maxDrawX = node.drawProgress ? xMin + tau * xSpan : xMax;
        const points: { px: number; py: number }[] = [];

        for (let i = 0; i <= numSamples; i++) {
          const u = i / numSamples;
          const mathX = xMin + u * xSpan;
          if (mathX > maxDrawX + 0.001) break;

          const mathY = safeMathEvaluator.evaluate(expr, { x: mathX, t: tSec, tau });
          if (isFinite(mathY)) {
            points.push({ px: toPxX(mathX), py: toPxY(mathY) });
          }
        }

        if (points.length >= 2) {
          // Fill under curve
          if (node.fillUnder) {
            ctx.save();
            ctx.fillStyle = node.fillOpacity ? `rgba(190, 255, 1, ${node.fillOpacity})` : 'rgba(190, 255, 1, 0.08)';
            ctx.beginPath();
            ctx.moveTo(points[0].px, originPxY);
            for (const pt of points) {
              ctx.lineTo(pt.px, pt.py);
            }
            ctx.lineTo(points[points.length - 1].px, originPxY);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          }

          // Stroke Curve
          ctx.save();
          ctx.strokeStyle = color;
          ctx.lineWidth = strokeW;
          ctx.shadowColor = color;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.moveTo(points[0].px, points[0].py);
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].px, points[i].py);
          }
          ctx.stroke();
          ctx.restore();
        }
        break;
      }

      case 'riemann': {
        const { expr, a, b, nMin, nMax, method = 'mid', color = accent } = node;
        const N = Math.max(1, Math.round(nMin + tau * (nMax - nMin)));
        const dx = (b - a) / N;

        ctx.save();
        for (let i = 0; i < N; i++) {
          const xLeft = a + i * dx;
          const xRight = a + (i + 1) * dx;
          let xSample = xLeft;
          if (method === 'right') xSample = xRight;
          else if (method === 'mid') xSample = xLeft + dx * 0.5;

          const yVal = safeMathEvaluator.evaluate(expr, { x: xSample, t: tSec, tau });
          if (!isFinite(yVal)) continue;

          const px1 = toPxX(xLeft);
          const px2 = toPxX(xRight);
          const py0 = originPxY;
          const pyVal = toPxY(yVal);

          const rw = Math.max(1, px2 - px1);
          const rh = py0 - pyVal;

          // Strip Fill
          ctx.fillStyle = 'rgba(190, 255, 1, 0.15)';
          ctx.fillRect(px1, Math.min(py0, pyVal), rw, Math.abs(rh));

          // Strip Border
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.strokeRect(px1, Math.min(py0, pyVal), rw, Math.abs(rh));
        }
        ctx.restore();
        break;
      }

      case 'tangent': {
        const { expr, atX, length = 1.5, color = accent, showSecant = true } = node;
        const x0 = typeof atX === 'number' ? atX : safeMathEvaluator.evaluate(String(atX), { t: tSec, tau });
        const h = 0.001;
        const y0 = safeMathEvaluator.evaluate(expr, { x: x0, t: tSec, tau });
        const yPlus = safeMathEvaluator.evaluate(expr, { x: x0 + h, t: tSec, tau });
        const yMinus = safeMathEvaluator.evaluate(expr, { x: x0 - h, t: tSec, tau });
        const slope = (yPlus - yMinus) / (2 * h);

        const px0 = toPxX(x0);
        const py0 = toPxY(y0);

        const xA = x0 - length;
        const yA = y0 - slope * length;
        const xB = x0 + length;
        const yB = y0 + slope * length;

        // Tangent Line
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(toPxX(xA), toPxY(yA));
        ctx.lineTo(toPxX(xB), toPxY(yB));
        ctx.stroke();

        // Contact Point Dot
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(px0, py0, 5, 0, Math.PI * 2);
        ctx.fill();

        // Secant triangle (dx, dy)
        if (showSecant) {
          const dxMath = 0.6;
          const dyMath = slope * dxMath;
          const pxDx = toPxX(x0 + dxMath);
          const pyDy = toPxY(y0 + dyMath);

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(px0, py0);
          ctx.lineTo(pxDx, py0); // dx
          ctx.lineTo(pxDx, pyDy); // dy
          ctx.stroke();
          ctx.setLineDash([]);
        }

        ctx.restore();
        break;
      }

      case 'fourier': {
        const { epicycles, traceColor = accent } = node;
        let currentX = 0;
        let currentY = 0;

        ctx.save();
        for (const epi of epicycles) {
          const prevPxX = toPxX(currentX);
          const prevPxY = toPxY(currentY);

          const r = epi.radius;
          const angle = (epi.freq * tau * Math.PI * 2) + (epi.phase || 0);

          currentX += r * Math.cos(angle);
          currentY += r * Math.sin(angle);

          const nextPxX = toPxX(currentX);
          const nextPxY = toPxY(currentY);

          // Epicycle Circle
          const rPx = Math.abs(toPxX(r) - toPxX(0));
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(prevPxX, prevPxY, rPx, 0, Math.PI * 2);
          ctx.stroke();

          // Vector arm
          ctx.strokeStyle = secondary;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(prevPxX, prevPxY);
          ctx.lineTo(nextPxX, nextPxY);
          ctx.stroke();
        }

        // Pen Tip
        ctx.fillStyle = traceColor;
        ctx.shadowColor = traceColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(toPxX(currentX), toPxY(currentY), 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
        break;
      }

      case 'unit_circle': {
        const { color = secondary, showSin = true, showCos = true } = node;
        const angle = tau * Math.PI * 2;
        const cosVal = Math.cos(angle);
        const sinVal = Math.sin(angle);

        const rPx = Math.abs(toPxX(1) - toPxX(0));

        ctx.save();
        // Unit circle perimeter
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(originPxX, originPxY, rPx, 0, Math.PI * 2);
        ctx.stroke();

        const ptPxX = toPxX(cosVal);
        const ptPxY = toPxY(sinVal);

        // Cos Projection (horizontal line on X axis)
        if (showCos) {
          ctx.strokeStyle = accent;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(originPxX, originPxY);
          ctx.lineTo(ptPxX, originPxY);
          ctx.stroke();
        }

        // Sin Projection (vertical line on Y axis)
        if (showSin) {
          ctx.strokeStyle = '#FF5544';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(originPxX, originPxY);
          ctx.lineTo(originPxX, ptPxY);
          ctx.stroke();
        }

        // Connecting dashed guides
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(ptPxX, ptPxY);
        ctx.lineTo(ptPxX, originPxY);
        ctx.moveTo(ptPxX, ptPxY);
        ctx.lineTo(originPxX, ptPxY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Revolving dot
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(ptPxX, ptPxY, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
        break;
      }

      case 'matrix_grid': {
        const { matrix, color = accent } = node;
        const a = typeof matrix[0] === 'number' ? matrix[0] : safeMathEvaluator.evaluate(String(matrix[0]), { t: tSec, tau });
        const b = typeof matrix[1] === 'number' ? matrix[1] : safeMathEvaluator.evaluate(String(matrix[1]), { t: tSec, tau });
        const c = typeof matrix[2] === 'number' ? matrix[2] : safeMathEvaluator.evaluate(String(matrix[2]), { t: tSec, tau });
        const d = typeof matrix[3] === 'number' ? matrix[3] : safeMathEvaluator.evaluate(String(matrix[3]), { t: tSec, tau });

        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;

        // Transformed lines
        for (let gx = -3; gx <= 3; gx++) {
          const x1 = a * gx + b * -3;
          const y1 = c * gx + d * -3;
          const x2 = a * gx + b * 3;
          const y2 = c * gx + d * 3;

          ctx.beginPath();
          ctx.moveTo(toPxX(x1), toPxY(y1));
          ctx.lineTo(toPxX(x2), toPxY(y2));
          ctx.stroke();
        }

        for (let gy = -3; gy <= 3; gy++) {
          const x1 = a * -3 + b * gy;
          const y1 = c * -3 + d * gy;
          const x2 = a * 3 + b * gy;
          const y2 = c * 3 + d * gy;

          ctx.beginPath();
          ctx.moveTo(toPxX(x1), toPxY(y1));
          ctx.lineTo(toPxX(x2), toPxY(y2));
          ctx.stroke();
        }

        ctx.restore();
        break;
      }

      case 'vector': {
        const { x1, y1, x2, y2, label, color = accent, width = 2.5 } = node;
        const evalX1 = typeof x1 === 'number' ? x1 : safeMathEvaluator.evaluate(String(x1), { t: tSec, tau });
        const evalY1 = typeof y1 === 'number' ? y1 : safeMathEvaluator.evaluate(String(y1), { t: tSec, tau });
        const evalX2 = typeof x2 === 'number' ? x2 : safeMathEvaluator.evaluate(String(x2), { t: tSec, tau });
        const evalY2 = typeof y2 === 'number' ? y2 : safeMathEvaluator.evaluate(String(y2), { t: tSec, tau });

        const px1 = toPxX(evalX1);
        const py1 = toPxY(evalY1);
        const px2 = toPxX(evalX2);
        const py2 = toPxY(evalY2);

        const dx = px2 - px1;
        const dy = py2 - py1;
        const angle = Math.atan2(dy, dx);
        const len = Math.sqrt(dx * dx + dy * dy);

        if (len > 3) {
          ctx.save();
          ctx.strokeStyle = color;
          ctx.fillStyle = color;
          ctx.lineWidth = width;
          ctx.beginPath();
          ctx.moveTo(px1, py1);
          ctx.lineTo(px2, py2);
          ctx.stroke();

          // Arrowhead
          const headSize = 8;
          ctx.beginPath();
          ctx.moveTo(px2, py2);
          ctx.lineTo(px2 - headSize * Math.cos(angle - Math.PI / 6), py2 - headSize * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(px2 - headSize * Math.cos(angle + Math.PI / 6), py2 - headSize * Math.sin(angle + Math.PI / 6));
          ctx.closePath();
          ctx.fill();

          if (label) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 9px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(label, px2 + 10 * Math.cos(angle), py2 - 8);
          }
          ctx.restore();
        }
        break;
      }

      case 'particles': {
        const count = node.count || 60;
        const color = node.color || 'rgba(0, 212, 255, 0.45)';
        const isExp = node.distribution === 'exponential_altitude';
        const isBottom = node.distribution === 'bottom_concentrated';
        const speed = (node.speedMultiplier || 1.0) * (node.temperature ? Math.sqrt(node.temperature / 300) : 1.0);

        ctx.save();
        for (let i = 0; i < count; i++) {
          const seedX = (Math.sin(i * 12.9898 + 78.233) * 43758.5453) % 1;
          const rawUX = Math.abs(seedX);

          const seedY = (Math.cos(i * 93.9898 + 67.345) * 24634.6345) % 1;
          const rawUY = Math.abs(seedY);

          // If exponential altitude or bottom concentrated
          let uY = rawUY;
          if (isExp) uY = Math.pow(rawUY, 2.5);
          else if (isBottom) uY = Math.pow(rawUY, 1.8);

          // Brownian micro-motion scaled by temperature/speed
          const brownianAmp = node.showBrownianMotion !== false ? 2.5 * speed : 0;
          const bX = Math.sin(tSec * 2.2 * speed + i * 2.1) * brownianAmp;
          const bY = Math.cos(tSec * 1.9 * speed + i * 1.7) * brownianAmp;

          const px = padX + rawUX * plotW + bX;
          const py = padTop + plotH - uY * plotH + bY;

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(px, py, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        break;
      }

      case 'chamber': {
        const {
          chamberType = 'cylinder',
          liquidLevel = 0,
          liquidColor = 'rgba(0, 212, 255, 0.25)',
          pistonY,
          showPiston = false,
          label,
          color = 'rgba(255, 255, 255, 0.4)',
        } = node;

        const chW = plotW * 0.72;
        const chH = plotH * 0.78;
        const chX = padX + (plotW - chW) / 2;
        const chY = padTop + (plotH - chH) / 2;

        ctx.save();
        // Chamber Glass Vessel / Outline
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.fillStyle = 'rgba(14, 20, 27, 0.65)';
        ctx.beginPath();
        if (chamberType === 'beaker') {
          // Beaker with open top
          ctx.moveTo(chX, chY);
          ctx.lineTo(chX, chY + chH - 12);
          ctx.quadraticCurveTo(chX, chY + chH, chX + 12, chY + chH);
          ctx.lineTo(chX + chW - 12, chY + chH);
          ctx.quadraticCurveTo(chX + chW, chY + chH, chX + chW, chY + chH - 12);
          ctx.lineTo(chX + chW, chY);
        } else {
          // Closed cylinder / vessel
          ctx.roundRect(chX, chY, chW, chH, 10);
        }
        ctx.fill();
        ctx.stroke();

        // Liquid Layer
        if (liquidLevel > 0) {
          const lHeight = chH * Math.min(1.0, Math.max(0, liquidLevel));
          const lTop = chY + chH - lHeight;
          ctx.fillStyle = liquidColor;
          ctx.beginPath();
          ctx.moveTo(chX + 2, lTop);
          // Wave surface ripples
          const waveAmp = 2;
          for (let wx = chX + 2; wx <= chX + chW - 2; wx += 8) {
            const wy = lTop + Math.sin(tSec * 4 + wx * 0.08) * waveAmp;
            ctx.lineTo(wx, wy);
          }
          ctx.lineTo(chX + chW - 2, chY + chH - 2);
          ctx.lineTo(chX + 2, chY + chH - 2);
          ctx.closePath();
          ctx.fill();

          // Liquid top surface line
          ctx.strokeStyle = accent;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(chX + 2, lTop);
          ctx.lineTo(chX + chW - 2, lTop);
          ctx.stroke();
        }

        // Piston Head & Shaft
        if (showPiston || pistonY !== undefined) {
          const pNormY = pistonY !== undefined ? pistonY : 0.25;
          const pyPos = chY + chH * Math.min(0.85, Math.max(0.1, pNormY));
          
          // Piston shaft (rod)
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(chX + chW / 2, chY - 18);
          ctx.lineTo(chX + chW / 2, pyPos);
          ctx.stroke();

          // Piston head
          ctx.fillStyle = accent;
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(chX + 4, pyPos - 6, chW - 8, 12, 4);
          ctx.fill();
          ctx.stroke();
        }

        // Chamber Label Badge
        if (label) {
          ctx.fillStyle = 'rgba(14, 20, 27, 0.9)';
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.lineWidth = 1;
          const tw = ctx.measureText(label).width + 16;
          ctx.beginPath();
          ctx.roundRect(chX + (chW - tw) / 2, chY - 24, tw, 18, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 8.5px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(label, chX + chW / 2, chY - 12);
        }

        ctx.restore();
        break;
      }

      case 'gauge': {
        const {
          label,
          min = 0,
          max = 100,
          unit = '',
          color = accent,
          alertThreshold,
          position = 'top-right',
        } = node;

        const val = typeof node.current === 'number'
          ? node.current
          : safeMathEvaluator.evaluate(String(node.current), { t: tSec, tau });

        const clamped = Math.min(max, Math.max(min, val));
        const fraction = (clamped - min) / Math.max(0.001, max - min);
        const isAlert = alertThreshold !== undefined && (
          (min < max && clamped >= alertThreshold) || (min > max && clamped <= alertThreshold)
        );

        // Position on canvas
        const rGauge = 28;
        let gCenterX = padX + plotW - rGauge - 10;
        let gCenterY = padTop + rGauge + 10;
        if (position === 'top-left') {
          gCenterX = padX + rGauge + 10;
        } else if (position === 'bottom-left') {
          gCenterX = padX + rGauge + 10;
          gCenterY = padTop + plotH - rGauge - 10;
        } else if (position === 'bottom-right') {
          gCenterY = padTop + plotH - rGauge - 10;
        }

        ctx.save();
        // Dial Background Circle
        ctx.fillStyle = 'rgba(14, 20, 27, 0.92)';
        ctx.strokeStyle = isAlert ? '#FF2A55' : 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(gCenterX, gCenterY, rGauge + 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Arc Track: -140 deg to +140 deg
        const startAngle = Math.PI * 0.75;
        const totalAngle = Math.PI * 1.5;
        const currentAngle = startAngle + fraction * totalAngle;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(gCenterX, gCenterY, rGauge - 5, startAngle, startAngle + totalAngle);
        ctx.stroke();

        // Active Arc
        ctx.strokeStyle = isAlert ? '#FF2A55' : color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(gCenterX, gCenterY, rGauge - 5, startAngle, currentAngle);
        ctx.stroke();

        // Needle
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(gCenterX, gCenterY);
        ctx.lineTo(
          gCenterX + (rGauge - 8) * Math.cos(currentAngle),
          gCenterY + (rGauge - 8) * Math.sin(currentAngle)
        );
        ctx.stroke();

        // Center Pin
        ctx.fillStyle = isAlert ? '#FF2A55' : color;
        ctx.beginPath();
        ctx.arc(gCenterX, gCenterY, 3, 0, Math.PI * 2);
        ctx.fill();

        // Readout text below gauge
        ctx.fillStyle = isAlert ? '#FF2A55' : '#FFFFFF';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        const displayVal = Number.isInteger(clamped) ? clamped : clamped.toFixed(1);
        ctx.fillText(`${displayVal} ${unit}`, gCenterX, gCenterY + rGauge + 14);

        if (label) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.font = '500 7px sans-serif';
          ctx.fillText(label, gCenterX, gCenterY - rGauge - 6);
        }

        ctx.restore();
        break;
      }

      case 'streamlines': {
        const { flowType = 'airfoil_lift', speed = 1.0, color = secondary, showForces = true, label } = node;
        const cx = padX + plotW / 2;
        const cy = padTop + plotH / 2;

        ctx.save();
        if (flowType === 'airfoil_lift') {
          // Draw Airfoil shape in center
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(-0.08); // Slight positive angle of attack
          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-60, 0);
          ctx.quadraticCurveTo(-15, -28, 45, 0);
          ctx.quadraticCurveTo(0, 6, -60, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();

          // Streamlines flowing left to right
          const numLines = 6;
          const flowSpeed = (tSec * 60 * speed) % 24;
          for (let li = 0; li < numLines; li++) {
            const isUpper = li < numLines / 2;
            const baseY = cy + (li - numLines / 2 + 0.5) * 24;
            ctx.strokeStyle = isUpper ? accent : color;
            ctx.lineWidth = 1.2;
            ctx.setLineDash([8, 6]);
            ctx.lineDashOffset = -flowSpeed * (isUpper ? 1.4 : 0.85);

            ctx.beginPath();
            ctx.moveTo(padX + 10, baseY);
            // Deflection over airfoil
            const deflAmp = isUpper ? -24 : 12;
            ctx.quadraticCurveTo(cx - 10, baseY + deflAmp, padX + plotW - 10, baseY + (isUpper ? -6 : 14));
            ctx.stroke();
          }
          ctx.setLineDash([]);

          // Lift force vector pointing up
          if (showForces) {
            const liftLen = 48 + Math.sin(tSec * 3) * 6;
            ctx.strokeStyle = accent;
            ctx.fillStyle = accent;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx, cy - liftLen);
            ctx.stroke();

            // Arrowhead
            ctx.beginPath();
            ctx.moveTo(cx, cy - liftLen);
            ctx.lineTo(cx - 6, cy - liftLen + 8);
            ctx.lineTo(cx + 6, cy - liftLen + 8);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = accent;
            ctx.font = 'bold 9px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('Lực nâng L (Bernoulli)', cx, cy - liftLen - 6);
          }
        }

        if (label) {
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 8.5px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(label, cx, padTop + 14);
        }
        ctx.restore();
        break;
      }

      case 'milestone': {
        const px = toPxX(node.x);
        if (px >= padX && px <= padX + plotW) {
          ctx.save();
          ctx.strokeStyle = node.color || 'rgba(255, 255, 255, 0.35)';
          ctx.lineWidth = 1.2;
          if (node.lineStyle === 'dashed') {
            ctx.setLineDash([4, 4]);
          }
          ctx.beginPath();
          ctx.moveTo(px, padTop);
          ctx.lineTo(px, padTop + plotH);
          ctx.stroke();
          ctx.setLineDash([]);

          // Milestone header label tag
          ctx.fillStyle = node.color || '#FFFFFF';
          ctx.font = 'bold 8px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(node.label, px, padTop - 5);

          if (node.sublabel) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.font = '7.5px sans-serif';
            ctx.fillText(node.sublabel, px, padTop + 10);
          }
          ctx.restore();
        }
        break;
      }

      case 'point': {
        const evalX = typeof node.x === 'number' ? node.x : safeMathEvaluator.evaluate(String(node.x), { t: tSec, tau });
        const evalY = typeof node.y === 'number' ? node.y : safeMathEvaluator.evaluate(String(node.y), { t: tSec, tau });
        const px = toPxX(evalX);
        const py = toPxY(evalY);
        const radius = node.radius || 4.5;
        const color = node.color || accent;

        ctx.save();
        // Pulsing halo
        const pulse = 1 + 0.3 * Math.sin(tSec * 4);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(px, py, radius * pulse, 0, Math.PI * 2);
        ctx.stroke();

        // Solid core
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(px, py, radius * 0.7, 0, Math.PI * 2);
        ctx.fill();

        if (node.label) {
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 8.5px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(node.label, px + 8, py - 4);
        }
        ctx.restore();
        break;
      }

      case 'label': {
        // If KaTeX DOM overlay is rendered or formula is separated, suppress drawing crude canvas text
        if ((spec as any).hasKaTexOverlay || (spec as any).separateFormula) {
          break;
        }
        const { text, formula } = node;
        ctx.save();
        ctx.fillStyle = 'rgba(14, 20, 27, 0.92)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(14, h - 46, w - 28, 38, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 9.5px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(text, 24, h - 29);

        if (formula) {
          ctx.fillStyle = accent;
          ctx.font = 'bold 9px monospace';
          ctx.fillText(formula, 24, h - 14);
        }
        ctx.restore();
        break;
      }
    }
  }
}
