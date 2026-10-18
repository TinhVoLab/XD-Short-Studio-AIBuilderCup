/**
 * Đo tương phản từ PIXEL ảnh render: giải mã PNG (RGBA/RGB 8-bit, không interlace — định dạng renderStill xuất ra)
 * bằng zlib của Node, rồi lấy màu nền thật phía sau một khung chữ.
 */
import { inflateSync } from 'zlib';

export function decodePng(buf) {
  let pos = 8;
  let width = 0, height = 0, channels = 4;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      const [depth, colorType, , , interlace] = data.subarray(8, 13);
      if (depth !== 8 || interlace !== 0 || ![2, 6].includes(colorType)) throw new Error(`PNG không hỗ trợ: depth ${depth}, colorType ${colorType}`);
      channels = colorType === 6 ? 4 : 3;
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const px = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? px[y * stride + x - channels] : 0;
      const b = y > 0 ? px[(y - 1) * stride + x] : 0;
      const c = x >= channels && y > 0 ? px[(y - 1) * stride + x - channels] : 0;
      let v = line[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) { const p = a + b - c; const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      px[y * stride + x] = v & 255;
    }
  }
  return { width, height, channels, px };
}

const lin = v => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
export const luminance = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
export const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);

/**
 * Tương phản của một khung chữ. Nền = cụm màu phổ biến nhất trong khung sau khi loại pixel gần màu chữ
 * (chữ chỉ phủ ~20–35% diện tích khung). fg null (chữ gradient) → màu chữ = pixel tương phản mạnh nhất với nền (p95).
 * Trả { ratio, bg, fg } hoặc null nếu khung nằm ngoài ảnh.
 */
export function measureRect(img, rect, fg) {
  const { width, height, channels, px } = img;
  const [x0, y0] = [Math.max(0, Math.floor(rect[0])), Math.max(0, Math.floor(rect[1]))];
  const [x1, y1] = [Math.min(width, Math.ceil(rect[0] + rect[2])), Math.min(height, Math.ceil(rect[1] + rect[3]))];
  if (x1 - x0 < 1 || y1 - y0 < 1) return null;
  const pixels = [];
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const i = (y * width + x) * channels;
    pixels.push([px[i], px[i + 1], px[i + 2]]);
  }
  const fgSolid = fg && fg[3] >= 0.999 ? fg : null;
  const away = fgSolid ? pixels.filter(p => dist(p, fgSolid) >= 90) : pixels;
  // Còn quá ít pixel khác màu chữ → nền gần trùng màu chữ (chính là ca tương phản kém): lấy mode trên mọi pixel
  const pool = away.length >= pixels.length * 0.3 ? away : pixels;
  const buckets = new Map();
  for (const p of pool) {
    const key = (p[0] >> 4) * 256 + (p[1] >> 4) * 16 + (p[2] >> 4);
    const b = buckets.get(key) || { n: 0, sum: [0, 0, 0] };
    b.n++; b.sum[0] += p[0]; b.sum[1] += p[1]; b.sum[2] += p[2];
    buckets.set(key, b);
  }
  const top = [...buckets.values()].sort((a, b) => b.n - a.n)[0];
  const bg = top.sum.map(v => v / top.n);
  let color;
  if (fg) {
    const a = fg[3];
    color = [0, 1, 2].map(i => fg[i] * a + bg[i] * (1 - a)); // chữ (có opacity) phủ lên nền thật
  } else {
    const sorted = pixels.map(p => ({ p, d: contrast(p, bg) })).sort((a, b) => a.d - b.d);
    color = sorted[Math.floor(sorted.length * 0.95)].p;
  }
  return { ratio: Math.round(contrast(color, bg) * 100) / 100, bg: bg.map(Math.round), fg: color.map(Math.round) };
}
