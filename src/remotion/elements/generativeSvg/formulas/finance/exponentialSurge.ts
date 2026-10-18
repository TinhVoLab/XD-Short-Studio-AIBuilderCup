import { FormulaFrame, FormulaModule, FormulaPath, FormulaParticle } from '../../types';
import { clamp } from '../mathUtils';

const computeExponentialSurge = (
  t: number,
  accent: string,
  secondary: string
): FormulaFrame => {
  const paths: FormulaPath[] = [];
  const particles: FormulaParticle[] = [];

  const startX = 14;
  const endX = 86;
  const startY = 82;
  const endY = 18;
  const steps = 60;

  // Baseline axis
  paths.push({
    d: `M 12 84 L 88 84 M 12 84 L 12 16`,
    stroke: 'rgba(255, 255, 255, 0.15)',
    strokeWidth: 0.8,
    fill: 'none',
    opacity: 0.5,
  });

  // Exponential surge curve y = startY - (startY - endY) * ((e^(k*x) - 1) / (e^k - 1))
  const k = 2.8;
  const expKMinus1 = Math.exp(k) - 1;
  const pts: string[] = [];

  for (let s = 0; s <= steps; s++) {
    const progress = s / steps;
    const x = startX + progress * (endX - startX);
    const expVal = (Math.exp(k * progress) - 1) / expKMinus1;
    // Micro-wobble to simulate market volatility
    const wobble = Math.sin(progress * 16 - t * 4) * 1.2 * (1 - progress * 0.5);
    const y = startY - expVal * (startY - endY) + wobble;
    pts.push(`${x.toFixed(1)},${clamp(y, 14, 88).toFixed(1)}`);
  }

  // Shaded area under the curve
  const areaD = `M ${startX} ${startY} L ${pts.join(' L ')} L ${endX} ${startY} Z`;
  paths.push({
    d: areaD,
    stroke: 'none',
    strokeWidth: 0,
    fill: accent,
    opacity: 0.08,
  });

  // Main exponential curve
  paths.push({
    d: `M ${pts.join(' L ')}`,
    stroke: accent,
    strokeWidth: 2.2,
    fill: 'none',
    opacity: 0.95,
  });

  // Surging particles running up the curve with acceleration
  const particleCount = 4;
  for (let i = 0; i < particleCount; i++) {
    const pTime = ((t * 0.8 + i * (1 / particleCount)) % 1);
    // Quadratic ease-in for velocity
    const progress = pTime * pTime;
    const px = startX + progress * (endX - startX);
    const expVal = (Math.exp(k * progress) - 1) / expKMinus1;
    const wobble = Math.sin(progress * 16 - t * 4) * 1.2 * (1 - progress * 0.5);
    const py = startY - expVal * (startY - endY) + wobble;

    particles.push({
      cx: px,
      cy: clamp(py, 14, 88),
      r: 1.8 + progress * 1.8,
      fill: i === 0 ? secondary : accent,
      opacity: 0.9,
    });
  }

  return { paths, particles };
};

export const ExponentialSurgeModule: FormulaModule = {
  id: 'exponential-surge',
  name: 'Bùng Nổ Lũy Thừa',
  category: 'finance',
  description: 'Exponential growth curve with velocity particles',
  compute: computeExponentialSurge,
};
