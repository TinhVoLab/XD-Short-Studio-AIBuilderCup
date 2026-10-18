import assert from 'assert/strict'
import { designHook, inferHookIntent, HOOK_LAYOUTS } from '@/config/hookDesigner'

/**
 * Bộ thiết kế master-hook: cùng seed → cùng kết quả; khác seed → đa dạng; không lặp hook gần đây;
 * layout cần dữ liệu (số, hai vế) không bao giờ hiện chữ giả; badge không emoji, không lặp tiêu đề.
 */

const SAMPLES = [
  { heroTitle: 'Dừng làm điều này ngay', hookIntent: 'warning' },
  { heroTitle: '90% người mới thua lỗ', hookIntent: 'number' },
  { heroTitle: 'Thuê nhà hay mua nhà', hookIntent: 'versus' },
  { heroTitle: 'Công thức ít ai nói', hookIntent: 'secret' },
  { heroTitle: 'AI viết code thay bạn', hookIntent: 'tech' },
  { heroTitle: 'Vì sao bạn luôn mệt?', hookIntent: 'curiosity' },
  { heroTitle: 'Mẹo ngủ ngon tức thì', hookIntent: 'tips' },
  { heroTitle: 'Chậm lại một chút', hookIntent: 'healing' },
]

// 1. Tất định
for (const s of SAMPLES) assert.deepEqual(designHook(s, { seed: 'a' }), designHook(s, { seed: 'a' }), `${s.heroTitle}: cùng seed phải cùng thiết kế`)

// 2. Đa dạng: cùng câu, 30 seed → nhiều layout (trừ ý định chỉ có 1–2 layout hợp)
for (const s of SAMPLES.filter(x => ['tips', 'curiosity', 'secret'].includes(x.hookIntent))) {
  const layouts = new Set(Array.from({ length: 30 }, (_, i) => designHook(s, { seed: `v${i}` }).layoutStyle))
  assert.ok(layouts.size >= 3, `${s.heroTitle}: chỉ ra ${layouts.size} layout cho 30 video`)
}
// Toàn bộ mẫu × 30 seed: không layout nào chiếm quá 25%
const counts: Record<string, number> = {}
let total = 0
for (const s of SAMPLES) for (let i = 0; i < 30; i++) {
  const id = designHook(s, { seed: `m${i}` }).layoutStyle
  counts[id] = (counts[id] || 0) + 1
  total++
}
for (const [id, n] of Object.entries(counts)) assert.ok(n / total <= 0.25, `${id} chiếm ${Math.round((n / total) * 100)}% — quá rập khuôn`)

// 3. Không lặp hook gần đây khi còn lựa chọn khác
const tips = SAMPLES.find(s => s.hookIntent === 'tips')!
for (let i = 0; i < 20; i++) {
  const first = designHook(tips, { seed: `r${i}` }).layoutStyle
  assert.notEqual(designHook(tips, { seed: `r${i}`, recentLayouts: [first] }).layoutStyle, first, 'phải tránh layout vừa dùng')
}

// 4. Ràng buộc dữ liệu
for (const s of SAMPLES) for (let i = 0; i < 30; i++) {
  const d = designHook(s, { seed: `c${i}` })
  if (d.layoutStyle === 'kinetic-giant-stat') assert.ok(d.statValue && /\d/.test(d.statValue), `${s.heroTitle}: giant-stat thiếu số thật`)
  if (d.layoutStyle === 'split-versus') assert.ok(d.versusLeft && d.versusRight, `${s.heroTitle}: split-versus thiếu hai vế`)
  if (d.layoutStyle === 'kinetic-strip-highlight') assert.ok(d.heroLine2 && !d.heroTitle.includes(d.heroLine2), `${s.heroTitle}: strip lặp từ hoặc thiếu dòng 2`)
  assert.ok(HOOK_LAYOUTS[d.layoutStyle as keyof typeof HOOK_LAYOUTS], `layout lạ: ${d.layoutStyle}`)
}
const versus = designHook({ heroTitle: 'Thuê nhà hay mua nhà' }, { seed: 'x' })
assert.equal(versus.hookIntent, 'versus')
assert.equal(versus.layoutStyle, 'split-versus')
assert.deepEqual([versus.versusLeft, versus.versusRight], ['Thuê nhà', 'mua nhà'])
const stat = designHook({ heroTitle: '90% người mới thua lỗ' }, { seed: 's1', recentLayouts: ['sticker-words'] })
if (stat.layoutStyle === 'kinetic-giant-stat') assert.equal(stat.statValue, '90%')

// 5. Badge: không emoji, không lặp tiêu đề; ý định suy ra khi AI bỏ trống
const dup = designHook({ heroTitle: 'Mẹo ngủ ngon tức thì', badgeText: 'Mẹo ngủ ngon tức thì' }, { seed: 'b' })
assert.notEqual(dup.badgeText.toLowerCase(), 'mẹo ngủ ngon tức thì')
const emoji = designHook({ heroTitle: 'Mẹo ngủ ngon', badgeText: '🔥 BÍ QUYẾT' }, { seed: 'b' })
assert.equal(emoji.badgeText, 'BÍ QUYẾT')
assert.equal(designHook({}, { content: 'TIÊU ĐỀ', seed: 'z' }).heroTitle, 'TIÊU ĐỀ')
// Hai tầng: dù AI đưa cả badge lẫn sub, thiết kế chỉ giữ đúng một tín hiệu phụ theo layout
for (const s of SAMPLES) {
  for (let i = 0; i < 12; i++) {
    const d = designHook({ ...s, badgeText: 'Nhãn', subText: 'Một câu gợi tò mò' }, { seed: `t${i}` })
    const sig = HOOK_LAYOUTS[d.layoutStyle as keyof typeof HOOK_LAYOUTS].signal
    assert.ok(sig === 'badge' || sig === 'sub', `${d.layoutStyle} thiếu signal`)
    assert.equal(Boolean(d.badgeText), sig === 'badge', `${d.layoutStyle}: badge phải ${sig === 'badge' ? 'có' : 'trống'}`)
    assert.equal(Boolean(d.subText), sig === 'sub', `${d.layoutStyle}: sub phải ${sig === 'sub' ? 'có' : 'trống'}`)
  }
}
assert.equal(inferHookIntent('Cảnh báo nguy hiểm mất trắng tiền bạc!'), 'warning')
assert.equal(inferHookIntent('Tăng doanh thu 300% trong 30 ngày'), 'number')

// 6. Gợi ý phong cách là ưu tiên, không phải khoá cứng
const biased = new Set(Array.from({ length: 40 }, (_, i) => designHook(tips, { seed: `s${i}`, styleHint: 'badge-split' }).layoutStyle))
assert.ok(biased.has('sticker-words') && biased.size >= 3, 'styleHint phải ưu tiên nhưng vẫn đa dạng')

// 7. giant-stat: tiêu đề (in phía trên số) không chứa lại con số, nhãn dưới số không lặp tiêu đề
for (let i = 0; i < 40; i++) {
  const d = designHook({ heroTitle: '90% người mới thua lỗ', hookIntent: 'number', statLabel: 'Người mới thua lỗ' }, { seed: `g${i}` })
  if (d.layoutStyle !== 'kinetic-giant-stat') continue
  assert.equal(d.heroTitle, 'người mới thua lỗ')
  assert.equal(d.statLabel, '')
}
