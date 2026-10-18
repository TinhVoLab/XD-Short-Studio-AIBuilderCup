import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { HookLayoutSharedProps } from '../types';
import { mixColor, onAccentColor, readableTint } from '../../../../utils/rich-text-parser';

/**
 * KineticSolidBoxLayout v3 — "Alex Hormozi / MrBeast Style"
 *
 * 3 Improvements over v2:
 *  1. Numbers extracted and rendered 1.5× bigger with separate pop-in delay
 *  2. Shimmer sweep animation on Solid Box (frame 15–28)
 *  3. Badge uses inline SVG Lightning bolt — no emoji
 */

// ── Helper: parse highlight phrase, extract numbers for big rendering ──
function parseHighlightTokens(text: string): Array<{ word: string; isNumber: boolean }> {
  return text.split(/\s+/).filter(Boolean).map(word => ({
    word,
    isNumber: /^\d+([.,]\d+)?[x×%kKmMbB]?$/.test(word),
  }));
}

// ── SVG Lightning Bolt (No Emoji) ──────────────────────────────────────
const LightningIcon = ({ color }: { color: string }) => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
  >
    <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

export const KineticSolidBoxLayout: React.FC<HookLayoutSharedProps> = React.memo(({
  el,
  computedStyle,
  accent,
  badgeText,
  badgeOpacity,
  badgeScale,
  heroTitle,
  highlightList,
  computedFontSize,
  subText,
  boxOpacity,
  boxTranslateY,
  hookData,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Spring Animations ──────────────────────────────────────────────
  // Tầng 1: context text (bật sớm)
  const line1Spring = spring({ fps, frame: frame - 0, config: { damping: 18, mass: 0.7, stiffness: 140 } });
  const line1Opacity = interpolate(line1Spring, [0, 1], [0, 1], { extrapolateRight: 'clamp' });
  const line1Y = interpolate(line1Spring, [0, 1], [18, 0], { extrapolateRight: 'clamp' });

  // Tầng 2: Solid Box pop (bật trễ frame 8)
  const boxPopSpring = spring({ fps, frame: frame - 8, config: { damping: 9, mass: 0.5, stiffness: 130 } });
  const boxPopScale = interpolate(boxPopSpring, [0, 1], [0.82, 1], { extrapolateRight: 'clamp' });
  const boxPopOpacity = interpolate(boxPopSpring, [0, 1], [0, 1], { extrapolateRight: 'clamp' });
  const boxPopY = interpolate(boxPopSpring, [0, 1], [22, 0], { extrapolateRight: 'clamp' });

  // Number inside box: pop trễ hơn thêm 5 frame so với box
  const numSpring = spring({ fps, frame: frame - 13, config: { damping: 7, mass: 0.4, stiffness: 160 } });
  const numScale = interpolate(numSpring, [0, 1], [0.6, 1], { extrapolateRight: 'clamp' });
  const numOpacity = interpolate(numSpring, [0, 1], [0, 1], { extrapolateRight: 'clamp' });

  // Shimmer sweep: frame 15 → 30, di chuyển từ -100% → 200%
  const shimmerProgress = interpolate(frame, [15, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const shimmerX = interpolate(shimmerProgress, [0, 1], [-100, 220]);

  const isLeftAlign = hookData?.wordLayout !== 'inline';
  const accentFg = onAccentColor(accent);

  // ── Tách Context vs Highlight Phrase ─────────────────────────────
  let contextText = heroTitle;
  let highlightPhrase = '';

  if (highlightList && highlightList.length > 0) {
    const lowerTitle = heroTitle.toLowerCase();
    const lowerHighlights = highlightList.map(h => h.toLowerCase().trim());

    let firstMatchStart = heroTitle.length;
    for (const hl of lowerHighlights) {
      const idx = lowerTitle.indexOf(hl);
      if (idx !== -1 && idx < firstMatchStart) firstMatchStart = idx;
    }

    if (firstMatchStart > 0 && firstMatchStart < heroTitle.length) {
      contextText = heroTitle.slice(0, firstMatchStart).trim();
      highlightPhrase = heroTitle.slice(firstMatchStart).trim();
    } else {
      contextText = '';
      highlightPhrase = heroTitle;
    }
  }

  const tokens = highlightPhrase ? parseHighlightTokens(highlightPhrase) : [];
  const fontSize1 = computedFontSize * (contextText ? 0.82 : 1);
  const fontSize2 = computedFontSize * (contextText ? 1.05 : 1);
  const fontFace = hookData?.fontFamily || el.fontFamily || 'Be Vietnam Pro';

  return (
    <div
      style={{
        ...computedStyle,
        width: el.width || 420,
        display: 'flex',
        flexDirection: 'column',
        alignItems: isLeftAlign ? 'flex-start' : 'center',
        textAlign: isLeftAlign ? 'left' : 'center',
        gap: 10,
        pointerEvents: 'none',
      }}
    >
      {/* ── BADGE (SVG Lightning — No Emoji) ────────────────── */}
      {badgeText && (
        <div
          style={{
            opacity: badgeOpacity,
            transform: `scale(${badgeScale})`,
            color: readableTint(accent),
            fontSize: 13,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            borderBottom: `2px solid ${accent}`,
            paddingBottom: 4,
            marginBottom: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <LightningIcon color={accent} />
          {badgeText}
        </div>
      )}

      {/* ── TẦNG 1: Context Text (1 dòng liền) ───────────────── */}
      {contextText ? (
        <div
          style={{
            opacity: line1Opacity,
            transform: `translateY(${line1Y}px)`,
            fontSize: fontSize1,
            fontWeight: 900,
            fontFamily: fontFace,
            color: hookData?.textColor || el.color || 'var(--text)',
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
            lineHeight: 1.05,
            textShadow: 'var(--text-depth)',
          }}
        >
          {contextText}
        </div>
      ) : null}

      {/* ── TẦNG 2: SOLID BOX với Shimmer + Number Pop ────────── */}
      {highlightPhrase && (
        <div
          style={{
            opacity: boxPopOpacity,
            transform: `scale(${boxPopScale}) translateY(${boxPopY}px)`,
            transformOrigin: isLeftAlign ? 'left center' : 'center center',
            position: 'relative',
            overflow: 'hidden',
            display: 'inline-flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: isLeftAlign ? 'flex-start' : 'center',
            gap: '0.25em',
            backgroundColor: accent,
            color: accentFg,
            fontFamily: fontFace,
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
            lineHeight: 1.08,
            padding: '6px 18px 10px',
            borderRadius: 8,
            boxShadow: `0 6px 28px ${mixColor(accent, 22)}, var(--shadow-sm)`,
          }}
        >
          {/* ── Shimmer sweep overlay ─────────────────────────── */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: `linear-gradient(
                90deg,
                transparent 0%,
                rgba(255,255,255,0.38) 50%,
                transparent 100%
              )`,
              backgroundSize: '60% 100%',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: `${shimmerX}% 0`,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />

          {/* ── Token words: numbers get 1.5× pop ────────────── */}
          {tokens.map((token, i) =>
            token.isNumber ? (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  fontSize: fontSize2 * 1.45,
                  fontWeight: 900,
                  color: accentFg,
                  opacity: numOpacity,
                  transform: `scale(${numScale})`,
                  lineHeight: 1,
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                {token.word}
              </span>
            ) : (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  fontSize: fontSize2,
                  fontWeight: 900,
                  color: accentFg,
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                {token.word}
              </span>
            )
          )}
        </div>
      )}

      {/* Fallback: không có highlight */}
      {!highlightPhrase && !contextText && (
        <div
          style={{
            opacity: line1Opacity,
            transform: `translateY(${line1Y}px)`,
            fontSize: computedFontSize,
            fontWeight: 900,
            fontFamily: fontFace,
            color: hookData?.textColor || el.color || 'var(--text)',
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            textShadow: 'var(--text-depth)',
          }}
        >
          {heroTitle}
        </div>
      )}

      {/* ── TẦNG 3: Subtext Glassmorphism ────────────────────── */}
      {subText && (
        <div
          style={{
            opacity: boxOpacity,
            transform: `translateY(${boxTranslateY}px)`,
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            padding: '10px 16px',
            color: 'var(--text)',
            fontSize: 14,
            fontWeight: 500,
            borderRadius: 8,
            marginTop: 6,
            lineHeight: 1.4,
            letterSpacing: '0.01em',
          }}
        >
          {subText}
        </div>
      )}
    </div>
  );
});
