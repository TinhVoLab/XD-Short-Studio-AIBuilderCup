import { HAND_DRAWN_CATALOG, HandDrawnPathItem } from '../config/handDrawnCatalog.ts';
import { VisualDNA, MatchExplanation, SceneDirection } from '../types/visualDna.ts';
import { generateParametricDoodle, saveDoodleDraft, ParametricDoodleResult } from '../utils/parametricDoodleGenerator.ts';
import type { Scene, SceneElement } from '../types/scene.ts';

// ── SSOT CONSTANTS ───────────────────────────────────────────────────────────
export const MATCH_THRESHOLD = 2.20; // Ngưỡng bắt buộc khớp primaryDimension
export const RECENCY_DECAY = 0.65;   // Hệ số suy giảm phạt diversity theo khoảng cách cảnh

export interface MatchCandidate {
  asset: HandDrawnPathItem;
  dnaDistance: number;
  semanticScore: number;
  baseScore: number;
  diversityPenalty: number;
  finalScore: number;
}

export interface MatchResolution {
  element: SceneElement;
  explanation: MatchExplanation;
  isSynthesized: boolean;
}

/**
 * Chuẩn hóa tiếng Việt: lowercase, loại bỏ dấu thanh, tách thành danh sách từ đơn
 */
export function normalizeVietnameseText(text: string): string[] {
  if (!text) return [];
  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();

  return normalized.split(/\s+/).filter((w) => w.length > 1);
}

/**
 * Tính điểm tương đồng Jaccard giữa hai chuỗi văn bản (Unaccented Token Overlap)
 */
export function calculateJaccardSimilarity(textA: string, textB: string): number {
  const tokensA = new Set(normalizeVietnameseText(textA));
  const tokensB = new Set(normalizeVietnameseText(textB));

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) {
      intersection++;
    }
  }

  const union = tokensA.size + tokensB.size - intersection;
  return union > 0 ? Number((intersection / union).toFixed(3)) : 0;
}

/**
 * Tầng 1: Tính khoảng cách Visual DNA có trọng số động (Weighted Metric Distance)
 */
export function calculateDnaDistance(target: VisualDNA, candidate: VisualDNA): number {
  const primaryDim = target.primaryDimension || 'form';

  const formDiff = target.form === candidate.form ? 0 : 1;
  const motionDiff = target.motion === candidate.motion ? 0 : 1;
  const targetEnergy = Number.isFinite(target.energy) ? target.energy : (parseFloat(String(target.energy)) || 0.5);
  const candidateEnergy = Number.isFinite(candidate.energy) ? candidate.energy : 0.5;
  const energyDiff = Math.abs(targetEnergy - candidateEnergy);
  const valenceDiff = target.valence === candidate.valence ? 0 : 1;

  let totalDist = 0;
  totalDist += (primaryDim === 'form' ? 3.0 : 1.0) * formDiff;
  totalDist += (primaryDim === 'motion' ? 3.0 : 1.0) * motionDiff;
  totalDist += (primaryDim === 'energy' ? 3.0 : 1.0) * energyDiff;
  totalDist += (primaryDim === 'valence' ? 3.0 : 1.0) * valenceDiff;

  return Number(totalDist.toFixed(3));
}

/**
 * Đo độ tương đồng thẩm mỹ giữa 2 asset phục vụ phạt đa dạng toàn cục (DPP Similarity)
 */
export function calculateVisualSimilarity(a: VisualDNA, b: VisualDNA): number {
  const formSim = a.form === b.form ? 0.5 : 0;
  const motionSim = a.motion === b.motion ? 0.3 : 0;
  const energyA = Number.isFinite(a.energy) ? a.energy : 0.5;
  const energyB = Number.isFinite(b.energy) ? b.energy : 0.5;
  const energySim = (1 - Math.abs(energyA - energyB)) * 0.2;
  return Number((formSim + motionSim + energySim).toFixed(3));
}

/**
 * Tính Diversity Penalty có tích hợp Adaptive Lambda và Exponential Recency Decay
 */
export function calculateDiversityPenalty(
  candidateDna: VisualDNA,
  previousDnas: VisualDNA[],
  totalScenes: number
): number {
  if (previousDnas.length === 0) return 0;

  // Adaptive Lambda theo độ dài video: 5 cảnh -> 0.30, 10 cảnh -> 0.40
  const lambda = 0.2 + 0.2 * Math.min(totalScenes / 10, 1.0);

  let totalPenalty = 0;
  const currIdx = previousDnas.length;

  for (let j = 0; j < previousDnas.length; j++) {
    const prevDna = previousDnas[j];
    const distanceToPrev = currIdx - j; // 1: liền kề, 2: cách 1 cảnh...
    const recencyWeight = Math.pow(RECENCY_DECAY, distanceToPrev - 1);
    const sim = calculateVisualSimilarity(candidateDna, prevDna);

    totalPenalty += recencyWeight * sim;
  }

  return Number((lambda * totalPenalty).toFixed(3));
}

/**
 * Master Matching: Tìm asset doodle phù hợp nhất cho 1 ẩn dụ thị giác trong bối cảnh toàn video
 */
export function matchMetaphor(
  visualMetaphor: string,
  targetDna: VisualDNA,
  previousAssignedDnas: VisualDNA[],
  sceneIndex: number,
  totalScenes: number
): MatchResolution {
  // 1. TẦNG 1: Coarse Retrieval — Tính khoảng cách trên toàn bộ Catalog
  const candidatesWithDist = HAND_DRAWN_CATALOG.map((item) => ({
    asset: item,
    dist: calculateDnaDistance(targetDna, item.dna),
  }));

  // Sắp xếp tăng dần theo khoảng cách và lấy Top-5
  candidatesWithDist.sort((a, b) => a.dist - b.dist);
  const top5 = candidatesWithDist.slice(0, 5);

  const bestDist = top5[0]?.dist ?? 999;

  // FALLBACK CHECK: Nếu ngay cả candidate tốt nhất cũng vượt ngưỡng tau = 2.2
  // => Catalog không thể thỏa mãn yêu cầu cốt lõi -> Sinh nét vẽ tham số
  if (bestDist > MATCH_THRESHOLD) {
    const synthetic = generateParametricDoodle(targetDna);

    // Bắn lưu draft không chặn luồng
    saveDoodleDraft(synthetic, visualMetaphor);

    const explanation: MatchExplanation = {
      selectedAssetId: synthetic.id,
      selectedAssetName: synthetic.name,
      initialRank: 1,
      finalRank: 1,
      dnaDistance: bestDist,
      semanticScore: 0,
      diversityPenalty: 0,
      reason: `Khoảng cách catalog tốt nhất (${bestDist.toFixed(2)}) vượt ngưỡng ${MATCH_THRESHOLD} -> Tự động sinh nét vẽ tham số (${synthetic.name})`,
    };

    const element: SceneElement = {
      id: `el-${synthetic.id}`,
      type: 'hand-drawn',
      left: 180,
      top: 320,
      width: synthetic.defaultWidth,
      height: synthetic.defaultHeight,
      scaleX: 1,
      scaleY: 1,
      angle: 0,
      opacity: 1,
      strokeWidth: synthetic.defaultStrokeWidth,
      color: synthetic.defaultColor,
      svgContent: synthetic.pathD,
      viewBox: synthetic.viewBox,
      fillRule: 'nonzero',
    };

    return { element, explanation, isSynthesized: true };
  }

  // 2. TẦNG 2 & 3: Semantic Rerank & Global Diversity Penalty
  const scoredCandidates: MatchCandidate[] = top5.map((c, initialRank) => {
    const candidateText = `${c.asset.name} ${c.asset.description} ${c.asset.tags.join(' ')}`;
    const semScore = calculateJaccardSimilarity(visualMetaphor, candidateText);

    // Điểm cơ bản kết hợp Metric Distance và Semantic Score
    const baseScore = (1 - c.dist / 6.0) * 0.6 + semScore * 0.4;

    // Phạt lặp motif theo bối cảnh toàn video
    const diversityPenalty = calculateDiversityPenalty(c.asset.dna, previousAssignedDnas, totalScenes);

    const finalScore = Number((baseScore - diversityPenalty).toFixed(3));

    return {
      asset: c.asset,
      dnaDistance: c.dist,
      semanticScore: semScore,
      baseScore: Number(baseScore.toFixed(3)),
      diversityPenalty,
      finalScore,
    };
  });

  // Sắp xếp giảm dần theo điểm số cuối cùng
  scoredCandidates.sort((a, b) => b.finalScore - a.finalScore);
  const best = scoredCandidates[0];

  const initialRank = top5.findIndex((t) => t.asset.id === best.asset.id) + 1;

  let reason = `Khớp chính xác hình tượng (${best.asset.name}) với DNA distance ${best.dnaDistance.toFixed(2)}`;
  if (best.diversityPenalty > 0) {
    reason += `, bị trừ ${best.diversityPenalty.toFixed(2)} điểm diversity để tránh lặp motif cảnh trước`;
  }
  if (initialRank > 1) {
    reason += ` (thăng hạng từ vị trí ${initialRank} lên 1 nhờ điểm ngữ nghĩa và tính đa dạng)`;
  }

  const explanation: MatchExplanation = {
    selectedAssetId: best.asset.id,
    selectedAssetName: best.asset.name,
    initialRank,
    finalRank: 1,
    dnaDistance: best.dnaDistance,
    semanticScore: best.semanticScore,
    diversityPenalty: best.diversityPenalty,
    reason,
  };

  const element: SceneElement = {
    id: `el-${best.asset.id}-${sceneIndex}`,
    type: 'hand-drawn',
    left: 180,
    top: 320,
    width: best.asset.defaultWidth,
    height: best.asset.defaultHeight,
    scaleX: 1,
    scaleY: 1,
    angle: 0,
    opacity: 1,
    strokeWidth: best.asset.defaultStrokeWidth,
    color: best.asset.defaultColor,
    svgContent: best.asset.pathD,
    secondarySvgContent: best.asset.secondaryPathD,
    viewBox: best.asset.viewBox,
    fillRule: best.asset.fillRule || 'nonzero',
  };

  return { element, explanation, isSynthesized: false };
}

/**
 * Pipeline Toàn Cục: Phân giải doodle cho toàn bộ các cảnh trong một video kịch bản
 */
export function assignGlobalDoodles(scenes: Scene[]): Scene[] {
  const previousDnas: VisualDNA[] = [];
  const totalScenes = scenes.length;

  return scenes.map((scene, idx) => {
    // Kiểm tra xem scene có chứa directive ẩn dụ thị giác hoặc layer hand-drawn cần tối ưu không
    const sceneDir = (scene as any).sceneDirection as SceneDirection | undefined;
    const visualMetaphor = sceneDir?.visualMetaphor || (scene as any).visualMetaphor || scene.name;
    const targetDna = sceneDir?.dna || (scene as any).dna;

    // Nếu không có thông tin DNA cụ thể thì giữ nguyên scene
    if (!targetDna) {
      return scene;
    }

    const { element, explanation, isSynthesized } = matchMetaphor(
      visualMetaphor,
      targetDna,
      previousDnas,
      idx + 1,
      totalScenes
    );

    // Lưu lại DNA của asset vừa gán vào lịch sử toàn cục
    const chosenDna = isSynthesized ? targetDna : (HAND_DRAWN_CATALOG.find((i) => i.id === explanation.selectedAssetId)?.dna || targetDna);
    previousDnas.push(chosenDna);

    // Thay thế hoặc thêm element hand-drawn vào danh sách elements của scene
    const existingElements = scene.elements ? [...scene.elements] : [];
    const handDrawnIdx = existingElements.findIndex((el) => el.type === 'hand-drawn');

    if (handDrawnIdx >= 0) {
      // Bảo tồn vị trí tùy chỉnh nếu user đã layout trước đó
      const old = existingElements[handDrawnIdx];
      existingElements[handDrawnIdx] = {
        ...element,
        left: old.left ?? element.left,
        top: old.top ?? element.top,
      };
    } else {
      existingElements.push(element);
    }

    return {
      ...scene,
      elements: existingElements,
      sceneDirection: {
        ...(sceneDir || { sceneId: scene.id, sceneIndex: idx + 1, visualMetaphor, dna: targetDna, needsNewAsset: false }),
        matchExplanation: explanation,
      },
    };
  });
}
