import { IParadoxDefinition, CameraFocusState, ParadoxCameraMode, TelemetryMetric } from '../types';
import { renderMathAst } from '../math/mathAstCanvasRenderer';
import { safeMathEvaluator } from '../math/safeMathEvaluator';
import { MathDeclarativeSpec } from '../math/mathAstTypes';

/**
 * Draw a crisp vector arrow with glowing stroke and arrowhead
 */
function drawVectorArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  lineWidth: number = 2.5,
  arrowHeadSize: number = 7
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const angle = Math.atan2(dy, dx);
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length < 3) return;

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Arrowhead
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - arrowHeadSize * Math.cos(angle - Math.PI / 6),
    y2 - arrowHeadSize * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    x2 - arrowHeadSize * Math.cos(angle + Math.PI / 6),
    y2 - arrowHeadSize * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
}

export const DynamicSandboxPlugin: IParadoxDefinition = {
  id: 'dynamic-sandbox',
  name: 'Mô phỏng Khoa học AI Động (Dynamic Sandbox)',
  category: 'physics',
  archetype: 'dynamic_sandbox',
  description: 'Bộ khung diễn hoạt tự do: Tự động nhận diện chủ đề Khoa học / Đời sống / Cơ học và mô phỏng 60 FPS chuẩn xác.',
  latexFormula: 'y = f(x, \\tau), \\quad \\vec{v} = \\frac{d\\vec{r}}{dt}',
  cueKeywords: ['khoa học', 'vật lý', 'áp suất', 'vector', 'lực', 'phương trình', 'nhiệt độ', 'chuyển động'],
  soundFxArchetype: 'generic',
  defaultParams: {
    title: 'Mô phỏng Khoa học AI Động',
    formula: 'y = f(x, \\tau)',
  },
  paramsSchema: [
    {
      key: 'title',
      label: 'Chủ đề mô phỏng',
      type: 'text',
      default: 'Mô phỏng Khoa học AI Động',
    },
  ],

  getCameraFocus(
    _tSec: number,
    _tau: number,
    _params: Record<string, any>,
    cameraMode: ParadoxCameraMode
  ): CameraFocusState {
    if (cameraMode === 'overview') {
      return { x: 0, y: 0, zoom: 1.0 };
    }
    return { x: 0, y: 0, zoom: 1.0 };
  },

  renderFrame(
    ctx: CanvasRenderingContext2D,
    tSec: number,
    tau: number,
    params: Record<string, any>,
    bounds: { w: number; h: number },
    colors: { accent: string; secondary: string }
  ): void {
    // 1. Primary Engine: Declarative Scientific Visual DSL
    if (params.mathSpec) {
      renderMathAst(ctx, tSec, tau, params.mathSpec, bounds, colors);
      return;
    }

    // 2. Default Dynamic Scientific State Field
    renderScientificStateField(ctx, tSec, tau, params, bounds, colors);
  },

  getTelemetryMetrics(
    tSec: number,
    tau: number,
    params: Record<string, any>,
    colors: { accent: string; secondary: string }
  ): TelemetryMetric[] {
    const mathSpec: MathDeclarativeSpec | undefined = params.mathSpec;
    if (mathSpec?.telemetry && mathSpec.telemetry.length > 0) {
      return mathSpec.telemetry.map(item => {
        let displayVal = item.formula || '';
        if (item.evalExpr) {
          const num = safeMathEvaluator.evaluate(item.evalExpr, { t: tSec, tau });
          const rounded = Number.isInteger(num) ? String(num) : num.toFixed(2);
          displayVal = item.format ? item.format.replace('{val}', rounded) : rounded;
        }
        return {
          label: item.label,
          value: displayVal,
          color: item.color || colors.accent,
        };
      });
    }

    return [
      {
        label: 'TRẠNG THÁI MÔ PHỎNG',
        value: tau >= 0.85 ? 'HỘI TỤ ĐẠI LƯỢNG' : 'DIỄN HOẠT THỜI GIAN THỰC',
        color: colors.accent,
      },
      {
        label: 'TIẾN TRÌNH \\tau',
        value: `${Math.round(tau * 100)}%`,
        color: '#FFFFFF',
      },
      {
        label: 'ĐỘNG CƠ THỊ GIÁC',
        value: 'SCIENTIFIC VISUAL DSL',
        color: colors.secondary,
      },
      {
        label: 'TỐC ĐỘ KHUNG HÌNH',
        value: '60 FPS PURE',
        color: colors.accent,
      },
    ];
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Default Fallback: Scientific State & Vector Field (No fake wavy lines)
// ─────────────────────────────────────────────────────────────────────────────
function renderScientificStateField(
  ctx: CanvasRenderingContext2D,
  tSec: number,
  tau: number,
  params: Record<string, any>,
  bounds: { w: number; h: number },
  colors: { accent: string; secondary: string }
) {
  const { w, h } = bounds;
  const { accent } = colors;

  const cx = w / 2;
  const cy = h / 2;

  // 1. Fine Technical Grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 32) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h; y += 32) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  // 2. Central Scientific Coordinate Axes
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(32, cy); ctx.lineTo(w - 32, cy);
  ctx.moveTo(cx, 32); ctx.lineTo(cx, h - 48);
  ctx.stroke();

  // 3. Dynamic State Vector & Trajectory
  const vecLen = 60 + Math.sin(tSec * 2) * 15;
  const angle = tau * Math.PI * 2 - Math.PI / 2;
  const vx = cx + vecLen * Math.cos(angle);
  const vy = cy + vecLen * Math.sin(angle);

  drawVectorArrow(ctx, cx, cy, vx, vy, accent, 2.5, 8);

  // Vector label
  ctx.fillStyle = accent;
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('v(τ) State Vector', vx + 10 * Math.cos(angle), vy + 10 * Math.sin(angle));

  // Trajectory arc
  ctx.strokeStyle = 'rgba(0, 212, 255, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(cx, cy, vecLen, 0, tau * Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Center Origin
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // 4. Formula label badge
  const formulaText = params.formula || 'S(τ) = S_0 + \\int v(t)dt';
  ctx.font = 'bold 9px monospace';
  const tw = ctx.measureText(formulaText).width + 16;
  ctx.fillStyle = 'rgba(14, 20, 27, 0.90)';
  ctx.beginPath();
  ctx.roundRect(cx - tw / 2, h - 38, tw, 22, 5);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.textAlign = 'center';
  ctx.fillText(formulaText, cx, h - 24);
}
