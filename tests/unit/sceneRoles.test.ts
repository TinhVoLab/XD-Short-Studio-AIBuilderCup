import assert from 'assert/strict'
import {
  SCENE_ROLE_IDS,
  sceneRoleSpec,
  inferRoleByIndex,
  effectiveSceneRole,
  canonicalSceneRole,
  isPeakScene,
  roleEnergy,
  sceneDurationForRole,
  plannedSceneDuration,
  highlightSceneIndex,
} from '@/config/sceneRoles'
import { fitSceneDurationToAudio, estimateSceneDurationSec, SPEECH_RATE_WPS } from '@/config/pacingConfig'
import { TEMPORAL_ROLE_INFO, assignViralRoles } from '@/utils/temporalContrast'
import { resolveSceneEnergy } from '@/config/cinematicRules'

// 1. Vai theo vị trí: khớp công thức cũ của postProcessor (bộ tạo video) với mọi số cảnh 1–30
const oldPostProcessorRole = (si: number, n: number) =>
  si === 0 ? 'hook' : si === n - 1 ? 'cta' : si === Math.floor(n * 0.6) ? 'highlight' : 'normal'
for (let n = 1; n <= 30; n++) {
  for (let i = 0; i < n; i++) assert.equal(inferRoleByIndex(i, n), oldPostProcessorRole(i, n), `n=${n} i=${i}`)
}
assert.equal(highlightSceneIndex(10), 6)

// 2. Vai đã gán được giữ; giá trị lạ → suy theo vị trí (trước đây giữ nguyên chuỗi lạ)
assert.equal(effectiveSceneRole({ temporalRole: 'highlight' }, 0, 5), 'highlight')
assert.equal(effectiveSceneRole({ temporalRole: 'climax' }, 1, 5), 'climax')
assert.equal(effectiveSceneRole({ temporalRole: 'boom' as any }, 0, 5), 'hook')
assert.equal(effectiveSceneRole(undefined, 4, 5), 'cta')

// 3. Giá trị cũ ánh xạ về 6 vai chuẩn; điểm nhấn cũ và cao trào mới cùng là cảnh đỉnh
assert.equal(canonicalSceneRole('normal'), 'content')
assert.equal(canonicalSceneRole('highlight'), 'content')
assert.equal(canonicalSceneRole('retention'), 'retention')
assert.equal(isPeakScene('highlight'), true)
assert.equal(isPeakScene({ temporalRole: 'climax' }), true)
assert.equal(isPeakScene({ temporalRole: 'normal' }), false)

// 4. Năng lượng mặc định giữ nguyên số cũ (hook .9, highlight .85, normal .55, cta .4)
assert.deepEqual(['hook', 'highlight', 'normal', 'cta', undefined].map(r => roleEnergy(r)), [0.9, 0.85, 0.55, 0.4, 0.55])
assert.equal(resolveSceneEnergy({ temporalRole: 'highlight', beat: { kind: 'payoff' } }), 0.85)
assert.equal(resolveSceneEnergy({ temporalRole: 'normal', beat: { kind: 'rehook' } }), 0.8)

// 5. Thời lượng khi AI tạo kịch bản: khớp công thức cũ của postProcessor với mọi số từ 0–60
const oldDuration = (role: string, words: number, maxAllowed: number) => {
  const r = SPEECH_RATE_WPS.vi
  if (role === 'hook') return Math.max(2.2, Math.min(4.2, Math.round((words / r + 0.3) * 10) / 10))
  if (role === 'cta') return Math.max(2.0, Math.min(3.8, Math.round((words / r + 0.3) * 10) / 10))
  return Math.max(2.5, Math.min(maxAllowed, Math.round((words / r + 0.4) * 10) / 10))
}
for (const role of ['hook', 'cta', 'normal', 'highlight']) {
  for (let w = 0; w <= 60; w++) {
    assert.equal(plannedSceneDuration(role, w, SPEECH_RATE_WPS.vi, { contentMax: 8.7 }), oldDuration(role, w, 8.7), `${role} ${w} từ`)
  }
}

// 6. Chia nhịp / đổi vai: KHÔNG BAO GIỜ ngắn hơn giọng đọc (lỗi cũ: hook cứng 1,5 giây cắt lời)
const longVoice = { audioDuration: 6.2, transition: { duration: 0.5 } }
assert.equal(sceneDurationForRole('hook', longVoice), fitSceneDurationToAudio(6.2, 0.5))
assert.ok(sceneDurationForRole('cta', longVoice) >= 6.2)
const text = 'Một hai ba bốn năm sáu bảy tám chín mười mười một mười hai mười ba mười bốn mười lăm'
assert.equal(sceneDurationForRole('normal', { voiceoverText: text }), estimateSceneDurationSec(text))
// Lời ngắn → nâng lên sàn của vai; không có lời → mục tiêu của vai
assert.equal(sceneDurationForRole('hook', { audioDuration: 0.8 }), 2.2)
assert.equal(sceneDurationForRole('highlight', {}), 4.0)
const paced = assignViralRoles([
  { id: 'a', audioDuration: 5.5 } as any,
  { id: 'b' } as any,
  { id: 'c', voiceoverText: text } as any,
])
assert.deepEqual(paced.map(s => s.temporalRole), ['hook', 'highlight', 'cta'])
assert.ok(paced[0].duration >= 5.5)
assert.ok(paced[2].duration >= estimateSceneDurationSec(text))

// 7. Hiển thị: đủ 8 vai (6 mới + 2 cũ), nhãn chữ thường đầu câu, có màu
for (const role of [...SCENE_ROLE_IDS, 'normal', 'highlight'] as const) {
  const info = TEMPORAL_ROLE_INFO[role]
  assert.ok(info && info.color && info.bgColor.startsWith('rgba('), role)
  assert.notEqual(info.badge, info.badge.toUpperCase(), `badge viết HOA: ${role}`)
  assert.equal(info.label, sceneRoleSpec(role).label)
}

// 8. Khung thời lượng hợp lệ cho mọi vai
for (const role of SCENE_ROLE_IDS) {
  const d = sceneRoleSpec(role).duration
  assert.ok(d.min <= d.target && d.target <= d.max, role)
}
