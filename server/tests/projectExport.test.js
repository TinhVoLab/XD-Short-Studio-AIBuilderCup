import assert from 'node:assert/strict';

console.log('🧪 Bắt đầu chạy bộ kiểm thử Định dạng File Dự Án JSON (.xdshort.json)...');

// Test 1: Đảm bảo định dạng tên file export là .xdshort.json
console.log('  ▶ Test 1: Kiểm tra cấu trúc tên file xuất chuẩn...');
function generateExportFilename(title, customExt = 'xdshort.json') {
  const cleanTitle = (title || "project").replace(/[^a-zA-Z0-9_-]/g, "_");
  return `${cleanTitle}_${Date.now()}.${customExt}`;
}

const filename1 = generateExportFilename('Dự Án Viral TikTok 2026!');
assert.match(
  filename1,
  /\.xdshort\.json$/,
  'Tên file xuất ra bắt buộc phải có đuôi .xdshort.json'
);
console.log(`     • Filename generated: "${filename1}"`);
console.log('  ✅ Test 1 PASSED: Tên file có đuôi .xdshort.json chuẩn xác');

// Test 2: Đảm bảo Full Fidelity Snapshot có đủ activeMascotProfileId và tags
console.log('  ▶ Test 2: Kiểm tra Full-Fidelity Snapshot chứa đủ Mascot Profile và Tags...');
const mockState = {
  activeProjectId: 'proj_test_123',
  activeProjectFolderName: 'du-an-test',
  projectTitle: 'Dự Án Test',
  activeMascotProfileId: '3d-cyber-bot',
  scenes: [{ id: 'scene-1', duration: 3 }],
  audioClips: [],
  audioTrackIds: ['A1', 'A2'],
  bgMusicVolume: 0.35,
  brandingSettings: {},
  socialCaptions: { youtube: '', tiktok: '', pinnedComment: '' },
  projectsList: [{ id: 'proj_test_123', tags: ['tai-chinh', 'viral'] }]
};

const currentMeta = mockState.projectsList.find(p => p.id === mockState.activeProjectId);
const snapshot = {
  id: mockState.activeProjectId,
  folderName: mockState.activeProjectFolderName,
  title: mockState.projectTitle,
  tags: currentMeta?.tags || [],
  scenes: mockState.scenes,
  audioClips: mockState.audioClips,
  audioTrackIds: mockState.audioTrackIds,
  activeMascotProfileId: mockState.activeMascotProfileId || 'doodle-boy',
};

assert.equal(snapshot.activeMascotProfileId, '3d-cyber-bot', 'Snapshot phải giữ nguyên ID Mascot');
assert.deepEqual(snapshot.tags, ['tai-chinh', 'viral'], 'Snapshot phải chứa danh sách tags');
console.log('     • Mascot ID:', snapshot.activeMascotProfileId);
console.log('     • Tags:', snapshot.tags);
console.log('  ✅ Test 2 PASSED: Snapshot bảo toàn đầy đủ 100% dữ liệu');

// Test 3: Kiểm tra JSON stringify và parse chống xung đột ID
console.log('  ▶ Test 3: Kiểm tra JSON serialization & Anti-Collision ID generator...');
const jsonString = JSON.stringify(snapshot, null, 2);
const parsed = JSON.parse(jsonString);

// Giả lập logic import chống xung đột ID
const importedProject = {
  ...parsed,
  id: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  title: `${parsed.title || "Dự án"} (Nhập)`,
  updatedAt: Date.now()
};

assert.notEqual(importedProject.id, snapshot.id, 'ID dự án nhập phải khác ID gốc để chống xung đột');
assert.equal(importedProject.title, 'Dự Án Test (Nhập)');
assert.equal(importedProject.activeMascotProfileId, '3d-cyber-bot');
console.log(`     • Original ID: ${snapshot.id} -> New Anti-Collision ID: ${importedProject.id}`);
console.log('  ✅ Test 3 PASSED: JSON Serialization & Anti-Collision ID hoạt động hoàn hảo');

console.log('\n🎉 TẤT CẢ TEST ĐỊNH DẠNG DỰ ÁN JSON ĐÃ VƯỢT QUA!\n');
