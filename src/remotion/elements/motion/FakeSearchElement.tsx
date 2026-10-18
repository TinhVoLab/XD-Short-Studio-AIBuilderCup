import React from 'react';
import { ElementProps } from '../types';

export const FakeSearchElement: React.FC<
  ElementProps & {
    frame: number;
    fps?: number;
    delayFrames?: number;
    durFrames?: number;
  }
> = ({
  el,
  computedStyle,
  frame,
  fps = 30,
  delayFrames = 0,
}) => {
  const w = el.width || 320;
  const h = el.height || 54;
  const accent = el.accentColor || el.searchData?.accentColor || 'var(--accent, #00D4FF)';
  const data = el.searchData || {
    keyword: el.content || 'Cách làm video triệu view...',
    placeholder: 'Tìm kiếm trên mạng...',
    engine: 'glass',
    typingSpeed: 2,
  };

  const keyword = (data.keyword || el.content || 'Tìm kiếm...').trim();
  const speed = Math.max(1, data.typingSpeed || 2);
  
  // Natural start pause (wait 4 frames so user sees empty search bar with cursor)
  const startPauseFrames = 4;
  const localFrame = Math.max(0, frame - delayFrames - startPauseFrames);

  // Typewriter calculation
  const charsToShow = Math.min(keyword.length, Math.floor(localFrame / speed));
  const displayedText = keyword.slice(0, charsToShow);
  const isTypingDone = charsToShow >= keyword.length;

  // Blinking cursor
  const showCursor = Math.floor(frame / 7) % 2 === 0;

  // Dynamic font size adaptation so long text never gets crushed
  const baseFontSize = el.fontSize || 13.5;
  const dynamicFontSize = keyword.length > 26
    ? Math.max(10.5, baseFontSize - (keyword.length - 26) * 0.12)
    : baseFontSize;

  return (
    <div
      style={{
        ...computedStyle,
        width: w,
        minHeight: h,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        // position do computedStyle quyết định (absolute) — xem tests/unit/elementPositioning.test.ts
        boxSizing: 'border-box',
      }}
    >
      {/* Search Bar Container with Glassmorphism */}
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          background: 'var(--surface-1, rgba(15, 23, 42, 0.96))',
          border: `1.5px solid ${isTypingDone ? accent : 'var(--border, rgba(255, 255, 255, 0.22))'}`,
          borderRadius: 28,
          padding: '0 14px',
          boxShadow: isTypingDone
            ? `var(--shadow-md, 0 8px 32px rgba(0, 0, 0, 0.45)), 0 0 16px color-mix(in srgb, ${accent} 25%, transparent)`
            : 'var(--shadow-md, 0 8px 24px rgba(0, 0, 0, 0.35))',
          boxSizing: 'border-box',
        }}
      >
        {/* Leading Search Icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 8,
            flexShrink: 0,
            color: accent,
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>

        {/* Input Text Content Area */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            fontSize: dynamicFontSize,
            fontWeight: 700,
            fontFamily: el.fontFamily || 'Be Vietnam Pro',
            color: 'var(--text, #FFFFFF)',
            lineHeight: 1,
          }}
        >
          <span style={{ whiteSpace: 'pre' }}>
            {displayedText.length === 0 ? (
              <span style={{ color: 'var(--text-muted, rgba(255, 255, 255, 0.35))', fontWeight: 500 }}>
                {data.placeholder || 'Tìm kiếm...'}
              </span>
            ) : (
              displayedText
            )}
          </span>
          <span
            style={{
              display: 'inline-block',
              width: 2,
              height: dynamicFontSize + 2,
              backgroundColor: showCursor ? accent : 'transparent',
              marginLeft: 2,
              borderRadius: 1,
              flexShrink: 0,
              boxShadow: showCursor ? `0 0 6px ${accent}` : 'none',
            }}
          />
        </div>

        {/* Trailing Action Icons (Mic / Search Button) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 6, flexShrink: 0 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: isTypingDone ? accent : 'var(--surface-2, rgba(255, 255, 255, 0.1))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isTypingDone ? 'var(--on-accent, #000000)' : 'var(--text, #FFFFFF)',
              fontSize: 11,
              fontWeight: 900,
              transform: isTypingDone ? 'scale(1.06)' : 'scale(1)',
              boxShadow: isTypingDone ? `0 0 10px color-mix(in srgb, ${accent} 40%, transparent)` : 'none',
            }}
          >
            {isTypingDone ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 10 4 15 9 20"></polyline>
                <path d="M20 4v7a4 4 0 0 1-4 4H4"></path>
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Optional Auto-search Tag Badge */}
      {data.autoSearchBadge && (
        <div
          style={{
            marginTop: 6,
            fontSize: 9.5,
            fontWeight: 800,
            color: accent,
            letterSpacing: 0.6,
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span>✦ {data.autoSearchBadge}</span>
        </div>
      )}
    </div>
  );
};
