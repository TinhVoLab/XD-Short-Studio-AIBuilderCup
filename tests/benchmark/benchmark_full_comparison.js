import { safeJsonParse } from './server/services/jsonRepairService.js';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const BASE_URL = 'https://api.deepseek.com/chat/completions';

console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('   🔥 FULL END-TO-END BENCHMARK: DEEPSEEK (V3 / R1) vs CORE PIPELINE   ');
console.log('═══════════════════════════════════════════════════════════════════════════════\n');

async function callDeepSeek(model, messages, responseFormat = null) {
  const start = performance.now();
  const payload = { model, messages, stream: false };
  if (responseFormat) payload.response_format = responseFormat;

  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  const totalTime = ((performance.now() - start) / 1000).toFixed(2);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0]?.message || {};
  return {
    model,
    content: choice.content || '',
    reasoningContent: choice.reasoning_content || '',
    totalTime,
    usage: data.usage || {}
  };
}

function sanitizeAiOutput(rawContent, reasoningContent = '') {
  let clean = rawContent;
  let extractedReasoning = reasoningContent;
  const thinkMatch = clean.match(/<think>([\s\S]*?)<\/think>/i);
  if (thinkMatch) {
    if (!extractedReasoning) extractedReasoning = thinkMatch[1].trim();
    clean = clean.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  }
  return { clean, reasoning: extractedReasoning };
}

// ── TOPIC DEFINITIONS ──
const TOPICS = [
  {
    id: 'tech',
    category: '🤖 CÔNG NGHỆ / AI',
    title: 'Nghịch lý AI: Máy móc càng thông minh, con người càng lười suy nghĩ?',
    style: 'Kịch tính, triết lý, phản biện đanh thép'
  },
  {
    id: 'finance',
    category: '💰 TÀI CHÍNH / KINH DOANH',
    title: '3 Thói quen tài chính sai lầm khiến người trẻ mãi không có tiền tiết kiệm',
    style: 'Thực tế, cảnh báo, giải pháp sắc bén'
  },
  {
    id: 'healing',
    category: '🌿 CHỮA LÀNH / LIFESTYLE',
    title: 'Nghệ thuật buông bỏ để tìm lại sự an yên trong tâm hồn',
    style: 'Chữa lành, nhẹ nhàng, sâu lắng, truyền cảm hứng'
  }
];

// ── 1. SCRIPT GENERATION BENCHMARK ──
async function benchmarkScript(model, topic) {
  const prompt = `Hãy viết kịch bản video ngắn (TikTok/Shorts) về chủ đề: "${topic.title}". Phong cách: ${topic.style}.
Định dạng mảng JSON các đối tượng Scene (không markdown):
[
  {
    "text": "lời đọc cho cảnh này (2-3 câu súc tích, giàu cảm xúc)",
    "duration": thời lượng ước tính bằng giây (số nguyên)
  }
]`;

  const res = await callDeepSeek(model, [
    { role: 'system', content: 'You are an elite short-video viral scriptwriter. Return ONLY valid JSON array.' },
    { role: 'user', content: prompt }
  ]);

  const { clean, reasoning } = sanitizeAiOutput(res.content, res.reasoningContent);
  const parsed = safeJsonParse(clean, []);
  return {
    latency: res.totalTime,
    reasoningLength: reasoning.length,
    scenes: parsed,
    rawText: clean
  };
}

// ── 2. VIRAL HOOK BENCHMARK ──
async function benchmarkHook(model, topic) {
  const prompt = `You are a viral TikTok hook specialist.
Generate a complete 3-second Viral Master Hook for the topic: "${topic.title}". Style: "${topic.style}".

Return ONLY a valid JSON object matching this schema:
{
  "badgeText": "Short Eyecatcher Badge (e.g. ⚠️ CẢNH BÁO, 🔥 SỰ THẬT, ✦ BÍ MẬT ✦)",
  "heroTitle": "Short 3 to 6 words punchy title in ALL CAPS",
  "highlightWords": ["1 or 2 high-impact words to glow"],
  "subText": "1 curiosity-gap sentence explaining why they must watch...",
  "accentColor": "#FF5544"
}`;

  const res = await callDeepSeek(model, [
    { role: 'system', content: 'You are a viral hook psychology expert. Output JSON only.' },
    { role: 'user', content: prompt }
  ]);

  const { clean } = sanitizeAiOutput(res.content, res.reasoningContent);
  const parsed = safeJsonParse(clean, {});
  return { latency: res.totalTime, hook: parsed };
}

// ── 3. AI MAGIC FILL FOR CHART BENCHMARK ──
async function benchmarkMagicFill(model, topic) {
  const prompt = `Generate realistic data for a visual comparison chart for video topic: "${topic.title}".
Return ONLY a valid JSON object with:
{
  "chartTitle": "Tiêu đề biểu đồ",
  "data": [
    {"label": "Tên mục 1", "value": 70},
    {"label": "Tên mục 2", "value": 30}
  ],
  "insight": "1 câu nhận xét rút ra từ số liệu"
}`;

  const res = await callDeepSeek(model, [
    { role: 'system', content: 'You are a data-visualization expert. Output JSON only.' },
    { role: 'user', content: prompt }
  ]);

  const { clean } = sanitizeAiOutput(res.content, res.reasoningContent);
  const parsed = safeJsonParse(clean, {});
  return { latency: res.totalTime, chart: parsed };
}

// ── 4. SOCIAL SEO CAPTION BENCHMARK ──
async function benchmarkSocialSeo(model, topic, scriptText) {
  const prompt = `Generate viral social caption & hashtags for video topic: "${topic.title}".
Return ONLY JSON:
{
  "youtubeTitle": "SEO Title < 70 chars with emoji",
  "tiktokCaption": "Catchy caption with CTA",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
  "pinnedComment": "Interactive question to boost comments"
}`;

  const res = await callDeepSeek(model, [
    { role: 'system', content: 'You are a social media growth hacker. Output JSON only.' },
    { role: 'user', content: prompt }
  ]);

  const { clean } = sanitizeAiOutput(res.content, res.reasoningContent);
  const parsed = safeJsonParse(clean, {});
  return { latency: res.totalTime, seo: parsed };
}

async function runFullComparison() {
  for (const topic of TOPICS) {
    console.log(`\n╔══════════════════════════════════════════════════════════════════════════════╗`);
    console.log(`║ CHỦ ĐỀ: ${topic.category}                                 ║`);
    console.log(`║ "${topic.title}"`);
    console.log(`╚══════════════════════════════════════════════════════════════════════════════╝\n`);

    // Run DeepSeek-V3
    console.log(`▶ [1/2] Đang chạy đánh giá DEEPSEEK-V3 (deepseek-chat)...`);
    const v3Script = await benchmarkScript('deepseek-chat', topic);
    const v3Hook = await benchmarkHook('deepseek-chat', topic);
    const v3Chart = await benchmarkMagicFill('deepseek-chat', topic);
    const v3Seo = await benchmarkSocialSeo('deepseek-chat', topic, v3Script.rawText);

    // Run DeepSeek-R1
    console.log(`▶ [2/2] Đang chạy đánh giá DEEPSEEK-R1 (deepseek-reasoner)...`);
    const r1Script = await benchmarkScript('deepseek-reasoner', topic);
    const r1Hook = await benchmarkHook('deepseek-reasoner', topic);
    const r1Chart = await benchmarkMagicFill('deepseek-reasoner', topic);
    const r1Seo = await benchmarkSocialSeo('deepseek-reasoner', topic, r1Script.rawText);

    console.log(`\n───────────────────────────────────────────────────────────────────────────────`);
    console.log(`📊 SO SÁNH TRỰC DIỆN: ${topic.category}`);
    console.log(`───────────────────────────────────────────────────────────────────────────────`);

    console.log(`\n🔹 [TÍNH NĂNG 1: HOOK 3S GIỮ CHÂN]`);
    console.log(`  🔵 DeepSeek-V3 (${v3Hook.latency}s): [${v3Hook.hook.badgeText}] ${v3Hook.hook.heroTitle}`);
    console.log(`     Glow: ${JSON.stringify(v3Hook.hook.highlightWords)} | Sub: "${v3Hook.hook.subText}"`);
    console.log(`  🧠 DeepSeek-R1 (${r1Hook.latency}s): [${r1Hook.hook.badgeText}] ${r1Hook.hook.heroTitle}`);
    console.log(`     Glow: ${JSON.stringify(r1Hook.hook.highlightWords)} | Sub: "${r1Hook.hook.subText}"`);

    console.log(`\n🔹 [TÍNH NĂNG 2: KỊCH BẢN PHÂN CẢNH]`);
    console.log(`  🔵 DeepSeek-V3 (${v3Script.latency}s, ${v3Script.scenes.length} cảnh):`);
    v3Script.scenes.slice(0, 3).forEach((s, i) => console.log(`     - Cảnh ${i+1}: ${s.text}`));
    if (v3Script.scenes.length > 3) console.log(`     ... và ${v3Script.scenes.length - 3} cảnh tiếp theo`);

    console.log(`  🧠 DeepSeek-R1 (${r1Script.latency}s, ${r1Script.scenes.length} cảnh - Tư duy ${r1Script.reasoningLength} ký tự):`);
    r1Script.scenes.slice(0, 3).forEach((s, i) => console.log(`     - Cảnh ${i+1}: ${s.text}`));
    if (r1Script.scenes.length > 3) console.log(`     ... và ${r1Script.scenes.length - 3} cảnh tiếp theo`);

    console.log(`\n🔹 [TÍNH NĂNG 3: SỐ LIỆU BIỂU ĐỒ (MAGIC FILL)]`);
    console.log(`  🔵 DeepSeek-V3: "${v3Chart.chart.chartTitle}" -> Insight: "${v3Chart.chart.insight}"`);
    console.log(`  🧠 DeepSeek-R1: "${r1Chart.chart.chartTitle}" -> Insight: "${r1Chart.chart.insight}"`);

    console.log(`\n🔹 [TÍNH NĂNG 4: SEO CAPTION & HASHTAGS]`);
    console.log(`  🔵 DeepSeek-V3: Title="${v3Seo.seo.youtubeTitle}" | Tags=${(v3Seo.seo.hashtags || []).join(' ')}`);
    console.log(`  🧠 DeepSeek-R1: Title="${r1Seo.seo.youtubeTitle}" | Tags=${(r1Seo.seo.hashtags || []).join(' ')}`);
  }

  console.log(`\n═══════════════════════════════════════════════════════════════════════════════`);
  console.log(`           🎉 HOÀN TẤT TOÀN BỘ BÀI BENCHMARK FULL SO SÁNH ĐỐI ĐẦU              `);
  console.log(`═══════════════════════════════════════════════════════════════════════════════\n`);
}

runFullComparison();
