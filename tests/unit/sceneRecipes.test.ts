import assert from 'assert/strict'
import { SCENE_RECIPES, auditSceneRecipes, validateRecipeSlots, recipesForRole, nextRecipeIds, defaultRecipeId, aiSlots } from '@/config/sceneRecipes'
import { SCENE_ROLE_IDS } from '@/config/sceneRoles'

// 1. Registry toàn vẹn: vai, slot trong công thức, cặp ghép, lời hứa treo đều có mẫu đóng
assert.deepEqual(auditSceneRecipes(), [])

// 2. Mỗi vai có ít nhất một mẫu; mẫu mặc định (đầu tiên) là chuỗi đợt 1
for (const role of SCENE_ROLE_IDS) assert.ok(recipesForRole(role).length >= 1, role)
assert.deepEqual(SCENE_ROLE_IDS.map((r) => defaultRecipeId(r)), ['hook.number', 'bridge.roadmap_three', 'content.key_point', 'retention.wait', 'climax.summary', 'cta.save'])
// Slot hệ thống không đưa cho AI viết
assert.deepEqual(aiSlots('hook.number').map((x) => x.key), ['dieu', 'ket_qua'])

// 3. Chuỗi ghép liền mạch từ hook tới CTA theo pairsWith
const chain = ['hook.number', 'bridge.roadmap_three', 'content.key_point', 'retention.wait', 'content.key_point', 'climax.summary', 'cta.save']
for (let i = 0; i < chain.length - 1; i++) {
  assert.ok(SCENE_RECIPES[chain[i]].pairsWith.after.includes(chain[i + 1]), `${chain[i]} → ${chain[i + 1]}`)
}
assert.deepEqual(nextRecipeIds('content.key_point', 'climax'), ['climax.summary'])
// Ba điều hứa n điều → Tổng kết đóng lời hứa đó
assert.equal(SCENE_RECIPES['bridge.roadmap_three'].opensLoop, 'full_list')
assert.ok(SCENE_RECIPES['climax.summary'].closesLoop.includes('full_list'))
// Kiểu nền theo thiết kế: Khoan đã nền màu nhấn, Lưu cho sáng mai nền ngà
assert.equal(SCENE_RECIPES['retention.wait'].surface, 'accent')
assert.equal(SCENE_RECIPES['cta.save'].surface, 'ivory')

// 4. Kiểm slot AI điền
assert.equal(validateRecipeSlots('hook.number', { so: '3', dieu: 'thói quen buổi sáng', ket_qua: 'mất tập trung' }).ok, true)
assert.match(validateRecipeSlots('hook.number', { so: '3', dieu: 'thói quen' }).errors.join(), /ket_qua: thiếu/)
assert.match(validateRecipeSlots('hook.number', { so: '123456', dieu: 'a', ket_qua: 'b' }).errors.join(), /so: quá 4 ký tự/)
assert.match(validateRecipeSlots('bridge.roadmap_three', { n: 9, nhan_manh: 'quan trọng nhất' }).errors.join(), /n: phải là số nguyên 2–5/)
assert.match(validateRecipeSlots('content.key_point', { y: 'một hai ba bốn năm sáu bảy tám chín', ly_do: 'x' }).errors.join(), /y: quá 8 từ/)
assert.match(validateRecipeSlots('climax.summary', { tieu_de: 'Tóm lại', muc: ['a'] }).errors.join(), /muc: cần 2–5 mục/)
assert.equal(validateRecipeSlots('climax.summary', { tieu_de: 'Tóm lại', muc: ['Dậy cùng giờ', 'Chưa mở điện thoại', 'Vận động 10 phút'] }).ok, true)
assert.match(validateRecipeSlots('nope', {}).errors[0], /Không có mẫu/)

// 5. Mỗi mẫu trong registry có bố cục master-scene (video, canvas và chiều cao cùng một layout)
import { MASTER_SCENE_TEMPLATE_IDS } from '@/config/masterSceneLayout'
for (const id of Object.keys(SCENE_RECIPES)) assert.ok(MASTER_SCENE_TEMPLATE_IDS.includes(id), `${id}: chưa có layout trong masterSceneLayout`)
// Slot chép từ mẫu đi cặp không đưa cho AI viết (Đáp án lấy câu hỏi + lựa chọn từ Đoán thử)
assert.deepEqual(aiSlots('climax.answer').map((x) => x.key), ['dung', 'ket_qua', 'nhan_manh'])
