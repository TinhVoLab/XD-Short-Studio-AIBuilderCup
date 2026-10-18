/**
 * Ca kiểm tra chiều cao cho từng widget. Mỗi widget: ca mặc định ({ id: 'default' }) + biến thể dữ liệu.
 * Bổ sung ca mới khi sửa widget hoặc khi AI sinh dạng dữ liệu mới.
 * (text không có ở đây: chiều cao chữ do Fabric Textbox tự đo, không qua công thức.)
 */
const TYPES = ['badge', 'branching-flow', 'chart-bar', 'checklist', 'circle-chart', 'code-terminal', 'dynamic-diagram',
  'flowchart', 'gauge-chart', 'heatmap-matrix', 'hologram-bar', 'knowledge-graph', 'master-hook', 'network-graph',
  'numbered-list', 'pie-chart', 'pyramid-funnel', 'quote-box', 'ranking-list', 'roadmap-flow', 'sankey-chart', 'table',
  'timeline', 'tree-diagram', 'visual-paradox', 'vs-battle',
  'math-plot', 'latex-formula', 'interactive-quiz', 'vocab-card', 'chemical-molecule', 'master-scene'];

/** Một ca cho mỗi mẫu cảnh Master (config/sceneRecipes.js) — chuỗi đợt 1 */
const MASTER_SCENE_SAMPLES = {
  'hook.number': { so: '3', dieu: 'thói quen buổi sáng', ket_qua: 'mất tập trung' },
  'bridge.roadmap_three': { n: 3, nhan_manh: 'quan trọng nhất' },
  'content.key_point': { y: 'Dậy cùng một giờ, kể cả cuối tuần', ly_do: 'Đồng hồ sinh học quen nhịp, bạn dậy dễ hơn mà không cần báo thức.' },
  'retention.wait': { ly_do: 'nhiều người bỏ lỡ nhất.' },
  'climax.summary': { tieu_de: '5 thói quen buổi sáng', muc: ['Dậy cùng một giờ', 'Điện thoại ngoài phòng ngủ', 'Một cốc nước', '10 phút vận động', 'Chuẩn bị từ tối hôm trước'] },
  'cta.save': { thoi_diem: 'sáng mai', ly_do: 'Bạn sẽ cần nó lúc 6 giờ.' },
  'hook.question': { cau_hoi: 'Vì sao dậy sớm lại khiến bạn', nhan_manh: 'mệt hơn?' },
  'hook.myth': { nghi: 'Tiết kiệm là cắt giảm mọi thứ', thuc_te: 'Tiết kiệm là chi đúng chỗ' },
  'bridge.steps': { tieu_de: 'Chỉ cần 3 bước, mỗi bước dưới 5 phút', buoc: ['Chuẩn bị', 'Bắt đầu', 'Duy trì'] },
  'bridge.problem': { van_de: 'Hầu hết chúng ta mở mắt là cầm điện thoại.', he_qua: 'Não bị kéo vào chế độ phản ứng cả ngày.', nhan_manh: 'chế độ phản ứng' },
  'content.do_dont': { khong_nen: 'Mở email ngay khi vừa thức dậy', nen: 'Làm việc khó nhất trước khi mở email' },
  'content.cause_chain': { chuoi: ['Ngủ đủ giấc', 'Dậy tỉnh táo', 'Tập trung cả buổi sáng'] },
  'retention.halfway': { cau: 'Mới một nửa. Phần còn lại còn hay hơn.', nhan_manh: 'Phần còn lại' },
  'retention.guess': { cau_hoi: 'Nên làm gì trong 30 phút đầu sau khi thức dậy?', lua_chon: ['Xem tin', 'Uống nước', 'Ngủ tiếp'] },
  'climax.answer': { cau_hoi: 'Nên làm gì trong 30 phút đầu sau khi thức dậy?', lua_chon: ['Xem tin', 'Uống nước', 'Ngủ tiếp'], dung: 2, ket_qua: 'Một cốc nước giúp cơ thể tỉnh táo nhanh hơn.', nhan_manh: 'tỉnh táo nhanh hơn' },
  'climax.key_line': { cau: 'Giờ dậy đều đặn quan trọng hơn giờ dậy sớm.', nhan_manh: 'đều đặn' },
  'cta.share': { nguoi: 'người bạn hay dậy muộn nhất', loi_ich: 'Họ sẽ cảm ơn bạn vào sáng mai.' },
  'cta.pick_number': { cau: 'Bạn sẽ bắt đầu với thói quen số mấy?', n: 5 },
};

/** Nội dung mẫu cho từng layout master-hook (đủ dữ liệu layout cần: số, hai vế, dòng 2) */
const HOOK_LAYOUT_SAMPLES = {
  'sticker-words': { archetype: 'tips', heroTitle: 'Mẹo ngủ ngon tức thì' },
  'stacked': { archetype: 'curiosity', heroTitle: 'Sự thật về lãi kép' },
  'hazard-alert': { archetype: 'warning', heroTitle: 'Dừng làm điều này ngay' },
  'cyber-hud': { archetype: 'secret', heroTitle: 'AI viết code thay bạn' },
  'split-versus': { archetype: 'versus', heroTitle: 'Thuê nhà hay mua nhà', versusLeft: 'Thuê nhà', versusRight: 'Mua nhà' },
  'luxury-zen': { archetype: 'healing', heroTitle: 'Chậm lại một chút' },
  'kinetic-giant-stat': { archetype: 'tips', heroTitle: 'Người mới thua lỗ', statValue: '90%', statLabel: 'người mới thua lỗ' },
  'kinetic-bold-script': { archetype: 'tips', heroTitle: 'Bí quyết giữ chân', scriptWords: ['giữ'] },
  'kinetic-contrast': { archetype: 'tips', heroTitle: 'Tăng hiệu suất gấp đôi' },
  'kinetic-solid-box': { archetype: 'tips', heroTitle: 'Ngừng trì hoãn ngay' },
  'kinetic-strip-highlight': { archetype: 'curiosity', heroTitle: 'Điều không ai nói', heroLine2: 'về tiền' },
  'kinetic-word-weight': { archetype: 'curiosity', heroTitle: 'Vì sao bạn luôn mệt?' },
  'cinematic-lower-third': { archetype: 'curiosity', heroTitle: 'Câu chuyện chưa kể' },
  'cta-social': { archetype: 'custom', heroTitle: 'Theo dõi để xem phần 2' },
  'cta-pill': { archetype: 'custom', heroTitle: 'Link ở bio' },
  'cta-comment': { archetype: 'custom', heroTitle: 'Bình luận ý kiến của bạn' },
  'cta-bookmark': { archetype: 'custom', heroTitle: 'Lưu lại để xem sau' },
};

/** Tiêu đề dài cho từng layout chính (layout giới hạn số từ: 6–7 từ) — kiểm tra fitHeroFontSize + xuống dòng */
const HOOK_LONG_SAMPLES = {
  'sticker-words': { archetype: 'tips', heroTitle: 'Ba thói quen sáng giúp tập trung hơn' },
  'stacked': { archetype: 'curiosity', heroTitle: 'Vì sao người trẻ chăm chỉ vẫn không thể giàu lên', highlightStyle: 'solid-box' },
  'hazard-alert': { archetype: 'warning', heroTitle: 'Đừng bao giờ ký hợp đồng khi chưa đọc điều khoản này' },
  'cyber-hud': { archetype: 'secret', heroTitle: 'Công cụ AI miễn phí giúp bạn viết code nhanh gấp mười lần' },
  'split-versus': { archetype: 'versus', heroTitle: 'Nên chọn cách nào để tiền sinh lời tốt nhất', versusLeft: 'Gửi tiết kiệm ngân hàng', versusRight: 'Đầu tư chứng khoán lâu dài' },
  'luxury-zen': { archetype: 'healing', heroTitle: 'Hãy để tâm trí được nghỉ ngơi sau một ngày dài' },
  'kinetic-giant-stat': { archetype: 'tips', heroTitle: 'người lao động trẻ cảm thấy kiệt sức mỗi tuần', statValue: '73%' },
  'kinetic-bold-script': { archetype: 'tips', heroTitle: 'Bí quyết giữ chân khách hàng quay lại', scriptWords: ['khách'], highlightStyle: 'underline-thick' },
  'kinetic-contrast': { archetype: 'tips', heroTitle: 'Cách tăng hiệu suất làm việc gấp đôi', highlightStyle: 'outline-box' },
  'kinetic-solid-box': { archetype: 'tips', heroTitle: 'Tiết kiệm ngay 30% chi phí mỗi tháng', highlightWords: ['30%'] },
  'kinetic-strip-highlight': { archetype: 'curiosity', heroTitle: 'Điều mà ngân hàng không bao giờ nói', heroLine2: 'với bạn' },
  'kinetic-word-weight': { archetype: 'secret', heroTitle: 'Tại sao bạn luôn cảm thấy mệt mỏi' },
  'cinematic-lower-third': { archetype: 'curiosity', heroTitle: 'Câu chuyện chưa từng được kể về người sáng lập Apple' },
  'cta-social': { archetype: 'custom', heroTitle: 'Theo dõi kênh để không bỏ lỡ phần tiếp theo của series' },
};

const LONG = 'Tự động hoá quy trình kiểm duyệt nội dung bằng AI giúp đội ngũ tiết kiệm 40% thời gian mỗi tuần';

/** Biến thể dữ liệu theo widget (ngoài ca mặc định) */
const VARIANTS = {
  checklist: [
    { id: '5-items-long', checklistItems: [
      { text: LONG, subtext: 'Áp dụng cho mọi kênh phân phối', status: 'checked' },
      { text: 'Rà soát hợp đồng', status: 'checked' },
      { text: 'Bỏ qua sao lưu dữ liệu định kỳ hằng tuần', subtext: LONG, status: 'cross' },
      { text: 'Đo lường', status: 'checked' },
      { text: 'Báo cáo quý', subtext: 'Gửi trước ngày 5', status: 'checked' },
    ] },
    { id: 'frameless-no-footer', showCardBg: false, checklistData: { title: '', showFooter: false } },
    { id: 'cyber-wide', width: 420, checklistData: { style: 'cyber', title: 'Checklist bảo mật' } },
  ],
  flowchart: [
    { id: '5-steps', flowSteps: [
      { title: 'Thu thập', subtitle: 'Dữ liệu thô' }, { title: 'Làm sạch' }, { title: 'Phân tích', subtitle: 'Mô hình' },
      { title: 'Trực quan' }, { title: 'Ra quyết định', subtitle: 'Hành động' },
    ] },
    { id: '2-steps', flowSteps: [{ title: 'Bắt đầu' }, { title: 'Kết thúc' }] },
  ],
  'code-terminal': [
    { id: 'long-lines', content: 'const result = await fetchAnalyticsReport({ range: "last_30_days", metrics: ["views", "retention"] });\nconsole.log(result.summary.totalViewsAcrossAllPlatformsCombined);' },
    { id: 'many-lines', codeData: { filename: 'app.py', language: 'Python', code: Array.from({ length: 14 }, (_, i) => `step_${i} = run(${i})`).join('\n') } },
    { id: 'narrow', width: 240 },
  ],
  'vs-battle': [
    { id: '4-rounds-long', vsBattle: {
      leftSubject: { name: 'Quỹ chỉ số', icon: 'chart' }, rightSubject: { name: 'Cổ phiếu riêng lẻ', icon: 'target' },
      rounds: [
        { criterion: 'Chi phí quản lý hằng năm', winner: 'left', leftValue: 'Thấp 0.1%', rightValue: 'Phí giao dịch cao' },
        { criterion: 'Rủi ro', winner: 'left', leftValue: 'Phân tán', rightValue: 'Tập trung' },
        { criterion: 'Tiềm năng lợi nhuận đột biến', winner: 'right', leftValue: 'Trung bình thị trường', rightValue: 'Có thể x10' },
        { criterion: 'Thời gian', winner: 'left', leftValue: 'Thụ động', rightValue: 'Theo dõi liên tục mỗi ngày' },
      ] } },
    { id: 'no-winner-frameless', showCardBg: false, vsBattle: { showWinner: false } },
  ],
  'master-scene': [
    ...Object.entries(MASTER_SCENE_SAMPLES).map(([templateId, slots]) => ({
      id: templateId,
      masterSceneData: { templateId, slots, ...(templateId.startsWith('content.') || templateId === 'retention.halfway' ? { position: { index: 2, total: 5, label: 'Thói quen' } } : {}) },
    })),
  // Ca khó: 5 bước (nhãn không chồng nhau), lựa chọn dài (chữ xuống dòng, không thu quá nhỏ)
  { id: 'bridge.steps-5', masterSceneData: { templateId: 'bridge.steps', slots: { tieu_de: 'Năm bước cho một buổi sáng gọn', buoc: ['Ánh sáng', 'Nhiệt độ', 'Giờ ngủ', 'Thức dậy', 'Vận động nhẹ'] } } },
  { id: 'retention.guess-long', masterSceneData: { templateId: 'retention.guess', slots: { cau_hoi: 'Thứ gì khiến bạn khó ngủ nhất?', lua_chon: ['Ăn tối muộn', 'Điện thoại', 'Tắm nước nóng', 'Cà phê'] } } },
  ],
  'master-hook': [
    { id: 'tips-hookdata', hookData: { archetype: 'tips' } },
    { id: 'curiosity-stacked', hookData: { archetype: 'curiosity', heroTitle: 'Vì sao 90% nhà đầu tư mới thua lỗ ngay năm đầu tiên' } },
    { id: 'stacked-neon-nosub', hookData: { archetype: 'custom', boxVariant: 'neon-border', subText: '' } },
    // Một ca cho mỗi layout (dữ liệu như hookDesigner sinh ra) — layout · contrast đều phủ đủ
    ...Object.entries(HOOK_LAYOUT_SAMPLES).map(([layoutStyle, hook]) => ({
      id: `layout-${layoutStyle}`,
      hookData: { subText: 'Xem hết để không phải hối hận', badgeText: 'Bạn có biết', highlightWords: [hook.heroTitle.split(' ')[0]], ...hook, layoutStyle },
    })),
    ...Object.entries(HOOK_LONG_SAMPLES).map(([layoutStyle, hook]) => ({
      id: `long-${layoutStyle}`,
      hookData: { subText: 'Xem hết video để biết cách áp dụng ngay hôm nay', badgeText: 'Ít ai nói', highlightWords: [hook.heroTitle.split(' ')[1]], ...hook, layoutStyle },
    })),
    { id: 'stacked-narrow-long', width: 240, hookData: { archetype: 'curiosity', layoutStyle: 'stacked', heroTitle: 'Sai lầm tài chính phổ biến nhất của người mới đi làm', subText: '' } },
  ],
  'sankey-chart': [
    { id: '5-flows-long', sankeyData: { title: LONG, source: '2,4 Tỷ', sourceValue: 'TỔNG NGÂN SÁCH', flows: [
      { label: 'Nhân sự và vận hành văn phòng', value: '900 Tr', percent: 38 }, { label: 'Marketing', value: '500 Tr', percent: 21 },
      { label: 'R&D', value: '400 Tr', percent: 17 }, { label: 'Dự phòng', value: '300 Tr', percent: 12 },
      { label: 'Lợi nhuận', value: '300 Tr', percent: 12 },
    ] } },
    { id: 'compact-2-notitle', variant: 'compact', sankeyData: { title: '', source: '10 Tr', sourceValue: 'VỐN', flows: [
      { label: 'Tiết kiệm', value: '6 Tr', percent: 60 }, { label: 'Chi tiêu', value: '4 Tr', percent: 40 },
    ] } },
    { id: 'frameless-1-flow', showCardBg: false, sankeyData: { title: 'Dòng tiền', source: '5 Tr', sourceValue: 'THU', flows: [
      { label: 'Toàn bộ', value: '5 Tr', percent: 100 },
    ] } },
  ],
  'tree-diagram': [
    { id: '5-branches-many-items', treeData: { title: 'Hệ sinh thái sản phẩm', rootNode: { label: 'NỀN TẢNG', icon: 'globe' }, branches: [
      { group: 'Thu hút khách hàng', items: ['SEO', 'Quảng cáo', 'Mạng xã hội', 'Email', 'Đối tác liên kết'] },
      { group: 'Chuyển đổi', items: ['Landing page', 'A/B test'] },
      { group: 'Giữ chân', items: ['CRM', 'Loyalty', 'Chăm sóc khách hàng sau bán', 'Cộng đồng'] },
      { group: 'Đo lường', items: ['GA4'] },
      { group: 'Không có mục', items: [] },
    ] } },
    { id: '1-branch-notitle-narrow', width: 240, treeData: { rootNode: { label: 'GỐC' }, branches: [
      { group: 'Nhánh duy nhất có tên khá dài', items: ['Một', 'Hai', 'Ba', 'Bốn'] },
    ] } },
  ],
  'roadmap-flow': [
    { id: '6-milestones-linear', roadmapFlowData: { title: 'Lộ trình 6 tháng', layoutStyle: 'linear-left', milestones:
      [1, 2, 3, 4, 5, 6].map(i => ({ id: `m${i}`, stage: `Tháng ${i}`, title: `Mốc ${i}`, icon: i % 2 ? 'cloud' : 'compass', status: i < 3 ? 'completed' : i === 3 ? 'active' : 'locked' })) } },
    { id: 'custom-height-notitle', height: 220, roadmapFlowData: { milestones: [
      { id: 'a', stage: 'BƯỚC 1', title: 'Bắt đầu', icon: 'award' }, { id: 'b', stage: 'BƯỚC 2', title: 'Kết thúc', icon: 'rocket-launch' },
    ] } },
  ],
  'numbered-list': [
    { id: 'long-items', items: [LONG, 'Ngắn gọn', 'Theo dõi chỉ số tăng trưởng hằng tuần và điều chỉnh chiến lược kịp thời'] },
    { id: 'big-font-narrow', width: 240, fontSize: 18, items: ['Một', 'Hai bước đơn giản để bắt đầu', 'Ba'] },
  ],
  'dynamic-diagram': [
    { id: 'branching-6', diagramData: { title: 'Xử lý đơn hàng', nodes: [
      { id: 'a', label: 'Nhận đơn', shape: 'pill' }, { id: 'b', label: 'Còn hàng trong kho?', shape: 'diamond' },
      { id: 'c', label: 'Đóng gói và giao cho đơn vị vận chuyển', shape: 'rect' }, { id: 'd', label: 'Đặt hàng nhà cung cấp', shape: 'rect' },
      { id: 'e', label: 'Thông báo khách', shape: 'rect' }, { id: 'f', label: 'Hoàn tất', shape: 'pill' },
    ], edges: [{ from: 'a', to: 'b' }, { from: 'b', to: 'c', label: 'Có' }, { from: 'b', to: 'd', label: 'Không' }, { from: 'd', to: 'e' }, { from: 'c', to: 'f' }, { from: 'e', to: 'f' }] } },
    { id: 'no-title-2', showTitle: false, diagramData: { title: '', nodes: [{ id: 'x', label: 'Ý tưởng', shape: 'pill' }, { id: 'y', label: 'Sản phẩm', shape: 'rect' }], edges: [{ from: 'x', to: 'y' }] } },
  ],
  'pyramid-funnel': [
    { id: '5-layers', pyramidLayers: [1, 2, 3, 4, 5].map(i => ({ label: `Tầng ${i}`, sub: 'Mô tả ngắn' })) },
  ],
};

export const WIDGET_CASES = Object.fromEntries(TYPES.map(t => [t, [{ id: 'default' }, ...(VARIANTS[t] || [])]]));
