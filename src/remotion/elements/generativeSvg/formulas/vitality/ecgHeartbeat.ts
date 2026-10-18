import { FormulaFrame, FormulaModule, FormulaPath, FormulaParticle } from '../../types';
import { clamp } from '../mathUtils';

const computeEcgHeartbeat = (
  t: number,
  accent: string,
  secondary: string
): FormulaFrame => {
  const paths: FormulaPath[] = [];
  const particles: FormulaParticle[] = [];

  const baselineY = 50;
  const steps = 80;
  const pts: string[] = [];

  // P-Q-R-S-T parametric function in local cycle [0, 1]
  function ecgShape(xNorm: number): number {
    // xNorm in [0, 1]
    if (xNorm < 0.2) return 0; // baseline
    if (xNorm < 0.3) return -3 * Math.sin(((xNorm - 0.2) / 0.1) * Math.PI); // P wave
    if (xNorm < 0.38) return 0; // PR segment
    if (xNorm < 0.42) return 5 * Math.sin(((xNorm - 0.38) / 0.04) * Math.PI); // Q dip
    if (xNorm < 0.48) return -32 * Math.sin(((xNorm - 0.42) / 0.06) * Math.PI); // R spike
    if (xNorm < 0.54) return 9 * Math.sin(((xNorm - 0.48) / 0.06) * Math.PI); // S valley
    if (xNorm < 0.62) return 0; // ST segment
    if (xNorm < 0.78) return -6 * Math.sin(((xNorm - 0.62) / 0.16) * Math.PI); // T wave
    return 0; // baseline
  }

  // Draw ECG waveform traveling left-to-right
  const offset = (t * 0.7) % 1;
  for (let s = 0; s <= steps; s++) {
    const x = 12 + (s / steps) * 76;
    const normX = ((s / steps) + offset) % 1;
    const dy = ecgShape(normX);
    const y = baselineY + dy;
    pts.push(`${x.toFixed(1)},${clamp(y, 14, 86).toFixed(1)}`);
  }

  // Grid background lines (medical monitor style)
  paths.push({
    d: `M 12 30 L 88 30 M 12 50 L 88 50 M 12 70 L 88 70 M 31 16 L 31 84 M 50 16 L 50 84 M 69 16 L 69 84`,
    stroke: 'rgba(255, 255, 255, 0.1)',
    strokeWidth: 0.6,
    fill: 'none',
  });

  // Main ECG trace line
  paths.push({
    d: `M ${pts.join(' L ')}`,
    stroke: accent,
    strokeWidth: 2.2,
    fill: 'none',
    opacity: 0.95,
  });

  // Cardiac pulsation beacon node at the R-peak position
  const rPeakPosNorm = ((0.45 - offset + 1) % 1);
  const scanX = 12 + rPeakPosNorm * 76;
  const scanY = baselineY + ecgShape(0.45);

  particles.push({
    cx: clamp(scanX, 14, 86),
    cy: clamp(scanY, 14, 86),
    r: 3.5 + 0.8 * Math.sin(t * 8),
    fill: secondary,
    opacity: 1.0,
  });

  // Pulse heart dot in corner
  const heartPulse = 2.4 + 0.6 * Math.abs(Math.sin(t * 4));
  particles.push({
    cx: 82,
    cy: 22,
    r: heartPulse,
    fill: accent,
    opacity: 0.9,
  });

  return { paths, particles };
};

export const EcgHeartbeatModule: FormulaModule = {
  id: 'ecg-heartbeat',
  name: 'Nhịp Tim ECG',
  category: 'vitality',
  description: 'PQRST waveform with real-time heartbeat contraction',
  compute: computeEcgHeartbeat,
};
