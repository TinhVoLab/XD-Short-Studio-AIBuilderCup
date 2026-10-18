import { IParadoxDefinition, CameraFocusState, ParadoxCameraMode, TelemetryMetric } from '../types';

export const BrachistochronePlugin: IParadoxDefinition = {
  id: 'brachistochrone-curve',
  name: 'Đường cong Đoản thời (Brachistochrone)',
  category: 'calculus',
  archetype: 'parametric_race',
  description: 'Thách thức Johann Bernoulli (1696): Đường cong giúp bi lăn rơi nhanh nhất dưới trọng lực là đường Cycloid chứ không phải đường thẳng!',
  latexFormula: 'T = \\int_{A}^{B} \\frac{ds}{\\sqrt{2gy}} \\implies \\text{Cycloid } L = 8R',
  cueKeywords: ['đoản thời', 'rơi nhanh nhất', 'cycloid', 'đường thẳng', 'bernoulli', 'trọng lực', 'bứt tốc', 'về đích'],
  soundFxArchetype: 'mechanical',
  defaultParams: {
    gravity: 9.8,
    targetHeight: 180,
  },
  paramsSchema: [
    {
      key: 'gravity',
      label: 'Gia tốc trọng trường g',
      type: 'number',
      min: 5,
      max: 20,
      step: 0.5,
      default: 9.8,
      unit: 'm/s²',
    },
    {
      key: 'targetHeight',
      label: 'Độ sâu đích đến',
      type: 'number',
      min: 120,
      max: 220,
      step: 10,
      default: 180,
      unit: 'px',
    },
  ],

  getCameraFocus(
    tSec: number,
    tau: number,
    params: Record<string, any>,
    cameraMode: ParadoxCameraMode
  ): CameraFocusState {
    if (cameraMode === 'overview') {
      return { x: 0, y: 0, zoom: 1.0 };
    }

    // In Act 2 (Mid-race), lead-track the Cycloid ball
    if (tau >= 0.20 && tau < 0.75) {
      return { x: 40, y: 30, zoom: 1.15 };
    }

    // In Act 3 (Finish line), focus on the right side
    return { x: 70, y: 40, zoom: 1.10 };
  },

  renderFrame(
    ctx: CanvasRenderingContext2D,
    tSec: number,
    tau: number,
    params: Record<string, any>,
    bounds: { w: number; h: number },
    colors: { accent: string; secondary: string }
  ): void {
    const { w, h } = bounds;
    const { accent, secondary } = colors;

    const startX = 36;
    const startY = 48;
    const endX = w - 42;
    const endY = Math.min(h - 36, startY + (Number(params.targetHeight) || 180));
    const W = endX - startX;
    const H = endY - startY;

    // 1. Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 36) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 36) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // 2. Finish Line Marker
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(endX, startY - 14);
    ctx.lineTo(endX, endY + 24);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('VẠCH ĐÍCH (B)', endX, endY + 34);

    // 3. Mathematical Curves
    const steps = 120;
    const linePts: { x: number; y: number }[] = [];
    const paraPts: { x: number; y: number }[] = [];
    const cycPts: { x: number; y: number }[] = [];

    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      // Line
      linePts.push({ x: startX + u * W, y: startY + u * H });
      // Parabola (Square root early drop)
      paraPts.push({ x: startX + u * W, y: startY + H * Math.sqrt(u) });
      // Cycloid curve
      const th = u * Math.PI * 0.95;
      const R_cyc = H / (1 - Math.cos(Math.PI * 0.95));
      cycPts.push({
        x: startX + (R_cyc * (th - Math.sin(th)) / (R_cyc * (Math.PI * 0.95 - Math.sin(Math.PI * 0.95)))) * W,
        y: startY + (R_cyc * (1 - Math.cos(th)) / (R_cyc * (1 - Math.cos(Math.PI * 0.95)))) * H,
      });
    }

    // Draw Curve paths
    function drawPath(pts: { x: number; y: number }[], col: string, lw: number, glow: boolean) {
      ctx.strokeStyle = col;
      ctx.lineWidth = lw;
      if (glow) {
        ctx.shadowColor = col;
        ctx.shadowBlur = 10;
      }
      ctx.beginPath();
      pts.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    drawPath(linePts, '#FF5544', 2, false);
    drawPath(paraPts, secondary, 2, false);
    drawPath(cycPts, accent, 3, true);

    // 4. Deterministic Particle Positions along curves
    // Arrival sequence: Cycloid (reaches end at tau ~ 0.65), Parabola (tau ~ 0.78), Line (tau ~ 0.94)
    const uCyc = Math.min(1.0, tau / 0.65);
    const uPara = Math.min(1.0, tau / 0.78);
    const uLine = Math.min(1.0, tau / 0.94);

    function getPtAtProgress(pts: { x: number; y: number }[], prog: number) {
      const idx = Math.min(pts.length - 1, Math.floor(prog * (pts.length - 1)));
      return pts[idx];
    }

    const pLine = getPtAtProgress(linePts, uLine);
    const pPara = getPtAtProgress(paraPts, uPara);
    const pCyc = getPtAtProgress(cycPts, uCyc);

    // Draw particles
    function drawBall(p: { x: number; y: number }, col: string, name: string) {
      ctx.fillStyle = col;
      ctx.shadowColor = col;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();

      // Mini text pill
      ctx.font = 'bold 7.5px monospace';
      const tw = ctx.measureText(name).width + 6;
      ctx.fillStyle = 'rgba(13, 17, 23, 0.85)';
      ctx.beginPath();
      ctx.roundRect(p.x - tw / 2, p.y - 14, tw, 11, 2);
      ctx.fill();
      ctx.fillStyle = col;
      ctx.textAlign = 'center';
      ctx.fillText(name, p.x, p.y - 6);
    }

    drawBall(pLine, '#FF5544', 'Đường thẳng');
    drawBall(pPara, secondary, 'Parabol');
    drawBall(pCyc, accent, 'Cycloid (Tối ưu)');

    // Winner Banner when Cycloid finishes first
    if (tau >= 0.65) {
      const bannerW = 120;
      const bannerH = 18;
      const bx = endX - bannerW - 8;
      const by = endY - 32;

      ctx.fillStyle = 'rgba(14, 20, 27, 0.92)';
      ctx.beginPath();
      ctx.roundRect(bx, by, bannerW, bannerH, 4);
      ctx.fill();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.fillStyle = accent;
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CYCLOID VỀ ĐÍCH ĐẦU TIÊN!', bx + bannerW / 2, by + bannerH / 2 + 3);
    }
  },

  getTelemetryMetrics(
    tSec: number,
    tau: number,
    params: Record<string, any>,
    colors: { accent: string; secondary: string }
  ): TelemetryMetric[] {
    const isCycWon = tau >= 0.65;
    return [
      {
        label: 'DẪN ĐẦU',
        value: isCycWon ? 'CYCLOID (ĐOẢN THỜI)' : 'CYCLOID (-0.42s)',
        color: colors.accent,
      },
      {
        label: 'CYCLOID 1696',
        value: isCycWon ? '1.82 s (CHIẾN THẮNG)' : 'Đang bứt tốc...',
        color: colors.accent,
      },
      {
        label: 'PARABOL',
        value: tau >= 0.78 ? '2.08 s' : 'Về nhì',
        color: colors.secondary,
      },
      {
        label: 'ĐƯỜNG THẲNG',
        value: tau >= 0.94 ? '2.34 s (CHẬM NHẤT)' : 'Bẫy trực giác',
        color: '#FF5544',
      },
    ];
  },
};
