import * as fabric from 'fabric';
import { SceneElement } from '@/types/scene';
import { LatexFormulaData } from '@/types/stem';
import { getFabricThemeColors, resolveColor, mixColors, readableTint } from './colorUtils';
import { isNeutralTextColor } from '@/config/themePalettes';
import { validateLatex } from '@/utils/stem/latex';
import { getLatexPreview, isLatexPreviewReady, LATEX_PREVIEW_SCALE, type LatexPreviewSpec } from '../../latexPreview';

/**
 * Dedicated Fabric 2D Vector Renderer for LaTeX Formula Elements
 * Khớp LatexFormulaElement: thẻ var(--card-bg) + viền var(--border), header --surface-1 (tiêu đề --text-sub,
 * badge accent), công thức căn giữa màu var(--text) khi màu là trắng/đen mặc định.
 * Coordinates are centered horizontally around x = 0 ([-halfW, halfW]) with top = 0.
 */
export function buildLatexFormulaFabricObjects(
  el: SceneElement,
  accent: string,
  w: number,
  h: number
): fabric.FabricObject[] {
  const objects: fabric.FabricObject[] = [];
  const halfW = w / 2;
  const themeColors = getFabricThemeColors(el);
  h = Math.max(60, h);

  const data = resolveLatexData(el);
  const showBackground = data.showBackground !== false && el.showCardBg !== false;
  const formulaColor = resolveFormulaColor(el, data);
  const accentColor = accent && accent.startsWith('#') ? accent : themeColors.accent;

  // 1. Card Container
  objects.push(new fabric.Rect({
    left: 0,
    top: 0,
    width: w,
    height: h,
    fill: showBackground ? themeColors.cardBg : 'transparent',
    stroke: showBackground ? themeColors.border : mixColors(themeColors.textSub, 40),
    strokeWidth: 1,
    strokeDashArray: showBackground ? [] : [4, 4],
    rx: 12,
    ry: 12,
    originX: 'center',
    originY: 'top',
  } as any));

  // 2. Header (padding 6px 12px, nền --surface-1, hairline dưới) khi có tiêu đề hoặc badge
  const titleStr = String(data.title || '').trim();
  const badgeStr = String((data as any).badge || '').trim().toUpperCase();
  let headerH = 0;
  if (titleStr || badgeStr) {
    headerH = 29;
    objects.push(new fabric.Rect({
      left: 0,
      top: 0.5,
      width: w - 1,
      height: headerH - 0.5,
      fill: themeColors.surface1,
      strokeWidth: 0,
      originX: 'center',
      originY: 'top',
    } as any));
    objects.push(new fabric.Rect({
      left: 0,
      top: headerH,
      width: w,
      height: 1,
      fill: themeColors.border,
      strokeWidth: 0,
      originX: 'center',
      originY: 'top',
    } as any));
    if (titleStr) {
      const maxTitleChars = Math.max(8, Math.floor((w - 24 - (badgeStr ? badgeStr.length * 7 + 20 : 0)) / 6));
      objects.push(new fabric.IText(titleStr.length > maxTitleChars ? titleStr.slice(0, maxTitleChars - 1) + '…' : titleStr, {
        left: -halfW + 12,
        top: headerH / 2,
        fontSize: 11,
        fontWeight: '600',
        fill: themeColors.textSub,
        fontFamily: 'Be Vietnam Pro',
        originX: 'left',
        originY: 'center',
        selectable: false,
      } as any));
    }
    if (badgeStr) {
      const badgeText = new fabric.IText(badgeStr, {
        left: halfW - 12 - 6,
        top: headerH / 2,
        fontSize: 9.5,
        fontWeight: '700',
        fill: readableTint(accentColor, themeColors),
        fontFamily: 'Be Vietnam Pro',
        originX: 'right',
        originY: 'center',
        selectable: false,
      } as any);
      objects.push(new fabric.Rect({
        left: halfW - 12,
        top: headerH / 2,
        width: (badgeText.width || 0) + 12,
        height: 17,
        rx: 4,
        ry: 4,
        fill: mixColors(accentColor, 15),
        strokeWidth: 0,
        originX: 'right',
        originY: 'center',
      } as any));
      objects.push(badgeText);
    }
  }

  // 5. LaTeX Display String (Centered, math styling)
  let formulaStr = data.latex || 'f(x) = \\int_0^\\infty e^{-x} dx';
  // Simplify common LaTeX commands for clean 2D representation
  formulaStr = formulaStr
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)')
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\\cdot/g, '·')
    .replace(/\\times/g, '×')
    .replace(/\\pm/g, '±')
    .replace(/\\infty/g, '∞')
    .replace(/\\pi/g, 'π')
    .replace(/\\theta/g, 'θ')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\int/g, '∫')
    .replace(/\\sum/g, '∑')
    .replace(/\\lim/g, 'lim')
    .replace(/\\rightarrow/g, '→')
    .replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥')
    .replace(/\\neq/g, '≠')
    .replace(/\^\{?([0-9n+\-])\}?/g, (_m, d: string) => ({ '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', n: 'ⁿ', '+': '⁺', '-': '⁻' } as Record<string, string>)[d] || d)
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/[{}]/g, '')
    .trim();

  const maxChars = Math.floor((w - 32) / 9.5);
  if (formulaStr.length > maxChars) {
    formulaStr = formulaStr.slice(0, maxChars - 1) + '…';
  }

  // Cỡ chữ = data.fontSize (26) như video, thu lại cho vừa vùng nội dung (padding 12px 16px)
  const bodyTop = headerH + (headerH ? 1 : 0);
  const bodyH = h - bodyTop;
  const fitByWidth = (w - 32) / Math.max(1, formulaStr.length * 0.55);
  const fontSize = Math.max(10, Math.min(data.fontSize || 26, fitByWidth, (bodyH - 8) / 1.2));

  // Công thức thật: ảnh KaTeX cùng renderLatexHtml với video, thu cho vừa vùng nội dung (padding 12px 16px)
  const spec = latexPreviewSpec(el, data);
  const texImg = spec ? getLatexPreview(spec) : null;
  if (texImg) {
    const natW = texImg.naturalWidth / LATEX_PREVIEW_SCALE;
    const natH = texImg.naturalHeight / LATEX_PREVIEW_SCALE;
    const fit = Math.min(1, (w - 32) / Math.max(1, natW), (bodyH - 8) / Math.max(1, natH));
    objects.push(new fabric.FabricImage(texImg, {
      left: 0,
      top: bodyTop + bodyH / 2,
      originX: 'center',
      originY: 'center',
      scaleX: fit / LATEX_PREVIEW_SCALE,
      scaleY: fit / LATEX_PREVIEW_SCALE,
      selectable: false,
      evented: false,
    }));
    return objects;
  }

  // LaTeX sai: video ẩn thành phần này → trên canvas báo để người dùng sửa (chỉ hiện trong Studio)
  // Đang dựng ảnh: tạm hiện bản Unicode gần đúng
  objects.push(new fabric.IText(spec ? formulaStr : 'LaTeX không hợp lệ — mở Mã LaTeX để sửa', {
    left: 0,
    top: bodyTop + bodyH / 2,
    fontSize: spec ? fontSize : 11,
    fontWeight: '400',
    fontStyle: spec ? 'italic' : 'normal',
    fill: spec ? formulaColor : themeColors.textSub,
    fontFamily: spec ? "'Cambria Math', 'Times New Roman', serif" : 'Be Vietnam Pro',
    originX: 'center',
    originY: 'center',
    selectable: false,
  } as any));

  return objects;
}

function resolveLatexData(el: SceneElement): LatexFormulaData {
  return (el as any).latexData || {
    latex: 'E = mc^2',
    fontSize: 26,
    showBackground: true,
    title: 'Năng lượng tương đối tính',
  };
}

/** Trắng/đen thuần là màu preset → theo token chữ của theme (khớp LatexFormulaElement) */
function resolveFormulaColor(el: SceneElement, data: LatexFormulaData): string {
  const themeColors = getFabricThemeColors(el);
  const rawColor = resolveColor(data.color || (el as any).fill, themeColors.vars);
  return !rawColor || isNeutralTextColor(rawColor) ? themeColors.text : rawColor;
}

/** null = LaTeX sai (video ẩn thành phần) */
function latexPreviewSpec(el: SceneElement, data: LatexFormulaData): LatexPreviewSpec | null {
  const check = validateLatex(data.latex || '');
  if (!check.ok) return null;
  return { latex: check.latex, displayMode: data.displayMode !== false, fontSize: data.fontSize || 26, color: resolveFormulaColor(el, data) };
}

/** Cho fingerprint: ảnh công thức đã sẵn sàng chưa (đổi trạng thái → canvas vẽ lại) */
export function isLatexFormulaPreviewReady(el: SceneElement): boolean {
  const spec = latexPreviewSpec(el, resolveLatexData(el));
  return spec ? isLatexPreviewReady(spec) : false;
}
