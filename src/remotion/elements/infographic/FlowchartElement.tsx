import React, { useMemo } from 'react';
import { spring, interpolate } from 'remotion';
import { AdvElementProps } from '../types';

// Badge geometry constants
const BADGE_SIZE = 28;
const STEP_PAD_H = 10;
// Center X of badge relative to step card left edge
const BADGE_CENTER_X = STEP_PAD_H + BADGE_SIZE / 2; // 24px

export const FlowchartElement: React.FC<AdvElementProps> = ({
  el,
  computedStyle,
  frame = 0,
  fps = 30,
  delayFrames = 0,
}) => {
  const w = el.width || 336;
  const accent = el.accentColor || 'var(--accent)';
  const radius = el.radius !== undefined ? el.radius : 14;
  const font = el.fontFamily || 'Be Vietnam Pro, sans-serif';

  const steps = useMemo(() => {
    return el.flowSteps && el.flowSteps.length > 0
      ? el.flowSteps
      : [
          { title: 'BƯỚC 1: TIẾP NHẬN', subtitle: 'Phân tích yêu cầu & dữ liệu đầu vào', color: accent },
          { title: 'BƯỚC 2: XỬ LÝ AI', subtitle: 'Truy xuất Vector DB & sinh nội dung', color: 'var(--chart-series-2)' },
          { title: 'BƯỚC 3: XUẤT KẾT QUẢ', subtitle: 'Hoàn thiện video & bàn giao', color: 'var(--chart-series-3)' },
        ];
  }, [el.flowSteps, accent]);

  const title = el.content || 'QUY TRÌNH XỬ LÝ LOGIC';

  return (
    <div
      style={{
        ...computedStyle,
        width: w,
        // ── Bỏ outer card: transparent, không border, không shadow ──
        backgroundColor: 'transparent',
        borderRadius: radius,
        padding: '10px 14px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        overflow: 'hidden',
        gap: 8,
      }}
    >
      {/* 1. Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          borderBottom: '1px solid var(--border)',
          paddingBottom: 7,
          minWidth: 0,
        }}
      >
        {/* SVG Flow icon — thay 🔄 */}
        <svg
          width="14" height="14" viewBox="0 0 16 16"
          fill="none" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0 }}
        >
          <circle cx="8" cy="2.5" r="1.8" fill={accent} />
          <circle cx="8" cy="8" r="1.8" fill={accent} />
          <circle cx="8" cy="13.5" r="1.8" fill={accent} />
          <line x1="8" y1="4.3" x2="8" y2="6.2" stroke={accent} strokeWidth="1.5" />
          <line x1="8" y1="9.8" x2="8" y2="11.7" stroke={accent} strokeWidth="1.5" />
        </svg>
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 800,
            color: 'var(--text)',
            fontFamily: font,
            letterSpacing: 0.3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flex: 1,
            minWidth: 0,
          }}
        >
          {title}
        </span>
      </div>

      {/* 2. Steps */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          width: '100%',
          gap: 0,
        }}
      >
        {steps.map((st, i) => {
          const stepSpring = spring({
            fps,
            frame: Math.max(0, frame - delayFrames - i * 4),
            config: { damping: 14, stiffness: 100 },
          });

          const stepColor = st.color || accent;
          const nextColor = steps[i + 1]?.color || accent;

          return (
            <React.Fragment key={i}>
              {/* ── Step card: gradient tint, circle badge ── */}
              <div
                style={{
                  width: '100%',
                  background: `linear-gradient(135deg, color-mix(in srgb, ${stepColor} 14%, transparent) 0%, var(--surface-1) 100%)`,
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: `8px ${STEP_PAD_H}px`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  boxSizing: 'border-box',
                  opacity: stepSpring,
                  transform: `translateY(${interpolate(stepSpring, [0, 1], [8, 0])}px)`,
                }}
              >
                {/* Circle badge */}
                <div
                  style={{
                    width: BADGE_SIZE,
                    height: BADGE_SIZE,
                    borderRadius: '50%',
                    backgroundColor: `color-mix(in srgb, ${stepColor} 18%, transparent)`,
                    border: `1.5px solid color-mix(in srgb, ${stepColor} 60%, transparent)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: `0 0 12px color-mix(in srgb, ${stepColor} 30%, transparent)`,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 900,
                      color: 'var(--text)',
                      fontFamily: font,
                      lineHeight: 1,
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>

                {/* Text */}
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--text)',
                      fontFamily: font,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {st.title}
                  </span>
                  {st.subtitle && (
                    <span
                      style={{
                        fontSize: 9.5,
                        color: 'var(--text-sub)',
                        fontFamily: font,
                        marginTop: 2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {st.subtitle}
                    </span>
                  )}
                </div>
              </div>

              {/* ── SVG connector — thay ↓ unicode ── */}
              {i < steps.length - 1 && (
                <div
                  style={{
                    paddingLeft: BADGE_CENTER_X - 5,
                    opacity: stepSpring * 0.75,
                    lineHeight: 0,
                  }}
                >
                  <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
                    {/* Dashed line */}
                    <line
                      x1="5" y1="0" x2="5" y2="9"
                      stroke={`url(#cg${i})`}
                      strokeWidth="1.5"
                      strokeDasharray="2.5 2"
                      strokeLinecap="round"
                    />
                    {/* Arrowhead */}
                    <polyline
                      points="2,9 5,13 8,9"
                      stroke={nextColor}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                    <defs>
                      <linearGradient id={`cg${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={stepColor} stopOpacity="0.8" />
                        <stop offset="100%" stopColor={nextColor} stopOpacity="0.8" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
