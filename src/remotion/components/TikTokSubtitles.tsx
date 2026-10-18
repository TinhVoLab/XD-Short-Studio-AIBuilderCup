import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { ElementProps } from '../elements/types';
import { resolveWordTimeline } from '../../utils/wordTimeline';
import { mixColor } from '../utils/rich-text-parser';

interface WordTiming {
  word: string;
  startFrame: number;
  endFrame: number;
}

/**
 * TikTokSubtitles Pro — High-Performance Word-Synced Caption Engine for XD-Short.
 *
 * Key Architectural Upgrades:
 *  1. Spring Decay Transition: Smooth 5-frame regression from active scale -> resting scale (No snapback).
 *  2. Smooth Line Transition: Subtle slide-up + fade entrance/exit across line boundaries.
 *  3. GPU Hardware Compositing: Lightweight single-pass glow, willChange acceleration, zero dropped frames.
 *  4. 8 Pro Styles:
 *     - 'bouncing-box' (NEW: Vibrant Neon Pill with high contrast inverted text)
 *     - 'punch-glow'   (NEW: 3D Black Stroke outline + Neon Flash Pop)
 *     - 'word-pop'     (NEW: High-energy Zoom Pop with brightness punch)
 *     - 'word-highlight' (Neon box outline highlight)
 *     - 'karaoke'      (Left-to-right color fill)
 *     - 'neon-glow'    (Optimized crisp neon ambience)
 *     - 'subtitle'     (Classic box subtitle)
 *     - 'typewriter'   (Character-by-character reveal with blinking cursor)
 */
export const TikTokSubtitles: React.FC<ElementProps & { durFrames: number }> = ({ el, computedStyle }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const text = el.content || '';
  const totalSceneFrames = durationInFrames;

  const captionStyle = el.captionStyle || 'word-highlight';
  const accentColor = el.accentColor || 'var(--accent, #BEFF01)';
  // Chữ của từ đang đọc nằm trên nền phụ đề → dùng token riêng đảm bảo ≥ 4.5:1 (accent có thể trùng tông nền)
  const highlightColor = el.accentColor || 'var(--subtitle-highlight, var(--accent, #BEFF01))';
  const rawTextColor = el.color;
  const textColor = rawTextColor === '#FFFFFF' || rawTextColor === '#fff' ? 'var(--subtitle-text, #FFFFFF)' : (rawTextColor || 'var(--subtitle-text, #FFFFFF)');
  const rawSubtitleBg = el.bgColor;
  const subtitleBg = rawSubtitleBg === 'rgba(0,0,0,0.65)' || rawSubtitleBg === 'rgba(0, 0, 0, 0.65)' || !rawSubtitleBg
    ? 'var(--subtitle-bg, rgba(0, 0, 0, 0.75))'
    : rawSubtitleBg;
  const fontSize = el.fontSize || 18;
  const fontFamily = el.fontFamily || 'Be Vietnam Pro';
  const fontWeight = el.fontWeight || 800;
  const wordsPerLine = Math.max(1, el.wordsPerLine || 4);
  const bounceEnabled = el.captionBounce !== false; // Default true
  const outlineEnabled = el.captionOutline ?? (captionStyle === 'punch-glow');

  // ── 1. Word Timing: timestamps thật từ Edge-TTS, hoặc ước lượng theo trọng số ký tự (SSOT wordTimeline) ──
  const { wordTimings, lines } = useMemo(() => {
    const timeline = resolveWordTimeline(text, el.wordTimings, totalSceneFrames / fps);
    const timings: WordTiming[] = timeline.map((wt, idx, arr) => {
      const sFrame = Math.max(0, Math.round((wt.startSec || 0) * fps));
      let eFrame = Math.round((wt.endSec || wt.startSec + 0.3) * fps);
      if (eFrame <= sFrame) eFrame = sFrame + 3;
      if (idx < arr.length - 1) {
        const nextStart = Math.round((arr[idx + 1].startSec || 0) * fps);
        if (eFrame > nextStart && nextStart > sFrame) {
          eFrame = nextStart;
        }
      }
      return {
        word: wt.word,
        startFrame: sFrame,
        endFrame: Math.min(totalSceneFrames, eFrame)
      };
    });

    const computedLines: WordTiming[][] = [];
    for (let i = 0; i < timings.length; i += wordsPerLine) {
      computedLines.push(timings.slice(i, i + wordsPerLine));
    }

    return { wordTimings: timings, lines: computedLines };
  }, [el.wordTimings, text, totalSceneFrames, wordsPerLine, fps]);

  if (wordTimings.length === 0) return null;
  // Cảnh hook: phụ đề im lặng khi hero đang đọc đúng những chữ đó (SceneRenderer đặt captionStartSec)
  if (el.captionStartSec && frame < Math.round(el.captionStartSec * fps)) return null;

  // ── 2. Find Active Line ────────────────────────────────────────────────────
  let activeLineIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    // Hold current line until the next line's first word actually starts
    if (i === lines.length - 1 || frame < lines[i + 1][0].startFrame) {
      activeLineIndex = i;
      break;
    }
  }

  const currentLine = lines[activeLineIndex];
  if (!currentLine) return null;

  // ── 3. Line Transition (Slide-up entrance + exit) ──────────────────────────
  const lineStartFrame = currentLine[0].startFrame;
  const lineEndFrame = Math.max(lineStartFrame + 1, currentLine[currentLine.length - 1]?.endFrame ?? totalSceneFrames);

  const entranceOpacity = interpolate(
    frame, [lineStartFrame, lineStartFrame + 4], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const entranceTranslateY = interpolate(
    frame, [lineStartFrame, lineStartFrame + 4], [6, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const isLastLine = activeLineIndex === lines.length - 1;
  const exitStart = Math.min(lineEndFrame - 0.1, lineEndFrame - 3);
  const exitOpacity = isLastLine ? 1 : interpolate(
    frame, [exitStart, lineEndFrame], [1, 0.4], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const exitTranslateY = isLastLine ? 0 : interpolate(
    frame, [exitStart, lineEndFrame], [0, -4], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const totalLineOpacity = entranceOpacity * exitOpacity;
  const totalLineTranslateY = entranceTranslateY + exitTranslateY;

  // ── 4. Layout Root ────────────────────────────────────────────────────────
  const top = computedStyle?.top ?? el.top ?? 500;
  const baseOpacity = computedStyle?.opacity ?? 1;
  const captionWidth = el.width || 320;
  const textAlign = el.textAlign || 'center';
  const left = el.left ?? 180;

  let translateX = '-50%';
  let justify = 'center';
  if (textAlign === 'left') {
    translateX = '0';
    justify = 'flex-start';
  } else if (textAlign === 'right') {
    translateX = '-100%';
    justify = 'flex-end';
  }

  const wrapperBase: React.CSSProperties = {
    position: 'absolute',
    left,
    width: captionWidth,
    top,
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: justify,
    flexWrap: 'wrap',
    zIndex: 9999,
    opacity: Number(baseOpacity) * totalLineOpacity,
    transform: `translateY(${totalLineTranslateY}px) translateX(${translateX})`,
    willChange: 'transform, opacity',
  };

  // ── 5. Static Line Renderers (Subtitle / Typewriter) ───────────────────────
  if (captionStyle === 'subtitle') {
    const lineText = currentLine.map(wt => wt.word).join(' ');
    return (
      <div style={wrapperBase}>
        <span style={{
          fontSize,
          fontWeight,
          fontFamily,
          color: textColor,
          backgroundColor: subtitleBg,
          padding: '6px 16px',
          borderRadius: 8,
          textShadow: '0 2px 6px rgba(0,0,0,0.9)',
          letterSpacing: '0.02em',
          lineHeight: 1.4,
          textAlign: 'center',
          maxWidth: '100%',
          wordBreak: 'break-word',
          border: '1px solid rgba(255,255,255,0.12)',
        }}>
          {lineText}
        </span>
      </div>
    );
  }

  if (captionStyle === 'typewriter') {
    const totalChars = text.length;
    const safeTotalFrames = Math.max(1, totalSceneFrames);
    const revealedCount = Math.floor(interpolate(frame, [0, safeTotalFrames], [0, totalChars], { extrapolateRight: 'clamp' }));
    const revealedText = text.slice(0, revealedCount);
    return (
      <div style={{ ...wrapperBase, opacity: Number(baseOpacity), transform: `translateX(${translateX})` }}>
        <span style={{
          fontSize,
          fontWeight,
          fontFamily,
          color: textColor,
          backgroundColor: subtitleBg,
          padding: '6px 16px',
          borderRadius: 8,
          minWidth: 40,
          textAlign: 'center',
          letterSpacing: '0.03em',
          maxWidth: '100%',
          wordBreak: 'break-word',
          border: '1px solid rgba(255,255,255,0.12)',
        }}>
          {revealedText}
          <span style={{ opacity: frame % 16 < 8 ? 1 : 0, color: highlightColor, fontWeight: 900 }}>|</span>
        </span>
      </div>
    );
  }

  // ── 6. Per-Word Renderers with Spring Decay Physics ────────────────────────
  return (
    <div style={{
      ...wrapperBase,
      gap: captionStyle === 'karaoke' ? '4px' : '7px',
    }}>
      {currentLine.map((wt, i) => {
        const isActive = frame >= wt.startFrame && frame < wt.endFrame;
        const hasPassed = frame >= wt.endFrame;
        const framesSinceEnd = frame - wt.endFrame;

        // ── Physics Smoothing: Calculate Scale with Decay ──
        let scale = 1;
        let translateY = 0;

        if (bounceEnabled) {
          if (isActive) {
            const activeSpring = spring({
              frame: frame - wt.startFrame,
              fps,
              config: { damping: 14, stiffness: 240, mass: 0.35 },
            });
            scale = interpolate(activeSpring, [0, 1], [0.92, 1.15]);
            translateY = interpolate(activeSpring, [0, 1], [2, -2]);
          } else if (hasPassed && framesSinceEnd >= 0 && framesSinceEnd <= 5) {
            // Decay curve: smooth transition from 1.15 back to 1.0
            const decay = interpolate(framesSinceEnd, [0, 5], [1.15, 1.0], {
              extrapolateRight: 'clamp',
            });
            scale = decay;
            translateY = interpolate(framesSinceEnd, [0, 5], [-2, 0], {
              extrapolateRight: 'clamp',
            });
          }
        }

        // Shared Stroke Style if outline is enabled
        const strokeStyle: React.CSSProperties = (outlineEnabled || captionStyle === 'punch-glow') ? {
          WebkitTextStroke: '1px #000000',
          paintOrder: 'stroke fill',
        } : {};

        // ── Style A: bouncing-box (CapCut Viral Neon Pill) ───────────────────
        if (captionStyle === 'bouncing-box') {
          return (
            <span
              key={i}
              style={{
                fontSize,
                fontWeight: isActive ? 900 : fontWeight,
                fontFamily,
                color: isActive ? 'var(--on-accent, #000000)' : (hasPassed ? 'color-mix(in srgb, var(--subtitle-text, #ffffff) 75%, transparent)' : textColor),
                backgroundColor: isActive ? accentColor : (el.bgColor || 'var(--subtitle-bg, rgba(0, 0, 0, 0.65))'),
                transform: `scale(${scale}) translateY(${translateY}px)`,
                padding: '4px 10px',
                borderRadius: 8,
                boxShadow: isActive
                  ? `0 4px 16px ${mixColor(accentColor, 53)}, 0 0 8px ${mixColor(accentColor, 40)}`
                  : '0 2px 6px rgba(0,0,0,0.5)',
                display: 'inline-block',
                willChange: 'transform',
                whiteSpace: 'nowrap',
                letterSpacing: '0.02em',
                ...strokeStyle,
              }}
            >
              {wt.word}
            </span>
          );
        }

        // ── Style B: punch-glow (3D Black Stroke + Neon Flash) ───────────────
        if (captionStyle === 'punch-glow') {
          return (
            <span
              key={i}
              style={{
                fontSize: fontSize + 1,
                fontWeight: 900,
                fontFamily,
                color: isActive ? highlightColor : (hasPassed ? 'color-mix(in srgb, var(--subtitle-text, #ffffff) 75%, transparent)' : textColor),
                transform: `scale(${isActive ? scale * 1.05 : scale}) translateY(${translateY}px)`,
                display: 'inline-block',
                padding: '2px 6px',
                WebkitTextStroke: isActive ? '1.5px #000000' : '1.2px #000000',
                paintOrder: 'stroke fill',
                textShadow: isActive
                  ? `0 0 14px ${accentColor}, 0 3px 6px rgba(0,0,0,0.9)`
                  : '0 2px 4px rgba(0,0,0,0.8)',
                filter: isActive ? 'brightness(1.15)' : 'none',
                willChange: 'transform',
                whiteSpace: 'nowrap',
                letterSpacing: '0.03em',
              }}
            >
              {wt.word}
            </span>
          );
        }

        // ── Style C: word-pop (Big Focus Zoom Pop) ───────────────────────────
        if (captionStyle === 'word-pop') {
          return (
            <span
              key={i}
              style={{
                fontSize: fontSize + 2,
                fontWeight: 900,
                fontFamily,
                color: isActive ? highlightColor : (hasPassed ? 'color-mix(in srgb, var(--subtitle-text, #ffffff) 75%, transparent)' : textColor),
                transform: `scale(${isActive ? scale * 1.12 : scale}) translateY(${translateY}px)`,
                display: 'inline-block',
                padding: '3px 8px',
                backgroundColor: isActive ? (el.bgColor || 'var(--subtitle-bg, rgba(0,0,0,0.85))') : 'transparent',
                borderRadius: 6,
                border: isActive ? `1.5px solid ${accentColor}` : '1.5px solid transparent',
                boxShadow: isActive ? `0 0 18px ${mixColor(accentColor, 47)}` : 'none',
                filter: isActive ? 'brightness(1.2)' : 'none',
                willChange: 'transform',
                whiteSpace: 'nowrap',
                ...strokeStyle,
              }}
            >
              {wt.word}
            </span>
          );
        }

        // ── Style D: word-highlight (Neon Box Outline) ───────────────────────
        if (captionStyle === 'word-highlight') {
          return (
            <span
              key={i}
              style={{
                fontSize,
                fontWeight,
                fontFamily,
                color: isActive ? highlightColor : (hasPassed ? 'color-mix(in srgb, var(--subtitle-text, #ffffff) 75%, transparent)' : textColor),
                backgroundColor: isActive ? (el.bgColor || 'var(--subtitle-bg, rgba(6,13,22,0.95))') : (el.bgColor || 'var(--subtitle-bg, rgba(0,0,0,0.5))'),
                border: isActive
                  ? `1.5px solid ${accentColor}`
                  : '1.5px solid rgba(255,255,255,0.08)',
                transform: `scale(${scale}) translateY(${translateY}px)`,
                padding: '4px 9px',
                borderRadius: 8,
                boxShadow: isActive ? `0 3px 14px ${mixColor(accentColor, 53)}` : 'none',
                display: 'inline-block',
                willChange: 'transform',
                whiteSpace: 'nowrap',
                ...strokeStyle,
              }}
            >
              {wt.word}
            </span>
          );
        }

        // ── Style E: karaoke (Color Fill + Underline Glow) ───────────────────
        if (captionStyle === 'karaoke') {
          return (
            <span
              key={i}
              style={{
                fontSize,
                fontWeight,
                fontFamily,
                color: isActive 
                  ? highlightColor 
                  : (hasPassed 
                    ? 'color-mix(in srgb, var(--subtitle-text, #ffffff) 75%, transparent)' 
                    : 'var(--subtitle-text, #ffffff)'),
                transform: `scale(${scale}) translateY(${translateY}px)`,
                display: 'inline-block',
                padding: '2px 5px',
                borderBottom: isActive ? `2.5px solid ${accentColor}` : '2.5px solid transparent',
                textShadow: isActive ? `0 0 10px ${accentColor}` : '0 2px 6px rgba(0,0,0,0.8)',
                willChange: 'transform',
                whiteSpace: 'nowrap',
                ...strokeStyle,
              }}
            >
              {wt.word}
            </span>
          );
        }

        // ── Style F: neon-glow (Crisp Ambient Glow) ──────────────────────────
        if (captionStyle === 'neon-glow') {
          return (
            <span
              key={i}
              style={{
                fontSize,
                fontWeight,
                fontFamily,
                color: isActive 
                  ? highlightColor 
                  : (hasPassed 
                    ? 'color-mix(in srgb, var(--subtitle-text, #ffffff) 75%, transparent)' 
                    : textColor),
                textShadow: isActive
                  ? `0 0 10px ${accentColor}, 0 0 22px ${mixColor(accentColor, 53)}`
                  : '0 2px 6px rgba(0,0,0,0.7)',
                transform: `scale(${scale}) translateY(${translateY}px)`,
                display: 'inline-block',
                padding: '3px 7px',
                willChange: 'transform',
                whiteSpace: 'nowrap',
                ...strokeStyle,
              }}
            >
              {wt.word}
            </span>
          );
        }

        return null;
      })}
    </div>
  );
};
