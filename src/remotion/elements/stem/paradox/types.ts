export type ParadoxCategory = 'geometry' | 'calculus' | 'probability' | 'physics' | 'computer_science' | 'ai';

export type ParadoxArchetype = 'parametric_race' | 'traffic_flow' | 'array_sorting' | 'neural_network' | 'dynamic_sandbox';

export type ParadoxTimingMode = 'auto-fit' | 'continuous' | 'storyboard-warp';

export type ParadoxCameraMode = 'auto-director' | 'hub-tracking' | 'overview' | 'slip-focus' | 'leader-tracking' | 'finish-focus';

export interface ParadoxParamSchema {
  key: string;
  label: string;
  type: 'number' | 'boolean' | 'select' | 'text';
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  default: any;
  options?: { value: string; label: string }[];
}

export interface TelemetryMetric {
  label: string;
  value: string;
  color?: string;
}

export interface CameraFocusState {
  x: number;
  y: number;
  zoom: number;
}

export interface IParadoxDefinition {
  id: string;
  name: string;
  category: ParadoxCategory;
  archetype?: ParadoxArchetype;
  description: string;
  latexFormula: string;
  cueKeywords?: string[];
  soundFxArchetype?: 'traffic' | 'sorting' | 'neural' | 'mechanical' | 'generic';
  defaultParams: Record<string, any>;
  paramsSchema: ParadoxParamSchema[];
  getCameraFocus: (
    tSec: number,
    tau: number,
    params: Record<string, any>,
    cameraMode: ParadoxCameraMode
  ) => CameraFocusState;
  renderFrame: (
    ctx: CanvasRenderingContext2D,
    tSec: number,
    tau: number,
    params: Record<string, any>,
    bounds: { w: number; h: number },
    colors: { accent: string; secondary: string }
  ) => void;
  getTelemetryMetrics: (
    tSec: number,
    tau: number,
    params: Record<string, any>,
    colors: { accent: string; secondary: string }
  ) => TelemetryMetric[];
}

import { MathDeclarativeSpec } from './math/mathAstTypes';

export interface VisualParadoxData {
  paradoxId: string;
  title?: string;
  archetype?: ParadoxArchetype;
  timingMode?: ParadoxTimingMode;
  cameraMode?: ParadoxCameraMode;
  showHUD?: boolean;
  showTrails?: boolean;
  showFormulas?: boolean;
  separateFormula?: boolean;
  params?: Record<string, any>;
  mathSpec?: MathDeclarativeSpec;
  accentColor?: string;
  secondaryColor?: string;
  startTau?: number;
  endTau?: number;
  persistentTrails?: boolean;
}
