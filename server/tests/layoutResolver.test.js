import assert from 'assert/strict';
import { resolveSceneLayoutAndCollisions } from '../services/scenePostProcessor.js';
import { SAFE_ZONE, getElementOrigin } from '../../src/config/layoutRegistry.js';

console.log('🧪 Row-aware layout resolver...');

const boxOf = (el) => {
  const o = getElementOrigin(el);
  const w = (el.width || 300) * (el.scaleX || 1);
  const h = (el.height || 60) * (el.scaleY || 1);
  const x0 = o.x === 'center' ? el.left - w / 2 : o.x === 'right' ? el.left - w : el.left;
  const y0 = o.y === 'center' ? el.top - h / 2 : el.top;
  return { type: el.type, x0, y0, x1: x0 + w, y1: y0 + h };
};

function assertCleanLayout(out, label) {
  const boxes = out.filter(e => e.type !== 'caption').map(boxOf);
  for (const b of boxes) {
    assert.ok(b.y0 >= SAFE_ZONE.TOP - 0.5, `${label}: ${b.type} vượt mép trên (${b.y0})`);
    assert.ok(b.y1 <= SAFE_ZONE.BOTTOM + 0.5, `${label}: ${b.type} vượt mép dưới (${b.y1})`);
    assert.ok(b.x0 >= SAFE_ZONE.CENTER_X - SAFE_ZONE.WIDTH / 2 - 0.5, `${label}: ${b.type} tràn trái (${b.x0})`);
    assert.ok(b.x1 <= SAFE_ZONE.CENTER_X + SAFE_ZONE.WIDTH / 2 + 0.5, `${label}: ${b.type} tràn phải (${b.x1})`);
  }
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      const overlap = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) > 0.5 && Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0) > 0.5;
      assert.ok(!overlap, `${label}: ${a.type} chồng lên ${b.type}`);
    }
  }
  return boxes;
}

// 1. Bento (layoutRegistry A3): hero trái + stat phải phải giữ nguyên trên cùng một hàng
const bento = resolveSceneLayoutAndCollisions([
  { type: 'text', left: 180, top: 72, width: 320, height: 35, fontSize: 23, textAlign: 'center', content: 'Hiệu năng vượt trội' },
  { type: 'image', left: 105, top: 185, width: 135, height: 135 },
  { type: 'stat-big', left: 255, top: 185, width: 155, height: 135, statValue: '4K', statLabel: 'Độ chi tiết' },
  { type: 'highlight-box', left: 180, top: 325, width: 320, height: 75, content: 'Xử lý đa nhiệm\nKiến trúc mới' },
  { type: 'caption', left: 180, top: 520, width: 320, height: 70, content: 'phụ đề' },
]);
const bentoBoxes = assertCleanLayout(bento, 'bento');
const img = bentoBoxes.find(b => b.type === 'image');
const stat = bentoBoxes.find(b => b.type === 'stat-big');
assert.ok(img.x1 <= stat.x0, 'bento: image phải nằm bên trái stat-big');
assert.ok(Math.min(img.y1, stat.y1) > Math.max(img.y0, stat.y0), 'bento: image và stat-big phải cùng hàng');
assert.equal(bento[bento.length - 1].type, 'caption', 'caption giữ nguyên ở cuối');

// 2. Cột dọc thuần: giữ thứ tự đọc, căn giữa
const column = resolveSceneLayoutAndCollisions([
  { type: 'badge', left: 180, top: 68, width: 140, height: 24, content: 'Dữ liệu thực tế' },
  { type: 'stat-big', left: 180, top: 175, width: 312, height: 120, statValue: '3s', statLabel: 'Neo tâm trí' },
  { type: 'highlight-box', left: 180, top: 315, width: 320, height: 80, content: 'Bước 1\nBước 2' },
]);
const colBoxes = assertCleanLayout(column, 'column');
assert.ok(colBoxes[0].y1 <= colBoxes[1].y0 && colBoxes[1].y1 <= colBoxes[2].y0, 'column: giữ thứ tự từ trên xuống');

// 3. Quá tải: 4 widget cao phải được nén vừa safe zone
const crowded = resolveSceneLayoutAndCollisions([
  { type: 'flowchart', left: 180, top: 80, width: 336, flowSteps: [{ title: 'A' }, { title: 'B' }, { title: 'C' }, { title: 'D' }] },
  { type: 'stat-big', left: 180, top: 200, width: 312, statValue: '99%', statLabel: 'x' },
  { type: 'quote-box', left: 180, top: 300, width: 312, content: 'Một câu trích dẫn khá dài để tăng chiều cao của khối nội dung lên đáng kể.' },
  { type: 'highlight-box', left: 180, top: 400, width: 320, content: 'a\nb\nc' },
]);
assertCleanLayout(crowded, 'crowded');

// 4. Element gốc giữa (orbit-system) được đặt theo tâm, không lệch nửa khung
const centered = resolveSceneLayoutAndCollisions([
  { type: 'orbit-system', left: 180, top: 260, width: 220, height: 220 },
]);
assertCleanLayout(centered, 'center-origin');

// 5. Bóng dáng cảnh: cắt element theo spec, lùi về bóng dáng rộng hơn khi thiếu
const threeLayer = () => [
  { type: 'badge', left: 180, top: 68, width: 140, height: 24, content: 'Dữ liệu' },
  { type: 'text', left: 180, top: 100, width: 320, height: 40, fontSize: 22, textAlign: 'center', content: 'Lãi suất thấp hơn lạm phát' },
  { type: 'chart-bar', left: 180, top: 180, width: 312, chartData: [{ label: 'A', value: 5 }, { label: 'B', value: 7 }] },
  { type: 'highlight-box', left: 180, top: 360, width: 320, height: 65, content: 'Mỗi năm mất 2% giá trị' },
  { type: 'caption', left: 180, top: 520, width: 320, height: 70, content: 'phụ đề' },
];
const solo = resolveSceneLayoutAndCollisions(threeLayer(), 'normal', 'widget-solo');
assert.deepEqual(solo.map(e => e.type), ['chart-bar', 'caption'], 'widget-solo chỉ giữ widget chính + caption');
assertCleanLayout(solo, 'widget-solo');

const tw = resolveSceneLayoutAndCollisions(threeLayer(), 'normal', 'title-widget');
assert.deepEqual(tw.map(e => e.type), ['text', 'chart-bar', 'caption'], 'title-widget giữ tiêu đề + widget');
assertCleanLayout(tw, 'title-widget');

const st = resolveSceneLayoutAndCollisions(threeLayer(), 'normal', 'statement');
assert.deepEqual(st.map(e => e.type), ['text', 'caption'], 'statement chỉ giữ một câu chữ');
assert.ok(st[0].fontSize >= 30 && st[0].fontWeight === 900 && st[0].textAlign === 'center', 'statement: chữ khổ lớn, đậm, căn giữa');
assert.ok(st[0].height > 30, 'statement: chiều cao tính theo số dòng');
assertCleanLayout(st, 'statement');

const longOnly = resolveSceneLayoutAndCollisions([
  { type: 'text', left: 180, top: 100, width: 320, height: 40, fontSize: 18, content: 'Một câu quá dài không thể làm câu chữ đơn khổ lớn trên màn hình dọc được' },
  { type: 'checklist', left: 180, top: 200, width: 320, checklistItems: [{ text: 'A' }, { text: 'B' }] },
], 'normal', 'statement');
assert.deepEqual(longOnly.map(e => e.type), ['text', 'checklist'], 'statement không có câu ngắn → lùi về title-widget');

const full = resolveSceneLayoutAndCollisions(threeLayer(), 'normal', 'full-card');
assert.equal(full.length, 5, 'full-card giữ đủ 4 element + caption');
assert.equal(resolveSceneLayoutAndCollisions(threeLayer(), 'normal').length, 5, 'không có bóng dáng → như cũ');

console.log('✅ layout resolver: all assertions passed');
