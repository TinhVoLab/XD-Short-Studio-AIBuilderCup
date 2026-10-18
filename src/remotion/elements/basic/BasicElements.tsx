import React from 'react';
import { Img } from 'remotion';
import { MissingMediaFallback } from '../core/MissingMediaFallback';
import { makeStar, makeTriangle, makePolygon, makeArrow, makeHeart } from '@remotion/shapes';
import { ElementProps } from '../types';
import { renderUniversalIcon } from '../../utils/icons';
import { calculateBadgeDimensions } from '@/config/layoutRegistry';
import { DEFAULT_NUMBERED_ITEMS } from '@/config/widgetDefaults';
import { getContrastTextColor } from '@/config/themePalettes';
import { mixColor } from '../../utils/rich-text-parser';

export type { ElementProps };

/**
 * 1. Văn bản cơ bản (Hỗ trợ chống rớt chữ cuối dòng & ngắt dòng an toàn)
 */
export const TextElement: React.FC<ElementProps> = ({ el, computedStyle, content }) => {
  let safeContent = content || el.content || '';
  if (typeof safeContent === 'string' && safeContent) {
    safeContent = safeContent.split('\n').map(line => {
      const words = line.trim().split(/\s+/);
      if (words.length >= 4) {
        return line.replace(/ ([^ ]+)$/, '\u00A0$1'); // Chống rớt chữ đơn độc lập
      }
      return line;
    }).join('\n');
  }

  const hasGradient = !!(el.textGradientFrom && el.textGradientTo);
  const hasBg = !!el.textBgColor;

  // nowrap CHỈ khi thật sự là 1 từ đơn (không có dấu cách, không có newline).
  // Tiêu đề lớn nhiều từ ("CHUẨN NGAY") phải được phép wrap để không bị clip khi render 1080px.
  const isSingleWord = typeof safeContent === 'string'
    && !safeContent.includes(' ')
    && !safeContent.includes('\n');

  if (hasBg && hasGradient) {
    return (
      <div
        style={{
          ...computedStyle,
          width: isSingleWord ? 'max-content' : computedStyle?.width,
          maxWidth: 960,
          whiteSpace: isSingleWord ? 'nowrap' : 'pre-wrap',
          wordBreak: isSingleWord ? 'normal' : 'break-word',
          overflowWrap: isSingleWord ? 'normal' : 'break-word',
          hyphens: 'none',
          background: el.textBgColor,
          padding: `${el.textBgPadding ?? 6}px ${(el.textBgPadding ?? 6) * 1.5}px`,
          borderRadius: `${el.textBgRadius ?? 6}px`,
        }}
      >
        <span
          style={{
            background: `linear-gradient(${el.textGradientAngle ?? 135}deg, ${el.textGradientFrom}, ${el.textGradientTo})`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block',
          }}
        >
          {safeContent}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        ...computedStyle,
        width: isSingleWord ? 'max-content' : computedStyle?.width,
        maxWidth: 960, // đủ rộng cho render 1080px, không bao giờ clip
        whiteSpace: isSingleWord ? 'nowrap' : 'pre-wrap',
        wordBreak: isSingleWord ? 'normal' : 'break-word',
        overflowWrap: isSingleWord ? 'normal' : 'break-word',
        hyphens: 'none',
        // Gradient text hoặc Text Background Box
        background: hasGradient
          ? `linear-gradient(${el.textGradientAngle ?? 135}deg, ${el.textGradientFrom}, ${el.textGradientTo})`
          : (hasBg ? el.textBgColor : computedStyle?.background),
        // BẮT BUỘC: cặp 3 property này cùng nhau để gradient clip vào ký tự chữ
        WebkitBackgroundClip: hasGradient ? 'text' : undefined,
        backgroundClip:       hasGradient ? 'text' : undefined,
        WebkitTextFillColor:  hasGradient ? 'transparent' : undefined,
        padding: hasBg
          ? `${el.textBgPadding ?? 6}px ${(el.textBgPadding ?? 6) * 1.5}px`
          : undefined,
        borderRadius: hasBg ? `${el.textBgRadius ?? 6}px` : undefined,
      }}
    >
      {safeContent}
    </div>
  );
};

import { RemotionElementWrapper } from '../core/RemotionElementWrapper';

/**
 * 2. Hình ảnh (Image Layer 3.0: Living 3D Asset với Floating Physics, Glow Aura & Laser Scanner)
 */
export const ImageElement: React.FC<ElementProps & { frame?: number; fps?: number; delayFrames?: number; durFrames?: number }> = ({
  el,
  computedStyle,
  positionStyle,
  frame = 0,
  delayFrames = 0,
}) => {
  const [hasError, setHasError] = React.useState(false);

  // URL hỏng (assetMissing do render worker đánh dấu), lỗi tải hoặc chưa chọn ảnh → ô dự phòng theo theme
  if (!el.src || hasError || (el as any).assetMissing) {
    return (
      <MissingMediaFallback
        kind="image"
        style={computedStyle}
        width={el.width || 120}
        height={el.height || 120}
        radius={el.borderRadius ?? 8}
      />
    );
  }

  const w = el.width || 140;
  const h = el.height || 140;
  const accent = el.accentColor || el.borderColor || '#BEFF01';
  const isHeroImage = w >= 130;
  const isFloating = el.isFloating ?? isHeroImage;
  const hasGlow = el.hasGlow ?? isHeroImage;
  const hasScanner = (el as any).hasScanner ?? false;

  // 1. Floating Animation (nhịp thở bồng bềnh không trọng lực)
  const floatY = isFloating ? Math.sin((frame - delayFrames) * 0.08) * 6 : 0;
  const breathingScale = isFloating ? 1 + Math.sin((frame - delayFrames) * 0.06) * 0.025 : 1;

  // 2. Multi-layered glow filter
  const hasBorder = (el.borderWidth ?? 0) > 0;
  const shadowBlur = el.imageShadowBlur ?? (hasGlow ? 18 : 0);
  const shadowColor = el.imageShadowColor || accent;

  const filterGlow = shadowBlur > 0
    ? `drop-shadow(0 0 ${shadowBlur}px ${mixColor(shadowColor, 53)}) drop-shadow(0 0 ${Math.round(shadowBlur * 1.8)}px ${mixColor(shadowColor, 27)})`
    : undefined;

  // 3. Laser Scanner Animation
  const scanProgress = hasScanner ? (Math.sin((frame - delayFrames) * 0.08) + 1) / 2 : 0;

  const content = (
    <div
      style={{
        position: 'relative',
        width: w,
        height: h,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `translateY(${floatY.toFixed(2)}px) scale(${breathingScale.toFixed(3)})`,
        transformOrigin: 'center center',
      }}
    >
      {/* Radial Glow Aura Background (GPU-Optimized Multi-Stop, 0ms blur overhead) */}
      {hasGlow && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: w * 1.35,
            height: h * 1.35,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${mixColor(shadowColor, 27)} 0%, ${mixColor(shadowColor, 9)} 45%, transparent 72%)`,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}

      {/* Main Image */}
      <Img
        src={el.src}
        style={{
          width: w,
          height: h,
          objectFit: el.objectFit || 'contain',
          borderRadius: el.borderRadius ? `${el.borderRadius}px` : undefined,
          border: hasBorder ? `${el.borderWidth}px solid ${el.borderColor || accent}` : undefined,
          filter: filterGlow,
          mixBlendMode: (el.blendMode as any) || 'normal',
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 1,
        }}
        onError={() => setHasError(true)}
      />

      {/* Cyber HUD Corner Reticles [ ] & Laser Scan */}
      {hasScanner && (
        <div
          style={{
            position: 'absolute',
            inset: -8,
            border: `1px solid ${mixColor(accent, 20)}`,
            borderRadius: 8,
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          {/* 4 Tech Corner Brackets */}
          <div style={{ position: 'absolute', top: -1, left: -1, width: 8, height: 8, borderTop: `2px solid ${accent}`, borderLeft: `2px solid ${accent}` }} />
          <div style={{ position: 'absolute', top: -1, right: -1, width: 8, height: 8, borderTop: `2px solid ${accent}`, borderRight: `2px solid ${accent}` }} />
          <div style={{ position: 'absolute', bottom: -1, left: -1, width: 8, height: 8, borderBottom: `2px solid ${accent}`, borderLeft: `2px solid ${accent}` }} />
          <div style={{ position: 'absolute', bottom: -1, right: -1, width: 8, height: 8, borderBottom: `2px solid ${accent}`, borderRight: `2px solid ${accent}` }} />
          
          {/* Laser Scanning Line */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${(scanProgress * 100).toFixed(1)}%`,
              height: 2,
              background: `linear-gradient(90deg, transparent 0%, ${accent} 50%, transparent 100%)`,
              boxShadow: `0 0 10px ${accent}`,
            }}
          />
        </div>
      )}
    </div>
  );

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      {content}
    </RemotionElementWrapper>
  );
};

/**
 * 3. Hình khối Vector & SVG Toán học
 */
export const ShapeElement: React.FC<ElementProps> = ({ el, computedStyle }) => {
  const w = el.width || 44;
  const h = el.height || 44;
  const fill = el.fill === 'none' || el.fill === 'transparent' ? 'none' : (el.fill || 'transparent');
  const stroke = el.stroke || el.accentColor || '#BEFF01';
  const strokeWidth = el.strokeWidth || 2;
  const borderRadius = el.radius ?? (el as any).borderRadius ?? (el.shapeType === 'circle' ? '50%' : 8);

  let pathD = el.svgContent;

  if (!pathD && el.shapeType) {
    try {
      if (el.shapeType === 'star') {
        const star = makeStar({ points: 5, innerRadius: Math.min(w, h) * 0.22, outerRadius: Math.min(w, h) * 0.48 });
        pathD = star.path;
      } else if (el.shapeType === 'triangle') {
        const tri = makeTriangle({ length: Math.min(w, h), direction: 'up' });
        pathD = tri.path;
      } else if (el.shapeType === 'polygon' || el.shapeType === 'hexagon') {
        const poly = makePolygon({ points: 6, radius: Math.min(w, h) * 0.48 });
        pathD = poly.path;
      } else if (el.shapeType === 'arrow') {
        const arrow = makeArrow({ length: Math.min(w, h) * 0.9 });
        pathD = arrow.path;
      } else if (el.shapeType === 'heart') {
        const heart = makeHeart({ height: Math.min(w, h) * 0.9 });
        pathD = heart.path;
      }
    } catch {
      // Fallback nếu tính toán hình học gặp lỗi
    }
  }

  if (pathD) {
    return (
      <svg
        style={{ ...computedStyle, width: w, height: h, overflow: 'visible' }}
        viewBox={`0 0 ${w} ${h}`}
      >
        <path d={pathD} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      </svg>
    );
  }

  return (
    <div
      style={{
        ...computedStyle,
        width: w,
        height: h,
        borderRadius,
        backgroundColor: fill !== 'none' ? fill : undefined,
        border: `${strokeWidth}px solid ${stroke}`,
        boxSizing: 'border-box',
      }}
    />
  );
};

/**
 * 4. Khung chữ nhật nền
 */
export const RectElement: React.FC<ElementProps> = ({ el, computedStyle }) => {
  const radius = el.radius ?? (el as any).borderRadius ?? 8;
  return (
    <div style={{
      ...computedStyle,
      width: el.width,
      height: el.height,
      backgroundColor: el.fill || el.bgColor || 'rgba(255,255,255,0.06)',
      borderRadius: radius,
      border: el.stroke ? `${el.strokeWidth || 1}px solid ${el.stroke}` : undefined,
    }} />
  );
};

/**
 * 5. Đường kẻ chỉ line
 */
export const LineElement: React.FC<ElementProps> = ({ el, computedStyle }) => (
  <div style={{
    ...computedStyle,
    width: el.width || 100,
    height: el.strokeWidth || el.lineWidth || 2,
    backgroundColor: el.stroke || el.accentColor || '#BEFF01',
    borderRadius: 1,
  }} />
);

/**
 * 6. Vạch kẻ phân cách mờ
 */
export const DividerElement: React.FC<ElementProps> = ({ el, computedStyle }) => (
  <div style={{
    ...computedStyle,
    width: el.width || '100%',
    height: 1,
    backgroundColor: el.color || 'rgba(255,255,255,0.1)',
  }} />
);

/**
 * 7. Huy hiệu Pill Badge (Dynamic Box-Model & Perfect Center Alignment)
 */
export const BadgeElement: React.FC<ElementProps> = ({ el, computedStyle, content }) => {
  const dims = calculateBadgeDimensions(el);
  const strokeColor = el.stroke || el.accentColor || el.color || 'var(--accent, #BEFF01)';
  const hasBorder = Boolean(el.stroke || el.accentColor || (el.bgColor && el.bgColor.startsWith('rgba')));
  const borderWidth = el.strokeWidth !== undefined ? el.strokeWidth : (hasBorder ? 1 : 0);
  const textAlign = el.textAlign || 'center';
  const justifyContent = textAlign === 'left' ? 'flex-start' : (textAlign === 'right' ? 'flex-end' : 'center');

  return (
    <div style={{
      ...computedStyle,
      boxSizing: 'border-box',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent,
      textAlign,
      width: el.width || 'auto',
      minWidth: dims.autoW,
      height: el.height || dims.autoH,
      padding: '0 12px',
      borderRadius: dims.radius,
      backgroundColor: el.bgColor || 'var(--surface, rgba(190,255,1,0.15))',
      border: borderWidth > 0 ? `${borderWidth}px solid ${strokeColor}` : 'none',
      fontSize: el.fontSize || 12,
      fontWeight: el.fontWeight || 700,
      color: el.color || el.accentColor || 'var(--on-surface, #BEFF01)',
      fontFamily: el.fontFamily || 'Be Vietnam Pro',
      whiteSpace: 'nowrap',
      lineHeight: 1,
    }}>
      {content || el.content}
    </div>
  );
};

/**
 * 8. Thanh tiến trình
 */
export const ProgressElement: React.FC<ElementProps> = ({ el, computedStyle }) => {
  const val = typeof el.percent === 'number' ? el.percent : (typeof (el as any).progressValue === 'number' ? (el as any).progressValue : 75);
  return (
    <div style={{
      ...computedStyle,
      width: el.width || 200,
      height: el.height || 6,
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderRadius: 3,
      overflow: 'hidden',
    }}>
      <div style={{
        width: `${Math.min(100, Math.max(0, val))}%`,
        height: '100%',
        backgroundColor: el.accentColor || '#BEFF01',
        borderRadius: 3,
      }} />
    </div>
  );
};

/**
 * 9. Danh sách đánh số thứ tự
 */
export const NumberedListElement: React.FC<ElementProps> = ({ el, computedStyle }) => {
  const items: string[] = el.items || (el as any).listItems || DEFAULT_NUMBERED_ITEMS;
  const accent = el.accentColor || 'var(--accent, #BEFF01)';
  const w = el.width || 312;
  return (
    <div
      style={{
        ...computedStyle,
        width: w,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        boxSizing: 'border-box',
      }}
    >
      {items.map((item: string, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', boxSizing: 'border-box' }}>
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              backgroundColor: accent,
              color: el.accentColor ? getContrastTextColor(el.accentColor) : 'var(--on-accent, #000000)',
              fontSize: 11.5,
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: `0 0 10px ${mixColor(accent, 33)}`,
            }}
          >
            {i + 1}
          </span>
          <span
            style={{
              fontSize: el.fontSize || 14,
              color: el.color || 'var(--text, #FFFFFF)',
              fontWeight: 600,
              fontFamily: el.fontFamily || 'Be Vietnam Pro',
              flex: 1,
              wordBreak: 'break-word',
              lineHeight: 1.3,
            }}
          >
            {item}
          </span>
        </div>
      ))}
    </div>
  );
};

/**
 * 10. Hộp điểm nhấn kính mờ (Re-export từ module chuyên biệt)
 */
export { HighlightBoxElement } from './HighlightBoxElement';

/**
 * 11. Văn bản có kèm Icon
 */
export const IconTextElement: React.FC<ElementProps> = ({ el, computedStyle, content }) => {
  const accent = el.accentColor || el.color || 'var(--accent, #BEFF01)';
  const iconSize = (el.fontSize || 16) * 1.25;

  return (
    <div style={{ ...computedStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
      {el.icon && (
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {renderUniversalIcon(el.icon, accent, iconSize)}
        </span>
      )}
      <span style={{ fontSize: el.fontSize || 16, color: el.color || 'var(--text, #FFFFFF)', fontWeight: 600, fontFamily: el.fontFamily || 'Be Vietnam Pro' }}>
        {content || el.content}
      </span>
    </div>
  );
};
