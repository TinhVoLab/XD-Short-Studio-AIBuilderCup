import * as fabric from 'fabric';
import { SceneElement } from '@/types/scene';
import { calculateElementDynamicHeight } from '@/config/layoutRegistry';
import { toHexAlpha, getFabricThemeColors } from './colorUtils';
import { ParadoxRegistry } from '@/remotion/elements/stem/paradox/ParadoxRegistry';
import { VisualParadoxData, TelemetryMetric } from '@/remotion/elements/stem/paradox/types';
import { buildMathAstFabricObjects } from './mathAstFabricRenderer';

/**
 * Dedicated Visual Paradox Fabric 2D Renderer
 * Mirrors Remotion VisualParadoxElement 100% (Card, Header Bar, Telemetry HUD, Concentric Neon Wheels & Cycloid Curves)
 */
export function buildVisualParadoxFabricObjects(
  el: SceneElement,
  safeAccent: string,
  w: number,
  h: number
): fabric.FabricObject[] {
  const objects: fabric.FabricObject[] = [];
  // Thẻ "màn hình mô phỏng" luôn tối như VisualParadoxElement (nền kính đen, chữ trắng, nhãn #8B949E):
  // khoá bảng màu tối để chữ không lấy màu chữ tối của theme sáng
  const sceneColors = getFabricThemeColors(el);
  const themeColors = {
    ...sceneColors,
    text: '#FFFFFF',
    textSub: '#8B949E',
    border: 'rgba(255, 255, 255, 0.08)',
    surface1: 'rgba(13, 17, 23, 0.88)',
    chartGrid: 'rgba(255, 255, 255, 0.05)',
    chartAxis: 'rgba(255, 255, 255, 0.25)',
  };
  const containerWidth = typeof el.width === 'number' && el.width > 0 ? el.width : 336;
  const dynamicH = calculateElementDynamicHeight(el);
  const totalH = typeof h === 'number' && h > 0 ? Math.max(h, dynamicH) : dynamicH;
  const halfW = containerWidth / 2;

  const isFrameless = el.showCardBg === false || el.bgColor === 'transparent';
  const radius = el.radius !== undefined ? el.radius : 16;
  const padX = isFrameless ? 8 : 14;
  const padY = isFrameless ? 8 : 12;

  const paradoxData: VisualParadoxData = el.paradoxData || {
    paradoxId: 'aristotle-wheel',
  };
  const previewTau = typeof (paradoxData as any).previewTau === 'number'
    ? Math.max(0, Math.min(1, (paradoxData as any).previewTau))
    : 0.5;

  const plugin = ParadoxRegistry.get(paradoxData.paradoxId || 'aristotle-wheel');
  const params = {
    ...plugin.defaultParams,
    ...(paradoxData.params || {}),
  };

  // Khớp video: accent mặc định của mô phỏng là lime (không theo theme — thẻ luôn tối)
  void safeAccent;
  const accent = el.accentColor || paradoxData.accentColor || '#BEFF01';
  const secondary = el.secondaryColor || paradoxData.secondaryColor || '#00D4FF';

  const title = (el.title ?? el.content ?? plugin.name ?? '').trim();
  const hasTitle = Boolean(title);
  const showHUD = paradoxData.showHUD !== false;

  // 1. Container Card Background
  if (!isFrameless) {
    const containerBg = el.bgColor || 'rgba(14, 20, 27, 0.96)';
    const containerBorder = themeColors.border;

    objects.push(
      new fabric.Rect({
        left: 0,
        top: 0,
        width: containerWidth,
        height: totalH,
        rx: radius,
        ry: radius,
        fill: containerBg,
        stroke: containerBorder,
        strokeWidth: 1,
        originX: 'center',
        originY: 'top',
        selectable: false,
      } as any)
    );
  } else {
    // Subtle hairline dashed box when frameless
    objects.push(
      new fabric.Rect({
        left: 0,
        top: 0,
        width: containerWidth,
        height: totalH,
        rx: 6,
        ry: 6,
        fill: 'transparent',
        stroke: sceneColors.border,
        strokeWidth: 1,
        strokeDashArray: [4, 4],
        originX: 'center',
        originY: 'top',
        selectable: false,
      } as any)
    );
  }

  let curY = padY;

  // 2. Header Bar
  if (hasTitle) {
    const headerLeft = -halfW + padX;
    const headerW = containerWidth - padX * 2;

    // Header Icon Indicator Dot
    objects.push(
      new fabric.Circle({
        left: headerLeft + 6,
        top: curY + 7,
        radius: 4,
        fill: accent,
        strokeWidth: 0,
        originX: 'center',
        originY: 'center',
        selectable: false,
      } as any)
    );

    // Header Title
    objects.push(
      new fabric.Text(title, {
        left: headerLeft + 16,
        top: curY + 1,
        fontSize: 11.5,
        fontWeight: 'bold',
        fill: themeColors.text,
        fontFamily: 'sans-serif',
        originX: 'left',
        originY: 'top',
        selectable: false,
      } as any)
    );

    // Header Badge on right
    const badgeText = plugin.archetype ? plugin.archetype.replace('_', ' ').toUpperCase() : 'STEM';
    const badgeW = Math.max(54, badgeText.length * 6.5 + 14);
    const badgeX = halfW - padX - badgeW / 2;
    objects.push(
      new fabric.Rect({
        left: badgeX,
        top: curY,
        width: badgeW,
        height: 16,
        rx: 4,
        ry: 4,
        fill: toHexAlpha(accent, '18'),
        stroke: toHexAlpha(accent, '33'),
        strokeWidth: 1,
        originX: 'center',
        originY: 'top',
        selectable: false,
      } as any)
    );

    objects.push(
      new fabric.Text(badgeText, {
        left: badgeX,
        top: curY + 3,
        fontSize: 8.5,
        fontWeight: 'bold',
        fill: accent,
        fontFamily: 'monospace',
        originX: 'center',
        originY: 'top',
        selectable: false,
      } as any)
    );

    curY += 22;
    objects.push(
      new fabric.Line([headerLeft, curY, headerLeft + headerW, curY], {
        stroke: themeColors.border,
        strokeWidth: 1,
        selectable: false,
      } as any)
    );
    curY += 8;
  }

  // 3. Telemetry HUD Chips
  if (showHUD) {
    const chipY = curY;
    const rawMetrics: TelemetryMetric[] = plugin.getTelemetryMetrics
      ? plugin.getTelemetryMetrics(1.0, 0.2, params, { accent, secondary })
      : [];
    const metrics: TelemetryMetric[] = rawMetrics.length >= 3 ? rawMetrics.slice(0, 3) : [
      { label: 'THAM SỐ 1', value: '1.0', color: themeColors.text },
      { label: 'THAM SỐ 2', value: '100%', color: accent },
      { label: 'TRẠNG THÁI', value: 'CHUẨN HÓA', color: secondary },
    ];

    const availableHUDW = containerWidth - padX * 2;
    const chipGap = 5;
    const chipW = Math.floor((availableHUDW - chipGap * 2) / 3);
    const chipH = 26;

    metrics.forEach((c: TelemetryMetric, idx: number) => {
      const chipX = -halfW + padX + chipW / 2 + idx * (chipW + chipGap);
      objects.push(
        new fabric.Rect({
          left: chipX,
          top: chipY,
          width: chipW,
          height: chipH,
          rx: 4,
          ry: 4,
          fill: themeColors.surface1,
          stroke: themeColors.border,
          strokeWidth: 1,
          originX: 'center',
          originY: 'top',
          selectable: false,
        } as any)
      );

      objects.push(
        new fabric.Text(c.label, {
          left: chipX,
          top: chipY + 3,
          fontSize: 7.5,
          fontWeight: 'bold',
          fill: themeColors.textSub,
          fontFamily: 'sans-serif',
          originX: 'center',
          originY: 'top',
          selectable: false,
        } as any)
      );

      objects.push(
        new fabric.Text(c.value, {
          left: chipX,
          top: chipY + 12,
          fontSize: 9,
          fontWeight: 'bold',
          fill: c.color || (idx === 1 ? accent : themeColors.text),
          fontFamily: 'monospace',
          originX: 'center',
          originY: 'top',
          selectable: false,
        } as any)
      );
    });

    curY += 34;
  }

  // 4. Archetype-Specific Fabric 2D Preview Geometry
  const stageH = totalH - curY - 14;
  const paradoxId = paradoxData.paradoxId || 'aristotle-wheel';

  if (paradoxId === 'phantom-traffic-jam') {
    // 4.1 Traffic Flow Preview: Highway ring + Central radar + Vehicles
    const cx = 0;
    const cy = curY + stageH * 0.48;
    const ringR = Math.min(halfW - padX - 8, stageH * 0.42);

    // Track
    objects.push(
      new fabric.Circle({
        left: cx,
        top: cy,
        radius: ringR,
        fill: 'transparent',
        stroke: 'rgba(255, 255, 255, 0.12)',
        strokeWidth: 20,
        originX: 'center',
        originY: 'center',
        selectable: false,
      } as any)
    );

    // Dashed Lane
    objects.push(
      new fabric.Circle({
        left: cx,
        top: cy,
        radius: ringR,
        fill: 'transparent',
        stroke: 'rgba(255, 255, 255, 0.3)',
        strokeWidth: 1.5,
        strokeDashArray: [4, 4],
        originX: 'center',
        originY: 'center',
        selectable: false,
      } as any)
    );

    // Central Radar
    objects.push(
      new fabric.Circle({
        left: cx,
        top: cy,
        radius: ringR * 0.58,
        fill: 'rgba(13, 17, 23, 0.95)',
        stroke: 'rgba(255, 255, 255, 0.1)',
        strokeWidth: 1,
        originX: 'center',
        originY: 'center',
        selectable: false,
      } as any)
    );

    objects.push(
      new fabric.Text('58', {
        left: cx,
        top: cy - 10,
        fontSize: 16,
        fontWeight: 'bold',
        fill: accent,
        fontFamily: 'monospace',
        originX: 'center',
        originY: 'center',
        selectable: false,
      } as any)
    );

    objects.push(
      new fabric.Text('KM/H', {
        left: cx,
        top: cy + 8,
        fontSize: 7,
        fontWeight: 'bold',
        fill: '#8B949E',
        fontFamily: 'sans-serif',
        originX: 'center',
        originY: 'center',
        selectable: false,
      } as any)
    );

    // Sample Cars on Ring
    const sampleCars = 8;
    for (let i = 0; i < sampleCars; i++) {
      const a = (i / sampleCars) * Math.PI * 2;
      const isAI = i === 0 || i === 4;
      objects.push(
        new fabric.Rect({
          left: cx + ringR * Math.cos(a),
          top: cy + ringR * Math.sin(a),
          width: 8,
          height: 14,
          rx: 2,
          ry: 2,
          fill: isAI ? accent : secondary,
          angle: (a * 180) / Math.PI + 90,
          originX: 'center',
          originY: 'center',
          selectable: false,
        } as any)
      );
    }
  } else if (paradoxId === 'sorting-duel') {
    // 4.2 Sorting Duel Preview: Top QuickSort lane + Bottom BubbleSort lane
    const laneW = containerWidth - padX * 2;
    const laneH = (stageH - 12) / 2;
    const numBars = 16;
    const barW = laneW / numBars;

    // Top Lane (QuickSort - Accent)
    const topY = curY + 6;
    for (let i = 0; i < numBars; i++) {
      const val = i + 1;
      const bH = (val / numBars) * (laneH - 12);
      objects.push(
        new fabric.Rect({
          left: -halfW + padX + i * barW + 1,
          top: topY + laneH - bH,
          width: barW - 2,
          height: bH,
          fill: toHexAlpha(accent, 'CC'),
          selectable: false,
        } as any)
      );
    }

    // Bottom Lane (BubbleSort - Secondary)
    const botY = topY + laneH + 8;
    for (let i = 0; i < numBars; i++) {
      const val = ((i * 5 + 7) % numBars) + 1;
      const bH = (val / numBars) * (laneH - 12);
      objects.push(
        new fabric.Rect({
          left: -halfW + padX + i * barW + 1,
          top: botY + laneH - bH,
          width: barW - 2,
          height: bH,
          fill: toHexAlpha(secondary, 'AA'),
          selectable: false,
        } as any)
      );
    }
  } else if (paradoxId === 'neural-network-fraud') {
    // 4.3 Neural Network Preview: 3 Layers + Connections
    const layerX = [-halfW * 0.55, 0, halfW * 0.55];
    const cy = curY + stageH * 0.50;
    const nodeCounts = [2, 4, 2];

    // Connections
    for (let l = 0; l < 2; l++) {
      const x1 = layerX[l];
      const x2 = layerX[l + 1];
      const n1 = nodeCounts[l];
      const n2 = nodeCounts[l + 1];
      for (let i = 0; i < n1; i++) {
        const y1 = cy - ((n1 - 1) * 22) + i * 44;
        for (let j = 0; j < n2; j++) {
          const y2 = cy - ((n2 - 1) * 18) + j * 36;
          objects.push(
            new fabric.Line([x1, y1, x2, y2], {
              stroke: toHexAlpha(accent, '33'),
              strokeWidth: 1,
              selectable: false,
            } as any)
          );
        }
      }
    }

    // Nodes
    for (let l = 0; l < 3; l++) {
      const x = layerX[l];
      const n = nodeCounts[l];
      for (let i = 0; i < n; i++) {
        const spacing = l === 1 ? 36 : 44;
        const y = cy - ((n - 1) * (spacing / 2)) + i * spacing;
        const isFraud = l === 2 && i === 1;
        objects.push(
          new fabric.Circle({
            left: x,
            top: y,
            radius: 8,
            fill: 'rgba(13, 17, 23, 0.95)',
            stroke: isFraud ? '#FF5544' : accent,
            strokeWidth: 1.5,
            originX: 'center',
            originY: 'center',
            selectable: false,
          } as any)
        );
      }
    }
  } else if (paradoxId === 'brachistochrone-curve') {
    // 4.4 Brachistochrone Preview: 3 curves + finish line
    const startX = -halfW + padX + 10;
    const startY = curY + 14;
    const endX = halfW - padX - 10;
    const endY = curY + stageH * 0.85;

    // Finish Line
    objects.push(
      new fabric.Line([endX, startY - 6, endX, endY + 10], {
        stroke: 'rgba(255, 255, 255, 0.3)',
        strokeWidth: 1,
        strokeDashArray: [3, 3],
        selectable: false,
      } as any)
    );

    // Straight Line
    objects.push(
      new fabric.Line([startX, startY, endX, endY], {
        stroke: '#FF5544',
        strokeWidth: 1.5,
        selectable: false,
      } as any)
    );

    // Cycloid Curve (approx arc)
    const midX = (startX + endX) / 2;
    const midY = endY + 12;
    const pathD = `M ${startX} ${startY} Q ${startX + 20} ${midY}, ${endX} ${endY}`;
    objects.push(
      new fabric.Path(pathD, {
        fill: 'transparent',
        stroke: accent,
        strokeWidth: 2.5,
        selectable: false,
      } as any)
    );
  } else if (paradoxId === 'dynamic-sandbox') {
    if (params.mathSpec) {
      const mathObjs = buildMathAstFabricObjects(params.mathSpec, previewTau, { accent, secondary, themeColors }, {
        containerWidth,
        stageH,
        curY,
        halfW,
        padX,
        padY,
      });
      objects.push(...mathObjs);
    } else {
      // 4.5.2 Scientific State & Telemetry Preview (Clean Technical Schematic)
      const boxW = containerWidth - padX * 2 - 20;
      const boxH = stageH * 0.65;
      const boxX = -halfW + padX + 10;
      const boxY = curY + stageH * 0.15;

      // Clean Technical Border
      objects.push(
        new fabric.Rect({
          left: boxX,
          top: boxY,
          width: boxW,
          height: boxH,
          fill: 'rgba(14, 20, 27, 0.75)',
          stroke: 'rgba(255, 255, 255, 0.12)',
          strokeWidth: 1.5,
          rx: 8,
          ry: 8,
          selectable: false,
        } as any)
      );

      // Fine grid lines
      for (let gx = boxX + 24; gx < boxX + boxW; gx += 32) {
        objects.push(
          new fabric.Line([gx, boxY, gx, boxY + boxH], {
            stroke: 'rgba(255, 255, 255, 0.04)',
            strokeWidth: 1,
            selectable: false,
          } as any)
        );
      }
      for (let gy = boxY + 24; gy < boxY + boxH; gy += 32) {
        objects.push(
          new fabric.Line([boxX, gy, boxX + boxW, gy], {
            stroke: 'rgba(255, 255, 255, 0.04)',
            strokeWidth: 1,
            selectable: false,
          } as any)
        );
      }

      // Dynamic State Vector & Title
      const titleText = String(params.title || 'Mô phỏng Khoa học AI');
      objects.push(
        new fabric.Text(titleText, {
          left: 0,
          top: boxY + 16,
          fontSize: 9.5,
          fontWeight: 'bold',
          fill: '#FFFFFF',
          fontFamily: 'monospace',
          originX: 'center',
          selectable: false,
        } as any)
      );

      if (params.formula) {
        objects.push(
          new fabric.Text(String(params.formula), {
            left: 0,
            top: boxY + 36,
            fontSize: 9,
            fontWeight: 'bold',
            fill: accent,
            fontFamily: 'monospace',
            originX: 'center',
            selectable: false,
          } as any)
        );
      }

      // Status Badge
      objects.push(
        new fabric.Text('DYNAMIC SCIENTIFIC FIELD', {
          left: 0,
          top: boxY + boxH - 20,
          fontSize: 7.5,
          fill: toHexAlpha(secondary, 'DD'),
          fontFamily: 'monospace',
          originX: 'center',
          selectable: false,
        } as any)
      );
    }
  } else {
    // 4.6 Aristotle Wheel & Concentric Geometry (Default)
    const R = Number(params.R) || 75;
    const r = Math.min(R - 10, Number(params.r) || 38);
    const showGalileoMode = Boolean(params.showGalileoMode);
    const galileoSides = Math.max(4, Math.min(12, Math.floor(Number(params.galileoSides) || 6)));
    const groundY = curY + stageH * 0.82;
    const travelW = Math.max(10, containerWidth - padX * 2 - R * 2);
    const hubX = (-halfW + padX + R) + previewTau * travelW;
    const hubY = groundY - R;

    // Ground Line
    objects.push(
      new fabric.Line([-halfW + padX, groundY, halfW - padX, groundY], {
        stroke: 'rgba(255, 255, 255, 0.22)',
        strokeWidth: 1.5,
        selectable: false,
      } as any)
    );

    // Inner Ground Virtual Dash Line
    const innerGroundY = hubY + r;
    objects.push(
      new fabric.Line([-halfW + padX, innerGroundY, halfW - padX, innerGroundY], {
        stroke: toHexAlpha(secondary, '33'),
        strokeWidth: 1,
        strokeDashArray: [4, 4],
        selectable: false,
      } as any)
    );

    if (showGalileoMode) {
      const N = galileoSides;
      const outerPts: { x: number; y: number }[] = [];
      const innerPts: { x: number; y: number }[] = [];
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2 - Math.PI / 2;
        outerPts.push({ x: R * Math.cos(a), y: R * Math.sin(a) });
        innerPts.push({ x: r * Math.cos(a), y: r * Math.sin(a) });
      }

      // Outer Polygon
      objects.push(
        new fabric.Polygon(outerPts, {
          left: hubX,
          top: hubY,
          fill: toHexAlpha(accent, '14'),
          stroke: accent,
          strokeWidth: 2.5,
          originX: 'center',
          originY: 'center',
          selectable: false,
        } as any)
      );

      // Inner Polygon
      objects.push(
        new fabric.Polygon(innerPts, {
          left: hubX,
          top: hubY,
          fill: toHexAlpha(secondary, '18'),
          stroke: secondary,
          strokeWidth: 2,
          originX: 'center',
          originY: 'center',
          selectable: false,
        } as any)
      );
    } else {
      // Outer Wheel Rim
      objects.push(
        new fabric.Circle({
          left: hubX,
          top: hubY,
          radius: R,
          fill: 'transparent',
          stroke: accent,
          strokeWidth: 2.5,
          originX: 'center',
          originY: 'center',
          selectable: false,
        } as any)
      );

      // Inner Wheel Rim
      objects.push(
        new fabric.Circle({
          left: hubX,
          top: hubY,
          radius: r,
          fill: 'transparent',
          stroke: secondary,
          strokeWidth: 2,
          originX: 'center',
          originY: 'center',
          selectable: false,
        } as any)
      );
    }

    // Center Axle Hub Dot
    objects.push(
      new fabric.Circle({
        left: hubX,
        top: hubY,
        radius: 6,
        fill: '#080A0F',
        stroke: '#FFFFFF',
        strokeWidth: 1.5,
        originX: 'center',
        originY: 'center',
        selectable: false,
      } as any)
    );
  }

  return objects;
}
