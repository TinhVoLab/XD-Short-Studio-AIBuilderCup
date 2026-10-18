import { IParadoxDefinition, CameraFocusState, ParadoxCameraMode, TelemetryMetric } from '../types';

export const TrafficFlowPlugin: IParadoxDefinition = {
  id: 'phantom-traffic-jam',
  name: 'Nghịch lý Kẹt xe Ma (Phantom Traffic Jam)',
  category: 'physics',
  archetype: 'traffic_flow',
  description: 'Mô phỏng động lực học dòng xe Nagel-Schreckenberg IDM: Sóng dừng giật lùi (Backward Shockwave) và cơ chế triệt tiêu bằng xe tự hành AI.',
  latexFormula: 'v_{n}(t + \\Delta t) = \\min(v_0, v_n + a, \\text{gap}_n)',
  cueKeywords: ['phanh', 'kẹt xe', 'sóng lùi', 'dừng lại', 'tự hành', 'thông suốt', 'triệt tiêu', 'ùn tắc', 'shockwave'],
  soundFxArchetype: 'traffic',
  defaultParams: {
    vehicles: 22,
    brakeTrigger: true,
    showAI: true,
    aiRatio: 0.10,
  },
  paramsSchema: [
    {
      key: 'vehicles',
      label: 'Số lượng xe',
      type: 'number',
      min: 14,
      max: 32,
      step: 2,
      default: 22,
      unit: 'xe',
    },
    {
      key: 'brakeTrigger',
      label: 'Kích hoạt cú nhấp phanh',
      type: 'boolean',
      default: true,
    },
    {
      key: 'showAI',
      label: 'Kích hoạt xe tự hành AI (ACC)',
      type: 'boolean',
      default: true,
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

    // In Act 2 (Shockwave formation), zoom in on the shockwave brake hotspot
    if (tau >= 0.25 && tau < 0.65) {
      const shockwaveAngle = -tau * Math.PI * 1.5;
      const R = 135;
      return {
        x: R * Math.cos(shockwaveAngle) * 0.5,
        y: R * Math.sin(shockwaveAngle) * 0.5,
        zoom: 1.25,
      };
    }

    // In Act 3 (Resolution), smooth zoom out to full highway overview
    return { x: 0, y: 0, zoom: 0.95 };
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
    const numCars = Math.max(14, Math.min(32, Math.floor(Number(params.vehicles) || 22)));
    const showAI = Boolean(params.showAI);

    const cx = w / 2;
    const cy = h / 2 - 4;
    const R = Math.min(w, h) * 0.36;

    // 1. Highway Ring Track
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 30;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();

    // Dashed center lane line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Deterministic Traffic State as pure function of tau
    // Phase 1 (tau < 0.20): Smooth steady flow
    // Phase 2 (0.20 <= tau < 0.60): Car #5 brakes, shockwave propagates backwards (CW vs CCW)
    // Phase 3 (tau >= 0.60): AI vehicle dampens and dissolves the shockwave
    const baseRotation = tau * Math.PI * 6; // 3 full laps over video
    const isJamActive = tau >= 0.22 && (!showAI || tau < 0.72);
    const shockwaveAngle = (Math.PI * 0.8 - (tau - 0.22) * Math.PI * 1.8) % (Math.PI * 2);

    // Shockwave Highlight Zone
    if (isJamActive) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 85, 68, 0.35)';
      ctx.lineWidth = 36;
      ctx.beginPath();
      ctx.arc(cx, cy, R, shockwaveAngle - 0.45, shockwaveAngle + 0.45);
      ctx.stroke();

      // Shockwave warning text
      ctx.fillStyle = '#FF5544';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SÓNG DỪNG MA (-18 km/h)', cx, cy - R - 22);
      ctx.restore();
    }

    // 3. Central Radar Metrics Hub
    ctx.fillStyle = 'rgba(13, 17, 23, 0.92)';
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Center speed metric
    const avgSpeedKmH = isJamActive ? Math.round(14 + 18 * Math.sin(tau * Math.PI * 4)) : Math.round(52 + 6 * Math.sin(tSec * 2));
    ctx.fillStyle = avgSpeedKmH < 25 ? '#FF5544' : accent;
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${avgSpeedKmH}`, cx, cy + 2);
    ctx.font = 'bold 8.5px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('KM/H TRUNG BÌNH', cx, cy + 16);

    // 4. Cars Rendering
    for (let i = 0; i < numCars; i++) {
      const isAI = showAI && (i === 0 || i === Math.floor(numCars / 2));
      let carAngle = (baseRotation + (i / numCars) * Math.PI * 2) % (Math.PI * 2);

      // Perturb angle if in shockwave
      let isStopped = false;
      if (isJamActive) {
        let diff = carAngle - shockwaveAngle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        if (Math.abs(diff) < 0.4) {
          isStopped = true;
          carAngle -= diff * 0.55; // Bunch up
        }
      }

      const px = cx + R * Math.cos(carAngle);
      const py = cy + R * Math.sin(carAngle);
      const carRot = carAngle + Math.PI / 2;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(carRot);

      let carColor = secondary; // Human normal
      if (isAI) carColor = accent; // AI autonomous
      if (isStopped) carColor = '#FF5544'; // Jammed / brake red

      ctx.fillStyle = carColor;
      ctx.shadowColor = carColor;
      ctx.shadowBlur = isStopped ? 12 : 5;
      ctx.beginPath();
      ctx.roundRect(-5.5, -9, 11, 18, 2.5);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Windshield
      ctx.fillStyle = '#080A0F';
      ctx.fillRect(-3.5, -5, 7, 4);

      // AI Radar scanner wave
      if (isAI) {
        ctx.strokeStyle = 'rgba(190, 255, 1, 0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, -12, 8, -Math.PI * 0.7, -Math.PI * 0.3);
        ctx.stroke();
      }

      ctx.restore();
    }
  },

  getTelemetryMetrics(
    tSec: number,
    tau: number,
    params: Record<string, any>,
    colors: { accent: string; secondary: string }
  ): TelemetryMetric[] {
    const showAI = Boolean(params.showAI);
    const isJamActive = tau >= 0.22 && (!showAI || tau < 0.72);
    const avgSpeed = isJamActive ? '18 km/h' : '58 km/h';

    return [
      {
        label: 'TRẠNG THÁI',
        value: isJamActive ? 'KẸT XE MA (STOP-AND-GO)' : 'LƯU THÔNG THÔNG SUỐT',
        color: isJamActive ? '#FF5544' : colors.accent,
      },
      {
        label: 'VẬN TỐC TRUNG BÌNH',
        value: avgSpeed,
        color: '#FFFFFF',
      },
      {
        label: 'SÓNG LÙI SHOCKWAVE',
        value: isJamActive ? '-18 km/h' : '0 km/h (TRIỆT TIÊU)',
        color: isJamActive ? '#FF5544' : colors.accent,
      },
      {
        label: 'XE TỰ HÀNH AI',
        value: showAI ? '10% (ACC DAMPING)' : 'TẮT',
        color: showAI ? colors.accent : colors.secondary,
      },
    ];
  },
};
