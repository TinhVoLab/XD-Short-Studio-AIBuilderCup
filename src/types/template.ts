import { ElementType } from './scene'

export const TEMPLATE_SCHEMA_VERSION = '1.0'

export type ContentToken =
  | '[TITLE]'       // Tiêu đề chính của cảnh (text lớn)
  | '[KEYWORD]'     // Từ khóa nổi bật (badge / giant number)
  | '[SUBTITLE]'    // Phụ đề / dòng mô tả
  | '[BULLET_LIST]' // Danh sách 3 bullets (highlight-box)
  | '[STEP_LIST]'   // Flowchart steps
  | '[STAT_VALUE]'  // Số liệu thống kê (stat-big)
  | '[CTA_TEXT]'    // Nội dung kêu gọi hành động
  | '[SCENE_INDEX]' // "01 / 05" (tự sinh, không AI)

export interface TemplateElementRule {
  slot: ContentToken
  type: ElementType
  id?: string
  left: number
  top: number
  width: number
  height: number
  scaleX?: number
  scaleY?: number
  angle?: number
  opacity?: number
  fontSize?: number
  fontFamily?: string
  fontWeight?: number | string
  color?: string               // Màu sắc đã là token: ${ACCENT} hoặc hex cụ thể
  textAlign?: string
  animPreset?: string
  animDelay?: number
  animDuration?: number
  // Cho graphic elements
  bgColor?: string
  accentColor?: string
  radius?: number
  [key: string]: any           // Các thuộc tính mở rộng
}

export interface SceneTemplate {
  sceneRole: 'hook' | 'content' | 'cta'
  bgColor: string
  bgPattern?: 'grid' | 'dots' | 'none' | 'mesh' | 'noise' | 'cyber-3d' | 'topo-contour' | 'speed-lines'
  duration: number
  elements: TemplateElementRule[]
  hudHeader?: string
}

export interface TemplatePackage {
  id: string
  schemaVersion: string
  name: string
  description?: string
  category: 'tech' | 'lifestyle' | 'education' | 'product' | 'custom'
  colorPalette: {
    accent: string
    bgDark: string
    textPrimary: string
  }
  fontPair: {
    heading: string
    body: string
  }
  hookTemplate: SceneTemplate
  contentTemplate: SceneTemplate
  ctaTemplate: SceneTemplate
  thumbnailBase64?: string
  createdAt: string
  isBuiltIn?: boolean
}
