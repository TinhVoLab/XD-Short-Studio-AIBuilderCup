import React from 'react'
import { interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion'
import { DocumentEvidenceData } from '@/types/scene'

interface Props {
  data: DocumentEvidenceData;
  accent: string;
}

export const HighlighterDoc: React.FC<Props> = ({ data, accent }) => {
  const frame = useCurrentFrame()

  // Highlighter sweep width percentage: 0% -> 100%
  const highlightProgress = interpolate(frame, [8, 25], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <div
      style={{
        width: '100%',
        background: 'linear-gradient(180deg, #F9F9FB 0%, #EDEDF2 100%)',
        borderRadius: 14,
        padding: '16px 18px',
        color: '#1A1D20',
        boxShadow: 'var(--shadow-lg, 0 16px 40px rgba(0, 0, 0, 0.7)), inset 0 1px 0 rgba(255,255,255,0.8)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxSizing: 'border-box',
      }}
    >
      {/* Doc Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #D0D4DC', paddingBottom: 8, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <span style={{ fontSize: 11, fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {data.title || 'BÁO CÁO MẬT'}
          </span>
        </div>
        <span style={{ fontSize: 9, fontWeight: 700, color: '#666', background: '#E2E6EE', padding: '2px 6px', borderRadius: 4 }}>
          {data.badge || 'TRÍCH XUẤT'}
        </span>
      </div>

      {/* Doc Body with Animated Highlighter */}
      <div style={{ fontSize: 13, lineHeight: 1.5, color: '#2C3036', fontWeight: 500, fontFamily: 'serif' }}>
        {data.content || 'Doanh thu thuần đã tăng trưởng đột biến 300% chỉ trong 90 ngày.'}
      </div>

      {/* Highlighter Overlay Box */}
      {data.highlight && (
        <div style={{ marginTop: 8, position: 'relative', display: 'inline-block' }}>
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: `${highlightProgress}%`,
              background: accent || 'var(--accent, #FFE600)',
              opacity: 0.55,
              borderRadius: 3,
              zIndex: 1,
            }}
          />
          <span style={{ position: 'relative', zIndex: 2, fontSize: 13.5, fontWeight: 900, color: '#000000', padding: '0 4px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
            <span>"{data.highlight}"</span>
          </span>
        </div>
      )}
    </div>
  )
}
