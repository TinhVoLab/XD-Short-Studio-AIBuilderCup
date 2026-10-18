import { Router } from 'express';
import { callGemini } from '../../services/geminiService.js';
import { callDeepSeek } from '../../services/deepseekService.js';
import { safeJsonParse } from '../../services/jsonRepairService.js';
import { getRelevant3dAssets } from '../../config/styleAssetMapping.js';
import { getCompiledLayoutRules } from '../../prompts/aiPromptTemplates.js';
import { getOptimizedGraphicCatalog, calculateTimelineSceneY } from '../../services/semanticContextRouter.js';
import { HOOK_INTENTS } from '../../../src/config/hookDesigner.js';
import { getFrameworkInstruction, getAntiHallucinationPrompt } from '../../prompts/aiViralFrameworks.js';
import { getRetentionScriptPrompt, getRetentionDesignPrompt } from '../../prompts/aiRetentionBeats.js';
import { getSilhouettePlanPrompt, LEGACY_THREE_LAYER_FORMULA } from '../../prompts/aiSceneSilhouettes.js';
import { postProcessGeneratedScenes } from '../../services/scenePostProcessor.js';
import { aiCache } from '../../services/cacheService.js';
import { checkAiQuota } from '../../middlewares/aiQuotaMiddleware.js';
import { ELEMENTS_REGISTRY } from '../../../src/config/elementsRegistry.js';
import { HUMANIZER_PROMPT_CLICHÉS } from '../../../src/config/aiBannedWordsConfig.js';
import { resolveThemePalette } from '../../../src/config/themePalettes.js';
import { AppError } from '../../utils/AppError.js';
import { handleGlobalHttpError, normalizeError } from '../../services/errorRegistryService.js';
import { telemetry } from '../../services/telemetryService.js';
import { SPEECH_RATE_WPS } from '../../../src/config/pacingConfig.js';
import { aiLogService } from '../../services/aiLogService.js';
import { AI_TIMEOUTS, isReasonerModel, remainingMs, serverBudgetMs } from '../../../src/config/aiTimeouts.js';
import { resolveAiVideoLimits } from '../../utils/aiVideoLimits.js';
import { enrichChemData } from '../../services/chemEnrichment.js';
import { highlightSceneIndex } from '../../../src/config/sceneRoles.js';
import { isGeminiModel, resolveGeminiModel } from '../../../src/config/aiModels.js';

const router = Router();

export function getArchetypeDirective(targetArchetype, preferredElement) {
  if (!targetArchetype && !preferredElement) return '';

  if (targetArchetype === 'diagram') {
    return `
MANDATORY DIRECTIVE — ARCHETYPE: SƠ ĐỒ & LUỒNG QUY TRÌNH (DIAGRAM & FLOW):
- The primary visual widget (Layer 1) MUST BE one of the following dynamic flow components:
  * 'branching-flow': Cấu trúc phân nhánh các node với icon và label rõ ràng.
  * 'funnel-flow': Mô hình phễu lọc theo từng tầng hoặc chuyển đổi.
  * 'roadmap-flow': Lộ trình phát triển từng chặng hoặc timeline mốc thời gian.
  * 'data-flow': Luồng truyền dữ liệu giữa các thành phần hoặc hệ thống.
  * 'flowchart': Sơ đồ khối quy trình chuẩn (Bắt đầu -> Xử lý -> Rẽ nhánh -> Kết quả).
${preferredElement ? `- SPECIFIC USER SELECTION: You MUST prioritize using element type: '${preferredElement}'.` : ''}
- CRITICAL: Provide rich, authentic node data matching the topic. Absolutely DO NOT fallback to generic text or placeholder boxes!`;
  }

  if (targetArchetype === 'chart') {
    return `
MANDATORY DIRECTIVE — ARCHETYPE: BIỂU ĐỒ & SỐ LIỆU (DATA & CHARTS):
- The primary visual widget (Layer 1) MUST BE one of the following data visualization components:
  * 'racing-bar-chart': Biểu đồ đua cột động xếp hạng theo thời gian hoặc giai đoạn.
  * 'waterfall-chart': Biểu đồ thác nước bóc tách doanh thu, chi phí hoặc dòng tiền.
  * 'radar-chart': Biểu đồ mạng nhện đánh giá năng lực đa chiều (yêu cầu đúng 5 trục trong chartData).
  * 'chart-bar': Biểu đồ cột so sánh các chỉ số thực tế (yêu cầu content: "TIÊU ĐỀ", chartData: [{ label: "Chỉ số 1", value: 85, unit: "%" }, { label: "Chỉ số 2", value: 40, unit: "%" }]).
  * 'candlestick-chart': Biểu đồ nến phân tích thị trường tài chính / crypto.
  * 'circle-chart': Biểu đồ vòng cung phần trăm hoặc chu kỳ.
${preferredElement ? `- SPECIFIC USER SELECTION: You MUST prioritize using element type: '${preferredElement}'.` : ''}
- CRITICAL: Generate realistic, credible numbers and metrics matching the user prompt. DO NOT use generic text!`;
  }

  if (targetArchetype === 'bullets') {
    return `
MANDATORY DIRECTIVE — ARCHETYPE: DANH SÁCH & LỜI KHUYÊN (LISTS & BULLETS):
- The primary visual widget (Layer 1) MUST BE:
  * 'highlight-box' with variant: "bullet-list" (cấu trúc items: [{num:"01", text:"..."}, {num:"02", text:"..."}, {num:"03", text:"..."}]).
  * 'checklist': Danh sách các tiêu chí hoặc điều cần lưu ý (kèm checked: true/false).
  * 'highlight-box' with variant: "callout-card" (hộp đúc kết bài học đắt giá kèm tiêu đề).
${preferredElement ? `- SPECIFIC USER SELECTION: You MUST prioritize using element type: '${preferredElement}'.` : ''}
- CRITICAL: Crisp, concise bullet points (3 to 4 points max) with numbers ("01", "02", "03"). NO emoji characters!`;
  }

  if (targetArchetype === 'comparison') {
    return `
MANDATORY DIRECTIVE — ARCHETYPE: SO SÁNH & BẰNG CHỨNG (COMPARISON & SOCIAL PROOF):
- The primary visual widget (Layer 1) MUST BE:
  * 'vs-battle': So sánh đối đầu 2 giải pháp, sản phẩm hoặc cách làm (Cũ vs Mới, A vs B).
  * 'social-callout': Thông báo nổ biến động số dư ngân hàng (variant: 'bank'), hoặc trích dẫn Tweet KOLs (variant: 'tweet'), hoặc tin nhắn chốt đơn (variant: 'chat').
  * 'document-evidence': Hồ sơ đóng dấu tuyệt mật / cảnh báo (variant: 'stamp'), hoặc trích xuất tài liệu tô dạ quang (variant: 'highlighter'), hoặc giấy note lưu ý (variant: 'note').
${preferredElement ? `- SPECIFIC USER SELECTION: You MUST prioritize using element type: '${preferredElement}'.` : ''}
- CRITICAL: Sharp contrast between options, or authentic social proof data!`;
  }

  if (targetArchetype === 'general' && preferredElement) {
    return `
MANDATORY DIRECTIVE:
- The primary visual widget (Layer 1) MUST prioritize using element type: '${preferredElement}'.`;
  }

  return '';
}

// 1. AI Generate Full Scene Design
router.post('/scene-design', checkAiQuota, async (req, res) => {
  const {
    prompt,
    style,
    sceneCount,
    targetDurationSec,
    sourceMaterial,
    viralFramework,
    colorTheme,
    brandColor,
    suggestedFont,
    apiKey,
    deepseekApiKey,
    aiEngineMode = 'hybrid',
    scriptModel = 'deepseek-flash',
    customTemplates,
    autoPoseRules,
    suggestedHookLayout,
    aiBannedWords = [],
    aiHumanizerEnabled = true,
    targetArchetype,
    preferredElement,
    prevScene,
    nextScene,
    variationSeed = '',
    recentHookLayouts = [],
  } = req.body;

  // Smart Key Detection: Auto-detect if user entered a DeepSeek key (starts with sk-) into apiKey
  const rawKey = (apiKey || '').trim();
  const rawDsKey = (deepseekApiKey || '').trim();
  const effectiveGeminiKey = rawKey.startsWith('sk-') ? '' : rawKey;
  const effectiveDeepseekKey = rawDsKey || (rawKey.startsWith('sk-') ? rawKey : '');

  if (!effectiveGeminiKey && !effectiveDeepseekKey) {
    return res.status(401).json({ error: 'Missing API Key (Vui lòng nhập Gemini API Key hoặc DeepSeek API Key tại mục Cài đặt)' });
  }

  const isExplicitGemini = isGeminiModel(scriptModel);
  const isExplicitDeepSeek = scriptModel?.startsWith('deepseek');

  if (isExplicitGemini && !effectiveGeminiKey) {
    return res.status(400).json({
      error: 'Thiếu Gemini API Key. Bạn đã chọn mô hình kịch bản Gemini nhưng chưa cấu hình Gemini API Key trong Cài đặt.'
    });
  }
  if (isExplicitDeepSeek && !effectiveDeepseekKey) {
    return res.status(400).json({
      error: 'Thiếu DeepSeek API Key. Bạn đã chọn mô hình kịch bản DeepSeek nhưng chưa cấu hình DeepSeek API Key trong Cài đặt.'
    });
  }

  const requestStartTime = Date.now();
  let stage1Ms = 0;
  let stage2Ms = 0;
  let stage1Tokens = { promptTokens: 0, completionTokens: 0, reasoningTokens: 0, totalTokens: 0, promptCacheHitTokens: 0, promptCacheMissTokens: 0 };
  let stage2Tokens = { promptTokens: 0, completionTokens: 0, reasoningTokens: 0, totalTokens: 0, promptCacheHitTokens: 0, promptCacheMissTokens: 0 };
  let effectiveResolvedModel = scriptModel || (isExplicitGemini ? resolveGeminiModel(scriptModel) : 'deepseek-chat');

  const hasValidBrandColor = Boolean(brandColor && typeof brandColor === 'string' && /^#[0-9A-Fa-f]{3,8}$/.test(brandColor.trim()));
  const resolvedBrandHex = hasValidBrandColor ? brandColor.trim() : null;

  const resolvedPalette = resolveThemePalette(colorTheme);
  const ACCENT = resolvedBrandHex || resolvedPalette.tokens.accent;
  const BG_DARK = resolvedPalette.tokens.bg;
  const THEME_PRIMARY = ACCENT;
  const THEME_ANCHOR = resolvedPalette.tokens.surface;
  const THEME_SOFT = resolvedPalette.tokens.text;
  const SPACE_MODE = resolvedPalette.spaceMode;

  // ── Typography Token (driven by Video Style catalog) ──
  const FONT_PRIMARY = suggestedFont || 'Be Vietnam Pro';
  const FONT_RULE = `TYPOGRAPHY RULE — MANDATORY:
- ALL text elements (type:"text", type:"highlight-box", type:"quote-box", type:"badge") MUST use fontFamily:"${FONT_PRIMARY}" unless overridden by a specific layout rule above.
- This ensures visual identity is consistent with the selected video style.`;

  // Dynamic Word-Budget & Scene Count Calculation (Piecewise Mapping Fallback)
  const targetDuration = parseInt(targetDurationSec) || (parseInt(sceneCount) ? parseInt(sceneCount) * 6 : 30);
  let n = parseInt(sceneCount);
  if (!n || isNaN(n)) {
    // Piecewise mapping when sceneCount is not explicitly supplied by client
    if (targetDuration <= 20) n = 3;
    else if (targetDuration <= 40) n = 5;
    else if (targetDuration <= 55) n = 7;
    else if (targetDuration <= 75) n = 9;
    else n = Math.max(3, Math.min(20, Math.round(targetDuration / 7.0)));
  }
  // Kẹp theo gói: video dài hơn gói → 403 trước khi tốn token; số cảnh không vượt maxSceneCount
  try {
    n = resolveAiVideoLimits(req.aiUser, { durationSec: targetDuration, sceneCount: n }).sceneCount;
  } catch (limitErr) {
    return handleGlobalHttpError(limitErr, res, 'validation');
  }
  // Nhịp đọc SSOT (pacingConfig), cho phép dao động ±3-5s để kịch bản tự nhiên
  const totalWords = Math.round(targetDuration * SPEECH_RATE_WPS.vi);
  const wordsPerScene = Math.max(10, Math.round(totalWords / n));
  const bodySceneCount = Math.max(1, n - 2);
  const hookWordsMin = targetDuration <= 20 ? 6 : 7;
  const hookWordsMax = targetDuration <= 20 ? 8 : 11;
  const ctaWordsMin = targetDuration <= 20 ? 5 : 6;
  const ctaWordsMax = targetDuration <= 20 ? 7 : 9;
  const bodyWordsTarget = targetDuration <= 20
    ? 20
    : Math.max(14, Math.round((totalWords - (hookWordsMax + ctaWordsMax)) / bodySceneCount));

  const compiledLayoutRules = getCompiledLayoutRules(customTemplates, style, ACCENT);
  const { catalogPrompt: elementsCatalog, narrativeArcPrompt, activeDomains, recommendedSfxPrompt } = getOptimizedGraphicCatalog(ACCENT, style, prompt);
  const frameworkInstruction = getFrameworkInstruction(viralFramework);
  // Nhịp giữ chân (open loop / rehook / payoff) — vị trí cảnh từ SSOT cinematicRules
  // Cùng seed cho hook, bóng dáng cảnh và postProcessor: cùng yêu cầu → cùng phương án (cache an toàn)
  const directorSeed = variationSeed || `${prompt}|${style}`;
  // Template bố cục riêng của người dùng thì giữ công thức 3 lớp, không áp kế hoạch bóng dáng
  const silhouettePlanPrompt = customTemplates ? LEGACY_THREE_LAYER_FORMULA : getSilhouettePlanPrompt(n, directorSeed);
  const retentionScriptPrompt = getRetentionScriptPrompt(n);
  const retentionDesignPrompt = getRetentionDesignPrompt(n);
  const antiHallucinationPrompt = getAntiHallucinationPrompt(sourceMaterial);
  const relevant3dAssets = getRelevant3dAssets(style, prompt);

  // 📐 FORMULA Y = f(X): Semantic Intent Auto-Routing & Auto-SFX for Timeline Single Scene
  let effectiveArchetype = targetArchetype;
  let effectivePreferredElement = preferredElement;
  let autoSfx = null;

  if (n === 1) {
    const yTimeline = calculateTimelineSceneY({
      prompt,
      targetArchetype,
      preferredElement,
      prevScene,
      nextScene,
      style,
      accentColor: ACCENT,
    });
    effectiveArchetype = yTimeline.archetype;
    effectivePreferredElement = yTimeline.preferredElement;
    autoSfx = yTimeline.soundEffects;
  }

  const archetypeDirective = getArchetypeDirective(effectiveArchetype, effectivePreferredElement);
  const isDedicatedHook = effectiveArchetype === 'hook' || (n > 1);

  const outputFormatPrompt = n === 1
    ? `CRITICAL REQUIREMENT: Return a JSON array containing EXACTLY 1 scene object.
OUTPUT FORMAT — pure JSON array of EXACTLY 1 scene:
[
  {
    "_directorNotes": "Explain your thought process for this scene (why this layout? why this widget?)",
    "name": "Tên cảnh",
    "description": "Mô tả ngắn cảnh",
    "temporalRole": "${isDedicatedHook ? 'hook' : 'normal'}",
    "duration": ${targetDuration || 3.5},
    "bgColor": "${BG_DARK}",
    "bgPattern": "grid" | "dots" | "none",
    "hudHeader": "-- CHỦ ĐỀ . 2026 --",
    "hudFooterLeft": "SHORT VIDEO",
    "hudFooterRight": "01/01",
    "authorName": "XD-Short",
    "visualMetaphor": "Mô tả chuyển động và cảm xúc ẩn dụ của cảnh (vd: 'bước nhảy vọt bứt phá', 'tia nổ vụt sáng')",
    "dna": {
      "motion": "rise",
      "form": "arrow",
      "energy": 0.85,
      "valence": "positive",
      "primaryDimension": "motion",
      "strokeComplexity": 2
    },
    "voiceoverText": "Lời thoại tự nhiên tiếng Việt cảnh này, có dấu ngắt nghỉ ..., !, ,",
    "soundEffects": ${JSON.stringify(autoSfx || [{ type: 'whoosh', delaySec: 0.1, volume: 0.7 }])},
    "elements": []
  }
]`
    : `CRITICAL REQUIREMENT: Return a JSON array containing EXACTLY ${n} scene objects (from Scene 1 to Scene ${n}). DO NOT generate only 1 scene!
OUTPUT FORMAT — pure JSON array of EXACTLY ${n} scenes:
[
  {
    "_directorNotes": "Explain your thought process for scene 1 (why this layout? why this widget?)",
    "name": "Tên cảnh 1 (Hook)",
    "description": "Mô tả ngắn cảnh 1",
    "temporalRole": "hook",
    "duration": 3,
    "bgColor": "${BG_DARK}",
    "bgPattern": "grid" | "dots" | "none",
    "hudHeader": "-- CHỦ ĐỀ . 2026 --",
    "hudFooterLeft": "SHORT VIDEO",
    "hudFooterRight": "01/${n}",
    "authorName": "XD-Short",
    "visualMetaphor": "Mô tả chuyển động và cảm xúc ẩn dụ cảnh 1",
    "dna": {
      "motion": "rise" | "fall" | "expand" | "contract" | "pulse" | "spiral" | "oscillate" | "static",
      "form": "arrow" | "circle" | "line" | "burst" | "frame" | "check" | "wave" | "spiral",
      "energy": 0.85,
      "valence": "urgent" | "positive" | "neutral" | "cautionary",
      "primaryDimension": "motion" | "form" | "energy" | "valence",
      "strokeComplexity": 1 | 2 | 3
    },
    "voiceoverText": "Lời thoại tự nhiên tiếng Việt cảnh 1, có dấu ngắt nghỉ ..., !, ,",
    "soundEffects": [{"type": "boom", "delaySec": 0.05, "volume": 0.85}],
    "elements": []
  },
  {
    "_directorNotes": "Explain your thought process for scene 2",
    "name": "Tên cảnh 2",
    "description": "Mô tả ngắn cảnh 2",
    "temporalRole": "normal",
    "duration": 3,
    "bgColor": "${BG_DARK}",
    "bgPattern": "grid" | "dots" | "none",
    "hudHeader": "-- CHỦ ĐỀ . 2026 --",
    "hudFooterLeft": "SHORT VIDEO",
    "hudFooterRight": "02/${n}",
    "authorName": "XD-Short",
    "dna": { "motion": "expand", "form": "frame", "energy": 0.55, "valence": "neutral", "primaryDimension": "form", "strokeComplexity": 2 },
    "voiceoverText": "Lời thoại tự nhiên tiếng Việt cảnh 2...",
    "soundEffects": [{"type": "whoosh", "delaySec": 0.1, "volume": 0.7}],
    "elements": []
  },
  {
    "_directorNotes": "Explain your thought process for scene ${n} (CTA)",
    "name": "Tên cảnh ${n} (CTA)",
    "description": "Mô tả ngắn cảnh ${n}",
    "temporalRole": "cta",
    "duration": 3,
    "bgColor": "${BG_DARK}",
    "bgPattern": "grid" | "dots" | "none",
    "hudHeader": "-- CHỦ ĐỀ . 2026 --",
    "hudFooterLeft": "SHORT VIDEO",
    "hudFooterRight": "${n < 10 ? '0' + n : n}/${n}",
    "authorName": "XD-Short",
    "voiceoverText": "Lời thoại cảnh cuối kêu gọi tương tác...",
    "soundEffects": [{"type": "pop", "delaySec": 0.1, "volume": 0.7}],
    "elements": []
  }
]`;

  const systemPrompt = `You are a world-class viral short-form video director (TikTok/Reels/Shorts).
Canvas: 360×640 pixels, 9:16 portrait. Safe Zone: top 60 to 480 px (lower third 480-640 px reserved for captions & wave).
CRITICAL: Return ONLY a valid JSON array, NO markdown, NO backticks, NO explanation text.

${FONT_RULE}

EXACT LAYOUT RULES — follow pixel coordinates precisely:

=== GRAPHIC ELEMENTS ===
CRITICAL INSTRUCTION: For complex elements ('chat-mockup', 'vs-battle', 'quiz-card', 'table', 'ranking-list', etc.), you MUST INVENT REAL, SPECIFIC DATA related to the user's topic! DO NOT just copy placeholder data. Replace names, text, criteria, options, and scores with authentic content matching the prompt!

DATA QUALITY EXAMPLES (LEARN FROM THESE):
❌ Bad (Placeholder): { "label": "Cột A", "value": 10 }
✅ Good (Real Data): { "label": "Chi phí Marketing", "value": 45000000 }

❌ Bad (Placeholder): { "criterion": "Tiêu chí 1", "leftValue": "Kết quả A", "rightValue": "Kết quả B" }
✅ Good (Real Data): { "criterion": "Tốc độ xử lý", "leftValue": "3 giờ thủ công", "rightValue": "10 giây với AI" }

❌ Bad (Placeholder): { "text": "Mục 1", "subtext": "Mô tả" }
✅ Good (Real Data): { "text": "Buông bỏ kỳ vọng", "subtext": "Ngừng ép bản thân phải hoàn hảo" }

${elementsCatalog}

${compiledLayoutRules}

${isDedicatedHook ? `SCENE 1 (VIRAL 3-SECOND HOOK) MANDATORY RULE (FORMULA Y = f(X)):
- Scene 1 MUST have temporalRole: "hook"
- In Scene 1, you MUST include exactly ONE primary composite element with type: "master-hook", left: 180, top: 56, width: 320, height: 240, animPreset: "zoom-in", with a hookData object containing ONLY content (the layout & visual design are chosen automatically — do NOT add layoutStyle, colors or animation fields):
  "hookData": {
    "hookIntent": one of ${HOOK_INTENTS.map(i => `"${i}"`).join(' | ')} (warning = mistake/danger; number = the hook hinges on a figure; versus = A vs B; secret = little-known insight; tech = AI/technology; curiosity = paradox/question; tips = quick win; healing = calm/reflective),
    "heroTitle": "SHORT HERO TITLE (3 to 6 punchy words, no emoji)",
    "highlightWords": ["1 or 2 words copied exactly from heroTitle"],
    "badgeText": "2 to 4 word kicker that does NOT repeat heroTitle (no emoji)",
    "subText": "1 punchy curiosity-gap sentence explaining why they must watch...",
    "statValue": "only for hookIntent number: the figure exactly as in heroTitle, e.g. 90%",
    "versusLeft": "only for hookIntent versus: side A (max 4 words)",
    "versusRight": "only for hookIntent versus: side B (max 4 words)"
  }
- In Scene 1, soundEffects MUST contain: [{"type": "boom", "delaySec": 0.05, "volume": 0.85}, {"type": "pop" | "ding" | "kaching" | "chime", "delaySec": 0.35, "volume": 0.7}]`
: `SINGLE TIMELINE SCENE GENERATION RULE:
- This is an individual scene to be inserted into a video timeline at a specific point in the narrative.
- temporalRole should be "normal" or "highlight" matching the content.
- Ensure all elements fit strictly within Safe Zone: top 60 to 480 px.
${archetypeDirective}`}

${silhouettePlanPrompt}

PRIMARY WIDGET GUIDANCE (pick the primary widget of every content scene by topic):

- Khoe doanh thu, nổ tiền tài khoản, tiền về, số dư ngân hàng -> 'social-callout' (variant: 'bank', title: '+100,000,000 đ', subtitle: 'Vietcombank', content: 'Lợi nhuận kinh doanh') -> soundEffects: 'kaching'
- Trích dẫn Tweet chuyên gia, Elon Musk, KOLs -> 'social-callout' (variant: 'tweet', title: 'Elon Musk', subtitle: '@elonmusk', content: 'Nội dung tweet')
- Tin nhắn chốt đơn, tin nhắn VIP -> 'social-callout' (variant: 'chat', title: 'Khách VIP', content: 'Đã chuyển cọc!')
- Tin tức thời sự khẩn cấp, tin nóng -> 'social-callout' (variant: 'news', title: 'TIN NÓNG 24H', content: 'Thị trường biến động mạnh')
- Bằng chứng tài liệu mật, trích xuất báo cáo, tô chữ dạ quang -> 'document-evidence' (variant: 'highlighter', title: 'BÁO CÁO MẬT', content: 'Tăng trưởng 300% trong 90 ngày', highlight: 'Tăng trưởng 300%') -> soundEffects: 'marker'
- Đóng dấu phê duyệt, tuyệt mật, cảnh báo lừa đảo -> 'document-evidence' (variant: 'stamp', title: 'TUYỆT MẬT' hoặc 'CẢNH BÁO LỪA ĐẢO', subtitle: 'HỒ SƠ #09') -> soundEffects: 'thud'
- Giấy note ghi nhớ, lời khuyên bỏ túi -> 'document-evidence' (variant: 'note', title: 'LƯU Ý QUAN TRỌNG', content: 'Nguyên tắc bất di bất dịch!')
- Checklist, danh sách cần làm, lưu ý, điều nên/không nên làm -> 'checklist'
- Thiền định, chữa lành, an nhiên, thông điệp tích cực, lối sống chậm, buông bỏ -> MUST use 'quote-box', 'highlight-box', 'image' (với 3D Lotus/Seedling/Candle/Moon/Wave/Dove/Tea), 'circle-chart' (nhịp thở 4-4-4). Bố cục tối giản, chữ thanh thoát, nhịp thở êm đềm
- Crypto, Bitcoin, trading, nến, tài chính -> 'candlestick-chart' -> soundEffects: 'kaching'
- Thị phần, đua top, ranking qua các năm -> 'racing-bar-chart'
- Danh mục đầu tư, ma trận rủi ro, heatmap -> 'heatmap-matrix'
- Bóc tách doanh thu, chi phí, dòng tiền, EBITDA -> 'waterfall-chart'
- Đánh giá năng lực đa chiều, bộ kỹ năng -> 'radar-chart' (yêu cầu đúng 5 trục trong chartData, width: 340, height: 280)
- So sánh các chỉ số thực tế, hiệu suất, cột doanh số -> 'chart-bar' (yêu cầu content: "TIÊU ĐỀ", chartData: [{ label: "Chỉ số 1", value: 85, unit: "%" }, { label: "Chỉ số 2", value: 40, unit: "%" }])
- Xu hướng tăng trưởng, biểu đồ thời gian -> 'line-chart'
- Chỉ số KPI, đồng hồ đo tốc độ/sức mạnh -> 'gauge-chart'
- Hệ sinh thái liên kết, mạng lưới công nghệ -> 'network-graph'
- Phân bổ cơ cấu tỉ lệ phần trăm -> 'pie-chart' hoặc 'circle-chart'
- So sánh đối đầu 2 giải pháp -> 'vs-battle' hoặc 'vs-card'
- Hội thoại nhắn tin, drama tình huống -> 'chat-mockup'
- Câu hỏi đố vui trắc nghiệm -> 'quiz-card'
- Lập trình, code terminal, lệnh prompt -> 'code-terminal' -> soundEffects: 'typewriter'
- Bảng xếp hạng Top 3/Top 5 có huy chương -> 'ranking-list'
- Kim tự tháp, phân tầng Maslow, phễu -> 'pyramid-funnel'
- Quy trình 3 bước hành động -> 'flowchart'
- Thống kê con số ấn tượng -> 'stat-big' hoặc 'metric-cards'

ANIMATION & PACING RULES:
- Use stagger delays: 0.1, 0.2, 0.35, 0.5, 0.7
- animPreset options: "fade-in" | "slide-up" | "slide-down" | "slide-left" | "slide-right" | "zoom-in" | "zoom-out" | "pop-in" | "bounce" | "elastic" | "flip-x" | "glitch"
- VOICE-SYNC (IMPORTANT): On the PRIMARY widget of every scene, set "anchorWord" to the exact word or 2-word phrase copied from that scene's voiceoverText at the moment the widget should appear (the word that names the concept the widget shows). The widget then enters exactly when the voice says it. Optionally set "emphasisWord" (another exact word from voiceoverText) to pulse the widget on a key number or claim.
- soundEffects options (Priority for this topic: [${recommendedSfxPrompt || 'boom, whoosh, pop, ding'}]):
  • Impact: "boom" (cinematic hook), "thud" (punch hit), "riser" (tension buildup)
  • Motion: "whoosh" (scene cut), "swoosh" (fast air cut), "whip" (whip snap), "glitch" (cyber digital)
  • UI & Money: "kaching" (cash/profit/sale $$$), "camera_shutter" (proof/photo), "marker" (highlighter pen), "pop" (text pop), "click" (mouse tap), "typewriter" (keyboard)
  • Reactions & Meme: "ding" (correct idea), "buzzer" (mistake/wrong X), "record_scratch" (sudden pause), "clock_tick" (countdown), "clap" (applause), "laugh" (giggle), "drumroll" (suspense), "bell", "chime"

WIDGET DIVERSITY & ANTI-REPEAT RULES (CRITICAL):
1. Consecutive Anti-Repeat: The PRIMARY visual widget type MUST NOT be the same in two consecutive scenes (e.g., if scene 2 uses 'checklist', scene 3 CANNOT use 'checklist' or just 'highlight-box').
2. Script Variety: ${activeDomains?.includes('ZEN_HEALING') || activeDomains?.includes('WELLNESS_GROWTH') ? "For Zen / Mindful / Poetic topics, prioritize calm minimalism and visual breathing room (use 2 to 3 harmonious widget types such as 'quote-box', 3D 'image', 'breathing-circle', 'checklist'). DO NOT force aggressive or complex widgets!" : "Across all scenes in the video, use AT LEAST 3 to 4 distinct primary widget types from the allowed catalog (e.g. mix 3D 'image' + 'stat-big' + 'checklist' + 'chart-bar' / 'quote-box')."}
3. Animation Rotation: Alternate animPresets across scenes (rotate through "zoom-in", "slide-up", "fade-in", "bounce"). Never use "zoom-in" for every single element.
4. NO EMOJIS IN CONTENT: Absolutely DO NOT put emoji characters (like 📊, 📐, 🔍, 💡, ⚡) inside highlight-box, title, or checklist bullets. Use clean typography and symbols like "✦" or "◈" or sequential numbers ("01", "02").
5. DYNAMIC 3D VISUAL SHOWCASE: When introducing a core device, software tool, or 3D concept, dynamically choose between:
   - Layout A1 (Apple Stage): Hero center 170px floating + glow aura + 3 glass feature cards below.
   - Layout A2 (Cyber HUD): Hero center 165px + laser scanner + 4 corner reticles + specs checklist.
   - Layout A3 (Bento Grid): Hero 135px left + stat-big metric right + bottom pills.
   NEVER place a tiny 3D image off to the far right corner while text is crammed on the left!

${outputFormatPrompt}`;

  const effectiveBannedWords = Array.isArray(aiBannedWords) ? aiBannedWords.filter(w => typeof w === 'string' && w.trim()) : [];
  let bannedWordsPrompt = '';
  if (effectiveBannedWords.length > 0) {
    bannedWordsPrompt = `
NEGATIVE CONSTRAINTS — STRICTLY FORBIDDEN WORDS:
Do NOT use ANY of these forbidden words or phrases in any voiceoverText, scene name, description, or text element:
[${effectiveBannedWords.join(', ')}]
Replace them with natural, conversational, grounded everyday spoken Vietnamese.`;
  }

  let humanizerPrompt = '';
  if (aiHumanizerEnabled) {
    humanizerPrompt = `
NATURAL HUMAN CREATOR TONE (ANTI-AI CLICHÉ):
- Write voiceoverText like a genuine, sharp human content creator speaking naturally to a friend (conversational, natural pauses, lively rhythm).
- STRICTLY AVOID generic robotic AI clichés such as: ${HUMANIZER_PROMPT_CLICHÉS.join(', ')}.
- Start immediately with a punchy hook, unexpected fact, or curiosity gap.`;
  }

  const userPrompt = `MANDATORY TASK: Generate a full sequence of EXACTLY ${n} distinct scene${n > 1 ? 's' : ''} for this ${targetDuration}-second viral short video (Array length MUST be ${n}${n > 1 ? `, containing scene 1 to scene ${n}` : ''}).
Topic/Prompt: "${prompt}"
Style & Tone of Voice: "${style}" (STRICTLY adhere to this tone: vocabulary, sentence structure, emotional pacing, and visual widget choices!)
Color theme: ${resolvedPalette.label} (${colorTheme}), Space Mode: ${SPACE_MODE}, Accent (Primary): ${THEME_PRIMARY}, Surface (Block/Card): ${THEME_ANCHOR}, Text/Subtle: ${THEME_SOFT}, Background: ${BG_DARK}
${archetypeDirective ? `\n${archetypeDirective}\n` : ''}

${frameworkInstruction}

${antiHallucinationPrompt}
${bannedWordsPrompt}
${humanizerPrompt}

RELEVANT 3D ASSETS FOR THIS TOPIC & STYLE:
${JSON.stringify(relevant3dAssets, null, 2)}
(Rule for 3D elements: If you decide to add an 'image' element, pick an appropriate URL from the list above matching the scene concept! Always set objectFit: 'contain', and if the 3D asset has a black/dark background, set blendMode: 'screen' to cleanly blend into the scene.)

STYLE-SPECIFIC LAYOUT AFFINITY & CREATIVE VARIATION:
- If style is "Thiền & Chữa Lành" / "Chill" / "Tâm Hồn":
  * Scene 1 (Hook): Must be deeply poetic and tailored to the topic using 'zen-mindful-hook' (or 'master-hook' with archetype 'healing') paired with 'breathing-circle' or 'vinyl-pulse' or 3D lotus image.
  * Content scenes: DIVERSIFY widely across scenes — DO NOT repeat the same layout!
    - Scene A: 'breathing-circle' (Choose visualStyle: 'water-ripple', 'singing-bowl', 'zen-stones', or 'concentric-orb', and pattern: '4-7-8', 'box', 'calm', 'coherence', or 'vagus' based on the mood) + câu dẫn thiền (mantraText).
    - Scene B: 'quote-box' (trích dẫn triết lý sâu sắc của Thiền sư/danh nhân) + 3D candle/moon.
    - Scene C: 'vinyl-pulse' (đĩa than phát tần số 432Hz / 528Hz chữa lành) + thông điệp tích cực.
    - Scene D: 'checklist' (3 điều cần buông bỏ hôm nay) hoặc 'timeline' (hành trình tìm lại bình an).
    - Scene E: 'document-evidence' (variant 'note': lời nhắc nhở bỏ túi viết tay) + highlight câu từ xoa dịu.
  * Background: bgPattern = "dots" or "none", màu nền êm dịu, không chói.
- If style is "Hoạt Họa" / "Mascot Story" / "Kể Chuyện":
  * MANDATORY: In most scenes (at least 70-80% of scenes), MUST include element 'character-mascot' (e.g. left:180, top:380, width:220, height:310, blendMode:'screen') paired with clean text/highlight-box.
  * Pick expressive 'pose' matching the emotional tone of the scene ('thinking', 'confused', 'skeptical', 'oops', 'cool', 'idea', 'pointing-up', 'laptop', 'running', 'cheering', 'victory').
- If style is "Tài Chính" / "Kinh Doanh" / "Crypto": Prioritize Layout B (Big Numbers) > Layout D (Charts / VS Battle) > Layout A (3D Money split). Use bgPattern = "grid".
- If style is "Công Nghệ AI" / "Lập Trình": Prioritize Layout D (Code terminal / Racing bar / Network graph) > Layout A (3D Robot split) > Layout B (10x metric). Use bgPattern = "grid".
- If style is "Mẹo Nhanh" / "Hướng Dẫn": Prioritize Layout C (Actionable Checklist) > Layout A (Split tips) > Layout B (Impact stat).
- If style is "Viral / Năng Động": Prioritize Layout B (Explosive numbers) > Layout D (Battle / Rankings) > Layout A (3D Hype emoji).
- If style is "Sơ Đồ & Giảng Dạy" or includes "Sơ đồ" or includes "Lưu đồ" or includes "visual-explainer":
  * MANDATORY: Prioritize educational diagram and graph elements: 'flowchart', 'branching-flow', 'tree-diagram', 'knowledge-graph', 'roadmap-flow', 'pyramid-funnel', or 'vs-battle'.
  * Keep node text concise (2-4 words per node). Maximum 3-5 steps/nodes to fit within the 9:16 vertical safe zone without overflowing.
- If style is "Khoa học trừu tượng, đồ họa động học vector toán học Y=f(x), sắc nét, công nghệ cao" or includes "Kinetic Math" or includes "Toán học":
  * This is an elite STEM / Computational Motion Vector style based on mathematical formulas ($Y = f(X)$).
  * MANDATORY: In Scene 1 (Hook) and Scene ${highlightSceneIndex(n) + 1} (Highlight / Aha-Moment), MUST include a primary visual widget of type 'generative-svg' (e.g. width: 220, height: 220, left: 180, top: 220, animPreset: "zoom-in").
  * The 'generative-svg' element schema:
    {
      "type": "generative-svg",
      "left": 180,
      "top": 220,
      "width": 220,
      "height": 220,
      "accentColor": "${ACCENT}",
      "title": "TÊN CÔNG THỨC / NGUYÊN MẪU (VIẾT HOA)",
      "formula": "quantum-orbit",
      "renderStyle": "neon-cyber"
    }
  * FORMULA RULES:
    1. NEVER generate raw SVG tags or path coordinates. ONLY choose the 'formula' name from this verified whitelist:

    [Mô hình Toán Học - BẮT BUỘC CHỌN 1 TRONG CÁC GIÁ TRỊ SAU cho "formula"]
    Nhóm Khoa Học (STEM):
    - "quantum-orbit": Công nghệ lượng tử, vật lý, năng lượng nguyên tử.
    - "lorenz-attractor": Thuyết hỗn loạn, hiệu ứng cánh bướm, khí tượng.
    - "dna-helix": Sinh học, y tế, di truyền, cấu trúc chuỗi.
    - "rose-curve": Toán học đối xứng, nghệ thuật cực, hoa văn.
    Nhóm Tài Chính (Finance):
    - "exponential-surge": Tăng trưởng lũy thừa, bùng nổ, biểu đồ lên cao.
    - "fibonacci-spiral": Tỷ lệ vàng, mở rộng logarit, quy mô kinh tế.
    - "harmonic-wave": Sóng âm, giao thoa, chu kỳ thị trường.
    - "singularity-vortex": Hút năng lượng, xoáy đen, thâu tóm dòng tiền.
    Nhóm Chiến Lược (Strategy):
    - "network-mesh": Lan truyền thông tin, kết nối mạng xã hội, dữ liệu đám mây.
    - "bifurcation-tree": Phân tích kịch bản, nhánh quyết định, nhân quả.
    - "neural-pulse": AI, xung thần kinh não bộ, học máy, ý tưởng chớp nhoáng.
    - "cyber-shield": Bảo mật, khiên phòng thủ, an ninh mạng, tổ ong bảo vệ.
    Nhóm Vũ Trụ & Thời Gian (Cosmos):
    - "spacetime-grid": Không-thời gian cong, lực hấp dẫn, lý thuyết tương đối.
    - "lissajous-curve": Tần số vô tuyến, dao động ký, bước sóng vệ tinh.
    - "mobius-loop": Vòng lặp vô tận, nghịch lý, sự tuần hoàn mãi mãi.
    - "double-pendulum": Con lắc hỗn loạn, quỹ đạo bất định, khó đoán.
    Nhóm Sinh Mệnh (Vitality):
    - "ecg-heartbeat": Nhịp đập y tế, nhịp tim sống còn, cấp cứu, sinh lực.
    - "tesseract-hypercube": Tư duy đa chiều, khối 4D lập phương, siêu không gian.
    - "streamline-flow": Khí động học, đường hầm gió, dòng chảy vượt cản.
    - "torus-field": Trường từ tính vô hạn, động cơ vĩnh cửu, bánh donut năng lượng.

    [Phong Cách Render - BẮT BUỘC CHỌN 1 TRONG 4 cho "renderStyle"]
    - "neon-cyber": Ánh sáng rực rỡ, phù hợp công nghệ cao, AI, vũ trụ.
    - "minimal-hairline": Thanh mảnh, sang trọng, phù hợp tài chính, y tế, tối giản.
    - "hologram-radar": Nét đứt, quét tia, phù hợp an ninh, chiến lược, phân tích dữ liệu.
    - "blueprint-cad": Bản vẽ kỹ thuật nền, phù hợp kiến trúc, khoa học, tư duy logic.

    2. Choose the formula that BEST metaphors the core conceptual insight of the scene.
  * Layout harmony: Main title at top: 120-140, subtext/stat below at top: 380-420 so the central mathematical hero shines without collision!
  * In other scenes: Use clean contrast widgets ('stat-big', 'checklist', 'quote-box') so the video maintains breathing room and high narrative readability.

NARRATIVE ARC & EMOTIONAL PACING:
Following the user's topic, apply this narrative pacing structure:
${narrativeArcPrompt}

WORD BUDGETING & NATURAL RETENTION PACING — Y = f(X, T):
- Target word budget: Khoảng ${totalWords - 5} đến ${totalWords + 5} từ cho toàn kịch bản (cho phép dao động tự nhiên ±3-5s để câu văn mượt mà, giàu cảm xúc, không bị gượng ép).
- Role-based Asymmetrical Word Allocation per scene (Optimized for Vietnamese Natural Cadence ~${SPEECH_RATE_WPS.vi} words/sec & Infinite Loop Retention):
  * Scene 1 (temporalRole = "hook", Duration ~2.5s - 3.5s):
    - hookData.heroTitle: Exactly 3 to 5 punchy words (Visual Graphic Hook).
    - voiceoverText: Khoảng ${hookWordsMin} đến ${hookWordsMax} từ (Explosive, punchy verbal hook within 2.5s-3s so viewers NEVER swipe away!).
  * Scenes 2 to ${n - 1} (temporalRole = "normal" | "highlight", Duration ~5.0s - 7.5s per scene):
    - voiceoverText: Khoảng ${targetDuration <= 20 ? '16 đến 20' : `${bodyWordsTarget - 2} đến ${bodyWordsTarget + 3}`} từ mỗi cảnh (Deep value, shocking metrics, tangible proof, câu văn tự nhiên có nhịp điệu).
  * Scene ${n} (temporalRole = "cta", Duration ~2.0s - 3.0s):
    - voiceoverText: Khoảng ${ctaWordsMin} đến ${ctaWordsMax} từ (Micro-CTA: Fast punchline e.g. 'Lưu lại để dùng!' / 'Follow xem tiếp phần 2!' to trigger seamless video loop rewatch!).
- In 'voiceoverText': Strictly insert natural acoustic pauses '...' before big reveals, '!' for emphatic punchlines, and ',' between clauses to trigger expressive TTS prosody!
- Temporal Roles:
  - Scene 1: temporalRole = "hook"
  - Scene ${highlightSceneIndex(n) + 1}: temporalRole = "highlight"
  - Scene ${n}: temporalRole = "cta"
  - Other scenes: temporalRole = "normal"
${retentionDesignPrompt}
- EVERY scene MUST carry its message visually according to its silhouette (title + widget unless the silhouette says otherwise).
- SAFE ZONE: All element tops must be between 60 and 460 px so they never overlap the lower-third caption zone!
- DYNAMIC HEIGHT AWARENESS: Complex widgets expand dynamically. E.g., 'timeline' with N steps takes ~(N*60 + 50)px height. 'checklist' with N items takes ~(N*40 + 40)px. ALWAYS calculate this mentally and push text elements below them appropriately to prevent overlaps!`;

  try {
    let enrichedScriptContext = '';
    let deepseekReasoning = '';

    // Ngân sách thời gian chung cho cả request (SSOT aiTimeouts) — client chờ lâu hơn mốc này
    const isReasonerScript = isReasonerModel(scriptModel);
    const deadline = requestStartTime + serverBudgetMs({ isReasoner: isReasonerScript });
    const stage1Deadline = () => Math.min(deadline, Date.now() + (isReasonerScript ? AI_TIMEOUTS.STAGE1_REASONER_MS : AI_TIMEOUTS.STAGE1_MS));
    // Stage 1 quá giờ thì Stage 2 tự viết lời thoại theo ngân sách từ (prompt Stage 2 đã có), không bỏ cả request
    const isTimeoutErr = (e) => e?.status === 504 || e?.isTimeout === true;

    const domainIds = activeDomains ? activeDomains.join('-') : 'unknown';
    // Mọi input ảnh hưởng nội dung đều phải nằm trong key; variationSeed buộc sinh phương án mới
    const contentInputs = JSON.stringify([viralFramework || '', sourceMaterial || '', aiBannedWords, aiHumanizerEnabled, variationSeed, recentHookLayouts]);
    const cacheKey = aiCache.generateKey(prompt, style, `${n}_${targetDuration}_${colorTheme}_${suggestedFont || ''}_${domainIds}_${scriptModel || 'gemini'}_${effectiveArchetype || ''}_${effectivePreferredElement || ''}_${contentInputs}`);

    // Stage 1 + Stage 2 trong cùng single-flight: cache trúng hoặc request trùng đang chạy → không gọi LLM lần nào
    const { data: processed, fromCache, isShared } = await aiCache.executeWithSingleFlight(cacheKey, async () => {
    // ── STAGE 1: SCRIPT & HOOK REASONING ──
    const directorPrompt = `Bạn là một đạo diễn kịch bản video ngắn triệu view (TikTok/Shorts/Reels).
Chủ đề: "${prompt}".
Phong cách: "${style}".
Thời lượng mục tiêu: ${targetDuration}s (chia thành ĐỦ ĐÚNG ${n} CẢNH, cho phép co giãn tự nhiên ±3-5s).
Cấu trúc: ${viralFramework || 'Hook 2.5s -> Vấn đề -> Cao trào số liệu -> Giải pháp -> Micro-CTA'}.
${sourceMaterial ? `Tài liệu nguồn: ${sourceMaterial}` : ''}

NGÂN SÁCH TỪ & NHỊP ĐIỆU TỰ NHIÊN (CHUẨN TIKTOK VIỆT NAM ~${SPEECH_RATE_WPS.vi} TỪ/S, CHO PHÉP DAO ĐỘNG 3-5S):
- Tổng số từ toàn bài: Khoảng ${totalWords - 5} đến ${totalWords + 5} từ (nhắm thời lượng ~${targetDuration}s, câu văn trôi chảy, không cụt ngủn, không lê thê).
- Phân bổ số từ gợi ý cho từng cảnh:
  * Cảnh 1 (Hook giữ chân tức thì): 'hookTitle' từ 3-5 từ giật tít; 'voiceover' viết khoảng ${hookWordsMin} đến ${hookWordsMax} từ.
  * Các cảnh giữa từ 2 đến ${n - 1} (Value & Highlight): 'voiceover' viết khoảng ${targetDuration <= 20 ? '16 đến 20' : `${bodyWordsTarget - 2} đến ${bodyWordsTarget + 3}`} từ mỗi cảnh (đầy đủ luận điểm, số liệu hoặc lời giải thích rõ ràng).
  * Cảnh cuối ${n} (Micro-CTA vòng lặp): 'voiceover' viết khoảng ${ctaWordsMin} đến ${ctaWordsMax} từ (kêu gọi hành động ngắn gọn, tự nhiên).

${retentionScriptPrompt}

Quy tắc cú pháp JSON BẮT BUỘC:
- Tuyệt đối KHÔNG dùng dấu ngoặc kép (") bên trong giá trị chuỗi (ví dụ: 'voiceover', 'hookTitle'). Nếu cần nhấn mạnh từ, HÃY DÙNG DẤU NHÁY ĐƠN (') thay thế.
- Đảm bảo trả về JSON hợp lệ 100%.

Hãy tư duy và viết kịch bản chi tiết gồm ĐỦ ĐÚNG ${n} CẢNH (mảng JSON bắt buộc có đúng ${n} phần tử từ sceneIndex 1 đến sceneIndex ${n}):
- Cảnh 1 (temporalRole="hook"): 3-5 từ giật tít, câu mở đầu gây sốc/tò mò cực cao (${hookWordsMin}-${hookWordsMax} từ)
- Các cảnh giữa từ 2 đến ${n - 1} (temporalRole="normal" hoặc "highlight"): lời thoại giá trị sâu, nhịp dồn dập, dẫn chứng số liệu hoặc so sánh
- Cảnh cuối ${n} (temporalRole="cta"): Micro-CTA dứt khoát (${ctaWordsMin}-${ctaWordsMax} từ)

BẮT BUỘC trả về mảng JSON gồm ĐỦ ĐÚNG ${n} PHẦN TỬ (TUYỆT ĐỐI KHÔNG CHỈ TRẢ VỀ 1 CẢNH):
[
  {
    "sceneIndex": 1,
    "temporalRole": "hook",
    "voiceover": "lời đọc cảnh 1 (${hookWordsMin}-${hookWordsMax} từ, dùng nháy đơn '...' cho trích dẫn)",
    "hookTitle": "Tiêu đề giật tít 3-5 từ",
    "hookBadge": "CẢNH BÁO",
    "glowWords": ["TỪ KHÓA"],
    "openLoop": "lời hứa cụ thể sẽ được trả lời ở cảnh payoff"
  },
  {
    "sceneIndex": 2,
    "temporalRole": "normal",
    "voiceover": "lời đọc cảnh 2..."
  },
  {
    "sceneIndex": 3,
    "temporalRole": "highlight",
    "voiceover": "lời đọc cảnh 3 cao trào số liệu..."
  },
  {
    "sceneIndex": ${n},
    "temporalRole": "cta",
    "voiceover": "lời đọc cảnh cuối micro-cta (${ctaWordsMin}-${ctaWordsMax} từ)..."
  }
]`;

    // Single scene generation on timeline bypasses Stage 1 script reasoning to reduce latency (2-3s) & token costs
    if (n > 1) {
      if (isExplicitGemini && effectiveGeminiKey) {
        try {
          const s1Start = Date.now();
          const geminiRes = await callGemini(effectiveGeminiKey, directorPrompt, {
            config: { responseMimeType: 'application/json' },
            model: scriptModel,
            deadlineMs: stage1Deadline(),
          });
          stage1Ms = Date.now() - s1Start;
          if (geminiRes?.usage) stage1Tokens = geminiRes.usage;
          if (geminiRes?.resolvedModel) effectiveResolvedModel = geminiRes.resolvedModel;

          const parsedGemini = safeJsonParse(geminiRes.text || '', null);
          const minRequiredGemini = Math.max(3, Math.floor(n * 0.8));
          if (Array.isArray(parsedGemini) && parsedGemini.length >= minRequiredGemini) {
            enrichedScriptContext = `\n\nMASTER VIRAL SCRIPT BY CREATIVE DIRECTOR (MANDATORY TO FOLLOW EXACTLY):
You MUST strictly follow this exact narrative, scene sequence, and voiceover text for the ${n} scenes:
${JSON.stringify(parsedGemini, null, 2)}`;
            console.log(`[Gemini Pipeline] Gemini successfully authored master script for ${parsedGemini.length} scenes`);
          } else {
            console.warn(`[Gemini Script Warning] Stage 1 returned only ${parsedGemini?.length || 0} scenes (expected at least ${minRequiredGemini} of ${n}). Skipping master script override so Stage 2 can generate all ${n} scenes.`);
          }
        } catch (geminiErr) {
          console.error('[Gemini Script Error]:', geminiErr.message);
          if (!isTimeoutErr(geminiErr)) {
            throw new Error(`Lỗi tạo kịch bản từ Gemini: ${geminiErr.message}`);
          }
        }
      } else if ((aiEngineMode === 'hybrid' || aiEngineMode === 'deepseek' || isExplicitDeepSeek) && effectiveDeepseekKey) {
        try {
          const s1Start = Date.now();
          const dsRes = await callDeepSeek(effectiveDeepseekKey, [
            { role: 'system', content: 'You are an elite short-video viral director. Return ONLY a valid JSON array.' },
            { role: 'user', content: directorPrompt }
          ], {
            model: scriptModel || 'deepseek-chat',
            timeoutMs: remainingMs(stage1Deadline()),
            maxAttempts: 1,
            maxTokens: 8192
          });
          stage1Ms = Date.now() - s1Start;
          if (dsRes?.usage) stage1Tokens = dsRes.usage;
          if (dsRes?.model) effectiveResolvedModel = dsRes.model;

          const parsedDs = safeJsonParse(dsRes.text, null);
          const minRequiredDs = Math.max(3, Math.floor(n * 0.8));
          if (Array.isArray(parsedDs) && parsedDs.length >= minRequiredDs) {
            deepseekReasoning = dsRes.reasoning || '';
            enrichedScriptContext = `\n\nMASTER VIRAL SCRIPT BY CREATIVE DIRECTOR (MANDATORY TO FOLLOW EXACTLY):
You MUST strictly follow this exact narrative, scene sequence, and voiceover text for the ${n} scenes:
${JSON.stringify(parsedDs, null, 2)}`;
            console.log(`[Hybrid Pipeline] DeepSeek successfully reasoned script for ${parsedDs.length} scenes (${deepseekReasoning.length} chars thinking)`);
          } else {
            console.warn(`[DeepSeek Script Warning] Stage 1 returned only ${parsedDs?.length || 0} scenes (expected at least ${minRequiredDs} of ${n}). Skipping master script override so Stage 2 can generate all ${n} scenes.`);
          }
        } catch (dsErr) {
          console.error('[DeepSeek Script Error]:', dsErr.message);
          if ((isExplicitDeepSeek || aiEngineMode === 'deepseek') && !isTimeoutErr(dsErr)) {
            throw new Error(`Lỗi tạo kịch bản từ DeepSeek: ${dsErr.message}`);
          }
        }
      }
    }

      const fullUserPrompt = `${userPrompt}${enrichedScriptContext}`;
      let rawJson = '';
      let usedEngine = 'gemini';

      // Quyết định engine cho bố cục Motion Graphics & Layout:
      // - Thuần DeepSeek (aiEngineMode === 'deepseek') HOẶC không có key Gemini nhưng có key DeepSeek: Dùng DeepSeek
      // - Smart Hybrid hoặc Thuần Gemini: Ưu tiên Gemini thiết kế bố cục đồ họa & Safe-Zone
      const preferDeepSeekForLayout = (aiEngineMode === 'deepseek' || (!effectiveGeminiKey && effectiveDeepseekKey));

      if (preferDeepSeekForLayout && effectiveDeepseekKey) {
        try {
          const s2Start = Date.now();
          const dsRes = await callDeepSeek(effectiveDeepseekKey, [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: fullUserPrompt }
          ], { 
            model: 'deepseek-chat',
            timeoutMs: remainingMs(deadline),
            maxAttempts: 1,
            maxTokens: 8192
          });
          stage2Ms = Date.now() - s2Start;
          if (dsRes?.usage) stage2Tokens = dsRes.usage;

          rawJson = dsRes.text || '[]';
          usedEngine = 'deepseek';
          if (!deepseekReasoning && dsRes.reasoning) {
            deepseekReasoning = dsRes.reasoning;
          }
        } catch (dsErr) {
          console.warn('[DeepSeek Layout Warning] DeepSeek layout generation failed:', dsErr.message);
          if (effectiveGeminiKey && aiEngineMode !== 'deepseek' && remainingMs(deadline) >= AI_TIMEOUTS.STAGE2_FALLBACK_MIN_MS) {
            console.log('[Layout Fallback] Falling back to Gemini for layout...');
          } else {
            throw dsErr;
          }
        }
      }

      // Nếu chưa có layout JSON và có Gemini key: Gọi Gemini
      if ((!rawJson || rawJson === '[]') && effectiveGeminiKey) {
        try {
          const s2Start = Date.now();
          const response = await callGemini(effectiveGeminiKey, `${systemPrompt}\n\n${fullUserPrompt}`, {
            config: { responseMimeType: 'application/json' },
            model: isExplicitGemini ? scriptModel : undefined,
            deadlineMs: deadline,
          });
          stage2Ms = Date.now() - s2Start;
          if (response?.usage) stage2Tokens = response.usage;

          rawJson = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
          usedEngine = 'gemini';
        } catch (geminiErr) {
          console.warn('[Gemini Layout Error]:', geminiErr.message);
          // Chỉ fallback sang DeepSeek nếu ở chế độ hybrid và có key DeepSeek
          if (aiEngineMode === 'hybrid' && effectiveDeepseekKey && (!rawJson || rawJson === '[]') && remainingMs(deadline) >= AI_TIMEOUTS.STAGE2_FALLBACK_MIN_MS) {
            console.log('[Layout Fallback] Hybrid mode: Falling back to DeepSeek for layout...');
            const s2Start = Date.now();
            const dsRes = await callDeepSeek(effectiveDeepseekKey, [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: fullUserPrompt }
            ], { model: 'deepseek-chat', timeoutMs: remainingMs(deadline), maxAttempts: 1, maxTokens: 8192 });
            stage2Ms = Date.now() - s2Start;
            if (dsRes?.usage) stage2Tokens = dsRes.usage;

            rawJson = dsRes.text || '[]';
            usedEngine = 'deepseek';
            if (!deepseekReasoning && dsRes.reasoning) {
              deepseekReasoning = dsRes.reasoning;
            }
          } else {
            throw geminiErr;
          }
        }
      }

      const scenes = safeJsonParse(rawJson, []);
      if (!Array.isArray(scenes) || scenes.length === 0) {
        throw new Error('AI không tạo được danh sách phân cảnh hợp lệ. Vui lòng bấm tạo lại!');
      }
      if (scenes.length === 1 && n >= 3) {
        console.warn(`[AI Warning] Model returned only 1 scene when ${n} were requested.`);
        throw new Error(`AI chỉ tạo được 1 cảnh mở đầu (chưa hoàn thành đủ ${n} cảnh). Vui lòng bấm nút "Tạo kịch bản" lại một lần nữa!`);
      }
      const finalScenes = postProcessGeneratedScenes(scenes, { 
        prompt, 
        style, 
        ACCENT, 
        BG_DARK, 
        paletteId: resolvedPalette.id,
        spaceMode: SPACE_MODE,
        suggestedFont, 
        autoPoseRules, 
        useSilhouettes: !customTemplates,
        hookContext: {
          // Cùng yêu cầu → cùng thiết kế (cache an toàn); bấm "tạo phương án khác" đổi variationSeed → hook mới
          seed: directorSeed,
          recentLayouts: Array.isArray(recentHookLayouts) ? recentHookLayouts : [],
          styleHint: suggestedHookLayout,
          domains: activeDomains,
        },
        aiBannedWords: effectiveBannedWords,
        aiHumanizerEnabled,
        targetDuration,
        wordsPerScene,
        sceneCount: n
      });

      if (Array.isArray(finalScenes) && finalScenes.length > 0) {
        if (deepseekReasoning) finalScenes[0]._deepseekReasoning = deepseekReasoning;
        finalScenes[0]._aiEngine = usedEngine;
        finalScenes[0]._scriptModel = scriptModel;
        if (n === 1 && autoSfx && (!finalScenes[0].soundEffects || finalScenes[0].soundEffects.length === 0)) {
          finalScenes[0].soundEffects = autoSfx;
        }
      }

      return finalScenes;
    }, { useCache: req.aiConfig?.aiCacheEnabled !== false });

    const totalDurationMs = Date.now() - requestStartTime;
    const combinedTokens = {
      promptTokens: (stage1Tokens.promptTokens || 0) + (stage2Tokens.promptTokens || 0),
      promptCacheHitTokens: (stage1Tokens.promptCacheHitTokens || 0) + (stage2Tokens.promptCacheHitTokens || 0),
      promptCacheMissTokens: (stage1Tokens.promptCacheMissTokens || 0) + (stage2Tokens.promptCacheMissTokens || 0),
      completionTokens: (stage1Tokens.completionTokens || 0) + (stage2Tokens.completionTokens || 0),
      reasoningTokens: (stage1Tokens.reasoningTokens || 0) + (stage2Tokens.reasoningTokens || 0),
      totalTokens: (stage1Tokens.totalTokens || 0) + (stage2Tokens.totalTokens || 0),
    };

    const keySource = (req.body.apiKey || req.body.deepseekApiKey) ? 'user_byok' : 'system_pool';
    const voiceovers = Array.isArray(processed) ? processed.map((s) => s.voiceover || s.text || '') : [];

    // Cloud-Safe Execution: Guarantee Firestore write completes before connection is terminated
    await Promise.allSettled([
      req.incrementAiUsage ? req.incrementAiUsage() : Promise.resolve(),
      aiLogService.recordWizardLog({
        sessionId: req.body.wizardSessionId || `wiz_${Date.now()}`,
        userId: req.aiUser?.uid || null,
        userEmail: req.aiUser?.email || null,
        userTier: req.aiUser?.tier || 'free',
        model: effectiveResolvedModel,
        sceneCount: Array.isArray(processed) ? processed.length : n,
        targetDurationSec: targetDuration,
        prompt,
        voiceovers,
        tokens: combinedTokens,
        latencyMs: {
          stage1Ms,
          stage2Ms,
          totalMs: totalDurationMs,
        },
        keySource,
        status: 'success',
        cacheHit: Boolean(fromCache || isShared),
        framework: viralFramework || null,
      }),
    ]);

    res.json(processed);
  } catch (err) {
    const totalDurationMs = Date.now() - requestStartTime;
    const combinedTokens = {
      promptTokens: (stage1Tokens.promptTokens || 0) + (stage2Tokens.promptTokens || 0),
      promptCacheHitTokens: (stage1Tokens.promptCacheHitTokens || 0) + (stage2Tokens.promptCacheHitTokens || 0),
      promptCacheMissTokens: (stage1Tokens.promptCacheMissTokens || 0) + (stage2Tokens.promptCacheMissTokens || 0),
      completionTokens: (stage1Tokens.completionTokens || 0) + (stage2Tokens.completionTokens || 0),
      reasoningTokens: (stage1Tokens.reasoningTokens || 0) + (stage2Tokens.reasoningTokens || 0),
      totalTokens: (stage1Tokens.totalTokens || 0) + (stage2Tokens.totalTokens || 0),
    };
    const keySource = (req.body.apiKey || req.body.deepseekApiKey) ? 'user_byok' : 'system_pool';

    aiLogService.recordWizardLog({
      sessionId: req.body.wizardSessionId || `wiz_${Date.now()}`,
      userId: req.aiUser?.uid || null,
      userEmail: req.aiUser?.email || null,
      userTier: req.aiUser?.tier || 'free',
      model: effectiveResolvedModel,
      sceneCount: n,
      targetDurationSec: targetDuration,
      prompt,
      tokens: combinedTokens,
      latencyMs: { stage1Ms, stage2Ms, totalMs: totalDurationMs },
      keySource,
      status: 'failed',
      errorMessage: err.message,
      cacheHit: false,
      framework: viralFramework || null,
    }).catch(() => {});

    return handleGlobalHttpError(err, res, 'ai');
  }
});

/** Magic Fill phân tử: SMILES/công thức lấy từ PubChem (AI có thể trả chemData lồng hoặc phẳng) */
async function enrichMagicFill(elementType, data) {
  if (elementType !== 'chemical-molecule' || !data) return data;
  if (data.chemData) return { ...data, chemData: await enrichChemData(data.chemData) };
  return enrichChemData(data);
}

// 2. AI Magic Fill for Charts (Zero-Hardcode via ELEMENTS_REGISTRY)
router.post('/chart-fill', async (req, res) => {
  telemetry.recordRequest('/api/ai/chart-fill');
  const { elementType, elementId, customPrompt, sceneText, videoTopic, accentColor, apiKey, deepseekApiKey, provider = 'hybrid' } = req.body;
  if (!apiKey && !deepseekApiKey) return res.status(401).json({ error: 'Missing AI API Key' });
  if (!elementType) return res.status(400).json({ error: 'Missing elementType' });

  try {
    const registryEntry = ELEMENTS_REGISTRY[elementType];
    if (!registryEntry || !registryEntry.ai) {
      return res.status(400).json({ error: `Element type '${elementType}' does not support AI Magic Fill.` });
    }
    
    const chartSchema = registryEntry.ai(accentColor || '#BEFF01');
    
    let domainGuidance = '';
    if (elementType === 'chemical-molecule') {
      domainGuidance = `\n- STEM Chemistry: "name" MUST be the compound's English or IUPAC name (e.g. Caffeine, Dopamine, Aspirin, Glucose) — it is used for a PubChem lookup. Put the Vietnamese name in "displayName". Do NOT write SMILES or formula: the system fills them from PubChem.`;
    } else if (elementType === 'math-plot') {
      domainGuidance = `\n- STEM Math Plot: MUST provide a math.js expression using 'x' and optionally time 't' (e.g. sin(x - 2t), exp(-0.3x) * cos(2x), x^3 - 2x). Never JavaScript: no Math.*, no **, no code.`;
    } else if (elementType === 'latex-formula') {
      domainGuidance = `\n- STEM LaTeX Formula: MUST provide clean LaTeX formula syntax compatible with KaTeX (do NOT enclose in $ or $$ or \\[ \\]).`;
    } else if (elementType === 'interactive-quiz') {
      domainGuidance = `\n- STEM/EdTech Quiz: MUST provide an engaging multiple-choice question, exactly 4 options (A, B, C, D), specify correctAnswers array (e.g. ["C"]), and a clear 1-2 sentence explanation.`;
    } else if (elementType === 'vocab-card') {
      domainGuidance = `\n- Language Vocab Card: MUST provide accurate word, partOfSpeech, authentic IPA phonetics (e.g. /ˈkruː.ʃəl/), cefrLevel (e.g. B2, C1, IELTS 7.0+, HSK 4), concise Vietnamese meaningVi, natural exampleEn with highlightWord, and 2-3 relevant synonyms.`;
    } else if (elementType === 'chart-bar') {
      domainGuidance = `\n- Bar Chart Comparison: MUST output JSON containing "content" (chart title in Vietnamese, e.g. "SO SÁNH CHỈ SỐ", "HIỆU SUẤT ĐẠT ĐƯỢC") and "chartData" (array of 2 to 4 comparison bars with { "label": "Tên chỉ số", "value": number, "unit": "%" | "tr" | "k" | "x", "color": "${accentColor || '#BEFF01'}" }).`;
    } else if (elementType === 'table') {
      domainGuidance = `\n- Comparison Table: MUST output JSON containing "tableData" object with "headers" (array of 2 column titles) and "rows" (array of arrays of strings, each sub-array having 2 values for the 2 columns). Example: { "tableData": { "headers": ["Tiêu Chí", "Giải Pháp Mới"], "rows": [["Tốc độ", "Nhanh hơn 10x"], ["Chi phí", "Tiết kiệm 80%"]] } }.`;
    } else if (elementType === 'vs-battle') {
      domainGuidance = `\n- VS Battle Scorecard: MUST output JSON containing "vsBattle" object with:
  "leftSubject": { "name": "Cách Cũ", "icon": "❌", "color": "#FF5544" },
  "rightSubject": { "name": "Cách Mới", "icon": "⚡", "color": "${accentColor || '#BEFF01'}" },
  "rounds": [ { "criterion": "⚡ Tốc độ", "winner": "right", "leftValue": "3 giờ", "rightValue": "10 giây" } ],
  "winner": "right",
  "showWinner": true
Note: "winner" MUST be strictly one of: "left", "right", or "tie".`;
    } else if (elementType === 'flowchart') {
      domainGuidance = `\n- Flowchart Process: MUST output JSON containing "content" (string title) and "flowSteps" (array of 3-4 steps, each with { "title": "BƯỚC 1: ...", "subtitle": "...", "color": "${accentColor || '#BEFF01'}", "icon": "⚡" }).`;
    } else if (elementType === 'checklist') {
      domainGuidance = `\n- Checklist Rules: MUST output JSON containing "checklistData" object with { "title": "...", "badge": "QUY TẮC", "style": "glass", "tickAnimation": true, "items": [ { "text": "...", "subtext": "...", "status": "checked" }, { "text": "...", "subtext": "...", "status": "cross" } ] }. status MUST be strictly "checked", "cross", or "warning".`;
    } else if (elementType === 'quote-box') {
      domainGuidance = `\n- Quote Box: MUST output JSON with "content" (the inspiring quote text) and "authorName" (author or speaker name, e.g. "Sam Altman" or "Warren Buffett").`;
    } else if (elementType === 'ranking-list') {
      domainGuidance = `\n- Ranking Leaderboard: MUST output JSON containing "content" (title) and "rankingItems" (array of ranked items with { "rank": 1, "name": "...", "score": "98%", "badge": "Quán Quân", "color": "#FFD700" }).`;
    } else if (elementType === 'knowledge-graph') {
      domainGuidance = `\n- Pedagogical Knowledge Graph: MUST output JSON containing "knowledgeGraphData" with:
  "title": Lesson title in Vietnamese (Sentence case, e.g. "Từ loại trong tiếng Anh", "3 Định luật Newton"),
  "layout": "cascade" | "spine" | "orbit",
  "theme": "obsidian-dark",
  "nodes": Array of nodes following a strict 3-tier tree hierarchy:
    1. Exactly 1 Root Node: { "id": "root", "tier": 0, "parentId": null, "label": "Lesson Core Title" }
    2. 3 to 4 Main Category Branches: { "id": "n1", "tier": 1, "parentId": "root", "label": "..." }. STRICT RULE: Broader, overarching categories MUST be tier: 1 (e.g. "Danh từ", "Động từ", "Định luật 1"). NEVER put sub-rules, examples, or specific cases as tier 1!
    3. 1 to 2 Sub-Detail Nodes per branch: { "id": "n1_1", "tier": 2, "parentId": "n1", "label": "..." }. STRICT RULE: Specific subtypes, formulas, or examples MUST be tier: 2. The "parentId" of a tier 2 node MUST be the exact "id" of its parent tier 1 node (e.g. "n1"). NEVER set parentId: "root" for tier 2!
    4. Ordering Contract: Place each tier 1 node immediately followed by its own tier 2 child nodes in the array.
  Every node MUST have:
  - "id": Unique string (e.g. "root", "n1", "n1_1", "n2", "n2_1"),
  - "label": Short core concept in Vietnamese (1-4 words),
  - "subLabel": Short formula, keyword, or timeline badge (1-3 words),
  - "tier": 0 (root), 1 (branch), or 2 (sub-detail),
  - "parentId": "root" (for tier 1) or tier 1's ID (for tier 2),
  - "color": Distinct vibrant theme color (e.g. "${accentColor || '#BEFF01'}", "#00D4FF", "#FFB800", "#00FF88", "#FF4D88"),
  - "icon": Authentic pedagogical emoji (e.g. 🌱, 🧬, ⚛️, ⚡, 📐, 🏛️, 📖),
  - "insight": 15-25 words in Vietnamese explaining the essence + memorable takeaway for zoom-in video.
  "activeNodeId": "n1",
  "showParticles": true`;
    }

    const fullPrompt = `You are a data-visualization and scientific communication expert for viral short videos.
Your task is to generate JSON data to fill a graphic element of type '${elementType}'.

Context:
- Video Topic: "${videoTopic || 'N/A'}"
- Current Scene Voiceover: "${sceneText || 'N/A'}"
${customPrompt ? `- User's Specific Request: "${customPrompt}"` : ''}

Instructions:
- Analyze the context and invent highly engaging, accurate, and concise data that perfectly matches the voiceover or topic.
- Use impactful, short labels.${domainGuidance}
- Output ONLY valid JSON matching the exact structure shown in this schema example:
${chartSchema}
- Do NOT wrap in markdown \`\`\`json. Return ONLY the raw JSON object.`;

    // 1. Try DeepSeek if available
    if ((provider === 'deepseek' || provider === 'hybrid') && deepseekApiKey) {
      try {
        const dsRes = await callDeepSeek(deepseekApiKey, [
          { role: 'system', content: 'You are a data-visualization expert. Output ONLY valid raw JSON.' },
          { role: 'user', content: fullPrompt }
        ], { model: 'deepseek-chat', timeoutMs: 25000 });

        const parsedData = safeJsonParse(dsRes.text, null);
        if (parsedData) {
          return res.json({ ...(await enrichMagicFill(elementType, parsedData)), _provider: 'deepseek' });
        }
      } catch (dsErr) {
        console.warn('[DeepSeek Chart-Fill Warning] Auto-falling back to Gemini:', dsErr.message);
      }
    }

    // 2. Primary / Fallback: Gemini
    if (!apiKey) throw new Error('Gemini API Key missing and DeepSeek was unavailable');

    const response = await callGemini(apiKey, fullPrompt, {
      config: { responseMimeType: 'application/json' }
    });
    
    const rawJson = (response.text || '').trim();
    const parsedData = safeJsonParse(rawJson, null);
    
    if (!parsedData) {
       throw new Error('AI returned invalid JSON');
    }
    
    res.json({ ...(await enrichMagicFill(elementType, parsedData)), _provider: 'gemini' });
  } catch (err) {
    console.error('Error in AI Magic Fill:', err);
    res.status(500).json({ error: 'Failed to generate chart data: ' + err.message });
  }
});

// 3. AI Visual Inspector (DeepSeek V4.1 Flash Native Vision)
router.post('/visual-inspect', async (req, res) => {
  telemetry.recordRequest('/api/ai/visual-inspect');
  const { canvasSnapshot, currentScene, deepseekApiKey } = req.body;
  if (!deepseekApiKey) return res.status(401).json({ error: 'Missing DeepSeek API Key for Visual Inspector' });
  if (!canvasSnapshot) return res.status(400).json({ error: 'Missing canvasSnapshot (Base64 image)' });

  try {
    const systemPrompt = `You are an expert AI Layout Inspector for a 9:16 portrait video studio (360x640px).
Your task is to analyze the provided canvas snapshot and the current scene's element coordinates.
Identify any layout issues such as:
1. Text or elements clipping out of the screen bounds (0-360 width, 0-640 height).
2. Elements severely overlapping or obscuring each other making text unreadable.
3. Elements crashing into the safe zones (bottom 160px is reserved for captions).

CURRENT SCENE ELEMENTS:
${JSON.stringify(currentScene, null, 2)}

Return a JSON object with a "patches" array containing the fixes. If no fixes are needed, return { "patches": [] }.
Each patch in the array MUST match this schema:
{
  "elementId": "string (the id of the element to fix)",
  "patch": {
    "left": number,
    "top": number
  },
  "diagnosis": "Short explanation of what was wrong and how you fixed it"
}`;

    const dsRes = await callDeepSeek(deepseekApiKey, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: [
        { type: 'text', text: 'Please inspect this layout and provide the JSON patches to fix overlaps or out-of-bounds errors.' },
        { type: 'image_url', image_url: { url: canvasSnapshot } }
      ]}
    ], { 
      model: 'deepseek-flash', 
      timeoutMs: 15000,
      responseFormat: { type: 'json_object' }
    });

    const parsedData = safeJsonParse(dsRes.text, { patches: [] });
    res.json(parsedData);
  } catch (err) {
    console.error('Error in AI Visual Inspector:', err);
    res.status(500).json({ error: 'Failed to inspect layout: ' + err.message });
  }
});

export default router;
