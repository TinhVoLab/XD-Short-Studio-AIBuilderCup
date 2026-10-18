import { Scene } from "@/types/scene";

export type TemplateCategory =
  | "all"
  | "education"
  | "personal-brand"
  | "tips"
  | "versus"
  | "data"
  | "tutorial"
  | "healing";

export interface VideoTemplateItem {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  accentColor: string;
  bgColor: string;
  paletteId?: string;
  sceneCount: number;
  badge?: string;
  viralFramework?: string; // Tự động liên kết với AI Wizard để điền kịch bản
  suggestedPrompt?: string; // Gợi ý chủ đề cho người dùng
  getScenes: (options?: { brandColor?: string }) => Scene[];
}

export interface TemplateCategoryMeta {
  id: TemplateCategory;
  label: string;
  description?: string;
}

export const TEMPLATE_CATEGORIES: readonly TemplateCategoryMeta[] = [
  { id: "all", label: "Tất cả danh mục", description: "Toàn bộ kho mẫu video chuẩn studio" },
  { id: "education", label: "Giáo Dục & Giảng Dạy", description: "Khái niệm, bài tập, câu đố trắc nghiệm tương tác" },
  { id: "personal-brand", label: "Thương Hiệu Cá Nhân", description: "Insight chuyên gia, góc nhìn, câu chuyện biến đổi" },
  { id: "tips", label: "Mẹo Hay & Lời Khuyên", description: "Bí kíp viral, danh sách kiểm tra súc tích" },
  { id: "versus", label: "So Sánh Đối Đầu", description: "Đọ sức 2 phe, bảng so sánh đa chiều" },
  { id: "data", label: "Số Liệu & Báo Cáo", description: "Biểu đồ, phân tích tăng trưởng, case study" },
  { id: "tutorial", label: "Quy Trình & Hướng Dẫn", description: "Sơ đồ các bước thực chiến dễ áp dụng" },
  { id: "healing", label: "Tối Giản & Thư Giãn", description: "Danh ngôn, trích dẫn truyền cảm hứng" },
] as const;
