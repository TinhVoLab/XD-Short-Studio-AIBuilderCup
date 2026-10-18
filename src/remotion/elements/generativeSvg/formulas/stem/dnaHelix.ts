import { FormulaFrame, FormulaModule, FormulaPath, FormulaParticle } from '../../types';

const computeDnaHelix = (
  t: number,
  accent: string,
  secondary: string
): FormulaFrame => {
  const paths: FormulaPath[] = [];
  const particles: FormulaParticle[] = [];

  const startY = 12;
  const endY = 88;
  const steps = 36;
  const amplitude = 22;
  const frequency = 0.08;
  const speed = 2.4;

  const ptsStrand1: string[] = [];
  const ptsStrand2: string[] = [];

  for (let s = 0; s <= steps; s++) {
    const y = startY + (s / steps) * (endY - startY);
    const phase = y * frequency - t * speed;
    const xOffset = amplitude * Math.sin(phase);

    const x1 = 50 + xOffset;
    const x2 = 50 - xOffset;

    ptsStrand1.push(`${x1.toFixed(1)},${y.toFixed(1)}`);
    ptsStrand2.push(`${x2.toFixed(1)},${y.toFixed(1)}`);

    if (s % 3 === 0) {
      const depth = Math.cos(phase);
      const rungOpacity = 0.25 + 0.5 * ((depth + 1) / 2);
      paths.push({
        d: `M ${x1.toFixed(1)} ${y.toFixed(1)} L ${x2.toFixed(1)} ${y.toFixed(1)}`,
        stroke: depth > 0 ? accent : 'rgba(255, 255, 255, 0.25)',
        strokeWidth: depth > 0 ? 1.4 : 0.8,
        fill: 'none',
        opacity: rungOpacity,
      });

      particles.push({
        cx: 50,
        cy: y,
        r: 1.6,
        fill: secondary,
        opacity: rungOpacity,
      });
    }
  }

  paths.push({
    d: `M ${ptsStrand1.join(' L ')}`,
    stroke: accent,
    strokeWidth: 2.0,
    fill: 'none',
    opacity: 0.95,
  });

  paths.push({
    d: `M ${ptsStrand2.join(' L ')}`,
    stroke: secondary,
    strokeWidth: 1.6,
    fill: 'none',
    opacity: 0.85,
  });

  return { paths, particles };
};

export const DnaHelixModule: FormulaModule = {
  id: 'dna-helix',
  name: 'Chuỗi Xoắn DNA',
  category: 'stem',
  description: 'Double helix 3D projection with rotating base pairs',
  compute: computeDnaHelix,
};
