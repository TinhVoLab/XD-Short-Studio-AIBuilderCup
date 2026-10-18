import * as fabric from 'fabric';
import { SceneElement } from '@/types/scene';
import { calculateElementDynamicHeight } from '@/config/layoutRegistry';
import { getContrastTextColor } from '@/config/themePalettes';
import {
  getFabricThemeColors,
  resolveColor,
  mixColors,
  buildQuoteBoxFabricObjects,
  buildPieChartFabricObjects,
  buildHighlightBoxFabricObjects,
  buildMasterHookFabricObjects,
  buildMasterSceneFabricObjects,
  buildDynamicDiagramFabricObjects,
  buildLineChartFabricObjects,
  buildRadarChartFabricObjects,
  buildChecklistFabricObjects,
  buildChartBarFabricObjects,
  buildCircleChartFabricObjects,
  buildGaugeChartFabricObjects,
  buildSankeyChartFabricObjects,
  buildHeatmapMatrixFabricObjects,
  buildHologramBarFabricObjects,
  buildPyramidFunnelFabricObjects,
  buildTimelineFabricObjects,
  buildVisualParadoxFabricObjects,
  buildMathPlotFabricObjects,
  buildInteractiveQuizFabricObjects,
  buildVocabCardFabricObjects,
  buildLatexFormulaFabricObjects,
  buildChemicalMoleculeFabricObjects,
  buildCodeTerminalFabricObjects,
  buildNetworkGraphFabricObjects,
} from './widgets';

// Re-export sub-renderers and utilities for backward compatibility & direct access
export * from './widgets';

/**
 * Facade Dispatcher for Widget Card Elements on Fabric 2D Canvas
 * Delegates dedicated element types to domain sub-renderers in `./widgets/`
 * and provides robust generic card fallback for custom widgets.
 */
export function buildWidgetCardObjects(
  el: SceneElement,
  accent: string,
  labelText: string,
  w: number,
  h: number,
  isCenterCenter: boolean
): fabric.FabricObject[] {
  const themeColors = getFabricThemeColors(el);
  const safeAccent = accent && accent.startsWith('#') ? accent : themeColors.accent;

  // 1. Dedicated Sub-Renderer Dispatch
  if (el.type === 'quote-box') {
    return buildQuoteBoxFabricObjects(el, safeAccent, w, h);
  }
  if (el.type === 'pie-chart') {
    return buildPieChartFabricObjects(el, safeAccent, w, h);
  }
  if (el.type === 'highlight-box') {
    return buildHighlightBoxFabricObjects(el, safeAccent, w, h);
  }
  if (el.type === 'master-scene') {
    return buildMasterSceneFabricObjects(el, safeAccent, w);
  }
  if (el.type === 'master-hook') {
    return buildMasterHookFabricObjects(el, safeAccent, w, h);
  }
  if (el.type === 'dynamic-diagram') {
    return buildDynamicDiagramFabricObjects(el, safeAccent, w, h);
  }
  if (el.type === 'line-chart') {
    return buildLineChartFabricObjects(el, safeAccent, w, h);
  }
  if (el.type === 'radar-chart') {
    return buildRadarChartFabricObjects(el, safeAccent, w, h);
  }
  if (el.type === 'chart-bar') {
    return buildChartBarFabricObjects(el, safeAccent, w, h);
  }
  if (el.type === 'circle-chart') {
    return buildCircleChartFabricObjects(el, safeAccent, w, h);
  }
  if (el.type === 'gauge-chart') {
    return buildGaugeChartFabricObjects(el, safeAccent, w, h);
  }
  if (el.type === 'sankey-chart') {
    return buildSankeyChartFabricObjects(el, safeAccent, w, h);
  }
  if (el.type === 'heatmap-matrix') {
    return buildHeatmapMatrixFabricObjects(el, safeAccent, w, h);
  }
  if (el.type === 'checklist') {
    return buildChecklistFabricObjects(el, safeAccent, w, h);
  }
  if (el.type === 'hologram-bar') {
    return buildHologramBarFabricObjects(el, safeAccent, w, h);
  }
  if (el.type === 'pyramid-funnel') {
    return buildPyramidFunnelFabricObjects(el, safeAccent, w, h);
  }
  if (el.type === 'timeline') {
    return buildTimelineFabricObjects(el, safeAccent, w, h);
  }
  if (el.type === 'visual-paradox') {
    return buildVisualParadoxFabricObjects(el, safeAccent, w, h);
  }
  if (el.type === 'math-plot') {
    return buildMathPlotFabricObjects(el, safeAccent, w, h);
  }
  if (el.type === 'interactive-quiz') {
    return buildInteractiveQuizFabricObjects(el, safeAccent, w, h);
  }
  if (el.type === 'vocab-card') {
    return buildVocabCardFabricObjects(el, safeAccent, w, h);
  }
  if (el.type === 'latex-formula') {
    return buildLatexFormulaFabricObjects(el, safeAccent, w, h);
  }
  if (el.type === 'chemical-molecule') {
    return buildChemicalMoleculeFabricObjects(el, safeAccent, w, h);
  }
  if (el.type === 'code-terminal') {
    return buildCodeTerminalFabricObjects(el, safeAccent, w, h);
  }
  if (el.type === 'network-graph') {
    return buildNetworkGraphFabricObjects(el, safeAccent, w, h);
  }

  // 2. Generic placeholder card — widget chưa có renderer Fabric riêng.
  // Màu lấy từ token thật của cảnh (nền thẻ --card-bg, chữ --text/--text-sub, accent chỉ làm điểm nhấn
  // không chứa chữ) → đọc được trên cả 9 theme; chiều cao = công thức H = f(X) để khung chọn/va chạm khớp video.
  return buildGenericPlaceholderCard(el, safeAccent, labelText, w, h, isCenterCenter, themeColors);
}

/** Bỏ emoji / ký hiệu hình ảnh khỏi nhãn placeholder (AGENTS.md §1) */
const stripPictographs = (s: string) =>
  s.replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}\u{20E3}]/gu, '').replace(/\s{2,}/g, ' ').trim();

/** Tên dễ đọc từ type khi nhãn trống: 'tree-diagram' → 'Tree diagram' */
const typeLabel = (type: string) => {
  const t = type.replace(/-/g, ' ');
  return t.charAt(0).toUpperCase() + t.slice(1);
};

function buildGenericPlaceholderCard(
  el: SceneElement,
  accent: string,
  labelText: string,
  w: number,
  h: number,
  isCenterCenter: boolean,
  themeColors: ReturnType<typeof getFabricThemeColors>
): fabric.FabricObject[] {
  const objects: fabric.FabricObject[] = [];
  const halfW = w / 2;
  const formulaH = calculateElementDynamicHeight({ ...el, width: w } as any);
  const boxH = Number.isFinite(formulaH) && formulaH > 0 ? formulaH : h;
  const isFrameless = el.showCardBg === false || el.bgColor === 'transparent';
  const bgColor = resolveColor(el.bgColor, themeColors.vars);
  const radius = el.radius !== undefined ? el.radius : 12;
  // Nền tuỳ chỉnh → chữ theo độ sáng nền đó; mặc định → token chữ của theme
  const customBg = !isFrameless && bgColor && bgColor.startsWith('#') ? bgColor : null;
  const textColor = customBg ? getContrastTextColor(customBg) : themeColors.text;
  const subColor = customBg ? mixColors(textColor, 72, customBg) : themeColors.textSub;
  const top = isCenterCenter ? -boxH / 2 : 0;

  const lines = labelText
    .split('\n')
    .map(stripPictographs)
    .filter(l => l && !/kéo thả|khung bọc đè/i.test(l));
  const title = lines[0] || typeLabel(el.type);

  objects.push(new fabric.Rect({
    left: 0, top, width: w, height: boxH,
    fill: isFrameless ? 'transparent' : (customBg || bgColor || themeColors.cardBg),
    stroke: isFrameless ? mixColors(themeColors.textSub, 45) : themeColors.border,
    strokeWidth: 1,
    strokeDashArray: isFrameless ? [4, 4] : [],
    rx: isFrameless ? 6 : radius,
    ry: isFrameless ? 6 : radius,
    originX: 'center', originY: 'top',
  } as any));

  // Vạch accent mảnh bên trái (điểm nhấn không chứa chữ → không phụ thuộc tương phản)
  objects.push(new fabric.Rect({
    left: -halfW + 1, top: top + Math.min(12, boxH / 4), width: 3, height: Math.max(8, boxH - Math.min(24, boxH / 2)),
    fill: accent, rx: 1.5, ry: 1.5, strokeWidth: 0,
    originX: 'left', originY: 'top',
  } as any));

  const PAD_X = 14;
  const TITLE_FS = w < 200 ? 11 : 12;
  const ROW_FS = w < 200 ? 10 : 11;
  const ROW_H = Math.round(ROW_FS * 1.6);
  const titleH = Math.round(TITLE_FS * 1.5);
  const fit = (s: string, fs: number, avail: number) => {
    const maxChars = Math.max(6, Math.floor(avail / (fs * 0.56)));
    return s.length > maxChars ? s.slice(0, maxChars - 1) + '…' : s;
  };

  // Chỉ còn chỗ cho tiêu đề → căn giữa theo chiều dọc
  const rowsFit = Math.max(0, Math.floor((boxH - 12 - titleH - 6 - 10) / ROW_H));
  const rows = lines.slice(1, 1 + Math.min(rowsFit, 6));
  const blockH = titleH + (rows.length ? 6 + rows.length * ROW_H : 0);
  let curY = top + Math.max(10, Math.min(14, (boxH - blockH) / 2));
  if (isCenterCenter) curY = top + (boxH - blockH) / 2;

  objects.push(new fabric.IText(fit(title, TITLE_FS, w - PAD_X * 2), {
    left: -halfW + PAD_X, top: curY,
    fontSize: TITLE_FS, fontWeight: '700',
    fill: textColor,
    originX: 'left', originY: 'top',
    fontFamily: 'Be Vietnam Pro',
  } as any));
  curY += titleH + 6;

  rows.forEach((line, i) => {
    objects.push(new fabric.IText(fit(line, ROW_FS, w - PAD_X * 2), {
      left: -halfW + PAD_X, top: curY + i * ROW_H,
      fontSize: ROW_FS, fontWeight: '500',
      fill: subColor,
      originX: 'left', originY: 'top',
      fontFamily: 'Be Vietnam Pro',
    } as any));
  });

  return objects;
}
