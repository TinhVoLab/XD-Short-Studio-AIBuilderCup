export declare const PLOT_DEFAULT_DOMAIN_X: [number, number]
export declare const PLOT_DEFAULT_DOMAIN_Y: [number, number]
export declare const PARAMETRIC_TAU_RANGE: [number, number]
export declare const PLOT_SAMPLE_COUNT: number

export declare function normalizeLegacyExpr(raw: string): string

export declare function compileExpr(
  raw: string | undefined,
  vars?: string[]
): { fn: ((...args: number[]) => number) | null; error: string | null }

export declare function compileRenderFn(raw: string | undefined, vars?: string[]): ((...args: number[]) => number) | null

export declare function evalCoordExpr(val: number | string | undefined, timeSec: number, defaultVal?: number): number

export interface StemValidation {
  ok: boolean
  errors: string[]
  warnings: string[]
}

export declare function validatePlotData(data: Record<string, any> | undefined): StemValidation
