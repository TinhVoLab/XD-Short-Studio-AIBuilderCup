import { FormulaFrame, FormulaModule, FormulaPath, FormulaParticle } from '../../types';
import { clamp } from '../mathUtils';

const computeTesseractHypercube = (
  t: number,
  accent: string,
  secondary: string
): FormulaFrame => {
  const paths: FormulaPath[] = [];
  const particles: FormulaParticle[] = [];

  const cx = 50;
  const cy = 50;

  // 16 4D vertices (x, y, z, w) where each is ±1
  const vertices4D: [number, number, number, number][] = [];
  for (let x = -1; x <= 1; x += 2) {
    for (let y = -1; y <= 1; y += 2) {
      for (let z = -1; z <= 1; z += 2) {
        for (let w = -1; w <= 1; w += 2) {
          vertices4D.push([x, y, z, w]);
        }
      }
    }
  }

  // 4D Rotation in XW and YZ planes
  const θ = t * 0.9;
  const φ = t * 0.6;
  const cosθ = Math.cos(θ), sinθ = Math.sin(θ);
  const cosφ = Math.cos(φ), sinφ = Math.sin(φ);

  // Project 4D -> 3D -> 2D
  const projected2D = vertices4D.map(([x, y, z, w]) => {
    // Rotate in X-W plane
    const x1 = x * cosθ - w * sinθ;
    const w1 = x * sinθ + w * cosθ;

    // Rotate in Y-Z plane
    const y1 = y * cosφ - z * sinφ;
    const z1 = y * sinφ + z * cosφ;

    // Perspective projection 4D -> 3D (camera at w = 2.5)
    const d4 = 2.5;
    const scale4 = d4 / (d4 - w1);
    const x3 = x1 * scale4;
    const y3 = y1 * scale4;
    const z3 = z1 * scale4;

    // Perspective projection 3D -> 2D (camera at z = 3.5)
    const d3 = 3.5;
    const scale3 = d3 / (d3 - z3);
    const px = cx + x3 * scale3 * 12;
    const py = cy + y3 * scale3 * 12;

    return {
      x: clamp(px, 8, 92),
      y: clamp(py, 8, 92),
      w: w1,
    };
  });

  // 32 edges: connect vertices that differ by exactly 1 coordinate
  for (let i = 0; i < 16; i++) {
    for (let j = i + 1; j < 16; j++) {
      const v1 = vertices4D[i];
      const v2 = vertices4D[j];
      let diffCount = 0;
      for (let k = 0; k < 4; k++) {
        if (v1[k] !== v2[k]) diffCount++;
      }

      if (diffCount === 1) {
        const p1 = projected2D[i];
        const p2 = projected2D[j];
        // Distinguish inner cube vs outer cube by depth w
        const isOuter = p1.w + p2.w > 0;

        paths.push({
          d: `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} L ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`,
          stroke: isOuter ? accent : 'rgba(255, 255, 255, 0.25)',
          strokeWidth: isOuter ? 1.4 : 0.8,
          fill: 'none',
          opacity: isOuter ? 0.9 : 0.45,
        });
      }
    }
  }

  // Vertices particles
  projected2D.forEach((p, idx) => {
    particles.push({
      cx: p.x,
      cy: p.y,
      r: p.w > 0 ? 2.4 : 1.6,
      fill: idx % 2 === 0 ? accent : secondary,
      opacity: 0.85,
    });
  });

  return { paths, particles };
};

export const TesseractHypercubeModule: FormulaModule = {
  id: 'tesseract-hypercube',
  name: 'Khối 4D Tesseract',
  category: 'vitality',
  description: 'Hypercube isometric projection rotating in 4D space',
  compute: computeTesseractHypercube,
};
