export type SceneRoleId = 'hook' | 'bridge' | 'content' | 'retention' | 'climax' | 'cta'
/** Giá trị cũ còn trong dự án đã làm: normal = content, highlight = content điểm nhấn */
export type LegacySceneRoleId = 'normal' | 'highlight'
export type AnySceneRole = SceneRoleId | LegacySceneRoleId

export interface SceneRoleSpec {
  shortLabel: string
  label: string
  hint: string
  energy: number
  duration: { min: number; target: number; max: number }
  maxWords: number
}

export declare const SCENE_ROLE_IDS: SceneRoleId[]
export declare const LEGACY_SCENE_ROLE_IDS: LegacySceneRoleId[]
export declare const SCENE_ROLES: Record<SceneRoleId, SceneRoleSpec>

export declare function sceneRoleSpec(role: string | undefined | null): SceneRoleSpec
export declare function isKnownSceneRole(role: string | undefined | null): role is AnySceneRole
export declare function highlightSceneIndex(n: number): number
export declare function inferRoleByIndex(index: number, total: number): 'hook' | 'normal' | 'highlight' | 'cta'
export declare function effectiveSceneRole(scene: { temporalRole?: string } | undefined | null, index: number, total: number): AnySceneRole
export declare function canonicalSceneRole(role: string | undefined | null): SceneRoleId
export declare function isPeakScene(sceneOrRole: string | { temporalRole?: string } | undefined | null): boolean
export declare function roleEnergy(role: string | undefined | null): number
export declare function sceneDurationForRole(
  role: string,
  scene?: { audioDuration?: number; voiceoverText?: string; transition?: { duration?: number } }
): number
export declare function plannedSceneDuration(role: string, words: number, speechRateWps: number, opts?: { contentMax?: number }): number
