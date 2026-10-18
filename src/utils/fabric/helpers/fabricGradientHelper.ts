import * as fabric from 'fabric';

/**
 * Parses CSS linear-gradient string to Fabric.js Gradient instance
 * Example inputs:
 * - "linear-gradient(180deg, #0d1117 0%, #161b22 100%)"
 * - "linear-gradient(135deg, rgba(20,20,30,1) 0%, #000000 100%)"
 * - "linear-gradient(to bottom, #111, #333)"
 */
export function parseCssGradientToFabric(
  cssGradient: string,
  width = 360,
  height = 640
): fabric.Gradient<'linear'> | null {
  if (!cssGradient || typeof cssGradient !== 'string' || !cssGradient.includes('gradient')) {
    return null;
  }

  try {
    const raw = cssGradient.trim();
    let angleDeg = 180;

    const innerMatch = raw.match(/linear-gradient\s*\(([\s\S]*)\)/i);
    if (!innerMatch) return null;
    const inner = innerMatch[1].trim();

    const firstCommaIdx = inner.indexOf(',');
    if (firstCommaIdx === -1) return null;

    const firstToken = inner.slice(0, firstCommaIdx).trim();
    let stopsPart = inner;

    const angleMatch = firstToken.match(/^(-?\d+(?:\.\d+)?)deg$/i);
    const isDirection = /^to\s+/i.test(firstToken);

    if (angleMatch) {
      angleDeg = parseFloat(angleMatch[1]);
      stopsPart = inner.slice(firstCommaIdx + 1).trim();
    } else if (isDirection) {
      const dir = firstToken.toLowerCase();
      if (dir === 'to top') angleDeg = 0;
      else if (dir === 'to right') angleDeg = 90;
      else if (dir === 'to bottom') angleDeg = 180;
      else if (dir === 'to left') angleDeg = 270;
      else if (dir === 'to top right' || dir === 'to right top') angleDeg = 45;
      else if (dir === 'to bottom right' || dir === 'to right bottom') angleDeg = 135;
      else if (dir === 'to bottom left' || dir === 'to left bottom') angleDeg = 225;
      else if (dir === 'to top left' || dir === 'to left top') angleDeg = 315;
      stopsPart = inner.slice(firstCommaIdx + 1).trim();
    }

    // Convert CSS angle (0deg = up, 90deg = right, 180deg = down) to radians
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const halfW = width / 2;
    const halfH = height / 2;

    const x1 = halfW - cos * halfW;
    const y1 = halfH - sin * halfH;
    const x2 = halfW + cos * halfW;
    const y2 = halfH + sin * halfH;

    // Extract color stops: handles hex, rgb(), rgba(), and percentage/decimal offsets
    const colorStopRegex = /(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|[a-zA-Z]+)\s*(\d+%)?/gi;
    const matches = Array.from(stopsPart.matchAll(colorStopRegex));

    if (matches.length < 2) {
      return null;
    }

    const colorStops: { offset: number; color: string }[] = [];
    matches.forEach((m, idx) => {
      const color = m[1];
      let offset: number;
      if (m[2]) {
        offset = parseFloat(m[2].replace('%', '')) / 100;
      } else {
        offset = idx / (matches.length - 1);
      }
      colorStops.push({ offset: Math.max(0, Math.min(1, offset)), color });
    });

    return new fabric.Gradient({
      type: 'linear',
      coords: { x1, y1, x2, y2 },
      colorStops,
    });
  } catch (err) {
    console.warn('parseCssGradientToFabric error, fallback to solid color:', err);
    return null;
  }
}
