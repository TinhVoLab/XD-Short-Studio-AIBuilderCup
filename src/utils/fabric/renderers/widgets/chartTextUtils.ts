import * as fabric from 'fabric';

/**
 * Đo chữ cho các renderer biểu đồ Fabric — để bố cục (pill co theo nội dung, cắt "…") khớp flex/ellipsis của Remotion
 * thay vì ước lượng số ký tự.
 */
export function measureTextWidth(text: string, fontSize: number, fontWeight: string | number = '400', fontFamily = 'Inter'): number {
  if (!text) return 0;
  const t = new fabric.Text(text, { fontSize, fontWeight: String(fontWeight), fontFamily } as any);
  return t.width || 0;
}

/** = `white-space: nowrap; overflow: hidden; text-overflow: ellipsis` trong maxW px */
export function ellipsizeToWidth(text: string, maxW: number, fontSize: number, fontWeight: string | number = '400', fontFamily = 'Inter'): string {
  if (measureTextWidth(text, fontSize, fontWeight, fontFamily) <= maxW) return text;
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (measureTextWidth(text.slice(0, mid).trimEnd() + '…', fontSize, fontWeight, fontFamily) <= maxW) lo = mid;
    else hi = mid - 1;
  }
  return lo > 0 ? text.slice(0, lo).trimEnd() + '…' : '…';
}
