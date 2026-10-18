import React, { useMemo } from 'react';
import { evolvePath, getLength, getPointAtLength } from '@remotion/paths';
import { interpolate, Easing } from 'remotion';
import { noise2D } from '@remotion/noise';
import { ElementProps } from '../types';
import { RemotionElementWrapper } from '../core/RemotionElementWrapper';
import { HAND_DRAWN_SPECS } from '@/config/handDrawnCatalog';
import { mixColor } from '../../utils/rich-text-parser';

// ── SSOT: GLOBAL CACHE TỐC ĐỘ CAO CHO VECTOR PATH LENGTH ───────────────
const pathLengthCache = new Map<string, number>();

function getCachedPathLength(path: string): number {
  const cached = pathLengthCache.get(path);
  if (cached !== undefined) return cached;
  try {
    const len = getLength(path);
    pathLengthCache.set(path, len);
    return len;
  } catch {
    return 0;
  }
}

export const HandDrawnPathElement: React.FC<
  ElementProps & {
    frame: number;
    fps?: number;
    delayFrames?: number;
    durFrames?: number;
  }
> = React.memo(({
  el,
  positionStyle,
  computedStyle,
  frame,
  fps = 30,
  delayFrames = 0,
}) => {
  const w = el.width || HAND_DRAWN_SPECS.defaultWidth;
  const h = el.height || HAND_DRAWN_SPECS.defaultHeight;
  const color = el.stroke || el.accentColor || el.color || HAND_DRAWN_SPECS.defaultAccent;
  const secondaryColor = el.secondaryColor || HAND_DRAWN_SPECS.defaultSecondaryColor;
  const strokeWidth = el.strokeWidth ?? HAND_DRAWN_SPECS.defaultStrokeWidth;
  const pathD = el.svgContent || 'M 20 60 C 20 20, 80 15, 130 18 C 175 22, 190 55, 185 85 C 180 115, 130 125, 75 120 C 30 115, 15 80, 25 55 Z';
  const secondaryPathD = el.secondarySvgContent;
  const fillRule = el.fillRule || 'evenodd';
  const viewBox = el.viewBox || '0 0 210 140';
  const flipX = Boolean(el.flipX);
  const flipY = Boolean(el.flipY);

  // Determine if path is a filled closed vector or open stroke line using SSOT
  const isFilled = HAND_DRAWN_SPECS.isFilledPath(fillRule, pathD);
  const filledOutlineWidth = HAND_DRAWN_SPECS.calculateOutlineWidth(strokeWidth);

  // Parse viewBox coordinates for precise clipping & pen tip positioning
  const vbParts = useMemo(() => {
    const parts = (viewBox || '').trim().split(/[\s,]+/).map(Number);
    if (parts.length >= 4 && parts[2] > 0 && parts[3] > 0) {
      return { x: parts[0], y: parts[1], w: parts[2], h: parts[3] };
    }
    return { x: 0, y: 0, w, h };
  }, [viewBox, w, h]);

  const isVertical = vbParts.h > vbParts.w * 1.25;

  // Duration in frames (default 1.4s ~ 42 frames for a slow, natural, organic drawing stroke)
  const drawDurFrames = Math.max(15, Math.round((el.animDuration ?? HAND_DRAWN_SPECS.defaultAnimDuration) * fps));
  const localFrame = frame - (delayFrames || 0);

  // Progressive drawing from 0 to 1 with natural, steady hand-drawn easing
  const drawProgress = interpolate(
    localFrame,
    [0, drawDurFrames],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.35, 0.05, 0.2, 1.0),
    }
  );

  // Calculate evolved path segments using official @remotion/paths for stroke vectors
  const evolved = useMemo(() => {
    if (isFilled) return { strokeDasharray: 'none', strokeDashoffset: 0 };
    try {
      return evolvePath(drawProgress, pathD);
    } catch {
      return { strokeDasharray: 'none', strokeDashoffset: 0 };
    }
  }, [drawProgress, pathD, isFilled]);

  // Glowing pen-tip moving along the stroke path / sweep edge while actively drawing
  const penTip = useMemo(() => {
    if (drawProgress <= 0.01 || drawProgress >= 0.99) return null;
    if (!isFilled) {
      try {
        const totalLen = getCachedPathLength(pathD);
        if (totalLen <= 0) return null;
        return getPointAtLength(pathD, totalLen * drawProgress);
      } catch {
        return null;
      }
    } else {
      if (isVertical) {
        return {
          x: vbParts.x + vbParts.w * 0.5,
          y: vbParts.y + vbParts.h * drawProgress,
        };
      }
      return {
        x: vbParts.x + vbParts.w * drawProgress,
        y: vbParts.y + vbParts.h * 0.5,
      };
    }
  }, [drawProgress, pathD, isFilled, isVertical, vbParts]);

  // Line Boil Effect: Hữu cơ vi mô (organic micro-boil) sau khi vẽ xong
  const lineBoil = useMemo(() => {
    if (localFrame < drawDurFrames) return { dx: 0, dy: 0, rot: 0 };
    const boilSeed = el.id || 'doodle';
    const boilTime = Math.floor(frame / 3) * 0.4; // 8fps frame hold boil
    const dx = noise2D(`${boilSeed}-x`, boilTime, 0) * 0.6;
    const dy = noise2D(`${boilSeed}-y`, 0, boilTime) * 0.6;
    const rot = noise2D(`${boilSeed}-r`, boilTime, boilTime) * 0.4;
    return { dx, dy, rot };
  }, [localFrame, drawDurFrames, frame, el.id]);

  // Hidden before its start delay
  if (localFrame < 0) {
    return null;
  }

  // Scale & organic micro-boil transform for internal SVG
  const svgTransform = [
    flipX ? 'scaleX(-1)' : '',
    flipY ? 'scaleY(-1)' : '',
    lineBoil.dx || lineBoil.dy ? `translate(${lineBoil.dx.toFixed(2)}px, ${lineBoil.dy.toFixed(2)}px)` : '',
    lineBoil.rot ? `rotate(${lineBoil.rot.toFixed(2)}deg)` : '',
  ].filter(Boolean).join(' ') || undefined;

  const clipId = `hd-sweep-${el.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      <div
        style={{
          width: w,
          height: h,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box',
        }}
      >
        <svg
          viewBox={viewBox}
          style={{
            width: '100%',
            height: '100%',
            overflow: 'visible',
            transform: svgTransform,
            transformOrigin: 'center center',
          }}
        >
          {isFilled && (
            <defs>
              <clipPath id={clipId}>
                <rect
                  x={vbParts.x - 4}
                  y={vbParts.y - 4}
                  width={isVertical ? vbParts.w + 8 : Math.max(0, (vbParts.w + 8) * drawProgress)}
                  height={isVertical ? Math.max(0, (vbParts.h + 8) * drawProgress) : vbParts.h + 8}
                />
              </clipPath>
            </defs>
          )}

          {/* Filled compound vector (e.g. Highlighter Marker, Curved Arrow Shapes) */}
          {isFilled ? (
            <g clipPath={`url(#${clipId})`}>
              {secondaryPathD && (
                <path
                  d={secondaryPathD}
                  fill={secondaryColor}
                  stroke={filledOutlineWidth > 0 ? secondaryColor : undefined}
                  strokeWidth={filledOutlineWidth > 0 ? filledOutlineWidth * 0.8 : undefined}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  fillRule={fillRule}
                  opacity={Math.min(1, drawProgress * 1.5)}
                />
              )}
              <path
                d={pathD}
                fill={color}
                stroke={filledOutlineWidth > 0 ? color : undefined}
                strokeWidth={filledOutlineWidth > 0 ? filledOutlineWidth : undefined}
                strokeLinejoin="round"
                strokeLinecap="round"
                fillRule={fillRule}
                style={{ filter: `drop-shadow(0 0 8px ${mixColor(color, 40)})` }}
              />
            </g>
          ) : (
            <>
              {/* Optional Secondary Layer (White Highlights / Accents) */}
              {secondaryPathD && (
                <path
                  d={secondaryPathD}
                  fill="none"
                  stroke={secondaryColor}
                  strokeWidth={strokeWidth * 0.8}
                  fillRule={fillRule}
                  opacity={Math.min(1, drawProgress * 1.5)}
                />
              )}
              {/* Outer Glow Stroke (Zero Compute) */}
              <path
                d={pathD}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth + 4}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={evolved.strokeDasharray}
                strokeDashoffset={evolved.strokeDashoffset}
                opacity={0.3}
              />
              {/* Core Stroke */}
              <path
                d={pathD}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={evolved.strokeDasharray}
                strokeDashoffset={evolved.strokeDashoffset}
              />
            </>
          )}

          {/* Glowing Pen Tip (Both stroke and filled vectors) */}
          {penTip && (
            <g>
              <circle
                cx={penTip.x}
                cy={penTip.y}
                r={isFilled ? Math.min(12, strokeWidth * 2.0) : strokeWidth * 1.8}
                fill={color}
                opacity={0.35}
              />
              <circle
                cx={penTip.x}
                cy={penTip.y}
                r={isFilled ? Math.min(6, strokeWidth * 1.0) : strokeWidth * 0.9}
                fill="#FFFFFF"
              />
            </g>
          )}
        </svg>
      </div>
    </RemotionElementWrapper>
  );
});

