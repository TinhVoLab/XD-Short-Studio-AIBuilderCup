import { Scene, SceneElement } from './scene';
import type { AnySceneRole } from '../config/sceneRoles';

export type VisualArchetype = 'general' | 'diagram' | 'chart' | 'bullets' | 'comparison' | 'stem' | 'hook';

export type LayoutMode = 'single' | 'split-vertical' | 'split-horizontal' | 'hero-with-caption';

/**
 * Context provided to the Deterministic Code Hydrator
 */
export interface HydrationContext {
  canvasWidth: number;
  canvasHeight: number;
  safeZoneTop: number;
  safeZoneBottom: number;
  accentColor: string;
  fontFamily: string;
  authorName?: string;
  theme?: 'dark' | 'light' | 'obsidian';
}

/**
 * Slot specifications for individual widgets
 */
export interface LatexFormulaSlots {
  latex: string;
  badge?: string;
  animMode?: 'write-on' | 'laser-scan' | 'pulse-glow';
}

export interface MathPlotSlots {
  expression: string;
  latexLabel?: string;
  mode?: 'function' | 'trig_circle' | 'calculus_area' | 'parametric';
  domainX?: [number, number];
  domainY?: [number, number];
}

export interface ChemicalMoleculeSlots {
  /** Tên tiếng Anh / IUPAC — server tra PubChem theo tên này */
  name: string;
  /** Tên hiển thị tiếng Việt */
  displayName?: string;
  /** Do server điền từ PubChem; AI không được tự viết */
  formula?: string;
  smiles?: string;
  pubchemCid?: number;
  theme?: 'neon' | 'dark' | 'light' | 'matrix' | 'cyberpunk';
}

export interface InteractiveQuizSlots {
  question: string;
  options: { id: string; text: string }[];
  correctId: string;
  explanation?: string;
}

export interface FlowchartSlots {
  steps: { title: string; subtitle?: string }[];
}

export interface RoadmapFlowSlots {
  milestones: { phase: string; title: string; time?: string }[];
}

export interface ChartSlots {
  chartData: { label: string; value: number; unit?: string }[];
}

export interface StatBigSlots {
  statValue: string;
  statLabel: string;
  subLabel?: string;
}

export interface VsBattleSlots {
  leftTitle: string;
  rightTitle: string;
  criteria?: { label: string; leftVal: string; rightVal: string }[];
}

export interface HighlightBoxSlots {
  items: string[];
  variant?: 'auto' | 'bullet-list' | 'callout-card' | 'multi-pill' | 'glow-pill' | 'accent-strip';
}

export interface QuoteBoxSlots {
  content: string;
  author?: string;
}

export interface SocialCalloutSlots {
  variant?: 'bank' | 'tweet' | 'chat' | 'news';
  accountName: string;
  message: string;
  amount?: string;
}

export interface DocumentEvidenceSlots {
  variant?: 'highlighter' | 'stamp' | 'note';
  docTitle: string;
  highlightedText: string;
  stampText?: string;
}

/**
 * Universal Envelope for a single scene returned by the System One AI Decision Engine
 */
export interface SceneSlotEnvelope {
  temporalRole?: AnySceneRole;
  archetype: VisualArchetype;
  layout?: LayoutMode;
  widgetType: string;
  title: string;
  voiceoverText: string;
  targetDuration?: number;
  slots: Record<string, any>;
  /** Từ/cụm 2 từ trong voiceoverText — widget xuất hiện đúng lúc giọng đọc tới đó */
  anchorWord?: string;
  /** Từ trong voiceoverText để nhấn (pulse) widget */
  emphasisWord?: string;
  /** Cường độ cảm xúc 0..1 — điều khiển camera & transition */
  energy?: number;
  sfxHint?: {
    primary?: string;
    secondary?: string;
  };
}

/**
 * Master Video Slot Envelope for Multi-Scene Script Generation
 */
export interface VideoSlotEnvelope {
  videoTitle: string;
  targetDuration?: number;
  themeStyle?: 'tech-minimal' | 'obsidian-glow' | 'academic' | 'cyberpunk';
  accentColor?: string;
  authorName?: string;
  hudTopic?: string;
  scenes: SceneSlotEnvelope[];
}

/**
 * Self-describing schema for any widget registered in the system
 */
export interface WidgetSlotDefinition<TSlots = any> {
  type: string;
  archetype: VisualArchetype;
  description: string;
  slotProperties: Record<string, { type: string; description: string; required?: boolean }>;
  defaultSlots: TSlots;
  sfxDefault?: { primary: string; secondary?: string };
  extractHeuristics: (prompt: string) => TSlots;
  hydrate: (slots: TSlots, context: HydrationContext) => Partial<SceneElement>;
}
