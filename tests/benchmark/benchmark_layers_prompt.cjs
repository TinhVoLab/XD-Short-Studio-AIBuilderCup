const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
require('dotenv').config();

// Chúng ta sẽ giả lập lại đúng đoạn Prompt được tạo ra trong paradoxStoryExpander.ts
function buildPrompt(name, desc, formula) {
  const mathGuidance = `\nĐẶC BIỆT VỀ HÌNH HỌC TOÁN HỌC (Math Declarative Spec): Bạn BẮT BUỘC dùng kiến trúc Đa Lớp (Layer-based Archetypes):
1. Khai báo "layers" (mảng các Khuôn): "function_plot", "formula_morph", "geometry_construct", "probability_sim", "number_line". MỖI LAYER BẮT BUỘC PHẢI CÓ THUỘC TÍNH "id" DUY NHẤT.
2. Khai báo "animations": Điều khiển hoạt hình bằng Động từ (verb). QUAN TRỌNG: "targetId" trong mảng animations BẮT BUỘC PHẢI KHỚP CHÍNH XÁC với một "id" đã khai báo trong "layers". Không được tự bịa ra targetId không tồn tại!
3. Ví dụ CHUẨN: "mathIntent": { "layers": [{ "type": "function_plot", "params": { "expr": "sin(x)", "color": "#00D4FF", "id": "layer_1" } }], "animations": [{ "targetId": "layer_1", "verb": "draw", "startTau": 0.0, "endTau": 1.0 }] }`;

  return `Bạn là Đạo diễn Storyboard video khoa học edutainment hàng đầu theo phong cách Veritasium / 3Blue1Brown trên TikTok/Reels/Shorts.
Tên chủ đề: "${name}"
Mô tả khoa học: "${desc}"
Công thức giải tích cốt lõi: "${formula}"${mathGuidance}

Nhiệm vụ: Lên kịch bản Storyboard phân cảnh chuẩn xác cho 3 phân cảnh để dựng video:
- Cảnh 1 (beatTag: "hook"): Đặt vấn đề nghịch lý, gây tò mò.
- Cảnh 2 (beatTag: "breakdown"): Bóc tách cơ chế cốt lõi và phương trình.
- Cảnh 3 (beatTag: "resolution"): Giải mã hiện tượng và bài học thực tế.

Trả về DUY NHẤT một mảng JSON 3 phân cảnh theo đúng định dạng sau (Tuyệt đối KHÔNG bọc trong markdown backticks, CHỈ trả về JSON):
[
  {
    "scene": 1,
    "sceneTitle": "Tiêu đề phân cảnh 1...",
    "beatTag": "hook",
    "voiceover": "lời thoại phân cảnh 1...",
    "cueKeywords": ["từ_khóa_1", "từ_khóa_2"],
    "mathIntent": {
       "layers": [
         { "type": "function_plot", "params": { "expr": "x^2", "color": "#BEFF01", "id": "layer_0" } }
       ],
       "animations": [
         { "targetId": "layer_0", "verb": "draw", "startTau": 0.0, "endTau": 1.0 }
       ]
    }
  }
]`;
}

// 3 Test Cases khắc nghiệt
const TEST_CASES = [
  {
    id: "TC3_TRANSFORM",
    name: "Phân rã chuỗi Fourier",
    desc: "Bất kỳ âm thanh nào cũng có thể bẻ gãy thành các vòng tròn xoay tròn.",
    formula: "f(t) = \\sum_{n=-\\infty}^{\\infty} c_n e^{i n \\omega_0 t}"
  }
];

async function runBenchmark() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Missing GEMINI_API_KEY");
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });
  console.log("🚀 KHỞI ĐỘNG BENCHMARK: In kết quả JSON thực tế...\n");
  
  let passedCount = 0;
  
  for (const tc of TEST_CASES) {
    console.log(`\n===========================================`);
    console.log(`⏳ Đang test [${tc.id}] - ${tc.name}...`);
    
    const prompt = buildPrompt(tc.name, tc.desc, tc.formula);
    
    try {
      const start = Date.now();
      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });
      const end = Date.now();
      
      const rawText = res.text;
      const parsed = JSON.parse(rawText);
      
      console.log(`✅ [PARSE OK] AI trả về JSON chuẩn xác (${(end - start)}ms). Số phân cảnh: ${parsed.length}`);
      console.log("\n--- KẾT QUẢ JSON CỦA PHÂN CẢNH 1 ---");
      console.log(JSON.stringify(parsed[0], null, 2));
      console.log("------------------------------------\n");
      
      // Kiểm tra Zod schema basic & Referential Integrity
      let integrityPass = true;
      let zodError = null;
      
      for (let i = 0; i < parsed.length; i++) {
        const scene = parsed[i];
        if (!scene.mathIntent || !scene.mathIntent.layers) {
          integrityPass = false;
          zodError = `Cảnh ${i+1} thiếu mathIntent.layers`;
          break;
        }
        
        const layers = scene.mathIntent.layers;
        const anims = scene.mathIntent.animations || [];
        
        // Kiểm tra chéo (Referential Integrity): targetId phải có trong layers
        const layerIds = layers.map(l => l.params?.id).filter(id => id);
        for (const anim of anims) {
          if (!layerIds.includes(anim.targetId)) {
             integrityPass = false;
             zodError = `Cảnh ${i+1}: Animation trỏ tới targetId '${anim.targetId}' nhưng không có layer nào mang ID này!`;
             break;
          }
        }
        if (!integrityPass) break;
      }
      
      if (integrityPass) {
        console.log(`✅ [SCHEMA & INTEGRITY OK] Dữ liệu hoàn toàn khớp nối.`);
        passedCount++;
      } else {
        console.log(`❌ [FAIL] Lỗi toàn vẹn dữ liệu: ${zodError}`);
      }
      
    } catch (err) {
      console.log(`❌ [CRITICAL FAIL] Lỗi thực thi AI hoặc Parse:`, err.message);
    }
  }
  
  console.log(`\n===========================================`);
  console.log(`🏆 TỔNG KẾT BENCHMARK: ${passedCount} / ${TEST_CASES.length} PASS (${Math.round((passedCount/TEST_CASES.length)*100)}%)`);
  if (passedCount === TEST_CASES.length) {
    console.log("🔥 HỆ THỐNG ĐÃ SẴN SÀNG CHO PRODUCTION!");
  } else {
    console.log("⚠️ CẦN TINH CHỈNH LẠI PROMPT.");
  }
}

runBenchmark();
