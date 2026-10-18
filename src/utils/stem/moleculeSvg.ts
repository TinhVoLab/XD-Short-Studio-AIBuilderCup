/**
 * SSOT vẽ cấu trúc phân tử 2D bằng SmilesDrawer — dùng chung video (Remotion) và canvas (Fabric)
 * để hình trên canvas khớp 1:1 với video. Chỉ chạy trên trình duyệt (cần document).
 */
import SmilesDrawer from 'smiles-drawer'

export const MOLECULE_THEMES: Record<string, any> = {
  neon: {
    C: '#BEFF01',
    O: '#FF5A72',
    N: '#00D4FF',
    H: '#94A3B8',
    P: '#F59E0B',
    S: '#FACC15',
    CL: '#34D399',
    F: '#10B981',
    BR: '#FB923C',
    I: '#C084FC',
    B: '#86EFAC',
    SI: '#38BDF8',
    BACKGROUND: 'transparent',
    FOREGROUND: '#BEFF01',
  },
  dark: {
    C: '#F0F6FC',
    O: '#FF6B6B',
    N: '#38BDF8',
    H: '#8B949E',
    P: '#FB923C',
    S: '#FDE047',
    CL: '#4ADE80',
    F: '#2DD4BF',
    BR: '#F97316',
    I: '#A855F7',
    B: '#86EFAC',
    SI: '#38BDF8',
    BACKGROUND: 'transparent',
    FOREGROUND: '#F0F6FC',
  },
  light: {
    C: '#0F172A',
    O: '#DC2626',
    N: '#0284C7',
    H: '#64748B',
    P: '#D97706',
    S: '#CA8A04',
    CL: '#059669',
    F: '#0D9488',
    BR: '#EA580C',
    I: '#7C3AED',
    B: '#16A34A',
    SI: '#0284C7',
    BACKGROUND: 'transparent',
    FOREGROUND: '#0F172A',
  },
}

export function renderMoleculeSvg(
  smiles: string,
  theme: string,
  bondThickness: number,
  targetWidth: number,
  targetHeight: number,
  /** px: đặt kích thước điểm ảnh (dùng làm <img> cho Fabric); mặc định co giãn 100% theo khung */
  pixelSize?: { width: number; height: number }
): { svgHtml: string; error: string | null } {
  if (typeof document === 'undefined' || !smiles || !smiles.trim()) {
    return { svgHtml: '', error: null }
  }

  try {
    const drawer = new SmilesDrawer.SvgDrawer({
      width: Math.max(80, targetWidth),
      height: Math.max(60, targetHeight),
      bondThickness: bondThickness || 2.0,
      bondLength: 26,
      compactDrawing: false,
      terminalCarbons: true,
      themes: MOLECULE_THEMES,
    })

    const themeKey = theme || 'neon'
    const drawerOpts = (drawer as any).opts
    const safeTheme = (drawerOpts?.themes && drawerOpts.themes[themeKey]) ? themeKey : 'neon'

    const tree = SmilesDrawer.Parser.parse(smiles.trim())
    const svgEl = drawer.draw(tree, null, safeTheme)

    if (svgEl) {
      svgEl.setAttribute('width', pixelSize ? String(pixelSize.width) : '100%')
      svgEl.setAttribute('height', pixelSize ? String(pixelSize.height) : '100%')
      if (pixelSize) svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
      svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet')
      svgEl.style.overflow = 'visible'
      return { svgHtml: svgEl.outerHTML, error: null }
    }
  } catch (err: any) {
    console.warn('SmilesDrawer draw error:', err)
    return { svgHtml: '', error: err?.message || 'Cấu trúc SMILES không hợp lệ' }
  }

  return { svgHtml: '', error: null }
}
