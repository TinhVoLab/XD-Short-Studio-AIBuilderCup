import assert from 'assert/strict'
import {
  compileExpr,
  compileRenderFn,
  evalCoordExpr,
  normalizeLegacyExpr,
  validatePlotData,
} from '@/utils/stem/mathExpr'
import { validateStemElement, validateChemData, fallbackCalloutText } from '@/utils/stem/stemValidation'
import { WIDGET_SLOT_REGISTRY } from '@/services/ai/widgetSlotRegistry'
import { normalizeLatex, validateLatex, renderLatexHtml } from '@/utils/stem/latex'

const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≈ ${b}`)

// 1. Cú pháp JS cũ trong dự án đã lưu vẫn chạy
assert.equal(normalizeLegacyExpr('Math.sin(x - t * 2) ** 2'), 'sin(x - t * 2) ^ 2')
close(compileExpr('Math.sin(x - t * 2)').fn!(1, 0), Math.sin(1))
close(compileExpr('Math.exp(0.5 * x) - 1').fn!(2, 0), Math.E - 1)
close(compileExpr('Math.PI * x').fn!(1, 0), Math.PI)
close(compileExpr('x > 0 ? x : -x').fn!(-3, 0), 3)

// 2. Cú pháp math.js: luỹ thừa, nhân ngầm, hằng số
close(compileExpr('2x^2').fn!(3, 0), 18)
close(compileExpr('e^x').fn!(0, 0), 1)
close(compileExpr('sin(x - 2t)').fn!(1, 0.5), 0)

// 3. Biểu thức chứa code không chạy được (không còn new Function)
for (const evil of [
  'x.constructor',
  'cos.constructor("return process")()',
  'evaluate("1+1")',
  'import({a: 1})',
  'createUnit("foo")',
  'sin.toString()',
]) {
  const { fn } = compileExpr(evil)
  assert.ok(!fn || Number.isNaN(fn(1, 0)), `bị chặn: ${evil}`)
  assert.equal(validatePlotData({ expression: evil }).ok, false, `validate chặn: ${evil}`)
}

// 4. Ký hiệu lạ báo lỗi rõ ràng, không âm thầm thành đường thẳng
assert.match(compileExpr('hello world').error || '', /Ký hiệu không xác định: hello, world/)
assert.equal(compileRenderFn('hello world'), null)
assert.equal(compileRenderFn(''), null)

// 5. Hàm có điểm không xác định vẫn hợp lệ
for (const ok of ['1/x', 'log(x)', 'tan(x)', 'sqrt(x)', '0.25 * x^3 - x', 'sin(x)']) {
  assert.equal(validatePlotData({ expression: ok }).ok, true, ok)
}

// 6. Hàm hằng: chỉ cảnh báo
const flat = validatePlotData({ expression: '2' })
assert.equal(flat.ok, true)
assert.equal(flat.warnings.length, 1)

// 7. Chặn: thiếu biểu thức, hầu hết không tính được, nằm ngoài khung
assert.match(validatePlotData({ expression: '' }).errors[0], /Thiếu biểu thức/)
assert.match(validatePlotData({ expression: 'sqrt(-x - 10)' }).errors[0], /quá nửa số điểm/)
assert.match(validatePlotData({ expression: 'x + 100' }).errors[0], /ngoài vùng hiển thị/)
assert.equal(validatePlotData({ expression: 'x + 100', domainY: [90, 110] }).ok, true)

// 8. Đồ thị x = f(y), tham số, trường vector, toạ độ theo t
assert.equal(validatePlotData({ expressionY: 'y^2' }).ok, true)
assert.equal(validatePlotData({ parametricX: 'cos(tau)', parametricY: 'sin(tau)' }).ok, true)
assert.match(validatePlotData({ parametricX: 'cos(tau)' }).errors.join(), /cần cả parametricX và parametricY/)
assert.equal(validatePlotData({ vectorFieldExpr: 'x * y' }).ok, true)
assert.match(validatePlotData({ expression: 'x', points: [{ x: 'cos(t)', y: 'zz' }] }).errors[0], /points\[0\]\.y/)
close(evalCoordExpr('cos(t)', 0), 1)
assert.equal(evalCoordExpr('zz', 0, 7), 7)
assert.equal(evalCoordExpr(3, 0), 3)

// 9. Khi vẽ: điểm không tính được → 0 (Mafs không chịu NaN)
assert.equal(compileRenderFn('1/x')!(0, 0), 0)

// 10. Cổng chung và slot AI: thiếu biểu thức không còn bị thay bằng hàm mẫu
const hydrated = WIDGET_SLOT_REGISTRY['math-plot'].hydrate({} as any, { canvasWidth: 360, canvasHeight: 640, accentColor: '#C6F432' } as any)
assert.equal(validateStemElement(hydrated as any).ok, false)
const good = WIDGET_SLOT_REGISTRY['math-plot'].hydrate({ expression: 'sin(x)' } as any, { canvasWidth: 360, canvasHeight: 640, accentColor: '#C6F432' } as any)
assert.equal(validateStemElement(good as any).ok, true)
assert.equal(validateStemElement({ type: 'quote-box' }).ok, true)

// 11. Câu cho thẻ dự phòng: câu đầu, tối đa 14 từ
assert.equal(fallbackCalloutText('Đạo hàm đo tốc độ thay đổi. Câu sau bỏ.'), 'Đạo hàm đo tốc độ thay đổi.')
assert.equal(fallbackCalloutText('một hai ba bốn năm sáu bảy tám chín mười mười_một mười_hai mười_ba mười_bốn mười_lăm').split(' ').length, 14)

// 12. Phân tử: chỉ hợp lệ khi SMILES + công thức đã xác minh trên PubChem (CID)
const ctx = { canvasWidth: 360, canvasHeight: 640, accentColor: '#C6F432' } as any
const chemDef = WIDGET_SLOT_REGISTRY['chemical-molecule']
// Server đã điền từ PubChem
const resolved = chemDef.hydrate({ name: 'Glucose', displayName: 'Đường glucose', smiles: 'C(C1C(C(C(C(O1)O)O)O)O)O', formula: 'C6H12O6', pubchemCid: 5793 }, ctx)
assert.equal(validateStemElement(resolved as any).ok, true)
assert.equal((resolved as any).chemData.name, 'Đường glucose')
assert.equal((resolved as any).chemData.lookupName, 'Glucose')
// Tra không ra: không còn tự vẽ Caffeine
const unresolved = chemDef.hydrate({ name: 'Không có thật' }, ctx)
assert.equal((unresolved as any).chemData.smiles, '')
assert.equal(validateStemElement(unresolved as any).ok, false)
// SMILES do AI tự viết (không có CID) bị chặn
assert.match(validateChemData({ smiles: 'CCO', formula: 'C2H6O' }).errors[0], /chưa được xác minh/)
// Gợi ý theo từ khoá chỉ trả chất có dữ liệu PubChem, không khớp → rỗng
assert.equal(chemDef.extractHeuristics('nước tinh khiết').pubchemCid, 962)
assert.equal(chemDef.extractHeuristics('protein là gì').name, '')
assert.equal(validateStemElement(chemDef.hydrate(chemDef.defaultSlots, ctx) as any).ok, true)

// 13. Công thức LaTeX: cùng luật cho video, canvas, Inspector và cổng AI
assert.equal(normalizeLatex('$$\\frac{a}{b}$$'), '\\frac{a}{b}')
assert.equal(normalizeLatex('\\[ x^2 \\]'), 'x^2')
assert.equal(normalizeLatex('$E=mc^2$'), 'E=mc^2')
assert.equal(validateLatex('\\int_0^1 x\\,dx').ok, true)
assert.equal(validateLatex('\\text{Vận tốc } v = \\frac{s}{t}').ok, true)
assert.match(validateLatex('\\frac{a}{').error || '', /LaTeX không hợp lệ/)
assert.match(validateLatex('\\href{javascript:alert(1)}{x}').error || '', /không được phép/)
assert.match(validateLatex('').error || '', /trống/)
// Sai → null: video ẩn thành phần, không in lỗi đỏ
assert.equal(renderLatexHtml('\\frac{a}{'), null)
assert.ok(renderLatexHtml('E = mc^2')?.includes('katex'))

const latexDef = WIDGET_SLOT_REGISTRY['latex-formula']
assert.equal(validateStemElement(latexDef.hydrate({ latex: '$a^2 + b^2 = c^2$' } as any, ctx) as any).ok, true)
assert.equal((latexDef.hydrate({ latex: '$a^2 + b^2 = c^2$' } as any, ctx) as any).latexData.latex, 'a^2 + b^2 = c^2')
// Thiếu / sai: không còn tự chèn sin² + cos² = 1
assert.equal(validateStemElement(latexDef.hydrate({} as any, ctx) as any).ok, false)
assert.equal(validateStemElement({ type: 'latex-formula', latexData: { latex: '\\frac{a}{' } }).ok, false)
// Chủ đề không khớp mẫu: rỗng → thẻ chữ, không chèn chuỗi Taylor lạc đề
assert.equal(latexDef.extractHeuristics('lịch sử Việt Nam').latex, '')
// Nhãn đồ thị sai chỉ cảnh báo (nhãn bị ẩn), không chặn đồ thị
const badLabel = validateStemElement({ type: 'math-plot', mathData: { expression: 'sin(x)', latexLabel: '\\frac{' } })
assert.equal(badLabel.ok, true)
assert.match(badLabel.warnings.join(), /latexLabel/)
