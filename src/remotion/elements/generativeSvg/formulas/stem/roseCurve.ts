import { FormulaFrame, FormulaModule, FormulaPath, FormulaParticle } from '../../types';

const computeRoseCurve = (
  t: number,
  accent: string,
  secondary: string
): FormulaFrame => {
  const paths: FormulaPath[] = [];
  const particles: FormulaParticle[] = [];

  const cx = 50;
  const cy = 50;
  const R = 38;
  const k = 4; // 8 petals
  const rotation = t * 0.6;

  const steps = 120;
  const pts: string[] = [];

  for (let s = 0; s <= steps; s++) {
    const theta = (s / steps) * Math.PI * 2;
    const r = R * Math.cos(k * theta);
    const angle = theta + rotation;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }

  // Outer boundary reference ring
  paths.push({
    d: `M 50 12 A 38 38 0 1 1 50 88 A 38 38 0 1 1 50 12`,
    stroke: 'rgba(255, 255, 255, 0.15)',
    strokeWidth: 0.8,
    fill: 'none',
    opacity: 0.4,
  });

  // Rose curve petals
  paths.push({
    d: `M ${pts.join(' L ')} Z`,
    stroke: accent,
    strokeWidth: 1.8,
    fill: 'none',
    opacity: 0.92,
  });

  // Petal tip particles
  for (let p = 0; p < 8; p++) {
    const tipTheta = (p * Math.PI) / 4;
    const angle = tipTheta + rotation;
    const tx = cx + R * Math.cos(angle);
    const ty = cy + R * Math.sin(angle);
    particles.push({
      cx: tx,
      cy: ty,
      r: 2.0,
      fill: p % 2 === 0 ? secondary : accent,
      opacity: 0.75 + 0.25 * Math.sin(t * 3 + p),
    });
  }

  return { paths, particles };
};

export const RoseCurveModule: FormulaModule = {
  id: 'rose-curve',
  name: 'Hoa Hồng Rhodonea',
  category: 'stem',
  description: 'Multi-petal sinusoidal polar mathematical rosette',
  compute: computeRoseCurve,
};
