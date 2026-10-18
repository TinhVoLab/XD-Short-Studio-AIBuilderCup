import { HAND_DRAWN_CATALOG } from '../src/config/handDrawnCatalog.ts';
import { VisualDNA } from '../src/types/visualDna.ts';

export function calculateDnaDistance(target: VisualDNA, candidate: VisualDNA): number {
  const primaryDim = target.primaryDimension || 'form';

  const formDiff = target.form === candidate.form ? 0 : 1;
  const motionDiff = target.motion === candidate.motion ? 0 : 1;
  const energyDiff = Math.abs(target.energy - candidate.energy);
  const valenceDiff = target.valence === candidate.valence ? 0 : 1;

  let totalDist = 0;

  // Trọng số 3.0 cho primaryDimension, 1.0 cho các chiều còn lại
  totalDist += (primaryDim === 'form' ? 3.0 : 1.0) * formDiff;
  totalDist += (primaryDim === 'motion' ? 3.0 : 1.0) * motionDiff;
  totalDist += (primaryDim === 'energy' ? 3.0 : 1.0) * energyDiff;
  totalDist += (primaryDim === 'valence' ? 3.0 : 1.0) * valenceDiff;

  return totalDist;
}

function runCalibration() {
  console.log(`\n=== CALIBRATING VISUAL DNA DISTANCE THRESHOLD ===`);
  console.log(`Catalog size: ${HAND_DRAWN_CATALOG.length} items`);

  const distances: number[] = [];

  for (let i = 0; i < HAND_DRAWN_CATALOG.length; i++) {
    for (let j = 0; j < HAND_DRAWN_CATALOG.length; j++) {
      if (i === j) continue;
      const d = calculateDnaDistance(HAND_DRAWN_CATALOG[i].dna, HAND_DRAWN_CATALOG[j].dna);
      distances.push(d);
    }
  }

  distances.sort((a, b) => a - b);
  const totalPairs = distances.length;

  const p = (pct: number) => distances[Math.floor(totalPairs * (pct / 100))];

  console.log(`Total query-candidate pairs: ${totalPairs}`);
  console.log(`Min distance: ${distances[0].toFixed(2)}`);
  console.log(`p25 distance: ${p(25).toFixed(2)}`);
  console.log(`p50 (median): ${p(50).toFixed(2)}`);
  console.log(`p75 distance: ${p(75).toFixed(2)}`);
  console.log(`p85 distance: ${p(85).toFixed(2)}`);
  console.log(`p90 distance: ${p(90).toFixed(2)}`);
  console.log(`Max distance: ${distances[distances.length - 1].toFixed(2)}`);

  console.log(`\n=> Recommended MATCH_THRESHOLD (tau): ${p(85).toFixed(2)}`);
  console.log(`   (At tau = 2.2, assets with matched primary dimension + 1-2 matched auxiliary attributes will qualify)`);
}

runCalibration();
