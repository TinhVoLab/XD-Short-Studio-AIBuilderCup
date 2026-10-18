import assert from 'assert/strict'
import { THEME_PALETTES, SURFACE_VARIANTS, resolveThemePalette, contrastRatio, getContrastTextColor } from '@/config/themePalettes'
import { getPaletteCssVariables } from '@/utils/themeResolver'

/**
 * Khoá tương phản WCAG 2.1 cho mọi bảng màu chủ đề cảnh, đo trên đúng CSS vars mà video dùng.
 * Chữ ≥ 4.5:1 (AA), chữ meta & đồ hoạ (cột, series, đường) ≥ 3:1.
 */

const TEXT = 4.5
const GRAPHIC = 3

function parse(c: string): [number, number, number, number] {
  if (c.startsWith('#')) {
    const h = c.slice(1)
    return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)).concat(1) as any
  }
  const m = c.match(/rgba?\(([^)]+)\)/)
  if (!m) throw new Error(`Không đọc được màu: ${c}`)
  const p = m[1].split(',').map(s => parseFloat(s))
  return [p[0], p[1], p[2], p[3] ?? 1]
}

/** Phủ màu (có alpha) lên nền đặc → hex đặc */
function over(fg: string, bg: string): string {
  const [r, g, b, a] = parse(fg)
  const [R, G, B] = parse(bg)
  const mix = (x: number, y: number) => Math.round(x * a + y * (1 - a)).toString(16).padStart(2, '0')
  return `#${mix(r, R)}${mix(g, G)}${mix(b, B)}`
}

const failures: string[] = []
function check(palette: string, label: string, fg: string, bg: string, min: number) {
  const ratio = contrastRatio(over(fg, bg), bg)
  if (ratio < min) failures.push(`${palette}: ${label} = ${ratio.toFixed(2)} (cần ${min})`)
}

// Mọi palette + biến thể nền ngà / nền màu nhấn của nó (thư viện cảnh Master)
const ALL_PALETTES = Object.values(THEME_PALETTES).flatMap(p => [p, ...SURFACE_VARIANTS.map(v => resolveThemePalette(`${p.id}@${v}`))])

for (const pal of ALL_PALETTES) {
  const v = getPaletteCssVariables(pal.id)
  const t = pal.tokens
  const bg = t.bg
  const card = over(v['--card-bg'], bg)
  const subBg = over(t.subtitleBg, bg)

  check(pal.id, 'text / bg', t.text, bg, TEXT)
  check(pal.id, 'accent (chữ) / bg', t.accent, bg, TEXT)
  check(pal.id, 'accent (chữ) / card', t.accent, card, TEXT)
  check(pal.id, 'onAccent / accent', t.onAccent, t.accent, TEXT)
  check(pal.id, 'onSurface / surface', t.onSurface, t.surface, TEXT)
  check(pal.id, 'text / card', t.text, card, TEXT)
  check(pal.id, 'text-sub / card', v['--text-sub'], card, TEXT)
  check(pal.id, 'text-muted / card', v['--text-muted'], card, GRAPHIC)
  check(pal.id, 'subtitleText / subtitleBg', t.subtitleText, subBg, TEXT)
  check(pal.id, 'subtitleHighlight / subtitleBg', t.subtitleHighlight, subBg, TEXT)
  check(pal.id, 'chart bar / bg', v['--chart-bar'], bg, GRAPHIC)
  check(pal.id, 'chart highlight / bg', v['--chart-highlight'], bg, GRAPHIC)
  check(pal.id, 'chart positive / bg', v['--chart-positive'], bg, GRAPHIC)
  check(pal.id, 'chart negative / bg', v['--chart-negative'], bg, GRAPHIC)
  pal.chartTokens.chartSeries.forEach((s, i) => check(pal.id, `series ${i + 1} / bg`, s, bg, GRAPHIC))

  // Skin highlight-box mặc định của palette (xem highlightBoxLayout.HIGHLIGHT_SKINS)
  if (pal.highlightSkin === 'paper') {
    check(pal.id, 'paper: chữ / surface', t.onSurface, t.surface, TEXT)
    const badge = over(`rgba(${parseInt(t.accent.slice(1, 3), 16)}, ${parseInt(t.accent.slice(3, 5), 16)}, ${parseInt(t.accent.slice(5, 7), 16)}, 0.18)`, t.surface)
    check(pal.id, 'paper: số huy hiệu / nền huy hiệu', t.accent, badge, GRAPHIC)
  }
  if (pal.highlightSkin === 'marker') {
    const h = t.subtitleHighlight
    const ink = over(`rgba(${parseInt(h.slice(1, 3), 16)}, ${parseInt(h.slice(3, 5), 16)}, ${parseInt(h.slice(5, 7), 16)}, 0.55)`, bg)
    check(pal.id, 'marker: chữ / vệt mực', t.text, ink, TEXT)
  }
  if (pal.highlightSkin === 'editorial') {
    check(pal.id, 'editorial: vạch accent / nền', t.accent, bg, GRAPHIC)
  }

  // Chữ tự động trên nền màu luôn chọn phương án tương phản cao hơn
  for (const fill of [t.surface, t.accent, ...pal.chartTokens.chartSeries]) {
    const picked = getContrastTextColor(fill)
    const best = Math.max(contrastRatio('#0B0F1A', fill), contrastRatio('#FFFFFF', fill))
    assert.equal(contrastRatio(picked, fill), best, `${pal.id}: getContrastTextColor(${fill}) chưa chọn phương án tốt nhất`)
  }
}

assert.equal(failures.length, 0, `Cặp màu không đạt tương phản:\n  ${failures.join('\n  ')}`)
