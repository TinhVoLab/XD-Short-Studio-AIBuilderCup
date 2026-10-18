import type { DiagramNode, DiagramEdge, DynamicDiagramData } from '@/types/scene';

export interface LayoutedNode extends DiagramNode {
  x: number;
  y: number;
  width: number;
  height: number;
  shape: 'rect' | 'diamond' | 'pill' | 'circle' | 'cylinder';
  lines: string[];
}

export interface LayoutedEdge extends DiagramEdge {
  pathD: string;
  labelX: number;
  labelY: number;
  isFeedback?: boolean;
}

export interface GraphLayoutResult {
  width: number;
  height: number;
  nodes: LayoutedNode[];
  edges: LayoutedEdge[];
  maxLayer: number;
}

export declare function computeGraphLayout(data: DynamicDiagramData, containerWidth?: number, hasTitle?: boolean): GraphLayoutResult;
