import { Router } from 'express';
import { callGemini } from '../../services/geminiService.js';
import { callDeepSeek } from '../../services/deepseekService.js';
import { safeJsonParse } from '../../services/jsonRepairService.js';
import { checkAiQuota } from '../../middlewares/aiQuotaMiddleware.js';
import { sanitizeBannedWords } from '../../services/scenePostProcessor.js';
import { resolveAiVideoLimits } from '../../utils/aiVideoLimits.js';
import { buildMasterPlanPrompt } from '../../prompts/masterScenePrompt.js';
import {
  planMasterStructure,
  applyChainConstraints,
  validateVideoPlan,
  plannedTotalSec,
  MASTER_MIN_TARGET_SEC,
  MASTER_FRAMEWORK_ID,
} from '../../../src/config/videoPlan.js';
import { findPlaceholders } from '../../../src/utils/sceneLint.js';
import { handleGlobalHttpError } from '../../services/errorRegistryService.js';
import { AI_TIMEOUTS, isReasonerModel, remainingMs, serverBudgetMs } from '../../../src/config/aiTimeouts.js';
import { DEFAULT_GEMINI_MODEL } from '../../../src/config/aiModels.js';
import { aiLogService } from '../../services/aiLogService.js';

const router = Router();

/** Lần tạo lại khi kế hoạch sai (slot quá số từ, thiếu mục…) — tối đa 2 lần gọi AI, trong cùng ngân sách thời gian */
const MAX_ATTEMPTS = 2;

/** Áp hàm lên mọi chuỗi trong slots (kể cả mảng) */
const mapSlotStrings = (slots, fn) =>
  Object.fromEntries(
    Object.entries(slots || {}).map(([k, v]) => [k, typeof v === 'string' ? fn(v) : Array.isArray(v) ? v.map((x) => (typeof x === 'string' ? fn(x) : x)) : v])
  );

/**
 * POST /api/ai/master-video-plan
 * Ý tưởng + độ dài → VideoPlan theo chuỗi mẫu Master (config/videoPlan.js). AI chỉ điền slot và lời thoại;
 * cấu trúc, ràng buộc chéo và kiểm tra là quy tắc cố định.
 */
router.post('/master-video-plan', checkAiQuota, async (req, res) => {
  const {
    topic,
    targetDuration = 30,
    style = '',
    aiBannedWords = [],
    aiHumanizerEnabled = true,
    variationSeed,
    apiKey,
    deepseekApiKey,
    aiEngineMode = 'hybrid',
    scriptModel = DEFAULT_GEMINI_MODEL,
  } = req.body;

  if (!String(topic || '').trim()) return res.status(400).json({ error: 'Thiếu ý tưởng video' });

  const targetSec = Number(targetDuration) || 30;
  if (targetSec < MASTER_MIN_TARGET_SEC) {
    return res.status(400).json({ error: `Mẫu cảnh Master cần video tối thiểu ${MASTER_MIN_TARGET_SEC} giây`, code: 'master/too_short' });
  }

  const rawKey = (apiKey || '').trim();
  const rawDsKey = (deepseekApiKey || '').trim();
  const geminiKey = rawKey.startsWith('sk-') ? '' : rawKey;
  const dsKey = rawDsKey || (rawKey.startsWith('sk-') ? rawKey : '');
  if (!geminiKey && !dsKey) {
    return res.status(401).json({ error: 'Missing API Key (Vui lòng cấu hình Gemini hoặc DeepSeek API Key)' });
  }

  const structure = planMasterStructure(targetSec);
  try {
    resolveAiVideoLimits(req.aiUser, { durationSec: targetSec, sceneCount: structure.length });
  } catch (limitErr) {
    return res.status(limitErr.statusCode || 403).json(limitErr.toJSON());
  }

  // Cùng ngân sách với scene-design (SSOT aiTimeouts): Hosting cắt request sau 60 s
  const deadline = Date.now() + serverBudgetMs({ isReasoner: isReasonerModel(scriptModel) });
  const useDeepSeek = (aiEngineMode === 'deepseek' || scriptModel?.startsWith('deepseek')) && dsKey;
  // Token và model thực dùng, cộng dồn qua các lần tạo lại — ghi vào log AI
  const tokens = { promptTokens: 0, completionTokens: 0, reasoningTokens: 0, totalTokens: 0 };
  let resolvedModel = useDeepSeek ? scriptModel : DEFAULT_GEMINI_MODEL;
  const addUsage = (u = {}) => { for (const k of Object.keys(tokens)) tokens[k] += Number(u[k]) || 0; };
  const callModel = async (prompt) => {
    const temperature = variationSeed ? 0.8 : 0.4;
    if (useDeepSeek) {
      const r = await callDeepSeek(dsKey, prompt, { model: scriptModel.includes('reasoner') ? 'deepseek-reasoner' : 'deepseek-chat', temperature, maxTokens: 2000, maxAttempts: 1, timeoutMs: remainingMs(deadline) });
      addUsage(r.usage); if (r.model) resolvedModel = r.model;
      return r.text || '';
    }
    const r = await callGemini(geminiKey, prompt, { config: { responseMimeType: 'application/json', temperature }, model: scriptModel, deadlineMs: deadline });
    addUsage(r.usage); if (r.resolvedModel) resolvedModel = r.resolvedModel;
    return r.text || '';
  };
  const startedAt = Date.now();
  const logPlan = (status, extra) => aiLogService.recordWizardLog({
    sessionId: req.body.wizardSessionId || `wiz_${Date.now()}`,
    userId: req.aiUser?.uid || null,
    userEmail: req.aiUser?.email || null,
    userTier: req.aiUser?.tier || 'free',
    model: resolvedModel,
    sceneCount: structure.length,
    targetDurationSec: targetSec,
    prompt: topic,
    tokens,
    latencyMs: { stage1Ms: 0, stage2Ms: Date.now() - startedAt, totalMs: Date.now() - startedAt },
    keySource: 'user_byok',
    status,
    framework: MASTER_FRAMEWORK_ID,
    ...extra,
  }).catch(() => {});

  const clean = (t) => sanitizeBannedWords(String(t ?? ''), aiBannedWords, aiHumanizerEnabled);

  try {
    let errors = [];
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      // Lần tạo lại chỉ khi còn đủ thời gian, nếu không trả lỗi kế hoạch ngay
      if (attempt > 1 && remainingMs(deadline) < AI_TIMEOUTS.STAGE2_FALLBACK_MIN_MS) break;
      const raw = await callModel(buildMasterPlanPrompt({ topic, structure, style }, errors));
      const out = safeJsonParse(raw, null);
      const aiScenes = Array.isArray(out?.scenes) ? out.scenes : [];
      if (aiScenes.length !== structure.length) {
        errors = [`Cần đúng ${structure.length} cảnh, nhận ${aiScenes.length}`];
        continue;
      }

      const scenes = applyChainConstraints(
        structure.map((s, i) => ({
          role: s.role,
          // Mẫu AI chọn; sai vai hoặc không có trong danh sách → applyChainConstraints dùng mẫu mặc định
          recipeId: s.recipeOptions.includes(aiScenes[i]?.recipeId) ? aiScenes[i].recipeId : s.recipeId,
          plannedSec: s.plannedSec,
          voiceoverText: clean(aiScenes[i]?.voiceoverText),
          slots: mapSlotStrings(aiScenes[i]?.slots, clean),
        }))
      );

      const check = validateVideoPlan(scenes);
      // Chữ giữ chỗ trong slot / lời thoại cũng là lỗi (cùng luật với cổng xuất video)
      scenes.forEach((s, i) => {
        const texts = [s.voiceoverText, ...Object.values(s.slots).flat().filter((v) => typeof v === 'string')];
        for (const t of texts) for (const p of findPlaceholders(t)) check.errors.push(`Cảnh ${i + 1}: chữ giữ chỗ ${p}`);
      });

      if (check.errors.length === 0) {
        logPlan('success', { voiceovers: scenes.map((s) => s.voiceoverText) });
        return res.json({
          success: true,
          plan: {
            title: clean(out.title) || String(topic).slice(0, 60),
            itemLabel: clean(out.itemLabel).split(/\s+/).slice(0, 2).join(' ') || 'Ý',
            targetSec,
            plannedSec: plannedTotalSec(structure),
            scenes,
            warnings: check.warnings,
            attempts: attempt,
          },
        });
      }
      errors = check.errors.slice(0, 12);
    }
    logPlan('failed', { errorMessage: `invalid_plan: ${errors.slice(0, 3).join('; ')}` });
    return res.status(422).json({ error: 'AI chưa tạo được kịch bản đúng mẫu, hãy thử lại', code: 'master/invalid_plan', details: errors });
  } catch (err) {
    console.error('[masterPlanRoutes] Error generating master plan:', err);
    logPlan('failed', { errorMessage: err.message });
    // Hết giờ → 504, hết lượt → 429…: cùng bảng lỗi với scene-design
    return handleGlobalHttpError(err, res, 'ai');
  }
});

export default router;
