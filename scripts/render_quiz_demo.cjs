const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');
const { bundle } = require('@remotion/bundler');
const { renderMedia, selectComposition } = require('@remotion/renderer');

async function renderQuizDemo() {
  console.log('🎬 Bắt đầu render video Demo Interactive Quiz...');

  const artifactDir = '/Users/tinhvo/.gemini/antigravity/brain/8217b38a-2212-4aca-9015-9446c798b0fd';
  const publicDir = path.resolve(__dirname, '../public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  const outputMp4 = path.join(publicDir, 'quiz_demo.mp4');
  const artifactMp4 = path.join(artifactDir, 'quiz_demo.mp4');

  console.log('⏳ Bước 1: Bundle Webpack Remotion...');
  const bundled = await bundle(path.resolve(__dirname, '../src/remotion/index.ts'), () => undefined, {
    webpackOverride: (config) => {
      config.resolve = config.resolve || {};
      config.resolve.alias = { ...config.resolve.alias, '@': path.resolve(__dirname, '../src') };
      return config;
    },
  });

  const scenes = [
    {
      id: 'quiz-scene-demo',
      name: 'Interactive Quiz Demo',
      duration: 6, // 6 seconds @ 30fps = 180 frames
      bgColor: '#070B12',
      bgPattern: 'grid',
      elements: [
        {
          id: 'title-badge',
          type: 'badge',
          left: 180,
          top: 80,
          width: 220,
          height: 32,
          bgColor: 'rgba(190, 255, 1, 0.15)',
          color: '#BEFF01',
          content: 'THỬ THÁCH 5S - KHOA HỌC',
          radius: 8,
          fontSize: 12,
          fontWeight: 800,
          animPreset: 'fade-in',
        },
        {
          id: 'demo-quiz',
          type: 'interactive-quiz',
          left: 180,
          top: 230,
          width: 330,
          height: 330,
          quizData: {
            quizType: 'single-choice',
            badge: 'KHOA HỌC TỰ NHIÊN',
            question: 'Kim loại nào sau đây có độ dẫn điện tốt nhất?',
            options: [
              { id: 'A', text: 'Nhôm (Al)' },
              { id: 'B', text: 'Đồng (Cu)' },
              { id: 'C', text: 'Bạc (Ag)' },
              { id: 'D', text: 'Vàng (Au)' },
            ],
            correctAnswers: ['C'],
            introSec: 2,       // 0s - 2s: Đọc đề
            countdownSec: 3,   // 2s - 5s: Đếm ngược 3..2..1
            revealSec: 1,      // 5s - 6s: Lật mở đáp án đúng
            explanation: 'Bạc (Ag) dẫn điện tốt nhất trong các kim loại, tiếp theo là Đồng, Vàng và Nhôm.',
            showExplanation: true,
            layoutVariant: 'stacked',
          },
          animPreset: 'zoom-in',
        },
      ],
    },
  ];

  const totalFrames = 180;
  const inputProps = { scenes, durationInFrames: totalFrames, bgMusicVolume: 0 };

  console.log('⏳ Bước 2: Chọn Composition MotionStudio...');
  const composition = await selectComposition({
    serveUrl: bundled,
    id: 'MotionStudio',
    inputProps,
  });

  console.log('⏳ Bước 3: Render 1080p Video MP4...');
  await renderMedia({
    composition,
    serveUrl: bundled,
    codec: 'h264',
    outputLocation: outputMp4,
    inputProps,
    concurrency: 4,
    scale: 3, // 360x640 -> 1080x1920
    pixelFormat: 'yuv420p',
    enforceAudioTrack: false,
    verbose: false,
  });

  console.log(`✓ Đã xuất video tại: ${outputMp4}`);

  // Copy to artifacts dir
  fs.copyFileSync(outputMp4, artifactMp4);
  console.log(`✓ Đã copy sang Artifacts: ${artifactMp4}`);

  // Extract screenshots
  console.log('⏳ Bước 4: Trích xuất ảnh chụp từng giai đoạn bằng ffmpeg...');
  const frame1 = path.join(artifactDir, 'quiz_phase1_reading.png');
  const frame2 = path.join(artifactDir, 'quiz_phase2_countdown.png');
  const frame3 = path.join(artifactDir, 'quiz_phase3_reveal.png');

  execSync(`ffmpeg -y -ss 00:00:01.200 -i "${outputMp4}" -vframes 1 "${frame1}"`);
  execSync(`ffmpeg -y -ss 00:00:03.500 -i "${outputMp4}" -vframes 1 "${frame2}"`);
  execSync(`ffmpeg -y -ss 00:00:05.500 -i "${outputMp4}" -vframes 1 "${frame3}"`);

  console.log('✓ Hoàn tất trích xuất 3 khung hình minh họa!');
}

renderQuizDemo().catch(err => {
  console.error('Lỗi render:', err);
  process.exit(1);
});
