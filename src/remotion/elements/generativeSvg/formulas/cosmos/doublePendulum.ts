import { FormulaFrame, FormulaModule, FormulaPath, FormulaParticle } from '../../types';
import { clamp } from '../mathUtils';

const computeDoublePendulum = (
  t: number,
  accent: string,
  secondary: string
): FormulaFrame => {
  const paths: FormulaPath[] = [];
  const particles: FormulaParticle[] = [];

  const originX = 50;
  const originY = 32;
  const l1 = 20;
  const l2 = 22;

  // Approximate chaotic angle trajectories using coupled nonlinear trigonometric harmonics
  const θ1 = 0.9 * Math.sin(t * 1.8) + 0.3 * Math.sin(t * 3.7);
  const θ2 = 1.3 * Math.sin(t * 2.6) + 0.6 * Math.sin(t * 5.1 + 0.5);

  const x1 = originX + l1 * Math.sin(θ1);
  const y1 = originY + l1 * Math.cos(θ1);

  const x2 = x1 + l2 * Math.sin(θ2);
  const y2 = y1 + l2 * Math.cos(θ2);

  // Generate historical trail trajectory for the second bob
  const trailSteps = 30;
  const trailPts: string[] = [];
  for (let i = trailSteps; i >= 0; i--) {
    const pastT = t - i * 0.04;
    const pθ1 = 0.9 * Math.sin(pastT * 1.8) + 0.3 * Math.sin(pastT * 3.7);
    const pθ2 = 1.3 * Math.sin(pastT * 2.6) + 0.6 * Math.sin(pastT * 5.1 + 0.5);
    const px1 = originX + l1 * Math.sin(pθ1);
    const py1 = originY + l1 * Math.cos(pθ1);
    const px2 = px1 + l2 * Math.sin(pθ2);
    const py2 = py1 + l2 * Math.cos(pθ2);
    trailPts.push(`${clamp(px2, 8, 92).toFixed(1)},${clamp(py2, 8, 92).toFixed(1)}`);
  }

  // Draw chaotic trail
  paths.push({
    d: `M ${trailPts.join(' L ')}`,
    stroke: accent,
    strokeWidth: 1.2,
    fill: 'none',
    opacity: 0.6,
  });

  // Draw Link 1
  paths.push({
    d: `M ${originX} ${originY} L ${x1.toFixed(1)} ${y1.toFixed(1)}`,
    stroke: 'rgba(255, 255, 255, 0.4)',
    strokeWidth: 1.6,
    fill: 'none',
  });

  // Draw Link 2
  paths.push({
    d: `M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}`,
    stroke: secondary,
    strokeWidth: 2.0,
    fill: 'none',
    opacity: 0.95,
  });

  // Anchor pivot
  particles.push({
    cx: originX,
    cy: originY,
    r: 2.5,
    fill: '#FFFFFF',
    opacity: 0.7,
  });

  // Joint 1 bob
  particles.push({
    cx: x1,
    cy: y1,
    r: 3.2,
    fill: secondary,
    opacity: 0.9,
  });

  // Joint 2 bob (chaotic tip)
  particles.push({
    cx: clamp(x2, 8, 92),
    cy: clamp(y2, 8, 92),
    r: 4.2,
    fill: accent,
    opacity: 1.0,
  });

  return { paths, particles };
};

export const DoublePendulumModule: FormulaModule = {
  id: 'double-pendulum',
  name: 'Con Lắc Đôi Hỗn Loạn',
  category: 'cosmos',
  description: 'Chaotic double pendulum fractal trajectory',
  compute: computeDoublePendulum,
};
