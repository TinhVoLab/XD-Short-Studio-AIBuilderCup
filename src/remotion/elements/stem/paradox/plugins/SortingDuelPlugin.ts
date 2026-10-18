import { IParadoxDefinition, CameraFocusState, ParadoxCameraMode, TelemetryMetric } from '../types';

export const SortingDuelPlugin: IParadoxDefinition = {
  id: 'sorting-duel',
  name: 'Cuộc đua Sắp xếp (QuickSort vs BubbleSort)',
  category: 'computer_science',
  archetype: 'array_sorting',
  description: 'Cuộc đua thuật toán: Thuật toán chia để trị QuickSort O(N log N) đối đầu với thuật toán vét cạn BubbleSort O(N²).',
  latexFormula: 'O(N \\log N) \\ll O(N^2) \\implies \\text{QuickSort hoàn thành sớm gấp 4x}',
  cueKeywords: ['quicksort', 'bubblesort', 'sắp xếp', 'chia để trị', 'pivot', 'so sánh', 'đổi chỗ', 'bứt tốc', 'về đích'],
  soundFxArchetype: 'sorting',
  defaultParams: {
    elements: 24,
  },
  paramsSchema: [
    {
      key: 'elements',
      label: 'Số phần tử mảng',
      type: 'number',
      min: 16,
      max: 32,
      step: 4,
      default: 24,
      unit: 'thanh',
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
    // Zoom slightly into the QuickSort action in Act 2
    if (tau < 0.50) {
      return { x: 0, y: -20, zoom: 1.15 };
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
    const { w, h } = bounds;
    const { accent, secondary } = colors;
    const N = Math.max(16, Math.min(32, Math.floor(Number(params.elements) || 24)));

    // Deterministic pseudo-random initial array
    const baseArr: number[] = [];
    for (let i = 0; i < N; i++) {
      // Deterministic permutation
      baseArr.push(((i * 7 + 11) % N) + 1);
    }

    const padX = 20;
    const laneW = w - padX * 2;
    const laneH = (h - 60) / 2;
    const barW = laneW / N;

    // 1. Top Lane: QuickSort (Finishes at tau = 0.45)
    const isQuickDone = tau >= 0.45;
    const quickProg = Math.min(1.0, tau / 0.45);
    const topY = 24;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.fillRect(padX, topY, laneW, laneH);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.strokeRect(padX, topY, laneW, laneH);

    ctx.fillStyle = accent;
    ctx.font = 'bold 9.5px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`QUICKSORT O(N log N) [${isQuickDone ? 'HOÀN TẤT' : 'ĐANG BỨT TỐC'}]`, padX + 8, topY + 14);

    for (let i = 0; i < N; i++) {
      // Interpolate between initial scrambled value and fully sorted (i + 1)
      const initVal = baseArr[i];
      const sortedVal = i + 1;
      const currentVal = isQuickDone ? sortedVal : (initVal + (sortedVal - initVal) * quickProg);

      const barH = (currentVal / N) * (laneH - 30);
      const bx = padX + i * barW;
      const by = topY + laneH - barH - 6;

      const isCurrentPivot = !isQuickDone && Math.floor(quickProg * N) === i;
      ctx.fillStyle = isQuickDone ? accent : (isCurrentPivot ? '#FFFFFF' : 'rgba(190, 255, 1, 0.7)');
      ctx.fillRect(bx + 1, by, barW - 2, barH);
    }

    // 2. Bottom Lane: BubbleSort (Finishes at tau = 0.95)
    const isBubbleDone = tau >= 0.95;
    const bubbleProg = Math.min(1.0, tau / 0.95);
    const botY = topY + laneH + 12;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.fillRect(padX, botY, laneW, laneH);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.strokeRect(padX, botY, laneW, laneH);

    ctx.fillStyle = secondary;
    ctx.font = 'bold 9.5px monospace';
    ctx.fillText(`BUBBLESORT O(N²) [${isBubbleDone ? 'HOÀN TẤT' : 'ĐANG DUYỆT'}]`, padX + 8, botY + 14);

    for (let i = 0; i < N; i++) {
      const initVal = baseArr[i];
      const sortedVal = i + 1;
      // BubbleSort sorts from right to left gradually
      const sortedThreshold = Math.floor(bubbleProg * N);
      const isSortedSlot = i >= N - sortedThreshold;
      const currentVal = isBubbleDone || isSortedSlot ? sortedVal : initVal;

      const barH = (currentVal / N) * (laneH - 30);
      const bx = padX + i * barW;
      const by = botY + laneH - barH - 6;

      const isComparing = !isBubbleDone && Math.floor((tau * 40) % N) === i;
      ctx.fillStyle = isBubbleDone ? secondary : (isComparing ? '#FF5544' : 'rgba(0, 212, 255, 0.6)');
      ctx.fillRect(bx + 1, by, barW - 2, barH);
    }
  },

  getTelemetryMetrics(
    tSec: number,
    tau: number,
    params: Record<string, any>,
    colors: { accent: string; secondary: string }
  ): TelemetryMetric[] {
    const isQuickDone = tau >= 0.45;
    const quickCompares = Math.min(112, Math.floor(tau * 250));
    const bubbleCompares = Math.min(576, Math.floor(tau * 610));

    return [
      {
        label: 'TRẠNG THÁI',
        value: isQuickDone ? 'QUICKSORT CHIẾN THẮNG' : 'ĐANG CHẠY ĐUA',
        color: isQuickDone ? colors.accent : '#FFFFFF',
      },
      {
        label: 'QUICKSORT',
        value: `${quickCompares} so sánh (${isQuickDone ? 'Xong lúc tau=0.45' : 'Đang chạy'})`,
        color: colors.accent,
      },
      {
        label: 'BUBBLESORT',
        value: `${bubbleCompares} so sánh (Chậm gấp 4x)`,
        color: colors.secondary,
      },
      {
        label: 'TỐC ĐỘ VƯỢT TRỘI',
        value: isQuickDone ? '4.8x NHANH HƠN' : 'O(N log N) vs O(N²)',
        color: colors.accent,
      },
    ];
  },
};
