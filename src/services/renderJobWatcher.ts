import { doc, onSnapshot } from 'firebase/firestore'
import { API_BASE } from '@/config/api'
import { db } from '@/config/firebase'

/**
 * Theo dõi một job render. Nguồn chính: Firestore render_jobs/{jobId} (onSnapshot) — job có thể chạy trên Render
 * Worker (Cloud Run) khác instance API nên không dựa vào SSE / bộ nhớ server. Dự phòng: hỏi /api/render/status
 * mỗi 3s khi snapshot lỗi (offline, chưa đăng nhập, dev không có Firebase). Trả hàm huỷ theo dõi.
 */
export const TERMINAL_RENDER_STATUSES = new Set(['completed', 'failed', 'cancelled'])

export function watchRenderJob(jobId: string, onUpdate: (job: any) => void): () => void {
  let unsubscribe: (() => void) | null = null
  let poll: ReturnType<typeof setInterval> | null = null
  let stopped = false

  const stop = () => {
    stopped = true
    unsubscribe?.()
    unsubscribe = null
    if (poll) clearInterval(poll)
    poll = null
  }
  const emit = (job: any) => {
    if (stopped || !job) return
    onUpdate(job)
    if (TERMINAL_RENDER_STATUSES.has(job.status)) stop()
  }
  const startPolling = () => {
    if (poll || stopped) return
    const check = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/render/status/${jobId}`)
        if (res.ok) emit(await res.json())
      } catch (err) {
        console.error('Render polling error:', err)
      }
    }
    check()
    poll = setInterval(check, 3000)
  }

  try {
    unsubscribe = onSnapshot(
      doc(db, 'render_jobs', jobId),
      snap => { if (snap.exists()) emit(snap.data()) },
      () => { unsubscribe = null; startPolling() },
    )
  } catch {
    startPolling()
  }
  return stop
}
