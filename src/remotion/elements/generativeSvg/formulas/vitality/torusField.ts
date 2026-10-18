import { FormulaFrame, FormulaModule, FormulaPath, FormulaParticle } from '../../types';
import { clamp } from '../mathUtils';

const computeTorusField = (
  t: number,
  accent: string,
  secondary: string
): FormulaFrame => {
  const paths: FormulaPath[] = [];
  const particles: FormulaParticle[] = [];

  const cx = 50;
  const cy = 50;
  const majorR = 26; // Distance from center to tube center
  const minorR = 12; // Radius of tube

  // 1. Torus outer and inner boundary projection circles
  paths.push({
    d: `M ${cx} ${cy - (majorR + minorR)} A ${majorR + minorR} ${(majorR + minorR) * 0.6} 0 1 1 ${cx} ${cy + (majorR + minorR)} A ${majorR + minorR} ${(majorR + minorR) * 0.6} 0 1 1 ${cx} ${cy - (majorR + minorR)}`,
    stroke: 'rgba(255, 255, 255, 0.2)',
    strokeWidth: 1.0,
    fill: 'none',
    opacity: 0.5,
  });

  paths.push({
    d: `M ${cx} ${cy - (majorR - minorR)} A ${majorR - minorR} ${(majorR - minorR) * 0.6} 0 1 1 ${cx} ${cy + (majorR - minorR)} A ${majorR - minorR} ${(majorR - minorR) * 0.6} 0 1 1 ${cx} ${cy - (majorR - minorR)}`,
    stroke: 'rgba(255, 255, 255, 0.2)',
    strokeWidth: 1.0,
    fill: 'none',
    opacity: 0.5,
  });

  // 2. Helical magnetic field lines winding around the torus
  // Parameter u along ring [0, 2pi], v winding around tube = q * u
  const lineCount = 3;
  const steps = 72;
  const q = 4; // safety factor (winds 4 times per revolution)

  for (let l = 0; l < lineCount; l++) {
    const lOffset = (l * Math.PI * 2) / lineCount;
    const pts: string[] = [];

    for (let s = 0; s <= steps; s++) {
      const u = (s / steps) * Math.PI * 2;
      const v = q * u + lOffset - t * 2.5;

      // 3D torus coordinates:
      // x = (R + r * cos(v)) * cos(u)
      // y = (R + r * cos(v)) * sin(u)
      // z = r * sin(v)
      const rTube = majorR + minorR * Math.cos(v);
      const x3d = rTube * Math.cos(u);
      const y3d = rTube * Math.sin(u);
      const z3d = minorR * Math.sin(v);

      // Isometric tilt
      const px = cx + x3d;
      const py = cy + y3d * 0.6 - z3d * 0.5;

      pts.push(`${clamp(px, 6, 94).toFixed(1)},${clamp(py, 6, 94).toFixed(1)}`);
    }

    paths.push({
      d: `M ${pts.join(' L ')} Z`,
      stroke: l === 0 ? accent : secondary,
      strokeWidth: l === 0 ? 1.8 : 1.2,
      fill: 'none',
      opacity: l === 0 ? 0.95 : 0.7,
    });
  }

  // Plasma energy packets moving along magnetic field
  for (let k = 0; k < 4; k++) {
    const u = ((t * 0.8 + k * 0.25) % 1) * Math.PI * 2;
    const v = q * u - t * 2.5;
    const rTube = majorR + minorR * Math.cos(v);
    const px = cx + rTube * Math.cos(u);
    const py = cy + rTube * Math.sin(u) * 0.6 - (minorR * Math.sin(v)) * 0.5;

    particles.push({
      cx: clamp(px, 8, 92),
      cy: clamp(py, 8, 92),
      r: 2.5,
      fill: accent,
      opacity: 0.95,
    });
  }

  return { paths, particles };
};

export const TorusFieldModule: FormulaModule = {
  id: 'torus-field',
  name: 'Trường Từ Hình Xuyến',
  category: 'vitality',
  description: 'Donut-shaped magnetic field spinning intrinsically',
  compute: computeTorusField,
};
