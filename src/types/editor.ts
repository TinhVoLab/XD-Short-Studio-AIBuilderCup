// ── Editor state types ────────────────────────────────
export type ActivePanel =
  | 'ai-story' | 'templates' | 'assets' | 'mascot'
  | 'text' | 'svg' | 'motion' | 'audio'
  | 'elements' | 'education' | 'stem' | 'filters' | 'transitions' | 'captions' | 'settings'
  | null

export type InspectorTab = 'design' | 'effects' | 'advanced'

export type VideoFormat = 'tiktok' | 'reels' | 'shorts' | 'stories'

export type WorkspaceLayout = 'classic' | 'right-standalone'

export interface VideoFormatConfig {
  label: string
  width: number
  height: number
  ratio: string
}

export const VIDEO_FORMATS: Record<VideoFormat, VideoFormatConfig> = {
  tiktok:  { label: 'Video TikTok 9:16',       width: 1080, height: 1920, ratio: '9:16' },
  reels:   { label: 'Instagram Reels 9:16',     width: 1080, height: 1920, ratio: '9:16' },
  shorts:  { label: 'YouTube Shorts 9:16',      width: 1080, height: 1920, ratio: '9:16' },
  stories: { label: 'Facebook Stories 9:16',    width: 1080, height: 1920, ratio: '9:16' },
}
