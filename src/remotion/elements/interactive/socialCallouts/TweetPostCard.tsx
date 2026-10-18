import React from 'react'
import { interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion'
import { SocialCalloutData } from '@/types/scene'
import { mixColor } from '../../../utils/rich-text-parser'

interface Props {
  data: SocialCalloutData;
  accent: string;
}

export const TweetPostCard: React.FC<Props> = ({ data, accent }) => {
  const frame = useCurrentFrame()

  // Likes counter
  const likesCount = Math.min(999, Math.floor(interpolate(frame, [10, 40], [0, 142], { extrapolateRight: 'clamp' })))
  const tweetAccent = accent || '#1DA1F2'

  return (
    <div
      style={{
        width: '100%',
        background: 'var(--card-bg)',
        border: `1.5px solid ${mixColor(tweetAccent, 40)}`,
        borderRadius: 16,
        padding: '14px 16px',
        boxShadow: `var(--shadow-md, 0 12px 32px rgba(0, 0, 0, 0.6)), 0 0 20px ${mixColor(tweetAccent, 20)}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        boxSizing: 'border-box',
      }}
    >
      {/* Author Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${tweetAccent} 0%, color-mix(in srgb, ${tweetAccent} 60%, var(--text)) 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 10px ${mixColor(tweetAccent, 40)}`,
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {data.title || 'Elon Musk'}
              </span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill={tweetAccent} stroke={tweetAccent} strokeWidth="1" style={{ flexShrink: 0 }}>
                <path d="M12 2l2.4 2.6 3.5-.4 1.3 3.3 3.2 1.5-.7 3.5 2.1 2.8-2.1 2.8.7 3.5-3.2 1.5-1.3 3.3-3.5-.4L12 22l-2.4-2.6-3.5.4-1.3-3.3-3.2-1.5.7-3.5-2.1-2.8 2.1-2.8-.7-3.5 3.2-1.5 1.3-3.3 3.5.4L12 2z" />
                <path d="M9 12l2 2 4-4" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-sub)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {data.subtitle || '@elonmusk'}
            </div>
          </div>
        </div>
        <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--text)', flexShrink: 0, paddingLeft: 6 }}>𝕏</span>
      </div>

      {/* Tweet Body */}
      <div style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.45, fontWeight: 500, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
        {data.content || 'AI is transforming how creators produce viral content.'}
      </div>

      {/* Metrics Footer */}
      <div style={{ display: 'flex', gap: 16, borderTop: '1px solid var(--border)', paddingTop: 8, fontSize: 10.5, color: 'var(--text-sub)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          {likesCount}K Likes
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m17 1 4 4-4 4" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <path d="m7 23-4-4 4-4" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
          28.4K Reposts
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          1.2M Views
        </span>
      </div>
    </div>
  )
}
