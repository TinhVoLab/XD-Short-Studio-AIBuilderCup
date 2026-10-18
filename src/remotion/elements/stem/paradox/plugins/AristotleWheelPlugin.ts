import { IParadoxDefinition, ParadoxCameraMode, CameraFocusState, TelemetryMetric } from '../types';

export const AristotleWheelPlugin: IParadoxDefinition = {
  id: 'aristotle-wheel',
  name: 'Nghịch lý bánh xe Aristotle',
  category: 'geometry',
  archetype: 'parametric_race',
  description: 'Hai bánh xe đồng tâm có chu vi khác nhau nhưng cùng lăn hết một quãng đường bằng nhau.',
  latexFormula: 'v_{\\text{slip}} = (R - r)\\omega \\quad \\text{với} \\quad S = 2\\pi R',
  cueKeywords: ['trượt', 'slip', 'tiếp xúc', 'nhìn kỹ', 'phóng to', 'zoom', 'bên trong', 'bí mật', 'galileo', 'đa giác'],
  soundFxArchetype: 'mechanical',
  defaultParams: {
    R: 85,
    r: 42,
    speed: 1.0,
    turns: 2,
    showTrails: true,
    showSlipVector: true,
    showGalileoMode: false,
    galileoSides: 6,
  },
  paramsSchema: [
    {
      key: 'R',
      label: 'Bán kính bánh lớn (R)',
      type: 'number',
      min: 50,
      max: 130,
      step: 5,
      unit: 'px',
      default: 85,
    },
    {
      key: 'r',
      label: 'Bán kính bánh nhỏ (r)',
      type: 'number',
      min: 20,
      max: 65,
      step: 5,
      unit: 'px',
      default: 42,
    },
    {
      key: 'speed',
      label: 'Tốc độ quay (Speed)',
      type: 'number',
      min: 0.5,
      max: 3.0,
      step: 0.1,
      unit: 'x',
      default: 1.0,
    },
    {
      key: 'turns',
      label: 'Số vòng lăn (Turns)',
      type: 'number',
      min: 1,
      max: 4,
      step: 1,
      unit: 'vòng',
      default: 2,
    },
    {
      key: 'showGalileoMode',
      label: 'Góc nhìn Đa giác Galileo (1638)',
      type: 'boolean',
      default: false,
    },
    {
      key: 'galileoSides',
      label: 'Số cạnh đa giác Galileo',
      type: 'number',
      min: 4,
      max: 12,
      step: 2,
      unit: ' cạnh',
      default: 6,
    },
    {
      key: 'showTrails',
      label: 'Vẽ vệt Cycloid neon',
      type: 'boolean',
      default: true,
    },
    {
      key: 'showSlipVector',
      label: 'Hiện vector vận tốc trượt',
      type: 'boolean',
      default: true,
    },
  ],

  getCameraFocus(tSec: number, tau: number, params: Record<string, any>, cameraMode: ParadoxCameraMode): CameraFocusState {
    const R = Number(params.R) || 85;
    const r = Math.min(R - 10, Number(params.r) || 42);
    const turns = Number(params.turns) || 2;
    const theta = tau * turns * Math.PI * 2;
    const hubX = R * theta;

    if (cameraMode === 'overview') {
      if (tau >= 0.85) {
        return { x: hubX, y: 0, zoom: 0.88 };
      }
      return { x: 0, y: 0, zoom: 1.0 };
    }

    if (cameraMode === 'hub-tracking') {
      return { x: hubX, y: 0, zoom: 1.0 };
    }

    if (cameraMode === 'slip-focus') {
      return { x: hubX, y: r, zoom: 1.38 };
    }

    // Default: 'auto-director' (3-phase dynamic cinematic zoom)
    if (tau < 0.25) {
      // Phase 1: Overview tracking
      return { x: hubX, y: 0, zoom: 1.0 };
    } else if (tau < 0.35) {
      // Phase 1 -> 2: Smooth zoom in
      const p = (tau - 0.25) / 0.1;
      const smoothP = p * p * (3 - 2 * p); // smoothstep
      return {
        x: hubX,
        y: r * smoothP,
        zoom: 1.0 + 0.38 * smoothP,
      };
    } else if (tau < 0.70) {
      // Phase 2: Slip focus zoom
      return { x: hubX, y: r, zoom: 1.38 };
    } else if (tau < 0.82) {
      // Phase 2 -> 3: Smooth zoom out
      const p = (tau - 0.70) / 0.12;
      const smoothP = p * p * (3 - 2 * p);
      return {
        x: hubX,
        y: r * (1 - smoothP),
        zoom: 1.38 - 0.50 * smoothP,
      };
    } else {
      // Phase 3: Outro / Epiphany overview (Wheel at finish line, showing curve arc)
      return { x: hubX, y: 0, zoom: 0.88 };
    }
  },

  renderFrame(
    ctx: CanvasRenderingContext2D,
    tSec: number,
    tau: number,
    params: Record<string, any>,
    bounds: { w: number; h: number },
    colors: { accent: string; secondary: string }
  ): void {
    const R = Number(params.R) || 85;
    const r = Math.min(R - 10, Number(params.r) || 42);
    const turns = Number(params.turns) || 2;
    const showTrails = params.showTrails !== false;
    const showSlipVector = params.showSlipVector !== false;

    const accent = colors.accent || '#BEFF01';
    const secondary = colors.secondary || '#00D4FF';

    const totalAngle = turns * Math.PI * 2;
    const theta = tau * totalAngle;

    const groundY = bounds.h * 0.76;
    const hubX = R * theta;
    const hubY = groundY - R;

    const showGalileoMode = Boolean(params.showGalileoMode);
    const galileoSides = Math.max(4, Math.min(12, Math.floor(Number(params.galileoSides) || 6)));

    // 1. Grid Background Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const gridGap = 40;
    const startX = Math.floor((hubX - bounds.w) / gridGap) * gridGap;
    const endX = hubX + bounds.w * 1.5;
    for (let gx = startX; gx < endX; gx += gridGap) {
      ctx.beginPath();
      ctx.moveTo(gx, groundY - 260);
      ctx.lineTo(gx, groundY + 60);
      ctx.stroke();
    }

    // 2. Datum Roadways
    // Outer Wheel Ground (Solid line)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX - 200, groundY);
    ctx.lineTo(endX + 200, groundY);
    ctx.stroke();

    // Inner Wheel Virtual Roadway (Dashed line)
    const innerGroundY = hubY + r;
    ctx.strokeStyle = `${secondary}33`;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(startX - 200, innerGroundY);
    ctx.lineTo(endX + 200, innerGroundY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Distance Milestone Markers (2πR)
    const circumference = 2 * Math.PI * R;
    for (let k = 1; k <= turns; k++) {
      const mx = k * circumference;
      ctx.strokeStyle = `${accent}55`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(mx, groundY - 8);
      ctx.lineTo(mx, groundY + 8);
      ctx.stroke();

      ctx.fillStyle = `${accent}CC`;
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${k}×(2πR)`, mx, groundY + 20);
    }

    // Galileo Mode Discrete Roadway Contact & Void Gaps (1638 Dissection)
    if (showGalileoMode) {
      const N = galileoSides;
      const L = 2 * R * Math.sin(Math.PI / N);
      const l = 2 * r * Math.sin(Math.PI / N);
      const delta = L - l;
      const totalSteps = turns * N;
      const currentStepProgress = tau * totalSteps;

      for (let s = 0; s < totalSteps; s++) {
        const stepStartX = s * L;
        const innerContactEndX = stepStartX + l;
        const stepEndX = (s + 1) * L;

        // Outer polygon side step marker on ground
        ctx.strokeStyle = `${accent}77`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(stepStartX, groundY);
        ctx.lineTo(stepEndX, groundY);
        ctx.stroke();

        ctx.strokeStyle = `${accent}99`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(stepEndX, groundY - 5);
        ctx.lineTo(stepEndX, groundY + 5);
        ctx.stroke();

        // Inner polygon roadway:
        // 1. Solid Contact Segment (Length l)
        ctx.strokeStyle = secondary;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(stepStartX, innerGroundY);
        ctx.lineTo(innerContactEndX, innerGroundY);
        ctx.stroke();

        // 2. Galileo Void Gap (Length Delta = L - l) - highlighted in neon red
        ctx.strokeStyle = '#FF5544';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(innerContactEndX, innerGroundY);
        ctx.lineTo(stepEndX, innerGroundY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Gap label if in view
        if (s <= Math.floor(currentStepProgress) && s < 4) {
          ctx.fillStyle = '#FF7766';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`Δ=${delta.toFixed(0)}`, (innerContactEndX + stepEndX) / 2, innerGroundY - 6);
        }
      }
    }

    // 3. Render Historical Cycloid & Trochoid Trails
    if (showTrails) {
      const steps = Math.min(400, Math.max(30, Math.floor(tau * 400)));
      if (steps > 1) {
        // Outer Wheel Cycloid Trail (Accent)
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = accent;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const stepTheta = (i / 400) * totalAngle;
          const hX = R * stepTheta;
          const curAng = stepTheta - Math.PI / 2;
          const px = hX + R * Math.cos(curAng);
          const py = hubY + R * Math.sin(curAng);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Inner Wheel Curtate Cycloid Trail (Secondary)
        ctx.strokeStyle = secondary;
        ctx.lineWidth = 2.0;
        ctx.shadowColor = secondary;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const stepTheta = (i / 400) * totalAngle;
          const hX = R * stepTheta;
          const curAng = stepTheta - Math.PI / 2;
          const px = hX + r * Math.cos(curAng);
          const py = hubY + r * Math.sin(curAng);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }

    // 4. Concentric Wheels Rotation (Circle vs Galileo Polygon)
    ctx.save();
    ctx.translate(hubX, hubY);
    ctx.rotate(theta);

    if (showGalileoMode) {
      const N = galileoSides;

      // Outer Polygon
      ctx.strokeStyle = accent;
      ctx.lineWidth = 3;
      ctx.shadowColor = accent;
      ctx.shadowBlur = 10;
      ctx.fillStyle = `${accent}14`;
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2 - Math.PI / 2;
        const px = R * Math.cos(a);
        const py = R * Math.sin(a);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Outer Vertices Dots
      ctx.fillStyle = accent;
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2 - Math.PI / 2;
        ctx.beginPath();
        ctx.arc(R * Math.cos(a), R * Math.sin(a), 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Inner Polygon
      ctx.strokeStyle = secondary;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = secondary;
      ctx.shadowBlur = 8;
      ctx.fillStyle = `${secondary}18`;
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2 - Math.PI / 2;
        const px = r * Math.cos(a);
        const py = r * Math.sin(a);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Inner Vertices Dots
      ctx.fillStyle = secondary;
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2 - Math.PI / 2;
        ctx.beginPath();
        ctx.arc(r * Math.cos(a), r * Math.sin(a), 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Radial Spokes to each Vertex
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2 - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(R * Math.cos(a), R * Math.sin(a));
        ctx.stroke();
      }

      // Center Axle Hub
      ctx.fillStyle = '#080A0F';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      // Outer Wheel Rim
      ctx.strokeStyle = accent;
      ctx.lineWidth = 3;
      ctx.shadowColor = accent;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, 0, R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Outer Gear Teeth Accents
      const teeth = 16;
      ctx.fillStyle = accent;
      for (let t = 0; t < teeth; t++) {
        const a = (t / teeth) * Math.PI * 2;
        ctx.fillRect(Math.cos(a) * (R - 2), Math.sin(a) * (R - 2), 4, 4);
      }

      // Inner Wheel Rim
      ctx.strokeStyle = secondary;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = secondary;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Radial Spokes
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1.5;
      for (let s = 0; s < 4; s++) {
        const sa = (s / 4) * Math.PI;
        ctx.beginPath();
        ctx.moveTo(-Math.cos(sa) * R, -Math.sin(sa) * R);
        ctx.lineTo(Math.cos(sa) * R, Math.sin(sa) * R);
        ctx.stroke();
      }

      // Radius Markers
      ctx.strokeStyle = `${accent}AA`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -R);
      ctx.stroke();

      ctx.strokeStyle = `${secondary}DD`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -r);
      ctx.stroke();

      // Center Axle Hub
      ctx.fillStyle = '#080A0F';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.restore(); // Restore wheel rotation

    // 5. Contact Points & Slip Velocity Vector
    const curAng = theta - Math.PI / 2;
    const outerPtX = hubX + R * Math.cos(curAng);
    const outerPtY = hubY + R * Math.sin(curAng);
    const innerPtX = hubX + r * Math.cos(curAng);
    const innerPtY = hubY + r * Math.sin(curAng);

    // Outer Point Marker
    ctx.fillStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(outerPtX, outerPtY, 5, 0, Math.PI * 2);
    ctx.fill();

    // Inner Point Marker
    ctx.fillStyle = secondary;
    ctx.shadowColor = secondary;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(innerPtX, innerPtY, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Slip Velocity Vector at Inner Wheel bottom point
    if (showSlipVector) {
      const innerBottomX = hubX;
      const innerBottomY = hubY + r;
      const omega = totalAngle / Math.max(0.1, 5); // reference angular velocity
      const vSlip = (R - r) * omega * 0.15;

      ctx.strokeStyle = '#FF5544';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(innerBottomX, innerBottomY);
      ctx.lineTo(innerBottomX + vSlip, innerBottomY);
      ctx.stroke();

      // Arrow head
      ctx.fillStyle = '#FF5544';
      ctx.beginPath();
      ctx.moveTo(innerBottomX + vSlip, innerBottomY);
      ctx.lineTo(innerBottomX + vSlip - 6, innerBottomY - 4);
      ctx.lineTo(innerBottomX + vSlip - 6, innerBottomY + 4);
      ctx.fill();

      // Slip formula badge (Obsidian Glass mini-pill with high contrast and zero clipping)
      const formulaText = 'v_slip = (R - r)ω';
      ctx.font = 'bold 9px monospace';
      const textW = ctx.measureText(formulaText).width;
      const badgeW = textW + 12;
      const badgeH = 16;
      const badgeX = innerBottomX + 6;
      const badgeY = innerBottomY + 3; // Positioned safely above outer ground

      // Badge background pill
      ctx.fillStyle = 'rgba(14, 20, 27, 0.88)';
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 85, 68, 0.45)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Badge text
      ctx.fillStyle = '#FF7766';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(formulaText, badgeX + 6, badgeY + badgeH / 2);
      ctx.textBaseline = 'alphabetic';
    }

    // 6. Act 3 Curve Arc Length Measurement & Finish Line (tau >= 0.80)
    if (tau >= 0.80 && showTrails) {
      // 6.1 Glowing Neon Finish Line at final hubX
      const finishAlpha = Math.min(1.0, (tau - 0.80) / 0.10);
      ctx.save();
      ctx.globalAlpha = finishAlpha;

      // Dashed Finish Line Pole
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(hubX, hubY - R - 20);
      ctx.lineTo(hubX, groundY + 12);
      ctx.stroke();
      ctx.setLineDash([]);

      // Finish Line Marker Badge
      const finishText = `ĐÍCH: ${Math.round(hubX)}px`;
      ctx.font = 'bold 8.5px monospace';
      const finishW = ctx.measureText(finishText).width + 10;
      const finishH = 15;
      const finishBadgeX = hubX - finishW / 2;
      const finishBadgeY = hubY - R - 36;

      ctx.fillStyle = 'rgba(14, 20, 27, 0.90)';
      ctx.beginPath();
      ctx.roundRect(finishBadgeX, finishBadgeY, finishW, finishH, 4);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(finishText, hubX, finishBadgeY + finishH / 2);

      // 6.2 Optical Curve Measurement Badges at Wave Crest
      // The summit of the preceding wave is at hubX - Math.PI * R
      const peakX = Math.max(R, hubX - Math.PI * R);
      const cycloidPeakY = hubY - R;
      const trochoidPeakY = hubY - r;

      // Vertical connector line from peak to badge
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(peakX, cycloidPeakY);
      ctx.lineTo(peakX, cycloidPeakY - 26);
      ctx.stroke();
      ctx.setLineDash([]);

      // Badge 1: Cycloid Arc Length (Christopher Wren 1658: L = 8R)
      const cycArcPerTurn = Math.round(8 * R);
      const cycLabel = `Cycloid: L = 8R (${cycArcPerTurn}px/vòng)`;
      ctx.font = 'bold 8.5px monospace';
      const cycW = ctx.measureText(cycLabel).width + 12;
      const cycH = 16;
      const cycBadgeX = peakX - cycW / 2;
      const cycBadgeY = cycloidPeakY - 44;

      ctx.fillStyle = 'rgba(14, 20, 27, 0.92)';
      ctx.beginPath();
      ctx.roundRect(cycBadgeX, cycBadgeY, cycW, cycH, 4);
      ctx.fill();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Cycloid indicator dot
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(cycBadgeX + 7, cycBadgeY + cycH / 2, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = accent;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(cycLabel, cycBadgeX + 13, cycBadgeY + cycH / 2);

      // Badge 2: Trochoid Arc Length (l < L)
      // Approximate arc length of curtate cycloid: l ≈ 2πR * sqrt((1 + (r/R)^2)/2)
      const trochoidArc = Math.round(2 * Math.PI * R * Math.sqrt((1 + Math.pow(r / R, 2)) / 2));
      const troLabel = `Trochoid: l = ${trochoidArc}px (l < L)`;
      const troW = ctx.measureText(troLabel).width + 12;
      const troH = 16;
      const troBadgeX = peakX - troW / 2;
      const troBadgeY = trochoidPeakY - 14;

      ctx.fillStyle = 'rgba(14, 20, 27, 0.92)';
      ctx.beginPath();
      ctx.roundRect(troBadgeX, troBadgeY, troW, troH, 4);
      ctx.fill();
      ctx.strokeStyle = secondary;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Trochoid indicator dot
      ctx.fillStyle = secondary;
      ctx.beginPath();
      ctx.arc(troBadgeX + 7, troBadgeY + troH / 2, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = secondary;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(troLabel, troBadgeX + 13, troBadgeY + troH / 2);

      // 6.3 Animated Laser Photon Scanner Pulses
      const scanPhase = (tSec * 0.75) % 1.0;
      const scanTheta = scanPhase * totalAngle;
      const scanHX = R * scanTheta;

      // Cycloid pulse position
      const scanAng = scanTheta - Math.PI / 2;
      const cycPulseX = scanHX + R * Math.cos(scanAng);
      const cycPulseY = hubY + R * Math.sin(scanAng);

      // Trochoid pulse position
      const troPulseX = scanHX + r * Math.cos(scanAng);
      const troPulseY = hubY + r * Math.sin(scanAng);

      // Draw glowing photon scanners
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = accent;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(cycPulseX, cycPulseY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowColor = secondary;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(troPulseX, troPulseY, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();
    }
  },

  getTelemetryMetrics(
    tSec: number,
    tau: number,
    params: Record<string, any>,
    colors: { accent: string; secondary: string }
  ): TelemetryMetric[] {
    const R = Number(params.R) || 85;
    const r = Math.min(R - 10, Number(params.r) || 42);
    const turns = Number(params.turns) || 2;
    const totalAngle = turns * Math.PI * 2;
    const theta = tau * totalAngle;

    const currentTurns = (theta / (Math.PI * 2)).toFixed(2);
    const outerDist = Math.round(R * theta);
    const innerRollTheoretical = r * theta;
    const slipDist = Math.round(outerDist - innerRollTheoretical);
    const slipPct = outerDist > 0 ? ((slipDist / outerDist) * 100).toFixed(1) : '0.0';

    const showGalileoMode = Boolean(params.showGalileoMode);
    if (showGalileoMode) {
      const N = Math.max(4, Math.min(12, Math.floor(Number(params.galileoSides) || 6)));
      const L = 2 * R * Math.sin(Math.PI / N);
      const l = 2 * r * Math.sin(Math.PI / N);
      const delta = L - l;

      return [
        {
          label: 'Góc nhìn Galileo',
          value: `Đa giác ${N} cạnh`,
          color: '#FFFFFF',
        },
        {
          label: 'Cạnh lớn (L)',
          value: `${L.toFixed(1)} px`,
          color: colors.accent || '#BEFF01',
        },
        {
          label: 'Cạnh nhỏ (l)',
          value: `${l.toFixed(1)} px`,
          color: colors.secondary || '#00D4FF',
        },
        {
          label: 'Khoảng trượt (Δ)',
          value: `${delta.toFixed(1)} px`,
          color: '#FF5544',
        },
      ];
    }

    return [
      {
        label: 'Góc quay (θ)',
        value: `${(theta * 180 / Math.PI % 360).toFixed(0)}° (${currentTurns}v)`,
        color: colors.accent || '#BEFF01',
      },
      {
        label: 'Quãng đường (S = Rθ)',
        value: `${outerDist} px`,
        color: '#FFFFFF',
      },
      {
        label: 'Độ trượt bánh trong',
        value: `${slipDist} px (${slipPct}%)`,
        color: colors.secondary || '#00D4FF',
      },
      {
        label: 'Vận tốc trượt tức thời',
        value: `${((R - r) * 1.2).toFixed(1)} px/s`,
        color: '#FF5544',
      },
    ];
  },
};
