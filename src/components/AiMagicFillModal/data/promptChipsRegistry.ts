/**
 * Prompt Chips Registry for AI Magic Fill Modal
 * Provides context-aware 1-click prompt chips tailored to each element type.
 */

export interface PromptChip {
  id: string;
  label: string;
  prompt: string;
}

export const PROMPT_CHIPS_REGISTRY: Record<string, PromptChip[]> = {
  // ── 1. TÀI CHÍNH & XU HƯỚNG ──────────────────────────────────────────
  'candlestick-chart': [
    { id: 'btc-crash', label: 'Cú sập giá Bitcoin', prompt: 'Bitcoin sập giá từ 68.000$ về 59.500$ kèm khối lượng bán tháo kỷ lục' },
    { id: 'tsla-breakout', label: 'Breakout cổ phiếu', prompt: 'Cổ phiếu Tesla bật tăng mạnh breakout vượt mốc kháng cự 250$' },
    { id: 'sideway-range', label: 'Tích lũy đi ngang', prompt: 'Thị trường biến động sideway trong vùng biên độ hẹp 2.100$ - 2.250$' },
    { id: 'short-squeeze', label: 'Short Squeeze bùng nổ', prompt: 'Cú bật tăng bất ngờ thanh lý phe Short đẩy giá tăng 18%' },
  ],
  'racing-bar-chart': [
    { id: 'top-tech-marketcap', label: 'Vốn hóa Big Tech', prompt: 'Xếp hạng vốn hóa thị trường của Apple, Microsoft, Nvidia, Google và Amazon' },
    { id: 'top-selling-products', label: 'Top 5 SP bán chạy', prompt: 'Doanh số 5 dòng sản phẩm chủ lực dẫn đầu doanh thu quý vừa qua' },
    { id: 'top-tiktok-creators', label: 'Top Kênh TikTok', prompt: 'Tăng trưởng lượng người theo dõi của 5 nhà sáng tạo nội dung hàng đầu' },
  ],
  'waterfall-chart': [
    { id: 'ebitda-waterfall', label: 'Phân tích Lợi nhuận', prompt: 'Cầu nối từ Doanh thu gộp 100 tỷ qua Giá vốn, Chi phí Vận hành, Thuế đến Lợi nhuận ròng' },
    { id: 'cashflow-analysis', label: 'Dòng tiền vào/ra', prompt: 'Biến động số dư tiền mặt đầu kỳ, thu từ khách hàng, đầu tư máy móc và số dư cuối kỳ' },
    { id: 'budget-variance', label: 'Chênh lệch ngân sách', prompt: 'Phân tích sai lệch chi phí marketing, nhân sự và R&D so với kế hoạch ban đầu' },
  ],
  'chart-bar': [
    { id: 'quarterly-revenue', label: 'Doanh thu 4 Quý', prompt: 'So sánh doanh thu thực tế và chỉ tiêu qua 4 quý năm 2024' },
    { id: 'branch-performance', label: 'Hiệu quả 3 chi nhánh', prompt: 'Doanh số chi nhánh Hà Nội, Đà Nẵng và TP. Hồ Chí Minh trong tháng' },
    { id: 'age-demographics', label: 'Độ tuổi khách hàng', prompt: 'Phân bổ khách hàng theo các nhóm tuổi: 18-24, 25-34, 35-44 và trên 45' },
  ],
  'line-chart': [
    { id: 'user-growth-12m', label: 'Tăng trưởng người dùng', prompt: 'Tốc độ tăng trưởng người dùng hàng tháng từ tháng 1 đến tháng 12' },
    { id: 'website-traffic', label: 'Lưu lượng truy cập', prompt: 'Biểu đồ lượng truy cập Website hàng tuần trong chiến dịch Marketing' },
    { id: 'cpa-trend', label: 'Chi phí trên mỗi đơn (CPA)', prompt: 'Xu hướng giảm dần của chi phí quảng cáo CPA sau khi tối ưu hóa' },
  ],
  'radar-chart': [
    { id: 'skill-matrix', label: 'Kỹ năng Fullstack', prompt: 'Đánh giá 6 kỹ năng: Frontend, Backend, DevOps, UI/UX, AI Prompting, System Design' },
    { id: 'competitor-bench', label: 'So sánh Đối thủ', prompt: 'So sánh sản phẩm vs đối thủ trên 5 tiêu chí: Giá cả, Tính năng, Tốc độ, Hỗ trợ, Thiết kế' },
    { id: 'health-metrics', label: 'Chỉ số Sức khỏe', prompt: 'Điểm số thể lực: Giấc ngủ, Sức bền, Tim mạch, Dinh dưỡng, Tinh thần' },
  ],
  'heatmap-matrix': [
    { id: 'weekly-activity', label: 'Thời gian tương tác đỉnh', prompt: 'Mật độ truy cập theo các ngày trong tuần (T2-CN) qua 4 khung giờ vàng' },
    { id: 'sales-matrix', label: 'Ma trận Bán hàng', prompt: 'Doanh số của 4 nhóm sản phẩm tại 5 thị trường trọng điểm' },
  ],
  'sankey-chart': [
    { id: 'lead-to-revenue', label: 'Phân bổ Doanh thu', prompt: 'Dòng tiền từ Doanh thu 100% phân rã về Chi phí sản xuất, Marketing, Lương và Lợi nhuận' },
    { id: 'traffic-funnel-flow', label: 'Dòng chảy Traffic', prompt: 'Lưu lượng từ TikTok, Facebook, Google đổ về Landing Page, Checkout và Thành công' },
  ],

  // ── 2. QUY TRÌNH, PHỄU & LỘ TRÌNH ──────────────────────────────────
  'funnel-flow': [
    { id: 'sales-funnel', label: 'Phễu Bán hàng Chuẩn', prompt: '10.000 Lượt tiếp cận ➔ 1.200 Click xem ➔ 240 Thêm giỏ hàng ➔ 65 Mua hàng' },
    { id: 'hiring-funnel', label: 'Quy trình Tuyển dụng', prompt: '500 CV ứng tuyển ➔ 80 Vòng sơ loại ➔ 25 Phỏng vấn ➔ 5 Gửi Offer ➔ 4 Nhận việc' },
    { id: 'course-funnel', label: 'Chuyển đổi Khóa học', prompt: '5.000 Đăng ký Webinar ➔ 1.800 Tham gia trực tiếp ➔ 350 Đăng ký khóa Pro' },
  ],
  'pyramid-funnel': [
    { id: 'brand-loyalty', label: 'Tháp Khách hàng', prompt: 'Khách vãng lai ➔ Khách mua lần đầu ➔ Khách hàng thân thiết ➔ Đại sứ thương hiệu' },
    { id: 'maslow-needs', label: 'Tháp Nhu cầu Maslow', prompt: '5 tầng nhu cầu: Sinh lý ➔ An toàn ➔ Xã hội ➔ Được tôn trọng ➔ Thể hiện bản thân' },
    { id: 'investment-pyramid', label: 'Tháp Tài sản Đầu tư', prompt: 'Đáy: Quỹ khẩn cấp & Bảo hiểm ➔ Giữa: BĐS & Cổ phiếu ➔ Đỉnh: Crypto mạo hiểm' },
  ],
  'roadmap-flow': [
    { id: 'startup-launch', label: 'Lộ trình Ra mắt Startup', prompt: '4 cột mốc: Q1 Nghiên cứu thị trường ➔ Q2 Bản MVP ➔ Q3 Thử nghiệm Beta ➔ Q4 Mở bán rộng rãi' },
    { id: 'ai-engineer-path', label: 'Lộ trình Học AI 6 Tháng', prompt: 'Tháng 1-2 Python & Toán ➔ Tháng 3 Machine Learning ➔ Tháng 4 Deep Learning ➔ Tháng 5-6 LLM & RAG' },
  ],
  'mindmap-flow': [
    { id: 'content-strategy', label: 'Chiến lược Nội dung', prompt: 'Trung tâm: Kênh TikTok Doanh Nghiệp. 4 Nhánh: Giáo dục kiến thức, Hậu trường thực tế, Case Study, Bắt trend' },
    { id: 'brand-identity', label: 'Bộ Nhận diện Thương hiệu', prompt: 'Trung tâm: Cốt lõi Thương hiệu. 4 Nhánh: Tầm nhìn sứ mệnh, Tông giọng (Voice), Hệ màu sắc, Biểu tượng Logo' },
  ],
  'knowledge-graph': [
    { id: 'kg-menden', label: 'Sinh học: 3 Quy luật Men-đen', prompt: 'Cây tri thức di truyền học: Root Mendel -> 3 Nhánh: Đồng tính, Phân li, Phân li độc lập -> Nhánh lá: Đậu Hà Lan' },
    { id: 'kg-dienbienphu', label: 'Lịch sử: Điện Biên Phủ 1954', prompt: 'Cây tri thức chiến dịch: Root 56 Ngày đêm -> 3 Đợt: Him Lam, Đồi A1, Toàn thắng -> Nhánh lá: Bộc phá 1 tấn' },
    { id: 'kg-habits', label: 'Atomic Habits 4 Luật', prompt: 'Cây tư duy thói quen: Root Atomic Habits -> 4 Nhánh: Rõ ràng, Hấp dẫn, Dễ dàng, Thỏa mãn' },
  ],
  'tree-diagram': [
    { id: 'org-chart', label: 'Sơ đồ Tổ chức', prompt: 'CEO ➔ 3 Khối: Giám đốc Công nghệ (CTO), Giám đốc Kinh doanh (CMO), Giám đốc Vận hành (COO)' },
    { id: 'tech-stack', label: 'Kiến trúc Tech Stack', prompt: 'Nền tảng Cloud ➔ Backend microservices & Cơ sở dữ liệu ➔ Ứng dụng Web & Mobile' },
  ],
  'checklist': [
    { id: 'video-publish-check', label: 'Checklist Đăng Video TikTok', prompt: '5 bước: Tiêu đề hook 3s đầu, Phụ đề rõ nét, Nhạc nền xu hướng, Khung giờ vàng 19h, Đặt 3 hashtag chuẩn' },
    { id: 'product-launch-check', label: 'Checklist Ra mắt Sản phẩm', prompt: 'Kiểm thử tính năng thanh toán, Chuẩn bị bài PR báo chí, Thiết lập kịch bản CSKH, Đo lường phễu' },
  ],

  // ── 3. MODULE KHOA HỌC STEM ──────────────────────────────────────────
  'math-plot': [
    { id: 'damped-wave', label: 'Sóng Dao Động Tắt Dần', prompt: 'Đồ thị dao động tắt dần của con lắc y = exp(-0.3*x) * cos(3*x - t) biểu diễn vật lý' },
    { id: 'sigmoid-ai', label: 'Hàm Kích Hoạt Sigmoid AI', prompt: 'Đồ thị hàm sigmoid y = 1 / (1 + exp(-x)) dùng trong mạng nơ-ron nhân tạo Machine Learning' },
    { id: 'cubic-inflection', label: 'Hàm Bậc Ba & Điểm Uốn', prompt: 'Hàm số bậc ba y = x^3 - 3x biểu diễn 2 điểm cực trị và điểm uốn đối xứng' },
    { id: 'heart-math', label: 'Đường cong Trái tim (Heart)', prompt: 'Đồ thị toán học hình trái tim lãng mạn y = x^(2/3) + 0.9 * sqrt(3.3 - x^2) * sin(t * 3)' },
  ],
  'chemical-molecule': [
    { id: 'chem-oxytocin', label: 'Oxytocin (Hormone Tình Yêu)', prompt: 'Tạo cấu trúc phân tử hormone gắn kết tình cảm Oxytocin' },
    { id: 'chem-adrenaline', label: 'Adrenaline (Bản năng Sinh tồn)', prompt: 'Tạo cấu trúc phân tử chất dẫn truyền thần kinh Adrenaline kích thích nhịp tim' },
    { id: 'chem-melatonin', label: 'Melatonin (Hormone Giấc Ngủ)', prompt: 'Tạo cấu trúc phân tử Melatonin điều hòa nhịp sinh học và giấc ngủ' },
    { id: 'chem-ibuprofen', label: 'Ibuprofen (Thuốc Giảm Đau)', prompt: 'Tạo cấu trúc phân tử thuốc giảm đau hạ sốt kháng viêm Ibuprofen' },
    { id: 'chem-creatine', label: 'Creatine (Tăng cơ Thể hình)', prompt: 'Tạo cấu trúc phân tử hợp chất Creatine tăng cường sức mạnh cơ bắp' },
  ],
  'latex-formula': [
    { id: 'latex-maxwell', label: 'Hệ Phương Trình Maxwell', prompt: 'Phương trình sóng điện từ trường Maxwell mô tả bản chất của ánh sáng' },
    { id: 'latex-black-scholes', label: 'Mô Hình Black-Scholes', prompt: 'Công thức định giá quyền chọn chứng khoán tài chính Black-Scholes' },
    { id: 'latex-bayes', label: 'Định Lý Xác Suất Bayes', prompt: 'Công thức xác suất có điều kiện Bayes ứng dụng trong Trí tuệ nhân tạo Machine Learning' },
    { id: 'latex-cross-entropy', label: 'Hàm Mất Mát Cross-Entropy', prompt: 'Hàm loss cross-entropy tối ưu hóa mô hình phân loại Deep Learning' },
  ],
  'interactive-quiz': [
    { id: 'quiz-science', label: 'Đố Vui Khoa Học 5s', prompt: 'Tạo một câu hỏi trắc nghiệm khoa học tự nhiên thú vị với 4 phương án A, B, C, D và lời giải thích ngắn gọn' },
    { id: 'quiz-english', label: 'Từ Vựng Tiếng Anh (IELTS)', prompt: 'Tạo câu hỏi trắc nghiệm chọn từ đồng nghĩa hoặc điền từ tiếng Anh trình độ THPT / IELTS có giải thích' },
    { id: 'quiz-history', label: 'Lịch Sử Việt Nam', prompt: 'Tạo một câu hỏi trắc nghiệm về một sự kiện lịch sử hào hùng của Việt Nam với đáp án chính xác' },
    { id: 'quiz-logic', label: 'Câu Đố Mẹo & Logic', prompt: 'Tạo câu đố mẹo logic thú vị kích thích người xem comment tranh luận đáp án' },
    { id: 'quiz-math', label: 'Toán Học Nhanh', prompt: 'Tạo một bài toán mẹo tính nhanh trong 5 giây cho học sinh' },
  ],
  'vocab-card': [
    { id: 'vocab-ielts', label: 'IELTS 7.5+ Crucial', prompt: 'Tạo thẻ từ vựng học thuật C1/IELTS 7.5+ đắt giá kèm phiên âm IPA, giải nghĩa tiếng Việt, câu ví dụ có highlight và 3 từ đồng nghĩa' },
    { id: 'vocab-phrasal', label: 'Phrasal Verb Giao Tiếp', prompt: 'Tạo cụm động từ tiếng Anh giao tiếp tự nhiên trình độ B2 kèm ngữ cảnh sử dụng thực tế và câu ví dụ' },
    { id: 'vocab-business', label: 'Kinh Doanh & Đàm Phán', prompt: 'Tạo từ vựng chuyên ngành kinh tế, tài chính hoặc đàm phán thương mại quốc tế' },
    { id: 'vocab-hsk', label: 'Tiếng Trung HSK 4-5', prompt: 'Tạo thẻ từ vựng tiếng Trung HSK 4 có chữ Hán, Pinyin, nghĩa tiếng Việt và câu ví dụ truyền cảm hứng' },
    { id: 'vocab-idiom', label: 'Thành Ngữ (Idiom)', prompt: 'Tạo thành ngữ tiếng Anh tự nhiên, thú vị và phổ biến trong đời sống bản xứ' },
  ],
};

/**
 * Helper to retrieve prompt chips for an element type with default fallback
 */
export function getPromptChipsForElement(elementType: string): PromptChip[] {
  if (PROMPT_CHIPS_REGISTRY[elementType]) {
    return PROMPT_CHIPS_REGISTRY[elementType];
  }

  // Generic fallback chips
  return [
    { id: 'gen-trend', label: 'Tăng trưởng tích cực', prompt: 'Sinh số liệu thể hiện xu hướng tăng trưởng vượt bậc qua các giai đoạn' },
    { id: 'gen-comparison', label: 'So sánh đối lập', prompt: 'So sánh sự khác biệt rõ rệt giữa hai phương án hoặc hai thời điểm' },
    { id: 'gen-breakdown', label: 'Phân bổ chi tiết', prompt: 'Phân tích các thành phần cấu thành nên tổng thể một cách hợp lý' },
  ];
}
