import { MAX_SHORT_VIDEO_SEC } from '../../src/config/planCatalog.js';
import { maxSceneCount } from '../../src/config/pacingConfig.js';
import { AppError } from './AppError.js';

/**
 * Kẹp độ dài & số cảnh của một yêu cầu AI tạo video theo gói (req.aiUser.maxVideoSec do checkAiQuota gắn)
 * và trần video short. Video dài hơn gói → lỗi 403 thay vì tốn token tạo video không xuất được.
 */
export function resolveAiVideoLimits(aiUser, { durationSec, sceneCount }) {
  const maxSec = Math.min(Number(aiUser?.maxVideoSec) || MAX_SHORT_VIDEO_SEC, MAX_SHORT_VIDEO_SEC);
  const sec = Math.round(Number(durationSec) || 0);
  if (sec > maxSec) {
    throw new AppError({
      code: 'AI_VIDEO_TOO_LONG',
      statusCode: 403,
      domain: 'validation',
      technicalMessage: `Requested ${sec}s exceeds plan limit ${maxSec}s`,
      userMessage: `Gói hiện tại tạo video tối đa ${maxSec} giây (bạn chọn ${sec} giây).`,
      actionHint: 'Chọn độ dài ngắn hơn hoặc nâng cấp gói.',
    });
  }
  const maxScenes = maxSceneCount(sec || maxSec);
  const n = Math.round(Number(sceneCount) || 0);
  return { maxSec, sceneCount: n > 0 ? Math.min(n, maxScenes) : n };
}
