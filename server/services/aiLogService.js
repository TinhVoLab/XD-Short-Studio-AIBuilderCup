import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../middlewares/auth.js';
import { DEFAULT_AI_PRICING, DEFAULT_USD_VND_RATE, getVietnamDateKey } from '../config/aiConfig.js';
import { DEFAULT_GEMINI_MODEL } from '../../src/config/aiModels.js';

class AiLogService {
  constructor() {
    this.inMemoryLogs = []; // Ring buffer for local dev without Firestore
    this.maxMemoryLogs = 50;
    this.cachedPricing = null;
    this.pricingExpiry = 0;
    this.lastCacheHitFingerprint = new Map(); // De-duplication map (key -> timestamp)
  }

  /**
   * Reads dynamic pricing & currency rate from Firestore `system_settings/app_config`
   * with 60s memory cache.
   */
  async getEffectiveConfig() {
    const now = Date.now();
    if (this.cachedPricing && now < this.pricingExpiry) {
      return this.cachedPricing;
    }

    let usdVndRate = DEFAULT_USD_VND_RATE;
    let customPricing = {};

    try {
      if (adminDb) {
        const doc = await adminDb.collection('system_settings').doc('app_config').get();
        if (doc.exists) {
          const data = doc.data();
          if (typeof data.usdVndRate === 'number' && data.usdVndRate > 0) {
            usdVndRate = data.usdVndRate;
          }
          if (data.aiPricing && typeof data.aiPricing === 'object') {
            customPricing = data.aiPricing;
          }
        }
      }
    } catch (e) {
      console.warn('⚠️ [AiLogService] Failed to fetch dynamic pricing config:', e.message);
    }

    this.cachedPricing = {
      pricing: { ...DEFAULT_AI_PRICING, ...customPricing },
      usdVndRate,
    };
    this.pricingExpiry = now + 60 * 1000;
    return this.cachedPricing;
  }

  /**
   * Calculates actual cost in USD based on model pricing and cache hit discount.
   */
  calculateTokensCost(model, tokens = {}, pricingConfig) {
    const p = pricingConfig[model] || pricingConfig[DEFAULT_GEMINI_MODEL] || { inputPerMillion: 0.075, outputPerMillion: 0.30 };
    
    let promptCost = 0;
    const promptTokens = Number(tokens.promptTokens || 0);
    const completionTokens = Number(tokens.completionTokens || 0);

    if (p.cacheMissPerMillion !== undefined) {
      // DeepSeek model pricing with Context Caching
      const cacheHitTokens = Number(tokens.promptCacheHitTokens || 0);
      const cacheMissTokens = Number(tokens.promptCacheMissTokens || Math.max(0, promptTokens - cacheHitTokens));
      promptCost = (cacheHitTokens / 1_000_000) * (p.cacheHitPerMillion || 0.014) +
                   (cacheMissTokens / 1_000_000) * (p.cacheMissPerMillion || 0.14);
    } else {
      // Gemini standard pricing
      promptCost = (promptTokens / 1_000_000) * (p.inputPerMillion || 0.075);
    }

    const completionCost = (completionTokens / 1_000_000) * (p.outputPerMillion || 0.30);
    return Number((promptCost + completionCost).toFixed(6));
  }

  /**
   * Main logger: Sanitizes data (Zero-leak), structures lean schema (<1.5KB),
   * updates atomic daily aggregation, and logs safely.
   */
  async recordWizardLog(params = {}) {
    try {
      const {
        sessionId = `wiz_${Date.now()}`,
        userId = null,
        userEmail = null,
        userTier = 'free',
        model = DEFAULT_GEMINI_MODEL,
        sceneCount = 0,
        targetDurationSec = 0,
        prompt = '',
        voiceovers = [],
        tokens = { promptTokens: 0, completionTokens: 0, reasoningTokens: 0, totalTokens: 0 },
        latencyMs = { stage1Ms: 0, stage2Ms: 0, totalMs: 0 },
        keySource = 'system_pool', // 'system_pool' | 'user_byok'
        status = 'success',
        errorMessage = null,
        cacheHit = false,
        ttsCharacters = 0,
        framework = null, // khung kịch bản của wizard (viralFramework, 'master-chain'…)
      } = params;

      const dateKey = getVietnamDateKey();
      const config = await this.getEffectiveConfig();

      // De-duplication check for rapid consecutive cache hits (60s window)
      if (cacheHit) {
        const dedupKey = `${userId || 'anon'}_${prompt.slice(0, 30)}`;
        const lastHit = this.lastCacheHitFingerprint.get(dedupKey);
        const now = Date.now();
        if (lastHit && now - lastHit < 60000) {
          // Just increment atomic cache hit counter, skip creating duplicate document
          if (adminDb) {
            await adminDb.collection('ai_daily_stats').doc(dateKey).set({
              cacheHits: FieldValue.increment(1),
              updatedAt: new Date().toISOString(),
            }, { merge: true }).catch(() => {});
          }
          return;
        }
        this.lastCacheHitFingerprint.set(dedupKey, now);
      }

      // Cost computation
      const rawCostUsd = this.calculateTokensCost(model, tokens, config.pricing);
      let costUsd = rawCostUsd;
      let savedCostUsd = 0;

      if (cacheHit) {
        costUsd = 0;
        savedCostUsd = rawCostUsd;
      } else if (keySource === 'user_byok') {
        costUsd = 0; // Free for server
        savedCostUsd = rawCostUsd;
      }

      const costVnd = Math.round(costUsd * config.usdVndRate);

      // Lean Schema construction (< 1.5KB)
      const leanLogDoc = {
        sessionId,
        dateKey,
        createdAt: new Date().toISOString(),
        userId: userId || null,
        userEmail: userEmail || 'anonymous',
        userTier: userTier || 'free',
        model,
        sceneCount: Number(sceneCount) || 0,
        targetDurationSec: Number(targetDurationSec) || 0,
        // Sanitize & truncate strings to avoid doc bloat
        promptSnippet: String(prompt || '').trim().slice(0, 150),
        voiceoversSummary: Array.isArray(voiceovers)
          ? voiceovers.slice(0, 7).map((vo, i) => `Cảnh ${i + 1}: ${String(vo || '').trim().slice(0, 60)}`)
          : [],
        tokens: {
          promptTokens: Number(tokens.promptTokens) || 0,
          completionTokens: Number(tokens.completionTokens) || 0,
          reasoningTokens: Number(tokens.reasoningTokens) || 0,
          totalTokens: Number(tokens.totalTokens) || 0,
          promptCacheHitTokens: Number(tokens.promptCacheHitTokens) || 0,
        },
        costUsd,
        costVnd,
        savedCostUsd: Number(savedCostUsd.toFixed(6)),
        keySource,
        status,
        error: errorMessage ? String(errorMessage).slice(0, 200) : null,
        cacheHit: Boolean(cacheHit),
        latencyMs: {
          stage1Ms: Math.round(Number(latencyMs.stage1Ms) || 0),
          stage2Ms: Math.round(Number(latencyMs.stage2Ms) || 0),
          totalMs: Math.round(Number(latencyMs.totalMs) || 0),
        },
        ttsCharacters: Number(ttsCharacters) || 0,
        framework: framework ? String(framework).slice(0, 60) : null,
      };

      // 1. In-memory buffer update (for Local Dev or instant memory cache)
      this.inMemoryLogs.unshift(leanLogDoc);
      if (this.inMemoryLogs.length > this.maxMemoryLogs) {
        this.inMemoryLogs.pop();
      }

      // 2. Persistent Firestore storage
      if (adminDb) {
        const batch = adminDb.batch();

        // Audit log document
        const logRef = adminDb.collection('ai_generation_logs').doc(sessionId);
        batch.set(logRef, leanLogDoc);

        // Atomic Daily Aggregation Document
        const dailyRef = adminDb.collection('ai_daily_stats').doc(dateKey);
        const statsUpdate = {
          dateKey,
          updatedAt: new Date().toISOString(),
          totalRequests: FieldValue.increment(1),
          successfulRequests: status === 'success' ? FieldValue.increment(1) : FieldValue.increment(0),
          failedRequests: status !== 'success' ? FieldValue.increment(1) : FieldValue.increment(0),
          cacheHits: cacheHit ? FieldValue.increment(1) : FieldValue.increment(0),
          byokRequests: keySource === 'user_byok' ? FieldValue.increment(1) : FieldValue.increment(0),
          totalTokens: FieldValue.increment(Number(tokens.totalTokens) || 0),
          totalCostUsd: FieldValue.increment(costUsd),
          totalCostVnd: FieldValue.increment(costVnd),
          totalSavedCostUsd: FieldValue.increment(savedCostUsd),
          totalLatencyMs: FieldValue.increment(leanLogDoc.latencyMs.totalMs),
          totalTtsCharacters: FieldValue.increment(leanLogDoc.ttsCharacters),
        };
        batch.set(dailyRef, statsUpdate, { merge: true });

        await batch.commit();
      }
    } catch (err) {
      console.warn('⚠️ [AiLogService] Error recording wizard log:', err.message);
    }
  }

  /**
   * Retrieves today's or specified date's KPI aggregation summary in exactly 1 Firestore read.
   */
  async getAiDailySummary(dateKey = getVietnamDateKey()) {
    if (adminDb) {
      try {
        const doc = await adminDb.collection('ai_daily_stats').doc(dateKey).get();
        if (doc.exists) {
          const data = doc.data() || {};
          const totalReqs = data.totalRequests || 0;
          const avgLatency = totalReqs > 0 ? Math.round((data.totalLatencyMs || 0) / totalReqs) : 0;
          const successRate = totalReqs > 0 ? Math.round(((data.successfulRequests || 0) / totalReqs) * 100) : 100;

          return {
            dateKey,
            totalRequests: totalReqs,
            successfulRequests: data.successfulRequests || 0,
            failedRequests: data.failedRequests || 0,
            successRate,
            cacheHits: data.cacheHits || 0,
            byokRequests: data.byokRequests || 0,
            totalTokens: data.totalTokens || 0,
            totalCostUsd: Number((data.totalCostUsd || 0).toFixed(4)),
            totalCostVnd: Math.round(data.totalCostVnd || 0),
            totalSavedCostUsd: Number((data.totalSavedCostUsd || 0).toFixed(4)),
            avgLatencyMs: avgLatency,
            totalTtsCharacters: data.totalTtsCharacters || 0,
          };
        }
      } catch (err) {
        console.warn('⚠️ [AiLogService] Failed to fetch daily stats from Firestore:', err.message);
      }
    }

    // In-memory fallback
    const relevant = this.inMemoryLogs.filter((l) => l.dateKey === dateKey);
    const totalReqs = relevant.length;
    const totalTokens = relevant.reduce((sum, l) => sum + (l.tokens?.totalTokens || 0), 0);
    const totalCostUsd = relevant.reduce((sum, l) => sum + (l.costUsd || 0), 0);
    const totalSavedCostUsd = relevant.reduce((sum, l) => sum + (l.savedCostUsd || 0), 0);
    const cacheHits = relevant.filter((l) => l.cacheHit).length;

    return {
      dateKey,
      totalRequests: totalReqs,
      successfulRequests: relevant.filter((l) => l.status === 'success').length,
      failedRequests: relevant.filter((l) => l.status !== 'success').length,
      successRate: totalReqs > 0 ? Math.round((relevant.filter((l) => l.status === 'success').length / totalReqs) * 100) : 100,
      cacheHits,
      byokRequests: relevant.filter((l) => l.keySource === 'user_byok').length,
      totalTokens,
      totalCostUsd: Number(totalCostUsd.toFixed(4)),
      totalCostVnd: Math.round(totalCostUsd * DEFAULT_USD_VND_RATE),
      totalSavedCostUsd: Number(totalSavedCostUsd.toFixed(4)),
      avgLatencyMs: totalReqs > 0 ? Math.round(relevant.reduce((sum, l) => sum + (l.latencyMs?.totalMs || 0), 0) / totalReqs) : 0,
      totalTtsCharacters: relevant.reduce((sum, l) => sum + (l.ttsCharacters || 0), 0),
    };
  }

  /**
   * Retrieves paginated & filtered AI logs for Admin inspection.
   */
  async getAiLogs(options = {}) {
    const {
      limit = 30,
      tier = '',
      model = '',
      status = '',
      search = '',
    } = options;

    if (adminDb) {
      try {
        // Query latest logs by createdAt and filter in-memory to guarantee zero composite index missing errors
        const snapshot = await adminDb
          .collection('ai_generation_logs')
          .orderBy('createdAt', 'desc')
          .limit(Math.max(100, Number(limit) * 3))
          .get();

        let logs = [];
        snapshot.forEach((doc) => {
          logs.push(doc.data());
        });

        if (tier) {
          logs = logs.filter((l) => l.userTier === tier);
        }
        if (status) {
          logs = logs.filter((l) => l.status === status);
        }

        // In-memory filter for model and search string (handles Firestore composite index limitation)
        if (model) {
          logs = logs.filter((l) => l.model === model);
        }
        if (search) {
          const s = search.toLowerCase();
          logs = logs.filter((l) =>
            (l.userEmail && l.userEmail.toLowerCase().includes(s)) ||
            (l.promptSnippet && l.promptSnippet.toLowerCase().includes(s)) ||
            (l.sessionId && l.sessionId.toLowerCase().includes(s))
          );
        }

        return logs.slice(0, Number(limit));
      } catch (err) {
        console.warn('⚠️ [AiLogService] Firestore query failed, falling back to in-memory:', err.message);
      }
    }

    // In-memory fallback
    let logs = [...this.inMemoryLogs];
    if (tier) logs = logs.filter((l) => l.userTier === tier);
    if (model) logs = logs.filter((l) => l.model === model);
    if (status) logs = logs.filter((l) => l.status === status);
    if (search) {
      const s = search.toLowerCase();
      logs = logs.filter((l) =>
        (l.userEmail && l.userEmail.toLowerCase().includes(s)) ||
        (l.promptSnippet && l.promptSnippet.toLowerCase().includes(s)) ||
        (l.sessionId && l.sessionId.toLowerCase().includes(s))
      );
    }
    return logs.slice(0, Number(limit));
  }
}

export const aiLogService = new AiLogService();
