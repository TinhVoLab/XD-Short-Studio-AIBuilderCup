import { Scene, AudioTrackClip } from '@/types/scene'
import { getAudioDuration } from './audio'
import { API_BASE, apiFetch } from '@/config/api'
import { fitSceneDurationToAudio } from '@/config/pacingConfig'
import { getTransitionSec } from './sceneTiming'

export interface BatchProgressInfo {
  completed: number
  total: number
  currentSceneId?: string
  sceneIndex?: number
  status: 'pending' | 'generating' | 'measuring' | 'done' | 'error'
  duration?: number
  errorMsg?: string
}

export interface BatchGenerationResult {
  sceneUpdates: Array<{ id: string; patch: Partial<Scene> }>
  audioClips: AudioTrackClip[]
  totalDuration: number
  successCount: number
  failCount: number
  /** Lỗi đầu tiên (nếu có cảnh lỗi) — để báo người dùng lý do, ví dụ vượt giới hạn giọng đọc */
  firstError?: string
}

/** Giọng Neural đi Edge-TTS (miễn phí), giọng khác đi Gemini TTS */
export function ttsEndpoint(voiceName: string) {
  return voiceName.includes('Neural') ? '/api/ai/edge-tts' : '/api/ai/tts'
}

/**
 * Gọi TTS kèm token đăng nhập (server yêu cầu đăng nhập + giới hạn ký tự).
 * Chỉ thử lại khi mất mạng, quá giờ hoặc lỗi 5xx; lỗi 4xx (401/413/429) trả ngay câu báo lỗi của server.
 */
export async function requestTts(
  apiBase: string,
  voiceName: string,
  body: Record<string, unknown>,
  { retries = 3, timeoutMs = 35000 }: { retries?: number; timeoutMs?: number } = {}
): Promise<any> {
  const url = `${apiBase}${ttsEndpoint(voiceName)}`
  for (let i = 0; i < retries; i++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await apiFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, voiceName }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        const err: any = new Error(data?.error || `Máy chủ giọng đọc lỗi (HTTP ${res.status})`)
        err.status = res.status
        throw err
      }
      if (!data) throw new Error('Máy chủ giọng đọc trả về dữ liệu không hợp lệ')
      return data
    } catch (err: any) {
      clearTimeout(timeoutId)
      if (err.name === 'AbortError') err.message = 'Tạo giọng đọc quá thời gian chờ'
      else if (err.message === 'Failed to fetch' || err.name === 'TypeError') err.message = 'Không kết nối được máy chủ giọng đọc'
      const isClientError = err.status >= 400 && err.status < 500
      if (isClientError || i === retries - 1) throw err
      // Exponential backoff with jitter
      await new Promise(r => setTimeout(r, 600 * Math.pow(2, i) + Math.random() * 300))
    }
  }
}

/**
 * Generate Voiceover Audio for multiple scenes in parallel with controlled concurrency
 */
export async function generateBatchVoiceovers(
  scenes: Scene[],
  voiceName: string,
  apiKey: string,
  apiBase = API_BASE,
  options: {
    concurrency?: number
    onProgress?: (progress: BatchProgressInfo) => void
    targetSceneIds?: string[] // Mảng ID các cảnh cần render TTS
    rate?: string             // Mood: tốc độ đọc đồng nhất (e.g. '+0%', '+10%')
    pitch?: string            // Mood: cao độ giọng đồng nhất (e.g. '+0Hz', '-5Hz')
    signal?: AbortSignal      // Hỗ trợ dừng quá trình tạo
    projectId?: string        // ID dự án để lưu trữ âm thanh độc lập
  } = {}
): Promise<BatchGenerationResult> {
  const { concurrency = 5, onProgress, targetSceneIds, rate, pitch, signal, projectId } = options

  // Lọc các cảnh cần xử lý (thoả mãn: có voiceoverText VÀ nằm trong targetSceneIds nếu được cung cấp)
  const eligibleScenes = scenes.filter(s => {
    const hasText = s.voiceoverText && s.voiceoverText.trim().length > 0
    if (!hasText) return false
    if (targetSceneIds && targetSceneIds.length > 0) {
      return targetSceneIds.includes(s.id)
    }
    return true
  })
  const total = eligibleScenes.length

  if (total === 0) {
    return {
      sceneUpdates: [],
      audioClips: [],
      totalDuration: 0,
      successCount: 0,
      failCount: 0
    }
  }

  let completedCount = 0
  let firstError: string | undefined

  // Intermediate map of sceneId -> result
  const sceneResults = new Map<string, { url: string; duration: number; fitDuration: number; voiceName: string; wordTimings?: any[] }>()

  // Worker task queue
  const queue = [...eligibleScenes]

  return new Promise<BatchGenerationResult>((resolve) => {
    const checkCompletion = () => {
      if (completedCount >= total) {
        // Calculate cumulative timeline stacking for track A1
        let cumulativeStartSec = 0
        const sceneUpdates: Array<{ id: string; patch: Partial<Scene> }> = []
        const audioClips: AudioTrackClip[] = []

        scenes.forEach((s) => {
          const res = sceneResults.get(s.id)
          if (res) {
            // Tự động gắn wordTimings vào phần tử phụ đề trong cảnh
            const updatedElements = s.elements
              ? s.elements.map(el => {
                  if (el.type === 'caption' || el.captionStyle) {
                    return { ...el, wordTimings: res.wordTimings }
                  }
                  return el
                })
              : s.elements

            sceneUpdates.push({
              id: s.id,
              patch: {
                voiceoverUrl: res.url,
                voiceName: res.voiceName,
                duration: res.fitDuration,
                audioDuration: res.fitDuration,
                voiceoverWordTimings: res.wordTimings,
                elements: updatedElements
              }
            })

            audioClips.push({
              id: `voice-${s.id}-${Date.now()}`,
              name: `🎙️ ${res.voiceName.replace('Neural', '').replace('vi-VN-', '')} · ${s.name}`,
              url: res.url,
              startSec: cumulativeStartSec,
              duration: res.duration,
              playDurationSec: res.duration,
              volume: 1.0,
              trackId: 'A1',
              sceneId: s.id,
            })

            cumulativeStartSec += res.fitDuration
          } else {
            // Scene without voiceover keeps original duration
            cumulativeStartSec += s.duration || 3
          }
        })

        resolve({
          sceneUpdates,
          audioClips,
          totalDuration: cumulativeStartSec,
          successCount: sceneResults.size,
          failCount: total - sceneResults.size,
          firstError,
        })
      }
    }

    const runNext = async () => {
      if (signal?.aborted) {
        // Resolve early with whatever was generated so far
        completedCount = total
        checkCompletion()
        return
      }

      if (queue.length === 0) return

      const scene = queue.shift()!

      if (onProgress) {
        onProgress({
          completed: completedCount,
          total,
          currentSceneId: scene.id,
          status: 'generating'
        })
      }

      try {
        const text = scene.voiceoverText!.trim()
        const data = await requestTts(apiBase, voiceName, {
          text,
          apiKey: apiKey.trim(),
          // Ưu tiên dùng rate/pitch từ Global Mood thay vì temporalRole (tránh không đồng nhất)
          rate: rate || undefined,
          pitch: pitch || undefined,
          silenceGapSec: scene.silenceGapSec,
          silencePosition: scene.silencePosition,
          projectId: projectId || undefined,
          sceneId: scene.id,
        })

        // ⚡ Performance optimization: Use server-measured ffprobe duration directly if valid,
        // eliminating redundant client-side Web Audio fetch & decode roundtrip.
        let rawDur = (typeof data.duration === 'number' && data.duration > 0) ? data.duration : 0
        if (!rawDur) {
          if (onProgress) {
            onProgress({
              completed: completedCount,
              total,
              currentSceneId: scene.id,
              status: 'measuring'
            })
          }
          rawDur = await getAudioDuration(data.url)
        }

        const realDuration = Math.max(1.2, Math.round(rawDur * 10) / 10)
        // Đệm cuối cảnh phải dài hơn transition gối đầu để giọng hai cảnh không chồng nhau
        const fitSceneDuration = fitSceneDurationToAudio(realDuration, getTransitionSec(scene))

        sceneResults.set(scene.id, {
          url: data.url,
          duration: realDuration,
          fitDuration: fitSceneDuration,
          voiceName: voiceName,
          wordTimings: data.wordTimings || []
        })

        completedCount++
        if (onProgress) {
          onProgress({
            completed: completedCount,
            total,
            currentSceneId: scene.id,
            status: 'done',
            duration: realDuration
          })
        }
      } catch (err: any) {
        console.error(`[BatchTTS] Failed for scene ${scene.id}:`, err)
        if (!firstError) firstError = err.message
        completedCount++
        if (onProgress) {
          onProgress({
            completed: completedCount,
            total,
            currentSceneId: scene.id,
            status: 'error',
            errorMsg: err.message
          })
        }
      } finally {
        checkCompletion()
        if (queue.length > 0) {
          runNext()
        }
      }
    }

    // Launch initial batch of workers up to concurrency limit (Default: 3)
    const initialWorkers = Math.min(concurrency, queue.length)
    for (let i = 0; i < initialWorkers; i++) {
      runNext()
    }
  })
}
