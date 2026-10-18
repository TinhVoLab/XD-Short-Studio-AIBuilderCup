/**
 * Mặc định theo archetype của layer master-hook — SSOT dùng chung cho MasterHookElement (Remotion)
 * và công thức chiều cao (layoutRegistry), để H = f(X) đo đúng chữ đang hiển thị.
 */
// Màu hook theo theme của cảnh (designHook() xoá accentColor riêng) — neon cố định mất tương phản trên theme sáng
const HOOK_ACCENT = 'var(--accent)';
const HOOK_BADGE_BG = 'color-mix(in srgb, var(--accent) 14%, transparent)';
const HOOK_BADGE_BORDER = 'color-mix(in srgb, var(--accent) 45%, transparent)';

export const ARCHETYPE_DEFAULTS = {
  warning: {
    accent: HOOK_ACCENT,
    badgeBg: HOOK_BADGE_BG,
    badgeBorder: HOOK_BADGE_BORDER,
    badgeText: 'CẢNH BÁO QUAN TRỌNG',
    heroTitle: 'DỪNG LÀM ĐIỀU NÀY!',
    highlightWords: ['ĐIỀU', 'NÀY', 'DỪNG'],
    subText: 'Sai lầm 99% người mới mắc phải khiến mất trắng toàn bộ vốn...',
    defaultLayout: 'hazard-alert',
    defaultSfxId: 'sfx_bell',
  },
  tips: {
    accent: HOOK_ACCENT,
    badgeBg: HOOK_BADGE_BG,
    badgeBorder: HOOK_BADGE_BORDER,
    badgeText: 'TOP 3 BÍ KÍP',
    heroTitle: 'TĂNG HIỆU SUẤT X5',
    highlightWords: ['X5', 'HIỆU SUẤT', 'BÍ KÍP'],
    subText: 'Công thức tối ưu hóa công việc trong 30 giây bạn cần biết!',
    defaultLayout: 'sticker-words',
    defaultSfxId: 'sfx_pop',
  },
  curiosity: {
    accent: HOOK_ACCENT,
    badgeBg: HOOK_BADGE_BG,
    badgeBorder: HOOK_BADGE_BORDER,
    badgeText: 'BẠN CÓ BIẾT?',
    heroTitle: 'SỰ THẬT BẤT NGỜ',
    highlightWords: ['SỰ THẬT', 'BẤT NGỜ'],
    subText: 'Lý do người thành công không bao giờ làm điều số đông vẫn làm...',
    defaultLayout: 'stacked',
    defaultSfxId: 'sfx_ding',
  },
  secret: {
    accent: HOOK_ACCENT,
    badgeBg: HOOK_BADGE_BG,
    badgeBorder: HOOK_BADGE_BORDER,
    badgeText: '✦ BÍ MẬT ÍT AI NÓI ✦',
    heroTitle: 'CÔNG THỨC TOP 1%',
    highlightWords: ['TOP 1%', 'BÍ MẬT'],
    subText: 'Chiến lược tăng trưởng bền vững rất ít người dám chia sẻ...',
    defaultLayout: 'cyber-hud',
    defaultSfxId: 'sfx_typewriter',
  },
  versus: {
    accent: HOOK_ACCENT,
    badgeBg: HOOK_BADGE_BG,
    badgeBorder: HOOK_BADGE_BORDER,
    badgeText: 'ĐỐI ĐẦU',
    heroTitle: 'NÊN CHỌN BÊN NÀO?',
    highlightWords: ['BÊN NÀO', 'CHỌN'],
    subText: 'So sánh thực tế chi phí & hiệu năng giữa 2 giải pháp hàng đầu.',
    defaultLayout: 'split-versus',
    defaultSfxId: 'sfx_drumroll',
  },
  healing: {
    accent: HOOK_ACCENT,
    badgeBg: HOOK_BADGE_BG,
    badgeBorder: HOOK_BADGE_BORDER,
    badgeText: 'LẮNG ĐỌNG TÂM TRÍ',
    heroTitle: 'BÌNH AN NỘI TẠI',
    highlightWords: ['BÌNH AN'],
    subText: 'Dừng lại một chút, hít thở thật sâu và lắng nghe chính mình...',
    defaultLayout: 'luxury-zen',
    defaultSfxId: 'sfx_chime',
  },
  custom: {
    accent: HOOK_ACCENT,
    badgeBg: HOOK_BADGE_BG,
    badgeBorder: HOOK_BADGE_BORDER,
    badgeText: '✦ HOOK TIÊU ĐỀ ✦',
    heroTitle: 'TIÊU ĐỀ GIẬT TÍT',
    highlightWords: [],
    subText: 'Nội dung bổ sung giúp giữ chân người xem trong 3 giây đầu.',
    defaultLayout: 'stacked',
    defaultSfxId: 'sfx_whoosh',
  },
};
// Cỡ chữ hero: fitHeroFontSize trong hookLayout.js (đo glyph thật theo layout)
