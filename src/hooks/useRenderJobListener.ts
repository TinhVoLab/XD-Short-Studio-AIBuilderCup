import { useEffect, useRef } from 'react'
import { useEditorStore } from '@/store/useEditorStore'
import { playNotificationSound } from '@/utils/downloadHelper'
import { watchRenderJob, TERMINAL_RENDER_STATUSES } from '@/services/renderJobWatcher'

/** Đồng bộ job render đang chạy (activeRenderJob) với trạng thái trên server — xem watchRenderJob */
export function useRenderJobListener() {
  const { activeRenderJob, updateActiveRenderJob, fetchRemoteQuota, showToast } = useEditorStore()

  const stopRef = useRef<(() => void) | null>(null)
  const watchingRef = useRef<string | null>(null)
  const settledJobsRef = useRef<Set<string>>(new Set())

  const currentJobId = activeRenderJob?.jobId
  const isTerminal = TERMINAL_RENDER_STATUSES.has(activeRenderJob?.status || '')

  useEffect(() => {
    if (!currentJobId || isTerminal) {
      stopRef.current?.()
      stopRef.current = null
      watchingRef.current = null
      return
    }
    if (watchingRef.current === currentJobId) return

    stopRef.current?.()
    watchingRef.current = currentJobId
    stopRef.current = watchRenderJob(currentJobId, job => {
      updateActiveRenderJob({
        progress: job.progress,
        status: job.status,
        stage: job.stage,
        queuePosition: job.queuePosition,
        startedAt: job.startedAt,
        totalFrames: job.totalFrames,
        renderedFrames: job.renderedFrames,
        renderFps: job.renderFps,
        etaSec: job.etaSec,
        downloadUrl: job.downloadUrl,
        outputFilename: job.outputFilename,
        error: job.error,
        renderTimeSec: job.renderTimeSec,
        fileSize: job.fileSize,
      })
      if (!TERMINAL_RENDER_STATUSES.has(job.status) || settledJobsRef.current.has(currentJobId)) return
      settledJobsRef.current.add(currentJobId)
      // Server trừ lượt lúc bắt đầu và hoàn lượt khi lỗi → đồng bộ lại số liệu hạn mức
      fetchRemoteQuota().catch(() => {})
      if (job.status === 'completed') {
        playNotificationSound()
        showToast('Video đã xuất xong. Bấm tải về.', 4000)
      } else if (job.status === 'failed') {
        showToast('Render thất bại: ' + (job.error || 'Lỗi không xác định'), 5000)
      }
    })
  }, [currentJobId, isTerminal, updateActiveRenderJob, fetchRemoteQuota, showToast])

  useEffect(() => () => stopRef.current?.(), [])
}
