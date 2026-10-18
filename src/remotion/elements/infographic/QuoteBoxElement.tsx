import React from 'react';
import { spring } from 'remotion';
import { AdvElementProps } from '../types';
import { RemotionElementWrapper } from '../core/RemotionElementWrapper';
import { mixColor } from '../../utils/rich-text-parser';

export const QuoteBoxElement: React.FC<AdvElementProps> = ({
  el,
  computedStyle,
  positionStyle,
  content,
  frame = 0,
  fps = 30,
  delayFrames = 0,
}) => {
  const rawText = String(content || el.content || 'Trích dẫn hay...').trim();
  const w = el.width || 312;
  const color = el.accentColor || el.color || '#FFD700';
  const fontSize = el.fontSize || 16;
  const variant = el.variant || 'classic-strip';
  const textAlign = (el.textAlign || (variant === 'zen-minimal' ? 'center' : 'left')) as 'left' | 'center' | 'right';
  const showWatermark = el.showWatermark !== false;
  const radius = el.radius ?? (variant === 'brutalist-block' ? 4 : (variant === 'zen-minimal' ? 20 : 16));

  // Spring animation mượt mà
  const spr = spring({
    fps: fps || 30,
    frame: frame - (delayFrames || 0),
    config: { damping: 14, mass: 0.7, stiffness: 120 },
  });
  const clampedEnter = Math.min(1, Math.max(0, spr));

  // ─────────────────────────────────────────────────────────────
  // VARIANT 1: zen-minimal (Tĩnh Tâm & Chữa Lành)
  // ─────────────────────────────────────────────────────────────
  if (variant === 'zen-minimal') {
    return (
      <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
        <div
          style={{
            width: w,
            boxSizing: 'border-box',
            position: 'relative',
            padding: '24px 22px',
            background: el.bgColor || `radial-gradient(ellipse at center, ${mixColor(color, 8)} 0%, var(--card-bg) 100%)`,
            border: `1px solid ${mixColor(color, 25)}`,
            borderRadius: radius,
            boxShadow: `var(--shadow-md, 0 8px 30px rgba(0, 0, 0, 0.5)), 0 0 25px ${mixColor(color, 7)}`,
            overflow: 'hidden',
            opacity: clampedEnter,
            transform: `scale(${0.95 + clampedEnter * 0.05})`,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 12,
          }}
        >
          {/* Biểu tượng mở ngoặc kép thanh tịnh */}
          <div style={{ fontSize: 26, color, lineHeight: 1, opacity: 0.85, userSelect: 'none' }}>❝</div>

          {/* Nội dung trích dẫn */}
          <span
            style={{
              fontSize,
              color: el.color || 'var(--text)',
              fontFamily: el.fontFamily || 'var(--font-sans, "Be Vietnam Pro", sans-serif)',
              fontStyle: 'italic',
              lineHeight: 1.6,
              fontWeight: 500,
              letterSpacing: '0.02em',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {rawText}
          </span>

          {/* Khối tác giả đối xứng hai bên */}
          {el.authorName && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 4 }}>
              <div style={{ width: 20, height: 1, backgroundColor: color, opacity: 0.6 }} />
              <span
                style={{
                  fontSize: Math.max(11, Math.round(fontSize * 0.78)),
                  color: `${mixColor(color, 87)}`,
                  fontFamily: el.fontFamily || 'var(--font-sans, "Be Vietnam Pro", sans-serif)',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                {el.authorName}
              </span>
              <div style={{ width: 20, height: 1, backgroundColor: color, opacity: 0.6 }} />
            </div>
          )}
        </div>
      </RemotionElementWrapper>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // VARIANT 2: expert-badge (Góc Nhìn Chuyên Gia / Thực Chiến)
  // ─────────────────────────────────────────────────────────────
  if (variant === 'expert-badge') {
    return (
      <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
        <div
          style={{
            width: w,
            boxSizing: 'border-box',
            position: 'relative',
            padding: '20px',
            backgroundColor: el.bgColor || 'var(--card-bg)',
            border: `1.5px solid ${mixColor(color, 27)}`,
            borderRadius: radius,
            boxShadow: `var(--shadow-md, 0 8px 32px rgba(0, 0, 0, 0.55)), 0 0 16px ${mixColor(color, 8)}`,
            overflow: 'hidden',
            opacity: clampedEnter,
            transform: `translateY(${(1 - clampedEnter) * 12}px)`,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            textAlign,
          }}
        >
          {/* Header Tag Chuyên Gia */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${mixColor(color, 13)}`, paddingBottom: 10 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 10px',
                background: `${mixColor(color, 9)}`,
                border: `1px solid ${mixColor(color, 38)}`,
                borderRadius: 999,
                fontSize: 10.5,
                fontWeight: 700,
                color,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
              </svg>
              <span>{el.authorName ? el.authorName.toUpperCase() : 'GÓC NHÌN CHUYÊN GIA'}</span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-sub)', fontFamily: 'monospace' }}>INSIGHT</span>
          </div>

          {/* Nội dung trích dẫn */}
          <span
            style={{
              fontSize,
              color: el.color || 'var(--text)',
              fontFamily: el.fontFamily || 'var(--font-sans, "Be Vietnam Pro", sans-serif)',
              fontStyle: 'normal',
              lineHeight: 1.5,
              fontWeight: 600,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {rawText}
          </span>
        </div>
      </RemotionElementWrapper>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // VARIANT 3: brutalist-block (Động Lực Bứt Phá / Hormozi)
  // ─────────────────────────────────────────────────────────────
  if (variant === 'brutalist-block') {
    return (
      <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
        <div
          style={{
            width: w,
            boxSizing: 'border-box',
            position: 'relative',
            padding: '20px 18px',
            backgroundColor: el.bgColor || 'var(--card-bg)',
            border: `2.5px solid ${color}`,
            borderRadius: radius,
            boxShadow: `5px 5px 0px ${color}`,
            opacity: clampedEnter,
            transform: `translateY(${(1 - clampedEnter) * 8}px) scale(${0.96 + clampedEnter * 0.04})`,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            textAlign,
          }}
        >
          {/* Brutalist Tag */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                background: color,
                color: '#000',
                padding: '2px 8px',
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: '0.06em',
                borderRadius: 2,
              }}
            >
              RULE #1
            </span>
            {el.authorName && (
              <span style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: '0.04em' }}>
                // {el.authorName.toUpperCase()}
              </span>
            )}
          </div>

          {/* Nội dung chữ đanh thép */}
          <span
            style={{
              fontSize,
              color: el.color || 'var(--text)',
              fontFamily: el.fontFamily || 'var(--font-sans, "Be Vietnam Pro", sans-serif)',
              fontStyle: 'normal',
              lineHeight: 1.4,
              fontWeight: 800,
              textTransform: 'uppercase',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {rawText}
          </span>
        </div>
      </RemotionElementWrapper>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // VARIANT 4: classic-strip (Triết Lý Sâu Sắc - Mặc định)
  // ─────────────────────────────────────────────────────────────
  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      <div
        style={{
          width: w,
          boxSizing: 'border-box',
          position: 'relative',
          padding: '24px 20px',
          backgroundColor: el.bgColor || 'var(--card-bg)',
          borderLeft: `4px solid ${color}`,
          borderRadius: `0 ${radius}px ${radius}px 0`,
          boxShadow: `var(--shadow-md, 0 8px 32px rgba(0, 0, 0, 0.45)), 0 0 16px ${mixColor(color, 9)}`,
          overflow: 'hidden',
          opacity: clampedEnter,
          transform: `translateY(${(1 - clampedEnter) * 10}px) scale(${0.97 + clampedEnter * 0.03})`,
          pointerEvents: 'none',
        }}
      >
        {/* Dấu ngoặc kép chìm nghệ thuật */}
        {showWatermark && (
          <div
            style={{
              position: 'absolute',
              top: -14,
              left: 8,
              fontSize: 110,
              fontFamily: 'Georgia, serif',
              color: color,
              opacity: 0.12,
              lineHeight: 1,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            "
          </div>
        )}

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            textAlign,
          }}
        >
          {/* Nội dung trích dẫn */}
          <span
            style={{
              fontSize,
              color: el.color || 'var(--text)',
              fontFamily: el.fontFamily || 'var(--font-sans, "Be Vietnam Pro", sans-serif)',
              fontStyle: 'italic',
              lineHeight: 1.55,
              fontWeight: 600,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {rawText}
          </span>

          {/* Khối tác giả */}
          {el.authorName && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent:
                  textAlign === 'center'
                    ? 'center'
                    : textAlign === 'right'
                    ? 'flex-end'
                    : 'flex-start',
                gap: 8,
                marginTop: 2,
              }}
            >
              <div style={{ width: 22, height: 1.5, backgroundColor: color, opacity: 0.85 }} />
              <span
                style={{
                  fontSize: Math.max(11, Math.round(fontSize * 0.78)),
                  color: 'var(--text-sub)',
                  fontFamily: el.fontFamily || 'var(--font-sans, "Be Vietnam Pro", sans-serif)',
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                }}
              >
                {el.authorName}
              </span>
            </div>
          )}
        </div>
      </div>
    </RemotionElementWrapper>
  );
};
