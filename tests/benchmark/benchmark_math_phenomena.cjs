/**
 * Benchmark & Audit Suite: Math Phenomena LLM Validation & Performance
 */
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const { performance } = require('perf_hooks');

console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('   🧠 MATH PHENOMENA & EDUTAINMENT BENCHMARK SUITE');
console.log('═══════════════════════════════════════════════════════════════════════════════\n');

const API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("❌ LỖI: Không tìm thấy VITE_GEMINI_API_KEY hoặc GEMINI_API_KEY trong file .env!");
  console.error("Vui lòng thêm biến môi trường và thử lại.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const TOPICS = [
  "Phương trình Navier-Stokes",
  "Nghịch lý Banach-Tarski",
  "Công thức Euler: e^(i pi) + 1 = 0",
  "Cân bằng Nash trong Lý thuyết trò chơi",
  "Dải Mobius và mặt không định hướng"
];

async function generateScript(topic) {
  const prompt = `Bạn là Đạo diễn Storyboard video khoa học edutainment hàng đầu theo phong cách Veritasium.
Chủ đề: "${topic}"

Nhiệm vụ: Lên kịch bản Storyboard chuẩn xác cho 4 phân cảnh.

Yêu cầu ngôn ngữ:
- MỌI đoạn text tiếng Việt bên trong công thức LaTeX bắt buộc phải được bọc trong lệnh \\text{...} để KaTeX không bị lỗi hiển thị. Ví dụ: \\text{Hệ số} = \\dots

Trả về DUY NHẤT một mảng JSON 4 phân cảnh theo định dạng:
[
  {
    "scene": 1,
    "beatTag": "hook",
    "voiceover": "lời thoại...",
    "directMathSpec": {
       "nodes": [
          { "type": "plot", "expr": "x^2" },
          { "type": "label", "text": "Tiêu đề", "formula": "Công thức LaTeX" }
       ],
       "grid": { "xRange": [-5, 5], "yRange": [-5, 5] }
    }
  }
]`;

  const start = performance.now();
  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });
  const latency = performance.now() - start;
  return { rawText: res.text || '', latency };
}

async function judgeMathRigor(topic, scenes) {
  let allFormulas = [];
  let allVoiceovers = [];
  
  for (const s of scenes) {
    if (s.voiceover) allVoiceovers.push(s.voiceover);
    if (s.directMathSpec && Array.isArray(s.directMathSpec.nodes)) {
      for (const n of s.directMathSpec.nodes) {
        if (n.type === 'label' && n.formula) {
          allFormulas.push(n.formula);
        }
      }
    }
  }
  
  const formulaStr = allFormulas.join(' | ');
  const voiceoverStr = allVoiceovers.join(' ');
  
  if (!formulaStr) return { pass: false, reason: "Không tìm thấy công thức toán học." };
  
  const prompt = `Bạn là một Giám khảo Toán học khắt khe. Kiểm tra kịch bản video:
Chủ đề: "${topic}"
Công thức LaTeX AI sinh ra: "${formulaStr}"
Lời thoại giải thích: "${voiceoverStr}"

Tiêu chí:
1. Công thức có chuẩn xác và đúng với hiện tượng này không?
2. Lời thoại có giải thích đúng ý nghĩa biến số hoặc bản chất công thức không?

Trả về DUY NHẤT định dạng JSON thuần túy (không markdown):
{ "pass": true/false, "reason": "Nhận xét 1 câu" }`;

  try {
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { temperature: 0.0 }
    });
    
    const text = res.text || '';
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
  } catch(e) {}
  return { pass: false, reason: "Lỗi AI giám khảo." };
}

async function runBenchmark() {
  let stats = {
    total: TOPICS.length,
    jsonPass: 0,
    katexPass: 0,
    pacingPass: 0,
    mathPass: 0,
    avgLatency: 0,
  };

  for (let i = 0; i < TOPICS.length; i++) {
    const topic = TOPICS[i];
    console.log(`\n▶ Đang test [${i+1}/${TOPICS.length}]: ${topic}`);
    
    try {
      const { rawText, latency } = await generateScript(topic);
      stats.avgLatency += latency;
      
      let scenes = null;
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      try {
         scenes = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
         if (Array.isArray(scenes)) {
            console.log(`  ✓ JSON Schema: PASS (${latency.toFixed(0)}ms)`);
            stats.jsonPass++;
         } else throw new Error();
      } catch (e) {
         console.log(`  ✗ JSON Schema: FAIL (Không parse được mảng JSON)`);
         continue;
      }
      
      let katexPass = true;
      const viRegex = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
      for (const s of scenes) {
        if (s.directMathSpec && Array.isArray(s.directMathSpec.nodes)) {
          for (const n of s.directMathSpec.nodes) {
            if (n.type === 'label' && n.formula) {
               const formula = n.formula;
               if (viRegex.test(formula) && !formula.includes('\\text')) {
                  katexPass = false;
                  console.log(`  ✗ KaTeX Anti-Break: FAIL (Thiếu \\text{} trong: ${formula})`);
               }
            }
          }
        }
      }
      if (katexPass) {
        console.log(`  ✓ KaTeX Anti-Break: PASS`);
        stats.katexPass++;
      }
      
      if (scenes.length === 4) {
        console.log(`  ✓ Cognitive Pacing: PASS (4 cảnh)`);
        stats.pacingPass++;
      } else {
        console.log(`  ✗ Cognitive Pacing: FAIL (${scenes.length} cảnh)`);
      }
      
      process.stdout.write(`  ⏳ Đang gọi AI Giám khảo chấm điểm Toán học... `);
      const judge = await judgeMathRigor(topic, scenes);
      if (judge.pass) {
        console.log(`\r  ✓ Math Rigor: PASS (${judge.reason})`);
        stats.mathPass++;
      } else {
        console.log(`\r  ✗ Math Rigor: FAIL (${judge.reason})`);
      }
    } catch (err) {
      console.log(`  ✗ LỖI HỆ THỐNG: ${err.message}`);
    }
  }

  stats.avgLatency = stats.avgLatency / TOPICS.length;
  console.log('\n═══════════════════════════════════════════════════════════════════════════════');
  console.log('   📊 BÁO CÁO BENCHMARK TỔNG HỢP (AI LLM)');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log(`  • JSON Schema Accuracy:  ${stats.jsonPass}/${stats.total} (${(stats.jsonPass/stats.total*100).toFixed(0)}%)`);
  console.log(`  • KaTeX String Safety:   ${stats.katexPass}/${stats.total} (${(stats.katexPass/stats.total*100).toFixed(0)}%)`);
  console.log(`  • Pacing (4 Acts):       ${stats.pacingPass}/${stats.total} (${(stats.pacingPass/stats.total*100).toFixed(0)}%)`);
  console.log(`  • Math Rigor (LLM Judge):${stats.mathPass}/${stats.total} (${(stats.mathPass/stats.total*100).toFixed(0)}%)`);
  console.log(`  • Average LLM Latency:   ${(stats.avgLatency / 1000).toFixed(2)}s per topic`);
  console.log('═══════════════════════════════════════════════════════════════════════════════');
}

runBenchmark();
