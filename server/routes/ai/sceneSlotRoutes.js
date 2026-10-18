import { Router } from 'express';
import { callGemini } from '../../services/geminiService.js';
import { callDeepSeek } from '../../services/deepseekService.js';
import { safeJsonParse } from '../../services/jsonRepairService.js';
import { checkAiQuota } from '../../middlewares/aiQuotaMiddleware.js';
import { getFrameworkInstruction, getAntiHallucinationPrompt } from '../../prompts/aiViralFrameworks.js';
import { sanitizeBannedWords } from '../../services/scenePostProcessor.js';
import { resolveAiVideoLimits } from '../../utils/aiVideoLimits.js';
import { enrichChemData, enrichChemScenes } from '../../services/chemEnrichment.js';
import { DEFAULT_GEMINI_MODEL } from '../../../src/config/aiModels.js';

const router = Router();

const SLOT_DECISION_CATALOG = `
AVAILABLE WIDGETS & SCHEMAS:
1. STEM & Science ('stem'):
   - 'latex-formula': Slots: { "latex": "string (valid KaTeX LaTeX expression)", "badge": "string (optional short badge)" }
   - 'math-plot': Slots: { "expression": "string, math.js syntax in x (e.g. 0.25*x^3 - x, sin(x), exp(x)); never JavaScript, no Math.*", "latexLabel": "string", "mode": "function|trig_circle|calculus_area" }
   - 'chemical-molecule': Slots: { "name": "English or IUPAC compound name used for PubChem lookup (e.g. Caffeine, Ethanol, Glucose)", "displayName": "Vietnamese display name" } (never write SMILES or formulas: the system looks them up)
   - 'interactive-quiz': Slots: { "question": "string", "options": [{"id":"A","text":"..."},{"id":"B","text":"..."}], "correctId": "string", "explanation": "string" }

2. Diagram & Flow ('diagram'):
   - 'flowchart': Slots: { "steps": [{"title":"Step title", "subtitle":"Brief description"}] } (3-4 steps)
   - 'roadmap-flow': Slots: { "milestones": [{"phase":"Giai đoạn 1", "title":"...", "time":"..."}] }

3. Data & Charts ('chart'):
   - 'chart-bar': Slots: { "chartData": [{"label":"...", "value": number, "unit":"%"}] }
   - 'stat-big': Slots: { "statValue": "string (e.g. 99%, 10x)", "statLabel": "string", "subLabel": "string" }

4. Comparison & Evidence ('comparison'):
   - 'vs-battle': Slots: { "leftTitle": "string", "rightTitle": "string", "criteria": [{"label":"...", "leftVal":"...", "rightVal":"..."}] }
   - 'social-callout': Slots: { "variant": "bank|tweet|chat", "accountName": "string", "message": "string", "amount": "+50,000,000 đ (nếu là bank)" }

5. Lists & Bullets ('bullets'):
   - 'highlight-box': Slots: { "items": ["point 1", "point 2", "point 3"], "variant": "bullet-list | callout-card | multi-pill | glow-pill" } (bullet-list: 2-4 ý; callout-card: 1 câu đúc kết; multi-pill: 3-5 từ khoá ngắn; glow-pill: 1 câu kêu gọi hành động)

6. General & Evidence ('general'):
   - 'quote-box': Slots: { "content": "quote text", "author": "name" }
   - 'document-evidence': Slots: { "variant": "highlighter|stamp", "docTitle": "string", "highlightedText": "string", "stampText": "string" }
`;

router.post('/scene-slot-decision', checkAiQuota, async (req, res) => {
  const {
    prompt,
    targetArchetype,
    preferredElement,
    prevScene,
    nextScene,
    apiKey,
    deepseekApiKey,
    aiEngineMode = 'hybrid',
    scriptModel = DEFAULT_GEMINI_MODEL,
  } = req.body;

  const rawKey = (apiKey || '').trim();
  const rawDsKey = (deepseekApiKey || '').trim();
  const effectiveGeminiKey = rawKey.startsWith('sk-') ? '' : rawKey;
  const effectiveDeepseekKey = rawDsKey || (rawKey.startsWith('sk-') ? rawKey : '');

  if (!effectiveGeminiKey && !effectiveDeepseekKey) {
    return res.status(401).json({ error: 'Missing API Key (Vui lòng cấu hình Gemini hoặc DeepSeek API Key)' });
  }

  // 1. Build concise narrative-aware prompt
  const prevContext = prevScene?.voiceoverText
    ? `Previous scene voiceover: "${prevScene.voiceoverText}" (Widget used: ${prevScene.primaryWidgetType || 'unknown'})`
    : 'Previous scene: None (Start of sequence)';
  const nextContext = nextScene?.voiceoverText
    ? `Next scene voiceover: "${nextScene.voiceoverText}"`
    : 'Next scene: None (End of sequence)';

  const systemInstruction = `You are a high-speed Decision Engine for Studio NLE videos.
Make an instant slot-filling decision for ONE single scene.

${SLOT_DECISION_CATALOG}

CRITICAL RULES:
1. Anti-Repeat: If previous scene used a widget (e.g. ${prevScene?.primaryWidgetType || 'none'}), prioritize choosing a complementary widget.
2. Narrative Bridge: Write a crisp, authentic voiceover in Vietnamese (14 to 22 words) linking the previous scene to this concept. Use natural punctuation (comma, ellipsis) for TTS pauses.
3. Type-Safe Slots: Fill only the relevant slots for the chosen widget. No extra fields, no coordinates, no style bloat.

OUTPUT FORMAT (STRICT JSON ONLY, no markdown, no conversational commentary):
{
  "archetype": "${targetArchetype || 'stem'}",
  "widgetType": "${preferredElement || 'latex-formula'}",
  "title": "Short title in Vietnamese",
  "voiceoverText": "Lời thoại dẫn dắt ngắn gọn bằng tiếng Việt...",
  "slots": {}
}`;

  const userQuery = `CONTEXT:
- ${prevContext}
- ${nextContext}
- User Request / Topic: "${prompt || 'Tạo cảnh trực quan'}"
${targetArchetype ? `- Required Archetype: ${targetArchetype}` : ''}
${preferredElement ? `- Preferred Widget: ${preferredElement}` : ''}

Choose the best widget and populate the slots JSON now:`;

  const fullPrompt = `${systemInstruction}\n\n${userQuery}`;

  // 2. Fast AI Invocation
  try {
    let rawResponse = '';
    const shouldUseDeepSeek =
      (aiEngineMode === 'deepseek' || scriptModel?.startsWith('deepseek')) && effectiveDeepseekKey;

    if (shouldUseDeepSeek) {
      const dsRes = await callDeepSeek(effectiveDeepseekKey, fullPrompt, {
        model: scriptModel.includes('reasoner') ? 'deepseek-reasoner' : 'deepseek-chat',
        temperature: 0.3,
        maxTokens: 500,
      });
      rawResponse = dsRes.text || '';
    } else {
      const geminiRes = await callGemini(effectiveGeminiKey, fullPrompt, {
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });
      rawResponse = geminiRes.text || '';
    }

    const envelope = safeJsonParse(rawResponse, null);
    if (!envelope || !envelope.widgetType || !envelope.slots) {
      return res.status(422).json({
        error: 'AI không tạo đúng cấu trúc Slot Envelope',
        raw: rawResponse,
      });
    }

    // Phân tử: SMILES/công thức lấy từ PubChem, không tin dữ liệu AI
    if (envelope.widgetType === 'chemical-molecule') envelope.slots = await enrichChemData(envelope.slots);

    return res.json({
      success: true,
      envelope,
    });
  } catch (err) {
    console.error('[sceneSlotRoutes] Error generating slot decision:', err);
    return res.status(500).json({
      error: err.message || 'Lỗi xử lý quyết định cảnh AI',
    });
  }
});

/**
 * POST /api/ai/video-slot-decision
 * Ultra-fast TypeSafe Video Sequence Generator.
 * Generates an entire structured video envelope (<600 tokens) with 0 pixel coordinates.
 */
router.post('/video-slot-decision', checkAiQuota, async (req, res) => {
  const {
    topic,
    sceneCount = 4,
    targetDuration = 18,
    authorName = 'TinhVo Digital',
    targetAudience,
    style = '',
    viralFramework,
    sourceMaterial = '',
    aiBannedWords = [],
    aiHumanizerEnabled = true,
    variationSeed,
    apiKey,
    deepseekApiKey,
    aiEngineMode = 'hybrid',
    scriptModel = DEFAULT_GEMINI_MODEL,
  } = req.body;

  const rawKey = (apiKey || '').trim();
  const rawDsKey = (deepseekApiKey || '').trim();
  const effectiveGeminiKey = rawKey.startsWith('sk-') ? '' : rawKey;
  const effectiveDeepseekKey = rawDsKey || (rawKey.startsWith('sk-') ? rawKey : '');

  if (!effectiveGeminiKey && !effectiveDeepseekKey) {
    return res.status(401).json({ error: 'Missing API Key (Vui lòng cấu hình Gemini hoặc DeepSeek API Key)' });
  }

  // Kẹp theo gói: video dài hơn gói → 403 trước khi tốn token
  try {
    resolveAiVideoLimits(req.aiUser, { durationSec: Number(targetDuration) || 18, sceneCount });
  } catch (limitErr) {
    return res.status(limitErr.statusCode || 403).json(limitErr.toJSON());
  }

  const count = Math.max(3, Math.min(8, Number(sceneCount) || 4));
  const perSceneDuration = Math.round((Number(targetDuration) || 18) / count * 10) / 10;

  const systemInstruction = `You are a world-class Video Director and System One Cognitive Architect for Studio NLE.
Plan a cohesive, high-retention multi-scene video script for short-form social video (TikTok/Reels/Shorts).

${SLOT_DECISION_CATALOG}

STRICT ARCHITECTURE RULES:
1. Narrative Arc:
   - Scene 1: temporalRole = 'hook' (Paradox, counter-intuitive question, or shocking fact to hook viewers in 3 seconds).
   - Middle Scenes (2 to ${count - 1}): temporalRole = 'normal' or 'highlight' (Step-by-step logic, mathematical principles, data evidence, or process diagrams).
   - Final Scene (${count}): temporalRole = 'cta' (Practical takeaway, key checklist, or clear call to action).
2. Anti-Monotony Guard:
   - NEVER use the same widgetType more than twice across the entire video.
   - Alternate archetypes for maximum dynamic pacing (e.g. general -> stem -> diagram -> bullets).
3. Authentic Voiceover:
   - Language: Pure Vietnamese (tiếng Việt tự nhiên, lôi cuốn, văn phong studio).
   - Pacing: Exactly 15 to 22 words per scene so it reads comfortably in ~${perSceneDuration} seconds.
   - Use commas and periods for natural TTS pauses.
4. Type-Safe Slots:
   - Fill ONLY the slots matching the chosen widgetType. No coordinates, no CSS, no visual styling.
5. Voice-Sync:
   - "anchorWord": exact word or 2-word phrase copied from that scene's voiceoverText at the moment the widget should appear (the word naming what the widget shows).
   - "emphasisWord" (optional): another exact word from voiceoverText to pulse the widget on (a key number or claim).
   - "energy": 0.0-1.0 emotional intensity of the scene (shock/peak ≈ 0.9, explanation ≈ 0.5, calm takeaway ≈ 0.3). Vary it across scenes to create rhythm.
6. Framework & Style:
   - Follow the narrative framework below. When it names a widget that is not in AVAILABLE WIDGETS, use the closest available widget instead.
   - Match the style & tone of voice in vocabulary, sentence rhythm and widget choice.

${getFrameworkInstruction(viralFramework)}
${style ? `\nSTYLE & TONE OF VOICE: "${style}"` : ''}
${getAntiHallucinationPrompt(sourceMaterial)}

OUTPUT FORMAT (STRICT JSON ONLY, no markdown, no explanation):
{
  "videoTitle": "Tiêu đề video ngắn gọn, ấn tượng",
  "hudTopic": "Chủ đề chính",
  "targetDuration": ${targetDuration},
  "scenes": [
    {
      "temporalRole": "hook",
      "archetype": "general",
      "widgetType": "quote-box",
      "title": "Tên cảnh ngắn gọn",
      "voiceoverText": "Lời thoại dẫn dắt bằng tiếng Việt...",
      "targetDuration": ${perSceneDuration},
      "slots": {},
      "anchorWord": "từ khoá trong voiceoverText",
      "emphasisWord": "",
      "energy": 0.9,
      "sfxHint": { "primary": "boom", "secondary": "whoosh" }
    }
  ]
}`;

  const userQuery = `TOPIC / USER REQUEST:
"${topic || 'Bí mật khoa học đằng sau các hiện tượng đời sống'}"
${targetAudience ? `- Target Audience: ${targetAudience}` : ''}
- Required Scene Count: ${count} scenes
- Total Target Duration: ~${targetDuration} seconds

Create the complete VideoSlotEnvelope JSON now:`;

  const fullPrompt = `${systemInstruction}\n\n${userQuery}`;
  // "Phương án khác" cần đa dạng hơn lần sinh đầu
  const sampleTemperature = variationSeed ? 0.8 : 0.3;

  try {
    let rawResponse = '';
    const shouldUseDeepSeek =
      (aiEngineMode === 'deepseek' || scriptModel?.startsWith('deepseek')) && effectiveDeepseekKey;

    if (shouldUseDeepSeek) {
      const dsRes = await callDeepSeek(effectiveDeepseekKey, fullPrompt, {
        model: scriptModel.includes('reasoner') ? 'deepseek-reasoner' : 'deepseek-chat',
        temperature: sampleTemperature,
        maxTokens: 1200,
      });
      rawResponse = dsRes.text || '';
    } else {
      const geminiRes = await callGemini(effectiveGeminiKey, fullPrompt, {
        config: {
          responseMimeType: 'application/json',
          temperature: sampleTemperature,
        },
      });
      rawResponse = geminiRes.text || '';
    }

    const envelope = safeJsonParse(rawResponse, null);
    if (!envelope || !Array.isArray(envelope.scenes) || envelope.scenes.length === 0) {
      return res.status(422).json({
        error: 'AI không tạo đúng cấu trúc VideoSlotEnvelope',
        raw: rawResponse,
      });
    }

    // Màu do client tự resolve từ palette; không tin giá trị màu từ LLM
    delete envelope.accentColor;
    envelope.authorName = envelope.authorName || authorName;
    envelope.scenes = envelope.scenes.map((scene) => ({
      ...scene,
      voiceoverText: sanitizeBannedWords(scene.voiceoverText || '', aiBannedWords, aiHumanizerEnabled),
      title: sanitizeBannedWords(scene.title || '', aiBannedWords, aiHumanizerEnabled),
    }));
    envelope.scenes = await enrichChemScenes(envelope.scenes);

    return res.json({
      success: true,
      videoEnvelope: envelope,
    });
  } catch (err) {
    console.error('[sceneSlotRoutes] Error generating video slot decision:', err);
    return res.status(500).json({
      error: err.message || 'Lỗi xử lý tạo kịch bản video AI',
    });
  }
});

export default router;
