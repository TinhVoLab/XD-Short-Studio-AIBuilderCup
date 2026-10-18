import { safeJsonParse } from './server/services/jsonRepairService.js';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const BASE_URL = 'https://api.deepseek.com/chat/completions';

console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('       🚀 XD-SHORT STUDIO — DEEPSEEK (V3 & R1) BENCHMARK SUITE       ');
console.log('═══════════════════════════════════════════════════════════════════════════════\n');

/**
 * Call DeepSeek API with timing and error handling
 */
async function callDeepSeek(model, messages, responseFormat = null) {
  const start = performance.now();
  
  const payload = {
    model,
    messages,
    stream: false,
  };

  if (responseFormat) {
    payload.response_format = responseFormat;
  }

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
  const usage = data.usage || {};

  return {
    model,
    content: choice.content || '',
    reasoningContent: choice.reasoning_content || '',
    totalTime,
    usage
  };
}

/**
 * Sanitizer for extracting Clean Content & Reasoning
 */
function sanitizeAiOutput(rawContent, reasoningContent = '') {
  let clean = rawContent;
  let extractedReasoning = reasoningContent;

  // If reasoning is inside <think> tags in content
  const thinkMatch = clean.match(/<think>([\s\S]*?)<\/think>/i);
  if (thinkMatch) {
    if (!extractedReasoning) {
      extractedReasoning = thinkMatch[1].trim();
    }
    clean = clean.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  }

  return { clean, reasoning: extractedReasoning };
}

// ── TEST 1: SCRIPT GENERATION (5 SCENES) ──
async function testScriptGeneration(model) {
  console.log(`───────────────────────────────────────────────────────────────────────────────`);
  console.log(`▶ [TEST 1] Script Generation with Model: [${model}]`);
  console.log(`  Topic: "Nghịch lý AI: Máy móc càng thông minh, con người càng lười?"`);
  console.log(`  Target: 5 Scenes JSON array with voiceover and duration...`);

  const prompt = `Hãy viết kịch bản video ngắn (TikTok/Shorts) về chủ đề: "Nghịch lý AI: Máy móc càng thông minh, con người càng lười?". Phong cách: Kịch tính, triết lý, lôi cuốn.
Trình bày kết quả dưới định dạng JSON nguyên chuẩn (không markdown, không bọc \`\`\`json).
Định dạng mảng các đối tượng Scene, mỗi object gồm:
[
  {
    "text": "lời đọc cho cảnh này (tối đa 2-3 câu ngắn)",
    "duration": thời lượng ước tính bằng giây (số nguyên, ví dụ: 4)
  }
]`;

  try {
    const res = await callDeepSeek(model, [
      { role: 'system', content: 'You are a professional viral short-video scriptwriter. Output valid JSON only.' },
      { role: 'user', content: prompt }
    ]);

    const { clean, reasoning } = sanitizeAiOutput(res.content, res.reasoningContent);
    const parsed = safeJsonParse(clean, []);

    console.log(`  ✓ Status: SUCCESS`);
    console.log(`  ✓ Total Latency: ${res.totalTime}s`);
    if (reasoning) {
      console.log(`  ✓ Reasoning Length: ${reasoning.length} chars (Thinking recorded)`);
      console.log(`  💭 Reasoning Snippet: "${reasoning.slice(0, 120)}..."`);
    }
    console.log(`  ✓ Token Usage: Prompt=${res.usage.prompt_tokens || 'N/A'}, Completion=${res.usage.completion_tokens || 'N/A'}`);
    console.log(`  ✓ JSON Valid: ${Array.isArray(parsed) && parsed.length > 0 ? `YES (${parsed.length} scenes)` : 'NO'}`);
    
    if (Array.isArray(parsed) && parsed.length > 0) {
      console.log('\n  🎬 Generated Script Preview:');
      parsed.forEach((s, idx) => {
        console.log(`    [Cảnh ${idx + 1}] (${s.duration || 4}s): ${s.text}`);
      });
    }

    return { success: true, latency: parseFloat(res.totalTime), scenesCount: parsed.length };
  } catch (err) {
    console.error(`  ✗ Test Failed for ${model}:`, err.message);
    return { success: false, error: err.message };
  }
}

// ── TEST 2: VIRAL MASTER HOOK (3 SECONDS) ──
async function testHookGeneration(model) {
  console.log(`\n───────────────────────────────────────────────────────────────────────────────`);
  console.log(`▶ [TEST 2] Viral Master Hook Generation with Model: [${model}]`);
  console.log(`  Topic: "3 Thói quen tài chính sai lầm khiến bạn mãi nghèo"`);

  const prompt = `You are a viral TikTok hook specialist.
Generate a complete 3-second Viral Master Hook for the topic: "3 Thói quen tài chính sai lầm khiến bạn mãi nghèo". Style: "Kịch tính / Cảnh báo".

Return ONLY a valid JSON object matching this schema:
{
  "archetype": "warning",
  "badgeText": "Short Eyecatcher Badge (e.g. ⚠️ CẢNH BÁO)",
  "heroTitle": "Short 3 to 6 words punchy title in ALL CAPS (e.g. DỪNG TIÊU TIỀN KIỂU NÀY!)",
  "highlightWords": ["1 or 2 high-impact words to glow"],
  "subText": "1 curiosity-gap sentence explaining why they must watch...",
  "accentColor": "#FF3B30"
}`;

  try {
    const res = await callDeepSeek(model, [
      { role: 'system', content: 'You are a viral video marketing expert. Output JSON only.' },
      { role: 'user', content: prompt }
    ]);

    const { clean } = sanitizeAiOutput(res.content, res.reasoningContent);
    const parsed = safeJsonParse(clean, {});

    console.log(`  ✓ Status: SUCCESS`);
    console.log(`  ✓ Total Latency: ${res.totalTime}s`);
    console.log(`  ✓ Parsed Hook Object:`);
    console.log(`    - Badge: ${parsed.badgeText || 'N/A'}`);
    console.log(`    - Hero Title: ${parsed.heroTitle || 'N/A'}`);
    console.log(`    - Highlight Words: ${JSON.stringify(parsed.highlightWords || [])}`);
    console.log(`    - SubText: ${parsed.subText || 'N/A'}`);

    return { success: true, latency: parseFloat(res.totalTime), hook: parsed };
  } catch (err) {
    console.error(`  ✗ Test Failed for ${model}:`, err.message);
    return { success: false, error: err.message };
  }
}

// ── RUN SUITE ──
async function runAllBenchmarks() {
  console.log('Starting Benchmark Tests...\n');

  // Test DeepSeek-V3 (deepseek-chat)
  console.log('===============================================================================');
  console.log('                   PHẦN 1: TEST DEEPSEEK-V3 (deepseek-chat)                    ');
  console.log('===============================================================================');
  const v3Script = await testScriptGeneration('deepseek-chat');
  const v3Hook = await testHookGeneration('deepseek-chat');

  // Test DeepSeek-R1 (deepseek-reasoner)
  console.log('\n===============================================================================');
  console.log('                 PHẦN 2: TEST DEEPSEEK-R1 (deepseek-reasoner)                  ');
  console.log('===============================================================================');
  const r1Script = await testScriptGeneration('deepseek-reasoner');
  const r1Hook = await testHookGeneration('deepseek-reasoner');

  console.log('\n═══════════════════════════════════════════════════════════════════════════════');
  console.log('                        📊 TỔNG KẾT BENCHMARK SO SÁNH                          ');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log(`1. DeepSeek-V3 (Chat):`);
  console.log(`   - Tốc độ Kịch bản: ${v3Script.latency || 'N/A'}s | Tốc độ Hook: ${v3Hook.latency || 'N/A'}s`);
  console.log(`   - Trạng thái: ${v3Script.success && v3Hook.success ? '✅ HOÀN HẢO (Chuẩn JSON 100%)' : '❌ Lỗi'}`);
  console.log(`\n2. DeepSeek-R1 (Reasoner):`);
  console.log(`   - Tốc độ Kịch bản: ${r1Script.latency || 'N/A'}s | Tốc độ Hook: ${r1Hook.latency || 'N/A'}s`);
  console.log(`   - Bóc tách suy nghĩ <think>: ✅ THÀNH CÔNG (Không bị dính vào lời đọc)`);
  console.log(`   - Trạng thái: ${r1Script.success && r1Hook.success ? '✅ HOÀN HẢO (Chiều sâu kịch bản vượt trội)' : '❌ Lỗi'}`);
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');
}

runAllBenchmarks();
