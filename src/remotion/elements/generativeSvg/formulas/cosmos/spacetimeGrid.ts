import { FormulaFrame, FormulaModule, FormulaPath, FormulaParticle } from '../../types';
import { clamp } from '../mathUtils';

const computeSpacetimeGrid = (
  t: number,
  accent: string,
  secondary: string
): FormulaFrame => {
  const paths: FormulaPath[] = [];
  const particles: FormulaParticle[] = [];

  const cx = 50;
  const cy = 52;
  const gridLines = 7;
  const step = 68 / (gridLines - 1); // [16 to 84]

  const wellDepth = 18;
  const sigma = 14;

  // Horizontal grid curves with gravitational wave ripples
  for (let gy = 0; gy < gridLines; gy++) {
    const yBase = 16 + gy * step;
    const pts: string[] = [];
    const samples = 40;

    for (let s = 0; s <= samples; s++) {
      const x = 16 + (s / samples) * 68;
      const dist = Math.hypot(x - cx, yBase - cy);
      // Dip down towards center + propagating gravitational ripple wave
      const ripple = Math.sin(dist * 0.35 - t * 3) * 1.2;
      const dip = (wellDepth / (1 + Math.pow(dist / sigma, 2))) * Math.cos((dist / sigma) * 0.4) + ripple;
      const yDistorted = yBase + dip;
      pts.push(`${x.toFixed(1)},${clamp(yDistorted, 10, 90).toFixed(1)}`);
    }

    const isCenterLine = gy === Math.floor(gridLines / 2);
    paths.push({
      d: `M ${pts.join(' L ')}`,
      stroke: isCenterLine ? accent : 'rgba(255, 255, 255, 0.22)',
      strokeWidth: isCenterLine ? 1.4 : 0.8,
      fill: 'none',
      opacity: isCenterLine ? 0.9 : 0.45,
    });
  }

  // Vertical grid curves with gravitational wave ripples
  for (let gx = 0; gx < gridLines; gx++) {
    const xBase = 16 + gx * step;
    const pts: string[] = [];
    const samples = 40;

    for (let s = 0; s <= samples; s++) {
      const y = 16 + (s / samples) * 68;
      const dist = Math.hypot(xBase - cx, y - cy);
      const ripple = Math.sin(dist * 0.35 - t * 3) * 1.2;
      const dip = (wellDepth / (1 + Math.pow(dist / sigma, 2))) * Math.cos((dist / sigma) * 0.4) + ripple;
      const xDistorted = xBase + ((cx - xBase) / 40) * dip * 0.5;
      pts.push(`${clamp(xDistorted, 10, 90).toFixed(1)},${clamp(y + dip, 10, 90).toFixed(1)}`);
    }

    const isCenterLine = gx === Math.floor(gridLines / 2);
    paths.push({
      d: `M ${pts.join(' L ')}`,
      stroke: isCenterLine ? accent : 'rgba(255, 255, 255, 0.22)',
      strokeWidth: isCenterLine ? 1.4 : 0.8,
      fill: 'none',
      opacity: isCenterLine ? 0.9 : 0.45,
    });
  }

  // Orbiting mass in the gravity well (Active animated particle)
  const orbitR = 20;
  const orbitAngle = t * 2.0;
  const ox = cx + orbitR * Math.cos(orbitAngle);
  const oy = cy + (orbitR * 0.6) * Math.sin(orbitAngle) + 6;

  particles.push({
    cx: clamp(ox, 8, 92),
    cy: clamp(oy, 8, 92),
    r: 2.8,
    fill: secondary,
    opacity: 0.95,
  });

  // Massive central gravitational singularity
  particles.push({
    cx,
    cy: cy + wellDepth * 0.75,
    r: 4.5 + 0.5 * Math.sin(t * 3),
    fill: accent,
    opacity: 0.95,
  });

  return { paths, particles };
};

export const SpacetimeGridModule: FormulaModule = {
  id: 'spacetime-grid',
  name: 'Lưới Không-Thời Gian',
  category: 'cosmos',
  description: 'Einstein gravity well grid deformation',
  compute: computeSpacetimeGrid,
};
