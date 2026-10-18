import { FormulaFrame, FormulaModule, FormulaPath, FormulaParticle } from '../../types';
import { clamp } from '../mathUtils';

const computeBifurcationTree = (
  t: number,
  accent: string,
  secondary: string
): FormulaFrame => {
  const paths: FormulaPath[] = [];
  const particles: FormulaParticle[] = [];

  // Recursive tree generation (deterministic 3 levels: 1 -> 2 -> 4 -> 8)
  interface Branch {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    depth: number;
  }

  const branches: Branch[] = [];

  function buildBranches(x: number, y: number, length: number, angle: number, depth: number) {
    if (depth > 3) return;
    const sway = Math.sin(t * 2 + depth) * 0.08;
    const effectiveAngle = angle + sway;
    const x2 = x + length * Math.sin(effectiveAngle);
    const y2 = y - length * Math.cos(effectiveAngle);

    branches.push({ x1: x, y1: y, x2, y2, depth });

    const nextLen = length * 0.72;
    const spread = 0.55 + 0.05 * Math.sin(t * 1.5);
    buildBranches(x2, y2, nextLen, effectiveAngle - spread, depth + 1);
    buildBranches(x2, y2, nextLen, effectiveAngle + spread, depth + 1);
  }

  // Root starting at bottom center
  buildBranches(50, 86, 22, 0, 0);

  branches.forEach(b => {
    const isRoot = b.depth === 0;
    const isLeaf = b.depth === 3;
    const strokeW = Math.max(0.8, 2.4 - b.depth * 0.5);

    paths.push({
      d: `M ${b.x1.toFixed(1)} ${b.y1.toFixed(1)} L ${b.x2.toFixed(1)} ${b.y2.toFixed(1)}`,
      stroke: isRoot || isLeaf ? accent : 'rgba(255, 255, 255, 0.4)',
      strokeWidth: strokeW,
      fill: 'none',
      opacity: 0.95 - b.depth * 0.15,
    });

    if (isLeaf) {
      particles.push({
        cx: clamp(b.x2, 8, 92),
        cy: clamp(b.y2, 8, 92),
        r: 2.2,
        fill: secondary,
        opacity: 0.85,
      });
    }
  });

  // Decision origin node
  particles.push({
    cx: 50,
    cy: 86,
    r: 3.8,
    fill: accent,
    opacity: 0.95,
  });

  return { paths, particles };
};

export const BifurcationTreeModule: FormulaModule = {
  id: 'bifurcation-tree',
  name: 'Cây Phân Nhánh',
  category: 'strategy',
  description: 'Continuous bifurcation tree representing decisions',
  compute: computeBifurcationTree,
};
