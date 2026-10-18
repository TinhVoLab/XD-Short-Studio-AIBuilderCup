import { adminDb, isFirebaseConfigured } from '../middlewares/auth.js';
import { DEFAULT_PLANS, findPlan, mergePlansWithDefaults, payableAmount } from '../../src/config/planCatalog.js';

// Mặc định gói cước: SSOT dùng chung với client (src/config/planCatalog.js)
export { DEFAULT_PLANS };

// In-Memory RAM Cache (TTL: 5 minutes = 300,000ms)
let cachedPlans = null;
let cacheExpiry = 0;

export const planService = {
  /**
   * Invalidate server in-memory cache instantly
   */
  invalidateCache() {
    cachedPlans = null;
    cacheExpiry = 0;
    console.log('🔄 [PlanService] Server plans cache invalidated.');
  },

  /**
   * Get all active public plans with $0 read cost (RAM Cached)
   */
  async getPublicPlans() {
    const all = await this.getAllPlans();
    return all.filter(p => p.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  },

  /**
   * Get all plans (including drafts)
   */
  async getAllPlans() {
    const now = Date.now();
    if (cachedPlans && now < cacheExpiry) {
      return cachedPlans;
    }

    if (adminDb && isFirebaseConfigured) {
      try {
        const snap = await adminDb.collection('system_plans').get();
        if (!snap.empty) {
          // Ghi đè Firestore theo từng khoá pricing/quotas/features → trường mặc định mới không bị mất
          cachedPlans = mergePlansWithDefaults(snap.docs.map(d => ({ ...d.data(), id: d.id })));
          cacheExpiry = now + 5 * 60 * 1000;
          return cachedPlans;
        }
      } catch (err) {
        console.warn('⚠️ [PlanService] Failed to read system_plans from Firestore, using baseline defaults:', err.message);
      }
    }

    cachedPlans = DEFAULT_PLANS;
    cacheExpiry = now + 5 * 60 * 1000;
    return cachedPlans;
  },

  /**
   * Get specific plan by tier ID
   */
  async getPlanById(planId) {
    const plans = await this.getAllPlans();
    return findPlan(plans, planId);
  },

  /**
   * Update or create a plan in Firestore
   */
  async savePlan(planId, data, userEmail = 'admin') {
    if (!planId) throw new Error('Missing plan ID');

    const payload = {
      ...data,
      id: planId,
      updatedAt: new Date().toISOString(),
      updatedBy: userEmail,
    };

    if (adminDb) {
      await adminDb.collection('system_plans').doc(planId).set(payload, { merge: true });
    }

    this.invalidateCache();
    return payload;
  },

  /**
   * Reset plans to baseline defaults
   */
  async resetToDefaults(userEmail = 'admin') {
    if (adminDb) {
      const batch = adminDb.batch();
      for (const plan of DEFAULT_PLANS) {
        const ref = adminDb.collection('system_plans').doc(plan.id);
        batch.set(ref, { ...plan, updatedAt: new Date().toISOString(), updatedBy: userEmail });
      }
      await batch.commit();
    }
    this.invalidateCache();
    return DEFAULT_PLANS;
  },

  /**
   * Calculate exact payable amount for payments & VietQR
   */
  async getPayableAmount(tier, cycle = 'month') {
    return payableAmount(await this.getPlanById(tier), cycle);
  },

  /**
   * Check if a feature is enabled for a tier (uses RAM cached plan)
   */
  async isFeatureEnabled(tier, featureKey) {
    if (tier === 'admin') return true;
    const plan = await this.getPlanById(tier);
    return Boolean(plan?.features?.[featureKey]);
  }
};
