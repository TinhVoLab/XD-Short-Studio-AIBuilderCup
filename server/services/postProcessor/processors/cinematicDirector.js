/**
 * Từ khoá động lực học (Kinetic Typography), nền & HUD của cảnh.
 * Camera & transition do planCinematics() (src/config/cinematicRules.js) quyết định cho cả chuỗi cảnh.
 */
import { isPeakScene } from '../../../../src/config/sceneRoles.js';

export function resolveCinematicDirectives(scene, context = {}) {
  const { temporalRole = 'normal', prompt = '', isZenOrChill = false, textPoolSource = '', beat } = context;

  // 1. Kinetic Background Word
  const textPool = (textPoolSource || '').replace(/[.,!?]/g, '').split(' ').filter(w => w.length > 3);
  const kineticBgWord = textPool.sort((a, b) => b.length - a.length)[0]?.toUpperCase() || 'XD-SHORT';

  // 2. Background Pattern & Color Inversion
  const colorInverted = isPeakScene(temporalRole);
  let finalBgPattern = scene.bgPattern || (isZenOrChill ? 'dots' : 'grid');
  if (isPeakScene(temporalRole)) finalBgPattern = 'mesh';
  if (isZenOrChill && temporalRole === 'normal') finalBgPattern = 'noise';
  // Nhịp giữ chân đổi nền để cảnh nhìn khác hẳn cảnh trước; cao trào (mesh) vẫn giữ ưu tiên
  if (beat && !isPeakScene(temporalRole)) {
    if (beat.kind === 'rehook') finalBgPattern = isZenOrChill ? 'dots' : 'speed-lines';
    if (beat.kind === 'payoff') finalBgPattern = isZenOrChill ? 'noise' : 'topo-contour';
  }

  // 3. HUD Meta Headers
  const hudHeader = scene.hudHeader || `-- ${prompt.slice(0, 20).toUpperCase()} . 2026 --`;
  const hudFooterLeft = scene.hudFooterLeft || `${prompt.slice(0, 15).toUpperCase()} | Cảnh {index}`;
  const hudFooterRight = scene.hudFooterRight || `{page}/{total} REV 2026.08`;
  const authorName = scene.authorName || 'By Tech Director';

  // Cảnh hook: pattern nền lùi xuống để hero là thứ duy nhất sáng (Fabric đọc cùng bgPatternOpacity)
  const bgPatternOpacity = scene.bgPatternOpacity ?? (temporalRole === 'hook' ? 0.45 : undefined);

  return {
    kineticBgWord,
    colorInverted,
    bgPattern: finalBgPattern,
    bgPatternOpacity,
    hudHeader,
    hudFooterLeft,
    hudFooterRight,
    authorName,
  };
}
