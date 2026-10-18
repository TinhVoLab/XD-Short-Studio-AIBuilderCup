/**
 * Dựng công thức KaTeX (cùng renderLatexHtml với video) thành ảnh PNG cho canvas Fabric.
 * Canvas không vẽ được HTML nên chụp node KaTeX bằng html-to-image; chỉ nhúng font KaTeX
 * (lấy từ stylesheet của katex.min.css, tải một lần) thay vì quét mọi font Google của trang.
 */
import { renderLatexHtml } from '@/utils/stem/latex'
import { getVectorAssetImage, isVectorAssetReady } from './vectorAssetCache'

/** Chụp ở 2x để công thức sắc nét khi phóng canvas */
export const LATEX_PREVIEW_SCALE = 2

let katexFontCss: Promise<string> | null = null

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })

/** @font-face của KaTeX dạng data URL (woff2) để html-to-image nhúng vào ảnh */
function getKatexFontEmbedCss(): Promise<string> {
  if (katexFontCss) return katexFontCss
  katexFontCss = (async () => {
    const rules: CSSFontFaceRule[] = []
    for (const sheet of Array.from(document.styleSheets)) {
      let list: CSSRuleList
      try {
        list = sheet.cssRules
      } catch {
        continue // stylesheet khác origin (Google Fonts) — không phải KaTeX
      }
      for (const rule of Array.from(list)) {
        if (rule instanceof CSSFontFaceRule && rule.style.getPropertyValue('font-family').includes('KaTeX_')) rules.push(rule)
      }
    }
    const faces = await Promise.all(
      rules.map(async (rule) => {
        const src = rule.style.getPropertyValue('src')
        const m = src.match(/url\(\s*["']?([^"')]+\.woff2[^"')]*)["']?\s*\)/)
        if (!m) return ''
        try {
          const url = new URL(m[1], rule.parentStyleSheet?.href || location.href).href
          const dataUrl = await blobToDataUrl(await (await fetch(url)).blob())
          const family = rule.style.getPropertyValue('font-family')
          const style = rule.style.getPropertyValue('font-style') || 'normal'
          const weight = rule.style.getPropertyValue('font-weight') || '400'
          return `@font-face{font-family:${family};font-style:${style};font-weight:${weight};src:url(${dataUrl}) format("woff2");}`
        } catch {
          return ''
        }
      })
    )
    return faces.join('\n')
  })().catch(() => '')
  return katexFontCss
}

export interface LatexPreviewSpec {
  latex: string
  displayMode: boolean
  fontSize: number
  color: string
}

const previewKey = (s: LatexPreviewSpec) => `tex|${s.displayMode ? 'd' : 'i'}|${s.fontSize}|${s.color}|${s.latex}`

export function isLatexPreviewReady(spec: LatexPreviewSpec): boolean {
  return isVectorAssetReady(previewKey(spec))
}

/** Ảnh công thức đã sẵn sàng, hoặc null (đang dựng / LaTeX sai) */
export function getLatexPreview(spec: LatexPreviewSpec): HTMLImageElement | null {
  return getVectorAssetImage(previewKey(spec), async () => {
    const html = renderLatexHtml(spec.latex, { displayMode: spec.displayMode })
    if (!html) return ''
    const node = document.createElement('div')
    node.style.cssText = `position:fixed;left:-10000px;top:0;display:inline-block;padding:2px 4px;color:${spec.color};font-size:${spec.fontSize}px;line-height:1.2;background:transparent;`
    node.innerHTML = html
    document.body.appendChild(node)
    try {
      const [{ toPng }, fontEmbedCSS] = await Promise.all([import('html-to-image'), getKatexFontEmbedCss()])
      // Node nằm ngoài màn hình để không hiện ra; khi chụp phải đưa về gốc toạ độ, nếu không ảnh trống
      return await toPng(node, {
        pixelRatio: LATEX_PREVIEW_SCALE,
        fontEmbedCSS,
        cacheBust: false,
        style: { position: 'static', left: '0', top: '0' },
      })
    } finally {
      node.remove()
    }
  })
}
