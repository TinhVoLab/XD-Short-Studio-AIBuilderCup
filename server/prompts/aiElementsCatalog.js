// ── Graphic Elements & Charts Catalog ──────────────────────────────
// File này chịu trách nhiệm xây dựng danh mục hướng dẫn (Prompt Catalog) cho AI Gemini.
// Dữ liệu elements được lấy động từ Registry trung tâm (Single Source of Truth) thay vì hardcode.

import { getCoreCatalog, ELEMENTS_REGISTRY } from '../../src/config/elementsRegistry.js';

// Phiên bản Catalog dùng cho hệ thống Telemetry và Observability
export const CATALOG_VERSION = '2.1.0'; // 2.1: nhịp giữ chân (retention beats) + đường cong energy — đổi minor để xả cache kịch bản cũ

// Re-export để các service khác có thể lấy trực tiếp cấu trúc catalog cốt lõi
export { getCoreCatalog };

/**
 * Tạo chuỗi prompt mô tả toàn bộ Graphic Elements & Charts để gửi cho AI Gemini
 * @param {string} ACCENT - Mã màu chủ đạo của video (ví dụ: '#BEFF01')
 * @param {string} [style] - Phong cách hoặc chủ đề video (ví dụ: 'Tài chính', 'Công nghệ')
 * @param {Array<any>} [customElements=[]] - Danh sách elements tùy chỉnh mở rộng (nếu có)
 * @returns {string} Chuỗi văn bản prompt hoàn chỉnh
 */
export const getGraphicElementsCatalog = (ACCENT, style, customElements = []) => {
  // 1. Lấy dữ liệu danh mục cốt lõi từ Registry trung tâm (Single Source of Truth)
  const CORE_REGISTRY = getCoreCatalog(ACCENT);
  
  // 2. Cơ chế Bảo mật (Merge Security): Element hệ thống luôn được bảo vệ, không thể bị ghi đè trái phép
  const FULL_CATALOG = { ...CORE_REGISTRY, CUSTOM_ELEMENTS: {} };
  
  if (Array.isArray(customElements)) {
    customElements.forEach(customEl => {
      // Chỉ cho phép thêm vào nếu là element mới, không trùng tên với element cốt lõi
      if (customEl.type && !isCoreElement(customEl.type)) {
         FULL_CATALOG.CUSTOM_ELEMENTS[customEl.type] = customEl.description;
      }
    });
  }

  // 3. Ghép nối dữ liệu thành chuỗi văn bản danh mục (Prompt Markdown) gửi cho Gemini
  let catalogText = "Available graphic elements:\n";
  Object.keys(FULL_CATALOG).forEach(group => {
    // Bỏ qua nếu nhóm không có phần tử nào
    if (Object.keys(FULL_CATALOG[group]).length === 0) return;
    catalogText += `\n--- ${group} ---\n`;
    Object.keys(FULL_CATALOG[group]).forEach(type => {
       catalogText += `- '${type}': ${FULL_CATALOG[group][type]}\n`;
    });
  });

  // 4. Định hướng AI (Soft Filter Weighting): Đính kèm quy tắc ưu tiên biểu đồ theo phong cách video
  catalogText += `\n[CRITICAL PRIORITY RULE]:\n${getStylePriorityRule(style)}\n`;

  return catalogText;
};

/**
 * Trả về quy tắc nghiệp vụ (Business Rules) định hướng AI ưu tiên nhóm elements theo phong cách video
 * @param {string} [style=''] - Phong cách/chủ đề video đầu vào
 * @returns {string} Chỉ dẫn ưu tiên cụ thể
 */
export const getStylePriorityRule = (style = '') => {
  const styleLower = style.toLowerCase();

  // Chủ đề: Tài chính, đầu tư, crypto, dòng tiền
  if (styleLower.includes("tài chính") || styleLower.includes("finance")) {
    return "Bạn ĐANG tạo video Tài Chính. BẮT BUỘC ưu tiên sử dụng nhiều elements từ nhóm DATA_CHARTS (như candlestick-chart, racing-bar, heatmap, v.v.).";
  }

  // Chủ đề: Chữa lành, tâm lý, thiền, quote danh ngôn
  if (styleLower.includes("tâm lý") || styleLower.includes("chữa lành") || styleLower.includes("zen")) {
    return "Bạn ĐANG tạo video Chữa Lành/Tâm Lý. BẮT BUỘC ưu tiên nhóm TYPOGRAPHY_BASIC và CINEMA_SOCIAL_PROOF (như quote-box, highlight-box).";
  }

  // Chủ đề: Công nghệ, kỹ thuật, AI, lập trình, lộ trình kiến thức
  if (styleLower.includes("tech") || styleLower.includes("công nghệ") || styleLower.includes("kiến thức")) {
    return "Bạn ĐANG tạo video Công Nghệ/Kiến Thức. BẮT BUỘC ưu tiên nhóm INFOGRAPHICS_FRAMEWORKS và CINEMA_SOCIAL_PROOF (như code-terminal, network-graph, flowchart).";
  }

  // Chủ đề: Hoạt họa, Mascot, Kể chuyện nhân vật
  if (styleLower.includes("hoạt họa") || styleLower.includes("mascot") || styleLower.includes("kể chuyện")) {
    return "Bạn ĐANG tạo video Hoạt Họa / Mascot Story. BẮT BUỘC ưu tiên sử dụng element 'character-mascot' trong hầu hết các cảnh. Phân tích ngữ cảnh cảm xúc để chọn đúng pose ('happy', 'thinking', 'confused', 'skeptical', 'shocked', 'cool', 'idea', 'pointing-up', 'laptop', 'running', 'cheering', 'coffee') kết hợp với speech bubbles ('highlight-box') hoặc badge tiêu đề.";
  }

  // Mặc định cho các phong cách khác
  return "Hãy sử dụng đa dạng các nhóm phù hợp nhất với ngữ cảnh kịch bản để tối đa hóa tính trực quan.";
};

/**
 * Kiểm tra nhanh O(1) xem một element type có thuộc danh mục cốt lõi của hệ thống hay không
 * @param {string} type - Tên định danh của element (ví dụ: 'flowchart', 'rect')
 * @returns {boolean}
 */
const isCoreElement = (type) => {
  return Boolean(ELEMENTS_REGISTRY[type]);
};
