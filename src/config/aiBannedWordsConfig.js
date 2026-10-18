/**
 * ─────────────────────────────────────────────────────────────────
 *  AI BANNED WORDS CONFIG — Single Source of Truth
 *  Imported by: frontend (store, UI) + server (sanitizer, prompt)
 * ─────────────────────────────────────────────────────────────────
 *
 *  Thêm từ mới? Chỉ cần sửa SMART_REPLACEMENTS.
 *  Presets và defaults tự derive từ đây.
 */

// ── 1. TỪ ĐIỂN THAY THẾ THÔNG MINH ───────────────────────────────
// Key   = từ cần loại bỏ (lowercase)
// Value = từ thay thế tự nhiên ('' = xóa hẳn)
export const SMART_REPLACEMENTS = {
  // --- Nhóm TikTok Safety (bị thuật toán kiểm duyệt / bóp reach) ---
  'chết người':     'nghiêm trọng',
  'tử vong':        'nguy kịch',
  'lừa đảo':        'gian lận',
  'chữa dứt điểm':  'cải thiện hiệu quả',
  'cam kết 100%':   'hỗ trợ tối đa',
  'máu me':         'căng thẳng',
  'giết':           'loại bỏ',
  'tự tử':          'tiêu cực',
  'khủng bố':       'đe dọa nghiêm trọng',

  // --- Nhóm AI Clichés (sáo rỗng mùi bot) ---
  'kỷ nguyên mới':            'thời kỳ phát triển',
  'kỷ nguyên':                'thời điểm',
  'bật mí':                   'chia sẻ',
  'bước ngoặt vĩ đại':        'thay đổi lớn',
  'bước ngoặt':               'thay đổi',
  'vén màn bí mật':           'tiết lộ sự thật',
  'không thể tin được':       'đáng kinh ngạc',
  'thần thánh':               'vượt trội',
  'siêu phẩm':                'sản phẩm nổi bật',
  'chấn động':                'bất ngờ',
  'chết tiệt':                'tệ hại',
  'vi diệu':                  'kỳ diệu',
  'bất ngờ chưa':             'thực tế là',
  'hãy cùng tôi tìm hiểu':    'cùng xem',
  'hãy cùng khám phá':        'cùng xem',
  'chào các bạn':             '',
  'vượt bậc':                 'nổi bật',
  'không thể bỏ qua':         'đáng chú ý',
};

// ── 2. PRESETS (derive từ dict — không cần sync thủ công) ─────────

export const TIKTOK_SAFETY_PRESET = [
  'chết người', 'tử vong', 'lừa đảo', 'chữa dứt điểm',
  'cam kết 100%', 'máu me', 'giết', 'tự tử', 'khủng bố',
];

export const AI_CLICHE_PRESET = [
  'kỷ nguyên mới', 'kỷ nguyên', 'bật mí', 'bước ngoặt vĩ đại',
  'bước ngoặt', 'vén màn bí mật', 'không thể tin được',
  'hãy cùng tôi tìm hiểu', 'hãy cùng khám phá',
  'chào các bạn', 'vượt bậc', 'không thể bỏ qua',
];

/** Danh sách từ cấm mặc định khi user chưa tùy chỉnh */
export const DEFAULT_AI_BANNED_WORDS = [
  ...new Set([...TIKTOK_SAFETY_PRESET, ...AI_CLICHE_PRESET]),
];

// ── 3. HUMANIZER PROMPT CONSTRAINTS ──────────────────────────────
// Dùng trong system prompt gửi AI — không hardcode rải rác nữa
export const HUMANIZER_PROMPT_CLICHÉS = [
  '"Bạn có biết..."',
  '"Hãy cùng tôi khám phá..."',
  '"Chào mừng các bạn đến với..."',
  '"Bật mí"',
  '"Kỷ nguyên mới"',
  '"Bước ngoặt lịch sử"',
  '"Vén màn bí mật"',
  '"Không thể tin được"',
  '"Hãy cùng tôi tìm hiểu"',
];
