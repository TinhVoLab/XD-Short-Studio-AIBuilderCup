import { Scene } from '@/types/scene'
import { effectiveSceneRole, isPeakScene } from '@/config/sceneRoles'

export interface EmotionHeatPoint {
  timeSec: number
  score: number // 0 - 100
  label?: string
  type: 'hook' | 'build' | 'climax' | 'cta'
}

export interface FlowHealthMetrics {
  score: number // 0 - 100
  grade: 'Good' | 'Fair' | 'Viral'
  retentionPct: number
  pacingPct: number
  clarityPct: number
  engagementPct: number
}

export interface CalculatedHeatData {
  points: EmotionHeatPoint[]
  overallHealth: FlowHealthMetrics
  hotSpots: Array<{ timeSec: number; score: number; label: string; type: string }>
}

/**
 * Thuật toán Heuristic chấm điểm nhịp độ, giữ chân và cảm xúc dựa trên khoa học video ngắn.
 * Chạy 100% Client-side, cực nhẹ (< 2ms cho 20 cảnh), Pure function, không sinh side-effect.
 */
export function calculateEmotionHeatData(scenes: Scene[]): CalculatedHeatData {
  if (!scenes || scenes.length === 0) {
    return {
      points: [{ timeSec: 0, score: 70, type: 'build' }],
      overallHealth: {
        score: 70,
        grade: 'Fair',
        retentionPct: 70,
        pacingPct: 70,
        clarityPct: 70,
        engagementPct: 70
      },
      hotSpots: []
    }
  }

  let currentTime = 0
  const points: EmotionHeatPoint[] = []
  const hotSpots: Array<{ timeSec: number; score: number; label: string; type: string }> = []

  let totalScoreAcc = 0
  let pacingScoreAcc = 0
  let clarityScoreAcc = 0
  let engagementScoreAcc = 0

  scenes.forEach((scene, index) => {
    const dur = Math.max(0.5, scene.duration || 3)

    // 1. Phân loại vai trò tự nhiên nếu chưa được gán
    const role = effectiveSceneRole(scene, index, scenes.length)

    // 2. Điểm cơ sở (Base score)
    let baseScore = 75
    let pointType: 'hook' | 'build' | 'climax' | 'cta' = 'build'
    let label = ''

    if (role === 'hook') {
      baseScore = 92
      pointType = 'hook'
      label = 'Hook Peak'
    } else if (isPeakScene(role)) {
      baseScore = 88
      pointType = 'climax'
      label = 'Viral Climax'
    } else if (role === 'cta') {
      baseScore = 78
      pointType = 'cta'
      label = 'CTA Boost'
    } else {
      baseScore = 76
      pointType = 'build'
    }

    // 3. Heuristic Phạt / Thưởng
    // A. Phạt cảnh quá dài mà ít nội dung chuyển động
    const elementCount = scene.elements?.length || 0
    if (dur > 4.5 && elementCount <= 2 && !scene.cameraMotion) {
      baseScore -= 8 // Nguy cơ người xem lướt qua do nhịp chùng
    } else if (dur <= 2.5 && elementCount >= 2) {
      baseScore += 5 // Nhịp cắt nhanh giữ chân tốt
    }

    // B. Thưởng khi có Voiceover + SFX hoặc chuyển động máy ảnh
    if (scene.cameraMotion && scene.cameraMotion !== 'static') {
      baseScore += 4
    }
    if ((scene.soundEffects && scene.soundEffects.length > 0) || scene.voiceoverUrl) {
      baseScore += 5
    }
    if (scene.authorAvatarUrl && scene.authorAvatarEffect && scene.authorAvatarEffect !== 'none') {
      baseScore += 3
    }

    // Giới hạn trong khoảng 45 - 98
    const finalSceneScore = Math.min(98, Math.max(45, baseScore))

    // 4. Tạo điểm trên đường cong nhiệt với biên độ đỉnh & đáy (Peaks & Valleys) rõ rệt
    const startTime = currentTime
    const midTime = Number((currentTime + dur * 0.5).toFixed(2))
    const endTime = Number((currentTime + dur).toFixed(2))

    // Xác định đáy sóng (valley) và đỉnh sóng (peak) dựa theo vai trò kịch bản
    let startScore = 60
    let peakScore = finalSceneScore
    let valleyScore = 58

    if (role === 'hook') {
      startScore = 62
      peakScore = Math.max(90, finalSceneScore)
      valleyScore = 64
    } else if (isPeakScene(role)) {
      startScore = 58
      peakScore = Math.max(86, finalSceneScore)
      valleyScore = 60
    } else if (role === 'cta') {
      startScore = 58
      peakScore = Math.max(76, finalSceneScore)
      valleyScore = 68
    } else {
      // Cảnh dẫn dắt (Normal) nằm ở vùng đáy/nhịp thở (58 - 66)
      startScore = 58
      peakScore = Math.min(68, finalSceneScore - 10)
      valleyScore = 56
    }

    // Điểm đầu cảnh (nếu là điểm đầu tiên hoặc chuyển cảnh)
    if (points.length === 0 || points[points.length - 1].timeSec < startTime) {
      points.push({
        timeSec: Number(startTime.toFixed(2)),
        score: startScore,
        type: pointType
      })
    }

    // Điểm đỉnh giữa cảnh (Peak)
    points.push({
      timeSec: midTime,
      score: peakScore,
      label: label || undefined,
      type: pointType
    })

    if (label) {
      hotSpots.push({
        timeSec: midTime,
        score: peakScore,
        label,
        type: pointType
      })
    }

    // Điểm cuối cảnh chuyển tiếp (Valley)
    points.push({
      timeSec: endTime,
      score: valleyScore,
      type: pointType
    })

    // Tích luỹ metrics
    totalScoreAcc += finalSceneScore
    pacingScoreAcc += dur <= 3.5 ? 88 : 72
    clarityScoreAcc += (scene.voiceoverText?.length || 0) > 0 || elementCount > 0 ? 94 : 76
    engagementScoreAcc += finalSceneScore > 85 ? 86 : 74

    currentTime += dur
  })

  const count = scenes.length
  const avgScore = Math.round(totalScoreAcc / count)
  const pacingPct = Math.round(pacingScoreAcc / count)
  const clarityPct = Math.round(clarityScoreAcc / count)
  const engagementPct = Math.round(engagementScoreAcc / count)
  const retentionPct = Math.round((avgScore * 0.6) + (pacingPct * 0.4))

  let grade: 'Good' | 'Fair' | 'Viral' = 'Good'
  if (avgScore >= 88) grade = 'Viral'
  else if (avgScore < 75) grade = 'Fair'

  return {
    points,
    overallHealth: {
      score: avgScore,
      grade,
      retentionPct,
      pacingPct,
      clarityPct,
      engagementPct
    },
    hotSpots
  }
}
