import React, { useMemo } from 'react'
import { useCurrentFrame, interpolate, Easing } from 'remotion'
import { SceneElement } from '@/types/scene'
import { RemotionElementWrapper } from '../core/RemotionElementWrapper'
import { getViralFontFamily } from '../../fonts/fontCatalog'
import { layoutMasterScene } from '@/config/masterSceneLayout'
import { MASTER_TONE_CSS, MASTER_ICON_PATHS, MASTER_DIM_OPACITY } from '@/config/masterSceneStyle'

interface MasterSceneElementProps {
  el: SceneElement
  computedStyle?: React.CSSProperties
  positionStyle?: React.CSSProperties
  fps?: number
}

/** Đường cong chuyển động của thiết kế: cubic-bezier(.2, .8, .2, 1) */
const EASE = Easing.bezier(0.2, 0.8, 0.2, 1)

/**
 * Trạng thái chuyển động của một hộp tại thời điểm t (giây, tính từ lúc hộp bắt đầu).
 * Chỉ có pha vào; pha ra do chuyển cảnh của video đảm nhiệm.
 */
function motionStyle(anim: string | undefined, t: number, dur = 0.9): React.CSSProperties {
  const k = (a: number, b: number, from: number, to: number) =>
    interpolate(t, [a, b], [from, to], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE })
  switch (anim) {
    case 'pop': {
      const scale = t < 0.3 ? k(0, 0.3, 0.7, 1.06) : k(0.3, 0.48, 1.06, 1)
      return { opacity: k(0, 0.3, 0, 1), transform: `scale(${scale})` }
    }
    case 'up':
      return { opacity: k(0, 0.4, 0, 1), transform: `translateY(${k(0, 0.4, 22, 0)}px)` }
    case 'wpop': {
      const scale = t < 0.27 ? k(0, 0.27, 0.8, 1.08) : k(0.27, 0.41, 1.08, 1)
      return { opacity: k(0, 0.27, 0, 1), transform: `translateY(${k(0, 0.27, 14, 0)}px) scale(${scale})` }
    }
    case 'slam': {
      const scale = t < 0.36 ? k(0, 0.36, 2.2, 0.96) : k(0.36, 0.5, 0.96, 1)
      return { opacity: k(0, 0.36, 0, 1), transform: `scale(${scale})` }
    }
    case 'glow':
      return { opacity: k(0, 0.35, 0, 1) }
    // Thanh chạy từ trái sang (thanh bước, thanh tiến độ) trong `dur` giây
    case 'grow':
      return { transform: `scaleX(${k(0, dur, 0, 1)})`, transformOrigin: 'left center' }
    // Lựa chọn sai mờ đi khi đáp án hiện ra
    case 'dim':
      return { opacity: k(0, 0.3, 1, MASTER_DIM_OPACITY) }
    default:
      return {}
  }
}

/**
 * Element master-scene: vẽ đúng danh sách hộp của layoutMasterScene (SSOT, dùng chung với Fabric và chiều cao).
 * Màu theo token theme của cảnh (kể cả nền ngà / nền màu nhấn), không backdrop-filter / filter (AGENTS.md §7.1).
 */
export const MasterSceneElement: React.FC<MasterSceneElementProps> = ({ el, computedStyle, positionStyle, fps = 30 }) => {
  const frame = useCurrentFrame()
  const layout = useMemo(() => layoutMasterScene(el), [el.width, el.masterSceneData])
  const baseDelay = Number(el.animDelay) || 0

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      <div style={{ position: 'relative', width: layout.width, height: layout.height }}>
        {layout.items.map((it, i) => {
          const t = frame / fps - baseDelay - (it.delay || 0)
          const motion = motionStyle(it.anim, t, it.kind === 'rect' ? it.dur : undefined)
          // outAt: hộp tắt dần (chữ gốc dưới ô vừa sáng màu nhấn)
          if (it.outAt !== undefined) {
            const out = interpolate(frame / fps - baseDelay - it.outAt, [0, 0.3], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
            motion.opacity = (motion.opacity === undefined ? 1 : Number(motion.opacity)) * out
          }

          if (it.kind === 'rect') {
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: it.x,
                  top: it.y,
                  width: it.w,
                  height: it.h,
                  borderRadius: it.radius,
                  background: it.fill ? MASTER_TONE_CSS[it.fill] : 'transparent',
                  boxShadow: it.stroke ? `inset 0 0 0 ${it.strokeWidth || 1}px ${MASTER_TONE_CSS[it.stroke]}` : undefined,
                  transformOrigin: 'center',
                  ...motion,
                }}
              />
            )
          }


          if (it.kind === 'icon') {
            // Dấu trang: viền mực + phần màu nhấn tô dần từ dưới lên
            const fillProgress = it.anim === 'fill'
              ? interpolate(t, [0, 0.8], [100, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE })
              : 0
            const path = MASTER_ICON_PATHS[it.name]
            return (
              <div key={i} style={{ position: 'absolute', left: it.x, top: it.y, width: it.w, height: it.h, transformOrigin: 'center', ...motion }}>
                {it.name === 'bookmark' ? (
                  <>
                    <svg width={it.w} height={it.h} viewBox={path.viewBox} style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
                      <path d={path.d} fill="none" stroke={MASTER_TONE_CSS.text} strokeWidth={1.6} strokeLinejoin="round" />
                    </svg>
                    <svg width={it.w} height={it.h} viewBox={path.viewBox} style={{ position: 'absolute', inset: 0, clipPath: `inset(${fillProgress}% 0 0 0)` }} aria-hidden="true">
                      <path d={path.d} fill={MASTER_TONE_CSS[it.tone]} stroke={MASTER_TONE_CSS.text} strokeWidth={1.6} strokeLinejoin="round" />
                    </svg>
                  </>
                ) : (
                  <svg width={it.w} height={it.h} viewBox={path.viewBox} aria-hidden="true">
                    {path.stroke ? (
                      <path d={path.d} fill="none" stroke={MASTER_TONE_CSS[it.tone]} strokeWidth={path.stroke} strokeLinecap="round" strokeLinejoin="round" />
                    ) : (
                      <path d={path.d} fill={MASTER_TONE_CSS[it.tone]} />
                    )}
                  </svg>
                )}
              </div>
            )
          }

          // Chữ: dòng đã ngắt sẵn (whiteSpace pre) để video, canvas và công thức chiều cao cùng một cách xuống dòng
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: it.x,
                top: it.y,
                width: it.width,
                textAlign: it.align,
                fontFamily: getViralFontFamily(it.font.family),
                fontWeight: it.font.weight,
                fontSize: it.font.size,
                lineHeight: `${it.lineHeight}px`,
                letterSpacing: it.font.letterSpacing,
                whiteSpace: 'pre',
                transformOrigin: it.align === 'center' ? 'center' : it.align === 'right' ? 'right center' : 'left center',
                ...motion,
              }}
            >
              {it.lines.map((line: Array<{ text: string; tone: string }>, li: number) => (
                <div key={li} style={{ height: it.lineHeight }}>
                  {line.map((span, si) => (
                    <span key={si} style={{ color: MASTER_TONE_CSS[span.tone] }}>{span.text}</span>
                  ))}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </RemotionElementWrapper>
  )
}
