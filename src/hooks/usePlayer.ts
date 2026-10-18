import { useEffect, useRef } from 'react'
import { useEditorStore } from '@/store/useEditorStore'
import { remotionBridge } from '@/utils/remotionBridge'

export function usePlayerLoop() {
  const { isPlaying, progress, setProgress, setPlaying, previewMode } = useEditorStore()
  const rafRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)

  useEffect(() => {
    // In Render Mode, Remotion manages its own RAF loop — do NOT run ours
    if (previewMode === 'render') {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      lastTimeRef.current = null
      return
    }

    if (!isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      lastTimeRef.current = null
      return
    }

    const tick = (now: number) => {
      if (lastTimeRef.current === null) lastTimeRef.current = now
      const delta = (now - lastTimeRef.current) / 1000 // seconds
      lastTimeRef.current = now

      const store = useEditorStore.getState()
      const scenesDur = store.scenes.reduce((a, s) => a + s.duration, 0)
      const audiosDur = store.audioClips.reduce((max, clip) => {
        const activeDur = (clip.playDurationSec ?? clip.duration) / (clip.playbackRate ?? 1.0)
        return Math.max(max, clip.startSec + activeDur)
      }, 0)
      const totalDur = Math.max(1, scenesDur, audiosDur)
      const currentProgress = store.progress
      const nextPct = currentProgress + (delta / totalDur) * 100

      if (nextPct >= 100) {
        setProgress(100)
        setPlaying(false)
        return
      }
      setProgress(Math.min(100, nextPct))
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [isPlaying, previewMode, setPlaying, setProgress])
}

export function usePlayer() {
  const isPlaying = useEditorStore(s => s.isPlaying)
  const setPlaying = useEditorStore(s => s.setPlaying)
  const setProgress = useEditorStore(s => s.setProgress)

  const togglePlay = () => {
    // Nếu có bridge (chế độ Render hoặc PiP), đồng bộ lệnh play/pause xuống RemotionPlayer
    if (remotionBridge.ref) {
      if (isPlaying) {
        remotionBridge.ref.pause()
      } else {
        remotionBridge.ref.play()
      }
    }

    const currentProgress = useEditorStore.getState().progress
    if (!isPlaying && currentProgress >= 99.9) {
      setProgress(0)
    }
    setPlaying(!isPlaying)
  }

  const stop = () => {
    setPlaying(false)
    setProgress(0)
    if (remotionBridge.ref) {
      remotionBridge.ref.pause()
      remotionBridge.ref.seekTo(0)
    }
  }

  return { togglePlay, stop }
}

