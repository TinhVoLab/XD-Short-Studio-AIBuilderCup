import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { ProgressBarConfig } from '../../types/scene';
import { mixColor } from '../utils/rich-text-parser';

interface ViralProgressBarProps {
  config?: ProgressBarConfig;
  accentColor?: string;
  sceneIndex?: number;
  totalScenes?: number;
}

export const ViralProgressBar: React.FC<ViralProgressBarProps> = ({
  config,
  accentColor = '#BEFF01',
  sceneIndex = 0,
  totalScenes = 1
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  if (!config || config.enabled === false) return null;

  const barColor = config.color || accentColor;
  const position = config.position || 'bottom';
  const height = Math.max(3, config.height || 6);
  const rawStyle = config.style || 'laser-comet';

  // Normalize style
  let styleMode: 'laser-comet' | 'liquid-aurora' | 'segmented-hud' | 'border-laser' | 'story-segments' = 'laser-comet';
  if (rawStyle === 'liquid-aurora' || rawStyle === 'gradient') {
    styleMode = 'liquid-aurora';
  } else if (rawStyle === 'segmented-hud' || rawStyle === 'solid') {
    styleMode = 'segmented-hud';
  } else if (rawStyle === 'border-laser') {
    styleMode = 'border-laser';
  } else if (rawStyle === 'story-segments') {
    styleMode = 'story-segments';
  }

  // Calculate raw progress 0% to 100% within current scene
  const rawSceneProgress = interpolate(frame, [0, durationInFrames], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  const isGlobalScope = config.scope === 'global' && totalScenes > 1;
  const progressPct = isGlobalScope
    ? Math.min(100, Math.max(0, ((sceneIndex + (rawSceneProgress / 100)) / totalScenes) * 100))
    : rawSceneProgress;

  const isTop = position === 'top';
  const isFloating = config.floating !== false; // Default true (floating capsule)

  // ── STYLE 5: STORY SEGMENTS (INSTAGRAM / TIKTOK REELS MULTI-SCENE BARS) ──
  if (styleMode === 'story-segments') {
    const numSegments = Math.max(1, totalScenes || 1);
    const currIdx = Math.min(numSegments - 1, Math.max(0, sceneIndex || 0));
    const segmentHeight = Math.max(2.5, Math.min(height, 6));

    return (
      <div
        style={{
          position: 'absolute',
          left: 12,
          right: 12,
          top: isTop ? 10 : undefined,
          bottom: !isTop ? 12 : undefined,
          display: 'flex',
          gap: 4,
          zIndex: 9999,
          pointerEvents: 'none',
        }}
      >
        {Array.from({ length: numSegments }).map((_, idx) => {
          let segmentPct = 0;
          if (idx < currIdx) {
            segmentPct = 100;
          } else if (idx === currIdx) {
            segmentPct = rawSceneProgress;
          } else {
            segmentPct = 0;
          }

          const isActive = idx === currIdx;

          return (
            <div
              key={idx}
              style={{
                flex: 1,
                height: segmentHeight,
                backgroundColor: 'rgba(255, 255, 255, 0.32)',
                borderRadius: segmentHeight / 2,
                overflow: 'hidden',
                position: 'relative',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${segmentPct}%`,
                  backgroundColor: barColor,
                  borderRadius: segmentHeight / 2,
                  boxShadow: isActive ? `0 0 8px ${barColor}, 0 0 14px ${mixColor(barColor, 60)}` : 'none',
                }}
              />
              {/* Active Sparkle Glow at segment tip */}
              {isActive && segmentPct > 0 && segmentPct < 100 && (
                <div
                  style={{
                    position: 'absolute',
                    left: `${segmentPct}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: segmentHeight * 2.2,
                    height: segmentHeight * 2.2,
                    borderRadius: '50%',
                    backgroundColor: '#FFFFFF',
                    boxShadow: `0 0 6px #FFFFFF, 0 0 10px ${barColor}`,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ── STYLE 4: BORDER LASER 360° (NEON WIREFRAME) ──────────────
  if (styleMode === 'border-laser') {
    const offset = 6;
    const rectWidth = 360 - 2 * offset;
    const rectHeight = 640 - 2 * offset;
    const rx = 10;
    
    // Total perimeter calculation
    const straightParts = 2 * (rectWidth - 2 * rx) + 2 * (rectHeight - 2 * rx);
    const cornerParts = 2 * Math.PI * rx;
    const totalPerimeter = Math.round(straightParts + cornerParts);
    const currentLength = (progressPct / 100) * totalPerimeter;

    // Piecewise Comet Head Coordinate Calculation (Clockwise starting at top-left)
    const L_top = rectWidth;
    const L_right = rectHeight;
    const L_bottom = rectWidth;
    const L_left = rectHeight;
    const approxPerimeter = 2 * (L_top + L_right);
    const d = (progressPct / 100) * approxPerimeter;

    let headX = offset;
    let headY = offset;

    if (d <= L_top) {
      headX = offset + d;
      headY = offset;
    } else if (d <= L_top + L_right) {
      headX = offset + L_top;
      headY = offset + (d - L_top);
    } else if (d <= L_top + L_right + L_bottom) {
      headX = offset + L_top - (d - (L_top + L_right));
      headY = offset + L_right;
    } else {
      headX = offset;
      headY = offset + L_right - (d - (L_top + L_right + L_bottom));
    }

    const laserThick = Math.max(3, height);
    const cometSize = laserThick * 2.6;

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 9999,
          pointerEvents: 'none',
          overflow: 'hidden'
        }}
      >
        <svg
          width="360"
          height="640"
          viewBox="0 0 360 640"
          style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
        >
          {/* 1. Subtle Background Track */}
          <rect
            x={offset}
            y={offset}
            width={rectWidth}
            height={rectHeight}
            rx={rx}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={Math.max(1.5, laserThick * 0.4)}
          />

          {/* 2. Outer Neon Ambient Halo */}
          <rect
            x={offset}
            y={offset}
            width={rectWidth}
            height={rectHeight}
            rx={rx}
            fill="none"
            stroke={barColor}
            strokeWidth={laserThick + 4}
            strokeDasharray={`${currentLength} ${totalPerimeter}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            opacity={0.35}
            style={{ filter: `drop-shadow(0 0 8px ${barColor})` }}
          />

          {/* 3. Glowing Neon Laser Beam */}
          <rect
            x={offset}
            y={offset}
            width={rectWidth}
            height={rectHeight}
            rx={rx}
            fill="none"
            stroke={barColor}
            strokeWidth={laserThick}
            strokeDasharray={`${currentLength} ${totalPerimeter}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${barColor}) drop-shadow(0 0 12px ${barColor})` }}
          />

          {/* 4. White-Hot Energy Core */}
          <rect
            x={offset}
            y={offset}
            width={rectWidth}
            height={rectHeight}
            rx={rx}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={Math.max(1.5, laserThick * 0.35)}
            strokeDasharray={`${currentLength} ${totalPerimeter}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            opacity={0.9}
          />
        </svg>

        {/* 5. Glowing Comet Head Flare */}
        {progressPct > 0 && progressPct < 100 && (
          <div
            style={{
              position: 'absolute',
              left: headX,
              top: headY,
              width: cometSize,
              height: cometSize,
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              boxShadow: `0 0 10px #FFFFFF, 0 0 20px ${barColor}, 0 0 35px ${barColor}`,
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none'
            }}
          >
            <div
              style={{
                width: cometSize * 0.45,
                height: cometSize * 0.45,
                borderRadius: '50%',
                backgroundColor: barColor,
                boxShadow: `0 0 6px #FFFFFF`
              }}
            />
          </div>
        )}

        {/* 6. Sleek Minimal Percent Badge (Top-Right) */}
        <div
          style={{
            position: 'absolute',
            top: offset + 10,
            right: offset + 10,
            padding: '2px 6px',
            backgroundColor: 'rgba(6, 13, 22, 0.86)',
            border: `1px solid ${mixColor(barColor, 33)}`,
            borderRadius: 4,
            fontSize: 8.5,
            fontWeight: 800,
            fontFamily: 'monospace',
            color: barColor,
            letterSpacing: 0.5,
            boxShadow: `0 0 8px ${mixColor(barColor, 13)}`
          }}
        >
          {Math.round(progressPct)}%
        </div>
      </div>
    );
  }

  // ── STYLE 3: SEGMENTED CYBER HUD ──────────────────────────────
  if (styleMode === 'segmented-hud') {
    const totalBlocks = 22;
    const activeBlocksCount = Math.floor((progressPct / 100) * totalBlocks);

    return (
      <div
        style={{
          position: 'absolute',
          left: isFloating ? 14 : 0,
          right: isFloating ? 14 : 0,
          top: isTop ? (isFloating ? 14 : 0) : undefined,
          bottom: !isTop ? (isFloating ? 14 : 0) : undefined,
          zIndex: 9999,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}
      >
        {/* Segmented Track Capsule */}
        <div
          style={{
            flex: 1,
            height: height + 6,
            backgroundColor: 'rgba(6, 13, 22, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            borderRadius: 6,
            padding: '2px 4px',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.7), inset 0 1px 2px rgba(255,255,255,0.15)',
            boxSizing: 'border-box'
          }}
        >
          {Array.from({ length: totalBlocks }).map((_, idx) => {
            const isFilled = idx < activeBlocksCount;
            const isJustActivated = idx === activeBlocksCount - 1;

            return (
              <div
                key={idx}
                style={{
                  flex: 1,
                  height: '100%',
                  borderRadius: 2,
                  backgroundColor: isJustActivated
                    ? '#FFFFFF'
                    : isFilled
                    ? barColor
                    : 'rgba(255, 255, 255, 0.08)',
                  boxShadow: isJustActivated
                    ? `0 0 14px #FFFFFF, 0 0 20px ${barColor}`
                    : isFilled
                    ? `0 0 8px ${mixColor(barColor, 60)}`
                    : 'none',
                  transform: isJustActivated ? 'scaleY(1.15)' : 'scaleY(1)',
                }}
              />
            );
          })}
        </div>

        {/* Micro Percentage HUD Tag */}
        <div
          style={{
            padding: '2px 6px',
            backgroundColor: 'rgba(6, 13, 22, 0.85)',
            border: `1px solid ${mixColor(barColor, 40)}`,
            borderRadius: 4,
            fontSize: 9,
            fontWeight: 800,
            fontFamily: 'monospace',
            color: barColor,
            letterSpacing: 0.5,
            boxShadow: `0 0 10px ${mixColor(barColor, 20)}`,
            minWidth: 34,
            textAlign: 'center'
          }}
        >
          {Math.round(progressPct)}%
        </div>
      </div>
    );
  }

  // ── STYLE 2: LIQUID AURORA ────────────────────────────────────
  if (styleMode === 'liquid-aurora') {
    const shimmerOffset = ((frame * 8) % 360) - 60;

    return (
      <div
        style={{
          position: 'absolute',
          left: isFloating ? 14 : 0,
          right: isFloating ? 14 : 0,
          top: isTop ? (isFloating ? 14 : 0) : undefined,
          bottom: !isTop ? (isFloating ? 14 : 0) : undefined,
          height: height + 4,
          backgroundColor: 'rgba(6, 13, 22, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: 100,
          padding: 2,
          boxShadow: 'var(--shadow-md, 0 6px 24px rgba(0,0,0,0.8)), inset 0 1px 3px rgba(255,255,255,0.2)',
          zIndex: 9999,
          overflow: 'hidden',
          pointerEvents: 'none',
          boxSizing: 'border-box'
        }}
      >
        {/* Aurora Fluid Flow Bar */}
        <div
          style={{
            height: '100%',
            width: `${progressPct}%`,
            borderRadius: 100,
            backgroundImage:
              'linear-gradient(90deg, #FF007F 0%, #7928CA 30%, #00F0FF 70%, #BEFF01 100%)',
            backgroundSize: '200% 100%',
            boxShadow: '0 0 16px #00F0FFaa, 0 0 30px #FF007F88, 0 0 45px #BEFF0166',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Continuous Shimmer Light Sweep */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: 40,
              left: shimmerOffset,
              backgroundImage:
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)',
              transform: 'skewX(-20deg)',
              pointerEvents: 'none'
            }}
          />

          {/* Top 3D Glass Highlight */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '40%',
              backgroundImage:
                'linear-gradient(180deg, rgba(255,255,255,0.45) 0%, transparent 100%)',
              borderRadius: 100
            }}
          />
        </div>
      </div>
    );
  }

  // ── STYLE 1: CYBER LASER COMET (DEFAULT) ──────────────────────
  const cometSize = height + 8;

  return (
    <div
      style={{
        position: 'absolute',
        left: isFloating ? 14 : 0,
        right: isFloating ? 14 : 0,
        top: isTop ? (isFloating ? 14 : 0) : undefined,
        bottom: !isTop ? (isFloating ? 14 : 0) : undefined,
        height: height + 4,
        backgroundColor: 'rgba(6, 13, 22, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: 100,
        padding: 2,
        boxShadow: 'var(--shadow-md, 0 6px 24px rgba(0,0,0,0.8)), inset 0 1px 3px rgba(255,255,255,0.2)',
        zIndex: 9999,
        overflow: 'visible',
        pointerEvents: 'none',
        boxSizing: 'border-box'
      }}
    >
      {/* Micro-Ticks on Background Track (25%, 50%, 75%) */}
      {[25, 50, 75].map(tick => (
        <div
          key={tick}
          style={{
            position: 'absolute',
            left: `${tick}%`,
            top: 2,
            bottom: 2,
            width: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            zIndex: 1
          }}
        />
      ))}

      {/* Active Laser Bar with White-Hot Core */}
      <div
        style={{
          height: '100%',
          width: `${progressPct}%`,
          borderRadius: 100,
          backgroundImage: `linear-gradient(90deg, ${mixColor(barColor, 27)} 0%, ${barColor} 65%, #FFFFFF 100%)`,
          boxShadow: `0 0 14px ${barColor}, 0 0 28px ${mixColor(barColor, 67)}, 0 0 45px ${mixColor(barColor, 33)}`,
          position: 'relative',
        }}
      >
        {/* Inner Laser Beam (White Hot Center) */}
        <div
          style={{
            position: 'absolute',
            left: 2,
            right: 2,
            top: '50%',
            transform: 'translateY(-50%)',
            height: Math.max(1.5, height * 0.3),
            backgroundColor: '#FFFFFF',
            borderRadius: 100,
            opacity: 0.9,
            boxShadow: '0 0 6px #FFFFFF'
          }}
        />

        {/* 3-Tier Glowing Comet Head Flare */}
        {progressPct > 0 && (
          <div
            style={{
              position: 'absolute',
              right: -(cometSize / 2),
              top: '50%',
              transform: 'translateY(-50%)',
              width: cometSize,
              height: cometSize,
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              boxShadow: `0 0 12px #FFFFFF, 0 0 24px ${barColor}, 0 0 45px ${barColor}`,
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Inner Core Pulse */}
            <div
              style={{
                width: cometSize * 0.45,
                height: cometSize * 0.45,
                borderRadius: '50%',
                backgroundColor: barColor,
                boxShadow: `0 0 8px #FFFFFF`
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
