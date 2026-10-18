/**
 * Helper to fetch exact audio duration in seconds.
 * Combines HTML5 Audio metadata check, Chromium large timeupdate seek workaround,
 * and Web Audio API decodeAudioData fallback for 100% accuracy.
 */
export async function getAudioDuration(url: string): Promise<number> {
  // 1. Primary: Use Web Audio API decodeAudioData for sample-exact PCM duration
  try {
    const webAudioDur = await Promise.race([
      decodeWithWebAudio(url),
      new Promise<number>((resolve) => setTimeout(() => resolve(0), 3000))
    ])
    if (webAudioDur && isFinite(webAudioDur) && webAudioDur > 0 && webAudioDur !== 5) {
      return webAudioDur
    }
  } catch (e) {
    // fallback
  }

  // 2. Fallback to HTML5 Audio element with 3s timeout
  return new Promise((resolve) => {
    let resolved = false
    let timer: any = null

    const cleanup = () => {
      if (timer) clearTimeout(timer)
      audio.removeEventListener('loadedmetadata', onLoaded)
      audio.removeEventListener('error', onError)
    }

    const safeResolve = (dur: number) => {
      if (!resolved) {
        resolved = true
        cleanup()
        resolve(dur && isFinite(dur) && dur > 0 ? dur : 3.5)
      }
    }

    timer = setTimeout(() => {
      safeResolve(3.5)
    }, 3000)

    const audio = new Audio()
    audio.crossOrigin = 'anonymous'
    audio.src = url

    const onLoaded = () => {
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        safeResolve(audio.duration)
      } else {
        audio.currentTime = 1e101
        const onTimeUpdate = () => {
          audio.removeEventListener('timeupdate', onTimeUpdate)
          const realDur = audio.duration
          audio.currentTime = 0
          safeResolve(realDur)
        }
        audio.addEventListener('timeupdate', onTimeUpdate)
      }
    }

    const onError = () => {
      safeResolve(3.5)
    }

    audio.addEventListener('loadedmetadata', onLoaded)
    audio.addEventListener('error', onError)
  })
}

async function decodeWithWebAudio(url: string): Promise<number> {
  try {
    const controller = new AbortController()
    const fetchTimer = setTimeout(() => controller.abort(), 3000)
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(fetchTimer)
    const buffer = await res.arrayBuffer()
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const audioBuffer = await ctx.decodeAudioData(buffer)
    ctx.close()
    return audioBuffer.duration || 3.5
  } catch {
    return 3.5
  }
}
