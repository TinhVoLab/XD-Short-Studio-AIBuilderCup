import assert from 'assert/strict'
import {
  computeCameraPose,
  composeCameraPose,
  minCoverScale,
  maxContentScale,
  CameraMotion,
} from '@/remotion/hooks/cameraMotion'

/**
 * Mọi tư thế camera phải: (1) phủ kín khung — không lộ nền ở mép; (2) giữ thẻ rộng 88% cách mép ≥ 6px.
 * Chặn tái phát lỗi pan ±24px đẩy chữ ra ngoài khung / lộ dải nền tối.
 */
const motions: CameraMotion[] = ['static', 'zoom-in', 'zoom-out', 'pan-left', 'pan-right', 'shake']
const EPS = 1e-6

for (const motion of motions) {
  for (const energy of [0, 0.5, 1]) {
    for (let i = 0; i <= 20; i++) {
      const t = i / 20
      for (const n of [-1, 0, 1]) {
        const base = computeCameraPose(motion, t, energy, { x: n, y: -n, r: n })
        // punch đầu cảnh: phóng tối đa 1.045 + rung 3.5px, cùng drift nền ±0.8px
        for (const [punch, shake] of [[1, 0], [1.045, 0], [1.02, 3.5], [1.02, -3.5]]) {
          const pose = composeCameraPose(base, punch, shake, 0.8 * n, 0.6 * n)
          const label = `${motion} e=${energy} t=${t} n=${n} punch=${punch} shake=${shake}`
          assert.ok(pose.scale + EPS >= minCoverScale(pose.x, pose.y, pose.rotate), `${label}: lộ nền ở mép khung`)
          if (motion !== 'shake') {
            assert.ok(pose.scale <= maxContentScale(pose.x, pose.rotate) + EPS, `${label}: thẻ 88% sát/vượt mép`)
          }
        }
      }
    }
  }
}

// Biên độ vẫn đủ để thấy chuyển động
assert.ok(Math.abs(computeCameraPose('pan-right', 1, 1).x) >= 5, 'pan quá nhỏ')
assert.ok(computeCameraPose('zoom-in', 1, 1).scale - computeCameraPose('zoom-in', 0, 1).scale >= 0.05, 'zoom quá nhỏ')
