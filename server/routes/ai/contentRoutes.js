import { Router } from 'express';
import { callGemini } from '../../services/geminiService.js';
import { callDeepSeek } from '../../services/deepseekService.js';
import { safeJsonParse } from '../../services/jsonRepairService.js';
import { telemetry } from '../../services/telemetryService.js';
import { checkAiQuota } from '../../middlewares/aiQuotaMiddleware.js';
import { generateSocialCaptionPrompt } from '../../prompts/aiSocialPrompt.js';
import { sanitizeBannedWords } from '../../services/scenePostProcessor.js';
import { HUMANIZER_PROMPT_CLICHÉS } from '../../../src/config/aiBannedWordsConfig.js';
import { DEFAULT_GEMINI_MODEL } from '../../../src/config/aiModels.js';

const router = Router();

// 1. Generate Script (Hybrid: DeepSeek Reasoning + Gemini Fallback)
router.post('/script', checkAiQuota, async (req, res) => {
  telemetry.recordRequest('/api/ai/script');
  const { 
    prompt, 
    style, 
    apiKey, 
    deepseekApiKey, 
    provider = 'hybrid', 
    model = 'deepseek-reasoner',
    aiBannedWords = [],
    aiHumanizerEnabled = true
  } = req.body;

  let effectiveApiKey = apiKey;
  let effectiveDeepseekKey = deepseekApiKey;
  if (effectiveApiKey && effectiveApiKey.startsWith('sk-') && !effectiveDeepseekKey) {
    effectiveDeepseekKey = effectiveApiKey;
    effectiveApiKey = null;
  }

  const effectiveBannedWords = Array.isArray(aiBannedWords) ? aiBannedWords.filter(w => typeof w === 'string' && w.trim()) : [];
  let negativeConstraints = '';
  if (effectiveBannedWords.length > 0) {
    negativeConstraints += `\nTUYỆT ĐỐI KHÔNG dùng các từ cấm sau: [${effectiveBannedWords.join(', ')}]. Thay bằng từ ngữ tự nhiên đời thường.`;
  }
  if (aiHumanizerEnabled) {
    negativeConstraints += `\nVĂN PHONG TỰ NHIÊN: Lời thoại như người thật nói chuyện, tránh các từ sáo rỗng AI (như ${HUMANIZER_PROMPT_CLICHÉS.join(', ')}).`;
  }

  const fullPrompt = `Hãy viết kịch bản video ngắn (Short/TikTok) về chủ đề: "${prompt}". Phong cách: ${style}. ${negativeConstraints}
Trình bày kết quả dưới định dạng JSON nguyên chuẩn (không markdown, không bọc \`\`\`json).
Định dạng mảng các đối tượng Scene, mỗi object gồm:
[
  {
    "text": "lời đọc cho cảnh này (tối đa 2-3 câu)",
    "duration": thời lượng ước tính bằng giây (số nguyên, ví dụ: 4)
  }
]`;

  const cleanScenes = (rawList) => {
    if (!Array.isArray(rawList)) return [];
    return rawList.map(s => ({
      ...s,
      text: sanitizeBannedWords(s.text || '', effectiveBannedWords, aiHumanizerEnabled)
    }));
  };

  // 1. Priority: DeepSeek if configured
  if ((provider === 'deepseek' || provider === 'hybrid') && effectiveDeepseekKey) {
    try {
      const dsRes = await callDeepSeek(effectiveDeepseekKey, [
        { role: 'system', content: 'You are an elite short-video viral scriptwriter. Return ONLY a valid JSON array.' },
        { role: 'user', content: fullPrompt }
      ], { model: model || 'deepseek-reasoner' });

      const parsedScenes = safeJsonParse(dsRes.text, []);
      const data = cleanScenes(parsedScenes);
      if (Array.isArray(data) && data.length > 0) {
        if (req.incrementAiUsage) await req.incrementAiUsage();
        return res.json({
          scenes: data,
          reasoning: dsRes.reasoning || '',
          provider: 'deepseek',
          model: dsRes.model,
          fallback: false
        });
      }
    } catch (dsErr) {
      console.warn('[DeepSeek Script Error - Auto-falling back to Gemini]:', dsErr.message);
    }
  }

  // 2. Primary / Fallback: Google Gemini
  if (!effectiveApiKey) {
    return res.status(401).json({ error: 'Missing API Key (Cần có Gemini API Key hoặc DeepSeek API Key)' });
  }

  try {
    const response = await callGemini(effectiveApiKey, fullPrompt, {
      config: { responseMimeType: 'application/json' }
    });

    const rawJson = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    const parsedScenes = safeJsonParse(rawJson, []);
    const data = cleanScenes(parsedScenes);
    if (req.incrementAiUsage) await req.incrementAiUsage();
    res.json({
      scenes: data,
      reasoning: '',
      provider: 'gemini',
      model: DEFAULT_GEMINI_MODEL,
      fallback: provider === 'deepseek'
    });
  } catch (err) {
    console.error('Error generating script:', err);
    res.status(500).json({ error: 'Failed to generate script: ' + err.message });
  }
});

// 2. AI Generate Master Hook (Hybrid: DeepSeek + Gemini Fallback)
router.post('/hook', checkAiQuota, async (req, res) => {
  telemetry.recordRequest('/api/ai/hook');
  const { 
    topic, 
    style, 
    apiKey, 
    deepseekApiKey, 
    provider = 'hybrid', 
    model = 'deepseek-chat',
    aiBannedWords = [],
    aiHumanizerEnabled = true
  } = req.body;

  let effectiveApiKey = apiKey;
  let effectiveDeepseekKey = deepseekApiKey;
  if (effectiveApiKey && effectiveApiKey.startsWith('sk-') && !effectiveDeepseekKey) {
    effectiveDeepseekKey = effectiveApiKey;
    effectiveApiKey = null;
  }

  const effectiveBannedWords = Array.isArray(aiBannedWords) ? aiBannedWords.filter(w => typeof w === 'string' && w.trim()) : [];
  let negativeConstraints = '';
  if (effectiveBannedWords.length > 0) {
    negativeConstraints += `\nFORBIDDEN WORDS: DO NOT USE [${effectiveBannedWords.join(', ')}].`;
  }
  if (aiHumanizerEnabled) {
    negativeConstraints += `\nNATURAL TONE: Punchy, modern, avoid tired robotic AI clichés such as: ${HUMANIZER_PROMPT_CLICHÉS.join(', ')}.`;
  }

  const fullPrompt = `You are a viral TikTok hook specialist.
Generate a complete 3-second Viral Master Hook for the topic: "${topic}". Style: "${style || 'Viral / Năng Động'}". ${negativeConstraints}

Return ONLY a valid JSON object matching this schema:
{
  "archetype": "warning" | "tips" | "curiosity" | "secret" | "versus" | "healing",
  "badgeText": "Short Eyecatcher Badge (e.g. ⚠️ CẢNH BÁO, 🔥 TOP 3 BÍ KÍP, ✦ BÍ MẬT ✦)",
  "heroTitle": "Short 3 to 6 words punchy title in ALL CAPS (e.g. DỪNG LÀM ĐIỀU NÀY!)",
  "highlightWords": ["1 or 2 high-impact words to glow"],
  "subText": "1 curiosity-gap sentence explaining why they must watch...",
  "accentColor": "#BEFF01" | "#FF3B30" | "#00D4FF" | "#FFD700" | "#A855F7" | "#86EFAC"
}`;

  const cleanHook = (hook) => {
    if (!hook || typeof hook !== 'object') return hook;
    return {
      ...hook,
      badgeText: typeof hook.badgeText === 'string' ? sanitizeBannedWords(hook.badgeText, effectiveBannedWords, aiHumanizerEnabled) : hook.badgeText,
      heroTitle: typeof hook.heroTitle === 'string' ? sanitizeBannedWords(hook.heroTitle, effectiveBannedWords, aiHumanizerEnabled) : hook.heroTitle,
      subText: typeof hook.subText === 'string' ? sanitizeBannedWords(hook.subText, effectiveBannedWords, aiHumanizerEnabled) : hook.subText,
    };
  };

  // 1. Try DeepSeek if configured
  if ((provider === 'deepseek' || provider === 'hybrid') && effectiveDeepseekKey) {
    try {
      const dsRes = await callDeepSeek(effectiveDeepseekKey, [
        { role: 'system', content: 'You are a viral TikTok hook specialist. Return ONLY a valid JSON object.' },
        { role: 'user', content: fullPrompt }
      ], { model: model || 'deepseek-chat' });

      const hookObj = safeJsonParse(dsRes.text, null);
      if (hookObj && hookObj.heroTitle) {
        if (req.incrementAiUsage) await req.incrementAiUsage();
        return res.json({
          ...cleanHook(hookObj),
          _provider: 'deepseek',
          _reasoning: dsRes.reasoning || ''
        });
      }
    } catch (dsErr) {
      console.warn('[DeepSeek Hook Error - Auto-falling back to Gemini]:', dsErr.message);
    }
  }

  // 2. Primary / Fallback: Gemini
  if (!effectiveApiKey) return res.status(401).json({ error: 'Missing API Key (Gemini hoặc DeepSeek)' });

  try {
    const response = await callGemini(effectiveApiKey, fullPrompt, {
      config: { responseMimeType: 'application/json' }
    });
    const rawJson = (response.text || '').trim();
    const hookObj = safeJsonParse(rawJson, {});
    if (req.incrementAiUsage) await req.incrementAiUsage();
    res.json({ ...cleanHook(hookObj), _provider: 'gemini' });
  } catch (err) {
    console.error('Error generating hook:', err);
    res.status(500).json({ error: 'Failed to generate hook: ' + err.message });
  }
});

// 3. AI Extract Emoji
router.post('/emoji', async (req, res) => {
  telemetry.recordRequest('/api/ai/emoji');
  const { text, apiKey } = req.body;
  if (!apiKey) return res.status(401).json({ error: 'Missing Gemini API Key' });

  try {
    const fullPrompt = `Đọc nội dung sau: "${text}". Chọn ra 1 đến 3 emoji phù hợp nhất với nội dung này.
Chỉ trả về các emoji, cách nhau bởi khoảng trắng. Không giải thích.`;

    const response = await callGemini(apiKey, fullPrompt);
    const emojis = response.text ? response.text.trim().split(/\s+/) : [];
    res.json({ emojis: emojis.filter(e => e) });
  } catch (err) {
    console.error('Error extracting emoji:', err);
    res.status(500).json({ error: 'Failed to extract emoji: ' + err.message });
  }
});

// 4. AI Suggest Style
router.post('/suggest-style', async (req, res) => {
  telemetry.recordRequest('/api/ai/suggest-style');
  const { prompt, apiKey, deepseekApiKey } = req.body;
  let effectiveApiKey = apiKey;
  let effectiveDeepseekKey = deepseekApiKey;
  if (effectiveApiKey && effectiveApiKey.startsWith('sk-') && !effectiveDeepseekKey) {
    effectiveDeepseekKey = effectiveApiKey;
    effectiveApiKey = null;
  }

  if (!effectiveApiKey && !effectiveDeepseekKey) {
    return res.status(401).json({ error: 'Missing API Key (Gemini hoặc DeepSeek)' });
  }

  const fullPrompt = `Đọc ý tưởng video ngắn (TikTok/Shorts) sau: "${prompt}".
Hãy sáng tạo ra MỘT câu văn ngắn (dưới 15 chữ) mô tả một "Phong cách & Giọng điệu" cực kỳ hấp dẫn, độc đáo, và hoàn toàn phù hợp với ý tưởng này để tôi có thể dùng làm chỉ thị (style) cho AI thiết kế video. 
Không cần giải thích, không dùng ngoặc kép, trả về một câu duy nhất.
Ví dụ nếu chủ đề là công nghệ: "Giọng điệu chuyên gia, phân tích sắc sảo, nhịp điệu nhanh nhạy".
Ví dụ nếu chủ đề dọn dẹp: "Chữa lành, nhẹ nhàng, ASMR, góc quay chậm rãi".`;

  try {
    if (effectiveDeepseekKey && !effectiveApiKey) {
      const dsRes = await callDeepSeek(effectiveDeepseekKey, [{ role: 'user', content: fullPrompt }], { model: 'deepseek-chat' });
      const suggestedStyle = dsRes.text || 'Năng động, cuốn hút, nhịp điệu nhanh';
      return res.json({ style: suggestedStyle.trim().replace(/^"|"$/g, '') });
    }

    const response = await callGemini(effectiveApiKey, fullPrompt);
    const suggestedStyle = response.text || 'Năng động, cuốn hút, nhịp điệu nhanh';
    res.json({ style: suggestedStyle.trim().replace(/^"|"$/g, '') });
  } catch (err) {
    console.error('Error suggesting style:', err);
    res.status(500).json({ error: 'Failed to suggest style: ' + err.message });
  }
});

// TypeSafe JEV Extractor & Hydrator cho Social Caption
function hydrateSocialCaptionEnvelope(rawText, scriptContext, defaultCta) {
  const fallbackScript = scriptContext || 'Video ngắn sáng tạo.';
  
  let rawObj = null;
  try {
    // 1. Strip markdown fences (nếu có ```json ... ```)
    let cleanedText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    rawObj = JSON.parse(cleanedText);
  } catch (e) {
    console.warn('[JEV Warning] Failed to parse JSON, falling back to heuristics.');
  }

  const payload = rawObj?.payload || rawObj || {};
  const youtube = payload.youtube || {};
  const tiktok = payload.tiktok || {};
  const pinnedComment = payload.pinnedComment || {};

  // 2. Heuristic Healing & Type Coercion
  let curatedHashtags = payload.curatedHashtags || [];
  if (!Array.isArray(curatedHashtags)) curatedHashtags = [];
  if (curatedHashtags.length > 5) curatedHashtags = curatedHashtags.slice(0, 5); // Clamping

  return {
    schemaVersion: '2.0',
    targetNiche: rawObj?.targetNiche || 'general',
    payload: {
      youtube: {
        titleViral: youtube.titleViral || youtube.title_viral || fallbackScript.slice(0, 60),
        titleSeo: youtube.titleSeo || youtube.title_seo || fallbackScript.slice(0, 60),
        description: youtube.description || fallbackScript.slice(0, 200) + `\n\n${defaultCta}`
      },
      tiktok: {
        title: tiktok.title || fallbackScript.slice(0, 50),
        caption: tiktok.caption || fallbackScript.slice(0, 150) + `\n\n${defaultCta}`
      },
      pinnedComment: {
        question: pinnedComment.question || 'Bạn thuộc team nào trong video này?',
        callout: pinnedComment.callout || 'Để lại bình luận bên dưới nhé 👇'
      },
      curatedHashtags
    },
    metrics: {
      hookStrength: rawObj?.metrics?.hookStrength || 'medium',
      antiAiCompliance: rawObj?.metrics?.antiAiCompliance ?? true
    }
  };
}

// 5. Tạo Social Caption & Hashtags (SEO & Brand Kit - TypeSafe JEV)
router.post('/social-caption', async (req, res) => {
  try {
    const { script, brandingSettings, language = 'vi', niche = 'tech', apiKey: bodyApiKey } = req.body;
    
    if (!script) {
      return res.status(400).json({ error: 'Missing script content' });
    }

    const authHeader = req.headers.authorization;
    const headerApiKey = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const apiKey = bodyApiKey || headerApiKey || process.env.GEMINI_API_KEY;

    const defaultCta = brandingSettings?.defaultCta || '👉 Đăng ký kênh để xem thêm!';

    if (!apiKey) {
      // Offline fallback with 100% TypeSafe Schema
      return res.json(hydrateSocialCaptionEnvelope('', script, defaultCta));
    }

    const prompt = generateSocialCaptionPrompt(script, brandingSettings, language, niche);
    const { text } = await callGemini(apiKey, prompt, { 
      maxAttempts: 2,
      config: { responseMimeType: 'application/json' }
    });
    
    const validEnvelope = hydrateSocialCaptionEnvelope(text, script, defaultCta);
    res.json(validEnvelope);
    telemetry.recordToolUsage('ai_social_caption');
  } catch (error) {
    console.error('[AI Social Caption Error]', error);
    const defaultCta = req.body.brandingSettings?.defaultCta || '👉 Đăng ký kênh nhé!';
    const script = req.body.script || '';
    
    // Offline fallback on error (Zero-crash guarantee)
    res.json(hydrateSocialCaptionEnvelope('', script, defaultCta));
  }
});

export default router;
