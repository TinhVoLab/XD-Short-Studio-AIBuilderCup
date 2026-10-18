import React, { useEffect, useRef, useState, useMemo } from 'react';
import { getAudioWaveformPeaks } from '@/utils/audioWaveform';

interface AudioWaveformRendererProps {
  url: string;
  widthPx: number;
  heightPx?: number;
  color?: string;
  secondaryColor?: string;
  opacity?: number;
  className?: string;
}

export const AudioWaveformRenderer: React.FC<AudioWaveformRendererProps> = ({
  url,
  widthPx,
  heightPx = 28,
  color = '#BEFF01',
  secondaryColor = 'rgba(190, 255, 1, 0.35)',
  opacity = 0.65,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Determine how many bars to draw based on current clip width on timeline (1 bar every ~3.5px)
  const barCount = useMemo(() => {
    return Math.max(16, Math.min(250, Math.floor(widthPx / 3.5)));
  }, [widthPx]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    getAudioWaveformPeaks(url, barCount)
      .then((extractedPeaks) => {
        if (isMounted) {
          setPeaks(extractedPeaks);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [url, barCount]);

  // Draw waveform to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || peaks.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = Math.max(16, widthPx);
    const displayHeight = heightPx;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, displayWidth, displayHeight);

    const numBars = peaks.length;
    const barWidth = 2.0;
    const gap = (displayWidth - numBars * barWidth) / Math.max(1, numBars - 1);
    const centerY = displayHeight / 2;

    // Create vertical gradient for authentic studio look
    const gradient = ctx.createLinearGradient(0, 0, 0, displayHeight);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.5, secondaryColor);
    gradient.addColorStop(1, color);

    ctx.fillStyle = gradient;

    for (let i = 0; i < numBars; i++) {
      const peak = peaks[i] || 0.1;
      const x = i * (barWidth + gap);
      // Half height mirrored for center-aligned waveform
      const barHeight = Math.max(3, peak * (displayHeight * 0.82));
      const y = centerY - barHeight / 2;

      // Draw rounded bar
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x, y, barWidth, barHeight, 1);
      } else {
        ctx.rect(x, y, barWidth, barHeight);
      }
      ctx.fill();
    }
  }, [peaks, widthPx, heightPx, color, secondaryColor]);

  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        opacity: isLoading ? 0.3 : opacity,
        transition: 'opacity 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: `${widthPx}px`,
          height: `${heightPx}px`,
          display: 'block'
        }}
      />
    </div>
  );
};
