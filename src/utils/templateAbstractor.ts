import { Scene, SceneElement } from '@/types/scene'
import { ContentToken, SceneTemplate, TemplateElementRule } from '@/types/template'

export function detectSceneRole(scene: Scene): 'hook' | 'content' | 'cta' {
  const name = scene.name.toLowerCase()
  if (name.includes('hook')) return 'hook'
  if (name.includes('cta') || name.includes('hành động') || name.includes('kết luận')) return 'cta'
  return 'content'
}

export function abstractSceneToTemplate(scene: Scene): SceneTemplate {
  const rules: TemplateElementRule[] = scene.elements.map(el => {
    let slot: ContentToken = '[SUBTITLE]'

    // Basic heuristic to abstract content to semantic tokens
    if (el.type === 'text') {
      const fs = el.fontSize || 24
      if (fs >= 60) {
        slot = '[KEYWORD]'
      } else if (fs >= 28) {
        slot = '[TITLE]'
      } else if (fs >= 16) {
        slot = '[SUBTITLE]'
      }
      // Contextual overrides
      if (el.content?.includes('01 /') || el.content?.includes('/ 10')) {
        slot = '[SCENE_INDEX]'
      }
      if (el.content?.toLowerCase().includes('bắt đầu') || el.content?.toLowerCase().includes('follow')) {
        slot = '[CTA_TEXT]'
      }
    } 
    else if (el.type === 'highlight-box' || el.type === 'numbered-list') {
      slot = '[BULLET_LIST]'
    } 
    else if (el.type === 'flowchart') {
      slot = '[STEP_LIST]'
    } 
    else if (el.type === 'stat-big') {
      slot = '[STAT_VALUE]'
    } 
    else if (el.type === 'badge' || el.type === 'icon-text') {
      slot = '[KEYWORD]'
    }

    // Extract layout & style properties, omit content-specific data
    const {
      content,
      items,
      flowSteps,
      tableData,
      statValue,
      statLabel,
      chartData,
      sankeyData,
      treeData,
      leftCard,
      rightCard,
      keyframes,
      id,
      ...styleProps
    } = el as any

    return {
      slot,
      ...styleProps,
    } as TemplateElementRule
  })

  return {
    sceneRole: detectSceneRole(scene),
    bgColor: scene.bgColor,
    bgPattern: scene.bgPattern,
    duration: scene.duration,
    elements: rules,
    hudHeader: scene.hudHeader,
  }
}

export async function generateThumbnailBase64(canvasEl: HTMLCanvasElement | null): Promise<string | undefined> {
  if (!canvasEl) return undefined
  try {
    // Generate a low-res thumbnail
    return canvasEl.toDataURL('image/jpeg', 0.5)
  } catch (err) {
    console.error('Failed to generate thumbnail', err)
    return undefined
  }
}
