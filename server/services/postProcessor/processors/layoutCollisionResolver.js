import { 
  SAFE_ZONE, 
  ELEMENT_PRIORITY, 
  SCENE_SILHOUETTES,
  calculateElementDynamicHeight,
  GOLDEN_FOCAL_Y,
  MIN_COMPRESSION_SCALE,
  getElementOrigin
} from '../../../../src/config/layoutRegistry.js';
import { estimateTextLines } from '../../../../src/config/textMetrics.js';

const ROW_GAP_X = 12;
const COMPRESSED_GAP = 8;
/** Hai element được coi là cùng hàng khi phần chồng dọc >= tỉ lệ này của element thấp hơn */
const ROW_OVERLAP_RATIO = 0.4;
/** Chừa khoảng trống phía dưới nhiều hơn phía trên (nhóm nội dung hơi lệch lên, gần focal point) */
const VERTICAL_BIAS = 0.4;
const DECORATIVE_TYPES = new Set(['badge', 'divider', 'line']);
const TEXT_TYPES = new Set(['text', 'caption']);
/** Cảnh statement: một câu chữ đơn khổ lớn */
const STATEMENT = { maxWords: 8, minFont: 30, maxFont: 40, width: 320, lineHeight: 1.2, pad: 8 };

const priorityOf = (el) => ELEMENT_PRIORITY[el.type] ?? 5;
const isWidget = (el) => !DECORATIVE_TYPES.has(el.type) && !TEXT_TYPES.has(el.type);
const wordCount = (text) => String(text || '').trim().split(/\s+/).filter(Boolean).length;

const shortTexts = (elements) => elements
  .filter(e => e.type === 'text' && wordCount(e.content) > 0 && wordCount(e.content) <= STATEMENT.maxWords)
  .sort((a, b) => wordCount(a.content) - wordCount(b.content));

/**
 * Bóng dáng thực áp dụng được với element đang có: statement cần một câu ≤ 8 từ, widget-solo cần một widget;
 * thiếu thì lùi về title-widget. Dùng chung cho resolver (cắt) và postProcessor (persist scene.silhouette).
 */
export function effectiveSilhouette(elements, silhouette) {
  if (!SCENE_SILHOUETTES[silhouette]) return undefined;
  const visual = (elements || []).filter(e => e.type !== 'caption');
  let shape = silhouette;
  if (shape === 'statement' && shortTexts(visual).length === 0) shape = 'title-widget';
  if (shape === 'widget-solo' && !visual.some(isWidget)) shape = 'title-widget';
  return shape;
}

/**
 * Cắt element theo bóng dáng cảnh (layoutRegistry.SCENE_SILHOUETTES) — bảo đảm đa dạng hình khối
 * dù AI vẽ đủ 3 lớp cho mọi cảnh. Trả về element giữ lại theo thứ tự gốc.
 */
export function applySilhouette(elements, silhouette) {
  const shape = effectiveSilhouette(elements, silhouette);
  if (!shape || elements.length <= 1) return elements;
  const byPriority = [...elements].sort((a, b) => priorityOf(b) - priorityOf(a));
  const topWidget = byPriority.find(isWidget);

  if (shape === 'statement') {
    const short = shortTexts(elements)[0];
    const fs = Math.min(STATEMENT.maxFont, Math.max(STATEMENT.minFont, Number(short.fontSize) || 0));
    Object.assign(short, { fontSize: fs, fontWeight: 900, textAlign: 'center', width: STATEMENT.width, left: SAFE_ZONE.CENTER_X });
    short.height = Math.round(estimateTextLines(short.content, STATEMENT.width, fs, { weight: 900 }) * fs * STATEMENT.lineHeight + STATEMENT.pad);
    return [short];
  }
  if (shape === 'widget-solo') return [topWidget];
  if (shape === 'title-widget') {
    const title = elements.find(e => e.type === 'text');
    const keep = new Set([title, topWidget].filter(Boolean));
    return keep.size > 0 ? elements.filter(e => keep.has(e)) : byPriority.slice(0, 2);
  }
  return elements; // split / full-card: chỉ giới hạn số lượng (maxElements) ở bước dưới
}


/** Khung thực (đã nhân scale) của element theo toạ độ AI, quy đổi theo origin */
function toBox(el) {
  const origin = getElementOrigin(el);
  const w = (el.width || 300) * (el.scaleX || 1);
  const h = (el.height || 60) * (el.scaleY || 1);
  const left = Number(el.left) || SAFE_ZONE.CENTER_X;
  const top = Number(el.top) || SAFE_ZONE.TOP;
  const x0 = origin.x === 'center' ? left - w / 2 : origin.x === 'right' ? left - w : left;
  const y0 = origin.y === 'center' ? top - h / 2 : top;
  return { el, w, h, x0, y0 };
}

/** Ghi lại left/top cho element từ góc trên-trái của khung, theo origin */
function placeBox(box, x0, y0) {
  const origin = getElementOrigin(box.el);
  box.el.left = Math.round(origin.x === 'center' ? x0 + box.w / 2 : origin.x === 'right' ? x0 + box.w : x0);
  box.el.top = Math.round(origin.y === 'center' ? y0 + box.h / 2 : y0);
}

/** Thu nhỏ element: chữ giảm fontSize/khung, widget dùng scale để giữ nguyên bố cục bên trong */
function shrinkBox(box, factor) {
  if (factor >= 1) return;
  const el = box.el;
  if (TEXT_TYPES.has(el.type)) {
    if (el.fontSize) el.fontSize = Math.max(12, Math.round(el.fontSize * factor));
    el.width = Math.round((el.width || box.w) * factor);
    el.height = Math.round((el.height || box.h) * factor);
  } else {
    el.scaleX = Math.round((el.scaleX || 1) * factor * 100) / 100;
    el.scaleY = Math.round((el.scaleY || 1) * factor * 100) / 100;
  }
  box.w *= factor;
  box.h *= factor;
}

/**
 * Gom element thành các hàng theo ý đồ bố cục của AI: hai khung chồng nhau theo chiều dọc
 * nhưng tách nhau theo chiều ngang (vd Bento: hero trái + stat phải) nằm cùng một hàng.
 */
function groupIntoRows(boxes) {
  const rows = [];
  for (const box of [...boxes].sort((a, b) => a.y0 - b.y0)) {
    const row = rows[rows.length - 1];
    const fitsRow = row && row.every(m => {
      const overlapY = Math.min(m.y0 + m.h, box.y0 + box.h) - Math.max(m.y0, box.y0);
      const separateX = box.x0 >= m.x0 + m.w - ROW_GAP_X || m.x0 >= box.x0 + box.w - ROW_GAP_X;
      return separateX && overlapY >= ROW_OVERLAP_RATIO * Math.min(m.h, box.h);
    });
    if (fitsRow) row.push(box);
    else rows.push([box]);
  }
  return rows.map(row => row.sort((a, b) => a.x0 - b.x0));
}

const rowWidth = row => row.reduce((sum, b) => sum + b.w, 0) + ROW_GAP_X * (row.length - 1);
const rowHeight = row => Math.max(...row.map(b => b.h));

/**
 * Bố cục cảnh theo hàng: giữ nguyên ý đồ chia cột của AI (layout Bento / split trong layoutRegistry),
 * nhưng bảo đảm không chồng lấn, không tràn safe zone [TOP, BOTTOM] và căn cả khối vào vùng nhìn.
 */
export function resolveSceneLayoutAndCollisions(elements = [], temporalRole = 'normal', silhouette) {
  if (!elements || elements.length === 0) return elements;

  const captionElement = elements.find(e => e.type === 'caption');
  const shape = effectiveSilhouette(elements, silhouette);
  let visualElements = applySilhouette(elements.filter(e => e.type !== 'caption'), shape);

  // 1. Element Density Limiter (theo bóng dáng thực; mặc định tối đa 4, CTA 5)
  const maxAllowed = SCENE_SILHOUETTES[shape]?.maxElements ?? (temporalRole === 'cta' ? 5 : 4);
  if (visualElements.length > maxAllowed) {
    visualElements.sort((a, b) => (ELEMENT_PRIORITY[b.type] ?? 5) - (ELEMENT_PRIORITY[a.type] ?? 5));
    visualElements = visualElements.slice(0, maxAllowed);
  }

  // 2. Pre-calculate dynamic heights for all elements via H = f(X)
  for (const el of visualElements) {
    el.height = calculateElementDynamicHeight(el);
  }

  // Single-element golden centering: Master Hook được đặt ở vị trí thị giác tối ưu
  if (visualElements.length === 1 && visualElements[0].type === 'master-hook') {
    const hook = visualElements[0];
    const elH = hook.height || 220;
    const hookLayout = hook.hookData?.layoutStyle;
    hook.left = SAFE_ZONE.CENTER_X;
    // Hero chiếm sân khấu: tâm khối ở tiêu điểm vàng (lower-third giữ vị trí dải dưới của nó)
    hook.top = hookLayout === 'cinematic-lower-third'
      ? 320
      : Math.min(SAFE_ZONE.BOTTOM - elH, Math.max(SAFE_ZONE.TOP, Math.round(GOLDEN_FOCAL_Y - elH / 2)));
    return captionElement ? [hook, captionElement] : [hook];
  }

  // Kích thước gốc: mỗi lần xếp lại (sau khi bỏ element) phải nén từ bản gốc, không nén chồng
  const originals = new Map(visualElements.map(el => [el, {
    scaleX: el.scaleX, scaleY: el.scaleY, fontSize: el.fontSize, width: el.width, height: el.height,
  }]));

  const layoutRows = (els) => {
    els.forEach(el => Object.assign(el, originals.get(el)));
    const rows = groupIntoRows(els.map(toBox));

    // 3. Mỗi hàng vừa bề ngang safe zone
    for (const row of rows) {
      if (row.length === 1 && TEXT_TYPES.has(row[0].el.type)) row[0].el.textAlign = 'center';
      if (row.length === 1 && row[0].el.type === 'badge') row[0].el.textAlign = 'center';
      const fit = (SAFE_ZONE.WIDTH - ROW_GAP_X * (row.length - 1)) / (rowWidth(row) - ROW_GAP_X * (row.length - 1));
      row.forEach(b => shrinkBox(b, fit));
    }

    // 4. Cả khối vừa chiều cao safe zone (nén co giãn, có sàn MIN_COMPRESSION_SCALE)
    const zoneH = SAFE_ZONE.BOTTOM - SAFE_ZONE.TOP;
    let gap = SAFE_ZONE.MIN_GAP;
    const contentH = () => rows.reduce((sum, r) => sum + rowHeight(r), 0);
    if (contentH() + gap * (rows.length - 1) > zoneH) {
      gap = COMPRESSED_GAP;
      const factor = Math.max(MIN_COMPRESSION_SCALE, (zoneH - gap * (rows.length - 1)) / contentH());
      rows.forEach(r => r.forEach(b => shrinkBox(b, factor)));
    }

    // 5. Đặt hàng từ trên xuống, căn giữa ngang, cả khối hơi lệch lên trong safe zone
    const totalH = contentH() + gap * (rows.length - 1);
    let y = SAFE_ZONE.TOP + Math.max(0, (zoneH - totalH) * VERTICAL_BIAS);
    for (const row of rows) {
      const rh = rowHeight(row);
      let x = SAFE_ZONE.CENTER_X - rowWidth(row) / 2;
      for (const box of row) {
        placeBox(box, x, y + (rh - box.h) / 2);
        x += box.w + ROW_GAP_X;
      }
      y += rh + gap;
    }
    return y - gap; // đáy khối
  };

  let bottom = layoutRows(visualElements);

  // 6. Fail-safe: vẫn tràn sau khi nén tối đa → bỏ phụ kiện trang trí rồi xếp lại
  if (bottom > SAFE_ZONE.BOTTOM) {
    const trimmed = visualElements.filter(e => !DECORATIVE_TYPES.has(e.type));
    if (trimmed.length > 0 && trimmed.length < visualElements.length) {
      visualElements = trimmed;
      bottom = layoutRows(visualElements);
    }
  }

  // 7. Vẫn tràn (cảnh nhồi quá nhiều widget nặng) → lần lượt bỏ element ưu tiên thấp nhất
  //    (cùng ưu tiên thì bỏ cái nằm dưới cùng) cho tới khi vừa safe zone; luôn giữ ít nhất 1
  while (bottom > SAFE_ZONE.BOTTOM && visualElements.length > 1) {
    let dropIdx = 0;
    visualElements.forEach((e, i) => {
      const p = ELEMENT_PRIORITY[e.type] ?? 5;
      const best = ELEMENT_PRIORITY[visualElements[dropIdx].type] ?? 5;
      if (p < best || (p === best && (e.top ?? 0) >= (visualElements[dropIdx].top ?? 0))) dropIdx = i;
    });
    visualElements = visualElements.filter((_, i) => i !== dropIdx);
    bottom = layoutRows(visualElements);
  }

  return captionElement ? [...visualElements, captionElement] : visualElements;
}
