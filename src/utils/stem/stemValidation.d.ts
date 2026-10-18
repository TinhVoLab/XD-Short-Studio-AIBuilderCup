import type { StemValidation } from './mathExpr'

export declare function validateChemData(data: Record<string, any> | undefined): StemValidation
export declare function validateStemElement(el: { type?: string; [key: string]: any }): StemValidation
export declare function fallbackCalloutText(voiceText: string): string
