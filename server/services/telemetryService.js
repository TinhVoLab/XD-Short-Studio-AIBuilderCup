// ── Centralized Telemetry & Observability Layer (V9 Master Spec) ──

class TelemetryService {
  constructor() {
    this.startTime = Date.now();
    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      healingCount: 0,
      emergencyFallbacks: 0,
      droppedElements: 0,
      geminiRetries: 0,
      geminiFailures: 0,
      authFailures: 0, // 401 Fail Fast
      deadLetterAlerts: 0, // Max retries exceeded
    };
    this.recentEvents = []; // Ring buffer of recent log events
    this.maxEvents = 50;
  }

  _logEvent(type, details = {}) {
    const event = {
      timestamp: new Date().toISOString(),
      ...details,
      type,
    };
    this.recentEvents.unshift(event);
    if (this.recentEvents.length > this.maxEvents) {
      this.recentEvents.pop();
    }
  }

  recordRequest(endpoint = '') {
    this.metrics.totalRequests++;
    this._logEvent('REQUEST', { endpoint });
  }

  recordCacheHit(key = '') {
    this.metrics.cacheHits++;
    this._logEvent('CACHE_HIT', { key: key.slice(0, 10) + '...' });
  }

  recordCacheMiss(key = '') {
    this.metrics.cacheMisses++;
    this._logEvent('CACHE_MISS', { key: key.slice(0, 10) + '...' });
  }

  recordHealing(count = 1, details = {}) {
    this.metrics.healingCount += count;
    this._logEvent('SELF_HEALING', { count, ...details });
  }

  recordEmergencyFallback(details = {}) {
    this.metrics.emergencyFallbacks++;
    this._logEvent('EMERGENCY_FALLBACK', details);
  }

  recordDroppedElement(count = 1, details = {}) {
    this.metrics.droppedElements += count;
    this._logEvent('DROPPED_ELEMENT', { count, ...details });
  }

  recordGeminiRetry(attempt, model, details = {}) {
    this.metrics.geminiRetries++;
    this._logEvent('GEMINI_RETRY', { attempt, model, ...details });
  }

  recordGeminiFailure(error, model) {
    this.metrics.geminiFailures++;
    this._logEvent('GEMINI_FAILURE', { error: error?.message || String(error), model });
  }

  recordAuthFailure(error) {
    this.metrics.authFailures++;
    this._logEvent('AUTH_FAIL_FAST_401', { error: error?.message || String(error) });
  }

  recordDeadLetterAlert(error) {
    this.metrics.deadLetterAlerts++;
    this._logEvent('DEAD_LETTER_ALERT', { error: error?.message || String(error) });
  }

  getMetrics() {
    const uptimeSec = Math.floor((Date.now() - this.startTime) / 1000);
    const totalCacheQueries = this.metrics.cacheHits + this.metrics.cacheMisses;
    const cacheHitRate = totalCacheQueries > 0 ? `${((this.metrics.cacheHits / totalCacheQueries) * 100).toFixed(1)}%` : '0%';

    return {
      status: 'healthy',
      uptimeSec,
      cacheHitRate,
      metrics: { ...this.metrics },
      recentEvents: this.recentEvents.slice(0, 15),
    };
  }

  reset() {
    this.startTime = Date.now();
    for (const key in this.metrics) {
      this.metrics[key] = 0;
    }
    this.recentEvents = [];
  }
}

export const telemetry = new TelemetryService();
