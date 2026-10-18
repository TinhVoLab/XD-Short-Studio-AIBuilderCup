import { useEffect, useRef } from 'react'
import { useEditorStore } from '@/store/useEditorStore'

export function useAudioPlayback() {
  const clipAudiosRef = useRef<Map<string, HTMLAudioElement>>(new Map())
  const bgmRef = useRef<HTMLAudioElement | null>(null)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const gainNodesRef = useRef<Map<string, GainNode>>(new Map())
  const sourceNodesRef = useRef<Map<string, MediaElementAudioSourceNode>>(new Map())
  const reverbWetNodesRef = useRef<Map<string, GainNode>>(new Map())
  const bgmGainNodeRef = useRef<GainNode | null>(null)
  const bgmSourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null)

  const getAudioCtx = () => {
    if (!audioCtxRef.current && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (AudioCtx) audioCtxRef.current = new AudioCtx()
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {})
    }
    return audioCtxRef.current
  }

  const { 
    isPlaying, isMuted, currentTimeSec, previewMode, isPipActive,
    bgMusicUrl, bgMusicVolume, scenes, currentSceneIdx, audioClips,
    masterVolume, voiceoverVolume, voiceoverSpeedRate, voiceoverReverb, bgmVolume, sfxVolume,
    isMasterMuted, isVoiceMuted, isBgmMuted, isSfxMuted,
    soloTrackId, soloTrackIds, mutedTrackIds,
    isClipSilenced
  } = useEditorStore()

  // 1. Manage Audio Objects Lifecycle (Create / Cleanup)
  useEffect(() => {
    const currentClipIds = new Set(audioClips.map(c => c.id))
    
    // Cleanup removed clips
    clipAudiosRef.current.forEach((aud, id) => {
      if (!currentClipIds.has(id)) {
        aud.pause()
        aud.src = ''
        clipAudiosRef.current.delete(id)
        const gNode = gainNodesRef.current.get(id)
        if (gNode) {
          try { gNode.disconnect() } catch(e){}
          gainNodesRef.current.delete(id)
        }
        const wetNode = reverbWetNodesRef.current.get(id)
        if (wetNode) {
          try { wetNode.disconnect() } catch(e){}
          reverbWetNodesRef.current.delete(id)
        }
        sourceNodesRef.current.delete(id)
      }
    })

    // Create or update clips
    audioClips.forEach(clip => {
      if (!clip.url || clip.isExpired || clip.url.startsWith('blob:')) {
        return // Skip invalid or dead blob clip URLs
      }
      let aud = clipAudiosRef.current.get(clip.id)
      if (!aud || (aud as any).dataset?.originalUrl !== clip.url) {
        if (aud) { aud.pause(); aud.src = '' }
        aud = new Audio()
        aud.crossOrigin = 'anonymous'
        aud.preload = 'auto'
        aud.src = clip.url
        ;(aud as any).dataset.originalUrl = clip.url  // store for comparison

        const checkAndFixDuration = async () => {
          if (!clip.url || clip.url.startsWith('blob:')) return
          
          const { getAudioDuration } = await import('@/utils/audio')
          const measuredDur = await getAudioDuration(clip.url)
          
          if (measuredDur && isFinite(measuredDur) && measuredDur > 0) {
            if (!clip.duration || (measuredDur - clip.duration > 0.5)) {
              const updates: any = { duration: measuredDur }
              if (!clip.playDurationSec || Math.abs(clip.playDurationSec - clip.duration) < 0.05) {
                updates.playDurationSec = measuredDur
              }
              useEditorStore.getState().updateAudioClip(clip.id, updates)
            }
          }
        }

        aud.addEventListener('loadedmetadata', checkAndFixDuration)
        if (aud.readyState >= 1) {
          checkAndFixDuration()
        }
        clipAudiosRef.current.set(clip.id, aud)  // ✅ Register in map
      }

      // Attach Web Audio API GainNode + Studio Reverb Circuit
      const ctx = getAudioCtx()
      if (ctx && !gainNodesRef.current.has(clip.id)) {
        try {
          const srcNode = ctx.createMediaElementSource(aud)
          const dryGainNode = ctx.createGain()
          srcNode.connect(dryGainNode)
          dryGainNode.connect(ctx.destination)

          // Studio Acoustic Room Reverb (Vocal Track A1)
          const isVoice = !clip.trackId || clip.trackId === 'voice' || clip.trackId === 'A1'
          if (isVoice) {
            try {
              // 1. Pre-delay for vocal clarity & separation (28ms)
              const preDelay = ctx.createDelay()
              preDelay.delayTime.value = 0.028

              // 2. Warm Tone Filter (Lowpass 4200Hz - removes digital harshness)
              const filter = ctx.createBiquadFilter()
              filter.type = 'lowpass'
              filter.frequency.value = 4200
              filter.Q.value = 0.7

              // 3. Dense Acoustic Impulse Response (1.4s tail, natural room decay)
              const convolver = ctx.createConvolver()
              const sampleRate = ctx.sampleRate
              const length = Math.floor(sampleRate * 1.4)
              const impulse = ctx.createBuffer(2, length, sampleRate)
              const left = impulse.getChannelData(0)
              const right = impulse.getChannelData(1)
              for (let i = 0; i < length; i++) {
                const t = i / length
                // Natural room decay curve with early reflection density
                const envelope = Math.exp(-t * 3.2) * (1 - t * 0.15)
                left[i] = (Math.random() * 2 - 1) * envelope
                right[i] = (Math.random() * 2 - 1) * envelope
              }
              convolver.buffer = impulse

              // 4. Wet Gain Node (modulated in playback loop)
              const wetGainNode = ctx.createGain()
              wetGainNode.gain.value = 0

              // Connect wet signal chain: src -> preDelay -> filter -> convolver -> wetGain -> destination
              srcNode.connect(preDelay)
              preDelay.connect(filter)
              filter.connect(convolver)
              convolver.connect(wetGainNode)
              wetGainNode.connect(ctx.destination)

              reverbWetNodesRef.current.set(clip.id, wetGainNode)
            } catch (convErr) {
              console.warn('Studio reverb setup fallback:', convErr)
            }
          }

          sourceNodesRef.current.set(clip.id, srcNode)
          gainNodesRef.current.set(clip.id, dryGainNode)
        } catch (e) {
          // If already connected or cross-origin restricted, fallback cleanly
        }
      }

      aud.playbackRate = 1.0
    })
  }, [audioClips])

  // 3. Play / Pause / Seek Logic with Mixer & Auto-Ducking
  useEffect(() => {
    // Disable global audio playback during render preview (Remotion handles it internally)
    const shouldMuteGlobal = isMuted || isMasterMuted || previewMode === 'render' || isPipActive

    if (isPlaying && !shouldMuteGlobal) {
      const ctx = getAudioCtx()
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {})
      }
    }

    // Check if timeline already has a dedicated BGM clip on Track A3 (Anti-Echo Guard)
    const hasBgmClipOnTimeline = audioClips.some(
      clip => (clip.trackId === 'A3' || clip.trackId === 'bgm') && clip.url && !clip.isExpired
    )

    // Handle Background Music (Only if no duplicate clip exists on Timeline)
    if (bgMusicUrl && !shouldMuteGlobal && !hasBgmClipOnTimeline) {
      if (!bgmRef.current) {
        const aud = new Audio(bgMusicUrl)
        aud.loop = true
        aud.crossOrigin = 'anonymous'
        bgmRef.current = aud
      } else if (bgmRef.current.src !== bgMusicUrl) {
        bgmRef.current.src = bgMusicUrl
      }
      
      const bgm = bgmRef.current
      const ctx = getAudioCtx()
      
      // Connect BGM to Web Audio API Gain Node for seamless, clickless volume ramping
      if (ctx && !bgmGainNodeRef.current) {
        try {
          const srcNode = ctx.createMediaElementSource(bgm)
          const gainNode = ctx.createGain()
          srcNode.connect(gainNode)
          gainNode.connect(ctx.destination)
          bgmSourceNodeRef.current = srcNode
          bgmGainNodeRef.current = gainNode
        } catch (e) {
          // Fallback cleanly
        }
      }

      let effectiveBgmGain = bgmVolume * masterVolume * (bgMusicVolume ?? 1.0)
      
      const bgmSilenced = (soloTrackIds.length > 0 || soloTrackId)
        ? !(soloTrackId === 'bgm' || soloTrackIds.includes('A3') || soloTrackIds.includes('bgm'))
        : (isBgmMuted || mutedTrackIds.includes('A3') || mutedTrackIds.includes('bgm'))

      const targetBgmVolume = bgmSilenced ? 0 : effectiveBgmGain

      if (bgmGainNodeRef.current && ctx) {
        try {
          bgmGainNodeRef.current.gain.cancelScheduledValues(ctx.currentTime)
          bgmGainNodeRef.current.gain.setTargetAtTime(targetBgmVolume, ctx.currentTime, 0.02)
        } catch (e) {
          bgmGainNodeRef.current.gain.setValueAtTime(targetBgmVolume, ctx.currentTime)
        }
        bgm.muted = false
        bgm.volume = 1.0
      } else {
        bgm.muted = targetBgmVolume <= 0.001
        bgm.volume = Math.max(0, Math.min(1, targetBgmVolume))
      }
      bgm.playbackRate = 1.0

      if (isPlaying) {
        if (bgm.paused) {
          if (isFinite(bgm.duration) && bgm.duration > 0) {
            bgm.currentTime = currentTimeSec % bgm.duration
          }
          bgm.play().catch(() => {})
        }
      } else {
        if (!bgm.paused) {
          bgm.pause()
        }
        if (isFinite(bgm.duration) && bgm.duration > 0 && Math.abs(bgm.currentTime - (currentTimeSec % bgm.duration)) > 0.3) {
          bgm.currentTime = currentTimeSec % bgm.duration
        }
      }
    } else if (bgmRef.current) {
      if (!bgmRef.current.paused) {
        bgmRef.current.pause()
      }
      bgmRef.current.muted = true
    }

    // Handle Audio Clips
    if (shouldMuteGlobal) {
      clipAudiosRef.current.forEach(aud => {
        aud.pause()
        aud.muted = true
      })
      return
    }

    audioClips.forEach(clip => {
      if (!clip.url || clip.isExpired || clip.url.startsWith('blob:')) return
      const aud = clipAudiosRef.current.get(clip.id)
      if (!aud) return

      const normTrack = (clip.trackId || 'A1').toLowerCase()
      const isVoice = normTrack === 'a1' || normTrack.includes('voice')
      const isBgm = normTrack === 'a3' || normTrack.includes('bgm') || normTrack.includes('music')
      const isSfx = normTrack === 'a2' || normTrack.includes('sfx')
      const trackMuted = isClipSilenced(clip)

      const channelGain = isVoice ? (voiceoverVolume ?? 1.0) : isBgm ? (bgmVolume ?? 1.0) : (sfxVolume ?? 0.8)
      const effectiveClipVolume = trackMuted ? 0 : Math.max(0, (clip.volume ?? 1) * channelGain * (masterVolume ?? 1.0))
      
      const gainNode = gainNodesRef.current.get(clip.id)
      const ctx = audioCtxRef.current
      if (gainNode && ctx) {
        const targetVol = trackMuted ? 0 : effectiveClipVolume
        try {
          gainNode.gain.cancelScheduledValues(ctx.currentTime)
          gainNode.gain.setValueAtTime(targetVol, ctx.currentTime)
          gainNode.gain.value = targetVol
        } catch (e) {
          gainNode.gain.value = targetVol
        }
        aud.muted = trackMuted || effectiveClipVolume <= 0.0001
        aud.volume = Math.max(0, Math.min(1, effectiveClipVolume > 1 ? 1 : effectiveClipVolume))
      } else {
        aud.muted = trackMuted || effectiveClipVolume <= 0.001
        aud.volume = Math.max(0, Math.min(1, effectiveClipVolume))
      }

      // Dynamically update Reverb Wet Level for Voiceover
      const wetNode = reverbWetNodesRef.current.get(clip.id)
      if (wetNode && ctx) {
        const wetVal = trackMuted ? 0 : Math.min(2.5, Math.pow(voiceoverReverb || 0, 0.7) * 1.8 * effectiveClipVolume)
        try {
          wetNode.gain.cancelScheduledValues(ctx.currentTime)
          wetNode.gain.setTargetAtTime(wetVal, ctx.currentTime, 0.02)
        } catch (e) {
          wetNode.gain.setValueAtTime(wetVal, ctx.currentTime)
        }
      }

      const trimStart = clip.trimStartSec ?? 0
      const playDur = clip.playDurationSec ?? clip.duration
      const rate = clip.playbackRate || 1.0

      const offset = currentTimeSec - clip.startSec
      const shouldPlay = isPlaying && !trackMuted && offset >= 0 && offset < playDur + 0.1
      const isPlayingNow = !aud.paused

      // Target position inside original audio file scaled by playbackRate
      const targetAudioTime = trimStart + (offset * rate)

      if (!isPlaying) {
        // Paused: Sync time when user scrubs timeline
        if (isPlayingNow) aud.pause()
        
        if (offset >= 0 && offset <= playDur) {
          if (Math.abs(aud.currentTime - targetAudioTime) > 0.05) {
            aud.currentTime = targetAudioTime
          }
        } else if (offset < 0) {
          aud.currentTime = trimStart
        }
      } else {
        // Playing
        if (shouldPlay && !isPlayingNow) {
          const clipMaxDur = isFinite(aud.duration) && aud.duration > 0 ? aud.duration : (playDur * rate)
          if (targetAudioTime >= clipMaxDur - 0.03 || aud.ended) {
            return
          }

          aud.currentTime = targetAudioTime
          aud.playbackRate = rate
          aud.play().catch(() => {})
        } else if (!shouldPlay && isPlayingNow) {
          aud.pause()
        } else if (shouldPlay && isPlayingNow) {
          if (Math.abs(aud.currentTime - targetAudioTime) > 0.25) {
            aud.currentTime = targetAudioTime
          }
        }
      }
    })

  }, [
    isPlaying, isMuted, currentTimeSec, previewMode, isPipActive, bgMusicUrl, bgMusicVolume, scenes, currentSceneIdx, audioClips,
    masterVolume, voiceoverVolume, voiceoverSpeedRate, voiceoverReverb, bgmVolume, sfxVolume, isMasterMuted, isVoiceMuted, isBgmMuted, isSfxMuted,
    soloTrackId, soloTrackIds, mutedTrackIds, isClipSilenced
  ])
}
