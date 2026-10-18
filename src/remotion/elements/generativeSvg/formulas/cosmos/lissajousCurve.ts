import { FormulaFrame, FormulaModule, FormulaPath, FormulaParticle } from '../../types';

const computeLissajousCurve = (
  t: number,
  accent: string,
  secondary: string
): FormulaFrame => {
  const paths: FormulaPath[] = [];
  const particles: FormulaParticle[] = [];

  const cx = 50;
  const cy = 50;
  const A = 36;
  const B = 36;
  const a = 3;
  const b = 4;
  const delta = t * 1.5;

  const steps = 120;
  const pts: string[] = [];

  for (let s = 0; s <= steps; s++) {
    const theta = (s / steps) * Math.PI * 2;
    const x = cx + A * Math.sin(a * theta + delta);
    const y = cy + B * Math.sin(b * theta);
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }

  paths.push({
    d: `M ${pts.join(' L ')} Z`,
    stroke: accent,
    strokeWidth: 1.8,
    fill: 'none',
    opacity: 0.9,
  });

  const currentTheta = (t * 2) % (Math.PI * 2);
  const sparkX = cx + A * Math.sin(a * currentTheta + delta);
  const sparkY = cy + B * Math.sin(b * currentTheta);

  particles.push({
    cx: sparkX,
    cy: sparkY,
    r: 3.2,
    fill: secondary,
    opacity: 1.0,
  });

  return { paths, particles };
};

export const LissajousCurveModule: FormulaModule = {
  id: 'lissajous-curve',
  name: 'Đường Cong Lissajous',
  category: 'cosmos',
  description: 'Oscilloscope phase-interference parametric figure',
  compute: computeLissajousCurve,
};
