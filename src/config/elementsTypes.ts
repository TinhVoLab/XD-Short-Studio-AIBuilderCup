/**
 * ── Elements Registry TypeScript Definitions ──────────────────────────────
 * Provides strict typing for all 74 registered graphic elements, charts,
 * flowcharts, dynamic cyber widgets, and STEM models.
 */

export type ElementCategory =
  | 'TYPOGRAPHY_BASIC'
  | 'DATA_CHARTS'
  | 'INFOGRAPHICS_FRAMEWORKS'
  | 'CINEMA_SOCIAL_PROOF'
  | 'DYNAMIC_FLOWS_PRO';

export type RegisteredElementType =
  // ── TYPOGRAPHY_BASIC ──────────────────────────────────────────────
  | 'rect'
  | 'badge'
  | 'progress'
  | 'line'
  | 'numbered-list'
  | 'highlight-box'
  | 'icon-text'
  | 'divider'
  | 'image'
  | 'master-hook'
  | 'master-scene'
  // ── DATA_CHARTS ───────────────────────────────────────────────────
  | 'stat-big'
  | 'metric-cards'
  | 'circle-chart'
  | 'gauge-chart'
  | 'chart-bar'
  | 'line-chart'
  | 'pie-chart'
  | 'candlestick-chart'
  | 'waterfall-chart'
  | 'sankey-chart'
  | 'heatmap-matrix'
  | 'radar-chart'
  | 'racing-bar-chart'
  // ── DYNAMIC_FLOWS_PRO ─────────────────────────────────────────────
  | 'orbit-system'
  | 'signal-wave'
  | 'cyber-matrix'
  | 'speed-meter'
  | 'liquid-fill'
  | 'neuron-network'
  | 'hologram-bar'
  | 'timeline-pulse'
  | 'lifecycle-matrix'
  | 'flowchart'
  | 'data-flow'
  | 'branching-flow'
  | 'parallel-flow'
  | 'mindmap-flow'
  | 'knowledge-graph'
  | 'funnel-flow'
  | 'roadmap-flow'
  // ── INFOGRAPHICS_FRAMEWORKS ───────────────────────────────────────
  | 'table'
  | 'vs-card'
  | 'vs-battle'
  | 'timeline'
  | 'pyramid-funnel'
  | 'tree-diagram'
  | 'network-graph'
  | 'dynamic-diagram'
  | 'ranking-list'
  | 'checklist'
  | 'hand-drawn'
  // ── CINEMA_SOCIAL_PROOF ───────────────────────────────────────────
  | 'social-callout'
  | 'document-evidence'
  | 'fake-search'
  | 'push-notification'
  | 'frame-mockup'
  | 'audio-waveform'
  | 'lottie'
  | 'quote-box'
  | 'chat-mockup'
  | 'quiz-card'
  | 'code-terminal'
  | 'breathing-circle'
  | 'zen-ripple'
  | 'zen-singing-bowl'
  | 'zen-pebble-balance'
  | 'vinyl-pulse'
  | 'character-mascot'
  // ── STEM SCIENCE & MATH ───────────────────────────────────────────
  | 'math-plot'
  | 'chemical-molecule'
  | 'latex-formula'
  | 'interactive-quiz'
  | 'physics-sim'
  | 'algorithm-sim'
  | 'vocab-card'
  | 'generative-svg'
  | 'visual-paradox';

export interface ElementVariant {
  id: string;
  label: string;
  bestFor: string;
}

export interface ElementUiConfig {
  groupTitle?: string;
  icon?: string;
  label?: string;
  previewBadge?: string;
  color?: string;
  preset?: string;
  defaultWidth?: number;
  defaultHeight?: number;
  defaultPercent?: number;
  defaultLabel?: string;
  defaultPayload?: Record<string, any>;
}

export interface ElementDefinition {
  category: ElementCategory | string;
  ui?: ElementUiConfig;
  ai?: (ACCENT: string) => string;
  variants?: ElementVariant[];
  boxIcons?: string[];
}

export interface UiChartItem {
  type: string;
  icon: string;
  label: string;
  previewBadge?: string;
  color: string;
  preset: string;
  defaultWidth?: number;
  defaultHeight?: number;
  defaultPercent?: number;
  defaultLabel?: string;
  defaultPayload?: Record<string, any>;
}

export interface UiChartGroup {
  groupTitle: string;
  items: UiChartItem[];
}

export type ElementsRegistryMap = {
  [K in RegisteredElementType]: ElementDefinition;
} & {
  [key: string]: ElementDefinition | undefined;
};

export type CoreCatalogMap = Record<ElementCategory | string, Record<string, string>>;
