import React, { useEffect, useState, useRef } from 'react'

export const PixelRuler: React.FC = () => {
  const [frameRect, setFrameRect] = useState<{ left: number; width: number } | null>(null)
  const [cursorX, setCursorX] = useState<number | null>(null)
  const rulerRef = useRef<HTMLDivElement>(null)

  // Track phoneFrame element position on screen
  useEffect(() => {
    const updateFramePosition = () => {
      const el = document.getElementById('phoneFrame')
      if (el && rulerRef.current) {
        const frameB = el.getBoundingClientRect()
        const rulerB = rulerRef.current.getBoundingClientRect()
        setFrameRect({
          left: frameB.left - rulerB.left,
          width: frameB.width,
        })
      }
    }

    updateFramePosition()
    window.addEventListener('resize', updateFramePosition)
    const timer = setInterval(updateFramePosition, 1000)

    const handleMouseMove = (e: MouseEvent) => {
      if (rulerRef.current) {
        const rulerB = rulerRef.current.getBoundingClientRect()
        if (e.clientX >= rulerB.left && e.clientX <= rulerB.right) {
          setCursorX(e.clientX - rulerB.left)
        } else {
          setCursorX(null)
        }
      }
    }

    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('resize', updateFramePosition)
      window.removeEventListener('mousemove', handleMouseMove)
      clearInterval(timer)
    }
  }, [])

  // Canvas standard width is 360px
  const scale = frameRect ? frameRect.width / 360 : 0.85
  const fLeft = frameRect ? frameRect.left : 0

  // Generate ticks for canvas (-60 to 420 px, step 10 to cover margins too)
  const ticks = []
  for (let px = 0; px <= 360; px += 10) {
    const isMajor = px % 100 === 0 || px === 360
    const isMid = px % 50 === 0 && !isMajor
    ticks.push({
      px,
      isMajor,
      isMid,
      left: fLeft + px * scale,
    })
  }

  return (
    <div
      ref={rulerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 20,
        background: 'rgba(10, 10, 10, 0.95)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        zIndex: 5,
        userSelect: 'none',
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {/* Active canvas width highlight zone */}
      {frameRect && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: fLeft,
            width: frameRect.width,
            height: '100%',
            background: 'rgba(190, 255, 1, 0.04)',
            borderLeft: '1px dashed rgba(190, 255, 1, 0.3)',
            borderRight: '1px dashed rgba(190, 255, 1, 0.3)',
          }}
        />
      )}

      {/* Ticks & Numbers */}
      {ticks.map(t => (
        <div
          key={t.px}
          style={{
            position: 'absolute',
            left: t.left,
            bottom: 0,
            width: 1,
            height: t.isMajor ? 10 : t.isMid ? 6 : 3,
            background: t.isMajor ? 'rgba(255,255,255,0.45)' : t.isMid ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)',
          }}
        >
          {t.isMajor && (
            <span
              style={{
                position: 'absolute',
                top: -11,
                left: 2,
                fontSize: 8,
                fontFamily: 'monospace',
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.5)',
                lineHeight: 1,
              }}
            >
              {t.px}
            </span>
          )}
        </div>
      ))}

      {/* Target Canvas Center Badge */}
      {frameRect && (
        <div
          style={{
            position: 'absolute',
            top: 3,
            left: fLeft + frameRect.width / 2,
            transform: 'translateX(-50%)',
            fontSize: 8.5,
            fontWeight: 700,
            color: 'rgba(190, 255, 1, 0.6)',
            letterSpacing: '0.04em',
            fontFamily: 'monospace',
          }}
        >
          360 PX
        </div>
      )}

      {/* Dynamic Cursor guide tracker */}
      {cursorX !== null && frameRect && (
        <div
          style={{
            position: 'absolute',
            left: cursorX,
            top: 0,
            bottom: 0,
            width: 1,
            background: '#BEFF01',
            boxShadow: '0 0 4px #BEFF01',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 2,
              left: 4,
              fontSize: 8,
              fontWeight: 800,
              color: '#000',
              background: '#BEFF01',
              padding: '0 3px',
              borderRadius: 2,
              fontFamily: 'monospace',
              lineHeight: 1.2,
            }}
          >
            {Math.round((cursorX - fLeft) / scale)}px
          </span>
        </div>
      )}
    </div>
  )
}
