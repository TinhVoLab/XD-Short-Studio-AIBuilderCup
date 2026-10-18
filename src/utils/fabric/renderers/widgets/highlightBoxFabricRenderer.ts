import * as fabric from 'fabric';
import { SceneElement } from '@/types/scene';
import { HIGHLIGHT_BOX_SPEC as S, layoutHighlightBox, resolveHighlightSkin, skinIcon } from '@/config/highlightBoxLayout';
import { toHexAlpha, getFabricThemeColors, mixColors } from './colorUtils';
import { buildFabricIcon } from './fabricIconUtils';
import { themeShadow, centerOnOrigin } from './fabricTextKit';

/**
 * Highlight-box trên Fabric — cùng layoutHighlightBox() (toạ độ) và cùng skin (lớp sơn) với Remotion,
 * nên canvas chỉnh sửa khớp video ở cả 4 skin: glass / editorial / paper / marker.
 * Toạ độ: group originX center / originY top (x ∈ [-w/2, w/2], y ∈ [0, H]).
 */
export function buildHighlightBoxFabricObjects(
  el: SceneElement,
  accent: string,
  w: number,
  _h: number
): fabric.FabricObject[] {
  const objects: fabric.FabricObject[] = [];
  const theme = getFabricThemeColors(el);
  const tokens = theme.palette.tokens;
  // accent của element (kể cả dạng var(--x)) đã được resolve trong theme.accent — khớp `el.accentColor || var(--accent)`
  const safeAccent = theme.accent || accent;
  const { skin, backing } = resolveHighlightSkin(el, { highlightSkin: el.sceneHighlightSkin || theme.palette.highlightSkin }, el.bgBusy);
  const isGlass = skin === 'glass';
  const isPaper = skin === 'paper';
  const isEditorial = skin === 'editorial';
  const isMarker = skin === 'marker';

  const textColor = el.color || (isPaper ? tokens.onSurface : theme.text);
  const markerInk = toHexAlpha((tokens.subtitleHighlight || safeAccent), '8C');
  const frameFill = el.bgColor || (isGlass ? theme.cardBg : isPaper ? tokens.surface : backing ? mixColors(theme.cardBg, 72) : 'transparent');
  const fontFamily = el.fontFamily || 'Be Vietnam Pro';
  const radius = el.radius ?? 16;
  const frameRadius = isPaper ? Math.max(radius, 20) : isEditorial ? 4 : radius;
  const textAlign = (el.textAlign || 'left') as string;
  const halfW = w / 2;
  const layout = layoutHighlightBox({ ...el, width: w });
  const H = layout.height;
  const icon = skinIcon(el.boxIcon && el.boxIcon !== 'none' ? el.boxIcon : undefined, skin);

  const rect = (opts: Record<string, any>) =>
    new fabric.Rect({ originX: 'left', originY: 'top', selectable: false, evented: false, ...opts } as any);
  const textbox = (text: string, opts: Record<string, any>) =>
    new fabric.Textbox(text, { fontFamily, fill: textColor, splitByGrapheme: false, selectable: false, evented: false, ...opts } as any);

  /** Icon SVG của video (renderBoxIcon); `badge` = vòng tròn nền (glass/paper) như iconBadge của Remotion */
  const iconAt = (cx: number, cy: number, size: number, glyph: number, badge: boolean) => {
    if (badge && (isGlass || isPaper)) {
      objects.push(new fabric.Circle({
        left: cx, top: cy, radius: size / 2 - 0.5,
        fill: mixColors(safeAccent, isGlass ? 16 : 14),
        stroke: isGlass ? mixColors(safeAccent, 50) : undefined, strokeWidth: isGlass ? 1 : 0,
        originX: 'center', originY: 'center',
      } as any));
    }
    objects.push(...(buildFabricIcon(icon, safeAccent, glyph, cx, cy) as fabric.FabricObject[]));
  };

  /** Vệt bút dạ dưới từng dòng của textbox (đặt originX left / originY top tại (left, top)) */
  const pushWithSwash = (tb: fabric.Textbox, left: number, top: number) => {
    if (isMarker) {
      tb.initDimensions();
      const lines = (tb as any)._textLines?.length || 1;
      let y = top;
      for (let i = 0; i < lines; i++) {
        const lh = tb.getHeightOfLine(i);
        const lw = tb.getLineWidth(i);
        const lx = textAlign === 'center' ? left + ((tb.width || 0) - lw) / 2 : left;
        objects.push(rect({ left: lx, top: y + lh * 0.55, width: lw, height: lh * 0.36, fill: markerInk }));
        y += lh;
      }
    }
    objects.push(tb);
  };

  // ── Callout / strip / pill: một khối chữ, có thể có icon bên trái ──
  if (layout.variant === 'callout-card' || layout.variant === 'accent-strip' || layout.variant === 'glow-pill') {
    const V = layout.variant === 'callout-card' ? S.callout : layout.variant === 'accent-strip' ? S.strip : S.pill;
    const isStrip = layout.variant === 'accent-strip';
    const isPill = layout.variant === 'glow-pill';
    const rx = isPill ? H / 2 : isStrip ? Math.min(frameRadius, 14) : frameRadius;

    const fill = isPill && isMarker ? markerInk : frameFill;
    objects.push(rect({
      left: -halfW, top: 0, width: w, height: H, rx, ry: rx, fill,
      shadow: isGlass || isPaper ? themeShadow(theme) : undefined,
    }));
    if (isGlass && (isPill || isStrip)) {
      objects.push(rect({ left: -halfW, top: 0, width: w, height: H, rx, ry: rx, fill: toHexAlpha(safeAccent, isPill ? '26' : '1A') }));
    }
    if (isStrip) {
      objects.push(rect({ left: -halfW, top: 0, width: S.strip.borderLeft!, height: H, fill: safeAccent }));
    } else if (isGlass || (isPill && isEditorial)) {
      objects.push(rect({ left: -halfW, top: 0, width: w, height: H, rx, ry: rx, fill: 'transparent', stroke: toHexAlpha(safeAccent, isEditorial ? 'BF' : isPill ? '99' : '73'), strokeWidth: V.border }));
    } else if (isEditorial && !isPill) {
      objects.push(rect({ left: -halfW, top: 0, width: 2, height: H, fill: safeAccent }));
    }

    const leftEdge = -halfW + V.padX + (isStrip ? S.strip.borderLeft! : V.border || 0);
    const iconW = layout.hasIcon ? V.iconSize + V.gap : 0;
    const spacerW = layout.hasIcon && textAlign === 'center' && !isPill ? V.iconSize + V.gap : 0;
    if (layout.hasIcon) {
      // callout: huy hiệu tròn (glyph 54%); strip / pill: chỉ icon cỡ iconSize
      const isCallout = layout.variant === 'callout-card';
      iconAt(leftEdge + V.iconSize / 2, H / 2, V.iconSize, isCallout ? Math.round(V.iconSize * 0.54) : V.iconSize, isCallout);
    }

    const textW = Math.max(60, w - V.padX * 2 - (isStrip ? S.strip.borderLeft! : (V.border || 0) * 2) - iconW - spacerW);
    const tb = textbox(layout.text || String(el.content || '').trim() || 'Nội dung điểm nhấn...', {
      width: textW,
      fontSize: layout.fontSize,
      fontWeight: isPill ? '700' : '600',
      textAlign,
      lineHeight: V.lineHeight,
      originX: 'left',
      originY: 'top',
    });
    tb.initDimensions();
    const left = leftEdge + iconW;
    const top = (H - (tb.height || 0)) / 2;
    tb.set({ left, top });
    // Viên thuốc marker đã tô mực cả nền → không vẽ thêm vệt dưới chữ (khớp Remotion)
    if (isPill) objects.push(tb);
    else pushWithSwash(tb, left, top);
    return centerOnOrigin(objects, H);
  }

  // ── Sticker: xếp hàng theo pillRows, mỗi hàng căn giữa ──
  if (layout.variant === 'multi-pill') {
    const K = S.sticker;
    let y = K.wrapPadY;
    (layout.pillRows || []).forEach((row, rIdx) => {
      const rowH = Math.max(...row.map(p => p.height));
      const rowW = row.reduce((s, p) => s + p.width, 0) + K.gap * (row.length - 1);
      let x = -rowW / 2;
      row.forEach((pill, pIdx) => {
        const top = y + (rowH - pill.height) / 2;
        const angle = (layout.pills?.length || 0) > 1 && !isEditorial ? ((rIdx + pIdx) % 2 === 0 ? -1.5 : 1.5) : 0;
        const prx = isEditorial ? 6 : 18;
        const parts: fabric.FabricObject[] = [
          rect({ left: 0, top: 0, width: pill.width, height: pill.height, rx: prx, ry: prx, fill: isMarker ? markerInk : isPaper ? tokens.surface : frameFill }),
        ];
        if (isGlass) parts.push(rect({ left: 0, top: 0, width: pill.width, height: pill.height, rx: prx, ry: prx, fill: toHexAlpha(safeAccent, '2E'), stroke: toHexAlpha(safeAccent, '8C'), strokeWidth: K.border }));
        if (isEditorial) parts.push(rect({ left: 0, top: 0, width: pill.width, height: pill.height, rx: prx, ry: prx, fill: 'transparent', stroke: toHexAlpha(safeAccent, 'BF'), strokeWidth: K.border }));
        parts.push(textbox(pill.text, {
          left: pill.width / 2, top: pill.height / 2, width: pill.width - K.padX * 2 - K.border * 2,
          fontSize: layout.fontSize, fontWeight: '800', textAlign: 'center', originX: 'center', originY: 'center', lineHeight: K.lineHeight,
        }));
        objects.push(new fabric.Group(parts, { left: x + pill.width / 2, top: top + pill.height / 2, originX: 'center', originY: 'center', angle, selectable: false, evented: false } as any));
        x += pill.width + K.gap;
      });
      y += rowH + K.gap;
    });
    return centerOnOrigin(objects, H);
  }

  // ── Bullet-list: mỗi dòng một thẻ (chiều cao riêng, có xuống dòng) ──
  const B = S.bullet;
  const hasBadge = layout.showNumber || layout.showIcon;
  const badge = layout.showNumber ? B.badgeNumber : layout.showIcon ? B.badgeIcon : 0;
  const padX = hasBadge ? B.padX : B.padXPlain;
  const rowRadius = isPaper ? Math.max(radius, 16) : isEditorial ? 4 : Math.min(radius, 14);
  let y = 0;
  (layout.rows || []).forEach((row, idx) => {
    objects.push(rect({
      left: -halfW, top: y, width: w, height: row.height, rx: rowRadius, ry: rowRadius,
      fill: frameFill,
      stroke: isGlass ? (layout.showNumber ? toHexAlpha(theme.text.startsWith('#') ? theme.text : '#FFFFFF', '1A') : toHexAlpha(safeAccent, '59')) : undefined,
      strokeWidth: isGlass ? B.border : 0,
    }));
    if (isEditorial) objects.push(rect({ left: -halfW, top: y, width: 2, height: row.height, fill: safeAccent }));
    const badgeCx = -halfW + B.border + padX + badge / 2;
    const multiLine = row.textLines > 1;
    const badgeCy = multiLine ? y + B.border + B.padY + badge / 2 : y + row.height / 2;
    if (layout.showNumber) {
      objects.push(new fabric.Circle({
        left: badgeCx, top: badgeCy, radius: badge / 2,
        fill: toHexAlpha(safeAccent, isPaper ? '2E' : '29'), stroke: toHexAlpha(safeAccent, isGlass || isPaper ? '8C' : 'B3'), strokeWidth: 1.5,
        originX: 'center', originY: 'center',
      } as any));
      objects.push(new fabric.IText(String(idx + 1).padStart(2, '0'), {
        left: badgeCx, top: badgeCy, fontSize: 11.5, fontWeight: '900', fill: safeAccent,
        originX: 'center', originY: 'center', fontFamily,
      } as any));
    } else if (layout.showIcon) {
      iconAt(badgeCx, badgeCy, badge, 14, true);
    }
    const textLeft = -halfW + B.border + padX + (hasBadge ? badge + B.gap : 0);
    const tb = textbox(row.text, {
      width: Math.max(60, w - (textLeft + halfW) - padX - B.border - (layout.centerSpacer || 0)),
      fontSize: layout.fontSize,
      fontWeight: '600',
      textAlign,
      lineHeight: B.lineHeight,
      originX: 'left',
      originY: 'top',
    });
    tb.initDimensions();
    const top = multiLine ? y + B.border + (hasBadge ? B.padY : B.padYPlain) : y + (row.height - (tb.height || 0)) / 2;
    tb.set({ left: textLeft, top });
    pushWithSwash(tb, textLeft, top);
    y += row.height + B.rowGap;
  });

  return centerOnOrigin(objects, H);
}
