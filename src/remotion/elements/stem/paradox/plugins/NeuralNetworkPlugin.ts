import { IParadoxDefinition, CameraFocusState, ParadoxCameraMode, TelemetryMetric } from '../types';

export const NeuralNetworkPlugin: IParadoxDefinition = {
  id: 'neural-network-fraud',
  name: 'Mạng Nơ-ron AI (Phát hiện Gian lận)',
  category: 'ai',
  archetype: 'neural_network',
  description: 'Mô phỏng mạng nơ-ron học sâu: Các xung tín hiệu điện tử và thuật toán Lan truyền ngược (Backpropagation) ép sai số Loss tiệm cận 0 để phát hiện giao dịch gian lận trong 0.05s.',
  latexFormula: 'W^{(l)} = W^{(l)} - \\eta \\nabla_{W}\\mathcal{L} \\implies \\text{Độ chính xác } 99.4\\%',
  cueKeywords: ['mạng nơ-ron', 'học sâu', 'backpropagation', 'lan truyền ngược', 'gian lận', 'trọng số', 'synapse', 'chính xác', 'loss'],
  soundFxArchetype: 'neural',
  defaultParams: {
    learningRate: 0.001,
  },
  paramsSchema: [
    {
      key: 'learningRate',
      label: 'Tốc độ học (Learning Rate)',
      type: 'number',
      min: 0.0001,
      max: 0.01,
      step: 0.0005,
      default: 0.001,
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
    // Zoom in on the hidden layer during mid-training (Act 2)
    if (tau >= 0.20 && tau < 0.70) {
      return { x: 0, y: 0, zoom: 1.18 };
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

    const layers = [
      { name: 'ĐẦU VÀO', nodes: 2, labels: ['Số tiền', 'Tần suất'] },
      { name: 'LỚP ẨN (ReLU)', nodes: 4, labels: ['H1', 'H2', 'H3', 'H4'] },
      { name: 'KẾT QUẢ', nodes: 2, labels: ['Hợp lệ', 'Gian lận!'] },
    ];

    const layerX = [w * 0.20, w * 0.50, w * 0.80];
    const loss = Math.max(0.03, 0.85 * Math.exp(-tau * 4.2));

    // 1. Draw Synaptic Weight Connections
    for (let l = 0; l < 2; l++) {
      const x1 = layerX[l];
      const x2 = layerX[l + 1];
      const n1 = layers[l].nodes;
      const n2 = layers[l + 1].nodes;

      for (let i = 0; i < n1; i++) {
        const y1 = (h / 2) - ((n1 - 1) * 32) + i * 64;
        for (let j = 0; j < n2; j++) {
          const y2 = (h / 2) - ((n2 - 1) * 28) + j * 56;

          const alpha = Math.min(0.45, 0.12 + (1 - loss) * 0.32);
          ctx.strokeStyle = `rgba(190, 255, 1, ${alpha})`;
          ctx.lineWidth = 1 + (1 - loss) * 1.5;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();

          // 2. Deterministic Photon Signal Pulses traveling along connection
          const pulseOffset = (tau * 18 + i * 3 + j * 5) % 1.0;
          const px = x1 + (x2 - x1) * pulseOffset;
          const py = y1 + (y2 - y1) * pulseOffset;

          const isFraudPulse = (i + j) % 3 === 0;
          ctx.fillStyle = isFraudPulse ? '#FF5544' : accent;
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 3. Draw Nodes
    layers.forEach((layer, l) => {
      const x = layerX[l];
      const n = layer.nodes;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.font = 'bold 8.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(layer.name, x, 28);

      for (let i = 0; i < n; i++) {
        const spacing = l === 1 ? 56 : 64;
        const y = (h / 2) - ((n - 1) * (spacing / 2)) + i * spacing;

        const isOutputFraud = l === 2 && i === 1;
        const nodeCol = isOutputFraud ? '#FF5544' : accent;

        // Node circle
        ctx.fillStyle = 'rgba(13, 17, 23, 0.95)';
        ctx.shadowColor = nodeCol;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(x, y, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = nodeCol;
        ctx.lineWidth = 1.8;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Node Label
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 8px monospace';
        ctx.fillText(layer.labels[i], x, y + 3);
      }
    });
  },

  getTelemetryMetrics(
    tSec: number,
    tau: number,
    params: Record<string, any>,
    colors: { accent: string; secondary: string }
  ): TelemetryMetric[] {
    const epoch = Math.min(250, Math.floor(tau * 250));
    const loss = Math.max(0.03, 0.85 * Math.exp(-tau * 4.2));
    const accuracy = Math.min(99.4, 62.4 + (1 - loss) * 37.0);

    return [
      {
        label: 'TRẠNG THÁI',
        value: tau >= 0.70 ? 'ĐỘ CHÍNH XÁC CAO' : 'LAN TRUYỀN NGƯỢC (BACKPROP)',
        color: colors.accent,
      },
      {
        label: 'EPOCH HUẤN LUYỆN',
        value: `#${epoch} / 250`,
        color: '#FFFFFF',
      },
      {
        label: 'HÀM LOSS',
        value: loss.toFixed(3),
        color: loss < 0.1 ? colors.accent : '#FF5544',
      },
      {
        label: 'ĐỘ CHÍNH XÁC',
        value: `${accuracy.toFixed(1)}%`,
        color: colors.accent,
      },
    ];
  },
};
