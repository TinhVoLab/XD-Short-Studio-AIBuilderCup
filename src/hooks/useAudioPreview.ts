import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Custom hook to manage exclusive single-channel audio preview playback.
 * Guarantees that only one audio clip/track is previewed at a time across the studio,
 * and automatically pauses & cleans up HTMLAudioElement instances on unmount.
 */
export function useAudioPreview() {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopPreview = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setPlayingId(null);
  }, []);

  const togglePreview = useCallback((id: string, url: string) => {
    if (!url) return;

    if (playingId === id) {
      stopPreview();
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.play().catch(e => {
        console.warn('[AudioPreview] Playback error or user aborted:', e);
        setPlayingId(null);
      });
      setPlayingId(id);
      audio.onended = () => setPlayingId(null);
      audio.onerror = () => setPlayingId(null);
    }
  }, [playingId, stopPreview]);

  useEffect(() => {
    return () => {
      stopPreview();
    };
  }, [stopPreview]);

  return { playingId, togglePreview, stopPreview };
}
