/**
 * Camera ảo của cảnh — hàm thuần để kiểm chứng bằng test (tests/unit/cameraMotion.test.ts).
 *
 * Transform áp dụng: `scale(s) translate(x, y) rotate(θ)` quanh tâm khung. Hai ràng buộc:
 *  1. PHỦ KHUNG: lớp cảnh luôn phủ kín khung hình (không lộ nền composition ở mép):
 *     s ≥ W / (W − 2|x| − H·sinθ)
 *  2. GIỮ NỘI DUNG: thẻ rộng 88% khung (half-width CONTENT_HALF_W) vẫn cách mép ≥ EDGE_MARGIN:
 *     s · (CONTENT_HALF_W + CONTENT_HALF_H·sinθ + |x|) ≤ W/2 − EDGE_MARGIN
 */

export type CameraMotion = 'static' | 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right' | 'shake'

export interface CameraPose {
  scale: number
  x: number
  y: number
  rotate: number // deg
}

export const CAMERA_FRAME = { width: 360, height: 640 }
/** Nửa bề rộng của thẻ rộng nhất (88% khung) và nửa chiều cao vùng nội dung an toàn (60–480) */
export const CONTENT_HALF_W = 360 * 0.88 / 2
export const CONTENT_HALF_H = 260
export const EDGE_MARGIN = 6

const PAN_TILT_DEG = 0.3
const ZOOM_TILT_DEG = 0.3
const SHAKE_TILT_DEG = 0.6
const SHAKE_X = 5
const SHAKE_Y = 4

const sinDeg = (deg: number) => Math.sin((Math.abs(deg) * Math.PI) / 180)

/** Độ phóng nhỏ nhất để phủ kín khung khi dịch |x|, |y| và nghiêng θ */
export function minCoverScale(x: number, y: number, rotateDeg: number, { width, height } = CAMERA_FRAME): number {
  const s = sinDeg(rotateDeg)
  return Math.max(
    width / Math.max(1, width - 2 * Math.abs(x) - height * s),
    height / Math.max(1, height - 2 * Math.abs(y) - width * s),
  )
}

/** Độ phóng lớn nhất mà nội dung 88% vẫn cách mép ≥ EDGE_MARGIN */
export function maxContentScale(x: number, rotateDeg: number, { width } = CAMERA_FRAME): number {
  return (width / 2 - EDGE_MARGIN) / (CONTENT_HALF_W + CONTENT_HALF_H * sinDeg(rotateDeg) + Math.abs(x))
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.min(1, Math.max(0, t))

/**
 * Tư thế camera tại tiến độ cảnh t ∈ [0, 1].
 * energy 0..1 điều khiển biên độ; noise ∈ [-1, 1] (cho shake) do caller cung cấp để giữ tính tất định.
 */
export function computeCameraPose(
  motion: CameraMotion | undefined,
  t: number,
  energy: number,
  noise: { x: number; y: number; r: number } = { x: 0, y: 0, r: 0 }
): CameraPose {
  const e = Math.min(1, Math.max(0, energy))

  switch (motion) {
    case 'zoom-in':
    case 'zoom-out': {
      const rotate = (motion === 'zoom-in' ? lerp(-1, 1, t) : lerp(1, -1, t)) * ZOOM_TILT_DEG
      const cover = minCoverScale(0, 0, ZOOM_TILT_DEG)
      const peak = Math.min(maxContentScale(0, ZOOM_TILT_DEG), cover + 0.03 + 0.04 * e)
      const scale = motion === 'zoom-in' ? lerp(cover, peak, t) : lerp(peak, cover, t)
      return { scale, x: 0, y: 0, rotate }
    }
    case 'pan-left':
    case 'pan-right': {
      const range = 2 + 4 * e // tối đa 6px — lớn hơn sẽ đẩy thẻ 88% ra sát mép
      const x = motion === 'pan-right' ? lerp(-range, range, t) : lerp(range, -range, t)
      const rotate = motion === 'pan-right' ? PAN_TILT_DEG : -PAN_TILT_DEG
      return { scale: minCoverScale(range, 0, PAN_TILT_DEG), x, y: 0, rotate }
    }
    case 'shake': {
      const x = noise.x * SHAKE_X
      const y = noise.y * SHAKE_Y
      return { scale: minCoverScale(SHAKE_X, SHAKE_Y, SHAKE_TILT_DEG), x, y, rotate: noise.r * SHAKE_TILT_DEG }
    }
    case 'static':
    default:
      return { scale: 1, x: 0, y: 0, rotate: 0 }
  }
}

/**
 * Kết hợp tư thế chuyển động với cú "punch" đầu cảnh (phóng + rung) mà vẫn giữ 2 ràng buộc:
 * độ phóng tổng không vượt trần giữ nội dung, không thấp hơn mức phủ khung.
 */
/** Độ dịch ngang lớn nhất mà cả 2 ràng buộc (phủ khung & giữ nội dung) còn thoả được cùng lúc */
function maxFeasibleShift(y: number, rotateDeg: number): number {
  let lo = 0
  let hi = CAMERA_FRAME.width / 4
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2
    if (minCoverScale(mid, y, rotateDeg) <= maxContentScale(mid, rotateDeg)) lo = mid
    else hi = mid
  }
  return lo
}

export function composeCameraPose(base: CameraPose, punchScale: number, shakeX: number, driftX = 0, driftY = 0): CameraPose {
  const y = base.y + driftY
  // Rung của punch cộng pan ở biên có thể vượt vùng khả thi → kẹp độ dịch tổng
  const limit = maxFeasibleShift(y, base.rotate)
  const x = Math.max(-limit, Math.min(limit, base.x + shakeX + driftX))
  const cover = minCoverScale(x, y, base.rotate)
  const cap = Math.max(cover, maxContentScale(x, base.rotate))
  return { scale: Math.min(cap, Math.max(cover, base.scale * punchScale)), x, y, rotate: base.rotate }
}
