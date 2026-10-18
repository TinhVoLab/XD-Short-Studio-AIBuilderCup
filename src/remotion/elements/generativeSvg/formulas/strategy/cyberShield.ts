import { FormulaFrame, FormulaModule, FormulaPath, FormulaParticle } from '../../types';
import { clamp } from '../mathUtils';

const computeCyberShield = (
  t: number,
  accent: string,
  secondary: string
): FormulaFrame => {
  const paths: FormulaPath[] = [];
  const particles: FormulaParticle[] = [];

  const cx = 50;
  const cy = 50;

  // 3 concentric hexagonal rings
  const ringRadii = [18, 28, 38];

  ringRadii.forEach((rBase, idx) => {
    // Pulse animation
    const pulse = Math.sin(t * 3 + idx * 0.8) * 1.5;
    const r = rBase + pulse;
    const pts: string[] = [];

    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3 - Math.PI / 6;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      pts.push(`${clamp(x, 6, 94).toFixed(1)},${clamp(y, 6, 94).toFixed(1)}`);
    }

    paths.push({
      d: `M ${pts.join(' L ')} Z`,
      stroke: idx === 2 ? accent : 'rgba(255, 255, 255, 0.25)',
      strokeWidth: idx === 2 ? 1.8 : 1.0,
      fill: idx === 0 ? accent : 'none',
      opacity: idx === 0 ? 0.12 : (idx === 2 ? 0.95 : 0.4),
    });
  });

  // 6 radial spokes connecting inner and outer rings
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 - Math.PI / 6;
    const x1 = cx + 18 * Math.cos(angle);
    const y1 = cy + 18 * Math.sin(angle);
    const x2 = cx + 38 * Math.cos(angle);
    const y2 = cy + 38 * Math.sin(angle);

    paths.push({
      d: `M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}`,
      stroke: 'rgba(255, 255, 255, 0.2)',
      strokeWidth: 0.8,
      fill: 'none',
      opacity: 0.5,
    });

    // Outer vertex perimeter nodes
    particles.push({
      cx: clamp(x2, 6, 94),
      cy: clamp(y2, 6, 94),
      r: 2.2,
      fill: secondary,
      opacity: 0.85,
    });
  }

  // Rotating scanner node on outer perimeter
  const scanAngle = t * 2.5;
  const scanX = cx + 38 * Math.cos(scanAngle);
  const scanY = cy + 38 * Math.sin(scanAngle);

  particles.push({
    cx: clamp(scanX, 8, 92),
    cy: clamp(scanY, 8, 92),
    r: 3.2,
    fill: accent,
    opacity: 1.0,
  });

  // Central shield core
  const coreR = 3.0 + 0.6 * Math.sin(t * 5);
  particles.push({
    cx,
    cy,
    r: coreR,
    fill: accent,
    opacity: 0.95,
  });

  return { paths, particles };
};

export const CyberShieldModule: FormulaModule = {
  id: 'cyber-shield',
  name: 'Khiên Phòng Thủ',
  category: 'strategy',
  description: 'Hexagonal defensive shield pulsing with energy',
  compute: computeCyberShield,
};
