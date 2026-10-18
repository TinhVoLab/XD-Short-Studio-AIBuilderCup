import assert from 'assert/strict'
import { getElementAlignment, CHART_PLACEHOLDER_REGISTRY } from '@/config/fabricPlaceholders'
import { getElementOrigin } from '@/config/layoutRegistry'
import { VALID_ELEMENT_TYPES } from '@/config/validElementTypes'

// getElementOrigin (JS, dùng ở server resolver) phải khớp getElementAlignment (Fabric + Remotion)
const types = new Set<string>([...Object.keys(CHART_PLACEHOLDER_REGISTRY), ...VALID_ELEMENT_TYPES])
assert.ok(types.size > 40, `chỉ có ${types.size} loại element`)
for (const type of types) {
  for (const textAlign of [undefined, 'left', 'center', 'right']) {
    const el = { type, textAlign }
    const a = getElementAlignment(el as any)
    const o = getElementOrigin(el)
    const ax = a.isCenterX ? 'center' : (a as any).isRightX ? 'right' : 'left'
    assert.equal(o.x, ax, `${type}/${textAlign}: originX ${o.x} ≠ ${ax}`)
    assert.equal(o.y, a.isCenterY ? 'center' : 'top', `${type}/${textAlign}: originY lệch`)
  }
}
