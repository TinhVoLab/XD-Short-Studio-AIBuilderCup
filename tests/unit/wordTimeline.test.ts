import assert from 'assert/strict'
import {
  estimateWordTimeline,
  resolveWordRevealMap,
  resolveWordTimeline,
  findAnchorWordIndex,
  resolveElementWordAnchors,
  applyAiWordAnchors,
  getSceneWordTimeline,
} from '@/utils/wordTimeline'
import { speechSpanForScene } from '@/config/pacingConfig'

const text = 'Bạn có biết, 90% người mới đầu tư thua lỗ trong năm đầu?'

// 1. Ước lượng: liên tục, đơn điệu, phủ đúng durationSec
const est = estimateWordTimeline(text, 4)
assert.equal(est.length, 13)
assert.equal(est[0].startSec, 0)
assert.equal(est[est.length - 1].endSec, 4)
for (let i = 1; i < est.length; i++) {
  assert.ok(est[i].startSec >= est[i - 1].startSec)
  assert.equal(est[i].startSec, est[i - 1].endSec)
}
// từ có dấu phẩy được thêm khoảng nghỉ
assert.ok(est[2].endSec - est[2].startSec > est[1].endSec - est[1].startSec)

// 2. Timestamps thật luôn được ưu tiên
const real = [{ word: 'Bạn', startSec: 0.1, endSec: 0.3 }]
assert.equal(resolveWordTimeline(text, real, 4), real)
assert.equal(resolveWordTimeline('', null, 4).length, 0)

// 3. Tìm từ khoá: không phân biệt hoa thường, bỏ dấu câu, giữ %, hỗ trợ cụm 2 từ
assert.equal(findAnchorWordIndex(text, '90%'), 3)
assert.equal(findAnchorWordIndex(text, 'BIẾT'), 2)
assert.equal(findAnchorWordIndex(text, 'thua lỗ'), 8)
assert.equal(findAnchorWordIndex(text, 'không có'), undefined)
assert.equal(findAnchorWordIndex(text, ''), undefined)

// 4. Quy đổi neo → giây, vào sớm hơn từ khoá một chút, kẹp chỉ số ngoài biên
const anchors = resolveElementWordAnchors({ enterOnWord: 3, exitOnWord: 99, emphasisOnWords: [8] }, est)
assert.ok(anchors.animDelay! < est[3].startSec && anchors.animDelay! >= 0)
assert.equal(anchors.exitAtSec, est[est.length - 1].startSec)
assert.deepEqual(anchors.emphasisAtSec, [est[8].startSec])
assert.deepEqual(resolveElementWordAnchors({}, est), {})

// 5. Gợi ý của AI được quy đổi và xoá khỏi element
const el = applyAiWordAnchors({ anchorWord: '90%', emphasisWord: 'thua', animDelay: 0.2 }, text)
assert.equal(el.enterOnWord, 3)
assert.deepEqual(el.emphasisOnWords, [8])
assert.ok(!('anchorWord' in el) && !('emphasisWord' in el))
// không ghi đè neo người dùng đã chỉnh
assert.equal(applyAiWordAnchors({ anchorWord: '90%', enterOnWord: 1 }, text).enterOnWord, 1)

// 6. Timeline cảnh chỉ trải trên khoảng giọng đọc (trừ phần đệm cuối / transition)
const scene: any = { voiceoverText: text, duration: 5, transition: { type: 'fade', duration: 0.5 } }
const sceneTl = getSceneWordTimeline(scene)
assert.equal(sceneTl[sceneTl.length - 1].endSec, speechSpanForScene(5, 0.5))

// master-hook: mốc giọng đọc cho từng từ tiêu đề (tra theo từ chuẩn hoá)
{
  const voice = 'Đây là mẹo giúp bạn ngủ ngon chỉ trong năm phút mỗi tối'
  const timeline = estimateWordTimeline(voice, 4)
  const map = resolveWordRevealMap('Mẹo ngủ NGON tức thì', voice, timeline)
  assert.ok(map.ngon !== undefined && map.ngon > 1 && map.ngon < 2, `"ngon" phải khớp lúc giọng đọc nói tới, nhận ${map.ngon}`)
  assert.equal(map['thì'], undefined, 'từ không có trong lời thoại không được gán mốc')
}
