/**
 * Dữ liệu mẫu mặc định của widget khi element không có dữ liệu — SSOT dùng chung cho component Remotion
 * và công thức chiều cao (layoutRegistry), để H = f(X) đo đúng thứ đang hiển thị.
 */
export const DEFAULT_CHECKLIST_ITEMS = [
  { text: 'Xác thực 2 lớp (2FA)', subtext: 'Bảo vệ tài khoản tối đa', status: 'checked' },
  { text: 'Không click vào đường link lạ', subtext: 'Tránh mã độc & lừa đảo phishing', status: 'checked' },
  { text: 'Dùng mật khẩu đơn giản', subtext: 'Rủi ro bị tấn công brute-force', status: 'cross' },
];

export const DEFAULT_TERMINAL_CODE = `function executeWorkflow() {\n  const status = 'OPTIMIZED';\n  return { success: true, status };\n}\n\nconsole.log(executeWorkflow());`;

export const DEFAULT_VS_ROUNDS = [
  { criterion: 'Tiêu chí 01', winner: 'left', leftValue: 'Ưu thế A', rightValue: 'Hạn chế B' },
  { criterion: 'Tiêu chí 02', winner: 'right', leftValue: 'Hạn chế A', rightValue: 'Ưu thế B' },
];

export const DEFAULT_VS_SUBJECTS = {
  left: { name: 'LỰA CHỌN A', icon: 'check', color: 'var(--accent, #BEFF01)' },
  right: { name: 'LỰA CHỌN B', icon: 'sparkle', color: 'var(--chart-series-1, #00D4FF)' },
};

export const DEFAULT_NUMBERED_ITEMS = ['Bước 1', 'Bước 2', 'Bước 3'];

/** Sankey: dữ liệu mẫu (tiêu đề mặc định lấy el.content nếu có — xem SankeyChartElement) */
export const DEFAULT_SANKEY_DATA = {
  title: 'PHÂN RÃ DÒNG TIỀN',
  source: '100 Triệu',
  sourceValue: 'DOANH THU',
  flows: [
    { label: 'Chi phí Vận hành', value: '45 Tr', percent: 45 },
    { label: 'Chi phí Marketing', value: '25 Tr', percent: 25 },
    { label: 'Lợi nhuận Ròng', value: '30 Tr', percent: 30 },
  ],
};

/** Tree diagram: dữ liệu mẫu; tiêu đề header luôn hiển thị (fallback khi trống) */
export const DEFAULT_TREE_TITLE = 'SƠ ĐỒ CÂY PHÂN CẤP';
export const DEFAULT_TREE_DATA = {
  title: 'LỘ TRÌNH PHÁT TRIỂN / TECH STACK',
  rootNode: { label: 'AI SYSTEM', icon: 'bot' },
  branches: [
    { group: 'Frontend', items: ['React', 'Remotion'] },
    { group: 'Backend', items: ['Node.js', 'Express'] },
    { group: 'AI Core', items: ['Gemini', 'Agents'] },
  ],
};

/** Sơ đồ mẫu của dynamic-diagram (cấu trúc + nhãn; màu node do renderer gán theo theme) */
export const DEFAULT_DIAGRAM_DATA = {
  title: 'QUY TRÌNH HỆ THỐNG',
  nodes: [
    { id: 'start', label: 'Bắt đầu', shape: 'pill' },
    { id: 'decision', label: 'Kiểm tra', shape: 'diamond' },
    { id: 'process', label: 'Xử lý', shape: 'rect' },
    { id: 'end', label: 'Hoàn tất', shape: 'pill' },
  ],
  edges: [
    { from: 'start', to: 'decision', label: 'Khởi chạy' },
    { from: 'decision', to: 'process', label: 'Hợp lệ' },
    { from: 'process', to: 'end', label: 'Xong' },
    { from: 'decision', to: 'start', label: 'Thử lại' },
  ],
};
