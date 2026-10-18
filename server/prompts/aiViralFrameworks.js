// ── Viral Video Frameworks & Anti-Hallucination Grounding ──────────

export const getFrameworkInstruction = (viralFramework) => {
  if (viralFramework === 'edu-concept') {
    return `VIRAL FRAMEWORK: GIÁO DỤC - BÀI GIẢNG KHÁI NIỆM 60S (Sư phạm chuẩn)
- Scene 1 (hook): Đặt ra 1 tình huống/nghịch lý thực tế kích thích học sinh tò mò (cấm chào hỏi). Dùng 'badge' và 'highlight-box' (variant:"glow-pill", boxIcon:"sparkle").
- Scene 2 (definition): Định nghĩa cốt lõi ngắn gọn dưới 30 từ, nêu bản chất quan trọng nhất (dùng 'highlight-box' với variant:"callout-card", boxIcon:"tip").
- Scenes 3..n-1 (examples): 2-3 ví dụ thực tiễn đời sống dễ hình dung (bắt buộc dùng 'checklist' hoặc 'numbered-list').
- Scene n (cta): 1 câu hỏi tương tác nhanh để học sinh comment đáp án + kêu gọi lưu video ôn thi (dùng 'highlight-box' variant:"glow-pill", boxIcon:"cta").`;
  }
  if (viralFramework === 'edu-quiz') {
    return `VIRAL FRAMEWORK: GIÁO DỤC - ĐỐ VUI TRẮC NGHIỆM 60S (Tương tác cao)
- Scene 1 (hook): Nêu câu hỏi hóc búa, đánh vào tâm lý "Chỉ 10% trả lời đúng" (dùng 'highlight-box' variant:"glow-pill").
- Scene 2 (quiz): Hiển thị câu hỏi cùng 3 đáp án A, B, C rõ ràng (BẮT BUỘC dùng type:'quiz-card' với question, options array, và correctIndex).
- Scene 3 (countdown): Đếm ngược hồi hộp 3 giây (dùng type:'stat-big' value:"3.. 2.. 1").
- Scene n (result): Công bố đáp án chính xác và giải thích ngắn gọn 1-2 câu tại sao đúng (dùng 'highlight-box' variant:"callout-card", boxIcon:"tip").`;
  }
  if (viralFramework === 'edu-mistakes') {
    return `VIRAL FRAMEWORK: GIÁO DỤC - TOP LỖI SAI HAY MẮC (Chống mất điểm)
- Scene 1 (hook): Cảnh báo khẩn cấp các lỗi sai khiến học sinh mất điểm oan uổng (dùng type:'badge' đỏ và 'highlight-box' variant:"glow-pill").
- Scenes 2..n-1 (mistakes): Từng lỗi sai cụ thể kèm theo CÁCH SỬA NGAY LẬP TỨC (dùng 'highlight-box' variant:"callout-card", boxIcon:"alert" hoặc 'checklist').
- Scene n (cta): Lời khuyên đạt điểm cao và nhắc nhở lưu lại ôn tập trước ngày thi (dùng 'highlight-box' variant:"glow-pill", boxIcon:"cta").`;
  }
  if (viralFramework === 'personal-expert') {
    return `VIRAL FRAMEWORK: THƯƠNG HIỆU CÁ NHÂN - GÓC NHÌN CHUYÊN GIA (Uy tín & Thẩm quyền)
- Scene 1 (hook): Bẻ gãy một định kiến sai lầm phổ biến bằng góc nhìn trái chiều của chuyên gia thâm niên (dùng 'highlight-box' variant:"glow-pill").
- Scene 2 (philosophy): Đúc kết triết lý sâu sắc (BẮT BUỘC dùng type:'quote-box' hoặc 'highlight-box' variant:"accent-strip", boxIcon:"sparkle").
- Scenes 3..n-1 (principles): 3 nguyên tắc hành động thực chiến mà người bình thường ít nhận ra (dùng 'checklist' hoặc 'numbered-list').
- Scene n (cta): Khẳng định chuyên môn và kêu gọi kết nối tư vấn 1:1 hoặc follow kênh (dùng 'highlight-box' variant:"glow-pill", boxIcon:"cta").`;
  }
  if (viralFramework === 'case-study-transformation') {
    return `VIRAL FRAMEWORK: THƯƠNG HIỆU CÁ NHÂN - CASE STUDY TRƯỚC & SAU (Chuyển đổi thực tế)
- Scene 1 (hook): Đưa ngay kết quả tăng trưởng/biến đổi ấn tượng (x2, x3 doanh số, giảm 10kg, v.v.) lên đầu.
- Scene 2 (comparison): So sánh Trước vs Sau (BẮT BUỘC dùng type:'vs-card' với leftTitle, rightTitle, leftPoints, rightPoints).
- Scenes 3..n-1 (process): 3 bước chiến lược then chốt giúp tạo ra bước nhảy vọt đó.
- Scene n (cta): Kêu gọi để lại bình luận nhận tài liệu phân tích case study hoặc đặt lịch tư vấn.`;
  }
  if (viralFramework === 'myth-buster') {
    return `VIRAL FRAMEWORK: MYTH BUSTER (Đập vỡ định kiến)
- Scene 1 (hook): Đập vỡ 1 sai lầm phổ biến người xem đang mắc phải.
- Scenes 2..n-2 (normal): Bóc tách tại sao sai và đưa ra sự thật bất ngờ.
- Scene n-1 (highlight): Giải pháp chân ái/bí quyết cốt lõi.
- Scene n (cta): Kêu gọi lưu video hoặc thử ngay.`;
  }
  if (viralFramework === 'vs-battle') {
    return `VIRAL FRAMEWORK: VS BATTLE & COMPARISON (So sánh đối đầu)
- Scene 1 (hook): Đặt ra cuộc chiến giữa 2 phe/cách làm.
- Scenes 2..n-2 (normal): So sánh từng vòng đấu (Tốc độ, Chi phí, Hiệu quả) dùng 'vs-battle' hoặc 'table'.
- Scene n-1 (highlight): Người chiến thắng áp đảo.
- Scene n (cta): Hỏi người xem họ chọn phe nào.`;
  }
  if (viralFramework === 'how-to') {
    return `VIRAL FRAMEWORK: ACTIONABLE HOW-TO (Hướng dẫn thực chiến)
- Scene 1 (hook): Kết quả đáng kinh ngạc đạt được chỉ trong 3 bước.
- Scenes 2..n-2 (normal): Từng bước hành động rõ ràng, súc tích (dùng 'flowchart' hoặc 'code-terminal' hoặc 'numbered-list').
- Scene n-1 (highlight): Bí kíp then chốt để thành công.
- Scene n (cta): Kêu gọi lưu lại để áp dụng.`;
  }
  if (viralFramework === 'edu-mindmap') {
    return `VIRAL FRAMEWORK: SƠ ĐỒ TƯ DUY & BẢN ĐỒ TRI THỨC 60S (Mindmap Sư Phạm — Độc Bản Studio)
- Scene 1 (hook): Đặt ra 1 nghịch lý hoặc câu hỏi tò mò kích thích trí tò mò. Cấm chào hỏi sáo rỗng. Dùng 'highlight-box' variant:"glow-pill".
- Scene 2 (MANDATORY MINDMAP — BẮT BUỘC): PHẢI dùng type:'knowledge-graph' với knowledgeGraphData đầy đủ:
  * layout: "cascade" hoặc "spine" tùy chủ đề
  * 1 Root node (tier:0) là chủ đề trung tâm
  * 3-4 nhánh chính (tier:1, parentId:"root") là các luận điểm/phân nhánh kiến thức
  * 1-2 sub-node mỗi nhánh (tier:2) là ví dụ hoặc chi tiết minh hoạ
  * Mỗi node có label ngắn (1-4 từ), subLabel (từ khoá/công thức), icon emoji sư phạm, color rực rỡ riêng biệt, insight (15-25 từ tiếng Việt)
- Scene 3 (deep-dive): Đào sâu 1 nhánh cốt lõi (dùng 'checklist' hoặc 'flowchart' hoặc 'numbered-list').
- Scene n-1 (quiz): Câu hỏi đố vui tương tác (BẮT BUỘC dùng type:'quiz-card') để kích thích comment đáp án.
- Scene n (cta): Kêu gọi lưu video để ôn tập, follow kênh kiến thức (dùng 'highlight-box' variant:"glow-pill", boxIcon:"cta").`;
  }
  if (viralFramework === 'fintech-breakdown') {
    return `VIRAL FRAMEWORK: BÁO CÁO TÀI CHÍNH & DÒNG TIỀN (Fintech / Market Breakdown)
- Scene 1 (hook): Số liệu gây shock hoặc câu hỏi tài chính trực diện (dùng 'stat-big' hoặc 'badge' đỏ khẩn cấp).
- Scene 2 (MANDATORY CHART — BẮT BUỘC): Phải dùng 1 trong các loại biểu đồ tài chính sau:
  * type:'candlestick-chart' — nếu chủ đề về thị trường, crypto, giá cổ phiếu, OHLC data
  * type:'waterfall-chart' — nếu chủ đề về dòng tiền, bóc tách chi phí/doanh thu từng hạng mục
  * type:'sankey-chart' — nếu chủ đề về luồng phân phối tiền, hệ sinh thái tài chính
  * type:'racing-bar-chart' — nếu chủ đề về xếp hạng, tăng trưởng theo giai đoạn/năm
- Scenes 3..n-2 (analysis): Phân tích nguyên nhân, bài học xương máu (dùng 'vs-battle' hoặc 'checklist').
- Scene n-1 (highlight): Bí mật hoặc nguyên tắc tài chính cốt lõi nhất (dùng 'quote-box').
- Scene n (cta): Kêu gọi comment ý kiến hoặc lưu video phân tích.`;
  }
  if (viralFramework === 'tech-teardown') {
    return `VIRAL FRAMEWORK: BÓC TÁCH CÔNG NGHỆ & AI TERMINAL (Tech Hacker Style)
- Scene 1 (hook): Vấn đề nghẽn cổ chai hoặc công nghệ lỗi thời gây shock (dùng 'highlight-box' variant:"glow-pill", boxIcon:"alert").
- Scene 2 (MANDATORY TERMINAL — BẮT BUỘC): Phải dùng 1 trong:
  * type:'code-terminal' — nếu chủ đề về code, lập trình, AI API, CLI commands, thuật toán
  * type:'flowchart' với flowSteps rõ ràng 3-4 bước — nếu chủ đề về kiến trúc hệ thống, quy trình tech
  * type:'data-flow' — nếu chủ đề về luồng dữ liệu, pipeline AI/ML
- Scene 3 (demo): Demo kết quả thực chiến hoặc so sánh trước/sau (dùng 'vs-battle' hoặc 'stat-big').
- Scene n-1 (highlight): Insight đột phá hoặc tool bí mật ít người biết (dùng 'highlight-box' variant:"callout-card").
- Scene n (cta): Kêu gọi comment muốn tìm hiểu thêm hoặc link GitHub/resource.`;
  }
  if (viralFramework === 'wellness-book-summary') {
    return `VIRAL FRAMEWORK: TÓM TẮT SÁCH & TƯ DUY PHÁT TRIỂN BẢN THÂN (Wellness / Self-Growth)
- Scene 1 (hook): Trích dẫn gây chấn động tâm lý hoặc câu hỏi chạm vào nỗi đau nội tâm (BẮT BUỘC dùng type:'quote-box' với authorName đầy đủ).
- Scene 2 (core-lesson): Phân tầng bài học cốt lõi (BẮT BUỘC dùng type:'knowledge-graph' với layout:"spine" hoặc type:'pyramid-funnel'):
  * knowledge-graph: Root là tên sách/tác giả, 3 nhánh tier:1 là 3 bài học chính, mỗi nhánh 1 sub-node tier:2 là hành động cụ thể
  * Hoặc pyramid-funnel nếu bài học có thứ bậc từ nền tảng đến đỉnh cao
- Scene 3 (action): 3 hành động thay đổi ngay hôm nay (dùng 'checklist' hoặc 'numbered-list', súc tích, thực chiến).
- Scene n-1 (philosophy): Câu trích dẫn triết lý đắt giá nhất của sách (dùng 'quote-box' với font Playfair Display).
- Scene n (cta): Mời comment "Bạn đã đọc cuốn này chưa?" hoặc tên sách bạn muốn tóm tắt tiếp theo.`;
  }
  return `VIRAL FRAMEWORK: HOOK - RETAIN - VALUE - CTA (Tiêu chuẩn TikTok)
- Scene 1 (hook): Giữ chân trong 3s đầu, cấm chào hỏi sáo rỗng.
- Scenes 2..n-2 (normal): Đào sâu vấn đề và cung cấp insight giá trị.
- Scene n-1 (highlight): Đỉnh điểm/Bài học đắt giá nhất.
- Scene n (cta): Kêu gọi bình luận và follow.`;
};

export const getAntiHallucinationPrompt = (sourceMaterial) => {
  if (sourceMaterial && sourceMaterial.trim().length > 10) {
    return `
=== CRITICAL SOURCE MATERIAL (GROUNDING) ===
The user has provided the following REAL source material:
"""
${sourceMaterial.trim().slice(0, 3000)}
"""
ANTI-HALLUCINATION RULES:
1. You MUST extract 100% real facts, logic, names, and statistics from the source material above.
2. DO NOT invent fake numbers or unverified claims.
3. Condense and adapt the source material into high-energy short-form video scenes.`;
  }
  return '';
};
