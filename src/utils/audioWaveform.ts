/**
 * ==============================================================================
 * 🎧 AUDIO WAVEFORM UTILITIES - WEB AUDIO API & MIN-MAX RMS EXTRACTION
 * ==============================================================================
 * High-performance audio waveform peak extractor with in-memory caching
 * and procedural fallback for seamless timeline rendering (CapCut/Premiere style).
 */

const waveformPeaksCache = new Map<string, number[]>();
let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioCtx) {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtxClass) {
      sharedAudioCtx = new AudioCtxClass();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

/**
 * Generates a procedural harmonic waveform fallback in case of CORS or decoding error.
 */
export function generateFallbackWaveform(sampleCount = 100, seed = 42): number[] {
  const peaks: number[] = [];
  for (let i = 0; i < sampleCount; i++) {
    // Generate multi-frequency rhythmic peaks mimicking real audio
    const t = (i / sampleCount) * Math.PI * 8;
    const wave = Math.abs(Math.sin(t) * 0.4 + Math.sin(t * 2.3 + seed) * 0.35 + Math.sin(t * 5.1) * 0.2);
    // Add rhythmic beat pulses
    const beat = (i % 8 === 0 || i % 12 === 0) ? 0.3 : 0;
    peaks.push(Math.min(1.0, Math.max(0.12, wave + beat + 0.1)));
  }
  return peaks;
}

/**
 * Extracts normalized peak amplitudes [0.05 ... 1.0] from an audio URL.
 * Uses Min-Max RMS Binning for zero transient loss.
 */
export async function getAudioWaveformPeaks(
  audioUrl: string,
  targetPeaksCount = 120
): Promise<number[]> {
  if (!audioUrl) return generateFallbackWaveform(targetPeaksCount);

  // 1. Check in-memory cache
  const cacheKey = `${audioUrl}_${targetPeaksCount}`;
  if (waveformPeaksCache.has(cacheKey)) {
    return waveformPeaksCache.get(cacheKey)!;
  }

  try {
    const ctx = getAudioContext();
    if (!ctx) {
      const fallback = generateFallbackWaveform(targetPeaksCount);
      waveformPeaksCache.set(cacheKey, fallback);
      return fallback;
    }

    // 2. Fetch array buffer
    const response = await fetch(audioUrl, { mode: 'cors' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();

    // 3. Decode audio data (Headless, no audio destination connected)
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    const rawData = audioBuffer.getChannelData(0); // Primary channel
    const totalSamples = rawData.length;
    const blockSize = Math.floor(totalSamples / targetPeaksCount);

    if (blockSize <= 0) {
      const fallback = generateFallbackWaveform(targetPeaksCount);
      waveformPeaksCache.set(cacheKey, fallback);
      return fallback;
    }

    const peaks: number[] = [];
    let maxOverall = 0.001;

    // 4. Min-Max RMS Binning across blocks
    for (let i = 0; i < targetPeaksCount; i++) {
      const start = i * blockSize;
      const end = Math.min(start + blockSize, totalSamples);
      let sumSquares = 0;
      let peakMax = 0;

      for (let j = start; j < end; j++) {
        const val = Math.abs(rawData[j]);
        sumSquares += val * val;
        if (val > peakMax) peakMax = val;
      }

      const rms = Math.sqrt(sumSquares / (end - start));
      // Combine peak and RMS for punchy, authentic waveform shape
      const combined = peakMax * 0.6 + rms * 0.4;
      peaks.push(combined);
      if (combined > maxOverall) maxOverall = combined;
    }

    // 5. Normalize peaks to [0.08 ... 1.0] range
    const normalized = peaks.map(p => {
      const val = (p / maxOverall);
      return Math.min(1.0, Math.max(0.08, val));
    });

    waveformPeaksCache.set(cacheKey, normalized);
    return normalized;
  } catch (err) {
    // Graceful fallback on CORS / network error
    console.warn('[AudioWaveform] Fallback waveform used for:', audioUrl.slice(0, 40), err);
    const fallback = generateFallbackWaveform(targetPeaksCount, audioUrl.length);
    waveformPeaksCache.set(cacheKey, fallback);
    return fallback;
  }
}
