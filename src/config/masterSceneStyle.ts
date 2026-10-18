/**
 * Ánh xạ "tông" của masterSceneLayout sang token theme (CSS vars của cảnh) — Remotion dùng trực tiếp,
 * Fabric dùng bản resolve màu thật (masterSceneFabricRenderer). Nền ngà / nền màu nhấn đổi token nên tông tự đổi theo.
 */
export const MASTER_TONE_CSS: Record<string, string> = {
  text: 'var(--text)',
  accent: 'var(--accent)',
  accentFill: 'var(--accent-fill)',
  sub: 'var(--text-sub)',
  onAccent: 'var(--on-accent)',
  // Chữ trên mảng accentFill (khối tô màu nhấn): trên nền ngà khác onAccent
  onAccentFill: 'var(--on-accent-fill)',
  // Nền cảnh (chữ tối trên khối sáng, vd chữ trong vòng tròn màu chữ)
  bg: 'var(--bg)',
  // Chữ thường, có vạch màu nhấn chạy dưới (layout vẽ vạch riêng)
  mark: 'var(--text)',
  line: 'color-mix(in srgb, var(--text) 14%, transparent)',
  track: 'color-mix(in srgb, var(--text) 18%, transparent)',
  panel: 'color-mix(in srgb, var(--text) 7%, transparent)',
  ghost: 'color-mix(in srgb, var(--text) 3%, transparent)',
}

/** Độ mờ của các tông nền pha từ màu chữ (Fabric pha bằng rgba cùng tỉ lệ) */
export const MASTER_TONE_ALPHA: Record<string, number> = { line: 0.14, track: 0.18, panel: 0.07, ghost: 0.03 }

/** Độ mờ cuối của chuyển động 'dim' (lựa chọn sai ở Đáp án) — Fabric vẽ trạng thái cuối này */
export const MASTER_DIM_OPACITY = 0.32

/** Icon: path tô màu (mặc định) hoặc nét (stroke = độ dày nét theo hệ toạ độ viewBox) */
export const MASTER_ICON_PATHS: Record<string, { viewBox: string; d: string; stroke?: number }> = {
  pause: { viewBox: '0 0 24 24', d: 'M7 5h3a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm7 0h3a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z' },
  bookmark: { viewBox: '0 0 24 29', d: 'M4 2h16v25l-8-5.5L4 27z' },
  plane: { viewBox: '0 0 24 24', d: 'M3 11.5 21 3l-8.5 18-2.2-7.3z' },
  arrowDown: { viewBox: '0 0 24 40', d: 'M12 2v34M5 29l7 7 7-7', stroke: 2 },
  arrowDownShort: { viewBox: '0 0 20 26', d: 'M10 2v20M4 16l6 6 6-6', stroke: 2 },
  cross: { viewBox: '0 0 24 24', d: 'M6 6l12 12M18 6 6 18', stroke: 2.5 },
  check: { viewBox: '0 0 24 24', d: 'M5 12l5 5L20 7', stroke: 2.5 },
  lock: { viewBox: '0 0 24 24', d: 'M7 11h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2zM8 11V8a4 4 0 0 1 8 0v3', stroke: 2 },
  user: { viewBox: '0 0 24 24', d: 'M12 4a4 4 0 1 0 0 8a4 4 0 1 0 0-8zM4 21c1.5-4 4.5-6 8-6s6.5 2 8 6', stroke: 2 },
  comment: { viewBox: '0 0 24 24', d: 'M4 5h16v11H9l-5 4z', stroke: 2 },
}
