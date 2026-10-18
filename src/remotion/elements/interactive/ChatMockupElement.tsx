import { RemotionElementWrapper } from '../core/RemotionElementWrapper';
import React from 'react';
import { spring } from 'remotion';
import { AdvElementProps, ElementProps } from '../types';
import { mixColor } from '../../utils/rich-text-parser';
import { getContrastTextColor } from '@/config/themePalettes';

export const ChatMockupElement: React.FC<AdvElementProps> = ({ el, computedStyle, positionStyle, frame, fps, delayFrames = 0 }) => {
  const accent = el.accentColor || el.color || 'var(--accent, #BEFF01)';
  // Chữ trên bong bóng accent: màu hex tuỳ chỉnh → tự chọn đen/trắng theo tương phản; accent theo theme → --on-accent
  const rightTextColor = accent.startsWith('#') ? getContrastTextColor(accent) : 'var(--on-accent, #000000)';
  const showBg = el.showCardBg !== false;

  const messages = el.chatMessages && el.chatMessages.length > 0 ? el.chatMessages : [
    { sender: 'left', text: 'Này, có tool AI nào làm video tự động nhanh không?', name: 'Alex' },
    { sender: 'right', text: 'Có chứ! Dùng thử Motion Studio đi, tạo video chỉ mất 10s.', name: 'Bạn' },
    { sender: 'left', text: 'Thật á? Có animation và auto caption luôn à?', name: 'Alex' },
    { sender: 'right', text: 'Đầy đủ hết, tự xếp layout chuẩn luôn!', name: 'Bạn' },
  ];

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: el.width || 320,
          backgroundColor: showBg ? (el.bgColor || 'var(--card-bg)') : 'transparent',
          borderRadius: el.radius !== undefined ? el.radius : 20,
          padding: showBg ? '12px 14px' : '4px',
          border: showBg ? `1px solid color-mix(in srgb, ${accent} 25%, transparent)` : 'none',
          boxShadow: showBg ? `var(--shadow-lg, 0 12px 40px rgba(0,0,0,0.6))` : 'none',
          boxSizing: 'border-box',
          gap: 10,
          position: 'relative',
        }}
      >
        {/* Header bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border)', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--chart-positive, #00FF88)', boxShadow: '0 0 8px var(--chart-positive, #00FF88)' }} />
            <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--text)', fontFamily: el.fontFamily || 'var(--font-sans, inherit)' }}>
              {el.content || 'Đoạn Hội Thoại'}
            </span>
          </div>
          <span style={{ fontSize: 9, color: 'var(--text-sub)' }}>Đang hoạt động</span>
        </div>

      {/* Messages Stream */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, zIndex: 1 }}>
        {messages.map((msg: any, idx: number) => {
          const isRight = msg.sender === 'right' || msg.sender === 'me';
          const msgDelay = delayFrames + idx * 7;
          const msgSpr = spring({
            fps,
            frame: frame - msgDelay,
            config: { damping: 12, mass: 0.5, stiffness: 140 },
          });

          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: isRight ? 'flex-end' : 'flex-start',
                alignItems: 'flex-end',
                gap: 6,
                transform: `scale(${0.6 + 0.4 * msgSpr}) translateY(${(1 - msgSpr) * 15}px)`,
                opacity: msgSpr,
              }}
            >
              {/* Left Avatar */}
              {!isRight && (
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    backgroundColor: 'var(--surface-2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 800,
                    color: 'var(--text)',
                    flexShrink: 0,
                  }}
                >
                  {msg.name ? msg.name.charAt(0) : 'A'}
                </div>
              )}

              {/* Message Bubble */}
              <div
                style={{
                  maxWidth: '78%',
                  padding: '7px 11px',
                  borderRadius: isRight ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  background: isRight
                    ? accent
                    : 'var(--surface-1)',
                  color: isRight ? rightTextColor : 'var(--text)',
                  fontSize: 11.5,
                  fontWeight: isRight ? 800 : 600,
                  fontFamily: el.fontFamily || 'var(--font-sans, inherit)',
                  lineHeight: 1.35,
                  border: isRight ? 'none' : '1px solid var(--border)',
                  boxShadow: isRight ? `0 4px 16px color-mix(in srgb, ${accent} 30%, transparent)` : 'none',
                }}
              >
                {msg.text}
              </div>

              {/* Right Avatar */}
              {isRight && (
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    backgroundColor: accent,
                    boxShadow: `0 0 8px ${mixColor(accent, 40)}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 900,
                    color: rightTextColor,
                    flexShrink: 0,
                  }}
                >
                  {msg.name ? msg.name.charAt(0) : 'U'}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
    </RemotionElementWrapper>
  );
};
