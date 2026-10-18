import * as fabric from 'fabric';
import { SceneElement } from '@/types/scene';
import { ELEMENT_BOX_SPECS } from '@/config/layoutRegistry';
import { DEFAULT_TERMINAL_CODE } from '@/config/widgetDefaults';
import { getFabricThemeColors, resolveColor, mixColors } from './colorUtils';
import { ellipsizeToWidth, measureTextWidth } from './chartTextUtils';
import { text, themeShadow, boundsRect, centerOnOrigin, FS_MULT, FONT } from './fabricTextKit';

const MONO = 'Fira Code';

/**
 * Ngắt một dòng code như `white-space: pre-wrap; word-break: break-word` trong `cols` ký tự đơn cách
 * (cùng quy tắc monoWrapLines của công thức chiều cao): ngắt ở khoảng trắng, từ dài hơn dòng cắt theo ký tự.
 */
function wrapMono(line: string, cols: number): string[] {
  const tokens = line.match(/\s+|\S+/g) || [''];
  const out: string[] = [];
  let cur = '';
  for (const tok of tokens) {
    const chars = Array.from(tok);
    if (/^\s/.test(tok)) { cur += tok; continue; }
    if (Array.from(cur.trimEnd()).length > 0 && Array.from(cur).length + chars.length > cols) {
      out.push(cur.trimEnd());
      cur = '';
    }
    if (chars.length > cols) {
      let rest = chars;
      if (cur) { out.push(cur); cur = ''; }
      while (rest.length > cols) { out.push(rest.slice(0, cols).join('')); rest = rest.slice(cols); }
      cur = rest.join('');
    } else {
      cur += tok;
    }
  }
  out.push(cur);
  return out;
}

/**
 * Cửa sổ terminal trên canvas — khớp CodeTerminalElement (Remotion) ở khung cuối (gõ xong, không con trỏ):
 * thẻ --card-bg viền accent 30% · titlebar --surface-1 (3 chấm, tên file, nhãn ngôn ngữ) · thân code Fira Code 11/1.5.
 */
export function buildCodeTerminalFabricObjects(
  el: SceneElement,
  _accent: string,
  _w: number,
  _h: number
): fabric.FabricObject[] {
  const S = ELEMENT_BOX_SPECS['code-terminal'];
  const tc = getFabricThemeColors(el);
  const C = (c: unknown, fb: string) => resolveColor(c as string, tc.vars) || fb;
  const W = el.width || S.defaultWidth;
  const X0 = -W / 2;
  const showBg = el.showCardBg !== false;
  const accent = C(el.accentColor || el.color, tc.accent);
  const codeData = el.codeData || { filename: 'main.ts', language: 'TypeScript', code: el.content || DEFAULT_TERMINAL_CODE };
  const code = String(codeData.code || '');
  const b = showBg ? S.borderW : 0;
  const body: fabric.FabricObject[] = [];

  // 1. Titlebar: padding 8/12, viền dưới hairline
  const headerH = S.headerH;
  const hcy = b + (headerH - 1) / 2;
  if (showBg) {
    body.push(new fabric.Rect({
      left: X0 + b, top: b, width: W - 2 * b, height: headerH - 1, fill: tc.surface1, originX: 'left', originY: 'top',
      // bo theo góc thẻ (overflow: hidden)
      clipPath: new fabric.Rect({ left: 0, top: 6, width: W - 2 * b, height: headerH + 12, rx: 13, ry: 13, originX: 'center', originY: 'center' }),
    }));
  }
  body.push(new fabric.Line([X0 + b, b + headerH - 0.5, X0 + W - b, b + headerH - 0.5], { stroke: tc.border, strokeWidth: 1 }));
  ['#FF5F56', '#FFBD2E', '#27C93F'].forEach((c, i) => body.push(new fabric.Circle({
    left: X0 + b + 12 + 4.5 + i * 15, top: hcy, radius: 4.5, fill: c, originX: 'center', originY: 'center',
  })));
  const lang = String(codeData.language || 'CODE');
  const font = el.fontFamily || FONT;
  const langW = measureTextWidth(lang, 8.5, 800, font) + 14;
  const langH = 8.5 * 1.26 + 6;
  const rx = X0 + W - b - 12;
  body.push(new fabric.Rect({
    left: rx - 0.5, top: hcy, width: langW - 1, height: langH - 1, rx: 4, ry: 4, originX: 'right', originY: 'center',
    fill: mixColors(accent, 15), stroke: mixColors(accent, 30), strokeWidth: 1,
  }));
  body.push(text(lang, { left: rx - langW / 2, top: hcy, size: 8.5, weight: 800, fill: mixColors(accent, 70, tc.text), family: font, originX: 'center' }));
  // Tên file căn giữa phần còn lại (space-between: 3 chấm 39 · tên · nhãn)
  const dotsR = X0 + b + 12 + 39;
  const fnMax = rx - langW - dotsR - 8;
  const fn = ellipsizeToWidth(String(codeData.filename || 'script.ts'), fnMax, 10.5, 700, MONO);
  const fnW = measureTextWidth(fn, 10.5, 700, MONO);
  const gapEach = (rx - langW - dotsR - fnW) / 2;
  body.push(text(fn, { left: dotsR + gapEach, top: hcy, size: 10.5, weight: 700, fill: tc.textSub, family: MONO }));

  // 2. Thân code: padding 12/14, min-height 100, pre-wrap theo số cột đơn cách
  const cols = Math.max(1, Math.floor((W - 2 * b - 2 * S.padX + 0.5) / (S.monoCharW * S.fontSize)));
  const lines = code.split('\n').flatMap(l => wrapMono(l, cols));
  const lh = S.fontSize * S.lineHeightRatio;
  const top = b + headerH + S.padTop;
  if (code) {
    body.push(new fabric.FabricText(lines.join('\n'), {
      left: X0 + b + S.padX, top: top + (lh - S.fontSize * FS_MULT) / 2,
      fontSize: S.fontSize, fontFamily: MONO, fill: tc.text, lineHeight: lh / (S.fontSize * FS_MULT),
      originX: 'left', originY: 'top', objectCaching: false,
    } as any));
  }
  const bodyH = S.padTop + S.padBottom + Math.max(S.bodyMinH, lines.length * lh);
  const totalH = Math.max(el.height || 0, Math.round(2 * b + headerH + bodyH));

  const card = showBg
    ? new fabric.Rect({
        left: 0, top: b / 2, width: W - b, height: totalH - b, rx: 14, ry: 14, originX: 'center', originY: 'top',
        fill: C(el.bgColor, tc.cardBg), stroke: mixColors(accent, 30), strokeWidth: b,
        shadow: themeShadow(tc, 'lg'),
      })
    : boundsRect(W, totalH);
  return centerOnOrigin([card, ...body], totalH);
}
