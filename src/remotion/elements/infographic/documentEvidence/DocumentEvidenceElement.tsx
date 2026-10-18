import React from 'react'
import { Sequence } from 'remotion'
import { SceneElement } from '@/types/scene'
import { HighlighterDoc } from './HighlighterDoc'
import { RubberStamp } from './RubberStamp'
import { StickyPaperNote } from './StickyPaperNote'
import { RemotionElementWrapper } from '../../core/RemotionElementWrapper'

interface Props {
  el: SceneElement;
  computedStyle?: React.CSSProperties;
  positionStyle?: React.CSSProperties;
  content?: string;
  frame?: number;
  fps?: number;
  delayFrames?: number;
}

export const DocumentEvidenceElement: React.FC<Props> = ({ el, computedStyle, positionStyle }) => {
  const data = el.docData || { variant: 'highlighter', title: 'BÁO CÁO MẬT' }
  const accent = el.accentColor || data.accentColor || 'var(--accent, #FFE600)'

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      <div
        style={{
          width: el.width || 320,
          boxSizing: 'border-box',
          pointerEvents: 'none',
        }}
      >
        {data.variant === 'highlighter' && <HighlighterDoc data={data} accent={accent} />}
        {data.variant === 'stamp' && <RubberStamp data={data} accent={accent} />}
        {data.variant === 'note' && <StickyPaperNote data={data} accent={accent} />}
      </div>
    </RemotionElementWrapper>
  )
}
