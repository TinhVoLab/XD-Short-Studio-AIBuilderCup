import * as fabric from 'fabric';
import { SceneElement } from '@/types/scene';
import { getFabricThemeColors } from './widgets/colorUtils';
import { isLegacyDarkTextColor } from '@/config/themePalettes';

export function buildTextFabricProps(el: SceneElement) {
  if (el.type !== 'text' && el.type !== 'caption') return {};
  const hasStroke = Boolean(el.textStroke && (el.textStrokeWidth ?? 0) > 0);

  let shadowObj: fabric.Shadow | null = null;
  if (hasStroke) {
    shadowObj = new fabric.Shadow({
      color: el.textStroke || '#000000',
      blur: Math.min(6, Math.max(2, (el.textStrokeWidth || 1.5) * 2)),
      offsetX: 0,
      offsetY: 0,
    });
  } else if (el.shadowColor && (el.shadowBlur ?? 8) > 0) {
    // Khớp Remotion: tắt trong Inspector = nhoè 0 (màu vẫn giữ) → không vẽ bóng
    shadowObj = new fabric.Shadow({
      color: el.shadowColor,
      blur: el.shadowBlur ?? 8,
      offsetX: 0,
      offsetY: 0,
    });
  } else if (el.shadow) {
    shadowObj = new fabric.Shadow({ color: 'rgba(0,0,0,0.6)', blur: 12 });
  }

  return {
    charSpacing: (el.letterSpacing ?? 0) * 10,
    lineHeight: el.lineHeight ?? 1.15,
    stroke: undefined,
    strokeWidth: 0,
    shadow: shadowObj,
    backgroundColor: el.textBgColor || undefined,
  };
}

/**
 * Clean up text content to prevent single-word widows on long lines
 */
export function formatSafeContent(content?: string): string {
  if (!content) return '';
  return content
    .split('\n')
    .map((line) => {
      const words = line.trim().split(/\s+/);
      if (words.length >= 4) {
        return line.replace(/ ([^ ]+)$/, '\u00A0$1');
      }
      return line;
    })
    .join('\n');
}

export function resolveTextColor(color?: string, el?: SceneElement): string {
  if (color && !isLegacyDarkTextColor(color)) {
    return color;
  }
  if (el) {
    const themeColors = getFabricThemeColors(el);
    return themeColors.text;
  }
  return '#FFFFFF';
}

/**
 * Resolve text fill: support dynamic linear gradient or solid fallback for Fabric.js
 */
export function resolveTextFill(
  el: SceneElement,
  targetWidth = 320,
  targetHeight = 60
): string | fabric.Gradient<'linear'> {
  if (el.textGradientFrom && el.textGradientTo) {
    const angle = el.textGradientAngle ?? 135;
    const rad = ((angle - 90) * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const hw = Math.max(20, targetWidth / 2);
    const hh = Math.max(20, targetHeight / 2);

    return new fabric.Gradient({
      type: 'linear',
      coords: {
        x1: -cos * hw,
        y1: -sin * hh,
        x2: cos * hw,
        y2: sin * hh,
      },
      colorStops: [
        { offset: 0, color: el.textGradientFrom },
        { offset: 1, color: el.textGradientTo },
      ],
    });
  }

  return resolveTextColor(el.color, el);
}

export function resolveFontWeight(fontFamily?: string, fontWeight?: string | number): string | number {
  if (
    (fontFamily === 'Be Vietnam Pro' || fontFamily === 'Poppins') &&
    (!fontWeight || fontWeight === 400 || fontWeight === '400')
  ) {
    return '800';
  }
  return fontWeight || '700';
}

export function createTextObject(el: SceneElement): fabric.Textbox {
  const safeContent = formatSafeContent(el.content);
  const originX = el.textAlign === 'center' ? 'center' : el.textAlign === 'right' ? 'right' : 'left';
  const w = el.width || 320;
  const h = (el.fontSize || 24) * (el.lineHeight || 1.15) * 2;

  return new fabric.Textbox(safeContent, {
    id: el.id,
    left: el.left,
    top: el.top,
    width: w,
    scaleX: el.scaleX || 1,
    scaleY: el.scaleY || 1,
    angle: el.angle || 0,
    opacity: el.opacity ?? 1,
    fill: resolveTextFill(el, w, h),
    fontSize: el.fontSize || 24,
    fontFamily: el.fontFamily || 'Inter',
    fontWeight: resolveFontWeight(el.fontFamily, el.fontWeight) as any,
    originX,
    originY: 'top',
    textAlign: el.textAlign || 'left',
    splitByGrapheme: false,
    ...buildTextFabricProps(el),
  } as any);
}

export function updateTextObject(obj: fabric.IText | fabric.Textbox, el: SceneElement): void {
  const safeContent = formatSafeContent(el.content);
  const w = obj.width || el.width || 320;
  const h = obj.height || (el.fontSize || 24) * 2;

  obj.set({
    text: safeContent,
    fill: resolveTextFill(el, w, h),
    fontSize: el.fontSize || 24,
    fontFamily: el.fontFamily || 'Inter',
    fontWeight: resolveFontWeight(el.fontFamily, el.fontWeight) as any,
    width: el.width || 320,
    textAlign: el.textAlign || 'left',
    splitByGrapheme: false,
    ...buildTextFabricProps(el),
  } as any);

  obj.dirty = true;
}
