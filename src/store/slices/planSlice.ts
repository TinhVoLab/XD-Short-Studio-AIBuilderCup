import { StateCreator } from 'zustand';
import { EditorStore, PlanSlice } from '../storeTypes';
import {
  DEFAULT_PLANS,
  DynamicPlanConfig,
  BillingCycle,
  findPlan,
  MAX_SHORT_VIDEO_SEC,
  mergePlansWithDefaults,
  payableAmount,
} from '@/config/planCatalog';
import { UserPlanTier } from '@/types/auth';
import { API_BASE } from '@/config/api';

const LOCAL_STORAGE_PLANS_KEY = 'xd_short_cached_plans';

// Admin: không trừ lượt, xuất 1080p, độ dài theo trần video short MAX_SHORT_VIDEO_SEC
const ADMIN_PLAN: DynamicPlanConfig = (() => {
  const business = DEFAULT_PLANS.find(p => p.id === 'business')!;
  return {
    ...business,
    id: 'admin',
    name: 'Super Admin',
    slug: 'admin',
    badgeText: '',
    description: 'Quyền quản trị',
    isActive: false,
    isFeatured: false,
    sortOrder: 99,
    quotas: { ...business.quotas, monthlyVideoLimit: -1, dailyAiLimit: -1, maxVideoSec: MAX_SHORT_VIDEO_SEC, longVideoMaxSec: MAX_SHORT_VIDEO_SEC, concurrentRenders: 10 },
    features: { removeWatermark: true, batchExport: true, sunoAiMusic: true },
    bulletFeatures: [],
  };
})();

function getStoredPlans(): DynamicPlanConfig[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PLANS_KEY);
    if (raw) return mergePlansWithDefaults(JSON.parse(raw));
  } catch (e) {}
  return DEFAULT_PLANS;
}

export const createPlanSlice: StateCreator<
  EditorStore,
  [],
  [],
  PlanSlice
> = (set, get) => ({
  plans: getStoredPlans(),
  isLoadingPlans: false,

  fetchPlans: async () => {
    set({ isLoadingPlans: true });
    try {
      const res = await fetch(`${API_BASE}/api/plans`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          set({ plans: mergePlansWithDefaults(data), isLoadingPlans: false });
          try {
            localStorage.setItem(LOCAL_STORAGE_PLANS_KEY, JSON.stringify(data));
          } catch (e) {}
          return;
        }
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('Could not fetch dynamic plans, using cached/defaults:', err);
      }
    }
    set({ isLoadingPlans: false });
  },

  getPlanByTier: (tier: UserPlanTier): DynamicPlanConfig => {
    if (tier === 'admin') return ADMIN_PLAN;
    return findPlan(get().plans, tier) || DEFAULT_PLANS[0];
  },

  isFeatureEnabled: (tier: UserPlanTier, featureKey: keyof DynamicPlanConfig['features']): boolean => {
    if (tier === 'admin') return true;
    return Boolean(get().getPlanByTier(tier).features?.[featureKey]);
  },

  getPayableAmount: (tier: UserPlanTier, cycle: BillingCycle): number => {
    return payableAmount(get().getPlanByTier(tier), cycle);
  },
});
