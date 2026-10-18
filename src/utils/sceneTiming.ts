import { Scene } from '@/types/scene'
import { sceneTransition, transitionFrames, sceneStartFrames, totalDurationFrames } from '@/config/videoDuration'

// Phép tính mốc thời gian dùng chung với server (tính lượt render) nằm ở src/config/videoDuration.js

/**
 * Transition ở mép ra của cảnh. `scene.transition` là SSOT; `transitionOut` (deprecated,
 * Hook Library cũ) chỉ dùng làm fallback để các template cũ vẫn có chuyển cảnh.
 */
export function getSceneTransition(scene: Scene | undefined): { type: string; duration: number } | undefined {
  return sceneTransition(scene)
}

/**
 * Độ dài transition (giây) mà cảnh yêu cầu ở mép ra, 0 nếu không có transition.
 */
export function getTransitionSec(scene: Scene | undefined): number {
  return getSceneTransition(scene)?.duration ?? 0
}

/**
 * Số frame TransitionSeries gối đầu giữa cảnh này và cảnh kế tiếp (kẹp tối đa nửa cảnh).
 * SSOT cho cả MainComposition lẫn các phép tính mốc thời gian.
 */
export function getTransitionFrames(scene: Scene, fps = 30): number {
  return transitionFrames(scene, fps)
}

/**
 * Chuyển đổi giây sang frame Remotion chuẩn SSOT
 */
export function secondsToFrames(sec: number, fps = 30): number {
  return Math.max(0, Math.round(sec * fps))
}

/**
 * Chuyển đổi frame Remotion sang giây chuẩn SSOT
 */
export function framesToSeconds(frames: number, fps = 30): number {
  return Math.max(0, frames / fps)
}

/**
 * Mốc frame bắt đầu của từng cảnh trong Remotion TransitionSeries (cảnh gối đầu khi có chuyển cảnh):
 * startFrame[k] = startFrame[k-1] + durationFrames[k-1] - transDurationFrames[k-1]
 */
export function getSceneStartFrames(scenes: Scene[], fps = 30): number[] {
  return sceneStartFrames(scenes, fps)
}

/**
 * Tổng thời lượng khung hình thực tế của Remotion Composition
 */
export function getTotalRemotionDurationFrames(scenes: Scene[], audioMaxSec = 0, fps = 30): number {
  return totalDurationFrames(scenes, audioMaxSec, fps)
}

/**
 * Ánh xạ ngược từ frame hiện tại của Remotion Player sang Cảnh hiện tại và Giây tuyến tính của Timeline
 * Sử dụng Piecewise Continuous Linear Interpolation để loại bỏ hoàn toàn hiện tượng giật/nhảy cóc thời gian
 * khi đi qua các vùng Transition overlap.
 */
export function remotionFrameToSceneInfo(scenes: Scene[], frame: number, fps = 30): {
  sceneIdx: number
  linearSec: number
} {
  if (!scenes || scenes.length === 0) {
    return { sceneIdx: 0, linearSec: Math.max(0, frame / fps) }
  }

  const starts = getSceneStartFrames(scenes, fps)
  const n = scenes.length
  
  // Xác định segment chứa frame hiện tại
  let sceneIdx = 0
  for (let i = n - 1; i >= 0; i--) {
    if (frame >= starts[i]) {
      sceneIdx = i
      break
    }
  }

  // Tính mốc giây tuyến tính tích lũy đến đầu cảnh hiện tại
  let linearStartSec = 0
  for (let i = 0; i < sceneIdx; i++) {
    linearStartSec += (scenes[i].duration || 3)
  }

  const curDurSec = scenes[sceneIdx].duration || 3
  // Số frame thực tế của segment này trong Remotion timeline
  const curSegFrames = (sceneIdx < n - 1)
    ? Math.max(1, starts[sceneIdx + 1] - starts[sceneIdx])
    : Math.max(1, Math.round(curDurSec * fps))

  const elapsedFrames = Math.max(0, frame - starts[sceneIdx])
  const progressInSegment = Math.min(1, elapsedFrames / curSegFrames)
  const linearSec = linearStartSec + progressInSegment * curDurSec

  return { sceneIdx, linearSec }
}

/**
 * Ánh xạ xuôi từ Giây tuyến tính của Timeline sang frame tương ứng trong Remotion Player
 * Đảm bảo tính thuận nghịch 100% hai chiều với remotionFrameToSceneInfo
 */
/**
 * Đặt audio clip (voice/SFX) theo giây tuyến tính của Timeline vào frame Remotion.
 * Khác sceneTimeToRemotionFrame (nén tuyến tính để playhead liên tục), hàm này giữ nguyên
 * offset tính từ đầu cảnh — khớp với animation của element vốn chạy theo frame cục bộ của cảnh.
 * Nhờ vậy SFX neo theo từ phát đúng lúc giọng đọc, kể cả khi transition gối đầu các cảnh.
 */
export function sceneTimeToAudioFrame(scenes: Scene[], linearSec: number, fps = 30): number {
  if (!scenes || scenes.length === 0) {
    return Math.max(0, Math.round(linearSec * fps))
  }

  const starts = getSceneStartFrames(scenes, fps)
  let linearAcc = 0
  for (let i = 0; i < scenes.length; i++) {
    const dur = scenes[i].duration || 3
    if (linearSec < linearAcc + dur || i === scenes.length - 1) {
      return Math.max(0, starts[i] + Math.round((linearSec - linearAcc) * fps))
    }
    linearAcc += dur
  }
  return Math.max(0, Math.round(linearSec * fps))
}

export function sceneTimeToRemotionFrame(scenes: Scene[], linearSec: number, fps = 30): number {
  if (!scenes || scenes.length === 0) {
    return Math.max(0, Math.round(linearSec * fps))
  }

  const starts = getSceneStartFrames(scenes, fps)
  const n = scenes.length

  let linearAcc = 0
  let sceneIdx = 0
  for (let i = 0; i < n; i++) {
    const dur = scenes[i].duration || 3
    if (linearSec < linearAcc + dur || i === n - 1) {
      sceneIdx = i
      break
    }
    linearAcc += dur
  }

  const curDurSec = scenes[sceneIdx].duration || 3
  const curSegFrames = (sceneIdx < n - 1)
    ? Math.max(1, starts[sceneIdx + 1] - starts[sceneIdx])
    : Math.max(1, Math.round(curDurSec * fps))

  const elapsedSec = Math.max(0, Math.min(curDurSec, linearSec - linearAcc))
  const progressInSegment = curDurSec > 0 ? (elapsedSec / curDurSec) : 0
  const targetFrame = Math.round(starts[sceneIdx] + progressInSegment * curSegFrames)

  return Math.max(0, targetFrame)
}
