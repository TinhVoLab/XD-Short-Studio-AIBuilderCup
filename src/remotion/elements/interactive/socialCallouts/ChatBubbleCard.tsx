import React from 'react'
import { interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion'
import { SocialCalloutData } from '@/types/scene'
import { getContrastTextColor } from '@/config/themePalettes'

interface Props {
  data: SocialCalloutData;
  accent: string;
}

export const ChatBubbleCard: React.FC<Props> = ({ data, accent }) => {
  const frame = useCurrentFrame()
  const isTypingDone = frame > 12

  const safeAccent = accent || 'var(--accent, #BEFF01)'
  // Nền + chữ bong bóng: hex tuỳ chỉnh → chữ đen/trắng theo tương phản; --accent → --on-accent;
  // token khác (vd --chart-positive, không có cặp chữ đảm bảo) → chip trung tính nhuộm màu + chữ --text
  const isHexAccent = String(safeAccent).startsWith('#')
  const isThemeAccent = String(safeAccent).startsWith('var(--accent')
  const bubbleTextColor = isHexAccent ? getContrastTextColor(safeAccent) : isThemeAccent ? 'var(--on-accent, #000000)' : 'var(--text)'
  const bubbleBg = isHexAccent || isThemeAccent ? safeAccent : `color-mix(in srgb, ${safeAccent} 22%, var(--surface-1))`

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        boxSizing: 'border-box',
      }}
    >
      {/* Sender Tag */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--chart-positive, #34C759)', flexShrink: 0 }} />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 0 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text, #FFFFFF)', whiteSpace: 'nowrap' }}>
            {data.title || 'Khách Hàng VIP'}
          </span>
          {data.subtitle && (
            <span style={{ fontSize: 9.5, color: 'var(--text-sub, rgba(255,255,255,0.5))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {data.subtitle}
            </span>
          )}
        </div>
      </div>

      {/* Bubble */}
      <div
        style={{
          background: bubbleBg,
          color: bubbleTextColor,
          borderRadius: '18px 18px 18px 4px',
          padding: '12px 16px',
          fontSize: 13.5,
          fontWeight: 600,
          lineHeight: 1.4,
          boxShadow: `0 8px 24px color-mix(in srgb, ${safeAccent} 25%, transparent), 0 4px 12px rgba(0,0,0,0.3)`,
          maxWidth: '94%',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
        }}
      >
        {!isTypingDone ? (
          <span style={{ letterSpacing: '0.2em', opacity: 0.8 }}>• • •</span>
        ) : (
          data.content || 'Dự án đã được duyệt, chuyển cọc ngay nhé!'
        )}
      </div>
    </div>
  )
}
