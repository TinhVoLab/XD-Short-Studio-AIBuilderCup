import assert from 'assert/strict'
import { hasProjectContent, projectTitleFromIdea } from '@/utils/projectContent'

// Dự án trống (1 cảnh trắng) → wizard dùng luôn; có element hoặc lời thoại → tạo dự án mới
assert.equal(hasProjectContent([{ id: 's', elements: [] } as any]), false)
assert.equal(hasProjectContent([]), false)
assert.equal(hasProjectContent([{ id: 's', elements: [{ id: 'e' }] } as any]), true)
assert.equal(hasProjectContent([{ id: 's', elements: [], voiceoverText: 'Xin chào' } as any]), true)

assert.equal(projectTitleFromIdea('  3 thói quen buổi sáng  '), '3 thói quen buổi sáng')
assert.equal(projectTitleFromIdea(''), 'Dự án mới')
const long = projectTitleFromIdea('Phân biệt thì hiện tại đơn và hiện tại tiếp diễn, mẹo nhớ qua ví dụ dễ hiểu cho người mới bắt đầu')
assert.ok(long.length <= 61 && long.endsWith('…'), long)
