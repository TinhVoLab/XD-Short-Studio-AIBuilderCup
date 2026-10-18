import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { testDeepSeekConnection } from '../../services/deepseekService.js';
import { telemetry } from '../../services/telemetryService.js';
import { checkAiQuota } from '../../middlewares/aiQuotaMiddleware.js';
import { DEFAULT_GEMINI_MODEL } from '../../../src/config/aiModels.js';

const router = Router();

// ── Quota Endpoint ──
router.get('/quota', checkAiQuota, (req, res) => {
  res.json({ ok: true, quota: req.aiUser });
});

// ── Observability & Telemetry Endpoints (V9 Spec) ──
router.get('/metrics', (req, res) => {
  res.json(telemetry.getMetrics());
});

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    ...telemetry.getMetrics()
  });
});

// ── Connection Test Endpoints ──
router.post('/test-deepseek', async (req, res) => {
  const { apiKey } = req.body;
  const result = await testDeepSeekConnection(apiKey);
  res.json(result);
});

router.post('/test-gemini', async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
    return res.json({ ok: false, message: 'Vui lòng nhập Gemini API Key.' });
  }
  try {
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
    await ai.models.generateContent({
      model: DEFAULT_GEMINI_MODEL,
      contents: 'ping',
    });
    res.json({ ok: true, message: 'Kết nối Google Gemini thành công!' });
  } catch (err) {
    res.json({ ok: false, message: err.message || 'Lỗi xác thực Gemini API Key' });
  }
});

export default router;
