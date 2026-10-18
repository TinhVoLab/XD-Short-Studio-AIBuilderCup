/**
 * Danh mục chuyển cảnh dùng chung cho Panel Chuyển cảnh và Inspector cảnh.
 * id phải khớp getTransitionPresentation() trong src/remotion/MainComposition.tsx.
 * Ghi vào scene.transition = { type, duration } (scene.transitionOut đã deprecated).
 */
export interface TransitionOption {
  id: string
  label: string
  /** Ô xem trước trong Panel Chuyển cảnh */
  preview: string
}

export const TRANSITION_CATALOG: TransitionOption[] = [
  { id: 'none', label: 'Cắt thẳng', preview: '#111' },
  { id: 'crossfade', label: 'Mờ dần', preview: 'linear-gradient(90deg, #1a3a1a 50%, #0a0a0a 50%)' },
  { id: 'slide', label: 'Trượt ngang', preview: 'linear-gradient(90deg, #0a0a0a 40%, #1a3a1a 40%)' },
  { id: 'slide-up', label: 'Trượt lên', preview: 'linear-gradient(0deg, #0a0a0a 40%, #1a3a1a 40%)' },
  { id: 'wipe', label: 'Quét dải', preview: 'linear-gradient(135deg, #1a3a1a 50%, #0a0a0a 50%)' },
  { id: 'flip', label: 'Lật 3D', preview: 'linear-gradient(90deg, #00D4FF 0%, #BEFF01 100%)' },
  { id: 'clock-wipe', label: 'Quét đồng hồ', preview: 'conic-gradient(#BEFF01 0deg, #0a0a0a 180deg)' },
  { id: 'blur', label: 'Nhòe mờ', preview: 'radial-gradient(ellipse, #1a3a1a, #0a0a0a 80%)' },
  { id: 'glitch', label: 'Nhiễu glitch', preview: 'repeating-linear-gradient(0deg, #1a3a1a 0 3px, #0a0a0a 3px 7px)' },
  { id: 'zoom-blur', label: 'Zoom xuyên', preview: 'radial-gradient(circle, #1a3a1a 0%, #0a0a0a 70%)' },
  { id: 'whip-pan', label: 'Lia máy nhanh', preview: 'linear-gradient(90deg, #0a0a0a 0%, #1a3a1a 50%, #0a0a0a 100%)' },
]
