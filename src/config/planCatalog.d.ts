export type PlanTierId = 'free' | 'creator' | 'business';
export type BillingCycle = 'month' | 'year';
export type TransferKind = 'creator' | 'business' | 'topup';
export type PlanResolution = '720p' | '1080p';

export interface MarketingBulletItem {
  id: string;
  text: string;
  isEnabled: boolean;
}

export interface PlanPricing {
  monthlyPrice: number;
  annualUnitPrice: number;
  annualTotalPayable: number;
  discountPercent: number;
  currency: string;
}

export interface PlanQuotas {
  monthlyVideoLimit: number; // -1 = không giới hạn (chỉ gói Admin)
  dailyAiLimit: number; // -1 = không giới hạn (chỉ gói Admin)
  maxResolution: PlanResolution;
  maxFps: number;
  /** Độ dài tối đa tính 1 lượt (giây) */
  maxVideoSec: number;
  /** Độ dài tối đa gói cho phép; video > maxVideoSec và ≤ longVideoMaxSec tính longVideoCredits lượt */
  longVideoMaxSec: number;
  longVideoCredits: number;
  storageRetentionDays: number;
  concurrentRenders: number;
}

export interface PlanFeatures {
  removeWatermark: boolean;
  batchExport: boolean;
  sunoAiMusic: boolean;
  [key: string]: boolean;
}

export interface DynamicPlanConfig {
  id: string;
  name: string;
  slug: string;
  badgeText?: string;
  description: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  supportText?: string;
  pricing: PlanPricing;
  quotas: PlanQuotas;
  features: PlanFeatures;
  bulletFeatures: MarketingBulletItem[];
  updatedAt?: string;
  updatedBy?: string;
}

export interface PlanFeatureMeta {
  key: keyof PlanFeatures & string;
  name: string;
  description: string;
  category: 'export' | 'ai' | 'audio' | 'infra';
}

export interface TopupPack {
  id: string;
  videos: number;
  maxVideoSec: number;
  price: number;
  label: string;
}

export interface RenderCharge {
  source: 'monthly' | 'bonus';
  credits: number;
}

export type RenderChargeDecision =
  | ({ ok: true; videoSec: number } & RenderCharge)
  | { ok: false; code: 'too_long'; videoSec: number; maxSec: number }
  | {
      ok: false;
      code: 'quota_exhausted';
      videoSec: number;
      credits: number;
      used: number;
      limit: number;
      remaining: number;
      bonusBalance: number;
    };

export interface QuotaState {
  monthlyUsed: number;
  bonusBalance: number;
}

export declare const PLAN_TIER_IDS: PlanTierId[];
export declare const RESOLUTION_SCALE: Record<PlanResolution, number>;
export declare const RETENTION_BUCKETS_DAYS: number[];
export declare const SUBSCRIPTION_DAYS: Record<BillingCycle, number>;
export declare const PLAN_FEATURES: PlanFeatureMeta[];
export declare const DEFAULT_PLANS: DynamicPlanConfig[];
export declare const TOPUP_PACKS: TopupPack[];
export declare const MAX_SHORT_VIDEO_SEC: number;

export declare function mergePlanWithDefault(def: DynamicPlanConfig | undefined, override: Partial<DynamicPlanConfig> | undefined): DynamicPlanConfig;
export declare function mergePlansWithDefaults(remotePlans: unknown): DynamicPlanConfig[];
export declare function findPlan(plans: DynamicPlanConfig[] | undefined | null, tier: string): DynamicPlanConfig | null;
export declare function roundVideoSec(videoSec: number): number;
export declare function maxAllowedVideoSec(plan: DynamicPlanConfig | null | undefined): number;
export declare function maxRenderableVideoSec(plan: DynamicPlanConfig | null | undefined, bonusBalance?: number, topup?: TopupPack | null): number;
export declare function videoCredits(plan: DynamicPlanConfig | null | undefined, videoSec: number): number | null;
export declare function payableAmount(planOrTier: DynamicPlanConfig | string | null | undefined, cycle?: BillingCycle, plans?: DynamicPlanConfig[]): number;
export declare function annualFreeMonths(plan: DynamicPlanConfig | null | undefined): number;
export declare function resolutionScale(plan: DynamicPlanConfig | null | undefined): number;
export declare function retentionBucketDays(days: number): number;
export declare function uidTagOf(uid: string | null | undefined): string;
export declare function buildTransferMemo(kind: TransferKind, uid: string | null | undefined): string;
export declare function parseTransferMemo(text: string | null | undefined): { kind: TransferKind; tag: string } | null;
export declare function decideRenderCharge(args: {
  plan: DynamicPlanConfig | null | undefined;
  videoSec: number;
  monthlyUsed?: number;
  bonusBalance?: number;
  topup?: TopupPack | null;
}): RenderChargeDecision;
export declare function applyRenderCharge(state: QuotaState, charge: RenderCharge): QuotaState;
export declare function refundRenderCharge(state: QuotaState, charge: RenderCharge): QuotaState;
