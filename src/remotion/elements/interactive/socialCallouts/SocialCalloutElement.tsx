import React from 'react'
import { Sequence } from 'remotion'
import { SceneElement } from '@/types/scene'
import { BankAlertCard } from './BankAlertCard'
import { TweetPostCard } from './TweetPostCard'
import { ChatBubbleCard } from './ChatBubbleCard'
import { NewsTickerBanner } from './NewsTickerBanner'

interface Props {
  el: SceneElement;
  computedStyle?: React.CSSProperties;
  content?: string;
  frame?: number;
  fps?: number;
  delayFrames?: number;
}

export const SocialCalloutElement: React.FC<Props> = ({ el, computedStyle }) => {
  const data = el.calloutData || { variant: 'bank', title: '+100,000,000 đ' }
  const accent = el.accentColor || data.accentColor || 'var(--chart-positive, #00D46A)'

  return (
    <div
      style={{
        ...computedStyle,
        width: el.width || 320,
        boxSizing: 'border-box',
        pointerEvents: 'none',
      }}
    >
      {data.variant === 'bank' && <BankAlertCard data={data} accent={accent} />}
      {data.variant === 'tweet' && <TweetPostCard data={data} accent={accent} />}
      {data.variant === 'chat' && <ChatBubbleCard data={data} accent={accent} />}
      {data.variant === 'news' && <NewsTickerBanner data={data} accent={accent} />}
    </div>
  )
}
