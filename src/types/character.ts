export interface MascotPoseSlot {
  id: string
  name: string
  category: 'expression' | 'action' | 'turnaround'
  emoji: string
  description: string
}

export interface MascotCategoryMeta {
  id: 'expression' | 'action' | 'turnaround'
  title: string
  subtitle: string
  emoji: string
}

export const MASCOT_CATEGORIES: MascotCategoryMeta[] = [
  { id: 'expression', title: '1. BIỂU CẢM (EXPRESSIONS)', subtitle: 'Biểu cảm khuôn mặt & cảm xúc nhân vật', emoji: '😊' },
  { id: 'action', title: '2. TƯ THẾ (POSES & ACTIONS)', subtitle: 'Tư thế toàn thân & hành động dẫn dắt', emoji: '⚡' },
  { id: 'turnaround', title: '3. XOAY NHÂN VẬT (TURNAROUND)', subtitle: 'Các góc xoay phối cảnh xung quanh nhân vật', emoji: '🔄' },
]

export interface MascotProfile {
  id: string
  name: string
  accentColor?: string
  slots: Record<string, string> // poseId -> fileUrl
  isDefault?: boolean
}

export const DEFAULT_DOODLE_PROFILE: MascotProfile = {
  id: 'doodle-boy',
  name: 'Tech Doodle (Mặc định)',
  accentColor: '#BEFF01',
  slots: {
    'idea': '/assets/mascots/tech-doodle/idea.jpg',
    'thinking': '/assets/mascots/tech-doodle/thinking.jpg',
    'pointing-up': '/assets/mascots/tech-doodle/pointing-up.jpg',
    'laptop': '/assets/mascots/tech-doodle/laptop.jpg',
    'confused': '/assets/mascots/tech-doodle/confused.jpg',
    'victory': '/assets/mascots/tech-doodle/victory.jpg',
  },
  isDefault: true,
}

export const POSE_FALLBACK_MAP: Record<string, string[]> = {
  'happy': ['victory', 'idea', 'thinking'],
  'thinking': ['idea', 'pointing-up'],
  'surprised': ['confused', 'idea'],
  'excited': ['victory', 'idea'],
  'confused': ['thinking', 'idea'],
  'skeptical': ['thinking', 'confused'],
  'overwhelmed': ['confused', 'thinking'],
  'cool': ['laptop', 'victory', 'idea'],
  'coffee': ['laptop', 'thinking'],
  'oops': ['confused', 'thinking'],
  'pointing-up': ['idea', 'victory'],
  'presenting': ['pointing-up', 'idea', 'laptop'],
  'laptop': ['thinking', 'idea'],
  'cheering': ['victory', 'pointing-up', 'idea'],
  'running': ['victory', 'confused'],
  'thinking-hard': ['thinking', 'confused'],
  'idea': ['pointing-up', 'thinking'],
  'nope': ['confused', 'thinking'],
  'calling': ['laptop', 'thinking'],
  'victory': ['pointing-up', 'idea'],
  'front': ['idea', 'pointing-up'],
  'view-34': ['idea', 'pointing-up'],
  'side': ['pointing-up', 'laptop'],
  'back': ['thinking', 'idea'],
  'view-34-back': ['thinking', 'idea'],
}

export function resolveMascotPoseUrl(profile: MascotProfile | undefined, poseId: string): string {
  if (!profile || !profile.slots) return ''
  if (profile.slots[poseId]) return profile.slots[poseId]
  const fallbacks = POSE_FALLBACK_MAP[poseId] || []
  for (const fb of fallbacks) {
    if (profile.slots[fb]) return profile.slots[fb]
  }
  const allUrls = Object.values(profile.slots).filter(Boolean)
  return allUrls.length > 0 ? allUrls[0] : ''
}

export interface AutoPoseRule {
  id: string
  keywordPattern: string // Ví dụ: 'hook|câu hỏi|thắc mắc'
  targetPose: string     // Ví dụ: 'thinking'
  description: string
}

export const STANDARD_POSE_SLOTS: MascotPoseSlot[] = [
  // ── 1. Biểu Cảm (Expressions) ──
  { id: 'happy', name: 'Vui vẻ', category: 'expression', emoji: '😊', description: 'Happy: Vui vẻ, hào hứng, tích cực' },
  { id: 'thinking', name: 'Suy nghĩ', category: 'expression', emoji: '🤔', description: 'Thinking: Đắn đo, câu hỏi mở đầu' },
  { id: 'surprised', name: 'Bất ngờ', category: 'expression', emoji: '😲', description: 'Surprised: Ngạc nhiên, bất ngờ' },
  { id: 'excited', name: 'Hào hứng', category: 'expression', emoji: '🤩', description: 'Excited: Phấn khích, tin vui' },
  { id: 'confused', name: 'Bối rối', category: 'expression', emoji: '😕', description: 'Confused: Bế tắc, sai lầm, rắc rối' },
  { id: 'skeptical', name: 'Nghi ngờ', category: 'expression', emoji: '🤨', description: 'Skeptical: Nghi ngờ, phản biện' },
  { id: 'overwhelmed', name: 'Quá tải', category: 'expression', emoji: '😰', description: 'Overwhelmed: Căng thẳng, kiệt sức' },
  { id: 'cool', name: 'Tự tin', category: 'expression', emoji: '😎', description: 'Cool: Đeo kính ngầu, bí kíp đỉnh cao' },
  { id: 'coffee', name: 'Cafe Chill', category: 'expression', emoji: '☕', description: 'Coffee Mode: Thư giãn, lifestyle' },
  { id: 'oops', name: 'Hoảng hốt', category: 'expression', emoji: '😱', description: 'Oops: Cảnh báo nguy cơ, mất tiền' },

  // ── 2. Tư Thế (Poses & Actions) ──
  { id: 'pointing-up', name: 'Chỉ lên', category: 'action', emoji: '☝️', description: 'Pointing Up: Hướng mắt vào Tiêu đề / Con số' },
  { id: 'presenting', name: 'Giới thiệu', category: 'action', emoji: '💁', description: 'Presenting: Giới thiệu giải pháp / Sản phẩm' },
  { id: 'laptop', name: 'Dùng Laptop', category: 'action', emoji: '💻', description: 'Using Laptop: Làm việc, code, thao tác' },
  { id: 'cheering', name: 'Quyết tâm', category: 'action', emoji: '✊', description: 'Cheering: Giơ tay quyết tâm, động lực' },
  { id: 'running', name: 'Chạy gấp', category: 'action', emoji: '🏃', description: 'Running: Khẩn cấp, giới hạn thời gian, FOMO' },
  { id: 'thinking-hard', name: 'Nghĩ sâu', category: 'action', emoji: '🧠', description: 'Thinking Hard: Bánh răng tư duy, phân tích' },
  { id: 'idea', name: 'Nảy ý tưởng', category: 'action', emoji: '💡', description: 'Idea!: Bóng đèn sáng, sáng kiến mới' },
  { id: 'nope', name: 'Từ chối', category: 'action', emoji: '🙅', description: 'Nope: Khoanh tay từ chối, điều cấm kỵ' },
  { id: 'calling', name: 'Nghe máy', category: 'action', emoji: '📱', description: 'Calling: Gọi điện thoại, liên hệ tư vấn' },
  { id: 'victory', name: 'Chiến thắng', category: 'action', emoji: '✌️', description: 'Victory: 2 tay chữ V, kêu gọi hành động CTA' },

  // ── 3. Xoay Nhân Vật (Turnaround) ──
  { id: 'front', name: 'Chính diện', category: 'turnaround', emoji: '🧍', description: 'Front View: Góc nhìn thẳng trực diện' },
  { id: 'view-34', name: 'Góc 3/4', category: 'turnaround', emoji: '🚶', description: '3/4 View: Góc nghiêng 3/4 phía trước' },
  { id: 'side', name: 'Góc ngang', category: 'turnaround', emoji: '🚶‍♂️', description: 'Side View: Góc nhìn ngang sườn 90 độ' },
  { id: 'back', name: 'Sau lưng', category: 'turnaround', emoji: '🔙', description: 'Back View: Góc nhìn từ sau lưng' },
  { id: 'view-34-back', name: '3/4 Sau', category: 'turnaround', emoji: '🔄', description: '3/4 Back View: Góc nghiêng 3/4 phía sau' },
]

export const DEFAULT_AUTO_POSE_RULES: AutoPoseRule[] = [
  { id: 'rule-hook', keywordPattern: 'bạn có biết|tại sao|nghĩ xem|liệu rằng|thắc mắc|câu hỏi', targetPose: 'thinking', description: 'Câu hỏi mở đầu / Hook' },
  { id: 'rule-problem', keywordPattern: 'sai lầm|thất bại|mất tiền|nguy hiểm|rủi ro|khó khăn|bế tắc', targetPose: 'confused', description: 'Nêu vấn đề / Sai lầm' },
  { id: 'rule-myth', keywordPattern: 'sự thật|đừng tin|nghi ngờ|sai bét|ảo tưởng|định kiến', targetPose: 'skeptical', description: 'Phản biện / Đập vỡ định kiến' },
  { id: 'rule-shock', keywordPattern: 'sốc|bất ngờ|cảnh báo|khẩn cấp|ngay lập tức|chấn động|nguy cơ', targetPose: 'oops', description: 'Tin sốc / Cảnh báo' },
  { id: 'rule-idea', keywordPattern: 'bí quyết|giải pháp|mẹo hay|ý tưởng|cách làm|công cụ|bí mật', targetPose: 'idea', description: 'Đưa ra ý tưởng / Bí quyết' },
  { id: 'rule-pointing', keywordPattern: 'hãy xem|chú ý|nhìn vào|bảng này|con số|dưới đây|trên đây', targetPose: 'pointing-up', description: 'Chỉ hướng vào nội dung' },
  { id: 'rule-present', keywordPattern: 'giới thiệu|tổng quan|đây là|cụ thể|tính năng', targetPose: 'presenting', description: 'Giới thiệu sản phẩm / Tính năng' },
  { id: 'rule-action', keywordPattern: 'thực hành|bước 1|bước 2|bước 3|hướng dẫn|thao tác|cài đặt|code', targetPose: 'laptop', description: 'Hướng dẫn hành động / Code' },
  { id: 'rule-fomo', keywordPattern: 'nhanh lên|hết hạn|gấp|chỉ còn|cơ hội|chạy ngay', targetPose: 'running', description: 'Giới hạn thời gian / FOMO' },
  { id: 'rule-cta', keywordPattern: 'lưu lại|chia sẻ|follow|thử ngay|áp dụng|thành công|chiến thắng', targetPose: 'victory', description: 'Kêu gọi hành động (CTA)' },
]
