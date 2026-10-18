import { FormulaFrame, FormulaModule, FormulaPath, FormulaParticle } from '../../types';
import { clamp } from '../mathUtils';

const computeMobiusLoop = (
  t: number,
  accent: string,
  secondary: string
): FormulaFrame => {
  const paths: FormulaPath[] = [];
  const particles: FormulaParticle[] = [];

  const cx = 50;
  const cy = 50;
  const R = 28;
  const w = 9;
  const steps = 80;

  // Möbius strip parametric equations:
  // x = [R + v * cos(u/2)] * cos(u)
  // y = [R + v * cos(u/2)] * sin(u)
  // z = v * sin(u/2)
  // Rotated in 3D by t * 0.8 around Y axis, projected to 2D

  const edge1: string[] = [];
  const edge2: string[] = [];
  const centerLine: string[] = [];

  const rot = t * 0.8;
  const cosRot = Math.cos(rot);
  const sinRot = Math.sin(rot);

  for (let s = 0; s <= steps; s++) {
    const u = (s / steps) * Math.PI * 2;
    const cosHalfU = Math.cos(u / 2);
    const sinHalfU = Math.sin(u / 2);

    // Edge 1 (v = +w)
    const x3d_1 = (R + w * cosHalfU) * Math.cos(u);
    const y3d_1 = (R + w * cosHalfU) * Math.sin(u);
    const z3d_1 = w * sinHalfU;
    // Rotate around Y
    const px1 = cx + (x3d_1 * cosRot + z3d_1 * sinRot);
    const py1 = cy + y3d_1 * 0.7; // slight isometric tilt
    edge1.push(`${clamp(px1, 6, 94).toFixed(1)},${clamp(py1, 6, 94).toFixed(1)}`);

    // Edge 2 (v = -w)
    const x3d_2 = (R - w * cosHalfU) * Math.cos(u);
    const y3d_2 = (R - w * cosHalfU) * Math.sin(u);
    const z3d_2 = -w * sinHalfU;
    const px2 = cx + (x3d_2 * cosRot + z3d_2 * sinRot);
    const py2 = cy + y3d_2 * 0.7;
    edge2.push(`${clamp(px2, 6, 94).toFixed(1)},${clamp(py2, 6, 94).toFixed(1)}`);

    // Centerline (v = 0)
    const x3d_c = R * Math.cos(u);
    const y3d_c = R * Math.sin(u);
    const pxC = cx + x3d_c * cosRot;
    const pyC = cy + y3d_c * 0.7;
    centerLine.push(`${clamp(pxC, 6, 94).toFixed(1)},${clamp(pyC, 6, 94).toFixed(1)}`);
  }

  // Draw centerline
  paths.push({
    d: `M ${centerLine.join(' L ')} Z`,
    stroke: 'rgba(255, 255, 255, 0.25)',
    strokeWidth: 0.8,
    strokeDasharray: '3 2',
    fill: 'none',
    opacity: 0.5,
  });

  // Draw Outer Edge 1
  paths.push({
    d: `M ${edge1.join(' L ')} Z`,
    stroke: accent,
    strokeWidth: 1.8,
    fill: 'none',
    opacity: 0.95,
  });

  // Draw Inner Edge 2
  paths.push({
    d: `M ${edge2.join(' L ')} Z`,
    stroke: secondary,
    strokeWidth: 1.4,
    fill: 'none',
    opacity: 0.8,
  });

  // Traveling bead along the surface of the Mobius strip (takes 2 full revolutions to return to start)
  const beadU = (t * 1.4) % (Math.PI * 4);
  const beadCosHalfU = Math.cos(beadU / 2);
  const beadSinHalfU = Math.sin(beadU / 2);
  const beadV = w * 0.6 * Math.sin(beadU * 0.5);
  const beadX3D = (R + beadV * beadCosHalfU) * Math.cos(beadU);
  const beadY3D = (R + beadV * beadCosHalfU) * Math.sin(beadU);
  const beadZ3D = beadV * beadSinHalfU;

  const bpx = cx + (beadX3D * cosRot + beadZ3D * sinRot);
  const bpy = cy + beadY3D * 0.7;

  particles.push({
    cx: clamp(bpx, 8, 92),
    cy: clamp(bpy, 8, 92),
    r: 3.0,
    fill: accent,
    opacity: 1.0,
  });

  return { paths, particles };
};

export const MobiusLoopModule: FormulaModule = {
  id: 'mobius-loop',
  name: 'Dải Băng Möbius',
  category: 'cosmos',
  description: '3D one-sided surface rotating in space',
  compute: computeMobiusLoop,
};
