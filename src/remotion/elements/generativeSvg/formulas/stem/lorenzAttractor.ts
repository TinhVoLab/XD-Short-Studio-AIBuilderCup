import { FormulaFrame, FormulaModule, FormulaPath, FormulaParticle } from '../../types';
import { clamp } from '../mathUtils';

const computeLorenzAttractor = (
  t: number,
  accent: string,
  secondary: string
): FormulaFrame => {
  const σ = 10;
  const ρ = 28;
  const β = 8 / 3;
  const dt = 0.012;

  let x = 0.1;
  let y = 0;
  let z = 0;

  const totalPoints = 180;
  const pts: [number, number][] = [];

  for (let i = 0; i < totalPoints; i++) {
    const dx = σ * (y - x);
    const dy = x * (ρ - z) - y;
    const dz = x * y - β * z;
    x += dx * dt;
    y += dy * dt;
    z += dz * dt;

    const px = 50 + (x / 22) * 36;
    const py = 85 - (z / 48) * 70;
    pts.push([clamp(px, 8, 92), clamp(py, 8, 92)]);
  }

  const cycle = (t * 0.4) % 1;
  const headIndex = Math.floor(cycle * (pts.length - 1));
  const activePts = pts.slice(0, headIndex + 1);

  const pathD = activePts.length > 1
    ? `M ${activePts.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L ')}`
    : `M 50,50 L 50,50`;

  const fullPathD = `M ${pts.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L ')}`;

  const paths: FormulaPath[] = [
    {
      d: fullPathD,
      stroke: 'rgba(255, 255, 255, 0.12)',
      strokeWidth: 0.8,
      fill: 'none',
      opacity: 0.4,
    },
    {
      d: pathD,
      stroke: accent,
      strokeWidth: 2.0,
      fill: 'none',
      opacity: 0.95,
    },
  ];

  const headPos = pts[headIndex] || [50, 50];
  const particles: FormulaParticle[] = [
    {
      cx: headPos[0],
      cy: headPos[1],
      r: 3.2,
      fill: secondary,
      opacity: 1,
    },
    {
      cx: 50,
      cy: 50,
      r: 1.5,
      fill: accent,
      opacity: 0.5,
    },
  ];

  return { paths, particles };
};

export const LorenzAttractorModule: FormulaModule = {
  id: 'lorenz-attractor',
  name: 'Hấp Dẫn Tử Lorenz',
  category: 'stem',
  description: 'Butterfly chaos theory dynamic trajectory',
  compute: computeLorenzAttractor,
};
