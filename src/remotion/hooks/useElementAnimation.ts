import { useCurrentFrame, useVideoConfig } from 'remotion';
import React from 'react';
import { SceneElement, ElementKeyframe, KeyframeProperty } from '../../types/scene';

import { getElementAlignment } from '@/config/fabricPlaceholders';
import { getPresetPose, normalizeAnimPreset } from './animPresets';
import { isLegacyDarkTextColor } from '@/config/themePalettes';


const EMPHASIS_FRAMES = 12;
const EMPHASIS_SCALE = 0.06;

export function evalKeyframe(keyframes: ElementKeyframe[] | undefined, prop: KeyframeProperty, timePct: number, defaultVal: number): number {
  if (!keyframes || keyframes.length === 0) return defaultVal;
  const propKfs = keyframes.filter(k => k.property === prop).sort((a, b) => a.timePct - b.timePct);
  if (propKfs.length === 0) return defaultVal;

  if (timePct <= propKfs[0].timePct) return propKfs[0].value;
  if (timePct >= propKfs[propKfs.length - 1].timePct) return propKfs[propKfs.length - 1].value;

  for (let i = 0; i < propKfs.length - 1; i++) {
    const k1 = propKfs[i];
    const k2 = propKfs[i + 1];
    if (timePct >= k1.timePct && timePct <= k2.timePct) {
      const alpha = (timePct - k1.timePct) / (k2.timePct - k1.timePct);
      return k1.value + (k2.value - k1.value) * alpha;
    }
  }

  return defaultVal;
}

export function useElementAnimation(el: SceneElement, fps: number, sceneDuration?: number) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  
  const preset = el.animPreset || 'slide-up';
  const durFrames = (el.animDuration || 0.6) * fps;
  const isLargeTitle = (el.fontSize && el.fontSize >= 30);
  const rawDelay = isLargeTitle ? Math.min(0.2, el.animDelay || 0) : (el.animDelay || 0);
  const delayFrames = rawDelay * fps;

  // Animation values
  let left = el.left;
  let top = el.top;
  let offsetX = 0;
  let offsetY = 0;
  let rotateX = 0;
  let opacity = el.opacity ?? 1;
  let scaleX = el.scaleX || 1;
  let scaleY = el.scaleY || 1;
  if (el.type === 'character-mascot') {
    // Tự động khôi phục scale nếu bị lỗi lưu từ kích thước gốc của Fabric Image
    if (scaleX < 0.5 || scaleX > 3) scaleX = 1;
    if (scaleY < 0.5 || scaleY > 3) scaleY = 1;
  }
  let angle = el.angle || 0;
  let content = el.content;

  // Caption and Fake-Search elements handle their own internal frame-based animation.
  // Hand-drawn bypasses container entrance animation ONLY when preset is 'none' (allowing users to combine entrance presets if selected).
  const isHandDrawnWithNonePreset = el.type === 'hand-drawn' && (!preset || preset === 'none');
  if (el.type !== 'caption' && el.type !== 'fake-search' && !isHandDrawnWithNonePreset) {
    const localFrame = frame - delayFrames;
    if (localFrame < 0) {
      opacity = 0; // Not visible yet
    } else if (localFrame <= durFrames) {
      const pose = getPresetPose(preset, localFrame, durFrames, fps, el.id);
      opacity = (el.opacity ?? 1) * pose.opacity;
      offsetX = pose.dx;
      offsetY = pose.dy;
      scaleX *= pose.scale;
      scaleY *= pose.scale;
      angle += pose.rotate;
      rotateX = pose.rotateX;

      if (normalizeAnimPreset(preset) === 'typewriter' && el.type === 'text' && el.content) {
        const progress = Math.min(1, localFrame / Math.max(1, durFrames));
        content = el.content.slice(0, Math.max(1, Math.floor(progress * el.content.length)));
      }
    } else if (!el.keyframes || el.keyframes.length === 0) {
      // Subtle idle breath motion for select animated objects (kept ultra-refined: ±0.4%)
      const ALLOW_BREATH_TYPES = new Set(['character-mascot', 'badge', 'circle-chart', 'breathing-circle', 'vinyl-pulse']);
      if (ALLOW_BREATH_TYPES.has(el.type)) {
        const idleFrame = frame - (delayFrames + durFrames);
        const breathCycle = Math.sin((idleFrame / fps) * Math.PI * 0.6) * 0.004;
        scaleX = scaleX * (1 + breathCycle);
        scaleY = scaleY * (1 + breathCycle);
      }
    }
  }

  // ── Exit: chạy ngược preset tại exitAtSec (neo theo từ) hoặc ngay trước khi hết cảnh ──
  if (el.exitPreset && el.exitPreset !== 'none' && sceneDuration) {
    const exitDurFrames = Math.max(6, Math.round(Math.min(el.animDuration || 0.5, 0.6) * fps));
    const fallbackStart = Math.round(sceneDuration * fps) - exitDurFrames - 2;
    const requestedStart = el.exitAtSec !== undefined ? Math.round(el.exitAtSec * fps) : fallbackStart;
    const exitStart = Math.max(Math.round(delayFrames + durFrames), requestedStart);
    const elapsed = frame - exitStart;
    if (elapsed >= exitDurFrames) {
      opacity = 0;
    } else if (elapsed >= 0) {
      const pose = getPresetPose(el.exitPreset, exitDurFrames - elapsed, exitDurFrames, fps, `${el.id}-exit`);
      opacity = (el.opacity ?? 1) * pose.opacity;
      offsetX = pose.dx;
      offsetY = pose.dy;
      scaleX = (el.scaleX || 1) * pose.scale;
      scaleY = (el.scaleY || 1) * pose.scale;
      angle = (el.angle || 0) + pose.rotate;
      rotateX = pose.rotateX;
    }
  }

  // ── Emphasis: pulse ngắn khi giọng đọc chạm từ được nhấn ──
  if (el.emphasisAtSec && el.emphasisAtSec.length > 0) {
    for (const atSec of el.emphasisAtSec) {
      const e = frame - Math.round(atSec * fps);
      if (e >= 0 && e <= EMPHASIS_FRAMES) {
        const pulse = 1 + EMPHASIS_SCALE * Math.sin(Math.PI * (e / EMPHASIS_FRAMES));
        scaleX *= pulse;
        scaleY *= pulse;
        break;
      }
    }
  }

  // Evaluate custom keyframes if defined
  if (el.keyframes && el.keyframes.length > 0) {
    const sceneTimePct = Math.max(0, Math.min(100, (frame / durationInFrames) * 100));

    if (el.keyframes.some(k => k.property === 'position')) {
      top += evalKeyframe(el.keyframes, 'position', sceneTimePct, 0);
    }
    if (el.keyframes.some(k => k.property === 'scale')) {
      const kfScale = evalKeyframe(el.keyframes, 'scale', sceneTimePct, 1);
      scaleX *= kfScale;
      scaleY *= kfScale;
    }
    if (el.keyframes.some(k => k.property === 'opacity')) {
      opacity *= evalKeyframe(el.keyframes, 'opacity', sceneTimePct, 1);
    }
    if (el.keyframes.some(k => k.property === 'rotation')) {
      angle += evalKeyframe(el.keyframes, 'rotation', sceneTimePct, 0);
    }
  }

  // Determine alignment based on Fabric group origins & standardized Origin Matrix
  const align = getElementAlignment(el);
  const isCenterCenter = align.isCenterX && align.isCenterY;
  const isCenterTop = align.isCenterX && !align.isCenterY;
  const isRightTop = (align as any).isRightX;

  const xShift = offsetX.toFixed(2);
  const yShift = offsetY.toFixed(2);
  const tail = `scale(${scaleX}, ${scaleY}) rotate(${angle}deg)${rotateX ? ` perspective(800px) rotateX(${rotateX.toFixed(2)}deg)` : ''}`;
  let transform = `translate3d(${xShift}px, ${yShift}px, 0) ${tail}`;
  let transformOrigin = 'left top';

  if (isCenterCenter) {
    transform = `translate3d(calc(-50% + ${xShift}px), calc(-50% + ${yShift}px), 0) ${tail}`;
    transformOrigin = 'center center';
  } else if (isCenterTop) {
    transform = `translate3d(calc(-50% + ${xShift}px), ${yShift}px, 0) ${tail}`;
    transformOrigin = 'center top';
  } else if (isRightTop) {
    transform = `translate3d(calc(-100% + ${xShift}px), ${yShift}px, 0) ${tail}`;
    transformOrigin = 'right top';
  }

  // Fix text contrast: avoid black text on dark background
  const isBasicText = el.type === 'text';
  const hasGradient = isBasicText && !!(el.textGradientFrom && el.textGradientTo);
  // Không có màu hoặc đen kiểu cũ → màu chữ của theme (khớp resolveTextColor bên Fabric)
  const textColor = (!el.color || isLegacyDarkTextColor(el.color)) ? 'var(--text, #FFFFFF)' : el.color;
  const isCenteredWidget = isCenterCenter || el.type === 'badge';
  const textAlign = (el.type === 'text' || el.type === 'caption' || el.type === 'badge')
    ? (el.textAlign || (el.type === 'badge' ? 'center' : 'left'))
    : (isCenteredWidget ? 'center' : 'left');
  const justifyContent = textAlign === 'center' ? 'center' : (textAlign === 'right' ? 'flex-end' : 'flex-start');

  // 1. Position & Layout Style (For Wrapper - GPU accelerated)
  const positionStyle: React.CSSProperties = {
    position: 'absolute',
    willChange: 'transform, opacity',
    left: left,
    top: top,
    width: el.width || ((el.type === 'text' || el.type === 'caption') ? 320 : undefined),
    maxWidth: (el.type === 'text' || el.type === 'caption') ? 352 : undefined,
    transform,
    transformOrigin,
    opacity,
    backfaceVisibility: 'hidden',
  };

  // 2. Text Style (For Inner Component)
  const hasStroke = Boolean(isBasicText && el.textStroke && (el.textStrokeWidth ?? 0) > 0);
  const strokeWidth = el.textStrokeWidth || 1.5;
  const strokeColor = el.textStroke || '#000000';

  // Bóng/phát sáng chữ chỉ khi có màu VÀ độ nhoè > 0 (tắt trong Inspector = nhoè 0, màu vẫn được giữ lại)
  const glowBlur = el.shadowColor ? (el.shadowBlur ?? 8) : 0;
  let resolvedTextShadow: string | undefined = undefined;
  if (isBasicText && hasStroke) {
    // 8-directional crisp outline: bao quanh viền ngoài 100%, không bao giờ cắt nét tiếng Việt (Đ, N, Ớ, Ê)
    const d = strokeWidth.toFixed(1);
    const diag = (strokeWidth * 0.707).toFixed(1);
    const outline = `${d}px 0 0 ${strokeColor}, -${d}px 0 0 ${strokeColor}, 0 ${d}px 0 ${strokeColor}, 0 -${d}px 0 ${strokeColor}, ${diag}px ${diag}px 0 ${strokeColor}, -${diag}px -${diag}px 0 ${strokeColor}, ${diag}px -${diag}px 0 ${strokeColor}, -${diag}px ${diag}px 0 ${strokeColor}`;
    resolvedTextShadow = glowBlur > 0
      ? `${outline}, 0 0 ${glowBlur}px ${el.shadowColor}`
      : outline;
  } else if (isBasicText && glowBlur > 0) {
    resolvedTextShadow = `0px 0px ${glowBlur}px ${el.shadowColor}`;
  } else if (el.shadow) {
    resolvedTextShadow = '0px 2px 8px rgba(0,0,0,0.7)';
  }

  const textStyle: React.CSSProperties = {
    color: (isBasicText && hasGradient) ? 'transparent' : textColor,
    fontSize: el.fontSize,
    fontFamily: el.fontFamily || 'Inter',
    fontWeight: ((el.fontFamily === 'Be Vietnam Pro' || el.fontFamily === 'Poppins') && (!el.fontWeight || el.fontWeight === 400 || el.fontWeight === '400')) ? 800 : (el.fontWeight || 700),
    textAlign,
    whiteSpace: 'pre-wrap',
    overflowWrap: 'normal',
    wordBreak: 'normal',
    lineHeight: 1.15,
    ...(isBasicText && {
      lineHeight: el.lineHeight ?? 1.15,
      letterSpacing: el.letterSpacing != null ? `${el.letterSpacing}px` : undefined,
      textTransform: el.textTransform ?? undefined,
      textShadow: resolvedTextShadow,
      background: hasGradient
        ? `linear-gradient(${el.textGradientAngle ?? 135}deg, ${el.textGradientFrom}, ${el.textGradientTo})`
        : undefined,
      WebkitBackgroundClip: hasGradient ? 'text' : undefined,
      backgroundClip:       hasGradient ? 'text' : undefined,
      WebkitTextFillColor:  hasGradient ? 'transparent' : undefined,
    }),
  };

  if (!isBasicText && el.shadow) {
    textStyle.textShadow = '0px 0px 10px rgba(0,0,0,0.5)';
  }

  // 3. Legacy Style (For backward compatibility with un-migrated elements)
  const style: React.CSSProperties = {
    ...positionStyle,
    ...textStyle,
    display: 'flex',
    alignItems: 'center',
    justifyContent,
  };

  return {
    frame,
    durFrames,
    delayFrames,
    opacity,
    left,
    top,
    scaleX,
    scaleY,
    angle,
    content,
    style,
    positionStyle,
    textStyle
  };
}
