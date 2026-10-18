import { FormulaFrame, FormulaModule, FormulaPath, FormulaParticle } from '../../types';

const computeNeuralPulse = (
  t: number,
  accent: string,
  secondary: string
): FormulaFrame => {
  const paths: FormulaPath[] = [];
  const particles: FormulaParticle[] = [];

  const cx = 50;
  const cy = 50;

  const branchCount = 6;
  for (let b = 0; b < branchCount; b++) {
    const baseAngle = (b / branchCount) * Math.PI * 2;
    const length = 34;
    const bend = 6 * Math.sin(baseAngle * 2 + t * 2);

    const midX = cx + (length * 0.5) * Math.cos(baseAngle) - bend * Math.sin(baseAngle);
    const midY = cy + (length * 0.5) * Math.sin(baseAngle) + bend * Math.cos(baseAngle);
    const endX = cx + length * Math.cos(baseAngle);
    const endY = cy + length * Math.sin(baseAngle);

    paths.push({
      d: `M ${cx} ${cy} Q ${midX.toFixed(1)} ${midY.toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}`,
      stroke: 'rgba(255, 255, 255, 0.2)',
      strokeWidth: 1.0,
      fill: 'none',
      opacity: 0.6,
    });

    particles.push({
      cx: endX,
      cy: endY,
      r: 2.2,
      fill: secondary,
      opacity: 0.8,
    });

    const packetProgress = ((t * 1.6 + b * 0.25) % 1);
    const p1MinusT = 1 - packetProgress;
    const px = p1MinusT * p1MinusT * cx + 2 * p1MinusT * packetProgress * midX + packetProgress * packetProgress * endX;
    const py = p1MinusT * p1MinusT * cy + 2 * p1MinusT * packetProgress * midY + packetProgress * packetProgress * endY;

    particles.push({
      cx: px,
      cy: py,
      r: 2.6,
      fill: accent,
      opacity: 0.95,
    });
  }

  const somaRadius = 4.5 + 0.8 * Math.sin(t * 5);
  particles.push({
    cx,
    cy,
    r: somaRadius,
    fill: accent,
    opacity: 0.95,
  });

  return { paths, particles };
};

export const NeuralPulseModule: FormulaModule = {
  id: 'neural-pulse',
  name: 'Xung Thần Kinh',
  category: 'strategy',
  description: 'Axon action potential signals traversing neural network',
  compute: computeNeuralPulse,
};
