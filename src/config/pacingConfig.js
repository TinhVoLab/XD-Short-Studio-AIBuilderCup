/**
 * SSOT nhịp đọc & thời lượng cảnh — dùng chung cho client (hydrator, normalizer, TTS)
 * và server (prompt word-budget, postProcessor). Không khai báo lại các hằng số này ở nơi khác.
 */

/** Tốc độ đọc (từ/giây) của giọng TTS. Tiếng Việt: mỗi âm tiết tính là 1 từ. */
export const SPEECH_RATE_WPS = {
  vi: 2.8,
  en: 2.6,
  default: 2.8,
};

export const DURATION_BOUNDS = {
  MIN_SEC: 2.5,
  MAX_SEC: 15.0,
  /** Khoảng thở sau câu thoại trước khi sang cảnh mới */
  SAFETY_PADDING_SEC: 0.4,
  ABSOLUTE_AUDIO_MIN_SEC: 2.0,
};

/** Thời lượng trung bình ngắn nhất của một cảnh khi AI chia kịch bản — chặn số cảnh vô lý so với độ dài video */
export const MIN_AVG_SCENE_SEC = 4;

/** Số cảnh tối đa AI được tạo cho một video dài durationSec giây */
export function maxSceneCount(durationSec) {
  return Math.max(1, Math.ceil((Number(durationSec) || 0) / MIN_AVG_SCENE_SEC));
}

/** Khoảng lặng tối thiểu giữa giọng cảnh trước và giọng cảnh sau, tính sau khi trừ transition gối đầu */
export const VOICE_GAP_SEC = 0.2;

/** Độ dài transition mặc định khi scene.transition.duration không được khai báo */
export const DEFAULT_TRANSITION_SEC = 0.5;

export function countWords(text) {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Thời lượng đọc ước tính (chưa cộng padding), làm tròn 0.1s */
export function estimateSpeechSec(text, lang = 'vi') {
  const rate = SPEECH_RATE_WPS[lang] || SPEECH_RATE_WPS.default;
  return Math.round((countWords(text) / rate) * 10) / 10;
}

/** Thời lượng cảnh trước khi có TTS: đọc + padding, kẹp trong [MIN_SEC, MAX_SEC] */
export function estimateSceneDurationSec(text, lang = 'vi') {
  const raw = estimateSpeechSec(text, lang) + DURATION_BOUNDS.SAFETY_PADDING_SEC;
  return Math.min(DURATION_BOUNDS.MAX_SEC, Math.max(DURATION_BOUNDS.MIN_SEC, Math.round(raw * 10) / 10));
}

/**
 * Thời lượng cảnh sau khi có audio thật. TransitionSeries gối đầu cảnh kế tiếp đúng bằng
 * transitionSec, nên phần đệm phải lớn hơn transition để hai giọng đọc không chồng lên nhau.
 */
export function fitSceneDurationToAudio(audioSec, transitionSec = 0) {
  const tail = Math.max(DURATION_BOUNDS.SAFETY_PADDING_SEC, transitionSec + VOICE_GAP_SEC);
  return Math.max(DURATION_BOUNDS.ABSOLUTE_AUDIO_MIN_SEC, Math.round((audioSec + tail) * 10) / 10);
}

/**
 * Nghịch đảo của fitSceneDurationToAudio: khoảng thời gian giọng đọc thực sự chiếm trong cảnh.
 * Dùng để ước lượng word timeline khi TTS không trả timestamps.
 */
export function speechSpanForScene(sceneDurationSec, transitionSec = 0) {
  const tail = Math.max(DURATION_BOUNDS.SAFETY_PADDING_SEC, transitionSec + VOICE_GAP_SEC);
  return Math.max(0.5, Math.round((sceneDurationSec - tail) * 100) / 100);
}
