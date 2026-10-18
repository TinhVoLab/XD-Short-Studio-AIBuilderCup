import { FormulaFrame, RenderStyle } from './types';

export const applyRenderStyle = (
  frame: FormulaFrame,
  style: RenderStyle
): FormulaFrame => {
  const newFrame: FormulaFrame = {
    paths: [...frame.paths],
    particles: [...frame.particles],
  };

  switch (style) {
    case 'neon-cyber':
      // Hào quang Neon: Đậm nét + Filter phát sáng
      newFrame.paths = newFrame.paths.map((p) => ({
        ...p,
        strokeWidth: p.strokeWidth * 1.4,
        filter: 'url(#xd-neon-glow)',
      }));
      newFrame.particles = newFrame.particles.map((p) => ({
        ...p,
        filter: 'url(#xd-neon-glow)',
      }));
      break;

    case 'minimal-hairline':
      // Bauhaus / Apple: Nét cực mảnh (0.8px), độ trong suốt cao, không phát sáng
      newFrame.paths = newFrame.paths.map((p) => ({
        ...p,
        strokeWidth: 0.8,
        opacity: (p.opacity || 1) * 0.75,
        filter: undefined,
      }));
      newFrame.particles = newFrame.particles.map((p) => ({
        ...p,
        r: Math.max(1, p.r * 0.6),
        opacity: (p.opacity || 1) * 0.8,
        filter: undefined,
      }));
      break;

    case 'hologram-radar': {
      // Hologram Radar: Nét đứt đoạn + Khung ngắm radar tròn và trục chữ thập
      newFrame.paths = newFrame.paths.map((p) => ({
        ...p,
        strokeDasharray: '3 2',
        opacity: (p.opacity || 1) * 0.85,
        strokeWidth: p.strokeWidth * 0.9,
      }));

      // Thêm vòng tròn radar mờ và trục ngắm tọa độ
      newFrame.paths.unshift({
        d: 'M 50 10 A 40 40 0 1 1 50 90 A 40 40 0 1 1 50 10 M 10 50 L 90 50 M 50 10 L 50 90',
        stroke: 'rgba(0, 242, 254, 0.25)',
        strokeWidth: 0.6,
        strokeDasharray: '2 4',
        fill: 'none',
        opacity: 0.5,
      });
      break;
    }

    case 'blueprint-cad': {
      // Bản vẽ CAD: Nét kỹ thuật sắc nét + Dấu góc kỹ thuật (Corner registration ticks)
      newFrame.paths = newFrame.paths.map((p) => ({
        ...p,
        strokeWidth: 1.0,
        opacity: 0.95,
        filter: undefined,
      }));
      newFrame.particles = newFrame.particles.map((p) => ({
        ...p,
        r: Math.max(1.4, p.r * 0.75),
        opacity: 1,
      }));

      // Thêm 4 dấu góc CAD (Corner L-brackets)
      newFrame.paths.unshift({
        d: 'M 10 16 L 10 10 L 16 10 M 84 10 L 90 10 L 90 16 M 10 84 L 10 90 L 16 90 M 84 90 L 90 90 L 90 84',
        stroke: 'rgba(255, 255, 255, 0.4)',
        strokeWidth: 0.8,
        fill: 'none',
        opacity: 0.6,
      });
      break;
    }
  }

  return newFrame;
};
