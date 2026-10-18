import * as fabric from 'fabric';
import { SceneElement } from '@/types/scene';
import { ChemicalMoleculeData } from '@/types/stem';
import { getFabricThemeColors, mixColors } from './colorUtils';
import { renderMoleculeSvg } from '@/utils/stem/moleculeSvg';
import { getVectorAssetImage, isVectorAssetReady, svgToDataUrl } from '../../vectorAssetCache';

/** Dựng ảnh ở 2x để chữ nguyên tử sắc nét khi phóng canvas */
const MOLECULE_PREVIEW_SCALE = 2;

/** Khung SVG = vùng nội dung trừ lề (khớp ChemicalMoleculeElement: width - 24, contentHeight - 16) */
function moleculeBox(data: ChemicalMoleculeData, w: number, contentH: number) {
  const boxW = Math.max(80, Math.round(w - 24));
  const boxH = Math.max(60, Math.round(contentH - 16));
  const theme = data.theme && data.theme !== 'auto' ? data.theme : 'neon';
  const key = `mol|${data.smiles}|${theme}|${data.bondThickness || 2.2}|${boxW}x${boxH}`;
  return { boxW, boxH, theme, key };
}

function getMoleculePreview(data: ChemicalMoleculeData, w: number, contentH: number) {
  if (!data.smiles?.trim()) return null;
  const { boxW, boxH, theme, key } = moleculeBox(data, w, contentH);
  const img = getVectorAssetImage(key, () => {
    const { svgHtml } = renderMoleculeSvg(data.smiles, theme, data.bondThickness || 2.2, boxW, boxH, {
      width: boxW * MOLECULE_PREVIEW_SCALE,
      height: boxH * MOLECULE_PREVIEW_SCALE,
    });
    return svgHtml ? svgToDataUrl(svgHtml) : '';
  });
  return img ? { img } : null;
}

function resolveChemData(el: SceneElement): ChemicalMoleculeData {
  return (el as any).chemData || {
    name: el.content || 'Caffeine',
    formula: 'C8H10N4O2',
    smiles: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C',
    theme: 'neon',
    bondThickness: 2.2,
  };
}

/** Header 38px khi có tên/công thức, footer 24px khi có subtext (khớp ChemicalMoleculeElement) */
function chemLayout(data: ChemicalMoleculeData) {
  const showHeader = Boolean(data.showName !== false && (data.name || data.formula));
  const subtext = String(data.subtext || '').trim();
  return { showHeader, headerH: showHeader ? 38 : 0, subtext, subtextH: subtext ? 24 : 0 };
}

/** Cho fingerprint: ảnh phân tử đã sẵn sàng chưa (đổi trạng thái → canvas vẽ lại) */
export function isMoleculePreviewReady(el: SceneElement, w: number, h: number): boolean {
  const data = resolveChemData(el);
  if (!data.smiles?.trim()) return false;
  const { headerH, subtextH } = chemLayout(data);
  return isVectorAssetReady(moleculeBox(data, Math.max(140, w), Math.max(60, Math.max(100, h) - headerH - subtextH)).key);
}

/**
 * Dedicated Fabric 2D Vector Renderer for Chemical Molecule Elements
 * Renders molecular glass card, benzene aromatic ring vector geometry, and chemical nomenclature.
 * Coordinates are centered horizontally around x = 0 ([-halfW, halfW]) with top = 0.
 */
export function buildChemicalMoleculeFabricObjects(
  el: SceneElement,
  accent: string,
  w: number,
  h: number
): fabric.FabricObject[] {
  const objects: fabric.FabricObject[] = [];
  w = Math.max(140, w);
  h = Math.max(100, h);
  const halfW = w / 2;
  // Thẻ "màn hình lab" luôn tối (khớp ChemicalMoleculeElement): khoá chữ sáng bất kể theme
  const themeColors = { ...getFabricThemeColors(el), text: '#FFFFFF', textSub: 'rgba(255, 255, 255, 0.65)' };
  const accentColor = accent && accent.startsWith('#') ? accent : themeColors.accent;

  const data = resolveChemData(el);
  const { showHeader, headerH, subtext, subtextH } = chemLayout(data);

  // 1. Molecular Card Container (nền tối cố định + viền trắng 10%)
  objects.push(new fabric.Rect({
    left: 0,
    top: 0,
    width: w,
    height: h,
    fill: 'rgba(9, 13, 20, 0.88)',
    stroke: 'rgba(255, 255, 255, 0.1)',
    strokeWidth: 1,
    rx: 12,
    ry: 12,
    originX: 'center',
    originY: 'top',
  } as any));

  // 2. Header: tên (trắng) · công thức (chữ phụ, monospace) · nhãn SMILES 2D (nền accent 15%, chữ trắng)
  if (showHeader) {
    objects.push(new fabric.Rect({
      left: 0, top: 0.5, width: w - 1, height: headerH - 0.5,
      fill: 'rgba(255, 255, 255, 0.04)', strokeWidth: 0, originX: 'center', originY: 'top',
    } as any));
    objects.push(new fabric.Rect({
      left: 0, top: headerH, width: w, height: 1,
      fill: 'rgba(255, 255, 255, 0.08)', strokeWidth: 0, originX: 'center', originY: 'top',
    } as any));

    const badge = new fabric.IText('SMILES 2D', {
      left: halfW - 12 - 6, top: headerH / 2,
      fontSize: 9.5, fontWeight: '700', fill: themeColors.text, charSpacing: 40,
      fontFamily: 'Be Vietnam Pro', originX: 'right', originY: 'center', selectable: false,
    } as any);
    const badgeW = (badge.width || 0) + 12;
    objects.push(new fabric.Rect({
      left: halfW - 12, top: headerH / 2, width: badgeW, height: 16,
      fill: mixColors(accentColor, 15), rx: 4, ry: 4, originX: 'right', originY: 'center',
    } as any));
    objects.push(badge);

    let x = -halfW + 12;
    const maxX = halfW - 12 - badgeW - 6;
    if (data.name) {
      const maxChars = Math.max(4, Math.floor((maxX - x) / 7.2));
      const nameStr = data.name.length > maxChars ? data.name.slice(0, maxChars - 1) + '…' : data.name;
      const nameText = new fabric.IText(nameStr, {
        left: x, top: headerH / 2,
        fontSize: 11.5, fontWeight: '700', fill: themeColors.text,
        fontFamily: 'Be Vietnam Pro', originX: 'left', originY: 'center', selectable: false,
      } as any);
      objects.push(nameText);
      x += (nameText.width || 0) + 6;
    }
    if (data.formula && (data as any).showFormula !== false && x + 40 < maxX) {
      objects.push(new fabric.IText(`(${data.formula})`, {
        left: x, top: headerH / 2,
        fontSize: 10.5, fontWeight: '400', fill: themeColors.textSub,
        fontFamily: 'monospace', originX: 'left', originY: 'center', selectable: false,
      } as any));
    }
  }

  // 3. Cấu trúc phân tử: cùng SVG SmilesDrawer với video (renderMoleculeSvg), dựng thành ảnh một lần rồi cache
  const contentH = Math.max(60, h - headerH - subtextH);
  const molecule = getMoleculePreview(data, w, contentH);
  if (molecule) {
    const img = new fabric.FabricImage(molecule.img, {
      left: 0,
      top: headerH + contentH / 2,
      originX: 'center',
      originY: 'center',
      scaleX: 1 / MOLECULE_PREVIEW_SCALE,
      scaleY: 1 / MOLECULE_PREVIEW_SCALE,
      selectable: false,
      evented: false,
    });
    objects.push(img);
  }

  // Footer: subtext (24px, hairline trên, chữ phụ) như video
  if (subtext) {
    objects.push(new fabric.Rect({
      left: 0, top: h - subtextH, width: w - 24, height: 1,
      fill: 'rgba(255, 255, 255, 0.05)', strokeWidth: 0, originX: 'center', originY: 'top',
    } as any));
    const maxChars = Math.floor((w - 24) / 5.6);
    objects.push(new fabric.IText(subtext.length > maxChars ? subtext.slice(0, maxChars - 1) + '…' : subtext, {
      left: 0,
      top: h - subtextH / 2,
      fontSize: 10,
      fontWeight: '500',
      fill: themeColors.textSub,
      fontFamily: 'Be Vietnam Pro',
      originX: 'center',
      originY: 'center',
      selectable: false,
    } as any));
  }

  return objects;
}
