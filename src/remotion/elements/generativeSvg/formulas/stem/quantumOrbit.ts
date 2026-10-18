import { FormulaFrame, FormulaModule, FormulaPath, FormulaParticle } from '../../types';
import { clamp } from '../mathUtils';

const computeQuantumOrbit = (
  t: number,
  accent: string,
  secondary: string
): FormulaFrame => {
  const paths: FormulaPath[] = [];
  const particles: FormulaParticle[] = [];

  const cx = 50;
  const cy = 50;

  // 3 orbital rings tilted at angles 0°, 60°, 120°
  const tilts = [0, Math.PI / 3, (2 * Math.PI) / 3];
  const radiiX = [38, 36, 38];
  const radiiY = [14, 13, 14];

  tilts.forEach((tiltAngle, i) => {
    const rx = radiiX[i];
    const ry = radiiY[i];
    const cosTilt = Math.cos(tiltAngle);
    const sinTilt = Math.sin(tiltAngle);

    // Build ellipse path rotated by tiltAngle
    const steps = 48;
    const pts: string[] = [];
    for (let s = 0; s <= steps; s++) {
      const theta = (s / steps) * Math.PI * 2;
      const ex = rx * Math.cos(theta);
      const ey = ry * Math.sin(theta);
      const x = cx + ex * cosTilt - ey * sinTilt;
      const y = cy + ex * sinTilt + ey * cosTilt;
      pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
    }

    paths.push({
      d: `M ${pts.join(' L ')} Z`,
      stroke: i === 0 ? accent : 'rgba(255, 255, 255, 0.22)',
      strokeWidth: i === 0 ? 1.8 : 1.0,
      fill: 'none',
      opacity: i === 0 ? 0.95 : 0.45,
    });

    // Orbiting electron particle
    const speed = 2.2 + i * 0.7;
    const electronTheta = t * speed + (i * Math.PI * 2) / 3;
    const elX = rx * Math.cos(electronTheta);
    const elY = ry * Math.sin(electronTheta);
    const px = cx + elX * cosTilt - elY * sinTilt;
    const py = cy + elX * sinTilt + elY * cosTilt;

    particles.push({
      cx: clamp(px, 6, 94),
      cy: clamp(py, 6, 94),
      r: i === 0 ? 2.8 : 2.2,
      fill: i === 0 ? accent : secondary,
      opacity: 0.9,
    });
  });

  // Central atomic nucleus (pulsing)
  const nucleusPulse = 3.5 + 0.6 * Math.sin(t * 4);
  particles.push({
    cx,
    cy,
    r: nucleusPulse,
    fill: accent,
    opacity: 0.95,
  });

  return { paths, particles };
};

export const QuantumOrbitModule: FormulaModule = {
  id: 'quantum-orbit',
  name: 'Quỹ Đạo Lượng Tử',
  category: 'stem',
  description: '3 orbital rings with electrons circling atomic nucleus',
  compute: computeQuantumOrbit,
};
