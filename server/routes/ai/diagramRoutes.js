import { Router } from 'express';
import { callGemini } from '../../services/geminiService.js';
import { callDeepSeek } from '../../services/deepseekService.js';
import { safeJsonParse } from '../../services/jsonRepairService.js';
import { telemetry } from '../../services/telemetryService.js';
import { checkAiQuota } from '../../middlewares/aiQuotaMiddleware.js';

const router = Router();

/**
 * POST /api/ai/generate-diagram
 * Sinh cấu trúc sơ đồ / đồ thị Remotion tối ưu cho video dọc 9:16 từ Prompt hoặc Mermaid
 */
router.post('/generate-diagram', checkAiQuota, async (req, res) => {
  telemetry.recordRequest('/api/ai/generate-diagram');
  const {
    prompt,
    diagramType = 'auto',
    mode = 'prompt',
    mermaidCode = '',
    brandColor = '#BEFF01',
    sceneVoiceover = '',
    apiKey,
    deepseekApiKey,
  } = req.body;

  let effectiveApiKey = (apiKey || '').trim();
  let effectiveDeepseekKey = (deepseekApiKey || '').trim();

  if (effectiveApiKey && effectiveApiKey.startsWith('sk-') && !effectiveDeepseekKey) {
    effectiveDeepseekKey = effectiveApiKey;
    effectiveApiKey = null;
  }

  if (!effectiveApiKey && !effectiveDeepseekKey) {
    return res.status(401).json({
      error: 'Vui lòng cấu hình Gemini API Key hoặc DeepSeek API Key trong Cài đặt trước khi tạo sơ đồ!',
    });
  }

  const ACCENT = brandColor || '#BEFF01';

  try {
    let systemPrompt = '';
    let userPrompt = '';

    if (mode === 'mermaid') {
      systemPrompt = `You are an expert Diagram Compiler for 9:16 mobile short videos.
Your task is to convert Mermaid.js code into an animated Remotion element JSON.

TARGET ARCHITECTURE: 'dynamic-diagram' (Vector Graph with Animated Nodes & Connectors).
This supports arbitrary directed graphs, decision diamonds, backward feedback loops, and multi-shape nodes.

Schema:
{
  "type": "dynamic-diagram",
  "left": 180,
  "top": 180,
  "width": 336,
  "accentColor": "${ACCENT}",
  "diagramData": {
    "title": "TIÊU ĐỀ SƠ ĐỒ (Sentence case)",
    "direction": "TD",
    "nodes": [
      { "id": "1", "label": "Bắt đầu", "sublabel": "Khởi động", "shape": "pill", "color": "${ACCENT}" },
      { "id": "2", "label": "Điều kiện?", "sublabel": "Kiểm tra", "shape": "diamond", "color": "#00D4FF" },
      { "id": "3", "label": "Xử lý", "sublabel": "Thực thi", "shape": "rect", "color": "#BEFF01" },
      { "id": "4", "label": "Hoàn tất", "sublabel": "Thành công", "shape": "pill", "color": "#00FF88" }
    ],
    "edges": [
      { "from": "1", "to": "2", "label": "Gửi yêu cầu" },
      { "from": "2", "to": "3", "label": "Hợp lệ" },
      { "from": "3", "to": "4", "label": "Đạt chuẩn" },
      { "from": "2", "to": "1", "label": "Lỗi (Lặp lại)" }
    ]
  },
  "animPreset": "zoom-in"
}

ALLOWED NODE SHAPES: 'rect' (default box), 'diamond' (decision/condition), 'pill' (start/end rounded), 'circle' (state/core), 'cylinder' (database/storage).

CRITICAL RULES:
- Safe Zone for 9:16 mobile screen: Max 4-6 nodes total. Node labels should be concise (1-3 words).
- STRICTLY Vietnamese natural language for all labels.
- Output ONLY valid JSON (no markdown \`\`\`json wrappers).`;

      userPrompt = `Convert this Mermaid code into a dynamic-diagram JSON (Self-heal any typos or syntax quirks):
\`\`\`mermaid
${mermaidCode || 'graph TD\n A[Bắt đầu] --> B{Hợp lệ?} -->|Có| C[Thành công]\n B -->|Không| A'}
\`\`\``;
    } else {
      // mode === 'prompt'
      const typeDirective = diagramType !== 'auto'
        ? `MANDATORY USER CHOICE: You MUST use element type '${diagramType}'.`
        : `INTELLIGENT TOPOLOGY SELECTION:
- By default, choose 'dynamic-diagram' (modern free-form vector graph with decision diamonds, loops, and connectors).
- If topic is strictly a 2-sided versus comparison -> choose 'vs-battle'
- If topic is strictly a milestone timeline -> choose 'roadmap-flow'
- If topic is strictly a conversion funnel / pyramid -> choose 'pyramid-funnel'`;

      systemPrompt = `You are a World-Class Data Visualization and Information Architect for viral 9:16 short videos.
Your task is to invent an engaging, ultra-clear diagram element JSON matching the user's idea.

${typeDirective}

AVAILABLE ELEMENT SCHEMAS:

1. 'dynamic-diagram' (RECOMMENDED - Free-form dynamic vector graph):
{
  "type": "dynamic-diagram",
  "left": 180,
  "top": 180,
  "width": 336,
  "accentColor": "${ACCENT}",
  "diagramData": {
    "title": "TIÊU ĐỀ SƠ ĐỒ (Sentence case)",
    "direction": "TD",
    "nodes": [
      { "id": "n1", "label": "Đầu vào", "shape": "pill", "color": "${ACCENT}" },
      { "id": "n2", "label": "Xác thực?", "shape": "diamond", "color": "#00D4FF" },
      { "id": "n3", "label": "Tự động hóa", "shape": "rect", "color": "#BEFF01" },
      { "id": "n4", "label": "Kết quả", "shape": "pill", "color": "#00FF88" }
    ],
    "edges": [
      { "from": "n1", "to": "n2" },
      { "from": "n2", "to": "n3", "label": "Đạt" },
      { "from": "n3", "to": "n4", "label": "Xong" },
      { "from": "n2", "to": "n1", "label": "Làm lại" }
    ]
  },
  "animPreset": "zoom-in"
}

2. 'branching-flow':
{
  "type": "branching-flow",
  "left": 180,
  "top": 190,
  "width": 336,
  "accentColor": "${ACCENT}",
  "branchingFlowData": {
    "rootNode": { "id": "root", "label": "Khái niệm trung tâm", "subLabel": "Trọng tâm", "icon": "core" },
    "childNodes": [
      { "id": "c1", "label": "Nhánh 1", "subLabel": "Chi tiết ngắn", "icon": "node" },
      { "id": "c2", "label": "Nhánh 2", "subLabel": "Chi tiết ngắn", "icon": "node" },
      { "id": "c3", "label": "Nhánh 3", "subLabel": "Chi tiết ngắn", "icon": "node" }
    ],
    "layout": "horizontal"
  },
  "animPreset": "zoom-in"
}

3. 'knowledge-graph':
{
  "type": "knowledge-graph",
  "left": 180,
  "top": 40,
  "width": 360,
  "height": 560,
  "knowledgeGraphData": {
    "title": "Bản đồ kiến thức cốt lõi",
    "layout": "spine",
    "theme": "obsidian-dark",
    "nodes": [
      { "id": "root", "tier": 0, "parentId": null, "label": "Chủ đề chính", "color": "${ACCENT}", "icon": "brain" },
      { "id": "n1", "tier": 1, "parentId": "root", "label": "Nhánh A", "color": "#00D4FF", "icon": "atom", "insight": "Tóm tắt giá trị nhánh A" },
      { "id": "n2", "tier": 1, "parentId": "root", "label": "Nhánh B", "color": "#FFB800", "icon": "rocket", "insight": "Tóm tắt giá trị nhánh B" }
    ],
    "activeNodeId": "n1"
  }
}

4. 'vs-battle':
{
  "type": "vs-battle",
  "left": 180,
  "top": 180,
  "width": 336,
  "vsBattle": {
    "leftSubject": { "name": "Cách Cũ", "icon": "❌", "color": "#FF5544" },
    "rightSubject": { "name": "Cách Mới", "icon": "⚡", "color": "${ACCENT}" },
    "rounds": [
      { "criterion": "Tốc độ", "winner": "right", "leftValue": "3 ngày", "rightValue": "10 phút" },
      { "criterion": "Chi phí", "winner": "right", "leftValue": "50 triệu", "rightValue": "0 đồng" },
      { "criterion": "Hiệu quả", "winner": "right", "leftValue": "20%", "rightValue": "95%" }
    ],
    "winner": "right",
    "showWinner": true
  }
}

5. 'tree-diagram':
{
  "type": "tree-diagram",
  "left": 180,
  "top": 190,
  "width": 336,
  "treeData": {
    "title": "LỘ TRÌNH LÀM CHỦ",
    "rootNode": { "label": "MỤC TIÊU", "icon": "target" },
    "branches": [
      { "group": "Giai đoạn 1", "items": ["Cơ bản", "Thực hành"], "color": "${ACCENT}" },
      { "group": "Giai đoạn 2", "items": ["Nâng cao", "Tự động hóa"], "color": "#00D4FF" }
    ]
  },
  "animPreset": "zoom-in"
}

6. 'roadmap-flow':
{
  "type": "roadmap-flow",
  "left": 180,
  "top": 190,
  "width": 336,
  "content": "LỘ TRÌNH 3 CHẶNG",
  "accentColor": "${ACCENT}",
  "roadmapSteps": [
    { "step": "01", "title": "BẮT ĐẦU", "desc": "Chuẩn bị nền tảng", "status": "done", "color": "${ACCENT}" },
    { "step": "02", "title": "TĂNG TỐC", "desc": "Mở rộng quy mô", "status": "active", "color": "#00D4FF" },
    { "step": "03", "title": "VỀ ĐÍCH", "desc": "Làm chủ hoàn toàn", "status": "pending", "color": "#FFB800" }
  ],
  "animPreset": "slide-up"
}

7. 'pyramid-funnel':
{
  "type": "pyramid-funnel",
  "left": 180,
  "top": 200,
  "width": 320,
  "content": "MÔ HÌNH PHỄU CHUYỂN ĐỔI",
  "accentColor": "${ACCENT}",
  "pyramidLayers": [
    { "label": "TẦNG 1: TIẾP CẬN", "sub": "10,000 lượt xem", "color": "#00D4FF" },
    { "label": "TẦNG 2: QUAN TÂM", "sub": "1,000 đăng ký", "color": "#FFB800" },
    { "label": "TẦNG 3: MUA HÀNG", "sub": "150 khách VIP", "color": "${ACCENT}" }
  ],
  "animPreset": "zoom-in"
}

CRITICAL RULES:
- Safe Zone for 9:16 mobile screen: Max 3 to 4 items/steps total.
- Punchy, concise Vietnamese copy (Sentence case for subtitles, Uppercase for main step titles).
- Output ONLY valid raw JSON matching one of the above element schemas.`;

      userPrompt = `User Prompt: "${prompt}"
Current Scene Voiceover (if any): "${sceneVoiceover}"
Generate the single most visually compelling diagram element JSON.`;
    }

    let rawOutput = '';
    if (effectiveApiKey) {
      const resp = await callGemini(effectiveApiKey, `${systemPrompt}\n\n${userPrompt}`, {
        config: { responseMimeType: 'application/json' },
      });
      rawOutput = resp?.text || '';
    } else {
      const resp = await callDeepSeek(effectiveDeepseekKey, [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ], { model: 'deepseek-chat', jsonMode: true });
      rawOutput = resp?.text || '';
    }

    const elementData = safeJsonParse(rawOutput);
    if (!elementData || !elementData.type) {
      throw new Error('AI không thể sinh dữ liệu JSON hợp lệ cho sơ đồ.');
    }

    return res.json({ ok: true, element: elementData });
  } catch (err) {
    console.error('[GenerateDiagram Error]:', err);
    return res.status(500).json({
      error: err.message || 'Lỗi khi tạo sơ đồ bằng AI. Vui lòng thử lại!',
    });
  }
});

export default router;
