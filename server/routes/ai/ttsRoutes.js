import { Router } from 'express';
import { generateEdgeTtsAudio } from '../../services/ttsService.js';
import { generateGeminiFlashAudio } from '../../services/geminiTtsService.js';
import { telemetry } from '../../services/telemetryService.js';
import { verifyAuth } from '../../middlewares/auth.js';
import { ttsGuard } from '../../middlewares/ttsGuard.js';

const router = Router();

// 1. Generate Audio via Edge-TTS (Free 0$, Neural, Ultra-fast)
// Cần đăng nhập + giới hạn ký tự: TTS chạy bằng tài nguyên máy chủ
router.post('/edge-tts', verifyAuth, ttsGuard, async (req, res) => {
  telemetry.recordRequest('/api/ai/edge-tts');
  const { text, voiceName, silenceGapSec, silencePosition, temporalRole, rate, pitch, projectId, sceneId } = req.body;
  if (!text) return res.status(400).json({ error: 'Missing text' });

  try {
    const data = await generateEdgeTtsAudio(text, voiceName || 'vi-VN-NamMinhNeural', {
      silenceGapSec,
      silencePosition,
      temporalRole,
      rate,
      pitch,
      projectId,
      sceneId
    });
    res.json(data);
  } catch (err) {
    console.error('Edge-TTS Generation Error:', err);
    res.status(500).json({ error: 'Failed to generate Edge-TTS: ' + err.message });
  }
});

// 2. Generate Audio (Gemini 3.6 Flash TTS with automatic Edge-TTS fallback)
// Cần đăng nhập + giới hạn ký tự: TTS chạy bằng tài nguyên máy chủ
router.post('/tts', verifyAuth, ttsGuard, async (req, res) => {
  telemetry.recordRequest('/api/ai/tts');
  const { text, voiceName, apiKey, silenceGapSec, silencePosition, temporalRole, rate, pitch, projectId, sceneId, style } = req.body;
  if (!text) return res.status(400).json({ error: 'Missing text' });

  // 1. If explicitly requesting Neural voice or missing Gemini API Key, route directly to Edge-TTS (0$ cost)
  if (!apiKey || (voiceName && voiceName.includes('Neural'))) {
    try {
      const data = await generateEdgeTtsAudio(text, voiceName || 'vi-VN-NamMinhNeural', {
        silenceGapSec,
        silencePosition,
        temporalRole,
        rate,
        pitch,
        projectId,
        sceneId
      });
      return res.json(data);
    } catch (err) {
      console.error('Edge-TTS Generation Error:', err);
      return res.status(500).json({ error: 'Failed to generate audio: ' + err.message });
    }
  }

  // 2. Primary: Gemini 3.6 Flash Audio Generation
  try {
    const data = await generateGeminiFlashAudio(text, voiceName || 'Aoede', {
      apiKey,
      temporalRole,
      style,
      projectId,
      sceneId
    });
    return res.json(data);
  } catch (err) {
    console.warn(`⚠️ [Gemini Flash TTS Error: ${err.message}]. Auto-falling back to Edge-TTS...`);
    // 3. Resilience: Silent Auto-Fallback to Edge-TTS to never break user experience
    try {
      const fallbackData = await generateEdgeTtsAudio(text, 'vi-VN-NamMinhNeural', {
        silenceGapSec,
        silencePosition,
        temporalRole,
        rate,
        pitch,
        projectId,
        sceneId
      });
      console.log('✅ [Auto-Fallback Success] Audio rendered via Edge-TTS');
      return res.json({ ...fallbackData, fallback: true });
    } catch (fallbackErr) {
      console.error('Both Gemini Flash and Edge-TTS failed:', fallbackErr);
      return res.status(500).json({ error: 'Failed to generate audio: ' + (err.message || fallbackErr.message) });
    }
  }
});

export default router;
