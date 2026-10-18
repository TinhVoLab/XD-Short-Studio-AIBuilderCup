import { FormulaFrame, FormulaModule, FormulaPath, FormulaParticle } from '../../types';

const computeFibonacciSpiral = (
  t: number,
  accent: string,
  secondary: string
): FormulaFrame => {
  const paths: FormulaPath[] = [];
  const particles: FormulaParticle[] = [];

  const cx = 50;
  const cy = 50;
  const b = 0.175;
  const steps = 90;
  const maxTheta = Math.PI * 4.5;

  const pts: string[] = [];
  const rotationOffset = t * 0.8;

  for (let s = 0; s <= steps; s++) {
    const theta = (s / steps) * maxTheta;
    const r = 2.0 * Math.exp(b * theta);
    const totalAngle = theta + rotationOffset;
    const x = cx + r * Math.cos(totalAngle);
    const y = cy + r * Math.sin(totalAngle);

    if (x >= 6 && x <= 94 && y >= 6 && y <= 94) {
      pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
    }
  }

  if (pts.length > 1) {
    paths.push({
      d: `M ${pts.join(' L ')}`,
      stroke: accent,
      strokeWidth: 2.0,
      fill: 'none',
      opacity: 0.95,
    });
  }

  const nodeCount = 5;
  for (let n = 1; n <= nodeCount; n++) {
    const nodeTheta = (n / nodeCount) * maxTheta;
    const r = 2.0 * Math.exp(b * nodeTheta);
    const totalAngle = nodeTheta + rotationOffset;
    const nx = cx + r * Math.cos(totalAngle);
    const ny = cy + r * Math.sin(totalAngle);

    if (nx >= 8 && nx <= 92 && ny >= 8 && ny <= 92) {
      particles.push({
        cx: nx,
        cy: ny,
        r: 2.2,
        fill: n % 2 === 0 ? secondary : accent,
        opacity: 0.8 + 0.2 * Math.sin(t * 3 + n),
      });
    }
  }

  return { paths, particles };
};

export const FibonacciSpiralModule: FormulaModule = {
  id: 'fibonacci-spiral',
  name: 'Xoắn Ốc Fibonacci',
  category: 'finance',
  description: 'Golden ratio logarithmic spiral with rotating nodes',
  compute: computeFibonacciSpiral,
};
