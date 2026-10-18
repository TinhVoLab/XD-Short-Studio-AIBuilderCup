import React from 'react'
import { DocumentEvidenceData } from '@/types/scene'
import { mixColor } from '../../../utils/rich-text-parser';

interface Props {
  data: DocumentEvidenceData;
  accent: string;
}

export const RubberStamp: React.FC<Props> = ({ data, accent }) => {
  const accentColor = accent || data.accentColor || 'var(--danger, #FF2A2A)'
  const stampType = data.stampVariant || (
    data.title?.includes('DUYỆT') ? 'approved-circle' :
    data.title?.includes('CẢNH BÁO') || data.title?.includes('LỪA ĐẢO') ? 'warning-hazard' :
    'secret-box'
  )

  // ── 1. APPROVED CIRCULAR SEAL (Con dấu tròn 2 vành đồng tâm) ──
  if (stampType === 'approved-circle') {
    return (
      <div
        style={{
          transform: 'rotate(8deg)',
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: 140,
          height: 140,
          borderRadius: '50%',
          border: `3px solid ${accentColor}`,
          color: accentColor,
          background: `${mixColor(accentColor, 5)}`,
          boxShadow: `0 0 16px ${mixColor(accentColor, 20)}, inset 0 0 12px ${mixColor(accentColor, 10)}`,
          position: 'relative',
          padding: 8,
          boxSizing: 'border-box',
          textAlign: 'center',
        }}
      >
        {/* Inner concentric circle */}
        <div
          style={{
            position: 'absolute',
            inset: 5,
            borderRadius: '50%',
            border: `1.5px dashed ${mixColor(accentColor, 67)}`,
            pointerEvents: 'none',
          }}
        />

        {/* Top Arc Subtitle */}
        <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 2 }}>
          ★ {data.subtitle || 'OFFICIAL VERIFIED'} ★
        </div>

        {/* Center Main Text with Check Icon */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '2px 0' }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>✓</span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              fontFamily: 'Impact, Be Vietnam Pro, sans-serif',
              lineHeight: 1.15,
            }}
          >
            {data.title || 'ĐÃ PHÊ DUYỆT'}
          </span>
        </div>

        {/* Bottom Arc Badge */}
        <div style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '0.14em', opacity: 0.9, marginTop: 2 }}>
          {data.badge || '100% VALID'}
        </div>
      </div>
    )
  }

  // ── 2. WARNING / SCAM HAZARD OCTAGON STAMP (Dấu bát giác / Báo động đỏ) ──
  if (stampType === 'warning-hazard') {
    return (
      <div
        style={{
          transform: 'rotate(-16deg)',
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '10px 18px',
          color: accentColor,
          background: `${mixColor(accentColor, 9)}`,
          border: `3px solid ${accentColor}`,
          borderRadius: 4,
          clipPath: 'polygon(12px 0%, calc(100% - 12px) 0%, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0% calc(100% - 12px), 0% 12px)',
          boxShadow: `0 0 24px ${mixColor(accentColor, 33)}, inset 0 0 14px ${mixColor(accentColor, 15)}`,
          textAlign: 'center',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {/* Top Hazard Warning Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 8.5, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 3 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>{data.subtitle || 'DANGER / SCAM ALERT'}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        {/* Big Alert Headline */}
        <div
          style={{
            fontSize: 21,
            fontWeight: 900,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontFamily: 'Impact, Be Vietnam Pro, sans-serif',
            textShadow: `0 0 8px ${mixColor(accentColor, 40)}`,
            borderTop: `1.5px solid ${mixColor(accentColor, 53)}`,
            borderBottom: `1.5px solid ${mixColor(accentColor, 53)}`,
            padding: '2px 8px',
            margin: '2px 0',
          }}
        >
          {data.title || 'CẢNH BÁO LỪA ĐẢO'}
        </div>

        {/* Bottom Blacklist Sub */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 8, fontWeight: 800, letterSpacing: '0.16em', opacity: 0.95, textTransform: 'uppercase' }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
          <span>{data.badge || 'DO NOT TRUST'}</span>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
        </div>
      </div>
    )
  }

  // ── 3. 🔴 TOP SECRET MILITARY BOX STAMP (Con dấu chữ nhật quân sự viền kép) ──
  return (
    <div
      style={{
        transform: 'rotate(-12deg)',
        border: `3.5px double ${accentColor}`,
        borderRadius: 8,
        padding: '8px 20px',
        color: accentColor,
        background: `${mixColor(accentColor, 7)}`,
        textAlign: 'center',
        boxShadow: `0 0 20px ${mixColor(accentColor, 27)}`,
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        boxSizing: 'border-box',
      }}
    >
      <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.85 }}>
        ★ {data.subtitle || 'CHỈ LƯU HÀNH NỘI BỘ'} ★
      </div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 900,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          fontFamily: 'Impact, Be Vietnam Pro, sans-serif',
        }}
      >
        {data.title || 'TUYỆT MẬT'}
      </div>
      <div style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '0.18em', opacity: 0.75, textTransform: 'uppercase' }}>
        CLASSIFIED LEVEL 5
      </div>
    </div>
  )
}
