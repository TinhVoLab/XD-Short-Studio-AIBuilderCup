export interface LottieStickerItem {
  id: string
  name: string
  category: 'cta' | 'hype' | 'tech' | 'badge' | 'arrow' | 'hook'
  emoji: string
  preset: string
  defaultWidth: number
  defaultHeight: number
  defaultColor?: string
  tags: string[]
  description: string
}

export const LOTTIE_CATEGORIES = [
  { id: 'all', label: 'Tất cả', emoji: '✨' },
  { id: 'hook', label: 'Tò mò & Bí mật', emoji: '👀' },
  { id: 'cta', label: 'CTA & Tương tác', emoji: '🎯' },
  { id: 'hype', label: 'Cảm xúc & Hype', emoji: '🔥' },
  { id: 'tech', label: 'AI & Tech Cyber', emoji: '🤖' },
  { id: 'arrow', label: 'Chỉ dẫn & Mũi tên', emoji: '🏹' },
  { id: 'badge', label: 'Huy hiệu & Đích đến', emoji: '🏆' },
] as const

export const LOTTIE_STICKER_CATALOG: LottieStickerItem[] = [
  // ── 0. HOOK & TÒ MÒ BÍ MẬT (Retaining Attention & Viral Hooks) ──
  {
    id: 'lottie-shifty-eyes',
    name: 'Mắt Liếc Nhìn Đảo Quanh',
    category: 'hook',
    emoji: '👀',
    preset: 'shifty-eyes',
    defaultWidth: 90,
    defaultHeight: 90,
    defaultColor: '#00D4FF',
    tags: ['mắt', 'nhìn', 'liếc', 'tò mò', 'bí mật', 'eyes', 'look', 'drama'],
    description: 'Cặp mắt đảo trái phải liên tục tạo cảm giác tò mò kịch tính'
  },
  {
    id: 'lottie-shh-secret',
    name: 'Ngón Tay Suỵt Bí Mật',
    category: 'hook',
    emoji: '🤫',
    preset: 'shh-secret',
    defaultWidth: 85,
    defaultHeight: 85,
    defaultColor: '#BEFF01',
    tags: ['suỵt', 'bí mật', 'shh', 'secret', 'giấu kín', 'hé lộ'],
    description: 'Ngón tay ra hiệu giữ bí mật nhún nhẹ kèm sóng âm thì thầm'
  },
  {
    id: 'lottie-bouncing-question',
    name: 'Dấu Hỏi Chấm Nhún Nhảy',
    category: 'hook',
    emoji: '❓',
    preset: 'bouncing-question',
    defaultWidth: 85,
    defaultHeight: 85,
    defaultColor: '#C084FC',
    tags: ['chấm hỏi', 'tại sao', 'thắc mắc', 'nghi vấn', 'question', 'why'],
    description: 'Dấu hỏi chấm rơi nảy lò xo thu hút sự chú ý tức thì'
  },
  {
    id: 'lottie-idea-pop',
    name: 'Bóng Đèn Bật Sáng Ý Tưởng',
    category: 'hook',
    emoji: '💡',
    preset: 'idea-pop',
    defaultWidth: 85,
    defaultHeight: 85,
    defaultColor: '#FFD700',
    tags: ['ý tưởng', 'bóng đèn', 'sáng tạo', 'idea', 'eureka', 'bí kíp'],
    description: 'Bóng đèn bừng sáng đột ngột với các tia hào quang vàng'
  },

  // ── 1. CTA & TƯƠNG TÁC (Attention & Actions) ──
  {
    id: 'lottie-subscribe-bell',
    name: 'Chuông Subscribe Rung',
    category: 'cta',
    emoji: '🔔',
    preset: 'subscribe-bell',
    defaultWidth: 90,
    defaultHeight: 90,
    defaultColor: '#FFD700',
    tags: ['chuông', 'subscribe', 'đăng ký', 'bell', 'thông báo', 'cta'],
    description: 'Chuông thông báo vàng lắc lư sinh động kích thích click'
  },
  {
    id: 'lottie-heart-beat',
    name: 'Trái Tim Đập Rộn Ràng',
    category: 'cta',
    emoji: '❤️',
    preset: 'heart-beat',
    defaultWidth: 85,
    defaultHeight: 85,
    defaultColor: '#FF3366',
    tags: ['tim', 'thả tim', 'heart', 'like', 'yêu thích', 'tương tác'],
    description: 'Trái tim hồng đập nhịp nhàng kèm sóng phát sáng'
  },
  {
    id: 'lottie-live-hearts',
    name: 'Mưa Thả Tim Livestream',
    category: 'cta',
    emoji: '💖',
    preset: 'live-hearts',
    defaultWidth: 90,
    defaultHeight: 140,
    defaultColor: '#FF3366',
    tags: ['mưa tim', 'live', 'livestream', 'like', 'thả tim', 'nổi', 'bay', 'float'],
    description: 'Các icon thả tim và like trôi bồng bềnh từ dưới lên như livestream'
  },
  {
    id: 'lottie-mouse-click',
    name: 'Click Chuột Chốt Đơn',
    category: 'cta',
    emoji: '👆',
    preset: 'mouse-click',
    defaultWidth: 100,
    defaultHeight: 100,
    defaultColor: '#00D4FF',
    tags: ['chuột', 'click', 'chạm', 'action', 'mua ngay', 'chốt đơn'],
    description: 'Bàn tay click toả ra sóng âm vòng tròn thôi thúc hành động'
  },
  {
    id: 'lottie-voucher-drop',
    name: 'Bão Voucher Khuyến Mãi',
    category: 'cta',
    emoji: '🎟️',
    preset: 'voucher-drop',
    defaultWidth: 120,
    defaultHeight: 150,
    defaultColor: '#FFD700',
    tags: ['voucher', 'sale', 'giảm giá', 'vé', 'khuyến mãi', 'bay'],
    description: 'Cơn mưa thẻ giảm giá và voucher xoay vòng rơi từ trên xuống'
  },
  {
    id: 'lottie-bookmark-save',
    name: 'Nút Lưu Video Bookmark',
    category: 'cta',
    emoji: '🔖',
    preset: 'bookmark-save',
    defaultWidth: 85,
    defaultHeight: 85,
    defaultColor: '#FFD700',
    tags: ['lưu', 'bookmark', 'save', 'ghim', 'favorite', 'yêu thích', 'cta'],
    description: 'Dải ruy-băng lưu video rơi xuống và phát sáng vàng'
  },
  {
    id: 'lottie-thumb-like',
    name: 'Bấm Like Phát Sáng',
    category: 'cta',
    emoji: '👍',
    preset: 'thumb-like',
    defaultWidth: 85,
    defaultHeight: 85,
    defaultColor: '#00D4FF',
    tags: ['like', 'thích', 'ngón tay', 'ủng hộ', 'upvote'],
    description: 'Bàn tay Like giơ lên kèm hiệu ứng nổ sao'
  },
  {
    id: 'lottie-finger-tap',
    name: 'Ngón Tay Chạm Nhấp',
    category: 'cta',
    emoji: '👆',
    preset: 'finger-tap',
    defaultWidth: 80,
    defaultHeight: 80,
    defaultColor: '#BEFF01',
    tags: ['chạm', 'click', 'bấm vào', 'tap', 'chỉ tay'],
    description: 'Ngón tay trỏ nhấn liên tục với vòng sóng radar'
  },

  // ── 2. HYPE & CẢM XÚC (Hype, Viral, Energy) ──
  {
    id: 'lottie-fire',
    name: 'Ngọn Lửa Bùng Cháy',
    category: 'hype',
    emoji: '🔥',
    preset: 'fire',
    defaultWidth: 95,
    defaultHeight: 95,
    defaultColor: '#FF5544',
    tags: ['lửa', 'hot', 'cháy', 'bùng nổ', 'viral', 'fire', 'trending'],
    description: 'Ngọn lửa nhiệt huyết dao động nhịp nhàng rực rỡ'
  },
  {
    id: 'lottie-lightning-bolt',
    name: 'Tia Sét Năng Lượng',
    category: 'hype',
    emoji: '⚡',
    preset: 'lightning-bolt',
    defaultWidth: 85,
    defaultHeight: 85,
    defaultColor: '#FFD700',
    tags: ['sét', 'nhanh', 'năng lượng', 'tốc độ', 'power', 'flash'],
    description: 'Tia chớp vàng nhấp nháy phát điện cực mạnh'
  },
  {
    id: 'lottie-sparkle-stars',
    name: 'Ngôi Sao Lấp Lánh',
    category: 'hype',
    emoji: '✨',
    preset: 'sparkle-stars',
    defaultWidth: 85,
    defaultHeight: 85,
    defaultColor: '#BEFF01',
    tags: ['sao', 'lấp lánh', 'ma thuật', 'magic', 'sparkle', 'nổi bật'],
    description: 'Chùm sao 4 cánh xoay tròn và tỏa sáng lung linh'
  },
  {
    id: 'lottie-confetti-party',
    name: 'Pháo Hoa Chúc Mừng',
    category: 'hype',
    emoji: '🎉',
    preset: 'confetti-party',
    defaultWidth: 90,
    defaultHeight: 90,
    defaultColor: '#00FF88',
    tags: ['chúc mừng', 'thành công', 'party', 'pháo hoa', 'ăn mừng'],
    description: 'Pháo giấy tung bay ngập tràn sắc màu'
  },

  // ── 3. TECH & CYBER AI ──
  {
    id: 'lottie-ai-brain',
    name: 'Bộ Não AI Xung Điện',
    category: 'tech',
    emoji: '🧠',
    preset: 'ai-brain',
    defaultWidth: 90,
    defaultHeight: 90,
    defaultColor: '#00D4FF',
    tags: ['não', 'ai', 'trí tuệ', 'tư duy', 'brain', 'logic', 'deep learning'],
    description: 'Bộ não tương lai nhịp đập phát hào quang Neon Cyan'
  },
  {
    id: 'lottie-tech-hud',
    name: 'Vòng Tròn HUD Radar',
    category: 'tech',
    emoji: '⭕',
    preset: 'tech-hud',
    defaultWidth: 90,
    defaultHeight: 90,
    defaultColor: '#BEFF01',
    tags: ['radar', 'hud', 'xoay', 'công nghệ', 'cyber', 'target', 'tọa độ'],
    description: 'Vòng tròn giao diện Sci-Fi quét mục tiêu xoay liên tục'
  },
  {
    id: 'lottie-globe-network',
    name: 'Quả Cầu Mạng Lưới',
    category: 'tech',
    emoji: '🌐',
    preset: 'globe-network',
    defaultWidth: 90,
    defaultHeight: 90,
    defaultColor: '#00FF88',
    tags: ['toàn cầu', 'internet', 'globe', 'network', 'kết nối', 'vệ tinh'],
    description: 'Địa cầu lưới 3D xoay với các đường truyền dữ liệu'
  },
  {
    id: 'lottie-terminal-cursor',
    name: 'Con Trỏ Code Nhấp Nháy',
    category: 'tech',
    emoji: '💻',
    preset: 'terminal-cursor',
    defaultWidth: 90,
    defaultHeight: 70,
    defaultColor: '#7DD3FC',
    tags: ['code', 'developer', 'terminal', 'lập trình', 'cursor', 'hacker'],
    description: 'Khung gõ lệnh Shell với dấu nhắc nhấp nháy liên tục'
  },

  // ── 4. CHỈ DẪN & MŨI TÊN (Arrows & Guides) ──
  {
    id: 'lottie-arrow-bounce',
    name: 'Mũi Tên Chỉ Xuống',
    category: 'arrow',
    emoji: '⬇️',
    preset: 'arrow-bounce',
    defaultWidth: 80,
    defaultHeight: 80,
    defaultColor: '#FFB800',
    tags: ['mũi tên', 'chỉ xuống', 'xem thêm', 'link in bio', 'arrow', 'hướng dẫn'],
    description: 'Mũi tên neon nhún nhảy chỉ điểm sự chú ý'
  },
  {
    id: 'lottie-arrow-curve',
    name: 'Mũi Tên Uốn Lượn',
    category: 'arrow',
    emoji: '⤵️',
    preset: 'arrow-curve',
    defaultWidth: 85,
    defaultHeight: 85,
    defaultColor: '#BEFF01',
    tags: ['mũi tên cong', 'chú thích', 'nhấn mạnh', 'curve arrow'],
    description: 'Mũi tên uốn cong phong cách ghi chú Creator nổi bật'
  },

  // ── 5. HUY HIỆU & ĐÍCH ĐẾN (Badges & Achievement) ──
  {
    id: 'lottie-check',
    name: 'Dấu Tick Xanh Hoàn Thành',
    category: 'badge',
    emoji: '✅',
    preset: 'check',
    defaultWidth: 85,
    defaultHeight: 85,
    defaultColor: '#BEFF01',
    tags: ['tick', 'xong', 'hoàn thành', 'đúng', 'thành công', 'check'],
    description: 'Vòng tròn nở ra xuất hiện dấu tick phát quang'
  },
  {
    id: 'lottie-trophy-gold',
    name: 'Cúp Vàng Top 1',
    category: 'badge',
    emoji: '🏆',
    preset: 'trophy-gold',
    defaultWidth: 90,
    defaultHeight: 90,
    defaultColor: '#FFD700',
    tags: ['cúp', 'vô địch', 'top 1', 'thắng cuộc', 'trophy', 'champion'],
    description: 'Cúp vàng vinh quang xoay nhẹ tỏa ánh sáng hào quang'
  },
  {
    id: 'lottie-warning-alert',
    name: 'Tam Giác Cảnh Báo',
    category: 'badge',
    emoji: '⚠️',
    preset: 'warning-alert',
    defaultWidth: 85,
    defaultHeight: 85,
    defaultColor: '#FF3366',
    tags: ['cảnh báo', 'chú ý', 'nguy hiểm', 'lưu ý', 'warning', 'alert'],
    description: 'Biển báo nguy hiểm nhấp nháy báo động nổi bật'
  },
  {
    id: 'lottie-timer-clock',
    name: 'Đồng Hồ Đếm Giờ',
    category: 'badge',
    emoji: '⏱️',
    preset: 'timer-clock',
    defaultWidth: 85,
    defaultHeight: 85,
    defaultColor: '#00D4FF',
    tags: ['đồng hồ', 'thời gian', 'đếm ngược', 'gấp rút', 'time', 'fomo'],
    description: 'Kim đồng hồ quay liên tục tạo cảm giác khẩn trương FOMO'
  }
]
