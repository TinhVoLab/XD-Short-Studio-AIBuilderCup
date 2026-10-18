import React, { useMemo } from 'react';
import { AbsoluteFill, interpolate, random } from 'remotion';
import type { TransitionPresentation, TransitionPresentationComponentProps } from '@remotion/transitions';

/**
 * Transition điện ảnh tự viết cho TransitionSeries. Mọi biến thiên là hàm thuần của
 * presentationProgress (+ random có seed) nên preview và render khớp nhau tuyệt đối.
 * Không nhân bản children (mỗi cảnh chỉ render 1 lần) để giữ hiệu năng render.
 */

type EmptyProps = Record<string, never>;

// ── Glitch: cảnh cũ giật ngang + lệch màu theo nhịp bậc, cảnh mới lộ ra qua các dải quét ──
const GLITCH_STEPS = 8;

const GlitchPresentation: React.FC<TransitionPresentationComponentProps<EmptyProps>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
}) => {
  const style = useMemo<React.CSSProperties>(() => {
    const step = Math.floor(p * GLITCH_STEPS);
    const jolt = Math.sin(Math.PI * p);
    const r = (k: string) => random(`glitch-${k}-${presentationDirection}-${step}`);

    if (presentationDirection === 'exiting') {
      return {
        transform: `translateX(${((r('x') - 0.5) * 36 * jolt).toFixed(1)}px) skewX(${((r('s') - 0.5) * 10 * jolt).toFixed(1)}deg)`,
        filter: r('f') > 0.5 ? `hue-rotate(${Math.round(r('h') * 180)}deg) saturate(1.8) contrast(1.2)` : undefined,
        opacity: p < 0.55 ? 1 : 0,
      };
    }

    // entering: các dải ngang lộ dần, khoá hoàn toàn từ 75%
    if (p >= 0.75) return {};
    if (p < 0.35) return { opacity: 0 };
    const bandTop = Math.round(r('t') * 60);
    const bandBottom = Math.round((1 - interpolate(p, [0.35, 0.75], [0.3, 1])) * (100 - bandTop));
    return {
      clipPath: `inset(${bandTop}% 0 ${bandBottom}% 0)`,
      transform: `translateX(${((r('ex') - 0.5) * 18).toFixed(1)}px)`,
    };
  }, [p, presentationDirection]);

  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

export const glitch = (): TransitionPresentation<EmptyProps> => ({
  component: GlitchPresentation,
  props: {} as EmptyProps,
});

// ── Zoom blur: lao xuyên qua cảnh cũ, cảnh mới thu về từ xa kèm nhoè chuyển động ──
const ZoomBlurPresentation: React.FC<TransitionPresentationComponentProps<EmptyProps>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
}) => {
  const style = useMemo<React.CSSProperties>(() => {
    if (presentationDirection === 'exiting') {
      return {
        transform: `scale(${interpolate(p, [0, 1], [1, 1.45]).toFixed(3)})`,
        filter: `blur(${interpolate(p, [0, 1], [0, 12]).toFixed(1)}px)`,
        opacity: interpolate(p, [0.4, 0.8], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
      };
    }
    return {
      transform: `scale(${interpolate(p, [0, 1], [0.78, 1]).toFixed(3)})`,
      filter: p < 1 ? `blur(${interpolate(p, [0, 1], [12, 0]).toFixed(1)}px)` : undefined,
      opacity: interpolate(p, [0.25, 0.6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
    };
  }, [p, presentationDirection]);

  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

export const zoomBlur = (): TransitionPresentation<EmptyProps> => ({
  component: ZoomBlurPresentation,
  props: {} as EmptyProps,
});

// ── Whip pan: lia máy nhanh sang ngang, nhoè mạnh ở giữa cú lia ──
const WhipPanPresentation: React.FC<TransitionPresentationComponentProps<EmptyProps>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
}) => {
  const style = useMemo<React.CSSProperties>(() => {
    const blur = (Math.sin(Math.PI * p) * 14).toFixed(1);
    const x = presentationDirection === 'exiting' ? -100 * p : 100 * (1 - p);
    return {
      transform: `translateX(${x.toFixed(2)}%) skewX(${(presentationDirection === 'exiting' ? 1 : -1) * Math.sin(Math.PI * p) * 6}deg)`,
      filter: `blur(${blur}px)`,
    };
  }, [p, presentationDirection]);

  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

export const whipPan = (): TransitionPresentation<EmptyProps> => ({
  component: WhipPanPresentation,
  props: {} as EmptyProps,
});

// ── Cross blur: nhoè chéo hai cảnh bằng CSS filter ──
// Thay cho linearBlur của @remotion/transitions vốn cần HTML-in-Canvas (Chrome 148+ / flag),
// không chạy được trên đa số trình duyệt người dùng.
const CrossBlurPresentation: React.FC<TransitionPresentationComponentProps<EmptyProps>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
}) => {
  const style = useMemo<React.CSSProperties>(() => {
    const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const };
    if (presentationDirection === 'exiting') {
      return {
        filter: `blur(${interpolate(p, [0, 0.6], [0, 10], clamp).toFixed(1)}px)`,
        opacity: interpolate(p, [0.35, 0.9], [1, 0], clamp),
      };
    }
    return {
      filter: p < 1 ? `blur(${interpolate(p, [0.3, 1], [10, 0], clamp).toFixed(1)}px)` : undefined,
      opacity: interpolate(p, [0.2, 0.7], [0, 1], clamp),
    };
  }, [p, presentationDirection]);

  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

export const crossBlur = (): TransitionPresentation<EmptyProps> => ({
  component: CrossBlurPresentation,
  props: {} as EmptyProps,
});
