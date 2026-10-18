import * as fabric from 'fabric';
import { SceneElement, VocabCardData } from '@/types/scene';
import { getFabricThemeColors, mixColors } from './colorUtils';

const FONT = 'Be Vietnam Pro';

/** Cắt Textbox còn tối đa n dòng (thêm …) */
function clampLines(tb: fabric.Textbox, n: number) {
  const lines: string[] = (tb as any).textLines || [];
  if (lines.length <= n) return;
  const kept = lines.slice(0, n);
  kept[n - 1] = kept[n - 1].replace(/\s*\S{0,3}$/, '') + '…';
  tb.set({ text: kept.join(' ') });
  tb.initDimensions();
}

/**
 * Dedicated Fabric 2D Vector Renderer for Vocab Flashcard Elements
 * Khớp VocabCardElement (trạng thái đầy đủ): thẻ var(--card-bg) viền accent 20%, chip CEFR + chip giọng đọc,
 * từ khoá 28px màu --text, pill từ loại · IPA, vạch hairline, "Ý NGHĨA" + nghĩa Việt/Anh, hộp ví dụ nếu còn chỗ.
 * Chữ nhỏ màu accent dùng color-mix(accent 80%, --text) như video.
 * Coordinates are centered horizontally around x = 0 ([-halfW, halfW]) with top = 0.
 */
export function buildVocabCardFabricObjects(
  el: SceneElement,
  accent: string,
  w: number,
  h: number
): fabric.FabricObject[] {
  const objects: fabric.FabricObject[] = [];
  const themeColors = getFabricThemeColors(el);
  w = Math.max(280, w);
  h = Math.max(280, h);
  const halfW = w / 2;
  const accentColor = accent && accent.startsWith('#') ? accent : themeColors.accent;
  const accentInk = mixColors(accentColor, 80, themeColors.text);

  const data: VocabCardData = (el as any).vocabData || {
    word: el.content || 'CRUCIAL',
    partOfSpeech: 'adj',
    ipa: '/ˈkruː.ʃəl/',
    audioAccent: 'UK',
    cefrLevel: 'IELTS 7.0+',
    meaningVi: 'Cực kỳ quan trọng, có tính quyết định',
    meaningEn: 'Extremely important or necessary',
    exampleEn: 'Regular exercise plays a crucial role in maintaining good health.',
    exampleVi: 'Tập thể dục đều đặn đóng vai trò cực kỳ quan trọng đối với sức khỏe.',
  };

  const PAD_X = 18;
  const PAD_TOP = 16;
  const PAD_BOTTOM = 24;
  const GAP = 12;
  const left = -halfW + PAD_X;
  const innerW = w - PAD_X * 2;
  const bottom = h - PAD_BOTTOM;

  // 1. Flashcard Container
  objects.push(new fabric.Rect({
    left: 0, top: 0, width: w, height: h,
    fill: themeColors.cardBg,
    stroke: mixColors(accentColor, 20),
    strokeWidth: 1.5,
    rx: 16, ry: 16,
    originX: 'center', originY: 'top',
  } as any));

  let curY = PAD_TOP;

  // 2. Header: chip CEFR (accent 9%, viền 27%, chữ accentInk) · chip giọng đọc (--surface-1)
  const CHIP_H = 20;
  const cefrText = new fabric.IText((data.cefrLevel || 'IELTS 7.0+').toUpperCase(), {
    left: left + 8, top: curY + CHIP_H / 2,
    fontSize: 10, fontWeight: '800', fill: accentInk, charSpacing: 40,
    fontFamily: FONT, originX: 'left', originY: 'center', selectable: false,
  } as any);
  objects.push(new fabric.Rect({
    left, top: curY, width: (cefrText.width || 0) + 16, height: CHIP_H,
    fill: mixColors(accentColor, 9), stroke: mixColors(accentColor, 27), strokeWidth: 1,
    rx: 6, ry: 6, originX: 'left', originY: 'top',
  } as any));
  objects.push(cefrText);

  const audioText = new fabric.IText(data.audioAccent || 'UK', {
    left: halfW - PAD_X - 8, top: curY + CHIP_H / 2,
    fontSize: 10, fontWeight: '700', fill: themeColors.text,
    fontFamily: FONT, originX: 'right', originY: 'center', selectable: false,
  } as any);
  const audioW = (audioText.width || 0) + 16 + 18;
  objects.push(new fabric.Rect({
    left: halfW - PAD_X, top: curY, width: audioW, height: CHIP_H,
    fill: themeColors.surface1, stroke: themeColors.border, strokeWidth: 1,
    rx: 6, ry: 6, originX: 'right', originY: 'top',
  } as any));
  // Biểu tượng loa (SVG vector, stroke accent)
  const spkX = halfW - PAD_X - audioW + 8;
  const spkY = curY + CHIP_H / 2;
  objects.push(new fabric.Path(
    `M ${spkX} ${spkY - 2} L ${spkX + 3} ${spkY - 2} L ${spkX + 6} ${spkY - 5} L ${spkX + 6} ${spkY + 5} L ${spkX + 3} ${spkY + 2} L ${spkX} ${spkY + 2} Z M ${spkX + 8} ${spkY - 3} Q ${spkX + 10.5} ${spkY} ${spkX + 8} ${spkY + 3}`,
    { fill: '', stroke: accentColor, strokeWidth: 1.5, strokeLineJoin: 'round', strokeLineCap: 'round', selectable: false } as any,
  ));
  objects.push(audioText);
  curY += CHIP_H + GAP;

  // 3. Từ khoá (28px / 900, --text, in hoa)
  curY += 4;
  let wordStr = (data.word || el.content || 'VOCABULARY').toUpperCase();
  const maxWordChars = Math.max(4, Math.floor(innerW / 20));
  if (wordStr.length > maxWordChars) wordStr = wordStr.slice(0, maxWordChars - 1) + '…';
  const WORD_FS = 28;
  objects.push(new fabric.IText(wordStr, {
    left: 0, top: curY,
    fontSize: WORD_FS, fontWeight: '900', fill: themeColors.text, charSpacing: 40, lineHeight: 1.1,
    fontFamily: FONT, originX: 'center', originY: 'top', selectable: false,
  } as any));
  curY += Math.round(WORD_FS * 1.1) + 6;

  // Pill từ loại · IPA (--surface-1, bo tròn, căn giữa như video)
  const posText = new fabric.IText((data.partOfSpeech || 'adj').toLowerCase(), {
    top: curY + 11,
    fontSize: 10.5, fontWeight: '800', fontStyle: 'italic', fill: accentInk,
    fontFamily: FONT, originX: 'left', originY: 'center', selectable: false,
  } as any);
  const posW = posText.width || 0;
  const ipaText = new fabric.IText(data.ipa || '/ˈkruː.ʃəl/', {
    top: curY + 11,
    fontSize: 12, fontWeight: '600', fill: themeColors.textSub,
    fontFamily: 'monospace', originX: 'left', originY: 'center', selectable: false,
  } as any);
  const pillW = Math.min(innerW, posW + (ipaText.width || 0) + 36);
  const pillLeft = -pillW / 2;
  posText.set({ left: pillLeft + 10 });
  ipaText.set({ left: pillLeft + 10 + posW + 16 });
  objects.push(new fabric.Rect({
    left: pillLeft, top: curY, width: pillW, height: 22,
    fill: themeColors.surface1, stroke: themeColors.border, strokeWidth: 1,
    rx: 11, ry: 11, originX: 'left', originY: 'top',
  } as any));
  objects.push(posText);
  objects.push(new fabric.Circle({
    left: pillLeft + 10 + posW + 8, top: curY + 11, radius: 1.5, fill: themeColors.textSub,
    originX: 'center', originY: 'center',
  } as any));
  objects.push(ipaText);
  curY += 22 + 4 + GAP;

  // 4. Divider
  objects.push(new fabric.Rect({
    left: 0, top: curY, width: innerW, height: 1, fill: themeColors.border, originX: 'center', originY: 'top',
  } as any));
  curY += 1 + GAP;

  // 5. Ý NGHĨA + nghĩa tiếng Việt (14.5 / 700) + nghĩa tiếng Anh (11.5 italic, --text-sub)
  objects.push(new fabric.IText('Ý NGHĨA', {
    left, top: curY,
    fontSize: 9.5, fontWeight: '800', fill: accentInk, charSpacing: 80,
    fontFamily: FONT, originX: 'left', originY: 'top', selectable: false,
  } as any));
  curY += 12 + 3;

  const meaning = new fabric.Textbox(data.meaningVi || 'Định nghĩa từ vựng', {
    left, top: curY, width: innerW,
    fontSize: 14.5, fontWeight: '700', lineHeight: 1.3, fill: themeColors.text,
    fontFamily: FONT, originX: 'left', originY: 'top', selectable: false,
  } as any);
  clampLines(meaning, 2);
  objects.push(meaning);
  curY += (meaning.height || 18) + 3;

  if (data.meaningEn && curY + 16 <= bottom) {
    const en = new fabric.Textbox(`"${data.meaningEn}"`, {
      left, top: curY, width: innerW,
      fontSize: 11.5, fontStyle: 'italic', fontWeight: '400', lineHeight: 1.2, fill: themeColors.textSub,
      fontFamily: FONT, originX: 'left', originY: 'top', selectable: false,
    } as any);
    clampLines(en, 1);
    objects.push(en);
    curY += (en.height || 15);
  }
  curY += GAP;

  // 6. Hộp ví dụ (--surface-1) nếu còn chỗ trong thẻ
  if (data.exampleEn) {
    const exText = new fabric.Textbox(`"${data.exampleEn}"`, {
      left: left + 12, top: 0, width: innerW - 24,
      fontSize: 12.5, fontWeight: '400', lineHeight: 1.3, fill: themeColors.text,
      fontFamily: FONT, originX: 'left', originY: 'top', selectable: false,
    } as any);
    clampLines(exText, 2);
    const boxH = 10 + 11 + 5 + (exText.height || 16) + 10;
    if (curY + boxH <= bottom) {
      objects.push(new fabric.Rect({
        left, top: curY, width: innerW, height: boxH,
        fill: themeColors.surface1, stroke: themeColors.border, strokeWidth: 1,
        rx: 8, ry: 8, originX: 'left', originY: 'top',
      } as any));
      objects.push(new fabric.IText('VÍ DỤ NGỮ CẢNH', {
        left: left + 12, top: curY + 10,
        fontSize: 9, fontWeight: '800', fill: themeColors.textSub, charSpacing: 80,
        fontFamily: FONT, originX: 'left', originY: 'top', selectable: false,
      } as any));
      exText.set({ top: curY + 10 + 11 + 5 });
      objects.push(exText);
    }
  }

  return objects;
}
