import * as fabric from 'fabric';
import { mixColors, type FabricThemeColors } from './colorUtils';

/**
 * Bộ dựng chữ / hộp dùng chung cho các renderer Fabric khớp box-model DOM của Remotion
 * (infographic, checklist, timeline, quote-box, code-terminal…).
 */

/** Hệ số chiều cao dòng nội tại của Fabric (fontSize × 1.13) */
export const FS_MULT = 1.13;
export const FONT = 'Be Vietnam Pro';

export type TextOpts = {
  left: number;
  top: number;
  size: number;
  weight?: number | string;
  fill: string;
  family?: string;
  originX?: 'left' | 'center' | 'right';
  /** px letter-spacing (CSS) */
  ls?: number;
  shadow?: fabric.Shadow;
  italic?: boolean;
  linethrough?: boolean;
};

const common = (o: TextOpts) => ({
  fontSize: o.size,
  fontWeight: String(o.weight ?? 400),
  fontStyle: o.italic ? 'italic' : 'normal',
  fill: o.fill,
  fontFamily: o.family || FONT,
  originX: o.originX || 'left',
  charSpacing: o.ls ? (o.ls / o.size) * 1000 : 0,
  linethrough: Boolean(o.linethrough),
  shadow: o.shadow,
  objectCaching: false,
  selectable: false,
  evented: false,
});

/** Chữ 1 dòng; `top` = tâm dọc của dòng CSS */
export function text(str: string, o: TextOpts): fabric.FabricText {
  return new fabric.FabricText(str, { ...common(o), left: o.left, top: o.top, originY: 'center' } as any);
}

/**
 * Đoạn chữ xuống dòng như CSS trong `width` px, dòng cao `lh` px; `top` = mép trên hộp dòng CSS đầu tiên.
 * Fabric giãn dòng = size × 1.13 × lineHeight → quy đổi để khoảng dòng = lh (half-leading như CSS).
 */
export function para(
  str: string,
  width: number,
  lh: number,
  o: TextOpts & { align?: 'left' | 'center' | 'right' },
): fabric.Textbox {
  return new fabric.Textbox(str, {
    ...common(o),
    left: o.left,
    top: o.top + (lh - o.size * FS_MULT) / 2,
    width: Math.max(8, width),
    lineHeight: lh / (o.size * FS_MULT),
    textAlign: o.align || 'left',
    originY: 'top',
    splitByGrapheme: false,
  } as any);
}

/** box-shadow var(--shadow-md) / var(--shadow-lg) theo theme */
export function themeShadow(tc: FabricThemeColors, level: 'md' | 'lg' = 'md') {
  if (level === 'lg') {
    return tc.isDark
      ? new fabric.Shadow({ color: 'rgba(0, 0, 0, 0.36)', blur: 28, offsetX: 0, offsetY: 12 })
      : new fabric.Shadow({ color: mixColors(tc.text, 10), blur: 24, offsetX: 0, offsetY: 8 });
  }
  return tc.isDark
    ? new fabric.Shadow({ color: 'rgba(0, 0, 0, 0.32)', blur: 16, offsetX: 0, offsetY: 6 })
    : new fabric.Shadow({ color: mixColors(tc.text, 8), blur: 12, offsetX: 0, offsetY: 4 });
}

/** Gradient ngang (px) trên object rộng w */
export function hGradient(w: number, stops: Array<[number, string]>) {
  return new fabric.Gradient({
    type: 'linear',
    gradientUnits: 'pixels',
    coords: { x1: 0, y1: 0, x2: w, y2: 0 },
    colorStops: stops.map(([offset, color]) => ({ offset, color })),
  });
}

/** Khung bao trong suốt (giữ đúng kích thước hộp DOM của element) */
export function boundsRect(w: number, h: number, top = 0) {
  return new fabric.Rect({
    left: 0, top, width: w, height: h,
    fill: 'transparent', strokeWidth: 0,
    originX: 'center', originY: 'top',
    selectable: false, evented: false,
  });
}

/**
 * Màu (hex hoặc đã resolve) pha alpha theo hậu tố hex cũ (`'44'` ≈ 27%) — khớp mixColor() phía Remotion.
 * Remotion đã bỏ lối nối hậu tố hex lên var() (CSS không hợp lệ → viền/glow bị mất), nên canvas luôn vẽ.
 */
export function cssHexAlpha(_raw: string | undefined, resolved: string, alphaHex: string): string {
  return mixColors(resolved, Math.round((parseInt(alphaHex, 16) * 100) / 255));
}

/**
 * Dời toàn bộ object lên `h/2` để nội dung (vẽ từ y = 0 → h) nằm cân quanh gốc nhóm: Group của factory
 * khi đó không phải dời con lúc layout → toạ độ con (hit-test, đo khung chữ) khớp vị trí vẽ ngay khi tạo.
 */
export function centerOnOrigin<T extends fabric.FabricObject>(objs: T[], h: number): T[] {
  for (const o of objs) o.set({ top: (o.top || 0) - h / 2 });
  return objs;
}
