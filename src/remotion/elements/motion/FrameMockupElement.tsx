import React from 'react';
import { ElementProps } from '../types';
import { FRAME_PRESETS } from '@/config/frameCatalog';
import { FrameMockupData } from '@/types/scene';
import { RemotionElementWrapper } from '../core/RemotionElementWrapper';
import { mixColor } from '../../utils/rich-text-parser';

export const FrameMockupElement: React.FC<ElementProps & { frame?: number }> = ({ el, computedStyle, positionStyle }) => {
  const w = el.width || 330;
  const h = el.height || 220;
  const d: Partial<FrameMockupData> = el.frameData || {};
  const presetId = d.framePreset || 'browser-macos';
  const presetConfig = FRAME_PRESETS.find(p => p.id === presetId) || FRAME_PRESETS[0];

  const theme = d.theme || presetConfig.theme || 'dark';
  const accentColor = d.accentColor || el.accentColor || 'var(--accent, #00D4FF)';
  const borderWidth = d.borderWidth ?? presetConfig.defaultBorderWidth ?? 3;
  const urlText = d.urlText || presetConfig.defaultUrl || 'motionstudio.ai';

  const isDark = theme === 'dark';
  const isLight = theme === 'light';
  const isGlass = theme === 'glass';

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      <div
        style={{
          width: w,
          height: h,
          position: 'relative',
          boxSizing: 'border-box',
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
      {/* ── 1. PRESET: macOS Browser Window ── */}
      {presetId === 'browser-macos' && (
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 14,
            border: `${borderWidth}px solid ${isGlass ? accentColor : (isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.18)')}`,
            boxShadow: isGlass
              ? `var(--shadow-lg, 0 16px 36px rgba(0,0,0,0.5)), 0 0 24px ${mixColor(accentColor, 25)}`
              : (isLight ? '0 16px 36px rgba(0,0,0,0.15)' : 'var(--shadow-lg, 0 16px 36px rgba(0,0,0,0.6))'),
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: 'transparent',
          }}
        >
          {/* Header Bar */}
          <div
            style={{
              height: 32,
              width: '100%',
              backgroundColor: isGlass
                ? 'rgba(255, 255, 255, 0.25)'
                : (isLight ? 'rgba(240, 240, 243, 0.98)' : 'rgba(24, 24, 27, 0.98)'),
              borderBottom: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 10px',
              gap: 8,
              flexShrink: 0,
            }}
          >
            {/* Traffic Lights */}
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: '#FF5F56', boxShadow: '0 0 4px #FF5F5680' }} />
              <div style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: '#FFBD2E', boxShadow: '0 0 4px #FFBD2E80' }} />
              <div style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: '#27C93F', boxShadow: '0 0 4px #27C93F80' }} />
            </div>

            {/* URL Search Pill */}
            <div
              style={{
                flex: 1,
                maxWidth: '65%',
                margin: '0 auto',
                height: 20,
                backgroundColor: isGlass
                  ? 'rgba(255,255,255,0.18)'
                  : (isLight ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.45)'),
                borderRadius: 6,
                border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)',
                boxShadow: isLight ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                padding: '0 8px',
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: isLight ? 0.8 : 0.6, flexShrink: 0 }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  color: isLight ? '#27272A' : (isGlass ? '#FFFFFF' : '#A1A1AA'),
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {urlText}
              </span>
            </div>
          </div>

          {/* Hollow Video Viewport */}
          <div style={{ flex: 1, background: 'transparent' }} />
        </div>
      )}

      {/* ── 2. PRESET: Google Chrome Window ── */}
      {presetId === 'browser-chrome' && (
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 10,
            border: `${borderWidth}px solid ${isGlass ? accentColor : (isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.12)')}`,
            boxShadow: isGlass ? `var(--shadow-lg, 0 14px 30px rgba(0,0,0,0.5)), 0 0 20px ${mixColor(accentColor, 21)}` : `var(--shadow-lg, 0 14px 30px rgba(0,0,0,0.5))`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: 'transparent',
          }}
        >
          {/* Chrome Tab & Toolbar */}
          <div
            style={{
              height: 36,
              width: '100%',
              backgroundColor: isGlass
                ? 'rgba(255, 255, 255, 0.25)'
                : (isLight ? '#DEE1E6' : '#1E1F22'),
              display: 'flex',
              alignItems: 'center',
              padding: '0 8px',
              gap: 8,
              borderBottom: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)',
              flexShrink: 0,
            }}
          >
            {/* Active Tab */}
            <div
              style={{
                height: 26,
                padding: '0 12px',
                backgroundColor: isGlass
                  ? 'rgba(255,255,255,0.25)'
                  : (isLight ? '#FFFFFF' : '#2B2D30'),
                borderTopLeftRadius: 6,
                borderTopRightRadius: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 10,
                color: isLight ? '#1E293B' : '#E2E8F0',
                fontWeight: 600,
                boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {urlText}
              </span>
            </div>

            {/* URL input bar */}
            <div
              style={{
                flex: 1,
                height: 22,
                backgroundColor: isGlass
                  ? 'rgba(0,0,0,0.2)'
                  : (isLight ? '#F1F3F4' : '#141416'),
                borderRadius: 11,
                border: isLight ? '1px solid rgba(0,0,0,0.06)' : 'none',
                display: 'flex',
                alignItems: 'center',
                padding: '0 10px',
                fontSize: 10,
                color: isLight ? '#475569' : '#94A3B8',
                gap: 5,
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{urlText}</span>
            </div>
          </div>

          <div style={{ flex: 1, background: 'transparent' }} />
        </div>
      )}

      {/* ── 3. PRESET: iPhone 15 Pro (Dynamic Island) ── */}
      {presetId === 'iphone-dynamic-island' && (
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 36,
            border: `${borderWidth + 3}px solid ${isGlass ? accentColor : (isLight ? '#D4D4D8' : '#1C1917')}`,
            boxShadow: isGlass
              ? `var(--shadow-lg, 0 20px 45px rgba(0,0,0,0.7)), 0 0 30px ${mixColor(accentColor, 25)}`
              : (isLight ? '0 20px 45px rgba(0,0,0,0.2), inset 0 0 0 1.5px rgba(0,0,0,0.1)' : 'var(--shadow-lg, 0 20px 45px rgba(0,0,0,0.7)), inset 0 0 0 1.5px rgba(255,255,255,0.15)'),
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden',
            background: 'transparent',
          }}
        >
          {/* Dynamic Island Notch */}
          <div
            style={{
              position: 'absolute',
              top: 10,
              left: '50%',
              transform: 'translateX(-50%)',
              width: Math.min(w * 0.38, 85),
              height: 20,
              backgroundColor: '#000000',
              borderRadius: 12,
              zIndex: 10,
              boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 6px',
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#1E293B' }} />
            <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#0284C7', opacity: 0.7 }} />
          </div>

          {/* Bottom Home Indicator */}
          <div
            style={{
              position: 'absolute',
              bottom: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              width: Math.min(w * 0.4, 90),
              height: 4,
              backgroundColor: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)',
              borderRadius: 2,
              zIndex: 10,
            }}
          />

          <div style={{ flex: 1, background: 'transparent' }} />
        </div>
      )}

      {/* ── 4. PRESET: Minimal Glassmorphism Frame ── */}
      {presetId === 'glass-minimal' && (
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 16,
            border: `${borderWidth}px solid ${accentColor}`,
            boxShadow: isLight
              ? `0 10px 25px rgba(0,0,0,0.1), 0 0 20px ${mixColor(accentColor, 31)}`
              : `0 0 24px ${mixColor(accentColor, 25)}, inset 0 0 14px ${mixColor(accentColor, 13)}`,
            position: 'relative',
            background: 'transparent',
          }}
        >
          {/* 4 Tech Corner Brackets */}
          <div style={{ position: 'absolute', top: -2, left: -2, width: 12, height: 12, borderTop: `3px solid ${isLight ? '#1E293B' : '#FFF'}`, borderLeft: `3px solid ${isLight ? '#1E293B' : '#FFF'}`, borderTopLeftRadius: 4 }} />
          <div style={{ position: 'absolute', top: -2, right: -2, width: 12, height: 12, borderTop: `3px solid ${isLight ? '#1E293B' : '#FFF'}`, borderRight: `3px solid ${isLight ? '#1E293B' : '#FFF'}`, borderTopRightRadius: 4 }} />
          <div style={{ position: 'absolute', bottom: -2, left: -2, width: 12, height: 12, borderBottom: `3px solid ${isLight ? '#1E293B' : '#FFF'}`, borderLeft: `3px solid ${isLight ? '#1E293B' : '#FFF'}`, borderBottomLeftRadius: 4 }} />
          <div style={{ position: 'absolute', bottom: -2, right: -2, width: 12, height: 12, borderBottom: `3px solid ${isLight ? '#1E293B' : '#FFF'}`, borderRight: `3px solid ${isLight ? '#1E293B' : '#FFF'}`, borderBottomRightRadius: 4 }} />
        </div>
      )}
      </div>
    </RemotionElementWrapper>
  );
};
