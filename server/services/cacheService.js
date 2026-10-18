import crypto from 'crypto';
import { CATALOG_VERSION } from '../prompts/aiElementsCatalog.js';
import { telemetry } from './telemetryService.js';

// ── Smart Cache & SingleFlight Dedup Layer (V9 Master Spec) ──

class CacheService {
  constructor() {
    this.cache = new Map(); // In-memory cache: key -> { data, timestamp }
    this.inFlight = new Map(); // SingleFlight: key -> Promise
    this.ttlMs = 1000 * 60 * 60 * 24; // 24 hours TTL
  }

  /**
   * Tạo Cache Key theo chuẩn SemVer: hash(prompt + style + major.minor)
   * Patch version thay đổi sẽ KHÔNG làm mất cache (tiết kiệm token).
   * Minor / Major thay đổi sẽ tự động xả cache để cập nhật tính năng mới.
   */
  generateKey(prompt = '', style = '', customKeyPart = '') {
    const [major = '1', minor = '0'] = (CATALOG_VERSION || '1.0.0').split('.');
    const versionPrefix = `${major}.${minor}`;
    const raw = `${(prompt || '').trim().toLowerCase()}|${(style || '').trim().toLowerCase()}|${versionPrefix}|${customKeyPart}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * SingleFlight: Đảm bảo 2 request giống nhau gửi cùng lúc chỉ gọi LLM 1 lần duy nhất
   * useCache = false (Admin tắt "AI Cache"): không đọc/ghi cache, vẫn gộp request trùng đang chạy
   */
  async executeWithSingleFlight(key, asyncWorkerFn, { useCache = true } = {}) {
    // 1. Kiểm tra Cache Hit trước
    const cached = useCache ? this.get(key) : null;
    if (cached) {
      console.log(`[Cache Hit] Trả kết quả từ cache (Key: ${key.slice(0, 8)}...) - 0ms, 0 Token`);
      telemetry.recordCacheHit(key);
      return { data: cached, fromCache: true };
    }

    if (useCache) telemetry.recordCacheMiss(key);

    // 2. Kiểm tra có Request nào đang chạy dở cùng Key không (SingleFlight)
    if (this.inFlight.has(key)) {
      console.log(`[SingleFlight] Đã có request đang xử lý cho key ${key.slice(0, 8)}... - Chờ kết quả chung`);
      const sharedResult = await this.inFlight.get(key);
      return { data: sharedResult, fromCache: false, isShared: true };
    }

    // 3. Thực thi worker và gán vào inFlight Map
    const promise = (async () => {
      try {
        const result = await asyncWorkerFn();
        if (useCache) this.set(key, result);
        return result;
      } finally {
        this.inFlight.delete(key); // Xóa khỏi hàng đợi khi hoàn tất
      }
    })();

    this.inFlight.set(key, promise);
    const result = await promise;
    return { data: result, fromCache: false };
  }

  clear() {
    this.cache.clear();
    this.inFlight.clear();
  }
}

export const aiCache = new CacheService();
