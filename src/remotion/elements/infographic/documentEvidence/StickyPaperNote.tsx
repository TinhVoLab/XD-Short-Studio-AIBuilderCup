import React from 'react'
import { DocumentEvidenceData } from '@/types/scene'

interface Props {
  data: DocumentEvidenceData;
  accent: string;
}

export const StickyPaperNote: React.FC<Props> = ({ data, accent }) => {
  const isTornPaper = data.subVariant === 'torn-paper' || data.badge === 'KEY TAKEAWAY' || data.title?.includes('BÍ KÍP')

  if (isTornPaper) {
    return (
      <div
        style={{
          transform: 'rotate(-2.5deg)',
          width: '100%',
          position: 'relative',
          filter: 'drop-shadow(0 16px 28px rgba(0, 0, 0, 0.65)) drop-shadow(0 4px 10px rgba(0,0,0,0.4))',
          boxSizing: 'border-box',
        }}
      >
        {/* 📎 3D Metallic Paperclip on Top-Left */}
        <div
          style={{
            position: 'absolute',
            top: -14,
            left: 20,
            zIndex: 10,
            pointerEvents: 'none',
            filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.5))',
          }}
        >
          <svg width="28" height="52" viewBox="0 0 28 52" fill="none">
            {/* Paperclip Outer Loop */}
            <path
              d="M8 12V38C8 44 14 44 14 38V10C14 4 22 4 22 10V34"
              stroke="#D1D5DB"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Metallic Highlight Shine */}
            <path
              d="M7 12V38C7 43.5 13 43.5 13 38V10C13 4.5 21 4.5 21 10V34"
              stroke="#FFFFFF"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity="0.8"
            />
          </svg>
        </div>

        {/* Torn Paper Body with Notebook Lines and Jagged Edges */}
        <div
          style={{
            width: '100%',
            background: '#FDFBF7',
            // Notebook horizontal lined pattern
            backgroundImage: 'repeating-linear-gradient(#FDFBF7, #FDFBF7 23px, #E5E7EB 24px)',
            color: '#1F2937',
            padding: '24px 20px 22px 24px',
            boxSizing: 'border-box',
            position: 'relative',
            // Jagged/Torn paper edges on top and bottom
            clipPath: 'polygon(0% 4px, 4% 0px, 8% 4px, 12% 1px, 16% 5px, 20% 0px, 25% 4px, 30% 1px, 35% 5px, 40% 0px, 45% 4px, 50% 1px, 55% 5px, 60% 0px, 65% 4px, 70% 1px, 75% 5px, 80% 0px, 85% 4px, 90% 1px, 95% 4px, 100% 0px, 100% calc(100% - 3px), 96% 100%, 92% calc(100% - 4px), 88% calc(100% - 1px), 84% calc(100% - 5px), 80% 100%, 75% calc(100% - 4px), 70% calc(100% - 1px), 65% calc(100% - 5px), 60% 100%, 55% calc(100% - 4px), 50% calc(100% - 1px), 45% calc(100% - 5px), 40% 100%, 35% calc(100% - 4px), 30% calc(100% - 1px), 25% calc(100% - 5px), 20% 100%, 15% calc(100% - 4px), 10% calc(100% - 1px), 5% calc(100% - 4px), 0% 100%)',
          }}
        >
          {/* Red Left Margin Line (Standard notebook margin) */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 14,
              width: 1.5,
              background: 'rgba(239, 68, 68, 0.45)',
            }}
          />

          <div style={{ paddingLeft: 6 }}>
            {/* Header / Subtitle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, color: '#4B5563' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
                <span>{data.title || 'TRÍCH ĐOẠN SỔ TAY'}</span>
              </span>
              {data.badge && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: 3,
                    background: 'rgba(0, 0, 0, 0.08)',
                    color: '#374151',
                    letterSpacing: 0.5,
                  }}
                >
                  {data.badge}
                </span>
              )}
            </div>

            {/* Handwritten / Scribe style content */}
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 700,
                lineHeight: '24px',
                color: '#111827',
                fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
              }}
            >
              {data.content || 'Chỉ cần làm tốt 1 kỹ năng cốt lõi duy nhất: TẬP TRUNG CAO ĐỘ.'}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Standard Yellow Sticky Note with Translucent Scotch Tape
  return (
    <div
      style={{
        transform: 'rotate(2.5deg)',
        width: '100%',
        background: '#FFF9A6',
        borderRadius: 2,
        padding: '20px 18px 16px',
        color: '#222222',
        boxShadow: 'var(--shadow-lg, 0 16px 36px rgba(0, 0, 0, 0.6)), 0 2px 8px rgba(0,0,0,0.35)',
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      {/* Scotch Tape Graphic on Top */}
      <div
        style={{
          position: 'absolute',
          top: -11,
          left: '50%',
          transform: 'translateX(-50%) rotate(-1deg)',
          width: 76,
          height: 22,
          background: 'rgba(255, 255, 255, 0.65)',
          border: '1px solid rgba(255,255,255,0.8)',
          borderRadius: 2,
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#786C00', marginBottom: 6, letterSpacing: 0.5 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="17" x2="12" y2="22" />
          <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
        </svg>
        <span>{data.title || 'LƯU Ý QUAN TRỌNG'}</span>
      </div>

      <div style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.45, color: '#1A1A1A', fontFamily: 'sans-serif' }}>
        {data.content || 'Nguyên tắc bất di bất dịch cần ghi nhớ!'}
      </div>
    </div>
  )
}
