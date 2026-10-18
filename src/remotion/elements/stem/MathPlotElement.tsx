import React, { useMemo } from 'react'
import {
  Mafs,
  Coordinates,
  Plot,
  Point,
  Vector,
  Line,
  Circle,
  Ellipse,
  Polygon,
  Text,
  Image as MafsImage,
} from 'mafs'
import 'mafs/core.css'
import 'mafs/font.css'
import { useCurrentFrame } from 'remotion'
import { SceneElement } from '@/types/scene'
import { MathPlotData } from '@/types/stem'
import { RemotionElementWrapper } from '../core/RemotionElementWrapper'
import { mixColor } from '../../utils/rich-text-parser'
import { renderLatexHtml } from '@/utils/stem/latex'
import 'katex/dist/katex.min.css'
import { compileRenderFn, evalCoordExpr, PLOT_DEFAULT_DOMAIN_X, PLOT_DEFAULT_DOMAIN_Y } from '@/utils/stem/mathExpr'

interface MathPlotElementProps {
  el: SceneElement
  computedStyle?: React.CSSProperties
  positionStyle?: React.CSSProperties
  fps?: number
}

export const MathPlotElement: React.FC<MathPlotElementProps> = ({
  el,
  computedStyle,
  positionStyle,
  fps = 30,
}) => {
  const frame = useCurrentFrame()
  const data: MathPlotData = el.mathData || {
    expression: 'sin(x - t * 2)',
    domainX: [-5, 5],
    domainY: [-2.5, 2.5],
    color: 'var(--accent)',
    lineWidth: 3,
    showGrid: true,
    showAxes: true,
    animateSpeed: 1.0,
  }

  const speed = data.animateSpeed ?? 1.0
  const timeSec = (frame / fps) * speed

  // Biến độ rộng / chiều cao
  const width = Math.max(160, el.width || 360)
  const height = Math.max(100, el.height || 260)
  const domainX = (data.domainX || PLOT_DEFAULT_DOMAIN_X) as [number, number]
  const domainY = (data.domainY || PLOT_DEFAULT_DOMAIN_Y) as [number, number]
  // Lime #BEFF01 là màu preset cũ (elementsRegistry) → theo accent của theme (lime chìm trên theme sáng)
  const rawLineColor = data.color || el.accentColor
  const lineColor = !rawLineColor || /^#beff01$/i.test(rawLineColor.trim()) ? 'var(--accent)' : rawLineColor
  const showCardBg = el.showCardBg !== false && el.bgColor !== 'transparent'

  // 1. Module 6: Plots (y = f(x, t)) — biểu thức hỏng → null: bỏ đường cong, không vẽ đường thẳng giả
  const fnX = useMemo(() => compileRenderFn(data.expression || 'sin(x - t)', ['x', 't']), [data.expression])
  const evaluateY = (x: number): number => (fnX ? fnX(x, timeSec) : 0)

  // Module 6: Plots (x = f(y, t))
  const fnY = useMemo(() => (data.expressionY ? compileRenderFn(data.expressionY, ['y', 't']) : null), [data.expressionY])
  const evaluateX = (y: number): number => (fnY ? fnY(y, timeSec) : 0)

  // Module 6: Parametric Plot (x(tau), y(tau))
  const paramX = useMemo(() => (data.parametricX ? compileRenderFn(data.parametricX, ['tau', 't']) : null), [data.parametricX])
  const paramY = useMemo(() => (data.parametricY ? compileRenderFn(data.parametricY, ['tau', 't']) : null), [data.parametricY])

  // Module 6: Vector Field (dx, dy)
  const vFieldFn = useMemo(() => {
    if (!data.vectorFieldExpr) return null
    return compileRenderFn(data.vectorFieldExpr, ['x', 'y', 't'])
  }, [data.vectorFieldExpr])

  // 2. Module 2: Tangent Line (Đạo hàm tiếp tuyến trượt)
  const tangentData = useMemo(() => {
    if (!data.showTangent || !fnX) return null

    // Vị trí x của điểm tiếp xúc
    let x0: number
    if (data.tangentX !== undefined) {
      x0 = evalCoordExpr(data.tangentX, timeSec, 0)
    } else {
      // Mặc định cho x0 trượt nhẹ nhàng qua lại giữa [domainX[0] * 0.7, domainX[1] * 0.7]
      const span = (domainX[1] - domainX[0]) * 0.35
      const mid = (domainX[0] + domainX[1]) / 2
      x0 = mid + span * Math.sin(timeSec * 1.2)
    }

    const y0 = evaluateY(x0)
    const h = 0.002
    const fPrime = (evaluateY(x0 + h) - evaluateY(x0 - h)) / (2 * h)

    return { x0, y0, slope: fPrime }
  }, [data.showTangent, data.tangentX, timeSec, domainX, data.expression])

  // 3. Module 3: Tích phân Riemann (Cột hình chữ nhật chia nhỏ)
  const riemannPolygons = useMemo(() => {
    if (!fnX || (data.mode !== 'calculus_area' && !data.integralBounds)) return []

    const [a, b] = data.integralBounds || [-2, 2]
    // Số phân đoạn n: có thể cố định hoặc tăng dần theo thời gian
    const N = data.riemannSubdivisions || Math.min(32, 4 + Math.floor((timeSec % 8) * 4))
    const dx = (b - a) / N
    const polys: [number, number][][] = []

    for (let i = 0; i < N; i++) {
      const xi = a + i * dx
      const midX = xi + dx / 2
      const yi = evaluateY(midX)
      // Tạo hình chữ nhật Riemann
      polys.push([
        [xi, 0],
        [xi + dx, 0],
        [xi + dx, yi],
        [xi, yi],
      ])
    }
    return polys
  }, [data.mode, data.integralBounds, data.riemannSubdivisions, timeSec, data.expression])

  // Render công thức toán học sắc nét bằng KaTeX
  // Nhãn sai → null → ẩn (không in lỗi đỏ vào video)
  const katexHtml = useMemo(() => renderLatexHtml(data.latexLabel || '', { displayMode: false }), [data.latexLabel])

  const hasHeader = showCardBg && Boolean(data.title || katexHtml)
  const headerHeight = hasHeader ? 40 : 0
  const mafsHeight = Math.max(80, height - headerHeight)

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      <div
        style={{
          width,
          height,
          borderRadius: showCardBg ? (el.radius !== undefined ? el.radius : 14) : 0,
          overflow: 'hidden',
          background: showCardBg ? (el.bgColor || 'var(--card-bg)') : 'transparent',
          border: showCardBg
            ? (el.stroke ? `1px solid ${el.stroke}` : '1px solid var(--border)')
            : 'none',
          boxShadow: showCardBg ? `var(--shadow-lg, 0 12px 36px rgba(0, 0, 0, 0.7)), 0 0 24px ${mixColor(lineColor, 8)}` : 'none',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {/* Title Bar: Co giãn thích ứng (Adaptive across 9:16, 16:9, 1:1) */}
        {hasHeader && (
          <div
            style={{
              height: headerHeight,
              padding: '0 14px',
              background: 'var(--surface-1)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              boxSizing: 'border-box',
              zIndex: 10,
              overflow: 'hidden',
            }}
          >
            {data.title && (
              <span
                style={{
                  color: 'var(--text)',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.01em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  flex: '1 1 auto',
                  minWidth: 0,
                }}
                title={data.title}
              >
                {data.title}
              </span>
            )}
            {katexHtml && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  flex: '0 0 auto',
                  maxWidth: data.title ? '65%' : '100%',
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  scrollbarWidth: 'none',
                  padding: '3px 9px',
                  borderRadius: 6,
                  background: 'var(--surface-1)',
                  border: `1px solid ${mixColor(lineColor, 45)}`,
                  color: 'var(--text)',
                  fontSize: 12.5,
                  lineHeight: 1.2,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.35)',
                }}
                dangerouslySetInnerHTML={{ __html: katexHtml }}
              />
            )}
          </div>
        )}

        {/* Floating KaTeX HUD Badge cho chế độ Frameless */}
        {!showCardBg && katexHtml && (
          <div
            style={{
              position: 'absolute',
              top: 10,
              right: 12,
              zIndex: 20,
              pointerEvents: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 10px',
              borderRadius: 8,
              background: 'var(--surface-1)',
              border: `1px solid ${mixColor(lineColor, 45)}`,
              color: 'var(--text)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
              fontSize: 13,
              lineHeight: 1.2,
              maxWidth: '85%',
              overflowX: 'auto',
            }}
            dangerouslySetInnerHTML={{ __html: katexHtml }}
          />
        )}

        {/* Mafs Canvas Container */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            width: '100%',
            height: '100%',
            ['--mafs-bg' as any]: 'transparent',
            background: 'transparent',
          }}
        >
          {/* Màu trục/lưới/nhãn của Mafs lấy từ token theme (mặc định Mafs là chữ trắng + lưới xám đậm,
              mất tương phản ở theme sáng). --mafs-bg = nền thẻ chỉ dùng cho viền halo của nhãn số. */}
          <style>{`
            .MafsView {
              background: transparent !important;
              --mafs-bg: ${showCardBg ? 'var(--card-bg)' : 'transparent'} !important;
              --mafs-fg: var(--text-sub);
              --mafs-origin-color: var(--text-sub);
              --mafs-line-color: var(--chart-grid);
              --grid-line-subdivision-color: color-mix(in srgb, var(--chart-grid) 45%, transparent);
            }
          `}</style>
          <Mafs
            viewBox={{ x: domainX, y: domainY }}
            width={width}
            height={mafsHeight}
            pan={false}
            zoom={false}
          >
            {/* Hệ trục toạ độ Đề-các */}
            {data.showAxes !== false && (
              <Coordinates.Cartesian
                subdivisions={data.showGrid !== false ? 2 : 0}
                xAxis={{ lines: data.showGrid !== false ? 1 : false }}
                yAxis={{ lines: data.showGrid !== false ? 1 : false }}
              />
            )}

            {/* 3. Module 3: Polygons / Cột tích phân Riemann */}
            {riemannPolygons.map((pts, idx) => (
              <Polygon
                key={`riemann-${idx}`}
                points={pts}
                color={lineColor}
                weight={1}
                fillOpacity={0.25}
              />
            ))}

            {/* Các Polygons tuỳ chỉnh khác */}
            {data.polygons?.map((poly, idx) => (
              <Polygon
                key={`poly-${idx}`}
                points={poly.points}
                color={poly.strokeColor || lineColor}
                weight={poly.strokeWidth || 2}
                fillOpacity={poly.fillColor ? 0.3 : 0}
              />
            ))}

            {/* 4. Module 4: Circles (Đường tròn lượng giác & quỹ đạo) */}
            {data.circles?.map((circ, idx) => (
              <Circle
                key={`circ-${idx}`}
                center={circ.center}
                radius={circ.radius}
                color={circ.color || lineColor}
                weight={circ.dashed ? 1.5 : 2}
                fillOpacity={circ.fillColor ? 0.15 : 0}
                svgEllipseProps={circ.dashed ? { strokeDasharray: '4,4' } : undefined}
              />
            ))}

            {/* 5. Module 5: Ellipses (Phương trình Elip & Quỹ đạo Kepler) */}
            {data.ellipses?.map((elip, idx) => (
              <Ellipse
                key={`elip-${idx}`}
                center={elip.center}
                radius={elip.radius}
                angle={elip.angle || 0}
                color={elip.color || lineColor}
                weight={2}
                fillOpacity={elip.fillColor ? 0.2 : 0}
              />
            ))}

            {/* 6. Module 6: Plots — y = f(x, t) */}
            {data.expression && fnX && (
              <Plot.OfX y={evaluateY} color={lineColor} weight={data.lineWidth || 3} />
            )}

            {/* Module 6: Plots — x = f(y, t) */}
            {data.expressionY && fnY && (
              <Plot.OfY x={evaluateX} color="var(--chart-series-2)" weight={data.lineWidth || 3} />
            )}

            {/* Module 6: Parametric Plot — (x(tau), y(tau)) */}
            {paramX && paramY && (
              <Plot.Parametric
                xy={tau => [paramX(tau, timeSec), paramY(tau, timeSec)]}
                t={[-Math.PI * 2, Math.PI * 2]}
                color="var(--chart-series-3)"
                weight={data.lineWidth || 3}
              />
            )}

            {/* Module 6: Vector Field */}
            {vFieldFn && (
              <Plot.VectorField
                xy={pt => {
                  const val = vFieldFn(pt[0], pt[1], timeSec)
                  return [-pt[1] * 0.3 + val * 0.1, pt[0] * 0.3]
                }}
                step={0.8}
                color={lineColor}
              />
            )}

            {/* 2. Module 2: Tangent Line & Tiếp điểm */}
            {tangentData && (
              <>
                <Line.PointSlope
                  point={[tangentData.x0, tangentData.y0]}
                  slope={tangentData.slope}
                  color="var(--chart-negative)"
                  weight={2}
                />
                <Point x={tangentData.x0} y={tangentData.y0} color="var(--chart-negative)" />
                <Text
                  x={tangentData.x0}
                  y={tangentData.y0 + 0.35}
                  color="var(--text)"
                  size={12}
                  attach="n"
                >
                  {`k = ${tangentData.slope.toFixed(2)}`}
                </Text>
              </>
            )}

            {/* 8. Module 8: Vectors (Lực, Vận tốc, Bán kính) */}
            {data.vectors?.map((v, idx) => {
              const tailX = evalCoordExpr(v.tail[0], timeSec, 0)
              const tailY = evalCoordExpr(v.tail[1], timeSec, 0)
              const tipX = evalCoordExpr(v.tip[0], timeSec, 1)
              const tipY = evalCoordExpr(v.tip[1], timeSec, 1)
              return (
                <React.Fragment key={`vec-${idx}`}>
                  <Vector
                    tail={[tailX, tailY]}
                    tip={[tipX, tipY]}
                    color={v.color || 'var(--chart-series-2)'}
                    weight={2.5}
                  />
                  {v.label && (
                    <Text
                      x={(tailX + tipX) / 2}
                      y={(tailY + tipY) / 2 + 0.25}
                      color={v.color || 'var(--text)'}
                      size={11.5}
                    >
                      {v.label}
                    </Text>
                  )}
                </React.Fragment>
              )
            })}

            {/* 2. Module 2: Lines (Tiệm cận, Đoạn thẳng) */}
            {data.lines?.map((line, idx) => {
              if (line.p1 && line.p2) {
                return (
                  <Line.Segment
                    key={`line-${idx}`}
                    point1={line.p1}
                    point2={line.p2}
                    color={line.color || 'var(--chart-axis)'}
                    weight={line.dashed ? 1.5 : 2}
                    style={line.dashed ? 'dashed' : 'solid'}
                  />
                )
              }
              if (line.point && line.slope !== undefined) {
                const px = evalCoordExpr(line.point[0], timeSec)
                const py = evalCoordExpr(line.point[1], timeSec)
                const s = typeof line.slope === 'number' ? line.slope : evalCoordExpr(line.slope, timeSec)
                return (
                  <Line.PointSlope
                    key={`line-${idx}`}
                    point={[px, py]}
                    slope={s}
                    color={line.color || 'var(--chart-axis)'}
                    weight={line.dashed ? 1.5 : 2}
                    style={line.dashed ? 'dashed' : 'solid'}
                  />
                )
              }
              return null
            })}

            {/* 1. Module 1: Points (Điểm toạ độ động) */}
            {data.points?.map((pt, idx) => {
              const px = evalCoordExpr(pt.x, timeSec)
              const py = evalCoordExpr(pt.y, timeSec)
              return (
                <React.Fragment key={`pt-${idx}`}>
                  <Point x={px} y={py} color={pt.color || 'var(--accent)'} />
                  {pt.label && (
                    <Text x={px} y={py + 0.3} color={pt.color || 'var(--accent)'} size={12} attach="n">
                      {pt.label}
                    </Text>
                  )}
                </React.Fragment>
              )
            })}

            {/* 7. Module 7: Text Labels */}
            {data.labels?.map((lbl, idx) => {
              const lx = evalCoordExpr(lbl.x, timeSec)
              const ly = evalCoordExpr(lbl.y, timeSec)
              return (
                <Text key={`lbl-${idx}`} x={lx} y={ly} color={lbl.color || 'var(--text)'} size={12}>
                  {lbl.text}
                </Text>
              )
            })}

            {/* 9. Module 9: Images / Sprites bám toạ độ toán học */}
            {data.sprite && (
              <MafsImage
                href={data.sprite.url}
                x={evalCoordExpr(data.sprite.at[0], timeSec)}
                y={evalCoordExpr(data.sprite.at[1], timeSec)}
                width={data.sprite.width}
                height={data.sprite.height || data.sprite.width}
              />
            )}
          </Mafs>
        </div>
      </div>
    </RemotionElementWrapper>
  )
}
