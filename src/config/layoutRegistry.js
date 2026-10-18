/**
 * ==============================================================================
 * 🏛️ LAYOUT REGISTRY - SINGLE SOURCE OF TRUTH (SSOT) FOR LAYOUTS & SLOTS (V10)
 * ==============================================================================
 * Centralized definition for all Video Layout Archetypes, Slots, SFX Profiles,
 * Safe-Zone Bounds, Element Default Heights, and Priority Rankings.
 */

import { HIGHLIGHT_BOX_SPEC, layoutHighlightBox } from './highlightBoxLayout.js';
import { estimateTextLines, measureTextWidth, FIT_EPSILON } from './textMetrics.js';
import { HOOK_LAYOUT_SPEC, layoutMasterHookHeight } from './hookLayout.js';
import { MASTER_SCENE_DEFAULT_WIDTH, masterSceneHeight } from './masterSceneLayout.js';
import { computeGraphLayout } from './graphLayout.js';
import { DEFAULT_CHECKLIST_ITEMS, DEFAULT_TERMINAL_CODE, DEFAULT_VS_ROUNDS, DEFAULT_NUMBERED_ITEMS, DEFAULT_SANKEY_DATA, DEFAULT_TREE_DATA, DEFAULT_DIAGRAM_DATA } from './widgetDefaults.js';

export const SAFE_ZONE = {
  TOP: 60,
  BOTTOM: 480,
  WIDTH: 340,
  CENTER_X: 180,
  MAX_HEIGHT: 420,
  MIN_GAP: 14,
};

/**
 * Gốc toạ độ (origin) của element: left/top trỏ vào điểm nào của khung.
 * Phải khớp getElementAlignment() trong fabricPlaceholders.ts (unit test layoutResolver kiểm tra).
 */
export const CENTER_ORIGIN_TYPES = new Set(['orbit-system', 'character-mascot', 'hand-drawn', 'audio-waveform']);
export const LEFT_ORIGIN_TYPES = new Set(['rect', 'line', 'progress', 'icon-text']);

export function getElementOrigin(el) {
  if (el.type === 'text' || el.type === 'caption') {
    const x = el.textAlign === 'center' ? 'center' : el.textAlign === 'right' ? 'right' : 'left';
    return { x, y: 'top' };
  }
  if (CENTER_ORIGIN_TYPES.has(el.type)) return { x: 'center', y: 'center' };
  if (LEFT_ORIGIN_TYPES.has(el.type)) return { x: 'left', y: 'top' };
  return { x: 'center', y: 'top' };
}

/**
 * 📏 CARD & BOX WIDTH SPECS (SSOT)
 * Centralized geometric bounds for all card-based components across the Studio.
 */
export const CARD_LAYOUT_SPECS = {
  SAFE_MAX_WIDTH: 344, // 360px canvas with 8px safe margin each side
  SAFE_MIN_WIDTH: 180,
  DEFAULT_CARD_WIDTH: 320,
  DEFAULT_CHART_WIDTH: 336,
  STEP: 4,
};

const CHART_OR_COMPLEX_TYPES = new Set([
  'chart-bar', 'line-chart', 'pie-chart', 'candlestick-chart', 'waterfall-chart',
  'sankey-chart', 'heatmap-matrix', 'hologram-bar', 'radar-chart', 'racing-bar-chart',
  'gauge-chart', 'pyramid-funnel', 'tree-diagram', 'dynamic-diagram', 'math-plot',
  'visual-paradox', 'table', 'checklist', 'timeline'
]);

/**
 * Get automated geometric width specs for any element type
 */
export function getElementWidthSpecs(elementType) {
  const isComplex = CHART_OR_COMPLEX_TYPES.has(elementType);
  return {
    min: isComplex ? 240 : CARD_LAYOUT_SPECS.SAFE_MIN_WIDTH,
    max: CARD_LAYOUT_SPECS.SAFE_MAX_WIDTH,
    default: isComplex ? CARD_LAYOUT_SPECS.DEFAULT_CHART_WIDTH : CARD_LAYOUT_SPECS.DEFAULT_CARD_WIDTH,
    step: CARD_LAYOUT_SPECS.STEP,
  };
}

export const ELEMENT_DEFAULT_HEIGHTS = {
  'badge': 24,
  'text': 40,
  'highlight-box': 65,
  'divider': 2,
  'line': 2,
  'progress': 6,
  'stat-big': 120,
  'metric-cards': 130,
  'circle-chart': 140,
  'gauge-chart': 180,
  'chart-bar': 150,
  'line-chart': 160,
  'pie-chart': 244,
  'candlestick-chart': 220,
  'waterfall-chart': 220,
  'sankey-chart': 220,
  'heatmap-matrix': 200,
  'hologram-bar': 230,
  'radar-chart': 280,
  'racing-bar-chart': 200,
  'flowchart': 250,
  'table': 180,
  'vs-battle': 240,
  'vs-card': 160,
  'pyramid-funnel': 220,
  'tree-diagram': 200,
  'network-graph': 260,
  'dynamic-diagram': 260,
  'knowledge-graph': 640,
  'checklist': 200,
  'quote-box': 140,
  'chat-mockup': 180,
  'code-terminal': 160,
  'quiz-card': 180,
  'ranking-list': 280,
  'timeline': 180,
  'audio-waveform': 60,
  'lottie': 120,
  'social-callout': 140,
  'document-evidence': 140,
  'master-hook': 240,
  'master-scene': 300,
  'breathing-circle': 220,
  'vinyl-pulse': 85,
  'image': 140,
  'generative-svg': 220,
  'character-mascot': 310,
};

export const PHI = 1.61803398875;
export const FIBONACCI_GAPS = [8, 13, 21, 34];
export const GOLDEN_FOCAL_Y = 245; // 640 * (1 - 1/PHI) ≈ 244.5
export const GOLDEN_LOWER_Y = 395; // 640 / PHI ≈ 395.5
export const MIN_COMPRESSION_SCALE = 0.60; // 60% minimum elastic scale
export const VIETNAMESE_SAFETY_MARGIN = 10; // 10px buffer for Vietnamese multi-word wraps

/**
 * ==============================================================================
 * 📦 UNIFIED ELEMENT BOX MODEL SPECS (DECLARATIVE GEOMETRY DICTIONARY)
 * ==============================================================================
 * Pure declarative configuration parameters for H = f(X).
 * Adding new widgets requires only adding entries here, zero code duplication.
 */
export const ELEMENT_BOX_SPECS = {
  // Khớp ChecklistElement.tsx (đo DOM: tests/render/widgetLayoutAudit.mjs)
  'checklist': {
    padY: 24, padX: 28, border: 1, borderCyber: 1.5, sectionGap: 8,
    headerFont: 12.5, headerPadB: 6, headerBorder: 1,
    rowGap: 6, rowPadY: 14, rowPadX: 18, rowBorder: 1, badge: 20, badgeGap: 8, textGap: 1,
    titleFont: 10.5, titleWeight: 700, titleLH: 1.25,
    subFont: 8.5, subWeight: 500, subLH: 1.15,
    footerMarginT: 2, footerPadY: 8, footerBorder: 1, footerFont: 9.5,
    /** line-height "normal" của Be Vietnam Pro ≈ 1.4 × fontSize (span không đặt line-height) */
    normalLH: 1.4,
  },
  'timeline': {
    cardPadding: 28,
    framelessPadding: 12,
    headerH: 38,
    nodeSize: 28,
    titleH: 20,
    subtitleH: 18,
    gapDefault: 16,
    gapDense: 12,
  },
  'numbered-list': {
    // NumberedListElement: cột gap 8, mỗi dòng = max(số tròn 22, chữ 600 · lineHeight 1.3), không padding
    gap: 8,
    badge: 22,
    badgeGap: 10,
    fontSize: 14,
    weight: 600,
    lineHeight: 1.3,
  },
  'ranking-list': {
    basePadding: 24 + VIETNAMESE_SAFETY_MARGIN,
    headerH: 36,
    itemH: 50,
    itemGap: 7,
  },
  // Hình học chi tiết theo từng kiểu: src/config/highlightBoxLayout.js (SSOT)
  'highlight-box': HIGHLIGHT_BOX_SPEC,
  'quote-box': {
    basePadding: 24 + VIETNAMESE_SAFETY_MARGIN,
    lineHeight: 44,
    minH: 65,
    maxH: 220,
  },
  // Hình học 17 layout của master-hook: src/config/hookLayout.js (SSOT, dùng chung với cỡ chữ hero của Remotion)
  'master-hook': HOOK_LAYOUT_SPEC,
  // Hình học các mẫu cảnh Master: src/config/masterSceneLayout.js (danh sách hộp dùng chung Remotion + Fabric)
  'master-scene': { defaultWidth: MASTER_SCENE_DEFAULT_WIDTH },
  // Khớp FlowchartElement.tsx: root kế thừa lineHeight 1.15; tiêu đề/phụ đề bước nowrap (không xuống dòng)
  'flowchart': {
    padTop: 10, padBottom: 10, headerIcon: 14, headerFont: 11.5, inheritedLH: 1.15, headerPadB: 7, headerBorder: 1,
    gap: 8, stepBorder: 1, stepPadY: 8, badge: 28, titleFont: 12, subFont: 9.5, subMarginT: 2, connectorH: 14,
  },
  'table': {
    padTop: 16,
    padBottom: 16,
    padX: 14,
    headerH: 29,
    gap: 12,
    rowItemH: 52,
    rowGap: 14,
  },
  'vs-battle': {
    // VsBattleElement: cột flex gap 10 (header · divider · rounds · banner), không padding, cao theo nội dung
    gap: 10,
    headerPadY: 24, headerBorder: 2, headerIcon: 20, nameFont: 12,
    pillChrome: 13, pillFont: 18,
    divider: 1,
    roundGap: 7, rowChrome: 20, rowIcon: 15, rowPadX: 24, colPad: 14, colRatio: 3.6, critRatio: 1.6,
    valInset: 20, // icon 15 + gap 5 trong cột trái/phải (cột trái pad-left 12, cột phải 2 — đã trừ ở colPad)
    valFont: 11, valWeight: 700, critFont: 10, critWeight: 800, critLH: 1.2,
    bannerMarginT: 4, bannerChrome: 23, bannerIcon: 16, bannerInset: 55, bannerFont: 12, bannerWeight: 900, bannerLS: 0.5,
    normalLH: 1.26, // line-height "normal" của Be Vietnam Pro
    defaultWidth: 330,
  },
  'vs-card': {
    basePadding: 20 + VIETNAMESE_SAFETY_MARGIN,
    headerH: 32,
    itemH: 36,
    minH: 150,
  },
  'code-terminal': {
    // CodeTerminalElement: viền 1 + header (8·2 + nút/filename + viền dưới 1) + thân pad 12/14, minHeight 100
    borderW: 1,
    headerH: 33,
    padTop: 12,
    padBottom: 12,
    padX: 14,
    bodyMinH: 100,
    fontSize: 11,
    lineHeightRatio: 1.5,
    monoCharW: 0.6,
    defaultWidth: 320,
  },
  'knowledge-graph': {
    headerH: 48,
    basePadding: 24,
    rootNodeH: 32,
    tierGap: 140,
    spineStepGap: 80,
    heroExpansionBonus: 45,
    minH: 480,
    maxH: 640,
  },
  'branching-flow': {
    // BranchingFlowElement co node theo khung h; công thức = khung nhỏ nhất để node đạt cỡ đầy đủ
    pad: 12,
    childH: 52, childGap: 12,      // ngang: childH = min(52, (h − (n−1)·12 − 24) / n)
    rootH: 65, rootRatio: 0.3,     // ngang: rootH = min(65, 0.3·h)
    rootHV: 60, rootRatioV: 0.25,  // dọc: rootH = min(60, 0.25·h)
    childHV: 65, childRatioV: 0.35, // dọc: childH = min(65, 0.35·h)
  },
  'tree-diagram': {
    // Khớp TreeDiagramElement.tsx: card padding 12/14, viền 1, cột gap 6; header luôn hiển thị (fallback tiêu đề)
    padY: 12,
    padX: 14,
    cardBorder: 1,
    sectionGap: 6,
    headerLineH: 15.1, // span 11.5px line-height "normal" (đo DOM)
    headerPadB: 6,
    headerBorder: 1,
    bodyMarginTop: 2,
    rootH: 42,
    svgMinH: 36, // svgH = max(36, 28 + 3·số nhánh), margin -2/-2
    svgBaseH: 28,
    svgPerBranch: 3,
    svgOverlap: 4,
    rowGap: 7,
    rowPadY: 7,
    rowPadX: 10,
    rowBorder: 1,
    rowInnerGap: 8, // gap giữa tên nhóm và cụm pill
    groupDotW: 12, // chấm 6 + gap 6
    groupFont: 11.5,
    groupWeight: 800,
    groupLineH: 15.1,
    pillFont: 9.5,
    pillWeight: 700,
    pillLineH: 13.1, // span 9.5px line-height "normal" (đo DOM)
    pillChromeX: 14, // padding 6·2 + viền 1·2
    pillChromeY: 6, // padding 2·2 + viền 1·2
    pillGap: 4, // flex gap 4 (cả hàng và cột khi wrap)
    defaultWidth: 336,
  },
  'roadmap-flow': {
    // RoadmapFlowElement vẽ trong khung cố định el.height || 280; thẻ mốc co lại cho vừa (không co theo nội dung)
    defaultH: 280,
  },
  'pyramid-funnel': {
    // PyramidFunnelElement vẽ SVG trong khung cố định el.height || 260 (không co theo nội dung)
    defaultH: 260,
    minW: 260,
    maxW: 520,
  },
  // dynamic-diagram: chiều cao do computeGraphLayout (src/config/graphLayout.js) tính theo nội dung — không cần spec
  'pie-chart': {
    padTop: 14,
    padBottom: 14,
    padX: 16,
    headerH: 24,
    containerGap: 8,
    bodyMarginTop: 2,
    donutSize: 150,
    donutSizeCompact: 130,
    legendMarginTop: 8,
    legendPillH: 24,
    legendRowGap: 6,
    legendColGap: 8,
    avgPillW: 92,
    minH: 220,
    maxH: 360,
  },
  'chart-bar': {
    padTop: 14,
    padBottom: 14,
    padX: 16,
    headerH: 30,
    headerGap: 10,
    itemH: 29.5, // chiều cao dòng đo DOM (chữ + line-height), 28 làm thiếu ~6px
    itemGap: 10,
    minH: 80,
    maxH: 480,
  },
  'circle-chart': {
    minSize: 100,
    maxSize: 320,
    labelExtraRatio: 0.16,
    labelExtraMin: 24,
    labelMargin: 8,
  },
  'gauge-chart': {
    headerH: 32,
    centerRatioY: 0.46,
    arcPaddingY: 14,
    hudHeightWithLabel: 50,
    hudHeightNoLabel: 36,
    minW: 200,
    maxW: 380,
  },
  'sankey-chart': {
    // Khớp SankeyChartElement.tsx: mọi khối cao cố định; chỉ header (tiêu đề nowrap) và viền thay đổi
    padY: 14,
    padYCompact: 10,
    cardBorder: 1, // viền glass 1px (frameless: 0)
    titleFont: 12.5,
    titleFontCompact: 11,
    titleLH: 1.45, // getTypographyStyle lineHeight
    headerIcon: 13,
    headerGap: 10, // marginBottom header
    headerGapCompact: 8,
    sourceNodeH: 48,
    sourceNodeHCompact: 42,
    ribbonSvgH: 44, // svgH = max(44, 34 + 4·số luồng)
    ribbonSvgBase: 34,
    ribbonSvgPerFlow: 4,
    ribbonSvgHCompact: 36,
    ribbonOverlap: 6, // margin -3/-3 của SVG
    flowRowH: 44,
    flowRowHCompact: 38,
    flowRowGap: 8,
    flowRowGapCompact: 6,
    minW: 280,
    maxW: 460,
  },
  'heatmap-matrix': {
    padTop: 12,
    padBottom: 12,
    padX: 14,
    headerH: 26,
    headerGap: 8,
    cellGap: 4,
    legendH: 22,
    legendGap: 8,
    minH: 180,
    maxH: 520,
    minW: 260,
    maxW: 400,
  },
  'hologram-bar': {
    // HologramBarElement vẽ SVG trong khung cố định el.height || 240 (cột co theo khung)
    defaultH: 240,
    minW: 260,
    maxW: 520,
  },
  'visual-paradox': {
    cardPadding: 24,
    framelessPadding: 8,
    headerH: 38,
    hudH: 40,
    baseStageH: 420,
    minH: 320,
    maxH: 640,
  },
  'network-graph': {
    headerH: 32,
    basePadding: 16,
    minH: 180,
    maxH: 520,
  },
  'badge': {
    padX: 24, // 12px left + 12px right
    padY: 8,  // 4px top + 4px bottom
    charWidthRatio: 0.65, // Be Vietnam Pro Bold approx width
    minW: 48,
    minH: 22,
    lineHeightRatio: 1.3,
  },
};

/**
 * ==============================================================================
 * 📐 FORMULA W, H = f(X): DYNAMIC PILL BADGE DIMENSIONS CALCULATION
 * ==============================================================================
 * Deterministically computes bounding-box width, height, and radius based on
 * text content and font size. Eliminates hardcoded magic sizes and guarantees 1:1
 * synchronization between Fabric.js Canvas Editor and Remotion Video Render.
 */
export function calculateBadgeDimensions(el) {
  if (!el) return { width: 48, height: 22, radius: 11, autoW: 48, autoH: 22 };
  const spec = ELEMENT_BOX_SPECS['badge'] || {
    padX: 24,
    padY: 8,
    charWidthRatio: 0.65,
    minW: 48,
    minH: 22,
    lineHeightRatio: 1.3,
  };

  const text = String(el.content || el.text || '').trim();
  const fontSize = Math.max(10, Math.min(32, el.fontSize || 12));

  // 1. Dynamic Height: font-size * 1.3 + vertical padding (8px)
  const autoH = Math.max(spec.minH, Math.ceil(fontSize * spec.lineHeightRatio + spec.padY));

  // 2. Dynamic Width: char count * font-size * ratio + horizontal padding (24px)
  const textW = Math.ceil(text.length * fontSize * spec.charWidthRatio);
  const autoW = Math.max(spec.minW, textW + spec.padX);

  // 3. User override support: if element was explicitly resized or specified width/height > 0
  const width = (el.width && el.width > 0) ? el.width : autoW;
  const height = (el.height && el.height > 0) ? el.height : autoH;

  // 4. True pill border radius
  const radius = el.radius !== undefined ? el.radius : Math.round(height / 2);

  return { width, height, radius, autoW, autoH };
}

/**
 * ==============================================================================
 * 📐 FORMULA H = f(X): MATHEMATICAL DYNAMIC HEIGHT CALCULATION
 * ==============================================================================
 * Deterministically computes bounding-box height H based on content vector X.
 * Eliminates arbitrary hardcodes and synchronizes Fabric.js with Remotion rendering.
 */
/**
 * Số dòng của một dòng code trong khối đơn cách `cols` ký tự với white-space: pre-wrap + word-break: break-word:
 * ngắt tại khoảng trắng, từ dài hơn cả dòng thì cắt theo ký tự.
 */
function monoWrapLines(line, cols) {
  const tokens = String(line).match(/\s+|\S+/g) || [];
  let lines = 1;
  let cur = 0;
  for (const tok of tokens) {
    const len = Array.from(tok).length;
    if (/^\s/.test(tok)) { cur += len; continue; } // khoảng trắng cuối dòng được phép tràn (hang)
    if (cur > 0 && cur + len > cols) { lines += 1; cur = 0; }
    if (len > cols) {
      lines += Math.ceil(len / cols) - 1;
      cur = len % cols || cols;
    } else {
      cur += len;
    }
  }
  return lines;
}

/** [min, mặc định] — khớp MathPlot / LatexFormula / InteractiveQuiz / VocabCard / ChemicalMolecule Element */
const FIXED_FRAME_HEIGHTS = {
  'math-plot': [100, 260],
  'latex-formula': [60, 140],
  'interactive-quiz': [240, 340],
  'vocab-card': [280, 380],
  'chemical-molecule': [100, 260],
};

export function calculateElementDynamicHeight(el) {
  if (!el || !el.type) return 60;
  const type = el.type;

  // 1. Checklist Dynamic Height Formula
  // H(X) = padding(24 + margin) + header(32) + sum(row_k) + gap(rows) + footer
  if (type === 'checklist') {
    const S = ELEMENT_BOX_SPECS['checklist'];
    const data = el.checklistData || {};
    const rawItems = (el.checklistItems && el.checklistItems.length > 0) ? el.checklistItems : (data.items || []);
    const items = rawItems.length > 0 ? rawItems : DEFAULT_CHECKLIST_ITEMS;
    const isCyber = data.style === 'cyber';
    const frameless = el.showCardBg === false || el.bgColor === 'transparent';
    const border = frameless ? 0 : isCyber ? S.borderCyber : S.border;
    const titleText = (data.title !== undefined && data.title !== null ? String(data.title) : (el.content || '')).trim();
    const font = { fontFamily: el.fontFamily };
    const availW = (el.width || 312) - 2 * border - S.padX - 2 * S.rowBorder - S.rowPadX - S.badge - S.badgeGap;

    const rowsH = items.reduce((sum, it) => {
      const text = typeof it === 'object' ? String(it.text || '') : String(it);
      const sub = typeof it === 'object' ? String(it.subtext || '') : '';
      const titleH = S.titleFont * S.titleLH * estimateTextLines(text, availW, S.titleFont, { ...font, weight: S.titleWeight });
      const subH = sub ? S.textGap + S.subFont * S.subLH * estimateTextLines(sub, availW, S.subFont, { ...font, weight: S.subWeight }) : 0;
      return sum + 2 * S.rowBorder + S.rowPadY + Math.max(S.badge, titleH + subH);
    }, 0) + Math.max(0, items.length - 1) * S.rowGap;

    const headerH = titleText ? S.headerFont * S.normalLH + S.headerPadB + (isCyber ? 1.5 : S.headerBorder) + S.sectionGap : 0;
    const footerH = data.showFooter !== false
      ? S.sectionGap + S.footerMarginT + S.footerPadY + 2 * S.footerBorder + S.footerFont * S.normalLH
      : 0;
    return Math.round(S.padY + 2 * border + headerH + rowsH + footerH);
  }

  // 2. Timeline Dynamic Height Formula
  if (type === 'timeline') {
    const spec = ELEMENT_BOX_SPECS['timeline'];
    const showCardBg = el.showCardBg !== false;
    const pad = showCardBg ? spec.cardPadding : spec.framelessPadding;
    const title = String(el.title ?? el.content ?? '').trim();
    const hasTitle = Boolean(title);
    const headerH = hasTitle ? spec.headerH : 0;

    const steps = (el.flowSteps && el.flowSteps.length > 0)
      ? el.flowSteps
      : (el.steps || el.timelineSteps || [
          { title: 'Hôm Qua', subtitle: 'Đau buồn & học hỏi' },
          { title: 'Hôm Nay', subtitle: 'Chấp nhận & tĩnh lặng' },
          { title: 'Mai Sau', subtitle: 'Bình an & vững vàng' }
        ]);
    const stepCount = steps.length;
    const gap = stepCount > 3 ? spec.gapDense : spec.gapDefault;

    let stepsH = 0;
    for (let i = 0; i < stepCount; i++) {
      const st = steps[i];
      const hasSub = Boolean(st && st.subtitle && String(st.subtitle).trim());
      const rowH = Math.max(spec.nodeSize, spec.titleH + (hasSub ? spec.subtitleH : 0));
      stepsH += rowH;
    }
    const gapsTotal = Math.max(0, stepCount - 1) * gap;

    return Math.round(pad + headerH + stepsH + gapsTotal);
  }

  // Visual Paradox Dynamic Height Formula
  if (type === 'visual-paradox') {
    const spec = ELEMENT_BOX_SPECS['visual-paradox'];
    const showCardBg = el.showCardBg !== false;
    const pad = showCardBg ? spec.cardPadding : spec.framelessPadding;
    const title = String(el.title ?? el.content ?? '').trim();
    const hasTitle = Boolean(title);
    const headerH = hasTitle ? spec.headerH : 0;
    const showHUD = el.paradoxData?.showHUD !== false;
    const hudH = showHUD ? spec.hudH : 0;
    const isFormulaSeparated = Boolean(el.paradoxData?.separateFormula);
    const stageH = isFormulaSeparated ? 370 : spec.baseStageH;

    return Math.round(pad + headerH + hudH + stageH);
  }

  // 3. Numbered List / Ranking List Dynamic Height Formula
  if (type === 'numbered-list') {
    const S = ELEMENT_BOX_SPECS['numbered-list'];
    const items = el.items || el.listItems || DEFAULT_NUMBERED_ITEMS;
    const fs = el.fontSize || S.fontSize;
    const availW = (el.width || 312) - S.badge - S.badgeGap;
    const rowsH = items.reduce((sum, item) => sum + Math.max(S.badge,
      estimateTextLines(String(item), availW, fs, { weight: S.weight, fontFamily: el.fontFamily }) * fs * S.lineHeight), 0);
    return Math.round(rowsH + Math.max(0, items.length - 1) * S.gap);
  }

  if (type === 'ranking-list') {
    const spec = ELEMENT_BOX_SPECS['ranking-list'];
    const items = el.rankingItems || el.items || el.listItems || [];
    const count = items.length || 3;
    const gapTotal = Math.max(0, count - 1) * (spec.itemGap || 6);
    return Math.round(spec.basePadding + spec.headerH + count * spec.itemH + gapTotal);
  }

  // 4. Quote Box Dynamic Height Formula (Mirrors Remotion QuoteBoxElement exactly)
  if (type === 'quote-box') {
    const variant = el.variant || 'classic-strip';
    const text = String(el.content || 'Trích dẫn hay...').trim();
    const fontSize = Math.min(24, Math.max(12, el.fontSize || 16));
    const w = el.width || 312;
    const hasAuthor = Boolean(el.authorName);

    let padTop = 24, padBottom = 24, padX = 42, gap = 14, extraH = 0;
    let lineH = 1.55;

    if (variant === 'zen-minimal') {
      padTop = 24; padBottom = 24; padX = 44; gap = 12;
      extraH = 26 + 12; // top quote icon (26px) + gap (12px)
      lineH = 1.6;
    } else if (variant === 'expert-badge') {
      padTop = 20; padBottom = 20; padX = 40; gap = 14;
      extraH = 22 + 14; // chip (22px) + gap (14px)
      lineH = 1.5;
    } else if (variant === 'brutalist-block') {
      padTop = 20; padBottom = 20; padX = 36; gap = 12;
      extraH = 20 + 12; // tag (20px) + gap (12px)
      lineH = 1.4;
    }

    const textWidth = Math.max(120, w - padX);
    const charWidth = fontSize * 0.58;
    const charsPerLine = Math.max(10, Math.floor(textWidth / charWidth));
    const lines = text.split('\n').reduce((acc, line) => {
      return acc + Math.max(1, Math.ceil((line.trim().length || 1) / charsPerLine));
    }, 0);

    const textH = lines * (fontSize * lineH);
    const authorH = hasAuthor ? (gap + Math.max(12, Math.round(fontSize * 0.78))) : 0;

    return Math.round(padTop + extraH + textH + authorH + padBottom);
  }

  // 5. Flowchart Dynamic Height Formula (Mirrors Remotion FlowchartElement exactly)
  if (type === 'flowchart') {
    const S = ELEMENT_BOX_SPECS['flowchart'];
    const steps = (el.flowSteps && el.flowSteps.length > 0) ? el.flowSteps : [1, 2, 3]; // mặc định 3 bước
    const headerH = Math.max(S.headerIcon, S.headerFont * S.inheritedLH) + S.headerPadB + S.headerBorder;
    // Tiêu đề & phụ đề bước là nowrap → chiều cao bước cố định; badge 28 thường lớn hơn cột chữ
    const stepsH = steps.reduce((sum, st) => {
      const hasSub = typeof st === 'object' && Boolean(st.subtitle);
      const textCol = S.titleFont * S.inheritedLH + (hasSub ? S.subMarginT + S.subFont * S.inheritedLH : 0);
      return sum + 2 * S.stepBorder + 2 * S.stepPadY + Math.max(S.badge, textCol);
    }, 0);
    return Math.round(S.padTop + headerH + S.gap + stepsH + Math.max(0, steps.length - 1) * S.connectorH + S.padBottom);
  }

  // 5. Highlight Box Auto-Wrap Height Formula (Mirrors Remotion HighlightBoxElement 100%)
  if (type === 'highlight-box') {
    // Theo đúng DOM từng kiểu (callout / strip / pill / sticker / bullet có xuống dòng)
    return layoutHighlightBox(el).height;
  }

  // 5. Table Dynamic Height Formula (Mirrors Remotion TableElement exactly)
  if (type === 'table') {
    const spec = ELEMENT_BOX_SPECS['table'];
    const tableData = el.tableData || {};
    const rawRows = Array.isArray(tableData.rows) && tableData.rows.length > 0
      ? tableData.rows
      : (Array.isArray(el.rows) && el.rows.length > 0 ? el.rows : [1, 2, 3]);
    const rowCount = rawRows.length;
    const rowsTotalH = rowCount * spec.rowItemH;
    const rowGapsTotal = Math.max(0, rowCount - 1) * spec.rowGap;
    return Math.round(spec.padTop + spec.headerH + spec.gap + rowsTotalH + rowGapsTotal + spec.padBottom);
  }

  // 6. VS Battle Dynamic Height Formula (Mirrors Remotion VsBattleElement exactly)
  if (type === 'vs-battle') {
    const S = ELEMENT_BOX_SPECS['vs-battle'];
    const vs = el.vsBattle || {};
    const rounds = vs.rounds && vs.rounds.length > 0 ? vs.rounds : DEFAULT_VS_ROUNDS;
    const W = el.width || S.defaultWidth;
    const font = { fontFamily: el.fontFamily };
    const lines = (text, availW, size, weight, extra = {}) =>
      text ? estimateTextLines(String(text), availW, size, { ...font, weight, ...extra }) : 0;
    const colW = (W - S.rowPadX - S.colPad) / S.colRatio; // flex 1 : 1.6 : 1 phần còn lại sau padding cột
    const header = S.headerPadY + (el.showCardBg !== false ? S.headerBorder : 0)
      + Math.max(S.headerIcon, S.nameFont * S.normalLH, S.pillChrome + S.pillFont * S.normalLH);
    const roundsH = rounds.reduce((sum, r) => sum + S.rowChrome + Math.max(
      S.rowIcon,
      lines(r.leftValue, colW - S.valInset, S.valFont, S.valWeight) * S.valFont * S.normalLH,
      lines(r.criterion, S.critRatio * colW, S.critFont, S.critWeight) * S.critFont * S.critLH,
      lines(r.rightValue, colW - S.valInset, S.valFont, S.valWeight) * S.valFont * S.normalLH,
    ), 0) + Math.max(0, rounds.length - 1) * S.roundGap;
    let banner = 0;
    if (vs.showWinner !== false) {
      const left = rounds.filter(r => r.winner === 'left').length;
      const right = rounds.filter(r => r.winner === 'right').length;
      const leftName = String(vs.leftSubject?.name || 'LỰA CHỌN A').toUpperCase();
      const rightName = String(vs.rightSubject?.name || 'LỰA CHỌN B').toUpperCase();
      const label = vs.winnerLabel || (left > right ? `WINNER: ${leftName} (${left} - ${right})`
        : right > left ? `WINNER: ${rightName} (${right} - ${left})` : `BẤT PHÂN THẮNG BẠI (${left} - ${right})`);
      banner = S.gap + S.bannerMarginT + S.bannerChrome + Math.max(S.bannerIcon,
        lines(label, W - S.bannerInset, S.bannerFont, S.bannerWeight, { letterSpacing: S.bannerLS }) * S.bannerFont * S.normalLH);
    }
    return Math.round(header + S.gap + S.divider + S.gap + roundsH + banner);
  }


  // 7. Dynamic Knowledge Graph (Adaptive 9:16 Box-Model)
  if (type === 'knowledge-graph') {
    const spec = ELEMENT_BOX_SPECS['knowledge-graph'];
    const data = el.knowledgeGraphData || {};
    const layout = data.layout || 'cascade';
    const nodes = Array.isArray(data.nodes) && data.nodes.length > 0 ? data.nodes : [];
    const hasHero = Boolean(data.heroMorph !== false && data.activeNodeId);
    const heroBonus = hasHero ? spec.heroExpansionBonus : 0;

    if (layout === 'spine') {
      const tier1 = nodes.filter(n => n.tier === 1);
      const tier2 = nodes.filter(n => n.tier === 2);
      let leftCount = 0;
      let rightCount = 0;
      tier1.forEach((p, idx) => {
        const cCount = 1 + tier2.filter(c => c.parentId === p.id).length;
        if (idx % 2 === 0) leftCount += cCount;
        else rightCount += cCount;
      });
      const maxSideItems = Math.max(1, leftCount, rightCount);
      const computed = spec.headerH + spec.basePadding + spec.rootNodeH + maxSideItems * spec.spineStepGap + heroBonus;
      return Math.min(spec.maxH, Math.max(spec.minH, Math.round(computed)));
    }
    if (layout === 'orbit') {
      const computed = Math.max(380, (el.width || 336) * 1.05 + heroBonus);
      return Math.min(spec.maxH, Math.max(spec.minH, Math.round(computed)));
    }
    // cascade layout
    const tierNums = nodes.map(n => (typeof n.tier === 'number' ? n.tier : 1));
    const maxTier = tierNums.length > 0 ? Math.max(...tierNums) : 2;
    const effectiveTiers = Math.max(1, maxTier);
    const computed = spec.headerH + spec.basePadding + spec.rootNodeH + (effectiveTiers * spec.tierGap) + heroBonus;
    return Math.min(spec.maxH, Math.max(spec.minH, Math.round(computed)));
  }

  // 8. Dynamic Pie Chart / Donut Chart (Mirrors Remotion PieChartElement 100%)
  if (type === 'pie-chart') {
    const spec = ELEMENT_BOX_SPECS['pie-chart'];
    const variant = el.variant || 'donut';
    const isCompact = variant === 'compact';
    const w = el.width || 336;

    const padY = isCompact ? 20 : (spec.padTop + spec.padBottom);
    const padX = isCompact ? 14 : spec.padX;
    const headerH = isCompact ? 22 : spec.headerH;
    const containerGap = isCompact ? 6 : spec.containerGap;
    const chartSize = isCompact ? spec.donutSizeCompact : spec.donutSize;
    const legendMarginTop = isCompact ? 6 : spec.legendMarginTop;

    const rawData = Array.isArray(el.chartData) && el.chartData.length > 0
      ? el.chartData
      : [
          { label: 'Mobile App', value: 45 },
          { label: 'Desktop Web', value: 35 },
          { label: 'Tablet & Khác', value: 20 },
        ];
    const itemsCount = rawData.length;

    const innerW = Math.max(120, w - padX * 2);
    const pillsPerRow = Math.max(1, Math.floor((innerW + spec.legendColGap) / (spec.avgPillW + spec.legendColGap)));
    const legendRows = Math.max(1, Math.ceil(itemsCount / pillsPerRow));
    const legendH = legendRows * spec.legendPillH + Math.max(0, legendRows - 1) * spec.legendRowGap;

    const totalH = padY + headerH + containerGap + spec.bodyMarginTop + chartSize + legendMarginTop + legendH;
    return Math.min(spec.maxH, Math.max(spec.minH, Math.round(totalH)));
  }

  // 9. Badge Dynamic Height Formula
  if (type === 'badge') {
    return calculateBadgeDimensions(el).height;
  }

  // Cảnh Master: H = cạnh dưới hộp cuối của layoutMasterScene (cùng danh sách hộp Remotion & Fabric vẽ)
  if (type === 'master-scene') {
    return masterSceneHeight(el);
  }

  // 10. Master Hook Dynamic Height Formula (Mirrors 3-Tier Remotion Layout: Badge + Hero + SubText)
  if (type === 'master-hook') {
    // Mỗi layout một công thức khớp DOM; cỡ chữ hero = fitHeroFontSize (cùng hàm với MasterHookElement)
    return Math.round(layoutMasterHookHeight(el));
  }


  // 11. Branching Flow Dynamic Height Formula
  if (type === 'branching-flow') {
    const S = ELEMENT_BOX_SPECS['branching-flow'];
    const data = el.branchingFlowData || {};
    if (data.layout === 'vertical') return Math.ceil(Math.max(S.rootHV / S.rootRatioV, S.childHV / S.childRatioV));
    const n = Array.isArray(data.childNodes) && data.childNodes.length > 0 ? data.childNodes.length : 3; // mặc định 3 nhánh
    return Math.ceil(Math.max(n * S.childH + (n - 1) * S.childGap + 2 * S.pad, S.rootH / S.rootRatio));
  }


  // 12. Tree Diagram — header + nút gốc + SVG nhánh + các hàng nhánh (pill có thể xuống dòng) (TreeDiagramElement)
  if (type === 'tree-diagram') {
    const S = ELEMENT_BOX_SPECS['tree-diagram'];
    const data = el.treeData || DEFAULT_TREE_DATA;
    const branches = Array.isArray(data.branches) && data.branches.length > 0 ? data.branches : DEFAULT_TREE_DATA.branches;
    const W = el.width || S.defaultWidth;
    const rowInnerW = W - 2 * (S.padX + S.cardBorder + S.rowPadX + S.rowBorder);
    const rowH = (b) => {
      const pills = (b.items || []).map(it =>
        measureTextWidth(String(it), S.pillFont, { weight: S.pillWeight }) + S.pillChromeX);
      if (pills.length === 0) return S.groupLineH;
      // flex-shrink: tên nhóm (minWidth 0) và cụm pill (min = pill rộng nhất) co theo tỉ lệ flex-basis
      const leftW = S.groupDotW + measureTextWidth(String(b.group || ''), S.groupFont, { weight: S.groupWeight });
      const pillsW = pills.reduce((sum, pw) => sum + pw, 0) + (pills.length - 1) * S.pillGap;
      const free = rowInnerW - S.rowInnerGap;
      const overflow = leftW + pillsW - free;
      const rightW = overflow > FIT_EPSILON
        ? Math.max(Math.max(...pills), pillsW - overflow * pillsW / (leftW + pillsW))
        : pillsW;
      let rows = 1;
      let cur = 0;
      for (const pw of pills) {
        const next = cur === 0 ? pw : cur + S.pillGap + pw;
        if (next > rightW + FIT_EPSILON && cur > 0) { rows += 1; cur = pw; } else { cur = next; }
      }
      const pillsH = rows * (S.pillLineH + S.pillChromeY) + (rows - 1) * S.pillGap;
      return Math.max(S.groupLineH, pillsH);
    };
    const rowsH = branches.reduce((sum, b) => sum + 2 * (S.rowPadY + S.rowBorder) + rowH(b), 0)
      + (branches.length - 1) * S.rowGap;
    const svgH = Math.max(S.svgMinH, S.svgBaseH + branches.length * S.svgPerBranch);
    const headerH = S.headerLineH + S.headerPadB + S.headerBorder;
    const bodyH = S.bodyMarginTop + S.rootH + svgH - S.svgOverlap + rowsH;
    return Math.round(2 * (S.padY + S.cardBorder) + headerH + S.sectionGap + bodyH);
  }

  // 13. Roadmap Flow — khung cố định el.height || 280, thẻ mốc co theo khung (RoadmapFlowElement);
  // giữ chiều cao người dùng đã kéo
  if (type === 'roadmap-flow') {
    return el.height || ELEMENT_BOX_SPECS['roadmap-flow'].defaultH;
  }

  // Khung cố định của widget STEM: component vẽ trong Math.max(min, el.height || mặc định)
  if (FIXED_FRAME_HEIGHTS[type]) {
    const [minH, defaultH] = FIXED_FRAME_HEIGHTS[type];
    return Math.max(minH, el.height || defaultH);
  }

  // 14. Pyramid Funnel — khung SVG cố định el.height || 260, không phụ thuộc số tầng (PyramidFunnelElement);
  // giữ chiều cao người dùng đã kéo
  if (type === 'pyramid-funnel') {
    return el.height || ELEMENT_BOX_SPECS['pyramid-funnel'].defaultH;
  }

  // 15. Dynamic Diagram Free-Form Graph Dynamic Height Formula
  if (type === 'dynamic-diagram') {
    // Khớp DynamicDiagramElement: h = max(el.height, layout.height); trả chiều cao theo nội dung để co lại khi bớt node
    const data = el.diagramData?.nodes?.length ? el.diagramData : DEFAULT_DIAGRAM_DATA;
    const hasTitle = Boolean(el.showTitle !== false && data.title?.trim());
    return Math.round(computeGraphLayout(data, el.width || 336, hasTitle).height);
  }


  // 16. Dynamic Chart Bar Height Formula (Mirrors Remotion ChartBarElement 100%)
  if (type === 'chart-bar') {
    const spec = ELEMENT_BOX_SPECS['chart-bar'];
    const variant = el.variant || 'horizontal';
    const isCompact = variant === 'compact';
    const padTop = isCompact ? 10 : spec.padTop;
    const padBottom = isCompact ? 10 : spec.padBottom;
    const headerH = isCompact ? 24 : spec.headerH;
    const headerGap = isCompact ? 8 : spec.headerGap;
    const itemH = isCompact ? 25 : spec.itemH;
    const itemGap = isCompact ? 8 : spec.itemGap;

    const rawData = Array.isArray(el.chartData) && el.chartData.length > 0
      ? el.chartData
      : [1, 2, 3];
    const itemsCount = Math.max(1, rawData.length);
    const titleText = (el.content !== undefined && el.content !== null) ? String(el.content).trim() : '';
    const hasTitle = Boolean(titleText);

    const headerPart = hasTitle ? (headerH + headerGap) : 0;
    const itemsPart = (itemsCount * itemH) + Math.max(0, itemsCount - 1) * itemGap;
    const totalH = padTop + padBottom + headerPart + itemsPart;
    return Math.min(spec.maxH, Math.max(spec.minH, Math.round(totalH)));
  }

  // 17. Dynamic Circle Chart Height Formula (Mirrors Remotion CircleChartElement 100%)
  if (type === 'circle-chart') {
    const spec = ELEMENT_BOX_SPECS['circle-chart'] || { labelExtraRatio: 0.16, labelExtraMin: 24, labelMargin: 8 };
    const size = typeof el.width === 'number' && el.width > 0 ? el.width : 140;
    // Component luôn hiện nhãn (mặc định 'TIẾN ĐỘ') treo dưới vòng, bao trong khung ngoài
    const labelExtra = Math.max(spec.labelExtraMin, Math.round(size * spec.labelExtraRatio)) + spec.labelMargin;
    return Math.round(size + labelExtra);
  }

  // 18. Dynamic Gauge Chart Height Formula (Mirrors Remotion GaugeChartElement 100%)
  if (type === 'gauge-chart') {
    const spec = ELEMENT_BOX_SPECS['gauge-chart'] || { headerH: 32, centerRatioY: 0.46, arcPaddingY: 14, hudHeightWithLabel: 50, hudHeightNoLabel: 36 };
    const w = typeof el.width === 'number' && el.width > 0 ? el.width : 260;
    const titleText = (el.content !== undefined && el.content !== null) ? String(el.content).trim() : '';
    const hasTitle = Boolean(titleText);
    const labelText = (el.statLabel || '').trim();
    const hasLabel = Boolean(labelText);

    const headerPart = hasTitle ? spec.headerH : 0;
    const cy = w * spec.centerRatioY;
    const hudH = hasLabel ? spec.hudHeightWithLabel : spec.hudHeightNoLabel;
    return Math.round(headerPart + cy + spec.arcPaddingY + hudH);
  }

  // 19. Sankey Chart — nút nguồn + SVG dải + các hàng đích đều cao cố định; header nowrap (SankeyChartElement)
  if (type === 'sankey-chart') {
    const S = ELEMENT_BOX_SPECS['sankey-chart'];
    const isCompact = el.variant === 'compact';
    const data = el.sankeyData || { ...DEFAULT_SANKEY_DATA, title: el.content || DEFAULT_SANKEY_DATA.title };
    const title = String(data.title !== undefined && data.title !== null ? data.title : (el.content || '')).trim();
    const flows = Array.isArray(data.flows) && data.flows.length > 0 ? data.flows : DEFAULT_SANKEY_DATA.flows;
    const n = flows.length;
    const isFrameless = el.showCardBg === false || el.bgColor === 'transparent';
    const titleFont = isCompact ? S.titleFontCompact : S.titleFont;
    const headerH = title
      ? Math.max(S.headerIcon, titleFont * S.titleLH) + (isCompact ? S.headerGapCompact : S.headerGap)
      : 0;
    const svgH = isCompact ? S.ribbonSvgHCompact : Math.max(S.ribbonSvgH, S.ribbonSvgBase + n * S.ribbonSvgPerFlow);
    const rowsH = n * (isCompact ? S.flowRowHCompact : S.flowRowH)
      + (n - 1) * (isCompact ? S.flowRowGapCompact : S.flowRowGap);
    const chrome = 2 * (isCompact ? S.padYCompact : S.padY) + (isFrameless ? 0 : 2 * S.cardBorder);
    return Math.round(chrome + headerH + (isCompact ? S.sourceNodeHCompact : S.sourceNodeH) + svgH - S.ribbonOverlap + rowsH);
  }

  // 20. Dynamic Heatmap Matrix Height Formula (Mirrors Remotion HeatmapMatrixElement 100%)
  if (type === 'heatmap-matrix') {
    const spec = ELEMENT_BOX_SPECS['heatmap-matrix'] || {
      padTop: 12, padBottom: 12, padX: 14,
      headerH: 26, headerGap: 8,
      cellGap: 4, legendH: 22, legendGap: 8,
      minH: 180, maxH: 520,
    };
    const w = typeof el.width === 'number' && el.width > 0 ? el.width : 336;
    const titleText = (el.heatmapData?.title || el.content || '').trim();
    const hasTitle = Boolean(titleText);
    const headerPart = hasTitle ? (spec.headerH + spec.headerGap) : 0;

    const cols = Math.max(1, Number(el.heatmapData?.cols) || 7);
    const rawCells = Array.isArray(el.heatmapData?.cells) && el.heatmapData.cells.length > 0
      ? el.heatmapData.cells
      : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28];
    const cellsCount = Math.max(1, rawCells.length);
    const rows = Math.ceil(cellsCount / cols);

    const gridW = w - spec.padX * 2;
    const cellSize = (gridW - (cols - 1) * spec.cellGap) / cols;
    const gridH = rows * cellSize + Math.max(0, rows - 1) * spec.cellGap;

    const totalH = spec.padTop + headerPart + gridH + spec.legendGap + spec.legendH + spec.padBottom;
    return Math.min(spec.maxH, Math.max(spec.minH, Math.round(totalH)));
  }

  // 21. Dynamic Hologram Bar (Cột Năng Lượng 3D) Height Formula (Mirrors Remotion HologramBarElement 100%)
  if (type === 'hologram-bar') {
    return el.height || ELEMENT_BOX_SPECS['hologram-bar'].defaultH;
  }


  // 22. Code Terminal — chiều cao tự nhiên: font đơn cách, pre-wrap + break-word (CodeTerminalElement)
  if (type === 'code-terminal') {
    const spec = ELEMENT_BOX_SPECS['code-terminal'];
    const code = el.codeData ? String(el.codeData.code || '') : String(el.content || DEFAULT_TERMINAL_CODE);
    const W = el.width || spec.defaultWidth;
    const cols = Math.max(1, Math.floor((W - 2 * spec.borderW - 2 * spec.padX + FIT_EPSILON) / (spec.monoCharW * spec.fontSize)));
    const lines = code.split('\n').reduce((sum, line) => sum + monoWrapLines(line, cols), 0);
    const bodyH = spec.padTop + spec.padBottom + Math.max(spec.bodyMinH, lines * spec.fontSize * spec.lineHeightRatio);
    return Math.round(2 * spec.borderW + spec.headerH + bodyH);
  }

  // 23. Dynamic Network Graph (Mạng Lưới Node) Height Formula (Mirrors Remotion NetworkGraphElement 100%)
  if (type === 'network-graph') {
    const spec = ELEMENT_BOX_SPECS['network-graph'] || {
      headerH: 32,
      basePadding: 16,
      minH: 180,
      maxH: 520,
    };
    const titleText = String(el.content ?? el.title ?? '').trim();
    const hasTitle = Boolean(titleText);
    const headerPart = hasTitle ? spec.headerH : 0;
    const size = el.width || 280;

    const totalH = size + headerPart;
    return Math.min(spec.maxH, Math.max(spec.minH, Math.round(totalH)));
  }

  // 19. Explicit user override if present and valid (custom drag & resize)
  if (typeof el.height === 'number' && el.height > 0 && el.height !== ELEMENT_DEFAULT_HEIGHTS[type]) {
    return el.height;
  }

  // 10. Default archetype baseline
  return ELEMENT_DEFAULT_HEIGHTS[type] || 60;
}

/**
 * Bóng dáng cảnh thân (SSOT): số element tối đa và mô tả cho AI. Thứ tự xoay do
 * cinematicRules.planSceneSilhouettes quyết định; layoutCollisionResolver cắt element theo spec này
 * nên hai cảnh liền kề luôn khác hình khối dù AI không tuân thủ.
 */
export const SCENE_SILHOUETTES = {
  'full-card': {
    maxElements: 4,
    prompt: 'the classic layered card: badge or short title on top, ONE primary widget in the middle, a highlight-box takeaway pill below',
  },
  'title-widget': {
    maxElements: 2,
    prompt: 'exactly TWO elements: ONE short title text (max 6 words) + ONE primary widget. No badge, no highlight-box, no divider',
  },
  'widget-solo': {
    maxElements: 1,
    prompt: 'exactly ONE element: the primary widget carries the whole message (use its own title/label fields). Nothing else on screen',
  },
  'split': {
    maxElements: 3,
    prompt: 'two elements side by side on ONE row (e.g. 3D image left + stat-big right, or vs-card) plus one short title above. Max 3 elements',
  },
  'statement': {
    maxElements: 1,
    prompt: 'exactly ONE text element: a punchline of 3 to 8 words, fontSize 30 to 40, fontWeight 900, textAlign center, left 180. No widget, no box',
  },
};

export const ELEMENT_PRIORITY = {
  // Priority 10: Primary Visual Widget (Uncompromising)
  'generative-svg': 10,
  'knowledge-graph': 10,
  'chart-bar': 10,
  'candlestick-chart': 10,
  'flowchart': 10,
  'radar-chart': 10,
  'tree-diagram': 10,
  'dynamic-diagram': 10,
  'waterfall-chart': 10,
  'sankey-chart': 10,
  'heatmap-matrix': 10,
  'racing-bar-chart': 10,
  'pie-chart': 10,
  'gauge-chart': 10,
  'line-chart': 10,
  'stat-big': 10,
  'metric-cards': 10,
  'master-hook': 10,
  'social-callout': 10,
  'document-evidence': 10,
  'breathing-circle': 10,
  'vinyl-pulse': 10,
  'vs-battle': 10,
  'pyramid-funnel': 10,
  'code-terminal': 10,
  'chat-mockup': 10,
  'table': 10,
  'quiz-card': 10,
  'ranking-list': 10,

  // Priority 9: Core Visual Assets & Primary Title Text
  'image': 9,
  'text': 9,

  // Priority 8: Important Content Summaries & Takeaways
  'highlight-box': 8,
  'checklist': 8,
  'quote-box': 8,
  'timeline': 8,

  // Priority 5: Secondary Text & Accents
  'icon-text': 5,
  'circle-chart': 5,

  // Priority 3-1: Decorative Accessories (Dropped first if elements > 4)
  'badge': 3,
  'progress': 2,
  'divider': 2,
  'line': 1,
};

/**
 * 6 Hook Archetypes with Coordinate Slots & SFX Profiles
 */
export const HOOK_ARCHETYPES = {
  'zen-mindful-hook': {
    id: 'zen-mindful-hook',
    name: 'Zen & Mindful Hook',
    sfxProfile: [
      { type: 'whoosh', delaySec: 0.1, volume: 0.6 },
      { type: 'chime', delaySec: 0.4, volume: 0.75 }
    ],
    generatePrompt: (ACCENT) => `=== HOOK SCENE (scene 1) — ZEN & MINDFUL HOOK ===
CRITICAL: Hook Scene MUST contain EXACTLY ONE primary element: type "master-hook".
Element 1 (All-in-One Master Hook):
  type:"master-hook", left:180, top:80, width:336, height:240, accentColor:"#86EFAC", animPreset:"zoom-in", animDelay:0.05,
  hookData: {
    archetype: "healing",
    layoutStyle: "luxury-zen",
    badgeText: "── ✦ LẮNG ĐỌNG TÂM TRÍ ✦ ──",
    heroTitle: "<POETIC_HERO_TITLE: 3-6 words e.g. HỌC CÁCH BUÔNG BỎ>",
    highlightWords: ["<MAIN_WORD>"],
    highlightStyle: "text-glow",
    wordAnimation: "stagger-pop",
    subText: "<GENTLE_REFLECTION: 1 calming reflection sentence>",
    boxVariant: "minimal",
    fontSize: 36
  }`
  },

  'tech-ai-hook': {
    id: 'tech-ai-hook',
    name: 'Tech & AI Cyber Hook',
    sfxProfile: [
      { type: 'whoosh', delaySec: 0.1, volume: 0.85 },
      { type: 'typewriter', delaySec: 0.35, volume: 0.7 }
    ],
    generatePrompt: (ACCENT) => `=== HOOK SCENE (scene 1) — TECH & AI HOOK ===
CRITICAL: Hook Scene MUST contain EXACTLY ONE primary element: type "master-hook".
Element 1 (All-in-One Master Hook):
  type:"master-hook", left:180, top:80, width:336, height:240, accentColor:"#00D4FF", animPreset:"zoom-in", animDelay:0.05,
  hookData: {
    archetype: "secret",
    layoutStyle: "cyber-hud",
    badgeText: "SYS.PROTOCOL // AI AGENT",
    heroTitle: "<TECH_HEADLINE: 3-5 punchy words e.g. AI ĐÃ THAY ĐỔI CUỘC CHƠI>",
    highlightWords: ["<TECH_KEYWORD>"],
    highlightStyle: "outline-box",
    wordAnimation: "glitch",
    subText: "<TECH_VALUE_PROMISE: e.g. Tiết kiệm 90% thời gian làm việc>",
    boxVariant: "neon-border",
    fontSize: 38
  }`
  },

  'story-drama-hook': {
    id: 'story-drama-hook',
    name: 'Hazard & Urgency Hook',
    sfxProfile: [
      { type: 'whoosh', delaySec: 0.1, volume: 0.85 },
      { type: 'bell', delaySec: 0.3, volume: 0.85 }
    ],
    generatePrompt: (ACCENT) => `=== HOOK SCENE (scene 1) — HAZARD & URGENCY HOOK ===
CRITICAL: Hook Scene MUST contain EXACTLY ONE primary element: type "master-hook".
Element 1 (All-in-One Master Hook):
  type:"master-hook", left:180, top:80, width:336, height:240, accentColor:"#FF3B30", animPreset:"zoom-in", animDelay:0.05,
  hookData: {
    archetype: "warning",
    layoutStyle: "hazard-alert",
    badgeText: "⚠️ CẢNH BÁO QUAN TRỌNG",
    heroTitle: "<URGENT_WARNING_TITLE: e.g. DỪNG LẠI NGAY NẾU ĐANG LÀM ĐIỀU NÀY>",
    highlightWords: ["DỪNG LẠI", "<KEYWORD>"],
    highlightStyle: "solid-box",
    wordAnimation: "stagger-pop",
    subText: "<URGENT_CONSEQUENCE: 1 câu cảnh báo hậu quả nếu bỏ qua>",
    boxVariant: "solid",
    fontSize: 38
  }`
  },

  'viral-high-energy-hook': {
    id: 'viral-high-energy-hook',
    name: 'Kinetic Contrast Hook',
    sfxProfile: [
      { type: 'whoosh', delaySec: 0.05, volume: 0.9 },
      { type: 'pop', delaySec: 0.25, volume: 0.8 }
    ],
    generatePrompt: (ACCENT) => `=== HOOK SCENE (scene 1) — KINETIC CONTRAST HOOK ===
CRITICAL: Hook Scene MUST contain EXACTLY ONE primary element: type "master-hook".
Element 1 (All-in-One Master Hook):
  type:"master-hook", left:180, top:80, width:336, height:240, accentColor:"${ACCENT}", animPreset:"zoom-in", animDelay:0.05,
  hookData: {
    archetype: "tips",
    layoutStyle: "kinetic-contrast",
    badgeText: "🔥 TOP BÍ KÍP GIỮ CHÂN",
    heroTitle: "<CONTRAST_TITLE: 3-5 words in ALL CAPS e.g. NO CLEAR MESSAGE>",
    highlightWords: ["<FOCUS_WORD>"],
    highlightStyle: "solid-box",
    wordLayout: "split-size",
    wordAnimation: "stagger-pop",
    fontSizeContrast: true,
    subText: "<CURIOSITY_PUNCH: 1 câu đánh trúng nỗi đau người xem>",
    boxVariant: "glass",
    fontSize: 42
  }`
  },

  'classified-secret-hook': {
    id: 'classified-secret-hook',
    name: 'Bold & Script Kinetic Hook',
    sfxProfile: [
      { type: 'whoosh', delaySec: 0.1, volume: 0.8 },
      { type: 'pop', delaySec: 0.3, volume: 0.85 }
    ],
    generatePrompt: (ACCENT) => `=== HOOK SCENE (scene 1) — BOLD & SCRIPT HOOK ===
CRITICAL: Hook Scene MUST contain EXACTLY ONE primary element: type "master-hook".
Element 1 (All-in-One Master Hook):
  type:"master-hook", left:180, top:80, width:336, height:240, accentColor:"#BEFF01", animPreset:"zoom-in", animDelay:0.05,
  hookData: {
    archetype: "tips",
    layoutStyle: "kinetic-bold-script",
    badgeText: "✦ BÍ MẬT GIỮ CHÂN ✦",
    heroTitle: "<BOLD_TITLE: 2-3 bold uppercase words e.g. STOP THE SCROLL>",
    heroLine2: "<HANDWRITTEN_SCRIPT: 3-5 lowercase words e.g. bạn phải biết điều này>",
    highlightWords: ["<MAIN_WORD>"],
    scriptWords: ["<SCRIPT_WORD1>", "<SCRIPT_WORD2>"],
    highlightStyle: "marker-circle",
    wordAnimation: "elastic-slide",
    tiltDeg: -6,
    subText: "<BENEFIT_LINE: 1 câu hứa hẹn giá trị thực chiến>",
    boxVariant: "glass",
    fontSize: 44
  }`
  },

  'versus-battle-hook': {
    id: 'versus-battle-hook',
    name: 'Versus Battle Hook',
    sfxProfile: [
      { type: 'whoosh', delaySec: 0.1, volume: 0.85 },
      { type: 'drumroll', delaySec: 0.3, volume: 0.85 }
    ],
    generatePrompt: (ACCENT) => `=== HOOK SCENE (scene 1) — VERSUS BATTLE HOOK ===
CRITICAL: Hook Scene MUST contain EXACTLY ONE primary element: type "master-hook".
Element 1 (All-in-One Master Hook):
  type:"master-hook", left:180, top:80, width:336, height:240, accentColor:"#00D4FF", animPreset:"zoom-in", animDelay:0.05,
  hookData: {
    archetype: "versus",
    layoutStyle: "split-versus",
    badgeText: "⚔️ ĐỐI ĐẦU ĐỈNH CAO",
    heroTitle: "<COMPARE_QUESTION: e.g. ĐÂU LÀ LỰA CHỌN TỐT HƠN?>",
    versusLeft: "<SIDE_A: e.g. IPHONE 16>",
    versusRight: "<SIDE_B: e.g. S24 ULTRA>",
    accentColor: "#00D4FF",
    subText: "<DECISION_INVITATION: So sánh toàn diện trong 60 giây>",
    boxVariant: "glass",
    fontSize: 36
  }`
  },

  'giant-stat-hook': {
    id: 'giant-stat-hook',
    name: 'Giant Stat Shock Hook',
    sfxProfile: [
      { type: 'whoosh', delaySec: 0.05, volume: 0.9 },
      { type: 'ding', delaySec: 0.25, volume: 0.9 }
    ],
    generatePrompt: (ACCENT) => `=== HOOK SCENE (scene 1) — GIANT STAT SHOCK HOOK ===
CRITICAL: Hook Scene MUST contain EXACTLY ONE primary element: type "master-hook".
Element 1 (All-in-One Master Hook):
  type:"master-hook", left:180, top:80, width:336, height:240, accentColor:"#00D4FF", animPreset:"zoom-in", animDelay:0.05,
  hookData: {
    archetype: "tips",
    layoutStyle: "kinetic-giant-stat",
    badgeText: "📊 SỐ LIỆU THỰC TẾ",
    heroTitle: "<SHOCK_TITLE_TOP: e.g. SỰ THẬT ĐẰNG SAU>",
    statValue: "<GIANT_STAT: e.g. 99% or 10X or 1M>",
    statLabel: "<STAT_LABEL: e.g. NGƯỜI MỚI BỎ CUỘC>",
    highlightWords: ["<STAT_OR_KEYWORD>"],
    highlightStyle: "outline-box",
    wordAnimation: "stagger-pop",
    accentColor: "#00D4FF",
    fontSize: 36
  }`
  },

  'solid-box-hook': {
    id: 'solid-box-hook',
    name: 'Solid Box Stacked Hook',
    sfxProfile: [
      { type: 'whoosh', delaySec: 0.1, volume: 0.85 },
      { type: 'bell', delaySec: 0.25, volume: 0.8 }
    ],
    generatePrompt: (ACCENT) => `=== HOOK SCENE (scene 1) — SOLID BOX STACKED HOOK ===
CRITICAL: Hook Scene MUST contain EXACTLY ONE primary element: type "master-hook".
Element 1 (All-in-One Master Hook):
  type:"master-hook", left:180, top:80, width:336, height:240, accentColor:"#FFD700", animPreset:"zoom-in", animDelay:0.05,
  hookData: {
    archetype: "tips",
    layoutStyle: "kinetic-solid-box",
    badgeText: "⚡ BÍ QUYẾT BỨT PHÁ",
    heroTitle: "<STACKED_HEADLINE: 4-6 words stacked vertically>",
    highlightWords: ["<SOLID_HIGHLIGHT_WORDS>"],
    highlightStyle: "solid-box",
    wordLayout: "stacked-words",
    wordAnimation: "stagger-pop",
    accentColor: "#FFD700",
    subText: "<ACTIONABLE_BENEFIT: 1 câu lợi ích người xem nhận được>",
    boxVariant: "glass",
    fontSize: 38
  }`
  }
};

/**
 * 6 Content Layouts with Coordinate Slots
 */
export const CONTENT_LAYOUTS = {
  'layout-apple-stage': {
    id: 'layout-apple-stage',
    name: 'Layout A1: The Apple Stage (Hero 3D Floating Center + Glow Aura + Glass Feature Cards)',
    generatePrompt: (ACCENT) => `-- Layout A1: The Apple Stage (Hero 3D Floating Center + Glow Aura + Glass Feature Cards) --
  Element 1 (header badge): type:"badge", left:180, top:68, width:140, height:24, bgColor:"${ACCENT}", content:"ĐỘT PHÁ CÔNG NGHỆ", color:"#000", radius:12, fontSize:11, fontWeight:900, animPreset:"zoom-in", animDelay:0.1
  Element 2 (title center): type:"text", left:180, top:105, width:320, height:40, content:"Tiêu Đề Trọng Tâm", fontSize:24, fontFamily:"Be Vietnam Pro", fontWeight:900, color:"#ffffff", textAlign:"center", animPreset:"slide-up", animDelay:0.2
  Element 3 (3D hero center): type:"image", src:"<URL from RELEVANT_3D_ASSETS>", left:180, top:220, width:170, height:170, animPreset:"zoom-in", animDelay:0.25
  Element 4 (glass feature pills): type:"highlight-box", left:180, top:350, width:320, height:120, content:"✦ Luận điểm 1: Bóc tách giá trị\n✦ Luận điểm 2: Phân tích chiều sâu\n✦ Luận điểm 3: Ứng dụng thực tế", fontSize:12.5, color:"#ffffff", textAlign:"left", animPreset:"slide-up", animDelay:0.4`
  },

  'layout-cyber-hud': {
    id: 'layout-cyber-hud',
    name: 'Layout A2: The Cyber HUD (Target Reticle + Laser Scanner + Tech Specs)',
    generatePrompt: (ACCENT) => `-- Layout A2: The Cyber HUD (Target Reticle + Laser Scanner + Tech Specs) --
  Element 1 (tech tag): type:"text", left:180, top:68, width:312, height:20, content:"[ SCANNING: MULTIMODAL AI ]", fontSize:11, fontFamily:"monospace", fontWeight:700, color:"${ACCENT}", textAlign:"center", animPreset:"fade-in", animDelay:0.1
  Element 2 (title center): type:"text", left:180, top:98, width:320, height:40, content:"TIÊU ĐỀ KỸ THUẬT", fontSize:23, fontFamily:"Be Vietnam Pro", fontWeight:900, color:"#ffffff", textAlign:"center", animPreset:"slide-up", animDelay:0.2
  Element 3 (3D hero scan): type:"image", src:"<URL from RELEVANT_3D_ASSETS>", left:180, top:215, width:165, height:165, animPreset:"zoom-in", animDelay:0.25
  Element 4 (specs checklist): type:"checklist", left:180, top:345, width:320, content:"THÔNG SỐ CÔNG NGHỆ", checklistItems:[{text:"Phân giải sơ đồ CAD & Kiến trúc 3D", status:"checked"}, {text:"Nhận diện chi tiết siêu nhỏ dưới 4K", status:"checked"}, {text:"Bóc tách biểu đồ tài chính thực", status:"checked"}], animPreset:"slide-up", animDelay:0.4`
  },

  'layout-bento-grid': {
    id: 'layout-bento-grid',
    name: 'Layout A3: Bento Grid Showcase (Split 3D Hero + Big Metric + Bottom Pills)',
    generatePrompt: (ACCENT) => `-- Layout A3: Bento Grid Showcase (Split 3D Hero + Big Metric + Bottom Pills) --
  Element 1 (title center): type:"text", left:180, top:72, width:320, height:35, content:"HIỆU NĂNG VƯỢT TRỘI", fontSize:23, fontFamily:"Be Vietnam Pro", fontWeight:900, color:"#ffffff", textAlign:"center", animPreset:"slide-up", animDelay:0.15
  Element 2 (hero 3D left): type:"image", src:"<URL from RELEVANT_3D_ASSETS>", left:105, top:185, width:135, height:135, animPreset:"zoom-in", animDelay:0.25
  Element 3 (metric stat right): type:"stat-big", left:255, top:185, width:155, height:135, statValue:"4K", statLabel:"ĐỘ CHI TIẾT", animPreset:"slide-up", animDelay:0.35
  Element 4 (bottom feature pill): type:"highlight-box", left:180, top:325, width:320, height:75, content:"✦ Xử lý đồ họa đa nhiệm 60FPS\n✦ Kiến trúc phần cứng thế hệ mới", fontSize:12.5, color:"#ffffff", textAlign:"left", animPreset:"slide-up", animDelay:0.45`
  },

  'layout-impact-metric': {
    id: 'layout-impact-metric',
    name: 'Layout B: Impact Stat & Key Metric (Centered Powerful Numbers + Action Pills)',
    generatePrompt: (ACCENT) => `-- Layout B: Impact Stat & Key Metric (Centered Powerful Numbers + Action Pills) --
  Element 1 (header badge center): type:"badge", left:180, top:68, width:140, height:24, bgColor:"${ACCENT}", content:"CON SỐ ẤN TƯỢNG", color:"#000", radius:12, fontSize:11, fontWeight:900, animPreset:"zoom-in", animDelay:0.1
  Element 2 (stat-big center): type:"stat-big", left:180, top:175, width:312, height:120, statValue:"3s", statLabel:"NEO TÂM TRÍ", animPreset:"zoom-in", animDelay:0.25
  Element 3 (action feature pills): type:"highlight-box", left:180, top:315, width:320, height:80, content:"✦ Bước 1: Ngắt dòng suy nghĩ miên man\n✦ Bước 2: Trở về hiện tại ngay tức khắc", fontSize:12.5, color:"#ffffff", textAlign:"left", animPreset:"slide-up", animDelay:0.45
  OPTIONAL Element 4 (satellite 3D sparkle): If adding a 3D icon/star, place it as an accent satellite near the stat: type:"image", left:265, top:145, width:65, height:65, animPreset:"zoom-in", animDelay:0.35`
  },

  'layout-action-checklist': {
    id: 'layout-action-checklist',
    name: 'Layout C: Actionable List / Checklist (Structured Steps & Tips)',
    generatePrompt: (ACCENT) => `-- Layout C: Actionable List / Checklist (Structured Steps & Tips) --
  Element 1 (category badge): type:"badge", left:24, top:68, width:110, height:22, bgColor:"${ACCENT}", content:"DANH SÁCH VÀNG", color:"#000", radius:11, fontSize:11, fontWeight:900, animPreset:"zoom-in", animDelay:0.1
  Element 2 (title): type:"text", left:24, top:100, width:312, height:40, content:"3 Quy Tắc Bắt Buộc", fontSize:22, fontFamily:"Be Vietnam Pro", fontWeight:800, color:"${ACCENT}", textAlign:"left", animPreset:"slide-up", animDelay:0.2
  Element 3 (checklist): type:"checklist", left:180, top:230, width:320, content:"QUY TẮC CỐT LÕI", checklistItems:[{text:"Mục 1", subtext:"Mô tả", status:"checked"}, {text:"Mục 2", subtext:"Mô tả", status:"checked"}, {text:"Mục 3", subtext:"Tránh làm", status:"cross"}], animPreset:"fade-in", animDelay:0.35`
  },

  'layout-data-framework': {
    id: 'layout-data-framework',
    name: 'Layout D: Data Visualization & Battle (Charts, Diagrams & Graphs)',
    generatePrompt: (ACCENT) => `-- Layout D: Data Visualization & Battle (Charts, Diagrams & Graphs) --
  Element 1 (context badge): type:"badge", left:180, top:68, width:120, height:22, bgColor:"${ACCENT}", content:"DỮ LIỆU THỰC TẾ", color:"#000", radius:11, fontSize:11, fontWeight:900, animPreset:"zoom-in", animDelay:0.1
  Element 2 (chart/diagram widget): CHOOSE 1 OF 14 CHARTS & DIAGRAMS BASED ON CONTEXT:
    • Growth/Trend: type:"line-chart" | "gauge-chart" | "chart-bar"
    • Finance/Cashflow: type:"candlestick-chart" | "waterfall-chart" | "sankey-chart" | "heatmap-matrix"
    • Roadmap/Tech/Ecosystem: type:"tree-diagram" | "network-graph" | "radar-chart"
    • Market Share/Battle: type:"racing-bar-chart" | "pie-chart" | "vs-battle" | "ranking-list"
    Position: left:180, top:210, width:312, animPreset:"zoom-in", animDelay:0.25
    CRITICAL INSTRUCTION FOR CHARTS: Generate realistic and contextual data arrays (labels, values, colors) matching the story topic. If the script lacks exact numbers, boldly INVENT logical estimates for the chart data.
  Element 3 (insight highlight): type:"highlight-box", left:180, top:350, width:312, height:65, bgColor:"rgba(255,255,255,0.04)", accentColor:"${ACCENT}", radius:12, content:"💡 Insight cốt lõi từ dữ liệu phân tích", fontSize:13, color:"#fff", textAlign:"center", animPreset:"slide-up", animDelay:0.45`
  },

  'layout-quote-reflection': {
    id: 'layout-quote-reflection',
    name: 'Layout E: Quote & Mindful Reflection (Zen / Inspiration / Deep Insight)',
    generatePrompt: (ACCENT) => `-- Layout E: Quote & Mindful Reflection (Zen / Inspiration / Deep Insight) --
  Element 1 (zen tag): type:"text", left:180, top:70, width:200, height:20, content:"─── LỜI NHẮC NHỞ ───", fontSize:11, fontFamily:"Inter", fontWeight:700, color:"${ACCENT}", textAlign:"center", animPreset:"fade-in", animDelay:0.1
  Element 2 (quote-box): type:"quote-box", left:180, top:190, width:312, height:140, content:"Câu nói chạm đến cảm xúc hoặc chân lý sâu sắc...", authorName:"Chiêm Nghiệm", accentColor:"${ACCENT}", animPreset:"slide-up", animDelay:0.25
  Element 3 (3D image): type:"image", src:"<URL from RELEVANT_3D_ASSETS>", left:180, top:335, width:75, height:75, animPreset:"zoom-in", animDelay:0.45`
  },

  'layout-process-roadmap': {
    id: 'layout-process-roadmap',
    name: 'Layout F: Process & Roadmap (3-Step Action Sequence)',
    generatePrompt: (ACCENT) => `-- Layout F: Process & Roadmap (3-Step Action Sequence) --
  Element 1 (badge): type:"badge", left:180, top:68, width:120, height:22, bgColor:"${ACCENT}", content:"LỘ TRÌNH 3 BƯỚC", color:"#000", radius:11, fontSize:11, fontWeight:900, animPreset:"zoom-in", animDelay:0.1
  Element 2 (flowchart widget): type:"flowchart", left:180, top:190, width:336, height:250, flowSteps:[{step:"01", title:"BƯỚC 1", desc:"Khởi tạo", status:"done"}, {step:"02", title:"BƯỚC 2", desc:"Triển khai", status:"active"}, {step:"03", title:"BƯỚC 3", desc:"Về đích", status:"pending"}], animPreset:"slide-up", animDelay:0.25
  Element 3 (summary box): type:"highlight-box", left:180, top:360, width:312, height:55, bgColor:"rgba(255,255,255,0.04)", accentColor:"${ACCENT}", radius:12, content:"Thực hiện tuần tự để đạt kết quả tối đa!", fontSize:13, color:"#fff", textAlign:"center", animPreset:"fade-in", animDelay:0.5`
  }
};

/**
 * Climax / Highlight Scene Template
 */
export const CLIMAX_LAYOUT = {
  id: 'climax-highlight',
  name: 'Highlight Climax Scene (Maximum Impact)',
  generatePrompt: (ACCENT) => `=== HIGHLIGHT SCENE (scene n-1 = climax) — MAXIMUM IMPACT CLIMAX LAYOUT ===
This is the emotional and knowledge PEAK of the video. Keep it clean, bold and uncluttered (Max 3-4 elements):
- Element 1 (header impact badge): type:"badge", left:180, top:68, width:130, height:24, bgColor:"${ACCENT}", content:"⚡ BÍ KÍP VÀNG", color:"#000", radius:12, fontSize:11, fontWeight:900, animPreset:"zoom-in", animDelay:0.1
- Element 2 (highlight title text): type:"text", left:180, top:105, width:312, height:40, content:"ĐỈNH CAO THÀNH CÔNG", fontSize:24, fontFamily:"Be Vietnam Pro", fontWeight:900, color:"#ffffff", textAlign:"center", animPreset:"slide-up", animDelay:0.2
- Element 3 (primary impact widget): type:"stat-big" OR "candlestick-chart" OR "waterfall-chart" OR "pyramid-funnel" OR "racing-bar-chart" OR "ranking-list" OR "quote-box", left:180, top:190, width:320, animPreset:"zoom-in", animDelay:0.35
- Element 4 (golden takeaway box): type:"highlight-box", left:180, top:330, width:312, height:65, bgColor:"rgba(255,255,255,0.06)", accentColor:"${ACCENT}", radius:12, content:"⭐ Bài học cốt lõi: Hành động quyết định kết quả!", fontSize:14, color:"#ffffff", textAlign:"center", animPreset:"slide-up", animDelay:0.55`
};

/**
 * CTA (Call to Action) Scene Template
 */
export const CTA_LAYOUT = {
  id: 'cta-conversion',
  name: 'CTA Conversion Scene',
  generatePrompt: (ACCENT) => `=== CTA SCENE (last scene) — centered layout ===
Element 1 — action header label:
  type:"text", left:180, top:80, width:240, height:30, content:"─── BẮT ĐẦU NGAY ───", fontSize:12, fontFamily:"Inter", fontWeight:700, color:"${ACCENT}", textAlign:"center", animPreset:"fade-in", animDelay:0.1
Element 2 — top CTA title:
  type:"text", left:180, top:130, width:312, height:80, content:"TỐI ƯU HÓA", fontSize:40, fontFamily:"Be Vietnam Pro", fontWeight:900, color:"#ffffff", textAlign:"center", animPreset:"slide-up", animDelay:0.25
Element 3 — big CTA keyword:
  type:"text", left:180, top:220, width:312, height:100, content:"ACTION", fontSize:84, fontFamily:"Be Vietnam Pro", fontWeight:900, color:"${ACCENT}", textAlign:"center", shadow:true, animPreset:"zoom-in", animDelay:0.4
Element 4 — bottom word:
  type:"text", left:180, top:330, width:260, height:40, content:"HÔM NAY!", fontSize:22, fontFamily:"Inter", fontWeight:700, color:"#ffffff", textAlign:"center", animPreset:"slide-up", animDelay:0.65
Element 5 — divider:
  type:"divider", left:180, top:385, width:200, height:2, accentColor:"${ACCENT}", animPreset:"fade-in", animDelay:0.8
Element 6 — follow line:
  type:"text", left:180, top:405, width:312, height:30, content:"👆 Nhấn Follow để nhận thêm bí quyết!", fontSize:12, fontFamily:"Inter", fontWeight:500, color:"#ffffff", opacity:0.85, textAlign:"center", animPreset:"fade-in", animDelay:0.95`
};

/**
 * Resolves the best hook layout based on input prompt style or text keywords (5-Axes Semantic Engine)
 */
export function getHookLayoutFromRegistry(styleOrText, ACCENT) {
  const s = (styleOrText || '').toLowerCase();
  // 1. Zen / Healing / Mindful
  if (s.includes('thiền') || s.includes('chữa lành') || s.includes('an nhiên') || s.includes('chill') || s.includes('asmr') || s.includes('zen') || s.includes('tâm lý') || s.includes('bình yên')) {
    return HOOK_ARCHETYPES['zen-mindful-hook'].generatePrompt(ACCENT);
  }
  // 2. Tech / Cyber / AI / Code
  if (s.includes('công nghệ') || s.includes('ai') || s.includes('lập trình') || s.includes('chuyên gia') || s.includes('dev') || s.includes('tech') || s.includes('code') || s.includes('crypto') || s.includes('hacker')) {
    return HOOK_ARCHETYPES['tech-ai-hook'].generatePrompt(ACCENT);
  }
  // 3. Shock Stat / Giant Numbers / Data
  if (s.includes('%') || s.includes('con số') || s.includes('thống kê') || s.includes('tỷ lệ') || s.includes('triệu') || s.includes('tỷ') || s.includes('stat') || s.includes('data')) {
    return HOOK_ARCHETYPES['giant-stat-hook'].generatePrompt(ACCENT);
  }
  // 4. Warning / Hazard / Mistake / Urgency
  if (s.includes('cảnh báo') || s.includes('sai lầm') || s.includes('nguy hiểm') || s.includes('mất tiền') || s.includes('dừng lại') || s.includes('hazard') || s.includes('warning') || s.includes('danger')) {
    return HOOK_ARCHETYPES['story-drama-hook'].generatePrompt(ACCENT);
  }
  // 5. Casual / Script / Emotional Story / Secret
  if (s.includes('bí mật') || s.includes('kể chuyện') || s.includes('bạn có biết') || s.includes('câu chuyện') || s.includes('secret') || s.includes('bật mí')) {
    return HOOK_ARCHETYPES['classified-secret-hook'].generatePrompt(ACCENT);
  }
  // 6. Versus / Comparison
  if (s.includes('đối đầu') || s.includes('so sánh') || s.includes('hơn thua') || s.includes('versus') || s.includes('vs') || s.includes('hay')) {
    return HOOK_ARCHETYPES['versus-battle-hook'].generatePrompt(ACCENT);
  }
  // 7. Stacked Focus / Fast Steps
  if (s.includes('bước') || s.includes('bí quyết') || s.includes('cách') || s.includes('hướng dẫn')) {
    return HOOK_ARCHETYPES['solid-box-hook'].generatePrompt(ACCENT);
  }
  // 8. Kinetic Contrast Default (High Energy Viral Hook)
  return HOOK_ARCHETYPES['viral-high-energy-hook'].generatePrompt(ACCENT);
}

/**
 * Compiles full layout rules from the registry
 */
export function getCompiledLayoutRulesFromRegistry(customTemplates, style, ACCENT) {
  if (customTemplates) {
    const ruleLines = (tpl, label) => tpl.elements.map(el =>
      `  ${el.slot}: type:"${el.type}", left:${el.left}, top:${el.top}, ` +
      `width:${el.width}, height:${el.height}, fontSize:${el.fontSize || 'auto'}, ` +
      `fontFamily:"${el.fontFamily || 'Inter'}", fontWeight:${el.fontWeight || 700}, ` +
      `color:"${el.color || '#ffffff'}", animPreset:"${el.animPreset || 'fade-in'}", ` +
      `animDelay:${el.animDelay || 0}`
    ).join('\n');

    return `
=== HOOK SCENE — Follow exactly (user custom template) ===
${ruleLines(customTemplates.hookTemplate, 'HOOK')}

=== CONTENT SCENES — Follow exactly (user custom template) ===
${ruleLines(customTemplates.contentTemplate, 'CONTENT')}

=== CTA SCENE — Follow exactly (user custom template) ===
${ruleLines(customTemplates.ctaTemplate, 'CTA')}

COLOR PALETTE: accent="${customTemplates.colorPalette.accent}", bg="${customTemplates.colorPalette.bgDark}"
FONTS: heading="${customTemplates.fontPair.heading}", body="${customTemplates.fontPair.body}"
`;
  }

  const hookSection = getHookLayoutFromRegistry(style, ACCENT);
  const contentSection = Object.values(CONTENT_LAYOUTS).map(l => l.generatePrompt(ACCENT)).join('\n\n');
  const climaxSection = CLIMAX_LAYOUT.generatePrompt(ACCENT);
  const ctaSection = CTA_LAYOUT.generatePrompt(ACCENT);

  return `
${hookSection}

=== CONTENT SCENES (scenes 2 to n-1) — 8 DIVERSE COMPOSITION TEMPLATES ===
You MUST alternate dynamically between these 8 layout templates for normal/highlight scenes based on the spoken context. DO NOT use the same layout for consecutive scenes!

CRITICAL DESIGN RULES:
1. NEVER put emoji inside highlight-box, checklist, or title text! Use clean modern symbols like ✦, ◈, or sequential numbers.
2. For product showcases, tech features, or 3D visuals, DYNAMICALLY ALTERNATE between:
   - Layout A1 (Apple Stage) for elegant, premier, aesthetic hero showcases.
   - Layout A2 (Cyber HUD) for technical, deep analysis, scanner, CAD/code features.
   - Layout A3 (Bento Grid) for multitasking, performance metrics, specs comparison.

${contentSection}

${climaxSection}

${ctaSection}
`;
}
