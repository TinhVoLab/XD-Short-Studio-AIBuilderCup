export declare const AI_TIMEOUTS: {
  GATEWAY_TIMEOUT_MS: number;
  STAGE1_MS: number;
  STAGE1_REASONER_MS: number;
  STAGE2_MS: number;
  STAGE2_FALLBACK_MIN_MS: number;
  CLIENT_BUFFER_MS: number;
};
export declare function isReasonerModel(model: string | null | undefined): boolean;
export declare function serverBudgetMs(opts?: { isReasoner?: boolean }): number;
export declare function clientTimeoutMs(opts?: { isReasoner?: boolean }): number;
export declare function remainingMs(deadline: number, now?: number): number;
