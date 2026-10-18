import assert from 'assert/strict'
import { WIZARD_TEMPLATE_PRESETS, DEFAULT_WIZARD_PRESET_ID, resolveWizardPreset, MASTER_FRAMEWORK_ID, COLOR_THEMES } from '@/components/AiWizardModal/config/wizardCatalog'

// Mặc định là Master
assert.equal(DEFAULT_WIZARD_PRESET_ID, 'master-scene-library')
assert.equal(resolveWizardPreset(undefined).frameworkId, MASTER_FRAMEWORK_ID)
// Khung đã xoá (bản nháp cũ) và id mẫu dự án không có khung riêng → Master
for (const old of ['edu-quiz-interactive', 'top-tips-seo', 'versus-comparison', '']) {
  assert.equal(resolveWizardPreset(old).id, DEFAULT_WIZARD_PRESET_ID, old)
}
// Khung còn giữ nguyên id: "Tự do sáng tạo" và STEM (trùng id mẫu dự án)
assert.equal(resolveWizardPreset('auto').id, 'auto')
assert.equal(resolveWizardPreset('edu-concept-lesson').frameworkId, 'edu-concept')
// Mỗi khung trỏ tới bảng màu có trong wizard
for (const p of WIZARD_TEMPLATE_PRESETS) assert.ok(COLOR_THEMES.some((c) => c.id === p.colorId), `${p.id}: thiếu màu ${p.colorId}`)
