/**
 * SSOT hình học của element `master-scene` (thư viện cảnh Master, config/sceneRecipes.js).
 *
 * layoutMasterScene(el) trả về danh sách hộp đã định vị (chữ đã ngắt dòng, khối, viền, icon) kèm kiểu chuyển động.
 * Remotion (MasterSceneElement) và Fabric (masterSceneFabricRenderer) vẽ CÙNG danh sách này, và chiều cao element
 * H = f(X) là cạnh dưới của hộp cuối (AGENTS.md §5) — ba nơi không thể lệch nhau.
 *
 * Kích thước lấy từ artboard thiết kế (khung 280px) nhân K = 360 / 280 cho khung video logic 360px.
 * Màu là "tông" (text / accent / sub / onAccent + nền line / track / panel / ghost) — nơi vẽ ánh xạ sang token theme.
 * Hộp có outAt (giây) tắt dần tại thời điểm đó: chỉ sống trong video, canvas vẽ trạng thái cuối nên bỏ qua.
 */
import { measureTextWidth, wrapMeasuredWords } from './textMetrics.js';

const K = 360 / 280;
const px = (v) => Math.round(v * K * 10) / 10;

/** Bề rộng mặc định = khung 360 trừ lề 10% hai bên của thiết kế */
export const MASTER_SCENE_DEFAULT_WIDTH = 288;
export const MASTER_SCENE_MIN_WIDTH = 200;

export const MASTER_FONTS = {
  display: 'Bricolage Grotesque',
  body: 'Be Vietnam Pro',
  mono: 'JetBrains Mono',
};

const font = (family, weight, size, lineHeight, letterSpacingEm = 0) => ({ family, weight, size, lineHeight, letterSpacing: Math.round(letterSpacingEm * size * 100) / 100 });

/** Chiều cao dòng (px) của một font */
const lineH = (f) => Math.round(f.size * f.lineHeight * 10) / 10;

const measure = (text, f) => measureTextWidth(text, f.size, { weight: f.weight, fontFamily: f.family, letterSpacing: f.letterSpacing });

/**
 * Hộp chữ (glyph box) ≈ fontSize × 1.13 — cũng là chiều cao một dòng của fabric.Text. Khoảng cách dòng < 1.13
 * (số khổng lồ 0.82) làm nét chữ tràn khỏi hộp dòng; phần tràn được tính vào bố cục để chữ luôn nằm trong element.
 */
export const GLYPH_BOX_EM = 1.13;
const glyphSpill = (f) => Math.max(0, (f.size * GLYPH_BOX_EM - lineH(f)) / 2);

/** Thu cỡ chữ một dòng cho vừa bề rộng (số "90%", "Khoan.") — giữ tỉ lệ khoảng cách chữ theo em */
function fitFont(text, f, width, letterSpacingEm) {
  const natural = measure(text, { ...f, size: 100, letterSpacing: letterSpacingEm * 100 }) / 100;
  const size = Math.floor(Math.min(f.size, natural > 0 ? width / natural : f.size));
  return font(f.family, f.weight, size, f.lineHeight, letterSpacingEm);
}

/**
 * Ngắt chữ nhiều tông thành các dòng: tokens [{ text, tone }] → lines [[{ text, tone }]] (span cùng tông gộp lại).
 * Đoạn bắt đầu bằng dấu câu dính vào từ trước (cụm nhấn mạnh + dấu chấm: "nhanh hơn" + "." → "nhanh hơn.").
 * Dấu cách giữa hai từ thuộc span đứng trước để khớp cách trình duyệt và Fabric vẽ.
 */
const GLUE_START = /^[.,!?;:…)%]/;

export function wrapRichText(tokens, width, f) {
  // Mỗi từ là một dãy đoạn [{ text, tone }] (một từ có thể mang hai tông)
  const words = [];
  let openEnd = false;
  for (const t of tokens) {
    const raw = String(t.text ?? '');
    const tone = t.tone || 'text';
    const pieces = raw.split(/\s+/).filter(Boolean);
    pieces.forEach((w, i) => {
      if (i === 0 && openEnd && GLUE_START.test(raw) && words.length) words[words.length - 1].push({ text: w, tone });
      else words.push([{ text: w, tone }]);
    });
    if (pieces.length) openEnd = !/\s$/.test(raw);
  }
  if (!words.length) return [];
  const space = measure(' ', f);
  const wordText = (w) => w.map((sg) => sg.text).join('');
  const lineOf = wrapMeasuredWords(words.map((w) => measure(wordText(w), f)), space, width);
  const lines = [];
  words.forEach((w, i) => {
    const li = lineOf[i];
    const line = (lines[li] ||= []);
    const isLineEnd = lineOf[i + 1] !== li;
    w.forEach((sg, k) => {
      const text = !isLineEnd && k === w.length - 1 ? `${sg.text} ` : sg.text;
      const last = line[line.length - 1];
      if (last && last.tone === sg.tone) last.text += text;
      else line.push({ text, tone: sg.tone });
    });
  });
  return lines;
}

function textBox({ tokens, x, y, width, f, align = 'left', anim, delay = 0 }) {
  const lines = wrapRichText(tokens, width, f);
  const height = lines.length * lineH(f);
  return { kind: 'text', x, y, width, height, lines, font: f, lineHeight: lineH(f), align, anim, delay };
}

/** Bề rộng dòng dài nhất của một hộp chữ (khối nền ôm chữ, vd viên thuốc màu nhấn) */
const textWidth = (box) => Math.max(0, ...box.lines.map((line) => measure(line.map((sp) => sp.text).join('').trimEnd(), box.font)));

/**
 * Vạch màu nhấn dưới các đoạn tông 'mark' (thiết kế: box-shadow inset 0 -0.22em) — vẽ trước chữ, cùng chuyển động.
 * Chỉ cho chữ căn trái.
 */
function markBars(box) {
  const bars = [];
  const barH = Math.round(box.font.size * 0.22 * 10) / 10;
  box.lines.forEach((line, li) => {
    let x = box.x;
    for (const span of line) {
      const w = measure(span.text, box.font);
      if (span.tone === 'mark') {
        const top = box.y + li * box.lineHeight + box.lineHeight / 2 + box.font.size * 0.42 - barH;
        bars.push(rect({ x, y: top, w: measure(span.text.trimEnd(), box.font), h: barH, fill: 'accentFill', anim: box.anim, delay: box.delay }));
      }
      x += w;
    }
  });
  return bars;
}

const rect = (props) => ({ kind: 'rect', radius: 0, ...props });

/** Cụm sau dấu phẩy cuối được tô màu nhấn (thiết kế: "Dậy cùng một giờ, kể cả cuối tuần") */
function emphasizeAfterComma(text) {
  const s = String(text ?? '').trim();
  const i = s.lastIndexOf(',');
  if (i <= 0 || i >= s.length - 1) return [{ text: s, tone: 'text' }];
  return [{ text: s.slice(0, i + 1), tone: 'text' }, { text: s.slice(i + 1), tone: 'accent' }];
}

/** Cụm `phrase` trong `text` tô tông `tone` (không phân biệt hoa thường); không tìm thấy → cả câu tông thường */
function emphasizePhrase(text, phrase, tone = 'accent') {
  const s = String(text ?? '').trim();
  const p = String(phrase ?? '').trim();
  const i = p ? s.toLowerCase().indexOf(p.toLowerCase()) : -1;
  if (i < 0) return [{ text: s, tone: 'text' }];
  return [
    { text: s.slice(0, i), tone: 'text' },
    { text: s.slice(i, i + p.length), tone },
    { text: s.slice(i + p.length), tone: 'text' },
  ].filter((t) => t.text.trim());
}

const META = () => font(MASTER_FONTS.mono, 500, px(10.5), 1.25, 0.08);
const LABEL = () => font(MASTER_FONTS.mono, 500, px(11), 1.25, 0.1);

/** Nhãn vị trí "Thói quen n/tổng" + các vạch tiến độ — đầu mọi cảnh nội dung */
function positionHeader(W, position) {
  if (!(position?.total > 0)) return { items: [], y: 0 };
  const meta = META();
  const text = `${position.label || 'Ý'} ${position.index}/${position.total}`;
  const items = [textBox({ tokens: [{ text, tone: 'sub' }], x: 0, y: 0, width: W * 0.6, f: meta, anim: 'up' })];
  const segW = px(14);
  const gap = px(4);
  const segH = px(3);
  const total = Math.min(8, position.total);
  for (let i = 0; i < total; i++) {
    const x = W - (total - i) * segW - (total - i - 1) * gap;
    items.push(rect({ x, y: (lineH(meta) - segH) / 2, w: segW, h: segH, radius: segH / 2, fill: i < position.index ? 'accent' : 'track', anim: 'up' }));
  }
  return { items, y: lineH(meta) + px(20) };
}

/** Một nhãn mono (QUY TRÌNH, Đoán thử…) */
const labelBox = (text, y, width, tone = 'sub') => textBox({ tokens: [{ text, tone }], x: 0, y, width, f: LABEL(), anim: 'up' });

/** Icon tròn ở giữa hộp (vòng tròn đặc + icon/chữ) */
const circle = (x, y, d, fill, anim, delay) => rect({ x, y, w: d, h: d, radius: d / 2, fill, anim, delay });

// ── 6 mẫu đợt 1 ───────────────────────────────────────────────────────────

const LAYOUTS = {
  /** Hook · Con số gây chú ý: số khổng lồ màu nhấn nảy lên, câu trượt lên */
  'hook.number'(W, s) {
    const raw = String(s.so ?? '').trim();
    // Số dài (90%, 1.000) thu cỡ cho vừa bề rộng — cùng công thức ở Remotion và Fabric
    const digit = fitFont(raw, font(MASTER_FONTS.display, 800, px(168), 0.82, -0.06), W, -0.06);
    const items = [textBox({ tokens: [{ text: raw, tone: 'accent' }], x: 0, y: 0, width: W, f: digit, anim: 'pop' })];
    const y = items[0].height + px(18);
    items.push(textBox({
      tokens: [{ text: `${s.dieu ?? ''} khiến bạn`, tone: 'text' }, { text: s.ket_qua, tone: 'accent' }],
      x: 0, y, width: W, f: font(MASTER_FONTS.display, 700, px(25), 1.12, -0.02), anim: 'up', delay: 0.15,
    }));
    return items;
  },

  /** Cầu nối · Ba điều: n hàng, hàng cuối phát sáng viền màu nhấn và mang câu nhấn mạnh */
  'bridge.roadmap_three'(W, s) {
    const n = Math.max(2, Math.min(5, Math.round(Number(s.n) || 3)));
    const items = [textBox({
      tokens: [{ text: `${n} điều, và`, tone: 'text' }, { text: 'điều cuối', tone: 'accent' }, { text: s.nhan_manh, tone: 'text' }],
      x: 0, y: 0, width: W, f: font(MASTER_FONTS.display, 700, px(26), 1.15, -0.02), anim: 'up',
    })];
    let y = items[0].height + px(22);
    const pad = px(14);
    const inner = 22;
    const rowH = pad * 2 + inner;
    const label = font(MASTER_FONTS.mono, 500, px(12), 1.2);
    const barWidths = [1, 0.7, 0.85, 0.6];
    for (let i = 0; i < n; i++) {
      const isLast = i === n - 1;
      const delay = isLast ? 0.2 : 0.3 + i * 0.15;
      items.push(rect({ x: 0, y, w: W, h: rowH, radius: px(12), fill: 'ghost', stroke: 'line', strokeWidth: 1, anim: 'wpop', delay }));
      const idx = String(i + 1).padStart(2, '0');
      const labelW = measure(idx, label);
      items.push(textBox({ tokens: [{ text: idx, tone: isLast ? 'accent' : 'sub' }], x: pad, y: y + (rowH - lineH(label)) / 2, width: labelW + 2, f: label, anim: 'wpop', delay }));
      const cx = pad + labelW + px(12);
      if (isLast) {
        const tf = font(MASTER_FONTS.body, 700, px(14), 1.25);
        items.push(textBox({ tokens: [{ text: s.nhan_manh, tone: 'accent' }], x: cx, y: y + (rowH - lineH(tf)) / 2, width: W - cx - pad, f: tf, anim: 'wpop', delay }));
        // Viền màu nhấn bật sáng sau khi các hàng đã hiện
        items.push(rect({ x: 0, y, w: W, h: rowH, radius: px(12), fill: null, stroke: 'accent', strokeWidth: 2, anim: 'glow', delay: 0.9 }));
      } else {
        const barH = px(10);
        items.push(rect({ x: cx, y: y + (rowH - barH) / 2, w: (W - cx - pad) * barWidths[i % barWidths.length], h: barH, radius: barH / 2, fill: 'track', anim: 'wpop', delay }));
      }
      y += rowH + (isLast ? 0 : px(10));
    }
    return items;
  },

  /** Nội dung · Thẻ ý chính: nhãn vị trí, tiêu đề lớn (cụm sau dấu phẩy màu nhấn), "Vì sao" + lý do */
  'content.key_point'(W, s, position) {
    const header = positionHeader(W, position);
    const items = header.items;
    let y = header.y;
    const head = textBox({ tokens: emphasizeAfterComma(s.y), x: 0, y, width: W, f: font(MASTER_FONTS.display, 800, px(36), 1.04, -0.035), anim: 'pop' });
    items.push(head);
    y += head.height + px(20);
    items.push(rect({ x: 0, y, w: W, h: 1, fill: 'line', anim: 'up', delay: 0.6 }));
    y += 1 + px(14);
    const why = textBox({ tokens: [{ text: 'Vì sao', tone: 'sub' }], x: 0, y, width: W, f: font(MASTER_FONTS.mono, 500, px(10.5), 1.25, 0.1), anim: 'up', delay: 0.6 });
    items.push(why);
    y += why.height + px(6);
    items.push(textBox({ tokens: [{ text: s.ly_do, tone: 'sub' }], x: 0, y, width: W, f: font(MASTER_FONTS.body, 600, px(16), 1.45), anim: 'up', delay: 0.6 }));
    return items;
  },

  /** Giữ chân · Khoan đã (nền màu nhấn): icon tạm dừng + "Khoan." đập vào, câu lý do trượt lên */
  'retention.wait'(W, s) {
    const icon = px(46);
    const big = fitFont('Khoan.', font(MASTER_FONTS.display, 800, px(64), 0.9, -0.05), W - icon - px(14), -0.05);
    const rowH = Math.max(icon, lineH(big));
    const items = [
      { kind: 'icon', name: 'pause', x: 0, y: (rowH - icon) / 2, w: icon, h: icon, tone: 'text', anim: 'slam' },
      textBox({ tokens: [{ text: 'Khoan.', tone: 'text' }], x: icon + px(14), y: (rowH - lineH(big)) / 2, width: W - icon - px(14), f: big, anim: 'slam' }),
    ];
    items.push(textBox({
      tokens: [{ text: `Đây là phần ${s.ly_do ?? ''}`, tone: 'text' }],
      x: 0, y: rowH + px(22), width: W, f: font(MASTER_FONTS.display, 700, px(24), 1.2, -0.02), anim: 'up', delay: 0.45,
    }));
    return items;
  },

  /** Cao trào · Tổng kết: tiêu đề + các hàng đánh số, mục quan trọng nhất viền màu nhấn */
  'climax.summary'(W, s) {
    const list = (Array.isArray(s.muc) ? s.muc : []).map((m) => String(m ?? '').trim()).filter(Boolean).slice(0, 5);
    const keyIdx = Number.isInteger(Number(s.quan_trong_nhat)) && s.quan_trong_nhat >= 1 && s.quan_trong_nhat <= list.length ? s.quan_trong_nhat - 1 : list.length - 1;
    const title = textBox({ tokens: [{ text: s.tieu_de, tone: 'text' }], x: 0, y: 0, width: W, f: font(MASTER_FONTS.display, 700, px(22), 1.15, -0.02), anim: 'up' });
    const items = [title];
    let y = title.height + px(16);
    const padY = px(10);
    const padX = px(12);
    const label = font(MASTER_FONTS.mono, 500, px(12), 1.2);
    list.forEach((m, i) => {
      const isKey = i === keyIdx;
      const delay = 0.1 + i * 0.2;
      const idx = String(i + 1).padStart(2, '0');
      const labelW = measure(idx, label);
      const tx = padX + labelW + px(12);
      const tf = font(MASTER_FONTS.body, isKey ? 700 : 600, px(15), 1.3);
      const lines = wrapRichText([{ text: m, tone: 'text' }], W - tx - padX, tf);
      const rowH = padY * 2 + Math.max(1, lines.length) * lineH(tf);
      items.push(rect({ x: 0, y, w: W, h: rowH, radius: px(10), fill: isKey ? null : 'panel', stroke: isKey ? 'accent' : null, strokeWidth: isKey ? 2 : 0, anim: 'wpop', delay }));
      items.push(textBox({ tokens: [{ text: idx, tone: isKey ? 'accent' : 'sub' }], x: padX, y: y + padY + (lineH(tf) - lineH(label)) / 2, width: labelW + 2, f: label, anim: 'wpop', delay }));
      items.push({ kind: 'text', x: tx, y: y + padY, width: W - tx - padX, height: lines.length * lineH(tf), lines, font: tf, lineHeight: lineH(tf), align: 'left', anim: 'wpop', delay });
      y += rowH + px(8);
    });
    return items;
  },

  /** CTA · Lưu cho sáng mai (nền ngà): dấu trang tô màu từ dưới lên, tiêu đề + lý do căn giữa */
  'cta.save'(W, s) {
    const bw = px(92);
    const bh = px(112);
    const items = [{ kind: 'icon', name: 'bookmark', x: (W - bw) / 2, y: 0, w: bw, h: bh, tone: 'accentFill', anim: 'fill', delay: 0.5 }];
    let y = bh + px(24);
    const title = textBox({ tokens: [{ text: `Lưu lại cho ${s.thoi_diem ?? ''}`, tone: 'text' }], x: 0, y, width: W, f: font(MASTER_FONTS.display, 800, px(32), 1.06, -0.03), align: 'center', anim: 'up', delay: 0.3 });
    items.push(title);
    y += title.height + px(10);
    items.push(textBox({ tokens: [{ text: s.ly_do, tone: 'sub' }], x: 0, y, width: W, f: font(MASTER_FONTS.body, 600, px(15), 1.4), align: 'center', anim: 'up', delay: 0.5 }));
    return items;
  },

  // ── Đợt 2 ───────────────────────────────────────────────────────────────

  /** Hook · Câu hỏi mở: câu hỏi lớn, đuôi câu nằm trong viên thuốc màu nhấn nảy lên */
  'hook.question'(W, s) {
    const f = font(MASTER_FONTS.display, 700, px(31), 1.18, -0.025);
    const q = textBox({ tokens: [{ text: s.cau_hoi, tone: 'text' }], x: 0, y: 0, width: W, f, anim: 'up' });
    const padX = px(10);
    const tail = textBox({ tokens: [{ text: s.nhan_manh, tone: 'onAccentFill' }], x: padX, y: q.height + px(6), width: W - padX * 2, f, anim: 'pop', delay: 0.35 });
    const pill = rect({ x: 0, y: tail.y, w: Math.min(W, textWidth(tail) + padX * 2), h: tail.height, radius: px(10), fill: 'accentFill', anim: 'pop', delay: 0.35 });
    return [q, pill, tail];
  },

  /** Hook · Tưởng vậy mà không phải: khối trên "Mọi người nghĩ" (nhạt), khối dưới "Thực tế" nền màu nhấn */
  'hook.myth'(W, s) {
    const pad = px(18);
    const inner = W - pad * 2;
    const topLabel = labelBox('Mọi người nghĩ', pad, inner);
    topLabel.x = pad;
    const a = textBox({ tokens: [{ text: s.nghi, tone: 'sub' }], x: pad, y: topLabel.y + topLabel.height + px(8), width: inner, f: font(MASTER_FONTS.body, 600, px(21), 1.25), anim: 'up', delay: 0.1 });
    const topH = a.y + a.height + px(22);
    const items = [rect({ x: 0, y: 0, w: W, h: topH, radius: px(16), fill: 'panel', anim: 'up' }), topLabel, a];
    const y0 = topH + px(8);
    const botLabel = textBox({ tokens: [{ text: 'Thực tế', tone: 'onAccentFill' }], x: pad, y: y0 + px(22), width: inner, f: LABEL(), anim: 'up', delay: 0.45 });
    const b = textBox({ tokens: [{ text: s.thuc_te, tone: 'onAccentFill' }], x: pad, y: botLabel.y + botLabel.height + px(8), width: inner, f: font(MASTER_FONTS.display, 800, px(30), 1.05, -0.03), anim: 'up', delay: 0.45 });
    items.push(rect({ x: 0, y: y0, w: W, h: b.y + b.height + px(24) - y0, radius: px(16), fill: 'accentFill', anim: 'up', delay: 0.45 }), botLabel, b);
    return items;
  },

  /** Cầu nối · Các bước: tiêu đề + thanh bước, các chấm sáng dần theo thanh màu nhấn chạy */
  'bridge.steps'(W, s) {
    const steps = (Array.isArray(s.buoc) ? s.buoc : []).map((b) => String(b ?? '').trim()).filter(Boolean).slice(0, 5);
    const n = Math.max(2, steps.length);
    const items = [labelBox('Quy trình', 0, W)];
    const title = textBox({ tokens: [{ text: s.tieu_de, tone: 'text' }], x: 0, y: items[0].height + px(12), width: W, f: font(MASTER_FONTS.display, 700, px(27), 1.15, -0.02), anim: 'up' });
    items.push(title);
    const d = px(24);
    const y = title.y + title.height + px(30);
    const span = W - d;
    const run = 1.8;
    items.push(rect({ x: d / 2, y: y + d / 2 - 1, w: span, h: 2, fill: 'track', anim: 'up', delay: 0.1 }));
    items.push(rect({ x: d / 2, y: y + d / 2 - 1, w: span, h: 2, fill: 'accent', anim: 'grow', delay: 0.2, dur: run }));
    const numF = font(MASTER_FONTS.body, 700, px(11), 1.2);
    const labF = font(MASTER_FONTS.body, 600, n >= 4 ? px(10.5) : px(12), 1.3);
    // Nhãn rộng bằng khoảng cách hai chấm (đầu/cuối: nửa khoảng cách) để không chồng nhau
    const spacing = span / (n - 1);
    const gapL = px(6);
    const edgeW = spacing / 2 + d / 2 - gapL / 2;
    for (let i = 0; i < n; i++) {
      const x = (span * i) / (n - 1);
      const delay = 0.2 + (run * i) / (n - 1);
      items.push(circle(x, y, d, 'track', 'up', 0.1));
      items.push(circle(x, y, d, 'accentFill', 'glow', delay));
      items.push(textBox({ tokens: [{ text: String(i + 1), tone: 'onAccentFill' }], x, y: y + (d - lineH(numF)) / 2, width: d, f: numF, align: 'center', anim: 'glow', delay }));
      // Nhãn: đầu căn trái, cuối căn phải, giữa căn giữa dưới chấm (như justify-between của thiết kế)
      const align = i === 0 ? 'left' : i === n - 1 ? 'right' : 'center';
      const lw = align === 'center' ? spacing - gapL : edgeW;
      const lx = align === 'left' ? 0 : align === 'right' ? W - lw : x + d / 2 - lw / 2;
      items.push(textBox({ tokens: [{ text: steps[i] || '', tone: 'sub' }], x: lx, y: y + d + px(10), width: lw, f: labF, align, anim: 'up', delay }));
    }
    return items;
  },

  /** Cầu nối · Vấn đề và hệ quả: vấn đề (nhạt) → mũi tên → hệ quả lớn, cụm nhấn mạnh màu nhấn */
  'bridge.problem'(W, s) {
    const a = textBox({ tokens: [{ text: s.van_de, tone: 'sub' }], x: 0, y: 0, width: W, f: font(MASTER_FONTS.body, 600, px(21), 1.3), anim: 'up' });
    const aw = px(24);
    const ah = px(40);
    const arrow = { kind: 'icon', name: 'arrowDown', x: 0, y: a.height + px(16), w: aw, h: ah, tone: 'sub', anim: 'up', delay: 0.4 };
    const b = textBox({ tokens: emphasizePhrase(s.he_qua, s.nhan_manh), x: 0, y: arrow.y + ah + px(16), width: W, f: font(MASTER_FONTS.display, 800, px(31), 1.08, -0.03), anim: 'pop', delay: 0.8 });
    return [a, arrow, b];
  },

  /** Nội dung · Nên và không nên: thẻ "Không nên" (nhạt) rồi thẻ "Nên" viền màu nhấn */
  'content.do_dont'(W, s, position) {
    const header = positionHeader(W, position);
    const items = header.items;
    const pad = px(16);
    const card = (y, kind) => {
      const isDo = kind === 'do';
      const delay = isDo ? 1.2 : 0;
      const iconS = px(14);
      // Nhãn chữ nhỏ dùng tông chữ (màu nhấn chỉ ở icon và viền) để đủ tương phản trên mọi bảng màu
      const lab = textBox({ tokens: [{ text: isDo ? 'Nên' : 'Không nên', tone: isDo ? 'text' : 'sub' }], x: pad + iconS + px(8), y: y + pad, width: W - pad * 2 - iconS - px(8), f: LABEL(), anim: 'wpop', delay });
      const icon = { kind: 'icon', name: isDo ? 'check' : 'cross', x: pad, y: lab.y + (lab.height - iconS) / 2, w: iconS, h: iconS, tone: isDo ? 'accent' : 'sub', anim: 'wpop', delay };
      const body = textBox({
        tokens: [{ text: isDo ? s.nen : s.khong_nen, tone: isDo ? 'text' : 'sub' }],
        x: pad, y: lab.y + lab.height + px(8), width: W - pad * 2,
        f: isDo ? font(MASTER_FONTS.display, 800, px(22), 1.2) : font(MASTER_FONTS.body, 600, px(18), 1.35),
        anim: 'wpop', delay,
      });
      const h = body.y + body.height + pad - y;
      const bg = rect({ x: 0, y, w: W, h, radius: px(14), fill: 'panel', stroke: isDo ? 'accent' : null, strokeWidth: isDo ? 2 : 0, anim: 'wpop', delay });
      return { parts: [bg, icon, lab, body], h };
    };
    const dont = card(header.y, 'dont');
    const dos = card(header.y + dont.h + px(10), 'do');
    items.push(...dont.parts, ...dos.parts);
    return items;
  },

  /** Nội dung · Chuỗi nguyên nhân: các ô nối bằng mũi tên, ô cuối nền màu nhấn */
  'content.cause_chain'(W, s, position) {
    const header = positionHeader(W, position);
    const items = header.items;
    const chain = (Array.isArray(s.chuoi) ? s.chuoi : []).map((c) => String(c ?? '').trim()).filter(Boolean).slice(0, 4);
    let y = header.y;
    const aw = px(20);
    const ah = px(26);
    chain.forEach((text, i) => {
      const isLast = i === chain.length - 1;
      const delay = i * 0.9;
      const pad = isLast ? px(16) : px(14);
      const f = isLast ? font(MASTER_FONTS.display, 800, px(22), 1.15) : font(MASTER_FONTS.body, 700, px(19), 1.25);
      const t = textBox({ tokens: [{ text, tone: isLast ? 'onAccentFill' : 'text' }], x: pad, y: y + pad, width: W - pad * 2, f, align: 'center', anim: isLast ? 'pop' : 'wpop', delay });
      items.push(rect({ x: 0, y, w: W, h: t.height + pad * 2, radius: px(14), fill: isLast ? 'accentFill' : 'panel', anim: isLast ? 'pop' : 'wpop', delay }), t);
      y += t.height + pad * 2;
      if (!isLast) {
        items.push({ kind: 'icon', name: 'arrowDownShort', x: (W - aw) / 2, y: y + px(6), w: aw, h: ah, tone: 'sub', anim: 'wpop', delay: delay + 0.6 });
        y += ah + px(12);
      }
    });
    return items;
  },

  /** Giữ chân · Đã qua một nửa: thanh tiến độ chạy tới vị trí hiện tại (tính từ số ý đã qua) + câu hứa */
  'retention.halfway'(W, s, position) {
    const pct = position?.total > 0 ? Math.max(10, Math.min(90, Math.round((position.index / position.total) * 100))) : 50;
    const items = [labelBox('Tiến độ', 0, W)];
    const y = items[0].height + px(10);
    const h = px(14);
    const fx = (W * pct) / 100;
    items.push(rect({ x: 0, y, w: W, h, radius: h / 2, fill: 'track', anim: 'up' }));
    items.push(rect({ x: 0, y, w: fx, h, radius: h / 2, fill: 'accent', anim: 'grow', delay: 0.2, dur: 0.8 }));
    items.push(rect({ x: fx - 1, y: y - px(4), w: 2, h: h + px(8), fill: 'text', anim: 'up' }));
    const meta = META();
    const ly = y + h + px(8);
    const pctText = `${pct}%`;
    const pw = measure(pctText, meta) + 2;
    items.push(textBox({ tokens: [{ text: 'Bắt đầu', tone: 'sub' }], x: 0, y: ly, width: W / 3, f: meta, anim: 'up' }));
    items.push(textBox({ tokens: [{ text: pctText, tone: 'text' }], x: Math.max(0, Math.min(W - pw, fx - pw / 2)), y: ly, width: pw, f: meta, anim: 'up' }));
    items.push(textBox({ tokens: [{ text: 'Hết', tone: 'sub' }], x: W - W / 3, y: ly, width: W / 3, f: meta, align: 'right', anim: 'up' }));
    items.push(textBox({ tokens: emphasizePhrase(s.cau, s.nhan_manh), x: 0, y: ly + lineH(meta) + px(24), width: W, f: font(MASTER_FONTS.display, 800, px(31), 1.06, -0.03), anim: 'up', delay: 0.9 }));
    return items;
  },

  /** Giữ chân · Đoán thử: câu hỏi + các lựa chọn, đáp án khoá tới cảnh cao trào */
  'retention.guess'(W, s) {
    const choices = (Array.isArray(s.lua_chon) ? s.lua_chon : []).map((c) => String(c ?? '').trim()).filter(Boolean).slice(0, 4);
    const items = [labelBox('Đoán thử', 0, W, 'accent')];
    const q = textBox({ tokens: [{ text: s.cau_hoi, tone: 'text' }], x: 0, y: items[0].height + px(10), width: W, f: font(MASTER_FONTS.display, 800, px(28), 1.1, -0.025), anim: 'up' });
    items.push(q);
    const y = q.y + q.height + px(18);
    const chipsH = choiceChips(items, W, y, choices, { delay: 0.3 });
    const ly = y + chipsH + px(16);
    const iconS = px(14);
    const lock = textBox({ tokens: [{ text: 'Đáp án ở cuối video', tone: 'sub' }], x: iconS + px(8), y: ly, width: W - iconS - px(8), f: LABEL(), anim: 'up', delay: 1 });
    items.push({ kind: 'icon', name: 'lock', x: 0, y: ly + (lock.height - iconS) / 2, w: iconS, h: iconS, tone: 'sub', anim: 'up', delay: 1 }, lock);
    return items;
  },

  /** Cao trào · Đáp án: nhắc câu hỏi, lựa chọn sai mờ đi, đáp án đúng sáng màu nhấn, rồi kết quả */
  'climax.answer'(W, s) {
    const choices = (Array.isArray(s.lua_chon) ? s.lua_chon : []).map((c) => String(c ?? '').trim()).filter(Boolean).slice(0, 4);
    const correct = Number(s.dung) - 1;
    const items = [labelBox('Đáp án', 0, W)];
    const q = textBox({ tokens: [{ text: s.cau_hoi, tone: 'sub' }], x: 0, y: items[0].height + px(12), width: W, f: font(MASTER_FONTS.display, 700, px(22), 1.2), anim: 'up' });
    items.push(q);
    const y = q.y + q.height + px(18);
    const chipsH = choiceChips(items, W, y, choices, { size: px(24), correct, revealAt: 1 });
    items.push(textBox({ tokens: emphasizePhrase(s.ket_qua, s.nhan_manh), x: 0, y: y + chipsH + px(20), width: W, f: font(MASTER_FONTS.display, 800, px(28), 1.1, -0.025), anim: 'up', delay: 1.6 }));
    return items;
  },

  /** Cao trào · Một câu cần nhớ (nền ngà): câu chốt kiểu trích dẫn, cụm nhấn mạnh có vạch màu nhấn */
  'climax.key_line'(W, s) {
    const items = [labelBox('Nếu chỉ nhớ một điều', 0, W)];
    const quote = textBox({ tokens: emphasizePhrase(s.cau, s.nhan_manh, 'mark'), x: 0, y: items[0].height + px(18), width: W, f: font('Playfair Display', 700, px(32), 1.15), anim: 'up', delay: 0.2 });
    items.push(...markBars(quote), quote);
    items.push(rect({ x: 0, y: quote.y + quote.height + px(22), w: px(36), h: 2, fill: 'text', anim: 'up', delay: 0.8 }));
    return items;
  },

  /** CTA · Gửi cho một người: lời nhắn + hàng bạn → máy bay giấy → người nhận, lợi ích bên dưới */
  'cta.share'(W, s) {
    const head = textBox({ tokens: [{ text: 'Gửi cho', tone: 'text' }, { text: s.nguoi, tone: 'accent' }], x: 0, y: 0, width: W, f: font(MASTER_FONTS.display, 800, px(31), 1.06, -0.03), anim: 'up' });
    const items = [head];
    const d = px(52);
    const y = head.height + px(28);
    const gap = px(14);
    const meF = font(MASTER_FONTS.display, 800, px(18), 1.1);
    items.push(circle(0, y, d, 'text', 'up', 0.15));
    items.push(textBox({ tokens: [{ text: 'B', tone: 'bg' }], x: 0, y: y + (d - lineH(meF)) / 2, width: d, f: meF, align: 'center', anim: 'up', delay: 0.15 }));
    const planeBox = px(56);
    const ps = px(34);
    const px0 = d + gap;
    items.push({ kind: 'icon', name: 'plane', x: px0 + (planeBox - ps) / 2, y: y + (d - ps) / 2, w: ps, h: ps, tone: 'accent', anim: 'pop', delay: 0.3 });
    const lineX = px0 + planeBox + gap;
    const lineEnd = W - d - gap;
    const dash = px(6);
    for (let x = lineX; x + dash <= lineEnd; x += dash * 2) items.push(rect({ x, y: y + d / 2 - 1, w: dash, h: 2, fill: 'track', anim: 'up', delay: 0.4 }));
    items.push(circle(W - d, y, d, 'panel', 'up', 0.5));
    const us = px(22);
    items.push({ kind: 'icon', name: 'user', x: W - d + (d - us) / 2, y: y + (d - us) / 2, w: us, h: us, tone: 'sub', anim: 'up', delay: 0.5 });
    items.push(textBox({ tokens: [{ text: s.loi_ich, tone: 'sub' }], x: 0, y: y + d + px(18), width: W, f: font(MASTER_FONTS.body, 600, px(15), 1.4), anim: 'up', delay: 0.6 }));
    return items;
  },

  /** CTA · Bạn chọn số mấy?: câu hỏi + ô số 1…n (n = số ý), một ô sáng lên, nhắc trả lời bằng bình luận */
  'cta.pick_number'(W, s) {
    const n = Math.max(2, Math.min(5, Math.round(Number(s.n) || 3)));
    const head = textBox({ tokens: [{ text: s.cau, tone: 'text' }], x: 0, y: 0, width: W, f: font(MASTER_FONTS.display, 800, px(30), 1.06, -0.03), anim: 'up' });
    const items = [head];
    const gap = px(8);
    const size = (W - gap * 4) / 5;
    const y = head.height + px(22);
    const numF = font(MASTER_FONTS.display, 800, px(24), 1.1);
    const pick = Math.min(2, n) - 1;
    for (let i = 0; i < n; i++) {
      const x = i * (size + gap);
      const ty = y + (size - lineH(numF)) / 2;
      const num = (tone, anim, delay) => textBox({ tokens: [{ text: String(i + 1), tone }], x, y: ty, width: size, f: numF, align: 'center', anim, delay });
      items.push(rect({ x, y, w: size, h: size, radius: px(12), fill: 'panel', anim: 'wpop', delay: 0.1 + i * 0.08 }));
      if (i === pick) {
        // Số gốc tắt khi ô được chọn sáng lên (outAt) — canvas chỉ vẽ trạng thái cuối
        items.push({ ...num('text', 'wpop', 0.1 + i * 0.08), outAt: 1.1 });
        items.push(rect({ x, y, w: size, h: size, radius: px(12), fill: 'accentFill', anim: 'glow', delay: 1.1 }), num('onAccentFill', 'glow', 1.1));
      } else {
        items.push(num('text', 'wpop', 0.1 + i * 0.08));
      }
    }
    const ry = y + size + px(18);
    const is = px(18);
    const bodyF = font(MASTER_FONTS.body, 600, px(15), 1.4);
    items.push({ kind: 'icon', name: 'comment', x: 0, y: ry + (lineH(bodyF) - is) / 2, w: is, h: is, tone: 'sub', anim: 'up', delay: 0.8 });
    items.push(textBox({ tokens: [{ text: 'Trả lời bằng một con số bên dưới', tone: 'sub' }], x: is + px(8), y: ry, width: W - is - px(8), f: bodyF, anim: 'up', delay: 0.8 }));
    return items;
  },
};

/**
 * Ô lựa chọn (Đoán thử / Đáp án) — ghi item vào `items`, trả về chiều cao của cả khối ô.
 * correct ≥ 0: ô đó sáng màu nhấn, ô khác mờ đi tại revealAt giây.
 */
const CHIP_MIN_SIZE = px(16);

function choiceChips(items, W, y, choices, { size = px(22), delay = 0, correct = -1, revealAt = 0 } = {}) {
  // 2–3 lựa chọn một hàng; 4 lựa chọn lưới 2×2 để chữ không phải xuống dòng nhiều
  const n = Math.max(1, choices.length);
  const cols = n === 4 ? 2 : n;
  const gap = px(8);
  const w = (W - gap * (cols - 1)) / cols;
  const padY = px(14);
  // Một cỡ chữ cho cả hàng: cỡ lớn nhất mà lựa chọn dài nhất vẫn vừa một dòng, nhưng không nhỏ hơn
  // CHIP_MIN_SIZE — lựa chọn dài hơn thì xuống dòng trong ô
  const base = font(MASTER_FONTS.display, 800, size, 1.15, -0.02);
  const fitted = choices.reduce((f, c) => {
    const fit = fitFont(c, base, w - px(12), -0.02);
    return fit.size < f.size ? fit : f;
  }, base);
  const shared = fitted.size >= CHIP_MIN_SIZE ? fitted : font(MASTER_FONTS.display, 800, CHIP_MIN_SIZE, 1.15, -0.02);
  const fonts = choices.map(() => shared);
  const lineCount = Math.max(1, ...choices.map((c) => wrapRichText([{ text: c, tone: 'text' }], w - px(12), shared).length));
  const h = padY * 2 + lineCount * lineH(shared);
  const rows = Math.ceil(n / cols);
  choices.forEach((c, i) => {
    const x = (i % cols) * (w + gap);
    const cy = y + Math.floor(i / cols) * (h + gap);
    const d = delay + i * 0.15;
    const lose = correct >= 0 && i !== correct;
    const f = fonts[i];
    const lines = wrapRichText([{ text: c, tone: 'text' }], w - px(12), f).length || 1;
    const ty = cy + (h - lines * lineH(f)) / 2;
    const chipText = (tone, anim, at) => textBox({ tokens: [{ text: c, tone }], x: x + px(6), y: ty, width: w - px(12), f, align: 'center', anim, delay: at });
    if (correct < 0) {
      items.push(rect({ x, y: cy, w, h, radius: px(12), fill: 'panel', anim: 'wpop', delay: d }), chipText('text', 'wpop', d));
      return;
    }
    // Đáp án: ô sai nền mờ đi, chữ chuyển sang tông phụ; ô đúng sáng màu nhấn. Chữ gốc tắt dần để canvas vẽ trạng thái cuối
    items.push(rect({ x, y: cy, w, h, radius: px(12), fill: 'panel', anim: lose ? 'dim' : 'up', delay: lose ? revealAt : 0 }));
    if (lose) items.push(chipText('sub', 'glow', revealAt));
    else items.push(rect({ x, y: cy, w, h, radius: px(12), fill: 'accentFill', anim: 'glow', delay: revealAt }), chipText('onAccentFill', 'glow', revealAt));
    items.push({ ...chipText('text', 'up', 0), outAt: revealAt });
  });
  return rows * h + (rows - 1) * gap;
}

export const MASTER_SCENE_TEMPLATE_IDS = Object.keys(LAYOUTS);

/**
 * Bố cục của một element master-scene.
 * @param {{ width?: number, masterSceneData?: { templateId?: string, slots?: object, position?: { index: number, total: number, label?: string } } }} el
 * @returns {{ templateId: string, width: number, height: number, items: any[] }}
 */
export function layoutMasterScene(el) {
  const data = el?.masterSceneData || {};
  const templateId = LAYOUTS[data.templateId] ? data.templateId : 'content.key_point';
  const width = Math.max(MASTER_SCENE_MIN_WIDTH, Number(el?.width) || MASTER_SCENE_DEFAULT_WIDTH);
  const raw = LAYOUTS[templateId](width, data.slots || {}, data.position);
  // Mép trên/dưới thực tế: chữ có khoảng cách dòng hẹp tính cả phần nét tràn khỏi hộp dòng
  const top = (it) => (it.kind === 'text' && it.lines.length ? it.y - glyphSpill(it.font) : it.y);
  const bottom = (it) => (it.kind === 'text' && it.lines.length ? it.y + it.height + glyphSpill(it.font) : it.y + (it.height ?? it.h ?? 0));
  const shift = Math.max(0, -Math.min(0, ...raw.map(top)));
  const items = shift ? raw.map((it) => ({ ...it, y: it.y + shift })) : raw;
  const height = Math.ceil(Math.max(0, ...items.map(bottom)));
  return { templateId, width, height, items };
}

/** H = f(X) cho layoutRegistry.calculateElementDynamicHeight */
export function masterSceneHeight(el) {
  return layoutMasterScene(el).height;
}
