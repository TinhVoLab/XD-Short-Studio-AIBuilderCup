/**
 * ── Dynamic Harmonic Brand Palette Generator ──────────────────────
 * Tự động tạo dải màu hài hòa (Harmonic Palette) dựa trên màu thương hiệu (Brand Color)
 * của dự án, đảm bảo độ rực rỡ và tương phản tối ưu trên nền tối Studio NLE (Dark Mode).
 */

interface HSL {
  h: number // 0 - 360
  s: number // 0 - 100
  l: number // 0 - 100
}

/**
 * Chuyển đổi mã Hex sang HSL
 */
export function hexToHsl(hex: string): HSL {
  let c = hex.replace('#', '').trim()
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('')
  }
  const num = parseInt(c, 16)
  if (isNaN(num) || c.length !== 6) {
    return { h: 74, s: 100, l: 50 } // Fallback Neon Lime #BEFF01
  }

  const r = (num >> 16) / 255
  const g = ((num >> 8) & 0xff) / 255
  const b = (num & 0xff) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h = Math.round(h * 60)
  }

  return {
    h,
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  }
}

/**
 * Chuyển đổi HSL sang mã màu Hex
 */
export function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360
  s = Math.max(0, Math.min(100, s)) / 100
  l = Math.max(0, Math.min(100, l)) / 100

  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2

  let r = 0, g = 0, b = 0
  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c
  } else {
    r = c; g = 0; b = x
  }

  const toHex = (val: number) => {
    const hex = Math.round((val + m) * 255).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
}

/**
 * Tự động sinh dải N màu hài hòa dựa trên mã màu Brand Hex
 * Đảm bảo:
 * - Màu 1: Chính là baseBrandHex gốc (nhận diện thương hiệu).
 * - Các màu sau: Chuyển sắc hài hòa (Golden Ratio / Hue offset), tinh chỉnh Lightness & Saturation để tương phản cực cao trên nền đen.
 */
export function generateHarmonicPalette(baseBrandHex: string, count: number = 4): string[] {
  if (!baseBrandHex || typeof baseBrandHex !== 'string') {
    return ['#BEFF01', '#00D4FF', '#FFB800', '#00FF88', '#FF4D88'].slice(0, count)
  }

  const cleanHex = baseBrandHex.trim()
  const baseHsl = hexToHsl(cleanHex)
  const palette: string[] = [cleanHex]

  // Góc xoay màu tối ưu (Golden Ratio Angle ~ 137.5° hoặc Step ~ 35°)
  const angleStep = count <= 3 ? 40 : 360 / Math.max(count, 5)

  for (let i = 1; i < count; i++) {
    const nextHue = (baseHsl.h + i * angleStep) % 360
    // Đảm bảo saturation luôn tươi tắn (80-95%) và lightness vừa đủ đọc (52-62%)
    const sat = Math.max(75, Math.min(95, baseHsl.s))
    const light = Math.max(50, Math.min(64, baseHsl.l > 75 ? 58 : (baseHsl.l < 35 ? 55 : baseHsl.l)))
    palette.push(hslToHex(nextHue, sat, light))
  }

  return palette
}
