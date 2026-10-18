import React from 'react';
import { SceneElement } from '../../types/scene';
import { useElementAnimation } from '../hooks/useElementAnimation';
import { ElementErrorBoundary } from './ElementErrorBoundary';

// Import Basic Elements
import {
  TextElement, ImageElement, ShapeElement, RectElement, LineElement,
  DividerElement, BadgeElement, ProgressElement, NumberedListElement,
  HighlightBoxElement, IconTextElement
} from './basic/BasicElements';

// Import Advanced Elements
import {
  FlowchartElement, TableElement, StatBigElement, ChartBarElement,
  VsCardElement, AudioWaveformElement, LottieElement, CircleChartElement,
  QuoteBoxElement, TimelineElement, MetricCardsElement, PyramidFunnelElement,
  VsBattleElement, RankingListElement, ChatMockupElement, QuizCardElement,
  CodeTerminalElement, ChecklistElement, MasterHookElement,
  LineChartElement, RadarChartElement, GaugeChartElement, PieChartElement,
  NetworkGraphElement, CandlestickChartElement, RacingBarChartElement,
  HeatmapMatrixElement, WaterfallChartElement,
  SankeyChartElement, TreeDiagramElement,
  BreathingCircleElement, VinylPulseElement
} from './AdvancedElements';
import { DataFlowElement } from './infographic/DataFlowElement';
import { BranchingFlowElement } from './infographic/BranchingFlowElement';
import { ParallelFlowElement } from './infographic/ParallelFlowElement';
import { MindmapFlowElement } from './infographic/MindmapFlowElement';
import { KnowledgeGraphElement } from './charts/KnowledgeGraphElement';
import { MasterSceneElement } from './master/MasterSceneElement';
import { FunnelFlowElement } from './infographic/FunnelFlowElement';
import { RoadmapFlowElement } from './infographic/RoadmapFlowElement';
import { DynamicDiagramElement } from './infographic/DynamicDiagramElement';
import { TikTokSubtitles } from '../components/TikTokSubtitles';
import { SocialCalloutElement } from './interactive/socialCallouts/SocialCalloutElement';
import { DocumentEvidenceElement } from './infographic/documentEvidence/DocumentEvidenceElement';
import { HandDrawnPathElement } from './motion/HandDrawnPathElement';
import { FakeSearchElement } from './motion/FakeSearchElement';
import { PushNotificationElement } from './motion/PushNotificationElement';
import { FrameMockupElement } from './motion/FrameMockupElement';
import { CharacterMascotElement } from './mascot/CharacterMascotElement';

import { OrbitSystemElement } from './charts/OrbitSystemElement';
import { SignalWaveElement } from './charts/SignalWaveElement';
import { CyberMatrixElement } from './charts/CyberMatrixElement';
import { SpeedMeterElement } from './charts/SpeedMeterElement';
import { LiquidFillElement } from './charts/LiquidFillElement';
import { NeuronNetworkElement } from './charts/NeuronNetworkElement';
import { HologramBarElement } from './charts/HologramBarElement';
import { TimelinePulseElement } from './charts/TimelinePulseElement';
import { LifecycleMatrixElement } from './charts/LifecycleMatrixElement';

// STEM Scientific Elements
import { MathPlotElement } from './stem/MathPlotElement';
import { LatexFormulaElement } from './stem/LatexFormulaElement';
import { ChemicalMoleculeElement } from './stem/ChemicalMoleculeElement';
import { InteractiveQuizElement } from './stem/InteractiveQuizElement';
import { VocabCardElement } from './stem/VocabCardElement';
import { PhysicsSimulationElement } from './physics/PhysicsSimulationElement';
import { AlgorithmSimulationElement } from './algorithms/AlgorithmSimulationElement';
import { VideoElement } from './basic/VideoElement';
import { GenerativeSvgElement } from './GenerativeSvgElement';
import { VisualParadoxElement } from './stem/paradox/VisualParadoxElement';

/**
 * SSOT Component Registry: Thay thế giant switch-case bằng O(1) Map Lookup
 */
export const ELEMENT_REGISTRY: Record<string, React.FC<any>> = {
  // ── Basic Elements ──────────────────────────────────────
  'text': TextElement,
  'image': ImageElement,
  'video': VideoElement,
  'shape': ShapeElement,
  'svg': ShapeElement,
  'rect': RectElement,
  'line': LineElement,
  'divider': DividerElement,
  'badge': BadgeElement,
  'progress': ProgressElement,
  'numbered-list': NumberedListElement,
  'highlight-box': HighlightBoxElement,
  'icon-text': IconTextElement,

  // ── Advanced NLE Elements ──────────────────────────────
  'flowchart': FlowchartElement,
  'table': TableElement,
  'stat-big': StatBigElement,
  'chart-bar': ChartBarElement,
  'vs-card': VsCardElement,
  'audio-waveform': AudioWaveformElement,
  'lottie': LottieElement,
  'hand-drawn': HandDrawnPathElement,
  'circle-chart': CircleChartElement,
  'quote-box': QuoteBoxElement,
  'timeline': TimelineElement,
  'metric-cards': MetricCardsElement,
  'pyramid-funnel': PyramidFunnelElement,
  'vs-battle': VsBattleElement,
  'ranking-list': RankingListElement,
  'chat-mockup': ChatMockupElement,
  'quiz-card': QuizCardElement,
  'code-terminal': CodeTerminalElement,
  'checklist': ChecklistElement,
  'master-hook': MasterHookElement,
  'master-scene': MasterSceneElement,
  'social-callout': SocialCalloutElement,
  'document-evidence': DocumentEvidenceElement,
  'caption': TikTokSubtitles,

  // ── Visual Data & Chart Elements ───────────────────────
  'line-chart': LineChartElement,
  'radar-chart': RadarChartElement,
  'gauge-chart': GaugeChartElement,
  'pie-chart': PieChartElement,
  'network-graph': NetworkGraphElement,
  'candlestick-chart': CandlestickChartElement,
  'racing-bar-chart': RacingBarChartElement,
  'heatmap-matrix': HeatmapMatrixElement,
  'waterfall-chart': WaterfallChartElement,
  'sankey-chart': SankeyChartElement,
  'tree-diagram': TreeDiagramElement,
  'dynamic-diagram': DynamicDiagramElement,
  'breathing-circle': BreathingCircleElement,
  'vinyl-pulse': VinylPulseElement,
  'fake-search': FakeSearchElement,
  'push-notification': PushNotificationElement,
  'frame-mockup': FrameMockupElement,
  'character-mascot': CharacterMascotElement,
  'data-flow': DataFlowElement,
  'branching-flow': BranchingFlowElement,
  'parallel-flow': ParallelFlowElement,
  'mindmap-flow': MindmapFlowElement,
  'knowledge-graph': KnowledgeGraphElement,
  'funnel-flow': FunnelFlowElement,
  'roadmap-flow': RoadmapFlowElement,

  // ── Cyber & Dynamic Flow ────────────────────────────────
  'orbit-system': OrbitSystemElement,
  'signal-wave': SignalWaveElement,
  'cyber-matrix': CyberMatrixElement,
  'speed-meter': SpeedMeterElement,
  'liquid-fill': LiquidFillElement,
  'neuron-network': NeuronNetworkElement,
  'hologram-bar': HologramBarElement,
  'timeline-pulse': TimelinePulseElement,
  'lifecycle-matrix': LifecycleMatrixElement,

  // ── STEM Scientific Module ──────────────────────────────
  'math-plot': MathPlotElement,
  'latex-formula': LatexFormulaElement,
  'chemical-molecule': ChemicalMoleculeElement,
  'interactive-quiz': InteractiveQuizElement,
  'vocab-card': VocabCardElement,
  'physics-sim': PhysicsSimulationElement,
  'algorithm-sim': AlgorithmSimulationElement,
  'generative-svg': GenerativeSvgElement,
  'visual-paradox': VisualParadoxElement,
};

/**
 * Probe đo layout & tương phản cho các bài kiểm tra render: chỉ bật khi render với
 * inputProps.__measureLayout / __measureContrast = true. Đọc thẳng window.remotion_inputProps vì getInputProps() ném lỗi
 * trong <Player>. Bọc bằng display: contents (không tạo hộp) và đo phần tử gốc của widget, nên áp dụng
 * cho mọi widget mà không phải sửa từng component. Mặc định tắt → render thật không bị ảnh hưởng.
 */
/** Cây hộp (cao × rộng) của widget để hiệu chỉnh công thức chiều cao — chỉ bật với __measureLayoutDeep */
const describeBoxes = (node: Element, depth = 0): string[] => {
  if (depth > 6) return [];
  const r = node.getBoundingClientRect();
  const text = node.children.length === 0 ? ` "${(node.textContent || '').trim().slice(0, 24)}"` : '';
  const line = `${'  '.repeat(depth)}${node.tagName.toLowerCase()} ${r.width.toFixed(1)}×${r.height.toFixed(1)}${text}`;
  return [line, ...Array.from(node.children).flatMap(c => describeBoxes(c, depth + 1))];
};

let probeFlags: { layout: boolean; deep: boolean; contrast: boolean } | null = null;
const getProbeFlags = () => {
  if (!probeFlags) {
    const raw = typeof window !== 'undefined' ? (window as any).remotion_inputProps : undefined;
    const str = typeof raw === 'string' ? raw : '';
    probeFlags = {
      layout: str.includes('"__measureLayout":true'),
      deep: str.includes('"__measureLayoutDeep":true'),
      contrast: str.includes('"__measureContrast":true'),
    };
  }
  return probeFlags;
};

type RGBA = [number, number, number, number];
/** rgb()/rgba() hoặc color(srgb r g b / a) (kết quả computed của color-mix) → [r, g, b, a] thang 255 */
const parseRgba = (c: string): RGBA | null => {
  const srgb = c.match(/color\(srgb\s+([^)]+)\)/);
  if (srgb) {
    const p = srgb[1].split(/[\s/]+/).filter(Boolean).map(Number);
    return [p[0] * 255, p[1] * 255, p[2] * 255, p.length > 3 ? p[3] : 1];
  }
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
};

const NON_VISUAL = new Set(['STYLE', 'SCRIPT', 'TITLE', 'DESC', 'DEFS', 'CLIPPATH', 'MASK', 'PATTERN', 'LINEARGRADIENT', 'RADIALGRADIENT', 'FILTER']);

/**
 * Báo mọi node chữ của widget (chỉ khi inputProps.__measureContrast): khung chữ trên khung hình, màu chữ khai báo
 * (color, hoặc fill với chữ SVG) đã nhân opacity tổ tiên. Màu NỀN được đo từ pixel ảnh render ở phía Node
 * (tests/render/widgetContrastAudit.mjs) nên đúng cả với gradient, hình SVG, ảnh phía sau chữ.
 */
const reportContrast = (root: HTMLElement, el: SceneElement) => {
  // Gốc toạ độ = góc khung hình (phần tử con của body). Lúc probe chạy Remotion còn đặt khung ở y ≈ −999999
  // rồi mới dời vào viewport để chụp, nên đo tương đối thay vì toạ độ viewport.
  let frameNode: Element = root;
  while (frameNode.parentElement && frameNode.parentElement !== document.body) frameNode = frameNode.parentElement;
  const frameBox = frameNode.getBoundingClientRect();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const seen = new Set<Element>();
  for (let t = walker.nextNode(); t; t = walker.nextNode()) {
    const text = (t.textContent || '').trim();
    const host = t.parentElement;
    // Chỉ ký hiệu trang trí (dấu ngoặc khổng lồ, ✦...) — WCAG không áp dụng cho trang trí
    if (!text || !host || seen.has(host) || !/[\p{L}\p{N}]/u.test(text)) continue;
    seen.add(host);
    let skip = false;
    for (let n: Element | null = host; n && n !== root.parentElement; n = n.parentElement) {
      if (NON_VISUAL.has(n.tagName.toUpperCase())) { skip = true; break; }
    }
    if (skip) continue;
    const cs = getComputedStyle(host);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    let opacity = 1;
    for (let n: Element | null = host; n && n !== root.parentElement; n = n.parentElement) opacity *= Number(getComputedStyle(n).opacity) || 0;
    if (opacity < 0.05) continue; // chưa hiện ở frame này
    const range = document.createRange();
    range.selectNodeContents(t);
    const r = range.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    const isSvgText = host instanceof SVGElement;
    const declared = parseRgba(isSvgText ? cs.fill : cs.color);
    // Chữ gradient (fill url(#...), background-clip: text) → màu chữ đo từ pixel
    const clipText = cs.webkitTextFillColor && parseRgba(cs.webkitTextFillColor)?.[3] === 0;
    const fg = declared && declared[3] > 0 && !clipText ? [declared[0], declared[1], declared[2], declared[3] * opacity] : null;
    const size = parseFloat(cs.fontSize);
    const weight = Number(cs.fontWeight) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    console.log(`CONTRAST_PROBE ${JSON.stringify({
      id: el.id, type: el.type, text: text.slice(0, 40), fg, rect: [r.left - frameBox.left, r.top - frameBox.top, r.width, r.height],
      min: large ? 3 : 4.5, size, weight,
    })}`);
  }
};

const LayoutProbe: React.FC<{ el: SceneElement; children: React.ReactNode }> = ({ el, children }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const flags = getProbeFlags();
  const enabled = flags.layout || flags.contrast;
  React.useLayoutEffect(() => {
    const root = ref.current?.firstElementChild as HTMLElement | null;
    if (!enabled || !root) return;
    if (flags.layout) console.log(`LAYOUT_PROBE ${JSON.stringify({ id: el.id, type: el.type, height: root.offsetHeight, boxes: flags.deep ? [`style ${(({ height, maxHeight, minHeight, display, position, boxSizing }) => JSON.stringify({ height, maxHeight, minHeight, display, position, boxSizing }))(getComputedStyle(root))} inline=${root.getAttribute('style')}`, ...describeBoxes(root)] : undefined })}`);
    if (flags.contrast) reportContrast(root, el);
  });
  if (!enabled) return <>{children}</>;
  return <div ref={ref} style={{ display: 'contents' }}>{children}</div>;
};

export const ElementFactory: React.FC<{
  el: SceneElement;
  fps: number;
  sceneDuration?: number;
}> = React.memo(({ el, fps, sceneDuration }) => {
  const animData = useElementAnimation(el, fps, sceneDuration);

  // Unified props passed to registered components
  const advProps = {
    el,
    computedStyle: animData.style,
    positionStyle: animData.positionStyle,
    textStyle: animData.textStyle,
    content: animData.content,
    frame: animData.frame,
    fps,
    delayFrames: animData.delayFrames,
    durFrames: animData.durFrames,
    sceneDuration: sceneDuration ?? 5,
    wordTimings: el.wordTimings,
  };

  const Component = ELEMENT_REGISTRY[el.type];

  return (
    <ElementErrorBoundary el={el}>
      <LayoutProbe el={el}>{Component ? <Component {...advProps} /> : null}</LayoutProbe>
    </ElementErrorBoundary>
  );
});
