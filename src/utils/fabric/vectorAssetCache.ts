/**
 * Cache ảnh cho bộ vẽ Fabric khi hình phải dựng bất đồng bộ (SVG phân tử, công thức KaTeX).
 * Bộ vẽ Fabric chạy đồng bộ: lần đầu chưa có ảnh → bắt đầu tải, trả null; khi ảnh sẵn sàng →
 * báo cho useFabric đồng bộ lại, fingerprint đổi (isAssetReady) nên thành phần được vẽ lại với ảnh.
 */

type Entry = { status: 'loading' } | { status: 'ready'; img: HTMLImageElement } | { status: 'error' }

const cache = new Map<string, Entry>()
const listeners = new Set<() => void>()
const MAX_ENTRIES = 200

let notifyScheduled = false
const notify = () => {
  if (notifyScheduled) return
  notifyScheduled = true
  // Gộp nhiều ảnh xong cùng lúc thành một lần đồng bộ canvas
  queueMicrotask(() => {
    notifyScheduled = false
    listeners.forEach((cb) => cb())
  })
}

/** Đăng ký nhận báo khi có ảnh mới sẵn sàng; trả hàm huỷ */
export function onVectorAssetReady(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function isVectorAssetReady(key: string): boolean {
  return cache.get(key)?.status === 'ready'
}

/**
 * Ảnh đã sẵn sàng cho key, hoặc null (đang tải / lỗi). Lần đầu gọi sẽ chạy `produce` để lấy
 * URL ảnh (data URL); lỗi được ghi nhớ để không thử lại liên tục.
 */
export function getVectorAssetImage(key: string, produce: () => string | Promise<string>): HTMLImageElement | null {
  const hit = cache.get(key)
  if (hit) return hit.status === 'ready' ? hit.img : null
  if (typeof document === 'undefined') return null

  if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value as string)
  cache.set(key, { status: 'loading' })

  Promise.resolve()
    .then(produce)
    .then(
      (src) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          if (!src) return reject(new Error('empty asset'))
          const img = new Image()
          img.onload = () => resolve(img)
          img.onerror = () => reject(new Error('asset decode failed'))
          img.src = src
        })
    )
    .then((img) => {
      cache.set(key, { status: 'ready', img })
      notify()
    })
    .catch(() => cache.set(key, { status: 'error' }))

  return null
}

/** Chờ mọi ảnh đang dựng xong (hoặc hết thời gian) — dùng cho bài đo khớp hình và xuất ảnh tĩnh */
export async function whenVectorAssetsSettled(timeoutMs = 3000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while ([...cache.values()].some((e) => e.status === 'loading') && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 20))
  }
}

/** SVG markup → data URL dùng làm src cho <img> */
export const svgToDataUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
