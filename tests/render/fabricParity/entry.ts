/**
 * Trang đo cho tests/render/fabricParityAudit.mjs: dựng 1 element bằng đúng code canvas của editor
 * (syncFabricElements) trên khung 360×640, trả ảnh PNG + khung/màu của từng chữ + khung bao element.
 */
import * as fabric from 'fabric'
import { syncFabricElements } from '@/utils/fabric/fabricElementFactory'
import { resolveThemePalette } from '@/utils/themeResolver'
import { whenVectorAssetsSettled } from '@/utils/fabric/vectorAssetCache'
import type { SceneElement } from '@/types/scene'

const isText = (o: fabric.FabricObject) => o instanceof fabric.FabricText

function sceneBox(o: fabric.FabricObject) {
  // Con trong group giữ toạ độ cũ tới khi setCoords() — thiếu bước này khung đo lệch ~nửa chiều cao widget
  o.setCoords()
  const pts = o.getCoords()
  const xs = pts.map(p => p.x)
  const ys = pts.map(p => p.y)
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)]
}

function collectTexts(objs: fabric.FabricObject[], opacity: number, out: any[]) {
  for (const o of objs) {
    if (!o.visible) continue
    const op = opacity * (o.opacity ?? 1)
    if (o instanceof fabric.Group) collectTexts(o.getObjects(), op, out)
    else if (isText(o)) {
      const t = o as fabric.FabricText
      const text = String(t.text || '').trim()
      if (!text || !/[\p{L}\p{N}]/u.test(text) || op < 0.05) continue
      out.push({ text: text.slice(0, 40), fill: typeof t.fill === 'string' ? t.fill : null, opacity: op, rect: sceneBox(t), size: t.fontSize, weight: t.fontWeight })
    }
  }
}

;(window as any).__renderFabric = async (el: SceneElement, paletteId: string) => {
  const pal = resolveThemePalette(paletteId)
  const host = document.getElementById('host')!
  host.innerHTML = '<canvas id="c" width="360" height="640"></canvas>'
  const canvas = new fabric.Canvas('c', { width: 360, height: 640, backgroundColor: pal.tokens.bg, renderOnAddRemove: false })
  const elements = [{ ...el, paletteId } as SceneElement]
  syncFabricElements(canvas, elements, null)
  // Ảnh dựng bất đồng bộ (phân tử, công thức): chờ xong rồi đồng bộ lại như useFabric
  await whenVectorAssetsSettled()
  syncFabricElements(canvas, elements, null)
  await document.fonts.ready
  await new Promise(r => setTimeout(r, 30))
  canvas.renderAll()
  const objs = canvas.getObjects()
  const texts: any[] = []
  collectTexts(objs, 1, texts)
  const bounds = objs[0] ? sceneBox(objs[0]) : null
  const png = canvas.toDataURL({ format: 'png', multiplier: 1 })
  canvas.dispose()
  return { png, texts, bounds, count: objs.length }
}
;(window as any).__fabricReady = true
