import { FormulaFrame, FormulaModule, FormulaPath, FormulaParticle } from '../../types';
import { clamp, lerp } from '../mathUtils';

const computeNetworkMesh = (
  t: number,
  accent: string,
  secondary: string
): FormulaFrame => {
  const paths: FormulaPath[] = [];
  const particles: FormulaParticle[] = [];

  // Base node positions (organic constellation)
  const baseNodes = [
    { x: 50, y: 50 },
    { x: 30, y: 28 },
    { x: 70, y: 24 },
    { x: 80, y: 56 },
    { x: 64, y: 80 },
    { x: 34, y: 76 },
    { x: 20, y: 48 },
  ];

  // Adjacency edges (pairs of node indices)
  const edges: [number, number][] = [
    [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6],
    [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 1],
  ];

  // Animate node slight floating movement
  const nodes = baseNodes.map((n, i) => {
    const dx = Math.sin(t * 1.5 + i * 1.1) * 3.0;
    const dy = Math.cos(t * 1.8 + i * 0.9) * 3.0;
    return {
      x: clamp(n.x + dx, 12, 88),
      y: clamp(n.y + dy, 12, 88),
    };
  });

  // Render edges
  edges.forEach(([fromIdx, toIdx], edgeIdx) => {
    const from = nodes[fromIdx];
    const to = nodes[toIdx];
    const isCentral = fromIdx === 0 || toIdx === 0;

    paths.push({
      d: `M ${from.x.toFixed(1)} ${from.y.toFixed(1)} L ${to.x.toFixed(1)} ${to.y.toFixed(1)}`,
      stroke: isCentral ? accent : 'rgba(255, 255, 255, 0.2)',
      strokeWidth: isCentral ? 1.4 : 0.8,
      fill: 'none',
      opacity: isCentral ? 0.8 : 0.4,
    });

    // Data packet traversing this edge
    if (edgeIdx % 2 === 0) {
      const packetT = ((t * 1.2 + edgeIdx * 0.2) % 1);
      const px = lerp(from.x, to.x, packetT);
      const py = lerp(from.y, to.y, packetT);
      particles.push({
        cx: px,
        cy: py,
        r: 1.8,
        fill: secondary,
        opacity: 0.85,
      });
    }
  });

  // Render nodes
  nodes.forEach((n, i) => {
    const isCenter = i === 0;
    particles.push({
      cx: n.x,
      cy: n.y,
      r: isCenter ? 4.2 : 2.6,
      fill: isCenter ? accent : secondary,
      opacity: isCenter ? 0.95 : 0.85,
    });
  });

  return { paths, particles };
};

export const NetworkMeshModule: FormulaModule = {
  id: 'network-mesh',
  name: 'Mạng Lưới Chéo',
  category: 'strategy',
  description: 'Small-World Topology with data pulses',
  compute: computeNetworkMesh,
};
