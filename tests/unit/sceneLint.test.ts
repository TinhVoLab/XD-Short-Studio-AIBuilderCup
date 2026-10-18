import assert from 'assert/strict'
import { findPlaceholders, lintElementText, lintScenesText, describeLintIssues } from '@/utils/sceneLint'
import { hydrateSceneFromSlots } from '@/services/ai/sceneSlotHydrator'
import { WIDGET_SLOT_REGISTRY } from '@/services/ai/widgetSlotRegistry'
import { ELEMENTS_REGISTRY } from '@/config/elementsRegistry'

// 1. Chặn chữ giữ chỗ của template / AI
for (const bad of ['Giá chỉ [YOUR PRICE]', 'Mua [Tên sản phẩm]', '[Giữ nguyên câu trả lời hiện có]', '[Bổ sung chi tiết]', 'Chọn [...]', '[Tên…]', '[Ảnh minh hoạ]', '[Product name]', 'Xem {{title}}', 'Lorem ipsum dolor']) {
  assert.equal(findPlaceholders(bad).length, 1, bad)
}

// 2. Không chặn ký hiệu và nhãn thật
for (const ok of ['Khoảng [0, 1]', 'Nồng độ [H+] tăng', '[x^2]', '[INFO] Server started', '[BREAKING NEWS]', 'Đáp án [A]', '[Wikipedia]', '[Nguồn: Bộ Y tế]', '© {YEAR} {AUTHOR}']) {
  assert.deepEqual(findPlaceholders(ok), [], ok)
}

// 3. Chỉ xét chữ hiển thị; bỏ qua màu/URL/biểu thức và các thành phần code/toán/hoá
assert.deepEqual(lintElementText({ type: 'quote-box', content: '[Tên tác giả]', accentColor: '[x]', src: 'https://x/[name].png' }), [{ field: 'content', text: '[Tên tác giả]' }])
assert.deepEqual(lintElementText({ type: 'code-terminal', content: '[YOUR KEY HERE]' }), [])
assert.deepEqual(lintElementText({ type: 'checklist', checklistData: { items: [{ text: 'Bước [Tên bước]' }] } }), [{ field: 'checklistData.items[0].text', text: '[Tên bước]' }])

// 4. Toàn dự án: lời thoại + thành phần, kèm số cảnh
const issues = lintScenesText([
  { voiceoverText: 'Ổn', elements: [] },
  { voiceoverText: 'Liên hệ [số điện thoại]', elements: [{ id: 'q', type: 'quote-box', content: '{{quote}}' }] },
])
assert.deepEqual(issues.map(i => [i.sceneIdx, i.elementId, i.text]), [[1, null, '[số điện thoại]'], [1, 'q', '{{quote}}']])
assert.match(describeLintIssues(issues), /^Cảnh 2 còn chữ giữ chỗ “\[số điện thoại\]” và 1 chỗ khác/)
assert.equal(describeLintIssues([]), '')

// 5. Mẫu dựng sẵn của registry không bị chặn nhầm
for (const [type, def] of Object.entries<any>(ELEMENTS_REGISTRY)) {
  const payload = def?.ui?.defaultPayload
  if (payload) assert.deepEqual(lintElementText({ type, ...payload }), [], `registry ${type}`)
}

// 6. Cảnh AI: thiếu slot bắt buộc / còn chữ giữ chỗ → thẻ chữ, không lấp chuỗi mẫu
const voice = 'Hợp đồng này giúp bạn tiết kiệm chi phí. Câu sau.'
const widgetOf = (widgetType: string, slots: any) =>
  hydrateSceneFromSlots({ envelope: { archetype: 'general', widgetType, title: 't', voiceoverText: voice, slots } as any }).elements
    .find(e => e.type === widgetType || e.type === 'highlight-box')!
assert.equal(widgetOf('document-evidence', { variant: 'highlighter' }).type, 'highlight-box')
assert.equal(widgetOf('quote-box', { content: '[Tên trích dẫn]', author: 'A' }).type, 'highlight-box')
assert.equal((widgetOf('quote-box', { content: '[Tên trích dẫn]', author: 'A' }) as any).content, 'Hợp đồng này giúp bạn tiết kiệm chi phí.')
assert.equal(widgetOf('quote-box', { content: 'Học, học nữa, học mãi.', author: 'Lenin' }).type, 'quote-box')

// 7. Chèn cảnh thủ công dùng defaultSlots: mọi widget phải đủ slot bắt buộc và hợp lệ
for (const [type, def] of Object.entries(WIDGET_SLOT_REGISTRY)) {
  assert.equal(widgetOf(type, def.defaultSlots).type, type, `defaultSlots của ${type} bị thay bằng thẻ chữ`)
}
