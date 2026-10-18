import { VideoTemplateItem } from "./types";

export const PERSONAL_BRAND_TEMPLATES: VideoTemplateItem[] = [
  {
    id: "pb-expert-insight",
    name: "Góc Nhìn Chuyên Gia",
    description: "Bố cục sang trọng, uy tín cao dành cho Bác sĩ, Luật sư, Coach & Chuyên gia chia sẻ kiến thức sâu",
    category: "personal-brand",
    accentColor: "#FFD700", // Vàng kim sang trọng & uy tín
    bgColor: "#0A0906",
    sceneCount: 4,
    badge: "Uy Tín Cao",
    viralFramework: "personal-expert",
    suggestedPrompt: "Tại sao người càng giỏi càng ít nói về thu nhập của họ?",
    getScenes: () => [
      {
        id: "pb-e-1",
        name: "Cảnh 1: Định Kiến Sai Lầm (Hook)",
        description: "Bẻ gãy một suy nghĩ phổ biến bằng góc nhìn trái chiều của chuyên gia",
        duration: 4,
        voiceoverText: "Sự thật về điều mà ai cũng nghĩ là đúng! Sau 10 năm tư vấn cho hơn 500 khách hàng, đây là bí mật tôi nhận ra...",
        soundEffects: [
          { id: "sfx-pe1-1", type: "whoosh", delaySec: 0.05, volume: 0.8 },
          { id: "sfx-pe1-2", type: "boom", delaySec: 0.3, volume: 0.75 }
        ],
        viralEffects: { vignettePulse: true, accentBreathe: true },
        bgColor: "#0A0906",
        bgPattern: "dots",
        elements: [
          {
            id: "pe1-1",
            type: "badge",
            left: 180,
            top: 50,
            width: 170,
            height: 28,
            scaleX: 1,
            scaleY: 1,
            angle: 0,
            opacity: 1,
            bgColor: "rgba(255, 215, 0, 0.15)",
            content: "GÓC NHÌN CHUYÊN GIA",
            color: "#FFD700",
            radius: 14,
            fontSize: 11,
            fontWeight: 800,
            animPreset: "fade-in",
            animDelay: 0.1
          },
          {
            id: "pe1-2",
            type: "text",
            left: 180,
            top: 130,
            width: 320,
            height: 90,
            scaleX: 1,
            scaleY: 1,
            angle: 0,
            opacity: 1,
            content: "SỰ THẬT VỀ ĐIỀU MÀ AI CŨNG NGHĨ LÀ ĐÚNG",
            fontSize: 32,
            fontFamily: "Be Vietnam Pro",
            fontWeight: 900,
            color: "#FFD700",
            textAlign: "center",
            shadow: true,
            animPreset: "zoom-in",
            animDelay: 0.2
          },
          {
            id: "pe1-3",
            type: "highlight-box",
            left: 180,
            top: 260,
            width: 320,
            height: 70,
            scaleX: 1,
            scaleY: 1,
            angle: 0,
            opacity: 1,
            bgColor: "rgba(255, 215, 0, 0.08)",
            accentColor: "#FFD700",
            radius: 16,
            content: "Sau 10 năm tư vấn cho hơn 500 khách hàng, đây là điều tôi nhận ra...",
            fontSize: 14,
            color: "#FFFFFF",
            textAlign: "center",
            animPreset: "slide-up",
            animDelay: 0.35
          }
        ]
      },
      {
        id: "pb-e-2",
        name: "Cảnh 2: Trích Dẫn & Triết Lý",
        description: "Khung quote-box mang tính đúc kết tạo sự tin tưởng tuyệt đối",
        duration: 5,
        voiceoverText: "Triết lý sâu sắc: Người bình thường chỉ lo giải quyết hậu quả. Nhưng chuyên gia thực sự luôn xử lý từ nguyên nhân gốc rễ!",
        soundEffects: [
          { id: "sfx-pe2-1", type: "pop", delaySec: 0.2, volume: 0.75 }
        ],
        viralEffects: { accentBreathe: true },
        bgColor: "#0A0906",
        bgPattern: "grid",
        elements: [
          {
            id: "pe2-1",
            type: "quote-box",
            left: 180,
            top: 170,
            width: 320,
            height: 180,
            scaleX: 1,
            scaleY: 1,
            angle: 0,
            opacity: 1,
            accentColor: "#FFD700",
            content: "Người bình thường giải quyết hậu quả. Chuyên gia giải quyết nguyên nhân gốc rễ.",
            authorName: "Góc Nhìn Thực Chiến",
            fontSize: 16,
            animPreset: "slide-up",
            animDelay: 0.1
          }
        ]
      },
      {
        id: "pb-e-3",
        name: "Cảnh 3: 3 Nguyên Tắc Cốt Lõi",
        description: "Danh sách 3 bài học ngắn gọn, đắt giá",
        duration: 6,
        voiceoverText: "3 nguyên tắc vàng: Tập trung giá trị dài hạn, xây dựng hệ thống tự động thay vì sức người, và giữ gìn uy tín cá nhân tuyệt đối.",
        soundEffects: [
          { id: "sfx-pe3-1", type: "pop", delaySec: 0.2, volume: 0.75 },
          { id: "sfx-pe3-2", type: "ding", delaySec: 0.8, volume: 0.8 }
        ],
        viralEffects: { accentBreathe: true },
        bgColor: "#0A0906",
        bgPattern: "dots",
        elements: [
          {
            id: "pe3-1",
            type: "badge",
            left: 180,
            top: 48,
            width: 150,
            height: 26,
            scaleX: 1,
            scaleY: 1,
            angle: 0,
            opacity: 1,
            bgColor: "#FFD700",
            content: "3 NGUYÊN TẮC VÀNG",
            color: "#000000",
            radius: 13,
            fontSize: 11,
            fontWeight: 900,
            animPreset: "fade-in",
            animDelay: 0.1
          },
          {
            id: "pe3-2",
            type: "checklist",
            left: 180,
            top: 150,
            width: 330,
            height: 220,
            scaleX: 1,
            scaleY: 1,
            angle: 0,
            opacity: 1,
            accentColor: "#FFD700",
            checklistData: {
              title: "3 NGUYÊN TẮC VÀNG",
              badge: "CHUYÊN GIA",
              style: "glass",
              tickAnimation: true,
              items: [
                { text: "Tự do tài chính hơn vẻ hào nhoáng", subtext: "Kiểm soát 100% thời gian sống của bạn", status: "checked" },
                { text: "Kiên nhẫn với sức mạnh lãi kép", subtext: "Thời gian là đòn bẩy tài sản lớn nhất", status: "checked" },
                { text: "Biết thế nào là ĐỦ", subtext: "Không đem cái cần thiết đổi lấy cái vô nghĩa", status: "checked" }
              ]
            },
            animPreset: "slide-up",
            animDelay: 0.2
          }
        ]
      },
      {
        id: "pb-e-4",
        name: "Cảnh 4: Định Vị Bản Thân & CTA",
        description: "Khẳng định chuyên môn và kêu gọi kết nối tư vấn chuyên sâu",
        duration: 4.5,
        voiceoverText: "Đồng hành cùng bạn: Nhấn follow kênh và gửi tin nhắn để nhận lịch tư vấn 1-1 hoàn toàn miễn phí trong tháng này nhé!",
        soundEffects: [
          { id: "sfx-pe4-1", type: "chime", delaySec: 0.1, volume: 0.85 }
        ],
        viralEffects: { vignettePulse: true, accentBreathe: true },
        bgColor: "#0A0906",
        bgPattern: "mesh",
        elements: [
          {
            id: "pe4-1",
            type: "badge",
            left: 180,
            top: 54,
            width: 150,
            height: 28,
            scaleX: 1,
            scaleY: 1,
            angle: 0,
            opacity: 1,
            bgColor: "#FFD700",
            content: "KẾT NỐI CHUYÊN GIA",
            color: "#000000",
            radius: 14,
            fontSize: 11,
            fontWeight: 900,
            animPreset: "fade-in",
            animDelay: 0.1
          },
          {
            id: "pe4-2",
            type: "text",
            left: 180,
            top: 130,
            width: 320,
            height: 80,
            scaleX: 1,
            scaleY: 1,
            angle: 0,
            opacity: 1,
            content: "THEO DÕI ĐỂ ĐÓN ĐỌC MỖI NGÀY!",
            fontSize: 26,
            fontFamily: "Be Vietnam Pro",
            fontWeight: 900,
            color: "#FFFFFF",
            textAlign: "center",
            animPreset: "zoom-in",
            animDelay: 0.2
          },
          {
            id: "pe4-3",
            type: "highlight-box",
            left: 180,
            top: 250,
            width: 320,
            height: 70,
            scaleX: 1,
            scaleY: 1,
            angle: 0,
            opacity: 1,
            bgColor: "rgba(255, 215, 0, 0.12)",
            accentColor: "#FFD700",
            radius: 16,
            content: "Để lại bình luận hoặc nhắn tin trực tiếp để nhận tài liệu chuyên sâu!",
            fontSize: 14,
            color: "#FFD700",
            textAlign: "center",
            animPreset: "slide-up",
            animDelay: 0.35
          }
        ]
      }
    ]
  },
  {
    id: "pb-case-study",
    name: "Biến Đổi Trước & Sau (Case Study)",
    description: "Công thức chứng minh năng lực mạnh nhất: Vấn đề cũ ➔ Giải pháp mới ➔ Kết quả tăng trưởng nhảy vọt",
    category: "personal-brand",
    accentColor: "#00D4FF", // Xanh băng sắc sảo & kết quả rõ ràng
    bgColor: "#050B14",
    sceneCount: 4,
    badge: "Chốt Đơn Cao",
    viralFramework: "case-study-transformation",
    suggestedPrompt: "Case study: Tái cấu trúc cửa hàng bán lẻ từ lỗ 50 triệu thành lãi 120 triệu/tháng",
    getScenes: () => [
      {
        id: "pb-cs-1",
        name: "Cảnh 1: Kết Quả Đột Phá (Hook)",
        description: "Đưa ngay con số tăng trưởng ấn tượng lên đầu video với widget stat-big",
        duration: 4,
        voiceoverText: "Case study thực tế: Tăng trưởng x3 doanh số chỉ trong 60 ngày! Đây là quy trình chúng tôi áp dụng không cần tăng tiền quảng cáo!",
        soundEffects: [
          { id: "sfx-pcs1-1", type: "whoosh", delaySec: 0.05, volume: 0.8 },
          { id: "sfx-pcs1-2", type: "boom", delaySec: 0.25, volume: 0.8 }
        ],
        viralEffects: { vignettePulse: true, accentBreathe: true },
        bgColor: "#050B14",
        bgPattern: "speed-lines",
        elements: [
          {
            id: "pcs1-1",
            type: "badge",
            left: 180,
            top: 50,
            width: 170,
            height: 28,
            scaleX: 1,
            scaleY: 1,
            angle: 0,
            opacity: 1,
            bgColor: "#00D4FF",
            content: "CASE STUDY THỰC TẾ",
            color: "#000000",
            radius: 14,
            fontSize: 11,
            fontWeight: 900,
            animPreset: "fade-in",
            animDelay: 0.1
          },
          {
            id: "pcs1-2",
            type: "text",
            left: 180,
            top: 110,
            width: 320,
            height: 70,
            scaleX: 1,
            scaleY: 1,
            angle: 0,
            opacity: 1,
            content: "TĂNG TRƯỞNG DOANH SỐ SAU 60 NGÀY",
            fontSize: 26,
            fontFamily: "Be Vietnam Pro",
            fontWeight: 900,
            color: "#FFFFFF",
            textAlign: "center",
            animPreset: "slide-down",
            animDelay: 0.2
          },
          {
            id: "pcs1-3",
            type: "stat-big",
            left: 180,
            top: 220,
            width: 320,
            height: 120,
            scaleX: 1,
            scaleY: 1,
            angle: 0,
            opacity: 1,
            statValue: "+280%",
            statLabel: "TĂNG TRƯỞNG DOANH SỐ ĐỘT PHÁ",
            accentColor: "#00D4FF",
            variant: "cyber-glass",
            animPreset: "zoom-in",
            animDelay: 0.35
          }
        ]
      },
      {
        id: "pb-cs-2",
        name: "Cảnh 2: Trước & Sau (Before & After)",
        description: "Thẻ so sánh 2 cột đối nghịch làm nổi bật sự chuyển mình",
        duration: 5.5,
        voiceoverText: "So sánh trước và sau: Trước đây doanh thu chững lại, chi phí tăng. Sau 60 ngày, doanh thu tăng 280% và chi phí giảm 35%!",
        soundEffects: [
          { id: "sfx-pcs2-1", type: "pop", delaySec: 0.2, volume: 0.75 },
          { id: "sfx-pcs2-2", type: "kaching", delaySec: 0.7, volume: 0.85 }
        ],
        viralEffects: { accentBreathe: true },
        bgColor: "#050B14",
        bgPattern: "grid",
        elements: [
          {
            id: "pcs2-1",
            type: "vs-card",
            left: 180,
            top: 170,
            width: 320,
            height: 200,
            scaleX: 1,
            scaleY: 1,
            angle: 0,
            opacity: 1,
            accentColor: "#00D4FF",
            leftCard: {
              title: "TRƯỚC TÁI CẤU TRÚC",
              points: ["Doanh thu chững lại", "Chi phí ADS tăng 40%", "Nhân sự quá tải"],
              color: "#FF5544"
            },
            rightCard: {
              title: "SAU 60 NGÀY",
              points: ["Doanh thu tăng 280%", "Chi phí giảm 35%", "Quy trình tự vận hành"],
              color: "#00D4FF"
            },
            animPreset: "slide-up",
            animDelay: 0.1
          }
        ]
      },
      {
        id: "pb-cs-3",
        name: "Cảnh 3: 3 Đòn Bẩy Chiến Lược",
        description: "Bóc tách 3 chìa khóa cốt lõi mang lại thành công bằng flowchart",
        duration: 6,
        voiceoverText: "3 đòn bẩy cốt lõi: Tối ưu lại phễu chuyển đổi, chuẩn hóa kịch bản chốt đơn tự động, và kích hoạt lại 40% khách hàng cũ!",
        soundEffects: [
          { id: "sfx-pcs3-1", type: "pop", delaySec: 0.2, volume: 0.75 },
          { id: "sfx-pcs3-2", type: "ding", delaySec: 0.7, volume: 0.8 }
        ],
        viralEffects: { accentBreathe: true, vignettePulse: true },
        bgColor: "#050B14",
        bgPattern: "dots",
        elements: [
          {
            id: "pcs3-1",
            type: "flowchart",
            left: 180,
            top: 180,
            width: 330,
            height: 220,
            scaleX: 1,
            scaleY: 1,
            angle: 0,
            opacity: 1,
            accentColor: "#00D4FF",
            content: "CHIẾN LƯỢC 3 BƯỚC BỨT PHÁ",
            flowSteps: [
              { title: "BƯỚC 1: TỐI ƯU PHỄU", subtitle: "Cắt giảm 40% chi phí quảng cáo lãng phí", color: "#FF5544", icon: "✂️" },
              { title: "BƯỚC 2: TỰ ĐỘNG CHỐT", subtitle: "Kịch bản tin nhắn AI phản hồi trong 10 giây", color: "#FFD700", icon: "⚡" },
              { title: "BƯỚC 3: TÁI KÍCH HOẠT", subtitle: "Khai thác 40% tệp khách cũ bằng ưu đãi VIP", color: "#00D4FF", icon: "🚀" }
            ],
            animPreset: "slide-up",
            animDelay: 0.2
          }
        ]
      },
      {
        id: "pb-cs-4",
        name: "Cảnh 4: Kêu Gọi Hành Động (CTA)",
        description: "Chuyển đổi người xem thành khách hàng tiềm năng",
        duration: 4,
        voiceoverText: "Bạn muốn đạt kết quả tương tự? Để lại bình luận 'QUY TRÌNH' hoặc bấm link trên bio để nhận tài liệu phân tích chi tiết nhé!",
        soundEffects: [
          { id: "sfx-pcs4-1", type: "kaching", delaySec: 0.1, volume: 0.8 },
          { id: "sfx-pcs4-2", type: "chime", delaySec: 0.4, volume: 0.8 }
        ],
        viralEffects: { vignettePulse: true, accentBreathe: true },
        bgColor: "#050B14",
        bgPattern: "mesh",
        elements: [
          {
            id: "pcs4-1",
            type: "badge",
            left: 180,
            top: 60,
            width: 160,
            height: 28,
            scaleX: 1,
            scaleY: 1,
            angle: 0,
            opacity: 1,
            bgColor: "#00D4FF",
            content: "BẮT ĐẦU NGAY HÔM NAY",
            color: "#000000",
            radius: 14,
            fontSize: 11,
            fontWeight: 900,
            animPreset: "fade-in",
            animDelay: 0.1
          },
          {
            id: "pcs4-2",
            type: "text",
            left: 180,
            top: 130,
            width: 320,
            height: 80,
            scaleX: 1,
            scaleY: 1,
            angle: 0,
            opacity: 1,
            content: "BẠN MUỐN ĐẠT KẾT QUẢ TƯƠNG TỰ?",
            fontSize: 26,
            fontFamily: "Be Vietnam Pro",
            fontWeight: 900,
            color: "#FFFFFF",
            textAlign: "center",
            animPreset: "zoom-in",
            animDelay: 0.2
          },
          {
            id: "pcs4-3",
            type: "highlight-box",
            left: 180,
            top: 250,
            width: 320,
            height: 70,
            scaleX: 1,
            scaleY: 1,
            angle: 0,
            opacity: 1,
            bgColor: "rgba(0, 212, 255, 0.12)",
            accentColor: "#00D4FF",
            radius: 16,
            content: "Để lại bình luận 'QUY TRÌNH' hoặc bấm link trên bio để nhận tài liệu phân tích chi tiết!",
            fontSize: 14,
            color: "#00D4FF",
            textAlign: "center",
            animPreset: "slide-up",
            animDelay: 0.35
          }
        ]
      }
    ]
  }
];
