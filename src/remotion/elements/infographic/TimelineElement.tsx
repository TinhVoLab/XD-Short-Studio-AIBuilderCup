import React from 'react';
import { spring, Easing } from 'remotion';
import { ElementProps } from '../types';
import { RemotionElementWrapper } from '../core/RemotionElementWrapper';
import { renderUniversalIcon } from '../../utils/icons';
import { mixColor } from '../../utils/rich-text-parser';

export const TimelineElement: React.FC<
  ElementProps & { frame: number; fps: number; delayFrames: number; durFrames: number }
> = ({
  el,
  computedStyle,
  positionStyle,
  frame,
  fps,
  delayFrames,
  durFrames,
}) => {
  const steps = (el.flowSteps && el.flowSteps.length > 0) ? el.flowSteps : [
    { title: 'Hôm Qua', subtitle: 'Đau buồn & học hỏi' },
    { title: 'Hôm Nay', subtitle: 'Chấp nhận & tĩnh lặng' },
    { title: 'Mai Sau', subtitle: 'Bình an & vững vàng' }
  ];

  const w = el.width || 290;
  const accent = el.accentColor || el.color || 'var(--accent)';
  const baseFontSize = el.fontSize || 14;
  const stepCount = steps.length;
  const gap = stepCount > 3 ? 12 : 16;

  const title = String(el.title ?? el.content ?? '').trim();
  const hasTitle = Boolean(title);
  const showCardBg = el.showCardBg !== false;

  // Animation Progress (0 to 1)
  const animDur = Math.max(1, durFrames || 45);
  const progress = Math.min(1, Math.max(0, (frame - (delayFrames || 0)) / animDur));
  const easeProgress = Easing.out(Easing.cubic)(progress);

  // Geometric Constants for pixel-perfect center alignment
  const NODE_SIZE = 28;
  const NODE_HALF = NODE_SIZE / 2; // 14px exact center
  const TRACK_WIDTH = 2;
  const TRACK_LEFT = NODE_HALF - TRACK_WIDTH / 2; // 13px exact center

  // Find active step index based on progress
  const activeStepIdx = Math.min(stepCount - 1, Math.floor(easeProgress * stepCount));

  const fontFamily = el.fontFamily || 'var(--font-sans, "Be Vietnam Pro", sans-serif)';

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      <div
        style={{
          width: w,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'flex-start',
          textAlign: 'left',
          position: 'relative',
          boxSizing: 'border-box',
          pointerEvents: 'none',
          background: showCardBg
            ? (el.bgColor || 'var(--card-bg)')
            : 'transparent',
          border: showCardBg ? '1px solid var(--border)' : 'none',
          borderRadius: showCardBg ? (el.radius !== undefined ? el.radius : 16) : 0,
          boxShadow: showCardBg ? 'var(--shadow-md, 0 12px 32px rgba(0, 0, 0, 0.5)), 0 0 0 1px var(--border) inset' : 'none',
          padding: showCardBg ? '14px 14px' : '6px 6px',
        }}
      >
        {/* Dynamic Header Bar (Tự động ẩn khi không có tiêu đề) */}
        {hasTitle && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border)',
              paddingBottom: 8,
              marginBottom: 12,
              width: '100%',
              zIndex: 3,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: 'var(--text)',
                  letterSpacing: '0.02em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontFamily,
                }}
              >
                {title}
              </span>
            </div>

            <div
              style={{
                fontSize: 8.5,
                fontWeight: 700,
                color: accent,
                fontFamily: 'monospace',
                background: mixColor(accent, 9),
                border: `1px solid ${mixColor(accent, 20)}`,
                padding: '2px 6px',
                borderRadius: 4,
                flexShrink: 0,
              }}
            >
              {stepCount} MỐC
            </div>
          </div>
        )}

        {/* Steps & Spine Track Container */}
        <div style={{ position: 'relative', width: '100%' }}>
          {/* 1. Base Spine Track */}
          <div
            style={{
              position: 'absolute',
              left: TRACK_LEFT,
              top: NODE_HALF,
              bottom: NODE_HALF,
              width: TRACK_WIDTH,
              background: 'var(--border)',
              borderRadius: 1,
              zIndex: 0,
            }}
          />

          {/* 2. Active Glowing Laser Spine Track */}
          <div
            style={{
              position: 'absolute',
              left: TRACK_LEFT,
              top: NODE_HALF,
              width: TRACK_WIDTH,
              height: `calc((100% - ${NODE_SIZE}px) * ${easeProgress})`,
              background: `linear-gradient(180deg, ${accent} 0%, ${mixColor(accent, 80)} 100%)`,
              boxShadow: `0 0 10px ${mixColor(accent, 67)}, 0 0 18px ${mixColor(accent, 27)}`,
              borderRadius: 1,
              zIndex: 0,
            }}
          />

          {/* 3. Steps Loop */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap,
              width: '100%',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {steps.map((st, i) => {
              const stepThreshold = stepCount <= 1 ? 0 : i / (stepCount - 1);
              const isVisible = easeProgress >= stepThreshold * 0.85;
              const stepColor = st.color || accent;
              const isCurrentActive = isVisible && (i === activeStepIdx);

              // Spring entrance animation for each node
              const entranceFrame = frame - (delayFrames + animDur * (stepThreshold * 0.7));
              const nodeSpring = isVisible
                ? spring({
                    fps,
                    frame: entranceFrame,
                    config: { damping: 12, stiffness: 120 },
                  })
                : 0;

              // Subtle breathing pulse for currently active node
              const pulse = isCurrentActive ? 1 + Math.sin(frame * 0.18) * 0.06 : 1;
              const scaleVal = nodeSpring * pulse;

              return (
                <div
                  key={i}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                    gap: 14,
                    opacity: isVisible ? 1 : 0,
                    transform: `translateX(${isVisible ? 0 : -12}px)`,
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {/* Glowing Bead Node */}
                  <div
                    style={{
                      width: NODE_SIZE,
                      height: NODE_SIZE,
                      borderRadius: '50%',
                      background: 'var(--surface-1)',
                      border: `1.5px solid ${isVisible ? stepColor : 'var(--border)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transform: `scale(${scaleVal})`,
                      boxShadow: isVisible
                        ? `0 0 16px ${mixColor(stepColor, 40)}, 0 4px 12px rgba(0,0,0,0.6)`
                        : '0 2px 8px rgba(0,0,0,0.4)',
                      position: 'relative',
                    }}
                  >
                    {st.icon ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        {renderUniversalIcon(st.icon, stepColor, 12)}
                      </span>
                    ) : (
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: isVisible ? stepColor : 'var(--text-sub)',
                          boxShadow: isVisible ? `0 0 8px ${stepColor}` : 'none',
                        }}
                      />
                    )}
                  </div>

                  {/* Typography Content Container */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      textAlign: 'left',
                      paddingTop: 2,
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        fontSize: baseFontSize,
                        fontWeight: 700,
                        color: isVisible ? 'var(--text)' : 'var(--text-sub)',
                        fontFamily,
                        letterSpacing: '0.01em',
                        lineHeight: 1.25,
                        textAlign: 'left',
                        textShadow: '0 2px 10px rgba(0,0,0,0.85)',
                        wordBreak: 'break-word',
                      }}
                    >
                      {st.title}
                    </div>

                    {st.subtitle && (
                      <div
                        style={{
                          fontSize: Math.max(11, baseFontSize * 0.82),
                          fontWeight: 500,
                          color: 'var(--text-sub)',
                          fontFamily,
                          lineHeight: 1.35,
                          textAlign: 'left',
                          marginTop: 3,
                          textShadow: '0 2px 8px rgba(0,0,0,0.75)',
                          wordBreak: 'break-word',
                        }}
                      >
                        {st.subtitle}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </RemotionElementWrapper>
  );
};
