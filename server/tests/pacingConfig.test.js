import assert from 'assert/strict';
import {
  SPEECH_RATE_WPS,
  DURATION_BOUNDS,
  VOICE_GAP_SEC,
  countWords,
  estimateSpeechSec,
  estimateSceneDurationSec,
  fitSceneDurationToAudio,
} from '../../src/config/pacingConfig.js';

console.log('🧪 pacingConfig SSOT...');

// 1. Đếm từ bỏ qua khoảng trắng thừa
assert.equal(countWords('  Một   hai\nba  '), 3);
assert.equal(countWords(''), 0);
assert.equal(countWords(undefined), 0);

// 2. Ước tính đọc theo tốc độ SSOT
const twentyEightWords = Array.from({ length: 28 }, () => 'từ').join(' ');
assert.equal(estimateSpeechSec(twentyEightWords), Math.round((28 / SPEECH_RATE_WPS.vi) * 10) / 10);

// 3. Thời lượng cảnh trước TTS luôn nằm trong [MIN, MAX]
assert.equal(estimateSceneDurationSec(''), DURATION_BOUNDS.MIN_SEC);
const veryLong = Array.from({ length: 400 }, () => 'từ').join(' ');
assert.equal(estimateSceneDurationSec(veryLong), DURATION_BOUNDS.MAX_SEC);

// 4. Sau TTS: phần đệm luôn >= transition + khoảng lặng, để giọng hai cảnh không chồng nhau
for (const transitionSec of [0, 0.3, 0.5, 0.8]) {
  const fit = fitSceneDurationToAudio(4.0, transitionSec);
  const tail = Math.round((fit - 4.0) * 10) / 10;
  assert.ok(tail >= DURATION_BOUNDS.SAFETY_PADDING_SEC, `tail ${tail} < padding`);
  assert.ok(tail + 1e-9 >= transitionSec + VOICE_GAP_SEC, `tail ${tail} không phủ transition ${transitionSec}`);
}

// 5. Audio rất ngắn vẫn giữ mức sàn
assert.equal(fitSceneDurationToAudio(0.5, 0), DURATION_BOUNDS.ABSOLUTE_AUDIO_MIN_SEC);

console.log('✅ pacingConfig: all assertions passed');
