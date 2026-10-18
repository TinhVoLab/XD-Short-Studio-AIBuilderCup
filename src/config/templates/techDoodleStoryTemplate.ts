import { VideoTemplateItem } from "./types";
import { Scene } from "@/types/scene";
import { centerBlock, frameAround, circleAround } from "@/utils/layoutHelpers";
import { createHandDrawnElement } from "@/config/handDrawnCatalog";

export const TECH_DOODLE_STORY_TEMPLATE: VideoTemplateItem = {
  id: "tech-doodle-story-9",
  name: "Doodle AI Masterclass (9 Cảnh)",
  description: "Phong cách Dark Line-Art Minimalist: 9 cảnh (~31.5s) kể chuyện nâng tầm kỹ năng AI với nét vẽ doodle động từ thư viện chuẩn, 100% đồng bộ BrandKit",
  category: "personal-brand",
  accentColor: "#BEFF01",
  bgColor: "#080808",
  sceneCount: 9,
  badge: "Line-Art Minimalist",
  viralFramework: "hook-retain-value-cta",
  suggestedPrompt: "3 Bước Làm Chủ Công Cụ AI Đột Phá Năng Suất",
  getScenes: (options?: { brandColor?: string }): Scene[] => {
    const brandColor = options?.brandColor || "#BEFF01";
    const bgDark = "#080808";

    // ── CẢNH 1: Layouts (Visual Gravity Balanced & Targeted Arrow) ──
    const sc1Badge = centerBlock(65, 200, 32);
    const sc1Title = centerBlock(130, 320, 85);
    const sc1Box = centerBlock(345, 320, 125);
    const sc1Spark = createHandDrawnElement("hd-doodle-spark", { left: 295, top: 175, width: 55, height: 55 }, {
      id: "d1-spark",
      stroke: brandColor,
      animDelay: 0.15,
      animDuration: 0.8
    });
    const sc1Arrow = createHandDrawnElement("hd-curved-arrow-down", { left: 220, top: 265, width: 75, height: 75, angle: -12 }, {
      id: "d1-arrow",
      stroke: brandColor,
      animDelay: 0.5,
      animDuration: 1.0
    });

    // ── CẢNH 2: Layouts (3 Cards Box-Model H=240 & Zero-Collision Red Frame) ──
    const sc2Badge = centerBlock(65, 210, 32);
    const sc2Box = centerBlock(135, 320, 240);
    const sc2Frame = createHandDrawnElement("hd-doodle-box", frameAround(sc2Box, 20, 16), {
      id: "d2-frame",
      stroke: "#FF453A",
      strokeWidth: 4.5,
      animDelay: 0.3,
      animDuration: 1.2
    });

    // ── CẢNH 3: Layouts ──
    const sc3Badge = centerBlock(65, 200, 32);
    const sc3Box = centerBlock(145, 320, 75);
    const sc3Bubble = createHandDrawnElement("hd-speech-bubble", frameAround(sc3Box, 16, 35), {
      id: "d3-bubble",
      stroke: brandColor,
      strokeWidth: 4.5,
      animDelay: 0.2,
      animDuration: 1.1
    });

    // ── CẢNH 4: Layouts ──
    const sc4Badge = centerBlock(54, 210, 32);
    const sc4Box = centerBlock(125, 320, 140);
    const sc4Arrow = createHandDrawnElement("hd-loop-arrow", { left: 180, top: 350, width: 140, height: 110 }, {
      id: "d4-arrow",
      stroke: brandColor,
      strokeWidth: 4,
      animDelay: 0.4,
      animDuration: 1.2
    });

    // ── CẢNH 5: Layouts ──
    const sc5Badge = centerBlock(54, 190, 32);
    const sc5Box = centerBlock(120, 320, 165);
    const sc5Check = createHandDrawnElement("hd-check-mark", { left: 280, top: 335, width: 70, height: 70 }, {
      id: "d5-check",
      stroke: brandColor,
      strokeWidth: 5,
      animDelay: 0.4,
      animDuration: 0.9
    });

    // ── CẢNH 6: Layouts ──
    const sc6Badge = centerBlock(54, 200, 32);
    const sc6Box = centerBlock(130, 320, 130);
    const sc6Underline = createHandDrawnElement("hd-straight-marker", { left: 180, top: 220, width: 280, height: 35 }, {
      id: "d6-underline",
      stroke: brandColor,
      strokeWidth: 5,
      animDelay: 0.3,
      animDuration: 1.0
    });

    // ── CẢNH 7: Layouts ──
    const sc7Box = centerBlock(135, 320, 120);
    const sc7Circle = createHandDrawnElement("hd-double-circle", circleAround(sc7Box, 14), {
      id: "d7-circle",
      stroke: brandColor,
      strokeWidth: 4.5,
      animDelay: 0.3,
      animDuration: 1.2
    });

    // ── CẢNH 8: Layouts ──
    const sc8Title = centerBlock(140, 320, 80);
    const sc8Underline = createHandDrawnElement("hd-squiggle-underline", { left: 180, top: 200, width: 260, height: 40 }, {
      id: "d8-underline",
      stroke: brandColor,
      strokeWidth: 5,
      animDelay: 0.35,
      animDuration: 1.1
    });

    // ── CẢNH 9: Layouts ──
    const sc9Box = centerBlock(135, 320, 120);
    const sc9Arrow = createHandDrawnElement("hd-doodle-arrow-01", { left: 180, top: 320, width: 100, height: 110 }, {
      id: "d9-arrow",
      stroke: brandColor,
      strokeWidth: 4.5,
      animDelay: 0.4,
      animDuration: 1.1
    });

    return [
      // ── CẢNH 1: HOOK TÒ MÒ (0–3s) ──
      {
        id: "doodle-sc-1",
        name: "Cảnh 1: Hook Bí Mật (0–3s)",
        description: "Băn khoăn đặt câu hỏi trực diện kích hoạt FOMO",
        duration: 3,
        voiceoverText: "Có phải bạn đang cảm thấy bị tụt lại phía sau trong làn sóng AI?",
        soundEffects: [
          { id: "sfx-d1-1", type: "whoosh", delaySec: 0.05, volume: 0.8 },
          { id: "sfx-d1-2", type: "marker", delaySec: 0.35, volume: 0.6 },
          { id: "sfx-d1-3", type: "pop", delaySec: 0.8, volume: 0.7 }
        ],
        bgColor: bgDark,
        bgPattern: "dots",
        elements: [
          {
            id: "d1-badge",
            type: "badge",
            left: sc1Badge.left,
            top: sc1Badge.top,
            width: sc1Badge.width,
            height: sc1Badge.height,
            scaleX: 1,
            scaleY: 1,
            angle: 0,
            opacity: 1,
            content: "AI MASTERCLASS #01",
            color: brandColor,
            bgColor: "rgba(190, 255, 1, 0.12)",
            borderColor: brandColor,
            fontSize: 13,
            animPreset: "fade-in",
            animDelay: 0.05
          },
          {
            id: "d1-title",
            type: "text",
            left: sc1Title.left,
            top: sc1Title.top,
            width: sc1Title.width,
            height: sc1Title.height,
            scaleX: 1,
            scaleY: 1,
            angle: 0,
            opacity: 1,
            content: "BẠN ĐANG BỊ TỤT LẠI\nPHÍA SAU VÌ AI?",
            color: "#FFFFFF",
            fontSize: 22,
            fontWeight: 900,
            textAlign: "center",
            animPreset: "slide-up",
            animDelay: 0.1
          },
          {
            id: "d1-box",
            type: "highlight-box",
            left: sc1Box.left,
            top: sc1Box.top,
            width: sc1Box.width,
            height: sc1Box.height,
            scaleX: 1,
            scaleY: 1,
            angle: 0,
            opacity: 1,
            variant: "glow-pill",
            content: "90% người dùng chỉ dùng 5% tính năng\nĐây là 3 bước để đứng Top 1%",
            color: "#F0F0F0",
            accentColor: brandColor,
            fontSize: 13,
            animPreset: "zoom-in",
            animDelay: 0.3
          },
          sc1Spark,
          sc1Arrow
        ]
      },

      // ── CẢNH 2: 3 NÚT THẮT (3–6.5s) ──
      {
        id: "doodle-sc-2",
        name: "Cảnh 2: Ba Nút Thắt (3–6.5s)",
        description: "Khung vẽ tay bao trọn 3 vấn đề nhức nhối thường gặp",
        duration: 3.5,
        voiceoverText: "Quá nhiều công cụ mới mỗi tuần. Prompt dài dòng nhưng kết quả không như ý. Và bạn mất hàng giờ chỉ để sửa lỗi.",
        soundEffects: [
          { id: "sfx-d2-1", type: "paper_slide", delaySec: 0.1, volume: 0.7 },
          { id: "sfx-d2-2", type: "marker", delaySec: 0.3, volume: 0.65 }
        ],
        bgColor: bgDark,
        bgPattern: "grid",
        elements: [
          {
            id: "d2-badge",
            type: "badge",
            left: sc2Badge.left,
            top: sc2Badge.top,
            width: sc2Badge.width,
            height: sc2Badge.height,
            scaleX: 1,
            scaleY: 1,
            angle: 0,
            opacity: 1,
            content: "3 NÚT THẮT PHỔ BIẾN",
            color: "#FF3B30",
            bgColor: "rgba(255, 59, 48, 0.12)",
            borderColor: "#FF3B30",
            fontSize: 13,
            animPreset: "fade-in",
            animDelay: 0.05
          },
          {
            id: "d2-box",
            type: "highlight-box",
            left: sc2Box.left,
            top: sc2Box.top,
            width: sc2Box.width,
            height: sc2Box.height,
            scaleX: 1,
            scaleY: 1,
            angle: 0,
            opacity: 1,
            variant: "glow-card",
            content: "❌ 1. Bội thực công cụ mới mỗi tuần\n❌ 2. Prompt dài nhưng output kém chất lượng\n❌ 3. Mất hàng giờ mò mẫm sửa lỗi thủ công",
            color: "#FFFFFF",
            accentColor: "#FF3B30",
            fontSize: 13.5,
            animPreset: "zoom-in",
            animDelay: 0.15
          },
          sc2Frame
        ]
      },

      // ── CẢNH 3: THỬ THÁCH QUÁ TẢI (6.5–10.5s) ──
      {
        id: "doodle-sc-3",
        name: "Cảnh 3: Quá Tải Thông Tin (6.5–10.5s)",
        description: "Vòng tròn vẽ tay khoanh tròn điểm nghẽn nghiêm trọng",
        duration: 4,
        voiceoverText: "Mở 50 tab cùng lúc, thử hết extension này đến tool khác. Càng tìm hiểu, bạn càng thấy rối và kiệt sức.",
        soundEffects: [
          { id: "sfx-d3-1", type: "swoosh", delaySec: 0.1, volume: 0.75 },
          { id: "sfx-d3-2", type: "marker", delaySec: 0.35, volume: 0.6 }
        ],
        bgColor: bgDark,
        bgPattern: "topo-contour",
        elements: [
          {
            id: "d3-badge",
            type: "badge",
            left: sc3Badge.left,
            top: sc3Badge.top,
            width: sc3Badge.width,
            height: sc3Badge.height,
            scaleX: 1,
            scaleY: 1,
            angle: 0,
            opacity: 1,
            content: "NGUYÊN NHÂN GỐC RỄ",
            color: "#FFAA00",
            bgColor: "rgba(255, 170, 0, 0.12)",
            borderColor: "#FFAA00",
            fontSize: 13,
            animPreset: "fade-in",
            animDelay: 0.05
          },
          sc3Bubble,
          {
            id: "d3-box",
            type: "text",
            left: sc3Box.left,
            top: sc3Box.top,
            width: sc3Box.width,
            height: sc3Box.height,
            scaleX: 1,
            scaleY: 1,
            angle: 0,
            opacity: 1,
            content: "Mở 50 tab Chrome cùng lúc,\nthử 10 tool khác nhau\nnhưng không có hệ thống",
            color: "#FFFFFF",
            fontSize: 16,
            fontWeight: 700,
            textAlign: "center",
            animPreset: "zoom-in",
            animDelay: 0.3
          }
        ]
      },

      // ── CẢNH 4: ĐIỂM LẬT NGƯỢC (10.5–14s) ──
      {
        id: "doodle-sc-4",
        name: "Cảnh 4: Điểm Lật Ngược (10.5–14s)",
        description: "Mũi tên uốn vòng lặp biểu thị sự chuyển đổi tư duy",
        duration: 3.5,
        voiceoverText: "Sự thật là: Bạn không cần 100 công cụ. Bạn chỉ cần 1 quy trình tinh gọn gồm 3 bước sau đây.",
        soundEffects: [
          { id: "sfx-d4-1", type: "ding", delaySec: 0.15, volume: 0.8 },
          { id: "sfx-d4-2", type: "marker", delaySec: 0.4, volume: 0.6 }
        ],
        bgColor: bgDark,
        bgPattern: "grid",
        viralEffects: { accentBreathe: true },
        elements: [
          {
            id: "d4-badge",
            type: "badge",
            left: sc4Badge.left,
            top: sc4Badge.top,
            width: sc4Badge.width,
            height: sc4Badge.height,
            scaleX: 1,
            scaleY: 1,
            angle: 0,
            opacity: 1,
            content: "SỰ THẬT ĐƠN GIẢN",
            color: brandColor,
            bgColor: "rgba(190, 255, 1, 0.12)",
            borderColor: brandColor,
            fontSize: 13,
            animPreset: "fade-in",
            animDelay: 0.05
          },
          {
            id: "d4-box",
            type: "highlight-box",
            left: sc4Box.left,
            top: sc4Box.top,
            width: sc4Box.width,
            height: sc4Box.height,
            scaleX: 1,
            scaleY: 1,
            angle: 0,
            opacity: 1,
            variant: "glow-pill",
            content: "KHÔNG CẦN 100 CÔNG CỤ\nCHỈ CẦN 1 HỆ THỐNG CHUẨN",
            color: "#FFFFFF",
            accentColor: brandColor,
            fontSize: 16,
            animPreset: "zoom-in",
            animDelay: 0.15
          },
          sc4Arrow
        ]
      },

      // ── CẢNH 5: 3 BƯỚC BLUEPRINT (14–17.5s) ──
      {
        id: "doodle-sc-5",
        name: "Cảnh 5: 3 Bước Blueprint (14–17.5s)",
        description: "Dấu check vẽ tay đánh dấu từng bước giải pháp",
        duration: 3.5,
        voiceoverText: "Bước 1: Chọn đúng model cốt lõi. Bước 2: Chuẩn hóa System Prompt. Bước 3: Tự động hóa qua API.",
        soundEffects: [
          { id: "sfx-d5-1", type: "pop", delaySec: 0.1, volume: 0.7 },
          { id: "sfx-d5-2", type: "marker", delaySec: 0.35, volume: 0.6 },
          { id: "sfx-d5-3", type: "kaching", delaySec: 0.9, volume: 0.7 }
        ],
        bgColor: bgDark,
        bgPattern: "dots",
        elements: [
          {
            id: "d5-badge",
            type: "badge",
            left: sc5Badge.left,
            top: sc5Badge.top,
            width: sc5Badge.width,
            height: sc5Badge.height,
            scaleX: 1,
            scaleY: 1,
            angle: 0,
            opacity: 1,
            content: "3 BƯỚC THỰC CHIẾN",
            color: brandColor,
            bgColor: "rgba(190, 255, 1, 0.12)",
            borderColor: brandColor,
            fontSize: 13,
            animPreset: "fade-in",
            animDelay: 0.05
          },
          {
            id: "d5-box",
            type: "highlight-box",
            left: sc5Box.left,
            top: sc5Box.top,
            width: sc5Box.width,
            height: sc5Box.height,
            scaleX: 1,
            scaleY: 1,
            angle: 0,
            opacity: 1,
            variant: "glow-card",
            content: "✦ BƯỚC 1: Chọn 1 Model Cốt Lõi\n✦ BƯỚC 2: Chuẩn Hóa System Prompt\n✦ BƯỚC 3: Tự Động Hóa Qua API",
            color: "#FFFFFF",
            accentColor: brandColor,
            fontSize: 14,
            animPreset: "slide-up",
            animDelay: 0.15
          },
          sc5Check
        ]
      },

      // ── CẢNH 6: BẰNG CHỨNG THỰC TẾ (17.5–20.5s) ──
      {
        id: "doodle-sc-6",
        name: "Cảnh 6: Bằng Chứng Thực Tế (17.5–20.5s)",
        description: "Gạch chân vẽ tay nhấn mạnh kết quả tăng trưởng 10x",
        duration: 3,
        voiceoverText: "Khi có hệ thống, hiệu suất công việc của bạn tăng vọt ít nhất 10 lần.",
        soundEffects: [
          { id: "sfx-d6-1", type: "whoosh", delaySec: 0.05, volume: 0.75 },
          { id: "sfx-d6-2", type: "marker", delaySec: 0.25, volume: 0.6 }
        ],
        bgColor: bgDark,
        bgPattern: "grid",
        elements: [
          {
            id: "d6-badge",
            type: "badge",
            left: sc6Badge.left,
            top: sc6Badge.top,
            width: sc6Badge.width,
            height: sc6Badge.height,
            scaleX: 1,
            scaleY: 1,
            angle: 0,
            opacity: 1,
            content: "KẾT QUẢ ĐÃ ĐƯỢC CHỨNG MINH",
            color: brandColor,
            bgColor: "rgba(190, 255, 1, 0.12)",
            borderColor: brandColor,
            fontSize: 13,
            animPreset: "fade-in",
            animDelay: 0.05
          },
          {
            id: "d6-box",
            type: "highlight-box",
            left: sc6Box.left,
            top: sc6Box.top,
            width: sc6Box.width,
            height: sc6Box.height,
            scaleX: 1,
            scaleY: 1,
            angle: 0,
            opacity: 1,
            variant: "accent-strip",
            content: "TĂNG TỐC ĐỘ XỬ LÝ 10X\nTIẾT KIỆM 15 GIỜ / TUẦN",
            color: "#FFFFFF",
            accentColor: brandColor,
            fontSize: 18,
            animPreset: "zoom-in",
            animDelay: 0.15
          },
          sc6Underline
        ]
      },

      // ── CẢNH 7: ĐỘT PHÁ LEVEL UP (20.5–24s) ──
      {
        id: "doodle-sc-7",
        name: "Cảnh 7: Đột Phá Thành Quả (20.5–24s)",
        description: "Khoanh tròn điểm nhấn chúc mừng thành quả đột phá 40 phút",
        duration: 3.5,
        voiceoverText: "Từ 4 tiếng làm thủ công xuống còn 40 phút với AI. Cùng một kết quả — gấp 6 lần tốc độ.",
        soundEffects: [
          { id: "sfx-d7-1", type: "ding", delaySec: 0.15, volume: 0.85 },
          { id: "sfx-d7-2", type: "marker", delaySec: 0.3, volume: 0.55 },
          { id: "sfx-d7-3", type: "boom", delaySec: 0.8, volume: 0.75 }
        ],
        bgColor: "#0A0A0A",
        bgPattern: "noise",
        viralEffects: { vignettePulse: true },
        elements: [
          {
            id: "d7-box",
            type: "highlight-box",
            left: sc7Box.left,
            top: sc7Box.top,
            width: sc7Box.width,
            height: sc7Box.height,
            scaleX: 1,
            scaleY: 1,
            angle: 0,
            opacity: 1,
            variant: "glow-pill",
            content: "TỪ 4 TIẾNG → 40 PHÚT\nKẾT QUẢ KHÔNG THAY ĐỔI",
            color: "#FFFFFF",
            accentColor: brandColor,
            fontSize: 18,
            animPreset: "zoom-in",
            animDelay: 0.1
          },
          sc7Circle
        ]
      },

      // ── CẢNH 8: TẦM NHÌN DÀI HẠN (24–27.5s) ──
      {
        id: "doodle-sc-8",
        name: "Cảnh 8: Tầm Nhìn Dài Hạn (24–27.5s)",
        description: "Gạch chân lượn sóng nhấn mạnh lời cảnh báo khẩn cấp",
        duration: 3.5,
        voiceoverText: "AI không ngừng phát triển. Câu hỏi không phải là có nên học không — mà là bắt đầu từ đâu.",
        soundEffects: [
          { id: "sfx-d8-1", type: "chime", delaySec: 0.1, volume: 0.8 },
          { id: "sfx-d8-2", type: "paper_slide", delaySec: 0.5, volume: 0.6 }
        ],
        bgColor: bgDark,
        bgPattern: "topo-contour",
        elements: [
          {
            id: "d8-title",
            type: "text",
            left: sc8Title.left,
            top: sc8Title.top,
            width: sc8Title.width,
            height: sc8Title.height,
            scaleX: 1,
            scaleY: 1,
            angle: 0,
            opacity: 1,
            content: "AI KHÔNG CHỜ\nBẠN SẴN SÀNG",
            color: "#F5F5F5",
            fontSize: 22,
            fontWeight: 900,
            textAlign: "center",
            animPreset: "fade-in",
            animDelay: 0.1
          },
          sc8Underline
        ]
      },

      // ── CẢNH 9: KÊU GỌI HÀNH ĐỘNG (27.5–31.5s) ──
      {
        id: "doodle-sc-9",
        name: "Cảnh 9: Kêu Gọi Hành Động (27.5–31.5s)",
        description: "Mũi tên uốn cong chỉ thẳng vào nút Follow / Nhận tài liệu",
        duration: 4,
        voiceoverText: "Bình luận từ 'MUỐN' ngay bên dưới — tôi gửi trọn bộ tài liệu AI cho bạn miễn phí. Follow để không bỏ lỡ video tiếp theo.",
        soundEffects: [
          { id: "sfx-d9-1", type: "bell", delaySec: 0.1, volume: 0.85 },
          { id: "sfx-d9-2", type: "marker", delaySec: 0.4, volume: 0.6 }
        ],
        bgColor: bgDark,
        bgPattern: "grid",
        viralEffects: { accentBreathe: true },
        elements: [
          {
            id: "d9-box",
            type: "highlight-box",
            left: sc9Box.left,
            top: sc9Box.top,
            width: sc9Box.width,
            height: sc9Box.height,
            scaleX: 1,
            scaleY: 1,
            angle: 0,
            opacity: 1,
            variant: "accent-strip",
            content: "CMT 'MUỐN' ĐỂ NHẬN\nBỘ TÀI LIỆU AI MIỄN PHÍ",
            color: "#FFFFFF",
            accentColor: brandColor,
            fontSize: 18,
            animPreset: "slide-up",
            animDelay: 0.1
          },
          sc9Arrow
        ]
      }
    ];
  }
};
