import React from 'react'
import { useEditorStore } from '@/store/useEditorStore'

interface TimelinePlayheadNeedleProps {
  pxPerSec: number
}

export const TimelinePlayheadNeedle: React.FC<TimelinePlayheadNeedleProps> = React.memo(({ pxPerSec }) => {
  const currentTimeSec = useEditorStore((s) => s.currentTimeSec) || 0

  return (
    <div
      style={{
        position: 'absolute',
        left: `calc(12px + ${currentTimeSec * pxPerSec}px)`,
        top: '10px',
        bottom: 0,
        width: '2px',
        background: '#FF3366',
        boxShadow: '0 0 8px #FF3366',
        pointerEvents: 'none',
        zIndex: 20
      }}
    >
      <div
        style={{
          width: '10px',
          height: '10px',
          background: '#FF3366',
          borderRadius: '50%',
          transform: 'translate(-4px, -2px)'
        }}
      />
    </div>
  )
})

export default TimelinePlayheadNeedle
