import { FormulaFrame, FormulaModule, FormulaPath, FormulaParticle } from '../../types';
import { clamp } from '../mathUtils';

const computeHarmonicWave = (
  t: number,
  accent: string,
  secondary: string
): FormulaFrame => {
  const paths: FormulaPath[] = [];
  const particles: FormulaParticle[] = [];

  const steps = 60;
  const pts1: string[] = [];
  const pts2: string[] = [];
  const pts3: string[] = [];

  for (let s = 0; s <= steps; s++) {
    const x = 10 + (s / steps) * 80;
    const normX = (s / steps) * Math.PI * 4;

    const y1 = 50 + 16 * Math.sin(normX - t * 3);
    const y2 = 50 + 8 * Math.sin(normX * 2 + t * 4.5);
    const ySum = 50 + 12 * Math.sin(normX - t * 3) + 6 * Math.sin(normX * 2 + t * 4.5);

    pts1.push(`${x.toFixed(1)},${y1.toFixed(1)}`);
    pts2.push(`${x.toFixed(1)},${y2.toFixed(1)}`);
    pts3.push(`${x.toFixed(1)},${ySum.toFixed(1)}`);
  }

  paths.push({
    d: `M ${pts1.join(' L ')}`,
    stroke: 'rgba(255, 255, 255, 0.2)',
    strokeWidth: 1.0,
    fill: 'none',
    opacity: 0.5,
  });

  paths.push({
    d: `M ${pts2.join(' L ')}`,
    stroke: secondary,
    strokeWidth: 1.2,
    fill: 'none',
    opacity: 0.6,
  });

  paths.push({
    d: `M ${pts3.join(' L ')}`,
    stroke: accent,
    strokeWidth: 2.2,
    fill: 'none',
    opacity: 0.95,
  });

  for (let k = 0; k < 3; k++) {
    const nodeIdx = Math.floor(10 + k * 18 + Math.sin(t * 2 + k) * 5);
    const clampedIdx = clamp(nodeIdx, 0, steps);
    const x = 10 + (clampedIdx / steps) * 80;
    const normX = (clampedIdx / steps) * Math.PI * 4;
    const y = 50 + 12 * Math.sin(normX - t * 3) + 6 * Math.sin(normX * 2 + t * 4.5);

    particles.push({
      cx: x,
      cy: y,
      r: 2.6,
      fill: accent,
      opacity: 0.9,
    });
  }

  return { paths, particles };
};

export const HarmonicWaveModule: FormulaModule = {
  id: 'harmonic-wave',
  name: 'Sóng Hài Đa Tần',
  category: 'finance',
  description: 'Superposition of fundamental and harmonic waves',
  compute: computeHarmonicWave,
};
