import type { MasterSceneData } from '@/types/scene'

export interface MasterTextSpan { text: string; tone: string }
export interface MasterFont { family: string; weight: number; size: number; lineHeight: number; letterSpacing: number }
/** outAt: giây (tính như delay) hộp tắt dần — chỉ trong video, canvas không vẽ */
export type MasterSceneItem = (
  | { kind: 'text'; x: number; y: number; width: number; height: number; lines: MasterTextSpan[][]; font: MasterFont; lineHeight: number; align: 'left' | 'center' | 'right'; anim?: string; delay?: number }
  | { kind: 'rect'; x: number; y: number; w: number; h: number; radius: number; fill?: string | null; stroke?: string | null; strokeWidth?: number; anim?: string; delay?: number; dur?: number }
  | { kind: 'icon'; name: string; x: number; y: number; w: number; h: number; tone: string; anim?: string; delay?: number }
) & { outAt?: number }

export declare const MASTER_SCENE_DEFAULT_WIDTH: number
export declare const MASTER_SCENE_MIN_WIDTH: number
export declare const MASTER_FONTS: { display: string; body: string; mono: string }
export declare const MASTER_SCENE_TEMPLATE_IDS: string[]
export declare function wrapRichText(tokens: MasterTextSpan[], width: number, font: MasterFont): MasterTextSpan[][]
export declare function layoutMasterScene(el: { width?: number; masterSceneData?: MasterSceneData }): {
  templateId: string
  width: number
  height: number
  items: MasterSceneItem[]
}
export declare function masterSceneHeight(el: { width?: number; masterSceneData?: MasterSceneData }): number
