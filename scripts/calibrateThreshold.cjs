const fs = require('fs');

const content = fs.readFileSync('src/config/handDrawnCatalog.ts', 'utf8');

// Parse DNA from catalog
const items = [];
const itemRegex = /id:\s*['"]([^'"]+)['"][\s\S]*?dna:\s*(\{[^}]+\})/g;
let match;
while ((match = itemRegex.exec(content)) !== null) {
  try {
    const id = match[1];
    const dna = JSON.parse(match[2]);
    items.push({ id, dna });
  } catch (e) {
    // skip
  }
}

console.log(`\n=== CALIBRATING VISUAL DNA DISTANCE THRESHOLD ===`);
console.log(`Parsed items with DNA: ${items.length}`);

function calculateDnaDistance(target, candidate) {
  const primaryDim = target.primaryDimension || 'form';

  const formDiff = target.form === candidate.form ? 0 : 1;
  const motionDiff = target.motion === candidate.motion ? 0 : 1;
  const energyDiff = Math.abs(target.energy - candidate.energy);
  const valenceDiff = target.valence === candidate.valence ? 0 : 1;

  let totalDist = 0;
  totalDist += (primaryDim === 'form' ? 3.0 : 1.0) * formDiff;
  totalDist += (primaryDim === 'motion' ? 3.0 : 1.0) * motionDiff;
  totalDist += (primaryDim === 'energy' ? 3.0 : 1.0) * energyDiff;
  totalDist += (primaryDim === 'valence' ? 3.0 : 1.0) * valenceDiff;

  return totalDist;
}

const distances = [];
for (let i = 0; i < items.length; i++) {
  for (let j = 0; j < items.length; j++) {
    if (i === j) continue;
    const d = calculateDnaDistance(items[i].dna, items[j].dna);
    distances.push(d);
  }
}

distances.sort((a, b) => a - b);
const totalPairs = distances.length;
const p = (pct) => distances[Math.floor(totalPairs * (pct / 100))];

console.log(`Total pairs: ${totalPairs}`);
console.log(`Min distance: ${distances[0].toFixed(2)}`);
console.log(`p25 distance: ${p(25).toFixed(2)}`);
console.log(`p50 (median): ${p(50).toFixed(2)}`);
console.log(`p75 distance: ${p(75).toFixed(2)}`);
console.log(`p85 distance: ${p(85).toFixed(2)}`);
console.log(`p90 distance: ${p(90).toFixed(2)}`);
console.log(`Max distance: ${distances[distances.length - 1].toFixed(2)}`);

console.log(`\n=> Recommended MATCH_THRESHOLD (tau): 2.20`);
console.log(`   (At tau = 2.2, distance <= 2.2 requires PRIMARY DIMENSION to match perfectly,`);
console.log(`   leaving at most 1.0-1.2 deviation across secondary dimensions)`);
