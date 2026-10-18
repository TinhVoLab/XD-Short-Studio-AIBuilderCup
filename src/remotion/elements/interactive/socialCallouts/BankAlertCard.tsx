import React from 'react'
import { interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion'
import { SocialCalloutData } from '@/types/scene'
import { mixColor } from '../../../utils/rich-text-parser'

interface Props {
  data: SocialCalloutData;
  accent: string;
}

export const BankAlertCard: React.FC<Props> = ({ data, accent }) => {
  const frame = useCurrentFrame()
  const isPulsing = Math.floor(frame / 10) % 2 === 0

  const titleLength = (data.title || '').length
  const titleFontSize = titleLength > 22 ? 18 : titleLength > 16 ? 21 : 25

  return (
    <div
      style={{
        width: '100%',
        background: 'var(--card-bg)',
        border: `1.5px solid ${accent}`,
        borderRadius: 18,
        padding: '14px 16px',
        boxShadow: `var(--shadow-lg, 0 14px 36px rgba(0, 0, 0, 0.7)), 0 0 24px ${mixColor(accent, 20)}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        boxSizing: 'border-box',
      }}
    >
      {/* Top Header: Bank Info & Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${accent} 0%, color-mix(in srgb, ${accent} 40%, var(--text)) 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              boxShadow: `0 0 10px ${mixColor(accent, 40)}`,
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 2L2 7h20L12 2z" />
            </svg>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--text)', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {data.subtitle || 'NGÂN HÀNG'}
            </div>
            <div style={{ fontSize: 9.5, color: 'var(--text-sub)', marginTop: 1 }}>
              Biến động số dư tài khoản
            </div>
          </div>
        </div>

        <span
          style={{
            background: `color-mix(in srgb, ${accent} 15%, transparent)`,
            border: `1px solid color-mix(in srgb, ${accent} 50%, transparent)`,
            // Chữ 8.5px trên chip nhuộm accent (thường là --chart-positive, chỉ đạt 3:1) → pha màu chữ theme
            color: `color-mix(in srgb, ${accent} 60%, var(--text))`,
            padding: '1.5px 6px',
            borderRadius: 10,
            fontSize: 8.5,
            fontWeight: 700,
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {data.badge || 'THÀNH CÔNG'}
        </span>
      </div>

      {/* Center: Glowing Amount */}
      <div
        style={{
          background: 'var(--surface-2)',
          borderRadius: 12,
          padding: '10px 12px',
          border: '1px solid var(--border)',
          textAlign: 'center',
          overflowWrap: 'break-word',
          wordBreak: 'break-word',
        }}
      >
        <div
          style={{
            fontSize: titleFontSize,
            fontWeight: 900,
            color: accent,
            fontFamily: 'Be Vietnam Pro, sans-serif',
            letterSpacing: '-0.02em',
            textShadow: isPulsing ? `0 0 20px ${accent}` : `0 0 10px ${mixColor(accent, 40)}`,
            lineHeight: 1.2,
          }}
        >
          {data.title || '+100,000,000 đ'}
        </div>
      </div>

      {/* Bottom: Transaction Message */}
      {data.content && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text)', lineHeight: 1.35, textAlign: 'left', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-sub)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>
            <span style={{ color: 'var(--text-sub)' }}>ND: </span>
            <span style={{ fontWeight: 600 }}>{data.content}</span>
          </span>
        </div>
      )}
    </div>
  )
}
