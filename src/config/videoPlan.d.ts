import type { SceneRoleId } from './sceneRoles'

export declare const MASTER_FRAMEWORK_ID: 'master-chain';

export interface PlannedSceneSlot { role: SceneRoleId; recipeId: string; recipeOptions: string[]; plannedSec: number; voiceWords: number }
export interface VideoPlanScene { role: SceneRoleId; recipeId: string; slots: Record<string, unknown>; voiceoverText: string; plannedSec?: number }

export declare const MASTER_MIN_TARGET_SEC: number
export declare const MASTER_MAX_CONTENT: number
export declare const RETENTION_MIN_TARGET_SEC: number
export declare const RETENTION_AFTER_CONTENT: number
export declare function contentCountFor(targetSec: number): number
export declare function planMasterStructure(targetSec: number): PlannedSceneSlot[]
export declare function plannedTotalSec(structure: PlannedSceneSlot[]): number
export declare function applyChainConstraints<T extends VideoPlanScene>(scenes: T[]): T[]
export declare function validateVideoPlan(scenes: VideoPlanScene[]): { ok: boolean; errors: string[]; warnings: string[] }
