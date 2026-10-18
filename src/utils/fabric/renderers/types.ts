import * as fabric from 'fabric'
import { SceneElement } from '@/types/scene'

export interface CreateElementContext {
  canvas: fabric.Canvas
  element: SceneElement
  selectedElementId: string | null
}
