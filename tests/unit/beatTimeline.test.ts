import assert from 'assert/strict'
import { scheduleBeat, splitBeatLines, fitBeatFontSize, formatBeatTitle, BEAT_MIN_HOLD_SEC, BEAT_MAX_SHARE, BEAT_FONT, BEAT_LINE_WIDTH } from '@/utils/beatTimeline'
import { estimateWordTimeline } from '@/utils/wordTimeline'
import { measureTextWidth } from '@/config/textMetrics'

console.log('🧪 beatTimeline...')

const voice = 'Khoan đã... lãi suất ngân hàng còn thấp hơn cả lạm phát!'
const timeline = estimateWordTimeline(voice, 4)

// 1. rehook in hoa, payoff editorial
assert.equal(formatBeatTitle({ kind: 'rehook', title: 'Khoan đã' }), 'KHOAN ĐÃ')
assert.equal(formatBeatTitle({ kind: 'payoff', title: 'CÂU TRẢ LỜI' }), 'Câu trả lời')

// 2. Chia dòng: ≤ 2 từ một dòng, 3–4 từ hai dòng cân
assert.deepEqual(splitBeatLines(['Khoan', 'đã']), ['Khoan đã'])
assert.deepEqual(splitBeatLines(['Đây', 'mới', 'là', 'chính']), ['Đây mới', 'là chính'])
assert.deepEqual(splitBeatLines(['Sai', 'hoàn', 'toàn']), ['Sai hoàn', 'toàn'])

// 3. Cỡ chữ: trong dải và mọi dòng vừa bề rộng; chữ ngắn thì to hơn chữ dài
const big = fitBeatFontSize(['SAI RỒI'])
const small = fitBeatFontSize(['NHƯNG ĐÂY MỚI', 'LÀ PHẦN CHÍNH'])
assert.ok(big >= BEAT_FONT.min && big <= BEAT_FONT.max)
assert.ok(small >= BEAT_FONT.min && small <= BEAT_FONT.max)
assert.ok(big >= small, 'chữ ngắn không được nhỏ hơn chữ dài')
assert.ok(measureTextWidth('NHƯNG ĐÂY MỚI', small, { weight: 900 }) <= BEAT_LINE_WIDTH)

// 4. Lịch: từ tìm thấy trong lời thoại có mốc, giữ ≥ 1.3s và ≤ 45% cảnh
const s = scheduleBeat({ kind: 'rehook', title: 'Khoan đã' }, voice, timeline, 5)
assert.ok(s.wordRevealSec['khoan'] !== undefined, 'từ "khoan" phải có mốc giọng đọc')
assert.ok(s.holdUntilSec >= BEAT_MIN_HOLD_SEC)
assert.ok(s.holdUntilSec <= 5 * BEAT_MAX_SHARE + 1e-9)
assert.ok(s.endSec > s.holdUntilSec)
assert.deepEqual(s.lines, ['KHOAN ĐÃ'])

// 5. Từ cuối được nói muộn → giữ lâu hơn nhưng vẫn không vượt trần
const late = scheduleBeat({ kind: 'payoff', title: 'lạm phát' }, voice, timeline, 5)
assert.ok(late.holdUntilSec > s.holdUntilSec, 'từ nói muộn hơn phải giữ lâu hơn')
assert.ok(late.holdUntilSec <= 5 * BEAT_MAX_SHARE + 1e-9)

// 6. Không khớp từ nào → vẫn có lịch mặc định, không lỗi
const none = scheduleBeat({ kind: 'rehook', title: 'Hoàn toàn khác' }, voice, timeline, 3)
assert.deepEqual(none.wordRevealSec, {})
assert.equal(none.holdUntilSec, Math.min(3 * BEAT_MAX_SHARE, BEAT_MIN_HOLD_SEC))

// 7. Cảnh rất ngắn: trần tối thiểu 0.8s
assert.equal(scheduleBeat({ kind: 'rehook', title: 'Dừng' }, voice, timeline, 1).holdUntilSec, 0.8)

console.log('✅ beatTimeline: all assertions passed')
