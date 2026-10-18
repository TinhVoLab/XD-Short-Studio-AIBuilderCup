import { API_BASE } from '@/config/api'

/**
 * Force 1-Click Direct File Download into the user's Downloads folder.
 * Avoids browser cross-origin navigation/streaming in a new tab.
 */
export async function downloadFileDirectly(url: string, filename?: string) {
  try {
    const cleanFilename = filename || (url.split('/').pop() || 'video-export.mp4')
    
    // Target the direct static URL (e.g. http://localhost:4000/public/export-xxx.mp4)
    const targetUrl = url.startsWith('http') ? url : `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`

    // 1. Fetch file directly as Blob -> Convert to Local Blob URL -> Instant 1-Click Download
    const res = await fetch(targetUrl)
    if (res.ok) {
      const blob = await res.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = blobUrl
      a.download = cleanFilename
      document.body.appendChild(a)
      a.click()
      setTimeout(() => {
        document.body.removeChild(a)
        window.URL.revokeObjectURL(blobUrl)
      }, 1000)
      return true
    }

    // 2. Fallback: try download endpoint
    const downloadEndpoint = `${API_BASE}/api/render/download/${cleanFilename}`
    const res2 = await fetch(downloadEndpoint)
    if (res2.ok) {
      const blob2 = await res2.blob()
      const blobUrl2 = window.URL.createObjectURL(blob2)
      const a2 = document.createElement('a')
      a2.style.display = 'none'
      a2.href = blobUrl2
      a2.download = cleanFilename
      document.body.appendChild(a2)
      a2.click()
      setTimeout(() => {
        document.body.removeChild(a2)
        window.URL.revokeObjectURL(blobUrl2)
      }, 1000)
      return true
    }

    // 3. Fallback: direct window.open
    window.open(targetUrl, '_blank')
    return false
  } catch (err) {
    console.error('[Download Error]:', err)
    window.open(url, '_blank')
    return false
  }
}

/**
 * Download multiple files in sequence with staggered delay
 */
export async function downloadMultipleFilesDirectly(items: { url: string; filename: string }[]) {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    await downloadFileDirectly(item.url, item.filename);
    if (i < items.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 800));
    }
  }
}

/**
 * Play a pleasant chime sound when renders finish
 */
export function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    
    // First tone (E5 ~ 659.25Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.4);

    // Second tone higher (B5 ~ 987.77Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, now + 0.15);
    gain2.gain.setValueAtTime(0.25, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.6);
  } catch (e) {
    console.warn('Could not play notification sound:', e);
  }
}
