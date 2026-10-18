import * as fabric from 'fabric';
import React from 'react';
import { getVectorIconSvg } from '@/remotion/utils/icons';

/**
 * Icon vector của video (getVectorIconSvg — cùng bảng renderUniversalIcon của Remotion) dựng thành Fabric Path,
 * đồng bộ: đọc cây React <svg> (path / circle / line / polyline / polygon / rect) và đổi mỗi nút thành path d.
 * Fabric đặt path theo tâm khung bao riêng (pathOffset) → dời tâm về đúng vị trí trong viewBox 24×24.
 */
type Shape = { type: string; props: Record<string, any> };

function flatten(children: any, out: Shape[]) {
  React.Children.forEach(children, (c: any) => {
    if (!c || typeof c !== 'object') return;
    if (c.type === React.Fragment || c.type === 'g') flatten(c.props.children, out);
    else if (typeof c.type === 'string' && c.type !== 'defs') out.push({ type: c.type, props: c.props });
  });
}

const pts = (s: string) => String(s).trim().split(/[\s,]+/).map(Number);

function toPathD({ type, props: p }: Shape): string | null {
  const n = (k: string) => Number(p[k] || 0);
  switch (type) {
    case 'path': return p.d || null;
    case 'line': return `M ${n('x1')} ${n('y1')} L ${n('x2')} ${n('y2')}`;
    case 'circle': {
      const [cx, cy, r] = [n('cx'), n('cy'), n('r')];
      return `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
    }
    case 'ellipse': {
      const [cx, cy, rx, ry] = [n('cx'), n('cy'), n('rx'), n('ry')];
      return `M ${cx - rx} ${cy} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;
    }
    case 'polyline':
    case 'polygon': {
      const a = pts(p.points);
      let d = '';
      for (let i = 0; i + 1 < a.length; i += 2) d += `${i ? 'L' : 'M'} ${a[i]} ${a[i + 1]} `;
      return type === 'polygon' ? `${d}Z` : d;
    }
    case 'rect': {
      const [x, y, w, h] = [n('x'), n('y'), n('width'), n('height')];
      const r = Math.min(n('rx') || n('ry'), w / 2, h / 2);
      if (!r) return `M ${x} ${y} H ${x + w} V ${y + h} H ${x} Z`;
      return `M ${x + r} ${y} H ${x + w - r} A ${r} ${r} 0 0 1 ${x + w} ${y + r} V ${y + h - r} A ${r} ${r} 0 0 1 ${x + w - r} ${y + h} H ${x + r} A ${r} ${r} 0 0 1 ${x} ${y + h - r} V ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y} Z`;
    }
    default: return null;
  }
}

/** Có icon vector cho tên/emoji này không (cùng điều kiện renderUniversalIcon) */
export const hasVectorIcon = (name?: string) => Boolean(name && getVectorIconSvg(String(name), '#000', 24));

/**
 * Icon `name` cỡ `size` px, tâm tại (cx, cy). Tên lạ → `fallback` (mặc định sparkle, như renderUniversalIcon).
 * Trả mảng object để thêm thẳng vào nhóm của widget.
 */
export function buildFabricIcon(
  name: string | undefined,
  color: string,
  size: number,
  cx: number,
  cy: number,
  fallback = 'sparkle',
): fabric.Object[] {
  const svg = getVectorIconSvg(String(name || ''), color, size) || getVectorIconSvg(fallback, color, size);
  if (!svg) return [];
  const root = (svg as any).props || {};
  const shapes: Shape[] = [];
  flatten(root.children, shapes);
  const scale = size / 24;
  const out: fabric.Object[] = [];
  for (const s of shapes) {
    const d = toPathD(s);
    if (!d) continue;
    const p = { ...root, ...s.props };
    const fill = p.fill && p.fill !== 'none' ? p.fill : '';
    const stroke = p.stroke && p.stroke !== 'none' ? p.stroke : '';
    const sw = Number(p.strokeWidth ?? 0) || 0;
    const path = new fabric.Path(d, {
      originX: 'center',
      originY: 'center',
      scaleX: scale,
      scaleY: scale,
      fill: fill || 'transparent',
      stroke: stroke || undefined,
      strokeWidth: stroke ? sw : 0,
      strokeLineCap: p.strokeLinecap || 'round',
      strokeLineJoin: p.strokeLinejoin || 'round',
      objectCaching: false,
      selectable: false,
      evented: false,
    } as any);
    const off = (path as any).pathOffset as { x: number; y: number };
    path.set({ left: cx + (off.x - 12) * scale, top: cy + (off.y - 12) * scale });
    out.push(path);
  }
  return out;
}
