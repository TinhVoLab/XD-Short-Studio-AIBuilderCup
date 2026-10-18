import React from 'react';
import { ElementProps } from '../types';

export const PushNotificationElement: React.FC<
  ElementProps & {
    frame: number;
    fps?: number;
    delayFrames?: number;
    durFrames?: number;
  }
> = ({
  el,
  computedStyle,
}) => {
  const w = el.width || 320;
  const h = el.height || 85;
  const accent = el.accentColor || el.notificationData?.accentColor || 'var(--accent, #00D46A)';
  const data = el.notificationData || {
    appName: el.subtitle || 'THÔNG BÁO',
    title: el.content || 'Bạn có 1 tin nhắn mới!',
    message: 'Chạm vào để xem chi tiết ngay bây giờ.',
    timeText: 'bây giờ',
  };

  return (
    <div
      style={{
        ...computedStyle,
        width: w,
        minHeight: h,
        display: 'flex',
        flexDirection: 'column',
        // position do computedStyle quyết định (absolute) — xem tests/unit/elementPositioning.test.ts
        boxSizing: 'border-box',
      }}
    >
      {/* iOS Style Glass Notification Card */}
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'var(--surface-1, rgba(25, 25, 35, 0.96))',
          borderRadius: 18,
          border: '1px solid var(--border, rgba(255, 255, 255, 0.18))',
          boxShadow: 'var(--shadow-lg, 0 12px 36px rgba(0, 0, 0, 0.4))',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 6,
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {/* Top Header: App Icon, App Name, Time, Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 11,
            color: 'var(--text-sub, rgba(255, 255, 255, 0.65))',
            fontWeight: 600,
            letterSpacing: 0.3,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* App Icon Circle / Square */}
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: 5,
                background: `color-mix(in srgb, ${accent} 20%, transparent)`,
                border: `1px solid color-mix(in srgb, ${accent} 40%, transparent)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: accent,
              }}
            >
              {data.appIcon && data.appIcon !== '🔔' ? (
                <span style={{ fontSize: 11 }}>{data.appIcon}</span>
              ) : (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
              )}
            </div>
            <span style={{ textTransform: 'uppercase', color: 'var(--text, #FFFFFF)', fontWeight: 800, fontSize: 10 }}>
              {data.appName || 'THÔNG BÁO'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {data.badge && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  padding: '1px 5px',
                  borderRadius: 4,
                  background: `color-mix(in srgb, ${accent} 20%, transparent)`,
                  // Chữ nhỏ trên chip nhuộm accent: pha màu chữ theme để luôn đủ tương phản (sáng lẫn tối)
                  color: `color-mix(in srgb, ${accent} 70%, var(--text))`,
                  border: `1px solid color-mix(in srgb, ${accent} 40%, transparent)`,
                }}
              >
                {data.badge}
              </span>
            )}
            <span style={{ fontSize: 10, color: 'var(--text-sub, rgba(255, 255, 255, 0.65))' }}>
              {data.timeText || 'bây giờ'}
            </span>
          </div>
        </div>

        {/* Middle: Title */}
        <div
          style={{
            fontSize: el.fontSize || 14,
            fontWeight: 800,
            fontFamily: el.fontFamily || 'Be Vietnam Pro',
            color: 'var(--text, #FFFFFF)',
            lineHeight: 1.25,
          }}
        >
          {data.title}
        </div>

        {/* Bottom: Message body */}
        <div
          style={{
            fontSize: 11.5,
            fontWeight: 500,
            fontFamily: el.fontFamily || 'Be Vietnam Pro',
            color: 'var(--text-sub, rgba(255, 255, 255, 0.82))',
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {data.message}
        </div>
      </div>
    </div>
  );
};
