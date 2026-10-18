/**
 * Cổng kiểm tra chung cho thành phần STEM do AI tạo (đồ thị, phân tử, công thức).
 * Không đạt → nơi gọi thay bằng thẻ chữ (sceneSlotHydrator) hoặc báo lỗi để người dùng tạo lại (Magic Fill).
 */
import { validatePlotData } from './mathExpr.js';
import { validateLatex } from './latex.js';

/**
 * Phân tử chỉ hợp lệ khi SMILES + công thức đến từ PubChem (server điền kèm pubchemCid).
 * @param {Record<string, any> | undefined} data chemData
 */
export function validateChemData(data) {
  const errors = [];
  if (!data || typeof data !== 'object') return { ok: false, errors: ['Thiếu dữ liệu phân tử'], warnings: [] };
  if (!String(data.smiles || '').trim()) errors.push('Không tìm thấy chất trên PubChem');
  else if (!Number.isInteger(data.pubchemCid)) errors.push('Cấu trúc phân tử chưa được xác minh trên PubChem');
  if (!String(data.formula || '').trim()) errors.push('Thiếu công thức phân tử');
  return { ok: errors.length === 0, errors, warnings: [] };
}

/**
 * @param {{ type?: string, mathData?: any, chemData?: any }} el
 * @returns {{ ok: boolean, errors: string[], warnings: string[] }}
 */
export function validateStemElement(el) {
  switch (el?.type) {
    case 'math-plot': {
      const result = validatePlotData(el.mathData);
      // Nhãn công thức sai không chặn đồ thị: video ẩn nhãn (renderLatexHtml → null)
      const label = el.mathData?.latexLabel;
      if (label && !validateLatex(label).ok) result.warnings.push('latexLabel: LaTeX không hợp lệ, nhãn sẽ bị ẩn');
      return result;
    }
    case 'latex-formula': {
      const { ok, error } = validateLatex(el.latexData?.latex);
      return { ok, errors: ok ? [] : [error], warnings: [] };
    }
    case 'chemical-molecule':
      return validateChemData(el.chemData);
    default:
      return { ok: true, errors: [], warnings: [] };
  }
}

/**
 * Câu ngắn cho thẻ dự phòng: câu đầu của lời thoại, tối đa ~14 từ.
 * @param {string} voiceText
 * @returns {string}
 */
export function fallbackCalloutText(voiceText) {
  const first = String(voiceText || '').split(/(?<=[.!?…])\s+/)[0].trim();
  const words = first.split(/\s+/).filter(Boolean);
  return words.length > 14 ? `${words.slice(0, 14).join(' ')}…` : first;
}
