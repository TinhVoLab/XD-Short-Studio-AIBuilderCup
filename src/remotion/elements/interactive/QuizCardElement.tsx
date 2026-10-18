import { RemotionElementWrapper } from '../core/RemotionElementWrapper';
import React from 'react';
import { spring } from 'remotion';
import { AdvElementProps, ElementProps } from '../types';
import { mixColor } from '../../utils/rich-text-parser';
import { getContrastTextColor } from '@/config/themePalettes';

export const QuizCardElement: React.FC<AdvElementProps> = ({ el, computedStyle, positionStyle, frame, fps, delayFrames = 0 }) => {
  const quiz = el.quizData || {
    question: el.content || 'Đố bạn: Đâu là lựa chọn chính xác nhất?',
    options: [
      { id: 'A', text: 'A. Phương án 01' },
      { id: 'B', text: 'B. Phương án 02' },
      { id: 'C', text: 'C. Phương án 03' },
      { id: 'D', text: 'D. Phương án 04' },
    ],
    correctId: 'A',
    revealDelaySec: 2.0,
  };

  const revealFrame = delayFrames + (quiz.revealDelaySec || 2.0) * fps;
  const isRevealed = frame >= revealFrame;

  const revealSpr = spring({
    fps,
    frame: frame - revealFrame,
    config: { damping: 10, mass: 0.6, stiffness: 150 },
  });

  const accent = el.accentColor || el.color || 'var(--accent, #BEFF01)';
  const showBg = el.showCardBg !== false;
  // Chữ trên nền accent đặc: màu hex tuỳ chỉnh → tự chọn đen/trắng; accent theo theme → --on-accent
  const customAccent = el.accentColor || el.color;
  const onAccent = customAccent?.startsWith('#') ? getContrastTextColor(customAccent) : 'var(--on-accent, #000)';

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: el.width || 320,
          backgroundColor: showBg ? (el.bgColor || 'var(--card-bg)') : 'transparent',
          borderRadius: 18,
          padding: showBg ? '14px 14px' : '4px',
          border: showBg ? `1.5px solid color-mix(in srgb, ${accent} 35%, transparent)` : 'none',
          boxShadow: showBg ? `var(--shadow-lg, 0 12px 36px rgba(0,0,0,0.6))` : 'none',
          boxSizing: 'border-box',
          gap: 10,
        }}
      >
      {/* Quiz Tag & Timer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 900, color: onAccent, backgroundColor: accent, padding: '2px 7px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4, boxShadow: `0 0 10px ${mixColor(accent, 40)}` }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span>CÂU HỎI</span>
          </span>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-sub)' }}>
            Chọn đáp án đúng
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {isRevealed ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--chart-positive, #00FF88)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-sub)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          )}
        </div>
      </div>

      {/* Question Text */}
      <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text)', fontFamily: el.fontFamily || 'var(--font-sans, inherit)', lineHeight: 1.35 }}>
        {quiz.question}
      </div>

      {/* Options Grid / List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 2 }}>
        {quiz.options.map((opt: any, idx: number) => {
          const isCorrect = opt.id === quiz.correctId;
          const optDelay = delayFrames + idx * 4;
          const optSpr = spring({
            fps,
            frame: frame - optDelay,
            config: { damping: 12, mass: 0.5 },
          });

          const activeBorder = isRevealed && isCorrect
            ? '2px solid var(--chart-positive, #00FF88)'
            : '1px solid var(--border)';

          const activeBg = isRevealed && isCorrect
            ? 'color-mix(in srgb, var(--chart-positive, #00FF88) 15%, transparent)'
            : isRevealed ? 'transparent' : 'var(--surface-1)';

          // Phương án sai: làm mờ bằng màu chữ phụ thay vì opacity cả khối (giữ chữ đủ tương phản)
          const isDimmed = isRevealed && !isCorrect;
          const activeOpacity = optSpr;
          const activeScale = isRevealed && isCorrect ? 1 + 0.04 * revealSpr : 1;

          return (
            <div
              key={opt.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                borderRadius: 10,
                backgroundColor: activeBg,
                border: activeBorder,
                boxShadow: isRevealed && isCorrect ? '0 0 20px color-mix(in srgb, var(--chart-positive, #00FF88) 35%, transparent)' : 'none',
                transform: `scale(${activeScale}) translateX(${(1 - optSpr) * -20}px)`,
                opacity: activeOpacity,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 700, fontFamily: el.fontFamily || 'var(--font-sans, inherit)', color: isDimmed ? 'var(--text-sub)' : 'var(--text, #FFF)' }}>
                {opt.text}
              </span>
              {isRevealed && isCorrect && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--chart-positive, #00FF88)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: `scale(${revealSpr})`, flexShrink: 0 }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
          );
        })}
      </div>
      </div>
    </RemotionElementWrapper>
  );
};
