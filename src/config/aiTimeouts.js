/**
 * SSOT thời gian chờ AI tạo kịch bản (/api/ai/scene-design) — dùng chung cho server (deadline từng stage)
 * và client (timeout fetch). Client luôn chờ lâu hơn ngân sách server để không bỏ cuộc khi server vẫn đang chạy.
 */

export const AI_TIMEOUTS = {
  /**
   * Production gọi API qua rewrite của Firebase Hosting (VITE_API_URL trống) — Hosting cắt mọi request sau 60s.
   * Thời gian chờ của client phải nhỏ hơn mốc này, để người dùng thấy thông báo hết giờ của app thay vì lỗi 504 của Hosting.
   */
  GATEWAY_TIMEOUT_MS: 60000,
  /** Stage 1: viết kịch bản lời thoại */
  STAGE1_MS: 20000,
  /** Stage 1 với model suy luận (deepseek-reasoner / r1) — quá giờ thì Stage 2 tự viết lời thoại */
  STAGE1_REASONER_MS: 22000,
  /** Stage 2: thiết kế bố cục và phần tử cho toàn bộ cảnh (được cộng phần Stage 1 dùng chưa hết) */
  STAGE2_MS: 30000,
  /** Stage 2 chỉ chuyển sang engine dự phòng khi còn ít nhất chừng này thời gian */
  STAGE2_FALLBACK_MIN_MS: 15000,
  /** Phần đệm phía client: mạng + hậu xử lý + ghi log */
  CLIENT_BUFFER_MS: 5000,
};

export function isReasonerModel(model) {
  const m = String(model || '');
  return m.includes('reasoner') || m.includes('r1');
}

/** Tổng thời gian server được phép dùng cho một request */
export function serverBudgetMs({ isReasoner = false } = {}) {
  return (isReasoner ? AI_TIMEOUTS.STAGE1_REASONER_MS : AI_TIMEOUTS.STAGE1_MS) + AI_TIMEOUTS.STAGE2_MS;
}

/** Thời gian client chờ phản hồi */
export function clientTimeoutMs({ isReasoner = false } = {}) {
  return serverBudgetMs({ isReasoner }) + AI_TIMEOUTS.CLIENT_BUFFER_MS;
}

/** Thời gian còn lại tới deadline (ms), không âm */
export function remainingMs(deadline, now = Date.now()) {
  return Math.max(0, deadline - now);
}
