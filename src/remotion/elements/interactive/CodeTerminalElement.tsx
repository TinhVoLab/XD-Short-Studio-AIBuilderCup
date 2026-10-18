import { RemotionElementWrapper } from '../core/RemotionElementWrapper';
import React from 'react';
import { interpolate } from 'remotion';
import { AdvElementProps, ElementProps } from '../types';
import { DEFAULT_TERMINAL_CODE } from '@/config/widgetDefaults';

export const CodeTerminalElement: React.FC<AdvElementProps> = ({ el, computedStyle, positionStyle, frame, fps, delayFrames = 0 }) => {
  const codeData = el.codeData || {
    filename: 'main.ts',
    language: 'TypeScript',
    code: el.content || DEFAULT_TERMINAL_CODE,
  };

  const rawCode = codeData.code || '';
  const totalChars = rawCode.length;
  const typeDurFrames = Math.min(60, Math.max(20, totalChars * 0.8));

  // Typewriter progress
  const typeProgress = interpolate(frame, [delayFrames, delayFrames + typeDurFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const visibleChars = Math.floor(typeProgress * totalChars);
  const currentCode = rawCode.slice(0, visibleChars);
  const isTypingDone = visibleChars >= totalChars;
  const showCursor = !isTypingDone && Math.floor(frame / 6) % 2 === 0;

  const accent = el.accentColor || el.color || 'var(--accent, #00D4FF)';
  const showBg = el.showCardBg !== false;

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: el.width || 320,
          height: el.height || 'auto',
          backgroundColor: showBg ? (el.bgColor || 'var(--card-bg, #0D1117)') : 'transparent',
          borderRadius: 14,
          border: showBg ? `1px solid color-mix(in srgb, ${accent} 30%, transparent)` : 'none',
          boxShadow: showBg ? `var(--shadow-lg, 0 16px 40px rgba(0,0,0,0.4)), 0 0 25px color-mix(in srgb, ${accent} 20%, transparent)` : 'none',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {/* macOS Window Titlebar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            backgroundColor: showBg ? 'var(--surface-1)' : 'transparent',
            borderBottom: '1px solid var(--border)',
          }}
        >
          {/* 3 Traffic Light Dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: '#FF5F56' }} />
            <div style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: '#FFBD2E' }} />
            <div style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: '#27C93F' }} />
          </div>

          {/* Filename */}
          <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-sub)', fontFamily: 'Fira Code, monospace' }}>
            {codeData.filename || 'script.ts'}
          </span>

          {/* Language Badge — chữ 8.5px trên nền nhuộm accent: pha màu chữ theme để đủ tương phản */}
          <span style={{ fontSize: 8.5, fontWeight: 800, color: `color-mix(in srgb, ${accent} 70%, var(--text))`, backgroundColor: `color-mix(in srgb, ${accent} 15%, transparent)`, border: `1px solid color-mix(in srgb, ${accent} 30%, transparent)`, padding: '2px 6px', borderRadius: 4, fontFamily: el.fontFamily || 'var(--font-sans, inherit)' }}>
            {codeData.language || 'CODE'}
          </span>
        </div>

        {/* Code Body */}
        <div style={{ padding: '12px 14px', minHeight: 100, position: 'relative' }}>
          <pre
            style={{
              margin: 0,
              fontFamily: 'Fira Code, SF Mono, Menlo, monospace',
              fontSize: 11,
              lineHeight: 1.5,
              color: 'var(--text)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            <code>
              {currentCode}
              {showCursor && (
                <span style={{ backgroundColor: accent, display: 'inline-block', width: 6, height: 14, verticalAlign: 'middle', marginLeft: 2, boxShadow: `0 0 8px ${accent}` }} />
              )}
            </code>
          </pre>
        </div>
      </div>
    </RemotionElementWrapper>
  );
};
