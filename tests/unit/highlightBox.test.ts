import assert from 'assert/strict'
import {
  cleanHighlightLine,
  highlightBulletRows,
  splitHighlightStickers,
  resolveHighlightVariant,
  layoutHighlightBox,
  resolveHighlightSkin,
  suggestHighlightIcon,
  skinIcon,
} from '@/config/highlightBoxLayout'
import { THEME_PALETTES } from '@/config/themePalettes'
import { resolveRowRevealTimes, estimateWordTimeline } from '@/utils/wordTimeline'

// 1. Bỏ ký hiệu danh sách nhưng GIỮ con số thuộc nội dung
assert.equal(cleanHighlightLine('90% nhà đầu tư thua lỗ'), '90% nhà đầu tư thua lỗ')
assert.equal(cleanHighlightLine('3 bước để bắt đầu'), '3 bước để bắt đầu')
assert.equal(cleanHighlightLine('1. Khảo sát đối thủ'), 'Khảo sát đối thủ')
assert.equal(cleanHighlightLine('2) Tối ưu kịch bản'), 'Tối ưu kịch bản')
assert.equal(cleanHighlightLine('• Ghi chép'), 'Ghi chép')
assert.equal(cleanHighlightLine('- Đọc sách'), 'Đọc sách')
assert.equal(cleanHighlightLine('-5% lạm phát'), '-5% lạm phát')
assert.deepEqual(highlightBulletRows('Ý một • Ý hai • Ý ba'), ['Ý một', 'Ý hai', 'Ý ba'])
assert.deepEqual(highlightBulletRows('✦ Luận điểm 1\n✦ Luận điểm 2'), ['Luận điểm 1', 'Luận điểm 2'])
assert.equal(cleanHighlightLine('💡 Mẹo nhỏ'), 'Mẹo nhỏ')
assert.equal(cleanHighlightLine('★ ✓ Đã xong'), 'Đã xong')
// Bullet căn giữa có huy hiệu: chừa khoảng đối xứng bên phải
assert.ok((layoutHighlightBox({ content: 'A\nB', textAlign: 'center', width: 312 }).centerSpacer || 0) > 0)
assert.equal(layoutHighlightBox({ content: 'A\nB', width: 312 }).centerSpacer, 0)

// 2. Sticker: không cắt từ có gạch nối
assert.deepEqual(splitHighlightStickers('COVID-19, Lạm phát, Lãi suất'), ['COVID-19', 'Lạm phát', 'Lãi suất'])
assert.deepEqual(splitHighlightStickers('Tư duy - Kỷ luật - Kiên nhẫn'), ['Tư duy', 'Kỷ luật', 'Kiên nhẫn'])

// 3. Kiểu tự động: chỉ CTA mở đầu bằng động từ mới thành glow-pill ("chỉ" không còn kích hoạt)
assert.equal(resolveHighlightVariant({ content: 'Follow ngay để nhận bí kíp' }), 'glow-pill')
assert.equal(resolveHighlightVariant({ content: 'Lưu video này lại nhé' }), 'glow-pill')
assert.equal(resolveHighlightVariant({ content: 'Chỉ cần kiên nhẫn đầu tư đều đặn' }), 'callout-card')
assert.equal(resolveHighlightVariant({ content: 'Ý một\nÝ hai' }), 'bullet-list')
assert.equal(resolveHighlightVariant({ content: 'Ý một\nÝ hai', variant: 'multi-pill' }), 'multi-pill')
assert.equal(resolveHighlightVariant({ content: 'x', variant: 'không-tồn-tại' }), 'callout-card')

// 4. Chiều cao tăng theo cỡ chữ và độ dài (không còn trần 220px)
const long = 'Người bình thường giải quyết hậu quả, còn chuyên gia giải quyết nguyên nhân gốc rễ.'
assert.ok(layoutHighlightBox({ content: long, fontSize: 20, width: 312 }).height > layoutHighlightBox({ content: long, fontSize: 14, width: 312 }).height)
assert.ok(layoutHighlightBox({ content: '1\n2\n3\n4\n5\n6', width: 312 }).height > 220)

// 5. Bullet xuất hiện theo lời thoại: tuần tự, không khớp → undefined
const voice = 'Đầu tiên hãy lập ngân sách. Sau đó trích mười phần trăm thu nhập để đầu tư định kỳ.'
const timeline = estimateWordTimeline(voice, 6)
const times = resolveRowRevealTimes(['Lập ngân sách hằng tháng', 'Đầu tư định kỳ', 'Học thêm kỹ năng mới'], voice, timeline)
assert.equal(typeof times[0], 'number')
assert.equal(typeof times[1], 'number')
assert.ok((times[1] as number) > (times[0] as number), 'dòng sau xuất hiện sau dòng trước')
assert.equal(times[2], undefined)

// 6. Skin: theo palette, người dùng chọn được ghi đè; skin không khung + nền bận → có nền lót
assert.equal(resolveHighlightSkin({}, THEME_PALETTES['peach-cream'], false).skin, 'paper')
assert.equal(resolveHighlightSkin({}, THEME_PALETTES['neon-night'], false).skin, 'glass')
assert.equal(resolveHighlightSkin({ highlightSkin: 'marker' }, THEME_PALETTES['neon-night'], false).skin, 'marker')
assert.equal(resolveHighlightSkin({ highlightSkin: 'auto' }, THEME_PALETTES['royal-gold'], false).skin, 'editorial')
assert.equal(resolveHighlightSkin({}, THEME_PALETTES['warm-care'], true).backing, true)
assert.equal(resolveHighlightSkin({}, THEME_PALETTES['peach-cream'], true).backing, false)
for (const pal of Object.values(THEME_PALETTES)) assert.ok(pal.highlightSkin, `${pal.id} thiếu highlightSkin`)

// 7. Icon theo sắc thái; giấy mềm đổi ngôi sao mặc định thành dấu trích dẫn
assert.equal(suggestHighlightIcon('Trầm cảm không đến đột ngột, nó tích tụ từ những lần cố mỉm cười'), 'heart')
assert.equal(suggestHighlightIcon('Ngủ đủ giấc giúp sức khỏe tốt hơn'), 'leaf')
assert.equal(suggestHighlightIcon('Đừng bao giờ all-in một mã'), 'alert')
assert.equal(suggestHighlightIcon('Lãi kép giúp tài sản tăng trưởng'), 'sparkle')
assert.equal(skinIcon(undefined, 'paper'), 'quote')
assert.equal(skinIcon('heart', 'paper'), 'heart')
assert.equal(skinIcon(undefined, 'glass'), 'sparkle')
