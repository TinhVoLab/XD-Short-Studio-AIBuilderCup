import { FormulaFrame, FormulaModule, FormulaPath, FormulaParticle } from '../../types';
import { clamp } from '../mathUtils';

const computeStreamlineFlow = (
  t: number,
  accent: string,
  secondary: string
): FormulaFrame => {
  const paths: FormulaPath[] = [];
  const particles: FormulaParticle[] = [];

  const cx = 50;
  const cy = 50;
  const obstacleR = 12;

  // 7 horizontal streamlines distorted around a circular cylinder
  const streamlineOffsets = [-24, -16, -8, 0, 8, 16, 24];
  const steps = 40;

  streamlineOffsets.forEach((yOff, idx) => {
    const isCenter = Math.abs(yOff) <= 8;
    const pts: string[] = [];

    for (let s = 0; s <= steps; s++) {
      const x = 12 + (s / steps) * 76;
      const dx = x - cx;
      const r = Math.hypot(dx, yOff);

      // Potential flow deflection around cylinder:
      // vy = - U * R^2 * 2xy / r^4
      let dy = yOff;
      if (r > obstacleR) {
        const factor = (obstacleR * obstacleR) / (r * r);
        dy = yOff * (1 - factor * 0.7);
      } else if (yOff === 0) {
        // Split center streamline above and below
        dy = (s / steps < 0.5 ? -1 : 1) * (obstacleR + 1.5);
      }

      const y = cy + dy;
      pts.push(`${x.toFixed(1)},${clamp(y, 10, 90).toFixed(1)}`);
    }

    paths.push({
      d: `M ${pts.join(' L ')}`,
      stroke: isCenter ? accent : 'rgba(255, 255, 255, 0.22)',
      strokeWidth: isCenter ? 1.6 : 0.9,
      fill: 'none',
      opacity: isCenter ? 0.95 : 0.45,
    });

    // Flow tracer particles traveling along streamlines
    const flowProgress = ((t * 1.2 + idx * 0.18) % 1);
    const px = 12 + flowProgress * 76;
    const dx = px - cx;
    const r = Math.hypot(dx, yOff);
    let pdy = yOff;
    if (r > obstacleR) {
      const factor = (obstacleR * obstacleR) / (r * r);
      pdy = yOff * (1 - factor * 0.7);
    } else if (yOff === 0) {
      pdy = -obstacleR - 1.5;
    }
    const py = cy + pdy;

    particles.push({
      cx: px,
      cy: clamp(py, 10, 90),
      r: 2.0,
      fill: secondary,
      opacity: 0.85,
    });
  });

  // Central obstacle airfoil / cylinder
  paths.push({
    d: `M 50 38 A 12 12 0 1 1 50 62 A 12 12 0 1 1 50 38`,
    stroke: accent,
    strokeWidth: 2.0,
    fill: 'rgba(255, 255, 255, 0.05)',
    opacity: 0.95,
  });

  particles.push({
    cx,
    cy,
    r: 3.2,
    fill: accent,
    opacity: 1.0,
  });

  return { paths, particles };
};

export const StreamlineFlowModule: FormulaModule = {
  id: 'streamline-flow',
  name: 'Dòng Chảy Khí Động Học',
  category: 'vitality',
  description: 'Bernoulli streamlines wrapping around an obstacle',
  compute: computeStreamlineFlow,
};
