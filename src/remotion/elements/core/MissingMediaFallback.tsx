import React from 'react'
import { getRemotionEnvironment } from 'remotion'

interface MissingMediaFallbackProps {
  style?: React.CSSProperties
  width: number
  height: number
  radius: number
  kind: 'image' | 'video'
}

/**
 * Bản dự phòng khi ảnh/video thiếu hoặc hỏng (URL 404, chưa chọn file): ô gradient theo màu theme,
 * không viền đứt, không chữ lỗi trong video xuất ra. Dòng gợi ý chỉ hiện ở trình xem của Studio.
 */
export const MissingMediaFallback: React.FC<MissingMediaFallbackProps> = ({ style, width, height, radius, kind }) => {
  const showHint = !getRemotionEnvironment().isRendering
  return (
    <div
      style={{
        ...style,
        width,
        height,
        borderRadius: radius,
        overflow: 'hidden',
        position: 'relative',
        boxSizing: 'border-box',
        background:
          'linear-gradient(135deg, color-mix(in srgb, var(--accent) 26%, var(--card-bg)) 0%, var(--card-bg) 55%, color-mix(in srgb, var(--accent) 12%, var(--card-bg)) 100%)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {/* Vệt sáng chéo nhẹ để ô không phẳng */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(115deg, transparent 35%, color-mix(in srgb, var(--text) 7%, transparent) 50%, transparent 65%)',
        }}
      />
      {showHint && (
        <span
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 8,
            textAlign: 'center',
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--text-sub)',
          }}
        >
          {kind === 'video' ? 'Chưa có video' : 'Chưa có ảnh'}
        </span>
      )}
    </div>
  )
}
