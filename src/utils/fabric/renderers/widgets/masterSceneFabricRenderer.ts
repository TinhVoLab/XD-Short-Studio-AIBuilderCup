import * as fabric from 'fabric';
import { SceneElement } from '@/types/scene';
import { layoutMasterScene, type MasterSceneItem } from '@/config/masterSceneLayout';
import { MASTER_TONE_ALPHA, MASTER_ICON_PATHS, MASTER_DIM_OPACITY } from '@/config/masterSceneStyle';
import { hexToRgba } from '@/config/themePalettes';
import { getFabricThemeColors } from './colorUtils';

/** fabric.Text._fontSizeMult — chiều cao một dòng = fontSize × lineHeight × hệ số này */
const FABRIC_FONT_SIZE_MULT = 1.13;

/**
 * Bộ vẽ Fabric cho element master-scene: vẽ đúng danh sách hộp của layoutMasterScene (cùng nguồn với
 * MasterSceneElement và công thức chiều cao), ở trạng thái cuối của chuyển động.
 * Toạ độ căn giữa ngang quanh x = 0 ([-halfW, halfW]), top = 0.
 */
export function buildMasterSceneFabricObjects(el: SceneElement, _accent: string, w: number): fabric.FabricObject[] {
  const layout = layoutMasterScene({ ...el, width: w });
  const halfW = layout.width / 2;
  const theme = getFabricThemeColors(el);

  // Tông của layout → màu thật của theme cảnh (gồm biến thể nền ngà / nền màu nhấn)
  const tone = (name: string | null | undefined): string => {
    if (!name) return 'transparent';
    if (name === 'accent') return theme.accent;
    if (name === 'accentFill') return theme.vars['--accent-fill'] || theme.accent;
    if (name === 'sub') return theme.textSub;
    if (name === 'onAccent') return theme.onAccent;
    if (name === 'onAccentFill') return theme.vars['--on-accent-fill'] || theme.onAccent;
    if (name === 'bg') return theme.bg;
    if (MASTER_TONE_ALPHA[name] !== undefined) return hexToRgba(theme.text, MASTER_TONE_ALPHA[name]);
    return theme.text;
  };

  const objects: fabric.FabricObject[] = [
    // Khung bao trong suốt để group luôn đúng kích thước của layout (kể cả khoảng trống)
    new fabric.Rect({ left: 0, top: 0, width: layout.width, height: layout.height, fill: 'transparent', originX: 'center', originY: 'top', selectable: false, evented: false }),
  ];

  // Canvas vẽ trạng thái cuối của chuyển động: hộp đã tắt (outAt) không vẽ
  for (const it of layout.items) if (it.outAt === undefined) objects.push(...drawItem(it, halfW, tone));
  return objects;
}

function drawItem(it: MasterSceneItem, halfW: number, tone: (name: string | null | undefined) => string): fabric.FabricObject[] {
  // Fabric vẽ trạng thái cuối của chuyển động: 'dim' (lựa chọn sai) giữ độ mờ cuối
  const opacity = it.anim === 'dim' ? MASTER_DIM_OPACITY : 1;
  if (it.kind === 'rect') {
    const sw = it.stroke ? it.strokeWidth || 1 : 0;
    // Viền CSS là inset box-shadow (nằm trong hộp) → lùi nửa nét để nét Fabric cũng nằm trong
    return [new fabric.Rect({
      left: it.x - halfW + sw / 2,
      top: it.y + sw / 2,
      width: Math.max(0, it.w - sw),
      height: Math.max(0, it.h - sw),
      rx: it.radius,
      ry: it.radius,
      fill: it.fill ? tone(it.fill) : 'transparent',
      stroke: it.stroke ? tone(it.stroke) : undefined,
      strokeWidth: sw,
      opacity,
      originX: 'left',
      originY: 'top',
      selectable: false,
      evented: false,
    })];
  }

  if (it.kind === 'icon') {
    const icon = MASTER_ICON_PATHS[it.name];
    const [, , vbW, vbH] = icon.viewBox.split(' ').map(Number);
    const common = { left: it.x - halfW, top: it.y, scaleX: it.w / vbW, scaleY: it.h / vbH, originX: 'left' as const, originY: 'top' as const, selectable: false, evented: false };
    // M 0 0 M vbW vbH: neo khung viewBox để pathOffset không lệch tâm (AGENTS.md §7.2)
    const d = `M 0 0 M ${vbW} ${vbH} ${icon.d}`;
    if (it.name === 'bookmark') {
      return [new fabric.Path(d, { ...common, fill: tone(it.tone), stroke: tone('text'), strokeWidth: 1.6, strokeLineJoin: 'round' })];
    }
    if (icon.stroke) {
      return [new fabric.Path(d, { ...common, fill: '', stroke: tone(it.tone), strokeWidth: icon.stroke, strokeLineCap: 'round', strokeLineJoin: 'round', strokeUniform: false })];
    }
    return [new fabric.Path(d, { ...common, fill: tone(it.tone) })];
  }

  // Chữ: mỗi dòng một Text, màu từng đoạn bằng styles theo ký tự
  return it.lines.map((line, li) => {
    const text = line.map((s) => s.text).join('');
    const styles: Record<number, { fill: string }> = {};
    let pos = 0;
    for (const span of line) {
      for (let c = 0; c < span.text.length; c++) styles[pos + c] = { fill: tone(span.tone) };
      pos += span.text.length;
    }
    const isCenter = it.align === 'center';
    const isRight = it.align === 'right';
    return new fabric.Text(text.trimEnd(), {
      left: isCenter ? it.x + it.width / 2 - halfW : isRight ? it.x + it.width - halfW : it.x - halfW,
      top: it.y + li * it.lineHeight + it.lineHeight / 2,
      originX: isCenter ? 'center' : isRight ? 'right' : 'left',
      opacity,
      originY: 'center',
      fontFamily: it.font.family,
      fontWeight: String(it.font.weight),
      fontSize: it.font.size,
      // Hộp chữ Fabric = fontSize × lineHeight × 1.13 (_fontSizeMult): chọn lineHeight để hộp bằng đúng hộp dòng CSS
      // (khoảng cách dòng < 1 như số khổng lồ 0.82: nét chữ tràn ra ngoài hộp giống trình duyệt)
      lineHeight: it.lineHeight / (it.font.size * FABRIC_FONT_SIZE_MULT),
      charSpacing: (it.font.letterSpacing / it.font.size) * 1000,
      fill: tone(line[0]?.tone),
      styles: { 0: styles },
      selectable: false,
      evented: false,
    } as any);
  });
}
