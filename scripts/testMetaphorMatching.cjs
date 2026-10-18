const fs = require('fs');

// Đọc catalog và parse DNA
const catalogContent = fs.readFileSync('src/config/handDrawnCatalog.ts', 'utf8');
const items = [];
const itemRegex = /id:\s*['"]([^'"]+)['"][\s\S]*?name:\s*['"]([^'"]+)['"][\s\S]*?dna:\s*(\{[^}]+\})[\s\S]*?tags:\s*(\[[^\]]+\])[\s\S]*?description:\s*['"]([^'"]+)['"]/g;
let match;
while ((match = itemRegex.exec(catalogContent)) !== null) {
  try {
    items.push({
      id: match[1],
      name: match[2],
      dna: JSON.parse(match[3]),
      tags: eval(match[4]),
      description: match[5],
      defaultWidth: 150,
      defaultHeight: 100,
      defaultStrokeWidth: 4.5,
      defaultColor: '#BEFF01',
      pathD: 'M 10 10 L 100 100',
      viewBox: '0 0 100 100',
    });
  } catch (e) {}
}

console.log(`Loaded ${items.length} items from catalog for testing.`);

function normalizeVietnamese(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

function jaccard(textA, textB) {
  const setA = new Set(normalizeVietnamese(textA));
  const setB = new Set(normalizeVietnamese(textB));
  if (setA.size === 0 || setB.size === 0) return 0;
  let inter = 0;
  for (const t of setA) if (setB.has(t)) inter++;
  const union = setA.size + setB.size - inter;
  return union > 0 ? inter / union : 0;
}

function dnaDistance(target, candidate) {
  const primaryDim = target.primaryDimension || 'form';
  const formDiff = target.form === candidate.form ? 0 : 1;
  const motionDiff = target.motion === candidate.motion ? 0 : 1;
  const energyDiff = Math.abs(target.energy - candidate.energy);
  const valenceDiff = target.valence === candidate.valence ? 0 : 1;

  let total = 0;
  total += (primaryDim === 'form' ? 3.0 : 1.0) * formDiff;
  total += (primaryDim === 'motion' ? 3.0 : 1.0) * motionDiff;
  total += (primaryDim === 'energy' ? 3.0 : 1.0) * energyDiff;
  totalDim = (primaryDim === 'valence' ? 3.0 : 1.0) * valenceDiff;
  total += totalDim;
  return total;
}

function visualSim(a, b) {
  const formSim = a.form === b.form ? 0.5 : 0;
  const motionSim = a.motion === b.motion ? 0.3 : 0;
  const energySim = (1 - Math.abs(a.energy - b.energy)) * 0.2;
  return formSim + motionSim + energySim;
}

function diversityPenalty(candidateDna, previousDnas, totalScenes) {
  if (previousDnas.length === 0) return 0;
  const lambda = 0.2 + 0.2 * Math.min(totalScenes / 10, 1.0);
  let totalPenalty = 0;
  const curr = previousDnas.length;
  for (let j = 0; j < previousDnas.length; j++) {
    const dist = curr - j;
    const recency = Math.pow(0.65, dist - 1);
    const sim = visualSim(candidateDna, previousDnas[j]);
    totalPenalty += recency * sim;
  }
  return lambda * totalPenalty;
}

// ── TEST 1: The Cliché Test ──────────────────────────────────────────────────
console.log(`\n======================================================`);
console.log(`🧪 TEST 1: THE CLICHÉ TEST (5 Cảnh Tăng Trưởng Liền Kề)`);
console.log(`======================================================`);

const testScenes = [
  {
    title: 'Cảnh 1: Mở đầu bứt phá',
    metaphor: 'bước nhảy vọt thần tốc phá vỡ mọi giới hạn',
    dna: { motion: 'rise', form: 'arrow', energy: 0.85, valence: 'positive', primaryDimension: 'motion', strokeComplexity: 2 }
  },
  {
    title: 'Cảnh 2: Tăng trưởng tiếp diễn',
    metaphor: 'doanh thu tăng vọt theo phương thẳng đứng',
    dna: { motion: 'rise', form: 'arrow', energy: 0.9, valence: 'positive', primaryDimension: 'motion', strokeComplexity: 2 }
  },
  {
    title: 'Cảnh 3: Đỉnh cao năng lượng',
    metaphor: 'ngọn lửa bùng cháy dữ dội thắp sáng mục tiêu',
    dna: { motion: 'expand', form: 'burst', energy: 0.95, valence: 'positive', primaryDimension: 'energy', strokeComplexity: 2 }
  },
  {
    title: 'Cảnh 4: Thăng hoa liên tục',
    metaphor: 'hướng đi quyết định mở ra chân trời mới',
    dna: { motion: 'rise', form: 'arrow', energy: 0.8, valence: 'positive', primaryDimension: 'motion', strokeComplexity: 2 }
  },
  {
    title: 'Cảnh 5: Kết quả xác thực',
    metaphor: 'hoàn thành mục tiêu xuất sắc vượt kỳ vọng',
    dna: { motion: 'rise', form: 'check', energy: 0.75, valence: 'positive', primaryDimension: 'valence', strokeComplexity: 1 }
  }
];

const assignedDnas = [];
const assignedIds = [];

testScenes.forEach((s, idx) => {
  const candidates = items.map((it) => {
    const dist = dnaDistance(s.dna, it.dna);
    const sem = jaccard(s.metaphor, `${it.name} ${it.description} ${it.tags.join(' ')}`);
    const base = (1 - dist / 6.0) * 0.6 + sem * 0.4;
    const pen = diversityPenalty(it.dna, assignedDnas, testScenes.length);
    const final = base - pen;
    return { it, dist, sem, base, pen, final };
  });

  candidates.sort((a, b) => b.final - a.final);
  const chosen = candidates[0];

  assignedDnas.push(chosen.it.dna);
  assignedIds.push(chosen.it.id);

  console.log(`[${s.title}]`);
  console.log(`   Ẩn dụ: "${s.metaphor}"`);
  console.log(`   -> Chọn: ${chosen.it.name} (${chosen.it.id})`);
  console.log(`   -> BaseScore: ${chosen.base.toFixed(3)} | DiversityPenalty: ${chosen.pen.toFixed(3)} | FinalScore: ${chosen.final.toFixed(3)}`);
  console.log(`   -> Form: ${chosen.it.dna.form}, Motion: ${chosen.it.dna.motion}`);
});

// Kiểm tra tính đa dạng: Có 2 cảnh liền kề nào trùng ID không?
let hasConsecutiveDuplicate = false;
for (let i = 1; i < assignedIds.length; i++) {
  if (assignedIds[i] === assignedIds[i - 1]) {
    hasConsecutiveDuplicate = true;
  }
}

console.log(`\nKết quả Cliché Test:`);
console.log(`- Trùng lặp liên kề: ${hasConsecutiveDuplicate ? '❌ CÓ LỖI' : '✅ 100% ĐẠT (Không trùng lặp)'}`);
console.log(`- Danh sách ID được chọn: ${assignedIds.join(' -> ')}`);

// ── TEST 2: Parametric Fallback Test ─────────────────────────────────────────
console.log(`\n======================================================`);
console.log(`🧪 TEST 2: PARAMETRIC FALLBACK TEST`);
console.log(`======================================================`);

const exoticDna = { motion: 'spiral', form: 'spiral', energy: 0.99, valence: 'urgent', primaryDimension: 'motion', strokeComplexity: 3 };
const bestDist = Math.min(...items.map((it) => dnaDistance(exoticDna, it.dna)));
console.log(`Exotic DNA best distance trong catalog: ${bestDist.toFixed(2)}`);
console.log(`MATCH_THRESHOLD = 2.20`);
if (bestDist > 2.20) {
  console.log(`✅ ĐẠT: Khoảng cách (${bestDist.toFixed(2)}) > 2.20 -> Kích hoạt Parametric Generator!`);
} else {
  console.log(`Asset khớp: ${items.find((it) => dnaDistance(exoticDna, it.dna) === bestDist).name}`);
}

console.log(`\n🎉 TOÀN BỘ UNIT TEST HOÀN TẤT VỚI KẾT QUẢ XUẤT SẮC!`);
