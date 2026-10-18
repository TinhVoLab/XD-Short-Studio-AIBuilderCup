import assert from 'assert/strict'
import { planMasterStructure, plannedTotalSec, applyChainConstraints, validateVideoPlan } from '@/config/videoPlan'
import { defaultRecipeId } from '@/config/sceneRecipes'

const MASTER_CHAIN_V1 = { hook: defaultRecipeId('hook')!, bridge: defaultRecipeId('bridge')!, content: defaultRecipeId('content')!, climax: defaultRecipeId('climax')!, cta: defaultRecipeId('cta')! }
import { hydrateMasterPlan } from '@/services/ai/masterPlanHydrator'
import { validateRecipeSlots } from '@/config/sceneRecipes'

const roles = (t: number) => planMasterStructure(t).map(s => s.role).join(' ')

// 1. Cấu trúc theo độ dài (bảng công thức của spec, tổng 60 s đã sửa)
assert.equal(roles(30), 'hook bridge content content content climax cta')
assert.equal(roles(45), 'hook bridge content content retention content content climax cta')
assert.equal(roles(60), 'hook bridge content content retention content content content climax cta')
// Tối đa 5 ý (Ba điều / Tổng kết chứa 2–5 mục); dưới 30 s nâng lên cấu trúc 30 s (route và wizard chặn trước)
assert.equal(roles(90), roles(60))
assert.equal(roles(15), roles(30))
assert.equal(plannedTotalSec(planMasterStructure(30)), 29)
assert.equal(plannedTotalSec(planMasterStructure(60)), 58)
// Cảnh giữ chân ~40% thời lượng
const s60 = planMasterStructure(60)
const retStart = s60.slice(0, s60.findIndex(s => s.role === 'retention')).reduce((a, s) => a + s.plannedSec, 0)
assert.ok(retStart / plannedTotalSec(s60) > 0.3 && retStart / plannedTotalSec(s60) < 0.5)

// 2. Kịch bản mẫu 30 s hợp lệ
const sample = () => [
  { role: 'hook', recipeId: MASTER_CHAIN_V1.hook, slots: { so: '7', dieu: 'thói quen buổi sáng', ket_qua: 'mất tập trung' }, voiceoverText: 'Ba thói quen buổi sáng đang lấy đi sự tập trung của bạn.' },
  { role: 'bridge', recipeId: MASTER_CHAIN_V1.bridge, slots: { n: 9, nhan_manh: 'quan trọng nhất' }, voiceoverText: 'Có ba điều, và điều cuối là quan trọng nhất.' },
  { role: 'content', recipeId: MASTER_CHAIN_V1.content, slots: { y: 'Dậy cùng một giờ, kể cả cuối tuần', ly_do: 'Đồng hồ sinh học quen nhịp.' }, voiceoverText: 'Thứ nhất, dậy cùng một giờ mỗi ngày.' },
  { role: 'content', recipeId: MASTER_CHAIN_V1.content, slots: { y: 'Chưa mở điện thoại, trong 30 phút', ly_do: 'Đầu óc chưa bị kéo đi.' }, voiceoverText: 'Thứ hai, khoan hãy mở điện thoại.' },
  { role: 'content', recipeId: MASTER_CHAIN_V1.content, slots: { y: 'Vận động, chỉ 10 phút', ly_do: 'Máu lưu thông, tỉnh táo hơn.' }, voiceoverText: 'Thứ ba, vận động nhẹ mười phút.' },
  { role: 'climax', recipeId: MASTER_CHAIN_V1.climax, slots: { tieu_de: '3 thói quen buổi sáng', muc: ['Dậy cùng một giờ', 'Chưa mở điện thoại', 'Vận động 10 phút'], quan_trong_nhat: 9 }, voiceoverText: 'Tóm lại, ba thói quen giúp bạn tập trung cả ngày.' },
  { role: 'cta', recipeId: MASTER_CHAIN_V1.cta, slots: { thoi_diem: 'sáng mai', ly_do: 'Bạn sẽ cần nó lúc 6 giờ.' }, voiceoverText: 'Lưu lại để sáng mai làm thử nhé.' },
] as any[]

// 3. Ràng buộc chéo: con số hook = n của Ba điều = số ý; mục quan trọng nhất ngoài khoảng → bỏ
const fixed = applyChainConstraints(sample())
assert.equal(fixed[0].slots.so, '3')
assert.equal(fixed[1].slots.n, 3)
assert.equal(fixed[5].slots.quan_trong_nhat, undefined)
assert.deepEqual(validateVideoPlan(fixed), { ok: true, errors: [], warnings: [] })

// 4. Chặn: Tổng kết thiếu mục, thiếu cao trào (lời hứa n điều không được đóng), sai thứ tự, slot sai
const fewer = applyChainConstraints(sample())
fewer[5].slots.muc = ['Dậy cùng một giờ', 'Chưa mở điện thoại']
assert.match(validateVideoPlan(fewer).errors.join(), /Tổng kết có 2 mục nhưng có 3 cảnh nội dung/)
const noClimax = fixed.filter(s => s.role !== 'climax')
const e = validateVideoPlan(noClimax).errors.join()
assert.match(e, /Cần đúng 1 cảnh cao trào/)
assert.match(e, /Lời hứa "full_list" mở ở cảnh 2 chưa được đóng/)
assert.match(validateVideoPlan([...fixed].reverse()).errors.join(), /Cảnh đầu phải là mở đầu/)
const badSlot = applyChainConstraints(sample())
badSlot[2].slots.y = 'một hai ba bốn năm sáu bảy tám chín mười'
assert.match(validateVideoPlan(badSlot).errors.join(), /Cảnh 3 \(Thẻ ý chính\): y: quá 8 từ/)
const noVoice = applyChainConstraints(sample())
noVoice[6].voiceoverText = ' '
assert.match(validateVideoPlan(noVoice).errors.join(), /Cảnh 7: thiếu lời thoại/)

// 4b. Mẫu sai vai / không tồn tại → mẫu mặc định của vai; mỗi cảnh có danh sách mẫu được chọn
const wrong = applyChainConstraints(sample().map((x, i) => (i === 0 ? { ...x, recipeId: 'cta.save' } : i === 1 ? { ...x, recipeId: 'nope' } : x)))
assert.equal(wrong[0].recipeId, MASTER_CHAIN_V1.hook)
assert.equal(wrong[1].recipeId, MASTER_CHAIN_V1.bridge)
for (const s of planMasterStructure(45)) assert.ok(s.recipeOptions.includes(s.recipeId), s.role)

// 5. Hydrate: vai, kiểu nền theo mẫu, element master-scene trong vùng an toàn, nhãn "Thói quen n/3", phụ đề
const plan = { title: 'Buổi sáng tập trung', itemLabel: 'Thói quen', targetSec: 30, plannedSec: 29, warnings: [], scenes: fixed.map((s, i) => ({ ...s, plannedSec: planMasterStructure(30)[i].plannedSec })) }
const scenes = hydrateMasterPlan(plan as any, { paletteId: 'studio-lime' })
assert.equal(scenes.length, 7)
assert.deepEqual(scenes.map(s => s.temporalRole), ['hook', 'bridge', 'content', 'content', 'content', 'climax', 'cta'])
assert.equal(scenes[6].surface, 'ivory')
assert.equal(scenes[0].surface, undefined)
for (const sc of scenes) {
  const m = sc.elements.find(e => e.type === 'master-scene')!
  assert.ok(m.height > 100, `${sc.name} cao ${m.height}`)
  assert.ok(m.top >= 640 * 0.12 - 1 && m.top + m.height <= 640 * 0.76 + 1, `${sc.name} ngoài vùng an toàn: ${m.top}..${m.top + m.height}`)
  assert.equal(validateRecipeSlots(m.masterSceneData!.templateId, m.masterSceneData!.slots).ok, true)
  assert.ok(sc.elements.some(e => e.type === 'caption' && e.content === sc.voiceoverText))
  assert.ok(sc.duration >= 2, sc.name)
  assert.ok(sc.transition && sc.cameraMotion, `${sc.name} thiếu camera/chuyển cảnh`)
}
assert.deepEqual(scenes.filter(s => s.temporalRole === 'content').map(s => s.elements[0].masterSceneData!.position), [
  { index: 1, total: 3, label: 'Thói quen' },
  { index: 2, total: 3, label: 'Thói quen' },
  { index: 3, total: 3, label: 'Thói quen' },
])

// 6. Cặp Đoán thử → Đáp án: chép câu hỏi + lựa chọn; thiếu Đoán thử thì Đáp án báo lỗi; Đoán thử không có Đáp án cũng lỗi
{
  const s45 = planMasterStructure(45)
  const base = s45.map((x) => ({ role: x.role, recipeId: x.recipeId, voiceoverText: 'Lời thoại.', slots: {} as any }))
  const iRet = base.findIndex((x) => x.role === 'retention')
  const iClimax = base.findIndex((x) => x.role === 'climax')
  base[iRet] = { ...base[iRet], recipeId: 'retention.guess', slots: { cau_hoi: 'Nên làm gì đầu tiên?', lua_chon: ['Xem tin', 'Uống nước', 'Ngủ tiếp'] } }
  base[iClimax] = { ...base[iClimax], recipeId: 'climax.answer', slots: { dung: 2, ket_qua: 'Uống nước giúp tỉnh táo.', cau_hoi: 'bị ghi đè', lua_chon: ['x'] } }
  const fixedPair = applyChainConstraints(base)
  assert.deepEqual(fixedPair[iClimax].slots.lua_chon, ['Xem tin', 'Uống nước', 'Ngủ tiếp'])
  assert.equal(fixedPair[iClimax].slots.cau_hoi, 'Nên làm gì đầu tiên?')
  const errs = validateVideoPlan(fixedPair).errors.join()
  assert.doesNotMatch(errs, /answer/)
  // Ba điều (mặc định) mở lời hứa full_list mà cao trào là Đáp án → chưa đóng
  assert.match(errs, /Lời hứa "full_list"/)
  // Đáp án không có Đoán thử phía trước
  const lone = applyChainConstraints(base.map((x, i) => (i === iRet ? { ...x, recipeId: 'retention.wait', slots: { ly_do: 'quan trọng nhất' } } : x)))
  assert.match(validateVideoPlan(lone).errors.join(), /Đáp án\): cần một cảnh trước đó mở lời hứa "answer"/)
  // Ô số của CTA = số ý
  const pick = applyChainConstraints(base.map((x) => (x.role === 'cta' ? { ...x, recipeId: 'cta.pick_number', slots: { cau: 'Bạn chọn số mấy?' } } : x)))
  assert.equal(pick[pick.length - 1].slots.n, s45.filter((x) => x.role === 'content').length)
}
