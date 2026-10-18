import type { SceneRoleId } from './sceneRoles'
import type { SceneSurface } from './themePalettes'

export type OpenLoopType = 'answer' | 'locked_item' | 'full_list' | 'outcomes' | 'key_point' | 'next_episode'

export type RecipeSlotDef =
  | { label: string; key: string; type: 'text'; maxWords: number; required: boolean }
  | { label: string; key: string; type: 'number'; maxChars: number; required: boolean }
  | { label: string; key: string; type: 'integer'; min: number; max: number; required: boolean; indexOf?: string }
  | { label: string; key: string; type: 'list'; minItems: number; maxItems: number; maxWords: number; required: boolean }

export interface SceneRecipe {
  role: SceneRoleId
  group: string
  name: string
  formula: string
  slots: RecipeSlotDef[]
  emphasisSlot: string | null
  surface: SceneSurface | null
  showsPosition?: boolean
  /** Gợi ý cho AI: dùng mẫu này khi nào */
  useWhen: string
  /** Gợi ý cách viết slot cho AI */
  aiHint?: string
  /** slot hệ thống tự điền → nguồn giá trị */
  systemSlots?: Record<string, 'contentCount'>
  /** slot danh sách phải có đúng số cảnh nội dung */
  listMatchesContent?: string
  /** lời hứa phải đã mở ở cảnh trước */
  requiresOpen?: OpenLoopType[]
  /** chép slot từ mẫu đã mở lời hứa */
  copySlotsFrom?: { recipe: string; keys: string[] }
  pairsWith: { before: string[]; after: string[] }
  opensLoop: OpenLoopType | null
  closesLoop: OpenLoopType[]
  requires: string[]
}

export declare const OPEN_LOOP_TYPES: OpenLoopType[]
export declare const SYSTEM_SLOT_SOURCES: Array<'contentCount'>
export declare function defaultRecipeId(role: SceneRoleId): string | null
export declare function aiSlots(id: string): RecipeSlotDef[]
export declare const SCENE_RECIPES: Record<string, SceneRecipe>
export declare function getSceneRecipe(id: string): SceneRecipe | null
export declare function recipesForRole(role: SceneRoleId): Array<SceneRecipe & { id: string }>
export declare function nextRecipeIds(id: string, role?: SceneRoleId): string[]
export declare function validateRecipeSlots(id: string, slots?: Record<string, unknown>): { ok: boolean; errors: string[] }
export declare function auditSceneRecipes(): string[]
