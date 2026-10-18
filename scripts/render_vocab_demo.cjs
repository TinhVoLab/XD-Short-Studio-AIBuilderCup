const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { bundle } = require('@remotion/bundler');
const { renderMedia, selectComposition } = require('@remotion/renderer');

async function renderVocabDemo() {
  console.log('🎬 Bắt đầu render video Demo Vocab Card...');

  const artifactDir = '/Users/tinhvo/.gemini/antigravity/brain/8217b38a-2212-4aca-9015-9446c798b0fd';
  const publicDir = path.resolve(__dirname, '../public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  const outputMp4 = path.join(publicDir, 'vocab_demo.mp4');
  const artifactMp4 = path.join(artifactDir, 'vocab_demo.mp4');

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
      id: 'vocab-scene-demo',
      name: 'Vocabulary Flashcard Demo',
      duration: 8, // 8 seconds @ 30fps = 240 frames
      bgColor: '#080C16',
      bgPattern: 'grid',
      elements: [
        {
          id: 'title-badge',
          type: 'badge',
          left: 180,
          top: 60,
          width: 220,
          height: 32,
          bgColor: 'rgba(255, 184, 0, 0.15)',
          color: '#FFB800',
          content: 'IELTS 7.0+ VOCABULARY',
          radius: 8,
          fontSize: 12,
          fontWeight: 800,
          animPreset: 'fade-in',
        },
        {
          id: 'demo-vocab',
          type: 'vocab-card',
          left: 180,
          top: 130,
          width: 330,
          height: 400,
          accentColor: '#FFB800',
          vocabData: {
            word: 'CRUCIAL',
            partOfSpeech: 'adj',
            ipa: '/ˈkruː.ʃəl/',
            audioAccent: 'UK',
            cefrLevel: 'IELTS 7.0+',
            meaningVi: 'Cực kỳ quan trọng, có tính quyết định',
            meaningEn: 'Extremely important or necessary',
            exampleEn: 'Regular exercise plays a crucial role in maintaining good health.',
            exampleVi: 'Tập thể dục đều đặn đóng vai trò cực kỳ quan trọng đối với sức khỏe.',
            highlightWord: 'crucial role',
            synonyms: ['Essential', 'Vital', 'Pivotal'],
            collocations: ['play a crucial role', 'crucial decision'],
            introSec: 2.5,
            meaningSec: 2.5,
            exampleSec: 3.0,
          },
          animPreset: 'zoom-in',
        },
      ],
    },
  ];

  const totalFrames = 240;
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

  // Extract screenshots: Phase 1 (1.2s), Phase 2 (3.5s), Phase 3 (6.5s)
  console.log('⏳ Bước 4: Trích xuất ảnh chụp từng giai đoạn bằng ffmpeg...');
  const frame1 = path.join(artifactDir, 'vocab_phase1_pronounce.png');
  const frame2 = path.join(artifactDir, 'vocab_phase2_meaning.png');
  const frame3 = path.join(artifactDir, 'vocab_phase3_example.png');

  execSync(`ffmpeg -y -ss 00:00:01.200 -i "${outputMp4}" -vframes 1 "${frame1}"`);
  execSync(`ffmpeg -y -ss 00:00:03.500 -i "${outputMp4}" -vframes 1 "${frame2}"`);
  execSync(`ffmpeg -y -ss 00:00:06.500 -i "${outputMp4}" -vframes 1 "${frame3}"`);

  console.log('✓ Hoàn tất trích xuất 3 khung hình minh họa!');
}

renderVocabDemo().catch(err => {
  console.error('Lỗi render:', err);
  process.exit(1);
});
