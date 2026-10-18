import { FormulaFrame, FormulaModule, FormulaPath, FormulaParticle } from '../../types';
import { clamp } from '../mathUtils';

const computeSingularityVortex = (
  t: number,
  accent: string,
  secondary: string
): FormulaFrame => {
  const paths: FormulaPath[] = [];
  const particles: FormulaParticle[] = [];

  const cx = 50;
  const cy = 50;
  const armCount = 3;
  const steps = 40;
  const maxR = 38;

  // 3 Spiral arms sucking inwards
  for (let a = 0; a < armCount; a++) {
    const armOffset = (a * Math.PI * 2) / armCount;
    const pts: string[] = [];

    for (let s = 0; s <= steps; s++) {
      const prog = s / steps;
      // Inward logarithmic radius
      const r = maxR * Math.pow(prog, 0.7);
      const theta = armOffset + prog * Math.PI * 3.5 - t * 2.2;
      const x = cx + r * Math.cos(theta);
      const y = cy + r * Math.sin(theta);
      pts.push(`${clamp(x, 6, 94).toFixed(1)},${clamp(y, 6, 94).toFixed(1)}`);
    }

    paths.push({
      d: `M ${pts.join(' L ')}`,
      stroke: a === 0 ? accent : 'rgba(255, 255, 255, 0.25)',
      strokeWidth: a === 0 ? 1.8 : 1.0,
      fill: 'none',
      opacity: a === 0 ? 0.9 : 0.45,
    });
  }

  // Infalling particles being accelerated into the center
  const particleCount = 8;
  for (let i = 0; i < particleCount; i++) {
    const cycle = ((t * 0.6 + i * (1 / particleCount)) % 1);
    // Invert: starts at 1, goes down to 0
    const prog = 1 - cycle;
    const armIndex = i % armCount;
    const armOffset = (armIndex * Math.PI * 2) / armCount;
    const r = maxR * Math.pow(prog, 0.7);
    // As it gets closer to center, angular velocity increases (conservation of angular momentum)
    const angularSpeed = 2.2 + (1 - prog) * 4.0;
    const theta = armOffset + prog * Math.PI * 3.5 - t * angularSpeed;

    const px = cx + r * Math.cos(theta);
    const py = cy + r * Math.sin(theta);

    particles.push({
      cx: clamp(px, 8, 92),
      cy: clamp(py, 8, 92),
      r: 1.2 + (1 - prog) * 1.6,
      fill: i % 2 === 0 ? secondary : accent,
      opacity: 0.3 + (1 - prog) * 0.7,
    });
  }

  // Singularity black hole event horizon
  const eventHorizonPulse = 3.2 + 0.4 * Math.sin(t * 6);
  particles.push({
    cx,
    cy,
    r: eventHorizonPulse,
    fill: accent,
    opacity: 0.95,
  });

  return { paths, particles };
};

export const SingularityVortexModule: FormulaModule = {
  id: 'singularity-vortex',
  name: 'Phễu Xoáy Hội Tụ',
  category: 'finance',
  description: 'Energy particles spiraling into a singularity',
  compute: computeSingularityVortex,
};
