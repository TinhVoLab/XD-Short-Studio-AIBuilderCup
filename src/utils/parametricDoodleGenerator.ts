import { noise2D } from '@remotion/noise';
import { VisualDNA, FormArchetype } from '../types/visualDna.ts';

export interface ParametricDoodleResult {
  id: string;
  name: string;
  category: 'highlight' | 'arrows' | 'shapes' | 'marks';
  pathD: string;
  viewBox: string;
  defaultWidth: number;
  defaultHeight: number;
  defaultStrokeWidth: number;
  defaultColor: string;
  tags: string[];
  description: string;
  dna: VisualDNA;
  isSynthesized: true;
}

/**
 * Organic point jitter using Perlin/simplex noise
 */
function jitter(val: number, seed: string, step: number, amplitude: number): number {
  const n = noise2D(seed, step * 0.15, 0);
  return Number((val + n * amplitude).toFixed(2));
}

/**
 * 1. Archimedean Organic Spiral Generator
 */
export function generateSpiralDoodle(
  dna: VisualDNA,
  width: number = 160,
  height: number = 160
): ParametricDoodleResult {
  const cx = width / 2;
  const cy = height / 2;
  const turns = 2.5 + dna.energy * 1.5;
  const totalPoints = 36;
  const maxR = Math.min(cx, cy) * 0.85;
  const seed = `spiral_${Date.now()}`;
  const jitterAmp = 2.0 + (1 - dna.energy) * 3.0;

  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= totalPoints; i++) {
    const t = i / totalPoints;
    const angle = t * turns * 2 * Math.PI;
    const r = t * maxR;
    const rawX = cx + r * Math.cos(angle);
    const rawY = cy + r * Math.sin(angle);
    points.push({
      x: jitter(rawX, seed, i * 2, jitterAmp),
      y: jitter(rawY, seed, i * 2 + 1, jitterAmp),
    });
  }

  // Build smooth cubic bezier curve
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const mx = Number(((prev.x + curr.x) / 2).toFixed(2));
    const my = Number(((prev.y + curr.y) / 2).toFixed(2));
    d += ` Q ${prev.x} ${prev.y}, ${mx} ${my}`;
  }
  const last = points[points.length - 1];
  d += ` T ${last.x} ${last.y}`;

  return {
    id: `syn-spiral-${Date.now().toString(36)}`,
    name: 'Xoáy Ốc Tham Số Hóa',
    category: 'shapes',
    pathD: d,
    viewBox: `0 0 ${width} ${height}`,
    defaultWidth: width,
    defaultHeight: height,
    defaultStrokeWidth: 4.0,
    defaultColor: '#BEFF01',
    tags: ['spiral', 'xoắn ốc', 'vòng xoáy', 'chu kỳ', 'tiến hóa'],
    description: 'Nét xoắn ốc sinh tham số thích ứng với nhịp cảm xúc',
    dna,
    isSynthesized: true,
  };
}

/**
 * 2. Energy Burst / Spark Generator
 */
export function generateBurstDoodle(
  dna: VisualDNA,
  width: number = 180,
  height: number = 180
): ParametricDoodleResult {
  const cx = width / 2;
  const cy = height / 2;
  const numSpikes = Math.max(5, Math.floor(6 + dna.energy * 8));
  const innerR = 15 + (1 - dna.energy) * 15;
  const outerR = Math.min(cx, cy) * 0.9;
  const seed = `burst_${Date.now()}`;
  const jitterAmp = 3.5;

  const points: { x: number; y: number }[] = [];
  const totalSteps = numSpikes * 2;

  for (let i = 0; i < totalSteps; i++) {
    const angle = (i / totalSteps) * 2 * Math.PI - Math.PI / 2;
    const isPeak = i % 2 === 0;
    const r = isPeak ? outerR : innerR;
    const rawX = cx + r * Math.cos(angle);
    const rawY = cy + r * Math.sin(angle);
    points.push({
      x: jitter(rawX, seed, i, jitterAmp),
      y: jitter(rawY, seed, i + 50, jitterAmp),
    });
  }

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x} ${points[i].y}`;
  }
  d += ' Z';

  return {
    id: `syn-burst-${Date.now().toString(36)}`,
    name: 'Tia Nổ Năng Lượng Tham Số',
    category: 'marks',
    pathD: d,
    viewBox: `0 0 ${width} ${height}`,
    defaultWidth: width,
    defaultHeight: height,
    defaultStrokeWidth: 4.5,
    defaultColor: '#FFD700',
    tags: ['burst', 'tia nổ', 'đột phá', 'bừng sáng', 'vụt sáng'],
    description: 'Tia nổ tham số sinh tự động với độ lệch rung hữu cơ',
    dna,
    isSynthesized: true,
  };
}

/**
 * 3. Dynamic Wave Generator
 */
export function generateWaveDoodle(
  dna: VisualDNA,
  width: number = 240,
  height: number = 80
): ParametricDoodleResult {
  const cycles = Math.max(2, Math.floor(2 + dna.energy * 3));
  const amp = (height * 0.35) * (0.6 + dna.energy * 0.4);
  const midY = height / 2;
  const seed = `wave_${Date.now()}`;

  const stepX = width / (cycles * 2);
  let d = `M 10 ${midY}`;

  for (let i = 0; i < cycles; i++) {
    const cp1x = jitter(10 + (2 * i + 0.5) * stepX, seed, i * 4, 3);
    const cp1y = jitter(midY - amp, seed, i * 4 + 1, 2);
    const p1x = jitter(10 + (2 * i + 1.0) * stepX, seed, i * 4 + 2, 2);
    const p1y = jitter(midY, seed, i * 4 + 3, 2);

    const cp2x = jitter(10 + (2 * i + 1.5) * stepX, seed, i * 4 + 4, 3);
    const cp2y = jitter(midY + amp, seed, i * 4 + 5, 2);
    const p2x = jitter(10 + (2 * i + 2.0) * stepX, seed, i * 4 + 6, 2);
    const p2y = jitter(midY, seed, i * 4 + 7, 2);

    d += ` Q ${cp1x} ${cp1y}, ${p1x} ${p1y} Q ${cp2x} ${cp2y}, ${p2x} ${p2y}`;
  }

  return {
    id: `syn-wave-${Date.now().toString(36)}`,
    name: 'Sóng Dao Động Tham Số',
    category: 'highlight',
    pathD: d,
    viewBox: `0 0 ${width + 20} ${height}`,
    defaultWidth: width,
    defaultHeight: height,
    defaultStrokeWidth: 4.5,
    defaultColor: '#00D4FF',
    tags: ['wave', 'sóng', 'lượn sóng', 'dao động', 'nhịp điệu'],
    description: 'Nét lượn sóng tham số biểu thị sự biến chuyển mềm mại',
    dna,
    isSynthesized: true,
  };
}

/**
 * 4. Master Factory: Sinh doodle tham số theo Form Archetype
 */
export function generateParametricDoodle(
  dna: VisualDNA,
  width?: number,
  height?: number
): ParametricDoodleResult {
  switch (dna.form) {
    case 'spiral':
      return generateSpiralDoodle(dna, width || 160, height || 160);
    case 'burst':
      return generateBurstDoodle(dna, width || 180, height || 180);
    case 'wave':
    case 'line':
      return generateWaveDoodle(dna, width || 240, height || 80);
    case 'circle':
      return generateSpiralDoodle(dna, width || 150, height || 150);
    default:
      // Mặc định cho arrow hoặc các form khác: sinh burst hoặc wave năng động
      return dna.energy > 0.6
        ? generateBurstDoodle(dna, width || 160, height || 160)
        : generateWaveDoodle(dna, width || 220, height || 80);
  }
}

/**
 * 5. Data Flywheel: Lưu draft lên server bất đồng bộ (fire-and-forget)
 */
export async function saveDoodleDraft(
  draft: ParametricDoodleResult,
  visualMetaphor: string
): Promise<void> {
  try {
    if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
      await fetch('/api/doodle-drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draft,
          visualMetaphor,
          createdAt: new Date().toISOString(),
        }),
      });
    }
  } catch {
    // Silent fail để không ảnh hưởng luồng render người dùng
  }
}
