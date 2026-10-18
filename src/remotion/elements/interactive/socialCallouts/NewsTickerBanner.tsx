import React from 'react'
import { interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion'
import { SocialCalloutData } from '@/types/scene'
import { getContrastTextColor } from '@/config/themePalettes'

interface Props {
  data: SocialCalloutData;
  accent: string;
}

export const NewsTickerBanner: React.FC<Props> = ({ data, accent }) => {
  const frame = useCurrentFrame()
  const isRedDot = Math.floor(frame / 8) % 2 === 0
  const bannerColor = accent || 'var(--danger, #FF3B30)'

  // Chữ trên dải màu: hex → đen/trắng theo tương phản; --accent → --on-accent; token khác → nền nhuộm + chữ --text
  const isHexBanner = String(bannerColor).startsWith('#')
  const isThemeAccent = String(bannerColor).startsWith('var(--accent')
  const bannerBg = isHexBanner || isThemeAccent ? bannerColor : `color-mix(in srgb, ${bannerColor} 22%, var(--surface-1))`
  const bannerTextColor = isHexBanner ? getContrastTextColor(bannerColor) : isThemeAccent ? 'var(--on-accent, #000000)' : 'var(--text)'

  return (
    <div
      style={{
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: `var(--shadow-md, 0 10px 30px rgba(0, 0, 0, 0.5)), 0 0 20px color-mix(in srgb, ${bannerColor} 20%, transparent)`,
        border: `1.5px solid ${bannerColor}`,
        boxSizing: 'border-box',
      }}
    >
      {/* Top Banner Header */}
      <div style={{ background: bannerBg, color: bannerTextColor, padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: bannerTextColor, opacity: isRedDot ? 1 : 0.3, flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            {data.badge || 'BREAKING NEWS'}
          </span>
        </div>
        <span style={{ fontSize: 9.5, fontWeight: 700, opacity: 0.85, whiteSpace: 'nowrap', marginLeft: 8 }}>
          {data.subtitle || 'LIVE 24H'}
        </span>
      </div>

      {/* Headline Body */}
      <div style={{ background: 'var(--surface-1, rgba(10, 15, 25, 0.96))', padding: '12px 14px', color: 'var(--text, #FFFFFF)', fontSize: 13, fontWeight: 800, lineHeight: 1.35, textTransform: 'uppercase', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
        {data.content || data.title || 'THỊ TRƯỜNG BIẾN ĐỘNG MẠNH TRONG 24H QUA'}
      </div>
    </div>
  )
}
