import * as fabric from 'fabric';
import { SceneElement } from '@/types/scene';
import { InteractiveQuizData, QuizOptionItem } from '@/types/stem';
import { getFabricThemeColors, mixColors, onAccentFor } from './colorUtils';

const FONT = 'Be Vietnam Pro';

/** Cắt Textbox còn tối đa n dòng (thêm …) để khung không vượt chiều cao thẻ */
function clampLines(tb: fabric.Textbox, n: number) {
  const lines: string[] = (tb as any).textLines || [];
  if (lines.length <= n) return;
  const kept = lines.slice(0, n);
  kept[n - 1] = kept[n - 1].replace(/\s*\S{0,3}$/, '') + '…';
  tb.set({ text: kept.join(' ') });
  tb.initDimensions();
}

/**
 * Dedicated Fabric 2D Vector Renderer for Interactive Quiz Elements
 * Vẽ trạng thái "mở đáp án" của InteractiveQuizElement: thẻ var(--card-bg), chip danh mục, nhãn ĐÁP ÁN ĐÚNG
 * (accent + on-accent), thanh tiến độ, câu hỏi, các phương án (sai = chữ --text-sub, không giảm opacity)
 * và lời giải thích nếu còn chỗ. Coordinates are centered horizontally around x = 0 with top = 0.
 */
export function buildInteractiveQuizFabricObjects(
  el: SceneElement,
  accent: string,
  w: number,
  h: number
): fabric.FabricObject[] {
  const objects: fabric.FabricObject[] = [];
  const themeColors = getFabricThemeColors(el);
  w = Math.max(260, w);
  h = Math.max(240, h);
  const halfW = w / 2;
  const accentColor = accent && accent.startsWith('#') ? accent : themeColors.accent;
  const onAccent = onAccentFor(accentColor, themeColors);

  // Mặc định giống InteractiveQuizElement
  const data: InteractiveQuizData = (el as any).quizData || {
    quizType: 'single-choice',
    badge: 'THỬ THÁCH 5S',
    question: el.content || 'Kim loại nào sau đây dẫn điện tốt nhất?',
    options: [
      { id: 'A', text: 'Nhôm (Al)' },
      { id: 'B', text: 'Đồng (Cu)' },
      { id: 'C', text: 'Bạc (Ag)' },
      { id: 'D', text: 'Vàng (Au)' },
    ],
    correctAnswers: ['C'],
    countdownSec: 5,
    explanation: 'Bạc (Ag) dẫn điện tốt nhất trong các kim loại, tiếp theo là Đồng, Vàng và Nhôm.',
    showExplanation: true,
  };
  const correctAnswers = data.correctAnswers || (data.correctId ? [data.correctId] : ['C']);
  const isGrid = data.layoutVariant === 'grid-2x2';

  const PAD_X = 16;
  const PAD_Y = 14;
  const GAP = 10;
  const innerW = w - PAD_X * 2;
  const left = -halfW + PAD_X;

  // 1. Card (var(--card-bg) + viền var(--border), bo 16)
  objects.push(new fabric.Rect({
    left: 0, top: 0, width: w, height: h,
    fill: themeColors.cardBg,
    stroke: themeColors.border,
    strokeWidth: 1,
    rx: 16, ry: 16,
    originX: 'center', originY: 'top',
  } as any));

  let curY = PAD_Y;

  // 2. Header: chip danh mục (nền accent 15%, chữ --text) · nhãn ĐÁP ÁN ĐÚNG (nền accent, chữ on-accent)
  const HEADER_H = 22;
  const badgeStr = (!data.badge || data.badge === 'THỬ THÁCH 5S'
    ? `THỬ THÁCH ${data.countdownSec || 5}S`
    : data.badge).toUpperCase();
  const badgeText = new fabric.IText(badgeStr, {
    left: left + 9, top: curY + HEADER_H / 2,
    fontSize: 10, fontWeight: '800', fill: themeColors.text, charSpacing: 40,
    fontFamily: FONT, originX: 'left', originY: 'center', selectable: false,
  } as any);
  objects.push(new fabric.Rect({
    left, top: curY + 1, width: (badgeText.width || 0) + 18, height: HEADER_H - 2,
    fill: mixColors(accentColor, 15), stroke: mixColors(accentColor, 35), strokeWidth: 1,
    rx: 6, ry: 6, originX: 'left', originY: 'top',
  } as any));
  objects.push(badgeText);

  const revealText = new fabric.IText('ĐÁP ÁN ĐÚNG', {
    left: halfW - PAD_X - 8, top: curY + HEADER_H / 2,
    fontSize: 11, fontWeight: '800', fill: onAccent,
    fontFamily: FONT, originX: 'right', originY: 'center', selectable: false,
  } as any);
  const revealW = (revealText.width || 0) + 16 + 16;
  objects.push(new fabric.Rect({
    left: halfW - PAD_X, top: curY, width: revealW, height: HEADER_H,
    fill: accentColor, strokeWidth: 0, rx: 6, ry: 6, originX: 'right', originY: 'top',
  } as any));
  const checkX = halfW - PAD_X - revealW + 8;
  objects.push(new fabric.Polyline(
    [{ x: checkX, y: curY + 11 }, { x: checkX + 3.5, y: curY + 14.5 }, { x: checkX + 10, y: curY + 7.5 }],
    { fill: '', stroke: onAccent, strokeWidth: 2, strokeLineCap: 'round', strokeLineJoin: 'round', selectable: false } as any,
  ));
  objects.push(revealText);
  curY += HEADER_H + GAP;

  // 3. Thanh tiến độ (đầy ở pha mở đáp án)
  objects.push(new fabric.Rect({
    left, top: curY, width: innerW, height: 3, fill: accentColor, rx: 2, ry: 2, originX: 'left', originY: 'top',
  } as any));
  curY += 3 + GAP;

  // 4. Câu hỏi (13.5px, đậm, lineHeight 1.45)
  const question = new fabric.Textbox(data.question || el.content || 'Câu hỏi trắc nghiệm', {
    left, top: curY, width: innerW,
    fontSize: 13.5, fontWeight: '700', lineHeight: 1.45, fill: themeColors.text,
    fontFamily: FONT, originX: 'left', originY: 'top', selectable: false,
    splitByGrapheme: false,
  } as any);
  clampLines(question, 3);
  objects.push(question);
  curY += (question.height || 20) + GAP;

  // 5. Phương án
  const optionsList: QuizOptionItem[] = (data.options && data.options.length > 0 ? data.options : []).slice(0, 4);
  const EXPL_FS = 10.5;
  const explanation = data.showExplanation !== false && data.explanation ? String(data.explanation) : '';
  const bottom = h - PAD_Y;
  const rowsCount = isGrid ? Math.ceil(optionsList.length / 2) : optionsList.length;
  const OPT_GAP = 7;
  const naturalOptH = 36;
  const explH = explanation ? Math.ceil(EXPL_FS * 1.4) * 2 + 12 : 0;
  const roomWithExpl = bottom - curY - (explanation ? explH + GAP : 0);
  const showExpl = Boolean(explanation) && roomWithExpl >= rowsCount * 28 + (rowsCount - 1) * OPT_GAP;
  const optAreaH = bottom - curY - (showExpl ? explH + GAP : 0);
  const optH = Math.max(24, Math.min(naturalOptH, Math.floor((optAreaH - (rowsCount - 1) * OPT_GAP) / Math.max(1, rowsCount))));
  const colW = isGrid ? (innerW - OPT_GAP) / 2 : innerW;

  optionsList.forEach((opt, idx) => {
    const col = isGrid ? idx % 2 : 0;
    const row = isGrid ? Math.floor(idx / 2) : idx;
    const x = left + col * (colW + OPT_GAP);
    const y = curY + row * (optH + OPT_GAP);
    if (y + optH > bottom + 0.5) return;
    const isCorrect = correctAnswers.includes(opt.id);

    objects.push(new fabric.Rect({
      left: x, top: y, width: colW, height: optH,
      fill: isCorrect ? mixColors(accentColor, 18) : 'transparent',
      stroke: isCorrect ? accentColor : themeColors.border,
      strokeWidth: isCorrect ? 1.5 : 1,
      rx: 10, ry: 10, originX: 'left', originY: 'top',
    } as any));

    // Ô chữ cái A/B/C/D (22px, bo 6)
    const box = Math.min(22, optH - 8);
    const boxX = x + 12;
    const midY = y + optH / 2;
    objects.push(new fabric.Rect({
      left: boxX, top: midY, width: box, height: box,
      fill: isCorrect ? accentColor : themeColors.surface1,
      rx: 6, ry: 6, originX: 'left', originY: 'center',
    } as any));
    objects.push(new fabric.IText(String(opt.id || String.fromCharCode(65 + idx)), {
      left: boxX + box / 2, top: midY,
      fontSize: 11, fontWeight: '900',
      fill: isCorrect ? onAccent : themeColors.textSub,
      fontFamily: FONT, originX: 'center', originY: 'center', selectable: false,
    } as any));

    // Chữ phương án: sai → --text-sub (khớp video, không làm mờ cả khối)
    const textX = boxX + box + 10;
    const textMaxW = x + colW - 12 - (isCorrect ? 22 : 0) - textX;
    let textStr = opt.text || `Đáp án ${opt.id}`;
    const maxChars = Math.max(4, Math.floor(textMaxW / 6.4));
    if (textStr.length > maxChars) textStr = textStr.slice(0, maxChars - 1) + '…';
    objects.push(new fabric.IText(textStr, {
      left: textX, top: midY,
      fontSize: 12, fontWeight: isCorrect ? '700' : '500',
      fill: isCorrect ? themeColors.text : themeColors.textSub,
      fontFamily: FONT, originX: 'left', originY: 'center', selectable: false,
    } as any));

    if (isCorrect) {
      const cx = x + colW - 12 - 15;
      objects.push(new fabric.Polyline(
        [{ x: cx + 2, y: midY }, { x: cx + 6, y: midY + 4 }, { x: cx + 13, y: midY - 4 }],
        { fill: '', stroke: accentColor, strokeWidth: 2.5, strokeLineCap: 'round', strokeLineJoin: 'round', selectable: false } as any,
      ));
    }
  });

  // 6. Lời giải thích (nền --surface-1, gạch trái accent, chữ --text-sub)
  if (showExpl) {
    const ey = bottom - explH;
    objects.push(new fabric.Rect({
      left, top: ey, width: innerW, height: explH, fill: themeColors.surface1, rx: 8, ry: 8, originX: 'left', originY: 'top',
    } as any));
    objects.push(new fabric.Rect({
      left, top: ey, width: 3, height: explH, fill: accentColor, originX: 'left', originY: 'top',
    } as any));
    const expl = new fabric.Textbox(explanation, {
      left: left + 13, top: ey + 6, width: innerW - 26,
      fontSize: EXPL_FS, fontWeight: '500', lineHeight: 1.25, fill: themeColors.textSub,
      fontFamily: FONT, originX: 'left', originY: 'top', selectable: false,
    } as any);
    clampLines(expl, 2);
    objects.push(expl);
  }

  return objects;
}
