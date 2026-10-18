/**
 * ==============================================================================
 * 🎨 TEMPLATE PALETTE MAPPER & HYDRATOR ENGINE (SSOT)
 * ==============================================================================
 * Bridges legacy templates into the 9 Theme Palettes system.
 * Guarantees 100% theme consistency when templates are loaded into timeline,
 * and powers the Smart Theme Swapper when users change video palettes.
 * ==============================================================================
 */

import { Scene, SceneElement } from '@/types/scene';
import { VideoTemplateItem } from '@/config/templates/types';
import { ThemePalette, resolveThemePalette, hexToRgba, getContrastTextColor, isLegacySceneBg } from './themeResolver';

export { isLegacySceneBg };

/**
 * Maps a template's metadata (explicit paletteId, accentColor, category, or id)
 * to a canonical ThemePaletteId.
 */
export function resolveTemplatePaletteId(
  templateOrAccent?: VideoTemplateItem | string,
  category?: string
): string {
  if (!templateOrAccent) return 'neon-night';

  if (typeof templateOrAccent === 'object') {
    if (templateOrAccent.paletteId) return templateOrAccent.paletteId;
    return resolveTemplatePaletteId(templateOrAccent.accentColor, templateOrAccent.category || category);
  }

  const rawColor = String(templateOrAccent).toLowerCase().trim();

  // 1. Royal Gold group (Warm luxury gold, yellow, amber)
  if (
    rawColor.includes('ffd700') ||
    rawColor.includes('ffd23f') ||
    rawColor.includes('d4af37') ||
    rawColor.includes('ffc700') ||
    rawColor.includes('e5c07b') ||
    rawColor.includes('f59e0b') ||
    rawColor.includes('eab308')
  ) {
    return 'royal-gold';
  }

  // 2. Sunset Pop / Vibrant Orange-Red group
  if (
    rawColor.includes('ff6b35') ||
    rawColor.includes('ff6b6b') ||
    rawColor.includes('ff4455') ||
    rawColor.includes('ff5722') ||
    rawColor.includes('f97316') ||
    rawColor.includes('ef4444')
  ) {
    return 'sunset-pop';
  }

  // 3. Fresh Mint group (Health, eco, emerald green)
  if (
    rawColor.includes('00ff88') ||
    rawColor.includes('1a936f') ||
    rawColor.includes('1f6f5c') ||
    rawColor.includes('27c93f') ||
    rawColor.includes('00c48c') ||
    rawColor.includes('10b981')
  ) {
    return 'fresh-mint';
  }

  // 4. Electric Candy group (Cyberpunk pink, neon magenta, electric purple)
  if (
    rawColor.includes('f20089') ||
    rawColor.includes('ff2e93') ||
    rawColor.includes('ec4899') ||
    rawColor.includes('d946ef') ||
    rawColor.includes('8b5cf6') ||
    rawColor.includes('a855f7')
  ) {
    return 'electric-candy';
  }

  // 5. Warm Care group (Cozy brown, lifestyle, warm slate)
  if (
    rawColor.includes('e07a5f') ||
    rawColor.includes('b4472b') ||
    rawColor.includes('2b1b17') ||
    rawColor.includes('3d5a80') ||
    rawColor.includes('8d6e63') ||
    category === 'healing'
  ) {
    return 'warm-care';
  }

  // 6. Neon Cyber group (Lime green, tech cyan, sky blue)
  if (
    rawColor.includes('beff01') ||
    rawColor.includes('00e5ff') ||
    rawColor.includes('00d4ff') ||
    rawColor.includes('06b6d4') ||
    rawColor.includes('38bdf8') ||
    rawColor.includes('00ffff')
  ) {
    return 'neon-night';
  }

  // 7. Category fallback
  if (category === 'versus') return 'sunset-pop';
  if (category === 'education') return 'neon-night';
  if (category === 'personal-brand') return 'royal-gold';

  return 'neon-night';
}

/**
 * Helper to identify if a color matches previous accent/surface or known legacy accents
 */
function isColorMatchingAccent(
  color: string | undefined,
  prevPal?: ThemePalette
): boolean {
  if (!color || typeof color !== 'string') return false;
  const c = color.toLowerCase().trim();
  const prevAccent = (prevPal?.tokens.accent || '').toLowerCase();
  const prevSurface = (prevPal?.tokens.surface || '').toLowerCase();

  if (c === prevAccent || c === prevSurface) return true;

  // Known legacy accents across templates
  const legacyAccents = [
    '#beff01', '#ffd700', '#ffd23f', '#d4af37', '#ffc700',
    '#00e5ff', '#00d4ff', '#00ffff', '#06b6d4', '#38bdf8',
    '#ff3b30', '#ff4455', '#ff6b6b', '#ff6b35', '#f97316', '#ef4444',
    '#10b981', '#00ff88', '#1a936f', '#1f6f5c', '#27c93f',
    '#f20089', '#ff2e93', '#ec4899', '#d946ef', '#8b5cf6', '#a855f7',
    '#e07a5f', '#3d5a80', '#b4472b'
  ];

  return legacyAccents.includes(c);
}

/**
 * Swaps element colors smartly when video palette changes
 */
export function swapElementThemeColors(
  el: SceneElement,
  prevPal: ThemePalette,
  newPal: ThemePalette
): SceneElement {
  const newAccent = newPal.tokens.accent;
  const newSurface = newPal.tokens.surface;

  const patch: Partial<SceneElement> = {
    paletteId: newPal.id,
  };

  // 1. Accent color swap
  if (el.accentColor && isColorMatchingAccent(el.accentColor, prevPal)) {
    patch.accentColor = newAccent;
  }

  // 2. Text / Primary Color swap (Fixes text headline bug)
  if (el.color && isColorMatchingAccent(el.color, prevPal)) {
    patch.color = newAccent;
  }

  // 3. Badge Element specific handling
  if (el.type === 'badge') {
    if (el.bgColor && isColorMatchingAccent(el.bgColor, prevPal)) {
      patch.bgColor = newAccent;
      patch.color = getContrastTextColor(newAccent);
    }
  }

  // 4. Highlight-Box & RGBA Tint Glass overlays
  if (el.type === 'highlight-box' || el.type === 'quote-box' || (el.bgColor && el.bgColor.startsWith('rgba'))) {
    const bgStr = el.bgColor || '';
    if (
      bgStr.includes('190, 255, 1') ||
      bgStr.includes('190,255,1') ||
      bgStr.includes('255, 215, 0') ||
      bgStr.includes('255,215,0') ||
      bgStr.includes('0, 212, 255') ||
      bgStr.includes('0,212,255') ||
      bgStr.includes('255, 59, 48') ||
      bgStr.includes('255,59,48')
    ) {
      // Extract original opacity
      const alphaMatch = bgStr.match(/[\d.]+\s*\)$/);
      const alpha = alphaMatch ? parseFloat(alphaMatch[0]) : 0.08;
      patch.bgColor = hexToRgba(newAccent, Math.min(0.25, Math.max(0.04, alpha)));
    }
    if (el.accentColor && isColorMatchingAccent(el.accentColor, prevPal)) {
      patch.accentColor = newAccent;
    }
    if (el.stroke && isColorMatchingAccent(el.stroke, prevPal)) {
      patch.stroke = newAccent;
    }
  }

  // 5. Divider & Stroke
  if (el.stroke && isColorMatchingAccent(el.stroke, prevPal)) {
    patch.stroke = newAccent;
  }

  // 6. Fill (Shapes / Icons)
  if (el.fill && isColorMatchingAccent(el.fill, prevPal)) {
    patch.fill = newAccent;
  }

  // 7. Audio Waveform & Lottie
  if (el.type === 'audio-waveform') {
    patch.waveformColor = newAccent;
    patch.waveformSecondaryColor = newSurface;
    patch.accentColor = newAccent;
  } else if (el.type === 'lottie') {
    patch.accentColor = newAccent;
  }

  // 8. Charts & Graphs
  if ([
    'gauge-chart', 'circle-chart', 'chart-bar', 'radar-chart', 'candlestick-chart',
    'pie-chart', 'network-graph', 'racing-bar-chart', 'heatmap-matrix',
    'waterfall-chart', 'sankey-chart', 'tree-diagram', 'line-chart'
  ].includes(el.type)) {
    patch.accentColor = newAccent;
    if (el.chartData && Array.isArray(el.chartData) && el.chartData.length > 0) {
      patch.chartData = el.chartData.map((d, i) =>
        i === 0 || isColorMatchingAccent(d.color, prevPal)
          ? { ...d, color: newAccent }
          : d
      );
    }
    if (el.racingBarData && Array.isArray(el.racingBarData.bars) && el.racingBarData.bars.length > 0) {
      patch.racingBarData = {
        ...el.racingBarData,
        bars: el.racingBarData.bars.map((b, i) =>
          i === 0 || isColorMatchingAccent(b.color, prevPal)
            ? { ...b, color: newAccent }
            : b
        )
      };
    }
    if (el.networkNodes && Array.isArray(el.networkNodes) && el.networkNodes.length > 0) {
      patch.networkNodes = el.networkNodes.map((n, i) =>
        i === 0 || isColorMatchingAccent(n.color, prevPal)
          ? { ...n, color: newAccent }
          : n
      );
    }
  }

  // 9. Infographics & Compound Structures
  if (el.type === 'master-hook' && el.hookData) {
    patch.accentColor = newAccent;
    const curBadgeBg = el.hookData.badgeBgColor;
    const newBadgeBg = isColorMatchingAccent(curBadgeBg, prevPal) ? newAccent : curBadgeBg;
    patch.hookData = {
      ...el.hookData,
      accentColor: newAccent,
      badgeBgColor: newBadgeBg,
      badgeTextColor: newBadgeBg ? getContrastTextColor(newBadgeBg) : el.hookData.badgeTextColor,
    };
  }

  if (el.type === 'flowchart' && Array.isArray(el.flowSteps) && el.flowSteps.length > 0) {
    patch.accentColor = newAccent;
    patch.flowSteps = el.flowSteps.map((s, i) =>
      i === 0 || isColorMatchingAccent(s.color, prevPal)
        ? { ...s, color: newAccent }
        : s
    );
  }

  if (el.type === 'pyramid-funnel' && Array.isArray(el.pyramidLayers) && el.pyramidLayers.length > 0) {
    patch.accentColor = newAccent;
    patch.pyramidLayers = el.pyramidLayers.map((l, i) =>
      i === 0 || isColorMatchingAccent(l.color, prevPal)
        ? { ...l, color: newAccent }
        : l
    );
  }

  if (el.type === 'dynamic-diagram' && el.diagramData) {
    patch.accentColor = newAccent;
    patch.diagramData = {
      ...el.diagramData,
      nodes: el.diagramData.nodes.map((n, i) =>
        i === 0 || isColorMatchingAccent(n.color, prevPal)
          ? { ...n, color: newAccent }
          : n
      )
    };
  }

  // 10. Motion Widgets & Social Callouts
  if (el.calloutData) patch.calloutData = { ...el.calloutData, accentColor: newAccent };
  if (el.docData) patch.docData = { ...el.docData, accentColor: newAccent };
  if (el.searchData) patch.searchData = { ...el.searchData, accentColor: newAccent };
  if (el.notificationData) patch.notificationData = { ...el.notificationData, accentColor: newAccent };
  if (el.frameData) patch.frameData = { ...el.frameData, accentColor: newAccent };
  if (el.breathingData) patch.breathingData = { ...el.breathingData, accentColor: newAccent };
  if (el.vinylData) patch.vinylData = { ...el.vinylData, accentColor: newAccent };

  if (el.type === 'hand-drawn') {
    patch.stroke = newAccent;
    patch.color = newAccent;
  }

  return { ...el, ...patch };
}

/**
 * Hydrates a single template scene with canonical palette tokens and normalization
 */
export function hydrateTemplateScene(
  scene: Scene,
  paletteId: string,
  templateAccent?: string
): Scene {
  const palette = resolveThemePalette(paletteId);
  const targetAccent = templateAccent || palette.tokens.accent;

  const hydratedElements = (scene.elements || []).map((el) => {
    const patch: Partial<SceneElement> = {
      paletteId: palette.id,
    };

    // Normalize badge
    if (el.type === 'badge') {
      const curBg = (el.bgColor || '').toLowerCase();
      if (curBg === (templateAccent || '').toLowerCase() || curBg === '#beff01' || curBg === '#ffd700' || curBg === '#00d4ff') {
        patch.bgColor = targetAccent;
        patch.color = getContrastTextColor(targetAccent);
      }
    }

    // Normalize highlight box tint
    if (el.type === 'highlight-box' && el.bgColor?.startsWith('rgba')) {
      const alphaMatch = el.bgColor.match(/[\d.]+\s*\)$/);
      const alpha = alphaMatch ? parseFloat(alphaMatch[0]) : 0.08;
      patch.bgColor = hexToRgba(targetAccent, Math.min(0.25, Math.max(0.04, alpha)));
      patch.accentColor = targetAccent;
    }

    return { ...el, ...patch };
  });

  return {
    ...scene,
    paletteId: palette.id,
    bgColor: isLegacySceneBg(scene.bgColor) ? palette.tokens.bg : scene.bgColor,
    bgPattern: scene.bgPattern || 'none',
    elements: hydratedElements,
  };
}

/**
 * Hydrates an entire array of template scenes before pushing into editor state
 */
export function hydrateTemplateScenes(
  scenes: Scene[],
  template: VideoTemplateItem
): Scene[] {
  const paletteId = resolveTemplatePaletteId(template);
  const templateAccent = template.accentColor;

  return scenes.map((sc) => hydrateTemplateScene(sc, paletteId, templateAccent));
}
