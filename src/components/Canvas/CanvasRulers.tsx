import React, { useEffect, useRef, useState } from 'react'

interface CanvasRulersProps {
  phoneFrameId?: string
  containerRef: React.RefObject<HTMLDivElement>
}

const RULER_SIZE = 20
const BG_COLOR = '#11141A'
const BORDER_COLOR = 'rgba(255, 255, 255, 0.15)'

export const CanvasRulers: React.FC<CanvasRulersProps> = ({ phoneFrameId = 'phoneFrame', containerRef }) => {
  const topCanvasRef = useRef<HTMLCanvasElement>(null)
  const leftCanvasRef = useRef<HTMLCanvasElement>(null)
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)
  const [rects, setRects] = useState({ cRect: null as DOMRect | null, pRect: null as DOMRect | null })

  // Use ResizeObserver to reliably get container and phone dimensions
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateRects = () => {
      const pElement = document.getElementById(phoneFrameId)
      setRects({
        cRect: container.getBoundingClientRect(),
        pRect: pElement ? pElement.getBoundingClientRect() : null
      })
    }
    
    // Initial measure
    updateRects()
    
    const ro = new ResizeObserver(() => {
      updateRects()
    })
    
    ro.observe(container)
    
    const phoneEl = document.getElementById(phoneFrameId)
    if (phoneEl) {
      ro.observe(phoneEl)
    }

    window.addEventListener('resize', updateRects)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', updateRects)
    }
  }, [containerRef, phoneFrameId])

  // Draw rulers when dimensions or mouse changes
  useEffect(() => {
    const { cRect, pRect } = rects
    if (!cRect || !topCanvasRef.current || !leftCanvasRef.current) return

    const width = cRect.width
    const height = cRect.height
    
    if (width === 0 || height === 0) return

    const dpr = window.devicePixelRatio || 1

    const defaultScale = 0.85
    let originX = width / 2 - (360 * defaultScale) / 2
    let phoneWidth = 360 * defaultScale
    let scaleX = defaultScale

    let originY = height / 2 - (640 * defaultScale) / 2
    let phoneHeight = 640 * defaultScale
    let scaleY = defaultScale

    if (pRect && pRect.width > 0) {
      originX = pRect.left - cRect.left
      phoneWidth = pRect.width
      scaleX = phoneWidth / 360
      
      originY = pRect.top - cRect.top
      phoneHeight = pRect.height
      scaleY = phoneHeight / 640
    }

    // Top Ruler Canvas
    const topCanvas = topCanvasRef.current
    topCanvas.width = width * dpr
    topCanvas.height = RULER_SIZE * dpr
    topCanvas.style.width = `${width}px`
    topCanvas.style.height = `${RULER_SIZE}px`

    const topCtx = topCanvas.getContext('2d')
    if (topCtx) {
      topCtx.scale(dpr, dpr)
      topCtx.clearRect(0, 0, width, RULER_SIZE)

      topCtx.fillStyle = BG_COLOR
      topCtx.fillRect(0, 0, width, RULER_SIZE)

      topCtx.strokeStyle = BORDER_COLOR
      topCtx.lineWidth = 1
      topCtx.beginPath()
      topCtx.moveTo(0, RULER_SIZE - 0.5)
      topCtx.lineTo(width, RULER_SIZE - 0.5)
      topCtx.stroke()

      topCtx.fillStyle = 'rgba(190, 255, 1, 0.05)'
      topCtx.fillRect(originX, 0, phoneWidth, RULER_SIZE)

      topCtx.strokeStyle = 'rgba(190, 255, 1, 0.3)'
      topCtx.beginPath()
      topCtx.moveTo(originX + 0.5, 0)
      topCtx.lineTo(originX + 0.5, RULER_SIZE)
      topCtx.moveTo(originX + phoneWidth - 0.5, 0)
      topCtx.lineTo(originX + phoneWidth - 0.5, RULER_SIZE)
      topCtx.stroke()

      const startUnitX = Math.floor(-originX / (10 * scaleX)) * 10 - 100
      const endUnitX = Math.ceil((width - originX) / (10 * scaleX)) * 10 + 100

      topCtx.font = '9px "JetBrains Mono", monospace, sans-serif'
      
      for (let u = startUnitX; u <= endUnitX; u += 10) {
        const x = Math.round(originX + u * scaleX) + 0.5
        if (x < RULER_SIZE || x > width) continue

        const isMajor = u % 100 === 0
        const isMid = u % 50 === 0
        const tickHeight = isMajor ? 12 : isMid ? 7 : 4

        topCtx.strokeStyle = isMajor ? 'rgba(255,255,255,0.45)' : isMid ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)'
        topCtx.beginPath()
        topCtx.moveTo(x, RULER_SIZE - tickHeight)
        topCtx.lineTo(x, RULER_SIZE)
        topCtx.stroke()

        if (isMajor && x + 25 < width) {
          topCtx.fillStyle = 'rgba(255, 255, 255, 0.55)'
          topCtx.fillText(`${u}`, x + 3, 10)
        }
      }

      if (mousePos && mousePos.y >= RULER_SIZE && mousePos.x >= RULER_SIZE) {
        topCtx.strokeStyle = '#BEFF01'
        topCtx.lineWidth = 1.5
        topCtx.beginPath()
        topCtx.moveTo(mousePos.x + 0.5, 0)
        topCtx.lineTo(mousePos.x + 0.5, RULER_SIZE)
        topCtx.stroke()

        const currentUnitX = Math.round((mousePos.x - originX) / scaleX)
        topCtx.fillStyle = '#BEFF01'
        topCtx.fillText(`${currentUnitX}`, Math.min(width - 30, mousePos.x + 4), RULER_SIZE - 4)
      }
    }

    // Left Ruler Canvas
    const leftCanvas = leftCanvasRef.current
    leftCanvas.width = RULER_SIZE * dpr
    leftCanvas.height = height * dpr
    leftCanvas.style.width = `${RULER_SIZE}px`
    leftCanvas.style.height = `${height}px`

    const leftCtx = leftCanvas.getContext('2d')
    if (leftCtx) {
      leftCtx.scale(dpr, dpr)
      leftCtx.clearRect(0, 0, RULER_SIZE, height)

      leftCtx.fillStyle = BG_COLOR
      leftCtx.fillRect(0, 0, RULER_SIZE, height)

      leftCtx.strokeStyle = BORDER_COLOR
      leftCtx.lineWidth = 1
      leftCtx.beginPath()
      leftCtx.moveTo(RULER_SIZE - 0.5, 0)
      leftCtx.lineTo(RULER_SIZE - 0.5, height)
      leftCtx.stroke()

      leftCtx.fillStyle = 'rgba(190, 255, 1, 0.05)'
      leftCtx.fillRect(0, originY, RULER_SIZE, phoneHeight)

      leftCtx.strokeStyle = 'rgba(190, 255, 1, 0.3)'
      leftCtx.beginPath()
      leftCtx.moveTo(0, originY + 0.5)
      leftCtx.lineTo(RULER_SIZE, originY + 0.5)
      leftCtx.moveTo(0, originY + phoneHeight - 0.5)
      leftCtx.lineTo(RULER_SIZE, originY + phoneHeight - 0.5)
      leftCtx.stroke()

      const startUnitY = Math.floor(-originY / (10 * scaleY)) * 10 - 100
      const endUnitY = Math.ceil((height - originY) / (10 * scaleY)) * 10 + 100

      leftCtx.font = '9px "JetBrains Mono", monospace, sans-serif'
      
      for (let u = startUnitY; u <= endUnitY; u += 10) {
        const y = Math.round(originY + u * scaleY) + 0.5
        if (y < RULER_SIZE || y > height) continue

        const isMajor = u % 100 === 0
        const isMid = u % 50 === 0
        const tickWidth = isMajor ? 12 : isMid ? 7 : 4

        leftCtx.strokeStyle = isMajor ? 'rgba(255,255,255,0.45)' : isMid ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)'
        leftCtx.beginPath()
        leftCtx.moveTo(RULER_SIZE - tickWidth, y)
        leftCtx.lineTo(RULER_SIZE, y)
        leftCtx.stroke()

        if (isMajor && y + 15 < height) {
          leftCtx.fillStyle = 'rgba(255, 255, 255, 0.55)'
          leftCtx.save()
          leftCtx.translate(11, y + 3)
          leftCtx.rotate(-Math.PI / 2)
          leftCtx.fillText(`${u}`, 0, 0)
          leftCtx.restore()
        }
      }

      if (mousePos && mousePos.x >= RULER_SIZE && mousePos.y >= RULER_SIZE) {
        leftCtx.strokeStyle = '#BEFF01'
        leftCtx.lineWidth = 1.5
        leftCtx.beginPath()
        leftCtx.moveTo(0, mousePos.y + 0.5)
        leftCtx.lineTo(RULER_SIZE, mousePos.y + 0.5)
        leftCtx.stroke()

        const currentUnitY = Math.round((mousePos.y - originY) / scaleY)
        leftCtx.fillStyle = '#BEFF01'
        leftCtx.save()
        leftCtx.translate(14, Math.min(height - 20, mousePos.y + 12))
        leftCtx.rotate(-Math.PI / 2)
        leftCtx.fillText(`${currentUnitY}`, 0, 0)
        leftCtx.restore()
      }
    }
  }, [rects, mousePos])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }

    const handleMouseLeave = () => {
      setMousePos(null)
    }

    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [containerRef])

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 25, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: RULER_SIZE,
        height: RULER_SIZE,
        backgroundColor: BG_COLOR,
        borderRight: `1px solid ${BORDER_COLOR}`,
        borderBottom: `1px solid ${BORDER_COLOR}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgba(255, 255, 255, 0.45)',
        fontSize: 9,
        fontWeight: 700,
        userSelect: 'none',
        fontFamily: 'monospace',
      }}>
        px
      </div>
      <canvas
        ref={topCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: RULER_SIZE,
          pointerEvents: 'none',
        }}
      />
      <canvas
        ref={leftCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: RULER_SIZE,
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
